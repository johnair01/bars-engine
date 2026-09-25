# Handoff: Day 11 — Wake Up · What Is Already in Your Hand

Design source: Claude Design project `b6457c63-114e-44c9-8039-494652c5ce64`,
file `Day 11 Carousel -standalone-src-.dc.html`. Imported 2026-08-28.

Route the carousel points at: `/mastering-allyship/course/3/wake-up`.

## Scope of this folder

This vendors **the carousel board only**. The Day 11 page itself —
`MTGOA Day 11 - Wake Up Starting Hand.dc.html` — has not been imported, so
there is no component, no copy module, and no `round-three.ts` entry yet. The
spine already resolves Day 11 as a round-3 `wake-up` day off `MTGOA_COURSE_DAYS`
with a fallback title from `MOVE_LABELS`; the authored layer is what is missing.

## The day, as the carousel states it

Week 3 opens **Gather Resources**, so Day 11 runs earth — terracotta and ochre
on near-black, where Day 10 ran fire ember. The chrome reads
`week 3 · gather resources · day 11 · 土`.

The promise: *You are waiting to feel influential. You are already holding
something.*

Eight slides at 1080×1350:

| # | Beat |
| --- | --- |
| 1 | Title — `What is already in your hand?` |
| 2 | The waiting — a bigger platform, more money, the authority to say yes |
| 3 | The counter — people who already ask what you think, rooms you already belong to, problems you already recognize |
| 4 | The move — `day 11 · wake up` asks you to **count what you can actually reach** |
| 5 | **The starting hand** — five prompts: people who trust your judgment, groups you belong to, skills and tools you can offer, rooms you can convene, problems you already understand |
| 6 | **Four access labels** — `I can offer this` / `I can ask whether it is available` / `I have a possible connection` / `This is not mine to offer`, under the standard *A resource is not owed because you can reach it.* |
| 7 | **Three columns** — `Move now` (authority and enough information), `Ask first` (permission or a fact comes before the offer), `Keep visible` (real, with no current fit) |
| 8 | The question and the route — `Map it before you offer it.` |

Slides 1–3 name the waiting. Slide 4 names the move. Slides 5–7 carry the
instrument. No slide asks anyone to give, introduce, buy, or promise.

## What the day page will need

Slides 5–7 are the mechanic in miniature — a **Resource Ledger** built in three
passes: list the hand, label each entry's access honestly, then sort into the
three columns. Whoever imports the page should treat the carousel as the
authority on those three vocabularies, since the copy here is already public.

Two questions the page design has to answer, which the carousel does not:

1. **Persistence.** A ledger is the kind of artifact a reader expects to keep,
   and Week 2's invariant is that nothing a reader writes survives a refresh.
   Week 3 has no stated invariant yet. This needs the founder's explicit call
   before the page is built, the way Day 8's exception did.
2. **Which honest end states the page offers**, and whether reaching a receipt
   requires sorting anything at all.

## Implementation notes

The board is a `text/x-dc` component with two props:

- `handle` — default `@wendell_britt`
- `dayUrl` — default `masteringallyship.com/mastering-allyship/course/3/wake-up`

Slide 4's icon comes from the design system, `MoveIcon` with `move='wake-up'`,
`size=82`, `color='#1a0a00'`. The `_ds` bundle is referenced by relative link and
**is not vendored here** — the repo-side mirror is `src/styles/bars-tokens.css`,
already wired through `src/app/globals.css`.

Verified 2026-08-28 against a local render off those `_ds` links: eight slides at
exactly 1080×1350, both props bound, no unresolved template expressions.

## Rendered slides

The PNG exports stay in the design project — they exceed the 256 KiB the design
API returns per file:

- `exports/day11-carousel/day11-01.png` … `day11-08.png` (1080×1350)

## Caption

> Gather Resources starts with seeing, not giving. Day 11 builds a Resource
> Ledger: the people, rooms, skills, and material support you can actually reach
> — each one marked with what it could help with and whether it is yours to
> offer at all.
>
> Nothing is owed. Nothing is public. You decide whether one thing moves.
