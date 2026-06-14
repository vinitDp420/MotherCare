"""
MotherCare — Prescription Test Factories
"""
from __future__ import annotations

import factory
from django.utils import timezone
from factory.django import DjangoModelFactory

from apps.prescriptions.constants import FREQ_OD
from apps.prescriptions.models import Prescription, PrescriptionItem


class MedicineFactory(DjangoModelFactory):
    """Inline Medicine factory to avoid cross-module dependency."""
    class Meta:
        model = "pharmacy.Medicine"
        django_get_or_create = ("name", "category")

    name = factory.Sequence(lambda n: f"Medicine {n}")
    generic_name = factory.Sequence(lambda n: f"Generic-{n}")
    category = "tablet"
    unit = "tablet"
    is_active = True


class PrescriptionFactory(DjangoModelFactory):
    class Meta:
        model = Prescription

    consultation = factory.SubFactory(
        "apps.consultations.tests.factories.ConsultationFactory"
    )
    patient = factory.LazyAttribute(lambda o: o.consultation.patient)
    issued_at = factory.LazyFunction(timezone.now)
    notes = ""


class PrescriptionItemFactory(DjangoModelFactory):
    class Meta:
        model = PrescriptionItem

    prescription = factory.SubFactory(PrescriptionFactory)
    medicine = factory.SubFactory(MedicineFactory)
    dosage = "500mg"
    frequency = FREQ_OD
    duration = "7 days"
    instructions = "Take after food."
    sort_order = factory.Sequence(lambda n: n)
