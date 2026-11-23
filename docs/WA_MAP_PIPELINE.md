# WA Map Pipeline — integrating the maps already built

**Companion to** `docs/WORKADVENTURE_INTEGRATION.md` §7. That section proposed generating Tiled from `SpatialMap.anchors`.
Those models are marked for deprecation, and something better already exists. This document replaces the proposal,
and records what was built.

**Ground:** verified against `~/bars-engine` git history, the live WorkAdventure `v1.35.0` map validator and map
runtime (`libs/map-editor/src/GameMap/MapValidator.ts`, `play/src/front/Phaser/Game/GameMap/GameMapFrontWrapper.ts`),
and the council board (`/api/board/live`).

---

## 1. What already exists

Three generated maps, all in bars-engine under `public/wa/`.

| Map | Commit | Where | What it is |
|---|---|---|---|
| **Lantern Walk** | `a12becd70` (2026-11-21) | `main` | 40×24 office map: office door, three notice posts (`openWebsite` areas, unread/read glow layers), three places to walk to |
| **Calrunian Dojo** | `a5fd20865` (2026-11-22) | `claude/project-thread-l8llnl` | 44×36, gate → courtyard → two halls → dojo with stance wall; two walker sheets; CC0 sheets kept beside the built tiles |
| **Heaven Sect court** | `88d9486dd` (2026-11-22) | `claude/project-thread-vtqphx` | 96×80, **eleven labelled meeting rooms + three doors to other maps** |

The Heaven Sect one is the important one, because it is not a map — it is a **map language**:

```
sect-base.json          shared: tiles, wall colours, named pieces, plaque style, walk rules, room grammar
levels/<map>.json       one level: rooms (kind, box, doors, seats), paved walks, exits to other maps
        │
        ▼  python3 gen_sect.py --level levels/heaven-sect-court.json
   <map>.tmj  +  tiles/  +  <map>-render.png
```

It already refuses to write a bad map: rooms under the meeting-room minimum, doors or walks under the rule widths, a
seat count that disagrees with the level, or **any seat, door or exit unreachable from the start**. Rooms come out as
`jitsiRoom` + `focusable` areas; exits come out as `exitUrl` areas. That is real WorkAdventure semantics, generated.

**This is the generator.** It generates from a design language rather than from database rows, which is strictly
better for map-making: the level file is diffable, reviewable and re-renderable. `SpatialMap` / `MapRoom` / `Anchor`
are not needed for any of this. Let them go.

---

## 2. Two rules that were broken, and one that was misread

WorkAdventure reads a Tiled map differently from how Tiled draws it. Two of those differences are invisible in a
screenshot, and every one of the three maps broke at least one. **None of them would have loaded.**

### 2.1 `floorLayer` must be an Object Layer (hard error)

Verbatim, from `MapValidator.validateLayers`:

> `Your map must have a layer named "floorLayer" of type "Object Layer".`

All three generators emitted `floorLayer` as a **tile layer**. WA refuses the map outright.

### 2.2 Collision is a tile property, not a layer (silent, and worse)

All three maps emitted a `collisions` tile layer. WorkAdventure does not read a collision layer: it reads a boolean
`collides` property on the **tileset's tiles** (`setCollisionByProperty({ collides: true })`). Every tileset had
`tiles: []`. Consequences: players walk through every wall, and a *visible* collision layer is drawn like art.

### 2.3 A hidden layer still collides — which changes the fix entirely

The obvious repair (delete the `collisions` layer, mark the wall art `collides`) is **wrong for these maps**. In the
Dojo and the Sect, the walls live in the hidden mask and the visible art is a different set of tiles. Deleting the
mask deletes every wall's collision.

WorkAdventure says so itself, in `GameMapFrontWrapper.ts`:

> Layers hidden with `WA.room.hideLayer`: their tiles stop colliding (this is how doors open).
> **A layer hidden in Tiled still collides: maps use one to draw invisible walls.**

So the mask layer stays, hidden, and its tiles get the property. Collision is then identical, cell for cell, to what
the generator intended.

### 2.4 `start` was misread — a tile layer is correct

A layer named `start` of type *tile layer* is the documented way to place spawn points: `GameMapFrontWrapper`
classifies **every non-empty tile** in a layer named `start` as a spawn position. So the tile layer is right, and the
validator's only complaint about a missing `start` is a warning.

