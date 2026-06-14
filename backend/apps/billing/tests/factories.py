"""
MotherCare — Billing Module Test Factories
"""
import factory
from factory.django import DjangoModelFactory
from django.utils import timezone
from apps.billing.models import Bill, BillItem, BillPayment
from apps.people.tests.factories import PatientFactory, UserFactory

class BillFactory(DjangoModelFactory):
    class Meta:
        model = Bill

    patient = factory.SubFactory(PatientFactory)
    bill_type = "consultation"
    admission = None
    invoice_number = factory.Sequence(lambda n: f"INV-2026-{1000+n:04d}")
    total_amount = 0
    amount_paid = 0
    payment_status = "pending"
    generated_at = factory.LazyFunction(timezone.now)


class BillItemFactory(DjangoModelFactory):
    class Meta:
        model = BillItem

    bill = factory.SubFactory(BillFactory)
    item_type = "consultation_charge"
    item_name = "Consultation Fee"
    reference_id = None
    quantity = 1
    unit_price = 300.00
    total_price = 300.00


class BillPaymentFactory(DjangoModelFactory):
    class Meta:
        model = BillPayment

    bill = factory.SubFactory(BillFactory)
    amount = 300.00
    payment_method = "cash"
    transaction_ref = ""
    paid_at = factory.LazyFunction(timezone.now)
    recorded_by = factory.SubFactory(UserFactory)
