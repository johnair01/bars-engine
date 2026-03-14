"""Agent API routes — one endpoint per Game Master sect."""

from __future__ import annotations

import logging
import urllib.parse

import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents._deps import AgentDeps
from app.agents._iching import log_hexagram_encounter
from app.agents._schemas import GitHubIssueResult, ReportIssueRequest
from app.agents._tools import check_for_compostable, discern_wave_move
from app.agents.architect import (
    QuestCompilation,
    QuestDraft,
    architect_agent,
    architect_compile_agent,
    deterministic_architect_compile,
    deterministic_architect_draft,
)
from app.agents.challenger import MoveProposal, challenger_agent, deterministic_challenger_proposal
from app.agents.mapping_proposer import (
    MappingProposal,
    mapping_proposer_agent,
    deterministic_mapping_proposal,
)
from app.agents.diplomat import CommunityGuidance, diplomat_agent, deterministic_diplomat_guidance
from app.agents.mind import create_mind, get_mind, step_mind
from app.agents.regent import CampaignAssessment, regent_agent, deterministic_regent_assessment
from app.agents.sage import SageResponse, sage_agent, deterministic_sage_response
from app.agents.shaman import EmotionalAlchemyReading, shaman_agent, deterministic_shaman_reading
from app.auth import get_current_player_id
from app.config import settings
from app.database import get_db
from app.schemas.agents import (
    AgentMindCreateRequest,
    AgentResponse,
    ArchitectAnalyzeChunkRequest,
    ArchitectCompileRequest,
    ArchitectDraftRequest,
    ChallengerProposeRequest,
    DiplomatBridgeRequest,
    DiplomatGuideRequest,
    DiplomatRefineCopyRequest,
    FaceTaskRequest,
    IChingContextPayload,
    MappingProposerRequest,
    RegentAssessRequest,
    SageConsultRequest,
    ShamanIdentifyRequest,
    ShamanReadRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agents", tags=["agents"])


def _iching_to_dict(ic: IChingContextPayload | None) -> dict | None:
    """Convert IChingContextPayload to dict for AgentDeps."""
    return ic.model_dump() if ic else None


# ---------------------------------------------------------------------------
# Architect — POST /api/agents/architect/draft
# ---------------------------------------------------------------------------


@router.post("/architect/draft", response_model=AgentResponse[QuestDraft])
async def architect_draft(
    body: ArchitectDraftRequest,
    db: AsyncSession = Depends(get_db),
    player_id: str | None = Depends(get_current_player_id),
):
    """Generate a quest draft from a narrative lock using the Architect agent."""
    pid = body.player_id or player_id
    ic_dict = _iching_to_dict(body.iching_context)
    deps = AgentDeps(db=db, player_id=pid, instance_id=body.instance_id, iching_context=ic_dict)

    # Dual-track: deterministic fallback if no API key
    if not settings.openai_api_key:
        draft = deterministic_architect_draft(body.narrative_lock, body.quest_grammar)

        # Best-effort composting check (DB may not be available)
        compostable_ids = await _safe_composting_check(deps, draft.title)

        return AgentResponse[QuestDraft](
            agent="architect",
            output=draft,
            deterministic=True,
            legibility_note="Deterministic fallback — no AI model configured.",
            generative_deps=compostable_ids,
        )

    # AI path (falls back to deterministic on failure)
    prompt = (
        f"Design a quest for this narrative lock: '{body.narrative_lock}'\n"
        f"Quest grammar: {body.quest_grammar}\n"
    )

    try:
        result = await architect_agent.run(prompt, deps=deps)
        draft = result.output
        move = await _safe_discern_move(deps)
        compostable_ids = await _safe_composting_check(deps, draft.title)

        # Log hexagram encounter if I Ching context provided
        if ic_dict:
            await log_hexagram_encounter(
                db=db,
                agent_name="architect",
                iching_context=ic_dict,
                emotional_alchemy_tag=draft.emotional_alchemy_tag,
                player_id=pid,
            )

        return AgentResponse[QuestDraft](
            agent="architect",
            output=draft,
            discerned_move=move,
            legibility_note=f"Quest designed for narrative lock using {body.quest_grammar} grammar.",
            generative_deps=compostable_ids,
            usage_tokens=result.usage().total_tokens if result.usage() else None,
        )
    except Exception:
        logger.warning("Architect AI path failed, falling back to deterministic", exc_info=True)
        draft = deterministic_architect_draft(body.narrative_lock, body.quest_grammar)
        return AgentResponse[QuestDraft](
            agent="architect",
            output=draft,
            deterministic=True,
            legibility_note="AI path failed — deterministic fallback used.",
        )


# ---------------------------------------------------------------------------
# Challenger — POST /api/agents/challenger/propose
# ---------------------------------------------------------------------------


@router.post("/challenger/propose", response_model=AgentResponse[MoveProposal])
async def challenger_propose(
    body: ChallengerProposeRequest,
    db: AsyncSession = Depends(get_db),
    player_id: str | None = Depends(get_current_player_id),
):
    """Propose available moves for the current player using the Challenger agent."""
    pid = body.player_id or player_id
    ic_dict = _iching_to_dict(body.iching_context)
    deps = AgentDeps(db=db, player_id=pid, instance_id=body.instance_id, iching_context=ic_dict)

    if not settings.openai_api_key:
        proposal = deterministic_challenger_proposal(body.quest_id)
        return AgentResponse[MoveProposal](
            agent="challenger",
            output=proposal,
            deterministic=True,
            legibility_note="Deterministic fallback — no AI model configured.",
        )

    prompt = "Analyze the player's current state and propose available moves."
    if body.quest_id:
        prompt += f"\nQuest context: {body.quest_id}"

    try:
        result = await challenger_agent.run(prompt, deps=deps)
        move = await _safe_discern_move(deps)

        if ic_dict:
            await log_hexagram_encounter(
                db=db, agent_name="challenger", iching_context=ic_dict, player_id=pid,
            )

        return AgentResponse[MoveProposal](
            agent="challenger",
            output=result.output,
            discerned_move=move,
            legibility_note="Move proposal based on player's energy, unlocks, and equipped slots.",
            usage_tokens=result.usage().total_tokens if result.usage() else None,
        )
    except Exception:
        logger.warning("Challenger AI path failed, falling back to deterministic", exc_info=True)
        return AgentResponse[MoveProposal](
            agent="challenger",
            output=deterministic_challenger_proposal(body.quest_id),
            deterministic=True,
            legibility_note="AI path failed — deterministic fallback used.",
        )


# ---------------------------------------------------------------------------
# Shaman — POST /api/agents/shaman/read
# ---------------------------------------------------------------------------


@router.post("/shaman/read", response_model=AgentResponse[EmotionalAlchemyReading])
async def shaman_read(
    body: ShamanReadRequest,
    db: AsyncSession = Depends(get_db),
    player_id: str | None = Depends(get_current_player_id),
):
    """Get an emotional alchemy reading from the Shaman agent."""
    pid = body.player_id or player_id
    ic_dict = _iching_to_dict(body.iching_context)
    deps = AgentDeps(db=db, player_id=pid, instance_id=body.instance_id, iching_context=ic_dict)

    if not settings.openai_api_key:
        reading = deterministic_shaman_reading(body.context)
        return AgentResponse[EmotionalAlchemyReading](
            agent="shaman",
            output=reading,
            deterministic=True,
            legibility_note="Deterministic fallback — no AI model configured.",
        )

    prompt = "Read the player's emotional state and provide guidance."
    if body.context:
        prompt += f"\nContext: {body.context}"

    try:
        result = await shaman_agent.run(prompt, deps=deps)
        move = await _safe_discern_move(deps)

        if ic_dict:
            await log_hexagram_encounter(
                db=db,
                agent_name="shaman",
                iching_context=ic_dict,
                emotional_alchemy_tag=result.output.current_element,
                player_id=pid,
            )

        return AgentResponse[EmotionalAlchemyReading](
            agent="shaman",
            output=result.output,
            discerned_move=move,
            legibility_note="Emotional alchemy reading based on player's state and history.",
            usage_tokens=result.usage().total_tokens if result.usage() else None,
        )
    except Exception:
        logger.warning("Shaman AI path failed, falling back to deterministic", exc_info=True)
        return AgentResponse[EmotionalAlchemyReading](
            agent="shaman",
            output=deterministic_shaman_reading(body.context),
            deterministic=True,
            legibility_note="AI path failed — deterministic fallback used.",
        )


# ---------------------------------------------------------------------------
# Regent — POST /api/agents/regent/assess
# ---------------------------------------------------------------------------


@router.post("/regent/assess", response_model=AgentResponse[CampaignAssessment])
async def regent_assess(
    body: RegentAssessRequest,
    db: AsyncSession = Depends(get_db),
    player_id: str | None = Depends(get_current_player_id),
):
    """Assess campaign structure using the Regent agent."""
    pid = body.player_id or player_id
    ic_dict = _iching_to_dict(body.iching_context)
    deps = AgentDeps(db=db, player_id=pid, instance_id=body.instance_id, iching_context=ic_dict)

    if not settings.openai_api_key:
        assessment = deterministic_regent_assessment(body.instance_id)
        return AgentResponse[CampaignAssessment](
            agent="regent",
            output=assessment,
            deterministic=True,
            legibility_note="Deterministic fallback — no AI model configured.",
        )

    prompt = f"Assess the campaign structure for instance {body.instance_id}."
    try:
        result = await regent_agent.run(prompt, deps=deps)
        move = await _safe_discern_move(deps)

        if ic_dict:
            await log_hexagram_encounter(
                db=db, agent_name="regent", iching_context=ic_dict, player_id=pid,
            )

        return AgentResponse[CampaignAssessment](
            agent="regent",
            output=result.output,
            discerned_move=move,
            legibility_note="Campaign assessment based on Kotter stages, threads, and playbook.",
            usage_tokens=result.usage().total_tokens if result.usage() else None,
        )
    except Exception:
        logger.warning("Regent AI path failed, falling back to deterministic", exc_info=True)
        return AgentResponse[CampaignAssessment](
            agent="regent",
            output=deterministic_regent_assessment(body.instance_id),
            deterministic=True,
            legibility_note="AI path failed — deterministic fallback used.",
        )


# ---------------------------------------------------------------------------
# Diplomat — POST /api/agents/diplomat/guide
# ---------------------------------------------------------------------------


@router.post("/diplomat/guide", response_model=AgentResponse[CommunityGuidance])
async def diplomat_guide(
    body: DiplomatGuideRequest,
    db: AsyncSession = Depends(get_db),
    player_id: str | None = Depends(get_current_player_id),
):
    """Get community guidance from the Diplomat agent."""
    pid = body.player_id or player_id
    ic_dict = _iching_to_dict(body.iching_context)
    deps = AgentDeps(db=db, player_id=pid, instance_id=body.instance_id, iching_context=ic_dict)

    if not settings.openai_api_key:
        guidance = deterministic_diplomat_guidance()
        return AgentResponse[CommunityGuidance](
            agent="diplomat",
            output=guidance,
            deterministic=True,
            legibility_note="Deterministic fallback — no AI model configured.",
        )

    prompt = "Guide this player on community engagement and next steps."
    try:
        result = await diplomat_agent.run(prompt, deps=deps)
        move = await _safe_discern_move(deps)

        if ic_dict:
            await log_hexagram_encounter(
                db=db, agent_name="diplomat", iching_context=ic_dict, player_id=pid,
            )

        return AgentResponse[CommunityGuidance](
            agent="diplomat",
            output=result.output,
            discerned_move=move,
            legibility_note="Community guidance based on onboarding state and available campaigns.",
            usage_tokens=result.usage().total_tokens if result.usage() else None,
        )
    except Exception:
        logger.warning("Diplomat AI path failed, falling back to deterministic", exc_info=True)
        return AgentResponse[CommunityGuidance](
            agent="diplomat",
            output=deterministic_diplomat_guidance(),
            deterministic=True,
            legibility_note="AI path failed — deterministic fallback used.",
        )


# ---------------------------------------------------------------------------
# Sage — POST /api/agents/sage/consult
# ---------------------------------------------------------------------------


@router.post("/sage/consult", response_model=AgentResponse[SageResponse])
async def sage_consult(
    body: SageConsultRequest,
    db: AsyncSession = Depends(get_db),
    player_id: str | None = Depends(get_current_player_id),
):
    """Consult the Sage meta-agent for integrated guidance."""
    pid = body.player_id or player_id
    ic_dict = _iching_to_dict(body.iching_context)
    deps = AgentDeps(db=db, player_id=pid, instance_id=body.instance_id, iching_context=ic_dict)

    if not settings.openai_api_key:
        response = deterministic_sage_response(body.question)
        return AgentResponse[SageResponse](
            agent="sage",
            output=response,
            deterministic=True,
            legibility_note="Deterministic fallback — no AI model configured.",
        )

    try:
        result = await sage_agent.run(body.question, deps=deps)
        move = await _safe_discern_move(deps)

        if ic_dict:
            await log_hexagram_encounter(
                db=db, agent_name="sage", iching_context=ic_dict, player_id=pid,
            )

        return AgentResponse[SageResponse](
            agent="sage",
            output=result.output,
            discerned_move=move,
            legibility_note="Sage synthesis from consulted specialist agents.",
            usage_tokens=result.usage().total_tokens if result.usage() else None,
        )
    except Exception:
        logger.warning("Sage AI path failed, falling back to deterministic", exc_info=True)
        return AgentResponse[SageResponse](
            agent="sage",
            output=deterministic_sage_response(body.question),
            deterministic=True,
            legibility_note="AI path failed — deterministic fallback used.",
        )


# ---------------------------------------------------------------------------
# Generic Task — POST /api/agents/{face}/task (DC-6 Six-Face Parallel)
# ---------------------------------------------------------------------------

def _deterministic_face_output(face: str, task: str, instance_id: str | None) -> dict:
    """Produce a stub output for each face when AI is unavailable."""
    if face == "sage":
        out = deterministic_sage_response(task[:500])
        return out.model_dump()
    if face == "shaman":
        out = deterministic_shaman_reading(task[:300])
        return out.model_dump()
    if face == "challenger":
        out = deterministic_challenger_proposal()
        return out.model_dump()
    if face == "regent":
        out = deterministic_regent_assessment(instance_id or "default")
        return out.model_dump()
    if face == "architect":
        out = deterministic_architect_draft(task[:200], "epiphany_bridge")
        return out.model_dump()
    if face == "diplomat":
        out = deterministic_diplomat_guidance()
        return out.model_dump()
    return {"message": f"[{face}] Task received (deterministic stub): {task[:100]}..."}


@router.post("/{face}/task", response_model=AgentResponse[dict])
async def face_task(
    face: str,
    body: FaceTaskRequest,
    db: AsyncSession = Depends(get_db),
    player_id: str | None = Depends(get_current_player_id),
):
    """Run a generic task for a Game Master face. DC-6 parallel feature work."""
    VALID_FACES = ("shaman", "challenger", "regent", "architect", "diplomat", "sage")
    if face not in VALID_FACES:
        from fastapi import HTTPException
        raise HTTPException(404, f"Unknown face: {face}")

    AGENTS = {
        "shaman": shaman_agent,
        "challenger": challenger_agent,
        "regent": regent_agent,
        "architect": architect_agent,
        "diplomat": diplomat_agent,
        "sage": sage_agent,
    }
    agent = AGENTS[face]

    pid = body.player_id or player_id
    ic_dict = _iching_to_dict(body.iching_context)
    deps = AgentDeps(db=db, player_id=pid, instance_id=body.instance_id, iching_context=ic_dict)

    prompt = body.task
    if body.feature_id:
        prompt = f"[Feature: {body.feature_id}]\n\n{prompt}"

    if not settings.openai_api_key:
        payload = _deterministic_face_output(face, prompt, body.instance_id)
        return AgentResponse[dict](
            agent=face,
            output=payload,
            deterministic=True,
            legibility_note="Deterministic fallback — no AI model configured.",
        )

    try:
        result = await agent.run(prompt, deps=deps)
        out = result.output
        payload = out.model_dump() if hasattr(out, "model_dump") else {"output": str(out)}
        move = await _safe_discern_move(deps)
        return AgentResponse[dict](
            agent=face,
            output=payload,
            discerned_move=move,
            usage_tokens=result.usage().total_tokens if result.usage() else None,
        )
    except Exception as e:
        logger.warning("Face task AI path failed", exc_info=True)
        payload = _deterministic_face_output(face, prompt, body.instance_id)
        payload["_fallback_error"] = str(e)
        return AgentResponse[dict](
            agent=face,
            output=payload,
            deterministic=True,
            legibility_note=f"AI path failed — deterministic fallback used: {e}",
        )


# ---------------------------------------------------------------------------
# Architect Compile — POST /api/agents/architect/compile
# ---------------------------------------------------------------------------


@router.post("/architect/compile", response_model=AgentResponse[QuestCompilation])
async def architect_compile(
    body: ArchitectCompileRequest,
    db: AsyncSession = Depends(get_db),
    player_id: str | None = Depends(get_current_player_id),
):
    """Compile a full quest from unpacking answers using the Architect agent."""
    pid = body.player_id or player_id
    ic_dict = _iching_to_dict(body.iching_context)
    deps = AgentDeps(db=db, player_id=pid, instance_id=body.instance_id, iching_context=ic_dict)

    if not settings.openai_api_key:
        compilation = deterministic_architect_compile(body.unpacking_answers, body.quest_grammar)
        return AgentResponse[QuestCompilation](
            agent="architect",
            output=compilation,
            deterministic=True,
            legibility_note="Deterministic fallback — no AI model configured.",
        )

    import json

    prompt_parts = [
        f"Compile a quest from these unpacking answers:\n{json.dumps(body.unpacking_answers, indent=2)}",
        f"Quest grammar: {body.quest_grammar}",
    ]
    if body.emotional_signature:
        prompt_parts.append(f"Emotional signature: {json.dumps(body.emotional_signature)}")

    prompt = "\n".join(prompt_parts)

    try:
        result = await architect_compile_agent.run(prompt, deps=deps)
        compilation = result.output
        move = await _safe_discern_move(deps)

        # Log hexagram encounter with the agent's own interpretation
        if ic_dict:
            await log_hexagram_encounter(
                db=db,
                agent_name="architect",
                iching_context=ic_dict,
                interpretation_summary=compilation.hexagram_interpretation,
                emotional_alchemy_tag=compilation.emotional_alchemy_tag,
                player_id=pid,
            )

        return AgentResponse[QuestCompilation](
            agent="architect",
            output=compilation,
            discerned_move=move,
            legibility_note=f"Quest compiled using {body.quest_grammar} grammar via Architect.",
            usage_tokens=result.usage().total_tokens if result.usage() else None,
        )
    except Exception:
        logger.warning("Architect compile AI failed, falling back to deterministic", exc_info=True)
        compilation = deterministic_architect_compile(body.unpacking_answers, body.quest_grammar)
        return AgentResponse[QuestCompilation](
            agent="architect",
            output=compilation,
            deterministic=True,
            legibility_note="AI path failed — deterministic fallback used.",
        )


# ---------------------------------------------------------------------------
# Diplomat Bridge — POST /api/agents/diplomat/bridge
# ---------------------------------------------------------------------------


@router.post("/diplomat/bridge", response_model=AgentResponse[CommunityGuidance])
async def diplomat_bridge(
    body: DiplomatBridgeRequest,
    db: AsyncSession = Depends(get_db),
    player_id: str | None = Depends(get_current_player_id),
):
    """Generate a storyteller bridge from in-game narrative to real-world action."""
    pid = body.player_id or player_id
    ic_dict = _iching_to_dict(body.iching_context)
    deps = AgentDeps(db=db, player_id=pid, instance_id=body.instance_id, iching_context=ic_dict)

    if not settings.openai_api_key:
        return AgentResponse[CommunityGuidance](
            agent="diplomat",
            output=deterministic_diplomat_guidance(),
            deterministic=True,
            legibility_note="Deterministic fallback — no AI model configured.",
        )

    prompt = (
        f"Bridge this in-game narrative to a real-world action:\n\n{body.narrative_text}\n"
    )
    if body.move_type:
        prompt += f"\nWAVE move type: {body.move_type}"

    try:
        result = await diplomat_agent.run(prompt, deps=deps)

        if ic_dict:
            await log_hexagram_encounter(
                db=db, agent_name="diplomat", iching_context=ic_dict, player_id=pid,
            )

        return AgentResponse[CommunityGuidance](
            agent="diplomat",
            output=result.output,
            legibility_note="Storyteller bridge — narrative to real-world action.",
            usage_tokens=result.usage().total_tokens if result.usage() else None,
        )
    except Exception:
        logger.warning("Diplomat bridge failed, falling back to deterministic", exc_info=True)
        return AgentResponse[CommunityGuidance](
            agent="diplomat",
            output=deterministic_diplomat_guidance(),
            deterministic=True,
            legibility_note="AI path failed — deterministic fallback used.",
        )


# ---------------------------------------------------------------------------
# Diplomat Refine Copy — POST /api/agents/diplomat/refine-copy
# ---------------------------------------------------------------------------


@router.post("/diplomat/refine-copy", response_model=AgentResponse[CommunityGuidance])
async def diplomat_refine_copy(
    body: DiplomatRefineCopyRequest,
    db: AsyncSession = Depends(get_db),
    player_id: str | None = Depends(get_current_player_id),
):
    """Refine campaign copy using the Diplomat agent's voice/tone expertise."""
    pid = body.player_id or player_id
    ic_dict = _iching_to_dict(body.iching_context)
    deps = AgentDeps(db=db, player_id=pid, instance_id=body.instance_id, iching_context=ic_dict)

    if not settings.openai_api_key:
        return AgentResponse[CommunityGuidance](
            agent="diplomat",
            output=deterministic_diplomat_guidance(),
            deterministic=True,
            legibility_note="Deterministic fallback — no AI model configured.",
        )

    prompt = (
        f"Refine this {body.target_type} copy:\n\n{body.current_copy}\n"
    )
    if body.context:
        prompt += f"\nContext: {body.context}"

    try:
        result = await diplomat_agent.run(prompt, deps=deps)

        if ic_dict:
            await log_hexagram_encounter(
                db=db, agent_name="diplomat", iching_context=ic_dict, player_id=pid,
            )

        return AgentResponse[CommunityGuidance](
            agent="diplomat",
            output=result.output,
            legibility_note=f"Copy refinement for {body.target_type}.",
            usage_tokens=result.usage().total_tokens if result.usage() else None,
        )
    except Exception:
        logger.warning("Diplomat refine-copy failed, falling back", exc_info=True)
        return AgentResponse[CommunityGuidance](
            agent="diplomat",
            output=deterministic_diplomat_guidance(),
            deterministic=True,
            legibility_note="AI path failed — deterministic fallback used.",
        )


# ---------------------------------------------------------------------------
# Shaman Identify — POST /api/agents/shaman/identify
# ---------------------------------------------------------------------------


@router.post("/shaman/identify", response_model=AgentResponse[EmotionalAlchemyReading])
async def shaman_identify(
    body: ShamanIdentifyRequest,
    db: AsyncSession = Depends(get_db),
    player_id: str | None = Depends(get_current_player_id),
):
    """Extract nation/archetype from free text using the Shaman's identity reading."""
    pid = body.player_id or player_id
    ic_dict = _iching_to_dict(body.iching_context)
    deps = AgentDeps(db=db, player_id=pid, instance_id=body.instance_id, iching_context=ic_dict)

    if not settings.openai_api_key:
        return AgentResponse[EmotionalAlchemyReading](
            agent="shaman",
            output=deterministic_shaman_reading(body.free_text),
            deterministic=True,
            legibility_note="Deterministic fallback — no AI model configured.",
        )

    prompt = f"Read this text and identify the nation/archetype identity:\n\n{body.free_text}"

    try:
        result = await shaman_agent.run(prompt, deps=deps)

        if ic_dict:
            await log_hexagram_encounter(
                db=db, agent_name="shaman", iching_context=ic_dict, player_id=pid,
            )

        return AgentResponse[EmotionalAlchemyReading](
            agent="shaman",
            output=result.output,
            legibility_note="Identity reading from free text.",
            usage_tokens=result.usage().total_tokens if result.usage() else None,
        )
    except Exception:
        logger.warning("Shaman identify failed, falling back", exc_info=True)
        return AgentResponse[EmotionalAlchemyReading](
            agent="shaman",
            output=deterministic_shaman_reading(body.free_text),
            deterministic=True,
            legibility_note="AI path failed — deterministic fallback used.",
        )


# ---------------------------------------------------------------------------
# Architect Analyze Chunk — POST /api/agents/architect/analyze-chunk
# ---------------------------------------------------------------------------


@router.post("/architect/analyze-chunk", response_model=AgentResponse[QuestDraft])
async def architect_analyze_chunk(
    body: ArchitectAnalyzeChunkRequest,
    db: AsyncSession = Depends(get_db),
    player_id: str | None = Depends(get_current_player_id),
):
    """Analyze a book chunk for quest extraction using the Architect."""
    pid = body.player_id or player_id
    ic_dict = _iching_to_dict(body.iching_context)
    deps = AgentDeps(db=db, player_id=pid, instance_id=body.instance_id, iching_context=ic_dict)

    if not settings.openai_api_key:
        draft = deterministic_architect_draft(body.chunk_text[:100])
        return AgentResponse[QuestDraft](
            agent="architect",
            output=draft,
            deterministic=True,
            legibility_note="Deterministic fallback — no AI model configured.",
        )

    prompt = f"Analyze this book chunk and extract quest opportunities:\n\n{body.chunk_text}\n"
    if body.domain_hint:
        prompt += f"\nDomain hint: {body.domain_hint}"

    try:
        result = await architect_agent.run(prompt, deps=deps)

        if ic_dict:
            await log_hexagram_encounter(
                db=db, agent_name="architect", iching_context=ic_dict, player_id=pid,
            )

        return AgentResponse[QuestDraft](
            agent="architect",
            output=result.output,
            legibility_note="Quest extraction from book chunk.",
            usage_tokens=result.usage().total_tokens if result.usage() else None,
        )
    except Exception:
        logger.warning("Architect analyze-chunk failed, falling back", exc_info=True)
        return AgentResponse[QuestDraft](
            agent="architect",
            output=deterministic_architect_draft(body.chunk_text[:100]),
            deterministic=True,
            legibility_note="AI path failed — deterministic fallback used.",
        )


# ---------------------------------------------------------------------------
# Agent Mind Model — CRUD + decision loop
# ---------------------------------------------------------------------------


@router.post("/mind/create")
async def mind_create(body: AgentMindCreateRequest):
    """Create a new agent mind state."""
    mind = create_mind(
        nation=body.nation,
        archetype=body.archetype,
        goal=body.goal,
        narrative_lock=body.narrative_lock,
        emotional_state=body.emotional_state,
        energy=body.energy,
    )
    return {**mind.model_dump(), "_warning": "Data is ephemeral and will be lost on server restart"}


@router.post("/mind/{agent_id}/step")
async def mind_step(agent_id: str):
    """Execute one decision loop step for an agent mind."""
    mind = step_mind(agent_id)
    if not mind:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail=f"Agent mind {agent_id} not found")
    return {**mind.model_dump(), "_warning": "Data is ephemeral and will be lost on server restart"}


