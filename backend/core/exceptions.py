"""
MotherCare — Custom Exception Types and Global Exception Handler
CLAUDE.md §6 Error Handling rules:
    - HTTP 422 for business rule violations
    - HTTP 409 for constraint conflicts (duplicate token, double booking)
    - Standard DRF error format: {"detail": "...", "code": "...", "field": "..."}
"""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


class BusinessRuleError(Exception):
    """
    Raised when a business rule defined in BUSINESS_RULES.md is violated.
    Maps to HTTP 422 Unprocessable Entity.

    Examples:
        - Attempting to create a second active admission for the same patient
        - Dispensing a prescription that has already been dispensed
        - Creating a delivery without an active admission
    """

    def __init__(self, detail: str, code: str = "business_rule_violation", field: str | None = None) -> None:
        self.detail = detail
        self.code = code
        self.field = field
        super().__init__(detail)


class ConflictError(Exception):
    """
    Raised when a uniqueness constraint conflict is detected at the application layer.
    Maps to HTTP 409 Conflict.

    Examples:
        - Duplicate token number for the same doctor on the same day
        - Double-booking an already occupied bed
    """

    def __init__(self, detail: str, code: str = "conflict", field: str | None = None) -> None:
        self.detail = detail
        self.code = code
        self.field = field
        super().__init__(detail)


class ImmutabilityError(Exception):
    """
    Raised when an attempt is made to modify an immutable record.
    Maps to HTTP 403 Forbidden.

    Applies to: Prescription, PrescriptionItem, LabReportFile, AuditLog
    """

    def __init__(self, detail: str = "This record is immutable and cannot be modified.") -> None:
        self.detail = detail
        self.code = "immutable_record"
        super().__init__(detail)


def mothercare_exception_handler(exc: Exception, context: dict) -> Response | None:
    """
    Global DRF exception handler.
    Wraps custom exceptions into standard DRF-compatible JSON responses.
    All errors follow the format: {"detail": "...", "code": "...", "field": "..."}
    """
    # Handle custom MotherCare exceptions first
    if isinstance(exc, BusinessRuleError):
        data = {"detail": exc.detail, "code": exc.code}
        if exc.field:
            data["field"] = exc.field
        return Response(data, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    if isinstance(exc, ConflictError):
        data = {"detail": exc.detail, "code": exc.code}
        if exc.field:
            data["field"] = exc.field
        return Response(data, status=status.HTTP_409_CONFLICT)

    if isinstance(exc, ImmutabilityError):
        return Response(
            {"detail": exc.detail, "code": exc.code},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Fall through to DRF's default handler for all other exceptions
    response = exception_handler(exc, context)

    if response is not None:
        # Normalize the error shape
        if isinstance(response.data, dict) and "detail" not in response.data:
            # DRF field validation errors — wrap in standard format
            response.data = {"detail": "Validation failed.", "code": "validation_error", "errors": response.data}

    return response
