# Spec: Clarity and EFA in Initial Flows

## Purpose

Address user feedback: people are unclear on what to do with the game, how to get involved, and how each step connects to Bruised Banana residency progress. Add obvious UI hooks, concise information that doesn't overwhelm, and surface Emotional First Aid more prominently in initial flows.

**Problem**: Users love Emotional First Aid but find it late. They don't understand what to do, how to get involved, or how their actions support the residency. Information is wiki-heavy and scattered.

**Practice**: Deftness Development — spec kit first, content-first (copy over new components), progressive disclosure.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Clarity | One-line "what you can do" / "how to get involved" on landing and event |
| EFA placement | Surface EFA in campaign initiation, dashboard for new players, and event page |
| Progress connection | Add residency progress strip on dashboard and gameboard header |
| Do this next | Replace/augment GetStartedPane with compact "Do this next" strip |
| Overwhelm | Simplify GetStartedPane: 3 bullets max when expanded; wiki links secondary |

## User Stories

### P1: Landing clarity

**As a** visitor, **I want** to immediately understand what I can do, **so** I'm not confused.

**Acceptance**: Landing shows one-line clarity: "Play quests, try Emotional First Aid when stuck, and support the residency."

### P2: Event page — how to get involved

**As a** visitor on the event page, **I want** a clear "how to get involved" strip, **so** I know my options.

**Acceptance**: Event page has a compact strip with 3 options: Play quests, Donate, Try EFA when stuck.

### P3: Dashboard — do this next

**As a** logged-in player, **I want** an obvious "do this next" prompt, **so** I'm not lost.

**Acceptance**: Dashboard shows primary action (pick quest, continue quest, or try EFA) with residency connection.

### P4: EFA in initial flows

**As a** new player, **I want** to see Emotional First Aid early, **so** I can use it when I'm stuck.

**Acceptance**: EFA surfaced in campaign initiation (optional beat) and/or dashboard for new players.

### P5: Residency progress connection

**As a** player, **I want** to see how my actions support the residency, **so** I feel connected.

**Acceptance**: Dashboard and gameboard show "Your progress supports the Bruised Banana residency."

## Functional Requirements

### Phase 1: Landing + Event clarity

- **FR1**: Landing (unauthenticated): Add one-line clarity under CTAs: "Play quests, try Emotional First Aid when stuck, and support the residency."
- **FR2**: Event page: Add "How to get involved" strip with 3 bullets: Play quests on Gameboard, Donate above, Try EFA when stuck (link to /emotional-first-aid).

### Phase 2: Dashboard Do this next + EFA elevation

- **FR3**: Add DoThisNextStrip component: compact strip showing primary action (Gameboard, EFA, or continue quest).
- **FR4**: For new players (no completed quests): prioritize EFA card over Create BAR. Copy: "New here? Start with Emotional First Aid — 2 minutes to unblock."
- **FR5**: DoThisNextStrip includes residency connection: "Your progress supports the residency."

### Phase 3: Campaign initiation EFA beat

- **FR6**: Add EFA option or beat in campaign initiation flow: "Feeling overwhelmed? Try Emotional First Aid first" → links to /emotional-first-aid?returnTo=/campaign/initiation.
- **FR7**: Implementation: new Passage or extend existing initiation content; or add a card before/after initiation.

### Phase 4: Residency progress strips

- **FR8**: Dashboard: Add compact residency strip: "Bruised Banana: Stage X — Your quests move us forward."
- **FR9**: Gameboard page: Add header line: "Campaign quests — completing these supports the Bruised Banana residency."

### Phase 5: Simplify GetStartedPane + nav hook

- **FR10**: GetStartedPane: Collapse by default; show 3 bullets max when expanded (Play quests, Try EFA, Donate).
- **FR11**: Add persistent "Game Map" or "What to do" link in header/nav for logged-in users.

## Non-Functional Requirements

- No schema changes.
- Copy changes only where possible; minimal new components.
- Mobile-friendly: strips and cards work on small screens.

## Verification Quest

- **ID**: `cert-clarity-efa-v1`
- **Steps**: (1) Visit landing as unauthenticated — see clarity line. (2) Visit event — see "How to get involved." (3) Log in as new player — see Do this next, EFA elevated. (4) Visit gameboard — see residency header.
- Reference: [cyoa-certification-quests](.specify/specs/cyoa-certification-quests/)

## Dependencies

- [Bruised Banana Onboarding Flow](.specify/specs/bruised-banana-onboarding-flow/spec.md)
- [Dashboard UI Vibe Cleanup](.specify/specs/dashboard-ui-vibe-cleanup/spec.md)

## References

- [src/app/page.tsx](../../src/app/page.tsx)
- [src/app/event/page.tsx](../../src/app/event/page.tsx)
- [src/components/GetStartedPane.tsx](../../src/components/GetStartedPane.tsx)
- [src/app/game-map/page.tsx](../../src/app/game-map/page.tsx)
- [src/app/campaign/board/page.tsx](../../src/app/campaign/board/page.tsx)
