from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import F
from apps.pharmacy.models import PharmacySaleItem

@receiver(post_save, sender=PharmacySaleItem)
def auto_decrement_inventory(sender, instance, created, **kwargs):
    """
    Decrement medicine batch inventory quantity when a sale item is recorded.
    """
    if created:
        batch = instance.medicine_batch
        # Use F expression to avoid race conditions and update DB safely
        batch.quantity = F("quantity") - instance.qty
        batch.save(update_fields=["quantity"])
