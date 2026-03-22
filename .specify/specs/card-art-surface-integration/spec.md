# Spec: Card Art Surface Integration

## Purpose

Wire the 40 existing Cosmic register card art images into the running UI. The images exist
in `public/card-art/`, the registry (`lookupCardArt()`) exists in `card-art-registry.ts`,
and the `.card-art-window` CSS slot exists in `cultivation-cards.css` — but zero components
connect them. This spec defines exactly what goes in each art window, at which size, on which
surface, with the correct composition and quarantine rules.

## The Gap in One Sentence

`lookupCardArt()` is never called in any component. Every `.card-art-window` div is empty.

## Quarantine Gate (required in ALL consumers)

Two images contain third-party watermarks and must never render in production:
- `argyra-truth-seer.png`
- `pyrakanth-joyful-connector.png`

```ts
import { QUARANTINED_CARD_KEYS } from '@/lib/ui/card-art-registry'

const artEntry = lookupCardArt(archetypeName, element)
const safeArt = artEntry && !QUARANTINED_CARD_KEYS.has(artEntry.key) ? artEntry : null
// When safeArt is null: render empty .card-art-window — CSS shimmer activates via loading prop
```

This gate is required in every component that renders art. The loading shimmer is already
implemented in `cultivation-cards.css` via `cultivation-card--loading`.

## Composition Rules by Context

All 40 images are 1024×1024px square. The figure sits at approximately 35–40% from the top.

| Context | Container | object-fit | object-position | Notes |
|---------|-----------|------------|-----------------|-------|
| Full card identity (dashboard) | Full card width, 45–55% height | cover | center 15% | Bias top — keep figure visible |
| Medium card (quest/archetype) | 160×120px | cover | center 20% | Upper atmosphere + implied figure |
| Small badge | 48×48px | cover | center 15% | Reads as texture + element color |
| Background wash (nation header) | 100vw × 200px | cover | center 30% | 30% opacity over element gradient |
| Composted stage | Same as parent | cover | center 15% | `artOpacity` = `opacity-20` on img |

## The Eight Surfaces

### Surface 1: Player Identity Card (DashboardHeader) — Priority 1

**Component:** `src/components/dashboard/DashboardHeader.tsx`
**Route:** `/` (dashboard)
**Art lookup:** `lookupCardArt(archetypeName, element)` — both available from `useNation()` hook.
**Art window:** Full card width, height driven by `STAGE_TOKENS[maturity].artWindowHeight`.
**Composition:** `object-cover object-top` (`object-position: center 15%`).
**Data:** Already available — no new fetching required.

### Surface 2: Archetype Card (Nation/Archetype Selection) — Priority 5

**Components:** `src/components/dashboard/ArchetypeCardWithModal.tsx`, `NationModal.tsx`
**Art lookup:** `lookupCardArt(archetypeKey, nationElement)` per card.
**Art window:** `h-[30%]` at seed stage — shows atmospheric band, not the figure.
**Note:** `ArchetypeCardWithModal` uses raw div with hardcoded blue — violates covenant. Migrate
to `CultivationCard` as part of this surface.

### Surface 3: BAR Card Face — Priority 3

**Component:** `src/components/bars/BarCardFace.tsx`
**Art source:** BARs are player-authored. Do NOT use card-art-registry for BAR cards.
If BAR has `imageUrl` (player upload), render it in `.card-art-window`. Otherwise empty.
**Element:** From the BAR author's nation (passed by parent).
**Stage/Altitude defaults:** `stage="seed"`, `altitude="dissatisfied"`.
**Note:** `BarCardFace` is a raw div — migrate to `CultivationCard` as part of this surface.

### Surface 4: Quest Cards (Thread and Pack lists) — Priority 7

