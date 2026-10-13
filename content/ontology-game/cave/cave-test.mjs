import http from 'node:http';
import { readFileSync, statSync } from 'node:fs';
// OAG_GAME: path to game.jsx, so the breath numbers can be read from the game itself (default: beside the cave folder).
import { chromium } from 'playwright';
// Browser checks for the Cave of Lessons (cave.js, cave-kit.glb, spots.json): the doorway, the winding W.A.V.E. path with
// its seven stretches, the avatar that walks it when held, blocks that open side passages (one deep, two deep, released and
// skipped), the breath and the calm button, the saved scan, the jointed avatar and its walk cycle, one stretch per 4 s inhale
// and 6 s exhale, and the iOS long-press guards; and, since the loop rebuild of 10 October: the way ahead opening only on a
// choice, the pane that follows the figure through the whole walk and grows into a modal at each stop, one continuous wider
// tunnel, side paths that loop back to the spot they left from, the daemon as a wall until its encounter is worked, and the
// six faces' branches at the gate. Build first with `npm run build:ontology-game`, then copy this
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
  '/ontology-game/cave/textures/wet_stone.jpg': ['cave/textures/wet_stone.jpg', 'image/jpeg'],
  '/ontology-game/cave/textures/dry_stone.jpg': ['cave/textures/dry_stone.jpg', 'image/jpeg'],
  '/ontology-game/cave/textures/crystal_vein.jpg': ['cave/textures/crystal_vein.jpg', 'image/jpeg'],
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
const sizes = ['cave/index.html', 'cave/cave-kit.glb', 'cave/spots.json', 'figure.glb', 'cave/textures/wet_stone.jpg', 'cave/textures/dry_stone.jpg', 'cave/textures/crystal_vein.jpg'].map((f) => statSync(PUB + '/ontology-game/' + f).size);
const kit = sizes[1], total = sizes.reduce((a, b) => a + b, 0);
ok(kit < 3_000_000, `the kit is ${Math.round(kit / 1024)} KB, under the 3 MB budget`);
ok(total < 3_000_000, `the page, kit, places, figure and stone tiles together are ${Math.round(total / 1024)} KB, under the 3 MB budget`);
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
const camSamples = [];
const walkTo = async (selector) => {
  await page.mouse.move(330, 700); await page.mouse.down();
  const t0 = Date.now();
  try {
    while (!(await page.locator(selector).count())) {
      if (Date.now() - t0 > 90000) throw new Error('timed out walking to ' + selector);
      const ci = await page.evaluate(() => window.__oagCave.camInside && window.__oagCave.camInside());
      if (ci) camSamples.push(Object.assign({ where: selector }, ci));
      await page.waitForTimeout(120);
    }
  } finally { await page.mouse.up(); }
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

// ---- chamber dressing: pieces built in Blender from pictures (build_kit.py, pictures/) ----------------
const kitPieces = await C(() => window.__oagCave.load().then((a) => Object.keys(a.kit).sort()));
ok(['crystal_cluster', 'crystal_cluster_bed', 'glow_cap', 'root_curl', 'stone_spire'].every((p) => kitPieces.includes(p)), `the kit carries the dressing built from pictures (${kitPieces.join(', ')})`);
const dressing = await state('s.dressing');
ok(Array.isArray(dressing) && dressing.length >= 4 && new Set(dressing).size >= 2, `the chamber is dressed with ${dressing.length} pieces of ${new Set(dressing).size} kinds`);
// The crystal as a building block: one Blender piece, six tints, any size, height and width (Wendell, 2026-10-13).
const blocks = await C(() => window.__oagCave.load().then((a) => {
  const c = window.__oagCave, T = a.THREE, G = { crystal_cluster: c.geomOf(T, a.kit.crystal_cluster), crystal_cluster_bed: c.geomOf(T, a.kit.crystal_cluster_bed) };
  return c.CRYSTAL_TINTS.map(([tint], i) => {
    const g = c.crystalBlock(T, G, { tint, size: 1 + i * 0.25, tall: 1 + i * 0.1, wide: 1 }, new T.MeshStandardMaterial());
    g.children.forEach((m) => { if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); }); g.updateMatrixWorld(true);
    const cl = new T.Box3().setFromObject(g.children[0]).getSize(new T.Vector3()), bed = new T.Box3().setFromObject(g.children[1]).getSize(new T.Vector3());
    return { tint: g.userData.look.tint, hex: g.children[0].material.color.getHex(), h: cl.y, bedH: bed.y, size: 1 + i * 0.25 };
  });
}));
ok(blocks.length === 6 && new Set(blocks.map((b) => b.hex)).size === 6 && blocks.every((b, i) => i === 0 || b.h > blocks[i - 1].h)
  && blocks.every((b) => Math.abs(b.bedH / b.size - blocks[0].bedH / blocks[0].size) < 1e-6),
  `the crystal comes in ${blocks.length} tints and grows with size and height, its rocks not stretched (${blocks.map((b) => b.tint).join(', ')})`);
