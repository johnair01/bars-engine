// hold.js: one hold rig for every figure and prop (hand-grip strand, part 2, 2026-11-09).
// Wendell's C on hand-grip-look-1: read a learned grasp model's finger angles first, then build the shared rig of the
// pass (council/passes/hand-grip-1_2026-11-09.md, steps 1 to 5) with those angles as the starting pose.
// The GraspXL numbers are reference only: MANO's licence and the dataset's CC BY-NC bar shipping any of its data, so
// only the 15 median angles below are carried, as a starting pose the solver then moves off.
//
//   1. the prop says how: a grip record (axis, the side the palm lies on, the hold type, its surface as a distance field)
//   2. the arm reaches: two-bone IK puts the hand's anchor (the palm hollow for a wrap, the index's middle pad for the
//      writing hold) on the grip axis, the knuckle row along it and the palm facing it
//   3. fingers close joint by joint: each joint starts at its GraspXL angle, then turns until its own segment's skin
//      touches the prop (closing if clear, opening if inside), stopping too at a neighbouring finger's capsule
//   4. the prop rides the palm: after the grab its pose is stored in the hand's frame and follows the hand every frame
//   5. the page prints the gaps: each pad's gap, the deepest skin overlap into the prop and between fingers, and how far
//      round the axis the hand closes
import * as THREE from 'three';
import { resetPose } from './figure.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const Q = () => new THREE.Quaternion();
const wp = b => b.getWorldPosition(V());
const DEG = Math.PI / 180;

// GraspXL medians, degrees (base, middle, tip), 17 MANO grasps of 5 rods 3.3 to 4.3 cm thick
// (/mnt/project-files/3d-build/hand-grip-graspxl/graspxl-rod-angles.json). Absolute from a flat hand.
export const SEED = { index: [62.7, 23.3, 10.8], middle: [66.7, 21.1, 22.1], ring: [51.9, 31.5, 2.9], pinky: [61.5, 13.6, 2.8], thumb: [48.8, 19.5, 17.1] };
const FINGERS = ['index', 'middle', 'ring', 'pinky'];
// ubc.js curls the flat bind fingers 18 deg (the base 0.6 of that) to make the relaxed rest hand
const REST_CURL = [10.8, 18, 18];
// joint ranges, degrees: a finger's base, middle and tip; the thumb's opposition, base and tip
const RANGE = { finger: [[-5, 95], [-5, 110], [-10, 85]], thumb: [[-40, 85], [-15, 80], [-15, 85]] };
export const TOL = { touch: 0.0005, pad: 0.002, overlap: 0.001 };

const setWorldQ = (b, qw) => { b.quaternion.copy(b.parent.getWorldQuaternion(Q()).invert().multiply(qw)); b.updateMatrixWorld(true); };
const aimBone = (b, child, to) => { const cur = wp(child).sub(wp(b)).normalize(); const dq = Q().setFromUnitVectors(cur, to.clone().normalize()); setWorldQ(b, dq.multiply(b.getWorldQuaternion(Q()))); };

// ---- the hand, read once per body at rest ----------------------------------------------------------------------
// frame: K across the knuckles (little finger to index), D along the middle finger off the wrist, N the palm's normal
// (out of the palm). Stored in the wrist bone's local space. Per digit: bones, a flat direction and flex axis, and the
// skin of each segment as points in that bone's own space (vertices whose heaviest bone it is).
export function rigHand(F, s = 'r') {
  const key = 'hold_' + s; if (F[key]) return F[key];
  const saved = Object.fromEntries(Object.entries(F.bones).map(([n, b]) => [n, b.quaternion.clone()])), savedHip = F.bones.hips.position.clone(), savedRoot = F.root.position.clone();
  resetPose(F); F.root.updateMatrixWorld(true);
  const b = n => F.bones[`${n}_${s}`], W = F.bones[s === 'r' ? 'wristR' : 'wristL'], qWi = W.getWorldQuaternion(Q()).invert(), toL = v => v.clone().applyQuaternion(qWi);
  const K = wp(b('index_01')).sub(wp(b('pinky_01'))).normalize(), D = wp(b('middle_01')).sub(wp(W)); D.addScaledVector(K, -D.dot(K)).normalize();
  const N = D.clone().cross(K).normalize(), tip = wp(b('middle_04_leaf')).sub(wp(b('middle_02'))); if (tip.dot(N) < 0) N.negate();
  const R = { F, s, W, KL: toL(K), DL: toL(D), NL: toL(N), digits: {}, segs: [] };
  // skinned rest positions of the hand and arm, and the clouds
  const G = F.mesh.geometry, P = G.attributes.position, bi = n => F.boneName.indexOf(n), v = V();
  const handBones = new Set([W.name, ...FINGERS.flatMap(f => ['01', '02', '03'].map(j => `${f}_${j}_${s}`)), ...['01', '02', '03'].map(j => `thumb_${j}_${s}`)].map(bi));
  const clouds = new Map([...handBones].map(i => [i, []]));
  for (let i = 0; i < P.count; i++) { if (F.rep[i] !== i || !clouds.has(F.dom[i])) continue; v.fromBufferAttribute(P, i); F.mesh.applyBoneTransform(i, v); v.applyMatrix4(F.mesh.matrixWorld); clouds.get(F.dom[i]).push(i, v.x, v.y, v.z); }
  R.handVerts = []; for (const arr of clouds.values()) for (let k = 0; k < arr.length; k += 4) R.handVerts.push(arr[k]);
  const seg = (bone, child) => { const arr = clouds.get(bi(bone.name)) || [], inv = bone.matrixWorld.clone().invert(), loc = new Float32Array(arr.length / 4 * 3);
    const a = wp(bone), c = wp(child), ab = c.clone().sub(a), L = ab.length(); ab.normalize(); const rr = [];
    for (let k = 0, m = 0; k < arr.length; k += 4, m += 3) { v.set(arr[k + 1], arr[k + 2], arr[k + 3]); const d = v.clone().sub(a); const t = d.dot(ab); if (t > 0.15 * L && t < 0.85 * L) rr.push(d.addScaledVector(ab, -t).length()); v.applyMatrix4(inv); loc[m] = v.x; loc[m + 1] = v.y; loc[m + 2] = v.z; }
    rr.sort((x, y) => x - y); const S = { bone, child, loc, len: L, rad: rr.length ? rr[rr.length >> 1] : 0.007 }; R.segs.push(S);
    // the segment's skin past its first fifth: the part near the joint is the previous segment's contact as well
    const tl = []; for (let m = 0; m < loc.length; m += 3) { v.set(loc[m], loc[m + 1], loc[m + 2]).applyMatrix4(bone.matrixWorld); if (v.sub(a).dot(ab) > 0.2 * L) tl.push(loc[m], loc[m + 1], loc[m + 2]); }
    S.tail = new Float32Array(tl); return S; };
  for (const f of FINGERS) {
    const bs = ['01', '02', '03', '04_leaf'].map(j => b(`${f}_${j}`)); if (bs.some(x => !x)) continue;
    const d0 = wp(bs[1]).sub(wp(bs[0])).normalize(), ax = d0.clone().cross(N).normalize(), flat = d0.clone().applyAxisAngle(ax, -REST_CURL[0] * DEG);
    R.digits[f] = { f, bones: bs, flatL: toL(flat), axL: toL(ax), segs: [0, 1, 2].map(j => seg(bs[j], bs[j + 1])) };
  }
  { const bs = ['01', '02', '03', '04_leaf'].map(j => b(`thumb_${j}`));
    const rest = bs.slice(0, 3).map(x => x.quaternion.clone());
    R.digits.thumb = { f: 'thumb', bones: bs, rest, segs: [0, 1, 2].map(j => seg(bs[j], bs[j + 1])) };
    // which way about D turns the thumb in front of the palm (its tip toward N): try a small turn and keep the sign
    const t0 = wp(bs[3]).dot(N); setWorldQ(bs[0], Q().setFromAxisAngle(D, 0.2).multiply(bs[0].getWorldQuaternion(Q()))); F.root.updateMatrixWorld(true);
    R.thumbSign = wp(bs[3]).dot(N) > t0 ? 1 : -1; bs[0].quaternion.copy(rest[0]); F.root.updateMatrixWorld(true); }
  // the palm hollow: the palm's skin under the knuckle row, a little short of it (the crease), measured on the wrist's
  // own skin: the point furthest along N among palm vertices within 7 mm of the line through that station along N
  { const kn = wp(b('index_01')).add(wp(b('pinky_01'))).multiplyScalar(0.5).addScaledVector(D, -0.012 * F.stature / 1.75), arr = clouds.get(bi(W.name)); let best = -1e9;
    for (let k = 0; k < arr.length; k += 4) { v.set(arr[k + 1], arr[k + 2], arr[k + 3]); const d = v.clone().sub(kn), h = d.dot(N); if (d.addScaledVector(N, -h).length() < 0.007 && h > best) best = h; }
    R.palmDepth = best; R.hollowL = toL(kn.addScaledVector(N, best).sub(wp(W))); }
  // the palm for seating: the wrist bone's own skin, and the first 30% of each finger's base segment
  R.palmSegs = [seg(W, b('middle_01'))]; R.segs.pop();
  R.palmRoots = FINGERS.filter(f => R.digits[f]).map(f => { const S = R.digits[f].segs[0], idx = []; for (let m = 0; m < S.loc.length; m += 3) { const p = V(S.loc[m], S.loc[m + 1], S.loc[m + 2]).applyMatrix4(S.bone.matrixWorld), a = wp(S.bone), c = wp(S.child); if (p.clone().sub(a).dot(c.clone().sub(a).normalize()) < 0.3 * S.len) idx.push(m); } return [S, idx]; });
  for (const [n, q] of Object.entries(saved)) F.bones[n].quaternion.copy(q); F.bones.hips.position.copy(savedHip); F.root.position.copy(savedRoot); F.root.updateMatrixWorld(true);
  F[key] = R; return R;
}

