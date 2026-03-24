"""Player & Identity core models: Invite, Player, Account, Role, PlayerRole, Bar, PlayerBar, BarShare, BarResponse."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, generate_cuid


class Invite(Base):
    __tablename__ = "invites"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    token: Mapped[str] = mapped_column(String, unique=True)
    status: Mapped[str] = mapped_column(String, default="active")
    preassigned_role_key: Mapped[str | None] = mapped_column("preassignedRoleKey", String, nullable=True, default=None)
    max_uses: Mapped[int] = mapped_column("maxUses", Integer, default=1)
    uses: Mapped[int] = mapped_column(Integer, default=0)
    theme: Mapped[str] = mapped_column(String, default="standard")
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    used_at: Mapped[datetime | None] = mapped_column("usedAt", DateTime, nullable=True, default=None)

    # Relationships
    players: Mapped[list[Player]] = relationship("Player", back_populates="invite")


class Player(Base):
    __tablename__ = "players"
    __table_args__ = (
        UniqueConstraint("contactType", "contactValue", name="uq_players_contact"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    account_id: Mapped[str | None] = mapped_column("accountId", String, ForeignKey("accounts.id"), nullable=True)
    name: Mapped[str] = mapped_column(String)
    contact_type: Mapped[str] = mapped_column("contactType", String)
    contact_value: Mapped[str] = mapped_column("contactValue", String)
    password_hash: Mapped[str | None] = mapped_column("passwordHash", String, nullable=True, default=None)
    onboarding_mode: Mapped[str | None] = mapped_column("onboardingMode", String, nullable=True, default="expert")
    onboarding_complete: Mapped[bool] = mapped_column("onboardingComplete", Boolean, default=False)
    story_progress: Mapped[str | None] = mapped_column("storyProgress", String, nullable=True, default=None)
    has_seen_welcome: Mapped[bool] = mapped_column("hasSeenWelcome", Boolean, default=False)
    has_seen_campaign_entry: Mapped[bool] = mapped_column("hasSeenCampaignEntry", Boolean, default=False)
    has_completed_first_quest: Mapped[bool] = mapped_column("hasCompletedFirstQuest", Boolean, default=False)
    has_created_first_quest: Mapped[bool] = mapped_column("hasCreatedFirstQuest", Boolean, default=False)
    onboarding_completed_at: Mapped[datetime | None] = mapped_column("onboardingCompletedAt", DateTime, nullable=True)
    invite_id: Mapped[str] = mapped_column("inviteId", String, ForeignKey("invites.id"))
    nation_id: Mapped[str | None] = mapped_column("nationId", String, ForeignKey("nations.id"), nullable=True)
    archetype_id: Mapped[str | None] = mapped_column("archetypeId", String, ForeignKey("archetypes.id"), nullable=True)
    campaign_domain_preference: Mapped[str | None] = mapped_column("campaignDomainPreference", String, nullable=True)
    avatar_config: Mapped[str | None] = mapped_column("avatarConfig", String, nullable=True, default=None)
    pronouns: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    attendance: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    # Relationships — same file
    account: Mapped[Account | None] = relationship("Account", back_populates="players")
    invite: Mapped[Invite] = relationship("Invite", back_populates="players")
    roles: Mapped[list[PlayerRole]] = relationship("PlayerRole", back_populates="player")
    bars: Mapped[list[PlayerBar]] = relationship("PlayerBar", back_populates="player")
    bar_shares_sent: Mapped[list[BarShare]] = relationship("BarShare", foreign_keys="[BarShare.from_user_id]", back_populates="from_user")
    bar_shares_received: Mapped[list[BarShare]] = relationship("BarShare", foreign_keys="[BarShare.to_user_id]", back_populates="to_user")
    bar_responses: Mapped[list[BarResponse]] = relationship("BarResponse", back_populates="responder")

    # Relationships — identity.py
    nation: Mapped[Nation | None] = relationship("Nation", back_populates="players")
    archetype: Mapped[Archetype | None] = relationship("Archetype", back_populates="players")
    starter_pack: Mapped[StarterPack | None] = relationship("StarterPack", back_populates="player", uselist=False)

    # Relationships — quest.py
    claimed_bars: Mapped[list[CustomBar]] = relationship("CustomBar", foreign_keys="[CustomBar.claimed_by_id]", back_populates="claimed_by")
    created_bars: Mapped[list[CustomBar]] = relationship("CustomBar", foreign_keys="[CustomBar.creator_id]", back_populates="creator")
    quests: Mapped[list[PlayerQuest]] = relationship("PlayerQuest", back_populates="player")
    quest_move_logs: Mapped[list[QuestMoveLog]] = relationship("QuestMoveLog", back_populates="player")
    quest_proposals: Mapped[list[QuestProposal]] = relationship("QuestProposal", back_populates="player")
    shadow_321_sessions: Mapped[list[Shadow321Session]] = relationship("Shadow321Session", back_populates="player")

    # Relationships — narrative.py
    twine_stories_created: Mapped[list[TwineStory]] = relationship("TwineStory", back_populates="created_by")
    twine_runs_played: Mapped[list[TwineRun]] = relationship("TwineRun", back_populates="player")
    twine_bindings_created: Mapped[list[TwineBinding]] = relationship("TwineBinding", back_populates="created_by")
    adventure_progress: Mapped[list[PlayerAdventureProgress]] = relationship("PlayerAdventureProgress", back_populates="player")

    # Relationships — economy.py
    donations: Mapped[list[Donation]] = relationship("Donation", back_populates="player")
    vibulons: Mapped[list[Vibulon]] = relationship("Vibulon", foreign_keys="[Vibulon.owner_id]", back_populates="owner")
    creator_vibulons: Mapped[list[Vibulon]] = relationship("Vibulon", foreign_keys="[Vibulon.creator_id]", back_populates="creator")
    vibulon_events: Mapped[list[VibulonEvent]] = relationship("VibulonEvent", back_populates="player")
    vibeulon_ledger: Mapped[list[VibeulonLedger]] = relationship("VibeulonLedger", back_populates="player")
    bounty_stakes: Mapped[list[BountyStake]] = relationship("BountyStake", back_populates="player")
    redemption_packs: Mapped[list[RedemptionPack]] = relationship("RedemptionPack", back_populates="player")

    # Relationships — game.py
    nation_move_unlocks: Mapped[list[PlayerNationMoveUnlock]] = relationship("PlayerNationMoveUnlock", back_populates="player")
    move_equips: Mapped[list[PlayerMoveEquip]] = relationship("PlayerMoveEquip", back_populates="player")
    move_uses: Mapped[list[MoveUse]] = relationship("MoveUse", back_populates="player")
    emotional_aid_sessions: Mapped[list[EmotionalFirstAidSession]] = relationship("EmotionalFirstAidSession", back_populates="player")

    # Relationships — campaign.py
    instance_memberships: Mapped[list[InstanceMembership]] = relationship("InstanceMembership", back_populates="player")
    participations: Mapped[list[InstanceParticipation]] = relationship("InstanceParticipation", back_populates="player")
    stewarded_slots: Mapped[list[GameboardSlot]] = relationship("GameboardSlot", back_populates="steward")
    gameboard_bids: Mapped[list[GameboardBid]] = relationship("GameboardBid", back_populates="bidder")
    gameboard_aid_offers_made: Mapped[list[GameboardAidOffer]] = relationship("GameboardAidOffer", foreign_keys="[GameboardAidOffer.offerer_id]", back_populates="offerer")
    gameboard_aid_offers_received: Mapped[list[GameboardAidOffer]] = relationship("GameboardAidOffer", foreign_keys="[GameboardAidOffer.steward_id]", back_populates="steward")
    event_artifacts_created: Mapped[list[EventArtifact]] = relationship("EventArtifact", back_populates="creator")
    event_participations: Mapped[list[EventParticipant]] = relationship("EventParticipant", back_populates="participant")
    event_invites_received: Mapped[list[EventInvite]] = relationship("EventInvite", foreign_keys="[EventInvite.actor_id]", back_populates="actor")
    event_invites_sent: Mapped[list[EventInvite]] = relationship("EventInvite", foreign_keys="[EventInvite.invited_by_actor_id]", back_populates="invited_by")

    # Relationships — knowledge.py
    library_requests: Mapped[list[LibraryRequest]] = relationship("LibraryRequest", back_populates="created_by")
    book_analysis_resume_logs: Mapped[list[BookAnalysisResumeLog]] = relationship("BookAnalysisResumeLog", back_populates="admin")
    verification_completion_logs: Mapped[list[VerificationCompletionLog]] = relationship("VerificationCompletionLog", back_populates="player")


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    email: Mapped[str] = mapped_column(String, unique=True)
    password_hash: Mapped[str | None] = mapped_column("passwordHash", String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    players: Mapped[list[Player]] = relationship("Player", back_populates="account")


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    key: Mapped[str] = mapped_column(String, unique=True)
    display_name: Mapped[str] = mapped_column("displayName", String)
    description: Mapped[str] = mapped_column(String)
    is_forecasted: Mapped[bool] = mapped_column("isForecasted", Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    players: Mapped[list[PlayerRole]] = relationship("PlayerRole", back_populates="role")


class PlayerRole(Base):
    __tablename__ = "player_roles"
    __table_args__ = (
        UniqueConstraint("playerId", "roleId", name="uq_player_roles_player_role"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    player_id: Mapped[str] = mapped_column("playerId", String, ForeignKey("players.id"))
    role_id: Mapped[str] = mapped_column("roleId", String, ForeignKey("roles.id"))
    granted_by_admin_id: Mapped[str | None] = mapped_column("grantedByAdminId", String, nullable=True, default=None)
    granted_at: Mapped[datetime] = mapped_column("grantedAt", DateTime, server_default=func.now())
    expires_at: Mapped[datetime | None] = mapped_column("expiresAt", DateTime, nullable=True, default=None)

    player: Mapped[Player] = relationship("Player", back_populates="roles")
    role: Mapped[Role] = relationship("Role", back_populates="players")


class Bar(Base):
    __tablename__ = "bars"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    tone: Mapped[str] = mapped_column(String)
    text: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    assigned_to: Mapped[list[PlayerBar]] = relationship("PlayerBar", back_populates="bar")


class PlayerBar(Base):
    __tablename__ = "player_bars"
    __table_args__ = (
        Index("ix_player_bars_player_source", "playerId", "source"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    player_id: Mapped[str] = mapped_column("playerId", String, ForeignKey("players.id"))
    bar_id: Mapped[int] = mapped_column("barId", Integer, ForeignKey("bars.id"))
    source: Mapped[str] = mapped_column(String)
    notes: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    acquired_at: Mapped[datetime] = mapped_column("acquiredAt", DateTime, server_default=func.now())

    bar: Mapped[Bar] = relationship("Bar", back_populates="assigned_to")
    player: Mapped[Player] = relationship("Player", back_populates="bars")


class BarShare(Base):
    __tablename__ = "bar_shares"
    __table_args__ = (
        Index("ix_bar_shares_from_created", "fromUserId", "createdAt"),
        Index("ix_bar_shares_to_created", "toUserId", "createdAt"),
        Index("ix_bar_shares_bar_created", "barId", "createdAt"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    bar_id: Mapped[str] = mapped_column("barId", String, ForeignKey("custom_bars.id", ondelete="CASCADE"))
    from_user_id: Mapped[str] = mapped_column("fromUserId", String, ForeignKey("players.id", ondelete="CASCADE"))
    to_user_id: Mapped[str] = mapped_column("toUserId", String, ForeignKey("players.id", ondelete="CASCADE"))
    note: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    bar: Mapped[CustomBar] = relationship("CustomBar", back_populates="shares")
    from_user: Mapped[Player] = relationship("Player", foreign_keys=[from_user_id], back_populates="bar_shares_sent")
    to_user: Mapped[Player] = relationship("Player", foreign_keys=[to_user_id], back_populates="bar_shares_received")


class BarResponse(Base):
    __tablename__ = "bar_responses"
    __table_args__ = (
        UniqueConstraint("barId", "responderId", name="uq_bar_responses_bar_responder"),
        Index("ix_bar_responses_bar", "barId"),
        Index("ix_bar_responses_responder", "responderId"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    bar_id: Mapped[str] = mapped_column("barId", String, ForeignKey("custom_bars.id", ondelete="CASCADE"))
    responder_id: Mapped[str] = mapped_column("responderId", String, ForeignKey("players.id", ondelete="CASCADE"))
    response_type: Mapped[str] = mapped_column("responseType", String)
    message: Mapped[str | None] = mapped_column(Text, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    bar: Mapped[CustomBar] = relationship("CustomBar", back_populates="responses")
    responder: Mapped[Player] = relationship("Player", back_populates="bar_responses")