const crystals = await state('s.crystals');
const CR = await C(() => window.__oagCave.CRYSTAL_RANGE);
ok(Array.isArray(crystals) && crystals.every((l) => l.tall >= CR.tall[0] && l.tall <= CR.tall[1] && l.wide >= CR.wide[0] && l.wide <= CR.wide[1]),
  `the chamber's crystals vary within their ranges (${crystals.map((l) => l.tint).join(', ') || 'none in this chamber'})`);

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
ok(await page.locator('[data-cave-card]').isVisible() === false, 'no bottom step panel while the avatar walks');
const pn0 = await C(() => window.__oagCave.pane());
ok(pn0.shown && pn0.title === 'Welcome' && pn0.text === PROMPT.welcome && pn0.font >= 14, `the step's name and words are in the pane, in ${pn0.font}px type`);

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
const sample = async () => { const [g, j, b, a, p] = [await gait(), await joints(), await breath(), await avatar(), await C(() => window.__oagCave.pane())]; samples.push({ g, j, b, a, p }); };
const hold = async () => { await page.mouse.move(330, 700); await page.mouse.down(); };
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

ok(samples.every((x) => x.p.shown && x.p.at && x.p.at.y + x.p.at.h <= x.p.at.headY + 2 && Math.abs(x.p.at.x + x.p.at.w / 2 - x.p.at.headX) < 150),
  `the pane is shown above the figure's head for the whole walk (${samples.length} samples)`);
ok(samples.every((x) => x.p.at.x >= 0 && x.p.at.x + x.p.at.w <= 390 && x.p.at.y >= 50), 'the pane stays inside the screen and below the buttons');

// ---- at the marker: the modal holds the choices, and nothing changes until one is made ----------------------
const md1 = await C(() => window.__oagCave.modal()), pn1 = await C(() => window.__oagCave.pane());
ok(md1.open && md1.buttons.includes('Go on') && md1.buttons.includes("This step won't go further") && md1.text.includes(PROMPT.welcome), `stopping grows the pane into a modal with every choice of the stop (${md1.buttons.join(', ')})`);
ok(!pn1.shown, 'while the modal is open the small pane is put away');
ok(md1.rect.y >= 50 && md1.rect.y + md1.rect.h < 844 * 0.65, `the modal sits high, so the figure and the way ahead stay in sight below it (${Math.round(md1.rect.y)} to ${Math.round(md1.rect.y + md1.rect.h)} px)`);
ok(await sees('[data-cave-shut]'), 'the marker says the way ahead opens when you choose');
const lkA = await C(() => window.__oagCave.look());
await page.waitForTimeout(2500);
const lkB = await C(() => window.__oagCave.look());
ok(lkA.revealed === 0 && lkB.revealed === 0 && lkB.open[1] < 0.55 && Math.abs(lkB.open[1] - lkA.open[1]) < 0.01 && lkB.idx === 0, `standing at the marker changes nothing: the next stretch stays gathered shut (${lkB.open[1].toFixed(2)})`);
await page.locator('[data-cave-shrink]').click();
await page.waitForTimeout(400);
ok(!(await C(() => window.__oagCave.modal())).open && (await C(() => window.__oagCave.pane())).shown, '"Look around" folds the modal back into the pane');
const yaw0 = await state('s.look.yaw');
await page.mouse.move(195, 600); await page.mouse.down(); await page.mouse.move(120, 600, { steps: 6 }); await page.mouse.up();
ok(Math.abs((await state('s.look.yaw')) - yaw0) > 0.2, 'dragging looks around');
await page.locator('[data-cave-pane]').click();
await page.waitForTimeout(400);
ok((await C(() => window.__oagCave.modal())).open, 'tapping the pane opens the modal again');
await page.locator('[data-cave-shrink]').click();
await page.waitForTimeout(300);
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


