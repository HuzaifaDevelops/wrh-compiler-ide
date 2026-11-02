"""
Comprehensive Unit Tests for WRH Compiler App.
Covers:
- API endpoint authentication and permission enforcement (401 on unauthenticated, guest mode support).
- Service metadata discovery (GET /api/compile/).
- Endpoint functional compilation tests (valid, lexical error, syntax error, semantic error, missing payload).
- Direct engine unit tests:
  * Lexer (keywords, 9 custom operators with '//' as integer division, coordinates, Token tuple unpacking).
  * Parser (statements, precedence, canonical syntax error messages).
  * AST Nodes (dataclass attributes, tuple unpacking, to_dict, thread-safe ASCII tree rendering).
  * Semantic Analyzer (all 6 formal rules and cascade suppression).
"""

import sys
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.compiler.engine import (
    Token,
    LexicalError,
    ParseError,
    SemanticError,
    SymbolTable,
    tokenize,
    parse,
    analyze,
    analyze_semantics,
    compile_source,
    render_ast_ascii,
    ProgramNode,
    DeclNode,
    AssignNode,
    IfNode,
    WhileNode,
    PrintNode,
    BinOpNode,
    NumNode,
    StrNode,
    BoolNode,
    IdNode,
)

User = get_user_model()


class CompilerAuthEndpointTests(APITestCase):
    """Verifies authentication and access permission rules on /api/compile/."""

    def setUp(self):
        self.compile_url = reverse("compile")
        self.user = User.objects.create_user(
            username="compiler_tester",
            email="tester@example.com",
            password="testpassword123",
        )

    @override_settings(COMPILER_ALLOW_UNAUTHENTICATED=False)
    def test_anonymous_compile_request_rejected_with_401(self):
        """When guest mode is disabled, anonymous POST must return 401 Unauthorized."""
        response = self.client.post(
            self.compile_url,
            {"source_code": "digit a := 10;\nflex(a);"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @override_settings(COMPILER_ALLOW_UNAUTHENTICATED=False)
    def test_authenticated_compile_request_success(self):
        """Authenticated users must be allowed to compile code."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            self.compile_url,
            {"source_code": "digit a := 10;\nflex(a);"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

    @override_settings(COMPILER_ALLOW_UNAUTHENTICATED=True)
    def test_guest_mode_allows_anonymous_compilation(self):
        """When COMPILER_ALLOW_UNAUTHENTICATED is True, anonymous users can compile."""
        response = self.client.post(
            self.compile_url,
            {"source_code": "digit a := 10;\nflex(a);"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

    def test_service_metadata_get_endpoint(self):
        """GET /api/compile/ returns service metadata without requiring authentication."""
        response = self.client.get(self.compile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data["service"], "WRH Compiler Engine API")
        self.assertEqual(data["version"], "1.0.0")
        self.assertIn("stages", data)
        self.assertEqual(len(data["stages"]), 3)
        self.assertIn("keywords", data)
        self.assertEqual(len(data["keywords"]), 9)
        self.assertIn("custom_operators", data)
        self.assertIn("//", data["custom_operators"])


@override_settings(COMPILER_ALLOW_UNAUTHENTICATED=True)
class CompilerEndpointFunctionalTests(APITestCase):
    """Verifies functional request/response schemas and behavior of /api/compile/."""

    def setUp(self):
        self.compile_url = reverse("compile")

    def test_compile_valid_code_success(self):
        code = "digit a := 10;\nflex(a);"
        response = self.client.post(self.compile_url, {"source_code": code}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertTrue(data["success"])
        self.assertEqual(data["status"], "compiled")
        self.assertEqual(data["stage_reached"], 3)
        self.assertIsNone(data["stage_failed"])
        self.assertIsInstance(data["tokens"], list)
        self.assertGreater(len(data["tokens"]), 0)
        self.assertIsInstance(data["ast"], list)
        self.assertIsInstance(data["symbol_table"], dict)
        self.assertIn("a", data["symbol_table"])
        self.assertEqual(data["symbol_table"]["a"]["type"], "digit")
        self.assertEqual(len(data["errors"]), 0)
        self.assertIn("ast_ascii", data)
        self.assertGreater(len(data["ast_ascii"]), 0)

    def test_compile_empty_code_boundary(self):
        """Empty string compiles into an empty program successfully."""
        response = self.client.post(self.compile_url, {"source_code": ""}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertTrue(data["success"])
        self.assertEqual(len(data["ast"]), 0)
        self.assertEqual(len(data["errors"]), 0)

    def test_compile_lexical_error(self):
        code = "digit a := @42;"
        response = self.client.post(self.compile_url, {"source_code": code}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertFalse(data["success"])
        self.assertEqual(data["status"], "error")
        self.assertEqual(data["stage_failed"], "lexical")
        self.assertEqual(data["stage_reached"], 0)
        self.assertEqual(len(data["errors"]), 1)
        self.assertEqual(data["errors"][0]["stage"], "lexical")
        self.assertIn("unknown character '@'", data["errors"][0]["message"])

    def test_compile_syntax_error(self):
        code = "digit a := ;"
        response = self.client.post(self.compile_url, {"source_code": code}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertFalse(data["success"])
        self.assertEqual(data["status"], "error")
        self.assertEqual(data["stage_failed"], "syntax")
        self.assertEqual(data["stage_reached"], 1)
        self.assertEqual(len(data["errors"]), 1)
        self.assertEqual(data["errors"][0]["stage"], "syntax")

    def test_compile_semantic_error(self):
        code = "flex(undeclared_var);"
        response = self.client.post(self.compile_url, {"source_code": code}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertFalse(data["success"])
        self.assertEqual(data["status"], "error")
        self.assertEqual(data["stage_failed"], "semantic")
        self.assertEqual(data["stage_reached"], 2)
        self.assertEqual(len(data["errors"]), 1)
        self.assertEqual(data["errors"][0]["stage"], "semantic")
        self.assertIn("variable 'undeclared_var' is not declared", data["errors"][0]["message"])

    def test_compile_missing_source_code_returns_bad_request(self):
        response = self.client.post(self.compile_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)


class LexerEngineTests(TestCase):
    """Direct tests for the Lexer engine implementation."""

    def test_all_nine_keywords(self):
        code = "digit verify textbody when otherwise until flex yes no"
        toks = tokenize(code)
        kinds = [t.type for t in toks if t.type != "EOF"]
        expected = ["INT", "BOOL", "STRING", "IF", "ELSE", "WHILE", "PRINT", "TRUE", "FALSE"]
        self.assertEqual(kinds, expected)

    def test_all_custom_operators(self):
        code = ":= +++ --- // ** ?= >> << ~"
        toks = tokenize(code)
        lexemes = [t.lexeme for t in toks if t.type != "EOF"]
        expected = [":=", "+++", "---", "//", "**", "?=", ">>", "<<", "~"]
        self.assertEqual(lexemes, expected)

    def test_slash_slash_is_integer_division_not_comment(self):
        code = "digit result := 100 // 4;"
        toks = tokenize(code)
        lexemes = [t.lexeme for t in toks if t.type != "EOF"]
        self.assertIn("//", lexemes)
        self.assertIn("4", lexemes)
        self.assertEqual(lexemes, ["digit", "result", ":=", "100", "//", "4", ";"])

    def test_line_and_column_coordinates(self):
        code = "digit a := 10;\nflex(a);"
        toks = tokenize(code)
        # Check first line coordinates
        self.assertEqual((toks[0].type, toks[0].line, toks[0].column), ("INT", 1, 1))
        self.assertEqual((toks[1].type, toks[1].line, toks[1].column), ("ID", 1, 7))
        self.assertEqual((toks[2].type, toks[2].line, toks[2].column), (":=", 1, 9))
        self.assertEqual((toks[3].type, toks[3].line, toks[3].column), ("NUM", 1, 12))
        self.assertEqual((toks[4].type, toks[4].line, toks[4].column), (";", 1, 14))
        # Check second line coordinates
        self.assertEqual((toks[5].type, toks[5].line, toks[5].column), ("PRINT", 2, 1))
        self.assertEqual((toks[6].type, toks[6].line, toks[6].column), ("(", 2, 5))
        self.assertEqual((toks[7].type, toks[7].line, toks[7].column), ("ID", 2, 6))
        self.assertEqual((toks[8].type, toks[8].line, toks[8].column), (")", 2, 7))
        self.assertEqual((toks[9].type, toks[9].line, toks[9].column), (";", 2, 8))
        self.assertEqual((toks[10].type, toks[10].line, toks[10].column), ("EOF", 2, 9))

    def test_token_tuple_unpacking_and_indexing(self):
        tok = Token("NUM", "42", 5, 10)
        # Tuple unpacking
        kind, lexeme, line = tok
        self.assertEqual(kind, "NUM")
        self.assertEqual(lexeme, "42")
        self.assertEqual(line, 5)
        # Indexing
        self.assertEqual(tok[0], "NUM")
        self.assertEqual(tok[1], "42")
        self.assertEqual(tok[2], 5)
        self.assertEqual(tok[3], 10)
        # Dictionary conversion
        d = tok.to_dict()
        self.assertEqual(d, {"type": "NUM", "lexeme": "42", "line": 5, "column": 10})

    def test_lexical_error_raises_with_correct_coordinates(self):
        code = "digit a := 5;\ndigit bad := #99;"
        with self.assertRaises(LexicalError) as ctx:
            tokenize(code)
        err = ctx.exception
        self.assertEqual(err.line, 2)
        self.assertEqual(err.column, 14)
        self.assertIn("unknown character '#'", str(err))


class ParserEngineTests(TestCase):
    """Direct tests for the Recursive Descent Parser."""

    def test_operator_precedence_power_over_addition(self):
        code = "digit res := a +++ b ** 2;"
        ast = parse(tokenize(code))
        self.assertEqual(len(ast), 1)
        decl = ast[0]
        self.assertEqual(decl.type, "decl")
        init = decl.init
        # Top-level binop is '+++'
        self.assertEqual(init.op, "+++")
        self.assertEqual(init.left.type, "id")
        # Right operand is 'b ** 2'
        self.assertEqual(init.right.op, "**")

    def test_parser_syntax_error_missing_semicolon(self):
        code = "digit a := 10\nflex(a);"
        with self.assertRaises(ParseError) as ctx:
            parse(tokenize(code))
        err = ctx.exception
        self.assertIn("expected ';' but found 'flex'", str(err))

    def test_parser_syntax_error_invalid_statement_start(self):
        code = ":= 42;"
        with self.assertRaises(ParseError) as ctx:
            parse(tokenize(code))
        err = ctx.exception
        self.assertIn("a statement cannot start with ':='", str(err))

    def test_parser_syntax_error_expected_expression(self):
        code = "digit a := ;"
        with self.assertRaises(ParseError) as ctx:
            parse(tokenize(code))
        err = ctx.exception
        self.assertIn("expected an expression but found ';'", str(err))


class ASTNodesTests(TestCase):
    """Direct tests for AST dataclasses and thread-safe ASCII rendering."""

    def test_node_tuple_compatibility_and_dict(self):
        num = NumNode("10", 1)
        self.assertEqual(num[0], "num")
        self.assertEqual(num.value, "10")
        self.assertEqual(num.to_dict(), {"type": "num", "value": "10", "line": 1})

        decl = DeclNode("digit", "x", num, 1)
        self.assertEqual(decl[0], "decl")
        self.assertEqual(decl.var_type, "digit")
        self.assertEqual(decl.name, "x")
        self.assertEqual(decl.init, num)
        self.assertEqual(decl.line, 1)
        self.assertEqual(decl._as_tuple(), ("decl", "digit", "x", num, 1))

        d = decl.to_dict()
        self.assertEqual(d["type"], "decl")
        self.assertEqual(d["var_type"], "digit")
        self.assertEqual(d["name"], "x")

    def test_render_ast_ascii_does_not_modify_stdout(self):
        code = "digit a := 5;\nflex(a);"
        ast = parse(tokenize(code))
        original_stdout = sys.stdout

        ascii_tree = render_ast_ascii(ast)
        self.assertIs(sys.stdout, original_stdout)
        self.assertIn("Declaration: digit a", ascii_tree)
        self.assertIn("Print", ascii_tree)


class SemanticAnalyzerEngineTests(TestCase):
    """Direct tests verifying all 6 formal course rules and cascade suppression."""

    def test_rule1_duplicate_declaration(self):
        code = "digit a := 1;\ndigit a := 2;"
        ast = parse(tokenize(code))
        sa = analyze(ast)
        self.assertEqual(len(sa.errors), 1)
        self.assertIn("variable 'a' is already declared at line 1", sa.errors[0])
        self.assertEqual(sa.diagnostics[0]["rule"], "rule1_duplicate_declaration")

    def test_rule2_undeclared_variable_assignment(self):
        code = "x := 10;"
        ast = parse(tokenize(code))
        sa = analyze(ast)
        self.assertEqual(len(sa.errors), 1)
        self.assertIn("variable 'x' is not declared", sa.errors[0])
        self.assertEqual(sa.diagnostics[0]["rule"], "rule2_undeclared_variable")

    def test_rule2_undeclared_variable_in_expression(self):
        code = "flex(unknown_var);"
        ast = parse(tokenize(code))
        sa = analyze(ast)
        self.assertEqual(len(sa.errors), 1)
        self.assertIn("variable 'unknown_var' is not declared", sa.errors[0])
        self.assertEqual(sa.diagnostics[0]["rule"], "rule2_undeclared_variable")

    def test_rule3_assignment_type_mismatch(self):
        code = "verify ok := 3;"
        ast = parse(tokenize(code))
        sa = analyze(ast)
        self.assertEqual(len(sa.errors), 1)
        self.assertIn("cannot store digit value in verify variable 'ok'", sa.errors[0])
        self.assertEqual(sa.diagnostics[0]["rule"], "rule3_type_mismatch")

    def test_rule4_arithmetic_type_mismatch(self):
        code = 'digit a := 5;\ntextbody name := "ali";\ndigit c := a +++ name;'
        ast = parse(tokenize(code))
        sa = analyze(ast)
        self.assertEqual(len(sa.errors), 1)
        self.assertIn("operator '+++' needs digit operands but got digit and textbody", sa.errors[0])
        self.assertEqual(sa.diagnostics[0]["rule"], "rule4_arithmetic_type_mismatch")

    def test_rule4_relational_type_mismatch(self):
        code = 'digit a := 5;\ntextbody name := "ali";\nverify v := a >> name;'
        ast = parse(tokenize(code))
        sa = analyze(ast)
        self.assertEqual(len(sa.errors), 1)
        self.assertIn("operator '>>' needs digit operands but got digit and textbody", sa.errors[0])
        self.assertEqual(sa.diagnostics[0]["rule"], "rule4_arithmetic_type_mismatch")

    def test_rule5_equality_type_mismatch(self):
        code = 'digit a := 5;\nverify res := a ?= "ali";'
        ast = parse(tokenize(code))
        sa = analyze(ast)
        self.assertEqual(len(sa.errors), 1)
        self.assertIn("operator '?=' cannot compare digit with textbody", sa.errors[0])
        self.assertEqual(sa.diagnostics[0]["rule"], "rule5_equality_type_mismatch")

    def test_rule6_condition_type_mismatch(self):
        code = "digit a := 5;\nwhen (a) {\n    flex(a);\n}"
        ast = parse(tokenize(code))
        sa = analyze(ast)
        self.assertEqual(len(sa.errors), 1)
        self.assertIn("condition must be verify but it is digit", sa.errors[0])
        self.assertEqual(sa.diagnostics[0]["rule"], "rule6_condition_type_mismatch")

    def test_cascade_suppression(self):
        """Undeclared variable in arithmetic expression should only report Rule 2, not cascade into Rule 4."""
        code = "digit a := 5 +++ unknown_var;"
        ast = parse(tokenize(code))
        sa = analyze(ast)
        self.assertEqual(len(sa.errors), 1)
        self.assertIn("variable 'unknown_var' is not declared", sa.errors[0])
        # Did not cascade into 'operator +++ needs digit operands'
        self.assertFalse(any("needs digit operands" in err for err in sa.errors))
