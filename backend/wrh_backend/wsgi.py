"""
WSGI config for WRH Full-Stack Compiler Backend.
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wrh_backend.settings')
application = get_wsgi_application()
