"""
MotherCare — Admissions & Bed Management Services
"""
from django.db import transaction
from django.utils import timezone
from apps.admissions.models import Bed, Admission, WardTransfer
from apps.admissions.constants import (
    BED_STATUS_AVAILABLE,
    BED_STATUS_OCCUPIED,
    BED_STATUS_CLEANING,
    ADMISSION_STATUS_ACTIVE,
    ADMISSION_STATUS_DISCHARGED,
)
from apps.audit.utils import log_event

@transaction.atomic
def admit_patient(patient, bed, doctor, admission_type, est_discharge=None, notes='', created_by=None) -> Admission:
    """
    Admit a patient to a bed. Enforces that the patient does not have an active admission
    and the bed is available.
    """
    # Check if patient already has active admission
    active_admissions = Admission.objects.filter(
        patient=patient,
        status__in=[ADMISSION_STATUS_ACTIVE, "discharge_pending"]
    )
    if active_admissions.exists():
        raise ValueError("Patient already has an active admission.")

    # Lock and verify bed status
    locked_bed = Bed.objects.select_for_update().get(id=bed.id)
    if locked_bed.status != BED_STATUS_AVAILABLE:
        raise ValueError(f"Bed {locked_bed.bed_number} is not available (status: {locked_bed.status}).")

    # Update bed status
    locked_bed.status = BED_STATUS_OCCUPIED
    locked_bed.save()

    # Create admission
    admission = Admission.objects.create(
        patient=patient,
        bed=locked_bed,
        doctor=doctor,
        admission_type=admission_type,
        status=ADMISSION_STATUS_ACTIVE,
        admitted_at=timezone.now(),
        est_discharge=est_discharge,
        notes=notes,
        created_by=created_by
    )

    # Write audit log
    log_event(
        action_type="create",
        entity_name="admission",
        entity_id=str(admission.id),
        user=created_by,
        new_value={
            "patient_id": str(patient.id),
            "bed_id": str(locked_bed.id),
            "doctor_id": str(doctor.id),
            "admission_type": admission_type,
        }
    )

    return admission


@transaction.atomic
def transfer_ward(admission, to_bed, reason='', transferred_by=None) -> WardTransfer:
    """
    Transfer a patient from their current bed to a new bed.
    """
    # Lock admission, from bed, and to bed
    locked_admission = Admission.objects.select_for_update().get(id=admission.id)
    if locked_admission.status not in [ADMISSION_STATUS_ACTIVE, "discharge_pending"]:
        raise ValueError("Cannot transfer patient from an inactive admission.")

    from_bed = locked_admission.bed
    locked_from_bed = Bed.objects.select_for_update().get(id=from_bed.id)
    locked_to_bed = Bed.objects.select_for_update().get(id=to_bed.id)

    if locked_to_bed.status != BED_STATUS_AVAILABLE:
        raise ValueError(f"Target Bed {locked_to_bed.bed_number} is not available (status: {locked_to_bed.status}).")

    # Set old bed status to cleaning
    locked_from_bed.status = BED_STATUS_CLEANING
    locked_from_bed.save()

    # Set new bed status to occupied
    locked_to_bed.status = BED_STATUS_OCCUPIED
    locked_to_bed.save()

    # Update admission bed
    locked_admission.bed = locked_to_bed
    locked_admission.save()

    # Create transfer log
    transfer = WardTransfer.objects.create(
        admission=locked_admission,
        from_bed=locked_from_bed,
        to_bed=locked_to_bed,
        transferred_at=timezone.now(),
        reason=reason,
        transferred_by=transferred_by,
        created_by=transferred_by
    )

    # Write audit log
    log_event(
        action_type="update",
        entity_name="admission",
        entity_id=str(locked_admission.id),
        user=transferred_by,
        old_value={"bed_id": str(locked_from_bed.id)},
        new_value={"bed_id": str(locked_to_bed.id)}
    )

    return transfer


@transaction.atomic
def discharge_patient(admission, actual_discharge=None, status=ADMISSION_STATUS_DISCHARGED, notes='', updated_by=None) -> Admission:
    """
    Discharge a patient from their admission, setting the bed status to cleaning.
    """
    if status not in [ADMISSION_STATUS_DISCHARGED, "deceased"]:
        raise ValueError("Invalid discharge status.")

    locked_admission = Admission.objects.select_for_update().get(id=admission.id)
    if locked_admission.status not in [ADMISSION_STATUS_ACTIVE, "discharge_pending"]:
        raise ValueError("Admission is not active.")

    bed = locked_admission.bed
    locked_bed = Bed.objects.select_for_update().get(id=bed.id)

    # Update bed status to cleaning
    locked_bed.status = BED_STATUS_CLEANING
    locked_bed.save()

    # Update admission status
    locked_admission.status = status
    locked_admission.actual_discharge = actual_discharge or timezone.now()
    if notes:
        locked_admission.notes = f"{locked_admission.notes}\nDischarge Notes: {notes}".strip()
    locked_admission.save()

    # Write audit log
    log_event(
        action_type="update",
        entity_name="admission",
        entity_id=str(locked_admission.id),
        user=updated_by,
        old_value={"status": "active"},
        new_value={"status": status, "actual_discharge": str(locked_admission.actual_discharge)}
    )

    return locked_admission


@transaction.atomic
def clean_bed(bed, updated_by=None) -> Bed:
    """
    Mark a bed as cleaned and make it available.
    """
    locked_bed = Bed.objects.select_for_update().get(id=bed.id)
    old_status = locked_bed.status

    locked_bed.status = BED_STATUS_AVAILABLE
    locked_bed.last_cleaned_at = timezone.now()
    locked_bed.save()

    # Write audit log
    log_event(
        action_type="update",
        entity_name="bed",
        entity_id=str(locked_bed.id),
        user=updated_by,
        old_value={"status": old_status},
        new_value={"status": BED_STATUS_AVAILABLE, "last_cleaned_at": str(locked_bed.last_cleaned_at)}
    )

    return locked_bed
