// A side-by-side clip of two robes on the walking figure, in the game's own setting (headless Chromium, three.js r128,
// cloth.js through CaveCloth.attach, as j5_cloth.mjs runs it): the left figure with cloth options A, the right with
// options B, walking forward together for WALK seconds, then easing to a stop and standing for STAND more, so the
// clip shows the swing after the arm stops. Game time is a fixed 1/60 s a frame; every frame is saved as a picture,
// and ffmpeg makes the clip at full speed and at a third of it.
//   J5_DIR=$W/j5 OUT=$W/clip A='{"springs":false}' B='{}' LABELS='round 10|round 11' node j5_clip.mjs
// J5_DIR_B, another garments.py --out folder: the right figure wears its robe instead (round 12's re-cut sleeves
// against round 11's, each with the same cloth.js)
// (run from a folder whose node_modules has three@0.128.0 and playwright, as test_net.py's cave-test does)
import http from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const DIR = process.env.J5_DIR, OUT = process.env.OUT, BUILD = process.env.J5_BUILD || 'average';
const A = process.env.A || '{"springs":false}', B = process.env.B || '{}';
const [LA, LB] = (process.env.LABELS || 'round 10|round 11').split('|');
const WALK = +(process.env.WALK || 4), STAND = +(process.env.STAND || 2), W = +(process.env.WIDTH || 960), H = +(process.env.HEIGHT || 540);
const VIEW = process.env.VIEW || 'side';          // side: from the figures' left; front: three quarters in front
const DIST = +(process.env.DIST || 3.6), LOOK_Y = +(process.env.LOOK_Y || 0.95);   // the camera's distance, and the height it looks at
const NM = new URL('./node_modules/', import.meta.url).pathname;
const CLOTH = process.env.CLOTH_JS || join(dirname(fileURLToPath(import.meta.url)), 'cloth.js');
const report = JSON.parse(readFileSync(join(DIR, 'report.json'), 'utf8'));
const figure = report.figures.find(f => f.build === BUILD && f.palette === 'dusk').file;
const robe = report.garments.find(g => g.build === BUILD && g.palette === 'dusk' && g.garment === 'robe').file;
const DIR_B = process.env.J5_DIR_B;
const robeB = DIR_B ? JSON.parse(readFileSync(join(DIR_B, 'report.json'), 'utf8')).garments.find(g => g.build === BUILD && g.palette === 'dusk' && g.garment === 'robe').file : robe;
mkdirSync(join(OUT, 'frames'), { recursive: true });

