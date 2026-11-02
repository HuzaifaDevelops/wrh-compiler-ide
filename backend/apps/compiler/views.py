"""
Compiler Views for WRH Full-Stack Compiler API.
Provides POST /api/compile/ and GET /api/compile/ metadata endpoints.
"""

from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.compiler.engine.pipeline import compile_source
from apps.compiler.engine.tokens import KEYWORDS, CUSTOM_OPERATORS
from .serializers import CompileRequestSerializer


class CompilerAccessPermission(permissions.BasePermission):
    """
    Permission class for Compiler endpoints:
    - SAFE_METHODS (GET, HEAD, OPTIONS): Allowed for metadata discovery.
    - Write methods (POST): Allowed if COMPILER_ALLOW_UNAUTHENTICATED is True (guest mode),
      otherwise strictly requires user authentication.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if getattr(settings, "COMPILER_ALLOW_UNAUTHENTICATED", False):
            return True
        return bool(request.user and request.user.is_authenticated)


class CompileView(APIView):
    """
    Compiler Endpoint:
    - GET /api/compile/: Returns compiler service metadata (supported stages, keywords, operators).
    - POST /api/compile/: Compiles source code across Lexer, Parser, and Semantic Analyzer stages.
    """
    permission_classes = [CompilerAccessPermission]

    def get(self, request):
        """Service metadata discovery endpoint."""
        metadata = {
            "service": "WRH Compiler Engine API",
            "version": "1.0.0",
            "status": "ready",
            "stages": [
                {"number": 1, "name": "Lexical Analysis", "module": "lexer"},
                {"number": 2, "name": "Syntactic Parsing", "module": "parser"},
                {"number": 3, "name": "Semantic Analysis", "module": "semantic"},
            ],
            "keywords": list(KEYWORDS.keys()),
            "custom_operators": CUSTOM_OPERATORS,
        }
        return Response(metadata, status=status.HTTP_200_OK)

    def post(self, request):
        """Compiles provided WRH source code."""
        serializer = CompileRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "source_code is required", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        source_code = serializer.validated_data["source_code"]
        result = compile_source(source_code)
        return Response(result, status=status.HTTP_200_OK)
