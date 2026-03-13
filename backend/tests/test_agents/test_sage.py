"""Tests for the Sage agent (orchestration meta-agent)."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient
from pydantic_ai.models.test import TestModel

from app.agents._deps import AgentDeps
from app.agents.sage import SageResponse, sage_agent, deterministic_sage_response
from app.main import app


# ---------------------------------------------------------------------------
# Unit: deterministic fallback
# ---------------------------------------------------------------------------


class TestDeterministicFallback:
    def test_produces_valid_response(self):
        response = deterministic_sage_response("test")
        assert isinstance(response, SageResponse)
        assert response.synthesis != ""

    def test_has_legibility_note(self):
        response = deterministic_sage_response("What should I focus on?")
        assert response.legibility_note is not None

    def test_consulted_agents_empty_for_deterministic(self):
        response = deterministic_sage_response("test")
        assert response.consulted_agents == []


# ---------------------------------------------------------------------------
# Unit: agent with TestModel
# ---------------------------------------------------------------------------


class TestSageAgent:
    @pytest.mark.asyncio
    async def test_agent_output_type(self):
        """Verify the agent produces a SageResponse with TestModel.

        Note: Sage's consult_* tools may be called by TestModel but will fail
        since the sub-agents also need TestModel — that's OK, the tool will
        return an error string which the Sage can still process.
        """
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_result.scalar_one_or_none.return_value = None
        mock_result.scalar.return_value = 0
        mock_result.all.return_value = []
        mock_db.execute.return_value = mock_result

        deps = AgentDeps(db=mock_db, player_id=None)

        with sage_agent.override(model=TestModel()):
            result = await sage_agent.run(
                "What should I focus on?",
                deps=deps,
            )
            assert isinstance(result.output, SageResponse)


# ---------------------------------------------------------------------------
# Route: deterministic path (no API key) and AI path
# ---------------------------------------------------------------------------


class TestSageRoute:
    @pytest.mark.asyncio
    async def test_deterministic_route(self, monkeypatch):
        """When openai_api_key is empty, the route uses the deterministic fallback."""
        from app import config

        monkeypatch.setattr(config.settings, "openai_api_key", "")

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/agents/sage/consult",
                json={"question": "What should I focus on?"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["agent"] == "sage"
        assert data["deterministic"] is True
        assert "output" in data
        assert "synthesis" in data["output"]

    @pytest.mark.asyncio
    async def test_ai_route_with_test_model(self, monkeypatch):
        """When openai_api_key is set, the route uses the AI agent (TestModel override)."""
        from app import config

        monkeypatch.setattr(config.settings, "openai_api_key", "test-key")

        with sage_agent.override(model=TestModel()):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                response = await client.post(
                    "/api/agents/sage/consult",
                    json={"question": "What should I focus on?"},
                )

        assert response.status_code == 200
        data = response.json()
        assert data["agent"] == "sage"
        assert data["deterministic"] is False
