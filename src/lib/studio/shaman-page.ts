/** The Shaman's loop page (/board/studio?shaman=1): the Gourd Star's eight rooms on one canvas (public/studio/
 * altitude.js, AltR9.shamanFrame), driven by the ShamanWorld (shaman.ts). The player is the Shaman: tap a room and the
 * Shaman walks there along the ring and does that room's own verb with his body (VERBS below; the machine answers in
 * altitude.js verbFx), and only then the waiting row opens as a card beside the room, in the Council Board's card
 * language. A seal or a steer is the board's own save (POST /api/board/saves); the card then folds into an ember on the
 * room, which brightens once the board pull has recorded the save on main. When a root blocker holds the Hearth it is
 * cold: tap it and the Shaman walks in off the ring, kneels, breathes once over the coals, and the root's card opens
 * beside the Hearth; "Relight the Hearth: say go ahead" is the board's blocking-gate save, and the Hearth goes to
 * kindling. The cards are the only words; nothing in the scene is text, a number or a panel.
 * URL: &demo=1 plays the demo world (nothing is saved); &hearth=cold (with &demo=1) gives the demo a cold Hearth;
 * &room=<stage|hearth> opens there with its card open; &hold=1 freezes the frame (&t=seconds of scene time, &idle=
 * seconds the clock has waited; &verb=<stage|hearth>&vf=0..1 holds that verb mid-play); &phone=1 lays it out at 390 x 844. */
import { ALTITUDE_JS } from './page'
import { demoShaman, type ShamanWorld } from './shaman'

const esc = (o: unknown) => JSON.stringify(o).replace(/</g, '\\u003c')

export function shamanPage(world: ShamanWorld): string {
  const demo = demoShaman(new Date(world.at)), demoCold = demoShaman(new Date(world.at), { hearth: 'cold' })
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#24205a">
<title>Studio Boat</title>
<style>
html,body{margin:0;height:100%;background:#24205a;overflow:hidden;overscroll-behavior:none}
canvas{display:block;margin:0 auto;touch-action:manipulation;cursor:pointer}
#card{position:fixed;z-index:5;box-sizing:border-box;width:340px;max-width:calc(100vw - 24px);max-height:calc(100vh - 24px);overflow:auto;
  background:#fbf6ea;color:#22201b;font:16px/1.45 Georgia,'Iowan Old Style','Times New Roman',serif;border-radius:6px;padding:16px 18px 14px;
  box-shadow:0 14px 40px rgba(14,10,40,.45),0 0 0 1px rgba(201,154,46,.45);transform-origin:50% 100%;transition:transform .35s ease,opacity .35s ease}
#card[hidden]{display:none}
#card.fold{transform:scale(.05);opacity:0}
#card.sheet{left:0!important;right:0;bottom:0;top:auto!important;width:100%;max-width:none;max-height:62vh;border-radius:14px 14px 0 0;padding:18px 18px calc(16px + env(safe-area-inset-bottom))}
#card .id{font-size:12px;color:#6d675b;letter-spacing:.02em;margin:0 0 6px;word-break:break-all}
#card .title{margin:0 0 8px}
#card .why{font-size:14px;color:#6d675b;margin:0 0 10px}
#card .note{font-size:14px;color:#6d675b;font-style:italic;margin:6px 0 10px}
#card .err{font-size:14px;color:#a3301f;margin:6px 0}
#card .err a{color:#a3301f}
#card .seals{display:flex;flex-wrap:wrap;gap:10px;margin:10px 0 6px}
#card .seal{font:inherit;font-size:15px;color:#fbf6ea;background:radial-gradient(circle at 35% 30%,#c2442f,#a3301f 60%,#7f2214);border:2px solid #c99a2e;
  border-radius:999px;padding:8px 16px;min-height:44px;cursor:pointer;box-shadow:0 2px 0 rgba(90,20,10,.4)}
