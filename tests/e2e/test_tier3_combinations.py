"""
Tier 3: Cross-Feature Combinations Test Suite.
Verifies pairwise and multi-feature interactions:
- Loops containing conditionals (until + when/otherwise)
- Conditionals containing loops (when + until)
- Complex nested arithmetic inside relational conditions
- Heterogeneous type interactions (digit, verify, textbody in concert)
- State accumulators across iterations
- Flat-scoping interaction across inner and outer blocks
- Multi-variable equality checks (?= on strings, digits, booleans)
"""

import unittest
from .compiler_adapter import compile_wrh


class TestTier3Combinations(unittest.TestCase):
    """Tier 3: Cross-feature pairwise interactions."""

    def test_loop_containing_conditional_branches(self):
        """Pairwise: 'until' loop containing 'when'/'otherwise' branching."""
        code = """
digit count := 0;
digit evens := 0;
digit odds := 0;
until (count << 10) {
    when (count ?= 5) {
        evens := evens +++ 1;
    } otherwise {
        odds := odds +++ 1;
    }
    count := count +++ 1;
}
flex(evens);
flex(odds);
"""
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["stage_reached"], 3)
        self.assertIn("evens", res["symbol_table"])
        self.assertIn("odds", res["symbol_table"])

    def test_conditional_containing_loops(self):
        """Pairwise: 'when' and 'otherwise' blocks each enclosing 'until' loops."""
        code = """
verify mode_fast := yes;
digit sum := 0;
digit i := 0;
when (mode_fast) {
    until (i << 5) {
        sum := sum +++ 2;
        i := i +++ 1;
    }
} otherwise {
    until (i << 10) {
        sum := sum +++ 1;
        i := i +++ 1;
    }
}
flex(sum);
"""
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["symbol_table"]["sum"]["type"], "digit")

    def test_nested_arithmetic_in_relational_condition(self):
        """Pairwise: Complex compound arithmetic expressions on both sides of relop."""
        code = """
digit a := 5;
digit b := 10;
digit c := 20;
verify passes := no;
when ((a +++ b ** 2) >> (c // 2 +++ 15)) {
    passes := yes;
}
flex(passes);
"""
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["symbol_table"]["passes"]["type"], "verify")

    def test_heterogeneous_types_multi_variable_coordination(self):
        """Pairwise: digit, verify, and textbody collaborating in one workflow."""
        code = """
digit score := 85;
verify is_honor := no;
textbody grade_report := "Pending";

when (score >> 80) {
    is_honor := yes;
    grade_report := "Honor Roll";
} otherwise {
    grade_report := "Standard";
}

flex(score);
flex(is_honor);
flex(grade_report);
"""
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertEqual(res["symbol_table"]["score"]["type"], "digit")
        self.assertEqual(res["symbol_table"]["is_honor"]["type"], "verify")
        self.assertEqual(res["symbol_table"]["grade_report"]["type"], "textbody")

    def test_dual_accumulators_in_loop(self):
        """Pairwise: Synchronous updates to addition and multiplication accumulators."""
        code = """
digit step := 1;
digit total_sum := 0;
digit total_prod := 1;
until (step << 6) {
    total_sum := total_sum +++ step;
    total_prod := total_prod ** step;
    step := step +++ 1;
}
flex(total_sum);
flex(total_prod);
"""
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")

    def test_flat_scope_variable_declared_in_block_accessible_outside(self):
        """Flat scope: Variable declared inside 'when' block is accessible in outer scope."""
        code = """
when (yes) {
    digit inner_val := 42;
}
flex(inner_val);
"""
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")
        self.assertIn("inner_val", res["symbol_table"])

    def test_flat_scope_duplicate_declaration_in_blocks_rejected(self):
        """Flat scope: Declaring same variable name in 'when' and 'otherwise' violates Rule 1."""
        code = """
when (yes) {
    digit shared := 1;
} otherwise {
    digit shared := 2;
}
"""
        res = compile_wrh(code)
        self.assertFalse(res["success"])
        self.assertEqual(res["stage_failed"], "semantic")
        self.assertEqual(res["errors"][0]["rule"], "rule1_duplicate_declaration")
        self.assertIn("variable 'shared' is already declared", res["errors"][0]["message"])

    def test_string_equality_in_conditional(self):
        """String equality comparison '?=' used as condition inside 'when'."""
        code = """
textbody current_state := "INIT";
verify is_ready := no;
when (current_state ?= "INIT") {
    is_ready := yes;
    current_state := "RUNNING";
}
flex(current_state);
flex(is_ready);
"""
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")

    def test_boolean_equality_in_conditional(self):
        """Boolean equality comparison '?=' and inequality '~' with verify variables."""
        code = """
verify flag_a := yes;
verify flag_b := no;
verify match := flag_a ?= flag_b;
verify diff := flag_a ~ flag_b;
flex(match);
flex(diff);
"""
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")

    def test_loop_condition_with_boolean_recomputed_each_iteration(self):
        """Loop condition evaluates verify variable updated inside the loop body."""
        code = """
digit iter := 0;
verify keep_going := yes;
until (keep_going) {
    iter := iter +++ 1;
    when (iter ?= 5) {
        keep_going := no;
    }
}
flex(iter);
"""
        res = compile_wrh(code)
        self.assertTrue(res["success"], f"Failed: {res.get('errors')}")


if __name__ == "__main__":
    unittest.main()
