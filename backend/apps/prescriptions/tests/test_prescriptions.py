"""
MotherCare — Prescription Tests
Tests: immutability, creation, history, duplicate workflow.
"""
from __future__ import annotations

import pytest

from apps.appointments.tests.factories import ConsultationFactory
from apps.consultations.constants import CONS_STATUS_CANCELLED, CONS_STATUS_COMPLETED
from apps.people.tests.factories import PatientFactory, UserFactory
from apps.prescriptions.services import (
    create_full_prescription,
    create_prescription,
    duplicate_previous_prescription,
    get_patient_prescription_history,
)
from apps.prescriptions.tests.factories import (
    MedicineFactory,
    PrescriptionFactory,
    PrescriptionItemFactory,
)


# ─────────────────────────────────────────────────────────────────────────────
# Prescription Creation Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestCreatePrescription:
    """BR-RX-01/02: Creation rules."""

    def test_create_prescription_success(self) -> None:
        """Happy path: create prescription for in_progress consultation."""
        cons = ConsultationFactory()  # status=in_progress
        user = UserFactory()

        rx = create_prescription(
            consultation=cons,
            patient=cons.patient,
            notes="Take with food.",
            created_by=user,
        )

        assert rx.id is not None
        assert rx.consultation == cons
        assert rx.patient == cons.patient

    def test_create_prescription_for_completed_consultation(self) -> None:
        """Completed consultations can also receive prescriptions (e.g. post-visit)."""
        cons = ConsultationFactory(status=CONS_STATUS_COMPLETED)
        user = UserFactory()

        rx = create_prescription(
            consultation=cons,
            patient=cons.patient,
            created_by=user,
        )
        assert rx.id is not None

    def test_create_prescription_requires_non_cancelled_consultation(self) -> None:
        """BR-RX-02: Cannot prescribe for a cancelled consultation."""
        cons = ConsultationFactory(status=CONS_STATUS_CANCELLED)
        user = UserFactory()

        with pytest.raises(ValueError, match="BR-RX-02"):
            create_prescription(
                consultation=cons,
                patient=cons.patient,
                created_by=user,
            )

    def test_create_full_prescription_with_items(self) -> None:
        """create_full_prescription creates header + all items atomically."""
        cons = ConsultationFactory()
        user = UserFactory()
        med1 = MedicineFactory(name="Paracetamol", category="tablet")
        med2 = MedicineFactory(name="Folic Acid", category="tablet")

        rx = create_full_prescription(
            consultation=cons,
            patient=cons.patient,
            notes="Routine ANC prescription.",
            items_data=[
                {"medicine": med1, "dosage": "500mg", "frequency": "OD", "duration": "7 days", "instructions": "", "sort_order": 0},
                {"medicine": med2, "dosage": "5mg", "frequency": "OD", "duration": "30 days", "instructions": "Take before breakfast.", "sort_order": 1},
            ],
            created_by=user,
        )

        assert rx.id is not None
        assert rx.items.count() == 2

    def test_create_full_prescription_no_items_is_valid(self) -> None:
        """Prescription with zero items is allowed (items can be added context)."""
        cons = ConsultationFactory()
        user = UserFactory()

        rx = create_full_prescription(
            consultation=cons,
            patient=cons.patient,
            notes="",
            items_data=[],
            created_by=user,
        )
        assert rx.id is not None
        assert rx.items.count() == 0


# ─────────────────────────────────────────────────────────────────────────────
# Prescription Immutability Tests (BR-RX-01)
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestPrescriptionImmutability:
    """BR-RX-01: Prescriptions cannot be updated or deleted via API."""

    def test_prescription_viewset_http_methods(self) -> None:
        """PrescriptionViewSet only allows GET and POST (not PUT, PATCH, DELETE)."""
        from apps.prescriptions.views import PrescriptionViewSet
        allowed = PrescriptionViewSet.http_method_names
        assert "get" in allowed
        assert "post" in allowed
        assert "put" not in allowed
        assert "patch" not in allowed
        assert "delete" not in allowed

    def test_prescription_item_sort_order_preserved(self) -> None:
        """Items are stored in sort_order — verify ordering."""
        rx = PrescriptionFactory()
        med_a = MedicineFactory(name="Med A Unique", category="tablet")
        med_b = MedicineFactory(name="Med B Unique", category="tablet")

        PrescriptionItemFactory(prescription=rx, medicine=med_b, sort_order=2)
        PrescriptionItemFactory(prescription=rx, medicine=med_a, sort_order=1)

        items = list(rx.items.order_by("sort_order"))
        assert items[0].medicine == med_a
        assert items[1].medicine == med_b

    def test_item_count_property(self) -> None:
        rx = PrescriptionFactory()
        PrescriptionItemFactory(prescription=rx)
        PrescriptionItemFactory(prescription=rx)
        assert rx.item_count == 2


