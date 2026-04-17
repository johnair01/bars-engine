"""Tests for BARClash domain model."""
import pytest
from datetime import datetime

from app.models.bar_clash import BARClash, NodeOrigin, MemoryTier, ResolutionMode


class TestBARClashModel:
    """Test BARClash model fields, types, and properties."""

    def test_bar_clash_creation(self):
        """Test creating a BARClash instance."""
        clash = BARClash(
            id="clash_test_001",
            memory_node_a_id="node_a",
            memory_node_b_id="node_b",
            node_origin=NodeOrigin.PLAYER_CREATED.value,
            memory_tier=MemoryTier.WORKING.value,
            player_count=1,
        )

        assert clash.id == "clash_test_001"
        assert clash.memory_node_a_id == "node_a"
        assert clash.memory_node_b_id == "node_b"
        assert clash.origin == NodeOrigin.PLAYER_CREATED
        assert clash.tier == MemoryTier.WORKING
        assert clash.player_count == 1
        assert clash.is_solo is True
        assert clash.is_group is False
        assert clash.is_resolved is False

    def test_bar_clash_resolution(self):
        """Test setting resolution on a clash."""
        clash = BARClash(
            id="clash_test_002",
            memory_node_a_id="node_a",
            memory_node_b_id="node_b",
            node_origin=NodeOrigin.SYSTEM_DISCOVERED.value,
            memory_tier=MemoryTier.SEMANTIC.value,
            player_count=2,
            resolution_mode=ResolutionMode.CONSENSUS.value,
            canonical_node_id="node_a",
            resolution_rationale="All players agreed on node A",
        )

        assert clash.mode == ResolutionMode.CONSENSUS
        assert clash.canonical_node_id == "node_a"
        assert clash.is_resolved is True
        assert clash.is_group is True

    def test_face_readings_dict(self):
        """Test setting and getting face readings."""
        clash = BARClash(
            id="clash_test_003",
            memory_node_a_id="node_a",
            memory_node_b_id="node_b",
            node_origin=NodeOrigin.PLAYER_CREATED.value,
            memory_tier=MemoryTier.EPISODIC.value,
            player_count=1,
        )

        readings = {
            "shaman": "Shadow of identity conflict",
            "challenger": "Test which interpretation holds",
            "regent": "Elegant balance between both views",
            "architect": "Structural implications",
            "diplomat": "Community harmony at stake",
            "sage": "Synthesis of both perspectives",
        }

        clash.set_face_readings(readings)

        retrieved = clash.get_face_readings()
        assert retrieved["shaman"] == "Shadow of identity conflict"
        assert retrieved["challenger"] == "Test which interpretation holds"
        assert retrieved["regent"] == "Elegant balance between both views"
        assert retrieved["architect"] == "Structural implications"
        assert retrieved["diplomat"] == "Community harmony at stake"
        assert retrieved["sage"] == "Synthesis of both perspectives"

    def test_enums(self):
        """Test all enum values."""
        # NodeOrigin
        assert NodeOrigin.PLAYER_CREATED.value == "player_created"
        assert NodeOrigin.SYSTEM_DISCOVERED.value == "system_discovered"

        # MemoryTier
        assert MemoryTier.WORKING.value == "working"
        assert MemoryTier.EPISODIC.value == "episodic"
        assert MemoryTier.SEMANTIC.value == "semantic"
        assert MemoryTier.PROCEDURAL.value == "procedural"

        # ResolutionMode
        assert ResolutionMode.PLAYER_CHOICE.value == "player_choice"
        assert ResolutionMode.WEIGHTED_BY_RELEVANCE.value == "weighted_by_relevance"
        assert ResolutionMode.MAJORITY.value == "majority"
        assert ResolutionMode.CONSENSUS.value == "consensus"

    def test_solo_vs_group(self):
        """Test solo/group detection."""
        solo = BARClash(
            id="solo",
            memory_node_a_id="a",
            memory_node_b_id="b",
            node_origin="player_created",
            memory_tier="working",
            player_count=1,
        )

        group = BARClash(
            id="group",
            memory_node_a_id="a",
            memory_node_b_id="b",
            node_origin="player_created",
            memory_tier="working",
            player_count=3,
        )

        assert solo.is_solo is True
        assert solo.is_group is False
        assert group.is_solo is False
        assert group.is_group is True

    def test_resolved_vs_unresolved(self):
        """Test resolution status."""
        unresolved = BARClash(
            id="unresolved",
            memory_node_a_id="a",
            memory_node_b_id="b",
            node_origin="player_created",
            memory_tier="working",
            player_count=1,
        )

        resolved = BARClash(
            id="resolved",
            memory_node_a_id="a",
            memory_node_b_id="b",
            node_origin="player_created",
            memory_tier="working",
            player_count=1,
            canonical_node_id="a",
        )

        assert unresolved.is_resolved is False
        assert resolved.is_resolved is True

    def test_all_node_origins(self):
        """Test both node origin types."""
        player_created = BARClash(
            id="pc",
            memory_node_a_id="a",
            memory_node_b_id="b",
            node_origin=NodeOrigin.PLAYER_CREATED.value,
            memory_tier="working",
            player_count=1,
        )

        system_discovered = BARClash(
            id="sd",
            memory_node_a_id="a",
            memory_node_b_id="b",
            node_origin=NodeOrigin.SYSTEM_DISCOVERED.value,
            memory_tier="working",
            player_count=1,
        )

        assert player_created.origin == NodeOrigin.PLAYER_CREATED
        assert system_discovered.origin == NodeOrigin.SYSTEM_DISCOVERED

    def test_all_memory_tiers(self):
        """Test all memory tier types."""
        for tier in [MemoryTier.WORKING, MemoryTier.EPISODIC, MemoryTier.SEMANTIC, MemoryTier.PROCEDURAL]:
            clash = BARClash(
                id=f"tier_{tier.value}",
                memory_node_a_id="a",
                memory_node_b_id="b",
                node_origin="player_created",
                memory_tier=tier.value,
                player_count=1,
            )
            assert clash.tier == tier
