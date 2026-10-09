import http from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { chromium } from 'playwright';
// Browser checks for the Cave of Lessons (cave.js, cave-kit.glb, spots.json): the doorway, the winding W.A.V.E. path with
// its seven stretches, the avatar that walks it when held, blocks that open side passages (one deep, two deep, released and
// skipped), the breath and the calm button, and the saved scan. Build first with `npm run build:ontology-game`, then copy this
// file into a folder that has playwright and three@0.128.0 installed and run it there:
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
ok(clr.clearance >= clr.width * 2, `no two stretches of the path touch (closest ${clr.clearance.toFixed(1)}, walls need ${(clr.width * 2).toFixed(1)}): no free turns, no dead ends`);

// ---- the avatar: faceless, wearing tension, and light ----------------------------------------------
const av0 = await avatar();
ok(av0.bytes < 50 * 1024, `the avatar's generated geometry is ${(av0.bytes / 1024).toFixed(1)} KB, under 50 KB`);
ok(av0.scale[1] > 1.1 && av0.scale[0] < 0.9, `tension makes the avatar taut (scale ${av0.scale.map((v) => v.toFixed(2))})`);

// ---- holding walks the avatar along the path; lifting stops it; a drag looks around -------------------
await page.mouse.move(195, 130); await page.mouse.down();
await page.waitForTimeout(1800);
const av1 = await avatar();
await page.mouse.up();
await page.waitForTimeout(500);
const av2 = await avatar(), av3 = await (async () => { await page.waitForTimeout(700); return avatar(); })();
ok(av1.s > av0.s + 2, `holding walks the avatar forward (${av0.s.toFixed(1)} to ${av1.s.toFixed(1)})`);
ok(Math.abs(av3.s - av2.s) < 1e-6, 'lifting the thumb stops it');
ok(av1.offPath < 1e-6 && av3.offPath < 1e-6, 'the avatar stands on the path line and never walks off it');
const yaw0 = await state('s.look.yaw');
await page.mouse.move(195, 130); await page.mouse.down(); await page.mouse.move(120, 130, { steps: 6 }); await page.mouse.up();
const yaw1 = await state('s.look.yaw');
ok(Math.abs(yaw1 - yaw0) > 0.2, 'dragging looks around');
await page.screenshot({ path: SHOTS + '/cave-walk.png' });

// ---- the breath: the cave moves with it; the calm button stills it ---------------------------------
const samples = [];
for (let i = 0; i < 7; i++) { samples.push(await breath()); await page.waitForTimeout(650); }
const bs = samples.map((x) => x.b), ks = samples.map((x) => x.k), ps = samples.map((x) => x.pace);
ok(Math.max(...bs) - Math.min(...bs) > 0.2 && Math.max(...ks) - Math.min(...ks) > 0.004, `the cave breathes: the breath runs ${Math.min(...bs).toFixed(2)} to ${Math.max(...bs).toFixed(2)} and the walls ease ${Math.min(...ks).toFixed(3)} to ${Math.max(...ks).toFixed(3)}`);
ok(Math.min(...ps) >= 0.4 && Math.max(...ps) - Math.min(...ps) > 0.1, `the walk quickens on the inhale and slows on the exhale, never below ${Math.min(...ps).toFixed(2)} of full pace`);
await page.locator('[data-cave-ringbtn]').click();
ok(await sees('[data-cave-ring]'), 'the optional breath ring can be turned on');
const rb0 = (await breath()).b;
const rbox = await page.locator('[data-cave-ring]').boundingBox();
await page.mouse.move(rbox.x + rbox.width / 2, rbox.y + rbox.height / 2); await page.mouse.down();
await page.waitForTimeout(5200);
const rb1 = (await breath()).b;
await page.mouse.up(); await page.waitForTimeout(3600);
const rb2 = (await breath()).b;
ok(rb1 > 0.8 && rb2 < rb1 - 0.25, `the cave follows the ring: holding fills the breath (${rb0.toFixed(2)} to ${rb1.toFixed(2)}), letting go empties it (${rb2.toFixed(2)})`);
await page.locator('[data-cave-calm]').click();
await page.waitForTimeout(900);
const calm = [];
for (let i = 0; i < 5; i++) { calm.push(await breath()); await page.waitForTimeout(450); }
ok(calm.every((x) => x.b === 0.5 && x.k === 1 && x.calm) && !calm[0].ring && !(await sees('[data-cave-ring]')), 'the calm button stills the breath and hides the ring');
await page.mouse.move(195, 130); await page.mouse.down(); const sc0 = (await avatar()).s; await page.waitForTimeout(1000); const sc1 = (await avatar()).s; await page.mouse.up();
ok(sc1 > sc0 + 1, 'the avatar still walks when the cave is calm');
await page.locator('[data-cave-calm]').click();
await page.locator('[data-cave-ringbtn]').click(); // ring off again

// ---- the walk: Welcome, then Acknowledge with a block, released --------------------------------------
await C(() => { window.__oagCave.state.speed = 8; });
const seen = [];
const atMarker = async (id) => {
  await walkTo(`[data-cave-marker="${id}"]`);
  seen.push(id);
  return state('({ s: s.walk.s, kind: s.walk.route.kind, target: s.walk.target })');
};
let m = await atMarker('welcome');
ok((await page.locator('[data-cave-prompt]').innerText()) === PROMPT.welcome && await sees('[data-cave-go]') && await sees('[data-cave-block]'), "Welcome ends at a marker with its prompt, and two choices: go on, or \"This step won't go further\"");
await page.screenshot({ path: SHOTS + '/cave-marker.png' });
const looseBefore = (await avatar()).loose;
await page.locator('[data-cave-go]').click();
await page.waitForTimeout(1500);
const av4 = await avatar();
ok(av4.loose > looseBefore && av4.scale[0] > av0.scale[0] && av4.scale[1] < av0.scale[1], `the avatar loosens a little after a step (taut ${av0.scale[1].toFixed(2)} to ${av4.scale[1].toFixed(2)})`);

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
await page.locator('[data-cave-next]').click();
await place('pool');
await page.waitForTimeout(600);
const at = await C(() => window.__oagCave.elementScreen());
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
ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
console.log(`\n${passes} passed, ${fails} failed`);
await browser.close(); server.close();
