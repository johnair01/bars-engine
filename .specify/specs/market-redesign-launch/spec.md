# Spec: Market Redesign for Launch

## Purpose

Redesign the Market page for the current launch. The Market is where **player-created quests** (quests players make for each other) live. System-generated quests that move the campaign forward live in **Adventures**. Make it easy to filter quests and explore what people want.

## Conceptual Model (Game Language)

| Location | Content | Schema |
|----------|---------|--------|
| **Market** | Player-created quests (commissions, BARs players make for each other) | CustomBar with `isSystem: false` |
| **Adventures** | System-generated quests (Twine stories, certification, campaign-forwarding) | TwineStory + CustomBar with `isSystem: true` |
| **WHERE** | Allyship domain filter | GATHERING_RESOURCES, DIRECT_ACTION, RAISE_AWARENESS, SKILLFUL_ORGANIZING |
| **WHO** | Creator identity | Nation, Archetype (playbook) |
| **Energy** | Reward | Vibeulons |

**Separation of concerns**: Market = peer-to-peer quests. Adventures = guided/campaign content. Nav shows "PLAY" for Adventures on all breakpoints.

## User Stories

### P1: Market shows only player-created quests
**As a player**, I want the Market to show only quests that other players created for each other, so I'm browsing peer commissions, not system content.

**Acceptance**: Market (`/bars/available`) fetches and displays only CustomBars with `isSystem: false`. System quests (certification, Q-MAP containers, etc.) do not appear in Market. Admins see the same; Graveyard remains admin-only for completed cert quests.

### P2: Easy filtering
**As a player**, I want to filter quests by allyship domain, nation, archetype, and search text, so I can find quests that match my interests.

**Acceptance**: Filter UI is prominent and easy to use. Filters: search (title/description), allyship domain (pill or dropdown), nation (creator), archetype (creator). Clear-all is visible when any filter is active. Filters persist during session (client state).

### P3: Explore quests people want
**As a player**, I want to browse and discover quests in a way that makes it easy to see what people are offering and what resonates, so I can find work I want to do.

**Acceptance**: Quest cards are scannable: title, short description, creator identity (nation/archetype), reward, domain. Layout supports quick scanning (grid or list). Empty state guides when no quests match.

### P4: Nav shows Play on all breakpoints
**As a player**, I want the Adventures link to show "PLAY" on both desktop and mobile, so I consistently see where to play.

**Acceptance**: NavBar link to `/adventures` displays "PLAY" on both mobile and desktop breakpoints (no carrot-only on mobile).

### P5: Campaign context when relevant
**As a player**, when an active instance exists, I want to see the current campaign stage (e.g. "Stage 2: Coalition") so I understand the context.

**Acceptance**: Market header shows campaign stage indicator when `activeInstance` exists. Optional: brief "Choose your campaign path" for domain preference.

## Functional Requirements

- **FR1**: `getMarketContent` MUST filter quests to `isSystem: false` only. No system quests in Market for any user.
- **FR2**: Market page MUST provide filter UI: search input, allyship domain pills, nation pills, archetype pills. Clear-all when any filter active.
- **FR3**: Market page MUST show quest cards with: title, description (truncated), creator nation/archetype, allyship domain, reward. "Details & Accept" or equivalent CTA.
- **FR4**: NavBar link to `/adventures` MUST display "PLAY" on both mobile and desktop breakpoints (remove conditional that shows ▶ on mobile).
- **FR5**: Market header MUST show active instance stage (e.g. "Stage 2: Coalition") when instance exists. Campaign path form remains optional/collapsible.
- **FR6**: Empty state when no quests match: "No quests found" + Clear filters CTA. When no player-created quests exist: "No commissions yet. Create one to get started." with link to create.

## Non-functional Requirements

- Mobile-first: filters and cards work well on small screens.
- Touch targets: filter pills and buttons min 44px.
- No schema changes.
- Graveyard (admin-only) remains for completed cert quests; consider moving or removing if cert quests live elsewhere.

## Out of Scope (This Spec)

- Kotter stage filter in Market (instance stage already filters server-side; client-side stage filter optional for future).
- Sorting (e.g. by reward, date, popularity).
- Packs in Market (keep or remove; decide separately).
- Q-MAP container quests: if they are system quests, they move to Adventures. If they are "hubs" for player subquests, clarify in follow-up.

## Reference

- Market page: [src/app/bars/available/page.tsx](../../src/app/bars/available/page.tsx)
- Market actions: [src/actions/market.ts](../../src/actions/market.ts)
- NavBar: [src/components/NavBar.tsx](../../src/components/NavBar.tsx)
- Allyship domains: [src/lib/allyship-domains.ts](../../src/lib/allyship-domains.ts)
- Campaign Kotter: [.specify/specs/campaign-kotter-domains/spec.md](../campaign-kotter-domains/spec.md)
- Bruised Banana Quest Map: [.specify/specs/bruised-banana-quest-map/spec.md](../bruised-banana-quest-map/spec.md)
