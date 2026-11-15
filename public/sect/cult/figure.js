// Cultivation parts round 4 (2026-10-31-cultivation-parts-3; round 3's figure.js plus the forearm factor and the bust
// key, from his note on cult-parts-look-2): the body half of a mix. Loads a Quaternius UBC body through
// the r0g8 loader (council/callsheets/stills/2026-10-25-novice-ubc-r0g8/make/ubc.js, served at /r0g8/ubc.js), then
// applies the mix keys:
//   gender -> which UBC mesh: the Regular pair (regm / regf) from the bought source kit, one skeleton with the others
//   build  -> a morph toward another UBC body of the same gender (Teen for slight, Superhero for broad) by a fraction:
//             the target's girth is measured off its own bone axes and laid onto the base body's bones, so the base
//             skeleton, its face and every clip are untouched (morphToward); then an optional girth factor per region
//   forearm -> (parts.json forearm.default) a girth factor on the forearm, about the elbow-to-wrist segment, ramped
//             in below the elbow and out toward the wrist, so the forearm reads slim and tapered (applyBuild)
//   bust   -> 1 = the body as bought; scales each breast about a base point behind it with a smooth falloff
//             (applyBust, after the build; on a male body the same at parts.json bust.male of the strength: the pecs)
//   height -> uniform stature scale (ubc.js `stature`; uniform only, docs/3d-math.md rule 7)
//   skin   -> one colour from the eight-step ramp (parts.json skins.ramp, cr-first-menu)
// and poses it: 'stand' (the fit pose every garment is cut in) or 'step' (a stride, to prove the skinned garments follow).
import * as THREE from 'three';
import * as UB from './r0g8/ubc.js';
import { MeshBVH } from 'three-mesh-bvh';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const sstep = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const wp = b => b.getWorldPosition(V());
export const UP = V(0, 1, 0);

// bone classes for the build factors and the garment regions (names are ubc.js UBC_MAP names)
export const TORSO = ['hips', 'spine01', 'spine', 'spine03', 'clavL', 'clavR'];
export const ARM = s => ['shoulder' + s, 'elbow' + s, 'foreSwing' + s];
export const LEG = s => ['hip' + s, 'knee' + s];
export const FOOT = s => ['ankle' + s, 'ball' + s];
const CHILD = { hips: 'spine01', spine01: 'spine', spine: 'spine03', spine03: 'neck', neck: 'head',
  clavL: 'shoulderL', clavR: 'shoulderR', shoulderL: 'elbowL', shoulderR: 'elbowR', elbowL: 'wristL', elbowR: 'wristR',
  foreSwingL: 'wristL', foreSwingR: 'wristR', hipL: 'kneeL', hipR: 'kneeR', kneeL: 'ankleL', kneeR: 'ankleR', ankleL: 'ballL', ankleR: 'ballR' };
export { CHILD };

export function aim(F, name, child, d) {
  F.root.updateMatrixWorld(true); const b = F.bones[name]; const cur = wp(F.bones[child]).sub(wp(b)).normalize();
  const dq = new THREE.Quaternion().setFromUnitVectors(cur, d.clone().normalize());
  const bw = b.getWorldQuaternion(new THREE.Quaternion()), pw = b.parent.getWorldQuaternion(new THREE.Quaternion());
  b.quaternion.copy(pw.invert().multiply(dq.multiply(bw))); F.root.updateMatrixWorld(true);
}

// body frame from the bind pose: f forward (heel to ball), l the wearer's left (right shoulder to left shoulder)
function frame(F) {
  const f = wp(F.bones.ballL).sub(wp(F.bones.ankleL)).add(wp(F.bones.ballR).sub(wp(F.bones.ankleR))); f.y = 0; f.normalize();
  const l = wp(F.bones.shoulderL).sub(wp(F.bones.shoulderR)); l.y = 0; l.addScaledVector(f, -l.dot(f)).normalize();
  return { f, l };
}

