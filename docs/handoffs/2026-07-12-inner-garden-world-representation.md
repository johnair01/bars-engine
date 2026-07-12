# Inner Garden — Data-Driven World Representation

> **Companion to** `2026-07-12-inner-garden-bars-design-synthesis.md`. That memo
> established the game spine already exists as OS libs and the garden is a *register*
> over them. This doc answers the next question: **how do we represent the walkable
> pixel-farm world without hardcoding a pixel/map layer per user — for 1000+ personal
> farms + shared farms, on mobile, while still letting people tweak their farm?**
>
> **Locked decisions this builds on:**
> - **D1** — replace the renderer, keep the `src/lib/inner-garden/bridge.ts` contract.
> - **Shared farms = Both** — many campaign commons + a small fixed set of global commons.
> - **Persistence = the No Man's Sky model** — a deterministic generated base + a sparse
>   player-edit overlay. Store the edits, never the map.
>
> **Audience:** whoever writes the mobile renderer next (Claude Design). The renderer is a
> *client* of the representation defined here; it holds no truth.

---

## 1. The one rule

> **The OS owns *what exists*. The player's overlay owns only *where it sits and how it
> looks*.**

Everything below is a consequence of that sentence. It is what lets a farm be both
**infinitely cheap to scale** and **hand-tweakable**, with no contradiction.

- **What exists** — fields, seeds, weeds, gates — is *re-projected from OS truth* every
  load. You cannot rearrange your way out of a weed; weeds die by Cleaning the blocker,
  because a weed is a *rendering of a blocker*, not a thing you own on a map.
- **Where it sits / how it looks** — a moved plot, a chosen tile for a seed, a dropped
  fence, a reskinned field — is the *only* thing stored, as a tiny diff.

---

## 2. The core model — "farm = projection + overlay" (No Man's Sky)

No Man's Sky does not store its planets. It **regenerates each from a seed
deterministically**, and stores only the player's *edits* as a sparse overlay that is
replayed on top. We do exactly this, with OS state as the seed material.

```
renderedFarm  =  applyOverlay( overlay ,  projectFarm( seed , osState ) )
                 └── stored, tiny ──┘      └──── derived, never stored ────┘
```

- **Base farm** = `projectFarm(seed, osState)` — a **pure, deterministic** function.
  - `seed` = a stable id (`playerId` for a personal farm; `campaignRef` or a `commonsId`
    for a shared one).
  - Fields = your **Lenses**; seeds = your **BARs** (growth stage from `seedMetabolization`);
    weeds = your active **blockers**; a gate = your **`campaignRef`**; terrain/biome =
    `fnv32(seed)`.
  - Re-derived on every load. **Nothing about it is persisted** → 0 stored map bytes per
    user.
- **Overlay** = `FarmOverlay` — a sparse set of player deltas keyed by stable OS ids:
  move a field, nudge a seed to a chosen cell, reskin a plot, drop a pure decoration.
  Empty for anyone who never tweaks.

**Why this minimizes complexity (the stated goal):**
- The base is free; you persist only what was actively changed.
- The farm can't drift from truth — semantic content is always re-projected.
- No merge/conflict problem — overrides are keyed by id and orphan-pruned when a Lens/BAR
  is deleted.
- No exploit surface — editing the map is cosmetic; game state lives in the OS.

---

## 3. Three layers (reuse what exists)

| Layer | Owns | Status |
|---|---|---|
| **Semantic** — `CustomBar`, `Lens`, `MoveAttempt`, `Campaign`, `SpokeMoveBed` | truth | **exists** |
| **Projection** — `projectFarm` / `projectSharedFarm` / `applyOverlay` → `FarmScene` | derivation | **new, buildable, pure** |
| **Render** — the mobile pixel-farm | pixels only | **new (Claude Design)** |

The semantic layer reaches the client through the **existing** `inner-garden/bridge.ts`
payloads, extended from Shaman-only to all 5 moves + campaign scope (bump
`bars-inner-garden.v1` → `.v2`, keeping the version discipline).

---

## 4. The `FarmScene` IR — extend the existing space contract, don't invent one

The repo **already** has a serializable, grid-cell space representation
(`src/lib/spatial-world/pixi-room.ts`). We extend it:

```ts
FarmScene = {
  seed: string                        // playerId | campaignRef | commonsId
  biome: BiomeId                      // fnv32(seed) → base terrain + palette
  tilemap: Record<"x,y", { floor?: string; impassable?: boolean; object?: string }>
                                      // ← existing TileMapData shape, grid cells
  anchors: AnchorData[]               // ← existing shape; semantics ride in anchorType + config
  layoutHash: string                  // ← fnv1aHex(tiles, anchors), existing change-detector
}
```

Garden meaning is carried **entirely in existing extension points — no Prisma change**:

- **`anchorType`** gains: `field` · `seed` · `weed` · `gate` · `school_portal` ·
  `building` · `decoration`.
- **`AnchorData.linkedId` / `linkedType`**: `barId`/`CustomBar`, `lensId`/`Lens`, etc.
- **`AnchorData.config`** (already used as a `JSON.stringify` escape hatch): element,
  altitude, growth-stage, face, spirit, `campaignRef`.

