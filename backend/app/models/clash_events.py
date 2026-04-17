"""Events for BAR Clash System (Phase 2: Living Memory).

Events fired by ClashEventBus to coordinate clash creation, resolution, and quest integration.
Follows same pattern as MemoryEventBus (Phase 1).
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass
class ClashCreated:
    """Fired when a contradiction is detected and a clash is created."""
    clash_id: str
    memory_node_a_id: str
    memory_node_b_id: str
    node_origin: str  # "player_created" | "system_discovered"
    memory_tier: str  # "working" | "episodic" | "semantic" | "procedural"
    player_count: int
    created_at: datetime

    def to_dict(self) -> dict[str, Any]:
        return {
            "clash_id": self.clash_id,
            "memory_node_a_id": self.memory_node_a_id,
            "memory_node_b_id": self.memory_node_b_id,
            "node_origin": self.node_origin,
            "memory_tier": self.memory_tier,
            "player_count": self.player_count,
            "created_at": self.created_at.isoformat(),
        }


@dataclass
class ClashResolved:
    """Fired when a clash is adjudicated and a canonical node is selected."""
    clash_id: str
    canonical_node_id: str
    resolution_mode: str  # "player_choice" | "weighted_by_relevance" | "majority" | "consensus"
    resolution_rationale: str
    resolved_at: datetime

    def to_dict(self) -> dict[str, Any]:
        return {
            "clash_id": self.clash_id,
            "canonical_node_id": self.canonical_node_id,
            "resolution_mode": self.resolution_mode,
            "resolution_rationale": self.resolution_rationale,
            "resolved_at": self.resolved_at.isoformat(),
        }


@dataclass
class ClashAbandoned:
    """Fired when a clash is abandoned (timeout, players leave, etc.)."""
    clash_id: str
    reason: str  # "timeout" | "consensus_impossible" | "players_left" | etc.
    abandoned_at: datetime

    def to_dict(self) -> dict[str, Any]:
        return {
            "clash_id": self.clash_id,
            "reason": self.reason,
            "abandoned_at": self.abandoned_at.isoformat(),
        }


@dataclass
class StakedOnInterpretation:
    """Fired when a player stakes vibeulons on an interpretation."""
    clash_id: str
    player_id: str
    interpretation: str  # "memory_node_a_id" | "memory_node_b_id"
    amount: float
    staked_at: datetime

    def to_dict(self) -> dict[str, Any]:
        return {
            "clash_id": self.clash_id,
            "player_id": self.player_id,
            "interpretation": self.interpretation,
            "amount": self.amount,
            "staked_at": self.staked_at.isoformat(),
        }


@dataclass
class FaceReadingsGenerated:
    """Fired when all 6 faces have read the conflicting nodes."""
    clash_id: str
    shaman: str
    challenger: str
    regent: str
    architect: str
    diplomat: str
    sage: str
    generated_at: datetime

    def to_dict(self) -> dict[str, Any]:
        return {
            "clash_id": self.clash_id,
            "shaman": self.shaman,
            "challenger": self.challenger,
            "regent": self.regent,
            "architect": self.architect,
            "diplomat": self.diplomat,
            "sage": self.sage,
            "generated_at": self.generated_at.isoformat(),
        }


@dataclass
class ConsensusBroken:
    """Fired when consensus cannot be reached and clash times out."""
    clash_id: str
    players_voted: list[str]
    breakdown: dict[str, int]  # {interpretation: vote_count}
    broken_at: datetime

    def to_dict(self) -> dict[str, Any]:
        return {
            "clash_id": self.clash_id,
            "players_voted": self.players_voted,
            "breakdown": self.breakdown,
            "broken_at": self.broken_at.isoformat(),
        }
