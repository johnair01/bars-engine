# Game Master Consultation — BAR Share Porosity, Preview, Link Ergonomic

**Date**: 2026-03-18
**Source**: `npm run strand:consult:bar-share-porosity`

**Feedback:**
- Unauthenticated recipients aren't getting the preview
- Vercel links look suspicious
- Need porosity model: how porous can we be while protecting security?

---

## Sage Synthesis (initial routing)

To address the current issues with BAR share links and related recipient experiences, consider the following structured recommendations:

1. **Preview Issues**: Unauthenticated recipients may face issues seeing previews due to potential technical blockages like Open Graph unfurling issues or crawler access blocks. Investigate if redirects are occurring before render, and confirm crawler-friendly configurations.

2. **Trust in URLs**: Custom domains or short links can enhance user trust and reduce the perception of suspicion associated with Vercel URLs. Consider branding share links to align with known and trusted domains.

3. **Porosity Model**: For security, maintain a balance by ensuring critical features and personal data remain behind authentication. Public parts of the BAR, like general descriptions or non-sensitive images, can be visible to unauthenticated users to maintain engagement and curiosity. Ensure this model meets security requirements without sacrificing user experience.

Align these actions with a Wake-Up move to increase breadth in understanding and widen the scope of detection. Be attuned to signal changes, verifying technical pathways without haste. Zen-like patience and clarity will harmonize realms, from virtual mechanics to personal interactions.

*Consulted agents: Shaman, Challenger, Diplomat, Regent, Architect*

---

## Architect Response (structure, URL design)

1. **Preview Failure Diagnosis**: 
   - *Open Graph / Meta Tags*: Ensure that meta tags are properly configured and accessible by crawlers, especially on server-rendered pages, to avoid missing previews on platforms like iOS or Slack.
   - *Redirects*: Verify that campaign-BAR pages do not redirect too quickly or before rendering the preview, as this can lead crawlers to miss preview content.
   - *Client vs Server*: Opt for server-rendered previews so that essential meta data is loaded and visible to crawlers without requiring client-side JavaScript execution.

2. **URL Ergonomics**: 
   - Opt for a custom domain like 'conclave.example.com', which can increase user trust by presenting a more professional and less generic URL.
   - Consider using friendly paths such as '/r/TOKEN' or '/view/TOKEN' to maintain simplicity while conveying the purpose of the link.
   - Implementing a short-link service would be secondary; prioritizing custom domains and intuitive paths addresses trust more directly.

3. **Porosity Schema**: 
   - Create a matrix where general previews of BAR content are fully public and accessible without authentication to support social sharing and discovery.
   - Require authentication for actions like claiming or editing content, where user identity verification is critical.
   - Additional features can be tiered based on user roles (e.g., admin, contributor) with appropriate access control lists.

---

## Regent Response (security, boundaries)

1. **Security Boundaries**: Player Personally Identifiable Information (PII) and other BARs (Blueprints, Artifacts, Resources) must never be exposed without authentication. Campaign internals, especially strategies and unrevealed plot points, should also remain confidential. Safe to show in a share preview are general descriptions of BARs that do not reveal sensitive strategies or specifics. Preview should include title and general objectives without any internal metrics or player-specific data.

2. **Token Semantics**: The share token should grant limited access to a BAR's preview. It should expire within a reasonable time frame (e.g., 24 hours) and can be revoked manually by the creator or system administrators. Tokens should cover specific BARs to prevent unnecessary broad access. Shorter tokens can be considered, but they must be designed to maintain complexity and randomness to avoid predictable patterns.

3. **Crawler Access**: To support social previews like Open Graph, "/bar/share/[token]" should be accessible without authentication specifically for GET requests. However, implement rate limits to prevent abuse (e.g., limit the number of requests per IP address per minute). Abuse detection mechanisms should be in place to block suspicious activities.

---

## Diplomat Response (trust, first impression)

```json
{
  "recommended_instance": null,
  "recommended_campaign_domain": null,
  "onboarding_next_step": null,
  "bar_sharing_suggestions": [],
  "event_recommendations": [],
  "tone": "practical",
  "message": "Certainly! Here's a structured proposal for enhancing BAR share porosity in terms of trust and first impression:\n\n1. **Link Trust**:\n   - **Domain Name**: Utilize a custom domain for shared BAR links instead of generic domains like `vercel.app`. A custom domain would not only look more professional but also appear safer and more connected to your project.\n   - **URL Length**: Keep the URLs concise but meaningful. Avoid long or overly complex URL parameters that might suggest inappropriate tracking.\n   - **Secure Protocol**: Ensure all links are HTTPS, signaling a secure connection.\n   - **Concrete Suggestion**: Implement a URL shortener under your custom domain that retains a recognizable path, e.g., `community-name.event/BAR-name`.\n\n2. **Preview Quality**:\n   - **Unfurled Card Content**: The preview should include:\n     - **Sender Name**: This adds a personalized touch, showing someone specific invites you.\n     - **BAR Title**: Clearly communicates the content of the link.\n     - **Image**: Use an appealing, relevant image to grab attention.\n     - **Campaign Info**: Context about the campaign can help to provide assurance and familiarity.\n     - **Concrete Suggestion**: Implement Open Graph protocol tags to control the preview content shown when sharing links on platforms like iMessage and Slack.\n\n3. **First-touch Framing**:\n   - Frame the invitation with a friendly, informative tone. Rather than saying, \"View a reflection,\" which could be vague, try: \"Join us in exploring this thoughtful insight.\" This approach conveys it's a community piece worth looking into.\n   - **Concrete Suggestion**: Use simple, inviting language that emphasizes community and shared purpose, e.g., \"[Sender Name] invites you to see their latest thought and join our communal reflection.\"\n\nThese enhancements aim to improve the trustworthiness and approachability for your users when sharing BAR reflections."
}
```

