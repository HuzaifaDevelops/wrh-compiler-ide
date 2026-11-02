"""
Tier 4: Real-World Scenarios Test Suite.
Verifies complete, production-grade programs and authoritative lab test files:
- Factorial calculation program
- Fibonacci sequence generator
- Prime number checker (using division/multiplication modulo simulation)
- String greeting and state formatter
- Authoritative reference lab test: valid.txt
- Authoritative reference lab test: semantic_error.txt (verifying all 6 rules)
- Authoritative reference lab tests: syntax_error_*.txt
"""

import unittest
from pathlib import Path
from .compiler_adapter import compile_wrh, PROJECT_ROOT

LABS_DIR = PROJECT_ROOT / "Labs" / "Lab Project"


class TestTier4Scenarios(unittest.TestCase):
    """Tier 4: Complete real-world programs and canonical lab benchmarks."""

    def test_scenario_factorial_program(self):
        """Scenario: Complete program calculating factorial (5!)."""
        code = """
digit n := 5;
digit fact := 1;
digit counter := 1;

until (counter << (n +++ 1)) {
    fact := fact ** counter;
    counter := counter +++ 1;
}

textbody label := "Factorial calculated";
flex(label);
flex(fact);
"""
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["symbol_table"]["fact"]["type"], "digit")
        self.assertEqual(res["symbol_table"]["counter"]["type"], "digit")
        self.assertEqual(res["symbol_table"]["label"]["type"], "textbody")

    def test_scenario_fibonacci_series_generator(self):
        """Scenario: Complete program generating Fibonacci terms."""
        code = """
digit a := 0;
digit b := 1;
digit temp := 0;
digit count := 0;
digit limit := 8;

until (count << limit) {
    flex(a);
    temp := a +++ b;
    a := b;
    b := temp;
    count := count +++ 1;
}

textbody done_msg := "Fibonacci series completed";
flex(done_msg);
"""
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertIn("a", res["symbol_table"])
        self.assertIn("b", res["symbol_table"])
        self.assertIn("temp", res["symbol_table"])
        self.assertIn("count", res["symbol_table"])

    def test_scenario_prime_checker_program(self):
        """
        Scenario: Complete prime checking program.
        WRH has no '%' operator, so divisibility is verified via (n // d) ** d ?= n.
        """
        code = """
digit n := 17;
digit d := 2;
verify is_prime := yes;

until (d << n) {
    digit product := (n // d) ** d;
    when (product ?= n) {
        is_prime := no;
    }
    d := d +++ 1;
}

when (is_prime) {
    textbody prime_msg := "Number is prime";
    flex(prime_msg);
} otherwise {
    textbody comp_msg := "Number is composite";
    flex(comp_msg);
}
"""
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertIn("is_prime", res["symbol_table"])
        self.assertEqual(res["symbol_table"]["is_prime"]["type"], "verify")

    def test_scenario_string_greeting_formatter(self):
        """Scenario: Formats user role, greetings, and active flags."""
        code = """
textbody user_role := "Admin";
textbody greeting := "Hello";
verify is_authenticated := yes;
verify has_access := no;

when (is_authenticated ?= yes) {
    when (user_role ?= "Admin") {
        has_access := yes;
        greeting := "Welcome Administrator";
    } otherwise {
        greeting := "Welcome Guest";
    }
}

flex(greeting);
flex(has_access);
"""
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["symbol_table"]["greeting"]["type"], "textbody")
        self.assertEqual(res["symbol_table"]["has_access"]["type"], "verify")

    def test_scenario_canonical_valid_file(self):
        """Authoritative Lab Test: Validates exact source of 'Labs/Lab Project/valid.txt'."""
        valid_file = LABS_DIR / "valid.txt"
        self.assertTrue(valid_file.exists(), f"valid.txt missing at {valid_file}")
        with open(valid_file, "r") as f:
            code = f.read()

        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Compilation failed: {res.get('errors')}")
        self.assertEqual(res["stage_reached"], 3)
        self.assertIsNone(res["stage_failed"])
        self.assertEqual(len(res["errors"]), 0)

        # Expected 5 identifiers in symbol table
        expected_symbols = {
            "a": "digit",
            "b": "digit",
            "sum": "digit",
            "big": "verify",
            "msg": "textbody",
        }
        for name, typ in expected_symbols.items():
            self.assertIn(name, res["symbol_table"])
            self.assertEqual(res["symbol_table"][name]["type"], typ)

    def test_scenario_canonical_semantic_error_file(self):
        """
        Authoritative Lab Test: Validates exact source of 'Labs/Lab Project/semantic_error.txt'.
        Must catch all 6 semantic rules in a single pass.
        """
        err_file = LABS_DIR / "semantic_error.txt"
        self.assertTrue(err_file.exists(), f"semantic_error.txt missing at {err_file}")
        with open(err_file, "r") as f:
            code = f.read()

        res = compile_wrh(code)
        self.assertFalse(res["success"])
        self.assertEqual(res["stage_failed"], "semantic")
        self.assertEqual(res["stage_reached"], 2)

        # Must report exactly 6 semantic errors
        errors = res["errors"]
        self.assertEqual(len(errors), 6, f"Expected 6 errors, got {len(errors)}: {errors}")

        # Rule 1: Duplicate declaration of 'a' at line 2
        r1 = [e for e in errors if "variable 'a' is already declared" in e["message"]]
        self.assertEqual(len(r1), 1)
        self.assertEqual(r1[0]["line"], 2)

        # Rule 3: Type mismatch assigning digit 3 to verify variable 'ok' at line 4
        r3 = [e for e in errors if "cannot store digit value in verify variable 'ok'" in e["message"]]
        self.assertEqual(len(r3), 1)
        self.assertEqual(r3[0]["line"], 4)

        # Rule 2: Undeclared variable 'b' at line 5
        r2 = [e for e in errors if "variable 'b' is not declared" in e["message"]]
        self.assertEqual(len(r2), 1)
        self.assertEqual(r2[0]["line"], 5)

        # Rule 4: Operator '+++' with textbody operand at line 6
        r4 = [e for e in errors if "operator '+++' needs digit operands" in e["message"]]
        self.assertEqual(len(r4), 1)
        self.assertEqual(r4[0]["line"], 6)

        # Rule 5: Operator '?=' comparing digit with textbody at line 7
        r5 = [e for e in errors if "operator '?=' cannot compare digit with textbody" in e["message"]]
        self.assertEqual(len(r5), 1)
        self.assertEqual(r5[0]["line"], 7)

        # Rule 6: Condition must be verify but got digit at line 8
        r6 = [e for e in errors if "condition must be verify but it is digit" in e["message"]]
        self.assertEqual(len(r6), 1)
        self.assertEqual(r6[0]["line"], 8)

    def test_scenario_canonical_syntax_error_expr(self):
        """Authoritative Lab Test: syntax_error_expr.txt."""
        err_file = LABS_DIR / "syntax_error_expr.txt"
        self.assertTrue(err_file.exists())
        with open(err_file, "r") as f:
            code = f.read()

        res = compile_wrh(code)
        self.assertFalse(res["success"])
        self.assertEqual(res["stage_failed"], "syntax")
        self.assertEqual(res["errors"][0]["line"], 3)
        self.assertIn("expected an expression but found ';'", res["errors"][0]["message"])

    def test_scenario_canonical_syntax_error_paren(self):
        """Authoritative Lab Test: syntax_error_paren.txt."""
        err_file = LABS_DIR / "syntax_error_paren.txt"
        self.assertTrue(err_file.exists())
        with open(err_file, "r") as f:
            code = f.read()

        res = compile_wrh(code)
        self.assertFalse(res["success"])
        self.assertEqual(res["stage_failed"], "syntax")
        self.assertEqual(res["errors"][0]["line"], 3)
        self.assertIn("expected ')' but found '{'", res["errors"][0]["message"])

    def test_scenario_canonical_syntax_error_semicolon(self):
        """Authoritative Lab Test: syntax_error_semicolon.txt."""
        err_file = LABS_DIR / "syntax_error_semicolon.txt"
        self.assertTrue(err_file.exists())
        with open(err_file, "r") as f:
            code = f.read()

        res = compile_wrh(code)
        self.assertFalse(res["success"])
        self.assertEqual(res["stage_failed"], "syntax")
        self.assertEqual(res["errors"][0]["line"], 3)
        self.assertIn("expected ';' but found 'a'", res["errors"][0]["message"])

    def test_scenario_canonical_syntax_error_start(self):
        """Authoritative Lab Test: syntax_error_start.txt."""
        err_file = LABS_DIR / "syntax_error_start.txt"
        self.assertTrue(err_file.exists())
        with open(err_file, "r") as f:
            code = f.read()

        res = compile_wrh(code)
        self.assertFalse(res["success"])
        self.assertEqual(res["stage_failed"], "syntax")
        self.assertEqual(res["errors"][0]["line"], 2)
        self.assertIn("a statement cannot start with ':='", res["errors"][0]["message"])


if __name__ == "__main__":
    unittest.main()
