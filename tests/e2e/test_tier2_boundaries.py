"""
Tier 2: Boundary & Corner Cases Test Suite.
Verifies compiler behavior on edge conditions, boundary limits, and malformed constructs:
- Empty & whitespace-only inputs
- Zero & subtraction-based negative values
- Division by zero grammar parsing
- Extreme expression chaining & left-associativity
- Deeply nested blocks (nested when and until)
- Keyword-prefixed and underscore identifiers
- Clean syntax and lexical error boundaries (rejections)
"""

import unittest
from .compiler_adapter import compile_wrh


class TestTier2Boundaries(unittest.TestCase):
    """Tier 2: Boundary conditions and adversarial edge cases."""

    # --------------------------------------------------------------------------
    # 1. EMPTY & WHITESPACE INPUTS
    # --------------------------------------------------------------------------

    def test_empty_string_input(self):
        """Empty input should compile successfully to an empty program."""
        res = compile_wrh("")
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(len(res["ast"]), 0)
        self.assertEqual(len(res["symbol_table"]), 0)
        self.assertEqual(len(res["errors"]), 0)

    def test_whitespace_and_newlines_only(self):
        """Input containing only spaces, tabs, and newlines should produce empty program."""
        code = "   \n\t  \r\n   \n\n\t\t  "
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(len(res["ast"]), 0)
        self.assertEqual(len(res["symbol_table"]), 0)

    def test_blank_lines_preserves_correct_line_tracking(self):
        """Multiple blank lines between statements must maintain accurate line tracking."""
        code = "\n\n\ndigit a := 10;\n\n\n\nflex(a);\n\n"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        # 'a' is declared on line 4
        self.assertEqual(res["symbol_table"]["a"]["line"], 4)

    # --------------------------------------------------------------------------
    # 2. ZERO & NEGATIVE VALUE HANDLING
    # --------------------------------------------------------------------------

    def test_division_by_zero_syntax_and_static_types(self):
        """Division by zero is syntactically valid and satisfies static type checks."""
        code = "digit a := 10 // 0;\nflex(a);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertIn("a", res["symbol_table"])

    def test_negative_values_via_subtraction(self):
        """WRH has no unary minus; negative values are represented via subtraction (0 --- X)."""
        code = "digit neg := 0 --- 100;\nflex(neg);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["symbol_table"]["neg"]["type"], "digit")

    def test_zero_operands_in_all_arithmetic(self):
        """Zero can be used freely across all arithmetic operators."""
        code = "digit res := 0 +++ 0 --- 0 ** 0 // 1;\nflex(res);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")

    # --------------------------------------------------------------------------
    # 3. EXPRESSION CHAINING & PRECEDENCE BOUNDARIES
    # --------------------------------------------------------------------------

    def test_long_arithmetic_chain_left_associative(self):
        """Long sequence of additions and subtractions tests left-associative tree depth."""
        code = "digit total := 1 +++ 2 --- 3 +++ 4 --- 5 +++ 6 --- 7 +++ 8;\nflex(total);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["stage_reached"], 3)

    def test_chained_multiplications_and_divisions(self):
        """Sequence of term operators ** and // tests multiplicative associativity."""
        code = "digit result := 2 ** 3 ** 4 // 2 // 3;\nflex(result);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")

    def test_deeply_nested_parenthesized_expressions(self):
        """Arbitrarily deep parentheses in arithmetic expressions."""
        code = "digit val := (((((10 +++ 5) ** 2) --- 4) // 3) +++ 1);\nflex(val);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")

    # --------------------------------------------------------------------------
    # 4. DEEP BLOCK NESTING
    # --------------------------------------------------------------------------

    def test_deeply_nested_when_blocks(self):
        """Conditionals nested 4 levels deep."""
        code = """
digit level := 0;
when (yes) {
    when (yes) {
        when (yes) {
            when (yes) {
                level := 4;
            }
        }
    }
}
flex(level);
"""
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["symbol_table"]["level"]["type"], "digit")

    def test_deeply_nested_until_loops(self):
        """Loops nested 3 levels deep."""
        code = """
digit i := 0;
digit j := 0;
digit k := 0;
until (i << 2) {
    until (j << 2) {
        until (k << 2) {
            k := k +++ 1;
        }
        j := j +++ 1;
    }
    i := i +++ 1;
}
flex(k);
"""
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")

    # --------------------------------------------------------------------------
    # 5. STRING & IDENTIFIER BOUNDARIES
    # --------------------------------------------------------------------------

    def test_empty_string_literal(self):
        """Empty string literal '\"\"' is valid textbody."""
        code = 'textbody empty_str := "";\nflex(empty_str);'
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertIn("empty_str", res["symbol_table"])

    def test_string_with_special_characters_and_symbols(self):
        """String literals containing arbitrary punctuation and escape-like characters."""
        code = 'textbody spec := "!@#$%^&*()_+-=~[]{}:;,.<>?";\nflex(spec);'
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")

    def test_identifier_with_keyword_prefixes(self):
        """Identifiers containing keyword substrings must be lexed as ID, not KEYWORD."""
        code = """
digit digit_count := 10;
verify verify_status := yes;
textbody textbody_note := "info";
digit when_branch := 1;
digit until_iter := 2;
digit flex_out := 3;
flex(digit_count);
"""
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertIn("digit_count", res["symbol_table"])
        self.assertIn("verify_status", res["symbol_table"])
        self.assertIn("textbody_note", res["symbol_table"])
        self.assertIn("when_branch", res["symbol_table"])

    def test_identifier_starting_with_underscore(self):
        """Identifiers starting with underscores are valid."""
        code = "digit _val := 99;\ndigit _ := 1;\nflex(_val +++ _);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertIn("_val", res["symbol_table"])
        self.assertIn("_", res["symbol_table"])

    # --------------------------------------------------------------------------
    # 6. ADVERSARIAL REJECTIONS (Ensuring proper error halts)
    # --------------------------------------------------------------------------

    def test_reject_unary_minus(self):
        """Unary minus ('--- 5') is invalid in WRH-Lang and must raise Syntax Error."""
        code = "digit a := --- 5;"
        res = compile_wrh(code)
        self.assertFalse(res["success"])
        self.assertEqual(res["stage_failed"], "syntax")
        self.assertIn("expected an expression but found '---'", res["errors"][0]["message"])

    def test_reject_floating_point_literal(self):
        """WRH has no float type; '.' must trigger Lexical Error."""
        code = "digit a := 3.14;"
        res = compile_wrh(code)
        self.assertFalse(res["success"])
        self.assertEqual(res["stage_failed"], "lexical")
        self.assertIn("unknown character '.'", res["errors"][0]["message"])

    def test_reject_hash_comment(self):
        """WRH has no comment syntax; '#' must trigger Lexical Error."""
        code = "# This is a comment\ndigit a := 10;"
        res = compile_wrh(code)
        self.assertFalse(res["success"])
        self.assertEqual(res["stage_failed"], "lexical")
        self.assertIn("unknown character '#'", res["errors"][0]["message"])

    def test_reject_semicolon_after_block(self):
        """A semicolon after a block closing brace '};' is invalid syntax."""
        code = "when (yes) {\n    flex(1);\n};"
        res = compile_wrh(code)
        self.assertFalse(res["success"])
        self.assertEqual(res["stage_failed"], "syntax")
        self.assertIn("a statement cannot start with ';'", res["errors"][0]["message"])

    def test_reject_chained_relational_operators(self):
        """Relational operators cannot be chained without parentheses (a >> b >> c)."""
        code = "verify v := 5 >> 3 >> 1;"
        res = compile_wrh(code)
        self.assertFalse(res["success"])
        self.assertEqual(res["stage_failed"], "syntax")

    def test_reject_empty_flex_argument(self):
        """flex() with empty argument must trigger Syntax Error."""
        code = "flex();"
        res = compile_wrh(code)
        self.assertFalse(res["success"])
        self.assertEqual(res["stage_failed"], "syntax")
        self.assertIn("expected an expression but found ')'", res["errors"][0]["message"])


if __name__ == "__main__":
    unittest.main()
