# Spec: Game Loop Integration

## Purpose

Wire the core game loop so new players can play it: BAR → Quest → Campaign → Completion. Add a single-page Game Loop rule, surface it from the dashboard, and ensure BAR→Quest and Quest→Campaign paths are visible and legible.

**Problem**: The loop (Capture BAR → Extend to Quest → Play → Complete → Vibeulons) is implemented but fragmented. New players lack a unified orientation. Recent Charge has Explore but "Extend to Quest" is buried in the Explore flow. Campaign quest completion is restricted to Gameboard but that routing is not surfaced.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Game Loop rule** | New `content/rules/game-loop.md` — 1-page loop + 4 moves; served by existing wiki at `/wiki/rules/game-loop` |
| **GetStartedPane** | Add Game Loop card as first/primary link; Game Map remains; no schema changes |
| **Recent Charge** | Explore already routes to ChargeExploreFlow (Extend to Quest). Add "Extend to Quest" as explicit label/link on Explore button |
| **Campaign modal** | Add copy: "Campaign quests complete on the Gameboard. Go to Gameboard to finish campaign work." |
| **API surface** | Optional `getGameLoopStatus` for future personalization; Phase 1 uses static content only |

## Conceptual Model (Game Language)

| Dimension | Meaning |
|-----------|---------|
| **WHO** | Player (creator, completer) |
| **WHAT** | Game Loop = BAR → Quest → Adventure → Campaign; 4 moves = how |
| **WHERE** | Capture (/capture), Explore (/capture/explore), Gameboard (/campaign/board), Game Map (/game-map) |
| **Energy** | Vibeulons — minted on quest completion |
| **Personal throughput** | Wake Up, Clean Up, Grow Up, Show Up — each maps to a lobby |

## API Contracts (API-First)

> Phase 1 uses static content. Phase 2 (optional) may add status for personalization.

### getGameLoopContent (Phase 2 — Optional)

**Input**: `{ slug: 'game-loop' }` (or read from content/rules at build time)  
**Output**: `{ title: string; content: string }` — Markdown content for game-loop rule

```ts
// Server Action — optional; Phase 1 reads from content/rules via wiki page
async function getGameLoopContent(): Promise<{ success: true; title: string; content: string } | { error: string }>
```

- **Route vs Action**: Wiki already reads `content/rules/*.md` via `readFileSync` at build. No new API required for Phase 1. If needed later, use Server Action.

### getGameLoopStatus (Phase 2 — Optional)

**Input**: `playerId: string` (from cookie/session)  
**Output**: `{ hasCharges: boolean; hasActiveQuests: boolean; hasCompletedQuests: boolean; recommendedNextStep: 'capture' | 'extend' | 'play' | 'complete' | 'gameboard' }`

```ts
// Server Action — for future GetStartedPane personalization
async function getGameLoopStatus(playerId: string): Promise<
  | { success: true; data: GameLoopStatus }
  | { error: string }
>
```

- **Route vs Action**: Server Action. Internal use only (dashboard, GetStartedPane).

See [deftness-development/reference.md](.agents/skills/deftness-development/reference.md) — Route vs Action Decision Tree.

## User Stories

### P1: Game Loop Rule

**As a new player**, I want a one-page explanation of the loop (Capture → Extend → Play → Complete), so I understand how to play without reading multiple docs.

**Acceptance**: `/wiki/rules/game-loop` exists; content is clear, digestible, and links to Game Map.

### P2: Dashboard Orientation

**As a new player**, I want the Get Started pane to surface the Game Loop first, so I know where to begin.

**Acceptance**: GetStartedPane includes a Game Loop card linking to `/wiki/rules/game-loop`; Game Map link remains.

### P3: BAR → Quest Visibility

**As a player with captured charges**, I want to see "Extend to Quest" as an explicit option, so I know my charge can become a quest.