// build: each vertex moves out from (or in toward) the axis of the bones that carry it, blended by its skin weights.
// Torso bones scale about the vertical body axis (x along l, z along f); limbs about their bone segment.
function applyBuild(F, k, fr) {
  const sk = F.mesh.skeleton, G = F.mesh.geometry, P = G.attributes.position, SI = G.attributes.skinIndex, SW = G.attributes.skinWeight;
  const BM = F.mesh.bindMatrix, BMI = BM.clone().invert(); // round 4: the stored inverse can be stale after the stature scale, which grew the body 3% about the root
  const bpos = sk.boneInverses.map(m => V().setFromMatrixPosition(m.clone().invert())); // bone heads at bind, in bind space
  const name = sk.bones.map(b => b.name), idx = n => name.indexOf(n);
  const hipC = bpos[idx('hips')];
  // the build moves torso skin about the body axis, so it is ramped out over the shoulder and the hip joints: the
  // deltoid and the buttock carry part torso and part limb weight and would otherwise shear at the seam
  const cls = n => (TORSO.includes(n) ? 'torso' : /^(elbow|foreSwing)/.test(n) ? 'fore' : /^shoulder/.test(n) ? 'arm' : /^hip[LR]$/.test(n) ? 'thigh' : /^knee/.test(n) ? 'calf' : 'none');
  // forearm (round 4): measured on the elbow-to-wrist segment for both forearm bones and for upper-arm skin past FA[3];
  // ramps in from FA[3] (just above the elbow, so the elbow lump softens too) to FA[0], full to FA[1], back to 1 at FA[2]
  // (the wrist: the hand keeps its shape)
  const FA = k.foreRamp || [0.1, 0.35, 1.0, -0.1]; // [full from, ease out from, back to 1 at, ramp in from] along elbow to wrist
  const foreT = (n, pp) => { const sd = n.slice(-1), e = bpos[idx('elbow' + sd)], ab = bpos[idx('wrist' + sd)].clone().sub(e); return pp.clone().sub(e).dot(ab) / ab.lengthSq(); };
  const foreAt = t => { const g = k.arm + (k.arm * k.fore - k.arm) * sstep(FA[3], FA[0], t); return g + (1 - g) * sstep(FA[1], FA[2], t); };
  const p = V(), q = V(), out = V(), a = V(), b = V();
  for (let i = 0; i < P.count; i++) {
    p.fromBufferAttribute(P, i).applyMatrix4(BM); out.set(0, 0, 0); let wsum = 0;
    for (let j = 0; j < 4; j++) {
      const w = SW.getComponent(i, j); if (w <= 0) continue; const bi = SI.getComponent(i, j), n = name[bi], c = cls(n);
      if (c === 'torso') {
        const d = p.clone().sub(q.set(hipC.x, p.y, hipC.z)); const dl = d.dot(fr.l), df = d.dot(fr.f);
        out.addScaledVector(q.clone().addScaledVector(fr.l, dl * k.torsoX).addScaledVector(fr.f, df * k.torsoZ).add(V(0, d.y, 0)), w);
      } else if (c === 'fore' || (c === 'arm' && foreT(n, p) > FA[3])) { // upper-arm skin below the elbow (the joint's shared weight) takes the forearm factor too
        const sd = n.slice(-1); a.copy(bpos[idx('elbow' + sd)]); b.copy(bpos[idx('wrist' + sd)]); const ab = b.clone().sub(a); const t0 = p.clone().sub(a).dot(ab) / ab.lengthSq(), t = THREE.MathUtils.clamp(t0, 0, 1);
        const fk = foreAt(t0);
        q.copy(a).addScaledVector(ab, t); out.addScaledVector(q.clone().addScaledVector(p.clone().sub(q), fk), w);
      } else if (c !== 'none' && CHILD[n]) {
        a.copy(bpos[bi]); b.copy(bpos[idx(CHILD[n])]); const ab = b.clone().sub(a); const t = THREE.MathUtils.clamp(p.clone().sub(a).dot(ab) / ab.lengthSq(), 0, 1);
        q.copy(a).addScaledVector(ab, t); out.addScaledVector(q.clone().addScaledVector(p.clone().sub(q), k[c]), w);
      } else out.addScaledVector(p, w);
      wsum += w;
    }
    out.divideScalar(wsum || 1); out.applyMatrix4(BMI); P.setXYZ(i, out.x, out.y, out.z);
  }
  P.needsUpdate = true; G.computeBoundingSphere();
}

