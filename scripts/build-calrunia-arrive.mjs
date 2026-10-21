// Builds /calrunia/arrive, Chapter 1's arrival aboard the ship (content/calrunia/arrive/ship-scene.js), into
// public/calrunia/arrive/index.html (gitignored, like public/ontology-game). The page carries, inline: the passport check
// (src/lib/passport/passport.ts, compiled here so the browser runs the same validatePassport as the contract test), the
// fragment reader (public/passport/arrive.js), the guest fold (public/passport/guest.js), the cave's spirit store and forms,
// the ship's dock (cave/vessel.js) and the Chapter 1 fixture for ?demo=1. The models are committed in public/calrunia/ship/.
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
:root{--ground:#0a0908;--body:#1a1a18;--ink:#f2ede4;--ink-soft:#c9c2b6;--primary:#6b4fbb;--primary-edge:#a28cf0;--gold:#d4a017}
html,body{margin:0;height:100%;background:var(--ground);color:var(--ink);overscroll-behavior:none;-webkit-tap-highlight-color:transparent}
html{touch-action:manipulation}
#arrive-root{position:fixed;inset:0;font:16px/1.4 ui-rounded,Nunito,system-ui,sans-serif}
#arrive-scene{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.arr-top{position:absolute;top:0;left:0;right:0;padding:max(12px,env(safe-area-inset-top)) 16px 0;pointer-events:none}
.arr-top h1{margin:0;font:700 15px/1.2 Futura,"Futura PT","Century Gothic",system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-soft)}
.arr-sheet{position:absolute;left:0;right:0;bottom:0;padding:14px 16px max(16px,env(safe-area-inset-bottom));background:linear-gradient(to top,rgba(10,9,8,.97) 70%,rgba(10,9,8,.0));display:flex;flex-direction:column;gap:10px}
.arr-note{margin:0;padding:8px 10px;border:1px solid rgba(242,237,228,.3);border-radius:8px;background:var(--body);color:var(--ink-soft);font-size:14px}
.arr-say{margin:0;padding:10px 12px;border-radius:10px;background:var(--body);border:2px solid var(--el-frame);box-shadow:0 0 4px var(--el-glow)}
.arr-who{display:block;font-weight:700;color:var(--ink);margin-bottom:2px}
.arr-hand{display:flex;gap:8px;overflow-x:auto;padding:2px 0}
.arr-card{flex:0 0 auto;width:92px;min-height:118px;box-sizing:border-box;border-radius:8px;background:var(--body);border:2px solid rgba(142,154,171,.7);padding:8px;display:flex;flex-direction:column;gap:6px}
.arr-card.is-bar{border-color:rgba(212,160,23,.7)}
.arr-card.is-blank{background:#f3efe6;border:2px dashed var(--el-glow);color:#1a1a18}
.arr-kind{font:700 11px/1 Futura,"Century Gothic",system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;opacity:.8}
.arr-title{font-size:14px;line-height:1.25}
.arr-row{display:flex;align-items:center;justify-content:space-between;gap:10px}
.arr-vib{margin:0;color:var(--ink-soft)}
.arr-vib b{font:700 22px/1 Futura,"Century Gothic",system-ui,sans-serif;font-variant-numeric:tabular-nums;color:var(--gold)}
.arr-go{min-height:48px;padding:10px 18px;border-radius:10px;border:2px solid var(--primary-edge);background:var(--primary);color:#fff;font:700 16px/1 ui-rounded,Nunito,system-ui,sans-serif}
.arr-go:focus-visible{outline:3px solid #fff;outline-offset:2px}
.arr-go:active{transform:translateY(1px)}
`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>Aboard your ship · Calrunia</title>
<meta name="description" content="The end of Chapter 1: you arrive aboard your ship with your spirit, your cards and the blank card. Saved on your device only.">
<style>${css}</style>
</head>
<body>
<div id="arrive-root"><canvas id="arrive-scene" aria-label="Your ship at the dock. Drag to turn the view."></canvas></div>
<script>
${inline(check)}
window.__calruniaDemoPassport = ${inline(demo)};
</script>
<script>
${inline(read('public/passport/guest.js'))}
</script>
<script>
${inline(read('content/ontology-game/cave/spirit-forms.js'))}
</script>
<script>
${inline(read('content/ontology-game/cave/spirit-store.js'))}
${inline(read('content/ontology-game/cave/vessel.js'))}
</script>
<script>
${inline(read('public/passport/arrive.js'))}
</script>
<script>
${inline(read('content/calrunia/arrive/ship-scene.js'))}
</script>
</body>
</html>
`;

const out = path.join(root, 'public', 'calrunia', 'arrive');
mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, 'index.html'), html);
console.log(`Calrunia arrival built into public/calrunia/arrive (${Math.round(html.length / 1024)} KB)`);
