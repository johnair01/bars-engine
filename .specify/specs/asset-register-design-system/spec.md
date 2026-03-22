# Spec: Asset Register Design System

## Purpose

Define the seven semantic registers that compose the BARS Engine visual language.
Each register answers a different question a game UI must answer. Together they form
the design source of truth for all generated and derived assets, and the forkability
architecture for communities that build their own nation systems.

Hero illustrations (the 40 Cosmic images) are one register. A complete game UI
requires six more. This spec names all seven, defines their format contracts, and
specifies what must be generated vs derived vs configured.

## The Seven Registers

### Register 1: Cosmic — *Who is this archetype in mythic form?*

**Semantic purpose:** Identity at its fullest. The archetype in elemental environment.
**Format:** 1024×1024px RGBA PNG. Dark chiaroscuro pixel art. One per nation+archetype pairing.
**Asset count:** 40 images (5 nations × 8 archetypes). Done.
**Used in:** Player identity card, archetype selection, nation hero banners.
**Forkability:** A fork generates a new set of 40 images using the same Flux+LoRA style preamble
with their own nation/archetype taxonomy. The style preamble in `docs/card-art-prompt-template.md`
is the fork contract.

### Register 2: Provenance Stamp — *Where did this BAR come from?*

**Semantic purpose:** Creative genealogy. The two-part seal that appears on every BAR and quest,
encoding which nation and which archetype within that nation produced it. Persists through trades.
**Format:** Two marks used together as a 40×16px chip on card corners:
- Nation sigil: 24×24px pixel glyph. 5 glyphs (one per element-nation). Designed, not Unicode.
- Archetype mark: 16×16px geometric mark. 8 marks (role marks, shared across nations).
**Asset count:** 13 marks total. Not yet generated.
**Used in:** BAR card face corner, quest card corner, trade panel (side-by-side provenance comparison),
received BAR attribution in Vault.
**Forkability:** A fork designs 5 nation sigils + 8 archetype marks for their taxonomy. The
`resolveProvenanceStamp(config)` resolver is the implementation contract.
**See:** `.specify/specs/provenance-stamp-system/spec.md` for full implementation spec.

### Register 3: Portrait — *Who is this character at human scale?*

**Semantic purpose:** Recognition at conversation scale. Between the 1024px cosmic illustration
and the 16×24px walk sprite — the character at panel/dialog size.
**Format:** 64×96px cropped square. Derived from Cosmic art — CSS crop at `object-position: center 15%`
with element-colored vignette overlay. No new generation required for initial pass.
**Used in:** IntentAgentPanel (lobby encounter), TradePanel (offering player face), BAR attribution
on received BARs, LibrarianPanel NPC face.
**Forkability:** Inherits from Cosmic — a fork replacing the Cosmic set automatically gets new
portraits via the same crop pattern.

### Register 4: Walk Sprite — *Who is this character in motion?*

**Semantic purpose:** Playable form. The character as a moving entity in the lobby world.
**Format:** Three composited RGBA sprite sheets (512×64px each, 8 frames: 4 dirs × 2):
- `walkable/base/{genderKey}.png` — 4 files, neutral body in motion
- `walkable/nation/{nationKey}.png` — 5 files, nation color overlay (derived from ELEMENT_TOKENS)
- `walkable/archetype/{archetypeKey}.png` — 8 files, archetype silhouette overlay
**Compositing:** Same build-a-bear approach as portrait avatar (Avatar.tsx). In Pixi.js: three
stacked Sprites from one AvatarConfig via `resolveWalkableSprite(config)`.
**Forkability:** A fork generates base walk sheets + archetype silhouettes. Nation colors derive
from their element token overrides — no additional sprite generation needed.
**See:** `seed-bar-lobby-world.yaml` LW-7 for full implementation spec.

### Register 5: Frame/Chrome — *What state and move type is active?*

**Semantic purpose:** Phase and move encoding. Altitude (dissatisfied/neutral/satisfied) and
stage (seed/growing/composted) are already handled by CSS tokens. The missing piece: move icons.
**Format:** 4 move icons at 24×24px. One per move family: Wake Up / Grow Up / Show Up / Clean Up.
Designed as compass-direction marks (↑→↓←) or elemental directional glyphs. Pixel art weight.
**Used in:** OrientationCompass quadrant labels, VaultFourMovesStrip badges, quest card
move-affiliation mark, DashboardActionButtons.
**Forkability:** Move icons are game grammar, not nation skin — they stay constant across forks.
A fork may restyle them but the four-move semantic is fixed.

