"""
MotherCare — People Module Models (Domain 3)
Architecture: mothercare_final_architecture_v2.md — DOMAIN 3

Entities:
    Patient                 — Core demographic record. Soft-deletable.
    EmergencyContact        — Reusable contact record.
    PatientEmergencyContact — Junction: Patient ↔ EmergencyContact (CHANGE 2 from v1.0)
    PatientAllergy          — Per-patient allergy record. Linked to Patient, not Pregnancy.
    Staff                   — All hospital employees.
    Doctor                  — Clinical sub-type of Staff. One-to-one.

Business Rules enforced here:
    BR-PAT-01: UNIQUE(mrn)
    BR-PAT-02: MRN auto-generated (via service / pre_save signal)
    BR-PAT-03: full_name, dob, phone, blood_group mandatory
    BR-PAT-10: Hard DELETE forbidden — is_deleted flag used (SoftDeleteModel)
    BR-PAT-13: Allergy severity values: mild, moderate, severe, life_threatening
"""
from django.core.validators import RegexValidator
from django.db import models

from apps.people.constants import (
    ALLERGY_SEVERITY_CHOICES,
    BLOOD_GROUP_CHOICES,
    BLOOD_GROUP_UNKNOWN,
    MAX_ALLERGEN_LENGTH,
    MAX_DESIGNATION_LENGTH,
    MAX_MRN_LENGTH,
    MAX_NAME_LENGTH,
    MAX_PHONE_LENGTH,
    MAX_REACTION_TYPE_LENGTH,
    MAX_REGISTRATION_NO_LENGTH,
    MAX_SPECIALISATION_LENGTH,
    RELATIONSHIP_TYPE_CHOICES,
)
from core.managers import SoftDeleteManager
from core.models import BaseModel, SoftDeleteModel

phone_validator = RegexValidator(
    regex=r"^\+?[\d\s\-().]{7,20}$",
    message="Enter a valid phone number (7–20 digits, may include +, -, spaces, parentheses).",
)


# ─────────────────────────────────────────────────────────────────────────────
# Patient — Core demographic record
# Architecture: BR-PAT-01 to BR-PAT-12
# ─────────────────────────────────────────────────────────────────────────────
class Patient(SoftDeleteModel):
    """
    Core demographic record for a maternity patient.
    One row per person regardless of how many pregnancies.

    MRN is auto-generated at registration via service layer (BR-PAT-02).
    Hard DELETE is forbidden — use soft_delete() method (BR-PAT-10).
    """

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    mrn = models.CharField(
        max_length=MAX_MRN_LENGTH,
        unique=True,
        db_index=True,
        help_text="Medical Record Number. Auto-generated. Format: PT-XXXX-A. Never manually assigned.",
    )
    full_name = models.CharField(
        max_length=MAX_NAME_LENGTH,
        help_text="Full name of the patient (BR-PAT-03: mandatory).",
    )
    dob = models.DateField(
        help_text="Date of birth (BR-PAT-03: mandatory).",
    )
    blood_group = models.CharField(
        max_length=10,
        choices=BLOOD_GROUP_CHOICES,
        default=BLOOD_GROUP_UNKNOWN,
        help_text="ABO/Rh blood group (BR-PAT-03: mandatory).",
    )
    phone = models.CharField(
        max_length=MAX_PHONE_LENGTH,
        validators=[phone_validator],
        db_index=True,
        help_text="Primary phone number (BR-PAT-03: mandatory, BR-PAT-07: searchable).",
    )
    alt_phone = models.CharField(
        max_length=MAX_PHONE_LENGTH,
        blank=True,
        validators=[phone_validator],
        help_text="Alternate phone number (optional).",
    )
    email = models.EmailField(
        blank=True,
        help_text="Email address (optional).",
    )
    address = models.TextField(
        blank=True,
        help_text="Residential address (optional).",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this patient is currently active.",
    )

    class Meta:
        db_table = "patient"
        verbose_name = "Patient"
        verbose_name_plural = "Patients"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["mrn"], name="idx_patient_mrn"),
            models.Index(fields=["phone"], name="idx_patient_phone"),
            models.Index(fields=["full_name"], name="idx_patient_name"),
            models.Index(
                fields=["is_deleted", "is_active"],
                name="idx_patient_active_not_deleted",
                condition=models.Q(is_deleted=False),
            ),
        ]

    def __str__(self) -> str:
        return f"{self.mrn} — {self.full_name}"


