"""
MotherCare — Admissions & Bed Management Tests
"""
import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.admissions.models import Bed, Admission, WardTransfer
from apps.admissions.constants import (
    BED_STATUS_AVAILABLE,
    BED_STATUS_OCCUPIED,
    BED_STATUS_CLEANING,
    ADMISSION_STATUS_ACTIVE,
    ADMISSION_STATUS_DISCHARGED,
)
from apps.admissions.tests.factories import BedFactory, AdmissionFactory, WardTransferFactory
from apps.people.tests.factories import PatientFactory, DoctorFactory, UserFactory, StaffFactory
from apps.admissions import services

@pytest.mark.django_db
class TestAdmissionsService:
    def test_admit_patient_success(self):
        patient = PatientFactory()
        bed = BedFactory(status=BED_STATUS_AVAILABLE)
        doctor = DoctorFactory()
        user = UserFactory()

        admission = services.admit_patient(
            patient=patient,
            bed=bed,
            doctor=doctor,
            admission_type="maternity",
            created_by=user
        )

        assert admission.status == ADMISSION_STATUS_ACTIVE
        assert admission.patient == patient
        assert admission.bed == bed
        assert admission.doctor == doctor
        
        # Bed status should be occupied
        bed.refresh_from_db()
        assert bed.status == BED_STATUS_OCCUPIED

    def test_admit_patient_already_admitted(self):
        patient = PatientFactory()
        bed1 = BedFactory(status=BED_STATUS_AVAILABLE)
        bed2 = BedFactory(status=BED_STATUS_AVAILABLE)
        doctor = DoctorFactory()
        user = UserFactory()

        # Admit first time
        services.admit_patient(
            patient=patient,
            bed=bed1,
            doctor=doctor,
            admission_type="maternity",
            created_by=user
        )

        # Try to admit second time
        with pytest.raises(ValueError, match="Patient already has an active admission"):
            services.admit_patient(
                patient=patient,
                bed=bed2,
                doctor=doctor,
                admission_type="maternity",
                created_by=user
            )

    def test_admit_patient_bed_not_available(self):
        patient = PatientFactory()
        bed = BedFactory(status=BED_STATUS_OCCUPIED)
        doctor = DoctorFactory()
        user = UserFactory()

        with pytest.raises(ValueError, match="is not available"):
            services.admit_patient(
                patient=patient,
                bed=bed,
                doctor=doctor,
                admission_type="maternity",
                created_by=user
            )

    def test_transfer_ward_success(self):
        patient = PatientFactory()
        bed_from = BedFactory(status=BED_STATUS_AVAILABLE)
        bed_to = BedFactory(status=BED_STATUS_AVAILABLE)
        doctor = DoctorFactory()
        user = UserFactory()

        admission = services.admit_patient(
            patient=patient,
            bed=bed_from,
            doctor=doctor,
            admission_type="maternity",
            created_by=user
        )

        transfer = services.transfer_ward(
            admission=admission,
            to_bed=bed_to,
            reason="Patient requested private ward",
            transferred_by=user
        )

        assert transfer.from_bed == bed_from
        assert transfer.to_bed == bed_to
        assert transfer.admission == admission

        # Check statuses
        bed_from.refresh_from_db()
        bed_to.refresh_from_db()
        admission.refresh_from_db()

        assert bed_from.status == BED_STATUS_CLEANING
        assert bed_to.status == BED_STATUS_OCCUPIED
        assert admission.bed == bed_to

    def test_transfer_ward_target_not_available(self):
        patient = PatientFactory()
        bed_from = BedFactory(status=BED_STATUS_AVAILABLE)
        bed_to = BedFactory(status=BED_STATUS_OCCUPIED)
        doctor = DoctorFactory()
        user = UserFactory()

        admission = services.admit_patient(
            patient=patient,
            bed=bed_from,
            doctor=doctor,
            admission_type="maternity",
            created_by=user
        )

        with pytest.raises(ValueError, match="is not available"):
            services.transfer_ward(
                admission=admission,
                to_bed=bed_to,
                transferred_by=user
            )

    def test_discharge_patient_success(self):
        patient = PatientFactory()
        bed = BedFactory(status=BED_STATUS_AVAILABLE)
        doctor = DoctorFactory()
        user = UserFactory()

        admission = services.admit_patient(
            patient=patient,
            bed=bed,
            doctor=doctor,
            admission_type="maternity",
            created_by=user
        )

        services.discharge_patient(
            admission=admission,
            status=ADMISSION_STATUS_DISCHARGED,
            notes="Fully recovered.",
            updated_by=user
        )

        admission.refresh_from_db()
        bed.refresh_from_db()

        assert admission.status == ADMISSION_STATUS_DISCHARGED
        assert admission.actual_discharge is not None
        assert bed.status == BED_STATUS_CLEANING

    def test_clean_bed_success(self):
        bed = BedFactory(status=BED_STATUS_CLEANING)
        user = UserFactory()

        services.clean_bed(bed, updated_by=user)

        bed.refresh_from_db()
        assert bed.status == BED_STATUS_AVAILABLE
        assert bed.last_cleaned_at is not None


@pytest.mark.django_db
class TestAdmissionsAPI:
    @pytest.fixture(autouse=True)
    def setup_client(self):
        self.client = APIClient()
        self.user = UserFactory()
        self.staff = StaffFactory(phone="1111111111")
        # Link user to staff or give correct permission
        self.user.is_staff = True
        self.user.save()
        self.client.force_authenticate(user=self.user)

    def test_create_admission_api(self):
        patient = PatientFactory()
        bed = BedFactory(status=BED_STATUS_AVAILABLE)
        doctor = DoctorFactory()

        data = {
            "patient": str(patient.id),
            "bed": str(bed.id),
            "doctor": str(doctor.id),
            "admission_type": "maternity",
            "notes": "Admitting for labor."
        }

        response = self.client.post("/api/v1/admissions/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["status"] == ADMISSION_STATUS_ACTIVE
        assert response.data["bed_number"] == bed.bed_number

    def test_transfer_admission_api(self):
        patient = PatientFactory()
        bed_from = BedFactory(status=BED_STATUS_AVAILABLE)
        bed_to = BedFactory(status=BED_STATUS_AVAILABLE)
        doctor = DoctorFactory()

        admission = services.admit_patient(
            patient=patient,
            bed=bed_from,
            doctor=doctor,
            admission_type="maternity",
            created_by=self.user
        )

        data = {
            "to_bed": str(bed_to.id),
            "reason": "Transfer reason."
        }

        response = self.client.post(f"/api/v1/admissions/{admission.id}/transfer/", data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["to_bed"]) == str(bed_to.id)

    def test_discharge_admission_api(self):
        patient = PatientFactory()
        bed = BedFactory(status=BED_STATUS_AVAILABLE)
        doctor = DoctorFactory()

        admission = services.admit_patient(
            patient=patient,
            bed=bed,
            doctor=doctor,
            admission_type="maternity",
            created_by=self.user
        )

        data = {
            "status": "discharged",
            "notes": "Healthy discharge"
        }

        response = self.client.post(f"/api/v1/admissions/{admission.id}/discharge/", data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "discharged"

    def test_clean_bed_api(self):
        bed = BedFactory(status=BED_STATUS_CLEANING)
        response = self.client.post(f"/api/v1/beds/{bed.id}/clean/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == BED_STATUS_AVAILABLE
