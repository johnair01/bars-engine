/* The Between's light, measured on the live page (six-faces-council relationship-creature, mirror light build).
   Serves public/ (or ROOT) with the page from src/app/ontology-game/between/route.ts, answers /api/* with 503 so the page
   opens as "the room only" (storeDown), and for each shot opens it in headless Chromium at a phone viewport:
     node tools/between-live-probe.mjs [--root DIR] [--out DIR] [--vp 390x844] [--frames] [--throttle 4] shot...
     shot = name|query, e.g. "mirror|mirror=1" "walk|"
   Prints per shot the r2 probe (still2.html): figure L*, room L*, darkShare (figure px under L* 10), gradP95 (steepest
   light edge on the figure), and with --frames the median ms per frame over 6 s with the CPU throttled (CDP). Writes
   <out>/<name>.jpg. Needs playwright (pre-installed in the cloud containers) and the three.js CDN. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');   // pre-installed globally in the cloud containers, so not an import
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = path.resolve(arg('--root', path.join(__dirname, '..', 'public'))), OUT = arg('--out', '.');
const FRAMES = process.argv.includes('--frames'), THROTTLE = +arg('--throttle', 4);
const [VW, VH] = arg('--vp', '390x844').split('x').map(Number);   // 600x900 matches still2.html's probe; 390x844 is the phone
const shots = process.argv.slice(2).filter((a, i, all) => a.includes('|') && !['--root', '--out', '--throttle', '--vp'].includes(all[i - 1]));
const route = fs.readFileSync(path.join(__dirname, '..', 'src/app/ontology-game/between/route.ts'), 'utf8');
const PAGE = route.slice(route.indexOf('const PAGE = `') + 14, route.indexOf('`', route.indexOf('const PAGE = `') + 14));
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.glb': 'model/gltf-binary', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/api/')) { res.writeHead(503, { 'content-type': 'application/json' }); return res.end('{"error":"probe: no store"}'); }
  if (u.pathname === '/ontology-game/between') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PAGE); }
  const f = path.join(ROOT, path.normalize(u.pathname));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
const PROBE = async () => {
  const THREE = await import('three');   // the page's import map, so the same module the page uses
  const B = window.__between, r = B.renderer, scene = B.scene, camera = B.camera, holder = B.meState.body.holder, gl = r.getContext();
  const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
  r.render(scene, camera); const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const vis = []; scene.traverse(o => { if (o.isMesh || o.isPoints || o.isLine || o.isSprite) vis.push([o, o.visible]); });
  for (const [o] of vis) { let f = false; for (let p = o; p; p = p.parent) if (p === holder) f = true; o.visible = f && !(o.geometry && o.geometry.type === 'RingGeometry'); }   // the figure, not its owner ring
  const bg = scene.background, fog = scene.fog, tm = r.toneMapping;
  scene.overrideMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); scene.background = new THREE.Color(0); scene.fog = null; r.toneMapping = THREE.NoToneMapping;
  r.render(scene, camera); const mk = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, mk);
  scene.overrideMaterial = null; scene.background = bg; scene.fog = fog; r.toneMapping = tm; for (const [o, v] of vis) o.visible = v;
  const Ls = Y => Y > 0.008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y;
  const lum = i => 0.2126 * (px[i] / 255) ** 2.2 + 0.7152 * (px[i + 1] / 255) ** 2.2 + 0.0722 * (px[i + 2] / 255) ** 2.2;
  let fs = 0, fn = 0, bs = 0, bn = 0, dark = 0; const grads = [], band = new Array(10).fill(0);
  for (let i = 0; i < W * H * 4; i += 4) { const Y = lum(i); if (mk[i] > 128) { fs += Y; fn++; if (Y < 0.0113) dark++; const j = i + 4, k = i + W * 4; if (mk[j] > 128 && mk[k] > 128) { const g = Math.hypot(Ls(lum(j)) - Ls(Y), Ls(lum(k)) - Ls(Y)); grads.push(g); if (g > 15) { const y = Math.floor((i / 4) / W); band[Math.floor(10 * y / H)]++; } } } else { bs += Y; bn++; } }
  grads.sort((a, b) => a - b);
  return { figureL: +Ls(fs / fn).toFixed(1), roomL: +Ls(bs / bn).toFixed(1), figurePx: fn, darkShare: +(dark / fn).toFixed(2), gradP95: +(grads[Math.floor(grads.length * 0.95)] || 0).toFixed(1), steepRows: band };
};
(async () => {
  await new Promise(a => server.listen(0, a)); const port = server.address().port;
  const b = await chromium.launch(); const out = {};
  for (const s of shots) {
    const [name, qs] = s.split('|');
    const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 }); const p = await ctx.newPage();
    p.on('pageerror', e => console.error('PAGEERR', name, e.message, (e.stack || '').split('\n').slice(1, 3).join(' ')));
    await p.goto(`http://localhost:${port}/ontology-game/between?${qs || ''}`);
    await p.waitForFunction(() => window.__between && window.__between.meState.body && document.getElementById('loading').hidden, null, { timeout: 180000 });
    // software GL runs a few frames a second, so wait for the walk to the glass to end (dt is capped per frame), then settle
    await p.waitForFunction(() => window.__between.meState.wasWalking === false, null, { timeout: 180000 });
    await p.waitForTimeout(3000);
    const res = await p.evaluate(PROBE);
    if (FRAMES) {
      const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
      res.msPerFrame = await p.evaluate(() => new Promise(done => { const ts = []; const f = t => { ts.push(t); if (t - ts[0] < 6000) requestAnimationFrame(f); else { const d = ts.slice(1).map((x, i) => x - ts[i]).sort((a, b) => a - b); done(+d[d.length >> 1].toFixed(1)); } }; requestAnimationFrame(f); }));
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    }
    res.state = await p.evaluate(() => { const B = window.__between, m = B.meState.body.mixer; const env = []; B.meState.body.holder.traverse(o => { if (o.isMesh) for (const q of [].concat(o.material)) env.push([q.type, !!q.envMap, +(q.envMapIntensity || 0).toFixed(2), q.roughness]); }); return { anims: m._actions.filter(a => a.isRunning() && a.getEffectiveWeight() > 0.01).map(a => a.getClip().name), env }; });
    await p.screenshot({ path: path.join(OUT, name + '.jpg'), quality: 85 });
    out[name] = res; await ctx.close();
  }
  console.log(JSON.stringify(out, null, 1)); await b.close(); server.close();
})();
