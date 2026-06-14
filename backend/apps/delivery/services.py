"""
MotherCare — Delivery Module Services
"""
from django.db import transaction
from django.utils import timezone
from apps.delivery.models import Delivery, DeliveryProcedure
from apps.admissions.models import Admission
from apps.admissions.constants import ADMISSION_STATUS_ACTIVE, ADMISSION_TYPE_POST_NATAL
from apps.audit.utils import log_event

@transaction.atomic
def record_delivery(
    admission,
    patient,
    doctor,
    delivery_datetime,
    delivery_mode,
    blood_loss_ml=None,
    placenta_complete=True,
    complications='',
    notes='',
    procedures_data=None,
    created_by=None
) -> Delivery:
    """
    Record a delivery. Enforces that the corresponding admission is active
    and updates the admission type to 'post_natal'.
    For C-section, validates that at least one Caesarean Section procedure is recorded.
    """
    # Enforce BR-DEL-03: Admission must be active
    locked_admission = Admission.objects.select_for_update().get(id=admission.id)
    if locked_admission.status not in [ADMISSION_STATUS_ACTIVE, "discharge_pending"]:
        raise ValueError("Cannot record a delivery against an inactive or discharged admission.")

    # Enforce BR-DEL-06: C-section must have at least one DeliveryProcedure named 'Caesarean Section'
    procedures_list = procedures_data or []
    if delivery_mode == "c_section":
        has_c_section_proc = any(
            p.get("procedure_name") == "Caesarean Section" for p in procedures_list
        )
        if not has_c_section_proc:
            raise ValueError("C-section deliveries require at least one 'Caesarean Section' procedure to be recorded.")

    # Recalculate/update admission type to post_natal
    locked_admission.admission_type = ADMISSION_TYPE_POST_NATAL
    locked_admission.save()

    # Create Delivery record
    delivery = Delivery.objects.create(
        admission=locked_admission,
        patient=patient,
        doctor=doctor,
        delivery_datetime=delivery_datetime,
        delivery_mode=delivery_mode,
        blood_loss_ml=blood_loss_ml,
        placenta_complete=placenta_complete,
        complications=complications,
        notes=notes,
        created_by=created_by
    )

    # Create procedures
    for proc in procedures_list:
        DeliveryProcedure.objects.create(
            delivery=delivery,
            performed_by=proc.get("performed_by", doctor),
            procedure_name=proc["procedure_name"],
            indication=proc.get("indication", ""),
            technique=proc.get("technique", ""),
            implants_used=proc.get("implants_used", ""),
            duration_minutes=proc.get("duration_minutes", 0),
            post_op_instructions=proc.get("post_op_instructions", ""),
            performed_at=proc.get("performed_at", timezone.now()),
            created_by=created_by
        )

    # Write audit log
    log_event(
        action_type="create",
        entity_name="delivery",
        entity_id=str(delivery.id),
        user=created_by,
        new_value={
            "admission_id": str(locked_admission.id),
            "patient_id": str(patient.id),
            "delivery_mode": delivery_mode,
            "procedures_count": len(procedures_list)
        }
    )

    return delivery


@transaction.atomic
def soft_delete_delivery(delivery, deleted_by=None) -> None:
    """
    Soft delete a delivery record.
    """
    locked_delivery = Delivery.objects.select_for_update().get(id=delivery.id)
    
    # Store old value for audit
    old_status = {"is_deleted": locked_delivery.is_deleted}
    
    locked_delivery.soft_delete()
    
    # Write audit log
    log_event(
        action_type="delete",
        entity_name="delivery",
        entity_id=str(locked_delivery.id),
        user=deleted_by,
        old_value=old_status,
        new_value={"is_deleted": True}
    )
