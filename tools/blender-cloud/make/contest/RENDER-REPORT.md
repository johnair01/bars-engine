# Contest render tier, run on the Freebuff VM (2026-11-09)

## What changed

- `qa.py` gains the render tier the brief and the handoff both call `--render`: one still at 640x360 beside the
  candidate, a blank-frame check, and the frame's mean and spread in the JSON. Its Blender tier called `ns["build"]()`,
  which none of the ten candidates defines, so it never ran; it now calls `build_object()` and drops a candidate's own
  render call while it builds, since the candidates hard-code `/home/workspace/...` paths this box does not have.
- `render_all.py` is new: it runs the gate over both contenders, one process per candidate, and writes the numbers into
  each `results.json` as a `render` object plus `render_ok`.

## Why

The contest's render half had never run: the Zo sandbox had no Blender, so all ten candidates were static-QA only. This
VM runs the bpy wheel, so the tier could finally be measured.

## How I checked it

- Blender 5.2.2 LTS as the `bpy` wheel on Python 3.13; 8 vCPU, 16 GB RAM, no GPU.
- Engine: Cycles on CPU, 2.0 to 3.2 s a still. BLENDER_WORKBENCH aborts the process (`exit 134`, no `libEGL`), and
  EEVEE needs the same GPU context, so neither engine the brief names could run. The divergence is recorded here rather
  than worked around.
- Nine of ten pass, which means the script builds, stays inside the 200k triangle budget, and renders a frame that is
  not blank. DeepSeek five of five; GLM four of five.
- DeepSeek: bell 7,930 triangles, 2.7 s, frame mean 0.407 and spread 0.257, with a camera, two lights and a world added;
  trigram floor 2,574 and 2.0 s; Guan Dao 291 and 2.3 s; hearth with jars 3,006 and 2.6 s; formation 517 and 3.2 s.
- GLM: bell 2,509 triangles and 2.5 s; trigram floor 976 and 2.7 s, where its camera existed but was never set and the
  gate set it; Guan Dao 3,210 and 2.4 s, with a camera and lights added; formation 436 and 2.1 s.
- GLM's hearth does not build: `ValueError: sequences of dimension 0 should contain 4 items, not 3`, raised in its own
  `set_in()` colour helper. Not repaired here, because the contest measures what the contenders' code does.
- Every added camera, light or world is named in that object's `render.added`, so the record separates what a candidate
  drew from what the harness supplied.
- Not checked: the objects on the sect's route, in motion, at courtyard scale in the game build, or on a GPU renderer.
  No quality call is made here; the look gate is Wendell's.

## Where the pictures are

Nine stills sit in bars-engine's picture store, carried by the two look rows `heaven-sect-contest-deepseek-look-1` and
`heaven-sect-contest-glm-look-1`, each beside the round-4 courtyard anchor. They are not committed: the council repo
ignores PNGs inside its stills folders and keeps frames in the store, and its round note for these renders lives at
`council/callsheets/stills/2026-11-09-heaven-sect-contest-renders/`.

The run's two `results.json` files are not in this branch either. This VM holds no git credential for bars-engine, so
they wait with local commit d31174f7, and this report carries their numbers.

## Board rows

`heaven-sect-contest-deepseek-look-1` and `heaven-sect-contest-glm-look-1` on
https://bars-engine.vercel.app/board/council, each carrying both sets beside the round-4 anchor.
