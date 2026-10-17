// J5(d): the robe's skirt as cloth in the game's own setting: headless Chromium, three.js r128 (the version cave.js
// loads), cloth.js through CaveCloth.attach, on FIGURES copies of the figure walking forward in a line (the Walk the
// GLB carries, and the figure carried along at the walk's speed, so the cloth feels the motion). It times
// CaveCloth's update (skinning on the CPU, the cloth's step, writing the points) every frame for six seconds, as the
// cost of 1/60 s of cloth (the cloth steps 480 times a second whatever the frame rate, so a slow frame costs more), and
// checks the cloth is alive: every point a number, and the hem swinging away from where plain skinning would put it.
// Round 6 (his note on round 5: "there’s jitteriness in the belt"): one more figure stands still, and the belt row (the
// free points within 6 cm of the belt) must keep still against the body: belt_jitter_mm, the largest frame-to-frame
// change in its motion relative to its skinned place (|second difference|), under 0.2 mm standing, and the same while
// walking (belt_walk_jitter_mm, 99th percentile) under 10 mm. The walking check caught the walk itself: the GLB's cubic
// quaternion keys flipped sign between keys, and three.js swung the hips and hem bones the long way round (132 mm;
// linear keys, 6 mm). Game time runs at a fixed 60 frames a second, so a slow headless frame does not stand in for
// the cloth: before round 6 a 50 ms frame stepped only 33 ms of cloth and was counted as three frames, which
// understated the cost (about 1.2 ms then, about 1.9 ms per figure counted honestly; the budget is 2.5 ms).
// Round 7 (his note on round 6: "Better hems around arms and legs still a bit jittery"): the same for the sleeve
// cuffs, the ankle ties, the hem's edge and its turned fold, measured as jitter: the frame-to-frame change in a point's
// speed less its mean over the five frames around it (hf()), so a smooth swing scores nothing and a kink scores its size.
// Round 11 (his note on round 10: "They are moving like solid objects and not clothes"): the sleeves hang from spring
// chains; the cuffs' lag behind the forearm and their coherence with it are reported (T1, pass cloth-designer1), and
// the cuff's jitter limit still holds them.
//   J5_DIR=$W/j5 FIGURES=4 node j5_cloth.mjs        (prints one JSON line; J5_SHOT=path saves a picture)
import http from 'node:http';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

// Round 7 limits, mm, [walking p99, standing largest]. Before round 7: cuffs 29, ties 35 (the walk's corners and the
// loop's hitch), fold 68 (it hung from the hem's edge as a stiff lip); after: 1.6, 3.2 and 31 to 36. The hem's edge
// (27 to 38 by the drape) and the skirt (22 to 27) are the cloth meeting the shins: without the leg capsules both fall
// to about 7. Their limits only keep them from getting worse.
// Round 9 (his note on round 8: "Let’s do the shins fix"): the shake was the blend band, not the contact. Hem 28.7 to
// 16.8, fold 33.7 to 20.3, skirt 22.3 to 14.2 (CLOTH.md, round 9); the limits now hold that.
const LIMITS = { cuff: [5, 0.5], ties: [8, 0.5], hem: [24, 0.5], fold: [28, 0.5] };
const DIR = process.env.J5_DIR, FIGURES = +(process.env.FIGURES || 4);
const NM = new URL('./node_modules/', import.meta.url).pathname;
const CLOTH = process.env.CLOTH_JS || join(dirname(fileURLToPath(import.meta.url)), 'cloth.js');
const BUILD = process.env.J5_BUILD || 'average';
const report = JSON.parse(readFileSync(join(DIR, 'report.json'), 'utf8'));
const figure = report.figures.find(f => f.build === BUILD && f.palette === 'dusk').file;
const robe = report.garments.find(g => g.build === BUILD && g.palette === 'dusk' && g.garment === 'robe').file;

