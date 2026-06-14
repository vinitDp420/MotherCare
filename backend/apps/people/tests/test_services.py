"""
MotherCare — People Module Service Tests
Tests for create_patient, update_patient, soft_delete_patient,
add/remove_emergency_contact, record/delete_patient_allergy,
create/update staff, create/update doctor, check_patient_allergies.
"""
import pytest

from apps.people import services
from apps.people.models import (
    EmergencyContact,
    Patient,
    PatientAllergy,
    PatientEmergencyContact,
)
from apps.people.tests.factories import (
    DoctorFactory,
    EmergencyContactFactory,
    PatientAllergyFactory,
    PatientEmergencyContactFactory,
    PatientFactory,
    StaffFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestCreatePatientService:
    """Tests for services.create_patient()."""

    def test_creates_patient_with_mrn(self):
        """Service generates an MRN automatically."""
        user = UserFactory()
        data = {
            "full_name": "Sushma Devi",
            "dob": "1990-05-15",
            "blood_group": "O+",
            "phone": "9900000001",
            "is_active": True,
        }
        patient = services.create_patient(validated_data=data, created_by=user)
        assert patient.mrn.startswith("PT-")
        assert patient.full_name == "Sushma Devi"
        assert patient.created_by == user

    def test_mrn_is_unique_across_multiple_patients(self):
        """Two patients created via service have different MRNs."""
        data1 = {
            "full_name": "Patient A", "dob": "1985-01-01",
            "blood_group": "A+", "phone": "9900000002", "is_active": True,
        }
        data2 = {
            "full_name": "Patient B", "dob": "1992-06-20",
            "blood_group": "B+", "phone": "9900000003", "is_active": True,
        }
        p1 = services.create_patient(validated_data=data1)
        p2 = services.create_patient(validated_data=data2)
        assert p1.mrn != p2.mrn


@pytest.mark.django_db
class TestUpdatePatientService:
    """Tests for services.update_patient()."""

    def test_updates_patient_fields(self):
        patient = PatientFactory(phone="9900001111")
        services.update_patient(
            patient=patient,
            validated_data={"phone": "9900002222"},
        )
        patient.refresh_from_db()
        assert patient.phone == "9900002222"

    def test_mrn_not_changed_by_update(self):
        """MRN is immutable — update service does not touch it."""
        patient = PatientFactory()
        original_mrn = patient.mrn
        services.update_patient(
            patient=patient,
            validated_data={"full_name": "New Name"},
        )
        patient.refresh_from_db()
        assert patient.mrn == original_mrn


@pytest.mark.django_db
class TestSoftDeletePatientService:
    """Tests for services.soft_delete_patient()."""

    def test_soft_deletes_patient(self):
        patient = PatientFactory()
        services.soft_delete_patient(patient=patient)
        patient.refresh_from_db()
        assert patient.is_deleted is True
        assert patient.deleted_at is not None

    def test_soft_deleted_patient_not_in_queryset(self):
        patient = PatientFactory()
        pid = patient.id
        services.soft_delete_patient(patient=patient)
        assert not Patient.objects.filter(id=pid).exists()

    def test_cannot_soft_delete_twice(self):
        patient = PatientFactory()
        services.soft_delete_patient(patient=patient)
        with pytest.raises(ValueError):
            services.soft_delete_patient(patient=patient)


@pytest.mark.django_db
class TestEmergencyContactService:
    """Tests for add_emergency_contact and remove_emergency_contact."""

    def test_add_new_contact_creates_contact_and_link(self):
        patient = PatientFactory()
        data = {
            "name": "Ravi Kumar",
            "phone": "9811111111",
            "relationship_type": "spouse",
            "priority": 1,
        }
        link = services.add_emergency_contact(patient=patient, validated_data=data)
        assert link.patient == patient
        assert link.contact.name == "Ravi Kumar"
        assert link.priority == 1
        assert link.is_primary is True

    def test_add_existing_contact_by_id(self):
        patient = PatientFactory()
        contact = EmergencyContactFactory()
        data = {
            "contact_id": contact.id,
            "relationship_type": "parent",
            "priority": 2,
        }
        link = services.add_emergency_contact(patient=patient, validated_data=data)
        assert link.contact == contact
        assert link.priority == 2
        assert link.is_primary is False

    def test_remove_contact_deletes_link(self):
        link = PatientEmergencyContactFactory(priority=1)
        link_id = link.id
        services.remove_emergency_contact(link=link)
        assert not PatientEmergencyContact.objects.filter(id=link_id).exists()

    def test_remove_contact_does_not_delete_contact_record(self):
        """Removing a link does not delete the EmergencyContact entity itself."""
        contact = EmergencyContactFactory()
        link = PatientEmergencyContactFactory(contact=contact, priority=1)
        contact_id = contact.id
        services.remove_emergency_contact(link=link)
        assert EmergencyContact.objects.filter(id=contact_id).exists()


@pytest.mark.django_db
class TestAllergyService:
    """Tests for record_patient_allergy and check_patient_allergies (BR-RX-05)."""

    def test_record_allergy_creates_record(self):
        from datetime import date

        patient = PatientFactory()
        data = {
            "allergen": "Penicillin",
            "severity": "severe",
            "reaction_type": "anaphylaxis",
            "recorded_date": date.today(),
        }
        allergy = services.record_patient_allergy(patient=patient, validated_data=data)
        assert allergy.allergen == "Penicillin"
        assert allergy.patient == patient

    def test_delete_allergy_removes_record(self):
        allergy = PatientAllergyFactory()
        aid = allergy.id
        services.delete_patient_allergy(allergy=allergy)
        assert not PatientAllergy.objects.filter(id=aid).exists()

    def test_check_patient_allergies_finds_match(self):
        """Allergy check finds a match by case-insensitive allergen name (BR-RX-05)."""
        patient = PatientFactory()
        PatientAllergyFactory(
            patient=patient,
            allergen="Penicillin",
            severity="life_threatening",
        )
        results = services.check_patient_allergies(
            patient_id=str(patient.id),
            medicine_generic_name="penicillin",  # lowercase → iexact match
        )
        assert len(results) == 1
        assert results[0]["is_blocking"] is True

    def test_check_patient_allergies_no_match(self):
        patient = PatientFactory()
        PatientAllergyFactory(patient=patient, allergen="Aspirin", severity="mild")
        results = services.check_patient_allergies(
            patient_id=str(patient.id),
            medicine_generic_name="Paracetamol",
        )
        assert results == []

    def test_blocking_flag_set_for_severe_allergies(self):
        patient = PatientFactory()
        for severity in ["mild", "moderate"]:
            PatientAllergyFactory(patient=patient, allergen=f"Drug-{severity}", severity=severity)
        for severity in ["severe", "life_threatening"]:
            PatientAllergyFactory(patient=patient, allergen=f"Drug-{severity}", severity=severity)

        for severity in ["mild", "moderate"]:
            results = services.check_patient_allergies(str(patient.id), f"drug-{severity}")
            assert results[0]["is_blocking"] is False

        for severity in ["severe", "life_threatening"]:
            results = services.check_patient_allergies(str(patient.id), f"drug-{severity}")
            assert results[0]["is_blocking"] is True


@pytest.mark.django_db
class TestStaffService:
    """Tests for create_staff and update_staff."""

    def test_create_staff(self):
        from datetime import date

        data = {
            "full_name": "Nurse Geeta",
            "designation": "Senior Nurse",
            "phone": "8800001111",
            "join_date": date.today(),
            "is_active": True,
        }
        staff = services.create_staff(validated_data=data)
        assert staff.full_name == "Nurse Geeta"
        assert staff.id is not None

    def test_update_staff(self):
        staff = StaffFactory(designation="Nurse")
        services.update_staff(staff=staff, validated_data={"designation": "Senior Nurse"})
        staff.refresh_from_db()
        assert staff.designation == "Senior Nurse"


@pytest.mark.django_db
class TestDoctorService:
    """Tests for create_doctor and update_doctor."""

    def test_create_doctor(self):
        staff = StaffFactory()
        data = {
            "staff": staff,
            "specialisation": "Obstetrics",
            "registration_no": "MCI-TEST-001",
            "available_from": "08:00:00",
            "available_to": "16:00:00",
        }
        doctor = services.create_doctor(validated_data=data)
        assert doctor.specialisation == "Obstetrics"
        assert doctor.staff == staff

    def test_update_doctor_specialisation(self):
        doctor = DoctorFactory(specialisation="General")
        services.update_doctor(
            doctor=doctor,
            validated_data={"specialisation": "Obstetrics & Gynecology"},
        )
        doctor.refresh_from_db()
        assert doctor.specialisation == "Obstetrics & Gynecology"
