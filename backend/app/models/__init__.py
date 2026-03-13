"""SQLAlchemy models — 76 models translated from Prisma schema."""
from app.models.base import Base, generate_cuid

# Player & Core
from app.models.player import Invite, Player, Account, Role, PlayerRole, Bar, PlayerBar, BarShare, BarResponse

# Identity
from app.models.identity import Nation, Archetype, StarterPack, Polarity

# Quest & Content
from app.models.quest import (
    CustomBar, Quest, PlayerQuest, Shadow321Session, QuestProposal,
    QuestMoveLog, QuestThread, ThreadQuest, ThreadProgress,
    QuestPack, PackQuest, PackProgress,
)

# Narrative
from app.models.narrative import (
    TwineStory, CompiledTweeVersion, TwineRun, TwineBinding,
    MicroTwineModule, Adventure, Passage, PlayerAdventureProgress,
)

# Economy
from app.models.economy import (
    VibulonEvent, Vibulon, VibeulonLedger, BountyStake,
    Donation, RedemptionPack,
)

# Campaign
from app.models.campaign import (
    Instance, InstanceMembership, InstanceParticipation,
    EventCampaign, EventArtifact, EventParticipant, EventInvite,
    CampaignPlaybook, CampaignInvitation,
)

# Game
from app.models.game import (
    NationMove, PlayerNationMoveUnlock, PlayerMoveEquip, MoveUse,
    EmotionalFirstAidTool, EmotionalFirstAidSession,
    GameboardSlot, GameboardBid, GameboardAidOffer,
)

# Deck
from app.models.deck import BarDeck, BarDeckCard, BarBinding, ActorDeckState

# Knowledge
from app.models.knowledge import (
    Book, BookAnalysisResumeLog, VerificationCompletionLog,
    LibraryRequest, DocNode, DocEvidenceLink, BacklogItem, Schism,
    HexagramEncounterLog, AgentInterpretiveProfile,
)

# System
from app.models.system import (
    GlobalState, StoryTick, AppConfig, AuditLog, AdminAuditLog,
    SpecKitBacklogItem, AiResponseCache,
)

__all__ = [
    "Base", "generate_cuid",
    # Player
    "Invite", "Player", "Account", "Role", "PlayerRole", "Bar", "PlayerBar", "BarShare", "BarResponse",
    # Identity
    "Nation", "Archetype", "StarterPack", "Polarity",
    # Quest
    "CustomBar", "Quest", "PlayerQuest", "Shadow321Session", "QuestProposal",
    "QuestMoveLog", "QuestThread", "ThreadQuest", "ThreadProgress",
    "QuestPack", "PackQuest", "PackProgress",
    # Narrative
    "TwineStory", "CompiledTweeVersion", "TwineRun", "TwineBinding",
    "MicroTwineModule", "Adventure", "Passage", "PlayerAdventureProgress",
    # Economy
    "VibulonEvent", "Vibulon", "VibeulonLedger", "BountyStake", "Donation", "RedemptionPack",
    # Campaign
    "Instance", "InstanceMembership", "InstanceParticipation",
    "EventCampaign", "EventArtifact", "EventParticipant", "EventInvite",
    "CampaignPlaybook", "CampaignInvitation",
    # Game
    "NationMove", "PlayerNationMoveUnlock", "PlayerMoveEquip", "MoveUse",
    "EmotionalFirstAidTool", "EmotionalFirstAidSession",
    "GameboardSlot", "GameboardBid", "GameboardAidOffer",
    # Deck
    "BarDeck", "BarDeckCard", "BarBinding", "ActorDeckState",
    # Knowledge
    "Book", "BookAnalysisResumeLog", "VerificationCompletionLog",
    "LibraryRequest", "DocNode", "DocEvidenceLink", "BacklogItem", "Schism",
    # System
    "GlobalState", "StoryTick", "AppConfig", "AuditLog", "AdminAuditLog",
    "SpecKitBacklogItem", "AiResponseCache",
]