// ---- the choice opens the way: Go on, and the next stretch opens and takes its light -------------------------
await page.locator('[data-cave-pane]').click();
await page.locator('[data-cave-go]').click();
await page.waitForTimeout(250);
const lkC = await C(() => window.__oagCave.look());
await page.waitForTimeout(2200);
const lkD = await C(() => window.__oagCave.look());
await page.screenshot({ path: SHOTS + '/cave-opened.png' });
ok(lkC.revealed === 1 && lkD.open[1] > 0.9 && lkD.open[1] > lkB.open[1] + 0.35, `choosing Go on opens the stretch ahead (its walls ${lkB.open[1].toFixed(2)} to ${lkD.open[1].toFixed(2)})`);
ok(lkD.idx === 1 && lkD.light !== lkB.light, 'and the light turns to the chosen stretch\'s own');
ok(lkD.open[2] < 0.55, 'the stretch after it stays shut until its own choice');
const tn = await C(() => window.__oagCave.tunnel());
ok(tn.instanced === 1 && tn.rings > tn.len * 0.9, `the walls are one continuous surface along the path (${tn.rings} rings a unit apart, no instanced segments)`);
ok(tn.width >= 6 * 0.9 * 0.99, `the cave is wider: half-width ${tn.width.toFixed(2)} for tension (was 3.74)`);
const clr2 = await C(() => window.__oagCave.clearance());
ok(clr2.clearance >= clr2.width * 2 * clr2.maxOpen * 1.04, `no two stretches touch even opened wide and breathing in (closest ${clr2.clearance.toFixed(1)}, walls need ${(clr2.width * 2 * clr2.maxOpen * 1.04).toFixed(1)})`);

