"""
MotherCare — Base Django Settings
Common settings shared across all environments.
Environment-specific overrides live in development.py and production.py.
"""
from pathlib import Path

from decouple import Csv, config

# ─────────────────────────────────────────────────────────────────────────────
# Paths
# ─────────────────────────────────────────────────────────────────────────────
# config/settings/base.py → config/settings/ → config/ → backend/
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# ─────────────────────────────────────────────────────────────────────────────
# Security
# ─────────────────────────────────────────────────────────────────────────────
SECRET_KEY = config("SECRET_KEY", default="django-insecure-mothercare-prod-fallback-key-change-in-env-9876543210")
DEBUG = config("DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="*", cast=Csv())

# ─────────────────────────────────────────────────────────────────────────────
# Custom User Model (MUST be set before any auth imports)
# ─────────────────────────────────────────────────────────────────────────────
AUTH_USER_MODEL = "auth_rbac.User"

# ─────────────────────────────────────────────────────────────────────────────
# Application Definition
# ─────────────────────────────────────────────────────────────────────────────
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",  # For pg_trgm / trigram search
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
]

LOCAL_APPS = [
    # Foundation
    "apps.auth_rbac",
    "apps.hospital_config",
    # Master Data
    "apps.people",
    "apps.pharmacy",
    # Clinical Core
    "apps.pregnancy",
    "apps.appointments",
    "apps.consultations",
    "apps.prescriptions",
    "apps.laboratory",
    "apps.referrals",
    # Inpatient
    "apps.admissions",
    "apps.delivery",
    "apps.newborn",
    # Transactions
    "apps.billing",
    # Operations
    "apps.hr",
    "apps.emergency",
    "apps.notifications",
    "apps.documents",
    # System
    "apps.audit",
    "apps.reports",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ─────────────────────────────────────────────────────────────────────────────
# Middleware
# ─────────────────────────────────────────────────────────────────────────────
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",  # Must be before CommonMiddleware
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

# ─────────────────────────────────────────────────────────────────────────────
# Templates
# ─────────────────────────────────────────────────────────────────────────────
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# ─────────────────────────────────────────────────────────────────────────────
# Database — PostgreSQL 15
# ─────────────────────────────────────────────────────────────────────────────
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("POSTGRES_DB", default="mothercare"),
        "USER": config("POSTGRES_USER", default="mothercare_user"),
        "PASSWORD": config("POSTGRES_PASSWORD", default="mothercare_secret"),
        "HOST": config("POSTGRES_HOST", default="localhost"),
        "PORT": config("POSTGRES_PORT", default="5432"),
        "CONN_MAX_AGE": 60,  # Connection pooling: reuse connections for 60 seconds
        "OPTIONS": {
            "connect_timeout": 10,
        },
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# Password Validation & Hashing
# Argon2id as per AUTH-02 and NFR §7.2
# ─────────────────────────────────────────────────────────────────────────────
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",  # Primary: Argon2id
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",  # Fallback for migration
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ─────────────────────────────────────────────────────────────────────────────
# Internationalization & Localization (NFR §7.5)
# ─────────────────────────────────────────────────────────────────────────────
LANGUAGE_CODE = "en-gb"  # English (UK) as per PRD NFR §7.5
TIME_ZONE = config("TIME_ZONE", default="Asia/Kolkata")
USE_I18N = True
USE_TZ = True  # All datetimes stored as UTC (TIMESTAMPTZ in PostgreSQL)

LANGUAGES = [
    ("en", "English"),
    ("mr", "Marathi"),
]

LOCALE_PATHS = [BASE_DIR / "locale"]

# ─────────────────────────────────────────────────────────────────────────────
# Static & Media Files
# ─────────────────────────────────────────────────────────────────────────────
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"] if (BASE_DIR / "static").exists() else []

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Maximum upload size: 50 MB per file (G-04 gap resolution)
DATA_UPLOAD_MAX_MEMORY_SIZE = 52_428_800   # 50 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 52_428_800   # 50 MB

# ─────────────────────────────────────────────────────────────────────────────
# Default Primary Key
# ─────────────────────────────────────────────────────────────────────────────
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
# Note: Core models override this with UUIDField as primary key

# ─────────────────────────────────────────────────────────────────────────────
# Django REST Framework
# ─────────────────────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.auth_rbac.authentication.UserSessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "core.permissions.IsAuthenticatedStaff",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",  # File uploads
        "rest_framework.parsers.FormParser",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardResultsPagination",
    "PAGE_SIZE": 25,
    "EXCEPTION_HANDLER": "core.exceptions.mothercare_exception_handler",
    # Monetary amounts as strings to avoid float precision (CLAUDE.md naming conventions)
    "COERCE_DECIMAL_TO_STRING": True,
    "DATETIME_FORMAT": "%Y-%m-%dT%H:%M:%SZ",  # ISO 8601 UTC (CLAUDE.md API fields)
    "DATE_FORMAT": "%Y-%m-%d",
    "TIME_FORMAT": "%H:%M:%S",
}

# ─────────────────────────────────────────────────────────────────────────────
# CORS (cross-origin for React frontend)
# ─────────────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:5173,http://127.0.0.1:5173",
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True

# ─────────────────────────────────────────────────────────────────────────────
# drf-spectacular — OpenAPI Schema
# ─────────────────────────────────────────────────────────────────────────────
SPECTACULAR_SETTINGS = {
    "TITLE": "MotherCare API",
    "DESCRIPTION": "Maternity Hospital Information System — MotherCare Hospital",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SCHEMA_PATH_PREFIX": "/api/v1/",
    "COMPONENT_SPLIT_REQUEST": True,
}

# ─────────────────────────────────────────────────────────────────────────────
# Email
# ─────────────────────────────────────────────────────────────────────────────
EMAIL_BACKEND = config("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = config("EMAIL_HOST", default="")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = f"MotherCare <noreply@{config('HOSPITAL_CODE', default='mothercare').lower()}.hospital>"

# ─────────────────────────────────────────────────────────────────────────────
# Hospital Configuration (G-07: no hard-coded hospital ID)
# ─────────────────────────────────────────────────────────────────────────────
HOSPITAL_CODE = config("HOSPITAL_CODE", default="SH-MAT-2024")

# ─────────────────────────────────────────────────────────────────────────────
# Session / Auth Tokens (G-03 gap resolution)
# ─────────────────────────────────────────────────────────────────────────────
SESSION_TOKEN_EXPIRY_HOURS = config("SESSION_TOKEN_EXPIRY_HOURS", default=8, cast=int)
SESSION_REMEMBER_ME_EXPIRY_HOURS = config("SESSION_REMEMBER_ME_EXPIRY_HOURS", default=720, cast=int)

# ─────────────────────────────────────────────────────────────────────────────
# Logging — base config (extended per environment)
# ─────────────────────────────────────────────────────────────────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {asctime} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "mothercare": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}