# ─────────────────────────────────────────────────────────────────────────────
# Prescription History Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestPrescriptionHistory:
    """get_patient_prescription_history returns history ordered by -issued_at."""

    def test_get_patient_prescription_history(self) -> None:
        patient = PatientFactory()
        # Three prescriptions for same patient
        rx1 = PrescriptionFactory(patient=patient)
        rx2 = PrescriptionFactory(patient=patient)
        rx3 = PrescriptionFactory(patient=patient)

        history = list(get_patient_prescription_history(patient, limit=10))
        ids = [rx.id for rx in history]

        assert rx1.id in ids
        assert rx2.id in ids
        assert rx3.id in ids

    def test_history_limit_respected(self) -> None:
        """Limit parameter caps the returned queryset."""
        patient = PatientFactory()
        for _ in range(12):
            PrescriptionFactory(patient=patient)

        history = list(get_patient_prescription_history(patient, limit=10))
        assert len(history) == 10

    def test_history_excludes_other_patients(self) -> None:
        """Prescription history is patient-specific."""
        patient_a = PatientFactory()
        patient_b = PatientFactory()

        rx_a = PrescriptionFactory(patient=patient_a)
        PrescriptionFactory(patient=patient_b)

        history = list(get_patient_prescription_history(patient_a))
        ids = [rx.id for rx in history]

        assert rx_a.id in ids
        assert len(ids) == 1


# ─────────────────────────────────────────────────────────────────────────────
# Duplicate Prescription Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestDuplicatePrescription:
    """duplicate_previous_prescription copies all items to a new prescription."""

    def test_duplicate_prescription_creates_new_prescription(self) -> None:
        user = UserFactory()
        source_rx = PrescriptionFactory()
        med = MedicineFactory(name="Iron Tablet Dup", category="tablet")
        PrescriptionItemFactory(prescription=source_rx, medicine=med)

        new_cons = ConsultationFactory(patient=source_rx.patient)
        new_rx = duplicate_previous_prescription(
            source_prescription=source_rx,
            consultation=new_cons,
            patient=source_rx.patient,
            created_by=user,
        )

        assert new_rx.id != source_rx.id
        assert new_rx.patient == source_rx.patient
        assert new_rx.items.count() == 1

    def test_duplicate_copies_all_items(self) -> None:
        user = UserFactory()
        source_rx = PrescriptionFactory()
        med1 = MedicineFactory(name="Drug Alpha Dup", category="tablet")
        med2 = MedicineFactory(name="Drug Beta Dup", category="capsule")
        PrescriptionItemFactory(prescription=source_rx, medicine=med1)
        PrescriptionItemFactory(prescription=source_rx, medicine=med2)

        new_cons = ConsultationFactory(patient=source_rx.patient)
        new_rx = duplicate_previous_prescription(
            source_prescription=source_rx,
            consultation=new_cons,
            patient=source_rx.patient,
            created_by=user,
        )

        assert new_rx.items.count() == 2

    def test_duplicate_notes_reference_source(self) -> None:
        """Notes on duplicated prescription reference the source prescription ID."""
        user = UserFactory()
        source_rx = PrescriptionFactory()
        new_cons = ConsultationFactory(patient=source_rx.patient)

        new_rx = duplicate_previous_prescription(
            source_prescription=source_rx,
            consultation=new_cons,
            patient=source_rx.patient,
            created_by=user,
        )

        assert str(source_rx.id) in new_rx.notes

    def test_duplicate_preserves_dosage_and_frequency(self) -> None:
        user = UserFactory()
        source_rx = PrescriptionFactory()
        med = MedicineFactory(name="Calcium Dup", category="tablet")
        item = PrescriptionItemFactory(
            prescription=source_rx,
            medicine=med,
            dosage="1g",
            frequency="BD",
            duration="30 days",
        )

        new_cons = ConsultationFactory(patient=source_rx.patient)
        new_rx = duplicate_previous_prescription(
            source_prescription=source_rx,
            consultation=new_cons,
            patient=source_rx.patient,
            created_by=user,
        )

        new_item = new_rx.items.first()
        assert new_item.dosage == item.dosage
        assert new_item.frequency == item.frequency
        assert new_item.duration == item.duration