// shoulder (direction B and C round 2, his notes on cult-dir-b-look-1 and cult-dir-c-look-1: "a bit of weirdness in the
// shoulders even as compared to the concept image... bulky and weird", "the shoulders are also a bit severe"): the Regular
// bodies carry an athletic deltoid, so every robe drew a ball at the top of the arm and a square corner at the shoulder.
// Upper-arm skin is drawn toward the humerus by cfg.girth from the cap (above the joint, which also lowers the corner)
// to cfg.full of the way to the elbow, back to 1 at cfg.out, blended by its skin weight, so the shoulder line slopes from
// the neck into the arm as in the concept frames. The body is always covered there; a parts default, not a slider yet.
function applyShoulder(F, cfg) {
  const sk = F.mesh.skeleton, G = F.mesh.geometry, P = G.attributes.position, SI = G.attributes.skinIndex, SW = G.attributes.skinWeight;
  const BM = F.mesh.bindMatrix, BMI = BM.clone().invert(), bpos = sk.boneInverses.map(m => V().setFromMatrixPosition(m.clone().invert())), name = sk.bones.map(b => b.name), idx = n => name.indexOf(n);
  const gk = cfg.girth ?? 0.85, full = cfg.full ?? 0.3, out = cfg.out ?? 0.65, lift = cfg.lower ?? 0, p = V(), q = V();
  for (let i = 0; i < P.count; i++) { let w = 0, sd = null;
    for (let j = 0; j < 4; j++) { const n = name[SI.getComponent(i, j)]; if (/^shoulder[LR]$/.test(n)) { w += SW.getComponent(i, j); sd = n.slice(-1); } }
    if (!sd || w <= 0) continue;
    p.fromBufferAttribute(P, i).applyMatrix4(BM); const a = bpos[idx('shoulder' + sd)], ab = bpos[idx('elbow' + sd)].clone().sub(a);
    const t0 = p.clone().sub(a).dot(ab) / ab.lengthSq(), t = THREE.MathUtils.clamp(t0, 0, 1), g = 1 - (1 - gk) * (1 - sstep(full, out, t0));
    q.copy(a).addScaledVector(ab, t); const np = q.clone().addScaledVector(p.clone().sub(q), g); np.y -= lift * (1 - sstep(0, full, t0));
    p.lerp(np, w).applyMatrix4(BMI); P.setXYZ(i, p.x, p.y, p.z); }
  P.needsUpdate = true; G.computeBoundingSphere();
}

