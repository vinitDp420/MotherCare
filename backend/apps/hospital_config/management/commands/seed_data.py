from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.hospital_config.models import Hospital, Department
from apps.auth_rbac.models import Role, Permission, RolePermission, UserRole

class Command(BaseCommand):
    """Seed initial hospital config, departments, roles, and permissions."""
    
    help = "Seed initial hospital config, departments, roles, and permissions"

    def handle(self, *args, **options):
        self.stdout.write("Starting database seeding...")

        # 1. Hospital Config (Shakuntala Hospital)
        hospital, created = Hospital.objects.get_or_create(
            code="SH-MAT-2024",
            defaults={
                "name": "Shakuntala Hospital",
                "address": "12, Ring Road, Lajpat Nagar",
                "city": "New Delhi",
                "state": "Delhi",
                "pincode": "110024",
                "phone": "+91-11-4567890",
                "email": "info@shakuntala.hospital",
                "timezone": "Asia/Kolkata",
                "locale": "en-IN",
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created Hospital: {hospital}"))
        else:
            self.stdout.write(self.style.WARNING(f"Hospital already exists: {hospital}"))

        # 2. Departments
        departments_to_create = [
            ("Obstetrics", "Obstetrics"),
            ("Pediatrics", "Pediatrics"),
            ("Nursing", "Nursing"),
            ("Admin", "Admin"),
            ("Laboratory", "Laboratory"),
            ("Pharmacy", "Pharmacy"),
            ("ICU", "ICU"),
            ("HR", "HR"),
            ("Other", "Other"),
        ]
        for dept_name, dept_type in departments_to_create:
            dept, created = Department.objects.get_or_create(
                name=dept_name,
                defaults={"department_type": dept_type, "is_active": True}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created Department: {dept_name}"))

        # 3. Permissions Setup
        modules = [
            "patients", "appointments", "consultations", "prescriptions",
            "laboratory", "pharmacy", "admissions", "delivery", "newborn",
            "billing", "hr", "emergency", "notifications", "documents", "audit", "reports", "settings"
        ]
        actions = ["read", "write", "delete", "export"]

        perm_objs = {}
        for module in modules:
            perm_objs[module] = {}
            for action in actions:
                perm_name = f"Can {action} {module}"
                perm, created = Permission.objects.get_or_create(
                    module=module,
                    action=action,
                    defaults={
                        "name": perm_name,
                        "description": f"Enables user to {action} {module} data."
                    }
                )
                perm_objs[module][action] = perm

        self.stdout.write(self.style.SUCCESS("Successfully seeded all permissions."))

        # 4. Roles & Role-Permissions mappings
        roles_data = {
            "System Admin": {
                "desc": "Full access to all system functions",
                "perms": [(mod, act) for mod in modules for act in actions]
            },
            "Doctor": {
                "desc": "Clinical doctor role",
                "perms": [
                    ("patients", "read"), ("patients", "write"),
                    ("appointments", "read"), ("appointments", "write"),
                    ("consultations", "read"), ("consultations", "write"),
                    ("prescriptions", "read"), ("prescriptions", "write"),
                    ("laboratory", "read"), ("laboratory", "write"),
                    ("admissions", "read"), ("admissions", "write"),
                    ("delivery", "read"), ("delivery", "write"),
                    ("newborn", "read"), ("newborn", "write"),
                    ("emergency", "read"), ("emergency", "write"),
                    ("documents", "read"), ("documents", "write"),
                    ("reports", "read"),
                ]
            },
            "Nurse": {
                "desc": "Nursing and caretaking staff",
                "perms": [
                    ("patients", "read"), ("patients", "write"),
                    ("appointments", "read"),
                    ("prescriptions", "read"),
                    ("laboratory", "read"),
                    ("admissions", "read"), ("admissions", "write"),
                    ("delivery", "read"), ("delivery", "write"),
                    ("newborn", "read"), ("newborn", "write"),
                    ("emergency", "read"), ("emergency", "write"),
                ]
            },
            "Pharmacist": {
                "desc": "Pharmacy staff",
                "perms": [
                    ("patients", "read"),
                    ("prescriptions", "read"),
                    ("pharmacy", "read"), ("pharmacy", "write"),
                    ("billing", "read"),
                ]
            },
            "Receptionist": {
                "desc": "Front desk receptionist",
                "perms": [
                    ("patients", "read"), ("patients", "write"),
                    ("appointments", "read"), ("appointments", "write"),
                    ("billing", "read"), ("billing", "write"),
                    ("admissions", "read"),
                ]
            },
            "Lab Tech": {
                "desc": "Laboratory technician",
                "perms": [
                    ("patients", "read"),
                    ("consultations", "read"),
                    ("laboratory", "read"), ("laboratory", "write"),
                ]
            },
            "HR Admin": {
                "desc": "Human Resources administrator",
                "perms": [
                    ("hr", "read"), ("hr", "write"),
                ]
            },
            "Financial Officer": {
                "desc": "Handles billing and financial records",
                "perms": [
                    ("billing", "read"), ("billing", "write"),
                ]
            }
        }

        for role_name, details in roles_data.items():
            role, created = Role.objects.get_or_create(
                name=role_name,
                defaults={"description": details["desc"]}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created Role: {role_name}"))
            
            # Map permissions to role
            for mod, act in details["perms"]:
                perm = perm_objs[mod][act]
                rp, rp_created = RolePermission.objects.get_or_create(
                    role=role,
                    permission=perm
                )
        
        self.stdout.write(self.style.SUCCESS("All roles and role permissions mapped successfully!"))

        # 5. Default Users ─────────────────────────────────────────────────
        User = get_user_model()

        default_users = [
            {
                "username": "admin",
                "email": "admin@mothercare.local",
                "password": "admin@#123",
                "role": "System Admin",
                "is_superuser": True,
                "is_staff": True,
            },
            {
                "username": "vinit",
                "email": "vinit@gmail.com",
                "password": "vinit@#123",
                "role": "Doctor",
            },
            {
                "username": "viraj",
                "email": "viraj@gmail.com",
                "password": "viraj@#123",
                "role": "Lab Tech",
            },
        ]

        for user_data in default_users:
            user, created = User.objects.get_or_create(
                username=user_data["username"],
                defaults={
                    "email": user_data["email"],
                    "is_active": True,
                    "is_superuser": user_data.get("is_superuser", False),
                    "is_staff": user_data.get("is_staff", False),
                }
            )
            # Always reset the password to the defined default
            user.set_password(user_data["password"])
            user.save()

            # Assign role (idempotent)
            role_obj = Role.objects.get(name=user_data["role"])
            UserRole.objects.get_or_create(user=user, role=role_obj)

            status = "Created" if created else "Exists"
            self.stdout.write(
                self.style.SUCCESS(
                    f"  [{status}] {user_data['username']} | password: {user_data['password']} | role: {user_data['role']}"
                )
            )

        self.stdout.write(self.style.SUCCESS("Seeding complete!"))
