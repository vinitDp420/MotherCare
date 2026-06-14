"""
MotherCare — Newborn Module Tests
"""
import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.newborn.models import Newborn, NewbornVaccination, NewbornFeedingLog, NewbornVital
from apps.newborn.constants import VACCINE_STATUS_ADMINISTERED, VACCINE_STATUS_DUE
from apps.newborn.tests.factories import (
    NewbornFactory,
    NewbornVaccinationFactory,
    NewbornFeedingLogFactory,
    NewbornVitalFactory,
)
from apps.delivery.tests.factories import DeliveryFactory
from apps.people.tests.factories import PatientFactory, DoctorFactory, UserFactory, StaffFactory
from apps.newborn import services

@pytest.mark.django_db
class TestNewbornService:
    def test_register_newborn_success(self):
        delivery = DeliveryFactory()
        user = UserFactory()

        newborn = services.register_newborn(
            delivery=delivery,
            gender="M",
            birth_weight_kg=3.250,
            apgar_1min=8,
            apgar_5min=9,
            condition="healthy",
            created_by=user
        )

        assert newborn.baby_mrn.startswith(f"NB-{timezone.now().year}-")
        assert newborn.gender == "M"
        assert newborn.apgar_1min == 8
        assert newborn.apgar_5min == 9

        # Enforce BR-NB-10: BCG, Hepatitis B, OPV Dose 0 are initialized
        vaccinations = list(newborn.vaccinations.all())
        assert len(vaccinations) == 3
        vaccine_names = [v.vaccine_name for v in vaccinations]
        assert "BCG" in vaccine_names
        assert "Hepatitis B" in vaccine_names
        assert "OPV" in vaccine_names

    def test_register_newborn_invalid_apgar(self):
        delivery = DeliveryFactory()
        user = UserFactory()

        with pytest.raises(ValueError, match="APGAR scores must be between 0 and 10"):
            services.register_newborn(
                delivery=delivery,
                gender="M",
                birth_weight_kg=3.250,
                apgar_1min=11,
                apgar_5min=9,
                created_by=user
            )

    def test_record_feeding_breast_success(self):
        newborn = NewbornFactory()
        user = UserFactory()

        log = services.record_feeding(
            newborn=newborn,
            feed_type="breast",
            created_by=user
        )
        assert log.feed_type == "breast"
        assert log.volume_ml is None

    def test_record_feeding_formula_success(self):
        newborn = NewbornFactory()
        user = UserFactory()

        log = services.record_feeding(
            newborn=newborn,
            feed_type="formula",
            volume_ml=40.0,
            created_by=user
        )
        assert log.feed_type == "formula"
        assert log.volume_ml == 40.0

    def test_record_feeding_formula_missing_volume(self):
        newborn = NewbornFactory()
        user = UserFactory()

        with pytest.raises(ValueError, match="Volume in ml is required"):
            services.record_feeding(
                newborn=newborn,
                feed_type="formula",
                created_by=user
            )

    def test_set_vaccination_status_administered_missing_date(self):
        vaccination = NewbornVaccinationFactory()
        user = UserFactory()

        with pytest.raises(ValueError, match="Administered date is required"):
            services.set_newborn_vaccination_status(
                vaccination=vaccination,
                status=VACCINE_STATUS_ADMINISTERED,
                updated_by=user
            )

    def test_set_vaccination_status_administered_success(self):
        vaccination = NewbornVaccinationFactory()
        user = UserFactory()
        today = timezone.now().date()

        updated_vac = services.set_newborn_vaccination_status(
            vaccination=vaccination,
            status=VACCINE_STATUS_ADMINISTERED,
            administered_date=today,
            updated_by=user
        )

        assert updated_vac.status == VACCINE_STATUS_ADMINISTERED
        assert updated_vac.administered_date == today


@pytest.mark.django_db
class TestNewbornAPI:
    @pytest.fixture(autouse=True)
    def setup_client(self):
        self.client = APIClient()
        self.user = UserFactory()
        self.staff = StaffFactory(phone="3333333333")
        self.user.is_staff = True
        self.user.save()
        self.client.force_authenticate(user=self.user)

    def test_register_newborn_api(self):
        delivery = DeliveryFactory()
        data = {
            "delivery": str(delivery.id),
            "gender": "F",
            "birth_weight_kg": 2.950,
            "birth_length_cm": 48.0,
            "apgar_1min": 9,
            "apgar_5min": 10,
            "condition": "healthy",
            "nicu_required": False
        }

        response = self.client.post("/api/v1/newborns/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["gender"] == "F"
        assert response.data["baby_mrn"] is not None

    def test_record_feeding_api_success(self):
        newborn = NewbornFactory()
        data = {
            "feed_type": "formula",
            "volume_ml": 50.0,
            "notes": "Fed well."
        }

        response = self.client.post(f"/api/v1/newborns/{newborn.id}/feeding/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["feed_type"] == "formula"
        assert float(response.data["volume_ml"]) == 50.0

    def test_record_feeding_api_validation_error(self):
        newborn = NewbornFactory()
        data = {
            "feed_type": "formula",
            "volume_ml": None
        }

        response = self.client.post(f"/api/v1/newborns/{newborn.id}/feeding/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_update_vaccination_api_success(self):
        newborn = NewbornFactory()
        # Newborn registration creates 3 default vaccinations
        vaccination = NewbornVaccinationFactory(newborn=newborn)

        data = {
            "vaccination_id": str(vaccination.id),
            "status": "administered",
            "administered_date": timezone.now().date().isoformat()
        }

        response = self.client.patch(f"/api/v1/newborns/{newborn.id}/update-vaccination/", data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "administered"
