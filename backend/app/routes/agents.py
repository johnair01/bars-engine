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
from app.shadow_name_grammar import derive_shadow_name
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
    ShamanSuggestShadowNameRequest,
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


@router.post("/shaman/suggest-shadow-name")
async def shaman_suggest_shadow_name(body: ShamanSuggestShadowNameRequest):
    """Suggest an evocative name using deterministic 6-face grammar. No AI; instant response."""
    name = derive_shadow_name(body.charge_description, body.mask_shape)
    return {"suggested_name": name, "deterministic": True}


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
# Generate Campaign from Kernel — POST /api/agents/generate-campaign
# ---------------------------------------------------------------------------


class GenerateCampaignRequest(BaseModel):
    kernel: str  # Narrative premise — e.g. "A community facing housing crisis..."
    domains: list[str]  # e.g. ["GATHERING_RESOURCES", "DIRECT_ACTION", ...]
    kotter_stage: int = 1
    campaign_ref: str | None = None


# Slot → face mapping (mirrors template-library FACE_PLACEHOLDER)
_SLOT_FACES: dict[str, str] = {
    "context_1": "shaman", "context_2": "shaman", "context_3": "shaman",
    "anomaly_1": "challenger", "anomaly_2": "challenger", "anomaly_3": "challenger",
    "choice": "diplomat",
    "response": "regent",
    "artifact": "architect",
}

_ENCOUNTER_SLOTS = [
    "context_1", "context_2", "context_3",
    "anomaly_1", "anomaly_2", "anomaly_3",
    "choice", "response", "artifact",
]

_SLOT_GUIDANCE: dict[str, str] = {
    "context_1": "Open the scene. Set the world this player walks into.",
    "context_2": "Deepen the context. What history or texture makes this real?",
    "context_3": "Ground the stakes. What does the community stand to gain or lose?",
    "anomaly_1": "Introduce the first disruption. What cracks the surface?",
    "anomaly_2": "Escalate. A second layer of tension or contradiction.",
    "anomaly_3": "Name the impasse. What must be faced before moving forward?",
    "choice": "Present three meaningful paths the player can take. Frame each with its emotional stakes.",
    "response": "Resolve the moment after a choice is made. What outcome emerges?",
    "artifact": "Deliver the takeaway. What concrete action, resource, or insight does the player carry forward?",
}


async def _generate_slot(
    face: str,
    slot: str,
    domain: str,
    kernel: str,
    kotter_stage: int,
    campaign_ref: str | None,
) -> str:
    from pydantic_ai import Agent as PydanticAgent

    system_prompt = _FACE_SYSTEM_PROMPTS.get(face, _FACE_SYSTEM_PROMPTS["architect"])
    guidance = _SLOT_GUIDANCE.get(slot, "Write passage content for this slot.")

    prompt = (
        f"Campaign kernel: {kernel}\n"
        f"Domain: {domain.replace('_', ' ').title()}\n"
        f"Kotter stage: {kotter_stage}\n"
        f"Slot: {slot} ({guidance})\n"
        + (f"Campaign: {campaign_ref}\n" if campaign_ref else "")
        + "\nWrite this passage. Return only the passage text."
    )

    try:
        agent = PydanticAgent(
            settings.agent_model,
            output_type=PassageText,
            system_prompt=system_prompt,
        )
        result = await agent.run(prompt)
        return result.output.text
    except Exception:
        logger.warning("generate-campaign slot %s/%s failed, using stub", domain, slot, exc_info=True)
        return f"[{face.title()}] {guidance}\n\nCampaign: {campaign_ref or 'general'} | Domain: {domain} | Stage {kotter_stage}"


async def _generate_domain(
    domain: str,
    kernel: str,
    kotter_stage: int,
    campaign_ref: str | None,
) -> dict[str, str]:
    import asyncio

    tasks = {
        slot: _generate_slot(
            face=_SLOT_FACES[slot],
            slot=slot,
            domain=domain,
            kernel=kernel,
            kotter_stage=kotter_stage,
            campaign_ref=campaign_ref,
        )
        for slot in _ENCOUNTER_SLOTS
    }
    results = await asyncio.gather(*tasks.values(), return_exceptions=True)
    output: dict[str, str] = {}
    for slot, result in zip(tasks.keys(), results):
        if isinstance(result, Exception):
            guidance = _SLOT_GUIDANCE.get(slot, "")
            output[slot] = f"[Generation failed] {guidance}"
        else:
            output[slot] = result  # type: ignore[assignment]
    return output


class CampaignPassages(BaseModel):
    passages: dict[str, dict[str, str]]  # { domain: { nodeId: text } }


