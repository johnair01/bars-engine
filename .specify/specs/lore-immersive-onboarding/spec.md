# Spec: Lore-Immersive Onboarding

## Purpose

Weave the story world (Conclave, nations, archetypes, vibeulons, heist) into onboarding so new users are drawn into the fiction and the campaign actions equally. The onboarding flow should feel like immersive digital theater—players enter the game world before they realize they're making choices that matter.

**Problem**: The onboarding flow doesn't meaningfully draw people into the story world. Lore exists (lore-index, wiki, story_context) but isn't embedded in the experience. Players encounter forms and mechanics before the fiction lands. The Feb 21 party flow is deprecated, but the game world persists; we need to loop in the lore so players get excited for what is also immersive digital theater.

**Practice**: Deftness Development — spec kit first, content-first (story before mechanics), deterministic over AI for structure.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Story before mechanics | Lead with Conclave, heist, nations, archetypes. Show through story, not explanation. Per [story_context.md](../../docs/handbook/world/story_context.md): "Don't explain nations → tell nation stories that players want to inhabit." |
| Story + actions equal | Each onboarding step advances both the fiction and the campaign. No "story section then action section"—they interleave. |
| Lore as narrative source | Use content/lore-index.md, docs/handbook/world/story_context.md, wiki pages as canonical source. Instance.wakeUpContent, showUpContent, storyBridgeCopy pull from or align with lore. |
| Immersive digital theater | Tone: comedic heist (Ocean's 11) + Hitchhiker's Guide wit. Pacing: short passages, one beat per screen. Structure: player enters world before choosing nation/archetype. |
| Surfaces | Chained initiation intro packet, BB_Intro/BB_ShowUp, Event page Wake Up, Instance story fields. Admin-editable so content can evolve. |

## Conceptual Model (Game Language)

- **WHO**: Nations (Argyra, Pyrakanth, Virelune, Meridia, Lamenth), Archetypes (8 playbooks), Game Master faces — introduced through story, not dropdowns
- **WHAT**: The heist, the Conclave, the Robot Oscars — the fiction that makes choices matter
- **WHERE**: Allyship domains — emerge from "how do you want to contribute?" not "pick a domain"
- **Energy**: Vibeulons — emotional energy that moves through the space; introduced as the fuel of the heist
- **Personal throughput**: 4 moves — learned in context of the story ("Wake Up is how you notice what's true before the heist")

## User Stories

### P1: Story-first entry

**As a new player**, I want the first thing I see to drop me into the Conclave and the heist, so I'm excited before I'm asked to choose anything.

**Acceptance**: First passage(s) use story world language (Conclave, heist, constructs, nations, vibeulons). No abstract "Choose your path" without context. Tone matches story_context (comedic heist, Hitchhiker's wit).

### P2: Lore embedded in flow

**As a new player**, I want nations, archetypes, and vibeulons introduced through narrative, so I understand the world without reading a glossary first.

**Acceptance**: Nation/archetype choices are preceded by story beats that make each option compelling. Vibeulons are introduced as "emotional energy that powers the heist." Lore-index terms appear in context; optional wiki links for "Learn more" without breaking flow.

### P3: Story and actions interleaved

**As a new player**, I want each step to advance both the story and my campaign progress, so I never feel like I'm "filling out a form" or "waiting for the good part."

**Acceptance**: Character creation (nation, playbook, domain) is framed as "joining the crew" or "choosing your role in the heist." Donate/sign-up are framed as "contributing to the heist" or "crossing the threshold." No long story block followed by long form block.

### P4: Admin-editable story content

**As a campaign organizer**, I want to edit the story-world copy that drives onboarding, so the fiction stays current and the campaign can evolve.

**Acceptance**: Instance.wakeUpContent, showUpContent, storyBridgeCopy (or equivalent) drive intro nodes. Chained initiation intro packet can use Instance content or a configurable story template. EventCampaignEditor or equivalent surfaces for editing.

## Functional Requirements

### Phase 1: Story-first intro content

- **FR1**: Create or update canonical story-world intro copy that leads with Conclave/heist. Source: story_context.md, lore-index. Target: Instance fields or chained initiation intro packet default.
- **FR2**: First passage(s) of onboarding MUST use story world language. No "Welcome to the app" or "Choose your path" without Conclave/heist/nation/archetype context.
- **FR3**: Tone MUST align with story_context: comedic heist, Hitchhiker's wit, "show through story not mechanics."

### Phase 2: Lore-embedded character creation

- **FR4**: Nation choice MUST be preceded by a story beat that makes nations compelling (e.g., "Each nation channels a different emotional energy. Which calls to you?" with brief flavor per nation).
- **FR5**: Playbook/archetype choice MUST be preceded by story beat (e.g., "How do you approach the heist?" with archetype-as-approach framing).
- **FR6**: Domain choice MUST emerge from "how do you want to contribute to the campaign?" not a bare list.
- **FR7**: Vibeulons MUST be introduced in-story before sign-up (e.g., "Vibeulons are the emotional energy that powers the construct. Complete this flow to earn your starter share.").

### Phase 3: Story + actions interleaved

- **FR8**: No more than 2–3 passages of pure story before a choice or action. Interleave narrative and choice.
- **FR9**: Donate and sign-up nodes MUST use story framing (e.g., "Cross the threshold" / "Join the Conclave" / "Contribute to the heist").
- **FR10**: Progress indicator and vibeulon preview (from 2-Minute Ride) remain; ensure they don't break immersion.

### Phase 4: Admin surfaces

- **FR11**: Instance story fields (wakeUpContent, showUpContent, storyBridgeCopy) MUST drive BB_Intro, BB_ShowUp, and story bridge. EventCampaignEditor or equivalent allows editing.
- **FR12**: Chained initiation intro packet MUST support Instance-sourced or configurable story content when used for Bruised Banana.

## Non-Functional Requirements

- Content is editable without code deploy. Instance fields or admin UI.
- Backward compatible: existing flows continue to work; this spec enhances content, not structure.
- Verification quest: cert-lore-immersive-onboarding-v1.

## Verification Quest

- **ID**: `cert-lore-immersive-onboarding-v1`
- **Steps**: (1) Play through onboarding from Event or campaign. (2) Confirm first passage drops you into story world (Conclave/heist). (3) Confirm nation/archetype choices are story-framed. (4) Confirm vibeulons introduced in-story. (5) Confirm no long "form block" without narrative. (6) Complete flow to dashboard.
- Reference: [cyoa-certification-quests](.specify/specs/cyoa-certification-quests/)

## Dependencies

- [lore-cyoa-onboarding](.specify/specs/lore-cyoa-onboarding/spec.md) (AG) — lore index, wiki
- [two-minute-ride-story-bridge](.specify/specs/two-minute-ride-story-bridge/spec.md) (AH) — story bridge copy, Instance fields
- [auto-flow-chained-initiation](.specify/specs/auto-flow-chained-initiation/spec.md) (DE) — chained initiation structure
- [dashboard-orientation-flow](.specify/specs/dashboard-orientation-flow/spec.md) (DG) — post-signup flow

## References

- [docs/handbook/world/story_context.md](../../docs/handbook/world/story_context.md) — narrative foundation
- [content/lore-index.md](../../content/lore-index.md) — canonical terms
- [src/app/api/adventures/[slug]/[nodeId]/route.ts](../../src/app/api/adventures/[slug]/[nodeId]/route.ts) — BB nodes
- [scripts/seed-chained-initiation.ts](../../scripts/seed-chained-initiation.ts) — chained initiation
- Instance model: wakeUpContent, showUpContent, storyBridgeCopy
