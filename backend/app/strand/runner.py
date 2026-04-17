"""Strand execution — coordinator shell + diagnostic preset."""

from __future__ import annotations

import logging
from datetime import UTC, datetime

try:
    from pydantic_ai_slim.pydantic_ai._tool_manager import ToolManager
except ImportError:
    from pydantic_ai._tool_manager import ToolManager
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents._deps import AgentDeps
from app.agents.architect import architect_agent, deterministic_architect_draft
from app.agents.sage import deterministic_sage_response, sage_agent
from app.agents.shaman import deterministic_shaman_reading, shaman_agent
from app.config import settings
from app.models.quest import CustomBar
from app.strand.creator import resolve_strand_creator_id
from app.strand.schemas import StrandMetadata

logger = logging.getLogger(__name__)

STRAND_TYPES = ("research", "postmortem", "implementation", "operational", "diagnostic", "content", "backlog")
DIAGNOSTIC_SECT_SEQUENCE = ["shaman", "sage", "architect"]


async def run_strand(
    session: AsyncSession,
    strand_type: str,
    subject: str,
    *,
    create_branch: bool = False,
    sects: list[str] | None = None,
) -> dict:
    """
    Execute a strand: create strand BAR, run coordinator sequence, produce output BARs.

    Returns: { strand_bar_id, output_bar_ids, branch?, provenance }
    """
    if strand_type not in STRAND_TYPES:
        raise ValueError(f"Invalid strand_type: {strand_type}. Must be one of {STRAND_TYPES}")

    creator_id = await resolve_strand_creator_id(session)

    # 1. Create strand BAR (metadata placeholder)
    strand_meta = StrandMetadata(
        agent_sequence=[],
        phase_temperature=0.7,
        output_thread_links=[],
        audit_trail=[],
        branch_reference=None,
    )
    strand_bar = CustomBar(
        creator_id=creator_id,
        title=f"Strand: {strand_type} — {subject[:50]}",
        description=f"Multi-agent investigation: {subject}",
        type="strand",
        status="active",
        visibility="private",
        is_system=True,
        strand_metadata=strand_meta.model_dump_json(),
    )
    session.add(strand_bar)
    await session.flush()

    # 2. Run sect sequence (diagnostic preset: shaman -> sage -> architect)
    sect_sequence = sects or DIAGNOSTIC_SECT_SEQUENCE
    deps = AgentDeps(db=session, player_id=None, instance_id=None, iching_context=None)

    outputs: list[str] = []
    audit_trail: list[dict] = []

    # Single shared AsyncSession: pydantic-ai defaults to parallel tool calls, which asyncpg rejects
    # (another operation is in progress). Strand runs must serialize tool execution.
    with ToolManager.parallel_execution_mode(
        # Use sequential mode to prevent asyncpg conflict (Render deploy 2026-04-17)
        # import path: pydantic_ai_slim.pydantic_ai._tool_manager (v0.1.x)
        # fallback: pydantic_ai._tool_manager (v0.84.x)
        "sequential"
    ):
        for sect in sect_sequence:
            if sect == "shaman":
                # --- before advocacy ---
                audit_trail.append({
                    "sect": "shaman",
                    "event": "before_advocacy",
                    "timestamp": datetime.now(UTC).isoformat(),
                    "data": {
                        "shouldRun": True,
                        "reason": "Shaman reads root-cause emotional landscape before any synthesis.",
                    },
                })

                # --- run ---
                if settings.openai_api_key.get_secret_value():
                    try:
                        r = await shaman_agent.run(f"Read the emotional/root-cause landscape for: {subject}", deps=deps)
                        shaman_out = r.output.model_dump_json()
                    except Exception as e:
                        logger.warning("Shaman failed", exc_info=True)
                        # during flag — recoverable fallback
                        audit_trail.append({
                            "sect": "shaman",
                            "event": "during_flag",
                            "timestamp": datetime.now(UTC).isoformat(),
                            "data": {
                                "flag": "agent_error",
                                "message": str(e),
                                "severity": "warn",
                            },
                        })
                        shaman_out = deterministic_shaman_reading(subject).model_dump_json()
                else:
                    shaman_out = deterministic_shaman_reading(subject).model_dump_json()

                audit_trail.append({
                    "sect": "shaman",
                    "event": "run",
                    "timestamp": datetime.now(UTC).isoformat(),
                    "data": {"output_preview": shaman_out[:200]},
                })

                # --- after retro ---
                audit_trail.append({
                    "sect": "shaman",
                    "event": "after_retro",
                    "timestamp": datetime.now(UTC).isoformat(),
                    "data": {
                        "retrospective": (
                            "Shaman surfaced emotional/root-cause terrain. "
                            "Sage should synthesize before Architect commits to a spec shape."
                        ),
                        "suggestedImprovements": [
                            "Consider multi-pass shaman reading for high-ambiguity subjects.",
                        ],
                    },
                })

            elif sect == "sage":
                # --- before advocacy ---
                audit_trail.append({
                    "sect": "sage",
                    "event": "before_advocacy",
                    "timestamp": datetime.now(UTC).isoformat(),
                    "data": {
                        "shouldRun": True,
                        "reason": "Sage synthesizes shaman output into structured next steps before Architect specs.",
                    },
                })

                # --- run ---
                if settings.openai_api_key.get_secret_value():
                    try:
                        r = await sage_agent.run(
                            f"Synthesize root cause and next steps for: {subject}",
                            deps=deps,
                        )
                        sage_out = r.output.synthesis
                    except Exception as e:
                        logger.warning("Sage failed", exc_info=True)
                        audit_trail.append({
                            "sect": "sage",
                            "event": "during_flag",
                            "timestamp": datetime.now(UTC).isoformat(),
                            "data": {
                                "flag": "agent_error",
                                "message": str(e),
                                "severity": "warn",
                            },
                        })
                        sage_out = deterministic_sage_response(subject).synthesis
                else:
                    sage_out = deterministic_sage_response(subject).synthesis

                audit_trail.append({
                    "sect": "sage",
                    "event": "run",
                    "timestamp": datetime.now(UTC).isoformat(),
                    "data": {"synthesis_preview": sage_out[:200]},
                })

                # --- after retro ---
                audit_trail.append({
                    "sect": "sage",
                    "event": "after_retro",
                    "timestamp": datetime.now(UTC).isoformat(),
                    "data": {
                        "retrospective": (
                            "Sage produced synthesis. "
                            "Architect should anchor spec grammar to the emotional root cause surfaced here."
                        ),
                        "suggestedImprovements": [
                            "Cross-reference synthesis against shaman reading for coherence gaps.",
                        ],
                    },
                })

            elif sect == "architect":
                narrative_lock = f"Root cause / diagnostic: {subject}"

                # --- before advocacy ---
                audit_trail.append({
                    "sect": "architect",
                    "event": "before_advocacy",
                    "timestamp": datetime.now(UTC).isoformat(),
                    "data": {
                        "shouldRun": True,
                        "suggestRoute": "epiphany_bridge",
                        "reason": "Architect commits shaman+sage findings into a durable spec BAR.",
                    },
                })

                # --- run ---
                if settings.openai_api_key.get_secret_value():
                    try:
                        r = await architect_agent.run(
                            f"Design a diagnostic spec for: {narrative_lock}\nGrammar: epiphany_bridge",
                            deps=deps,
                        )
                        draft = r.output
                    except Exception as e:
                        logger.warning("Architect failed", exc_info=True)
                        audit_trail.append({
                            "sect": "architect",
                            "event": "during_flag",
                            "timestamp": datetime.now(UTC).isoformat(),
                            "data": {
                                "flag": "agent_error",
                                "message": str(e),
                                "severity": "warn",
                            },
                        })
                        draft = deterministic_architect_draft(narrative_lock, "epiphany_bridge")
                else:
                    draft = deterministic_architect_draft(narrative_lock, "epiphany_bridge")

                # Create output spec BAR
                spec_bar = CustomBar(
                    creator_id=creator_id,
                    title=draft.title[:80] if draft.title else f"Diagnostic spec: {subject[:40]}",
                    description=draft.description or f"Spec from strand diagnostic: {subject}",
                    type="vibe",
                    status="active",
                    visibility="private",
                    is_system=True,
                    source_bar_id=strand_bar.id,
                )
                session.add(spec_bar)
                await session.flush()
                outputs.append(spec_bar.id)

                audit_trail.append({
                    "sect": "architect",
                    "event": "run",
                    "timestamp": datetime.now(UTC).isoformat(),
                    "data": {"output_bar_id": spec_bar.id},
                })

                # --- after retro ---
                audit_trail.append({
                    "sect": "architect",
                    "event": "after_retro",
                    "timestamp": datetime.now(UTC).isoformat(),
                    "data": {
                        "retrospective": (
                            "Architect produced spec BAR. "
                            "Review grammar alignment (epiphany_bridge) against strand subject before promotion."
                        ),
                        "suggestedImprovements": [
                            "Validate spec BAR title length and description completeness before player exposure.",
                            "Consider linking spec BAR back to shaman/sage audit entries for full provenance.",
                        ],
                    },
                })

    # 3. Ensure at least one output (spec)
    if not outputs:
        fallback_bar = CustomBar(
            creator_id=creator_id,
            title=f"Strand output: {subject[:50]}",
            description=f"Placeholder spec from strand ({strand_type}): {subject}",
            type="vibe",
            status="active",
            visibility="private",
            is_system=True,
            source_bar_id=strand_bar.id,
        )
        session.add(fallback_bar)
        await session.flush()
        outputs.append(fallback_bar.id)

    # 4. Update strand BAR with results
    strand_meta.agent_sequence = sect_sequence
    strand_meta.output_thread_links = [{"bar_id": oid} for oid in outputs]
    strand_meta.audit_trail = audit_trail
    strand_bar.strand_metadata = strand_meta.model_dump_json()

    await session.commit()

    return {
        "strand_bar_id": strand_bar.id,
        "output_bar_ids": outputs,
        "branch": None,  # Phase 2
        "provenance": {
            "strand_bar_id": strand_bar.id,
            "output_bar_ids": outputs,
        },
    }
