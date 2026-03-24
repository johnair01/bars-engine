"""Quest & Content models: CustomBar, Quest, PlayerQuest, Shadow321Session, QuestProposal, QuestMoveLog, QuestThread, ThreadQuest, ThreadProgress, QuestPack, PackQuest, PackProgress."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, generate_cuid


class CustomBar(Base):
    __tablename__ = "custom_bars"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    creator_id: Mapped[str] = mapped_column("creatorId", String, ForeignKey("players.id"))
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String)
    type: Mapped[str] = mapped_column(String, default="vibe")
    reward: Mapped[int] = mapped_column(Integer, default=1)
    visibility: Mapped[str] = mapped_column(String, default="public")
    claimed_by_id: Mapped[str | None] = mapped_column("claimedById", String, ForeignKey("players.id"), nullable=True)
    story_path: Mapped[str | None] = mapped_column("storyPath", String, nullable=True, default=None)
    allowed_trigrams: Mapped[str | None] = mapped_column("allowedTrigrams", String, nullable=True, default=None)
    inputs: Mapped[str] = mapped_column(String, default="[]")
    move_type: Mapped[str | None] = mapped_column("moveType", String, nullable=True, default=None)
    status: Mapped[str] = mapped_column(String, default="active")
    kotter_stage: Mapped[int] = mapped_column("kotterStage", Integer, default=1)
    story_content: Mapped[str | None] = mapped_column("storyContent", String, nullable=True, default=None)
    story_mood: Mapped[str | None] = mapped_column("storyMood", String, nullable=True, default=None)
    is_system: Mapped[bool] = mapped_column("isSystem", Boolean, default=False)
    hexagram_id: Mapped[int | None] = mapped_column("hexagramId", Integer, nullable=True, default=None)
    period_generated: Mapped[int | None] = mapped_column("periodGenerated", Integer, nullable=True, default=None)
    first_completer_id: Mapped[str | None] = mapped_column("firstCompleterId", String, nullable=True, default=None)
    max_assignments: Mapped[int] = mapped_column("maxAssignments", Integer, default=1)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    parent_id: Mapped[str | None] = mapped_column("parentId", String, ForeignKey("custom_bars.id"), nullable=True)
    twine_logic: Mapped[str | None] = mapped_column("twineLogic", String, nullable=True, default=None)
    completion_effects: Mapped[str | None] = mapped_column("completionEffects", String, nullable=True, default=None)
    root_id: Mapped[str | None] = mapped_column("rootId", String, nullable=True, default=None)
    allowed_nations: Mapped[str | None] = mapped_column("allowedNations", String, nullable=True, default=None)
    allyship_domain: Mapped[str | None] = mapped_column("allyshipDomain", String, nullable=True, default=None)
    nation: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    archetype: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    lock_type: Mapped[str | None] = mapped_column("lockType", String, nullable=True, default=None)
    campaign_ref: Mapped[str | None] = mapped_column("campaignRef", String, nullable=True, default=None)
    campaign_goal: Mapped[str | None] = mapped_column("campaignGoal", String, nullable=True, default=None)
    emotional_alchemy_tag: Mapped[str | None] = mapped_column("emotionalAlchemyTag", String, nullable=True, default=None)
    forked_from_id: Mapped[str | None] = mapped_column("forkedFromId", String, ForeignKey("custom_bars.id", ondelete="SET NULL"), nullable=True)
    game_master_face: Mapped[str | None] = mapped_column("gameMasterFace", String, nullable=True, default=None)
    twine_story_id: Mapped[str | None] = mapped_column("twineStoryId", String, ForeignKey("twine_stories.id"), nullable=True)
    doc_quest_metadata: Mapped[str | None] = mapped_column("docQuestMetadata", String, nullable=True, default=None)
    backlog_prompt_path: Mapped[str | None] = mapped_column("backlogPromptPath", String, nullable=True, default=None)
    evidence_kind: Mapped[str | None] = mapped_column("evidenceKind", String, nullable=True, default=None)
    source_bar_id: Mapped[str | None] = mapped_column("sourceBarId", String, ForeignKey("custom_bars.id", ondelete="SET NULL"), nullable=True)
    source_321_session_id: Mapped[str | None] = mapped_column("source321SessionId", String, nullable=True, default=None)
    is_key_unblocker: Mapped[bool] = mapped_column("isKeyUnblocker", Boolean, default=False)
    grants_move_id: Mapped[str | None] = mapped_column("grantsMoveId", String, nullable=True, default=None)
    quest_source: Mapped[str | None] = mapped_column("questSource", String, nullable=True, default=None)
    staked_pool: Mapped[int] = mapped_column("stakedPool", Integer, default=0)
    agent_metadata: Mapped[str | None] = mapped_column("agentMetadata", String, nullable=True, default=None)
    strand_metadata: Mapped[str | None] = mapped_column("strandMetadata", String, nullable=True, default=None)

    # Self-referential relationships
    parent: Mapped[CustomBar | None] = relationship("CustomBar", remote_side="CustomBar.id", foreign_keys=[parent_id], back_populates="children")
    children: Mapped[list[CustomBar]] = relationship("CustomBar", foreign_keys=[parent_id], back_populates="parent")
    forked_from: Mapped[CustomBar | None] = relationship("CustomBar", remote_side="CustomBar.id", foreign_keys=[forked_from_id], back_populates="forks")
    forks: Mapped[list[CustomBar]] = relationship("CustomBar", foreign_keys=[forked_from_id], back_populates="forked_from")
    source_bar: Mapped[CustomBar | None] = relationship("CustomBar", remote_side="CustomBar.id", foreign_keys=[source_bar_id], back_populates="quests_from_bar")
    quests_from_bar: Mapped[list[CustomBar]] = relationship("CustomBar", foreign_keys=[source_bar_id], back_populates="source_bar")

    # Relationships — player.py
    creator: Mapped[Player] = relationship("Player", foreign_keys=[creator_id], back_populates="created_bars")
    claimed_by: Mapped[Player | None] = relationship("Player", foreign_keys=[claimed_by_id], back_populates="claimed_bars")

    # Relationships — same file
    shares: Mapped[list[BarShare]] = relationship("BarShare", back_populates="bar")
    responses: Mapped[list[BarResponse]] = relationship("BarResponse", back_populates="bar")
    assignments: Mapped[list[PlayerQuest]] = relationship("PlayerQuest", back_populates="quest")
    move_logs_as_created_bar: Mapped[list[QuestMoveLog]] = relationship("QuestMoveLog", foreign_keys="[QuestMoveLog.created_bar_id]", back_populates="created_bar")
    quest_move_logs: Mapped[list[QuestMoveLog]] = relationship("QuestMoveLog", foreign_keys="[QuestMoveLog.quest_id]", back_populates="quest")
    thread_quests: Mapped[list[ThreadQuest]] = relationship("ThreadQuest", back_populates="quest")
    pack_quests: Mapped[list[PackQuest]] = relationship("PackQuest", back_populates="quest")
    quest_proposals: Mapped[list[QuestProposal]] = relationship("QuestProposal", back_populates="bar")
    bounty_stakes: Mapped[list[BountyStake]] = relationship("BountyStake", back_populates="bar")
    upgraded_threads: Mapped[list[QuestThread]] = relationship("QuestThread", back_populates="source_quest")

    # Relationships — narrative.py
    twine_story: Mapped[TwineStory | None] = relationship("TwineStory", back_populates="quests")
    linked_passages: Mapped[list[Passage]] = relationship("Passage", back_populates="linked_quest")
    micro_twine: Mapped[MicroTwineModule | None] = relationship("MicroTwineModule", back_populates="quest", uselist=False)

    # Relationships — campaign.py
    gameboard_slots: Mapped[list[GameboardSlot]] = relationship("GameboardSlot", back_populates="quest")
    aid_offers_linked: Mapped[list[GameboardAidOffer]] = relationship("GameboardAidOffer", back_populates="linked_quest")

    # Relationships — knowledge.py
    library_requests_spawned: Mapped[list[LibraryRequest]] = relationship("LibraryRequest", back_populates="spawned_doc_quest")
    bindings: Mapped[list[BarBinding]] = relationship("BarBinding", back_populates="bar")


class Shadow321Session(Base):
    __tablename__ = "shadow_321_sessions"
    __table_args__ = (
        Index("ix_shadow321_player", "playerId"),
        Index("ix_shadow321_outcome", "outcome"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    player_id: Mapped[str] = mapped_column("playerId", String, ForeignKey("players.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    phase3_snapshot: Mapped[str] = mapped_column("phase3Snapshot", String)
    phase2_snapshot: Mapped[str] = mapped_column("phase2Snapshot", String)
    outcome: Mapped[str] = mapped_column(String)
    linked_bar_id: Mapped[str | None] = mapped_column("linkedBarId", String, nullable=True, default=None)
    linked_quest_id: Mapped[str | None] = mapped_column("linkedQuestId", String, nullable=True, default=None)
    quest_completed_at: Mapped[datetime | None] = mapped_column("questCompletedAt", DateTime, nullable=True)

    player: Mapped[Player] = relationship("Player", back_populates="shadow_321_sessions")


class QuestProposal(Base):
    __tablename__ = "quest_proposals"
    __table_args__ = (
        Index("ix_quest_proposals_bar", "barId"),
        Index("ix_quest_proposals_status", "reviewStatus"),
        Index("ix_quest_proposals_campaign_status", "campaignRef", "reviewStatus"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    bar_id: Mapped[str] = mapped_column("barId", String, ForeignKey("custom_bars.id", ondelete="CASCADE"))
    campaign_ref: Mapped[str | None] = mapped_column("campaignRef", String, nullable=True, default=None)
    player_id: Mapped[str] = mapped_column("playerId", String, ForeignKey("players.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text)
    domain: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    quest_type: Mapped[str | None] = mapped_column("questType", String, nullable=True, default=None)
    completion_conditions: Mapped[str] = mapped_column("completionConditions", String, default="[]")
    emotional_alchemy: Mapped[str] = mapped_column("emotionalAlchemy", String, default="{}")
    review_status: Mapped[str] = mapped_column("reviewStatus", String, default="pending")
    confidence_score: Mapped[float] = mapped_column("confidenceScore", Float, default=0)
    published_quest_id: Mapped[str | None] = mapped_column("publishedQuestId", String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    bar: Mapped[CustomBar] = relationship("CustomBar", back_populates="quest_proposals")
    player: Mapped[Player] = relationship("Player", back_populates="quest_proposals")


class Quest(Base):
    __tablename__ = "quests"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    title: Mapped[str] = mapped_column(String)
    prompt: Mapped[str] = mapped_column(String)
    return_type: Mapped[str] = mapped_column("returnType", String)
    parent_id: Mapped[str | None] = mapped_column("parentId", String, ForeignKey("quests.id"), nullable=True)
    root_id: Mapped[str | None] = mapped_column("rootId", String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    parent: Mapped[Quest | None] = relationship("Quest", remote_side="Quest.id", foreign_keys=[parent_id], back_populates="children")
    children: Mapped[list[Quest]] = relationship("Quest", foreign_keys=[parent_id], back_populates="parent")


class PlayerQuest(Base):
    __tablename__ = "player_quests"
    __table_args__ = (
        UniqueConstraint("playerId", "questId", name="uq_player_quests_player_quest"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    player_id: Mapped[str] = mapped_column("playerId", String, ForeignKey("players.id"))
    quest_id: Mapped[str] = mapped_column("questId", String, ForeignKey("custom_bars.id"))
    status: Mapped[str] = mapped_column(String, default="assigned")
    inputs: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    assigned_at: Mapped[datetime] = mapped_column("assignedAt", DateTime, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column("completedAt", DateTime, nullable=True)

    player: Mapped[Player] = relationship("Player", back_populates="quests")
    quest: Mapped[CustomBar] = relationship("CustomBar", back_populates="assignments")


class QuestMoveLog(Base):
    __tablename__ = "quest_move_logs"
    __table_args__ = (
        Index("ix_quest_move_logs_quest_created", "questId", "createdAt"),
        Index("ix_quest_move_logs_player_created", "playerId", "createdAt"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    quest_id: Mapped[str] = mapped_column("questId", String, ForeignKey("custom_bars.id", ondelete="CASCADE"))
    move_id: Mapped[str] = mapped_column("moveId", String, ForeignKey("nation_moves.id", ondelete="CASCADE"))
    player_id: Mapped[str] = mapped_column("playerId", String, ForeignKey("players.id", ondelete="CASCADE"))
    created_bar_id: Mapped[str | None] = mapped_column("createdBarId", String, ForeignKey("custom_bars.id"), nullable=True)
    inputs_json: Mapped[str | None] = mapped_column("inputsJson", String, nullable=True, default=None)
    effects_json: Mapped[str | None] = mapped_column("effectsJson", String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    quest: Mapped[CustomBar] = relationship("CustomBar", foreign_keys=[quest_id], back_populates="quest_move_logs")
    created_bar: Mapped[CustomBar | None] = relationship("CustomBar", foreign_keys=[created_bar_id], back_populates="move_logs_as_created_bar")
    move: Mapped[NationMove] = relationship("NationMove", back_populates="logs")
    player: Mapped[Player] = relationship("Player", back_populates="quest_move_logs")


class QuestThread(Base):
    __tablename__ = "quest_threads"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    thread_type: Mapped[str] = mapped_column("threadType", String, default="standard")
    creator_type: Mapped[str] = mapped_column("creatorType", String, default="system")
    creator_id: Mapped[str | None] = mapped_column("creatorId", String, nullable=True, default=None)
    creation_cost: Mapped[int] = mapped_column("creationCost", Integer, default=0)
    completion_reward: Mapped[int] = mapped_column("completionReward", Integer, default=0)
    allowed_archetypes: Mapped[str | None] = mapped_column("allowedArchetypes", String, nullable=True, default=None)
    gate_nation_id: Mapped[str | None] = mapped_column("gateNationId", String, nullable=True, default=None)
    gate_archetype_id: Mapped[str | None] = mapped_column("gateArchetypeId", String, nullable=True, default=None)
    status: Mapped[str] = mapped_column(String, default="active")
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())
    book_id: Mapped[str | None] = mapped_column("bookId", String, ForeignKey("books.id"), unique=True, nullable=True)
    adventure_id: Mapped[str | None] = mapped_column("adventureId", String, ForeignKey("adventures.id", ondelete="SET NULL"), unique=True, nullable=True)
    event_campaign_id: Mapped[str | None] = mapped_column("eventCampaignId", String, ForeignKey("event_campaigns.id", ondelete="SET NULL"), unique=True, nullable=True)
    source_quest_id: Mapped[str | None] = mapped_column("sourceQuestId", String, ForeignKey("custom_bars.id"), nullable=True)

    book: Mapped[Book | None] = relationship("Book", back_populates="thread")
    adventure: Mapped[Adventure | None] = relationship("Adventure", back_populates="quest_thread")
    event_campaign: Mapped[EventCampaign | None] = relationship("EventCampaign", back_populates="production_thread")
    source_quest: Mapped[CustomBar | None] = relationship("CustomBar", back_populates="upgraded_threads")
    progress: Mapped[list[ThreadProgress]] = relationship("ThreadProgress", back_populates="thread")
    quests: Mapped[list[ThreadQuest]] = relationship("ThreadQuest", back_populates="thread")


class ThreadQuest(Base):
    __tablename__ = "thread_quests"
    __table_args__ = (
        UniqueConstraint("threadId", "position", name="uq_thread_quests_thread_position"),
        UniqueConstraint("threadId", "questId", name="uq_thread_quests_thread_quest"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    thread_id: Mapped[str] = mapped_column("threadId", String, ForeignKey("quest_threads.id", ondelete="CASCADE"))
    quest_id: Mapped[str] = mapped_column("questId", String, ForeignKey("custom_bars.id"))
    position: Mapped[int] = mapped_column(Integer)

    quest: Mapped[CustomBar] = relationship("CustomBar", back_populates="thread_quests")
    thread: Mapped[QuestThread] = relationship("QuestThread", back_populates="quests")


class ThreadProgress(Base):
    __tablename__ = "thread_progress"
    __table_args__ = (
        UniqueConstraint("threadId", "playerId", name="uq_thread_progress_thread_player"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    thread_id: Mapped[str] = mapped_column("threadId", String, ForeignKey("quest_threads.id", ondelete="CASCADE"))
    player_id: Mapped[str] = mapped_column("playerId", String)
    current_position: Mapped[int] = mapped_column("currentPosition", Integer, default=0)
    started_at: Mapped[datetime] = mapped_column("startedAt", DateTime, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column("completedAt", DateTime, nullable=True)
    is_archived: Mapped[bool] = mapped_column("isArchived", Boolean, default=False)

    thread: Mapped[QuestThread] = relationship("QuestThread", back_populates="progress")


class QuestPack(Base):
    __tablename__ = "quest_packs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    creator_type: Mapped[str] = mapped_column("creatorType", String, default="system")
    creator_id: Mapped[str | None] = mapped_column("creatorId", String, nullable=True, default=None)
    allowed_archetypes: Mapped[str | None] = mapped_column("allowedArchetypes", String, nullable=True, default=None)
    status: Mapped[str] = mapped_column(String, default="active")
    visibility: Mapped[str] = mapped_column(String, default="private")
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    progress: Mapped[list[PackProgress]] = relationship("PackProgress", back_populates="pack")
    quests: Mapped[list[PackQuest]] = relationship("PackQuest", back_populates="pack")


class PackQuest(Base):
    __tablename__ = "pack_quests"
    __table_args__ = (
        UniqueConstraint("packId", "questId", name="uq_pack_quests_pack_quest"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    pack_id: Mapped[str] = mapped_column("packId", String, ForeignKey("quest_packs.id", ondelete="CASCADE"))
    quest_id: Mapped[str] = mapped_column("questId", String, ForeignKey("custom_bars.id"))

    pack: Mapped[QuestPack] = relationship("QuestPack", back_populates="quests")
    quest: Mapped[CustomBar] = relationship("CustomBar", back_populates="pack_quests")


class PackProgress(Base):
    __tablename__ = "pack_progress"
    __table_args__ = (
        UniqueConstraint("packId", "playerId", name="uq_pack_progress_pack_player"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    pack_id: Mapped[str] = mapped_column("packId", String, ForeignKey("quest_packs.id", ondelete="CASCADE"))
    player_id: Mapped[str] = mapped_column("playerId", String)
    completed: Mapped[str] = mapped_column(String, default="[]")
    started_at: Mapped[datetime] = mapped_column("startedAt", DateTime, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column("completedAt", DateTime, nullable=True)
    is_archived: Mapped[bool] = mapped_column("isArchived", Boolean, default=False)

    pack: Mapped[QuestPack] = relationship("QuestPack", back_populates="progress")
