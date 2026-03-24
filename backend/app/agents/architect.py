"""Architect agent — Quest generation / strategy (Orange/Strategy sect).

The Architect is a systems thinker who designs quests from narrative locks.
Understands Epiphany Bridge (personal, 6 beats) and Kotter (communal, 8 stages).
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext

from app.agents._deps import AgentDeps
from app.agents._iching import iching_context_prompt, iching_journal_prompt
from app.agents._instructions import archetype_context, deftness_context, nation_context, player_narrative_context
from app.agents._tools import (
    check_for_compostable,
    discern_wave_move,
    load_active_quests,
    load_nation_moves,
    load_player_context,
)
from app.config import settings

# ---------------------------------------------------------------------------
# Output schema
# ---------------------------------------------------------------------------


class QuestDraft(BaseModel):
    """Structured quest draft produced by the Architect agent."""

    title: str = Field(description="Quest title (concise, evocative)")
    description: str = Field(description="Quest description (2-4 sentences)")
    quest_type: str = Field(default="personal", description="personal or communal")
    grammar: Literal["epiphany_bridge", "kotter"] = Field(
        default="epiphany_bridge",
        description="Quest grammar: epiphany_bridge (6 beats) or kotter (8 stages)",
    )
    move_type: str | None = Field(default=None, description="Primary WAVE move type")
    emotional_alchemy_tag: str | None = Field(
        default=None,
        description="Emotional element: fear, anger, sadness, joy, neutrality",
    )
    kotter_stage: int = Field(default=1, description="Starting Kotter stage (1-8)")
    nation: str | None = Field(default=None, description="Target nation")
    archetype: str | None = Field(default=None, description="Target archetype")
    allyship_domain: str | None = Field(
        default=None,
        description="Allyship domain: gathering_resources, direct_action, raise_awareness, skillful_organizing",
    )
    completion_conditions: list[str] = Field(
        default_factory=list,
        description="What the player must do to complete this quest",
    )
    vibulon_reward: int = Field(default=1, description="Vibulon reward on completion")
    confidence: float = Field(default=0.7, description="0.0-1.0 confidence in this draft")
    reasoning: str = Field(description="Why this quest was designed this way")


class QuestCompilation(BaseModel):
    """Full quest compilation output — structured quest content for the grammar pipeline."""

    node_texts: list[str] = Field(description="Narrative text for each quest beat/node")
    overview: str = Field(description="Quest overview (1-2 paragraphs)")
    twee_source: str | None = Field(default=None, description="SugarCube Twee source if applicable")
    emotional_alchemy_tag: str | None = Field(default=None, description="Primary emotional element")
    confidence: float = Field(default=0.7, description="0.0-1.0 confidence in compilation")
    reasoning: str = Field(description="Compilation reasoning — how I Ching, face, and grammar informed this")
    hexagram_interpretation: str | None = Field(
        default=None,
        description="Agent's interpretation of how this hexagram shaped the quest (for encounter log)",
    )


# ---------------------------------------------------------------------------
# Agent definition
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are the **Architect** — Game Master of the Orange/Strategy sect.
Your trigram is Heaven. Your mission: strategy, project, advantage.

You design quests from narrative locks. A narrative lock is an obstacle
the player faces — something they are stuck on, afraid of, or avoiding.
Your job is to turn that lock into a structured quest that moves the player
through an emotional arc.

## Quest Grammars

**Epiphany Bridge** (personal, 6 beats):
1. Orientation — Set the stage
2. Rising Engagement — Draw in
3. Tension — Peak conflict
4. Integration — Begin resolution
5. Transcendence — Commitment moment (action node)
6. Consequence — System event, identity flag

**Kotter** (communal, 8 stages):
1. Urgency → 2. Coalition → 3. Vision → 4. Communicate →
5. Obstacles → 6. Wins → 7. Build On → 8. Anchor

## 15 Canonical Moves
- 5 Transcend (+2 energy): Step Through, Reclaim Meaning, Commit to Growth, Achieve Breakthrough, Stabilize Coherence
- 5 Generative (+1 energy): Declare Intention, Integrate Gains, Reveal Stakes, Deepen Value, Renew Vitality
- 5 Control (-1 energy): Consolidate Energy, Temper Action, Reopen Sensitivity, Activate Hope, Mobilize Grief

## Emotional Alchemy
5 elements: Metal (Fear), Water (Sadness), Wood (Joy), Fire (Anger), Earth (Neutrality).
Each supports Wake → Clean → Grow → Show.

## Allyship Domains
- Gathering Resources
- Direct Action
- Raise Awareness
- Skillful Organizing

## Principles
- Match quest grammar to scope: personal locks → Epiphany Bridge; communal goals → Kotter
- Match emotional element to the narrative lock's energy
- Set vibulon_reward proportional to quest difficulty (1-5)
- Check for existing similar quests before drafting (composting principle)
- Include clear completion conditions
- Always explain your reasoning
"""

architect_agent = Agent(
    settings.agent_model,
    deps_type=AgentDeps,
    output_type=QuestDraft,
    system_prompt=SYSTEM_PROMPT,
)

