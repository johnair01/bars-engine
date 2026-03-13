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
from app.agents.diplomat import CommunityGuidance, diplomat_agent, deterministic_diplomat_guidance
from app.agents.regent import CampaignAssessment, regent_agent, deterministic_regent_assessment
from app.agents.sage import SageResponse, sage_agent, deterministic_sage_response
from app.agents.shaman import EmotionalAlchemyReading, shaman_agent, deterministic_shaman_reading

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
