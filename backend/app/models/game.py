"""Game models: NationMove, PlayerNationMoveUnlock, PlayerMoveEquip, MoveUse, EmotionalFirstAidTool, EmotionalFirstAidSession, GameboardSlot, GameboardBid, GameboardAidOffer."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, ForeignKey, Index, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, generate_cuid


class NationMove(Base):
    __tablename__ = "nation_moves"
    __table_args__ = (
        Index("ix_nation_moves_nation_sort", "nationId", "sortOrder"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    key: Mapped[str] = mapped_column(String, unique=True)
    nation_id: Mapped[str] = mapped_column("nationId", String, ForeignKey("nations.id", ondelete="CASCADE"))
    archetype_id: Mapped[str | None] = mapped_column("archetypeId", String, ForeignKey("archetypes.id", ondelete="SET NULL"), nullable=True)
    polarity_id: Mapped[str | None] = mapped_column("polarityId", String, ForeignKey("polarities.id"), nullable=True)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String)
    is_starting_unlocked: Mapped[bool] = mapped_column("isStartingUnlocked", Boolean, default=False)
    uses_per_period: Mapped[int] = mapped_column("usesPerPeriod", Integer, default=2)
    applies_to_status: Mapped[str] = mapped_column("appliesToStatus", String, default="[]")
    requirements_schema: Mapped[str] = mapped_column("requirementsSchema", String, default="{}")
    effects_schema: Mapped[str] = mapped_column("effectsSchema", String, default="{}")
    sort_order: Mapped[int] = mapped_column("sortOrder", Integer, default=0)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    nation: Mapped[Nation] = relationship("Nation", back_populates="moves")
    archetype: Mapped[Archetype | None] = relationship("Archetype", back_populates="nation_moves")
    polarity: Mapped[Polarity | None] = relationship("Polarity", back_populates="moves")
    unlocks: Mapped[list[PlayerNationMoveUnlock]] = relationship("PlayerNationMoveUnlock", back_populates="move")
    logs: Mapped[list[QuestMoveLog]] = relationship("QuestMoveLog", back_populates="move")
    equip_slots: Mapped[list[PlayerMoveEquip]] = relationship("PlayerMoveEquip", back_populates="move")
    uses: Mapped[list[MoveUse]] = relationship("MoveUse", back_populates="move")


class PlayerNationMoveUnlock(Base):
    __tablename__ = "player_nation_move_unlocks"
    __table_args__ = (
        UniqueConstraint("playerId", "moveId", name="uq_player_nation_move_unlocks"),
        Index("ix_player_nation_move_unlocks_move_unlocked", "moveId", "unlockedAt"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    player_id: Mapped[str] = mapped_column("playerId", String, ForeignKey("players.id", ondelete="CASCADE"))
    move_id: Mapped[str] = mapped_column("moveId", String, ForeignKey("nation_moves.id", ondelete="CASCADE"))
    unlocked_at: Mapped[datetime] = mapped_column("unlockedAt", DateTime, server_default=func.now())

    move: Mapped[NationMove] = relationship("NationMove", back_populates="unlocks")
    player: Mapped[Player] = relationship("Player", back_populates="nation_move_unlocks")


class PlayerMoveEquip(Base):
    __tablename__ = "player_move_equips"
    __table_args__ = (
        UniqueConstraint("playerId", "slotIndex", name="uq_player_move_equips_slot"),
        UniqueConstraint("playerId", "moveId", name="uq_player_move_equips_move"),
        Index("ix_player_move_equips_player", "playerId"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    player_id: Mapped[str] = mapped_column("playerId", String, ForeignKey("players.id", ondelete="CASCADE"))
    slot_index: Mapped[int] = mapped_column("slotIndex", Integer)
    move_id: Mapped[str] = mapped_column("moveId", String, ForeignKey("nation_moves.id", ondelete="CASCADE"))
    equipped_at: Mapped[datetime] = mapped_column("equippedAt", DateTime, server_default=func.now())

    move: Mapped[NationMove] = relationship("NationMove", back_populates="equip_slots")
    player: Mapped[Player] = relationship("Player", back_populates="move_equips")


class MoveUse(Base):
    __tablename__ = "move_uses"
    __table_args__ = (
        Index("ix_move_uses_player_move_period", "playerId", "moveId", "periodKey"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    player_id: Mapped[str] = mapped_column("playerId", String, ForeignKey("players.id", ondelete="CASCADE"))
    move_id: Mapped[str] = mapped_column("moveId", String, ForeignKey("nation_moves.id", ondelete="CASCADE"))
    period_key: Mapped[str] = mapped_column("periodKey", String)
    used_at: Mapped[datetime] = mapped_column("usedAt", DateTime, server_default=func.now())
    quest_id: Mapped[str | None] = mapped_column("questId", String, nullable=True, default=None)

    move: Mapped[NationMove] = relationship("NationMove", back_populates="uses")
    player: Mapped[Player] = relationship("Player", back_populates="move_uses")


class EmotionalFirstAidTool(Base):
    __tablename__ = "emotional_first_aid_tools"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    key: Mapped[str] = mapped_column(String, unique=True)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String)
    icon: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    move_type: Mapped[str] = mapped_column("moveType", String, default="cleanUp")
    tags: Mapped[str] = mapped_column(String, default="[]")
    twine_logic: Mapped[str] = mapped_column("twineLogic", String)
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=True)
    sort_order: Mapped[int] = mapped_column("sortOrder", Integer, default=0)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    sessions: Mapped[list[EmotionalFirstAidSession]] = relationship("EmotionalFirstAidSession", back_populates="tool")


class EmotionalFirstAidSession(Base):
    __tablename__ = "emotional_first_aid_sessions"
    __table_args__ = (
        Index("ix_efa_sessions_player_created", "playerId", "createdAt"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    player_id: Mapped[str] = mapped_column("playerId", String, ForeignKey("players.id"))
    tool_id: Mapped[str | None] = mapped_column("toolId", String, ForeignKey("emotional_first_aid_tools.id"), nullable=True)
    context_quest_id: Mapped[str | None] = mapped_column("contextQuestId", String, nullable=True, default=None)
    issue_tag: Mapped[str | None] = mapped_column("issueTag", String, nullable=True, default=None)
    issue_text: Mapped[str | None] = mapped_column("issueText", String, nullable=True, default=None)
    stuck_before: Mapped[int] = mapped_column("stuckBefore", Integer)
    stuck_after: Mapped[int | None] = mapped_column("stuckAfter", Integer, nullable=True, default=None)
    delta: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)
    recommended_tool_key: Mapped[str | None] = mapped_column("recommendedToolKey", String, nullable=True, default=None)
    minted_amount: Mapped[int] = mapped_column("mintedAmount", Integer, default=0)
    apply_to_questing: Mapped[bool] = mapped_column("applyToQuesting", Boolean, default=False)
    twine_snapshot: Mapped[str | None] = mapped_column("twineSnapshot", String, nullable=True, default=None)
    notes: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column("completedAt", DateTime, nullable=True)

    player: Mapped[Player] = relationship("Player", back_populates="emotional_aid_sessions")
    tool: Mapped[EmotionalFirstAidTool | None] = relationship("EmotionalFirstAidTool", back_populates="sessions")


class GameboardSlot(Base):
    __tablename__ = "gameboard_slots"
    __table_args__ = (
        UniqueConstraint("instanceId", "campaignRef", "period", "slotIndex", name="uq_gameboard_slots"),
        Index("ix_gameboard_slots_instance_campaign_period", "instanceId", "campaignRef", "period"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    instance_id: Mapped[str] = mapped_column("instanceId", String, ForeignKey("instances.id", ondelete="CASCADE"))
    campaign_ref: Mapped[str] = mapped_column("campaignRef", String)
    period: Mapped[int] = mapped_column(Integer)
    slot_index: Mapped[int] = mapped_column("slotIndex", Integer)
    quest_id: Mapped[str | None] = mapped_column("questId", String, ForeignKey("custom_bars.id", ondelete="SET NULL"), nullable=True)
    drawn_at: Mapped[datetime | None] = mapped_column("drawnAt", DateTime, nullable=True)
    steward_id: Mapped[str | None] = mapped_column("stewardId", String, ForeignKey("players.id", ondelete="SET NULL"), nullable=True)
    wake_up_at: Mapped[datetime | None] = mapped_column("wakeUpAt", DateTime, nullable=True)
    clean_up_at: Mapped[datetime | None] = mapped_column("cleanUpAt", DateTime, nullable=True)
    clean_up_reflection: Mapped[str | None] = mapped_column("cleanUpReflection", String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    instance: Mapped[Instance] = relationship("Instance", back_populates="gameboard_slots")
    quest: Mapped[CustomBar | None] = relationship("CustomBar", back_populates="gameboard_slots")
    steward: Mapped[Player | None] = relationship("Player", back_populates="stewarded_slots")
    bids: Mapped[list[GameboardBid]] = relationship("GameboardBid", back_populates="slot")
    aid_offers: Mapped[list[GameboardAidOffer]] = relationship("GameboardAidOffer", back_populates="slot")


class GameboardBid(Base):
    __tablename__ = "gameboard_bids"
    __table_args__ = (
        Index("ix_gameboard_bids_slot_status", "slotId", "status"),
        Index("ix_gameboard_bids_bidder", "bidderId"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    slot_id: Mapped[str] = mapped_column("slotId", String, ForeignKey("gameboard_slots.id", ondelete="CASCADE"))
    bidder_id: Mapped[str] = mapped_column("bidderId", String, ForeignKey("players.id", ondelete="CASCADE"))
    amount: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String, default="active")
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    slot: Mapped[GameboardSlot] = relationship("GameboardSlot", back_populates="bids")
    bidder: Mapped[Player] = relationship("Player", back_populates="gameboard_bids")


class GameboardAidOffer(Base):
    __tablename__ = "gameboard_aid_offers"
    __table_args__ = (
        Index("ix_gameboard_aid_offers_slot", "slotId"),
        Index("ix_gameboard_aid_offers_steward_status", "stewardId", "status"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    slot_id: Mapped[str] = mapped_column("slotId", String, ForeignKey("gameboard_slots.id", ondelete="CASCADE"))
    steward_id: Mapped[str] = mapped_column("stewardId", String, ForeignKey("players.id", ondelete="CASCADE"))
    offerer_id: Mapped[str] = mapped_column("offererId", String, ForeignKey("players.id", ondelete="CASCADE"))
    message: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String, default="direct")
    linked_quest_id: Mapped[str | None] = mapped_column("linkedQuestId", String, ForeignKey("custom_bars.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String, default="pending")
    expires_at: Mapped[datetime | None] = mapped_column("expiresAt", DateTime, nullable=True)
    forked_at: Mapped[datetime | None] = mapped_column("forkedAt", DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    slot: Mapped[GameboardSlot] = relationship("GameboardSlot", back_populates="aid_offers")
    steward: Mapped[Player] = relationship("Player", foreign_keys=[steward_id], back_populates="gameboard_aid_offers_received")
    offerer: Mapped[Player] = relationship("Player", foreign_keys=[offerer_id], back_populates="gameboard_aid_offers_made")
    linked_quest: Mapped[CustomBar | None] = relationship("CustomBar", back_populates="aid_offers_linked")
