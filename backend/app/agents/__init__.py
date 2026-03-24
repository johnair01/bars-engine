"""BARs Engine AI Agents — 6 Game Master Sects.

- Architect: Quest generation / strategy (Orange)
- Challenger: Move proposals / action (Red)
- Shaman: Emotional alchemy / narrative (Magenta)
- Regent: Campaign structure / Kotter (Blue)
- Diplomat: Community / onboarding (Green)
- Sage: Orchestration meta-agent (Teal)
"""

from app.agents._deps import AgentDeps
from app.agents._schemas import AgentMindState, CompostableItem, MoveInfo, PlayerContext, QuestSummary
from app.agents.architect import QuestDraft, architect_agent, deterministic_architect_draft
from app.agents.challenger import MoveProposal, challenger_agent, deterministic_challenger_proposal
from app.agents.diplomat import CommunityGuidance, deterministic_diplomat_guidance, diplomat_agent
from app.agents.regent import CampaignAssessment, deterministic_regent_assessment, regent_agent
from app.agents.sage import SageResponse, deterministic_sage_response, sage_agent
from app.agents.shaman import EmotionalAlchemyReading, deterministic_shaman_reading, shaman_agent

__all__ = [
    "AgentDeps",
    "AgentMindState",
    "CampaignAssessment",
    "CommunityGuidance",
    "CompostableItem",
    "EmotionalAlchemyReading",
    "MoveInfo",
    "MoveProposal",
    "PlayerContext",
    "QuestDraft",
    "QuestSummary",
    "SageResponse",
    "architect_agent",
    "challenger_agent",
    "deterministic_architect_draft",
    "deterministic_challenger_proposal",
    "deterministic_diplomat_guidance",
    "deterministic_regent_assessment",
    "deterministic_sage_response",
    "deterministic_shaman_reading",
    "diplomat_agent",
    "regent_agent",
    "sage_agent",
    "shaman_agent",
]
