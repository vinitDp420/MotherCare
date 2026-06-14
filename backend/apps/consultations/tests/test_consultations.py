"""
MotherCare — Consultation Tests
Tests: creation rules, status lifecycle, auto-appointment transitions, follow-up.
"""
from __future__ import annotations

from datetime import timedelta

import pytest
from django.utils import timezone

from apps.appointments.constants import (
    STATUS_COMPLETED as APPT_COMPLETED,
)
from apps.appointments.constants import (
    STATUS_CONFIRMED,
    STATUS_SCHEDULED,
)
from apps.appointments.constants import (
    STATUS_IN_PROGRESS as APPT_IN_PROGRESS,
)
from apps.appointments.tests.factories import AppointmentFactory, ConfirmedAppointmentFactory
from apps.consultations.constants import (
    CONS_STATUS_CANCELLED,
    CONS_STATUS_COMPLETED,
    CONS_STATUS_IN_PROGRESS,
)
from apps.consultations.models import Consultation
from apps.consultations.services import (
    cancel_consultation,
    complete_consultation,
    create_consultation,
    schedule_follow_up,
    update_clinical_notes,
)
from apps.consultations.tests.factories import ConsultationFactory
from apps.people.tests.factories import UserFactory


# ─────────────────────────────────────────────────────────────────────────────
# Consultation Creation Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestCreateConsultation:
    """BR-CONS-01/02/03: Creation rules."""

    def test_create_from_confirmed_appointment(self) -> None:
        """Happy path: create consultation from confirmed appointment."""
        appt = ConfirmedAppointmentFactory(status=STATUS_CONFIRMED)
        user = UserFactory()

        cons = create_consultation(appointment=appt, created_by=user)

        assert cons.id is not None
        assert cons.status == CONS_STATUS_IN_PROGRESS
        assert cons.patient == appt.patient
        assert cons.doctor == appt.doctor

    def test_create_advances_appointment_to_in_progress(self) -> None:
        """BR-APPT-08: Creating consultation auto-advances appointment to in_progress."""
        appt = ConfirmedAppointmentFactory(status=STATUS_CONFIRMED)
        user = UserFactory()

        create_consultation(appointment=appt, created_by=user)

        appt.refresh_from_db()
        assert appt.status == APPT_IN_PROGRESS

    def test_create_from_already_in_progress_appointment(self) -> None:
        """Appointment already in_progress also allows consultation creation."""
        appt = AppointmentFactory(status=APPT_IN_PROGRESS)
        user = UserFactory()

        cons = create_consultation(appointment=appt, created_by=user)
        assert cons.status == CONS_STATUS_IN_PROGRESS

    def test_cannot_create_from_scheduled_appointment(self) -> None:
        """BR-CONS-02: Scheduled (not confirmed) appointment cannot create consultation."""
        appt = AppointmentFactory(status=STATUS_SCHEDULED)
        user = UserFactory()

        with pytest.raises(ValueError, match="BR-CONS-02"):
            create_consultation(appointment=appt, created_by=user)

    def test_cannot_create_duplicate_consultation(self) -> None:
        """BR-CONS-01: One appointment = one consultation."""
        appt = ConfirmedAppointmentFactory(status=STATUS_CONFIRMED)
        user = UserFactory()

        create_consultation(appointment=appt, created_by=user)

        # Reload appointment to trigger hasattr check
        from apps.appointments.models import Appointment
        appt = Appointment.objects.select_related("consultation").get(id=appt.id)

        with pytest.raises(ValueError, match="BR-CONS-01"):
            create_consultation(appointment=appt, created_by=user)

    def test_patient_and_doctor_copied_from_appointment(self) -> None:
        """BR-CONS-03: patient/doctor are denormalised from appointment."""
        appt = ConfirmedAppointmentFactory()
        user = UserFactory()

        cons = create_consultation(appointment=appt, created_by=user)

        assert cons.patient_id == appt.patient_id
        assert cons.doctor_id == appt.doctor_id


