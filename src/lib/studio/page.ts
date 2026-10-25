/** The studio boat page (/board/studio): the face ships' altitude loop on one canvas, ported from round 9
 * (studio-lot.md, council #397). The page carries the Orrery's world as data (fleet.ts) and the renderer is
 * public/studio/altitude.js. Nothing in the scene is text, a number or a panel (the depth rule).
 * URL: ?phase=run|dock|intake|launch opens at that phase (&t=seconds, &hold=1 freezes, &phone=1 lays it out at
 * 390 x 844); ?demo=1 plays round 9's own demo world instead of the board's; ?grid=run@3,dock@3&cols=2 draws a sheet. */
import type { OrreryWorld } from './fleet'

export const ALTITUDE_JS = '/studio/altitude.js?v=3'

export function studioPage(world: OrreryWorld): string {
  const data = JSON.stringify(world).replace(/</g, '\\u003c')
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#24205a">
<title>Studio Boat</title>
<style>html,body{margin:0;height:100%;background:#24205a;overflow:hidden;overscroll-behavior:none}canvas{display:block;margin:0 auto;touch-action:manipulation;cursor:pointer}</style>
</head><body>
<canvas id="c" aria-label="The Clockwork Orrery under way. Rooms whose work landed send up seeds; at the harbour they are spent on the ship."></canvas>
<script>window.FLEET=${data};</script>
<script src="${ALTITUDE_JS}"></script>
<script>
// The studio boat: the Clockwork Orrery's loop (run, dock, intake, launch), autoplaying, driven by window.FLEET.
// URL: ?phase=run|dock|intake|launch opens at that phase (&t=seconds into it, &hold=1 freezes the frame,
// &auto=1 lets the ghost hand play the intake), &phone=1 lays it out at 390 x 844. Probe sheets: ?grid=run@3,dock@3&cols=2&gw=1600&gh=1000.
;(function () {
  const q = new URLSearchParams(location.search), A = window.AltR9, world = q.get('demo') === '1' ? null : window.FLEET
  const cv = document.getElementById('c'), g = cv.getContext('2d')
  const phone = q.get('phone') === '1', hold = q.get('hold') === '1'
  const grid = q.get('grid')
  let W, H, dpr = Math.min(2, window.devicePixelRatio || 1)
  function size() {
    if (grid) { W = +(q.get('gw') || 1600); H = +(q.get('gh') || 1000); dpr = 1 }
    else if (phone) { W = Math.min(390, innerWidth); H = Math.min(844, innerHeight) }
    else { W = innerWidth; H = innerHeight }
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'
  }
  size()
  if (grid) { // a contact sheet of exact states, each drawn at 1600 x 1000 (or 390 x 844 with &phone=1) and scaled into its cell
    const cells = grid.split(','), cols = +(q.get('cols') || cells.length), rows = Math.ceil(cells.length / cols)
    const fw = phone ? 390 : 1600, fh = phone ? 844 : 1000, cw = W / cols, ch = H / rows, sc = Math.min(cw / fw, ch / fh)
    g.fillStyle = '#1b1846'; g.fillRect(0, 0, W, H)
    cells.forEach((c, i) => {
      const [ph, tt] = c.split('@'), x = (i % cols) * cw, y = Math.floor(i / cols) * ch
      g.save(); g.translate(x + (cw - fw * sc) / 2, y + (ch - fh * sc) / 2); g.scale(sc, sc); g.beginPath(); g.rect(0, 0, fw, fh); g.clip()
      A.frame(g, fw, fh, { phone, phase: ph, t: +tt, world }); g.restore()
      g.strokeStyle = '#1b1846'; g.lineWidth = 4; g.strokeRect(x, y, cw, ch)
    })
    document.title = 'done'; return
  }
  const isPhone = () => phone || W / H < 0.8
  // The intake is played, not watched: the clock stops at each of the player's moves and waits for their tap (the
  // store, then the star chart, then the store again to pay for the hull). &auto=1 plays round 9's ghost hand instead.
  const auto = q.get('auto') === '1'
  const waits = auto || hold ? [] : [['store', 1.8, 2.0]]
    .concat(!world || world.spent ? [['chart', 3.3, 3.5]] : [])
    .concat(!world || world.opens ? [['hull', 9.3, 9.4]] : [])
  let T = 0
  const p0 = q.get('phase')
  if (p0 && A.START[p0] !== undefined) T = A.START[p0] + Math.min(+(q.get('t') || 0), A.DUR[p0] - 0.01)
  let taps = {}, done = {}, idle = 0, waitIdle = 0, last = performance.now(), lastIntake = -1
  const waiting = (s) => s.phase === 'intake' ? waits.find(w => !done[w[0]] && s.t >= w[1] - 0.001) : undefined
  function draw() {
    const s = A.at(T)
    if (s.phase !== 'intake' && lastIntake >= 0) { taps = {}; done = {}; lastIntake = -1 }
    if (s.phase === 'intake') lastIntake = s.t
    const w = waiting(s)
    let veil = 0
    if (!hold) { if (s.phase === 'launch') veil = Math.max(0, (s.t - 5.3) / 0.7); if (s.phase === 'run') veil = Math.max(0, 1 - s.t / 0.7) }
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    A.frame(g, W, H, { phone: isPhone(), phase: s.phase, t: s.t, veil, taps, noHand: !auto, world, idle,
                       hint: w ? { at: w[0], idle: waitIdle } : null })
  }
  function tick(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now
    if (!hold) {
      const s = A.at(T), w = waiting(s)
      if (w) { T = A.START.intake + w[1]; idle += dt; waitIdle += dt } else T += dt
    }
    draw(); if (!hold) requestAnimationFrame(tick)
  }
  // a real tap moves the intake on: the seed store, then the star chart, then the store again for the hull
  cv.addEventListener('pointerdown', (e) => {
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, s = A.at(T), what = A.hit(x, y)
    if (s.phase !== 'intake') return
    const w = waiting(s)
    if (w) {
      // the right place, or anywhere once the hand has shown where; a first miss calls the hand at once
      const right = w[0] === 'chart' ? what === 'chart' : what === 'store'
      if (!right && waitIdle < 2.2) { waitIdle = 2.2; return }
      done[w[0]] = true; taps[w[0]] = [x, y]; T = A.START.intake + w[2]; waitIdle = 0
    } else if (auto) {
      if (what === 'store' && s.t < 2.0) { T = A.START.intake + 2.0; taps.store = [x, y] }
      else if (what === 'chart' && (!world || world.spent) && s.t >= 2.0 && s.t < 3.5) { T = A.START.intake + 3.5; taps.chart = [x, y] }
    }
    if (hold) draw()
  })
  addEventListener('resize', () => { size(); if (hold) draw() })
  window.__seek = (phase, t) => { T = A.START[phase] + t; draw() }
  draw(); document.title = 'done'
  if (!hold) requestAnimationFrame((n) => { last = n; tick(n) })
})()
</script>
</body></html>`
}
