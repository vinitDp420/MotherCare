"""
MotherCare — Production Settings
Extends base.py with production hardening for Render / Cloud deployment.
"""
from .base import *  # noqa: F401, F403

# ─────────────────────────────────────────────────────────────────────────────
# Security hardening
# ─────────────────────────────────────────────────────────────────────────────
DEBUG = config("DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = ["*"]
CORS_ALLOW_ALL_ORIGINS = True

# Support cloud reverse proxies (Render, Heroku, AWS ALB)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# ─────────────────────────────────────────────────────────────────────────────
# Static / Media — use local or S3 in production
# ─────────────────────────────────────────────────────────────────────────────
STORAGE_BACKEND = config("STORAGE_BACKEND", default="local")

if STORAGE_BACKEND == "s3":
    AWS_ACCESS_KEY_ID = config("AWS_ACCESS_KEY_ID", default="")
    AWS_SECRET_ACCESS_KEY = config("AWS_SECRET_ACCESS_KEY", default="")
    AWS_STORAGE_BUCKET_NAME = config("AWS_STORAGE_BUCKET_NAME", default="")
    AWS_S3_REGION_NAME = config("AWS_S3_REGION_NAME", default="ap-south-1")
    if AWS_STORAGE_BUCKET_NAME:
        AWS_S3_CUSTOM_DOMAIN = f"{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com"
        MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/media/"

# ─────────────────────────────────────────────────────────────────────────────
# Database — connection pooling
# ─────────────────────────────────────────────────────────────────────────────
DATABASES["default"]["CONN_MAX_AGE"] = 300  # noqa: F405

# ─────────────────────────────────────────────────────────────────────────────
# Logging — Console logging for Render / Container environments
# ─────────────────────────────────────────────────────────────────────────────
LOGGING["root"]["handlers"] = ["console"]  # noqa: F405
