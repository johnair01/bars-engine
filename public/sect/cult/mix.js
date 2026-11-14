// Cultivation parts round 2026-10-30: one mix {gender, build, skin, height, direction, outfit} -> a dressed, posed
// figure, its covered-body mask, its poke numbers and its stills. Run through parts.html (recombine.cjs drives it).
// The light is the clothing kit's soft multi-directional set (r0g8 cams.js `lights`), the game's own three.js shading.
import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import * as FG from './figure.js';
import * as GA from './shells.js';
import { lights } from './r0g8/cams.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const wp = b => b.getWorldPosition(V());
// heaven round 19: the renderer is made on first use (only shoot and shootAt draw with it), so a live page that imports
// this module does not open a second WebGL context
let _renderer = null;
const R_ = () => { if (!_renderer) { _renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  _renderer.setPixelRatio(1); _renderer.outputColorSpace = THREE.SRGBColorSpace; _renderer.toneMapping = THREE.ACESFilmicToneMapping; _renderer.toneMappingExposure = 1.05; } return _renderer; };
const BG = new THREE.Color('#ece3d7');
const CHECKED = ['hips', 'spine01', 'spine', 'spine03', 'clavL', 'clavR', 'shoulderL', 'shoulderR', 'elbowL', 'elbowR', 'foreSwingL', 'foreSwingR', 'hipL', 'hipR', 'kneeL', 'kneeR'];
const KEEP = 0.12; // m of body kept drawn above any open edge (docs/3d-math.md rule 8)

// skinned world positions of a garment part at the current pose
export function partWorld(pt) {
  if (pt.settled) return pt.settled;
  const m = pt.mesh, P = m.geometry.attributes.position, out = new Float32Array(P.count * 3), v = V(); m.updateMatrixWorld(true);
  if (pt.poseFix) pt.poseFix(); const MA = m.geometry.morphAttributes.position || [], MI = m.morphTargetInfluences || [], mv = V(), mw = V(); // round 4 fix 3: a pose's corrective shapes (the bell, the armpits), absolute targets
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); if (MA.length) { mw.copy(v); for (let j = 0; j < MA.length; j++) if (MI[j] > 0) v.addScaledVector(mv.fromBufferAttribute(MA[j], i).sub(mw), MI[j]); } m.applyBoneTransform(i, v); v.applyMatrix4(m.matrixWorld); out[i * 3] = v.x; out[i * 3 + 1] = v.y; out[i * 3 + 2] = v.z; }
  return out;
}
function bvhOf(pos, index) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(index.clone()); return { g, bvh: new MeshBVH(g) }; }
function firstHit(list, ray, far, skip) {
  let best = null;
  for (const x of list) { if (x === skip) continue; const h = x.bvh.raycastFirst(ray, THREE.DoubleSide, 0, far); if (h && (!best || h.distance < best.distance)) best = { ...h, part: x }; }
  return best;
}

// bone-axis point under a body vertex: the projection onto its dominant bone segment
function axisPoint(F, bi, p) {
  const n = F.boneName[bi], c = FG.CHILD[n]; if (!c) return wp(F.bones[n]);
  const a = wp(F.mesh.skeleton.bones[bi]), b = wp(F.bones[c]), ab = b.clone().sub(a); const t = THREE.MathUtils.clamp(p.clone().sub(a).dot(ab) / ab.lengthSq(), 0, 1); return a.addScaledVector(ab, t);
}

