"""Mapping Proposer agent — Field-to-face assignment for TransformationMove proposals.

Ingests Game Master face description context and TransformationMove field semantics
to generate and rank principled field-to-face assignments with justifications.

Used by the orientation quest system when building GM-face sub-packets that guide
players through co-creating TransformationMove proposals.

Constraint: FACE_FIELD_AFFINITY is the static compile-time lookup.
The AI proposer enriches it with ranked alternatives and justifications at runtime.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext

from app.agents._deps import AgentDeps
from app.agents._instructions import deftness_context
from app.config import settings


# ---------------------------------------------------------------------------
# Static compile-time lookup — FACE_FIELD_AFFINITY
#
# Maps each TransformationMove field to its primary face affinity.
# This is the authoritative compile-time assignment; the AI proposer
# generates ranked alternatives and confidence-annotated justifications
# for novel or ambiguous cases.
#
# Constraint: "Branch-to-field mapping is static lookup at compile time."
# ---------------------------------------------------------------------------

TRANSFORMATION_MOVE_FIELDS: dict[str, str] = {
    "move_id": "Unique identifier string for the move",
    "move_name": "Human-readable display name of the move",
    "move_category": "Categorical classification (awareness, reframing, emotional_processing, behavioral_experiment, integration)",
    "wcgs_stage": "WCGS developmental stage: wake_up, clean_up, grow_up, or show_up",
    "description": "One-sentence summary of what this move does",
    "purpose": "Why this move exists — the transformation it serves",
    "prompt_templates": "Array of prompt templates (reflection, dialogue, somatic, action, integration types)",
    "target_effect": "The psychological/behavioral outcome this move produces",
    "typical_output_type": "Expected response type from player (reflection, dialogue, somatic, action, integration)",
    "compatible_lock_types": "Which narrative locks this move unlocks (identity, emotional, action, possibility)",
    "compatible_emotion_channels": "Emotional channels where this move is effective (fear, anger, sadness, neutrality, joy)",
    "compatible_nations": "Nation identities with natural resonance to this move",
    "compatible_archetypes": "Archetype identities with natural resonance to this move",
    "bar_integration": "How this move integrates with BAR creation (creates_bar, timing, type, prompt)",
    "quest_usage": "How this move fits into quest structure (stage, arc requirement, standalone, follow-ups)",
    "safety_notes": "Practitioner safety notes — context limits and emotional intensity guidance",
}

FACE_FIELD_AFFINITY: dict[str, list[str]] = {
    "shaman": [
        "purpose",
        "compatible_emotion_channels",
        # Somatic and dialogue prompt templates are Shaman territory
        "prompt_templates",  # especially somatic/dialogue subtypes
        "target_effect",
    ],
    "challenger": [
        "wcgs_stage",
        # Action-type prompt templates and bar_integration timing
        "bar_integration",  # especially bar_timing, creates_bar
        "compatible_lock_types",  # action_lock is Challenger's domain
    ],
    "regent": [
        "move_id",
        "move_name",
        "compatible_nations",
        "compatible_archetypes",
        "quest_usage",  # is_required_for_full_arc, quest_stage
        "safety_notes",
    ],
    "architect": [
        "move_category",
        "description",
        "typical_output_type",
        "quest_usage",  # can_stand_alone, suggested_follow_up_moves
    ],
    "diplomat": [
        "safety_notes",
        "compatible_emotion_channels",  # relational/care angle
        # suggested_follow_up_moves — connection between moves
    ],
    "sage": [
        "wcgs_stage",
        "purpose",
        "target_effect",
        "quest_usage",  # suggested_follow_up_moves — integration of arc
    ],
}


# ---------------------------------------------------------------------------
# Output schema
# ---------------------------------------------------------------------------


class FaceCandidate(BaseModel):
    """A ranked candidate face for a given TransformationMove field."""

    face: Literal["shaman", "challenger", "regent", "architect", "diplomat", "sage"] = Field(
        description="Game Master face name"
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="0.0–1.0 confidence that this face is the right author for this field",
    )
    justification: str = Field(
        description="Principled reason why this face owns this field"
    )


class FieldAssignment(BaseModel):
    """Ranked face assignment for a single TransformationMove field."""

    field_name: str = Field(description="TransformationMove field key")
    field_semantics: str = Field(
        description="What this field represents in the move schema"
    )
    primary_face: Literal["shaman", "challenger", "regent", "architect", "diplomat", "sage"] = Field(
        description="Highest-confidence face for this field"
    )
    primary_confidence: float = Field(
        ge=0.0, le=1.0, description="Confidence in primary face assignment"
    )
    primary_justification: str = Field(
        description="Why the primary face owns this field"
    )
    ranked_candidates: list[FaceCandidate] = Field(
        default_factory=list,
        description="All candidate faces ranked by confidence (includes primary)",
    )


class MappingProposal(BaseModel):
    """Structured field-to-face mapping proposal for a TransformationMove.

    Produced by the MappingProposer agent. Consumed by orientation quest packet
    compilers to determine which GM-face sub-packet authors which fields.
    """

    move_id: str | None = Field(
        default=None,
        description="TransformationMove ID this proposal targets (None = schema-level generic proposal)",
    )
    move_name: str | None = Field(
        default=None,
        description="TransformationMove display name",
    )
    assignments: list[FieldAssignment] = Field(
        description="Ranked field-to-face assignments for each TransformationMove field"
    )
    overall_coherence: float = Field(
        ge=0.0,
        le=1.0,
        description="How internally coherent this mapping is across all fields",
    )
    mapping_narrative: str = Field(
        description=(
            "A concise narrative (2–4 sentences) explaining the overall mapping strategy "
            "— which faces dominate and why the distribution makes developmental sense"
        )
    )
    unassignable_fields: list[str] = Field(
        default_factory=list,
        description="Fields where no face had confidence ≥ 0.4 (require human review)",
    )


# ---------------------------------------------------------------------------
# Agent definition
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are the **Mapping Proposer** — a meta-agent for the BARs Engine orientation quest system.

Your task: given a TransformationMove's field semantics and the 6 Game Master faces,
assign each field to the face most qualified to "author" it when building a GM-face
sub-packet for the orientation quest.

## The 6 Game Master Faces

| Face       | Trigram | Mission / Domain                                         |
|------------|---------|----------------------------------------------------------|
| Shaman     | Fire/Magenta | Mythic threshold, ritual, emotional alchemy, belonging |
| Challenger | Thunder/Red  | Action, edge, energy validation, proving ground        |
| Regent     | Earth/Amber  | Structure, roles, rules, governance, collective order  |
| Architect  | Heaven/Orange | Strategy, blueprint, systems design, taxonomy         |
| Diplomat   | Lake/Teal    | Relational field, care, connection, bridging           |
| Sage       | Wind/Purple  | Integration, emergence, synthesis, whole-picture view  |

## TransformationMove Schema Fields

Each TransformationMove in the CANONICAL_MOVES registry has these fields:
- **move_id / move_name** — Identity and labeling
- **move_category** — Categorical classification (awareness, reframing, emotional_processing, behavioral_experiment, integration)
- **wcgs_stage** — Developmental stage: wake_up, clean_up, grow_up, show_up
- **description** — One-sentence summary of what the move does
- **purpose** — Why this move exists (the transformation it serves)
- **prompt_templates** — Array of templates by type: reflection, dialogue, somatic, action, integration
- **target_effect** — The psychological/behavioral outcome produced
- **typical_output_type** — Expected player response format
- **compatible_lock_types** — identity_lock, emotional_lock, action_lock, possibility_lock
- **compatible_emotion_channels** — fear, anger, sadness, neutrality, joy
- **compatible_nations / compatible_archetypes** — Identity resonance filters
- **bar_integration** — BAR creation config (creates_bar, timing, type, prompt)
- **quest_usage** — Quest structure (stage, arc requirement, standalone, follow-ups)
- **safety_notes** — Practitioner safety and intensity guidance

## Assignment Principles

1. **Developmental fit**: Match field semantics to the face's developmental lens.
   - Somatic/emotional fields → Shaman or Diplomat
   - Action/energy/timing fields → Challenger
   - Structural/classificatory/governance fields → Regent
   - Systems/design/taxonomy fields → Architect
   - Care/relational/connection fields → Diplomat
   - Synthesis/integration/arc fields → Sage

2. **Specificity**: Prefer the face whose mission most directly names the field's concern.
   - `safety_notes` → Diplomat (care) AND Regent (rules) — note both, rank by primacy
   - `bar_timing` (within bar_integration) → Challenger (action timing is power-sect territory)

3. **Sub-field awareness**: When a field is a struct (e.g., `bar_integration`, `quest_usage`),
   identify the dominant face for the field as a whole AND note sub-field nuances in justification.

4. **Confidence calibration**:
   - 0.9+ = This face unambiguously owns this field
   - 0.7–0.89 = Strong fit, minor overlap with another face
   - 0.5–0.69 = Moderate fit, legitimate case for alternative faces
   - 0.3–0.49 = Weak fit — flag in `unassignable_fields`
   - < 0.3 = Do not include as candidate

5. **Coherence**: The full assignment set should tell a coherent story about how the
   6 faces collaborate to co-author a complete TransformationMove proposal.

## Output Requirements
For each field: produce a primary face (highest confidence), primary justification,
and a full ranked_candidates list (all faces with confidence ≥ 0.3).
Set overall_coherence based on how well the assignments cover all fields without
conflicts. Write mapping_narrative as 2–4 sentences describing the strategy.
"""

