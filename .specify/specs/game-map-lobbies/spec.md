# Spec: Game Map and Lobby Navigation

## Purpose

Implement the Game Map / Lobby design as the primary entry points to the game. Four lobbies map to the 4 moves (Wake Up, Clean Up, Grow Up, Show Up). Players access the game and gameboard through these lobbies. Orientations help players discover how to access each feature.

**Problem**: The four-lobby design (Library, EFA, Schools/Dojos, Gameboard) does not appear anywhere in the UI. Players reach the gameboard from the dashboard but lack a unified map. Adventures are scattered; the design intends the gameboard to be the primary surface for campaign quest completion, with lobbies as the navigation structure.

**Practice**: Deftness Development — spec kit first, API-first, deterministic over AI.

## Four Lobbies

| Lobby | Move | Purpose | Route |
|-------|------|---------|-------|
| **Library** | Wake Up | See what's available; discover content, public BARs, Player Handbook | /library |
| **Emotional First Aid** | Clean Up | Unblock emotional energy; vibeulon moves, grounding tools | /emotional-first-aid |
| **The Schools / Dojos** | Grow Up | Skill capacity; Game Master Schools, developmental quests | /dojos (placeholder) |
| **Gameboard** | Show Up | Do the work; campaign quests, complete quests, contribute | /campaign/board |

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Lobby Hub** | Single Game Map page at `/game-map` or `/lobbies` with four lobby cards |
| **Adventure relationship** | Gameboard = primary surface for campaign quest completion. Adventures (CYOA/Twine) remain as story content; may route to Gameboard |
| **Dojos** | Deferred per quest-library-wave-routing. Lobby links to placeholder or "Coming soon" |
| **Library** | Wake Up lobby. Includes Player Handbook (/docs) + Public BARs (from onboarding-bars-library-fix) |
| **Orientations** | Orientation quests or tooltips explain each lobby. Integrate with dashboard-orientation-flow |

## Conceptual Model (Game Language)

| Dimension | Meaning |
|-----------|---------|
| **WHO** | Player (navigator, completer) |
| **WHAT** | Game Map = four lobbies; each lobby = move-aligned surface |
| **WHERE** | Library (Wake Up), EFA (Clean Up), Dojos (Grow Up), Gameboard (Show Up) |
| **Energy** | Vibeulons — minted on completion; Gameboard is completion surface |
| **Personal throughput** | 4 moves — each lobby maps to one move |

## Functional Requirements

### FR1: Game Map / Lobby Hub UI

- Route: `/game-map` or `/lobbies`
- Content: Four lobby cards—Library, EFA, Schools/Dojos, Gameboard
- Each card: lobby name, move label (Wake Up, Clean Up, Grow Up, Show Up), short description, link to lobby surface
- Mobile-friendly; accessible from dashboard

### FR2: Lobby Routing

- Library → /library (new) or /docs until Library page exists
- EFA → /emotional-first-aid
- Dojos → /dojos (placeholder: "Coming soon")
- Gameboard → /campaign/board

### FR3: Orientations

- Orientation content explains: "The Library is where you Wake Up—discover what's available. EFA helps you Clean Up when stuck. Schools grow your skills. The Gameboard is where you Show Up and complete campaign work."
- Integrate with existing orientation threads (dashboard-orientation-flow)
- Optional: First-visit overlay or guided tour of the four lobbies

### FR4: Dashboard Integration

- Dashboard links to Game Map / Lobby Hub (or Game Map replaces/adjoins current Campaign + Gameboard links)
- Ensure players can reach Game Map from dashboard

### FR5: Adventure Relationship (Documentation)

- Spec documents: All campaign quest completion happens on Gameboard (quest-completion-context-restriction)
- Adventures are narrative/story nodes; may route to Gameboard
- Gameboard = primary; adventures = story content within lobbies

## Non-Functional Requirements

- Backward compatible: existing routes (EFA, gameboard) remain functional
- No schema changes for Phase 1
- Dojos: stub only; full Dojo UI deferred (quest-library-wave-routing)

## Dependencies

- [Onboarding BARs + Library](.specify/specs/onboarding-bars-library-fix/spec.md) — Library with Public BARs (if spec exists)
- [Quest Library Wave Routing](.specify/specs/quest-library-wave-routing/spec.md) — Dojo pool concept
- [Dashboard Orientation Flow](.specify/specs/dashboard-orientation-flow/plan.md) — Post-signup redirect, orientation threads
- [Campaign Map Phase 1](.specify/specs/campaign-map-phase-1/spec.md) — Campaign Map layers (may align)

## Adventure Relationship

**Gameboard = primary completion surface.** Campaign quests (quests generated from the gameboard) can only be *completed* on the Gameboard (`/campaign/board`). When a player picks up a gameboard quest, it may appear on their dashboard or quest wallet—but the completion action must be triggered from the gameboard. See [quest-completion-context-restriction](.specify/specs/quest-completion-context-restriction/spec.md).

**Quests can flow both ways.** Quests that don't start on the gameboard (personal, BAR-derived, etc.) can be appended to gameboard quests. BARs can be put on quests for added context and inspiration.

**Adventures = narrative/story nodes.** Adventures (CYOA/Twine) remain as story content within lobbies. They are not completion points for campaign quests. Adventures may route players to the Gameboard to complete campaign work. The initiation adventure, story nodes, and map exploration live in the Library or as pre-Gameboard flow.

**Alignment**: Game Map lobbies and quest-completion-context-restriction are aligned. The Gameboard lobby is the Show Up surface; campaign quest *completion* is restricted to that surface.

## Non-Goals (v0)

- Full Dojo UI (deferred)
- Replacing adventures entirely (adventures remain as story content)
- Complex lobby-to-lobby routing (simple links only)
