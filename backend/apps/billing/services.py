"""
MotherCare — Billing Module Services
"""
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from apps.billing.models import Bill, BillItem, BillPayment
from core.utils import generate_invoice_number
from apps.audit.utils import log_event

@transaction.atomic
def create_bill(
    patient,
    bill_type,
    admission=None,
    items_data=None,
    notes='',
    created_by=None
) -> Bill:
    """
    Create a new bill, generate sequential invoice number, and create line items.
    """
    invoice_number = generate_invoice_number()
    
    # Create Bill header
    bill = Bill.objects.create(
        patient=patient,
        bill_type=bill_type,
        admission=admission,
        invoice_number=invoice_number,
        total_amount=0,  # updated below
        amount_paid=0,
        payment_status="pending",
        notes=notes,
        created_by=created_by
    )

    total_amount = 0
    items_list = items_data or []
    
    for item in items_list:
        bill_item = BillItem.objects.create(
            bill=bill,
            item_type=item["item_type"],
            item_name=item["item_name"],
            reference_id=item.get("reference_id"),
            quantity=item["quantity"],
            unit_price=item["unit_price"],
            sort_order=item.get("sort_order", 0),
            created_by=created_by
        )
        total_amount += bill_item.total_price

    bill.total_amount = total_amount
    bill.save()

    # Write audit log
    log_event(
        action_type="create",
        entity_name="bill",
        entity_id=str(bill.id),
        user=created_by,
        new_value={
            "patient_id": str(patient.id),
            "bill_type": bill_type,
            "invoice_number": invoice_number,
            "total_amount": float(total_amount)
        }
    )

    return bill


@transaction.atomic
def record_payment(
    bill,
    amount,
    payment_method,
    transaction_ref='',
    recorded_by=None
) -> BillPayment:
    """
    Record a payment against a bill, updating amount_paid and payment_status.
    Enforces check against overpayments.
    """
    from decimal import Decimal
    amount = Decimal(str(amount))

    if amount <= 0:
        raise ValueError("Payment amount must be greater than zero.")

    # Lock Bill row
    locked_bill = Bill.objects.select_for_update().get(id=bill.id)
    
    old_paid = locked_bill.amount_paid
    old_status = locked_bill.payment_status

    if old_paid + amount > locked_bill.total_amount:
        raise ValueError(f"Overpayment not allowed. Bill balance: {locked_bill.total_amount - old_paid}")

    # Create payment record
    payment = BillPayment.objects.create(
        bill=locked_bill,
        amount=amount,
        payment_method=payment_method,
        transaction_ref=transaction_ref,
        recorded_by=recorded_by,
        created_by=recorded_by
    )

    # Recalculate amount paid
    new_paid = locked_bill.payments.aggregate(total=Sum("amount"))["total"] or 0
    locked_bill.amount_paid = new_paid

    # Derive payment status
    if new_paid == locked_bill.total_amount:
        locked_bill.payment_status = "paid"
    elif new_paid > 0:
        locked_bill.payment_status = "partial"
    else:
        locked_bill.payment_status = "pending"

    locked_bill.save()

    # Write audit log
    log_event(
        action_type="create",
        entity_name="bill_payment",
        entity_id=str(payment.id),
        user=recorded_by,
        new_value={
            "bill_id": str(locked_bill.id),
            "amount": float(amount),
            "payment_method": payment_method
        }
    )

    log_event(
        action_type="update",
        entity_name="bill",
        entity_id=str(locked_bill.id),
        user=recorded_by,
        old_value={"amount_paid": float(old_paid), "payment_status": old_status},
        new_value={"amount_paid": float(new_paid), "payment_status": locked_bill.payment_status}
    )

    return payment