@router.get("/mind/{agent_id}")
async def mind_get(agent_id: str):
    """Retrieve an agent mind state."""
    mind = get_mind(agent_id)
    if not mind:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail=f"Agent mind {agent_id} not found")
    return {**mind.model_dump(), "_warning": "Data is ephemeral and will be lost on server restart"}


# ---------------------------------------------------------------------------
# Report Issue — POST /api/agents/report-issue
# ---------------------------------------------------------------------------


class _IssueDraft(BaseModel):
    title: str
    body: str       # markdown with Context, Error, URL sections
    labels: list[str]


async def _create_github_issue(draft: _IssueDraft) -> GitHubIssueResult:
    """Create a GitHub issue or return a pre-filled new-issue URL."""
    token = settings.github_token.get_secret_value()
    repo = settings.github_repo

    if not token or not repo:
        # Fallback: pre-filled new-issue URL
        params = urllib.parse.urlencode({"title": draft.title, "body": draft.body})
        url = f"https://github.com/{repo}/issues/new?{params}" if repo else f"https://github.com/issues/new?{params}"
        return GitHubIssueResult(url=url, number=0, title=draft.title)

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://api.github.com/repos/{repo}/issues",
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            json={"title": draft.title, "body": draft.body, "labels": draft.labels},
            timeout=15.0,
        )
        resp.raise_for_status()
        data = resp.json()
        return GitHubIssueResult(url=data["html_url"], number=data["number"], title=data["title"])


