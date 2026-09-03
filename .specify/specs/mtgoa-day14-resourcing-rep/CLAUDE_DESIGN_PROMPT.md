# Paste this into Claude Design

*(Pair with `design_handoff/README.md` — that file is the authority on the copy and
the day's mechanic; this is the layout + design system for the carousel board.)*

*(Follow the **Day 11** board as the working template: keep its `text/x-dc` structure,
its two props, and its chrome layout; only the palette and the copy change.)*

---

Design an **8-slide Instagram carousel** (a `text/x-dc` component, each slide exactly
**1080×1350**) for **Day 14** of the *Mastering the Game of Allyship* 30-day course —
**Week 3 · Gather Resources · Grow Up**. The day picks one resourcing capacity and gives
it a single rep, one notch bigger than today. Tone is **encouraging, plain, second-person
— never a funnel or a hype reel**. Nothing on any slide asks anyone to give, promise, buy,
or commit.

**Two props** (same as Day 11):
- `handle` — default `@wendell_britt`
- `dayUrl` — default `masteringallyship.com/mastering-allyship/course/3/grow-up`

**Persistent chrome on every slide:**
- Left, gold mono: `week 3 · gather resources · day 14`
- Right, wood-gem mono: `grow up · 木`
- A 2px rail beneath, filled `linear-gradient(90deg, #4a7c59, #2ecc71)`.
- Bottom, small and muted: the `handle`, and on slide 8 the `dayUrl`.

## Design system — Grow Up is wood

This is a **wood** board, not Week 3's earth. Grow Up's element is wood in every round
(the UI covenant is element=color), so Day 14 runs the same green Days 4 and 9 use.

- **Ground:** `#0a0908` warm near-black, with a soft green wash `radial-gradient(120% 90% at 78% 8%, rgba(5,46,22,0.55), transparent 64%)` top-right.
- **Wood frame / lines:** `#4a7c59` · **wood glow:** `#27ae60` · **wood gem (accent):** `#2ecc71` · **bright jade (highlights, rail cap, active marks):** `#3ec97a`.
- **Card gradient (inset panels / the capacity chips):** `radial-gradient(120% 90% at 78% 8%, #052e16, #011309 64%)`, 1px border `rgba(46,204,113,0.4)`.
- **Surfaces:** card `#1a1a18` · inset `#111110` · hairline borders `rgba(232,230,224,0.09)`.
- **Text:** primary `#e8e6e0` · secondary `#a09e98` · muted `#6b6965`.
- **Gold** (eyebrows / the day tag): `#c9a84c`.
- A **28px gold inset hairline** frame just inside the slide edge.
- **Fonts:** **Jost** (headlines, 600–700) · **Nunito** (body) · **Space Mono** (eyebrows, tags, the fill-in stem). Mono eyebrows: ~10px, uppercase, letter-spacing .28em.

Slide 3's move icon: the design system `MoveIcon` with `move='grow-up'`, in wood.

---

## The eight slides — exact copy

**The promise the arc delivers:** *you do not need a new self at money; you need one rep,
one notch bigger.* Slides 1–3 name the trap and the move, slides 4–6 carry the instrument,
slide 7 sets the size, slide 8 is the door.

1. **Title.** Huge Jost, centered: **“Which resourcing capacity deserves one real rep?”** Gold mono eyebrow above: `grow up · gather resources`.

2. **The trap.** Body: *You decide you'd have to become a whole new person about asking, receiving, money.* Then, set apart, in wood gem: **“It's too big to start — so nothing moves.”** Small line under: *Growth by replacement never begins.*

3. **The move.** Move icon (`grow-up`, wood) top-center. Mono label `day 14 · grow up`. Headline: **“Practise one capacity. Don't fix yourself.”** Sub, muted: *A capacity grows by being used once more than yesterday.*

4. **The capacities.** Eyebrow `pick one`. Five hairline-bordered pills: *Making a clear ask, without softening it · Receiving without rushing to repay · Stewarding what I already have · Letting someone else carry part of it · Resting before I resource anything.*

5. **The rep.** Eyebrow `one notch bigger`. The fill-in stem, large, blank as an underlined gap in wood gem: **“One notch bigger than today, I will \_\_\_.”** Muted line: *Small enough to do this week.*

6. **The return.** Eyebrow `so you can notice it`. Continue the stem: **“…and I will know it grew when \_\_\_.”** Then, muted: *A rep you can't notice is a wish.*

7. **The size of it.** Two lines, centered. Muted: *Not a whole new skill by Friday.* Then huge, wood gem: **“One rep is the whole ask.”**

8. **The door.** Headline: **“Grow one capacity. One rep.”** Beneath, a wood-gem pill with the route: `masteringallyship.com/mastering-allyship/course/3/grow-up`. Muted line under it: *Private. Nothing you write leaves your device. Nobody is asking you to commit to anything.*

---

**Motion:** minimal — a soft fade/rise per slide; respect `prefers-reduced-motion`.

**Feel:** encouraging and grounded, a coach who believes in small reps — closer to a
typeset field note than a motivational post. Type and spacing do the work. The capacity
pills (slide 4) and the fill-in stem (slides 5–6) are the only structured “interface”
moments.

**Export:** eight PNGs at exactly 1080×1350 to `exports/day14-carousel/day14-01…08.png`.
They exceed the design API's 256 KiB per-file read cap, so they stay in the Claude Design
project rather than in the repo, the same as Day 11.

**One open call for the founder:** this board runs wood, which breaks the Week 3 earth grid
on the feed — correct for the element read, and matching the in-app page. If feed cohesion
wins, re-skin the chrome and panels to Week 3 earth (`#b5651d` frame / `#e0a93b` gem, ground
unchanged) and swap the glyph to `土`; the copy and layout do not change.
