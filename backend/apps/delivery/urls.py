"""
MotherCare — Delivery Module URL Routing
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from apps.delivery.views import DeliveryViewSet

router = DefaultRouter()
router.register("", DeliveryViewSet, basename="delivery")

urlpatterns = [
    path("", include(router.urls)),
]
