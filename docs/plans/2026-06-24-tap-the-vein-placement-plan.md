# Tap the Vein — UI Placement Plan

**Date:** 2026-06-24
**Status:** Placement decided — NOW-hub daily-ritual panel (primary). Build plan, no code yet.
**Owner:** wendell
**Context:** PR #138 merged the Prisma layer only. There is no page, no API, no nav entry — so the feature is invisible to users. This doc decides *where* TTV shows up and what has to be built to get it there.

---

## 1. The gap PR #138 left

PR #138 (`feat(prisma): TapTheVein DailySession + Task models`) shipped exactly two Prisma models (`TapTheVeinDailySession`, `TapTheVeinTask`) plus migration `20260624160338_add_tap_the_vein`. Its own "Out of scope" list defers: the API routes, auth wiring, and **frontend cutover**. Result: tables exist, nothing reaches the player.

To make TTV user-accessible and self-explanatory, three layers are missing, none of which exist today:

1. **Entry point** — somewhere a player can see "Tap the Vein" and understand what it does.
2. **The page** — `/tap-the-vein` (the daily ritual UI).
3. **The API** — `/api/tap-the-vein/*` to read/write the models from #138.

This plan locks #1 and specs #2–#3 at the level needed to start building.

---

## 2. Placement decision

### Primary surface: a daily-ritual panel on the NOW hub (`/`)

**Why NOW.** TTV is, per the migration spec, a **daily morning ritual** (`active lenses intake → TTV → 321`). The NOW hub (`src/components/now/NowHome.tsx`) is literally "the active loop" / daily check-in, and it already hosts the matching pattern: the **`DailyChargePanel`** — a once-per-day ritual that renders a distinct "already done today → ✓ A yellow brick is paved" state. TTV is the same shape of thing and belongs in the same column, sitting just above Daily Charge so the morning sequence reads top-to-bottom.

**What the player sees.** A panel titled "Tap the Vein" with:
- **Not done today:** a short "what this is" line ("Free-write the morning charge, then commit up to 5 tasks") and a primary CTA → `/tap-the-vein`.
- **Done today:** a completed state mirroring the Daily Charge "paved brick" treatment, summarizing how many tasks were committed, linking back to today's session.

This makes the feature both *usable* (one tap to start) and *self-explanatory* (the panel copy says what it does) — which is the whole ask.

### Why not the other surfaces (and when to revisit)

| Surface | File | Verdict |
|---|---|---|
| **NOW "When you're activated" tools rail** (First Aid · Clean Up · I Ching) | `now/NowHome.tsx:48-52` | No. That rail is for *in-the-moment* activation, not a morning ritual. TTV as a 4th tiny tile buries it and misframes it. |
| **PLAY page "Wake Up" card** | `src/app/adventures/page.tsx` | Good *secondary* later. The page is organized by Personal-Throughput moves and the **Wake Up** slot is currently empty — TTV is the natural Wake Up container, mirroring the 321 "Clean Up" card at `adventures/page.tsx:133-146`. Add once the page exists. |
| **DashboardActionButtons** | `components/dashboard/DashboardActionButtons.tsx:18-73` | Legacy dashboard surface. Optional, low priority. |
| **OrientationCompass** contextual nudge | `components/dashboard/OrientationCompass.tsx:45-119` | Nice-to-have: suggest TTV in the morning before a charge exists. Defer. |
| **Top-level NavBar item** | `components/NavBar.tsx:33-67` | No. Five slots already (NOW/VAULT/EVENTS/PLAY/+BAR); a daily ritual lives *inside* NOW, not beside it. |

---

## 3. Build plan to realize the placement

### Layer A — the page (`/tap-the-vein`)
- New route `src/app/tap-the-vein/page.tsx` (server component), gated by `getCurrentPlayer()` → `redirect('/login')`, matching `src/app/shadow/321/page.tsx:31-32`.
- Renders a client runner (mirror `Shadow321Runner` structure) for the ritual: brainstorm free-write → commit up to 5 tasks → per-task actions (start / complete / carry / compost / upgrade-to-quest).
- `lens*` fields stay empty for now — lenses isn't built (no `/lenses` route or `/api/lenses` exists yet); the models already make these nullable.

### Layer B — the API (`/api/tap-the-vein/*`)
Per migration spec §3c–3i. Minimum to make the page work:
- `GET /api/tap-the-vein/today` — get-or-create today's `TapTheVeinDailySession` + its tasks.
- `POST /api/tap-the-vein/task` — create a committed task.
- `PATCH /api/tap-the-vein/task/:id` — status transitions (validate against the lifecycle state machine; require `compostReason` on compost).
- All routes: `requirePlayer()` + `WHERE playerId = <session>`; 401 unauth, 403 cross-player. Reuse `src/lib/auth.ts`.

### Layer C — the entry point (the decided placement)
- **New component** `src/components/now/TapTheVeinPanel.tsx`, styled to match `DailyChargePanel` (done / not-done states).
- **Wire into** `src/components/now/NowHome.tsx`: add a `getTodayTapTheVein()`-style fetch to the `Promise.all` at `NowHome.tsx:16`, and render `<TapTheVeinPanel ... />` in the `<main>` stack *above* `<DailyChargePanel>` (currently `NowHome.tsx:117-120`).
- Optional follow-up: add the "Wake Up" card to `src/app/adventures/page.tsx` once the page is live.

### Suggested order
1. Layer B (`/today` + `task` + `task/:id`) — unblocks everything.
2. Layer A page wired to B.
3. Layer C panel on NOW.
4. (Later) PLAY "Wake Up" card; OrientationCompass nudge.

---

## 4. Open items before building
- **Auth model for TTV** — confirm cookie `bars_player_id` / `getCurrentPlayer()` is the gate (consistent with 321). Migration spec says yes.
- **Lenses dependency** — confirmed *not* a blocker; ships standalone, brainstorm seed empty until lenses lands.
- **Daily reset semantics** — `sessionDate` is `@db.Date` with `@@unique([playerId, sessionDate])`; the panel's "done today" check keys off today's session existing + `committedTaskCount > 0` (mirror `getTodayChargeTargets` shape in `src/actions/daily-charge.ts`).

---

## 5. One-line answer
**Tap the Vein shows up as a daily-ritual panel on the NOW hub (`/`), directly above Daily Charge — the same once-a-day pattern, in the same place players already look each morning.** Getting it there still requires building the `/tap-the-vein` page and `/api/tap-the-vein/*` routes; the panel is the last wire-up step.
