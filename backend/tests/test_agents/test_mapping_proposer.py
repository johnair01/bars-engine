"""Tests for the Mapping Proposer agent (field-to-face assignment).

Sub-AC 23c: AI mapping proposer that ingests face description context and
TransformationMove field semantics to generate and rank principled
field-to-face assignments with justifications.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient
from pydantic_ai.models.test import TestModel

from app.agents._deps import AgentDeps
from app.agents.mapping_proposer import (
    FACE_FIELD_AFFINITY,
    TRANSFORMATION_MOVE_FIELDS,
    FieldAssignment,
    MappingProposal,
    deterministic_mapping_proposal,
    mapping_proposer_agent,
)
from app.main import app

# ---------------------------------------------------------------------------
# Unit: FACE_FIELD_AFFINITY static compile-time lookup
# ---------------------------------------------------------------------------


class TestFaceFieldAffinity:
    def test_all_six_faces_present(self):
        expected_faces = {"shaman", "challenger", "regent", "architect", "diplomat", "sage"}
        assert set(FACE_FIELD_AFFINITY.keys()) == expected_faces

    def test_each_face_has_at_least_one_field(self):
        for face, fields in FACE_FIELD_AFFINITY.items():
            assert len(fields) >= 1, f"{face} must own at least one field"

    def test_all_affinity_fields_are_known_schema_fields(self):
        """Every field in FACE_FIELD_AFFINITY must be a valid TransformationMove field."""
        known = set(TRANSFORMATION_MOVE_FIELDS.keys())
        for face, fields in FACE_FIELD_AFFINITY.items():
            for f in fields:
                assert f in known, (
                    f"FACE_FIELD_AFFINITY['{face}'] references unknown field '{f}'"
                )

    def test_transformation_move_fields_coverage(self):
        """Every canonical TransformationMove field must appear in at least one face's affinity."""
        all_assigned = {f for fields in FACE_FIELD_AFFINITY.values() for f in fields}
        for field in TRANSFORMATION_MOVE_FIELDS:
            assert field in all_assigned, (
                f"TransformationMove field '{field}' is not assigned to any face "
                f"in FACE_FIELD_AFFINITY"
            )

    def test_shaman_owns_emotional_fields(self):
        """Shaman must claim compatible_emotion_channels (emotional alchemy domain)."""
        assert "compatible_emotion_channels" in FACE_FIELD_AFFINITY["shaman"]

    def test_challenger_owns_bar_integration(self):
        """Challenger's action/power domain makes it primary for bar_integration."""
        assert "bar_integration" in FACE_FIELD_AFFINITY["challenger"]

    def test_regent_owns_governance_fields(self):
        """Regent owns structure/governance fields (move_id, safety_notes, quest_usage)."""
        regent_fields = FACE_FIELD_AFFINITY["regent"]
        assert "move_id" in regent_fields
        assert "safety_notes" in regent_fields

    def test_architect_owns_classification_fields(self):
        """Architect owns design/taxonomy fields (move_category, description)."""
        architect_fields = FACE_FIELD_AFFINITY["architect"]
        assert "move_category" in architect_fields
        assert "description" in architect_fields

    def test_sage_owns_integration_fields(self):
        """Sage owns arc/integration fields (purpose, target_effect, quest_usage)."""
        sage_fields = FACE_FIELD_AFFINITY["sage"]
        assert "purpose" in sage_fields
        assert "target_effect" in sage_fields


# ---------------------------------------------------------------------------
# Unit: TRANSFORMATION_MOVE_FIELDS schema coverage
# ---------------------------------------------------------------------------


class TestTransformationMoveFieldSemantics:
    def test_all_16_fields_defined(self):
        """All canonical TransformationMove fields must have semantic descriptions."""
        expected_fields = {
            "move_id", "move_name", "move_category", "wcgs_stage",
            "description", "purpose", "prompt_templates", "target_effect",
            "typical_output_type", "compatible_lock_types",
            "compatible_emotion_channels", "compatible_nations",
            "compatible_archetypes", "bar_integration", "quest_usage",
            "safety_notes",
        }
        missing = expected_fields - set(TRANSFORMATION_MOVE_FIELDS.keys())
        assert not missing, f"Missing semantic definitions for fields: {missing}"

    def test_no_empty_semantics(self):
        for field, semantics in TRANSFORMATION_MOVE_FIELDS.items():
            assert semantics.strip(), f"Field '{field}' has empty semantics string"


