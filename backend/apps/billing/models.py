"""
MotherCare — Billing Module Models
"""
import uuid
from django.db import models
from django.utils import timezone
from core.models import BaseModel

class Bill(BaseModel):
    """
    Header record per billing event.
    """
    BILL_TYPE_CHOICES = [
        ("consultation", "Consultation"),
        ("lab", "Lab"),
        ("pharmacy", "Pharmacy"),
        ("admission", "Admission"),
        ("misc", "Misc"),
    ]

    PAYMENT_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("partial", "Partial"),
        ("paid", "Paid"),
        ("overdue", "Overdue"),
        ("refunded", "Refunded"),
    ]

    patient = models.ForeignKey("people.Patient", on_delete=models.RESTRICT, related_name="bills")
    bill_type = models.CharField(max_length=20, choices=BILL_TYPE_CHOICES)
    admission = models.ForeignKey("admissions.Admission", on_delete=models.SET_NULL, null=True, blank=True, related_name="bills")
    invoice_number = models.CharField(max_length=30, unique=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default="pending", db_index=True)
    notes = models.TextField(blank=True)
    generated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "bill"
        ordering = ["-generated_at"]
        constraints = [
            models.CheckConstraint(check=models.Q(amount_paid__gte=0), name="chk_bill_amount_paid_non_negative"),
            models.CheckConstraint(check=models.Q(total_amount__gte=0), name="chk_bill_total_amount_non_negative"),
            models.CheckConstraint(check=models.Q(amount_paid__lte=models.F("total_amount")), name="chk_bill_amount_paid_lte_total")
        ]

    def __str__(self) -> str:
        return f"Bill {self.invoice_number} ({self.payment_status})"


class BillItem(BaseModel):
    """
    Line items that make up a bill.
    """
    ITEM_TYPE_CHOICES = [
        ("consultation_charge", "Consultation Charge"),
        ("lab_charge", "Lab Charge"),
        ("pharmacy_charge", "Pharmacy Charge"),
        ("admission_charge", "Admission Charge"),
        ("procedure_charge", "Procedure Charge"),
        ("misc_charge", "Misc Charge"),
    ]

    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name="items")
    item_type = models.CharField(max_length=30, choices=ITEM_TYPE_CHOICES)
    item_name = models.CharField(max_length=120)
    reference_id = models.UUIDField(null=True, blank=True)
    quantity = models.DecimalField(max_digits=8, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    sort_order = models.SmallIntegerField(default=0)

    class Meta:
        db_table = "bill_item"
        ordering = ["sort_order", "id"]
        constraints = [
            models.CheckConstraint(check=models.Q(quantity__gt=0), name="chk_bill_item_quantity_positive"),
            models.CheckConstraint(check=models.Q(unit_price__gte=0), name="chk_bill_item_unit_price_non_negative")
        ]

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.item_name} (Qty: {self.quantity}) - {self.bill.invoice_number}"


class BillPayment(BaseModel):
    """
    Transaction records for payments against a bill.
    """
    PAYMENT_METHOD_CHOICES = [
        ("cash", "Cash"),
        ("card", "Card"),
        ("upi", "UPI"),
        ("netbanking", "Netbanking"),
        ("insurance", "Insurance"),
        ("cheque", "Cheque"),
    ]

    bill = models.ForeignKey(Bill, on_delete=models.RESTRICT, related_name="payments")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    transaction_ref = models.CharField(max_length=100, blank=True)
    paid_at = models.DateTimeField(default=timezone.now)
    recorded_by = models.ForeignKey("auth_rbac.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="+")

    class Meta:
        db_table = "bill_payment"
        ordering = ["-paid_at"]
        constraints = [
            models.CheckConstraint(check=models.Q(amount__gt=0), name="chk_bill_payment_amount_positive")
        ]

    def __str__(self) -> str:
        return f"Payment of {self.amount} for Bill {self.bill.invoice_number}"
