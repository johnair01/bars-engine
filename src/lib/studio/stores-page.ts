/** The Stores' move page (/board/studio?stores=1): the Stores room cut open in the built Gourd Star (public/studio/
 * altitude.js, AltR9.storesFrame), with the run's things from stores.ts on its floor. Tap a thing and the keeper walks
 * to it and holds it up; tap where it goes and the keeper carries it there. Each placement, the tide's included, is a
 * save to the board store's `stores` collection (POST /api/board/saves); the card is the only text on screen.
 * URL: &demo=1 plays the round's mock run and saves nothing. */
import { ALTITUDE_JS } from './page'
import type { StoresWorld } from './stores'

const esc = (o: unknown) => JSON.stringify(o).replace(/</g, '\\u003c')

export function storesPage(world: StoresWorld): string {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#24205a">
<title>The Stores</title>
<style>
:root{--night:#24205a;--paper:#fbf3e2;--ink:#2c2450;--ink-soft:#5c5478;--edge:rgba(44,36,80,.55);--seal:#d8509f}
html,body{margin:0;height:100%;background:var(--night);overflow:hidden;overscroll-behavior:none}
body{font-family:Georgia,'Iowan Old Style','Palatino Linotype',serif;color:var(--ink);-webkit-tap-highlight-color:transparent}
canvas{position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;display:block;touch-action:manipulation}
.card{position:fixed;left:16px;right:16px;bottom:max(16px,env(safe-area-inset-bottom));background:var(--paper);border:1.5px solid var(--edge);
  border-radius:14px;padding:14px 16px 15px;box-shadow:0 10px 30px rgba(10,8,40,.45);transition:transform .35s ease,opacity .35s ease}
.card.away{transform:translateY(130%);opacity:0;pointer-events:none}
.card h1{font-size:18px;line-height:1.3;margin:0 0 6px;font-weight:700}
.card p{font-size:15px;line-height:1.45;margin:0;color:var(--ink-soft)}
.card button{margin-top:12px;font:inherit;font-size:15px;color:var(--paper);background:var(--seal);border:0;border-radius:999px;padding:9px 18px;min-height:44px;cursor:pointer}
.card button:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
@media (min-width:760px){.card{right:auto;width:360px;left:28px;bottom:28px}}
@media (prefers-reduced-motion:reduce){.card{transition:none}}
</style></head><body>
<canvas id="c" aria-label="The Stores room inside the Gourd Star. Tap a thing on the floor, then tap where it goes."></canvas>
<div class="card" id="card" role="status" aria-live="polite"><h1 id="cardT"></h1><p id="cardP"></p><button id="again" hidden>Play it again</button></div>
<script>window.STORES=${esc(world)};</script>
<script src="${ALTITUDE_JS}"></script>
<script>
(function () {
  const W0 = window.STORES, cv = document.getElementById('c'), ctx = cv.getContext('2d')
  const cT = document.getElementById('cardT'), cP = document.getElementById('cardP'), again = document.getElementById('again'), card = document.getElementById('card')
  const DAY = W0.demo ? 'A practice run' : W0.day ? new Date(W0.day + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }) + "'s run" : ''
  AltR9.storesRun(W0.things, W0.beads)
  let W = 0, H = 0, dpr = 1, failed = null, shown = ''
  function size() { dpr = Math.min(3, window.devicePixelRatio || 1); W = window.innerWidth; H = window.innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr) }
  window.addEventListener('resize', size); size()
  window.StoresOnPlace = function (thing, where) {
    if (W0.demo) return
    const body = { board: 'council', collection: 'stores', docId: (W0.run + '~' + thing.id).replace(/[\\\\/]/g, '.').slice(0, 200), mode: 'set',
      data: { run: W0.run, thing: thing.id, kind: thing.kind, words: thing.words, to: where, savedAt: new Date().toISOString() } }
    fetch('/api/board/saves', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) return r.text().then(function (t) { failed = 'It did not save (' + r.status + '): ' + t.slice(0, 160) }) })
      .catch(function (e) { failed = 'It did not save: ' + e.message })
  }
  function say(t, p, end) {
    const key = t + '|' + p + '|' + !!end
    if (key === shown) return
    shown = key; cT.textContent = t; cP.textContent = p; again.hidden = !end || !W0.demo; card.classList.toggle('away', !t)
  }
  const INTRO = [DAY ? 'The Stores' : 'The Stores are quiet',
    DAY ? DAY + ' has come home, and what it left has drifted in across the floor. Tap one thing to pick it up.' + (W0.demo ? ' Nothing you place here is saved.' : '')
        : 'Every run up to today is closed. What today leaves will be on the floor tomorrow.']
  function words() {
    if (failed) return say('The store did not take that', failed)
    const s = AltR9.storesState()
    if (!s || !s.items.length) return say(...INTRO)
    if (s.done) return say(DAY + ' is closed', 'Kept things are on the shelf, lessons wait as seeds, and what you let go feeds the compost with its words kept. The berth is free.', true)
    if (s.msg && s.held) return say(AltR9.storesName(s.held.kind), '\\u201c' + s.held.words + '.\\u201d ' + s.msg)
    if (s.held) return say(AltR9.storesName(s.held.kind), '\\u201c' + s.held.words + '.\\u201d ' + AltR9.storesHint(s.held.kind))
    if (s.plan) return say('', '')
    if (s.items.every(function (q) { return q.st === 'floor' })) return say(...INTRO)
    return say('', '')
  }
  function loop(ms) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    AltR9.storesFrame(ctx, W, H, { phone: W < 760, t: ms / 1000 })
    words()
    requestAnimationFrame(loop)
  }
  cv.addEventListener('pointerdown', function (e) { failed = null; AltR9.storesTap(e.clientX, e.clientY) })
  again.addEventListener('click', function () { AltR9.storesRun(W0.things, W0.beads) })
  requestAnimationFrame(loop)
})()
</script>
</body></html>`
}
