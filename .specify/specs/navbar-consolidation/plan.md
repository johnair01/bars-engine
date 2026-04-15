# Plan: Navbar Consolidation

## Summary

Reduce navbar items while keeping essential game functions within 6 clicks. Design constraint: minimal nav that satisfies <6 clicks to Gameboard, EFA, Library, Wallet, Create BAR, Market.

## Phases

### Phase 1: Design + Audit

- Document click-distance matrix from current nav.
- Choose Option A (4 items), B (5 items), or C (3 + hamburger).
- Ensure Market and Create BAR reachable via MAP or HOME.

### Phase 2: Implementation

- Update NavBar.tsx: remove or consolidate items per chosen option.
- If Option A: HOME, MAP, WALLET, Disconnect. BARS, MARKET, MOVES, PLAY move to dashboard/Explore/Game Map.
- Add Market link to Game Map if not present (or document path via dashboard).

### Phase 3: Verification

- Click-distance audit from 5 key screens.
- Add cert-navbar-consolidation-v1 if needed.

## File Impacts

| File | Action |
|------|--------|
| src/components/NavBar.tsx | Reduce items; implement chosen option |
| src/app/game-map/page.tsx | Optionally add Market, Create BAR links to reachability |
| .specify/specs/navbar-consolidation/ | spec, plan, tasks |

## Data Model Notes

- No schema changes.
- Nav is client-side; no new API.
