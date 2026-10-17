import http from 'node:http';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
// Browser checks for the board's way into the WAVE room (board-wave.js) and the run's way back: the Council Board opens the
// cave page with #wave=board&charge=...&skips=...&ref=...&date=..., the page goes straight into the WAVE room with the charge
// words, every page saves the run in the blocker record shape, a run that bars-engine does not take (signed out) waits in the
// browser, and the next page load sends it. Build first with `npm run build:ontology-game`, then copy this file into a folder
// that has playwright and three@0.128.0 installed and run it there, as cave-test.mjs is run:
//   OAG_PUBLIC=/path/to/bars-engine/public OAG_SHOTS=/some/dir node board-wave-test.mjs
const PUB = process.env.OAG_PUBLIC || new URL('../../../public', import.meta.url).pathname;
const SHOTS = process.env.OAG_SHOTS || '.';
const NM = new URL('./node_modules/', import.meta.url).pathname;
const files = {
  '/ontology-game/cave/': ['cave/index.html', 'text/html'],
  '/ontology-game/cave/cave-kit.glb': ['cave/cave-kit.glb', 'model/gltf-binary'],
  '/ontology-game/cave/spots.json': ['cave/spots.json', 'application/json'],
  '/ontology-game/cave/textures/wet_stone.jpg': ['cave/textures/wet_stone.jpg', 'image/jpeg'],
  '/ontology-game/cave/textures/dry_stone.jpg': ['cave/textures/dry_stone.jpg', 'image/jpeg'],
  '/ontology-game/cave/textures/crystal_vein.jpg': ['cave/textures/crystal_vein.jpg', 'image/jpeg'],
  '/ontology-game/figure.glb': ['figure.glb', 'model/gltf-binary'],
};
// The route stands in for POST /api/council/wave-runs: signed out (401) until `signedIn`, then it keeps what it is sent.
let signedIn = false;
const posts = [];
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/api/council/wave-runs' && req.method === 'POST') {
    let body = ''; req.on('data', (c) => { body += c; });
    req.on('end', () => {
      const b = JSON.parse(body); posts.push({ signedIn, ...b });
      res.writeHead(signedIn ? 200 : 401, { 'content-type': 'application/json' }); res.end(JSON.stringify(signedIn ? { ok: true } : { error: 'Sign in' }));
    });
    return;
  }
  const f = files[url];
  if (!f) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': f[1] }); res.end(readFileSync(PUB + '/ontology-game/' + f[0]));
}).listen(4571);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }).catch(() => chromium.launch());
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
await ctx.route('https://cdnjs.cloudflare.com/**', (r) => r.fulfill({ body: readFileSync(NM + 'three/build/three.min.js'), contentType: 'application/javascript' }));
const errors = [];
let passes = 0, fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (c) passes++; else { fails++; process.exitCode = 1; } };
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/401|Unauthorized/.test(m.text())) errors.push('console: ' + m.text()); });
const B = 'http://localhost:4571';
const sees = (sel) => page.locator(sel).first().isVisible();
const C = (fn, a) => page.evaluate(fn, a);
const run = () => C(() => window.__oagCave.room && window.__oagCave.room.run());

