"""
MotherCare — Pharmacy Module Models
Architecture: mothercare_final_architecture_v2.md — DOMAIN 9

Models: Medicine, MedicineBatch, PharmacySale, PharmacySaleItem

NOTE: Full pharmacy logic (services, views, etc.) is Sprint 6.
This file provides the Medicine model so Prescription (Sprint 5) can FK to it.
"""
from __future__ import annotations

from django.db import models

from core.models import BaseModel

# ─────────────────────────────────────────────────────────────────────────────
# Medicine (Master Formulary)
# ─────────────────────────────────────────────────────────────────────────────

MEDICINE_CATEGORY_CHOICES = [
    ("tablet", "Tablet"),
    ("capsule", "Capsule"),
    ("syrup", "Syrup / Suspension"),
    ("injection", "Injection"),
    ("topical", "Topical / Ointment"),
    ("inhaler", "Inhaler"),
    ("drops", "Drops (Eye/Ear/Nasal)"),
    ("suppository", "Suppository"),
    ("patch", "Transdermal Patch"),
    ("powder", "Powder / Sachet"),
    ("other", "Other"),
]


class Medicine(BaseModel):
    """
    Master formulary. One row per drug product.
    Stock tracked at batch level (MedicineBatch), not here.

    Architecture constraints:
        UNIQUE(name, category) — prevents duplicate drug entries
    """

    name = models.CharField(
        max_length=255,
        help_text="Brand/generic drug name.",
    )
    generic_name = models.CharField(
        max_length=255,
        blank=True,
        help_text="INN generic name (e.g., Paracetamol for Calpol).",
    )
    category = models.CharField(
        max_length=30,
        choices=MEDICINE_CATEGORY_CHOICES,
        default="tablet",
        help_text="Dosage form.",
    )
    unit = models.CharField(
        max_length=50,
        default="tablet",
        help_text="Dispensing unit: tablet, ml, sachet, etc.",
    )
    reorder_level = models.PositiveIntegerField(
        default=50,
        help_text="Minimum stock quantity before reorder alert is triggered.",
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Inactive medicines cannot be prescribed (BR-PHARM-01).",
    )

    class Meta:
        db_table = "medicine"
        verbose_name = "Medicine"
        verbose_name_plural = "Medicines"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "category"],
                name="uq_medicine_name_category",
            ),
        ]
        indexes = [
            models.Index(fields=["is_active"], name="idx_medicine_active"),
            models.Index(fields=["category"], name="idx_medicine_category"),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.get_category_display()})"


# ─────────────────────────────────────────────────────────────────────────────
# MedicineBatch (Inventory tracking at batch level)
# ─────────────────────────────────────────────────────────────────────────────

class MedicineBatch(BaseModel):
    """
    Batch-level inventory. Quantity lives here, not on Medicine.
    FIFO dispensing = ORDER BY expiry_date ASC, purchase_date ASC.

    Architecture constraints:
        UNIQUE(medicine_id, batch_number)
        CHECK(expiry_date > purchase_date)
        CHECK(quantity >= 0)
    """

    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.RESTRICT,
        related_name="batches",
    )
    batch_number = models.CharField(max_length=100, help_text="Supplier batch/lot number.")
    supplier_name = models.CharField(max_length=255, blank=True)
    purchase_date = models.DateField()
    expiry_date = models.DateField()
    quantity = models.PositiveIntegerField(
        default=0,
        help_text="Current stock quantity. Must be >= 0. Use SELECT FOR UPDATE before decrement.",
    )
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "medicine_batch"
        verbose_name = "Medicine Batch"
        verbose_name_plural = "Medicine Batches"
        ordering = ["expiry_date", "purchase_date"]
        constraints = [
            models.UniqueConstraint(
                fields=["medicine", "batch_number"],
                name="uq_batch_medicine_batch_no",
            ),
            models.CheckConstraint(
                check=models.Q(expiry_date__gt=models.F("purchase_date")),
                name="chk_batch_expiry_after_purchase",
            ),
        ]
        indexes = [
            models.Index(fields=["medicine", "expiry_date"], name="idx_batch_medicine_expiry"),
        ]

    def __str__(self) -> str:
        return f"Batch({self.medicine.name}, {self.batch_number}, qty={self.quantity})"


# ─────────────────────────────────────────────────────────────────────────────
# PharmacySale & PharmacySaleItem
# (Full service/view implementation in Sprint 6)
# ─────────────────────────────────────────────────────────────────────────────

class PharmacySale(BaseModel):
    """
    Invoice header for a pharmacy transaction.
    May be linked to a prescription or walk-in OTC sale.
    """

    prescription = models.ForeignKey(
        "prescriptions.Prescription",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pharmacy_sales",
    )
    patient = models.ForeignKey(
        "people.Patient",
        on_delete=models.RESTRICT,
        related_name="pharmacy_sales",
    )
    sold_by = models.ForeignKey(
        "auth_rbac.User",
        on_delete=models.RESTRICT,
        related_name="+",
    )
    invoice_number = models.CharField(max_length=30, unique=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    sold_at = models.DateTimeField()

    class Meta:
        db_table = "pharmacy_sale"
        verbose_name = "Pharmacy Sale"
        verbose_name_plural = "Pharmacy Sales"
        ordering = ["-sold_at"]
        indexes = [
            models.Index(fields=["patient"], name="idx_sale_patient"),
            models.Index(fields=["sold_at"], name="idx_sale_sold_at"),
        ]

    def __str__(self) -> str:
        return f"Sale({self.invoice_number}, {self.patient_id})"


class PharmacySaleItem(BaseModel):
    """Line items per sale. Each row deducts from a specific MedicineBatch."""

    sale = models.ForeignKey(
        PharmacySale,
        on_delete=models.CASCADE,
        related_name="items",
    )
    medicine_batch = models.ForeignKey(
        MedicineBatch,
        on_delete=models.RESTRICT,
        related_name="sale_items",
    )
    qty = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Computed: qty * unit_price. Stored for audit immutability.",
    )

    class Meta:
        db_table = "pharmacy_sale_item"
        verbose_name = "Pharmacy Sale Item"
        verbose_name_plural = "Pharmacy Sale Items"
        constraints = [
            models.CheckConstraint(
                check=models.Q(qty__gt=0),
                name="chk_sale_item_qty_positive",
            ),
        ]

    def __str__(self) -> str:
        return f"SaleItem(sale={self.sale_id}, batch={self.medicine_batch_id}, qty={self.qty})"
