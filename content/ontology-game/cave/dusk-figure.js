// The standard character in the cave's places: the Between's own figure (Average Dusk with the mocap Walk and Idle, dressed by
// /between/wardrobe.js in the default look), so the basin shows the same person the nook and the Between do, not the cave's
// faceless stand-in (Wendell, 2026-11-02, cb-built-look-2: "We need to replace this dummy with the standard character we've been
// using in the nook and the between").
//
// An ES module, loaded by basin.js with import(). The wardrobe is the Between's source, read from /between/ and not copied, so a
// change to the character there reaches the basin. It was written for three.js r160 and the cave page runs r128 (window.THREE),
// so basin.js maps "three" and the SkeletonUtils import to the shims in vendor/ with an import map first, and this file reads
// the r128 GLTFLoader and SkeletonUtils (vendor/, plain scripts) before it loads the three .glb files of the figure.
import { loadParts, dressFigure } from "/between/wardrobe.js";
import { parseLook } from "/calrunia/look.js";
import { stance, clipWeights, FADE } from "/between/stance.js";

function script(src) {
  return new Promise(function (res, rej) {
    var s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = function () { rej(new Error("no " + src)); };
    document.head.appendChild(s);
  });
}

// base: the cave's folder ("/ontology-game/cave/"). height: the figure's height in the scene's units. lookText: the Between's
// look string (calrunia/look.js lookText), or none for the default traveller.
export async function makeDusk(THREE, base, height, lookText) {
  if (!THREE.GLTFLoader) await script(base + "vendor/GLTFLoader.js");
  if (!THREE.SkeletonUtils) await script(base + "vendor/SkeletonUtils.js");
  // r128 predates a few attribute helpers the wardrobe (written for r160) reads
  const BA = THREE.BufferAttribute.prototype;
  if (!BA.getComponent) BA.getComponent = function (i, c) { return this.array[i * this.itemSize + c]; };
  if (!BA.setComponent) BA.setComponent = function (i, c, v) { this.array[i * this.itemSize + c] = v; return this; };
  const loadGltf = (url) => new Promise((res, rej) => new THREE.GLTFLoader().load(url, res, undefined, rej));
  const parts = await loadParts(loadGltf);
  // r128's attribute getters return a normalized integer attribute (the figure's vertex colours, weights) as its raw integers;
  // r160's return 0 to 1, which the wardrobe reads. Read them as floats once.
  [parts.dusk, parts.robe, parts.sash].forEach((g) => g.scene.traverse((o) => {
    if (!o.isMesh) return;
    Object.keys(o.geometry.attributes).forEach((n) => {
      const at = o.geometry.attributes[n]; if (!at.normalized || at.array instanceof Float32Array) return;
      const div = at.array instanceof Uint8Array ? 255 : at.array instanceof Uint16Array ? 65535 : at.array instanceof Int8Array ? 127 : 32767;
      o.geometry.setAttribute(n, new THREE.BufferAttribute(Float32Array.from(at.array, (v) => Math.max(-1, v / div)), at.itemSize));
    });
  }));
  const tpl = parts.dusk.scene; tpl.updateMatrixWorld(true);
  const box = new THREE.Box3();
  tpl.traverse((o) => { if (o.isMesh) { o.geometry.computeBoundingBox(); box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); } });
  const size = box.getSize(new THREE.Vector3()), k = height / Math.max(size.y, 0.01);
  const obj = THREE.SkeletonUtils.clone(tpl);
  obj.scale.setScalar(k); obj.position.y = -box.min.y * k;
  const wardrobe = dressFigure(obj, parts);
  wardrobe.set(lookText ? parseLook(lookText) : null);
  obj.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
  const holder = new THREE.Group(); holder.add(obj);
  const mixer = new THREE.AnimationMixer(obj), acts = {};
  ["Walk", "Idle"].forEach((n) => { const c = parts.dusk.animations.find((a) => a.name === n); if (c) { acts[n] = mixer.clipAction(c); acts[n].play(); } });
  const managed = !!(acts.Walk && acts.Idle && wardrobe.hasIdle);
  const cw = { Walk: 0, Idle: 1 }; let cur = "idle";
  if (managed) { acts.Walk.setEffectiveWeight(0); acts.Idle.setEffectiveWeight(1); }
  else if (acts.Walk) { acts.Walk.paused = true; }
  return {
    holder: holder, dressed: true, layers: wardrobe.layers,
    // each frame: whether the figure is walking, and how fast the walk clip should turn so the feet keep to the ground
    update: function (dt, moving, walkRate) {
      if (managed) {
        const s = stance({ moving: moving, sitting: false });
        if (s !== cur) { if (s === "walk" && cw.Walk < 0.05) acts.Walk.time = 0; cur = s; }
        const want = clipWeights(cur), f = 1 - Math.exp(-3 * dt / FADE[cur]);
        ["Walk", "Idle"].forEach((n) => { cw[n] += (want[n] - cw[n]) * f; if (Math.abs(cw[n] - want[n]) < 0.002) cw[n] = want[n]; acts[n].setEffectiveWeight(cw[n]); });
        acts.Walk.timeScale = walkRate || 1;
      } else if (acts.Walk) { acts.Walk.paused = !moving; if (!moving) acts.Walk.time = 0; }
      mixer.update(dt);
      wardrobe.dress(dt);
    },
  };
}
