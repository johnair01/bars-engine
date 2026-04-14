# Plan: Player signal garden & library charge metabolism

## Implementation order

### Phase 0 — Decisioning (no UI ship)

1. **Persistence spike:** `PlayerSignal` + `GardenSchedule` vs `CustomBar.type = 'signal_draft'` + JSON fields.
2. **Privacy matrix:** who can read signals (player only vs instance steward vs never admin without consent).
3. **Charge policy:** interaction with **one charge per day** — organizer bypass vs **signal-bound micro-charge** on `inputs`.
4. **Write ADR-style subsection** into `spec.md` **Design Decisions** when chosen.

### Phase 1 — Vertical slice (player)

1. Server actions: `createPlayerSignal`, `listPlayerSignals`, `promoteSignalToChargeBar` (contracts in spec).
2. Route: `/garden` or `/hand/garden` (align with [BUO](../bars-ui-overhaul/spec.md) IA when touched).
3. Minimal list UI: seeds / weeds / snooze; link **Promote** → `/capture?prefill=…` or inline charge capture.
4. Telemetry / `VibulonEvent` notes pattern (if no economy change) for “signal promoted.”

### Phase 2 — Spaced repetition

1. Deterministic `nextReviewAt` from a small table (e.g. +1d snooze, +3d seed check, +7d mature).
2. Optional: push-style surface on **NOW** or dashboard card ([DCH](../dashboard-two-channel-hub/spec.md)) — **defer** if scope explodes.
3. Copy pass: tie strings to **compost** and **321** entry points.

### Phase 3 — Library praxis

1. Identify **smallest** library artifact: `QuestThread` excerpt id or `Book` chunk ref from LCG chunker contract.
2. Quest template: 2–3 nodes — “Does this land?” → channel picker → optional 1-line charge text → complete.
3. Aggregate API for librarian role (counts + emotion histogram); **no** raw dump of all player text v1.
4. Optional vibeulon mint: follow **attunement** rules; document amounts in spec FR.

### Phase 4 — Verification & hardening

1. Seed `cert-player-signal-garden-v1` per spec.
2. `npm run check`, `npm run build`; add unit tests for scheduler determinism.

## File impacts (anticipated)

| Area | Files (illustrative) |
|------|----------------------|
| Schema | `prisma/schema.prisma` (if new models) |
| Actions | `src/actions/player-signal.ts` (new), `charge-capture.ts` (policy) |
| UI | `src/app/garden/page.tsx`, components under `src/components/garden/` |
| Library | `src/actions/` or quest templates tying to `QuestThread` / book analyze |
| Admin | `src/app/admin/...` librarian aggregates (Phase 3) |

## Risks

- **Scope creep:** Garden + library + vibeulons + role dashboard = four products. **Ship Phase 1 alone** if needed.
- **Duplicating Vault:** Garden must stay **forward-looking cultivation**, not second vault.

## Related backlog

- **1.74 PSG** — [.specify/backlog/BACKLOG.md](../../backlog/BACKLOG.md)
