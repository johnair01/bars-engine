// Round 0g: Quaternius Universal Base Characters (CC0) as the robe figure. The bones are renamed onto the 16 names
// ual.js and kit.js drive (plus spine01, spine03, ball, fingers that follow their parents), so the rest of the stage
// reads them as it read Average Dusk. Body colour is the stage's own skin; the source textures are not used.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const wp = b => b.getWorldPosition(V());

// ual.js / kit.js name -> UBC name (step 1 of round 0g; names checked in the glTF skin)
// palm normal in the T-pose bind: world -y, palm down (checked by render: +y curls the fingers backward)
export const PALM_Y = +(new URLSearchParams(globalThis.location?.search || '').get('py') ?? -1);
export const UBC_MAP = {
  hips: 'pelvis', spine01: 'spine_01', spine: 'spine_02', spine03: 'spine_03', neck: 'neck_01', head: 'Head',
  clavL: 'clavicle_l', shoulderL: 'upperarm_l', elbowL: 'lowerarm_l', wristL: 'hand_l', hipL: 'thigh_l', kneeL: 'calf_l', ankleL: 'foot_l', ballL: 'ball_l',
  clavR: 'clavicle_r', shoulderR: 'upperarm_r', elbowR: 'lowerarm_r', wristR: 'hand_r', hipR: 'thigh_r', kneeR: 'calf_r', ankleR: 'foot_r', ballR: 'ball_r',
};

