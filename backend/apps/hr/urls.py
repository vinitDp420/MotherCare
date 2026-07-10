"""
MotherCare — HR Module URL Routing
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from apps.hr.views import LeaveRequestViewSet, ShiftAssignmentViewSet, StaffSummaryView

router = DefaultRouter()
router.register("leave-requests", LeaveRequestViewSet, basename="leave-request")
router.register("shifts", ShiftAssignmentViewSet, basename="shift")

urlpatterns = [
    path("summary/", StaffSummaryView.as_view(), name="hr-summary"),
    path("", include(router.urls)),
]
