/* The wardrobe (Between, part 4 fix): the mirror's figure wears what the Look sheet chose. Before this the Between drew
   player.glb, a body with a short tunic painted on it, so the Clothes choice only changed colours (his note 2026-10-24:
   "the clothes and robes aren't rendering"). Now every player figure is the creator's: Average Dusk with the mocap Walk,
   the baked J5 robe cut to jacket, wrap dress or long coat, the sash on the dress, travel pants, and hair, the same files
   and the same code as sprout's slice/figure.js (sprout #71, #72; six-faces-council callsheet calrunia-creator.md).
   The garment rule (docs/3d-math.md rule 8, council #375) comes with it: the legs are not drawn where the cut covers them,
   and the robe is pushed off thigh, shin and arm capsules (figure-robe.js, carried from sprout as it is).
     const parts = await loadParts(loadGltf);           // once: the four .glb files under /between/m/dusk/
     const w = dressFigure(obj, parts);                 // obj: a SkeletonUtils clone of parts.dusk.scene
     w.set(look);                                       // a parsed look (look.js), or null for the default traveller
     w.dress(walkTime);                                 // each frame, after the mixer and the code-made poses */
import * as THREE from "three";
import { clone as skClone } from "three/addons/utils/SkeletonUtils.js";
import { bakedRobe, armShare, armRadii, CUT, maskBand, LEG, legRadii, legCapsules } from "./figure-robe.js";
import { colorsOf, DEFAULT_LOOK } from "../calrunia/look.js";

const DIR = "/between/m/dusk/";
let parts = null;
export function loadParts(loadGltf) {
  if (!parts) parts = Promise.all(["average-dusk", "robe", "sash", "robe-baked"].map(n => loadGltf(DIR + n + ".glb")))
    .then(([dusk, robe, sash, baked]) => ({ dusk, robe, sash, baked }));
  return parts;
}

// the six vertex colours Average Dusk carries (linear, from the GLB), and what each one becomes (sprout figure.js PARTS)
const PARTS = [["cloth", 0, [0.0578, 0.0513, 0.1946]], ["shade", 2, [0.0252, 0.0273, 0.0578]], ["skin", -1, [0.8149, 0.7379, 0.5647]],
  ["skinShade", -2, [0.6867, 0.6172, 0.5271]], ["trim", 3, [0.4793, 0.2832, 0.0497]], ["dark", null, [0.013, 0.011, 0.0176]]];
// body shapes and builds as bone scales: [shoulder width, hip width, chest depth] and [width, depth]
const SHAPE = { a: [1.0, 1.0, 1.0], b: [1.16, 0.93, 1.04], c: [0.92, 1.14, 1.1] };
const BUILD = { slender: [0.88, 0.9], average: [1, 1], broad: [1.13, 1.06], round: [1.12, 1.22] };
const ARM = [["shoulderL", "elbowL"], ["elbowL", "wristL"], ["wristL", null], ["shoulderR", "elbowR"], ["elbowR", "wristR"], ["wristR", null]];
const HAND = 0.09, PAD = 0.006;
const top = (sw, si, j) => { let b = 0, w = -1; for (let k = 0; k < 4; k++) if (sw.getComponent(j, k) > w) { w = sw.getComponent(j, k); b = si.getComponent(j, k); } return b; };

