import http from 'node:http';
import { readFileSync, statSync } from 'node:fs';
// OAG_GAME: path to game.jsx, so the breath numbers can be read from the game itself (default: beside the cave folder).
import { chromium } from 'playwright';
// Browser checks for the Cave of Lessons (cave.js, cave-kit.glb, spots.json): the doorway, the winding W.A.V.E. path with
// its seven stretches, the avatar that walks it when held, blocks that open side passages (one deep, two deep, released and
// skipped), the breath and the calm button, the saved scan, and, since the walk was rebuilt around the breath: the jointed
// avatar and its walk cycle, one stretch per 4 s inhale and 6 s exhale, the step's words as a sign in the scene (no bottom
// panel while walking), a new light for each stretch, and the iOS long-press guards. Build first with `npm run build:ontology-game`, then copy this
// file into a folder that has playwright and three@0.128.0 installed and run it there:
//   OAG_PUBLIC=/path/to/bars-engine/public OAG_SHOTS=/some/dir node cave-test.mjs
const PUB = process.env.OAG_PUBLIC || new URL('../../../public', import.meta.url).pathname;
const SHOTS = process.env.OAG_SHOTS || '.';
const GAME = process.env.OAG_GAME || new URL('../game.jsx', import.meta.url).pathname;
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
let passes = 0, fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (c) passes++; else { fails++; process.exitCode = 1; } };
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const B = 'http://localhost:4569';
const WAVE = ['welcome', 'acknowledge', 'allow', 'accept', 'appreciate', 'validate', 'exhale'];
const PROMPT = { welcome: "Let whatever's here be here for a moment, without needing it to be different yet.", exhale: 'Is this feeling in alignment with what you actually want right now?' };

// ---- sizes: the kit and every file the page loads stay under the 3 MB phone budget ------------
const sizes = ['cave/index.html', 'cave/cave-kit.glb', 'cave/spots.json', 'figure.glb'].map((f) => statSync(PUB + '/ontology-game/' + f).size);
const kit = sizes[1], total = sizes.reduce((a, b) => a + b, 0);
ok(kit < 3_000_000, `the kit is ${Math.round(kit / 1024)} KB, under the 3 MB budget`);
ok(total < 3_000_000, `the page, kit, places and figure together are ${Math.round(total / 1024)} KB, under the 3 MB budget`);
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
  await page.locator(`[data-cave-choice="${texture}"]`).click();
  await page.locator('[data-cave-choice="Anger"]').waitFor();
  await page.locator(`[data-cave-choice="${element}"]`).click();
  await page.locator('[data-cave-place="walk"]').waitFor();
};
const C = (fn, arg) => page.evaluate(fn, arg);
const state = (expr) => page.evaluate(`(() => { const s = window.__oagCave.state; return ${expr}; })()`);
const avatar = () => C(() => window.__oagCave.avatar());
const breath = () => C(() => window.__oagCave.breath());
// Hold a thumb on the canvas until the selector shows (the avatar walks while held), then lift it.
const walkTo = async (selector) => {
  await page.mouse.move(195, 130); await page.mouse.down();
  try { await page.locator(selector).waitFor({ timeout: 90000 }); } finally { await page.mouse.up(); }
};
const sees = (sel) => page.locator(sel).isVisible();
const stretchFracOf = (t) => (t < 4 ? 0.5 * t / 4 : 0.5 + 0.5 * (t - 4) / 6);

// ---- the doorway: the heart, tapped on the real figure. Tension, Anger. ------------------------
await page.locator('[data-cave-dive]').click();
await pickOnFigure('heart');
await page.locator('[data-cave-chamber="heart"]').waitFor();
await page.waitForTimeout(400);
await page.screenshot({ path: SHOTS + '/cave-portal.png' });
ok(await page.locator('[data-cave-choice="Anger"]').count() === 0, 'the first page asks only the charge');
await page.locator('[data-cave-choice="tension"]').click();
await page.locator('[data-cave-choice="Anger"]').waitFor();
ok(await page.locator('[data-cave-choice="red"]').count() === 0, 'no face is asked at the doorway');
await page.screenshot({ path: SHOTS + '/cave-feeling.png' });
ok(await page.locator('.oagc-card:not(.oagc-float)').count() === 1, 'the doorway pages still use the bottom panel');
await page.locator('[data-cave-choice="Anger"]').click();
await page.locator('[data-cave-place="walk"]').waitFor();
await page.waitForTimeout(800);
await page.screenshot({ path: SHOTS + '/cave-start.png' });

