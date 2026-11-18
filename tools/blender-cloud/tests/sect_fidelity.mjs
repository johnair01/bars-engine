// The fidelity gate, reading the Heaven sect itself: the sect's walk measured against the CMU capture, with the same
// rules the lab uses (public/between/cult/motion-fidelity-rules.js). The lab measures the Between's figure; this
// measures the sect's own gait - the one a player walks through the Heaven sect - so the two can be compared.
//
//   node tools/blender-cloud/tests/sect_fidelity.mjs
// The report is written to $SECT_FIDELITY_OUT/sect-fidelity.json and the gate exits 1 when a check fails.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const out = process.env.SECT_FIDELITY_OUT || '/tmp/sect-fidelity';
const base = process.env.SECT_BASE || 'http://127.0.0.1:8765';
const labBase = process.env.LAB_BASE || 'http://127.0.0.1:8767';
const frames = Number(process.env.SECT_FRAMES || 90);
mkdirSync(out, { recursive: true });

// the same rules the lab uses, loaded without a bundler
const rulesSrc = readFileSync(new URL('../../../public/between/cult/motion-fidelity-rules.js', import.meta.url), 'utf8');
const { summarise, compare } = await import('data:text/javascript;base64,' + Buffer.from(rulesSrc).toString('base64'));

const browser = await chromium.launch({ headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const report = { schema: 'calrunia.sect_fidelity.v1', source: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(), frames };
try {
  // 1. the capture, measured in the lab, on the same rules
  const lab = await browser.newPage({ viewport: { width: 900, height: 900 } });
  await lab.goto(`${labBase}/between/cult/motion-lab.html`, { waitUntil: 'domcontentloaded' });
  await lab.waitForFunction(() => window.__motionLabControl?.walker && window.__motionLabControl?.ref, null, { timeout: 600000 });
  const capture = await lab.evaluate(async () => {
    const F = await import('/between/cult/motion-fidelity.js');
    const both = F.measureBoth(window.__motionLabControl, 'walk', { steps: 48 });
    return { capture: both.capture, figure: both.figure, angle: both.captureAngleDeg,
      captureLeg: both.captureLeg, figureLeg: both.figureLeg };
  });
  await lab.close();

  // 2. the sect's own walk, driven in the sect's page, measured the same way
  const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(`${base}/sect/heaven.html`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.heaven, null, { timeout: 120000 });
  const sect = await page.evaluate(async (frames) => {
    const h = window.heaven, w = await h.walking;
    const THREE = await import('three');
    const { groundAt } = await import('/sect/heaven/walk.js');
    h.manual = true;
    h.walkToCrest(); h.stopWalk();               // stand on the great court, then walk it in a straight line
    const A = h.A, F = w.X.F;
    h.input.keys = new Set(); h.input.run = false; h.input.jump = false;
    h.input.target = new THREE.Vector3(A.position.x, 0, A.position.z);
    const V = (o) => o.getWorldPosition(new THREE.Vector3());
    const rows = [];
    const warm = 30;                             // the avatar eases into its pace; measure the walk, not the start
    for (let i = 0; i < frames + warm; i++) {
      const fwd = { x: -Math.sin(A.rotation.y), z: -Math.cos(A.rotation.y) };
      h.input.target.set(A.position.x + fwd.x * 80, 0, A.position.z + fwd.z * 80);
      h.simulate(1 / 30);
      const hipL = V(F.bones.hipL), hipR = V(F.bones.hipR);
      const hip = hipL.clone().add(hipR).multiplyScalar(0.5);
      const sh = V(F.bones.shoulderL).add(V(F.bones.shoulderR)).multiplyScalar(0.5);
      const kneeAngle = s => {
        const a = V(F.bones['hip' + s]), k = V(F.bones['knee' + s]), an = V(F.bones['ankle' + s]);
        return a.clone().sub(k).angleTo(an.clone().sub(k)) * 180 / Math.PI;
      };
      const forward = F.fr.f.clone().setY(0).normalize();
      const balls = ['L', 'R'].map(s => V(F.bones['ball' + s]));
      if (i < warm) continue;
      rows.push({
        pelvisHeight: hip.y - groundAt(hip.x, hip.z),
        lean: Math.atan2(sh.clone().sub(hip).dot(forward), Math.max(0.05, sh.y - hip.y)) * 180 / Math.PI,
        kneeFold: Math.min(kneeAngle('L'), kneeAngle('R')),
        ballY: balls.map(b => b.y - groundAt(b.x, b.z)),
        reach: balls.map(b => b.clone().sub(hip).dot(forward)),
      });
    }
    const leg = V(F.bones.hipL).distanceTo(V(F.bones.ballL)) + (V(F.bones.hipR).distanceTo(V(F.bones.ballR)));
    const spread = k => rows.map(r => k(r));
    return { rows, leg: leg / 2, stature: F.stature, sample: rows.slice(0, 3),
      seen: { pelvisMin: Math.min(...spread(r => r.pelvisHeight)), pelvisMax: Math.max(...spread(r => r.pelvisHeight)),
        reachMin: Math.min(...spread(r => Math.min(...r.reach))), reachMax: Math.max(...spread(r => Math.max(...r.reach))),
        ballMin: Math.min(...spread(r => Math.min(...r.ballY))), ballMax: Math.max(...spread(r => Math.max(...r.ballY))) } };
  }, frames);
  await page.close();

  const figure = summarise(sect.rows, sect.leg);
  const verdict = compare('walk', figure, capture.capture);
  report.sect = { figure, leg: sect.leg, stature: sect.stature, verdict, errors, seen: sect.seen, sample: sect.sample };
  report.capture = { summary: capture.capture, angleDeg: capture.angle, legs: capture.captureLeg };
} finally { await browser.close(); }

writeFileSync(join(out, 'sect-fidelity.json'), JSON.stringify(report, null, 1) + '\n');

const v = report.sect.verdict;
console.log(`the Heaven sect's walk against the CMU capture (${frames} frames, ${report.sect.leg.toFixed(3)} m leg)`);
console.log('  check                      figure   capture   limit      pass');
for (const c of v.checks) console.log(`  ${c.label.padEnd(26)}${String(c.figure).padStart(7)}${String(c.capture).padStart(9)}   ${JSON.stringify(c.limit).padEnd(10)} ${c.pass ? 'yes' : 'NO'}`);
console.log(`\nerrors ${report.sect.errors.length}  ${v.pass ? 'PASS' : 'FAIL'}`);
process.exit(v.pass ? 0 : 1);
