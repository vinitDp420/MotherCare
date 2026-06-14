"""
MotherCare — Authentication & RBAC Models (Domain 1)
Architecture: mothercare_final_architecture_v2.md — DOMAIN 1

Entities: User, Role, Permission, UserRole, RolePermission, UserSession

Key design decisions:
- Custom User model (AUTH_USER_MODEL = 'auth_rbac.User') replaces Django's default
- Passwords hashed with Argon2id (AUTH-02)
- Session tokens stored as SHA-256 hashes — raw tokens NEVER stored (AUTH-02)
- Per-session revocation with reason logging (AUTH-03)
- Roles are named groups; permissions are atomic module+action grants (AUTH-04, AUTH-05)
- Users may hold multiple roles (AUTH-06)
"""
import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


# ─────────────────────────────────────────────────────────────────────────────
# User Manager
# ─────────────────────────────────────────────────────────────────────────────
class UserManager(BaseUserManager):
    """Custom manager for the MotherCare User model."""

    def create_user(self, username: str, email: str, password: str | None = None, **extra_fields: object) -> "User":
        """Create a regular staff user."""
        if not username:
            raise ValueError("Username is required.")
        if not email:
            raise ValueError("Email is required.")
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        if password:
            user.set_password(password)  # Argon2id via PASSWORD_HASHERS setting
        user.save(using=self._db)
        return user

    def create_superuser(self, username: str, email: str, password: str, **extra_fields: object) -> "User":
        """Create a superuser for Django admin access."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        return self.create_user(username, email, password, **extra_fields)


# ─────────────────────────────────────────────────────────────────────────────
# User — System login account for all hospital staff
# Architecture: id, username, email, password_hash, is_active, last_login
# ─────────────────────────────────────────────────────────────────────────────
class User(AbstractBaseUser, PermissionsMixin):
    """
    MotherCare system user account.
    One User per staff member who needs system access.
    Some staff (non-system-users) may have a Staff record but no User account.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True, db_index=True)
    email = models.EmailField(unique=True, db_index=True)
    # password_hash is managed by AbstractBaseUser via set_password() with Argon2id
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)  # Django admin access
    last_login = models.DateTimeField(null=True, blank=True)

    # Audit fields (NOT inheriting BaseModel to avoid circular FK on created_by → User)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # created_by intentionally omitted on User (bootstrapping problem)

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    objects = UserManager()

    class Meta:
        db_table = "user"
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["username"]

    def __str__(self) -> str:
        return f"{self.username} <{self.email}>"


# ─────────────────────────────────────────────────────────────────────────────
# Role — Named permission group
# Examples: Doctor, Nurse, Pharmacist, Receptionist, Lab Tech, HR Admin, System Admin
# ─────────────────────────────────────────────────────────────────────────────
class Role(models.Model):
    """Named permission group. Users can hold multiple roles."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    class Meta:
        db_table = "role"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


# ─────────────────────────────────────────────────────────────────────────────
# Permission — Atomic access grant at module + action granularity
# ─────────────────────────────────────────────────────────────────────────────
class Permission(models.Model):
    """
    Atomic access grant. Granularity: module + action.
    Example: module="patients", action="write"
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, help_text="Human-readable permission name")
    module = models.CharField(max_length=100, help_text="Module name (e.g. 'patients', 'pharmacy')")
    action = models.CharField(
        max_length=50,
        help_text="Action (e.g. 'read', 'write', 'delete', 'export')",
    )
    description = models.TextField(blank=True)

    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    class Meta:
        db_table = "permission"
        unique_together = [["module", "action"]]  # Architecture: UNIQUE(module, action)
        ordering = ["module", "action"]

    def __str__(self) -> str:
        return f"{self.module}:{self.action}"


# ─────────────────────────────────────────────────────────────────────────────
# UserRole — Many-to-many junction: User ↔ Role
# ─────────────────────────────────────────────────────────────────────────────
class UserRole(models.Model):
    """Junction table: assigns Roles to Users. A user can hold multiple roles."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_roles")
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="user_roles")

    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    class Meta:
        db_table = "user_role"
        unique_together = [["user", "role"]]  # Architecture: UNIQUE(user_id, role_id)

    def __str__(self) -> str:
        return f"{self.user.username} → {self.role.name}"


# ─────────────────────────────────────────────────────────────────────────────
# RolePermission — Many-to-many junction: Role ↔ Permission
# ─────────────────────────────────────────────────────────────────────────────
class RolePermission(models.Model):
    """Junction table: assigns Permissions to Roles."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="role_permissions")
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name="role_permissions")

    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    class Meta:
        db_table = "role_permission"
        unique_together = [["role", "permission"]]  # Architecture: UNIQUE(role_id, permission_id)

    def __str__(self) -> str:
        return f"{self.role.name} → {self.permission}"


# ─────────────────────────────────────────────────────────────────────────────
# UserSession — Per-session token. Enables per-session revocation.
# Architecture: token_hash (SHA-256, not raw token), ip_address, revoke_reason
# AUTH-02: raw tokens NEVER stored
# AUTH-03: per-session revocation with reason logging
# ─────────────────────────────────────────────────────────────────────────────
class UserSession(models.Model):
    """
    One active session token per login event.
    Raw token returned to client once; only SHA-256 hash stored here.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sessions")
    token_hash = models.CharField(
        max_length=64,  # SHA-256 hex digest = 64 chars
        unique=True,
        db_index=True,
        help_text="SHA-256 hex digest of the raw session token. Raw token never stored.",
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    issued_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(help_text="Token expiry timestamp (UTC).")
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoke_reason = models.CharField(max_length=200, blank=True)

    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    class Meta:
        db_table = "user_session"
        indexes = [
            models.Index(
                fields=["expires_at"],
                name="idx_session_active",
                condition=models.Q(revoked_at__isnull=True),
            ),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(expires_at__gt=models.F("issued_at")),
                name="chk_session_expiry_after_issued",
            ),
        ]

    def __str__(self) -> str:
        return f"Session for {self.user.username} (issued: {self.issued_at})"

    @property
    def is_valid(self) -> bool:
        """Return True if the session is active and not expired."""
        return self.revoked_at is None and self.expires_at > timezone.now()

    def revoke(self, reason: str = "logout") -> None:
        """Revoke this session with an optional reason."""
        self.revoked_at = timezone.now()
        self.revoke_reason = reason
        self.save(update_fields=["revoked_at", "revoke_reason"])
