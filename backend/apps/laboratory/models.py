"""
MotherCare — Laboratory Module Models
Architecture: mothercare_final_architecture_v2.md — DOMAIN 8

Models: LabTest, LabReportFile

Business Rules:
    BR-LAB-01: LabReportFile is append-only — no UPDATE or DELETE ever
    BR-LAB-02: Flagged results require clinical follow-up
    BR-LAB-03: STAT > Urgent > Routine priority ordering
    BR-LAB-04: consultation FK nullable — lab tests can be standalone orders
    BR-LAB-05: Status one-directional transitions (enforced in services)

Both models inherit BaseModel (NOT SoftDeleteModel — lab records are permanent).
"""
from __future__ import annotations

from django.db import models
from django.utils import timezone

from apps.laboratory.constants import (
    FILE_TYPE_CHOICES,
    FILE_TYPE_PDF,
    LAB_STATUS_CHOICES,
    STATUS_CRITICAL,
    STATUS_PENDING,
    TERMINAL_LAB_STATUSES,
    TEST_TYPE_CHOICES,
    URGENCY_CHOICES,
    URGENCY_ROUTINE,
)
from core.models import BaseModel


class LabTest(BaseModel):
    """
    Lab test order record.

    May originate from a consultation (consultation FK) or be standalone.
    Status flows: pending → in_progress → completed | critical | cancelled

    Architecture constraints:
        FK patient (RESTRICT) — patient cannot be deleted if lab test exists
        FK consultation (RESTRICT, nullable) — standalone ordering supported
        FK ordered_by = Doctor (RESTRICT)
    """

    patient = models.ForeignKey(
        "people.Patient",
        on_delete=models.RESTRICT,
        related_name="lab_tests",
        help_text="Patient this test belongs to.",
    )
    consultation = models.ForeignKey(
        "consultations.Consultation",
        on_delete=models.RESTRICT,
        null=True,
        blank=True,
        related_name="lab_tests",
        help_text="Optional — test may be ordered outside a consultation. [BR-LAB-04]",
    )
    ordered_by = models.ForeignKey(
        "people.Doctor",
        on_delete=models.RESTRICT,
        related_name="ordered_lab_tests",
        help_text="Doctor who ordered this test.",
    )
    test_type = models.CharField(
        max_length=30,
        choices=TEST_TYPE_CHOICES,
        help_text="Type of lab test. Must be from the standard test type list.",
    )
    urgency = models.CharField(
        max_length=20,
        choices=URGENCY_CHOICES,
        default=URGENCY_ROUTINE,
        db_index=True,
        help_text="Priority: stat (immediate) > urgent > routine. [BR-LAB-03]",
    )
    status = models.CharField(
        max_length=20,
        choices=LAB_STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
        help_text="Lab test lifecycle status.",
    )
    requested_at = models.DateTimeField(
        default=timezone.now,
        help_text="When the test was ordered.",
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When results were ready. Set automatically on completion.",
    )
    key_findings = models.TextField(
        blank=True,
        help_text="Summary of lab findings populated by lab technician when completing.",
    )
    flagged = models.BooleanField(
        default=False,
        db_index=True,
        help_text=(
            "Set True when results require immediate clinical attention. "
            "Auto-set when status = critical. [BR-LAB-02]"
        ),
    )

    class Meta:
        db_table = "lab_test"
        verbose_name = "Lab Test"
        verbose_name_plural = "Lab Tests"
        ordering = ["urgency", "-requested_at"]
        indexes = [
            models.Index(fields=["patient", "status"], name="idx_labtest_patient_status"),
            models.Index(fields=["urgency", "status"], name="idx_labtest_urgency_status"),
            models.Index(fields=["flagged"], name="idx_labtest_flagged"),
            models.Index(fields=["ordered_by"], name="idx_labtest_doctor"),
            models.Index(fields=["consultation"], name="idx_labtest_consultation"),
        ]

    def __str__(self) -> str:
        return f"LabTest({self.test_type}, {self.patient_id}, {self.urgency}, {self.status})"

    @property
    def is_terminal(self) -> bool:
        """True if the test is in a terminal status (no further transitions)."""
        return self.status in TERMINAL_LAB_STATUSES

    @property
    def is_critical(self) -> bool:
        """True if status is critical OR flagged by technician."""
        return self.status == STATUS_CRITICAL or self.flagged


class LabReportFile(BaseModel):
    """
    Uploaded report file for a lab test.

    Append-only — one row per upload, never overwrite existing files.
    Multiple files per test are supported (e.g. interim + final reports).

    Architecture:
        FK lab_test (CASCADE) — files cascade-deleted with test (admin only)
        FK uploaded_by = User (RESTRICT)
        No UPDATE or DELETE permitted (BR-LAB-01)
    """

    lab_test = models.ForeignKey(
        LabTest,
        on_delete=models.CASCADE,
        related_name="report_files",
        help_text="Parent lab test. CASCADE: files follow the test lifecycle.",
    )
    uploaded_by = models.ForeignKey(
        "auth_rbac.User",
        on_delete=models.RESTRICT,
        related_name="+",
        help_text="User (lab tech/admin) who uploaded this file.",
    )
    file_url = models.CharField(
        max_length=500,
        help_text="Full URL to uploaded file (S3 presigned URL or local media path).",
    )
    file_type = models.CharField(
        max_length=10,
        choices=FILE_TYPE_CHOICES,
        default=FILE_TYPE_PDF,
        help_text="File format: pdf, jpg, png, dicom.",
    )
    uploaded_at = models.DateTimeField(
        default=timezone.now,
        help_text="When this file was uploaded.",
    )
    notes = models.TextField(
        blank=True,
        help_text="Lab technician notes about this specific report upload.",
    )

    class Meta:
        db_table = "lab_report_file"
        verbose_name = "Lab Report File"
        verbose_name_plural = "Lab Report Files"
        ordering = ["-uploaded_at"]
        indexes = [
            models.Index(fields=["lab_test"], name="idx_labfile_test"),
        ]

    def __str__(self) -> str:
        return f"LabFile({self.lab_test_id}, {self.file_type}, {self.uploaded_at:%Y-%m-%d})"


