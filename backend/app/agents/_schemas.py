"""Shared Pydantic models used across multiple agents."""

from __future__ import annotations

from pydantic import BaseModel


class PlayerContext(BaseModel):
    """Summarised player state passed to agent instructions/tools."""

    player_id: str
    name: str
    nation_name: str | None = None
    nation_element: str | None = None
    archetype_name: str | None = None
    archetype_central_conflict: str | None = None
    wave_stage: str | None = None  # wake_up / clean_up / grow_up / show_up
    active_quest_count: int = 0
    energy: float = 0.5  # 0.0–1.0


class QuestSummary(BaseModel):
    """Lightweight quest representation for agent context."""

    quest_id: str
    title: str
    status: str
    kotter_stage: int = 1
    move_type: str | None = None
    emotional_alchemy_tag: str | None = None
    allyship_domain: str | None = None


class MoveInfo(BaseModel):
    """A single canonical move available to a nation."""

    move_id: str
    key: str
    name: str
    nation_name: str
    polarity: str | None = None
    description: str


class CompostableItem(BaseModel):
    """An existing item that a new agent output would obsolete."""

    item_id: str
    item_type: str  # quest, thread, proposal
    title: str
    reason: str  # why this is compostable


class AgentMindState(BaseModel):
    """The 6-variable state model from the Agent Mind Model spec."""

    agent_id: str
    nation: str
    archetype: str
    goal: str
    narrative_lock: str
    emotional_state: str  # fear, anger, sadness, neutrality, joy
    energy: float  # 0.0–1.0
    bars: list[str] = []  # BAR IDs created by this agent


class ReportIssueRequest(BaseModel):
    """Request body for POST /api/agents/report-issue."""

    component: str
    error_message: str
    page_url: str = ""


class GitHubIssueResult(BaseModel):
    """Result of creating (or pre-filling) a GitHub issue."""

    url: str    # issue HTML URL or pre-filled new-issue URL on fallback
    number: int  # 0 on fallback
    title: str