### Register 6: Zone/Texture — *What kind of space is this?*

**Semantic purpose:** Spatial ownership. Distinguishes Vault surfaces from quest spaces from lobby
rooms at a glance, without relying solely on color.
**Format:** Tileable 64×64px RGBA PNG. Near-black on `#0a0908` base. Subtle grain — readable
as absence, not presence. 3–5 zone variants (lobby floor, vault, quest space, card-club).
**Used in:** Page backgrounds on `/hand` routes, lobby room floor tile, card-club trading floor,
ambient layer beneath nation room backgrounds.
**Forkability:** A fork generates zone textures in their aesthetic register. CSS
`background-image: url(...)` with element tint via `mix-blend-mode: multiply`.

### Register 7: Ceremony/Effect — *What just happened?*

**Semantic purpose:** Event punctuation. The ritual moment — trade completion, BAR received,
quest spawned, daily check-in confirmed.
**Format:** CSS-only animation per element. Element-colored particle burst or card flip sequence.
No image assets required — color derives from ELEMENT_TOKENS automatically.
**Used in:** TradeCeremony component (LW-4), DailyCheckIn completion, BAR landing in Vault.
**Forkability:** A fork overrides element color tokens → ceremony inherits automatically.
No additional asset generation needed.

## The Coherence Stack

All four character-scale registers represent the same entity at different contexts:

```
Cosmic (1024px mythic illustration)
    ↕ same nation+archetype pairing — same color palette
Portrait (64px, CSS-derived crop)
    ↕ same color palette — same archetype silhouette shape
Walk Sprite (512×64px, Pixi-composited layers)
    ↕ same config keys — same provenance encoding
Provenance Stamp (24+16px marks)
```

One `AvatarConfig { nationKey, archetypeKey, genderKey }` drives all four renderers:

```
getAvatarPartSpecs(config)       → portrait CSS layers    (Avatar.tsx)
resolveWalkableSprite(config)    → Pixi walk layers       (pixi-room.ts)
resolveProvenanceStamp(config)   → sigil + mark chip      (BAR card corner)
```

## Forkability Architecture

A community forking bars-engine to build their own nation system needs to replace assets
at specific registers. Minimum viable fork:

| What to replace | Register | Files | Notes |
|-----------------|----------|-------|-------|
| New nation illustrations | Cosmic | 40 new PNGs | Same Flux+LoRA style preamble |
| New nation identifiers | Provenance Stamp | 5 sigil glyphs | Required — anchors all wayfinding |
| New archetype identifiers | Provenance Stamp | 8 archetype marks | Required — encodes role provenance |
| Element colors | card-tokens.ts | Token overrides | Walk sprite nation layers auto-derive |
| Walk sprites | Walk Sprite | 4 base + 8 archetype sheets | Nation color layer auto-derives from tokens |

Optional (can inherit from base):
- Portrait: auto-derived from new Cosmic art
- Frame/Chrome: move icons stay constant (game grammar)
- Zone/Texture: can use base textures, or generate new
- Ceremony/Effect: auto-inherits new element colors

## Design Constraints

- All RGBA PNGs must have transparent regions outside the character/mark area. No solid backgrounds.
- Portrait layers: 64×64px exactly.
- Walk sprite sheets: 512×64px exactly, 8 frames, direction order: down(0-1) left(2-3) right(4-5) up(6-7).
- Nation sigils: legible at 16px display size. Test at 1× before committing.
- Archetype marks: legible at 12px display size.
- All colors must trace to `ELEMENT_TOKENS` or `SURFACE_TOKENS` in `card-tokens.ts`. No hardcoded hex.

## Dependencies

- `src/lib/ui/card-tokens.ts` — ELEMENT_TOKENS, SURFACE_TOKENS (authoritative color source)
- `src/lib/avatar-utils.ts` — AvatarConfig, getWalkableSpriteUrl (existing; extend with resolvers)
- `src/lib/ui/card-art-registry.ts` — Cosmic register registry
- `seed-bar-lobby-world.yaml` LW-7 — Walk Sprite implementation
- `.specify/specs/provenance-stamp-system/spec.md` — Provenance Stamp implementation
- `.specify/specs/card-art-surface-integration/spec.md` — Cosmic register surface wiring
