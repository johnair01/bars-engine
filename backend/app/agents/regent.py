"""Regent agent — Campaign structure / Kotter (Blue/Order sect).

The Regent is a meticulous rule-keeper who tracks Kotter stages,
allyship domains, quest threads, and campaign playbooks.
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext

from app.agents._deps import AgentDeps
from app.agents._iching import iching_context_prompt, iching_journal_prompt
from app.agents._instructions import deftness_context, player_narrative_context
from app.agents._tools import load_player_context
from app.config import settings

# ---------------------------------------------------------------------------
# Output schema
# ---------------------------------------------------------------------------


class ThreadStatus(BaseModel):
    """Status of a single quest thread."""

    thread_id: str
    title: str
    status: str
    quest_count: int = 0


class CampaignAssessment(BaseModel):
    """Structured campaign assessment produced by the Regent agent."""

    instance_id: str | None = Field(default=None)
    current_kotter_stage: int = Field(default=1, description="Current Kotter stage (1-8)")
    active_domains: list[str] = Field(
        default_factory=list,
        description="Active allyship domains",
    )
    thread_status: list[ThreadStatus] = Field(
        default_factory=list,
        description="Status of quest threads in this campaign",
    )
    recommended_actions: list[str] = Field(
        default_factory=list,
        description="Recommended next actions for campaign advancement",
    )
    readiness_for_next_stage: float = Field(
        default=0.0,
        description="0.0-1.0 readiness for the next Kotter stage",
    )
    reasoning: str = Field(description="Assessment reasoning")


# ---------------------------------------------------------------------------
# Agent definition
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are the **Regent** — Game Master of the Blue/Order sect.
Your trigram is Lake. Your mission: roles, rules, collective tool.

You are a meticulous rule-keeper who understands campaign structure deeply.
You track Kotter's 8 stages, quest threads, allyship domains, and playbooks.

## Kotter's 8 Stages
1. **Urgency** — Create a sense of need
2. **Coalition** — Build the guiding team
3. **Vision** — Define the desired future
4. **Communicate** — Share the vision widely
5. **Obstacles** — Remove barriers to change
6. **Wins** — Generate short-term victories
7. **Build On** — Consolidate and keep pushing
8. **Anchor** — Institutionalize the change

## Allyship Domains
- **Gathering Resources** — Material support, funding, infrastructure
- **Direct Action** — Active engagement, volunteering, showing up
- **Raise Awareness** — Education, storytelling, media
- **Skillful Organizing** — Coordination, strategy, logistics

## Principles
- Every campaign must progress through Kotter stages sequentially
- Quest threads are the spine of a campaign — track their completion
- Allyship domains should be balanced; flag gaps
- Be precise. Use numbers. Cite evidence.
- Readiness for next stage requires completion criteria met
"""

regent_agent = Agent(
    settings.agent_model,
    deps_type=AgentDeps,
    output_type=CampaignAssessment,
    system_prompt=SYSTEM_PROMPT,
)

regent_agent.system_prompt(player_narrative_context)
regent_agent.system_prompt(iching_context_prompt)
regent_agent.system_prompt(iching_journal_prompt)
regent_agent.system_prompt(deftness_context)


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------


@regent_agent.tool
async def get_campaign_state(ctx: RunContext[AgentDeps]) -> str:
    """Load the campaign instance state."""
    if not ctx.deps.instance_id:
        return "No instance ID set."

    from sqlalchemy import select

    from app.models.campaign import Instance

    db = ctx.deps.db
    stmt = select(Instance).where(Instance.id == ctx.deps.instance_id)
    result = await db.execute(stmt)
    instance = result.scalar_one_or_none()
    if not instance:
        return f"Instance {ctx.deps.instance_id} not found."

    return (
        f"Instance: {instance.name} (slug: {instance.slug})\n"
        f"Domain: {instance.domain_type}\n"
        f"Kotter stage: {instance.kotter_stage}\n"
        f"Campaign ref: {instance.campaign_ref or 'none'}\n"
        f"Event mode: {instance.is_event_mode}"
    )


@regent_agent.tool
async def get_instance_threads(ctx: RunContext[AgentDeps]) -> str:
    """Load quest threads for the current campaign instance."""
    if not ctx.deps.instance_id:
        return "No instance ID set."

    from sqlalchemy import func, select

    from app.models.campaign import EventCampaign
    from app.models.quest import QuestThread, ThreadQuest

    db = ctx.deps.db

    stmt = (
        select(QuestThread, func.count(ThreadQuest.id).label("quest_count"))
        .join(EventCampaign, QuestThread.event_campaign_id == EventCampaign.id)
        .outerjoin(ThreadQuest, ThreadQuest.thread_id == QuestThread.id)
        .where(EventCampaign.instance_id == ctx.deps.instance_id)
        .group_by(QuestThread.id)
    )
    result = await db.execute(stmt)
    rows = result.all()

    if not rows:
        return "No quest threads found for this instance."

    lines = []
    for thread, count in rows:
        lines.append(f"- {thread.title} (status: {thread.status}, quests: {count})")

    return "\n".join(lines)


@regent_agent.tool
async def get_campaign_playbook(ctx: RunContext[AgentDeps]) -> str:
    """Load the campaign playbook for the current instance."""
    if not ctx.deps.instance_id:
        return "No instance ID set."

    from sqlalchemy import select

    from app.models.campaign import CampaignPlaybook

    db = ctx.deps.db
    stmt = select(CampaignPlaybook).where(CampaignPlaybook.instance_id == ctx.deps.instance_id)
    result = await db.execute(stmt)
    playbook = result.scalar_one_or_none()

    if not playbook:
        return "No playbook found for this instance."

    return (
        f"Vision: {playbook.vision}\n"
        f"People: {playbook.people}\n"
        f"Timeline: {playbook.timeline}\n"
        f"Domain strategy: {playbook.domain_strategy}"
    )


@regent_agent.tool
async def get_player_context(ctx: RunContext[AgentDeps]) -> str:
    """Load the current player's context."""
    player = await load_player_context(ctx)
    if not player:
        return "No player context available."
    return player.model_dump_json()


# ---------------------------------------------------------------------------
# Deterministic fallback
# ---------------------------------------------------------------------------


def deterministic_regent_assessment(instance_id: str) -> CampaignAssessment:
    """Produce a template campaign assessment without AI."""
    return CampaignAssessment(
        instance_id=instance_id,
        current_kotter_stage=1,
        recommended_actions=[
            "Review campaign playbook",
            "Identify coalition members",
            "Define vision statement",
        ],
        readiness_for_next_stage=0.0,
        reasoning="Deterministic fallback — no AI model available. Review campaign state manually.",
    )
