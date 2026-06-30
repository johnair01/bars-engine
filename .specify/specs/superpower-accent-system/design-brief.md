# Claude Design Brief: Superpower Accent & Arc System

> **For: Claude Design.** Self-contained visual brief. The data model and the
> decision behind it are **already built and merged** (see ADR 0002); this brief
> is the *visual system* only — a palette, an arc visualization, and a small set
> of surfaces that consume them. Output `.dc.html` references against the bound
> BARS Engine Design System, the same way the Promise Forge handoff was authored.

## Context

BARs Engine is a mobile-first web app built on a Wuxing (five-element) visual
language: every card's only chromatic signal is **its element** — Fire 火, Water
水, Wood 木, Metal 金, Earth 土 — and **liminal purple** is reserved for
action / consent. (`UI_COVENANT.md`, Law 9: "semantic color only; every color
has a Wuxing justification; decorative use of element colors is forbidden.")

Players also have **superpowers** — seven *identity lenses* for how they ally
(Connector, Storyteller, Strategist, Disruptor, Alchemist, Escape Artist,
Coach). A superpower is **not** an element. It used to be mis-modeled as one
(each pinned to a single Wuxing channel), which collapsed three superpowers onto
"fire," orphaned "wood," and broke the covenant. **ADR 0002** retired that. A
superpower is now:

- an **arc** — its emotional alchemy as a *path across elements*
  (`from → to` legs, each on an element), and
- its **own accent** — a superpower-owned identity color that is **not** a Wuxing
  element and **not** liminal purple.

**This brief asks Claude Design to design that accent system** — the palette, the
arc visualization, and how a superpower presents itself across the product — so
engineering can drop the result into the existing `accentOverride` hook.

---

## Design System

**Background**: `#0a0908` (warm near-black) · alt `#080706`
**Surface (card)**: `#1a1a18` · **elevated** `#242420` · **inset** `#111110`
**Text**: primary `#e8e6e0` · secondary `#a09e98` · muted `#6b6965`
**Hairline**: `rgba(255,255,255,0.07)` · **inset highlight** `inset 0 1px 0 rgba(255,255,255,0.06)`

**Fonts**: Display = **Jost** (800/700, tight tracking) · Body = **Nunito** ·
Mono = **Space Mono** (UPPERCASE, letter-spaced micro-labels).

**Motion**: ease `cubic-bezier(0.16,1,0.3,1)`; hover lifts, press shrinks; honor
`prefers-reduced-motion`.

**The five element gems (RESERVED — these are the colors a superpower accent may
NOT be, and the colors its *arc* is built from):**

| Element | Gem token | Hex | Emotion arc (raw → metabolized) |
|---|---|---|---|
| Fire 火 | `--bars-fire-gem` | `#e74c3c` | Anger → Triumph |
| Water 水 | `--bars-water-gem` | `#2980b9` | Sadness → Poignance |
| Wood 木 | `--bars-wood-gem` | `#2ecc71` | Restlessness → Aliveness/Joy |
| Metal 金 | `--bars-metal-gem` | `#bdc3c7` | Fear → Wonder/Clarity |
| Earth 土 | `--bars-earth-gem` | `#e0a93b` | Apathy → Peace |

**RESERVED — do not use as a superpower accent:** the five element gems above,
and **liminal** `--bars-liminal` `#7c3aed` / glow `#a855f7`.

---

## What already exists (design *against* this — do not redesign it)

The data model is merged. Each superpower carries a structured `arc` and an
optional `accentOverride`. The seven superpowers and their canonical arcs:

| Superpower | Arc (each leg = from→to on an element) | `spansAll` | Domain emphasis |
|---|---|---|---|
| **Connector** | Neutrality→Peace (Earth) · Sadness→Poignance (Water) | — | bonds, introductions |
| **Storyteller** | Anger→Triumph (Fire) · Sadness→Poignance (Water) | — | attention, narrative |
| **Strategist** | Fear→Clarity (Metal) | — | structure, leverage |
| **Disruptor** | Anger→Triumph (Fire) | — | direct action |
| **Alchemist** | Sadness→Poignance (Water) · Poignance→Joy (Wood) | **yes** | direct action (master of alchemy) |
| **Escape Artist** | Sadness→Poignance (Water) · Fear→Excitement (Metal) | — | direct action, exits |
| **Coach** | Frustration→Triumph (Fire) | — | calling people up |

Helpers already exist: `superpowerAccentCss(arc, accentOverride)` returns the
accent (the override hue when set, else a gradient across the arc's element
gems), and `arcToProse(arc)` renders "Anger→Triumph (Fire) + …". **Your palette
becomes the `accentOverride` values.**

**The hard problem the palette must solve:** three superpowers' arcs are
single-Fire (Disruptor, Coach) or Fire-led (Storyteller), so the *derived* arc
gradient alone leaves **Coach and Disruptor reading nearly identical**. The
accent palette is what makes all seven unmistakable.

---

## Screen 1 — The Accent Palette (the core deliverable)

Design **seven distinct identity accents**, one per superpower. For each, specify:

- a **base hue** (solid) and a **glow** (the lifted/hover state),
- expressed as values we can paste into `accentOverride` (hex, or a
  `linear-gradient(...)` if you go gradient-per-superpower).

**Acceptance test (from the covenant):** *cover the label and the sigil — you
should still know which of the seven superpowers it is from the accent alone.*
Lay all seven swatches in a row on `#0a0908` and prove mutual distinctness, and
prove none reads as Fire/Water/Wood/Metal/Earth or liminal purple.

Present the palette as a **swatch sheet**: name · base · glow · the superpower's
arc shown beside it (so we can see accent-vs-arc relationship).

## Screen 2 — The Arc Ribbon (emotional-alchemy visualization)

A small, reusable component that renders a superpower's `arc` as a **directional
path across element gems** — e.g. for Connector: an Earth gem → Water gem flow
with the `from→to` emotion words. Design:

- the **mono-element** case (Strategist: a single Metal leg),
- the **two-leg** case (Connector, Storyteller, Escape Artist),
- the **`spansAllElements`** case (Alchemist — should read as "all five," a full
  spectrum, distinct from a plain two-leg arc).

It must read at two sizes: a **chip** (inline, ~1 line) and a **ribbon**
(hero, on the reveal). The arc uses element gems (that's legitimate — the arc
*is* about elements); the surrounding identity (frame/sigil) uses the accent.

## Screen 3 — Superpower Identity Badge (the reusable atom)

The component every surface reuses: **avatar (sigil) + name + accent + arc chip**.
Design questions: does each superpower get **its own sigil/mark** (superpowers
currently have none — only elements have 火水木金土), or a shared geometric mark
tinted by accent? Show the badge in three states: list row, selected, and hero.

## Screen 4 — Pack Card (fixes a shipped bug)

The store sells seven "superpower expansion packs." Today they're colored by the
old element channel, so **three packs render identical Fire**. Redesign the pack
card to carry the superpower's **accent** as its identity (not an element).
Deliver the **seven pack cards in a grid** so distinctness is obvious at a glance.
(Frame/altitude/stage chrome stays per the card system; only the identity color
moves from element → accent.)

## Screen 5 — Superpower Reveal (result surface)

The quiz result currently shows primary + secondary + a margin band + shadow.
Add the **accent + arc** to it: the primary superpower rendered with its accent
and its arc ribbon as the hero, so the result reads as "here is your lens, and
here is the emotional path it runs." Mobile, full scroll.

## Screen 6 — Forge Landing Chip (ties into the Promise Forge)

In the Promise Move Forge (`/forge`), the landing seeds the player's superpower.
Today the chip is hardcoded Metal/Strategist. Design the chip to take **any**
superpower via its accent + sigil + (optional) arc chip — and confirm the
Forge's surface still colors by the **drawn card's** element, with the
**superpower carried only by the accent** (never overriding the card's element).
This is the concrete proof that "element = card, accent = superpower" holds.

---

## Constraints

- Mobile-first (390px), dark mode only. Use the tokens above; no off-system hex
  except the seven new accents you're defining.
- **Accents are non-Wuxing and non-liminal.** Never let an accent read as one of
  the five elements or as the reserved purple. (ADR 0002; UI_COVENANT Law 9.)
- **Element stays the card's signal.** A superpower's accent must never recolor a
  card's element frame/glow/gem — it lives on identity chrome (avatar ring, badge,
  pack identity), beside or around element-colored content, not on top of it.
- The seven accents must pass the **cover-the-label distinctness test** on
  `#0a0908`.
- No emoji in chrome. Sigils + geometric marks only.

---

## Deliverables Requested

1. **Accent palette swatch sheet** — seven accents (base + glow), each paired with
   its arc, on `#0a0908`, with the distinctness test laid out. Values must be
   paste-ready for `accentOverride` (hex or gradient).
2. **Arc ribbon** — chip and hero sizes; mono-element, two-leg, and
   `spansAllElements` (Alchemist) variants.
3. **Identity badge** — list / selected / hero states; resolve the sigil question.
4. **Pack card grid** — all seven packs, proving they no longer collapse to five.
5. **Reveal mockup** — primary superpower with accent + arc ribbon hero.
6. **Forge landing chip** — generalized chip; show two different superpowers
   (e.g. Strategist and Connector) to prove it's data-driven.

### Design questions to resolve
1. **Accent form:** flat hue per superpower, a per-superpower gradient, or hue +
   arc-gradient overlay? (Engineering supports any — `accentOverride` is a CSS
   value.)
2. **Coach vs Disruptor:** both run a single Fire arc — how does the accent make
   them unmistakable without either reading as Fire?
3. **Sigils:** dedicated per-superpower marks, or one geometric mark tinted by
   accent?
4. **Alchemist:** how should "all five elements" read so it's clearly the master
   of alchemy and not just a two-leg arc?

## References
- `docs/adr/0002-superpowers-are-arcs-not-channels.md` — the decision + rationale.
- `UI_COVENANT.md` — the three-channel encoding and Law 9.
- `src/lib/superpowers/arc.ts` — `EmotionArc`, `superpowerAccentCss`, `arcToProse`.
- `src/lib/superpowers/types.ts` — the seven `SuperpowerDef`s (arcs live here).
- `src/styles/bars-tokens.css` — every `--bars-*` token referenced above.
