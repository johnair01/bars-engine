// Builds /calrunia/deck, the living ship's trade deck (content/calrunia/deck/), into public/calrunia/deck/index.html
// (gitignored, like /calrunia/arrive). The scene is one module made of named parts, in the order below: the kit, then each
// part file, then the page that plays them. Each part file names its source (Still B, money gate round 3, or new), and
// ?build=1 on the page shows them assembling in this order. The trade hand's rules (trade-hand.js) and player zero's chart
// (fixtures/trade-deck/player-zero.json) ride in as plain scripts, with the opportunity deck a returning boat opens on
// (fixtures/trade-deck/opportunities.json). The opportunity card's CSS mirrors the app's card system: values copied from
// src/lib/ui/card-tokens.ts and src/styles/bars-tokens.css, classes as in src/styles/cultivation-cards.css (UI_COVENANT.md). three.js 0.160 from jsDelivr, as in the Between.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(root, p), 'utf8');
const inline = (code) => code.replace(/<\/script/gi, '<\\/script');
export const PARTS = ['sky', 'ring', 'water', 'ports', 'crate', 'boat', 'spirit', 'pier', 'return', 'studio', 'tidepost', 'lectern', 'bell'];
const scene = [read('content/calrunia/deck/kit.js'), ...PARTS.map((p) => read(`content/calrunia/deck/parts/${p}.js`)), read('content/calrunia/deck/deck-page.js')].join('\n');
const chart = JSON.parse(read('fixtures/trade-deck/player-zero.json'));
delete chart.note;
const opps = JSON.parse(read('fixtures/trade-deck/opportunities.json'));
delete opps.note;

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
/* The opportunity card: a Cultivation Card (UI_COVENANT.md). Element = colour (data-element), altitude satisfied = 2px
   frame at full strength with a 12px glow, stage growing = art window, name banner, description well, stat block. */
.op-card{--surface:#1a1a18;--inset:#111110;--t1:#e8e6e0;--t2:#a09e98;--gold:#c9a84c;--gold-lite:#e8c878;--liminal:#7c3aed;--liminal-glow:#a855f7;
  --display:'Jost','Futura PT',Futura,system-ui,sans-serif;--body:'Nunito',ui-rounded,'Segoe UI Rounded',system-ui,sans-serif;--mono:'Space Mono',ui-monospace,Menlo,monospace;
  --x:-50%;position:absolute;left:50%;bottom:calc(76px + env(safe-area-inset-bottom));width:min(calc(100vw - 32px),352px);max-height:calc(100dvh - 104px);overflow:auto;box-sizing:border-box;
  transform:translateX(var(--x));padding:14px 16px 16px;border-radius:12px;background:var(--surface);color:var(--t1);font-family:var(--body);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 0 0 2px var(--el-frame),0 0 12px 2px var(--el-glow),0 18px 36px -8px rgba(0,0,0,.6);isolation:isolate}
