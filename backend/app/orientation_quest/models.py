"""Orientation Quest System — Pydantic data models.

Mirrors the TypeScript OrientationMetaPacket / FaceSubPacket types defined in
src/lib/orientation-quest/types.ts.  Used by the backend pipeline for:

  - Deserialising orientation session state stored as JSON in the DB.
  - Structuring challenger.py backfill/review inputs and outputs.
  - Validating proposal payloads before insertion into quest_proposals.
  - Feeding the composite quality scorer.
  - Logging training signals to .feedback/*.jsonl.

Design rules (from constraints):
  - All four submission paths produce identical proposal records; no shortcuts.
  - Composite quality score = adminScore + structuralAgentScore + livePerformanceSignal.
  - Branch-to-field mapping is a static lookup (no runtime DB resolution).
  - Dynamic DB query at prompt-construction time for few-shot pool — no caching.
"""

from __future__ import annotations

from datetime import UTC, datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field, model_validator

# ---------------------------------------------------------------------------
# Enumerations (string-valued for JSON round-trip)
# ---------------------------------------------------------------------------


class SubmissionPath(StrEnum):
    """Four co-creation submission paths — all enter identical review lifecycle."""

    PLAYER_DIRECT = "player_direct"
    """Player authors the move proposal unaided via the quest UI."""

    PLAYER_ASSISTED = "player_assisted"
    """Player completes a challenger.py-backfilled partial draft."""

    ADMIN_AUTHORED = "admin_authored"
    """Admin authors the face sub-packet constraints; player assembles the proposal."""

    AI_AUTONOMOUS = "ai_autonomous"
    """challenger.py autonomous proposal generation — SLA fallback path."""


class FaceSubPacketState(StrEnum):
    """Lifecycle state for a single face sub-packet."""

    PENDING = "pending"
    """Sub-packet created but player has not yet entered this face path."""

    IN_PROGRESS = "in_progress"
    """Player has entered this path; draft payload is partially populated."""

    COMPLETE = "complete"
    """Player has submitted a proposal from this face path."""

    SKIPPED = "skipped"
    """Player explicitly bypassed this face during the orientation session."""


class GameMasterFace(StrEnum):
    """The six Game Master faces that guide depth branches."""

    SHAMAN = "shaman"
    CHALLENGER = "challenger"
    REGENT = "regent"
    ARCHITECT = "architect"
    DIPLOMAT = "diplomat"
    SAGE = "sage"


class SessionState(StrEnum):
    """Overall orientation session state."""

    ACTIVE = "active"
    SUBMITTED = "submitted"
    CLOSED = "closed"


# ---------------------------------------------------------------------------
# TransformationMove field types (mirrors TypeScript registry types)
# ---------------------------------------------------------------------------


class MoveCategory(StrEnum):
    AWARENESS = "awareness"
    REFRAMING = "reframing"
    EMOTIONAL_PROCESSING = "emotional_processing"
    BEHAVIORAL_EXPERIMENT = "behavioral_experiment"
    INTEGRATION = "integration"


class WcgsStage(StrEnum):
    WAKE_UP = "wake_up"
    CLEAN_UP = "clean_up"
    GROW_UP = "grow_up"
    SHOW_UP = "show_up"


class TypicalOutputType(StrEnum):
    REFLECTION = "reflection"
    DIALOGUE = "dialogue"
    SOMATIC = "somatic"
    ACTION = "action"
    INTEGRATION = "integration"


class LockType(StrEnum):
    IDENTITY_LOCK = "identity_lock"
    EMOTIONAL_LOCK = "emotional_lock"
    ACTION_LOCK = "action_lock"
    POSSIBILITY_LOCK = "possibility_lock"


class EmotionChannel(StrEnum):
    FEAR = "fear"
    ANGER = "anger"
    SADNESS = "sadness"
    NEUTRALITY = "neutrality"
    JOY = "joy"


# ---------------------------------------------------------------------------
# Sub-models for TransformationMove fields
# ---------------------------------------------------------------------------


class PromptTemplate(BaseModel):
    """Single prompt template entry within a TransformationMove."""

    template_id: str
    template_text: str
    template_type: TypicalOutputType


class BarIntegrationPartial(BaseModel):
    """Partial BarIntegration — all fields optional during authoring."""

    creates_bar: bool | None = None
    bar_timing: Literal["pre_action", "post_action", "completion"] | None = None
    bar_type: Literal["insight", "vibe"] | None = None
    bar_prompt_template: str | None = None
    optional_tracking_bar: bool | None = None


