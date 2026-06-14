"""
MotherCare — People Module Services
Architecture: CLAUDE.md — "All business logic lives in services.py"

Service functions:
    create_patient()            — Auto-generate MRN, validate, save
    update_patient()            — Validate and save patient changes
    soft_delete_patient()       — Soft-delete with AuditLog entry
    add_emergency_contact()     — Create or link emergency contact to patient
    remove_emergency_contact()  — Unlink contact from patient
    record_patient_allergy()    — Record a new allergy for a patient
    delete_patient_allergy()    — Remove allergy record
    create_staff()              — Create staff member
    update_staff()              — Update staff member
    create_doctor()             — Create doctor credential
    update_doctor()             — Update doctor credential
    check_patient_allergies()   — Allergy check at prescription time (BR-RX-05)
"""
import logging

from django.db import transaction

from apps.people.models import (
    Doctor,
    EmergencyContact,
    Patient,
    PatientAllergy,
    PatientEmergencyContact,
    Staff,
)
from core.utils import generate_patient_mrn

logger = logging.getLogger("mothercare")


# ─────────────────────────────────────────────────────────────────────────────
# Patient Services
# ─────────────────────────────────────────────────────────────────────────────
@transaction.atomic
def create_patient(
    validated_data: dict,
    created_by: object = None,
) -> Patient:
    """
    Create a new patient record with an auto-generated MRN.

    Args:
        validated_data: Cleaned data from PatientWriteSerializer.
        created_by: User performing the action (for audit).

    Returns:
        The newly created Patient instance.
    """
    mrn = generate_patient_mrn()
    patient = Patient.objects.create(
        mrn=mrn,
        created_by=created_by,
        **validated_data,
    )
    _write_audit(
        action_type="create",
        entity=patient,
        user=created_by,
        new_value={"mrn": mrn, **validated_data},
    )
    logger.info("Patient created: %s by user=%s", mrn, created_by)
    return patient


@transaction.atomic
def update_patient(
    patient: Patient,
    validated_data: dict,
    updated_by: object = None,
) -> Patient:
    """
    Update an existing patient record.

    Args:
        patient: Patient instance to update.
        validated_data: Cleaned data from PatientWriteSerializer.
        updated_by: User performing the update (for audit).

    Returns:
        The updated Patient instance.
    """
    old_value = {
        field: getattr(patient, field)
        for field in validated_data
    }
    for field, value in validated_data.items():
        setattr(patient, field, value)
    patient.save()

    _write_audit(
        action_type="update",
        entity=patient,
        user=updated_by,
        old_value=old_value,
        new_value=validated_data,
    )
    logger.info("Patient updated: %s by user=%s", patient.mrn, updated_by)
    return patient


@transaction.atomic
def soft_delete_patient(
    patient: Patient,
    deleted_by: object = None,
) -> None:
    """
    Soft-delete a patient. Writes AuditLog entry (BR-PAT-12).
    Does NOT cascade to child records (BR-PAT-11).

    Args:
        patient: Patient instance to soft-delete.
        deleted_by: User performing the deletion.

    Raises:
        ValueError: If the patient is already soft-deleted.
    """
    patient.soft_delete(user=deleted_by)
    logger.info("Patient soft-deleted: %s by user=%s", patient.mrn, deleted_by)


