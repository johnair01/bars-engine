"""Knowledge models: LibraryRequest, DocNode, DocEvidenceLink, BacklogItem, Schism, Book, BookAnalysisResumeLog, VerificationCompletionLog."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, generate_cuid


class Book(Base):
    __tablename__ = "books"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    title: Mapped[str] = mapped_column(String)
    author: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    slug: Mapped[str] = mapped_column(String, unique=True)
    source_pdf_url: Mapped[str | None] = mapped_column("sourcePdfUrl", String, nullable=True, default=None)
    extracted_text: Mapped[str | None] = mapped_column("extractedText", Text, nullable=True, default=None)
    status: Mapped[str] = mapped_column(String, default="draft")
    metadata_json: Mapped[str | None] = mapped_column("metadataJson", String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    thread: Mapped[QuestThread | None] = relationship("QuestThread", back_populates="book", uselist=False)
    book_analysis_resume_logs: Mapped[list[BookAnalysisResumeLog]] = relationship("BookAnalysisResumeLog", back_populates="book")


class BookAnalysisResumeLog(Base):
    __tablename__ = "book_analysis_resume_logs"
    __table_args__ = (
        Index("ix_book_analysis_resume_logs_admin_created", "adminId", "createdAt"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    admin_id: Mapped[str] = mapped_column("adminId", String, ForeignKey("players.id"))
    book_id: Mapped[str] = mapped_column("bookId", String, ForeignKey("books.id"))
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    admin: Mapped[Player] = relationship("Player", back_populates="book_analysis_resume_logs")
    book: Mapped[Book] = relationship("Book", back_populates="book_analysis_resume_logs")


class VerificationCompletionLog(Base):
    __tablename__ = "verification_completion_logs"
    __table_args__ = (
        Index("ix_verification_completion_logs_synced", "syncedAt"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    quest_id: Mapped[str] = mapped_column("questId", String)
    player_id: Mapped[str] = mapped_column("playerId", String, ForeignKey("players.id"))
    backlog_prompt_path: Mapped[str] = mapped_column("backlogPromptPath", String)
    completed_at: Mapped[datetime] = mapped_column("completedAt", DateTime, server_default=func.now())
    synced_at: Mapped[datetime | None] = mapped_column("syncedAt", DateTime, nullable=True)

    player: Mapped[Player] = relationship("Player", back_populates="verification_completion_logs")


class LibraryRequest(Base):
    __tablename__ = "library_requests"
    __table_args__ = (
        Index("ix_library_requests_status_created", "status", "createdAt"),
        Index("ix_library_requests_instance_created", "instanceId", "createdAt"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    created_by_id: Mapped[str] = mapped_column("createdById", String, ForeignKey("players.id", ondelete="CASCADE"))
    instance_id: Mapped[str | None] = mapped_column("instanceId", String, ForeignKey("instances.id", ondelete="SET NULL"), nullable=True)
    request_text: Mapped[str] = mapped_column("requestText", String)
    request_type: Mapped[str] = mapped_column("requestType", String, default="other")
    privacy: Mapped[str] = mapped_column(String, default="anonymized")
    context_json: Mapped[str | None] = mapped_column("contextJson", String, nullable=True, default=None)
    status: Mapped[str] = mapped_column(String, default="new")
    resolved_doc_node_id: Mapped[str | None] = mapped_column("resolvedDocNodeId", String, ForeignKey("doc_nodes.id", ondelete="SET NULL"), nullable=True)
    spawned_backlog_item_id: Mapped[str | None] = mapped_column("spawnedBacklogItemId", String, ForeignKey("backlog_items.id", ondelete="SET NULL"), unique=True, nullable=True)
    spawned_doc_quest_id: Mapped[str | None] = mapped_column("spawnedDocQuestId", String, ForeignKey("custom_bars.id", ondelete="SET NULL"), unique=True, nullable=True)

    created_by: Mapped[Player] = relationship("Player", back_populates="library_requests")
    instance: Mapped[Instance | None] = relationship("Instance", back_populates="library_requests")
    resolved_doc_node: Mapped[DocNode | None] = relationship("DocNode", back_populates="resolved_requests")
    spawned_backlog_item: Mapped[BacklogItem | None] = relationship("BacklogItem", back_populates="source_library_request")
    spawned_doc_quest: Mapped[CustomBar | None] = relationship("CustomBar", back_populates="library_requests_spawned")


class DocNode(Base):
    __tablename__ = "doc_nodes"
    __table_args__ = (
        Index("ix_doc_nodes_canonical_scope", "canonicalStatus", "scope"),
        Index("ix_doc_nodes_slug", "slug"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())
    node_type: Mapped[str] = mapped_column("nodeType", String, default="handbook")
    title: Mapped[str] = mapped_column(String)
    slug: Mapped[str] = mapped_column(String, unique=True)
    scope: Mapped[str] = mapped_column(String, default="experimental")
    version_min: Mapped[str | None] = mapped_column("versionMin", String, nullable=True, default=None)
    version_max: Mapped[str | None] = mapped_column("versionMax", String, nullable=True, default=None)
    build_hash: Mapped[str | None] = mapped_column("buildHash", String, nullable=True, default=None)
    tags: Mapped[str] = mapped_column(String, default="[]")
    body_rst: Mapped[str | None] = mapped_column("bodyRst", Text, nullable=True, default=None)
    body_source: Mapped[str] = mapped_column("bodySource", String, default="curated")
    canonical_status: Mapped[str] = mapped_column("canonicalStatus", String, default="draft")
    merged_into_doc_node_id: Mapped[str | None] = mapped_column("mergedIntoDocNodeId", String, ForeignKey("doc_nodes.id", ondelete="SET NULL"), nullable=True)
    provenance_json: Mapped[str | None] = mapped_column("provenanceJson", String, nullable=True, default=None)

    # Self-referential merge relationship
    merged_into: Mapped[DocNode | None] = relationship("DocNode", remote_side="DocNode.id", foreign_keys=[merged_into_doc_node_id], back_populates="merged_from")
    merged_from: Mapped[list[DocNode]] = relationship("DocNode", foreign_keys=[merged_into_doc_node_id], back_populates="merged_into")
    resolved_requests: Mapped[list[LibraryRequest]] = relationship("LibraryRequest", back_populates="resolved_doc_node")
    evidence_links: Mapped[list[DocEvidenceLink]] = relationship("DocEvidenceLink", back_populates="doc_node")


class DocEvidenceLink(Base):
    __tablename__ = "doc_evidence_links"
    __table_args__ = (
        Index("ix_doc_evidence_links_doc_node", "docNodeId"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    doc_node_id: Mapped[str] = mapped_column("docNodeId", String, ForeignKey("doc_nodes.id", ondelete="CASCADE"))
    custom_bar_id: Mapped[str | None] = mapped_column("customBarId", String, nullable=True, default=None)
    quest_id: Mapped[str | None] = mapped_column("questId", String, nullable=True, default=None)
    player_quest_id: Mapped[str | None] = mapped_column("playerQuestId", String, nullable=True, default=None)
    kind: Mapped[str] = mapped_column(String, default="observation")
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True, default=None)

    doc_node: Mapped[DocNode] = relationship("DocNode", back_populates="evidence_links")


class BacklogItem(Base):
    __tablename__ = "backlog_items"
    __table_args__ = (
        Index("ix_backlog_items_status", "status"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String, default="medium")
    area: Mapped[str] = mapped_column(String, default="other")
    status: Mapped[str] = mapped_column(String, default="new")
    linked_doc_node_id: Mapped[str | None] = mapped_column("linkedDocNodeId", String, nullable=True, default=None)
    linked_doc_quest_id: Mapped[str | None] = mapped_column("linkedDocQuestId", String, nullable=True, default=None)

    source_library_request: Mapped[LibraryRequest | None] = relationship("LibraryRequest", back_populates="spawned_backlog_item", uselist=False)


class Schism(Base):
    __tablename__ = "schisms"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    domain: Mapped[str] = mapped_column(String, default="other")
    status: Mapped[str] = mapped_column(String, default="open")
    conflicting_doc_node_ids: Mapped[str] = mapped_column("conflictingDocNodeIds", String, default="[]")
    conflicting_claims_json: Mapped[str | None] = mapped_column("conflictingClaimsJson", String, nullable=True, default=None)
    evidence_bundle_json: Mapped[str | None] = mapped_column("evidenceBundleJson", String, nullable=True, default=None)
    resolution_doc_node_id: Mapped[str | None] = mapped_column("resolutionDocNodeId", String, nullable=True, default=None)


class HexagramEncounterLog(Base):
    __tablename__ = "hexagram_encounter_logs"
    __table_args__ = (
        Index("ix_hexagram_encounter_logs_agent_hex", "agentName", "hexagramId"),
        Index("ix_hexagram_encounter_logs_agent_created", "agentName", "createdAt"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    agent_name: Mapped[str] = mapped_column("agentName", String)
    hexagram_id: Mapped[int] = mapped_column("hexagramId", Integer)
    upper_trigram: Mapped[str] = mapped_column("upperTrigram", String)
    lower_trigram: Mapped[str] = mapped_column("lowerTrigram", String)
    is_home_trigram: Mapped[bool] = mapped_column("isHomeTrigram", Boolean, default=False)
    trigram_position: Mapped[str] = mapped_column("trigramPosition", String, default="neither")
    interpretation_summary: Mapped[str | None] = mapped_column("interpretationSummary", Text, nullable=True, default=None)
    archetypes_involved: Mapped[str] = mapped_column("archetypesInvolved", String, default="[]")
    quest_outcome: Mapped[str | None] = mapped_column("questOutcome", String, nullable=True, default=None)
    emotional_alchemy_tag: Mapped[str | None] = mapped_column("emotionalAlchemyTag", String, nullable=True, default=None)
    quest_id: Mapped[str | None] = mapped_column("questId", String, nullable=True, default=None)
    player_id: Mapped[str | None] = mapped_column("playerId", String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())


class AgentInterpretiveProfile(Base):
    __tablename__ = "agent_interpretive_profiles"
    __table_args__ = (
        UniqueConstraint("agentName", "hexagramId", name="uq_agent_interpretive_profiles_agent_hex"),
        Index("ix_agent_interpretive_profiles_agent", "agentName"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    agent_name: Mapped[str] = mapped_column("agentName", String)
    hexagram_id: Mapped[int | None] = mapped_column("hexagramId", Integer, nullable=True, default=None)
    profile_text: Mapped[str] = mapped_column("profileText", Text)
    encounter_count: Mapped[int] = mapped_column("encounterCount", Integer, default=0)
    last_synthesized_at: Mapped[datetime] = mapped_column("lastSynthesizedAt", DateTime, server_default=func.now())
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())
