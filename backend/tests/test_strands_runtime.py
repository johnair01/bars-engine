from unittest.mock import AsyncMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.database import get_db
from app.main import app
from app.routes.strands import _reset_runtime_guards_for_tests
from app.strand.runner import validate_strand_runtime_request


@pytest.fixture
def override_db():
    async def _fake_db():
        return object()

    app.dependency_overrides[get_db] = _fake_db
    yield
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture(autouse=True)
async def reset_runtime_guard_state():
    await _reset_runtime_guards_for_tests()
    yield
    await _reset_runtime_guards_for_tests()


@pytest.mark.asyncio
async def test_strands_run_rejects_when_runtime_disabled(monkeypatch, override_db):
    monkeypatch.setattr("app.routes.strands.settings.environment", "development")
    monkeypatch.setattr("app.routes.strands.settings.strand_runtime_enabled", False)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/strands/run", json={"type": "diagnostic", "subject": "test subject"})

    assert response.status_code == 503


@pytest.mark.asyncio
async def test_strands_run_rejects_create_branch(monkeypatch, override_db):
    monkeypatch.setattr("app.routes.strands.settings.environment", "development")
    monkeypatch.setattr("app.routes.strands.settings.strand_runtime_enabled", True)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/strands/run",
            json={"type": "diagnostic", "subject": "test subject", "create_branch": True},
        )

    assert response.status_code == 400
    assert "create_branch" in response.text


@pytest.mark.asyncio
async def test_strands_run_requires_auth_in_production(monkeypatch, override_db):
    monkeypatch.setattr("app.routes.strands.settings.strand_runtime_enabled", True)
    monkeypatch.setattr("app.routes.strands.settings.environment", "production")
    monkeypatch.setattr("app.routes.strands.settings.strand_require_auth_in_production", True)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/strands/run", json={"type": "diagnostic", "subject": "test subject"})

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_strands_run_executes_with_valid_request(monkeypatch, override_db):
    monkeypatch.setattr("app.routes.strands.settings.strand_runtime_enabled", True)
    monkeypatch.setattr("app.routes.strands.settings.environment", "production")
    monkeypatch.setattr("app.routes.strands.settings.strand_require_auth_in_production", True)

    expected = {"strand_bar_id": "bar_1", "output_bar_ids": ["bar_2"], "branch": None, "provenance": {"ok": True}}
    run_mock = AsyncMock(return_value=expected)
    monkeypatch.setattr("app.routes.strands.run_strand", run_mock)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/strands/run",
            json={"type": "diagnostic", "subject": "test subject"},
            cookies={"bars_player_id": "player_1"},
        )

    assert response.status_code == 200
    assert response.json() == expected
    run_mock.assert_awaited_once()


@pytest.mark.asyncio
async def test_strands_run_rejects_unsupported_sects(monkeypatch, override_db):
    monkeypatch.setattr("app.routes.strands.settings.environment", "development")
    monkeypatch.setattr("app.routes.strands.settings.strand_runtime_enabled", True)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/strands/run",
            json={"type": "diagnostic", "subject": "test subject", "sects": ["wizard"]},
        )

    assert response.status_code == 400
    assert "Unsupported sects requested" in response.text


@pytest.mark.asyncio
async def test_strands_run_idempotency_replay(monkeypatch, override_db):
    monkeypatch.setattr("app.routes.strands.settings.environment", "development")
    monkeypatch.setattr("app.routes.strands.settings.strand_runtime_enabled", True)

    expected = {"strand_bar_id": "bar_1", "output_bar_ids": ["bar_2"], "branch": None, "provenance": {"ok": True}}
    run_mock = AsyncMock(return_value=expected)
    monkeypatch.setattr("app.routes.strands.run_strand", run_mock)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r1 = await client.post(
            "/api/strands/run",
            json={"type": "diagnostic", "subject": "test subject"},
            headers={"Idempotency-Key": "idem-1"},
        )
        r2 = await client.post(
            "/api/strands/run",
            json={"type": "diagnostic", "subject": "test subject"},
            headers={"Idempotency-Key": "idem-1"},
        )

    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json() == r2.json()
    assert run_mock.await_count == 1


@pytest.mark.asyncio
async def test_strands_run_idempotency_conflict_on_payload_change(monkeypatch, override_db):
    monkeypatch.setattr("app.routes.strands.settings.environment", "development")
    monkeypatch.setattr("app.routes.strands.settings.strand_runtime_enabled", True)

    expected = {"strand_bar_id": "bar_1", "output_bar_ids": ["bar_2"], "branch": None, "provenance": {"ok": True}}
    run_mock = AsyncMock(return_value=expected)
    monkeypatch.setattr("app.routes.strands.run_strand", run_mock)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r1 = await client.post(
            "/api/strands/run",
            json={"type": "diagnostic", "subject": "test subject"},
            headers={"Idempotency-Key": "idem-2"},
        )
        r2 = await client.post(
            "/api/strands/run",
            json={"type": "diagnostic", "subject": "different subject"},
            headers={"Idempotency-Key": "idem-2"},
        )

    assert r1.status_code == 200
    assert r2.status_code == 409


@pytest.mark.asyncio
async def test_strands_run_rate_limit(monkeypatch, override_db):
    monkeypatch.setattr("app.routes.strands.settings.environment", "development")
    monkeypatch.setattr("app.routes.strands.settings.strand_runtime_enabled", True)
    monkeypatch.setattr("app.routes.strands.settings.strand_rate_limit_enabled", True)
    monkeypatch.setattr("app.routes.strands.settings.strand_rate_limit_window_seconds", 60)
    monkeypatch.setattr("app.routes.strands.settings.strand_rate_limit_max_requests", 2)

    expected = {"strand_bar_id": "bar_1", "output_bar_ids": ["bar_2"], "branch": None, "provenance": {"ok": True}}
    run_mock = AsyncMock(return_value=expected)
    monkeypatch.setattr("app.routes.strands.run_strand", run_mock)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r1 = await client.post("/api/strands/run", json={"type": "diagnostic", "subject": "one"})
        r2 = await client.post("/api/strands/run", json={"type": "diagnostic", "subject": "two"})
        r3 = await client.post("/api/strands/run", json={"type": "diagnostic", "subject": "three"})

    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r3.status_code == 429


def test_validate_strand_runtime_request_limits():
    subject, sects = validate_strand_runtime_request(
        strand_type="diagnostic",
        subject=" valid subject ",
        sects=["shaman", "sage"],
        max_subject_chars=100,
        max_sects=6,
        allowed_sects={"shaman", "sage", "architect"},
    )
    assert subject == "valid subject"
    assert sects == ["shaman", "sage"]

    with pytest.raises(ValueError, match="subject exceeds max length"):
        validate_strand_runtime_request(
            strand_type="diagnostic",
            subject="x" * 120,
            sects=None,
            max_subject_chars=100,
            max_sects=6,
            allowed_sects={"shaman"},
        )
