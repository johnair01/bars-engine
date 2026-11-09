# Contest brief — Heaven Sect, five objects (2026-11-08)

One contender, one file. Produce a single Python script per object that builds it with the `bpy` API (Blender 5.2): mesh, materials, and a camera position that frames the object the way the accepted frames do. No external asset imports.

## Art direction (from the four accepted frames + Wendell's round-2 look mark)

- Palette: cold mountain stone (grey-green), bronze and gold accents, deep pine green; 15-color discipline is a 2D rule, keep the 3D palette restrained to the same families.
- Feeling: wonder (scale, looking up), poignancy (people like Madi), triumph (magic solving problems — spirit jars, talisman glow).
- The sect spirals up the mountain: courtyard level is partway up; objects sit at courtyard scale unless noted.

## The five objects

1. **Bronze bell on its plinth** (Metal) — courtyard centre. Aged bronze, gold repair seams, plinth of stacked courses; moss on the oldest stones. Height ~2.5 m bell on ~1 m plinth.
2. **Trigram floor** (Earth) — founder's hall floor, 30x20 m. Eight trigram inlays around a central Taiji; worn thresholds where ranks were given.
3. **Guan Dao on the weapon rack** (Metal) — practice polearm, ~2 m shaft, broad curved blade; rests on a rack of dark pine. Wendell's pick, 2026-11-08 (replaces rank tablets).
4. **Sunken hearth with spirit jars** (Water/Fire) — Shaman Elder's cave house. Sunken fire ring, five stoneware jars with paper talisman seals, low warm light implied by emissive material.
5. **Talisman formation set** (Fire) — chalked circle, hovering paper slips, working glow (emissive). The one object that is openly magical.

## Deliverable shape

Each script defines `build_object()`, which builds the object into a fresh scene, and runs standalone (`python3 script.py`) writing `render_<slug>.png` at 640x360, plus a `--check` mode printing poly counts and material list. The gate calls `build_object()`; it refuses any other entrypoint name, and every candidate submitted so far uses it. Deterministic: fixed seeds, no randomness.

## QA gate (run after generation)

```
python3 tools/blender-cloud/make/contest/qa.py <script.py>            # geometry and palette checks
python3 tools/blender-cloud/make/contest/qa.py --render <script.py>   # plus one 640x360 still and the blank-frame check
```
