/* The studio boat, Lantern deck (art direction https://claude.ai/artifact/85chXzRvLpPj7dumm6hi5z, still A).
 * A Phaser 3 side view you walk left and right across. Every house is a strand of the work, and how it looks is how
 * the strand is doing. Data arrives as window.BOAT (src/lib/studio/world.ts); nothing here is a list or a panel.
 * Spirits come from the spirit generator's pixel renders (sprites/spirits.png: 18 bases across, the five elements down).
 * Params: ?skip=1 starts awake, ?intro=1 forces the wake-up, ?strand=<name> walks to that house, ?sky=dawn|day|dusk|night. */
(function () {
  'use strict'
  const W = window.BOAT
  const Q = new URLSearchParams(location.search)
  const FLOOR = [640, 440] // lower deck, upper gallery
  const INK = '#3b2a3f'
  const SPEED = 280
  const ELEMENTS = ['earth', 'wood', 'fire', 'water', 'metal'] // rows of sprites/spirits.png
  const BASES = 18
  const BELLS = 3 // only the freshest waiting houses hang a bell; the rest keep a letter on the door
  const nameHash = s => { let h = 7; for (const ch of s) h = (h * 131 + ch.charCodeAt(0)) >>> 0; return h }
  /** A strand's own spirit: a stable base and element, so it is the same creature every visit. */
  const spiritOf = strand => { const n = nameHash(strand); return (n % ELEMENTS.length) * BASES + (Math.floor(n / 5) % BASES) }

  // ---------- small helpers ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('studioBoat.' + k); return v == null ? d : JSON.parse(v) } catch { return d } },
    set(k, v) { try { localStorage.setItem('studioBoat.' + k, JSON.stringify(v)) } catch { /* private window */ } },
  }
  const today = new Date().toISOString().slice(0, 10)
  const tended = new Set(store.get('tended.' + today, []))
  const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`
  const rand = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(7)

  function skyNow() {
    const forced = Q.get('sky')
    if (forced) return forced
    const h = new Date().getHours()
    return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'dusk' : 'night'
  }
  const SKY = {
    dawn: { top: '#4b5a9c', mid: '#c99ab2', low: '#ffd3a0', seaTop: '#5b8ea0', seaLow: '#1f4660', lamp: 0.6, stars: 0.2 },
    day: { top: '#5d9fe0', mid: '#a9d3f0', low: '#f6e7c8', seaTop: '#3f93b0', seaLow: '#1b5674', lamp: 0.25, stars: 0 },
    dusk: { top: '#3a2f6e', mid: '#9b6aa6', low: '#f6a86e', seaTop: '#2f7a80', seaLow: '#163a4e', lamp: 0.9, stars: 0.6 },
    night: { top: '#0b1030', mid: '#1f2556', low: '#45407a', seaTop: '#173452', seaLow: '#08142a', lamp: 1, stars: 1 },
  }[skyNow()] || null

  // ---------- sound (Web Audio, starts on the first tap) ----------
  let AC = null
  function audioOn() {
    if (AC) return
    try { AC = new (window.AudioContext || window.webkitAudioContext)() } catch { return }
    const len = AC.sampleRate * 2, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0)
    let b = 0
    for (let i = 0; i < len; i++) { b = (b + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = b * 3.5 }
    const src = AC.createBufferSource(); src.buffer = buf; src.loop = true
    const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500
    const g = AC.createGain(); g.gain.value = 0.18
    const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = 0.12; lg.gain.value = 0.08
    lfo.connect(lg).connect(g.gain); src.connect(f).connect(g).connect(AC.destination); src.start(); lfo.start()
  }
  function bellSound(vol = 0.35) {
    if (!AC) return
    const t = AC.currentTime
    for (const [fr, v, dec] of [[784, 1, 2.6], [1568, 0.4, 1.4], [2093, 0.25, 0.9], [1176, 0.3, 1.8]]) {
      const o = AC.createOscillator(), g = AC.createGain()
      o.type = 'sine'; o.frequency.value = fr
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * v, t + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dec)
      o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dec)
    }
  }
  function creak() {
    if (!AC) return
    const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain()
    o.type = 'sawtooth'; o.frequency.setValueAtTime(90, t); o.frequency.linearRampToValueAtTime(70, t + 0.5)
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
    const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 300
    o.connect(f).connect(g).connect(AC.destination); o.start(t); o.stop(t + 0.7)
  }

  // ---------- drawing textures (2D canvas, ink outlines like still A) ----------
  function ink(c, w = 3) { c.strokeStyle = INK; c.lineWidth = w; c.lineJoin = 'round'; c.lineCap = 'round' }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r) }

  function drawHouse(c, h, lit) {
    const w = 150, x0 = 5, base = 228, bodyH = 118, top = base - bodyH
    const wall = hsl(h.hue, 28, 74), wallDark = hsl(h.hue, 24, 62), roof = hsl((h.hue + 20) % 360, 42, 52)
    const kind = h.hue % 3
    c.save()
    // body
    ink(c); c.fillStyle = wall; rr(c, x0 + 6, top, w - 12, bodyH, 6); c.fill(); c.stroke()
    c.strokeStyle = wallDark; c.lineWidth = 1.5
    for (let y = top + 14; y < base - 4; y += 13) { c.beginPath(); c.moveTo(x0 + 9, y); c.lineTo(x0 + w - 9, y); c.stroke() }
    // roof
    ink(c); c.fillStyle = roof
    if (kind === 0) { c.beginPath(); c.moveTo(x0 - 4, top + 6); c.lineTo(x0 + w / 2, top - 62); c.lineTo(x0 + w + 4, top + 6); c.closePath(); c.fill(); c.stroke() }
    else if (kind === 1) {
      c.beginPath(); c.moveTo(x0 + 8, top + 4); c.quadraticCurveTo(x0 + 10, top - 70, x0 + w / 2, top - 74)
      c.quadraticCurveTo(x0 + w - 10, top - 70, x0 + w - 8, top + 4); c.closePath(); c.fill(); c.stroke()
      c.strokeStyle = hsl((h.hue + 20) % 360, 40, 40); c.lineWidth = 1.5
      for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(x0 + w / 2, top - 72); c.lineTo(x0 + 8 + i * (w - 16) / 6, top + 4); c.stroke() }
      ink(c); c.fillStyle = '#f3d48a'; c.beginPath(); c.arc(x0 + w / 2, top - 78, 5, 0, 7); c.fill(); c.stroke()
    } else { rr(c, x0 - 2, top - 26, w + 4, 32, 6); c.fill(); c.stroke(); c.fillStyle = hsl(h.hue, 25, 45); c.fillRect(x0 + 2, top + 2, w - 4, 4) }
    // chimney
    if (kind !== 1) { ink(c); c.fillStyle = '#8a7a80'; c.fillRect(x0 + w - 44, top - (kind === 0 ? 48 : 52), 16, 30); c.strokeRect(x0 + w - 44, top - (kind === 0 ? 48 : 52), 16, 30) }
    // window
    const glow = lit ? 1 : h.look === 'vines' ? 0.15 + 0.35 * h.glow : h.look === 'scaffold' ? 0.1 : 0.35
    const wx = x0 + 22, wy = top + 22
    c.fillStyle = `rgba(255,214,120,${glow})`; ink(c)
    if (kind === 1) { c.beginPath(); c.arc(wx + 22, wy + 18, 18, 0, 7); c.fillStyle = '#2b3550'; c.fill(); c.fillStyle = `rgba(255,214,120,${glow})`; c.fill(); c.stroke() }
    else { rr(c, wx, wy, 44, 36, 4); c.fillStyle = '#2b3550'; c.fill(); c.fillStyle = `rgba(255,214,120,${glow})`; c.fill(); c.stroke() }
    c.lineWidth = 2; c.beginPath()
    if (kind === 1) { c.moveTo(wx + 22, wy); c.lineTo(wx + 22, wy + 36); c.moveTo(wx + 4, wy + 18); c.lineTo(wx + 40, wy + 18) }
    else { c.moveTo(wx + 22, wy); c.lineTo(wx + 22, wy + 36); c.moveTo(wx, wy + 18); c.lineTo(wx + 44, wy + 18) }
    c.stroke()
    // door
    const dx = x0 + w - 56, dy = base - 58
    ink(c); c.fillStyle = hsl((h.hue + 200) % 360, 30, 42)
    c.beginPath(); c.moveTo(dx, base - 2); c.lineTo(dx, dy + 14); c.arc(dx + 17, dy + 14, 17, Math.PI, 0); c.lineTo(dx + 34, base - 2); c.closePath(); c.fill(); c.stroke()
    c.fillStyle = '#f3d48a'; c.beginPath(); c.arc(dx + 27, base - 28, 2.5, 0, 7); c.fill()
    // mail slot, and one letter sticking out per round built past his last look
    ink(c, 2); c.fillStyle = '#5a4a40'; c.fillRect(x0 + 24, base - 30, 30, 8); c.strokeRect(x0 + 24, base - 30, 30, 8)
    for (let i = 0; i < Math.min(4, h.letters); i++) {
      c.save(); c.translate(x0 + 30 + i * 6, base - 30); c.rotate(-0.25 + i * 0.12)
      c.fillStyle = '#fbf3e0'; ink(c, 1.5); c.fillRect(-6, -14, 14, 12); c.strokeRect(-6, -14, 14, 12)
      c.fillStyle = '#c0392b'; c.beginPath(); c.arc(1, -8, 2.5, 0, 7); c.fill(); c.restore()
    }
    // the looks
    if (h.look === 'bell') { // a letter pinned to the door
      c.save(); c.translate(dx + 17, dy + 22); c.rotate(-0.08)
      c.fillStyle = '#fff7e6'; ink(c, 2); rr(c, -14, -10, 28, 20, 2); c.fill(); c.stroke()
      c.beginPath(); c.moveTo(-14, -10); c.lineTo(0, 2); c.lineTo(14, -10); c.stroke()
      c.fillStyle = '#d0453a'; c.beginPath(); c.arc(0, 2, 4, 0, 7); c.fill(); c.restore()
      if (h.belled) { ink(c, 3); c.beginPath(); c.moveTo(x0 + w - 6, top + 12); c.lineTo(x0 + w + 12, top + 12); c.stroke() } // bell bracket
    }
    if (h.look === 'scaffold') {
      ink(c, 3); c.strokeStyle = '#8a5a32'
      for (const px of [x0 - 2, x0 + w + 2]) { c.beginPath(); c.moveTo(px, base); c.lineTo(px, top - 70); c.stroke() }
      c.lineWidth = 6; c.strokeStyle = '#a8784a'
      for (const py of [top - 6, top - 52]) { c.beginPath(); c.moveTo(x0 - 6, py); c.lineTo(x0 + w + 6, py); c.stroke() }
      c.lineWidth = 2; c.strokeStyle = '#8a5a32'; c.beginPath(); c.moveTo(x0 - 2, top - 6); c.lineTo(x0 + w + 2, top - 52); c.stroke()
      c.fillStyle = '#9fc7a4'; ink(c, 2); c.fillRect(x0 + 18, top - 50, 48, 42); c.strokeRect(x0 + 18, top - 50, 48, 42) // fresh boards
      c.fillStyle = '#c99a5e'; c.fillRect(x0 + 80, top - 30, 26, 22); c.strokeRect(x0 + 80, top - 30, 26, 22)
      c.beginPath(); c.moveTo(x0 + 80, top - 30); c.lineTo(x0 + 106, top - 8); c.moveTo(x0 + 106, top - 30); c.lineTo(x0 + 80, top - 8); c.stroke()
    }
    if (h.look === 'vines') { // vines and moss thicken day by day
      const n = Math.round(8 + 34 * h.vines)
      c.strokeStyle = '#3f6b3a'; c.lineWidth = 3
      c.beginPath(); c.moveTo(x0 + 2, base); c.bezierCurveTo(x0 - 8, top + 40, x0 + 30, top - 10, x0 + w / 2, top - 30); c.stroke()
      if (h.vines > 0.5) { c.beginPath(); c.moveTo(x0 + w - 2, base); c.bezierCurveTo(x0 + w + 8, top + 50, x0 + w - 20, top, x0 + w / 2, top - 30); c.stroke() }
      for (let i = 0; i < n; i++) {
        const t = rand(), side = i % 2, lx = side ? x0 + w - 4 - 30 * t * rand() : x0 + 4 + 40 * t * rand()
        const ly = base - (bodyH + 50) * t - rand() * 8
        c.fillStyle = i % 3 ? '#5f9a4e' : '#7cb85f'; ink(c, 1.5)
        c.beginPath(); c.ellipse(lx, ly, 8, 5, rand() * 3, 0, 7); c.fill(); c.stroke()
      }
      c.fillStyle = 'rgba(70,90,70,0.25)'; c.fillRect(x0 + 6, base - 18, w - 12, 16)
    }
    c.restore()
  }

  function drawWheelhouse(c) {
    const w = 300, base = 200, top = 24
    ink(c); c.fillStyle = '#e9a87a'; rr(c, 12, top + 40, w - 24, base - top - 40, 8); c.fill(); c.stroke()
    c.strokeStyle = '#cf8b60'; c.lineWidth = 1.5
    for (let y = top + 56; y < base - 4; y += 14) { c.beginPath(); c.moveTo(16, y); c.lineTo(w - 16, y); c.stroke() }
    ink(c); c.fillStyle = '#d65a4a'; c.beginPath(); c.moveTo(0, top + 46); c.lineTo(w / 2, top - 6); c.lineTo(w, top + 46); c.closePath(); c.fill(); c.stroke()
    c.fillStyle = '#8a7a80'; c.fillRect(w - 80, top - 26, 18, 40); c.strokeRect(w - 80, top - 26, 18, 40)
    // the big lit window with the wheel and the chart on the wall
    const g = c.createLinearGradient(0, 90, 0, 160); g.addColorStop(0, '#ffe7a8'); g.addColorStop(1, '#f6b765')
    c.fillStyle = g; rr(c, 40, 82, 150, 74, 8); c.fill(); ink(c, 4); c.stroke()
    ink(c, 4); c.strokeStyle = '#8a5a32'; c.beginPath(); c.arc(140, 124, 22, 0, 7); c.stroke()
    for (let a = 0; a < 8; a++) { c.beginPath(); c.moveTo(140, 124); c.lineTo(140 + 30 * Math.cos(a * Math.PI / 4), 124 + 30 * Math.sin(a * Math.PI / 4)); c.stroke() }
    c.fillStyle = '#f4ead0'; ink(c, 2); c.fillRect(56, 92, 46, 34); c.strokeRect(56, 92, 46, 34)
    c.strokeStyle = '#7a8fb0'; c.beginPath(); c.moveTo(60, 116); c.quadraticCurveTo(78, 96, 98, 112); c.stroke()
    // door
    ink(c); c.fillStyle = '#7a4a32'; c.beginPath(); c.moveTo(214, base - 2); c.lineTo(214, 112); c.arc(234, 112, 20, Math.PI, 0); c.lineTo(254, base - 2); c.closePath(); c.fill(); c.stroke()
    c.fillStyle = '#f3d48a'; c.beginPath(); c.arc(246, 156, 3, 0, 7); c.fill()
  }

  function drawEverdoor(c) {
    const g = c.createLinearGradient(0, 30, 0, 230); g.addColorStop(0, '#fff6d8'); g.addColorStop(1, '#f2c27a')
    ink(c, 4); c.fillStyle = '#d7d0f0'
    c.beginPath(); c.moveTo(14, 230); c.lineTo(14, 90); c.arc(74, 90, 60, Math.PI, 0); c.lineTo(134, 230); c.closePath(); c.fill(); c.stroke()
    c.fillStyle = g; c.beginPath(); c.moveTo(30, 228); c.lineTo(30, 92); c.arc(74, 92, 44, Math.PI, 0); c.lineTo(118, 228); c.closePath(); c.fill()
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2
    for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(74, 60); c.lineTo(74 + i * 12, 228); c.stroke() }
    ink(c, 3); c.fillStyle = '#e8c45a'; c.beginPath(); c.moveTo(62, 28); c.lineTo(86, 28); c.lineTo(80, 44); c.lineTo(68, 44); c.closePath(); c.fill(); c.stroke()
  }

  function drawHull(c, w) {
    const top = 6, bottom = 170
    const g = c.createLinearGradient(0, 0, 0, bottom); g.addColorStop(0, '#c58a55'); g.addColorStop(1, '#8a5534')
    ink(c, 4); c.fillStyle = g
    c.beginPath(); c.moveTo(30, top); c.lineTo(w - 120, top); c.quadraticCurveTo(w - 30, top - 6, w - 4, top - 40)
    c.quadraticCurveTo(w - 40, bottom - 30, w - 200, bottom); c.lineTo(110, bottom); c.quadraticCurveTo(20, bottom - 40, 30, top)
    c.closePath(); c.fill(); c.stroke()
    c.strokeStyle = 'rgba(90,50,30,0.5)'; c.lineWidth = 2
    for (let y = top + 26; y < bottom - 6; y += 24) { c.beginPath(); c.moveTo(40, y); c.lineTo(w - 70 - (y - top) * 0.7, y); c.stroke() }
    for (let x = 140; x < w - 220; x += 170) {
      const lit = rand() > 0.25
      ink(c, 3); c.fillStyle = '#d8c39a'; c.beginPath(); c.arc(x, 60, 15, 0, 7); c.fill(); c.stroke()
      c.fillStyle = lit ? '#fbe7a6' : '#4a3a4a'; c.beginPath(); c.arc(x, 60, 10, 0, 7); c.fill()
    }
    // deck plank and railing
    ink(c, 3); c.fillStyle = '#a8784a'; c.fillRect(24, top - 2, w - 140, 12); c.strokeRect(24, top - 2, w - 140, 12)
  }

  /** The crew wear the player's walk frames in their own coat colour: purple cloth is turned to a new hue, skin,
   * sash and boots stay as they are. */
  const STRIDE = ['player_t0', 'player_t0_26', 'player_t0_52', 'player_t0_78']
  const COATS = [18, 140, 185, 45, 330] // hues: rust, green, teal, mustard, rose
  function recolor(scene, src, key, hue) {
    const img = scene.textures.get(src).getSourceImage(), t = scene.textures.createCanvas(key, img.width, img.height), c = t.getContext()
    c.drawImage(img, 0, 0)
    const d = c.getImageData(0, 0, img.width, img.height), p = d.data
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue
      const r = p[i] / 255, g = p[i + 1] / 255, b = p[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, ch = mx - mn
      if (ch < 0.12) continue
      let h = mx === r ? ((g - b) / ch) % 6 : mx === g ? (b - r) / ch + 2 : (r - g) / ch + 4
      h = (h * 60 + 360) % 360
      if (h < 215 || h > 300) continue
      const s = ch / (1 - Math.abs(2 * l - 1)), L = Math.min(0.8, l * 1.35)
      const C = (1 - Math.abs(2 * L - 1)) * Math.min(1, s), X = C * (1 - Math.abs(((hue / 60) % 2) - 1)), m = L - C / 2
      const [rr, gg, bb] = hue < 60 ? [C, X, 0] : hue < 120 ? [X, C, 0] : hue < 180 ? [0, C, X] : hue < 240 ? [0, X, C] : hue < 300 ? [X, 0, C] : [C, 0, X]
      p[i] = (rr + m) * 255; p[i + 1] = (gg + m) * 255; p[i + 2] = (bb + m) * 255
    }
    c.putImageData(d, 0, 0); t.refresh()
  }

  function makeTex(scene, key, w, h, fn) {
    const t = scene.textures.createCanvas(key, w, h)
    fn(t.getContext(), w, h); t.refresh()
  }

  // ---------- the scene ----------
  class Boat extends Phaser.Scene {
    constructor() { super('boat') }

    preload() {
      const s = '/studio/sprites/'
      for (const k of ['fox', 'fox_side', 'tortoise_side', 'crew_side', 'player_t0', 'player_t0_26', 'player_t0_52', 'player_t0_78', 'player_side', 'player_back'])
        this.load.image(k, s + k + '.png')
      this.load.spritesheet('spirits', s + 'spirits.png', { frameWidth: 64, frameHeight: 64 })
    }

    create() {
      this.houses = []; this.bells = []
      this.textures.get('spirits').setFilter(Phaser.Textures.FilterMode.NEAREST)
      // sky, anchored to the camera sideways and to the world up and down
      makeTex(this, 'sky', 4, 512, (c, w, h) => {
        const g = c.createLinearGradient(0, 0, 0, h)
        g.addColorStop(0, SKY.top); g.addColorStop(0.55, SKY.mid); g.addColorStop(1, SKY.low); c.fillStyle = g; c.fillRect(0, 0, w, h)
      })
      makeTex(this, 'sea', 4, 256, (c, w, h) => {
        const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, SKY.seaTop); g.addColorStop(1, SKY.seaLow); c.fillStyle = g; c.fillRect(0, 0, w, h)
      })
      makeTex(this, 'wave', 256, 40, c => {
        c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 2
        for (let i = 0; i < 4; i++) { const x = i * 64 + 10; c.beginPath(); c.moveTo(x, 20); c.quadraticCurveTo(x + 14, 14, x + 28, 20); c.stroke() }
      })
      makeTex(this, 'dot', 16, 16, c => { const g = c.createRadialGradient(8, 8, 0, 8, 8, 8); g.addColorStop(0, 'rgba(255,240,190,1)'); g.addColorStop(1, 'rgba(255,240,190,0)'); c.fillStyle = g; c.fillRect(0, 0, 16, 16) })
      makeTex(this, 'puff', 32, 32, c => { c.fillStyle = 'rgba(240,230,235,0.9)'; c.beginPath(); c.arc(16, 16, 14, 0, 7); c.fill() })
      makeTex(this, 'cloud', 220, 90, c => {
        c.fillStyle = SKY === null ? '#fff' : 'rgba(255,225,215,0.9)'; ink(c, 3); c.strokeStyle = 'rgba(160,110,140,0.6)'
        c.beginPath(); c.arc(60, 60, 28, Math.PI * 0.5, Math.PI * 1.6); c.arc(100, 38, 34, Math.PI, Math.PI * 1.9); c.arc(150, 46, 28, Math.PI * 1.2, 0.3)
        c.arc(170, 66, 18, -1, 1.6); c.closePath(); c.fill(); c.stroke()
      })
      makeTex(this, 'moon', 80, 80, c => {
        c.fillStyle = '#f7ecd0'; c.beginPath(); c.arc(40, 40, 26, 0, 7); c.fill()
        c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(52, 32, 24, 0, 7); c.fill()
      })
      // an island is a far mountain with a nearer shoulder and a lighthouse, tall enough to rise over the roofs
      makeTex(this, 'island', 520, 360, c => {
        c.fillStyle = '#8a76a6'; c.beginPath(); c.moveTo(0, 360); c.quadraticCurveTo(90, 250, 170, 170); c.quadraticCurveTo(230, 30, 290, 24)
        c.quadraticCurveTo(340, 40, 380, 150); c.quadraticCurveTo(450, 250, 520, 360); c.closePath(); c.fill()
        c.fillStyle = '#6b4f7a'; c.beginPath(); c.moveTo(40, 360); c.quadraticCurveTo(120, 220, 210, 214); c.quadraticCurveTo(300, 210, 340, 250)
        c.quadraticCurveTo(420, 290, 480, 360); c.closePath(); c.fill()
        for (const [tx, ty] of [[150, 236], [180, 222], [250, 214]]) { c.beginPath(); c.moveTo(tx - 12, ty + 8); c.lineTo(tx, ty - 26); c.lineTo(tx + 12, ty + 8); c.fill() }
        c.fillRect(300, 186, 12, 40); c.beginPath(); c.moveTo(296, 190); c.lineTo(306, 168); c.lineTo(316, 190); c.fill()
        c.fillStyle = '#ffe6a8'; c.fillRect(302, 192, 8, 8)
        c.fillStyle = 'rgba(255,240,230,0.18)'; c.fillRect(0, 330, 520, 30) // haze where it meets the sea
      })
      // asleep in the hammock: a quilt over a sleeper, a nightcap and a closed eye; after waking, just the quilt
      const quilt = (c, w, head) => {
        const mid = w / 2
        ink(c, 3); c.fillStyle = '#d9c3a0'
        c.beginPath(); c.moveTo(6, 8); c.quadraticCurveTo(mid, 76, w - 6, 8); c.lineTo(w - 20, 22); c.quadraticCurveTo(mid, 66, 20, 22); c.closePath(); c.fill(); c.stroke()
        const cols = ['#c86a5a', '#e9c45a', '#7aa38a', '#6a8fd0', '#d98fb0']
        c.save(); c.beginPath(); c.moveTo(head ? 54 : 30, 30); c.quadraticCurveTo(mid, head ? 18 : 40, w - 26, 26); c.quadraticCurveTo(mid, 82, head ? 54 : 30, 30); c.clip()
        for (let i = 0; i < 12; i++) { c.fillStyle = cols[i % cols.length]; c.fillRect(20 + i * (w - 40) / 12, 0, (w - 40) / 12 + 1, 90) }
        c.restore()
        ink(c, 3); c.beginPath(); c.moveTo(head ? 54 : 30, 30); c.quadraticCurveTo(mid, head ? 18 : 40, w - 26, 26); c.quadraticCurveTo(mid, 82, head ? 54 : 30, 30); c.stroke()
        if (!head) return
        c.fillStyle = '#f0c49a'; c.beginPath(); c.arc(40, 30, 15, 0, 7); c.fill(); c.stroke()
        c.lineWidth = 2; c.beginPath(); c.arc(36, 31, 5, 0.2, Math.PI - 0.2); c.stroke()
        c.fillStyle = '#6a8fd0'; ink(c, 2.5); c.beginPath(); c.moveTo(26, 24); c.quadraticCurveTo(34, 6, 54, 14); c.lineTo(66, 30); c.quadraticCurveTo(50, 18, 26, 24); c.fill(); c.stroke()
        c.fillStyle = '#fff6e6'; c.beginPath(); c.arc(68, 32, 5, 0, 7); c.fill(); c.stroke()
      }
      const hw = W.mastX - 10 - (W.wheelhouseX + 156)
      makeTex(this, 'sleeper', hw, 90, (c, w) => quilt(c, w, true))
      makeTex(this, 'quilt', hw, 90, (c, w) => quilt(c, w, false))
      // the ship's log open on a lectern by the wheelhouse door
      makeTex(this, 'lectern', 70, 110, c => {
        ink(c, 3); c.fillStyle = '#8a5a32'; c.fillRect(30, 40, 10, 66); c.strokeRect(30, 40, 10, 66); c.fillRect(16, 100, 38, 8); c.strokeRect(16, 100, 38, 8)
        c.fillStyle = '#6b3d2e'; c.beginPath(); c.moveTo(4, 40); c.lineTo(66, 28); c.lineTo(66, 40); c.lineTo(4, 52); c.closePath(); c.fill(); c.stroke()
        c.fillStyle = '#fbf1dc'; c.beginPath(); c.moveTo(8, 34); c.lineTo(35, 20); c.lineTo(62, 26); c.lineTo(62, 32); c.lineTo(35, 28); c.lineTo(8, 42); c.closePath(); c.fill(); c.stroke()
        c.strokeStyle = 'rgba(120,90,60,0.6)'; c.lineWidth = 1
        for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(13, 37 - i * 3); c.lineTo(31, 28 - i * 3); c.moveTo(39, 26 + i * 0); c.stroke() }
      })
      makeTex(this, 'hull', W.width + 60, 200, (c, w) => drawHull(c, w))
      makeTex(this, 'wheelhouse', 300, 204, c => drawWheelhouse(c))
      makeTex(this, 'everdoor', 150, 234, c => drawEverdoor(c))
      makeTex(this, 'crate', 34, 30, c => { ink(c, 2.5); c.fillStyle = '#d8a868'; c.fillRect(2, 2, 30, 26); c.strokeRect(2, 2, 30, 26); c.beginPath(); c.moveTo(2, 2); c.lineTo(32, 28); c.moveTo(32, 2); c.lineTo(2, 28); c.stroke() })
      makeTex(this, 'bell', 40, 46, c => {
        ink(c, 3); c.fillStyle = '#f0c24e'; c.beginPath(); c.moveTo(20, 4); c.quadraticCurveTo(6, 6, 7, 30); c.lineTo(3, 38); c.lineTo(37, 38); c.lineTo(33, 30); c.quadraticCurveTo(34, 6, 20, 4); c.fill(); c.stroke()
        c.fillStyle = '#b8862e'; c.beginPath(); c.arc(20, 42, 4, 0, 7); c.fill(); c.stroke()
      })
      makeTex(this, 'lantern', 22, 34, c => { ink(c, 2); c.fillStyle = '#ffe6a0'; rr(c, 4, 8, 14, 20, 3); c.fill(); c.stroke(); c.beginPath(); c.moveTo(11, 0); c.lineTo(11, 8); c.stroke() })
      makeTex(this, 'hat', 46, 22, c => { ink(c, 2.5); c.fillStyle = '#e9c45a'; c.beginPath(); c.ellipse(23, 17, 21, 4, 0, 0, 7); c.fill(); c.stroke(); rr(c, 11, 2, 24, 15, 5); c.fill(); c.stroke() })
      makeTex(this, 'cap', 46, 22, c => { ink(c, 2.5); c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(23, 17, 18, 4, 0, 0, 7); c.fill(); c.stroke(); rr(c, 12, 4, 22, 13, 6); c.fill(); c.stroke() })
      makeTex(this, 'sail', 320, 300, c => {
        ink(c, 4); c.fillStyle = '#f2e9de'
        c.beginPath(); c.moveTo(10, 10); c.lineTo(310, 10); c.quadraticCurveTo(330, 150, 300, 290); c.lineTo(20, 290); c.quadraticCurveTo(-6, 150, 10, 10); c.fill(); c.stroke()
        c.strokeStyle = 'rgba(160,130,120,0.5)'; c.lineWidth = 2
        for (const y of [80, 150, 220]) { c.beginPath(); c.moveTo(16, y); c.quadraticCurveTo(160, y + 12, 306, y); c.stroke() }
        c.fillStyle = 'rgba(240,170,120,0.35)'; c.beginPath(); c.arc(160, 130, 36, 0, 7); c.fill()
      })
      makeTex(this, 'zz', 40, 30, c => { c.fillStyle = 'rgba(255,255,255,0.85)'; c.font = 'bold 20px Fredoka, sans-serif'; c.fillText('z', 4, 24); c.font = 'bold 14px Fredoka, sans-serif'; c.fillText('z', 22, 12) })

      // far layers
      this.skyTop = this.add.rectangle(0, -420, 10, 8000, Phaser.Display.Color.HexStringToColor(SKY.top).color).setOrigin(0.5, 1).setScrollFactor(0, 1).setDepth(-101)
      this.sky = this.add.image(0, -420, 'sky').setOrigin(0.5, 0).setScrollFactor(0, 1).setDepth(-100)
      this.stars = []
      for (let i = 0; i < 90 * SKY.stars; i++) {
        const st = this.add.image(rand() * 2400 - 200, -380 + rand() * 820, 'dot').setScrollFactor(0.02, 1).setScale(0.25 + rand() * 0.25).setAlpha(0.6).setDepth(-99)
        this.tweens.add({ targets: st, alpha: 0.15, duration: 900 + rand() * 2000, yoyo: true, repeat: -1, delay: rand() * 2000 })
      }
      if (SKY.stars) this.add.image(380, 140, 'moon').setScrollFactor(0.03, 1).setDepth(-98)
      this.clouds = []
      for (let i = 0; i < 6; i++) this.clouds.push(this.add.image(i * 520 + rand() * 200, 90 + rand() * 220, 'cloud').setScrollFactor(0.08, 1).setScale(0.7 + rand() * 0.6).setDepth(-97).setAlpha(SKY.stars ? 0.85 : 0.95))
      // seven islands, one per stage; the boat is bound for the one it is at
      const span = W.width * 0.35 + 1800
      this.islands = W.islands.map((g, i) => {
        const im = this.add.image(200 + i * span / 7, 604, 'island').setOrigin(0.5, 1).setScrollFactor(0.35, 1).setDepth(-90)
          .setScale(g.state === 'here' ? 1.5 : 1.05 + 0.04 * i).setAlpha(g.state === 'ahead' ? 0.6 : 1)
        if (g.state === 'here') { im.setTint(0xb9a3e6); this.here = im }
        if (g.state === 'passed') im.setTint(0x9fd3a4)
        return im
      })
      if (this.here) {
        const sc = this.here.scaleX
        const beam = this.add.image(this.here.x + 46 * sc, this.here.y - 164 * sc, 'dot').setScrollFactor(0.35, 1).setScale(3.2).setDepth(-89).setBlendMode(Phaser.BlendModes.ADD)
        this.tweens.add({ targets: beam, alpha: 0.25, duration: 1400, yoyo: true, repeat: -1 })
        this.here.setScale(this.here.scaleX * (1 + 0.05 * Math.min(10, store.get('closer', 0))))
      }
      this.seaFar = this.add.image(-6000, 600, 'sea').setOrigin(0, 0).setDisplaySize(W.width + 12000, 1600).setDepth(-80)
      this.waves = this.add.tileSprite(-6000, 610, W.width + 12000, 900, 'wave').setOrigin(0, 0).setDepth(-79).setAlpha(0.9)
      // the ship: everything on it bobs together
      const ship = this.ship = this.add.container(0, 0).setDepth(0)
      const add = o => { ship.add(o); return o }
      add(this.add.image(W.mastX - 4, 646, 'sail').setOrigin(0.5, 1).setVisible(false)) // placeholder for ordering
      this.mast = add(this.add.rectangle(W.mastX, 640, 14, 620, 0x7a5232).setOrigin(0.5, 1).setStrokeStyle(3, 0x3b2a3f))
      this.sail = add(this.add.image(W.mastX, 100, 'sail').setOrigin(0.5, 0).setScale(0.9, 1))
      this.flag = add(this.add.triangle(W.mastX + 30, 30, 0, 0, 44, 10, 0, 20, 0xe0645a).setStrokeStyle(2, 0x3b2a3f))
      add(this.add.image(-30, 634, 'hull').setOrigin(0, 0))
      // the gallery over the houses, with posts down to the deck
      const g0 = W.houses.length ? Math.min(...W.houses.map(h => h.x)) - 90 : W.wheelhouseX - 160
      const g1 = W.houses.length ? Math.max(...W.houses.map(h => h.x)) + 90 : W.mastX + 80
      this.gallery = [g0, g1]
      const gfx = add(this.add.graphics())
      gfx.fillStyle(0xa8784a).lineStyle(3, 0x3b2a3f).fillRect(g0, FLOOR[1], g1 - g0, 12).strokeRect(g0, FLOOR[1], g1 - g0, 12)
      gfx.lineStyle(2, 0x6b4a32)
      for (let x = g0 + 6; x < g1; x += 26) gfx.lineBetween(x, FLOOR[1] - 26, x, FLOOR[1])
      gfx.lineStyle(3, 0x6b4a32).lineBetween(g0, FLOOR[1] - 26, g1, FLOOR[1] - 26)
      gfx.lineStyle(5, 0x7a5232)
      for (let x = g0 + 4; x < g1; x += 164) if (Math.abs(x - W.wheelhouseX) > 160 && Math.abs(x - W.mastX) > 30) gfx.lineBetween(x, FLOOR[1] + 12, x, FLOOR[0])
      // deck railing
      gfx.lineStyle(2, 0x6b4a32)
      for (let x = 30; x < W.width - 100; x += 26) gfx.lineBetween(x, FLOOR[0] - 22, x, FLOOR[0])
      gfx.lineStyle(3, 0x6b4a32).lineBetween(30, FLOOR[0] - 22, W.width - 100, FLOOR[0] - 22)
      // ladders
      this.ladders = [g0 + 20, ...W.ladders.filter(x => x > g0 + 60 && x < g1 - 60), g1 - 20]
      const lg = add(this.add.graphics()).lineStyle(4, 0x6b4a32)
      for (const x of this.ladders) {
        lg.lineBetween(x - 14, FLOOR[0], x - 14, FLOOR[1] - 30); lg.lineBetween(x + 14, FLOOR[0], x + 14, FLOOR[1] - 30)
        for (let y = FLOOR[0] - 18; y > FLOOR[1] - 20; y -= 24) lg.lineBetween(x - 14, y, x + 14, y)
      }
      // string lights from the mast top to bow and stern, and along the gallery
      const lights = add(this.add.graphics()).lineStyle(1.5, 0x2a2030, 0.8)
      const lamp = []
      const sag = (x0, y0, x1, y1, d) => {
        const pts = []
        for (let i = 0; i <= 24; i++) { const t = i / 24, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * d; pts.push([x, y]) }
        lights.strokePoints(pts.map(p => ({ x: p[0], y: p[1] })))
        for (let i = 1; i < 24; i += 1) lamp.push(pts[i])
      }
      sag(W.mastX, 60, W.width - 60, 560, 120); sag(W.mastX, 60, 60, 580, 120)
      for (let x = g0; x < g1 - 1; x += 330) sag(x, FLOOR[1] - 30, Math.min(g1, x + 330), FLOOR[1] - 30, 30)
      for (const [x, y] of lamp) {
        const b = add(this.add.image(x, y, 'dot').setScale(0.7).setAlpha(0.5 + 0.5 * SKY.lamp).setBlendMode(Phaser.BlendModes.ADD))
        this.tweens.add({ targets: b, alpha: 0.35, duration: 700 + rand() * 1800, yoyo: true, repeat: -1, delay: rand() * 1500 })
      }
      // the Everdoor at the stern, the wheelhouse midship
      this.everdoor = add(this.add.image(W.everdoorX, FLOOR[0], 'everdoor').setOrigin(0.5, 1))
      const halo = add(this.add.image(W.everdoorX, FLOOR[0] - 110, 'dot').setScale(9).setAlpha(0.35))
      this.tweens.add({ targets: halo, alpha: 0.15, scale: 7.5, duration: 1800, yoyo: true, repeat: -1 })
      this.wheelhouse = add(this.add.image(W.wheelhouseX, FLOOR[0] + 2, 'wheelhouse').setOrigin(0.5, 1))
      add(this.add.particles(W.wheelhouseX + 79, FLOOR[0] - 210, 'puff', { lifespan: 4200, speedY: { min: -26, max: -16 }, speedX: { min: 4, max: 14 }, scale: { start: 0.5, end: 2.2 }, alpha: { start: 0.55, end: 0 }, frequency: 420 }))
      // the hammock between the wheelhouse and the mast
      const hx0 = W.wheelhouseX + 156, hx1 = W.mastX - 10
      this.hammock = add(this.add.graphics()).lineStyle(3, 0x3b2a3f).fillStyle(0xd9c3a0)
      this.hammock.beginPath(); this.hammock.moveTo(hx0, 560); this.hammock.lineTo(hx0 + 14, 586)
      this.hammock.lineTo((hx0 + hx1) / 2, 606); this.hammock.lineTo(hx1 - 14, 586); this.hammock.lineTo(hx1, 560)
      this.hammock.strokePath()
      this.sleeper = add(this.add.image(hx0, 556, 'quilt').setOrigin(0, 0))
      this.lecternX = W.wheelhouseX - 112
      add(this.add.image(this.lecternX, FLOOR[0] + 2, 'lectern').setOrigin(0.5, 1))
      this.logGlow = add(this.add.image(this.lecternX, FLOOR[0] - 78, 'dot').setScale(3).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD))
      this.tweens.add({ targets: this.logGlow, alpha: 0.2, duration: 1600, yoyo: true, repeat: -1 })

      // houses
      const belled = new Set(W.houses.filter(h => h.look === 'bell').sort((a, b) => a.days - b.days).slice(0, BELLS).map(h => h.strand))
      for (const h0 of W.houses) {
        const h = { ...h0, belled: belled.has(h0.strand) }
        const key = 'h-' + h.strand, keyLit = key + '-lit'
        makeTex(this, key, 160, 234, c => drawHouse(c, h, h.look === 'lit'))
        if (h.look === 'bell') makeTex(this, keyLit, 160, 234, c => drawHouse(c, { ...h, look: 'lit' }, true))
        const y = FLOOR[h.tier]
        const img = add(this.add.image(h.x, y + 4, key).setOrigin(0.5, 1))
        const rec = { h, img, y, keyLit }
        if (h.look === 'lit' || h.look === 'scaffold') {
          const lit = h.look === 'lit'
          if (lit && h.hue % 3 !== 1) add(this.add.particles(h.x + 39, y - 166, 'puff', { lifespan: 3200, speedY: { min: -22, max: -14 }, speedX: { min: 2, max: 10 }, scale: { start: 0.3, end: 1.4 }, alpha: { start: 0.45, end: 0 }, frequency: 600 }))
          if (lit) add(this.add.image(h.x - 31, y - 106, 'dot').setScale(5).setAlpha(0.35 * SKY.lamp + 0.15).setBlendMode(Phaser.BlendModes.ADD))
        }
        if (h.look === 'bell') {
          if (h.belled) rec.bell = add(this.add.image(h.x + 80, y - 106, 'bell').setOrigin(0.5, 0).setScale(0.8))
          rec.glow = add(this.add.image(h.x + 29, y - 32, 'dot').setScale(2.6).setAlpha(0.6).setBlendMode(Phaser.BlendModes.ADD))
          this.tweens.add({ targets: rec.glow, alpha: 0.15, duration: 900, yoyo: true, repeat: -1 })
          rec.spirit = add(this.add.image(h.x - 34, y + 4, 'spirits', spiritOf(h.strand)).setOrigin(0.5, 1).setScale(1.45))
          this.tweens.add({ targets: rec.spirit, scaleY: 1.5, duration: 1100 + (h.hue % 7) * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }) // breathing
          this.bells.push(rec)
          if (tended.has(h.strand)) this.tend(rec, true)
        }
        if (h.look === 'vines') {
          rec.spirit = add(this.add.image(h.x - 40, y, 'tortoise_side').setOrigin(0.5, 1).setScale(0.5).setAlpha(0.45 + 0.55 * h.glow))
          const z = add(this.add.image(h.x - 22, y - 60, 'zz').setAlpha(0))
          this.tweens.add({ targets: z, alpha: { from: 0.9, to: 0 }, y: y - 90, duration: 2600, repeat: -1, delay: rand() * 2000 })
        }
        this.houses.push(rec)
      }
      // a finished strand's spirit walks through the Everdoor
      this.doneQueue = [...W.done]
      if (this.doneQueue.length) this.time.addEvent({ delay: 9000, loop: true, startAt: 6000, callback: () => this.walkThrough() })
      this.anims.create({ key: 'walk', frames: STRIDE.map(key => ({ key })), frameRate: 7, repeat: -1 })
      COATS.forEach((hue, c) => {
        STRIDE.forEach(k => recolor(this, k, `coat${c}-${k}`, hue))
        this.anims.create({ key: 'walk' + c, frames: STRIDE.map(k => ({ key: `coat${c}-${k}` })), frameRate: 7, repeat: -1 })
      })
      // crew: Opus staff wear gold; each mate has their own coat, build and stride, and walks only while moving
      this.crew = W.crew.map((m, i) => {
        const home = this.houses.find(r => r.h.strand === m.home)
        const x = (home ? home.h.x : W.mastX + 80) + (i % 2 ? 46 : -46)
        const sc = 0.38 + (i % 4) * 0.025
        const coat = i % COATS.length
        const body = this.add.sprite(0, 0, `coat${coat}-player_t0`).setOrigin(0.5, 1).setScale(sc, sc * (1 - (i % 3) * 0.04))
        body.anims.timeScale = 0.42 + (i % 3) * 0.06
        const hat = this.add.image(-6, -sc * 255, m.opus ? 'hat' : 'cap').setScale(0.62)
        if (!m.opus) hat.setTint(Phaser.Display.Color.HSLToColor(((i * 47) % 360) / 360, 0.5, 0.6).color)
        const crate = this.add.image(-14, -sc * 300, 'crate').setVisible(false)
        const ct = add(this.add.container(x, FLOOR[0], [body, crate, hat]))
        const mate = { m, ct, crate, body, hat, i, coat, home: x, stack: W.mastX + 70 + (i % 3) * 30, speed: 0.1 + (i % 3) * 0.015 }
        this.time.delayedCall(1500 + i * 2600 + rand() * 1500, () => this.crewTrip(mate))
        return mate
      })
      // crates at the foot of the mast
      for (let i = 0; i < 5; i++) add(this.add.image(W.mastX + 50 + (i % 3) * 34, FLOOR[0] - 15 - Math.floor(i / 3) * 30, 'crate'))
      for (let i = 0; i < 6; i++) add(this.add.image(this.gallery[0] + 140 + i * 520, FLOOR[1] - 12, 'lantern'))
      // the player
      this.player = add(this.add.sprite(W.mastX - 80, FLOOR[0], 'player_side').setOrigin(0.5, 1).setScale(0.44))
      this.tier = 0; this.path = []; this.onArrive = null
      // the wake behind the stern
      const WATER = 735
      this.add.rectangle(-6000, WATER, W.width + 12000, 600, Phaser.Display.Color.HexStringToColor(SKY.seaTop).color).setOrigin(0, 0).setAlpha(0.92).setDepth(1).setSize(W.width + 12000, 4000)
      this.add.tileSprite(-6000, WATER - 14, W.width + 12000, 40, 'wave').setOrigin(0, 0).setDepth(1).setAlpha(0.9)
      this.add.rectangle(-30, WATER, W.width + 60, 5, 0xffffff).setOrigin(0, 0.5).setAlpha(0.35).setDepth(1) // foam at the waterline
      this.wake = this.add.tileSprite(-420, WATER, 460, 40, 'wave').setOrigin(0, 0.5).setAlpha(0.9).setDepth(1)
      this.add.particles(0, 0, 'dot', { x: { min: -400, max: W.width + 400 }, y: { min: 745, max: 900 }, lifespan: 5000, scale: { start: 0.4, end: 0.1 }, alpha: { start: 0, end: 0.8, ease: 'Sine.easeInOut' }, frequency: 260, speedY: -4 }).setDepth(2)

      // camera
      const cam = this.cameras.main
      cam.setBounds(-300, -2000, W.width + 600, 5000)
      this.fit(); this.scale.on('resize', () => this.fit())
      this.follow()
      // input
      this.input.on('pointerdown', p => this.tap(p))
      this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,A,D,W,S,SPACE,E')
      this.letter = document.getElementById('letter')
      // where to start
      const want = Q.get('strand') && this.houses.find(r => r.h.strand === Q.get('strand'))
      const seen = store.get('woke', '') === today
      if (want) { this.wake0(true); this.walkTo(want, () => this.knock(want)) }
      else if (Q.get('skip') === '1' || (seen && Q.get('intro') !== '1')) this.wake0(true)
      else this.intro()
      this.time.addEvent({ delay: 11000, loop: true, callback: () => { const r = this.bells.filter(b => !b.quiet); if (r.length) this.ring(r[Math.floor(rand() * r.length)], 0.12) } })
      this.time.addEvent({ delay: 7000, loop: true, callback: () => creak() })
    }

    fit() {
      const cam = this.cameras.main, w = this.scale.width, h = this.scale.height
      const z = Math.min(h / 1000, w / 560)
      cam.setZoom(z); this.baseZoom = z
      cam.scrollY = 400 - h / 2
      const wide = Math.max(w / z, W.width + 600) * 1.3
      this.sky.setPosition(w / 2, -420).setDisplaySize(wide, 1100)
      this.skyTop.setSize(wide, 8000).setOrigin(0.5, 1).setPosition(w / 2, -419)
    }

    follow() { this.cameras.main.startFollow(this.player, true, 0.08, 0, 0, FLOOR[0] - 400) }

    // ---------- the first 60 seconds ----------
    intro() {
      const cam = this.cameras.main, P = this.player
      P.setVisible(false).setPosition(W.wheelhouseX + 156 + 40, 560)
      this.sleeper.setTexture('sleeper')
      this.zz = this.add.image(W.wheelhouseX + 156 + 60, 540, 'zz').setAlpha(0); this.ship.add(this.zz)
      this.tweens.add({ targets: this.zz, alpha: { from: 0.9, to: 0 }, y: 500, duration: 2600, repeat: -1 })
      this.asleep = true
      cam.fadeIn(3500, 0, 0, 0)
      const bow = this.bells[0]
      this.time.delayedCall(4500, () => {
        if (bow) {
          this.ring(bow, 0.35)
          cam.stopFollow(); cam.pan(bow.h.x, cam.midPoint.y, 1800, 'Sine.easeInOut')
          this.tweens.add({ targets: bow.spirit, y: bow.y - 14, duration: 220, yoyo: true, repeat: 5 })
          this.time.delayedCall(2600, () => { cam.pan(P.x, cam.midPoint.y, 1400, 'Sine.easeInOut'); this.time.delayedCall(1500, () => this.hint(true)) })
        } else this.hint(true)
      })
    }

    hint(on) { const el = document.getElementById('hint'); if (el) el.style.opacity = on ? 1 : 0 }

    wake0(instant) {
      const P = this.player
      this.asleep = false; this.hint(false)
      store.set('woke', today)
      this.sleeper.setTexture('quilt')
      if (this.zz) { this.tweens.killTweensOf(this.zz); this.zz.destroy(); this.zz = null }
      const stand = () => { P.setVisible(true).setY(FLOOR[0]).setX(W.mastX - 80); this.follow() }
      if (instant) { stand(); return }
      // out of the hammock: a hop up and down onto the deck
      P.setVisible(true).setTexture('player_side').setFlipX(true)
      this.tweens.add({ targets: P, y: 520, duration: 260, ease: 'Quad.easeOut', yoyo: false })
      this.tweens.add({ targets: P, x: W.mastX - 80, duration: 700, delay: 120, ease: 'Sine.easeInOut' })
      this.tweens.add({ targets: P, y: FLOOR[0], duration: 440, delay: 260, ease: 'Bounce.easeOut', onComplete: () => {
        this.follow()
        const bow = this.bells.find(b => !b.quiet)
        if (bow) this.walkTo(bow, () => this.knock(bow))
      } })
    }

    // ---------- moving about ----------
    tap(p) {
      audioOn()
      if (this.letterOpen) return
      if (this.asleep) { this.wake0(false); return }
      const wx = p.worldX, wy = p.worldY - this.ship.y
      const hit = this.houses.find(r => Math.abs(wx - r.h.x) < 78 && wy < r.y + 6 && wy > r.y - 230)
      if (hit) return this.walkTo(hit, () => this.knock(hit))
      if (Math.abs(wx - this.lecternX) < 40 && wy > FLOOR[0] - 120 && wy < FLOOR[0] + 10) return this.goto(this.lecternX + 40, 0, () => this.shipLog())
      if (Math.abs(wx - W.wheelhouseX) < 150 && wy > FLOOR[1] + 12 && wy < FLOOR[0]) return this.goto(W.wheelhouseX - 60, 0, () => this.chart())
      if (Math.abs(wx - W.everdoorX) < 70 && wy > FLOOR[0] - 240) return this.goto(W.everdoorX + 70, 0, () => this.say(this.player, 'The Everdoor. Strands that finish walk through here.'))
      const tier = wy < FLOOR[1] + 20 && wx > this.gallery[0] && wx < this.gallery[1] ? 1 : 0
      this.goto(wx, tier)
    }

    walkTo(rec, then) { this.goto(rec.h.x + 34, rec.h.tier, then) }

    goto(x, tier, then) {
      const lo = tier ? this.gallery[0] + 10 : 40, hi = tier ? this.gallery[1] - 10 : W.width - 140
      x = Phaser.Math.Clamp(x, lo, hi)
      this.path = []
      if (tier !== this.tier) {
        const from = this.player.x, lad = this.ladders.reduce((a, b) => Math.abs(b - from) + Math.abs(b - x) < Math.abs(a - from) + Math.abs(a - x) ? b : a)
        this.path.push({ x: lad }, { climb: tier })
      }
      this.path.push({ x })
      this.onArrive = then || null
      this.nextLeg()
    }

    nextLeg() {
      const P = this.player, leg = this.path.shift()
      if (this.leg) this.leg.stop()
      if (!leg) { P.stop(); P.setTexture('player_side'); const f = this.onArrive; this.onArrive = null; if (f) f(); return }
      if ('climb' in leg) {
        P.stop(); P.setTexture('player_back'); P.setFlipX(false)
        this.leg = this.tweens.add({ targets: P, y: FLOOR[leg.climb], duration: 900, ease: 'Sine.easeInOut', onComplete: () => { this.tier = leg.climb; this.nextLeg() } })
        return
      }
      const d = Math.abs(leg.x - P.x)
      if (d < 4) return this.nextLeg()
      P.setFlipX(leg.x > P.x); P.play('walk', true)
      this.leg = this.tweens.add({ targets: P, x: leg.x, duration: d / SPEED * 1000, onComplete: () => this.nextLeg() })
    }

    // ---------- the world answering ----------
    say(who, text, ms = 4200) {
      if (this.bubble) this.bubble.destroy()
      const t = this.add.text(0, 0, text, { fontFamily: 'Fredoka, system-ui, sans-serif', fontSize: '19px', color: '#2b2030', wordWrap: { width: 300 }, align: 'center', lineSpacing: 2 }).setOrigin(0.5, 1)
      const bw = t.width + 28, bh = t.height + 20
      const g = this.add.graphics().fillStyle(0xfffaf0).lineStyle(3, 0x3b2a3f)
      g.fillRoundedRect(-bw / 2, -bh - 12, bw, bh, 14).strokeRoundedRect(-bw / 2, -bh - 12, bw, bh, 14)
      g.fillTriangle(-10, -13, 10, -13, 0, 2).lineBetween(-10, -12, 0, 2).lineBetween(10, -12, 0, 2)
      t.setPosition(0, -22)
      const top = who.getBounds ? who.getBounds().top - this.ship.y : who.y - 120
      const b = this.bubble = this.add.container(who.x, top - 6, [g, t]).setDepth(50).setScale(0.6).setAlpha(0)
      this.ship.add(b)
      this.tweens.add({ targets: b, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' })
      this.time.delayedCall(ms, () => { if (this.bubble === b) this.tweens.add({ targets: b, alpha: 0, duration: 300, onComplete: () => b.destroy() }) })
    }

    knock(rec) {
      const h = rec.h, who = rec.spirit || this.player
      if (h.look === 'bell' && !rec.quiet) {
        this.say(who, 'A letter came for you.', 1800)
        this.time.delayedCall(1500, () => this.openLetter(rec))
        return
      }
      const lead = { bell: '', scaffold: 'We\'re building. ', lit: '', vines: 'Mm... still resting. ' }[h.look] || ''
      if (h.look === 'scaffold' || h.look === 'lit') {
        const mate = this.crew.find(c => c.m.home === h.strand)
        return this.say(mate ? mate.ct.list[0] && mate.ct : this.player, lead + h.line, 6000)
      }
      this.say(who, lead + h.line, 6000)
    }

    ring(rec, vol) {
      if (!rec.bell) return
      this.tweens.add({ targets: rec.bell, angle: { from: -24, to: 24 }, duration: 260, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', onComplete: () => rec.bell.setAngle(0) })
      const cam = this.cameras.main
      if (Math.abs(rec.h.x - cam.midPoint.x) < cam.width / cam.zoom) bellSound(vol)
    }

    openLetter(rec) {
      const el = this.letter, h = rec.h
      el.querySelector('.who').textContent = h.strand.replace(/-/g, ' ')
      el.querySelector('.body').textContent = h.line
      const scrim = document.getElementById('scrim')
      el.classList.add('open'); scrim.classList.add('open'); this.letterOpen = true
      const close = tend => {
        el.classList.remove('open'); scrim.classList.remove('open'); this.letterOpen = false
        el.querySelector('.seal.red').onclick = el.querySelector('.seal.blue').onclick = null
        if (tend) this.tend(rec, false)
      }
      el.querySelector('.seal.red').onclick = e => { e.stopPropagation(); close(true) }
      el.querySelector('.seal.blue').onclick = e => { e.stopPropagation(); close(false); this.say(rec.spirit, 'I\'ll keep it by the door.') }
    }

    /** Pressing the red seal: the bell goes quiet, the window lights, a crew member walks over with tools, the sail
     * fills and the island ahead comes a little closer. Kept on this phone for today only; the board stays the record. */
    tend(rec, quiet) {
      rec.quiet = true
      rec.img.setTexture(rec.keyLit)
      if (rec.glow) rec.glow.setVisible(false)
      if (rec.bell) rec.bell.setAlpha(0.6)
      this.ship.add(this.add.image(rec.h.x - 31, rec.y - 106, 'dot').setScale(4).setAlpha(0.4))
      if (quiet) return
      tended.add(rec.h.strand); store.set('tended.' + today, [...tended])
      this.say(rec.spirit, 'Thank you.', 2000)
      const mate = this.crew[Math.floor(rand() * this.crew.length)]
      if (mate) { mate.busy = true; this.tweens.killTweensOf(mate.ct); this.walkMate(mate, rec.h.x - 30, Math.abs(mate.ct.x - rec.h.x) / 0.22, () => { mate.busy = false; this.crewTrip(mate) }) }
      this.tweens.add({ targets: this.sail, scaleX: 1.04, duration: 900, yoyo: true, hold: 2400, ease: 'Sine.easeOut' })
      store.set('closer', store.get('closer', 0) + 1)
      if (this.here) this.tweens.add({ targets: this.here, scale: this.here.scale * 1.05, duration: 2500 })
      // the camera pulls back to show the whole boat
      const cam = this.cameras.main, z = this.baseZoom
      this.time.delayedCall(1200, () => {
        cam.stopFollow()
        cam.pan(W.width / 2, cam.midPoint.y, 1600, 'Sine.easeInOut')
        cam.zoomTo(Math.max(0.12, this.scale.width / (W.width + 300)), 1600, 'Sine.easeInOut')
        this.time.delayedCall(5200, () => {
          cam.zoomTo(z, 1400, 'Sine.easeInOut'); cam.pan(this.player.x, cam.midPoint.y, 1400, 'Sine.easeInOut')
          this.time.delayedCall(1450, () => this.follow())
        })
      })
    }

    paper(id) {
      const el = document.getElementById(id), scrim = document.getElementById('scrim')
      el.classList.add('open'); scrim.classList.add('open'); this.letterOpen = true
      el.onclick = scrim.onclick = () => { el.classList.remove('open'); scrim.classList.remove('open'); this.letterOpen = false }
    }

    chart() { this.paper('chart') }

    /** The ship's log: the week on board from the record, then what you tended on this phone today. */
    shipLog() {
      const mine = [...tended].map(s => 'Today, you tended ' + s.replace(/-/g, ' ') + '.')
      const lines = [...mine, ...W.log]
      if (!lines.length) lines.push('A quiet week. Nothing to write.')
      document.querySelector('#log .body').innerHTML = lines.map(l => '<span>' + l.replace(/[<&]/g, c => c === '<' ? '&lt;' : '&amp;') + '</span>').join('')
      this.paper('log')
    }

    /** A mate fetches a crate from the stack by the mast and carries it home, then works there a while (hammering
     * at a scaffold, or a stretch), so the walk cycle plays only while they move. */
    crewTrip(mate) {
      if (mate.busy) return
      const goOut = Math.abs(mate.ct.x - mate.home) < 10
      const to = goOut ? mate.stack : mate.home
      mate.crate.setVisible(!goOut)
      const d = Math.abs(to - mate.ct.x)
      this.walkMate(mate, to, d / mate.speed + 200, () => {
        if (!goOut) this.work(mate)
        this.time.delayedCall((goOut ? 900 : 5000) + rand() * 5000, () => this.crewTrip(mate))
      })
    }

    walkMate(mate, to, ms, then) {
      mate.body.setFlipX(to > mate.ct.x); mate.body.play({ key: 'walk' + mate.coat, startFrame: mate.i % 4 }, true)
      this.tweens.add({ targets: mate.ct, x: to, duration: ms, ease: 'Linear', onComplete: () => { mate.body.stop(); mate.body.setTexture(`coat${mate.coat}-player_t0`); if (then) then() } })
    }

    work(mate) {
      const h = this.houses.find(r => r.h.strand === mate.m.home)
      if (h && h.h.look === 'scaffold') { // hammer: lean in and tap, three times
        mate.body.setFlipX(h.h.x > mate.ct.x)
        this.tweens.add({ targets: mate.body, angle: { from: 0, to: mate.body.flipX ? 9 : -9 }, duration: 180, yoyo: true, repeat: 5, ease: 'Quad.easeIn' })
      } else this.tweens.add({ targets: mate.body, scaleY: mate.body.scaleY * 1.04, duration: 700, yoyo: true, ease: 'Sine.easeInOut' }) // a stretch
    }

    walkThrough() {
      const strand = this.doneQueue[0]
      const s = this.add.image(W.everdoorX + 160, FLOOR[0], 'spirits', spiritOf(strand)).setOrigin(0.5, 1).setScale(1.45).setFlipX(true).setTint(0xf3ecff).setAlpha(0)
      this.ship.add(s)
      this.tweens.add({ targets: s, alpha: 0.9, duration: 600 })
      this.tweens.add({ targets: s, x: W.everdoorX, duration: 4200, delay: 400, onComplete: () => this.tweens.add({ targets: s, alpha: 0, scale: 0.3, y: FLOOR[0] - 40, duration: 900, onComplete: () => s.destroy() }) })
      const cam = this.cameras.main
      if (Math.abs(W.everdoorX - cam.midPoint.x) < cam.width / cam.zoom) this.time.delayedCall(800, () => this.say(s, strand.replace(/-/g, ' ') + ' is done. Goodbye.', 2600))
      this.doneQueue.push(this.doneQueue.shift())
    }

    update(t, dt) {
      this.ship.y = Math.sin(t / 1400) * 3
      this.waves.tilePositionX += dt * 0.02; this.wake.tilePositionX += dt * 0.12
            for (const c of this.clouds) { c.x += dt * 0.004; if (c.x > 4000) c.x = -300 }
      if (this.asleep || this.letterOpen) return
      const k = this.keys, P = this.player
      const left = k.LEFT.isDown || k.A.isDown, right = k.RIGHT.isDown || k.D.isDown
      if (left || right) {
        this.path = []; this.onArrive = null; if (this.leg) this.leg.stop()
        const lo = this.tier ? this.gallery[0] + 10 : 40, hi = this.tier ? this.gallery[1] - 10 : W.width - 140
        P.x = Phaser.Math.Clamp(P.x + (right ? 1 : -1) * SPEED * dt / 1000, lo, hi)
        P.setFlipX(right); P.play('walk', true)
      } else if (!this.leg || !this.leg.isPlaying()) { if (P.anims.isPlaying) { P.stop(); P.setTexture('player_side') } }
      const lad = this.ladders.find(x => Math.abs(x - P.x) < 24)
      if (lad != null && !(this.leg && this.leg.isPlaying())) {
        if ((k.UP.isDown || k.W.isDown) && this.tier === 0) { this.path = [{ x: lad }, { climb: 1 }]; this.nextLeg() }
        if ((k.DOWN.isDown || k.S.isDown) && this.tier === 1) { this.path = [{ x: lad }, { climb: 0 }]; this.nextLeg() }
      }
      if (Phaser.Input.Keyboard.JustDown(k.SPACE) || Phaser.Input.Keyboard.JustDown(k.E)) {
        const near = this.houses.filter(r => r.h.tier === this.tier).sort((a, b) => Math.abs(a.h.x - P.x) - Math.abs(b.h.x - P.x))[0]
        if (near && Math.abs(near.h.x - P.x) < 110) this.knock(near)
      }
    }
  }

  // ---------- in-world paper: the letter and the sea chart ----------
  const css = document.createElement('style')
  css.textContent = `
  .scrim{position:fixed;inset:0;background:rgba(11,16,38,.5);opacity:0;pointer-events:none;transition:opacity .35s;z-index:9}
  .scrim.open{opacity:1;pointer-events:auto}
  .paper{position:fixed;left:50%;top:50%;transform:translate(-50%,-46%) rotate(-1.5deg) scale(.85);opacity:0;pointer-events:none;
    transition:opacity .35s,transform .45s cubic-bezier(.2,1.4,.4,1);width:min(86vw,420px);padding:24px 26px 18px;box-sizing:border-box;
    background:#fbf1dc;background-image:repeating-linear-gradient(transparent 0 33px,rgba(120,90,60,.12) 33px 34px);
    border-radius:6px;box-shadow:0 18px 50px rgba(0,0,0,.45),inset 0 0 40px rgba(170,120,60,.25);color:#3b2a3f;
    font-family:Caveat,cursive;z-index:10}
  .paper.open{opacity:1;pointer-events:auto;transform:translate(-50%,-50%) rotate(-1.5deg) scale(1)}
  .paper .who{font-size:30px;font-weight:700;margin:0 0 4px;text-transform:capitalize}
  .paper .body{font-size:25px;line-height:34px;margin:0}
  .paper .sign{font-size:22px;text-align:right;margin:10px 0 18px}
  .seals{display:flex;justify-content:space-around}
  .seal{width:60px;height:60px;border-radius:50%;border:0;cursor:pointer;font:700 17px Caveat,cursive;color:#fff6e6;
    box-shadow:inset 0 -6px 0 rgba(0,0,0,.25),0 4px 10px rgba(0,0,0,.3);transition:transform .15s}
  .seal:active{transform:scale(.9)} .seal.red{background:radial-gradient(circle at 40% 35%,#e0645a,#a3302a)}
  .seal.blue{background:radial-gradient(circle at 40% 35%,#6a8fd0,#34508a)}
  #log .body span{display:block} #log{max-height:80vh;overflow:auto}
  #chart{width:min(92vw,560px)} #chart svg{width:100%;height:auto;display:block}
  #hint{position:fixed;left:50%;bottom:12%;transform:translateX(-50%);font:700 28px Caveat,cursive;color:#fff6e6;opacity:0;
    transition:opacity .8s;text-shadow:0 2px 8px rgba(0,0,0,.6);pointer-events:none;z-index:9}
  #hint:before{content:'';display:block;margin:0 auto 8px;width:34px;height:34px;border-radius:50%;border:3px solid #fff6e6;animation:ring 1.4s infinite}
  @keyframes ring{0%{transform:scale(.7);opacity:1}100%{transform:scale(1.6);opacity:0}}`
  document.head.appendChild(css)
  const isles = W.islands.map((g, i) => {
    const x = 40 + i * 78, y = 150 + Math.sin(i * 1.7) * 40
    const fill = g.state === 'passed' ? '#9fd3a4' : g.state === 'here' ? '#e9c45a' : '#c9b89a'
    return `<g><ellipse cx="${x}" cy="${y}" rx="26" ry="14" fill="${fill}" stroke="#3b2a3f" stroke-width="2.5"/>`
      + (g.state === 'here' ? `<path d="M${x - 9} ${y - 30} l9 -16 l9 16 z" fill="#d0453a" stroke="#3b2a3f" stroke-width="2"/><line x1="${x}" y1="${y - 30}" x2="${x}" y2="${y - 6}" stroke="#3b2a3f" stroke-width="2.5"/>` : '')
      + `<text x="${x}" y="${y + 36}" text-anchor="middle" font-family="Caveat" font-size="17" fill="#3b2a3f">${g.stage}</text></g>`
  }).join('')
  const route = W.islands.map((_, i) => `${40 + i * 78},${150 + Math.sin(i * 1.7) * 40}`).join(' ')
  document.body.insertAdjacentHTML('beforeend', `
  <div id="letter" class="paper" role="dialog" aria-label="A letter"><p class="who"></p><p class="body"></p>
    <p class="sign">waiting by your door</p>
    <div class="seals"><button class="seal red" aria-label="Tend it">tend it</button><button class="seal blue" aria-label="Let it wait">let it wait</button></div></div>
  <div id="chart" class="paper" role="dialog" aria-label="The sea chart"><p class="who">The way to Chapter 1</p>
    <svg viewBox="0 0 560 230"><polyline points="${route}" fill="none" stroke="#7a5a40" stroke-width="2.5" stroke-dasharray="6 7"/>${isles}</svg>
    <p class="sign">tap to roll it up</p></div>
  <div id="log" class="paper" role="dialog" aria-label="The ship's log"><p class="who">The ship's log</p><p class="body"></p>
    <p class="sign">tap to close the book</p></div>
  <div id="scrim" class="scrim"></div>
  <div id="hint">tap to wake</div>`)

  window.studioBoat = new Phaser.Game({
    type: Phaser.AUTO, parent: 'game', backgroundColor: '#000000',
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
    render: { antialias: true, roundPixels: false }, scene: Boat,
  })
})()
