from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.laboratory.views import TestMasterViewSet, LabOrderViewSet

router = DefaultRouter()
router.register(r"tests", TestMasterViewSet, basename="lab-test-master")
router.register(r"orders", LabOrderViewSet, basename="lab-order")

urlpatterns = [
    path("", include(router.urls)),
]
