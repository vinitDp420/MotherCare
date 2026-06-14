"""
MotherCare — People Module Model Tests
Tests: Patient, EmergencyContact, PatientEmergencyContact, PatientAllergy, Staff, Doctor
Coverage target: ≥ 80% for models per CLAUDE.md
"""
import pytest

from apps.people.constants import (
    ALLERGY_SEVERITY_MODERATE,
    BLOOD_GROUP_A_POS,
)
from apps.people.tests.factories import (
    DoctorFactory,
    EmergencyContactFactory,
    PatientAllergyFactory,
    PatientEmergencyContactFactory,
    PatientFactory,
    StaffFactory,
)


@pytest.mark.django_db
class TestPatientModel:
    """Tests for the Patient model (BR-PAT-01 to BR-PAT-12)."""

    def test_patient_creation_sets_required_fields(self):
        """Patient can be created with all required fields."""
        patient = PatientFactory(full_name="Priya Sharma", blood_group=BLOOD_GROUP_A_POS)
        assert patient.mrn.startswith("PT-")
        assert patient.full_name == "Priya Sharma"
        assert patient.is_active is True
        assert patient.is_deleted is False
        assert patient.id is not None

    def test_patient_mrn_unique(self):
        """Two patients cannot share the same MRN (BR-PAT-01)."""
        from django.db import IntegrityError
        PatientFactory(mrn="PT-9999-Z")
        with pytest.raises(IntegrityError):
            PatientFactory(mrn="PT-9999-Z")

    def test_patient_mrn_format(self):
        """MRN format follows PT-XXXX-A (BR-PAT-02)."""
        patient = PatientFactory()
        import re
        assert re.match(r"^PT-\d{4}-[A-Z]$", patient.mrn), f"Invalid MRN format: {patient.mrn}"

    def test_patient_soft_delete(self):
        """Soft-deleting a patient sets is_deleted=True and records deleted_at (BR-PAT-10)."""
        patient = PatientFactory()
        assert patient.is_deleted is False

        patient.soft_delete()

        patient.refresh_from_db()
        assert patient.is_deleted is True
        assert patient.deleted_at is not None

    def test_soft_deleted_patient_not_in_default_queryset(self):
        """Soft-deleted patients are excluded from Patient.objects (SoftDeleteManager)."""
        patient = PatientFactory()
        patient_id = patient.id
        patient.soft_delete()

        assert not Patient_exists_in_default_qs(patient_id)

    def test_soft_deleted_patient_visible_in_all_objects(self):
        """Soft-deleted patients visible via all_objects manager (admin/audit use)."""
        from apps.people.models import Patient

        patient = PatientFactory()
        patient.soft_delete()
        assert Patient.all_objects.filter(id=patient.id).exists()

    def test_cannot_soft_delete_twice(self):
        """Soft-deleting an already-deleted patient raises ValueError."""
        patient = PatientFactory()
        patient.soft_delete()
        with pytest.raises(ValueError, match="already soft-deleted"):
            patient.soft_delete()

    def test_patient_restore(self):
        """Restoring a soft-deleted patient resets is_deleted and deleted_at."""
        patient = PatientFactory()
        patient.soft_delete()
        patient.restore()
        assert patient.is_deleted is False
        assert patient.deleted_at is None

    def test_patient_str(self):
        """Patient __str__ returns mrn and full_name."""
        patient = PatientFactory(full_name="Anita Singh")
        assert patient.mrn in str(patient)
        assert "Anita Singh" in str(patient)


def Patient_exists_in_default_qs(patient_id) -> bool:
    from apps.people.models import Patient
    return Patient.objects.filter(id=patient_id).exists()