@router.post("/report-issue", response_model=AgentResponse[GitHubIssueResult])
async def report_issue(body: ReportIssueRequest):
    """Submit a UI error report as a GitHub issue. No auth required."""
    from pydantic_ai import Agent

    def _deterministic_draft() -> _IssueDraft:
        return _IssueDraft(
            title=f"[Bug] {body.component}: {body.error_message[:80]}",
            body=(
                f"## Context\nComponent: `{body.component}`\n\n"
                f"## Error\n```\n{body.error_message}\n```\n\n"
                f"## URL\n{body.page_url or '(not provided)'}"
            ),
            labels=["bug", "user-report"],
        )

    if settings.openai_api_key.get_secret_value():
        try:
            reporter = Agent(
                settings.agent_model,
                output_type=_IssueDraft,
                system_prompt=(
                    "You format UI error reports as GitHub issues. "
                    "Write a clear title, a markdown body with ## Context, ## Error, and ## URL sections, "
                    "and choose appropriate labels from: bug, user-report, ux, backend."
                ),
            )
            prompt = (
                f"Component: {body.component}\n"
                f"Error: {body.error_message}\n"
                f"Page URL: {body.page_url or 'unknown'}"
            )
            result = await reporter.run(prompt)
            draft = result.output
            issue = await _create_github_issue(draft)
            return AgentResponse[GitHubIssueResult](
                agent="reporter",
                output=issue,
                deterministic=False,
                legibility_note="Issue formatted by AI and submitted to GitHub.",
                usage_tokens=result.usage().total_tokens if result.usage() else None,
            )
        except Exception:
            logger.warning("Report-issue AI path failed, falling back to deterministic", exc_info=True)

    # Deterministic path
    draft = _deterministic_draft()
    issue = await _create_github_issue(draft)
    return AgentResponse[GitHubIssueResult](
        agent="reporter",
        output=issue,
        deterministic=True,
        legibility_note="Deterministic fallback — no AI model configured or AI path failed.",
    )