// the hand's world frame now
export function frameOf(R) { const q = R.W.getWorldQuaternion(Q()); return { q, K: R.KL.clone().applyQuaternion(q), D: R.DL.clone().applyQuaternion(q), N: R.NL.clone().applyQuaternion(q), W: wp(R.W) }; }

// ---- digits: set absolute joint angles (degrees from a flat hand) ----------------------------------------------
export function setDigit(R, f, a) {
  const Dg = R.digits[f], bs = Dg.bones, root = R.F.root; root.updateMatrixWorld(true);
  const fr = frameOf(R);
  if (f !== 'thumb') {
    // a[3], if given: the finger's spread, degrees toward the little finger's side, about the palm's normal
    const flat = Dg.flatL.clone().applyQuaternion(fr.q), ax = Dg.axL.clone().applyQuaternion(fr.q); let cum = 0;
    if (a[3]) { flat.applyAxisAngle(fr.N, -a[3] * DEG); ax.applyAxisAngle(fr.N, -a[3] * DEG); }
    for (let j = 0; j < 3; j++) { cum += a[j] * DEG; aimBone(bs[j], bs[j + 1], flat.clone().applyAxisAngle(ax, cum)); }
  } else {
    // opposition: the thumb's metacarpal turns about the hand's long axis, from the rest thumb, in front of the palm;
    // then its base and tip flex toward the palm's centre from a straight thumb
    for (let j = 0; j < 3; j++) bs[j].quaternion.copy(Dg.rest[j]); root.updateMatrixWorld(true);
    setWorldQ(bs[0], Q().setFromAxisAngle(fr.D, R.thumbSign * a[0] * DEG).multiply(bs[0].getWorldQuaternion(Q()))); root.updateMatrixWorld(true);
    // a wrap bends the thumb round the grip's axis (R.thumbAxis, set by grab), the writing hold toward the palm
    const straight = wp(bs[1]).sub(wp(bs[0])).normalize(), toPalm = palmCentre(R).sub(wp(bs[1]));
    const ax = R.thumbAxis ? R.thumbAxis.clone() : straight.clone().cross(toPalm).normalize(); let cum = 0;
    for (let j = 1; j < 3; j++) { cum += a[j] * DEG; aimBone(bs[j], bs[j + 1], straight.clone().applyAxisAngle(ax, cum)); }
  }
  Dg.angles = a.slice(); root.updateMatrixWorld(true);
}
export const palmCentre = R => { const fr = frameOf(R); return fr.W.clone().add(R.hollowL.clone().applyQuaternion(fr.q)); };

// ---- clearance -----------------------------------------------------------------------------------------------
// a segment's skin, carried rigidly by its bone (the solver's fast stand-in for skinning; the printed numbers use the
// real skinned mesh)
const segWorld = (S, out = []) => { const m = S.bone.matrixWorld, v = V(); out.length = 0; for (let k = 0; k < S.loc.length; k += 3) out.push(v.set(S.loc[k], S.loc[k + 1], S.loc[k + 2]).applyMatrix4(m).clone()); return out; };
const capsule = S => [wp(S.bone), wp(S.child), S.rad];
const distSeg = (p, a, b) => { const ab = b.clone().sub(a), t = THREE.MathUtils.clamp(p.clone().sub(a).dot(ab) / ab.lengthSq(), 0, 1); return p.distanceTo(a.clone().addScaledVector(ab, t)); };
// the prop's surface distance at a world point (negative inside)
export const propDist = (H, p) => H.grip.sdf(p.clone().applyMatrix4(H.inv));
function clearance(R, H, S, others, tail = false) {
  const pts = segWorld(tail ? { bone: S.bone, loc: S.tail } : S); let cp = 1e9, cn = 1e9;
  for (const p of pts) { cp = Math.min(cp, propDist(H, p)); for (const [a, b, r] of others) cn = Math.min(cn, distSeg(p, a, b) - r); }
  return { prop: cp, nb: cn };
}

