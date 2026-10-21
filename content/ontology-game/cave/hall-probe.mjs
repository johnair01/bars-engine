// Controls round 1b (Six-faces-council council/callsheets/cave-controls.md; Wendell, 2026-10-21: "The player should face in the
// direction of the stick"): in the hall the figure faces the stick and the camera comes round behind it, held long enough to go
// well round the ring without the camera flipping, and in a tunnel the figure still faces the stick. A few minutes; build first
// with `npm run build:ontology-game`, then from a folder with playwright and three@0.128.0 installed:
//   OAG_PUBLIC=/path/to/bars-engine/public node hall-probe.mjs
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright';
const PUB = process.env.OAG_PUBLIC || new URL('../../../public', import.meta.url).pathname, NM = new URL('./node_modules/', import.meta.url).pathname, PORT = +(process.env.PORT || 4572);
const server = http.createServer((req, res) => {
  const u = req.url.split('?')[0], f = u === '/ontology-game/cave' ? PUB + '/ontology-game/cave/index.html' : PUB + u;
  if (!existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : f.endsWith('.json') ? 'application/json' : f.endsWith('.jpg') ? 'image/jpeg' : 'model/gltf-binary' }); res.end(readFileSync(f));
}).listen(PORT);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }).catch(() => chromium.launch());
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
await ctx.route('https://cdnjs.cloudflare.com/**', (r) => r.fulfill({ body: readFileSync(NM + 'three/build/three.min.js'), contentType: 'application/javascript' }));
const page = await ctx.newPage(); const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const C = (f, a) => page.evaluate(f, a);
const wrapA = (d) => Math.atan2(Math.sin(d), Math.cos(d));
await page.addInitScript(() => { try { localStorage.setItem('oag.tutorial.v1', JSON.stringify(['walk', 'look', 'mark', 'stone', 'tap', 'rug'])); } catch (e) {} });
await page.goto(`http://localhost:${PORT}/ontology-game/cave?go=elder`);
await page.waitForFunction(() => window.__oagCave && window.__oagCave.room, null, { timeout: 90000 });
await page.waitForTimeout(1500);
await C(() => window.__oagCave.room.speed(3));
await C(() => window.__oagCave.room.walkTo('portal'));
await page.locator('[data-room-portal]').click({ timeout: 60000 });
await page.locator('[data-cave-level="hall"]').waitFor({ timeout: 30000 });
await page.waitForTimeout(700);
await C(() => { window.__oagCave.state.speed = 8; });
// 1. the hall check from cave-test.mjs, unchanged
const h0 = await C(() => window.__oagCave.free());
await page.keyboard.down('ArrowUp'); await page.keyboard.down('ArrowRight'); await page.waitForTimeout(2500);
const h1 = await C(() => window.__oagCave.free());
ok(Math.abs(wrapA(h1.camYaw - h0.camYaw)) > 0.3 && Math.abs(wrapA(h1.camYaw - h1.yaw)) < 0.6, `hall: the camera comes round behind the figure (turned ${wrapA(h1.camYaw - h0.camYaw).toFixed(2)}, ${wrapA(h1.camYaw - h1.yaw).toFixed(2)} off its back)`);
// 2. held on for six seconds more: the camera never flips half round, and the figure faces the stick, not the slide
let worst = 0, flip = false, prev = h1.camYaw;
for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(500);
  const h = await C(() => window.__oagCave.free());
  if (Math.abs(wrapA(h.camYaw - prev)) > 1.5) flip = true; prev = h.camYaw;
  worst = Math.max(worst, Math.abs(wrapA(h.camYaw - h.yaw)));
}
await page.keyboard.up('ArrowRight'); await page.keyboard.up('ArrowUp');
ok(!flip && worst < 0.6, `hall, held 8.5 s: no flip, the camera at most ${worst.toFixed(2)} off the figure's back`);
ok((await C(() => window.__oagCave.camRoom())) > 0, 'and the camera stays inside the stone');
// 3. a fresh push left: the figure faces left of the camera's forward as the thumb went down (by the wall the camera can sit a
// little off the figure's back, so this reads the frame the stick took, not wk.camYaw)
await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(800);
const c1 = await C(() => ({ yaw: window.__oagCave.state.walk.yaw, frame: window.__oagCave.state.stickYaw }));
await page.keyboard.up('ArrowLeft');
ok(c1.frame != null && Math.abs(wrapA(c1.yaw - (c1.frame + Math.PI / 2))) < 0.35, `left on the stick faces left of the camera (${c1.frame == null ? 'no frame' : wrapA(c1.yaw - c1.frame).toFixed(2)}, want 1.57)`);
// 4. up held: the figure still walks round the ring (the levels walk to the next door this way), with the camera behind it
const u0 = await C(() => window.__oagCave.free());
await page.keyboard.down('ArrowUp'); await page.waitForTimeout(3000);
const u1 = await C(() => window.__oagCave.free());
await page.keyboard.up('ArrowUp');
ok(Math.abs(u1.s - u0.s) > 8 && Math.abs(wrapA(u1.camYaw - u1.yaw)) < 0.6, `up held walks round the ring (${(u1.s - u0.s).toFixed(1)} along it, camera ${wrapA(u1.camYaw - u1.yaw).toFixed(2)} off the figure's back)`);
await page.screenshot({ path: process.env.SHOT || '/dev/null' }).catch(() => {});
ok(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
console.log(`${fails ? 'FAIL' : 'PASS'}: ${fails} failed`);
await browser.close(); server.close(); process.exit(fails ? 1 : 0);
