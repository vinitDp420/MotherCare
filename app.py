"""
MotherCare — Universal WSGI Entry Point (app.py)
Allows `gunicorn app:app` (Render's default Python Start Command) to boot Django automatically.
"""
import os
import sys
from pathlib import Path

# Add backend directory to Python path so Django finds 'config' and 'apps'
BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.sqlite")

from django.core.wsgi import get_wsgi_application

# 'app' and 'application' expose the Django WSGI callable for Gunicorn/uWSGI
app = get_wsgi_application()
application = app
