# GUI Asset Integration Spec
## BARS Engine — Bridging the Asset Pipeline to the Running App

> Status: authoritative integration spec. Updated: 2026-03-22.
> This document is the missing bridge between the card art generation pipeline and the running UI.
> Every section ends with a concrete developer task list.

---

## 0. The Problem in One Sentence

40 card art images exist in `public/card-art/`, `lookupCardArt()` exists in `card-art-registry.ts`,
and the `.card-art-window` slot exists in `cultivation-cards.css` — but zero components connect them.
The `CultivationCard` wraps several surfaces, yet every `.card-art-window` div is empty.

This document defines exactly what goes in those windows, at which sizes, on which surfaces,
and what is still missing from the asset set.

---

## 1. Asset Inventory — Current State

### 1.1 Card Art (40 images)

| Status | Location | Format | Coverage |
|--------|----------|--------|----------|
| Generated | `public/card-art/{nationKey}-{playbookKey}.png` | 1024x1024 PNG | 40/40 pairings |
| Quarantined | `argyra-truth-seer.png`, `pyrakanth-joyful-connector.png` | — | 2 images need regen |
| Registry | `src/lib/ui/card-art-registry.ts` | Pure static TS | All 40 indexed |
| UI usage | **Zero** | — | 0/40 rendered |

The registry's `lookupCardArt(archetypeName, element)` function is never called in any component.

### 1.2 Sprite Parts

| Status | Location | Used |
|--------|----------|------|
| Generated | `public/sprites/parts/` | Yes — avatar compositing |
| `base/`, `nation_body/`, `nation_accent/` | 4 + 5 + 5 files | In `Avatar.tsx` / `CharacterCreatorAvatarPreview.tsx` |
| `playbook_outfit/`, `playbook_accent/` | 8 + 8 files | In avatar compositing |
| `walkable/default.png` | Single walk-cycle | In spatial world map |

Sprites are already wired. They are not part of the integration gap.

### 1.3 Design System (wired but art slot empty)

| Asset | Status |
|-------|--------|
| `card-tokens.ts` — `ELEMENT_TOKENS`, `ALTITUDE_TOKENS`, `STAGE_TOKENS` | Wired — used in `DashboardHeader`, `DailyCheckInQuest` |
| `cultivation-cards.css` — `.cultivation-card`, `.card-art-window` | Present — CSS class applied, no image inside |
| `CultivationCard.tsx` | Used in `DashboardHeader`, referenced in `NationCardWithModal`, covenant migration pending |
| `NationProvider` / `useNation()` | Wired on dashboard root (`page.tsx`) — flows into `DashboardHeader` |
| `card-art-registry.ts` — `lookupCardArt()` | Exists, never called |

### 1.4 Quarantined Art

Two images must not be served in production. They contain third-party watermarks:

- `argyra-truth-seer.png` — copyright watermark visible
- `pyrakanth-joyful-connector.png` — watermark visible

Any component that looks up these keys must fall through to the placeholder art window
(shimmer state) until regenerated. The placeholder behavior is already implemented via
`cultivation-card--loading` in `cultivation-cards.css`.

---

## 2. Surface Map — Where Each Asset Type Appears

This section defines every surface in the app that should display card art, what size,
what art to look up, and which component owns it.

### Surface 1: Player Identity Card (Dashboard Header)

**Component:** `src/components/dashboard/DashboardHeader.tsx`
**Route:** `/` (dashboard)
**Art window target size:** 280x280px equivalent — full card width, top 50% of card height

**What art to show:**
```ts
lookupCardArt(player.archetype?.name, player.nation?.element)
// e.g. lookupCardArt('bold-heart', 'fire') → pyrakanth-bold-heart.png
```

**Data already available:** `DashboardHeader` receives `player.nation.element` and
`player.archetype.name` as props. `useNation()` already provides `element` and `archetypeName`.
No new data fetching required.

**Composition rule:** `object-fit: cover`, `object-position: center top`.
The images are square; the art window is landscape at full-card width. Crop from the top —
the figure is centered-to-top in all 40 images. Do not use `object-position: center` as it
cuts the figure's head.