# ---------------------------------------------------------------------------
# Unit: deterministic fallback
# ---------------------------------------------------------------------------


class TestDeterministicMappingProposal:
    def test_produces_valid_mapping_proposal(self):
        proposal = deterministic_mapping_proposal()
        assert isinstance(proposal, MappingProposal)
        assert len(proposal.assignments) > 0

    def test_all_fields_have_assignments(self):
        proposal = deterministic_mapping_proposal()
        assigned_fields = {a.field_name for a in proposal.assignments}
        # All fields should have an assignment (not in unassignable)
        for field in TRANSFORMATION_MOVE_FIELDS:
            assert field in assigned_fields or field in proposal.unassignable_fields, (
                f"Field '{field}' is neither assigned nor flagged as unassignable"
            )

    def test_assignments_have_valid_faces(self):
        valid_faces = {"shaman", "challenger", "regent", "architect", "diplomat", "sage"}
        proposal = deterministic_mapping_proposal()
        for assignment in proposal.assignments:
            assert assignment.primary_face in valid_faces, (
                f"Field '{assignment.field_name}' assigned to unknown face "
                f"'{assignment.primary_face}'"
            )

    def test_confidence_in_valid_range(self):
        proposal = deterministic_mapping_proposal()
        for assignment in proposal.assignments:
            assert 0.0 <= assignment.primary_confidence <= 1.0, (
                f"Field '{assignment.field_name}' has out-of-range confidence "
                f"{assignment.primary_confidence}"
            )
            for candidate in assignment.ranked_candidates:
                assert 0.0 <= candidate.confidence <= 1.0

    def test_justification_is_non_empty(self):
        proposal = deterministic_mapping_proposal()
        for assignment in proposal.assignments:
            assert assignment.primary_justification.strip(), (
                f"Field '{assignment.field_name}' has empty justification"
            )

    def test_coherence_in_valid_range(self):
        proposal = deterministic_mapping_proposal()
        assert 0.0 <= proposal.overall_coherence <= 1.0

    def test_mapping_narrative_is_non_empty(self):
        proposal = deterministic_mapping_proposal()
        assert proposal.mapping_narrative.strip()

    def test_move_id_and_name_propagated(self):
        proposal = deterministic_mapping_proposal(move_id="observe", move_name="Observe")
        assert proposal.move_id == "observe"
        assert proposal.move_name == "Observe"

    def test_field_scoping(self):
        """When fields= is provided, only those fields appear in assignments."""
        subset = ["description", "purpose", "safety_notes"]
        proposal = deterministic_mapping_proposal(fields=subset)
        assigned_fields = {a.field_name for a in proposal.assignments}
        # Only requested fields (minus unassignable) should be present
        for field in assigned_fields:
            assert field in subset, (
                f"Field '{field}' should not appear when scoped to {subset}"
            )

    def test_ranked_candidates_include_primary(self):
        """The primary face must appear in ranked_candidates."""
        proposal = deterministic_mapping_proposal()
        for assignment in proposal.assignments:
            candidate_faces = {c.face for c in assignment.ranked_candidates}
            assert assignment.primary_face in candidate_faces, (
                f"Primary face '{assignment.primary_face}' not in ranked_candidates "
                f"for field '{assignment.field_name}'"
            )

    def test_none_move_id_is_valid(self):
        """Schema-level generic proposals (no move_id) should work fine."""
        proposal = deterministic_mapping_proposal(move_id=None, move_name=None)
        assert proposal.move_id is None
        assert proposal.move_name is None
        assert len(proposal.assignments) > 0


# ---------------------------------------------------------------------------
# Unit: FieldAssignment model
# ---------------------------------------------------------------------------


