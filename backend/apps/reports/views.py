"""
MotherCare — Reports Module Views
Aggregated analytics endpoints for the reports dashboard.
"""
from datetime import date, timedelta
from django.db.models import Count, Sum, Q
from rest_framework.response import Response
from rest_framework.views import APIView
from core.permissions import IsAuthenticatedStaff


class ReportSummaryView(APIView):
    """
    GET /api/v1/reports/summary/
    Top-level KPI dashboard: patients, deliveries, beds, revenue.
    """
    permission_classes = [IsAuthenticatedStaff]

    def get(self, request):
        from apps.people.models import Patient
        from apps.admissions.models import Bed, Admission
        from apps.delivery.models import Delivery
        from apps.billing.models import Bill

        today = date.today()
        month_start = today.replace(day=1)

        # Patient stats
        total_patients = Patient.objects.count()
        new_this_month = Patient.objects.filter(created_at__date__gte=month_start).count()

        # Bed stats
        total_beds = Bed.objects.count()
        occupied_beds = Bed.objects.filter(status="occupied").count()
        available_beds = Bed.objects.filter(status="available").count()
        occupancy_pct = round((occupied_beds / total_beds * 100) if total_beds else 0, 1)

        # Delivery stats
        total_deliveries = Delivery.objects.count()
        deliveries_this_month = Delivery.objects.filter(
            delivery_datetime__date__gte=month_start
        ).count()
        c_sections = Delivery.objects.filter(delivery_mode="c_section").count()

        # Billing stats
        paid_revenue = Bill.objects.filter(payment_status="paid").aggregate(
            total=Sum("amount_paid")
        )["total"] or 0
        pending_amount = Bill.objects.filter(
            payment_status__in=["pending", "partial", "overdue"]
        ).aggregate(
            total=Sum("total_amount")
        )["total"] or 0
        revenue_this_month = Bill.objects.filter(
            generated_at__date__gte=month_start,
            payment_status="paid"
        ).aggregate(total=Sum("amount_paid"))["total"] or 0

        return Response({
            "patients": {
                "total": total_patients,
                "new_this_month": new_this_month,
            },
            "beds": {
                "total": total_beds,
                "occupied": occupied_beds,
                "available": available_beds,
                "occupancy_pct": occupancy_pct,
            },
            "deliveries": {
                "total": total_deliveries,
                "this_month": deliveries_this_month,
                "c_sections": c_sections,
                "c_section_pct": round((c_sections / total_deliveries * 100) if total_deliveries else 0, 1),
            },
            "revenue": {
                "total_paid": float(paid_revenue),
                "pending": float(pending_amount),
                "this_month": float(revenue_this_month),
            },
        })


class DeliveryStatsView(APIView):
    """
    GET /api/v1/reports/deliveries/
    Delivery breakdown by mode + recent trend.
    """
    permission_classes = [IsAuthenticatedStaff]

    def get(self, request):
        from apps.delivery.models import Delivery

        # By mode
        by_mode = list(
            Delivery.objects.values("delivery_mode")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        # Last 6 months monthly trend
        monthly = []
        today = date.today()
        for i in range(5, -1, -1):
            month_date = (today.replace(day=1) - timedelta(days=i * 28)).replace(day=1)
            next_month = (month_date.replace(day=28) + timedelta(days=4)).replace(day=1)
            count = Delivery.objects.filter(
                delivery_datetime__date__gte=month_date,
                delivery_datetime__date__lt=next_month,
            ).count()
            monthly.append({
                "month": month_date.strftime("%b %Y"),
                "count": count,
            })

        # Complications rate
        total = Delivery.objects.count()
        with_complications = Delivery.objects.exclude(complications="").count()
        complication_rate = round((with_complications / total * 100) if total else 0, 1)

        return Response({
            "by_mode": by_mode,
            "monthly_trend": monthly,
            "complication_rate": complication_rate,
            "total": total,
        })


class BedStatsView(APIView):
    """
    GET /api/v1/reports/beds/
    Bed occupancy breakdown by ward type.
    """
    permission_classes = [IsAuthenticatedStaff]

    def get(self, request):
        from apps.admissions.models import Bed

        by_ward = list(
            Bed.objects.values("ward_type")
            .annotate(
                total=Count("id"),
                occupied=Count("id", filter=Q(status="occupied")),
                available=Count("id", filter=Q(status="available")),
                cleaning=Count("id", filter=Q(status="cleaning")),
                reserved=Count("id", filter=Q(status="reserved")),
            )
            .order_by("ward_type")
        )

        total_beds = Bed.objects.count()
        occupied_beds = Bed.objects.filter(status="occupied").count()

        return Response({
            "by_ward": by_ward,
            "total": total_beds,
            "occupied": occupied_beds,
            "occupancy_pct": round((occupied_beds / total_beds * 100) if total_beds else 0, 1),
        })


class BillingStatsView(APIView):
    """
    GET /api/v1/reports/billing/
    Revenue breakdown by bill type + payment status distribution.
    """
    permission_classes = [IsAuthenticatedStaff]

    def get(self, request):
        from apps.billing.models import Bill

        by_type = list(
            Bill.objects.values("bill_type")
            .annotate(
                count=Count("id"),
                total_billed=Sum("total_amount"),
                total_paid=Sum("amount_paid"),
            )
            .order_by("bill_type")
        )
        # Make Decimal JSON-serializable
        for row in by_type:
            row["total_billed"] = float(row["total_billed"] or 0)
            row["total_paid"] = float(row["total_paid"] or 0)

        by_status = list(
            Bill.objects.values("payment_status")
            .annotate(count=Count("id"), amount=Sum("total_amount"))
            .order_by("payment_status")
        )
        for row in by_status:
            row["amount"] = float(row["amount"] or 0)

        # Last 6 months revenue
        today = date.today()
        monthly_revenue = []
        for i in range(5, -1, -1):
            month_date = (today.replace(day=1) - timedelta(days=i * 28)).replace(day=1)
            next_month = (month_date.replace(day=28) + timedelta(days=4)).replace(day=1)
            rev = Bill.objects.filter(
                generated_at__date__gte=month_date,
                generated_at__date__lt=next_month,
                payment_status="paid",
            ).aggregate(total=Sum("amount_paid"))["total"] or 0
            monthly_revenue.append({
                "month": month_date.strftime("%b %Y"),
                "revenue": float(rev),
            })

        return Response({
            "by_type": by_type,
            "by_status": by_status,
            "monthly_revenue": monthly_revenue,
        })