#card .seal:disabled{opacity:.55;cursor:default}
#card .row{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:8px;flex-wrap:wrap}
#card .quiet{font:inherit;font-size:15px;background:none;border:0;color:#6d675b;padding:8px 2px;min-height:44px;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
#card textarea{box-sizing:border-box;width:100%;min-height:72px;font:inherit;font-size:15px;color:#22201b;background:#fffdf6;border:1px solid #c9bfa6;border-radius:4px;padding:8px;margin-top:6px}
</style>
</head><body>
<canvas id="c" aria-label="The Gourd Star's eight rooms round the Hearth. A charged room waits on the board; tap it and the Shaman goes there."></canvas>
<div id="card" role="dialog" aria-modal="false" hidden></div>
<script>window.SHAMAN=${esc(world)};window.SHAMAN_DEMO=${esc(demo)};window.SHAMAN_DEMO_COLD=${esc(demoCold)};</script>
<script src="${ALTITUDE_JS}"></script>
<script>
;(function () {
  const q = new URLSearchParams(location.search), A = window.AltR9, demo = q.get('demo') === '1'
  const world = demo ? (q.get('hearth') === 'cold' ? window.SHAMAN_DEMO_COLD : window.SHAMAN_DEMO) : window.SHAMAN
  const STAGES = A.SHAMAN_STAGES
  const cv = document.getElementById('c'), g = cv.getContext('2d'), card = document.getElementById('card')
  const phoneQ = q.get('phone') === '1', hold = q.get('hold') === '1'
  let W, H, dpr = Math.min(2, window.devicePixelRatio || 1)
  function size() {
    if (phoneQ) { W = Math.min(390, innerWidth); H = Math.min(844, innerHeight) } else { W = innerWidth; H = innerHeight }
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'
  }
  size()
  const isPhone = function () { return phoneQ || W / H < 0.8 || W < 600 }
  // ---- embers: the moves given here, kept in this browser only (the board store is the record) ----
  const PFX = demo ? 'shaman-ember-demo:' : 'shaman-ember:'
  let embers = []
  function loadEmbers() {
    embers = []
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i); if (!key || key.indexOf(PFX) !== 0) continue
        try { const e = JSON.parse(localStorage.getItem(key)); if (e && e.id && e.stage) embers.push(e) } catch (x) { /* skip */ }
      }
    } catch (x) { embers = [] }
    embers.sort(function (a, b) { return String(a.savedAt).localeCompare(String(b.savedAt)) })
  }
  function keepEmber(e) { embers = embers.filter(function (x) { return x.id !== e.id }).concat([e]); try { localStorage.setItem(PFX + e.id, JSON.stringify(e)) } catch (x) { /* this browser keeps nothing */ } }
  const recorded = function (e) { const at = world.answered && world.answered[e.id]; return !!at && at >= e.savedAt }
  loadEmbers()
  const given = function (id) { return embers.some(function (e) { return e.id === id }) }
  // the rooms as they stand now: a row given here no longer waits
  function rooms() { return world.rooms.map(function (r) { const w = r.waiting.filter(function (x) { return !given(x.id) }); return { stage: r.stage, machine: r.machine, landed: r.landed, waiting: w, total: r.total } }) }
  function focus(rs) {
    for (const wr of [true, false]) {
      let best = null
      rs.forEach(function (r) { const x = r.waiting.filter(function (w) { return !!w.writable === wr })[0]; if (x && (!best || (x.at || '') < best.at)) best = { stage: r.stage, at: x.at || '' } })
      if (best) return best.stage
    }
    return null
  }
  // ---- the Hearth: lit, cold while a root blocker holds it, kindling once he has said go ahead ----
  function hearthNow() {
    const h = world.hearth || { state: 'lit', root: null, queue: [] }, root = h.root
    if (!root) return { state: 'lit', root: null, queue: [], holds: [], bright: false }
    const state = h.state === 'cold' && given(root.id) ? 'kindling' : h.state
    // a cold pull holds every room holding an ember, which only this browser knows
    const holds = root.source === 'pull' ? STAGES.filter(function (st) { return embers.some(function (e) { return e.stage === st }) }) : (root.holds || [])
    return { state: state, root: root, queue: h.queue || [], holds: holds, bright: !!(world.answered && world.answered[root.id]) }
  }
  // ---- each room's verb: what the body does, in figure-local units (feet at 0, head near -22, +x the way he faces) ----
  const REST = { R: [5, -8], L: [-5, -8] }
  const bmp = function (f, a, b) { return f < a || f > b ? 0 : Math.sin((f - a) / (b - a) * Math.PI) }
  const sm = function (x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x) }
  const lp = function (a, b, f) { return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f] }
  const VERBS = {
    intake: { dur: 2.4, pose: function (f) { // raise the right arm, strike once at f 0.3, then stand perfectly still, listening
      const up = sm(f / 0.2), down = sm((f - 0.26) / 0.06), back = sm((f - 0.36) / 0.12)
      let R = lp(REST.R, [6, -31], up); R = lp(R, [11, -19], down); R = lp(R, REST.R, back)
      return { armR: R, armL: REST.L, still: f > 0.3, tilt: 0.28 * sm((f - 0.36) / 0.1) } } },
    spec: { dur: 1.8, pose: function (f) { // both hands up at the cord; they cross twice, tying
      const c = Math.cos(f * Math.PI * 4), y = -25 + 1.5 * Math.sin(f * Math.PI * 8)
      return { armR: [6 + 3 * c, y], armL: [6 - 3 * c, y - 1], lean: 0.06 } } },
    falsify: { dur: 1.8, pose: function (f) { // lean in, crouch a little, hands cupped at the mouth, and breathe
      const br = bmp(f, 0.1, 0.6)
      return { lean: 0.3, crouch: 0.25, armR: [6.5, -19.5 + br], armL: [5, -18.5 + br], bob: 0.6 * br } } },
    plan: { dur: 1.8, pose: function (f) { // arms alternate striking down, three beats, a bob on each
      const hit = function (bt) { return f < bt - 0.12 ? 0 : f < bt ? sm((f - bt + 0.12) / 0.12) : 1 - sm((f - bt) / 0.12) }
      const up = function (h) { return [8, -24 + 13 * h] }
      return { lean: 0.12, armR: up(Math.max(hit(0.2), hit(0.7))), armL: up(hit(0.45)),
               bob: -1.6 * (bmp(f, 0.17, 0.27) + bmp(f, 0.42, 0.52) + bmp(f, 0.67, 0.77)) } } },
    build: { dur: 1.8, pose: function (f) { // sit low, the right arm strokes back and forth
      return { crouch: 0.7, lean: 0.12, armR: [7 + 3.5 * Math.sin(f * Math.PI * 6), -10], armL: [6, -11] } } },
    verify: { dur: 1.8, pose: function (f) { // lean far over, hands on knees
      return { lean: 0.6, crouch: 0.25, armR: [4, -6], armL: [2, -6], still: true } } },
    ship: { dur: 1.8, pose: function (f) { // kneel, both arms push forward and let go
      const push = sm((f - 0.3) / 0.22), go = sm((f - 0.6) / 0.2)
      return { crouch: 0.5, lean: 0.15 + 0.12 * push, armR: lp(lp([4, -14], [13, -11], push), [11, -6], go), armL: lp(lp([3, -13], [12, -10], push), [10, -5], go) } } },
    close: { dur: 1.8, pose: function (f) { // kneel, the right hand presses down at f 0.5
      const press = sm((f - 0.3) / 0.2) * (1 - sm((f - 0.7) / 0.2))
      return { crouch: 0.5, lean: 0.25, armR: lp([6, -14], [9, -1.5], press), armL: [3, -7] } } },
    hearth: { dur: 2.0, pose: function (f) { // kneel at the coals, cup both hands over them, breathe once
      const br = bmp(f, 0.4, 0.85)
      return { crouch: 0.55, lean: 0.3 + 0.08 * br, armR: [9, -9 + br], armL: [8, -8 + br], bob: 0.5 * br, still: true } } },
  }
  // the verb's pose at f, eased in and out of the rest pose
  function poseAt(stage, f) {
    const v = VERBS[stage]; if (!v) return null
    const p = v.pose(f), e = sm(f / 0.12) * sm((1 - f) / 0.12)
    return { lean: (p.lean || 0) * e, crouch: (p.crouch || 0) * e, bob: (p.bob || 0) * e, tilt: (p.tilt || 0) * e, still: !!p.still,
             armR: p.armR ? lp(REST.R, p.armR, e) : REST.R, armL: p.armL ? lp(REST.L, p.armL, e) : REST.L }
  }
  // ---- the loop: run (seeds rise, the porter carries them), then the clock waits while any room waits ----
  let phase = 'run', runT = 0, idle = 0, T = +(q.get('t') || 0)
  const sh = { a: 6.5, out: 0, in: 0, walk: false, kneel: 0, pose: null }
  let target = null, verbF = 0, view = null // view: the open card
  const anyWaiting = function () { return rooms().some(function (r) { return r.waiting.length }) }
  function settle() { phase = anyWaiting() ? 'wait' : 'rest'; idle = 0 }
  const roomQ = q.get('room')
  if (hold) { runT = 99; settle(); idle = +(q.get('idle') || 0) }
  if (roomQ && STAGES.indexOf(roomQ) >= 0) { runT = 99; sh.a = STAGES.indexOf(roomQ); sh.out = 1; target = roomQ }
  if (roomQ === 'hearth' && hearthNow().root) { runT = 99; sh.in = 1; target = 'hearth' }
  const verbQ = q.get('verb')
  if (hold && verbQ && (STAGES.indexOf(verbQ) >= 0 || verbQ === 'hearth')) {
    target = verbQ; phase = 'verb'; verbF = Math.max(0, Math.min(1, +(q.get('vf') || 0.5)))
    if (verbQ === 'hearth') sh.in = 1; else { sh.a = STAGES.indexOf(verbQ); sh.out = 1 }
    sh.pose = poseAt(verbQ, verbF)
  }
  function frame() {
    const rs = rooms(), f = focus(rs), h = hearthNow()
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    A.shamanFrame(g, W, H, { phone: isPhone(), t: T, runT: runT, rooms: rs, focus: f, shaman: sh,
      verb: phase === 'verb' && target ? { stage: target, f: verbF } : null,
      embers: embers.map(function (e) { return { id: e.id, stage: e.stage, bright: recorded(e) } }),
      hint: phase === 'wait' && !view && f ? { stage: f, idle: idle } : null,
      hearth: { state: h.state, holds: h.holds, queue: h.queue.length, bright: h.bright } })
  }
  function walkTo(stage) {
    closeCard(true); target = stage; phase = 'walk'; idle = 0
  }
  function step(dt) {
    T += dt
    if (phase === 'run') { runT += dt; if (runT >= 12) settle() }
    else if (phase === 'wait') idle += dt
    else if (phase === 'walk') {
      if (target === 'hearth') { // out of the room's door, then in off the ring to the Hearth
        sh.walk = true
        if (sh.out > 0) sh.out = Math.max(0, sh.out - dt / 0.3)
        else if (sh.in < 1) sh.in = Math.min(1, sh.in + dt / 0.7)
        else { sh.walk = false; phase = 'verb'; verbF = 0 }
        return
      }
      if (sh.in > 0) { sh.walk = true; sh.in = Math.max(0, sh.in - dt / 0.6); return } // back out to the ring first
      const ti = STAGES.indexOf(target)
      let d = ti - sh.a; d = ((d % 8) + 12) % 8 - 4 // the short way round the ring
      if (Math.abs(d) < 0.02 && sh.out >= 1) { sh.walk = false; phase = 'verb'; verbF = 0; return }
      sh.walk = true
      if (Math.abs(d) >= 0.02) {
        if (sh.out > 0) sh.out = Math.max(0, sh.out - dt / 0.3)
        else { const m = Math.sign(d) * Math.min(Math.abs(d), dt * 1.9); sh.a = ((sh.a + m) % 8 + 8) % 8 }
      } else { sh.a = ti; sh.out = Math.min(1, sh.out + dt / 0.35) }
    } else if (phase === 'verb') { // the body does the room's verb; only then the card opens
      verbF = Math.min(1, verbF + dt / (VERBS[target] ? VERBS[target].dur : 1.8)); sh.pose = poseAt(target, verbF)
      if (verbF >= 1) { sh.pose = null; if (target === 'hearth') openHearth(); else openRoom(target) }
    }
  }
  let last = performance.now()
  function tick(now) { const dt = Math.min(0.1, (now - last) / 1000); last = now; step(dt); frame(); requestAnimationFrame(tick) }
  // ---- cards, in the board's card language ----
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e }
  // a card hangs beside its room, on the outside of the ring and vertically centred on the room (the Hearth's beside
  // the Hearth), never over the ring; on a phone it is a sheet below the chamber
  function place(stage) {
    const sheet = isPhone()
    card.classList.toggle('sheet', sheet)
    if (sheet) { card.style.left = ''; card.style.top = ''; return }
    const r = cv.getBoundingClientRect(), a = (stage && A.shamanAnchor(stage)) || { x: W / 2, y: H / 2, side: 'right' }
    const cw = card.offsetWidth, ch = card.offsetHeight
    let x = a.side === 'right' ? r.left + a.x + 18 : r.left + a.x - cw - 18, y = r.top + a.y - ch / 2
    x = Math.max(12, Math.min(innerWidth - cw - 12, x)); y = Math.max(12, Math.min(innerHeight - ch - 12, y))
    card.style.left = x + 'px'; card.style.top = y + 'px'
  }
  function show(stage) { card.hidden = false; card.classList.remove('fold'); place(stage); if (hold) frame() }
  function closeCard(quick) {
    if (!view) return
    view = null
    if (quick || hold) { card.hidden = true; card.innerHTML = '' } else { card.classList.add('fold'); setTimeout(function () { if (!view) { card.hidden = true; card.innerHTML = '' } }, 360) }
    if (phase === 'card') settle()
    if (hold) frame()
  }
  const STATE = { lit: 'Its work landed this run, and its seed rose to the store.', quiet: 'Nothing waits here, and nothing landed this run.' }
  function openRoom(stage) {
    phase = 'card'
    const r = rooms().find(function (x) { return x.stage === stage })
    view = { kind: 'room', stage: stage, i: 0, rows: r ? r.waiting : [], room: r }
    render()
  }
  function render() {
    card.innerHTML = ''
    const v = view
    if (!v) return
    if (v.kind === 'ember') return renderEmber(v)
    if (v.kind === 'hearth') return renderHearth(v)
    const r = v.room
    if (!v.rows.length) {
      card.appendChild(el('p', 'id', 'the ' + (r ? r.machine : v.stage) + ', ' + v.stage))
      card.appendChild(el('p', 'title', r && r.landed ? STATE.lit : STATE.quiet))
      const row = el('div', 'row'), nt = el('button', 'quiet', 'Close'); nt.onclick = function () { closeCard() }; row.appendChild(nt); card.appendChild(row)
      return show(v.stage)
    }
    const x = v.rows[v.i]
    card.appendChild(el('p', 'id', x.id))
    card.appendChild(el('p', 'title', x.title))
    if (x.why) card.appendChild(el('p', 'why', x.why))
    if (demo) card.appendChild(el('p', 'note', 'demo: nothing is saved'))
    const err = el('p', 'err'); err.hidden = true
    const busy = function (on) { card.querySelectorAll('button,textarea').forEach(function (b) { b.disabled = on }) }
    if (!x.writable) {
      card.appendChild(el('p', 'note', 'This waits on the crew, not on you. It moves when the change lands on main.'))
    } else {
      const seals = el('div', 'seals')
      ;(x.options || []).forEach(function (o) {
        const b = el('button', 'seal', o.label); b.type = 'button'
        b.onclick = function () { give(x, v.stage, o, '', err, busy) }
        seals.appendChild(b)
      })
      card.appendChild(seals)
    }
    card.appendChild(err)
    const row = el('div', 'row'), nt = el('button', 'quiet', 'Not tonight'); nt.type = 'button'; nt.onclick = function () { closeCard() }
    row.appendChild(nt)
    if (x.writable) {
      const se = el('button', 'quiet', 'say something else'); se.type = 'button'
      se.onclick = function () {
        se.remove()
        const ta = el('textarea'); ta.setAttribute('aria-label', 'Say something else')
        const send = el('button', 'seal', 'Send'); send.type = 'button'
        send.onclick = function () { const t = ta.value.trim(); if (t) give(x, v.stage, null, t, err, busy) }
        card.insertBefore(ta, err); card.insertBefore(send, err); ta.focus(); place(v.stage)
      }
      row.appendChild(se)
    }
    if (v.rows.length > 1) { const nx = el('button', 'quiet', 'next'); nx.type = 'button'; nx.onclick = function () { v.i = (v.i + 1) % v.rows.length; render() }; row.appendChild(nx) }
    card.appendChild(row)
    show(v.stage)
  }
  // the board's own save, exactly as the board sends it (src/lib/board/save.ts validateSave)
  function saveOf(x, o, steer, now) {
    if (x.kind === 'question') return { board: 'council', collection: 'questions', docId: x.id, data: o ? { choice: o.id, steer: steer, savedAt: now } : { steer: steer, savedAt: now } }
    if (x.kind === 'position') return { board: 'council', collection: 'positions', docId: x.id, data: o ? { status: o.id, steer: steer, savedAt: now } : { steer: steer, savedAt: now } }
    return { board: 'council', collection: 'steps', docId: x.id, mode: 'update', data: { done: true, doneAt: now, note: o ? 'Yes' : steer, noteAt: now } }
  }
  window.__saveOf = saveOf
  // the Hearth's save: exactly the board's blocking-gate shape (a step handed to Claude, hd-back), plus his note
  function hearthSave(x, text, now) {
    return { board: 'council', collection: 'steps', docId: x.id, mode: 'update',
             data: { note: text, noteAt: now, aiBack: { text: text, automate: false, at: now, from: 'hearth' }, inHand: null } }
  }
  window.__hearthSave = hearthSave
  function give(x, stage, o, steer, err, busy, saveBody) {
    const now = new Date().toISOString(), body = saveBody ? saveBody(now) : saveOf(x, o, steer, now)
    window.__lastSave = body
    const done = function () {
      const e = { id: x.id, stage: stage, kind: x.kind, title: x.title, given: o ? o.label : steer, savedAt: now }
      keepEmber(e); closeCard()
    }
    if (demo) { done(); return }
    busy(true); err.hidden = true
    fetch('/api/board/saves', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) {
        if (r.ok) { done(); return }
        busy(false); err.hidden = false; err.textContent = ''
        if (r.status === 401) {
          err.appendChild(document.createTextNode('Not saved: sign in first, at '))
          const a = el('a', null, 'the sign-in page'); a.href = '/login?returnTo=' + encodeURIComponent('/board/studio?shaman=1'); err.appendChild(a)
          err.appendChild(document.createTextNode('.'))
        } else err.textContent = 'It did not save (' + r.status + '). The card stays open; try again.'
        place(stage)
      })
      .catch(function () { busy(false); err.hidden = false; err.textContent = 'It did not save: the network did not answer. The card stays open; try again.'; place(stage) })
  }
  function renderEmber(v) {
    const e = v.e, on = recorded(e)
    card.appendChild(el('p', 'id', e.id))
    card.appendChild(el('p', 'title', e.title || e.id))
    card.appendChild(el('p', 'why', 'Given: ' + (e.given || '')))
    let when = e.savedAt; try { when = new Date(e.savedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) } catch (x) { /* as saved */ }
    card.appendChild(el('p', 'why', 'When: ' + when))
    card.appendChild(el('p', 'note', on ? 'Recorded on main.' : demo ? 'demo: nothing is saved' : 'Waiting for the board pull, which records it on main within about fifteen minutes.'))
    const row = el('div', 'row'), c = el('button', 'quiet', 'Close'); c.type = 'button'; c.onclick = function () { closeCard() }; row.appendChild(c); card.appendChild(row)
    show(e.stage)
  }
  // the Hearth's card: the root's do, its why, what it holds, and the go-ahead seal when it is his to give
  function openHearth() {
    phase = 'card'
    const h = hearthNow(); if (!h.root) { settle(); return }
    view = { kind: 'hearth', stage: 'hearth', i: 0, rows: [h.root].concat(h.queue) }
    render()
  }
  const MACHINE = {}; world.rooms.forEach(function (r) { MACHINE[r.stage] = r.machine })
  function renderHearth(v) {
    const x = v.rows[v.i], h = hearthNow(), isRoot = v.i === 0
    const holds = isRoot ? h.holds : (x.holds || [])
    card.appendChild(el('p', 'id', x.id))
    card.appendChild(el('p', 'title', x.title))
    if (x.why) card.appendChild(el('p', 'why', x.why))
    if (holds.length) card.appendChild(el('p', 'why', 'holds: ' + holds.map(function (st) { return 'the ' + (MACHINE[st] || st) }).join(', ')))
    if (x.at) { let when = x.at; try { when = new Date(x.at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) } catch (e) { /* as written */ } card.appendChild(el('p', 'why', 'Since: ' + when)) }
    if (demo) card.appendChild(el('p', 'note', 'demo: nothing is saved'))
    const err = el('p', 'err'); err.hidden = true
    const busy = function (on) { card.querySelectorAll('button,textarea').forEach(function (b) { b.disabled = on }) }
    const said = x.kindled || given(x.id)
    if (!x.writable) card.appendChild(el('p', 'note', 'This is not yours to answer: the crew is on it. The Hearth relights when it is fixed.'))
    else if (said) card.appendChild(el('p', 'note', 'You said go ahead. The crew is relighting it; the Hearth is lit again once this is gone from the record.'))
    else {
      const seals = el('div', 'seals'), b = el('button', 'seal', 'Relight the Hearth: say go ahead'); b.type = 'button'
      b.onclick = function () { give(x, 'hearth', null, 'go ahead', err, busy, function (now) { return hearthSave(x, 'go ahead', now) }) }
      seals.appendChild(b); card.appendChild(seals)
    }
    card.appendChild(err)
    const row = el('div', 'row'), nt = el('button', 'quiet', x.writable && !said ? 'Not tonight' : 'Close'); nt.type = 'button'; nt.onclick = function () { closeCard() }
    row.appendChild(nt)
    if (x.writable && !said) {
      const se = el('button', 'quiet', 'say something else'); se.type = 'button'
      se.onclick = function () {
        se.remove()
        const ta = el('textarea'); ta.setAttribute('aria-label', 'Say something else')
        const send = el('button', 'seal', 'Send'); send.type = 'button'
        send.onclick = function () { const t = ta.value.trim(); if (t) give(x, 'hearth', null, t, err, busy, function (now) { return hearthSave(x, t, now) }) }
        card.insertBefore(ta, err); card.insertBefore(send, err); ta.focus(); place('hearth')
      }
      row.appendChild(se)
    }
    if (v.rows.length > 1) { const nx = el('button', 'quiet', 'next'); nx.type = 'button'; nx.onclick = function () { v.i = (v.i + 1) % v.rows.length; render() }; row.appendChild(nx) }
    card.appendChild(row)
    show('hearth')
  }
  function openEmber(id) {
    const e = embers.find(function (x) { return x.id === id }); if (!e) return
    view = { kind: 'ember', e: e }; render()
  }
  cv.addEventListener('pointerdown', function (ev) {
    const r = cv.getBoundingClientRect(), hit = A.shamanHit(ev.clientX - r.left, ev.clientY - r.top)
    if (!hit) { if (view) closeCard(); return }
    if (hit.ember) { if (phase === 'walk' || phase === 'verb') return; closeCard(true); openEmber(hit.ember); return }
    if (phase === 'walk' || phase === 'verb') return
    if (hit.hearth) {
      if (hold) { closeCard(true); target = 'hearth'; sh.out = 0; sh.in = 1; openHearth(); return }
      walkTo('hearth'); return
    }
    if (hold) { closeCard(true); target = hit.room; sh.in = 0; sh.a = STAGES.indexOf(hit.room); sh.out = 1; openRoom(hit.room); return }
    walkTo(hit.room)
  })
  addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCard() })
  addEventListener('resize', function () { size(); frame(); if (view) place(view.stage || (view.e && view.e.stage)) })
  window.__state = function () {
    return { mode: 'shaman', phase: phase, room: target, hearth: hearthNow().state,
             verb: phase === 'verb' && target ? { stage: target, f: verbF } : null,
             card: view ? (view.kind === 'ember' ? 'ember:' + view.e.id : view.kind === 'hearth' ? 'hearth:' + view.rows[view.i].id : (view.rows[view.i] || { id: 'room:' + view.stage }).id) : null }
  }
  frame()
  if (roomQ && target && phase !== 'verb') { if (target === 'hearth') openHearth(); else openRoom(target) }
  document.title = 'done'
  if (!hold) requestAnimationFrame(function (n) { last = n; tick(n) })
})()
</script>
</body></html>`
}
