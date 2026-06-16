"""
MotherCare — Master URL Configuration
All API routes are versioned under /api/v1/.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    # Django admin
    path("admin/", admin.site.urls),

    # ── API v1 ───────────────────────────────────────────────────────────────
    path("api/v1/auth/",          include("apps.auth_rbac.urls")),
    path("api/v1/hospital/",      include("apps.hospital_config.urls")),
    path("api/v1/patients/",      include("apps.people.urls.patient_urls")),
    path("api/v1/staff/",         include("apps.people.urls.staff_urls")),
    path("api/v1/doctors/",       include("apps.people.urls.doctor_urls")),
    path("api/v1/pregnancies/",   include("apps.pregnancy.urls")),
    path("api/v1/appointments/",  include("apps.appointments.urls")),
    path("api/v1/consultations/", include("apps.consultations.urls")),
    path("api/v1/prescriptions/", include("apps.prescriptions.urls")),
    path("api/v1/laboratory/",    include("apps.laboratory.urls")),
    path("api/v1/lab/",           include("apps.laboratory.urls_lab")),
    path("api/v1/referrals/",     include("apps.referrals.urls")),
    path("api/v1/pharmacy/",      include("apps.pharmacy.urls")),
    path("api/v1/admissions/",    include("apps.admissions.urls")),
    path("api/v1/beds/",          include("apps.admissions.urls_beds")),
    path("api/v1/delivery/",      include("apps.delivery.urls")),
    path("api/v1/newborns/",      include("apps.newborn.urls")),
    path("api/v1/billing/",       include("apps.billing.urls")),
    path("api/v1/hr/",            include("apps.hr.urls")),
    path("api/v1/emergency/",     include("apps.emergency.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
    path("api/v1/documents/",     include("apps.documents.urls")),
    path("api/v1/audit/",         include("apps.audit.urls")),
    path("api/v1/reports/",       include("apps.reports.urls")),
    path("api/v1/settings/",      include("apps.hospital_config.settings_urls")),
    path("api/v1/search/",        include("apps.people.urls.search_urls")),

    # ── OpenAPI / Swagger ────────────────────────────────────────────────────
    path("api/schema/",           SpectacularAPIView.as_view(), name="schema"),
    path("api/schema/swagger-ui/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/schema/redoc/",     SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    # Django Debug Toolbar
    try:
        import debug_toolbar
        urlpatterns = [path("__debug__/", include(debug_toolbar.urls))] + urlpatterns
    except ImportError:
        pass