const page = `<!doctype html><html><body style="margin:0;background:#222">
<script src="/three.min.js"></script>
<script src="/cloth.js"></script>
<script src="/GLTFLoader.js"></script>
<script>
(async () => {
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x333333, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(3, 4, 2); scene.add(sun);
const cam = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 80);
const loader = new THREE.GLTFLoader();
const parse = buf => new Promise((ok, no) => loader.parse(buf, '', ok, no));
const figBuf = await (await fetch('/glb/${figure}')).arrayBuffer(), robeBuf = await (await fetch('/glb/${robe}')).arrayBuffer();
const walkers = [];
for (let n = 0; n <= ${FIGURES}; n++) {                // the last one stands still
  const fig = await parse(figBuf.slice(0));
  const root = new THREE.Group();
  root.add(fig.scene);
  root.position.x = (n - (${FIGURES} - 1) / 2) * 1.0;
  scene.add(root);
  const mixer = new THREE.AnimationMixer(fig.scene);
  mixer.clipAction(fig.animations[0]).play();
  const bones = {};
  fig.scene.traverse(o => { if (o.isBone) bones[o.name] = o; });
  const g = await parse(robeBuf.slice(0));
  let mesh;
  g.scene.traverse(o => { if (o.isSkinnedMesh) mesh = o; });
  mesh.bind(new THREE.Skeleton(mesh.skeleton.bones.map(b => bones[b.name]), mesh.skeleton.boneInverses), mesh.bindMatrix);
  fig.scene.add(mesh);
  root.updateMatrixWorld(true);
  const cloth = CaveCloth.attach(THREE, mesh, { options: ${process.env.J5_OPTS || '{}'} });
  cloth.reset();
  // the belt row: free points within 6 cm (in the robe's height) of the highest free point
  const c = cloth.cloth, rp = mesh.geometry.attributes.position, up = [];
  for (let p = 0; p < c.P; p++) if (c.free[p]) up.push([p, rp.getY(c.reps[p])]);
  const top = Math.max(...up.map(q => q[1])), belt = up.filter(q => q[1] > top - 0.06).map(q => q[0]);
  // Round 7 (his note on round 6: "Better hems around arms and legs still a bit jittery"): the sleeve cuffs and the
  // robe's hem edge (robe points), and the ankle ties (the figure's own points, skinned on the CPU here as the GPU would)
  const binv = mesh.skeleton.boneInverses, bix = {};
  mesh.skeleton.bones.forEach((b, i) => { bix[b.name] = i; });
  const jointAt = name => new THREE.Vector3().setFromMatrixPosition(binv[bix[name]].clone().invert());
  const dom = (geo, v) => { const si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight; let bi = 0, bw = -1;
    for (let j = 0; j < 4; j++) if (sw.array[4 * v + j] > bw) { bw = sw.array[4 * v + j]; bi = si.array[4 * v + j]; } return bi; };
  const cuff = [];
  for (const sd of ['L', 'R']) {                    // the sleeve's far end: its points within 4 cm of the farthest from the shoulder
    const sh = jointAt('shoulder' + sd), arm = new Set(['elbow' + sd, 'wrist' + sd].map(b => bix[b]));
    const pts = []; for (let p = 0; p < c.P; p++) if (!c.free[p] && arm.has(dom(mesh.geometry, c.reps[p])))
      pts.push([p, new THREE.Vector3().fromBufferAttribute(rp, c.reps[p]).distanceTo(sh)]);
    const far = Math.max(...pts.map(q => q[1])); pts.filter(q => q[1] > far - 0.04).forEach(q => cuff.push(q[0]));
  }
  // the robe's cloth by its mark (_CLOTH): 1 the skirt, 2 the hem's edge, 3 the hem turned back inside it
  const simA = mesh.geometry.attributes._CLOTH || mesh.geometry.attributes._cloth, mark = p => Math.round(simA.getX(c.reps[p]));
  const skirt = [], hem = [], fold = [];
  for (let p = 0; p < c.P; p++) if (c.free[p] || mark(p) === 3) [null, skirt, hem, fold][mark(p)].push(p);
  let body; fig.scene.traverse(o => { if (o.isSkinnedMesh && o !== mesh) body = o; });
  const fb = {}; body.skeleton.bones.forEach((b, i) => { fb[b.name] = i; });
  const ties = [];
  for (const sd of ['L', 'R']) {                    // the shin's lowest 4 cm: where the ankle ties are painted
    const pts = []; const bp = body.geometry.attributes.position;
    for (let v = 0; v < bp.count; v++) if (dom(body.geometry, v) === fb['knee' + sd]) pts.push([v, bp.getY(v)]);
    const lo = Math.min(...pts.map(q => q[1])); pts.filter(q => q[1] < lo + 0.04).forEach(q => ties.push(q[0]));
  }
  walkers.push({ root, mixer, cloth, mesh, body, still: n === ${FIGURES}, belt, cuff, skirt, hem, fold, ties, hist: [], jit: [], seen: [], rimTrack: [], hf: { cuff: [], skirt: [], hem: [], fold: [], ties: [] } });
}
const still = walkers.pop(); still.root.position.set(0, 0, -3); walkers.push(still);
const SPEED = 1.36;                                  // m/s: character.py's stride at two steps a second
const costs = [], t0 = performance.now();
let last = t0, bad = 0, swing = 0, nf = 0;
cam.position.set(4.5, 1.3, 2.0);
// The jitter a motion has above what it means to do: its frame-to-frame change in speed (second difference) less the
// mean of that change over the five frames around it. A smooth swing, however fast, changes speed evenly and leaves
// nothing; a kink in the speed (a key the motion turns a corner at, a contact that chatters) leaves a spike. In mm.
function hf(seen, k) {
  const d2 = t => seen[t][k].map((a, j) => [0, 1, 2].map(i => seen[t][k][j][i] - 2 * seen[t - 1][k][j][i] + seen[t - 2][k][j][i]));
  const D = [2, 3, 4, 5, 6].map(d2), out = [];
  for (let j = 0; j < D[0].length; j++) out.push(1000 * Math.hypot(...[0, 1, 2].map(i => D[2][j][i] - (D[0][j][i] + D[1][j][i] + D[2][j][i] + D[3][j][i] + D[4][j][i]) / 5)));
  return out;
}
function frame(now) {
  // game time runs at 60 frames a second whatever the headless browser manages (about 16 here): at a 50 ms frame the
  // cloth's 16 sub-steps cover only 33 ms while the body moves the whole 50, which reads as jitter that is not the cloth's
  const dt = 1 / 60; last = now;
  for (const w of walkers) if (!w.still) { w.mixer.update(dt); w.root.translateZ(SPEED * dt); }
  scene.updateMatrixWorld(true);
  const a = performance.now();
  for (const w of walkers) if (!w.still) w.cloth.update(dt);
  costs.push((performance.now() - a) / Math.max(1e-3, dt * 60));   // per 1/60 s of cloth: a slow frame steps more
  still.cloth.update(dt);
  for (const w of [walkers[0], still]) {           // the belt row's motion against its skinned place
    const c = w.cloth.cloth, rel = w.belt.map(p => [0, 1, 2].map(k => c.x[3 * p + k] - c.tgt[3 * p + k]));
    w.hist.push(rel); if (w.hist.length > 3) w.hist.shift();
    if (w.n = (w.n || 0) + 1, w.n > 180 && w.hist.length === 3) for (let j = 0; j < rel.length; j++)
      w.jit.push(1000 * Math.hypot(...[0, 1, 2].map(k => w.hist[2][j][k] - 2 * w.hist[1][j][k] + w.hist[0][j][k])));
  }
  const v3 = new THREE.Vector3();
  for (const w of [walkers[0], still]) {           // the cuffs, hem and ties in the world, for the high-frequency jitter
    const x = w.cloth.cloth.x, at = p => [x[3 * p], x[3 * p + 1], x[3 * p + 2]];
    const tie = v => { w.body.boneTransform(v, v3); v3.applyMatrix4(w.body.matrixWorld); return [v3.x, v3.y, v3.z]; };
    if (w === walkers[0] && w.n > 180) {             // round 11 (T1): the cuffs where the springs have them, and where the arm alone would
      const raw = w.cloth.cloth.raw;
      if (raw) w.rimTrack.push([w.cuff.map(at), w.cuff.map(p => [raw[3 * p], raw[3 * p + 1], raw[3 * p + 2]])]);
    }
    w.seen.push({ cuff: w.cuff.map(at), skirt: w.skirt.map(at), hem: w.hem.map(at), fold: w.fold.map(at), ties: w.ties.map(tie) });
    if (w.seen.length > 7) w.seen.shift();
    if (w.n > 180 && w.seen.length === 7) for (const k in w.hf) w.hf[k].push(...hf(w.seen, k));
  }
  const w0 = walkers[0];
  cam.lookAt(w0.root.position.x, 0.8, w0.root.position.z); cam.position.z = w0.root.position.z + 2.0;
  renderer.render(scene, cam);
  if (++nf > 360) {
    // alive: every point a number; the free points away from where skinning alone puts them (the hem swings)
    const c = w0.cloth.cloth, x = c.x;
    for (let i = 0; i < x.length; i++) if (!isFinite(x[i])) bad++;
    w0.cloth.update(0);                              // targets refreshed for this pose, nothing stepped
    const tg = c.tgt, ds = [];
    for (let i = 0; i < c.P; i++) if (c.free[i]) ds.push(Math.hypot(x[3*i]-tg[3*i], x[3*i+1]-tg[3*i+1], x[3*i+2]-tg[3*i+2]));
    ds.sort((a, b) => a - b);
    swing = ds[Math.floor(ds.length * 0.9)];        // the swing of the skirt's lower part, not one stray point
    const wj = walkers[0].jit.sort((a, b) => a - b);
    const p99 = a => { a.sort((x, y) => x - y); return a[Math.floor(a.length * 0.99)] || 0; };
    const J = {}; for (const k in w0.hf) { J[k + 'Walk'] = p99(w0.hf[k]); J[k + 'Still'] = Math.max(0, ...still.hf[k]); J[k + 'N'] = w0[k].length; }
    // T1 (pass cloth-designer1): the cuffs' lag behind the forearm, the shift in frames that best lines up their motion
    // with where the arm alone would carry them, and their coherence with it at no shift (1 for a skinned sleeve)
    const T = w0.rimTrack, sl = {};
    if (T.length > 30) {
      const V = k => T[0][0].map((_, j) => T.slice(1).map((f, t) => [0, 1, 2].map(i => f[k][j][i] - T[t][k][j][i])));
      const A = V(0), B = V(1);
      for (const s of [A, B]) for (const series of s) for (let i = 0; i < 3; i++) { const m = series.reduce((a, v) => a + v[i], 0) / series.length; for (const v of series) v[i] -= m; }
      const corr = tau => { let xy = 0, xx = 0, yy = 0; for (let j = 0; j < A.length; j++) for (let t = tau; t < A[j].length; t++) { const a = A[j][t], b = B[j][t - tau];
        xy += a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; xx += a[0] ** 2 + a[1] ** 2 + a[2] ** 2; yy += b[0] ** 2 + b[1] ** 2 + b[2] ** 2; } return xy / Math.sqrt(xx * yy || 1); };
      let lag = 0, best = -2; for (let tau = 0; tau <= 20; tau++) { const c = corr(tau); if (c > best) { best = c; lag = tau; } }
      sl.lag = lag; sl.coherence = corr(0);
    }
    window.__done = { sl, J, beltStill: Math.max(0, ...still.jit), beltWalk: wj[Math.floor(wj.length * 0.99)], beltN: still.belt.length, unit: w0.cloth.unit, grav: w0.cloth.cloth.o.gravity, costs, bad, swing, particles: c.P, free: c.nfree, verts: w0.mesh.geometry.attributes.position.count };
    return;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})().catch(e => { window.__done = { error: String(e && e.stack || e) }; });
</script></body></html>`;

