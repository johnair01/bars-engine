# Plan: Player Handbook & Orientation System (PHOS)

## Pacing principle (Hexagram 39)

**Deliberate sequencing.** Each phase is independently valuable and must not require later phases to function. Do not rebuild navigation in one sprint. Add connective tissue incrementally; verify it holds before adding more.

---

## Phase 0 — Define success (blocking for all phases)

**Goal:** Produce the canonical player success document. This is the source of truth; everything else derives from it.

1. Write `docs/PLAYER_SUCCESS.md` — what does a successful BARS player look like at 1 session, 10 sessions, 1 campaign? In game terms: emotional contact, move completion, quest throughput, network contribution, developmental growth. No feature names.
2. Write initial handbook outline in `HANDBOOK_DRAFT.md` in this folder — four move sections, one action each.
3. Identify the **three felt-sense copy touchpoints** (must be agreed before Phase 2 code).

**Deliverable:** `docs/PLAYER_SUCCESS.md` + `HANDBOOK_DRAFT.md`. No code yet.

---

## Phase 1 — Handbook entry point (low risk, visible)

1. `/wiki/handbook` page structured by the four moves — static, no data fetching.
2. Each move: one-liner meaning + one action verb + deep link to relevant surface.
3. Link `/wiki/handbook` from `/wiki/player-guides` and from the NOW page's orientation strip (placeholder if strip not yet built).
4. Optional: add subtitle copy to NavBar page headers for NOW / VAULT / PLAY explaining intent.

**Files:** `src/app/wiki/handbook/page.tsx`, update to `src/app/wiki/player-guides/page.tsx`.

---

## Phase 2 — Orientation compass on NOW

1. Add `OrientationCompass` component to NOW (`/`) — non-intrusive strip above main sections.
2. Logic: if player has no quest history → "Start here: capture a charge" (Wake Up); else → "your last active move was X — here is what's next."
3. Data: read from `playerId` → recent `Shadow321Session`, `CustomBar`, `PlayerQuest` (already loaded in `page.tsx`).
4. No new DB schema; derive from existing data.

**Files:** `src/components/dashboard/OrientationCompass.tsx`, update `src/app/page.tsx`.

---

## Phase 3 — Felt-sense scaffolding

1. Three identified touchpoints (from Phase 0 decision): one line of original copy each.
2. Configurable via `AppConfig` flag or static copy with `// TODO: configurable` comment.
3. Link to `/wiki/handbook#clean-up` or `docs/FELT_SENSE_321_PRAXIS.md` from relevant touchpoint.

**Files:** targeted edits in 321/charge/quest unpack components (to be named from Phase 0 research).

---

## Phase 4 — Library → player discovery

1. Admin: add `playerDiscoverable` boolean + `moveContext` string to Quest (or use existing fields if present).
2. Player: "Discover" section on NOW under relevant move — shows 1–2 admin-tagged quests, not a full library.
3. Tie to book analysis pipeline (`praxisPillar` from LPP spec) so book-derived quests surface under correct move.

**Files:** `prisma/schema.prisma` (if new field, run `npm run db:sync`), `src/actions/quests.ts` or similar, `src/app/page.tsx`.

---

## Phase 5 — Navigation (coordinates with PMI)

1. After PMI `SIX_FACE_ANALYSIS.md` is approved, implement PMI's P0 navigation affordances.
2. At minimum: page header copy for NOW / VAULT / PLAY answering "what can I do here?"

---

## File map

| File | Phase |
|------|-------|
| `docs/PLAYER_SUCCESS.md` | 0 |
| `HANDBOOK_DRAFT.md` (this folder) | 0 |
| `src/app/wiki/handbook/page.tsx` | 1 |
| `src/app/wiki/player-guides/page.tsx` | 1 (update) |
| `src/components/dashboard/OrientationCompass.tsx` | 2 |
| `src/app/page.tsx` | 2, 4 (update) |
| Targeted component copy edits (321, charge, quest) | 3 |
| `prisma/schema.prisma` (if FR4 needs column) | 4 |