class QuestUsagePartial(BaseModel):
    """Partial QuestUsage — all fields optional during authoring."""

    quest_stage: Literal["reflection", "cleanup", "growth", "action", "completion"] | None = None
    is_required_for_full_arc: bool | None = None
    can_stand_alone: bool | None = None
    suggested_follow_up_moves: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# FaceSubPacketPayload — partial TransformationMove proposal draft
# ---------------------------------------------------------------------------


class FaceSubPacketPayload(BaseModel):
    """Partial draft of a TransformationMove proposal assembled within a face sub-packet.

    All fields are optional during authoring.  Structural completeness is validated
    at submission time by the challenger.py structural agent scorer.

    move_id is NOT present here — it is assigned by the submission pipeline after
    approval.  parent_move_id is non-null for remix proposals (lineage traceability).
    """

    # Core identity — populated early in the face path
    move_name: str | None = None
    move_category: MoveCategory | None = None
    wcgs_stage: WcgsStage | None = None
    description: str | None = None
    purpose: str | None = None

    # Output and effect — populated mid-path
    target_effect: str | None = None
    typical_output_type: TypicalOutputType | None = None
    prompt_templates: list[PromptTemplate] = Field(default_factory=list)

    # Compatibility — populated late or by admin constraints
    compatible_lock_types: list[LockType] = Field(default_factory=list)
    compatible_emotion_channels: list[EmotionChannel] = Field(default_factory=list)
    compatible_nations: list[str] = Field(default_factory=list)
    compatible_archetypes: list[str] = Field(default_factory=list)

    # Integration and usage — may be backfilled by challenger.py
    bar_integration: BarIntegrationPartial | None = None
    quest_usage: QuestUsagePartial | None = None
    safety_notes: list[str] = Field(default_factory=list)

    # Remix lineage — present when player extends an existing canonical move
    parent_move_id: str | None = Field(
        default=None,
        description="Canonical move_id of the parent move when this is a remix proposal.",
    )

    def structural_completeness_score(self) -> float:
        """Return a 0.0–1.0 structural completeness fraction.

        Counts how many of the *required* TransformationMove fields are non-empty.
        Required fields (10 total):
            move_name, move_category, wcgs_stage, description, purpose,
            target_effect, typical_output_type, prompt_templates (≥1),
            compatible_lock_types (≥1), compatible_emotion_channels (≥1).
        """
        checks = [
            bool(self.move_name),
            self.move_category is not None,
            self.wcgs_stage is not None,
            bool(self.description),
            bool(self.purpose),
            bool(self.target_effect),
            self.typical_output_type is not None,
            len(self.prompt_templates) > 0,
            len(self.compatible_lock_types) > 0,
            len(self.compatible_emotion_channels) > 0,
        ]
        return sum(checks) / len(checks)


# ---------------------------------------------------------------------------
# Admin-authored face sub-packet constraints
# ---------------------------------------------------------------------------


class FaceSubPacketConstraints(BaseModel):
    """Natural-language constraints authored by an admin in the admin UI.

    Saved verbatim to the DB; injected into agent prompt context at
    prompt-construction time for the relevant face path.  No structured
    schema enforcement — the admin writes free text, the agent interprets it.
    """

    constraint_text: str = Field(
        description="Free-text narrative constraint authored by the admin."
    )
    authored_at: datetime = Field(
        description="Timestamp when the constraint was authored.",
    )
    authored_by_admin_id: str = Field(
        description="DB user ID of the admin who authored this constraint.",
    )


# ---------------------------------------------------------------------------
# FaceSubPacket — one per GameMasterFace per orientation session
# ---------------------------------------------------------------------------


class FaceSubPacket(BaseModel):
    """A single Game Master face's contribution path within the orientation quest.

    Tracks its own completion state, quest node IDs, admin constraints, and the
    evolving TransformationMove proposal payload.
    """

    face: GameMasterFace = Field(
        description="Which of the 6 Game Master faces guides this sub-packet.",
    )
    state: FaceSubPacketState = Field(
        default=FaceSubPacketState.PENDING,
        description="Lifecycle state for this face path.",
    )
    quest_node_ids: list[str] = Field(
        default_factory=list,
        description="Ordered IDs of QuestNodes compiled for this face path.",
    )
    admin_constraints: FaceSubPacketConstraints | None = Field(
        default=None,
        description="Admin-authored natural-language constraints for this face path.",
    )
    payload: FaceSubPacketPayload = Field(
        default_factory=FaceSubPacketPayload,
        description="The evolving TransformationMove proposal content.",
    )
    quest_proposal_id: str | None = Field(
        default=None,
        description="Set when the player submits; references quest_proposals.id.",
    )
    submitted_at: datetime | None = Field(
        default=None,
        description="Timestamp when the proposal was submitted.",
    )


