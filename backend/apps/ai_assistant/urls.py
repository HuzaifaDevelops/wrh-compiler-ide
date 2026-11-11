"""
URL Routing for AI Assistant App.
"""

from django.urls import path
from .views import (
    AiStatusView,
    AiGenerateView,
    AiFixView,
    AiChatView,
)

urlpatterns = [
    path('status/', AiStatusView.as_view(), name='ai-status'),
    path('generate/', AiGenerateView.as_view(), name='ai-generate'),
    path('fix/', AiFixView.as_view(), name='ai-fix'),
    path('chat/', AiChatView.as_view(), name='ai-chat'),
]
