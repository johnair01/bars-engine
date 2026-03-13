"""System models: GlobalState, StoryTick, AppConfig, AuditLog, AdminAuditLog, SpecKitBacklogItem, AiResponseCache."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, ForeignKey, Index, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, generate_cuid


class GlobalState(Base):
    __tablename__ = "global_state"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    story_clock: Mapped[int] = mapped_column("storyClock", Integer, default=0)
    current_act: Mapped[int] = mapped_column("currentAct", Integer, default=1)
    current_period: Mapped[int] = mapped_column("currentPeriod", Integer, default=1)
    is_paused: Mapped[bool] = mapped_column("isPaused", Boolean, default=False)
    unlocked_tiers: Mapped[str] = mapped_column("unlockedTiers", String, default="[]")
    hexagram_sequence: Mapped[str] = mapped_column("hexagramSequence", String, default="[]")
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())


class StoryTick(Base):
    __tablename__ = "story_ticks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    tick_number: Mapped[int] = mapped_column("tickNumber", Integer)
    act_number: Mapped[int] = mapped_column("actNumber", Integer)
    trigger: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())


class AppConfig(Base):
    __tablename__ = "app_config"

    id: Mapped[str] = mapped_column(String, primary_key=True, default="singleton")
    features: Mapped[str] = mapped_column(String, default="{}")
    theme: Mapped[str] = mapped_column(String, default="{}")
    hero_title: Mapped[str | None] = mapped_column("heroTitle", String, nullable=True, default=None)
    hero_subtitle: Mapped[str | None] = mapped_column("heroSubtitle", String, nullable=True, default=None)
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())
    updated_by: Mapped[str | None] = mapped_column("updatedBy", String, nullable=True, default=None)
    active_instance_id: Mapped[str | None] = mapped_column("activeInstanceId", String, ForeignKey("instances.id"), nullable=True)
    orientation_quest_id: Mapped[str | None] = mapped_column("orientationQuestId", String, nullable=True, default=None)
    post_signup_redirect: Mapped[str | None] = mapped_column("postSignupRedirect", String, nullable=True, default=None)

    active_instance: Mapped[Instance | None] = relationship("Instance", back_populates="active_in_configs")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    actor_admin_id: Mapped[str] = mapped_column("actorAdminId", String)
    action: Mapped[str] = mapped_column(String)
    target_type: Mapped[str] = mapped_column("targetType", String)
    target_id: Mapped[str] = mapped_column("targetId", String)
    payload_json: Mapped[str | None] = mapped_column("payloadJson", String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_log"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    admin_id: Mapped[str] = mapped_column("adminId", String)
    action: Mapped[str] = mapped_column(String)
    target: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    payload: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())


class SpecKitBacklogItem(Base):
    __tablename__ = "spec_kit_backlog_items"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    priority: Mapped[float] = mapped_column(Float, default=0)
    feature_name: Mapped[str] = mapped_column("featureName", String)
    link: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    category: Mapped[str] = mapped_column(String, default="UI")
    status: Mapped[str] = mapped_column(String, default="Ready")
    dependencies: Mapped[str] = mapped_column(String, default="")
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())


class AiResponseCache(Base):
    __tablename__ = "ai_response_cache"
    __table_args__ = (
        UniqueConstraint("inputHash", "feature", name="uq_ai_response_cache_input_feature"),
        Index("ix_ai_response_cache_expires", "expiresAt"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    input_hash: Mapped[str] = mapped_column("inputHash", String)
    feature: Mapped[str] = mapped_column(String)
    model: Mapped[str] = mapped_column(String)
    output_json: Mapped[str] = mapped_column("outputJson", Text)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column("expiresAt", DateTime)
