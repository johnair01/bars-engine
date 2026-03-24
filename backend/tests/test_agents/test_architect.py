"""Tests for the Architect agent (quest generation)."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient
from pydantic_ai.models.test import TestModel

from app.agents._deps import AgentDeps
from app.agents.architect import QuestDraft, architect_agent, deterministic_architect_draft
from app.main import app

# ---------------------------------------------------------------------------
# Unit: deterministic fallback
# ---------------------------------------------------------------------------


class TestDeterministicFallback:
    def test_produces_valid_quest_draft(self):
        draft = deterministic_architect_draft("I am afraid to share my work")
        assert isinstance(draft, QuestDraft)
        assert "afraid to share" in draft.title.lower() or "afraid to share" in draft.description.lower()
        assert draft.confidence == 0.3
        assert draft.grammar == "epiphany_bridge"

    def test_kotter_grammar(self):
        draft = deterministic_architect_draft("Build community trust", quest_grammar="kotter")
        assert draft.grammar == "kotter"

    def test_truncates_long_lock(self):
        long_lock = "x" * 200
        draft = deterministic_architect_draft(long_lock)
        assert len(draft.title) <= 70  # "Quest: " + 60 chars


# ---------------------------------------------------------------------------
# Unit: agent with TestModel
# ---------------------------------------------------------------------------


class TestArchitectAgent:
    @pytest.mark.asyncio
    async def test_agent_output_type(self):
        """Verify the agent produces a QuestDraft with TestModel."""
        # Create a mock DB that returns empty results synchronously
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_result.scalar_one_or_none.return_value = None
        mock_result.scalar.return_value = 0
        mock_result.all.return_value = []
        mock_db.execute.return_value = mock_result

        deps = AgentDeps(db=mock_db, player_id=None)

        with architect_agent.override(model=TestModel()):
            result = await architect_agent.run(
                "Design a quest for: I am afraid to share my work",
                deps=deps,
            )
            assert isinstance(result.output, QuestDraft)


# ---------------------------------------------------------------------------
# Route: deterministic path (no API key)
# ---------------------------------------------------------------------------


class TestArchitectRoute:
    @pytest.mark.asyncio
    async def test_deterministic_route(self, monkeypatch):
        """When openai_api_key is empty, the route uses the deterministic fallback."""
        from app import config

        monkeypatch.setattr(config.settings, "openai_api_key", "")

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/agents/architect/draft",
                json={"narrative_lock": "I am afraid to share my work"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["agent"] == "architect"
        assert data["deterministic"] is True
        assert "output" in data
        assert "title" in data["output"]

    @pytest.mark.asyncio
    async def test_ai_route_with_test_model(self, monkeypatch):
        """When openai_api_key is set, the route uses the AI agent (TestModel override)."""
        from app import config

        monkeypatch.setattr(config.settings, "openai_api_key", "test-key")

        with architect_agent.override(model=TestModel()):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                response = await client.post(
                    "/api/agents/architect/draft",
                    json={"narrative_lock": "I am afraid to share my work"},
                )

        assert response.status_code == 200
        data = response.json()
        assert data["agent"] == "architect"
        assert data["deterministic"] is False
