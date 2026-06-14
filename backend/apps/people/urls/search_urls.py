"""
MotherCare — Global Patient Search URL
/api/v1/search/patients/?q=<query>

Supports:
    MRN exact     — q=PT-8472-A
    Phone exact   — q=9876543210
    Name fuzzy    — q=Priya Sharma
"""
from django.urls import path

from apps.people.views import PatientViewSet

# Standalone search view using the PatientViewSet list action
patient_search = PatientViewSet.as_view({"get": "list"})

urlpatterns = [
    path("patients/", patient_search, name="patient-search"),
]
