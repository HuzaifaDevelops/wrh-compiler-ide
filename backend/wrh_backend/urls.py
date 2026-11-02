"""
Root URL routing for WRH Full-Stack Compiler Backend.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/compile/', include('apps.compiler.urls')),
    path('api/workspace/', include('apps.workspace.urls')),
]
