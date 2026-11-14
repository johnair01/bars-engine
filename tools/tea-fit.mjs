/* Fits tea-pose.js's ARM_ANGLES on the sat Average Dusk (tools/tea-rig.mjs): for each beat, the shoulder and elbow turns that put
   the cup's middle on HAND_AT with the hand against the cup's wall and nothing of the figure in the cup, the stone or the kettle.
   Starts from the angles in tea-pose.js and prints the fitted ones to paste back; tools/tea-hand-probe.mjs is the check.
     npm i --no-save --prefix /tmp/t three@0.160.0 && THREE_DIR=/tmp/t/node_modules/three node tools/tea-fit.mjs [beat...] */
import { teaRig, measure } from './tea-rig.mjs';
import { ARM_ANGLES, HAND_AT, GRIP_DIR } from '../public/between/tea-pose.js';

const R = await teaRig(), KEYS = ['sx', 'sy', 'sz', 'ex'];
const want = process.argv.slice(2).filter(a => HAND_AT[a]);
const pos = x => Math.max(0, x);
function cost(beat, v, lean) {
  const a = { ...Object.fromEntries(KEYS.map((k, i) => [k, v[i]])), lean };
  R.pose(a);
  const { cup } = R.cupAt(GRIP_DIR[beat]), t = HAND_AT[beat], inHand = beat !== 'reach' && beat !== 'pour';
  const m = measure(R, cup, inHand), d = Math.hypot(cup.x - t.x, cup.y - t.y, cup.z - t.z);
  return (d / 0.01) ** 2 + (pos(m.handIn - 0.004) / 0.002) ** 2 + m.bodyIn * 0.5 + (pos(m.table) / 0.005) ** 2 + (pos(m.cupTable) / 0.005) ** 2;
}
function nelder(fn, x0, step = 0.15, iters = 500) {
  let S = [x0, ...x0.map((_, i) => x0.map((x, j) => x + (i === j ? step : 0)))].map(x => [x, fn(x)]);
  for (let it = 0; it < iters; it++) {
    S.sort((a, b) => a[1] - b[1]);
    const n = x0.length, c = x0.map((_, j) => S.slice(0, n).reduce((s, p) => s + p[0][j], 0) / n), w = S[n];
    const at = k => c.map((x, j) => x + k * (w[0][j] - x)), r = at(-1), fr = fn(r);
    if (fr < S[0][1]) { const e = at(-2), fe = fn(e); S[n] = fe < fr ? [e, fe] : [r, fr]; }
    else if (fr < S[n - 1][1]) S[n] = [r, fr];
    else { const k = at(0.5), fk = fn(k); if (fk < w[1]) S[n] = [k, fk]; else S = S.map((p, i) => i ? (q => [q, fn(q)])(p[0].map((x, j) => S[0][0][j] + 0.5 * (x - S[0][0][j]))) : p); }
  }
  S.sort((a, b) => a[1] - b[1]); return S[0];
}
const out = {};
for (const beat of want.length ? want : ['lap', 'pour', 'sip']) {
  const a0 = ARM_ANGLES[beat], lean = a0.lean || 0;
  let best = [KEYS.map(k => a0[k] || 0), Infinity];
  for (let round = 0; round < 3; round++) { const r = nelder(x => cost(beat, x, lean), best[0], 0.3 / (round + 1)); if (r[1] < best[1]) best = r; }
  out[beat] = { ...Object.fromEntries(KEYS.map((k, i) => [k, +best[0][i].toFixed(3)])), lean };
  console.log(`${beat.padEnd(6)} cost ${best[1].toFixed(3)}  ${JSON.stringify(out[beat])}`);
}
