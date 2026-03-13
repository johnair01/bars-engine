"""Agent Mind Model — CRUD + decision loop for simulated agents.

Implements the 6-variable state model from the Agent Mind Model spec.
"""

from __future__ import annotations

from app.agents._schemas import AgentMindState

# In-memory store for now. Phase 4+ would persist to DB.
_mind_store: dict[str, AgentMindState] = {}

_COUNTER = 0


def _next_id() -> str:
    global _COUNTER
    _COUNTER += 1
    return f"agent-mind-{_COUNTER}"


def create_mind(
    nation: str,
    archetype: str,
    goal: str,
    narrative_lock: str,
    emotional_state: str = "neutrality",
    energy: float = 0.5,
) -> AgentMindState:
    """Create a new agent mind state."""
    agent_id = _next_id()
    mind = AgentMindState(
        agent_id=agent_id,
        nation=nation,
        archetype=archetype,
        goal=goal,
        narrative_lock=narrative_lock,
        emotional_state=emotional_state,
        energy=energy,
    )
    _mind_store[agent_id] = mind
    return mind


def get_mind(agent_id: str) -> AgentMindState | None:
    """Retrieve an agent mind state by ID."""
    return _mind_store.get(agent_id)


def step_mind(agent_id: str) -> AgentMindState | None:
    """Execute one decision loop step for an agent mind.

    Deterministic heuristic:
    1. If energy < 0.3 → emotional_state shifts toward 'sadness', recommend reflection
    2. If energy > 0.7 → emotional_state shifts toward 'joy', recommend action
    3. Otherwise → maintain current state, small energy drift
    """
    mind = _mind_store.get(agent_id)
    if not mind:
        return None

    # Simple decision heuristic
    if mind.energy < 0.3:
        mind.emotional_state = "sadness"
        mind.energy = min(1.0, mind.energy + 0.1)  # Reflection restores energy
    elif mind.energy > 0.7:
        mind.emotional_state = "joy"
        mind.energy = max(0.0, mind.energy - 0.1)  # Action spends energy
    else:
        # Small drift toward neutrality
        mind.emotional_state = "neutrality"
        mind.energy = mind.energy + 0.05 if mind.energy < 0.5 else mind.energy - 0.05

    # Round to avoid float drift
    mind.energy = round(mind.energy, 2)

    _mind_store[agent_id] = mind
    return mind
