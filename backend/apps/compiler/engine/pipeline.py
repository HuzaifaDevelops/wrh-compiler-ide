"""
Multi-Stage Compiler Pipeline for WRH-Lang.
Coordinates Lexer, Parser, and Semantic Analyzer, records execution latency,
and formats the response dictionary conforming to PROJECT.md Interface Contracts.
"""

import time
from typing import Any, Dict, List

from .tokens import LexicalError, ParseError, Token
from .lexer import tokenize
from .parser import parse
from .ast_nodes import render_ast_ascii, ProgramNode
from .semantic import analyze
from .interpreter import interpret
from .icg import generate_icg

EMPTY_ICG: Dict[str, Any] = {
    "tac": "",
    "tac_lines": [],
    "quadruples": [],
    "triples": [],
}


def compile_source(source_code: str) -> Dict[str, Any]:
    """
    Executes all three compiler stages:
    1. Lexer (Tokens, coordinates, custom operators)
    2. Parser (Recursive descent, AST, ASCII tree)
    3. Semantic Analyzer (Symbol table, 6 formal rules, cascade suppression)

    Returns a 10-key dictionary matching PROJECT.md § Interface Contracts:
    - success: bool
    - status: 'compiled' | 'error'
    - stage_reached: int (0, 1, 2, 3)
    - stage_failed: None | 'lexical' | 'syntax' | 'semantic'
    - tokens: list of token dicts
    - ast: ProgramNode (list of statement nodes)
    - ast_ascii: formatted tree string
    - symbol_table: dict mapping var names to {type, line}
    - errors: list of diagnostic dictionaries
    - execution_time_ms: float
    """
    start_time = time.perf_counter()

    # Stage 1: Lexical Analysis
    try:
        tokens_raw = tokenize(source_code)
    except LexicalError as e:
        elapsed = (time.perf_counter() - start_time) * 1000.0
        return {
            "success": False,
            "status": "error",
            "stage_failed": "lexical",
            "stage_reached": 0,
            "tokens": [],
            "ast": [],
            "ast_ascii": "",
            "symbol_table": {},
            "errors": [e.to_dict()],
            "icg": EMPTY_ICG,
            "output": "",
            "output_lines": [],
            "runtime_error": None,
            "execution_time_ms": round(elapsed, 2),
        }
    except SyntaxError as e:
        elapsed = (time.perf_counter() - start_time) * 1000.0
        line = getattr(e, "line", 1)
        col = getattr(e, "column", 1)
        return {
            "success": False,
            "status": "error",
            "stage_failed": "lexical",
            "stage_reached": 0,
            "tokens": [],
            "ast": [],
            "ast_ascii": "",
            "symbol_table": {},
            "errors": [
                {
                    "stage": "lexical",
                    "line": line,
                    "column": col,
                    "message": str(e),
                    "rule": "lexical_error",
                }
            ],
            "icg": EMPTY_ICG,
            "output": "",
            "output_lines": [],
            "runtime_error": None,
            "execution_time_ms": round(elapsed, 2),
        }

    formatted_tokens: List[Dict[str, Any]] = [
        t.to_dict() if hasattr(t, "to_dict") else {
            "type": t[0], "lexeme": t[1], "line": t[2], "column": 1
        }
        for t in tokens_raw
    ]

    # Stage 2: Syntactic Parsing
    try:
        ast = parse(tokens_raw)
        ast_ascii = render_ast_ascii(ast)
    except ParseError as e:
        elapsed = (time.perf_counter() - start_time) * 1000.0
        return {
            "success": False,
            "status": "error",
            "stage_failed": "syntax",
            "stage_reached": 1,
            "tokens": formatted_tokens,
            "ast": [],
            "ast_ascii": "",
            "symbol_table": {},
            "errors": [e.to_dict()],
            "icg": EMPTY_ICG,
            "output": "",
            "output_lines": [],
            "runtime_error": None,
            "execution_time_ms": round(elapsed, 2),
        }
    except SyntaxError as e:
        elapsed = (time.perf_counter() - start_time) * 1000.0
        line = getattr(e, "line", 1)
        col = getattr(e, "column", 1)
        return {
            "success": False,
            "status": "error",
            "stage_failed": "syntax",
            "stage_reached": 1,
            "tokens": formatted_tokens,
            "ast": [],
            "ast_ascii": "",
            "symbol_table": {},
            "errors": [
                {
                    "stage": "syntax",
                    "line": line,
                    "column": col,
                    "message": str(e),
                    "rule": "syntax_error",
                }
            ],
            "icg": EMPTY_ICG,
            "output": "",
            "output_lines": [],
            "runtime_error": None,
            "execution_time_ms": round(elapsed, 2),
        }

    # Stage 3: Semantic Analysis
    try:
        sa = analyze(ast)
        if sa.errors:
            elapsed = (time.perf_counter() - start_time) * 1000.0
            return {
                "success": False,
                "status": "error",
                "stage_failed": "semantic",
                "stage_reached": 2,
                "tokens": formatted_tokens,
                "ast": ast,
                "ast_ascii": ast_ascii,
                "symbol_table": sa.symbols.to_dict(),
                "errors": sa.diagnostics,
                "icg": EMPTY_ICG,
                "output": "",
                "output_lines": [],
                "runtime_error": None,
                "execution_time_ms": round(elapsed, 2),
            }
    except Exception as e:
        elapsed = (time.perf_counter() - start_time) * 1000.0
        return {
            "success": False,
            "status": "error",
            "stage_failed": "semantic",
            "stage_reached": 2,
            "tokens": formatted_tokens,
            "ast": ast,
            "ast_ascii": ast_ascii,
            "symbol_table": {},
            "errors": [
                {
                    "stage": "semantic",
                    "line": 1,
                    "column": 1,
                    "message": str(e),
                    "rule": "unhandled_semantic_exception",
                }
            ],
            "icg": EMPTY_ICG,
            "output": "",
            "output_lines": [],
            "runtime_error": None,
            "execution_time_ms": round(elapsed, 2),
        }

    # Stage 4: Intermediate Code Generation (ICG)
    try:
        icg_result = generate_icg(ast)
    except Exception:
        icg_result = EMPTY_ICG

    # Stage 5: Program Execution / Interpretation
    output_lines, runtime_error = interpret(ast)

    elapsed = (time.perf_counter() - start_time) * 1000.0
    return {
        "success": True,
        "status": "compiled",
        "stage_failed": None,
        "stage_reached": 3,
        "tokens": formatted_tokens,
        "ast": ast,
        "ast_ascii": ast_ascii,
        "symbol_table": sa.symbols.to_dict(),
        "errors": [],
        "icg": icg_result,
        "output": "\n".join(output_lines),
        "output_lines": output_lines,
        "runtime_error": runtime_error,
        "execution_time_ms": round(elapsed, 2),
    }
