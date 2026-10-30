/* The seated Average Dusk with the cup in its right hand, for tools/tea-hand-probe.mjs and tools/tea-fit.mjs: poses the right arm
   and the lean the way public/between/tea.js does (turns added on the sit), puts the cup where the page puts it (HAND past wristR,
   then GRIP out through the palm along the beat's GRIP_DIR), and measures what stands where it should not: the hand inside the
   cup, the rest of the figure inside the cup, the figure inside the table stone or the kettle. Seat frame throughout: origin the
   seat's top, +x the figure's left, +z the way it faces.
     npm i --no-save --prefix /tmp/t three@0.160.0 && THREE_DIR=/tmp/t/node_modules/three node tools/tea-hand-probe.mjs */
import { THREE, parts, figure, posed } from './figure-rig.mjs';
import { HAND, GRIP, CUP, KETTLE, kettleAt } from '../public/between/tea-pose.js';
import { SEAT_PAD } from '../public/between/stance.js';

export async function teaRig() {
  const f = figure(await parts()); f.sit(1);
  const B = n => f.bones[n].b, q0 = Object.fromEntries(['shoulderR', 'elbowR', 'spine'].map(n => [n, B(n).quaternion.clone()]));
  const qe = new THREE.Quaternion(), eu = new THREE.Euler(), X = new THREE.Vector3(1, 0, 0), v = new THREE.Vector3();
  const top = B('hips').getWorldPosition(v).y - SEAT_PAD;   // the page rests the hips SEAT_PAD over the seat's top
  const meshes = []; f.obj.traverse(o => { if (o.isSkinnedMesh && o.visible) meshes.push(o); });
  /* Which points are the right hand (1): those mostly on wristR; the left hand (2), mostly on wristL. Everything else is the rest of the figure (the robe's cuff too). */
  const handOf = meshes.map(m => { const si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight, w = m.skeleton.bones.indexOf(B('wristR')), wl = m.skeleton.bones.indexOf(B('wristL'));
    return Uint8Array.from({ length: si.count }, (_, i) => { let s = 0, l = 0; for (let k = 0; k < 4; k++) { if (si.getComponent(i, k) === w) s += sw.getComponent(i, k); if (si.getComponent(i, k) === wl) l += sw.getComponent(i, k); } return s > 0.3 ? 1 : l > 0.3 ? 2 : 0; }); });
  function pose(a) {
    B('shoulderR').quaternion.copy(q0.shoulderR).multiply(qe.setFromEuler(eu.set(a.sx, a.sy || 0, a.sz, 'XYZ')));
    B('elbowR').quaternion.copy(q0.elbowR).multiply(qe.setFromEuler(eu.set(a.ex, 0, 0, 'XYZ')));
    B('spine').quaternion.copy(q0.spine).multiply(qe.setFromAxisAngle(X, a.lean || 0));
    f.obj.updateMatrixWorld(true);
  }
  /* The cup's middle for the pose now and a grip direction {x, z}. */
  function cupAt(grip) {
    const h = new THREE.Vector3(0, HAND, 0).applyMatrix4(B('wristR').matrixWorld); h.y -= top;
    const l = Math.hypot(grip.x, grip.z) || 1;
    return { hand: h, cup: h.clone().add(new THREE.Vector3(grip.x / l * GRIP, 0, grip.z / l * GRIP)) };
  }
  /* Every point of the figure as posed now, in the seat frame, with whether it is the right hand. */
  function points() {
    const out = [];
    meshes.forEach((m, j) => { const p = posed(m); for (let i = 0; i < p.length; i += 3) out.push([p[i], p[i + 1] - top, p[i + 2], handOf[j][i / 3]]); });
    return out;
  }
  /* Back to the sit itself, every bone as the sit leaves it (round 5's clips turn the head, the wrists and the left arm too). */
  const sit0 = Object.fromEntries(Object.entries(f.bones).map(([n, x]) => [n, x.b.quaternion.clone()]));
  function sit() { for (const [n, q] of Object.entries(sit0)) f.bones[n].b.quaternion.copy(q); f.obj.updateMatrixWorld(true); }
  return { f, top, pose, cupAt, points, sit };
}

