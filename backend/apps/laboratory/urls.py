"""
MotherCare — Laboratory URL Configuration

Endpoints:
    /api/v1/laboratory/lab-tests/                           — list, create
    /api/v1/laboratory/lab-tests/{id}/                      — retrieve, partial_update
    /api/v1/laboratory/lab-tests/{id}/upload-report/        — POST
    /api/v1/laboratory/lab-tests/{id}/flag/                 — POST
    /api/v1/laboratory/lab-tests/queue/                     — GET
    /api/v1/laboratory/lab-tests/flagged/                   — GET
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.laboratory.views import LabTestViewSet

router = DefaultRouter()
router.register(r"lab-tests", LabTestViewSet, basename="lab-test")

urlpatterns = [
    path("", include(router.urls)),
]
