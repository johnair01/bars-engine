# MTGOA Day 8 — Clean Up · The Organization Bottleneck 3-2-1 — design handoff

Imported from Claude Design project **Mastering the Game of Allyship Book**
(`b6457c63-114e-44c9-8039-494652c5ce64`) on 2026-08-26.

- `MTGOA Day 8 - Clean Up Organization Bottleneck 321.dc.html` — the reference. It is a
  **working prototype**: copy, step order, the card overlay, the thread mechanic and the
  receipt composer are all captured there. When a written note below and
  the reference disagree, the reference wins.
- `reference/index.html` — the same flow rebuilt as a runnable standalone page, verified
  end to end (see [Verification](#verification)). Read it to answer "what does this
  actually do", then build the real thing out of `CheckKit` and `CardDraw`.

The prototype links the design system bundle
`_ds/bars-engine-design-system-af69bae5-49fe-4fcd-a2ac-0382919529e4`. Following
[`mtgoa-clean-up-check`](../../mtgoa-clean-up-check/design_handoff/README.md), that bundle
is **not vendored here** — the repo-side mirror is
[`src/styles/bars-tokens.css`](../../../../src/styles/bars-tokens.css), wired globally
through `src/app/globals.css`. It already carries every token and helper class this day
uses, so `reference/index.html` links it directly and needs no new tokens.

## Read this first: Day 8 already ships

`round-two.ts` has a Day 8, live at `/mastering-allyship/course/2/clean-up`, rendered by
the shared `WeekTwoPractice`. **This design replaces it**, the way
[#221](https://github.com/johnair01/bars-engine/pull/221) replaced Day 6.

| | Shipped (`round-two.ts`) | This design |
|---|---|---|
| Frame | the campaign — "this campaign" | the organization, plus an **own-life** fork chosen at entry |
| Shape | one screen, five prompts | six steps: entry → draw → strain → 3-2-1 → condition → receipt |
| Entry | straight into the practice | contract well, plus three side routes (Day 7, Day 3, own life) |
| Strain | one free prompt, "the story that is live" | six canonical starters **and** free text, both skippable |
| Card overlay | `cardPrompts` keyed by card **id** (`CLEAN-SO-SHAMAN`) | `DAY8` keyed by card **num** (`067`–`072`), reworded |
| 2 · talk to it | one textarea | the part gets a **name**, then a two-voice thread |
| Receipt stem | "This **campaign** needs a **structure** that …" | "This **work** needs a **way of organizing** that …" |
| Persistence | none | `localStorage`, key `mtgoa-day8-bottleneck-321` |

The two rows in bold are decisions for the campaign owner, not for the implementer:

1. **Persistence breaks a stated Week 2 invariant.** `mtgoa-week-two/README.md` says
   *"Nothing persisted. Campaign maps, load checks, 3-2-1 passes and artifacts live in
   component state only, and a refresh clears them."* The prototype saves every answer to
   `localStorage` and restores on mount, and gives the reader an explicit "Clear this from
   my device". That is a deliberate change in the design — a 3-2-1 is long enough that
   losing it to a refresh is a real cost — and it needs an explicit yes before it ships.
   Note the repo already persists *day completion* through `markCourseDayComplete` /
   `course-progress-store`; the invariant is about a day's **answers**, which is exactly
   what this design would start keeping.
2. **The receipt sentence changes what Day 8 produces.** The shipped stem yields a
   structural design principle for the campaign. This one yields a condition about how the
   work is organized, phrased so it commits the reader to nothing. Slide 7 of the carousel
   states it as *"A condition, not a plan."* Pick one; the receipt, the carousel and the
   Day 7 door should all say the same thing.

## The flow

Single 640px column, `padding: 26px clamp(16px,5vw,32px) 96px`, on `var(--bars-bg-base)`.
Persistent header on every step: `Week 2 · Skillful Organizing · Day 8 of 30` in `#C9A84C`
left, `clean up · 水` in `var(--bars-water-gem)` right, over a 2px rail filled
`linear-gradient(90deg,#123a5c,var(--bars-water-gem))`.

| Step | Rail | What it does |
|---|---|---|
| `entry` | 0% | The contract; the CTA; three side routes |
| `draw` | 22% | Three of the six `CLEAN-SO-*` cards |
| `strain` | 45% | Six starters plus free text |
| `three` | 70% | The 3-2-1 |
| `principle` | 88% | One condition, two fields |
| `receipt` | 100% | The composed sentence, the record, the doors |

**Entry.** H1 `clamp(29px,5.8vw,41px)`: "The work will inherit the story you build it
from." The contract well (`var(--bars-surface-inset)`, `border-left: 2px solid
var(--bars-water-gem)`) says the reader may let a part answer "I cannot carry this," "I do
not trust this yet," or "I do not know what I need," and that those answers change what a
clean arrangement would require, followed by: *"No role is assigned and nothing here asks
you to delegate. You can end the practice without an action."* Side routes go to Day 7
(`day7Href`), Day 3 (`day3Href`), and an own-life start that sets `field: 'own'`.

**Draw.** Fisher–Yates over the six-card pool. Three-up on desktop, scroll-snap carousel
below 640px (`flex: 0 0 74%`). Poker `aspect-ratio: 2.5/3.5`, `background:
radial-gradient(120% 90% at 78% 8%,#0c2b4c,#03101f 64%)`, `1px solid rgba(201,168,76,.4)`
becoming `2px solid #C9A84C` when chosen. The card face shows the **Day 8 question**; the
deck's own question appears in the sheet under "In the deck:". Sheet closes on Escape.
"Draw again" reshuffles and clears the choice. "Continue without a card" is a full answer.

| # | Face | Card | Day 8 question |
|---|---|---|---|
| 067 | Shaman `#6fd0d0` | Name the Organizing Feeling | What channel is running before you redesign anything? |
| 068 | Challenger `#e8896f` | The 'Only I Can' Story | What would you learn by testing the bottleneck story with one real handoff? |
| 069 | Regent `#e0c25a` | What the System Lacks | What capability or care is missing that another rule will not supply? |
| 070 | Architect `#9fb2c8` | Redirect the Strain | What becomes possible when the charge is worked before the system is designed? |
| 071 | Diplomat `#6fc795` | From Control to Trust | What would real ownership look like here? |
| 072 | Sage `#a99ae0` | What the Breakdown Taught | What lesson needs to change the next arrangement? |

**Strain.** The heading changes with the field: org reads "…how you picture getting
involved?", own reads "…how you picture taking this on?". Six starters, each a toggle:
*Only I can do this. · Nobody will care. · It is faster if I carry it. · If I take this on,
I will disappoint someone. · I do not know what I am allowed to ask for. · Something else.*
Free text wins over the starter when both are present, and **"Something else." selects
without asserting content** — the strain line falls back to the free text or stays empty.

**The 3-2-1.** Three cards, one per person.

- **3 · Face it** (`they`, water) — one 8-row textarea. "Describe the part as 'they.'"
- **2 · Talk to it** (`you`, water) — first a name for the part ("Not a job title — a name
  that fits how they work"), then a thread. Two voice pills, `me` and the part's name;
  Enter sends and Shift+Enter breaks the line; sending flips the voice; every turn has a
  `×`. While the thread is empty, five opener chips are offered and one tap loads the
  draft as `me`. **The part's name is live** — typing it updates the pill, the placeholder,
  every existing bubble label, and the "Be it" lead sentence. With no name it reads "the
  part" everywhere.
- **1 · Be it** (`I`, `#a99ae0` — the one place the page leaves water) — "Finish it: 'The
  smallest true thing I know, need, or can hand off is…'", then "Come back to yourself.
  What shifted?"

Footer: *"A partial 3-2-1 is a complete pass."*

**The condition.** Two fields around fixed text — "This work needs a way of organizing
that…" / "…because the current pattern keeps…" — with placeholders "lets one piece be
handed off without a rescue" and "putting everything through one person".

**Receipt.** The composed sentence with a "copy this" → "copied ♦" button (1.8s revert).
Unfilled halves render `___`, leaving the gap visible. Then the record — the
strain, the three passes (the thread row counts turns and quotes the last one), and "what
shifted" only when it was written — with `— left blank` in muted for anything skipped, and
`◇ looked through {title} · #{num}` when a card was chosen. Doors, all equal weight, under
"only if it fits": Day 7, the organization page, "Use this practice on another situation"
(restarts in `own` mode, keeping the draw), and Day 9 shown as a disabled "soon". Then
"Leave it here for now" → *"Left where it is. Nothing follows this, and nothing is owed."*

## Building it

Follow Day 6. `page.tsx` dispatches `day.day === 6` to `DaySixWakeUpCheck`; Day 8 wants the
same seam and a `DayEightBottleneck321`, with `round-two.ts` keeping the metadata and the
route contract untouched. Compose from what exists: `CheckShell`,
`Step`, `StepEyebrow`, `StepTitle`, `StepBody`, `PrimaryButton`, `OutlineButton`,
`TextButton`, `BackLink`, `PrivacyLine` from `CheckKit`, and `CardDrawRow` / `CardDrawSheet`
from `@/components/deck/CardDraw`. Cards come from `roundTwoCardsFor('clean_up')` — the
canonical six. Call `markCourseDayComplete(8)` when the receipt opens.

`reference/day8-card-pool.json` holds those six cards so the standalone reference runs on
its own. It is a fixture for reading the prototype, and production has no use for it.

Two things the prototype does that the port should keep, because both are load-bearing and
easy to lose:

- The card overlay is keyed by **card number**, while `round-two.ts` keys `cardPrompts` by
  **card id**. Whichever survives, key it once and consistently.
- Live name propagation in step 2. A thread that keeps calling the part "the part" after
  the reader has named it reads as a different, worse practice.

The prototype puts `onClick` on `<span>` and `<div>`; `reference/index.html` uses real
buttons with `aria-pressed` on the toggles, an `aria-label` on each card tile, and a
labelled `role="dialog"` sheet that takes focus and hands it back on close. Keep that
behaviour — `CheckKit`'s primitives already give it for free.

## The carousel

`MTGOA Day 8 - Clean Up Bottleneck Carousel.dc.html` lives in the design project alongside
this day, with slides exported to `exports/day8-carousel/day8-01…08.png` (1080×1350). The
PNGs are past the 256 KiB read cap of the design API, so they stayed in the project.

Day 8 runs the Day 3 palette — `#0a0908` ground, a `rgba(12,30,62,…)` navy wash, a 28px
gold inset hairline, water-gem accents — where Day 7 ran liminal purple. Props: `handle`
(`@wendell_britt`) and `dayUrl`
(`masteringallyship.com/mastering-allyship/course/2/clean-up`).

1. **Cover** — "The standard that says you have to do it *right* is the same one that says you have to do it *alone*."
2. **The fuels** — Urgency. Perfectionism. Guilt. Proving. "Nobody else will." → "Each one moves work. *None of them refills.*"
3. **The mechanic** — "You said yes to one shift. A year later you were the one with the keys." … "That is the arrangement the next volunteer walks into — and the reason *you have not said yes since*."
4. **The turn** — "Before you answer the next ask — or decide you are done answering: let the part carrying the fuel *speak*."
5. **The 3-2-1** — they / you / I, one line each.
6. **Refusal is usable** — "I cannot carry this." / "I do not trust this yet." / "I do not know what I need." → "Those are usable answers."
7. **The condition** — the fill-in-the-blank stem, then "A condition, not a plan."
8. **CTA** — "Run the Organization *Bottleneck 3-2-1*." / "Private. No role. Nobody asking you to sign up again."

## Verification

`reference/index.html` was walked end to end at 430×940 and at desktop width, against the
repo's `src/styles/bars-tokens.css`:

- All six steps forward and back, rail tracking 0/22/45/70/88/100
- Deal, redraw, sheet, choose, continue-without-a-card; Escape closes and restores focus
- The thread: openers, voice toggle, Enter-to-send, remove, and live name propagation to
  the pill, placeholder, bubbles and the "Be it" lead
- Receipt composed with content, and again completely empty (`___`, `— left blank`, "the part")
- Reload restores mid-flow; "Clear this from my device" empties storage
- Restart lands in `own` mode with the draw kept and the choice cleared
- 3-up grid on desktop, snap carousel under 640px; no console errors

**Not verified:** anything inside this repo. This PR adds no code and changes no route, so
`round-two.ts` still serves the old Day 8 at `/course/2/clean-up`.

## Open for the campaign owner

1. Persistence (above) — the invariant question, and the one that blocks the port.
2. Which receipt sentence Day 8 produces — a design principle or a condition.
3. Day 7's receipt links "Work the charge more directly — Clean Up" at the standalone
   Clean Up Check. Day 8 now exists; repoint it when this ships.
4. Day 9 is a disabled "soon" on the receipt. It needs a title before this goes live, or
   the row should come out.

## Files

- `MTGOA Day 8 - Clean Up Organization Bottleneck 321.dc.html` — the design reference.
- `reference/index.html` — runnable standalone build of the same flow.
- `reference/day8-card-pool.json` — the six `CLEAN-SO-*` cards, fixture for the reference.
