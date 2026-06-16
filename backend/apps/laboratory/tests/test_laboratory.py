"""
MotherCare — Laboratory Tests
Tests: ordering, status transitions, STAT queue priority, report upload, flagging.
"""
from __future__ import annotations

import pytest

from apps.laboratory.constants import (
    STATUS_CANCELLED,
    STATUS_COMPLETED,
    STATUS_CRITICAL,
    STATUS_IN_PROGRESS,
    STATUS_PENDING,
    URGENCY_ROUTINE,
    URGENCY_STAT,
)
from apps.laboratory.models import LabReportFile
from apps.laboratory.services import (
    flag_lab_test,
    get_flagged_results,
    get_lab_queue,
    order_lab_test,
    update_lab_status,
    upload_lab_report,
)
from apps.laboratory.tests.factories import (
    LabTestFactory,
    StatLabTestFactory,
    UrgentLabTestFactory,
)
from apps.people.tests.factories import DoctorFactory, PatientFactory, UserFactory


# ─────────────────────────────────────────────────────────────────────────────
# Lab Test Ordering
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestOrderLabTest:
    def test_order_lab_test_success(self) -> None:
        """Happy path: order creates LabTest with status=pending."""
        patient = PatientFactory()
        doctor = DoctorFactory()
        user = UserFactory()

        lab_test = order_lab_test(
            validated_data={
                "patient": patient,
                "ordered_by": doctor,
                "test_type": "cbc",
                "urgency": URGENCY_ROUTINE,
                "notes": "Routine ANC CBC",
            },
            created_by=user,
        )

        assert lab_test.id is not None
        assert lab_test.status == STATUS_PENDING
        assert lab_test.urgency == URGENCY_ROUTINE
        assert lab_test.patient == patient
        assert lab_test.ordered_by == doctor

    def test_order_lab_test_stat_urgency(self) -> None:
        """STAT test is created with correct urgency."""
        patient = PatientFactory()
        doctor = DoctorFactory()
        user = UserFactory()

        lab_test = order_lab_test(
            validated_data={
                "patient": patient,
                "ordered_by": doctor,
                "test_type": "hiv",
                "urgency": URGENCY_STAT,
                "notes": "Urgent screening",
            },
            created_by=user,
        )

        assert lab_test.urgency == URGENCY_STAT
        assert lab_test.status == STATUS_PENDING

    def test_standalone_lab_test_no_consultation(self) -> None:
        """consultation=None is valid — tests can be ordered standalone."""
        patient = PatientFactory()
        doctor = DoctorFactory()
        user = UserFactory()

        lab_test = order_lab_test(
            validated_data={
                "patient": patient,
                "ordered_by": doctor,
                "test_type": "thyroid",
                "urgency": URGENCY_ROUTINE,
                "notes": "",
                "consultation": None,
            },
            created_by=user,
        )

        assert lab_test.consultation is None
        assert lab_test.id is not None


