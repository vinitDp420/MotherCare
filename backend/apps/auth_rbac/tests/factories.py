"""
MotherCare — Auth RBAC Test Factories
"""
import factory
from django.utils import timezone
from factory.django import DjangoModelFactory

from apps.auth_rbac.models import Permission, Role, RolePermission, User, UserRole, UserSession
from apps.people.tests.factories import UserFactory


class RoleFactory(DjangoModelFactory):
    class Meta:
        model = Role
        django_get_or_create = ("name",)

    name = factory.Sequence(lambda n: f"Role_{n}")
    description = "Test Role"


class PermissionFactory(DjangoModelFactory):
    class Meta:
        model = Permission
        django_get_or_create = ("module", "action")

    name = factory.Sequence(lambda n: f"Permission_{n}")
    module = factory.Sequence(lambda n: f"module_{n}")
    action = "read"


class UserRoleFactory(DjangoModelFactory):
    class Meta:
        model = UserRole

    user = factory.SubFactory(UserFactory)
    role = factory.SubFactory(RoleFactory)


class RolePermissionFactory(DjangoModelFactory):
    class Meta:
        model = RolePermission

    role = factory.SubFactory(RoleFactory)
    permission = factory.SubFactory(PermissionFactory)


class UserSessionFactory(DjangoModelFactory):
    class Meta:
        model = UserSession

    user = factory.SubFactory(UserFactory)
    token_hash = factory.Sequence(lambda n: f"hash_{n}")
    expires_at = factory.LazyFunction(
        lambda: timezone.now() + timezone.timedelta(hours=8)
    )
