/* The tea cup probe (between-tea-1 slice 1: the solo cup). Reads the numbers the pour is made of — public/between/tea-pose.js,
   the same module the room reads — and checks the four things a seated pour can get wrong before anything is drawn:
   - reach: the kettle's spout is inside what the right arm spans from the seat, with a margin, so nobody sits down to a pot
     they cannot touch (this is what fixes the kettle's place, rather than a guess in the scene);
   - tilt: the cup tips past CUP.spill only while it is poured into or drunk from, so it never spills while it is carried;
   - stream: the tea runs only inside the pour beat and only after the reach has finished;
   - length: the whole pour is under LIMIT seconds, short enough to sit through before the fire asks anything of you.
   Prints a line per check and exits 1 when one fails.
     node tools/tea-cup-probe.mjs [--json] */
import { teaAt, spoutReach, TOTAL, CUP, TEA, KETTLE } from '../public/between/tea-pose.js';

const JSON_OUT = process.argv.includes('--json');
const LIMIT = 8, STEP = 1 / 120;
const rows = [], fail = [];
const check = (name, ok, detail) => { rows.push({ name, ok, detail }); if (!ok) fail.push(name); };

const r = spoutReach();
check('reach', r.over === 0, `${r.d.toFixed(3)} m to the spout, the arm spans ${r.span.toFixed(3)} m, ${r.margin.toFixed(3)} m spare`);

let worstCarry = 0, streamOutside = 0, streamEarly = 0, last = null;
const phases = [];
for (let t = 0; t <= TOTAL + 1; t += STEP) {
  const s = teaAt(t);
  if (s.phase !== last) { phases.push(s.phase); last = s.phase; }
  if (s.phase !== 'pour' && s.phase !== 'sip') worstCarry = Math.max(worstCarry, Math.abs(s.tilt));
  if (s.stream && !(s.phase === 'pour' && s.pour >= TEA.streamFrom && s.pour <= TEA.streamTo)) streamOutside++;
  if (s.stream && t < TEA.reach) streamEarly++;
}
check('tilt', worstCarry <= CUP.spill, `carried no further than ${worstCarry.toFixed(3)} rad, the lip runs over at ${CUP.spill}`);
check('stream', streamOutside === 0 && streamEarly === 0, `${streamOutside} samples running outside the pour beat, ${streamEarly} before the reach`);
check('length', TOTAL <= LIMIT, `${TOTAL.toFixed(2)} s from taking the cup up to setting it down (the line is ${LIMIT})`);
check('ends', teaAt(TOTAL + 0.01).done === true, 'the cup is back on the stone and the pour is over');
check('beats', phases.join(' > ') === 'reach > pour > back > sip > set > done', phases.join(' > '));
check('clear', Math.hypot(KETTLE.lip.x, KETTLE.lip.z) >= 0.35, `the kettle stands ${Math.hypot(KETTLE.lip.x, KETTLE.lip.z).toFixed(3)} m out from the seat's middle`);

if (JSON_OUT) console.log(JSON.stringify({ rows, fail, total: TOTAL, reach: r }, null, 1));
else {
  for (const x of rows) console.log(`${x.ok ? 'ok  ' : 'FAIL'}  ${x.name.padEnd(7)} ${x.detail}`);
  console.log(`\n${rows.length - fail.length}/${rows.length} checks pass${fail.length ? `, failing: ${fail.join(', ')}` : ''}`);
}
process.exit(fail.length ? 1 : 0);
