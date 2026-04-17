"""BARClash domain model for Phase 2: Living Memory — BAR Clash System.

When two MemoryNodes contradict (represent conflicting experiences or interpretations),
BARClash is the adjudication system that resolves which one becomes canonical.

Resolution uses context-dependent logic (8-cell decision matrix based on node origin,
memory tier, and player count) and incorporates 6 GM Face interpretations.

Phase 2: Clash creation, resolution, and persistence. No gameplay beyond resolution yet.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, generate_cuid


class NodeOrigin(str, Enum):
    """How a memory entered the system (affects adjudication authority)."""
    PLAYER_CREATED = "player_created"      # Player authored this memory
    SYSTEM_DISCOVERED = "system_discovered"  # Game/system discovered it


class MemoryTier(str, Enum):
    """Memory maturity (affects clash resolution urgency)."""
    WORKING = "working"          # New, raw, high fidelity
    EPISODIC = "episodic"        # Tagged, moderate stability
    SEMANTIC = "semantic"        # Proven stable, 3+ successful retrievals
    PROCEDURAL = "procedural"    # Crystallized as game mechanic


class ResolutionMode(str, Enum):
    """How a clash resolves (determined by decision matrix)."""
    PLAYER_CHOICE = "player_choice"              # Solo player decides
    WEIGHTED_BY_RELEVANCE = "weighted_by_relevance"  # Vibeulons determine weight
    MAJORITY = "majority"                        # Sage + players vote, 50%+ wins
    CONSENSUS = "consensus"                      # All must agree


class BARClash(Base):
    """A conflict between two contradicting MemoryNodes, resolved via context-dependent adjudication.

    When two MemoryNodes are marked as contradicting, a BARClash is created to resolve
    which one becomes canonical. Resolution depends on:
    - Node origin (player-created vs. system-discovered)
    - Memory tier (WORKING vs. SEMANTIC)
    - Player count (solo vs. group)

    These three variables map to 8 resolution modes, each with different adjudication authority.

    Phase 2 scope: Create, resolve, and persist clashes. Integration with quest system
    and vibeulon voting is handled separately but referenced here.
    """
    __tablename__ = "bar_clashes"
    __table_args__ = (
        Index("ix_bar_clashes_created", "created_at"),
        Index("ix_bar_clashes_resolved", "resolved_at"),
        Index("ix_bar_clashes_canonical", "canonical_node_id"),
        Index("ix_bar_clashes_status", "resolution_mode"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)

    # Core conflict
    memory_node_a_id: Mapped[str] = mapped_column("memoryNodeAId", String, index=True)
    memory_node_b_id: Mapped[str] = mapped_column("memoryNodeBId", String, index=True)

    # Decision matrix variables
    node_origin: Mapped[str] = mapped_column("nodeOrigin", String)  # "player_created" | "system_discovered"
    memory_tier: Mapped[str] = mapped_column("memoryTier", String)  # "working" | "episodic" | "semantic" | "procedural"
    player_count: Mapped[int] = mapped_column("playerCount", Integer)  # 1 = solo, 2+ = group

    # Resolution
    resolution_mode: Mapped[str] = mapped_column("resolutionMode", String, nullable=True)  # Set by decision matrix
    canonical_node_id: Mapped[str | None] = mapped_column("canonicalNodeId", String, nullable=True)  # Winner
    resolution_rationale: Mapped[str | None] = mapped_column("resolutionRationale", Text, nullable=True)  # Why this node won

    # 6 GM Face interpretations (each face reads both nodes)
    shaman_read: Mapped[str | None] = mapped_column("shamanRead", Text, nullable=True)  # Shaman's interpretation
    challenger_read: Mapped[str | None] = mapped_column("challengerRead", Text, nullable=True)
    regent_read: Mapped[str | None] = mapped_column("regentRead", Text, nullable=True)
    architect_read: Mapped[str | None] = mapped_column("architectRead", Text, nullable=True)
    diplomat_read: Mapped[str | None] = mapped_column("diplomatRead", Text, nullable=True)
    sage_read: Mapped[str | None] = mapped_column("sageRead", Text, nullable=True)

    # Player stakes (JSON serialized: {node_a_id: amount, node_b_id: amount, ...})
    # Used in weighted_by_relevance mode
    vibeulons_staked: Mapped[str] = mapped_column("vibesulonsStaked", String, default="{}")

    # Metadata
    players_involved: Mapped[str] = mapped_column("playersInvolved", String, default="[]")  # JSON array of player IDs
    clash_quest_id: Mapped[str | None] = mapped_column("clashQuestId", String, nullable=True)  # Link to quest system

    # Timestamps
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column("resolvedAt", DateTime, nullable=True)

    @property
    def origin(self) -> NodeOrigin:
        return NodeOrigin(self.node_origin)

    @property
    def tier(self) -> MemoryTier:
        return MemoryTier(self.memory_tier)

    @property
    def mode(self) -> ResolutionMode | None:
        if self.resolution_mode:
            return ResolutionMode(self.resolution_mode)
        return None

    @property
    def is_resolved(self) -> bool:
        """Returns True if clash has been adjudicated and canonical node assigned."""
        return self.canonical_node_id is not None

    @property
    def is_solo(self) -> bool:
        """Returns True if this is a solo play clash (1 player)."""
        return self.player_count == 1

    @property
    def is_group(self) -> bool:
        """Returns True if this is a group play clash (2+ players)."""
        return self.player_count >= 2

    def get_face_readings(self) -> dict[str, str | None]:
        """Return all 6 face readings as a dict."""
        return {
            "shaman": self.shaman_read,
            "challenger": self.challenger_read,
            "regent": self.regent_read,
            "architect": self.architect_read,
            "diplomat": self.diplomat_read,
            "sage": self.sage_read,
        }

    def set_face_readings(self, readings: dict[str, str]) -> None:
        """Set face readings from a dict."""
        self.shaman_read = readings.get("shaman")
        self.challenger_read = readings.get("challenger")
        self.regent_read = readings.get("regent")
        self.architect_read = readings.get("architect")
        self.diplomat_read = readings.get("diplomat")
        self.sage_read = readings.get("sage")
