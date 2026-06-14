"""
MotherCare — Staff URLs
/api/v1/staff/
/api/v1/staff/{id}/
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.people.views import StaffViewSet

router = DefaultRouter()
router.register(r"", StaffViewSet, basename="staff")

urlpatterns = [
    path("", include(router.urls)),
]
