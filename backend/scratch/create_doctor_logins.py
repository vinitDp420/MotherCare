import os
import sys
import django
from datetime import date, time, timedelta

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.auth_rbac.models import Role, UserRole
from apps.hospital_config.models import Department
from apps.people.models import Staff, Doctor, Patient
from apps.appointments.models import Appointment
from apps.appointments.constants import STATUS_CONFIRMED, STATUS_SCHEDULED

User = get_user_model()

def create_doctors():
    print("Seeding doctor logins, staff records, doctor profiles, and appointments...")

    # Get roles and department
    try:
        doctor_role = Role.objects.get(name="Doctor")
    except Role.DoesNotExist:
        print("Doctor role not found, aborting.")
        return

    try:
        obs_dept = Department.objects.get(name="Obstetrics")
    except Department.DoesNotExist:
        obs_dept = Department.objects.first()

    # Get some patients to assign appointments
    patients = list(Patient.objects.filter(is_active=True)[:15])
    if len(patients) < 5:
        # Create some mock patients if there are not enough
        for i in range(5 - len(patients)):
            p = Patient.objects.create(
                mrn=f"MRN-DOCSEEDED-{i+100}",
                full_name=f"Mock Patient {i+1}",
                dob=date(1995, 5, 10),
                blood_group="O+",
                phone=f"+91-999999900{i}",
                is_active=True
            )
            patients.append(p)

    doctors_data = [
        {"username": "doc1", "full_name": "Dr. Aditi Sharma", "reg": "DOC-REG-901"},
        {"username": "doc2", "full_name": "Dr. Rajesh Verma", "reg": "DOC-REG-902"},
        {"username": "doc3", "full_name": "Dr. Sneha Patil", "reg": "DOC-REG-903"},
        {"username": "doc4", "full_name": "Dr. Vikram Malhotra", "reg": "DOC-REG-904"},
        {"username": "doc5", "full_name": "Dr. Priya Deshmukh", "reg": "DOC-REG-905"},
    ]

    today_date = timezone.localdate(timezone.now())

    for idx, data in enumerate(doctors_data):
        username = data["username"]
        email = f"{username}@mothercare.local"
        password = "password123"

        # 1. Create User
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_active": True
            }
        )
        user.set_password(password)
        user.save()

        # 2. Assign Doctor Role
        UserRole.objects.get_or_create(user=user, role=doctor_role)

        # 3. Create Staff
        staff, created_staff = Staff.objects.get_or_create(
            user=user,
            defaults={
                "department": obs_dept,
                "full_name": data["full_name"],
                "designation": "Consultant Obstetrician",
                "phone": f"+91-888880000{idx+1}",
                "email": email,
                "join_date": date(2025, 1, 1),
                "is_active": True
            }
        )
        if not created_staff:
            staff.full_name = data["full_name"]
            staff.save()

        # 4. Create Doctor Profile
        doctor, created_doc = Doctor.objects.get_or_create(
            staff=staff,
            defaults={
                "specialisation": "Obstetrics & Gynecology",
                "registration_no": data["reg"],
                "available_from": time(9, 0),
                "available_to": time(17, 0)
            }
        )
        if not created_doc:
            doctor.registration_no = data["reg"]
            doctor.save()

        print(f"Doctor login created: {username} / {password} ({data['full_name']})")

        # 5. Create 2 mock appointments for today for this doctor
        # Delete existing today appointments for this doctor to avoid duplicates or double-booking conflicts during seed rerun
        Appointment.objects.filter(doctor=doctor, appointment_datetime__date=today_date).delete()

        # Assign patients
        p1 = patients[(idx * 2) % len(patients)]
        p2 = patients[(idx * 2 + 1) % len(patients)]

        # Appointment 1 (Confirmed - ready to Start)
        t1 = timezone.make_aware(timezone.datetime.combine(today_date, time(10, 0 + idx * 10)))
        Appointment.objects.create(
            patient=p1,
            doctor=doctor,
            appointment_datetime=t1,
            appointment_type="anc",
            token_number=101,
            status=STATUS_CONFIRMED,
            notes="Regular ANC checkup."
        )

        # Appointment 2 (Scheduled)
        t2 = timezone.make_aware(timezone.datetime.combine(today_date, time(11, 0 + idx * 10)))
        Appointment.objects.create(
            patient=p2,
            doctor=doctor,
            appointment_datetime=t2,
            appointment_type="follow_up",
            token_number=102,
            status=STATUS_SCHEDULED,
            notes="Review scan reports."
        )

        print(f"  -> Generated 2 mock appointments today for {data['full_name']}: {p1.full_name} and {p2.full_name}")

    print("Doctors seeding complete!")

if __name__ == "__main__":
    create_doctors()
