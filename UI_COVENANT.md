# BARS ENGINE — UI COVENANT

> Read this file before writing any UI code.
> This is not documentation for humans. It is a constraint file for AI assistants and developers.
> Every visual decision must trace back to a token in this file or it does not exist.

---

## The Governing Principle

Every interactive element is a **Cultivation Card** with exactly three visible properties:
- **Element** (Wood / Fire / Earth / Metal / Water)
- **Altitude** (dissatisfied / neutral / satisfied)
- **Stage** (seed / growing / composted)

The visual language encodes only these three things. Cover the text of any element. You should still know its element, altitude, and stage from the visual grammar alone.

*If Wes Anderson made an 8-bit Taoist cultivation Hearthstone — iPhone-native, touch-first, dark.*

---

## The Aesthetic Session-Start Prompt

When beginning any UI work session with an AI assistant, the **first message must include**:

> "Read `UI_COVENANT.md` before writing any UI code. Apply the three-channel encoding system (element=color, altitude=border, stage=density). Use CSS classes from `src/styles/cultivation-cards.css` for all game aesthetic. Use Tailwind only for layout. Reference `src/lib/ui/card-tokens.ts` for all color values."

---

## Non-Negotiable Laws

1. **Three channels only.** Element = color. Altitude = border. Stage = card density. No fourth channel.
2. **Three fonts maximum.** Display/titles: Futura PT Bold or geometric equivalent. Body/player content: `ui-rounded` (iOS) / Nunito (fallback). Stats/numerals: Futura Bold with `font-variant-numeric: tabular-nums`. No other typefaces.
3. **Card anatomy is fixed.** Frame > Art Window (45–55% height) > Name Banner (centered, gem) > Description Box > Stat Block (bottom-left=offense, bottom-right=defense) > Resource Cost (top-left). This order never changes.
4. **Eight interaction states, implemented before a card ships.** Default, Hover, Focus, Active, Selected, Disabled, Loading, Ritual.
5. **Thumb-first layout.** Primary actions in the bottom 40% of screen. Nothing critical at top.
6. **Bilateral symmetry on cards.** Asymmetry only inside the art window.
7. **Game aesthetic via CSS classes, NOT Tailwind arbitrary values.** Tailwind = layout. `cultivation-cards.css` = visual identity. AI will silently mangle arbitrary values. This file is authoritative.
8. **Shēng cycle resonance as accent only.** Wood→Fire→Earth→Metal→Water→Wood. Interacting element may carry glow accent in the fed element's color. Primary frame color never changes.
9. **Semantic color only.** Every color has a Wuxing justification. Decorative use of element colors is forbidden.
10. **Pre-card to post-card is the alchemical moment.** Raw/unformatted (pre-card) must look visually distinct from element-coded (post-card). This is the product's core metaphor.
11. **WCAG AA is a build gate, not a suggestion.** 4.5:1 for body text, 3:1 for large text/UI components. 44px minimum touch target. No exceptions for aesthetic reasons.
12. **One ambient change per screen without user input.** Idle float on active cards. Nothing else moves unless the user acts.
13. **Dark background: `#0a0908`.** Do not lighten for accessibility — fix contrast by adjusting foreground tokens.
14. **`card-tokens.ts` and this file are committed to the repo.** No token lives only in a component. Read this file at every session start.
15. **Navigation = six spatial zones, not tabs.** Shaman / Challenger / Regent / Architect / Diplomat / Sage. Tab bars are an OS convention, not a Cultivation Card convention.

---

## Three-Channel Visual Encoding

### Channel 1: Element → Color

| Element | Frame | Glow | Gem |
|---------|-------|------|-----|
| Wood 木 | `#4a7c59` muted sage | `#27AE60` jade | `#2ecc71` |
| Fire 火 | `#c1392b` cinnabar | `#e8671a` ember-ochre | `#e74c3c` |
| Earth 土 | `#b5651d` terracotta | `#D4A017` ochre | `#d4a017` |
| Metal 金 | `#8e9aab` silver-slate | `#BDC3C7` chrome | `#bdc3c7` |
| Water 水 | `#1a3a5c` deep navy | `#1a7a8a` deep teal | `#2980b9` |

Applied to: frame border, glow (box-shadow), element gem. Never to card body fill.
Card body is always `#1a1a18` (warm near-black).

**Note:** Metal uses silver-slate, NOT purple. Purple is reserved for liminal/primary action states only.

### Channel 2: Altitude → Border

| Altitude | Border | Glow Radius | Float Period |
|----------|--------|-------------|--------------|
| Dissatisfied | 1px solid, 30% opacity | 0px — no glow | Static |
| Neutral | 2px solid, 70% opacity | 4px outer soft | 4s ease-in-out |
| Satisfied | 2px solid, 100% opacity | 12px outer + 1px inner ring | 6s ease-in-out |