// bust (round 4): find each breast centre, the most forward chest point on each side between the underarm line and
// the waist, in bind space; put a base point behind it (bust.depth of the shoulder width, into the chest) and scale the
// skin about it, forward by s and across and up by sqrt(s), with a cosine falloff over bust.radius of the shoulder
// width, so the chest wall, the armpit and the neckline do not move. Only torso-carried skin moves (not the arm).
// A male body takes bust.male of the strength: the same key reads as fuller or flatter pecs, never a female breast.
function applyBust(F, s0, cfg, gender) {
  const sk = F.mesh.skeleton, G = F.mesh.geometry, P = G.attributes.position, BM = F.mesh.bindMatrix, BMI = BM.clone().invert();
  const bpos = sk.boneInverses.map(m => V().setFromMatrixPosition(m.clone().invert())), name = sk.bones.map(b => b.name), idx = n => name.indexOf(n);
  const { f, l } = F.fr, s = 1 + (s0 - 1) * (gender === 'm' ? (cfg.male ?? 0.35) : 1);
  const shL = bpos[idx('shoulderL')], shR = bpos[idx('shoulderR')], sw = shL.distanceTo(shR), mid = shL.clone().add(shR).multiplyScalar(0.5);
  const chest = new Set(['spine', 'spine03', 'clavL', 'clavR'].map(idx)), yHi = mid.y - (cfg.top ?? 0.18) * sw, yLo = bpos[idx('spine')].y - 0.25 * sw;
  const p = V(), best = { L: null, R: null };
  for (let i = 0; i < P.count; i++) { if (!chest.has(F.dom[i])) continue; p.fromBufferAttribute(P, i).applyMatrix4(BM); if (p.y > yHi || p.y < yLo) continue;
    const side = p.clone().sub(mid).dot(l) > 0 ? 'L' : 'R', lat = Math.abs(p.clone().sub(mid).dot(l)); if (lat < 0.08 * sw || lat > 0.5 * sw) continue;
    const fw = p.dot(f); if (!best[side] || fw > best[side].fw) best[side] = { fw, c: p.clone() }; }
  const R = (cfg.radius ?? 0.3) * sw, D = (cfg.depth ?? 0.16) * sw, sq = Math.sqrt(s), out = {};
  for (const side of ['L', 'R']) { if (!best[side]) continue; const c = best[side].c, base = c.clone().addScaledVector(f, -D); out[side] = c.toArray().map(x => +x.toFixed(4));
    for (let i = 0; i < P.count; i++) { if (!(chest.has(F.dom[i]) || F.boneName[F.dom[i]] === 'spine01')) continue; p.fromBufferAttribute(P, i).applyMatrix4(BM);
      if (p.clone().sub(base).dot(f) < 0) continue; // behind the base: the back and the sides
      if ((p.clone().sub(mid).dot(l) > 0 ? 'L' : 'R') !== side) continue; // each breast moves only its own side
      const dist = p.distanceTo(c); if (dist >= R) continue; const w = 0.5 + 0.5 * Math.cos(Math.PI * dist / R);
      const e = p.clone().sub(base), ef = e.dot(f), en = e.clone().addScaledVector(f, -ef);
      const np = base.clone().addScaledVector(f, ef * s).addScaledVector(en, sq); p.lerp(np, w).applyMatrix4(BMI); P.setXYZ(i, p.x, p.y, p.z); } }
  P.needsUpdate = true; G.computeBoundingSphere(); return { s, centres: out };
}