// close one digit joint by joint from its seed: each joint closes while its segment is clear of the prop and of the
// neighbours' capsules, and opens if it starts inside; the step is 1 deg, then halved four times at the touch
function closeDigit(R, H, f, seed, others) {
  const rng = f === 'thumb' ? RANGE.thumb : RANGE.finger, a = seed.slice(), Dg = R.digits[f], why = [];
  for (let j = 0; j < 3; j++) {
    // the thumb's opposition counts its two outer segments (turning it swings them through the prop; its metacarpal is
    // the ball of the thumb, part of the palm), the rest their own segment
    const segs = f === 'thumb' && j === 0 ? Dg.segs.slice(1) : f === 'thumb' ? [Dg.segs[j]] : [Dg.segs[j]];
    let best = { v: -1e9, th: a[j] };
    const ok = th => { a[j] = th; setDigit(R, f, a); let m = 1e9; for (const S of segs) { const c = clearance(R, H, S, others, j > 0); m = Math.min(m, c.prop - TOL.touch, c.nb + TOL.touch); } if (m > best.v) best = { v: m, th }; return m >= 0; };
    let lo = rng[j][0], hi = rng[j][1], th = a[j];
    if (ok(th)) { let t = th; while (t + 1 <= hi && ok(t + 1)) t += 1; let g = t, b2 = Math.min(hi, t + 1); if (b2 > t) for (let i = 0; i < 4; i++) { const m = (g + b2) / 2; if (ok(m)) g = m; else b2 = m; } th = g; why.push(th >= hi - 1e-6 ? 'limit' : 'touch'); }
    else {
      // inside at the seed: the nearest clear angle either way (opening backs the segment out; closing can carry it
      // round the prop's edge), then halved toward the seed
      // (a wrap tries closing round first: its fingers go round the prop rather than back off it)
      let found = null;
      if (H.grip.type === 'wrap') for (let t = th + 1; t <= hi && found === null; t++) if (ok(t)) found = t;
      for (let s = 1; s <= 120 && found === null; s++) { if (th - s >= lo && ok(th - s)) found = th - s; else if (th + s <= hi && ok(th + s)) found = th + s; }
      if (found === null) { th = best.th; why.push('least inside'); }
      else { const dir = found < th ? 1 : -1; let g = found, b2 = found + dir; for (let i = 0; i < 4; i++) { const m = (g + b2) / 2; if (ok(m)) g = m; else b2 = m; } th = g; why.push(found < seed[j] ? 'opened' : 'closed round'); } }
    a[j] = th; setDigit(R, f, a);
  }
  return { angles: a.map(x => +x.toFixed(1)), why };
}

// the writing hold's middle, ring and little fingers keep the tripod's seed: the middle finger's side is the rest the
// shaft was laid on, and the other two curl under it without touching (Feix's writing tripod). A segment found inside
// the brush or a finger opens its joint until clear.
function keepDigit(R, H, f, seed, others) {
  const a = seed.slice(), Dg = R.digits[f], why = [];
  for (let j = 0; j < 3; j++) { let n = 0; const bad = () => { setDigit(R, f, a); const c = clearance(R, H, Dg.segs[j], others, j > 0); return c.prop < 0 || c.nb < -TOL.touch; };
    while (bad() && a[j] > RANGE.finger[j][0] && n < 60) { a[j] -= 1; n++; } why.push(n ? 'opened' : 'seed'); }
  setDigit(R, f, a); return { angles: a.map(x => +x.toFixed(1)), why };
}

// a finger round a wrap, searched whole: base angle b, middle angle m, tip = m times a coupling r (the last joint
// follows the middle one in a real grasp, about two thirds). Each candidate must keep every segment clear of the prop
// and the earlier fingers (with a margin for skinning); the best is the one whose segments sit closest to the prop,
// the pad weighted most. Coarse grid, then a fine pass round the best.
const MARGIN = 0.0006;
function wrapFinger(R, H, f, others, palmPlane) {
  const Dg = R.digits[f], rng = RANGE.finger;
  const score = a => { setDigit(R, f, a); let worst = 1e9, cost = 0; const w = [1, 1, 1.3];
    for (let j = 0; j < 3; j++) { const c = clearance(R, H, Dg.segs[j], j === 0 ? [] : others, false); if (j === 0) c.nb = 1e9; const m = Math.min(c.prop - MARGIN, c.nb + 0.0009); worst = Math.min(worst, m);
      cost += w[j] * Math.max(0, c.prop - MARGIN); }
    cost += 0.00004 * Math.abs(a[3] || 0);
    if (palmPlane) for (const p of segWorld(Dg.segs[2])) worst = Math.min(worst, p.clone().sub(palmPlane[0]).dot(palmPlane[1]) - MARGIN);
    return { worst, cost }; };
  let best = null; const tryA = a => { const s = score(a); if (s.worst >= 0 && (!best || s.cost < best.cost)) best = { a: a.slice(), cost: s.cost, worst: s.worst }; if (!best0 || s.worst > best0.worst) best0 = { a: a.slice(), worst: s.worst }; };
  let best0 = null;
  // spread: the index may lean toward the thumb's side, the ring and little fingers toward their own (real fingers fan
  // as they close); the middle stays in its plane
  const SPREAD = { index: [0, -4, -8], middle: [0], ring: [0, 4, 8], pinky: [0, 4, 8, 12, 16] }[f];
  for (const sp of SPREAD) for (let b = rng[0][0]; b <= rng[0][1]; b += 4) for (let m = rng[1][0]; m <= rng[1][1]; m += 4) for (const r of [0.45, 0.7, 0.95]) tryA([b, m, Math.min(rng[2][1], m * r), sp]);
  const c0 = best ? best.a : best0.a;
  for (let b = c0[0] - 4; b <= c0[0] + 4; b += 1) for (let m = c0[1] - 4; m <= c0[1] + 4; m += 1) for (let t = c0[2] - 6; t <= c0[2] + 6; t += 1.5) for (const sp of [c0[3] - 2, c0[3], c0[3] + 2]) if (b >= rng[0][0] && b <= rng[0][1] && m >= rng[1][0] && m <= rng[1][1] && t >= rng[2][0] && t <= rng[2][1]) tryA([b, m, t, sp]);
  const a = best ? best.a : best0.a; setDigit(R, f, a);
  return { angles: a.map(x => +x.toFixed(1)), why: [best ? 'wrapped' : 'least inside', 'cost ' + (best ? (best.cost * 1000).toFixed(1) : '-')] };
}

