"""
Gemini API Client for WRH AI Assistant.
Communicates with Google Gemini via REST API to perform:
- Code generation grounded in WRH-Lang grammar
- Automatic error diagnosis & code repair
- Interactive compiler copilot chat
"""

import json
import os
import re
import urllib.request
import urllib.error
from typing import Any, Dict, List, Optional, Tuple

from .wrh_spec import SYSTEM_PROMPT_GENERATION, SYSTEM_PROMPT_FIX, SYSTEM_PROMPT_CHAT

DEFAULT_MODEL = "gemini-3-flash-preview"
GEMINI_API_HOST = "https://generativelanguage.googleapis.com"


class GeminiError(Exception):
    """Base exception for Gemini API operations."""
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class GeminiApiKeyMissingError(GeminiError):
    """Raised when no Gemini API key is configured."""
    def __init__(self):
        super().__init__(
            "Gemini API key is not configured. Please supply a GEMINI_API_KEY in your environment, "
            "or enter your Google AI Studio API key in the AI Assistant settings.",
            status_code=401,
        )


def resolve_api_key(api_key: Optional[str] = None) -> str:
    """Resolves Gemini API key from explicit arg or environment variable."""
    key = (api_key or "").strip() or os.getenv("GEMINI_API_KEY", "").strip()
    if not key:
        raise GeminiApiKeyMissingError()
    return key