// cleavage (shells round, his note 2026-11-02: "there is no bust cleavage for the female models"): the chest skin between
// the two bust apexes is drawn toward the midline (each point's distance from the midline x becomes x (1 - a (1 - x/xa)),
// xa the apex's own distance), fading out above and below the bust, so the inner slopes of the breasts steepen and meet
// in a valley that the cross collar's V shows. The apexes, the sides and the back do not move.
function applyCleave(F, cfg, a) {
  const c = applyBust(F, 1, cfg, 'f').centres; if (!c.L || !c.R || !a) return null;
  const sk = F.mesh.skeleton, G = F.mesh.geometry, P = G.attributes.position, BM = F.mesh.bindMatrix, BMI = BM.clone().invert();
  const bpos = sk.boneInverses.map(x => V().setFromMatrixPosition(x.clone().invert())), idx = n => sk.bones.map(b => b.name).indexOf(n);
  const { f, l } = F.fr, sw = bpos[idx('shoulderL')].distanceTo(bpos[idx('shoulderR')]), mid = bpos[idx('shoulderL')].clone().add(bpos[idx('shoulderR')]).multiplyScalar(0.5);
  const cL = V().fromArray(c.L), cR = V().fromArray(c.R), xa = (Math.abs(cL.clone().sub(mid).dot(l)) + Math.abs(cR.clone().sub(mid).dot(l))) / 2, cy = (cL.y + cR.y) / 2, cf = (cL.dot(f) + cR.dot(f)) / 2;
  const Rv = (cfg.radius ?? 0.3) * sw, chest = new Set(['spine', 'spine03', 'spine01', 'clavL', 'clavR'].map(idx)), p = V(), shade = new Float32Array(P.count);
  for (let i = 0; i < P.count; i++) { if (!chest.has(F.dom[i])) continue; p.fromBufferAttribute(P, i).applyMatrix4(BM);
    const x = p.clone().sub(mid).dot(l), ax = Math.abs(x); if (ax >= xa) continue; if (p.dot(f) < cf - 0.1 * sw) continue;
    const dy = Math.abs(p.y - cy); if (dy >= Rv) continue; const wv = 0.5 + 0.5 * Math.cos(Math.PI * dy / Rv);
    const nx = ax * (1 - a * wv * (1 - ax / xa)); p.addScaledVector(l, Math.sign(x) * (nx - ax)); p.addScaledVector(f, (ax - nx) * (cfg.bulge ?? 0)); // fix 4: the flesh that moves in swells forward, as soft tissue does, so the pressed bust is full, not cut
    // the valley's shadow is painted on the skin too (soft, narrow, strongest just above the apex line)
    const dv = Math.abs(p.y - (cy + 0.03 * sw)); shade[i] = Math.exp(-((nx / (0.3 * xa)) ** 2)) * (dv < 0.55 * Rv ? 0.5 + 0.5 * Math.cos(Math.PI * dv / (0.55 * Rv)) : 0);
    p.applyMatrix4(BMI); P.setXYZ(i, p.x, p.y, p.z); }
  G.setAttribute('aShade', new THREE.BufferAttribute(shade, 1));
  P.needsUpdate = true; G.computeBoundingSphere(); return { a, xa: +xa.toFixed(4) };
}
// morph toward another body with a different mesh (no shared topology): for each base vertex, take its dominant bone
// segment, its place along that segment and its direction off it; cast the same ray off the same segment of the target
// body (same bone names, its own joint positions) and read the target's radius there; move the vertex to the blend of
// the two radii. Head, neck, hands and feet keep the base shape (the face and the shoes stay), and a vertex that is
// partly carried by one of those is moved only by the share of its weight the morphed bones carry.
const KEEPB = n => /^(neck|head|wrist|ankle|ball)|^(index|middle|ring|pinky|thumb)_/.test(n);
function morphToward(F, T, t) {
  const sk = F.mesh.skeleton, G = F.mesh.geometry, P = G.attributes.position, SI = G.attributes.skinIndex, SW = G.attributes.skinWeight;
  const name = sk.bones.map(b => b.name), N = P.count, MW = F.mesh.matrixWorld, MWI = new THREE.Matrix3().setFromMatrix4(MW.clone().invert());
  F.root.updateMatrixWorld(true); T.root.updateMatrixWorld(true);
  // target skin at rest, in world space, with a BVH
  const TP = T.mesh.geometry.attributes.position, tw = new Float32Array(TP.count * 3), v = V();
  for (let i = 0; i < TP.count; i++) { v.fromBufferAttribute(TP, i); T.mesh.applyBoneTransform(i, v); v.applyMatrix4(T.mesh.matrixWorld); tw[i * 3] = v.x; tw[i * 3 + 1] = v.y; tw[i * 3 + 2] = v.z; }
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(tw, 3)); tg.setIndex(T.mesh.geometry.index.clone()); const bvh = new MeshBVH(tg);
  const seg = (Fx, n) => { const a = wp(Fx.bones[n]); const c = CHILD[n] && Fx.bones[CHILD[n]] ? wp(Fx.bones[CHILD[n]]) : null; return { a, c }; };
  const cache = new Map(), segs = n => { if (!cache.has(n)) cache.set(n, [seg(F, n), seg(T, n)]); return cache.get(n); };
  const ray = new THREE.Ray(), p = V(), d = V(); let moved = 0, missed = 0; const delta = new Float32Array(N * 3), k = F.stature / 1.75;
  for (let i = 0; i < N; i++) { if (F.rep[i] !== i) continue; const n = F.boneName[F.dom[i]]; if (KEEPB(n) || !T.bones[n]) continue;
    let share = 0; for (let j = 0; j < 4; j++) if (!KEEPB(name[SI.getComponent(i, j)])) share += SW.getComponent(i, j); if (share <= 0) continue;
    p.fromBufferAttribute(P, i).applyMatrix4(MW);
    const [sb, st] = segs(n); let ob, ot, u = 0;
    if (sb.c && st.c) { const ab = sb.c.clone().sub(sb.a); u = THREE.MathUtils.clamp(p.clone().sub(sb.a).dot(ab) / ab.lengthSq(), 0, 1); ob = sb.a.clone().addScaledVector(ab, u); ot = st.a.clone().lerp(st.c, u); }
    else { ob = sb.a.clone(); ot = st.a.clone(); }
    d.copy(p).sub(ob); const rb = d.length(); if (rb < 1e-4) continue; d.divideScalar(rb);
    ray.origin.copy(ot); ray.direction.copy(d); const h = bvh.raycastFirst(ray, THREE.DoubleSide, 0, rb + 0.15 * k);
    if (!h || Math.abs(h.distance - rb) > 0.08 * k) { missed++; continue; }
    const dr = (h.distance - rb) * t * share; delta[i * 3] = d.x * dr; delta[i * 3 + 1] = d.y * dr; delta[i * 3 + 2] = d.z * dr; moved++; }
  for (let i = 0; i < N; i++) { const r = F.rep[i]; d.set(delta[r * 3], delta[r * 3 + 1], delta[r * 3 + 2]).applyMatrix3(MWI); P.setXYZ(i, P.getX(i) + d.x, P.getY(i) + d.y, P.getZ(i) + d.z); }
  P.needsUpdate = true; G.computeBoundingSphere(); weldNormals(F);
  return { moved, missed };
}
// normals over the welded mesh, so UV seams do not show as creases after a morph
function weldNormals(F) {
  const G = F.mesh.geometry, I = F.idx0.array, wi = new Uint32Array(I.length); for (let t = 0; t < I.length; t++) wi[t] = F.rep[I[t]];
  const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', G.attributes.position); g2.setIndex(new THREE.BufferAttribute(wi, 1)); g2.computeVertexNormals();
  const n2 = g2.attributes.normal, NA = G.attributes.normal; for (let i = 0; i < NA.count; i++) { const r = F.rep[i]; NA.setXYZ(i, n2.getX(r), n2.getY(r), n2.getZ(r)); } NA.needsUpdate = true;
}

