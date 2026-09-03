# Handoff: Day 14 — Grow Up · The Resourcing Rep

Route the day and the carousel point at: `/mastering-allyship/course/3/grow-up`.

Week 3 · Gather Resources · Day 14 of 30. Released 2026-09-03 (midnight EDT).

## Scope of this folder

This vendors the **social copy** for Day 14 — the Instagram carousel spec and the
Facebook post. The interactive practice ships in the same change:

| Piece | Where |
|---|---|
| Capacity starters, capacity-line resolver, rep composer, receipt rows | `src/lib/mtgoa-course/day-fourteen.ts` |
| The day | `src/components/mtgoa-check/DayFourteenResourcingRep.tsx` |
| Dispatch | `page.tsx`, on `three.day === 14` |
| The row (route, metadata, the reader-facing copy, card readings) | `src/lib/mtgoa-course/round-three.ts` |
| Tests | `day-fourteen.test.ts` · `day-fourteen-render.test.tsx` |

Session-only, like Days 11 and 12 — a rep is one repetition, not a 3-2-1, so nothing
persists and nothing is sent.

## The day, in one paragraph

Day 13 named the move you keep skipping around resources. Day 14 does not try to fix
all of it. Grow Up asks which capacity you are willing to practise, so the reader picks
one resourcing capacity — asking, receiving, stewarding, resting — draws a `GROW-GR`
lens, and names one **rep**, one notch bigger than today, plus the signal that will tell
them it grew. A capacity grows by being used once more than it was yesterday, not by
being replaced. No slide, and no screen, asks anyone to give, promise, or commit to the
campaign.

## The mechanic, as the day builds it

Five steps: `entry → draw → capacity → rep → receipt`.

- **The capacity** offers six starters, each a toggle, all skippable, with free text that
  wins when both are present. *"Something else."* selects without asserting content. The
  six: *Making a clear ask, without softening it · Receiving without rushing to repay ·
  Stewarding what I already have · Letting someone else carry part of it · Resting before
  I resource anything · Something else.*
- **The rep** is the fill-in stem, two fields: *"One notch bigger than today, I will ___,
  and I will know it grew when ___."* Unfilled halves render `___`. A guardrail sits above
  it — *Not a whole new skill by Friday. One rep is the whole ask.*

## The six Grow Up · Gathering Resources cards, and Day 14's reading of each

These readings live in one place — the `cardPrompts` map on the Day 14 row in
`round-three.ts`, keyed by card id — and the component reads them straight from there,
the way Days 11–13 do. There is no separate lens table.

| Face | Card (`GROW-GR-*`) | Day 14's lens |
|---|---|---|
| Shaman | The Capacity Trying to Grow | Which resourcing capacity is already trying to grow in you? |
| Challenger | The Edge of the Ask | What is the edge — the ask or the stewardship one level past comfortable? |
| Regent | Worth Practicing | Which resourcing skill is worth repeating until it is reliable? |
| Architect | Strengthen the Channel | Which capability you already have would unlock the most if you strengthened it? |
| Diplomat | Growing Without Leaving People | As this grows, how does it land on the people around you? |
| Sage | Who Resourcing Is Making Me | Who are you becoming as you learn to gather and steward? |

## Instagram carousel

Eight slides at 1080×1350. **Grow Up runs wood** — the UI covenant is element=color,
and Grow Up's element is wood in every round (the same green Days 4 and 9 use), so this
day runs wood (`--bars-wood-glow` / `#2ecc71`), not Week 3's earth. The chrome reads
`week 3 · gather resources · day 14 · 木`.

This deliberately breaks the Week 3 earth grid on Instagram, the same call Day 13 made for
water: a Grow Up day is wood wherever it appears. If feed cohesion matters more than the
element read for the social series, that is the founder's call when the board is built —
the in-app page stays wood regardless.

A paste-ready Claude Design brief lives at [`../CLAUDE_DESIGN_PROMPT.md`](../CLAUDE_DESIGN_PROMPT.md).
This README stays the authority on the copy.

Props, matching Day 11: `handle` (default `@wendell_britt`) and `dayUrl`
(default `masteringallyship.com/mastering-allyship/course/3/grow-up`).

The promise: *You do not need a new self at money. You need one rep, one notch bigger.*

| # | Beat |
| --- | --- |
| 1 | Title — `Which resourcing capacity deserves one real rep?` |
| 2 | The trap — you decide you need to become a whole new person about asking, receiving, money. It is too big to start, so nothing moves. *Growth by replacement never begins.* |
| 3 | The move — `day 14 · grow up` asks you to **practise one capacity**, not fix yourself. A capacity grows by being used once more than yesterday. |
| 4 | **The capacities** — five a reader might pick: *making a clear ask · receiving without rushing to repay · stewarding what you have · letting someone carry part · resting before you resource.* |
| 5 | **The rep** — one notch bigger than today, small enough to do this week: *One notch bigger than today, I will ___.* |
| 6 | **The return** — name the signal, or it is a wish: *and I will know it grew when ___.* |
| 7 | The size of it — `Not a whole new skill by Friday.` → **`One rep is the whole ask.`** |
| 8 | The question and the route — `Grow one capacity. One rep.` → `masteringallyship.com/mastering-allyship/course/3/grow-up` |

Slides 1–3 name the trap and the move. Slides 4–6 carry the instrument. Slide 7 sets the
size. Slide 8 is the door. No slide asks anyone to give, promise, or commit.

### Caption (Instagram)

> You do not need to become a whole new person about money, or asking, or receiving. That
> story is why nothing changes — it is too big to start.
>
> Day 14 asks for one rep instead. Pick one resourcing capacity — asking, receiving,
> stewarding, resting. Name one repetition of it, one notch bigger than today, small enough
> to do this week. Then name the signal that will tell you it grew. A rep you cannot notice
> is a wish.
>
> That is the whole ask. One capacity, one rep. Private — nothing you write leaves your
> browser, and nobody is asking you to commit to anything.
>
> Day 14 of the 30-day Mastering the Game of Allyship course · link in the chrome.

## Facebook post

> There is a quiet way we avoid growing: we decide the change has to be total. To get better
> at money, or asking, or receiving, you tell yourself you'd have to become a whole different
> person — and that's so big it never starts. So you stay exactly where you are and call it
> realism.
>
> Day 14 of the Mastering the Game of Allyship course asks for something much smaller, and
> much more honest: one rep.
>
> Pick one resourcing capacity — making a clear ask, receiving without rushing to repay,
> stewarding what you already have, letting someone else carry part of it, resting before you
> reach for more. Just one. Then name a single repetition of it, one notch bigger than today
> and small enough to actually do this week. Not a program. One rep.
>
> Then name how you'll know it grew — the plain signal you'll be able to notice. "I made the
> ask and I didn't take it back." A rep you can't see is a wish.
>
> A capacity grows by being used once more than it was yesterday, not by being replaced. That
> is the whole thing.
>
> It's private. Nothing you write is sent or saved anywhere but your own browser, and nobody
> is asking you to commit to anything. About five minutes:
> masteringallyship.com/mastering-allyship/course/3/grow-up
