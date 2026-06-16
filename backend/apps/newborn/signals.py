from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.delivery.models import Delivery
from apps.newborn.models import Newborn
from core.utils import generate_baby_mrn
from apps.newborn.constants import GENDER_UNDETERMINED

@receiver(post_save, sender=Delivery)
def auto_create_newborn_shell(sender, instance, created, **kwargs):
    """
    Auto-create newborn shell when a delivery record is saved.
    Enforces that at least one newborn record exists per delivery.
    """
    if created:
        if not Newborn.objects.filter(delivery=instance).exists():
            Newborn.objects.create(
                delivery=instance,
                baby_mrn=generate_baby_mrn(),
                gender=GENDER_UNDETERMINED,
                birth_weight_kg=0.000,
                apgar_1min=0,
                apgar_5min=0,
                condition="healthy",
                created_by=instance.created_by
            )