def fetch_available_models_with_version(api_key: str) -> List[Tuple[str, str]]:
    """Queries Google API for the exact models and versions supported by this API key."""
    if not api_key:
        return []
    valid = []
    seen = set()
    for ver in ["v1beta", "v1"]:
        url = f"{GEMINI_API_HOST}/{ver}/models?key={api_key}"
        try:
            req = urllib.request.Request(url, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                for m in data.get("models", []):
                    name = m.get("name", "")
                    methods = m.get("supportedGenerationMethods", [])
                    if "generateContent" in methods:
                        clean_name = name.replace("models/", "").strip()
                        key_tuple = (ver, clean_name)
                        if key_tuple not in seen:
                            seen.add(key_tuple)
                            valid.append(key_tuple)
        except Exception as e:
            print(f"[Gemini ListModels] {ver} error: {e}")
            continue
    return valid


def fetch_available_models(api_key: str) -> List[str]:
    """Queries Google API for the exact models supported by this API key."""
    pairs = fetch_available_models_with_version(api_key)
    result = []
    for _, name in pairs:
        if name not in result:
            result.append(name)
    return result


def call_gemini_rest(
    system_instruction: str,
    user_prompt: str,
    model: str = DEFAULT_MODEL,
    api_key: Optional[str] = None,
    temperature: float = 0.2,
    response_json: bool = False,
) -> str:
    """
    Sends a generation request to the Gemini REST API with multi-version & fallback model resolution.
    """
    resolved_key = resolve_api_key(api_key)
    req_model = (model or DEFAULT_MODEL).replace("models/", "").strip()

    # Step 1: Discover live available models for this specific API key
    live_pairs = fetch_available_models_with_version(resolved_key)
    print(f"[Gemini] Discovered {len(live_pairs)} active models for key: {[p[1] for p in live_pairs[:5]]}")

    # Priority list of models to try
    fast_priority_models = [
        "gemini-3-flash-preview",
        "gemini-3.5-flash",
        "gemini-flash-latest",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
    ]

    candidates: List[Tuple[str, str]] = []

    # 1. Prioritize requested model from live list if available
    for ver, name in live_pairs:
        if name == req_model:
            candidates.append((ver, name))
            break

    # 2. Prioritize proven fast models from live list
    for fast_name in fast_priority_models:
        for ver, name in live_pairs:
            if name == fast_name and (ver, name) not in candidates:
                candidates.append((ver, name))

    # 3. Next, any partial match with requested model
    for ver, name in live_pairs:
        if req_model in name and (ver, name) not in candidates:
            candidates.append((ver, name))

    # 4. Next, any other flash model from live list
    for ver, name in live_pairs:
        if "flash" in name and (ver, name) not in candidates:
            candidates.append((ver, name))

    # 5. Next, any other live model
    for ver, name in live_pairs:
        if (ver, name) not in candidates:
            candidates.append((ver, name))

    # Fallback to standard names if live list was empty
    default_fallbacks = [
        ("v1beta", req_model),
        ("v1beta", "gemini-3-flash-preview"),
        ("v1beta", "gemini-3.5-flash"),
        ("v1beta", "gemini-2.0-flash"),
        ("v1", req_model),
    ]
    for c in default_fallbacks:
        if c not in candidates:
            candidates.append(c)

    last_error: Optional[Exception] = None

    for idx, (version, target_model) in enumerate(candidates):
        url = f"{GEMINI_API_HOST}/{version}/models/{target_model}:generateContent?key={resolved_key}"
        print(f"[Gemini] Attempting candidate #{idx+1}: {version}/models/{target_model}")

        generation_config: Dict[str, Any] = {
            "temperature": temperature,
            "maxOutputTokens": 2048,
        }
        if response_json and version == "v1beta":
            generation_config["responseMimeType"] = "application/json"

        # Safe payload with both system instruction and user prompt combined in contents for universal compatibility
        full_text = f"SYSTEM INSTRUCTIONS:\n{system_instruction}\n\nUSER REQUEST:\n{user_prompt}"
        payload: Dict[str, Any] = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": full_text}],
                }
            ],
            "generationConfig": generation_config,
        }

        # For v1beta, also add formal systemInstruction
        if version == "v1beta":
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        req_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=req_data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                candidates_list = data.get("candidates", [])
                if not candidates_list:
                    raise GeminiError("Gemini returned an empty candidate list.")

                content_parts = candidates_list[0].get("content", {}).get("parts", [])
                if not content_parts:
                    raise GeminiError("Gemini returned no text content.")

                print(f"[Gemini] Successfully generated response using {version}/models/{target_model}!")
                return content_parts[0].get("text", "")

        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8", errors="ignore")
            try:
                err_json = json.loads(error_body)
                msg = err_json.get("error", {}).get("message", error_body)
            except Exception:
                msg = error_body or str(e)

            print(f"[Gemini] Error on {version}/models/{target_model}: HTTP {e.code} - {msg}")

            # If 404, 400, or 503 (model retired/unavailable), try next candidate
            if (e.code in (404, 400, 503)) and idx < len(candidates) - 1:
                last_error = GeminiError(f"Gemini API error ({e.code}): {msg}", status_code=e.code)
                continue

            # Non-retriable error (e.g. 401 invalid key, 429 quota)
            raise GeminiError(f"Gemini API error ({e.code}): {msg}", status_code=e.code)

        except (urllib.error.URLError, TimeoutError) as e:
            print(f"[Gemini] Network/Timeout error on {version}/models/{target_model}: {e}")
            if idx < len(candidates) - 1:
                continue
            raise GeminiError(f"Network error contacting Gemini API: {str(e)}", status_code=504)
        except GeminiError:
            raise
        except Exception as e:
            if idx < len(candidates) - 1:
                continue
            raise GeminiError(f"Unexpected error: {str(e)}", status_code=500)

    # If all candidates failed
    avail_str = f" Available models for your key: {', '.join([p[1] for p in live_pairs])}" if live_pairs else ""
    raise GeminiError(
        f"None of the available Gemini models could be reached.{avail_str}",
        status_code=404
    )


