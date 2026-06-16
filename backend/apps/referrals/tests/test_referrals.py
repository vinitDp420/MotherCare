import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.people.tests.factories import PatientFactory, UserFactory
from apps.referrals.models import StitchFile


@pytest.mark.django_db
class TestReferralsAPI:
    def setup_method(self) -> None:
        self.client = APIClient()
        self.user = UserFactory()
        self.patient = PatientFactory()
        self.client.force_authenticate(user=self.user)

    def test_create_stitch_file(self) -> None:
        url = reverse("stitch-file-list")
        data = {
            "patient": str(self.patient.id),
            "specialist_type": "Cardiologist",
            "urgency": "urgent",
            "reason": "Suspected gestational hypertension or cardiac anomaly.",
            "referral_note": "Please evaluate for pre-eclampsia complications.",
        }
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert StitchFile.objects.filter(patient=self.patient).count() == 1

        stitch = StitchFile.objects.first()
        assert stitch.specialist_type == "Cardiologist"
        assert stitch.created_by == self.user

    def test_list_stitch_files(self) -> None:
        StitchFile.objects.create(
            patient=self.patient,
            specialist_type="Endocrinologist",
            urgency="routine",
            reason="Gestational diabetes management.",
            created_by=self.user
        )

        url = reverse("stitch-file-list")
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert len(results) >= 1
        assert results[0]["specialist_type"] == "Endocrinologist"

    def test_export_pdf_endpoint(self) -> None:
        stitch = StitchFile.objects.create(
            patient=self.patient,
            specialist_type="Cardiologist",
            urgency="urgent",
            reason="Hypertension audit.",
            created_by=self.user
        )
        url = reverse("stitch-file-export-pdf", args=[stitch.id])
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "application/pdf"
        assert len(response.content) > 0