mapping_proposer_agent = Agent(
    settings.agent_model,
    deps_type=AgentDeps,
    output_type=MappingProposal,
    system_prompt=SYSTEM_PROMPT,
)

mapping_proposer_agent.system_prompt(deftness_context)


# ---------------------------------------------------------------------------
# Deterministic fallback — uses FACE_FIELD_AFFINITY static lookup
# ---------------------------------------------------------------------------


def _build_static_assignment(field_name: str, field_semantics: str) -> FieldAssignment:
    """Build a FieldAssignment from the static FACE_FIELD_AFFINITY lookup."""
    # Collect faces that list this field in their affinity set
    affinity_faces: list[str] = []
    for face, fields in FACE_FIELD_AFFINITY.items():
        if field_name in fields:
            affinity_faces.append(face)

    if not affinity_faces:
        # Fallback: Sage covers anything not explicitly mapped (integration perspective)
        affinity_faces = ["sage"]

    # Primary = first in affinity list (insertion-ordered priority)
    primary_face = affinity_faces[0]

    # Build candidate list with decreasing confidence
    base_confidence = 0.85
    candidates: list[FaceCandidate] = []
    for i, face in enumerate(affinity_faces):
        candidates.append(
            FaceCandidate(
                face=face,  # type: ignore[arg-type]
                confidence=max(0.3, base_confidence - i * 0.15),
                justification=(
                    f"Static FACE_FIELD_AFFINITY lookup: {face} has documented affinity "
                    f"for '{field_name}' ({field_semantics[:60]}...)"
                ),
            )
        )

    return FieldAssignment(
        field_name=field_name,
        field_semantics=field_semantics,
        primary_face=primary_face,  # type: ignore[arg-type]
        primary_confidence=candidates[0].confidence,
        primary_justification=(
            f"Compile-time static mapping: {primary_face} is the canonical author "
            f"for '{field_name}' per FACE_FIELD_AFFINITY. "
            f"Field semantics: {field_semantics[:80]}"
        ),
        ranked_candidates=candidates,
    )


