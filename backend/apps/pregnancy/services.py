"""
MotherCare — Pregnancy Module Services
Architecture: CLAUDE.md — "Service layer: all business logic lives here"

Services:
    calculate_gestational_week(lmp)         — Week from LMP
    calculate_trimester(week)               — Trimester from week
    calculate_edd_from_lmp(lmp)             — Naegele's Rule EDD
    validate_pregnancy_dates(lmp, edd)      — LMP/EDD validation
    create_pregnancy(...)                   — BR-PAT-04 active pregnancy guard
    update_pregnancy(...)                   — Gestational week refresh
    soft_delete_pregnancy(...)              — BR-SD-01 soft delete
    sync_gestational_week(pregnancy)        — Refresh week + trimester from LMP
    record_anc_visit(...)                   — ANC visit creation
    update_anc_visit(...)                   — ANC visit update
    record_risk_event(...)                  — Risk event creation
    set_vaccination_status(...)             — Vaccine status update
    get_or_create_wellness_plan(...)        — 1:1 wellness plan upsert
    update_wellness_plan(...)               — Wellness plan update
"""
from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import Any

from django.db import transaction

from apps.pregnancy.constants import (
    TRIMESTER_1_MAX_WEEK,
    TRIMESTER_2_MAX_WEEK,
    VACC_STATUS_ADMINISTERED,
    VACC_STATUS_DUE,
)
from apps.pregnancy.models import (
    AncVisit,
    Pregnancy,
    PregnancyRiskEvent,
    Vaccination,
    WellnessPlan,
)

logger = logging.getLogger("mothercare")

# ─────────────────────────────────────────────────────────────────────────────
# Pure calculation helpers (no DB access)
# ─────────────────────────────────────────────────────────────────────────────

