import http from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { chromium } from 'playwright';
// Browser checks for the Cave of Lessons (cave.js, cave-kit.glb, spots.json): portals, one generic chamber dressed in the
// charge, channel and face, the daemon, the gate, and paths between the places of one sitting. Build first with
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
ok(spots.spots.length >= 50, `spots.json names ${spots.spots.length} places, each a portal`);

const pickOnFigure = async (name) => {
  await page.waitForFunction(() => window.__oagBody && window.__oagBody.anchors.length > 0);
  const at = await page.evaluate((n) => window.__oagBody.screenOf(window.__oagBody.anchors.find((x) => x.name === n).pos), name);
  await page.mouse.click(at.x, at.y);
  await page.locator('[data-body-use]').click();
};
const portalPick = async (texture, element) => {
  await page.locator('[data-cave-place="portal"]').waitFor();
  ok(await page.locator('[data-cave-choice="Anger"]').count() === 0, 'the first page asks only the charge');
  await page.locator(`[data-cave-choice="${texture}"]`).click();
  await page.locator('[data-cave-choice="Anger"]').waitFor();
  ok(await page.locator('[data-cave-choice="red"]').count() === 0, 'no face is asked at the doorway');
  await page.locator(`[data-cave-choice="${element}"]`).click();
  await page.locator('[data-cave-place="mouth"]').waitFor();
  await page.waitForTimeout(700);
};
const px = async () => (await page.screenshot()).toString('base64');
const differ = (a, b) => a !== b;

// First place: the heart, tapped on the real figure. Tension, Anger, Red.
await page.locator('[data-cave-dive]').click();
await pickOnFigure('heart');
await page.locator('[data-cave-chamber="heart"]').waitFor();
ok(true, 'tapping the heart on the figure opens its portal');
await page.waitForTimeout(500);
await page.screenshot({ path: SHOTS + '/cave-portal.png' });
await portalPick('tension', 'Anger');
const dressA = await page.evaluate(() => window.__oagCave.state.dress);
await page.screenshot({ path: SHOTS + '/cave-heart-mouth.png' });
const shotA = await px();

// The mouth asks whether anything else is showing up: name the throat from the figure.
await page.locator('[data-cave-add]').click();
await pickOnFigure('throat');
await page.locator('[data-cave-also]').waitFor();
ok((await page.evaluate(() => window.__oagCave.state.sens.length)) === 2, 'a second place named in the cave becomes a chamber of its own');
await page.locator('[data-cave-next]').click();
await page.locator('[data-cave-place="pool"]').waitFor();
ok((await page.locator('[data-cave-job]').innerText()).startsWith('Anger'), "the pool says how the channel does its job");
await page.waitForTimeout(1500);
const at = await page.evaluate(() => window.__oagCave.elementScreen());
await page.mouse.click(at.x, at.y);
await page.locator('[data-cave-touched]').waitFor();
ok(true, 'tapping the element makes it answer');
await page.waitForTimeout(300);
await page.screenshot({ path: SHOTS + '/cave-heart-pool.png' });
await page.locator('[data-cave-next]').click();

// The passage: a real daemon who steps aside.
await page.locator('[data-cave-place="passage"]').waitFor();
ok(await page.locator('[data-cave-next]').isDisabled(), 'the way on waits until a daemon is met');
await page.locator('[data-cave-choice="skeptic"]').click();
ok((await page.locator('[data-cave-daemon-job]').innerText()).includes('To doubt'), "the card tells the player the daemon's job");
ok(await page.locator('[data-cave-daemon-for]').count() === 1, 'and who the daemon works for');

await page.locator('[data-cave-aside="yes"]').click();
await page.waitForTimeout(1200);
await page.screenshot({ path: SHOTS + '/cave-heart-daemon.png' });
await page.locator('[data-cave-next]').click();

// The gate: six stones, all worked before the way on opens.
await page.locator('[data-cave-place="gate"]').waitFor();
ok(await page.locator('[data-cave-next]').isDisabled(), 'the gate stays shut until each stone has been stood at');
for (const f of ['magenta', 'red', 'amber', 'orange', 'green']) await page.locator(`[data-cave-stone="${f}"]`).click();
ok(await page.locator('[data-cave-next]').isDisabled(), 'five of six stones is not enough');
await page.locator('[data-cave-stone="teal"]').click();
await page.waitForTimeout(300);
await page.screenshot({ path: SHOTS + '/cave-heart-gate.png' });
ok(await page.locator('[data-cave-next]').isEnabled(), 'all six stones lit opens the way on');
await page.locator('[data-cave-next]').click();

// The way out: a portal to the throat, and a path to it.
await page.locator('[data-cave-place="way_out"]').waitFor();
await page.waitForTimeout(500);
await page.screenshot({ path: SHOTS + '/cave-heart-out.png' });
await page.locator('[data-cave-portal="throat"]').click();
await page.locator('[data-cave-place="path"]').waitFor();
await page.waitForTimeout(1200);
await page.screenshot({ path: SHOTS + '/cave-path.png' });
await page.locator('[data-cave-place="portal"]').waitFor({ timeout: 15000 });
ok(await page.evaluate(() => window.__oagCave.state.cur.id) === 'throat', 'the path leads to the throat portal');

// Second place: different charge, channel and face, so the same chamber must look different.
await portalPick('numbness', 'Sadness');
const dressB = await page.evaluate(() => window.__oagCave.state.dress);
await page.screenshot({ path: SHOTS + '/cave-throat-mouth.png' });
const shotB = await px();
ok(dressA.wall !== dressB.wall && dressA.element !== dressB.element && dressA.lamp !== dressB.lamp && dressA.width !== dressB.width, `two scans dress the chamber differently, each element its own object (${JSON.stringify(dressA)} vs ${JSON.stringify(dressB)})`);
ok(differ(shotA, shotB), 'and the two screens differ');
await page.locator('[data-cave-next]').click();
await page.locator('[data-cave-next]').click();
await page.locator('[data-cave-choice="victim"]').click();
await page.locator('[data-cave-aside="not-yet"]').click();
ok(await page.locator('[data-cave-next]').isEnabled(), 'a daemon that is not ready does not trap the player');
await page.locator('[data-cave-next]').click();
for (const f of ['magenta', 'red', 'amber', 'orange', 'green', 'teal']) await page.locator(`[data-cave-stone="${f}"]`).click();
await page.locator('[data-cave-next]').click();
await page.locator('[data-cave-place="way_out"]').waitFor();
await page.getByText('Come back out').click();
await page.locator('[data-cave-chamber]').waitFor({ state: 'detached' });
const marks = await page.evaluate(() => window.OAGBody.marks());
ok(marks.length === 2 && marks[0].label === 'my heart' && marks[0].texture === 'tension' && marks[0].channel === 'Anger' && marks[1].label === 'my throat' && marks[1].texture === 'numbness' && marks[0].sitting === marks[1].sitting,
  'both places are saved as one sitting, the way the body map saves them');

// Any portal opens the same chamber: the same two choices at a hand give the same dress as at the throat.
const dresses = [];
for (const words of ['my left hand', 'my throat']) {
  await page.evaluate((w) => window.__oagCave.dive(w), words);
  await portalPick('tension', 'Anger');
  dresses.push(await page.evaluate(() => JSON.stringify(window.__oagCave.state.dress)));
  await page.evaluate(() => window.__oagCave.leave(false));
  await page.locator('[data-cave-chamber]').waitFor({ state: 'detached' });
}
ok(dresses[0] === dresses[1] && dresses[0] === JSON.stringify(dressA), 'every portal opens the same chamber for the same charge and channel');
ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
await browser.close(); server.close();
