"""
MotherCare — Pregnancy Module Test Factories
Uses factory_boy for generating test data.
"""
from __future__ import annotations

from datetime import date, timedelta

import factory
from factory.django import DjangoModelFactory

from apps.pregnancy.constants import (
    EVENT_RISK_LOW,
    RISK_STATUS_NORMAL,
    VACC_STATUS_DUE,
    VISIT_TYPE_ROUTINE,
)
from apps.pregnancy.models import (
    AncVisit,
    Pregnancy,
    PregnancyRiskEvent,
    Vaccination,
    WellnessPlan,
)


class PregnancyFactory(DjangoModelFactory):
    class Meta:
        model = Pregnancy

    patient = factory.SubFactory("apps.people.tests.factories.PatientFactory")
    assigned_doctor = factory.SubFactory("apps.people.tests.factories.DoctorFactory")
    lmp = factory.LazyFunction(lambda: date.today() - timedelta(weeks=16))
    edd = factory.LazyAttribute(lambda o: o.lmp + timedelta(days=280))
    current_week = 16
    trimester = 2
    risk_status = RISK_STATUS_NORMAL
    gravida = 1
    para = 0
    chronic_conditions = ""
    is_active = True


class AncVisitFactory(DjangoModelFactory):
    class Meta:
        model = AncVisit

    pregnancy = factory.SubFactory(PregnancyFactory)
    doctor = factory.SubFactory("apps.people.tests.factories.DoctorFactory")
    visit_date = factory.LazyFunction(lambda: date.today() - timedelta(days=7))
    week_at_visit = 16
    visit_type = VISIT_TYPE_ROUTINE
    bp_systolic = 120
    bp_diastolic = 80
    weight_kg = 65
    fhr_bpm = 140
    glucose_mgdl = None
    notes = "Routine visit — all normal."


class PregnancyRiskEventFactory(DjangoModelFactory):
    class Meta:
        model = PregnancyRiskEvent

    pregnancy = factory.SubFactory(PregnancyFactory)
    event_date = factory.LazyFunction(lambda: date.today() - timedelta(days=3))
    week_number = 16
    risk_level = EVENT_RISK_LOW
    event_description = "Mild oedema noted in ankles."


class VaccinationFactory(DjangoModelFactory):
    class Meta:
        model = Vaccination

    pregnancy = factory.SubFactory(PregnancyFactory)
    vaccine_name = "TT (Tetanus Toxoid) Dose 1"
    status = VACC_STATUS_DUE
    due_week_start = 16
    due_week_end = 20
    administered_date = None
    notes = ""


class WellnessPlanFactory(DjangoModelFactory):
    class Meta:
        model = WellnessPlan

    pregnancy = factory.SubFactory(PregnancyFactory)
    dietary_protocol = "Balanced diet with high iron and folic acid."
    dietary_items = ["Iron-rich foods", "Leafy greens", "Dairy", "Folate sources"]
    daily_precautions = ["Avoid heavy lifting", "Rest 8 hours per night", "Avoid alcohol"]
