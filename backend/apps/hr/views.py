"""
MotherCare — HR Module Views
"""
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAuthenticatedStaff
from core.pagination import StandardResultsPagination
from apps.hr.models import LeaveRequest, ShiftAssignment
from apps.hr.serializers import (
    LeaveRequestSerializer,
    LeaveRequestWriteSerializer,
    LeaveReviewSerializer,
    ShiftAssignmentSerializer,
)
from apps.people.models import Staff


class LeaveRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedStaff]
    pagination_class = StandardResultsPagination
    queryset = LeaveRequest.objects.select_related(
        "staff", "staff__department", "reviewed_by"
    ).all()
    filterset_fields = ["staff", "status", "leave_type"]
    search_fields = ["staff__full_name", "staff__designation"]
    ordering_fields = ["created_at", "start_date"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return LeaveRequestWriteSerializer
        return LeaveRequestSerializer

    @action(detail=True, methods=["post"], url_path="review")
    def review(self, request, pk=None):
        leave = self.get_object()
        if leave.status != "pending":
            return Response(
                {"detail": "Only pending leave requests can be reviewed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = LeaveReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        leave.status = serializer.validated_data["status"]
        leave.review_notes = serializer.validated_data.get("review_notes", "")
        leave.reviewed_by = request.user
        leave.reviewed_at = timezone.now()
        leave.save()

        return Response(LeaveRequestSerializer(leave).data, status=status.HTTP_200_OK)


class ShiftAssignmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedStaff]
    pagination_class = StandardResultsPagination
    queryset = ShiftAssignment.objects.select_related("staff", "staff__department").all()
    serializer_class = ShiftAssignmentSerializer
    filterset_fields = ["staff", "shift", "shift_date"]
    ordering_fields = ["shift_date"]
    ordering = ["-shift_date"]


class StaffSummaryView(APIView):
    """
    Aggregated HR stats: total staff, present today, on leave, payroll.
    """
    permission_classes = [IsAuthenticatedStaff]

    def get(self, request):
        from django.db.models import Count, Q
        from datetime import date

        today = date.today()

        total_staff = Staff.objects.filter(is_active=True).count()
        on_leave_today = LeaveRequest.objects.filter(
            status="approved",
            start_date__lte=today,
            end_date__gte=today,
        ).values("staff").distinct().count()

        present_today = max(0, total_staff - on_leave_today)
        pending_leaves = LeaveRequest.objects.filter(status="pending").count()

        # Shift breakdown for today
        shifts = ShiftAssignment.objects.filter(shift_date=today).values("shift").annotate(count=Count("id"))
        shift_map = {s["shift"]: s["count"] for s in shifts}

        return Response({
            "total_staff": total_staff,
            "present_today": present_today,
            "on_leave_today": on_leave_today,
            "pending_leave_requests": pending_leaves,
            "shifts_today": {
                "morning": shift_map.get("morning", 0),
                "afternoon": shift_map.get("afternoon", 0),
                "night": shift_map.get("night", 0),
            }
        })