// mask: a body vertex is hidden when cloth lies in front of it along its normal and it is more than KEEP from that
// cloth's open edge (hem, cuff, collar). Triangles with all three corners hidden are not drawn.
function mask(F, B, parts) {
  // round 4 fix 3: a part with a pose's corrective shape (the bell, which falls back off the forearm with the arms up)
  // hides no skin, since in that pose the skin under it is seen
  const list = parts.filter(pt => !pt.uncovers).map(pt => { const x = bvhOf(Float32Array.from(pt.world), pt.geo.index); x.pt = pt; return x; });
  const hid = new Uint8Array(B.count), cov = new Float32Array(B.count).fill(-1), ray = new THREE.Ray(), ok = new Set(CHECKED.concat(['ankleL', 'ankleR', 'ballL', 'ballR']).map(n => F.boneName.indexOf(n)));
  const legHid = new Uint8Array(B.count), legB = new Set(['hipL', 'hipR', 'kneeL', 'kneeR'].map(n => F.boneName.indexOf(n)));
  for (let i = 0; i < B.count; i++) { if (F.rep[i] !== i || !ok.has(F.dom[i])) continue;
    ray.origin.set(B.P[i * 3], B.P[i * 3 + 1], B.P[i * 3 + 2]); ray.direction.set(B.N[i * 3], B.N[i * 3 + 1], B.N[i * 3 + 2]); ray.origin.addScaledVector(ray.direction, 0.001);
    const h = firstHit(list, ray, 0.3); if (!h) continue;
    if (legB.has(F.dom[i])) legHid[i] = 1; // shells round 4 fix 4: any cloth over a thigh or shin, however near its hem
    const e = h.part.pt.edge, f = h.face; const ed = Math.min(e[f.a], e[f.b], e[f.c]); if (h.distance < 0.04) cov[i] = ed; if (ed < KEEP) continue; hid[i] = 1; }
  // shells round 3: skin kept drawn under cloth (within KEEP of an opening) is drawn SINK under the skin's own surface,
  // eased in from 3 to 7 cm off the opening, so skin near the opening stays where it is and is seen as it was. Under the
  // arm this is the margin the shell needs when the arm is raised (round 2: the armpit skin came through, 11 and 14).
  sinkCovered(F, B, hid, cov);
  const I = F.idx0.array, keep = []; let gone = 0;
  for (let t = 0; t < I.length; t += 3) { if (hid[F.rep[I[t]]] && hid[F.rep[I[t + 1]]] && hid[F.rep[I[t + 2]]]) { gone++; continue; } keep.push(I[t], I[t + 1], I[t + 2]); }
  F.mesh.geometry.setIndex(keep); F.hidden = hid;
  // shells round 4 fix 4 (his note on cult-shells-look-5: "we don't render legs in movement that can't be seen by the
  // players, to solve for collisions"): the index with every covered thigh and shin triangle left out, kept for a pose in motion
  const keepM = []; for (let t = 0; t < keep.length; t += 3) if (!(legHid[F.rep[keep[t]]] && legHid[F.rep[keep[t + 1]]] && legHid[F.rep[keep[t + 2]]])) keepM.push(keep[t], keep[t + 1], keep[t + 2]);
  F.indexStill = keep; F.indexMoving = keepM;
  return { hiddenTris: gone, drawnTris: keep.length / 3, sunk: F.sunk || 0 };
}

const SINK = 0.008;
function sinkCovered(F, B, hid, cov) {
  const G = F.mesh.geometry, P = G.attributes.position, SI = G.attributes.skinIndex, SW = G.attributes.skinWeight, sk = F.mesh.skeleton, BM = F.mesh.bindMatrix;
  sk.update(); const bm = sk.bones.map((b, i) => new THREE.Matrix4().multiplyMatrices(b.matrixWorld, sk.boneInverses[i])), M = new THREE.Matrix4(), N3 = new THREE.Matrix3(), d = V();
  const k = F.stature / 1.75, amt = new Float32Array(B.count); let n = 0;
  for (let i = 0; i < B.count; i++) { const r = F.rep[i]; if (hid[r] || cov[r] < 0) continue; amt[i] = SINK * k * THREE.MathUtils.smoothstep(cov[r], 0.03 * k, 0.07 * k); }
  for (let i = 0; i < P.count; i++) { const a = amt[F.rep[i]]; if (!(a > 0)) continue; M.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    for (let j = 0; j < 4; j++) { const w = SW.getComponent(i, j); if (w <= 0) continue; const e = bm[SI.getComponent(i, j)].elements; for (let q = 0; q < 16; q++) M.elements[q] += e[q] * w; }
    M.multiply(BM); N3.setFromMatrix4(M.invert()); const r = F.rep[i]; d.set(-B.N[r * 3], -B.N[r * 3 + 1], -B.N[r * 3 + 2]).multiplyScalar(a).applyMatrix3(N3);
    P.setXYZ(i, P.getX(i) + d.x, P.getY(i) + d.y, P.getZ(i) + d.z); n++; }
  P.needsUpdate = true; F.sunk = n;
}

