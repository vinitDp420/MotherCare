"""
MotherCare — Pregnancy Service & Model Tests
Tests business logic, calculations, and model constraints.
"""
from __future__ import annotations

from datetime import date, timedelta

import pytest
from django.db import IntegrityError

from apps.people.tests.factories import DoctorFactory, PatientFactory, UserFactory
from apps.pregnancy.constants import (
    RISK_STATUS_HIGH,
    RISK_STATUS_NORMAL,
    VACC_STATUS_ADMINISTERED,
    VACC_STATUS_DUE,
)
from apps.pregnancy.models import Pregnancy
from apps.pregnancy.services import (
    calculate_edd_from_lmp,
    calculate_gestational_week,
    calculate_trimester,
    create_pregnancy,
    get_or_create_wellness_plan,
    initialize_standard_vaccinations,
    record_anc_visit,
    record_risk_event,
    soft_delete_pregnancy,
    sync_gestational_week,
    update_wellness_plan,
    validate_pregnancy_dates,
)
from apps.pregnancy.tests.factories import (
    AncVisitFactory,
    PregnancyFactory,
    VaccinationFactory,
    WellnessPlanFactory,
)


# ─────────────────────────────────────────────────────────────────────────────
# Pure Calculation Tests
# ─────────────────────────────────────────────────────────────────────────────
class TestCalculationHelpers:
    """Tests for pure calculation functions — no DB required."""

    def test_gestational_week_from_lmp(self) -> None:
        """16 weeks ago LMP → week 16."""
        lmp = date.today() - timedelta(weeks=16)
        week = calculate_gestational_week(lmp)
        assert week == 16

    def test_gestational_week_clamps_to_1_for_future_lmp(self) -> None:
        """Future LMP → week 1 (data entry error tolerance)."""
        lmp = date.today() + timedelta(days=5)
        week = calculate_gestational_week(lmp)
        assert week == 1

    def test_gestational_week_clamps_to_45_max(self) -> None:
        """Very old LMP → clamped to 45."""
        lmp = date.today() - timedelta(weeks=60)
        week = calculate_gestational_week(lmp)
        assert week == 45

    def test_trimester_1_for_week_1(self) -> None:
        assert calculate_trimester(1) == 1

    def test_trimester_1_for_week_13(self) -> None:
        assert calculate_trimester(13) == 1

    def test_trimester_2_for_week_14(self) -> None:
        assert calculate_trimester(14) == 2

    def test_trimester_2_for_week_27(self) -> None:
        assert calculate_trimester(27) == 2

    def test_trimester_3_for_week_28(self) -> None:
        assert calculate_trimester(28) == 3

    def test_trimester_3_for_week_40(self) -> None:
        assert calculate_trimester(40) == 3

    def test_edd_from_lmp_naegele(self) -> None:
        """EDD = LMP + 280 days (Naegele's Rule)."""
        lmp = date(2024, 1, 1)
        edd = calculate_edd_from_lmp(lmp)
        assert edd == lmp + timedelta(days=280)

    def test_validate_dates_raises_for_future_lmp(self) -> None:
        with pytest.raises(ValueError, match="LMP.*cannot be in the future"):
            validate_pregnancy_dates(
                lmp=date.today() + timedelta(days=1),
                edd=date.today() + timedelta(days=281),
            )

    def test_validate_dates_raises_for_edd_before_lmp(self) -> None:
        lmp = date.today() - timedelta(days=30)
        with pytest.raises(ValueError, match="EDD.*must be after LMP"):
            validate_pregnancy_dates(lmp=lmp, edd=lmp - timedelta(days=1))

    def test_validate_dates_raises_for_edd_too_far(self) -> None:
        lmp = date.today() - timedelta(days=30)
        with pytest.raises(ValueError, match="too far from LMP"):
            validate_pregnancy_dates(lmp=lmp, edd=lmp + timedelta(days=400))


