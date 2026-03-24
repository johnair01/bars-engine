"""Tests for MCP HTTP health probe (strand_run gate)."""

from unittest import mock

from app.mcp_health import check_backend_http_ready, get_backend_health_url


def test_get_backend_health_url_default():
    with mock.patch.dict("os.environ", {}, clear=True):
        # May still read .env in Settings — only assert suffix
        assert get_backend_health_url().endswith("/api/health")


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
