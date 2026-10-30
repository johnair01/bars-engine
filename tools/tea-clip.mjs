/* A clip of the drink on the page itself, frame by frame (round 5 of the Between tea, for the side by side with round 4): sits
   you at the hearth with ?tea=pour (and &drink=r4 for round 4's drink), holds the drink at each moment from --from to --to
   seconds every --dt (tea.freeze), and shoots it from the page's own tea view (--cam front: the camera comes round to your
   front-left while you hold the cup) or from your right, level with your face (--cam side). Writes <out>/000.jpg, 001.jpg ...
   Cut from the research round's make/clip.mjs (six-faces-council stills/2026-10-29-tea-drink-research). Same server as
   tools/tea-stills.mjs.
     node tools/tea-clip.mjs --out DIR [--drink r4] [--cam front|side] [--from 7.6] [--to 15.4] [--dt 0.2] [--vp 390x844] */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');   // pre-installed globally in the cloud containers, so not an import
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = path.join(__dirname, '..', 'public'), OUT = arg('--out', '.'), R4 = arg('--drink', 'r5') === 'r4', CAM = arg('--cam', 'front');
const [VW, VH] = arg('--vp', '390x844').split('x').map(Number);
const T0 = +arg('--from', '7.6'), T1 = +arg('--to', '15.4'), DT = +arg('--dt', '0.2');
const route = fs.readFileSync(path.join(__dirname, '..', 'src/app/ontology-game/between/route.ts'), 'utf8');
const PAGE = route.slice(route.indexOf('const PAGE = `') + 14, route.indexOf('`', route.indexOf('const PAGE = `') + 14));
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.glb': 'model/gltf-binary', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/api/')) { res.writeHead(503, { 'content-type': 'application/json' }); return res.end('{"error":"clip: no store"}'); }
  if (u.pathname === '/ontology-game/between') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PAGE); }
  const f = path.join(ROOT, path.normalize(u.pathname));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
(async () => {
  await new Promise(a => server.listen(0, a)); const port = server.address().port;
  const b = await chromium.launch(); fs.mkdirSync(OUT, { recursive: true });
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 }); const p = await ctx.newPage();
  p.on('pageerror', e => console.error('PAGEERR', e.message));
  await p.goto(`http://localhost:${port}/ontology-game/between?nook=1&sit=hearth&tea=pour${R4 ? '&drink=r4' : ''}`);
  await p.waitForFunction(() => window.__between && window.__between.meState.body && document.getElementById('loading').hidden, null, { timeout: 180000 });
  await p.waitForFunction(() => { const t = window.__between.tea(); return t && t.holding() && t.state(); }, null, { timeout: 240000 });
  let n = 0;
  for (let sec = T0; sec <= T1 + 1e-6; sec += DT, n++) {
    await p.evaluate(s => window.__between.tea().freeze(s), sec);
    if (n === 0) {
      await p.evaluate(side => { const B = window.__between;
        if (!side) return B.setCam(null);
        const h = B.meState.body.holder, y = h.rotation.y, c = h.getWorldPosition(h.position.clone());
        const fx = Math.sin(y), fz = Math.cos(y), rx = -fz, rz = fx;   // the figure's right, level with the face
        B.setCam([c.x + rx * 0.85 + fx * 0.25, c.y + 0.72, c.z + rz * 0.85 + fz * 0.25, c.x + fx * 0.15, c.y + 0.6, c.z + fz * 0.15]); }, CAM === 'side');
      await p.waitForTimeout(9000);
    }
    await p.waitForTimeout(1800);
    await p.screenshot({ path: path.join(OUT, String(n).padStart(3, '0') + '.jpg'), quality: 85 });
  }
  console.log('frames', n, R4 ? 'r4' : 'r5', CAM);
  await b.close(); server.close();
})();
