"""Sage agent — Wise trickster, orchestration meta-agent (Teal/Integration sect).

The Sage is a wise trickster who can use the other faces as masks to promote
their outcomes and goals from a different perspective. Routes questions to
specialist agents using AQAL quadrant mapping. Does NOT answer domain questions
itself. Discerns the WAVE move before routing. Consults the I Ching alignment
layer before major decisions.
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext

from app.agents._deps import AgentDeps
from app.agents._iching import iching_context_prompt, iching_journal_prompt
from app.agents._instructions import deftness_context, player_narrative_context
from app.agents._tools import discern_wave_move, load_player_context
from app.config import settings

# ---------------------------------------------------------------------------
# Token budget guard
# ---------------------------------------------------------------------------

MAX_DELEGATION_TOKENS = 100_000


def _budget_exhausted(ctx: RunContext[AgentDeps]) -> str | None:
    """Return a budget-exhausted message if token limit is reached, else None."""
    try:
        if ctx.usage and hasattr(ctx.usage, "total_tokens") and ctx.usage.total_tokens >= MAX_DELEGATION_TOKENS:
            return f"[BUDGET] Token budget exhausted ({ctx.usage.total_tokens}/{MAX_DELEGATION_TOKENS}). Cannot delegate."
    except Exception:
        pass  # usage object may not support this; allow delegation
    return None


# ---------------------------------------------------------------------------
# Output schema
# ---------------------------------------------------------------------------


class HexagramAlignment(BaseModel):
    """I Ching hexagram alignment result."""

    hexagram_number: int | None = None
    alignment_score: float = 0.0
    interpretation: str = ""


class SageResponse(BaseModel):
    """Structured response from the Sage meta-agent."""

    synthesis: str = Field(description="The Sage's synthesized response")
    consulted_agents: list[str] = Field(
        default_factory=list,
        description="Which specialist agents were consulted",
    )
    discerned_move: str | None = Field(
        default=None,
        description="The WAVE move discerned for this situation",
    )
    hexagram_alignment: HexagramAlignment | None = Field(
        default=None,
        description="I Ching alignment if consulted",
    )
    legibility_note: str | None = Field(
        default=None,
        description="Why this routing/synthesis was chosen",
    )
    generative_deps: list[str] = Field(
        default_factory=list,
        description="IDs of items this synthesis obsoletes",
    )
    feedback_flags_collected: list[str] = Field(
        default_factory=list,
        description="Feedback flags from consulted agents",
    )


# ---------------------------------------------------------------------------
# Agent definition
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are the **Sage** — a wise trickster, Game Master of the Teal/Integration sect.
Your trigram is Mountain. Your mission: integration, emergence, flow.

You can use the other faces as masks to promote your outcomes and goals from a
different perspective. Speak through Shaman, Challenger, Regent, Architect, or
Diplomat when their lens serves the deeper aim — but the wisdom behind the mask
is yours.

You are the meta-agent. You do NOT answer domain questions yourself.
Instead, you:
1. Discern the player's WAVE move (Wake/Clean/Grow/Show)
2. Route to the appropriate specialist agent(s) based on AQAL quadrants
3. Synthesize their responses into a coherent whole
4. Before major decisions, consult the I Ching alignment layer

## AQAL Routing
- **I (Interior Individual)** → Shaman (emotional state, shadow work)
- **It (Exterior Individual)** → Challenger (actions, moves, energy)
- **We (Interior Collective)** → Diplomat (community, relationships)
- **Its (Exterior Collective)** → Regent (campaign structure, Kotter)
- **Strategy/Generation** → Architect (quest design, deck strategy)

## WAVE Move Deftness
- **Wake Up** → Breadth. Scan widely. Shaman leads.
- **Clean Up** → Unblocking. Find the blocker. Challenger leads.
- **Grow Up** → Capacity. Upgrade the pattern. Architect leads.
- **Show Up** → Precision. Ship the brick. Regent leads.

## Principles
- Never answer a domain question directly. Route to specialists.
- Always discern the WAVE move first.
- Synthesize, don't summarize. Add value by connecting insights.
- Collect feedback flags from all consulted agents.
- When uncertain, consult the I Ching alignment as a pattern-interrupt.
"""

sage_agent = Agent(
    settings.agent_model,
    deps_type=AgentDeps,
    output_type=SageResponse,
    system_prompt=SYSTEM_PROMPT,
)

sage_agent.system_prompt(player_narrative_context)
sage_agent.system_prompt(iching_context_prompt)
sage_agent.system_prompt(iching_journal_prompt)
sage_agent.system_prompt(deftness_context)


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------


@sage_agent.tool
async def get_player_context(ctx: RunContext[AgentDeps]) -> str:
    """Load the current player's context for routing decisions."""
    player = await load_player_context(ctx)
    if not player:
        return "No player context available."
    return player.model_dump_json()