const FACES6 = ['magenta', 'red', 'amber', 'orange', 'green', 'teal'];
const gatesFirst = async (check) => {
  for (const f of FACES6) {
    await walkTo(`[data-cave-stone="${f}"]`);
    await page.locator(`[data-cave-stone="${f}"]`).click();
    await page.locator('[data-cave-place="walk"]').waitFor();
    if (check && f === 'magenta') {
      const fb = await C(() => window.__oagCave.branch());
      ok(fb.kind === 'face' && fb.startGap < 0.01 && fb.endGap < 0.01 && fb.lowest > -0.01, `the Magenta stone opens its own branch, a level loop back to the stone (${Math.round(fb.len)} units)`);
      ok((await C(() => window.__oagCave.pane())).text === 'Where is the presence you\'re reaching for?', 'walking a face\'s branch, the pane holds that face\'s question');
    }
    await walkTo('[data-cave-face-back]');
    await page.locator('[data-cave-face-back]').click();
  }
};
// ---- a block: the wall opens, a side path loops under the cave and back to the very spot --------------------
await C(() => { window.__oagCave.state.speed = 8; });
await walkTo('[data-cave-marker="acknowledge"]');
const sAck = (await avatar()).s;
await page.locator('[data-cave-block]').click();
await page.locator('[data-cave-place="walk"]').waitFor();
const b1 = await C(() => window.__oagCave.branch()), tn1 = await C(() => window.__oagCave.tunnel());
ok(b1 && b1.kind === 'side' && b1.startGap < 0.01 && b1.endGap < 0.01, `the side path starts and ends on the spot it left from (gaps ${b1.startGap.toFixed(3)} and ${b1.endGap.toFixed(3)}): it loops back`);
ok(b1.lowest <= -9.9 && b1.len > 150, `it ramps down under the cave (${b1.lowest.toFixed(1)} units) and runs a loop ${Math.round(b1.len)} units long`);
ok(tn1.holes === 2 && tn1.mainTris < tn.mainTris, `the main wall opens twice, out and back (${tn.mainTris - tn1.mainTris} faces removed)`);
ok((await C(() => window.__oagCave.lanterns())) === 1, 'a lantern stands between the two openings');
ok(b1.stops === 10, 'the loop holds six stones, the mouth, the pool, the daemon and the way out');
await page.screenshot({ path: SHOTS + '/cave-branch.png' });
const walkSamples = [];
await page.mouse.move(330, 700); await page.mouse.down();
for (let i = 0; i < 6; i++) { walkSamples.push(await avatar()); await page.waitForTimeout(150); }
await page.locator('[data-cave-stone="magenta"]').waitFor({ timeout: 60000 }); await page.mouse.up();
ok(walkSamples.every((a) => a.route === 'branch' || a.route === 'side') && walkSamples.every((a) => a.offPath < 1e-6), 'the avatar walks the side path on its line');
ok(await page.locator('[data-cave-stone-says]').count() === 1 && await page.locator('[data-cave-next]').isDisabled(), 'the passage opens on the first of the six gates, and the way on waits for its branch');
await gatesFirst(true);
await walkTo('[data-cave-place="mouth"]');
await page.locator('[data-cave-choice="numbness"]').click();
await page.locator('[data-cave-next]').click();
await walkTo('[data-cave-place="pool"]');
ok(await sees('[data-cave-element-hidden]') && await sees('[data-cave-element-unknown]') && await C(() => window.__oagCave.sideElement().shown === false), 'at the pool the element stays out of sight until the player chooses, and "I don\'t know" is offered');
await page.locator('[data-cave-element-unknown]').click();
ok(await sees('[data-cave-element-hidden]') && await C(() => window.__oagCave.sideElement().shown === false) && await sees('[data-cave-next]'), '"I don\'t know" keeps it hidden and lets the player go on');
await page.locator('[data-cave-choice="Sadness"]').click();
const se = await C(() => window.__oagCave.sideElement());
ok(se.shown && se.deco >= 6 && se.name === 'Sadness', 'choosing an element shows it and decorates the passage with it');
await page.locator('[data-cave-next]').click();
await walkTo('[data-cave-place="passage"]');
ok(await page.locator('[data-cave-next]').count() === 0, 'the daemon\'s stop has no Continue until it stands aside');
await page.locator('[data-cave-choice="protector"]').click();
await page.locator('[data-cave-aside="not-yet"]').click();
ok(await sees('[data-cave-wall]') && await sees('[data-cave-dig]') && await page.locator('[data-cave-next]').count() === 0, '"Not yet" keeps the daemon in the way: no Continue, and an encounter to work');
ok(await page.locator('[data-cave-skip]').count() === 0 && await sees('[data-cave-321]'), 'a daemon in the way offers no skip, and offers the 3-2-1 talk');
const sWall = (await avatar()).s;
await page.locator('[data-cave-shrink]').click();
await page.mouse.move(330, 700); await page.mouse.down(); await page.waitForTimeout(2500); await page.mouse.up();
ok(Math.abs((await avatar()).s - sWall) < 1e-6, 'holding does not walk past the daemon');
await page.locator('[data-cave-pane]').click();
await page.screenshot({ path: SHOTS + '/cave-daemon-wall.png' });