**Stage interaction:** `STAGE_TOKENS[maturity].artWindowHeight` already drives height.
At `seed` stage (questCount < 5): `h-[30%]` — show just the atmospheric band.
At `growing` stage: `h-[50%]` — show figure to waist.
Art opacity: `STAGE_TOKENS[maturity].artOpacity` — `opacity-20` at composted.

**Placeholder:** When `lookupCardArt()` returns null (unauthenticated, archetype not set,
or quarantined image), render the `.card-art-window` with the `loading` prop on
`CultivationCard`. The shimmer fill is already implemented in CSS.

**Developer tasks:**
1. Import `lookupCardArt` from `@/lib/ui/card-art-registry` in `DashboardHeader.tsx`
2. Derive `artEntry = lookupCardArt(archetypeName, element)` — `archetypeName` comes from
   `useNation()`, `element` from `useNation().element`
3. Inside the existing `CultivationCard`, add a `.card-art-window` div as the first child,
   above the identity row
4. Inside `.card-art-window`, render `<img>` when `artEntry` is non-null, else nothing
   (the CSS `loading` shimmer handles the empty state automatically)
5. Apply `${STAGE_TOKENS[maturity].artWindowHeight}` and `${STAGE_TOKENS[maturity].artOpacity}`
   to the image and window respectively
6. Set `object-fit: cover` and `object-position: center top` via inline style or Tailwind
   `object-cover object-top`
7. Add `aria-hidden="true"` on the art image — it is decorative; identity is in the text
8. Gate on quarantined keys: if `artEntry.key` is in `QUARANTINED_CARD_KEYS`, treat as null

### Surface 2: Archetype Card (Nation/Archetype Selection and Profile)

**Components:**
- `src/components/dashboard/ArchetypeCardWithModal.tsx` (currently raw div, no CultivationCard)
- `src/components/dashboard/NationModal.tsx` (not yet audited — check for card anatomy)

**Art window target size:** 160x120px (medium card, landscape)

**What art to show:** Cross-product of nation + archetype. When showing a specific nation's
archetype card, use `lookupCardArt(archetypeKey, nationElement)`.
When showing all 5 nations for one archetype (selection grid), render all 5 with
`getCardArtByPlaybook(archetypeKey)` and let the element token drive the frame color.

**Composition rule:** `object-fit: cover`, `object-position: center 20%`.
At this size the figure is small — crop to show the upper environmental atmosphere plus
the silhouetted figure's shoulders and head.

**Developer tasks:**
1. Migrate `ArchetypeCardWithModal` from raw div to `CultivationCard` (covenant Pattern C)
2. Look up art using the archetype name + element from the nation context or explicit props
3. Apply `stage="seed"` (compact preview) and `altitude="neutral"` as defaults
4. Art window height: use `h-[30%]` at seed stage — shows the atmospheric band, not the figure

### Surface 3: BAR Card Face

**Component:** `src/components/bars/BarCardFace.tsx`
**Current state:** Raw `<div>` with `border-zinc-700`, no `CultivationCard`, no art window

**The BAR card art question:** BARs are player-authored content — they do not have a
fixed nation or archetype. The correct approach is:

- If the BAR's creator has a known element (from their nation), use that element for the
  frame color but do NOT show archetype card art. The art window shows the player's uploaded
  `imageUrl` if present, or the element-shimmer placeholder if not.
- BARs are not cultivation cards in the archetype sense — they are raw emotional captures.
  They should render at `stage="seed"` to reflect their pre-alchemy state.
- Do not look up `card-art-registry` for BAR cards. The registry is for nation+archetype
  pairings only.

**Art window target size:** 160x120px when `imageUrl` is present (4:3 ratio already
implemented via `aspect-[4/3]`).

