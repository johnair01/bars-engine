"""SQLAlchemy models — 76 models translated from Prisma schema."""
from app.models.base import Base, generate_cuid

# Campaign
from app.models.campaign import (
    CampaignInvitation,
    CampaignPlaybook,
    EventArtifact,
    EventCampaign,
    EventInvite,
    EventParticipant,
    Instance,
    InstanceMembership,
    InstanceParticipation,
)

# Deck
from app.models.deck import ActorDeckState, BarBinding, BarDeck, BarDeckCard

# Economy
from app.models.economy import (
    BountyStake,
    Donation,
    RedemptionPack,
    VibeulonLedger,
    Vibulon,
    VibulonEvent,
)

# Game
from app.models.game import (
    EmotionalFirstAidSession,
    EmotionalFirstAidTool,
    GameboardAidOffer,
    GameboardBid,
    GameboardSlot,
    MoveUse,
    NationMove,
    PlayerMoveEquip,
    PlayerNationMoveUnlock,
)

# Identity
from app.models.identity import Archetype, Nation, Polarity, StarterPack

# Knowledge
from app.models.knowledge import (
    AgentInterpretiveProfile,
    BacklogItem,
    Book,
    BookAnalysisResumeLog,
    DocEvidenceLink,
    DocNode,
    HexagramEncounterLog,
    LibraryRequest,
    Schism,
    VerificationCompletionLog,
)

# Narrative
from app.models.narrative import (
    Adventure,
    CompiledTweeVersion,
    MicroTwineModule,
    Passage,
    PlayerAdventureProgress,
    TwineBinding,
    TwineRun,
    TwineStory,
)

# Player & Core
from app.models.player import Account, Bar, BarResponse, BarShare, Invite, Player, PlayerBar, PlayerRole, Role

# Quest & Content
from app.models.quest import (
    CustomBar,
    PackProgress,
    PackQuest,
    PlayerQuest,
    Quest,
    QuestMoveLog,
    QuestPack,
    QuestProposal,
    QuestThread,
    Shadow321Session,
    ThreadProgress,
    ThreadQuest,
)

# System
from app.models.system import (
    AdminAuditLog,
    AiResponseCache,
    AppConfig,
    AuditLog,
    GlobalState,
    SpecKitBacklogItem,
    StoryTick,
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
    "AgentInterpretiveProfile", "HexagramEncounterLog",
    # System
    "GlobalState", "StoryTick", "AppConfig", "AuditLog", "AdminAuditLog",
    "SpecKitBacklogItem", "AiResponseCache",
]
