"""MemoryNode and MemoryTier models for the Living Memory System.

Phase 1: MemoryNode schema, tier transitions, and core event architecture.
No BAR Clash system yet — that is Phase 2.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, generate_cuid


class MemoryTier(str, Enum):
    """Four-tier memory hierarchy. Memory promotes through tiers via repeated access."""
    WORKING = "working"      # Raw BAR — newly captured, high fidelity, low stability
    EPISODIC = "episodic"    # Tagged BAR — context-labeled, moderate stability
    SEMANTIC = "semantic"    # Stabilized BAR — retrieved 3+ times without contradiction
    PROCEDURAL = "procedural"  # Crystallized as a game mechanic


class SourceOrigin(str, Enum):
    """How a memory node entered the system."""
    PLAYER_ACTION = "player_action"
    LLM_WIKI = "llm_wiki"
    GM_TRIGGERED = "gm_triggered"
    SYSTEM_GENERATED = "system_generated"


class MemoryNode(Base):
    """A single unit of lived experience in the bars-engine memory system.

    MemoryNodes capture any BAR or event that warrants preservation. Over time,
    through repeated successful retrieval, they crystallize from raw experience
    into stable knowledge into game mechanics.

    Phase 1: Only the MemoryNode vessel and tier promotion. No contradiction handling.
    """
    __tablename__ = "memory_nodes"
    __table_args__ = (
        Index("ix_memory_nodes_tier", "memory_tier"),
        Index("ix_memory_nodes_bar_id", "bar_id"),
        Index("ix_memory_nodes_stability", "stability_score"),
        Index("ix_memory_nodes_created", "created_at"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)

    # Core identity
    bar_id: Mapped[str | None] = mapped_column("barId", String, nullable=True, index=True)
    source_origin: Mapped[str] = mapped_column("sourceOrigin", String, default=SourceOrigin.SYSTEM_GENERATED.value)

    # Memory tier — the primary axis of memory maturation
    memory_tier: Mapped[str] = mapped_column("memoryTier", String, default=MemoryTier.WORKING.value, index=True)

    # Stability score: 0.0 (brand new) to 1.0 (fully crystallized)
    # Promotes to SEMANTIC at threshold 0.7 (3+ successful retrievals without contradiction)
    # Promotes to PROCEDURAL when stability reaches 1.0 via quest crystallization
    stability_score: Mapped[float] = mapped_column("stabilityScore", Float, default=0.0)

    # GM Face interpretive profiles — each face reads this memory differently
    shaman_read: Mapped[str | None] = mapped_column("shamanRead", Text, nullable=True, default=None)
    challenger_read: Mapped[str | None] = mapped_column("challengerRead", Text, nullable=True, default=None)
    regent_read: Mapped[str | None] = mapped_column("regentRead", Text, nullable=True, default=None)
    architect_read: Mapped[str | None] = mapped_column("architectRead", Text, nullable=True, default=None)
    diplomat_read: Mapped[str | None] = mapped_column("diplomatRead", Text, nullable=True, default=None)
    sage_read: Mapped[str | None] = mapped_column("sageRead", Text, nullable=True, default=None)

    # Stake weight — default 1.0, rises when player stakes vibeulons on this memory
    stake_weight: Mapped[float] = mapped_column("stakeWeight", Float, default=1.0)

    # Retrieval tracking
    last_accessed: Mapped[datetime | None] = mapped_column("lastAccessed", DateTime, nullable=True, default=None)
    access_count: Mapped[int] = mapped_column("accessCount", Integer, default=0)

    # Contradiction tracking — list of IDs of nodes this one contradicted
    # (Phase 2 will turn this into actual BAR Clash gameplay)
    contradiction_history: Mapped[str] = mapped_column("contradictionHistory", String, default="[]")

    # Procedural crystallization
    crystallized_into_move_id: Mapped[str | None] = mapped_column("crystallizedIntoMoveId", String, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    @property
    def tier(self) -> MemoryTier:
        return MemoryTier(self.memory_tier)

    @property
    def source(self) -> SourceOrigin:
        return SourceOrigin(self.source_origin)

    def is_high_stability(self) -> bool:
        """Returns True if node has reached semantic tier stability threshold."""
        return self.stability_score >= 0.7

    def is_crystallized(self) -> bool:
        """Returns True if node has fully crystallized into a procedural move."""
        return self.crystallized_into_move_id is not None

    def should_promote_to_semantic(self) -> bool:
        """Phase 1 promotion logic: 3+ successful accesses without contradiction."""
        return self.access_count >= 3 and self.stability_score >= 0.7