# ─────────────────────────────────────────────────────────────────────────────
# Status Transition Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestLabStatusTransitions:
    def test_pending_to_in_progress(self) -> None:
        lab = LabTestFactory(status=STATUS_PENDING)
        user = UserFactory()

        updated = update_lab_status(lab, STATUS_IN_PROGRESS, updated_by=user)
        assert updated.status == STATUS_IN_PROGRESS

    def test_in_progress_to_completed(self) -> None:
        lab = LabTestFactory(status=STATUS_IN_PROGRESS)
        user = UserFactory()

        updated = update_lab_status(lab, STATUS_COMPLETED, key_findings="Normal.", updated_by=user)

        assert updated.status == STATUS_COMPLETED
        assert updated.completed_at is not None
        assert updated.key_findings == "Normal."

    def test_in_progress_to_critical(self) -> None:
        """BR-LAB-02: Critical status auto-flags and sets completed_at."""
        lab = LabTestFactory(status=STATUS_IN_PROGRESS)
        user = UserFactory()

        updated = update_lab_status(lab, STATUS_CRITICAL, key_findings="Hb < 7 g/dL", updated_by=user)

        assert updated.status == STATUS_CRITICAL
        assert updated.flagged is True
        assert updated.completed_at is not None

    def test_pending_to_cancelled(self) -> None:
        lab = LabTestFactory(status=STATUS_PENDING)
        user = UserFactory()

        updated = update_lab_status(lab, STATUS_CANCELLED, updated_by=user)
        assert updated.status == STATUS_CANCELLED

    def test_completed_cannot_transition(self) -> None:
        """Terminal status: completed cannot move further."""
        lab = LabTestFactory(status=STATUS_COMPLETED)
        user = UserFactory()

        with pytest.raises(ValueError, match="terminal status"):
            update_lab_status(lab, STATUS_IN_PROGRESS, updated_by=user)

    def test_cancelled_cannot_transition(self) -> None:
        lab = LabTestFactory(status=STATUS_CANCELLED)
        user = UserFactory()

        with pytest.raises(ValueError, match="terminal status"):
            update_lab_status(lab, STATUS_PENDING, updated_by=user)

    def test_invalid_pending_to_completed_directly(self) -> None:
        """pending → completed directly is not allowed (must go through in_progress)."""
        lab = LabTestFactory(status=STATUS_PENDING)
        user = UserFactory()

        with pytest.raises(ValueError, match="Invalid status transition"):
            update_lab_status(lab, STATUS_COMPLETED, updated_by=user)


# ─────────────────────────────────────────────────────────────────────────────
# Lab Queue Tests (STAT > Urgent > Routine)
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestLabQueue:
    def test_queue_returns_pending_only_by_default(self) -> None:
        """Queue returns only pending tests."""
        pending = LabTestFactory(status=STATUS_PENDING)
        completed = LabTestFactory(status=STATUS_COMPLETED)

        queue_ids = list(get_lab_queue().values_list("id", flat=True))

        assert pending.id in queue_ids
        assert completed.id not in queue_ids

    def test_queue_stat_before_urgent_before_routine(self) -> None:
        """BR-LAB-03: STAT tests appear before urgent, urgent before routine."""
        routine = LabTestFactory(urgency=URGENCY_ROUTINE, status=STATUS_PENDING)
        urgent = UrgentLabTestFactory(status=STATUS_PENDING)
        stat = StatLabTestFactory(status=STATUS_PENDING)

        queue = list(get_lab_queue())
        ids = [t.id for t in queue]

        # All three should be in queue
        assert stat.id in ids
        assert urgent.id in ids
        assert routine.id in ids

        # STAT must come before Urgent, Urgent before Routine
        assert ids.index(stat.id) < ids.index(urgent.id)
        assert ids.index(urgent.id) < ids.index(routine.id)

    def test_queue_urgency_filter(self) -> None:
        """Filtering by urgency=stat returns only STAT tests."""
        StatLabTestFactory(status=STATUS_PENDING)
        StatLabTestFactory(status=STATUS_PENDING)
        LabTestFactory(urgency=URGENCY_ROUTINE, status=STATUS_PENDING)

        stat_queue = list(get_lab_queue(urgency_filter=URGENCY_STAT))

        assert all(t.urgency == URGENCY_STAT for t in stat_queue)
        assert len(stat_queue) == 2

    def test_queue_in_progress_filter(self) -> None:
        """Queue can be filtered to show in_progress tests."""
        LabTestFactory(status=STATUS_IN_PROGRESS)
        LabTestFactory(status=STATUS_PENDING)

        in_progress_queue = list(get_lab_queue(status_filter=STATUS_IN_PROGRESS))
        assert all(t.status == STATUS_IN_PROGRESS for t in in_progress_queue)


