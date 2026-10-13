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
// six faces' branches at the gate; and the WAVE room (11 October): Take it home from a daemon by lantern and back, and the
// room on its own from the body map through both branches, the restart, the rest offer and the on-device test answers. Build first with `npm run build:ontology-game`, then copy this
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
// Pieces grow out of the stone (Wendell, 2026-10-13): from the floor's edge, the walls and the roof, and spires vary in size.
const zones = await state('s.dressZones');
ok(new Set(zones.map((z) => z.split(':')[1])).size >= 2, `the dressing grows from ${[...new Set(zones.map((z) => z.split(':')[1]))].join(', ')}`);
ok(zones.filter((z) => /^root_(curl|hang)/.test(z)).every((z) => /:(roof|high)$/.test(z)), 'roots hang from the roof or the high wall');
// The grown pieces (grow.py, from procgen): mushroom clumps, braided roots through the roof, root mats along the wall.
ok(['root_hang', 'root_creep', 'mush_clump', 'mush_colony'].every((p) => kitPieces.includes(p)), 'the kit carries the grown roots and mushrooms');
ok(zones.filter((z) => z.startsWith('root_creep')).every((z) => /:(mid|high)$/.test(z)), 'root mats press along the middle and high wall');
ok(dressing.some((p) => ['root_hang', 'root_creep', 'mush_clump'].includes(p)), `grown pieces dress the chamber (${dressing.filter((p) => /^(root_hang|root_creep|mush_clump)$/.test(p)).join(', ')})`);
const spires = await state('s.spires');
ok(spires.length < 2 || new Set(spires.map((x) => x.len)).size > 1, `the spires come in different sizes (${spires.map((x) => x.zone + ' ' + x.len).join(', ') || 'none in this chamber'})`);
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
// One touch walks and looks (Wendell, 2026-10-13): a drag keeps the hold, and pushing up lifts the camera to look down.
const above0 = (await C(() => window.__oagCave.camInside())).above;
await page.mouse.move(195, 600); await page.mouse.down(); await page.mouse.move(150, 460, { steps: 8 });
const heldWhileDragging = await state('s.held');
await page.waitForTimeout(900);
const above1 = (await C(() => window.__oagCave.camInside())).above, pitchUp = await state('s.look.pitch');
await page.mouse.up();
ok(heldWhileDragging, 'dragging to look keeps the thumb walking');
ok(pitchUp < 0 && above1 > above0 + 0.5, `pushing up lifts the camera to look down on the figure (${above0.toFixed(1)} to ${above1.toFixed(1)} above the floor)`);
await page.mouse.move(195, 460); await page.mouse.down(); await page.mouse.move(195, 640, { steps: 8 }); await page.mouse.up();
ok((await state('s.look.pitch')) > pitchUp, 'dragging down brings the camera back down');
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
      ok(fb.turnIn <= 90 && fb.opened === 1, `Magenta's way in is ahead of the figure, a ${Math.round(fb.turnIn)}° turn, and only it is open`);
      ok((await C(() => window.__oagCave.pane())).text === 'Where is the presence you\'re reaching for?', 'walking a face\'s branch, the pane holds that face\'s question');
      const st0 = await C(() => window.__oagCave.branchStyle());
      ok(st0.shown && st0.value === 'magenta' && st0.style === 'magenta' && st0.motes, 'a face\'s branch opens in that face\'s style, with the style dropdown on the screen');
      await page.waitForTimeout(1500); const rock0 = (await C(() => window.__oagCave.branchStyle())).rock;
      await page.locator('[data-cave-branch-style]').selectOption('teal');
      await page.waitForTimeout(2500);
      const st1 = await C(() => window.__oagCave.branchStyle());
      const near = (a, b) => [16, 8, 0].every((k) => Math.abs(((a >> k) & 255) - ((b >> k) & 255)) < 24);
      ok(st1.style === 'teal' && st1.rock !== rock0 && near(st1.rock, 0x2c686a) && near(st1.light, 0x78e4e4), `choosing Teal dresses the branch in Teal's walls and light (rock #${st1.rock.toString(16)}, light #${st1.light.toString(16)})`);
      await page.screenshot({ path: SHOTS + '/cave-branch-teal.png' });
    }
    await walkTo('[data-cave-face-back]');
    await page.locator('[data-cave-face-back]').click();
    if (check && f === 'magenta') ok(await page.waitForFunction(() => !window.__oagCave.branchStyle().shown, null, { timeout: 15000 }).then(() => true, () => false), 'back at the stone, the style dropdown is gone');
  }
};
// ---- the camera stays inside the stone: thumb pushed up to look down, and swung round (Wendell, 2026-10-13) -------------
const camLooks = [];
for (const [p, y] of [[-1.3, 0], [-1.3, 1.5], [-1.3, Math.PI], [0.6, -1.5]]) {
  await C(([pp, yy]) => { window.__oagCave.state.look.pitch = pp; window.__oagCave.state.look.yaw = yy; }, [p, y]);
  await page.waitForTimeout(1200); camLooks.push(Object.assign(await C(() => window.__oagCave.camInside()), { room: await C(() => window.__oagCave.camRoom()) }));
}
await C(() => { window.__oagCave.state.look.pitch = 0; window.__oagCave.state.look.yaw = 0; });
ok(camLooks.every((c) => c.room > 0.2 && c.above < c.roof * 0.97), `looking down from above and swinging round, the camera keeps clear of the roof and walls (room ${camLooks.map((c) => c.room.toFixed(2)).join(', ')})`);
// ---- a block: the wall opens, a side path loops under the cave and back to the very spot --------------------
await C(() => { window.__oagCave.state.speed = 8; });
await walkTo('[data-cave-marker="acknowledge"]');
const sAck = (await avatar()).s;
await page.locator('[data-cave-block]').click();
await page.locator('[data-cave-place="walk"]').waitFor();
const b1 = await C(() => window.__oagCave.branch()), tn1 = await C(() => window.__oagCave.tunnel());
ok(b1 && b1.kind === 'side' && b1.startGap < 0.01 && b1.endGap < 0.01, `the side path starts and ends on the spot it left from (gaps ${b1.startGap.toFixed(3)} and ${b1.endGap.toFixed(3)}): it loops back`);
ok(b1.lowest <= -9.9 && b1.len > 150, `it ramps down under the cave (${b1.lowest.toFixed(1)} units) and runs a loop ${Math.round(b1.len)} units long`);
ok(tn1.holes === 1 && tn1.mainTris < tn.mainTris && b1.opened === 1, `only the way in opens at first; the way back waits (${tn.mainTris - tn1.mainTris} faces removed)`);
ok(b1.turnIn <= 90, `the way in is ahead of the figure, a ${Math.round(b1.turnIn)}° turn (never more than 90°)`);
ok((await C(() => window.__oagCave.lanterns())) === 1, 'a lantern stands between the two openings');
ok(b1.stops === 10, 'the loop holds six stones, the mouth, the pool, the daemon and the way out');
await page.screenshot({ path: SHOTS + '/cave-branch.png' });
// The seam holds (Wendell, 2026-10-13: "branching paths need hardening for these kinds of glitches. Especially since the walls
// are breathing"): the void outside the stone is painted green and the way in is looked at from all round inside the main
// tunnel, at two moments of the breath. No green may show.
const greenIn = (buf) => page.evaluate(async (b64) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i + 1] > 180 && d[i] < 90 && d[i + 2] < 90) n++;
  return n;
}, buf.toString('base64'));
await C(() => { window.__oagCave.state.voidHex = 0x00ff00; });
const seams = await C(() => window.__oagCave.openings(false)), seamGreen = [];
for (let ph = 0; ph < 2; ph++) {
  for (const v of seams[0].views) { await C((c) => { window.__oagCave.state.camFix = c; }, v); await page.waitForTimeout(60); seamGreen.push(await greenIn(await page.screenshot())); }
  await page.waitForTimeout(2500);
}
await C(() => { window.__oagCave.state.camFix = null; window.__oagCave.state.voidHex = null; });
ok(seams.length === 1 && seamGreen.length >= 10 && seamGreen.every((n) => n === 0), `no void shows round the way in from ${seamGreen.length} views across the breath (green ${seamGreen.filter((n) => n).join(', ') || 'none'})`);
const walkSamples = [];
await page.mouse.move(330, 700); await page.mouse.down();
for (let i = 0; i < 6; i++) { walkSamples.push(await avatar()); await page.waitForTimeout(150); }
await page.locator('[data-cave-stone="magenta"]').waitFor({ timeout: 60000 }); await page.mouse.up();
ok(walkSamples.every((a) => a.route === 'branch' || a.route === 'side') && walkSamples.every((a) => a.offPath < 1e-6), 'the avatar walks the side path on its line');
ok((await C(() => window.__oagCave.tunnel())).holes === 1, 'walking out to the gate, the main wall still shows only the way in');
ok(await page.locator('[data-cave-stone-says]').count() === 1 && await page.locator('[data-cave-next]').isDisabled(), 'the passage opens on the first of the six gates, and the way on waits for its branch');
await gatesFirst(true);
await walkTo('[data-cave-place="mouth"]');
await page.locator('[data-cave-choice="numbness"]').click();
await page.locator('[data-cave-next]').click();
await walkTo('[data-cave-place="pool"]');
ok(await sees('[data-cave-element-hidden]') && await sees('[data-cave-element-unknown]') && await C(() => window.__oagCave.sideElement().shown === false), 'at the pool the element stays out of sight until the player chooses, and "I don\'t know" is offered');
ok(await C(() => window.__oagCave.sideElement().colony), 'a mushroom colony grows beside the pool');
await page.locator('[data-cave-element-unknown]').click();
ok(await sees('[data-cave-element-hidden]') && await C(() => window.__oagCave.sideElement().shown === false) && await sees('[data-cave-next]'), '"I don\'t know" keeps it hidden and lets the player go on');
await page.locator('[data-cave-choice="Sadness"]').click();
const se = await C(() => window.__oagCave.sideElement());
ok(se.shown && se.deco >= 6 && se.name === 'Sadness', 'choosing an element shows it and decorates the passage with it');
await page.locator('[data-cave-next]').click();
await walkTo('[data-cave-place="passage"]');
ok(await page.locator('[data-cave-next]').count() === 0, 'the daemon\'s stop has no Continue until it stands aside');
await page.locator('[data-cave-choice="protector"]').click();
// Met the Big Mind way (board merge-layout): its permission first, then its place, then its questions answered as it.
ok(await sees('[data-cave-bm-ask]') && await page.locator('[data-cave-aside]').count() === 0 && await page.locator('[data-cave-next]').count() === 0 && await page.locator('[data-cave-skip]').count() === 0, 'meeting a daemon starts by asking its permission to speak with it, with no way past and no skip');
await page.locator('[data-cave-bm-speak="yes"]').click();
ok(await sees('[data-cave-bm-seat]') && await sees('[data-cave-bm-q="job"]'), 'yes: the player steps into its place, and its first question is its job');
await page.waitForFunction(() => window.__oagCave.stage().cam === 'its' && window.__oagCave.stage().cu > 5.5, null, { timeout: 8000 }).catch(() => {});
const stIn = await C(() => window.__oagCave.stage());
ok(stIn.cam === 'its' && stIn.cu > 5.5 && stIn.cd > 0.9, `standing in its place: the figure walks to where the daemon stood and the daemon trades places (cu ${stIn.cu.toFixed(2)}, cd ${stIn.cd.toFixed(2)})`);
await page.locator('[data-cave-bm-card="0"]').click();
ok(await sees('[data-cave-bm-q="from"]') && (await C(() => window.__oagCave.meeting())).heard.job[0] === 'To protect.', 'a card answers as the daemon, and the next question follows');
const fixerCard = await page.locator('[data-cave-bm-card]').evaluateAll((bs) => bs.findIndex((b) => /fix whatever/.test(b.textContent)));
await page.locator(`[data-cave-bm-card="${fixerCard}"]`).click();
ok(await sees('[data-cave-bm-secret="fixer"]') && await page.locator('[data-cave-bm-name="protector"]').count() === 0 && await sees('[data-cave-bm-name="fixer"]') && await sees('[data-cave-bm-name="ideas"]'), 'an answer in another part\'s job: the guide names the tell and asks who was speaking');
await page.locator('[data-cave-bm-name="fixer"]').click();
ok(await sees('[data-cave-bm-thank]') && (await C(() => window.__oagCave.meeting())).waiters.length === 1, 'naming it brings its figure out behind the daemon, and the guide asks to thank it');
await page.locator('[data-cave-bm-thank]').click();
ok(await sees('[data-cave-bm-q="from"]'), 'thanked and asked to wait, and the daemon is asked again');
await page.waitForFunction(() => window.__oagCave.meeting().waiters[0].wait, null, { timeout: 6000 }).catch(() => {});
const mt1 = await C(() => window.__oagCave.meeting());
ok(mt1.waiters[0].who === 'fixer' && mt1.waiters[0].wait && mt1.waiting[0] === 'fixer', 'the Fixer walks on ahead and waits by the wall for its own turn');
ok(await page.locator('[data-cave-bm-done]').isDisabled(), '"That\'s all of it" waits for a card');
await page.locator('[data-cave-bm-card="0"]').click(); await page.locator('[data-cave-bm-card="2"]').click();
await page.locator('[data-cave-bm-done]').click();
ok(await sees('[data-cave-bm-q="thanks"]') && (await C(() => window.__oagCave.meeting())).heard.from.length === 2, 'what it protects you from takes several cards');
await page.locator('[data-cave-bm-line]').fill('It is tired of never being thanked');
await page.locator('[data-cave-bm-say]').click();
ok(await sees('[data-cave-bm-secret="ideas"]'), 'an open line about the daemon instead of as it is heard as the self\'s ideas');
await page.locator('[data-cave-bm-name="ideas"]').click(); await page.locator('[data-cave-bm-thank]').click();
await page.locator('[data-cave-bm-wrong]').click();
ok(await sees('[data-cave-bm-secret="felt"]'), '"This doesn\'t sound like" it brings a second figure out too');
await page.locator('[data-cave-bm-name="unknown"]').click(); await page.locator('[data-cave-bm-thank]').click();
await page.locator('[data-cave-bm-line]').fill('Nobody ever thanks me');
await page.locator('[data-cave-bm-say]').click();
ok(await sees('[data-cave-bm-thanks]') && (await page.locator('[data-cave-bm-heard]').getAttribute('data-cave-bm-heard')) === '4', 'after its questions the guide says back what it said and thanks it');
await page.screenshot({ path: SHOTS + '/cave-bm-heard.png' });
await page.locator('[data-cave-bm-out]').click();
ok(await sees('[data-cave-met="spoken"]') && await sees('[data-cave-aside="yes"]') && (await C(() => window.__oagCave.meeting())).met === 'spoken', 'stepping back out, it has been heard, and it is asked to step aside');
await page.waitForFunction(() => window.__oagCave.stage().cu < 0.1, null, { timeout: 8000 }).catch(() => {});
ok((await C(() => window.__oagCave.stage())).cu < 0.1 && (await C(() => window.__oagCave.meeting())).waiters.every((w) => w.wait), 'the player is back in their own place, and the three that spoke out of turn wait by the wall');
await page.locator('[data-cave-aside="not-yet"]').click();
ok(await sees('[data-cave-wall]') && await sees('[data-cave-dig]') && await page.locator('[data-cave-next]').count() === 0, '"Not yet" keeps the daemon in the way: no Continue, and an encounter to work');
ok(await page.locator('[data-cave-skip]').count() === 0 && await sees('[data-cave-321]'), 'a daemon in the way offers no skip, and offers the 3-2-1 talk');
const sWall = (await avatar()).s;
await page.locator('[data-cave-shrink]').click();
await page.mouse.move(330, 700); await page.mouse.down(); await page.waitForTimeout(2500); await page.mouse.up();
ok(Math.abs((await avatar()).s - sWall) < 1e-6, 'holding does not walk past the daemon');
await page.locator('[data-cave-pane]').click();
await page.screenshot({ path: SHOTS + '/cave-daemon-wall.png' });

