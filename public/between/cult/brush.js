// Brush in hand, round 1 (2026-11-05, his note on ee2-brush-hand-look-1: "Do research on rendering brushes in hands and
// also start looking re: how our cultivation models will be able to do this action").
// How games hold a prop, done on the cultivation figure's own bones (UBC rig: hand_r and five fingers of three joints):
//   1. a grip pose: each finger joint turned toward the palm by a set angle, on top of the figure's relaxed hand. The
//      grip is the calligrapher's five-finger hold (wu zhi zhi bi fa): thumb presses, index hooks over the front,
//      middle hooks below it, ring pushes from behind, little finger rests under the ring.
//   2. the prop's socket: the pinch point between the thumb tip and the index finger's last joint. The brush passes
//      through it and is kept upright in the world (bi zheng, "the brush stands straight"); the hand moves, the brush
//      does not tilt. Unreal and Unity do the same with a socket on the hand bone; here the socket is computed from the
//      fingers each frame, so the brush can never float off the fingers.
//   3. reach: a two-bone IK on the right arm (upper arm, forearm) puts the brush tip on the paper; the pose solves for
//      the wrist, measures where the tip landed and corrects twice.
//   4. the stroke itself is not animation: the tip's path is painted onto the strip's texture as it moves, wider where
//      the tip presses down (the hair splays), in the ember's ink.
import * as THREE from 'three';
import { aim, resetPose } from './figure.js';
import { holdPlace, bestRoll } from './holdfit.js';
import { rigHand } from './hold.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const wp = b => b.getWorldPosition(V());
const D = Math.PI / 180;

// grip angles in degrees per joint (01, 02, 03), added to the relaxed hand's 18 deg. Round 2 (his note on
// ee2-brush-cult-look-1, "pretty awkward"): the palm now stands upright and faces the body's midline, so the knuckle row
// runs top to bottom and the fingers stack on the shaft as the five-finger hold does: index highest and hooked over
// the front, middle under it, ring pushing back with its nail side, little finger tucked behind the ring.
export const GRIP = {
  index: [28, 52, 38], middle: [36, 56, 40], ring: [52, 66, 44], pinky: [60, 70, 46],
  thumb: { adduct: 30, flex: [14, 26] },
};

const bone = (F, n) => F.mesh.skeleton.bones.find(b => b.name === n);

// read a hand's rest frame once: the hand's axis (wrist to middle knuckle) and its palm normal, in the hand bone's
// local space, and each finger joint's curl axis in its own local space
function handRig(F, s) {
  const key = 'handRig' + s; if (F[key]) return F[key];
  resetPose(F); F.root.updateMatrixWorld(true);
  const hand = F.bones['wrist' + s.toUpperCase()], q0i = hand.getWorldQuaternion(new THREE.Quaternion()).invert();
  const axisW = wp(bone(F, `middle_01_${s}`)).sub(wp(hand)).normalize();
  const palmW = V(0, -1, 0); palmW.addScaledVector(axisW, -palmW.dot(axisW)).normalize();
  const R = { hand, axisL: axisW.clone().applyQuaternion(q0i), palmL: palmW.clone().applyQuaternion(q0i), joints: [] };
  for (const f of ['index', 'middle', 'ring', 'pinky']) for (const j of ['01', '02', '03']) {
    const b = bone(F, `${f}_${j}_${s}`); if (!b) continue;
    const fd = wp(bone(F, `${f}_${j === '03' ? '04_leaf' : '0' + (+j + 1)}_${s}`)).sub(wp(b)).normalize();
    const ax = V().crossVectors(fd, palmW).normalize();
    R.joints.push({ b, f, j: +j - 1, rest: b.quaternion.clone(), la: ax.applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion()).invert()) });
  }
  for (const j of ['01', '02', '03']) { const b = bone(F, `thumb_${j}_${s}`); R['t' + j] = { b, rest: b.quaternion.clone() }; }
  F[key] = R; return R;
}
export const rig = F => handRig(F, 'r');