/* How deep a point is inside a cylinder (radius r, middle c, height h, upright or along `up`); below zero is outside, by that much. */
export function inCyl(p, c, r, h, up = null) {
  if (!up) { const rad = Math.hypot(p[0] - c.x, p[2] - c.z), dy = Math.abs(p[1] - c.y); return Math.min(r - rad, h / 2 - dy); }
  const dx = p[0] - c.x, dy = p[1] - c.y, dz = p[2] - c.z, a = dx * up.x + dy * up.y + dz * up.z;
  return Math.min(r - Math.hypot(dx - a * up.x, dy - a * up.y, dz - a * up.z), h / 2 - Math.abs(a));
}
/* The stone and the pot, in the seat frame: the depth a point is inside either (below zero: clear by that much). */
export function inTable(p) {
  const k = kettleAt(), ground = -1;   // the stone stands on whatever is under it; a point at any height below its top counts
  const stone = Math.min(KETTLE.stone[1] - Math.hypot(p[0] - k.x, p[2] - k.z), KETTLE.top - p[1], p[1] - ground);
  const pc = { x: k.x, y: KETTLE.top + 0.075, z: k.z }, sy = 0.82;
  const pot = KETTLE.body - Math.hypot(p[0] - pc.x, (p[1] - pc.y) / sy, p[2] - pc.z);
  return Math.max(stone, pot);
}
/* What a pose gets wrong. cupInHand false: the cup stands on the stone (reach, pour), so only the table counts. */
/* up: the cup's axis when it is tipped (round 5's cup turns with the hand); left: the left hand's points are measured on their
   own (round 5's left hand comes up under the cup), not counted with the rest of the figure. */
export function measure(R, cup, cupInHand = true, { up = null, left = false } = {}) {
  let handIn = 0, handGap = Infinity, bodyIn = 0, table = -Infinity, cupTable = -Infinity, leftIn = -Infinity, leftGap = Infinity;
  for (const p of R.points()) {
    const d = inCyl(p, cup, CUP.r, CUP.h, up);
    if (p[3] === 1) { handIn = Math.max(handIn, d); handGap = Math.min(handGap, -d); }
    else if (left && p[3] === 2) { leftIn = Math.max(leftIn, d); leftGap = Math.min(leftGap, -d); }
    else if (cupInHand && d > -0.005) bodyIn++;
    table = Math.max(table, inTable(p) + (p[3] === 1 ? -0.005 : 0.03));   // the figure keeps 3 cm off the stone; the hand may rest on it
  }
  if (cupInHand) {
    const u = up || { x: 0, y: 1, z: 0 }, a = Math.abs(u.x) < 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
    const e1 = norm(cross(u, a)), e2 = cross(u, e1);
    for (let k = 0; k < 8; k++) { const c = Math.cos(k * Math.PI / 4), s = Math.sin(k * Math.PI / 4);
      for (const dy of [-CUP.h / 2, 0, CUP.h / 2]) cupTable = Math.max(cupTable, inTable([0, 1, 2].map(i => [cup.x, cup.y, cup.z][i] + [u.x, u.y, u.z][i] * dy + ([e1.x, e1.y, e1.z][i] * c + [e2.x, e2.y, e2.z][i] * s) * CUP.r))); }
  }
  return { handIn, handGap: Math.max(0, handGap), bodyIn, table, cupTable, leftIn: Math.max(0, leftIn), leftGap: Math.max(0, leftGap) };
}
const cross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const norm = v => { const l = Math.hypot(v.x, v.y, v.z) || 1; return { x: v.x / l, y: v.y / l, z: v.z / l }; };
