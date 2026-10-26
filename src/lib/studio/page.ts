/** The studio boat page (/board/studio): the face ships' altitude loop on one canvas, ported from round 9
 * (studio-lot.md, council #397), and round 10's fleet: the six face ships in convoy on one qi current. The page carries
 * the fleet's world as data (fleet.ts) and the renderer is public/studio/altitude.js. Nothing in the scene is text, a
 * number or a panel (the depth rule).
 * URL: the fleet is behind a flag (council #412): ?fleet=1 opens the fleet (FLEET_DEFAULT flips it on for everyone);
 * ?fleet=1&ship=<id> opens straight at a ship. Without the flag the page is #442's Orrery loop. ?phase=run|dock|intake|launch
 * opens a ship at that phase (&t=seconds, &hold=1 freezes, &phone=1 lays it out at 390 x 844, &auto=1 keeps the ghost
 * hand); ?demo=1 plays the demo world instead of the board's; ?grid=run@3,dock@3&cols=2 draws a sheet. */
import { demoFleet, type FleetWorld } from './fleet'

/** Flip to true to make the fleet the page's default view. */
export const FLEET_DEFAULT = true

export const ALTITUDE_JS = '/studio/altitude.js?v=6'

export function studioPage(world: FleetWorld): string {
  const data = JSON.stringify(world).replace(/</g, '\\u003c')
  const demo = JSON.stringify(demoFleet(new Date(world.at))).replace(/</g, '\\u003c')
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#24205a">
<title>Studio Boat</title>
<style>html,body{margin:0;height:100%;background:#24205a;overflow:hidden;overscroll-behavior:none}canvas{display:block;margin:0 auto;touch-action:manipulation;cursor:pointer}</style>
</head><body>
<canvas id="c" aria-label="The face ships under way. Rooms whose work landed send up seeds; at the harbour they are spent on the ship."></canvas>
<script>window.FLEET=${data};window.FLEET_DEMO=${demo};window.FLEET_DEFAULT=${FLEET_DEFAULT};</script>
<script src="${ALTITUDE_JS}"></script>
<script>
// The studio boat: the fleet (behind ?fleet=1) and each ship's loop (run, dock, intake, launch), driven by window.FLEET.
// URL: ?fleet=1 opens the fleet, &ship=<id> opens a ship; ?phase=run|dock|intake|launch opens a ship at that phase
// (&t=seconds into it, &hold=1 freezes the frame, &auto=1 lets the ghost hand play the intake), &phone=1 lays it out at
// 390 x 844, &demo=1 plays the demo world. Probe sheets: ?grid=run@3,dock@3&cols=2&gw=1600&gh=1000 (&ship=<id>).
;(function () {
  const q = new URLSearchParams(location.search), A = window.AltR9, demo = q.get('demo') === '1'
  const fleet = demo ? window.FLEET_DEMO : window.FLEET
  const fleetOn = q.get('fleet') === '1' || q.get('view') === 'fleet' || (window.FLEET_DEFAULT && q.get('fleet') !== '0')
  const ids = fleet.ships.map(function (s) { return s.id })
  let shipId = ids.indexOf(q.get('ship')) >= 0 && fleetOn ? q.get('ship') : 'orrery'
  let mode = fleetOn && !q.get('ship') && !q.get('phase') ? 'fleet' : 'ship'
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
  // the Orrery keeps round 9's own world (null plays round 9's demo); every other ship brings its ShipWorld
  function opts1() {
    const sw = fleet.ships.find(function (s) { return s.id === shipId })
    return shipId === 'orrery' ? { world: demo ? null : fleet.orrery, ship: null } : { world: null, ship: sw }
  }
  if (grid) { // a contact sheet of exact states, each drawn at 1600 x 1000 (or 390 x 844 with &phone=1) and scaled into its cell
    const cells = grid.split(','), cols = +(q.get('cols') || cells.length), rows = Math.ceil(cells.length / cols)
    const fw = phone ? 390 : 1600, fh = phone ? 844 : 1000, cw = W / cols, ch = H / rows, sc = Math.min(cw / fw, ch / fh)
    g.fillStyle = '#1b1846'; g.fillRect(0, 0, W, H)
    cells.forEach(function (c, i) {
      const pt = c.split('@'), x = (i % cols) * cw, y = Math.floor(i / cols) * ch, o = opts1()
      g.save(); g.translate(x + (cw - fw * sc) / 2, y + (ch - fh * sc) / 2); g.scale(sc, sc); g.beginPath(); g.rect(0, 0, fw, fh); g.clip()
      if (pt[0] === 'fleet') A.fleetFrame(g, fw, fh, { phone: phone, t: +pt[1], fleet: fleet })
      else A.frame(g, fw, fh, { phone: phone, phase: pt[0], t: +pt[1], world: o.world, ship: o.ship })
      g.restore(); g.strokeStyle = '#1b1846'; g.lineWidth = 4; g.strokeRect(x, y, cw, ch)
    })
    document.title = 'done'; return
  }
  const isPhone = function () { return phone || W / H < 0.8 }
  // The intake is played, not watched: the clock stops at each of the player's moves and waits for their tap (the
  // store, then the room being deepened, then the store again to pay for the hull). &auto=1 plays the ghost hand.
  const auto = q.get('auto') === '1'
  let waits = []
  function setWaits() {
    const o = opts1(), w = o.ship || o.world
    waits = auto || hold ? [] : [['store', 1.8, 2.0]]
      .concat(!w || w.spent ? [['chart', 3.3, 3.5]] : [])
      .concat(!w || w.opens ? [['hull', 9.3, 9.4]] : [])
  }
  setWaits()
  let T = 0, FT = +(q.get('t') || 0)
  const p0 = q.get('phase')
  if (mode === 'ship' && p0 && A.START[p0] !== undefined) T = A.START[p0] + Math.min(+(q.get('t') || 0), A.DUR[p0] - 0.01)
  let taps = {}, done = {}, idle = 0, waitIdle = 0, last = performance.now(), lastIntake = -1
  let trans = null // sailing in to a ship or back out to the fleet: { kind, f, box }
  const waiting = function (s) { return mode === 'ship' && s.phase === 'intake' ? waits.find(function (w) { return !done[w[0]] && s.t >= w[1] - 0.001 }) : undefined }
  function drawShip(veil0) {
    const s = A.at(T), o = opts1()
    if (s.phase !== 'intake' && lastIntake >= 0) { taps = {}; done = {}; lastIntake = -1 }
    if (s.phase === 'intake') lastIntake = s.t
    const w = waiting(s)
    let veil = veil0 || 0
    if (!hold) { if (s.phase === 'launch') veil = Math.max(veil, (s.t - 5.3) / 0.7); if (s.phase === 'run') veil = Math.max(veil, 1 - s.t / 0.7) }
    A.frame(g, W, H, { phone: isPhone(), phase: s.phase, t: s.t, veil: veil, taps: taps, noHand: !auto, world: o.world, ship: o.ship, idle: idle,
                       hint: w ? { at: w[0], idle: waitIdle } : null, back: fleetOn })
  }
  function drawFleet(zoom) {
    if (zoom) { // the camera sails in on one ship: scale about its box and bring it to the middle
      const b = zoom.box, cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, e = zoom.e
      const sMax = Math.min(W / (b[2] - b[0]), H / (b[3] - b[1])) * 0.8, s = 1 + (sMax - 1) * e
      const tx = cx + (W / 2 - cx) * e, ty = cy + (H / 2 - cy) * e
      g.setTransform(dpr * s, 0, 0, dpr * s, dpr * (tx - cx * s), dpr * (ty - cy * s))
    }
    A.fleetFrame(g, W, H, { phone: isPhone(), t: FT, fleet: fleet })
    if (zoom) { g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = 'rgba(36,32,90,' + Math.min(1, zoom.e * zoom.e * 1.2) + ')'; g.fillRect(0, 0, W, H) }
  }
  function draw() {
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (trans && trans.kind === 'out' && trans.f < 0.35) { drawShip(trans.f / 0.35); return }
    if (trans) { const f = trans.kind === 'in' ? trans.f : 1 - (trans.f - 0.35) / 0.65, e = f * f * (3 - 2 * f); drawFleet({ box: trans.box, e: e }); return }
    if (mode === 'fleet') drawFleet(null); else drawShip(0)
  }
  function openShip(id) { shipId = id; mode = 'ship'; T = 0; taps = {}; done = {}; idle = 0; waitIdle = 0; lastIntake = -1; setWaits() }
  function tick(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now
    if (!hold) {
      FT += dt
      if (trans) {
        trans.f += dt / (trans.kind === 'in' ? 0.9 : 1.0)
        if (trans.f >= 1) { const t0 = trans; trans = null; if (t0.kind === 'in') openShip(t0.id); else mode = 'fleet' }
      } else if (mode === 'ship') {
        const s = A.at(T), w = waiting(s)
        if (w) { T = A.START.intake + w[1]; idle += dt; waitIdle += dt } else T += dt
      }
    }
    draw(); if (!hold) requestAnimationFrame(tick)
  }
  function sailIn(id) { const b = A.fleetBox(id); if (!b) return; if (hold) { openShip(id); draw(); return } trans = { kind: 'in', f: 0, box: b, id: id } }
  function sailOut() { if (!fleetOn) return; const b = A.fleetBox(shipId) || [W * 0.4, H * 0.4, W * 0.6, H * 0.6]; if (hold) { mode = 'fleet'; draw(); return } trans = { kind: 'out', f: 0, box: b } }
  cv.addEventListener('pointerdown', function (e) {
    if (trans) return
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top
    if (mode === 'fleet') { const id = A.fleetHit(x, y); if (id) sailIn(id); return }
    const s = A.at(T), what = A.hit(x, y)
    if (what === 'back') { sailOut(); return }
    if (s.phase !== 'intake') { if (what === 'water') sailOut(); return }
    const w = waiting(s)
    if (w) {
      // the right place, or anywhere once the hand has shown where; a first miss calls the hand at once
      const right = w[0] === 'chart' ? what === 'chart' : what === 'store'
      if (!right && waitIdle < 2.2) { waitIdle = 2.2; return }
      done[w[0]] = true; taps[w[0]] = [x, y]; T = A.START.intake + w[2]; waitIdle = 0
    } else if (auto) {
      const o = opts1(), ww = o.ship || o.world
      if (what === 'store' && s.t < 2.0) { T = A.START.intake + 2.0; taps.store = [x, y] }
      else if (what === 'chart' && (!ww || ww.spent) && s.t >= 2.0 && s.t < 3.5) { T = A.START.intake + 3.5; taps.chart = [x, y] }
    }
    if (hold) draw()
  })
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && mode === 'ship' && !trans) sailOut() })
  addEventListener('resize', function () { size(); if (hold) draw() })
  window.__seek = function (phase, t) { T = A.START[phase] + t; draw() }
  window.__open = function (id) { openShip(id); draw() }
  window.__fleet = function () { mode = 'fleet'; trans = null; draw() }
  window.__state = function () { return { mode: mode, ship: shipId, phase: A.at(T).phase, t: A.at(T).t, T: T } }
  draw(); document.title = 'done'
  if (!hold) requestAnimationFrame(function (n) { last = n; tick(n) })
})()
</script>
</body></html>`
}
