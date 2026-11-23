// The player's figure in the caves: the cultivation figure, the one character model the player picks (Wendell, 2026-11-17: the
// Arcade is the only surface that keeps Average Dusk; every other surface wears the cultivation figure). Her or him in the
// light travel robe, built by public/between/cult/ in the page of the Between and baked for this page by
// bake_cult.mjs into player/cult-f.glb and cult-m.glb: one skinned mesh per material (a dozen), the 67-bone UBC rig, and two
// clips, Walk (one stride cycle in one second) and Idle (the standing rest). The cave page runs three.js r128, which reads
// them with the vendor/ GLTFLoader and SkeletonUtils.
//
// An ES module, loaded with import(). loadCult gives the parsed figure; makeCult wraps it for the basin.

// the figure each file holds, measured at bake time: its height in metres, and the ground one Walk cycle covers
const FIG = { f: { height: 1.658, cycle: 1.0502 }, m: { height: 1.75, cycle: 1.0941 } };

// which figure: the Between's pick ("f" or "m"), asked for with ?cult= or kept for the tab, else "f" (public/between/cult/pick.js)
export function cultWho() {
  let q = null; try { q = new URLSearchParams(location.search).get("cult"); } catch (e) { /* no query */ }
  if (q === "m" || q === "f") { try { sessionStorage.setItem("between-cult", q); } catch (e) { /* kept for this page only */ } return q; }
  try { const s = sessionStorage.getItem("between-cult"); if (s === "m" || s === "f") return s; } catch (e) { /* the default */ }
  return "f";
}

function script(src) {
  return new Promise(function (res, rej) {
    const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = function () { rej(new Error("no " + src)); };
    document.head.appendChild(s);
  });
}

const loaded = {};
// base: the cave's folder. Resolves { scene, bones, meshes, clips: { Walk, Idle }, height, cycle, who }; each call clones
// the figure so two can stand at once (the cave's player and the title's).
export async function loadCult(THREE, base, who) {
  who = who || cultWho();
  if (!THREE.GLTFLoader) await script(base + "vendor/GLTFLoader.js");
  if (!THREE.SkeletonUtils) await script(base + "vendor/SkeletonUtils.js");
  if (!loaded[who]) {
    loaded[who] = fetch(base + "player/cult-" + who + ".glb")
      .then(function (r) { if (!r.ok) throw new Error("cult-" + who + ".glb " + r.status); return r.arrayBuffer(); })
      .then(function (b) { return new Promise(function (res, rej) { new THREE.GLTFLoader().parse(b, "", res, rej); }); });
    loaded[who].catch(function () {});
  }
  const gl = await loaded[who];
  const scene = THREE.SkeletonUtils.clone(gl.scene), bones = [], meshes = [];
  scene.traverse(function (o) {
    if (o.isBone) bones.push(o);
    if (o.isMesh) { o.frustumCulled = false; o.material = o.material.clone(); meshes.push(o); }
  });
  const clips = {}; gl.animations.forEach(function (a) { clips[a.name] = a; });
  return { scene: scene, bones: bones, meshes: meshes, clips: clips, height: FIG[who].height, cycle: FIG[who].cycle, who: who };
}

// The basin's figure: stands where the stand-in does. height: the figure's height in the scene's units. Each frame update(dt,
// moving, walkRate): walkRate is the Walk clip's speed in cycles a second, so the feet keep to the ground.
export async function makeCult(THREE, base, height, who) {
  const c = await loadCult(THREE, base, who);
  const k = height / c.height, holder = new THREE.Group();
  c.scene.scale.setScalar(k); holder.add(c.scene);
  const mixer = new THREE.AnimationMixer(c.scene), walk = mixer.clipAction(c.clips.Walk), idle = mixer.clipAction(c.clips.Idle);
  walk.play(); idle.play(); walk.setEffectiveWeight(0); idle.setEffectiveWeight(1);
  let g = 0;
  return {
    holder: holder, dressed: true, who: c.who, stride: c.cycle * k, // stride: the ground one Walk cycle covers, in scene units
    update: function (dt, moving, walkRate) {
      g += ((moving ? 1 : 0) - g) * Math.min(1, dt * 6);
      walk.setEffectiveWeight(g); idle.setEffectiveWeight(1 - g);
      walk.timeScale = walkRate || 1;
      mixer.update(dt);
    },
  };
}
