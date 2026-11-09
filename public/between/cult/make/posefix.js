// shells round 4, fix 3 (his B on cult-shells-look-4, 2026-11-03): her bell sleeves with the arms raised.
// The bell is rigid on the forearm (round 2), which is right while the arm hangs: the mouth hangs from the forearm. With
// the arms over the head that same rigid cone stood straight up past the hands, two white cones. A modeller fixes this
// the way his ruling of 2026-11-02 says, after the model is on the rig: a corrective shape for the pose. Here the bell
// gets one morph target, the sleeve as it falls when the forearm points up: the cloth below the elbow drops back down
// the upper arm toward the shoulder, gathered in soft folds, its fullness turned away from the head, and the forearm
// shows. The shape is modelled in the raised pose itself (world down, the real head), then carried into bind space with
// that pose's own skin transforms, so skinning at the raised pose lands it exactly. Its weight follows the forearm:
// 0 while the forearm points down or out, 1 once it points up (smoothstep on the forearm's height, 0.15 to 0.85).
import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { pose, posed } from './figure.js';
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const wp = b => b.getWorldPosition(V());
const sstep = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// per vertex, the matrix that carries a bind-space point to the world at the current pose (three's attached skinning)
function skinXform(mesh) {
  const g = mesh.geometry, sk = mesh.skeleton, SI = g.attributes.skinIndex, SW = g.attributes.skinWeight; mesh.updateMatrixWorld(true);
  const bm = sk.bones.map((b, i) => new THREE.Matrix4().multiplyMatrices(b.matrixWorld, sk.boneInverses[i]));
  const pre = new THREE.Matrix4().multiplyMatrices(mesh.matrixWorld, mesh.bindMatrixInverse), M = new THREE.Matrix4();
  return i => { M.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    for (let j = 0; j < 4; j++) { const w = SW.getComponent(i, j); if (w <= 0) continue; const e = bm[SI.getComponent(i, j)].elements; for (let q = 0; q < 16; q++) M.elements[q] += e[q] * w; }
    return new THREE.Matrix4().multiplyMatrices(pre, M).multiply(mesh.bindMatrix); };
}
const saveBones = F => ({ q: Object.fromEntries(Object.entries(F.bones).map(([k, b]) => [k, b.quaternion.clone()])), hp: F.bones.hips.position.clone(), rp: F.root.position.clone(), name: F.poseName });
const loadBones = (F, s) => { for (const k in s.q) F.bones[k].quaternion.copy(s.q[k]); F.bones.hips.position.copy(s.hp); F.root.position.copy(s.rp); F.root.updateMatrixWorld(true); F.mesh.skeleton.update(); F.poseName = s.name; };

