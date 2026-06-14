"""
MotherCare — Standard Pagination Classes
"""
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsPagination(PageNumberPagination):
    """
    Default pagination: 25 items per page.
    Query params: ?page=N&page_size=N (max 100).
    """

    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100
    page_query_param = "page"

    def get_paginated_response(self, data: list) -> Response:
        return Response(
            {
                "count": self.page.paginator.count,
                "total_pages": self.page.paginator.num_pages,
                "current_page": self.page.number,
                "page_size": self.get_page_size(self.request),
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            }
        )

    def get_paginated_response_schema(self, schema: dict) -> dict:
        return {
            "type": "object",
            "properties": {
                "count": {"type": "integer"},
                "total_pages": {"type": "integer"},
                "current_page": {"type": "integer"},
                "page_size": {"type": "integer"},
                "next": {"type": "string", "nullable": True},
                "previous": {"type": "string", "nullable": True},
                "results": schema,
            },
        }


class LargeResultsPagination(PageNumberPagination):
    """For reporting endpoints that may return more items (e.g. audit logs)."""

    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 500