Positions are **grid cells**; the renderer multiplies by `TILE_SIZE` at draw time.
Resolution-independent (good for mobile) and it hands you a walkable grid for
tap-to-walk pathfinding for free.

`FarmOverlay` is a sibling type:

```ts
FarmOverlay = {
  overrides: Record<string /* semanticId: barId|lensId */, {
    cell?: { x: number; y: number }   // moved to a chosen cell
    skin?: string                     // reskin / palette override
  }>
  decorations: Array<{ id: string; kind: string; cell: { x: number; y: number } }>
}
```

`applyOverlay(overlay, scene)` moves/reskins matching anchors and appends decoration
anchors. It **cannot remove or mutate** a projected semantic anchor — that's the
enforcement of the §1 rule.

---

## 5. `projectFarm` — deterministic layout from data (no hand-painting)

Reuse the existing deterministic primitives from `spatial-world` (no RNG anywhere):

- **Terrain / biome** from `fnv32(seed)` → pick a base tilemap shape + palette. Extend the
  **geometric** approach in `octagon-campaign-hub.ts` (angular placement via `atan2`) — that
  builder is the good template. Avoid the nursery builder's *hardcoded coordinate* style;
  that's the anti-pattern that doesn't scale.
- **Fields = Lenses**, placed by stable packing in Lens `periodKey` order. **Append-only**:
  adding a Lens adds a field and never re-shuffles existing ones (mobile mental-map
  stability — your farm looks the same tomorrow).
- **Seeds = BARs**, stable-slotted within their field by `createdAt`/`id`; a new BAR fills
  the next free cell. Optional `fnv32(barId)` jitter for an organic, non-gridded look.
- **Weeds = blockers**: a BAR with an active blocker → a `weed` anchor over its cell.
- **Gate = `campaignRef`**: a `gate` anchor → portal into that campaign's shared farm.
- **School portal**: a fixed `school_portal` anchor → the mountain scene (six faces =
  altitudes). The mountain is its own scene, out of this IR's scope but reachable from it.

`projectSharedFarm(campaignRef, campaignState)` is the **same function over campaign
scope** (SpokeMoveBeds / contributions instead of personal BARs).
`buildOctagonCampaignHubRoom` is already a working instance of this shape — generalize it.

**Determinism is the load-bearing property.** `computeSpatialBindKey` / `fnv1aHex`
(`spatial-room-bind.ts`) already give a content fingerprint; the renderer rebuilds its
scene only when `layoutHash` changes, and otherwise does cheap presentation updates.

---

## 6. Token-driven visuals — "don't hardcode art" at the sprite level

A new BAR must never require new art. Every sprite is **composed from data** via the token
systems that already exist:

- **element → tint** — `ELEMENT_TOKENS` (`src/lib/ui/card-tokens.ts`) +
  `channelElement` / `channelGem` (`src/lib/emotional-alchemy/channel-visuals.ts`).
- **altitude → glow / border** — `ALTITUDE_TOKENS` (glow radius + border, *not* hue).
- **growth-stage → sprite frame / density** — `STAGE_TOKENS` (`seed` / `growing` /
  `composted`, mapped from `seedMetabolization` phase).

This is the same three-channel encoding `UI_COVENANT.md` mandates
(element=color, altitude=border, stage=density) — so garden sprites and OS deck cards read
as **one visual system**.

**Bridge gap to close:** today `card-tokens` themes DOM cards, while the Pixi
`RoomRenderer` derives anchor color from a flat `ANCHOR_COLORS` map
(`pixi-room.ts:32`) that's disconnected from the token system. The design adds:

```ts
visualSpecFor(anchor): { tint: number; glow: number; frame: number; atlasKey: string }
```

reading the same tokens, so both surfaces theme from one source. This function is the
renderer's only visual input — swap the atlas, keep the logic.

---

## 7. Scaling to 1000+ (why this is inherently cheap)

- **No stored maps.** 1000 farms = 1000 `projectFarm` calls over BARs/Lenses you already
  store. Overlays are sparse and usually empty.
- **Client-side projection.** The server serves only the small OS JSON via the bridge; the
  client projects and renders. The **server does zero rendering and zero per-user map
  work** — the real scale win. (`ProfileSpatialMap` / `ProfileMapRoom` already exist as an
  *optional* projected-farm cache if a hot path ever profiles badly — a cache, never
  truth.)
- **Content-hash caching.** `layoutHash` → rebuild the scene only on change; otherwise
  cheap updates. Battery/CPU win on mobile.
- **Overlay persistence is tiny.** A per-player `FarmOverlay` JSON, a few KB at most — one
  small column/row, **not** a map table.

---

## 8. Shared farms = Both

- **Campaign commons (many).** `projectSharedFarm(campaignRef, …)` over existing
  `SpokeMoveBed` / `plantBarOnSpoke` / `plantKernelFromBar` / `CollaborationBoard`. A
  personal Lens *graduates* by acquiring a `campaignRef`; co-watering = kernel planting;
  the once/day watering rhythm = the daily hand-limit.