const server = http.createServer((req, res) => {
  const u = req.url.split('?')[0];
  let f = null, type = 'application/octet-stream';
  if (u === '/') { res.writeHead(200, { 'content-type': 'text/html' }); res.end(page); return; }
  if (u === '/three.min.js') { f = join(NM, 'three/build/three.min.js'); type = 'text/javascript'; }
  if (u === '/GLTFLoader.js') { f = join(NM, 'three/examples/js/loaders/GLTFLoader.js'); type = 'text/javascript'; }
  if (u === '/cloth.js') { f = CLOTH; type = 'text/javascript'; }
  if (u.startsWith('/glb/')) { f = join(DIR, u.slice(5)); type = 'model/gltf-binary'; }
  if (!f || !existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': type });
  res.end(readFileSync(f));
});
await new Promise(ok => server.listen(0, ok));
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const tab = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
tab.on('pageerror', e => errors.push(String(e)));
await tab.goto(`http://localhost:${server.address().port}/`);
await tab.waitForFunction(() => window.__done, null, { timeout: 120000 });
const done = await tab.evaluate(() => window.__done);
if (process.env.J5_SHOT) writeFileSync(process.env.J5_SHOT, await tab.screenshot());
await browser.close();
server.close();
if (done.error) errors.push(done.error);
const c = (done.costs || []).slice(10).sort((a, b) => a - b), med = c[c.length >> 1], p95 = c[Math.floor(c.length * 0.95)];
const perFigure = med / FIGURES;
console.log(JSON.stringify({
  figures: FIGURES, frames: c.length, median_ms: +(med || 0).toFixed(2), p95_ms: +(p95 || 0).toFixed(2),
  per_figure_ms: +(perFigure || 0).toFixed(2), unit: done.unit, gravity: done.grav, particles: done.particles, free: done.free, verts: done.verts,
  not_numbers: done.bad, skirt_swing_m: +(done.swing || 0).toFixed(3), belt_points: done.beltN,
  belt_jitter_mm: +(done.beltStill || 0).toFixed(3), belt_walk_jitter_mm: +(done.beltWalk || 0).toFixed(3),
  sleeve_lag_frames: done.sl && done.sl.lag, sleeve_coherence: done.sl && done.sl.coherence !== undefined ? +done.sl.coherence.toFixed(3) : null,
  jitter_mm: Object.fromEntries(Object.entries(done.J || {}).map(([k, v]) => [k, +v.toFixed(3)])), errors,
  // round 7: the cuffs, the ankle ties, the hem's edge and its fold, walking (p99) and standing (largest), in mm
  pass: !errors.length && done.bad === 0 && done.swing > 0.02 && perFigure < 2.5 && done.beltN > 0 && done.beltStill < 0.2 && done.beltWalk < 10 &&
    Object.entries(LIMITS).every(([k, [walk, still]]) => done.J[k + 'N'] > 0 && done.J[k + 'Walk'] < walk && done.J[k + 'Still'] < still),
}));
