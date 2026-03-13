"""Deck models: BarDeck, BarDeckCard, BarBinding, ActorDeckState."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, ForeignKey, Index, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, generate_cuid


class BarDeck(Base):
    __tablename__ = "bar_decks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    instance_id: Mapped[str] = mapped_column("instanceId", String, ForeignKey("instances.id", ondelete="CASCADE"), unique=True)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    instance: Mapped[Instance] = relationship("Instance", back_populates="bar_deck")
    cards: Mapped[list[BarDeckCard]] = relationship("BarDeckCard", back_populates="deck")


class BarDeckCard(Base):
    __tablename__ = "bar_deck_cards"
    __table_args__ = (
        UniqueConstraint("deckId", "suit", "rank", name="uq_bar_deck_cards_deck_suit_rank"),
        Index("ix_bar_deck_cards_deck", "deckId"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    deck_id: Mapped[str] = mapped_column("deckId", String, ForeignKey("bar_decks.id", ondelete="CASCADE"))
    suit: Mapped[str] = mapped_column(String)
    rank: Mapped[int] = mapped_column(Integer)
    prompt_title: Mapped[str] = mapped_column("promptTitle", String)
    prompt_text: Mapped[str] = mapped_column("promptText", Text)
    shuffle_power: Mapped[bool] = mapped_column("shufflePower", Boolean, default=False)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, default={})
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    deck: Mapped[BarDeck] = relationship("BarDeck", back_populates="cards")
    bindings: Mapped[list[BarBinding]] = relationship("BarBinding", back_populates="card")


class BarBinding(Base):
    __tablename__ = "bar_bindings"
    __table_args__ = (
        Index("ix_bar_bindings_card", "cardId"),
        Index("ix_bar_bindings_bar", "barId"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    card_id: Mapped[str] = mapped_column("cardId", String, ForeignKey("bar_deck_cards.id", ondelete="CASCADE"))
    bar_id: Mapped[str] = mapped_column("barId", String, ForeignKey("custom_bars.id", ondelete="CASCADE"))
    author_actor_id: Mapped[str] = mapped_column("authorActorId", String)
    instance_id: Mapped[str | None] = mapped_column("instanceId", String, nullable=True, default=None)
    status: Mapped[str] = mapped_column(String, default="active")
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    card: Mapped[BarDeckCard] = relationship("BarDeckCard", back_populates="bindings")
    bar: Mapped[CustomBar] = relationship("CustomBar", back_populates="bindings")


class ActorDeckState(Base):
    __tablename__ = "actor_deck_states"
    __table_args__ = (
        UniqueConstraint("actorId", "instanceId", name="uq_actor_deck_states"),
        Index("ix_actor_deck_states_actor", "actorId"),
        Index("ix_actor_deck_states_instance", "instanceId"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    actor_id: Mapped[str] = mapped_column("actorId", String)
    instance_id: Mapped[str] = mapped_column("instanceId", String)
    deck_card_ids: Mapped[str] = mapped_column("deckCardIds", String, default="[]")
    hand_card_ids: Mapped[str] = mapped_column("handCardIds", String, default="[]")
    discard_card_ids: Mapped[str] = mapped_column("discardCardIds", String, default="[]")
    last_draw_at: Mapped[datetime | None] = mapped_column("lastDrawAt", DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())