// ---- the path: seven stretches in W.A.V.E. order, one winding line --------------------------------
const layout = await state('s.layout');
ok(JSON.stringify(layout.rows.map((r) => r.step)) === JSON.stringify(WAVE) && layout.stops.length === 7 && layout.stops.every((v, i) => i === 0 || v > layout.stops[i - 1]),
  `the path has seven stretches in order, ending at markers ${layout.stops.join(', ')} (length ${layout.length})`);
const again = await C(() => JSON.stringify([window.__oagCave.layoutMain('heart:tension', 3.74).rows, window.__oagCave.layoutMain('heart:tension', 3.74).rows]));
const [l1, l2] = JSON.parse(again);
const other = await C(() => JSON.stringify(window.__oagCave.layoutMain('throat:numbness', 5).rows));
ok(JSON.stringify(l1) === JSON.stringify(l2) && JSON.stringify(layout.rows) === JSON.stringify(l1), 'the same scan gives the same cave');
ok(JSON.stringify(l1) !== other, 'a different scan lays a different path');
const clr = await C(() => window.__oagCave.clearance());
ok(clr.clearance >= clr.width * 2 * clr.maxOpen, `no two stretches of the path touch even with the walls opened wide (closest ${clr.clearance.toFixed(1)}, walls need ${(clr.width * 2 * clr.maxOpen).toFixed(1)}): no free turns, no dead ends`);

// ---- the doorway keeps its bottom panel; nothing else does ---------------------------------------------

// ---- the avatar: a jointed, faceless human wearing tension ------------------------------------------------
const av0 = await avatar();
ok(av0.bytes < 50 * 1024, `the avatar's generated geometry is ${(av0.bytes / 1024).toFixed(1)} KB, under 50 KB`);
ok(av0.scale[1] > 1.1 && av0.scale[0] < 0.9, `tension makes the avatar taut (scale ${av0.scale.map((v) => v.toFixed(2))})`);
const j0 = await C(() => window.__oagCave.joints());
const NEED = ['hips', 'spine', 'neck', 'head', 'hipL', 'hipR', 'kneeL', 'kneeR', 'ankleL', 'ankleR', 'shoulderL', 'shoulderR', 'elbowL', 'elbowR', 'wristL', 'wristR'];
ok(NEED.every((n) => j0.names.includes(n)), `the avatar has a head, neck, spine, hips, and an upper and lower limb on each side: ${j0.names.length} joints`);
ok(Math.abs(j0.x.hipL) < 0.03 && Math.abs(j0.x.hipR) < 0.03 && Math.abs(j0.x.kneeL) < 0.03, 'standing, the legs hang straight (an idle pose)');
ok(await page.locator('[data-cave-card]').isVisible() === false && await page.locator('.oagc-card:not(.oagc-float)').count() === 0, 'no bottom step panel while the avatar walks');
const sg0 = await C(() => window.__oagCave.sign());
ok(sg0.visible && sg0.title === 'Welcome' && sg0.paras[0] === PROMPT.welcome && sg0.pixels > 1000, `the step's name and words hang in the scene as a drawn sign (${sg0.pixels} sampled pixels)`);

// ---- iOS: a long press does nothing ------------------------------------------------------------------------
const ios = await C(() => {
  const cv = document.querySelector('.oagc canvas'), btn = document.querySelector('.oagc-calm');
  const cs = getComputedStyle(cv), bs = getComputedStyle(document.body), bt = getComputedStyle(btn);
  const fire = (type, target, init) => { let e; try { e = type.startsWith('touch') ? new TouchEvent(type, Object.assign({ bubbles: true, cancelable: true }, init)) : new Event(type, { bubbles: true, cancelable: true }); } catch (x) { return 'error: ' + x.message; } target.dispatchEvent(e); return e.defaultPrevented; };
  const css = document.getElementById('oagc-css').textContent, meta = document.querySelector('meta[name=viewport]');
  return {
    canvas: [cs.userSelect, cs.touchAction, cs.webkitTapHighlightColor], body: [bs.userSelect, bs.webkitTapHighlightColor], button: [bt.userSelect, bt.touchAction],
    callout: /-webkit-touch-callout:\s*none/.test(css), selectCss: /-webkit-user-select:\s*none/.test(css),
    contextCanvas: fire('contextmenu', cv), contextButton: fire('contextmenu', btn), contextBody: fire('contextmenu', document.body),
    selectCanvas: fire('selectstart', cv), selectBody: fire('selectstart', document.body), gesture: fire('gesturestart', document),
    touchstart: fire('touchstart', cv), touchmove: fire('touchmove', cv), viewport: meta && meta.content,
  };
});
ok(ios.canvas[0] === 'none' && ios.canvas[1] === 'none' && ios.body[0] === 'none' && ios.button[0] === 'none' && ios.button[1] === 'manipulation', `the page and canvas are not selectable, the canvas takes no touch gestures, buttons stay tappable ${JSON.stringify([ios.canvas, ios.button])}`);
ok(ios.callout && ios.selectCss && /rgba\(0,\s*0,\s*0,\s*0\)|transparent/.test(ios.canvas[2]) && /rgba\(0,\s*0,\s*0,\s*0\)|transparent/.test(ios.body[1]), `the touch callout is off (in the style sheet) and the tap highlight is clear ${ios.canvas[2]}`);
ok(ios.contextCanvas === true && ios.contextButton === true && ios.contextBody === true, 'the context menu (long press) is cancelled on the canvas, on buttons and on the page');
ok(ios.selectCanvas === true && ios.selectBody === true && ios.gesture === true, 'a selection start and a pinch gesture are cancelled');
ok(ios.touchstart === true && ios.touchmove === true, 'touchstart and touchmove on the hold area are cancelled (non-passive)');
ok(/maximum-scale=1/.test(ios.viewport) && /user-scalable=no/.test(ios.viewport), `the viewport forbids zoom (${ios.viewport})`);