@sage_agent.tool
async def get_current_wave_move(ctx: RunContext[AgentDeps]) -> str:
    """Discern the player's current WAVE move."""
    move = await discern_wave_move(ctx)
    return move


@sage_agent.tool
async def consult_architect(ctx: RunContext[AgentDeps], narrative_lock: str) -> str:
    """Delegate to the Architect for quest generation."""
    budget_msg = _budget_exhausted(ctx)
    if budget_msg:
        return budget_msg
    try:
        from app.agents.architect import architect_agent as arch

        result = await arch.run(
            f"Design a quest for: {narrative_lock}",
            deps=ctx.deps,
            usage=ctx.usage,
        )
        return result.output.model_dump_json()
    except Exception as e:
        return f"[ERROR] Architect delegation failed: {e}"


@sage_agent.tool
async def consult_challenger(ctx: RunContext[AgentDeps]) -> str:
    """Delegate to the Challenger for move proposals."""
    budget_msg = _budget_exhausted(ctx)
    if budget_msg:
        return budget_msg
    try:
        from app.agents.challenger import challenger_agent as chall

        result = await chall.run(
            "Propose available moves for the current player.",
            deps=ctx.deps,
            usage=ctx.usage,
        )
        return result.output.model_dump_json()
    except Exception as e:
        return f"[ERROR] Challenger delegation failed: {e}"


@sage_agent.tool
async def consult_shaman(ctx: RunContext[AgentDeps], context: str = "") -> str:
    """Delegate to the Shaman for emotional reading."""
    budget_msg = _budget_exhausted(ctx)
    if budget_msg:
        return budget_msg
    try:
        from app.agents.shaman import shaman_agent as sham

        prompt = "Read the player's emotional state."
        if context:
            prompt += f"\nContext: {context}"

        result = await sham.run(prompt, deps=ctx.deps, usage=ctx.usage)
        return result.output.model_dump_json()
    except Exception as e:
        return f"[ERROR] Shaman delegation failed: {e}"


@sage_agent.tool
async def consult_regent(ctx: RunContext[AgentDeps]) -> str:
    """Delegate to the Regent for campaign assessment."""
    budget_msg = _budget_exhausted(ctx)
    if budget_msg:
        return budget_msg
    try:
        from app.agents.regent import regent_agent as reg

        result = await reg.run(
            "Assess the current campaign structure.",
            deps=ctx.deps,
            usage=ctx.usage,
        )
        return result.output.model_dump_json()
    except Exception as e:
        return f"[ERROR] Regent delegation failed: {e}"


@sage_agent.tool
async def consult_diplomat(ctx: RunContext[AgentDeps]) -> str:
    """Delegate to the Diplomat for community guidance."""
    budget_msg = _budget_exhausted(ctx)
    if budget_msg:
        return budget_msg
    try:
        from app.agents.diplomat import diplomat_agent as dip

        result = await dip.run(
            "Guide the player on community engagement.",
            deps=ctx.deps,
            usage=ctx.usage,
        )
        return result.output.model_dump_json()
    except Exception as e:
        return f"[ERROR] Diplomat delegation failed: {e}"


@sage_agent.tool
async def cast_hexagram_alignment(
    ctx: RunContext[AgentDeps], proposed_action: str
) -> str:
    """Consult the I Ching alignment system before a major decision.

    This is a pattern-interrupt — attunement, not mysticism.
    """
    # Simplified hexagram alignment (full port from TS would use iching-struct.ts)
    # For now, return a structured placeholder that can be enhanced
    import hashlib

    # Deterministic hexagram from the action text
    h = int(hashlib.sha256(proposed_action.encode()).hexdigest(), 16) % 64 + 1

    return (
        f"Hexagram {h} drawn for proposed action: '{proposed_action[:80]}'\n"
        f"This hexagram suggests attunement before acting. "
        f"Consider whether the timing and energy are aligned."
    )


# ---------------------------------------------------------------------------
# Deterministic fallback
# ---------------------------------------------------------------------------


def deterministic_sage_response(question: str) -> SageResponse:
    """Produce a template sage response without AI."""
    return SageResponse(
        synthesis=(
            "The Sage observes your question and suggests consulting the "
            "appropriate specialist. Without AI routing, consider:\n"
            "- For emotional questions → reflect (Shaman domain)\n"
            "- For action questions → assess energy (Challenger domain)\n"
            "- For structure questions → review campaign (Regent domain)\n"
            "- For quest design → draft manually (Architect domain)\n"
            "- For community questions → reach out (Diplomat domain)"
        ),
        consulted_agents=[],
        legibility_note="Deterministic fallback — routing guide without AI synthesis.",
    )
