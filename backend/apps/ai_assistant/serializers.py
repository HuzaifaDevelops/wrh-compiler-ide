"""
DRF Serializers for AI Assistant Endpoints.
"""

from rest_framework import serializers


class AiGenerateRequestSerializer(serializers.Serializer):
    prompt = serializers.CharField(
        required=True,
        help_text="Natural language description of the WRH program to generate",
    )
    context_code = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Optional existing code in editor for context",
    )
    model = serializers.CharField(
        required=False,
        default="gemini-3-flash-preview",
        help_text="Gemini model name",
    )
    api_key = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Optional client-provided Gemini API key",
    )


class AiFixRequestSerializer(serializers.Serializer):
    source_code = serializers.CharField(
        required=True,
        allow_blank=True,
        help_text="Broken WRH source code",
    )
    errors = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
        help_text="Compiler diagnostic errors list",
    )
    model = serializers.CharField(
        required=False,
        default="gemini-3-flash-preview",
        help_text="Gemini model name",
    )
    api_key = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Optional client-provided Gemini API key",
    )


class AiChatRequestSerializer(serializers.Serializer):
    messages = serializers.ListField(
        child=serializers.DictField(),
        required=True,
        help_text="List of message objects with role and content",
    )
    current_code = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Optional current editor code",
    )
    model = serializers.CharField(
        required=False,
        default="gemini-3-flash-preview",
        help_text="Gemini model name",
    )
    api_key = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Optional client-provided Gemini API key",
    )
