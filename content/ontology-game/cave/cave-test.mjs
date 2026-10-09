import http from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { chromium } from 'playwright';
// Browser checks for the Cave of Lessons (cave.js, cave-kit.glb, spots.json). Build first with
// `npm run build:ontology-game`, then copy this file into a folder that has playwright and
// three@0.128.0 installed and run it there:
//   OAG_PUBLIC=/path/to/bars-engine/public OAG_SHOTS=/some/dir node cave-test.mjs
const PUB = process.env.OAG_PUBLIC || new URL('../../../public', import.meta.url).pathname;
const SHOTS = process.env.OAG_SHOTS || '.';
const NM = new URL('./node_modules/', import.meta.url).pathname;
const files = {
  '/ontology-game/cave': ['cave/index.html', 'text/html'],
  '/ontology-game/cave/cave-kit.glb': ['cave/cave-kit.glb', 'model/gltf-binary'],
  '/ontology-game/cave/spots.json': ['cave/spots.json', 'application/json'],
  '/ontology-game/figure.glb': ['figure.glb', 'model/gltf-binary'],
};
const server = http.createServer((req, res) => {
  const f = files[req.url.split('?')[0]];
  if (!f) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': f[1] }); res.end(readFileSync(PUB + '/ontology-game/' + f[0]));
}).listen(4569);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }).catch(() => chromium.launch());
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
await ctx.route('https://cdnjs.cloudflare.com/**', (r) => r.fulfill({ body: readFileSync(NM + 'three/build/three.min.js'), contentType: 'application/javascript' }));
const errors = [];
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const B = 'http://localhost:4569';

const kit = statSync(PUB + '/ontology-game/cave/cave-kit.glb').size;
ok(kit < 3_000_000, `the kit is ${Math.round(kit / 1024)} KB, under the 3 MB budget`);
await page.goto(B + '/ontology-game/cave');
const spots = await page.evaluate(() => fetch('/ontology-game/cave/spots.json').then((r) => r.json()));
ok(spots.spots.length >= 50, `spots.json names ${spots.spots.length} places, each its own chamber`);
const byId = Object.fromEntries(spots.spots.map((s) => [s.id, s]));
ok(byId.throat.width < byId.heart.width && byId.left_hand.length < byId.left_forearm.length, 'the throat is narrower than the chest, a hand shorter than a forearm');

// Dive in from the real figure picker at the heart.
await page.locator('[data-cave-dive]').click();
await page.waitForFunction(() => window.__oagBody && window.__oagBody.anchors.length > 0);
const at = await page.evaluate(() => window.__oagBody.screenOf(window.__oagBody.anchors.find((x) => x.name === 'heart').pos));
await page.mouse.click(at.x, at.y);
await page.locator('[data-body-use]').click();
await page.locator('[data-cave-chamber="heart"]').waitFor();
ok(true, 'tapping the heart on the figure dives into the heart chamber');

const walk = async (id, texture = 'tension', element = 'Anger') => {
  for (const [place, pick] of [['mouth', texture], ['pool', element]]) {
    await page.locator(`[data-cave-place="${place}"]`).waitFor();
    await page.locator(`[data-cave-choice="${pick}"]`).click();
    await page.locator('[data-cave-next]').click();
  }
  await page.locator('[data-cave-place="passage"]').waitFor();
  ok(await page.locator('[data-cave-daemon-for]').count() === 1, `${id}: the passage tells the player who the daemon works for`);
  await page.locator('[data-cave-next]').click();
  await page.locator('[data-cave-place="gate"]').waitFor();
  await page.locator('[data-cave-next]').click();
  await page.locator('[data-cave-place="way_out"]').waitFor();
};
await page.waitForTimeout(700);
await page.screenshot({ path: SHOTS + '/cave-heart-mouth.png' });
await page.locator('[data-cave-choice="tension"]').click();
await page.locator('[data-cave-next]').click();
await page.locator('[data-cave-choice="Anger"]').click();
await page.waitForTimeout(300);
await page.screenshot({ path: SHOTS + '/cave-heart-pool.png' });
await page.locator('[data-cave-next]').click();
await page.locator('[data-cave-next]').click();
await page.locator('[data-cave-next]').click();
await page.locator('[data-cave-place="way_out"]').waitFor();
await page.waitForTimeout(900);
await page.screenshot({ path: SHOTS + '/cave-heart-out.png' });
await page.getByText('Come back out').click();
await page.locator('[data-cave-chamber]').waitFor({ state: 'detached' });
const marks = await page.evaluate(() => window.OAGBody.marks());
ok(marks.length === 1 && marks[0].label === 'my heart' && marks[0].texture === 'tension' && marks[0].channel === 'Anger', 'coming out saves the scan as the body map saves one');

// The throat and a hand, entered by name; each walks at phone size.
for (const [id, words] of [['throat', 'my throat'], ['left_hand', 'my left hand']]) {
  await page.evaluate((w) => window.__oagCave.dive(w), words);
  await page.locator(`[data-cave-chamber="${id}"]`).waitFor();
  await page.waitForTimeout(700);
  await page.screenshot({ path: SHOTS + `/cave-${id}-mouth.png` });
  await walk(id);
  await page.getByText('Come back out').click();
  await page.locator('[data-cave-chamber]').waitFor({ state: 'detached' });
  ok(true, `${id}: walked the five places and came out`);
}
ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
await browser.close(); server.close();
