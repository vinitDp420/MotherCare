"""
MotherCare — Billing Module Tests
"""
import pytest
from datetime import timedelta
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.billing.models import Bill, BillItem, BillPayment
from apps.billing.tests.factories import BillFactory, BillItemFactory
from apps.people.tests.factories import PatientFactory, UserFactory
from apps.admissions.tests.factories import AdmissionFactory
from apps.billing import services
from apps.auth_rbac.models import UserSession
from core.utils import generate_session_token, hash_token

@pytest.mark.django_db
class TestBillingModels:
    def test_bill_item_save_recalculates_total(self):
        bill = BillFactory()
        item = BillItem.objects.create(
            bill=bill,
            item_type="consultation_charge",
            item_name="Consultation Fee",
            quantity=2,
            unit_price=250.00
        )
        assert item.total_price == 500.00


@pytest.mark.django_db
class TestBillingServices:
    def test_create_bill_with_items(self):
        patient = PatientFactory()
        user = UserFactory()
        items_data = [
            {"item_type": "consultation_charge", "item_name": "Dr. Visit", "quantity": 1, "unit_price": 500.00},
            {"item_type": "lab_charge", "item_name": "Blood Test", "quantity": 2, "unit_price": 150.00}
        ]

        bill = services.create_bill(
            patient=patient,
            bill_type="consultation",
            items_data=items_data,
            notes="Initial consultation and lab tests",
            created_by=user
        )

        assert bill.invoice_number.startswith("INV-")
        assert bill.total_amount == 800.00
        assert bill.amount_paid == 0
        assert bill.payment_status == "pending"
        assert bill.items.count() == 2

    def test_record_payment_partial(self):
        bill = BillFactory(total_amount=1000.00)
        user = UserFactory()
        
        payment = services.record_payment(
            bill=bill,
            amount=300.00,
            payment_method="cash",
            recorded_by=user
        )
        
        bill.refresh_from_db()
        assert bill.amount_paid == 300.00
        assert bill.payment_status == "partial"
        assert payment.amount == 300.00

    def test_record_payment_full(self):
        bill = BillFactory(total_amount=1000.00)
        user = UserFactory()
        
        services.record_payment(bill=bill, amount=400.00, payment_method="card", recorded_by=user)
        services.record_payment(bill=bill, amount=600.00, payment_method="upi", recorded_by=user)
        
        bill.refresh_from_db()
        assert bill.amount_paid == 1000.00
        assert bill.payment_status == "paid"

    def test_record_payment_overpayment_fails(self):
        bill = BillFactory(total_amount=1000.00)
        user = UserFactory()
        
        # Pay 800
        services.record_payment(bill=bill, amount=800.00, payment_method="cash", recorded_by=user)
        
        # Pay another 300 (total would be 1100, which exceeds 1000)
        with pytest.raises(ValueError, match="Overpayment not allowed"):
            services.record_payment(bill=bill, amount=300.00, payment_method="cash", recorded_by=user)

    def test_record_payment_invalid_amount(self):
        bill = BillFactory(total_amount=1000.00)
        user = UserFactory()
        
        with pytest.raises(ValueError, match="Payment amount must be greater than zero"):
            services.record_payment(bill=bill, amount=-50.00, payment_method="cash", recorded_by=user)


@pytest.mark.django_db
class TestBillingAPI:
    def setup_method(self):
        self.client = APIClient()
        self.user = UserFactory()
        raw_token = generate_session_token()
        token_hash = hash_token(raw_token)
        UserSession.objects.create(
            user=self.user,
            token_hash=token_hash,
            expires_at=timezone.now() + timedelta(hours=8),
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {raw_token}")
        self.patient = PatientFactory()

    def test_create_bill_api(self):
        url = reverse("bill-list")
        payload = {
            "patient": str(self.patient.id),
            "bill_type": "consultation",
            "notes": "API test notes",
            "items": [
                {"item_type": "consultation_charge", "item_name": "Consultation", "quantity": 1, "unit_price": 400.00}
            ]
        }
        
        response = self.client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert "invoice_number" in response.data
        assert float(response.data["total_amount"]) == 400.00

    def test_record_payment_api(self):
        bill = BillFactory(patient=self.patient, total_amount=500.00)
        url = reverse("bill-record-payment", kwargs={"pk": str(bill.id)})
        payload = {
            "amount": 200.00,
            "payment_method": "upi",
            "transaction_ref": "TXN12345"
        }
        
        response = self.client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert float(response.data["amount"]) == 200.00
        
        bill.refresh_from_db()
        assert bill.amount_paid == 200.00
        assert bill.payment_status == "partial"

    def test_list_payments_api(self):
        bill = BillFactory(patient=self.patient, total_amount=500.00)
        services.record_payment(bill=bill, amount=100.00, payment_method="cash", recorded_by=self.user)
        
        url = reverse("billpayment-list")
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
