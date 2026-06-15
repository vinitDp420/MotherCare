import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

import django
django.setup()

from django.contrib.auth import get_user_model
from apps.auth_rbac.models import UserRole, Role

User = get_user_model()

# ── 1. Doctor: username=vinit, password=vinit@#123, role=Doctor ──────────────
try:
    vinit = User.objects.get(username='vinit')
    vinit.set_password('vinit@#123')
    vinit.save()
    doctor_role = Role.objects.get(name='Doctor')
    UserRole.objects.filter(user=vinit).delete()
    UserRole.objects.create(user=vinit, role=doctor_role)
    print("[OK] vinit -> password=vinit@#123, role=Doctor")
except User.DoesNotExist:
    # Create fresh
    doctor_role = Role.objects.get(name='Doctor')
    vinit = User.objects.create_user(username='vinit', email='vinit@gmail.com', password='vinit@#123')
    UserRole.objects.create(user=vinit, role=doctor_role)
    print("[CREATED] vinit -> password=vinit@#123, role=Doctor")

# ── 2. Laboratory: username=viraj, password=viraj@#123, role=Lab Tech ────────
lab_role = Role.objects.get(name='Lab Tech')

# Try by username first, then by email
if User.objects.filter(username='viraj').exists():
    viraj = User.objects.get(username='viraj')
elif User.objects.filter(email='viraj@gmail.com').exists():
    viraj = User.objects.get(email='viraj@gmail.com')
    viraj.username = 'viraj'
    viraj.save()
else:
    viraj = User(username='viraj', email='viraj_lab@mothercare.local', is_active=True)

viraj.set_password('viraj@#123')
viraj.save()
UserRole.objects.filter(user=viraj).delete()
UserRole.objects.create(user=viraj, role=lab_role)
print("[OK] viraj -> password=viraj@#123, role=Lab Tech")

# ── Summary ───────────────────────────────────────────────────────────────────
print()
print("=" * 50)
print("  CURRENT USERS SUMMARY")
print("=" * 50)
for u in User.objects.all().order_by('username'):
    roles = [ur.role.name for ur in UserRole.objects.filter(user=u)]
    print(f"  {u.username:<12} | {u.email:<25} | {', '.join(roles) or 'No Role'}")
print("=" * 50)