# ─────────────────────────────────────────────────────────────────────────────
# Pregnancy Model Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestPregnancyModel:
    """Model-level tests for Pregnancy."""

    def test_create_pregnancy(self) -> None:
        """Pregnancy can be created with valid data."""
        p = PregnancyFactory()
        assert p.id is not None
        assert p.is_active is True
        assert p.is_deleted is False

    def test_pregnancy_str(self) -> None:
        p = PregnancyFactory()
        assert "Active" in str(p)

    def test_pregnancy_is_high_risk_false_for_normal(self) -> None:
        p = PregnancyFactory(risk_status=RISK_STATUS_NORMAL)
        assert p.is_high_risk is False

    def test_pregnancy_is_high_risk_true_for_high_risk(self) -> None:
        p = PregnancyFactory(risk_status=RISK_STATUS_HIGH)
        assert p.is_high_risk is True

    def test_edd_after_lmp_db_check(self) -> None:
        """DB CHECK: edd > lmp — violated insert should raise IntegrityError."""
        from django.db import IntegrityError
        lmp = date.today() - timedelta(weeks=10)
        with pytest.raises((IntegrityError, Exception)):
            PregnancyFactory(lmp=lmp, edd=lmp - timedelta(days=1))

    def test_soft_delete_pregnancy(self) -> None:
        """Soft delete sets is_deleted=True, deleted_at, is_active remains."""
        p = PregnancyFactory()
        p.soft_delete()
        assert p.is_deleted is True
        assert p.deleted_at is not None

    def test_soft_delete_twice_raises(self) -> None:
        p = PregnancyFactory()
        p.soft_delete()
        with pytest.raises(ValueError, match="already soft-deleted"):
            p.soft_delete()

    def test_default_manager_excludes_soft_deleted(self) -> None:
        """SoftDeleteManager must filter out is_deleted=True records."""
        active = PregnancyFactory()
        deleted = PregnancyFactory()
        deleted.soft_delete()

        ids = list(Pregnancy.objects.values_list("id", flat=True))
        assert active.id in ids
        assert deleted.id not in ids

    def test_all_objects_manager_includes_deleted(self) -> None:
        """all_objects manager must return ALL rows (admin/audit use)."""
        active = PregnancyFactory()
        deleted = PregnancyFactory()
        deleted.soft_delete()

        ids = list(Pregnancy.all_objects.values_list("id", flat=True))
        assert active.id in ids
        assert deleted.id in ids


# ─────────────────────────────────────────────────────────────────────────────
# Pregnancy Service Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestCreatePregnancyService:
    """Tests for create_pregnancy service."""

    def test_create_pregnancy_success(self) -> None:
        """Happy path: create pregnancy with valid data."""
        patient = PatientFactory()
        doctor = DoctorFactory()
        user = UserFactory()
        lmp = date.today() - timedelta(weeks=16)

        pregnancy = create_pregnancy(
            validated_data={
                "patient": patient,
                "assigned_doctor": doctor,
                "lmp": lmp,
                "risk_status": RISK_STATUS_NORMAL,
                "gravida": 1,
                "para": 0,
            },
            created_by=user,
        )

        assert pregnancy.id is not None
        assert pregnancy.current_week == 16
        assert pregnancy.trimester == 2
        assert pregnancy.edd == lmp + timedelta(days=280)

    def test_create_pregnancy_br_pat_04_blocks_second_active(self) -> None:
        """BR-PAT-04: Cannot create second active pregnancy for same patient."""
        patient = PatientFactory()
        user = UserFactory()
        lmp = date.today() - timedelta(weeks=10)

        # Create first active pregnancy
        create_pregnancy(
            validated_data={"patient": patient, "lmp": lmp, "gravida": 1, "para": 0},
            created_by=user,
        )

        # Second active pregnancy for same patient must raise ValueError
        with pytest.raises(ValueError, match="already has an active pregnancy"):
            create_pregnancy(
                validated_data={
                    "patient": patient,
                    "lmp": date.today() - timedelta(weeks=5),
                    "gravida": 2,
                    "para": 1,
                },
                created_by=user,
            )

    def test_create_pregnancy_edd_auto_calculated(self) -> None:
        """EDD is auto-calculated from LMP when not provided."""
        patient = PatientFactory()
        user = UserFactory()
        lmp = date.today() - timedelta(weeks=20)

        pregnancy = create_pregnancy(
            validated_data={"patient": patient, "lmp": lmp, "gravida": 1, "para": 0},
            created_by=user,
        )

        assert pregnancy.edd == lmp + timedelta(days=280)

    def test_initialize_standard_vaccinations(self) -> None:
        """Standard vaccinations are initialized with correct count."""
        from apps.pregnancy.constants import STANDARD_MATERNAL_VACCINES
        pregnancy = PregnancyFactory()
        user = UserFactory()

        vaccinations = initialize_standard_vaccinations(pregnancy, user)
        assert len(vaccinations) == len(STANDARD_MATERNAL_VACCINES)
        for v in vaccinations:
            assert v.status == VACC_STATUS_DUE


