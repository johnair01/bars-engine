# The asset contract

What a drawing has to be, to belong in a Calrunian world. Written for the person holding the pencil, and for
the checker that holds them to it.

Two kinds of rule live here, and they are marked:

- **[machine]** — `public/wa/check_assets.py` fails the build on it. A generator runs the same check before it
  writes a map, so a sheet that breaks these never reaches WorkAdventure.
- **[review]** — a person decides. The checker cannot tell whether a plum tree looks like it grew in the sect,
  and pretending otherwise would be worse than saying so.

The whole point of the contract is that a new space can be **budded** off the dojo — a wing, a courtyard, a
friend's world — and still read as the same place, without anyone re-reading a generator's source.

## 1. The grid

| | |
|---|---|
| Tile size | 32 × 32 px, square. WorkAdventure draws a walker's feet at 16 × 16 inside one tile. |
| Source art | 16 px tiles, drawn up ×2 with nearest neighbour. Never smooth, never a fractional scale. |
| Sheet geometry | Image width and height are whole multiples of the tile size. A sheet is a grid, not a picture. |
| Map grid | Every tileset in a map uses the map's own tile size. Mixed sizes do not line up. |

**[machine]** sheet sizes divide by `src_px`; tileset tile size equals map tile size; image dimensions are whole
tiles in both directions; `columns` matches the image; `tilecount` fits inside it; every gid a layer uses is
provided by some tileset in that map (Tiled's flip flags are masked off first).

## 2. Sheets and tilesets

- **One sheet per role**, referenced by name in the design language (`sheets: { "house": "src16/TilesetHouse.png" }`).
  Generators place a *name*, never a raw tile number: `stamps: { "plum": … }`. That is what keeps the layout code
  readable and lets art change without a rewrite.
- **Embedded tilesets only.** WorkAdventure loads a tileset from inside the `.tmj` (`tilesets[].image`), never from
  an external `.tsj`. An external tileset is not a style question, it is a map that will not load.
- **The image sits beside the map**, inside the world's own folder, so a world can be copied to another server
  without a fetch from somewhere else.

**[machine]** no `source` on any tileset; `image` present and on disk relative to the map; image readable as PNG.

## 3. Tile roles

Four roles, because WorkAdventure needs four different answers from the same picture:

| Role | Layer | What it must do |
|---|---|---|
| **ground** | `ground` | be walkable and tile seamlessly on all four sides |
| **detail** | `detail` | say where a thing is without blocking anyone (grass tuft, paving crack, shadow) |
| **collision mask** | `collisions` | be invisible, and mark what a walker cannot enter |
| **over-player** | `over1`, `over2` | draw *above* the walker (roofs, canopies, the top of a doorway) |

Collision is a **tile property** (`collides: true`), not a layer's existence — a hidden layer still collides. A
sheet that will ever be used for something solid must therefore have its colliding cells decided and recorded,
and the sheet's licence file is the place to note which cells those are, if the sheet is used by more than one map.

**[review]** which tiles read as solid. **[machine]** that the map's `collisions` layer only uses tiles that
declare `collides`, and that a `start` tile is never one of them (that rule lives in `wa_export.py`, and it is
the one that spawns players inside walls).

## 4. Palette

The design language owns the colours, not the artist's memory. `dojo-language.json` names its fills, recolours
and stamps; `sect-base.json` does the same for the sect. A new drawing picks from those, or adds a named entry
to the language — never a bare hex value inside layout code.

**[review]** that a new element belongs in this world's weather, season and hands. **[machine]** that every
recolour the language declares actually applies to a sheet the language names; a recolour pointed at a typo is
art that silently never happened.

## 5. Walkers (wokas)

WorkAdventure's own walker layout, and the only one it will draw:

| | |
|---|---|
| Sheet | **96 × 128 px** — 3 frames across × 4 facings down, on a 32 px grid |
| Facings, top to bottom | down, left, right, up |
| Frames, left to right | standing, step, other step (the generator's order is `(1, 0, 3)` per facing) |
| Background | transparent; nothing outside the 32 × 32 cells |

Source packs ship walkers at other layouts — ours arrive as 512 × 64 registers with six columns — so the
repack is part of making the asset, not an afterthought. **[machine]** `check_woka()` on every sheet in
`sprites/`.

Woka *customisation* (choosing a look for a player) is not this contract: no map script can set a player's
textures, so that flow is `/api/woka/list` — see the door spec.

## 6. Licence and provenance

Every world folder carries a `LICENSE*` (or `COPYING*`) file, and its design language's `about` names the pack,
its author and its licence id. Source sheets stay in the folder they came from (`src16/`) so the drawn-up tiles
can be compared against the original.

**[machine]** a licence file exists under the map directory. **[review]** that the licence actually permits the
use — CC0, CC-BY with attribution, or a paid pack whose terms allow a public server.

Nothing ships under "found it on the internet".

## 7. Rooms

The layout half of the contract, already enforced by the generators and kept in the language's `rules`:

- `door_min: 2` — a doorway is two tiles wide, so a walker's 16 px feet pass without catching an edge;
- `corridor_min: 3` — three tiles between walls, or two people cannot pass;
- `clear_round_npc: 2` — two clear tiles around anyone you must be able to stand next to and read.

**[machine]** reachability from the spawn to every place the map marks, and the five map rules in
`wa_export.py` (floorLayer as an object layer, collision as a tile property, a start tile that is not a wall,
every `exitUrl` resolving, no start tile inside an exit).

## 8. A world someone else made

The door to a friend's world is a URL, not a copy. For it to be a target:

1. the `.tmj` and its tiles are served over **HTTPS with CORS** — the map is fetched by each visitor's browser,
   not by our server;
2. embedded tilesets, relative image paths, the walker layout above;
3. it does **not** read or write our room state — `WA.state` is shared with everyone in that room, and a world
   we do not run has no business in it;
4. its URL goes on the list by our word, and comes off the same way.

Points 1–3 are what `check_assets.py` checks, pointed at their directory instead of ours. Point 4 is a person.

## Using the checker

```sh
python3 public/wa/check_assets.py public/wa/calrunian-dojo --lang dojo-language.json
python3 public/wa/check_assets.py --woka public/wa/calrunian-dojo/sprites/monk-woka.png
```

Exit 0 and `asset contract: ok`, or a list of what specifically is wrong and which file to open. Generators call
the same functions before writing, so the check is not a chore someone remembers — it is the build.