// pokes at the current pose, by rays (rule 8): (1) drawn body skin that lies outside cloth: a ray from the bone axis to
// the skin meets cloth first; (2) a garment of an inner layer outside a garment of an outer layer, the same way;
// (3) bare: drawn torso or upper-arm skin above the hem with no cloth in front along its normal (a hole or gap).
export function pokes(F, parts, label) {
  const B = FG.posed(F), wl = parts.map(pt => { const x = bvhOf(partWorld(pt), pt.geo.index); x.pt = pt; return x; });
  const ray = new THREE.Ray(), ok = new Set(CHECKED.map(n => F.boneName.indexOf(n))), drawn = new Uint8Array(B.count), I = F.mesh.geometry.index.array;
  for (let t = 0; t < I.length; t++) drawn[F.rep[I[t]]] = 1;
  let body = 0, bare = 0, layer = 0; const where = {}, at = [];
  const robeHem = Math.min(...parts.filter(p => p.name === 'robe').map(p => { let lo = 9; for (let i = 1; i < p.world.length; i += 3) lo = Math.min(lo, p.world[i]); return lo; }), 9);
  const topCut = wp(F.bones.neck).y - 0.02;
  // round 2 finish of B and C: the skin in the robe's V (his note on cult-dir-b-look-1: "we should see the skin where the
  // robe crosses") is meant to show, so it is not counted bare: front-facing skin within 9 cm of the midline, less than 26 cm
  // below the neck base (the V's cross sits 19 to 22 cm down). Open edges are kept the same way (KEEP).
  const nk = wp(F.bones.neck), sideV = wp(F.bones.clavL).sub(wp(F.bones.clavR)).setY(0).normalize(), fwd = V().crossVectors(sideV, V(0, 1, 0));
  const inV = (p, i) => B.N[i * 3] * fwd.x + B.N[i * 3 + 2] * fwd.z > 0.5 && Math.abs(p.clone().sub(nk).dot(sideV)) < 0.09 && p.y > topCut - 0.26; // in the body's own frame, so it holds through the turn
  for (let i = 0; i < B.count; i++) { if (F.rep[i] !== i || !drawn[i] || !ok.has(F.dom[i])) continue;
    const p = V(B.P[i * 3], B.P[i * 3 + 1], B.P[i * 3 + 2]), o = axisPoint(F, F.dom[i], p), d = p.clone().sub(o), L = d.length(); if (L < 1e-4) continue;
    ray.origin.copy(o); ray.direction.copy(d).divideScalar(L); const h = firstHit(wl, ray, L - 0.002);
    // cloth inward of the skin is a poke only when no cloth lies outward of it too (cloth buried in the body is unseen)
    // and only when that cloth is within 6 cm under the skin: a sleeve root buried deep in the shoulder is not a poke
    let out = null; if (h && L - h.distance > 0.06) continue; if (h) { ray.origin.copy(p); out = firstHit(wl, ray, 0.3); }
    if (h && !out) { body++; const n = F.boneName[F.dom[i]]; where[n] = (where[n] || 0) + 1; if (at.length < 12) at.push([n, +p.x.toFixed(3), +p.y.toFixed(3), +p.z.toFixed(3), h.part.pt.name]); continue; }
    const nb = F.boneName[F.dom[i]];
    if (/^(hips|spine|clav|shoulder)/.test(nb) && p.y > robeHem + KEEP && p.y < topCut && B.N[i * 3 + 1] > -0.5 && !inV(p, i)) { /* skin facing the floor inside a skirt is not seen */ ray.origin.copy(p); ray.direction.set(B.N[i * 3], B.N[i * 3 + 1], B.N[i * 3 + 2]); if (!firstHit(wl, ray, 0.3)) { bare++; where['bare:' + nb] = (where['bare:' + nb] || 0) + 1; if (at.length < 12) at.push(['bare:' + nb, +p.x.toFixed(3), +p.y.toFixed(3), +p.z.toFixed(3), +B.N[i * 3].toFixed(2), +B.N[i * 3 + 1].toFixed(2), +B.N[i * 3 + 2].toFixed(2)]); } }
  }
  // garments against outer layers
  // per region: a sleeve is held against what covers the arm (the cape), a body piece against body pieces, never a
  // sleeve hanging beside the waist against the sash (that is cloth beside cloth, not one layer through another)
  const armB = new Set(['shoulderL', 'shoulderR', 'elbowL', 'elbowR', 'foreSwingL', 'foreSwingR'].map(n => F.boneName.indexOf(n)));
  for (const x of wl) { if (x.pt.layer >= 7) continue; const outerAll = wl.filter(y => y.pt.layer > x.pt.layer && y.pt.layer < 7); if (!outerAll.length) continue;
    const outerArm = outerAll.filter(y => /^(cape|outer-sleeve)/.test(y.pt.name)), outerBody = outerAll.filter(y => !/sleeve/.test(y.pt.name));
    const P = x.g.attributes.position, SI = x.pt.geo.attributes.skinIndex, SW = x.pt.geo.attributes.skinWeight;
    for (let i = 0; i < P.count; i += 2) { const p = V().fromBufferAttribute(P, i); let bi = SI.getComponent(i, 0), bw = SW.getComponent(i, 0); for (let j = 1; j < 4; j++) if (SW.getComponent(i, j) > bw) { bw = SW.getComponent(i, j); bi = SI.getComponent(i, j); }
      if (!ok.has(bi) || p.y > topCut + 0.02) continue; // above the neck base a layered collar is meant to show
      const outer = armB.has(bi) ? outerArm : outerBody; if (!outer.length) continue;
      const o = axisPoint(F, bi, p), d = p.clone().sub(o), L = d.length(); if (L < 1e-4) continue;
      ray.origin.copy(o); ray.direction.copy(d).divideScalar(L); const h = firstHit(outer, ray, L - 0.002);
      if (h) { ray.origin.copy(p); if (firstHit(/sleeve|cuff/.test(x.pt.name) ? outer.concat(outerArm) : outer, ray, 0.3)) continue; } // round 6: a T-cut sleeve's shoulder is covered by the outer sleeve over it
      if (h) { layer++; const k = x.pt.name + '>' + h.part.pt.name; where[k] = (where[k] || 0) + 1; } } }
  return { pose: label, bodyPoke: body, layerPoke: layer, bare, hair: hairPokes(F, parts, wl), acc: accPokes(F, parts, wl), where, at };
}