# ─────────────────────────────────────────────────────────────────────────────
# Lab Report Upload Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestLabReportUpload:
    def test_upload_report_success(self) -> None:
        """Upload creates a LabReportFile."""
        lab = LabTestFactory(status=STATUS_IN_PROGRESS)
        user = UserFactory()

        report = upload_lab_report(
            lab_test=lab,
            file_url="https://s3.example.com/reports/cbc-001.pdf",
            file_type="pdf",
            notes="Final CBC result.",
            uploaded_by=user,
        )

        assert report.id is not None
        assert report.lab_test == lab
        assert report.file_type == "pdf"

    def test_upload_report_pending_raises(self) -> None:
        """BR-LAB-01: Cannot upload report for a pending test."""
        lab = LabTestFactory(status=STATUS_PENDING)
        user = UserFactory()

        with pytest.raises(ValueError, match="pending"):
            upload_lab_report(
                lab_test=lab,
                file_url="https://s3.example.com/reports/test.pdf",
                file_type="pdf",
                uploaded_by=user,
            )

    def test_upload_multiple_reports_append_only(self) -> None:
        """BR-LAB-01: Multiple uploads create separate rows — old ones preserved."""
        lab = LabTestFactory(status=STATUS_IN_PROGRESS)
        user = UserFactory()

        upload_lab_report(
            lab_test=lab,
            file_url="https://s3.example.com/reports/interim.pdf",
            file_type="pdf",
            notes="Interim result.",
            uploaded_by=user,
        )
        upload_lab_report(
            lab_test=lab,
            file_url="https://s3.example.com/reports/final.pdf",
            file_type="pdf",
            notes="Final result.",
            uploaded_by=user,
        )

        count = LabReportFile.objects.filter(lab_test=lab).count()
        assert count == 2

    def test_upload_dicom_file_type(self) -> None:
        """DICOM file type is accepted."""
        lab = LabTestFactory(status=STATUS_IN_PROGRESS)
        user = UserFactory()

        report = upload_lab_report(
            lab_test=lab,
            file_url="https://pacs.example.com/scans/anomaly-001.dcm",
            file_type="dicom",
            uploaded_by=user,
        )

        assert report.file_type == "dicom"


# ─────────────────────────────────────────────────────────────────────────────
# Flag Lab Test Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestFlagLabTest:
    def test_flag_sets_flagged_true(self) -> None:
        lab = LabTestFactory(flagged=False)
        user = UserFactory()

        flagged = flag_lab_test(lab, updated_by=user)

        assert flagged.flagged is True

    def test_flag_does_not_change_status(self) -> None:
        """Flagging is independent of status."""
        lab = LabTestFactory(status=STATUS_IN_PROGRESS, flagged=False)
        user = UserFactory()

        flagged = flag_lab_test(lab, updated_by=user)

        assert flagged.status == STATUS_IN_PROGRESS
        assert flagged.flagged is True

    def test_critical_status_auto_flags(self) -> None:
        """update_lab_status to critical auto-sets flagged=True (BR-LAB-02)."""
        lab = LabTestFactory(status=STATUS_IN_PROGRESS, flagged=False)
        user = UserFactory()

        updated = update_lab_status(lab, STATUS_CRITICAL, updated_by=user)

        assert updated.flagged is True

    def test_is_critical_property(self) -> None:
        """is_critical property returns True for critical status OR flagged."""
        lab_critical = LabTestFactory(status=STATUS_CRITICAL, flagged=False)
        lab_flagged = LabTestFactory(status=STATUS_IN_PROGRESS, flagged=True)
        lab_normal = LabTestFactory(status=STATUS_IN_PROGRESS, flagged=False)

        assert lab_critical.is_critical is True
        assert lab_flagged.is_critical is True
        assert lab_normal.is_critical is False


