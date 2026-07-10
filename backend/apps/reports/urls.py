"""
MotherCare — Reports Module URL Routing
"""
from django.urls import path
from apps.reports.views import (
    ReportSummaryView,
    DeliveryStatsView,
    BedStatsView,
    BillingStatsView,
)

urlpatterns = [
    path("summary/", ReportSummaryView.as_view(), name="report-summary"),
    path("deliveries/", DeliveryStatsView.as_view(), name="report-deliveries"),
    path("beds/", BedStatsView.as_view(), name="report-beds"),
    path("billing/", BillingStatsView.as_view(), name="report-billing"),
]