# ---------------------------------------------------------------------------
# Mapping Proposer — POST /api/agents/mapping-proposer/propose
# ---------------------------------------------------------------------------


@router.post("/mapping-proposer/propose", response_model=AgentResponse[MappingProposal])
async def mapping_proposer_propose(
    body: MappingProposerRequest,
    db: AsyncSession = Depends(get_db),
    player_id: str | None = Depends(get_current_player_id),
):
    """Generate and rank principled field-to-face assignments for a TransformationMove.

    Ingests face description context and TransformationMove field semantics,
    then produces a ranked MappingProposal used by the orientation quest packet
    compiler to determine which GM-face sub-packet authors which fields.

    Deterministic path: uses the static FACE_FIELD_AFFINITY compile-time lookup.
    AI path: generates confidence-annotated justifications and alternative rankings.
    """
    pid = body.player_id or player_id
    ic_dict = _iching_to_dict(body.iching_context)
    deps = AgentDeps(db=db, player_id=pid, instance_id=body.instance_id, iching_context=ic_dict)

    # Deterministic path — no AI key required
    if not settings.openai_api_key:
        proposal = deterministic_mapping_proposal(
            move_id=body.move_id,
            move_name=body.move_name,
            fields=body.fields,
        )
        return AgentResponse[MappingProposal](
            agent="mapping_proposer",
            output=proposal,
            deterministic=True,
            legibility_note=(
                "Deterministic fallback — FACE_FIELD_AFFINITY static lookup used. "
                "Configure an AI model for ranked justifications."
            ),
        )

    # Build AI prompt from request context
    prompt_parts = [
        "Generate a principled field-to-face assignment mapping for a TransformationMove.",
    ]
    if body.move_id:
        prompt_parts.append(f"Move ID: {body.move_id}")
    if body.move_name:
        prompt_parts.append(f"Move Name: {body.move_name}")
    if body.face_context:
        prompt_parts.append(
            f"\nAdmin face sub-packet context (natural language constraints):\n{body.face_context}"
        )
    if body.fields:
        prompt_parts.append(f"\nScope to these fields only: {', '.join(body.fields)}")
    else:
        prompt_parts.append(
            "\nProduce assignments for all 16 canonical TransformationMove fields."
        )
    prompt_parts.append(
        "\nFor each field: identify the primary face, primary confidence (0.0–1.0), "
        "a principled justification, and ranked_candidates for all faces with confidence ≥ 0.3. "
        "Then produce overall_coherence and a 2–4 sentence mapping_narrative."
    )
    prompt = "\n".join(prompt_parts)

    try:
        result = await mapping_proposer_agent.run(prompt, deps=deps)
        proposal = result.output

        if ic_dict:
            await log_hexagram_encounter(
                db=db,
                agent_name="mapping_proposer",
                iching_context=ic_dict,
                player_id=pid,
            )

        return AgentResponse[MappingProposal](
            agent="mapping_proposer",
            output=proposal,
            deterministic=False,
            legibility_note=(
                f"Field-to-face mapping for move '{body.move_id or 'schema-level'}' "
                f"with {len(proposal.assignments)} assignments "
                f"(coherence: {proposal.overall_coherence:.2f})."
            ),
            usage_tokens=result.usage().total_tokens if result.usage() else None,
        )
    except Exception:
        logger.warning("Mapping Proposer AI path failed, falling back to deterministic", exc_info=True)
        proposal = deterministic_mapping_proposal(
            move_id=body.move_id,
            move_name=body.move_name,
            fields=body.fields,
        )
        return AgentResponse[MappingProposal](
            agent="mapping_proposer",
            output=proposal,
            deterministic=True,
            legibility_note="AI path failed — deterministic FACE_FIELD_AFFINITY fallback used.",
        )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _safe_composting_check(deps: AgentDeps, title: str) -> list[str]:
    """Run composting check, returning empty list on DB errors."""
    try:
        items = await check_for_compostable(deps, "quest", title)
        return [c.item_id for c in items]
    except Exception:
        logger.debug("Composting check skipped (no DB connection)", exc_info=True)
        return []


async def _safe_discern_move(deps: AgentDeps):
    """Discern WAVE move, returning None on DB errors."""
    try:
        return await discern_wave_move(deps)
    except Exception:
        logger.debug("WAVE move discernment skipped (no DB connection)", exc_info=True)
        return None
