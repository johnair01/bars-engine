# Paste this into Claude Design

*(Pair with `design_handoff/README.md` — that file is the authority on the copy and
the day's mechanic; this is the layout + design system for the carousel board.)*

*(Follow the **Day 11** board as the working template: `MTGOA Day 11 - Wake Up Starting
Hand Carousel.dc.html` in the same Claude Design project. Keep its `text/x-dc` structure,
its two props, and its chrome layout; only the palette and the copy change.)*

---

Design an **8-slide Instagram carousel** (a `text/x-dc` component, each slide exactly
**1080×1350**) for **Day 13** of the *Mastering the Game of Allyship* 30-day course —
**Week 3 · Gather Resources · Clean Up**. The day runs a short 3-2-1 on the part of you
that gets loud when a resource has to move. The tone is **quiet, close, second-person —
never a funnel**. Nothing on any slide asks anyone to give, ask, buy, or promise.

**Two props** (same as Day 11):
- `handle` — default `@wendell_britt`
- `dayUrl` — default `masteringallyship.com/mastering-allyship/course/3/clean-up`

**Persistent chrome on every slide:** top-left the day tag, top-right the move tag.
- Left, gold mono: `week 3 · gather resources · day 13`
- Right, water-gem mono: `clean up · 水`
- A 2px rail beneath, filled `linear-gradient(90deg, #1a3a5c, #2980b9)`.
- Bottom, small and muted: the `handle`, and on slide 8 the `dayUrl`.

## Design system — Clean Up is water

This is a **water** board, not Week 3's earth. Clean Up's element is water in every
round (the UI covenant is element=color), so Day 13 matches Day 8's water rather than the
Day 11 / Day 12 earth grid. This is deliberate; see the README note.

- **Ground:** `#0a0908` warm near-black, with a **navy wash** `radial-gradient(120% 90% at 78% 8%, rgba(12,30,62,0.55), transparent 64%)` top-right.
- **Water frame / lines:** `#1a3a5c` · **water glow:** `#1a7a8a` · **water gem (accent):** `#2980b9` · **bright accent (highlights, the rail cap, active marks):** `#3fa9c4`.
- **Card gradient (for any inset panel / the 3-2-1 cards):** `radial-gradient(120% 90% at 78% 8%, #0c1e3e, #020c1f 64%)`, 1px border `rgba(41,128,185,0.4)`.
- **Surfaces:** card `#1a1a18` · inset `#111110` · hairline borders `rgba(232,230,224,0.09)`.
- **Text:** primary `#e8e6e0` · secondary `#a09e98` · muted `#6b6965`.
- **Gold** (eyebrows / the day tag): `#c9a84c`.
- **The one place the board leaves water:** slide 6's first-person (`I`) line, painted the soft violet `#a99ae0` — the colour the practice uses for *Be it*.
- A **28px gold inset hairline** frame just inside the slide edge (as Day 8's water carousel uses).
- **Fonts:** **Jost** (headlines, 600–700) · **Nunito** (body) · **Space Mono** (eyebrows, tags, the fill-in stem). Mono eyebrows: ~10px, uppercase, letter-spacing .28em.

Slide 4's move icon: the design system `MoveIcon` with `move='clean-up'`, in water.

---

## The eight slides — exact copy

**The promise the arc delivers:** *you keep trying to fix how you resource this; first
let the part that carries it speak.* Slides 1–3 name the reflex and the part, slide 4
names the move, slides 5–7 carry the instrument, slide 8 is the door.

1. **Title.** Huge Jost, centered: **“What move are you missing when a resource has to move?”** Gold mono eyebrow above: `clean up · gather resources`.

2. **The reflex.** Three short lines, each its own beat: *You cover the shortfall quietly.* · *You round the ask down to nothing.* · *You would rather give than receive.* Then, set apart: *It keeps the work moving.* → in water gem: **“None of it refills you.”**

3. **The part.** Body: *There is a part of you that gets loud the moment a resource has to move. It has been doing this job a long time.* Then, larger: **“Before you redesign how you resource anything, hear it.”**

4. **The move.** Move icon (`clean-up`, water) top-center. Mono label `day 13 · clean up`. Headline: **“Let the part describe the job.”** Sub, muted: *Not build a plan — that is a later day.*

5. **The strain.** Eyebrow `the strain, if one fits`. A stacked list of six starter lines, each in a hairline-bordered pill: *I should be able to do this without help* · *Who am I to ask for that?* · *It is easier to give than to receive* · *There is not enough to go around* · *If I ask, I will owe them* · *Something else.* Footer, muted: *Pick one, write your own, or skip it.*

6. **The 3-2-1.** Three stacked cards (use the water card gradient), numbered:
   - **3 · Face it** — mono `third person · they` — *Describe the part as “they.”*
   - **2 · Talk to it** — mono `second person · you` — *Name it, then talk. Ask what it protects.*
   - **1 · Be it** — mono `first person · I`, this card’s number and rule in the violet `#a99ae0` — *“The smallest true thing I know, need, or could receive is…”*

7. **The missing move.** Eyebrow `what Clean Up leaves you`. The fill-in-the-blank stem, large, with the blanks as underlined gaps in water gem: **“When a resource has to move, the missing move is to \_\_\_, instead of \_\_\_.”** Then, gold, set apart: **“A move, not a plan.”**

8. **The door.** Headline: **“Let the part speak before you fix the budget.”** Beneath, a water-gem pill with the route: `masteringallyship.com/mastering-allyship/course/3/clean-up`. Muted line under it: *Private. Nothing you write leaves your device. Nobody is asking you to give, receive, or promise anything.*

---

**Motion:** minimal — a soft fade/rise per slide is plenty; respect `prefers-reduced-motion`. No flashy transitions.

**Feel:** a hand-set, second-person meditation that happens to teach a move — closer to a
typeset zine page than a marketing slide. Type and spacing do the work. The 3-2-1 cards
(slide 6) and the fill-in stem (slide 7) are the only structured “interface” moments.

**Export:** eight PNGs at exactly 1080×1350 to `exports/day13-carousel/day13-01…08.png`.
They exceed the design API’s 256 KiB per-file read cap, so they stay in the Claude Design
project rather than in the repo — the same as Day 11.

**One open call for the founder:** this board breaks the Week 3 earth grid on the Instagram
feed by running water. That is correct for the element read and matches the in-app page. If
feed cohesion matters more than the element for the social series, re-skin the chrome and
panels to Week 3 earth (`#b5651d` frame / `#e0a93b` gem, ground unchanged) and swap the
glyph back to `土` — the copy and layout do not change.
