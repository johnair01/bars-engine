"""Campaign models: Instance, InstanceMembership, InstanceParticipation, EventCampaign, EventArtifact, EventParticipant, EventInvite, CampaignPlaybook, CampaignInvitation."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, ForeignKey, Index, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, generate_cuid


class Instance(Base):
    __tablename__ = "instances"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    slug: Mapped[str] = mapped_column(String, unique=True)
    name: Mapped[str] = mapped_column(String)
    domain_type: Mapped[str] = mapped_column("domainType", String)
    theme: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    target_description: Mapped[str | None] = mapped_column("targetDescription", String, nullable=True, default=None)
    wake_up_content: Mapped[str | None] = mapped_column("wakeUpContent", String, nullable=True, default=None)
    show_up_content: Mapped[str | None] = mapped_column("showUpContent", String, nullable=True, default=None)
    story_bridge_copy: Mapped[str | None] = mapped_column("storyBridgeCopy", String, nullable=True, default=None)
    campaign_ref: Mapped[str | None] = mapped_column("campaignRef", String, nullable=True, default=None)
    goal_amount_cents: Mapped[int | None] = mapped_column("goalAmountCents", Integer, nullable=True, default=None)
    current_amount_cents: Mapped[int] = mapped_column("currentAmountCents", Integer, default=0)
    kotter_stage: Mapped[int] = mapped_column("kotterStage", Integer, default=1)
    is_event_mode: Mapped[bool] = mapped_column("isEventMode", Boolean, default=False)
    stripe_one_time_url: Mapped[str | None] = mapped_column("stripeOneTimeUrl", String, nullable=True, default=None)
    patreon_url: Mapped[str | None] = mapped_column("patreonUrl", String, nullable=True, default=None)
    venmo_url: Mapped[str | None] = mapped_column("venmoUrl", String, nullable=True, default=None)
    cashapp_url: Mapped[str | None] = mapped_column("cashappUrl", String, nullable=True, default=None)
    paypal_url: Mapped[str | None] = mapped_column("paypalUrl", String, nullable=True, default=None)
    donation_pack_rate_cents: Mapped[int | None] = mapped_column("donationPackRateCents", Integer, nullable=True, default=100)
    pack_config: Mapped[str | None] = mapped_column("packConfig", String, nullable=True, default=None)
    start_date: Mapped[datetime | None] = mapped_column("startDate", DateTime, nullable=True)
    end_date: Mapped[datetime | None] = mapped_column("endDate", DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    active_in_configs: Mapped[list[AppConfig]] = relationship("AppConfig", back_populates="active_instance")
    donations: Mapped[list[Donation]] = relationship("Donation", back_populates="instance")
    memberships: Mapped[list[InstanceMembership]] = relationship("InstanceMembership", back_populates="instance")
    participations: Mapped[list[InstanceParticipation]] = relationship("InstanceParticipation", back_populates="instance")
    redemption_packs: Mapped[list[RedemptionPack]] = relationship("RedemptionPack", back_populates="instance")
    library_requests: Mapped[list[LibraryRequest]] = relationship("LibraryRequest", back_populates="instance")
    gameboard_slots: Mapped[list[GameboardSlot]] = relationship("GameboardSlot", back_populates="instance")
    event_campaigns: Mapped[list[EventCampaign]] = relationship("EventCampaign", back_populates="instance")
    campaign_playbook: Mapped[CampaignPlaybook | None] = relationship("CampaignPlaybook", back_populates="instance", uselist=False)
    campaign_invitations: Mapped[list[CampaignInvitation]] = relationship("CampaignInvitation", back_populates="instance")
    bar_deck: Mapped[BarDeck | None] = relationship("BarDeck", back_populates="instance", uselist=False)


class InstanceMembership(Base):
    __tablename__ = "instance_memberships"
    __table_args__ = (
        UniqueConstraint("instanceId", "playerId", name="uq_instance_memberships"),
        Index("ix_instance_memberships_instance_created", "instanceId", "createdAt"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    instance_id: Mapped[str] = mapped_column("instanceId", String, ForeignKey("instances.id", ondelete="CASCADE"))
    player_id: Mapped[str] = mapped_column("playerId", String, ForeignKey("players.id", ondelete="CASCADE"))
    role_key: Mapped[str | None] = mapped_column("roleKey", String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    instance: Mapped[Instance] = relationship("Instance", back_populates="memberships")
    player: Mapped[Player] = relationship("Player", back_populates="instance_memberships")


class InstanceParticipation(Base):
    __tablename__ = "instance_participation"
    __table_args__ = (
        UniqueConstraint("playerId", "instanceId", name="uq_instance_participation"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    player_id: Mapped[str] = mapped_column("playerId", String, ForeignKey("players.id"))
    instance_id: Mapped[str] = mapped_column("instanceId", String, ForeignKey("instances.id"))
    local_balance: Mapped[int] = mapped_column("localBalance", Integer, default=0)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    player: Mapped[Player] = relationship("Player", back_populates="participations")
    instance: Mapped[Instance] = relationship("Instance", back_populates="participations")


class EventCampaign(Base):
    __tablename__ = "event_campaigns"
    __table_args__ = (
        Index("ix_event_campaigns_instance", "instanceId"),
        Index("ix_event_campaigns_status", "status"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    campaign_context: Mapped[str] = mapped_column("campaignContext", String)
    topic: Mapped[str] = mapped_column(String)
    primary_domain: Mapped[str] = mapped_column("primaryDomain", String)
    production_grammar: Mapped[str] = mapped_column("productionGrammar", String)
    campaign_type: Mapped[str] = mapped_column("campaignType", String, default="event_production")
    host_actor_ids: Mapped[str] = mapped_column("hostActorIds", String, default="[]")
    target_archetypes: Mapped[str] = mapped_column("targetArchetypes", String, default="[]")
    target_moves: Mapped[str] = mapped_column("targetMoves", String, default="[]")
    developmental_lens: Mapped[str | None] = mapped_column("developmentalLens", String, nullable=True, default=None)
    status: Mapped[str] = mapped_column(String, default="proposed")
    linked_event_ids: Mapped[str] = mapped_column("linkedEventIds", String, default="[]")
    instance_id: Mapped[str | None] = mapped_column("instanceId", String, ForeignKey("instances.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    instance: Mapped[Instance | None] = relationship("Instance", back_populates="event_campaigns")
    production_thread: Mapped[QuestThread | None] = relationship("QuestThread", back_populates="event_campaign", uselist=False)
    events: Mapped[list[EventArtifact]] = relationship("EventArtifact", back_populates="campaign")


class EventArtifact(Base):
    __tablename__ = "event_artifacts"
    __table_args__ = (
        Index("ix_event_artifacts_campaign", "linkedCampaignId"),
        Index("ix_event_artifacts_status", "status"),
        Index("ix_event_artifacts_start_time", "startTime"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    linked_campaign_id: Mapped[str] = mapped_column("linkedCampaignId", String, ForeignKey("event_campaigns.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text)
    event_type: Mapped[str] = mapped_column("eventType", String)
    topic: Mapped[str] = mapped_column(String)
    campaign_context: Mapped[str] = mapped_column("campaignContext", String)
    primary_domain: Mapped[str] = mapped_column("primaryDomain", String)
    secondary_domain: Mapped[str | None] = mapped_column("secondaryDomain", String, nullable=True, default=None)
    target_archetypes: Mapped[str] = mapped_column("targetArchetypes", String, default="[]")
    target_moves: Mapped[str] = mapped_column("targetMoves", String, default="[]")
    developmental_lens: Mapped[str | None] = mapped_column("developmentalLens", String, nullable=True, default=None)
    location_type: Mapped[str] = mapped_column("locationType", String)
    location_details: Mapped[str | None] = mapped_column("locationDetails", String, nullable=True, default=None)
    start_time: Mapped[datetime | None] = mapped_column("startTime", DateTime, nullable=True)
    end_time: Mapped[datetime | None] = mapped_column("endTime", DateTime, nullable=True)
    timezone: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    visibility: Mapped[str] = mapped_column(String, default="campaign_visible")
    status: Mapped[str] = mapped_column(String, default="draft")
    recording_url: Mapped[str | None] = mapped_column("recordingUrl", String, nullable=True, default=None)
    created_by_actor_id: Mapped[str] = mapped_column("createdByActorId", String, ForeignKey("players.id"))
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    campaign: Mapped[EventCampaign] = relationship("EventCampaign", back_populates="events")
    creator: Mapped[Player] = relationship("Player", back_populates="event_artifacts_created")
    invites: Mapped[list[EventInvite]] = relationship("EventInvite", back_populates="event")
    participants: Mapped[list[EventParticipant]] = relationship("EventParticipant", back_populates="event")


class EventParticipant(Base):
    __tablename__ = "event_participants"
    __table_args__ = (
        UniqueConstraint("eventId", "participantId", name="uq_event_participants"),
        Index("ix_event_participants_participant", "participantId"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    event_id: Mapped[str] = mapped_column("eventId", String, ForeignKey("event_artifacts.id", ondelete="CASCADE"))
    participant_id: Mapped[str] = mapped_column("participantId", String, ForeignKey("players.id", ondelete="CASCADE"))
    participant_state: Mapped[str] = mapped_column("participantState", String)
    functional_role: Mapped[str | None] = mapped_column("functionalRole", String, nullable=True, default=None)
    raci_role: Mapped[str | None] = mapped_column("raciRole", String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    event: Mapped[EventArtifact] = relationship("EventArtifact", back_populates="participants")
    participant: Mapped[Player] = relationship("Player", back_populates="event_participations")


class EventInvite(Base):
    __tablename__ = "event_invites"
    __table_args__ = (
        UniqueConstraint("eventId", "actorId", name="uq_event_invites"),
        Index("ix_event_invites_actor", "actorId"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    event_id: Mapped[str] = mapped_column("eventId", String, ForeignKey("event_artifacts.id", ondelete="CASCADE"))
    actor_id: Mapped[str] = mapped_column("actorId", String, ForeignKey("players.id", ondelete="CASCADE"))
    invited_by_actor_id: Mapped[str] = mapped_column("invitedByActorId", String, ForeignKey("players.id", ondelete="CASCADE"))
    invite_status: Mapped[str] = mapped_column("inviteStatus", String, default="pending")
    invite_source: Mapped[str | None] = mapped_column("inviteSource", String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    event: Mapped[EventArtifact] = relationship("EventArtifact", back_populates="invites")
    actor: Mapped[Player] = relationship("Player", foreign_keys=[actor_id], back_populates="event_invites_received")
    invited_by: Mapped[Player] = relationship("Player", foreign_keys=[invited_by_actor_id], back_populates="event_invites_sent")


class CampaignPlaybook(Base):
    __tablename__ = "campaign_playbooks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    instance_id: Mapped[str] = mapped_column("instanceId", String, ForeignKey("instances.id", ondelete="CASCADE"), unique=True)
    origin: Mapped[str] = mapped_column(String, default="")
    vision: Mapped[str] = mapped_column(String, default="")
    people: Mapped[str] = mapped_column(String, default="")
    invitations: Mapped[str] = mapped_column(String, default="")
    timeline: Mapped[str] = mapped_column(String, default="")
    kotter_stages: Mapped[dict] = mapped_column("kotterStages", JSONB, default={})
    domain_strategy: Mapped[dict] = mapped_column("domainStrategy", JSONB, default={})
    raci_roles: Mapped[str] = mapped_column("raciRoles", String, default="")
    recent_updates: Mapped[str] = mapped_column("recentUpdates", String, default="")
    generated_summary: Mapped[str] = mapped_column("generatedSummary", String, default="")
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    instance: Mapped[Instance] = relationship("Instance", back_populates="campaign_playbook")


class CampaignInvitation(Base):
    __tablename__ = "campaign_invitations"
    __table_args__ = (
        Index("ix_campaign_invitations_instance", "instanceId"),
        Index("ix_campaign_invitations_target", "targetActorId"),
        Index("ix_campaign_invitations_status", "status"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    instance_id: Mapped[str] = mapped_column("instanceId", String, ForeignKey("instances.id", ondelete="CASCADE"))
    target_actor_id: Mapped[str] = mapped_column("targetActorId", String)
    invited_role: Mapped[str] = mapped_column("invitedRole", String)
    accepted_role: Mapped[str | None] = mapped_column("acceptedRole", String, nullable=True, default=None)
    invitation_type: Mapped[str] = mapped_column("invitationType", String)
    message_text: Mapped[str] = mapped_column("messageText", Text)
    status: Mapped[str] = mapped_column(String, default="draft")
    created_by_actor_id: Mapped[str] = mapped_column("createdByActorId", String)
    sent_at: Mapped[datetime | None] = mapped_column("sentAt", DateTime, nullable=True)
    responded_at: Mapped[datetime | None] = mapped_column("respondedAt", DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    instance: Mapped[Instance] = relationship("Instance", back_populates="campaign_invitations")