// ---- one stretch is one breath: hold, let go (everything pauses), hold on to the marker ----------------------
const gait = () => C(() => window.__oagCave.gait());
const joints = () => C(() => window.__oagCave.joints());
const samples = [];
const sample = async () => { const [g, j, b, a] = [await gait(), await joints(), await breath(), await avatar()]; samples.push({ g, j, b, a }); };
const hold = async () => { await page.mouse.move(195, 130); await page.mouse.down(); };
let heldMs = 0, t0 = Date.now();
await hold();
while (Date.now() - t0 < 3000) { await sample(); await page.waitForTimeout(200); }
await page.mouse.up(); heldMs += Date.now() - t0;
await page.screenshot({ path: SHOTS + '/cave-walk.png' });
await page.waitForTimeout(200);
const gA = await gait(), bA = []; await page.waitForTimeout(1500);
const gB = await gait();
for (let i = 0; i < 4; i++) { bA.push((await breath()).b); await page.waitForTimeout(500); }
ok(gA.t > 2.5 && gB.t === gA.t && gB.s === gA.s, `lifting the thumb pauses the walk and its breath clock together (clock ${gA.t.toFixed(2)} s, then ${gB.t.toFixed(2)} s)`);
ok(Math.max(...bA) - Math.min(...bA) > 0.02, `the cave's own breathing carries on while the walk is paused (${Math.min(...bA).toFixed(2)} to ${Math.max(...bA).toFixed(2)})`);
t0 = Date.now(); await hold();
let arrivedAt = 0;
while (!(await page.locator('[data-cave-marker="welcome"]').count())) { await sample(); await page.waitForTimeout(200); if (Date.now() - t0 > 30000) break; }
heldMs += Date.now() - t0;
await page.mouse.up();
const gEnd = await gait();
ok(gEnd.t === 10 && gEnd.arrived && Math.abs(gEnd.frac - 1) < 1e-9, 'the first stretch ends at its marker after exactly one breath of holding (10 s on the walk clock)');
ok(heldMs > 9000 && heldMs < 12500, `at normal speed it took ${(heldMs / 1000).toFixed(1)} s of holding on the wall clock`);
ok(gEnd.inS === 4 && gEnd.outS === 6, 'the cave breathes 4 s in and 6 s out');
const nearest = (t) => samples.reduce((m, x) => (Math.abs(x.g.t - t) < Math.abs(m.g.t - t) ? x : m));
const half = nearest(4);
ok(Math.abs(half.g.t - 4) < 0.5 && Math.abs(half.g.frac - stretchFracOf(half.g.t)) < 0.02 && half.g.frac > 0.4 && half.g.frac < 0.6, `the inhale carries the avatar about half the stretch (${half.g.frac.toFixed(2)} at ${half.g.t.toFixed(1)} s)`);
const rate = (lo, hi) => { const q = samples.filter((x) => x.g.t >= lo && x.g.t <= hi); const f = q[q.length - 1], e = q[0]; return (f.g.frac - e.g.frac) / (f.g.t - e.g.t); };
const rin = rate(0.3, 3.8), rout = rate(4.4, 9.8);
ok(rin / rout > 1.3 && rin / rout < 1.7, `it walks faster on the inhale than the exhale (${(rin * 100).toFixed(1)}% and ${(rout * 100).toFixed(1)}% of the stretch a second)`);
ok(gEnd.stepsIn === 8 && gEnd.stepsOut === 12 && gEnd.stepsPerS === 2, `the footfalls fit the breath: ${gEnd.stepsIn} steps in the 4 s inhale and ${gEnd.stepsOut} in the 6 s exhale, two a second`);
ok(samples.every((x) => x.g.stepsIn + x.g.stepsOut === Math.floor(x.g.t * 2 + 1e-6)), 'a foot lands every half second all the way through, with no gaps or doubles');
const ph = samples.map((x) => x.b.pace);
ok(Math.min(...ph) > 0.4 && Math.max(...ph) - Math.min(...ph) > 0.3, `the pace quickens on the inhale and slows on the exhale, never below ${Math.min(...ph).toFixed(2)} of its average`);
const mov = samples.filter((x) => x.j.g > 0.8);
const rng = (f) => Math.max(...mov.map(f)) - Math.min(...mov.map(f));
ok(mov.length > 10 && rng((x) => x.j.x.hipL) > 0.6 && rng((x) => x.j.x.shoulderL) > 0.4 && Math.max(...mov.map((x) => x.j.x.kneeL)) > 0.5, `the legs swing from the hip with the knee bending, and the arms swing too (hip range ${rng((x) => x.j.x.hipL).toFixed(2)} rad, shoulder ${rng((x) => x.j.x.shoulderL).toFixed(2)}, knee up to ${Math.max(...mov.map((x) => x.j.x.kneeL)).toFixed(2)})`);
ok(mov.filter((x) => x.j.x.hipL * x.j.x.hipR < 0 && x.j.x.shoulderL * x.j.x.hipL < 0).length > mov.length * 0.7, 'the legs alternate and each arm swings against the leg on its side');
ok(rng((x) => x.j.hipsY) > 0.02 && rng((x) => x.j.x.hipL) > 10 * Math.abs(j0.x.hipL), 'the hips rise and sink as the figure walks');
ok(samples.every((x) => x.a.offPath < 1e-6) && samples[samples.length - 1].a.s > samples[0].a.s + 10, 'holding walks the avatar forward, and it stays on the path line');

