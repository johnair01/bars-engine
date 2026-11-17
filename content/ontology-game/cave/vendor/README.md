# vendor

`GLTFLoader.js` and `SkeletonUtils.js` are three.js r128's `examples/js` builds (MIT, `THREE-LICENSE.txt`), the version the cave
page loads from cdnjs. They are copied here so the basin can read the Between's skinned figure without a second three.js:
`cult-figure.js` loads them as plain scripts, to read the cultivation figure's baked GLBs (`player/cult-f.glb`, `cult-m.glb`).
