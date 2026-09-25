# Handoff: Day 15 — Show Up · The Resourcing Move

Route the day and the carousel point at: `/mastering-allyship/course/3/show-up`.

Week 3 · Gather Resources · Day 15 of 30 — **the last day of the week.** Released
2026-09-04 (midnight EDT).

## Scope of this folder

The social copy for Day 15 — the Instagram carousel spec and the Facebook post. The
interactive practice ships in the same change:

| Piece | Where |
|---|---|
| Offer/ask shapes, the move composer, the consent line, receipt rows | `src/lib/mtgoa-course/day-fifteen.ts` |
| The day | `src/components/mtgoa-check/DayFifteenResourcingMove.tsx` |
| Dispatch | `page.tsx`, on `three.day === 15` |
| The row (route, metadata, reader-facing copy, card readings) | `src/lib/mtgoa-course/round-three.ts` |
| Tests | `day-fifteen.test.ts` · `day-fifteen-render.test.tsx` |

Session-only, like Days 11, 12 and 14 — nothing persists, nothing is sent. The reader
composes the message and decides whether to send it themselves.

## The day, in one paragraph

Day 11 counted what is in reach; Day 12 held one resource question; Day 13 cleaned the
charge; Day 14 grew one capacity. Day 15 turns all of it into a single real move: one
concrete **offer** or **ask**, addressed to one specific person, in words they can act
on — with consent named and no strings. Show Up asks what another person can actually act
on, so the artifact is a message a reader could send today, not a plan. It closes Week 3.

## The mechanic, as the day builds it

Five steps: `entry → draw → shape → compose → receipt`.

- **The shape** is a choice of two: *I am offering a resource I hold* or *I am asking for
  a resource I need*. Then a private label for who it is for — never a full name.
- **The move** is a fill-in stem, per shape: offer reads *“I have ___ and I would like you
  to have it for ___.”*; ask reads *“Could you ___ so that ___?”*. Unfilled halves render
  `___`.
- **The consent line is fixed**: *“You can say no, and it changes nothing between us.”* It
  is appended to every message, because it is the move — the thing that keeps a resourcing
  ask an invitation rather than an extraction (Show Up · Diplomat, *Invite, Don't Extract*).
- **The receipt** is the full message, ready to copy and send as written, plus the record
  and *That closes Week 3 · Gather Resources.*

## The six Show Up · Gathering Resources cards, and Day 15's reading of each

These readings live only on the `cardPrompts` map of the Day 15 row in `round-three.ts`,
keyed by card id; the component reads them straight from there, like Days 11–14.

| Face | Card (`SHOW-GR-*`) | Day 15's lens |
|---|---|---|
| Shaman | Aim the Resources | Where exactly does this resource go — concretely, this week? |
| Challenger | The Ask Goes Live | What is the one concrete act you keep almost doing? |
| Regent | Hold the Funds Well | What would keep this trustworthy after the yes — a record, an update? |
| Architect | Build the Ladder | Is there one small structure that makes the move repeatable? |
| Diplomat | Invite, Don't Extract | Whose consent and power do you name so this stays an invitation? |
| Sage | What Remains After | What would remain after — a relationship, a story worth telling? |

## Instagram carousel

Eight slides at 1080×1350. **Show Up runs fire** — the UI covenant is element=color, and
Show Up's element is fire in every round (the same ember Days 5 and 10 use), so this day
runs fire (`--bars-fire-glow` / `#e8671a`), not Week 3's earth. The chrome reads
`week 3 · gather resources · day 15 · 火`.

This deliberately breaks the Week 3 earth grid on Instagram, the same call Days 13 and 14
made (water, wood): a Show Up day is fire wherever it appears. Feed cohesion versus the
element read is the founder's call when the board is built — the in-app page stays fire.

A paste-ready Claude Design brief lives at [`../CLAUDE_DESIGN_PROMPT.md`](../CLAUDE_DESIGN_PROMPT.md).
This README stays the authority on the copy.

Props, matching Day 11: `handle` (default `@wendell_britt`) and `dayUrl`
(default `masteringallyship.com/mastering-allyship/course/3/show-up`).

The promise: *All the counting and clearing is for this — one real message to one real person.*

| # | Beat |
| --- | --- |
| 1 | Title — `What resourcing move can another person actually act on?` |
| 2 | The week so far — you counted (Day 11), held (12), cleaned (13), grew (14). *None of it has left your own head yet.* |
| 3 | The move — `day 15 · show up` asks for **one concrete offer or ask, to one specific person** — not a campaign, not a mass ask. |
| 4 | **The two shapes** — *I am offering a resource I hold* · *I am asking for a resource I need.* Pick one. Name one person. |
| 5 | **The message** — the fill-in stem, both shapes: *“I have ___ and I would like you to have it for ___.”* / *“Could you ___ so that ___?”* |
| 6 | **The fixed line** — *“You can say no, and it changes nothing between us.”* This is what keeps it an invitation, not a debt. |
| 7 | The size of it — `One message. One person. Today.` |
| 8 | The close — `That closes Gather Resources.` → `masteringallyship.com/mastering-allyship/course/3/show-up` |

Slides 1–3 name the week and the move. Slides 4–6 carry the instrument. Slide 7 sets the
size. Slide 8 closes the week. No slide pressures anyone to give.

### Caption (Instagram)

> Four days of Gather Resources, and none of it has left your own head yet. You counted
> what you can reach, held one question, cleaned the charge, grew one capacity. Day 15 is
> where it becomes real.
>
> One move. Pick a shape — an offer of something you hold, or an ask for something you need.
> Name one person. Say it in words they can act on. Then add the one line that keeps it
> clean: “You can say no, and it changes nothing between us.”
>
> Not a campaign. Not a mass ask. One message to one person, that you can send today — or
> not. It's private; nothing you write leaves your browser.
>
> Day 15 of the 30-day Mastering the Game of Allyship course — the last of Gather Resources.
> Link in the chrome.

## Facebook post

> Gathering resources is easy to keep private forever. You can count what you have, notice
> the fear around asking, grow your capacity to receive — all of it inside your own head,
> where no one can say no to you. That's where most of it dies.
>
> Day 15 of the Mastering the Game of Allyship course is the day it leaves your head. It
> asks for one move: a single concrete offer or ask, to one specific person, in words they
> can actually act on.
>
> You pick the shape — offering something you hold, or asking for something you need — and
> you name one person. Then you write it plainly: "I have a spare studio hour and I'd like
> you to have it for your recording," or "Could you lend me the projector so we can screen
> the film Friday?"
>
> The line that does the real work comes last, fixed and non-negotiable: "You can say no,
> and it changes nothing between us." That single sentence is the difference between an
> invitation and an extraction. It is what lets you ask without putting anyone in debt.
>
> Not a campaign. Not a mass ask. One message, one person, that you can send today or keep
> for yourself. It's private — nothing you write is saved or sent anywhere but your own
> browser.
>
> It closes Week 3, Gather Resources. About five minutes:
> masteringallyship.com/mastering-allyship/course/3/show-up
