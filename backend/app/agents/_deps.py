"""Shared dependency injection for all Pydantic AI agents."""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession


@dataclass
class AgentDeps:
    """Injected into every agent via deps_type=AgentDeps.

    - db: async SQLAlchemy session from FastAPI's get_db()
    - player_id: scoped player (from cookie auth)
    - instance_id: scoped campaign instance (optional)
    - iching_context: optional I Ching context for hexagram-aligned generation
    """

    db: AsyncSession
    player_id: str | None = None
    instance_id: str | None = None
    iching_context: dict | None = None
