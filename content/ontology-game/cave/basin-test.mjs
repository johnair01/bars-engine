import http from 'node:http';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { chromium } from 'playwright';
// Browser checks for the basin (basin.js) and its mouth in the WAVE room (cave.js): the page's words hold to the stop list (B3),
// the brow's floor sets its run, the crown answers once at the third floor, the room has the basin's mouth, walking into the
// basin's mouth goes back to the room, and a Fear sitting raises the brow. Screenshots for a look go to OAG_SHOTS.
// Build first with `npm run build:ontology-game`, then: node content/ontology-game/cave/basin-test.mjs
//   OAG_PUBLIC (default ../../../public), OAG_THREE (three.min.js r128; default node_modules/three/build/three.min.js),
//   OAG_SHOTS (default /tmp/basin-shots)
const PUB = process.env.OAG_PUBLIC || new URL('../../../public', import.meta.url).pathname;
const THREE_JS = process.env.OAG_THREE || new URL('../../../node_modules/three/build/three.min.js', import.meta.url).pathname;
const SHOTS = process.env.OAG_SHOTS || '/tmp/basin-shots';
mkdirSync(SHOTS, { recursive: true });
const TYPES = { html: 'text/html', jpg: 'image/jpeg', glb: 'model/gltf-binary', json: 'application/json' };
const server = http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/ontology-game/cave' || u === '/ontology-game/cave/') u = '/ontology-game/cave/index.html';
  const f = PUB + u;
  if (u.includes('..') || !existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[u.split('.').pop()] || 'application/octet-stream' }); res.end(readFileSync(f));
}).listen(4583);
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }).catch(() => chromium.launch());
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await ctx.route('https://cdnjs.cloudflare.com/**', (r) => r.fulfill({ body: readFileSync(THREE_JS), contentType: 'application/javascript' }));
let passes = 0, fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (c) passes++; else { fails++; process.exitCode = 1; } };
const errors = [];
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('console: ' + m.text()); });
const B = 'http://localhost:4583/ontology-game/cave';
// the stop list (B3), as organs-test.mjs holds basin.js's WORDS to it; "water" is a landscape word, Water the element
const STOP = /\b(level|levels|capacity|full|empty|locked|lock|shut|unavailable|closed|progress|charge|charges|liver|kidneys?|lungs?|spleen|heart|dantian|meridians?|chakras?|organs?|metal|wood|fire|earth)\b|\d|%/i, STOP_CASED = /\bWater\b/;
const basinState = () => page.evaluate(() => window.__oagBasin && window.__oagBasin.state());
let firstSeen = null; // the state as it was the moment the basin first stood up
async function openBasin(brow) {
  await page.goto(`${B}?go=basin&brow=${brow}&tour=0`);
  firstSeen = await page.waitForFunction(() => { const b = window.__oagBasin; const st = b && b.state(); return st && st.open && st.figure ? st : null; }, null, { timeout: 30000, polling: 50 }).then((h) => h.jsonValue(), () => null);
  return !!firstSeen;
}
async function words() {
  return page.evaluate(() => {
    const w = document.querySelector('[data-basin]');
    const vis = w ? w.innerText : '';
    const live = [...document.querySelectorAll('[data-basin] [aria-live]')].map((n) => n.textContent).join(' | ');
    const labels = [...document.querySelectorAll('[data-basin] [aria-label]')].map((n) => n.getAttribute('aria-label')).join(' | ');
    return { vis, live, labels };
  });
}
function clean(name, s) { const m = String(s).match(STOP) || String(s).match(STOP_CASED); ok(!m, `${name} has no digit and nothing on the stop list` + (m ? ` (found "${m[0]}" in: ${s})` : '')); }

// ---- at rest -----------------------------------------------------------------------------------------------------------------
ok(await openBasin(0), 'the basin opens from ?go=basin');
await page.waitForTimeout(3500);
let s = await basinState();
ok(s.runs.brow === 0 && !s.answered, 'brow=0: no run, the crown does not answer');
ok(s.seats.length === 6 && s.edges.length === 10, 'six seats, ten watercourses');
ok(s.at === 'heart', 'the figure arrives on the heart\'s ledge');
let w = await words();
ok(/Inside\./.test(w.live), 'the arrival line is read out');
clean('rest: visible text', w.vis); clean('rest: the aria-live line', w.live); clean('rest: the labels', w.labels);
await page.screenshot({ path: SHOTS + '/rest.png' });

