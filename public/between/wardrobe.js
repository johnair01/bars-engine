/* The wardrobe (Between, part 4 fix): the mirror's figure wears what the Look sheet chose. Before this the Between drew
   player.glb, a body with a short tunic painted on it, so the Clothes choice only changed colours (his note 2026-10-24:
   "the clothes and robes aren't rendering"). Now every player figure is the creator's: Average Dusk with the mocap Walk and
   Idle, the J5 robe cut to jacket, wrap dress or long coat, the sash on the dress, indigo trousers, and hair (sprout's
   slice/figure.js, sprout #71, #72; six-faces-council callsheet calrunia-creator.md).
   The robe-slit build (his yes to the layers still, 2026-10-24; docs/3d-math.md rule 8) dresses it in layers, as games do:
   - the inner layer: hanfu trousers grown off the body's own legs, drawn on every cut; the leg skin under them never is;
   - the robe is lined: its inside (back faces) takes the dye's lining colour, so a slit or a turned hem shows cloth, not the room;
   - the robe is robe.glb's skinned mesh on the body's bones, the lower panels hung from the skirt bones hemF and hemB and
     driven by the thighs each frame (figure-robe.js), so it follows the Walk, the Idle, the sit and any later clip;
   - the trousers are hidden only where a cut's robe covers them in every pose (robe-cover.json, tools/figure-cover.mjs).
     const parts = await loadParts(loadGltf);           // once: the three .glb files and robe-cover.json under /between/m/dusk/
     const w = dressFigure(obj, parts);                 // obj: a SkeletonUtils clone of parts.dusk.scene
     w.set(look);                                       // a parsed look (look.js), or null for the default traveller
     w.dress(dt);                                       // each frame, after the mixer and the code-made poses */
import * as THREE from "three";
import { clone as skClone } from "three/addons/utils/SkeletonUtils.js";
import { CUT, hemOf, skirtWeights, skirt, fold, FOLD, easeOf } from "./figure-robe.js";
import { colorsOf, DEFAULT_LOOK } from "../calrunia/look.js";

const DIR = "/between/m/dusk/";
let parts = null;
const getJson = u => fetch(u).then(r => r.ok ? r.json() : null).catch(() => null);
export function loadParts(loadGltf, loadJson = getJson) {
  if (!parts) parts = Promise.all([...["average-dusk", "robe", "sash"].map(n => loadGltf(DIR + n + ".glb")), loadJson(DIR + "robe-cover.json")])
    .then(([dusk, robe, sash, cover]) => ({ dusk, robe, sash, cover }));
  return parts;
}

// the six vertex colours Average Dusk carries (linear, from the GLB), and what each one becomes (sprout figure.js PARTS)
const PARTS = [["cloth", 0, [0.0578, 0.0513, 0.1946]], ["shade", 2, [0.0252, 0.0273, 0.0578]], ["skin", -1, [0.8149, 0.7379, 0.5647]],
  ["skinShade", -2, [0.6867, 0.6172, 0.5271]], ["trim", 3, [0.4793, 0.2832, 0.0497]], ["dark", null, [0.013, 0.011, 0.0176]]];
// body shapes and builds as bone scales: [shoulder width, hip width, chest depth] and [width, depth]
const SHAPE = { a: [1.0, 1.0, 1.0], b: [1.16, 0.93, 1.04], c: [0.92, 1.14, 1.1] };
const BUILD = { slender: [0.88, 0.9], average: [1, 1], broad: [1.13, 1.06], round: [1.12, 1.22] };
// the trousers: indigo, with a darker wrap at the ankle below WRAP (rest metres)
const TROUSER = "#3b3d63", TROUSER_WRAP = "#2a2a40", WRAP = 0.16;
const top = (sw, si, j) => { let b = 0, w = -1; for (let k = 0; k < 4; k++) if (sw.getComponent(j, k) > w) { w = sw.getComponent(j, k); b = si.getComponent(j, k); } return b; };