// ---- at the marker: the sign in the scene, the choices beside it, and a drag looks around ---------------------
await page.waitForTimeout(1800);
const sg1 = await C(() => window.__oagCave.sign()), cd1 = await C(() => window.__oagCave.card());
ok(sg1.visible && sg1.paras.includes(PROMPT.welcome) && sg1.pixels > 1000 && (await page.locator('[data-cave-prompt]').innerText()) === PROMPT.welcome, 'the step\'s words are in the scene at the marker');
ok(Math.abs(sg1.screen.x - sg1.marker.x) < 140 && sg1.screen.bottomY < sg1.marker.y + 40 && sg1.screen.topY >= 0 && sg1.screen.w <= 390, `the sign hangs above the marker (sign bottom ${Math.round(sg1.screen.bottomY)} px, marker ${Math.round(sg1.marker.y)} px)`);
ok(sg1.screen.bodyPx >= 14 && sg1.screen.titlePx >= 20, `the type reads on a phone: ${sg1.screen.bodyPx.toFixed(0)} px words, ${sg1.screen.titlePx.toFixed(0)} px name at 390 by 844`);
ok(!cd1.docked && cd1.shown && cd1.x >= 0 && cd1.x + cd1.w <= cd1.vw && cd1.w < cd1.vw - 24 && cd1.y + cd1.h < cd1.vh * 0.8 && Math.abs((cd1.x + cd1.w / 2) - sg1.marker.x) < 140, `the choices float at the marker, not in a bottom sheet (${Math.round(cd1.x)},${Math.round(cd1.y)} ${Math.round(cd1.w)}x${Math.round(cd1.h)})`);
ok(await page.locator('.oagc-card:not(.oagc-float)').count() === 0, 'there is no bottom step panel at the marker either');
const yaw0 = await state('s.look.yaw');
await page.mouse.move(195, 130); await page.mouse.down(); await page.mouse.move(120, 130, { steps: 6 }); await page.mouse.up();
const yaw1 = await state('s.look.yaw');
ok(Math.abs(yaw1 - yaw0) > 0.2, 'dragging looks around');

