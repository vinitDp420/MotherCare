from django.db import transaction
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from apps.referrals.models import StitchFile
from apps.referrals.serializers import StitchFileSerializer
from core.permissions import IsAuthenticatedStaff


class StitchFileViewSet(viewsets.ModelViewSet):
    """
    ViewSet to manage Patient Referral/Stitch Files.
    """
    queryset = StitchFile.objects.all()
    serializer_class = StitchFileSerializer
    permission_classes = [IsAuthenticatedStaff]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["patient", "urgency"]
    search_fields = ["specialist_type", "reason", "referral_note"]
    ordering_fields = ["created_at", "urgency"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return (
            StitchFile.objects.select_related("patient", "created_by")
            .prefetch_related("attached_reports", "attached_prescriptions")
            .all()
        )

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["get"], url_path="export")
    def export_pdf(self, request: Request, pk: str | None = None) -> HttpResponse:
        """
        GET /api/v1/referrals/{id}/export/
        Generates and downloads a clean A4 PDF referral document.
        """
        stitch_file = self.get_object()

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="referral_{stitch_file.patient.mrn}_{stitch_file.id}.pdf"'

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
            textColor=colors.HexColor("#7C3AED"),  # Indigo/Purple brand accent
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
        meta_label_style = ParagraphStyle(
            name="MetaLabel",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#6B7280")
        )

        # Hospital Branding Header
        story.append(Paragraph("MOTHERCARE MATERNITY HOSPITAL", ParagraphStyle(
            name="Hosp",
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=12,
            textColor=colors.HexColor("#9CA3AF")
        )))
        story.append(Paragraph("Clinical Referral & Stitch File", title_style))
        story.append(Spacer(1, 10))

        # Metadata Layout Table
        patient = stitch_file.patient
        doctor_name = "System"
        if stitch_file.created_by:
            doctor_name = stitch_file.created_by.username
            if hasattr(stitch_file.created_by, "staff_profile"):
                doctor_name = stitch_file.created_by.staff_profile.full_name

        meta_data = [
            [
                Paragraph("Patient Name:", meta_label_style), Paragraph(patient.full_name, body_style),
                Paragraph("MRN:", meta_label_style), Paragraph(patient.mrn, body_style)
            ],
            [
                Paragraph("Specialist:", meta_label_style), Paragraph(stitch_file.specialist_type, body_style),
                Paragraph("Urgency:", meta_label_style), Paragraph(stitch_file.get_urgency_display(), body_style)
            ],
            [
                Paragraph("Referred By:", meta_label_style), Paragraph(f"Dr. {doctor_name}", body_style),
                Paragraph("Date:", meta_label_style), Paragraph(stitch_file.created_at.strftime("%Y-%m-%d %H:%M"), body_style)
            ]
        ]

        t = Table(meta_data, colWidths=[90, 160, 80, 174])
        t.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ]))
        story.append(t)
        story.append(Spacer(1, 15))

        # Clinical Reason
        story.append(Paragraph("Reason for Referral", section_style))
        story.append(Paragraph(stitch_file.reason, body_style))
        story.append(Spacer(1, 10))

        # Referral Notes
        if stitch_file.referral_note:
            story.append(Paragraph("Clinical Notes & Specialist Instructions", section_style))
            story.append(Paragraph(stitch_file.referral_note, body_style))
            story.append(Spacer(1, 10))

        # Attached Lab Reports Listing
        reports = stitch_file.attached_reports.all()
        if reports.exists():
            story.append(Paragraph("Attached Lab Reports Summary", section_style))
            rep_data = [[
                Paragraph("Report ID", meta_label_style),
                Paragraph("Lab Order & Test Summary", meta_label_style),
                Paragraph("Uploaded At", meta_label_style)
            ]]
            for rep in reports:
                rep_data.append([
                    Paragraph(str(rep.id)[:8], body_style),
                    Paragraph(f"Order #{str(rep.lab_order_id)[:8]} - Comment: {rep.doctor_comment or 'No comments'}", body_style),
                    Paragraph(rep.uploaded_at.strftime("%Y-%m-%d"), body_style)
                ])
            t_rep = Table(rep_data, colWidths=[80, 300, 124])
            t_rep.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ]))
            story.append(t_rep)
            story.append(Spacer(1, 10))

        # Attached Prescriptions Listing
        prescriptions = stitch_file.attached_prescriptions.all()
        if prescriptions.exists():
            story.append(Paragraph("Attached Clinical Prescriptions", section_style))
            presc_data = [[
                Paragraph("Prescription ID", meta_label_style),
                Paragraph("Clinical Notes / Instructions", meta_label_style),
                Paragraph("Issued At", meta_label_style)
            ]]
            for presc in prescriptions:
                presc_data.append([
                    Paragraph(str(presc.id)[:8], body_style),
                    Paragraph(presc.notes or "No notes", body_style),
                    Paragraph(presc.created_at.strftime("%Y-%m-%d"), body_style)
                ])
            t_presc = Table(presc_data, colWidths=[90, 290, 124])
            t_presc.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ]))
            story.append(t_presc)

        doc.build(story)
        return response
