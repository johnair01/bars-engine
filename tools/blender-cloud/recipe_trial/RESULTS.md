# T1 to T3: the recipe and its token cost (2026-10-13)

Spec: `.specify/specs/blender-pipeline-test/spec.md`, Part 2. Board position `bpt-recipe`.

## What was built

- `content/ontology-game/cave/scene.yaml`: the pool chamber as a recipe (24 lines). Schema: `cave/RECIPE.md` (37 lines).
- `content/ontology-game/cave/build_scene.py`: the fixed builder. `--check` validates a recipe in plain Python with
  no Blender, in under a second. With `bpy` it places kit pieces from `cave-kit.glb`, makes the walls and floor,
  writes `chamber.glb` (163 KB, 7,896 triangles for the default recipe) and renders a front and a top view (Cycles,
  CPU, about 24 s). The same recipe gives the same GLB, byte for byte (two runs, SHA-256 `dde8be96…`).
- The builder touches no cave file the game loads. `cave.js`, `cave-test.mjs` and `manifest.json` are unchanged;
  wiring the chamber into the game waits for cave studio's #289.

## How it was measured

Ten asks (`asks.json`), each done twice in a fresh, matched sub-thread on Sonnet:

- **Recipe path:** read `RECIPE.md` and `scene.yaml`, edit the recipe, run `--check` until it prints ok.
- **Code path:** read `chamber_code.py`, edit it, run it without rendering until it writes a GLB. `chamber_code.py`
  is the same chamber written as plain `bpy` code (177 lines, one `place(...)` line per piece), made by
  `make_code_baseline.py`. It is the most compact direct-code version there is: tidy, commented, with helpers.

Token counts come from each sub-thread's own transcript (`tokens.py`): the usage the platform reports on every call.
`beyond` is every call's input past the opening load, summed, plus all output: what the edit itself cost. The opening
load (system prompt, tools, CLAUDE.md, the ask) was 54,200 tokens on both paths and is not counted.

Every result was rendered and laid out before, recipe, code (`sheet.py`, `t3-sheet.jpg`).

## Results

| Ask | Recipe: beyond / output | Code: beyond / output | Recipe right? | Code right? |
|---|---|---|---|---|
| 01 three glowing mushrooms by the pool | 10,427 / 443 | 16,945 / 692 | no: they stand in the water | yes |
| 02 walls wetter | 15,408 / 419 | 16,412 / 550 | yes | yes |
| 03 gate stones to crystal | 10,792 / 636 | 16,372 / 476 | yes | yes |
| 04 bigger, taller, twice the people | 10,377 / 467 | 17,421 / 1,123 | yes | yes |
| 05 take out the roots | 15,382 / 429 | 15,984 / 379 | yes | yes |
| 06 dusk light | 10,479 / 465 | 16,572 / 601 | yes | yes |
| 07 a spire each side of the arch | 10,838 / 715 | 16,874 / 754 | yes | yes |
| 08 pool glows soft blue | 10,323 / 333 | 16,498 / 553 | no: reads white, not soft | no: same |
| 09 small crystals along the left wall | 10,728 / 620 | 17,464 / 1,071 | yes | no: both walls |
| 10 circle to the back, eight stones | 11,024 / 877 | 18,070 / 1,409 | yes | yes |
| **Mean** | **11,578 / 540** | **16,861 / 761** | **8 of 10** | **8 of 10** |

- **T1 passes.** Every recipe edit stayed under 20,000 tokens past the opening load (largest 15,408) and under 2,000
  output tokens (largest 877).
- **T2 fails its kill line.** The recipe path cost 0.69 of the code path, and the line was at most 0.33. The
  results were no worse (8 of 10 each). The saving is real but small: about 5,300 tokens an edit, against a 54,200
  opening load every thread pays either way, so about 8% of a whole edit thread.
- **T3 passes on both paths** (8 of 10 each; the line is 8). Looked at by the session that ran the trial, which wrote
  none of the edits. Wendell has not looked.

Why the gap is small: both files are short. The recipe and its schema came to about 5,300 tokens of added context;
the code file to about 8,400. The code file grows by a line per piece and the recipe by a line per group, so the gap
widens with a busier chamber, but not to three times at this size.

## What the trial found in the builder

- `scatter: {near: pool}` can drop pieces into the pool (ask 01). A scatter should keep clear of the pool, stone
  or arch it is placed near.
- `glow` reads too strong: 0.6 turned the pool white (ask 08, both paths). Emission is `glow × 5`.
- No edit on either path looked at a render before saying it was done. Every miss would have been caught by one look.

## Re-run

```bash
python3 tools/blender-cloud/recipe_trial/make_code_baseline.py content/ontology-game/cave/scene.yaml /tmp/trial/chamber_code.py
# one sub-thread per ask and path, prompts in prompts.txt, model Sonnet, then:
python3 tools/blender-cloud/recipe_trial/tokens.py r01=<transcript> c01=<transcript> ...
python3 tools/blender-cloud/recipe_trial/sheet.py tools/blender-cloud/recipe_trial/asks.json /tmp/trial <base out> sheet.png
```
