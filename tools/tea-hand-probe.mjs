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
   Round 5 (look tea-drink-look-1: the drink authored in Blender, art/between/tea-drink/build.py): the same checks read off the
   baked clips as the page plays them (tools/tea-drink-play.mjs, public/between/tea-drink.js), every 1/15 s along the whole
   drink and the extra sip, with the cup tipped as the hand tips it, and five more:
   - lips: at each sip the cup's near rim is on the middle of the lips (within 1.5 cm of them, and within 1 cm of the face's
     middle line), not the cheek;
   - cradle: the left hand is within 3 cm of the cup, and no more than 6 mm into it, all through each sip;
   - tip: each sip tips the cup further than the last (small, medium, most);
   - bow: the head bows to meet the cup (at least 0.05 rad over the sit's when the cup reaches the lips), and starts before
     the cup leaves the lap (the head leads);
   - carry: away from the lips the cup tips no further than CUP.spill, and the cup does not jump when the hand lifts it;
   - slow: no bone of the drink turns faster than SLOW5 (tea-cup-look-2: "move slowly").
     npm i --no-save --prefix /tmp/t three@0.160.0 && THREE_DIR=/tmp/t/node_modules/three node tools/tea-hand-probe.mjs [--r4|--r5] */
import { teaRig, measure } from './tea-rig.mjs';
import { ARM_ANGLES, HAND_AT, GRIP_DIR, NEAR, TOTAL, kettleAt, teaAt, CUP } from '../public/between/tea-pose.js';
import { drinkRig } from './tea-drink-play.mjs';

const MISS = 0.03, DEEP = 0.006, GAP = 0.015, SLOW5 = 3.0;   // SLOW5: round 5's fastest bone turn (rad/s)
const ONLY = process.argv.includes('--r4') ? 'r4' : process.argv.includes('--r5') ? 'r5' : null;
const R = await teaRig(), rows = [], fail = [];
const cm = x => (x * 100).toFixed(1);
if (ONLY !== 'r5') {
rows.push('round 4 (tea-pose.js, ?drink=r4)');
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
}
if (ONLY !== 'r4') {
  rows.push('round 5 (the baked drink, tea-drink.glb)');
  const D = await drinkRig(), DT = 1 / 15, tl = D.drink.tl;
  const sum = { turn: 0, handIn: 0, handGap: 0, bodyIn: 0, table: -1, cupTable: -1, leftIn: 0, leftGap: 0, carry: 0, at: {} };
  const lipsBy = {}, tipBy = {}, bowBy = {}, leadBy = {};
  const worse = (k, v, t, mode) => { if (v > sum[k]) { sum[k] = v; sum.at[k] = `${mode} ${t.toFixed(2)}`; } };
  for (const mode of ['pour', 'sip']) {
    const end = D.P.end(mode) + D.P.holdLen;
    let prevQ = null;
    for (let t = 0; t <= end + 1e-6; t += DT) {
      const a = D.at(mode, t), s = a.s, inHand = s.inHand, m = measure(D.R, a.cup, inHand, { up: a.up, left: true });
      const q = tl.driven.map(n => D.B(n).quaternion.clone());
      if (prevQ && t > DT * 1.5) q.forEach((x, i) => worse('turn', 2 * Math.acos(Math.min(1, Math.abs(x.dot(prevQ[i])))) / DT, t, `${mode} ${tl.driven[i]}`));
      prevQ = q;
      worse('table', m.table, t, mode);
      if (inHand) {
        worse('handIn', m.handIn, t, mode); worse('handGap', m.handGap, t, mode); worse('bodyIn', m.bodyIn, t, mode); worse('cupTable', m.cupTable, t, mode);
        if (!s.lips && a.rim.distanceTo(a.mouth) > 0.06) worse('carry', a.tip, t, mode);
      }
      const sipK = /^sip/.test(s.clip) ? s.clip : null;
      if (sipK) {
        worse('leftIn', m.leftIn, t, mode); worse('leftGap', m.leftGap, t, mode);
        tipBy[sipK] = Math.max(tipBy[sipK] || 0, a.tip);
        if (s.lips) {
          const L = lipsBy[sipK] || (lipsBy[sipK] = { d: 0, side: 0, n: 0 });
          // the face's middle line: the rim's offset across the head (its local x)
          const local = D.B('head').worldToLocal(a.rim.clone().setY(a.rim.y + D.top)), mid = D.B('head').worldToLocal(a.mouth.clone().setY(a.mouth.y + D.top));
          L.d = Math.max(L.d, a.rim.distanceTo(a.mouth)); L.side = Math.max(L.side, Math.abs(local.x - mid.x)); L.n++;
          if (bowBy[sipK] == null) bowBy[sipK] = a.bow;
        }
      }
    }
  }
  // the lead: from each sip's first moment, when the head starts to bow against when the cup starts to rise
  for (const [k, mode, T0] of [['sip2', 'pour', tl.clips.find(c => c.name === 'sip2').start], ['sip3', 'pour', tl.clips.find(c => c.name === 'sip3').start], ['sip', 'sip', 0]]) {
    const a0 = D.at(mode, T0), ld = leadBy[k] = { head: null, cup: null };
    for (let t = T0; t <= T0 + 2 && (ld.head == null || ld.cup == null); t += 1 / 60) {
      const a = D.at(mode, t);
      if (ld.head == null && Math.abs(a.bow - a0.bow) > 0.01) ld.head = t;
      if (ld.cup == null && a.cup.y - a0.cup.y > 0.01) ld.cup = t;
    }
  }
  const ok5 = (name, ok, detail) => { rows.push(`${ok ? 'ok  ' : 'FAIL'}  ${name.padEnd(6)} ${detail}`); if (!ok) fail.push('r5:' + name); };
  ok5('slow', sum.turn <= SLOW5, `no bone of the drink turns faster than ${sum.turn.toFixed(2)} rad/s (${sum.at.turn}); the line is ${SLOW5}, a whole bone's turn, twist and all`);
  ok5('grip', sum.handIn <= DEEP && sum.handGap <= GAP, `hand at most ${cm(sum.handIn)} cm into the cup and ${cm(sum.handGap)} cm off it while it holds it (${sum.at.handIn || '-'}, ${sum.at.handGap || '-'})`);
  ok5('clear', sum.bodyIn === 0, `at most ${sum.bodyIn} points of the rest of the figure in the cup`);
  ok5('table', sum.table <= 0 && sum.cupTable <= 0.002, `figure at worst ${cm(-sum.table)} cm clear of the table past its 3 cm (${sum.at.table}), cup ${cm(-sum.cupTable)} cm (it stands on the stone as the hand lifts it)`);
  const sips = ['sip1', 'sip2', 'sip3', 'sip'];
  const lipsOk = sips.every(k => lipsBy[k] && lipsBy[k].d <= 0.015 && lipsBy[k].side <= 0.01);
  ok5('lips', lipsOk, sips.map(k => lipsBy[k] ? `${k} rim within ${cm(lipsBy[k].d)} cm of the lips, ${cm(lipsBy[k].side)} cm off the middle` : `${k} never at the lips`).join('; '));
  ok5('cradle', sum.leftGap <= 0.03 && sum.leftIn <= DEEP, `through the sips the left hand is at most ${cm(sum.leftGap)} cm off the cup (${sum.at.leftGap || '-'}) and ${cm(sum.leftIn)} cm into it (${sum.at.leftIn || '-'})`);
  const tips = ['sip1', 'sip2', 'sip3'].map(k => tipBy[k] || 0);
  ok5('tip', tips[0] < tips[1] && tips[1] < tips[2], `the cup tips ${tips.map(x => x.toFixed(2)).join(' < ')} rad over the three sips (the extra sip ${(tipBy.sip || 0).toFixed(2)})`);
  const bowOk = sips.every(k => (bowBy[k] || 0) >= 0.05), leadOk = ['sip2', 'sip3', 'sip'].every(k => leadBy[k] && leadBy[k].head != null && leadBy[k].cup != null && leadBy[k].head <= leadBy[k].cup);
  ok5('bow', bowOk && leadOk, `the head bowed ${sips.map(k => (bowBy[k] || 0).toFixed(2)).join(', ')} rad over the sit's as the cup reached the lips; it starts ${['sip2', 'sip3', 'sip'].map(k => leadBy[k] && leadBy[k].cup != null && leadBy[k].head != null ? (leadBy[k].cup - leadBy[k].head).toFixed(2) : '?').join(', ')} s before the cup rises`);
  // the hand-off: the cup on the stone the frame before the hand lifts it, against the cup in the hand the frame it does
  const b0 = D.at('pour', tl.grab - 1e-3), b1 = D.at('pour', tl.grab + 1e-3);
  const jump = Math.hypot(b0.cup.x - b1.cup.x, b0.cup.y - b1.cup.y, b0.cup.z - b1.cup.z), turn = 2 * Math.acos(Math.min(1, Math.abs(b0.cupQ.dot(b1.cupQ))));
  ok5('carry', sum.carry <= CUP.spill && jump <= 0.005 && turn <= 0.05, `away from the lips the cup tips at most ${sum.carry.toFixed(2)} rad (${sum.at.carry || '-'}; it runs over at ${CUP.spill}); lifting it moves it ${cm(jump)} cm and turns it ${turn.toFixed(3)} rad`);
}
{ const k = kettleAt(), kd = Math.hypot(k.x, k.z), kOk = kd <= NEAR;
rows.push(`${kOk ? 'ok  ' : 'FAIL'}  near   the kettle stands ${kd.toFixed(3)} m from its seat, the pour is offered inside ${NEAR} m`);
if (!kOk) fail.push('near'); }
console.log(rows.join('\n') + `\n\n${rows.length - fail.length > 0 ? '' : ''}${fail.length ? `failing: ${fail.join(', ')}` : 'all checks pass'}`);
process.exit(fail.length ? 1 : 0);
