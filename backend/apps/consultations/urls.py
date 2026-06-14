"""
MotherCare — Consultations Module URL Configuration

Endpoints:
    /api/v1/consultations/                          — list, create
    /api/v1/consultations/{id}/                     — retrieve, partial_update
    /api/v1/consultations/{id}/complete/            — POST
    /api/v1/consultations/{id}/cancel/              — POST
    /api/v1/consultations/{id}/follow-up/           — POST
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.consultations.views import ConsultationViewSet

router = DefaultRouter()
router.register(r"consultations", ConsultationViewSet, basename="consultation")

urlpatterns = [
    path("", include(router.urls)),
]