// The encounter: dig into what it holds, a loop of its own one level deeper, then the daemon is asked again.
const sidePassage = async (depth) => {
  await gatesFirst(depth === 2);
  await walkTo('[data-cave-place="mouth"]'); await page.locator('[data-cave-next]').click();
  await walkTo('[data-cave-place="pool"]'); await page.locator('[data-cave-next]').click();
  await walkTo('[data-cave-place="passage"]');
  await page.locator('[data-cave-choice="skeptic"]').click(); await page.locator('[data-cave-aside="yes"]').click();
  await page.waitForTimeout(1000);
  await page.locator('[data-cave-next]').click();
  await walkTo('[data-cave-release]');
  ok(await state(`s.stack[s.stack.length - 1].child.gate.length`) === 6 || depth === 0, 'all six faces\' branches are walked before the way out');
  await page.locator('[data-cave-release]').click();
};
await page.locator('[data-cave-dig]').click();
await page.locator('[data-cave-place="walk"]').waitFor();
const b2 = await C(() => window.__oagCave.branch());
ok((await C(() => window.__oagCave.depth())) === 2 && b2.lowest <= -9.9 && b2.startGap < 0.01, 'working what the daemon holds opens a loop of its own, deeper again, from the daemon\'s spot');
ok(await page.locator('[data-cave-skip]').count() === 0, 'inside the daemon\'s own loop there is no skip either');
await sidePassage(2);
await page.locator('[data-cave-dug]').waitFor({ timeout: 30000 });
ok((await C(() => window.__oagCave.depth())) === 1 && await sees('[data-cave-aside="yes"]'), 'coming back round, the daemon is asked again');
// Still not yet: the 3-2-1, round after round, until it is satisfied.
await page.locator('[data-cave-aside="not-yet"]').click();
await page.locator('[data-cave-321]').click();
const charge = (which, v) => page.locator(`[data-cave-321-charge="${which}"]`).evaluate((e, x) => { e.value = x; e.dispatchEvent(new Event('input', { bubbles: true })); }, v);
const say = async (k, text) => { await page.locator(`[data-cave-321-text="${k}"]`).fill(text); await page.locator('[data-cave-321-send]').click(); };
for (const round of [1, 2]) {
  ok(await sees('[data-cave-321-step="before"]') || round === 2, '3-2-1 opens with a charge reading before');
  if (round === 1) { await charge('before', 9); ok((await page.locator('[data-cave-321-read="before"]').textContent()) === '9 of 10', 'the before reading follows the slider'); await page.locator('[data-cave-321-start]').click(); }
  ok(await sees('[data-cave-321-step="it"]'), `3-2-1 round ${round}: 3 Face it`);
  const stg = () => C(() => window.__oagCave.stage());
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  let s3;
  if (round === 1) {
    await page.waitForTimeout(2500); s3 = await stg();
    ok(s3.cam === 'far' && s3.cu === 0 && dist(s3.avatar, s3.daemon) > 4.5 && (await page.locator('[data-cave-321-where]').textContent()).includes('across the chamber'), 'staged: Face it is seen from across the chamber');
  }
  await say('it', 'it is a wall ' + round);
  ok(await page.locator('[data-cave-bubble-phase="3"]').count() >= 1 && (await page.locator('[data-cave-321-text="it"]').inputValue()) === '' && await page.evaluate(() => document.activeElement && document.activeElement.hasAttribute('data-cave-321-text')), 'a line sent shows in the thread, and the box stays ready');
  ok(await page.locator('[data-cave-321-voice]').count() === 0, 'Face it has one voice, no switcher');
  await page.locator('[data-cave-321-next]').click();
  ok(await sees('[data-cave-321-step="you"]') && await page.locator('[data-cave-bubble-phase="3"]').count() >= 1, 'Talk to it keeps the thread above');
  if (round === 1) {
    await page.waitForTimeout(3000); const s2 = await stg();
    ok(s2.cam === 'face-you' && dist(s2.avatar, s2.daemon) < 3.6 && dist(s2.avatar, s2.daemon) > 1.5 && (await page.locator('[data-cave-321-where]').textContent()).includes('face to face'), 'staged: Talk to it is face to face');
    await page.locator('[data-cave-321-voice="it"]').click(); await page.waitForTimeout(3000); const s2b = await stg();
    ok(s2b.cam === 'face-it' && dist(s2b.camPos.filter((_, i) => i !== 1), s2.camPos.filter((_, i) => i !== 1)) > 2, 'staged: the voice switcher swings the camera to the daemon\'s shoulder');
    await page.locator('[data-cave-321-voice="you"]').click();
    await page.locator('[data-cave-321-back]').click();
    await page.waitForTimeout(4500); const sb = await stg();
    ok(await sees('[data-cave-321-resume]') && await page.locator('[data-cave-321-text]').count() === 0 && sb.cam === 'far' && sb.cu === 0, 'Step back returns to the far place and pauses, with no way past');
    await page.locator('[data-cave-321-resume]').click();
    ok(await sees('[data-cave-321-step="you"]') && await page.locator('[data-cave-bubble-phase="3"]').count() >= 1, 'going back in keeps the words and the step');
  }
  await say('you', 'what do you want?');
  await page.locator('[data-cave-321-voice="it"]').click();
  ok((await page.locator('[data-cave-321-voice="it"]').getAttribute('aria-pressed')) === 'true', 'the switcher moves to the daemon\'s voice');
  await say('you', 'I want you safe');
  ok(await page.locator('[data-cave-bubble="it"][data-cave-bubble-phase="2"]').count() >= 1 && await page.locator('[data-cave-bubble="you"][data-cave-bubble-phase="2"]').count() >= 1, 'both voices write their own side of the talk');
  await page.locator('[data-cave-321-next]').click();
  ok(await sees('[data-cave-321-step="i"]') && await page.locator('[data-cave-321-voice]').count() === 0, 'Be it: one voice, "I am"');
  if (round === 1) {
    await page.waitForTimeout(4500); const s1 = await stg();
    ok(s1.cam === 'its' && s1.flip === 1 && s1.cd === 1 && dist(s1.avatar, s1.daemon) > 4.5 && (await page.locator('[data-cave-321-where]').textContent()).includes('where it stood'), 'staged: Be it stands where the daemon stood, with the daemon in the player\'s place');
  }
  await say('i', 'I am the part that guards');
  await page.locator('[data-cave-321-next]').click();
  ok(await sees('[data-cave-321-step="after"]'), 'a charge reading after');
  if (round === 1) { await page.waitForTimeout(4500); const sa = await stg(); ok(sa.cam === 'far' && sa.cu === 0 && sa.cd === 0 && sa.flip === 0, 'staged: then a step back to the player\'s own place'); }
  await charge('after', round === 1 ? 8 : 3);
  await page.locator('[data-cave-321-after]').click();
  ok(await sees('[data-cave-321-ask]') && await page.locator('[data-cave-next]').count() === 0 && await page.locator('[data-cave-skip]').count() === 0, `after round ${round} the daemon is asked if it feels satisfied, with no way past and no skip`);
  if (round === 1) {
    await page.locator('[data-cave-satisfied="not-yet"]').click();
    ok(await sees('[data-cave-321-step="it"]') && await page.locator('[data-cave-bubble-phase="3"]').count() >= 1, 'another round keeps the thread');
  }
}
await page.locator('[data-cave-satisfied="yes"]').click();
await page.waitForTimeout(1000);
ok(await sees('[data-cave-open]') && await sees('[data-cave-next]'), 'once it stands aside the way opens');
await page.locator('[data-cave-next]').click();
await walkTo('[data-cave-release]');
await page.screenshot({ path: SHOTS + '/cave-way-out.png' });
await page.locator('[data-cave-release]').click();
await page.locator('[data-cave-back]').waitFor({ timeout: 30000 });
const avBack = await avatar();
ok(avBack.route === 'main' && Math.abs(avBack.s - sAck) < 1e-6 && (await C(() => window.__oagCave.depth())) === 0, 'Release walks round the loop and up onto the exact spot the block left from');
ok((await state('JSON.stringify(s.sens[0].blocked)')) === JSON.stringify(['acknowledge', 'acknowledge>daemon']), `the scan keeps the block and the daemon's encounter: ${await state('JSON.stringify(s.sens[0].blocked)')}`);

