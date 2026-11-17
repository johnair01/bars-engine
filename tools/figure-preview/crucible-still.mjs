#!/usr/bin/env node
/* Preview stills of an exported figure GLB, drawn by Crucible's script recipe (docs/guide.md, "Render a PNG from a
   script without MCP"). This is a check that runs after Blender exports and before the file enters the three.js
   runtime. It is not a tool server, loads no MCP schema and touches no runtime page. Nothing leaves the machine.

   Setup (once):  cd tools/figure-preview && npm install        (Crucible 0.20.0, pinned)
   Run:           node tools/figure-preview/crucible-still.mjs figure.glb --out stills/
   Options:       --cams front,side,three-quarter,back   (default front,side)
                  --size 786x1100                        (default; Crucible draws 1.5x, this resizes nothing, it asks the canvas)
                  --time 0.5 --clip 0                    (sample a clip; default none)
                  --lights studio|glb                    (studio = Crucible's own; glb = the point lights the file carries,
                                                          which is how the game's hearth reaches the preview)
                  --chrome /path/to/chromium             (default: CHROME env, /opt/pw-browsers/chromium, else channel chrome)
   Prints, per still: path and sha256. Then every import warning. Exit 1 if the file does not import. */
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), opt = {}, pos = [];
for (let i = 0; i < args.length; i++) { if (args[i].startsWith('--')) opt[args[i].slice(2)] = args[++i]; else pos.push(args[i]); }
if (!pos[0]) { console.error('usage: crucible-still.mjs <figure.glb> --out <dir> [--cams front,side] [--size 786x1100] [--time T --clip N] [--lights studio|glb]'); process.exit(2); }
const [W, H] = (opt.size || '786x1100').split('x').map(Number), cams = (opt.cams || 'front,side').split(',');
const out = opt.out || 'stills', name = path.basename(pos[0], path.extname(pos[0]));
const lights = opt.lights || 'studio', time = opt.time === undefined ? null : +opt.time, clip = +(opt.clip || 0);
const crucibleDir = ['node_modules/crucible', '../../node_modules/crucible'].map(d => path.join(HERE, d)).find(d => existsSync(d));
if (!crucibleDir) { console.error('Crucible is not installed: run `npm install` in tools/figure-preview'); process.exit(2); }
const glb = await readFile(pos[0]);

const page = `<!doctype html>
<script type="importmap">{ "imports": { "crucible": "/crucible/build/67.module.js", "crucible/addons/gltf": "/crucible/build/gltf.js" } }</script>
<canvas width="${W}" height="${H}"></canvas>
<script type="module">
import { CrucibleRenderer } from 'crucible';
import { parseGltf } from 'crucible/addons/gltf';
try {
  const buf = await (await fetch('/figure.glb')).arrayBuffer(), asset = await parseGltf(buf);
  if (${time} !== null && asset.animations.length) asset.applyAnimation(${time}, ${clip});
  const canvas = document.querySelector('canvas'), P = asset.parts;
  // bounds from the part matrices (column-major, world transform included)
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (const p of P) { const m = p.matrix, a = p.geometry.positions, st = Math.max(1, Math.floor(a.length / 3 / 400));
    for (let i = 0; i < a.length; i += 3 * st) { const x = a[i], y = a[i + 1], z = a[i + 2];
      const w = [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
      for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], w[k]); hi[k] = Math.max(hi[k], w[k]); } } }
  const c = lo.map((v, k) => (v + hi[k]) / 2), r = Math.max(hi[1] - lo[1], hi[0] - lo[0]) * 0.5 + 0.05;
  const d = r / Math.tan(0.5 * 35 * Math.PI / 180) * 0.85;
  const env = ${JSON.stringify(lights)} === 'glb' ? await (await fetch('/lights.json')).json() : {};
  const renderer = new CrucibleRenderer(canvas, P, { ground: false, samples: 4, memoryBudgetMiB: 512, environment: env.environment });
  const dir = { front: [0, 0, 1], side: [1, 0, 0], back: [0, 0, -1], 'three-quarter': [0.7, 0.1, 0.7] };
  window.shots = {};
  for (const cam of ${JSON.stringify(cams)}) { const v = dir[cam]; renderer.render({ eye: [c[0] + v[0] * d, c[1] + v[1] * d, c[2] + v[2] * d], target: c, fov: 35 }); window.shots[cam] = canvas.toDataURL('image/png'); }
  window.warnings = asset.warnings || []; window.stats = { parts: P.length, clips: asset.animations.length, size: [canvas.width, canvas.height] };
  window.done = true;
} catch (e) { window.failed = e.message + '\\n' + e.stack; }
</script>`;

