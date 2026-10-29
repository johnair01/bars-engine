/* The tea cup in the hand (between-tea-1, tea-look-2, tea-cup-look-3): sits the real figure (Average Dusk, dressed by wardrobe.js,
   the sit from stance.js, through tools/tea-rig.mjs) and puts the right arm in each of tea-pose.js's ARM_ANGLES the way tea.js does,
   then checks, for each beat:
   - mark: the cup's middle lands on HAND_AT for that beat (on the stone, in the lap, at the mouth), within 3 cm;
   - grip: the hand meets the cup's wall (within 1.5 cm) and goes no more than 6 mm into it (tea-cup-look-3: the cup passed
     through the hands);
   - clear: nothing else of the figure (the other hand, the robe, the head) stands in the cup;
   - table: nothing of the figure comes within 3 cm of the table stone or the kettle, and the cup never goes into them
     (tea-cup-look-3: the table clipped the robe and the arms). Run along the whole sequence too, every quarter second.
   And that the kettle stands inside NEAR of its seat, so the seat that has the kettle is offered the pour.
     npm i --no-save --prefix /tmp/t three@0.160.0 && THREE_DIR=/tmp/t/node_modules/three node tools/tea-hand-probe.mjs */
import { teaRig, measure } from './tea-rig.mjs';
import { ARM_ANGLES, HAND_AT, GRIP_DIR, NEAR, TOTAL, kettleAt, teaAt } from '../public/between/tea-pose.js';

const MISS = 0.03, DEEP = 0.006, GAP = 0.015;
const R = await teaRig(), rows = [], fail = [];
const cm = x => (x * 100).toFixed(1);
for (const [beat, want] of Object.entries(HAND_AT)) {
  R.pose(ARM_ANGLES[beat]);
  const { cup } = R.cupAt(GRIP_DIR[beat]), inHand = beat !== 'reach' && beat !== 'pour', m = measure(R, cup, inHand);
  const d = Math.hypot(cup.x - want.x, cup.y - want.y, cup.z - want.z);
  const ok = { mark: d <= MISS, grip: m.handIn <= DEEP && m.handGap <= GAP, clear: m.bodyIn === 0, table: m.table <= 0 && m.cupTable <= 0 };
  rows.push(`${Object.values(ok).every(Boolean) ? 'ok  ' : 'FAIL'}  ${beat.padEnd(6)} cup ${cm(d)} cm from its mark; hand ${cm(m.handIn)} cm into the cup, ${cm(m.handGap)} cm off it; ${m.bodyIn} points of the figure in the cup; figure ${cm(-m.table)} cm clear of the table${inHand ? `, cup ${cm(-m.cupTable)} cm` : ''}`);
  for (const [k, v] of Object.entries(ok)) if (!v) fail.push(`${beat}:${k}`);
}
/* Along the sequence: the cup in the hand from the back beat on, the figure off the table throughout. */
let worst = { table: -1, cupTable: -1, bodyIn: 0, at: {} };
for (let t = 0; t <= TOTAL; t += 0.25) {
  const s = teaAt(t); R.pose(s.arm);
  const inHand = s.phase !== 'reach' && s.phase !== 'pour', { cup } = R.cupAt(s.grip), m = measure(R, cup, inHand);
  if (m.table > worst.table) { worst.table = m.table; worst.at.table = t; }
  if (inHand && m.cupTable > worst.cupTable) { worst.cupTable = m.cupTable; worst.at.cupTable = t; }
  if (inHand && m.bodyIn > worst.bodyIn) { worst.bodyIn = m.bodyIn; worst.at.bodyIn = t; }
}
const pathOk = worst.table <= 0 && worst.cupTable <= 0 && worst.bodyIn === 0;
rows.push(`${pathOk ? 'ok  ' : 'FAIL'}  path   along the ${TOTAL.toFixed(1)} s: figure at worst ${cm(-worst.table)} cm clear of the table, cup ${cm(-worst.cupTable)} cm, at most ${worst.bodyIn} points of the figure in the cup ${JSON.stringify(worst.at)}`);
if (!pathOk) fail.push('path');
const k = kettleAt(), kd = Math.hypot(k.x, k.z), kOk = kd <= NEAR;
rows.push(`${kOk ? 'ok  ' : 'FAIL'}  near   the kettle stands ${kd.toFixed(3)} m from its seat, the pour is offered inside ${NEAR} m`);
if (!kOk) fail.push('near');
console.log(rows.join('\n') + `\n\n${rows.length - fail.length > 0 ? '' : ''}${fail.length ? `failing: ${fail.join(', ')}` : 'all checks pass'}`);
process.exit(fail.length ? 1 : 0);