// ---- the breath: the cave moves with it; the ring follows the hold; the calm button stills it ----------------
const bsamples = [], idleJ = [];
for (let i = 0; i < 7; i++) { bsamples.push(await breath()); idleJ.push(await joints()); await page.waitForTimeout(650); }
const bs = bsamples.map((x) => x.b), ks = bsamples.map((x) => x.k);
ok(Math.max(...bs) - Math.min(...bs) > 0.2 && Math.max(...ks) - Math.min(...ks) > 0.004, `the cave breathes: the breath runs ${Math.min(...bs).toFixed(2)} to ${Math.max(...bs).toFixed(2)} and the walls ease ${Math.min(...ks).toFixed(3)} to ${Math.max(...ks).toFixed(3)}`);
const sy = idleJ.map((x) => x.spineScale), shy = idleJ.map((x) => x.shoulderY);
ok(Math.max(...sy) - Math.min(...sy) > 0.008 && Math.max(...shy) - Math.min(...shy) > 0.01 && idleJ.every((x) => x.g < 0.05), `standing, the avatar breathes: its chest swells and its shoulders lift with the cave's breath (chest ${(Math.max(...sy) - Math.min(...sy)).toFixed(3)}, shoulders ${(Math.max(...shy) - Math.min(...shy)).toFixed(3)})`);
await page.locator('[data-cave-ringbtn]').click();
ok(await sees('[data-cave-ring]'), 'the optional breath ring can be turned on');
const rb0 = (await breath()).b;
const rbox = await page.locator('[data-cave-ring]').boundingBox();
await page.mouse.move(rbox.x + rbox.width / 2, rbox.y + rbox.height / 2); await page.mouse.down();
await page.waitForTimeout(4600);
const rb1 = (await breath()).b;
await page.mouse.up(); await page.waitForTimeout(3600);
const rb2 = (await breath()).b;
ok(rb1 > 0.8 && rb2 < rb1 - 0.25, `the cave follows the ring: holding fills the breath (${rb0.toFixed(2)} to ${rb1.toFixed(2)}), letting go empties it (${rb2.toFixed(2)})`);
await page.locator('[data-cave-calm]').click();
await page.waitForTimeout(900);
const calm = [];
for (let i = 0; i < 5; i++) { calm.push(await breath()); await page.waitForTimeout(450); }
ok(calm.every((x) => x.b === 0.5 && x.k === 1 && x.calm) && !calm[0].ring && !(await sees('[data-cave-ring]')), 'the calm button stills the breath and hides the ring');
await page.locator('[data-cave-calm]').click();
await page.locator('[data-cave-ringbtn]').click(); // ring off again
await page.screenshot({ path: SHOTS + '/cave-marker.png' });

// ---- the walk: Welcome, then Acknowledge with a block, released --------------------------------------
const seen = [], looks7 = [];
// At a marker the screen has changed to that stretch's light: record it once it has settled, and keep a picture of it.
const recordStretch = async (id) => {
  await page.waitForTimeout(2300);
  const lk = await C(() => window.__oagCave.look());
  looks7.push(Object.assign({ id }, lk));
  await page.screenshot({ path: SHOTS + `/cave-stretch-${looks7.length}-${id}.png` });
};
const atMarker = async (id) => {
  await walkTo(`[data-cave-marker="${id}"]`);
  seen.push(id);
  const r = await state('({ s: s.walk.s, kind: s.walk.route.kind, target: s.walk.target })');
  await recordStretch(id);
  return r;
};
seen.push('welcome'); await recordStretch('welcome');
let m = await state('({ s: s.walk.s, kind: s.walk.route.kind, target: s.walk.target })');
ok(await sees('[data-cave-go]') && await sees('[data-cave-block]'), "Welcome ends at a marker with two choices: go on, or \"This step won't go further\"");
const looseBefore = (await avatar()).loose, lookBefore = await C(() => window.__oagCave.look());
await page.locator('[data-cave-go]').click();
await page.waitForTimeout(250);
const lookMid = await C(() => window.__oagCave.look());
await page.waitForTimeout(1300);
const av4 = await avatar();
ok(av4.loose > looseBefore && av4.scale[0] > av0.scale[0] && av4.scale[1] < av0.scale[1], `the avatar loosens a little after a step (taut ${av0.scale[1].toFixed(2)} to ${av4.scale[1].toFixed(2)})`);
await page.waitForTimeout(1000);
const lookAfter = await C(() => window.__oagCave.look());
ok(lookMid.light !== lookBefore.light && lookMid.light !== lookAfter.light && lookAfter.light !== lookBefore.light && lookAfter.idx === 1, `entering a stretch turns the light over a short transition (${lookBefore.light.toString(16)} to ${lookMid.light.toString(16)} to ${lookAfter.light.toString(16)})`);
ok(!(await page.locator('[data-cave-card]').isVisible()) && (await C(() => window.__oagCave.sign())).title === 'Acknowledge', 'walking toward Acknowledge, its name hangs ahead in the scene and no card is up');
// calm walks too
await page.locator('[data-cave-calm]').click();
const sc0 = (await avatar()).s; await hold(); await page.waitForTimeout(1000); const sc1 = (await avatar()).s; await page.mouse.up();
ok(sc1 > sc0 + 1, 'the avatar still walks when the cave is calm');
await page.locator('[data-cave-calm]').click();
await C(() => { window.__oagCave.state.speed = 8; }); // from here the walk is sped up so a whole stretch is under two seconds

