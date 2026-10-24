/** The studio boat page: a Phaser 3 scene (position ty-engine) of the Lantern deck, the side view Wendell picked
 * (ty-still-pick = A). The page only carries the world as data; the game itself is public/studio/boat.js and its
 * sprites. No list or panel is drawn: the only text is what a spirit says, a letter, and the ship's log. */
import type { Deck } from './deck'
import { worldOf } from './world'

export const PHASER = 'https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js'

export function studioPage(deck: Deck): string {
  const data = JSON.stringify(worldOf(deck)).replace(/</g, '\\u003c')
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1a1430">
<title>Studio Boat</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Fredoka:wght@500&display=swap" rel="stylesheet">
<style>
html,body{margin:0;height:100%;background:#000;overflow:hidden;overscroll-behavior:none}
#game{position:fixed;inset:0}
canvas{display:block;touch-action:none}
</style></head><body>
<div id="game" aria-label="The studio boat at sea. Walk the deck; each house is one strand of the work."></div>
<script>window.BOAT=${data};</script>
<script src="${PHASER}"></script>
<script src="/studio/boat.js?v=1"></script>
</body></html>`
}
