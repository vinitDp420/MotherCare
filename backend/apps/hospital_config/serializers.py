from rest_framework import serializers
from apps.hospital_config.models import Department

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name", "department_type", "is_active"]
        read_only_fields = ["id"]