**Acceptance**: Recent Charge section labels the Explore button as "Explore → Extend to Quest" or shows both; Explore routes to ChargeExploreFlow which creates quests.

### P4: Campaign → Gameboard Routing

**As a player in a campaign**, I want to know that campaign quests complete on the Gameboard, so I go to the right place.

**Acceptance**: Campaign modal (DashboardSectionButtons → CampaignModal) includes copy: "Campaign quests complete on the Gameboard."

## Functional Requirements

### Phase 1: Content + Wiring

- **FR1**: Create `content/rules/game-loop.md` with: 4-step loop (Capture BAR → Extend to Quest → Play → Complete → Vibeulons), 4 moves table, link to Game Map. Ecological tone; ~1 page.
- **FR2**: Add `game-loop` to `VALID_SLUGS` and `SLUG_TITLES` in `src/app/wiki/rules/[slug]/page.tsx`.
- **FR3**: Update GetStartedPane: add Game Loop card as first card in the grid (or prominent position); link to `/wiki/rules/game-loop`.
- **FR4**: Update RecentChargeSection: change "Explore" button label to "Explore → Extend to Quest" (or add tooltip) so the Extend path is explicit.
- **FR5**: Update CampaignModal: add copy explaining "Campaign quests complete on the Gameboard. Go to Gameboard to finish campaign work." Link to `/campaign/board` or `/game-map`.

### Phase 2 (Optional): Personalization

- **FR6**: Implement `getGameLoopStatus(playerId)` Server Action; use in GetStartedPane to show contextual "Next step" (e.g., "You have charges—Extend to Quest").
- **FR7**: Optional: `getGameLoopContent()` if wiki needs server-rendered rule for non-static contexts.

## Non-Functional Requirements

- No schema changes.
- No new env vars.
- Backward compatible: existing routes and components remain functional.
- Content/rules files are committed (per Module Graph Hygiene).

## Verification Quest (required for UX features)

- **ID**: `cert-game-loop-integration-v1`
- **Steps**:
  1. Land on dashboard as new player.
  2. Open Get Started; confirm Game Loop card links to `/wiki/rules/game-loop`.
  3. Open `/wiki/rules/game-loop`; confirm 4-step loop and 4 moves are visible.
  4. Capture a charge; confirm Recent Charge shows "Explore → Extend to Quest" (or equivalent).
  5. Open Campaign modal; confirm copy about Gameboard completion.
  6. Complete quest; receive vibeulons.
- **Narrative**: "Verify the game loop so guests at the party can play: capture, extend, complete, mint."
- Reference: [cyoa-certification-quests](.specify/specs/cyoa-certification-quests/)

## Dependencies

- [Game Map Lobbies](.specify/specs/game-map-lobbies/spec.md) — Game Map exists; Game Loop links to it
- [Charge Capture UX](.specify/specs/charge-capture-ux-micro-interaction/spec.md) — Recent Charge, Explore flow
- [Quest Completion Context Restriction](.specify/specs/quest-completion-context-restriction/spec.md) — Campaign quests complete on Gameboard

## Generative Dependency Analysis

- **Merge check**: Could absorb dashboard-ui-feedback-march-2025 (FY) orientation improvements? Defer; FY is broader.
- **Foundation check**: Game Loop rule becomes the canonical "how to play" entry point; other rules (quests-slots, glossary) remain for depth.
- **Testable artifact**: After implementation, verification quest `cert-game-loop-integration-v1` validates the flow.

## References

- [Game Loop Integration Plan](.cursor/plans/game_loop_integration_plan_fbdb8947.plan.md)
- [FOUNDATIONS.md](../../FOUNDATIONS.md) — Yellow Brick Road, 4 moves
- [GetStartedPane](../../src/components/GetStartedPane.tsx)
- [RecentChargeSection](../../src/components/charge-capture/RecentChargeSection.tsx)
- [CampaignModal](../../src/components/dashboard/CampaignModal.tsx)
