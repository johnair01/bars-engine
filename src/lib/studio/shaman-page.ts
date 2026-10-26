/** The Shaman's loop page (/board/studio?shaman=1): the Gourd Star's eight rooms on one canvas (public/studio/
 * altitude.js, AltR9.shamanFrame), driven by the ShamanWorld (shaman.ts). The player is the Shaman: tap a room and the
 * Shaman walks there along the ring, does the room's verb, and only then the waiting row opens as a card over the
 * room, in the Council Board's card language. A seal or a steer is the board's own save (POST /api/board/saves); the
 * card then folds into an ember on the room, which brightens once the board pull has recorded the save on main. The
 * cards are the only words; nothing in the scene is text, a number or a panel.
 * URL: &demo=1 plays the demo world (nothing is saved); &room=<stage> opens at that room with its card open; &hold=1
 * freezes the frame (&t=seconds of scene time, &idle=seconds the clock has waited); &phone=1 lays it out at 390 x 844. */
import { ALTITUDE_JS } from './page'
import { demoShaman, type ShamanWorld } from './shaman'

const esc = (o: unknown) => JSON.stringify(o).replace(/</g, '\\u003c')

export function shamanPage(world: ShamanWorld): string {
  const demo = demoShaman(new Date(world.at))
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
<script>window.SHAMAN=${esc(world)};window.SHAMAN_DEMO=${esc(demo)};</script>
<script src="${ALTITUDE_JS}"></script>
<script>
;(function () {
  const q = new URLSearchParams(location.search), A = window.AltR9, demo = q.get('demo') === '1'
  const world = demo ? window.SHAMAN_DEMO : window.SHAMAN
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
  // ---- the loop: run (seeds rise, the porter carries them), then the clock waits while any room waits ----
  let phase = 'run', runT = 0, idle = 0, T = +(q.get('t') || 0)
  const sh = { a: 6.5, out: 0, walk: false, kneel: 0 }
  let target = null, verbF = 0, view = null // view: the open card
  const anyWaiting = function () { return rooms().some(function (r) { return r.waiting.length }) }
  function settle() { phase = anyWaiting() ? 'wait' : 'rest'; idle = 0 }
  const roomQ = q.get('room')
  if (hold) { runT = 99; settle(); idle = +(q.get('idle') || 0) }
  if (roomQ && STAGES.indexOf(roomQ) >= 0) { runT = 99; sh.a = STAGES.indexOf(roomQ); sh.out = 1; target = roomQ }
  function frame() {
    const rs = rooms(), f = focus(rs)
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    A.shamanFrame(g, W, H, { phone: isPhone(), t: T, runT: runT, rooms: rs, focus: f, shaman: sh,
      verb: phase === 'verb' && target ? { stage: target, f: verbF } : null,
      embers: embers.map(function (e) { return { id: e.id, stage: e.stage, bright: recorded(e) } }),
      hint: phase === 'wait' && !view && f ? { stage: f, idle: idle } : null })
  }
  function walkTo(stage) {
    closeCard(true); target = stage; phase = 'walk'; idle = 0
  }
  function step(dt) {
    T += dt
    if (phase === 'run') { runT += dt; if (runT >= 12) settle() }
    else if (phase === 'wait') idle += dt
    else if (phase === 'walk') {
      const ti = STAGES.indexOf(target)
      let d = ti - sh.a; d = ((d % 8) + 12) % 8 - 4 // the short way round the ring
      if (Math.abs(d) < 0.02 && sh.out >= 1) { sh.walk = false; phase = 'verb'; verbF = 0; return }
      sh.walk = true
      if (Math.abs(d) >= 0.02) {
        if (sh.out > 0) sh.out = Math.max(0, sh.out - dt / 0.3)
        else { const m = Math.sign(d) * Math.min(Math.abs(d), dt * 1.9); sh.a = ((sh.a + m) % 8 + 8) % 8 }
      } else { sh.a = ti; sh.out = Math.min(1, sh.out + dt / 0.35) }
    } else if (phase === 'verb') {
      verbF += dt / 1.2; sh.kneel = Math.sin(Math.min(1, verbF) * Math.PI)
      if (verbF >= 1) { sh.kneel = 0; openRoom(target) }
    }
  }
  let last = performance.now()
  function tick(now) { const dt = Math.min(0.1, (now - last) / 1000); last = now; step(dt); frame(); requestAnimationFrame(tick) }
  // ---- cards, in the board's card language ----
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e }
  function place(stage) {
    const sheet = isPhone()
    card.classList.toggle('sheet', sheet)
    if (sheet) { card.style.left = ''; card.style.top = ''; return }
    const r = cv.getBoundingClientRect(), p = (stage && A.shamanPoint(stage)) || [W / 2, H / 2]
    const cw = card.offsetWidth, ch = card.offsetHeight
    let x = r.left + p[0] - cw / 2, y = r.top + p[1] - ch - 14
    if (y < 12) y = r.top + p[1] + 40
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
  function give(x, stage, o, steer, err, busy) {
    const now = new Date().toISOString(), body = saveOf(x, o, steer, now)
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
  function openEmber(id) {
    const e = embers.find(function (x) { return x.id === id }); if (!e) return
    view = { kind: 'ember', e: e }; render()
  }
  cv.addEventListener('pointerdown', function (ev) {
    const r = cv.getBoundingClientRect(), hit = A.shamanHit(ev.clientX - r.left, ev.clientY - r.top)
    if (!hit) { if (view) closeCard(); return }
    if (hit.ember) { if (phase === 'walk' || phase === 'verb') return; closeCard(true); openEmber(hit.ember); return }
    if (phase === 'walk' || phase === 'verb') return
    if (hold) { closeCard(true); target = hit.room; sh.a = STAGES.indexOf(hit.room); sh.out = 1; openRoom(hit.room); return }
    walkTo(hit.room)
  })
  addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCard() })
  addEventListener('resize', function () { size(); frame(); if (view) place(view.stage || (view.e && view.e.stage)) })
  window.__state = function () { return { mode: 'shaman', phase: phase, room: target, card: view ? (view.kind === 'ember' ? 'ember:' + view.e.id : (view.rows[view.i] || { id: 'room:' + view.stage }).id) : null } }
  frame()
  if (roomQ && target) openRoom(target)
  document.title = 'done'
  if (!hold) requestAnimationFrame(function (n) { last = n; tick(n) })
})()
</script>
</body></html>`
}
