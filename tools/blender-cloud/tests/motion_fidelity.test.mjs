// The fidelity rules, tested without a browser: a capture judged against itself passes; a figure that locks its knee,
// drops its hips or holds its lean still fails; a figure that matches the capture passes.
//   node --test tools/blender-cloud/tests/motion_fidelity.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../../../public/between/cult/motion-fidelity-rules.js', import.meta.url), 'utf8');
const rules = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));
const { summarise, compare } = rules;

// the capture: the CMU walk clip as measured in the lab on 2026-11-17
const capture = summarise([
  { pelvisHeight: 0.86, lean: 2.1, kneeFold: 104.4, toeY: [0.04, 0.13], reach: [0.37, -0.29] },
  { pelvisHeight: 0.87, lean: 4.9, kneeFold: 150.8, toeY: [0.05, 0.10], reach: [0.05, 0.42] },
  { pelvisHeight: 0.85, lean: 0.6, kneeFold: 109.4, toeY: [0.13, 0.04], reach: [-0.31, 0.39] },
  { pelvisHeight: 0.87, lean: 3.9, kneeFold: 165.6, toeY: [0.08, 0.12], reach: [0.10, 0.20] },
]);

// the figure the game walks with: the knee locked, the hips dropping, the lean held still
const shipped = summarise([
  { pelvisHeight: 0.88, lean: 7.0, kneeFold: 145.5, toeY: [0.078, 0.009], reach: [0.375, -0.233] },
  { pelvisHeight: 0.85, lean: 7.0, kneeFold: 176.9, toeY: [0.009, 0.047], reach: [0.10, -0.16] },
  { pelvisHeight: 0.86, lean: 7.0, kneeFold: 154.8, toeY: [0.056, 0.047], reach: [-0.05, 0.27] },
  { pelvisHeight: 0.89, lean: 7.0, kneeFold: 145.8, toeY: [0.047, 0.033], reach: [-0.16, 0.10] },
]);

// the same figure with the capture's knee, lean and hips
const retargeted = summarise([
  { pelvisHeight: 0.86, lean: 2.1, kneeFold: 104.4, toeY: [0.04, 0.13], reach: [0.37, -0.29] },
  { pelvisHeight: 0.87, lean: 4.9, kneeFold: 110.2, toeY: [0.05, 0.10], reach: [0.05, 0.42] },
  { pelvisHeight: 0.85, lean: 0.6, kneeFold: 109.4, toeY: [0.13, 0.04], reach: [-0.31, 0.39] },
  { pelvisHeight: 0.87, lean: 3.9, kneeFold: 120.6, toeY: [0.08, 0.12], reach: [0.10, 0.20] },
]);

test('the capture passes against itself', () => {
  const v = compare('walk', capture, capture);
  assert.equal(v.pass, true, JSON.stringify(v.checks.filter(c => !c.pass)));
});

test('the walk the game ships fails: the knee is locked and the lean never moves', () => {
  const v = compare('walk', shipped, capture);
  assert.equal(v.pass, false);
  const failed = v.checks.filter(c => !c.pass).map(c => c.name);
  assert.ok(failed.includes('kneeFold'), 'the locked knee fails the gate');
  assert.ok(failed.includes('leanRange'), 'the still lean fails the gate');
  const knee = v.checks.find(c => c.name === 'kneeFold');
  assert.equal(knee.figure, 145.5);
  assert.equal(knee.capture, 104.4);
});

test('a figure retargeted from the capture passes', () => {
  const v = compare('walk', retargeted, capture);
  assert.equal(v.pass, true, JSON.stringify(v.checks.filter(c => !c.pass)));
});

test('a figure whose hips drop like the sect gait fails the pelvis check', () => {
  const dropping = summarise([
    { pelvisHeight: 0.88, lean: 7.0, kneeFold: 120, toeY: [0.05, 0.05], reach: [0.3, -0.2] },
    { pelvisHeight: 0.79, lean: 7.0, kneeFold: 120, toeY: [0.05, 0.05], reach: [0.3, -0.2] },
  ]);
  const v = compare('walk', dropping, capture);
  assert.equal(v.pass, false);
  assert.ok(v.checks.find(c => c.name === 'pelvisTravel').pass === false);
});
