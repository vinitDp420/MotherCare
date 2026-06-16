"""
MotherCare — Prescriptions Module Views
Architecture: CLAUDE.md — "Views: orchestration only"

ViewSet:
    PrescriptionViewSet  — /api/v1/prescriptions/

Immutability: No PUT, PATCH, or DELETE.
Only GET and POST are allowed (BR-RX-01).
"""
from __future__ import annotations

import logging
from typing import Any

from django.http import HttpResponse
from django.db.models import QuerySet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, serializers, status, viewsets
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.prescriptions import services
from apps.prescriptions.models import Prescription
from apps.prescriptions.serializers import (
    PrescriptionDetailSerializer,
    PrescriptionItemSerializer,
    PrescriptionListSerializer,
    PrescriptionWriteSerializer,
)
from core.pagination import StandardResultsPagination
from core.permissions import IsAuthenticatedStaff

logger = logging.getLogger("mothercare")


class PrescriptionViewSet(viewsets.ModelViewSet):
    """
    Prescription CRUD — create and read only (BR-RX-01: immutable).

    list:     GET  /api/v1/prescriptions/
    retrieve: GET  /api/v1/prescriptions/{id}/
    create:   POST /api/v1/prescriptions/

    Actions:
        items       GET  /api/v1/prescriptions/{id}/items/
        history     GET  /api/v1/prescriptions/history/?patient=<uuid>
        duplicate   POST /api/v1/prescriptions/{id}/duplicate/
    """

    permission_classes = [IsAuthenticatedStaff]
    pagination_class = StandardResultsPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ["patient", "consultation"]
    search_fields = ["patient__full_name", "patient__mrn"]
    ordering_fields = ["issued_at", "created_at"]
    ordering = ["-issued_at"]

    # BR-RX-01: Prescriptions are immutable — no PUT, PATCH, or DELETE
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self) -> QuerySet:
        return (
            Prescription.objects.select_related("consultation", "patient")
            .prefetch_related("items", "items__medicine")
            .all()
        )

    def get_serializer_class(self) -> type[serializers.Serializer]:
        if self.action == "list":
            return PrescriptionListSerializer
        if self.action == "create":
            return PrescriptionWriteSerializer
        return PrescriptionDetailSerializer

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """POST /api/v1/prescriptions/ — Create prescription with items atomically."""
        serializer = PrescriptionWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        # Extract nested items before passing to service
        items_data = serializer.validated_data.pop("items", [])

        try:
            prescription = services.create_full_prescription(
                consultation=serializer.validated_data["consultation"],
                patient=serializer.validated_data["patient"],
                doctor=serializer.validated_data.get("doctor"),
                status=serializer.validated_data.get("status", "saved"),
                notes=serializer.validated_data.get("notes", ""),
                items_data=[
                    {
                        "medicine": item["medicine"],
                        "dosage": item["dosage"],
                        "frequency": item["frequency"],
                        "duration": item["duration"],
                        "duration_days": item.get("duration_days"),
                        "route": item.get("route", ""),
                        "quantity_to_dispense": item.get("quantity_to_dispense", 1),
                        "instructions": item.get("instructions", ""),
                        "sort_order": item.get("sort_order", 0),
                    }
                    for item in items_data
                ],
                created_by=request.user,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        out = PrescriptionDetailSerializer(prescription, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """DELETE is forbidden on prescriptions (BR-RX-01)."""
        return Response(
            {"detail": "Prescriptions are immutable and cannot be deleted. [BR-RX-01]"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    # ── Sub-resource actions ──────────────────────────────────────────────────

    @action(detail=True, methods=["get"], url_path="items")
    def items_list(self, request: Request, pk: str | None = None) -> Response:
        """GET /api/v1/prescriptions/{id}/items/ — List all items in a prescription."""
        prescription = self.get_object()
        items = prescription.items.select_related("medicine").order_by("sort_order")
        page = self.paginate_queryset(items)
        if page is not None:
            return self.get_paginated_response(PrescriptionItemSerializer(page, many=True).data)
        return Response(PrescriptionItemSerializer(items, many=True).data)

    @action(detail=False, methods=["get"], url_path="history")
    def patient_history(self, request: Request) -> Response:
        """
        GET /api/v1/prescriptions/history/?patient=<uuid>
        Returns prescription history for a patient (for re-prescribe workflow).
        """
        from apps.people.models import Patient

        patient_id = request.query_params.get("patient")
        if not patient_id:
            return Response(
                {"detail": "'patient' query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response({"detail": "Patient not found."}, status=status.HTTP_404_NOT_FOUND)

        limit = int(request.query_params.get("limit", 10))
        prescriptions = services.get_patient_prescription_history(patient, limit=limit)
        return Response(PrescriptionDetailSerializer(prescriptions, many=True).data)

    @action(detail=True, methods=["post"], url_path="duplicate")
    def duplicate(self, request: Request, pk: str | None = None) -> Response:
        """
        POST /api/v1/prescriptions/{id}/duplicate/
        Body: { "consultation": "<uuid>", "patient": "<uuid>" }
        Creates a new prescription copying all items from the source.
        """
        from apps.consultations.models import Consultation
        from apps.people.models import Patient

        source_prescription = self.get_object()

        consultation_id = request.data.get("consultation")
        patient_id = request.data.get("patient")

        if not consultation_id or not patient_id:
            return Response(
                {"detail": "Both 'consultation' and 'patient' are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            consultation = Consultation.objects.get(id=consultation_id)
            patient = Patient.objects.get(id=patient_id)
        except (Consultation.DoesNotExist, Patient.DoesNotExist) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)

        try:
            new_prescription = services.duplicate_previous_prescription(
                source_prescription=source_prescription,
                consultation=consultation,
                patient=patient,
                created_by=request.user,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        out = PrescriptionDetailSerializer(new_prescription, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="export")
    def export_pdf(self, request: Request, pk: str | None = None) -> HttpResponse:
        """
        GET /api/v1/prescriptions/{id}/export/
        Generates and downloads a clean A4 PDF prescription document.
        """
        prescription = self.get_object()

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="prescription_{prescription.patient.mrn}_{prescription.id}.pdf"'

        doc = SimpleDocTemplate(
            response,
            pagesize=letter,
            rightMargin=54,
            leftMargin=54,
            topMargin=54,
            bottomMargin=54
        )
        story = []
        styles = getSampleStyleSheet()

        # Custom typography styling for modern aesthetics
        title_style = ParagraphStyle(
            name="TitleStyle",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#0D9488"),  # Teal accent matching modern UI
            spaceAfter=15
        )
        section_style = ParagraphStyle(
            name="SectionStyle",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#1F2937"),
            spaceBefore=14,
            spaceAfter=8
        )
        body_style = ParagraphStyle(
            name="BodyStyle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#374151")
        )
        italic_body_style = ParagraphStyle(
            name="ItalicBodyStyle",
            parent=styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#0D9488")
        )
        meta_label_style = ParagraphStyle(
            name="MetaLabel",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#6B7280")
        )

        # Hospital Branding Header
        story.append(Paragraph("MOTHERCARE HOSPITALS", ParagraphStyle(
            name="Hosp",
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=12,
            textColor=colors.HexColor("#9CA3AF")
        )))
        story.append(Paragraph("Clinical Prescription Document", title_style))
        story.append(Spacer(1, 10))

        # Metadata Layout Table
        patient = prescription.patient
        doctor_name = "Medical Officer"
        doctor_reg = "MC-8742-W"
        if prescription.doctor:
            doctor_name = prescription.doctor.staff.full_name
            doctor_reg = prescription.doctor.registration_no

        # Calculate patient age
        from datetime import date
        patient_age_str = ""
        if patient.dob:
            today = date.today()
            age = today.year - patient.dob.year - ((today.month, today.day) < (patient.dob.month, patient.dob.day))
            patient_age_str = f"{age} Yrs"

        meta_data = [
            [
                Paragraph("Patient Name:", meta_label_style), Paragraph(patient.full_name, body_style),
                Paragraph("MRN:", meta_label_style), Paragraph(patient.mrn, body_style)
            ],
            [
                Paragraph("Patient Details:", meta_label_style), Paragraph(f"{patient_age_str} / {patient.blood_group or '—'}", body_style),
                Paragraph("Prescribed By:", meta_label_style), Paragraph(f"Dr. {doctor_name}", body_style)
            ],
            [
                Paragraph("Doctor Reg No:", meta_label_style), Paragraph(doctor_reg, body_style),
                Paragraph("Date:", meta_label_style), Paragraph(prescription.created_at.strftime("%Y-%m-%d"), body_style)
            ]
        ]

        t = Table(meta_data, colWidths=[90, 160, 100, 154])
        t.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ]))
        story.append(t)
        story.append(Spacer(1, 15))

        # Rx Symbol
        story.append(Paragraph("<b>Rx</b>", ParagraphStyle(
            name="RxSym",
            fontName="Times-Bold",
            fontSize=24,
            leading=28,
            textColor=colors.HexColor("#111827")
        )))
        story.append(Spacer(1, 10))

        # Medicines Table Listing
        items = prescription.items.all().select_related("medicine").order_by("sort_order")
        if items.exists():
            med_data = [[
                Paragraph("#", meta_label_style),
                Paragraph("Medication Name (Brand/Generic)", meta_label_style),
                Paragraph("Route", meta_label_style),
                Paragraph("Dosage", meta_label_style),
                Paragraph("Frequency", meta_label_style),
                Paragraph("Duration", meta_label_style),
                Paragraph("Qty", meta_label_style)
            ]]
            for idx, item in enumerate(items):
                brand_generic = f"<b>{item.medicine.name}</b>"
                if item.medicine.generic_name:
                    brand_generic += f"<br/>Generic: {item.medicine.generic_name}"
                if item.instructions:
                    brand_generic += f"<br/><i>Instructions: {item.instructions}</i>"

                med_data.append([
                    Paragraph(str(idx + 1), body_style),
                    Paragraph(brand_generic, body_style),
                    Paragraph(item.route or "Oral", body_style),
                    Paragraph(item.dosage, body_style),
                    Paragraph(item.frequency, body_style),
                    Paragraph(f"{item.duration_days} Days" if item.duration_days else item.duration, body_style),
                    Paragraph(str(item.quantity_to_dispense or 1), body_style)
                ])

            t_med = Table(med_data, colWidths=[20, 210, 50, 60, 60, 64, 40])
            t_med.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ]))
            story.append(t_med)
            story.append(Spacer(1, 15))
        else:
            story.append(Paragraph("No medications prescribed.", italic_body_style))
            story.append(Spacer(1, 10))

        # Notes
        if prescription.notes:
            story.append(Paragraph("Prescriber Instructions / Notes", section_style))
            story.append(Paragraph(prescription.notes, body_style))
            story.append(Spacer(1, 25))

        # Signature Block
        sig_data = [
            [
                Paragraph("<font color='#9CA3AF'>• Valid for dispensing at MotherCare Pharmacy.</font><br/><font color='#9CA3AF'>• Do not self-medicate.</font>", ParagraphStyle(name="Rules", fontName="Helvetica", fontSize=8, leading=11)),
                Paragraph(f"<b>Dr. {doctor_name}</b><br/>Authorized Clinician Signature", ParagraphStyle(name="Sig", fontName="Helvetica", fontSize=9, leading=12, alignment=1))
            ]
        ]
        t_sig = Table(sig_data, colWidths=[280, 224])
        t_sig.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
            ('LINEABOVE', (1, 0), (1, 0), 0.5, colors.HexColor("#9CA3AF")),
            ('TOPPADDING', (1, 0), (1, 0), 6),
        ]))
        story.append(t_sig)

        doc.build(story)
        return response