// close the right hand on the brush (g: 0 open, 1 the full grip; press tightens the index and thumb a little)
export function grip(F, g = 1, press = 0) {
  const R = rig(F);
  for (const J of R.joints) { let d = GRIP[J.f][J.j] + (J.f === 'index' ? 6 * press : 0); J.b.quaternion.copy(J.rest).multiply(new THREE.Quaternion().setFromAxisAngle(J.la, d * D * g)); }
  const turn = (b, axW, a) => { F.root.updateMatrixWorld(true); const la = axW.clone().applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize(); b.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(la, a)); };
  for (const j of ['01', '02', '03']) R['t' + j].b.quaternion.copy(R['t' + j].rest);
  F.root.updateMatrixWorld(true);
  const hq = F.bones.wristR.getWorldQuaternion(new THREE.Quaternion());
  const axisW = R.axisL.clone().applyQuaternion(hq), palmW = R.palmL.clone().applyQuaternion(hq);
  turn(R.t01.b, axisW, -GRIP.thumb.adduct * D * g);
  F.root.updateMatrixWorld(true);
  for (const [k, a] of [['t02', GRIP.thumb.flex[0] + 4 * press], ['t03', GRIP.thumb.flex[1] + 4 * press]]) {
    const td = wp(bone(F, 'thumb_03_r')).sub(wp(bone(F, 'thumb_01_r'))).normalize();
    turn(R[k].b, V().crossVectors(td, palmW).normalize(), a * D * g);
  }
  F.root.updateMatrixWorld(true);
}

// the left hand lies flat on the paper: fingers nearly straight, a little spread
function flatHand(F) {
  const R = handRig(F, 'l');
  for (const J of R.joints) J.b.quaternion.copy(J.rest).multiply(new THREE.Quaternion().setFromAxisAngle(J.la, -12 * D * (J.j === 0 ? 1 : 0.8)));
  F.root.updateMatrixWorld(true);
}

// set a hand's world orientation from a wanted axis and palm normal
function orientHand(F, axis, palm, s = 'r') {
  const R = handRig(F, s), h = R.hand;
  const a = axis.clone().normalize(), p = palm.clone().addScaledVector(a, -palm.dot(a)).normalize(), c = V().crossVectors(a, p);
  const aL = R.axisL, pL = R.palmL.clone().addScaledVector(aL, -R.palmL.dot(aL)).normalize(), cL = V().crossVectors(aL, pL);
  const Mw = new THREE.Matrix4().makeBasis(a, p, c), Ml = new THREE.Matrix4().makeBasis(aL, pL, cL);
  const Qw = new THREE.Quaternion().setFromRotationMatrix(Mw.multiply(Ml.transpose()));
  F.root.updateMatrixWorld(true);
  h.quaternion.copy(h.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(Qw));
  F.root.updateMatrixWorld(true);
}

// two-bone IK: the end of `b` to `t`, the middle joint bent toward `pole`
function ik(F, a0, a1, a2, t, pole) {
  const S = wp(F.bones[a0]), E = wp(F.bones[a1]), W = wp(F.bones[a2]);
  const a = S.distanceTo(E), b = E.distanceTo(W), toT = t.clone().sub(S), d = THREE.MathUtils.clamp(toT.length(), Math.abs(a - b) + 1e-3, a + b - 1e-3);
  const dir = toT.normalize(), cosA = (a * a + d * d - b * b) / (2 * a * d), sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  const pp = pole.clone().addScaledVector(dir, -pole.dot(dir)).normalize();
  const Eo = S.clone().addScaledVector(dir, a * cosA).addScaledVector(pp, a * sinA);
  aim(F, a0, a1, Eo.clone().sub(S));
  aim(F, a1, a2, S.clone().addScaledVector(dir, d).sub(Eo));
}