**Developer tasks:**
1. Replace the raw `<div>` in `BarCardFace.tsx` with `CultivationCard`
2. Accept an `element` prop (from the card author's nation, passed by the parent)
3. Keep `altitude="dissatisfied"` as default for BARs — they are unprocessed charges
4. Keep `stage="seed"` — BARs are seed-stage by definition
5. If `imageUrl` is present, render it inside `.card-art-window` with `object-cover`
6. If `imageUrl` is absent, render the `.card-art-window` div empty — the CSS shimmer
   state activates via `loading={true}` on the parent `CultivationCard` when content
   is still loading, or render a plain element-colored empty window when idle

### Surface 4: Quest Cards (Thread and Pack lists)

**Components:**
- `src/components/QuestThread.tsx`
- `src/components/QuestPack.tsx`
- `src/components/StarterQuestBoard.tsx` (the main active quests grid)

**Current state:** Not yet audited for CultivationCard usage — likely raw divs.

**Art window target size:** 160x120px (medium card).

**What art to show:** Quests are generated from BARs. They carry the creating player's
nation element. They do not have a fixed archetype. Show no card art from the registry.
Instead: element-tinted placeholder (the CSS `.card-art-window` with the frame gradient —
already provided by `card-frame-gradient` inside `CultivationCard`). The atmospheric
gradient IS the art for quests without a specific image.

**Exception — Quest Library / GM-authored quests:** If a GM-authored quest is associated
with a specific archetype and nation, look up art using `getCardArtEntry(nationKey, playbookKey)`.
This requires adding `nationKey` and `playbookKey` metadata to the quest schema, which is
currently absent. Mark this as a future enhancement.

**Developer tasks:**
1. Audit `QuestThread.tsx` and `QuestPack.tsx` — migrate any raw card divs to `CultivationCard`
2. Wire element from the player's nation (NationProvider context is available on the dashboard)
3. Use `stage="growing"` for active quests, `stage="composted"` for completed
4. Do not look up card art for personal quests — the frame gradient is sufficient
5. When upgrading quest cards, ensure all 8 interaction states are present before shipping

### Surface 5: Vault Rooms (Charge, Quests, Drafts, Invitations)

**Routes:** `/hand`, `/hand/charges`, `/hand/quests`, `/hand/drafts`, `/hand/invitations`
**Current state:** Plain `bg-black` pages with no `NationProvider` wrapping.

**Problem:** These routes do not have `NationProvider` in their trees. Any
`CultivationCard` added to Vault components will fall back to `element='earth'` (the
component default), rather than using the player's actual nation element.

**Developer tasks:**
1. Add `NationProvider` to `/hand/page.tsx` — fetch `player.nation.element` and
   `player.archetype?.name` at the RSC level and wrap the return tree
2. Apply the same pattern to `/hand/charges/page.tsx`, `/hand/quests/page.tsx`, etc.
3. Then migrate `VaultChargeList`, `VaultPersonalQuestsBlock`, and `VaultInvitationBarsList`
   to use `CultivationCard` for individual items
4. No card art images in the Vault rooms — these are list/management surfaces. Element tokens
   only (frame color, glow). Art windows are decorative gradient only.

### Surface 6: Nation Room Header / Hero Sections

**Target:** Any full-width section header that represents a nation (e.g. a nation lore page,
a nation-specific campaign page, or the wiki nation entries).

**Art window target size:** Full-width banner, 100vw x ~200px, cropped.

**What art to show:** Any of the 8 archetypes from the relevant nation. Use the
archetype most associated with the current player, or use `bold-heart` as the canonical
"hero" archetype per nation for generic nation hero sections.

**Composition rule (background wash):**
- `object-fit: cover`
- `object-position: center 30%` — the figure is in the upper-center third of the image;
  at full-width landscape crop, positioning at 30% from top keeps the atmospheric lighting
  visible while the figure's silhouette anchors the composition
- Apply `opacity: 0.3` over a solid element-colored background to create a wash effect
  rather than a sharp illustration crop. The element `gradFrom` color from `ELEMENT_TOKENS`
  should underlay the image.
- Overlay a vertical gradient from `transparent` at top to `bgBase` (`#0a0908`) at bottom
  so content below reads cleanly

**Developer tasks:**
1. Create a `NationHeroBanner` component that accepts `nationKey` and optional `playbookKey`
2. Looks up art via `getCardArtEntry(nationKey, playbookKey ?? 'bold-heart')`
3. Renders the image as a `position: absolute, inset: 0` background within a `relative`
   container, with overlay gradient applied
4. No `.card-art-window` class — this is not a card art window; it is a background treatment

### Surface 7: Small Badge (Notifications, List Item Identity Indicators)

**Target size:** 48x48px — the player's nation+archetype identity as a small visual marker.

**What art to show:** Player's own art: `lookupCardArt(archetypeName, element)`.

**Composition rule:**
- `border-radius: 8px` (rounded square, not circle — circles crop the figure badly)
- `object-fit: cover`
- `object-position: center 15%` — bias toward the top to show atmospheric detail and the
  figure's implied presence; at 48px the individual pixel details read as texture, not figure
- Apply a 1px element-colored inset border via `box-shadow: inset 0 0 0 1px {element-frame}` —
  this is already available via `.card-art-window` CSS class

**Usage contexts:** Appreciations feed items, movement feed avatars when the player has
nation+archetype set, invitation sender indicators.

**Developer tasks:**
1. Create a `PlayerArtBadge` component that accepts `archetypeName`, `element`, and `size` prop
2. Internally calls `lookupCardArt()` and falls back to `<Avatar>` sprite composite when null
3. Wraps result in `.card-art-window` span (48x48) — gets inset border from CSS automatically
4. Stacks on top of `Avatar.tsx` — use `PlayerArtBadge` when nation+archetype are set,
   fall back to existing `Avatar` sprite composite otherwise

### Surface 8: Wiki Style Guide (Living Demo)

**Route:** `/wiki/ui-style-guide`
**Current state:** Text-only descriptions. No card renders. No art. No CultivationCard.

**What it should be:** A living demo of the entire design system. Shows all 5 elements,
all 3 altitudes, all 3 stages, with real card art in the `.card-art-window` slots.

**Developer tasks:**
1. Add a `CultivationCardGallery` section to the style guide page
2. Use `CARD_ART_REGISTRY` to render one card per element (5 cards total) at `stage="growing"`
   and `altitude="neutral"` — this shows the art in its primary context
3. Show altitude variants for one element (3 cards: dissatisfied / neutral / satisfied)
4. Show stage variants for one element (3 cards: seed / growing / composted)
5. The style guide page becomes the primary QA surface for new card art

---

## 3. Image Composition Rules by Context

All 40 images are 1024x1024px square. The figure is vertically centered-to-upper in the
composition (figure head at approximately 35-40% from top in most cards).

| Context | Container | object-fit | object-position | Notes |
|---------|-----------|------------|-----------------|-------|
| Full card identity (dashboard) | Full card width, 45-55% height | cover | center 15% | Bias top — keep figure visible |
| Medium card (quest/archetype) | 160x120px | cover | center 20% | Shows upper atmosphere + implied figure |
| Small badge | 48x48px | cover | center 15% | Reads as texture + element color at this size |
| Background wash (nation header) | 100vw x 200px | cover | center 30% | Overlay 30% opacity over element gradient |
| Composted stage | Same as parent | cover | center 15% | artOpacity = opacity-20 on the img tag |

**Quarantine gate — required in all consumers:**

```ts
import { QUARANTINED_CARD_KEYS } from '@/lib/ui/card-art-registry'

const artEntry = lookupCardArt(archetypeName, element)
const safeArt = artEntry && !QUARANTINED_CARD_KEYS.has(artEntry.key) ? artEntry : null
// Render shimmer placeholder when safeArt is null
```

This must be applied in every component that renders art. The quarantine set is exported
from the registry for exactly this purpose.

---

## 4. Missing Assets — What the Pipeline Did Not Generate

### 4.1 Nation-Only Art (no archetype)

**What is missing:** A set of 5 images representing the nations without any specific archetype
figure — pure elemental atmosphere. These are needed for:
- Nation selection screen backgrounds
- Nation room header banners when the player's archetype is unknown
- Onboarding flow nation cards

**Resolution strategy:** Do not generate new images. Instead, use `bold-heart` as the
canonical "hero" representative for each nation. The `bold-heart` compositional modifier
("faces the light source directly, ascending diagonal energy") is the most architecturally
neutral. This avoids an additional generation pass.

**Developer note:** When nation is known but archetype is not, call
`getCardArtEntry(nationKey, 'bold-heart')`. Document this convention explicitly in
`card-art-registry.ts` as a JSDoc comment on `getCardArtEntry`.

### 4.2 Quest-Specific Art

**What is missing:** Art for player-created quests. BARs become quests; quests are personal
and player-authored. They do not have a nation+archetype pairing.

**Resolution strategy:** Do not generate quest-specific art. Quest cards are designed with
the element-tinted frame gradient as their "art." This is architecturally correct:

- The quest is pre-card (raw, player-authored) — it has not been through the alchemical
  moment yet. Its visual state should be `stage="seed"` with no figure art.
- The card art is reserved for the archetypes and nations — the cosmic grammar. Quests are
  personal and particular; they get element color but not cosmic imagery.
- This is consistent with UI_COVENANT Law 10: "Raw/unformatted (pre-card) must look visually
  distinct from element-coded (post-card)."

### 4.3 Navigation Chrome Assets

**What is missing:**

| Asset | Status | Resolution |
|-------|--------|------------|
| Navigation background texture | Not generated | Use `#0a0908` solid — no texture needed per covenant |
| Loading state placeholder | Present in CSS (shimmer) | Wired — no new asset |
| Element sigil icons (木火土金水) | Present in `ELEMENT_TOKENS[e].sigil` as Unicode | Use Unicode — no image needed |
| Active card glow animation | Present in CSS | Wired |
| Transition/wipe animations | Not designed | Defer — not blocking |
| Spatial world background tiles | Separate from card art — world map domain | Out of scope for this document |

No navigation chrome images need to be generated. The `SURFACE_TOKENS` in `card-tokens.ts`
(`bgBase: #0a0908`, `surfaceCard: #1a1a18`, `surfaceElevated: #242420`) define the full OS
chrome. The system is intentionally imageless except for card art windows and avatar sprites.

### 4.4 BAR Photo Art

**What is missing:** Art for the "back face" of a BAR flip card when the player has uploaded
a BAR photo. This is player-generated content — no pipeline asset.

**Resolution:** BAR photos are user uploads (`imageUrl` in `BarCardFace`). The system
already handles this. No generation pipeline needed. The gap is wiring the `imageUrl`
into a proper `.card-art-window` inside a migrated `CultivationCard`.

---

## 5. The BARS Engine OS Aesthetic Layer

Card art is dark pixel art on `#1a1a18`. The surrounding app must feel like the OS
that contains these cards — not a web app with cards dropped in.

### 5.1 Background and Surface System (already defined, not fully applied)

```
Screen background:   #0a0908  (SURFACE_TOKENS.bgBase)
Card body:           #1a1a18  (SURFACE_TOKENS.surfaceCard)
Elevated surfaces:   #242420  (SURFACE_TOKENS.surfaceElevated — modals, sheets)
Inset wells:         #111110  (SURFACE_TOKENS.surfaceInset — description boxes within cards)
```

**Current gap:** Many pages use `bg-black` (pure `#000000`) instead of `#0a0908`. The
warmth difference is small but matters for the pixel art to feel embedded rather than floating.

**Developer task:** Replace `bg-black` with `bg-[#0a0908]` or a new Tailwind config alias
`bg-base` on all page roots. Audit: `src/app/hand/page.tsx`, `src/app/hand/quests/page.tsx`,
`src/app/page.tsx` all use `bg-black`.

### 5.2 Typography Stack (defined in covenant, not verified in practice)

| Role | Font Stack | Class |
|------|-----------|-------|
| Titles / card chrome | Futura PT Bold or geometric sans | `font-bold tracking-tight` |
| Player content / prose | `ui-rounded`, Nunito fallback | `font-sans` (configure in Tailwind) |
| Stats / numerals | Futura Bold tabular | `font-mono tabular-nums` |

**Current gap:** The app uses `font-sans` (default Tailwind) and `font-mono` (monospace),
but Futura PT is not configured in `tailwind.config` or loaded via `next/font`. The
pixel art card aesthetic depends on the geometric sans weight pairing.

**Developer task:** Add Futura PT or a configured geometric sans (Nunito, DM Sans) to the
Next.js font config and register it as `font-display` in `tailwind.config.ts`. This does
not require new assets — only font configuration.

### 5.3 Icon Language

The project uses emoji (🌟, ⚡, ✨) and Unicode in live code. The covenant does not
define an icon system beyond element sigils. For coherence with pixel art:

- Use Unicode Wuxing sigils from `ELEMENT_TOKENS[e].sigil` (`木火土金水`) as all element icons
- Use geometric Unicode (◇, ♦, ○, ●) as game UI markers
- Avoid emoji on card surfaces — emoji rendering is OS-dependent and breaks pixel art register
- Emoji are acceptable in system messages, banners, and non-card admin UI

### 5.4 What the Card Art Requires from the Surrounding Chrome

The 40 images are:
- Dark background (`#1a1a18` scene ground)
- Desaturated, chiaroscuro-lit element palette
- Square pixel art, hard edges

For these to read as embedded artifacts rather than floating images, the OS chrome must:

1. Never be lighter than `#1a1a18` adjacent to a card (no white or light gray surfaces)
2. Use element glow colors only as accent light, not as surface fills
3. Keep negative space dominant — the cards are the content; chrome is the absence of content
4. Use the element frame border as the singular chromatic signal — the images supply all other color

---

## 6. Implementation Priority

This is ordered by leverage: which surfaces unblock the most visual coherence per hour of work.

### Priority 1: Player Identity Card — DashboardHeader (1-2 hours)

The single highest-impact surface. Every logged-in player sees this first on every visit.
Adding the art window here proves the integration pattern end-to-end.

Exact tasks:
- Import `lookupCardArt`, `QUARANTINED_CARD_KEYS` in `DashboardHeader.tsx`
- Add `.card-art-window` div as first child of the `CultivationCard`, before the identity row
- Render `<img>` with `object-cover object-top` and stage-driven opacity
- Verify all 5 elements render correctly with their respective art
- Verify quarantine gate works (set `artEntry` for the 2 quarantined images, confirm shimmer shows)

### Priority 2: Wiki Style Guide as Living Demo (2-3 hours)

Before shipping art to more surfaces, the style guide page needs to become a visual test harness.
This makes every subsequent integration PR self-documenting.

Exact tasks:
- Add `CultivationCardGallery` section to `/wiki/ui-style-guide/page.tsx`
- Render 5 cards (one per element) using real art at `stage="growing"`, `altitude="neutral"`
- Render altitude strip (3 cards: dissatisfied / neutral / satisfied) for fire
- Render stage strip (3 cards: seed / growing / composted) for fire
- Show quarantine placeholder behavior explicitly

### Priority 3: BAR Card Migration (2-3 hours)

`BarCardFace.tsx` is a raw div and ships to every BAR list surface. Migrating it to
`CultivationCard` brings the card system into the highest-traffic user-generated content
surface.

Exact tasks:
- Migrate `BarCardFace.tsx` to `CultivationCard` per covenant Pattern C
- Accept `element` prop from the parent (BAR author's nation element)
- Set `stage="seed"`, `altitude="dissatisfied"` as defaults
- Keep `imageUrl` handling — render user photo in `.card-art-window` when present
- Add `NationProvider` to the parent Vault page routes

### Priority 4: NationProvider in Vault routes (30 min)

Prerequisite for BAR card and quest card migration in the Vault. The player's element
needs to flow into `/hand` subtrees.

Exact tasks:
- In `/hand/page.tsx`, fetch `player.nation.element` and `player.archetype?.name`
- Wrap the return JSX in `<NationProvider element={...} archetypeName={...}>`
- Repeat for `/hand/charges/page.tsx`, `/hand/quests/page.tsx`, `/hand/drafts/page.tsx`,
  `/hand/invitations/page.tsx`

### Priority 5: Archetype Card Migration (2 hours)

`ArchetypeCardWithModal.tsx` is currently a raw `<button>` div with hardcoded blue.
This violates the covenant (purple = liminal/action only, metal = silver-slate not blue).

Exact tasks:
- Migrate to `CultivationCard` with explicit `element` prop from the archetype's nation
- Look up art using `lookupCardArt(archetype.name, nationElement)`
- Render at `stage="seed"` (compact) with `altitude="neutral"`

### Priority 6: SceneCard Migration (3-4 hours)

`SceneCard.tsx` uses `TONE_BORDER` — a local color object that violates the covenant.
The tones map to altitude: contemplative=dissatisfied, charged=neutral, revelatory/completion=satisfied.

Exact tasks:
- Remove `TONE_BORDER` local object
- Replace with `CultivationCard` where `tone` maps to `altitude`:
  - `contemplative` → `altitude="dissatisfied"`
  - `charged` → `altitude="neutral"`
  - `revelatory` / `completion` → `altitude="satisfied"`
- Element comes from NationProvider context (the scene is in the player's element register)
- No card art in scene cards — these are contemplative full-screen surfaces, not card-art surfaces

### Priority 7: Quest Thread and Pack Cards (4-6 hours)

The most complex migration — the quest card system has multiple components and states.
Defer until Priorities 1-6 are complete and the pattern is proven.

---

## 7. Developer Quick Reference

### Looking Up Art

```ts
import {
  lookupCardArt,
  getCardArtEntry,
  getCardArtByElement,
  getCardArtByPlaybook,
  QUARANTINED_CARD_KEYS,
} from '@/lib/ui/card-art-registry'
import { STAGE_TOKENS } from '@/lib/ui/card-tokens'

// Primary lookup — for player identity card
const art = lookupCardArt(archetypeName, element)
const safeArt = art && !QUARANTINED_CARD_KEYS.has(art.key) ? art : null

// Nation-only fallback (when archetype unknown)
const nationArt = getCardArtEntry(nationKey, 'bold-heart')

// All fire cards (e.g. for style guide gallery)
const fireCards = getCardArtByElement('fire')
```

### Rendering an Art Window

```tsx
import { CultivationCard, useCardStage } from '@/components/ui/CultivationCard'
import { STAGE_TOKENS } from '@/lib/ui/card-tokens'

// Inside any component wrapped by CultivationCard:
const st = STAGE_TOKENS[stage]

return (
  <CultivationCard element={element} altitude={altitude} stage={stage}>
    {/* Art window — always first child */}
    <div className={`card-art-window ${st.artWindowHeight} overflow-hidden rounded-t-xl`}>
      {safeArt ? (
        <img
          src={safeArt.publicPath}
          alt=""              // decorative — identity is in the text below
          aria-hidden="true"
          className={`w-full h-full object-cover object-top ${st.artOpacity}`}
        />
      ) : null}
    </div>
    {/* Content */}
    <div className="relative z-10 p-3 space-y-1">
      {/* ... */}
    </div>
  </CultivationCard>
)
```

### Object Position by Context

```ts
const OBJECT_POSITION = {
  'full-card':        'object-top',          // object-position: center 15%
  'medium-card':      'object-[center_20%]', // object-position: center 20%
  'small-badge':      'object-[center_15%]', // object-position: center 15%
  'background-wash':  'object-[center_30%]', // object-position: center 30%
} as const
```

Note: `object-[center_20%]` requires the Tailwind `content` config to allow arbitrary values,
which is already enabled in this project. Verify in `tailwind.config.ts`.

### Quarantine Gate (required in all consumers)

```ts
import { QUARANTINED_CARD_KEYS } from '@/lib/ui/card-art-registry'

function getSafeArt(archetypeName: string | null, element: string | null) {
  const entry = lookupCardArt(archetypeName, element)
  if (!entry) return null
  if (QUARANTINED_CARD_KEYS.has(entry.key)) return null
  return entry
}
```

---

## 8. What This Document Does Not Cover

- **Spatial world / game map art:** The walkable sprite is a separate domain. World map
  tile art and scene background art are out of scope for this spec.
- **Admin UI art:** Admin panels do not use card art. The generation script output goes
  here for inspection only.
- **AI-generated quest images:** If the system ever generates per-quest images via
  DALL-E/Ideogram, those need a separate integration spec. They are not part of the
  current registry.
- **Animation between cards:** Page transitions and card flip animations are a separate
  spec. The entry and float animations in CSS are sufficient for the initial integration.

---

*This document should be read alongside `UI_COVENANT.md` and `src/lib/ui/card-tokens.ts`.
When in doubt about a visual decision, check whether it traces to a token in `card-tokens.ts`.
If it does not, it either reveals a token gap (add the token) or should not exist.*
