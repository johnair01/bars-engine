# The chamber recipe: scene.yaml

A change to the chamber is a change to `scene.yaml`. `build_scene.py` turns it into `chamber.glb` and two views.
Check after every edit: `python3 content/ontology-game/cave/build_scene.py --check` (no Blender, a second). A
`STOP:` line names the key that is wrong.

Positions are metres on the floor, `[x, y]`: x to the right, y away from the camera, `[0, 0]` the centre.
Angles on the wall are degrees: 0 the back wall, 90 the right, -90 the left, 180 the front (cut away in the views).

## Top level

| Key | What |
|---|---|
| `chamber` | `radius` (2 to 30), `height` (1 to 30), `seed` (same seed, same chamber), `rough` (wall bumpiness, 0 to 0.3, default 0.06) |
| `light` | `colour` `"#rrggbb"`, `strength` (roof light, 0 to 10), `ambient` (fill, 0 to 5) |
| `looks` | named surfaces: `colour`, `rough` (0 shiny to 1 matte), `wet` (0 to 1: darker and shinier), `glow` (0 to 10), `glow_colour` (default: `colour`) |
| `walls`, `floor` | the look each wears |
| `objects` | a list; each entry places one piece or a group of the same piece |

## An object entry

| Key | What |
|---|---|
| `piece` | `pool`, `gate_stone`, `portal_arch`, `stone_spire`, `glow_cap`, `root_curl`, `crystal_cluster` (its rock bed comes with it, wearing `bed`) |
| `look` | a name from `looks` |
| `size` | metres high (pool and arch: radius). `[min, max]` picks per piece |
| `wide` | widens without raising (gate stones use 2.2) |
| `turn` | degrees about the vertical, or `random`. Rings and walls turn each piece to face the centre unless set |
| `hang` | `true` hangs it from the roof (roots) |
| `id` | a name later entries can place `around` or `near` |
| one of: | |
| `at` | `[x, y]` |
| `ring` | `{around: <id or [x, y]>, radius, count, start: <degrees>}` |
| `scatter` | `{near: <id or [x, y]>, radius, count}` |
| `wall` | `{at: <degrees>}` for one, or `{count, from, to}` for a row along the foot of the wall |

Delete an entry to remove it, and append one to add. Keep each entry on one line.