// ---- lit to the third floor ---------------------------------------------------------------------------------------------------
ok(await openBasin(3), 'the basin opens at brow=3');
await page.waitForFunction(() => window.__oagBasin.state().answered, null, { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(2500); // the ripple has passed and the line is held
s = await basinState();
ok(s.runs.brow === 3, 'brow=3: runs.brow is the third floor');
ok(s.answered, 'the crown answers');
w = await words(); clean('lit: visible text', w.vis); clean('lit: the aria-live line', w.live);
await page.screenshot({ path: SHOTS + '/lit.png' });
// stand at the brow, then the crown; trace between
await page.evaluate(() => window.__oagBasin.walkTo('brow', { now: true, face: 'crown', zoom: 0.55 }));
await page.waitForTimeout(1600);
s = await basinState(); w = await words();
ok(s.at === 'brow' && /seam runs/.test(w.live), 'standing at the brow shows its line, lit');
clean('brow: the aria-live line', w.live);
await page.screenshot({ path: SHOTS + '/brow-lit.png' });
await page.evaluate(() => window.__oagBasin.walkTo('crown', { now: true }));
await page.waitForTimeout(800);
w = await words();
ok(/holds the whole of the stone/.test(w.live), 'at the crown, the answered pool\'s line');
// the camera: the arrival view is the close follow camera; the wide view is one press (or C) away and shows every spring
s = await basinState();
ok(s.view === 'near', 'the basin opens on the close follow camera: ' + s.view);
ok(await page.evaluate(() => document.querySelector('[data-basin-view]') && document.querySelector('button[data-basin-view]').getAttribute('aria-pressed') === 'false'), 'the view button is there, not pressed');
await page.click('button[data-basin-view]');
s = await basinState(); ok(s.view === 'far', 'pressing it gives the wide view');
await page.waitForTimeout(1500);
await page.keyboard.press('c');
s = await basinState(); ok(s.view === 'near', 'C goes back to the close view');
await page.keyboard.press('c');
await page.waitForTimeout(1500);

// trace: standing at the low spring, a tap on the seam lights the water between; a second tap walks there
await page.evaluate(() => window.__oagBasin.walkTo('heart', { now: true }));
await page.waitForTimeout(1500);
let sp = await page.evaluate(() => window.__oagBasin.screenOf('dantian'));
await page.mouse.click(sp.x, sp.y);
await page.waitForTimeout(300);
s = await basinState();
ok(s.tracing.length > 0 && s.at === 'heart', 'a tap on another spring traces the water to it: ' + JSON.stringify(s.tracing));
w = await words(); ok(/shows its way/.test(w.live), 'and says so'); clean('trace: the aria-live line', w.live);
sp = await page.evaluate(() => window.__oagBasin.screenOf('dantian'));
await page.mouse.click(sp.x, sp.y);
ok(await page.waitForFunction(() => window.__oagBasin.state().at === 'dantian', null, { timeout: 45000 }).then(() => true, () => false), 'a second tap walks there, and standing there shows its line');
// a second visit answers again once, never louder: the state the same
ok(await openBasin(3), 'the basin opens again');
ok(firstSeen && !firstSeen.answered, 'a new visit starts unanswered');
ok(await page.waitForFunction(() => window.__oagBasin.state().answered, null, { timeout: 30000 }).then(() => true, () => false), 'and answers once');

// ---- walking into the mouth goes back to the room -----------------------------------------------------------------------------
await page.evaluate(() => { const a = window.__oagBasin.SEAT_AT; window.__oagBasin.walkTo('heart', { now: true }); });
const back = await page.evaluate(() => new Promise((res) => {
  // walk with the down arrow: the mouth is behind the ledge
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
  const t0 = Date.now(), iv = setInterval(() => {
    const st = window.__oagBasin.state();
    if (!st.open || document.querySelector('[data-room]')) { clearInterval(iv); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' })); res(true); }
    else if (Date.now() - t0 > 40000) { clearInterval(iv); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' })); res(false); }
  }, 100);
}));
ok(back, 'walking into the mouth leaves the basin');
ok(await page.waitForSelector('[data-room]', { timeout: 30000 }).then(() => true, () => false), 'and the WAVE room opens');

// ---- the room's side: the basin's mouth, no card, and its haze ---------------------------------------------------------------
await page.goto(`${B}?go=home&tour=0&brow=0`);
ok(await page.waitForFunction(() => window.__oagCave.room && window.__oagCave.room.walking, null, { timeout: 30000 }).then(() => true, () => false), 'the WAVE room opens with ?go=home');
await page.waitForTimeout(1500);
const exits = await page.evaluate(() => window.__oagCave.room.walking().exits);
ok(exits && exits.some((e) => e.id === 'basin') && exits.some((e) => e.id === 'portal') && exits.some((e) => e.id === 'bigmind'), 'the room has the basin\'s mouth beside its other two doors: ' + JSON.stringify(exits && exits.map((e) => e.id)));
await page.screenshot({ path: SHOTS + '/room.png' });

// a Fear sitting raises the brow through the room's own step function
const raised = await page.evaluate(() => {
  const O = window.__oagOrgans; O.store.preview('brow', 0);
  const before = O.floorOf(O.store.get(), 'brow');
  O.store.raise({ channel: 'fear', floor: O.floorFromCredit({ witness: true, accept: true }), source: 'the WAVE room' });
  const after = O.floorOf(O.store.get(), 'brow');
  O.store.raise({ channel: 'anger', floor: 3, source: 'the WAVE room' });
  return { before, after, anger: Object.keys(O.store.get().seats) };
});
ok(raised.before === 0 && raised.after === 2 && raised.anger.join() === 'brow', 'the store raises the brow from a Fear sitting and nothing else');

// walking to the basin's mouth from the room goes in with no card (mab-one-mouth)
await page.evaluate(() => window.__oagCave.room.walkTo('basin'));
const inBasin = await page.waitForFunction(() => window.__oagBasin.state().open, null, { timeout: 30000 }).then(() => true, () => false);
ok(inBasin, 'walking into the room\'s basin mouth opens the basin');
ok(!(await page.evaluate(() => { const d = document.querySelector('[data-room-door]'); return d && d.style.display !== 'none' && /basin/i.test(d.textContent); })), 'with no card on the way');

// a Fear charge worked in the room raises the brow step by step: witnessed 1, accepted 2, validated 3 (io-three-dantians)
await page.goto(`${B}?go=home&tour=0&brow=0`);
await page.waitForFunction(() => window.__oagCave.room && window.__oagCave.room.walking, null, { timeout: 30000 });
await page.evaluate(() => { const c = document.querySelector('[data-room-calm]'); if (c) c.click(); });
const floors = {};
for (let i = 0; i < 60; i++) {
  const r = await page.evaluate(() => {
    const vis = (s) => [...document.querySelectorAll(s)].filter((b) => b.offsetParent && !b.disabled);
    const R = window.__oagCave.room.state, O = window.__oagOrgans;
    const at = { phase: R.phase, floor: O.floorOf(O.store.get(), 'brow') };
    const n = document.querySelector('[data-room-name]'); if (n && n.offsetParent && !n.value) { n.value = 'A knot'; n.dispatchEvent(new Event('input', { bubbles: true })); }
    const f = vis('[data-room-element="Fear"]')[0]; if (f && f.getAttribute('aria-pressed') !== 'true') { f.click(); return at; }
    const tx = vis('[data-room-texture]')[0]; if (tx && !document.querySelector('[data-room-texture][aria-pressed="true"]')) { tx.click(); return at; }
    for (const s of ['[data-room-welcome]', '[data-room-next]']) { const b = vis(s)[0]; if (b) { b.click(); return at; } }
    const pane = document.querySelector('[data-room-pane]'); if (pane && pane.offsetParent) pane.click();
    return at;
  });
  floors[r.phase] = r.floor;
  if (r.phase === 'fork') break;
  await page.waitForTimeout(600);
}
ok(floors.witness === 0 && floors.accept === 1 && floors.appreciate === 2 && floors.fork === 3, 'a Fear sitting in the room raises the brow as it goes: ' + JSON.stringify(floors));

ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.slice(0, 5).join(' / ') : ''));
console.log(`${passes} passed, ${fails} failed; screenshots in ${SHOTS}`);
await browser.close(); server.close();
