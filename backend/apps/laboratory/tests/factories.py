"""
MotherCare — Laboratory Test Factories
"""
from __future__ import annotations

import factory
from django.utils import timezone
from factory.django import DjangoModelFactory

from apps.laboratory.constants import (
    FILE_TYPE_PDF,
    STATUS_PENDING,
    URGENCY_ROUTINE,
    URGENCY_STAT,
    URGENCY_URGENT,
)
from apps.laboratory.models import LabReportFile, LabTest


class LabTestFactory(DjangoModelFactory):
    class Meta:
        model = LabTest

    patient = factory.SubFactory("apps.people.tests.factories.PatientFactory")
    ordered_by = factory.SubFactory("apps.people.tests.factories.DoctorFactory")
    consultation = None
    test_type = "cbc"
    urgency = URGENCY_ROUTINE
    status = STATUS_PENDING
    flagged = False
    requested_at = factory.LazyFunction(timezone.now)


class StatLabTestFactory(LabTestFactory):
    urgency = URGENCY_STAT


class UrgentLabTestFactory(LabTestFactory):
    urgency = URGENCY_URGENT


class LabReportFileFactory(DjangoModelFactory):
    class Meta:
        model = LabReportFile

    lab_test = factory.SubFactory(LabTestFactory)
    uploaded_by = factory.SubFactory("apps.people.tests.factories.UserFactory")
    file_url = "https://media.mothercare.local/reports/sample.pdf"
    file_type = FILE_TYPE_PDF
    uploaded_at = factory.LazyFunction(timezone.now)
    notes = ""
