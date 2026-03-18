# Game Master Consultation — BAR External Sharing

**Date**: 2026-03-18
**Source**: `npm run strand:consult:bar-external`

When a player sends a BAR to someone outside the game, the recipient needs:
1. Log in (if they have an account)
2. Sign up (if they don't)
3. Onboarding adventure first (if BAR is campaign-associated)
4. iOS preview so the link doesn't look suspicious

---

## Sage Synthesis (initial routing)

To address the BAR sharing flow for external recipients, we need to structurally integrate several components while remaining aligned with narrative goals and trust-building strategies:

1. **Structural Model Update:** Extend the current BarShare model to support externally shared BARs by introducing a new entity, 'BarShareExternal'. This entity would not require a 'toUserId', instead, it would operate on tokens. This addresses the schema concern of sharing with non-members.

2. **Flow Sequence:** The recommended flow for engagement should be: link click → rich iOS preview → personalized on-page preview with sender details → onboarding adventure if part of a campaign (aligned with Campaign BAR → Onboarding first requirement) → account creation or login.

3. **iOS Rich Preview:** Implement robust meta tags including sender name, BAR title, and a succinct description of the BAR. Utilize an eye-catching yet contextually relevant image to establish authenticity and trust.

4. **Integration with Invitation Rituals:** The golden path for invitations through BARs must be maintained. Ensure the integration of onboarding narratives provides a seamless introduction and indoctrination into existing campaign frameworks. Respect the 'invitation as ritual' through narrative consistency.

5. **Consideration from Social Dynamics:** Remember the community-building focus, using motivational narrative hooks within onboarding to promote engagement.

Alignment with Hexagram 45 indicates: attunement with current external engagement strategies is essential. Proceed with a full understanding of market contexts, trust factors, and narrative elements before fully implementing. This holistic touch followed by thoughtful action can determine the depth of integration and adoption.

Consulted the Architect, Challenger, Regent, and Diplomat for narrative, strategic, structural, and community insights respectively.

*Consulted agents: Architect, Challenger, Regent, Diplomat*

---

## Architect Response (schema, flow)

1. **Schema for External Share**: Use `BarShareExternal` with fields: `toEmail`, `shareToken`, `status`. This accommodates recipients not yet existing in the game. Optionally, cross-link with the user model when they sign up.

2. **Share Link Shape**: Use `/bar/[shareToken]` to keep the URL compact and avoid clear identifiers. The share token encodes whether this is a bar-only view or includes a campaign (for onboarding).

3. **Flow Sequencing**:  
   - If `campaign-BAR`: link → preview page → onboarding → sign up → BAR view. 
   - If `bar-only`: link → login/signup choice (for new users) → BAR view. 
   This approach distinguishes preview options and account creation routes efficiently.

---

## Regent Response (order, rules)

### Gate Logic:
1. **Onboarding First Rule**: This rule applies when the BAR (Briefing-Action-Report) is directly linked to a campaign instance and lacks an existing inviteId or has a kernel-specific classification. Such scenarios indicate a need to ensure the recipient is adequately prepared to align with the campaign's specific objectives and ethos.

2. **Condition**: The onboarding should occur when there is an absence of existing familiarity with the campaign rules (absence of inviteId) and when the BAR is tied to an active instance, indicating actionable and instance-specific content.

### Token Lifecycle:
1. **Expiry**: Tokens should have a standard expiry of 72 hours, adjustable to campaign criticality. Tokens must support both one-time-view for sensitive documents and multi-view for learning materials.

2. **Revocation**: Implement instantaneous sender revocation capabilities on the campaign dashboard, ensuring protection for both parties. The recipient should be automatically logged out upon revocation.

### Account Creation Timing:
1. **Provisioning after CYOA**: Account creation is committed only after the completion of the Choose-Your-Own-Adventure (CYOA) onboarding to ensure genuine interest and alignment with campaign objectives.

2. **Mid-Onboarding Abandonment**: If the recipient abandons onboarding, temporary session data is held for 24 hours to allow completion before the need for re-initiation. This both respects the user’s time and protects the campaign’s integrity.

---

## Diplomat Response (trust, iOS preview)

```json
{
  "recommended_instance": null,
  "recommended_campaign_domain": null,
  "onboarding_next_step": null,
  "bar_sharing_suggestions": [],
  "event_recommendations": [],
  "tone": "warm, inviting, and engaging",
  "message": "To ensure BAR external sharing is both inviting and trustworthy, consider the following structured elements: \n\n1. **iOS Preview (Open Graph):** \n   - **og:title:** \"[Sender's Name] has shared a unique reflection with you\"\n   - **og:description:** \"Discover insights and contribute to [Campaign Name], a community-driven initiative.\"\n   - **og:image:** Choose a community-oriented image reflecting connectedness, perhaps a group gathered in a circle or an artistic emblem of the campaign.\n   - **og:url:** Link should logically reflect the campaign's URL structure, consistent and recognizable.\n\n2. **First Impression:** \n   - Utilize imagery that reflects community and engagement; avoid stock images that feel generic. Instead, use thematic art or real photographs related to the campaign's mission.\n   - Language should be warm and specific, referencing how the recipient is part of a meaningful dialogue rather than just a passive reader.\n   - Reinforce trust by indicating the sender and the campaign’s mission subtly in both text and visuals.\n\n3. **Onboarding as Welcome:** \n   - Frame onboarding as an entry into a warm community: \"You're joining an enriching opportunity with [Campaign] to understand [Sender's Name]'s perspective.\" \n   - Reinforce the notion of a personalized invitation where the recipient's insight and participation are valued, removing any perception of it being just a formal or procedural requirement. \n\nThis approach respects relational dynamics over technological manipulation, ensuring the recipient feels genuinely welcomed and valued within the campaign essence."
}
```

---

## Shaman Response (ritual, threshold)

```json
{
  "current_element": null,
  "emotional_channel": null,
  "satisfaction_state": null,
  "narrative_lock": null,
  "shadow_belief": null,
  "recommended_move_type": null,
  "wave_stage": null,
  "guidance": "**Ritual Sequence**:\nThe journey begins with a Campaign-BAR, establishing the threshold. As a Shaman, your role is to guide through the symbolic crossing — the onboarding adventure serves this purpose. It is a narrative bridge, prefiguring community storytelling and aligning BAR-as-invitation with sacred ritual. The campaign introduces the landscape before commitment, akin to walking a pilgrim path where each step deepens awareness and connection.\n\n**Emotional Safety**:\nBeyond the creative invitation is vulnerability — a guest stepping onto unknown ground. To honor this, the onboarding flow should weave gentleness with clarity. Offer a preview, revealing glimpses of story and possibility rather than demanding immediate allegiance. An 'orientation' before 'initiation,' confirming next steps, assurances of agency, and no hidden chasms.\n\n**Belonging**:\nConvey 'you are welcome here' through the gift of presence. The BAR is not merely a link but a tapestry woven together. Use the story of those who’ve come before — echoes of mastery and fellowship — solidifying the invitation as belonging rather than transaction. The welcome is the fire-lit promise of space held open, continually fueled by intention and care. It's an entrance, not a gate."
}
```

---

## Unified Spec Outline (Sage synthesis)

### External Share Schema
- **Model**: `BarShareExternal`
  - **Fields**: `toEmail`, `shareToken`, `status`, optionally linked with user model upon signup.
- **Token**: Encodes the view type (bar-only or campaign-BAR) and has a 72-hour standard expiry with option for sender revocation.
- **URL Shape**: `/bar/[shareToken]`, providing compact, non-identifier links.

### Flow
- **Initial Link**: Links differentiate between campaign-BAR and bar-only.
  - **Campaign-BAR**: link → preview page → onboarding CYOA → signup → BAR view.
  - **Bar-only**: link → login/signup choice → BAR view.
- **Onboarding**: Framed as community integration; holds user's session for 24 hours if abandoned.

### iOS Preview Requirements
- **Meta Tags**:
  - **og:title**: "[Sender's Name] has shared a unique reflection with you"
  - **og:description**: "Discover insights and contribute to [Campaign Name]."
  - **og:image**: Emblematic, community-oriented image.
  - **og:url**: Consistent with campaign's URL structure.

### Integration with BAR Invitation
- **Inviting Approach**: Onboarding is a welcoming ritual to join a meaningful dialogue, not transactional.
- **Golden Path**: Ritual theme transitions recipient through informed, emotional onboarding, highlighting past community insights and the importance of their contribution.

---

## Next Steps

1. Create spec kit: spec.md, plan.md, tasks.md in this folder
2. Implement per GM recommendations
3. Add to backlog
