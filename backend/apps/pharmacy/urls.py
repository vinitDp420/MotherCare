"""
MotherCare — Pharmacy Module URL Routing
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from apps.pharmacy.views import MedicineViewSet, MedicineBatchViewSet, PharmacySaleViewSet

router = DefaultRouter()
router.register("medicines", MedicineViewSet, basename="medicine")
router.register("batches", MedicineBatchViewSet, basename="medicinebatch")
router.register("sales", PharmacySaleViewSet, basename="pharmacysale")

urlpatterns = [
    path("", include(router.urls)),
]
