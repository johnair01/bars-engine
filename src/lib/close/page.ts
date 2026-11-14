import { hullsOf } from './safe'
import { renderBoard } from './render'
import { MOVES, type CloseRecord, type Move } from './types'

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const NAMES: Record<Move, string> = { glass: 'The Glass', unpacking: 'The Unpacking', pushback: 'The Pushback', plan: 'The Plan', lever: 'The Lever' }

/** Controls for one move. Every one of them sends the same short reply the chat door takes, so either door can resume the other. */
function controls(r: CloseRecord, move: Move): string {
  const btn = (say: string, label: string, cls = '') => `<button class="b ${cls}" data-say="${esc(say)}">${esc(label)}</button>`
  const out: string[] = []
  if (move === 'glass') {
    out.push('<textarea id="sentence" rows="2" placeholder="Say the day in one sentence"></textarea>', '<button class="b" data-field="sentence">Say it</button>')
    for (const [k, n] of [['p', 'Peace'], ['t', 'Triumph'], ['w', 'Wonder']])
      out.push(`<div class="row"><span>${n}</span>${[1, 2, 3, 4, 5].map(i => btn(`${k}${i}`, String(i))).join('')}</div>`)
    const wins = hullsOf(r).wins
    if (wins.length) out.push('<div class="row"><span>Light a lantern</span></div>', ...wins.map(w => `<div class="row"><span>${esc(w.title)}</span>${[1, 2, 3, 4, 5].map(i => btn(`win ${w.id} ${i}`, String(i))).join('')}</div>`))
  } else if (move === 'unpacking') {
    out.push(...['Peace', 'Triumph', 'Wonder'].map((n, i) => `<textarea class="u" rows="2" placeholder="What would give you ${n} tomorrow?" data-i="${i}">${esc(r.unpacking[i] ?? '')}</textarea>`),
      '<button class="b" data-unpack="1">Keep these three</button>')
  } else if (move === 'pushback') {
    r.picks.forEach((_, i) => out.push(`<div class="row"><span>Pick ${i + 1}</span>${btn(`keep ${i + 1}`, 'Keep')}<input id="why${i}" placeholder="why push back?"><button class="b" data-push="${i + 1}">Push back</button></div>`))
  } else if (move === 'plan') {
    r.picks.forEach((p, i) => { if (p.state === 'kept') out.push(`<div class="row"><span>Pick ${i + 1}</span>${btn(`keep ${i + 1}`, 'Add as ticket')}${btn(`lantern ${i + 1}`, 'The lantern')}</div>`) })
  } else {
    r.plan.tickets.filter(t => t.hull === 'zo' && !r.sent.includes(t.id)).forEach(t => out.push(`<div class="row"><span>${esc(t.title)}</span>${btn(`send ${t.id}`, 'Pull the lever', 'lever')}</div>`))
  }
  out.push(`<div class="row end">${btn('skip', 'Skip this step')}${btn('next', move === 'lever' ? 'Close the day' : 'Next', 'go')}</div>`)
  return out.join('\n')
}

/** The evening close as one page: five moves, the current one open, drawn by the same renderer the chat calls. */
export function closePage(r: CloseRecord, view: Move = r.move, now = new Date()): string {
  const x = renderBoard(r, view, now)
  const tabs = MOVES.map((m, i) => `<a class="t ${m === view ? 'on' : ''} ${m === r.move ? 'now' : ''}" href="?move=${m}">${i + 1}. ${NAMES[m]}</a>`).join('')
  const lines = x.lines.map(l => l.startsWith('- ') ? `<li>${esc(l.slice(2))}</li>` : `<p>${esc(l)}</p>`).join('\n')
  const done = r.status !== 'open' ? `<p class="done">This close is ${r.status}. Tomorrow morning opens on tonight’s lanterns.</p>` : ''
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Close the day</title><style>
:root{--bg:#0e1626;--sea:#16233a;--ink:#e9e4d6;--dim:#9aa6bd;--lamp:#f2b45a;--line:#2a3a58}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(120% 80% at 50% 0%,#1b2b4a 0%,var(--bg) 60%);color:var(--ink);font:17px/1.55 Georgia,serif;min-height:100vh}
main{max-width:640px;margin:0 auto;padding:20px 16px 80px}h1{font-weight:normal;font-size:26px;margin:8px 0 4px}h1:after{content:" ·";color:var(--lamp)}
nav{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0}.t{color:var(--dim);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:5px 12px;font:14px system-ui,sans-serif}
.t.on{color:var(--bg);background:var(--lamp);border-color:var(--lamp)}.t.now:not(.on){border-color:var(--lamp);color:var(--lamp)}
section{background:var(--sea);border:1px solid var(--line);border-radius:14px;padding:6px 18px 14px}p{margin:.6em 0}li{margin:.25em 0 .25em 1.1em;color:var(--dim)}
.row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:10px 0;font:15px system-ui,sans-serif}.row span{flex:1 1 140px}.end{justify-content:flex-end;margin-top:18px}
.b{background:transparent;color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:10px 14px;min-height:44px;min-width:44px;font:15px system-ui,sans-serif;cursor:pointer}
.b:hover,.b:focus-visible{border-color:var(--lamp);outline:none}.go{background:var(--lamp);color:var(--bg);border-color:var(--lamp)}.lever{border-color:var(--lamp);color:var(--lamp)}
textarea,input{width:100%;background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:10px;font:16px Georgia,serif;margin:6px 0}input{width:auto;flex:1 1 160px}
#msg{min-height:1.4em;color:var(--lamp);font:14px system-ui,sans-serif;margin-top:10px}.done{color:var(--lamp)}
</style></head><body><main><h1>Close the day</h1><p style="color:var(--dim);margin:0">${esc(r.date)} · about twenty minutes. Skip any step.</p>
<nav>${tabs}</nav><section><h2 style="font-weight:normal;font-size:20px">${esc(x.title)}</h2>${lines}${done}
${r.status === 'open' ? controls(r, view) : ''}<div id="msg" role="status"></div></section></main>
<script>
const say=async(t)=>{const m=document.getElementById('msg');const r=await fetch(location.pathname,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({say:t,date:${JSON.stringify(r.date)}})});const j=await r.json();if(j.error){m.textContent=j.error;return}location.search='';};
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
if(b.dataset.say)say(b.dataset.say);
else if(b.dataset.field){const v=document.getElementById(b.dataset.field).value.trim();if(v)say(v)}
else if(b.dataset.unpack){say([...document.querySelectorAll('.u')].map(t=>t.value.trim()).filter(Boolean).join('\\n'))}
else if(b.dataset.push){const n=b.dataset.push;const w=document.getElementById('why'+(n-1)).value.trim();say('push '+n+': '+(w||'not this one'))}});
</script></body></html>`
}
