"""
MotherCare — Appointments & Consultations Test Factories
"""
from __future__ import annotations

from datetime import timedelta

import factory
from django.utils import timezone
from factory.django import DjangoModelFactory

from apps.appointments.constants import (
    APPT_TYPE_NEW_PATIENT,
    STATUS_CONFIRMED,
    STATUS_IN_PROGRESS,
    STATUS_SCHEDULED,
)
from apps.appointments.models import Appointment
from apps.consultations.constants import CONS_STATUS_IN_PROGRESS
from apps.consultations.models import Consultation


class AppointmentFactory(DjangoModelFactory):
    class Meta:
        model = Appointment

    patient = factory.SubFactory("apps.people.tests.factories.PatientFactory")
    doctor = factory.SubFactory("apps.people.tests.factories.DoctorFactory")
    booked_by = factory.SubFactory("apps.people.tests.factories.UserFactory")
    appointment_datetime = factory.LazyFunction(
        lambda: timezone.now() + timedelta(hours=2)
    )
    appointment_type = APPT_TYPE_NEW_PATIENT
    token_number = factory.Sequence(lambda n: 101 + n)
    status = STATUS_SCHEDULED
    notes = ""


class ConfirmedAppointmentFactory(AppointmentFactory):
    status = STATUS_CONFIRMED


class InProgressAppointmentFactory(AppointmentFactory):
    status = STATUS_IN_PROGRESS


class ConsultationFactory(DjangoModelFactory):
    class Meta:
        model = Consultation

    appointment = factory.SubFactory(InProgressAppointmentFactory)
    patient = factory.LazyAttribute(lambda o: o.appointment.patient)
    doctor = factory.LazyAttribute(lambda o: o.appointment.doctor)
    start_time = factory.LazyFunction(timezone.now)
    status = CONS_STATUS_IN_PROGRESS
    clinical_notes = "Initial clinical notes."
    diagnosis = ""