---

## Shaman Response (threshold, invitation)

```json
{
  "current_element": null,
  "emotional_channel": null,
  "satisfaction_state": null,
  "narrative_lock": null,
  "shadow_belief": null,
  "recommended_move_type": null,
  "wave_stage": null,
  "guidance": "**Threshold Crossing:** The crossing of a threshold in sharing is a rite of passage that signifies movement from one state of awareness or community into another. The obstructions in this journey resemble the sentinel shadows: suspicious URLs that murmur dangers unseeable, blank previews that speak of mysteries unworthy of exploration, or friction that wears down curiosity like soft earth under relentless rain. To facilitate this crossing, one must illuminate the path: present clear and meaningful incentive imagery or narratives that cast light ahead, ensuring the path is inviting, and the journey is worth the steps taken.\n\n**Preview as Ritual:** In the space between the giver and receiver is the ritual of preview, acting as a microcosm of the broader experience. Here, the seeds of curiosity are sown with care. Allow this taste to be semipermeable—enough substance to whet the appetite and kindle a desire, while safeguarding the deeper mysteries for those willing to embark further. This balance of openness and mystery respects the agency of the traveler, like a whispered promise carried on the wind.\n\n**Belonging Before Commitment:** The welcome that precedes commitment is the hearth at which wayfarers warm themselves, where they feel seen and valued before any oath is sworn. To create this feeling, weave the fabric of the preview with threads of familiarity—use cues that invoke community, shared purpose, or mutual benefit. The balance lies in embracing inclusivity while signaling the value of full participation, much like the humble threshold of a village feast hall, where all are invited to gaze within, and asked only gently if they wish to step through. \n\n### Recommendations\n- Implement clear, visually engaging previews with genuine value displays to reduce entry friction.\n- Design previews to give a tantalizing glimpse into the fuller experience, maintaining some mysteries.\n- Leverage familiar symbols and narratives within previews that resonate with the user's sense of community and belonging before commitment.\n\nThese steps ensure the invitation across the threshold of sharing is a journey embraced with open hearts, carried on waves of belonging and curiosity alike."
}
```

---

## Unified Spec Outline (Sage synthesis)

### Spec Outline for BAR Sharing and Preview Enhancements

#### 1. **Preview Diagnostics and Fixes**
- **Meta Tag Configuration**: Ensure Open Graph and other meta tags are properly configured and accessible by crawlers on server-rendered pages to optimize preview reliability across platforms.
- **Client vs. Server Rendering**: Use server-rendered previews to ensure essential metadata is present for crawlers without reliance on client-side JavaScript.
- **Redirect Handling**: Avoid premature redirects that may impede crawler access to preview content.

#### 2. **URL and Link Ergonomics**
- **Custom Domain**: Implement a custom domain like `conclave.example.com` for share links to enhance trust and professionalism.
- **Short and Intuitive Paths**: Use URLs structured as `/r/TOKEN` or `/view/TOKEN` for simplicity and conveyance of purpose.
- **URL Shortening**: Consider a URL shortener maintaining recognizable paths, e.g., `community-name.event/BAR-name`, under the custom domain.

#### 3. **Porosity and Security Model**
- **Public Accessibility**: General previews of BAR content should remain accessible for unauthenticated users to facilitate engagement and social sharing.
- **Authentication for Actions**: Require user authentication for content claiming or editing, maintaining secure boundaries for user data and strategies.
- **Tokenized Access**: Use share tokens providing limited, expirable access to a BAR's preview, with token complexity and rate-limiting to avoid abuses.

#### 4. **Preview and Invitation Framing**
- **Visual and Narrative Appeal**: Design visually engaging previews with clear, valuable content to invite exploration while retaining some mysteries to motivate deeper engagement.
- **Community Resonance**: Incorporate familiar images and narratives within previews that reflect community purpose and belonging, encouraging deeper involvement.

This synthesis integrates technical, strategic, and community perspectives to ensure a secure yet inviting sharing experience.

---

## Next Steps

1. Diagnose preview failure (crawler access? redirect? meta tags?)
2. Implement link ergonomics (custom domain, short links, etc.)
3. Document porosity model in spec
