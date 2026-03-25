"""Tests for MCP HTTP health probe (strand_run gate)."""

import inspect
from unittest import mock

from app import mcp_server
from app.mcp_health import check_backend_http_ready, get_backend_health_url


def test_strand_run_is_sync_mcp_tool():
    """Regression: async def MCP tool + FastMCP thread pool broke asyncpg (different event loop)."""
    assert not inspect.iscoroutinefunction(mcp_server.strand_run)


def test_get_backend_health_url_mcp_override_wins():
    with mock.patch.dict(
        "os.environ",
        {
            "BARS_MCP_HEALTH_ORIGIN": "http://127.0.0.1:8000",
            "NEXT_PUBLIC_BACKEND_URL": "https://remote.example.com",
        },
        clear=True,
    ):
        assert get_backend_health_url() == "http://127.0.0.1:8000/api/health"


def test_get_backend_health_url_default():
    with mock.patch.dict("os.environ", {}, clear=True):
        assert get_backend_health_url() == "http://127.0.0.1:8000/api/health"


def test_get_backend_health_url_bare_railway_host_gets_https():
    with mock.patch.dict(
        "os.environ",
        {"NEXT_PUBLIC_BACKEND_URL": "bars-enginecore-production.up.railway.app"},
        clear=True,
    ):
        assert (
            get_backend_health_url()
            == "https://bars-enginecore-production.up.railway.app/api/health"
        )


def test_get_backend_health_url_localhost_no_scheme_gets_http():
    with mock.patch.dict("os.environ", {"BARS_BACKEND_URL": "localhost:8000"}, clear=True):
        assert get_backend_health_url() == "http://localhost:8000/api/health"


def test_get_backend_health_url_explicit_scheme_unchanged():
    with mock.patch.dict(
        "os.environ",
        {"NEXT_PUBLIC_BACKEND_URL": "http://127.0.0.1:8000"},
        clear=True,
    ):
        assert get_backend_health_url() == "http://127.0.0.1:8000/api/health"


@mock.patch("app.mcp_health.urllib.request.urlopen")
def test_check_backend_http_ready_ok(mock_urlopen):
    mock_resp = mock.MagicMock()
    mock_resp.__enter__.return_value = mock_resp
    mock_resp.__exit__.return_value = None
    mock_resp.status = 200
    mock_urlopen.return_value = mock_resp

    ok, err = check_backend_http_ready()
    assert ok is True
    assert err == ""


@mock.patch("app.mcp_health.urllib.request.urlopen")
def test_check_backend_http_ready_unreachable(mock_urlopen):
    import urllib.error

    mock_urlopen.side_effect = urllib.error.URLError("refused")

    ok, err = check_backend_http_ready()
    assert ok is False
    assert "Cannot reach" in err
    # Primary is already local (empty env) — no duplicate probe to same origin
    assert mock_urlopen.call_count == 1


@mock.patch("app.mcp_health.urllib.request.urlopen")
def test_check_backend_http_ready_fallback_local_after_remote_fails(mock_urlopen):
    import urllib.error

    ok_resp = mock.MagicMock()
    ok_resp.__enter__.return_value = ok_resp
    ok_resp.__exit__.return_value = None
    ok_resp.status = 200

    mock_urlopen.side_effect = [
        urllib.error.URLError("refused"),
        ok_resp,
    ]

    with mock.patch.dict(
        "os.environ",
        {"NEXT_PUBLIC_BACKEND_URL": "https://remote.example.com"},
        clear=True,
    ):
        ok, err = check_backend_http_ready()
    assert ok is True
    assert err == ""
    assert mock_urlopen.call_count == 2


@mock.patch("app.mcp_health.urllib.request.urlopen")
@mock.patch("app.mcp_health.get_backend_health_url")
def test_check_backend_http_ready_fallback_after_malformed_primary(mock_get_url, mock_urlopen):
    """Legacy misconfig: host/path without scheme → ValueError; then local fallback."""
    mock_get_url.return_value = "bars-enginecore-production.up.railway.app/api/health"
    ok_resp = mock.MagicMock()
    ok_resp.__enter__.return_value = ok_resp
    ok_resp.__exit__.return_value = None
    ok_resp.status = 200
    mock_urlopen.return_value = ok_resp

    ok, err = check_backend_http_ready()
    assert ok is True
    assert err == ""
    mock_urlopen.assert_called_once()
    called = mock_urlopen.call_args[0][0]
    assert "127.0.0.1:8000" in getattr(called, "full_url", str(called))