// which: 'ubcm' (Superhero Male) or 'ubcf' (Superhero Female). stature: metres (0 = native size).
export async function loadUBC(which = 'ubcm', { stature = 0 } = {}) {
  const g = await new GLTFLoader().loadAsync(new URL(`../ubc/${which}.json`, import.meta.url).href) /* bars-engine copy: beside this module, not the page */;
  const root = g.scene; root.updateMatrixWorld(true);
  const inv = Object.fromEntries(Object.entries(UBC_MAP).map(([a, b]) => [b, a]));
  const bones = {}, meshes = [];
  root.traverse(o => { if (o.isBone) { if (inv[o.name]) o.name = inv[o.name]; bones[o.name] = o; } if (o.isSkinnedMesh) { meshes.push(o); o.frustumCulled = false; } });
  const mesh = meshes.reduce((a, m) => (m.geometry.attributes.position.count > a.geometry.attributes.position.count ? m : a));
  for (const m of meshes) if (m !== mesh) { m.material = new THREE.MeshStandardMaterial({ color: m.name.startsWith('Eye') && !/brow/i.test(m.name) ? 0x2a211c : 0x1d1714, roughness: 0.6 }); m.userData.noId = true; }
  const info = { body: which, meshes: meshes.map(m => [m.name, m.geometry.attributes.position.count]) };
  // native stature from the bind pose, then optional uniform scale (uniform only: rule 7)
  const sk = mesh.skeleton;
  const rest0 = () => { root.updateMatrixWorld(true); const P = mesh.geometry.attributes.position, v = V(); let lo = 1e9, hi = -1e9; for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); mesh.applyBoneTransform(i, v); v.applyMatrix4(mesh.matrixWorld); lo = Math.min(lo, v.y); hi = Math.max(hi, v.y); } return [lo, hi]; };
  let dev = 0; sk.bones.forEach((b, i) => { const m = b.matrixWorld.clone().multiply(sk.boneInverses[i]); const e = m.elements; for (let k = 0; k < 16; k++) dev = Math.max(dev, Math.abs(e[k] - (k % 5 === 0 ? 1 : 0))); });
  info.bindDev = +dev.toFixed(5); // boneWorld * boneInverse against identity at load: the rest pose is the bind pose
  let [lo, hi] = rest0(); info.nativeStature = +(hi - lo).toFixed(4); info.nativeSole = +lo.toFixed(4);
  if (stature) { root.scale.setScalar(stature / (hi - lo)); [lo, hi] = rest0(); }
  root.position.y -= lo; root.updateMatrixWorld(true);
  info.stature = +(hi - lo).toFixed(4);
  const sideOf = { L: Math.sign(wp(bones.shoulderL).x) || 1 }; sideOf.R = -sideOf.L;
  const geo = mesh.geometry, N = geo.attributes.position.count, si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight;
  // welded representative per vertex (UV seams split vertices)
  const rep = new Int32Array(N), kmap = new Map(), v = V();
  for (let i = 0; i < N; i++) { v.fromBufferAttribute(geo.attributes.position, i); const k = `${Math.round(v.x * 2e3)},${Math.round(v.y * 2e3)},${Math.round(v.z * 2e3)}`; if (!kmap.has(k)) kmap.set(k, i); rep[i] = kmap.get(k); }
  // relaxed hands: the T-pose fingers are flat and splayed; curl each finger joint 18 deg toward the palm (palm faces
  // down in the bind pose) and keep that as the rest, so fingers still only follow their parents
  const curl = +(new URLSearchParams(globalThis.location?.search || '').get('curl') ?? 18) * Math.PI / 180;
  for (const s of ['L', 'R']) { const hand = bones['wrist' + s]; const sfx = '_' + s.toLowerCase();
    const fdir = wp(bones['elbow' + s]).sub(wp(bones['shoulder' + s])).normalize(); const palm = V(0, PALM_Y, 0); const ax = V().crossVectors(fdir, palm).normalize();
    for (const f of ['index', 'middle', 'ring', 'pinky']) for (const j of ['01', '02', '03']) { const b = bones[f + '_' + j + sfx]; if (!b) continue; root.updateMatrixWorld(true);
      const la = ax.clone().applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion()).invert()); b.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(la, curl * (j === '01' ? 0.6 : 1))); }
    // 0g part 2: the bind thumb stands out about 32 deg from the hand axis, splayed like a gun-thumb in the walk; draw it
    // in toward the index (adduction about the palm normal, &tad deg) and bend its two outer joints a little (&tfl)
    const qq = new URLSearchParams(globalThis.location?.search || ''); const tad = +(qq.get('tad') ?? 28) * Math.PI / 180, tfl = +(qq.get('tfl') ?? 12) * Math.PI / 180;
    const t1 = bones['thumb_01' + sfx], hm = bones['middle_01' + sfx];
    if (t1 && tad) { root.updateMatrixWorld(true); const hax = wp(hm).sub(wp(hand)).normalize(); const tdir = () => wp(bones['thumb_03' + sfx]).sub(wp(t1)).normalize();
      const turn = (b, axW, a) => { root.updateMatrixWorld(true); const la = axW.clone().applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize(); b.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(la, a)); root.updateMatrixWorld(true); };
      const a0 = tdir().angleTo(hax); turn(t1, palm, tad); if (tdir().angleTo(hax) > a0) turn(t1, palm, -2 * tad);
      for (const j of ['02', '03']) { const b = bones['thumb_' + j + sfx]; if (!b) continue; const td = tdir(); const fa = V().crossVectors(td, palm).normalize(); turn(b, fa, tfl); } }
    root.updateMatrixWorld(true); }
  // 0g part 2 (3d-math rules 2 and 3): the arms take the source roll, and the forearm's twist against the upper arm
  // is spread along the forearm instead of all at the elbow crease. UBC Standard has no twist bones, so add one per arm:
  // foreSwing, a child of the upper arm at the elbow that takes only the swing of the forearm (its twist about the
  // bone axis removed). Forearm skin near the elbow moves to foreSwing and ramps back to the forearm toward the wrist,
  // so the twist grows from 0 at the elbow to all of it at the wrist (no candy-wrapper at the elbow).
  const TW = +(new URLSearchParams(globalThis.location?.search || '').get('tw') ?? 1); // &tw=0: no twist helper
  const helpers = [];
  if (TW) for (const s of ['L', 'R']) { const el = bones['elbow' + s], sh = bones['shoulder' + s];
    const h = new THREE.Bone(); h.name = 'foreSwing' + s; h.position.copy(el.position); h.quaternion.copy(el.quaternion); h.scale.copy(el.scale); sh.add(h);
    const r0 = el.quaternion.clone(), r0i = r0.clone().invert(), ay = V(0, 1, 0), tq = new THREE.Quaternion();
    h.updateMatrixWorld = function (force) { // swing only: rest * swing(rest^-1 * elbow)
      const dl = r0i.clone().multiply(el.quaternion); const d = dl.y; tq.set(0, d, 0, dl.w); if (tq.lengthSq() < 1e-12) tq.identity(); else tq.normalize();
      this.quaternion.copy(r0).multiply(dl.multiply(tq.invert())); THREE.Bone.prototype.updateMatrixWorld.call(this, force); };
    bones['foreSwing' + s] = h; helpers.push([s, h, sk.bones.indexOf(el), sk.bones.indexOf(bones['wrist' + s])]); }
  if (helpers.length) {
    const nbs = sk.bones.concat(helpers.map(x => x[1])), inv = sk.boneInverses.concat(helpers.map(x => sk.boneInverses[x[2]].clone()));
    const nsk = new THREE.Skeleton(nbs, inv); for (const m of meshes) m.bind(nsk, m.bindMatrix);
    const G = mesh.geometry, P = G.attributes.position, SI = G.attributes.skinIndex, SW = G.attributes.skinWeight, bw = i => new THREE.Matrix4().copy(inv[i]).invert();
    const T0 = +(new URLSearchParams(globalThis.location?.search || '').get('tw0') ?? 0.05), T1 = +(new URLSearchParams(globalThis.location?.search || '').get('tw1') ?? 0.9);
    info.twist = {};
    for (const [s, h, ei, wi] of helpers) { const hi = nbs.indexOf(h); const e = V().setFromMatrixPosition(bw(ei)), w = V().setFromMatrixPosition(bw(wi)), ew = w.clone().sub(e); let moved = 0;
      for (let i = 0; i < P.count; i++) { let js = -1; for (let j = 0; j < 4; j++) if (SI.getComponent(i, j) === ei && SW.getComponent(i, j) > 0) js = j; if (js < 0) continue;
        const p = V().fromBufferAttribute(P, i).applyMatrix4(mesh.bindMatrix); const t = p.sub(e).dot(ew) / ew.lengthSq();
        const u = THREE.MathUtils.clamp((t - T0) / (T1 - T0), 0, 1), f = 1 - u * u * (3 - 2 * u); if (f <= 0) continue;
        const wl = SW.getComponent(i, js), mv = wl * f; if (f >= 1) { SI.setComponent(i, js, hi); moved++; continue; }
        let free = -1; for (let j = 0; j < 4; j++) if (SW.getComponent(i, j) === 0) { free = j; break; }
        if (free < 0) { let mj = -1, mw = 9; for (let j = 0; j < 4; j++) if (j !== js && SW.getComponent(i, j) < mw) { mw = SW.getComponent(i, j); mj = j; } free = mj; SW.setComponent(i, js, SW.getComponent(i, js) + 0); }
        SI.setComponent(i, free, hi); SW.setComponent(i, free, mv); SW.setComponent(i, js, wl - mv);
        let sum = 0; for (let j = 0; j < 4; j++) sum += SW.getComponent(i, j); for (let j = 0; j < 4; j++) SW.setComponent(i, j, SW.getComponent(i, j) / sum); moved++; }
      info.twist[s] = { moved, T0, T1 }; }
    SI.needsUpdate = SW.needsUpdate = true;
  }
  const restQ = {}; for (const k in bones) restQ[k] = bones[k].quaternion.clone();
  const skel = mesh.skeleton, boneName = skel.bones.map(b => b.name), nb = boneName.length;
  const Wd = new Float32Array(N * nb); for (let i = 0; i < N; i++) for (let j = 0; j < 4; j++) Wd[i * nb + si.getComponent(i, j)] += sw.getComponent(i, j); // dense weights (kit.skinGarments)
  const dom = new Int16Array(N); for (let i = 0; i < N; i++) { let b = 0, w = -1; for (let j = 0; j < 4; j++) if (sw.getComponent(i, j) > w) { w = sw.getComponent(i, j); b = si.getComponent(i, j); } dom[i] = b; }
  for (const s of ['L', 'R']) { const h = boneName.indexOf('foreSwing' + s), e = boneName.indexOf('elbow' + s); if (h >= 0) for (let i = 0; i < N; i++) if (dom[i] === h) dom[i] = e; } // regions read the twist helper's skin as forearm
  const restPos = bones.hips.position.clone();
  const s = root.scale.x, H0 = info.stature;
  // reference heights the stage used as Average Dusk constants: hip joint (ual.js 0.96), ankle joint (ground 0.085)
  const hipH = wp(bones.hips).y, ankleH = Math.min(wp(bones.ankleL).y, wp(bones.ankleR).y);
  info.hipH = +hipH.toFixed(4); info.ankleH = +ankleH.toFixed(4); info.scale = +s.toFixed(4);
  const adj = Array.from({ length: N }, () => new Set()); { const ix = geo.index.array; for (let t = 0; t < ix.length; t += 3) for (let a = 0; a < 3; a++) { const u = rep[ix[t + a]], w = rep[ix[t + (a + 1) % 3]]; if (u !== w) { adj[u].add(w); adj[w].add(u); } } } // welded adjacency (kit.bodyMask)
  const F = { root, mesh, meshes, bones, skel, Wd, rest: restQ, restPos, dom, boneName, rep, adj, side: sideOf, info, idx0: geo.index.clone(), ubc: which, hipH, ankleH, stature: H0, nb: boneName.length };
  return F;
}
