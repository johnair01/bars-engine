/* The tea cup probe (between-tea-1 slice 1: the solo cup). Reads the numbers the pour is made of — public/between/tea-pose.js,
   the same module the room reads — and checks the four things a seated pour can get wrong before anything is drawn:
   - reach: the kettle's spout is inside what the right arm spans from the seat, with a margin, so nobody sits down to a pot
     they cannot touch (this is what fixes the kettle's place, rather than a guess in the scene);
   - tilt: the cup tips past CUP.spill only while it is poured into or drunk from, so it never spills while it is carried;
   - stream: the tea runs only inside the pour beat and only after the reach has finished;
   - length: the whole pour is under LIMIT seconds, short enough to sit through before the fire asks anything of you;
   - slow: no arm turn moves faster than SPEED rad/s, so the pour reads as someone enjoying it (his note on tea-cup-look-2);
   - savour: the head lifts and the warmth shows only once the cup is on its way down from the lips.
   Prints a line per check and exits 1 when one fails.
     node tools/tea-cup-probe.mjs [--json] */
import { teaAt, spoutReach, kettleAt, TOTAL, CUP, TEA, KETTLE } from '../public/between/tea-pose.js';

const JSON_OUT = process.argv.includes('--json');
const LIMIT = 20, STEP = 1 / 120, SPEED = 1.5;   // seconds end to end; the arm's fastest turn, rad/s (tea-look-2: "move slowly")
const rows = [], fail = [];
const check = (name, ok, detail) => { rows.push({ name, ok, detail }); if (!ok) fail.push(name); };

const r = spoutReach();
check('reach', r.over === 0, `${r.d.toFixed(3)} m to the hand on the cup on the stone, the arm spans ${r.span.toFixed(3)} m, ${r.margin.toFixed(3)} m spare`);

let worstCarry = 0, streamOutside = 0, streamEarly = 0, last = null, fastest = 0, prev = null, savorUp = 0, savorPeak = 0;
const phases = [];
for (let t = 0; t <= TOTAL + 1; t += STEP) {
  const s = teaAt(t);
  if (s.phase !== last) { phases.push(s.phase); last = s.phase; }
  if (s.phase !== 'pour' && s.phase !== 'sip') worstCarry = Math.max(worstCarry, Math.abs(s.tilt));
  if (s.stream && !(s.phase === 'pour' && s.pour >= TEA.streamFrom && s.pour <= TEA.streamTo)) streamOutside++;
  if (s.stream && t < TEA.reach) streamEarly++;
  if (prev) for (const k of ['sx', 'sy', 'sz', 'ex']) fastest = Math.max(fastest, Math.abs((s.arm[k] || 0) - (prev.arm[k] || 0)) / STEP);
  savorPeak = Math.max(savorPeak, s.savor || 0); if ((s.savor || 0) > 0.3 && (s.up || 0) > 0.5) savorUp++;
  prev = s;
}
check('tilt', worstCarry <= CUP.spill, `carried no further than ${worstCarry.toFixed(3)} rad, the lip runs over at ${CUP.spill}`);
check('stream', streamOutside === 0 && streamEarly === 0, `${streamOutside} samples running outside the pour beat, ${streamEarly} before the reach`);
check('length', TOTAL <= LIMIT, `${TOTAL.toFixed(2)} s from taking the cup up to setting it down (the line is ${LIMIT})`);
check('slow', fastest <= SPEED, `the arm turns at most ${fastest.toFixed(2)} rad/s, the line is ${SPEED}`);
check('savour', savorPeak > 0.9 && savorUp === 0, `the savour peaks at ${savorPeak.toFixed(2)}, ${savorUp} samples while the cup is still at the lips`);
check('ends', teaAt(TOTAL + 0.01).done === true, 'the pour is over and the cup is held in the lap');
check('beats', phases.join(' > ') === 'reach > pour > back > sip > set > done', phases.join(' > '));
{ const k = kettleAt(), d = Math.hypot(k.x, k.z); check('clear', d - KETTLE.stone[1] >= 0.45, `the table stone's near edge stands ${(d - KETTLE.stone[1]).toFixed(3)} m out from the seat's middle, past the crossed knees`); }

if (JSON_OUT) console.log(JSON.stringify({ rows, fail, total: TOTAL, reach: r }, null, 1));
else {
  for (const x of rows) console.log(`${x.ok ? 'ok  ' : 'FAIL'}  ${x.name.padEnd(7)} ${x.detail}`);
  console.log(`\n${rows.length - fail.length}/${rows.length} checks pass${fail.length ? `, failing: ${fail.join(', ')}` : ''}`);
}
process.exit(fail.length ? 1 : 0);
