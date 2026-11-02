# Cave greenery picks

Wendell chose these on 2026-10-13 in the "BlenderKit greenery" thread: "Let's go with that pick and also the stylize pitcher plant".
All four are CC0 from BlenderKit, exported from Blender 5.2.2 with textures capped at 256 px, uncompressed GLB.
Together they are 1,204 KB. The cave page is about 829 KB of its 3 MB phone budget.

| File | BlenderKit name | Maker | Licence | Size | Source |
|---|---|---|---|---|---|
| `fern-02.glb` | Fern 02 | Poly Haven  | cc_zero | 574 KB | https://www.blendkit.com/asset-gallery-detail/b6155e0a-79eb-44da-acc2-6587f7f533da/ |
| `rock-with-moss.glb` | Rock with Moss (Photoscanned) | Nik Kottmann | cc_zero | 389 KB | https://www.blendkit.com/asset-gallery-detail/79e8d4bd-b5a3-43be-97ae-2a0cf228a867/ |
| `high-grass-clump.glb` | High grass clump | Slinc_HD Janzen | cc_zero | 143 KB | https://www.blendkit.com/asset-gallery-detail/973a530c-c5bc-4035-80ab-89cf35a83562/ |
| `pitcher-plant.glb` | Stylized fly trap | Amal David | cc_zero | 97 KB | https://www.blendkit.com/asset-gallery-detail/0825e69e-faa3-4814-ae66-ee39c25c1d9e/ |

Notes for placing them:
- `fern-02.glb` holds four fern variants side by side (fern_02_a to d), sharing one texture set. Instance them; don't copy.
- `rock-with-moss.glb` is a photoscan about 15 cm across in its source units, so scale it up to boulder size.
- `high-grass-clump.glb` is about 10 cm tall in source units; scale to taste. Its blades use alpha cut-outs.
- `pitcher-plant.glb` ("Stylized fly trap") keeps its colours in the web export. It suits one chamber, not the scatter.
- Add each to `cave/manifest.json` with source and licence (`c3d-cc0-only`).
