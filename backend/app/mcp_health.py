"""HTTP health probe for MCP tools that require the FastAPI app to be up (e.g. strand_run).

The MCP process is separate from uvicorn; strand_run also needs DB access, but we gate on
/api/health so devs start the API (or use the mcp-serve-with-backend wrapper) before strands.

Precedence for which origin to probe:
1. **BARS_MCP_HEALTH_ORIGIN** — optional; pins the MCP health probe only (local-first dev).
2. **NEXT_PUBLIC_BACKEND_URL** / **BARS_BACKEND_URL** — shared with Next; may point at Railway.
3. Default **http://127.0.0.1:8000**.

If the primary URL fails (timeout, connection refused, bad URL), we **retry once** against
local **http://127.0.0.1:8000** when the primary was not already that origin — so a broken
Railway or mis-set env does not block strand_run when local `npm run dev:backend` is up.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

LOCAL_FALLBACK_BASE = "http://127.0.0.1:8000"
"""Default API origin when env is empty or when retrying after primary probe failure."""

MCP_HEALTH_ORIGIN_ENV = "BARS_MCP_HEALTH_ORIGIN"
"""Set to e.g. http://127.0.0.1:8000 so MCP strand_run always probes local, ignoring Railway."""


def _normalize_backend_base(raw: str) -> str:
    """
    Ensure a full origin so urllib accepts the health URL.

    Common misconfiguration: NEXT_PUBLIC_BACKEND_URL=bars-xxx.up.railway.app (no scheme)
    → would become 'host/api/health' and raise unknown url type.
    """
    s = raw.strip().rstrip("/")
    if not s:
        return LOCAL_FALLBACK_BASE
    if "://" in s:
        return s
    lower = s.lower()
    if lower.startswith("localhost") or lower.startswith("127.0.0.1"):
        return f"http://{s}"
    return f"https://{s}"


def get_backend_health_url() -> str:
    """
    Primary health URL for strand_run gate.

    If **BARS_MCP_HEALTH_ORIGIN** is set, it wins (normalized) so MCP can target local API
    while Next.js still uses NEXT_PUBLIC_BACKEND_URL for browser calls.
    """
    mcp_only = (os.environ.get(MCP_HEALTH_ORIGIN_ENV) or "").strip()
    if mcp_only:
        base = _normalize_backend_base(mcp_only).rstrip("/")
        return f"{base}/api/health"

    raw = (os.environ.get("NEXT_PUBLIC_BACKEND_URL") or os.environ.get("BARS_BACKEND_URL") or "").strip()
    base = _normalize_backend_base(raw) if raw else LOCAL_FALLBACK_BASE
    base = base.rstrip("/")
    return f"{base}/api/health"


def _health_url_for_base(base: str) -> str:
    return f"{base.rstrip('/')}/api/health"


def _probe_health_url(url: str, timeout_s: float) -> tuple[bool, str]:
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
    except ValueError as e:
        # e.g. urllib "unknown url type" when origin is missing a scheme (legacy misconfig)
        return False, f"Invalid health URL {url!r}: {e}"


def _origin_of_health_url(url: str) -> str:
    """Strip /api/health suffix for comparison."""
    suffix = "/api/health"
    if url.endswith(suffix):
        return url[: -len(suffix)]
    return url


def _is_local_dev_origin(origin: str) -> bool:
    o = origin.rstrip("/").lower()
    return o in ("http://127.0.0.1:8000", "http://localhost:8000")


def check_backend_http_ready(timeout_s: float = 5.0) -> tuple[bool, str]:
    """
    Return (True, "") if GET /api/health returns 2xx.
    Otherwise (False, human-readable error).

    Tries the primary URL from get_backend_health_url(); if that fails and the primary origin
    is not already local, retries **http://127.0.0.1:8000/api/health** once.
    """
    primary = get_backend_health_url()
    ok, err = _probe_health_url(primary, timeout_s)
    if ok:
        return True, ""

    local_url = _health_url_for_base(LOCAL_FALLBACK_BASE)
    primary_origin = _origin_of_health_url(primary)
    if _is_local_dev_origin(primary_origin):
        return False, err

    ok2, err2 = _probe_health_url(local_url, timeout_s)
    if ok2:
        return True, ""

    return (
        False,
        f"{err} | fallback {local_url}: {err2}",
    )


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
