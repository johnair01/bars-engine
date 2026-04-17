"""Tests for MemoryNode model and MemoryService tier promotion logic.

Phase 1 only — no BAR Clash tests (Phase 2).
Tests cover:
- MemoryNode creation and field defaults
- Tier promotion: Working → Episodic → Semantic → Procedural
- Stability scoring based on access count + contradictions
- Event firing on capture, retrieval, tier transition, crystallization
- Query helpers: get_by_tier, get_by_face_read, get_high_stability_nodes
"""
import pytest
from datetime import datetime

from app.models.base import Base, generate_cuid
from app.models.memory import MemoryNode, MemoryTier, SourceOrigin
from app.models.memory_events import MemoryEventBus, memory_events
from app.services.memory_service import MemoryService


class TestMemoryNodeModel:
    """Unit tests for MemoryNode fields, enums, and property methods."""

    def test_memory_tier_enum_values(self):
        assert MemoryTier.WORKING.value == "working"
        assert MemoryTier.EPISODIC.value == "episodic"
        assert MemoryTier.SEMANTIC.value == "semantic"
        assert MemoryTier.PROCEDURAL.value == "procedural"

    def test_source_origin_enum_values(self):
        assert SourceOrigin.PLAYER_ACTION.value == "player_action"
        assert SourceOrigin.LLM_WIKI.value == "llm_wiki"
        assert SourceOrigin.GM_TRIGGERED.value == "gm_triggered"
        assert SourceOrigin.SYSTEM_GENERATED.value == "system_generated"

    def test_memory_node_default_tier_is_working(self):
        node = MemoryNode()
        assert node.memory_tier == MemoryTier.WORKING.value

    def test_memory_node_default_stability_is_zero(self):
        node = MemoryNode()
        assert node.stability_score == 0.0

    def test_memory_node_default_access_count_is_zero(self):
        node = MemoryNode()
        assert node.access_count == 0

    def test_memory_node_contradiction_history_defaults_to_empty_list(self):
        node = MemoryNode()
        assert node.contradiction_history == "[]"

    def test_is_high_stability_returns_true_at_threshold(self):
        node = MemoryNode(stability_score=0.7)
        assert node.is_high_stability() is True

    def test_is_high_stability_returns_false_below_threshold(self):
        node = MemoryNode(stability_score=0.6)
        assert node.is_high_stability() is False

    def test_is_crystallized_false_when_no_move_id(self):
        node = MemoryNode()
        assert node.is_crystallized() is False

    def test_is_crystallized_true_when_move_id_set(self):
        node = MemoryNode(crystallized_into_move_id="move_42")
        assert node.is_crystallized() is True

    def test_tier_property_returns_enum_from_string(self):
        node = MemoryNode(memory_tier=MemoryTier.SEMANTIC.value)
        assert node.tier == MemoryTier.SEMANTIC

    def test_source_property_returns_enum_from_string(self):
        node = MemoryNode(source_origin=SourceOrigin.LLM_WIKI.value)
        assert node.source == SourceOrigin.LLM_WIKI

    def test_should_promote_to_semantic_requires_three_accesses_and_threshold(self):
        node = MemoryNode(access_count=3, stability_score=0.7)
        assert node.should_promote_to_semantic() is True

    def test_should_promote_to_semantic_false_with_insufficient_accesses(self):
        node = MemoryNode(access_count=2, stability_score=0.7)
        assert node.should_promote_to_semantic() is False

    def test_should_promote_to_semantic_false_with_low_stability(self):
        node = MemoryNode(access_count=3, stability_score=0.5)
        assert node.should_promote_to_semantic() is False


class TestMemoryEventBus:
    """Unit tests for the in-memory event bus."""

    def test_register_known_event_adds_handler(self):
        bus = MemoryEventBus()
        calls = []

        def handler(payload):
            calls.append(payload)

        bus.register("onMemoryNodeCaptured", handler)
        assert len(bus._handlers["onMemoryNodeCaptured"]) == 1

    def test_register_unknown_event_raises(self):
        bus = MemoryEventBus()
        with pytest.raises(ValueError, match="Unknown event"):
            bus.register("onFakeEvent", lambda p: None)

    def test_emit_fires_all_handlers(self):
        bus = MemoryEventBus()
        calls = []

        bus.register("onMemoryNodeCaptured", lambda p: calls.append(p))
        bus.register("onMemoryNodeCaptured", lambda p: calls.append(p))

        bus.emit("onMemoryNodeCaptured", {"node_id": "test"})
        assert len(calls) == 2

    def test_on_captured_convenience_method(self):
        bus = MemoryEventBus()
        calls = []

        bus.register("onMemoryNodeCaptured", lambda p: calls.append(p))
        bus.on_captured({"id": "node_1"})
        assert len(calls) == 1
        assert "node" in calls[0]
        assert "timestamp" in calls[0]

    def test_on_retrieved_includes_retrieval_count(self):
        bus = MemoryEventBus()
        calls = []

        bus.register("onMemoryNodeRetrieved", lambda p: calls.append(p))
        bus.on_retrieved({"id": "node_1"}, retrieval_count=5)
        assert calls[0]["retrieval_count"] == 5

    def test_on_tier_transition_emits_correct_event_for_working_to_episodic(self):
        bus = MemoryEventBus()
        calls = []

        bus.register("onWorkingToEpisodic", lambda p: calls.append(p))
        bus.on_tier_transition({"id": "node_1"}, "working", "episodic")
        assert len(calls) == 1
        assert calls[0]["from_tier"] == "working"
        assert calls[0]["to_tier"] == "episodic"

    def test_on_tier_transition_does_nothing_for_unmapped_transitions(self):
        bus = MemoryEventBus()
        # Should not raise — unmapped transitions are silently ignored
        bus.on_tier_transition({"id": "node_1"}, "working", "procedural")


