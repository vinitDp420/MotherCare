import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
import django; django.setup()

from django.contrib.auth import get_user_model
from apps.auth_rbac.models import UserRole, Role

User = get_user_model()
pharmacist_role = Role.objects.get(name='Pharmacist')

u, created = User.objects.get_or_create(
    username='chinmay',
    defaults={'email': 'chinmay@gmail.com', 'is_active': True}
)
u.set_password('chinmay@#123')
u.save()
UserRole.objects.filter(user=u).delete()
UserRole.objects.create(user=u, role=pharmacist_role)
print(f"[{'CREATED' if created else 'OK'}] chinmay -> password=chinmay@#123, role=Pharmacist")

print("\n--- Current Users ---")
for u in User.objects.all().order_by('username'):
    roles = [ur.role.name for ur in UserRole.objects.filter(user=u)]
    print(f"  {u.username:<12} | {u.email:<28} | {', '.join(roles)}")