export function dressFigure(root, P) {
  let mesh = null; root.traverse(o => { if (o.isSkinnedMesh && !mesh) mesh = o; });
  mesh.geometry = mesh.geometry.clone();   // the clone shares geometry; this body gets its own colours and mask
  const bone = n => root.getObjectByName(n);
  const B = Object.fromEntries(["hips", "spine", "neck", "head", "shoulderL", "shoulderR", "hipL", "hipR"].map(n => [n, bone(n)]));
  const rest = new Map(); root.traverse(o => { if (o.isBone) rest.set(o, { p: o.position.clone(), q: o.quaternion.clone(), s: o.scale.clone() }); });
  const clip = P.dusk.animations[0];

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

  // walk frame 0 for the robe's arm share, then the bones go back to rest so the page's own mixer starts clean
  const tmp = new THREE.AnimationMixer(root); tmp.clipAction(clip).play(); tmp.setTime(0); root.updateMatrixWorld(true);
  const wp = (n, t) => root.worldToLocal(bone(n).getWorldPosition(t));
  const robe = (() => {
    let bm = null; P.baked.scene.traverse(o => { if (o.isMesh && !bm) bm = o; });
    const g = bm.geometry, flat = a => Float32Array.from(a.array);
    const base = flat(g.attributes.position), normal = flat(g.attributes.normal);
    const frames = g.morphAttributes.position.map(flat), frameNormals = g.morphAttributes.normal.map(flat);
    let sm = null; skClone(P.robe.scene).traverse(o => { if (o.isSkinnedMesh && !sm) sm = o; });
    sm.bind(new THREE.Skeleton(sm.skeleton.bones.map(b => bone(b.name)), sm.skeleton.boneInverses), sm.bindMatrix);
    sm.skeleton.update();
    const SP = sm.geometry.attributes.position, J = sm.geometry.attributes.skinIndex, W = sm.geometry.attributes.skinWeight;
    const armB = new Set(["shoulderL", "elbowL", "wristL", "shoulderR", "elbowR", "wristR"]), sp = new Float32Array(SP.count * 3), aw = new Float32Array(SP.count), v = new THREE.Vector3();
    for (let i = 0; i < SP.count; i++) { v.fromBufferAttribute(SP, i); sm.applyBoneTransform(i, v); sp.set([v.x, v.y, v.z], i * 3);
      for (let q = 0; q < 4; q++) if (armB.has(sm.skeleton.bones[J.getComponent(i, q)].name)) aw[i] += W.getComponent(i, q); }
    const r = bakedRobe({ base, normal, frames, frameNormals, fps: frames.length / clip.duration, arm: armShare(base, sp, aw) });
    const geo = new THREE.BufferGeometry(), Pa = new THREE.BufferAttribute(r.pos, 3), N = new THREE.BufferAttribute(r.nor, 3);
    Pa.setUsage(THREE.DynamicDrawUsage); N.setUsage(THREE.DynamicDrawUsage); r.pose(0); geo.setAttribute("position", Pa); geo.setAttribute("normal", N);
    const c = g.attributes.color, kind = new Uint8Array(c.count), y = new Float32Array(c.count);
    for (let i = 0; i < c.count; i++) { kind[i] = c.array[i * c.itemSize] > 100 ? 1 : 0; y[i] = base[i * 3 + 1]; }
    const paint = new THREE.BufferAttribute(new Float32Array(c.count * 4), 4); geo.setAttribute("color", paint);
    geo.setIndex(Array.from(g.index.array));
    // a cut is drawn, not made: below the cut's hem the robe is not drawn, with a band of the cut's colour above it
    geo.setAttribute("restY", new THREE.BufferAttribute(y, 1));
    const hem = { value: -1 }, band = { value: new THREE.Color() }, rm = mat.clone(); rm.side = THREE.DoubleSide;
    const painted = THREE.MeshStandardMaterial.prototype.onBeforeCompile;   // keep the room's painterly patch (paint.js)
    rm.onBeforeCompile = (sh, rr) => { painted.call(rm, sh, rr); Object.assign(sh.uniforms, { hem, band });
      sh.vertexShader = "attribute float restY;\nvarying float vRestY;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvRestY = restY;");
      sh.fragmentShader = "uniform float hem;\nuniform vec3 band;\nvarying float vRestY;\n" + sh.fragmentShader.replace("#include <color_fragment>",
        "#include <color_fragment>\nif (hem > 0.0) { if (vRestY < hem) discard; if (vRestY < hem + 0.045) diffuseColor.rgb = band; }"); };
    const key = THREE.MeshStandardMaterial.prototype.customProgramCacheKey;
    rm.customProgramCacheKey = () => key.call(rm) + "|robehem";
    const m = new THREE.Mesh(geo, rm); m.frustumCulled = false; root.add(m);
    return { m, kind, paint, r, P: Pa, N, hem, band };
  })();
  const seg = ([a, b], A = new THREE.Vector3(), Bp = new THREE.Vector3()) => { wp(a, A);
    if (b) wp(b, Bp); else Bp.copy(A).sub(wp(bone(a).parent.name, Bp)).setLength(HAND).add(A); return [A, Bp]; };
  const radii = (list, f) => { const d = {}, Pp = mesh.geometry.attributes.position, l = new THREE.Line3(), c = new THREE.Vector3(), w = new THREE.Vector3(), A = new THREE.Vector3(), Bq = new THREE.Vector3(), si = mesh.geometry.attributes.skinIndex, sw = mesh.geometry.attributes.skinWeight;
    for (let j = 0; j < Pp.count; j++) { const s = list.find(q => q[0] === mesh.skeleton.bones[top(sw, si, j)].name); if (!s) continue;
      const [a, b] = list === ARM ? seg(s, A, Bq) : [wp(s[0], A), wp(s[1], Bq)]; l.set(a, b);
      w.fromBufferAttribute(Pp, j); mesh.applyBoneTransform(j, w); root.worldToLocal(w.applyMatrix4(mesh.matrixWorld));
      (d[s[0]] = d[s[0]] || []).push(w.distanceTo(l.closestPointToPoint(w, true, c))); }
    return f(d); };
  const RAD = radii(ARM, armRadii), LRAD = radii(LEG, legRadii);
  tmp.stopAllAction(); tmp.uncacheRoot(root);
  for (const [o, r] of rest) { o.position.copy(r.p); o.quaternion.copy(r.q); o.scale.copy(r.s); }

  // travel pants: a shell grown off the body's own legs, so it bends exactly with them (sprout figure.js, round 4)
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
    return { m, y, paint, index: pg.index.array.slice() };
  })();
  // the mask: leg skin and pants whose rest height lies inside the cut's band are not drawn
  const bodyLeg = (() => { const g = mesh.geometry, Pp = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, legOut = new Uint8Array(Pp.count);
    const legBones = new Set(["hips", "hipL", "kneeL", "ankleL", "hipR", "kneeR", "ankleR"].map(n => mesh.skeleton.bones.indexOf(bone(n))));
    for (let j = 0; j < Pp.count; j++) legOut[j] = legBones.has(top(sw, si, j)) ? 1 : 0;
    return { index: g.index.array.slice(), y: Pp.array.filter((_, i) => i % 3 === 1), leg: legOut }; })();
  function mask(C) {
    const [lo, hi] = maskBand(C), hid = (y, j, leg) => (!leg || leg[j]) && y[j] >= lo && y[j] <= hi;
    const keep = (index, y, leg) => { const o = []; for (let t = 0; t < index.length; t += 3) if (!(hid(y, index[t], leg) && hid(y, index[t + 1], leg) && hid(y, index[t + 2], leg))) o.push(index[t], index[t + 1], index[t + 2]); return o; };
    mesh.geometry.setIndex(keep(bodyLeg.index, bodyLeg.y, bodyLeg.leg)); pants.m.geometry.setIndex(keep(pants.index, pants.y, null));
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

  let body = { hips: [1, 1], chest: [1, 1], shift: 0 }, outfit = null, style = null;
  function shapeBody(shape, build) {
    for (const [o, r] of rest) { o.position.copy(r.p); o.scale.copy(r.s); }
    const [sh, hp, ch] = SHAPE[shape] ?? SHAPE.a, [bw, bd] = BUILD[build] ?? BUILD.average;
    const sx = sh * bw, hx = hp * bw, dz = ch * bd;
    B.hips.scale.set(hx, 1, bd); B.spine.scale.set(sx / hx, 1, dz / bd);
    body = { hips: [hx, bd], chest: [sx, dz], shift: B.shoulderL.position.x * (sx - 1) };
    for (const n of ["neck", "shoulderL", "shoulderR"]) if (B[n]?.parent === B.spine) B[n].scale.set(1 / sx, 1, 1 / dz);
    for (const n of ["hipL", "hipR"]) if (B[n]?.parent === B.hips) B[n].scale.set(1 / hx, 1, 1 / bd);
  }
  function paint(L, colors) {
    const c = new THREE.Color(), want = { cloth: colors.cloth[0], shade: colors.cloth[2], trim: colors.cloth[3], skin: colors.skin };
    const skinShade = new THREE.Color(colors.skin).multiplyScalar(0.8);
    const lin = PARTS.map(([n, , p]) => n === "skinShade" ? skinShade : n === "dark" ? new THREE.Color(...p) : c.clone().set(want[n]));
    for (let i = 0; i < part.length; i++) { const k = lin[part[i]]; out.setXYZW(i, k.r, k.g, k.b, 1); }
    out.needsUpdate = true;
    const C = CUT[L.outfit] ?? CUT.coat, main = new THREE.Color(colors.cloth[0]), band = new THREE.Color(colors.cloth[C.band]);
    for (let i = 0; i < robe.kind.length; i++) { const k = robe.kind[i] ? band : main; robe.paint.setXYZW(i, k.r, k.g, k.b, 1); }
    robe.paint.needsUpdate = true; robe.band.value.copy(band);
    const sTrim = new THREE.Color(colors.cloth[3]), sKnot = sTrim.clone().multiplyScalar(0.55);
    for (let i = 0; i < sash.kind.length; i++) { const k = sash.kind[i] ? sTrim : sKnot; sash.paint.setXYZW(i, k.r, k.g, k.b, 1); }
    sash.paint.needsUpdate = true;
    const pShade = new THREE.Color(colors.cloth[2]), pWrap = pShade.clone().multiplyScalar(0.62);
    for (let i = 0; i < pants.y.length; i++) { const k = pants.y[i] < 0.2 ? pWrap : pShade; pants.paint.setXYZW(i, k.r, k.g, k.b, 1); }
    pants.paint.needsUpdate = true;
    hairMat.color.set(colors.hair);
    if (style !== L.style) { hairRoot.clear(); for (const m of (HAIR[L.style] ?? HAIR.afro)(hr)) hairRoot.add(m); style = L.style; }
  }
  const hipsAt = new THREE.Vector3(), legAt = new THREE.Vector3(), capA = ARM.map(() => [new THREE.Vector3(), new THREE.Vector3()]);
  const legPos = n => wp(n, legAt).toArray();
  return {
    set(look) {
      const L = look || DEFAULT_LOOK;
      shapeBody(L.shape, L.build);
      if (L.outfit !== outfit) { const C = CUT[L.outfit] ?? CUT.coat; robe.hem.value = C.hem || -1; sash.m.visible = C.sash; mask(C); outfit = L.outfit; }
      paint(L, colorsOf(L));
    },
    /* the robe at the Walk's time t, on this body as it is posed now */
    dress(t) {
      root.updateMatrixWorld(true); wp("hips", hipsAt);
      const caps = ARM.map((q, i) => { const [A, Bp] = seg(q, ...capA[i]); return [A.x, A.y, A.z, Bp.x, Bp.y, Bp.z, RAD[q[0]] + PAD]; }).concat(legCapsules(legPos, LRAD));
      robe.r.pose(t, { cx: hipsAt.x, cz: hipsAt.z, ...body, caps });
      robe.P.needsUpdate = true; robe.N.needsUpdate = true;
    },
  };
}