// the socket, round 3: the shaft's line inside the hand. Round 2 took the point between the thumb's and the index's
// tips, which is outside the fingers, so the brush hung beside them. Now: a point a set way down the hand's axis from
// the wrist and out from the palm by the hollow's depth, fixed in the hand's frame (it does not move as the fingers
// close); the fingers then close on it.
export const SOCKET = { along: 0.112, out: 0.040, side: 0.000 };
export function pinch(F) {
  const R = rig(F), hq = R.hand.getWorldQuaternion(new THREE.Quaternion()), k = F.stature / 1.75;
  const ax = R.axisL.clone().applyQuaternion(hq).normalize(), pa = R.palmL.clone().applyQuaternion(hq).normalize(), sd = V().crossVectors(ax, pa);
  return wp(R.hand).addScaledVector(ax, SOCKET.along * k).addScaledVector(pa, SOCKET.out * k).addScaledVector(sd, SOCKET.side * k);
}
// distance from a point to the shaft line (through c along d)
const toLine = (p, c, d) => { const v = p.clone().sub(c); return v.addScaledVector(d, -v.dot(d)).length(); };
// close each finger until its pad meets the shaft: the curl that brings the finger's last segment to the shaft's skin
// (shaft radius plus the finger's half-thickness) is found by a search, per finger, every frame. Ring and little finger
// tuck behind (the ring's nail pushes back, the little finger under it) at a fixed curl; the thumb's pad closes from
// the other side.
export function wrapGrip(F, dir, press = 0) {
  const R = rig(F), k = F.stature / 1.75, c = pinch(F), d = dir.clone().normalize();
  const want = { index: 0.0115 * k, middle: 0.0115 * k, thumb: 0.0125 * k };
  const joints = f => R.joints.filter(J => J.f === f);
  const setF = (f, g) => { for (const J of joints(f)) { const a = GRIP[J.f][J.j] * g + (f === 'index' ? 5 * press : 0); J.b.quaternion.copy(J.rest).multiply(new THREE.Quaternion().setFromAxisAngle(J.la, a * D)); } F.root.updateMatrixWorld(true); };
  const padOf = f => wp(bone(F, `${f}_03_${'r'}`)).lerp(wp(bone(F, `${f}_04_leaf_r`)), 0.55);
  for (const f of ['index', 'middle']) { let best = 1, be = 1e9; for (let g = 0.2; g <= 2.2; g += 0.05) { setF(f, g); const e = Math.abs(toLine(padOf(f), c, d) - want[f]) + (toLine(wp(bone(F, `${f}_04_leaf_r`)), c, d) < want[f] * 0.6 ? 0.01 : 0); if (e < be) { be = e; best = g; } } setF(f, best); }
  setF('ring', 1.25); setF('pinky', 1.3);
  // thumb (round 3): a two-joint reach that lays the thumb's pad on the shaft from the wrist's side, opposite the index
  // and middle fingers, so the shaft is closed in between them; the thumb's knuckle bows out away from the palm
  const hq = R.hand.getWorldQuaternion(new THREE.Quaternion()), ax = R.axisL.clone().applyQuaternion(hq).normalize(), pa = R.palmL.clone().applyQuaternion(hq).normalize();
  for (const j of ['01', '02', '03']) R['t' + j].b.quaternion.copy(R['t' + j].rest); F.root.updateMatrixWorld(true);
  const tb = j => bone(F, `thumb_${j}_r`), T = c.clone().addScaledVector(ax, -want.thumb).addScaledVector(pa, 0.004 * k).addScaledVector(d, 0.006 * k);
  const reachB = (b0, b1, b2, t, pole) => { const S0 = wp(b0), E0 = wp(b1), W0 = wp(b2), la = S0.distanceTo(E0), lb = E0.distanceTo(W0);
    const toT = t.clone().sub(S0), dd = THREE.MathUtils.clamp(toT.length(), Math.abs(la - lb) + 1e-4, la + lb - 1e-4), dr = toT.normalize();
    const cA = (la * la + dd * dd - lb * lb) / (2 * la * dd), sA = Math.sqrt(Math.max(0, 1 - cA * cA)), pp = pole.clone().addScaledVector(dr, -pole.dot(dr)).normalize();
    const Eo = S0.clone().addScaledVector(dr, la * cA).addScaledVector(pp, la * sA);
    const aimB = (bb, cb, to) => { F.root.updateMatrixWorld(true); const cur = wp(cb).sub(wp(bb)).normalize(), dq = new THREE.Quaternion().setFromUnitVectors(cur, to.clone().normalize()), bw = bb.getWorldQuaternion(new THREE.Quaternion()), pw = bb.parent.getWorldQuaternion(new THREE.Quaternion()); bb.quaternion.copy(pw.invert().multiply(dq.multiply(bw))); F.root.updateMatrixWorld(true); };
    aimB(b0, b1, Eo.clone().sub(S0)); aimB(b1, b2, S0.clone().addScaledVector(dr, dd).sub(Eo)); };
  // the pad, not the nail tip, meets the shaft: aim the tip a little past the contact point
  const padT = T.clone().addScaledVector(d, 0.004 * k);
  for (let i = 0; i < 3; i++) { reachB(tb('02'), tb('03'), tb('04_leaf'), padT, ax.clone().negate().addScaledVector(pa, -0.6)); }
  const bte = toLine(wp(tb('03')).lerp(wp(tb('04_leaf')), 0.5), c, d) - want.thumb;
  F.gripErr = { thumb: bte };
}

