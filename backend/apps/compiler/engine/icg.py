"""
Intermediate Code Generator (ICG) for WRH-Lang.
Translates AST into:
1. Three-Address Code (TAC) statements
2. Quadruples Table (op, arg1, arg2, result)
3. Triples Table (op, arg1, arg2)
Conforms to course syllabus (CC 9 Intermediate Code Generation).
"""

from typing import Any, Dict, List, Optional, Tuple


class ICGGenerator:
    def __init__(self):
        self.temp_counter = 0
        self.label_counter = 0
        self.tac_instructions: List[str] = []
        self.quadruples: List[Dict[str, Any]] = []
        self.triples: List[Dict[str, Any]] = []

    def new_temp(self) -> str:
        self.temp_counter += 1
        return f"t{self.temp_counter}"

    def new_label(self) -> str:
        self.label_counter += 1
        return f"L{self.label_counter}"

    def add_quad(self, op: str, arg1: Optional[str], arg2: Optional[str], result: Optional[str]):
        idx = len(self.quadruples)
        self.quadruples.append({
            "index": idx,
            "op": op,
            "arg1": arg1 if arg1 is not None else "-",
            "arg2": arg2 if arg2 is not None else "-",
            "result": result if result is not None else "-",
        })

    def add_triple(self, op: str, arg1: Optional[str], arg2: Optional[str]) -> str:
        idx = len(self.triples)
        self.triples.append({
            "index": idx,
            "op": op,
            "arg1": arg1 if arg1 is not None else "-",
            "arg2": arg2 if arg2 is not None else "-",
        })
        return f"({idx})"

    def generate(self, stmts: List[Any]) -> Dict[str, Any]:
        """
        Translates list of AST statements into TAC, Quadruples, and Triples.
        """
        for stmt in stmts:
            self.gen_stmt(stmt)

        return {
            "tac": "\n".join(self.tac_instructions),
            "tac_lines": self.tac_instructions,
            "quadruples": self.quadruples,
            "triples": self.triples,
        }

    def gen_stmt(self, s: Any) -> None:
        tag = s[0]

        # 1. Declaration: ('decl', var_type, name, init, line)
        if tag == "decl":
            _, var_type, name, init, line = s
            if init is not None:
                val_addr, val_triple = self.gen_expr(init)
                self.tac_instructions.append(f"{name} := {val_addr}")
                self.add_quad(":=", val_addr, None, name)
                self.add_triple(":=", name, val_triple)

        # 2. Assignment: ('assign', name, value_expr, line)
        elif tag == "assign":
            _, name, value_expr, line = s
            val_addr, val_triple = self.gen_expr(value_expr)
            self.tac_instructions.append(f"{name} := {val_addr}")
            self.add_quad(":=", val_addr, None, name)
            self.add_triple(":=", name, val_triple)

        # 3. If Statement: ('if', cond, then_block, else_block, line)
        elif tag == "if":
            _, cond, then_block, else_block, line = s
            label_then = self.new_label()
            label_else = self.new_label() if else_block is not None else None
            label_end = self.new_label()

            # Evaluate condition
            cond_addr, cond_triple = self.gen_expr(cond)

            target_if_false = label_else if label_else else label_end
            self.tac_instructions.append(f"ifFalse {cond_addr} goto {target_if_false}")
            self.add_quad("ifFalse", cond_addr, None, target_if_false)
            self.add_triple("ifFalse", cond_triple, target_if_false)

            # Then block
            for ts in then_block:
                self.gen_stmt(ts)

            if label_else:
                self.tac_instructions.append(f"goto {label_end}")
                self.add_quad("goto", None, None, label_end)
                self.add_triple("goto", label_end, None)

                self.tac_instructions.append(f"{label_else}:")
                self.add_quad("label", None, None, label_else)
                self.add_triple("label", label_else, None)

                for es in else_block:
                    self.gen_stmt(es)

            self.tac_instructions.append(f"{label_end}:")
            self.add_quad("label", None, None, label_end)
            self.add_triple("label", label_end, None)

        # 4. While Statement: ('while', cond, body, line)
        elif tag == "while":
            _, cond, body, line = s
            label_start = self.new_label()
            label_end = self.new_label()

            self.tac_instructions.append(f"{label_start}:")
            self.add_quad("label", None, None, label_start)
            self.add_triple("label", label_start, None)

            cond_addr, cond_triple = self.gen_expr(cond)
            self.tac_instructions.append(f"ifFalse {cond_addr} goto {label_end}")
            self.add_quad("ifFalse", cond_addr, None, label_end)
            self.add_triple("ifFalse", cond_triple, label_end)

            for bs in body:
                self.gen_stmt(bs)

            self.tac_instructions.append(f"goto {label_start}")
            self.add_quad("goto", None, None, label_start)
            self.add_triple("goto", label_start, None)

            self.tac_instructions.append(f"{label_end}:")
            self.add_quad("label", None, None, label_end)
            self.add_triple("label", label_end, None)

        # 5. Print Statement: ('print', expr, line)
        elif tag == "print":
            _, expr, line = s
            val_addr, val_triple = self.gen_expr(expr)
            self.tac_instructions.append(f"param {val_addr}")
            self.tac_instructions.append("call flex, 1")
            self.add_quad("param", val_addr, None, None)
            self.add_quad("call", "flex", "1", None)
            self.add_triple("param", val_triple, None)
            self.add_triple("call", "flex", "1")

    def gen_expr(self, e: Any) -> Tuple[str, str]:
        """
        Translates expression node into intermediate representations.
        Returns (address_str, triple_ref_str).
        """
        tag = e[0]

        if tag == "num":
            return str(e[1]), str(e[1])

        if tag == "str":
            return str(e[1]), str(e[1])

        if tag == "bool":
            return str(e[1]), str(e[1])

        if tag == "id":
            return str(e[1]), str(e[1])

        if tag == "binop":
            _, op, left, right, line = e
            l_addr, l_triple = self.gen_expr(left)
            r_addr, r_triple = self.gen_expr(right)

            t = self.new_temp()
            self.tac_instructions.append(f"{t} := {l_addr} {op} {r_addr}")
            self.add_quad(op, l_addr, r_addr, t)
            t_ref = self.add_triple(op, l_triple, r_triple)
            return t, t_ref

        return "unknown", "unknown"


def generate_icg(stmts: List[Any]) -> Dict[str, Any]:
    """Helper entry point to generate ICG from AST."""
    gen = ICGGenerator()
    return gen.generate(stmts)
