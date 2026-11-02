from django.conf import settings
from django.db import models


class Snippet(models.Model):
    """
    User code snippet model for WRH IDE workspace.
    Linked to AUTH_USER_MODEL with title, code, and timestamps.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='snippets'
    )
    title = models.CharField(max_length=255)
    code = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.user.username})"
