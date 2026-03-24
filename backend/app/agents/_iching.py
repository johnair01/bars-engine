"""I Ching learning infrastructure for Game Master agents.

Handles:
- Face-to-trigram mapping (mirrors iching-faces.ts)
- IChingContext injection into agent system prompts
- Hexagram encounter logging
- Encounter history retrieval for system prompt augmentation ("I Ching Journal")
"""

from __future__ import annotations

import json
import logging

from pydantic_ai import RunContext
from sqlalchemy import desc, select

from app.agents._deps import AgentDeps

logger = logging.getLogger(__name__)

# Mirror of src/lib/quest-grammar/iching-faces.ts FACE_TRIGRAM
FACE_TRIGRAM: dict[str, str] = {
    "architect": "Heaven",
    "challenger": "Fire",
    "shaman": "Earth",
    "regent": "Lake",
    "diplomat": "Wind",
    "sage": "Mountain",
}

TRIGRAMS = ("Heaven", "Earth", "Thunder", "Water", "Mountain", "Wind", "Fire", "Lake")


def compute_trigram_position(agent_name: str, upper: str, lower: str) -> tuple[bool, str]:
    """Determine whether a hexagram contains the agent's home trigram.

    Returns (is_home_trigram, position) where position is
    'upper' | 'lower' | 'both' | 'neither'.
    """
    home = FACE_TRIGRAM.get(agent_name)
    if not home:
        return False, "neither"

    in_upper = upper == home
    in_lower = lower == home

    if in_upper and in_lower:
        return True, "both"
    elif in_upper:
        return True, "upper"
    elif in_lower:
        return True, "lower"
    else:
        return False, "neither"


def build_iching_system_prompt_section(iching_context: dict) -> str:
    """Build a system prompt section from IChingContext dict.

    Injected into the agent's system prompt when iching_context is present
    on AgentDeps.
    """
    hex_id = iching_context.get("hexagramId", "?")
    hex_name = iching_context.get("hexagramName", "")
    hex_tone = iching_context.get("hexagramTone", "")
    hex_text = iching_context.get("hexagramText", "")
    upper = iching_context.get("upperTrigram", "")
    lower = iching_context.get("lowerTrigram", "")

    parts = [
        "\n## I Ching Context",
        f"- Hexagram: #{hex_id} {hex_name} — {hex_tone}",
        f"- Structure: {upper} over {lower}",
    ]
    if hex_text:
        parts.append(f"- Meaning: {hex_text}")

    kotter = iching_context.get("kotterStage")
    kotter_name = iching_context.get("kotterStageName")
    if kotter is not None and kotter_name:
        parts.append(f"- Campaign stage: {kotter} — {kotter_name}")

    nation = iching_context.get("nationName")
    if nation:
        parts.append(f"- Nation: {nation}")

    face = iching_context.get("activeFace")
    if face:
        parts.append(f"- Active Game Master face: {face}")

    parts.append(
        "\nUse this I Ching reading to inform tone, imagery, and emotional arc. "
        "Let the hexagram's energy shape your response."
    )
    return "\n".join(parts)


async def iching_context_prompt(ctx: RunContext[AgentDeps]) -> str:
    """Dynamic system prompt that injects IChingContext when available."""
    if not ctx.deps or not ctx.deps.iching_context:
        return ""
    return build_iching_system_prompt_section(ctx.deps.iching_context)


async def iching_journal_prompt(ctx: RunContext[AgentDeps]) -> str:
    """Dynamic system prompt that injects the agent's I Ching encounter journal.

    Queries the last 10 encounters for this agent to give it memory
    of its own interpretive history.
    """
    if not ctx.deps or not ctx.deps.db:
        return ""

    # Determine agent name from the system_prompt context
    # We need to figure out which agent this is — use iching_context.activeFace
    # or fall back to checking the iching_context for clues
    agent_name = None
    if ctx.deps.iching_context:
        agent_name = ctx.deps.iching_context.get("activeFace")

    if not agent_name:
        return ""

    try:
        from app.models.knowledge import HexagramEncounterLog

        db = ctx.deps.db
        stmt = (
            select(HexagramEncounterLog)
            .where(HexagramEncounterLog.agent_name == agent_name)
            .order_by(desc(HexagramEncounterLog.created_at))
            .limit(10)
        )
        result = await db.execute(stmt)
        encounters = result.scalars().all()

        if not encounters:
            return ""

        home_trigram = FACE_TRIGRAM.get(agent_name, "unknown")
        lines = [
            f"\n## Your I Ching Journal (last {len(encounters)} encounters)",
            f"Your trigram is **{home_trigram}**. You learn from every hexagram you encounter.\n",
        ]

        for enc in encounters:
            home_note = ""
            if enc.is_home_trigram:
                home_note = f" [HOME TRIGRAM — {enc.trigram_position} position]"
            interp = f": {enc.interpretation_summary}" if enc.interpretation_summary else ""
            lines.append(
                f"- Hex #{enc.hexagram_id} ({enc.upper_trigram}/{enc.lower_trigram}){home_note}{interp}"
            )

        # Also load the general interpretive profile if it exists
        from app.models.knowledge import AgentInterpretiveProfile

        profile_stmt = (
            select(AgentInterpretiveProfile)
            .where(
                AgentInterpretiveProfile.agent_name == agent_name,
                AgentInterpretiveProfile.hexagram_id.is_(None),
            )
        )
        profile_result = await db.execute(profile_stmt)
        profile = profile_result.scalar_one_or_none()

        if profile:
            lines.append(f"\n### Your Interpretive Profile\n{profile.profile_text}")

        return "\n".join(lines)
    except Exception:
        logger.debug("iching_journal_prompt: DB unavailable", exc_info=True)
        return ""


async def log_hexagram_encounter(
    db,
    agent_name: str,
    iching_context: dict,
    interpretation_summary: str | None = None,
    archetypes_involved: list[str] | None = None,
    emotional_alchemy_tag: str | None = None,
    quest_id: str | None = None,
    player_id: str | None = None,
) -> None:
    """Log a hexagram encounter for an agent after processing a request.

    Called after every agent call that includes IChingContext.
    """
    try:
        from app.models.knowledge import HexagramEncounterLog

        upper = iching_context.get("upperTrigram", "")
        lower = iching_context.get("lowerTrigram", "")
        is_home, position = compute_trigram_position(agent_name, upper, lower)

        encounter = HexagramEncounterLog(
            agent_name=agent_name,
            hexagram_id=iching_context.get("hexagramId", 0),
            upper_trigram=upper,
            lower_trigram=lower,
            is_home_trigram=is_home,
            trigram_position=position,
            interpretation_summary=interpretation_summary,
            archetypes_involved=json.dumps(archetypes_involved or []),
            emotional_alchemy_tag=emotional_alchemy_tag,
            quest_id=quest_id,
            player_id=player_id,
        )
        db.add(encounter)
        await db.commit()
    except Exception:
        logger.warning("Failed to log hexagram encounter", exc_info=True)
        # Don't break the main flow if logging fails
        try:
            await db.rollback()
        except Exception:
            pass
