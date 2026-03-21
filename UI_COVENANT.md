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

## AI Build Recipe — Claude Code

> This section is a concrete, step-by-step recipe for Claude Code to implement any new card UI feature within the BARs Engine design system. Follow every step. Do not skip.

### Step 0 — Read These Four Files First (before writing a single line)

```
UI_COVENANT.md                          ← you are here — governing law
src/lib/ui/card-tokens.ts               ← all token values and helper functions
src/styles/cultivation-cards.css        ← all game-aesthetic CSS classes
src/components/ui/CultivationCard.tsx   ← the card primitive; read its props API
```

Then read every component you are about to extend or migrate. Read before writing.

---

### Step 1 — Identify the Three Channels

Before writing any component code, answer these three questions in a comment at the top of the file:

- **Element**: What Wuxing element drives this card? Where does the value come from in the data layer (e.g., `player.nation.element`)? Type is `ElementKey = 'fire' | 'water' | 'wood' | 'metal' | 'earth'`.
- **Altitude**: At which altitude will this card render? Is it static or dynamic? Type is `AlchemyAltitude = 'dissatisfied' | 'neutral' | 'satisfied'`.
- **Stage**: Which density stage is correct for this surface? `seed` (preview/collapsed), `growing` (full detail), or `composted` (historical/done)?

If you cannot answer all three, the component should not render as a `CultivationCard`.

---

### Step 2 — Use CultivationCard, Not a Raw `<div>`

```tsx
import { CultivationCard } from '@/components/ui/CultivationCard'
import { STAGE_TOKENS } from '@/lib/ui/card-tokens'
import type { ElementKey, CardStage } from '@/lib/ui/card-tokens'
import type { AlchemyAltitude } from '@/lib/alchemy/types'

interface Props {
  element: ElementKey
  altitude: AlchemyAltitude
  stage: CardStage
  name: string
  artUrl: string
}

function MyCard({ element, altitude, stage, name, artUrl }: Props) {
  const st = STAGE_TOKENS[stage]
  return (
    <CultivationCard element={element} altitude={altitude} stage={stage}>
      {/* Art window — height and opacity driven by STAGE_TOKENS */}
      <div className={`card-art-window ${st.artWindowHeight} overflow-hidden rounded-t-xl`}>
        <img className={st.artOpacity} src={artUrl} alt={name} />
      </div>
      {/* Content layer — consumer owns interior layout */}
      <div className="relative z-10 p-3 space-y-1">
        <h3 className="font-bold text-sm">{name}</h3>
        {st.statBlockVisible && <StatBlock />}
      </div>
    </CultivationCard>
  )
}
```

**CultivationCard props — full API:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `element` | `ElementKey` | ✅ | Drives color channel — frame, glow, gem |
| `altitude` | `AlchemyAltitude` | ✅ | Drives border/glow intensity channel |
| `stage` | `CardStage` | ✅ | Drives card density — art height, stat block |
| `children` | `ReactNode` | — | All card content. **No typed slot props.** |
| `selected` | `boolean` | — | Applies `cultivation-card--selected` (pulse) |
| `disabled` | `boolean` | — | Applies `cultivation-card--disabled` (30% opacity) |
| `loading` | `boolean` | — | Applies shimmer on `.card-art-window` |
| `ritual` | `boolean` | — | Alchemical moment — 24px glow, scale 1.05 |
| `animated` | `boolean` | — | Entry animation (opacity+Y, 300ms) |
| `floating` | `boolean` | — | Idle float (Y oscillation, altitude-period) |
| `className` | `string` | — | Layout classes only — no aesthetic overrides |
| `aria-label` | `string` | — | Defaults to `"{element} element cultivation card, {altitude} altitude, {stage} stage"` |

**Hard constraints:**
- `children` is the ONLY content API. Never add typed slot props.
- `altitude` type is `AlchemyAltitude` — reused from `@/lib/alchemy/types`. Do NOT define a new altitude type.
- `stage` is UI-only display state. Do NOT couple it to domain status fields.
- `CultivationCard` automatically injects `--element-frame`, `--element-glow`, `--element-gem`, `--glow-radius`, `--grad-from`, `--grad-to`, `--float-period` as CSS custom properties. Never set them manually on a consumer.

---

### Step 3 — Wire NationProvider in the RSC Tree

`NationProvider` is server-fed. Place it in the RSC `page.tsx` or `layout.tsx` where player data is fetched. Never inside a client component.

```tsx
// src/app/page.tsx  (RSC — server component)
import { NationProvider } from '@/lib/ui/nation-provider'

export default async function RootPage() {
  const player = await getPlayerWithNation()   // server-side DB fetch

  return (
    <NationProvider
      element={player?.nation?.element ?? null}
      archetypeName={player?.playerPlaybook?.playbookName ?? null}
    >
      {/* All client components in the subtree can call useNation() */}
      <Dashboard />
    </NationProvider>
  )
}
```

Consume in client components via `useNation()`:

