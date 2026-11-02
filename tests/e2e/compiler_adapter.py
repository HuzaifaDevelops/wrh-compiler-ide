"""
Compiler Adapter for WRH E2E Test Suite.
Routes in-memory compilation directly to the backend compiler engine package
(apps.compiler.engine) and supports live HTTP REST API requests.
"""

import io
import json
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Resolve backend directory and ensure it is available on sys.path
CURRENT_FILE = Path(__file__).resolve()
# parents: [0]=e2e, [1]=tests, [2]=wrh_compiler_app, [3]=Project Root
PROJECT_ROOT = CURRENT_FILE.parents[3]
BACKEND_DIR = PROJECT_ROOT / "wrh_compiler_app" / "backend"

if str(BACKEND_DIR) not in sys.path and BACKEND_DIR.exists():
    sys.path.insert(0, str(BACKEND_DIR))

# Import directly from the genuine backend compiler engine package
from apps.compiler.engine.pipeline import compile_source
from apps.compiler.engine.lexer import tokenize
from apps.compiler.engine.parser import parse
from apps.compiler.engine.semantic import analyze, classify_semantic_rule


def _parse_error_line(msg: str) -> int:
    """Extract line number from standard error message."""
    m = re.search(r"line\s+(\d+)", msg, re.IGNORECASE)
    if m:
        return int(m.group(1))
    return 1


def _classify_semantic_rule(msg: str) -> str:
    """Classify semantic error message into one of the 6 formal rules."""
    return classify_semantic_rule(msg)


def tokenize_code(source_code: str) -> List[Any]:
    """Tokenize source code directly using the backend engine lexer."""
    return tokenize(source_code)


def parse_tokens(tokens: List[Any]) -> Any:
    """Parse token list directly using the backend engine parser."""
    return parse(tokens)


def analyze_ast(ast: Any) -> Tuple[Dict[str, Any], List[str]]:
    """Perform semantic analysis directly on AST using backend engine."""
    sa = analyze(ast)
    return sa.symbols, sa.errors


def execute_compiler_pipeline(source_code: str) -> Dict[str, Any]:
    """
    Executes the genuine 3-stage compiler pipeline in memory and returns a structured result
    matching the POST /api/compile/ response contract.
    """
    return compile_source(source_code)


def compile_via_http(source_code: str, base_url: str = "http://127.0.0.1:8000") -> Dict[str, Any]:
    """Sends compilation request to live HTTP REST API endpoint."""
    import urllib.error
    import urllib.request

    url = f"{base_url.rstrip('/')}/api/compile/"
    payload = json.dumps({"source_code": source_code}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            return json.loads(raw)
        except Exception:
            return {
                "success": False,
                "status": "error",
                "http_status": e.code,
                "errors": [{"message": f"HTTP {e.code}: {raw}"}]
            }


def compile_wrh(source_code: str, api_url: Optional[str] = None) -> Dict[str, Any]:
    """
    Main entry point for tests.
    If api_url is provided, requests the live web server; otherwise runs in-memory pipeline.
    """
    if api_url:
        return compile_via_http(source_code, api_url)
    return execute_compiler_pipeline(source_code)
