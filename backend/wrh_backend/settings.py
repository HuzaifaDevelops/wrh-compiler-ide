"""
Django settings for WRH Full-Stack Compiler Backend.
Generated for Milestone 1 Monorepo Foundation.
"""

from datetime import timedelta
import os
from pathlib import Path
import sys

import dj_database_url
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Ensure backend root is in sys.path for apps discovery
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Load .env file
load_dotenv(BASE_DIR / '.env')

# Security Settings
SECRET_KEY = (
    os.getenv('SECRET_KEY')
    or os.getenv(
        'DJANGO_SECRET_KEY',
        'django-insecure-wrh-compiler-dev-secret-key-change-in-production-2026'
    )
)

debug_env = os.getenv('DEBUG')
if debug_env is None:
    debug_env = os.getenv('DJANGO_DEBUG', 'False')
DEBUG = str(debug_env).strip().lower() in ('true', '1', 'yes')

allowed_hosts_raw = (
    os.getenv('ALLOWED_HOSTS')
    or os.getenv('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1,backend')
)
ALLOWED_HOSTS = [
    host.strip()
    for host in allowed_hosts_raw.split(',')
    if host.strip()
]

# Application Definition
INSTALLED_APPS = [
    # Django Core
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-Party Packages
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',

    # Local Apps
    'apps.authentication',
    'apps.compiler',
    'apps.workspace',
    'apps.ai_assistant',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # High priority: intercept preflight requests
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'wrh_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'wrh_backend.wsgi.application'
ASGI_APPLICATION = 'wrh_backend.asgi.application'

# ------------------------------------------------------------------------------
# 3-Tier Database Configuration:
# Tier 0 (Test isolation): In-memory SQLite (bypasses Supabase CREATEDB restrictions)
# Tier 1 (Cloud URL): DATABASE_URL via dj_database_url with SSL
# Tier 2 (Cloud discrete): SUPABASE_DB_HOST with psycopg driver & SSL
# Tier 3 (Local fallback): SQLite file in backend/db.sqlite3
# ------------------------------------------------------------------------------
IS_TESTING = 'test' in sys.argv or os.getenv('DJANGO_TESTING', 'False').lower() in ('true', '1', 'yes')
DATABASE_URL = os.getenv('DATABASE_URL', '').strip()
SUPABASE_DB_HOST = os.getenv('SUPABASE_DB_HOST', '').strip()

if IS_TESTING:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }
elif DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
            ssl_require=True,
        )
    }
elif SUPABASE_DB_HOST:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('SUPABASE_DB_NAME', 'postgres'),
            'USER': os.getenv('SUPABASE_DB_USER', 'postgres'),
            'PASSWORD': os.getenv('SUPABASE_DB_PASSWORD', ''),
            'HOST': SUPABASE_DB_HOST,
            'PORT': os.getenv('SUPABASE_DB_PORT', '5432'),
            'OPTIONS': {
                'sslmode': os.getenv('SUPABASE_DB_SSLMODE', 'require'),
            },
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Custom User Model
AUTH_USER_MODEL = 'authentication.CustomUser'

# Password Validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ),
}

# SimpleJWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# CORS Configuration
from corsheaders.defaults import default_headers

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:3000,http://127.0.0.1:3000'
    ).split(',')
    if origin.strip()
]

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^http://localhost:\d+$",
    r"^http://127\.0\.0\.1:\d+$",
]

if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = list(default_headers) + [
    'x-gemini-api-key',
    'accept-encoding',
    'dnt',
    'origin',
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Compiler Configuration
compiler_allow_unauth_env = os.getenv('COMPILER_ALLOW_UNAUTHENTICATED')
if compiler_allow_unauth_env is None:
    COMPILER_ALLOW_UNAUTHENTICATED = False
else:
    COMPILER_ALLOW_UNAUTHENTICATED = compiler_allow_unauth_env.strip().lower() in ('true', '1', 'yes')

