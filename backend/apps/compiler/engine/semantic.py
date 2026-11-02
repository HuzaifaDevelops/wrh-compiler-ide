"""
Semantic Analyzer for WRH-Lang.
Enforces the 6 formal course rules:
- Rule 1: Duplicate declaration
- Rule 2: Undeclared variable
- Rule 3: Assignment type mismatch
- Rule 4: Arithmetic/ordering type check
- Rule 5: Equality operands type check
- Rule 6: Condition type check
Includes cascade suppression when sub-expressions fail validation.
"""

from typing import Any, Dict, List, Optional, Tuple, Union

from .symbol_table import SymbolTable


def classify_semantic_rule(msg: str) -> str:
    """Classifies a semantic error message into one of the 6 formal rules."""
    lower = msg.lower()
    if "already declared" in lower:
        return "rule1_duplicate_declaration"
    elif "not declared" in lower:
        return "rule2_undeclared_variable"
    elif "cannot store" in lower:
        return "rule3_type_mismatch"
    elif "needs digit operands" in lower:
        return "rule4_arithmetic_type_mismatch"
    elif "cannot compare" in lower:
        return "rule5_equality_type_mismatch"
    elif "condition must be verify" in lower:
        return "rule6_condition_type_mismatch"
    return "semantic_violation"


class SemanticAnalyzer:
    """
    Traverses AST, populates the SymbolTable, and collects semantic diagnostics.
    """

    def __init__(self):
        self.symbols = SymbolTable()
        # Formatted string error list (100% compatible with lab3 reference)
        self.errors: List[str] = []
        # Structured diagnostic list matching PROJECT.md interface contract
        self.diagnostics: List[Dict[str, Any]] = []

    def error(self, line: int, msg: str, rule: str = "", column: int = 1) -> None:
        """Record a semantic error string and structured diagnostic."""
        formatted = f"Semantic Error at line {line}: {msg}"
        self.errors.append(formatted)
        classified_rule = rule or classify_semantic_rule(msg)
        self.diagnostics.append({
            "stage": "semantic",
            "line": line,
            "column": column,
            "message": formatted,
            "rule": classified_rule,
        })

    def visit(self, stmts: Any) -> None:
        """Walk each statement in the AST and check semantic rules."""
        if not stmts:
            return

        for s in stmts:
            tag = s[0]

            # 1. Declaration: ('decl', var_type, name, init_expr, line)
            if tag == "decl":
                _, typ, name, init, line = s

                # Rule 1: A variable cannot be declared twice
                if name in self.symbols:
                    prev_line = self.symbols[name]["line"]
                    self.error(
                        line,
                        f"variable '{name}' is already declared at line {prev_line}",
                        rule="rule1_duplicate_declaration",
                    )
                else:
                    self.symbols.insert(name, typ, line)

                # Rule 3: Initial value assigned must match the variable type
                if init is not None:
                    got = self.type_of(init)
                    if got and got != typ:
                        self.error(
                            line,
                            f"cannot store {got} value in {typ} variable '{name}'",
                            rule="rule3_type_mismatch",
                        )

            # 2. Assignment: ('assign', name, value_expr, line)
            elif tag == "assign":
                _, name, value, line = s
                got = self.type_of(value)

                # Rule 2: A variable must be declared before use
                if name not in self.symbols:
                    self.error(
                        line,
                        f"variable '{name}' is not declared",
                        rule="rule2_undeclared_variable",
                    )
                # Rule 3: Assigned value must match the variable type
                elif got and got != self.symbols[name]["type"]:
                    expected_type = self.symbols[name]["type"]
                    self.error(
                        line,
                        f"cannot store {got} value in {expected_type} variable '{name}'",
                        rule="rule3_type_mismatch",
                    )

            # 3. If ('when') and While ('until') blocks
            elif tag in ("if", "while"):
                # Rule 6: Condition of if and loop must be boolean ('verify')
                got = self.type_of(s[1])
                line = s[-1]
                if got and got != "verify":
                    self.error(
                        line,
                        f"condition must be verify but it is {got}",
                        rule="rule6_condition_type_mismatch",
                    )

                # Visit body block(s)
                self.visit(s[2])
                if tag == "if" and s[3] is not None:
                    self.visit(s[3])

            # 4. Print ('flex') statement: ('print', expr, line)
            elif tag == "print":
                self.type_of(s[1])

    def type_of(self, e: Any) -> Optional[str]:
        """
        Determines the data type of an expression node.
        Returns 'digit', 'verify', 'textbody', or None if invalid/unknown.
        Implements cascade suppression: if a sub-expression errors (returns None),
        no cascading secondary errors are raised.
        """
        if e is None:
            return None

        tag = e[0]

        # Literals
        if tag == "num":
            return "digit"
        if tag == "str":
            return "textbody"
        if tag == "bool":
            return "verify"

        # Identifier lookup (Rule 2)
        if tag == "id":
            name, line = e[1], e[2]
            if name not in self.symbols:
                self.error(
                    line,
                    f"variable '{name}' is not declared",
                    rule="rule2_undeclared_variable",
                )
                return None
            return self.symbols[name]["type"]

        # Binary operation: ('binop', op, left, right, line)
        if tag == "binop":
            _, op, left, right, line = e
            lt = self.type_of(left)
            rt = self.type_of(right)

            # Cascade suppression: if either operand already failed, do not produce secondary error
            if lt is None or rt is None:
                return None

            # Rule 4: Arithmetic operators require integer ('digit') operands
            if op in ("+++", "---", "**", "//"):
                if lt != "digit" or rt != "digit":
                    self.error(
                        line,
                        f"operator '{op}' needs digit operands but got {lt} and {rt}",
                        rule="rule4_arithmetic_type_mismatch",
                    )
                    return None
                return "digit"

            # Rule 4 (cont.): Inequality relational operators require 'digit' operands
            if op in ("<<", ">>"):
                if lt != "digit" or rt != "digit":
                    self.error(
                        line,
                        f"operator '{op}' needs digit operands but got {lt} and {rt}",
                        rule="rule4_arithmetic_type_mismatch",
                    )
                    return None
                return "verify"

            # Rule 5: Equality operators ('?=' and '~') require operands of identical type
            if op in ("?=", "~"):
                if lt != rt:
                    self.error(
                        line,
                        f"operator '{op}' cannot compare {lt} with {rt}",
                        rule="rule5_equality_type_mismatch",
                    )
                    return None
                return "verify"

        return None


def analyze(tree: Any) -> SemanticAnalyzer:
    """
    Creates a SemanticAnalyzer, visits the parse tree, and returns the analyzer instance.
    Directly compatible with lab3_semantic.analyze(tree).
    """
    sa = SemanticAnalyzer()
    sa.visit(tree)
    return sa


def analyze_semantics(tree: Any) -> Tuple[SymbolTable, List[Dict[str, Any]]]:
    """
    Convenience function returning (symbol_table, diagnostics).
    """
    sa = analyze(tree)
    return sa.symbols, sa.diagnostics
