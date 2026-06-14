"""
MotherCare — Prescriptions URL Configuration

Endpoints:
    /api/v1/prescriptions/                  — list, create
    /api/v1/prescriptions/{id}/             — retrieve (no update/delete)
    /api/v1/prescriptions/{id}/items/       — GET items
    /api/v1/prescriptions/history/          — GET ?patient=<uuid>
    /api/v1/prescriptions/{id}/duplicate/   — POST
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.prescriptions.views import PrescriptionViewSet

router = DefaultRouter()
router.register(r"", PrescriptionViewSet, basename="prescription")

urlpatterns = [
    path("", include(router.urls)),
]
