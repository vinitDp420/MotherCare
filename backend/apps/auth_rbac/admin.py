"""apps/auth_rbac/admin.py"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Permission, Role, RolePermission, User, UserRole, UserSession


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "is_active", "is_staff", "created_at")
    list_filter = ("is_active", "is_staff")
    search_fields = ("username", "email")
    ordering = ("username",)
    fieldsets = (
        (None, {"fields": ("username", "email", "password")}),
        ("Status", {"fields": ("is_active", "is_staff", "is_superuser")}),
        ("Dates", {"fields": ("last_login", "created_at", "updated_at")}),
    )
    readonly_fields = ("created_at", "updated_at", "last_login")
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "email", "password1", "password2"),
        }),
    )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "description", "created_at")
    search_fields = ("name",)


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ("name", "module", "action", "created_at")
    list_filter = ("module", "action")
    search_fields = ("name", "module", "action")


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "created_at")
    list_filter = ("role",)
    search_fields = ("user__username", "role__name")


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ("role", "permission", "created_at")
    list_filter = ("role",)


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ("user", "issued_at", "expires_at", "revoked_at", "ip_address")
    list_filter = ("revoked_at",)
    search_fields = ("user__username",)
    readonly_fields = ("token_hash", "issued_at", "created_at")