@router.post("/generate-campaign", response_model=AgentResponse[CampaignPassages])
async def generate_campaign(body: GenerateCampaignRequest):
    """Generate all passages for a multi-domain campaign from a narrative kernel."""
    import asyncio

    if not body.kernel.strip():
        from fastapi import HTTPException
        raise HTTPException(400, "kernel must not be empty")

    domains = body.domains or ["GATHERING_RESOURCES", "DIRECT_ACTION", "RAISE_AWARENESS", "SKILLFUL_ORGANIZING"]

    if not settings.openai_api_key:
        # Deterministic stubs
        stub: dict[str, dict[str, str]] = {}
        for domain in domains:
            stub[domain] = {
                slot: f"[{_SLOT_FACES[slot].title()}] {_SLOT_GUIDANCE[slot]}\n\nKernel: {body.kernel[:100]}…"
                for slot in _ENCOUNTER_SLOTS
            }
        return AgentResponse[CampaignPassages](
            agent="campaign_generator",
            output=CampaignPassages(passages=stub),
            deterministic=True,
            legibility_note="Deterministic fallback — no AI model configured.",
        )

    domain_tasks = [
        _generate_domain(domain, body.kernel, body.kotter_stage, body.campaign_ref)
        for domain in domains
    ]
    results = await asyncio.gather(*domain_tasks, return_exceptions=True)

    passages: dict[str, dict[str, str]] = {}
    for domain, result in zip(domains, results):
        if isinstance(result, Exception):
            logger.warning("generate-campaign domain %s failed", domain, exc_info=result)
            passages[domain] = {
                slot: f"[Generation failed] {_SLOT_GUIDANCE[slot]}"
                for slot in _ENCOUNTER_SLOTS
            }
        else:
            passages[domain] = result  # type: ignore[assignment]

    return AgentResponse[CampaignPassages](
        agent="campaign_generator",
        output=CampaignPassages(passages=passages),
        legibility_note=f"Campaign generated for {len(domains)} domains × {len(_ENCOUNTER_SLOTS)} passages.",
    )


# ---------------------------------------------------------------------------
# Generate Passage — POST /api/agents/generate-passage
# ---------------------------------------------------------------------------


class PassageText(BaseModel):
    text: str


class GeneratePassageRequest(BaseModel):
    node_id: str
    face: str  # shaman | challenger | diplomat | regent | architect
    campaign_function: str  # guidance string for this slot
    campaign_ref: str | None = None
    subcampaign_domain: str | None = None
    campaign_goal: str | None = None
    kotter_stage: str | None = None
    preceding_texts: list[str] = []


_FACE_SYSTEM_PROMPTS: dict[str, str] = {
    "shaman": (
        "You are the Shaman — the grounding voice of the Game Master. "
        "You write scene-setting passages that orient the player in time, place, and emotional terrain. "
        "Be evocative and present-tense. 2–4 short paragraphs. No choices. No direct address."
    ),
    "challenger": (
        "You are the Challenger — the disruptive voice of the Game Master. "
        "You write passages that surface tension, contradiction, or an unexpected obstacle. "
        "Be direct and visceral. 2–3 short paragraphs."
    ),
    "diplomat": (
        "You are the Diplomat — the bridging voice of the Game Master. "
        "You write choice-point passages that present 2–3 meaningful paths the player can take. "
        "Frame each path with its emotional stakes. 1 framing paragraph, then list the paths."
    ),
    "regent": (
        "You are the Regent — the resolving voice of the Game Master. "
        "You write outcome passages that name what emerged from the player's choice. "
        "Be decisive and clear. 2 paragraphs: outcome + implication."
    ),
    "architect": (
        "You are the Architect — the consolidating voice of the Game Master. "
        "You write artifact passages: a concrete takeaway, lesson, or resource the player carries forward. "
        "Be specific and actionable. 1–2 short paragraphs."
    ),
}


@router.post("/generate-passage", response_model=AgentResponse[PassageText])
async def generate_passage(body: GeneratePassageRequest):
    """Generate passage text for a single template slot using the appropriate GM face."""
    from pydantic_ai import Agent as PydanticAgent

    face = body.face if body.face in _FACE_SYSTEM_PROMPTS else "architect"
    system_prompt = _FACE_SYSTEM_PROMPTS[face]

    # Build context paragraph
    context_parts: list[str] = [f"Slot function: {body.campaign_function}"]
    if body.campaign_ref:
        context_parts.append(f"Campaign: {body.campaign_ref}")
    if body.subcampaign_domain:
        context_parts.append(f"Domain: {body.subcampaign_domain.replace('_', ' ').title()}")
    if body.campaign_goal:
        context_parts.append(f"Campaign goal: {body.campaign_goal}")
    if body.kotter_stage:
        context_parts.append(f"Kotter stage: {body.kotter_stage}")
    if body.preceding_texts:
        context_parts.append("Preceding passages:\n" + "\n---\n".join(body.preceding_texts[-2:]))

    prompt = (
        f"Write a passage for node `{body.node_id}`.\n\n"
        + "\n".join(context_parts)
        + "\n\nReturn only the passage text — no metadata, no JSON, no labels."
    )

    def _deterministic_text() -> str:
        return (
            f"[{face.title()}] {body.campaign_function}\n\n"
            + (f"Campaign: {body.campaign_ref or 'general'}" if body.campaign_ref else "")
        ).strip()

    if not settings.openai_api_key:
        return AgentResponse[PassageText](
            agent=face,
            output=PassageText(text=_deterministic_text()),
            deterministic=True,
            legibility_note="Deterministic fallback — no AI model configured.",
        )

    try:
        passage_agent = PydanticAgent(
            settings.agent_model,
            output_type=PassageText,
            system_prompt=system_prompt,
        )
        result = await passage_agent.run(prompt)
        return AgentResponse[PassageText](
            agent=face,
            output=result.output,
            legibility_note=f"{face.title()} passage generated for {body.node_id}.",
            usage_tokens=result.usage().total_tokens if result.usage() else None,
        )
    except Exception:
        logger.warning("generate-passage AI path failed, falling back", exc_info=True)
        return AgentResponse[PassageText](
            agent=face,
            output=PassageText(text=_deterministic_text()),
            deterministic=True,
            legibility_note="AI path failed — deterministic fallback used.",
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
