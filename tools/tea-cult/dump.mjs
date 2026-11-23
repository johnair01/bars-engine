/* Dumps the kneeling cultivation figure's bones for art/between/tea-drink/build.py (see dump.html). Serves the repo and three.js
   itself and drives Chromium (Playwright is installed in the cloud sessions).
     npm i --no-save --prefix /tmp/t three@0.160.0 three-mesh-bvh@0.8.3
     THREE_DIR=/tmp/t/node_modules node tools/tea-cult/dump.mjs f B2 0.25 > /tmp/tea-cult-f.json */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const HERE = path.dirname(new URL(import.meta.url).pathname), REPO = path.join(HERE, '..', '..');
const NM = process.env.THREE_DIR || '/tmp/t/node_modules';
const [who = 'f', outfit = 'B2', top = '0.25'] = process.argv.slice(2);
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary' };
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const f = u.startsWith('/__t/') ? path.join(NM, u.slice(5)) : path.join(REPO, u);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(0);
const port = srv.address().port;
const br = await chromium.launch(), pg = await br.newPage();
pg.on('console', m => { if (m.type() === 'error') console.error('page:', m.text()); });
pg.on('pageerror', e => console.error('pageerror:', e.message));
await pg.goto(`http://localhost:${port}/tools/tea-cult/dump.html`);
await pg.waitForFunction('window.ready', null, { timeout: 30000 });
const out = await pg.evaluate(([w, o, t]) => window.dump(w, o, t), [who, outfit, +top]);
console.log(JSON.stringify(out));
await br.close(); srv.close();
