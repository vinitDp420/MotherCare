"""
MotherCare — Shared Utilities
MRN generation, invoice numbering, token assignment, and other shared utilities.
"""
import hashlib
import random
import secrets
import string
from datetime import date

from django.db import transaction


# ─────────────────────────────────────────────────────────────────────────────
# MRN Generation — Patient Medical Record Number
# Format: PT-XXXX-A  (XXXX = 4 random digits, A = random uppercase letter)
# BUSINESS_RULES.md BR-PAT-02
# ─────────────────────────────────────────────────────────────────────────────
def generate_patient_mrn() -> str:
    """
    Generate a unique Patient MRN in the format PT-XXXX-A.
    Checks uniqueness against the database before returning.

    Returns:
        A unique MRN string like "PT-8472-A".
    """
    from apps.people.models import Patient  # Local import to avoid circular refs

    max_attempts = 100
    for _ in range(max_attempts):
        digits = "".join(random.choices(string.digits, k=4))
        letter = random.choice(string.ascii_uppercase)
        mrn = f"PT-{digits}-{letter}"
        if not Patient.all_objects.filter(mrn=mrn).exists():
            return mrn

    raise RuntimeError("Failed to generate a unique patient MRN after 100 attempts.")


# ─────────────────────────────────────────────────────────────────────────────
# Baby MRN Generation — Newborn Medical Record Number
# Format: NB-YYYY-XXX  (YYYY = current year, XXX = 3-digit zero-padded sequence)
# BUSINESS_RULES.md BR-NB-02
# ─────────────────────────────────────────────────────────────────────────────
def generate_baby_mrn() -> str:
    """
    Generate a unique Newborn MRN in the format NB-YYYY-XXX.
    Sequence resets annually. Uses database-level sequence for safety.

    Returns:
        A unique baby MRN string like "NB-2024-042".
    """
    from apps.newborn.models import Newborn  # Local import

    year = date.today().year
    with transaction.atomic():
        # Count existing babies this year to determine sequence
        prefix = f"NB-{year}-"
        last = (
            Newborn.all_objects
            .filter(baby_mrn__startswith=prefix)
            .order_by("-baby_mrn")
            .values_list("baby_mrn", flat=True)
            .first()
        )
        if last:
            try:
                seq = int(last.split("-")[-1]) + 1
            except (ValueError, IndexError):
                seq = 1
        else:
            seq = 1

        baby_mrn = f"{prefix}{seq:03d}"

        # Verify uniqueness (should always be unique due to atomic block)
        if Newborn.all_objects.filter(baby_mrn=baby_mrn).exists():
            raise RuntimeError(f"Baby MRN collision detected: {baby_mrn}")

        return baby_mrn


# ─────────────────────────────────────────────────────────────────────────────
# Invoice Number Generation — Billing Invoice
# Format: INV-YYYY-NNNN  (sequence resets annually)
# BUSINESS_RULES.md BR-BILL-11
# ─────────────────────────────────────────────────────────────────────────────
def generate_invoice_number() -> str:
    """
    Generate a unique invoice number in the format INV-YYYY-NNNN.
    Annual sequence, zero-padded to 4 digits.

    Returns:
        A unique invoice number like "INV-2024-0001".
    """
    from apps.billing.models import Bill  # Local import

    year = date.today().year
    with transaction.atomic():
        prefix = f"INV-{year}-"
        last = (
            Bill.objects
            .filter(invoice_number__startswith=prefix)
            .order_by("-invoice_number")
            .values_list("invoice_number", flat=True)
            .first()
        )
        if last:
            try:
                seq = int(last.split("-")[-1]) + 1
            except (ValueError, IndexError):
                seq = 1
        else:
            seq = 1

        return f"{prefix}{seq:04d}"


# ─────────────────────────────────────────────────────────────────────────────
# Token Number Assignment — Appointment Token
# Sequential per doctor per calendar day, starting from 101
# BUSINESS_RULES.md BR-APPT-03
# ─────────────────────────────────────────────────────────────────────────────
def get_next_token_number(doctor_id: str, appointment_date: date) -> int:
    """
    Return the next sequential token number for a doctor on a given day.
    Token numbers start from 101 and increment by 1.

    Args:
        doctor_id: UUID of the doctor.
        appointment_date: The calendar date for the appointment.

    Returns:
        Next token integer (e.g. 101, 102, ...).
    """
    from apps.appointments.models import Appointment  # Local import

    last = (
        Appointment.objects
        .filter(
            doctor_id=doctor_id,
            appointment_datetime__date=appointment_date,
        )
        .order_by("-token_number")
        .values_list("token_number", flat=True)
        .first()
    )
    if last is None:
        return 101
    return last + 1


# ─────────────────────────────────────────────────────────────────────────────
# Session Token Utilities — SHA-256 hashing
# AUTH-02: raw tokens never stored; only SHA-256 hash
# ─────────────────────────────────────────────────────────────────────────────
def generate_session_token() -> str:
    """Generate a cryptographically secure random token (256 bits)."""
    return secrets.token_urlsafe(32)


def hash_token(raw_token: str) -> str:
    """Return the SHA-256 hex digest of a raw session token."""
    return hashlib.sha256(raw_token.encode()).hexdigest()