// a wrap's thumb, searched whole: opposition, base and tip on a grid; the outer two segments stay clear of the prop and
// of the closed fingers, and the pad comes as near as it can to either (it lands on the prop if it can reach it, else on
// the fingers' middle segments, as in Feix's small-diameter wrap)
function wrapThumb(R, H, others) {
  const Dg = R.digits.thumb, rng = RANGE.thumb, cand = [];
  const tryA = a => { setDigit(R, 'thumb', a); let worst = 1e9;
    for (const S of Dg.segs.slice(1)) { const c = clearance(R, H, S, others); worst = Math.min(worst, c.prop - MARGIN, c.nb + 0.0009); }
    worst = Math.min(worst, clearance(R, H, Dg.segs[0], others).nb + 0.0009);
    if (worst < 0) return; const c = clearance(R, H, Dg.segs[2], others), pad = Math.min(c.prop, c.nb) + 0.15 * Math.max(0, clearance(R, H, Dg.segs[1], others).prop - 0.004);
    cand.push({ a: a.slice(), pad }); };
  for (let o = rng[0][0]; o <= 60; o += 5) for (let b = rng[1][0]; b <= rng[1][1]; b += 5) for (let t = 0; t <= rng[2][1]; t += 10) tryA([o, b, t]);
  // part 4: the rigid stand-in lets the thumb sit 3 mm into the middle finger once skinned (the skin near the thumb's
  // base moves with it), so the coarse grid's clear poses are ranked, the best few refined, and every refined pose is
  // judged on the real skinned vertices before it is kept
  cand.sort((x, y) => x.pad - y.pad); const seeds = cand.slice(0, 6).map(c => c.a); cand.length = 0;
  for (const c0 of seeds) for (let o = c0[0] - 4; o <= c0[0] + 4; o += 2) for (let b = c0[1] - 4; b <= c0[1] + 4; b += 2) for (let t = c0[2] - 8; t <= c0[2] + 8; t += 4) if (o >= rng[0][0] && o <= 60 && b >= rng[1][0] && b <= rng[1][1] && t >= rng[2][0] && t <= rng[2][1]) tryA([o, b, t]);
  const sk = skinJudge(R, H); let best = null, least = null; const seen = new Set();
  cand.sort((x, y) => x.pad - y.pad);
  for (const c of cand) { const key = c.a.join(); if (seen.has(key)) continue; seen.add(key); if (seen.size > 160) break;
    setDigit(R, 'thumb', c.a); const j = sk(); if (!least || j.worst > least.j.worst) least = { a: c.a, j };
    if (j.worst >= -TOL.overlap * 0.8 && (!best || Math.abs(j.pad) < Math.abs(best.j.pad))) { best = { a: c.a, j }; if (Math.abs(j.pad) <= TOL.pad * 0.6) break; } }
  const pick = best || least, a = pick ? pick.a : SEED.thumb.slice(); setDigit(R, 'thumb', a);
  return { angles: a.map(x => +x.toFixed(1)), why: [best ? 'wrapped' : 'no clear pose', 'skinned pad ' + (pick ? (pick.j.pad * 1000).toFixed(1) : '-'), 'skinned overlap ' + (pick ? (pick.j.worst * 1000).toFixed(1) : '-')] };
}
// the thumb's skinned skin against the fingers (as measure() counts it: either way round, base to base left out) and
// the prop; returns the worst overlap and the pad's gap (the nearer of prop and fingers)
function skinJudge(R, H) {
  const F = R.F, P = F.mesh.geometry.attributes.position, bi = n => F.boneName.indexOf(n), v = V();
  const thumbJ = new Map(R.digits.thumb.bones.slice(0, 3).map((b, j) => [bi(b.name), j])), fingJ = new Map();
  for (const f of FINGERS) R.digits[f].bones.slice(0, 3).forEach((b, j) => fingJ.set(bi(b.name), j));
  const tv = R.handVerts.filter(i => thumbJ.has(F.dom[i])), fv = [];
  F.root.updateMatrixWorld(true);
  for (const i of R.handVerts) if (fingJ.has(F.dom[i])) { v.fromBufferAttribute(P, i); F.mesh.applyBoneTransform(i, v); v.applyMatrix4(F.mesh.matrixWorld); fv.push([v.clone(), fingJ.get(F.dom[i])]); }
  const fcaps = FINGERS.flatMap(f => R.digits[f].segs.map((S, j) => [...capsule(S), j]));
  return () => { F.root.updateMatrixWorld(true); const tcaps = R.digits.thumb.segs.map((S, j) => [...capsule(S), j]); let worst = 1e9, pad = 1e9;
    for (const i of tv) { const j = thumbJ.get(F.dom[i]); v.fromBufferAttribute(P, i); F.mesh.applyBoneTransform(i, v); v.applyMatrix4(F.mesh.matrixWorld);
      const dp = propDist(H, v); worst = Math.min(worst, dp);
      for (const [a, b, r, cj] of fcaps) { if (j === 0 && cj === 0) continue; const o = distSeg(v, a, b) - r; worst = Math.min(worst, o); if (j === 2 && cj > 0) pad = Math.min(pad, o); }
      if (j === 2) pad = Math.min(pad, dp); }
    for (const [p, fj] of fv) for (const [a, b, r, tj] of tcaps) { if (fj === 0 && tj === 0) continue; worst = Math.min(worst, distSeg(p, a, b) - r); }
    return { worst, pad }; };
}

// ---- grip records ----------------------------------------------------------------------------------------------
// sdf helpers in the prop's own space
const sdEllipse = (x, y, a, b) => { const k0 = Math.hypot(x / a, y / b), k1 = Math.hypot(x / (a * a), y / (b * b)); return k0 < 1e-9 ? -Math.min(a, b) : k0 * (k0 - 1) / k1; };
const capY = (p, y0, y1, d) => Math.max(d, y0 - p.y, p.y - y1);
// the jian sheathed, as the gate builds it (gate.html round 15): a lacquered scabbard 0.74 long, radius 0.019 to 0.022,
// flattened to 0.45 in depth, a brass throat collar, the guard, the hilt and the pommel; held by the scabbard under
// the collar (round 15 carries it by the scabbard). +y runs toward the hilt. The palm takes one narrow edge (+x) and
// the fingers close over the flats to the other edge, the way an oval sword grip sits in the hand (the long axis of
// the oval from the palm toward the fingertips).
export function jianGrip(k = 1) {
  return { name: 'jian', type: 'wrap', k,
    at: V(0, -0.115 * k, 0), dir: V(0, 1, 0), face: V(1, 0, 0), tilt: 10,
    depth: 0.0194 * k,
    sdf: p => { const r = (0.019 + 0.003 * THREE.MathUtils.clamp(-p.y / 0.74 / k, 0, 1)) * k;
      const body = capY(p, -0.74 * k, 0, sdEllipse(p.x, p.z, r, r * 0.45));
      const collar = capY(p, -0.045 * k, 0.005 * k, sdEllipse(p.x, p.z, 0.024 * k, 0.012 * k));
      const guard = Math.max(Math.abs(p.x) - 0.05 * k, Math.abs(p.y - 0.012 * k) - 0.011 * k, Math.abs(p.z) - 0.015 * k);
      const hilt = capY(p, 0.025 * k, 0.195 * k, Math.hypot(p.x, p.z) - 0.015 * k);
      return Math.min(body, collar, guard, hilt); } };
}
// the ember brush (brush.js makeBrush): a bamboo shaft radius 0.0046 to 0.0052 over 0.215, its origin at the ferrule,
// +y up the shaft; held a third of the way up (brush.js's pinch sits 0.085 above the ferrule). The palm faces the
// shaft from any side (round), so the record names -x.
// part 7 (his note, 2026-11-10): the brush stands upright, the Chinese five-finger hold, held higher up the shaft;
// style 'tripod' keeps part 6's slanted pen hold
export function brushGrip(k = 1, style = 'upright') {
  return { name: 'brush', type: 'write', style, k,
    at: V(0, (style === 'upright' ? (globalThis.UAT ?? 0.13) : 0.045) * k, 0), dir: V(0, 1, 0), face: V(-1, 0, 0), tilt: -12,
    depth: 0.005 * k,
    sdf: p => { const r = (0.0052 - 0.0006 * THREE.MathUtils.clamp(p.y / 0.215 / k, 0, 1)) * k;
      const shaft = capY(p, -0.011 * k, 0.219 * k, Math.hypot(p.x, p.z) - r);
      const hair = capY(p, -0.045 * k, -0.011 * k, Math.hypot(p.x, p.z) - 0.0055 * k * THREE.MathUtils.clamp((p.y + 0.045 * k) / (0.034 * k), 0.15, 1));
      return Math.min(shaft, hair); } };
}

