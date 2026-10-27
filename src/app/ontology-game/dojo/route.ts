/**
 * @route GET /ontology-game/dojo
 * @entity ROOM
 * @description The Dojo: the round practice hall, walked in first person through its doorway
 * @permissions public; the room holds no per-player state and writes nothing
 * @relationships ROOM (Dojo)
 * @example GET /ontology-game/dojo?walk=1
 * @agentDiscoverable false
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * The Dojo came in from a Mastering Alchemy build: a round hall with four camera
 * presets and a first-person walk mode that enters through the doorway. This route
 * only hands out the page, the way the Between's route does. The room is
 * public/dojo/dojo.js with public/dojo/materials.js, the viewer, the four presets
 * and the walk mode are public/dojo/main.js, and the HUD is public/dojo/dojo.css.
 *
 * Three is pinned to 0.186.1, the version the room was built and tested against,
 * where the Between pins 0.160.0 on its own page; each page carries its own
 * importmap, so the two do not have to move together.
 */
const PAGE = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#140d08">
<title>The Dojo</title>
<link rel="stylesheet" href="/dojo/dojo.css">
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/",
  "three/examples/jsm/": "https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/"
} }
</script>
</head><body>
<div id="app"></div>
<div id="hud">
  <div class="title">
    <h1>The Dojo</h1>
    <p>Round practice hall &middot; four views &middot; walk in through the doorway</p>
  </div>
  <div class="views" id="views"></div>
  <div class="hint" id="hint"></div>
  <div class="crosshair" aria-hidden="true"></div>
</div>
<script type="module" src="/dojo/main.js"></script>
</body></html>
`

export function GET() {
  return new NextResponse(PAGE, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'same-origin',
    },
  })
}
