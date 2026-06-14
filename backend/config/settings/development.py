"""
MotherCare — Development Settings
Extends base.py with development-specific overrides.
"""
from .base import *  # noqa: F401, F403

# ─────────────────────────────────────────────────────────────────────────────
# Debug
# ─────────────────────────────────────────────────────────────────────────────
DEBUG = True
ALLOWED_HOSTS = ["*"]

# ─────────────────────────────────────────────────────────────────────────────
# Development Apps
# ─────────────────────────────────────────────────────────────────────────────
import sys
TESTING = "test" in sys.argv or "pytest" in sys.modules

if not TESTING:
    INSTALLED_APPS += [  # noqa: F405
        "debug_toolbar",
    ]

    MIDDLEWARE += [  # noqa: F405
        "debug_toolbar.middleware.DebugToolbarMiddleware",
    ]

INTERNAL_IPS = ["127.0.0.1", "localhost"]

DEBUG_TOOLBAR_CONFIG = {
    "SHOW_TOOLBAR_CALLBACK": lambda request: DEBUG,
}

# ─────────────────────────────────────────────────────────────────────────────
# Development Database — use local PostgreSQL via Docker
# ─────────────────────────────────────────────────────────────────────────────
# Override via .env if needed; defaults point to docker-compose DB

# ─────────────────────────────────────────────────────────────────────────────
# CORS — allow all origins in dev
# ─────────────────────────────────────────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = True

# ─────────────────────────────────────────────────────────────────────────────
# Email — print to console in dev
# ─────────────────────────────────────────────────────────────────────────────
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ─────────────────────────────────────────────────────────────────────────────
# Media Files — serve locally in dev
# ─────────────────────────────────────────────────────────────────────────────
# Media is served by Django dev server automatically when DEBUG=True

# ─────────────────────────────────────────────────────────────────────────────
# DRF — add browsable API in development
# ─────────────────────────────────────────────────────────────────────────────
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] += [  # noqa: F405
    "rest_framework.renderers.BrowsableAPIRenderer",
]

# ─────────────────────────────────────────────────────────────────────────────
# Logging — verbose in dev
# ─────────────────────────────────────────────────────────────────────────────
LOGGING["loggers"]["mothercare"]["level"] = "DEBUG"  # noqa: F405
LOGGING["loggers"]["django.db.backends"] = {  # noqa: F405
    "handlers": ["console"],
    "level": "WARNING",  # Set to DEBUG to log all SQL queries
    "propagate": False,
}
