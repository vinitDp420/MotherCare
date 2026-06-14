"""
SQLite development settings for running without PostgreSQL/Docker.

This file imports the base settings and overrides `DATABASES` to use a
file-based SQLite database so the project can run locally without Docker.
"""
from .development import *  # noqa: F401, F403

# Use a local sqlite file for quick local development when Postgres isn't available
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": str(BASE_DIR / "db.sqlite3"),
    }
}

# Ensure debug is True for local dev
DEBUG = True
