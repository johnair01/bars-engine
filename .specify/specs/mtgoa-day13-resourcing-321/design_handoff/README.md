# Handoff: Day 13 — Clean Up · The Resourcing 3-2-1

Route the day and the carousel point at: `/mastering-allyship/course/3/clean-up`.

Week 3 · Gather Resources · Day 13 of 30. Released 2026-09-02 (midnight EDT).

## Scope of this folder

This vendors the **social copy** for Day 13 — the Instagram carousel spec and the
Facebook post. The interactive practice already shipped in this same change:

| Piece | Where |
|---|---|
| Copy, starters, openers, the lens, the missing-move composer | `src/lib/mtgoa-course/day-thirteen.ts` |
| The in-progress draft (on-device, cleared at the receipt) | `src/lib/mtgoa-course/day-thirteen-store.ts` |
| The day | `src/components/mtgoa-check/DayThirteenResourcingPart.tsx` |
| Dispatch | `page.tsx`, on `three.day === 13` |
| The row (route, metadata, card readings) | `src/lib/mtgoa-course/round-three.ts` |
| Tests | `src/lib/mtgoa-course/__tests__/day-thirteen.test.ts` |

## The day, in one paragraph

Day 11 counted what is in reach. Day 12 held one resource question long enough to
feel it. Day 13 takes the part of you that gets loud the moment a resource has to
move — the one that would rather cover it quietly than ask, or that treats one more
request as a debt — and runs a short 3-2-1 on it. The reader draws one of the six
Clean Up · Gathering Resources cards as a lens, names the strain, faces the part as
*they*, talks with it under a name they give it, speaks as *I*, and then names one
**missing move**: the small thing they could do the next time a resource has to move.
Clean Up asks *what move is missing?*, so the day ends there — not in a plan.

Nothing is sent. The pass is kept in `localStorage` while the practice is open and
cleared at the receipt, the same on-device bend the founder approved for Day 8's
3-2-1 on 2026-08-27. No slide, and no screen, asks anyone to give, receive, or promise.

## The mechanic, as the day builds it

Six steps, tracked by the rail: `entry → draw → strain → three → move → receipt`.

- **The strain** offers six canonical starters, each a toggle, all skippable, with
  free text that wins when both are present. *"Something else."* selects without
  asserting content. The six: *I should be able to do this without help. · Who am I
  to ask for that? · It is easier to give than to receive. · There is not enough to go
  around. · If I ask, I will owe them. · Something else.*
- **The 3-2-1** is three cards, one per person. **3 · Face it** describes the part as
  *they*. **2 · Talk to it** gives the part a name (The Provider, The One Who Covers
  It, The Small Ask) and then a two-voice thread; the name is live and updates every
  bubble label, the voice pill, and the *Be it* lead. **1 · Be it** drops the dialogue:
  *"The smallest true thing I know, need, or could receive is…"*, then *"What shifted?"*
- **The missing move** is the receipt stem, two fields around fixed text:
  *"When a resource has to move, the missing move is to ___, instead of ___."* Unfilled
  halves render `___`, so the gap stays visible. It commits the reader to nothing.

## The six Clean Up · Gathering Resources cards, and Day 13's reading of each

These readings live in one place — the `cardPrompts` map on the Day 13 row in
`round-three.ts`, keyed by card id — and the component reads them straight from there,
the way Days 11 and 12 do. There is no separate per-Face lens table.

| Face | Card (`CLEAN-GR-*`) | Day 13's lens |
|---|---|---|
| Shaman | Name the Money Feeling | Which feeling is running the money here — fear, anger, sadness, numbness, or reach? |
| Challenger | The Money Story | Which story about deserving or scarcity are you treating as a fact? |
| Regent | The Capability You're Missing | Which capability is offline — to ask, to receive, to rest, to let it be enough? |
| Architect | Move the Charge | If you moved this charge, would you transcend it, translate it, or set it down? |
| Diplomat | Fear Into Invitation | Which feeling would the ask come from if it served the other person? |
| Sage | What the Shortfall Taught | What does this shortfall teach you that you get to keep? |

## Instagram carousel

Eight slides at 1080×1350. **Clean Up runs water** — the UI covenant is
element=color, and Clean Up's element is water in every round, so this day runs
water (`--bars-water-glow` / `#3fa9c4`), the same water Day 8 uses, rather than
Week 3's earth. The chrome reads `week 3 · gather resources · day 13 · 水`. The one
place the deck leaves water is slide 6's first-person line, in the soft violet the
practice uses for *Be it*.

