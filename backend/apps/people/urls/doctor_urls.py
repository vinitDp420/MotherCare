"""
MotherCare — Doctor URLs
/api/v1/doctors/
/api/v1/doctors/{id}/
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.people.views import DoctorViewSet

router = DefaultRouter()
router.register(r"", DoctorViewSet, basename="doctors")

urlpatterns = [
    path("", include(router.urls)),
]
