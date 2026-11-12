#!/usr/bin/env node
/* The frame half of the look gate: board row bld-gate-home-2, answered `a` on 2026-11-10, "a headless browser shot
   compared against the dataset on every push to public/between".

   What it does. Serves public/ as it is, opens a page in headless chromium that builds the hollow from hollow.js with
   the painterly shader installed, renders one still of the hearth, and then reads the values the frame was made with:
   the ramp the shader carries and every point light in the scene. Those are compared to the look dataset
   (public/between/look-data.js, hash 3d9fc55402a2) and the still is written beside them.

   The numbers are the gate and the still is the evidence.
   Tolerance, stated once here and printed on a pass:
     - a light's colour must equal its budget hex exactly;
     - its intensity, distance and decay must agree with the budget to within 0.005;
     - each ramp colour must equal its stop's hex exactly, and each stop must agree to within 1e-6.
   A budget light the scene does not build, or any drift past those numbers, is a finding and exit 1.

   Run:  node scripts/check-look-frame.mjs
         OUT=<dir>         where the still goes (default .local-dev/look)
         SIZE=1280x720     the still's size
         THREE_BASE=<url>  where the bare "three" specifier resolves (default: the CDN the page itself uses)
         LD_LIBRARY_PATH   if chromium cannot find libnspr4 and friends on this machine, put them there

   It needs Playwright with chromium. Without either it exits 2 and says so, so a session with no browser skips this
   check and runs the rest (docs/LOCAL_FIRST_TESTING.md). Exit 2 is never a pass claim.
*/
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const ROOT = path.resolve(import.meta.dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const OUT = path.resolve(process.env.OUT || path.join(ROOT, '.local-dev', 'look'))
const [W, H] = (process.env.SIZE || '1280x720').split('x').map(Number)
const THREE_BASE = process.env.THREE_BASE || 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/'
const TOLERANCE = { number: 0.005, stop: 1e-6 }

const skip = why => { console.error(`look frame check skipped: ${why}`); process.exit(2) }

/* Playwright: this repo's node_modules, a global install, or $HOME/pw (the way a cloud session installs it). */
const require = createRequire(import.meta.url)
let chromium
for (const from of [() => require('playwright'), () => createRequire('/')('playwright'), () => createRequire(path.join(process.env.HOME || '/', 'pw', 'x.js'))('playwright'), () => require(path.join(process.env.HOME || '/', 'pw', 'node_modules', 'playwright'))]) {
  try { ({ chromium } = from()); break } catch {}
}
if (!chromium) skip('Playwright is not installed here; `npm i -D playwright && npx playwright install chromium` installs it')
/* --available answers one question for scripts/local/check.sh: is there a browser here at all? Exit 0 when there is. */
if (process.argv.includes('--available')) { console.log('a browser is available here'); process.exit(0) }

const { LOOK, LOOK_HASH } = await import(path.join(PUBLIC, 'between', 'look-data.js'))
const BUDGET = ['lantern', 'crystals', 'hearth']
const BUDGET_LIGHT = {
  lantern: LOOK.budget.shells.hollow.lights.find(l => l.light === 'the two paper lanterns'),
  crystals: LOOK.budget.shells.hollow.lights.find(l => l.light === "the stream's crystals"),
  hearth: LOOK.budget.shells.hollow.lights.find(l => l.light === 'the hearth fire'),
}

/* One scene, built the way garden.js builds it: the paint installed before anything renders, then the hollow. */
const HARNESS = `<!doctype html><html><head><meta charset="utf-8">
<script type="importmap">{ "imports": {
  "three": "${THREE_BASE}three.module.js",
  "three/addons/": "${THREE_BASE.replace(/\/build\/$/, '/examples/jsm/')}"
} }</script></head>
<body style="margin:0;background:#1d1007"><script type="module" src="/__look-frame.js"></script></body></html>`

const SCENE = `
import * as THREE from "three";
import { installPaint, paint } from "/between/paint.js";
import { buildHollow, HEARTH } from "/between/hollow.js";

installPaint();
const W = ${W}, H = ${H};
const scene = new THREE.Scene();
scene.background = new THREE.Color("#1d1007");
const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 60);
camera.position.set(HEARTH.x * 0.1, 1.75, HEARTH.z * 0.1);
camera.lookAt(HEARTH.x * 0.82, 0.85, HEARTH.z * 0.82);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;      // as garden.js sets it (line 321)
renderer.toneMapping = THREE.ACESFilmicToneMapping;    // and line 322
renderer.toneMappingExposure = 1.05;                   // and line 323
document.body.appendChild(renderer.domElement);
const room = buildHollow(scene, {});
renderer.render(scene, camera);                        // the still, and the frame the values belong to
renderer.render(scene, camera);
const lights = [];
scene.traverse(o => {
  if (!o.isPointLight) return;
  const p = o.getWorldPosition(new THREE.Vector3());
  lights.push({ colour: "#" + o.color.getHexString(), intensity: o.intensity, distance: o.distance, decay: o.decay,
                at: [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2)] });
});
window.__lookFrame = {
  lights,
  ramp: paint.uRamp.value.map(c => "#" + c.getHexString()),
  stops: Array.from(paint.uStops.value),
  canvas: [renderer.domElement.width, renderer.domElement.height],
};
document.title = "look frame ready";
`

const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary' }
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1')
  if (url.pathname === '/__look-frame.html') { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(HARNESS) }
  if (url.pathname === '/__look-frame.js') { res.writeHead(200, { 'Content-Type': 'text/javascript' }); return res.end(SCENE) }
  const file = path.join(PUBLIC, decodeURIComponent(url.pathname))
  if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found') }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
})
await new Promise(ok => server.listen(0, '127.0.0.1', ok))
const origin = `http://127.0.0.1:${server.address().port}`

