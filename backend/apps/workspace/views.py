from rest_framework import generics, permissions
from .models import Snippet
from .serializers import SnippetSerializer


class SnippetListCreateView(generics.ListCreateAPIView):
    """
    GET /api/workspace/snippets/ - List current user's snippets.
    POST /api/workspace/snippets/ - Create a snippet for current user.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SnippetSerializer

    def get_queryset(self):
        return Snippet.objects.filter(user=self.request.user).order_by('-updated_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SnippetDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/workspace/snippets/<id>/ - Retrieve user's snippet.
    PUT/PATCH /api/workspace/snippets/<id>/ - Update user's snippet.
    DELETE /api/workspace/snippets/<id>/ - Delete user's snippet.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SnippetSerializer

    def get_queryset(self):
        return Snippet.objects.filter(user=self.request.user)
