// Bakes the cultivation figure for the caves (cave.js, basin.js through cult-figure.js).
//   npm i three@0.160.0 three-mesh-bvh@0.8.3   (in any folder; its node_modules is CULT_NM)
//   CULT_NM=/that/node_modules PLAYWRIGHT=/path/to/playwright node content/ontology-game/cave/bake_cult/run.mjs f m
// It serves public/between/ (the figure's source: cult/walker.js, its parts and its UBC bodies) and this folder's bake.html,
// builds her ('f') and him ('m') in the page exactly as the Between does, drives the stride for one cycle, and writes
// player/cult-<who>.glb: the garment meshes merged to one skinned mesh per material, colours baked as sRGB (the cave page is
// three.js r128), normals, colours, joints and weights as bytes, a 'Walk' clip (one cycle in one second, 24 keys) and an 'Idle' clip.
// The ground one cycle covers (cyc) and the figure's height print here; cult-figure.js's FIG table holds them.
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const here = path.dirname(new URL(import.meta.url).pathname), pub = path.resolve(here, "../../../../public");
const NM = process.env.CULT_NM || path.join(process.cwd(), "node_modules");
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT || "playwright");
const roots = { "/nm/": NM + "/", "/between/": pub + "/between/", "/calrunia/": pub + "/calrunia/", "/": here + "/" };
const mime = { ".js": "text/javascript", ".json": "application/json", ".html": "text/html", ".wasm": "application/wasm" };
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split("?")[0]), k = Object.keys(roots).find((k) => u.startsWith(k)), f = path.join(roots[k], u.slice(k.length));
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); res.end(); } else { res.writeHead(200, { "content-type": mime[path.extname(f)] || "application/octet-stream" }); res.end(d); } });
}).listen(8123);
const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage(); p.on("pageerror", (e) => console.log("[err]", e.message));
await p.goto("http://localhost:8123/bake.html"); await p.waitForFunction(() => window.ready);
for (const who of process.argv.slice(2)) {
  const r = await p.evaluate((w) => window.bake(w), who);
  fs.writeFileSync(path.join(here, "../player/cult-" + who + ".glb"), Buffer.from(r.b64, "base64")); delete r.b64; delete r.meshes;
  console.log(who, JSON.stringify(r));
}
await b.close(); srv.close();