// ---- the hold --------------------------------------------------------------------------------------------------
// where the hand's anchor is, in the wrist's space, for a hold type, with the digits at the seed: a wrap puts the axis
// one grip-depth off the palm hollow; the writing hold puts it against the palm side of the index's middle segment
// The writing hold is Feix's writing tripod (brush.js's pinch): the shaft rests on the index side of the middle
// finger's last segment, the index pad presses on it from above and the thumb's pad from the side, and it leaves the
// hand over the web between thumb and index; the ring and little fingers curl under the middle one and do not touch it.
// Its frame comes from the hand at the tripod's seed: the line from the middle finger's contact to the web.
export const WRITE_SEED = { index: [50, 40, 10], middle: [55, 60, 30], ring: [66, 74, 40], pinky: [70, 74, 40], thumb: [60, 20, 15] };
// part 5: the tripod's line is laid from the index finger's pad to the web between thumb and index, on the palm side
// of the web (part 4 laid it from the middle finger to a web point pushed toward the back of the hand, which ran the
// shaft over the back of the index). The index lies along the shaft; the thumb and the middle finger are then searched
// so their pads meet it (padSearch). R.webOff (metres along N) moves the web point; grab tunes it until the web's skin
// just clears the shaft.
// part 7, the upright five-finger hold (wuzhi zhibi), Wendell's note of 2026-11-10: the shaft stands across the
// stacked fingers, along the knuckle row (index on top, the hair toward the little finger's side); the index pad and
// below it the middle pad press it from the far side, the thumb pad from the near side at the index's height, the ring
// finger's nail side pushes it back out from the near side, and the little finger rests behind the ring. The palm stays
// hollow. The line is laid through the index pad, along the knuckle row, square to the pad's facing.
export const UPRIGHT_SEED = { index: [45, 50, 20], middle: [62, 66, 26], ring: [70, 88, 50], pinky: [74, 88, 45], thumb: [30, 5, 0] };
function uprightFrameL(R, grip) {
  if (globalThis.USEED) Object.assign(UPRIGHT_SEED, globalThis.USEED);
  const fr = frameOf(R), qi = fr.q.clone().invert(), toL = v => v.clone().applyQuaternion(qi), r = grip.depth + TOL.touch;
  for (const f of FINGERS) setDigit(R, f, UPRIGHT_SEED[f]); setDigit(R, 'thumb', UPRIGHT_SEED.thumb);
  const Dg = R.digits.index, S = Dg.segs[2], cum = UPRIGHT_SEED.index.slice(0, 3).reduce((x, y) => x + y, 0) * DEG;
  const padN = fr.N.clone().applyAxisAngle(Dg.axL.clone().applyQuaternion(fr.q), cum);
  const Pi = wp(S.bone).lerp(wp(S.child), 0.6).addScaledVector(padN, S.rad + r);
  // the knuckle row, square to the pad's facing, leaned R.lean degrees (about the facing) so the lower fingers can reach
  const dir = fr.K.clone().addScaledVector(padN, -fr.K.dot(padN)).normalize().applyAxisAngle(padN, (globalThis.LEAN ?? -25) * DEG);
  const face = fr.N.clone().addScaledVector(dir, -fr.N.dot(dir)).normalize();
  R.webMissMm = null; R.webAt = null;
  return { at: toL(Pi.sub(fr.W)), dir: toL(dir), face: toL(face) };
}
function writeFrameL(R, grip) {
  if (grip.style === 'upright') return uprightFrameL(R, grip);
  const fr = frameOf(R), qi = fr.q.clone().invert(), toL = v => v.clone().applyQuaternion(qi), r = grip.depth + TOL.touch, k = R.F.stature / 1.75;
  for (const f of FINGERS) setDigit(R, f, WRITE_SEED[f]); setDigit(R, 'thumb', WRITE_SEED.thumb);
  const Dg = R.digits.index, S = Dg.segs[2], cum = WRITE_SEED.index.reduce((x, y) => x + y, 0) * DEG;
  const padN = fr.N.clone().applyAxisAngle(Dg.axL.clone().applyQuaternion(fr.q), cum);
  const Pi = wp(S.bone).lerp(wp(S.child), 0.5).addScaledVector(padN.clone().addScaledVector(fr.K, R.padK ?? 1.0).normalize(), S.rad + r);
  const web0 = wp(Dg.bones[0]).lerp(wp(R.digits.thumb.bones[1]), 0.5);
  // the web point: the joints' midpoint moved along N and D until the web's skin (palm, thumb's first two segments,
  // index's first two) clears the shaft by 0.4 to 1.2 mm, the smallest move that does it
  if (!R.webOff) { const skin = [...R.palmSegs, ...R.digits.thumb.segs.slice(0, 2), ...R.digits.index.segs.slice(0, 2)].flatMap(S2 => segWorld(S2).map(p => p.clone()));
    let best = null;
    for (let n = -12; n <= 12; n += 1) for (let d = -6; d <= 14; d += 1) { const w = web0.clone().addScaledVector(fr.N, n * 0.001 * k).addScaledVector(fr.D, d * 0.001 * k), u = w.clone().sub(Pi).normalize();
      let c = 1e9; for (const p of skin) { const t = p.clone().sub(Pi).dot(u); if (t < 0) continue; c = Math.min(c, p.clone().sub(Pi).addScaledVector(u, -t).length() - grip.depth); }
      const cost = (c < 0.0004 || c > 0.0012 ? 1 + Math.abs(c - 0.0008) : 0) + 0.001 * Math.hypot(n, d); if (!best || cost < best.cost) best = { cost, n, d, c }; }
    R.webOff = best; }
  const web = web0.addScaledVector(fr.N, R.webOff.n * 0.001 * k).addScaledVector(fr.D, R.webOff.d * 0.001 * k);
  const dir = web.clone().sub(Pi).normalize(), face = fr.N.clone().addScaledVector(dir, -fr.N.dot(dir)).normalize();
  R.webMissMm = +(R.webOff.c * 1000).toFixed(1); R.webAt = [R.webOff.n, R.webOff.d];
  return { at: toL(Pi.sub(fr.W)), dir: toL(dir), face: toL(face) };
}
// a tripod digit searched whole: every segment kept clear of the shaft (MARGIN) and of the digits done (0.9 mm), the
// last segment as close to the shaft as it goes, a little weight on staying near the seed so the hand stays natural
// side (upright hold): +1 keeps the last segment on the palm's side of the shaft, -1 on the far side
function padSearch(R, H, f, seed, others, side = 0) {
  const Dg = R.digits[f], th = f === 'thumb', rng = th ? ((globalThis.TIPMAX ??= 45) != null ? [RANGE.thumb[0], RANGE.thumb[1], [RANGE.thumb[2][0], globalThis.TIPMAX]] : RANGE.thumb) : RANGE.finger;
  const axA = H.grip.at.clone().applyMatrix4(H.prop.matrixWorld), axD = H.grip.dir.clone().transformDirection(H.prop.matrixWorld);
  const pc0 = palmCentre(R), inW = pc0.clone().sub(axA).addScaledVector(axD, -pc0.clone().sub(axA).dot(axD)).normalize();
  const latW = axD.clone().cross(inW).normalize();
  const score = a => { setDigit(R, f, a); let worst = 1e9;
    if (side) { const S = Dg.segs[2], m = wp(S.bone).lerp(wp(S.child), 0.6).sub(axA);
      // part 10: the thumb may be held on the shaft's lateral side (across the palm-to-far line, TLAT +1 or -1), not the palm side
      const TL = globalThis.TLAT ?? -1; if (th && TL && side) { worst = Math.min(worst, TL * m.dot(latW) - (globalThis.THLAT ?? 0.006));
        // part 12 (his note on look-5): the shaft sits between the thumb and the index finger, so the thumb never crosses
        // the palm side of the shaft: its tip stays no nearer the palm than its pad (the pad faces the index finger)
        const tp = wp(S.child).sub(axA); if (globalThis.THTIP !== 0) worst = Math.min(worst, m.dot(inW) - tp.dot(inW) + (globalThis.THTIP ?? 0.002)); } else worst = Math.min(worst, side * m.dot(inW) - 0.002); }
    for (let j = 0; j < 3; j++) { const c = clearance(R, H, Dg.segs[j], others, j > 0); worst = Math.min(worst, c.prop - MARGIN, (j === 0 && !th ? 1e9 : c.nb + 0.0009)); }
    const pc = clearance(R, H, Dg.segs[2], [], true).prop; let dev = 0; for (let j = 0; j < 3; j++) dev += Math.abs(a[j] - seed[j]);
    // part 11 (his photo): the thumb lies across the shaft, its last segment square to it, its pad at the height midway between the index and middle pads
    let pose = 0; if (th && globalThis.THFLAT !== 0) { const S = Dg.segs[2], aa = wp(S.bone), bb = wp(S.child), sd = bb.clone().sub(aa).normalize(), pm = aa.clone().lerp(bb, 0.6);
      const hh = g => { const T = R.digits[g].segs[2]; return wp(T.bone).lerp(wp(T.child), 0.6).sub(axA).dot(axD); };
      pose = (globalThis.THPERP ?? 0.01) * Math.max(0, Math.abs(sd.dot(axD)) - 0.35) + (globalThis.THMID ?? 0.3) * Math.abs(pm.clone().sub(axA).dot(axD) - (hh('index') + hh('middle')) / 2); }
    return { worst, cost: pose + Math.max(0, pc - MARGIN) + (f === 'index' ? 0.0001 : th ? (globalThis.THW ?? 0.00003) : 0.00001) * dev }; };
  let best = null, least = null; const tryA = a => { for (let j = 0; j < 3; j++) if (a[j] < rng[j][0] || a[j] > rng[j][1]) return; const s = score(a);
    if (!least || s.worst > least.worst) least = { a: a.slice(), worst: s.worst, cost: s.cost };
    if (s.worst >= 0 && (!best || s.cost < best.cost)) best = { a: a.slice(), worst: s.worst, cost: s.cost }; };
  const st = th ? [5, 5, 10] : [4, 4, 6];
  for (let x = rng[0][0]; x <= rng[0][1]; x += st[0]) for (let y = rng[1][0]; y <= rng[1][1]; y += st[1]) for (let z = rng[2][0]; z <= rng[2][1]; z += st[2]) tryA([x, y, z]);
  const c0 = (best || least).a;
  for (let x = c0[0] - st[0]; x <= c0[0] + st[0]; x += 1) for (let y = c0[1] - st[1]; y <= c0[1] + st[1]; y += 1) for (let z = c0[2] - st[2]; z <= c0[2] + st[2]; z += 2) tryA([x, y, z]);
  const pick = best || least; setDigit(R, f, pick.a);
  return { angles: pick.a.map(x => +x.toFixed(1)), why: [best ? 'pad on shaft' : 'least inside', 'pad ' + (pick.cost * 1000).toFixed(1)] };
}
function anchorL(R, grip) {
  const fr = frameOf(R);
  if (grip.type === 'wrap') return R.hollowL.clone().add(R.NL.clone().multiplyScalar(grip.depth + TOL.touch));
  if (grip.type === 'write') return writeFrameL(R, grip).at;
  for (const f of FINGERS) setDigit(R, f, SEED[f]);
  const S = R.digits.index.segs[1], a = wp(S.bone), c = wp(S.child), mid = a.clone().lerp(c, 0.55), Dg = R.digits.index;
  const palmSide = fr.N.clone().applyAxisAngle(Dg.axL.clone().applyQuaternion(fr.q), (SEED.index[0] + SEED.index[1]) * DEG);
  return mid.addScaledVector(palmSide, S.rad + grip.depth + TOL.touch).sub(fr.W).applyQuaternion(fr.q.clone().invert());
}
// the hand's world turn that lays the knuckle row along the grip axis (tilted across the palm by the record's tilt)
// with the palm facing the prop's palm side
function handTurnFor(R, H) {
  const dirW = H.grip.dir.clone().transformDirection(H.prop.matrixWorld), faceW = H.grip.face.clone().transformDirection(H.prop.matrixWorld);
  if (H.grip.type === 'write') { const w = writeFrameL(R, H.grip), Nw = faceW.clone().negate();
    const Mw = new THREE.Matrix4().makeBasis(dirW, Nw, dirW.clone().cross(Nw)), Ml = new THREE.Matrix4().makeBasis(w.dir, w.face, w.dir.clone().cross(w.face));
    return Q().setFromRotationMatrix(Mw.multiply(Ml.transpose())); }
  const Nw = faceW.clone().negate(), Kw = dirW.clone().addScaledVector(Nw, -dirW.dot(Nw)).normalize().applyAxisAngle(Nw, -H.grip.tilt * DEG);
  const KL = R.KL, NL = R.NL.clone().addScaledVector(R.KL, -R.NL.dot(R.KL)).normalize();
  const Mw = new THREE.Matrix4().makeBasis(Kw, Nw, Kw.clone().cross(Nw)), Ml = new THREE.Matrix4().makeBasis(KL, NL, KL.clone().cross(NL));
  return Q().setFromRotationMatrix(Mw.multiply(Ml.transpose()));
}
// two-bone IK (anim.js ik2): a (shoulder) and b (elbow) bend so c (wrist) reaches T, the elbow toward the pole P
function ik2(F, a, b, c, T, P) {
  F.root.updateMatrixWorld(true); const A = wp(F.bones[a]), B = wp(F.bones[b]), C = wp(F.bones[c]);
  const la = B.distanceTo(A), lb = C.distanceTo(B), d0 = T.clone().sub(A), d = THREE.MathUtils.clamp(d0.length(), Math.abs(la - lb) + 1e-3, (la + lb) * 0.999), u = d0.normalize();
  const ca = THREE.MathUtils.clamp((la * la + d * d - lb * lb) / (2 * la * d), -1, 1), w = P.clone().addScaledVector(u, -P.dot(u)); if (w.lengthSq() < 1e-8) return; w.normalize();
  const B1 = A.clone().addScaledVector(u, la * ca).addScaledVector(w, la * Math.sqrt(1 - ca * ca));
  aimBone(F.bones[a], F.bones[b], B1.clone().sub(A)); aimBone(F.bones[b], F.bones[c], A.clone().addScaledVector(u, d).sub(B1));
}

