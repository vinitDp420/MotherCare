"""
MotherCare — Pharmacy Module Tests
"""
import pytest
from datetime import date, timedelta
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.pharmacy.models import Medicine, MedicineBatch, PharmacySale, PharmacySaleItem
from apps.pharmacy.tests.factories import MedicineFactory, MedicineBatchFactory
from apps.people.tests.factories import PatientFactory, UserFactory
from apps.prescriptions.tests.factories import PrescriptionFactory, PrescriptionItemFactory
from apps.pharmacy import services
from apps.auth_rbac.models import UserSession
from core.utils import generate_session_token, hash_token

@pytest.mark.django_db
class TestPharmacyModels:
    def test_medicine_creation(self):
        medicine = MedicineFactory(name="Calpol", category="tablet")
        assert str(medicine) == "Calpol (Tablet)"
        assert medicine.is_active is True

    def test_medicine_batch_creation(self):
        batch = MedicineBatchFactory(batch_number="B123", quantity=100)
        assert str(batch) == f"Batch({batch.medicine.name}, B123, qty=100)"
        assert batch.quantity == 100


@pytest.mark.django_db
class TestPharmacyServices:
    def test_parse_duration_days(self):
        assert services.parse_duration_days("7 days") == 7
        assert services.parse_duration_days("30 days") == 30
        assert services.parse_duration_days("no-digits") == 7  # default fallback

    def test_parse_dosage_qty(self):
        assert services.parse_dosage_qty("1 tablet") == 1
        assert services.parse_dosage_qty("2 tablets") == 2
        assert services.parse_dosage_qty("500mg") == 1  # fallback for large numbers representing mg

    def test_calculate_dispense_qty(self):
        # BD for 7 days, 1 tablet = 2 * 7 * 1 = 14
        item = PrescriptionItemFactory.build(frequency="BD", duration="7 days", dosage="1 tablet")
        assert services.calculate_dispense_qty(item) == 14

        # OD for 5 days, 2 tablets = 1 * 5 * 2 = 10
        item = PrescriptionItemFactory.build(frequency="OD", duration="5 days", dosage="2 tablets")
        assert services.calculate_dispense_qty(item) == 10

        # weekly for 14 days, 1 tablet = 2 * 1 = 2
        item = PrescriptionItemFactory.build(frequency="weekly", duration="14 days", dosage="1 tablet")
        assert services.calculate_dispense_qty(item) == 2

    def test_dispense_prescription_fifo(self):
        user = UserFactory()
        patient = PatientFactory()
        prescription = PrescriptionFactory(patient=patient)
        medicine = MedicineFactory(is_active=True)
        
        PrescriptionItemFactory(
            prescription=prescription,
            medicine=medicine,
            dosage="1 tablet",
            frequency="BD",
            duration="5 days"  # calculates to 10 units
        )

        # Create two batches of the medicine:
        # Batch 1: expires in 5 days, purchase_date earlier, quantity 6
        # Batch 2: expires in 10 days, purchase_date later, quantity 10
        batch1 = MedicineBatchFactory(
            medicine=medicine,
            batch_number="BATCH-1",
            quantity=6,
            expiry_date=date.today() + timedelta(days=5),
            purchase_date=date.today() - timedelta(days=10),
            selling_price=10.00
        )
        batch2 = MedicineBatchFactory(
            medicine=medicine,
            batch_number="BATCH-2",
            quantity=10,
            expiry_date=date.today() + timedelta(days=10),
            purchase_date=date.today() - timedelta(days=5),
            selling_price=15.00
        )

        sale = services.dispense_prescription(prescription, sold_by=user)
        
        # Verify FIFO dispensation:
        # Batch 1 should be completely exhausted (6 units taken)
        # Batch 2 should have 4 units taken (remaining: 6)
        batch1.refresh_from_db()
        batch2.refresh_from_db()
        
        assert batch1.quantity == 0
        assert batch2.quantity == 6
        
        # Sale amount should be 6 * 10 + 4 * 15 = 60 + 60 = 120.00
        assert sale.total_amount == 120.00
        assert sale.items.count() == 2

    def test_dispense_prescription_insufficient_stock(self):
        user = UserFactory()
        patient = PatientFactory()
        prescription = PrescriptionFactory(patient=patient)
        medicine = MedicineFactory()
        PrescriptionItemFactory(
            prescription=prescription,
            medicine=medicine,
            dosage="1 tablet",
            frequency="BD",
            duration="5 days"  # calculates to 10
        )
        # Total available stock = 5
        MedicineBatchFactory(medicine=medicine, quantity=5, expiry_date=date.today() + timedelta(days=10))

        with pytest.raises(ValueError, match="Insufficient stock"):
            services.dispense_prescription(prescription, sold_by=user)

    def test_dispense_prescription_inactive_medicine(self):
        user = UserFactory()
        patient = PatientFactory()
        prescription = PrescriptionFactory(patient=patient)
        medicine = MedicineFactory(is_active=False)
        PrescriptionItemFactory(prescription=prescription, medicine=medicine)
        
        with pytest.raises(ValueError, match="is inactive and cannot be dispensed"):
            services.dispense_prescription(prescription, sold_by=user)

    def test_dispense_prescription_already_dispensed(self):
        user = UserFactory()
        patient = PatientFactory()
        prescription = PrescriptionFactory(patient=patient)
        medicine = MedicineFactory()
        PrescriptionItemFactory(prescription=prescription, medicine=medicine, dosage="1 tab", frequency="OD", duration="1 day")
        MedicineBatchFactory(medicine=medicine, quantity=100)

        # Dispense first time
        services.dispense_prescription(prescription, sold_by=user)

        # Dispense second time should raise error (BR-RX-08)
        with pytest.raises(ValueError, match="already been dispensed"):
            services.dispense_prescription(prescription, sold_by=user)

    def test_process_otc_sale_success(self):
        user = UserFactory()
        patient = PatientFactory()
        medicine = MedicineFactory()
        
        batch = MedicineBatchFactory(
            medicine=medicine,
            quantity=50,
            selling_price=12.00
        )
        
        items_data = [{"medicine": medicine, "qty": 5}]
        sale = services.process_otc_sale(patient, items_data, sold_by=user)
        
        batch.refresh_from_db()
        assert batch.quantity == 45
        assert sale.total_amount == 60.00
        assert sale.items.first().qty == 5
        assert sale.items.first().unit_price == 12.00


