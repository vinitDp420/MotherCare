"""
MotherCare — People Module API Tests
Tests for PatientViewSet, StaffViewSet, DoctorViewSet endpoints.
Covers CRUD, sub-resources (allergies, emergency-contacts), soft delete.
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.people.tests.factories import (
    DoctorFactory,
    PatientAllergyFactory,
    PatientEmergencyContactFactory,
    PatientFactory,
    StaffFactory,
    UserFactory,
)


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def auth_client() -> APIClient:
    """Authenticated API client using UserSessionAuthentication."""
    from datetime import timedelta

    from django.utils import timezone

    from apps.auth_rbac.models import UserSession
    from core.utils import generate_session_token, hash_token

    user = UserFactory()
    raw_token = generate_session_token()
    token_hash = hash_token(raw_token)
    UserSession.objects.create(
        user=user,
        token_hash=token_hash,
        expires_at=timezone.now() + timedelta(hours=8),
    )
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Token {raw_token}")
    client._user = user
    return client


# ─────────────────────────────────────────────────────────────────────────────
# Patient API Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestPatientListAPI:
    """GET /api/v1/patients/"""

    def test_unauthenticated_returns_401(self, api_client):
        url = "/api/v1/patients/"
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authenticated_returns_200(self, auth_client):
        PatientFactory.create_batch(3)
        response = auth_client.get("/api/v1/patients/")
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data

    def test_list_excludes_soft_deleted(self, auth_client):
        active = PatientFactory()
        deleted = PatientFactory()
        deleted.soft_delete()

        response = auth_client.get("/api/v1/patients/")
        assert response.status_code == status.HTTP_200_OK
        ids = [r["id"] for r in response.data["results"]]
        assert str(active.id) in ids
        assert str(deleted.id) not in ids

    def test_search_by_mrn(self, auth_client: APIClient) -> None:
        PatientFactory(mrn="PT-1234-B")
        response = auth_client.get("/api/v1/patients/", {"search": "PT-1234-B"})
        assert response.status_code == status.HTTP_200_OK
        assert any(r["mrn"] == "PT-1234-B" for r in response.data["results"])

    def test_search_by_phone(self, auth_client: APIClient) -> None:
        PatientFactory(phone="9876543210")
        response = auth_client.get("/api/v1/patients/", {"search": "9876543210"})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) >= 1


@pytest.mark.django_db
class TestPatientCreateAPI:
    """POST /api/v1/patients/"""

    def test_create_patient_success(self, auth_client):
        data = {
            "full_name": "Kavita Mishra",
            "dob": "1992-03-10",
            "blood_group": "B+",
            "phone": "9811122233",
            "is_active": True,
        }
        response = auth_client.post("/api/v1/patients/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["full_name"] == "Kavita Mishra"
        assert response.data["mrn"].startswith("PT-")

    def test_create_patient_missing_required_fields(self, auth_client):
        """Missing full_name should return 400."""
        data = {"dob": "1990-01-01", "blood_group": "O+", "phone": "9000000001"}
        response = auth_client.post("/api/v1/patients/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_patient_future_dob_rejected(self, auth_client):
        """DOB in the future is rejected by serializer validation."""
        data = {
            "full_name": "Future Patient",
            "dob": "2099-01-01",
            "blood_group": "O+",
            "phone": "9000000002",
        }
        response = auth_client.post("/api/v1/patients/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestPatientDetailAPI:
    """GET/PUT/PATCH/DELETE /api/v1/patients/{id}/"""

    def test_retrieve_patient(self, auth_client):
        patient = PatientFactory()
        response = auth_client.get(f"/api/v1/patients/{patient.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["mrn"] == patient.mrn

    def test_update_patient(self, auth_client):
        patient = PatientFactory(phone="9900001234")
        response = auth_client.patch(
            f"/api/v1/patients/{patient.id}/",
            {"phone": "9900005678"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["phone"] == "9900005678"

    def test_soft_delete_patient(self, auth_client):
        """DELETE endpoint performs soft delete, not hard delete (BR-PAT-10)."""
        patient = PatientFactory()
        response = auth_client.delete(f"/api/v1/patients/{patient.id}/")
        assert response.status_code == status.HTTP_200_OK
        patient.refresh_from_db()
        assert patient.is_deleted is True


@pytest.mark.django_db
class TestPatientAllergyAPI:
    """Tests for /api/v1/patients/{id}/allergies/"""

    def test_list_allergies(self, auth_client):
        patient = PatientFactory()
        PatientAllergyFactory.create_batch(2, patient=patient)
        response = auth_client.get(f"/api/v1/patients/{patient.id}/allergies/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 2

    def test_add_allergy(self, auth_client):
        from datetime import date

        patient = PatientFactory()
        data = {
            "allergen": "Sulfa",
            "severity": "severe",
            "reaction_type": "Hives",
            "recorded_date": str(date.today()),
        }
        response = auth_client.post(
            f"/api/v1/patients/{patient.id}/allergies/", data, format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["allergen"] == "Sulfa"
        assert response.data["is_blocking"] is True

    def test_delete_allergy(self, auth_client):
        patient = PatientFactory()
        allergy = PatientAllergyFactory(patient=patient)
        response = auth_client.delete(
            f"/api/v1/patients/{patient.id}/allergies/{allergy.id}/"
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.django_db
class TestPatientEmergencyContactAPI:
    """Tests for /api/v1/patients/{id}/emergency-contacts/"""

    def test_list_emergency_contacts(self, auth_client):
        patient = PatientFactory()
        PatientEmergencyContactFactory(patient=patient, priority=1)
        response = auth_client.get(f"/api/v1/patients/{patient.id}/emergency-contacts/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_add_emergency_contact(self, auth_client):
        patient = PatientFactory()
        data = {
            "name": "Arun Mehta",
            "phone": "9700000001",
            "relationship_type": "spouse",
            "priority": 1,
        }
        response = auth_client.post(
            f"/api/v1/patients/{patient.id}/emergency-contacts/",
            data, format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["contact"]["name"] == "Arun Mehta"

    def test_delete_emergency_contact(self, auth_client):
        patient = PatientFactory()
        link = PatientEmergencyContactFactory(patient=patient, priority=1)
        response = auth_client.delete(
            f"/api/v1/patients/{patient.id}/emergency-contacts/{link.id}/"
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT


# ─────────────────────────────────────────────────────────────────────────────
# Staff API Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestStaffAPI:
    """Tests for /api/v1/staff/"""

    def test_list_staff(self, auth_client):
        StaffFactory.create_batch(2)
        response = auth_client.get("/api/v1/staff/")
        assert response.status_code == status.HTTP_200_OK

    def test_create_staff(self, auth_client):
        from datetime import date

        data = {
            "full_name": "Nurse Anita",
            "designation": "Nurse",
            "phone": "9500001111",
            "join_date": str(date.today()),
            "is_active": True,
        }
        response = auth_client.post("/api/v1/staff/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["full_name"] == "Nurse Anita"

    def test_retrieve_staff(self, auth_client):
        staff = StaffFactory()
        response = auth_client.get(f"/api/v1/staff/{staff.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["full_name"] == staff.full_name


# ─────────────────────────────────────────────────────────────────────────────
# Doctor API Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestDoctorAPI:
    """Tests for /api/v1/doctors/"""

    def test_list_doctors(self, auth_client):
        DoctorFactory.create_batch(2)
        response = auth_client.get("/api/v1/doctors/")
        assert response.status_code == status.HTTP_200_OK

    def test_create_doctor(self, auth_client):
        staff = StaffFactory()
        data = {
            "staff": str(staff.id),
            "specialisation": "Obstetrics",
            "registration_no": "MCI-API-001",
            "available_from": "09:00:00",
            "available_to": "17:00:00",
        }
        response = auth_client.post("/api/v1/doctors/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["specialisation"] == "Obstetrics"

    def test_retrieve_doctor(self, auth_client):
        doctor = DoctorFactory()
        response = auth_client.get(f"/api/v1/doctors/{doctor.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["registration_no"] == doctor.registration_no
