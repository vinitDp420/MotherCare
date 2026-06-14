"""
MotherCare — Custom DRF Authentication Backend
Authenticates requests using the UserSession token (SHA-256 hashed lookup).
"""

from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request

from core.utils import hash_token


class UserSessionAuthentication(BaseAuthentication):
    """
    Custom DRF authentication class.
    Expects: Authorization: Token <raw_token>
    Looks up the SHA-256 hash of the token in the UserSession table.
    Returns (user, session) tuple on success.
    """

    keyword = "Token"

    def authenticate(self, request: Request) -> tuple | None:
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")

        if not auth_header.startswith(f"{self.keyword} "):
            return None  # Let other authenticators try

        raw_token = auth_header[len(self.keyword) + 1:].strip()
        if not raw_token:
            return None

        return self._validate_token(raw_token)

    def _validate_token(self, raw_token: str) -> tuple:
        from apps.auth_rbac.models import UserSession

        token_hash = hash_token(raw_token)

        try:
            session = (
                UserSession.objects
                .select_related("user")
                .get(token_hash=token_hash)
            )
        except UserSession.DoesNotExist:
            raise AuthenticationFailed("Invalid or expired session token.") from None

        if not session.is_valid:
            raise AuthenticationFailed("Session has expired or been revoked.")

        if not session.user.is_active:
            raise AuthenticationFailed("User account is disabled.")

        # Update last login
        session.user.last_login = timezone.now()
        session.user.save(update_fields=["last_login"])

        return (session.user, session)

    def authenticate_header(self, request: Request) -> str:
        return self.keyword