@pytest.mark.django_db
class TestPharmacyAPI:
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
        self.medicine = MedicineFactory()
        self.batch = MedicineBatchFactory(medicine=self.medicine, quantity=100, selling_price=10.00)

    def test_list_medicines(self):
        url = reverse("medicine-list")
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_list_batches(self):
        url = reverse("medicinebatch-list")
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_dispense_prescription_api(self):
        prescription = PrescriptionFactory(patient=self.patient)
        PrescriptionItemFactory(
            prescription=prescription,
            medicine=self.medicine,
            dosage="1 tablet",
            frequency="OD",
            duration="5 days"
        )
        
        url = reverse("pharmacysale-dispense")
        response = self.client.post(url, {"prescription_id": str(prescription.id)})
        assert response.status_code == status.HTTP_201_CREATED
        assert "invoice_number" in response.data
        assert float(response.data["total_amount"]) == 50.00

    def test_dispense_prescription_api_error_already_dispensed(self):
        prescription = PrescriptionFactory(patient=self.patient)
        PrescriptionItemFactory(
            prescription=prescription,
            medicine=self.medicine,
            dosage="1 tablet",
            frequency="OD",
            duration="5 days"
        )
        
        url = reverse("pharmacysale-dispense")
        # first dispense
        self.client.post(url, {"prescription_id": str(prescription.id)})
        # second dispense
        response = self.client.post(url, {"prescription_id": str(prescription.id)})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already been dispensed" in response.data["detail"]

    def test_otc_sale_api(self):
        url = reverse("pharmacysale-otc-sale")
        payload = {
            "patient_id": str(self.patient.id),
            "items": [
                {"medicine_id": str(self.medicine.id), "qty": 10}
            ]
        }
        response = self.client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert float(response.data["total_amount"]) == 100.00
        
        self.batch.refresh_from_db()
        assert self.batch.quantity == 90
