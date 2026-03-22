# Spec: Provenance Stamp System

## Purpose

Every BAR and quest carries a two-part visual seal encoding its creative genealogy:
which nation-element produced it, and which of the eight archetypes within that nation.
The stamp persists through trades — when a player receives a BAR, the original creator's
marks stay on it. This is the system's memory of creative provenance.

Like a hallmark on antique silver, or the set symbol + rarity marker on a trading card,
the provenance stamp reads at a glance without text. It is the minimum unit of identity
divergence that makes received artifacts feel genuinely foreign — from another nation,
another role.

## The Two-Part Stamp

```
[Nation Sigil  24×24px] [Archetype Mark  16×16px]
       火                        ◈
  (Pyrakanth)               (Bold-Heart)
```

Rendered as a 44×24px chip, positioned in the bottom-left corner of a BAR or quest card.
Overlaid on the element frame border (z-index above the frame gradient, below the content).

### Nation Sigil (24×24px)

Five glyphs — one per element-nation. Designed as pixel art marks, not Unicode characters.
Requirements:
- Legible at 16px display size (the chip may be displayed at 0.67× in dense lists)
- Hard-edged, single-color fill (element frame color from `ELEMENT_TOKENS[element].frame`)
- Enclosed or self-contained — does not bleed outside its 24×24 bounding box
- Distinct from the Unicode `木火土金水` characters — these are designed marks, not text

Design direction per element:
- Fire (Pyrakanth): upward flame triangle / ascending wedge
- Water (Lamenth): wave arc / bilateral curve
- Wood (Virelune): branching Y / growth fork
- Metal (Argyra): crystalline hexagon / geometric facet
- Earth (Meridia): stable diamond / centered square rotated 45°

### Archetype Mark (16×16px)

Eight marks — role marks, shared across all nations (archetype marks are role-based, not
nation-specific). Intended to distinguish roles at a glance in the context of the nation sigil.

Design direction per archetype:
- Bold-Heart: open circle / sun mark — facing outward, nothing hidden
- Devoted-Guardian: shield outline / enclosing curve — protective boundary
- Decisive-Storm: lightning bolt / diagonal slash — sudden force
- Danger-Walker: asymmetric chevron / lean mark — edge and imbalance
- Still-Point: centered dot / minimal mark — presence without motion
- Subtle-Influence: spiral / inward curve — indirect path
- Truth-Seer: eye / open triangle — perception and revelation
- Joyful-Connector: linked circles / bridge mark — joining elements

## The Resolver

```ts
// src/lib/avatar-utils.ts (alongside getWalkableSpriteUrl and resolveWalkableSprite)

interface ProvenanceStampConfig {
  nationSigilUrl: string    // '/sprites/sigils/nation/{nationKey}.png'
  archetypeMarkUrl: string  // '/sprites/sigils/archetype/{archetypeKey}.png'
  elementColor: string      // ELEMENT_TOKENS[element].frame — for CSS tinting
}

function resolveProvenanceStamp(config: AvatarConfig): ProvenanceStampConfig
```

The resolver does not need element as input — it derives it from nationKey via a static map
(same mapping used by `ELEMENT_TOKENS`). No DB calls.

## Asset Files

```
public/sprites/sigils/
  nation/
    pyrakanth.png     ← 24×24 RGBA, fire sigil
    lamenth.png       ← 24×24 RGBA, water sigil
    virelune.png      ← 24×24 RGBA, wood sigil
    argyra.png        ← 24×24 RGBA, metal sigil
    meridia.png       ← 24×24 RGBA, earth sigil
  archetype/
    bold-heart.png    ← 16×16 RGBA, open circle mark
    devoted-guardian.png
    decisive-storm.png
    danger-walker.png
    still-point.png
    subtle-influence.png
    truth-seer.png
    joyful-connector.png
```

All 13 files: RGBA, transparent background, mark in element frame color (Pyrakanth=fire red,
etc.) — or monochrome white mark that receives CSS `filter` tinting at render time.

**Recommended approach:** Generate marks as white (#FFFFFF) on transparent background.
Apply element color via CSS `filter: brightness(0) saturate(100%) invert(...)` or by
rendering in a `<canvas>` with element color fill. This way a single set of 13 assets
serves all element contexts.

## Where the Stamp Appears

### BAR Card Face

Bottom-left corner of the `.card-art-window` area (or bottom of card if no art window).
Nation sigil + archetype mark side by side. Renders when the BAR has a creator with
known nation + archetype. Placeholder: element dot only (nation sigil alone, no archetype mark)
when archetype unknown.

### Quest Card

Same position. Inherited from the BAR the quest was generated from. Quest cards generated
from a specific BAR carry that BAR's creator's stamp.

### Trade Panel (TradePanel.tsx — LW-4)

Side-by-side comparison during trade:
```
[Your BAR card]          [Agent's BAR card]
 火◈  Bold-Heart          水▲  Devoted-Guardian
```
The stamp communicates instantly whose creative world each BAR came from.

### Received BAR in Vault

After trade ceremony: the received BAR displays in Vault with the ORIGINAL creator's stamp —
not the recipient's. This is the genealogy. The stamp is read from the BAR's `creatorNationKey`
and `creatorArchetypeKey` fields (see schema section).

### IntentAgentPanel (encounter header)

The agent's encounter panel header shows their provenance stamp alongside their name and
element ring. Compact format: 20px sigil + 14px archetype mark.

## Schema

The BAR model needs creator provenance fields to persist the stamp through trades:

```prisma
// Add to CustomBar model in prisma/schema.prisma
creatorNationKey    String?   // nationKey at time of BAR creation
creatorArchetypeKey String?   // archetypeKey at time of BAR creation
```

These are set at creation time from `player.nation.slug` and `player.archetype.slug` and
are immutable thereafter. They do not change when the BAR is traded.

## Forkability

A fork designs 5 nation sigils + 8 archetype marks for their taxonomy. The file paths and
resolver function stay constant — only the PNG content changes. This is the minimum
fork intervention that makes a fork read as a genuinely different game:

- Same element color tokens → same frame colors → sigils rendered in fork's element palette
- New mark shapes → new identity grammar
- Same resolver → same rendering code

## Dependencies

- `src/lib/avatar-utils.ts` — add `resolveProvenanceStamp()`
- `src/lib/ui/card-tokens.ts` — `ELEMENT_TOKENS` (element frame colors)
- `prisma/schema.prisma` — `creatorNationKey`, `creatorArchetypeKey` on CustomBar
- `src/components/bars/BarCardFace.tsx` — render stamp in card corner
- `src/components/world/TradePanel.tsx` (LW-4) — side-by-side stamp comparison
- `src/components/world/IntentAgentPanel.tsx` (LW-4) — stamp in encounter header
- `.specify/specs/asset-register-design-system/spec.md` — design authority
