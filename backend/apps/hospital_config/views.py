from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.hospital_config.models import Department
from apps.hospital_config.serializers import DepartmentSerializer

class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Department.objects.filter(is_active=True)
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # No pagination to allow easy fetching for dropdown listings
