"""
WRH Multi-Stage Compiler Engine Package.
Exports core compiler API, lexer, parser, semantic analyzer, and AST definitions.
"""

from .tokens import (
    Token,
    KEYWORDS,
    CUSTOM_OPERATORS,
    DELIMITERS,
    LexicalError,
    ParseError,
    SemanticError,
)
from .lexer import tokenize
from .parser import Parser, parse
from .symbol_table import SymbolTable
from .semantic import SemanticAnalyzer, analyze, analyze_semantics, classify_semantic_rule
from .ast_nodes import (
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
    render_ast_ascii,
)
from .icg import ICGGenerator, generate_icg
from .pipeline import compile_source

__all__ = [
    "compile_source",
    "tokenize",
    "parse",
    "analyze_semantics",
    "analyze",
    "classify_semantic_rule",
    "Token",
    "KEYWORDS",
    "CUSTOM_OPERATORS",
    "DELIMITERS",
    "LexicalError",
    "ParseError",
    "SemanticError",
    "SymbolTable",
    "SemanticAnalyzer",
    "Parser",
    "ProgramNode",
    "DeclNode",
    "AssignNode",
    "IfNode",
    "WhileNode",
    "PrintNode",
    "BinOpNode",
    "NumNode",
    "StrNode",
    "BoolNode",
    "IdNode",
    "render_ast_ascii",
    "ICGGenerator",
    "generate_icg",
]
