import os
import sys
import django
from datetime import date

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.contrib.auth import get_user_model
from apps.auth_rbac.models import Role, UserRole
from apps.people.models import Patient

User = get_user_model()

def create_patients():
    print("Seeding patient logins...")

    # 1. Get or create Patient role
    patient_role, created = Role.objects.get_or_create(
        name="Patient",
        defaults={"description": "Maternity patient role for portal access"}
    )
    if created:
        print("Created Patient role")

    # 2. Get some active patients to link
    patients = list(Patient.objects.filter(is_active=True).order_by("created_at"))
    if len(patients) < 2:
        # Create mock patients if needed
        for i in range(2 - len(patients)):
            p = Patient.objects.create(
                mrn=f"MRN-PATSEEDED-{i+100}",
                full_name=f"Portal Patient {i+1}",
                dob=date(1996, 8, 20),
                blood_group="A+",
                phone=f"+91-999998800{i}",
                is_active=True
            )
            patients.append(p)

    patients_data = [
        {"username": "patient1", "patient": patients[0]},
        {"username": "patient2", "patient": patients[1]},
    ]

    for idx, data in enumerate(patients_data):
        username = data["username"]
        email = f"{username}@mothercare.local"
        password = "password123"
        patient = data["patient"]

        # a. Create User
        user, created_user = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_active": True
            }
        )
        user.set_password(password)
        user.save()

        # b. Assign Patient Role
        UserRole.objects.get_or_create(user=user, role=patient_role)

        # c. Link to Patient record
        patient.user = user
        patient.save()

        print(f"Patient login created: {username} / {password} -> Linked to Patient: {patient.full_name} ({patient.mrn})")

    print("Patient logins seeding complete!")

if __name__ == "__main__":
    create_patients()