// a turn about the world up axis applied to a bone (the chest turns a little toward the writing hand)
function twist(F, n, ang) {
  const b = F.bones[n]; F.root.updateMatrixWorld(true);
  const la = V(0, 1, 0).applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();
  b.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(la, ang)); F.root.updateMatrixWorld(true);
}

// The writing pose, round 3 (his B on ee2-brush-cult-look-2: "The arm isn't connected the the shoulder. And so the
// movement seems unnatural. The whole body is active with brush strokes as separate form pencils and the brush isn't
// inside of the hand but hanging outside of it." and "Be sure we are comparing new changes like this to approved
// references so we can spot drift and errors").
// What changed from round 2, and why:
//   - the arm is carried by the shoulder: the clavicle protracts and drops toward the tip (it was left at rest, so the
//     upper arm swung alone out of a still shoulder and the skin and the sleeve tore at the seam); the elbow hangs out and
//     back at a modest angle instead of being lifted to shoulder height, the range the robe's shells were cut to follow.
//   - the wrist stays straight: the hand's axis follows the forearm, and the hand's roll is put on the forearm (the
//     foreSwing helper spreads it from elbow to wrist) instead of twisting the hand at the wrist.
//   - the whole body writes: a brush is moved from the body, not the fingers as a pencil is, so the chest turns toward
//     the tip, the weight shifts over the writing side and the lean deepens as the stroke comes down the paper.
//   - the pelvis stays near upright and the hips do not sit back: the skirt is rigid to the pelvis (his ruling
//     2026-11-02), so round 2's pelvis tilt kicked the hem out behind; the bend is taken in the chest and the neck.
//   - the brush goes through the hand: the shaft's line is set inside the hollow of the hand and each finger is curled
//     until its last joint closes on the shaft (wrapGrip), so the fingers hold the brush instead of resting beside it.
// tip: where the brush's point is (world). opts: dir (shaft direction, up by default), lean, turn, shift, look, press,
// leftAt (the left palm on the paper), below (pinch to tip along the shaft).
function twistAbout(b, axisW, ang, root) {
  root.updateMatrixWorld(true);
  const la = axisW.clone().applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();
  b.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(la, ang)); root.updateMatrixWorld(true);
}
// the hand's world frame for a shaft direction and a forearm direction: axis along the forearm, square to the shaft;
// palm upright, facing the body's midline, tilted a little down (the hollow palm)
function handFrame(F, dir, fore) {
  const { l } = F.fr, axis = fore.clone().addScaledVector(dir, -fore.dot(dir)).normalize();
  let palm = V().crossVectors(dir, axis).normalize(); if (palm.dot(l) < 0) palm.negate();
  palm.addScaledVector(V(0, -1, 0), 0.25).addScaledVector(axis, -palm.dot(axis)).normalize();
  return { axis, palm };
}
// put the hand at a world orientation, the roll about the forearm going to the forearm (no twist at the wrist)
function setHand(F, axis, palm) {
  const R = handRig(F, 'r'), h = R.hand, el = F.bones.elbowR;
  F.root.updateMatrixWorld(true);
  const fore = wp(F.bones.wristR).sub(wp(el)).normalize();
  // where the palm would face with the hand at rest on this forearm, against where it should face, about the forearm
  const hq = h.parent.getWorldQuaternion(new THREE.Quaternion()).multiply(R.restQ || (R.restQ = h.quaternion.clone()));
  const pNow = R.palmL.clone().applyQuaternion(hq), pW = palm.clone();
  pNow.addScaledVector(fore, -pNow.dot(fore)).normalize(); pW.addScaledVector(fore, -pW.dot(fore)).normalize();
  const roll = Math.atan2(V().crossVectors(pNow, pW).dot(fore), pNow.dot(pW));
  twistAbout(el, fore, roll, F.root);
  orientHand(F, axis, palm);
}
export function writePose(F, tip, opts = {}) {
  const { f, l } = F.fr, dn = V(0, -1, 0), up = V(0, 1, 0), k = F.stature / 1.75, r = l.clone().negate();
  const R0 = rig(F); handRig(F, 'l'); if (opts.brush) rigHand(F, 'r'); resetPose(F);
  if (!R0.restQ) R0.restQ = R0.hand.quaternion.clone();
  if (!F.restAnkles) F.restAnkles = { L: wp(F.bones.ankleL), R: wp(F.bones.ankleR) };
  // hips: a little down (soft knees) and over toward the writing side (the weight shift); the pelvis nearly upright
  const lean = opts.lean ?? 0.2, H = F.bones.hips;
  const hw = wp(H).addScaledVector(up, -(opts.sink ?? 0.012) * k).addScaledVector(r, (opts.shift ?? 0.015) * k).addScaledVector(f, 0.005 * k);
  // round 4, seated at the hearth: the hip joint rests SEAT_PAD over the cushion's top (garden.js does the same), the
  // weight shift is a few mm of the pelvis over the writing side, the legs cross under the lap (seat.js crossLegs)
  if (opts.seat) { hw.y = opts.seat.hipY; hw.addScaledVector(f, -(opts.seat.back ?? 0) * k); }
  H.position.copy(H.parent.worldToLocal(hw.clone())); F.root.updateMatrixWorld(true);
  if (opts.seat) { const q = new THREE.Quaternion().setFromAxisAngle(l, -(opts.seat.tilt ?? 0)); H.quaternion.premultiply(q); F.root.updateMatrixWorld(true); }
  aim(F, 'spine01', 'spine', V().copy(up).addScaledVector(f, lean * 0.15));
  aim(F, 'spine', 'spine03', V().copy(up).addScaledVector(f, lean * 0.8).addScaledVector(r, 0.02));
  twist(F, 'spine', -(opts.turn ?? 0.08) * 0.4);
  aim(F, 'spine03', 'neck', V().copy(up).addScaledVector(f, lean * 1.25).addScaledVector(r, 0.03));
  twist(F, 'spine03', -(opts.turn ?? 0.08) * 0.6);
  if (opts.seat) opts.seat.legs(F);
  else for (const [s, sg] of [['L', 1], ['R', -1]]) ik(F, 'hip' + s, 'knee' + s, 'ankle' + s, F.restAnkles[s], V().copy(f).addScaledVector(l, sg * 0.15));
  // the head bows over the tip, the neck taking part of it (a deep bend at the head alone pulled the hair off the nape)
  const look = (opts.look || tip).clone();
  aim(F, 'neck', 'head', V().copy(up).addScaledVector(f, 0.28));
  { const hb = F.bones.head, hp = wp(hb), to = look.clone().sub(hp), side = V().crossVectors(up, to).normalize();
    const want = Math.atan2(-to.y, Math.hypot(to.x, to.z)), pitch = THREE.MathUtils.clamp(want * 0.5 - 0.25, 0, 0.42);
    const la = side.clone().negate().applyQuaternion(hb.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();
    hb.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(la, -pitch)); F.root.updateMatrixWorld(true); }
  // left: the palm flat on the paper at its left, fingers toward the paper's head; its shoulder comes forward too
  if (opts.leftAt) {
    const cl = F.bones.clavL, cd = wp(F.bones.shoulderL).sub(wp(cl)).normalize();
    aim(F, 'clavL', 'shoulderL', cd.clone().addScaledVector(f, 0.12).addScaledVector(dn, 0.04));
    const fA = V().copy(f).multiplyScalar(0.85).addScaledVector(r, 0.35).normalize();
    for (let it = 0; it < 2; it++) { ik(F, 'shoulderL', 'elbowL', 'wristL', opts.leftAt.clone().addScaledVector(fA, -0.075 * k).addScaledVector(up, 0.018 * k), V().copy(l).addScaledVector(dn, 0.5).addScaledVector(f, -0.3)); orientHand(F, fA, dn, 'l'); }
    flatHand(F);
  }
  // right: the clavicle carries the shoulder forward and down toward the tip, by how far the tip is from the shoulder
  const dir = (opts.dir || up).clone().normalize(), below = opts.below ?? 0.13 * k;
  const pinchAt = tip.clone().addScaledVector(dir, below);
  { const cl = F.bones.clavR, cd = wp(F.bones.shoulderR).sub(wp(cl)).normalize(), reach = pinchAt.clone().sub(wp(F.bones.shoulderR));
    const fwd = THREE.MathUtils.clamp(reach.dot(f) / (0.45 * k), 0, 1.4);
    aim(F, 'clavR', 'shoulderR', cd.clone().addScaledVector(f, 0.07 + 0.09 * fwd).addScaledVector(dn, 0.06)); }
  // the elbow hangs out to the side and back, a hand's width from the ribs (xuan zhou, the suspended elbow, kept low)
  const pole = V().copy(r).multiplyScalar(opts.elbowOut ?? 0.75).addScaledVector(dn, 0.55).addScaledVector(f, -0.35);
  let wT = null, fore = V().copy(f).multiplyScalar(0.8).addScaledVector(l, 0.6).normalize(), fr = null;
  // part 13 (his A on hand-grip-look-6): with opts.brush the baked hold puts the hand: the brush is laid at the tip,
  // the wrist goes where the hold's in-hand matrix says and the fingers take the solved angles (holdfit.js)
  if (opts.brush) { holdBrush(F, opts.brush, tip, dir, pole); F.root.updateMatrixWorld(true); F.mesh.skeleton.update(); F.poseName = 'write'; return; }
  for (let it = 0; it < 6; it++) {
    fr = handFrame(F, dir, fore);
    if (!wT) wT = pinchAt.clone().addScaledVector(fr.axis, -0.075 * k).addScaledVector(fr.palm, -0.02 * k);
    ik(F, 'shoulderR', 'elbowR', 'wristR', wT, pole);
    fore = wp(F.bones.wristR).sub(wp(F.bones.elbowR)).normalize();
    // the hand may bend up to 20 deg off the forearm's line, no more (a straight wrist, the brush still upright)
    fr = handFrame(F, dir, fore);
    setHand(F, fr.axis, fr.palm); wrapGrip(F, dir, opts.press ?? 0);
    wT.add(pinchAt.clone().sub(pinch(F)));
  }
  F.root.updateMatrixWorld(true); F.mesh.skeleton.update();
  F.poseName = 'write';
}

