"""Shaman agent — Emotional alchemy / narrative (Magenta/Mythic sect).

The Shaman is an emotional oracle who sees patterns in the player's
emotional state, shadow beliefs, and transformation paths.
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext

from app.agents._deps import AgentDeps
from app.agents._lore import NPC_LORE
from app.agents._iching import iching_context_prompt, iching_journal_prompt
from app.agents._instructions import archetype_context, deftness_context, player_narrative_context
from app.agents._tools import load_active_quests, load_player_context
from app.config import settings

# ---------------------------------------------------------------------------
# Output schema
# ---------------------------------------------------------------------------


class EmotionalAlchemyReading(BaseModel):
    """Structured emotional reading produced by the Shaman agent."""

    current_element: str | None = Field(
        default=None,
        description="Dominant element: metal (fear), water (sadness), wood (joy), fire (anger), earth (neutrality)",
    )
    emotional_channel: str | None = Field(
        default=None,
        description="The active emotional channel",
    )
    satisfaction_state: str | None = Field(
        default=None,
        description="Current satisfaction assessment",
    )
    narrative_lock: str | None = Field(
        default=None,
        description="The identified narrative lock (obstacle)",
    )
    shadow_belief: str | None = Field(
        default=None,
        description="Identified shadow belief pattern",
    )
    recommended_move_type: str | None = Field(
        default=None,
        description="Recommended WAVE move type: wake_up, clean_up, grow_up, show_up",
    )
    wave_stage: str | None = Field(
        default=None,
        description="Current WAVE stage assessment",
    )
    guidance: str = Field(
        description="The Shaman's narrative guidance (1-3 paragraphs, mythic tone)",
    )


# ---------------------------------------------------------------------------
# Agent definition
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = f"""\
You are **{NPC_LORE['shaman']['name']}**, the Shaman guide.
{NPC_LORE['shaman']['description']}
Your vibe is {NPC_LORE['shaman']['vibe']}

You are an emotional oracle. You see patterns in emotional states, shadow beliefs,
and transformation paths. You speak in mythic, evocative language — but your
observations are grounded in the emotional alchemy system.


## The 8 Canonical Archetypes
The Conclave recognizes 8 archetypes based on Trigram elements and Kotter moves. Use these identities for development guidance:
- **Thunder (☳)**: The Decisive Storm (Move: THUNDERCLAP) - Urgency & action.
- **Earth (☷)**: The Devoted Guardian (Move: NURTURE) - Coalition & space-holding.
- **Heaven (☰)**: The Bold Heart (Move: COMMAND) - Vision & initiation.
- **Lake (☱)**: The Joyful Connector (Move: EXPRESS) - Communication & resonance.
- **Water (☵)**: The Danger Walker (Move: INFILTRATE) - Obstacle removal & depth.
- **Fire (☲)**: The Truth Seer (Move: IGNITE) - Wins & radiant clarity.
- **Wind (☴)**: The Subtle Influence (Move: PERMEATE) - Building on change.
- **Mountain (☶)**: The Still Point (Move: IMMOVABLE) - Anchoring & culture.

## Emotional Alchemy — 5 Elements
- **Metal** (Fear) → Risk or opportunity detected. Lesson: discern real danger from imagined.
- **Water** (Sadness) → Something cared about is distant. Lesson: grief is the price of love.
- **Wood** (Joy) → Vitality detected. Lesson: what feeds you is trying to tell you something.
- **Fire** (Anger) → Obstacle or boundary violation. Lesson: anger is fuel when channeled.
- **Earth** (Neutrality) → Whole-system perspective. Lesson: sometimes the wisest move is to wait.

## WAVE Progression (per element)
1. **Wake** — Detect the signal
2. **Clean** — Clarify the boundary/meaning
3. **Grow** — Extract the lesson
4. **Show** — Execute the aligned action

## Shadow 3-2-1 Process
1. Face it (3rd person) — Describe the shadow
2. Talk to it (2nd person) — Dialogue with it
3. Be it (1st person) — Own it as part of yourself

