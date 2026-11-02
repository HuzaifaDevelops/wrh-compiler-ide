"""
Tier 1: Feature Coverage Test Suite.
Verifies fundamental language features with >=5 test cases per feature:
- Data Types (digit, verify, textbody)
- Variables & Assignments
- Arithmetic Operators (+++, ---, **, //)
- Relational & Equality Operators (>>, <<, ?=, ~)
- Conditional Statements (when, otherwise)
- Loops (until)
- Output Statements (flex)
"""

import unittest
from .compiler_adapter import compile_wrh


class TestTier1Features(unittest.TestCase):
    """Tier 1: Comprehensive feature coverage for WRH Language."""

    # --------------------------------------------------------------------------
    # 1. DATA TYPES (>=5 test cases)
    # --------------------------------------------------------------------------

    def test_type_digit_declaration_and_init(self):
        """Test 'digit' integer type declaration with initialization."""
        code = "digit count := 42;\nflex(count);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertIn("count", res["symbol_table"])
        self.assertEqual(res["symbol_table"]["count"]["type"], "digit")
        self.assertEqual(res["symbol_table"]["count"]["line"], 1)

    def test_type_verify_true_literal(self):
        """Test 'verify' boolean type with 'yes' literal."""
        code = "verify is_active := yes;\nflex(is_active);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertIn("is_active", res["symbol_table"])
        self.assertEqual(res["symbol_table"]["is_active"]["type"], "verify")

    def test_type_verify_false_literal(self):
        """Test 'verify' boolean type with 'no' literal."""
        code = "verify is_done := no;\nflex(is_done);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertIn("is_done", res["symbol_table"])
        self.assertEqual(res["symbol_table"]["is_done"]["type"], "verify")

    def test_type_textbody_string_literal(self):
        """Test 'textbody' string type with double-quoted string literal."""
        code = 'textbody title := "Compiler Design";\nflex(title);'
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertIn("title", res["symbol_table"])
        self.assertEqual(res["symbol_table"]["title"]["type"], "textbody")

    def test_type_uninitialized_declarations(self):
        """Test uninitialized declarations for all three types."""
        code = "digit a;\nverify b;\ntextbody c;"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["symbol_table"]["a"]["type"], "digit")
        self.assertEqual(res["symbol_table"]["b"]["type"], "verify")
        self.assertEqual(res["symbol_table"]["c"]["type"], "textbody")

    # --------------------------------------------------------------------------
    # 2. VARIABLES & ASSIGNMENTS (>=5 test cases)
    # --------------------------------------------------------------------------

    def test_var_declaration_without_initialization(self):
        """Test declaring a variable without initial value and assigning later."""
        code = "digit total;\ntotal := 100;\nflex(total);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertIn("total", res["symbol_table"])

    def test_var_reassignment(self):
        """Test assigning multiple times to the same variable."""
        code = "digit x := 1;\nx := 2;\nx := 3;\nflex(x);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(len(res["errors"]), 0)

    def test_var_read_in_subsequent_expressions(self):
        """Test reading a variable in expressions for other variables."""
        code = "digit a := 5;\ndigit b := a +++ 10;\nflex(b);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertIn("a", res["symbol_table"])
        self.assertIn("b", res["symbol_table"])

    def test_var_identifier_naming_with_underscores(self):
        """Test identifier naming containing underscores and digits."""
        code = "digit max_value_1 := 999;\nflex(max_value_1);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertIn("max_value_1", res["symbol_table"])

    def test_var_multiple_variables_sequential(self):
        """Test multiple variables declared and referenced sequentially."""
        code = "digit x := 10;\ndigit y := 20;\ndigit z := 30;\ndigit res := x +++ y +++ z;\nflex(res);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(len(res["symbol_table"]), 4)

    # --------------------------------------------------------------------------
    # 3. ARITHMETIC OPERATORS (+++, ---, **, //) (>=5 test cases)
    # --------------------------------------------------------------------------

    def test_arith_addition(self):
        """Test '+++' operator with integer operands."""
        code = "digit a := 10 +++ 20;\nflex(a);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["stage_reached"], 3)

    def test_arith_subtraction(self):
        """Test '---' operator with integer operands."""
        code = "digit a := 50 --- 20;\nflex(a);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["stage_reached"], 3)

    def test_arith_multiplication(self):
        """Test '**' operator with integer operands."""
        code = "digit a := 6 ** 7;\nflex(a);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["stage_reached"], 3)

    def test_arith_division(self):
        """Test '//' operator with integer operands (not comment delimiter)."""
        code = "digit a := 100 // 4;\nflex(a);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["stage_reached"], 3)

    def test_arith_precedence_multiplication_over_addition(self):
        """Test '**' binds tighter than '+++' (a +++ b ** c)."""
        code = "digit a := 2 +++ 3 ** 4;\nflex(a);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        # In AST, root of init should be +++ with left=2 and right=(3 ** 4)
        init_node = res["ast"][0][3]
        self.assertEqual(init_node[0], "binop")
        self.assertEqual(init_node[1], "+++")
        self.assertEqual(init_node[3][1], "**")

    def test_arith_parentheses_overriding_precedence(self):
        """Test parentheses (a +++ b) ** c override standard precedence."""
        code = "digit a := (2 +++ 3) ** 4;\nflex(a);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        init_node = res["ast"][0][3]
        self.assertEqual(init_node[0], "binop")
        self.assertEqual(init_node[1], "**")
        self.assertEqual(init_node[2][1], "+++")

    # --------------------------------------------------------------------------
    # 4. RELATIONAL OPERATORS (>>, <<, ?=, ~) (>=5 test cases)
    # --------------------------------------------------------------------------

    def test_relop_greater_than(self):
        """Test '>>' (greater than) operator returning verify."""
        code = "verify is_greater := 15 >> 10;\nflex(is_greater);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["symbol_table"]["is_greater"]["type"], "verify")

    def test_relop_less_than(self):
        """Test '<<' (less than) operator returning verify."""
        code = "verify is_less := 5 << 10;\nflex(is_less);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["symbol_table"]["is_less"]["type"], "verify")

    def test_relop_equality_digits(self):
        """Test '?=' (equality) operator with digit operands."""
        code = "verify is_eq := 42 ?= 42;\nflex(is_eq);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["symbol_table"]["is_eq"]["type"], "verify")

    def test_relop_equality_strings(self):
        """Test '?=' (equality) operator with textbody operands."""
        code = 'verify is_match := "wrh" ?= "wrh";\nflex(is_match);'
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["symbol_table"]["is_match"]["type"], "verify")

    def test_relop_inequality_booleans(self):
        """Test '~' (not equal) operator with verify operands."""
        code = "verify is_diff := yes ~ no;\nflex(is_diff);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["symbol_table"]["is_diff"]["type"], "verify")

    # --------------------------------------------------------------------------
    # 5. CONDITIONALS (when, otherwise) (>=5 test cases)
    # --------------------------------------------------------------------------

    def test_when_statement_single_branch(self):
        """Test single 'when' statement without otherwise."""
        code = "digit a := 5;\nwhen (a >> 3) {\n    a := 10;\n}\nflex(a);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["ast"][1][0], "if")
        self.assertIsNone(res["ast"][1][3])  # else block is None

    def test_when_otherwise_statement(self):
        """Test 'when' statement with 'otherwise' branch."""
        code = "digit x := 5;\ndigit status;\nwhen (x >> 10) {\n    status := 1;\n} otherwise {\n    status := 0;\n}\nflex(status);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertIsNotNone(res["ast"][2][3])  # else block present

    def test_when_condition_literal_yes(self):
        """Test 'when' conditional with literal 'yes'."""
        code = "digit flag := 0;\nwhen (yes) {\n    flag := 1;\n}\nflex(flag);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")

    def test_when_condition_literal_no(self):
        """Test 'when' conditional with literal 'no' and otherwise."""
        code = "digit flag := 0;\nwhen (no) {\n    flag := 1;\n} otherwise {\n    flag := 2;\n}\nflex(flag);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")

    def test_when_nested_conditionals(self):
        """Test nested 'when' conditionals."""
        code = """
digit a := 10;
digit b := 20;
digit outcome := 0;
when (a >> 5) {
    when (b >> 15) {
        outcome := 1;
    }
}
flex(outcome);
"""
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")

    # --------------------------------------------------------------------------
    # 6. LOOPS (until) (>=5 test cases)
    # --------------------------------------------------------------------------

    def test_until_basic_counter_loop(self):
        """Test basic 'until' while loop counting up."""
        code = """
digit i := 0;
until (i << 5) {
    i := i +++ 1;
}
flex(i);
"""
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["ast"][1][0], "while")

    def test_until_multi_statement_body(self):
        """Test 'until' loop with multiple body statements."""
        code = """
digit i := 0;
digit acc := 0;
until (i << 3) {
    i := i +++ 1;
    acc := acc +++ 10;
}
flex(acc);
"""
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        # Verify body contains 2 statements
        self.assertEqual(len(res["ast"][2][2]), 2)

    def test_until_decrement_loop(self):
        """Test 'until' loop counting down."""
        code = """
digit countdown := 10;
until (countdown >> 0) {
    countdown := countdown --- 1;
}
flex(countdown);
"""
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")

    def test_until_boolean_variable_guard(self):
        """Test 'until' loop controlled by a boolean verify variable."""
        code = """
verify keep_running := yes;
digit count := 0;
until (keep_running) {
    count := count +++ 1;
    keep_running := no;
}
flex(count);
"""
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")

    def test_until_with_accumulated_multiplication(self):
        """Test 'until' loop performing multiplicative accumulation."""
        code = """
digit n := 1;
digit power := 1;
until (n << 5) {
    power := power ** 2;
    n := n +++ 1;
}
flex(power);
"""
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")

    # --------------------------------------------------------------------------
    # 7. OUTPUT STATEMENTS (flex) (>=5 test cases)
    # --------------------------------------------------------------------------

    def test_flex_integer_literal(self):
        """Test 'flex' printing an integer literal."""
        code = "flex(123);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["ast"][0][0], "print")

    def test_flex_string_literal(self):
        """Test 'flex' printing a string literal."""
        code = 'flex("hello wrh");'
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["ast"][0][1][0], "str")

    def test_flex_boolean_literal(self):
        """Test 'flex' printing boolean literal 'yes'."""
        code = "flex(yes);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["ast"][0][1][0], "bool")

    def test_flex_identifier_variable(self):
        """Test 'flex' printing an identifier."""
        code = 'textbody msg := "welcome";\nflex(msg);'
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["ast"][1][1][0], "id")

    def test_flex_complex_arithmetic_expression(self):
        """Test 'flex' printing a complex arithmetic expression directly."""
        code = "digit a := 5;\ndigit b := 10;\nflex(a +++ b ** 2);"
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["ast"][2][1][0], "binop")


if __name__ == "__main__":
    unittest.main()
