# Spec: Navbar Consolidation — Minimal Items, <6 Clicks to Essential Functions

## Purpose

Reduce navbar item count while ensuring essential game functions remain within 6 clicks from any screen. Design constraint: **What is the least amount that keeps essential game functions <6 clicks away from any screen a player is on?**

**Problem**: Current nav has 7 items (HOME, BARS, MARKET, WALLET, MOVES, PLAY, MAP) for authenticated users. This overwhelms and fragments attention. Players need quick access to core actions without cognitive overload.

**Practice**: Deftness Development — spec kit first, design constraint–driven, API-first where applicable.

## Design Constraint: <6 Clicks

| Essential Function | Current Path | Clicks from Nav | Target |
|-------------------|-------------|-----------------|--------|
| Dashboard (home) | / | 1 | ≤1 |
| Gameboard (campaign quests) | /game-map → /campaign/board | 2 | ≤2 |
| Emotional First Aid | /emotional-first-aid | 1 (if in nav) or 2 (via MAP) | ≤2 |
| Library | /library | 1 (if in nav) or 2 (via MAP) | ≤2 |
| Wallet (vibeulons) | /wallet | 1 | ≤1 |
| Create BAR | /bars/create | 2 (BARS → create) | ≤2 |
| Market (take quests) | /bars/available | 1 | ≤1 |
| Character | /character | 2 (via Explore modal) | ≤2 |
| Event / Donate | /event | 1 (if in nav) or 2 | ≤2 |

**Observation**: Game Map (`/game-map`) is a hub that reaches Library, EFA, Dojos, Gameboard in 1 click each. If MAP is the primary nav item, all four lobbies are 2 clicks away. Dashboard already has Explore modal (Library, Game Map) and Campaign modal (Gameboard, Event).

## Design Decisions

### Essential Nav Items (Non-Negotiable)

Project identity (Bars-engine) and clarity require these three items:

| Item | Rationale |
|------|-----------|
| **HOME** | Dashboard; primary landing |
| **BARS** | Project is Bars-engine; BARs are core to identity |
| **MAP** or **EXPLORE** | "What to do" — reaches four lobbies (Library, EFA, Dojos, Gameboard) |

Remaining items (WALLET, etc.) are evaluated against the <6-clicks constraint.

### Other Decisions

| Topic | Decision |
|-------|----------|
| Primary hub | MAP or EXPLORE — single "What to do" entry point; reaches 4 lobbies in 1 click |
| Wallet | Keep visible — players check vibeulons frequently; 1 click |
| Admin | CONTROL remains for admin; can be collapsed or secondary |

## Proposed Minimal Nav (Design Options)

### Option A (recommended): 5 items — HOME, BARS, MAP, WALLET, Disconnect

- **HOME** → Dashboard (Explore, Character, Campaign modals)
- **BARS** → /bars (My BARs, Create BAR); Market reachable via BARS or dashboard
- **MAP** → Game Map (Library, EFA, Dojos, Gameboard)
- **WALLET** → Vibeulons
- **Disconnect** → Logout

**Reachability**:
- Gameboard: MAP → Gameboard = 2 clicks ✓
- EFA: MAP → EFA = 2 clicks ✓
- Library: MAP → Library = 2 clicks ✓
- Create BAR: BARS → create = 2 clicks ✓
- Market: BARS or HOME → Market = 2 clicks ✓

### Option B: HOME, BARS, EXPLORE, WALLET, Disconnect

- **EXPLORE** → Opens modal (Game Map, Library) instead of direct MAP link
- Same reachability; modal-first vs page-first

### Mobile

Hamburger or bottom nav for small viewports; preserve explicit items where space allows.

## Design Vision: Nav Bar as BAR

**The Nav Bar is itself a BAR.** The design language and style of the app can eventually be preserved in a BAR that players manipulate in-game. The nav bar embodies the same principles as BARs: bounded, actionable, composable. Future work may treat the nav as a first-class game artifact—configurable, stylable, or even player-customizable within the game world.

This stays conceptual; no implementation in this spec. It informs design consistency (nav should feel like a BAR: compact, purposeful, part of the game).

## User Stories

### P1: Essential functions within 6 clicks

**As a** player on any screen, **I want** to reach Gameboard, EFA, Library, Wallet, and Create BAR within 6 clicks, **so** I'm never stuck.

**Acceptance**: Click-distance audit passes for all essential functions from every major route.

### P2: Reduced cognitive load

**As a** player, **I want** fewer nav items so I'm not overwhelmed, **so** I can focus on playing.

**Acceptance**: Nav shows ≤5 primary items (excluding Disconnect).

### P3: MAP as "What to do"

**As a** player, **I want** one obvious place to understand what to do, **so** I'm not lost.

**Acceptance**: MAP (or equivalent "What to do") is prominent and reaches the four lobbies.

## Functional Requirements

### Phase 1: Design + Audit

- **FR1**: Document current click distances from each nav item to each essential function.
- **FR2**: Minimal nav = HOME + BARS + (MAP or EXPLORE) + WALLET + Disconnect. Satisfies <6 clicks.
- **FR3**: Ensure Market and Create BAR are reachable in ≤3 clicks from HOME or MAP.

### Phase 2: Implementation

- **FR4**: Implement chosen option; reduce visible nav items.
- **FR5**: BARS provides path to Market and Create BAR. MAP/EXPLORE provides path to four lobbies. Document reachability.
- **FR6**: Mobile: preserve <6 clicks; consider hamburger or bottom nav for small screens.

### Phase 3: Verification

- **FR7**: Click-distance matrix: from 5 key screens (/, /game-map, /campaign/board, /emotional-first-aid, /wallet), verify each essential function is ≤6 clicks.
- **FR8**: No regression: existing flows (Explore modal, Campaign modal, dashboard links) remain functional.

## Non-Functional Requirements

- No schema changes.
- Backward compatible: deep links to /bars, /bars/available, /hand/moves, /adventures continue to work.
- Mobile-friendly: consolidated nav works on small viewports.

## Verification Quest

- **ID**: `cert-navbar-consolidation-v1`
- **Steps**: (1) Nav includes HOME, BARS, and MAP or EXPLORE. (2) From dashboard, reach Gameboard in ≤2 clicks. (3) From Gameboard, reach EFA in ≤2 clicks. (4) From any screen, reach Wallet in ≤2 clicks. (5) Nav shows ≤5 primary items (excluding Disconnect).

## Dependencies

- [Clarity and EFA in Initial Flows](.specify/specs/clarity-efa-initial-flows/spec.md) — MAP already in nav
- [Game Map and Lobby Navigation](.specify/specs/game-map-lobbies/spec.md)
- [Dashboard Header: Explore, Character, Campaign](.specify/specs/dashboard-header-explore-character-campaign/spec.md)

## References

- [src/components/NavBar.tsx](../../src/components/NavBar.tsx)
- [src/app/game-map/page.tsx](../../src/app/game-map/page.tsx)
- [src/components/dashboard/ExploreModal.tsx](../../src/components/dashboard/ExploreModal.tsx)
