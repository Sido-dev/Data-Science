"""Authenticated, opt-in workspace backup and validated curriculum publishing."""
import hashlib
import hmac
import json
import os
import re
import secrets
import threading
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from ..database import Base, get_db

router = APIRouter(tags=["Learning workspace"])

class LearningAccount(Base):
    __tablename__ = "learning_accounts_v2"
    id = Column(Integer, primary_key=True)
    username = Column(String(40), unique=True, nullable=False)
    password_hash = Column(String(256), nullable=False)

class LearningSession(Base):
    __tablename__ = "learning_sessions_v2"
    token_hash = Column(String(64), primary_key=True)
    account_id = Column(Integer, ForeignKey("learning_accounts_v2.id"), nullable=False)
    expires_at = Column(DateTime, nullable=False)

class WorkspaceBackup(Base):
    __tablename__ = "workspace_backups_v2"
    account_id = Column(Integer, ForeignKey("learning_accounts_v2.id"), primary_key=True)
    data = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class PublishedContent(Base):
    __tablename__ = "published_content_v2"
    id = Column(Integer, primary_key=True)
    data = Column(Text, nullable=False)

class Credentials(BaseModel):
    username: str = Field(min_length=3, max_length=40, pattern=r"^[A-Za-z0-9_]+$")
    password: str = Field(min_length=12, max_length=128)

class BackupInput(BaseModel):
    workspace: dict

# Small deployments run one worker. Use a shared edge rate limiter before scaling.
_attempts = defaultdict(deque)
_attempts_lock = threading.Lock()
def throttle(request: Request, username: str):
    now = time.monotonic()
    ip = request.client.host if request.client else "unknown"
    with _attempts_lock:
        for key in list(_attempts):
            if not _attempts[key] or _attempts[key][-1] < now - 300:
                del _attempts[key]
        keys = ["ip:" + ip, "account:" + username.lower()]
        for key in keys:
            queue = _attempts[key]
            while queue and queue[0] < now - 300:
                queue.popleft()
            if len(queue) >= 20:
                raise HTTPException(429, "Too many attempts. Please wait five minutes.")
        for key in keys:
            _attempts[key].append(now)

def hash_password(password: str, salt=None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 600_000).hex()
    return salt + ":" + digest

_DUMMY = hash_password("unused-timing-comparison")
def verify_password(password, stored):
    salt = stored.split(":", 1)[0]
    return hmac.compare_digest(hash_password(password, salt), stored)

def issue_session(db, account):
    now = datetime.utcnow()
    db.query(LearningSession).filter(LearningSession.expires_at < now).delete()
    token = secrets.token_urlsafe(48)
    db.add(LearningSession(token_hash=hashlib.sha256(token.encode()).hexdigest(), account_id=account.id, expires_at=now + timedelta(days=7)))
    db.commit()
    return {"token": token, "username": account.username}

def session_for(authorization: str = Header(default=""), db: Session = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Please sign in to use cloud backup.")
    token_hash = hashlib.sha256(authorization[7:].encode()).hexdigest()
    session = db.get(LearningSession, token_hash)
    if not session or session.expires_at < datetime.utcnow():
        raise HTTPException(401, "Your session has expired. Sign in again.")
    return session

@router.post("/auth/register", status_code=201)
def register(credentials: Credentials, request: Request, db: Session = Depends(get_db)):
    throttle(request, credentials.username)
    account = LearningAccount(username=credentials.username.lower(), password_hash=hash_password(credentials.password))
    db.add(account)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "That username is unavailable. Choose another one.")
    db.refresh(account)
    return issue_session(db, account)

@router.post("/auth/login")
def login(credentials: Credentials, request: Request, db: Session = Depends(get_db)):
    throttle(request, credentials.username)
    account = db.query(LearningAccount).filter_by(username=credentials.username.lower()).first()
    correct = verify_password(credentials.password, account.password_hash if account else _DUMMY)
    if not account or not correct:
        raise HTTPException(401, "Username or password is incorrect.")
    return issue_session(db, account)

@router.post("/auth/logout")
def logout(session=Depends(session_for), db: Session = Depends(get_db)):
    db.delete(session)
    db.commit()
    return {"ok": True}

def validate_workspace(value):
    if not isinstance(value, dict) or len(json.dumps(value)) > 1_500_000 or value.get("version") != 2:
        return False
    profile = value.get("profile", {})
    if not isinstance(profile, dict) or not isinstance(profile.get("name"), str) or len(profile["name"]) > 80 or profile.get("track") not in ("analyst", "scientist") or profile.get("hours") not in (3, 5, 10) or profile.get("level") not in ("beginner", "some") or not isinstance(profile.get("onboarded"), bool):
        return False
    if not all(isinstance(value.get(k), dict) for k in ("completed", "notes", "answers", "milestones", "drafts")):
        return False
    def date_ok(v):
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
            return True
        except (TypeError, ValueError, AttributeError):
            return False
    if not all(date_ok(v) for v in value["completed"].values()):
        return False
    if not all(isinstance(v, str) and len(v) <= 20_000 for k in ("notes", "drafts") for v in value[k].values()):
        return False
    if not all(isinstance(v, dict) and type(v.get("choice")) is int and isinstance(v.get("correct"), bool) for v in value["answers"].values()):
        return False
    if not all(isinstance(v, bool) for v in value["milestones"].values()):
        return False
    activity = value.get("activity")
    return isinstance(activity, list) and len(activity) <= 500 and all(isinstance(a, dict) and isinstance(a.get("label"), str) and date_ok(a.get("at")) for a in activity)