The real bug is smaller and nastier: the marker tile was the **same gid as a collided wall tile**. So the spawn point
was a wall, and the player materialised inside it. `apply()` repoints the marker at the ground tile beneath it —
invisible, and guaranteed walkable.

---

## 3. What was built

`public/wa/wa_export.py` — `apply(tmj)` fixes the three, `check(tmj)` returns every reason a map would not load or
would misbehave, `report(tmj)` prints both. All three generators now end with:

```python
wa_apply(tmj)
_wa = wa_check(tmj)
if _wa:
    print('WORKADVENTURE RULES FAILED:'); [print(' -', e) for e in _wa]; sys.exit(1)
```

so a generator exits non-zero rather than emit a map it cannot vouch for. `public/wa/README.md` records the rules for
whoever writes the fourth map.

What `apply()` does, in order:

1. **start** — repoint each marker tile at the ground gid under it. Guarantees the spawn is not a collided tile.
2. **collisions** — set `collides: true` on the tileset tile behind every gid in the mask, force the mask layer
   `visible: false`, and **keep the layer**. Warn (do not fail) when a collided gid is also painted in a *visible*
   layer outside the mask, because that is the one way this conversion can over-solidify a map.
3. **floorLayer** — if it is a tile layer, keep any floor art on a layer named `floor` and insert an empty
   `floorLayer` object layer in its place. Idempotent.

Branches, one per map, each with the fix, the regenerated `.tmj` and the shared module:

| Branch | Base | Note |
|---|---|---|
| `fix/wa-map-conformance-lantern` | `main` | target `main` |
| `fix/wa-map-conformance-dojo` | `claude/project-thread-l8llnl` | target that feature branch |
| `fix/wa-map-conformance-sect` | `claude/project-thread-vtqphx` | target that feature branch |

### Verified

Against the rules in WA 1.35:

| | blocked cells | spawn cells walkable | `floorLayer` | `check()` | `apply()` idempotent |
|---|---|---|---|---|---|
| Lantern Walk | 168 (was 168) | ✅ | objectgroup | clean | ✅ |
| Calrunian Dojo | 377 (was 377) | ✅ | objectgroup | clean | ✅ |
| Heaven Sect | 1150 (was 1150) | ✅ | objectgroup | clean | ✅ |

Blocked cells match the original mask exactly in all three, so nothing was lost and nothing was over-solidified. Tiles
and sprites are pixel-identical after regeneration (only PNG re-encoding differs), so no art changed.

### Regenerating on the box

`gen_sect.py` was then run for real on the Ubuntu box (`vps-498545bd`), which is what settles whether these maps are
reproducible:

- `DejaVuSans-Bold.ttf` is present at the exact path `sect-base.json` names, so the plaques draw as authored.
- The reconstructed `heaven-sect-court.tmj` is **byte-identical** to the committed one. The in-place `apply()` used to
  fix the committed file therefore produced exactly what the patched generator emits — no drift to reconcile later.
- Every tile, the plaque sheet and the 3072×2560 render are **pixel-identical**.

So the Sect map is reproducible on the box, and the fix is not a hand edit dressed up as a generator. (Pillow was
installed there with `apt-get install -y python3-pil` — 10.2.0 — because the box had no imaging library.)

The one thing that does not travel is the font: `sect-base.json` names a Linux path, so a Mac stops with
`OSError: cannot open resource` from inside PIL. `WA_PLAQUE_FONT` now overrides it, and a missing font exits 1 with a
sentence naming the file. A *different* font would redraw every plaque, so the override is for finding the same font
somewhere else, not for substituting one — which is why there is no automatic fallback.

---

## 4. Serving the maps to WorkAdventure

`public/wa/` is already public on `https://bars-engine.vercel.app/wa/…`, so:

```
GET /api/map?playUri=https://world.masteringallyship.com/@/…&userId=…
  → { "mapUrl": "https://bars-engine.vercel.app/wa/heaven-sect/heaven-sect-court.tmj", … }
```

Two things to get right:

