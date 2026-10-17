/**
 * @route GET /ontology-game/between
 * @entity PLAYER
 * @description The Between: a 3D garden two people tend together, in a hollow under a great tree's roots
 * @permissions signed-in player (bars_player_id cookie); the garden itself opens only to its two members or an invite link
 * @relationships PLAYER (BetweenGarden)
 * @example GET /ontology-game/between?g=clx...&invite=...
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { currentPlayer } from '@/lib/between/store'

export const dynamic = 'force-dynamic'

/**
 * Six-faces-council bh-move-to-bars-engine (2026-10-17): the page that would not open on his iPhone inside the Claude
 * app now lives beside the caves. This route only checks the sign-in and hands out the page; the scene is
 * public/between/garden.js (the hollow and the creature in hollow.js and creature.js, round 2) and the store is
 * /api/between.
 */
const PAGE = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1a1018">
<title>The Between</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap">
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
    <div class="hint" id="hint"></div>
    <div class="near" id="near" hidden></div>
    <div class="tools" id="tools"></div>
  </div>
</div>
<div class="scrim" id="scrim" hidden></div>
<section class="sheet" id="sheet" hidden role="dialog" aria-modal="true"><div class="inner" id="sheetInner"></div></section>
<div class="toast" id="toast" hidden></div>
<script>setTimeout(function(){var e=document.getElementById("loadStep");if(e&&e.textContent==="starting"){e.textContent="the 3D library did not load";}},20000);</script>
<script type="module" src="/between/garden.js"></script>
</body></html>
`

export async function GET(req: NextRequest) {
  const player = await currentPlayer()
  if (!player) {
    const back = req.nextUrl.pathname + req.nextUrl.search
    return NextResponse.redirect(new URL('/login?returnTo=' + encodeURIComponent(back), req.url))
  }
  return new NextResponse(PAGE, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'same-origin' },
  })
}