# ─────────────────────────────────────────────────────────────────────────────
# Flagged Results Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestFlaggedResults:
    def test_get_flagged_results_returns_only_flagged(self) -> None:
        flagged1 = LabTestFactory(flagged=True)
        flagged2 = LabTestFactory(flagged=True)
        not_flagged = LabTestFactory(flagged=False)

        results = list(get_flagged_results())
        result_ids = [t.id for t in results]

        assert flagged1.id in result_ids
        assert flagged2.id in result_ids
        assert not_flagged.id not in result_ids

    def test_unflagged_not_in_flagged_results(self) -> None:
        LabTestFactory(flagged=False)
        results = list(get_flagged_results())
        assert all(t.flagged for t in results)

    def test_flagged_results_limit(self) -> None:
        """get_flagged_results respects limit parameter."""
        for _ in range(10):
            LabTestFactory(flagged=True)

        results = list(get_flagged_results(limit=5))
        assert len(results) == 5

    def test_is_terminal_property(self) -> None:
        """is_terminal returns True for completed/cancelled/critical."""
        completed = LabTestFactory(status=STATUS_COMPLETED)
        cancelled = LabTestFactory(status=STATUS_CANCELLED)
        critical = LabTestFactory(status=STATUS_CRITICAL)
        pending = LabTestFactory(status=STATUS_PENDING)

        assert completed.is_terminal is True
        assert cancelled.is_terminal is True
        assert critical.is_terminal is True
        assert pending.is_terminal is False


# ─────────────────────────────────────────────────────────────────────────────
# Laboratory API Tests
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
class TestLaboratoryAPI:
    def test_list_lab_tests(self, auth_client: APIClient) -> None:
        LabTestFactory()
        response = auth_client.get("/api/v1/laboratory/lab-tests/")
        assert response.status_code == 200
        assert "results" in response.data

    def test_create_lab_test(self, auth_client: APIClient) -> None:
        patient = PatientFactory()
        doctor = DoctorFactory()
        data = {
            "patient": str(patient.id),
            "ordered_by": str(doctor.id),
            "test_type": "cbc",
            "urgency": "routine",
            "notes": "Test ordering",
        }
        response = auth_client.post("/api/v1/laboratory/lab-tests/", data, format="json")
        assert response.status_code == 201
        assert response.data["status"] == "pending"

    def test_update_status(self, auth_client: APIClient) -> None:
        lab = LabTestFactory(status="pending")
        data = {
            "new_status": "in_progress",
        }
        # Note: partial_update endpoint handles status transitions via serializer/service
        response = auth_client.patch(f"/api/v1/laboratory/lab-tests/{lab.id}/", data, format="json")
        assert response.status_code == 200
        assert response.data["status"] == "in_progress"

    def test_upload_report(self, auth_client: APIClient) -> None:
        from django.core.files.uploadedfile import SimpleUploadedFile
        lab = LabTestFactory(status="in_progress")
        mock_file = SimpleUploadedFile("res.pdf", b"pdf_data", content_type="application/pdf")
        data = {
            "file": mock_file,
            "notes": "Done",
        }
        response = auth_client.post(f"/api/v1/laboratory/lab-tests/{lab.id}/upload-report/", data, format="multipart")
        assert response.status_code == 201

    def test_flag_lab_test(self, auth_client: APIClient) -> None:
        lab = LabTestFactory(flagged=False)
        response = auth_client.post(f"/api/v1/laboratory/lab-tests/{lab.id}/flag/", {"reason": "Out of range"}, format="json")
        assert response.status_code == 200
        assert response.data["flagged"] is True

    def test_queue_endpoint(self, auth_client: APIClient) -> None:
        LabTestFactory(status="pending")
        response = auth_client.get("/api/v1/laboratory/lab-tests/queue/")
        assert response.status_code == 200

    def test_flagged_endpoint(self, auth_client: APIClient) -> None:
        LabTestFactory(flagged=True)
        response = auth_client.get("/api/v1/laboratory/lab-tests/flagged/")
        assert response.status_code == 200