const page = `<!doctype html><html><body style="margin:0;background:#1d1f24;overflow:hidden">
<div style="position:fixed;top:10px;left:0;width:50%;text-align:center;color:#e8e2d0;font:600 22px system-ui">${LA}</div>
<div style="position:fixed;top:10px;left:50%;width:50%;text-align:center;color:#e8e2d0;font:600 22px system-ui">${LB}</div>
<script src="/three.min.js"></script>
<script src="/cloth.js"></script>
<script src="/GLTFLoader.js"></script>
<script>
(async () => {
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setScissorTest(true);
document.body.appendChild(renderer.domElement);
const loader = new THREE.GLTFLoader();
const parse = buf => new Promise((ok, no) => loader.parse(buf, '', ok, no));
const figBuf = await (await fetch('/glb/${figure}')).arrayBuffer(), robeBuf = await (await fetch('/glb/${robe}')).arrayBuffer();
const robeBufs = [robeBuf, ${DIR_B ? "await (await fetch('/glbB/" + robeB + "')).arrayBuffer()" : 'robeBuf'}];
const sides = [];
for (const [si, opts] of [${A}, ${B}].entries()) {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x333333, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(-3, 4, 2); scene.add(sun);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshLambertMaterial({ color: 0x3a3d44 }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const grid = new THREE.GridHelper(200, 400, 0x555a63, 0x4a4e56); grid.position.y = 0.002; scene.add(grid);
  const fig = await parse(figBuf.slice(0));
  const root = new THREE.Group(); root.add(fig.scene); scene.add(root);
  const mixer = new THREE.AnimationMixer(fig.scene), act = mixer.clipAction(fig.animations[0]); act.play();
  const bones = {}; fig.scene.traverse(o => { if (o.isBone) bones[o.name] = o; });
  const g = await parse(robeBufs[si].slice(0));
  let mesh; g.scene.traverse(o => { if (o.isSkinnedMesh) mesh = o; });
  mesh.bind(new THREE.Skeleton(mesh.skeleton.bones.map(b => bones[b.name]), mesh.skeleton.boneInverses), mesh.bindMatrix);
  fig.scene.add(mesh);
  root.updateMatrixWorld(true);
  const cloth = CaveCloth.attach(THREE, mesh, { options: opts });
  cloth.reset();
  const cam = new THREE.PerspectiveCamera(30, (innerWidth / 2) / innerHeight, 0.1, 80);
  sides.push({ scene, root, mixer, act, cloth, cam });
}
const SPEED = 1.36, FR = ${Math.round((WALK + STAND) * 60)};
let n = 0, speed = 1;
window.__frame = () => {
  const t = n / 60, dt = 1 / 60;
  // the walk eases out over 0.4 s at WALK seconds, and the figure stands
  speed = t < ${WALK} ? 1 : Math.max(0, 1 - (t - ${WALK}) / 0.4);
  for (const s of sides) {
    s.act.setEffectiveWeight(speed * speed * (3 - 2 * speed));
    s.mixer.update(dt * Math.max(speed, 0.0001));
    s.root.translateZ(SPEED * speed * dt);
    s.scene.updateMatrixWorld(true);
    s.cloth.update(dt);
    const p = s.root.position;
    if ('${VIEW}' === 'front') s.cam.position.set(p.x + 0.55 * ${DIST}, 1.15, p.z + 0.85 * ${DIST});
    else s.cam.position.set(p.x + ${DIST}, 1.1, p.z + 0.1);
    s.cam.lookAt(p.x, ${LOOK_Y}, p.z);
  }
  const w = innerWidth / 2, h = innerHeight;
  sides.forEach((s, i) => { renderer.setViewport(i * w, 0, w, h); renderer.setScissor(i * w, 0, w, h); renderer.render(s.scene, s.cam); });
  n++;
  return n < FR;
};
window.__ready = true;
})().catch(e => { window.__error = String(e && e.stack || e); });
</script></body></html>`;

const server = http.createServer((req, res) => {
  const u = req.url.split('?')[0];
  let f = null, type = 'application/octet-stream';
  if (u === '/') { res.writeHead(200, { 'content-type': 'text/html' }); res.end(page); return; }
  if (u === '/three.min.js') { f = join(NM, 'three/build/three.min.js'); type = 'text/javascript'; }
  if (u === '/GLTFLoader.js') { f = join(NM, 'three/examples/js/loaders/GLTFLoader.js'); type = 'text/javascript'; }
  if (u === '/cloth.js') { f = CLOTH; type = 'text/javascript'; }
  if (u.startsWith('/glb/')) { f = join(DIR, u.slice(5)); type = 'model/gltf-binary'; }
  if (u.startsWith('/glbB/')) { f = join(DIR_B, u.slice(6)); type = 'model/gltf-binary'; }
  if (!f || !existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': type });
  res.end(readFileSync(f));
});
await new Promise(ok => server.listen(0, ok));
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const tab = await browser.newPage({ viewport: { width: W, height: H } });
await tab.goto(`http://localhost:${server.address().port}/`);
await tab.waitForFunction(() => window.__ready || window.__error, null, { timeout: 120000 });
const err = await tab.evaluate(() => window.__error);
if (err) throw new Error(err);
let k = 0;
for (;;) {
  const more = await tab.evaluate(() => window.__frame());
  writeFileSync(join(OUT, 'frames', `f${String(k++).padStart(4, '0')}.jpg`), await tab.screenshot({ type: 'jpeg', quality: 88 }));
  if (!more) break;
}
await browser.close();
server.close();
const ff = (rate, name) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(rate), '-i', join(OUT, 'frames', 'f%04d.jpg'),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-crf', '23', '-r', '60', join(OUT, name)]);
ff(60, 'clip.mp4'); ff(20, 'clip-slow.mp4');
console.log(JSON.stringify({ frames: k, out: OUT }));
