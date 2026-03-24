"""Tests for the Shaman agent (emotional alchemy readings)."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient
from pydantic_ai.models.test import TestModel

from app.agents._deps import AgentDeps
from app.agents.shaman import EmotionalAlchemyReading, deterministic_shaman_reading, shaman_agent
from app.main import app

# ---------------------------------------------------------------------------
# Unit: deterministic fallback
# ---------------------------------------------------------------------------


class TestDeterministicFallback:
    def test_produces_valid_reading(self):
        reading = deterministic_shaman_reading()
        assert isinstance(reading, EmotionalAlchemyReading)
        assert reading.guidance != ""

    def test_with_context(self):
        reading = deterministic_shaman_reading(context="feeling stuck")
        assert isinstance(reading, EmotionalAlchemyReading)
        assert reading.guidance != ""

    def test_has_expected_defaults(self):
        reading = deterministic_shaman_reading()
        assert reading.current_element == "earth"
        assert reading.recommended_move_type == "wake_up"
        assert reading.wave_stage == "wake"


# ---------------------------------------------------------------------------
# Unit: agent with TestModel
# ---------------------------------------------------------------------------


class TestShamanAgent:
    @pytest.mark.asyncio
    async def test_agent_output_type(self):
        """Verify the agent produces an EmotionalAlchemyReading with TestModel."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_result.scalar_one_or_none.return_value = None
        mock_result.scalar.return_value = 0
        mock_result.all.return_value = []
        mock_db.execute.return_value = mock_result

        deps = AgentDeps(db=mock_db, player_id=None)

        with shaman_agent.override(model=TestModel()):
            result = await shaman_agent.run(
                "Read the player's emotional state and provide guidance.",
                deps=deps,
            )
            assert isinstance(result.output, EmotionalAlchemyReading)


# ---------------------------------------------------------------------------
# Route: deterministic path (no API key) and AI path
# ---------------------------------------------------------------------------


class TestShamanRoute:
    @pytest.mark.asyncio
    async def test_deterministic_route(self, monkeypatch):
        """When openai_api_key is empty, the route uses the deterministic fallback."""
        from app import config

        monkeypatch.setattr(config.settings, "openai_api_key", "")

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/agents/shaman/read",
                json={"context": "feeling stuck"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["agent"] == "shaman"
        assert data["deterministic"] is True
        assert "output" in data
        assert "guidance" in data["output"]

    @pytest.mark.asyncio
    async def test_ai_route_with_test_model(self, monkeypatch):
        """When openai_api_key is set, the route uses the AI agent (TestModel override)."""
        from app import config

        monkeypatch.setattr(config.settings, "openai_api_key", "test-key")

        with shaman_agent.override(model=TestModel()):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                response = await client.post(
                    "/api/agents/shaman/read",
                    json={"context": "feeling stuck"},
                )

        assert response.status_code == 200
        data = response.json()
        assert data["agent"] == "shaman"
        assert data["deterministic"] is False
