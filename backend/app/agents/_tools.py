"""Shared DB query tools registered on agents via @agent.tool."""

from __future__ import annotations

from typing import Literal

from pydantic_ai import RunContext
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.agents._deps import AgentDeps
from app.agents._schemas import CompostableItem, MoveInfo, PlayerContext, QuestSummary


def _get_deps(ctx_or_deps: RunContext[AgentDeps] | AgentDeps) -> AgentDeps:
    """Extract AgentDeps from either RunContext or direct deps."""
    if isinstance(ctx_or_deps, AgentDeps):
        return ctx_or_deps
    return ctx_or_deps.deps


# ---------------------------------------------------------------------------
# load_player_context
# ---------------------------------------------------------------------------


async def load_player_context(ctx: RunContext[AgentDeps] | AgentDeps) -> PlayerContext | None:
    """Load the current player's summarised state."""
    deps = _get_deps(ctx)
    if not deps.player_id:
        return None

    from app.models.player import Player
    from app.models.quest import PlayerQuest

    db = deps.db
    stmt = (
        select(Player)
        .where(Player.id == deps.player_id)
        .options(selectinload(Player.nation), selectinload(Player.archetype))
    )
    result = await db.execute(stmt)
    player = result.scalar_one_or_none()
    if not player:
        return None

    # Count active quests
    count_stmt = (
        select(func.count())
        .select_from(PlayerQuest)
        .where(PlayerQuest.player_id == player.id, PlayerQuest.status == "assigned")
    )
    count_result = await db.execute(count_stmt)
    active_count = count_result.scalar() or 0

    return PlayerContext(
        player_id=player.id,
        name=player.name,
        nation_name=player.nation.name if player.nation else None,
        nation_element=player.nation.element if player.nation else None,
        archetype_name=player.archetype.name if player.archetype else None,
        archetype_central_conflict=player.archetype.central_conflict if player.archetype else None,
        active_quest_count=active_count,
    )


# ---------------------------------------------------------------------------
# load_active_quests
# ---------------------------------------------------------------------------


async def load_active_quests(ctx: RunContext[AgentDeps] | AgentDeps, player_id: str) -> list[QuestSummary]:
    """Load a player's currently assigned quests."""
    from app.models.quest import CustomBar, PlayerQuest

    db = _get_deps(ctx).db
    stmt = (
        select(PlayerQuest, CustomBar)
        .join(CustomBar, PlayerQuest.quest_id == CustomBar.id)
        .where(PlayerQuest.player_id == player_id, PlayerQuest.status == "assigned")
        .order_by(PlayerQuest.assigned_at.desc())
        .limit(20)
    )
    result = await db.execute(stmt)
    rows = result.all()

    return [
        QuestSummary(
            quest_id=pq.quest_id,
            title=bar.title,
            status=pq.status,
            kotter_stage=bar.kotter_stage or 1,
            move_type=bar.move_type,
            emotional_alchemy_tag=bar.emotional_alchemy_tag,
            allyship_domain=bar.allyship_domain,
        )
        for pq, bar in rows
    ]


# ---------------------------------------------------------------------------
# load_nation_moves
# ---------------------------------------------------------------------------


async def load_nation_moves(ctx: RunContext[AgentDeps] | AgentDeps, nation_name: str) -> list[MoveInfo]:
    """Load all canonical moves for a given nation."""
    from app.models.game import NationMove
    from app.models.identity import Nation

    db = _get_deps(ctx).db
    stmt = (
        select(NationMove, Nation.name)
        .join(Nation, NationMove.nation_id == Nation.id)
        .where(Nation.name == nation_name)
        .order_by(NationMove.sort_order)
    )
    result = await db.execute(stmt)
    rows = result.all()

    return [
        MoveInfo(
            move_id=move.id,
            key=move.key,
            name=move.name,
            nation_name=n_name,
            polarity=None,  # loaded separately if needed
            description=move.description,
        )
        for move, n_name in rows
    ]


# ---------------------------------------------------------------------------
# discern_wave_move — §1 Discern the Move
# ---------------------------------------------------------------------------


async def discern_wave_move(
    ctx: RunContext[AgentDeps] | AgentDeps,
) -> Literal["wake_up", "clean_up", "grow_up", "show_up"]:
    """Identify which WAVE move the player is currently in.

    Heuristic: looks at active quest move_types, emotional state signals,
    and energy level to guess the dominant phase.
    """
    deps = _get_deps(ctx)
    if not deps.player_id:
        return "wake_up"

    quests = await load_active_quests(ctx, deps.player_id)
    if not quests:
        return "wake_up"

    # Count move_type distribution
    move_counts: dict[str, int] = {}
    for q in quests:
        mt = q.move_type or "wakeUp"
        move_counts[mt] = move_counts.get(mt, 0) + 1

    # Map camelCase keys to snake_case WAVE stages
    mapping = {
        "wakeUp": "wake_up",
        "cleanUp": "clean_up",
        "growUp": "grow_up",
        "showUp": "show_up",
    }
    best = max(move_counts, key=lambda k: move_counts[k])
    return mapping.get(best, "wake_up")  # type: ignore[return-value]


# ---------------------------------------------------------------------------
# check_for_compostable — §3 Composting Check
# ---------------------------------------------------------------------------


async def check_for_compostable(
    ctx: RunContext[AgentDeps] | AgentDeps,
    domain: str,
    proposed_title: str,
) -> list[CompostableItem]:
    """Find existing items that a new output might obsolete.

    Simple heuristic: title similarity via ILIKE on active quests/proposals.
    """
    from app.models.quest import CustomBar

    db = _get_deps(ctx).db

    # Search for quests with similar titles (basic overlap detection)
    search_term = f"%{proposed_title[:40]}%"
    stmt = (
        select(CustomBar)
        .where(
            CustomBar.status == "active",
            CustomBar.title.ilike(search_term),
        )
        .limit(5)
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()

    return [
        CompostableItem(
            item_id=bar.id,
            item_type="quest",
            title=bar.title,
            reason=f"Existing quest with similar title in domain '{domain}'",
        )
        for bar in rows
    ]