@pytest.mark.django_db
class TestSyncGestationalWeek:
    """Tests for sync_gestational_week service."""

    def test_sync_updates_week_correctly(self) -> None:
        pregnancy = PregnancyFactory(current_week=10, trimester=1)
        # Set LMP to 24 weeks ago
        pregnancy.lmp = date.today() - timedelta(weeks=24)
        pregnancy.save()

        updated = sync_gestational_week(pregnancy)
        assert updated.current_week == 24
        assert updated.trimester == 2


@pytest.mark.django_db
class TestSoftDeletePregnancyService:
    """Tests for soft_delete_pregnancy."""

    def test_soft_delete_sets_inactive(self) -> None:
        pregnancy = PregnancyFactory(is_active=True)
        user = UserFactory()
        soft_delete_pregnancy(pregnancy, deleted_by=user)

        pregnancy.refresh_from_db()
        assert pregnancy.is_deleted is True
        assert pregnancy.is_active is False

    def test_soft_delete_already_deleted_raises(self) -> None:
        pregnancy = PregnancyFactory()
        user = UserFactory()
        soft_delete_pregnancy(pregnancy, deleted_by=user)

        with pytest.raises(ValueError):
            soft_delete_pregnancy(pregnancy, deleted_by=user)


# ─────────────────────────────────────────────────────────────────────────────
# ANC Visit Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestAncVisit:
    """ANC visit creation and validation tests."""

    def test_record_anc_visit(self) -> None:
        pregnancy = PregnancyFactory()
        doctor = DoctorFactory()
        user = UserFactory()

        visit = record_anc_visit(
            pregnancy=pregnancy,
            validated_data={
                "doctor": doctor,
                "visit_date": date.today() - timedelta(days=3),
                "week_at_visit": pregnancy.current_week,
                "visit_type": "routine",
                "bp_systolic": 118,
                "bp_diastolic": 76,
                "weight_kg": 64.5,
                "fhr_bpm": 145,
                "notes": "All normal.",
            },
            created_by=user,
        )

        assert visit.id is not None
        assert visit.bp_systolic == 118
        assert visit.pregnancy == pregnancy

    def test_anc_visit_str(self) -> None:
        v = AncVisitFactory()
        assert "Week" in str(v)


# ─────────────────────────────────────────────────────────────────────────────
# Risk Event Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestRiskEvent:
    """Risk event recording and risk escalation tests."""

    def test_record_risk_event(self) -> None:
        pregnancy = PregnancyFactory(risk_status=RISK_STATUS_NORMAL)
        user = UserFactory()

        event = record_risk_event(
            pregnancy=pregnancy,
            validated_data={
                "event_date": date.today(),
                "week_number": 24,
                "risk_level": "high",
                "event_description": "GDM detected on oral glucose test.",
            },
            created_by=user,
        )

        assert event.id is not None
        # Risk escalation: high event → pregnancy.risk_status should escalate
        pregnancy.refresh_from_db()
        assert pregnancy.risk_status == RISK_STATUS_HIGH

    def test_low_risk_event_does_not_escalate(self) -> None:
        pregnancy = PregnancyFactory(risk_status=RISK_STATUS_NORMAL)
        user = UserFactory()

        record_risk_event(
            pregnancy=pregnancy,
            validated_data={
                "event_date": date.today(),
                "week_number": 14,
                "risk_level": "low",
                "event_description": "Mild nausea reported.",
            },
            created_by=user,
        )

        pregnancy.refresh_from_db()
        assert pregnancy.risk_status == RISK_STATUS_NORMAL


