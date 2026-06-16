from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Sum
from apps.consultations.models import Consultation
from apps.billing.models import Bill, BillItem
from core.utils import generate_invoice_number
from decimal import Decimal
from django.utils import timezone


@receiver(post_save, sender=Consultation)
def auto_add_consultation_charge(sender, instance, created, **kwargs):
    """
    Auto-add a consultation charge as a bill item when a consultation is completed.
    Creates a new Bill for the consultation if no active billing session exists.
    """
    if instance.status == "completed":
        # Check if this consultation has already been billed
        if not BillItem.objects.filter(item_type="consultation_charge", reference_id=instance.id).exists():
            doctor_fee = Decimal("500.00")
            try:
                # If doctor has a consultation_fee field, use it
                if hasattr(instance.doctor, "consultation_fee"):
                    doctor_fee = instance.doctor.consultation_fee
            except Exception:
                pass

            # Link to active admission if patient is currently admitted
            active_admission = None
            try:
                from apps.admissions.models import Admission
                from apps.admissions.constants import ADMISSION_STATUS_ACTIVE
                active_admission = Admission.objects.filter(
                    patient=instance.patient,
                    status=ADMISSION_STATUS_ACTIVE
                ).first()
            except Exception:
                pass

            bill = Bill.objects.create(
                patient=instance.patient,
                bill_type="consultation",
                admission=active_admission,
                invoice_number=generate_invoice_number(),
                total_amount=doctor_fee,
                amount_paid=0,
                payment_status="pending",
                notes=f"Automated bill for Consultation #{instance.id}",
                created_by=instance.created_by
            )

            BillItem.objects.create(
                bill=bill,
                item_type="consultation_charge",
                item_name=f"Consultation with Dr. {instance.doctor.staff.full_name}",
                reference_id=instance.id,
                quantity=Decimal("1.00"),
                unit_price=doctor_fee,
                total_price=doctor_fee,
                created_by=instance.created_by
            )


def get_or_create_pending_bill(patient, consultation=None, created_by=None):
    """
    Helper to resolve a pending bill for a consultation or create one if none exists.
    """
    if consultation:
        # Check if there is an existing pending bill linked to this consultation
        bill = Bill.objects.filter(
            patient=patient,
            payment_status="pending",
            notes__icontains=f"Consultation #{consultation.id}"
        ).first()
        if bill:
            return bill

        # Fallback to any pending consultation bill
        bill = Bill.objects.filter(patient=patient, bill_type="consultation", payment_status="pending").first()
        if bill:
            return bill

    # Fallback to active admission
    active_admission = None
    try:
        from apps.admissions.models import Admission
        from apps.admissions.constants import ADMISSION_STATUS_ACTIVE
        active_admission = Admission.objects.filter(
            patient=patient,
            status=ADMISSION_STATUS_ACTIVE
        ).first()
    except Exception:
        pass

    bill = Bill.objects.create(
        patient=patient,
        bill_type="consultation" if consultation else "misc",
        admission=active_admission,
        invoice_number=generate_invoice_number(),
        total_amount=Decimal("0.00"),
        amount_paid=Decimal("0.00"),
        payment_status="pending",
        notes=f"Automated bill for Consultation #{consultation.id}" if consultation else "Automated bill",
        created_by=created_by
    )
    return bill


def update_bill_total(bill):
    """
    Helper to recalculate total amount of a bill.
    """
    total = bill.items.aggregate(total=Sum('total_price'))['total'] or Decimal("0.00")
    bill.total_amount = total
    bill.save(update_fields=['total_amount'])


def auto_bill_prescription(sender, instance, created, **kwargs):
    """
    Auto-charge for prescriptions when saved.
    """
    if instance.status == "saved":
        bill = get_or_create_pending_bill(
            patient=instance.patient,
            consultation=instance.consultation,
            created_by=instance.created_by
        )

        updated = False
        from apps.pharmacy.models import MedicineBatch

        for item in instance.items.all():
            # Check if this item is already billed
            if not BillItem.objects.filter(item_type="pharmacy_charge", reference_id=item.id).exists():
                # Get selling price from batch
                batch = MedicineBatch.objects.filter(medicine=item.medicine, quantity__gt=0).first()
                if not batch:
                    batch = MedicineBatch.objects.filter(medicine=item.medicine).first()

                unit_price = batch.selling_price if batch else Decimal("10.00")
                qty = Decimal(str(item.duration_days or 1))
                if hasattr(item, "quantity_to_dispense") and item.quantity_to_dispense:
                    qty = Decimal(str(item.quantity_to_dispense))

                BillItem.objects.create(
                    bill=bill,
                    item_type="pharmacy_charge",
                    item_name=f"Prescribed: {item.medicine.name}",
                    reference_id=item.id,
                    quantity=qty,
                    unit_price=unit_price,
                    created_by=instance.created_by
                )
                updated = True

        if updated:
            update_bill_total(bill)


def auto_bill_lab_order(sender, instance, created, **kwargs):
    """
    Auto-charge for lab orders when created/saved.
    """
    bill = get_or_create_pending_bill(
        patient=instance.patient,
        consultation=instance.consultation,
        created_by=instance.created_by
    )

    updated = False
    for item in instance.items.all():
        if not BillItem.objects.filter(item_type="lab_charge", reference_id=item.id).exists():
            BillItem.objects.create(
                bill=bill,
                item_type="lab_charge",
                item_name=f"Lab Test: {item.test.name}",
                reference_id=item.id,
                quantity=Decimal("1.00"),
                unit_price=item.test.price,
                created_by=instance.created_by
            )
            updated = True

    if updated:
        update_bill_total(bill)


def auto_complete_lab_order_on_report(sender, instance, created, **kwargs):
    """
    Advance lab order status to completed when a lab report is uploaded.
    """
    if created:
        lab_order = instance.lab_order
        if lab_order.status != "completed":
            lab_order.status = "completed"
            lab_order.completed_at = timezone.now()
            lab_order.save(update_fields=["status", "completed_at", "updated_at"])


# Wire up senders dynamically to avoid circular import errors at registry time
from apps.prescriptions.models import Prescription
from apps.laboratory.models import LabOrder, LabReport

post_save.connect(auto_bill_prescription, sender=Prescription)
post_save.connect(auto_bill_lab_order, sender=LabOrder)
post_save.connect(auto_complete_lab_order_on_report, sender=LabReport)
