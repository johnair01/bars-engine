# Deprecated: the Average Dusk figure

Deprecated 2026-11-16 (Wendell: "We shouldn't be using this model for tests anymore now we have the cultivation model
we've created. We need to deprecate this figure."). The cultivation characters in `public/between/cult/` are the one
character model. Do not use `public/between/m/dusk/average-dusk.glb` for a test, preview, look or new brief.

Nothing is deleted. These places still load the figure at runtime, so they are left alone until a pull request
replaces each one with the cultivation model. Wendell decides the order.

Game routes and scripts:
- `public/between/wardrobe.js`, `garden.js`, `brush-figure.js`, `tea-pose.js`, `land/land.js`, `land/friends-fire.js`,
  `arcade/scene.js`, `m/dusk/robe-cover.json`
- `public/coaching/walk/walk.js`
- `public/lantern/rig.js`, `public/lantern/table/table.js`
- `content/ontology-game/cave/` (`dusk-figure.js`, `cave.js`, `basin.js`, `character.py`, `garments.py`,
  `bake_daemons.py`) and `scripts/build-ontology-game.mjs`

Tests and tools that use it as a fixture (move these first, since they are what Wendell's rule covers):
- `src/lib/between/__tests__/stance.test.ts`
- `content/ontology-game/cave/basin-test.mjs`, `cave-test.mjs`
- `tools/tea-*.mjs`, `tools/figure-rig.mjs`, `tools/figure-cover.mjs`, `tools/mocap/retarget_idle.py`,
  `art/between/tea-drink/build.py`
- `tools/blender-cloud/tests/` (`test_net.py`, `test_bpy.py`, `LOOKED.md`)

Specs that name it (`.specify/specs/lantern-table`, `blender-pipeline-test`, `ctw-friends-fire`) are history and stay as
written.