let browser
try {
  try { browser = await chromium.launch() } catch (e) {
    if (!/libnspr4|libnss3|shared libraries/.test(String(e.message))) throw e
    skip('chromium cannot load its shared libraries here; run `npx playwright install-deps chromium` as root, or put the missing libraries on LD_LIBRARY_PATH')
  }
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
  const errors = []
  page.on('pageerror', e => errors.push(String(e).split('\n')[0]))
  await page.goto(`${origin}/__look-frame.html`, { waitUntil: 'load', timeout: 120_000 })
  await page.waitForFunction(() => window.__lookFrame, null, { timeout: 120_000 }).catch(() => {})

  const frame = await page.evaluate(() => window.__lookFrame || null)
  if (!frame) {
    console.error('look frame check: the scene did not build')
    for (const e of errors) console.error(`  page error: ${e}`)
    process.exit(1)
  }

  fs.mkdirSync(OUT, { recursive: true })
  const still = path.join(OUT, 'hearth.png')
  await page.screenshot({ path: still })

  const findings = []
  const close = (a, b, tol) => Math.abs(Number(a) - Number(b)) <= tol

  for (const name of BUDGET) {
    const want = BUDGET_LIGHT[name]
    const got = frame.lights.find(l => l.colour.toLowerCase() === want.colour.toLowerCase())
    if (!got) {
      const near = frame.lights.map(l => `${l.colour} ${l.intensity}/${l.distance}/${l.decay}`).join(', ') || 'none'
      findings.push(`no point light in the frame carries ${want.colour} (LIGHT.${name}); the frame has ${near}`)
      continue
    }
    for (const k of ['intensity', 'distance', 'decay']) {
      if (!close(got[k], want[k], TOLERANCE.number)) findings.push(`LIGHT.${name}.${k} is ${got[k]} in the frame, the dataset says ${want[k]} (tolerance ${TOLERANCE.number})`)
    }
  }

  const ramp = LOOK.ramp.colours
  if (frame.ramp.length !== ramp.length) findings.push(`the shader carries ${frame.ramp.length} ramp colours, the dataset holds ${ramp.length}`)
  ramp.forEach((want, i) => {
    const got = frame.ramp[i]
    if (!got || got.toLowerCase() !== want.toLowerCase()) findings.push(`ramp colour ${i} is ${got}, the dataset says ${want}`)
  })
  LOOK.ramp.stops.forEach((want, i) => {
    const got = frame.stops[i]
    if (got === undefined || !close(got, want, TOLERANCE.stop)) findings.push(`ramp stop ${i} is ${got}, the dataset says ${want} (tolerance ${TOLERANCE.stop})`)
  })

  console.log(`frame: ${frame.canvas[0]}x${frame.canvas[1]}, ${frame.lights.length} point light(s) in the scene`)
  for (const l of frame.lights) console.log(`  light ${l.colour} ${l.intensity}/${l.distance}/${l.decay} at ${l.at.join(',')}`)
  console.log(`  ramp ${frame.ramp.join(' ')} at stops ${frame.stops.join(' ')}`)
  console.log(`  still ${path.relative(ROOT, still)}`)
  if (errors.length) for (const e of errors) console.log(`  page error: ${e}`)

  if (findings.length) {
    console.error(`\n${findings.length} look drift(s) in the frame; the look hash is ${LOOK_HASH}.`)
    for (const f of findings) console.error(`  ${f}`)
    process.exit(1)
  }
  console.log(`\nthe frame reads the look dataset; look hash ${LOOK_HASH}. Tolerance: colour exact, numbers within ${TOLERANCE.number}, stops within ${TOLERANCE.stop}.`)
} finally {
  if (browser) await browser.close()
  server.close()
}
