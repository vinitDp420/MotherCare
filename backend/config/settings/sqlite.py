"""
SQLite development settings — NO Docker / PostgreSQL required.

Use this on any laptop to run the project instantly:
    uv run python manage.py runserver --settings=config.settings.sqlite

Or set:
    DJANGO_SETTINGS_MODULE=config.settings.sqlite
"""
import os

# ── Inline defaults so no .env file is needed ────────────────────────────────
os.environ.setdefault("SECRET_KEY", "dev-only-insecure-key-change-in-production-123456")
os.environ.setdefault("DEBUG", "True")
os.environ.setdefault("ALLOWED_HOSTS", "localhost,127.0.0.1,0.0.0.0")
os.environ.setdefault("HOSPITAL_CODE", "SH-MAT-2024")
os.environ.setdefault("SESSION_TOKEN_EXPIRY_HOURS", "8")
os.environ.setdefault("SESSION_REMEMBER_ME_EXPIRY_HOURS", "720")

from .development import *  # noqa: F401, F403

# ── SQLite — no Docker needed ─────────────────────────────────────────────────
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": str(BASE_DIR / "db.sqlite3"),
    }
}

# ── Remove django.contrib.postgres (PostgreSQL-only, crashes on SQLite) ───────
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != "django.contrib.postgres"]  # noqa: F405

DEBUG = True
CORS_ALLOW_ALL_ORIGINS = True