// accessories round 2 (rule 5): an accessory point is a poke when it lies inside the robe, the skirt, a bell sleeve, the
// outer or the cape: a ray from the spine's axis out through the point leaves through that cloth within 5 cm, the face
// turned away from the ray (as hairPokes). The sash is left out on purpose: the cords and the whisk's handle tuck under it.
// `near` counts accessory points closer than 8 mm to that cloth's surface (rule 5's stand-off), points within 3 cm of
// the sash band left out, since the knot and the tails' tops rest on it.
const ACC = /^(sash-(knot|tail|pendant)|whisk-|prop-)/, CLOTH = /^(robe|robe-shell|underwrap|bell[LR]|outer|outer-.*|cape|innerrobe)$/;
function accPokes(F, parts, wl) {
  const cloth = wl.filter(x => CLOTH.test(x.pt.name)), sash = wl.filter(x => x.pt.name === 'sash'), names = ['hips', 'spine01', 'spine', 'spine03', 'neck'];
  const ch = names.map(n => wp(F.bones[n])); ch.unshift(ch[0].clone().add(V(0, -0.6, 0)));
  const ray = new THREE.Ray(), p = V(), tri = new THREE.Triangle(), nrm = V(), hit = {}; let n = 0, pts = 0, near = 0; const where = {}, nearAt = {};
  for (const x of wl) { if (!ACC.test(x.pt.name)) continue; const P = x.g.attributes.position;
    for (let i = 0; i < P.count; i++) { p.fromBufferAttribute(P, i); let o = null, bd = 9;
      for (let j = 0; j < ch.length - 1; j++) { const a = ch[j], ab = ch[j + 1].clone().sub(a), t = THREE.MathUtils.clamp(p.clone().sub(a).dot(ab) / ab.lengthSq(), 0, 1), q = a.clone().addScaledVector(ab, t), d = q.distanceTo(p); if (d < bd) { bd = d; o = q; } }
      if (bd < 1e-4) continue; pts++; ray.origin.copy(p); ray.direction.copy(p).sub(o).setY(0).normalize();
      const h = firstHit(cloth, ray, 0.05);
      if (h) { const g = h.part.g.attributes.position; tri.setFromAttributeAndIndices(g, h.face.a, h.face.b, h.face.c); tri.getNormal(nrm);
        if (nrm.dot(ray.direction) > 0) { n++; const k = x.pt.name + '>' + h.part.pt.name; where[k] = (where[k] || 0) + 1; continue; } }
      let nearSash = false; for (const s of sash) { const c = s.bvh.closestPointToPoint(p, hit, 0, 0.03); if (c) { nearSash = true; break; } } if (nearSash) continue;
      for (const c of cloth) { const q = c.bvh.closestPointToPoint(p, hit, 0, 0.008); if (q) { near++; nearAt[x.pt.name] = (nearAt[x.pt.name] || 0) + 1; break; } } } }
  return { points: pts, inside: n, near, where, nearAt };
}

// shells round 2: hair against the clothes. A hair point is a poke when it lies inside cloth: a ray from the spine's
// axis (hips to the crown) out through the hair point leaves through a cloth face within 5 cm (the face turns away from
// the ray, so the point is on the inner side of that cloth). Cloth beside the hair with a gap, such as a raised sleeve
// by the head, faces the ray and is not counted.
function hairPokes(F, parts, wl) {
  const cloth = wl.filter(x => !/^hair/.test(x.pt.name)), names = ['hips', 'spine01', 'spine', 'spine03', 'neck', 'head'];
  const ch = names.map(n => wp(F.bones[n])); ch.push(ch[ch.length - 1].clone().add(V(0, 0.2, 0)));
  const ray = new THREE.Ray(), p = V(), tri = new THREE.Triangle(), nrm = V(); let n = 0, pts = 0; const where = {};
  for (const x of wl) { if (!/^hair/.test(x.pt.name)) continue; const P = x.g.attributes.position;
    for (let i = 0; i < P.count; i++) { p.fromBufferAttribute(P, i); let o = null, bd = 9;
      for (let j = 0; j < ch.length - 1; j++) { const a = ch[j], ab = ch[j + 1].clone().sub(a), t = THREE.MathUtils.clamp(p.clone().sub(a).dot(ab) / ab.lengthSq(), 0, 1), q = a.clone().addScaledVector(ab, t), d = q.distanceTo(p); if (d < bd) { bd = d; o = q; } }
      if (bd < 1e-4) continue; pts++; ray.origin.copy(p); ray.direction.copy(p).sub(o).normalize();
      const h = firstHit(cloth, ray, 0.05); if (!h) continue;
      const g = h.part.g.attributes.position; tri.setFromAttributeAndIndices(g, h.face.a, h.face.b, h.face.c); tri.getNormal(nrm);
      if (nrm.dot(ray.direction) <= 0) continue; n++; const k = x.pt.name + '>' + h.part.pt.name; where[k] = (where[k] || 0) + 1; } }
  // and the other way: cloth inside the hair (a closed lobe or braid bead the collar or the back passes through), by the
  // same ray from the spine's axis out through each cloth point above the waist
  const hair = wl.filter(x => /^hair/.test(x.pt.name)); let m = 0; const yW = wp(F.bones.spine01).y;
  for (const x of cloth) { const P = x.g.attributes.position;
    for (let i = 0; i < P.count; i++) { p.fromBufferAttribute(P, i); if (p.y < yW) continue; let o = null, bd = 9;
      for (let j = 0; j < ch.length - 1; j++) { const a = ch[j], ab = ch[j + 1].clone().sub(a), t = THREE.MathUtils.clamp(p.clone().sub(a).dot(ab) / ab.lengthSq(), 0, 1), q = a.clone().addScaledVector(ab, t), d = q.distanceTo(p); if (d < bd) { bd = d; o = q; } }
      if (bd < 1e-4) continue; ray.origin.copy(p); ray.direction.copy(p).sub(o).normalize();
      const h = firstHit(hair, ray, 0.05); if (!h) continue;
      const g = h.part.g.attributes.position; tri.setFromAttributeAndIndices(g, h.face.a, h.face.b, h.face.c); tri.getNormal(nrm);
      if (nrm.dot(ray.direction) <= 0) continue; m++; const k = x.pt.name + '<' + h.part.pt.name; where[k] = (where[k] || 0) + 1; } }
  return { points: pts, inside: n, clothInHair: m, where };
}

