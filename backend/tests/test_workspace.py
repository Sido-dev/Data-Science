import copy
import hashlib
import os
from datetime import datetime, timedelta, timezone

import pytest
from app.routers.workspace import LearningAccount, LearningSession, PublishedContent, WorkspaceBackup

PASSWORD = "correct-test-password-2026"


def register(client, username="learner_one"):
    response = client.post("/api/v2/auth/register", json={"username": username, "password": PASSWORD})
    assert response.status_code == 201, response.text
    return response.json()


def authorization(account):
    return {"Authorization": "Bearer " + account["token"]}


def test_register_login_hashed_storage_and_logout(client, db_factory):
    account = register(client, "Learner_One")
    assert account["username"] == "learner_one"
    with db_factory() as db:
        stored = db.query(LearningAccount).one()
        session = db.query(LearningSession).one()
        assert stored.password_hash != PASSWORD and ":" in stored.password_hash
        assert session.token_hash == hashlib.sha256(account["token"].encode()).hexdigest()
        assert session.token_hash != account["token"]
    login = client.post("/api/v2/auth/login", json={"username": "LEARNER_ONE", "password": PASSWORD})
    assert login.status_code == 200
    assert client.get("/api/v2/progress", headers=authorization(login.json())).status_code == 200
    assert client.post("/api/v2/auth/logout", headers=authorization(account)).status_code == 200
    assert client.get("/api/v2/progress", headers=authorization(account)).status_code == 401
    # Signing out one token does not sign out a second independent session.
    assert client.get("/api/v2/progress", headers=authorization(login.json())).status_code == 200


def test_duplicate_username_is_case_insensitive(client):
    register(client, "Learner_One")
    assert client.post("/api/v2/auth/register", json={"username": "LEARNER_ONE", "password": PASSWORD}).status_code == 409


@pytest.mark.parametrize("username,password", [("ab", PASSWORD), ("bad-name!", PASSWORD),
    ("x" * 41, PASSWORD), ("learner", "short"), ("learner", "x" * 129)])
def test_invalid_credentials_are_rejected(client, username, password):
    assert client.post("/api/v2/auth/register", json={"username": username, "password": password}).status_code == 422


def test_wrong_password_and_unknown_user_have_same_public_response(client):
    register(client)
    known = client.post("/api/v2/auth/login", json={"username": "learner_one", "password": "incorrect-password-2026"})
    unknown = client.post("/api/v2/auth/login", json={"username": "unknown_user", "password": PASSWORD})
    assert known.status_code == unknown.status_code == 401
    assert known.json() == unknown.json()


@pytest.mark.parametrize("method,path", [("get", "/api/v2/progress"),
    ("put", "/api/v2/progress"), ("post", "/api/v2/auth/logout")])
def test_private_endpoints_require_session(client, valid_workspace, method, path):
    kwargs = {"json": {"workspace": valid_workspace}} if method == "put" else {}
    assert getattr(client, method)(path, **kwargs).status_code == 401
    assert getattr(client, method)(path, headers={"Authorization": "Bearer invalid-token"}, **kwargs).status_code == 401


def test_expired_session_is_rejected(client, db_factory):
    account = register(client)
    with db_factory() as db:
        session = db.get(LearningSession, hashlib.sha256(account["token"].encode()).hexdigest())
        session.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(seconds=1)
        db.commit()
    assert client.get("/api/v2/progress", headers=authorization(account)).status_code == 401


def test_backup_round_trip_and_cross_account_isolation(client, valid_workspace, db_factory):
    alice, bob = register(client, "alice_test"), register(client, "bob_test")
    assert client.get("/api/v2/progress", headers=authorization(alice)).json()["workspace"] is None
    saved = client.put("/api/v2/progress", json={"workspace": valid_workspace}, headers=authorization(alice))
    assert saved.status_code == 200
    loaded = client.get("/api/v2/progress", headers=authorization(alice)).json()
    assert loaded["workspace"] == valid_workspace and loaded["updated_at"].endswith("Z")
    # A client-supplied account query does not select another account's backup.
    assert client.get("/api/v2/progress?account_id=1", headers=authorization(bob)).json()["workspace"] is None
    bob_data = copy.deepcopy(valid_workspace)
    bob_data["notes"] = {"private": "Bob only"}
    assert client.put("/api/v2/progress", json={"workspace": bob_data, "account_id": 1}, headers=authorization(bob)).status_code == 200
    assert client.get("/api/v2/progress", headers=authorization(alice)).json()["workspace"] == valid_workspace
    assert client.get("/api/v2/progress", headers=authorization(bob)).json()["workspace"] == bob_data
    valid_workspace["notes"]["python-basics"] = "Updated Alice note"
    assert client.put("/api/v2/progress", json={"workspace": valid_workspace}, headers=authorization(alice)).status_code == 200
    with db_factory() as db:
        assert db.query(WorkspaceBackup).count() == 2


@pytest.mark.parametrize("field,value", [("version", 1), ("profile", {}),
    ("completed", {"bad": "not-a-date"}), ("notes", {"bad": 1}),
    ("notes", {"bad": "x" * 20001}), ("answers", {"q": {"choice": True, "correct": True}}),
    ("milestones", {"m": "yes"}), ("activity", [{"label": "bad", "at": None}]),
    ("activity", [{"label": "event", "at": "2026-01-01T00:00:00Z"}] * 501)])
