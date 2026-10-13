# Blender in the cloud

Headless Blender 5.2.2 as the `bpy` pip package. It arranges a free asset from Blendkit (formerly BlenderKit) with a
rigged walking figure, renders a 480p preview, exports an animated GLB, and builds a three.js viewer page.
No display or GPU needed. Plan and test results: `.specify/specs/blender-cloud-hardening/`.

Published viewer: https://claude.ai/artifact/SUZYu1w1P5b61Cn6pj7Vwg

## Run it

```bash
uv venv --python 3.13 /home/user/blenv
uv pip install --python /home/user/blenv/bin/python bpy==5.2.2
export SSL_CERT_FILE=/root/.ccr/ca-bundle.crt          # the sandbox CA bundle
W=/tmp/blender-cloud                                    # scratch space; keep assets and outputs out of git

python3 tools/blender-cloud/blenderkit_fetch.py "wooden chair" $W/assets --index 5   # CC0 only by default
python3 tools/blender-cloud/prepare_asset.py $W/assets/Painted_Wooden_Chair_02.glb $W/assets/chair.glb
/home/user/blenv/bin/python tools/blender-cloud/scene.py $W/assets/chair.glb $W/out  # preview.png, scene.glb, report.json
python3 tools/blender-cloud/build_viewer.py $W/out/scene.glb $W/page --asset $W/assets/Painted_Wooden_Chair_02.json
```

Publish `$W/page/viewer.html` as the artifact page, with `model.json` as a supporting file. **Look at `preview.png`
before publishing.** The orientation and scale of a new asset are found by eye: use `--rot-z`, `--scale`, `--x`.

## Files

| File | Job |
|---|---|
| `blenderkit_fetch.py` | Search, take the Nth free result, download one file type. CC0 by default. `--selftest` checks the whole API path. Writes a `.json` sidecar with name, author, licence. |
| `prepare_asset.py` | Decode Draco or meshopt compression so `bpy` can import the GLB. |
| `scene.py` | Import the asset, decimate to a triangle budget, cap textures, build the six-box figure with a 7-bone rig and a 48-frame walk, render, export, report. |
| `viewer_template.html`, `build_viewer.py` | Build the page. Refuses any model that is not CC0. |
| `from_picture.py` | Build a model from one front-view picture (lathe or inflate), score its outline against the picture, render it. |

## The six problems, and what each became

1. **Key handling.** The sandbox proxy adds the BlenderKit key for `api.blenderkit.com`, so the scripts send none.
   Elsewhere, set `BLENDERKIT_API_KEY` and it goes out as a Bearer header to that host only. Search without a key
   works from Wendell's Mac (his check, 2026-10-12: "works"). On 2026-10-12 a later cloud session's proxy refused
   `api.blenderkit.com`, so whether a session reaches Blendkit depends on that environment's network setting.
2. **`scene_uuid`.** Downloads need this parameter. The script makes one UUID per machine and reuses it
   (`~/.cache/blender-cloud/scene_uuid`). On a 403 it prints the API's message. `--selftest` is the canary.
3. **Draco.** The `bpy` wheel has no Draco decoder, and BlenderKit glTFs use it. The default is now the glTF
   variant, decoded by `prepare_asset.py` with `npx @gltf-transform/cli`. The 122 MB `.blend` is a fallback only.
4. **UDIM.** A one-tile UDIM image is copied to a plain image. More than one tile stops the run with a message.
   The glTF variant comes baked to plain textures, which avoids most cases.
5. **Size.** `scene.py` decimates to `--tri-budget` (25,000), caps textures at `--tex-max` (1024), re-encodes
   everything except normal and alpha maps as JPEG, and stops if the GLB passes `--max-glb-mb` (12). Artifacts do not
   serve `.glb`, so the page loads the model from a base64 `model.json`; the 16 MB limit now applies per file.
6. **three.js.** The viewer uses three@0.170.0 as ES modules through an import map from `cdn.jsdelivr.net/npm`.
   Light intensities are scaled for the newer physically based lighting.

## Building from a picture

`from_picture.py` turns one front-view picture of one object on a plain background into a model, for the cave
studio's rule that ChatGPT art is concept only and the piece is rebuilt here (`cs-chatgpt-ai-art`). It reads the
outline, then either turns it around its centre line (`--mode lathe`, for round objects), fills it with metaballs
as thick as the shape is wide (`--mode inflate`, for objects with a bend), or splits it by colour into crystal and
rock and makes one six-sided prism per crystal tip on an inflated rock bed (`--mode crystals`). It fits a face budget, scores how well the
model's front outline matches the picture's (intersection over union, 1.0 exact) and renders front and
three-quarter views with Cycles on the CPU.