// ---- the WAVE room (six-faces-council council/callsheets/wave-room.md): its helpers, then Take it home from this daemon -----
const room = () => C(() => window.__oagCave.room && { scene: window.__oagCave.room.scene(), charge: window.__oagCave.room.charge(), round: window.__oagCave.room.state.round, phase: window.__oagCave.room.state.phase });
const roomIn = async (shot) => { // Welcome: the door opens on an out-breath and the charge comes in; then Witness
  await page.locator('[data-room-welcome]').click();
  ok(await sees('[data-room-pane]') && (await room()).phase === 'opening', 'Welcome: the door waits for the out-breath, with only the pane up');
  await page.locator('[data-room-texture]').first().waitFor({ timeout: 30000 });
  const r = await room();
  ok(r.scene.door > 0.8 && r.charge.visible && Math.hypot(r.charge.x - r.scene.here[0], r.charge.z - r.scene.here[1]) < 0.05, 'the door opened and the charge came in to its place in the room');
  ok(r.scene.doorX < -r.scene.doorW * 1.2, `the door slid sideways into the wall, clear of the way in (its edge at x ${(r.scene.doorX + r.scene.doorW).toFixed(2)})`);
  if (shot) await page.screenshot({ path: SHOTS + '/room-witness.png' });
};
const roomToFork = async (name, element, texture, appreciate) => {
  if (texture) await page.locator(`[data-room-texture="${texture}"]`).click();
  await page.locator('[data-room-next]').click();
  ok(await page.locator('[data-room-next]').isDisabled(), 'Acknowledge waits for a name and an element');
  await page.locator('[data-room-name]').fill(name);
  await page.locator(`[data-room-element="${element}"]`).click();
  await page.locator('[data-room-next]').click();
  for (const id of ['allow', 'accept']) { ok((await room()).phase === id, `${id} is a step of its own`); await page.locator('[data-room-next]').click(); }
  ok((await room()).phase === 'appreciate' && await sees('[data-room-notnow]'), 'Appreciate offers Not now');
  await page.locator(appreciate ? '[data-room-next]' : '[data-room-notnow]').click();
  ok((await room()).phase === 'validate', 'Not now moves on to Validate, not a block');
  await page.locator('[data-room-next]').click();
  ok((await room()).charge.steady && await sees('[data-room-goal-ask]') && await page.locator('[data-room-push="toward"]').isDisabled(), 'Validate steadies its light; the fork asks what the player wants right now, before where the charge pushes');
};
const roomGoes = async (goal, light, shot) => {
  await page.locator('[data-room-goal]').fill(goal);
  await page.locator('[data-room-push="away"]').click();
  await page.locator('[data-room-line]').fill('you can go now');
  if (light) await page.locator('[data-room-light-name]').fill(light);
  const lightsBefore = (await room()).scene.lights.length;
  await page.locator('[data-room-exhale]').click();
  if (shot) { await page.waitForTimeout(5000); await page.screenshot({ path: SHOTS + '/room-leaving.png' }); }
  await page.locator('[data-room-gone]').waitFor({ timeout: 40000 });
  const r = await room();
  ok(r.charge.gone && r.scene.lights.length === lightsBefore + 1 && r.scene.lights[r.scene.lights.length - 1].name === (light || r.charge.name) && r.scene.lights[r.scene.lights.length - 1].z > r.scene.doorZ, `Goes: the charge left by the door at its own pace, and a light named "${light || r.charge.name}" stays on the threshold`);
  await page.waitForTimeout(3000);
  const dr = (await room()).scene.door;
  ok(dr > 0.15 && dr < 0.6, `the door settles ajar (${dr.toFixed(2)} open)`);
  await page.locator('[data-room-next]').click();
};
const roomCheckin = async (answer) => {
  ok(await sees('[data-room-checkin-ask]') && (await page.locator('[data-room-checkin-ask]').textContent()) === 'Did it leave, or did you get rid of it?', 'after the branch the page asks: did it leave, or did you get rid of it?');
  await page.locator(`[data-room-checkin="${answer}"]`).click();
  ok(await sees('[data-room-again-ask]'), 'then: is anything still here that says it belongs?');
};

