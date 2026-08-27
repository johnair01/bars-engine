# Handoff: Day 10 — Show Up · The Campaign Handoff

Design source: Claude Design project `b6457c63-114e-44c9-8039-494652c5ce64`,
folder `design_handoff_day10_show_up/`. Imported 2026-08-27.

Route: `/mastering-allyship/course/2/show-up`.
Component: `src/components/mtgoa-check/DayTenCampaignHandoff.tsx`.
Copy: `src/lib/mtgoa-course/day-ten.ts` (tested by `__tests__/day-ten.test.ts`).

## Overview

Day 10 closes Week 2 (Skillful Organizing). Days 6–9 were private: notice the
field, open to the load, metabolize the story, grow the capacity. Day 10 is the
act — **place a small structure where another person, or future self, can
actually use it.**

The page ends in one of four honest states — **Placed, Prepared, Returned, Put
down** — and none of them earns a score, a reward, or a role.

## The flow

**Entry** — `Put one useful structure where someone can use it.` Two-paragraph
body, the live-field disclosure, and the collapsed campaign-state panel. Primary:
**Build the handoff**. Other ways in: `Use this in my own allyship life`
(preselects lane A), and `See the current organization work` → `/organization`.

**1 · Draw** — three of the six `SHOW-SO-*` cards from `roundTwoCardsFor('show_up')`,
rendered through the canonical `AllyshipCard` / `CardDraw` pair. Tapping a card
opens the shared sheet, which shows the deck's own question alongside the Day 10
lens. Exits: `Deal again`, `Continue without a card`, and the onward CTA.

**2 · Lane** — two selectable lane panels, five book-promotion starter pills that
set a lane and reveal a blurb, and Lane C: four named return doors to Days 6–9.
Choosing Lane C is a complete response to the page.

**3 · Build** — numbered field cards, all optional, with the design's prompts and
placeholders. Lane A adds a collapsible **Book Handoff Rhythm**. Both lanes render
a live artifact block that rebuilds as the reader types, with the placement
instruction and a copy control.

**4 · Placement** — four state panels. Selecting **Placed** reveals the
lane-appropriate attestation, which must be checked before the page continues.
Selecting **Returned** reveals the four earlier-day doors inline. The onward CTA
is visibly inert until a state is chosen and, for Placed, attested.

**5 · Come Back** — three learning answers, a date field, and a copyable reminder
line. The page never claims it will remind anyone.

**Receipt** — headline switches on the placement state. Two chips: `Day 10
explored` (the only thing written to browser course progress) and the truth state,
rendered as `Placed for future me` / `Placed with others` / `Prepared` /
`Returned` / `Put down`. Then the artifact rows, the played card, the `Choose a
placement` prompt when Prepared, the Day 11 handoff, the next-step routes, and the
four earlier-day doors.

## Implementation gate

Day 10 cannot ship through the generic `WeekTwoPractice`: that component finishes
a day on reaching a receipt whatever the reader built, and treats keeping the work
in one's head as sufficient. Correct for Days 6–9; wrong here.

The dedicated component:

1. records only `Day 10 explored` in browser course progress at the receipt;
2. keeps `Placed for future me`, `Placed with others`, `Prepared`, `Returned` and
   `Put down` as distinct truth states;
3. always offers the four precise earlier-day routes when placement exposes a
   missing move;
4. gates the Placed state behind the reader's own attestation, and asks for no
   screenshots, recipient names, proof of purchase, or proof of reply.

## Resolutions taken against the prototype

| Prototype | Shipped | Why |
| --- | --- | --- |
| Fire-filled primary CTAs; purple reserved for the steward submission | Purple `--bars-liminal` primary buttons; fire carries chrome, rings, card frames, progress | `UI_COVENANT.md`: purple is the primary-action colour, element colours never take it. Day 9 resolved the same conflict the same way. |
| Card lens keyed by deck number #115–#120 | Keyed through `roundTwoDay(10).cardPrompts` | One authority for every Week 2 day's per-card translation, already covered by `round-two.test.ts`. |
| Cards dealt from a copied `deck-data.json` | `roundTwoCardsFor('show_up')` over `move-library.ts` | The deck is authored once. |
| Lane B "shared work" as a new analytics value | UI label from the design, wire key stays `local_team` | The Week 2 event validator already accepts `personal` / `local_team`, and nothing a reader types may widen it. |
| Lane copy referencing an optional steward send | Lane A: "You place it in your own system." Lane B: "This page sends it nowhere." | The submission feature is deferred (below). The page describes what it actually does. |
| Privacy line naming the steward send | The shipped Week 2 line: session-only, nothing stored or sent | Same reason. Change this line when the submission ships. |
| `Start Week 3` behind a `showWeek3` flag | `NextDayHandoff` over `nextCourseDay(10)` | The repo's own gate: Day 11 renders as "coming next" until it ships, so the receipt is wired once and never links at a 404. |

