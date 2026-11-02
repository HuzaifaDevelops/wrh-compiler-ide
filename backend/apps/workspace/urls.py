from django.urls import path
from .views import SnippetListCreateView, SnippetDetailView

urlpatterns = [
    path('snippets/', SnippetListCreateView.as_view(), name='snippet_list_create'),
    path('snippets/<int:pk>/', SnippetDetailView.as_view(), name='snippet_detail'),
]
