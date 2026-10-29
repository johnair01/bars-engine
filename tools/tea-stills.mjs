/* Stills of the tea at the hearth, on the page itself (public/ served with the Between's page, the store down, headless Chromium
   at a phone viewport, as tools/between-live-probe.mjs does): sits you at the hearth with ?tea=pour, holds the pour at each beat
   (tea.freeze) and shoots the view the page gives you, and with --side a second camera from your right, close, to see the cup
   in the hand and the table clear of the robe. Writes <out>/<beat>.jpg (and <beat>-side.jpg).
     node tools/tea-stills.mjs [--out DIR] [--vp 390x844] [--side] */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');   // pre-installed globally in the cloud containers, so not an import
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = path.join(__dirname, '..', 'public'), OUT = arg('--out', '.'), SIDE = process.argv.includes('--side');
const [VW, VH] = arg('--vp', '390x844').split('x').map(Number);
const BEATS = { pour: 3.6, lift: 5.9, lap: 7.6, sip: 9.3, savour: 11.6 };   // seconds into the pour (tea-pose.js TEA)
const route = fs.readFileSync(path.join(__dirname, '..', 'src/app/ontology-game/between/route.ts'), 'utf8');
const PAGE = route.slice(route.indexOf('const PAGE = `') + 14, route.indexOf('`', route.indexOf('const PAGE = `') + 14));
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.glb': 'model/gltf-binary', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/api/')) { res.writeHead(503, { 'content-type': 'application/json' }); return res.end('{"error":"stills: no store"}'); }
  if (u.pathname === '/ontology-game/between') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PAGE); }
  const f = path.join(ROOT, path.normalize(u.pathname));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
(async () => {
  await new Promise(a => server.listen(0, a)); const port = server.address().port;
  const b = await chromium.launch(); fs.mkdirSync(OUT, { recursive: true });
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 }); const p = await ctx.newPage();
  p.on('pageerror', e => console.error('PAGEERR', e.message, (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await p.goto(`http://localhost:${port}/ontology-game/between?nook=1&sit=hearth&tea=pour`);
  await p.waitForFunction(() => window.__between && window.__between.meState.body && document.getElementById('loading').hidden, null, { timeout: 180000 });
  await p.waitForFunction(() => { const t = window.__between.tea(); return t && t.holding(); }, null, { timeout: 240000 });
  for (const [beat, sec] of Object.entries(BEATS)) {
    await p.evaluate(s => { window.__between.tea().freeze(s); window.__between.setCam(null); }, sec);
    await p.waitForTimeout(9000);   // software GL draws a few frames a second: let the view ease in
    await p.screenshot({ path: path.join(OUT, beat + '.jpg'), quality: 85 });
    const st = await p.evaluate(() => window.__between.tea().state());
    console.log(beat, JSON.stringify({ phase: st && st.phase, full: st && st.full }));
    if (SIDE) {   // from the figure's right, close, level with the cup
      await p.evaluate(() => { const B = window.__between, h = B.meState.body.holder, y = h.rotation.y, c = B.tea().cup.getWorldPosition(h.position.clone());
        const fx = Math.sin(y), fz = Math.cos(y), rx = -fz, rz = fx;   // the figure's right
        B.setCam([c.x + rx * 0.9 + fx * 0.5, c.y + 0.25, c.z + rz * 0.9 + fz * 0.5, c.x, c.y - 0.05, c.z]); });
      await p.waitForTimeout(2500);
      await p.screenshot({ path: path.join(OUT, beat + '-side.jpg'), quality: 85 });
    }
  }
  await b.close(); server.close();
})();
