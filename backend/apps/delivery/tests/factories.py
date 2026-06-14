"""
MotherCare — Delivery Module Test Factories
"""
import factory
from factory.django import DjangoModelFactory
from django.utils import timezone
from apps.delivery.models import Delivery, DeliveryProcedure
from apps.admissions.tests.factories import AdmissionFactory
from apps.people.tests.factories import PatientFactory, DoctorFactory

class DeliveryFactory(DjangoModelFactory):
    class Meta:
        model = Delivery

    admission = factory.SubFactory(AdmissionFactory)
    patient = factory.LazyAttribute(lambda o: o.admission.patient)
    doctor = factory.LazyAttribute(lambda o: o.admission.doctor)
    delivery_datetime = factory.LazyFunction(timezone.now)
    delivery_mode = "normal"
    blood_loss_ml = 200
    placenta_complete = True


class DeliveryProcedureFactory(DjangoModelFactory):
    class Meta:
        model = DeliveryProcedure

    delivery = factory.SubFactory(DeliveryFactory)
    performed_by = factory.LazyAttribute(lambda o: o.delivery.doctor)
    procedure_name = "Episiotomy"
    indication = "Maternal fatigue"
    technique = "Midline"
    implants_used = ""
    duration_minutes = 15
    performed_at = factory.LazyFunction(timezone.now)
