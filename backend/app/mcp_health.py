"""HTTP health probe for MCP tools that require the FastAPI app to be up (e.g. strand_run).

The MCP process is separate from uvicorn; strand_run also needs DB access, but we gate on
/api/health so devs start the API (or use the mcp-serve-with-backend wrapper) before strands.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request


def get_backend_health_url() -> str:
    base = (
        os.environ.get("NEXT_PUBLIC_BACKEND_URL")
        or os.environ.get("BARS_BACKEND_URL")
        or "http://127.0.0.1:8000"
    ).rstrip("/")
    return f"{base}/api/health"


def check_backend_http_ready(timeout_s: float = 5.0) -> tuple[bool, str]:
    """
    Return (True, "") if GET /api/health returns 2xx.
    Otherwise (False, human-readable error).
    """
    url = get_backend_health_url()
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            status = getattr(resp, "status", None) or resp.getcode()
            if 200 <= int(status) < 300:
                return True, ""
            return False, f"HTTP {status} from {url}"
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code} from {url}: {e.reason}"
    except urllib.error.URLError as e:
        return False, f"Cannot reach {url}: {e.reason}"
    except TimeoutError:
        return False, f"Timeout ({timeout_s}s) waiting for {url}"
    except OSError as e:
        return False, f"Cannot reach {url}: {e}"


def backend_not_ready_payload(detail: str) -> str:
    return json.dumps(
        {
            "error": "backend_not_ready",
            "detail": detail,
            "hint": (
                "Start the FastAPI app: npm run dev:backend (from repo root). "
                "Cursor MCP should use the wrapper that runs `ensureBackendReady` first — "
                "see package.json: mcp:serve:with-backend and docs/AGENT_WORKFLOWS.md."
            ),
        }
    )
