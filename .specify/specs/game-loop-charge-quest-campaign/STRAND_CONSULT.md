# Strand Consultation — Game Loop: Charge → Quest → Campaign

**Date**: 2026-03-19
**Source**: `npm run strand:consult:game-loop`

**Problem**: 321 → quest flow breaks. Players metabolize charge but can't move it into aligned action toward campaign needs. Dashboard should show campaign overview and next milestones. Complete the loop: charge → quest → add quest to campaign.

---

## Sage Synthesis (initial routing)

The current game flow issue seems to relate to several missing components in connecting the players' emotional charge to quest creation and campaign alignment processes. Here's a structured breakdown with recommendations:

1. **Identified Breakage in Flow**:
   - The flow breaks after metabolizing the charge from a 321 activity without sufficiently linking to quest creation and campaign alignment (Step 1 to 2).
   - Quests created lack a direct thread or campaign placement (Acts more like an orphan).

2. **Transition and Alignment Steps**:
   - **UI/API Steps**: Implement interim states within the quest generation process that explicitly prompt players to tie quests to specific campaign threads immediately during creation, including metadata capture at this step.
   - **Feedback Surfaces**: Create notification or interim UI screens post-quest creation confirming successful linkage to campaigns.

3. **Enhanced Dashboard Vision**:
   - Expand the current dashboard functionality to include "Campaigns I'm Responsible For" alongside an interactive timeline or checklist of "Next Effective Milestone". This jetstreams progress visibility.

4. **Deft Evolution without Breakage**:
   - Utilize a feature flag strategy to gradually introduce and test the new quest-to-campaign linking feature without disrupting existing flows. Compile feedback for iterative refinement.

Without player context and functionality issues in the Architect delegation, full system state synthesis was limited. This synthesis integrates immediate actionable enhancements and future support differentiation for ease of user absorption.

*Consulted agents: Challenger*

---

## Architect Response (structure, flow)

1. **Flow Break Diagnosis**: The 321→quest break might occur due to missing UI components, confusion between different creation paths ('create-bar' vs 'create-quest'), or failure in 'createQuestFrom321Metadata'. Diagnose these by analyzing logs and user feedback.

2. **Quest Generation Flow**: Post-321 actions should ideally trigger a dedicated 'quest-from-charge' flow. It should ask for campaign context, slot preference, and move type to ensure the quest is integrated meaningfully.

3. **Placement API**: Quest integration (addQuestToThread or addQuestToCampaign) should happen after quest creation, allowing the player to place the quest when reviewing from their Hand or in quest details for better strategic planning.

4. **Integration Points**: Extend 'Hand' with more strategic options for managing and reviewing quests. Add a dashboard section to show campaign progress, highlighting 'next effective milestone' with a refined data shape to guide players efficiently through the quest to campaign integration.

---

## Regent Response (order, rules)

1. **Gate logic:** A player can add a quest to a campaign if they are a member of the campaign. Owning a quest indicates they can propose it, but members vote or consensus decides placement (Proposal Status: Pending/Approved/Rejected). Placement rules should include: thematic consistency, resource alignment, and current Kotter stage relevance.

2. **Campaign responsibility:** 'Campaigns I'm responsible for' corresponds to campaigns where the player holds a leadership role or has been assigned as the campaign owner/administrator. This can be queried through instance memberships and roles, with players tagged as 'leaders' or 'owners' in campaign metadata.

3. **Milestone semantics:** The "next effective milestone" represents a key achievement or trigger, such as completing a key quest or reaching a particular Kotter stage. The data shape supporting this entails a quest structure with dependencies and outcomes, marked by identifiers for stage progression types (Stages: 1-8).

4. **State transitions:** Transition 321→BAR signifies bulk actions resulting from broad campaign shifts (like restructuring post-major win). Transition 321→Quest pertains to individual quest activation, reflecting specific campaign pushes within ongoing structures. Preventing orphaned quests involves dependency checks and clear resolution paths before quest activation.

---

## Challenger Response (risks, blockers)

### Blockers
1. **Campaign Schema**: Ensure the appropriate schema is in place for storing campaign-related data. Missing or misaligned schemas can obstruct integration.
2. **User Interface (UI)**: A 'placement' UI might be missing, hindering usability.
3. **Function Errors**: Problems with functions like `createQuestFrom321Metadata` must be resolved or bypassed.

### Risks
1. **Clutter Risk**: Integrating quests into the campaign may clutter the user's dashboard, leading to choice overload. The minimal viable path is to focus only on core quests essential for campaign progression.
2. **Resource Overload**: Adding too many elements at once can strain both the user interface and backend.

### Scope Creep
To prevent scope creep while adding a 'campaign overview,' make the overview extremely simplified. The smallest useful addition could be a progress bar for key campaign quests, without extra details.