// grab: the right arm reaches the prop where it is, the digits close on it, the prop is fixed to the hand.
// prop: an Object3D placed in the world; grip: its record; pole: where the elbow points.
export function grab(F, prop, grip, pole) {
  const R = rigHand(F, 'r'); prop.updateMatrixWorld(true);
  const H = { prop, grip, inv: prop.matrixWorld.clone().invert() };
  const aL = anchorL(R, grip), axisW = grip.at.clone().applyMatrix4(prop.matrixWorld);
  const qh = handTurnFor(R, H);
  const reach = () => { for (let it = 0; it < 4; it++) {
    const T = axisW.clone().sub(aL.clone().applyQuaternion(qh));
    ik2(F, 'shoulderR', 'elbowR', 'wristR', T, pole);
    setWorldQ(R.W, qh); F.root.updateMatrixWorld(true);
  } };
  // seat the palm: the palm's skin and the roots of the fingers' base segments (they barely move as the fingers
  // close) just touch the prop. The hollow gives the first guess; a flat or wide prop moves the hand off or onto it.
  // (Only the wrap seats on the palm; the writing hold keeps the hollow empty.)
  reach();
  if (grip.type === 'wrap') for (let it = 0; it < 4; it++) {
    for (const f of FINGERS) setDigit(R, f, [0, 0, 0]);
    let c = 1e9; for (const S of R.palmSegs) for (const p of segWorld(S)) c = Math.min(c, propDist(H, p));
    const fixLoc = R.palmRoots.map(([S, idx]) => idx.map(m => V(S.loc[m], S.loc[m + 1], S.loc[m + 2]).applyMatrix4(S.bone.matrixWorld)));
    for (const pts of fixLoc) for (const p of pts) c = Math.min(c, propDist(H, p));
    const shift = c - 2 * TOL.touch; if (Math.abs(shift) < 2e-4) break;
    aL.addScaledVector(R.NL, -shift); reach();
  }
  // a wrap's thumb bends round the axis, the way that carries its tip toward the fingers
  R.thumbAxis = null;
  if (grip.type === 'wrap') { const dW = grip.dir.clone().transformDirection(prop.matrixWorld).normalize(); for (const f of FINGERS) setDigit(R, f, SEED[f]);
    const tgt = wp(R.digits.middle.bones[2]), Dg = R.digits.thumb; R.thumbAxis = dW; setDigit(R, 'thumb', [SEED.thumb[0], 0, 0]); const d0 = wp(Dg.bones[3]).distanceTo(tgt);
    setDigit(R, 'thumb', [SEED.thumb[0], 20, 0]); if (wp(Dg.bones[3]).distanceTo(tgt) > d0) R.thumbAxis = dW.clone().negate(); }
  { const fr = frameOf(R); H.palmPlane = [palmCentre(R), fr.N]; }
  // the digits: the four fingers index first (each stops at the one before it), then the thumb against them all
  const done = [], out = {};
  const UP = grip.style === 'upright', SD = UP ? UPRIGHT_SEED : grip.type === 'write' ? WRITE_SEED : SEED;
  const SIDE = { index: -1, middle: -1, ring: 1, thumb: 1 };
  for (const f of FINGERS) setDigit(R, f, SD[f]);
  setDigit(R, 'thumb', SD.thumb);
  for (const f of [...FINGERS, 'thumb']) {
    const nb = done.flatMap(g => R.digits[g].segs.filter((S, j) => !(f === 'thumb' && g === 'index' && j === 0)).map(capsule));
    out[f] = UP ? (f === 'pinky' ? keepDigit(R, H, f, SD[f], nb) : padSearch(R, H, f, SD[f], nb, SIDE[f])) : grip.type !== 'wrap' ? (['ring', 'pinky'].includes(f) ? keepDigit(R, H, f, SD[f], nb) : padSearch(R, H, f, SD[f], nb)) : f === 'thumb' ? wrapThumb(R, H, done.flatMap(g => R.digits[g].segs.slice(1).map(capsule))) : wrapFinger(R, H, f, nb, H.palmPlane); done.push(f);
  }
  F.root.updateMatrixWorld(true); F.mesh.skeleton.update();
  // step 4: the prop in the hand's frame
  H.inHand = R.W.matrixWorld.clone().invert().multiply(prop.matrixWorld);
  H.solve = out; H.anchorL = aL; H.R = R;
  return H;
}
// step 4, every frame after the grab: the prop follows the hand
export function ride(H) { H.R.W.updateMatrixWorld(true); H.prop.matrixAutoUpdate = false; H.prop.matrix.copy(H.R.W.matrixWorld).multiply(H.inHand); H.prop.matrixWorld.copy(H.prop.matrix); H.inv = H.prop.matrixWorld.clone().invert(); }

