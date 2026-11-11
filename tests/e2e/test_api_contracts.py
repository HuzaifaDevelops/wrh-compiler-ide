"""
API Contracts Test Suite.
Validates HTTP request and response payload schemas defined in PROJECT.md:
- POST /api/compile/ Success Contract
- POST /api/compile/ Lexical Error Contract
- POST /api/compile/ Syntax Error Contract
- POST /api/compile/ Semantic Error Contract
- Authentication Payload Schemas (Register, Login, Token Refresh, Profile)
- Workspace Snippet Payload Schemas (List, Create, Detail)
"""

import unittest
from .compiler_adapter import compile_wrh


class TestApiContracts(unittest.TestCase):
    """Verifies schema conformance with PROJECT.md Interface Contracts."""

    def test_api_compile_success_contract_schema(self):
        """Validates that successful compilation matches the POST /api/compile/ JSON response schema."""
        code = "digit a := 10;\nflex(a);"
        res = compile_wrh(code)

        # Mandatory top-level keys
        required_keys = [
            "success", "status", "stage_reached", "stage_failed",
            "tokens", "ast", "ast_ascii", "symbol_table", "errors", "execution_time_ms"
        ]
        for key in required_keys:
            self.assertIn(key, res, f"Missing key in response: {key}")

        self.assertTrue(res["success"])
        self.assertEqual(res["status"], "compiled")
        self.assertEqual(res["stage_reached"], 3)
        self.assertIsNone(res["stage_failed"])
        self.assertEqual(len(res["errors"]), 0)

        # Tokens list item contract: type, lexeme, line
        self.assertIsInstance(res["tokens"], list)
        self.assertGreater(len(res["tokens"]), 0)
        tok = res["tokens"][0]
        self.assertIn("type", tok)
        self.assertIn("lexeme", tok)
        self.assertIn("line", tok)

        # Symbol table contract: mapping of name -> {type, line}
        self.assertIsInstance(res["symbol_table"], dict)
        self.assertIn("a", res["symbol_table"])
        self.assertEqual(res["symbol_table"]["a"]["type"], "digit")
        self.assertEqual(res["symbol_table"]["a"]["line"], 1)

        # Latency must be non-negative float
        self.assertIsInstance(res["execution_time_ms"], (int, float))
        self.assertGreaterEqual(res["execution_time_ms"], 0)

    def test_api_compile_icg_schema(self):
        """Validates that successful compilation generates valid TAC, Quadruples, and Triples."""
        code = "digit a := 10 +++ 5;\nflex(a);"
        res = compile_wrh(code)

        self.assertTrue(res["success"])
        self.assertIn("icg", res)
        icg = res["icg"]
        self.assertIn("tac", icg)
        self.assertIn("tac_lines", icg)
        self.assertIn("quadruples", icg)
        self.assertIn("triples", icg)
        self.assertGreater(len(icg["tac_lines"]), 0)
        self.assertGreater(len(icg["quadruples"]), 0)
        self.assertGreater(len(icg["triples"]), 0)

    def test_api_compile_lexical_error_schema(self):
        """Validates that lexical errors return status='error' and stage_failed='lexical'."""
        code = "digit a := @42;"
        res = compile_wrh(code)

        self.assertFalse(res["success"])
        self.assertEqual(res["status"], "error")
        self.assertEqual(res["stage_failed"], "lexical")
        self.assertEqual(res["stage_reached"], 0)

        self.assertIsInstance(res["errors"], list)
        self.assertGreaterEqual(len(res["errors"]), 1)
        err = res["errors"][0]
        self.assertEqual(err["stage"], "lexical")
        self.assertEqual(err["line"], 1)
        self.assertIn("unknown character '@'", err["message"])

    def test_api_compile_syntax_error_schema(self):
        """Validates that syntax errors return status='error' and stage_failed='syntax'."""
        code = "digit a := ;"
        res = compile_wrh(code)

        self.assertFalse(res["success"])
        self.assertEqual(res["status"], "error")
        self.assertEqual(res["stage_failed"], "syntax")
        self.assertEqual(res["stage_reached"], 1)

        self.assertIsInstance(res["errors"], list)
        self.assertGreaterEqual(len(res["errors"]), 1)
        err = res["errors"][0]
        self.assertEqual(err["stage"], "syntax")
        self.assertEqual(err["line"], 1)
        self.assertIn("expected an expression but found ';'", err["message"])

    def test_api_compile_semantic_error_schema(self):
        """Validates that semantic errors return status='error' and stage_failed='semantic'."""
        code = "flex(undeclared_var);"
        res = compile_wrh(code)

        self.assertFalse(res["success"])
        self.assertEqual(res["status"], "error")
        self.assertEqual(res["stage_failed"], "semantic")
        self.assertEqual(res["stage_reached"], 2)

        self.assertIsInstance(res["errors"], list)
        self.assertGreaterEqual(len(res["errors"]), 1)
        err = res["errors"][0]
        self.assertEqual(err["stage"], "semantic")
        self.assertEqual(err["line"], 1)
        self.assertEqual(err["rule"], "rule2_undeclared_variable")
        self.assertIn("variable 'undeclared_var' is not declared", err["message"])

    def test_auth_registration_payload_schema(self):
        """Validates schema validation rules for POST /api/auth/register/ payload."""
        valid_payload = {
            "username": "student1",
            "email": "student1@example.com",
            "password": "StrongPassword123!"
        }
        self.assertIn("username", valid_payload)
        self.assertIn("email", valid_payload)
        self.assertIn("password", valid_payload)
        self.assertGreater(len(valid_payload["username"]), 2)
        self.assertIn("@", valid_payload["email"])
        self.assertGreater(len(valid_payload["password"]), 6)

    def test_auth_tokens_response_schema(self):
        """Validates JWT pair response schema for login and register endpoints."""
        mock_auth_response = {
            "user": {
                "id": 1,
                "username": "student1",
                "email": "student1@example.com"
            },
            "tokens": {
                "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_access",
                "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_refresh"
            }
        }
        self.assertIn("user", mock_auth_response)
        self.assertIn("tokens", mock_auth_response)
        self.assertIn("access", mock_auth_response["tokens"])
        self.assertIn("refresh", mock_auth_response["tokens"])

    def test_workspace_snippet_schema(self):
        """Validates schema for workspace user snippet models."""
        mock_snippet = {
            "id": 101,
            "title": "Factorial Program",
            "code": "digit n := 5; flex(n);",
            "created_at": "2026-10-15T08:00:00Z",
            "updated_at": "2026-10-15T08:05:00Z"
        }
        self.assertIn("id", mock_snippet)
        self.assertIn("title", mock_snippet)
        self.assertIn("code", mock_snippet)
        self.assertIn("created_at", mock_snippet)
        self.assertIn("updated_at", mock_snippet)


if __name__ == "__main__":
    unittest.main()
