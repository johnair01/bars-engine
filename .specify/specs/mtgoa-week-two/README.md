# MTGOA Week 2 — Skillful Organizing, Days 6–10

Built 2026-08-21. Routes: `/mastering-allyship/course/2/{move}`.

Authority: `MTGOA_WEEK_2_SKILLFUL_ORGANIZING_DAYS_6_TO_10_DRAFT_2026-08-21.md`
and `MTGOA_COURSE_WEEK_2_AND_ORGANIZATION_SURFACES_SPEC_2026-08-21.md`.

## Why these are data rather than five components

Week 1's five days were each authored separately, so each got its own component
and its own `check-content.ts`. Week 2's spec gives every day the same shape — a
named practice, private prompts, a three-card hand from that move's six Skillful
Organizing cards, a receipt. So the days are data in `round-two.ts` and one
component renders them.

That is also what makes rounds 3–6 tractable: a new round is a table, not five
new components.

| Piece | Path |
|---|---|
| The five days | `src/lib/mtgoa-course/round-two.ts` |
| Public campaign state | `src/lib/mtgoa-course/organization-state.ts` |
| Aggregate events | `src/lib/mtgoa-course/round-two-events.ts`, `src/app/api/week-two/events/route.ts` |
| Flow component | `src/components/mtgoa-check/WeekTwoPractice.tsx` |
| Route | `src/app/mastering-allyship/course/[round]/[move]/page.tsx` |
| Shared shell | `src/components/mtgoa-check/CheckKit.tsx` |

## The route contract, finally served

The spine has declared `/mastering-allyship/course/{round}/{move}` since it was
restored, and nothing served it. This is that route.

| Request | Behaviour |
|---|---|
| `/course/1/{move}` | 307 → the short campaign alias (`/wake-up`, …) |
| `/course/2/{move}` | 200, renders the Week 2 day |
| `/course/3..6/{move}` | 404 — undecided, so nothing is rendered |
| `/course/2/{unknown}` | 404 |

Round 1 keeps one canonical URL because its pages double as campaign landing
pages. Week 2 has no short routes: the spec reserves them for the first loop
until a public navigation convention is approved.

It is a Server Component, so metadata and the public organization-state read
happen server-side and only serializable public state crosses into the client.

## The element still comes from the move

Day 6 is earth, 7 liminal, 8 water, 9 wood, 10 fire — identical to the Week 1 day
that shares each move. A reader walking the second loop should recognise the
colour of Clean Up.

## What the campaign publicly says about itself

`organization-state.ts` is the single source for the **What is already happening**
panel. Every field must be a fact the campaign owner has approved.

**Nothing is approved yet** — the Week 2 spec leaves it an open decision — so the
module ships honest: no workstreams, no participation paths, `localTeams` and
`recognition` both `planned`, and no CTA anywhere. The panel says plainly that
every contribution route is closed and sends the reader to the personal lane.
That is what the spec requires: *"It never creates a fictional campaign vacancy."*

The `notCurrentlyTrue` list is deliberate. A reader deciding whether to organize
deserves to know what is absent as plainly as what exists.

To publish real state, fill the fields in and flip the relevant `status`. Tests
pin the publication rules: dates present, nothing `open` without a real route,
no reward promised while its terms are undecided, `/nonprofit` linked rather than
paraphrased.

## Day 10's two lanes

The reader picks one and builds one artifact:

- **My allyship life** → an **Allyship Rhythm** (practice, place, support, boundary, return)
- **A local book team** → a **Book Campaign Handoff** (purpose, audience, one next action, owner, terms, return)

Both assemble from the reader's own words into a copyable block. It is never
sent. Picking the team lane while nothing is open shows the closed-route note and
still lets the reader build a handoff for a group they already belong to.

## Invariants (do not change without a new handoff)

- Nothing persisted. Campaign maps, load checks, 3-2-1 passes and artifacts live
  in component state only, and a refresh clears them.
- `parseRoundTwoAnalyticsEvent` has no generic payload field. The spec permits
  exactly route view, card id, redraw/skip, public-link clicks and receipt state.
- **Prepared is not made.** Same rule as Day 5: a built thing nobody can use yet
  is not a finished one.
- The public panel is not personal persistence and must never imply the course
  remembers a reader's work.
- A solo practice is legitimate. "Owner: me" is a valid answer, and the team lane
  is never the graduation requirement.
- No recruitment without a specific role, time shape, decision rights, and
  permission to decline.
- Every day draws from its move's six `*-SO-*` cards through the canonical
  `AllyshipCard`. Never a subset, never a fork.

## Verification

Walked Days 6 and 10 locally. Confirmed the state panel's four required elements
(current truths, what is absent, the closed-route note, updated/review dates),
the full route contract in the table above, the lane fork, the Book Campaign
Handoff assembling from typed input, the blocked-route answer pointing at Day 6's
real route, and Day 11 rendering as "coming next" at the round-3 boundary.

Telemetry over a full Day 10 run carried only day number, lane, state and return
target — no purpose, owner or artifact text.

`npx vitest run` — 782 passed, 3 failed. The 3 are pre-existing on main in
`alchemy-engine/e2e-arc-dissatisfied-to-epiphany.test.ts`.

## Still open

Both are the spec's own open decisions, and both are blocked on the campaign
owner rather than on code:

1. The approved facts for the **What is already happening** panel — actual
   projects, contribution routes, decision contact, any live local-team
   invitation.
2. Which book-copy rewards can be operationally supported, under what terms.
   The course deliberately says nothing about rewards until those terms are real.

Not built: the `/wiki/mastering-allyship/campaign-state` page the panel links to.
