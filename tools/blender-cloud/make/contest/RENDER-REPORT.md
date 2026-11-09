# Contest render tier, run on the Freebuff VM (2026-11-09)

## What changed

- `qa.py` gains the render tier the brief and the handoff both call `--render`: one still at 640x360 into
  `render_<stem>.png` beside the candidate, a blank-frame check, and the frame's mean and spread in the JSON. Its
  Blender tier called `ns["build"]()`, which none of the ten candidates defines, so it never ran; it now calls
  `build_object()` and drops a candidate's own render call while it builds (the candidates hard-code
  `/home/workspace/...` paths this box does not have).
- `render_all.py` is new: it runs the gate over both contenders, one process per candidate, and writes the numbers
  into each `results.json` as a `render` object plus `render_ok`.
- Nine stills were rendered: `deepseek/render_obj1..5.png`, `glm/render_obj1,2,3,5.png`. They and the updated
  `results.json` files travel separately, because the Freebuff VM holds no git credential for bars-engine; they go
  up with the next push.

## Why

The contest's render half had never run: the Zo sandbox had no Blender, so all ten candidates were static-QA only.
This VM runs the bpy wheel, so the tier could finally be measured.

## How I checked it

- Blender 5.2.2 LTS, as the `bpy` wheel on Python 3.13 (`blender_here.py bars`), Ubuntu libraries unpacked into a
  local sysroot; no root, no GPU. Box: 8 vCPU, 16 GB RAM.
- Engines: CYCLES on CPU renders a 640x360 still in 2.1 to 3.2 s. BLENDER_WORKBENCH aborts the process (`exit 134`,
  no `libEGL`), and EEVEE needs the same GPU context, so neither engine the brief names could run.
- Nine of ten pass: build, triangle budget, and a still whose pixels are not flat. DeepSeek 5 of 5; GLM 4 of 5.
- GLM's hearth (`glm/obj4.py`) does not build: `ValueError: sequences of dimension 0 should contain 4 items, not 3`
  in its own `set_in()` colour helper, so that object has no still. Not repaired here: the point of the contest is
  what the contenders' code does.
- DeepSeek's bell (`deepseek/obj1.py`) makes no camera, lights or world, so the gate framed it and lit it; the
  additions are named in that object's `render.added`. GLM's floor had a camera it never set, and GLM's Guan Dao
  makes no camera or lights. Those are named there too.
- Not checked: how the objects look on the sect's route, in motion, at courtyard scale in the game build, or on a
  GPU renderer. No quality call is made here; the look gate is Wendell's.

## Board rows

`heaven-sect-contest-deepseek-look-1` and `heaven-sect-contest-glm-look-1` on
https://bars-engine.vercel.app/board/council, each carrying both sets beside the round-4 anchor.