// leg capsules (rule 8: capsule pushes off thigh and shin with a soft margin). Radii are measured on the fit pose from
// the leg's own skin; at any other pose the skirt pieces are pushed out of them after skinning, the way a game does it
// per frame. The stand pose is the fit pose, so nothing moves there.
// round 5 finish: the leg's own outline, not a round capsule. Round 4 kept one radius per 2 cm (the farthest skin from
// the bone, so the buttock's depth all the way round) and read it in steps; in a stride that pushed the skirt out round
// each thigh (hip fullness) in 2 cm terraces (the horizontal ripples on the back). Now each segment (thigh, shin) keeps a
// radius per 2 cm and per 15 degrees about the bone, in the bone's own frame, so it turns with the leg; it is smoothed
// and read with interpolation, and the cloth is pushed out only where that leg actually is.
const NA = 24, NS = 30, DS = 0.02;
function legProfile(F, B) {
  const out = {};
  for (const s of ['L', 'R']) { out[s] = [['hip' + s, 'knee' + s], ['knee' + s, 'ankle' + s]].map(([n0, n1]) => {
    const bone = F.bones[n0]; bone.updateWorldMatrix(true, false); const inv = bone.matrixWorld.clone().invert();
    const ax = wp(F.bones[n1]).applyMatrix4(inv), len = ax.length(); ax.normalize();
    const u = Math.abs(ax.x) < 0.9 ? V(1, 0, 0) : V(0, 1, 0); u.sub(ax.clone().multiplyScalar(u.dot(ax))).normalize(); const v = ax.clone().cross(u);
    const bi = F.boneName.indexOf(n0), R = new Float32Array(NS * NA), p = V();
    for (let i = 0; i < B.count; i++) { if (F.dom[i] !== bi) continue; p.set(B.P[i * 3], B.P[i * 3 + 1], B.P[i * 3 + 2]).applyMatrix4(inv);
      const t = p.dot(ax); if (t < -0.02 || t > len + 0.02) continue; const a = p.dot(u), b = p.dot(v), d = Math.hypot(a, b);
      const ks = Math.max(0, Math.min(NS - 1, Math.floor(Math.max(0, t) / DS))), ka = ((Math.round(Math.atan2(b, a) / (2 * Math.PI) * NA) % NA) + NA) % NA;
      R[ks * NA + ka] = Math.max(R[ks * NA + ka], d); }
    for (let pass = 0; pass < 2; pass++) for (let k = 0; k < NS * NA; k++) if (!R[k]) { const ks = (k / NA) | 0, ka = k % NA; // fill holes from neighbours
      let m = 0; for (const [ds, da] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const s2 = ks + ds; if (s2 < 0 || s2 >= NS) continue; m = Math.max(m, R[s2 * NA + (ka + da + NA) % NA]); } R[k] = m; }
    const S = new Float32Array(NS * NA); // smooth: 3 along the bone, 3 round it (the max of a 2 cm bin is noisy)
    for (let ks = 0; ks < NS; ks++) for (let ka = 0; ka < NA; ka++) { let m = 0, n = 0; for (let ds = -1; ds <= 1; ds++) for (let da = -1; da <= 1; da++) { const s2 = ks + ds; if (s2 < 0 || s2 >= NS) continue; m += R[s2 * NA + (ka + da + NA) % NA]; n++; } S[ks * NA + ka] = m / n; }
    return { bone, len, ax, u, v, R: S }; }); }
  return out;
}
const lq = V(), lm = new THREE.Matrix4();
function legOut(segs, p) { // -> {o, d, r} for the segment nearest p: the bone point, the distance from it, the leg's radius that way
  let best = null;
  for (const g of segs) { lm.copy(g.bone.matrixWorld).invert(); lq.copy(p).applyMatrix4(lm);
    const t = Math.max(0, Math.min(g.len, lq.dot(g.ax))), a = lq.dot(g.u), b = lq.dot(g.v), d = Math.hypot(a, b, lq.dot(g.ax) - t);
    if (best && d >= best.d) continue;
    const fs = Math.min(NS - 1.001, t / DS - 0.5 < 0 ? 0 : t / DS - 0.5), fa = (Math.atan2(b, a) / (2 * Math.PI) * NA + NA) % NA;
    const s0 = Math.floor(fs), a0 = Math.floor(fa) % NA, a1 = (a0 + 1) % NA, ws = fs - s0, wa = fa - Math.floor(fa), s1 = Math.min(NS - 1, s0 + 1), R = g.R;
    const r = (R[s0 * NA + a0] * (1 - wa) + R[s0 * NA + a1] * wa) * (1 - ws) + (R[s1 * NA + a0] * (1 - wa) + R[s1 * NA + a1] * wa) * ws;
    best = { o: g.ax.clone().multiplyScalar(t).applyMatrix4(g.bone.matrixWorld), d, r }; }
  return best;
}
// push the points of one part off both legs (rule 8); m is the part's clearance off the skin
function pushLegs(X, pt, W, m) {
  const F = X.F, p = V(); let moved = 0; const W0 = Float32Array.from(W);
  for (const s of ['L', 'R']) for (let i = 0; i < W.length / 3; i++) { p.set(W[i * 3], W[i * 3 + 1], W[i * 3 + 2]); const q = legOut(X.legR[s], p); const r = q.r + m * F.stature / 1.75;
    const ramp = THREE.MathUtils.smoothstep(X.yHip - pt.world[i * 3 + 1], 0.04, 0.16); // the waist and sash line stay put
    if (q.d < r && q.d > 1e-5 && ramp > 0) { p.sub(q.o).multiplyScalar(1 + (r / q.d - 1) * ramp).add(q.o); W[i * 3] = p.x; W[i * 3 + 1] = p.y; W[i * 3 + 2] = p.z; moved++; } }
  // a loft (rows of nT points) does not take the push point by point: a thigh coming forward would raise a ledge where
  // the push fades in. Each column takes the strongest nearby push, falling off over 6 rows and 2 columns, so the
  // cloth tents from the hip over the thigh and down, as a skirt does in a stride (outward only, so no new pokes)
  const nT = pt.geo.userData.grid; if (!nT || !moved) return moved;
  const rows = W.length / 3 / nT, D = new Float32Array(W.length), mag = new Float32Array(rows * nT);
  for (let i = 0; i < rows * nT; i++) { for (let c = 0; c < 3; c++) D[i * 3 + c] = W[i * 3 + c] - W0[i * 3 + c]; mag[i] = Math.hypot(D[i * 3], D[i * 3 + 1], D[i * 3 + 2]); }
  for (let r = 0; r < rows; r++) for (let t = 0; t < nT; t++) { const i = r * nT + t; let best = mag[i], bj = i, bf = 1;
    for (let dr = -6; dr <= 6; dr++) for (let dt = -2; dt <= 2; dt++) { const r2 = r + dr; if (r2 < 0 || r2 >= rows) continue; const j = r2 * nT + ((t + dt) % nT + nT) % nT;
      const f = (1 - Math.abs(dr) / 7) * (1 - Math.abs(dt) / 3); if (mag[j] * f > best) { best = mag[j] * f; bj = j; bf = f; } }
    if (bj !== i) for (let c = 0; c < 3; c++) W[i * 3 + c] = W0[i * 3 + c] + D[bj * 3 + c] * bf; }
  return moved;
}
function onChain(ch, p) { let best = null, s0 = 0; for (let i = 0; i < ch.length - 1; i++) { const a = ch[i], ab = ch[i + 1].clone().sub(a), L = ab.length(); const t = THREE.MathUtils.clamp(p.clone().sub(a).dot(ab) / (L * L), 0, 1); const o = a.clone().addScaledVector(ab, t), d = p.distanceTo(o); if (!best || d < best.d) best = { s: s0 + t * L, o, d }; s0 += L; } return best; }
const PUSH = {}; // shells round: no leg push, no settle; the skirt is a rigid piece skinned to the pelvis and thighs (his ruling 2026-11-02)
// the legs under cloth are not drawn while the figure moves (a stride or a raise), so they cannot poke through it;
// at the stand pose, the fit pose, they are drawn as the mask left them
export function legsInMotion(X, moving) { const F = X.F; if (!F.indexMoving) return; F.mesh.geometry.setIndex(moving ? F.indexMoving : F.indexStill); F.legsHidden = !!moving;
  // fix 5 (his B on cult-shells-look-6: "I still see the thighs peeking through in both images while walking"): the trousers'
  // own thighs are cloth under cloth, so the part of them inside the robe's skirt (rest height above the hem + 6 cm) is not drawn either
  // the skirt's hem at this pose: its rim points (aEdgeH about 0), world positions, then each trouser point is hidden when it
  // lies above the hem line of the rim point nearest it across the floor, and is not drawn in motion, since the skirt covers it
  const rim = []; if (moving) for (const rp of X.parts) { if (rp.name !== 'robe') continue; const W = partWorld(rp), E = rp.geo.attributes.aEdgeH; for (let i = 0; i < E.count; i++) if (E.getX(i) < 0.004) rim.push(W[i * 3], W[i * 3 + 1], W[i * 3 + 2]); }
  for (const pt of X.parts) { if (!/^trousers/.test(pt.name) || (moving && !rim.length)) continue; const g = pt.geo; if (!pt.indexStill) pt.indexStill = g.index.array.slice();
    const I = pt.indexStill, keep = [], hid = moving ? new Uint8Array(g.attributes.position.count) : null;
    if (moving) { const W = partWorld(pt), m = 0.05 * (F.stature / 1.75); /* fix 5b (his image: too aggressive, jagged cuts): hidden only above the HIGHEST hem point within 30 cm, plus 5 cm, so every cut edge is under cloth */ for (let i = 0; i < hid.length; i++) { let by = -1e9; for (let j = 0; j < rim.length; j += 3) { const d = (W[i * 3] - rim[j]) ** 2 + (W[i * 3 + 2] - rim[j + 2]) ** 2; if (d < 0.3 * 0.3 && rim[j + 1] > by) by = rim[j + 1]; } if (by > -1e8 && W[i * 3 + 1] > by + m) hid[i] = 1; } }
    for (let t = 0; t < I.length; t += 3) if (!moving || !(hid[I[t]] && hid[I[t + 1]] && hid[I[t + 2]])) keep.push(I[t], I[t + 1], I[t + 2]);
    g.setIndex(keep); } }
