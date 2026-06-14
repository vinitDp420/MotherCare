"""
MotherCare — Billing Module URL Routing
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from apps.billing.views import BillViewSet, BillPaymentViewSet

router = DefaultRouter()
router.register("bills", BillViewSet, basename="bill")
router.register("payments", BillPaymentViewSet, basename="billpayment")

urlpatterns = [
    path("", include(router.urls)),
]