**Components:** `QuestThread.tsx`, `QuestPack.tsx`, `StarterQuestBoard.tsx`
**Art source:** Do NOT use card-art-registry for personal quests. The element-tinted frame
gradient (already provided by `card-frame-gradient` inside `CultivationCard`) IS the art.
The quest is pre-alchemy — no cosmic figure.
**Exception:** GM-authored quests with known archetype+nation CAN look up art via
`getCardArtEntry(nationKey, playbookKey)`. Requires adding nationKey/playbookKey to quest schema.
Mark as future enhancement.

### Surface 5: Vault Rooms — Priority 4 (prerequisite for Surfaces 3, 4, 7)

**Routes:** `/hand`, `/hand/charges`, `/hand/quests`, `/hand/drafts`, `/hand/invitations`
**Problem:** These routes have no `NationProvider`. Any `CultivationCard` falls back to `element='earth'`.
**Fix:** Add `NationProvider` to each route — fetch `player.nation.element` and
`player.archetype?.name` at RSC level.
**No card art images in Vault rooms** — element frame color only, no Cosmic art windows.

### Surface 6: Nation Hero Banner — Priority 6

**Target:** Full-width section headers representing a nation.
**Art lookup:** `getCardArtEntry(nationKey, playbookKey ?? 'bold-heart')`.
**Composition:** `object-cover object-[center_30%]`, `opacity-30` over element gradient.
Vertical gradient overlay from `transparent` at top to `#0a0908` at bottom.
**Component to create:** `NationHeroBanner` — accepts `nationKey` + optional `playbookKey`.

### Surface 7: Small Badge (Notifications, Feed) — Priority 6

**Target:** 48×48px identity marker. Player's nation+archetype as a compact visual.
**Art lookup:** `lookupCardArt(archetypeName, element)` — fallback to `Avatar` sprite composite.
**Composition:** `object-cover object-[center_15%]`, `border-radius: 8px` (not circle).
**Component to create:** `PlayerArtBadge` — accepts `archetypeName`, `element`, `size`.

### Surface 8: Wiki Style Guide (Living Demo) — Priority 2

**Route:** `/wiki/ui-style-guide`
**Purpose:** QA surface for all future art integration. Before shipping art to more surfaces,
the style guide must become a visual test harness.
**What to render:**
- 5 cards (one per element) at `stage="growing"`, `altitude="neutral"` with real art
- Altitude strip: 3 cards (dissatisfied/neutral/satisfied) for fire element
- Stage strip: 3 cards (seed/growing/composted) for fire element
- Quarantine placeholder: confirm shimmer shows for the 2 quarantined keys

## Standard Art Window Pattern

```tsx
import { lookupCardArt, QUARANTINED_CARD_KEYS } from '@/lib/ui/card-art-registry'
import { STAGE_TOKENS } from '@/lib/ui/card-tokens'

const artEntry = lookupCardArt(archetypeName, element)
const safeArt = artEntry && !QUARANTINED_CARD_KEYS.has(artEntry.key) ? artEntry : null
const st = STAGE_TOKENS[stage]

return (
  <CultivationCard element={element} altitude={altitude} stage={stage}>
    <div className={`card-art-window ${st.artWindowHeight} overflow-hidden rounded-t-xl`}>
      {safeArt && (
        <img
          src={safeArt.publicPath}
          alt=""
          aria-hidden="true"
          className={`w-full h-full object-cover object-top ${st.artOpacity}`}
        />
      )}
    </div>
    <div className="relative z-10 p-3 space-y-1">
      {/* content */}
    </div>
  </CultivationCard>
)
```

## Dependencies

- `src/lib/ui/card-art-registry.ts` — `lookupCardArt`, `getCardArtEntry`, `QUARANTINED_CARD_KEYS`
- `src/lib/ui/card-tokens.ts` — `STAGE_TOKENS`, `ELEMENT_TOKENS`
- `src/components/ui/CultivationCard.tsx` — `.card-art-window` slot, `useNation()` hook
- `src/lib/ui/nation-provider.tsx` — `NationProvider` — must be in tree for element context
- `public/card-art/` — 40 PNG files (minus 2 quarantined)
