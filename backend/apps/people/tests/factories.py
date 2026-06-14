"""
MotherCare — People Module Test Factories
Uses factory_boy per CLAUDE.md (no fixtures).
"""
import factory
from factory.django import DjangoModelFactory

from apps.people.constants import (
    ALLERGY_SEVERITY_MODERATE,
    BLOOD_GROUP_O_POS,
    RELATIONSHIP_SPOUSE,
)
from apps.people.models import (
    Doctor,
    EmergencyContact,
    Patient,
    PatientAllergy,
    PatientEmergencyContact,
    Staff,
)


class UserFactory(DjangoModelFactory):
    """Factory for auth_rbac.User."""

    class Meta:
        model = "auth_rbac.User"
        django_get_or_create = ("username",)

    username = factory.Sequence(lambda n: f"user_{n}")
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@shakuntala.hospital")
    is_active = True


class DepartmentFactory(DjangoModelFactory):
    """Factory for hospital_config.Department."""

    class Meta:
        model = "hospital_config.Department"
        django_get_or_create = ("name",)

    name = factory.Sequence(lambda n: f"Department {n}")
    department_type = "Obstetrics"
    is_active = True


class PatientFactory(DjangoModelFactory):
    """Factory for Patient. MRN must be unique and valid format."""

    class Meta:
        model = Patient

    mrn = factory.Sequence(lambda n: f"PT-{1000 + n:04d}-A")
    full_name = factory.Faker("name", locale="en_IN")
    dob = factory.Faker("date_of_birth", minimum_age=15, maximum_age=50)
    blood_group = BLOOD_GROUP_O_POS
    phone = factory.Sequence(lambda n: f"98765{n:05d}")
    is_active = True


class EmergencyContactFactory(DjangoModelFactory):
    """Factory for EmergencyContact."""

    class Meta:
        model = EmergencyContact

    name = factory.Faker("name")
    phone = factory.Sequence(lambda n: f"91234{n:05d}")
    email = factory.Faker("email")


class PatientEmergencyContactFactory(DjangoModelFactory):
    """Factory for PatientEmergencyContact junction."""

    class Meta:
        model = PatientEmergencyContact

    patient = factory.SubFactory(PatientFactory)
    contact = factory.SubFactory(EmergencyContactFactory)
    relationship_type = RELATIONSHIP_SPOUSE
    priority = 1


class PatientAllergyFactory(DjangoModelFactory):
    """Factory for PatientAllergy."""

    class Meta:
        model = PatientAllergy

    patient = factory.SubFactory(PatientFactory)
    allergen = factory.Sequence(lambda n: f"Allergen-{n}")
    severity = ALLERGY_SEVERITY_MODERATE
    reaction_type = "Rash"
    recorded_date = factory.Faker("date_this_year")


class StaffFactory(DjangoModelFactory):
    """Factory for Staff."""

    class Meta:
        model = Staff

    full_name = factory.Faker("name")
    designation = "Nurse"
    phone = factory.Sequence(lambda n: f"80000{n:05d}")
    join_date = factory.Faker("date_this_decade")
    is_active = True


class DoctorFactory(DjangoModelFactory):
    """Factory for Doctor."""

    class Meta:
        model = Doctor

    staff = factory.SubFactory(StaffFactory)
    specialisation = "Obstetrics"
    registration_no = factory.Sequence(lambda n: f"REG-{1000 + n}")
    available_from = "09:00:00"
    available_to = "17:00:00"
