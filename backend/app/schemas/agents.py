"""Request/response Pydantic models for all agent routes."""

from __future__ import annotations

from typing import Generic, Literal, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


# ---------------------------------------------------------------------------
# Generic response wrapper (reflects Integral Principles)
# ---------------------------------------------------------------------------


class AgentResponse(BaseModel, Generic[T]):
    """Wraps every agent output with Integral metadata."""

    agent: str  # Which sect responded
    output: T  # Typed domain output
    discerned_move: Literal["wake_up", "clean_up", "grow_up", "show_up"] | None = None
    legibility_note: str | None = None  # §2 Why this output was chosen
    generative_deps: list[str] = Field(default_factory=list)  # §4 IDs of items this obsoletes
    feedback_flag: str | None = None  # §5 Self-evolution: what instructions didn't cover
    usage_tokens: int | None = None
    deterministic: bool = False  # True if AI was bypassed


# ---------------------------------------------------------------------------
# Shared I Ching context payload
# ---------------------------------------------------------------------------


class IChingContextPayload(BaseModel):
    """I Ching context passed with agent requests for hexagram-aligned generation."""

    hexagramId: int
    hexagramName: str = ""
    hexagramTone: str = ""
    hexagramText: str = ""
    upperTrigram: str = ""
    lowerTrigram: str = ""
    kotterStage: int | None = None
    kotterStageName: str | None = None
    nationName: str | None = None
    activeFace: str | None = None
    playbookTrigram: str | None = None


# ---------------------------------------------------------------------------
# Architect
# ---------------------------------------------------------------------------


class ArchitectDraftRequest(BaseModel):
    """Request body for POST /api/agents/architect/draft."""

    narrative_lock: str = Field(description="The obstacle or stuck point to design a quest around")
    quest_grammar: Literal["epiphany_bridge", "kotter"] = Field(
        default="epiphany_bridge",
        description="Quest grammar to use",
    )
    player_id: str | None = Field(default=None, description="Override player context (optional)")
    instance_id: str | None = Field(default=None, description="Campaign instance scope (optional)")
    iching_context: IChingContextPayload | None = Field(default=None, description="I Ching context for hexagram-aligned generation")


# ---------------------------------------------------------------------------
# Challenger (Phase 2)
# ---------------------------------------------------------------------------


class ChallengerProposeRequest(BaseModel):
    """Request body for POST /api/agents/challenger/propose."""

    quest_id: str | None = Field(default=None, description="Quest context for move proposal")
    player_id: str | None = None
    instance_id: str | None = None
    iching_context: IChingContextPayload | None = None


# ---------------------------------------------------------------------------
# Shaman (Phase 2)
# ---------------------------------------------------------------------------


class ShamanReadRequest(BaseModel):
    """Request body for POST /api/agents/shaman/read."""

    context: str | None = Field(default=None, description="Optional context for the reading")
    player_id: str | None = None
    instance_id: str | None = None
    iching_context: IChingContextPayload | None = None


# ---------------------------------------------------------------------------
# Regent (Phase 3)
# ---------------------------------------------------------------------------


class RegentAssessRequest(BaseModel):
    """Request body for POST /api/agents/regent/assess."""

    instance_id: str = Field(description="Campaign instance to assess")
    player_id: str | None = None
    iching_context: IChingContextPayload | None = None


# ---------------------------------------------------------------------------
# Diplomat (Phase 3)
# ---------------------------------------------------------------------------


class DiplomatGuideRequest(BaseModel):
    """Request body for POST /api/agents/diplomat/guide."""

    player_id: str | None = None
    instance_id: str | None = None
    iching_context: IChingContextPayload | None = None


# ---------------------------------------------------------------------------
# Sage (Phase 4)
# ---------------------------------------------------------------------------


class SageConsultRequest(BaseModel):
    """Request body for POST /api/agents/sage/consult."""

    question: str = Field(description="The question or situation to consult the Sage about")
    player_id: str | None = None
    instance_id: str | None = None
    iching_context: IChingContextPayload | None = None


# ---------------------------------------------------------------------------
# Agent Mind Model (Phase 4)
# ---------------------------------------------------------------------------


