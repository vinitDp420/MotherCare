from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.referrals.views import StitchFileViewSet

router = DefaultRouter()
router.register(r"stitch", StitchFileViewSet, basename="stitch-file")

urlpatterns = [
    path("", include(router.urls)),
]
