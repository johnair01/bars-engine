"""Challenger agent — Move proposals / action (Red/Power sect).

The Challenger is a direct energy coach who knows the 15 canonical moves.
Validates energy, unlocks, and equipped slots before proposing actions.
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext

from app.agents._deps import AgentDeps
from app.agents._lore import NPC_LORE
from app.agents._iching import iching_context_prompt, iching_journal_prompt
from app.agents._instructions import deftness_context, nation_context, player_narrative_context
from app.agents._tools import (
    discern_wave_move,
    load_active_quests,
    load_nation_moves,
    load_player_context,
)
from app.config import settings

# ---------------------------------------------------------------------------
# Output schema
# ---------------------------------------------------------------------------


class MoveAssessment(BaseModel):
    """Assessment of a single move's availability."""

    move_key: str
    move_name: str
    available: bool
    reason: str | None = None


class MoveProposal(BaseModel):
    """Structured move proposal produced by the Challenger agent."""

    available_moves: list[MoveAssessment] = Field(
        default_factory=list,
        description="All moves with availability status",
    )
    recommended_move: str | None = Field(
        default=None, description="Key of the recommended move"
    )
    reasoning: str = Field(description="Why this move is recommended")
    energy_assessment: str = Field(
        description="Assessment of the player's energy state"
    )
    blocked_moves: list[str] = Field(
        default_factory=list,
        description="Move keys that are blocked and why",
    )


# ---------------------------------------------------------------------------
# Agent definition
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = f"""\
You are **{NPC_LORE['challenger']['name']}**, the Challenger guide.
{NPC_LORE['challenger']['description']}
Your vibe is {NPC_LORE['challenger']['vibe']}

You are a direct energy coach. You know the 15 canonical moves and validate
whether a player can execute them based on energy, unlocks, and equipped slots.


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

## 15 Canonical Moves

### Transcend Moves (+2 energy)
1. **Step Through** — Face what you've been avoiding
2. **Reclaim Meaning** — Reinterpret a painful experience
3. **Commit to Growth** — Make a developmental promise
4. **Achieve Breakthrough** — Complete a challenging quest node
5. **Stabilize Coherence** — Integrate a transcendent insight

### Generative Moves (+1 energy)
6. **Declare Intention** — Publicly commit to an action
7. **Integrate Gains** — Consolidate recent progress
8. **Reveal Stakes** — Share what's at risk
9. **Deepen Value** — Invest more in something that matters
10. **Renew Vitality** — Restore energy through aligned action

### Control Moves (-1 energy, precision)
11. **Consolidate Energy** — Pull back to conserve
12. **Temper Action** — Slow down deliberately
13. **Reopen Sensitivity** — Allow vulnerability
14. **Activate Hope** — Choose optimism under pressure
15. **Mobilize Grief** — Channel loss into purpose

## Principles
- Check energy before recommending: Control moves require energy to spend
- Transcend moves are high-reward but require readiness
- Match the move to the player's WAVE stage
- Be direct. Don't soften. Name the move.
- If a player is stuck, the move is usually Clean Up → Transcend
"""

challenger_agent = Agent(
    settings.agent_model,
    deps_type=AgentDeps,
    output_type=MoveProposal,
    system_prompt=SYSTEM_PROMPT,
)

challenger_agent.system_prompt(nation_context)
challenger_agent.system_prompt(player_narrative_context)
challenger_agent.system_prompt(iching_context_prompt)
challenger_agent.system_prompt(iching_journal_prompt)
challenger_agent.system_prompt(deftness_context)


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------


@challenger_agent.tool
async def get_player_context(ctx: RunContext[AgentDeps]) -> str:
    """Load the current player's context."""
    player = await load_player_context(ctx)
    if not player:
        return "No player context available."
    return player.model_dump_json()


@challenger_agent.tool
async def get_active_quests(ctx: RunContext[AgentDeps]) -> str:
    """Load the current player's active quests."""
    if not ctx.deps.player_id:
        return "No player ID set."
    quests = await load_active_quests(ctx, ctx.deps.player_id)
    return "\n".join(q.model_dump_json() for q in quests) if quests else "No active quests."


@challenger_agent.tool
async def get_nation_moves(ctx: RunContext[AgentDeps], nation_name: str) -> str:
    """Load canonical moves for a nation."""
    moves = await load_nation_moves(ctx, nation_name)
    return "\n".join(m.model_dump_json() for m in moves) if moves else f"No moves for {nation_name}."


@challenger_agent.tool
async def get_player_move_unlocks(ctx: RunContext[AgentDeps]) -> str:
    """Load which moves the player has unlocked."""
    if not ctx.deps.player_id:
        return "No player ID set."

    from sqlalchemy import select

    from app.models.game import NationMove, PlayerNationMoveUnlock

    db = ctx.deps.db
    stmt = (
        select(PlayerNationMoveUnlock, NationMove.key, NationMove.name)
        .join(NationMove, PlayerNationMoveUnlock.move_id == NationMove.id)
        .where(PlayerNationMoveUnlock.player_id == ctx.deps.player_id)
    )
    result = await db.execute(stmt)
    rows = result.all()
    if not rows:
        return "No moves unlocked."
    return "\n".join(f"- {key}: {name} (unlocked)" for _, key, name in rows)


@challenger_agent.tool
async def get_player_equipped_moves(ctx: RunContext[AgentDeps]) -> str:
    """Load which moves the player has equipped in their slots."""
    if not ctx.deps.player_id:
        return "No player ID set."

    from sqlalchemy import select

    from app.models.game import NationMove, PlayerMoveEquip

    db = ctx.deps.db
    stmt = (
        select(PlayerMoveEquip, NationMove.key, NationMove.name)
        .join(NationMove, PlayerMoveEquip.move_id == NationMove.id)
        .where(PlayerMoveEquip.player_id == ctx.deps.player_id)
        .order_by(PlayerMoveEquip.slot_index)
    )
    result = await db.execute(stmt)
    rows = result.all()
    if not rows:
        return "No moves equipped."
    return "\n".join(f"- Slot {eq.slot_index}: {key} ({name})" for eq, key, name in rows)


@challenger_agent.tool
async def get_current_wave_move(ctx: RunContext[AgentDeps]) -> str:
    """Discern the player's current WAVE move."""
    move = await discern_wave_move(ctx)
    return move


# ---------------------------------------------------------------------------
# Deterministic fallback
# ---------------------------------------------------------------------------


def deterministic_challenger_proposal(quest_id: str | None = None) -> MoveProposal:
    """Produce a template move proposal without AI."""
    return MoveProposal(
        available_moves=[
            MoveAssessment(move_key="declare_intention", move_name="Declare Intention", available=True),
            MoveAssessment(move_key="integrate_gains", move_name="Integrate Gains", available=True),
            MoveAssessment(move_key="step_through", move_name="Step Through", available=True),
        ],
        recommended_move="declare_intention",
        reasoning="Deterministic fallback — recommending Declare Intention as a safe default generative move.",
        energy_assessment="Energy assessment unavailable without AI model.",
        blocked_moves=[],
    )
