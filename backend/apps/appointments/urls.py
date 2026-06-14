"""
MotherCare — Appointments Module URL Configuration

Endpoints:
    /api/v1/appointments/                           — list, create
    /api/v1/appointments/{id}/                      — retrieve, partial_update
    /api/v1/appointments/{id}/confirm/              — POST
    /api/v1/appointments/{id}/cancel/               — POST
    /api/v1/appointments/{id}/start/                — POST
    /api/v1/appointments/{id}/complete/             — POST
    /api/v1/appointments/{id}/no-show/              — POST
    /api/v1/appointments/next-slot/                 — GET
    /api/v1/appointments/today/                     — GET
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.appointments.views import AppointmentViewSet

router = DefaultRouter()
router.register(r"appointments", AppointmentViewSet, basename="appointment")

urlpatterns = [
    path("", include(router.urls)),
]