# ─────────────────────────────────────────────────────────────────────────────
# Prescription API Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.fixture
def auth_client() -> APIClient:
    """Authenticated API client using UserSessionAuthentication."""
    from datetime import timedelta
    from django.utils import timezone
    from apps.auth_rbac.models import UserSession
    from core.utils import generate_session_token, hash_token
    from rest_framework.test import APIClient

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


@pytest.mark.django_db
class TestPrescriptionAPI:
    def test_list_prescriptions(self, auth_client: APIClient) -> None:
        PrescriptionFactory()
        response = auth_client.get("/api/v1/prescriptions/")
        assert response.status_code == 200
        assert "results" in response.data

    def test_create_prescription(self, auth_client: APIClient) -> None:
        cons = ConsultationFactory()
        med = MedicineFactory()
        data = {
            "consultation": str(cons.id),
            "patient": str(cons.patient.id),
            "notes": "Take daily",
            "items": [
                {
                    "medicine": str(med.id),
                    "dosage": "1 tablet",
                    "frequency": "OD",
                    "duration": "7 days",
                    "instructions": "After lunch",
                    "sort_order": 0,
                }
            ],
        }
        response = auth_client.post("/api/v1/prescriptions/", data, format="json")
        assert response.status_code == 201
        assert response.data["notes"] == "Take daily"

    def test_prescription_immutable_endpoints(self, auth_client: APIClient) -> None:
        rx = PrescriptionFactory()
        response = auth_client.put(f"/api/v1/prescriptions/{rx.id}/", {"notes": "new notes"})
        assert response.status_code == 405

        response = auth_client.delete(f"/api/v1/prescriptions/{rx.id}/")
        assert response.status_code == 405

    def test_duplicate_prescription_endpoint(self, auth_client: APIClient) -> None:
        rx = PrescriptionFactory()
        # Create a new consultation for the duplicate destination
        new_cons = ConsultationFactory(patient=rx.patient)
        data = {
            "consultation": str(new_cons.id),
            "patient": str(rx.patient.id),
        }
        response = auth_client.post(f"/api/v1/prescriptions/{rx.id}/duplicate/", data, format="json")
        assert response.status_code == 201
        assert "id" in response.data

    def test_patient_history_endpoint(self, auth_client: APIClient) -> None:
        patient = PatientFactory()
        PrescriptionFactory(patient=patient)
        response = auth_client.get("/api/v1/prescriptions/history/", {"patient": str(patient.id)})
        assert response.status_code == 200
        assert isinstance(response.data, list)
        assert len(response.data) == 1

    def test_prescription_detail_fields(self, auth_client: APIClient) -> None:
        from datetime import date
        from apps.people.tests.factories import DoctorFactory
        patient = PatientFactory(dob=date(2000, 1, 1))
        doctor = DoctorFactory(registration_no="DOC-12345")
        rx = PrescriptionFactory(patient=patient, doctor=doctor)
        response = auth_client.get(f"/api/v1/prescriptions/{rx.id}/")
        assert response.status_code == 200
        assert "patient_age" in response.data
        assert response.data["patient_age"] == date.today().year - 2000 - ((date.today().month, date.today().day) < (1, 1))
        assert response.data["doctor_name"] == doctor.staff.full_name
        assert response.data["doctor_registration_no"] == "DOC-12345"

    def test_export_pdf_endpoint(self, auth_client: APIClient) -> None:
        rx = PrescriptionFactory()
        response = auth_client.get(f"/api/v1/prescriptions/{rx.id}/export/")
        assert response.status_code == 200
        assert response["Content-Type"] == "application/pdf"