export function dressFigure(root, P) {
  let mesh = null; root.traverse(o => { if (o.isSkinnedMesh && !mesh) mesh = o; });
  mesh.geometry = mesh.geometry.clone();   // the clone shares geometry; this body gets its own colours and mask
  const bone = n => root.getObjectByName(n);
  const B = Object.fromEntries(["hips", "spine", "neck", "head", "shoulderL", "shoulderR", "hipL", "hipR", "kneeL", "kneeR", "ankleL", "ankleR", "hemF", "hemB"].map(n => [n, bone(n)]));
  const rest = new Map(); root.traverse(o => { if (o.isBone) rest.set(o, { p: o.position.clone(), q: o.quaternion.clone(), s: o.scale.clone() }); });
  const idleClip = P.dusk.animations.find(a => a.name === "Idle");

  const col = mesh.geometry.attributes.color, part = new Uint8Array(col.count);
  for (let i = 0; i < col.count; i++) { const c = [col.getX(i), col.getY(i), col.getZ(i)];
    let best = 0, bd = 9; PARTS.forEach(([, , p], k) => { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bd) { bd = d; best = k; } });
    part[i] = best; }
  const out = new THREE.BufferAttribute(new Float32Array(col.count * 4), 4); mesh.geometry.setAttribute("color", out);
  const mat = mesh.material = mesh.material.clone(); mat.vertexColors = true;
  mat.userData.noPaint = true;   // the figure keeps its true colours: the room is painted, the figure is lit (lt-true-colours)

  // the J5 pieces re-bound to this body's bones (same rig, same bind pose)
  function wear(g, light, grow = 0) {
    let m = null; skClone(g.scene).traverse(o => { if (o.isSkinnedMesh && !m) m = o; });
    m.geometry = m.geometry.clone();
    if (grow) { const Pp = m.geometry.attributes.position, N = m.geometry.attributes.normal;
      for (let i = 0; i < Pp.count; i++) { const h = Math.hypot(N.getX(i), N.getZ(i)) || 1; Pp.setXYZ(i, Pp.getX(i) + N.getX(i) / h * grow, Pp.getY(i), Pp.getZ(i) + N.getZ(i) / h * grow); } }
    m.bind(new THREE.Skeleton(m.skeleton.bones.map(b => bone(b.name)), m.skeleton.boneInverses), m.bindMatrix);
    m.frustumCulled = false; mesh.parent.add(m); m.material = mat;
    const c = m.geometry.attributes.color, kind = new Uint8Array(c.count);
    for (let i = 0; i < c.count; i++) kind[i] = c.getX(i) > light ? 1 : 0;
    const paint = new THREE.BufferAttribute(new Float32Array(c.count * 4), 4); m.geometry.setAttribute("color", paint);
    return { m, kind, paint };
  }
  const sash = wear(P.sash, 0.4, 0.025);

  // the robe: robe.glb's skinned mesh on this body's bones, its lower panels re-weighted once to the skirt bones (figure-robe.js)
  const robe = (() => {
    const { m, kind, paint } = wear(P.robe, 0.4), g = m.geometry, RP = g.attributes.position, J = g.attributes.skinIndex, W = g.attributes.skinWeight;
    // the lower skirt bones: one under each skirt bone at the fold (knee height), made here in the rest pose, so a panel can
    // bend there; the robe's skeleton takes them with their bind matrices in the robe's own space
    root.updateMatrixWorld(true);
    const low = [B.hemF, B.hemB].map((h, i) => { const b = new THREE.Bone(); b.name = h.name + "2"; h.add(b);
      b.position.copy(h.worldToLocal(root.localToWorld(new THREE.Vector3(0, FOLD, i ? -0.02 : 0.02)))); b.updateMatrixWorld(true);
      return [b, new THREE.Matrix4().copy(m.matrixWorld).invert().multiply(b.matrixWorld).invert()]; });
    m.bind(new THREE.Skeleton([...m.skeleton.bones, ...low.map(l => l[0])], [...m.skeleton.boneInverses, ...low.map(l => l[1])]), m.bindMatrix);
    const sI = new Uint16Array(J.count * 4), sW = new Float32Array(J.count * 4), sb = m.skeleton.bones, NR = g.attributes.normal, arm = /shoulder|elbow|wrist/;
    for (let i = 0; i < J.count; i++) { let aw = 0; for (let k = 0; k < 4; k++) { sI[i * 4 + k] = J.getComponent(i, k); sW[i * 4 + k] = W.getComponent(i, k); if (arm.test(sb[sI[i * 4 + k]].name)) aw += sW[i * 4 + k]; }
      const e = aw < 0.5 ? easeOf(RP.getY(i)) : 0, h = Math.hypot(NR.getX(i), NR.getZ(i)) || 1;   // the ease, out along the level normal
      if (e) RP.setXYZ(i, RP.getX(i) + NR.getX(i) / h * e, RP.getY(i), RP.getZ(i) + NR.getZ(i) / h * e); }
    skirtWeights({ pos: RP.array, index: g.index.array, skinIndex: sI, skinWeight: sW, hips: sb.indexOf(B.hips), hemF: sb.indexOf(B.hemF), hemB: sb.indexOf(B.hemB), hemF2: sb.indexOf(low[0][0]), hemB2: sb.indexOf(low[1][0]), hipL: sb.indexOf(B.hipL), hipR: sb.indexOf(B.hipR) });
    g.setAttribute("skinIndex", new THREE.BufferAttribute(sI, 4)); g.setAttribute("skinWeight", new THREE.BufferAttribute(sW, 4));
    // a cut is drawn, not made: below the cut's hem the robe is not drawn, with a band of the cut's colour above it; the inside
    // (back faces) is the lining
    g.setAttribute("restY", new THREE.BufferAttribute(Float32Array.from({ length: RP.count }, (_, i) => RP.getY(i)), 1));
    const hem = { value: -1 }, band = { value: new THREE.Color() }, lining = { value: new THREE.Color() }, rm = mat.clone(); rm.side = THREE.DoubleSide;
    const painted = THREE.MeshStandardMaterial.prototype.onBeforeCompile;   // keep the room's painterly patch (paint.js)
    rm.onBeforeCompile = (sh, rr) => { painted.call(rm, sh, rr); Object.assign(sh.uniforms, { hem, band, lining });
      sh.vertexShader = "attribute float restY;\nvarying float vRestY;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvRestY = restY;");
      sh.fragmentShader = "uniform float hem;\nuniform vec3 band;\nuniform vec3 lining;\nvarying float vRestY;\n" + sh.fragmentShader.replace("#include <color_fragment>",
        "#include <color_fragment>\nif (hem > 0.0) { if (vRestY < hem) discard; if (vRestY < hem + 0.045) diffuseColor.rgb = band; }\nif (!gl_FrontFacing) diffuseColor.rgb = lining;"); };
    const key = THREE.MeshStandardMaterial.prototype.customProgramCacheKey;
    rm.customProgramCacheKey = () => key.call(rm) + "|robelined";
    m.material = rm;
    return { m, kind, paint, hem, band, lining, sk: skirt(), low: low.map(l => l[0]) };
  })();
  const floorY = (() => { let y = Infinity; const Pp = mesh.geometry.attributes.position; for (let i = 0; i < Pp.count; i++) y = Math.min(y, Pp.getY(i)); return y; })();

  // the trousers: a shell grown off the body's own legs, so it bends exactly with them (sprout figure.js, round 4); `src` is each
  // trouser point's body point, which robe-cover.json names
  const pants = (() => {
    const g = mesh.geometry, Pp = g.attributes.position, N = g.attributes.normal, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
    const legs = new Set(["hips", "hipL", "kneeL", "ankleL", "hipR", "kneeR", "ankleR"].map(n => mesh.skeleton.bones.indexOf(bone(n))));
    const ok = j => Pp.getY(j) < 1.0 && legs.has(top(sw, si, j)) && PARTS[part[j]][0] !== "dark";
    const ix = g.index.array, keep = [], map = new Map();
    for (let t = 0; t < ix.length; t += 3) if (ok(ix[t]) && ok(ix[t + 1]) && ok(ix[t + 2])) keep.push(ix[t], ix[t + 1], ix[t + 2]);
    for (const j of keep) if (!map.has(j)) map.set(j, map.size);
    const n = map.size, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), sI = new Uint16Array(n * 4), sW = new Float32Array(n * 4), y = new Float32Array(n);
    const key = j => `${Pp.getX(j).toFixed(4)},${Pp.getY(j).toFixed(4)},${Pp.getZ(j).toFixed(4)}`, outN = new Map();
    for (const j of map.keys()) { const o = outN.get(key(j)) ?? outN.set(key(j), new THREE.Vector3()).get(key(j)); o.x += N.getX(j); o.z += N.getZ(j); o.y++; }
    const ease = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
    for (const [j, k] of map) {
      const h = Pp.getY(j), o = outN.get(key(j)), nv = new THREE.Vector3(o.x / o.y, 0, o.z / o.y);
      nv.multiplyScalar(1 / Math.max(0.5, nv.length()));
      const off = 0.004 + 0.008 * ease(0.86, 0.7, h) + 0.014 * ease(0.55, 0.32, h) - 0.016 * ease(0.24, 0.15, h);
      pos.set([Pp.getX(j) + nv.x * off, h, Pp.getZ(j) + nv.z * off], k * 3); nor.set([N.getX(j), N.getY(j), N.getZ(j)], k * 3); y[k] = h;
      for (let q = 0; q < 4; q++) { sI[k * 4 + q] = si.getComponent(j, q); sW[k * 4 + q] = sw.getComponent(j, q); }
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); pg.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    pg.setAttribute("skinIndex", new THREE.BufferAttribute(sI, 4)); pg.setAttribute("skinWeight", new THREE.BufferAttribute(sW, 4));
    const paint = new THREE.BufferAttribute(new Float32Array(n * 4), 4); pg.setAttribute("color", paint);
    pg.setIndex(keep.map(j => map.get(j))); pg.computeVertexNormals();
    const m = new THREE.SkinnedMesh(pg, mat); m.frustumCulled = false; mesh.parent.add(m); m.bind(mesh.skeleton, mesh.bindMatrix);
    // the leg skin the trousers are made from is never drawn: the body keeps every other triangle
    const others = []; for (let t = 0; t < ix.length; t += 3) if (!(ok(ix[t]) && ok(ix[t + 1]) && ok(ix[t + 2]))) others.push(ix[t], ix[t + 1], ix[t + 2]);
    g.setIndex(others);
    return { m, y, paint, index: pg.index.array.slice(), src: Int32Array.from(map.keys()) };
  })();
  // the mask: a trouser triangle is not drawn under a cut when the cut's robe covers all three of its points in every pose
  // (robe-cover.json, made by tools/figure-cover.mjs; without it every trouser triangle is drawn)
  function mask(outfit) {
    const list = P.cover && P.cover.cuts && P.cover.cuts[outfit], hid = new Uint8Array(pants.src.length);
    if (list) { const cov = new Set(list); pants.src.forEach((j, k) => { hid[k] = cov.has(j) ? 1 : 0; }); }
    const ix = pants.index, o = []; for (let t = 0; t < ix.length; t += 3) if (!(hid[ix[t]] && hid[ix[t + 1]] && hid[ix[t + 2]])) o.push(ix[t], ix[t + 1], ix[t + 2]);
    pants.m.geometry.setIndex(o);
  }

  // hair from simple solids on the head bone, sized to the head (sprout figure.js)
  root.updateMatrixWorld(true);
  const headIx = mesh.skeleton.bones.indexOf(B.head), si = mesh.geometry.attributes.skinIndex, sw = mesh.geometry.attributes.skinWeight, pos = mesh.geometry.attributes.position;
  const hb = new THREE.Box3(), v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) for (let k = 0; k < 4; k++) if (si.getComponent(i, k) === headIx && sw.getComponent(i, k) > 0.5) { v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld); hb.expandByPoint(v); }
  const hc = hb.getCenter(new THREE.Vector3()), hs = hb.getSize(new THREE.Vector3()), hr = Math.max(hs.x, hs.z) / 2;
  const hairRoot = new THREE.Group(); B.head.add(hairRoot); hairRoot.position.copy(B.head.worldToLocal(hc.clone()));
  hairRoot.quaternion.copy(B.head.getWorldQuaternion(new THREE.Quaternion()).invert());
  hairRoot.scale.setScalar(1 / B.head.getWorldScale(new THREE.Vector3()).x);   // world-sized solids under a scaled body
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1c2222, roughness: 0.9, flatShading: true });
  hairMat.userData.noPaint = true;
  const sphere = (r, sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 7), hairMat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); return m; };
  const tilt = (m, x, y, z) => { m.rotation.set(x, y, z); return m; };
  const HAIR = {
    afro: r => [sphere(r, 1.45, 1.3, 1.4, 0, r * 0.45, -r * 0.2)],
    sweep: r => [sphere(r, 1.22, 0.8, 1.24, 0, r * 0.5, -r * 0.1), tilt(sphere(r, 0.95, 0.42, 0.85, r * 0.3, r * 0.85, r * 0.45), 0.3, 0, -0.35)],
    page: r => [sphere(r, 1.24, 0.82, 1.24, 0, r * 0.45, -r * 0.08), sphere(r, 1.32, 1.15, 1.05, 0, -r * 0.15, -r * 0.32)],
    spiked: r => [sphere(r, 1.18, 0.7, 1.2, 0, r * 0.5, -r * 0.1), ...[-0.7, -0.25, 0.25, 0.7].flatMap(a => [0.15, -0.5].map(b => {
      const c = new THREE.Mesh(new THREE.ConeGeometry(r * 0.3, r * 1.05, 5), hairMat); c.position.set(Math.sin(a) * r * 0.65, r * 1.1, b * r); c.rotation.set(b * 0.6, 0, -a * 0.8); return c; }))] };

  let outfit = null, style = null;
  function shapeBody(shape, build) {
    for (const [o, r] of rest) { o.position.copy(r.p); o.scale.copy(r.s); }
    const [sh, hp, ch] = SHAPE[shape] ?? SHAPE.a, [bw, bd] = BUILD[build] ?? BUILD.average;
    const sx = sh * bw, hx = hp * bw, dz = ch * bd;
    B.hips.scale.set(hx, 1, bd); B.spine.scale.set(sx / hx, 1, dz / bd);
    for (const n of ["neck", "shoulderL", "shoulderR"]) if (B[n]?.parent === B.spine) B[n].scale.set(1 / sx, 1, 1 / dz);
    for (const n of ["hipL", "hipR"]) if (B[n]?.parent === B.hips) B[n].scale.set(1 / hx, 1, 1 / bd);
    // the skirt widens with the hips but never narrows: the legs keep their girth on a slighter body, so a narrowed skirt would
    // cut into them (the bake did the same, figure-robe.js before the robe-slit build)
    for (const n of ["hemF", "hemB"]) if (B[n]?.parent === B.hips) B[n].scale.set(Math.max(1, hx) / hx, 1, Math.max(1, bd) / bd);
  }
  function paint(L, colors) {
    const c = new THREE.Color(), want = { cloth: colors.cloth[0], shade: colors.cloth[2], trim: colors.cloth[3], skin: colors.skin };
    const skinShade = new THREE.Color(colors.skin).multiplyScalar(0.8);
    const lin = PARTS.map(([n, , p]) => n === "skinShade" ? skinShade : n === "dark" ? new THREE.Color(...p) : c.clone().set(want[n]));
    for (let i = 0; i < part.length; i++) { const k = lin[part[i]]; out.setXYZW(i, k.r, k.g, k.b, 1); }
    out.needsUpdate = true;
    const C = CUT[L.outfit] ?? CUT.coat, main = new THREE.Color(colors.cloth[0]), band = new THREE.Color(colors.cloth[C.band]);
    for (let i = 0; i < robe.kind.length; i++) { const k = robe.kind[i] ? band : main; robe.paint.setXYZW(i, k.r, k.g, k.b, 1); }
    robe.paint.needsUpdate = true; robe.band.value.copy(band); robe.lining.value.set(colors.lining);
    const sTrim = new THREE.Color(colors.cloth[3]), sKnot = sTrim.clone().multiplyScalar(0.55);
    for (let i = 0; i < sash.kind.length; i++) { const k = sash.kind[i] ? sTrim : sKnot; sash.paint.setXYZW(i, k.r, k.g, k.b, 1); }
    sash.paint.needsUpdate = true;
    const pMain = new THREE.Color(TROUSER), pWrap = new THREE.Color(TROUSER_WRAP);
    for (let i = 0; i < pants.y.length; i++) { const k = pants.y[i] < WRAP ? pWrap : pMain; pants.paint.setXYZW(i, k.r, k.g, k.b, 1); }
    pants.paint.needsUpdate = true;
    hairMat.color.set(colors.hair);
    if (style !== L.style) { hairRoot.clear(); for (const m of (HAIR[L.style] ?? HAIR.afro)(hr)) hairRoot.add(m); style = L.style; }
  }
  // a leg line's forward pitch in the hips' own frame (0 hangs straight down), and how high the hips stand over the floor
  const hq = new THREE.Quaternion(), va = new THREE.Vector3(), vb = new THREE.Vector3();
  const pitch = (a, b) => { B.hips.getWorldQuaternion(hq).invert(); vb.copy(b.getWorldPosition(vb)).sub(a.getWorldPosition(va)).applyQuaternion(hq); return Math.atan2(vb.z, -vb.y); };
  const rq = [B.hemF, B.hemB].map(b => rest.get(b).q), qx = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0);
  // a panel's turn in the hips' frame: the hips' depth scale (the build) stretches a turn, so the bone turns less to land on it
  const turn = (b, q0, a) => { const sz = B.hips.scale.z * b.scale.z; b.quaternion.copy(qx.setFromAxisAngle(X, -Math.atan2(Math.sin(a) / sz, Math.cos(a)))).multiply(q0); };
  return {
    set(look) {
      const L = look || DEFAULT_LOOK;
      shapeBody(L.shape, L.build);
      if (L.outfit !== outfit) { const C = CUT[L.outfit] ?? CUT.coat; robe.hem.value = C.hem || -1; sash.m.visible = C.sash; mask(L.outfit); outfit = L.outfit; }
      paint(L, colorsOf(L));
    },
    hasIdle: !!idleClip,
    /* the skirt panels from the legs as posed now (call it after the mixer and the code poses; dt in seconds, none to snap) */
    dress(dt) {
      if (!B.hemF || !B.hemB) return;
      root.updateMatrixWorld(true);
      const high = root.worldToLocal(B.hips.getWorldPosition(va)).y - floorY;
      const a = robe.sk.step([pitch(B.hipL, B.kneeL), pitch(B.hipR, B.kneeR), pitch(B.hipL, B.ankleL), pitch(B.hipR, B.ankleR)], [pitch(B.kneeL, B.ankleL), pitch(B.kneeR, B.ankleR)], high, dt);
      turn(B.hemF, rq[0], a[0]); turn(B.hemB, rq[1], a[1]);
      // below the fold: the turn from the panel above to the pitch the lower panel wants, gathered to the height the fold has
      robe.low.forEach((b, i) => { b.parent.updateMatrixWorld(true); b.scale.y = 1; b.quaternion.setFromAxisAngle(X, -(a[i + 2] - a[i]));
        b.updateMatrixWorld(true); b.scale.y = fold(root.worldToLocal(b.getWorldPosition(va)).y - floorY, a[i + 2]); b.updateMatrixWorld(true); });
      return a;
    },
    // what the robe tools read (tools/figure-cover.mjs, tools/figure-legs-probe.mjs): the meshes and the cut's hem
    layers: { body: mesh, pants: pants.m, pantsSrc: pants.src, pantsY: pants.y, pantsIndex: pants.index, robe: robe.m, hem: () => hemOf(CUT[outfit] ?? CUT.coat) },
  };
}
