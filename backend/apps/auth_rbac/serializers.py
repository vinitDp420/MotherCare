"""
MotherCare — Auth RBAC Serializers (Domain 1)
"""
from django.contrib.auth import authenticate
from rest_framework import serializers

from apps.auth_rbac.models import User, UserSession


class AuthUserSerializer(serializers.ModelSerializer):
    """Serializer for serialized User with roles and module:action permissions."""
    roles = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    patient_profile_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "is_active",
            "roles",
            "permissions",
            "patient_profile_id",
            "last_login",
        ]

    def get_roles(self, obj: User) -> list[str]:
        # Fetch the list of role names associated with the user
        return list(obj.user_roles.values_list("role__name", flat=True).distinct())

    def get_patient_profile_id(self, obj: User) -> str | None:
        if hasattr(obj, "patient_profile") and obj.patient_profile:
            return str(obj.patient_profile.id)
        return None

    def get_permissions(self, obj: User) -> list[str]:
        # Fetch permission module + action combinations for the user
        perms = (
            obj.user_roles.values_list(
                "role__role_permissions__permission__module",
                "role__role_permissions__permission__action",
            )
            .distinct()
        )
        return [
            f"{module}:{action}"
            for module, action in perms
            if module and action
        ]


class LoginRequestSerializer(serializers.Serializer):
    """Validates login credentials."""
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    remember_me = serializers.BooleanField(default=False, required=False)

    def validate(self, attrs: dict) -> dict:
        username = attrs.get("username")
        password = attrs.get("password")

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError("Invalid username or password.")
            if not user.is_active:
                raise serializers.ValidationError("User account is disabled.")
        else:
            raise serializers.ValidationError("Both username and password are required.")

        attrs["user"] = user
        return attrs


class LoginResponseSerializer(serializers.Serializer):
    """Structure of successful login response."""
    token = serializers.CharField()
    user = AuthUserSerializer()
    expires_at = serializers.DateTimeField()


class UserSessionSerializer(serializers.ModelSerializer):
    """Serializer for active or historic UserSession records."""
    class Meta:
        model = UserSession
        fields = [
            "id",
            "ip_address",
            "user_agent",
            "issued_at",
            "expires_at",
            "revoked_at",
        ]
