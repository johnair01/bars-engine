from __future__ import annotations

from fastapi import Cookie, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db


async def get_current_player_id(
    bars_player_id: str | None = Cookie(default=None),
) -> str | None:
    """Extract player ID from cookie, with dev bypass."""
    player_id = bars_player_id

    # DEV BYPASS: auto-authenticate in development
    if not player_id and settings.environment == "development" and settings.dev_player_id:
        player_id = settings.dev_player_id

    return player_id


async def get_current_player(
    player_id: str | None = Depends(get_current_player_id),
    db: AsyncSession = Depends(get_db),
):
    """FastAPI dependency: returns the authenticated Player or None."""
    if not player_id:
        return None

    from app.models.player import Player

    stmt = (
        select(Player)
        .where(Player.id == player_id)
        .options(
            selectinload(Player.roles),
            selectinload(Player.nation),
            selectinload(Player.archetype),
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def require_player(
    player_id: str | None = Depends(get_current_player_id),
    db: AsyncSession = Depends(get_db),
) -> str:
    """FastAPI dependency: returns player ID or raises 401."""
    if not player_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    from app.models.player import Player

    stmt = select(Player.id).where(Player.id == player_id)
    result = await db.execute(stmt)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=401, detail="Player not found")

    return player_id
