"""
AST node definitions and thread-safe ASCII tree renderer for WRH-Lang.
All statement and expression nodes subclass tuple for high performance,
instant JSON serialization, and full tuple-unpacking backward compatibility.
"""

from typing import Any, Dict, List, Optional, Tuple, Union


class ProgramNode(list):
    """Root program node containing a list of top-level statements."""

    @property
    def type(self) -> str:
        return "program"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "program",
            "body": [
                s.to_dict() if hasattr(s, "to_dict") else s
                for s in self
            ],
        }


class DeclNode(tuple):
    """
    Variable declaration node: ('decl', var_type, name, init_expr, line)
    """
    def __new__(cls, var_type: str, name: str, init: Optional[Any], line: int):
        return super().__new__(cls, ("decl", var_type, name, init, line))

    @property
    def type(self) -> str:
        return "decl"

    @property
    def var_type(self) -> str:
        return self[1]

    @property
    def name(self) -> str:
        return self[2]

    @property
    def init(self) -> Optional[Any]:
        return self[3]

    @property
    def line(self) -> int:
        return self[4]

    def _as_tuple(self) -> Tuple[Any, ...]:
        return tuple(self)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "decl",
            "var_type": self.var_type,
            "name": self.name,
            "init": self.init.to_dict() if hasattr(self.init, "to_dict") else self.init,
            "line": self.line,
        }


class AssignNode(tuple):
    """
    Variable assignment node: ('assign', name, value_expr, line)
    """
    def __new__(cls, name: str, value: Any, line: int):
        return super().__new__(cls, ("assign", name, value, line))

    @property
    def type(self) -> str:
        return "assign"

    @property
    def name(self) -> str:
        return self[1]

    @property
    def value(self) -> Any:
        return self[2]

    @property
    def line(self) -> int:
        return self[3]

    def _as_tuple(self) -> Tuple[Any, ...]:
        return tuple(self)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "assign",
            "name": self.name,
            "value": self.value.to_dict() if hasattr(self.value, "to_dict") else self.value,
            "line": self.line,
        }


class IfNode(tuple):
    """
    Conditional statement node: ('if', cond_expr, then_block, else_block, line)
    """
    def __new__(
        cls,
        cond: Any,
        then_block: List[Any],
        else_block: Optional[List[Any]],
        line: int,
    ):
        return super().__new__(cls, ("if", cond, then_block, else_block, line))

    @property
    def type(self) -> str:
        return "if"

    @property
    def cond(self) -> Any:
        return self[1]

    @property
    def then_block(self) -> List[Any]:
        return self[2]

    @property
    def else_block(self) -> Optional[List[Any]]:
        return self[3]

    @property
    def line(self) -> int:
        return self[4]

    def _as_tuple(self) -> Tuple[Any, ...]:
        return tuple(self)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "if",
            "cond": self.cond.to_dict() if hasattr(self.cond, "to_dict") else self.cond,
            "then_block": [
                s.to_dict() if hasattr(s, "to_dict") else s for s in self.then_block
            ],
            "else_block": (
                [s.to_dict() if hasattr(s, "to_dict") else s for s in self.else_block]
                if self.else_block is not None
                else None
            ),
            "line": self.line,
        }


class WhileNode(tuple):
    """
    Loop statement node: ('while', cond_expr, body_block, line)
    """
    def __new__(cls, cond: Any, body: List[Any], line: int):
        return super().__new__(cls, ("while", cond, body, line))

    @property
    def type(self) -> str:
        return "while"

    @property
    def cond(self) -> Any:
        return self[1]

    @property
    def body(self) -> List[Any]:
        return self[2]

    @property
    def line(self) -> int:
        return self[3]

    def _as_tuple(self) -> Tuple[Any, ...]:
        return tuple(self)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "while",
            "cond": self.cond.to_dict() if hasattr(self.cond, "to_dict") else self.cond,
            "body": [s.to_dict() if hasattr(s, "to_dict") else s for s in self.body],
            "line": self.line,
        }


class PrintNode(tuple):
    """
    Output statement node: ('print', expr, line)
    """
    def __new__(cls, expr: Any, line: int):
        return super().__new__(cls, ("print", expr, line))

    @property
    def type(self) -> str:
        return "print"

    @property
    def expr(self) -> Any:
        return self[1]

    @property
    def line(self) -> int:
        return self[2]

    def _as_tuple(self) -> Tuple[Any, ...]:
        return tuple(self)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "print",
            "expr": self.expr.to_dict() if hasattr(self.expr, "to_dict") else self.expr,
            "line": self.line,
        }