class TestFieldAssignment:
    def test_field_assignment_construction(self):
        from app.agents.mapping_proposer import FaceCandidate

        assignment = FieldAssignment(
            field_name="purpose",
            field_semantics="Why this move exists",
            primary_face="sage",
            primary_confidence=0.88,
            primary_justification="Sage synthesizes the arc across all stages.",
            ranked_candidates=[
                FaceCandidate(face="sage", confidence=0.88, justification="Integration lens."),
                FaceCandidate(face="shaman", confidence=0.65, justification="Mythic purpose."),
            ],
        )
        assert assignment.primary_face == "sage"
        assert len(assignment.ranked_candidates) == 2


# ---------------------------------------------------------------------------
# Unit: agent with TestModel
# ---------------------------------------------------------------------------


class TestMappingProposerAgent:
    @pytest.mark.asyncio
    async def test_agent_output_type(self):
        """Verify the agent produces a MappingProposal with TestModel."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_result.scalar_one_or_none.return_value = None
        mock_result.all.return_value = []
        mock_db.execute.return_value = mock_result

        deps = AgentDeps(db=mock_db, player_id=None)

        with mapping_proposer_agent.override(model=TestModel()):
            result = await mapping_proposer_agent.run(
                "Generate field-to-face assignments for move 'observe'.",
                deps=deps,
            )
            assert isinstance(result.output, MappingProposal)


# ---------------------------------------------------------------------------
# Route: deterministic path (no API key) and AI path
# ---------------------------------------------------------------------------


class TestMappingProposerRoute:
    @pytest.mark.asyncio
    async def test_deterministic_route(self, monkeypatch):
        """When openai_api_key is empty, the route uses the deterministic fallback."""
        from app import config

        monkeypatch.setattr(config.settings, "openai_api_key", "")

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/agents/mapping-proposer/propose",
                json={"move_id": "observe", "move_name": "Observe"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["agent"] == "mapping_proposer"
        assert data["deterministic"] is True
        assert "output" in data
        output = data["output"]
        assert "assignments" in output
        assert len(output["assignments"]) > 0

    @pytest.mark.asyncio
    async def test_deterministic_route_no_move_id(self, monkeypatch):
        """Schema-level proposal (no move_id) should succeed via deterministic path."""
        from app import config

        monkeypatch.setattr(config.settings, "openai_api_key", "")

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/agents/mapping-proposer/propose",
                json={},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["deterministic"] is True
        assert data["output"]["move_id"] is None

    @pytest.mark.asyncio
    async def test_deterministic_route_with_field_scoping(self, monkeypatch):
        """When fields list is provided, only those fields appear in assignments."""
        from app import config

        monkeypatch.setattr(config.settings, "openai_api_key", "")

        requested_fields = ["description", "safety_notes"]

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/agents/mapping-proposer/propose",
                json={"move_id": "feel", "fields": requested_fields},
            )

        assert response.status_code == 200
        data = response.json()
        assigned_fields = {a["field_name"] for a in data["output"]["assignments"]}
        for field in assigned_fields:
            assert field in requested_fields

    @pytest.mark.asyncio
    async def test_ai_route_with_test_model(self, monkeypatch):
        """When openai_api_key is set, the route uses the AI agent (TestModel override)."""
        from app import config

        monkeypatch.setattr(config.settings, "openai_api_key", "test-key")

        with mapping_proposer_agent.override(model=TestModel()):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                response = await client.post(
                    "/api/agents/mapping-proposer/propose",
                    json={"move_id": "reframe", "move_name": "Reframe"},
                )

        assert response.status_code == 200
        data = response.json()
        assert data["agent"] == "mapping_proposer"
        assert data["deterministic"] is False
        assert "output" in data

    @pytest.mark.asyncio
    async def test_route_with_face_context(self, monkeypatch):
        """Face context string (natural language admin constraints) is passed through."""
        from app import config

        monkeypatch.setattr(config.settings, "openai_api_key", "")

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/agents/mapping-proposer/propose",
                json={
                    "move_id": "invert",
                    "face_context": "This sub-packet emphasizes the Challenger's edge energy.",
                },
            )

        assert response.status_code == 200
        # Deterministic path still succeeds even with face_context present
        assert response.json()["deterministic"] is True
