# Spec: Sustainability and Onboarding Lore

## Purpose

Add wiki lore documenting the onboarding path (Mastering the Game of Allyship, workshops → coaching → consulting), the financial model (non-profit Patreon + profit licensing), sustainability goals, and the vibeulon economy. This unblocks narrative throughput by providing a coherent story for new users, the financial model, the journey from player to org-level impact, and how the app stays sustainable.

**Dependency context**: The Bruised Banana Residency is being created so that the Mastering the Game of Allyship campaign can be developed. The Bruised Banana Residency is a dependency on developing both (a) Mastering the Game of Allyship and (b) a Bruised Banana Organization instance. This emerged from joint ventures and connections between campaigns and instances.

## Conceptual Model (Game Language)

- **WHO**: Players, coaches, consultants — identity along the support pyramid
- **WHAT**: Quests emerge from participating in the financial model; self-service is intentionally slower
- **WHERE**: Allyship domains — workshops, coaching, consulting operate across domains
- **Energy**: Vibeulons — minted by playing (needle-moving actions) and capital injections (grants, crowdsourcing, pack purchases)
- **Personal throughput**: 4 moves — workshops teach Wake Up; coaching supports Grow Up and Show Up

**Campaign ↔ Instance relationship**: Bruised Banana Residency (campaign) enables Bruised Banana Organization instance and Mastering the Game of Allyship. Joint ventures and connections between campaigns and instances are part of the lore.

**Integral Emergence / AI agents**: AI agents act as NPCs in the game. They can create and resolve quests, make I Ching draws, and (future) create quests that call in archetypes from hexagrams for players to create next. Agents are context-aware by Kotter stage (quest thread or campaign). To other users they appear as regular players. Design goal: real users outpace AI via collaboration and ability to mint vibeulons from their real lives. AI agents can only mint vibeulons by completing story quests — not from capital injections or real-world actions. **Exception**: Agents can acquire vibeulons by being infused through the Admin 3-2-1 shadow process — when admins do the 3-2-1 process (an EFAK move), they mint a vibeulon and can optionally route it to create a new agent or update an existing agent's context.

## User Stories

### P1: Onboarding path page
**As a visitor or player**, I want a wiki page that explains the journey from new user to org-level impact, so I understand the support pyramid and how to move faster through the app.

**Acceptance**: `/wiki/onboarding-path` exists with content: flagship program (Mastering the Game of Allyship), support pyramid (workshops → coaching → consulting), tiered unlocks (intro content → personalized quests + 1:1 support → org integration), quest creation as emerging from financial participation, value proposition ("more fun way to do volunteer management and create open source projects"). Link to Bruised Banana as first Allyship project.

### P2: Sustainability page
**As a visitor or player**, I want a wiki page that explains how the app stays sustainable and how capital flows, so I understand the dual model and vibeulon minting.

**Acceptance**: `/wiki/sustainability` exists with content: dual model (non-profit via Patreon first, profit via service-based subscription later), first sustainability goal (Bruised Banana Residency), vibeulon minting (playing + capital injections: grants, crowdsourcing, pack purchases), Patreon MVP (early access during beta; app eventually free with premium tiers). Links to Bruised Banana and glossary (vibeulons).

### P3: Bruised Banana page expansion
**As a visitor**, I want the Bruised Banana campaign page to explain its role as the first sustainability goal and dependency for Mastering the Game of Allyship, so I understand the campaign's strategic importance.

**Acceptance**: `/wiki/campaign/bruised-banana` includes: sustainability goal framing ("first sustainability goal for the app"), connection to flagship (Bruised Banana as first Allyship project within Mastering the Game of Allyship), dependency context (Residency enables Mastering Allyship campaign + Bruised Banana Organization instance; emerged from joint ventures and connections between campaigns and instances). Links to `/wiki/sustainability` and `/wiki/onboarding-path`.

### P4: Wiki index and lore index
**As a content creator or agent**, I want the wiki index and lore index to include the new sustainability and onboarding terms, so I can reference them consistently.

**Acceptance**: Wiki index (`/wiki`) has a "Sustainability & Onboarding" section with links to `/wiki/onboarding-path` and `/wiki/sustainability`. `content/lore-index.md` includes Mastering the Game of Allyship and any new proper nouns.

### P5: Event page link (optional)
**As a visitor on the Event page**, I want a link to the sustainability or onboarding lore, so I can learn how the app stays sustainable before contributing.

**Acceptance**: Event page Wake Up section includes a link to `/wiki/sustainability` or `/wiki/onboarding-path` (or both via "Learn more" that goes to wiki index).

### P6: Integral Emergence / AI agents page
**As a visitor or player**, I want a wiki page that explains the Integral Emergence vision — AI agents as NPCs, their constraints, and why real users have the edge — so I understand the game design and my advantage.

**Acceptance**: `/wiki/integral-emergence` exists with content: AI agents as NPCs; can create and resolve quests; can only mint vibeulons by completing story quests (not from capital injections or real-world actions); exception: agents can acquire vibeulons via Admin 3-2-1 shadow process infusion; can make I Ching draws; (future) will create quests that call in archetypes from hexagrams for players to create next; agents are Kotter-stage-context-aware (quest thread or campaign); appear as regular players to other users; design goal = real users outpace AI via collaboration + ability to mint vibeulons from real lives. Links to glossary (vibeulons), I Ching guide, Kotter stages.

## Functional Requirements

- **FR1**: `/wiki/onboarding-path` MUST exist with flagship program, support pyramid, tiered unlocks, quest-creation framing, value proposition.
- **FR2**: `/wiki/sustainability` MUST exist with dual model, first goal (Bruised Banana), vibeulon minting sources, Patreon MVP.
- **FR3**: `/wiki/campaign/bruised-banana` MUST include sustainability goal, flagship connection, and dependency context (Residency → Mastering Allyship + BB Org instance; joint ventures, campaigns ↔ instances).
- **FR4**: Wiki index MUST include "Sustainability & Onboarding" section with links to onboarding-path, sustainability, and integral-emergence.
- **FR5**: Lore index MUST include Mastering the Game of Allyship, Integral Emergence, and sustainability-related terms.
- **FR6**: `/wiki/integral-emergence` MUST exist with AI agents vision, constraints, I Ching/hexagram/archetype connection, Kotter context, and human advantage.

## Non-functional Requirements

- No schema changes required.
- Content is static; wiki pages are public (no auth).
- Wiki is the canonical source of truth; Event page and CYOA can link to or excerpt later.

## Out of Scope (v1)

- Patreon integration / subscription infrastructure
- Quest creation gating by tier
- CYOA content changes (wiki is source; CYOA can reference later)
- Verification quest (lore-only; no UX flow to validate)

## Reference

- Bruised Banana onboarding: [bruised-banana-onboarding-flow](../bruised-banana-onboarding-flow/spec.md)
- Lore index: [lore-index-knowledge-base](../lore-index-knowledge-base/spec.md)
- FOUNDATIONS.md (vibeulon economy, 4 moves)
