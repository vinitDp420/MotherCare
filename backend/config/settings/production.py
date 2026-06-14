"""
MotherCare — Production Settings
Extends base.py with production hardening.
DEBUG must always be False in production.
"""
from .base import *  # noqa: F401, F403

# ─────────────────────────────────────────────────────────────────────────────
# Security hardening
# ─────────────────────────────────────────────────────────────────────────────
DEBUG = False  # CRITICAL: always False in production

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True

# ─────────────────────────────────────────────────────────────────────────────
# Static / Media — use S3 in production (configure AWS_* env vars)
# ─────────────────────────────────────────────────────────────────────────────
from decouple import config  # noqa: E402, F811

STORAGE_BACKEND = config("STORAGE_BACKEND", default="local")

if STORAGE_BACKEND == "s3":
    # Requires django-storages[boto3] in production dependencies
    AWS_ACCESS_KEY_ID = config("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = config("AWS_SECRET_ACCESS_KEY")
    AWS_STORAGE_BUCKET_NAME = config("AWS_STORAGE_BUCKET_NAME")
    AWS_S3_REGION_NAME = config("AWS_S3_REGION_NAME", default="ap-south-1")
    AWS_S3_CUSTOM_DOMAIN = f"{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com"
    AWS_S3_OBJECT_PARAMETERS = {"CacheControl": "max-age=86400"}
    MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/media/"

# ─────────────────────────────────────────────────────────────────────────────
# Database — connection pooling for production
# ─────────────────────────────────────────────────────────────────────────────
DATABASES["default"]["CONN_MAX_AGE"] = 300  # noqa: F405  — 5 minutes pooling

# ─────────────────────────────────────────────────────────────────────────────
# Logging — structured logging for production
# ─────────────────────────────────────────────────────────────────────────────
LOGGING["handlers"]["file"] = {  # noqa: F405
    "class": "logging.handlers.RotatingFileHandler",
    "filename": "/var/log/mothercare/app.log",
    "maxBytes": 10485760,  # 10 MB
    "backupCount": 10,
    "formatter": "verbose",
}
LOGGING["root"]["handlers"] = ["console", "file"]  # noqa: F405
