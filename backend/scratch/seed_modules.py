"""
MotherCare - Full Module Seed Script
Seeds: Beds, Bills, Leave Requests.

Usage (from backend dir):
    python scratch/seed_modules.py
"""
import os
import sys
import django
from pathlib import Path

# Bootstrap Django
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.sqlite")
django.setup()

from django.utils import timezone
from datetime import date, timedelta
import random

from apps.admissions.models import Bed
from apps.billing.models import Bill, BillItem
from apps.people.models import Patient, Staff
from apps.hr.models import LeaveRequest

print("=" * 60)
print("MotherCare Module Seed Script")
print("=" * 60)

# ---- 1. BEDS ----
BED_SPECS = [
    ("G-101", "general", "available", 1),
    ("G-102", "general", "occupied", 1),
    ("G-103", "general", "occupied", 1),
    ("G-104", "general", "cleaning", 1),
    ("G-201", "general", "available", 2),
    ("G-202", "general", "occupied", 2),
    ("P-101", "private", "available", 1),
    ("P-102", "private", "occupied", 1),
    ("P-103", "private", "reserved", 1),
    ("P-201", "private", "available", 2),
    ("L-101", "labor", "occupied", 1),
    ("L-102", "labor", "occupied", 1),
    ("L-103", "labor", "available", 1),
    ("L-104", "labor", "available", 1),
    ("N-101", "icu", "occupied", 1),
    ("N-102", "icu", "available", 1),
    ("N-103", "icu", "occupied", 1),
    ("N-104", "icu", "available", 1),
    ("SP-101", "semi_private", "available", 1),
    ("SP-102", "semi_private", "occupied", 1),
]

created_beds = 0
for bed_num, ward, status, floor in BED_SPECS:
    _, was_created = Bed.objects.get_or_create(
        bed_number=bed_num,
        defaults={
            "ward_type": ward,
            "status": status,
            "floor": floor,
            "last_cleaned_at": timezone.now() - timedelta(hours=random.randint(1, 48)),
        },
    )
    if was_created:
        created_beds += 1

print(f"[OK] Beds: {created_beds} created, {Bed.objects.count()} total.")

# ---- 2. BILLS ----
patients = list(Patient.objects.all()[:10])
if patients:
    BILL_TYPES = ["consultation", "lab", "pharmacy", "admission", "misc"]
    STATUSES = ["paid", "pending", "overdue", "partial", "paid", "paid"]
    ITEM_DATA = {
        "consultation": [("Consultation Fee", 500), ("OPD Charge", 200)],
        "lab": [("Blood CBC", 300), ("Urine Routine", 150), ("Blood Sugar", 100)],
        "pharmacy": [("Oxytocin Injection", 250), ("Iron Tablets x30", 180), ("Folic Acid x30", 120)],
        "admission": [("Admission Charge", 1000), ("Room Charges 3d", 3000), ("Nursing Charge", 500)],
        "misc": [("Scan USG", 800), ("Bandaging", 100)],
    }

    created_bills = 0
    bill_counter = Bill.objects.count() + 1
    for i, patient in enumerate(patients * 2):
        bill_type = BILL_TYPES[i % len(BILL_TYPES)]
        pay_status = STATUSES[i % len(STATUSES)]
        invoice_num = f"MC-{timezone.now().year}-{str(bill_counter).zfill(5)}"
        while Bill.objects.filter(invoice_number=invoice_num).exists():
            bill_counter += 1
            invoice_num = f"MC-{timezone.now().year}-{str(bill_counter).zfill(5)}"

        items = ITEM_DATA[bill_type]
        total = sum(price for _, price in items)
        paid = total if pay_status == "paid" else (total // 2 if pay_status == "partial" else 0)

        try:
            bill = Bill.objects.create(
                patient=patient,
                bill_type=bill_type,
                invoice_number=invoice_num,
                total_amount=total,
                amount_paid=paid,
                payment_status=pay_status,
                generated_at=timezone.now() - timedelta(days=random.randint(0, 30)),
            )
            for item_name, unit_price in items:
                BillItem.objects.create(
                    bill=bill,
                    item_type=f"{bill_type}_charge",
                    item_name=item_name,
                    quantity=1,
                    unit_price=unit_price,
                    total_price=unit_price,
                )
            created_bills += 1
            bill_counter += 1
        except Exception as e:
            print(f"  [WARN] Bill error: {e}")

    print(f"[OK] Bills: {created_bills} created, {Bill.objects.count()} total.")
else:
    print("[WARN] No patients found - skipping bills. Run seed_data management command first.")

# ---- 3. LEAVE REQUESTS ----
staff_list = list(Staff.objects.filter(is_active=True)[:8])
if staff_list:
    LEAVE_TYPES = ["sick", "casual", "annual", "emergency"]
    STATUSES_L = ["pending", "approved", "rejected", "pending", "approved"]
    created_leaves = 0
    for i, staff in enumerate(staff_list):
        leave_type = LEAVE_TYPES[i % len(LEAVE_TYPES)]
        lst = STATUSES_L[i % len(STATUSES_L)]
        start = date.today() + timedelta(days=random.randint(-5, 10))
        end = start + timedelta(days=random.randint(1, 4))
        try:
            _, was_created = LeaveRequest.objects.get_or_create(
                staff=staff,
                leave_type=leave_type,
                start_date=start,
                defaults={
                    "end_date": end,
                    "status": lst,
                    "reason": f"Personal {leave_type} leave application.",
                },
            )
            if was_created:
                created_leaves += 1
        except Exception as e:
            print(f"  [WARN] Leave error: {e}")

    print(f"[OK] Leave Requests: {created_leaves} created, {LeaveRequest.objects.count()} total.")
else:
    print("[WARN] No staff found - skipping leave requests.")

print("")
print("[DONE] Seeding complete! All modules have sample data.")
print("=" * 60)