// pt: the bell part (skinned, bind-space positions); B: its build (nR, nT rings, s0, s1, r0); s: 'L' or 'R'
export function bellFall(C, pt, B, s) {
  const F = C.F, k = C.k, mesh = pt.mesh, g = mesh.geometry, n = g.attributes.position.count, saved = saveBones(F);
  pose(F, 'raise');
  const e = wp(F.bones['elbow' + s]), w = wp(F.bones['wrist' + s]), head = wp(F.bones.head), ax = w.clone().sub(e).normalize();
  const X = skinXform(mesh), P = g.attributes.position, raised = new Float32Array(n * 3), p = V();
  for (let i = 0; i < n; i++) { p.fromBufferAttribute(P, i).applyMatrix4(X(i)); raised[i * 3] = p.x; raised[i * 3 + 1] = p.y; raised[i * 3 + 2] = p.z; }
  // the attach ring: the bell's top ring where it sits, at the raised pose; the cloth falls from there, world down
  const { nR, nT } = B, L = B.s1 - B.s0, hold = 0.05 * k, rh = Math.ceil(hold / L * nR), top = V(); // the fold: the ring at the hold's end
  for (let t = 0; t < nT; t++) { const i = rh * nT + t; top.add(V(raised[i * 3], raised[i * 3 + 1], raised[i * 3 + 2])); } top.divideScalar(nT);
  const out = V(top.x - head.x, 0, top.z - head.z).normalize(), dn = V(0, -1, 0), fw = V().crossVectors(out, dn).normalize();
  const fall = V(), T = new Float32Array(n * 3);
  for (let ri = 0; ri <= nR; ri++) { const u = ri / nR, a = u * L;
    for (let t = 0; t < nT; t++) { const i = ri * nT + t, th = t / nT * Math.PI * 2; const rp = V(raised[i * 3], raised[i * 3 + 1], raised[i * 3 + 2]);
      if (a <= hold) { T.set([rp.x, rp.y, rp.z], i * 3); continue; } // the top 5 cm stays on the arm as it is
      // below the hold the sleeve folds back on itself and drops down the upper arm, gathered: it drops 0.42 of its length
      // (the rest is taken up in the gathers), its radius grows to about 10 cm, and its centre moves away from the head by
      // most of that growth, so the side toward the head stays close to the arm
      const f = (a - hold) / (L - hold), drop = (a - hold) * 0.42 * (1 + 0.12 * f * Math.sin(2 * th + 1.0) + 0.06 * f * Math.sin(5 * th + 2.0)), r = B.r0 * 1.22 + (0.1 * k - B.r0 * 1.22) * Math.pow(f, 0.7);
      const gather = 1 + 0.10 * Math.sin(9 * th + 3.1 * f) * Math.min(1, f * 3), c = top.clone().addScaledVector(dn, drop).addScaledVector(out, (r - B.r0 * 1.22) * 0.75);
      const q = c.addScaledVector(out, r * gather * Math.cos(th)).addScaledVector(fw, -r * gather * Math.sin(th) * 0.9); // the angle runs the other way: the fold reverses the tube, and the outside must stay the outside
      const mix = sstep(0, 0.06, f); fall.copy(rp).lerp(q, mix); T.set([fall.x, fall.y, fall.z], i * 3); } }
  // world normals of the fallen shape, then both into bind space with this pose's transforms
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(T, 3)); wg.setIndex(g.index.clone()); wg.computeVertexNormals();
  { const N = wg.attributes.normal, nn = V(), o = V(); let flip = 0; for (let i = nT * 3; i < n; i += nT * 4) { nn.fromBufferAttribute(N, i); o.set(T[i * 3], T[i * 3 + 1], T[i * 3 + 2]); flip += nn.dot(V(T[i * 3], T[i * 3 + 1], T[i * 3 + 2]).sub(top).projectOnPlane(dn)) < 0 ? 1 : -1; }
    if (flip > 0) for (let i = 0; i < N.count; i++) N.setXYZ(i, -N.getX(i), -N.getY(i), -N.getZ(i)); }
  const MP = new Float32Array(n * 3), MN = new Float32Array(n * 3), NM = new THREE.Matrix3();
  for (let i = 0; i < n; i++) { const Xi = X(i), Ii = Xi.clone().invert(); p.set(T[i * 3], T[i * 3 + 1], T[i * 3 + 2]).applyMatrix4(Ii); MP.set([p.x, p.y, p.z], i * 3);
    p.fromBufferAttribute(wg.attributes.normal, i).applyMatrix3(NM.getNormalMatrix(Ii)).normalize(); MN.set([p.x, p.y, p.z], i * 3); }
  loadBones(F, saved);
  g.morphAttributes.position = [new THREE.BufferAttribute(MP, 3)]; g.morphAttributes.normal = [new THREE.BufferAttribute(MN, 3)]; g.morphTargetsRelative = false;
  for (const m of [pt.mesh, pt.back]) m.updateMorphTargets();
  const fore = () => { const ew = wp(F.bones['elbow' + s]), ww = wp(F.bones['wrist' + s]); return sstep(0.15, 0.85, ww.sub(ew).normalize().y); };
  pt.poseFix = () => { const v = fore(); for (const m of [pt.mesh, pt.back]) m.morphTargetInfluences[0] = v; return v; };
  pt.mesh.onBeforeRender = pt.back.onBeforeRender = () => pt.poseFix();
  pt.poseFix(); pt.uncovers = true; // the skin under it is seen in that pose, so it hides none (mix.js mask)
  return pt;
}

