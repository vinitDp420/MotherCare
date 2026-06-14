"""
MotherCare — Pharmacy Module Test Factories
"""
import factory
from datetime import date
from factory.django import DjangoModelFactory
from django.utils import timezone
from apps.pharmacy.models import Medicine, MedicineBatch, PharmacySale, PharmacySaleItem
from apps.people.tests.factories import PatientFactory, UserFactory

class MedicineFactory(DjangoModelFactory):
    class Meta:
        model = Medicine
        django_get_or_create = ("name", "category")

    name = factory.Sequence(lambda n: f"Medicine-{n}")
    generic_name = factory.Sequence(lambda n: f"Generic-{n}")
    category = "tablet"
    unit = "tablet"
    reorder_level = 50
    is_active = True


class MedicineBatchFactory(DjangoModelFactory):
    class Meta:
        model = MedicineBatch

    medicine = factory.SubFactory(MedicineFactory)
    batch_number = factory.Sequence(lambda n: f"B-{100+n}")
    supplier_name = "Supplier Inc"
    purchase_date = date(2026, 1, 1)
    expiry_date = date(2027, 1, 1)
    quantity = 100
    purchase_price = 5.00
    selling_price = 10.00


class PharmacySaleFactory(DjangoModelFactory):
    class Meta:
        model = PharmacySale

    prescription = None
    patient = factory.SubFactory(PatientFactory)
    sold_by = factory.SubFactory(UserFactory)
    invoice_number = factory.Sequence(lambda n: f"RX-2026-{1000+n:04d}")
    total_amount = 0
    sold_at = factory.LazyFunction(timezone.now)


class PharmacySaleItemFactory(DjangoModelFactory):
    class Meta:
        model = PharmacySaleItem

    sale = factory.SubFactory(PharmacySaleFactory)
    medicine_batch = factory.SubFactory(MedicineBatchFactory)
    qty = 5
    unit_price = factory.LazyAttribute(lambda o: o.medicine_batch.selling_price)
    line_total = factory.LazyAttribute(lambda o: o.qty * o.unit_price)