# ---------------------------------------------------------------------------
# Composite quality score — three-signal scoring
# ---------------------------------------------------------------------------


class CompositeQualityScore(BaseModel):
    """Three-signal composite quality score.

    Written to quest_proposals.confidenceScore as the normalised mean of the
    three input signals.

    Sources:
      - admin_score:              Admin UI review score (0.0–1.0).
      - structural_agent_score:   challenger.py structural completeness check (0.0–1.0).
      - live_performance_signal:  Player interaction telemetry signal (0.0–1.0).
    """

    admin_score: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Admin UI review score (0.0–1.0).",
    )
    structural_agent_score: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="challenger.py structural completeness score (0.0–1.0).",
    )
    live_performance_signal: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Player interaction telemetry signal (0.0–1.0).",
    )
    composite_score: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Normalised mean: (admin + structural + live) / 3.",
    )
    computed_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Timestamp when the composite was last computed.",
    )

    @model_validator(mode="after")
    def _sync_composite(self) -> CompositeQualityScore:
        """Keep composite_score consistent with the three input signals."""
        self.composite_score = round(
            (self.admin_score + self.structural_agent_score + self.live_performance_signal) / 3.0,
            4,
        )
        return self


# ---------------------------------------------------------------------------
# OrientationMetaPacket — top-level session container
# ---------------------------------------------------------------------------


class OrientationMetaPacket(BaseModel):
    """Top-level container for a player's orientation quest session.

    Aggregates all six FaceSubPackets, tracks the active face, records the
    submission path, and holds the composite quality score once available.

    One OrientationMetaPacket exists per player orientation quest instance.
    Serializable to JSON; safe to store in the DB.
    """

    packet_id: str = Field(description="Unique cuid for this orientation session.")
    player_id: str = Field(description="Player who owns this orientation session.")
    version: Literal[1] = Field(
        default=1,
        description="Schema version for forward-compatibility.",
    )

    face_sub_packets: dict[GameMasterFace, FaceSubPacket] = Field(
        default_factory=dict,
        description="Six face sub-packets keyed by GameMasterFace.",
    )

    active_face: GameMasterFace | None = Field(
        default=None,
        description="Currently active face path, or None at meta level.",
    )

    submission_path: SubmissionPath = Field(
        description="Which of the four submission paths is operative for this session.",
    )

    session_state: SessionState = Field(
        default=SessionState.ACTIVE,
        description="Overall session lifecycle state.",
    )

    quality_score: CompositeQualityScore | None = Field(
        default=None,
        description="Composite quality score; populated after first sub-packet submission.",
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Timestamp when this meta-packet was created.",
    )

    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Timestamp of the most recent sub-packet update.",
    )

    @classmethod
    def create_new(
        cls,
        packet_id: str,
        player_id: str,
        submission_path: SubmissionPath,
        enabled_faces: list[GameMasterFace] | None = None,
    ) -> OrientationMetaPacket:
        """Construct a fresh OrientationMetaPacket with all face sub-packets initialised.

        Args:
            packet_id:       Caller-supplied cuid.
            player_id:       DB player ID.
            submission_path: Which co-creation path is operative.
            enabled_faces:   Subset of faces to include; defaults to all 6.
        """
        faces = enabled_faces or list(GameMasterFace)
        face_sub_packets = {face: FaceSubPacket(face=face) for face in faces}
        return cls(
            packet_id=packet_id,
            player_id=player_id,
            submission_path=submission_path,
            face_sub_packets=face_sub_packets,
        )

    def get_sub_packet(self, face: GameMasterFace) -> FaceSubPacket | None:
        """Return the sub-packet for the given face, or None if not present."""
        return self.face_sub_packets.get(face)

    def is_any_face_complete(self) -> bool:
        """Return True if at least one face sub-packet has been completed."""
        return any(
            sp.state == FaceSubPacketState.COMPLETE
            for sp in self.face_sub_packets.values()
        )

    def submitted_proposal_ids(self) -> list[str]:
        """Return all quest_proposal_ids from completed sub-packets."""
        return [
            sp.quest_proposal_id
            for sp in self.face_sub_packets.values()
            if sp.quest_proposal_id is not None
        ]