def deterministic_mapping_proposal(
    move_id: str | None = None,
    move_name: str | None = None,
    fields: list[str] | None = None,
) -> MappingProposal:
    """Produce a principled mapping proposal using the static FACE_FIELD_AFFINITY lookup.

    No AI required. Used as fallback when the AI model is unavailable or for
    compile-time deterministic contexts.

    Args:
        move_id: Optional TransformationMove ID to scope the proposal.
        move_name: Optional display name for the move.
        fields: Optional list of field names to include; defaults to all schema fields.
    """
    target_fields = fields or list(TRANSFORMATION_MOVE_FIELDS.keys())

    assignments: list[FieldAssignment] = []
    unassignable: list[str] = []

    for field in target_fields:
        semantics = TRANSFORMATION_MOVE_FIELDS.get(field, f"Field: {field}")
        assignment = _build_static_assignment(field, semantics)
        if assignment.primary_confidence < 0.4:
            unassignable.append(field)
        else:
            assignments.append(assignment)

    # Face coverage summary for narrative
    face_counts: dict[str, int] = {}
    for a in assignments:
        face_counts[a.primary_face] = face_counts.get(a.primary_face, 0) + 1
    dominant_face = max(face_counts, key=lambda f: face_counts[f]) if face_counts else "sage"
    dominant_count = face_counts.get(dominant_face, 0)

    return MappingProposal(
        move_id=move_id,
        move_name=move_name,
        assignments=assignments,
        overall_coherence=0.75,
        mapping_narrative=(
            f"Static compile-time mapping using FACE_FIELD_AFFINITY lookup. "
            f"The {dominant_face.capitalize()} face owns the most fields ({dominant_count}/{len(assignments)}), "
            f"reflecting its role as primary structural authority. "
            f"All 6 faces contribute where their developmental lens is most applicable. "
            f"Use the AI proposer for confidence-ranked alternatives and context-sensitive justifications."
        ),
        unassignable_fields=unassignable,
    )
