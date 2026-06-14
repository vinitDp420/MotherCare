import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.auth_rbac.models import UserSession
from apps.auth_rbac.tests.factories import (
    PermissionFactory,
    RoleFactory,
    RolePermissionFactory,
    UserRoleFactory,
)
from apps.people.tests.factories import UserFactory


@pytest.fixture
def api_client():
    return APIClient()


def create_session_helper(user):
    from apps.auth_rbac.services import create_user_session
    session, raw_token = create_user_session(user)
    return session, raw_token


@pytest.mark.django_db
class TestAuthenticationAPI:
    def test_login_success(self, api_client):
        user = UserFactory(username="testuser")
        user.set_password("secure_password")
        user.save()

        # Assign a role & permission
        role = RoleFactory(name="Doctor")
        perm = PermissionFactory(module="patients", action="read")
        UserRoleFactory(user=user, role=role)
        RolePermissionFactory(role=role, permission=perm)

        url = reverse("login")
        payload = {"username": "testuser", "password": "secure_password"}
        response = api_client.post(url, payload)

        assert response.status_code == status.HTTP_200_OK
        assert "token" in response.data
        assert "user" in response.data
        assert "expires_at" in response.data
        assert response.data["user"]["username"] == "testuser"
        assert "Doctor" in response.data["user"]["roles"]
        assert "patients:read" in response.data["user"]["permissions"]

    def test_login_invalid_credentials(self, api_client):
        user = UserFactory(username="testuser")
        user.set_password("secure_password")
        user.save()

        url = reverse("login")
        payload = {"username": "testuser", "password": "wrong_password"}
        response = api_client.post(url, payload)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_me_endpoint(self, api_client):
        user = UserFactory(username="testuser")
        session, raw_token = create_session_helper(user)

        api_client.credentials(HTTP_AUTHORIZATION=f"Token {raw_token}")
        url = reverse("me")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["username"] == "testuser"

    def test_me_unauthorized(self, api_client):
        url = reverse("me")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_logout(self, api_client):
        user = UserFactory(username="testuser")
        session, raw_token = create_session_helper(user)

        api_client.credentials(HTTP_AUTHORIZATION=f"Token {raw_token}")
        url = reverse("logout")
        response = api_client.post(url)

        assert response.status_code == status.HTTP_200_OK
        session.refresh_from_db()
        assert not session.is_valid
        assert session.revoked_at is not None

    def test_list_sessions(self, api_client):
        user = UserFactory(username="testuser")
        session1, raw_token = create_session_helper(user)
        session2, _ = create_session_helper(user)

        api_client.credentials(HTTP_AUTHORIZATION=f"Token {raw_token}")
        url = reverse("session-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        # UserSessionViewSet queries user's sessions; check size
        assert response.data["count"] == 2

    def test_revoke_session(self, api_client):
        user = UserFactory(username="testuser")
        session1, raw_token = create_session_helper(user)
        session2, _ = create_session_helper(user)

        api_client.credentials(HTTP_AUTHORIZATION=f"Token {raw_token}")
        url = reverse("session-detail", kwargs={"pk": session2.id})
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        session2.refresh_from_db()
        assert not session2.is_valid
        assert session2.revoked_at is not None
