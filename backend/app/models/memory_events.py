"""Core memory events for the Living Memory System.

Phase 1 implements four core events:
- onMemoryNodeCaptured
- onMemoryNodeRetrieved
- onHighStabilityReached
- onProceduralCrystallization

Plus three tier transition events:
- onWorkingToEpisodic
- onEpisodicToSemantic
- onSemanticToProcedural

Phase 2 will add: onContradictionDetected (triggers BAR Clash)
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Callable

logger = logging.getLogger(__name__)


# Event signature type
MemoryNodeCallback = Callable[[dict], None]


class MemoryEventBus:
    """Simple in-memory event bus for memory node lifecycle events.

    Phase 1: All handlers run synchronously in-process.
    Phase 4 will add async processing and persistence.
    """

    def __init__(self):
        self._handlers: dict[str, list[MemoryNodeCallback]] = {
            "onMemoryNodeCaptured": [],
            "onMemoryNodeRetrieved": [],
            "onHighStabilityReached": [],
            "onProceduralCrystallization": [],
            "onWorkingToEpisodic": [],
            "onEpisodicToSemantic": [],
            "onSemanticToProcedural": [],
        }

    def register(self, event: str, handler: MemoryNodeCallback) -> None:
        """Register a handler for a memory event."""
        if event not in self._handlers:
            raise ValueError(f"Unknown event: {event}. Known: {list(self._handlers.keys())}")
        self._handlers[event].append(handler)

    def emit(self, event: str, payload: dict) -> None:
        """Emit a memory event to all registered handlers."""
        if event not in self._handlers:
            raise ValueError(f"Unknown event: {event}")
        for handler in self._handlers[event]:
            try:
                handler(payload)
            except Exception as e:
                logger.error(f"Error in {event} handler: {e}")

    # ─── Convenience emit methods ───────────────────────────────────────────

    def on_captured(self, node: dict) -> None:
        self.emit("onMemoryNodeCaptured", {"node": node, "timestamp": datetime.utcnow().isoformat()})

    def on_retrieved(self, node: dict, retrieval_count: int) -> None:
        self.emit("onMemoryNodeRetrieved", {
            "node": node,
            "retrieval_count": retrieval_count,
            "timestamp": datetime.utcnow().isoformat(),
        })

    def on_high_stability(self, node: dict, old_tier: str, new_tier: str) -> None:
        self.emit("onHighStabilityReached", {
            "node": node,
            "old_tier": old_tier,
            "new_tier": new_tier,
            "timestamp": datetime.utcnow().isoformat(),
        })

    def on_crystallized(self, node: dict, move_id: str) -> None:
        self.emit("onProceduralCrystallization", {
            "node": node,
            "move_id": move_id,
            "timestamp": datetime.utcnow().isoformat(),
        })

    def on_tier_transition(self, node: dict, from_tier: str, to_tier: str) -> None:
        event_map = {
            ("working", "episodic"): "onWorkingToEpisodic",
            ("episodic", "semantic"): "onEpisodicToSemantic",
            ("semantic", "procedural"): "onSemanticToProcedural",
        }
        event_name = event_map.get((from_tier, to_tier))
        if event_name:
            self.emit(event_name, {
                "node": node,
                "from_tier": from_tier,
                "to_tier": to_tier,
                "timestamp": datetime.utcnow().isoformat(),
            })


# Global event bus instance — imported by services
memory_events = MemoryEventBus()