// shells round 4, fix 3: the robe shell under each raised arm. With both arms over the head the shell, which follows the
// body's own weights, pinched into a soft crease under his arm, and on her the skin behind the armpit came through it in
// four places. The corrective shape, one per side, is modelled at the raised pose: the shell within 15 cm of the shoulder
// joint, and more than 6 cm from an open edge, is smoothed (20 passes, full strength within 7 cm, none past 15), so the cloth spans the hollow as cloth does, then every vertex that lies closer than 9 mm to
// the raised body, or inside it, is set 9 mm out along the body's normal. Each side's weight follows its upper arm
// (smoothstep on its height, 0.2 to 0.9), so standing and stepping are as they were.
export function armpitFix(C, pt) {
  const F = C.F, k = C.k, mesh = pt.mesh, g = mesh.geometry, n = g.attributes.position.count, saved = saveBones(F);
  pose(F, 'raise');
  const B = posed(F), bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(B.P, 3)); bg.setIndex(F.idx0.clone()); const bvh = new MeshBVH(bg), BI = bg.index.array;
  const X = skinXform(mesh), P = g.attributes.position, R = new Float32Array(n * 3), p = V();
  for (let i = 0; i < n; i++) { p.fromBufferAttribute(P, i).applyMatrix4(X(i)); R.set([p.x, p.y, p.z], i * 3); }
  // weld by the fit-pose position, so the smoothing does not open the shell's seams
  const key = new Map(), rep = new Int32Array(n), W0 = pt.world; for (let i = 0; i < n; i++) { const kk = Math.round(W0[i * 3] * 2e4) + ',' + Math.round(W0[i * 3 + 1] * 2e4) + ',' + Math.round(W0[i * 3 + 2] * 2e4); if (!key.has(kk)) key.set(kk, i); rep[i] = key.get(kk); }
  const nb = Array.from({ length: n }, () => new Set()), I = g.index.array;
  for (let t = 0; t < I.length; t += 3) for (let a = 0; a < 3; a++) { const x = rep[I[t + a]], y = rep[I[t + (a + 1) % 3]]; if (x !== y) { nb[x].add(y); nb[y].add(x); } }
  const targets = [], tn = [], drivers = [];
  for (const s of ['L', 'R']) {
    const S = wp(F.bones['shoulder' + s]), w = new Float32Array(n), E = pt.edge; let any = 0;
    for (let i = 0; i < n; i++) if (rep[i] === i) { const d = Math.hypot(R[i * 3] - S.x, R[i * 3 + 1] - S.y, R[i * 3 + 2] - S.z); w[i] = (1 - sstep(0.07 * k, 0.15 * k, d)) * (E ? sstep(0.02 * k, 0.06 * k, E[i]) : 1); if (w[i] > 0) any++; } // not at the neck opening: smoothing an open edge pulls it in
    const Q = Float32Array.from(R), tmp = new Float32Array(n * 3);
    if (any) for (let it = 0; it < 20; it++) { tmp.set(Q);
      for (let i = 0; i < n; i++) { if (rep[i] !== i || !w[i] || !nb[i].size) continue; let ax = 0, ay = 0, az = 0; for (const j of nb[i]) { ax += tmp[j * 3]; ay += tmp[j * 3 + 1]; az += tmp[j * 3 + 2]; } const m = nb[i].size, a = 0.5 * w[i];
        Q[i * 3] += a * (ax / m - tmp[i * 3]); Q[i * 3 + 1] += a * (ay / m - tmp[i * 3 + 1]); Q[i * 3 + 2] += a * (az / m - tmp[i * 3 + 2]); } }
    // out of the raised body: 9 mm along the normal of the nearest body face
    const hit = {}, fa = V(), fb = V(), fc = V(), fn = V(), margin = 0.009 * k;
    for (let i = 0; i < n; i++) { if (rep[i] !== i || !w[i]) continue; p.set(Q[i * 3], Q[i * 3 + 1], Q[i * 3 + 2]);
      if (!bvh.closestPointToPoint(p, hit, 0, 0.05 * k)) continue; const f = hit.faceIndex * 3;
      fa.fromArray(B.P, BI[f] * 3); fb.fromArray(B.P, BI[f + 1] * 3); fc.fromArray(B.P, BI[f + 2] * 3); fn.subVectors(fc, fb).cross(fa.clone().sub(fb)).normalize();
      { const vn = V(B.N[BI[f] * 3], B.N[BI[f] * 3 + 1], B.N[BI[f] * 3 + 2]); if (fn.dot(vn) < 0) fn.negate(); }
      const h = p.clone().sub(hit.point).dot(fn); if (h < margin) { p.copy(hit.point).addScaledVector(fn, margin); Q.set([p.x, p.y, p.z], i * 3); } }
    for (let i = 0; i < n; i++) if (rep[i] !== i) Q.set([Q[rep[i] * 3], Q[rep[i] * 3 + 1], Q[rep[i] * 3 + 2]], i * 3);
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(Q, 3)); wg.setIndex(g.index.clone()); wg.computeVertexNormals();
    const MP = new Float32Array(n * 3), MN = new Float32Array(n * 3), NM = new THREE.Matrix3(), N0 = g.attributes.normal;
    for (let i = 0; i < n; i++) { if (!w[rep[i]]) { MP.set([P.getX(i), P.getY(i), P.getZ(i)], i * 3); MN.set([N0.getX(i), N0.getY(i), N0.getZ(i)], i * 3); continue; }
      const Ii = X(i).invert(); p.set(Q[i * 3], Q[i * 3 + 1], Q[i * 3 + 2]).applyMatrix4(Ii); MP.set([p.x, p.y, p.z], i * 3);
      // the normal: the raised shape's own, faded into the shell's where the weight runs out (no seam in the shading)
      const nr = V().fromBufferAttribute(wg.attributes.normal, i).applyMatrix3(NM.getNormalMatrix(Ii)).normalize(), n0 = V().fromBufferAttribute(N0, i);
      n0.lerp(nr, w[rep[i]]).normalize(); MN.set([n0.x, n0.y, n0.z], i * 3); }
    targets.push(new THREE.BufferAttribute(MP, 3)); tn.push(new THREE.BufferAttribute(MN, 3));
    drivers.push(() => { const a = wp(F.bones['shoulder' + s]), b = wp(F.bones['elbow' + s]); return sstep(0.2, 0.9, b.sub(a).normalize().y); });
  }
  loadBones(F, saved);
  g.morphAttributes.position = targets; g.morphAttributes.normal = tn; g.morphTargetsRelative = false;
  for (const m of [pt.mesh, pt.back]) m.updateMorphTargets();
  pt.poseFix = () => { const v = drivers.map(d => d()); for (const m of [pt.mesh, pt.back]) v.forEach((x, j) => { m.morphTargetInfluences[j] = x; }); return v; };
  pt.mesh.onBeforeRender = pt.back.onBeforeRender = () => pt.poseFix();
  pt.poseFix();
  return pt;
}
