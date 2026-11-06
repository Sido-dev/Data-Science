"""Isolated SQLite fixtures: the suite never connects to a configured user database."""
import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
# main creates tables on import; isolate even that bootstrap in an in-memory DB.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:5173"
from app.database import Base, get_db
from app.main import app
from app.routers import workspace


@pytest.fixture
def db_factory():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False},
                           poolclass=StaticPool)

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    yield factory
    engine.dispose()


@pytest.fixture
def client(db_factory, monkeypatch):
    monkeypatch.setenv("ADMIN_KEY", "test-only-admin-key-" + "x" * 32)
    with workspace._attempts_lock:
        workspace._attempts.clear()

    def isolated_database():
        with db_factory() as session:
            yield session

    app.dependency_overrides[get_db] = isolated_database
    try:
        with TestClient(app) as value:
            yield value
    finally:
        app.dependency_overrides.clear()
        with workspace._attempts_lock:
            workspace._attempts.clear()


@pytest.fixture
def valid_workspace():
    return {"version": 2,
        "profile": {"name": "Test Learner", "track": "analyst", "hours": 5,
                    "level": "beginner", "onboarded": True},
        "completed": {"python-basics": "2026-11-01T10:00:00Z"},
        "notes": {"python-basics": "A private note"},
        "answers": {"question-one": {"choice": 1, "correct": True}},
        "milestones": {"project-one": False}, "drafts": {"exercise-one": "print(1)"},
        "activity": [{"label": "Completed Python", "at": "2026-11-01T10:00:00Z"}]}


@pytest.fixture
def valid_content():
    return {"modules": [{"id": "python-basics", "title": "Python", "phase": "Foundation",
        "summary": "Learn Python", "track": "both", "hours": 3, "requires": [],
        "lesson": ["Read the example"], "tasks": ["Complete the exercise"],
        "resources": [{"label": "Python docs", "url": "https://docs.python.org/3/"}]}],
        "questions": [{"id": "question-one", "module": "python-basics", "prompt": "Pick one",
            "options": ["One", "Two"], "answer": 0, "explanation": "One is first"}],
        "projects": [{"id": "project-one", "title": "Project", "tag": "Python",
            "summary": "Build something", "dataset": "Synthetic fixture", "url": "https://example.org/data",
            "milestones": ["Finish"], "rubric": ["Correct output"]}],
        "exercises": [{"id": "exercise-one", "title": "Print", "prompt": "Print one",
            "starter": "", "solution": "print(1)", "explanation": "Print a value", "language": "Python"}]}
