# Paste this into Claude Design

*(Pair with `design_handoff/README.md` — that file is the authority on the copy and
the day's mechanic; this is the layout + design system for the carousel board.)*

*(Follow the **Day 11** board as the working template: keep its `text/x-dc` structure,
its two props, and its chrome layout; only the palette and the copy change.)*

---

Design an **8-slide Instagram carousel** (a `text/x-dc` component, each slide exactly
**1080×1350**) for **Day 15** of the *Mastering the Game of Allyship* 30-day course —
**Week 3 · Gather Resources · Show Up**, the last day of the week. The day turns four days
of inner resource work into one concrete offer or ask to one specific person. Tone is
**warm, direct, a little bracing — the nudge to actually send it — never a funnel or a
guilt trip.** Nothing on any slide pressures anyone to give.

**Two props** (same as Day 11):
- `handle` — default `@wendell_britt`
- `dayUrl` — default `masteringallyship.com/mastering-allyship/course/3/show-up`

**Persistent chrome on every slide:**
- Left, gold mono: `week 3 · gather resources · day 15`
- Right, fire-gem mono: `show up · 火`
- A 2px rail beneath, filled `linear-gradient(90deg, #c1392b, #e8671a)`.
- Bottom, small and muted: the `handle`, and on slide 8 the `dayUrl`.

## Design system — Show Up is fire

This is a **fire** board, not Week 3's earth. Show Up's element is fire in every round
(the UI covenant is element=color), so Day 15 runs the same ember Days 5 and 10 use.

- **Ground:** `#0a0908` warm near-black, with an ember wash `radial-gradient(120% 90% at 78% 8%, rgba(67,20,7,0.6), transparent 64%)` top-right.
- **Fire frame / lines:** `#c1392b` · **fire glow:** `#e8671a` · **fire gem (accent):** `#e74c3c` · **bright ember (highlights, rail cap, active marks):** `#f0813a`.
- **Card gradient (inset panels / the message card):** `radial-gradient(120% 90% at 78% 8%, #431407, #1c0700 64%)`, 1px border `rgba(231,76,60,0.4)`.
- **Surfaces:** card `#1a1a18` · inset `#111110` · hairline borders `rgba(232,230,224,0.09)`.
- **Text:** primary `#e8e6e0` · secondary `#a09e98` · muted `#6b6965`.
- **Gold** (eyebrows / the day tag, and the fixed consent line on slide 6): `#c9a84c`.
- A **28px gold inset hairline** frame just inside the slide edge.
- **Fonts:** **Jost** (headlines, 600–700) · **Nunito** (body) · **Space Mono** (eyebrows, tags, the fill-in stem). Mono eyebrows: ~10px, uppercase, letter-spacing .28em.

Slide 3's move icon: the design system `MoveIcon` with `move='show-up'`, in fire.

---

## The eight slides — exact copy

**The promise the arc delivers:** *all the counting and clearing is for this — one real
message to one real person.* Slides 1–3 name the week and the move, slides 4–6 carry the
instrument, slide 7 sets the size, slide 8 closes the week.

1. **Title.** Huge Jost, centered: **“What resourcing move can another person actually act on?”** Gold mono eyebrow above: `show up · gather resources`.

2. **The week so far.** Four short lines: *You counted what you can reach.* · *You held one question.* · *You cleaned the charge.* · *You grew one capacity.* Then, set apart, in fire gem: **“None of it has left your own head yet.”**

3. **The move.** Move icon (`show-up`, fire) top-center. Mono label `day 15 · show up`. Headline: **“One offer, or one ask. One person.”** Sub, muted: *Not a campaign. Not a mass ask.*

4. **The two shapes.** Eyebrow `pick one`. Two hairline-bordered cards side by side or stacked: **I am offering a resource I hold** · **I am asking for a resource I need.** Under them, muted: *Then name one person — a private label, never a full name.*

5. **The message.** Eyebrow `say it in words they can act on`. Both stems, stacked, with the blanks as underlined gaps in fire gem: **“I have \_\_\_ and I would like you to have it for \_\_\_.”** and **“Could you \_\_\_ so that \_\_\_?”**

6. **The fixed line.** A single gold-bordered panel, centered: **“You can say no, and it changes nothing between us.”** Under it, muted: *Fixed, and non-negotiable. It is what makes an ask an invitation instead of a debt.*

7. **The size of it.** Centered, huge, fire gem: **“One message. One person. Today.”** Muted line under it: *Send it, or keep it. Your call.*

8. **The close.** Headline: **“That closes Gather Resources.”** Beneath, a fire-gem pill with the route: `masteringallyship.com/mastering-allyship/course/3/show-up`. Muted line under it: *Private. Nothing you write leaves your device. Nobody is asking you to give.*

---

**Motion:** minimal — a soft fade/rise per slide; respect `prefers-reduced-motion`.

**Feel:** the encouraging shove at the end of a good workshop — everything so far was
preparation, and this is the part where you actually do the thing. Type and spacing do the
work. The two shape cards (slide 4) and the fill-in stems (slide 5) are the only structured
“interface” moments; slide 6's consent line is the emotional center — give it room.

**Export:** eight PNGs at exactly 1080×1350 to `exports/day15-carousel/day15-01…08.png`.
They exceed the design API's 256 KiB per-file read cap, so they stay in the Claude Design
project rather than in the repo, the same as Day 11.

**One open call for the founder:** this board runs fire, which breaks the Week 3 earth grid
on the feed — correct for the element read, and matching the in-app page. If feed cohesion
wins, re-skin the chrome and panels to Week 3 earth (`#b5651d` frame / `#e0a93b` gem, ground
unchanged) and swap the glyph to `土`; the copy and layout do not change.
