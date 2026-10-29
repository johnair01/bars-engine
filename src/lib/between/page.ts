/**
 * The Between's page, as GET /ontology-game/between hands it out once the sign-in is checked. It lives here rather than in
 * the route so the two-player invite check (scripts/between-invite-check.ts) serves the same HTML without the route.
 */
export const BETWEEN_PAGE = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1a1018">
<title>The Between</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Caveat:wght@500;700&family=Marcellus&display=swap">
<link rel="stylesheet" href="/between/garden.css">
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
} }
</script>
</head><body>
<div id="stage" aria-label="The garden. Tap the floor to walk there; drag to look around."></div>
<div id="labels" aria-hidden="true"></div>
<div class="loading" id="loading"><div><h1>The Between</h1><p id="loadMsg">Opening the hollow…</p><p id="loadStep" style="font-size:.8rem;opacity:.6;margin-top:8px">starting</p></div></div>

<div class="hud" id="hud" hidden>
  <div class="top">
    <div class="namecard" id="namecard"></div>
    <div class="topbtns">
      <button class="glassbtn" type="button" data-act="sound" id="soundBtn" aria-pressed="true">Sound on</button>
      <button class="glassbtn" type="button" data-open="away" id="awayBtn">While you were away</button>
      <button class="glassbtn" type="button" data-open="menu">More</button>
    </div>
  </div>
  <div class="bottom">
    <div class="next" id="next" hidden></div>
    <div class="hint" id="hint"></div>
    <div class="near" id="near" hidden></div>
    <div class="tools" id="tools"></div>
  </div>
</div>
<div class="scrim" id="scrim" hidden></div>
<section class="sheet" id="sheet" hidden role="dialog" aria-modal="true"><div class="inner" id="sheetInner"></div></section>
<div class="toast" id="toast" hidden></div>
<script>setTimeout(function(){var e=document.getElementById("loadStep");if(e&&e.textContent==="starting"){e.textContent="the 3D library did not load";}},20000);</script>
<script src="/ontology-game/cave/spirit-store.js"></script>
<script type="module" src="/between/garden.js"></script>
</body></html>
`
