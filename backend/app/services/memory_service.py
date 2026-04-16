"""Memory service — manages MemoryNode lifecycle, tier transitions, and stability scoring.

Phase 1 responsibilities:
- Create and capture memory nodes
- Handle tier promotion logic (Working → Episodic → Semantic → Procedural)
- Track retrieval counts and stability scores
- Fire events on tier transition
- Query nodes by tier, face, source origin

Phase 2 will add: contradiction detection and BAR Clash triggering
Phase 3 will add: hybrid retrieval (BM25 + vector + graph)
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models.memory import MemoryNode, MemoryTier, SourceOrigin
from app.models.memory_events import memory_events

logger = logging.getLogger(__name__)

STABILITY_PROMOTION_THRESHOLD = 0.7
EPISODIC_PROMOTION_ACCESS_COUNT = 3


class MemoryService:
    """Tier management and memory node lifecycle.

    Usage:
        service = MemoryService(db)
        node = service.capture_node(bar_id="bar_123", source=SourceOrigin.PLAYER_ACTION)
        retrieved = service.retrieve(node.id)
    """

    def __init__(self, db: Session):
        self.db = db

    # ─── Node Creation ─────────────────────────────────────────────────────

    def capture_node(
        self,
        bar_id: Optional[str] = None,
        source: SourceOrigin = SourceOrigin.SYSTEM_GENERATED,
        initial_tier: MemoryTier = MemoryTier.WORKING,
        face_reads: Optional[dict[str, str]] = None,
    ) -> MemoryNode:
        """Capture a new memory node from any source (BAR, LLM Wiki, GM, system)."""
        node = MemoryNode(
            bar_id=bar_id,
            source_origin=source.value,
            memory_tier=initial_tier.value,
            stability_score=0.0,
            access_count=0,
            contradiction_history="[]",
            created_at=datetime.utcnow(),
        )

        # Apply any GM face interpretive reads if provided
        if face_reads:
            for face, read in face_reads.items():
                attr = f"{face}_read"
                if hasattr(node, attr):
                    setattr(node, attr, read)

        self.db.add(node)
        self.db.flush()

        # Fire captured event
        memory_events.on_captured(self._node_to_dict(node))

        return node

    def capture_from_bar(self, bar_id: str, face_reads: Optional[dict[str, str]] = None) -> MemoryNode:
        """Shorthand: capture a BAR as a new memory node."""
        return self.capture_node(
            bar_id=bar_id,
            source=SourceOrigin.PLAYER_ACTION,
            initial_tier=MemoryTier.WORKING,
            face_reads=face_reads,
        )

    # ─── Retrieval & Stability ─────────────────────────────────────────────

    def retrieve(self, node_id: str) -> Optional[MemoryNode]:
        """Retrieve a memory node by ID. Updates access count and last_accessed."""
        node = self.db.get(MemoryNode, node_id)
        if not node:
            return None

        node.access_count += 1
        node.last_accessed = datetime.utcnow()
        self.db.flush()

        # Re-score stability based on retrieval
        old_tier = node.memory_tier
        self._recalculate_stability(node)

        # Check for tier promotion
        self._evaluate_tier_promotion(node, old_tier)

        # Fire retrieved event
        memory_events.on_retrieved(self._node_to_dict(node), node.access_count)

        return node

    def _recalculate_stability(self, node: MemoryNode) -> None:
        """Recalculate stability score based on retrieval history and contradiction count."""
        base_score = min(node.access_count * 0.1, 0.5)  # 0.1 per access, capped at 0.5 from count alone

        # Contradictions reduce stability
        try:
            contradictions = json.loads(node.contradiction_history)
            if isinstance(contradictions, list):
                contradiction_penalty = len(contradictions) * 0.1
            else:
                contradiction_penalty = 0.0
        except (json.JSONDecodeError, TypeError):
            contradiction_penalty = 0.0

        node.stability_score = max(0.0, min(1.0, base_score - contradiction_penalty))

    def _evaluate_tier_promotion(self, node: MemoryNode, old_tier: str) -> None:
        """Evaluate and execute tier promotions based on stability and access thresholds."""
        transitions = {
            MemoryTier.WORKING.value: (MemoryTier.EPISODIC, lambda n: n.access_count >= 1),
            MemoryTier.EPISODIC.value: (MemoryTier.SEMANTIC, lambda n: n.access_count >= EPISODIC_PROMOTION_ACCESS_COUNT and n.stability_score >= STABILITY_PROMOTION_THRESHOLD),
            MemoryTier.SEMANTIC.value: (MemoryTier.PROCEDURAL, lambda n: n.crystallized_into_move_id is not None),
        }

        if old_tier in transitions:
            next_tier, condition = transitions[old_tier]
            if condition(node):
                self._promote_tier(node, old_tier, next_tier.value)

    def _promote_tier(self, node: MemoryNode, from_tier: str, to_tier: str) -> None:
        """Execute a tier promotion with event firing."""
        node.memory_tier = to_tier
        self.db.flush()

        # Fire tier transition + high stability event
        memory_events.on_tier_transition(self._node_to_dict(node), from_tier, to_tier)
        memory_events.on_high_stability(self._node_to_dict(node), from_tier, to_tier)

        logger.info(f"MemoryNode {node.id} promoted: {from_tier} → {to_tier}")

    # ─── Procedural Crystallization ─────────────────────────────────────────

    def crystallize(self, node_id: str, move_id: str) -> Optional[MemoryNode]:
        """Crystallize a high-stability node into a procedural game move."""
        node = self.db.get(MemoryNode, node_id)
        if not node:
            return None

        node.crystallized_into_move_id = move_id
        node.stability_score = 1.0

        # Promote to procedural
        old_tier = node.memory_tier
        self._promote_tier(node, old_tier, MemoryTier.PROCEDURAL.value)

        # Fire crystallization event
        memory_events.on_crystallized(self._node_to_dict(node), move_id)

        logger.info(f"MemoryNode {node.id} crystallized into move {move_id}")
        return node

    # ─── Contradiction Tracking (Phase 1 stub — Phase 2 will expand) ────────

    def record_contradiction(self, node_id: str, contradicted_node_id: str) -> None:
        """Record that this node contradicted another node."""
        node = self.db.get(MemoryNode, node_id)
        if not node:
            return

        try:
            history = json.loads(node.contradiction_history)
        except (json.JSONDecodeError, TypeError):
            history = []

        if contradicted_node_id not in history:
            history.append(contradicted_node_id)
            node.contradiction_history = json.dumps(history)

        # Contradiction reduces stability — node must be re-retrieved to recover
        node.stability_score = max(0.0, node.stability_score - 0.2)
        self.db.flush()

        logger.warning(f"MemoryNode {node_id} contradicted {contradicted_node_id}. Stability: {node.stability_score}")

    # ─── Queries ────────────────────────────────────────────────────────────

    def get_by_tier(self, tier: MemoryTier) -> list[MemoryNode]:
        """Get all nodes at a given tier."""
        return list(self.db.execute(
            select(MemoryNode).where(MemoryNode.memory_tier == tier.value)
        ).scalars())

    def get_by_face_read(self, face: str) -> list[MemoryNode]:
        """Get all nodes that have a read for a given face."""
        attr = f"{face}_read"
        if not hasattr(MemoryNode, attr):
            raise ValueError(f"Unknown face: {face}")
        return list(self.db.execute(
            select(MemoryNode).where(getattr(MemoryNode, attr).isnot(None))
        ).scalars())

    def get_high_stability_nodes(self, threshold: float = STABILITY_PROMOTION_THRESHOLD) -> list[MemoryNode]:
        """Get nodes approaching semantic tier (stability >= threshold)."""
        return list(self.db.execute(
            select(MemoryNode).where(MemoryNode.stability_score >= threshold)
        ).scalars())

    def get_crystallized_nodes(self) -> list[MemoryNode]:
        """Get all nodes that have crystallized into procedural moves."""
        return list(self.db.execute(
            select(MemoryNode).where(MemoryNode.crystallized_into_move_id.isnot(None))
        ).scalars())

    # ─── Utilities ──────────────────────────────────────────────────────────

    @staticmethod
    def _node_to_dict(node: MemoryNode) -> dict:
        return {
            "id": node.id,
            "bar_id": node.bar_id,
            "memory_tier": node.memory_tier,
            "stability_score": node.stability_score,
            "access_count": node.access_count,
            "source_origin": node.source_origin,
        }