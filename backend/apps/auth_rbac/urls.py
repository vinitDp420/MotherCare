"""
MotherCare — Auth RBAC URLs (Domain 1)
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.auth_rbac.views import LoginView, LogoutView, MeView, UserSessionViewSet

router = DefaultRouter()
router.register("sessions", UserSessionViewSet, basename="session")

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]