// step 5: the gaps, on the real skinned mesh. Pad gap: the nearest skin of each digit's last segment to the prop's
// surface (negative is inside). Deepest overlap: the deepest hand vertex inside the prop. Finger overlap: the deepest a
// vertex of one digit sits inside another digit's capsule. Wrap: the degrees round the axis, at the grip station,
// where skin lies within 6 mm of the surface.
export function measure(F, H) {
  const R = H.R, G = F.mesh.geometry, P = G.attributes.position, v = V(), bi = n => F.boneName.indexOf(n);
  F.root.updateMatrixWorld(true);
  const digitOf = new Map(); for (const [f, Dg] of Object.entries(R.digits)) Dg.bones.slice(0, 3).forEach((b, j) => digitOf.set(bi(b.name), [f, j]));
  const pad = {}, deep = { d: 1e9, at: '' }; let fo = { d: 1e9, at: '' }, thumbOn = 'prop';
  const caps = Object.fromEntries(Object.entries(R.digits).map(([f, Dg]) => [f, Dg.segs.map(capsule)]));
  const axisW = H.grip.at.clone().applyMatrix4(H.prop.matrixWorld), dirW = H.grip.dir.clone().transformDirection(H.prop.matrixWorld);
  const e1 = H.grip.face.clone().transformDirection(H.prop.matrixWorld), e2 = dirW.clone().cross(e1), bins = new Array(36).fill(false);
  for (const i of R.handVerts) {
    v.fromBufferAttribute(P, i); F.mesh.applyBoneTransform(i, v); v.applyMatrix4(F.mesh.matrixWorld);
    const d = propDist(H, v), dj = digitOf.get(F.dom[i]), name = dj ? dj[0] + ' ' + ['base', 'middle', 'tip'][dj[1]] : 'palm';
    if (d < deep.d) { deep.d = d; deep.at = name; }
    if (dj && dj[1] === 2) pad[dj[0]] = Math.min(pad[dj[0]] ?? 1e9, d);
    // a wrap's thumb may close over the fingers rather than the prop (Feix's small-diameter wrap): its pad counts the
    // nearer of the two, and the page says which
    if (dj && dj[0] === 'thumb' && dj[1] === 2 && H.grip.type === 'wrap') for (const g of FINGERS) for (const [a, b, r] of caps[g].slice(1)) { const o = distSeg(v, a, b) - r; if (o < pad.thumb) { pad.thumb = o; thumbOn = g; } }
    if (dj) for (const [g, cs] of Object.entries(caps)) { if (g === dj[0]) continue; for (const [ci, [a, b, r]] of cs.entries()) { if (dj[1] === 0 && ci === 0) continue; const o = distSeg(v, a, b) - r; if (o < fo.d) { fo = { d: o, at: `${dj[0]} into ${g}` }; } } }
    const rel = v.clone().sub(axisW), along = rel.dot(dirW); if (Math.abs(along) < 0.03 * H.grip.k && d < 0.006) { const ang = Math.atan2(rel.dot(e2), rel.dot(e1)); bins[Math.floor(((ang / Math.PI + 1) / 2) * 36) % 36] = true; }
  }
  const mm = x => +(x * 1000).toFixed(1);
  const fr = frameOf(R), fore = wp(R.W).sub(wp(F.bones.elbowR)).normalize();
  return {
    prop: H.grip.name, hold: H.grip.type,
    thumbPose: (() => { const aA = H.grip.at.clone().applyMatrix4(H.prop.matrixWorld), aD = H.grip.dir.clone().transformDirection(H.prop.matrixWorld), q = g => { const T = R.digits[g].segs[2]; return wp(T.bone).lerp(wp(T.child), 0.6).sub(aA).dot(aD); }, T = R.digits.thumb.segs[2], sd = wp(T.child).sub(wp(T.bone)).normalize();
      return { padHeightMm: { thumb: mm(q('thumb')), index: mm(q('index')), middle: mm(q('middle')) }, lastSegAngleToShaftDeg: +(Math.acos(Math.abs(sd.dot(aD))) / DEG).toFixed(0) }; })(),
    thumbPadOn: thumbOn, fingerOverlapNote: 'base segment to base segment not counted (the knuckle webbing is one sheet of skin)',
    padGapMm: Object.fromEntries(Object.entries(pad).map(([f, d]) => [f, mm(d)])),
    deepestIntoPropMm: mm(Math.min(0, deep.d)), deepestAt: deep.at,
    fingerOverlapMm: mm(Math.min(0, fo.d)), fingerOverlapAt: fo.d < 0 ? fo.at : 'none',
    wrapDeg: bins.filter(Boolean).length * 10,
    wristBendDeg: +(Math.acos(THREE.MathUtils.clamp(fr.D.dot(fore), -1, 1)) / DEG).toFixed(0),
    angles: Object.fromEntries(Object.entries(H.solve).map(([f, o]) => [f, o.angles])),
    stoppedBy: Object.fromEntries(Object.entries(H.solve).map(([f, o]) => [f, o.why.join('/')])),
    webClearMm: R.webMissMm, webMoveMm: R.webAt,
    pass: { padsWithin2mm: (() => { const UP = H.grip.style === 'upright', on = UP ? ['thumb', 'index', 'middle', 'ring'] : H.grip.type === 'write' ? ['thumb', 'index', 'middle'] : Object.keys(pad); return on.filter(f => Math.abs(pad[f]) <= TOL.pad).length + ' of ' + on.length + (UP ? ' (five-finger hold: thumb near side, index and middle far side, ring nail side; little rests on ring)' : H.grip.type === 'write' ? ' (tripod: thumb, index, middle; ring and little curl free)' : ''); })(), overlapUnder1mm: deep.d > -TOL.overlap && fo.d > -TOL.overlap },
  };
}