def test_invalid_backup_does_not_replace_saved_data(client, valid_workspace, field, value):
    account = register(client)
    headers = authorization(account)
    assert client.put("/api/v2/progress", json={"workspace": valid_workspace}, headers=headers).status_code == 200
    broken = copy.deepcopy(valid_workspace)
    broken[field] = value
    assert client.put("/api/v2/progress", json={"workspace": broken}, headers=headers).status_code == 422
    assert client.get("/api/v2/progress", headers=headers).json()["workspace"] == valid_workspace


def test_backup_aggregate_size_limit_and_malformed_json(client, valid_workspace):
    account = register(client)
    valid_workspace["notes"] = {f"n-{i}": "x" * 20000 for i in range(76)}
    assert client.put("/api/v2/progress", json={"workspace": valid_workspace}, headers=authorization(account)).status_code == 422
    response = client.put("/api/v2/progress", content=b'{"workspace":',
        headers={**authorization(account), "Content-Type": "application/json"})
    assert response.status_code == 422
    assert client.get("/api/v2/progress", headers=authorization(account)).json()["workspace"] is None


def test_request_body_limit_with_and_without_content_length(client):
    assert client.post("/api/v2/auth/register", content=b"x" * 2_000_001).status_code == 413
    def chunks():
        yield b"x" * 1_000_000
        yield b"x" * 1_000_001
    assert client.post("/api/v2/auth/register", content=chunks()).status_code == 413


def test_content_requires_admin_key_and_round_trips(client, valid_content, db_factory, monkeypatch):
    assert client.put("/api/v2/content", json=valid_content).status_code == 403
    assert client.put("/api/v2/content", json=valid_content, headers={"X-Admin-Key": "incorrect"}).status_code == 403
    account = register(client)
    assert client.put("/api/v2/content", json=valid_content, headers=authorization(account)).status_code == 403
    admin = {"X-Admin-Key": os.environ["ADMIN_KEY"]}
    assert client.put("/api/v2/content", json=valid_content, headers=admin).status_code == 200
    assert client.get("/api/v2/content").json() == valid_content
    with db_factory() as db:
        assert db.query(PublishedContent).count() == 1
    monkeypatch.setenv("ADMIN_KEY", "too-short")
    assert client.put("/api/v2/content", json=valid_content, headers={"X-Admin-Key": "too-short"}).status_code == 403


@pytest.mark.parametrize("case", ["duplicate-id", "unknown-prerequisite", "missing-module",
    "bad-answer", "insecure-resource", "bad-exercise", "empty-projects"])
def test_invalid_content_is_rejected_without_replacing_published_content(client, valid_content, case):
    headers = {"X-Admin-Key": os.environ["ADMIN_KEY"]}
    assert client.put("/api/v2/content", json=valid_content, headers=headers).status_code == 200
    broken = copy.deepcopy(valid_content)
    if case == "duplicate-id": broken["modules"].append(copy.deepcopy(broken["modules"][0]))
    elif case == "unknown-prerequisite": broken["modules"][0]["requires"] = ["missing"]
    elif case == "missing-module": broken["questions"][0]["module"] = "missing"
    elif case == "bad-answer": broken["questions"][0]["answer"] = 9
    elif case == "insecure-resource": broken["modules"][0]["resources"][0]["url"] = "http://example.org"
    elif case == "bad-exercise": broken["exercises"][0]["language"] = "Shell"
    elif case == "empty-projects": broken["projects"] = []
    assert client.put("/api/v2/content", json=broken, headers=headers).status_code == 422
    assert client.get("/api/v2/content").json() == valid_content


def test_authentication_throttle_is_enforced(client):
    for _ in range(20):
        assert client.post("/api/v2/auth/login", json={"username": "unknown_user", "password": PASSWORD}).status_code == 401
    assert client.post("/api/v2/auth/login", json={"username": "unknown_user", "password": PASSWORD}).status_code == 429


def test_default_curriculum_and_security_headers(client):
    from app.routers.workspace import validate_content
    response = client.get("/api/v2/content")
    assert response.status_code == 200 and validate_content(response.json())
    assert response.headers["Cache-Control"] == "no-store"
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert client.get("/").json()["version"] == "2.0.0"
    # Legacy email/user-ID routes remain unmounted.
    assert client.get("/api/roadmap/1").status_code == 404


@pytest.mark.parametrize("origin,allowed", [("http://localhost:5173", True),
                                          ("https://unapproved.example", False)])
def test_cors_uses_exact_origins(client, origin, allowed):
    response = client.options("/api/v2/progress", headers={
        "Origin": origin, "Access-Control-Request-Method": "PUT",
        "Access-Control-Request-Headers": "authorization,content-type"})
    if allowed:
        assert response.status_code == 200
        assert response.headers["Access-Control-Allow-Origin"] == origin
    else:
        assert response.status_code == 400
        assert "Access-Control-Allow-Origin" not in response.headers