class BinOpNode(tuple):
    """
    Binary operation expression node: ('binop', op, left, right, line)
    """
    def __new__(cls, op: str, left: Any, right: Any, line: int):
        return super().__new__(cls, ("binop", op, left, right, line))

    @property
    def type(self) -> str:
        return "binop"

    @property
    def op(self) -> str:
        return self[1]

    @property
    def left(self) -> Any:
        return self[2]

    @property
    def right(self) -> Any:
        return self[3]

    @property
    def line(self) -> int:
        return self[4]

    def _as_tuple(self) -> Tuple[Any, ...]:
        return tuple(self)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "binop",
            "op": self.op,
            "left": self.left.to_dict() if hasattr(self.left, "to_dict") else self.left,
            "right": self.right.to_dict() if hasattr(self.right, "to_dict") else self.right,
            "line": self.line,
        }


class NumNode(tuple):
    """
    Integer literal node: ('num', value, line)
    """
    def __new__(cls, value: str, line: int):
        return super().__new__(cls, ("num", value, line))

    @property
    def type(self) -> str:
        return "num"

    @property
    def value(self) -> str:
        return self[1]

    @property
    def line(self) -> int:
        return self[2]

    def _as_tuple(self) -> Tuple[Any, ...]:
        return tuple(self)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "num",
            "value": self.value,
            "line": self.line,
        }


class StrNode(tuple):
    """
    String literal node: ('str', value, line)
    """
    def __new__(cls, value: str, line: int):
        return super().__new__(cls, ("str", value, line))

    @property
    def type(self) -> str:
        return "str"

    @property
    def value(self) -> str:
        return self[1]

    @property
    def line(self) -> int:
        return self[2]

    def _as_tuple(self) -> Tuple[Any, ...]:
        return tuple(self)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "str",
            "value": self.value,
            "line": self.line,
        }


class BoolNode(tuple):
    """
    Boolean literal node: ('bool', value, line)
    """
    def __new__(cls, value: str, line: int):
        return super().__new__(cls, ("bool", value, line))

    @property
    def type(self) -> str:
        return "bool"

    @property
    def value(self) -> str:
        return self[1]

    @property
    def line(self) -> int:
        return self[2]

    def _as_tuple(self) -> Tuple[Any, ...]:
        return tuple(self)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "bool",
            "value": self.value,
            "line": self.line,
        }


class IdNode(tuple):
    """
    Identifier node: ('id', name, line)
    """
    def __new__(cls, name: str, line: int):
        return super().__new__(cls, ("id", name, line))

    @property
    def type(self) -> str:
        return "id"

    @property
    def name(self) -> str:
        return self[1]

    @property
    def line(self) -> int:
        return self[2]

    def _as_tuple(self) -> Tuple[Any, ...]:
        return tuple(self)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "id",
            "name": self.name,
            "line": self.line,
        }


def render_ast_ascii(node: Any, depth: int = 0) -> str:
    """
    Thread-safe, recursive in-memory ASCII tree generator.
    Produces identical tree structure to the reference course lab parser
    without touching or redirecting sys.stdout.
    """
    lines: List[str] = []

    def _walk(n: Any, d: int) -> None:
        if n is None:
            return

        pad = " " * d
        if isinstance(n, list):
            for item in n:
                _walk(item, d)
            return

        tag = n[0] if isinstance(n, tuple) else getattr(n, "type", "")

        if tag == "decl":
            lines.append(f"{pad}Declaration: {n[1]} {n[2]}")
            if n[3] is not None:
                _walk(n[3], d + 1)
        elif tag == "assign":
            lines.append(f"{pad}Assignment: {n[1]}")
            _walk(n[2], d + 1)
        elif tag == "if":
            lines.append(f"{pad}If")
            lines.append(f"{pad} Condition")
            _walk(n[1], d + 2)
            lines.append(f"{pad} Then")
            _walk(n[2], d + 2)
            if n[3] is not None:
                lines.append(f"{pad} Else")
                _walk(n[3], d + 2)
        elif tag == "while":
            lines.append(f"{pad}While")
            lines.append(f"{pad} Condition")
            _walk(n[1], d + 2)
            lines.append(f"{pad} Body")
            _walk(n[2], d + 2)
        elif tag == "print":
            lines.append(f"{pad}Print")
            _walk(n[1], d + 1)
        elif tag == "binop":
            lines.append(f"{pad}Operator: {n[1]}")
            _walk(n[2], d + 1)
            _walk(n[3], d + 1)
        else:
            lines.append(f"{pad}{tag.capitalize()}: {n[1]}")

    _walk(node, depth)
    return "\n".join(lines)
