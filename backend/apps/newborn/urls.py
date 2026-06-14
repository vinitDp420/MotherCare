"""
MotherCare — Newborn Module URL Routing
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from apps.newborn.views import NewbornViewSet

router = DefaultRouter()
router.register("", NewbornViewSet, basename="newborn")

urlpatterns = [
    path("", include(router.urls)),
]
