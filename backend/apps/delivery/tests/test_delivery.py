"""
MotherCare — Delivery Module Tests
"""
import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.exceptions import PermissionDenied

from apps.delivery.models import Delivery, DeliveryProcedure
from apps.delivery.constants import DELIVERY_MODE_C_SECTION, DELIVERY_MODE_NORMAL
from apps.admissions.models import Admission
from apps.admissions.constants import ADMISSION_STATUS_ACTIVE, ADMISSION_STATUS_DISCHARGED, ADMISSION_TYPE_POST_NATAL
from apps.delivery.tests.factories import DeliveryFactory, DeliveryProcedureFactory
from apps.admissions.tests.factories import AdmissionFactory
from apps.people.tests.factories import PatientFactory, DoctorFactory, UserFactory, StaffFactory
from apps.delivery import services

@pytest.mark.django_db
class TestDeliveryService:
    def test_record_delivery_normal_success(self):
        admission = AdmissionFactory(status=ADMISSION_STATUS_ACTIVE)
        patient = PatientFactory()
        doctor = DoctorFactory()
        user = UserFactory()

        delivery = services.record_delivery(
            admission=admission,
            patient=patient,
            doctor=doctor,
            delivery_datetime=timezone.now(),
            delivery_mode=DELIVERY_MODE_NORMAL,
            blood_loss_ml=300,
            placenta_complete=True,
            created_by=user
        )

        assert delivery.admission == admission
        assert delivery.delivery_mode == DELIVERY_MODE_NORMAL
        
        # Enforce BR-DEL-10: Admission type is updated to post_natal
        admission.refresh_from_db()
        assert admission.admission_type == ADMISSION_TYPE_POST_NATAL

    def test_record_delivery_c_section_success(self):
        admission = AdmissionFactory(status=ADMISSION_STATUS_ACTIVE)
        patient = PatientFactory()
        doctor = DoctorFactory()
        user = UserFactory()

        procedures_data = [
            {
                "procedure_name": "Caesarean Section",
                "duration_minutes": 45,
                "indication": "Fetal distress"
            }
        ]

        delivery = services.record_delivery(
            admission=admission,
            patient=patient,
            doctor=doctor,
            delivery_datetime=timezone.now(),
            delivery_mode=DELIVERY_MODE_C_SECTION,
            blood_loss_ml=800,
            placenta_complete=True,
            procedures_data=procedures_data,
            created_by=user
        )

        assert delivery.delivery_mode == DELIVERY_MODE_C_SECTION
        assert delivery.procedures.count() == 1
        assert delivery.procedures.first().procedure_name == "Caesarean Section"

    def test_record_delivery_c_section_missing_procedure(self):
        admission = AdmissionFactory(status=ADMISSION_STATUS_ACTIVE)
        patient = PatientFactory()
        doctor = DoctorFactory()
        user = UserFactory()

        with pytest.raises(ValueError, match="C-section deliveries require at least one 'Caesarean Section' procedure"):
            services.record_delivery(
                admission=admission,
                patient=patient,
                doctor=doctor,
                delivery_datetime=timezone.now(),
                delivery_mode=DELIVERY_MODE_C_SECTION,
                created_by=user
            )

    def test_record_delivery_inactive_admission(self):
        admission = AdmissionFactory(status=ADMISSION_STATUS_DISCHARGED)
        patient = PatientFactory()
        doctor = DoctorFactory()
        user = UserFactory()

        with pytest.raises(ValueError, match="Cannot record a delivery against an inactive or discharged admission"):
            services.record_delivery(
                admission=admission,
                patient=patient,
                doctor=doctor,
                delivery_datetime=timezone.now(),
                delivery_mode=DELIVERY_MODE_NORMAL,
                created_by=user
            )

    def test_soft_delete_delivery(self):
        delivery = DeliveryFactory()
        user = UserFactory()

        services.soft_delete_delivery(delivery, deleted_by=user)
        delivery.refresh_from_db()
        assert delivery.is_deleted is True


@pytest.mark.django_db
class TestDeliveryAPI:
    @pytest.fixture(autouse=True)
    def setup_client(self):
        self.client = APIClient()
        self.user = UserFactory()
        self.staff = StaffFactory(phone="2222222222")
        self.user.is_staff = True
        self.user.save()
        self.client.force_authenticate(user=self.user)

    def test_create_delivery_api_success(self):
        admission = AdmissionFactory(status=ADMISSION_STATUS_ACTIVE)
        patient = PatientFactory()
        doctor = DoctorFactory()

        data = {
            "admission": str(admission.id),
            "patient": str(patient.id),
            "doctor": str(doctor.id),
            "delivery_datetime": timezone.now().isoformat(),
            "delivery_mode": "normal",
            "blood_loss_ml": 250,
            "placenta_complete": True
        }

        response = self.client.post("/api/v1/delivery/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["delivery_mode"] == "normal"

    def test_delete_delivery_api_non_admin_fails(self):
        delivery = DeliveryFactory()
        # Authenticated user is not an Admin
        response = self.client.delete(f"/api/v1/delivery/{delivery.id}/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_delete_delivery_api_admin_success(self):
        # Assign Admin role to the user or make superuser
        self.user.is_superuser = True
        self.user.save()

        delivery = DeliveryFactory()
        response = self.client.delete(f"/api/v1/delivery/{delivery.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        delivery.refresh_from_db()
        assert delivery.is_deleted is True
