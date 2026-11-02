"""
ASGI config for WRH Full-Stack Compiler Backend.
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wrh_backend.settings')
application = get_asgi_application()
