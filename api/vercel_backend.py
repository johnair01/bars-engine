"""
Vercel serverless wrapper for bars-engine FastAPI backend.
Entry point: handler(event, context) — Vercel Python runtime signature.

Environmental variables (set in Vercel dashboard):
  RAILWAY_BACKEND_URL — Railway production URL (e.g. https://bars-enginecore-production.up.railway.app)
  FALLBACK_MSG — Message when backend is unreachable
"""
import os, urllib.request, urllib.error

RAILWAY_URL = os.environ.get("RAILWAY_BACKEND_URL", "https://bars-enginecore-production.up.railway.app").rstrip("/")
FALLBACK = os.environ.get("FALLBACK_MSG", '{"status":"backend_unavailable","service":"bars-engine-v2"}')


def handler(event, context=None):
    path = event.get("path", "/")
    method = event.get("method", "GET")
    query = event.get("query", {})
    headers = event.get("headers", {})

    # Build query string
    qs = ""
    if query:
        qs = "&".join(f"{k}={v}" for k, v in query.items())
        qs = "?" + qs

    url = f"{RAILWAY_URL}{path}{qs}"

    try:
        req = urllib.request.Request(
            url,
            method=method,
            headers={k.title(): v for k, v in headers.items()},
        )
        body = event.get("body")
        if body and method not in ("GET", "HEAD"):
            req.data = body.encode() if isinstance(body, str) else body

        with urllib.request.urlopen(req, timeout=15) as resp:
            resp_body = resp.read()
            content_type = resp.headers.get("Content-Type", "application/json")
            return {
                "statusCode": resp.status,
                "body": resp_body.decode("utf-8"),
                "headers": {
                    "Content-Type": content_type,
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                },
            }

    except urllib.error.HTTPError as e:
        return {
            "statusCode": e.code,
            "body": e.read().decode("utf-8") if e.fp else f'{{"error":"HTTP {e.code}"}}',
            "headers": {"Content-Type": "application/json"},
        }

    except urllib.error.URLError as e:
        return {
            "statusCode": 503,
            "body": FALLBACK,
            "headers": {"Content-Type": "application/json"},
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": f'{{"error":"internal_error","detail":"{str(e)}"}}',
            "headers": {"Content-Type": "application/json"},
        }
