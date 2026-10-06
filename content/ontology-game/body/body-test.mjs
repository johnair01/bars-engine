import http from 'node:http';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
// Browser checks for the body map (body-map.js, figure.glb). Build first with
// `npm run build:ontology-game`, then copy this file into a folder that has playwright,
// react@18.2.0, react-dom@18.2.0 and three@0.128.0 installed and run it there:
//   OAG_PUBLIC=/path/to/bars-engine/public node body-test.mjs
// React and three.js are served from that folder because the test browser may not reach cdnjs.
const PUB = process.env.OAG_PUBLIC || new URL('../../../public', import.meta.url).pathname;
const SHOTS = process.env.OAG_SHOTS || '.';
const NM = new URL('./node_modules/', import.meta.url).pathname;
const server = http.createServer((req, res) => {
  const p = req.url.split('?')[0];
  const files = {
    '/ontology-game': ['index.html', 'text/html'],
    '/ontology-game/body': ['body.html', 'text/html'],
    '/ontology-game/figure.glb': ['figure.glb', 'model/gltf-binary'],
  };
  if (files[p]) {
    res.writeHead(200, { 'content-type': files[p][1] });
    res.end(readFileSync(PUB + '/ontology-game/' + files[p][0]));
    return;
  }
  res.writeHead(404); res.end();
}).listen(4568);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }).catch(() => chromium.launch());
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
await ctx.addInitScript(() => { window.__breathScale = 0.01; window.__forcePracticeId = 'breaths'; });
await ctx.route('https://cdnjs.cloudflare.com/**', (route) => {
  const u = route.request().url();
  const f = u.includes('three') ? NM + 'three/build/three.min.js'
    : u.includes('react-dom') ? NM + 'react-dom/umd/react-dom.production.min.js' : NM + 'react/umd/react.production.min.js';
  route.fulfill({ body: readFileSync(f), contentType: 'application/javascript' });
});
const errors = [];
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) process.exitCode = 1; };
const B = 'http://localhost:4568';
const page = await ctx.newPage();
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

// Tap a named anchor on the figure, at the point where it is drawn on screen right now.
const tapAnchor = async (pg, name) => {
  await pg.waitForFunction(() => window.__oagBody && window.__oagBody.anchors.length > 0);
  const at = await pg.evaluate((n) => {
    const a = window.__oagBody.anchors.find((x) => x.name === n);
    return window.__oagBody.screenOf(a.pos);
  }, name);
  await pg.mouse.click(at.x, at.y);
};
const where = "e.g., 'my throat', 'my solar plexus', 'behind my sternum'";

await page.goto(B + '/ontology-game');
await page.getByRole('button', { name: 'Begin Practice' }).click();
ok(await page.locator('[data-body-pick]').count() === 1, 'the scan offers "Show me on a body"');
ok(await page.locator('[data-body-history]').count() === 0, 'no history link before any mark');

// Pick the throat on the figure.
await page.locator('[data-body-pick]').click();
await tapAnchor(page, 'throat');
ok((await page.locator('[data-body-picked]').textContent()) === 'My throat', 'tapping the throat names it');
await page.screenshot({ path: SHOTS + '/body-pick.png' });
await page.locator('[data-body-use]').click();
ok(await page.locator('.oagb').count() === 0, 'the figure closes after "Use this place"');
ok((await page.getByPlaceholder(where).inputValue()) === 'my throat', 'the place fills the location box');

// Turn to the back and pick the lower back; the label changes with the side.
await page.locator('[data-body-pick]').click();
await page.locator('[data-body-back]').click();
await tapAnchor(page, 'lower_back');
ok((await page.locator('[data-body-picked]').textContent()) === 'My lower back', 'the back of the figure names back places');
await page.locator('[data-body-close]').click();
ok((await page.getByPlaceholder(where).inputValue()) === 'my throat', 'closing without using keeps the old place');

// Confirm the scan: one mark saved, with the exact tapped point.
await page.locator('select').first().selectOption('constriction');
await page.getByText('This is it', { exact: true }).first().click();
let marks = await page.evaluate(() => window.OAGBody.marks());
ok(marks.length === 1 && marks[0].label === 'my throat' && marks[0].texture === 'constriction' && Array.isArray(marks[0].point),
  'the confirmed scan is saved with its point: ' + JSON.stringify(marks[0]));

// A second sitting, with a typed place the figure knows and one it doesn't.
await page.evaluate(() => {
  const m = JSON.parse(localStorage.getItem('oag:body:marks'));
  const day = 24 * 3600 * 1000;
  m.push({ t: Date.now() - 3 * day, sitting: 'a', label: 'my heart', texture: 'tension' });
  m.push({ t: Date.now() - 3 * day + 60000, sitting: 'a', label: 'my jaw', texture: 'numbness' });
  m.push({ t: Date.now() - 2 * day, sitting: 'b', label: 'behind my sternum', texture: 'tension' });
  localStorage.setItem('oag:body:marks', JSON.stringify(m));
});

// The standalone page: marks over time.
const p2 = await ctx.newPage();
p2.on('pageerror', e => errors.push('pageerror2: ' + e.message));
await p2.goto(B + '/ontology-game/body');
await p2.waitForFunction(() => window.__oagBody && window.__oagBody.anchors.length > 0);
ok(await p2.locator('[data-body-place]').count() === 4, 'four places listed');
ok(await p2.locator('[data-body-sitting]').count() === 3, 'three sittings listed');
ok(/my heart \(tension\), then my jaw \(numbness\)/.test(await p2.locator('[data-body-sitting]').nth(2).textContent()), 'a sitting reads as a path in words');
ok(/behind my sternum/.test(await p2.locator('.oagb-side').textContent()), 'a typed place the figure cannot show is still listed');
ok(/Latest: .*my throat \(tightness\)/.test(await p2.locator('[data-body-when]').textContent()), 'the latest mark is named');
await p2.screenshot({ path: SHOTS + '/body-history.png' });
await p2.locator('[data-body-scrub]').fill('2');
ok(/Up to .*my jaw/.test(await p2.locator('[data-body-when]').textContent()), 'the slider steps back in time');
ok(await p2.locator('[data-body-sitting]').count() === 1, 'stepping back hides later sittings');

// The game shows the history link now that marks exist, and it opens over the game.
await page.reload();
await page.getByRole('button', { name: 'Begin Practice' }).click();
ok(await page.locator('[data-body-history]').count() === 1, 'the history link appears once marks exist');
await page.locator('[data-body-history]').click();
await page.waitForFunction(() => window.__oagBody && window.__oagBody.anchors.length > 0);
ok(await page.locator('[data-body-place]').count() === 4, 'history opens over the game');
await page.locator('[data-body-close]').click();

// Typing a place still works without the figure, and the guided demo saves nothing.
await page.getByPlaceholder(where).fill('my belly');
await page.locator('select').first().selectOption('tension');
await page.getByText('This is it', { exact: true }).first().click();
marks = await page.evaluate(() => window.OAGBody.marks());
ok(marks.length === 5 && marks[4].label === 'my belly' && !marks[4].point, 'a typed scan is saved without a point');

const p3 = await ctx.newPage();
await p3.goto(B + '/ontology-game');
await p3.getByText('Try a guided demo first').click();
for (let i = 0; i < 60; i++) {
  if (await p3.getByText('Demo complete').count()) break;
  await p3.getByText('Skip this step').click();
  await p3.waitForTimeout(30);
}
ok((await p3.evaluate(() => window.OAGBody.marks())).length === 5, 'the guided demo saves no marks');

ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
await browser.close();
server.close();
