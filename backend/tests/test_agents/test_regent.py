"""Tests for the Regent agent (campaign assessment)."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient
from pydantic_ai.models.test import TestModel

from app.agents._deps import AgentDeps
from app.agents.regent import CampaignAssessment, deterministic_regent_assessment, regent_agent
from app.main import app

# ---------------------------------------------------------------------------
# Unit: deterministic fallback
# ---------------------------------------------------------------------------


class TestDeterministicFallback:
    def test_produces_valid_assessment(self):
        assessment = deterministic_regent_assessment("test-instance")
        assert isinstance(assessment, CampaignAssessment)
        assert assessment.instance_id == "test-instance"

    def test_has_default_kotter_stage(self):
        assessment = deterministic_regent_assessment("inst-1")
        assert assessment.current_kotter_stage == 1

    def test_has_recommended_actions(self):
        assessment = deterministic_regent_assessment("inst-1")
        assert len(assessment.recommended_actions) > 0
        assert assessment.reasoning != ""


# ---------------------------------------------------------------------------
# Unit: agent with TestModel
# ---------------------------------------------------------------------------


class TestRegentAgent:
    @pytest.mark.asyncio
    async def test_agent_output_type(self):
        """Verify the agent produces a CampaignAssessment with TestModel."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_result.scalar_one_or_none.return_value = None
        mock_result.scalar.return_value = 0
        mock_result.all.return_value = []
        mock_db.execute.return_value = mock_result

        deps = AgentDeps(db=mock_db, player_id=None)

        with regent_agent.override(model=TestModel()):
            result = await regent_agent.run(
                "Assess the campaign structure for instance test-123.",
                deps=deps,
            )
            assert isinstance(result.output, CampaignAssessment)


# ---------------------------------------------------------------------------
# Route: deterministic path (no API key) and AI path
# ---------------------------------------------------------------------------


class TestRegentRoute:
    @pytest.mark.asyncio
    async def test_deterministic_route(self, monkeypatch):
        """When openai_api_key is empty, the route uses the deterministic fallback."""
        from app import config

        monkeypatch.setattr(config.settings, "openai_api_key", "")

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/agents/regent/assess",
                json={"instance_id": "test-123"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["agent"] == "regent"
        assert data["deterministic"] is True
        assert "output" in data
        assert "instance_id" in data["output"]

    @pytest.mark.asyncio
    async def test_ai_route_with_test_model(self, monkeypatch):
        """When openai_api_key is set, the route uses the AI agent (TestModel override)."""
        from app import config

        monkeypatch.setattr(config.settings, "openai_api_key", "test-key")

        with regent_agent.override(model=TestModel()):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                response = await client.post(
                    "/api/agents/regent/assess",
                    json={"instance_id": "test-123"},
                )

        assert response.status_code == 200
        data = response.json()
        assert data["agent"] == "regent"
        assert data["deterministic"] is False