# ─────────────────────────────────────────────────────────────────────────────
# Consultation Completion Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestCompleteConsultation:
    """BR-CONS-07/BR-APPT-09: Completion and immutability."""

    def test_complete_consultation(self) -> None:
        cons = ConsultationFactory()
        user = UserFactory()

        completed = complete_consultation(
            consultation=cons,
            clinical_notes="Final notes.",
            diagnosis="G1P0 — Normal pregnancy.",
            updated_by=user,
        )

        assert completed.status == CONS_STATUS_COMPLETED
        assert completed.end_time is not None
        assert completed.clinical_notes == "Final notes."

    def test_complete_advances_appointment_to_completed(self) -> None:
        """BR-APPT-09: Appointment auto-completes when consultation completes."""
        appt = AppointmentFactory(status=APPT_IN_PROGRESS)
        cons = ConsultationFactory(appointment=appt)
        user = UserFactory()

        complete_consultation(consultation=cons, updated_by=user)

        appt.refresh_from_db()
        assert appt.status == APPT_COMPLETED

    def test_cannot_complete_already_completed_consultation(self) -> None:
        cons = ConsultationFactory(status=CONS_STATUS_COMPLETED)
        user = UserFactory()

        with pytest.raises(ValueError, match="in_progress"):
            complete_consultation(consultation=cons, updated_by=user)

    def test_completed_consultation_is_immutable(self) -> None:
        """BR-CONS-07: Cannot edit notes of a completed consultation."""
        cons = ConsultationFactory(status=CONS_STATUS_COMPLETED)
        user = UserFactory()

        with pytest.raises(ValueError, match="BR-CONS-07"):
            update_clinical_notes(
                consultation=cons,
                clinical_notes="Trying to edit after completion.",
                updated_by=user,
            )


# ─────────────────────────────────────────────────────────────────────────────
# Consultation Cancellation Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestCancelConsultation:
    def test_cancel_in_progress_consultation(self) -> None:
        cons = ConsultationFactory()
        user = UserFactory()

        cancelled = cancel_consultation(cons, user, reason="Patient left.")
        assert cancelled.status == CONS_STATUS_CANCELLED
        assert cancelled.end_time is not None

    def test_cannot_cancel_completed_consultation(self) -> None:
        cons = ConsultationFactory(status=CONS_STATUS_COMPLETED)
        user = UserFactory()

        with pytest.raises(ValueError, match="in_progress"):
            cancel_consultation(cons, user)


# ─────────────────────────────────────────────────────────────────────────────
# Clinical Notes Update Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestUpdateClinicalNotes:
    def test_update_notes_in_progress(self) -> None:
        cons = ConsultationFactory(clinical_notes="Initial notes.")
        user = UserFactory()

        updated = update_clinical_notes(
            consultation=cons,
            clinical_notes="Updated notes with more detail.",
            diagnosis="Gestational diabetes suspected.",
            updated_by=user,
        )
        assert updated.clinical_notes == "Updated notes with more detail."
        assert updated.diagnosis == "Gestational diabetes suspected."

    def test_cannot_update_notes_when_cancelled(self) -> None:
        cons = ConsultationFactory(status=CONS_STATUS_CANCELLED)
        user = UserFactory()

        with pytest.raises(ValueError, match="BR-CONS-07"):
            update_clinical_notes(cons, "new notes", updated_by=user)


# ─────────────────────────────────────────────────────────────────────────────
# Follow-Up Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestScheduleFollowUp:
    """BR-CONS-09/10: Follow-up scheduling."""

    def test_schedule_follow_up_creates_appointment(self) -> None:
        cons = ConsultationFactory()
        user = UserFactory()
        follow_up_dt = timezone.now() + timedelta(days=14)

        follow_up_appt = schedule_follow_up(
            consultation=cons,
            follow_up_datetime=follow_up_dt,
            notes="Review GDM screening results.",
            created_by=user,
        )

        assert follow_up_appt is not None
        assert follow_up_appt.appointment_type == "follow_up"
        assert follow_up_appt.patient == cons.patient
        assert follow_up_appt.doctor == cons.doctor

    def test_follow_up_saves_datetime_on_consultation(self) -> None:
        cons = ConsultationFactory()
        user = UserFactory()
        follow_up_dt = timezone.now() + timedelta(days=7)

        schedule_follow_up(
            consultation=cons,
            follow_up_datetime=follow_up_dt,
            created_by=user,
        )

        cons.refresh_from_db()
        assert cons.follow_up_datetime is not None

    def test_follow_up_in_past_raises(self) -> None:
        cons = ConsultationFactory()
        user = UserFactory()

        with pytest.raises(ValueError, match="future"):
            schedule_follow_up(
                consultation=cons,
                follow_up_datetime=timezone.now() - timedelta(hours=1),
                created_by=user,
            )


# ─────────────────────────────────────────────────────────────────────────────
# Soft Delete Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestConsultationSoftDelete:
    def test_default_manager_excludes_deleted(self) -> None:
        active = ConsultationFactory()
        deleted = ConsultationFactory()
        deleted.soft_delete()

        ids = list(Consultation.objects.values_list("id", flat=True))
        assert active.id in ids
        assert deleted.id not in ids

    def test_all_objects_includes_deleted(self) -> None:
        active = ConsultationFactory()
        deleted = ConsultationFactory()
        deleted.soft_delete()

        ids = list(Consultation.all_objects.values_list("id", flat=True))
        assert active.id in ids
        assert deleted.id in ids