- **Global commons (small fixed set).** A hand-defined seed list (e.g.
  `commons:town-square`) projected the same way over a global/system scope — the social
  hub. Few and fixed → a small **authored registry**, not per-user maps.
- **LOD is the one genuinely-new requirement.** A 1000-contributor commons can't draw 1000
  beds on mobile. Aggregate by region — density tiles ("42 beds here", reusing
  `STAGE_TOKENS` density), drill/zoom to individuals, paginate by spoke. Live neighbors are
  optional: presence (`PlayerMapPresence` / `RoomPresence`) and deterministic offline
  scatter (`intent-agents.ts`, `fnv32(id) % walkable`) already exist — **no real-time
  multiplayer needed for v1.**

---

## 9. Mobile-first specifics

- Grid tilemap + `TILE_SIZE` at draw → scale tiles to viewport. **Viewport culling /
  chunking**: render only cells near the follow-camera. Farms are small, so this is cheap.
- **Sprite atlas** (single texture, many sprites) — already the `RoomRenderer` pattern.
- **Tap-to-walk A\*** over the generated walkable grid. The existing `findPath` is BFS —
  upgrade to A\*; the grid itself comes free from the projection.
- **Small network payload.** The client downloads OS JSON + overlay, not a map;
  deterministic generation means there is nothing to sync.

---

## 10. What gets built where

**Buildable now — a pure, testable lib** (mirrors the `spatial-world` builder pattern;
Deftness: deterministic, no I/O, no render):

- `src/lib/inner-garden/world/scene.ts` — `FarmScene`, the garden `anchorType`s, `FarmOverlay`.
- `src/lib/inner-garden/world/project.ts` — `projectFarm(seed, osState)`,
  `projectSharedFarm(...)`, `applyOverlay(overlay, scene)`. Reuse `fnv32` + the octagon
  geometry.
- `src/lib/inner-garden/world/visuals.ts` — `visualSpecFor(anchor)` reading `card-tokens` /
  `channel-visuals`.
- Extend `src/lib/inner-garden/bridge.ts` payloads (5 moves + campaign scope; `.v2`).
- *(Later)* persist `FarmOverlay` per player — a small JSON column/row, **not** a map table.

**Claude Design — the renderer** (separate, swappable, holds no truth): consumes
`FarmScene` + `visualSpecFor`; adds camera, culling, atlas, A\* tap-to-walk.

---

## 11. How to verify the representation (before any renderer exists)

The whole point is that the hard part is testable *without* pixels:

- **Determinism** — `projectFarm(seed, osState)` twice → identical `FarmScene` +
  `layoutHash` (mirror `spatial-room-bind.test.ts`). Change one BAR → hash changes;
  reorder inputs that shouldn't matter → hash stable.
- **Semantic safety** — an overlay can never remove a weed/seed; `applyOverlay` only
  moves/skins/adds decoration; projected semantic anchors are always present.
- **Append stability** — adding a Lens/BAR appends cells and moves no existing one.
- **Scale smoke** — project 1000 synthetic farms in a loop; assert 0 stored maps and
  bounded time/memory. A 1000-bed commons projects to a *bounded* anchor count (LOD).
- **Overlay round-trip** — tweak → serialize `FarmOverlay` → reload → identical rendered
  farm.

---

## 12. Remaining sub-decisions (not blocking the design)

1. **Overlay scope for v1** — decorations + field-move + reskin, or start
   decorations-only and add moves later? (Smaller v1 = decorations-only.)
2. **Global-commons count and themes** — how many of the "small fixed set," and what are
   they (one town square? a few themed gardens)?
3. **LOD trigger** — beds-per-region before a commons aggregates to density tiles.
4. **The School (mountain)** — one scene or per-face scenes? (Out of this IR's scope, but
   the `school_portal` anchor needs a target.)

---

### Appendix — reused primitives (evidence trail)
- Space contract + renderer: `src/lib/spatial-world/pixi-room.ts` (`TileMapData`,
  `AnchorData`, `ANCHOR_COLORS`, `findPath`, `TILE_SIZE`).
- Deterministic builders: `octagon-campaign-hub.ts` (`buildOctagonCampaignHubRoom`,
  `atan2` angular placement), `nursery-rooms.ts` (contrast: hardcoded coords).
- Change-detection: `spatial-room-bind.ts` (`computeSpatialBindKey`, `fnv1aHex`).
- Seed-stable scatter: `intent-agents.ts` (`fnv32(id) % walkable.length`).
- Per-player map table (optional cache): `ProfileSpatialMap` / `ProfileMapRoom`
  (`prisma/schema.prisma`).
- Visual tokens: `src/lib/ui/card-tokens.ts` (`ELEMENT_TOKENS`, `ALTITUDE_TOKENS`,
  `STAGE_TOKENS`), `src/lib/emotional-alchemy/channel-visuals.ts`.
- OS truth + bridge: `prisma/schema.prisma` (`CustomBar`, `Lens`, `Campaign`,
  `SpokeMoveBed`), `src/lib/inner-garden/bridge.ts`, `src/lib/garden/plant.ts`.
- Covenant: `UI_COVENANT.md` (three-channel encoding).
</content>