```tsx
'use client'
import { useNation } from '@/lib/ui/nation-provider'

function PlayerHeader() {
  const { element, archetypeName, tokens, cssVars } = useNation()
  // Always handle null — unauthenticated players have element: null
  const sigil      = tokens?.sigil      ?? '◇'
  const accentText = tokens?.textAccent ?? 'text-zinc-400'
  return <span className={accentText}>{sigil} {archetypeName}</span>
}
```

**`useNation()` return shape:**

| Field | Type | Description |
|-------|------|-------------|
| `element` | `ElementKey \| null` | Null when unauthenticated or element not set |
| `archetypeName` | `string \| null` | Playbook/archetype name, or null |
| `tokens` | `ElementTokens \| null` | Full `ELEMENT_TOKENS[element]` object, or null |
| `cssVars` | `Record<string, string>` | CSS vars object (`--element-frame` etc.), or `{}` |

**Hard constraints:**
- Never fetch player data inside `NationProvider` or any client component. Server fetch only.
- Always handle the `null` case. Unauthenticated players have `element: null`, `tokens: null`.
- `element` prop accepts `string | null | undefined` — the provider validates and normalizes to `ElementKey | null` internally.
- Never nest `NationProvider` inside a client component that fetches its own data.

---

### Step 4 — Token Derivation — Never Hardcode

All color, border, and glow values must derive from `card-tokens.ts`. Zero inline hex in component files.

```ts
import { ELEMENT_TOKENS, elementCssVars, altitudeCssVars, ALTITUDE_TOKENS, STAGE_TOKENS } from '@/lib/ui/card-tokens'

// ✅ Correct — derive from token objects
const t = ELEMENT_TOKENS[element]
const frameColor = t.frame         // e.g. '#c1392b' for fire
const glowColor  = t.glow          // e.g. '#e8671a' for fire
const bgClass    = t.bg            // e.g. 'bg-orange-950/40' for fire

// ✅ Correct — CSS vars (preferred — no JS color in JSX at all)
// CultivationCard injects these automatically; use them in CSS classes or inline refs:
// box-shadow: 0 0 8px var(--element-glow)
// border-color: var(--element-frame)

// ✅ Correct — altitude token
const radius = ALTITUDE_TOKENS[altitude].glowRadius  // '0px' | '4px' | '12px'

// ✅ Correct — stage token
const st = STAGE_TOKENS[stage]
const artHeight = st.artWindowHeight  // Tailwind class, e.g. 'h-[50%]'
```

```ts
// ❌ WRONG — hardcoded hex in JSX style prop
style={{ borderColor: '#c1392b' }}

// ❌ WRONG — Tailwind arbitrary value for element color
className="border-[#c1392b] shadow-[0_0_8px_#e8671a]"

// ❌ WRONG — local inline palette
const CHANNEL_META = { fire: { bg: '#431407', ... } }  // delete this pattern entirely
const NATION_PALETTE = { fire: '#c1392b', ... }         // delete this pattern entirely
```

---

### Step 5 — Legacy Component Migration Pattern

When migrating a component that has inline palettes or raw-div cards, follow these three patterns:

**Pattern A — Remove local palette, use ELEMENT_TOKENS:**
```tsx
// ❌ Before (DailyCheckInQuest.tsx pattern)
const CHANNEL_META = {
  fire:  { bg: 'bg-orange-950/40', border: 'border-orange-700/50' },
  water: { bg: 'bg-blue-950/40',   border: 'border-blue-700/50' },
}
const meta = CHANNEL_META[element]

// ✅ After
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'
const t = ELEMENT_TOKENS[element]
// t.bg, t.border, t.borderHover, t.textAccent, t.badgeBg — all available
```

**Pattern B — Remove inline nation palette, wire to NationProvider:**
```tsx
// ❌ Before (DashboardHeader.tsx pattern)
const NATION_PALETTE: Record<string, string> = {
  fire: '#c1392b', water: '#1a3a5c', wood: '#4a7c59',
}
const borderColor = NATION_PALETTE[playerNation]

// ✅ After — NationProvider set in page.tsx (RSC), consume here:
'use client'
import { useNation } from '@/lib/ui/nation-provider'
const { tokens } = useNation()
const accentText = tokens?.textAccent ?? 'text-zinc-400'
```

**Pattern C — Replace raw `<div>` card with CultivationCard primitive:**
```tsx
// ❌ Before (NationCardWithModal.tsx pattern)
<div className="rounded-xl border-2 border-purple-500/50 bg-zinc-900 p-4">

// ✅ After
import { CultivationCard } from '@/components/ui/CultivationCard'
<CultivationCard element={element} altitude="neutral" stage="growing">
  <div className="relative z-10 p-4">
    {/* card content */}
  </div>
</CultivationCard>
```

