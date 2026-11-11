"""
Unit Tests for AI Assistant App.
Tests endpoints, serializers, API key resolution, and error handling.
"""

from unittest.mock import patch
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .gemini_client import (
    GeminiClient,
    GeminiApiKeyMissingError,
    extract_wrh_code,
)


class AiAssistantEndpointTests(APITestCase):
    def test_status_endpoint(self):
        url = reverse('ai-status')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("configured", res.data)
        self.assertIn("supported_models", res.data)
        self.assertIn("gemini-1.5-flash", res.data["supported_models"])

    def test_generate_missing_prompt(self):
        url = reverse('ai-generate')
        res = self.client.post(url, {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("prompt", res.data.get("details", {}))

    def test_generate_missing_api_key(self):
        url = reverse('ai-generate')
        with patch.dict('os.environ', {'GEMINI_API_KEY': ''}):
            res = self.client.post(url, {"prompt": "Write a loop"}, format='json')
            self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
            self.assertEqual(res.data.get("error"), "api_key_missing")

    def test_fix_missing_source_code(self):
        url = reverse('ai-fix')
        res = self.client.post(url, {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("source_code", res.data.get("details", {}))

    @patch('apps.ai_assistant.gemini_client.call_gemini_rest')
    def test_generate_successful_mock(self, mock_gemini):
        mock_gemini.return_value = "```wrh\ndigit x := 5;\nflex(x);\n```\nLogic: Prints 5."
        url = reverse('ai-generate')
        res = self.client.post(
            url,
            {"prompt": "print 5", "api_key": "dummy-key"},
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data.get("success"))
        self.assertIn("digit x := 5;", res.data.get("code", ""))

    @patch('apps.ai_assistant.gemini_client.call_gemini_rest')
    def test_fix_successful_mock(self, mock_gemini):
        mock_gemini.return_value = '{"explanation": "Added parentheses to condition", "violated_rule": "Syntax", "fixed_code": "when (a ?= 1) { flex(a); }", "changes_summary": ["Added ( )"]}'
        url = reverse('ai-fix')
        res = self.client.post(
            url,
            {
                "source_code": "when a ?= 1 { flex(a); }",
                "errors": [{"stage": "syntax", "line": 1, "message": "expected ("}],
                "api_key": "dummy-key",
            },
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data.get("success"))
        self.assertIn("when (a ?= 1)", res.data.get("fixed_code", ""))
        self.assertIn("parentheses", res.data.get("explanation", ""))

    def test_extract_wrh_code_utility(self):
        raw = "Here is your code:\n```wrh\ndigit count := 0;\n```\nEnjoy!"
        extracted = extract_wrh_code(raw)
        self.assertEqual(extracted, "digit count := 0;")
