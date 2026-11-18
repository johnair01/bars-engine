# Lane capacity routing — assignment by ceiling, and a row when nothing is lit

Status: DRAFT — one decision open (D-1). Written 2026-11-18 from the six-face consult in
`COUNCIL/lane-results/2026-11-18-routing-consult.md`.

## Why

`DEFAULT_LANES = ['claude', 'freebuff']` decides which lanes a ticket enters, and its comment says why
DeepAI is excluded: `"DeepAI is deliberately not here … so its throughput and quality can be measured before it
carries work he did not route to it himself."` The exclusion is a pending ruling, not a defect.

What is not deliberate is the distribution. On 2026-11-18, `GET /api/work/lanes` returned:

| lane | deck | held | status |
|---|---|---|---|
| claude | 3 | 40 | dry |
| freebuff | 75 | 0 | live |
| deepai | 0 | 0 | live |
| zo | 0 | 0 | quiet |

601 tickets were ready and one maker held 75 of them while another sat empty. `firstLitLane(lanes, dry)`
already routes by lamp — used when a lane goes dry — but nothing consults deck depth, and nothing speaks
when every lane is dark. A ticket on a dark lane waits silently; the DeepAI lane went a day like that.

## What this changes

Assignment stops being "the default list is the answer" and becomes "the default list is the preference
order, and a ceiling decides when preference yields."

## Requirements

**FR-1 — Routing is a pure function.** Add `routeLane(lanes, lit, depth)` to `src/lib/work/lanes.ts`,
with `lanes` the ticket's ordered lane list, `lit` the set of lanes whose lamp is on, and `depth` a
map of lane → ready + held count. No I/O inside; the caller supplies the numbers.

**FR-2 — Preference, then ceiling.** Walk `lanes` in order and take the first lane that is lit and under
the ceiling. If none is, take the lit lane with the smallest depth. If no lane is lit, return `null` and
the ticket is written as `waiting`, not `ready`.

**FR-3 — The ceiling counts held work.** Depth = ready + held for that lane. Claude's 3-ready-40-held
must not read as idle. Default ceiling 20, overridable by `LANE_DECK_CEILING`.

**FR-4 — `zo` stays out of routing.** The closing ritual's lever (`src/lib/close/lever.ts`) keeps its
monopoly; `routeLane` never returns `zo` unless `zo` is the only lane in the ticket's own list.

**FR-5 — One row per dry spell.** A routing pass that finds no lit lane, or that finds a ready ticket
older than six hours (`STALL_HOURS`) with no live holder — a lane counts as holding only while its
last claim is inside `DRY_MS` (5 h, already in `lanes.ts`) — writes exactly one board row:
`"N ready, 0 lit, oldest is X, lanes: …"`. One row per spell — the row is reused, not repeated per
ticket. Six hours is `STALL_HOURS`, overridable.

**FR-6 — The assignment is explainable.** The ticket records why it landed where it did — `by order`,
`by ceiling`, `smallest deck`, or `no lit lane` — so the board can show the reason without re-deriving it.

## Decision D-1 — open (Wendell)

Does capacity get to override the order, or only reorder within it?

- **A (recommended): ceiling yields the order.** Claude keeps first refusal until it is at 20, then the
  next lit lane takes new work. DeepAI receives volume without being named in `DEFAULT_LANES`.
- **B (strict): the order is absolute.** Capacity reorders only inside `DEFAULT_LANES`; DeepAI stays at
  zero until the list is amended. The dry-spell row (FR-5) still fires, so the stall is at least visible.

FR-2 above describes A. Under B, FR-2's fallback branch is removed and only FR-5 survives.

## Checks

- `npx vitest run src/lib/work/__tests__/` — `routeLane` table: under ceiling takes first; at ceiling
  yields; nothing lit returns null; `zo` only when alone; depth counts ready + held.
- `npx tsc --noEmit` — 0 errors.
- Manual: `GET /api/work/lanes` before and after a ticket is pushed; the deck it lands in is the one
  `routeLane` names when the same numbers are fed to the test.

## Out of scope

No schema change (`WorkTicket.lanes[]` already carries the order). No new service. No per-lane quotas
beyond the single ceiling. No lane reassignment of existing tickets — that is a separate move on
`/api/work/:id/:move` if it is wanted.

## Risks and what it breaks

- **Wendell's stated expectation that an answer routes Claude, then Freebuff.** It stays true only while
  Claude is under the ceiling. Past 20 items, Freebuff takes new work and DeepAI may take some too. That is
  the point of the change and the thing to sign off on.
- **Ceiling set too low** starves Claude of the work it is currently 40-deep in; too high and the deck never
  distributes. 20 is a starting number, not a derived one.
- **A dry-spell row that repeats** turns into noise and gets ignored. One row per spell, reused, is load
  bearing — FR-5 must key the row by the spell, not by the clock.
- **`strict` left as the default** ships nothing while looking shipped. Step 3 of the rollout is the change.

## Build verdict

Custom, and small: roughly 30 lines in `lanes.ts` (one pure function plus the ceiling constant) and one
call-site change at ticket creation. No schema change — `WorkTicket.lanes[]` already carries the order. No
new store for the dry-spell row; it goes through the existing needs-work-done / board writer path.

## Rollout

1. `routeLane` + tests, no call site change — inert, provable.
2. Call site in ticket creation, behind `LANE_ROUTING=ceiling|strict` with `strict` the default for one
   day so the change is observable before it is felt.
3. Flip the default to `ceiling` when D-1 is answered.

## Evidence and provenance

- `origin/main:src/lib/work/lanes.ts` — `DEFAULT_LANES`, `firstLitLane`, `cleanLanes`.
- `GET /api/work/lanes` 2026-11-18 — the table above.
- `GET /api/work/tickets?state=ready` — 601 ready, 75 in freebuff, 0 in deepai.
- PR #720 — DeepAI opens as a lane, deliberately outside `DEFAULT_LANES`.
