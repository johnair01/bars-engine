# ADR 0002: Superpowers Are Arcs, Not Channels

**Status:** Accepted
**Date:** 2026-06-30
**Decided by:** Wendell, with a hostile review of the prior `SuperpowerDef.channel` mapping

---

## Context

Each of the seven superpowers (`connector, storyteller, strategist, disruptor,
alchemist, escape_artist, coach`) carried a single Wuxing element via
`SuperpowerDef.channel: Channel`. A hostile review found this mapping broken on
every axis:

1. **Non-injective by construction.** Seven superpowers, five elements. The
   actual distribution collides badly:

   | element | superpowers | count |
   |---|---|---|
   | fire | storyteller, disruptor, coach | **3** |
   | water | alchemist, escape_artist | 2 |
   | metal | strategist | 1 |
   | earth | connector | 1 |
   | **wood** | — | **0** |

   Three superpowers are chromatically identical; `wood` is orphaned. Color is
   meant to be a signal — a non-injective signal is an anti-signal.

2. **Violates the project's own covenant.** `UI_COVENANT.md` Law 9 ("semantic
   color only; every color has a *Wuxing* justification; decorative use is
   forbidden") and the litmus test "cover the text and you still know the
   element" both fail: the three fire superpowers are indistinguishable, and a
   superpower is not a Wuxing channel — coloring it with an element is exactly
   the decorative borrowing Law 9 forbids.

3. **Internally contradicted.** `technique-library/vocabulary.ts` states
   "Channel-agnostic by design: any superpower can run any emotional channel,"
   and five of seven `emotionArc` strings are explicitly multi-element
   (connector "Earth + Water", alchemist "all elements"). The data already
   describes arcs across elements; `channel` flattened each to one point.

4. **Category error.** An element is a process/emotion channel (an It/Its
   property — what a *move* metabolizes). A superpower is an identity lens (an I
   property — how *you* ally). Stamping the I with an It is a quadrant
   confusion. The original handoff hedged here too: "color-coded to Metal… a
   design decision, not a system rule… revisit if superpowers get their own
   accent system."

5. **Shipped, and non-scalable.** The only consumer, `launch/offers.ts`, colored
   the seven superpower expansion packs by `channel` — so three packs rendered
   the same fire color in the store. Superpowers are a growth axis (the catalog
   sells "seven … packs"); elements are fixed at five by cosmology. The error
   grows with the roadmap.

## Decision

Retire `SuperpowerDef.channel`. A superpower now carries:

- **`arc: EmotionArc[]`** — its emotional alchemy as a *path across elements*
  (`{ from, to, element }[]`), the structured form of the human `emotionArc`
  string. A superpower is an arc, not a point. (Option **B**.)
- **`accentOverride?: string`** — an optional, superpower-*owned* identity color
  that is **not** a Wuxing element. Identity color comes from the superpower's
  own accent system, never by borrowing an element. (Option **A**.)

The accent (`superpowerAccentCss` in `superpowers/arc.ts`) resolves to the
override when set, otherwise to a gradient across the arc's element gems — so
the default is *derived from meaning*, with a curated override available where
distinctness demands it.

**Element stays exclusively a property of cards, moves, and emotions.** The
forge colors its surface by the *drawn card's* element (or stays neutral and
lets the superpower's sigil + accent carry identity). Nothing colors a
superpower with a single Wuxing element.

## Consequences

- `launch/offers.ts` no longer reads `channel`. Pack offers expose `accent`
  (the superpower's own identity color); the offer's required `element` is set
  to the arc's **anchor** element strictly as a neutral card-frame default, not
  an identity claim. Re-skinning pack cards to render `accent` instead of the
  anchor element is the follow-up that fully closes the three-fire-packs bug.
- The forge's "color the surface by the superpower's channel" idea is dropped
  (it would collide or override the card's element). `buildForgeSeed` sources
  element from the drawn card; the superpower contributes lens, sigil, arc, and
  accent.
- Mono-element arcs that still look alike (coach vs disruptor — both a single
  fire arc) are the precise places a curated `accentOverride` earns its keep.

## Open (deferred) decision

The concrete accent **palette** — seven distinct, non-Wuxing, non-liminal hues —
is a brand/design call left to the product owner. Until set, accents render as
arc gradients (coach/disruptor will read similarly). The data model and the
`accentOverride` hook make assigning the palette a one-line-per-superpower
change with no structural work.
