"""
MotherCare — Patient URLs
/api/v1/patients/
/api/v1/patients/{id}/
/api/v1/patients/{id}/allergies/
/api/v1/patients/{id}/emergency-contacts/
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.people.views import PatientViewSet

router = DefaultRouter()
router.register(r"", PatientViewSet, basename="patients")

urlpatterns = [
    path("", include(router.urls)),
]
