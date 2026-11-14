# vendor

`GLTFLoader.js` and `SkeletonUtils.js` are three.js r128's `examples/js` builds (MIT, `THREE-LICENSE.txt`), the version the cave
page loads from cdnjs. They are copied here so the basin can read the Between's skinned figure without a second three.js:
`dusk-figure.js` loads them as plain scripts, and `three-shim.js` hands the page's own `window.THREE` to the Between's
`wardrobe.js` through an import map.