# ─────────────────────────────────────────────────────────────────────────────
# Emergency Contact Services
# ─────────────────────────────────────────────────────────────────────────────
@transaction.atomic
def add_emergency_contact(
    patient: Patient,
    validated_data: dict,
    created_by: object = None,
) -> PatientEmergencyContact:
    """
    Add (or link) an emergency contact to a patient.

    If `contact_id` is in validated_data, the existing EmergencyContact is linked.
    Otherwise, a new EmergencyContact is created from name/phone/alt_phone/email.

    Args:
        patient: The patient to link the contact to.
        validated_data: Data from PatientEmergencyContactWriteSerializer.
        created_by: User performing the action.

    Returns:
        The created PatientEmergencyContact link.
    """
    contact_id = validated_data.pop("contact_id", None)
    name = validated_data.pop("name", None)
    phone = validated_data.pop("phone", None)
    alt_phone = validated_data.pop("alt_phone", "")
    email = validated_data.pop("email", "")

    if contact_id:
        contact = EmergencyContact.objects.get(id=contact_id)
    else:
        contact = EmergencyContact.objects.create(
            name=name,
            phone=phone,
            alt_phone=alt_phone,
            email=email,
            created_by=created_by,
        )

    link = PatientEmergencyContact.objects.create(
        patient=patient,
        contact=contact,
        created_by=created_by,
        **validated_data,
    )
    _write_audit(
        action_type="create",
        entity=link,
        user=created_by,
        new_value={
            "patient_id": str(patient.id),
            "contact_id": str(contact.id),
            "priority": link.priority,
        },
    )
    return link


@transaction.atomic
def remove_emergency_contact(
    link: PatientEmergencyContact,
    deleted_by: object = None,
) -> None:
    """
    Remove a PatientEmergencyContact link (hard delete on the junction row).
    The EmergencyContact entity itself is NOT deleted (it may be reused).

    Args:
        link: The PatientEmergencyContact to remove.
        deleted_by: User performing the action.
    """
    _write_audit(
        action_type="delete",
        entity=link,
        user=deleted_by,
        old_value={
            "patient_id": str(link.patient_id),
            "contact_id": str(link.contact_id),
        },
    )
    link.delete()
    logger.info("Emergency contact link removed by user=%s", deleted_by)


# ─────────────────────────────────────────────────────────────────────────────
# Patient Allergy Services
# ─────────────────────────────────────────────────────────────────────────────
@transaction.atomic
def record_patient_allergy(
    patient: Patient,
    validated_data: dict,
    recorded_by: object = None,
) -> PatientAllergy:
    """
    Record a new allergy for a patient.

    Args:
        patient: Patient instance.
        validated_data: Cleaned data from PatientAllergyWriteSerializer.
        recorded_by: User recording the allergy.

    Returns:
        The newly created PatientAllergy instance.
    """
    allergy = PatientAllergy.objects.create(
        patient=patient,
        recorded_by=recorded_by,
        created_by=recorded_by,
        **validated_data,
    )
    _write_audit(
        action_type="create",
        entity=allergy,
        user=recorded_by,
        new_value={
            "patient_id": str(patient.id),
            "allergen": allergy.allergen,
            "severity": allergy.severity,
        },
    )
    logger.info(
        "Allergy recorded: patient=%s allergen=%s severity=%s",
        patient.mrn, allergy.allergen, allergy.severity,
    )
    return allergy


@transaction.atomic
def delete_patient_allergy(
    allergy: PatientAllergy,
    deleted_by: object = None,
) -> None:
    """
    Remove a patient allergy record.

    Args:
        allergy: PatientAllergy instance to remove.
        deleted_by: User performing the deletion.
    """
    _write_audit(
        action_type="delete",
        entity=allergy,
        user=deleted_by,
        old_value={
            "allergen": allergy.allergen,
            "severity": allergy.severity,
        },
    )
    allergy.delete()
    logger.info("Allergy deleted by user=%s", deleted_by)


def check_patient_allergies(patient_id: str, medicine_generic_name: str) -> list[dict]:
    """
    Check if the patient has any allergy matching the medicine generic name.
    Used by the Prescription module before saving a PrescriptionItem (BR-RX-05).

    Args:
        patient_id: UUID string of the patient.
        medicine_generic_name: Generic name of the medicine to prescribe.

    Returns:
        List of matching allergy records as dicts (empty list = no match).
    """
    from apps.people.constants import BLOCKING_ALLERGY_SEVERITIES

    allergies = PatientAllergy.objects.filter(
        patient_id=patient_id,
        allergen__iexact=medicine_generic_name,
    ).values("id", "allergen", "severity", "reaction_type")

    result = []
    for allergy in allergies:
        result.append({
            **allergy,
            "is_blocking": allergy["severity"] in BLOCKING_ALLERGY_SEVERITIES,
        })
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Staff Services
# ─────────────────────────────────────────────────────────────────────────────
@transaction.atomic
def create_staff(
    validated_data: dict,
    created_by: object = None,
) -> Staff:
    """
    Create a new staff member.

    Args:
        validated_data: Cleaned data from StaffWriteSerializer.
        created_by: User performing the action.

    Returns:
        The newly created Staff instance.
    """
    staff = Staff.objects.create(created_by=created_by, **validated_data)
    _write_audit(
        action_type="create",
        entity=staff,
        user=created_by,
        new_value={"full_name": staff.full_name, "designation": staff.designation},
    )
    logger.info("Staff created: %s by user=%s", staff.full_name, created_by)
    return staff