const sideLanterns = await C(() => window.__oagCave.lanterns());
ok(await sees('[data-cave-take-home]'), 'the daemon\'s stop offers Take it home beside the 3-2-1');
await page.locator('[data-cave-take-home]').click();
await page.locator('[data-room="cave"]').waitFor();
await page.locator('[data-room-welcome]').waitFor();
ok((await C(() => window.__oagCave.lanterns())) === sideLanterns + 1 && !(await page.locator('[data-cave-chamber]').isVisible()), 'Take it home leaves a lantern at the spot, and the cave rests');
const homeCharge = (await room()).charge;
ok(homeCharge.known && homeCharge.element === 'Sadness' && homeCharge.texture === 'numbness', `the charge comes home with its feeling known, as named in the side passage (${homeCharge.element}, ${homeCharge.texture})`);
await page.waitForTimeout(600);
await page.screenshot({ path: SHOTS + '/room-from-cave.png' });
await roomIn(true);
ok((await page.locator('[data-room-texture="numbness"]').getAttribute('aria-pressed')) === 'true' && (await page.locator('[data-room-where]').textContent()).includes('heart'), 'Witness already knows where it is and its texture');
await roomToFork('The guard', 'Sadness');
await roomGoes('to rest', 'Night light', true);
await roomCheckin('left');
await page.locator('[data-room-again="no"]').click();
ok((await page.locator('[data-room-leave]').textContent()) === 'Back to the lantern', 'when the room is quiet, the way out is back to the lantern');
await page.locator('[data-room-leave]').click();
await page.locator('[data-cave-home-back]').waitFor({ timeout: 15000 });
ok((await page.locator('[data-room]').count()) === 0 && Math.abs((await avatar()).s - sWall) < 1e-6 && (await C(() => window.__oagCave.lanterns())) === sideLanterns + 1, 'the cave comes back at the lantern, the figure where it stood');
const sp = await C(() => window.__oagCave.spirits.map((o) => ({ name: o.name, element: o.element, lighter: o.lighter, hex: o.g.userData.color.getHex() })));
ok(sp.length === 1 && sp[0].name === 'The guard' && sp[0].element === 'Sadness' && sp[0].lighter && sp[0].hex === 0x3a78d0, 'the charge worked in the room walks back into the cave as a spirit, in its colour with its name, lighter for being breathed out: ' + JSON.stringify(sp));
ok((await page.locator('[data-cave-spiritbtn]').textContent()) === 'Spirits 1', 'the cave counts the spirits with you');
await page.waitForTimeout(800);
ok(await C(() => { const g = window.__oagCave.spirits[0].g, a = window.__oagCave.avatar(); return g.visible && Math.hypot(g.position.x - a.x, g.position.z - a.z) < 6; }), 'the spirit floats by the figure');
await page.screenshot({ path: SHOTS + '/cave-spirit.png' });
await page.locator('[data-cave-spiritbtn]').click();
await page.locator('[data-cave-spirit="0"]').click();
ok(/Thank you for coming with me/.test(await page.locator('[data-cave-spirits]').textContent()) && await sees('[data-cave-spirit-home]'), 'tapping it thanks it, and offers to breathe it out or take it home again');
await page.locator('[data-cave-spirit-out]').click();
ok((await C(() => window.__oagCave.spirits.length)) === 0 && !(await page.locator('[data-cave-spiritbtn]').isVisible()), 'breathing it out lets it go');
// Sitting down where you are (13 October 2026): the WAVE room's steps run in place in the tunnel, as in the Big Mind cave, and
// standing up leaves a spirit that carries its own light.
ok(await sees('[data-cave-sitbtn]'), 'inside the cave, Sit down is always at hand');
await page.locator('[data-cave-sitbtn]').click();
await page.locator('[data-cave-sit-step="welcome"]').waitFor({ timeout: 5000 });
ok(!(await sees('[data-cave-sitbtn]')) && (await C(() => window.__oagCave.sitting())).phase === 'steps', 'sitting down opens the W.A.V.E. in place, at Welcome');
ok(await page.locator('[data-cave-orb]').count() === 1, 'every sitting step keeps a breathing ring');
await page.locator('[data-cave-sitnext]').click();
ok(await page.locator('[data-cave-sitnext]').isDisabled(), 'Witness waits for what it is like');
await page.locator('[data-cave-sittexture="tension"]').click();
await page.waitForTimeout(900);
ok((await C(() => window.__oagCave.sitting())).hex !== 0x8a8a96, 'the shape takes its texture\'s colour');
await page.locator('[data-cave-sitnext]').click();
await page.locator('[data-cave-sitname]').fill('Knot');
await page.locator('[data-cave-sitelement="Fear"]').click();
await page.locator('[data-cave-sitnext]').click();
ok(await page.locator('[data-cave-sitallow]').count() === 2, 'Allow has the size and brightness sliders');
await page.locator('[data-cave-sitallow="grow"]').evaluate((i) => { i.value = '10'; i.dispatchEvent(new Event('input')); });
await page.waitForTimeout(1500);
ok((await C(() => window.__oagCave.sitting())).scale > 1.5, 'it grows as the player allows it');
await page.locator('[data-cave-sitnext]').click();
await page.locator('[data-cave-sitnext]').click();
ok(await sees('[data-cave-sitnotnow]'), 'Appreciate can be left for now');
await page.locator('[data-cave-sitnotnow]').click();
await page.locator('[data-cave-sitnext]').click();
await page.locator('[data-cave-sitgoal]').fill('to rest');
await page.locator('[data-cave-sitpush="away"]').click();
await page.locator('[data-cave-sitexhale]').click();
await page.waitForFunction(() => !window.__oagCave.sitting(), null, { timeout: 8000 });
const sat = await C(() => window.__oagCave.spirits.map((o) => ({ name: o.name, element: o.element, lighter: o.lighter, hex: o.g.userData.color.getHex() })));
ok(sat.length === 1 && sat[0].name === 'Knot' && sat[0].element === 'Fear' && sat[0].lighter && sat[0].hex === 0xc8ccd4, 'breathed out, it walks behind the figure as a lighter spirit, in its element\'s colour: ' + JSON.stringify(sat));
ok((await C(() => window.__oagCave.carried())) === 1, 'the spirit carries its own light');
ok(await sees('[data-cave-home-satisfied="yes"]'), 'standing up brings back the page that was up');
await page.locator('[data-cave-sitbtn]').click();
await page.locator('[data-cave-sit-step="welcome"]').waitFor({ timeout: 5000 });
await page.locator('[data-cave-standup]').click();
await page.waitForFunction(() => !window.__oagCave.sitting(), null, { timeout: 8000 });
const sat2 = await C(() => window.__oagCave.spirits.map((o) => o.name));
ok(sat2.length === 2 && /^\w+ \w+$/.test(sat2[1]) && (await C(() => window.__oagCave.carried())) === 2, 'standing up partway still leaves a spirit, under the name the game gave it: ' + sat2[1]);
for (let i = 0; i < 2; i++) {
  await page.locator('[data-cave-spiritbtn]').click(); await page.locator('[data-cave-spirit="0"]').click(); await page.locator('[data-cave-spirit-out]').click();
}
await page.waitForTimeout(1800);
ok((await C(() => window.__oagCave.spirits.length)) === 0 && (await C(() => window.__oagCave.carried())) === 0, 'a spirit breathed out takes its light with it');
ok(await sees('[data-cave-home-satisfied="yes"]') && await page.locator('[data-cave-skip]').count() === 0 && await page.locator('[data-cave-next]').count() === 0, 'back from the room the daemon is asked again, and it is still no skip and no way past');
await page.locator('[data-cave-home-satisfied="not-yet"]').click();
ok(await sees('[data-cave-dig]') && await sees('[data-cave-take-home]'), '"Not yet" puts the daemon back in the way, with its encounters');

