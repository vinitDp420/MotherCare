"""
MotherCare — Admissions & Bed Management Test Factories
"""
import factory
from factory.django import DjangoModelFactory
from django.utils import timezone
from apps.admissions.models import Bed, Admission, WardTransfer
from apps.people.tests.factories import PatientFactory, DoctorFactory, UserFactory

class BedFactory(DjangoModelFactory):
    class Meta:
        model = Bed

    bed_number = factory.Sequence(lambda n: f"B-{100+n}")
    ward_type = "general"
    status = "available"
    floor = 1


class AdmissionFactory(DjangoModelFactory):
    class Meta:
        model = Admission

    patient = factory.SubFactory(PatientFactory)
    bed = factory.SubFactory(BedFactory)
    doctor = factory.SubFactory(DoctorFactory)
    status = "active"
    admission_type = "maternity"
    admitted_at = factory.LazyFunction(timezone.now)


class WardTransferFactory(DjangoModelFactory):
    class Meta:
        model = WardTransfer

    admission = factory.SubFactory(AdmissionFactory)
    from_bed = factory.SubFactory(BedFactory)
    to_bed = factory.SubFactory(BedFactory)
    transferred_at = factory.LazyFunction(timezone.now)
    reason = "Shifted"
    transferred_by = factory.SubFactory(UserFactory)
