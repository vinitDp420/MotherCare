"""
MotherCare — HR Module Models
"""
from django.db import models
from django.utils import timezone
from core.models import BaseModel


LEAVE_TYPE_CHOICES = [
    ("sick", "Sick Leave"),
    ("casual", "Casual Leave"),
    ("annual", "Annual Leave"),
    ("maternity", "Maternity Leave"),
    ("emergency", "Emergency Leave"),
    ("other", "Other"),
]

LEAVE_STATUS_CHOICES = [
    ("pending", "Pending"),
    ("approved", "Approved"),
    ("rejected", "Rejected"),
    ("cancelled", "Cancelled"),
]

SHIFT_CHOICES = [
    ("morning", "Morning (07:00–15:00)"),
    ("afternoon", "Afternoon (15:00–23:00)"),
    ("night", "Night (23:00–07:00)"),
]


class LeaveRequest(BaseModel):
    """
    Leave request raised by a staff member.
    """
    staff = models.ForeignKey(
        "people.Staff",
        on_delete=models.CASCADE,
        related_name="leave_requests",
    )
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=LEAVE_STATUS_CHOICES, default="pending", db_index=True)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        "auth_rbac.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_leaves",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)

    class Meta:
        db_table = "hr_leave_request"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Leave({self.staff_id}, {self.leave_type}, {self.status})"

    @property
    def duration_days(self) -> int:
        return (self.end_date - self.start_date).days + 1


class ShiftAssignment(BaseModel):
    """
    Daily shift assignment for a staff member.
    """
    staff = models.ForeignKey(
        "people.Staff",
        on_delete=models.CASCADE,
        related_name="shift_assignments",
    )
    shift = models.CharField(max_length=20, choices=SHIFT_CHOICES)
    shift_date = models.DateField(default=timezone.now)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "hr_shift_assignment"
        ordering = ["-shift_date", "shift"]
        unique_together = [["staff", "shift_date"]]

    def __str__(self) -> str:
        return f"Shift({self.staff_id}, {self.shift}, {self.shift_date})"