@pytest.mark.django_db
class TestEmergencyContactModel:
    """Tests for EmergencyContact and PatientEmergencyContact."""

    def test_emergency_contact_creation(self):
        contact = EmergencyContactFactory(name="Ramesh Kumar")
        assert contact.name == "Ramesh Kumar"
        assert contact.phone is not None

    def test_patient_can_have_multiple_contacts(self):
        """A patient can have multiple emergency contacts (BR-PAT-06)."""
        patient = PatientFactory()
        c1 = EmergencyContactFactory()
        c2 = EmergencyContactFactory()
        PatientEmergencyContactFactory(patient=patient, contact=c1, priority=1)
        PatientEmergencyContactFactory(patient=patient, contact=c2, priority=2)

        assert patient.emergency_contacts.count() == 2

    def test_primary_contact_flag_set_on_priority_1(self):
        """PatientEmergencyContact.is_primary is True when priority=1 (denormalised)."""
        link = PatientEmergencyContactFactory(priority=1)
        link.refresh_from_db()
        assert link.is_primary is True

    def test_secondary_contact_flag_false(self):
        """PatientEmergencyContact.is_primary is False when priority=2."""
        patient = PatientFactory()
        contact = EmergencyContactFactory()
        link = PatientEmergencyContactFactory(patient=patient, contact=contact, priority=2)
        link.refresh_from_db()
        assert link.is_primary is False

    def test_unique_patient_contact_pair(self):
        """Same patient cannot have the same contact twice (BR-PAT-06)."""
        patient = PatientFactory()
        from django.db import IntegrityError
        contact = EmergencyContactFactory()
        PatientEmergencyContactFactory(patient=patient, contact=contact, priority=1)
        with pytest.raises(IntegrityError):
            PatientEmergencyContactFactory(patient=patient, contact=contact, priority=2)


@pytest.mark.django_db
class TestPatientAllergyModel:
    """Tests for PatientAllergy (BR-PAT-13, BR-PAT-15, BR-RX-05)."""

    def test_allergy_created_for_patient(self):
        allergy = PatientAllergyFactory(allergen="Penicillin", severity=ALLERGY_SEVERITY_MODERATE)
        assert allergy.allergen == "Penicillin"
        assert allergy.patient is not None

    def test_allergy_severity_choices(self):
        """Valid severity values are accepted."""
        for severity in ["mild", "moderate", "severe", "life_threatening"]:
            allergy = PatientAllergyFactory(severity=severity)
            assert allergy.severity == severity

    def test_allergy_linked_to_patient_not_pregnancy(self):
        """Allergy is a field on patient, not pregnancy (BR-PAT-05)."""
        patient = PatientFactory()
        allergy = PatientAllergyFactory(patient=patient)
        assert allergy.patient == patient
        assert patient.allergies.filter(id=allergy.id).exists()


@pytest.mark.django_db
class TestStaffModel:
    """Tests for Staff model."""

    def test_staff_creation(self):
        staff = StaffFactory(full_name="Dr. Sharma", designation="Obstetrician")
        assert staff.full_name == "Dr. Sharma"
        assert staff.is_active is True

    def test_staff_active_default(self):
        """New staff defaults to active."""
        staff = StaffFactory()
        assert staff.is_active is True

    def test_staff_str(self):
        staff = StaffFactory(full_name="Meena", designation="Nurse")
        assert "Meena" in str(staff)
        assert "Nurse" in str(staff)


@pytest.mark.django_db
class TestDoctorModel:
    """Tests for Doctor model (one-to-one with Staff)."""

    def test_doctor_creation(self):
        doctor = DoctorFactory(specialisation="Gynecology")
        assert doctor.specialisation == "Gynecology"
        assert doctor.registration_no.startswith("REG-")

    def test_doctor_is_active_delegates_to_staff(self):
        """Doctor.is_active returns staff.is_active."""
        doctor = DoctorFactory()
        assert doctor.is_active == doctor.staff.is_active
        doctor.staff.is_active = False
        doctor.staff.save()
        assert doctor.is_active is False

    def test_doctor_unique_registration_no(self):
        """Two doctors cannot have the same registration number."""
        from django.db import IntegrityError
        DoctorFactory(registration_no="MCI-001")
        with pytest.raises(IntegrityError):
            DoctorFactory(registration_no="MCI-001")

    def test_doctor_full_name_from_staff(self):
        """Doctor.full_name proxies to staff.full_name."""
        staff = StaffFactory(full_name="Dr. Patel")
        doctor = DoctorFactory(staff=staff)
        assert doctor.full_name == "Dr. Patel"

    def test_doctor_str(self):
        staff = StaffFactory(full_name="Kavita Rao")
        doctor = DoctorFactory(staff=staff, specialisation="Obstetrics")
        assert "Kavita Rao" in str(doctor)
        assert "Obstetrics" in str(doctor)