m = await atMarker('acknowledge');
const ackAt = m.s;
await page.locator('[data-cave-block]').click();
await page.locator('[data-cave-place="walk"]').waitFor({ timeout: 8000 });
ok(await state('s.stack.length') === 1 && await state('s.walk.route.kind') === 'side', 'a block on Acknowledge opens a side passage');
await page.screenshot({ path: SHOTS + '/cave-side.png' });
ok(await C(() => window.__oagCave.lanterns()) === 1, 'a lantern stays where the player branched');
const sideSeen = [];
const place = async (id) => { await walkTo(`[data-cave-place="${id}"]`); sideSeen.push(id); };
await place('mouth');
await page.screenshot({ path: SHOTS + '/cave-side-mouth.png' });
const sgm = await C(() => window.__oagCave.sign()), cdm = await C(() => window.__oagCave.card());
ok(sgm.visible && sgm.title === '1 Sensation' && sgm.paras.some((t) => t.startsWith('What is the block like')) && sgm.pixels > 1000 && sgm.screen.bodyPx >= 14 && !cdm.docked && cdm.y + cdm.h < cdm.vh * 0.9, `in the side passage the place's name and its question are in the scene too, and its choices float (${sgm.title}: ${sgm.paras[0]})`);
await page.locator('[data-cave-next]').click();
await place('pool');
await page.waitForTimeout(1500);
const at = await C(() => window.__oagCave.elementScreen());
await page.screenshot({ path: SHOTS + '/cave-side-pool-before.png' });
await page.mouse.click(at.x, at.y);
await page.locator('[data-cave-touched]').waitFor();
ok(true, 'tapping the element makes it answer');
await page.screenshot({ path: SHOTS + '/cave-side-pool.png' });
await page.locator('[data-cave-next]').click();
await place('passage');
ok(await page.locator('[data-cave-next]').isDisabled(), 'the way on waits until a daemon is met');
await page.locator('[data-cave-choice="skeptic"]').click();
ok((await page.locator('[data-cave-daemon-job]').innerText()).includes('To doubt') && await page.locator('[data-cave-daemon-for]').count() === 1, 'the daemon tells its job and who it works for');
await page.locator('[data-cave-aside="yes"]').click();
await page.waitForTimeout(1200);
await page.screenshot({ path: SHOTS + '/cave-side-daemon.png' });
await page.locator('[data-cave-next]').click();
await place('gate');
ok(await page.locator('[data-cave-next]').isDisabled(), 'the gate stays shut until each stone has been stood at');
for (const f of ['magenta', 'red', 'amber', 'orange', 'green', 'teal']) await page.locator(`[data-cave-stone="${f}"]`).click();
await page.screenshot({ path: SHOTS + '/cave-side-gate.png' });
await page.locator('[data-cave-next]').click();
await place('way_out');
ok(JSON.stringify(sideSeen) === JSON.stringify(['mouth', 'pool', 'passage', 'gate', 'way_out']), 'the side passage meets the five places in order');
await page.locator('[data-cave-release]').click();
await page.locator('[data-cave-marker="acknowledge"]').waitFor();
const back = await state('({ s: s.walk.s, kind: s.walk.route.kind, target: s.walk.target, depth: s.stack.length })');
ok(back.kind === 'main' && back.depth === 0 && Math.abs(back.s - ackAt) < 1e-9 && back.target === m.target, `Release returns to the exact Acknowledge marker on the main path ${JSON.stringify(back)} vs ${ackAt} ${m.target}`);
ok(await page.locator('[data-cave-back]').count() === 1 && await C(() => window.__oagCave.lanterns()) === 1, `the lantern is still there, and the card says the player is back (${await page.locator('[data-cave-back]').count()}, ${await C(() => window.__oagCave.lanterns())})`);
await page.locator('[data-cave-go]').click();

