"""Identity models: Nation, Archetype, StarterPack, Polarity."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, generate_cuid


class Nation(Base):
    __tablename__ = "nations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    name: Mapped[str] = mapped_column(String, unique=True)
    description: Mapped[str] = mapped_column(String)
    element: Mapped[str] = mapped_column(String, default="earth")
    img_url: Mapped[str | None] = mapped_column("imgUrl", String, nullable=True, default=None)
    archived: Mapped[bool] = mapped_column(Boolean, default=False)
    wake_up: Mapped[str | None] = mapped_column("wakeUp", String, nullable=True, default=None)
    clean_up: Mapped[str | None] = mapped_column("cleanUp", String, nullable=True, default=None)
    grow_up: Mapped[str | None] = mapped_column("growUp", String, nullable=True, default=None)
    show_up: Mapped[str | None] = mapped_column("showUp", String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    moves: Mapped[list[NationMove]] = relationship("NationMove", back_populates="nation")
    players: Mapped[list[Player]] = relationship("Player", back_populates="nation")


class Archetype(Base):
    __tablename__ = "archetypes"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    name: Mapped[str] = mapped_column(String, unique=True)
    description: Mapped[str] = mapped_column(String)
    moves: Mapped[str] = mapped_column(String)
    content: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    central_conflict: Mapped[str | None] = mapped_column("centralConflict", String, nullable=True, default=None)
    primary_question: Mapped[str | None] = mapped_column("primaryQuestion", String, nullable=True, default=None)
    vibe: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    energy: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    shadow_signposts: Mapped[str | None] = mapped_column("shadowSignposts", String, nullable=True, default=None)
    light_signposts: Mapped[str | None] = mapped_column("lightSignposts", String, nullable=True, default=None)
    examples: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    wake_up: Mapped[str | None] = mapped_column("wakeUp", String, nullable=True, default=None)
    clean_up: Mapped[str | None] = mapped_column("cleanUp", String, nullable=True, default=None)
    grow_up: Mapped[str | None] = mapped_column("growUp", String, nullable=True, default=None)
    show_up: Mapped[str | None] = mapped_column("showUp", String, nullable=True, default=None)
    primary_wave_stage: Mapped[str | None] = mapped_column("primaryWaveStage", String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    emotional_first_aid: Mapped[str | None] = mapped_column("emotionalFirstAid", String, nullable=True, default=None)

    players: Mapped[list[Player]] = relationship("Player", back_populates="archetype")
    nation_moves: Mapped[list[NationMove]] = relationship("NationMove", back_populates="archetype")


class StarterPack(Base):
    __tablename__ = "starter_packs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    player_id: Mapped[str] = mapped_column("playerId", String, ForeignKey("players.id"), unique=True)
    data: Mapped[str] = mapped_column(String)
    initial_vibeulons: Mapped[int] = mapped_column("initialVibeulons", Integer, default=0)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    player: Mapped[Player] = relationship("Player", back_populates="starter_pack")


class Polarity(Base):
    __tablename__ = "polarities"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    key: Mapped[str] = mapped_column(String, unique=True)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    icon: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    moves: Mapped[list[NationMove]] = relationship("NationMove", back_populates="polarity")