Glow uses CSS var `--element-glow` — never hardcoded hex in component files.

### Channel 3: Stage → Card Density

| Stage | Art Window | Description | Stat Block |
|-------|------------|-------------|------------|
| Seed | 30% height | 1–2 lines | Hidden |
| Growing | 45–55% height | Full | Visible |
| Composted | 20% opacity | Full + crosshatch texture overlay | 40% opacity |

---

## Typography Rules

| Role | Font | Weight | Size floor | Rule |
|------|------|--------|------------|------|
| Card titles / labels | Futura PT Bold | 700 | 11px | Structural chrome. Never player content. |
| Body / player text | ui-rounded / Nunito | 400 | 14px | Player-authored text, prose, descriptions. |
| Stats / numbers | Futura Bold tabular | 700 | 12px | `font-variant-numeric: tabular-nums` always. |

**`text-zinc-600` at `text-xs` is forbidden.** ~3.2:1 contrast ratio — below AA.
Minimum pairing: `text-zinc-400` at `text-xs`, or `text-zinc-500` at `text-sm`.

---

## Surfaces and Base Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#0a0908` | Screen background |
| `--surface-card` | `#1a1a18` | Card body |
| `--surface-elevated` | `#242420` | Modals, bottom sheets |
| `--surface-inset` | `#111110` | Description wells within cards |
| `--text-primary` | `#e8e6e0` | Primary text (warm white) |
| `--text-secondary` | `#a09e98` | Secondary text |
| `--text-muted` | `#6b6965` | Muted text — only at `text-sm`+ |

---

## Physical Card Feel (CSS Minimum)

```css
.cultivation-card {
  background-color: #1a1a18;
  border-radius: 12px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),   /* top-edge highlight — makes it physical */
    0 0 0 2px var(--element-frame, #3f3f46),    /* frame border */
    0 0 var(--glow-radius, 0px) var(--element-glow, transparent); /* altitude glow */
}
```

The `inset 0 1px 0 rgba(255,255,255,0.06)` line is the single most effective trick for making a flat dark card read as a physical object. It must be present on every card.

---

## Eight Interaction States

| State | Visual | Timing |
|-------|--------|--------|
| Default | Base frame, altitude glow, idle float | 4s ease-in-out −3px Y |
| Hover | Glow +4px, scale 1.02 | 150ms ease-out |
| Focus | 2px white outer ring, offset 2px | Instant |
| Active | scale 0.97, shadow-inner | 80ms ease-in |
| Selected | Full-brightness border, satisfied glow intensity | 2s pulse |
| Disabled | 30% opacity, no glow, no animation | — |
| Loading | Shimmer on art window only | 1.5s linear |
| Ritual | Glow 24px, scale 1.05, haptic + tone | 300ms entry |

Ritual haptic: `navigator.vibrate?.([15, 5, 10])` + AudioContext 432Hz tone, 150ms.

---

## Entry Animation

```css
@keyframes cardEntry {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.cultivation-card-enter { animation: cardEntry 300ms ease-out forwards; }
```

Idle float:
```css
@keyframes cardFloat {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-3px); }
}
.cultivation-card-active { animation: cardFloat 4s ease-in-out infinite; }
```

Both must pause under `prefers-reduced-motion`.

---

## Production Pipeline

**Step 1 — Description:** What is the player doing? Which GM face zone? What elements, altitude range, stages are present?

**Step 2 — Design Brief:** List every card. Assign element/altitude/stage. Identify primary action location. Flag Ritual moments. Note all player-authored text.

**Step 3 — Token Application:** Open `UI_COVENANT.md` + `card-tokens.ts`. Map every visual decision to a token. If it can't be mapped, it reveals a token gap or shouldn't exist.

**Step 4 — Component Build:** Tailwind for layout. `cultivation-cards.css` for all game aesthetic. No arbitrary Tailwind values for color/shadow/animation. All 8 states before shipping.

**Step 5 — Covenant Check:**
```
[ ] All text contrast ≥ 4.5:1
[ ] All touch targets ≥ 44px
[ ] No text-zinc-600 at text-xs
[ ] No hardcoded hex in component files
[ ] No arbitrary Tailwind values for aesthetic
[ ] All 8 interaction states present
[ ] prefers-reduced-motion guard on animations
[ ] aria-label on all cards (element/altitude/stage)
[ ] UI_COVENANT.md read at session start
```

---

## What to Migrate First

1. `NationCardWithModal.tsx` — simplest existing card, hardcoded purple → element tokens
2. `DailyCheckInQuest.tsx` — has local `CHANNEL_META` → replace with `ELEMENT_TOKENS`
3. `SceneCard.tsx` — `TONE_BORDER` system → express through altitude channel
4. `BarCardFace.tsx` — no element at all → add element prop and full card anatomy

---

*Last updated: 2026-03-20. Source: 6-face GM consultation + synthesis.*
