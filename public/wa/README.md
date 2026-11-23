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

## Two contracts, both enforced

A map has to satisfy the client (`wa_export.py`, below) **and** the art (`check_assets.py`, and
[`docs/WA_ASSET_CONTRACT.md`](../../docs/WA_ASSET_CONTRACT.md)): square 32 px tiles, embedded tilesets whose
image is beside the map, `columns` and `tilecount` that agree with that image, every gid the layers use coming
from a tileset in that map, walkers that are 96×128 (3 frames × 4 facings), and a `LICENSE*` file under the
world's folder. A generator runs both checks before it writes anything. Either can be run by hand:

```sh
python3 public/wa/check_assets.py public/wa/calrunian-dojo --lang dojo-language.json
python3 public/wa/check_assets.py --woka public/wa/calrunian-dojo/sprites/monk-woka.png
```

The dojo is the exception to "generated": its map is owned by the WorkAdventure map editor
(`dojo-language.json` says `owner: editor`), so `gen_dojo.py` refuses to overwrite it and seeds into a scratch
directory instead.

## The rules WorkAdventure reads that Tiled does not show

`wa_export.py` holds these, applies them in `apply()`, and re-checks them in `check()`. A generator calls both just
before it writes its `.tmj`, so no map can drift out of conformance:

```python
sys.path.insert(0, os.path.dirname(HERE))          # this folder
from wa_export import apply as wa_apply, check as wa_check
...
wa_apply(tmj)
errors = wa_check(tmj)
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