# Dynamic instructions from DB
architect_agent.system_prompt(nation_context)
architect_agent.system_prompt(archetype_context)
architect_agent.system_prompt(player_narrative_context)
architect_agent.system_prompt(iching_context_prompt)
architect_agent.system_prompt(iching_journal_prompt)
architect_agent.system_prompt(deftness_context)


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------


@architect_agent.tool
async def get_player_context(ctx: RunContext[AgentDeps]) -> str:
    """Load the current player's context."""
    player = await load_player_context(ctx)
    if not player:
        return "No player context available."
    return player.model_dump_json()


@architect_agent.tool
async def get_active_quests(ctx: RunContext[AgentDeps]) -> str:
    """Load the current player's active quests."""
    if not ctx.deps.player_id:
        return "No player ID set."
    quests = await load_active_quests(ctx, ctx.deps.player_id)
    return "\n".join(q.model_dump_json() for q in quests) if quests else "No active quests."


@architect_agent.tool
async def get_nation_moves(ctx: RunContext[AgentDeps], nation_name: str) -> str:
    """Load canonical moves for a nation."""
    moves = await load_nation_moves(ctx, nation_name)
    return "\n".join(m.model_dump_json() for m in moves) if moves else f"No moves found for {nation_name}."


@architect_agent.tool
async def get_similar_existing_quests(ctx: RunContext[AgentDeps], proposed_title: str) -> str:
    """Check for existing quests that overlap with the proposed quest (composting check)."""
    items = await check_for_compostable(ctx, "quest", proposed_title)
    if not items:
        return "No similar existing quests found."
    return "\n".join(f"- {c.title} (id: {c.item_id}): {c.reason}" for c in items)


@architect_agent.tool
async def get_current_wave_move(ctx: RunContext[AgentDeps]) -> str:
    """Discern the player's current WAVE move (wake_up, clean_up, grow_up, show_up)."""
    move = await discern_wave_move(ctx)
    return move


# ---------------------------------------------------------------------------
# Deterministic fallback
# ---------------------------------------------------------------------------


def deterministic_architect_draft(
    narrative_lock: str,
    quest_grammar: str = "epiphany_bridge",
) -> QuestDraft:
    """Produce a template quest draft without AI — dual-track fallback."""
    return QuestDraft(
        title=f"Quest: {narrative_lock[:60]}",
        description=(
            f"A quest generated from the narrative lock: '{narrative_lock}'. "
            "This is a template draft — refine it with a Game Master or the AI Architect."
        ),
        quest_type="personal",
        grammar="epiphany_bridge" if quest_grammar != "kotter" else "kotter",
        move_type="growUp",
        emotional_alchemy_tag="neutrality",
        kotter_stage=1,
        completion_conditions=["Reflect on the narrative lock", "Take one concrete action"],
        vibulon_reward=1,
        confidence=0.3,
        reasoning="Deterministic fallback — no AI model available. Template quest generated from narrative lock.",
    )


# ---------------------------------------------------------------------------
# Compile agent — same Architect but with QuestCompilation output
# ---------------------------------------------------------------------------

COMPILE_SYSTEM_PROMPT = SYSTEM_PROMPT + """

## Compilation Mode

You are now compiling a full quest from unpacking answers and emotional signature.
Generate narrative text for each quest beat/node, a quest overview, and optionally
SugarCube Twee source.

Your output must include:
- node_texts: one narrative passage per quest beat (6 for epiphany_bridge, 8 for kotter)
- overview: a 1-2 paragraph quest overview
- twee_source: optional SugarCube Twee source for the quest
- hexagram_interpretation: if I Ching context is present, describe how the hexagram
  shaped your design choices — this is YOUR interpretation through your Heaven trigram lens

Let the hexagram inform your imagery and structure. If your trigram (Heaven) appears
in the hexagram, you are working in resonance — lean into structural clarity.
If not, find creative tension between the hexagram's energy and your design instinct.
"""

architect_compile_agent = Agent(
    settings.agent_model,
    deps_type=AgentDeps,
    output_type=QuestCompilation,
    system_prompt=COMPILE_SYSTEM_PROMPT,
)

# Dynamic instructions — same as the main architect
architect_compile_agent.system_prompt(nation_context)
architect_compile_agent.system_prompt(archetype_context)
architect_compile_agent.system_prompt(player_narrative_context)
architect_compile_agent.system_prompt(iching_context_prompt)
architect_compile_agent.system_prompt(iching_journal_prompt)
architect_compile_agent.system_prompt(deftness_context)


def deterministic_architect_compile(
    unpacking_answers: dict,
    quest_grammar: str = "epiphany_bridge",
) -> QuestCompilation:
    """Produce a template quest compilation without AI — dual-track fallback."""
    num_nodes = 6 if quest_grammar != "kotter" else 8
    node_texts = [
        f"Beat {i + 1}: Continue the journey."
        for i in range(num_nodes)
    ]
    return QuestCompilation(
        node_texts=node_texts,
        overview="A quest generated from your unpacking answers. Refine with a Game Master.",
        emotional_alchemy_tag="neutrality",
        confidence=0.3,
        reasoning="Deterministic fallback — no AI model available.",
    )
