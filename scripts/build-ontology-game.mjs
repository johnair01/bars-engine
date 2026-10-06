// Builds the Ontology Alchemy Game page served at /ontology-game.
//
// Source: content/ontology-game/ (game.jsx and game.css came from the claude.ai artifact;
// site-shim.js gives the game browser-local storage off claude.ai). Output:
// public/ontology-game/index.html, gitignored like public/understood-app.
//
// The artifact compiled its JSX in the browser with Babel standalone (about 3 MB, then a
// compile of about 270 KB on every load). This compiles once at build time with the
// TypeScript compiler the repo already has, so a client's phone downloads React and the
// compiled game only.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'content', 'ontology-game');
const outDir = path.join(root, 'public', 'ontology-game');

const jsx = readFileSync(path.join(srcDir, 'game.jsx'), 'utf8');
const css = readFileSync(path.join(srcDir, 'game.css'), 'utf8');
const shim = readFileSync(path.join(srcDir, 'site-shim.js'), 'utf8');

const compiled = ts.transpileModule(jsx, {
  fileName: 'game.jsx',
  reportDiagnostics: true,
  compilerOptions: {
    jsx: ts.JsxEmit.React,
    target: ts.ScriptTarget.ES2019,
    module: ts.ModuleKind.None,
    allowJs: true,
  },
});
if (compiled.diagnostics && compiled.diagnostics.length) {
  const msg = ts.formatDiagnosticsWithColorAndContext(compiled.diagnostics, {
    getCanonicalFileName: (f) => f,
    getCurrentDirectory: () => root,
    getNewLine: () => '\n',
  });
  console.error(msg);
  process.exit(1);
}

// "</script" inside a string would end the inline script early.
const inline = (code) => code.replace(/<\/script/gi, '<\\/script');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Ontology Alchemy Game · Mastering Allyship</title>
<meta name="description" content="A practice game: find a block in your body, name its emotional channel and face, hold a true belief, and let your body finish the turn. Includes the W.A.V.E. practice.">
<meta property="og:title" content="Ontology Alchemy Game">
<meta property="og:description" content="Find a block in your body, hold a true belief about it, and see if it shifts. Includes the W.A.V.E. practice.">
<style>
${css}
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
</head>
<body>
<div id="root"></div>
<script>
${inline(shim)}
</script>
<script>
${inline(compiled.outputText)}
</script>
</body>
</html>
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, 'index.html'), html);
console.log(`Ontology Alchemy Game built into public/ontology-game (${Math.round(html.length / 1024)} KB)`);
