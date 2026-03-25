# Tasks: Party mini-game — event game layer

**Spec:** [spec.md](./spec.md) · **Plan:** [plan.md](./plan.md)

## Phase 1 — Static grids (Bruised Banana pilot)

- [x] Add **party mini-game definitions** for `bb-apr4-dance-bingo` and `bb-apr5-scheming-bingo` (9 squares each; copy from stakeholder spec / editorial pass).
- [x] Add **presentational component** `PartyMiniGameGrid` (3×3, read-only checkboxes or static list — no persistence yet).
- [x] Wire grids into **event surface** for Apr 4 / Apr 5 (route or conditional blocks on `/event` — exact placement per product call in implementation PR).
- [x] **UI Covenant:** layout via Tailwind; mood via `cultivation-cards` / card tokens as applicable.
- [x] Document in **spec or code comment** how organizers change copy (file path).

## Phase 2 — Interactive (session persistence)

- [x] Client wrapper: **tap toggles** square id in state; optional **progress** readout.
- [x] **sessionStorage** key scoped by `miniGameId` + date or `eventKey` to avoid cross-event bleed.
- [x] Accessibility: focus states, `aria-pressed` or equivalent for toggles.
- [x] Empty state / reset control (optional).

## Phase 3 — BAR metabolize

- [x] Server action: authenticated player only; validate `miniGameId` + square ids against known definitions.
- [x] `CustomBar.create`: `type` appropriate to vault (e.g. `vibe` or `quest` — align with vault rules), **private** default, **completionEffects** JSON with `grammar: party-mini-game-v1` stamp per spec.
- [x] `revalidatePath` for `/hand` (and `/` if required by existing patterns).
- [x] Copy for CTA: metabolize / “Save to vault” — tone per Diplomat review (avoid gamified currency language).
- [x] Per-square capture: tag **in-game player** (name search) or **guest name**; stamp includes `taggedPlayerId` / `guestName`.

## Phase 4 — CYOA / playstyle (deferred)

- [x] Spec stub only until Phase 1–3 done: optional short CYOA → label; no quest pack routing.

## Close-out

- [x] Check off acceptance criteria in [spec.md](./spec.md).
- [x] Backlog ledger: [.specify/backlog/BACKLOG.md](../../backlog/BACKLOG.md) row **1.45 PMEL**.
