// The fidelity gate: the cultivator's walk and run against the CMU capture the repo ships, over the body sizes.
// Usage (a server serving this checkout's public/):
//   MOTION_OUT=/tmp/motion-fidelity [MOTION_CELLS=all|first] [MOTION_MOTIONS=walk,pose] \
//     node tools/blender-cloud/tests/motion_fidelity.mjs
// The report is written to MOTION_OUT/motion-fidelity.json. The gate fails (exit 1) when any check on any cell fails:
// a walk that walks worse than the capture never leaves this script.
// Playwright must resolve from the script's folder or NODE_PATH.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const out = process.env.MOTION_OUT || '/tmp/motion-fidelity';
const base = process.env.MOTION_BASE || 'http://127.0.0.1:8767';
const shots = process.env.MOTION_SHOTS === '1';
const DEFAULT_H = { f: 1.66, m: 1.75 };
const motions = (process.env.MOTION_MOTIONS || 'walk,pose').split(',').map(s => s.trim()).filter(Boolean);
mkdirSync(out, { recursive: true });

const cells = [];
for (const who of ['f', 'm']) for (const build of ['slight', 'average', 'broad'])
  for (const h of (build === 'average' ? [1.50, DEFAULT_H[who], 1.95] : [1.50, 1.95])) cells.push({ who, build, height: h });
const use = process.env.MOTION_CELLS === 'first' ? cells.slice(0, 1) : cells;

const browser = await chromium.launch({ headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const report = { schema: 'calrunia.cult_motion_fidelity.v1', source: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
  motions, cells: [] };
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 900 } }), errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(`${base}/between/cult/motion-lab.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__motionLabControl?.walker && window.__motionLabControl?.ref &&
    (window.__motionLabControl.refFit || new URLSearchParams(location.search).has('legacy')), { timeout: 600000 });
  for (const cell of use) {
    await page.evaluate(c => window.__motionLabControl.rebuild(c), cell);
    const rec = await page.evaluate(async (motions) => {
      const F = await import('/between/cult/motion-fidelity.js'), c = window.__motionLabControl, o = { motions: {} };
      for (const motion of motions) {
        const both = F.measureBoth(c, motion, { steps: 48 });
        const kind = (motion === 'walk' || motion === 'walk-capture') ? 'walk' : 'run';
        o.motions[motion] = { figure: both.figure, capture: both.capture, captureAngleDeg: both.captureAngleDeg,
          figureLeg: both.figureLeg, captureLeg: both.captureLeg,
          verdict: F.compare(kind, both.figure, both.capture) };
      }
      return o;
    }, motions);
    report.cells.push({ ...cell, ...rec });
    if (shots) {
      const tag = `${cell.who}-${cell.build}-${cell.height.toFixed(2)}`;
      for (const motion of motions) {
        // the walk's forward phase, the run's flight: the frames the checks turn on
        const at = (motion === 'walk' || motion === 'walk-capture') ? 0.25 : 0.35;
        await page.evaluate(([m, a]) => window.__motionLabControl.set(m, window.__motionLabControl.duration * a), [motion, at]);
        await page.locator('#stage').screenshot({ path: join(out, `${tag}-${motion}.png`) });
      }
    }
  }
  report.errors = errors;
} finally { await browser.close(); }

// the gate: every check on every cell has to pass
const failed = [];
for (const cell of report.cells) for (const [motion, m] of Object.entries(cell.motions))
  for (const check of m.verdict.checks) if (!check.pass) failed.push({ cell: `${cell.who}-${cell.build}-${cell.height}`, motion, ...check });
report.failed = failed;
report.pass = failed.length === 0;

writeFileSync(join(out, 'motion-fidelity.json'), JSON.stringify(report, null, 1) + '\n');

// what a reader needs: the numbers, once
const first = report.cells[0];
if (first) {
  for (const [motion, m] of Object.entries(first.motions)) {
    console.log(`\n${motion}: the figure against the capture (${first.who}/${first.build}/${first.height} m)`);
    console.log(`  the capture was ${m.captureAngleDeg} degrees off the figure's heading; the turn is applied before measuring`);
    console.log(`  legs: the figure's thigh/shin/foot as a fraction of its leg: ${JSON.stringify(m.figureLeg.legFraction)}`);
    console.log(`        the capture's:                                                          ${JSON.stringify(m.captureLeg.legFraction)}`);
    console.log('  check                      figure   capture   limit      pass');
    for (const c of m.verdict.checks) console.log(`  ${c.label.padEnd(26)}${String(c.figure).padStart(7)}${String(c.capture).padStart(9)}   ${JSON.stringify(c.limit).padEnd(10)} ${c.pass ? 'yes' : 'NO'}`);
  }
}
console.log(`\ncells ${report.cells.length}  failed checks ${failed.length}  ${report.pass ? 'PASS' : 'FAIL'}`);
if (failed.length) {
  const byCheck = {};
  for (const f of failed) byCheck[`${f.motion}:${f.name}`] = (byCheck[`${f.motion}:${f.name}`] || 0) + 1;
  console.log('failing checks:', Object.entries(byCheck).map(([k, n]) => `${k} on ${n} cell${n > 1 ? 's' : ''}`).join('; '));
}
process.exit(report.pass ? 0 : 1);
