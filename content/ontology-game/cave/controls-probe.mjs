// Phone controls, round 1 (Six-faces-council council/callsheets/cave-controls.md): touch checks for the cave that run in a few
// minutes rather than cave-test.mjs's half hour. A tap against a drag (TOUCH.px, TOUCH.ms), two thumbs at once (the floating
// stick on the left, the look on the right), a pinch, and the camera walked into a wall with the view dragged toward it; then
// home base by the skip-ahead link (?go=elder), where Talk opens the elder's card. Build first with `npm run
// build:ontology-game`, then from a folder with playwright and three@0.128.0 installed:
//   OAG_PUBLIC=/path/to/bars-engine/public node controls-probe.mjs
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright';
const PUB = process.env.OAG_PUBLIC || new URL('../../../public', import.meta.url).pathname, NM = new URL('./node_modules/', import.meta.url).pathname, PORT = +(process.env.PORT || 4571);
const server = http.createServer((req, res) => {
  const u = req.url.split('?')[0], f = u === '/ontology-game/cave' ? PUB + '/ontology-game/cave/index.html' : PUB + u;
  if (!existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : f.endsWith('.json') ? 'application/json' : f.endsWith('.jpg') ? 'image/jpeg' : 'model/gltf-binary' }); res.end(readFileSync(f));
}).listen(PORT);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }).catch(() => chromium.launch());
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
await ctx.route('https://cdnjs.cloudflare.com/**', (r) => r.fulfill({ body: readFileSync(NM + 'three/build/three.min.js'), contentType: 'application/javascript' }));
const page = await ctx.newPage(); const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
const cdp = await ctx.newCDPSession(page);
// each touch carries a clock that moves only with W, so a slow software-rendered frame does not stretch a tap
let clock = Date.now() / 1000;
const T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, timestamp: clock, touchPoints: pts.map(([x, y, id]) => ({ x, y, id })) });
const W = (ms) => { clock += ms / 1000; return page.waitForTimeout(ms); };
const S = (e) => page.evaluate(`(() => { const s = window.__oagCave.state; return ${e}; })()`);
const out = {}; let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
await page.addInitScript(() => { try { localStorage.setItem('oag.tutorial.v1', JSON.stringify(['walk', 'look', 'mark', 'stone', 'tap', 'rug'])); } catch (e) {} });
await page.goto(`http://localhost:${PORT}/ontology-game/cave`);
await page.waitForFunction(() => window.__oagCave && window.__oagCave.dive, null, { timeout: 60000 }); await page.evaluate(() => window.__oagCave.dive('my heart'));
await page.locator('[data-cave-choice="tension"]').click({ timeout: 90000 });
await page.locator('[data-cave-choice="Anger"]').click();
await page.locator('[data-cave-place="walk"]').waitFor();
await page.locator('[data-cave-stick]').waitFor({ state: 'visible', timeout: 30000 });
await W(1500);
// 1. a tap on the right half: no look, the figure is sent (a ring)
let y0 = await S('s.look.yaw');
await T('touchStart', [[300, 520, 1]]); await W(60); await T('touchMove', [[305, 524, 1]]); await W(60); await T('touchEnd', []);
await page.waitForTimeout(100);
const tapGo = await S('!!(s.walk && s.walk.goTo)'), tapYaw = await S('s.look.yaw'); 
ok(tapGo && Math.abs(tapYaw - y0) < 1e-6, `a 6px tap under 500ms is a tap: the figure is sent, the view does not turn (goTo ${tapGo})`);
await S('(s.walk.goTo = null, 0)'); await W(300);
// 2. a 9px touch held past 500ms is neither a tap nor a look
y0 = await S('s.look.yaw');
await T('touchStart', [[300, 520, 1]]); await W(50); await T('touchMove', [[309, 520, 1]]); await W(600); await T('touchEnd', []); await W(150);
ok(!(await S('!!s.walk.goTo')) && Math.abs((await S('s.look.yaw')) - y0) < 1e-6, 'a 9px touch held 600ms: not a tap, and under the line it does not turn the view');
// 3. a 12px drag turns the view at once (no dead band from 8 to 12)
y0 = await S('s.look.yaw');
await T('touchStart', [[300, 520, 1]]); await W(40); await T('touchMove', [[312, 520, 1]]); await W(40); await T('touchEnd', []); await W(150);
const d12 = (await S('s.look.yaw')) - y0;
ok(d12 > 0.05 && !(await S('!!s.walk.goTo')), `a 12px drag turns the view by its whole 12px (${d12.toFixed(3)} rad) and sends nobody`);
// 4. two thumbs: left walks (the stick comes under it), right looks, at the same time
const s0 = await page.evaluate(() => window.__oagCave.free().s); y0 = await page.evaluate(() => window.__oagCave.free().camYaw + window.__oagCave.state.look.yaw);
await T('touchStart', [[80, 600, 1]]); await W(50);
const pad = await page.evaluate(() => { const r = document.querySelector('[data-cave-stick]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
await T('touchMove', [[80, 560, 1]]); await W(50);
await T('touchStart', [[80, 560, 1], [300, 500, 2]]); await W(50);
for (let i = 1; i <= 8; i++) { await T('touchMove', [[80, 550, 1], [300 + i * 8, 500, 2]]); await W(60); }
await W(800);
const s1 = await page.evaluate(() => window.__oagCave.free().s), y1 = await page.evaluate(() => window.__oagCave.free().camYaw + window.__oagCave.state.look.yaw), wk = await page.evaluate(() => window.__oagCave.free().moving);
await T('touchEnd', [[300 + 64, 500, 2]]); await W(50); await T('touchEnd', []); await W(200);
const home = await page.evaluate(() => { const r = document.querySelector('[data-cave-stick]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
ok(Math.hypot(pad[0] - 80, pad[1] - 600) < 3, `the stick comes under the left thumb (${pad.map((v) => v.toFixed(0))})`);
ok(s1 > s0 + 1 && Math.abs(y1 - y0) > 0.1, `left thumb walks (${s0.toFixed(1)} to ${s1.toFixed(1)}) while the right thumb turns the view (${(y1 - y0).toFixed(2)} rad), together`);
ok(Math.hypot(home[0] - 80, home[1] - 600) > 20, `and it goes back to its corner when the thumb lifts (${home.map((v) => v.toFixed(0))})`);
// 5. pinch on the right half
{
  const z0 = await S('s.zoom');
  await T('touchStart', [[260, 400, 1]]); await T('touchStart', [[260, 400, 1], [340, 480, 2]]); await W(40);
  for (let i = 1; i <= 6; i++) { await T('touchMove', [[260 - i * 6, 400 - i * 6, 1], [340 + i * 6, 480 + i * 6, 2]]); await W(40); }
  await T('touchEnd', []); await W(200);
  const z1 = await S('s.zoom');
  ok(z1 < z0 - 0.15, `two fingers spread on the right bring the camera nearer (zoom ${z0} to ${z1.toFixed(2)})`);
  await S('(s.zoom = 1, 0)');
}
// 6. the camera by a wall: walk into the side wall with the view turned toward it; track the largest jump of the camera per frame
await page.evaluate(() => window.__oagCave.stick(1, -0.3));
const trace = await page.evaluate(() => new Promise((done) => {
  const c = window.__oagCave, cam = () => c.camPos ? c.camPos() : null; const out = []; let n = 0; let last = null;
  function f() {
    const st = c.state, fr = c.free(); const ci = c.camInside(); const fig = c.figurePos ? c.figurePos() : null;
    const p = c.camAt ? c.camAt() : null, room = c.camRoom ? c.camRoom() : null; out.push({ inside: ci.inside, room, p, s: fr.s, lat: fr.lat });
    if (n < 40) st.look.yaw += 0.035; // a thumb dragging the view round toward the wall
    if (++n < 150) requestAnimationFrame(f); else done(out);
  }
  requestAnimationFrame(f);
}));
await page.evaluate(() => window.__oagCave.stick(0, 0));
const inside = trace.filter((t) => t.inside).length;
ok(inside >= trace.length * 0.97, `walking into the wall with the view turned at it, the camera stays inside: ${inside} of ${trace.length} frames`);
const jumps = trace.slice(1).map((t, i) => t.p && trace[i].p ? Math.hypot(t.p[0] - trace[i].p[0], t.p[1] - trace[i].p[1], t.p[2] - trace[i].p[2]) : 0);
const fig = trace.map((t) => t.lat);
out.wall = { inside, n: trace.length, minRoom: Math.min(...trace.map((t) => typeof t.room === 'number' ? t.room : 9)).toFixed(2), maxJump: Math.max(...jumps).toFixed(3), p95Jump: jumps.slice().sort((a, b) => a - b)[Math.floor(jumps.length * 0.95)].toFixed(3), lat: [fig[0].toFixed(2), fig[fig.length - 1].toFixed(2)] };
console.log(`camera steps per frame by the wall: largest ${Math.max(...jumps).toFixed(3)}, 95th ${out.wall.p95Jump}`);
// home base by the preview's skip-ahead: the figure stands by the elder, and Talk (88px) opens its card
await page.goto(`http://localhost:${PORT}/ontology-game/cave?go=elder`);
await page.locator('[data-room-talk]').waitFor({ state: 'visible', timeout: 90000 }).catch(() => {});
const talk = await page.evaluate(() => { const b = document.querySelector('[data-room-talk]'), r = b && b.getBoundingClientRect(); return b && b.offsetParent ? [r.width, r.height] : null; });
ok(talk && talk[0] >= 88 && talk[1] >= 88, `?go=elder stands the figure by the elder with Talk showing, ${talk ? talk.join(' by ') : 'not'} px`);
if (talk) { await page.locator('[data-room-talk]').tap(); await page.locator('[data-room-elder]').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}); await page.waitForTimeout(800); }
ok(talk && await page.locator('[data-room-elder]').isVisible() && !(await page.locator('[data-room-talk]').isVisible()), 'Talk opens the elder\'s card, and steps aside while it is open');
ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
console.log(JSON.stringify(out));
await browser.close(); server.close(); process.exit(fails ? 1 : 0);
