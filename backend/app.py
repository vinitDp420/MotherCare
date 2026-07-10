"""
MotherCare — Universal WSGI Entry Point for backend/ directory (app.py)
Allows `gunicorn app:app` to boot Django automatically.
"""
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.sqlite")

from django.core.wsgi import get_wsgi_application

app = get_wsgi_application()
application = app
