// Builds /calrunia/arrive, the living ship seen from inside (content/calrunia/arrive/living-ship.js), into
// public/calrunia/arrive/index.html (gitignored, like public/ontology-game). The page carries, inline: the passport check
// (src/lib/passport/passport.ts, compiled here so the browser runs the same validatePassport as the contract test), the
// fragment reader (public/passport/arrive.js), the guest fold (public/passport/guest.js), the ship's record (cave/vessel.js), the
// world read from them (ship-world.js) and the Chapter 1 fixture for ?demo=1. three.js 0.160 comes from jsDelivr, as in the
// Between; the player's figure is the Between's /between/m/player.glb.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(root, p), 'utf8');
const inline = (code) => code.replace(/<\/script/gi, '<\\/script');

const passportTs = ts.transpileModule(read('src/lib/passport/passport.ts'), {
  compilerOptions: { target: ts.ScriptTarget.ES2019, module: ts.ModuleKind.CommonJS },
}).outputText;
const check = `(function () { var exports = {}, module = { exports: exports };\n${passportTs}\nwindow.__calruniaPassportCheck = module.exports; })();`;
const demo = JSON.stringify(JSON.parse(read('fixtures/passport/valid/chapter1-sprout.json')));

const css = `
:root{--ground:#120d1c;--ink:#f2ede4;--ink-soft:#d9cfe6;--plum:#2a1e3a}
html,body{margin:0;height:100%;background:var(--ground);color:var(--ink);overscroll-behavior:none;-webkit-tap-highlight-color:transparent}
html{touch-action:manipulation}
#arrive-root{position:fixed;inset:0;overflow:hidden;font:16px/1.4 ui-rounded,Nunito,system-ui,sans-serif}
#arrive-scene{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;image-rendering:pixelated;cursor:pointer}
.arr-bubble{position:absolute;left:0;top:0;max-width:min(78vw,340px);box-sizing:border-box;padding:10px 14px;border-radius:16px;background:rgba(246,240,230,.94);color:var(--plum);box-shadow:0 4px 18px rgba(20,10,40,.35);font-size:15px;line-height:1.4;will-change:transform}
.arr-bubble b{display:block;font-weight:700;margin-bottom:2px}
.arr-bubble a{display:inline-block;margin-top:8px;padding:10px 14px;min-height:44px;box-sizing:border-box;border-radius:12px;background:#6b4fbb;color:#fff;font-weight:700;text-decoration:none}
.arr-bubble a:focus-visible{outline:3px solid var(--plum);outline-offset:2px}
.arr-veil{position:absolute;inset:0;background:#000;pointer-events:none;transition:opacity 1.4s ease}
.arr-veil.gone{opacity:0}
`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>Aboard your ship · Calrunia</title>
<meta name="description" content="Inside your living ship: a world bigger than the ship, grown from your inner work. Saved on your device only.">
<style>${css}</style>
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
} }
</script>
</head>
<body>
<div id="arrive-root"><canvas id="arrive-scene" aria-label="Inside your ship. Through a round door is a garden island where your spirits live. Tap where to walk; tap a spirit, the den or the glowing bud to go to it. Drag to turn the view."></canvas></div>
<script>
${inline(check)}
window.__calruniaDemoPassport = ${inline(demo)};
</script>
<script>
${inline(read('public/passport/guest.js'))}
</script>
<script>
${inline(read('content/ontology-game/cave/vessel.js'))}
</script>
<script>
${inline(read('public/passport/arrive.js'))}
</script>
<script>
${inline(read('content/calrunia/arrive/ship-world.js'))}
</script>
<script type="module">
${inline(read('content/calrunia/arrive/living-ship.js'))}
</script>
</body>
</html>
`;

const out = path.join(root, 'public', 'calrunia', 'arrive');
mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, 'index.html'), html);
console.log(`Calrunia arrival built into public/calrunia/arrive (${Math.round(html.length / 1024)} KB)`);