export function settle(X) {
  legsInMotion(X, X.F.poseName !== 'stand');
  const F = X.F; if (F.poseName === 'stand') { for (const pt of X.parts) { pt.settled = null; pt.mesh.visible = pt.back.visible = true; if (pt.static) pt.static.visible = false; } return 0; }
  let moved = 0;
  for (const pt of X.parts) { const m = PUSH[pt.name]; if (m == null) continue; pt.settled = null; const W = partWorld(pt), p = V();
    moved += pushLegs(X, pt, W, m);
    pt.settled = W;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(W, 3)); g.setAttribute('color', pt.geo.attributes.color); g.setIndex(pt.geo.index); g.computeVertexNormals();
    if (pt.static) { pt.static.geometry.dispose(); pt.static.geometry = g; pt.staticB.geometry = g; } else { pt.static = new THREE.Mesh(g, pt.mesh.material); pt.staticB = new THREE.Mesh(g, pt.back.material); pt.static.frustumCulled = pt.staticB.frustumCulled = false; X.scene.add(pt.static, pt.staticB); }
    pt.static.visible = pt.staticB.visible = true; pt.mesh.visible = pt.back.visible = false; }
  return moved;
}

// round 5 (motion.js): the same leg push on whatever each part's settled points are (skinned, or skinned plus drag), and
// any part with settled points drawn from them
export function legPush(X) {
  const F = X.F, p = V(); let moved = 0;
  for (const pt of X.parts) { const m = PUSH[pt.name]; if (m == null) continue; const W = pt.settled || (pt.settled = Float32Array.from(partWorld(pt)));
    moved += pushLegs(X, pt, W, m); }
  return moved;
}
export function showSettled(X) {
  for (const pt of X.parts) { const W = pt.settled; if (!W) { pt.mesh.visible = pt.back.visible = true; if (pt.static) pt.static.visible = pt.staticB.visible = false; continue; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(W, 3)); g.setAttribute('color', pt.geo.attributes.color); g.setIndex(pt.geo.index); g.computeVertexNormals();
    if (pt.static) { pt.static.geometry.dispose(); pt.static.geometry = g; pt.staticB.geometry = g; } else { pt.static = new THREE.Mesh(g, pt.mesh.material); pt.staticB = new THREE.Mesh(g, pt.back.material); pt.static.frustumCulled = pt.staticB.frustumCulled = false; X.scene.add(pt.static, pt.staticB); }
    pt.static.visible = pt.staticB.visible = true; pt.mesh.visible = pt.back.visible = false; }
}
// heaven round 19: showSettled for a live page. Each part keeps one geometry and its position attribute is rewritten in
// place each frame (showSettled builds a new BufferGeometry per part per frame, which a 60 fps page cannot afford)
export function showLive(X) {
  for (const pt of X.parts) { const W = pt.settled; if (!W) { pt.mesh.visible = pt.back.visible = true; if (pt.static) pt.static.visible = pt.staticB.visible = false; continue; }
    if (!pt.static || !pt.liveGeo) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(W.length), 3)); g.setAttribute('color', pt.geo.attributes.color); g.setIndex(pt.geo.index);
      if (pt.static) { pt.static.geometry.dispose(); pt.static.geometry = g; pt.staticB.geometry = g; } else { pt.static = new THREE.Mesh(g, pt.mesh.material); pt.staticB = new THREE.Mesh(g, pt.back.material); pt.static.frustumCulled = pt.staticB.frustumCulled = false; X.scene.add(pt.static, pt.staticB); }
      pt.static.castShadow = true; pt.liveGeo = g; }
    const a = pt.liveGeo.attributes.position; a.array.set(W); a.needsUpdate = true; pt.liveGeo.setIndex(pt.geo.index); pt.liveGeo.computeVertexNormals();
    pt.static.visible = pt.staticB.visible = true; pt.mesh.visible = pt.back.visible = false; }
}
// a camera that follows the figure's root (a game camera), from a fixed world direction
export function shootAt(X, dir, W, H, { ty = 0.95, dist = 5.2, fov = 22 } = {}) {
  const F = X.F, r = F.root.position, tgt = V(r.x, ty, r.z), d = { side: F.fr.l.clone(), q: F.fr.f.clone().multiplyScalar(-0.55).addScaledVector(F.fr.l, 0.85).normalize(), front: F.fr.f.clone() }[dir];
  const cam = new THREE.PerspectiveCamera(fov, W / H, 0.05, 50); cam.position.copy(tgt).addScaledVector(d, dist).add(V(0, 0.15, 0)); cam.lookAt(tgt); cam.updateMatrixWorld(true);
  const renderer = R_(); renderer.setSize(W, H); renderer.setClearColor(BG, 1); F.root.updateMatrixWorld(true); renderer.render(X.scene, cam); return renderer.domElement.toDataURL('image/jpeg', 0.9);
}