// ---- a block two deep: Allow, then a block inside its side passage -----------------------------------
m = await atMarker('allow');
const allowAt = m.s;
await page.locator('[data-cave-block]').click();
await place('mouth');
const mouth1 = await state('s.walk.s');
await page.locator('[data-cave-block]').click();
await page.locator('[data-cave-place="walk"]').waitFor({ timeout: 8000 });
ok(await state('s.stack.length') === 2, 'a block inside the side passage opens another one off it');
ok(await C(() => window.__oagCave.lanterns()) === 3, 'each spot where the player branched keeps a lantern');
await place('mouth');
await page.screenshot({ path: SHOTS + '/cave-nested.png' });
await page.locator('[data-cave-next]').click(); await place('pool');
await page.locator('[data-cave-next]').click(); await place('passage');
await page.locator('[data-cave-choice="victim"]').click();
await page.locator('[data-cave-aside="not-yet"]').click();
ok(await page.locator('[data-cave-next]').isEnabled(), 'a daemon that is not ready does not trap the player');
await page.locator('[data-cave-next]').click(); await place('gate');
for (const f of ['magenta', 'red', 'amber', 'orange', 'green', 'teal']) await page.locator(`[data-cave-stone="${f}"]`).click();
await page.locator('[data-cave-next]').click(); await place('way_out');
await page.locator('[data-cave-release]').click();
await page.locator('[data-cave-place="mouth"]').waitFor();
const mid = await state('({ s: s.walk.s, kind: s.walk.route.kind, depth: s.stack.length, target: s.walk.target })');
ok(mid.kind === 'side' && mid.depth === 1 && Math.abs(mid.s - mouth1) < 1e-9 && mid.target === 0, 'the inner Release returns to the exact place in the first side passage');
await page.locator('[data-cave-next]').click(); await place('pool');
await page.locator('[data-cave-next]').click(); await place('passage');
await page.locator('[data-cave-skip]').count();
await page.locator('[data-cave-choice="fixer"]').click();
await page.locator('[data-cave-aside="yes"]').click();
await page.locator('[data-cave-next]').click(); await place('gate');
for (const f of ['magenta', 'red', 'amber', 'orange', 'green', 'teal']) await page.locator(`[data-cave-stone="${f}"]`).click();
await page.locator('[data-cave-next]').click(); await place('way_out');
await page.locator('[data-cave-release]').click();
await page.locator('[data-cave-marker="allow"]').waitFor();
const back2 = await state('({ s: s.walk.s, kind: s.walk.route.kind, depth: s.stack.length })');
ok(back2.kind === 'main' && back2.depth === 0 && Math.abs(back2.s - allowAt) < 1e-9, `the outer Release then returns to the exact Allow marker: the way back works two deep ${JSON.stringify(back2)} vs ${allowAt}`);
await page.locator('[data-cave-go]').click();

// ---- a skip returns to the main path without doing the block work --------------------------------------
m = await atMarker('accept');
const acceptAt = m.s;
await page.locator('[data-cave-block]').click();
await place('mouth');
await page.locator('[data-cave-skip]').click();
await page.locator('[data-cave-marker="accept"]').waitFor();
const sk = await state('({ s: s.walk.s, kind: s.walk.route.kind, depth: s.stack.length })');
ok(sk.kind === 'main' && sk.depth === 0 && Math.abs(sk.s - acceptAt) < 1e-9, `a skip returns to the main path at the same marker without the block work ${JSON.stringify(sk)} vs ${acceptAt}`);
await page.locator('[data-cave-go]').click();
m = await atMarker('appreciate');
const apprAt = m.s;
await page.locator('[data-cave-block]').click();
await place('mouth');
await page.locator('[data-cave-block]').click();
await page.locator('[data-cave-place="walk"]').waitFor({ timeout: 8000 });
await place('mouth');
ok(await state('s.stack.length') === 2, 'two deep again, to skip from the inner passage');
await page.locator('[data-cave-skip]').click();
await page.locator('[data-cave-marker="appreciate"]').waitFor();
const sk2 = await state('({ s: s.walk.s, kind: s.walk.route.kind, depth: s.stack.length })');
ok(sk2.kind === 'main' && sk2.depth === 0 && Math.abs(sk2.s - apprAt) < 1e-9, 'a skip from two deep returns straight to the main path');
await page.locator('[data-cave-go]').click();
await atMarker('validate');
await page.locator('[data-cave-go]').click();
await atMarker('exhale');
ok(JSON.stringify(seen) === JSON.stringify(WAVE), `the markers came in W.A.V.E. order: ${seen.join(', ')}`);
ok((await page.locator('[data-cave-prompt]').innerText()) === PROMPT.exhale, 'Exhale is the last marker and the way out');
const diff = (k) => looks7.every((x, i) => i === 0 || x[k] !== looks7[i - 1][k]);
ok(looks7.length === 7 && looks7.every((x, i) => x.idx === i) && diff('light') && diff('fog'), `each of the seven stretches has its own light and fog, different from the last: ${looks7.map((x) => x.light.toString(16) + '/' + x.fog.toString(16)).join(' ')}`);
ok(looks7.every((x, i) => i === 0 || (x.open > looks7[i - 1].open && x.density < looks7[i - 1].density)) && looks7[6].open - looks7[0].open > 0.4, `the walls open wider and the fog thins as the steps climb (${looks7.map((x) => x.open.toFixed(2)).join(', ')})`);
ok(looks7.every((x) => x.bg === x.fogHex && x.fogHex === x.fog), 'the background and the fog take the same colour in every stretch');
await page.screenshot({ path: SHOTS + '/cave-exhale.png' });

