"""Strand metadata schema — unified from Architect + Regent consultation + Sage deftness review."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class AuditEntry(BaseModel):
    """Single entry in audit_trail — records any sect event with provenance."""

    sect: str = Field(description="Sect ID that produced this entry")
    event: str = Field(description="Event type: before_advocacy | run | during_flag | after_retro | decision")
    actor: str | None = Field(default=None, description="Agent or user ID, if known")
    timestamp: str | None = Field(default=None, description="ISO timestamp")
    rationale: str | None = Field(default=None, description="Why this happened")
    data: dict[str, Any] | None = Field(default=None, description="Extra structured payload")


class StrandMetadata(BaseModel):
    """Unified strand-as-BAR schema (Architect + Regent + Sage deftness review)."""

    agent_sequence: list[str] = Field(
        default_factory=list,
        description="Ordered list of sect IDs that ran in the strand",
    )
    phase_temperature: float = Field(
        default=0.7,
        description="Narrative complexity / Kotter stage alignment",
    )
    output_thread_links: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Maps strand outputs to next phases and Kotter alignment",
    )
    audit_trail: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Chronological log of sect events: advocacy, decisions, retrospectives. "
                    "Each entry: { sect, event, actor?, timestamp, rationale?, data? }",
    )
    branch_reference: str | None = Field(
        default=None,
        description="Git branch ref when createBranch; marks decision-tree divergence",
    )
    thread_linkage: list[str] | None = Field(
        default=None,
        description="CustomBar quest IDs this strand connects to (nullable stub — define when Phase 4 player triggers land)",
    )
