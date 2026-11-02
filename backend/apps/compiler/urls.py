from django.urls import path
from .views import CompileView

urlpatterns = [
    path('', CompileView.as_view(), name='compile'),
]
