"""Tests for the Diplomat agent (community guidance)."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient
from pydantic_ai.models.test import TestModel

from app.agents._deps import AgentDeps
from app.agents.diplomat import CommunityGuidance, deterministic_diplomat_guidance, diplomat_agent
from app.main import app

# ---------------------------------------------------------------------------
# Unit: deterministic fallback
# ---------------------------------------------------------------------------


class TestDeterministicFallback:
    def test_produces_valid_guidance(self):
        guidance = deterministic_diplomat_guidance()
        assert isinstance(guidance, CommunityGuidance)
        assert guidance.message != ""

    def test_has_onboarding_step(self):
        guidance = deterministic_diplomat_guidance()
        assert guidance.onboarding_next_step is not None

    def test_has_bar_sharing_suggestions(self):
        guidance = deterministic_diplomat_guidance()
        assert len(guidance.bar_sharing_suggestions) > 0
        assert guidance.tone == "warm"


# ---------------------------------------------------------------------------
# Unit: agent with TestModel
# ---------------------------------------------------------------------------


class TestDiplomatAgent:
    @pytest.mark.asyncio
    async def test_agent_output_type(self):
        """Verify the agent produces a CommunityGuidance with TestModel."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_result.scalar_one_or_none.return_value = None
        mock_result.scalar.return_value = 0
        mock_result.all.return_value = []
        mock_db.execute.return_value = mock_result

        deps = AgentDeps(db=mock_db, player_id=None)

        with diplomat_agent.override(model=TestModel()):
            result = await diplomat_agent.run(
                "Guide this player on community engagement and next steps.",
                deps=deps,
            )
            assert isinstance(result.output, CommunityGuidance)


# ---------------------------------------------------------------------------
# Route: deterministic path (no API key) and AI path
# ---------------------------------------------------------------------------


class TestDiplomatRoute:
    @pytest.mark.asyncio
    async def test_deterministic_route(self, monkeypatch):
        """When openai_api_key is empty, the route uses the deterministic fallback."""
        from app import config

        monkeypatch.setattr(config.settings, "openai_api_key", "")

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/agents/diplomat/guide",
                json={},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["agent"] == "diplomat"
        assert data["deterministic"] is True
        assert "output" in data
        assert "message" in data["output"]

    @pytest.mark.asyncio
    async def test_ai_route_with_test_model(self, monkeypatch):
        """When openai_api_key is set, the route uses the AI agent (TestModel override)."""
        from app import config

        monkeypatch.setattr(config.settings, "openai_api_key", "test-key")

        with diplomat_agent.override(model=TestModel()):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                response = await client.post(
                    "/api/agents/diplomat/guide",
                    json={},
                )

        assert response.status_code == 200
        data = response.json()
        assert data["agent"] == "diplomat"
        assert data["deterministic"] is False