// the hand's world turn from a wanted knuckle row K and finger direction D (a test page puts the hand somewhere
// natural with this, then places the prop for it with placeFor)
export function handTurn(R, Kw, Dw) {
  const d = Dw.clone().normalize(), kk = Kw.clone().addScaledVector(d, -Kw.dot(d)).normalize(), KL = R.KL, DL = R.DL.clone().addScaledVector(R.KL, -R.DL.dot(R.KL)).normalize();
  const Mw = new THREE.Matrix4().makeBasis(kk, d, kk.clone().cross(d)), Ml = new THREE.Matrix4().makeBasis(KL, DL, KL.clone().cross(DL));
  return Q().setFromRotationMatrix(Mw.multiply(Ml.transpose()));
}
export function setHandTurn(R, q) { setWorldQ(R.W, q); R.F.root.updateMatrixWorld(true); }
export { ik2 };
// put a prop where its grip would sit in the hand as the hand is now (the inverse of the reach)
export function placeFor(R, prop, grip) {
  if (grip.type === 'write') { const fr = frameOf(R), w = writeFrameL(R, grip), dirW = w.dir.applyQuaternion(fr.q), faceW = w.face.applyQuaternion(fr.q).negate();
    const x = dirW.clone().cross(faceW).normalize(), lx = grip.dir.clone().cross(grip.face).normalize();
    const qp = Q().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, dirW, faceW).multiply(new THREE.Matrix4().makeBasis(lx, grip.dir, grip.face).transpose()));
    prop.quaternion.copy(qp); prop.position.copy(fr.W.clone().add(w.at.applyQuaternion(fr.q))).sub(grip.at.clone().applyQuaternion(qp)); prop.updateMatrixWorld(true); return; }
  const fr = frameOf(R), Nw = fr.N, Kw = fr.K.clone().applyAxisAngle(Nw, grip.tilt * DEG);
  const dirW = Kw, faceW = Nw.clone().negate(), x = dirW.clone().cross(faceW).normalize();
  const lx = grip.dir.clone().cross(grip.face).normalize();
  const Mw = new THREE.Matrix4().makeBasis(x, dirW, faceW), Ml = new THREE.Matrix4().makeBasis(lx, grip.dir, grip.face);
  const qp = Q().setFromRotationMatrix(Mw.multiply(Ml.transpose()));
  const axisW = fr.W.clone().add(anchorL(R, grip).applyQuaternion(fr.q));
  prop.quaternion.copy(qp); prop.position.copy(axisW).sub(grip.at.clone().applyQuaternion(qp)); prop.updateMatrixWorld(true);
}
// a check for the test page: each segment's clearance (prop, neighbours) for a digit at angles a, others = digits done
export function digitClear(H, f, a, others = []) { const R = H.R; setDigit(R, f, a); const caps = others.flatMap(g => R.digits[g].segs.map(capsule)); return R.digits[f].segs.map(S => { const c = clearance(R, H, S, caps); return [+(c.prop * 1000).toFixed(1), +(c.nb * 1000).toFixed(1)]; }); }