export function camera(view, W, H, F, opt = {}) {
  const f = F.fr.f, l = F.fr.l; const dir = { front: f, back: f.clone().negate(), side: l.clone(), q: f.clone().multiplyScalar(0.8).addScaledVector(l, 0.6).normalize(), qr: f.clone().multiplyScalar(0.8).addScaledVector(l, -0.6).normalize(), low: f.clone().multiplyScalar(0.85).addScaledVector(l, 0.5).normalize() }[view];
  const tgt = V(0, opt.ty ?? 0.98, 0), dist = opt.dist ?? 6.4, fov = opt.fov ?? 20;
  // accessories round 2: `low` is his screenshot's angle (2026-11-04 01:17Z), a three-quarter camera near knee height looking up
  const cam = new THREE.PerspectiveCamera(fov, W / H, 0.05, 50); cam.position.copy(tgt).addScaledVector(dir, dist).add(V(0, view === 'low' ? -(opt.down ?? 0.75) : 0.2, 0)); cam.lookAt(tgt); cam.updateMatrixWorld(true); return cam;
}

export async function build(mix, reg) {
  const F = await FG.loadFigure(mix, reg);
  const scene = new THREE.Scene(); scene.background = BG; lights(scene); scene.add(F.root);
  FG.pose(F, 'stand'); const B = FG.posed(F); const C = GA.context(F, B);
  const parts = GA.dress(C, reg, mix.outfit);
  const m = mask(F, B, parts); const legR = legProfile(F, B);
  const info = { mix, vSym: C.vSym, bake: { ...Object.fromEntries(parts.filter(p => p.bake).map(p => [p.name, p.bake])), ...(C.tailBake ? { "sash-tails": C.tailBake } : {}) }, stature: F.stature, parts: [...new Set(parts.map(p => p.name.replace(/[LR]$/, '')))], tris: parts.reduce((a, p) => a + p.geo.index.count / 3, 0), partTris: parts.reduce((a, p) => { const k = p.name.replace(/[LR]$/, ''); a[k] = (a[k] || 0) + p.geo.index.count / 3; return a; }, {}), ...m };
  info.accTris = {}; for (const p of parts) if (ACC.test(p.name)) info.accTris[p.name] = (info.accTris[p.name] || 0) + p.geo.index.count / 3; // accessories round 2: rule 7's budget, per part name (a name may cover several pieces)
  return { F, scene, parts, info, legR, yHip: C.yHip };
}
export function shoot(X, view, W, H, opt) { const renderer = R_(); renderer.setSize(W, H); renderer.setClearColor(BG, 1); const cam = camera(view, W, H, X.F, opt); X.F.root.updateMatrixWorld(true); renderer.render(X.scene, cam); return renderer.domElement.toDataURL('image/png'); }
export function dispose(X) { X.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); }); }
