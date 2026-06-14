"""
MotherCare — Pregnancy Module URL Configuration
Architecture: REST resource design

Endpoints:
    /api/v1/pregnancies/                                    — list, create
    /api/v1/pregnancies/{id}/                               — retrieve, update, delete (soft)
    /api/v1/pregnancies/{id}/anc-visits/                    — list, create
    /api/v1/pregnancies/{id}/anc-visits/{visit_id}/         — update, delete
    /api/v1/pregnancies/{id}/risk-events/                   — list, create
    /api/v1/pregnancies/{id}/vaccinations/                  — list, create
    /api/v1/pregnancies/{id}/vaccinations/{vacc_id}/        — update
    /api/v1/pregnancies/{id}/wellness-plan/                 — get, put, patch
    /api/v1/pregnancies/{id}/sync-week/                     — post (refresh gestational week)
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.pregnancy.views import PregnancyViewSet

router = DefaultRouter()
router.register(r"pregnancies", PregnancyViewSet, basename="pregnancy")

urlpatterns = [
    path("", include(router.urls)),
]
