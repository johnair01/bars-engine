# MTGOA Grow Up Check — Day 4

Built 2026-08-21. Route: `/grow-up` → `/mastering-allyship/grow-up`.
**Round 1 is complete with this day.**

## Two authorities, and they disagree

- **The prototype** — `design_handoff/MTGOA Grow Up Check.dc.html`, imported from
  Claude Design project `b6457c63-114e-44c9-8039-494652c5ce64`, plus
  `DAY_4_GROW_UP_PAGE_SPEC_2026-08-20.md`. Most of the authored vocabulary comes
  from here: the fourteen reps and their Game Master affinities, the six
  reservations paired with capacities, the supports, the boundaries, the containers.
- **`MTGOA_DAYS_1_TO_5_HOSTILE_REVIEW_2026-08-21.md`** — newer, and it **wins where
  they conflict**. Its three required changes for Day 4 are all implemented below.

The prototype README's old rule ("the reference wins where a written note
disagrees") no longer holds unqualified. The review is a later decision by the
same authority, not a note about the reference.

## The review's three required changes

### 1. Three equal starting hands, one of which is not knowing

*"'People already trust your taste' can trigger grandiosity and shame at once."*

`GROW_UP_SCOPES` offers **one person** / **a small room** / **I am not sure yet**,
presented as equals. Choosing "not sure yet" opens a panel that routes to Day 1 —
because that is a Day 1 question — while letting the reader continue here if they
want. The route comes from the spine, so it cannot point at an unbuilt day.

The evidence chips reflect this: "not sure yet" does not earn "named the hand I have".

### 2. Capability, support and boundary together

*"Grow Up is collapsed into emotional courage… phrases such as 'risk being useful'
can still make endurance the point."*

The rep screen asks for all three. `GROW_UP_BOUNDARIES` includes **"I don't have the
fuel today"** and **"I'm doing it to be seen"**, and the screen says outright that a
clean "not today" is a capable move. Fuel is a real cost in the book's token model.

### 3. No fake chance

*"If the interface lets a reader choose a Game Master and then shows that face's
sole card, it has abandoned the draw while keeping its aesthetic."*

The prototype dealt face-down gates. **Shipped instead:** the shared `CardDrawRow`,
which deals three of the six face-up with their Game Master already attached — the
same surface every other check uses. This is a deliberate divergence from the
prototype, and the review is the reason.

## Deliberate divergences from the prototype

| Prototype | Shipped | Why |
|---|---|---|
| Face-down Game Master gates, tap to reveal | Three dealt face-up via `CardDrawRow` | Review failure risk 3, above |
| A "dump names" screen collecting real first names | **Removed** | Two reasons. The course foundation note's persistence decision 5 recommends outreach names be categorically excluded from any future save — now enforced by `COURSE_ANSWER_EXCLUDED_KEYS`. And Day 5 already owns naming the person (`aim`), so Day 4 collecting a name list duplicated it while creating the largest private surface in the course for no gain to Day 4's own output. **Reversible if you want it back — this was my call, not the review's.** |
| `envelope()` emitting `{ v: 2, day: 4, … names }` | No local envelope | `createCourseAnswerEnvelope` in the spine is the canonical one, and it strips names. |
| `reminderText` interpolating `s.who` (a typed name) | `composeGrowUpReminder` from canonical strings only | Day 3's invariant: free-typed text never reaches a composed draft. There is no name field now, so it cannot. |
| No analytics | `events.ts` + `/api/grow-up/events` | Parity with every other day. |
| Entry linked `/wake-up`, which 404'd | Day 1 now ships | Resolved earlier this session. |

## Shipped surface

| Piece | Path |
|---|---|
| Flow component | `src/components/grow-up/GrowUpCheck.tsx` |
| Copy + capacity vocabulary (pure) | `src/lib/grow-up/check-content.ts` |
| Outbound attribution | `src/lib/grow-up/outbound.ts` |
| Aggregate events | `src/lib/grow-up/events.ts`, `src/app/api/grow-up/events/route.ts` |
| Canonical page | `src/app/mastering-allyship/grow-up/page.tsx` |
| Short-link alias | `src/app/grow-up/page.tsx` |
| Shared shell + primitives | `src/components/mtgoa-check/CheckKit.tsx` |

Renders bare: no nav bar, no site footer.

## Flow

```text
entry → hand → belief → draw → rep → land → receipt
```

## Invariants (do not change without a new handoff)

- No sign-in, no email gate, nothing persisted.
- **Day 4 has no field for a person's name.** That is load-bearing, not an
  oversight — it is what makes the composed reminder structurally unable to carry one.
- `parseGrowUpAnalyticsEvent` deliberately has **no `beliefKey` and no `boundary`**.
  Which self-sabotaging belief a reader recognises in themselves, and where they
  said they would have to stop, are the most revealing things on the page. `scope`
  *is* recorded, because "I am not sure yet" routing back to Day 1 is a funnel fact
  the course needs to see working.
- Element comes from the move: Grow Up → wood. Purple `--bars-liminal` stays the
  reserved primary-action color.
- Three of six dealt face-up. Never a gate that reveals its sole card.
- A carried card **suggests** reps with a ◇ and never hides the rest.
- The domain rule is stated: `MTGOA_DOMAIN_RULE`, shared with Day 5.
- Reps, supports, boundaries and containers are canonical strings. The reminder is
  assembled from them only.

## Verification

Walked end to end. Confirmed:

- "I am not sure yet" opening its panel and linking to `/wake-up`
- three cards dealt face-up with Game Master badges, no face-down gate
- a carried Challenger surfacing its three ◇ reps first, with all fourteen still choosable
- the receipt linking forward to `/show-up`
- **Day 3's receipt turning its "Day 4 · coming next" into `continue to Day 4 → /grow-up`
  with no edit to `CleanUpCheck.tsx`** — the spine doing the job it was built for
- telemetry carrying scope and canonical card id, and `grow_up_belief_named` firing
  with no belief attached

`npx vitest run` — 764 passed, 3 failed (pre-existing on this branch).

## Prose

Written before `.claude/skills/no-ai-slop` existed, then revised against it. The
copy went through a pass removing "not X, but Y" negation pairing. Run
`python3 .claude/skills/no-ai-slop/scan.py` over any change to this file's copy.