@router.get("/progress")
def get_progress(session=Depends(session_for), db: Session = Depends(get_db)):
    backup = db.get(WorkspaceBackup, session.account_id)
    return {"workspace": json.loads(backup.data) if backup else None, "updated_at": backup.updated_at.isoformat() + "Z" if backup else None}

@router.put("/progress")
def save_progress(payload: BackupInput, session=Depends(session_for), db: Session = Depends(get_db)):
    if not validate_workspace(payload.workspace):
        raise HTTPException(422, "Invalid or oversized workspace backup.")
    backup = db.get(WorkspaceBackup, session.account_id)
    if not backup:
        backup = WorkspaceBackup(account_id=session.account_id)
        db.add(backup)
    backup.data = json.dumps(payload.workspace)
    backup.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True, "updated_at": backup.updated_at.isoformat() + "Z"}

def validate_content(c):
    def strings(v):
        return isinstance(v, list) and len(v) > 0 and all(isinstance(x, str) and x for x in v)
    def url(v):
        from urllib.parse import urlparse
        try:
            parsed = urlparse(v)
            return parsed.scheme == "https" and bool(parsed.netloc)
        except (ValueError, TypeError, AttributeError):
            return False
    if not isinstance(c, dict) or len(json.dumps(c)) > 1_500_000:
        return False
    for key in ("modules", "questions", "projects", "exercises"):
        rows = c.get(key)
        if not isinstance(rows, list) or not 0 < len(rows) <= 500 or not all(isinstance(x, dict) and isinstance(x.get("id"), str) and re.fullmatch(r"[a-z0-9-]+", x["id"]) for x in rows) or len({x["id"] for x in rows}) != len(rows):
            return False
    seen = set()
    for m in c["modules"]:
        if not all(isinstance(m.get(k), str) and m[k] for k in ("title", "phase", "summary")) or m.get("track") not in ("both", "analyst", "scientist") or type(m.get("hours")) not in (int, float) or not 0 < m["hours"] <= 100 or not isinstance(m.get("requires"), list) or not all(isinstance(x, str) and x in seen for x in m["requires"]) or not strings(m.get("lesson")) or not strings(m.get("tasks")):
            return False
        resources = m.get("resources")
        if not isinstance(resources, list) or not all(isinstance(r, dict) and isinstance(r.get("label"), str) and url(r.get("url")) for r in resources):
            return False
        seen.add(m["id"])
    for q in c["questions"]:
        if not isinstance(q.get("module"), str) or q["module"] not in seen or not isinstance(q.get("prompt"), str) or not strings(q.get("options")) or len(q["options"]) < 2 or type(q.get("answer")) is not int or not 0 <= q["answer"] < len(q["options"]) or not isinstance(q.get("explanation"), str):
            return False
    for p in c["projects"]:
        if not all(isinstance(p.get(k), str) for k in ("title", "tag", "summary", "dataset")) or not url(p.get("url")) or not strings(p.get("milestones")) or not strings(p.get("rubric")):
            return False
    return all(all(isinstance(e.get(k), str) for k in ("title", "prompt", "starter", "solution", "explanation")) and e.get("language") in ("SQL", "Python") for e in c["exercises"])

@router.get("/content")
def get_content(db: Session = Depends(get_db)):
    row = db.get(PublishedContent, 1)
    if row:
        return json.loads(row.data)
    path = Path(__file__).resolve().parents[3] / "frontend/src/learning/curriculum.json"
    return json.loads(path.read_text(encoding="utf-8"))

@router.put("/content")
def publish_content(payload: dict, x_admin_key: str = Header(default=""), db: Session = Depends(get_db)):
    key = os.getenv("ADMIN_KEY", "")
    if len(key) < 32 or not hmac.compare_digest(x_admin_key.encode(), key.encode()):
        raise HTTPException(403, "A valid admin key is required to publish content.")
    if not validate_content(payload):
        raise HTTPException(422, "Invalid content. Check IDs, prerequisites, questions and HTTPS resource links.")
    row = db.get(PublishedContent, 1)
    if not row:
        row = PublishedContent(id=1)
        db.add(row)
    row.data = json.dumps(payload)
    db.commit()
    return {"ok": True}