// the brush: a bamboo shaft with two nodes, a dark horn ferrule and a soft hair tip; the tip's lower part takes the ink
export function makeBrush(k = 1, ink = 0x2f6fd0) {
  const g = new THREE.Group(), L = 0.215 * k, rT = 0.0046 * k, rB = 0.0052 * k;
  const bamboo = new THREE.MeshStandardMaterial({ color: 0xb98c4e, roughness: 0.45 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, L, 14), bamboo); shaft.position.y = L / 2; g.add(shaft);
  for (const y of [0.32, 0.71]) { const n = new THREE.Mesh(new THREE.TorusGeometry(rB * 0.98, 0.0011 * k, 6, 18), new THREE.MeshStandardMaterial({ color: 0x8a6232, roughness: 0.5 })); n.rotation.x = Math.PI / 2; n.position.y = L * y; g.add(n); }
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(rT * 0.9, rT, 0.004 * k, 14), new THREE.MeshStandardMaterial({ color: 0x2a1d17, roughness: 0.4 })); cap.position.y = L + 0.002 * k; g.add(cap);
  const fer = new THREE.Mesh(new THREE.CylinderGeometry(rB * 1.05, rB * 1.12, 0.011 * k, 14), new THREE.MeshStandardMaterial({ color: 0x2a1d17, roughness: 0.35 })); fer.position.y = -0.0055 * k; g.add(fer);
  // hair: a lathe from the ferrule to a fine point, belly fullest a third of the way down
  const H = 0.034 * k, pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push(new THREE.Vector2(rB * 1.1 * (1 + 0.35 * Math.sin(Math.PI * Math.min(1, t * 1.5))) * Math.pow(1 - t, 0.75) + 1e-5, -t * H)); }
  const hg = new THREE.LatheGeometry(pts, 20), col = new Float32Array(hg.attributes.position.count * 3), cI = new THREE.Color(ink), cH = new THREE.Color(0xe8dcc4), c = new THREE.Color();
  for (let i = 0; i < hg.attributes.position.count; i++) { const t = -hg.attributes.position.getY(i) / H; c.copy(cH).lerp(cI, THREE.MathUtils.smoothstep(t, 0.35, 0.6)); col.set([c.r, c.g, c.b], i * 3); }
  hg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const hair = new THREE.Mesh(hg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, emissive: cI, emissiveIntensity: 0.0 }));
  hair.position.y = -0.011 * k; g.add(hair); g.userData.hair = hair;
  // origin at the ferrule; tipLen: ferrule to the hair's point
  g.userData.tipLen = 0.011 * k + H; g.userData.len = L;
  return g;
}