def calculate_gestational_week(lmp: date) -> int:
    """
    Calculate current gestational week from Last Menstrual Period.

    Naegele's Rule: weeks = (today - lmp).days // 7
    Clamped to 1–45 per DB CHECK constraint.

    Args:
        lmp: Last Menstrual Period date.

    Returns:
        Integer week number, clamped to 1–45.
    """
    today = date.today()
    if lmp > today:
        return 1
    days = (today - lmp).days
    week = max(1, min(45, days // 7))
    return week


def calculate_trimester(week: int) -> int:
    """
    Derive trimester from gestational week.

    Boundaries per clinical standard:
        Trimester 1: weeks 1–13
        Trimester 2: weeks 14–27
        Trimester 3: weeks 28+
    """
    if week <= TRIMESTER_1_MAX_WEEK:
        return 1
    if week <= TRIMESTER_2_MAX_WEEK:
        return 2
    return 3


def calculate_edd_from_lmp(lmp: date) -> date:
    """
    Calculate Estimated Due Date from LMP using Naegele's Rule.
    EDD = LMP + 280 days (40 weeks).
    """
    return lmp + timedelta(days=280)


def validate_pregnancy_dates(lmp: date, edd: date) -> None:
    """
    Validate LMP and EDD business rules.

    Rules:
        - LMP must not be in the future
        - EDD must be after LMP (BR: DB CHECK)
        - EDD must be within 300 days of LMP (prevents data entry errors)

    Raises:
        ValueError: with human-readable message on validation failure.
    """
    today = date.today()
    if lmp > today:
        raise ValueError("LMP (Last Menstrual Period) cannot be in the future.")
    if edd <= lmp:
        raise ValueError("EDD (Estimated Due Date) must be after LMP.")
    max_edd = lmp + timedelta(days=300)
    if edd > max_edd:
        raise ValueError(
            f"EDD is too far from LMP ({(edd - lmp).days} days). "
            "Expected gestational period is 40 weeks (280 days)."
        )


# ─────────────────────────────────────────────────────────────────────────────
# Audit helper
# ─────────────────────────────────────────────────────────────────────────────

def _write_audit(
    action_type: str,
    entity_name: str,
    entity_id: str,
    user: object,
    old_value: dict | None = None,
    new_value: dict | None = None,
) -> None:
    """Write an AuditLog entry. Failures are logged but never re-raised."""
    try:
        from apps.audit.utils import log_event
        log_event(
            action_type=action_type,
            entity_name=entity_name,
            entity_id=entity_id,
            user=user,
            old_value=old_value or {},
            new_value=new_value or {},
        )
    except Exception:  # noqa: BLE001
        logger.exception("AuditLog write failed for %s %s", entity_name, entity_id)


# ─────────────────────────────────────────────────────────────────────────────
# Pregnancy CRUD
# ─────────────────────────────────────────────────────────────────────────────

@transaction.atomic
def create_pregnancy(
    validated_data: dict[str, Any],
    created_by: object,
) -> Pregnancy:
    """
    Create a new Pregnancy record.

    Business Rules:
        BR-PAT-04: A patient may have zero or one ACTIVE pregnancy at any time.
                   Guard check runs inside this transaction (SELECT FOR UPDATE).
        Auto-calculates: current_week, trimester from LMP.
        If edd is not provided, it is calculated from LMP via Naegele's Rule.

    Args:
        validated_data: Validated data from PregnancyWriteSerializer.
        created_by: User performing the action.

    Returns:
        Created Pregnancy instance.

    Raises:
        ValueError: If patient already has an active pregnancy (BR-PAT-04).
        ValueError: On LMP/EDD validation failure.
    """
    patient = validated_data["patient"]
    lmp: date = validated_data["lmp"]
    edd: date = validated_data.get("edd") or calculate_edd_from_lmp(lmp)

    # Validate dates
    validate_pregnancy_dates(lmp, edd)

    # BR-PAT-04: Check for existing active pregnancy (lock for race-condition safety)
    existing_active = (
        Pregnancy.objects.select_for_update()
        .filter(patient=patient, is_active=True, is_deleted=False)
        .first()
    )
    if existing_active:
        raise ValueError(
            f"Patient {patient.mrn} already has an active pregnancy "
            f"(id={existing_active.id}). Cannot create a second active pregnancy. "
            "Please conclude the existing pregnancy first. [BR-PAT-04]"
        )

    # Auto-calculate gestational week and trimester
    current_week = calculate_gestational_week(lmp)
    trimester = calculate_trimester(current_week)

    pregnancy = Pregnancy.objects.create(
        patient=patient,
        assigned_doctor=validated_data.get("assigned_doctor"),
        lmp=lmp,
        edd=edd,
        current_week=current_week,
        trimester=trimester,
        risk_status=validated_data.get("risk_status", "normal"),
        gravida=validated_data.get("gravida", 1),
        para=validated_data.get("para", 0),
        chronic_conditions=validated_data.get("chronic_conditions", ""),
        is_active=validated_data.get("is_active", True),
        created_by=created_by,
    )

    _write_audit(
        action_type="create",
        entity_name="Pregnancy",
        entity_id=str(pregnancy.id),
        user=created_by,
        new_value={
            "patient_id": str(patient.id),
            "mrn": patient.mrn,
            "lmp": str(lmp),
            "edd": str(edd),
            "current_week": current_week,
            "trimester": trimester,
            "risk_status": pregnancy.risk_status,
        },
    )

    logger.info("Pregnancy created: id=%s patient=%s lmp=%s", pregnancy.id, patient.mrn, lmp)
    return pregnancy


@transaction.atomic
def update_pregnancy(
    pregnancy: Pregnancy,
    validated_data: dict[str, Any],
    updated_by: object,
) -> Pregnancy:
    """
    Update a Pregnancy record. Re-calculates week/trimester if LMP changes.

    Args:
        pregnancy: Existing Pregnancy instance.
        validated_data: Validated partial or full update data.
        updated_by: User performing the update.

    Returns:
        Updated Pregnancy instance.
    """
    old_snapshot = {
        "lmp": str(pregnancy.lmp),
        "edd": str(pregnancy.edd),
        "risk_status": pregnancy.risk_status,
        "current_week": pregnancy.current_week,
    }

    lmp = validated_data.get("lmp", pregnancy.lmp)
    edd = validated_data.get("edd", pregnancy.edd)

    if "lmp" in validated_data or "edd" in validated_data:
        validate_pregnancy_dates(lmp, edd)

    # Auto-recalculate if LMP changed
    if "lmp" in validated_data:
        validated_data["current_week"] = calculate_gestational_week(lmp)
        validated_data["trimester"] = calculate_trimester(validated_data["current_week"])

    for field, value in validated_data.items():
        setattr(pregnancy, field, value)

    pregnancy.save()

    _write_audit(
        action_type="update",
        entity_name="Pregnancy",
        entity_id=str(pregnancy.id),
        user=updated_by,
        old_value=old_snapshot,
        new_value={k: str(v) for k, v in validated_data.items()},
    )

    logger.info("Pregnancy updated: id=%s", pregnancy.id)
    return pregnancy


@transaction.atomic
def soft_delete_pregnancy(pregnancy: Pregnancy, deleted_by: object) -> Pregnancy:
    """
    Soft-delete a Pregnancy record (BR-SD-01).
    Sets is_deleted=True, is_active=False, records deleted_at.

    Args:
        pregnancy: Pregnancy to soft-delete.
        deleted_by: User performing the deletion.

    Returns:
        Soft-deleted Pregnancy instance.
    """
    if pregnancy.is_deleted:
        raise ValueError(f"Pregnancy {pregnancy.id} is already soft-deleted.")

    pregnancy.soft_delete(user=deleted_by)
    pregnancy.is_active = False
    pregnancy.save(update_fields=["is_active"])

    logger.info("Pregnancy soft-deleted: id=%s by=%s", pregnancy.id, deleted_by)
    return pregnancy


@transaction.atomic
def sync_gestational_week(pregnancy: Pregnancy) -> Pregnancy:
    """
    Recalculate and persist current_week and trimester from LMP.
    Called by periodic scheduler or on-demand from dashboard refresh.
    """
    new_week = calculate_gestational_week(pregnancy.lmp)
    new_trimester = calculate_trimester(new_week)

    if new_week != pregnancy.current_week or new_trimester != pregnancy.trimester:
        pregnancy.current_week = new_week
        pregnancy.trimester = new_trimester
        pregnancy.save(update_fields=["current_week", "trimester", "updated_at"])
        logger.info(
            "Pregnancy %s gestational week synced: week=%s trimester=%s",
            pregnancy.id, new_week, new_trimester,
        )

    return pregnancy


# ─────────────────────────────────────────────────────────────────────────────
# ANC Visit
# ─────────────────────────────────────────────────────────────────────────────

@transaction.atomic
def record_anc_visit(
    pregnancy: Pregnancy,
    validated_data: dict[str, Any],
    created_by: object,
) -> AncVisit:
    """
    Record a new ANC visit for a pregnancy.

    Auto-populates week_at_visit if not provided (uses pregnancy.current_week).
    """
    if not validated_data.get("week_at_visit"):
        validated_data["week_at_visit"] = pregnancy.current_week

    visit = AncVisit.objects.create(
        pregnancy=pregnancy,
        created_by=created_by,
        **validated_data,
    )

    _write_audit(
        action_type="create",
        entity_name="AncVisit",
        entity_id=str(visit.id),
        user=created_by,
        new_value={
            "pregnancy_id": str(pregnancy.id),
            "visit_date": str(visit.visit_date),
            "week_at_visit": visit.week_at_visit,
            "visit_type": visit.visit_type,
        },
    )

    logger.info("ANCVisit created: id=%s pregnancy=%s week=%s", visit.id, pregnancy.id, visit.week_at_visit)
    return visit


@transaction.atomic
def update_anc_visit(
    visit: AncVisit,
    validated_data: dict[str, Any],
    updated_by: object,
) -> AncVisit:
    """Update an existing ANC visit."""
    for field, value in validated_data.items():
        setattr(visit, field, value)
    visit.save()

    _write_audit(
        action_type="update",
        entity_name="AncVisit",
        entity_id=str(visit.id),
        user=updated_by,
        new_value={k: str(v) for k, v in validated_data.items()},
    )
    return visit


# ─────────────────────────────────────────────────────────────────────────────
# Risk Events
# ─────────────────────────────────────────────────────────────────────────────

@transaction.atomic
def record_risk_event(
    pregnancy: Pregnancy,
    validated_data: dict[str, Any],
    created_by: object,
) -> PregnancyRiskEvent:
    """
    Record a new risk milestone event on a pregnancy.

    Optionally updates the pregnancy.risk_status if the new event is at
    a higher severity than current.
    """
    event = PregnancyRiskEvent.objects.create(
        pregnancy=pregnancy,
        recorded_by=created_by,
        created_by=created_by,
        **validated_data,
    )

    # Escalate pregnancy risk_status if this event is more severe
    _maybe_escalate_risk(pregnancy, event.risk_level)

    _write_audit(
        action_type="create",
        entity_name="PregnancyRiskEvent",
        entity_id=str(event.id),
        user=created_by,
        new_value={
            "pregnancy_id": str(pregnancy.id),
            "risk_level": event.risk_level,
            "event_description": event.event_description[:100],
        },
    )
    return event


def _maybe_escalate_risk(pregnancy: Pregnancy, event_risk_level: str) -> None:
    """
    Escalate pregnancy.risk_status if the incoming risk event is more severe.
    Severity order: normal < high_risk < critical
    """
    severity_order: dict[str, int] = {"normal": 0, "low": 0, "moderate": 1, "high": 2, "high_risk": 2, "critical": 3}
    current_severity = severity_order.get(pregnancy.risk_status, 0)
    event_severity = severity_order.get(event_risk_level, 0)

    if event_severity >= 2 and current_severity < event_severity:
        new_status = "critical" if event_severity >= 3 else "high_risk"
        pregnancy.risk_status = new_status
        pregnancy.save(update_fields=["risk_status", "updated_at"])
        logger.info(
            "Pregnancy %s risk escalated to %s due to risk event",
            pregnancy.id, new_status,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Vaccinations
# ─────────────────────────────────────────────────────────────────────────────

@transaction.atomic
def set_vaccination_status(
    vaccination: Vaccination,
    validated_data: dict[str, Any],
    updated_by: object,
) -> Vaccination:
    """
    Update a vaccination record status.

    Validation:
        - 'administered' status requires administered_date.
    """
    new_status = validated_data.get("status", vaccination.status)
    administered_date = validated_data.get("administered_date", vaccination.administered_date)

    if new_status == VACC_STATUS_ADMINISTERED and not administered_date:
        raise ValueError(
            "administered_date is required when setting vaccination status to 'administered'."
        )

    old_status = vaccination.status
    for field, value in validated_data.items():
        setattr(vaccination, field, value)
    vaccination.save()

    _write_audit(
        action_type="update",
        entity_name="Vaccination",
        entity_id=str(vaccination.id),
        user=updated_by,
        old_value={"status": old_status},
        new_value={"status": new_status, "administered_date": str(administered_date)},
    )
    return vaccination


@transaction.atomic
def create_vaccination(
    pregnancy: Pregnancy,
    validated_data: dict[str, Any],
    created_by: object,
) -> Vaccination:
    """Create a new vaccination entry for a pregnancy."""
    vaccination = Vaccination.objects.create(
        pregnancy=pregnancy,
        created_by=created_by,
        **validated_data,
    )
    _write_audit(
        action_type="create",
        entity_name="Vaccination",
        entity_id=str(vaccination.id),
        user=created_by,
        new_value={"pregnancy_id": str(pregnancy.id), "vaccine_name": vaccination.vaccine_name},
    )
    return vaccination


@transaction.atomic
def initialize_standard_vaccinations(pregnancy: Pregnancy, created_by: object) -> list[Vaccination]:
    """
    Create the standard maternal vaccination schedule for a new pregnancy.
    Uses STANDARD_MATERNAL_VACCINES from constants.

    Called automatically when a pregnancy is created.
    """
    from apps.pregnancy.constants import STANDARD_MATERNAL_VACCINES

    vaccinations = []
    for vaccine in STANDARD_MATERNAL_VACCINES:
        vacc = Vaccination.objects.create(
            pregnancy=pregnancy,
            vaccine_name=vaccine["name"],
            status=VACC_STATUS_DUE,
            due_week_start=vaccine.get("due_week_start"),
            due_week_end=vaccine.get("due_week_end"),
            created_by=created_by,
        )
        vaccinations.append(vacc)

    logger.info(
        "Standard vaccinations initialized: pregnancy=%s count=%d",
        pregnancy.id, len(vaccinations),
    )
    return vaccinations


# ─────────────────────────────────────────────────────────────────────────────
# Wellness Plan
# ─────────────────────────────────────────────────────────────────────────────

@transaction.atomic
def get_or_create_wellness_plan(
    pregnancy: Pregnancy,
    created_by: object,
) -> tuple[WellnessPlan, bool]:
    """
    Get or create the WellnessPlan for a pregnancy (1:1 relationship).

    Returns:
        (WellnessPlan, created: bool)
    """
    plan, created = WellnessPlan.objects.get_or_create(
        pregnancy=pregnancy,
        defaults={"created_by": created_by},
    )
    if created:
        _write_audit(
            action_type="create",
            entity_name="WellnessPlan",
            entity_id=str(plan.id),
            user=created_by,
            new_value={"pregnancy_id": str(pregnancy.id)},
        )
    return plan, created


@transaction.atomic
def update_wellness_plan(
    plan: WellnessPlan,
    validated_data: dict[str, Any],
    updated_by: object,
) -> WellnessPlan:
    """Update the WellnessPlan for a pregnancy."""
    old_snapshot = {
        "dietary_protocol": plan.dietary_protocol,
        "dietary_items": plan.dietary_items,
        "daily_precautions": plan.daily_precautions,
    }
    for field, value in validated_data.items():
        setattr(plan, field, value)
    plan.save()

    _write_audit(
        action_type="update",
        entity_name="WellnessPlan",
        entity_id=str(plan.id),
        user=updated_by,
        old_value=old_snapshot,
        new_value=dict(validated_data),
    )
    return plan
