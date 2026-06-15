from django.urls import include, path
from rest_framework.routers import DefaultRouter
from apps.hospital_config.views import DepartmentViewSet

router = DefaultRouter()
router.register("departments", DepartmentViewSet, basename="department")

urlpatterns = [
    path("", include(router.urls)),
]
