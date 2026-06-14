# apps/admissions/urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from apps.admissions.views import AdmissionViewSet, WardTransferViewSet

router = DefaultRouter()
router.register("transfers", WardTransferViewSet, basename="transfer")
router.register("", AdmissionViewSet, basename="admission")

urlpatterns = [
    path("", include(router.urls)),
]
