"""Resolve which Player owns strand-generated BARs (separate from human admin hands)."""

from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.player import Player

logger = logging.getLogger(__name__)

# Must match scripts/seed-strand-agent-player.ts (Prisma seed)
STRAND_AGENT_PLAYER_NAME = "BARS Strand Agent"


async def resolve_strand_creator_id(session: AsyncSession) -> str:
    """
    Deterministic order:
    1. STRAND_CREATOR_PLAYER_ID (settings.strand_creator_player_id) if set and Player exists
    2. Player with creatorType=agent and canonical name
    3. RuntimeError — no silent LIMIT 1 fallback
    """
    raw = (settings.strand_creator_player_id or "").strip()
    if raw:
        result = await session.execute(select(Player.id).where(Player.id == raw))
        pid = result.scalar_one_or_none()
        if not pid:
            raise RuntimeError(
                f"STRAND_CREATOR_PLAYER_ID={raw!r} does not match any Player. "
                "Fix the env var or run: npx tsx scripts/with-env.ts \"npx tsx scripts/seed-strand-agent-player.ts\""
            )
        return pid

    result = await session.execute(
        select(Player.id)
        .where(Player.creator_type == "agent", Player.name == STRAND_AGENT_PLAYER_NAME)
        .limit(2)
    )
    rows = list(result.scalars().all())
    if len(rows) > 1:
        raise RuntimeError(
            f"Multiple Players with creatorType=agent and name={STRAND_AGENT_PLAYER_NAME!r}; "
            "deduplicate or set STRAND_CREATOR_PLAYER_ID."
        )
    if len(rows) == 1:
        return rows[0]

    raise RuntimeError(
        "Strand creator Player not configured: no STRAND_CREATOR_PLAYER_ID and no seeded agent player. "
        f"Run: npx tsx scripts/with-env.ts \"npx tsx scripts/seed-strand-agent-player.ts\" "
        f"(creates {STRAND_AGENT_PLAYER_NAME!r}) or set STRAND_CREATOR_PLAYER_ID to an existing Player id."
    )
