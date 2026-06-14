"""
MotherCare — Newborn Module Services
"""
from django.db import transaction
from django.utils import timezone
from apps.newborn.models import Newborn, NewbornVaccination, NewbornFeedingLog, NewbornVital
from apps.newborn.constants import VACCINE_STATUS_DUE, GENDER_MALE, CONDITION_HEALTHY
from core.utils import generate_baby_mrn
from apps.audit.utils import log_event

@transaction.atomic
def register_newborn(
    delivery,
    gender,
    birth_weight_kg,
    apgar_1min,
    apgar_5min,
    condition=CONDITION_HEALTHY,
    nicu_required=False,
    birth_length_cm=None,
    notes='',
    vaccinations_data=None,
    created_by=None
) -> Newborn:
    """
    Register a newborn baby, auto-generate Baby MRN, and initialize standard birth vaccinations.
    """
    # Validate APGAR bounds
    if not (0 <= apgar_1min <= 10) or not (0 <= apgar_5min <= 10):
        raise ValueError("APGAR scores must be between 0 and 10.")

    # Generate unique baby MRN
    baby_mrn = generate_baby_mrn()

    # Create Newborn
    newborn = Newborn.objects.create(
        delivery=delivery,
        baby_mrn=baby_mrn,
        gender=gender,
        birth_weight_kg=birth_weight_kg,
        birth_length_cm=birth_length_cm,
        apgar_1min=apgar_1min,
        apgar_5min=apgar_5min,
        condition=condition,
        nicu_required=nicu_required,
        notes=notes,
        created_by=created_by
    )

    # Initialize standard birth vaccinations if no custom data provided
    if vaccinations_data is None:
        standard_vaccines = [
            {"vaccine_name": "Hepatitis B", "dose_number": 1},
            {"vaccine_name": "BCG", "dose_number": 1},
            {"vaccine_name": "OPV", "dose_number": 0},
        ]
        for v in standard_vaccines:
            NewbornVaccination.objects.create(
                newborn=newborn,
                vaccine_name=v["vaccine_name"],
                dose_number=v["dose_number"],
                status=VACCINE_STATUS_DUE,
                created_by=created_by
            )
    else:
        for v in vaccinations_data:
            NewbornVaccination.objects.create(
                newborn=newborn,
                vaccine_name=v["vaccine_name"],
                dose_number=v["dose_number"],
                status=v.get("status", VACCINE_STATUS_DUE),
                administered_date=v.get("administered_date"),
                notes=v.get("notes", ""),
                created_by=created_by
            )

    # Write audit log
    log_event(
        action_type="create",
        entity_name="newborn",
        entity_id=str(newborn.id),
        user=created_by,
        new_value={
            "delivery_id": str(delivery.id),
            "baby_mrn": baby_mrn,
            "gender": gender,
            "birth_weight_kg": float(birth_weight_kg),
            "nicu_required": nicu_required
        }
    )

    return newborn


@transaction.atomic
def record_feeding(
    newborn,
    feed_type,
    feed_time=None,
    volume_ml=None,
    notes='',
    created_by=None
) -> NewbornFeedingLog:
    """
    Record a feeding log. Volume in ml is required for formula, ng_tube, and iv.
    """
    if feed_type in ["formula", "ng_tube", "iv"] and volume_ml is None:
        raise ValueError(f"Volume in ml is required for {feed_type} feeds.")

    log = NewbornFeedingLog.objects.create(
        newborn=newborn,
        feed_type=feed_type,
        feed_time=feed_time or timezone.now(),
        volume_ml=volume_ml,
        notes=notes,
        created_by=created_by
    )

    # Write audit log
    log_event(
        action_type="create",
        entity_name="newborn_feeding_log",
        entity_id=str(log.id),
        user=created_by,
        new_value={
            "newborn_id": str(newborn.id),
            "feed_type": feed_type,
            "volume_ml": float(volume_ml) if volume_ml is not None else None
        }
    )

    return log


@transaction.atomic
def record_newborn_vital(
    newborn,
    weight_kg,
    head_circ_cm=None,
    temperature=None,
    recorded_at=None,
    recorded_by=None
) -> NewbornVital:
    """
    Record newborn periodic vitals.
    """
    vital = NewbornVital.objects.create(
        newborn=newborn,
        recorded_at=recorded_at or timezone.now(),
        weight_kg=weight_kg,
        head_circ_cm=head_circ_cm,
        temperature=temperature,
        recorded_by=recorded_by,
        created_by=recorded_by
    )

    # Write audit log
    log_event(
        action_type="create",
        entity_name="newborn_vital",
        entity_id=str(vital.id),
        user=recorded_by,
        new_value={
            "newborn_id": str(newborn.id),
            "weight_kg": float(weight_kg),
            "temperature": float(temperature) if temperature is not None else None
        }
    )

    return vital


@transaction.atomic
def set_newborn_vaccination_status(
    vaccination,
    status,
    administered_date=None,
    notes='',
    updated_by=None
) -> NewbornVaccination:
    """
    Update the status of a newborn vaccination.
    Enforces that administered_date is provided if status is 'administered'.
    """
    if status == "administered" and not administered_date:
        raise ValueError("Administered date is required when vaccination status is set to administered.")

    locked_vaccination = NewbornVaccination.objects.select_for_update().get(id=vaccination.id)
    old_status = locked_vaccination.status

    locked_vaccination.status = status
    locked_vaccination.administered_date = administered_date
    if notes:
        locked_vaccination.notes = notes
    locked_vaccination.save()

    # Write audit log
    log_event(
        action_type="update",
        entity_name="newborn_vaccination",
        entity_id=str(locked_vaccination.id),
        user=updated_by,
        old_value={"status": old_status},
        new_value={"status": status, "administered_date": str(administered_date) if administered_date else None}
    )

    return locked_vaccination