1. **CORS is already handled.** The map is fetched by the *browser*, not by WA's server, so `/wa/**` has to answer
   with `Access-Control-Allow-Origin`. Vercel does this for static output by default — checked on the live deployment
   2026-11-23: `/wa/lantern-walk/lantern-walk.tmj` answers `200` with `access-control-allow-origin: *`. No
   `vercel.json` entry is needed; if that ever changes, this is the first thing to look at.
2. **No auth on `/wa/**`.** The map is public art. Entitlement is enforced by `/api/room/access`, not by hiding the
   map — hiding it would break `exitUrl` between worlds anyway.

`exitUrl` values in the level files are already relative (`../lantern-walk/lantern-walk.tmj`) and resolve correctly
under the same root. Keep them relative; it is what makes the worlds relocatable.

---

## 5. Where the encounter seam plugs in

The level language already carries `role` and `seats` per room. It needs exactly two more fields, and the generator
carries them through as area properties — the whole mechanism from `docs/WORKADVENTURE_INTEGRATION.md` §4:

```json
{"id": "dojo", "label": "Dojo", "kind": "dojo", "box": [21,37,22,18],
 "seats": 8,
 "bars": {"mechanic": "coin-turn", "encounter": "heaven-sect-dojo-1"}}
```

→ on that room's area:

```json
"properties": [
  {"name": "role", "type": "string", "value": "dojo"},
  {"name": "jitsiRoom", "type": "string", "value": "heaven-sect-court-dojo"},
  {"name": "focusable", "type": "bool", "value": true},
  {"name": "bars.mechanic", "type": "string", "value": "coin-turn"},
  {"name": "bars.encounter", "type": "string", "value": "heaven-sect-dojo-1"}
]
```

Plus one map-level property, and the generic map script takes over:

```json
{"name": "script", "type": "string", "value": "https://bars-engine.vercel.app/wa/wa-script.js"}
```

Now every generated map is playable by declaration. A GM adds a `bars` block to a room in the level file, re-runs the
generator, and the room has a BARS encounter. No Tiled editing, no per-map script.

**Farm rooms are the same mechanism.** A `kind: "garden"` room with `bars: {"mechanic": "tend-plot"}`, plots
projected per viewer from `/api/wa/greenhouse` (tier-1 mirror in `docs/WORKADVENTURE_INTEGRATION.md` §6). The generator draws the
beds; bars-engine decides what is growing in them; nothing private touches room state.

---

## 6. The other map pipeline — leave it alone for now

`~/sprout-plot` is a separate, older, larger art pipeline (palettes, redraw, atlas packing, `profiles/snes.json`,
`specs/maps/*.json` → `maps/*.tmj`). Do not merge it into this one yet:

| | sprout-plot | calrunian / heaven-sect |
|---|---|---|
| Tilesets | Tiled **image-collection** (`columns: 0`, one PNG per tile) | single sheet + `columns` |
| Output | compiled to sprout's own runtime map format (image paths dropped) | ships `.tmj` for WorkAdventure |
| WA-ready | no — needs an atlas pack first | yes, now |
| Strength | asset authoring: palettes, redraw, licence audit, packer | level language, room grammar, reachability gate |

The one thing worth stealing later is `pack.mjs`: if these maps ever need per-tile art instead of a sheet, that packer
is the bridge.

---

## 7. What is left

1. Merge the two map branches and the two feature branches (`docs/WA_MAP_PIPELINE.md` §3 lists them).
   Until a branch merges, its map is not on `bars-engine.vercel.app/wa/…` — checked 2026-11-23, where only the
   Lantern Walk is deployed and the Dojo and Sect maps answer `404`.
2. **Load the Heaven Sect court in the real client** — the option chosen on `cd-dojo-look-2`
   ("Yes, it reads — put the map in the real WorkAdventure client and post a walk-through look"). It will now load and
   collide; before this fix it would not have loaded at all.
3. Then the `bars` blocks and the shared script, which need the encounter seam (step 4 of the main build order).
4. `gen_sect.py` draws the room-name plaques into the tileset from the bold sans named in `sect-base.json`, which is
   a Linux path. `WA_PLAQUE_FONT` overrides it and a missing font exits 1 with a sentence naming it, so this runs off
   Linux without a traceback. Nothing else is missing: the dojo art it draws from (`src16/`, `sprites/`) is on the
   same branch — the dojo commit is an ancestor of the sect branch — so there is no cross-branch order to get right.
