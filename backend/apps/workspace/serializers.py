from rest_framework import serializers
from .models import Snippet


class SnippetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Snippet
        fields = ('id', 'title', 'code', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
