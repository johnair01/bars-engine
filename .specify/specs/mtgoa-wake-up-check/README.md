# MTGOA Wake Up Check — Day 1

Built 2026-08-21. Route: `/wake-up` → `/mastering-allyship/wake-up`.

**No design prototype exists for Day 1.** Days 2, 3 and 4 each have a
`.dc.html` reference in the Claude Design project; Wake Up does not. This was
built to two authorities instead:

- **Content:** `MTGOA_30_DAY_COURSE_FOUNDATION_DAYS_1_TO_3_2026-08-19.md`, the
  "Day 1 — Wake Up" section. Its six unpacking questions are reproduced in order
  in `src/lib/wake-up/check-content.ts`, including Q5's specific job (make the
  worldview under the dissatisfaction visible) and Q6's (surface the reservation,
  not diagnose the reader).
- **Form:** the shipped Clean Up Check. Same shell, same draw, same privacy
  boundary, same receipt shape.

If a Day 1 prototype is ever authored, it becomes the authority the way the
Clean Up and Grow Up references are for their days.

## Shipped surface

| Piece | Path |
|---|---|
| Flow component | `src/components/wake-up/WakeUpCheck.tsx` |
| Copy + the six questions (pure) | `src/lib/wake-up/check-content.ts` |
| Outbound attribution | `src/lib/wake-up/outbound.ts` |
| Aggregate events | `src/lib/wake-up/events.ts`, `src/app/api/wake-up/events/route.ts` |
| Canonical page | `src/app/mastering-allyship/wake-up/page.tsx` |
| Short-link alias | `src/app/wake-up/page.tsx` |
| Shared shell + primitives | `src/components/mtgoa-check/CheckKit.tsx` |
| Deck draw (shared with `/open-up`, `/clean-up`) | `src/components/deck/CardDraw.tsx` |

Renders bare: no nav bar (`Chrome.BARE_ROUTES`), no site footer
(`footer-surfaces.FOOTER_EXCLUDE_EXACT`).

## `CheckKit` — why Day 1 introduced it

Days 2 and 3 shipped as standalone components, each with a private copy of
`Step` / `StepFooter` / `PrimaryButton` / `OutlineButton` / `Chip` / `SelectRow`.
That is tolerable at two days and untenable at thirty, and the course spine had
just been restored specifically so days could be strung together.

So the primitives now live once in `src/components/mtgoa-check/CheckKit.tsx`.
A day supplies only what is its own: the element accent, the chrome label, and
its screens. `CheckShell` publishes the accent as `--check-accent`, so the focus
rings and the progress bar pick it up without another prop.

**`CleanUpCheck.tsx` and `OpenUpCheck.tsx` were deliberately not refactored onto
the kit in this change** — they are shipped and reviewed, and rewriting them is a
separate, reviewable change. The kit was extracted from `CleanUpCheck` verbatim,
so that migration should be mechanical when someone takes it.

## Flow

```text
entry → orientation → q1…q6 → draw → receipt
```

Ten screens including entry and receipt. Back on every step. Every field and the
whole draw are skippable — a visitor can reach the receipt having answered nothing.

The six questions in order: creation, satisfaction, direction, dissatisfaction,
worldview, reservation. Q3 and Q6 are selections; the other four are private free
text. Q6 offers the book's six self-sabotaging beliefs, the same six Days 3 and 4
present — a reader meets these lines three times across round 1, on purpose.

## Invariants (do not change without a new handoff)

- No sign-in, no email gate, nothing persisted. The six answers live in component
  state and are read back only on the receipt.
- **Day 1 composes nothing outbound.** Unlike Days 2 and 3 there is no share
  draft, so no function in `check-content.ts` accepts free text at all. Keep it
  that way: awareness is the output, not a post.
- `parseWakeUpAnalyticsEvent` has no generic payload field. `questionNumber` is a
  position in the sequence (1–6, validated), so telemetry can say how far someone
  got and nothing about what they said.
- Element comes from the move: Wake Up → earth (`--bars-earth-glow`, `#e0a93b`
  lift). Purple `--bars-liminal` stays the reserved primary-action / selection
  color. Gold `#C9A84C` is the only non-token brand accent.
- All 24 canonical Wake Up cards are in the draw — never a marketing subset.
  Cards render through `AllyshipCard`; the draw is the shared `CardDrawRow` /
  `CardDrawSheet`. Do not fork the card.
- No verdict, score, streak, readiness label, or personality result. A direction
  of "stuck" is not worse than "flowing."
- The forward handoff comes from `nextCourseDay(1)`, never a hardcoded href — so
  the receipt cannot outlive the day it points at. It renders through
  `NextDayHandoff` in `CheckKit`, shared with the Clean Up Check.
- Receipt copy, verbatim: "closing the tab is also a complete move."

## Verification

Walked end to end at 1280×720 and 375×812: all ten screens, the draw, the card
sheet, carry, and the receipt. No console errors, no horizontal overflow.
Telemetry observed over a full run was position + route + canonical card id only
— none of the six typed answers appeared in any payload.

`npx vitest run` — 728 passed, 3 failed. The 3 failures are pre-existing on this
branch (`alchemy-engine/e2e-arc-dissatisfied-to-epiphany.test.ts`).
