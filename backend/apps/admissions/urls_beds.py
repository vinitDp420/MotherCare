# apps/admissions/urls_beds.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from apps.admissions.views import BedViewSet

router = DefaultRouter()
router.register("", BedViewSet, basename="bed")

urlpatterns = [
    path("", include(router.urls)),
]
