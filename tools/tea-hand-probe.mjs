/* The tea cup in the hand (between-tea-1, tea-look-2): sits the real figure (Average Dusk, dressed by wardrobe.js, the sit from
   stance.js, through tools/figure-rig.mjs) and puts the right arm in each of tea-pose.js's ARM_ANGLES the way tea.js does, then
   checks that the cup's middle (HAND past wristR) lands on HAND_AT for that beat: in the lap, under the spout, at the mouth.
   Slice 1 had no check on the body itself: its angles were read off player.glb and lifted the cup over the head.
   Also checks that the kettle stands inside NEAR of its seat, so the seat that has the kettle is offered the pour.
     npm i --no-save --prefix /tmp/t three@0.160.0 && THREE_DIR=/tmp/t/node_modules/three node tools/tea-hand-probe.mjs */
import { THREE, parts, figure } from './figure-rig.mjs';
import { ARM_ANGLES, HAND_AT, HAND, KETTLE, NEAR } from '../public/between/tea-pose.js';
import { SEAT_PAD } from '../public/between/stance.js';

const MISS = 0.03;
const f = figure(await parts()); f.sit(1);
const B = n => f.bones[n].b, S0 = B('shoulderR').quaternion.clone(), E0 = B('elbowR').quaternion.clone();
const qe = new THREE.Quaternion(), eu = new THREE.Euler(), v = new THREE.Vector3();
const top = B('hips').getWorldPosition(v).y - SEAT_PAD;   // the page rests the hips SEAT_PAD over the seat's top
const rows = [], fail = [];
for (const [beat, want] of Object.entries(HAND_AT)) {
  const a = ARM_ANGLES[beat];
  B('shoulderR').quaternion.copy(S0).multiply(qe.setFromEuler(eu.set(a.sx, a.sy || 0, a.sz, 'XYZ')));
  B('elbowR').quaternion.copy(E0).multiply(qe.setFromEuler(eu.set(a.ex, 0, 0, 'XYZ')));
  f.obj.updateMatrixWorld(true);
  const at = new THREE.Vector3(0, HAND, 0).applyMatrix4(B('wristR').matrixWorld); at.y -= top;
  const d = at.distanceTo(new THREE.Vector3(want.x, want.y, want.z)), ok = d <= MISS;
  rows.push(`${ok ? 'ok  ' : 'FAIL'}  ${beat.padEnd(6)} the cup at ${at.toArray().map(x => x.toFixed(3)).join(', ')}, ${(d * 100).toFixed(1)} cm from its mark`);
  if (!ok) fail.push(beat);
}
const kd = Math.hypot(KETTLE.lip.x, KETTLE.lip.z), kOk = kd <= NEAR;
rows.push(`${kOk ? 'ok  ' : 'FAIL'}  near   the kettle stands ${kd.toFixed(3)} m from its seat, the pour is offered inside ${NEAR} m`);
if (!kOk) fail.push('near');
console.log(rows.join('\n') + `\n\n${rows.length - fail.length}/${rows.length} checks pass${fail.length ? `, failing: ${fail.join(', ')}` : ''}`);
process.exit(fail.length ? 1 : 0);
