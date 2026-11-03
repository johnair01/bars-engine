// Builds /calrunia/deck, the living ship's trade deck (content/calrunia/deck/), into public/calrunia/deck/index.html
// (gitignored, like /calrunia/arrive). The scene is one module made of named parts, in the order below: the kit, then each
// part file, then the page that plays them. Each part file names its source (Still B, money gate round 3, or new), and
// ?build=1 on the page shows them assembling in this order. The trade hand's rules (trade-hand.js) and player zero's chart
// (fixtures/trade-deck/player-zero.json) ride in as plain scripts. three.js 0.160 from jsDelivr, as in the Between.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(root, p), 'utf8');
const inline = (code) => code.replace(/<\/script/gi, '<\\/script');
export const PARTS = ['sky', 'ring', 'water', 'ports', 'deck', 'crate', 'hatch', 'gangway', 'bell', 'studio', 'spirit', 'tidepost', 'lectern'];
const scene = [read('content/calrunia/deck/kit.js'), ...PARTS.map((p) => read(`content/calrunia/deck/parts/${p}.js`)), read('content/calrunia/deck/deck-page.js')].join('\n');
const chart = JSON.parse(read('fixtures/trade-deck/player-zero.json'));
delete chart.note;

const css = `
:root{--ground:#120d1c;--ink:#f6e6d2;--plum:#2a1e3a;--brass:#c9a25a;--lit:#ffd88a;--vein:#9ff6e4}
html,body{margin:0;height:100%;background:var(--ground);color:var(--ink);overscroll-behavior:none;-webkit-tap-highlight-color:transparent}
html{touch-action:manipulation}
#deck-root{position:fixed;inset:0;overflow:hidden;font:16px/1.4 ui-rounded,Nunito,system-ui,sans-serif}
#deck-scene{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;image-rendering:pixelated;cursor:pointer}
.dk-bubble{position:absolute;left:0;top:0;width:min(86vw,340px);box-sizing:border-box;padding:12px 14px;border-radius:16px;background:rgba(246,240,230,.95);color:var(--plum);box-shadow:0 4px 18px rgba(20,10,40,.35);font-size:15px;will-change:transform}
.dk-bubble b{display:block;font-weight:700;margin-bottom:2px}
.dk-bubble p{margin:0 0 8px}
.dk-bubble .dk-q{font-weight:700}
.dk-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.dk-bubble button,.dk-build button{min-height:44px;min-width:44px;padding:10px 14px;border:0;border-radius:12px;background:#6b4fbb;color:#fff;font:inherit;font-weight:700;cursor:pointer}
.dk-bubble button.quiet,.dk-build button.quiet{background:#e6dcef;color:var(--plum)}
.dk-bubble button:focus-visible,.dk-build button:focus-visible{outline:3px solid var(--plum);outline-offset:2px}
.dk-field{display:block;width:100%;box-sizing:border-box;margin:6px 0;padding:10px;border:2px solid #cbbcdc;border-radius:10px;font:inherit;background:#fff;color:var(--plum)}
.dk-chip{position:absolute;right:14px;top:14px;padding:6px 14px;border-radius:30px;background:#2a1e3add;border:2px solid var(--brass);font:20px Georgia,serif}
.dk-plate{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);width:min(94vw,860px);box-sizing:border-box;padding:8px 16px;border-radius:10px;background:linear-gradient(#3a2a48e6,#2a1e3ae6);border:2px solid var(--brass);font:15px/1.4 Georgia,serif;text-align:center;pointer-events:none}
.dk-plate span{opacity:.55}.dk-plate span.lit{opacity:1;color:var(--lit)}
.dk-build{position:absolute;left:12px;top:12px;width:min(92vw,360px);box-sizing:border-box;padding:12px 14px;border-radius:14px;background:#2a1e3ae8;border:2px solid var(--brass);font-size:14px}
.dk-build ol{margin:6px 0;padding-left:22px}.dk-build li{margin:2px 0}.dk-build li.later{opacity:.4}.dk-build li.now b{color:var(--lit)}
.dk-build li span{opacity:.75}
@media (prefers-reduced-motion:reduce){.dk-bubble{transition:none}}
`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>The trade deck · Calrunia</title>
<meta name="description" content="Your living ship's trade deck at dawn: one crate on the hatch each morning. Saved on your device only.">
<style>${css}</style>
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
} }
</script>
</head>
<body>
<div id="deck-root"><canvas id="deck-scene" aria-label="Your ship's trade deck at dawn. A crate waits on the hatch with a spirit beside it. Tap where to walk; tap the crate, the spirit, the gangway, the crew bell or a boat to go to it. Drag to turn the view."></canvas></div>
<script>
window.__tradeDeckChart = ${inline(JSON.stringify(chart))};
</script>
<script>
${inline(read('content/calrunia/deck/trade-hand.js'))}
</script>
<script type="module">
${inline(scene)}
</script>
</body>
</html>
`;

const out = path.join(root, 'public', 'calrunia', 'deck');
mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, 'index.html'), html);
writeFileSync(path.join(out, 'parts.json'), JSON.stringify(PARTS, null, 1));
console.log(`Calrunia trade deck built into public/calrunia/deck (${Math.round(html.length / 1024)} KB, ${PARTS.length} parts)`);
