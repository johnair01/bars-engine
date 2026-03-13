"""Narrative models: TwineStory, CompiledTweeVersion, TwineRun, TwineBinding, MicroTwineModule, Adventure, Passage, PlayerAdventureProgress."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, ForeignKey, Index, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, generate_cuid


class TwineStory(Base):
    __tablename__ = "twine_stories"
    __table_args__ = (
        Index("ix_twine_stories_creator_created", "createdById", "createdAt"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    title: Mapped[str] = mapped_column(String)
    slug: Mapped[str | None] = mapped_column(String, unique=True, nullable=True, default=None)
    source_type: Mapped[str] = mapped_column("sourceType", String, default="twine_html")
    source_text: Mapped[str] = mapped_column("sourceText", String)
    parsed_json: Mapped[str] = mapped_column("parsedJson", String, default="{}")
    ir_draft: Mapped[str | None] = mapped_column("irDraft", String, nullable=True, default=None)
    is_published: Mapped[bool] = mapped_column("isPublished", Boolean, default=False)
    is_template: Mapped[bool] = mapped_column("isTemplate", Boolean, default=False)
    created_by_id: Mapped[str] = mapped_column("createdById", String, ForeignKey("players.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    quests: Mapped[list[CustomBar]] = relationship("CustomBar", back_populates="twine_story")
    bindings: Mapped[list[TwineBinding]] = relationship("TwineBinding", back_populates="story")
    runs: Mapped[list[TwineRun]] = relationship("TwineRun", back_populates="story")
    compiled_versions: Mapped[list[CompiledTweeVersion]] = relationship("CompiledTweeVersion", back_populates="story")
    created_by: Mapped[Player] = relationship("Player", back_populates="twine_stories_created")


class CompiledTweeVersion(Base):
    __tablename__ = "compiled_twee_versions"
    __table_args__ = (
        Index("ix_compiled_twee_story_created", "storyId", "createdAt"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    story_id: Mapped[str] = mapped_column("storyId", String, ForeignKey("twine_stories.id", ondelete="CASCADE"))
    twee_content: Mapped[str] = mapped_column("tweeContent", String)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    created_by_id: Mapped[str | None] = mapped_column("createdById", String, nullable=True, default=None)

    story: Mapped[TwineStory] = relationship("TwineStory", back_populates="compiled_versions")


class TwineRun(Base):
    __tablename__ = "twine_runs"
    __table_args__ = (
        UniqueConstraint("storyId", "playerId", "questId", name="uq_twine_runs_story_player_quest"),
        Index("ix_twine_runs_player_updated", "playerId", "updatedAt"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    story_id: Mapped[str] = mapped_column("storyId", String, ForeignKey("twine_stories.id", ondelete="CASCADE"))
    player_id: Mapped[str] = mapped_column("playerId", String, ForeignKey("players.id", ondelete="CASCADE"))
    quest_id: Mapped[str | None] = mapped_column("questId", String, nullable=True, default=None)
    current_passage_id: Mapped[str] = mapped_column("currentPassageId", String)
    visited: Mapped[str] = mapped_column(String, default="[]")
    fired_bindings: Mapped[str] = mapped_column("firedBindings", String, default="[]")
    diagnostic_state: Mapped[str | None] = mapped_column("diagnosticState", String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())
    completed_at: Mapped[datetime | None] = mapped_column("completedAt", DateTime, nullable=True)

    player: Mapped[Player] = relationship("Player", back_populates="twine_runs_played")
    story: Mapped[TwineStory] = relationship("TwineStory", back_populates="runs")


class TwineBinding(Base):
    __tablename__ = "twine_bindings"
    __table_args__ = (
        Index("ix_twine_bindings_story_scope", "storyId", "scopeType", "scopeId"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    story_id: Mapped[str] = mapped_column("storyId", String, ForeignKey("twine_stories.id", ondelete="CASCADE"))
    scope_type: Mapped[str] = mapped_column("scopeType", String)
    scope_id: Mapped[str] = mapped_column("scopeId", String)
    action_type: Mapped[str] = mapped_column("actionType", String)
    payload: Mapped[str] = mapped_column(String)
    created_by_id: Mapped[str] = mapped_column("createdById", String, ForeignKey("players.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    created_by: Mapped[Player] = relationship("Player", back_populates="twine_bindings_created")
    story: Mapped[TwineStory] = relationship("TwineStory", back_populates="bindings")


class MicroTwineModule(Base):
    __tablename__ = "micro_twine_modules"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    quest_id: Mapped[str] = mapped_column("questId", String, ForeignKey("custom_bars.id", ondelete="CASCADE"), unique=True)
    canonical_json: Mapped[str] = mapped_column("canonicalJson", String)
    twee_source: Mapped[str] = mapped_column("tweeSource", String)
    html_artifact: Mapped[str | None] = mapped_column("htmlArtifact", String, nullable=True, default=None)
    is_draft: Mapped[bool] = mapped_column("isDraft", Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    quest: Mapped[CustomBar] = relationship("CustomBar", back_populates="micro_twine")


class Adventure(Base):
    __tablename__ = "adventures"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    slug: Mapped[str] = mapped_column(String, unique=True)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    status: Mapped[str] = mapped_column(String, default="DRAFT")
    visibility: Mapped[str] = mapped_column(String, default="PUBLIC_ONBOARDING")
    start_node_id: Mapped[str | None] = mapped_column("startNodeId", String, nullable=True, default=None)
    campaign_ref: Mapped[str | None] = mapped_column("campaignRef", String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    passages: Mapped[list[Passage]] = relationship("Passage", back_populates="adventure")
    progress: Mapped[list[PlayerAdventureProgress]] = relationship("PlayerAdventureProgress", back_populates="adventure")
    quest_thread: Mapped[QuestThread | None] = relationship("QuestThread", back_populates="adventure", uselist=False)


class Passage(Base):
    __tablename__ = "passages"
    __table_args__ = (
        UniqueConstraint("adventureId", "nodeId", name="uq_passages_adventure_node"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    adventure_id: Mapped[str] = mapped_column("adventureId", String, ForeignKey("adventures.id", ondelete="CASCADE"))
    node_id: Mapped[str] = mapped_column("nodeId", String)
    text: Mapped[str] = mapped_column(String)
    choices: Mapped[str] = mapped_column(String, default="[]")
    linked_quest_id: Mapped[str | None] = mapped_column("linkedQuestId", String, ForeignKey("custom_bars.id", ondelete="SET NULL"), nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    adventure: Mapped[Adventure] = relationship("Adventure", back_populates="passages")
    linked_quest: Mapped[CustomBar | None] = relationship("CustomBar", back_populates="linked_passages")


class PlayerAdventureProgress(Base):
    __tablename__ = "player_adventure_progress"
    __table_args__ = (
        UniqueConstraint("playerId", "adventureId", name="uq_player_adventure_progress"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    player_id: Mapped[str] = mapped_column("playerId", String, ForeignKey("players.id", ondelete="CASCADE"))
    adventure_id: Mapped[str] = mapped_column("adventureId", String, ForeignKey("adventures.id", ondelete="CASCADE"))
    current_node_id: Mapped[str | None] = mapped_column("currentNodeId", String, nullable=True, default=None)
    state_data: Mapped[str] = mapped_column("stateData", String, default="{}")
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    player: Mapped[Player] = relationship("Player", back_populates="adventure_progress")
    adventure: Mapped[Adventure] = relationship("Adventure", back_populates="progress")
