"""Economy models: VibulonEvent, Vibulon, VibeulonLedger, BountyStake, Donation, RedemptionPack."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, ForeignKey, Index, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, generate_cuid


class VibulonEvent(Base):
    __tablename__ = "vibulon_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    player_id: Mapped[str] = mapped_column("playerId", String, ForeignKey("players.id"))
    source: Mapped[str] = mapped_column(String)
    amount: Mapped[int] = mapped_column(Integer)
    notes: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    archetype_move: Mapped[str | None] = mapped_column("archetypeMove", String, nullable=True, default=None)
    quest_id: Mapped[str | None] = mapped_column("questId", String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    player: Mapped[Player] = relationship("Player", back_populates="vibulon_events")


class Vibulon(Base):
    __tablename__ = "vibulons"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    owner_id: Mapped[str | None] = mapped_column("ownerId", String, ForeignKey("players.id"), nullable=True)
    creator_id: Mapped[str | None] = mapped_column("creatorId", String, ForeignKey("players.id"), nullable=True)
    origin_source: Mapped[str] = mapped_column("originSource", String)
    origin_id: Mapped[str] = mapped_column("originId", String)
    origin_title: Mapped[str] = mapped_column("originTitle", String)
    generation: Mapped[int] = mapped_column(Integer, default=1)
    staked_on_bar_id: Mapped[str | None] = mapped_column("stakedOnBarId", String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    owner: Mapped[Player | None] = relationship("Player", foreign_keys=[owner_id], back_populates="vibulons")
    creator: Mapped[Player | None] = relationship("Player", foreign_keys=[creator_id], back_populates="creator_vibulons")
    bounty_stake: Mapped[BountyStake | None] = relationship("BountyStake", back_populates="vibulon", uselist=False)


class VibeulonLedger(Base):
    __tablename__ = "vibeulon_ledger"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    player_id: Mapped[str] = mapped_column("playerId", String, ForeignKey("players.id"))
    source_instance_id: Mapped[str | None] = mapped_column("sourceInstanceId", String, nullable=True, default=None)
    target_instance_id: Mapped[str | None] = mapped_column("targetInstanceId", String, nullable=True, default=None)
    amount: Mapped[int] = mapped_column(Integer)
    type: Mapped[str] = mapped_column(String)
    meta: Mapped[str | None] = mapped_column("metadata", String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    player: Mapped[Player] = relationship("Player", back_populates="vibeulon_ledger")


class BountyStake(Base):
    __tablename__ = "bounty_stakes"
    __table_args__ = (
        UniqueConstraint("vibulonId", name="uq_bounty_stakes_vibulon"),
        Index("ix_bounty_stakes_bar", "barId"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    bar_id: Mapped[str] = mapped_column("barId", String, ForeignKey("custom_bars.id", ondelete="CASCADE"))
    vibulon_id: Mapped[str] = mapped_column("vibulonId", String, ForeignKey("vibulons.id", ondelete="CASCADE"))
    player_id: Mapped[str] = mapped_column("playerId", String, ForeignKey("players.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    bar: Mapped[CustomBar] = relationship("CustomBar", back_populates="bounty_stakes")
    vibulon: Mapped[Vibulon] = relationship("Vibulon", back_populates="bounty_stake")
    player: Mapped[Player] = relationship("Player", back_populates="bounty_stakes")


class Donation(Base):
    __tablename__ = "donations"
    __table_args__ = (
        Index("ix_donations_instance_created", "instanceId", "createdAt"),
        Index("ix_donations_player_created", "playerId", "createdAt"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    instance_id: Mapped[str] = mapped_column("instanceId", String, ForeignKey("instances.id", ondelete="CASCADE"))
    player_id: Mapped[str | None] = mapped_column("playerId", String, ForeignKey("players.id"), nullable=True)
    amount_cents: Mapped[int] = mapped_column("amountCents", Integer)
    provider: Mapped[str] = mapped_column(String, default="manual")
    external_id: Mapped[str | None] = mapped_column("externalId", String, nullable=True, default=None)
    note: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    instance: Mapped[Instance] = relationship("Instance", back_populates="donations")
    player: Mapped[Player | None] = relationship("Player", back_populates="donations")
    redemption_packs: Mapped[list[RedemptionPack]] = relationship("RedemptionPack", back_populates="donation")


class RedemptionPack(Base):
    __tablename__ = "redemption_packs"
    __table_args__ = (
        Index("ix_redemption_packs_player_status", "playerId", "status"),
        Index("ix_redemption_packs_instance_type", "instanceId", "packType"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    instance_id: Mapped[str] = mapped_column("instanceId", String, ForeignKey("instances.id", ondelete="CASCADE"))
    player_id: Mapped[str] = mapped_column("playerId", String, ForeignKey("players.id", ondelete="CASCADE"))
    donation_id: Mapped[str | None] = mapped_column("donationId", String, ForeignKey("donations.id", ondelete="SET NULL"), nullable=True)
    pack_type: Mapped[str] = mapped_column("packType", String, default="donation")
    status: Mapped[str] = mapped_column(String, default="unredeemed")
    vibulon_amount: Mapped[int] = mapped_column("vibeulonAmount", Integer)
    meta: Mapped[str | None] = mapped_column("metadata", String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    redeemed_at: Mapped[datetime | None] = mapped_column("redeemedAt", DateTime, nullable=True)

    instance: Mapped[Instance] = relationship("Instance", back_populates="redemption_packs")
    player: Mapped[Player] = relationship("Player", back_populates="redemption_packs")
    donation: Mapped[Donation | None] = relationship("Donation", back_populates="redemption_packs")