class TestMemoryServiceCapture:
    """Tests for MemoryService.capture_node and related factory methods."""

    def test_capture_node_default_tier_is_working(self, in_memory_db):
        service = MemoryService(in_memory_db)
        node = service.capture_node()
        assert node.memory_tier == MemoryTier.WORKING.value

    def test_capture_node_default_source_is_system_generated(self, in_memory_db):
        service = MemoryService(in_memory_db)
        node = service.capture_node()
        assert node.source_origin == SourceOrigin.SYSTEM_GENERATED.value

    def test_capture_node_accepts_bar_id(self, in_memory_db):
        service = MemoryService(in_memory_db)
        node = service.capture_node(bar_id="bar_abc")
        assert node.bar_id == "bar_abc"

    def test_capture_from_bar_shortcut_sets_player_action_source(self, in_memory_db):
        service = MemoryService(in_memory_db)
        node = service.capture_from_bar("bar_xyz")
        assert node.source_origin == SourceOrigin.PLAYER_ACTION.value

    def test_capture_node_applies_face_reads(self, in_memory_db):
        service = MemoryService(in_memory_db)
        reads = {
            "shaman": "A threshold moment of passage",
            "architect": "Pattern recognition at structural level",
        }
        node = service.capture_node(face_reads=reads)
        assert node.shaman_read == "A threshold moment of passage"
        assert node.architect_read == "A threshold moment of passage" in node.architect_read  # may have additional text
        assert node.challenger_read is None

    def test_capture_node_fires_on_captured_event(self, in_memory_db):
        service = MemoryService(in_memory_db)
        captured_payloads = []

        memory_events.register("onMemoryNodeCaptured", lambda p: captured_payloads.append(p))
        node = service.capture_node(bar_id="bar_fire")

        assert len(captured_payloads) == 1
        assert captured_payloads[0]["node"]["bar_id"] == "bar_fire"


class TestMemoryServiceRetrieval:
    """Tests for MemoryService.retrieve and stability recalculation."""

    def test_retrieve_increments_access_count(self, in_memory_db):
        service = MemoryService(in_memory_db)
        node = service.capture_node(bar_id="bar_r1")
        initial_count = node.access_count

        service.retrieve(node.id)
        assert node.access_count == initial_count + 1

    def test_retrieve_updates_last_accessed(self, in_memory_db):
        service = MemoryService(in_memory_db)
        node = service.capture_node()
        assert node.last_accessed is None

        service.retrieve(node.id)
        assert node.last_accessed is not None

    def test_retrieve_fires_on_retrieved_event(self, in_memory_db):
        service = MemoryService(in_memory_db)
        node = service.capture_node()
        retrieved_payloads = []

        memory_events.register("onMemoryNodeRetrieved", lambda p: retrieved_payloads.append(p))
        service.retrieve(node.id)

        assert len(retrieved_payloads) == 1
        assert retrieved_payloads[0]["retrieval_count"] == 1

    def test_stability_rises_with_access_count(self, in_memory_db):
        service = MemoryService(in_memory_db)
        node = service.capture_node()

        for _ in range(5):
            service.retrieve(node.id)

        # After 5 retrievals: base = 0.5 (capped from count alone)
        # No contradictions, so no penalty
        assert node.stability_score > 0.0

    def test_stability_penalty_from_contradictions(self, in_memory_db):
        service = MemoryService(in_memory_db)
        node = service.capture_node()
        node.contradiction_history = '["node_a", "node_b"]'
        service.db.flush()

        service._recalculate_stability(node)

        # Base from count=0 is 0, penalty from 2 contradictions = 0.2
        assert node.stability_score == 0.0


