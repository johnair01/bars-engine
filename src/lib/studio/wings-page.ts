/** The Wings page (/board/studio?wings=1): a hall of doors, one per strand, each a deck of finished crates. A door opens
 * its room as a deck (one crate, Keep / Steer / Compost); "Binder" lays the same room's crates as a two-page spread and
 * a tap on a crate jumps back to the deck at that crate. Each move is the Stores' own save (POST /api/board/saves,
 * collection `stores`, run `gallery`). &demo=1 saves nothing. No count is shown anywhere. */
import type { WingsWorld } from './wings'

const esc = (o: unknown) => JSON.stringify(o).replace(/</g, '\\u003c')

export function wingsPage(world: WingsWorld): string {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#24205a">
<title>The Wings</title>
<style>
:root{--night:#24205a;--paper:#fbf3e2;--ink:#2c2450;--ink-soft:#5c5478;--edge:rgba(44,36,80,.55);--seal:#d8509f;--glow:#f3d9a4}
*{box-sizing:border-box}
html,body{margin:0;min-height:100%;background:var(--night);overscroll-behavior:none}
body{font-family:Georgia,'Iowan Old Style','Palatino Linotype',serif;color:var(--paper);-webkit-tap-highlight-color:transparent;padding:max(18px,env(safe-area-inset-top)) 16px max(20px,env(safe-area-inset-bottom))}
h1{font-size:22px;margin:4px 0 4px;font-weight:700}
.sub{margin:0 0 18px;color:var(--glow);font-size:15px;line-height:1.45}
button{font:inherit;font-size:15px;color:var(--paper);background:var(--seal);border:0;border-radius:999px;padding:9px 18px;min-height:44px;cursor:pointer}
button.soft{background:transparent;color:var(--paper);border:1.5px solid rgba(251,243,226,.5)}
button:focus-visible,.door:focus-visible,.pocket:focus-visible{outline:2px solid var(--glow);outline-offset:3px}
.hall{display:flex;gap:14px;overflow-x:auto;padding:4px 2px 18px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
.door{flex:0 0 min(72vw,260px);scroll-snap-align:start;background:var(--paper);color:var(--ink);border:1.5px solid var(--edge);border-radius:130px 130px 14px 14px;padding:26px 18px 16px;text-align:center;cursor:pointer;font:inherit}
.door .fan{position:relative;height:150px;margin:0 auto 12px;width:150px}
.door .fan img{position:absolute;top:10px;width:96px;height:120px;object-fit:cover;border-radius:7px;border:1px solid var(--edge);background:#c9b49a;box-shadow:0 4px 10px rgba(10,8,40,.3)}
.door .fan img:nth-child(1){left:2px;transform:rotate(-9deg)}
.door .fan img:nth-child(2){left:26px;transform:rotate(-1deg)}
.door .fan img:nth-child(3){left:50px;transform:rotate(8deg)}
.door b{display:block;font-size:18px}
.door span{display:block;font-size:14px;color:var(--ink-soft);margin-top:3px}
.room{display:none}
body.in-room .hall,body.in-room .intro{display:none}
body.in-room .room{display:block}
.bar{display:flex;gap:8px;align-items:center;margin-bottom:12px}
.bar h2{flex:1;margin:0;font-size:18px}
.paper{background:var(--paper);color:var(--ink);border:1.5px solid var(--edge);border-radius:14px;padding:12px 14px 14px;box-shadow:0 10px 30px rgba(10,8,40,.45)}
.paper img.big{display:block;width:100%;max-height:52vh;object-fit:contain;border-radius:9px;border:1px solid var(--edge);background:#c9b49a}
.paper h3{margin:10px 0 2px;font-size:17px}
.paper p{margin:0;font-size:14px;color:var(--ink-soft);line-height:1.4}
.verbs{display:flex;gap:8px;margin-top:12px}
.verbs button{flex:1;padding:9px 6px}
.verbs button.soft{color:var(--ink);border-color:var(--edge)}
.spread{display:flex;gap:2px;background:var(--paper);border:1.5px solid var(--edge);border-radius:14px;padding:12px;box-shadow:0 10px 30px rgba(10,8,40,.45)}
.spread .pocket{flex:1;min-width:0;background:none;border:0;padding:0;color:var(--ink);text-align:left;cursor:pointer;border-radius:9px}
.spread .pocket+.pocket{border-left:2px solid var(--edge);padding-left:10px;margin-left:8px}
.spread img{display:block;width:100%;height:34vh;object-fit:cover;border-radius:7px;border:1px solid var(--edge);background:#c9b49a}
.spread small{display:block;margin-top:6px;font-size:13px;color:var(--ink-soft);line-height:1.3}
.spread .empty{flex:1;border:1.5px dashed var(--edge);border-radius:9px;min-height:34vh}
.flip{display:flex;gap:8px;justify-content:space-between;margin-top:12px}
.say{margin-top:12px;color:var(--glow);font-size:15px;line-height:1.45;min-height:22px}
[hidden]{display:none!important}
@media (min-width:760px){body{max-width:640px;margin:0 auto}.door{flex-basis:260px}}
</style></head><body>
<div class="intro"><h1>The Wings</h1><p class="sub">${world.demo ? 'A practice walk. Nothing you do here is saved. ' : ''}Each door is a strand of the work. Open one and its finished things come one at a time.</p></div>
<div class="hall" id="hall"></div>
<div class="room" id="room">
  <div class="bar"><button class="soft" id="back">Done for now</button><h2 id="rname"></h2><button class="soft" id="mode">Binder</button></div>
  <div id="deck" class="paper"><img class="big" id="dImg" alt=""><h3 id="dT"></h3><p id="dP"></p>
    <div class="verbs"><button id="vKeep">Keep</button><button id="vSteer">Steer</button><button id="vCompost" class="soft">Compost</button></div></div>
  <div id="binder" hidden><div class="spread" id="spread"></div><div class="flip"><button class="soft" id="prev">Page back</button><button class="soft" id="next">Page on</button></div></div>
  <div class="say" id="say" role="status" aria-live="polite"></div>
</div>
<script>window.WINGS=${esc(world)};</script>
<script>
(function () {
  const W = window.WINGS, $ = function (i) { return document.getElementById(i) }
  let room = null, at = 0, binder = false, page = 0, busy = false
  const hall = $('hall'), say = $('say')
  function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e }
  function drawHall() {
    hall.textContent = ''
    if (!W.rooms.length) { const p = el('p', 'sub', 'Every room is clear. What the next round finishes will wait here.'); hall.appendChild(p); return }
    W.rooms.forEach(function (r) {
      const d = el('button', 'door'), fan = el('div', 'fan')
      d.type = 'button'; d.setAttribute('aria-label', 'Open the ' + r.name + ' room')
      r.crates.slice(0, 3).reverse().forEach(function (c) { const i = el('img'); i.src = c.pic; i.alt = ''; i.loading = 'lazy'; fan.appendChild(i) })
      d.appendChild(fan); d.appendChild(el('b', '', r.name)); d.appendChild(el('span', '', 'Open the deck'))
      d.addEventListener('click', function () { openRoom(r) })
      hall.appendChild(d)
    })
  }
  function openRoom(r) { room = r; at = 0; binder = false; page = 0; say.textContent = ''; $('rname').textContent = r.name; document.body.classList.add('in-room'); window.scrollTo(0, 0); draw() }
  function leave() { room = null; document.body.classList.remove('in-room'); drawHall() }
  function draw() {
    if (!room) return
    if (!room.crates.length) { say.textContent = 'This room is clear.'; $('deck').hidden = true; $('binder').hidden = true; $('mode').hidden = true; return }
    $('mode').hidden = false
    at = Math.min(at, room.crates.length - 1)
    $('deck').hidden = binder; $('binder').hidden = !binder
    $('mode').textContent = binder ? 'Deck' : 'Binder'
    if (binder) return drawBinder()
    const c = room.crates[at]
    $('dImg').src = c.pic; $('dT').textContent = c.title; $('dP').textContent = 'Made in ' + c.round.replace(/^\d{4}-\d\d-\d\d-/, '') + (c.maker ? ', for ' + c.maker : '') + '.'
  }
  function drawBinder() {
    const sp = $('spread'), a = page * 2
    sp.textContent = ''
    ;[a, a + 1].forEach(function (i) {
      const c = room.crates[i]
      if (!c) { sp.appendChild(el('div', 'empty')); return }
      const b = el('button', 'pocket'); b.type = 'button'; b.setAttribute('aria-label', 'Take out ' + c.title)
      const im = el('img'); im.src = c.pic; im.alt = ''; b.appendChild(im); b.appendChild(el('small', '', c.title))
      b.addEventListener('click', function () { at = i; binder = false; draw() })
      sp.appendChild(b)
    })
    $('prev').disabled = page === 0; $('next').disabled = a + 2 >= room.crates.length
  }
  function save(c, where) {
    if (W.demo) return Promise.resolve(true)
    const body = { board: 'council', collection: 'stores', docId: ('gallery~' + c.id).replace(/[\\\\/]/g, '.').slice(0, 200), mode: 'set',
      data: { run: 'gallery', thing: c.id, kind: 'crate', words: c.maker || c.round, to: where, savedAt: new Date().toISOString() } }
    return fetch('/api/board/saves', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.ok ? true : r.text().then(function (t) { say.textContent = 'It did not save (' + r.status + '): ' + t.slice(0, 160); return false }) })
      .catch(function (e) { say.textContent = 'It did not save: ' + e.message; return false })
  }
  function move(where, words) {
    if (!room || busy || !room.crates.length) return
    busy = true; const c = room.crates[at]
    save(c, where).then(function (ok) {
      busy = false; if (!ok) return
      room.crates.splice(at, 1); say.textContent = words; page = Math.min(page, Math.max(0, Math.ceil(room.crates.length / 2) - 1)); draw()
    })
  }
  $('vKeep').addEventListener('click', function () { move('shelf', 'Kept on the shelf.') })
  $('vSteer').addEventListener('click', function () { move('bell', 'Sent up the bell line.') })
  $('vCompost').addEventListener('click', function () { move('compost', 'Let go. Its words are kept.') })
  $('mode').addEventListener('click', function () { binder = !binder; page = Math.floor(at / 2); draw() })
  $('prev').addEventListener('click', function () { if (page > 0) { page--; draw() } })
  $('next').addEventListener('click', function () { if (page * 2 + 2 < room.crates.length) { page++; draw() } })
  $('back').addEventListener('click', function () { W.rooms = W.rooms.filter(function (r) { return r.crates.length }); leave() })
  drawHall()
})()
</script>
</body></html>`
}
