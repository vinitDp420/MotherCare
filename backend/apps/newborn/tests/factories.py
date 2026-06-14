"""
MotherCare — Newborn Module Test Factories
"""
import factory
from factory.django import DjangoModelFactory
from django.utils import timezone
from apps.newborn.models import Newborn, NewbornVaccination, NewbornFeedingLog, NewbornVital
from apps.delivery.tests.factories import DeliveryFactory
from apps.people.tests.factories import UserFactory

class NewbornFactory(DjangoModelFactory):
    class Meta:
        model = Newborn

    delivery = factory.SubFactory(DeliveryFactory)
    baby_mrn = factory.Sequence(lambda n: f"NB-2026-{100+n:03d}")
    gender = "M"
    birth_weight_kg = 3.150
    birth_length_cm = 49.5
    apgar_1min = 8
    apgar_5min = 9
    condition = "healthy"
    nicu_required = False


class NewbornVaccinationFactory(DjangoModelFactory):
    class Meta:
        model = NewbornVaccination

    newborn = factory.SubFactory(NewbornFactory)
    vaccine_name = "BCG"
    dose_number = 1
    status = "due"


class NewbornFeedingLogFactory(DjangoModelFactory):
    class Meta:
        model = NewbornFeedingLog

    newborn = factory.SubFactory(NewbornFactory)
    feed_type = "breast"
    feed_time = factory.LazyFunction(timezone.now)
    volume_ml = None


class NewbornVitalFactory(DjangoModelFactory):
    class Meta:
        model = NewbornVital

    newborn = factory.SubFactory(NewbornFactory)
    recorded_at = factory.LazyFunction(timezone.now)
    weight_kg = 3.200
    head_circ_cm = 34.5
    temperature = 36.8
    recorded_by = factory.SubFactory(UserFactory)