# ─────────────────────────────────────────────────────────────────────────────
# Vaccination Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestVaccination:
    """Vaccination status management tests."""

    def test_vaccination_defaults_to_due(self) -> None:
        v = VaccinationFactory()
        assert v.status == VACC_STATUS_DUE

    def test_mark_vaccination_administered(self) -> None:
        from apps.pregnancy.services import set_vaccination_status
        v = VaccinationFactory()
        user = UserFactory()

        updated = set_vaccination_status(
            vaccination=v,
            validated_data={
                "status": VACC_STATUS_ADMINISTERED,
                "administered_date": date.today(),
            },
            updated_by=user,
        )
        assert updated.status == VACC_STATUS_ADMINISTERED

    def test_administered_without_date_raises(self) -> None:
        from apps.pregnancy.services import set_vaccination_status
        v = VaccinationFactory()
        user = UserFactory()

        with pytest.raises(ValueError, match="administered_date is required"):
            set_vaccination_status(
                vaccination=v,
                validated_data={"status": VACC_STATUS_ADMINISTERED},
                updated_by=user,
            )


# ─────────────────────────────────────────────────────────────────────────────
# Wellness Plan Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestWellnessPlan:
    """Wellness plan 1:1 relationship and update tests."""

    def test_get_or_create_creates_on_first_call(self) -> None:
        pregnancy = PregnancyFactory()
        user = UserFactory()
        plan, created = get_or_create_wellness_plan(pregnancy, user)
        assert created is True
        assert plan.pregnancy == pregnancy

    def test_get_or_create_returns_existing_on_second_call(self) -> None:
        pregnancy = PregnancyFactory()
        user = UserFactory()
        plan1, created1 = get_or_create_wellness_plan(pregnancy, user)
        plan2, created2 = get_or_create_wellness_plan(pregnancy, user)
        assert plan1.id == plan2.id
        assert created1 is True
        assert created2 is False

    def test_wellness_plan_one_to_one_enforced(self) -> None:
        """Cannot create two WellnessPlans for the same pregnancy."""
        pregnancy = PregnancyFactory()
        WellnessPlanFactory(pregnancy=pregnancy)
        with pytest.raises(IntegrityError):
            WellnessPlanFactory(pregnancy=pregnancy)

    def test_update_wellness_plan(self) -> None:
        plan = WellnessPlanFactory()
        user = UserFactory()
        updated = update_wellness_plan(
            plan=plan,
            validated_data={
                "dietary_protocol": "Low-GI diet for GDM management.",
                "dietary_items": ["Brown rice", "Oats", "Vegetables"],
                "daily_precautions": ["Monitor blood sugar twice daily"],
            },
            updated_by=user,
        )
        assert updated.dietary_protocol == "Low-GI diet for GDM management."
        assert "Brown rice" in updated.dietary_items


# ─────────────────────────────────────────────────────────────────────────────
# Pregnancy API Tests
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
class TestPregnancyAPI:
    def test_list_pregnancies(self, auth_client: APIClient) -> None:
        PregnancyFactory()
        response = auth_client.get("/api/v1/pregnancies/pregnancies/")
        assert response.status_code == 200
        assert "results" in response.data

    def test_retrieve_pregnancy(self, auth_client: APIClient) -> None:
        p = PregnancyFactory()
        response = auth_client.get(f"/api/v1/pregnancies/pregnancies/{p.id}/")
        assert response.status_code == 200

    def test_create_pregnancy(self, auth_client: APIClient) -> None:
        patient = PatientFactory()
        doctor = DoctorFactory()
        data = {
            "patient": str(patient.id),
            "assigned_doctor": str(doctor.id),
            "lmp": "2026-01-01",
            "edd": "2026-10-08",
            "gravida": 1,
            "para": 0,
        }
        response = auth_client.post("/api/v1/pregnancies/pregnancies/", data, format="json")
        assert response.status_code == 201

    def test_sync_week(self, auth_client: APIClient) -> None:
        p = PregnancyFactory()
        response = auth_client.post(f"/api/v1/pregnancies/pregnancies/{p.id}/sync-week/")
        assert response.status_code == 200

    def test_get_wellness_plan(self, auth_client: APIClient) -> None:
        p = PregnancyFactory()
        WellnessPlanFactory(pregnancy=p)
        response = auth_client.get(f"/api/v1/pregnancies/pregnancies/{p.id}/wellness-plan/")
        assert response.status_code == 200

    def test_update_wellness_plan(self, auth_client: APIClient) -> None:
        p = PregnancyFactory()
        WellnessPlanFactory(pregnancy=p)
        data = {
            "dietary_protocol": "New Protocol",
            "dietary_items": ["apple"],
            "daily_precautions": ["walk"],
        }
        response = auth_client.put(f"/api/v1/pregnancies/pregnancies/{p.id}/wellness-plan/", data, format="json")
        assert response.status_code == 200