// The point lights a GLB carries (KHR_lights_punctual), as Crucible environment lights in world space.
function glbLights(buf) {
  const jl = buf.readUInt32LE(12), j = JSON.parse(buf.subarray(20, 20 + jl).toString()), L = j.extensions?.KHR_lights_punctual?.lights || [];
  const parent = {}; (j.nodes || []).forEach((n, i) => (n.children || []).forEach(c => parent[c] = i));
  const world = i => { let p = [0, 0, 0]; for (let n = i; n !== undefined; n = parent[n]) { const t = j.nodes[n].translation || [0, 0, 0], s = j.nodes[n].scale || [1, 1, 1]; p = [p[0] * s[0] + t[0], p[1] * s[1] + t[1], p[2] * s[2] + t[2]]; } return p; }; // translation and scale only; enough for the hearth and desk lamps
  const pointLights = [];
  (j.nodes || []).forEach((n, i) => { const id = n.extensions?.KHR_lights_punctual?.light; if (id === undefined) return; const l = L[id];
    if (l.type === 'point') pointLights.push({ position: world(i), color: l.color || [1, 1, 1], intensity: l.intensity, range: l.range || 0 }); });
  return { environment: { keyIntensity: 0.3, fillIntensity: 0.3, ambientIntensity: 0.25, pointLights } };
}

const server = createServer(async (rq, rs) => {
  try {
    if (rq.url === '/') return rs.writeHead(200, { 'Content-Type': 'text/html' }).end(page);
    if (rq.url === '/figure.glb') return rs.writeHead(200, { 'Content-Type': 'model/gltf-binary' }).end(glb);
    if (rq.url === '/lights.json') return rs.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(glbLights(glb)));
    if (rq.url.startsWith('/crucible/')) return rs.writeHead(200, { 'Content-Type': 'text/javascript' }).end(await readFile(path.join(crucibleDir, rq.url.slice(10))));
    rs.writeHead(404).end();
  } catch { rs.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const exe = opt.chrome || process.env.CHROME || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : null);
const browser = await chromium.launch(exe ? { executablePath: exe, args: ['--no-sandbox'] } : { channel: 'chrome' });
let code = 0;
try {
  const tab = await browser.newPage();
  tab.on('console', m => { if (m.type() === 'error') console.error('page:', m.text()); });
  await tab.goto(`http://127.0.0.1:${server.address().port}/`);
  await tab.waitForFunction(() => window.done || window.failed, null, { timeout: 180000 });
  const failed = await tab.evaluate(() => window.failed);
  if (failed) throw new Error(failed);
  const shots = await tab.evaluate(() => window.shots), warnings = await tab.evaluate(() => window.warnings), stats = await tab.evaluate(() => window.stats);
  await mkdir(out, { recursive: true });
  for (const [cam, url] of Object.entries(shots)) {
    const png = Buffer.from(url.split(',')[1], 'base64'), file = path.join(out, `${name}-${cam}.png`);
    await writeFile(file, png); console.log(`${file}  ${createHash('sha256').update(png).digest('hex').slice(0, 16)}`);
  }
  console.log(`parts ${stats.parts}, clips ${stats.clips}, canvas ${stats.size.join('x')}, lights ${lights}`);
  console.log(warnings.length ? 'import warnings:\n  ' + warnings.join('\n  ') : 'import warnings: none');
} catch (e) { console.error(e.message); code = 1; }
await browser.close(); server.close(); process.exit(code);