**Migration completion checklist:**
```
[ ] No CHANNEL_META, NATION_PALETTE, or any local inline color object
[ ] No hardcoded hex values for element or altitude colors in JSX or inline style
[ ] All element colors derived from ELEMENT_TOKENS[element] or via CSS vars
[ ] CultivationCard used for every card-shaped surface (not raw divs with border + bg)
[ ] NationProvider placed in RSC (page.tsx / layout.tsx), not in a client component
[ ] useNation() used in client components — no prop-drilling of element/nation values
[ ] aria-label on every CultivationCard encodes element + altitude + stage
[ ] STAGE_TOKENS[stage] drives art window height, opacity, stat block visibility
[ ] AlchemyAltitude reused as-is — no new altitude type defined anywhere
```

---

### Step 6 — Card Art Registry and Generation Pipeline

**Reading the registry in application code:**
```ts
import { CARD_ART_REGISTRY, getCardArtEntry, getCardArtByElement } from '@/lib/ui/card-art-registry'
import { STAGE_TOKENS } from '@/lib/ui/card-tokens'
import { CultivationCard } from '@/components/ui/CultivationCard'

// Look up a single entry
const entry = getCardArtEntry('pyrakanth', 'bold-heart')
// → { publicPath: '/card-art/pyrakanth-bold-heart.png', element: 'fire', nationLabel: 'Pyrakanth', ... }

// Use in a CultivationCard
if (entry) {
  const st = STAGE_TOKENS.growing
  return (
    <CultivationCard element={entry.element} altitude="neutral" stage="growing">
      <div className={`card-art-window ${st.artWindowHeight} overflow-hidden rounded-t-xl`}>
        <img src={entry.publicPath} alt={`${entry.nationLabel} ${entry.playbookLabel}`} />
      </div>
    </CultivationCard>
  )
}

// Get all 8 fire pairings
const fireEntries = getCardArtByElement('fire')
// → Array of 8 CardArtEntry — one per playbook archetype
```

**Generating card art (admin-only CLI):**
```bash
# Preview all 40 prompts — no API call, no key needed
npx tsx scripts/generate-card-art.ts --dry-run

# Generate all images for one element (8 images)
npx tsx scripts/generate-card-art.ts --element=fire

# Generate one specific pairing
npx tsx scripts/generate-card-art.ts --element=fire --playbook=bold-heart

# Regenerate even if file exists
npx tsx scripts/generate-card-art.ts --element=fire --force

# Generate all 40 (≈10 min due to DALL-E 3 tier-1 rate limits)
npx tsx scripts/generate-card-art.ts

# High-tier API account — remove rate limit delay
npx tsx scripts/generate-card-art.ts --delay-ms=0
```

Output location: `public/card-art/{nationKey}-{playbookKey}.png` (1024×1024, served as Next.js static asset).

**DALL-E prompt architecture:**
- Prompts are built in `card-art-registry.ts::buildPrompt()` — not in the script.
- Hex values (`t.frame`, `t.glow`, `t.gem`) from `ELEMENT_TOKENS[element]` are embedded in every prompt.
- Modify prompts only in `buildPrompt()` inside `card-art-registry.ts` — never in the script.
- Registry invariant: exactly 40 entries (5 nations × 8 playbooks). Module throws if broken.

**Hard constraints for the art pipeline:**
```ts
// ❌ WRONG — never add DB queries to card-art-registry.ts
const entries = await prisma.nation.findMany(...)

// ❌ WRONG — never make card-art-registry.ts async
export async function getCardArt(id: string) { ... }

// ❌ WRONG — never compute entries at request time
export function buildRegistryOnRequest() { ... }

// ✅ CORRECT — registry is pure static computation at module load time
export const CARD_ART_REGISTRY: ReadonlyArray<CardArtEntry> = buildRegistry()
```

---

### Common AI Failure Modes — Hard Stop Rules

If you are about to do any of the following, **stop and re-read this document from Step 0:**

| Failure Mode | Correct Alternative |
|---|---|
| Defining a new altitude type | Reuse `AlchemyAltitude` from `@/lib/alchemy/types` |
| Adding typed slot props to `CultivationCard` | `children` passthrough only — no slots |
| Hardcoding hex values in JSX or inline styles | Import from `card-tokens.ts`; use CSS custom properties |
| Using Tailwind arbitrary values for color / glow / shadow | Use classes from `cultivation-cards.css` |
| Fetching player data in `NationProvider` or a client component | Fetch in RSC page/layout, pass as props |
| Adding `async` or DB calls to `card-art-registry.ts` | Registry is static — no async, no DB, ever |
| Creating a local palette (`CHANNEL_META`, `NATION_PALETTE`, etc.) | Import `ELEMENT_TOKENS` from `card-tokens.ts` |
| Using purple for an element color | Purple = liminal / primary action only. Metal = `#8e9aab` silver-slate |
| Omitting `aria-label` on a `CultivationCard` | Always include — element/altitude/stage must be screen-reader accessible |
| Placing `NationProvider` inside a self-fetching client component | RSC placement only — `page.tsx` or `layout.tsx` |
| Coupling `CardStage` to domain status (e.g. quest completion state) | `stage` is UI display only — set it in the consumer based on display intent |

---

*Last updated: 2026-03-21. AI build recipe added — covers CultivationCard primitive, NationProvider, card-art-registry.ts, generate-card-art.ts admin script, and four legacy migration patterns.*
