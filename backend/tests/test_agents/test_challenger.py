"""Tests for the Challenger agent (move proposals)."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient
from pydantic_ai.models.test import TestModel

from app.agents._deps import AgentDeps
from app.agents.challenger import MoveProposal, challenger_agent, deterministic_challenger_proposal
from app.main import app

# ---------------------------------------------------------------------------
# Unit: deterministic fallback
# ---------------------------------------------------------------------------


class TestDeterministicFallback:
    def test_produces_valid_move_proposal(self):
        proposal = deterministic_challenger_proposal()
        assert isinstance(proposal, MoveProposal)
        assert proposal.recommended_move is not None
        assert proposal.recommended_move == "declare_intention"

    def test_with_quest_id(self):
        proposal = deterministic_challenger_proposal(quest_id="quest-123")
        assert isinstance(proposal, MoveProposal)
        assert len(proposal.available_moves) > 0

    def test_has_reasoning(self):
        proposal = deterministic_challenger_proposal()
        assert proposal.reasoning != ""
        assert proposal.energy_assessment != ""


# ---------------------------------------------------------------------------
# Unit: agent with TestModel
# ---------------------------------------------------------------------------


class TestChallengerAgent:
    @pytest.mark.asyncio
    async def test_agent_output_type(self):
        """Verify the agent produces a MoveProposal with TestModel."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_result.scalar_one_or_none.return_value = None
        mock_result.scalar.return_value = 0
        mock_result.all.return_value = []
        mock_db.execute.return_value = mock_result

        deps = AgentDeps(db=mock_db, player_id=None)

        with challenger_agent.override(model=TestModel()):
            result = await challenger_agent.run(
                "Propose available moves for the current player.",
                deps=deps,
            )
            assert isinstance(result.output, MoveProposal)


# ---------------------------------------------------------------------------
# Route: deterministic path (no API key) and AI path
# ---------------------------------------------------------------------------


class TestChallengerRoute:
    @pytest.mark.asyncio
    async def test_deterministic_route(self, monkeypatch):
        """When openai_api_key is empty, the route uses the deterministic fallback."""
        from app import config

        monkeypatch.setattr(config.settings, "openai_api_key", "")

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/agents/challenger/propose",
                json={"quest_id": None},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["agent"] == "challenger"
        assert data["deterministic"] is True
        assert "output" in data
        assert "recommended_move" in data["output"]

    @pytest.mark.asyncio
    async def test_ai_route_with_test_model(self, monkeypatch):
        """When openai_api_key is set, the route uses the AI agent (TestModel override)."""
        from app import config

        monkeypatch.setattr(config.settings, "openai_api_key", "test-key")

        with challenger_agent.override(model=TestModel()):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                response = await client.post(
                    "/api/agents/challenger/propose",
                    json={"quest_id": None},
                )

        assert response.status_code == 200
        data = response.json()
        assert data["agent"] == "challenger"
        assert data["deterministic"] is False
