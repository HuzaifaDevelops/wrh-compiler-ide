"""
API Views for AI Assistant Endpoints.
"""

from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .gemini_client import (
    GeminiClient,
    GeminiError,
    GeminiApiKeyMissingError,
)
from .serializers import (
    AiGenerateRequestSerializer,
    AiFixRequestSerializer,
    AiChatRequestSerializer,
)

gemini_client = GeminiClient()


class AiAccessPermission(permissions.BasePermission):
    """
    Permission class for AI Assistant endpoints:
    Allows SAFE_METHODS (GET, OPTIONS, HEAD) unconditionally.
    Allows write methods if user is authenticated or if COMPILER_ALLOW_UNAUTHENTICATED is True.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if getattr(settings, "COMPILER_ALLOW_UNAUTHENTICATED", True):
            return True
        return bool(request.user and request.user.is_authenticated)


def get_client_api_key(request, validated_data) -> str:
    """Extracts API key from header or body parameter."""
    header_key = request.headers.get("X-Gemini-Api-Key", "").strip()
    body_key = (validated_data.get("api_key") or "").strip()
    return header_key or body_key


class AiStatusView(APIView):
    """
    Endpoint: GET /api/ai/status/
    Returns configuration status of the Gemini AI Assistant.
    """
    permission_classes = [AiAccessPermission]

    def get(self, request):
        api_key = request.headers.get("X-Gemini-Api-Key", "").strip()
        status_info = gemini_client.get_status(api_key=api_key)
        return Response(status_info, status=status.HTTP_200_OK)


class AiGenerateView(APIView):
    """
    Endpoint: POST /api/ai/generate/
    Generates WRH-Lang code based on natural language prompt.
    """
    permission_classes = [AiAccessPermission]

    def post(self, request):
        serializer = AiGenerateRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "Invalid request", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        api_key = get_client_api_key(request, data)

        try:
            result = gemini_client.generate_code(
                prompt=data["prompt"],
                context_code=data.get("context_code"),
                model=data.get("model"),
                api_key=api_key,
            )
            return Response(result, status=status.HTTP_200_OK)
        except GeminiApiKeyMissingError as e:
            return Response(
                {
                    "error": "api_key_missing",
                    "message": str(e),
                    "setup_url": "https://aistudio.google.com/",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except GeminiError as e:
            return Response(
                {"error": "gemini_error", "message": e.message},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": "server_error", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AiFixView(APIView):
    """
    Endpoint: POST /api/ai/fix/
    Diagnoses compiler errors and returns repaired WRH source code.
    """
    permission_classes = [AiAccessPermission]

    def post(self, request):
        serializer = AiFixRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "Invalid request", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        api_key = get_client_api_key(request, data)

        try:
            result = gemini_client.fix_code(
                source_code=data["source_code"],
                errors=data.get("errors", []),
                model=data.get("model"),
                api_key=api_key,
            )
            return Response(result, status=status.HTTP_200_OK)
        except GeminiApiKeyMissingError as e:
            return Response(
                {
                    "error": "api_key_missing",
                    "message": str(e),
                    "setup_url": "https://aistudio.google.com/",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except GeminiError as e:
            return Response(
                {"error": "gemini_error", "message": e.message},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": "server_error", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AiChatView(APIView):
    """
    Endpoint: POST /api/ai/chat/
    Interactive chat assistant for WRH language questions.
    """
    permission_classes = [AiAccessPermission]

    def post(self, request):
        serializer = AiChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "Invalid request", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        api_key = get_client_api_key(request, data)

        try:
            result = gemini_client.chat(
                messages=data["messages"],
                current_code=data.get("current_code"),
                model=data.get("model"),
                api_key=api_key,
            )
            return Response(result, status=status.HTTP_200_OK)
        except GeminiApiKeyMissingError as e:
            return Response(
                {
                    "error": "api_key_missing",
                    "message": str(e),
                    "setup_url": "https://aistudio.google.com/",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except GeminiError as e:
            return Response(
                {"error": "gemini_error", "message": e.message},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": "server_error", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