// ---- a skip returns to the main path from inside a side path ---------------------------------------------
await page.locator('[data-cave-go]').click();
await walkTo('[data-cave-marker="allow"]');
const sAllow = (await avatar()).s;
await page.locator('[data-cave-block]').click();
await walkTo('[data-cave-stone="magenta"]');
await page.locator('[data-cave-skip]').click();
await page.locator('[data-cave-marker="allow"]').waitFor();
await page.waitForTimeout(700);
ok(Math.abs((await avatar()).s - sAllow) < 1e-6 && (await state('JSON.stringify(s.sens[0].skipped)')) === '["allow"]', 'Skip returns to the marker it left from, and the skip is kept on the scan');

const camIn = camSamples.filter((c) => c.inside).length, camOut = camSamples.filter((c) => !c.inside);
ok(camIn >= camSamples.length * 0.97, `the camera stays inside the tunnel while walking (${camIn} of ${camSamples.length} samples)` + (camOut.length ? ' outside at: ' + JSON.stringify(camOut.slice(0, 4)) : ''));

// ---- on to the way out, and the saved scan ----------------------------------------------------------------
for (const id of ['accept', 'appreciate', 'validate', 'exhale']) { await page.locator('[data-cave-go]').click(); await walkTo(`[data-cave-marker="${id}"]`); }
ok((await C(() => window.__oagCave.look())).revealed === 6, 'every stretch opened, each on its own choice');
await page.screenshot({ path: SHOTS + '/cave-exhale.png' });
await page.locator('[data-cave-go]').click();
await page.locator('[data-cave-chamber]').waitFor({ state: 'detached', timeout: 15000 });
const marks = await C(() => window.OAGBody.marks());
const mk = marks[marks.length - 1];
ok(mk && JSON.stringify(mk.blocked) === JSON.stringify(['acknowledge', 'acknowledge>daemon', 'allow']), `the scan is saved with its blocks: ${mk && JSON.stringify(mk.blocked)}`);

// ---- each charge wears differently; any portal opens the same cave for the same scan ------------------------
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