// ---- the way out, and the saved scan ---------------------------------------------------------------------
await page.locator('[data-cave-go]').click();
await page.locator('[data-cave-chamber]').waitFor({ state: 'detached', timeout: 15000 });
const marks = await C(() => window.OAGBody.marks());
const mk = marks[marks.length - 1];
ok(marks.length === 1 && mk.label === 'my heart' && mk.texture === 'tension' && mk.channel === 'Anger', 'the scan is saved the way the body map saves one');
ok(JSON.stringify(mk.blocked) === JSON.stringify(['acknowledge', 'allow', 'allow>sensation', 'accept', 'appreciate', 'appreciate>sensation']), `the saved scan lists the blocked steps: ${JSON.stringify(mk.blocked)}`);
ok(JSON.stringify(mk.skipped) === JSON.stringify(['accept', 'appreciate', 'appreciate>sensation']), `and which blocks were skipped: ${JSON.stringify(mk.skipped)}`);

// ---- each charge wears differently; any portal opens the same cave for the same scan ------------------------
const looks = {};
for (const [texture, element] of [['constriction', 'Fear'], ['numbness', 'Sadness'], ['strength', 'Joy'], ['tension', 'Anger']]) {
  await C((w) => window.__oagCave.dive(w), 'my throat');
  await portalPick(texture, element);
  await page.waitForTimeout(1300);
  looks[texture] = await avatar();
  if (texture === 'numbness') await page.screenshot({ path: SHOTS + '/cave-numbness.png' });
  if (texture === 'strength') await page.screenshot({ path: SHOTS + '/cave-strength.png' });
  if (texture === 'constriction') await page.screenshot({ path: SHOTS + '/cave-tightness.png' });
  looks[texture].dress = await state('JSON.stringify(s.dress)');
  looks[texture].rows = await state('JSON.stringify(s.layout.rows)');
  await C(() => window.__oagCave.leave(false));
  await page.locator('[data-cave-chamber]').waitFor({ state: 'detached' });
}
ok(looks.constriction.scale[0] < 0.7, `tightness is narrow and drawn in (width ${looks.constriction.scale[0].toFixed(2)})`);
ok(looks.numbness.opacity < 0.5, `numbness is fogged and translucent (opacity ${looks.numbness.opacity.toFixed(2)})`);
ok(looks.strength.glow > looks.tension.glow + 0.4, `strength is bright (glow ${looks.strength.glow.toFixed(2)} against ${looks.tension.glow.toFixed(2)})`);
ok(looks.tension.scale[1] > 1.1, `tension is taut (height ${looks.tension.scale[1].toFixed(2)})`);
ok(Object.values(looks).every((l) => l.bytes < 50 * 1024), 'every charge keeps the avatar under 50 KB of geometry');
const dressA = JSON.parse(await (async () => {
  await C((w) => window.__oagCave.dive(w), 'my left hand');
  await portalPick('tension', 'Anger'); const d = await state('JSON.stringify(s.dress)'); await C(() => window.__oagCave.leave(false));
  await page.locator('[data-cave-chamber]').waitFor({ state: 'detached' }); return d;
})());
ok(JSON.stringify(dressA) === looks.tension.dress, 'the same charge and feeling dress the cave the same wherever the portal is');
ok(looks.numbness.dress !== looks.tension.dress && looks.numbness.rows !== looks.tension.rows, 'two scans dress and lay the cave differently');
let src = null; try { src = readFileSync(GAME, 'utf8'); } catch (e) { /* the test folder has no copy of game.jsx */ }
if (src) {
  const gi = Number(/BREATH_IN_MS\s*=\s*(\d+)/.exec(src)[1]), go = Number(/BREATH_OUT_MS\s*=\s*(\d+)/.exec(src)[1]);
  ok(gi === gEnd.inS * 1000 && go === gEnd.outS * 1000, `the cave's breath is the game's own: game.jsx has ${gi} ms in and ${go} ms out`);
} else console.log('SKIP the cave breath against game.jsx (set OAG_GAME)');
ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
console.log(`\n${passes} passed, ${fails} failed`);
await browser.close(); server.close();