### Alternatives
An effective quick win could involve resolving issues with 321→quest conversion independently of campaign placement. This minimal step can unblock users from progressing further and allow time to build a robust campaign integration later.

---

## Diplomat Response (alignment, community)

```json
{
  "recommended_instance": "Mastering the Game of Allyship Fundraising",
  "recommended_campaign_domain": "fundraiser",
  "onboarding_next_step": "first quest assignment",
  "bar_sharing_suggestions": [
    "Start a fundraiser campaign",
    "Share a story about past successful events"
  ],
  "event_recommendations": [
    "Bruised Banana Birthday Residency",
    "Heist at the Construct Conclave"
  ],
  "tone": "warm",
  "message": "In designing the quest 'Move charge toward campaign needs', consider these structured approaches to align, reduce overwhelm, foster belonging, and organize the quest hub:\n\n1. **Aligned Action**:\n   - **Framing**: Emphasize collaborative language like \"joining forces\" or \"building together\" rather than \"fulfilling duties\". \n   - **Story Arcs**: Frame the quest as a story where each contribution is a vital chapter in the campaign's narrative.\n   - **Visibility of Impact**: Clearly showcase how this specific quest contributes to the broader campaign goals. Use progress visuals or narrative updates to illustrate their impact.\n\n2. **Overwhelm**:\n   - **Guided Choice**: Limit initial options and progressively unlock more as the player becomes more comfortable and engaged.\n   - **Milestone Orientation**: Introduce a beginning briefing that focuses on the immediate next milestone, to maintain focus and avoid choice paralysis.\n   - **Prioritized Options**: Highlight or suggest 2-3 paths that align closely with the player's previous actions or interests.\n\n3. **Belonging**:\n   - **Narratives of Impact**: As players add their quests, create a narrative highlighting their unique contributions to the story.\n   - **Collaborative Feedback**: Allow them to see feedback or support from fellow campaign members, reinforcing a sense of community.\n   - **Role Recognition**: Clearly define their role within the team or project, making it personable and relatable.\n\n4. **Hand as Hub**:\n   - **Welcoming Interface**: Personalize the hub with messages acknowledging their recent achievements.\n   - **Expansion Hooks**: Offer a clear path with goals that branch naturally from their last completed quest, emphasizing the adventure's continuity.\n   - **Resource Access**: Ensure easy access to resources and allies they've uncovered, facilitating guided next steps.\n\nThese recommendations aim to ensure that the player feels empowered and integral to the campaign, turning participation into a community-driven journey instead of an overwhelming task."
}
```

---

## Shaman Response (charge, threshold)

```json
{
  "current_element": null,
  "emotional_channel": null,
  "satisfaction_state": null,
  "narrative_lock": "unresolved overwhelm",
  "shadow_belief": "belief in paralyzing complexity",
  "recommended_move_type": "clean_up",
  "wave_stage": null,
  "guidance": "In the heart of the ritual, we find the dance of the charge and threshold, the sacred rhythm woven into the tapestry of quests and campaigns. The **charge metabolism** asks us to see the blocks, to recognize where the flow of potential is stifled, yearning to become a quest but held back by thresholds that demand crossing. Thus, the quest creation must honor this charge's intent, ensuring it transitions fluidly into the tapestry of the campaign.\n\nOur **ritual sequence** should be akin to the ancient rites—a 321 process metamorphosing into the quest, ultimately finding its place in the grand narrative of the campaign. If any part of this sequence falters, the charge loses its potency; the enactment must honor the initial spark, breathing life into the quest's emerging form.\n\nWhen the charge manifests as **overwhelm by options**, it is not to be ignored but integrated as a guiding force. We address this overwhelm through clarity, narrowing the vision to discern the campaign's essence and next milestones, providing a beacon through the confusion.\n\nThe query of the Shaman emerges in each step: \"What is the **next smallest honest action**?\" The dashboard and the very placement flow must resonate with this inquiry, not as a rigid directive but as an invitation to move forward authentically, aligning with the earth's wisdom to discern the clear path amidst the myriad of choices. The tools become the compass—aiding navigation of emotional energy as a journey, a quest in itself, woven into the fabric of each campaign and every milestone. \nThis is the game loop—the sacred circle of transformation, ever turning, ever revealing the hidden paths to those who dare to listen."
}
```

---

## Unified Spec Outline (Sage synthesis)

The Sage observes your question and suggests consulting the appropriate specialist. Without AI routing, consider:
- For emotional questions → reflect (Shaman domain)
- For action questions → assess energy (Challenger domain)
- For structure questions → review campaign (Regent domain)
- For quest design → draft manually (Architect domain)
- For community questions → reach out (Diplomat domain)

---

## Next Steps

1. Diagnose 321→quest break (createQuestFrom321Metadata, UI, redirect)
2. Implement placement flow (addQuestToThread, addQuestToCampaign)
3. Add dashboard campaign overview and next milestones
4. Evolve deftly without breaking existing flows