export const resetPose = F => { for (const k in F.bones) F.bones[k].quaternion.copy(F.rest[k]); F.bones.hips.position.copy(F.restPos); F.root.position.set(0, 0, 0); F.root.updateMatrixWorld(true); };

export function pose(F, which = 'stand') {
  resetPose(F); const { f, l } = F.fr, dn = UP.clone().negate();
  const arm = (s, out, fwd) => V().copy(dn).addScaledVector(l, s * out).addScaledVector(f, fwd);
  // stand: arms 16 deg out from the hips so the hands clear the skirt, forearms a little forward; legs straight, feet under the hips
  const st = which === 'step';
  // shells round 2: 'raise', both arms over the head (Holding Up the Sky, cult-qi-form), the hair check's third pose
  const up = UP.clone(), ra = which === 'raise';
  for (const [s, sg] of [['L', 1], ['R', -1]]) {
    if (ra) { aim(F, 'shoulder' + s, 'elbow' + s, V().copy(up).addScaledVector(l, s === 'L' ? 0.32 : -0.32).addScaledVector(f, 0.05)); aim(F, 'elbow' + s, 'wrist' + s, V().copy(up).addScaledVector(l, s === 'L' ? -0.12 : 0.12));
      aim(F, 'hip' + s, 'knee' + s, V().copy(dn).addScaledVector(l, sg * 0.045)); aim(F, 'knee' + s, 'ankle' + s, V().copy(dn).addScaledVector(l, sg * 0.03)); continue; }
    const swing = st ? (s === 'L' ? -0.25 : 0.25) : 0;
    aim(F, 'shoulder' + s, 'elbow' + s, arm(sg, 0.29, 0.03 + swing));
    aim(F, 'elbow' + s, 'wrist' + s, arm(sg, 0.16, 0.24 + swing));
    const fw = st ? (s === 'L' ? 0.42 : -0.26) : 0;
    aim(F, 'hip' + s, 'knee' + s, V().copy(dn).addScaledVector(l, sg * 0.045).addScaledVector(f, fw));
    aim(F, 'knee' + s, 'ankle' + s, V().copy(dn).addScaledVector(l, sg * 0.03).addScaledVector(f, st ? (s === 'L' ? 0.16 : -0.42) : 0));
  }
  F.root.updateMatrixWorld(true);
  // ground: lowest skinned body point on the floor (garment soles sit on it, a few mm lower)
  const P = F.mesh.geometry.attributes.position, v = V(); let lo = 1e9;
  for (let i = 0; i < P.count; i += 3) { v.fromBufferAttribute(P, i); F.mesh.applyBoneTransform(i, v); v.applyMatrix4(F.mesh.matrixWorld); lo = Math.min(lo, v.y); }
  F.root.position.y -= lo - 0.006; F.root.updateMatrixWorld(true);
  F.mesh.skeleton.update();
  F.poseName = which;
}