.op-card[hidden]{display:none}
/* a wide screen keeps the opened crate in view: the card stands to the right of it */
@media (min-width:900px){.op-card{--x:0px;left:auto;right:max(32px,6vw);bottom:auto;top:50%;margin-top:-240px}}
.op-card[data-element=fire]{--el-frame:#c1392b;--el-glow:#e8671a;--el-gem:#e74c3c;--el-from:#431407;--el-to:#1c0700}
.op-card[data-element=water]{--el-frame:#1a3a5c;--el-glow:#1a7a8a;--el-gem:#2980b9;--el-from:#0c1e3e;--el-to:#020c1f}
.op-card[data-element=wood]{--el-frame:#4a7c59;--el-glow:#27ae60;--el-gem:#2ecc71;--el-from:#052e16;--el-to:#011309}
.op-card[data-element=metal]{--el-frame:#8e9aab;--el-glow:#bdc3c7;--el-gem:#bdc3c7;--el-from:#1e2530;--el-to:#0d1017}
.op-card[data-element=earth]{--el-frame:#b5651d;--el-glow:#d4a017;--el-gem:#e0a93b;--el-from:#451a03;--el-to:#1a0a00}
.op-grad{position:absolute;inset:0;border-radius:12px;z-index:-1;pointer-events:none;background:radial-gradient(ellipse at top left,var(--el-from) 0%,transparent 60%),linear-gradient(160deg,var(--el-to) 0%,#0a0908 100%)}
.op-cost{position:absolute;left:12px;top:12px;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:var(--inset);box-shadow:0 0 0 2px var(--el-frame);font-family:var(--display)}
.op-cost b{font-size:17px;line-height:1;font-variant-numeric:tabular-nums}.op-cost span{font-size:11px;color:var(--t2);letter-spacing:.04em}
.op-art{position:relative;height:120px;border-radius:8px;overflow:hidden;background:radial-gradient(ellipse at 50% 70%,color-mix(in srgb,var(--el-glow) 22%,transparent) 0%,transparent 70%),linear-gradient(180deg,var(--el-to),var(--el-from));box-shadow:inset 0 0 0 2px var(--el-frame)}
@media (max-width:599px){.op-art{height:96px}.op-art svg{width:148px}.op-name{margin:10px 0 8px}}
.op-art svg{position:absolute;left:50%;bottom:4px;width:176px;height:auto;transform:translateX(-50%)}
.op-from{position:absolute;right:10px;top:8px;margin:0;display:flex;gap:6px;align-items:center;font:700 11px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--t1);text-shadow:0 1px 2px #000}
.op-sigil{font:700 14px/1 var(--display);color:var(--el-gem);letter-spacing:0}
.op-name{display:flex;align-items:center;justify-content:center;gap:8px;margin:12px 0 10px;font:700 21px/1.15 var(--display);letter-spacing:-.01em;text-align:center;text-wrap:balance}
.op-gem{flex:none;width:10px;height:10px;transform:rotate(45deg);background:var(--el-gem);box-shadow:0 0 8px var(--el-glow)}
.op-well{padding:10px 12px;border-radius:8px;background:var(--inset);box-shadow:inset 0 0 0 1px rgba(255,255,255,.07)}
.op-line{margin:0 0 6px;font-size:14px;line-height:1.45;color:var(--t2)}
.op-act{margin:0;font-size:16px;line-height:1.45;font-weight:600;color:var(--t1)}
.op-stats{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin:10px 2px 12px}
.op-stats p{margin:0}
.op-plus{font-family:var(--display);color:var(--gold-lite)}.op-plus b{font-size:22px;font-variant-numeric:tabular-nums}.op-plus span{font-size:14px;font-weight:600}
.op-pay{font-size:13px;color:var(--t2);text-align:right}
.op-moves{display:flex;gap:10px}
.op-btn{flex:1;min-height:48px;padding:10px 14px;border:0;border-radius:10px;font:700 16px/1.1 var(--display);letter-spacing:.01em;cursor:pointer;color:#fff;background:var(--liminal);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 0 0 1px var(--liminal-glow),0 4px 14px -4px color-mix(in srgb,var(--liminal) 70%,transparent);transition:transform 150ms ease-out,box-shadow 150ms ease-out,background-color 150ms ease-out}
.op-btn:hover{background:#8b4cf0;box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 0 0 1px var(--liminal-glow),0 6px 18px -4px var(--liminal-glow)}
.op-btn:active{transform:scale(.97);transition-duration:80ms}
.op-btn:focus-visible{outline:2px solid #fff;outline-offset:2px}
.op-btn.quiet{flex:.8;background:transparent;color:var(--t1);box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}
.op-btn.quiet:hover{background:rgba(255,255,255,.06)}
.op-settled{margin:0;min-height:48px;display:flex;align-items:center;font-size:15px;line-height:1.4;color:var(--t1)}
.op-enter{animation:op-entry 420ms cubic-bezier(.16,1,.3,1) both}
.op-enter .op-beam{animation:op-rise 1.6s ease-out both}.op-enter .op-motes{animation:op-motes 2.4s ease-out both}
.op-taken{box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 0 0 2px var(--el-frame),0 0 24px 8px var(--el-glow),0 0 48px 16px color-mix(in srgb,var(--el-glow) 40%,transparent);transition:box-shadow 300ms ease-out}
.op-drift{opacity:.72;transition:opacity 400ms ease-out}
.op-leave{opacity:0;transform:translate(var(--x),16px);transition:opacity 400ms ease-in,transform 400ms ease-in}
@keyframes op-entry{from{opacity:0;transform:translate(var(--x),24px) scale(.96)}to{opacity:1;transform:translate(var(--x),0) scale(1)}}
@keyframes op-rise{from{opacity:0;transform:scaleY(.2);transform-origin:50% 100%}to{opacity:1;transform:scaleY(1);transform-origin:50% 100%}}
@keyframes op-motes{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@media (prefers-reduced-motion:reduce){.op-enter,.op-enter .op-beam,.op-enter .op-motes{animation:none}.op-card,.op-btn,.op-leave{transition:none}}
`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>The money boat · Calrunia</title>
<meta name="description" content="The money boat at its pier at dawn: one crate on its hatch each morning. Saved on your device only.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:wght@400;600;700&family=Nunito:wght@400;600;700&family=Space+Mono:wght@700&display=swap">
<style>${css}</style>
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
} }
</script>
</head>
<body>
<div id="deck-root"><canvas id="deck-scene" aria-label="The money boat at its pier at dawn. A crate waits on the boat's hatch with a spirit beside it. Tap where to walk; tap the plank to go aboard; tap the crate, the spirit, the crew bell or a boat to go to it. Drag to turn the view."></canvas></div>
<script>
window.__tradeDeckChart = ${inline(JSON.stringify(chart))};
window.__tradeDeckOpps = ${inline(JSON.stringify(opps))};
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
