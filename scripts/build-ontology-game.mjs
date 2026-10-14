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
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'content', 'ontology-game');
const outDir = path.join(root, 'public', 'ontology-game');

const jsx = readFileSync(path.join(srcDir, 'game.jsx'), 'utf8');
const css = readFileSync(path.join(srcDir, 'game.css'), 'utf8');
const shim = readFileSync(path.join(srcDir, 'site-shim.js'), 'utf8');
// The body map: figure.glb is made in Blender by body/build_figure.py and committed, so this
// build needs no Blender. body-map.js loads three.js and the figure only when it is opened.
const bodyMap = readFileSync(path.join(srcDir, 'body', 'body-map.js'), 'utf8');

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
${inline(bodyMap)}
</script>
<script>
${inline(compiled.outputText)}
</script>
</body>
</html>
`;

// /ontology-game/body: the marks over time on their own page, for a player between sittings.
const bodyHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Where it has lived · Ontology Alchemy Game</title>
<meta name="description" content="The places on your body where charge has shown up in the Ontology Alchemy Game, over time. Saved on your device only.">
<style>body{margin:0;background:#1a1a2e}</style>
</head>
<body>
<script>
${inline(bodyMap)}
</script>
<script>window.OAGBody.history({ standalone: true });</script>
</body>
</html>
`;

// /ontology-game/cave: the Cave of Lessons, the same block work walked inside the body map (cave/DESIGN.md).
// cave-kit.glb and spots.json are made by cave/build_kit.py, the stone tiles by cave/bake_tiles.py; all are committed, so this build needs no Blender.
const caveJs = readFileSync(path.join(srcDir, 'cave', 'cave.js'), 'utf8');
// The Big Mind cave rides on the same page, opened from the WAVE room's Big Mind door (board dp-door).
const bigMindJs = readFileSync(path.join(srcDir, 'bigmind', 'bigmind.js'), 'utf8');
// The room built from a picture by cave/rooms/room.py, walked freely from the cave's first page (cave/rooms/README.md).
const walkRoomJs = readFileSync(path.join(srcDir, 'cave', 'rooms', 'walk-room.js'), 'utf8');
// The Council Board's way into the WAVE room (#wave=board) and the run's way back to the board (cave/board-wave.js).
const boardWaveJs = readFileSync(path.join(srcDir, 'cave', 'board-wave.js'), 'utf8');
const caveHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>The Cave of Lessons · Ontology Alchemy Game</title>
<meta name="description" content="Tap where the charge is in your body and go in. The block work, walked as a cave.">
<style>html,body{margin:0;background:#0e0e1a;overscroll-behavior:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}html{touch-action:manipulation}</style>
</head>
<body>
<div id="cave-root"></div>
<script>
${inline(bodyMap)}
</script>
<script>
${inline(caveJs)}
</script>
<script>
${inline(walkRoomJs)}
</script>
<script>
${inline(boardWaveJs)}
</script>
<script>window.__oagBigMindNoStart = true;</script>
<script>
${inline(bigMindJs)}
</script>
</body>
</html>
`;

// /ontology-game/big-mind: the Big Mind cave, a fork of the Cave of Lessons that borrows its engine (bigmind/DESIGN.md).
// It needs three.js and the body map (for where a part lives in the body), so no kit or spots file is copied.
const bigMindHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>The Big Mind cave · Ontology Alchemy Game</title>
<meta name="description" content="A walk inward, one voice at a time. Saved on your device only.">
<style>html,body{margin:0;background:#0e0e1a;overscroll-behavior:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}html{touch-action:manipulation}</style>
</head>
<body>
<div id="cave-root"></div>
<script>window.__oagCaveNoStart = true;</script>
<script>
${inline(bodyMap)}
</script>
<script>
${inline(caveJs)}
</script>
<script>
${inline(bigMindJs)}
</script>
</body>
</html>
`;

mkdirSync(outDir, { recursive: true });
mkdirSync(path.join(outDir, 'big-mind'), { recursive: true });
writeFileSync(path.join(outDir, 'big-mind', 'index.html'), bigMindHtml);
mkdirSync(path.join(outDir, 'cave'), { recursive: true });
writeFileSync(path.join(outDir, 'cave', 'index.html'), caveHtml);
copyFileSync(path.join(srcDir, 'cave', 'cave-kit.glb'), path.join(outDir, 'cave', 'cave-kit.glb'));
copyFileSync(path.join(srcDir, 'cave', 'spots.json'), path.join(outDir, 'cave', 'spots.json'));
// The stone tiles, baked by cave/bake_tiles.py and committed.
mkdirSync(path.join(outDir, 'cave', 'textures'), { recursive: true });
for (const t of ['wet_stone', 'dry_stone', 'crystal_vein']) copyFileSync(path.join(srcDir, 'cave', 'textures', t + '.jpg'), path.join(outDir, 'cave', 'textures', t + '.jpg'));
mkdirSync(path.join(outDir, 'cave', 'rooms'), { recursive: true });
copyFileSync(path.join(srcDir, 'cave', 'rooms', 'wave-room', 'room.glb'), path.join(outDir, 'cave', 'rooms', 'wave-room.glb'));
writeFileSync(path.join(outDir, 'index.html'), html);
writeFileSync(path.join(outDir, 'body.html'), bodyHtml);
copyFileSync(path.join(srcDir, 'body', 'figure.glb'), path.join(outDir, 'figure.glb'));
console.log(`Ontology Alchemy Game built into public/ontology-game (${Math.round(html.length / 1024)} KB)`);
