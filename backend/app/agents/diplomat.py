"""Diplomat agent — Community / onboarding (Green/Care sect).

The Diplomat is a warm community weaver who guides onboarding,
BAR sharing, campaign matching, and events.
Respects Portland community's AI allergy.
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext

from app.agents._deps import AgentDeps
from app.agents._lore import NPC_LORE
from app.agents._iching import iching_context_prompt, iching_journal_prompt
from app.agents._instructions import deftness_context, player_narrative_context
from app.agents._tools import load_player_context
from app.config import settings

# ---------------------------------------------------------------------------
# Output schema
# ---------------------------------------------------------------------------


class CommunityGuidance(BaseModel):
    """Structured community guidance produced by the Diplomat agent."""

    recommended_instance: str | None = Field(
        default=None, description="Recommended campaign instance to join"
    )
    recommended_campaign_domain: str | None = Field(
        default=None,
        description="Recommended allyship domain",
    )
    onboarding_next_step: str | None = Field(
        default=None, description="Next onboarding step"
    )
    bar_sharing_suggestions: list[str] = Field(
        default_factory=list,
        description="Suggestions for BARs to share or create",
    )
    event_recommendations: list[str] = Field(
        default_factory=list,
        description="Recommended upcoming events",
    )
    tone: str = Field(
        default="warm",
        description="Tone of guidance: warm, encouraging, practical",
    )
    message: str = Field(description="The Diplomat's guidance message")


# ---------------------------------------------------------------------------
# Agent definition
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = f"""\
You are **{NPC_LORE['diplomat']['name']}**, the Diplomat guide.
{NPC_LORE['diplomat']['description']}
Your vibe is {NPC_LORE['diplomat']['vibe']}

You are a warm community weaver. You guide players through onboarding,
help them share BARs, match them with campaigns, and recommend events.


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

## Important Context
The Portland community around this project has a strong allergy to AI.
Your guidance should:
- Emphasize human connection over AI-generated content
- Frame technology as a tool for human expression, not a replacement
- Respect that the non-AI version is a first-class delivery mode
- Never be pushy about AI features

## Onboarding Flow
1. Welcome → Nation selection → Archetype selection
2. First quest assignment → First quest completion
3. Campaign introduction → Instance membership
4. BAR creation → BAR sharing

## Allyship Domains
- Gathering Resources
- Direct Action
- Raise Awareness
- Skillful Organizing

## Principles
- Be warm but not saccharine
- Concrete suggestions, not abstract encouragement
- Respect the player's pace — don't rush onboarding
- Community first, individual second
- A BAR shared is a seed planted
"""

diplomat_agent = Agent(
    settings.agent_model,
    deps_type=AgentDeps,
    output_type=CommunityGuidance,
    system_prompt=SYSTEM_PROMPT,
)

diplomat_agent.system_prompt(player_narrative_context)
diplomat_agent.system_prompt(iching_context_prompt)
diplomat_agent.system_prompt(iching_journal_prompt)
diplomat_agent.system_prompt(deftness_context)


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------


@diplomat_agent.tool
async def get_player_context(ctx: RunContext[AgentDeps]) -> str:
    """Load the current player's context."""
    player = await load_player_context(ctx)
    if not player:
        return "No player context available."
    return player.model_dump_json()


@diplomat_agent.tool
async def get_player_onboarding_state(ctx: RunContext[AgentDeps]) -> str:
    """Check the player's onboarding progress."""
    if not ctx.deps.player_id:
        return "No player ID set."

    from sqlalchemy import select

    from app.models.player import Player

    db = ctx.deps.db
    stmt = select(Player).where(Player.id == ctx.deps.player_id)
    result = await db.execute(stmt)
    player = result.scalar_one_or_none()
    if not player:
        return "Player not found."

    return (
        f"Onboarding mode: {player.onboarding_mode}\n"
        f"Onboarding complete: {player.onboarding_complete}\n"
        f"Has seen welcome: {player.has_seen_welcome}\n"
        f"Has seen campaign entry: {player.has_seen_campaign_entry}\n"
        f"Has completed first quest: {player.has_completed_first_quest}\n"
        f"Has created first quest: {player.has_created_first_quest}"
    )


@diplomat_agent.tool
async def get_available_instances(ctx: RunContext[AgentDeps]) -> str:
    """List available campaign instances the player could join."""
    from sqlalchemy import select

    from app.models.campaign import Instance

    db = ctx.deps.db
    stmt = select(Instance).order_by(Instance.created_at.desc()).limit(10)
    result = await db.execute(stmt)
    instances = result.scalars().all()

    if not instances:
        return "No campaign instances available."

    lines = []
    for inst in instances:
        lines.append(f"- {inst.name} (domain: {inst.domain_type}, kotter: {inst.kotter_stage})")
    return "\n".join(lines)


@diplomat_agent.tool
async def get_recent_bar_shares(ctx: RunContext[AgentDeps]) -> str:
    """Load recent BAR shares for context."""
    if not ctx.deps.player_id:
        return "No player ID set."

    from sqlalchemy import select

    from app.models.player import BarShare

    db = ctx.deps.db
    stmt = (
        select(BarShare)
        .where(
            (BarShare.from_user_id == ctx.deps.player_id)
            | (BarShare.to_user_id == ctx.deps.player_id)
        )
        .order_by(BarShare.created_at.desc())
        .limit(5)
    )
    result = await db.execute(stmt)
    shares = result.scalars().all()

    if not shares:
        return "No recent BAR shares."

    return f"{len(shares)} recent BAR share(s) found."


# ---------------------------------------------------------------------------
# Deterministic fallback
# ---------------------------------------------------------------------------


def deterministic_diplomat_guidance() -> CommunityGuidance:
    """Produce template community guidance without AI."""
    return CommunityGuidance(
        onboarding_next_step="Complete your nation and archetype selection to unlock quests.",
        bar_sharing_suggestions=[
            "Create a BAR about something you care about",
            "Share a BAR with someone in your campaign",
        ],
        tone="warm",
        message=(
            "Welcome to the community. The best way to get started is to pick "
            "a nation that resonates with you, choose an archetype that reflects "
            "your style, and then dive into your first quest. "
            "Everything else follows from there."
        ),
    )