const ref = 'tap-the-vein--mg9test1';
const hash = `#wave=board&charge=${encodeURIComponent('Tap the Vein, skipped 2 days running')}&skips=2&ref=${ref}&date=2026-10-14`;
await page.goto(B + '/ontology-game/cave/' + hash);
await page.locator('[data-room="board"]').waitFor({ timeout: 30000 });
await page.locator('[data-room-welcome]').waitFor();
ok(true, 'the board\'s link opens the page straight into the WAVE room, from the board');
ok((await page.locator('[data-room-about]').textContent()).includes('Tap the Vein, skipped 2 days running'), 'Welcome names what the sitting is about, in the board\'s words');
ok(await sees('[data-room-heat-before="7"]'), 'Welcome asks how much charge it carries, 0 to 10');
await page.locator('[data-room-heat-before="7"]').click();
ok((await run()).charge.before === 7, 'the charge before is kept in the run');
await page.screenshot({ path: SHOTS + '/board-wave-welcome.png' });
await page.locator('[data-room-welcome]').click();
await page.locator('[data-room-texture]').first().waitFor({ timeout: 30000 });
await page.locator('[data-room-texture]').first().click();
await page.locator('[data-room-next]').click();
ok((await page.locator('[data-room-about]').textContent()).includes('What is in the way of Tap the Vein'), 'Acknowledge asks what is in the way of it');
await page.locator('[data-room-name]').fill('the dread of a blank page');
await page.locator('[data-room-element]').first().click();
await page.locator('[data-room-next]').click();
for (let i = 0; i < 4; i++) await page.locator('[data-room-next]').first().click(); // allow, accept, appreciate, validate
await page.locator('[data-room-goal]').fill('to start my morning clear');
await page.waitForTimeout(1800); // the half-way save goes after a short pause
const mid = posts[posts.length - 1];
ok(mid && mid.ref === ref && mid.record.engine === 'wave-room' && mid.record.rounds[0].name === 'the dread of a blank page' && mid.record.status === 'open', 'a run half way is saved: its ref, engine, the name and status open');
ok(mid && mid.record.task === 'Tap the Vein, skipped 2 days running' && mid.record.step === 'tap-the-vein' && mid.record.skipStreak === 2 && mid.record.due === '2026-10-14', 'the run carries the board\'s task, step, skip streak and date');
await page.locator('[data-room-push="toward"]').click();
await page.locator('[data-cave-321-skip]').click();
await page.locator('[data-room-move]').fill('open Tap the Vein and write three lines');
await page.locator('[data-room-move-done]').click();
await page.locator('[data-room-kept]').waitFor({ timeout: 15000 });
await page.locator('[data-room-next]').click();
await page.locator('[data-room-checkin="stayed"]').click();
await page.locator('[data-room-again="no"]').click();
ok(await sees('[data-room-ending-ask]') && (await page.locator('[data-room-ending-ask]').textContent()).includes("today's Tap the Vein"), 'when the room is quiet it asks how today\'s Tap the Vein ends');
ok((await run()).resolution.kind === 'now' && (await run()).resolution.text.includes('three lines'), 'with no ending picked, the move written in the room is the ending');
await page.locator('[data-room-ending="moved"]').click();
await page.locator('[data-room-ending-text]').fill('the morning is gone; first thing tomorrow');
await page.locator('[data-room-heat-after="3"]').click();
const end = await run();
ok(end.resolution.kind === 'moved' && end.resolution.date === '2026-10-15' && end.charge.after === 3 && end.status === 'resolved', 'Tomorrow moves it a day, with the why, and the charge after');
ok((await page.locator('[data-room-leave]').textContent()) === 'Back to the board', 'the way out is back to the board');
await page.screenshot({ path: SHOTS + '/board-wave-end.png' });
await page.locator('[data-room-leave]').click();
await page.locator('[data-board-wave-note]').waitFor({ timeout: 15000 });
const last = posts[posts.length - 1];
ok(last.record.finishedAt && last.record.resolution.kind === 'moved' && last.record.rounds[0].move === 'open Tap the Vein and write three lines' && last.record.rounds[0].aligned === true, 'leaving sends the finished run: the ending, the move, and that it pushed toward what he wants');
ok((await page.locator('[data-board-wave-note]').getAttribute('data-board-wave-sent')) === 'signin' && (await page.locator('[data-board-wave-note]').textContent()).includes('Sign in'), 'signed out, the page says the run is kept here until he signs in');
ok(await sees('[data-board-wave-back]'), 'and links back to the Council Board');
const box = await C(() => JSON.parse(localStorage.getItem('oag:wave-room:outbox') || '{}'));
ok(box[ref] && box[ref].finishedAt, 'the finished run waits in this browser');
ok(!(await C(() => location.hash)), 'the hash is cleared, so a reload does not start the room again');
await page.screenshot({ path: SHOTS + '/board-wave-sent.png' });

// signed in now: opening the cave page sends what waited, and the outbox empties
signedIn = true;
const n0 = posts.length;
await page.goto(B + '/ontology-game/cave/');
await page.waitForTimeout(1500);
const sent = posts.slice(n0).filter((p) => p.signedIn && p.ref === ref);
ok(sent.length === 1 && sent[0].record.finishedAt, 'the next page load sends the waiting run, finished');
ok(Object.keys(await C(() => JSON.parse(localStorage.getItem('oag:wave-room:outbox') || '{}'))).length === 0, 'and the outbox is empty after');
ok((await page.locator('[data-room]').count()) === 0, 'with no hash, the cave page does not open the room by itself');

ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
console.log(`${passes} passed, ${fails} failed`);
await browser.close();
server.close();
