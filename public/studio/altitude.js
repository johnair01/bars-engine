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
// AltR9.hit(px, py) names what a tap at a screen point touches ('store' | 'chart' | null) for the last frame drawn.
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
    const cx = W * ((S.phone ? 0.62 : 0.74) + S.harbourX), hy = H * (S.phone ? 0.72 : 0.4), u = Math.min(W / 1600, H / 1000) * (S.phone ? 1.6 : 1)
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
  function tail(h) { // the wake: long water ribbons trailing aft, flowing while under way
    const len = 6 + 12 * S.v, ph = S.D * 1.6
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

  // ---------- crew: robed figures; the sash is the altitude ----------
  // o: sash, master, carry ('spool'|'bead'|'tool'|'seed'), walk, face, seed (idle phase), alpha
  function crew(x, y, z, o) {
    const p = P(x, y, z), s = (k / CREW) * (o.master ? 1.15 : 1)
    const T = S.time, ph = o.seed || 0
    g.save(); g.translate(p[0], p[1]); g.scale(s, s)
    if (o.alpha !== undefined) g.globalAlpha *= o.alpha
    // a soft shadow: cream bounce and a cool contact shadow
    glow(0, 0, 13, '#fff1c8', 0.45); g.fillStyle = 'rgba(20,24,60,0.2)'; g.beginPath(); g.ellipse(0, 0.4, 7.8, 2.6, 0, 0, TAU); g.fill()
    let bob = 0, rot = 0, sy = 1
    const w = T * 10 + ph
    if (o.walk) { bob = Math.abs(Math.sin(w)) * 1.3; rot = Math.sin(w) * 0.045 }
    else { sy = 1 + 0.028 * Math.sin(T * 2.0 + ph); rot = 0.04 * Math.sin(T * 1.25 + ph * 1.7) } // breathe and sway
    if (o.walk) { // legs under the robe
      g.strokeStyle = '#6d6a8e'; g.lineWidth = 1.7; g.lineCap = 'round'
      const a = Math.sin(w) * 2.6
      g.beginPath(); g.moveTo(-2, -2 - bob); g.lineTo(-2 + a, 0.8); g.moveTo(2, -2 - bob); g.lineTo(2 - a, 0.8); g.stroke()
    }
    g.translate(0, -bob); g.rotate(rot); g.scale((o.face || 1), sy)
    const body = new Path2D(); body.moveTo(-7, -1); body.bezierCurveTo(-6.5, -10, -4.5, -17, 0, -19); body.bezierCurveTo(4.5, -17, 6.5, -10, 7, -1); body.quadraticCurveTo(0, 1.5, -7, -1)
    const gr = g.createLinearGradient(-7, 0, 7, 0); gr.addColorStop(0, '#fffaf0'); gr.addColorStop(1, '#d9dcf0')
    g.fillStyle = gr; g.fill(body); g.strokeStyle = 'rgba(40,40,90,0.35)'; g.lineWidth = 0.9; g.stroke(body)
    g.save(); g.clip(body); g.fillStyle = o.sash
    g.beginPath(); g.moveTo(-8, -15); g.lineTo(-1, -20); g.lineTo(9, -6); g.lineTo(2, 0); g.closePath(); g.fill()
    if (o.master) { g.fillRect(-8, -9.5, 16, 2.6) }
    g.restore()
    g.fillStyle = SKIN_TONE; g.beginPath(); g.arc(0, -22.5, 4.4, 0, TAU); g.fill()
    if (o.master) { g.fillStyle = '#fff8ee'; g.beginPath(); g.ellipse(0, -25.5, 8.5, 2.4, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(40,40,90,0.3)'; g.stroke() }
    g.fillStyle = o.master ? '#fff8ee' : '#f3ece0'; g.beginPath()
    g.moveTo(-5, -24); g.quadraticCurveTo(0, -27, 5, -24); g.lineTo(0, o.master ? -38 : -32); g.closePath(); g.fill(); g.strokeStyle = 'rgba(40,40,90,0.3)'; g.stroke()
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
    ghostSkin()
    tail(S.skin > 0.5 ? BIG : SHIP)
    bulwark(SHIP)
    hullLower(SHIP, { under: 1 - S.skin, seamInner: S.skin })
    skinLight()
    gates()
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
    HIT.store = P(STORE[0], STORE[1], 0.4); HIT.chart = P(18.6 + CX + 2.3, 7.5, 1.4); HIT.k = k
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
  }

  function frame(ctx, W, H, opts) {
    opts = opts || {}
    Wd = opts.world ? { ...DEMO, ...opts.world, landed: { ...DEMO.landed, ...(opts.world.landed || {}) } } : DEMO
    g = ctx; S = state(opts.phase || 'run', opts.t || 0); S.phone = !!opts.phone
    S.time += opts.idle || 0 // seconds the player has kept the intake waiting: the ship and crew keep living meanwhile
    camera(W, H, S.phone)
    sky(W, H)
    harbour(W, H)
    shipScene()
    if (S.harbour > 0.01) { // harbour light on the ship: warm from one side, the sky stays cool on the other
      g.save(); g.globalCompositeOperation = 'screen'; glow(W * ((S.phone ? 0.62 : 0.74) + S.harbourX), H * (S.phone ? 0.62 : 0.45), Math.max(W, H) * 0.55, '#ffdcb0', 0.2 * S.harbour); g.restore()
    }
    tapLayer(W, H, opts)
    if (opts.veil > 0) { g.fillStyle = `rgba(36,32,90,${clamp(opts.veil)})`; g.fillRect(0, 0, W, H) }
  }
  function hit(px, py) {
    if (!HIT.store) return null
    const kk = HIT.k
    if (Math.hypot(px - HIT.store[0], py - HIT.store[1]) < Math.max(28, 1.0 * kk)) return 'store'
    if (Math.hypot(px - HIT.chart[0], py - HIT.chart[1]) < Math.max(40, 2.6 * kk)) return 'chart'
    return null
  }
  // the loop clock: global seconds -> phase and t
  function at(T) { T = loopT(T, LOOP); for (const p of PHASES.slice().reverse()) if (T >= START[p]) return { phase: p, t: T - START[p] } }

  window.AltR9 = { frame, state, hit, at, PHASES, DUR, START, LOOP, RUNG }
})()
