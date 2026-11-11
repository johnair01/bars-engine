# Calrunian jian asset family

Five reusable jian variants: Argyra, Pyrakanth, Lamenth, Virelune, Meridia. Wendell approved the inventory family on 2026-11-11 and asked to preserve it in the game. These are available assets, not yet equipped by a live character or assigned to a gameplay path.

## Where things live

- `public/calrunia/weapons/jian/`: five GLBs, five 360×480 inventory PNGs, and a hash-checked `manifest.json`.
- `public/calrunia/weapons/jian/index.js`: catalog reader and `loadJian(loader, nation)` helper; returns the model and named `GripSocket`.
- This directory: reference image and interpretation, parametric base, typed national transforms, builder, checks, feedback, and the exact repeatable procedure in [WORKFLOW.md](WORKFLOW.md).

## Rebuild and verify

Requires Python 3, Blender 5.2 with `bpy`, and `ffmpeg`. No model API key is needed to rebuild approved assets.

```sh
python3 tools/blender-cloud/make/jian/build_release.py
python3 tools/blender-cloud/make/jian/build_release.py --check
```

`--check` verifies that the public GLBs and PNGs match their manifest hashes, all required GLB nodes including `GripSocket` exist, and the source files still match the build. The build runs closed-mesh, length, triangle-budget, and 96-pixel blade-contrast gates before copying assets into `public/`.

## Source and design authority

The base sword uses [The Met's Sword with Scabbard, 36.25.1486a,b](https://www.metmuseum.org/art/collection/search/27931), marked Public Domain by the museum. The Met records 103.8 cm without scabbard and 83.8 cm for the blade. `evidence.json` separates visible landmarks from uncertain construction assumptions; `reference/met-27931.jpg` is the saved image used in the exercise.

National styles are **Calrunian design translations** from the costume bible and Wendell's reactions, not historical claims about the Met object. Path-specific handling styles and live elemental effects have not been assigned. Future work should add those as explicit, separately reviewed layers.

## Use later

In a browser module that already has Three.js `GLTFLoader`:

```js
import { loadJian } from "/calrunia/weapons/jian/index.js";
const { scene, gripSocket, inventoryIcon, metadata } = await loadJian(loader, "Pyrakanth");
```

Attach the **hand to `GripSocket`** when placing the model. Do not treat the GLB origin at the guard as a hand grip. Resolve held-prop occupancy before equipping: the current cultivator may already carry a gourd or whisk. Inventory may use `inventoryIcon` without loading a GLB.

The GLBs use glTF's Y-up coordinates. The Blender source uses +Z for the blade tip and -Y for the front. The exporter converts that frame; the node name is the stable integration point.