# ─────────────────────────────────────────────────────────────────────────────
# EmergencyContact — Reusable contact record
# Architecture: DOMAIN 3 — "Reusable contact record. Not tied 1:1 to any patient"
# ─────────────────────────────────────────────────────────────────────────────
class EmergencyContact(BaseModel):
    """
    A reusable emergency contact entity.
    Linked to patients via PatientEmergencyContact (junction).
    A single contact record can be shared across patients.
    """

    name = models.CharField(
        max_length=MAX_NAME_LENGTH,
        help_text="Full name of the emergency contact.",
    )
    phone = models.CharField(
        max_length=MAX_PHONE_LENGTH,
        validators=[phone_validator],
        help_text="Primary phone number.",
    )
    alt_phone = models.CharField(
        max_length=MAX_PHONE_LENGTH,
        blank=True,
        validators=[phone_validator],
        help_text="Alternate phone number (optional).",
    )
    email = models.EmailField(
        blank=True,
        help_text="Email address (optional).",
    )

    class Meta:
        db_table = "emergency_contact"
        verbose_name = "Emergency Contact"
        verbose_name_plural = "Emergency Contacts"
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.phone})"


# ─────────────────────────────────────────────────────────────────────────────
# PatientEmergencyContact — Junction table (CHANGE 2 from v1.0 architecture)
# Replaces old single FK on Patient; enables multiple contacts per patient.
# Constraints: UNIQUE(patient_id, contact_id), CHECK(priority > 0)
# ─────────────────────────────────────────────────────────────────────────────
class PatientEmergencyContact(BaseModel):
    """
    Junction: links one Patient to multiple EmergencyContacts.

    Architecture CHANGE 2: replaces the old single emergency_contact FK on Patient.
    Supports priority-ordered contacts and relationship type per patient-contact pair.
    BR-PAT-06: UNIQUE(patient_id, contact_id)
    """

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="emergency_contacts",
        help_text="The patient this contact is linked to.",
    )
    contact = models.ForeignKey(
        EmergencyContact,
        on_delete=models.CASCADE,
        related_name="patient_links",
        help_text="The emergency contact record.",
    )
    relationship_type = models.CharField(
        max_length=20,
        choices=RELATIONSHIP_TYPE_CHOICES,
        help_text="Relationship of this contact to the patient.",
    )
    priority = models.PositiveSmallIntegerField(
        help_text="Priority order. 1 = primary contact. Lower number = higher priority.",
    )
    is_primary = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Denormalised flag: True when priority = 1. Managed automatically.",
    )

    class Meta:
        db_table = "patient_emergency_contact"
        verbose_name = "Patient Emergency Contact"
        verbose_name_plural = "Patient Emergency Contacts"
        unique_together = [["patient", "contact"]]  # BR-PAT-06
        ordering = ["priority"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(priority__gt=0),
                name="chk_patient_ec_priority_positive",
            ),
        ]
        indexes = [
            models.Index(
                fields=["patient", "priority"],
                name="idx_patient_ec_priority",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.patient.mrn} ↔ {self.contact.name} (Priority: {self.priority})"

    def save(self, *args: object, **kwargs: object) -> None:
        """Auto-set is_primary from priority."""
        self.is_primary = self.priority == 1
        super().save(*args, **kwargs)


# ─────────────────────────────────────────────────────────────────────────────
# PatientAllergy — Per-patient allergy record
# Architecture: "Allergies linked to Patient (not Pregnancy)"
# BR-PAT-05, BR-PAT-13, BR-PAT-15
# ─────────────────────────────────────────────────────────────────────────────
class PatientAllergy(BaseModel):
    """
    Allergy record for a patient.
    Linked to Patient (not Pregnancy) so allergies persist across all pregnancies.
    Surfaced at prescription time for allergy checking (BR-PAT-15, BR-RX-05).
    """

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="allergies",
        help_text="The patient who has this allergy.",
    )
    allergen = models.CharField(
        max_length=MAX_ALLERGEN_LENGTH,
        help_text="Name of the allergen (e.g. medicine generic name, food, latex).",
    )
    reaction_type = models.CharField(
        max_length=MAX_REACTION_TYPE_LENGTH,
        blank=True,
        help_text="Observed reaction (e.g. hives, anaphylaxis, rash).",
    )
    severity = models.CharField(
        max_length=20,
        choices=ALLERGY_SEVERITY_CHOICES,
        help_text="Severity level. 'severe' and 'life_threatening' trigger blocking alerts (BR-RX-05).",
    )
    recorded_date = models.DateField(
        help_text="Date this allergy was recorded.",
    )
    recorded_by = models.ForeignKey(
        "auth_rbac.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="recorded_allergies",
        help_text="User who recorded this allergy entry.",
    )
    notes = models.TextField(
        blank=True,
        help_text="Additional clinical notes.",
    )

    class Meta:
        db_table = "patient_allergy"
        verbose_name = "Patient Allergy"
        verbose_name_plural = "Patient Allergies"
        ordering = ["-severity", "-recorded_date"]
        indexes = [
            models.Index(
                fields=["patient", "allergen"],
                name="idx_allergy_patient_allergen",
            ),
            models.Index(
                fields=["patient", "severity"],
                name="idx_allergy_patient_severity",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.patient.mrn} — {self.allergen} ({self.severity})"


# ─────────────────────────────────────────────────────────────────────────────
# Staff — All hospital employees
# Architecture: id, user_id → user, department_id → department, full_name,
#               designation, phone, email, join_date, is_active
# ─────────────────────────────────────────────────────────────────────────────
class Staff(BaseModel):
    """
    All hospital employees (clinical and non-clinical).
    Links to User for system access (optional — some staff may not have system login).
    Department link is nullable (staff can exist before department assignment).
    """

    user = models.OneToOneField(
        "auth_rbac.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="staff_profile",
        help_text="System login account. NULL if this staff member has no system access.",
    )
    department = models.ForeignKey(
        "hospital_config.Department",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="staff_members",
        help_text="Department this staff member belongs to.",
    )
    full_name = models.CharField(
        max_length=MAX_NAME_LENGTH,
        help_text="Full name of the staff member.",
    )
    designation = models.CharField(
        max_length=MAX_DESIGNATION_LENGTH,
        help_text="Job title or designation (e.g. Nurse, Lab Technician, Receptionist).",
    )
    phone = models.CharField(
        max_length=MAX_PHONE_LENGTH,
        validators=[phone_validator],
        help_text="Contact phone number.",
    )
    email = models.EmailField(
        blank=True,
        help_text="Work email address (optional).",
    )
    join_date = models.DateField(
        help_text="Date of joining the hospital.",
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Active/Inactive status. Inactive staff cannot be assigned to new appointments.",
    )

    class Meta:
        db_table = "staff"
        verbose_name = "Staff"
        verbose_name_plural = "Staff"
        ordering = ["full_name"]
        indexes = [
            models.Index(fields=["is_active"], name="idx_staff_active"),
            models.Index(fields=["department", "is_active"], name="idx_staff_dept_active"),
        ]

    def __str__(self) -> str:
        return f"{self.full_name} ({self.designation})"


# ─────────────────────────────────────────────────────────────────────────────
# Doctor — Clinical sub-type of Staff
# Architecture: id, staff_id → staff (CASCADE, UNIQUE), specialisation,
#               registration_no, available_from (TIME), available_to (TIME)
# Constraints: UNIQUE(registration_no)
# ─────────────────────────────────────────────────────────────────────────────
class Doctor(BaseModel):
    """
    Clinical credentials and availability record for a doctor.
    One-to-one with Staff. Not all staff are doctors; not all doctors have staff records yet.

    BR-APPT-04: Only active doctors with a matching availability window may be booked.
    BR-APPT-13: Availability stored as available_from / available_to (TIME fields).
    """

    staff = models.OneToOneField(
        Staff,
        on_delete=models.CASCADE,
        related_name="doctor_profile",
        help_text="The staff record this doctor credential is linked to.",
    )
    specialisation = models.CharField(
        max_length=MAX_SPECIALISATION_LENGTH,
        help_text="Medical specialisation (e.g. Obstetrics, Gynecology, Pediatrics).",
    )
    registration_no = models.CharField(
        max_length=MAX_REGISTRATION_NO_LENGTH,
        unique=True,
        db_index=True,
        help_text="Medical council registration number. Must be unique. Architecture: UNIQUE(registration_no).",
    )
    available_from = models.TimeField(
        null=True,
        blank=True,
        help_text="Start of the doctor's availability window (TIME, nullable for on-call doctors).",
    )
    available_to = models.TimeField(
        null=True,
        blank=True,
        help_text="End of the doctor's availability window (TIME, nullable for on-call doctors).",
    )

    class Meta:
        db_table = "doctor"
        verbose_name = "Doctor"
        verbose_name_plural = "Doctors"
        ordering = ["staff__full_name"]
        indexes = [
            models.Index(fields=["registration_no"], name="idx_doctor_reg_no"),
        ]

    def __str__(self) -> str:
        return f"Dr. {self.staff.full_name} ({self.specialisation})"

    @property
    def is_active(self) -> bool:
        """Delegate active status to the linked staff record."""
        return self.staff.is_active

    @property
    def full_name(self) -> str:
        """Full name from the linked staff record."""
        return self.staff.full_name