The design's `put down` state was added to the Week 2 analytics enum
(`round-two-events.ts`) so the four states stay distinguishable in aggregate.

## The steward submission

Shipped 2026-08-27, after the two founder decisions the design was waiting on.

### Founder decisions

| Question the design left open | Decision |
| --- | --- |
| Steward response terms | **Read, no reply promised.** "Every handoff is read by a Campaign Steward. Asking for a response does not guarantee one, and no submission creates a role, task, or commitment." No window and no SLA, so the promise stays true on the worst week. |
| Release 1 retention rule | **Kept until withdrawn; withdrawal erases contact.** No expiry while it sits in review. Withdrawing deletes name, contact and region immediately and leaves the artifact anonymous in the campaign record. |
| Email receipt | **Yes, when contact was supplied.** It carries the withdrawal link, so the right survives a closed tab. Anonymous senders keep the on-screen link. |
| Ship state | **Live**, with the retention copy published in the same change. |

Both terms live in one place — `SHOW_UP_TERMS` in `src/lib/mtgoa-course/show-up-handoff.ts` — and are rendered by both the
submission form and the privacy page, so the rule a reader agrees to and the rule we publish cannot drift apart.

### What was built

| Piece | Where |
| --- | --- |
| `ShowUpHandoffSubmission` model | `prisma/schema.prisma` + `prisma/migrations/20260827120000_add_show_up_handoff_submissions/` |
| Domain, terms, parser | `src/lib/mtgoa-course/show-up-handoff.ts` |
| Accountless capability token | `src/lib/mtgoa-course/handoff-token.ts` |
| Server actions | `src/actions/mtgoa-show-up-handoff.ts` |
| Review + confirmation screens | `src/components/mtgoa-check/DayTenStewardSubmission.tsx` |
| Sender control | `src/app/my-handoff/[token]/` |
| Steward inbox | `src/app/admin/mtgoa/show-up/` |
| Published retention rule | `src/app/wiki/privacy/page.tsx#course-submissions` |

### How the privacy boundary is held

`parseShowUpHandoff` reads only the named artifact fields off the payload. The 3-2-1, the load check, body weather,
beliefs and card answers have no column and no parse branch, so they cannot reach the server even if a future caller
passes them. A test asserts exactly that.

Contact lives on `CampaignLead` rather than on the submission, which is what makes the retention rule a delete instead
of a column-by-column scrub: withdrawal deletes the lead, the FK nulls `leadId`, and `senderRegion` is cleared in the
same transaction. A lead is created only when the sender asked for a response **and** consented — an anonymous
submission creates no contact record at all.

The withdrawal token is stored as a SHA-256 hash. The raw token is shown once and emailed when contact was supplied, so
a database read cannot reconstruct anybody's link.

### Reuse boundaries held

- `CampaignLead` — used, for consented accountless identity and follow-up.
- `BookTourHelpInterest` — untouched. Day 10 links to the Book Tour route when the handoff is a Book Tour lead.
- `CollectiveOffer` / `MilestoneNeed` — a steward may still shape a submission into one, as a separate deliberate act.
  No status change on the inbox creates one.
- Course session state — stays private and ephemeral.

### Acceptance criteria

1. A reader submits only the final handoff they explicitly reviewed; private practice never reaches the server. ✅
2. An anonymous submission is steward-visible without creating a contact record; a reply request requires contact and
   consent. ✅
3. Wendell sees submitted handoffs in one private queue at `/admin/mtgoa/show-up`, filtered by status, request and lane,
   and replies through the sender's own route. ✅
4. Every sender, anonymous included, can withdraw through the accountless link. ✅
5. No submission becomes public, a campaign task, or a reward claim without a separate steward decision. ✅
6. The Book Tour route keeps its existing focused intake. ✅

### Still open

- **Week 3 destination.** `Start Week 3` stays unbuilt; `NextDayHandoff` reads "Day 11 · coming next" until it ships.
- **Steward count.** The terms name Wendell as the only current steward. Onboarding a second steward means editing
  `SHOW_UP_TERMS.visibility`, which changes the published page in the same commit.

## Carousel

Eight slides at 1080×1350 on the Day 9 frame, ember radials where Day 9 ran jade.
Slides 1–3 stage the scene, 4 names the ask, 5–6 give the two lanes, 7 is
placement, 8 is the standard plus the route. The caption draft sits under the
board.

The carousel stays in the design project rather than here — this folder vendors
the day page, which is what the build follows. Both live at
`design_handoff_day10_show_up/` in project `b6457c63-114e-44c9-8039-494652c5ce64`:

- `MTGOA Day 10 - Show Up The Campaign Handoff Carousel.dc.html` — the board
- `exports/day10-carousel/day10-01.png` … `day10-08.png` — the rendered slides,
  too large to copy through the design API

## Week 2 invariant

Nothing a reader writes is persisted. A refresh clears the pass. Only the day
number reaches `course-progress-store`, and the analytics envelope has no generic
payload field, so the artifact is structurally unable to reach logging.