```bash
/home/user/blenv/bin/python tools/blender-cloud/from_picture.py PICTURE $W/piece.glb --mode lathe --height 1 --name piece --render $W/out
```

The cave's chamber dressing is built this way inside `content/ontology-game/cave/build_kit.py` (its `DRESSING`
table). First run, 2026-10-12: 0.987, 0.974 and 0.89 outline match on stand-in pictures, and 0.829 on Wendell's
first ChatGPT picture (a crystal cluster). On that picture, inflate scored 0.88 but looked like a blob: a high outline
match is necessary, not enough, so always look at the render. The front view only fixes the outline, so depth
is a guess: round for lathe, as thick as wide for inflate. A picture with a busy background, two objects or a
cast shadow reads the wrong outline; the prompt on the comparison page (https://claude.ai/artifact/568K2pwc7Lz5X9Kyftbzza) asks ChatGPT for the plain kind.

## Procedural shapes

`procgen.py` makes roots and mushrooms from a few numbers, in plain Python (no `bpy`), so the same seed gives the same
mesh. The aim: build as much as possible in code, then let the Blender pipeline add detail and quality.

- **Roots** (`root_system`, styles in `ROOT_STYLES`: arching, hanging, creeping, tangled, taproot, buttress). A turtle
  grows each branch with a smooth random wander and a pull toward gravity, and forks at random. Each fork splits the
  parent's cross-section by Murray's law (r^3 = r_a^3 + r_b^3), so thickness falls off the way real branching networks
  do. Angle, length, wander and fork rate are drawn per branch, so no two branches match. A last layer of fibers (`fibers`,
  `fiber_rmax`) hangs off every thin branch and brushes each tip: hair-roots whose radius falls to 0.0006. Method names for further
  work (from memory, not checked here): L-systems with tropism (Prusinkiewicz), space colonization (Runions et al.,
  2007) for roots that fill a volume or avoid a wall, differential growth for tangles.
- **Mushrooms** (`mushroom`, forms in `MUSHROOM_FORMS`: dome, flat, bell, cone, funnel, morel, puffball, parasol,
  bulbous). A lathe with a stem profile and a superellipse cap (radius, height, sharpness, rim lip, umbo, scalloped
  edge, tilt, pits, thickness, stem bulge, ring). `mushroom_between(a, b, t)` blends two forms, so there is a
  continuum between them, and `jitter` varies each number per seed. Each seed also leans, bends the stem and pitches the cap
  by its own random amount (`lean`, `bend`, `cap_tilt` are the maximums; 0 stands it upright).
- **See them:** `/home/user/blenv/bin/python procgen_sheet.py OUT.png roots|mushrooms` renders a contact sheet, seeds
  across and styles down. Look at it; the numbers do not say whether it is natural. `python3 procgen.py --selftest`
  and test PG1 check determinism and mesh validity.

## A seventh problem: licences

Blendkit's Royalty Free licence lets you use a model in a web page only if no third party can open or extract it
(terms, article 5). A GLB in a page can be extracted. So **only CC0 models go into a published page**. Royalty Free
models are fine for renders and previews. `blenderkit_fetch.py` searches `license:cc_zero` by default and
`build_viewer.py` stops on anything else. The first version of the viewer used a Royalty Free chair; version 5
replaced it with a CC0 one.

## Checklist for a new asset

1. Fetch with the default CC0 filter. Note the licence the script prints.
2. Run `prepare_asset.py`, then `scene.py`. Read the `ASSET` and `REPORT` lines: dimensions, triangles, GLB size.
3. Open `preview.png`. Check that it is textured, the right way round, and on the floor. Adjust `--rot-z`, `--scale`.
4. Build the page and check it in a browser (Playwright with Chromium works headless) before publishing.

## Still true

- Assets with several UDIM tiles are refused, not converted.
- Workbench and EEVEE renders need a GPU (libEGL); the cloud renders with Cycles on the CPU.
- The sandbox cannot open a private artifact URL, so the published page cannot be checked from here. Check the same
  files locally first, and keep the previous artifact version as the rollback.
- `www.blenderkit.com` now redirects to `www.blendkit.com`. The API host `api.blenderkit.com` still works.