@transaction.atomic
def update_staff(
    staff: Staff,
    validated_data: dict,
    updated_by: object = None,
) -> Staff:
    """
    Update an existing staff member.

    Args:
        staff: Staff instance to update.
        validated_data: Cleaned data from StaffWriteSerializer.
        updated_by: User performing the update.

    Returns:
        The updated Staff instance.
    """
    old_value = {field: getattr(staff, field) for field in validated_data}
    for field, value in validated_data.items():
        setattr(staff, field, value)
    staff.save()

    _write_audit(
        action_type="update",
        entity=staff,
        user=updated_by,
        old_value=old_value,
        new_value=validated_data,
    )
    return staff


# ─────────────────────────────────────────────────────────────────────────────
# Doctor Services
# ─────────────────────────────────────────────────────────────────────────────
@transaction.atomic
def create_doctor(
    validated_data: dict,
    created_by: object = None,
) -> Doctor:
    """
    Create a Doctor credential record for a Staff member.

    Args:
        validated_data: Cleaned data from DoctorWriteSerializer.
        created_by: User performing the action.

    Returns:
        The newly created Doctor instance.
    """
    doctor = Doctor.objects.create(created_by=created_by, **validated_data)
    _write_audit(
        action_type="create",
        entity=doctor,
        user=created_by,
        new_value={
            "staff_id": str(doctor.staff_id),
            "registration_no": doctor.registration_no,
            "specialisation": doctor.specialisation,
        },
    )
    logger.info(
        "Doctor created: %s (reg=%s) by user=%s",
        doctor.staff.full_name, doctor.registration_no, created_by,
    )
    return doctor


@transaction.atomic
def update_doctor(
    doctor: Doctor,
    validated_data: dict,
    updated_by: object = None,
) -> Doctor:
    """
    Update an existing doctor credential.

    Args:
        doctor: Doctor instance to update.
        validated_data: Cleaned data from DoctorWriteSerializer.
        updated_by: User performing the update.

    Returns:
        The updated Doctor instance.
    """
    old_value = {field: getattr(doctor, field) for field in validated_data}
    for field, value in validated_data.items():
        setattr(doctor, field, value)
    doctor.save()

    _write_audit(
        action_type="update",
        entity=doctor,
        user=updated_by,
        old_value=old_value,
        new_value=validated_data,
    )
    return doctor


# ─────────────────────────────────────────────────────────────────────────────
# Internal Utilities
# ─────────────────────────────────────────────────────────────────────────────
def _write_audit(
    action_type: str,
    entity: object,
    user: object,
    old_value: dict | None = None,
    new_value: dict | None = None,
) -> None:
    """
    Write an AuditLog entry. Swallows exceptions to never break the main operation.
    (CLAUDE.md: Required Patterns — Write AuditLog for every create/update/delete)
    """
    try:
        from apps.audit.utils import log_event
        log_event(
            action_type=action_type,
            entity_name=entity.__class__.__name__,
            entity_id=str(entity.id),  # type: ignore[attr-defined]
            user=user,
            old_value=old_value or {},
            new_value=new_value or {},
        )
    except Exception:  # noqa: BLE001
        logger.exception(
            "Failed to write AuditLog for %s action=%s entity_id=%s",
            entity.__class__.__name__, action_type, getattr(entity, "id", "unknown"),
        )
