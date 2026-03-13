"""Dynamic system prompt builders for agent instructions.

These functions are decorated with @agent.system_prompt on each agent
and load canonical data from the DB at runtime.
"""

from __future__ import annotations

import logging

from pydantic_ai import RunContext
from sqlalchemy import select

from app.agents._deps import AgentDeps

logger = logging.getLogger(__name__)


async def nation_context(ctx: RunContext[AgentDeps]) -> str:
    """Load all nations with WAVE descriptions for agent instructions."""
    if not ctx.deps or not ctx.deps.db:
        return ""

    try:
        from app.models.identity import Nation

        db = ctx.deps.db
        stmt = select(Nation).where(Nation.archived.is_(False)).order_by(Nation.name)
        result = await db.execute(stmt)
        nations = result.scalars().all()

        if not nations:
            return "No nations loaded in database."

        lines = ["## Nations\n"]
        for n in nations:
            lines.append(f"### {n.name} (element: {n.element})")
            lines.append(f"{n.description}")
            if n.wake_up:
                lines.append(f"- Wake Up: {n.wake_up}")
            if n.clean_up:
                lines.append(f"- Clean Up: {n.clean_up}")
            if n.grow_up:
                lines.append(f"- Grow Up: {n.grow_up}")
            if n.show_up:
                lines.append(f"- Show Up: {n.show_up}")
            lines.append("")

        return "\n".join(lines)
    except Exception:
        logger.debug("nation_context: DB unavailable", exc_info=True)
        return ""


async def archetype_context(ctx: RunContext[AgentDeps]) -> str:
    """Load all archetypes with central conflicts for agent instructions."""
    if not ctx.deps or not ctx.deps.db:
        return ""

    try:
        from app.models.identity import Archetype

        db = ctx.deps.db
        stmt = select(Archetype).order_by(Archetype.name)
        result = await db.execute(stmt)
        archetypes = result.scalars().all()

        if not archetypes:
            return "No archetypes loaded in database."

        lines = ["## Archetypes\n"]
        for a in archetypes:
            lines.append(f"### {a.name}")
            lines.append(f"{a.description}")
            if a.central_conflict:
                lines.append(f"- Central conflict: {a.central_conflict}")
            if a.primary_question:
                lines.append(f"- Primary question: {a.primary_question}")
            if a.primary_wave_stage:
                lines.append(f"- Primary WAVE stage: {a.primary_wave_stage}")
            lines.append("")

        return "\n".join(lines)
    except Exception:
        logger.debug("archetype_context: DB unavailable", exc_info=True)
        return ""


async def player_narrative_context(ctx: RunContext[AgentDeps]) -> str:
    """Load the current player's narrative state for agent instructions."""
    if not ctx.deps or not ctx.deps.db:
        return ""

    try:
        from app.agents._tools import load_active_quests, load_player_context

        player = await load_player_context(ctx)
        if not player:
            return "No player context available."

        quests = await load_active_quests(ctx, player.player_id)

        lines = [
            "## Current Player\n",
            f"- Name: {player.name}",
            f"- Nation: {player.nation_name or 'unset'}",
            f"- Archetype: {player.archetype_name or 'unset'}",
            f"- Active quests: {player.active_quest_count}",
        ]

        if quests:
            lines.append("\n### Active Quests")
            for q in quests[:5]:
                tag = f" [{q.emotional_alchemy_tag}]" if q.emotional_alchemy_tag else ""
                lines.append(f"- {q.title} (status: {q.status}, kotter: {q.kotter_stage}){tag}")

        return "\n".join(lines)
    except Exception:
        logger.debug("player_narrative_context: DB unavailable", exc_info=True)
        return ""


async def deftness_context(ctx: RunContext[AgentDeps]) -> str:
    """Return deftness skill principles as system prompt context."""
    return """## Deftness Skill — Development Principles

**Ontology**: Rooted in integral theory and holocratic stewardship. Every implementation decision should be ecosystem-aware and respect the I Ching vibes layer. Consider all four quadrants (I/We/It/Its) when designing features.

**Process as artifact**: Build verification quests, logs, and UI surfaces as in-game artifacts. The game creates itself — process output should be legible within the game world (Six Faces of the Game Master, Bruised Banana residency). Gamification of the development process increases deftness.

**Spec-kit first**: Any feature touching persistence, UI, or external surfaces requires a spec before implementation. Specs live in `.specify/specs/<feature>/`. Use backlog prompts in `.specify/backlog/prompts/` to initiate spec-driven work.

**API-first**: Define the contract (route signature, request/response shape) before building UI or server actions. Document endpoints. Prefer route handlers over server actions when the surface is externally visible.

**Scaling robustness**: Before shipping, check: filesystem limits (Vercel 50MB tmp), AI call resilience (timeouts, fallbacks), request body limits, env vars set in all environments, DB migrations reviewed. Use deterministic fallbacks for all AI paths.

**Token and time economy**: Write concise specs. Reuse existing libraries. Run `npm run build` and `npm run check` before calling work done. Do not reimplement with AI what a library already provides.

**Deterministic over AI**: Prefer deterministic logic for anything that can be computed. Use AI only where judgment, narrative, or ambiguity resolution is genuinely required. Feature flags and graceful degradation are not optional.

**Generative dependencies**: Sequence work so that solving one item eliminates the need for other items. Look for: merge candidates (two features that share a schema), foundation items (unblocking multiple dependents), supersession patterns (new approach makes old approach unnecessary), schema contracts (shared DB shape resolving multiple stories).

**Composting, not necromancy**: Past work (transcripts, quests, prose) is raw material for new artifacts — use it. Do not maintain obsolete paths; compost them. When removing code, remove it completely rather than leaving stubs.

Source: `.agents/skills/deftness-development/SKILL.md`"""