def extract_wrh_code(text: str) -> str:
    """Extracts raw WRH code from markdown code block or returns stripped text."""
    match = re.search(r"```(?:wrh)?\s*\n(.*?)```", text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return text.strip()


class GeminiClient:
    """High-level client providing code generation, automated fixing, and chat."""

    def __init__(self, default_model: str = DEFAULT_MODEL):
        self.default_model = default_model

    def generate_code(
        self,
        prompt: str,
        context_code: Optional[str] = None,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generates WRH-Lang code based on natural language prompt."""
        full_user_prompt = f"User Request: {prompt}\n"
        if context_code and context_code.strip():
            full_user_prompt += f"\nExisting Editor Code for Context:\n```wrh\n{context_code.strip()}\n```\n"

        raw_response = call_gemini_rest(
            system_instruction=SYSTEM_PROMPT_GENERATION,
            user_prompt=full_user_prompt,
            model=model or self.default_model,
            api_key=api_key,
            temperature=0.3,
        )

        code = extract_wrh_code(raw_response)
        # Extract explanation after code block if present
        parts = raw_response.split("```")
        explanation = parts[-1].strip() if len(parts) >= 3 else ""

        return {
            "success": True,
            "code": code,
            "explanation": explanation,
            "raw_response": raw_response,
            "model_used": model or self.default_model,
        }

    def fix_code(
        self,
        source_code: str,
        errors: List[Dict[str, Any]],
        model: Optional[str] = None,
        api_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Diagnoses compiler error and provides corrected WRH code."""
        error_summary = []
        for err in errors:
            stage = err.get("stage", "unknown")
            line = err.get("line", 1)
            col = err.get("column", 1)
            msg = err.get("message", "")
            rule = err.get("rule", "")
            error_summary.append(
                f"- Stage: {stage}, Line: {line}, Column: {col}\n  Message: {msg}\n  Rule: {rule}"
            )

        user_prompt = f"""Broken WRH Source Code:
```wrh
{source_code}
```

Compiler Diagnostic Errors:
{chr(10).join(error_summary) if error_summary else 'Code failed validation or needs repair.'}

Please analyze the exact violation, explain it, and return the corrected WRH source code adhering to all formal rules.
"""

        raw_response = call_gemini_rest(
            system_instruction=SYSTEM_PROMPT_FIX,
            user_prompt=user_prompt,
            model=model or self.default_model,
            api_key=api_key,
            temperature=0.1,
            response_json=True,
        )

        try:
            parsed = json.loads(raw_response)
            fixed_code = extract_wrh_code(parsed.get("fixed_code", ""))
            return {
                "success": True,
                "explanation": parsed.get("explanation", "The compiler error has been fixed."),
                "violated_rule": parsed.get("violated_rule", "Syntax/Semantic rule"),
                "error_line": parsed.get("error_line"),
                "fixed_code": fixed_code,
                "changes_summary": parsed.get("changes_summary", []),
                "model_used": model or self.default_model,
            }
        except Exception:
            # Fallback if model didn't return pure JSON
            fixed_code = extract_wrh_code(raw_response)
            return {
                "success": True,
                "explanation": "Corrected WRH code based on compiler diagnostics.",
                "violated_rule": "Syntax/Semantic rule",
                "error_line": None,
                "fixed_code": fixed_code,
                "changes_summary": ["Fixed compiler error"],
                "model_used": model or self.default_model,
            }

    def chat(
        self,
        messages: List[Dict[str, str]],
        current_code: Optional[str] = None,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Provides interactive conversational assistance for WRH programming."""
        context = ""
        if current_code and current_code.strip():
            context = f"Current Code in Editor:\n```wrh\n{current_code.strip()}\n```\n\n"

        history_text = "\n".join([f"{m.get('role', 'user').title()}: {m.get('content', '')}" for m in messages])
        user_prompt = f"{context}Conversation History:\n{history_text}\n\nAssistant:"

        raw_response = call_gemini_rest(
            system_instruction=SYSTEM_PROMPT_CHAT,
            user_prompt=user_prompt,
            model=model or self.default_model,
            api_key=api_key,
            temperature=0.4,
        )

        return {
            "success": True,
            "response": raw_response,
            "code_snippet": extract_wrh_code(raw_response) if "```" in raw_response else None,
            "model_used": model or self.default_model,
        }

    def get_status(self, api_key: Optional[str] = None) -> Dict[str, Any]:
        """Checks whether Gemini is available and ready."""
        key = (api_key or "").strip() or os.getenv("GEMINI_API_KEY", "").strip()
        has_key = bool(key)
        masked_key = f"{key[:4]}...{key[-4:]}" if has_key and len(key) >= 8 else None

        default_supported = [
            "gemini-2.0-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
        ]

        if has_key:
            live_models = fetch_available_models(key)
            supported = live_models if live_models else default_supported
        else:
            supported = default_supported

        return {
            "configured": has_key,
            "source": "client" if api_key else ("environment" if has_key else "none"),
            "masked_key": masked_key,
            "default_model": self.default_model,
            "supported_models": supported,
        }
