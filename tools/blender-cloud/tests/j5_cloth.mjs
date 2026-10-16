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
//   J5_DIR=$W/j5 FIGURES=4 node j5_cloth.mjs        (prints one JSON line; J5_SHOT=path saves a picture)
import http from 'node:http';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

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
  const cloth = CaveCloth.attach(THREE, mesh, {});
  cloth.reset();
  // the belt row: free points within 6 cm (in the robe's height) of the highest free point
  const c = cloth.cloth, rp = mesh.geometry.attributes.position, up = [];
  for (let p = 0; p < c.P; p++) if (c.free[p]) up.push([p, rp.getY(c.reps[p])]);
  const top = Math.max(...up.map(q => q[1])), belt = up.filter(q => q[1] > top - 0.06).map(q => q[0]);
  walkers.push({ root, mixer, cloth, mesh, still: n === ${FIGURES}, belt, hist: [], jit: [] });
}
const still = walkers.pop(); still.root.position.set(0, 0, -3); walkers.push(still);
const SPEED = 1.36;                                  // m/s: character.py's stride at two steps a second
const costs = [], t0 = performance.now();
let last = t0, bad = 0, swing = 0, nf = 0;
cam.position.set(4.5, 1.3, 2.0);
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
    window.__done = { beltStill: Math.max(0, ...still.jit), beltWalk: wj[Math.floor(wj.length * 0.99)], beltN: still.belt.length, unit: w0.cloth.unit, grav: w0.cloth.cloth.o.gravity, costs, bad, swing, particles: c.P, free: c.nfree, verts: w0.mesh.geometry.attributes.position.count };
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
  belt_jitter_mm: +(done.beltStill || 0).toFixed(3), belt_walk_jitter_mm: +(done.beltWalk || 0).toFixed(3), errors,
  pass: !errors.length && done.bad === 0 && done.swing > 0.02 && perFigure < 2.5 && done.beltN > 0 && done.beltStill < 0.2 && done.beltWalk < 10,
}));
