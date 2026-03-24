"""
Sprite audit trail — Regent governance.
Records every SpriteAuditLog status transition.
All writes are fire-and-forget; failures are logged but never propagate to caller.

Wiring point (for routes.py, owned by the Architect face):
    from .audit import record_sprite_event

    # After enqueue logic inside POST /api/sprites/generate:
    await record_sprite_event(
        db, job.player_id, "portrait",
        job.nation_key, job.archetype_key, "enqueued"
    )

    # After generation succeeds:
    await record_sprite_event(
        db, job.player_id, "portrait",
        job.nation_key, job.archetype_key, "generated",
        attempt=job.attempt, prompt_used=job.prompt_used, source_model=job.source_model
    )

    # After admin approve / reject:
    await record_sprite_event(
        db, sprite_id, "portrait",
        nation_key, archetype_key, "approved"
    )
"""
from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Literal

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import generate_cuid

logger = logging.getLogger(__name__)

StatusType = Literal["enqueued", "generated", "review", "approved", "rejected"]


async def record_sprite_event(
    db: AsyncSession,
    player_id: str,
    pipeline: Literal["portrait", "walkable"],
    nation_key: str,
    archetype_key: str,
    status: StatusType,
    attempt: int = 1,
    prompt_used: str | None = None,
    source_model: str | None = None,
    review_note: str | None = None,
    lpc_base_asset: str | None = None,
) -> str | None:
    """Write a SpriteAuditLog entry. Returns the new record id or None on failure.

    Never raises — Regent observes without blocking.

    Uses raw SQL so this module is independent of Prisma Client regeneration.
    The SpriteAuditLog table is added to prisma/schema.prisma by the Architect
    face and created by the next migration / db:sync run.
    """
    record_id = generate_cuid()
    now = datetime.now(UTC)

    try:
        await db.execute(
            text(
                """
                INSERT INTO "SpriteAuditLog"
                  (id, "playerId", pipeline, "nationKey", "archetypeKey", status,
                   attempt, "promptUsed", "sourceModel", "reviewNote", "lpcBaseAsset",
                   "createdAt", "updatedAt")
                VALUES
                  (:id, :player_id, :pipeline, :nation_key, :archetype_key, :status,
                   :attempt, :prompt_used, :source_model, :review_note, :lpc_base_asset,
                   :now, :now)
                """
            ),
            {
                "id": record_id,
                "player_id": player_id,
                "pipeline": pipeline,
                "nation_key": nation_key,
                "archetype_key": archetype_key,
                "status": status,
                "attempt": attempt,
                "prompt_used": prompt_used,
                "source_model": source_model,
                "review_note": review_note,
                "lpc_base_asset": lpc_base_asset,
                "now": now,
            },
        )
        # Flush so the row is visible in the current transaction, but let the
        # caller own commit/rollback (matches the existing session contract in
        # backend/app/database.py).
        await db.flush()
        logger.info(
            "[SpriteAudit] player=%s pipeline=%s status=%s attempt=%d id=%s",
            player_id, pipeline, status, attempt, record_id,
        )
        return record_id
    except Exception as exc:
        logger.error("[SpriteAudit] Failed to record event: %s", exc, exc_info=True)
        return None


async def get_sprite_status(
    db: AsyncSession,
    player_id: str,
    pipeline: Literal["portrait", "walkable"],
) -> str | None:
    """Return the most recent status for a player's sprite pipeline.

    Returns the status string or None if no record exists.
    Never raises — safe to call from status-check endpoints.
    """
    try:
        result = await db.execute(
            text(
                """
                SELECT status FROM "SpriteAuditLog"
                WHERE "playerId" = :player_id AND pipeline = :pipeline
                ORDER BY "createdAt" DESC
                LIMIT 1
                """
            ),
            {"player_id": player_id, "pipeline": pipeline},
        )
        row = result.fetchone()
        return row[0] if row else None
    except Exception as exc:
        logger.error("[SpriteAudit] Failed to get status: %s", exc, exc_info=True)
        return None