class AgentMindCreateRequest(BaseModel):
    """Request body for POST /api/agents/mind/create."""

    nation: str
    archetype: str
    goal: str
    narrative_lock: str
    emotional_state: str = "neutrality"
    energy: float = 0.5


# ---------------------------------------------------------------------------
# Architect Compile (Phase 1)
# ---------------------------------------------------------------------------


class ArchitectCompileRequest(BaseModel):
    """Request body for POST /api/agents/architect/compile."""

    unpacking_answers: dict = Field(description="Q1-Q6 unpacking answers from the player")
    emotional_signature: dict | None = Field(default=None, description="Emotional alchemy signature")
    iching_context: IChingContextPayload | None = Field(default=None, description="I Ching context")
    quest_grammar: Literal["epiphany_bridge", "kotter"] = Field(default="epiphany_bridge")
    player_id: str | None = None
    instance_id: str | None = None


# ---------------------------------------------------------------------------
# Diplomat Bridge (Phase 3)
# ---------------------------------------------------------------------------


class DiplomatBridgeRequest(BaseModel):
    """Request body for POST /api/agents/diplomat/bridge."""

    narrative_text: str = Field(description="In-game narrative passage to bridge to real-world action")
    move_type: str | None = Field(default=None, description="WAVE move type for tone")
    iching_context: IChingContextPayload | None = None
    player_id: str | None = None
    instance_id: str | None = None


# ---------------------------------------------------------------------------
# Diplomat Refine Copy (Phase 3)
# ---------------------------------------------------------------------------


class DiplomatRefineCopyRequest(BaseModel):
    """Request body for POST /api/agents/diplomat/refine-copy."""

    target_type: str = Field(description="What kind of copy: instance_wakeUpContent, passage, etc.")
    current_copy: str = Field(description="The current copy text to improve")
    context: str | None = Field(default=None, description="Additional context for refinement")
    iching_context: IChingContextPayload | None = None
    player_id: str | None = None
    instance_id: str | None = None


# ---------------------------------------------------------------------------
# Shaman Identify (Phase 3)
# ---------------------------------------------------------------------------


class ShamanIdentifyRequest(BaseModel):
    """Request body for POST /api/agents/shaman/identify."""

    free_text: str = Field(description="Free-form text to extract nation/archetype from")
    iching_context: IChingContextPayload | None = None
    player_id: str | None = None
    instance_id: str | None = None


# ---------------------------------------------------------------------------
# Architect Analyze Chunk (Phase 3)
# ---------------------------------------------------------------------------


class ArchitectAnalyzeChunkRequest(BaseModel):
    """Request body for POST /api/agents/architect/analyze-chunk."""

    chunk_text: str = Field(description="Book chunk text to analyze for quest extraction")
    domain_hint: str | None = Field(default=None, description="Domain hint for extraction")
    iching_context: IChingContextPayload | None = None
    player_id: str | None = None
    instance_id: str | None = None


# ---------------------------------------------------------------------------
# Mapping Proposer (Orientation Quest — AC 23c)
# ---------------------------------------------------------------------------


class MappingProposerRequest(BaseModel):
    """Request body for POST /api/agents/mapping-proposer/propose.

    Asks the Mapping Proposer to generate and rank field-to-face assignments
    for a TransformationMove, used when building GM-face sub-packets for the
    orientation quest system.
    """

    move_id: str | None = Field(
        default=None,
        description=(
            "TransformationMove ID to scope the proposal "
            "(e.g. 'observe', 'feel'). None = schema-level generic proposal."
        ),
    )
    move_name: str | None = Field(
        default=None,
        description="Human-readable move name for context",
    )
    face_context: str | None = Field(
        default=None,
        description=(
            "Optional free-text description of the admin's current face sub-packet "
            "context (natural language constraints saved to DB by admin UI author)"
        ),
    )
    fields: list[str] | None = Field(
        default=None,
        description=(
            "Subset of TransformationMove field names to produce assignments for. "
            "Defaults to all 16 canonical fields."
        ),
    )
    player_id: str | None = None
    instance_id: str | None = None
    iching_context: IChingContextPayload | None = None
