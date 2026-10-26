// The studio boat (/board/studio): the face ships' altitude loop, ported from round 9 (studio-tycoon/altitude-r9).
// The loop is driven by the real board: AltR9.frame(..., { world }) takes src/lib/studio/fleet.ts's OrreryWorld, so a
// room sends up a seed only when its work landed in the last run, the store holds what earlier runs left, and the
// larger hull opens at the intake only when the growth limits allow it (boat-grid-growth-limits).
// Round 9's notes, kept:
// Brief: altitude-r9/brief.md. His overrule (boat-grid-hull-six-of-eight): the ship is fixed during a run; rooms earn
// learnings (cream seeds) in their minigames, crew carry them to the store at the Hearth, and only at the next run's
// orientation intake are they spent on the ship's design. The larger hull opens per ship.
// One loop on the Clockwork Orrery, four phases: run, dock, intake, launch.
// Rules kept from r8: no panel, gauge, bar, badge, number or text in the world; altitude reads on trim and sashes only;
// amber only for alarm (rung 3 is never drawn); soft light from several sides (lantern pools, cool counter-light, the
// Hearth, the harbour), never one hard sun; nested skins, newer outside; no portholes, rockets or saucers.
// New this round: every standing figure breathes and sways; crew 1.5x the r8 size, the master 15% taller; a soft shadow
// under each figure.
// Units: x along the ship (stern left), y toward the viewer (the cut face is the front), z up.
// API: AltR9.frame(ctx, W, H, { phone, phase, t, veil, noHand, taps, hint, idle }) draws one frame; AltR9.state(phase, t);
// AltR9.hit(px, py) names what a tap at a screen point touches ('back' | 'store' | 'chart' | 'water' | null) for the last
// frame drawn. Round 10: AltR9.frame(..., { ship }) runs the same loop for any one-room ship (a fleet.ts ShipWorld), and
// AltR9.fleetFrame(ctx, W, H, { phone, t, fleet }) draws the six ships in convoy; fleetHit/fleetBox name a tapped ship.
// The Shaman's loop (?shaman=1): AltR9.shamanFrame draws the Gourd Star's eight rooms; see its section for the API.
;(function () {
  const TAU = Math.PI * 2
  // the six altitudes in faces.yaml order; amber (3) is never drawn this round
  const RUNG = { 1: '#d8509f', 2: '#d64a3e', 3: '#e9a43a', 4: '#f08a3c', 5: '#4caf6e', 6: '#2fb0a8' }
  const SK = {
    lite: '#a6e0f4', acc: '#d0f4ff', glow: '#8ae4ff', skinNew: '#7cc3e6', skinOld: '#3f86b9', core: '#245a86', deep: '#163a58',
    deck: '#bfe1f0', deckSide: '#5d9fca', wallLoom: '#9fd2ec', wallChart: '#8daee0', wallFoundry: '#a4bfe8',
    skinBig: '#b8ecf8', skinBig2: '#93d6ee'
  }
  const FLOOR = '#f4e8d4', SEED = '#fff1c8', SKIN_TONE = '#f0d2b8'
  const AX = [0.92, 0.24], AY = [-0.64, 0.36]
  let g, k = 40, ox = 0, oy = 0, CREW = 22 / 1.5, S = null
  // round 9's demo world: every room landed, three seeds carried, the chart deepened, the hull paid for with two
  const DEMO = { landed: { loom: true, foundry: true, chart: true }, carried: 3, spent: true, opens: true, cost: 2 }
  let Wd = DEMO
  const HIT = { store: null, chart: null }

  // ---------- helpers ----------
  const clamp = (x, a, b) => Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, x))
  const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x) }
  const lerp = (a, b, f) => a + (b - a) * f
  const ramp = (t, a, b) => ease((t - a) / (b - a))
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
  function rgba(hex, a) { const p = parseInt(hex.slice(1), 16); return `rgba(${p >> 16},${(p >> 8) & 255},${p & 255},${a})` }
  function mix(a, b, f) {
    const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16)
    const c = (s) => Math.round(((p >> s) & 255) * (1 - f) + ((q >> s) & 255) * f)
    return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1)
  }
  function P(x, y, z) { return [ox + (x * AX[0] + y * AY[0]) * k, oy + (x * AX[1] + y * AY[1] - z) * k] }
  function fit(pts, rx, ry, rw, rh) {
    let a = 1e9, b = -1e9, c = 1e9, d = -1e9
    for (const [x, y, z] of pts) { const sx = x * AX[0] + y * AY[0], sy = x * AX[1] + y * AY[1] - z; a = Math.min(a, sx); b = Math.max(b, sx); c = Math.min(c, sy); d = Math.max(d, sy) }
    k = Math.min(rw / (b - a), rh / (d - c)); ox = rx + rw / 2 - ((a + b) / 2) * k; oy = ry + rh / 2 - ((c + d) / 2) * k
    return [k, ox, oy]
  }
  function path3(pts) { g.beginPath(); pts.forEach((p, i) => { const q = P(p[0], p[1], p[2]); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]) }); g.closePath() }
  function poly(pts, fill, stroke, lw) {
    path3(pts)
    if (fill) { g.fillStyle = fill; g.fill() }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 1; g.lineJoin = 'round'; g.stroke() }
  }
  function box(x0, y0, z0, x1, y1, z1, top, front, side, edge) {
    const e = edge === undefined ? 'rgba(20,30,70,0.18)' : edge
    poly([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], side, e, 0.8)
    poly([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], front, e, 0.8)
    poly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], top, e, 0.8)
  }
  function plane(kind, at, fn) {
    g.save()
    if (kind === 'z') { const o = P(0, 0, at); g.transform(AX[0] * k, AX[1] * k, AY[0] * k, AY[1] * k, o[0], o[1]) }
    if (kind === 'y') { const o = P(0, at, 0); g.transform(AX[0] * k, AX[1] * k, 0, -k, o[0], o[1]) }
    if (kind === 'x') { const o = P(at, 0, 0); g.transform(AY[0] * k, AY[1] * k, 0, -k, o[0], o[1]) }
    fn(); g.restore()
  }
  function glow(x, y, r, col, a) {
    if (r <= 0 || a <= 0) return
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0))
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill()
  }
  function glow3(x, y, z, r, col, a) { const p = P(x, y, z); glow(p[0], p[1], r * k, col, a) }
  // keyframes [[t, x, y], ...] -> where a walker is at time t, and whether it is moving
  function kf(t, keys) {
    if (t <= keys[0][0]) return { x: keys[0][1], y: keys[0][2], mv: false, dx: 0, dy: 0, seg: -1 }
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i], b = keys[i + 1]
      if (t <= b[0]) {
        const f = (t - a[0]) / (b[0] - a[0] || 1), dx = b[1] - a[1], dy = b[2] - a[2]
        return { x: a[1] + dx * f, y: a[2] + dy * f, mv: Math.abs(dx) + Math.abs(dy) > 1e-6, dx, dy, seg: i }
      }
    }
    const e = keys[keys.length - 1]; return { x: e[1], y: e[2], mv: false, dx: 0, dy: 0, seg: keys.length - 1 }
  }
  const loopT = (t, p) => ((t % p) + p) % p
  function alongLoop(pts, f) { // closed polyline, f in [0,1) by arc length
    const seg = []; let L = 0
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push([a, b, l]); L += l }
    let d = f * L
    for (const [a, b, l] of seg) { if (d <= l) { const u = d / l; return { x: lerp(a[0], b[0], u), y: lerp(a[1], b[1], u), mv: true, dx: b[0] - a[0], dy: b[1] - a[1] } } d -= l }
    return { x: pts[0][0], y: pts[0][1], mv: true, dx: 1, dy: 0 }
  }
  const faceOf = (w) => (w.dx * AX[0] + w.dy * AY[0] < -0.01 ? -1 : 1)

  // ---------- the loop: four phases, one clock ----------
  const PHASES = ['run', 'dock', 'intake', 'launch']
  const DUR = { run: 13, dock: 5, intake: 14, launch: 6 }
  const START = { run: 0, dock: 13, intake: 18, launch: 32 }, LOOP = 38, D_DOCK = 15.5
  function state(phase, t) {
    const s = { phase, t, time: START[phase] + t }
    const f = t / DUR[phase]
    if (phase === 'run') { s.D = t; s.v = 1 }
    if (phase === 'dock') { s.D = 13 + 5 * (f - f * f / 2); s.v = 1 - f }
    if (phase === 'intake') { s.D = D_DOCK; s.v = 0 }
    if (phase === 'launch') { s.D = D_DOCK + 3 * f * f; s.v = f }
    s.harbour = phase === 'dock' ? ease(f * 1.4) : phase === 'intake' ? 1 : phase === 'launch' ? 1 - ease(f * 1.3) : 0
    s.harbourX = phase === 'dock' ? (1 - ease(f)) * 0.35 : phase === 'launch' ? -ease(f) * 0.45 : 0
    const I = phase === 'intake' ? t : phase === 'launch' ? 99 : -1
    const L = Wd.landed, run = phase === 'run'
    const pI = Wd.spent ? I : -1, hI = Wd.opens ? I : -1 // the promotion and the hull play only when the world allows
    // seeds in the store: what earlier runs left, one for each room whose work landed this run, then the intake spends
    const total = Wd.carried + (L.loom ? 1 : 0) + (L.foundry ? 1 : 0) + (L.chart ? 1 : 0)
    s.storeN = run ? Wd.carried + (L.loom && t > 4.6) + (L.foundry && t > 7.6) + (L.chart && t > 12.1)
      : phase === 'dock' ? total : total - (pI >= 2.0 ? 1 : 0) - (hI >= 9.6 ? Wd.cost : 0)
    s.storeGlow = phase === 'dock' && total ? 0.5 + 0.5 * Math.sin(f * Math.PI) : 0
    if (run) s.storeGlow = Math.max(L.loom ? ramp(t, 4.4, 4.6) * (1 - ramp(t, 4.6, 5.4)) : 0, L.foundry ? ramp(t, 7.4, 7.6) * (1 - ramp(t, 7.6, 8.4)) : 0, L.chart ? ramp(t, 11.9, 12.1) * (1 - ramp(t, 12.1, 12.9)) : 0)
    if (pI >= 0 && pI < 4) s.storeGlow = Math.max(s.storeGlow, ramp(pI, 1.9, 2.0) * (1 - ramp(pI, 2.0, 3.0)))
    if (hI >= 9.4 && hI < 11) s.storeGlow = Math.max(s.storeGlow, bump(hI, 9.4, 10.8))
    s.lit3 = (L.chart && (!run || t > 7.8)) || pI >= 6.3
    s.flash = { loom: run && L.loom ? bump(t, 1.0, 1.9) : 0, foundry: run && L.foundry ? bump(t, 4.6, 5.5) : 0, chart: run ? (L.chart ? bump(t, 7.8, 8.7) : 0) : pI >= 0 ? bump(pI, 6.3, 7.2) : 0 }
    // the promotion, at the intake only
    s.chartD = pI < 0 ? 1 : 1 + ramp(pI, 6.6, 8.2)
    s.chartMix = pI < 0 ? 0 : ramp(pI, 6.7, 8.0)
    s.pileN = pI < 0 ? 12 : Math.round(lerp(12, 3, ramp(pI, 8.0, 10.2)))
    s.skinLine = hI < 0 ? 0 : clamp((hI - 9.4) / 1.2)
    s.skin = hI < 0 ? 0 : ramp(hI, 10.2, 11.6)
    s.move = hI < 0 ? 0 : ramp(hI, 11.4, 13.2)
    // pulled back while the hull fills, then eased part of the way in again as the ship leaves (r9 fix-next 4)
    s.cam = hI < 0 ? 0 : phase === 'launch' ? 1 - 0.45 * ramp(t, 0.4, 4.4) : ramp(hI, 10.4, 13.0)
    s.veil = 0
    return s
  }
  function bump(t, a, b) { if (t < a || t > b) return 0; return Math.sin(((t - a) / (b - a)) * Math.PI) }

  // ---------- sky: indigo to sea-green, stars drifting while under way ----------
  function sky(W, H) {
    const u = W / 1600
    const gr = g.createLinearGradient(0, 0, 0, H)
    gr.addColorStop(0, '#24205a'); gr.addColorStop(0.45, '#3a3f86'); gr.addColorStop(0.78, '#3b7f98'); gr.addColorStop(1, '#46a99a')
    g.fillStyle = gr; g.fillRect(0, 0, W, H)
    glow(W * 0.15, H * 0.2, Math.max(W, H) * 0.45, '#8a6fd8', 0.18)
    glow(W * 0.9, H * 0.85, Math.max(W, H) * 0.5, '#7fe0c8', 0.16)
    const span = W + 60
    for (let i = 0; i < 280; i++) {
      const big = hash(i * 9.1) >= 0.93, layer = big ? 2 : hash(i * 5.3) < 0.6 ? 0 : 1, sp = [14, 30, 52][layer] * u
      let x = hash(i * 2.3) * span - S.D * sp; x = loopT(x, span) - 30
      const y = hash(i * 3.9) * H * 0.8, r = big ? 1.8 : 0.6 + hash(i) * 0.9
      const tw = 0.75 + 0.25 * Math.sin(S.time * 1.6 + i * 1.7)
      const col = i % 5 ? `rgba(255,240,236,${(0.25 + hash(i * 6) * 0.5) * tw})` : `rgba(255,170,200,${(0.4 + hash(i * 6) * 0.4) * tw})`
      if (S.v > 0.05 && layer === 2) { g.strokeStyle = col; g.lineWidth = r * 1.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + sp * 0.22 * S.v, y + sp * 0.05 * S.v); g.stroke() }
      g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill()
    }
    for (let i = 0; i < 5; i++) { // mist bands low down, drifting slower than the stars
      const x = loopT(W * (0.1 + i * 0.22) - S.D * 9 * u, W * 1.3) - W * 0.15
      g.save(); g.translate(x, H * (0.82 + 0.05 * Math.sin(i * 2))); g.scale(1, 0.12); glow(0, 0, W * 0.3, '#bff3e6', 0.1); g.restore()
    }
  }
  // the harbour: a quay of soft lamps and one arched gate; it comes in as the ship slows and falls behind at launch
  function harbour(W, H) {
    const a = S.harbour
    if (a <= 0.01) return
    let cx = W * ((S.phone ? 0.62 : 0.74) + S.harbourX), hy = H * (S.phone ? 0.72 : 0.4), u = Math.min(W / 1600, H / 1000) * (S.phone ? 1.6 : 1)
    if (S.hb) { cx = S.hb.cx; hy = S.hb.hy; u = S.hb.u } // the fleet sets its own harbour
    glow(cx, hy - 40 * u, Math.max(W, H) * 0.42, '#ffe8c6', 0.38 * a)
    glow(cx + 120 * u, hy - 10 * u, Math.max(W, H) * 0.2, '#fff4dc', 0.22 * a)
    g.save(); g.globalAlpha = a
    const qw = 900 * u, qx = cx - qw * 0.5
    const qg = g.createLinearGradient(0, hy, 0, hy + 30 * u); qg.addColorStop(0, '#3f8aa0'); qg.addColorStop(1, 'rgba(63,138,160,0)')
    g.fillStyle = qg; g.beginPath(); g.moveTo(qx, hy); g.lineTo(qx + qw, hy - 18 * u); g.lineTo(qx + qw, hy + 26 * u); g.lineTo(qx, hy + 40 * u); g.closePath(); g.fill()
    g.strokeStyle = 'rgba(255,241,210,0.7)'; g.lineWidth = 2 * u; g.beginPath(); g.moveTo(qx, hy); g.lineTo(qx + qw, hy - 18 * u); g.stroke()
    for (let i = 0; i < 8; i++) { // the quay stands on arched piers, not a flat wedge (r9 fix-next 5)
      const x = qx + 56 * u + i * 112 * u, y = hy - (x - qx) * (18 / 900) + 8 * u, r = 26 * u
      g.fillStyle = 'rgba(22,48,86,0.55)'; g.beginPath(); g.moveTo(x - r, y + 40 * u); g.lineTo(x - r, y + r * 0.9); g.arc(x, y + r * 0.9, r, Math.PI, 0); g.lineTo(x + r, y + 40 * u); g.closePath(); g.fill()
      glow(x, y + 46 * u, 30 * u, '#fff1c8', 0.12) // the lamps' light on the water under each arch
    }
    for (let i = 0; i < 11; i++) { // lamp posts
      const x = qx + 40 * u + i * 82 * u, y = hy - (i * 82 * u + 40 * u) * (18 / 900), sw = Math.sin(S.time * 1.3 + i) * 0.08
      g.strokeStyle = 'rgba(40,70,110,0.55)'; g.lineWidth = 2.2 * u; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 46 * u); g.stroke()
      glow(x, y - 50 * u, 26 * u, '#fff1c8', 0.6 + sw); g.fillStyle = '#fff8e6'; g.beginPath(); g.arc(x, y - 50 * u, 3.6 * u, 0, TAU); g.fill()
    }
    const gx = qx + qw * 0.78, gy = hy - qw * 0.78 * (18 / 900) // an arched gate on the quay, Monument Valley's arch
    g.fillStyle = 'rgba(52,96,140,0.55)'; g.beginPath(); g.moveTo(gx - 40 * u, gy); g.lineTo(gx - 40 * u, gy - 80 * u); g.arc(gx, gy - 80 * u, 40 * u, Math.PI, 0); g.lineTo(gx + 40 * u, gy); g.lineTo(gx + 24 * u, gy); g.lineTo(gx + 24 * u, gy - 80 * u); g.arc(gx, gy - 80 * u, 24 * u, 0, Math.PI, true); g.lineTo(gx - 24 * u, gy); g.closePath(); g.fill()
    glow(gx, gy - 60 * u, 60 * u, '#fff1c8', 0.5)
    g.restore()
  }

  // ---------- hull: a pod profile extruded along y, nested skins on every cut face ----------
  function profile(h, inset, upper) {
    const L = h.L - inset, top = h.top - inset, bot = h.bot - inset, p = 2.6, out = []
    for (let i = 0; i <= 64; i++) {
      const t = upper ? Math.PI * (1 - i / 64) : Math.PI * (1 + i / 64), c = Math.cos(t), s = Math.sin(t)
      out.push([h.xc + L * Math.sign(c) * Math.pow(Math.abs(c), 2 / p), (s > 0 ? top : bot) * Math.sign(s) * Math.pow(Math.abs(s), 2 / p)])
    }
    return out
  }
  function flowCurves(h, y, zMin, zMax, col, a, n, seed, drift) {
    g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineCap = 'round'
    plane('y', y, () => {
      for (let i = 0; i < n; i++) {
        const z0 = zMin + ((i + 0.5) / n) * (zMax - zMin), ph = seed + i * 1.7 + (drift || 0)
        g.lineWidth = 0.12 + 0.1 * hash(i + seed)
        g.beginPath()
        for (let s = 0; s <= 60; s++) {
          const x = h.xc - h.L + (2 * h.L * s) / 60, z = z0 + Math.sin(s / 60 * TAU * 1.2 + ph) * (zMax - zMin) * 0.12
          s ? g.lineTo(x, z) : g.moveTo(x, z)
        }
        g.stroke()
      }
    })
    g.restore()
  }
  function clipProfile(pts, y) { path3(pts.map(([x, z]) => [x, y, z])) }
  function hullLower(h, o) { // o.big: the next hull's outer skins; o.under: alpha of the underside; o.seamInner: old deck edge as a wall line
    o = o || {}
    const lo = profile(h, 0, false)
    const shade = (f) => o.big ? mix(SK.skinBig2, SK.skinBig, f) : mix(SK.core, SK.skinNew, f)
    const ua = o.under === undefined ? 1 : o.under
    if (ua > 0.01) {
      g.save(); g.globalAlpha *= ua
      for (let i = 0; i < lo.length - 1; i++) {
        const [x0, z0] = lo[i], [x1, z1] = lo[i + 1]
        const nx = z1 - z0, nz = -(x1 - x0), d = (nx * 0.7 + nz * 0.53) / Math.hypot(nx, nz)
        if (d <= -0.05) continue
        const c = shade(0.25 + 0.4 * Math.max(0, d))
        poly([[x0, h.y0, z0], [x1, h.y0, z1], [x1, h.y1, z1], [x0, h.y1, z0]], c, c, 0.6)
      }
      g.restore()
    }
    const xl = h.xc - h.L, xr = h.xc + h.L
    poly([[xl, h.y0, 0], [xr, h.y0, 0], [xr, h.y1, 0], [xl, h.y1, 0]], SK.deck, o.seamInner ? rgba('#ffffff', 0.5 * o.seamInner) : null, 2)
    plane('z', 0, () => {
      g.save(); g.globalAlpha *= 0.18; g.strokeStyle = '#ffffff'; g.lineWidth = 0.08
      for (let i = 0; i < 6; i++) { g.beginPath(); for (let s = 0; s <= 40; s++) { const x = xl + 0.5 + (s / 40) * (xr - xl - 1), y = h.y0 + 0.7 + i * (h.y1 - h.y0 - 1.4) / 5 + Math.sin(s / 6 + i) * 0.25; s ? g.lineTo(x, y) : g.moveTo(x, y) } g.stroke() }
      g.restore()
    })
    const front = (inset, col) => { const pts = profile(h, inset, false); clipProfile(pts, h.y1); g.fillStyle = col; g.fill() }
    if (o.big) { front(0, SK.skinBig); front(0.6, SK.skinBig2); front(1.2, '#4f98c4'); flowCurves(h, h.y1, -h.bot + 1.2, -0.4, SK.acc, 0.3, 3, 7, S.D * 0.3) }
    else {
      front(0, SK.skinNew); front(0.55, SK.skinOld); front(1.05, '#5fb3c4'); front(1.45, '#2f6f95')
      g.save(); clipProfile(profile(h, 1.45, false), h.y1); g.clip(); flowCurves(h, h.y1, -h.bot + 1.4, -0.4, SK.lite, 0.32, 4, h.xc, S.D * 0.4); g.restore()
    }
    const a = P(xl, h.y1, 0), b = P(xr, h.y1, 0)
    g.save(); g.strokeStyle = 'rgba(230,250,255,0.8)'; g.lineWidth = 2; g.shadowColor = '#bff4ff'; g.shadowBlur = 10
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.restore()
  }
  function bulwarkPath(h, inset) {
    const xl = h.xc - h.L + inset, xr = h.xc + h.L - inset, hb = h.bw - inset * 0.5
    g.beginPath(); g.moveTo(xl, 0)
    g.bezierCurveTo(xl - 0.6, hb * 1.4, xl + 0.4, hb * 2.6, xl + 1.6, hb * 2.3)
    g.bezierCurveTo(xl + 2.6, hb * 2.0, xl + 2.8, hb, xl + 4.2, hb)
    g.lineTo(xr - 5.0, hb)
    g.bezierCurveTo(xr - 2.6, hb, xr - 1.4, hb * 2.2, xr - 0.6, hb * 3.6)
    g.bezierCurveTo(xr, hb * 4.6, xr + 1.6, hb * 4.4, xr + 1.2, hb * 3.4)
    g.bezierCurveTo(xr + 0.9, hb * 2.7, xr + 0.1, hb * 3.0, xr + 0.4, hb * 3.5)
    g.bezierCurveTo(xr + 0.2, hb * 2.0, xr + 0.6, hb * 0.8, xr, 0)
    g.closePath()
  }
  function bulwark(h, big) {
    const outer = big ? SK.skinBig : SK.skinNew, inner = big ? SK.skinBig2 : SK.skinOld
    plane('y', h.y0, () => { bulwarkPath(h, 0); g.fillStyle = mix(outer, SK.acc, 0.45); g.fill() })
    plane('y', h.y0 + 0.7, () => {
      bulwarkPath(h, 0); g.fillStyle = outer; g.fill()
      g.save(); bulwarkPath(h, 0); g.clip()
      g.translate(0, -0.45); bulwarkPath(h, 0.35); g.fillStyle = inner; g.fill()
      g.strokeStyle = 'rgba(210,244,255,0.35)'; g.lineWidth = 0.09; g.lineCap = 'round'
      for (let i = 0; i < 3; i++) { g.beginPath(); for (let t = 0; t <= 60; t++) { const x = h.xc - h.L + 2 + (t / 60) * (2 * h.L - 4), z = 0.35 + i * 0.32 + Math.sin(t / 6 + i * 1.4 + S.D * 0.3) * 0.12; t ? g.lineTo(x, z) : g.moveTo(x, z) } g.stroke() }
      g.restore()
    })
  }
  function tail(h, len) { // the wake: long water ribbons trailing aft, flowing while under way
    len = len || S.wakeLen || 6 + 12 * S.v
    const ph = S.D * 1.6
    g.save(); g.lineCap = 'round'
    for (let i = 0; i < 4; i++) {
      g.strokeStyle = rgba(i % 2 ? SK.lite : SK.glow, (0.12 + 0.18 * S.v) - i * 0.03); g.lineWidth = (0.35 - i * 0.05) * k
      g.beginPath()
      for (let s = 0; s <= 40; s++) {
        const x = h.xc - h.L - (s / 40) * len, z = -1.2 - i * 0.9 + Math.sin(s / 5 + i + ph) * 0.6 * (s / 40), p = P(x, h.y0 + 3 + i, z)
        s ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])
      }
      g.stroke()
    }
    g.restore()
  }
  // the next hull class, one skin out: dim and closed while the ship is under way
  function ghostSkin() {
    const a = 1 - S.skin
    if (a <= 0.01) return
    g.save(); g.globalAlpha = a
    const xl = BIG.xc - BIG.L, xr = BIG.xc + BIG.L
    poly([[xl, BIG.y0, 0], [xr, BIG.y0, 0], [xr, BIG.y1, 0], [xl, BIG.y1, 0]], 'rgba(200,240,255,0.045)', 'rgba(220,245,255,0.22)', 1)
    plane('y', BIG.y0, () => { bulwarkPath(BIG, 0); g.fillStyle = 'rgba(166,224,244,0.05)'; g.fill(); g.shadowColor = '#cff6ff'; g.shadowBlur = 12; g.strokeStyle = 'rgba(255,255,255,0.32)'; g.lineWidth = 3 / k; g.stroke() })
    plane('y', BIG.y1, () => {
      const lo = profile(BIG, 0, false); g.beginPath(); lo.forEach(([x, z], i) => i ? g.lineTo(x, z) : g.moveTo(x, z)); g.closePath()
      g.fillStyle = 'rgba(166,224,244,0.06)'; g.fill(); g.shadowColor = '#cff6ff'; g.shadowBlur = 14; g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 3 / k; g.stroke()
    })
    g.restore()
  }
  // a line of light runs round the waiting hull when the rooms meet its rung
  function skinLight() {
    const p = S.skinLine
    if (p <= 0 || p >= 1 && S.skin >= 1) return
    const fade = 1 - ramp(S.phase === 'intake' ? S.t : 99, 11.2, 12.2)
    if (fade <= 0) return
    g.save(); g.globalAlpha = fade
    const draw = () => { g.setLineDash([p * 70, 70]); g.strokeStyle = 'rgba(255,250,232,0.95)'; g.lineWidth = 5 / k; g.shadowColor = '#fff1c8'; g.shadowBlur = 18; g.lineCap = 'round'; g.stroke() }
    plane('y', BIG.y0, () => { bulwarkPath(BIG, 0); draw() })
    plane('y', BIG.y1, () => { const lo = profile(BIG, 0, false); g.beginPath(); lo.forEach(([x, z], i) => i ? g.lineTo(x, z) : g.moveTo(x, z)); draw() })
    g.restore()
  }
  // closed gates where the walkway would run on into the larger hull; they open as the skin fills
  function gates() {
    const a = 1 - S.skin
    if (a <= 0.01) return
    for (const x of [-2.3, 25.4]) {
      plane('x', x, () => {
        g.save(); g.globalAlpha = a
        const yc = 8.5, w = 0.62, hh = 1.5
        g.beginPath(); g.moveTo(yc - w, 0); g.lineTo(yc - w, hh); g.arc(yc, hh, w, Math.PI, 0); g.lineTo(yc + w, 0); g.closePath()
        g.fillStyle = 'rgba(190,232,250,0.32)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 0.06; g.stroke()
        g.beginPath(); g.moveTo(yc, 0.05); g.lineTo(yc, hh + w - 0.05); g.strokeStyle = 'rgba(60,110,160,0.45)'; g.lineWidth = 0.05; g.stroke() // the shut seam
        g.restore()
      })
    }
  }

  // ---------- rooms ----------
  function room(r, draw) { // r: x0, x1, d, front, H, col, wall
    const y0 = r.front - r.d, H = r.H, col = r.col, ft = 0.18
    box(r.x0, y0, 0, r.x1, r.front, ft, FLOOR, col, mix(col, '#3a2440', 0.35))
    plane('z', ft, () => { // one tone, 6% seams
      g.save(); g.beginPath(); g.rect(r.x0, y0, r.x1 - r.x0, r.d); g.clip()
      g.strokeStyle = 'rgba(60,40,30,0.06)'; g.lineWidth = 0.03
      for (let i = Math.ceil(r.x0); i < r.x1; i++) { g.beginPath(); g.moveTo(i, y0); g.lineTo(i, r.front); g.stroke() }
      for (let j = Math.ceil(y0); j < r.front; j++) { g.beginPath(); g.moveTo(r.x0, j); g.lineTo(r.x1, j); g.stroke() }
      g.restore()
    })
    box(r.x0 - 0.25, y0 - 0.25, 0, r.x1, y0, H, mix(r.wall, '#ffffff', 0.45), r.wall, mix(r.wall, SK.deep, 0.3))
    plane('y', y0, () => {
      g.save(); g.beginPath(); g.rect(r.x0, ft, r.x1 - r.x0, H - ft); g.clip()
      const gr = g.createLinearGradient(0, H, 0, 0); gr.addColorStop(0, mix(r.wall, '#ffffff', 0.25)); gr.addColorStop(1, mix(r.wall, '#ffffff', 0.05))
      g.fillStyle = gr; g.fillRect(r.x0, 0, r.x1 - r.x0, H)
      g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineCap = 'round'
      for (let i = 0; i < 3; i++) {
        g.lineWidth = 0.07 + i * 0.03; g.beginPath()
        for (let s = 0; s <= 50; s++) { const x = r.x0 + (s / 50) * (r.x1 - r.x0), z = H * (0.55 + i * 0.12) + Math.sin(s / 7 + i * 1.3 + r.x0 + S.time * 0.25) * 0.25; s ? g.lineTo(x, z) : g.moveTo(x, z) }
        g.stroke()
      }
      g.restore()
    })
    box(r.x0 - 0.25, y0, 0, r.x0, r.front, H, mix(r.wall, '#ffffff', 0.45), mix(r.wall, SK.deep, 0.15), mix(r.wall, '#ffffff', 0.12))
    plane('x', r.x0, () => {
      if (r.d < 2.2) return
      const yc = r.front - Math.min(1.6, r.d * 0.35), w = 0.55
      g.beginPath(); g.moveTo(yc - w, ft); g.lineTo(yc - w, 1.5); g.arc(yc, 1.5, w, Math.PI, 0, true); g.lineTo(yc + w, ft); g.closePath()
      const gr = g.createLinearGradient(0, ft, 0, 2.1); gr.addColorStop(0, '#fff3dc'); gr.addColorStop(1, '#ffe2c8'); g.fillStyle = gr; g.fill()
    })
    draw(y0, ft)
    const lx1 = r.x0 + Math.min(1.8, (r.x1 - r.x0) * 0.3)
    poly([[r.x0 - 0.25, y0 - 0.25, H], [r.x1, y0 - 0.25, H], [r.x1, y0, H], [r.x0, y0, H], [r.x0, r.front, H], [r.x0 - 0.25, r.front, H]], col, null)
    poly([[r.x0 - 0.2, r.front - 0.22, H], [lx1, r.front - 0.22, H], [lx1, r.front, H], [r.x0 - 0.2, r.front, H]], mix(col, '#ffffff', 0.45), null)
    plane('y', r.front, () => {
      g.beginPath(); g.roundRect(r.x0 - 0.25, H - 0.3, lx1 - r.x0 + 0.25, 0.3, 0.15); g.fillStyle = col; g.fill()
      g.strokeStyle = rgba('#ffffff', 0.55); g.lineWidth = 0.05; g.lineCap = 'round'; g.beginPath(); g.moveTo(r.x0 - 0.1, H - 0.07); g.lineTo(lx1 - 0.15, H - 0.07); g.stroke()
    })
    { const a = P(r.x0, r.front, ft), b = P(r.x1, r.front, ft); g.strokeStyle = rgba('#ffffff', 0.55); g.lineWidth = Math.max(1, 0.04 * k); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke() }
  }
  function sortDraw(items) { items.sort((a, b) => (a.x * AX[1] + a.y * AY[1]) - (b.x * AX[1] + b.y * AY[1])).forEach((i) => i.f()) }

  // ---------- machines ----------
  function loom(cx, cy, z, flash, ph) {
    const fw = '#e8cba3', ff = '#d1ad83', fs = '#ad8762', w = 0.8
    box(cx - w, cy - 0.4, z, cx - w + 0.12, cy + 0.4, z + 0.12, fw, ff, fs)
    box(cx + w - 0.12, cy - 0.4, z, cx + w, cy + 0.4, z + 0.12, fw, ff, fs)
    box(cx - w, cy - 0.06, z, cx - w + 0.12, cy + 0.06, z + 1.95, fw, ff, fs)
    plane('y', cy, () => {
      const x0 = cx - w + 0.14, x1 = cx + w - 0.14
      g.fillStyle = '#fbf3e4'; g.fillRect(x0, z + 0.32, x1 - x0, 0.78)
      g.save(); g.beginPath(); g.rect(x0, z + 0.32, x1 - x0, 0.78); g.clip(); g.lineCap = 'round'
      ;[[SK.skinOld, 0.5], [SK.skinNew, 0.68], ['#e98fb8', 0.86], [SK.skinOld, 1.0]].forEach(([c, zz], i) => {
        g.strokeStyle = c; g.lineWidth = 0.085; g.beginPath()
        for (let s = 0; s <= 30; s++) { const x = x0 + (s / 30) * (x1 - x0), y = z + zz + Math.sin(s / 4 + i) * 0.05; s ? g.lineTo(x, y) : g.moveTo(x, y) }
        g.stroke()
      })
      g.restore()
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 0.025
      for (let i = 0; i <= 10; i++) { const x = x0 + (i / 10) * (x1 - x0); g.beginPath(); g.moveTo(x, z + 1.1); g.lineTo(x, z + 1.78); g.stroke() }
    })
    box(cx - w, cy - 0.07, z + 1.06, cx + w, cy + 0.07, z + 1.16, fw, ff, fs)
    box(cx - w - 0.05, cy - 0.08, z + 1.78, cx + w + 0.05, cy + 0.08, z + 1.92, fw, ff, fs)
    box(cx + w - 0.12, cy - 0.06, z, cx + w, cy + 0.06, z + 1.95, fw, ff, fs)
    const sx = Math.sin(S.time * 2.2 + (ph || 0)) * 0.45, s = P(cx + sx, cy + 0.09, z + 1.12) // the shuttle runs
    g.fillStyle = '#7a5a8e'; g.beginPath(); g.ellipse(s[0], s[1], 0.2 * k, 0.05 * k, -0.25, 0, TAU); g.fill()
    if (flash > 0) glow3(cx, cy + 0.1, z + 0.75, 1.3, SEED, 0.75 * flash)
  }
  function spoolBasket(x, y, z) {
    box(x - 0.3, y - 0.22, z, x + 0.3, y + 0.22, z + 0.22, '#d9b88c', '#c49f74', '#a58360')
    ;[[SK.skinOld, -0.14], ['#e98fb8', 0.04], [SK.skinNew, 0.18]].forEach(([c, dx]) => { const p = P(x + dx, y, z + 0.3); g.fillStyle = c; g.beginPath(); g.arc(p[0], p[1], 0.1 * k, 0, TAU); g.fill() })
  }
  function cylinder(cx, cy, z0, z1, r, top, side) {
    const n = 40, ring = (z) => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * TAU) * r, cy + Math.sin((i / n) * TAU) * r, z])
    const a = ring(z0), b = ring(z1)
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; poly([a[i], a[j], b[j], b[i]], side, side, 0.5) }
    poly(b, top, null)
  }
  function starTable(cx, cy, z, lit3, flash) {
    cylinder(cx, cy, z, z + 0.7, 0.1, '#c9c2e6', '#a69fcd')
    cylinder(cx, cy, z + 0.7, z + 0.8, 0.5, '#20306e', '#8f98d0')
    const st = [[-0.25, -0.15, 1], [0.05, 0.2, 1], [0.28, -0.12, lit3 ? 1 : 0]]
    plane('z', z + 0.8, () => {
      g.strokeStyle = 'rgba(255,246,216,0.55)'; g.lineWidth = 0.025; g.beginPath(); g.moveTo(cx + st[0][0], cy + st[0][1]); g.lineTo(cx + st[1][0], cy + st[1][1]); g.stroke()
      if (!lit3) g.setLineDash([0.04, 0.05])
      g.beginPath(); g.moveTo(cx + st[1][0], cy + st[1][1]); g.lineTo(cx + st[2][0], cy + st[2][1]); g.stroke(); g.setLineDash([])
      st.forEach(([dx, dy, lit]) => { g.fillStyle = lit ? '#fff6d8' : '#0c1236'; g.beginPath(); g.arc(cx + dx, cy + dy, lit ? 0.07 : 0.06, 0, TAU); g.fill() })
    })
    st.forEach(([dx, dy, lit]) => lit && st3(cx + dx, cy + dy, z + 0.8))
    const rot = S.time * 0.5, p = P(cx, cy, z + 1.35) // the small orrery turns
    g.strokeStyle = 'rgba(235,240,255,0.8)'; g.lineWidth = Math.max(1, 0.03 * k)
    g.beginPath(); g.ellipse(p[0], p[1], 0.32 * k, 0.1 * k, -0.2, 0, TAU); g.stroke()
    g.fillStyle = '#cfe9ff'; g.beginPath(); g.arc(p[0], p[1], 0.09 * k, 0, TAU); g.fill()
    g.fillStyle = '#ffd9ec'; g.beginPath(); g.arc(p[0] + Math.cos(rot) * 0.3 * k, p[1] + Math.sin(rot) * 0.09 * k, 0.05 * k, 0, TAU); g.fill()
    const q = P(cx, cy, z + 0.8); g.strokeStyle = 'rgba(235,240,255,0.6)'; g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(p[0], p[1]); g.stroke()
    if (flash > 0) glow3(cx + 0.28, cy - 0.12, z + 0.9, 1.4, SEED, 0.8 * flash)
  }
  function st3(x, y, z) { glow3(x, y, z, 0.22, '#fff6d8', 0.7) }
  function kiln(cx, cy, z, flash) {
    const p = P(cx, cy, z), s = k
    g.save(); g.translate(p[0], p[1])
    const gr = g.createLinearGradient(-0.8 * s, 0, 0.8 * s, 0); gr.addColorStop(0, '#f0ddd0'); gr.addColorStop(1, '#c9aeb0')
    g.fillStyle = gr
    g.beginPath(); g.moveTo(-0.75 * s, 0); g.bezierCurveTo(-0.85 * s, -1.2 * s, -0.35 * s, -1.75 * s, 0, -1.8 * s); g.bezierCurveTo(0.35 * s, -1.75 * s, 0.85 * s, -1.2 * s, 0.75 * s, 0); g.closePath(); g.fill()
    g.fillStyle = '#d9c4bf'; g.fillRect(-0.12 * s, -2.3 * s, 0.24 * s, 0.6 * s)
    g.fillStyle = '#5a2030'; g.beginPath(); g.ellipse(0.05 * s, -0.5 * s, 0.3 * s, 0.34 * s, 0, Math.PI, 0); g.lineTo(0.35 * s, -0.15 * s); g.lineTo(-0.25 * s, -0.15 * s); g.closePath(); g.fill()
    const fl = 0.85 + 0.15 * Math.sin(S.time * 5.3) * Math.sin(S.time * 2.1)
    const m = g.createRadialGradient(0.05 * s, -0.35 * s, 0, 0.05 * s, -0.35 * s, 0.35 * s); m.addColorStop(0, '#ffe3d0'); m.addColorStop(0.5, '#ff7f66'); m.addColorStop(1, 'rgba(214,74,62,0.2)')
    g.globalAlpha = fl; g.fillStyle = m; g.beginPath(); g.ellipse(0.05 * s, -0.36 * s, 0.24 * s, 0.24 * s, 0, 0, TAU); g.fill(); g.globalAlpha = 1
    g.restore()
    glow(p[0] + 0.05 * k, p[1] - 0.35 * k, 1.4 * k, '#ff8a70', 0.24 * fl + 0.3 * flash)
  }
  function mould(x, y, z) {
    box(x - 0.45, y - 0.2, z, x + 0.45, y + 0.2, z + 0.16, '#8a7a8c', '#6e6074', '#5a4e62')
    poly([[x - 0.3, y - 0.06, z + 0.165], [x + 0.3, y - 0.06, z + 0.165], [x + 0.3, y + 0.06, z + 0.165], [x - 0.3, y + 0.06, z + 0.165]], '#ffb39e', null)
    glow3(x, y, z + 0.2, 0.6, '#ff8a70', 0.35)
  }
  function hearth(cx, cy) {
    cylinder(cx, cy, 0, 0.32, 1.05, '#e7f5fb', '#8fc6e4')
    cylinder(cx, cy, 0.32, 0.62, 0.42, '#c6e6f5', '#7fb8de')
    glow3(cx, cy, 1.0, 2.6, '#ffe2cc', 0.4)
    const p = P(cx, cy, 0.62), s = k, f = Math.sin(S.time * 3.1) * 0.06
    g.save(); g.translate(p[0], p[1])
    const fg = g.createLinearGradient(0, 0, 0, -1.1 * s); fg.addColorStop(0, '#ffd0c0'); fg.addColorStop(0.6, '#fff1e2'); fg.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = fg; g.beginPath(); g.moveTo(-0.3 * s, 0); g.bezierCurveTo(-0.35 * s, -0.5 * s, (0.05 + f) * s, -0.6 * s, f * s, -(1.1 + f) * s); g.bezierCurveTo((0.25 + f) * s, -0.7 * s, 0.4 * s, -0.4 * s, 0.3 * s, 0); g.closePath(); g.fill()
    g.restore()
  }
  // the seed store at the Hearth: a round woven granary; its heap is the only count, and it is never a number
  function store(cx, cy) {
    const gl = S.storeGlow
    glow3(cx, cy, 0.6, 1.6, SEED, 0.25 + 0.4 * gl)
    cylinder(cx, cy, 0, 0.42, 0.48, '#efd8b0', '#d6b88a')
    plane('z', 0.42, () => { g.fillStyle = '#7a5c40'; g.beginPath(); g.ellipse(cx, cy, 0.38, 0.38, 0, 0, TAU); g.fill() })
    const pts = [[0, 0, 0], [-0.17, 0.08, 0], [0.17, -0.06, 0], [0.04, -0.2, 0], [-0.06, 0.2, 0], [0.0, 0.0, 0.12], [0.1, 0.12, 0.1]]
    for (let i = 0; i < Math.min(S.storeN, pts.length); i++) seed(cx + pts[i][0], cy + pts[i][1], 0.46 + pts[i][2], 0.3 + 0.5 * gl, 0.85)
    { const a = P(cx - 0.48, cy, 0.42), b = P(cx + 0.48, cy, 0.42); g.strokeStyle = 'rgba(255,248,230,0.7)'; g.lineWidth = Math.max(1, 0.04 * k); g.beginPath(); g.ellipse((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.48 * k * 0.95, 0.48 * k * 0.42, 0.25, 0, TAU); g.stroke() }
  }
  function seed(x, y, z, gl, sc) { // a cream seed: learning, carried and stored, spent only at the intake
    const p = P(x, y, z), r = 0.13 * (sc || 1) * k
    glow(p[0], p[1], r * 3.4, SEED, 0.35 + 0.45 * (gl || 0))
    g.save(); g.translate(p[0], p[1]); g.rotate(-0.5)
    const gr = g.createRadialGradient(-r * 0.3, -r * 0.4, 0, 0, 0, r * 1.3); gr.addColorStop(0, '#fffdf4'); gr.addColorStop(1, '#f3dca8')
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, r * 0.78, r * 1.1, 0, 0, TAU); g.fill()
    g.strokeStyle = 'rgba(190,150,90,0.55)'; g.lineWidth = Math.max(0.6, r * 0.12); g.beginPath(); g.moveTo(0, -r * 0.8); g.quadraticCurveTo(r * 0.25, 0, 0, r * 0.8); g.stroke()
    g.restore()
  }
  function lantern(cx, cy, zl) {
    const sw = Math.sin(S.time * 0.9) * 0.08, p = P(cx + sw, cy, zl), c = P(cx, cy, zl + 1.2)
    const u = k / 50
    g.strokeStyle = 'rgba(255,241,200,0.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(c[0], c[1]); g.lineTo(p[0], p[1] - 14 * u); g.stroke()
    glow(p[0], p[1], 70 * u, '#fff1c8', 0.55); glow(p[0], p[1], 30 * u, '#ffffff', 0.5)
    g.fillStyle = '#fff6dc'; g.beginPath(); g.arc(p[0], p[1], 14 * u, 0, TAU); g.fill()
    g.fillStyle = '#f3dcb8'; g.fillRect(p[0] - 7 * u, p[1] - 16 * u, 14 * u, 4 * u); g.fillRect(p[0] - 7 * u, p[1] + 12 * u, 14 * u, 4 * u)
  }
  function lightCone(cx, cy, zl, r, ft) {
    const p = P(cx, cy, zl), l = P(cx - r * 0.75, cy + r * 0.4, ft), q = P(cx + r * 0.85, cy - r * 0.3, ft)
    const gr = g.createLinearGradient(p[0], p[1], p[0], Math.max(l[1], q[1]))
    gr.addColorStop(0, 'rgba(255,246,220,0.22)'); gr.addColorStop(1, 'rgba(255,246,220,0.03)')
    g.fillStyle = gr; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(l[0], l[1]); g.lineTo(q[0], q[1]); g.closePath(); g.fill()
  }
  function floorPool(cx, cy, ft, r, rect, warmA) { // a warm pool from above and a cool counter-light from the open side
    plane('z', ft, () => {
      g.save(); g.beginPath(); g.rect(...rect); g.clip()
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, `rgba(255,241,200,${warmA || 0.35})`); gr.addColorStop(1, 'rgba(255,241,200,0)')
      g.fillStyle = gr; g.fillRect(cx - r, cy - r, 2 * r, 2 * r)
      const [rx, ry, rw, rh] = rect, qx = rx + rw - 0.6, qy = ry + rh - 0.6, cg = g.createRadialGradient(qx, qy, 0, qx, qy, Math.max(r * 0.8, 1.6))
      cg.addColorStop(0, 'rgba(170,215,255,0.28)'); cg.addColorStop(1, 'rgba(170,215,255,0)'); g.fillStyle = cg; g.fillRect(rx, ry, rw, rh)
      g.restore()
    })
  }
  function route(pts, ft, col, closed) { // a 6px lit ribbon in the rung's colour at 60%, with a bead riding it
    plane('z', ft + 0.005, () => {
      g.save(); g.strokeStyle = rgba(col, 0.6); g.lineWidth = 6 / k; g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = rgba(col, 0.8); g.shadowBlur = 8
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1])
      for (let i = 1; i < pts.length - 1; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2)
      const e = pts[pts.length - 1]; g.lineTo(e[0], e[1]); if (closed) g.closePath(); g.stroke()
      g.shadowBlur = 0; g.strokeStyle = rgba('#ffffff', 0.5); g.lineWidth = 1.5 / k; g.stroke()
      g.restore()
    })
    const w = closed ? alongLoop(pts, loopT(S.time * 0.08, 1)) : alongLoop(pts.concat(pts.slice(1, -1).reverse()), loopT(S.time * 0.12, 1))
    bead(w.x, w.y, ft, 0.09)
  }

  // the one thing a verb's hands hold, in figure-local units at hand h (the other hand o), pointing at angle a
  function heldProp(kind, h, o, a) {
    if (!h) return
    g.save(); g.translate(h[0], h[1]); g.rotate(a); g.lineCap = 'round'
    if (kind === 'striker' || kind === 'stick') { // the bell's striker; a drumstick
      g.strokeStyle = '#7a5a3e'; g.lineWidth = kind === 'striker' ? 1.6 : 1.2; g.beginPath(); g.moveTo(-1, 0); g.lineTo(8, 0); g.stroke()
      g.fillStyle = kind === 'striker' ? '#c99a5a' : '#fff1d8'; g.beginPath(); g.arc(8.5, 0, kind === 'striker' ? 2.3 : 1.6, 0, TAU); g.fill()
      g.strokeStyle = 'rgba(60,40,30,0.5)'; g.lineWidth = 0.5; g.stroke()
    } else if (kind === 'knife') { // the carving knife
      g.strokeStyle = '#7a5a3e'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(-1.5, 0); g.lineTo(2, 0); g.stroke()
      g.fillStyle = '#e6edf5'; g.strokeStyle = '#5a6278'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(2, -1); g.lineTo(8, -0.2); g.lineTo(2, 1); g.closePath(); g.fill(); g.stroke()
    } else if (kind === 'seed') { // the seed he presses in
      glow(0, 0, 6, SEED, 0.8); g.fillStyle = '#fff8e2'; g.strokeStyle = 'rgba(190,150,90,0.8)'; g.lineWidth = 0.5; g.beginPath(); g.ellipse(0, 0.5, 1.8, 2.6, 0, 0, TAU); g.fill(); g.stroke()
    }
    g.restore()
    if (kind === 'cord' && o) { // the cord loop between his hands, with the knot he is tying
      g.strokeStyle = '#d8509f'; g.lineWidth = 1.3; g.lineCap = 'round'; g.beginPath(); g.moveTo(h[0], h[1]); g.quadraticCurveTo((h[0] + o[0]) / 2, Math.max(h[1], o[1]) + 6, o[0], o[1]); g.stroke()
      g.beginPath(); g.moveTo(h[0], h[1]); g.lineTo(h[0] + 1, h[1] - 7); g.moveTo(o[0], o[1]); g.lineTo(o[0] - 1, o[1] - 7); g.stroke()
      g.fillStyle = '#ffd36a'; g.beginPath(); g.arc((h[0] + o[0]) / 2, Math.max(h[1], o[1]) + 3, 1.5, 0, TAU); g.fill()
    } else if (kind === 'breath') { // cupped hands at the mouth, and the breath leaving them
      g.fillStyle = SKIN_TONE; g.strokeStyle = 'rgba(120,80,60,0.5)'; g.lineWidth = 0.5; g.beginPath(); g.ellipse(h[0], h[1], 2.6, 1.8, 0, 0, TAU); g.fill(); g.stroke()
      for (let j = 0; j < 3; j++) { g.fillStyle = `rgba(240,246,255,${0.85 - j * 0.22})`; g.beginPath(); g.arc(h[0] + 4 + j * 3.4, h[1] - 0.5 + j * 0.6, 1.3 + j * 0.6, 0, TAU); g.fill() }
    } else if (kind === 'leaf' && o) { // the leaf boat held in both hands, its small light
      const x = (h[0] + o[0]) / 2, y = (h[1] + o[1]) / 2 - 1
      g.fillStyle = '#7cc9a4'; g.strokeStyle = '#3f8a66'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(x - 6, y - 0.5); g.quadraticCurveTo(x, y + 3.5, x + 6, y - 1.5); g.quadraticCurveTo(x, y, x - 6, y - 0.5); g.fill(); g.stroke()
      glow(x, y - 2.5, 5, '#ffe2a0', 0.8); g.fillStyle = '#fff6dc'; g.beginPath(); g.arc(x, y - 2.2, 1.1, 0, TAU); g.fill()
    } else if (kind === 'cup') { // both hands cupped together over the coals
      g.fillStyle = SKIN_TONE; g.strokeStyle = 'rgba(120,80,60,0.5)'; g.lineWidth = 0.5; g.beginPath(); g.ellipse(h[0], h[1], 3.2, 1.9, 0, 0, TAU); g.fill(); g.stroke()
    }
  }
  // ---------- crew: robed figures; the sash is the altitude ----------
  // o: sash, master, carry ('spool'|'bead'|'tool'|'seed'), walk, face, seed (idle phase), alpha
  function crew(x, y, z, o) {
    const p = P(x, y, z), s = (k / CREW) * (o.master ? 1.15 : 1) * (o.tall || 1)
    const T = S.time, ph = o.seed || 0
    g.save(); g.translate(p[0], p[1]); g.scale(s, s)
    if (o.alpha !== undefined) g.globalAlpha *= o.alpha
    // a soft shadow: cream bounce and a cool contact shadow
    glow(0, 0, 13, '#fff1c8', 0.45); g.fillStyle = 'rgba(20,24,60,0.2)'; g.beginPath(); g.ellipse(0, 0.4, 7.8, 2.6, 0, 0, TAU); g.fill()
    let bob = 0, rot = 0, sy = 1
    const w = T * 10 + ph, pose = o.pose || null
    if (o.walk) { bob = Math.abs(Math.sin(w)) * 1.3; rot = Math.sin(w) * 0.045 }
    else if (!(pose && pose.still)) { sy = 1 + 0.028 * Math.sin(T * 2.0 + ph); rot = 0.04 * Math.sin(T * 1.25 + ph * 1.7) } // breathe and sway
    if (o.walk) { // legs under the robe
      g.strokeStyle = '#6d6a8e'; g.lineWidth = 1.7; g.lineCap = 'round'
      const a = Math.sin(w) * 2.6
      g.beginPath(); g.moveTo(-2, -2 - bob); g.lineTo(-2 + a, 0.8); g.moveTo(2, -2 - bob); g.lineTo(2 - a, 0.8); g.stroke()
    }
    g.translate(0, -bob); g.rotate(rot); g.scale((o.face || 1), sy)
    if (o.kneel) { g.rotate(0.3 * o.kneel); g.scale(1, 1 - 0.2 * o.kneel) } // the Shaman bends to the room's verb
    // a verb's pose, in figure-local units (feet at 0, head near -22, +x the way it faces): lean toward the facing,
    // crouch lower, a head tilt, and the arms as sleeves out to a hand point
    if (pose) { g.translate(0, -(pose.bob || 0)); if (pose.lean) g.rotate(pose.lean); if (pose.crouch) g.scale(1 + 0.12 * pose.crouch, 1 - 0.34 * pose.crouch) }
    const body = new Path2D(); body.moveTo(-7, -1); body.bezierCurveTo(-6.5, -10, -4.5, -17, 0, -19); body.bezierCurveTo(4.5, -17, 6.5, -10, 7, -1); body.quadraticCurveTo(0, 1.5, -7, -1)
    const gr = g.createLinearGradient(-7, 0, 7, 0); gr.addColorStop(0, '#fffaf0'); gr.addColorStop(1, '#d9dcf0')
    const robe = () => {
      g.fillStyle = gr; g.fill(body); g.strokeStyle = 'rgba(40,40,90,0.35)'; g.lineWidth = 0.9; g.stroke(body)
      g.save(); g.clip(body); g.fillStyle = o.sash
      g.beginPath(); g.moveTo(-8, -15); g.lineTo(-1, -20); g.lineTo(9, -6); g.lineTo(2, 0); g.closePath(); g.fill()
      if (o.master) { g.fillRect(-8, -9.5, 16, 2.6) }
      g.restore()
    }
    const bend = (pose && pose.bend) || 0
    if (bend) { // bent at the waist: the skirt stays, the torso, head and arms turn about the hip
      g.save(); g.beginPath(); g.rect(-12, -8, 24, 12); g.clip(); robe(); g.restore()
      g.translate(0, -7.5); g.rotate(bend); g.translate(0, 7.5)
      g.fillStyle = '#fffaf0'; g.beginPath(); g.ellipse(0, -7.5, 6.4, 2.4, 0, 0, TAU); g.fill()
      g.save(); g.beginPath(); g.rect(-14, -40, 28, 32.6); g.clip(); robe(); g.restore()
    } else robe()
    const arm = (sx, h) => { // a sleeve in the robe colour from the shoulder to the hand, and the hand
      if (!h) return
      g.lineCap = 'round'; g.strokeStyle = 'rgba(40,40,90,0.35)'; g.lineWidth = 3.6
      g.beginPath(); g.moveTo(sx, -15); g.quadraticCurveTo((sx + h[0]) / 2 + 1.2, (-15 + h[1]) / 2 + 1.6, h[0], h[1]); g.stroke()
      g.strokeStyle = '#f4f2fa'; g.lineWidth = 2.5; g.stroke()
      g.fillStyle = SKIN_TONE; g.beginPath(); g.arc(h[0], h[1], 1.5, 0, TAU); g.fill()
    }
    if (pose) arm(-4, pose.armL)
    g.save(); if (pose && pose.tilt) { g.translate(0, -19); g.rotate(pose.tilt); g.translate(0, 19) }
    g.fillStyle = SKIN_TONE; g.beginPath(); g.arc(0, -22.5, 4.4, 0, TAU); g.fill()
    if (o.master) { g.strokeStyle = 'rgba(120,80,60,0.5)'; g.lineWidth = 0.8; g.stroke() } // the head reads against a pale floor
    if (o.master) { g.fillStyle = '#fff8ee'; g.beginPath(); g.ellipse(0, -25, 8, 2.2, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(40,40,90,0.22)'; g.lineWidth = 0.8; g.beginPath(); g.ellipse(0, -25, 8, 2.2, 0, 0.15, Math.PI - 0.15); g.stroke() } // the brim sits on the head; only its lower edge is lined
    g.fillStyle = o.master ? '#fff8ee' : '#f3ece0'; g.beginPath()
    g.moveTo(-5, -24); g.quadraticCurveTo(0, -27, 5, -24); g.lineTo(0, o.master ? -38 : -32); g.closePath(); g.fill(); g.strokeStyle = 'rgba(40,40,90,0.3)'; g.stroke()
    g.restore()
    if (pose) arm(4, pose.armR)
    if (pose && pose.prop) heldProp(pose.prop, pose.armR, pose.armL, pose.propAng || 0)
    if (pose && pose.prop2) heldProp(pose.prop2, pose.armL, pose.armR, pose.prop2Ang || 0)
    if (o.carry === 'spool') { g.fillStyle = o.carryCol || SK.skinOld; g.beginPath(); g.ellipse(6, -10, 3.4, 4.2, 0, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.fillRect(4.6, -10.6, 2.8, 1.2) }
    if (o.carry === 'bead') { glow(6, -11, 9, '#dff4ff', 0.8); g.fillStyle = '#f6fbff'; g.beginPath(); g.arc(6, -11, 3, 0, TAU); g.fill() }
    if (o.carry === 'tool') { const sw = Math.sin(T * 3 + ph) * 0.25; g.save(); g.translate(3, -6); g.rotate(sw); g.strokeStyle = '#7d6a80'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(0, 0); g.lineTo(8, -10); g.stroke(); g.restore() }
    if (o.carry === 'seed') { glow(6, -13, 11, SEED, 0.9); g.save(); g.translate(6, -13); g.rotate(-0.5); g.fillStyle = '#fff8e2'; g.beginPath(); g.ellipse(0, 0, 2.6, 3.7, 0, 0, TAU); g.fill(); g.restore() }
    g.restore()
  }
  function bead(x, y, z, r) {
    const p = P(x, y, z + 0.12), rr = (r || 0.13) * k
    glow(p[0], p[1], rr * 3, '#cfeaff', 0.55)
    const gr = g.createRadialGradient(p[0] - rr * 0.3, p[1] - rr * 0.3, 0, p[0], p[1], rr); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#bfe2ff')
    g.fillStyle = gr; g.beginPath(); g.arc(p[0], p[1], rr, 0, TAU); g.fill()
  }
  function beadPile(x, y, z, n) {
    const pts = []
    let row = 0, left = n
    while (left > 0) { const m = Math.max(1, 4 - row); for (let i = 0; i < m && left > 0; i++, left--) pts.push([x + (i - (m - 1) / 2) * 0.26, y + (row % 2) * 0.05, z + row * 0.2]); row++ }
    pts.forEach(([a, b, c]) => bead(a, b, c, 0.12))
  }
  function ribbon(pts, z, w) {
    plane('z', z, () => {
      g.save(); g.lineCap = 'round'; g.lineJoin = 'round'
      const path = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2); const e = pts[pts.length - 1]; g.lineTo(e[0], e[1]) }
      path(); g.strokeStyle = 'rgba(255,244,214,0.25)'; g.lineWidth = w * 1.9; g.stroke()
      path(); g.strokeStyle = '#fbf1dc'; g.lineWidth = w; g.stroke()
      path(); g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = w * 0.18; g.stroke()
      g.restore()
    })
  }

  // ---------- the Clockwork Orrery ----------
  const SHIP = { xc: 11.5, L: 14.2, top: 6.2, bot: 4.6, y0: 0, y1: 9, bw: 1.1 }
  const BIG = { xc: 11.5, L: 18.8, top: 0, bot: 6.1, y0: -3.0, y1: 9, bw: 1.5 }
  const STORE = [9.7, 7.5], A0 = [8.5, 8.35], B0 = [10.9, 8.62]
  const RM = { loom: -4.4, foundry: 1.0, chart: 4.6 } // how far each room moves out into the larger hull

  // where everyone is: rooms' own crew are in room-local x (add the room's x0); porters are in world coordinates
  function porters() {
    const out = [], ph = S.phase, t = S.t
    let a = { x: A0[0], y: A0[1], mv: false, dx: 1, dy: 0 }, aCarry = null
    let b = { x: B0[0], y: B0[1], mv: false, dx: -1, dy: 0 }, bCarry = null
    if (ph === 'run') {
      a = kf(t, [[0, ...A0], [1.4, ...A0], [2.6, 6.7, 8.4], [3.1, 6.7, 8.4], [4.3, 9.1, 8.12], [4.7, 9.1, 8.12], [5.3, ...A0]]); if (Wd.landed.loom && t > 3.0 && t < 4.4) aCarry = 'seed'
      b = kf(t, [[0, ...B0], [5.0, ...B0], [5.8, 12.3, 8.6], [6.5, 12.3, 8.6], [7.3, 10.35, 8.15], [7.9, 10.35, 8.15], [9.6, 18.3, 8.6], [9.9, 18.3, 8.6], [11.7, 10.35, 8.15], [12.2, 10.35, 8.15], [12.8, ...B0]])
      if ((Wd.landed.foundry && t > 6.4 && t < 7.4) || (Wd.landed.chart && t > 9.6 && t < 11.9)) bCarry = 'seed'
    }
    if (ph === 'intake' && Wd.spent) {
      a = kf(t, [[0, ...A0], [2.0, ...A0], [2.6, 9.6, 8.15], [3.5, 9.6, 8.15], [5.4, 18.4, 8.4], [5.9, 19.5, 7.72], [6.6, 19.5, 7.72], [7.1, 18.4, 8.35], [9.4, ...A0]])
      if (t > 2.7 && t < 6.2) aCarry = 'seed'
      if (t < 6.6) b = kf(t, [[0, ...B0], [6.6, ...B0]])
    }
    out.push({ x: a.x, y: a.y, o: { sash: RUNG[1], carry: aCarry, walk: a.mv, face: a.mv ? faceOf(a) : 1, seed: 1.3 } })
    if (!(Wd.spent && ((ph === 'intake' && t >= 6.6) || ph === 'launch'))) out.push({ x: b.x, y: b.y, o: { sash: RUNG[2], carry: bCarry, walk: b.mv, face: b.mv ? faceOf(b) : -1, seed: 2.9 } })
    return out
  }
  // the second hand (porter B) walks into the star chart's new back row at the intake, then works there
  function chartSecond(x0) {
    if (!Wd.spent) return null
    if (S.phase === 'intake' && S.t >= 6.6 && S.t < 10.4) {
      const w = kf(S.t, [[6.6, ...B0], [9.2, 22.4, 8.62], [9.8, 22.2, 7.3], [10.4, 21.6, 6.55]])
      return { x: w.x + (x0 - 18.6), y: w.y, o: { sash: RUNG[2], walk: w.mv, face: faceOf(w), seed: 2.9 } }
    }
    if (S.phase === 'launch' || (S.phase === 'intake' && S.t >= 10.4)) {
      const T = S.time - (START.intake + 10.4)
      const w = kf(loopT(T, 4.2), [[0, 3.0, 6.55], [0.7, 3.0, 6.55], [2.0, 1.0, 6.62], [2.6, 1.0, 6.62], [3.9, 3.0, 6.55], [4.2, 3.0, 6.55]])
      return { x: x0 + w.x, y: w.y, o: { sash: RUNG[2], walk: w.mv || S.move > 0 && S.move < 1, face: w.mv ? faceOf(w) : -1, carry: w.seg === 1 ? 'bead' : null, seed: 2.9 } }
    }
    return null
  }
  const moving = () => S.move > 0.001 && S.move < 0.999

  function loomRoom(x0, actors) {
    const W = 7, d = 7, front = 8
    const r = { x0, x1: x0 + W, d, front, H: 4.2, col: RUNG[4], wall: SK.wallLoom }
    room(r, (y0, ft) => {
      const rect = [x0, y0, W, d], lx = x0 + W * 0.52, ly = y0 + d * 0.5
      floorPool(lx, ly, ft, d * 0.45 * 1.4, rect)
      const loopPts = [[1.0, 2.5], [6.2, 2.9], [6.1, 6.2], [3.8, 6.35], [0.9, 5.9]]
      route(loopPts.map(([a, b]) => [x0 + a, y0 + b]), ft, RUNG[4], true)
      route([[x0 + 0.8, y0 + 3.2], [x0 + 1.7, y0 + 2.6], [x0 + 2.6, y0 + 2.2]], ft, RUNG[1])
      route([[x0 + 5.9, y0 + 6.2], [x0 + 4.6, y0 + 5.9], [x0 + 3.4, y0 + 5.3]], ft, RUNG[1])
      lightCone(lx, ly, 3.4, 2.6, ft)
      const T = S.time, mv = moving(), fl = S.flash.loom
      const items = [
        { x: x0 + 0.7, y: y0 + 0.5, f: () => spoolBasket(x0 + 0.7, y0 + 0.5, ft) },
        { x: x0 + 1.7, y: y0 + 1.2, f: () => loom(x0 + 1.7, y0 + 1.2, ft, fl, 0) },
        { x: x0 + 5.3, y: y0 + 1.9, f: () => loom(x0 + 5.3, y0 + 1.9, ft, 0, 1.3) },
        { x: x0 + 2.4, y: y0 + 4.3, f: () => loom(x0 + 2.4, y0 + 4.3, ft, 0, 2.6) },
        { x: x0 + 6.2, y: y0 + 5.6, f: () => spoolBasket(x0 + 6.2, y0 + 5.6, ft) }
      ]
      const m = alongLoop(loopPts, loopT(T / 12, 1)) // the master walks the whole floor
      items.push({ x: x0 + m.x, y: y0 + m.y, f: () => crew(x0 + m.x, y0 + m.y, ft, { sash: RUNG[4], master: true, walk: true, face: faceOf(m), seed: 0.4 }) })
      const a1 = kf(loopT(T, 5), [[0, 0.8, 3.2], [0.9, 0.8, 3.2], [2.2, 2.6, 2.2], [3.1, 2.6, 2.2], [4.4, 0.8, 3.2], [5, 0.8, 3.2]])
      items.push({ x: x0 + a1.x, y: y0 + a1.y, f: () => crew(x0 + a1.x, y0 + a1.y, ft, { sash: RUNG[1], walk: a1.mv || mv, face: a1.mv ? faceOf(a1) : 1, carry: a1.seg <= 1 ? 'spool' : null, carryCol: '#e98fb8', seed: 2.2 }) })
      const a2 = kf(loopT(T + 2.1, 5.6), [[0, 5.9, 6.2], [1.0, 5.9, 6.2], [2.4, 3.4, 5.3], [3.3, 3.4, 5.3], [4.8, 5.9, 6.2], [5.6, 5.9, 6.2]])
      items.push({ x: x0 + a2.x, y: y0 + a2.y, f: () => crew(x0 + a2.x, y0 + a2.y, ft, { sash: RUNG[1], walk: a2.mv || mv, face: a2.mv ? faceOf(a2) : -1, carry: a2.seg <= 1 ? 'spool' : null, carryCol: SK.skinOld, seed: 4.1 }) })
      actors.filter((q) => q.x > x0 && q.x < x0 + W && q.y < front).forEach((q) => items.push({ x: q.x, y: q.y, f: () => crew(q.x, q.y, ft, q.o) }))
      sortDraw(items)
      lantern(lx, ly, 3.4)
    })
  }
  function foundryRoom(x0, actors) {
    const W = 4.6, d = 2.0, front = 8
    room({ x0, x1: x0 + W, d, front, H: 3.6, col: RUNG[2], wall: SK.wallFoundry }, (y0, ft) => {
      floorPool(x0 + 3.2, y0 + 0.8, ft, 2.0, [x0, y0, W, d], 0.28)
      route([[x0 + 0.5, 7.75], [x0 + 1.9, 7.4], [x0 + 2.9, 7.2]], ft, RUNG[2])
      const T = S.time, mv = moving()
      const items = [
        { x: x0 + 1.0, y: y0 + 0.55, f: () => kiln(x0 + 1.0, y0 + 0.55, ft, S.flash.foundry) },
        { x: x0 + 3.55, y: y0 + 0.5, f: () => { box(x0 + 2.9, y0 + 0.15, ft, x0 + 4.2, y0 + 0.85, ft + 0.55, '#c9b2b8', '#a98f98', '#8c7480'); mould(x0 + 3.55, y0 + 0.5, ft + 0.55) } }
      ]
      const w = kf(loopT(T + 0.7, 4.4), [[0, 0.5, 7.75], [0.6, 0.5, 7.75], [1.4, 1.9, 7.4], [2.0, 2.9, 7.2], [2.6, 2.9, 7.2], [3.8, 0.5, 7.75], [4.4, 0.5, 7.75]])
      items.push({ x: x0 + w.x, y: w.y, f: () => crew(x0 + w.x, w.y, ft, { sash: RUNG[2], walk: w.mv || mv, face: w.mv ? faceOf(w) : 1, carry: (w.seg === 1 || w.seg === 2) ? 'bead' : null, seed: 0.9 }) })
      items.push({ x: x0 + 1.75, y: 7.7, f: () => crew(x0 + 1.75, 7.7, ft, { sash: RUNG[1], carry: 'tool', walk: mv, face: -1, seed: 3.3 }) })
      actors.filter((q) => q.x > x0 && q.x < x0 + W && q.y < front).forEach((q) => items.push({ x: q.x, y: q.y, f: () => crew(q.x, q.y, ft, q.o) }))
      sortDraw(items)
      glow3(x0 + 3.2, y0 + 0.2, 2.8, 1.4, '#fff4d8', 0.25)
    })
  }
  function chartRoom(x0, actors) {
    const W = 4.6, d = S.chartD, front = 8, col = mix(RUNG[1], RUNG[2], S.chartMix)
    room({ x0, x1: x0 + W, d, front, H: 3.6, col, wall: SK.wallChart }, (y0, ft) => {
      floorPool(x0 + 2.4, front - d * 0.5, ft, 1.6 + d * 0.5, [x0, y0, W, d], 0.26)
      route([[x0 + 2.7, 7.62], [x0 + 3.95, 7.62]], ft, col)
      if (d > 1.4) route([[x0 + 3.0, 6.55], [x0 + 2.0, 6.62], [x0 + 1.0, 6.62]], ft, RUNG[2])
      const T = S.time, mv = moving()
      const items = [{ x: x0 + 1.8, y: 7.5, f: () => starTable(x0 + 1.8, 7.5, ft, S.lit3, S.flash.chart) }]
      if (d > 1.5) { const a = clamp((d - 1.5) / 0.5); items.push({ x: x0 + 3.9, y: 6.3, f: () => { g.save(); g.globalAlpha = a; box(x0 + 3.55, 6.05, ft, x0 + 4.35, 6.5, ft + 0.5, '#c9c4e6', '#a9a2d2', '#8f88bb'); bead(x0 + 3.8, 6.28, ft + 0.5, 0.1); bead(x0 + 4.1, 6.28, ft + 0.5, 0.1); g.restore() } }) }
      const w = kf(loopT(T + 1.1, 3.4), [[0, 2.7, 7.62], [0.7, 2.7, 7.62], [1.5, 3.95, 7.62], [2.4, 3.95, 7.62], [3.2, 2.7, 7.62], [3.4, 2.7, 7.62]]) // one short line
      items.push({ x: x0 + w.x, y: w.y, f: () => crew(x0 + w.x, w.y, ft, { sash: col, walk: w.mv || mv, face: w.mv ? faceOf(w) : -1, seed: 1.7 }) })
      const sh = chartSecond(x0); if (sh && sh.y < front) items.push({ x: sh.x, y: sh.y, f: () => crew(sh.x, sh.y, ft, sh.o) })
      actors.filter((q) => q.x > x0 && q.x < x0 + W && q.y < front).forEach((q) => items.push({ x: q.x, y: q.y, f: () => crew(q.x, q.y, ft, q.o) }))
      sortDraw(items)
      glow3(x0 + 3.8, y0 + 0.1, 2.8, 1.2, '#fff4d8', 0.25)
    })
  }
  function flyingSeeds() { // a seed rises from a room when its minigame lands, then drifts down to the crew who carries it
    const out = []
    const fly = (t, t0, from, to, t1, t2) => { // rise t0..t1, drift to the carrier t1..t2
      if (t < t0 || t > t2) return
      if (t < t1) { const f = ease((t - t0) / (t1 - t0)); out.push([from[0], from[1], lerp(from[2], from[2] + 2.4, f), 1 - f * 0.3]) }
      else { const f = ease((t - t1) / (t2 - t1)), z0 = from[2] + 2.4; out.push([lerp(from[0], to[0], f), lerp(from[1], to[1], f), lerp(z0, to[2], f) + Math.sin(f * Math.PI) * 0.6, 0.7]) }
    }
    const drop = (t, t0, from, t1) => { if (t >= t0 && t <= t1) { const f = ease((t - t0) / (t1 - t0)); out.push([lerp(from[0], STORE[0], f), lerp(from[1], STORE[1], f), lerp(1.9, 0.55, f) + Math.sin(f * Math.PI) * 0.4, 0.6]) } }
    const t = S.t
    if (S.phase === 'run') {
      const L = Wd.landed
      if (L.loom) { fly(t, 1.0, [3.4, 4.6, 2.0], [6.7, 8.4, 1.75], 1.9, 3.0); drop(t, 4.3, [9.1, 8.12], 4.6) }
      if (L.foundry) { fly(t, 4.6, [14.3, 7.0, 1.6], [12.3, 8.6, 1.75], 5.5, 6.4); drop(t, 7.3, [10.35, 8.15], 7.6) }
      if (L.chart) { fly(t, 7.8, [20.4, 7.5, 1.6], [18.3, 8.6, 1.75], 8.7, 9.6); drop(t, 11.7, [10.35, 8.15], 12.1) }
    }
    if (S.phase === 'intake' && Wd.opens) { // the hull is paid for: its seeds rise from the store into the waiting skin
      for (let i = 0; i < Wd.cost; i++) {
        const t0 = 9.4 + i * 0.25, t1 = t0 + 1.2
        if (t >= t0 && t <= t1) { const f = ease((t - t0) / (t1 - t0)), tx = BIG.xc + (i % 2 ? 1 : -1) * (4 + 3 * i), ty = BIG.y0 + 0.4; out.push([lerp(STORE[0], tx, f), lerp(STORE[1], ty, f), lerp(0.6, 3.4, f) + Math.sin(f * Math.PI) * 1.4, 1 - f * 0.5]) }
      }
    }
    if (S.phase === 'intake' && Wd.spent) {
      if (t >= 2.0 && t <= 2.7) { const f = ease((t - 2.0) / 0.7); out.push([lerp(STORE[0], 9.6, f), lerp(STORE[1], 8.15, f), 0.6 + Math.sin(f * Math.PI) * 1.2 + f * 1.1, 0.9]) }
      if (t >= 6.1 && t <= 6.4) { const f = ease((t - 6.1) / 0.3); out.push([lerp(19.5, 20.4, f), lerp(7.72, 7.5, f), lerp(1.7, 1.05, f), 0.9]) }
    }
    out.forEach(([x, y, z, gl]) => seed(x, y, z, gl, 1.25))
  }

  function shipScene() {
    const m = S.move
    const LX = RM.loom * m, FX = RM.foundry * m, CX = RM.chart * m
    { const p = P(SHIP.xc, 4.5, -SHIP.bot - 2.4); g.save(); g.translate(p[0], p[1]); g.scale(1, 0.18); glow(0, 0, lerp(SHIP.L, BIG.L, S.skin) * k * 1.1, '#0f2a3a', 0.35); g.restore() }
    if (S.skin > 0.01) { g.save(); g.globalAlpha = S.skin; bulwark(BIG, true); hullLower(BIG, { big: true }); g.restore() }
    if (!S.fleet) ghostSkin()
    tail(S.skin > 0.5 ? BIG : SHIP)
    bulwark(SHIP)
    hullLower(SHIP, { under: 1 - S.skin, seamInner: S.skin })
    if (!S.fleet) { skinLight(); gates() }
    ribbon([[-1.5 + LX, 8.5], [8, 8.5], [8.4, 6.6], [9.3, 4.1], [10.6, 4.6], [11, 6.8], [11.4, 8.5], [24.5 + CX, 8.5]], 0.02, 0.62)
    ribbon([[7.4, 8.5], [11.8, 8.5]], 0.02, 0.62)
    ribbon([[7.6, 8.5], [8.6, 7.6]], 0.02, 0.5)
    if (m > 0.01) roomSlots(m)
    const actors = porters()
    loomRoom(0 + LX, actors)
    hearth(9.6, 5.6)
    store(STORE[0], STORE[1])
    foundryRoom(12 + FX, actors)
    chartRoom(18.6 + CX, actors)
    // the current of qi flows stern to bow along the walkway; until the intake it piles at the star chart's door
    const pileX = 18.6 + CX - 0.75, T = S.time * 0.55
    for (let i = 0; i < 14; i++) { const x0 = -1.0 + LX, span = pileX - 0.4 - x0, x = x0 + loopT(i * span / 14 + T, span); bead(x, 8.5, 0.02) }
    for (let i = 0; i < 4; i++) { const x0 = 18.6 + CX + 4.8, span = 24.3 + CX - x0 + 0.01; if (span > 0.3) bead(x0 + loopT(i * span / 4 + T * 0.5, span), 8.5, 0.02, 0.1) }
    ;[[8.4, 6.6], [9.3, 4.1], [10.6, 4.6], [11, 6.8]].forEach(([x, y], i) => { const w = alongLoop([[8.4, 6.6], [9.3, 4.1], [10.6, 4.6], [11, 6.8]], loopT(i / 4 + S.time * 0.05, 1)); bead(w.x, w.y, 0.02) })
    beadPile(pileX, 8.45, 0.02, S.pileN)
    // porters and the second hand out on the walkway, front-most
    const out = actors.filter((q) => !inRoom(q, LX, FX, CX))
    const sh = chartSecond(18.6 + CX); if (sh && sh.y >= 8) out.push(sh)
    out.sort((a, b) => (a.x * AX[1] + a.y * AY[1]) - (b.x * AX[1] + b.y * AY[1])).forEach((q) => crew(q.x, q.y, 0.02, q.o))
    flyingSeeds()
    if (!S.fleet) { HIT.store = P(STORE[0], STORE[1], 0.4); HIT.chart = P(18.6 + CX + 2.3, 7.5, 1.4); HIT.k = k }
  }
  // the ground the rooms leave in the larger hull: faint floors for the rooms this hull can still hold (r9 fix-next 7)
  function roomSlots(m) {
    for (const [x0, x1] of [[3.0, 7.4], [18.0, 22.6]]) {
      path3([[x0, 1.4, 0.02], [x1, 1.4, 0.02], [x1, 7.8, 0.02], [x0, 7.8, 0.02]])
      g.fillStyle = `rgba(214,240,255,${0.07 * m})`; g.fill()
      g.save(); g.setLineDash([0.22 * k, 0.18 * k]); g.strokeStyle = `rgba(255,252,240,${0.42 * m})`; g.lineWidth = Math.max(1, 0.05 * k); g.stroke(); g.restore()
    }
  }
  function inRoom(q, LX, FX, CX) {
    if (q.y >= 8) return false
    return (q.x > LX && q.x < LX + 7) || (q.x > 12 + FX && q.x < 16.6 + FX) || (q.x > 18.6 + CX && q.x < 23.2 + CX)
  }

  // ---------- the tap: a soft hand and a ripple ----------
  function handAt(x, y, sc, press) {
    g.save(); g.translate(x, y); g.scale(sc * (1 - 0.08 * press), sc * (1 - 0.08 * press)); g.rotate(-0.42)
    g.shadowColor = 'rgba(20,24,60,0.35)'; g.shadowBlur = 14; g.shadowOffsetY = 6
    g.fillStyle = '#fff6e8'; g.strokeStyle = 'rgba(60,50,90,0.45)'; g.lineWidth = 1.6
    const hp = new Path2D()
    hp.roundRect(-8, -2, 16, 50, 8) // index finger, tip at the origin
    hp.roundRect(7, 26, 13, 30, 6.5); hp.roundRect(18, 30, 12, 28, 6); hp.roundRect(28, 36, 11, 24, 5.5) // folded fingers
    hp.roundRect(-12, 44, 52, 44, 18) // palm
    g.fill(hp); g.shadowColor = 'transparent'; g.stroke(hp)
    g.restore()
  }
  function ripple(x, y, f, sc) {
    if (f <= 0 || f >= 1) return
    for (let i = 0; i < 2; i++) {
      const q = clamp(f * 1.25 - i * 0.25); if (q <= 0) continue
      g.strokeStyle = `rgba(255,246,220,${0.85 * (1 - q)})`; g.lineWidth = 3 * sc * (1 - q) + 0.5; g.beginPath(); g.arc(x, y, (8 + 70 * q) * sc, 0, TAU); g.stroke()
    }
    glow(x, y, 46 * sc * (1 - f * 0.5), '#fff1c8', 0.5 * (1 - f))
  }
  function tapLayer(W, H, opts) {
    if (S.phase !== 'intake') return
    const t = S.t, sc = S.phone ? 0.75 : 1.1, st = HIT.store, ch = HIT.chart
    const off = [W * 0.92, H + 60 * sc]
    const taps = opts.taps || {}
    ripple(taps.store ? taps.store[0] : st[0], taps.store ? taps.store[1] : st[1], (t - 2.0) / 0.9, sc)
    ripple(taps.chart ? taps.chart[0] : ch[0], taps.chart ? taps.chart[1] : ch[1], (t - 3.5) / 0.9, sc)
    if (taps.hull) ripple(taps.hull[0], taps.hull[1], (t - 9.4) / 0.9, sc)
    const hint = opts.hint
    if (hint) { // the intake waits for the player: the thing to touch breathes, and the hand comes if they wait
      const p = hint.at === 'chart' ? ch : st, beat = (hint.idle % 1.6) / 1.6
      glow(p[0], p[1], (hint.at === 'chart' ? 70 : 52) * sc * (1 + 0.15 * Math.sin(hint.idle * 3.4)), '#fff1c8', 0.4 + 0.2 * Math.sin(hint.idle * 3.4))
      g.strokeStyle = `rgba(255,246,220,${0.7 * (1 - beat)})`; g.lineWidth = 2.5 * sc; g.beginPath(); g.arc(p[0], p[1], (20 + 46 * beat) * sc, 0, TAU); g.stroke()
      if (hint.idle > 2.2) handAt(p[0], p[1], sc, bump(beat, 0.1, 0.45))
      return
    }
    if (opts.noHand) return
    let p = null, press = 0
    if (t >= 0.8 && t < 1.8) { const f = ease((t - 0.8) / 1.0); p = [lerp(off[0], st[0], f), lerp(off[1], st[1], f)] }
    else if (t >= 1.8 && t < 2.4) { p = st; press = bump(t, 1.8, 2.2) }
    else if (t >= 2.4 && t < 3.3) { const f = ease((t - 2.4) / 0.9); p = [lerp(st[0], ch[0], f), lerp(st[1], ch[1], f) - Math.sin(f * Math.PI) * 50 * sc] }
    else if (t >= 3.3 && t < 3.8) { p = ch; press = bump(t, 3.3, 3.7) }
    else if (t >= 3.8 && t < 4.8) { const f = ease((t - 3.8) / 1.0); p = [lerp(ch[0], off[0], f), lerp(ch[1], off[1], f)] }
    if (p) handAt(p[0], p[1], sc, press)
  }

  // ---------- cameras: the ship close while under way, pulled back as the larger hull fills ----------
  function camera(W, H, phone) {
    let A, B
    if (phone) {
      A = fit([[-2.9, 8.6, 0], [26.0, 8.6, 0], [-0.3, 1, 4.2], [26.0, 6, 3.6], [11.5, 9, -4.8]], 4, H * 0.3, W - 8, H * 0.6)
      B = fit([[-7.4, 8.6, 0], [30.4, 8.6, 0], [-4.7, 1, 4.2], [30.4, 6, 3.6], [11.5, 9, -6.2]], 4, H * 0.3, W - 8, H * 0.6)
    } else {
      A = fit([[-3.6, 9, -1.5], [-1, 1, 4.4], [11.5, 9, -5.2], [26.8, -0.5, 5.6], [26.8, 9, -0.5], [-6.2, 4, 0]], 40, 70, W - 80, H - 130)
      B = fit([[-7.6, 9, -1.5], [-6, -2.8, 3.6], [11.5, 9, -6.4], [31.4, -3, 7.2], [31.2, 9, -0.5]], 30, 50, W - 60, H - 100)
    }
    // the phone keeps the whole larger hull in frame as the ship leaves; only the desktop eases back in
    const f = phone && S.phase === 'launch' && Wd.opens ? 1 : S.cam
    k = lerp(A[0], B[0], f); ox = lerp(A[1], B[1], f); oy = lerp(A[2], B[2], f)
    oy += Math.sin(S.time * 1.1) * 2.2 * (k / 45) // the ship rides the current
    HIT.box = sbox(S.skin > 0.5 ? [[-7.6, 9, -1.5], [-6, -2.8, 3.6], [11.5, 9, -6.4], [31.4, -3, 7.2], [31.2, 9, -0.5]] : [[-3.6, 9, -1.5], [-1, 1, 4.4], [11.5, 9, -5.2], [26.8, -0.5, 5.6], [26.8, 9, -0.5]])
  }

  // ================= round 10: every ship's loop, and the fleet =================
  // Face sets the form, element sets the skin (flow-ships/art-direction.md): the Gourd Star a gourd, the Ember Comet an
  // S-curved dart, the Twin Lantern two hulls under one deck, the Jade Palace a mirrored lens, the Seed Archive a samara
  // seed, the Orrery round 9's pod. Each skin stays a pale ice tinted by its element, so the hull is still the lightest
  // large shape; the element shows in motion (vines, embers, rings of light, floating stones, motes), never an emblem.
  const FACE_OF = { 'gourd-star': 'shaman', orrery: 'architect', 'ember-comet': 'challenger', 'twin-lantern': 'diplomat', 'jade-palace': 'regent', 'seed-archive': 'sage' }
  const FORM = { shaman: 'gourd', architect: 'pods', challenger: 'comet', diplomat: 'twin', regent: 'lens', sage: 'seed' }
  const SKIN = {
    shaman: { nw: '#b4e6d2', old: '#5aa894', band: '#86c9b4', core: '#2c6a68', deck: '#d4f0e6', acc: '#e4fbf2', lite: '#cdf5e6' },
    architect: { nw: SK.skinNew, old: SK.skinOld, band: '#5fb3c4', core: '#2f6f95', deck: SK.deck, acc: SK.acc, lite: SK.lite },
    challenger: { nw: '#ecd6dc', old: '#b88594', band: '#d4a8b4', core: '#6a3e62', deck: '#f4e4e8', acc: '#fff1f4', lite: '#ffe2e8' },
    diplomat: { nw: '#dce8f4', old: '#8fa8c6', band: '#b6cae2', core: '#4a6690', deck: '#eaf1f8', acc: '#ffffff', lite: '#f2f8ff' },
    regent: { nw: '#dde6d0', old: '#97a888', band: '#bccaae', core: '#56684e', deck: '#ebf0e2', acc: '#f8fbf0', lite: '#f2f8e6' },
    sage: { nw: '#ddd8f4', old: '#9d92d2', band: '#bfb6e8', core: '#544a94', deck: '#ebe8fa', acc: '#f8f6ff', lite: '#f0ecff' },
  }
  const wallOf = (sk) => mix(sk.old, '#ffffff', 0.55)
  function bulb(u, c, r) { const d = (u - c) / r; return d * d >= 1 ? 0 : Math.sqrt(1 - d * d) }
  function depthOf(form, u) {
    if (form === 'gourd') return Math.max(bulb(u, 0.31, 0.31), 0.74 * bulb(u, 0.78, 0.22))
    if (form === 'comet') return u < 0.7 ? Math.pow(Math.sin(Math.PI / 2 * u / 0.7), 1.6) : bulb(u, 0.7, 0.3)
    if (form === 'lens') return Math.pow(Math.sin(Math.PI * u), 0.55)
    if (form === 'twin') return Math.pow(Math.sin(Math.PI * u), 0.4)
    if (form === 'seed') return Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(u, 1.5))), 0.7)
    return Math.pow(Math.sin(Math.PI * u), 0.5)
  }
  function lowPts(h, inset) {
    const out = [], L = h.L - inset, bot = Math.max(0.2, h.bot - inset)
    for (let i = 0; i <= 64; i++) { const u = i / 64; out.push([h.xc + L * (2 * u - 1), -bot * depthOf(h.form, u)]) }
    return out
  }
  // a hull class: one-room ships grow longer, deeper and wider aft with each class (boat-grid-growth-limits)
  function geo(id, cls) {
    const form = FORM[FACE_OF[id]]
    if (form === 'pods') return { ...(cls <= 1 ? SHIP : BIG), form }
    const c = Math.max(0, cls - 1)
    return { id, form, cls, xc: 5.6, L: 8.2 + 1.9 * c, bot: (form === 'twin' ? 2.8 : 3.5) + 0.55 * c, y0: -1.1 * c, y1: 8, bw: 0.95 + 0.12 * c }
  }
  const RIM = {
    gourd: { sh: 1.5, sb: 0.4, sc: 0.6, ph: 3.4, pb: 1.3, pc: 1.5 },
    comet: { sh: 5.4, sb: 2.8, sc: 1.7, ph: 1.1, pb: 2.4, pc: 0.2 },
    lens: { sh: 3.1, sb: 1.3, sc: 1.3, ph: 3.1, pb: 1.3, pc: 1.3 },
    twin: { sh: 1.6, sb: 0.4, sc: 0.4, ph: 1.6, pb: 0.4, pc: 0.4 },
    seed: { sh: 1.2, sb: 0.2, sc: 0.3, ph: 1.8, pb: 0.9, pc: 0.7 },
  }
  function rimPath(h, inset) {
    const R = RIM[h.form], xl = h.xc - h.L + inset, xr = h.xc + h.L - inset, b = h.bw - inset * 0.5
    const sx = xl - R.sb, sz = R.sh * b, px = xr + R.pb, pz = R.ph * b
    g.beginPath(); g.moveTo(xl, 0)
    g.bezierCurveTo(xl - R.sb * 0.5, sz * 0.4, sx - R.sc * 0.3, sz * 0.9, sx + R.sc * 0.4, sz)
    g.bezierCurveTo(sx + R.sc * 1.2, sz * 1.05, sx + R.sc * 1.3, sz * 0.6, xl + 1.4, b * 1.1)
    g.quadraticCurveTo(xl + 2.0, b, xl + 2.6, b)
    g.lineTo(xr - 2.6, b)
    g.quadraticCurveTo(xr - 2.0, b, xr - 1.4, b * 1.1)
    g.bezierCurveTo(px - R.pc * 1.3, pz * 0.6, px - R.pc * 1.2, pz * 1.05, px - R.pc * 0.4, pz)
    g.bezierCurveTo(px + R.pc * 0.3, pz * 0.9, xr + R.pb * 0.5, pz * 0.4, xr, 0)
    g.closePath()
  }
  function rimG(h, sk) {
    plane('y', h.y0, () => { rimPath(h, 0); g.fillStyle = mix(sk.nw, sk.acc, 0.45); g.fill() })
    plane('y', h.y0 + 0.7, () => {
      rimPath(h, 0); g.fillStyle = sk.nw; g.fill()
      g.save(); rimPath(h, 0); g.clip(); g.translate(0, -0.45); rimPath(h, 0.35); g.fillStyle = sk.old; g.fill(); g.restore()
    })
  }
  function stripsG(h, sk, ya, yb) {
    const lo = lowPts(h, 0)
    for (let i = 0; i < lo.length - 1; i++) {
      const [x0, z0] = lo[i], [x1, z1] = lo[i + 1]
      const nx = z1 - z0, nz = -(x1 - x0), d = (nx * 0.7 + nz * 0.53) / (Math.hypot(nx, nz) || 1)
      if (d <= -0.05) continue
      const c = mix(sk.core, sk.nw, 0.25 + 0.4 * Math.max(0, d))
      poly([[x0, ya, z0], [x1, ya, z1], [x1, yb, z1], [x0, yb, z0]], c, c, 0.6)
    }
  }
  function bandsG(h, sk, y) { // the cut face: every band an older hull, newest outside (boat-grid-nested-skins)
    const f = (inset, col) => { path3(lowPts(h, inset).map(([x, z]) => [x, y, z])); g.fillStyle = col; g.fill() }
    f(0, sk.nw); f(0.5, sk.old); f(0.95, sk.band); f(1.35, sk.core)
    g.save(); path3(lowPts(h, 1.35).map(([x, z]) => [x, y, z])); g.clip(); flowCurves(h, y, -h.bot + 1.4, -0.3, sk.lite, 0.3, 3, h.xc + y, S.D * 0.4); g.restore()
  }
  function hullG(h, sk, o) {
    o = o || {}
    const ua = o.under === undefined ? 1 : o.under, xl = h.xc - h.L, xr = h.xc + h.L
    const under = (ya, yb) => { if (ua > 0.01) { g.save(); g.globalAlpha *= ua; stripsG(h, sk, ya, yb); g.restore() } }
    if (h.form === 'twin') { under(h.y0, h.y0 + 3.2); bandsG(h, sk, h.y0 + 3.2); under(h.y1 - 3.2, h.y1) } else under(h.y0, h.y1)
    poly([[xl, h.y0, 0], [xr, h.y0, 0], [xr, h.y1, 0], [xl, h.y1, 0]], sk.deck, o.seam ? rgba('#ffffff', 0.5 * o.seam) : null, 2)
    plane('z', 0, () => {
      g.save(); g.globalAlpha *= 0.18; g.strokeStyle = '#ffffff'; g.lineWidth = 0.08
      for (let i = 0; i < 5; i++) { g.beginPath(); for (let s = 0; s <= 40; s++) { const x = xl + 0.5 + (s / 40) * (xr - xl - 1), y = h.y0 + 0.7 + i * (h.y1 - h.y0 - 1.4) / 4 + Math.sin(s / 6 + i) * 0.25; s ? g.lineTo(x, y) : g.moveTo(x, y) } g.stroke() }
      g.restore()
    })
    bandsG(h, sk, h.y1)
    const a = P(xl, h.y1, 0), b = P(xr, h.y1, 0)
    g.save(); g.strokeStyle = 'rgba(240,252,255,0.8)'; g.lineWidth = 2; g.shadowColor = rgba(sk.acc, 1); g.shadowBlur = 10
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.restore()
  }
  // the next hull class waiting round the ship: one step brighter than round 9's (build-r9 review, fix next 6)
  function ghostG(big, a) {
    if (a <= 0.01) return
    g.save(); g.globalAlpha = a
    const xl = big.xc - big.L, xr = big.xc + big.L
    poly([[xl, big.y0, 0], [xr, big.y0, 0], [xr, big.y1, 0], [xl, big.y1, 0]], 'rgba(200,240,255,0.06)', 'rgba(225,246,255,0.34)', 1)
    plane('y', big.y0, () => { rimPath(big, 0); g.fillStyle = 'rgba(190,232,250,0.07)'; g.fill(); g.shadowColor = '#cff6ff'; g.shadowBlur = 12; g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 3 / k; g.stroke() })
    plane('y', big.y1, () => {
      const lo = lowPts(big, 0); g.beginPath(); lo.forEach(([x, z], i) => i ? g.lineTo(x, z) : g.moveTo(x, z)); g.closePath()
      g.fillStyle = 'rgba(190,232,250,0.08)'; g.fill(); g.shadowColor = '#cff6ff'; g.shadowBlur = 14; g.strokeStyle = 'rgba(255,255,255,0.48)'; g.lineWidth = 3 / k; g.stroke()
    })
    g.restore()
  }
  function skinLightG(big) {
    const p = S.skinLine
    if (p <= 0 || (p >= 1 && S.skin >= 1)) return
    const fade = 1 - ramp(S.phase === 'intake' ? S.t : 99, 11.2, 12.2)
    if (fade <= 0) return
    g.save(); g.globalAlpha = fade
    const draw = () => { g.setLineDash([p * 70, 70]); g.strokeStyle = 'rgba(255,250,232,0.95)'; g.lineWidth = 5 / k; g.shadowColor = '#fff1c8'; g.shadowBlur = 18; g.lineCap = 'round'; g.stroke() }
    plane('y', big.y0, () => { rimPath(big, 0); draw() })
    plane('y', big.y1, () => { const lo = lowPts(big, 0); g.beginPath(); lo.forEach(([x, z], i) => i ? g.lineTo(x, z) : g.moveTo(x, z)); draw() })
    g.restore()
  }
  // the element in motion, never an emblem
  function elementFx(h, sk, face) {
    const T = S.time, xl = h.xc - h.L, xr = h.xc + h.L
    if (face === 'shaman') { // wood: vines hang from the deck lip and sway
      g.save(); g.lineCap = 'round'
      for (let i = 0; i < 6; i++) {
        const u = (i + 0.5) / 6, x = xl + 1.2 + u * (2 * h.L - 2.4), len = 0.9 + hash(i * 3.3) * 1.4, sw = Math.sin(T * 1.1 + i * 1.9) * 0.22
        const a = P(x, h.y1 + 0.02, -0.05), c = P(x + sw * 0.5, h.y1 + 0.02, -len * 0.5), b = P(x + sw, h.y1 + 0.02, -len)
        g.strokeStyle = 'rgba(118,200,160,0.85)'; g.lineWidth = Math.max(1, 0.06 * k); g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(c[0], c[1], b[0], b[1]); g.stroke()
        for (let j = 1; j <= 3; j++) { const f = j / 3.4, q = [lerp(a[0], b[0], f) + sw * k * 0.3 * f, lerp(a[1], b[1], f)]; g.fillStyle = j % 2 ? '#9ee0bc' : '#7cc9a4'; g.beginPath(); g.ellipse(q[0] + (j % 2 ? 0.1 : -0.1) * k, q[1], 0.11 * k, 0.06 * k, j % 2 ? 0.6 : -0.6, 0, TAU); g.fill() }
      }
      g.restore()
    }
    if (face === 'challenger') { // fire: embers lift off the swept stern
      const R = RIM.comet, sx = xl - R.sb + R.sc * 0.4, sz = R.sh * h.bw
      for (let i = 0; i < 9; i++) {
        const f = loopT(T * 0.28 + hash(i * 1.7), 1), p = P(sx + Math.sin(f * 6 + i) * 0.4 - f * 1.6, h.y0 + 0.5, sz * 0.75 + f * 3.4)
        glow(p[0], p[1], 0.3 * k * (1 - f), '#ffb08a', 0.6 * (1 - f)); g.fillStyle = rgba('#ffe2c8', 0.9 * (1 - f)); g.beginPath(); g.arc(p[0], p[1], Math.max(0.6, 0.06 * k * (1 - f)), 0, TAU); g.fill()
      }
    }
    if (face === 'diplomat') { // metal: bands of light slide along the polished hull
      for (let i = 0; i < 2; i++) {
        const f = loopT(T * 0.1 + i * 0.5, 1), u = 0.08 + f * 0.84, x = h.xc + h.L * (2 * u - 1), dz = h.bot * depthOf(h.form, u)
        const a = P(x, h.y1 + 0.01, 0), b = P(x, h.y1 + 0.01, -dz), al = Math.sin(f * Math.PI)
        g.save(); g.strokeStyle = rgba('#ffffff', 0.75 * al); g.lineWidth = Math.max(1.5, 0.14 * k); g.shadowColor = '#e8f4ff'; g.shadowBlur = 14; g.lineCap = 'round'
        g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.restore()
      }
    }
    if (face === 'regent') { // earth: stones float under the keel
      for (let i = 0; i < 4; i++) {
        const u = 0.2 + i * 0.2, x = h.xc + h.L * (2 * u - 1) * 0.9, z = -h.bot * depthOf(h.form, u) - 0.9 - 0.25 * Math.sin(T * 0.8 + i * 1.3), p = P(x, h.y1 - 1.6, z), r = (0.32 + hash(i) * 0.2) * k
        g.fillStyle = mix(sk.old, '#ffffff', 0.15); g.beginPath(); g.ellipse(p[0], p[1], r, r * 0.62, 0.2, 0, TAU); g.fill()
        g.fillStyle = rgba(sk.acc, 0.7); g.beginPath(); g.ellipse(p[0] - r * 0.15, p[1] - r * 0.25, r * 0.6, r * 0.25, 0.2, 0, TAU); g.fill()
      }
    }
    if (face === 'sage') { // aether: slow motes drift round the ship
      for (let i = 0; i < 12; i++) {
        const x = xl + hash(i * 2.1) * 2 * h.L, y = h.y0 + hash(i * 7.3) * (h.y1 - h.y0), z = 0.8 + hash(i * 3.7) * 4.6 + Math.sin(T * 0.5 + i) * 0.4, p = P(x, y, z)
        glow(p[0], p[1], 0.35 * k, '#e6dcff', 0.35 + 0.25 * Math.sin(T * 1.3 + i)); g.fillStyle = '#f6f2ff'; g.beginPath(); g.arc(p[0], p[1], Math.max(0.7, 0.04 * k), 0, TAU); g.fill()
      }
    }
  }
  function formBehind(h, sk) { // the Seed Archive's samara wing rises from the stern behind the deck
    if (h.form !== 'seed') return
    const xl = h.xc - h.L
    plane('y', h.y0 + 0.3, () => {
      const sw = Math.sin(S.time * 0.7) * 0.15
      g.beginPath(); g.moveTo(xl + 0.8, 0); g.bezierCurveTo(xl - 0.6, 2.2, xl - 2.0 + sw, 4.4, xl - 3.4 + sw, 6.2)
      g.bezierCurveTo(xl - 2.4 + sw, 6.4, xl - 0.2, 4.2, xl + 3.0, 0.3); g.closePath()
      g.fillStyle = rgba(sk.nw, 0.55); g.fill(); g.strokeStyle = rgba(sk.acc, 0.8); g.lineWidth = 0.06; g.stroke()
      g.strokeStyle = rgba(sk.old, 0.5); g.lineWidth = 0.04
      for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(xl + 1.2 + i * 0.4, 0.2); g.quadraticCurveTo(xl - 0.6 + i * 0.2, 2.8 + i * 0.4, xl - 3.0 + sw + i * 0.3, 5.9 - i * 0.3); g.stroke() }
    })
  }
  function formFront(h) { // the Twin Lantern's two lanterns stand at stern and prow
    if (h.form !== 'twin') return
    for (const x of [h.xc - h.L + 1.0, h.xc + h.L - 1.0]) {
      const a = P(x, h.y1 - 0.4, 0), b = P(x, h.y1 - 0.4, 3.2)
      g.strokeStyle = '#a9bdd6'; g.lineWidth = Math.max(1.2, 0.08 * k); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke()
      lantern(x, h.y1 - 0.4, 2.0)
    }
  }

  // ---------- the machines of the one-room ships ----------
  const WOOD = ['#e8cba3', '#d1ad83', '#ad8762']
  function bellM(cx, cy, z, fl, swing) { // intake: the listening bell; soft rings drift in toward it
    box(cx - 0.75, cy - 0.08, z, cx - 0.63, cy + 0.08, z + 2.1, ...WOOD)
    box(cx + 0.63, cy - 0.08, z, cx + 0.75, cy + 0.08, z + 2.1, ...WOOD)
    box(cx - 0.82, cy - 0.1, z + 2.0, cx + 0.82, cy + 0.1, z + 2.16, ...WOOD)
    const p = P(cx, cy, z + 2.0), s = k, sw = swing != null ? Math.sin(S.time * 1.3) * 0.02 + swing : Math.sin(S.time * 1.3) * 0.06 + fl * 0.2 * Math.sin(S.time * 14)
    for (let i = 0; i < 3; i++) { const f = loopT(S.time * 0.35 + i / 3, 1), r = (1.7 - f * 1.3) * k; g.strokeStyle = rgba('#fff2cc', 0.4 * f); g.lineWidth = Math.max(1, 0.04 * k); g.beginPath(); g.ellipse(p[0], p[1] + 0.55 * s, r, r * 0.45, 0, 0, TAU); g.stroke() }
    g.save(); g.translate(p[0], p[1]); g.rotate(sw)
    const gr = g.createLinearGradient(-0.45 * s, 0, 0.45 * s, 0); gr.addColorStop(0, '#c99a5a'); gr.addColorStop(0.45, '#f6e2b0'); gr.addColorStop(1, '#b8884a')
    g.fillStyle = gr; g.beginPath(); g.moveTo(-0.13 * s, 0.1 * s); g.quadraticCurveTo(-0.2 * s, 0.55 * s, -0.46 * s, 0.95 * s); g.lineTo(0.46 * s, 0.95 * s); g.quadraticCurveTo(0.2 * s, 0.55 * s, 0.13 * s, 0.1 * s); g.closePath(); g.fill()
    g.fillStyle = '#8a6a3a'; g.beginPath(); g.arc(0, 1.0 * s, 0.08 * s, 0, TAU); g.fill()
    g.restore()
    if (fl > 0) glow3(cx, cy, z + 1.5, 1.4, SEED, 0.75 * fl)
  }
  function forgeM(cx, cy, z, fl) { // falsify: coals and an anvil; the strike shows the crack
    cylinder(cx - 0.6, cy, z, z + 0.55, 0.45, '#5a3a48', '#7a5a68')
    const fl2 = 0.8 + 0.2 * Math.sin(S.time * 5.1) * Math.sin(S.time * 1.7)
    plane('z', z + 0.56, () => { const gr = g.createRadialGradient(cx - 0.6, cy, 0, cx - 0.6, cy, 0.4); gr.addColorStop(0, '#ffe8d0'); gr.addColorStop(0.6, '#ff8a5a'); gr.addColorStop(1, '#a8404a'); g.globalAlpha = fl2; g.fillStyle = gr; g.beginPath(); g.arc(cx - 0.6, cy, 0.38, 0, TAU); g.fill(); g.globalAlpha = 1 })
    glow3(cx - 0.6, cy, z + 0.8, 1.3, '#ff8a70', 0.3 * fl2 + 0.35 * fl)
    box(cx + 0.45, cy - 0.18, z, cx + 0.8, cy + 0.18, z + 0.45, '#b8bccb', '#8e93a8', '#71768c')
    box(cx + 0.15, cy - 0.24, z + 0.45, cx + 1.1, cy + 0.24, z + 0.65, '#dde1ec', '#a4aac0', '#868ca4')
    const hit = Math.max(0, Math.sin(S.time * 2.4)), p = P(cx + 0.6, cy, z + 0.66)
    if (hit > 0.94) for (let i = 0; i < 5; i++) { const a = -1.2 - i * 0.35; g.fillStyle = '#ffe0b0'; g.beginPath(); g.arc(p[0] + Math.cos(a) * 0.4 * k, p[1] + Math.sin(a) * 0.3 * k, Math.max(0.8, 0.03 * k), 0, TAU); g.fill() }
  }
  function mirrorM(cx, cy, z, fl) { // verify: the still pool shows the build back to you
    cylinder(cx, cy, z, z + 0.3, 0.95, '#eef5fb', '#a9bfd6')
    plane('z', z + 0.31, () => {
      const gr = g.createRadialGradient(cx - 0.2, cy - 0.2, 0, cx, cy, 0.8); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#9fd4ee')
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 0.78, 0, TAU); g.fill()
      for (let i = 0; i < 2; i++) { const f = loopT(S.time * 0.3 + i * 0.5, 1); g.strokeStyle = rgba('#ffffff', 0.7 * (1 - f)); g.lineWidth = 0.03; g.beginPath(); g.arc(cx, cy, 0.76 * f, 0, TAU); g.stroke() }
    })
    glow3(cx, cy, z + 0.9, 1.5, '#e8f4ff', 0.35 + 0.4 * fl)
  }
  function cradleM(cx, cy, z, fl) { // ship: two arms hold the sealed vessel, ready to let go
    box(cx - 0.8, cy - 0.3, z, cx + 0.8, cy + 0.3, z + 0.15, ...WOOD)
    plane('y', cy, () => { g.strokeStyle = '#c9a06a'; g.lineWidth = 0.14; g.lineCap = 'round'; for (const d of [-1, 1]) { g.beginPath(); g.moveTo(cx + d * 0.72, z + 0.15); g.quadraticCurveTo(cx + d * 0.8, z + 1.1, cx + d * 0.28, z + 1.25); g.stroke() } })
    const p = P(cx, cy, z + 1.3 + 0.04 * Math.sin(S.time * 1.6)), s = k
    glow(p[0], p[1], 0.9 * s, '#ffe2a0', 0.4 + 0.4 * fl)
    const gr = g.createRadialGradient(p[0] - 0.08 * s, p[1] - 0.08 * s, 0, p[0], p[1], 0.34 * s); gr.addColorStop(0, '#fffaf0'); gr.addColorStop(1, '#e6c48e')
    g.fillStyle = gr; g.beginPath(); g.ellipse(p[0], p[1], 0.34 * s, 0.24 * s, 0, 0, TAU); g.fill()
    g.fillStyle = '#8a3a4a'; g.beginPath(); g.arc(p[0] + 0.05 * s, p[1], 0.06 * s, 0, TAU); g.fill()
  }
  function storesM(cx, cy, z, fl) { // close: shelves of sealed jars
    box(cx - 0.95, cy - 0.25, z, cx - 0.85, cy + 0.25, z + 1.6, ...WOOD)
    box(cx + 0.85, cy - 0.25, z, cx + 0.95, cy + 0.25, z + 1.6, ...WOOD)
    for (const zz of [z + 0.02, z + 0.8]) {
      box(cx - 0.9, cy - 0.25, zz, cx + 0.9, cy + 0.25, zz + 0.07, ...WOOD)
      for (let i = 0; i < 4; i++) cylinder(cx - 0.6 + i * 0.4, cy, zz + 0.07, zz + 0.45, 0.13, i % 2 ? '#8fd0d0' : '#fff1d8', '#e7d4b0')
    }
    glow3(cx, cy, z + 1.0, 1.3, '#fff1c8', 0.25 + 0.5 * fl)
  }
  const MACH = { intake: bellM, falsify: forgeM, verify: mirrorM, ship: cradleM, close: storesM }

  // ---------- a one-room ship: the room, the Hearth and its store, one porter ----------
  const R1 = { x0: 0.2, W: 6.8, front: 7, H: 3.9 }, STORE1 = [9.2, 6.6], REST1 = [8.0, 7.6], HEARTH1 = [9.9, 4.3]
  const roomD = (rung) => Math.min(6.4, 3.6 + 0.6 * rung) // a higher rung covers more floor
  function machineSpot(d) { return [R1.x0 + 3.6, R1.front - Math.min(d * 0.6, 3.0)] }
  function rungs1(sw) { const r0 = sw.rooms[0].rung; return [r0, sw.spent ? sw.after.rungs[0] : r0] }
  function porter1(sw) {
    const t = S.t, ph = S.phase, spot = machineSpot(roomD(rungs1(sw)[0]))
    let a = { x: REST1[0], y: REST1[1], mv: false, dx: -1, dy: 0 }, carry = null
    if (ph === 'run' && Wd.landed.loom) {
      a = kf(t, [[0, ...REST1], [1.4, ...REST1], [2.6, 4.2, 7.55], [3.1, 4.2, 7.55], [4.3, 8.7, 7.1], [4.7, 8.7, 7.1], [5.3, ...REST1]])
      if (t > 3.0 && t < 4.4) carry = 'seed'
    }
    if (ph === 'intake' && Wd.spent) {
      a = kf(t, [[0, ...REST1], [2.0, ...REST1], [2.6, 8.7, 7.1], [3.5, 8.7, 7.1], [5.4, 4.2, 7.55], [5.9, spot[0] + 0.9, R1.front - 0.5], [6.6, spot[0] + 0.9, R1.front - 0.5], [7.1, 4.2, 7.55], [9.4, ...REST1]])
      if (t > 2.7 && t < 6.2) carry = 'seed'
    }
    return [{ x: a.x, y: a.y, o: { sash: RUNG[1], carry, walk: a.mv, face: a.mv ? faceOf(a) : -1, seed: 1.3 } }]
  }
  function room1(sw, sk, actors) {
    const [r0, r1] = rungs1(sw), pm = clamp(S.chartD - 1), cm = S.chartMix
    const d = lerp(roomD(r0), roomD(r1), pm), col = mix(RUNG[r0], RUNG[r1], cm), x0 = R1.x0, W = R1.W, front = R1.front
    room({ x0, x1: x0 + W, d, front, H: R1.H, col, wall: wallOf(sk) }, (y0, ft) => {
      floorPool(x0 + W * 0.5, front - d * 0.5, ft, 1.6 + d * 0.5, [x0, y0, W, d], 0.3)
      const [mx, my] = machineSpot(d), T = S.time, mv = moving(), n = Math.min(3, r0), extra = r1 > r0 && n < 3 ? cm : 0
      const M = MACH[sw.rooms[0].stage] || storesM
      const items = [{ x: mx, y: my, f: () => M(mx, my, ft, S.flash.loom + S.flash.chart) }]
      for (let i = 0; i < n + (extra > 0 ? 1 : 0); i++) {
        const ax = x0 + 0.9 + i * 1.7, ay = front - 0.5 - (i % 2) * 0.55, bx = mx - 0.9 + i * 0.7, by = Math.min(front - 0.4, my + 0.75)
        if (i < 3) route([[ax, ay], [(ax + bx) / 2, (ay + by) / 2 + 0.2], [bx, by]], ft, col)
        const w = kf(loopT(T + i * 1.6, 4.6), [[0, ax, ay], [0.8, ax, ay], [2.0, bx, by], [2.8, bx, by], [4.0, ax, ay], [4.6, ax, ay]])
        const alpha = i >= n ? extra : undefined
        items.push({ x: w.x, y: w.y, f: () => crew(w.x, w.y, ft, { sash: col, master: i === 0 && r0 >= 4, walk: w.mv || mv, face: w.mv ? faceOf(w) : (i % 2 ? -1 : 1), seed: 0.7 + i * 1.9, alpha }) })
      }
      actors.filter((q) => q.x > x0 && q.x < x0 + W && q.y < front).forEach((q) => items.push({ x: q.x, y: q.y, f: () => crew(q.x, q.y, ft, q.o) }))
      sortDraw(items)
      lantern(x0 + W * 0.5, front - d * 0.5, 3.0)
    })
  }
  function seeds1(sw, big) {
    const out = [], t = S.t, [mx, my] = machineSpot(roomD(rungs1(sw)[0]))
    const fly = (t0, from, to, t1, t2) => {
      if (t < t0 || t > t2) return
      if (t < t1) { const f = ease((t - t0) / (t1 - t0)); out.push([from[0], from[1], lerp(from[2], from[2] + 2.4, f), 1 - f * 0.3]) }
      else { const f = ease((t - t1) / (t2 - t1)), z0 = from[2] + 2.4; out.push([lerp(from[0], to[0], f), lerp(from[1], to[1], f), lerp(z0, to[2], f) + Math.sin(f * Math.PI) * 0.6, 0.7]) }
    }
    if (S.phase === 'run' && Wd.landed.loom) {
      fly(1.0, [mx, my, 2.0], [4.2, 7.55, 1.75], 1.9, 3.0)
      if (t >= 4.3 && t <= 4.6) { const f = ease((t - 4.3) / 0.3); out.push([lerp(8.7, STORE1[0], f), lerp(7.1, STORE1[1], f), lerp(1.9, 0.55, f), 0.6]) }
    }
    if (S.phase === 'intake' && Wd.spent) {
      if (t >= 2.0 && t <= 2.7) { const f = ease((t - 2.0) / 0.7); out.push([lerp(STORE1[0], 8.7, f), lerp(STORE1[1], 7.1, f), 0.6 + Math.sin(f * Math.PI) * 1.2 + f * 1.1, 0.9]) }
      if (t >= 6.1 && t <= 6.4) { const f = ease((t - 6.1) / 0.3); out.push([lerp(mx + 0.9, mx, f), lerp(R1.front - 0.5, my, f), lerp(1.7, 1.0, f), 0.9]) }
    }
    if (S.phase === 'intake' && Wd.opens) for (let i = 0; i < Wd.cost; i++) {
      const t0 = 9.4 + i * 0.25, t1 = t0 + 1.2
      if (t >= t0 && t <= t1) { const f = ease((t - t0) / (t1 - t0)), tx = big.xc + (i % 2 ? 1 : -1) * (2.5 + 2 * i), ty = big.y0 + 0.4; out.push([lerp(STORE1[0], tx, f), lerp(STORE1[1], ty, f), lerp(0.6, 3.4, f) + Math.sin(f * Math.PI) * 1.4, 1 - f * 0.5]) }
    }
    out.forEach(([x, y, z, gl]) => seed(x, y, z, gl, 1.25))
  }
  function oneScene(sw, h, big, o) {
    o = o || {}
    const sk = SKIN[sw.face] || SKIN.architect
    { const p = P(h.xc, 4.0, -h.bot - 2.2); g.save(); g.translate(p[0], p[1]); g.scale(1, 0.18); glow(0, 0, lerp(h.L, big.L, S.skin) * k * 1.1, '#0f2a3a', 0.35); g.restore() }
    if (S.skin > 0.01) { g.save(); g.globalAlpha = S.skin; formBehind(big, sk); rimG(big, sk); hullG(big, sk); g.restore() }
    if (o.ghost) ghostG(big, (1 - S.skin) * (o.ghostA || 1))
    if (o.wake !== false) tail(S.skin > 0.5 ? big : h, o.wakeLen)
    formBehind(h, sk)
    rimG(h, sk)
    hullG(h, sk, { under: 1 - S.skin, seam: S.skin })
    elementFx(S.skin > 0.5 ? big : h, sk, sw.face)
    if (o.ghost) skinLightG(big)
    const xl = h.xc - h.L, xr = h.xc + h.L
    ribbon([[xl + 0.6, 7.6], [xr - 0.6, 7.6]], 0.02, 0.6)
    ribbon([[8.4, 7.6], [9.3, 5.6]], 0.02, 0.5)
    if (S.move > 0.01) { // the ground the larger hull opens: a faint floor for the room it can hold next
      path3([[11.2, big.y0 + 0.7, 0.02], [big.xc + big.L - 0.9, big.y0 + 0.7, 0.02], [big.xc + big.L - 0.9, 5.8, 0.02], [11.2, 5.8, 0.02]])
      g.fillStyle = 'rgba(214,240,255,' + 0.07 * S.move + ')'; g.fill()
      g.save(); g.setLineDash([0.22 * k, 0.18 * k]); g.strokeStyle = 'rgba(255,252,240,' + 0.42 * S.move + ')'; g.lineWidth = Math.max(1, 0.05 * k); g.stroke(); g.restore()
    }
    const actors = porter1(sw)
    room1(sw, sk, actors)
    hearth(HEARTH1[0], HEARTH1[1])
    store(STORE1[0], STORE1[1])
    const T = S.time * 0.55 // the qi current runs stern to bow along the walkway
    for (let i = 0; i < 9; i++) { const x0 = xl + 0.8, span = xr - 0.8 - x0; bead(x0 + loopT(i * span / 9 + T, span), 7.6, 0.02, 0.1) }
    actors.filter((q) => q.y >= R1.front).forEach((q) => crew(q.x, q.y, 0.02, q.o))
    formFront(h)
    seeds1(sw, big)
    if (!S.fleet) { const [mx, my] = machineSpot(roomD(rungs1(sw)[0])); HIT.store = P(STORE1[0], STORE1[1], 0.4); HIT.chart = P(mx, my, 1.2); HIT.k = k }
  }
  function sbox(pts) {
    let a = 1e9, b = -1e9, c = 1e9, d = -1e9
    for (const [x, y, z] of pts) { const p = P(x, y, z); a = Math.min(a, p[0]); b = Math.max(b, p[0]); c = Math.min(c, p[1]); d = Math.max(d, p[1]) }
    return [a, c, b, d]
  }
  const ptsOne = (q) => boxPts(q.id, q.cls).concat([[q.xc - q.L - 1.2, q.y1, -0.5]])
  function camera1(W, H, phone, h, big, opens) {
    let A, B
    if (phone) { A = fit(ptsOne(h), 10, H * 0.28, W - 20, H * 0.5); B = fit(ptsOne(big), 6, H * 0.26, W - 12, H * 0.52) }
    else { A = fit(ptsOne(h), 90, 100, W - 180, H - 190); B = fit(ptsOne(big), 60, 70, W - 120, H - 130) }
    const f = phone && S.phase === 'launch' && opens ? 1 : S.cam
    k = lerp(A[0], B[0], f); ox = lerp(A[1], B[1], f); oy = lerp(A[2], B[2], f)
    oy += Math.sin(S.time * 1.1) * 2.2 * (k / 45)
    HIT.box = sbox(ptsOne(S.skin > 0.5 ? big : h))
  }
  function oneFrame(W, H, opts) {
    const sw = opts.ship
    Wd = { landed: { loom: !!sw.rooms[0].landed, foundry: false, chart: false }, carried: sw.carried, spent: sw.spent, opens: sw.opens, cost: sw.cost }
    S = state(opts.phase || 'run', opts.t || 0); S.phone = !!opts.phone; S.time += opts.idle || 0
    // held by the fleet rule: the light runs round the waiting hull at the intake, and it stays shut
    if (sw.held === 'fleet' && S.phase === 'intake') S.skinLine = clamp((S.t - 9.4) / 1.2)
    const h = geo(sw.id, sw.hull), big = geo(sw.id, Math.min(GROWTH_MAX, sw.hull + 1))
    camera1(W, H, S.phone, h, big, sw.opens)
    sky(W, H); harbour(W, H)
    oneScene(sw, h, big, { ghost: true })
    if (S.harbour > 0.01) { g.save(); g.globalCompositeOperation = 'screen'; glow(W * ((S.phone ? 0.62 : 0.74) + S.harbourX), H * (S.phone ? 0.62 : 0.45), Math.max(W, H) * 0.55, '#ffdcb0', 0.2 * S.harbour); g.restore() }
    tapLayer(W, H, opts)
  }
  const GROWTH_MAX = 6

  // ---------- the fleet: six face ships in convoy on one qi current, racing the compost tide to the harbour ----------
  const ORDER = ['gourd-star', 'orrery', 'ember-comet', 'twin-lantern', 'jade-palace', 'seed-archive']
  const DOOR = { intake: ['gourd-star', 3.6, 7.6], spec: ['orrery', 3.5, 8.5], falsify: ['ember-comet', 3.6, 7.6], plan: ['orrery', 20.9, 8.5], build: ['orrery', 14.3, 8.5], verify: ['twin-lantern', 3.6, 7.6], ship: ['jade-palace', 3.6, 7.6], close: ['seed-archive', 3.6, 7.6] }
  const PIPE = ['intake', 'spec', 'falsify', 'plan', 'build', 'verify', 'ship', 'close']
  let FL = null // the last fleet layout: items with their screen boxes, for taps and the sail-in
  function boxPts(id, cls) {
    const h = geo(id, cls)
    if (h.form === 'pods') return cls <= 1 ? [[-3.6, 9, -1.5], [-1, 1, 4.4], [11.5, 9, -5.2], [26.8, -0.5, 5.6], [26.8, 9, -0.5]] : [[-7.6, 9, -1.5], [-6, -2.8, 3.6], [11.5, 9, -6.4], [31.4, -3, 7.2], [31.2, 9, -0.5]]
    const R = RIM[h.form], wing = h.form === 'seed' ? [[h.xc - h.L - 3.6, h.y0, 6.4]] : []
    return wing.concat([[h.xc - h.L - R.sb - R.sc - 0.8, h.y0, R.sh * h.bw + 0.4], [h.xc + h.L + R.pb + 0.6, h.y1, 0], [h.xc - h.L, h.y0, 4.4], [h.xc + h.L, h.y0, Math.max(4.0, R.ph * h.bw)], [h.xc, h.y1, -h.bot - 0.3], [h.xc - h.L, h.y1, 0]])
  }
  function proj(pts) {
    let a = 1e9, b = -1e9, c = 1e9, d = -1e9
    for (const [x, y, z] of pts) { const sx = x * AX[0] + y * AY[0], sy = x * AX[1] + y * AY[1] - z; a = Math.min(a, sx); b = Math.max(b, sx); c = Math.min(c, sy); d = Math.max(d, sy) }
    return { cx: (a + b) / 2, cy: (c + d) / 2, w: b - a, h: d - c }
  }
  const HEAD = [0.967, 0.252] // the heading on screen: along +x, stern left
  function layout(fl, W, H, phone) {
    const ships = ORDER.map((id) => fl.ships.find((s) => s.id === id)).filter(Boolean)
    const items = ships.map((s) => ({ s, b: proj(boxPts(s.id, s.hull)), x: 0, y: 0 }))
    const free = items.filter((i) => i.s.held !== 'fleet'), held = items.filter((i) => i.s.held === 'fleet')
    const small = free.reduce((m, i) => (!m || i.s.hull < m.s.hull ? i : m), null)
    // a ship held by the fleet rule rides in the smallest ship's wake, tucked in behind it on the current
    let cur = 0, prev = null
    const edge = { '-1': -1e9, 1: -1e9 }
    free.forEach((it, n) => {
      const behind = it === small ? held : [], lane = phone ? (behind.length ? 1 : n % 2 ? 1 : -1) : (n % 2 ? 1 : -1)
      if (!phone) { // two lanes, staggered: each ship a little ahead of the last, never over one in its own lane
        const hw = behind.reduce((s, h) => s + h.b.w * 0.98, 0)
        it.x = Math.max(prev ? prev.x + prev.b.w * 0.1 + it.b.w * 0.1 : 0, edge[lane] + 0.8 + hw + it.b.w / 2)
        it.y = lane * 8.6; edge[lane] = it.x + it.b.w / 2; prev = it
      } else {
        it.x = lane * 4.6; it.y = cur - it.b.h / 2; cur = it.y - it.b.h * 0.5
      }
      let back = it
      behind.forEach((h) => { const dist = (back.b.w + h.b.w) / 2 * 0.98; h.x = back.x - dist * HEAD[0]; h.y = back.y - dist * HEAD[1]; back = h })
      it.wakeTo = behind.length ? behind[behind.length - 1] : null
    })
    let a = 1e9, b = -1e9, c = 1e9, d = -1e9
    items.forEach((i) => { a = Math.min(a, i.x - i.b.w / 2); b = Math.max(b, i.x + i.b.w / 2); c = Math.min(c, i.y - i.b.h / 2); d = Math.max(d, i.y + i.b.h / 2) })
    const m = phone ? [10, H * 0.13, W - 10, H * 0.93] : [W * 0.09, H * 0.08, W * 0.9, H * 0.95]
    const kk = Math.min((m[2] - m[0]) / (b - a), (m[3] - m[1]) / (d - c))
    const OX = (m[0] + m[2]) / 2 - ((a + b) / 2) * kk, OY = (m[1] + m[3]) / 2 - ((c + d) / 2) * kk
    items.forEach((i, n) => {
      const sx = OX + i.x * kk, sy = OY + i.y * kk
      i.ox = sx - i.b.cx * kk; i.oy = sy - i.b.cy * kk; i.sy = sy; i.n = ORDER.indexOf(i.s.id)
      i.box = [sx - i.b.w / 2 * kk, sy - i.b.h / 2 * kk, sx + i.b.w / 2 * kk, sy + i.b.h / 2 * kk]
    })
    return { items, k: kk }
  }
  function tideFx(W, H, phone, t) { // the compost tide: neglect, a slow dark swell behind the convoy; seeds glow at its edge
    g.save()
    for (let i = 0; i < 9; i++) {
      const f = i / 8, wob = Math.sin(t * 0.3 + i * 1.7)
      const x = phone ? W * f : -W * 0.02 + wob * W * 0.012, y = phone ? H * 1.02 + wob * H * 0.008 : H * f
      glow(x, y, (phone ? W * 0.32 : H * 0.2), i % 3 ? '#110e28' : '#1d2a2c', 0.85)
    }
    for (let i = 0; i < 4; i++) {
      const f = (i + 0.5) / 4, wob = Math.sin(t * 0.4 + i * 2.3)
      const x = phone ? W * f + wob * 6 : W * 0.06 + wob * 6, y = phone ? H * 0.955 + wob * 3 : H * f + wob * 8
      glow(x, y, 18, SEED, 0.4 + 0.15 * Math.sin(t * 1.5 + i)); g.save(); g.translate(x, y); g.rotate(-0.5); g.fillStyle = '#fff3d6'; g.beginPath(); g.ellipse(0, 0, 2.6, 3.8, 0, 0, TAU); g.fill(); g.restore()
    }
    g.restore()
  }
  function smoothPts(pts) {
    const out = []
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]
      for (let s = 0; s < 16; s++) {
        const u = s / 16, u2 = u * u, u3 = u2 * u
        out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3)))
      }
    }
    out.push(pts[pts.length - 1]); return out
  }
  function currentFx(L, W, H, phone, t, hb) { // one current of qi through every room in pipeline order, on to the harbour
    const pts = [phone ? [W * 0.3, H * 1.02] : [-10, H * 0.62]]
    for (const st of PIPE) {
      const [id, x, y] = DOOR[st], it = L.items.find((i) => i.s.id === id)
      if (!it) continue
      const h = geo(id, it.s.hull); k = L.k; ox = it.ox; oy = it.oy; pts.push(P(x, y, -h.bot * 0.9)) // under the keel: a current on the water, not a line between doors
    }
    pts.push([hb[0], hb[1]])
    const sp = smoothPts(pts)
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round'
    const path = () => { g.beginPath(); sp.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))) }
    path(); g.strokeStyle = 'rgba(191,243,230,0.08)'; g.lineWidth = 2.6 * L.k; g.stroke()
    path(); g.strokeStyle = 'rgba(255,244,214,0.12)'; g.lineWidth = 1.2 * L.k; g.stroke()
    for (let i = -1; i <= 1; i++) { // three soft strands drifting, like the wake ribbons
      g.save(); g.translate(0, i * 0.35 * L.k + Math.sin(t * 0.8 + i * 2) * 0.12 * L.k); path(); g.strokeStyle = rgba(i ? SK.lite : '#fbf1dc', i ? 0.16 : 0.26); g.lineWidth = (i ? 0.12 : 0.2) * L.k; g.stroke(); g.restore()
    }
    g.restore()
    const seg = []; let len = 0
    for (let i = 0; i < sp.length - 1; i++) { const l = Math.hypot(sp[i + 1][0] - sp[i][0], sp[i + 1][1] - sp[i][1]); seg.push(l); len += l }
    for (let n = 0; n < 46; n++) {
      let dd = loopT(n / 46 + t * 0.018, 1) * len, i = 0
      while (i < seg.length - 1 && dd > seg[i]) { dd -= seg[i]; i++ }
      const u = seg[i] ? dd / seg[i] : 0, x = lerp(sp[i][0], sp[i + 1][0], u), y = lerp(sp[i][1], sp[i + 1][1], u), r = 0.13 * L.k
      glow(x, y, r * 3, '#cfeaff', 0.5); g.fillStyle = '#f6fbff'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill()
    }
  }
  function fleetFrame(ctx, W, H, opts) {
    opts = opts || {}
    g = ctx
    const fl = opts.fleet, t = opts.t || 0, phone = !!opts.phone
    S = { phase: 'run', t: 0, time: t, D: t * 0.7, v: 0.6, phone, fleet: true, harbour: 1, harbourX: 0 }
    const L = layout(fl, W, H, phone)
    FL = L
    sky(W, H)
    tideFx(W, H, phone, t)
    const hb = phone ? [W * 0.72, H * 0.075] : [W * 0.985, H * 0.4]
    S.hb = phone ? { cx: hb[0], hy: hb[1], u: W / 390 * 0.32 } : { cx: hb[0], hy: hb[1], u: Math.min(W / 1600, H / 1000) * 0.85 }
    harbour(W, H)
    currentFx(L, W, H, phone, t, hb)
    const order = L.items.slice().sort((a, b) => a.sy - b.sy)
    order.forEach((it) => {
      const sw = it.s, held = sw.held === 'fleet', off = it.n * 2.3
      k = L.k; ox = it.ox; oy = it.oy + Math.sin(t * 1.1 + it.n * 1.3) * 2 * (k / 45)
      const wakeLen = it.wakeTo ? 4 + (it.b.w + it.wakeTo.b.w) * 0.75 : undefined
      if (sw.id === 'orrery') {
        const w = fl.orrery
        Wd = { ...DEMO, ...w, landed: { ...DEMO.landed, ...(w.landed || {}) } }
        S = state('run', loopT(t + off, 13)); S.fleet = true; S.phone = phone; S.time = t + off; S.D = t * 0.7; S.v = held ? 0.2 : 0.75
        if (sw.hull >= 2) { S.skin = 1; S.move = 1 }
        S.wakeLen = wakeLen
        shipScene()
      } else {
        Wd = { landed: { loom: !!sw.rooms[0].landed, foundry: false, chart: false }, carried: sw.carried, spent: sw.spent, opens: sw.opens, cost: sw.cost }
        S = state('run', loopT(t + off, 13)); S.fleet = true; S.phone = phone; S.time = t + off; S.D = t * 0.7; S.v = held ? 0.2 : 0.75
        const h = geo(sw.id, sw.hull), big = geo(sw.id, Math.min(GROWTH_MAX, sw.hull + 1))
        oneScene(sw, h, big, { ghost: held, ghostA: 1, wake: !held, wakeLen })
      }
    })
    g.save(); g.globalCompositeOperation = 'screen'; glow(hb[0], hb[1] + (phone ? H * 0.05 : 0), Math.max(W, H) * 0.5, '#ffdcb0', 0.14); g.restore()
  }
  function fleetHit(px, py) {
    if (!FL) return null
    const order = FL.items.slice().sort((a, b) => b.sy - a.sy)
    for (const it of order) { const b = it.box; if (px >= b[0] && px <= b[2] && py >= b[1] && py <= b[3]) return it.s.id }
    return null
  }
  function fleetBox(id) { const it = FL && FL.items.find((i) => i.s.id === id); return it ? it.box.slice() : null }
  // the way back out: a small glass with the fleet in it, no text
  function backGlyph() {
    const x = 34, y = 34, r = 19
    glow(x, y, r * 2.2, '#fff1c8', 0.16)
    g.fillStyle = 'rgba(36,32,90,0.5)'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill()
    g.strokeStyle = 'rgba(255,246,220,0.8)'; g.lineWidth = 1.6; g.stroke()
    for (let i = 0; i < 6; i++) { const px = x - 11 + i * 4.4, py = y + 4 - Math.sin((i / 5) * Math.PI) * 7; g.fillStyle = i === 1 ? '#fff1c8' : '#d0f4ff'; g.beginPath(); g.ellipse(px, py, i === 1 ? 2.6 : 1.9, 1.3, 0.25, 0, TAU); g.fill() }
    HIT.back = [x, y, r + 12]
  }

  function frame(ctx, W, H, opts) {
    opts = opts || {}
    g = ctx; HIT.back = null
    if (opts.ship && opts.ship.id !== 'orrery') oneFrame(W, H, opts) // round 10: any one-room ship runs the same loop
    else {
      Wd = opts.world ? { ...DEMO, ...opts.world, landed: { ...DEMO.landed, ...(opts.world.landed || {}) } } : DEMO
      S = state(opts.phase || 'run', opts.t || 0); S.phone = !!opts.phone
      S.time += opts.idle || 0 // seconds the player has kept the intake waiting: the ship and crew keep living meanwhile
      camera(W, H, S.phone)
      sky(W, H)
      harbour(W, H)
      shipScene()
      if (S.harbour > 0.01) { // harbour light on the ship: warm from one side, the sky stays cool on the other
        g.save(); g.globalCompositeOperation = 'screen'; glow(W * ((S.phone ? 0.62 : 0.74) + S.harbourX), H * (S.phone ? 0.62 : 0.45), Math.max(W, H) * 0.55, '#ffdcb0', 0.2 * S.harbour); g.restore()
      }
      tapLayer(W, H, opts)
    }
    if (opts.back) backGlyph()
    if (opts.veil > 0) { g.fillStyle = `rgba(36,32,90,${clamp(opts.veil)})`; g.fillRect(0, 0, W, H) }
  }
  // what a tap at a screen point touches: 'back' | 'store' | 'chart' (the room being deepened, on any ship) | 'water' | null
  function hit(px, py) {
    if (HIT.back && Math.hypot(px - HIT.back[0], py - HIT.back[1]) < HIT.back[2]) return 'back'
    if (!HIT.store) return null
    const kk = HIT.k
    if (Math.hypot(px - HIT.store[0], py - HIT.store[1]) < Math.max(28, 1.0 * kk)) return 'store'
    if (Math.hypot(px - HIT.chart[0], py - HIT.chart[1]) < Math.max(40, 2.6 * kk)) return 'chart'
    const b = HIT.box
    if (b && (px < b[0] - 10 || px > b[2] + 10 || py < b[1] - 10 || py > b[3] + 10)) return 'water'
    return null
  }
  // the loop clock: global seconds -> phase and t
  function at(T) { T = loopT(T, LOOP); for (const p of PHASES.slice().reverse()) if (T >= START[p]) return { phase: p, t: T - START[p] } }

  // ================= the Shaman's loop, loop 1 (/board/studio?shaman=1) =================
  // Ported from studio-tycoon/shaman-loop-r1/shaman-scene.part.js, with his steers of 2026-10-26: the eight stages are
  // eight small rooms off a ring round the Hearth (each its own floor, a low curved back wall of an older skin, a
  // doorway open toward the Hearth), all unlocked. A room whose work waits on the board is charged: the brightest,
  // most alive thing in the scene. A room whose work landed this run is warm and sends up its seed. The spoke of light
  // from the Hearth to a room is blocked (a fallen stone under vines) until that room's work lands. Embers sit where a
  // move was given. Nothing here is text, a number or a panel; the page's cards are the only words.
  // Loop 2: each room has its own verb, which the Shaman's body does first and the machine answers (verbFx), and the
  // Hearth can go cold: grey coals, no flame, one charged ember on it, the crew standing back, and a second blocked part
  // (grey ash stones) at the Hearth end of each spoke it holds; kindling is a small flame in the coals.
  // API: AltR9.shamanFrame(ctx, W, H, opts) with opts { phone, t, runT, rooms (ShamanWorld rooms), focus, shaman:
  // { a, out, in, kneel, pose }, verb: { stage, f }, embers: [{ id, stage, bright }], hint: { stage, idle },
  // hearth: { state: 'lit' | 'cold' | 'kindling', holds: [stage], queue: n, bright } };
  // AltR9.shamanHit(px, py) -> { ember: id } | { hearth: true } | { room: stage } | null; AltR9.shamanBox(stage) ->
  // [x0, y0, x1, y1]; AltR9.shamanPoint(stage) -> the screen point a card hangs from; AltR9.shamanAnchor(stage) ->
  // { x, y, side } to hang a card beside a room (or the Hearth) on the outside; AltR9.shamanHearth() -> { x, y, r }.
  const RING = { cx: 4.9, cy: 4.0, rx: 5.0, ry: 3.75, st: 0.74, walk: 0.46 }
  const ROOM8 = { rx: 1.06, ry: 0.9, H: 0.95, door: 1.05, sc: 0.74 }
  const STAGES8 = ['intake', 'spec', 'falsify', 'plan', 'build', 'verify', 'ship', 'close']
  const ANG8 = (i) => Math.PI * 0.55 + (i / 8) * TAU
  function ringAt(i, r) { const a = ANG8(i); return [RING.cx + Math.cos(a) * r * RING.rx, RING.cy + Math.sin(a) * r * RING.ry] }
  const SHM = { rooms: {}, embers: [], k: 40, last: null, face: 1, hearth: null, centre: [0, 0] }
  let VX = null // the verb playing now, { st, f }, which the machines answer
  const QUIET = '#8f7fe0', MAG = '#ff4fb0', GOLD = '#ffc94a', CREW8 = 0.66 // figures scaled to the rooms
  function dimMix(c, lit) { return lit ? c : mix(c, QUIET, 0.3) } // quiet, never grey: a cool lavender wash
  function scaled(cx, cy, z, sc, fn) { // draw fn about (cx, cy, z) at sc of the scene's scale
    const k0 = k, ox0 = ox, oy0 = oy, q = P(cx, cy, z)
    k = k0 * sc; const q2 = P(cx, cy, z); ox += q[0] - q2[0]; oy += q[1] - q2[1]
    try { fn() } finally { k = k0; ox = ox0; oy = oy0 }
  }
  function cordM(cx, cy, z, lit) { // spec: a frame of hanging cords; a knot is tied for each position he lets stand
    box(cx - 0.62, cy - 0.06, z, cx - 0.52, cy + 0.06, z + 1.7, ...WOOD.map((c) => dimMix(c, lit)))
    box(cx + 0.52, cy - 0.06, z, cx + 0.62, cy + 0.06, z + 1.7, ...WOOD.map((c) => dimMix(c, lit)))
    box(cx - 0.68, cy - 0.08, z + 1.62, cx + 0.68, cy + 0.08, z + 1.76, ...WOOD.map((c) => dimMix(c, lit)))
    plane('y', cy, () => {
      for (let i = 0; i < 6; i++) {
        const x = cx - 0.4 + i * 0.16, sw = Math.sin(S.time * 1.2 + i) * 0.03
        g.strokeStyle = dimMix(i % 2 ? '#e7c8a0' : '#b4e6d2', lit); g.lineWidth = 0.035
        g.beginPath(); g.moveTo(x, z + 1.62); g.quadraticCurveTo(x + sw, z + 1.0, x + sw * 2, z + 0.35); g.stroke()
        for (let j = 0; j < 1 + (i % 3); j++) { g.fillStyle = dimMix('#d8509f', lit); g.beginPath(); g.arc(x + sw, z + 1.3 - j * 0.28, 0.045, 0, TAU); g.fill() }
      }
    })
    if (lit) glow3(cx, cy, z + 1.0, 1.2, '#fff1c8', 0.3)
  }
  function smokeM(cx, cy, z, lit) { // falsify: a smoke bowl; the smoke bends where the claim is not true
    cylinder(cx, cy, z, z + 0.32, 0.42, dimMix('#6f5a50', lit), dimMix('#9a8070', lit))
    plane('z', z + 0.33, () => { g.fillStyle = lit ? '#ffb08a' : '#c3a4ee'; g.beginPath(); g.arc(cx, cy, 0.3, 0, TAU); g.fill() })
    const base = P(cx, cy, z + 0.4), bend = VX && VX.st === 'falsify' ? 1.9 * bump(VX.f, 0.3, 1) : 0 // his breath bends it hard, then it settles
    g.save(); g.lineCap = 'round'
    for (let i = 0; i < 3; i++) {
      g.strokeStyle = `rgba(236,242,250,${lit ? 0.55 - i * 0.12 + 0.3 * bend / 1.9 : 0.3})`; g.lineWidth = Math.max(1, (0.12 - i * 0.025) * k)
      g.beginPath(); g.moveTo(base[0], base[1])
      const T = S.time * 0.6 + i
      g.bezierCurveTo(base[0] + Math.sin(T) * 0.3 * k + bend * 0.4 * k, base[1] - 0.8 * k + bend * 0.2 * k, base[0] - 0.4 * k + i * 0.2 * k + bend * 1.1 * k, base[1] - 1.3 * k + bend * 0.4 * k, base[0] + (lit ? 0.7 : 0.1) * k + bend * 1.6 * k, base[1] - (2.0 + i * 0.3) * k + bend * 0.7 * k)
      g.stroke()
    }
    g.restore()
    if (lit) glow3(cx, cy, z + 0.6, 1.1, '#ff9a7a', 0.35)
  }
  function drumM(cx, cy, z, lit) { // plan: the drum; a pick of his sets the beat the ship sails to
    cylinder(cx, cy, z, z + 0.62, 0.48, dimMix('#f3e2c0', lit), dimMix('#b9875a', lit))
    plane('z', z + 0.63, () => {
      g.strokeStyle = dimMix('#d8509f', lit); g.lineWidth = 0.04; g.beginPath(); g.arc(cx, cy, 0.3, 0, TAU); g.stroke()
      if (lit) { const f = loopT(S.time * 0.8, 1); g.strokeStyle = `rgba(255,250,235,${0.7 * (1 - f)})`; g.lineWidth = 0.03; g.beginPath(); g.arc(cx, cy, 0.48 + f * 0.9, 0, TAU); g.stroke() }
    })
    if (lit) glow3(cx, cy, z + 0.8, 1.1, '#fff1c8', 0.3)
  }
  function carveM(cx, cy, z, lit) { // build: a low bench and a gourd vessel half shaped from the wood
    box(cx - 0.6, cy - 0.28, z, cx + 0.6, cy + 0.28, z + 0.4, ...WOOD.map((c) => dimMix(c, lit)))
    const p = P(cx + 0.05, cy, z + 0.4), s = k
    g.fillStyle = dimMix('#9ee0bc', lit)
    g.beginPath(); g.ellipse(p[0], p[1] - 0.28 * s, 0.26 * s, 0.28 * s, 0, 0, TAU); g.fill()
    g.beginPath(); g.ellipse(p[0], p[1] - 0.68 * s, 0.15 * s, 0.17 * s, 0, 0, TAU); g.fill()
    g.fillStyle = dimMix('#f6e6c8', lit); for (let i = 0; i < 4; i++) { const j = Math.sin(S.time * 2 + i) * 0.03 * s; g.beginPath(); g.ellipse(p[0] - 0.4 * s + i * 0.1 * s, p[1] + 0.05 * s + j, 0.05 * s, 0.02 * s, 0.4, 0, TAU); g.fill() }
  }
  function boatM(cx, cy, z, lit) { // ship: a leaf boat with a small light, set on a channel that runs out to the current
    const go = VX && VX.st === 'ship' ? VX.f : 0, sl = ease((go - 0.5) / 0.45) * 1.1, rise = ease((go - 0.62) / 0.38)
    const ux = Math.cos(0.5), uy = Math.sin(0.5), bx = cx + ux * sl, by = cy + uy * sl // he lets go and it slides out along its channel
    plane('z', z + 0.01, () => {
      g.fillStyle = lit ? 'rgba(170,225,240,0.6)' : 'rgba(160,150,235,0.45)'; g.beginPath(); g.ellipse(cx, cy, 0.7, 0.42, 0.5, 0, TAU); g.fill()
      if (go > 0) { g.fillStyle = 'rgba(170,225,240,0.45)'; g.beginPath(); g.ellipse(cx + ux * 0.9, cy + uy * 0.9, 1.1, 0.3, 0.5, 0, TAU); g.fill()
        const q = clamp((go - 0.5) * 2.2); if (q > 0 && q < 1) { g.strokeStyle = `rgba(255,255,255,${0.8 * (1 - q)})`; g.lineWidth = 0.03; g.beginPath(); g.ellipse(bx - ux * 0.2, by - uy * 0.2, 0.3 + 0.5 * q, 0.15 + 0.25 * q, 0.5, 0, TAU); g.stroke() } }
    })
    const p = P(bx, by, z + 0.12 + 0.03 * Math.sin(S.time * 1.4)), s = k * 1.5
    g.fillStyle = dimMix('#7cc9a4', lit); g.beginPath(); g.moveTo(p[0] - 0.42 * s, p[1] - 0.04 * s); g.quadraticCurveTo(p[0], p[1] + 0.22 * s, p[0] + 0.42 * s, p[1] - 0.12 * s); g.quadraticCurveTo(p[0], p[1] - 0.02 * s, p[0] - 0.42 * s, p[1] - 0.04 * s); g.fill()
    if (lit || go > 0) { glow(p[0], p[1] - 0.2 * s, 0.5 * s, '#ffe2a0', 0.7) }
    const ly = p[1] - 0.16 * s - rise * 1.6 * k // its light rises off it
    if (rise > 0) glow(p[0], ly, (0.6 + 0.5 * rise) * k, '#ffe2a0', 0.8)
    g.fillStyle = lit || go > 0 ? '#fff6dc' : '#d6c8f6'; g.beginPath(); g.arc(p[0], ly, 0.07 * s * (1 + 0.4 * rise), 0, TAU); g.fill()
  }
  function soilM(cx, cy, z, lit) { // close: a planting bed; a spent strand is laid down here and its seed goes in
    cylinder(cx, cy, z, z + 0.22, 0.55, dimMix('#7a5c40', lit), dimMix('#d6b88a', lit))
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1, x = cx + Math.cos(a) * 0.25, y = cy + Math.sin(a) * 0.25, b = P(x, y, z + 0.22), t = P(x, y, z + 0.6 + i * 0.1 + 0.03 * Math.sin(S.time * 1.5 + i))
      g.strokeStyle = dimMix('#7cc9a4', lit); g.lineWidth = Math.max(1, 0.04 * k); g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(t[0], t[1]); g.stroke()
      g.fillStyle = dimMix('#9ee0bc', lit); g.beginPath(); g.ellipse(t[0] + 0.06 * k, t[1], 0.08 * k, 0.04 * k, -0.5, 0, TAU); g.fill()
    }
  }
  // the bell's answer to the strike at f 0.3: a hard swing that dies away while he stands still and listens
  const bellSwing = (f) => (f < 0.3 ? 0 : 0.55 * Math.exp(-(f - 0.3) * 3.2) * Math.sin((f - 0.3) * 26))
  const MACH8 = { intake: (x, y, z, l, fl) => bellM(x, y, z, fl || (l ? 0.4 : 0), VX && VX.st === 'intake' ? bellSwing(VX.f) : null), spec: cordM, falsify: smokeM, plan: drumM, build: carveM,
    verify: (x, y, z, l, fl) => mirrorM(x, y, z, fl || (l ? 0.2 : 0)), ship: boatM, close: soilM }
  const modeOf = (r) => (r && r.waiting && r.waiting.length ? 'charged' : r && r.landed ? 'lit' : 'quiet')
  function roomPts(x, y, z, n, a0, a1) { const out = []; for (let i = 0; i <= n; i++) { const t = a0 + (a1 - a0) * i / n; out.push([x + Math.cos(t) * ROOM8.rx, y + Math.sin(t) * ROOM8.ry, z]) } return out }
  // one room: its floor, its low curved back wall (an older skin, worn at the foot, magenta lintel), its machine
  function room8(i, st, mode, sk, focus, fl) {
    const [x, y] = ringAt(i, RING.st), a = ANG8(i), out = Math.atan2(Math.sin(a) * RING.ry, Math.cos(a) * RING.rx)
    const T = S.time, pulse = 0.5 + 0.5 * Math.sin(T * 3.2 + i), dc = x * AX[1] + y * AY[1]
    // the floor: a low dais of its own
    const top = roomPts(x, y, 0.3, 32, 0, TAU), foot = roomPts(x, y, 0.18, 32, 0, TAU)
    const side = mode === 'charged' ? mix('#c2367f', '#7a2a58', 0.3) : mode === 'lit' ? '#d9b98c' : '#8f80cf'
    for (let j = 0; j < 32; j++) if ((top[j][0] + top[j + 1][0]) / 2 * AX[1] + (top[j][1] + top[j + 1][1]) / 2 * AY[1] > dc) poly([foot[j], foot[j + 1], top[j + 1], top[j]], side, side, 0.6)
    poly(top, mode === 'charged' ? mix('#ff8cc8', '#ffd36a', 0.5 * pulse) : mode === 'lit' ? '#fbecd0' : '#ddd3f6', null)
    plane('z', 0.31, () => {
      g.save(); g.translate(x, y); g.scale(1, ROOM8.ry / ROOM8.rx)
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, ROOM8.rx)
      if (mode === 'charged') { gr.addColorStop(0, rgba('#fff3c0', 0.95)); gr.addColorStop(0.35, rgba(GOLD, 0.9)); gr.addColorStop(0.75, rgba(MAG, 0.75 + 0.25 * pulse)); gr.addColorStop(1, rgba('#e0308f', 0.9)) }
      else if (mode === 'lit') { gr.addColorStop(0, 'rgba(255,226,160,0.95)'); gr.addColorStop(1, 'rgba(255,226,160,0)') }
      else { gr.addColorStop(0, 'rgba(178,160,245,0.55)'); gr.addColorStop(1, 'rgba(178,160,245,0)') }
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, ROOM8.rx, 0, TAU); g.fill(); g.restore()
    })
    // the wall: everything but the doorway, which opens toward the Hearth
    const n = 16, w0 = out + Math.PI + ROOM8.door, w1 = out + Math.PI + TAU - ROOM8.door, Hh = ROOM8.H
    const seg = []
    for (let j = 0; j < n; j++) {
      const t0 = w0 + (w1 - w0) * j / n, t1 = w0 + (w1 - w0) * (j + 1) / n
      const p0 = [x + Math.cos(t0) * ROOM8.rx, y + Math.sin(t0) * ROOM8.ry], p1 = [x + Math.cos(t1) * ROOM8.rx, y + Math.sin(t1) * ROOM8.ry]
      seg.push({ p0, p1, front: ((p0[0] + p1[0]) / 2) * AX[1] + ((p0[1] + p1[1]) / 2) * AY[1] > dc + 0.05, shade: 0.2 + 0.35 * Math.max(0, Math.cos(t0 - Math.PI * 1.6)) })
    }
    const lintel = mode === 'charged' ? mix(RUNG[1], GOLD, 0.25 + 0.5 * pulse) : mode === 'lit' ? mix(RUNG[1], '#ffd9a0', 0.25) : mix(RUNG[1], QUIET, 0.25)
    const wallSeg = (s) => {
      let wc = mix(mix(sk.old, sk.band, 0.5), mode === 'quiet' ? '#c9bdf4' : '#ffffff', 0.18 + s.shade * 0.5)
      if (mode === 'charged') wc = mix(wc, '#ff6fbf', 0.35 + 0.15 * pulse)
      poly([[s.p0[0], s.p0[1], 0.3], [s.p1[0], s.p1[1], 0.3], [s.p1[0], s.p1[1], Hh], [s.p0[0], s.p0[1], Hh]], wc, wc, 0.6)
      const wo = mix(sk.old, '#ffffff', 0.08 + s.shade * 0.35)
      poly([[s.p0[0], s.p0[1], 0.3], [s.p1[0], s.p1[1], 0.3], [s.p1[0], s.p1[1], 0.48], [s.p0[0], s.p0[1], 0.48]], wo, wo, 0.6)
      poly([[s.p0[0], s.p0[1], Hh], [s.p1[0], s.p1[1], Hh], [s.p1[0], s.p1[1], Hh + 0.1], [s.p0[0], s.p0[1], Hh + 0.1]], lintel, lintel, 0.6)
    }
    seg.filter((s) => !s.front).forEach(wallSeg)
    // the machine, a little toward the back wall; a charged room's runs harder
    const [mx, my] = ringAt(i, RING.st + 0.05), t0 = S.time
    if (mode === 'charged') S.time = t0 * 2.2 + i
    scaled(mx, my, 0.3, ROOM8.sc, () => MACH8[st](mx, my, 0.3, mode !== 'quiet', fl || (mode === 'charged' ? 0.6 : 0)))
    S.time = t0
    g.save(); g.globalAlpha *= 0.42; seg.filter((s) => s.front).forEach(wallSeg); g.restore()
    if (mode === 'lit') glow3(x, y, 1.0, 1.4, '#ffe6b8', 0.2)
    return { x, y }
  }
  // the blocked part of a spoke: a fallen stone under a tangle of vine, until that room's work lands
  function blockage(i) {
    const [x, y] = ringAt(i, 0.6), a = ANG8(i), T = S.time
    cylinder(x + 0.2, y - 0.08, 0.18, 0.95, 0.62, '#b48a64', '#7c5a42')
    cylinder(x - 0.42, y + 0.2, 0.18, 0.7, 0.42, '#c0966e', '#86624a')
    cylinder(x - 0.05, y + 0.32, 0.18, 0.5, 0.3, '#a8805c', '#74543c')
    const c = P(x, y, 0.55)
    g.save(); g.lineCap = 'round'
    for (let j = 0; j < 4; j++) {
      const ph = j * 1.7 + i, sw = Math.sin(T * 0.9 + ph) * 0.06 * k, r = (0.7 + 0.12 * j) * k
      g.strokeStyle = j % 2 ? '#3fa46c' : '#2f8a5c'; g.lineWidth = Math.max(2.4, 0.12 * k)
      g.beginPath(); g.moveTo(c[0] - r, c[1] + 0.1 * k)
      g.bezierCurveTo(c[0] - r * 0.4, c[1] - r * 0.9 + sw, c[0] + r * 0.5, c[1] - r * 0.7 - sw, c[0] + r, c[1] + 0.12 * k)
      g.stroke()
      for (let q = 0; q < 3; q++) { const f = (q + 1) / 4, lx = lerp(c[0] - r, c[0] + r, f), ly = c[1] - Math.sin(f * Math.PI) * r * 0.75 + sw * 0.5; g.fillStyle = q % 2 ? '#9ee0bc' : '#6cc394'; g.beginPath(); g.ellipse(lx, ly, 0.2 * k, 0.1 * k, (q % 2 ? 0.6 : -0.6) + Math.cos(a), 0, TAU); g.fill() }
    }
    g.restore()
  }
  // the second blocked part, at the Hearth end of a spoke the cold Hearth holds: grey ash stones, smaller, no vines,
  // so it never reads as the room-end stone
  function ashStones(i) {
    const [x, y] = ringAt(i, 0.38)
    plane('z', 0.19, () => { g.fillStyle = 'rgba(92,90,100,0.6)'; g.beginPath(); g.ellipse(x - 0.05, y + 0.1, 1.05, 0.72, 0, 0, TAU); g.fill() })
    cylinder(x + 0.18, y - 0.08, 0.18, 0.9, 0.57, '#8c8a94', '#5e5c66')
    cylinder(x - 0.42, y + 0.18, 0.18, 0.66, 0.42, '#9c9aa2', '#6a6872')
    cylinder(x - 0.03, y + 0.4, 0.18, 0.45, 0.28, '#82808a', '#56545e')
  }
  // the Hearth as the roots leave it: lit is loop 1's Hearth; cold is grey stone and grey coals, no flame; kindling is a
  // small flame in the coals, brighter once the board pull has his go ahead on main
  function hearth8(cx, cy, hs) {
    const st = hs ? hs.state : 'lit'
    if (st === 'lit') return hearth(cx, cy)
    cylinder(cx, cy, 0, 0.32, 1.05, '#cdd0d8', '#8e93a0')
    cylinder(cx, cy, 0.32, 0.62, 0.42, '#b9bcc6', '#7f8492')
    const breath = VX && VX.st === 'hearth' ? bump(VX.f, 0.5, 1) : 0
    plane('z', 0.625, () => {
      g.fillStyle = '#5e5a62'; g.beginPath(); g.arc(cx, cy, 0.36, 0, TAU); g.fill()
      for (let j = 0; j < 7; j++) { const a = j * 2.3, r = j ? 0.2 : 0; g.fillStyle = j % 2 ? '#7a7680' : '#8e8a92'; g.beginPath(); g.ellipse(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0.12, 0.09, a, 0, TAU); g.fill() }
    })
    const p = P(cx, cy, 0.66), T = S.time
    if (st === 'kindling' || breath > 0) {
      const b = st === 'kindling' ? (hs.bright ? 1 : 0.6) : 0
      glow(p[0], p[1], (0.7 + 0.5 * b + 0.6 * breath) * k, '#ff9a4a', 0.35 + 0.3 * b + 0.4 * breath)
      for (let j = 0; j < 4; j++) { const a = j * 1.7; glow(p[0] + Math.cos(a) * 0.15 * k, p[1] + Math.sin(a) * 0.08 * k, 0.14 * k, '#ffb35a', 0.6 * (b + breath)) }
    }
    if (st === 'kindling') { // a small flame in the coals
      const s = k * (hs.bright ? 0.6 : 0.42) * 1.3, f = Math.sin(T * 4.3) * 0.07
      g.save(); g.translate(p[0], p[1])
      const fg = g.createLinearGradient(0, 0, 0, -1.1 * s); fg.addColorStop(0, '#ff9a5a'); fg.addColorStop(0.5, '#ffd9a0'); fg.addColorStop(1, 'rgba(255,250,235,0)')
      g.fillStyle = fg; g.beginPath(); g.moveTo(-0.28 * s, 0); g.bezierCurveTo(-0.35 * s, -0.5 * s, (0.05 + f) * s, -0.6 * s, f * s, -(1.1 + f) * s); g.bezierCurveTo((0.25 + f) * s, -0.7 * s, 0.38 * s, -0.4 * s, 0.28 * s, 0); g.closePath(); g.fill()
      g.restore()
    }
    // banked coals beside it: the roots queued behind the one on the Hearth, small
    for (let j = 0; j < Math.min(4, hs.queue || 0); j++) {
      const q = P(cx + 1.25 + j * 0.3, cy + 0.55 - j * 0.12, 0.2)
      g.fillStyle = '#6a646c'; g.beginPath(); g.ellipse(q[0], q[1], 0.16 * k, 0.1 * k, 0, 0, TAU); g.fill()
      glow(q[0], q[1], 0.32 * k, '#ff8a4a', 0.32 + 0.1 * Math.sin(T * 2 + j))
      g.fillStyle = '#ff9a5a'; g.beginPath(); g.arc(q[0], q[1] - 0.02 * k, Math.max(1.2, 0.04 * k), 0, TAU); g.fill()
    }
  }
  // the one ember on a cold Hearth: charged, and the brightest thing in the scene
  function hearthEmber(cx, cy) {
    const p = P(cx, cy, 0.78), T = S.time, pulse = 0.5 + 0.5 * Math.sin(T * 4.2)
    g.save(); g.globalCompositeOperation = 'lighter'
    glow(p[0], p[1], (1.1 + 0.25 * pulse) * k, MAG, 0.3 + 0.12 * pulse) // tight, so the grey coals round it still read cold
    glow(p[0], p[1], 0.7 * k, GOLD, 0.5 + 0.2 * pulse)
    glow(p[0], p[1], 0.35 * k, '#fff6dc', 0.95)
    g.restore()
    for (let j = 0; j < 2; j++) { const f = loopT(T * 0.8 + j * 0.5, 1); g.strokeStyle = rgba(j ? MAG : GOLD, 0.9 * (1 - f)); g.lineWidth = Math.max(1.5, 0.05 * k); g.beginPath(); g.ellipse(p[0], p[1], (0.25 + 1.1 * f) * k, (0.14 + 0.6 * f) * k, 0, 0, TAU); g.stroke() }
    g.fillStyle = '#ffd36a'; g.beginPath(); g.ellipse(p[0], p[1], Math.max(9, 0.22 * k), Math.max(7, 0.17 * k), 0, 0, TAU); g.fill()
    g.strokeStyle = '#fffaf0'; g.lineWidth = Math.max(1.5, 0.04 * k); g.stroke()
    g.fillStyle = '#fffaf0'; g.beginPath(); g.arc(p[0], p[1] - 0.01 * k, Math.max(3.5, 0.08 * k), 0, TAU); g.fill()
  }
  // a charged room: a pulsing aura in magenta and gold, a ring running out across its floor, sparks rising
  function charge(i, focus) {
    const [x, y] = ringAt(i, RING.st), T = S.time, pulse = 0.5 + 0.5 * Math.sin(T * (focus ? 3.6 : 2.6) + i), amp = focus ? 1.15 : 0.8
    g.save(); g.globalCompositeOperation = 'lighter'
    glow3(x, y, 0.9, (1.7 + 0.4 * pulse) * amp, MAG, (0.13 + 0.09 * pulse) * amp)
    glow3(x, y, 1.2, 0.9 * amp, GOLD, (0.12 + 0.1 * pulse) * amp)
    g.restore()
    plane('z', 0.33, () => {
      for (let j = 0; j < 2; j++) {
        const f = loopT(T * 0.7 + j * 0.5 + i * 0.13, 1)
        g.strokeStyle = rgba(j ? MAG : GOLD, 0.85 * (1 - f)); g.lineWidth = 0.05
        g.beginPath(); g.ellipse(x, y, ROOM8.rx * (0.35 + 0.8 * f), ROOM8.ry * (0.35 + 0.8 * f), 0, 0, TAU); g.stroke()
      }
    })
    for (let j = 0; j < (focus ? 16 : 11); j++) {
      const h1 = hash(i * 31 + j), f = loopT(T * (0.3 + 0.25 * h1) + h1, 1)
      const mx = x + (hash(j * 7 + i) - 0.5) * ROOM8.rx * 1.5 + Math.sin(T * 2 + j) * 0.06, my = y + (hash(j * 13 + i) - 0.5) * ROOM8.ry * 1.5
      const p = P(mx, my, 0.4 + f * 3.0), col = j % 2 ? '#ff7cc8' : '#ffdc78', a = Math.sin(f * Math.PI)
      glow(p[0], p[1], 0.24 * k, col, 0.65 * a)
      g.fillStyle = rgba('#fffaf0', 0.9 * a); g.beginPath(); g.arc(p[0], p[1], Math.max(1.1, 0.045 * k), 0, TAU); g.fill()
    }
  }
  function ember8(x, y, bright) {
    const p = P(x, y, 0.42), T = S.time, fl = 0.85 + 0.15 * Math.sin(T * 6.3 + x * 3) * Math.sin(T * 2.1 + y)
    if (bright) {
      glow(p[0], p[1], 0.75 * k, '#ffe2a0', 0.55 * fl); glow(p[0], p[1], 0.32 * k, '#fff6dc', 0.85)
      g.strokeStyle = 'rgba(255,240,200,0.7)'; g.lineWidth = Math.max(1, 0.03 * k)
      for (let j = 0; j < 6; j++) { const a = j / 6 * TAU + T * 0.4; g.beginPath(); g.moveTo(p[0] + Math.cos(a) * 0.2 * k, p[1] + Math.sin(a) * 0.12 * k); g.lineTo(p[0] + Math.cos(a) * 0.38 * k, p[1] + Math.sin(a) * 0.23 * k); g.stroke() }
      g.fillStyle = '#fffaf0'; g.beginPath(); g.ellipse(p[0], p[1], 0.13 * k, 0.1 * k, 0, 0, TAU); g.fill()
    } else {
      glow(p[0], p[1], 0.9 * k, '#ff9a4a', 0.6 * fl)
      const pu = (T * 0.8 + x) % 1; g.strokeStyle = `rgba(255,150,80,${0.8 * (1 - pu)})`; g.lineWidth = Math.max(1.5, 0.05 * k); g.beginPath(); g.ellipse(p[0], p[1], (0.25 + 0.4 * pu) * k, (0.17 + 0.28 * pu) * k, 0, 0, TAU); g.stroke()
      g.fillStyle = '#ffb35a'; g.beginPath(); g.ellipse(p[0], p[1], Math.max(8, 0.2 * k), Math.max(6.4, 0.16 * k), 0, 0, TAU); g.fill()
      g.strokeStyle = '#fff0c8'; g.lineWidth = Math.max(1.5, 0.04 * k); g.stroke()
      g.fillStyle = '#fff0c8'; g.beginPath(); g.arc(p[0], p[1] - 0.01 * k, Math.max(3, 0.07 * k), 0, TAU); g.fill()
    }
  }
  // the machine's answer to the verb the body is doing (shaman-page.ts plays the body): each room its own
  function verbFx(i, st, f, mouth) {
    const [mx, my] = ringAt(i, RING.st + 0.05), z = 0.3, T = S.time
    scaled(mx, my, z, ROOM8.sc, () => {
      if (st === 'intake') { // rings travel in toward the bell while he stands still and listens
        const p = P(mx, my, z + 2.0)
        for (let j = 0; j < 3; j++) {
          const q = clamp((f - 0.36 - j * 0.16) / 0.42); if (q <= 0 || q >= 1) continue
          const r = (2.6 - 2.2 * q) * k; g.strokeStyle = rgba(j % 2 ? '#fff2cc' : GOLD, 0.85 * Math.sin(q * Math.PI)); g.lineWidth = Math.max(1.5, 0.07 * k)
          g.beginPath(); g.ellipse(p[0], p[1] + 0.55 * k, r, r * 0.45, 0, 0, TAU); g.stroke()
        }
        if (f > 0.3) glow(p[0], p[1] + 0.5 * k, 1.6 * k, SEED, 0.7 * Math.exp(-(f - 0.3) * 4))
      } else if (st === 'spec') { // a new bright knot bead on a cord at f 0.7
        const pop = ease((f - 0.7) / 0.12); if (pop <= 0) return
        const p = P(mx - 0.4 + 2 * 0.16 + Math.sin(T * 1.2 + 2) * 0.03, my, z + 0.78)
        glow(p[0], p[1], 0.9 * k * pop, GOLD, 0.8 * (1.2 - pop * 0.4)); glow(p[0], p[1], 0.35 * k, '#fff6dc', 0.9 * pop)
        g.fillStyle = '#ffd36a'; g.beginPath(); g.arc(p[0], p[1], 0.09 * k * (0.6 + 0.6 * pop), 0, TAU); g.fill()
        g.strokeStyle = '#fffaf0'; g.lineWidth = Math.max(1, 0.025 * k); g.stroke()
      } else if (st === 'falsify') { // breath puffs travel from his mouth to the bowl
        const b = P(mx, my, z + 0.5)
        for (let j = 0; j < 3; j++) {
          const q = clamp((f - 0.12 - j * 0.12) / 0.3); if (q <= 0 || q >= 1 || !mouth) continue
          const x = lerp(mouth[0], b[0], q), y = lerp(mouth[1], b[1], q) - Math.sin(q * Math.PI) * 0.3 * k
          g.fillStyle = `rgba(240,246,255,${0.85 * Math.sin(q * Math.PI)})`; g.beginPath(); g.arc(x, y, (0.07 + 0.08 * q) * k, 0, TAU); g.fill()
        }
      } else if (st === 'plan') { // a ring pulse off the drum head on each beat
        for (const bt of [0.2, 0.45, 0.7]) {
          const q = clamp((f - bt) / 0.3); if (q <= 0 || q >= 1) continue
          plane('z', z + 0.64, () => { g.strokeStyle = rgba(q < 0.3 ? '#fffaf0' : MAG, 0.95 * (1 - q)); g.lineWidth = 0.07 * (1 - q) + 0.02; g.beginPath(); g.arc(mx, my, 0.48 + q * 1.5, 0, TAU); g.stroke() })
          if (q < 0.25) glow3(mx, my, z + 0.7, 0.9, '#fff1c8', 0.8 * (1 - q * 4))
        }
      } else if (st === 'build') { // wood chips fly off the vessel with each stroke
        const o = P(mx + 0.05, my, z + 0.75)
        for (let j = 0; j < 12; j++) {
          const t0 = 0.08 + j * 0.065, q = clamp((f - t0) / 0.32); if (q <= 0 || q >= 1) continue
          const dir = j % 2 ? 1 : -1, vx = dir * (0.5 + hash(j) * 0.9), vy = -(0.9 + hash(j + 9) * 0.8)
          const x = o[0] + vx * q * k, y = o[1] + (vy * q + 1.6 * q * q) * k
          g.save(); g.translate(x, y); g.rotate(q * 8 * dir); g.fillStyle = rgba(j % 3 ? '#f6e6c8' : '#d1ad83', 1 - q * 0.6)
          g.beginPath(); g.ellipse(0, 0, 0.07 * k, 0.03 * k, 0, 0, TAU); g.fill(); g.restore()
        }
      } else if (st === 'verify') { // ripples, and a warm reflection light rises from the pool
        plane('z', z + 0.32, () => {
          for (let j = 0; j < 3; j++) { const q = clamp((f - 0.15 - j * 0.15) / 0.5); if (q <= 0 || q >= 1) continue
            g.strokeStyle = rgba('#ffffff', 0.9 * (1 - q)); g.lineWidth = 0.035; g.beginPath(); g.arc(mx, my, 0.1 + 0.8 * q, 0, TAU); g.stroke() }
        })
        const up = ease((f - 0.35) / 0.6); if (up > 0) { const p = P(mx, my, z + 0.4 + up * 1.9); glow(p[0], p[1], (0.6 + 0.6 * up) * k, '#ffd9a0', 0.75 * Math.sin(up * Math.PI * 0.9 + 0.2)); glow(p[0], p[1], 0.2 * k, '#fff6dc', 0.9 * (1 - up * 0.5)) }
      } else if (st === 'close') { // a green sprout springs up from the bed at f 0.5
        const gr = ease((f - 0.5) / 0.22); if (gr <= 0) return
        const b = P(mx, my, z + 0.22), t = P(mx + 0.04, my, z + 0.22 + 0.85 * gr)
        glow(t[0], t[1], 0.8 * k, '#9ee0bc', 0.5 * gr)
        g.strokeStyle = '#4fb47c'; g.lineWidth = Math.max(1.5, 0.06 * k); g.lineCap = 'round'; g.beginPath(); g.moveTo(b[0], b[1]); g.quadraticCurveTo(b[0] - 0.1 * k, (b[1] + t[1]) / 2, t[0], t[1]); g.stroke()
        for (const d of [-1, 1]) { g.fillStyle = d < 0 ? '#6cc394' : '#9ee0bc'; g.beginPath(); g.ellipse(t[0] + d * 0.13 * k * gr, t[1] + 0.03 * k, 0.15 * k * gr, 0.06 * k * gr, d * 0.5, 0, TAU); g.fill() }
      }
    })
  }
  function shamanScene(opts) {
    const sk = SKIN.shaman, h = geo('gourd-star', 1), T = S.time, runT = opts.runT == null ? 99 : opts.runT
    const R = {}; (opts.rooms || []).forEach((r) => { R[r.stage] = r })
    const landed = (st) => !!(R[st] && R[st].landed)
    const hs = opts.hearth || { state: 'lit' }, cold = hs.state === 'cold', warm = hs.state === 'lit', held = hs.holds || []
    VX = opts.verb ? { st: opts.verb.stage, f: opts.verb.f } : null
    { const p = P(h.xc, 4.0, -h.bot - 2.2); g.save(); g.translate(p[0], p[1]); g.scale(1, 0.18); glow(0, 0, h.L * k * 1.1, '#0f2a3a', 0.35); g.restore() }
    { const p = P(h.xc + 2, 7, -h.bot - 1.2); g.save(); g.translate(p[0], p[1]); g.scale(1, 0.22); glow(0, 0, h.L * k * 0.9, '#ffc27a', 0.38); g.restore() }
    tail(h); rimG(h, sk); hullG(h, sk, { under: 1 }); elementFx(h, sk, 'shaman')
    // the chamber's deck: one round floor the rooms stand off
    { const n = 48, ring = (z) => Array.from({ length: n }, (_, i) => [RING.cx + Math.cos(i / n * TAU) * RING.rx, RING.cy + Math.sin(i / n * TAU) * RING.ry, z]), a = ring(0), b = ring(0.18), side = mix(RUNG[1], '#3a2440', 0.2)
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; poly([a[i], a[j], b[j], b[i]], side, side, 0.5) }
      poly(b, FLOOR, null) }
    if (!cold) plane('z', 0.19, () => { // the centre floor glow; a cold Hearth throws none, a kindling one a little
      g.save(); g.translate(RING.cx, RING.cy); g.scale(1, RING.ry / RING.rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, RING.rx * (warm ? 0.7 : 0.35)); gr.addColorStop(0, `rgba(255,230,180,${warm ? 0.85 : 0.5})`); gr.addColorStop(1, 'rgba(255,226,190,0)')
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, RING.rx, 0, TAU); g.fill(); g.restore()
    })
    const loop = Array.from({ length: 40 }, (_, i) => { const a = (i / 40) * TAU; return [RING.cx + Math.cos(a) * RING.walk * RING.rx, RING.cy + Math.sin(a) * RING.walk * RING.ry] })
    route(loop, 0.18, RUNG[1], true)
    // spokes from the Hearth: open and lit to a room whose work landed, cool and blocked to the others
    plane('z', 0.2, () => {
      STAGES8.forEach((st, i) => {
        const [x0, y0] = ringAt(i, 0.22), [x, y] = ringAt(i, RING.st - 0.2), lit = landed(st)
        const gr = g.createLinearGradient(x0, y0, x, y)
        if (lit) { gr.addColorStop(0, 'rgba(255,236,170,0.5)'); gr.addColorStop(1, 'rgba(255,214,120,0.95)') }
        else { gr.addColorStop(0, 'rgba(160,130,240,0.6)'); gr.addColorStop(0.62, 'rgba(160,130,240,0.5)'); gr.addColorStop(0.7, 'rgba(160,130,240,0.08)'); gr.addColorStop(1, 'rgba(160,130,240,0.08)') }
        g.strokeStyle = gr; g.lineWidth = lit ? 0.3 : 0.24; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x, y); g.stroke()
        if (lit) { const f = loopT(T * 0.45 + i * 0.17, 1); g.fillStyle = `rgba(255,248,225,${0.9 * Math.sin(f * Math.PI)})`; g.beginPath(); g.arc(lerp(x0, x, f), lerp(y0, y, f), 0.07, 0, TAU); g.fill() }
      })
    })
    const items = [], verb = opts.verb
    SHM.rooms = {}
    STAGES8.forEach((st, i) => {
      const [x, y] = ringAt(i, RING.st), mode = modeOf(R[st])
      items.push({ x, y, f: () => {
        const vf = verb && verb.stage === st ? 0.5 + 0.5 * bump(verb.f, 0, 1) : 0
        room8(i, st, mode, sk, opts.focus === st, vf)
        const pts = roomPts(x, y, 0.18, 12, 0, TAU).concat(roomPts(x, y, 1.9, 12, 0, TAU))
        SHM.rooms[st] = { box: sbox(pts), c: P(x, y, 0.8), top: P(x, y, 2.0) }
      } })
      if (!landed(st)) { const [bx, by] = ringAt(i, 0.6); items.push({ x: bx, y: by, f: () => blockage(i) }) }
      if (!warm && held.indexOf(st) >= 0) { const [bx, by] = ringAt(i, 0.38); items.push({ x: bx, y: by, f: () => ashStones(i) }) }
    })
    items.push({ x: RING.cx, y: RING.cy, f: () => { hearth8(RING.cx, RING.cy, hs) } })
    for (let i = 0; i < 2; i++) {
      if (!warm) { // the crew stand back from a cold Hearth, still, facing it
        const [wx, wy] = ringAt(2.5 + i * 2.4, RING.walk + 0.08), m = P(RING.cx, RING.cy, 0), q = P(wx, wy, 0)
        items.push({ x: wx, y: wy, f: () => crew(wx, wy, 0.18, { sash: RUNG[1], walk: false, face: m[0] < q[0] ? -1 : 1, seed: i * 2.1, tall: CREW8, pose: { still: true, lean: -0.06 } }) })
        continue
      }
      const w = alongLoop(loop, loopT(T * 0.035 + 0.62 + i * 0.37, 1))
      items.push({ x: w.x, y: w.y, f: () => crew(w.x, w.y, 0.18, { sash: RUNG[1], walk: true, face: faceOf(w), seed: i * 2.1, tall: CREW8 }) })
    }
    // the Shaman: the master, a head taller, magenta sash; walks the ring, steps in at a room's door, or walks in off the
    // ring to the Hearth (sh.in)
    const sh = opts.shaman || { a: 6.5, out: 0 }
    const ra = ringAt(sh.a, RING.walk), rd = ringAt(sh.a, RING.st - 0.17), rh = ringAt(Math.round(sh.a) + 0.5, 0.3), sin = clamp(sh.in || 0)
    const sx = sin > 0 ? lerp(ra[0], rh[0], sin) : lerp(ra[0], rd[0], sh.out || 0), sy = sin > 0 ? lerp(ra[1], rh[1], sin) : lerp(ra[1], rd[1], sh.out || 0)
    const sp = P(sx, sy, 0.18), moved = SHM.last ? sp[0] - SHM.last[0] : 0
    if (Math.abs(moved) > 0.3) SHM.face = moved < 0 ? -1 : 1
    else if (sin > 0.5) { const m = P(RING.cx, RING.cy, 0); SHM.face = m[0] < sp[0] ? -1 : 1 }
    else if (sh.out > 0.5) { const m = P(...ringAt(Math.round(sh.a), RING.st + 0.05), 0); SHM.face = m[0] < sp[0] ? -1 : 1 }
    SHM.last = sp; SHM.at = sp
    const shs = (k / CREW) * 1.15 * CREW8 * 1.12 * (S.phone ? 1.5 : 1), mouth = [sp[0] + SHM.face * 5 * shs, sp[1] - (0.12 * clamp(sh.out || 0)) * k - 20 * shs]
    const shaman = () => {
      glow3(sx, sy, 0.8, 1.3, '#ffd6ec', 0.3)
      crew(sx, sy, 0.18 + 0.12 * clamp(sh.out || 0), { sash: RUNG[1], master: true, tall: CREW8 * 1.12 * (S.phone ? 1.5 : 1), walk: !!sh.walk, face: SHM.face, seed: 1.1, kneel: sh.kneel || 0, pose: sh.pose || null })
    }
    // the porter gathers the run's seeds and walks them out to the store in the small bulb
    const nLit = STAGES8.filter(landed).length, pc = nLit ? clamp((runT - 7.2) / 3.8) : 0
    const px = lerp(RING.cx + RING.rx * 0.8, 11.4, pc), py = lerp(RING.cy + RING.ry * 0.55, 5.9, pc)
    items.push({ x: px, y: py, f: () => crew(px, py, pc > 0.2 ? 0.02 : 0.18, { sash: RUNG[1], walk: pc > 0 && pc < 1, face: 1, carry: nLit && pc < 1 ? 'seed' : null, seed: 4, tall: CREW8 }) })
    sortDraw(items)
    if (cold) g.globalAlpha = 0.8 // a cold Hearth's ember stays the brightest thing: the charged rooms dim a fifth
    STAGES8.forEach((st, i) => { if (modeOf(R[st]) === 'charged') charge(i, opts.focus === st) })
    g.globalAlpha = 1
    if (warm) { glow3(RING.cx, RING.cy, 0.5, 3.0, '#ffd9a0', 0.4); lantern(RING.cx, RING.cy, 3.3) }
    else if (!cold) glow3(RING.cx, RING.cy, 0.6, 1.6, '#ffb070', hs.bright ? 0.35 : 0.22)
    if (cold) hearthEmber(RING.cx, RING.cy)
    { const c = P(RING.cx, RING.cy, 0.5); SHM.hearth = warm ? null : { x: c[0], y: c[1], r: Math.max(30, 1.25 * k) }; SHM.centre = P(RING.cx, RING.cy, 0.3) }
    S.storeN = runT > 11 ? Math.min(7, nLit) : 0; S.storeGlow = nLit ? bump(runT, 10.8, 11.8) : 0
    store(12.0, 5.2)
    SHM.keep = sbox([[11.4, 4.6, 0], [12.6, 5.8, 0], [12.0, 5.2, 0.6], [lerp(RING.cx + RING.rx * 0.8, 11.4, 1), lerp(RING.cy + RING.ry * 0.55, 5.9, 1), 1.6], [RING.cx + RING.rx * 0.8, RING.cy + RING.ry * 0.55, 1.6]])
    // the seeds: one from each room whose work landed, rising in pipeline order as the run begins
    let order = 0
    STAGES8.forEach((st, i) => {
      if (!landed(st)) return
      const t0 = 1 + order++ * 0.7, f = ease((runT - t0) / 1.1); if (f <= 0) return
      const [x, y] = ringAt(i, RING.st), z = 1.0 + f * (0.9 + ((i * 0.37) % 1) * 1.4), a = P(x, y, 1.0), b = P(x, y, z)
      const lg = g.createLinearGradient(a[0], a[1], b[0], b[1]); lg.addColorStop(0, 'rgba(255,241,200,0)'); lg.addColorStop(1, 'rgba(255,241,200,0.6)')
      g.strokeStyle = lg; g.lineWidth = Math.max(1, 0.05 * k); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); seed(x, y, z, 0.8, 1.3)
    })
    if (verb) { const vi = STAGES8.indexOf(verb.stage); if (vi >= 0) verbFx(vi, verb.stage, verb.f, mouth) }
    if (verb && verb.stage === 'hearth') { // his one breath over the coals, seen as a warm puff
      const c = P(RING.cx, RING.cy, 0.7), q = clamp((verb.f - 0.45) / 0.35)
      if (q > 0 && q < 1) { g.fillStyle = `rgba(255,236,214,${0.7 * Math.sin(q * Math.PI)})`; g.beginPath(); g.arc(lerp(mouth[0], c[0], q), lerp(mouth[1], c[1], q), (0.08 + 0.1 * q) * k, 0, TAU); g.fill() }
    }
    shaman()
    // embers: where a move was given; brighter once the board pull has recorded it on main
    SHM.embers = []
    const per = {}
    ;(opts.embers || []).forEach((e) => {
      if (e.stage === 'hearth') return // a move given at the Hearth is its kindling flame, not a second ember beside it
      const i = STAGES8.indexOf(e.stage); if (i < 0) return
      const n = per[e.stage] = (per[e.stage] || 0) + 1, a = ANG8(i), tx = -Math.sin(a), ty = Math.cos(a)
      const [ex0, ey0] = ringAt(i, RING.st - 0.1), off = (n - 1) * 0.34 * (n % 2 ? 1 : -1) + 0.38
      const ex = ex0 + tx * off, ey = ey0 + ty * off * 0.75
      ember8(ex, ey, !!e.bright)
      const p = P(ex, ey, 0.42); SHM.embers.push({ id: e.id, x: p[0], y: p[1], r: Math.max(20, 0.5 * k) })
    })
    // the hint: the room the clock waits on breathes, and a hand comes if no tap does
    const hint = opts.hint
    if (hint && SHM.rooms[hint.stage]) {
      const p = SHM.rooms[hint.stage].c, sc = S.phone ? 0.7 : 1.05, beat = (hint.idle % 1.6) / 1.6
      g.strokeStyle = `rgba(255,236,200,${0.75 * (1 - beat)})`; g.lineWidth = 2.5 * sc; g.beginPath(); g.arc(p[0], p[1], (20 + 46 * beat) * sc, 0, TAU); g.stroke()
      if (hint.idle > 2.2) handAt(p[0] + 26 * sc, p[1] + 34 * sc, sc, bump(beat, 0.1, 0.45))
    }
    const xl = h.xc - h.L, xr = h.xc + h.L
    ribbon([[xl + 0.6, 7.6], [xr - 0.6, 7.6]], 0.02, 0.6)
    for (let i = 0; i < 9; i++) { const x0 = xl + 0.8, span = xr - 0.8 - x0; bead(x0 + loopT(i * span / 9 + T * 0.55, span), 7.6, 0.02, 0.1) }
    VX = null
  }
  // the chamber alone, for the phone: the ring of rooms with their walls, not the hull or the store
  function chamberPts() {
    const out = []
    STAGES8.forEach((_, i) => { const [x, y] = ringAt(i, RING.st); for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { out.push([x + dx * ROOM8.rx, y + dy * ROOM8.ry, 0.1]); out.push([x + dx * ROOM8.rx, y + dy * ROOM8.ry, 1.9]) } })
    return out
  }
  function shamanFrame(ctx, W, H, opts) {
    opts = opts || {}
    g = ctx; Wd = DEMO
    S = state('run', 4); S.time = opts.t || 0; S.phone = !!opts.phone; S.v = opts.v == null ? 0.5 : opts.v
    const h = geo('gourd-star', 1)
    if (S.phone) fit(chamberPts(), 6, H * 0.05, W - 12, H * 0.5)
    else fit([[-1.6, -0.3, 2.6], [13.2, 8.2, 0], [4.9, 8.2, -2.2], [13.2, -0.3, 2.6], [-1.6, 8.2, 0]], 70, 50, W - 140, H - 100)
    oy += Math.sin(S.time * 1.1) * 2.2 * (k / 45)
    SHM.k = k
    sky(W, H)
    shamanScene(opts)
    g.save(); g.globalCompositeOperation = 'screen'; glow(W * 0.32, H * 0.48, Math.max(W, H) * 0.35, '#ffd9b8', 0.12); g.restore()
  }
  function shamanHit(px, py) {
    for (const e of SHM.embers) if (Math.hypot(px - e.x, py - e.y) < e.r) return { ember: e.id }
    if (SHM.hearth && Math.hypot(px - SHM.hearth.x, (py - SHM.hearth.y) * 1.4) < SHM.hearth.r) return { hearth: true }
    let best = null, bd = 1e9
    for (const st of STAGES8) {
      const r = SHM.rooms[st]; if (!r) continue
      const b = r.box; if (px < b[0] || px > b[2] || py < b[1] || py > b[3]) continue
      const d = Math.hypot(px - r.c[0], py - r.c[1]); if (d < bd) { bd = d; best = st }
    }
    return best ? { room: best } : null
  }
  function shamanBox(st) { const r = SHM.rooms[st]; return r ? r.box.slice() : null }
  function shamanPoint(st) {
    if (st === 'hearth') return SHM.hearth ? [SHM.hearth.x, SHM.hearth.y - SHM.hearth.r] : SHM.centre.slice()
    const r = SHM.rooms[st]; return r ? [r.top[0], Math.min(r.top[1], r.box[1])] : null
  }
  // where a card hangs beside a room: outside the ring on the room's side, vertically centred on the room; the Hearth's
  // card hangs outside the ring to the right, level with the Hearth
  function shamanAnchor(st) {
    let x0 = 1e9, x1 = -1e9 // the ring of rooms on screen: a card hangs outside it, never over it
    for (const k8 of STAGES8) { const r = SHM.rooms[k8]; if (r) { x0 = Math.min(x0, r.box[0]); x1 = Math.max(x1, r.box[2]) } }
    if (st === 'hearth') { const h = SHM.hearth || { x: SHM.centre[0], y: SHM.centre[1] }; return { x: x1, y: h.y, side: 'right' } }
    const r = SHM.rooms[st]; if (!r) return null
    const right = r.c[0] >= SHM.centre[0]
    return { x: right ? x1 : x0, y: (r.box[1] + r.box[3]) / 2, side: right ? 'right' : 'left' }
  }
  function shamanKeep() { return SHM.keep ? SHM.keep.slice() : null } // the store and its porter: no card covers them
  function shamanAt() { return SHM.at ? SHM.at.slice() : null }
  function shamanHearth() { return SHM.hearth ? { x: SHM.hearth.x, y: SHM.hearth.y, r: SHM.hearth.r } : null }
  function shamanEmbers() { return SHM.embers.map((e) => ({ id: e.id, x: e.x, y: e.y })) }

  window.AltR9 = { shamanFrame, shamanHit, shamanBox, shamanPoint, shamanAnchor, shamanHearth, shamanAt, shamanKeep, shamanEmbers, SHAMAN_STAGES: STAGES8, frame, state, hit, at, fleetFrame, fleetHit, fleetBox, PHASES, DUR, START, LOOP, RUNG }
})()
