"""
MotherCare — Auth RBAC Views (Domain 1)
"""
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.auth_rbac.models import UserSession
from apps.auth_rbac.serializers import (
    AuthUserSerializer,
    LoginRequestSerializer,
    LoginResponseSerializer,
    UserSessionSerializer,
)
from apps.auth_rbac.services import create_user_session


class LoginView(APIView):
    """
    POST /api/v1/auth/login/
    Authenticates username + password and issues a SHA-256 hashed UserSession.
    """
    permission_classes = [AllowAny]
    authentication_classes = []  # Bypass global session authentication check

    def post(self, request: Request) -> Response:
        serializer = LoginRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        remember_me = serializer.validated_data.get("remember_me", False)

        # Retrieve client IP and User Agent
        ip_address = request.META.get("REMOTE_ADDR")
        # Check HTTP_X_FORWARDED_FOR if behind proxy
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(",")[0].strip()

        user_agent = request.META.get("HTTP_USER_AGENT", "")

        session, raw_token = create_user_session(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
            remember_me=remember_me,
        )

        response_data = {
            "token": raw_token,
            "user": user,
            "expires_at": session.expires_at,
        }

        response_serializer = LoginResponseSerializer(response_data)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Revokes the current active session.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        # request.auth is the UserSession instance returned by UserSessionAuthentication
        current_session = request.auth
        if isinstance(current_session, UserSession):
            current_session.revoke(reason="logout")
            return Response(
                {"detail": "Successfully logged out."}, status=status.HTTP_200_OK
            )
        return Response(
            {"detail": "No active session found."},
            status=status.HTTP_400_BAD_REQUEST,
        )


class MeView(APIView):
    """
    GET /api/v1/auth/me/
    Retrieves detail of the currently authenticated user session.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        serializer = AuthUserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserSessionViewSet(viewsets.ModelViewSet):
    """
    GET /api/v1/auth/sessions/
    DELETE /api/v1/auth/sessions/{id}/
    Provides read and delete operations on the user's active session history.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserSessionSerializer
    http_method_names = ["get", "delete", "head", "options"]

    def get_queryset(self):
        # Only return sessions belonging to the authenticated user
        return UserSession.objects.filter(user=self.request.user).order_by(
            "-issued_at"
        )

    def perform_destroy(self, instance: UserSession) -> None:
        # Perform logical revocation instead of database deletion
        instance.revoke(reason="revoked_by_user")
