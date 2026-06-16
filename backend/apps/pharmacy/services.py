"""
MotherCare — Pharmacy Module Services
"""
import re
from datetime import date
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from apps.pharmacy.models import Medicine, MedicineBatch, PharmacySale, PharmacySaleItem
from apps.audit.utils import log_event

def parse_duration_days(duration: str) -> int:
    """Helper to parse number of days from duration string."""
    digits = re.findall(r"\d+", duration)
    if digits:
        return int(digits[0])
    return 7  # default fallback


def parse_dosage_qty(dosage: str) -> int:
    """Helper to parse unit count from dosage string (e.g. '1 tablet' -> 1)."""
    digits = re.findall(r"\d+", dosage)
    if digits:
        val = int(digits[0])
        if val < 20:  # count rather than mg
            return val
    return 1  # default fallback


def calculate_dispense_qty(item) -> int:
    """Calculate the total quantity of medicine units to dispense."""
    freq_map = {
        "OD": 1,
        "BD": 2,
        "TDS": 3,
        "QID": 4,
        "SOS": 1,
        "STAT": 1,
        "weekly": 1,
    }
    freq_multiplier = freq_map.get(item.frequency, 1)
    days = parse_duration_days(item.duration)
    dosage_qty = parse_dosage_qty(item.dosage)
    if item.frequency == "weekly":
        weeks = max(1, days // 7)
        return weeks * dosage_qty
    return days * freq_multiplier * dosage_qty


def generate_pharmacy_invoice_number() -> str:
    """
    Generate a unique pharmacy invoice number in format RX-YYYY-NNNN.
    Sequence resets annually.
    """
    year = date.today().year
    prefix = f"RX-{year}-"
    last = (
        PharmacySale.objects
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


@transaction.atomic
def dispense_prescription(prescription, sold_by) -> PharmacySale:
    """
    Dispense medicines for a prescription. Enforces BR-RX-08: Prescription dispensed only once.
    """
    # Enforce BR-RX-08: Check if prescription already dispensed
    if PharmacySale.objects.filter(prescription=prescription).exists():
        raise ValueError("This prescription has already been dispensed.")

    prescription_items = prescription.items.all()
    if not prescription_items.exists():
        raise ValueError("Prescription has no items.")

    invoice_number = generate_pharmacy_invoice_number()
    
    # Create the sale header
    sale = PharmacySale.objects.create(
        prescription=prescription,
        patient=prescription.patient,
        sold_by=sold_by,
        invoice_number=invoice_number,
        total_amount=0,  # updated below
        sold_at=timezone.now(),
        created_by=sold_by
    )

    total_amount = 0

    for item in prescription_items:
        if not item.medicine.is_active:
            raise ValueError(f"Medicine {item.medicine.name} is inactive and cannot be dispensed.")

        qty_needed = calculate_dispense_qty(item)
        total_amount += _deduct_stock_fifo(sale, item.medicine, qty_needed)

    sale.total_amount = total_amount
    sale.save()

    # Write audit log
    log_event(
        action_type="create",
        entity_name="pharmacy_sale",
        entity_id=str(sale.id),
        user=sold_by,
        new_value={
            "prescription_id": str(prescription.id),
            "patient_id": str(prescription.patient_id),
            "invoice_number": invoice_number,
            "total_amount": float(total_amount)
        }
    )

    return sale


@transaction.atomic
def process_otc_sale(patient, items_data, sold_by) -> PharmacySale:
    """
    Process an Over-the-Counter (OTC) sale.
    items_data is a list of dicts: [{"medicine": medicine_obj, "qty": int}]
    """
    if not items_data:
        raise ValueError("OTC sale must contain at least one item.")

    invoice_number = generate_pharmacy_invoice_number()
    
    sale = PharmacySale.objects.create(
        patient=patient,
        sold_by=sold_by,
        invoice_number=invoice_number,
        total_amount=0,  # updated below
        sold_at=timezone.now(),
        created_by=sold_by
    )

    total_amount = 0

    for item in items_data:
        medicine = item["medicine"]
        qty = item["qty"]

        if qty <= 0:
            raise ValueError("Quantity must be greater than zero.")
        if not medicine.is_active:
            raise ValueError(f"Medicine {medicine.name} is inactive and cannot be sold.")

        total_amount += _deduct_stock_fifo(sale, medicine, qty)

    sale.total_amount = total_amount
    sale.save()

    # Write audit log
    log_event(
        action_type="create",
        entity_name="pharmacy_sale",
        entity_id=str(sale.id),
        user=sold_by,
        new_value={
            "patient_id": str(patient.id),
            "invoice_number": invoice_number,
            "total_amount": float(total_amount),
            "items_count": len(items_data)
        }
    )

    return sale


def _deduct_stock_fifo(sale, medicine, qty_needed) -> float:
    """
    Internal helper to lock and deduct stock using FIFO (expiry_date ASC, purchase_date ASC).
    Returns total cost of the deducted batches.
    """
    today = timezone.now().date()
    # Find batches with stock
    batches = (
        MedicineBatch.objects.select_for_update()
        .filter(medicine=medicine, quantity__gt=0, expiry_date__gt=today)
        .order_by("expiry_date", "purchase_date")
    )

    total_available = sum(b.quantity for b in batches)
    if total_available < qty_needed:
        raise ValueError(f"Insufficient stock for medicine: {medicine.name}. Required: {qty_needed}, Available: {total_available}")

    remaining_needed = qty_needed
    total_cost = 0

    for batch in batches:
        if remaining_needed <= 0:
            break

        if batch.quantity >= remaining_needed:
            # Deduct full remaining qty
            qty_to_take = remaining_needed
            
            line_total = qty_to_take * batch.selling_price
            PharmacySaleItem.objects.create(
                sale=sale,
                medicine_batch=batch,
                qty=qty_to_take,
                unit_price=batch.selling_price,
                line_total=line_total,
                created_by=sale.created_by
            )
            total_cost += line_total
            remaining_needed = 0
        else:
            # Deduct entire batch qty
            qty_to_take = batch.quantity
            
            line_total = qty_to_take * batch.selling_price
            PharmacySaleItem.objects.create(
                sale=sale,
                medicine_batch=batch,
                qty=qty_to_take,
                unit_price=batch.selling_price,
                line_total=line_total,
                created_by=sale.created_by
            )
            total_cost += line_total
            remaining_needed -= qty_to_take

    return total_cost
