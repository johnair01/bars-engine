"""
Vercel serverless wrapper for bars-engine FastAPI backend.
Proxies to Railway backend when available, provides local fallback.
"""
import os, json, httpx
from urllib.request import HttpRe

class BufferHTTPHandler:
    """Minimal HTTP handler for Vercel serverless."""
    
    def __init__(self, target_url):
        self.target_url = target_url.rstrip('/')
    
    def get(self, path="/"):
        url = f"{self.target_url}{path}"
        try:
            import urllib.request
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=10) as resp:
                return {
                    "status": resp.status,
                    "headers": dict(resp.headers),
                    "body": resp.read().decode("utf-8")
                }
        except Exception as e:
            return {"status": 502, "error": str(e)}

handler = BufferHTTPHandler(os.environ.get("BARS_ENGINE_URL", "https://bars-enginecore-production.up.railway.app"))

def handler(event, context=None):
    path = event.get("path", "/")
    method = event.get("method", "GET").lower()
    
    result = handler.get(path)
    return {
        "statusCode": result["status"],
        "body": result.get("body", result.get("error", "")),
        "headers": {"Content-Type": "application/json"}
    }
