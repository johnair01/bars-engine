# figure-preview

One script that draws front, side and three-quarter stills of an exported figure GLB with
[Crucible](https://github.com/codepawl/crucible) (MIT, pinned to 0.20.0, dev-only). It is a check that runs after
Blender exports and before the file enters the three.js runtime. It is not a tool server: no `.mcp.json` entry, no
plugin, no tool schema in anyone's context. Blender skills stay the source of truth. Nothing here is imported by the app,
and nothing leaves the machine.

```
cd tools/figure-preview && npm install
node tools/figure-preview/crucible-still.mjs figure.glb --out stills/ --cams front,side,three-quarter
node tools/figure-preview/crucible-still.mjs figure.glb --out stills/ --lights glb     # the point lights the file carries
```

It prints one line per still with a short sha256 (the same file renders to the same bytes), the part and clip count,
and every import warning. Needs Chromium: `CHROME=/path`, or `/opt/pw-browsers/chromium`, or installed Chrome.
`--time T --clip N` samples an animation clip.

## What the trial found (cultivation model, three poses)

- Standing, kneeling at the board and cross-legged all import with no warnings and draw in about 3 s each.
- Crucible's checkpoint (`createAgentAssetScene().checkpoint()` and `restore()`) put a recoloured, re-lit figure back to a
  byte-identical picture, so a look can be tried without re-importing. Use a fresh canvas for each renderer.
- A plain three.js reload of an exported figure shows a maroon robe because `GLTFExporter` cannot write `BackSide`: the
  lining meshes (`side: BackSide` in `garments-b.js`, `garments-c.js`, `painted.js`) come back front-facing and paint over
  the white cloth. Setting the four lining materials to `BackSide` after loading makes the reload white. The fault is the
  export, not the loader. Crucible draws the exported file white because it culls back faces.
- `--lights glb` carries the hearth's point light into the preview. It does not carry the flames, the dusk walls or
  the hemisphere light, so it shows where the warm light lands and is not the game's picture.

## Not checked

Cloth that is not statically draped, animation clips on the cultivation figure, any figure beyond the cultivation
model, the path-traced tier, and a Mac or GPU run.