This deliberately breaks the Week 3 earth grid on Instagram for one post, on the
same principle the in-app page follows: a Clean Up day is water wherever it appears.
If the grid cohesion matters more than the element read for the social series, that
is the founder's call to make when the board is built — the in-app page stays water
regardless.

Props, matching Day 11: `handle` (default `@wendell_britt`) and `dayUrl`
(default `masteringallyship.com/mastering-allyship/course/3/clean-up`).

The promise: *You keep trying to fix how you resource this. First let the part that
carries it speak.*

| # | Beat |
| --- | --- |
| 1 | Title — `What move are you missing when a resource has to move?` |
| 2 | The reflex — you cover the shortfall quietly, you round down the ask, you would rather give than receive. It keeps the work moving. *None of it refills you.* |
| 3 | The part — there is a part of you that gets loud the moment a resource has to move. It has been doing this job a long time. Before you redesign your resourcing, hear it. |
| 4 | The move — `day 13 · clean up` asks you to **let the part describe the job**, not to build a plan. |
| 5 | **The strain** — six starters a reader might be carrying: *I should be able to do this without help · Who am I to ask? · It is easier to give than to receive · There is not enough to go around · If I ask, I will owe them.* |
| 6 | **The 3-2-1** — `they` (describe the part) · `you` (name it, and talk) · `I` (*the smallest true thing I know, need, or could receive is…*), the `I` line in violet. |
| 7 | **The missing move** — the fill-in-the-blank stem: *When a resource has to move, the missing move is to ___, instead of ___.* Then: *A move, not a plan.* |
| 8 | The question and the route — `Let the part speak before you fix the budget.` → `masteringallyship.com/mastering-allyship/course/3/clean-up` |

Slides 1–3 name the reflex and the part. Slide 4 names the move. Slides 5–7 carry
the instrument. Slide 8 is the door. No slide asks anyone to give, ask, or promise.

### Caption (Instagram)

> Gather Resources does not start with the ask. It starts with the part of you that
> gets loud the second a resource has to move — the one that covers the shortfall
> quietly, or rounds the ask down to nothing, or would always rather give than receive.
>
> Day 13 runs a short 3-2-1 on that part. You face it, you name it and talk to it, you
> speak as it. Then you name one missing move: the small thing you could do the next
> time a resource has to move. Not a plan. A move.
>
> Private. Nothing is sent. Nobody is asking you to give, receive, or promise anything.
>
> Day 13 of the 30-day Mastering the Game of Allyship course · link in the chrome.

## Facebook post

Facebook takes the longer read, so this is the same day told as a short paragraph
rather than eight beats. Post text:

> There is a move most of us skip when we try to resource anything — a campaign, a
> project, our own lives. We skip straight to the plan. Cover the shortfall quietly.
> Round the ask down until it costs no one anything. Give, because giving is easier
> than receiving.
>
> Underneath that is a part of you that has been carrying the money, the asking, and
> the being-owed for a long time. It is not the enemy. It kept the work moving. Left
> unheard, it makes the same move for you every time, and that move is usually "handle
> it alone."
>
> Day 13 of the Mastering the Game of Allyship course is a short 3-2-1 on that part.
> You describe it in the third person. You give it a name and talk to it. You speak as
> it, in the first person, and finish one sentence: "The smallest true thing I know,
> need, or could receive is…"
>
> Then you name one missing move — the small thing you could do differently the next
> time a resource has to move. Not a plan. Not a pledge. A move.
>
> It is private. Nothing you write is sent or saved anywhere but your own browser, and
> it clears itself when you finish. Nobody is asking you to give, receive, or promise
> anything.
>
> It takes about ten minutes: masteringallyship.com/mastering-allyship/course/3/clean-up

## Notes for whoever builds the `.dc.html` carousel

Follow Day 11's board. It is a `text/x-dc` component with `handle` and `dayUrl`, links
the `_ds` bundle by relative path (the repo-side mirror is `src/styles/bars-tokens.css`,
already wired through `src/app/globals.css`), and needs no new tokens. Slide 4's icon is
`MoveIcon` with `move='clean-up'`. Export the eight slides at exactly 1080×1350; the PNGs
exceed the design API's 256 KiB per-file cap, so they stay in the design project rather
than in this folder, the same as Day 11's.