// The encounter: dig into what it holds, a loop of its own one level deeper, then the daemon is asked again.
const sidePassage = async (depth) => {
  await gatesFirst(depth === 2);
  await walkTo('[data-cave-place="mouth"]'); await page.locator('[data-cave-next]').click();
  await walkTo('[data-cave-place="pool"]'); await page.locator('[data-cave-next]').click();
  await walkTo('[data-cave-place="passage"]');
  await page.locator('[data-cave-choice="skeptic"]').click(); await page.locator('[data-cave-bm-speak="not-now"]').click();
  ok(await sees('[data-cave-met="declined"]') && await page.locator('[data-cave-skip]').count() === 0, '"Not now" is an answer: the daemon still holds the way and is asked to step aside, with no skip');
  await page.locator('[data-cave-aside="yes"]').click();
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
let glow9 = null;
for (const round of [1, 2]) {
  ok(await sees('[data-cave-321-step="before"]') || round === 2, '3-2-1 opens with a charge reading before');
  if (round === 1) {
    await charge('before', 9); ok((await page.locator('[data-cave-321-read="before"]').textContent()) === '9 of 10', 'the before reading follows the slider');
    ok(await sees('[data-cave-allow-slider="grow"]') && await sees('[data-cave-allow-slider="bright"]'), 'at the daemon, Allow\'s two sliders: how large it gets and how bright it can glow');
    await page.locator('[data-cave-allow-slider="grow"]').evaluate((e) => { e.value = 10; e.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForTimeout(2500); glow9 = await C(() => window.__oagCave.daemonGlow());
    ok(glow9.allowed && glow9.scale > 1.85 && glow9.level > 0.5, `the daemon grows to the size set (×${glow9.scale.toFixed(2)}) and glows with its charge (${glow9.level.toFixed(2)})`);
    await page.screenshot({ path: SHOTS + '/cave-daemon-allowed.png' });
    ok(await page.locator('[data-cave-321-skip]').count() === 0, 'the 3-2-1 with a daemon in the way has no skip');
    await page.locator('[data-cave-321-start]').click();
  }
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
  ok((await page.locator('[data-cave-321-voice="it"]').getAttribute('aria-pressed')) === 'true', 'a line sent in Talk to it hands the voice to the daemon by itself');
  if (round === 1) { await page.waitForTimeout(3000); ok((await stg()).cam === 'face-it', 'and the camera swings to the daemon\'s shoulder with it'); }
  await page.locator('[data-cave-321-voice="it"]').click();
  ok((await page.locator('[data-cave-321-voice="it"]').getAttribute('aria-pressed')) === 'true', 'the switcher still sets the voice');
  await say('you', 'I want you safe');
  ok((await page.locator('[data-cave-321-voice="you"]').getAttribute('aria-pressed')) === 'true', 'its answer hands the voice back to the player');
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
  if (round === 2) { await page.waitForTimeout(2500); const g3 = await C(() => window.__oagCave.daemonGlow()); ok(g3.level < glow9.level - 0.25, `its glow dulls as the charge comes down (${glow9.level.toFixed(2)} → ${g3.level.toFixed(2)})`); }
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
await page.waitForTimeout(1500);
ok((await C(() => window.__oagCave.daemonGlow())).want < 0.15, 'standing aside, it is dull');
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
  looks[texture].cave = await state('s.cave');
  looks[texture].rows = await state('JSON.stringify(s.layout.rows)');
  await C(() => window.__oagCave.leave(false));
  await page.locator('[data-cave-chamber]').waitFor({ state: 'detached' });
}
ok(looks.constriction.scale[0] < 0.7, `tightness is narrow and drawn in (width ${looks.constriction.scale[0].toFixed(2)})`);
ok(looks.numbness.opacity < 0.5, `numbness is fogged and translucent (opacity ${looks.numbness.opacity.toFixed(2)})`);
ok(looks.strength.glow > looks.tension.glow + 0.4, `strength is bright (glow ${looks.strength.glow.toFixed(2)} against ${looks.tension.glow.toFixed(2)})`);
ok(looks.tension.scale[1] > 1.1, `tension is taut (height ${looks.tension.scale[1].toFixed(2)})`);
ok(new Set(Object.values(looks).map((l) => l.cave.e + ':' + l.cave.roof)).size === 4, `each charge has its own cave shape (${Object.entries(looks).map(([k, l]) => k + ' ' + l.cave.e + '/' + l.cave.roof).join(', ')})`);
ok(!looks.numbness.cave.walls && looks.strength.cave.walls, 'numbness is blackness: its walls are lost in the dark');
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
// ---- the WAVE room on its own, from the body map: both branches, the restart, the rest offer, the test answers --------------
await C(() => { try { localStorage.removeItem('oag:wave-room:test'); } catch (e) {} });
await page.locator('[data-room-open]').click();
await pickOnFigure('heart');
await page.locator('[data-room="body"]').waitFor();
await page.locator('[data-room-welcome]').waitFor();
await page.waitForTimeout(800);
const r0 = await room();
ok(r0.scene.sit > 0.95 && Math.hypot(r0.scene.figure[0] - r0.scene.seat[0], r0.scene.figure[1] - r0.scene.seat[1]) < 0.05 && r0.scene.door < 0.05 && !r0.charge.visible && !r0.charge.known, 'the room: the figure sits on the seat facing a shut door, and nothing has come in yet');
await page.screenshot({ path: SHOTS + '/room-welcome.png' });
ok(await sees('[data-room-calm]'), 'the room has the Calm switch');
// round 1: it stays, and the 3-2-1 is aimed at what the player wants
await roomIn(false);
ok((await room()).charge.color === 0x8a8a92, 'a charge from the body map comes in grey');
await roomToFork('Knot', 'Fear', 'constriction', true);
await page.screenshot({ path: SHOTS + '/room-fork.png' });
await page.locator('[data-room-step-back]').click();
await page.waitForTimeout(3000);
ok(await sees('[data-room-paused]') && (await room()).scene.view === 'back' && (await room()).scene.sit < 0.05, 'Step back: the figure stands back behind the seat, and the words are kept');
await page.locator('[data-room-resume]').click();
ok((await page.locator('[data-room-goal]').inputValue()) === '' && await sees('[data-room-goal-ask]'), 'Go back in returns to the same step');
await page.locator('[data-room-goal]').fill('a quiet evening');
await page.locator('[data-room-push="toward"]').click();
ok(await sees('[data-cave-321-start]') && await sees('[data-cave-321-skip]'), 'Stays: the 3-2-1 begins with a charge reading, and can be skipped');
await page.locator('[data-cave-321-start]').click();
ok((await page.locator('[data-cave-321-aim]').textContent()).includes('a quiet evening'), 'the 3-2-1 is aimed at what the player wants');
await say('it', 'a knot under the chin');
await page.locator('[data-cave-321-next]').click();
await say('you', 'what do you want for me?');
await page.waitForTimeout(3500);
ok((await room()).scene.view === 'face-it' && (await room()).scene.sit < 0.05, 'Talk to it: face to face, and the line sent swings the voice and the camera to it by itself');
await page.screenshot({ path: SHOTS + '/room-talk.png' });
await say('you', 'for you to slow down');
await page.waitForTimeout(3500);
ok((await room()).scene.view === 'face-you', 'its answer swings them back to the player');
await page.locator('[data-cave-321-next]').click();
await say('i', 'I am the knot that keeps you careful');
await page.waitForTimeout(4500);
const rb = await room();
ok(rb.scene.view === 'its' && Math.hypot(rb.scene.figure[0] - rb.scene.here[0], rb.scene.figure[1] - rb.scene.here[1]) < 0.1 && Math.hypot(rb.charge.x - rb.scene.seat[0], rb.charge.z - rb.scene.seat[1]) < 0.3, 'Be it: the player stands where it stood, and it sits in the seat');
await page.screenshot({ path: SHOTS + '/room-be-it.png' });
await page.locator('[data-cave-321-next]').click();
await page.locator('[data-cave-321-after]').click();
ok(await sees('[data-room-move-ask]') && await page.locator('[data-room-move-done]').isDisabled(), 'the 3-2-1 ends with one next move the player writes');
await page.locator('[data-room-move]').fill('make tea and sit down');
await page.locator('[data-room-move-done]').click();
await page.waitForTimeout(3500);
ok(await sees('[data-room-kept]') && (await room()).scene.kept === 1, 'the charge takes a place in the room');
await page.screenshot({ path: SHOTS + '/room-kept.png' });
await page.locator('[data-room-next]').click();
await roomCheckin('stayed');
ok(await page.locator('[data-room-rest]').count() === 0, 'no rest offer before the third round');
// round 2: it goes, and the restart starts again at Welcome with a new charge
await page.locator('[data-room-again="yes"]').click();
const r2 = await room();
ok(r2.round === 2 && r2.phase === 'welcome' && !r2.charge.visible && r2.charge.name === '', 'Yes restarts at Welcome with a new charge, round 2');
await roomIn(false);
await roomToFork('Fog', 'Sadness', 'numbness');
await roomGoes('sleep', 'Blue lamp', false);
await page.screenshot({ path: SHOTS + '/room-gone.png' });
await roomCheckin('got-rid');
// round 3: then the rest offer
await page.locator('[data-room-again="yes"]').click();
await roomIn(false);
await roomToFork('Heat', 'Anger', 'tension');
await roomGoes('to finish the letter', '', false);
await roomCheckin('left');
ok((await room()).round === 3 && await sees('[data-room-rest-offer]') && await sees('[data-room-rest]'), 'after three rounds the room offers to rest it by the door with a lantern');
await page.locator('[data-room-rest]').click();
ok((await room()).scene.lantern && await sees('[data-room-end]') && (await room()).scene.lights.length === 2, 'resting leaves a lantern by the door, and the two lights stay on the threshold');
await page.screenshot({ path: SHOTS + '/room-rest.png' });
const kept = await C(() => window.__oagCave.roomTest());
const stored = await C(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return JSON.stringify(o); });
ok(kept.length === 3 && kept.map((e) => e.round).join() === '1,2,3' && kept.map((e) => e.answer).join() === 'stayed,got-rid,left' && kept.map((e) => e.branch).join() === 'stays,goes,goes', `the test answers and round numbers are kept on the device: ${JSON.stringify(kept.map((e) => [e.round, e.branch, e.answer]))}`);
ok(!/quiet evening|make tea|Knot|Blue lamp|knot under|slow down/.test(stored), 'nothing the player wrote is stored: not the goal, the name, the move, the light or the 3-2-1');
await page.locator('[data-room-leave]').click();
await page.locator('[data-room]').waitFor({ state: 'detached', timeout: 15000 });
ok(await sees('[data-cave-home]'), 'Leave the room returns to the front page');
// ---- the room's second slice (Wendell, 11 October 2026): up to three at once, a feeling about a feeling, Allow's sliders, the glow -----
await page.locator('[data-room-open]').click();
await pickOnFigure('heart');
await page.locator('[data-room-welcome]').waitFor();
await C(() => window.__oagCave.room.speed(3));
await roomIn(false);
const cr = () => C(() => window.__oagCave.room.creatures());
const pressed = async (sel) => (await page.locator(sel).getAttribute('aria-pressed')) === 'true';
const slide = (which, v) => page.locator(`[data-room-allow-slider="${which}"]`).evaluate((e, x) => { e.value = x; e.dispatchEvent(new Event('input', { bubbles: true })); }, v);
ok(await sees('[data-room-else]'), 'Witness offers "What else is here?"');
await page.locator('[data-room-else]').click();
ok(await sees('[data-room-else-ask]') && await page.locator('[data-room-else-about]').count() === 1, '"What else is here?" first asks whether it is about the one already in the room');
await page.locator('[data-room-else-new]').click();
await page.locator('[data-room-texture]').first().waitFor({ timeout: 30000 });
let cs = await cr();
ok(cs.length === 2 && cs[1].focus && cs[1].slot === 1 && Math.hypot(cs[1].x - cs[0].x, cs[1].z - cs[0].z) > 2.5 && cs[0].phase === 'witness', 'something new comes in through the door to a place of its own and is worked now; the first keeps its step');
ok(await page.locator('[data-room-focus]').count() === 2 && await pressed('[data-room-focus="1"]'), 'the page shows which one is being worked');
await page.locator('[data-room-texture="tension"]').click(); await page.locator('[data-room-next]').click();
await page.locator('[data-room-name]').fill('Ache'); await page.locator('[data-room-element="Joy"]').click(); await page.locator('[data-room-next]').click();
ok((await room()).phase === 'allow' && await sees('[data-room-allow-slider="grow"]') && await sees('[data-room-allow-slider="bright"]'), 'Allow has two sliders: how large it gets, and how bright its colour can get');
await page.waitForTimeout(2500);
const a1 = (await room()).charge;
ok(a1.allowed && a1.scale > 1.2 && a1.scale < 1.4, `at Allow it grows a little by itself (×${a1.scale.toFixed(2)})`);
await slide('grow', 10); await slide('bright', 10);
await page.waitForTimeout(2500);
const a2 = (await room()).charge;
ok(a2.scale > 1.85 && a2.glow > a1.glow + 0.1, `the sliders make it larger (×${a2.scale.toFixed(2)}) and brighter (glow ${a1.glow.toFixed(2)} → ${a2.glow.toFixed(2)})`);
await page.screenshot({ path: SHOTS + '/room-allow-large.png' });
await slide('bright', 2);
await page.waitForTimeout(2000);
ok((await room()).charge.glow < a2.glow - 0.2, 'turning its brightness down dims the glow and the sparks');
await slide('bright', 8); await slide('grow', 5);
await page.locator('[data-room-else]').click();
await page.locator('[data-room-else-about="1"]').click();
ok(await sees('[data-room-layer-ask]') && await page.locator('[data-room-layer-welcome]').isDisabled(), 'a feeling about it is welcomed as part of it, once it has a name and an element');
await page.locator('[data-room-layer-name]').fill('Shame about the ache'); await page.locator('[data-room-layer-element="Fear"]').click();
await page.locator('[data-room-layer-welcome]').click();
const a3 = (await room()).charge; cs = await cr();
ok((await room()).phase === 'allow' && cs.length === 2 && a3.layers.length === 1 && a3.layers[0].name === 'Shame about the ache' && !a3.layers[0].steady, 'it rides on that creature as a named ring, no new creature comes in, and the page goes back to Allow');
await page.waitForTimeout(800);
await page.screenshot({ path: SHOTS + '/room-layer.png' });
await page.locator('[data-room-else]').click(); await page.locator('[data-room-else-new]').click();
await page.locator('[data-room-texture]').first().waitFor({ timeout: 30000 });
cs = await cr();
ok(cs.length === 3 && cs[2].slot === 2 && cs[2].focus, 'a third comes in to the third place');
ok(/Ache · Wood/.test(await page.locator('[data-room-focus="1"]').textContent()) && await page.locator('[data-room-focus="1"][data-room-focus-element="wood"]').count() === 1, 'each part\'s chip shows the element chosen for it');
await page.locator('[data-room-shrink]').click(); await page.waitForTimeout(800);
await page.screenshot({ path: SHOTS + '/room-three.png' });
// Pinch to zoom, and a creature close up (Wendell, 13 October 2026: "Let's introduce pinch to zoom in the wave room. Also the
// ability to click on each of the spirits to have them fill the frame and have more information about it")
const zoomOf = () => C(() => window.__oagCave.room.zoom());
const pinch = (from, to) => C(([a, b]) => {
  const d = document.querySelector('[data-room] canvas');
  const ev = (t, id, x) => d.dispatchEvent(new PointerEvent(t, { pointerId: id, clientX: x, clientY: 430, bubbles: true, pointerType: 'touch', isPrimary: id === 1 }));
  ev('pointerdown', 1, 195 - a / 2); ev('pointerdown', 2, 195 + a / 2);
  for (let k = 1; k <= 5; k++) ev('pointermove', 2, 195 - a / 2 + a + (b - a) * k / 5);
  ev('pointerup', 2, 195 - a / 2 + b); ev('pointerup', 1, 195 - a / 2);
}, [from, to]);
await pinch(100, 200);
const z1 = await zoomOf();
await page.waitForTimeout(1500);
ok(Math.abs(z1 - 0.5) < 0.02 && (await room()).phase === 'witness' && (await C(() => window.__oagCave.room.close())) === null, `two fingers spread apart zoom in (×${z1.toFixed(2)}), and a pinch is not a tap`);
await page.screenshot({ path: SHOTS + '/room-pinch-in.png' });
await pinch(200, 100);
ok(Math.abs((await zoomOf()) - 1) < 0.02, 'pinching them together zooms back out');
await pinch(200, 20);
ok(Math.abs((await zoomOf()) - 1.6) < 0.02, 'zooming out widens the view, up to a limit');
await C(() => document.querySelector('[data-room] canvas').dispatchEvent(new WheelEvent('wheel', { deltaY: -600, bubbles: true, cancelable: true })));
ok((await zoomOf()) < 0.8, 'the mouse wheel zooms too');
await pinch(100, Math.round(100 * (await zoomOf()) / 1.6)); // zoomed out, so the one on the left comes into view on a phone
await page.waitForTimeout(2500);
await page.screenshot({ path: SHOTS + '/room-pinch-out.png' });
const zRoom = await zoomOf();
const drag = async (dx) => { await page.mouse.move(195, 600); await page.mouse.down(); await page.mouse.move(195 + dx / 2, 600, { steps: 4 }); await page.mouse.move(195 + dx, 600, { steps: 4 }); await page.mouse.up(); await page.waitForTimeout(2500); };
let at1 = await C(() => window.__oagCave.room.screenOf(1));
if (at1.x < 40) { await drag(-120); at1 = await C(() => window.__oagCave.room.screenOf(1)); }
if (at1.x < 40) { await drag(240); at1 = await C(() => window.__oagCave.room.screenOf(1)); } // one finger turns the view to the one on the left
ok(at1.x > 0 && at1.x < 390 && at1.y > 0 && at1.y < 844, `the creature to tap is in view (${Math.round(at1.x)}, ${Math.round(at1.y)}) at ×${zRoom.toFixed(2)}`);
await page.mouse.click(at1.x, at1.y);
await page.waitForTimeout(3000);
const cl = await C(() => window.__oagCave.room.close());
const card = await page.locator('[data-room-close]').textContent();
ok(cl && cl.name === 'Ache' && (await room()).scene.view === 'close' && await sees('[data-room-close]') && (await page.locator('[data-room-modal]').getAttribute('aria-hidden')) === 'true' && !(await sees('[data-room-pane]')), 'a tap on a creature brings it close, with its card in place of the page');
ok(card.includes('Ache') && card.includes('Wood') && card.includes('tension') && card.includes('Shame about the ache') && card.includes('Step: Allow'), 'its card says its name, element, texture, step and the feelings about it: ' + card);
ok(Math.abs((await zoomOf()) - 1) < 0.01, 'the close-up starts at its own distance, whatever the room was zoomed to');
const fill = await C(() => { const c = document.querySelector('[data-room] canvas'), r = c.getBoundingClientRect(), a = window.__oagCave.room.screenOf(1); return { y: (a.y - r.top) / r.height, x: (a.x - r.left) / r.width }; });
ok(fill.y > 0.2 && fill.y < 0.5 && Math.abs(fill.x - 0.5) < 0.1, `it sits in the middle of the frame, above the card (${fill.x.toFixed(2)}, ${fill.y.toFixed(2)})`);
await page.screenshot({ path: SHOTS + '/room-close.png' });
ok(await sees('[data-room-close-work]'), 'a creature not being worked can be picked from its card');
await page.locator('[data-room-close-back]').click();
await page.waitForTimeout(2000);
ok((await C(() => window.__oagCave.room.close())) === null && (await room()).scene.view !== 'close' && Math.abs((await zoomOf()) - zRoom) < 0.01 && await sees('[data-room-pane]') && !(await sees('[data-room-close]')), 'Back to the room returns the camera and its zoom, and the page as it was (tucked into the pane)');
await page.locator('[data-room-pane]').click();
await page.locator('[data-room-else]').click(); await page.locator('[data-room-else-new]').click();
ok(await sees('[data-room-waiting]') && (await cr()).length === 3 && (await room()).scene.waiting === 1, 'a fourth waits at the door');
await page.locator('[data-room-next]').click();
ok((await room()).phase === 'witness' && (await cr())[2].focus, 'and the page goes back to the third');
await page.locator('[data-room-focus="1"]').click();
await page.waitForTimeout(1500);
const r5 = await room();
ok(r5.phase === 'allow' && r5.charge.name === 'Ache' && Math.hypot(r5.scene.here[0] - r5.charge.x, r5.scene.here[1] - r5.charge.z) < 0.2 && r5.charge.layers.length === 1, 'picking the second again: it is back at Allow with its feeling about it, and the seat faces it');
await page.locator('[data-room-next]').click(); await page.locator('[data-room-next]').click(); await page.locator('[data-room-notnow]').click();
ok((await room()).phase === 'validate' && await sees('[data-room-validate-layers]'), 'Validate names the feeling about it too');
await page.waitForTimeout(1000);
const v0 = (await room()).charge.want;
await page.locator('[data-room-next]').click();
const v1 = (await room()).charge;
ok(v1.steady && v1.layers[0].steady && v1.want < v0 * 0.7, `Validate steadies it and the feeling about it, and its glow dulls as it is worked (${v0.toFixed(2)} → ${v1.want.toFixed(2)})`);
await roomGoes('to stretch', 'Green', false);
await page.locator('[data-room-checkin="left"]').click();
cs = await cr();
ok(cs.length === 2 && cs[0].focus && (await room()).phase === 'witness' && !(await sees('[data-room-again-ask]')), 'once one is worked through, the next in the room is worked, where it was left');
await roomToFork('Fog', 'Sadness', 'numbness');
await roomGoes('sleep', '', false);
await page.locator('[data-room-checkin="left"]').click();
ok((await cr()).length === 1 && (await room()).phase === 'witness', 'then the third');
await roomToFork('Heat', 'Anger', 'constriction');
await roomGoes('to finish', '', false);
await page.locator('[data-room-checkin="got-rid"]').click();
ok(await sees('[data-room-welcome]') && (await page.locator('[data-room-welcome]').locator('xpath=../..').textContent()).includes('waited at the door') && (await room()).scene.waiting === 0, 'with the room clear, the one that waited at the door is welcomed');
await roomIn(false);
await roomToFork('Last', 'Neutrality', 'tension');
await roomGoes('rest', '', false);
await roomCheckin('left');
await page.locator('[data-room-again="no"]').click();
await page.locator('[data-room-leave]').click();
await page.locator('[data-room]').waitFor({ state: 'detached', timeout: 15000 });
ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
console.log(`\n${passes} passed, ${fails} failed`);
await browser.close(); server.close();