// the brush along `dir` with its point at the pinch minus `below`; the hair bends back from the travel and squashes
// as the tip presses (press 0 to 1, bend a world vector: the way the point is dragged)
// lay the brush with its tip at `tip`, shaft along `dir`, then let the baked hold carry the hand to it
export function holdBrush(F, brush, tip, dir, pole) {
  // holdPlace's ride() turns matrixAutoUpdate off and writes the matrix itself; turn it back on so this frame's tip is used
  brush.matrixAutoUpdate = true;
  const d = dir.clone().normalize(), q0 = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d);
  const setRoll = th => { brush.quaternion.copy(q0).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), th)); brush.position.copy(tip).addScaledVector(d, brush.userData.tipLen); brush.updateMatrixWorld(true); };
  // the roll about the shaft is the one that bends the wrist least, held steady from frame to frame by a first guess
  const th = bestRoll(F, brush, 'brush', d, setRoll); setRoll(th);
  holdPlace(F, brush, 'brush', pole);
}
// the hair's press and bend (placeBrush's last part), for a brush the hold carries
export function hairPress(brush, press = 0, bend = null) {
  const hair = brush.userData.hair; hair.scale.set(1 + 0.3 * press, 1 - 0.15 * press, 1 + 0.3 * press); hair.rotation.set(0, 0, 0);
  if (bend && bend.lengthSq() > 1e-8) { brush.updateMatrixWorld(true);
    const bl = bend.clone().transformDirection(brush.matrixWorld.clone().invert()); bl.y = 0;
    if (bl.lengthSq() > 1e-8) { const ax = V().crossVectors(V(0, -1, 0), bl.normalize()); hair.quaternion.setFromAxisAngle(ax.normalize(), Math.min(0.5, bend.length())); } }
  brush.updateMatrixWorld(true);
}
export function placeBrush(F, brush, below, dir = V(0, 1, 0), press = 0, bend = null) {
  const p = pinch(F), d = dir.clone().normalize();
  brush.quaternion.setFromUnitVectors(V(0, 1, 0), d);
  brush.position.copy(p).addScaledVector(d, -(below - brush.userData.tipLen));
  const hair = brush.userData.hair; hair.scale.set(1 + 0.3 * press, 1 - 0.15 * press, 1 + 0.3 * press); hair.rotation.set(0, 0, 0);
  if (bend && bend.lengthSq() > 1e-8) {
    brush.updateMatrixWorld(true);
    const bl = bend.clone().transformDirection(brush.matrixWorld.clone().invert()); bl.y = 0;
    if (bl.lengthSq() > 1e-8) { const ax = V().crossVectors(V(0, -1, 0), bl.normalize()); hair.quaternion.setFromAxisAngle(ax.normalize(), Math.min(0.5, bend.length())); }
  }
  brush.updateMatrixWorld(true);
}
