"""Tests for the Agent Mind Model (CRUD + decision loop)."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.agents.mind import _mind_store, create_mind, get_mind, step_mind
from app.main import app

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def clear_mind_store():
    """Clear the in-memory mind store between tests."""
    _mind_store.clear()
    yield
    _mind_store.clear()


# ---------------------------------------------------------------------------
# Unit: create_mind
# ---------------------------------------------------------------------------


class TestCreateMind:
    def test_creates_with_valid_params(self):
        mind = create_mind(
            nation="red",
            archetype="warrior",
            goal="test goal",
            narrative_lock="stuck on X",
        )
        assert mind.agent_id is not None
        assert mind.nation == "red"
        assert mind.archetype == "warrior"
        assert mind.goal == "test goal"
        assert mind.narrative_lock == "stuck on X"
        assert mind.emotional_state == "neutrality"
        assert mind.energy == 0.5

    def test_creates_with_custom_energy(self):
        mind = create_mind(
            nation="blue",
            archetype="sage",
            goal="build structure",
            narrative_lock="no plan",
            emotional_state="joy",
            energy=0.8,
        )
        assert mind.emotional_state == "joy"
        assert mind.energy == 0.8


# ---------------------------------------------------------------------------
# Unit: step_mind
# ---------------------------------------------------------------------------


class TestStepMind:
    def test_step_changes_energy(self):
        mind = create_mind(
            nation="red",
            archetype="warrior",
            goal="test",
            narrative_lock="lock",
            energy=0.5,
        )
        original_energy = mind.energy
        stepped = step_mind(mind.agent_id)
        assert stepped is not None
        assert stepped.energy != original_energy

    def test_step_low_energy_restores(self):
        mind = create_mind(
            nation="red",
            archetype="warrior",
            goal="test",
            narrative_lock="lock",
            energy=0.2,
        )
        stepped = step_mind(mind.agent_id)
        assert stepped is not None
        assert stepped.emotional_state == "sadness"
        assert stepped.energy > 0.2

    def test_step_high_energy_spends(self):
        mind = create_mind(
            nation="red",
            archetype="warrior",
            goal="test",
            narrative_lock="lock",
            energy=0.8,
        )
        stepped = step_mind(mind.agent_id)
        assert stepped is not None
        assert stepped.emotional_state == "joy"
        assert stepped.energy < 0.8

    def test_step_not_found(self):
        result = step_mind("nonexistent-id")
        assert result is None


# ---------------------------------------------------------------------------
# Unit: get_mind
# ---------------------------------------------------------------------------


class TestGetMind:
    def test_get_existing(self):
        mind = create_mind(
            nation="green",
            archetype="diplomat",
            goal="connect",
            narrative_lock="isolated",
        )
        retrieved = get_mind(mind.agent_id)
        assert retrieved is not None
        assert retrieved.agent_id == mind.agent_id
        assert retrieved.nation == "green"

    def test_get_not_found(self):
        result = get_mind("nonexistent-id")
        assert result is None


# ---------------------------------------------------------------------------
# Route tests
# ---------------------------------------------------------------------------


class TestMindRoutes:
    @pytest.mark.asyncio
    async def test_create_route(self):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/agents/mind/create",
                json={
                    "nation": "red",
                    "archetype": "warrior",
                    "goal": "test goal",
                    "narrative_lock": "stuck",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "agent_id" in data
        assert data["nation"] == "red"

    @pytest.mark.asyncio
    async def test_step_route(self):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            # Create first
            create_resp = await client.post(
                "/api/agents/mind/create",
                json={
                    "nation": "blue",
                    "archetype": "sage",
                    "goal": "structure",
                    "narrative_lock": "chaos",
                },
            )
            agent_id = create_resp.json()["agent_id"]

            # Then step
            step_resp = await client.post(f"/api/agents/mind/{agent_id}/step")

        assert step_resp.status_code == 200
        data = step_resp.json()
        assert data["agent_id"] == agent_id

    @pytest.mark.asyncio
    async def test_get_route(self):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            # Create first
            create_resp = await client.post(
                "/api/agents/mind/create",
                json={
                    "nation": "green",
                    "archetype": "diplomat",
                    "goal": "connect",
                    "narrative_lock": "isolated",
                },
            )
            agent_id = create_resp.json()["agent_id"]

            # Then get
            get_resp = await client.get(f"/api/agents/mind/{agent_id}")

        assert get_resp.status_code == 200
        data = get_resp.json()
        assert data["agent_id"] == agent_id
        assert data["nation"] == "green"

    @pytest.mark.asyncio
    async def test_get_not_found_route(self):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.get("/api/agents/mind/nonexistent")

        assert response.status_code == 404