// skinned world positions and normals of the body (welded normals, so UV seams do not split them)
export function posed(F) {
  const G = F.mesh.geometry, N = G.attributes.position.count, P = new Float32Array(N * 3), v = V();
  for (let i = 0; i < N; i++) { v.fromBufferAttribute(G.attributes.position, i); F.mesh.applyBoneTransform(i, v); v.applyMatrix4(F.mesh.matrixWorld); P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z; }
  const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.BufferAttribute(P, 3)); g2.setIndex(F.idx0.clone()); g2.computeVertexNormals();
  const n0 = g2.attributes.normal.array, Nn = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const r = F.rep[i]; Nn[r * 3] += n0[i * 3]; Nn[r * 3 + 1] += n0[i * 3 + 1]; Nn[r * 3 + 2] += n0[i * 3 + 2]; }
  for (let i = 0; i < N; i++) { const r = F.rep[i]; const x = Nn[r * 3], y = Nn[r * 3 + 1], z = Nn[r * 3 + 2], m = Math.hypot(x, y, z) || 1; Nn[i * 3] = x / m; Nn[i * 3 + 1] = y / m; Nn[i * 3 + 2] = z / m; }
  return { P, N: Nn, count: N };
}

export async function loadFigure(mix, reg) {
  const g = reg.genders[mix.gender]; if (!g) throw new Error('gender ' + mix.gender);
  const F = await UB.loadUBC(g.file, { stature: +mix.height || reg.height.default });
  F.mix = mix; F.fr = frame(F);
  const k = reg.builds[mix.build || 'average']; if (!k) throw new Error('build ' + mix.build);
  if (k.toward) { const T = await UB.loadUBC(k.toward[mix.gender], { stature: F.stature }); F.morph = morphToward(F, T, k.t); F.morph.toward = k.toward[mix.gender]; F.morph.t = k.t; }
  const fore = mix.forearm != null ? +mix.forearm : (reg.forearm ? reg.forearm.default : 1);
  const g1 = { torsoX: 1, torsoZ: 1, arm: 1, thigh: 1, calf: 1, ...k, fore: (k.fore ?? 1) * fore, foreRamp: reg.forearm && reg.forearm.ramp };
  if (['torsoX', 'torsoZ', 'arm', 'thigh', 'calf', 'fore'].some(x => g1[x] !== 1)) applyBuild(F, g1, F.fr);
  if (reg.shoulder && mix.shoulder !== 1) applyShoulder(F, { ...reg.shoulder, girth: mix.shoulder != null ? +mix.shoulder : reg.shoulder.girth });
  const bust = mix.bust != null ? +mix.bust : (reg.bust ? reg.bust.default : 1);
  if (reg.bust && bust !== 1) F.bust = applyBust(F, bust, reg.bust, mix.gender);
  if (reg.bust && reg.bust.cleave && mix.gender === 'f') F.cleave = applyCleave(F, reg.bust, (mix.cleave != null ? +mix.cleave : reg.bust.cleave) + (mix.outfit ? (reg.bust.press ?? 0) : 0)); // fix 4: a robe presses the bust together
  weldNormals(F);
  const ramp = reg.skins.ramp, si = Math.max(0, Math.min(ramp.length - 1, +mix.skin || 0));
  F.mesh.material = new THREE.MeshStandardMaterial({ color: new THREE.Color(ramp[si]), roughness: 0.72 });
  if (F.mesh.geometry.attributes.aShade) F.mesh.material.onBeforeCompile = s => { // shells round: the painted cleavage shadow
    s.vertexShader = 'attribute float aShade; varying float vShade;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvShade = aShade;');
    s.fragmentShader = 'varying float vShade;\n' + s.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= 1.0 - ' + (reg.bust.cleaveShade ?? 0.4).toFixed(3) + ' * vShade;'); };
  F.boneIdx = n => F.boneName.indexOf(n);
  return F;
}
