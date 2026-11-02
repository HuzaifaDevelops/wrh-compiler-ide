"""
DRF Serializers for Compiler API endpoints.
Validates compile request payloads and defines response structure.
"""

from rest_framework import serializers


class CompileRequestSerializer(serializers.Serializer):
    """
    Validates compilation requests.
    Supports allow_blank=True for empty program boundary tests.
    """
    source_code = serializers.CharField(
        required=True,
        allow_blank=True,
        help_text="WRH source code to compile"
    )


class TokenSerializer(serializers.Serializer):
    """Token representation serializer."""
    type = serializers.CharField()
    lexeme = serializers.CharField()
    line = serializers.IntegerField()
    column = serializers.IntegerField(required=False, default=1)


class ErrorDetailSerializer(serializers.Serializer):
    """Compiler diagnostic detail serializer."""
    stage = serializers.CharField()
    line = serializers.IntegerField()
    column = serializers.IntegerField(required=False, default=1)
    message = serializers.CharField()
    rule = serializers.CharField(required=False, allow_blank=True, default="")


class CompileResponseSerializer(serializers.Serializer):
    """
    Response schema serializer matching PROJECT.md § Interface Contracts.
    """
    success = serializers.BooleanField()
    status = serializers.CharField()
    stage_reached = serializers.IntegerField()
    stage_failed = serializers.CharField(allow_null=True, required=False)
    tokens = TokenSerializer(many=True)
    ast = serializers.JSONField()
    ast_ascii = serializers.CharField(allow_blank=True)
    symbol_table = serializers.DictField()
    errors = ErrorDetailSerializer(many=True)
    execution_time_ms = serializers.FloatField()