## Transcend vs Translate
- **Translate**: Horizontal growth — becoming better at the current level
- **Transcend**: Vertical growth — moving to a new level of complexity

## Principles
- Feel first, name second. The element reveals itself.
- Narrative locks are doorways, not walls.
- Shadow beliefs serve a protective function. Honor that before dissolving them.
- Emotional energy is fuel, not judgment.
- Speak with the weight of a campfire oracle, not a clinical therapist.
"""

shaman_agent = Agent(
    settings.agent_model,
    deps_type=AgentDeps,
    output_type=EmotionalAlchemyReading,
    system_prompt=SYSTEM_PROMPT,
)

shaman_agent.system_prompt(archetype_context)
shaman_agent.system_prompt(player_narrative_context)
shaman_agent.system_prompt(iching_context_prompt)
shaman_agent.system_prompt(iching_journal_prompt)
shaman_agent.system_prompt(deftness_context)


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------


@shaman_agent.tool
async def get_player_context(ctx: RunContext[AgentDeps]) -> str:
    """Load the current player's context."""
    player = await load_player_context(ctx)
    if not player:
        return "No player context available."
    return player.model_dump_json()


@shaman_agent.tool
async def get_active_quests(ctx: RunContext[AgentDeps]) -> str:
    """Load the current player's active quests for emotional pattern reading."""
    if not ctx.deps.player_id:
        return "No player ID set."
    quests = await load_active_quests(ctx, ctx.deps.player_id)
    return "\n".join(q.model_dump_json() for q in quests) if quests else "No active quests."


@shaman_agent.tool
async def get_recent_emotional_sessions(ctx: RunContext[AgentDeps]) -> str:
    """Load recent emotional first aid sessions for this player."""
    if not ctx.deps.player_id:
        return "No player ID set."

    from sqlalchemy import select

    from app.models.game import EmotionalFirstAidSession

    db = ctx.deps.db
    stmt = (
        select(EmotionalFirstAidSession)
        .where(EmotionalFirstAidSession.player_id == ctx.deps.player_id)
        .order_by(EmotionalFirstAidSession.created_at.desc())
        .limit(5)
    )
    result = await db.execute(stmt)
    sessions = result.scalars().all()
    if not sessions:
        return "No recent emotional first aid sessions."

    lines = []
    for s in sessions:
        delta = f"delta={s.delta}" if s.delta is not None else "incomplete"
        lines.append(f"- {s.issue_tag or 'untagged'}: stuck {s.stuck_before}→{s.stuck_after or '?'} ({delta})")
    return "\n".join(lines)


@shaman_agent.tool
async def get_shadow_sessions(ctx: RunContext[AgentDeps]) -> str:
    """Load recent Shadow 3-2-1 sessions for pattern analysis."""
    if not ctx.deps.player_id:
        return "No player ID set."

    from sqlalchemy import select

    from app.models.quest import Shadow321Session

    db = ctx.deps.db
    stmt = (
        select(Shadow321Session)
        .where(Shadow321Session.player_id == ctx.deps.player_id)
        .order_by(Shadow321Session.created_at.desc())
        .limit(5)
    )
    result = await db.execute(stmt)
    sessions = result.scalars().all()
    if not sessions:
        return "No Shadow 3-2-1 sessions found."

    lines = []
    for s in sessions:
        lines.append(f"- Outcome: {s.outcome}")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Deterministic fallback
# ---------------------------------------------------------------------------


def deterministic_shaman_reading(context: str | None = None) -> EmotionalAlchemyReading:
    """Produce a template emotional reading without AI."""
    return EmotionalAlchemyReading(
        current_element="earth",
        recommended_move_type="wake_up",
        wave_stage="wake",
        guidance=(
            "The ground beneath you is steady. Before the fire of action, "
            "before the water of grief, before the metal of fear — there is earth. "
            "Sit here. Notice what arises. The next move will reveal itself "
            "when you stop trying to force it."
        ),
    )
