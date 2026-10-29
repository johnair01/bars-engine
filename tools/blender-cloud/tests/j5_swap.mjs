// J5(c): swapping a garment on the walking figure in headless Chromium. The page loads one figure (character.py), plays
// its Walk, loads the wardrobe (garments.py's GLBs, each parsed and bound to the figure's own bones by name, and
// drawn once), then every 400 ms takes off the garment worn and puts on the next. It times each swap and every frame's
// gap, for 24 swaps. Pass: every swap under 100 ms and no
// frame gap over 1000/30 ms. Run from a folder with playwright and three@0.128.0 installed:
//   J5_DIR=$W/j5 node j5_swap.mjs        (prints one JSON line)
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const DIR = process.env.J5_DIR;
const NM = new URL('./node_modules/', import.meta.url).pathname;
const BUILD = process.env.J5_BUILD || 'average';
const report = JSON.parse(readFileSync(join(DIR, 'report.json'), 'utf8'));
const figure = report.figures.find(f => f.build === BUILD && f.palette === 'dusk').file;
const garments = report.garments.filter(g => g.build === BUILD).map(g => g.file);

const page = `<!doctype html><html><body style="margin:0;background:#222">
<script type="importmap">{"imports": {"three": "/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from '/three/examples/jsm/loaders/GLTFLoader.js';
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x333333, 1.2));
const cam = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 50);
cam.position.set(0, 1.0, 3.2);
const loader = new GLTFLoader();
const parse = buf => new Promise((ok, no) => loader.parse(buf, '', ok, no));
const fig = await parse(await (await fetch('/glb/${figure}')).arrayBuffer());
scene.add(fig.scene);
const mixer = new THREE.AnimationMixer(fig.scene);
mixer.clipAction(fig.animations[0]).play();
const bones = {};
fig.scene.traverse(o => { if (o.isBone) bones[o.name] = o; });
const bytes = await Promise.all(${JSON.stringify(garments)}.map(async f => (await fetch('/glb/' + f)).arrayBuffer()));
// as the game would on loading the wardrobe: each garment parsed, bound to the figure's own bones by name (with the
// garment's own inverse binds) and drawn once, so its shader is compiled and its buffers are on the graphics chip
function bind(g) {
  const meshes = [];
  g.scene.traverse(o => { if (o.isSkinnedMesh) meshes.push(o); });
  for (const m of meshes) m.bind(new THREE.Skeleton(m.skeleton.bones.map(b => bones[b.name]), m.skeleton.boneInverses), m.bindMatrix);
  return meshes;
}
const t_load = performance.now();
const wardrobe = [];
for (const buf of bytes) {
  const meshes = bind(await parse(buf));
  for (const m of meshes) fig.scene.add(m);
  renderer.render(scene, cam);
  for (const m of meshes) fig.scene.remove(m);
  wardrobe.push(meshes);
}
const loadMs = performance.now() - t_load;
// a swap: take off what is worn, put on the next garment
function wear(meshes) { for (const m of meshes) fig.scene.add(m); return meshes; }
// two seconds of walking with nothing swapped first, so a slow machine's own frame rate is told apart from the swaps'
const gaps = [], swaps = [], swapFrames = [];
let last = performance.now(), worn = [], n = 0, next = last + 2000;
const clock = new THREE.Clock();
function frame(now) {
  gaps.push(now - last); last = now;
  mixer.update(clock.getDelta());
  if (now >= next && n < 24) {
    next = now + 400;
    const t0 = performance.now();
    for (const m of worn) fig.scene.remove(m);
    worn = wear(wardrobe[n % wardrobe.length]);
    swaps.push(performance.now() - t0);
    swapFrames.push(gaps.length);              // the gap after this frame carries the swap
    n++;
  }
  renderer.render(scene, cam);
  if (n < 24 || now < next) requestAnimationFrame(frame);
  else window.__done = { swaps, gaps, swapFrames, worn: worn.length, loadMs };
}
requestAnimationFrame(frame);
</script></body></html>`;

const server = http.createServer((req, res) => {
  const u = req.url.split('?')[0];
  let f = null, type = 'application/octet-stream';
  if (u === '/') { res.writeHead(200, { 'content-type': 'text/html' }); res.end(page); return; }
  if (u.startsWith('/three/')) { f = join(NM, u.slice(1)); type = 'text/javascript'; }
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
await browser.close();
server.close();
// frames before the first swap (less the first five, which load the page) are the baseline; the frame after each
// swap is the swap's
const first = done.swapFrames[0];
const base = done.gaps.slice(5, first), after = done.swapFrames.map(i => done.gaps[i]).filter(x => x !== undefined);
const worstGap = Math.max(...done.gaps.slice(5)), worstSwap = Math.max(...done.swaps);
const med = a => [...a].sort((x, y) => x - y)[a.length >> 1];
console.log(JSON.stringify({
  build: BUILD, garments: garments.length, swaps: done.swaps.length, worst_swap_ms: +worstSwap.toFixed(1),
  median_swap_ms: +med(done.swaps).toFixed(1), worst_frame_ms: +worstGap.toFixed(1), median_frame_ms: +med(done.gaps).toFixed(1),
  lowest_fps: +(1000 / worstGap).toFixed(1), errors, wardrobe_load_ms: +done.loadMs.toFixed(1),
  baseline_median_frame_ms: +med(base).toFixed(1), baseline_worst_frame_ms: +Math.max(...base).toFixed(1),
  swap_frame_median_ms: +med(after).toFixed(1), swap_frame_worst_ms: +Math.max(...after).toFixed(1),
  pass: !errors.length && worstSwap < 100 && worstGap <= 1000 / 30,
}));
