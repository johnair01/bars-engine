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
  /* Which points are the right hand: those mostly on wristR. Everything else is the rest of the figure (the robe's cuff too). */
  const handOf = meshes.map(m => { const si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight, w = m.skeleton.bones.indexOf(B('wristR'));
    return Uint8Array.from({ length: si.count }, (_, i) => { let s = 0; for (let k = 0; k < 4; k++) if (si.getComponent(i, k) === w) s += sw.getComponent(i, k); return s > 0.3 ? 1 : 0; }); });
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
  return { f, top, pose, cupAt, points };
}

/* How deep a point is inside an upright cylinder (radius r, middle c, height h); below zero is outside, by that much. */
export function inCyl(p, c, r, h) {
  const rad = Math.hypot(p[0] - c.x, p[2] - c.z), dy = Math.abs(p[1] - c.y);
  return Math.min(r - rad, h / 2 - dy);
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
export function measure(R, cup, cupInHand = true) {
  let handIn = 0, handGap = Infinity, bodyIn = 0, table = -Infinity, cupTable = -Infinity;
  for (const p of R.points()) {
    const d = inCyl(p, cup, CUP.r, CUP.h);
    if (p[3]) { handIn = Math.max(handIn, d); handGap = Math.min(handGap, -d); }
    else if (cupInHand && d > -0.005) bodyIn++;
    table = Math.max(table, inTable(p) + (p[3] ? -0.005 : 0.03));   // the figure keeps 3 cm off the stone; the hand may rest on it
  }
  if (cupInHand) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]])
    for (const dy of [-CUP.h / 2, 0, CUP.h / 2]) cupTable = Math.max(cupTable, inTable([cup.x + dx * CUP.r, cup.y + dy, cup.z + dz * CUP.r]));
  return { handIn, handGap: Math.max(0, handGap), bodyIn, table, cupTable };
}
