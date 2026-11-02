"""
Token specifications, exceptions, and token definitions for WRH-Lang.
"""

from typing import Dict, Any, Tuple, Optional


# 9 User-defined keywords for WRH-Lang
KEYWORDS: Dict[str, str] = {
    "digit": "INT",
    "verify": "BOOL",
    "textbody": "STRING",
    "when": "IF",
    "otherwise": "ELSE",
    "until": "WHILE",
    "flex": "PRINT",
    "yes": "TRUE",
    "no": "FALSE",
}

# 9 Custom operators + delimiters
# Defined in order of precedence: multi-character operators appear before single characters.
# Note: '//' is strictly integer division and NOT a comment.
CUSTOM_OPERATORS = [
    ":=", "+++", "---", "//", "**", "?=", ">>", "<<", "~"
]

DELIMITERS = ["(", ")", "{", "}", ";"]

# Token specification regular expressions
TOKEN_SPEC = [
    ("NUM", r"\d+"),
    ("STR", r'"[^"\n]*"'),
    ("ID", r"[A-Za-z_]\w*"),
    ("OP", r":=|\+\+\+|---|//|\*\*|\?=|>>|<<|~|[(){};]"),
    ("NL", r"\n"),
    ("SKIP", r"[ \t\r]+"),
    ("BAD", r"."),
]

TOKEN_PATTERN = "|".join(f"(?P<{name}>{rx})" for name, rx in TOKEN_SPEC)


class LexicalError(SyntaxError):
    """Raised when an unknown character or invalid lexical token is encountered."""
    def __init__(self, message: str, line: int = 1, column: int = 1):
        super().__init__(message)
        self.message = message
        self.line = line
        self.column = column

    def to_dict(self) -> Dict[str, Any]:
        return {
            "stage": "lexical",
            "line": self.line,
            "column": self.column,
            "message": self.message,
            "rule": "lexical_error",
        }


class ParseError(SyntaxError):
    """Raised when a grammar or syntax violation is encountered during parsing."""
    def __init__(self, message: str, line: int = 1, column: int = 1):
        super().__init__(message)
        self.message = message
        self.line = line
        self.column = column

    def to_dict(self) -> Dict[str, Any]:
        return {
            "stage": "syntax",
            "line": self.line,
            "column": self.column,
            "message": self.message,
            "rule": "syntax_error",
        }


class SemanticError(Exception):
    """Raised or collected when a semantic validation rule is violated."""
    def __init__(self, message: str, line: int = 1, column: int = 1, rule: str = ""):
        super().__init__(message)
        self.message = message
        self.line = line
        self.column = column
        self.rule = rule

    def to_dict(self) -> Dict[str, Any]:
        return {
            "stage": "semantic",
            "line": self.line,
            "column": self.column,
            "message": self.message,
            "rule": self.rule,
        }


class Token:
    """
    WRH Token representation with line/column coordinates and backwards-compatible tuple unpacking.
    """
    __slots__ = ("type", "lexeme", "line", "column")

    def __init__(self, token_type: str, lexeme: str, line: int, column: int = 1):
        self.type = token_type
        self.lexeme = lexeme
        self.line = line
        self.column = column

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "lexeme": self.lexeme,
            "line": self.line,
            "column": self.column,
        }

    def _as_tuple(self) -> Tuple[str, str, int]:
        return (self.type, self.lexeme, self.line)

    def __iter__(self):
        return iter((self.type, self.lexeme, self.line))

    def __getitem__(self, idx: int):
        return (self.type, self.lexeme, self.line, self.column)[idx]

    def __len__(self) -> int:
        return 3

    def __repr__(self) -> str:
        return f"Token({self.type!r}, {self.lexeme!r}, line={self.line}, col={self.column})"

    def __eq__(self, other: Any) -> bool:
        if isinstance(other, Token):
            return (self.type, self.lexeme, self.line, self.column) == (
                other.type, other.lexeme, other.line, other.column
            )
        if isinstance(other, tuple):
            if len(other) == 3:
                return (self.type, self.lexeme, self.line) == other
            if len(other) == 4:
                return (self.type, self.lexeme, self.line, self.column) == other
        return False
