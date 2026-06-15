import os
import sys
import django
from datetime import date, time

# Add the parent directory of scratch to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.contrib.auth import get_user_model
from apps.auth_rbac.models import Role, UserRole
from apps.hospital_config.models import Department
from apps.people.models import Staff, Doctor

User = get_user_model()

def setup_users():
    print("Setting up users, roles, staff, and doctors...")
    
    # Get or create roles
    admin_role = Role.objects.get(name="System Admin")
    doctor_role = Role.objects.get(name="Doctor")
    nurse_role = Role.objects.get(name="Nurse")
    
    # Get or create departments
    admin_dept = Department.objects.get(name="Admin")
    obs_dept = Department.objects.get(name="Obstetrics")
    nurse_dept = Department.objects.get(name="Nursing")
    
    # 1. Setup Admin
    try:
        admin_user = User.objects.get(username="admin")
        admin_user.set_password("password123")
        admin_user.save()
        print("Updated password for admin")
    except User.DoesNotExist:
        admin_user = User.objects.create_superuser(username="admin", email="admin@admin.com", password="password123")
        print("Created admin superuser")
        
    UserRole.objects.get_or_create(user=admin_user, role=admin_role)
    admin_staff, created = Staff.objects.get_or_create(
        user=admin_user,
        defaults={
            "department": admin_dept,
            "full_name": "Admin User",
            "designation": "Administrator",
            "phone": "+91-9876543210",
            "email": "admin@admin.com",
            "join_date": date(2024, 1, 1),
            "is_active": True
        }
    )
    if created:
        print("Created Staff profile for admin")
        
    # 2. Setup Chinmay (Doctor)
    try:
        chinmay_user = User.objects.get(username="chinmay")
        chinmay_user.set_password("password123")
        chinmay_user.save()
        print("Updated password for chinmay")
    except User.DoesNotExist:
        chinmay_user = User.objects.create_user(username="chinmay", email="viraj@gmail.com", password="password123")
        print("Created chinmay user")
        
    UserRole.objects.get_or_create(user=chinmay_user, role=doctor_role)
    chinmay_staff, created = Staff.objects.get_or_create(
        user=chinmay_user,
        defaults={
            "department": obs_dept,
            "full_name": "Dr. Chinmay Joshi",
            "designation": "Senior Obstetrician",
            "phone": "+91-9876543211",
            "email": "viraj@gmail.com",
            "join_date": date(2024, 1, 1),
            "is_active": True
        }
    )
    if created:
        print("Created Staff profile for chinmay")
        
    chinmay_doc, created = Doctor.objects.get_or_create(
        staff=chinmay_staff,
        defaults={
            "specialisation": "Obstetrics & Gynecology",
            "registration_no": "MC-12345",
            "available_from": time(9, 0),
            "available_to": time(17, 0)
        }
    )
    if created:
        print("Created Doctor profile for chinmay")
        
    # 3. Setup Vinit (Nurse or Doctor)
    try:
        vinit_user = User.objects.get(username="vinit")
        vinit_user.set_password("password123")
        vinit_user.save()
        print("Updated password for vinit")
    except User.DoesNotExist:
        vinit_user = User.objects.create_user(username="vinit", email="vinit@gmail.com", password="password123")
        print("Created vinit user")
        
    UserRole.objects.get_or_create(user=vinit_user, role=nurse_role)
    vinit_staff, created = Staff.objects.get_or_create(
        user=vinit_user,
        defaults={
            "department": nurse_dept,
            "full_name": "Nurse Vinit",
            "designation": "Senior Ward Nurse",
            "phone": "+91-9876543212",
            "email": "vinit@gmail.com",
            "join_date": date(2024, 1, 1),
            "is_active": True
        }
    )
    if created:
        print("Created Staff profile for vinit")

    # 4. Setup Lab (Lab Tech)
    lab_tech_role = Role.objects.get(name="Lab Tech")
    lab_dept = Department.objects.get(name="Laboratory")
    try:
        lab_user = User.objects.get(username="lab")
        lab_user.set_password("password123")
        lab_user.save()
        print("Updated password for lab")
    except User.DoesNotExist:
        lab_user = User.objects.create_user(username="lab", email="lab@gmail.com", password="password123")
        print("Created lab user")
        
    UserRole.objects.get_or_create(user=lab_user, role=lab_tech_role)
    lab_staff, created = Staff.objects.get_or_create(
        user=lab_user,
        defaults={
            "department": lab_dept,
            "full_name": "Lab Specialist",
            "designation": "Senior Laboratory Tech",
            "phone": "+91-9876543213",
            "email": "lab@gmail.com",
            "join_date": date(2024, 1, 1),
            "is_active": True
        }
    )
    if created:
        print("Created Staff profile for lab")
        
    print("User setup complete!")

if __name__ == "__main__":
    setup_users()