class TestMemoryServiceTierPromotion:
    """Tests for tier promotion logic: Working → Episodic → Semantic → Procedural."""

    def test_working_promotes_to_episodic_after_one_access(self, in_memory_db):
        service = MemoryService(in_memory_db)
        node = service.capture_node()
        assert node.memory_tier == MemoryTier.WORKING.value

        service.retrieve(node.id)  # 1 access → promote to episodic
        assert node.memory_tier == MemoryTier.EPISODIC.value

    def test_episodic_promotes_to_semantic_after_three_accesses_and_threshold(self, in_memory_db):
        service = MemoryService(in_memory_db)
        node = service.capture_node()

        # Manually set to episodic to test that transition
        node.memory_tier = MemoryTier.EPISODIC.value
        service.db.flush()

        # 3 retrievals needed to reach semantic
        service.retrieve(node.id)  # count=1
        assert node.memory_tier == MemoryTier.EPISODIC.value

        service.retrieve(node.id)  # count=2
        assert node.memory_tier == MemoryTier.EPISODIC.value

        service.retrieve(node.id)  # count=3, stability should hit threshold
        assert node.memory_tier == MemoryTier.SEMANTIC.value

    def test_promotion_fires_tier_transition_event(self, in_memory_db):
        service = MemoryService(in_memory_db)
        node = service.capture_node()
        transition_payloads = []

        memory_events.register("onWorkingToEpisodic", lambda p: transition_payloads.append(p))
        service.retrieve(node.id)

        assert len(transition_payloads) == 1
        assert transition_payloads[0]["from_tier"] == "working"
        assert transition_payloads[0]["to_tier"] == "episodic"

    def test_promotion_fires_on_high_stability_event(self, in_memory_db):
        service = MemoryService(in_memory_db)
        node = service.capture_node()
        high_stability_payloads = []

        memory_events.register("onHighStabilityReached", lambda p: high_stability_payloads.append(p))

        # Rapid promotion to semantic
        node.memory_tier = MemoryTier.EPISODIC.value
        node.access_count = 2
        service.db.flush()

        service.retrieve(node.id)  # 3rd access → semantic promotion

        assert len(high_stability_payloads) >= 1

    def test_semantic_promotes_to_procedural_only_when_crystallized(self, in_memory_db):
        service = MemoryService(in_memory_db)
        node = service.capture_node()
        node.memory_tier = MemoryTier.SEMANTIC.value
        service.db.flush()

        # Retrieval alone should NOT promote to procedural
        service.retrieve(node.id)
        assert node.memory_tier == MemoryTier.SEMANTIC.value

        # Crystallization should promote
        service.crystallize(node.id, move_id="move_fireball")
        assert node.memory_tier == MemoryTier.PROCEDURAL.value

    def test_crystallize_fires_on_crystallized_event(self, in_memory_db):
        service = MemoryService(in_memory_db)
        node = service.capture_node()
        node.memory_tier = MemoryTier.SEMANTIC.value
        service.db.flush()

        crystallized_payloads = []
        memory_events.register("onProceduralCrystallization", lambda p: crystallized_payloads.append(p))

        service.crystallize(node.id, move_id="move_flame")
        assert len(crystallized_payloads) == 1
        assert crystallized_payloads[0]["move_id"] == "move_flame"


class TestMemoryServiceQueries:
    """Tests for query helpers."""

    def test_get_by_tier(self, in_memory_db):
        service = MemoryService(in_memory_db)
        node_w = service.capture_node()
        node_e = service.capture_node()
        node_w.memory_tier = MemoryTier.WORKING.value
        node_e.memory_tier = MemoryTier.EPISODIC.value
        service.db.flush()

        episodic_nodes = service.get_by_tier(MemoryTier.EPISODIC)
        assert len(episodic_nodes) >= 1

    def test_get_by_face_read(self, in_memory_db):
        service = MemoryService(in_memory_db)
        node = service.capture_node(face_reads={"shaman": "A threshold moment"})
        service.db.flush()

        shaman_nodes = service.get_by_face_read("shaman")
        assert any(n.id == node.id for n in shaman_nodes)

    def test_get_high_stability_nodes(self, in_memory_db):
        service = MemoryService(in_memory_db)
        node = service.capture_node(stability_score=0.8)
        service.db.flush()

        high_nodes = service.get_high_stability_nodes(threshold=0.7)
        assert any(n.id == node.id for n in high_nodes)

    def test_get_crystallized_nodes(self, in_memory_db):
        service = MemoryService(in_memory_db)
        node = service.capture_node()
        node.crystallized_into_move_id = "move_shadow"
        service.db.flush()

        crystallized = service.get_crystallized_nodes()
        assert any(n.id == node.id for n in crystallized)


# ─── Pytest Fixtures ────────────────────────────────────────────────────────

@pytest.fixture
def in_memory_db():
    """In-memory SQLite database for testing."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)

    with Session(engine) as session:
        yield session