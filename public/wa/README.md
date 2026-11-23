# `public/wa` — maps for the WorkAdventure world

Each folder here is one map (or one world) that WorkAdventure loads over HTTP. The maps are **generated**; the
`.tmj` and `tiles/` are build output, and the generator plus its design-language file are the source.

| Folder | Generator | Design language |
|---|---|---|
| `lantern-walk/` | `gen_lantern_walk.py` | the script itself (a single small map) |
| `calrunian-dojo/` | `gen_dojo.py` | `dojo-language.json` |
| `heaven-sect/` | `gen_sect.py` | `sect-base.json` + `levels/<map>.json` |

Run one with `python3 gen_<map>.py` (needs Pillow). Each generator checks itself before writing anything and exits
non-zero rather than emit a map it cannot vouch for.

## The rules WorkAdventure reads that Tiled does not show

`wa_export.py` holds these, applies the first three in `apply()`, and re-checks them in `check()` and
`check_exits()`. A generator calls all of it just before it writes its `.tmj`, so no map can drift out of
conformance:

```python
sys.path.insert(0, os.path.dirname(HERE))          # this folder
from wa_export import apply as wa_apply, check as wa_check, check_exits as wa_exits
...
wa_apply(tmj)
errors = wa_check(tmj) + wa_exits(tmj, HERE)   # HERE = the folder the map will sit in
if errors:
    print('WORKADVENTURE RULES FAILED:'); [print(' -', e) for e in errors]; sys.exit(1)
```

1. **`floorLayer` must be an Object Layer.** WorkAdventure refuses the whole map when a layer with that name is a
   tile layer, however correct it looks: *"Your map must have a layer named \"floorLayer\" of type \"Object
   Layer\""* ([`MapValidator.ts`](https://github.com/workadventure/workadventure/blob/master/libs/map-editor/src/GameMap/MapValidator.ts)).
   Floor *tiles* belong on a layer with another name (`floor`); `floorLayer` itself is an empty object layer.
2. **Collision is a tile property, not a layer.** WorkAdventure reads a boolean `collides` property on the tileset's
   tiles. A layer named `collisions` collides with nothing *and is drawn like any other layer* — so it must be
   hidden in Tiled. A hidden layer still collides: *"A layer hidden in Tiled still collides: maps use one to draw
   invisible walls."* That is why these maps keep their mask layer hidden and put `collides` on the tiles it uses.
3. **A `start` tile layer is the spawn point.** WorkAdventure marks every tile in a layer named `start` as a spawn
   position, so the tile is read, not just drawn — and a *collided* tile there spawns the player inside a wall.
   `apply()` repoints the marker at the ground tile beneath it, which keeps the spawn invisible and walkable.
4. **An `exitUrl` is fetched when the room opens, not when someone walks into the door.** One exit to a map that does
   not exist kills the whole room: `NETWORK_ERROR — An error occurred while loading a resource`. A door to a map that
   is not built yet keeps its opening, paving and plaque but gets **no** `exitUrl`. `check_exits(tmj, map_dir)`
   enforces that every `exitUrl` resolves to a `.tmj` beside the map.
5. **Do not spawn inside an exit.** A start tile inside an area with an `exitUrl` teleports the player into the next
   room the instant the map opens — with no error, the room simply never appears. `check()` rejects it by name.

Two more things that cost an afternoon if you learn them the hard way: tilesets must be embedded in the map (an
external `.tsj` is rejected), and the map is fetched by the *browser*, so the HTTP host must send
`Access-Control-Allow-Origin` for `/wa/**`.

## Sizing

Tiles are 32×32 because WorkAdventure characters are 32×32; anything else loads with a warning and looks wrong
against the walkers. Walker sheets follow the same grid: 96×128, three frames across and four facings down
(down, left, right, up).

## Art

`calrunian-dojo/src16/` keeps the original CC0 sheets beside the built tiles, with the licence, so a recoloured or
redrawn tile can always be traced back. Nothing ships here that cannot be traced to a source and a licence.