# ─────────────────────────────────────────────────────────────────────────────
# TestMaster (Catalog of laboratory tests)
# ─────────────────────────────────────────────────────────────────────────────

class TestMaster(BaseModel):
    """
    Master catalog of lab tests available in the hospital.
    """
    name = models.CharField(max_length=255, help_text="Name of the laboratory test.")
    code = models.CharField(max_length=50, unique=True, help_text="Unique test code (e.g. CBC, BG).")
    category = models.CharField(max_length=100, help_text="Category of the test (e.g. Hematology, Biochemistry).")
    normal_range = models.CharField(max_length=255, blank=True, help_text="Reference/normal range.")
    unit = models.CharField(max_length=50, blank=True, help_text="Unit of measurement (e.g. g/dL, mg/dL).")
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Standard cost of the test.")
    turnaround_hours = models.PositiveIntegerField(default=24, help_text="Standard turnaround time in hours.")
    is_active = models.BooleanField(default=True, db_index=True, help_text="Whether this test type is currently active.")

    class Meta:
        db_table = "lab_test_master"
        verbose_name = "Test Master"
        verbose_name_plural = "Test Masters"
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"


# ─────────────────────────────────────────────────────────────────────────────
# LabOrder (Grouping of lab tests per consultation/patient)
# ─────────────────────────────────────────────────────────────────────────────

class LabOrder(BaseModel):
    """
    Clinical lab order containing one or more ordered tests.
    """
    STATUS_PENDING = "pending"
    STATUS_RECEIVED = "received"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_COMPLETED = "completed"
    
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_RECEIVED, "Received"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_COMPLETED, "Completed"),
    ]

    consultation = models.ForeignKey(
        "consultations.Consultation",
        on_delete=models.RESTRICT,
        null=True,
        blank=True,
        related_name="lab_orders",
        help_text="Consultation from which this order originated."
    )
    patient = models.ForeignKey(
        "people.Patient",
        on_delete=models.RESTRICT,
        related_name="lab_orders",
        help_text="Patient this lab order belongs to."
    )
    doctor = models.ForeignKey(
        "people.Doctor",
        on_delete=models.RESTRICT,
        related_name="lab_orders",
        help_text="Doctor who ordered these tests."
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
        help_text="Status of the overall lab order."
    )
    clinical_note = models.TextField(
        blank=True,
        help_text="Clinical indications/notes provided by ordering doctor."
    )
    ordered_at = models.DateTimeField(
        default=timezone.now,
        help_text="Timestamp when the lab order was placed."
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when the last result was completed."
    )

    class Meta:
        db_table = "lab_order"
        verbose_name = "Lab Order"
        verbose_name_plural = "Lab Orders"
        ordering = ["-ordered_at"]

    def __str__(self) -> str:
        return f"LabOrder({self.id}, patient={self.patient_id}, status={self.status})"


# ─────────────────────────────────────────────────────────────────────────────
# LabOrderItem (Individual test result line items)
# ─────────────────────────────────────────────────────────────────────────────

class LabOrderItem(BaseModel):
    """
    Individual lab test within an order.
    """
    lab_order = models.ForeignKey(
        LabOrder,
        on_delete=models.CASCADE,
        related_name="items",
        help_text="Parent lab order."
    )
    test = models.ForeignKey(
        TestMaster,
        on_delete=models.RESTRICT,
        related_name="order_items",
        help_text="The specific test type."
    )
    result_value = models.CharField(
        max_length=255,
        blank=True,
        help_text="Recorded test result value."
    )
    result_note = models.TextField(
        blank=True,
        help_text="Additional observations, notes or findings from technician."
    )
    is_abnormal = models.BooleanField(
        default=False,
        db_index=True,
        help_text="True if result value falls outside normal range or is flagged abnormal."
    )

    class Meta:
        db_table = "lab_order_item"
        verbose_name = "Lab Order Item"
        verbose_name_plural = "Lab Order Items"

    def __str__(self) -> str:
        return f"LabOrderItem({self.test.code}, abnormal={self.is_abnormal})"


# ─────────────────────────────────────────────────────────────────────────────
# LabReport (PDF reports attached to a LabOrder)
# ─────────────────────────────────────────────────────────────────────────────

class LabReport(BaseModel):
    """
    Technician uploaded PDF report file for a lab order.
    """
    lab_order = models.ForeignKey(
        LabOrder,
        on_delete=models.CASCADE,
        related_name="reports",
        help_text="Related lab order."
    )
    report_file = models.FileField(
        upload_to="lab_reports/",
        help_text="Uploaded PDF report document."
    )
    uploaded_by = models.ForeignKey(
        "auth_rbac.User",
        on_delete=models.RESTRICT,
        related_name="+",
        help_text="Staff user who uploaded this report."
    )
    uploaded_at = models.DateTimeField(
        default=timezone.now,
        help_text="Timestamp when the report file was uploaded."
    )
    doctor_comment = models.TextField(
        blank=True,
        help_text="Annotation or feedback comment added by doctor."
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when reviewed by doctor."
    )

    class Meta:
        db_table = "lab_report"
        verbose_name = "Lab Report"
        verbose_name_plural = "Lab Reports"
        ordering = ["-uploaded_at"]

    def __str__(self) -> str:
        return f"LabReport({self.id}, order={self.lab_order_id})"

