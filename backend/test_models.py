"""Actual legacy ORM schema assertions on a disposable database.

Run `python -m pytest -q test_models.py tests`. This module performs no writes
to the application's configured database and is not a database setup command.
"""
from sqlalchemy import create_engine, inspect


def test_legacy_models_create_expected_tables_on_disposable_database():
    # Delay app imports until execution so test collection cannot preconfigure
    # the application engine before the isolated API fixtures are installed.
    from app.database import Base
    from app.models import User, DayTask, UserActivity

    engine = create_engine("sqlite://")
    try:
        Base.metadata.create_all(engine)
        schema = inspect(engine)
        assert {User.__tablename__, DayTask.__tablename__, UserActivity.__tablename__} <= set(schema.get_table_names())
        assert {"id", "email", "hashed_password", "is_active"} <= {
            column["name"] for column in schema.get_columns(User.__tablename__)}
        assert any(key["referred_table"] == User.__tablename__
                   for key in schema.get_foreign_keys(DayTask.__tablename__))
    finally:
        engine.dispose()
