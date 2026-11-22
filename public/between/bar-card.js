// The BAR card, two sides, one drawing for every surface (board bar-two-sides-look-1, A; spec .specify/specs/bar-two-sides).
// Side 1 is the seal: red brush strokes the player drew, under the word on the front. Side 2 is the moment: the sentence in
// a hand face, then the fields the sentence names. Tap, Enter or Space turns it; with reduced motion it swaps with no flip.
import { cleanSeal, backRows, shortDate } from './bar-card-data.js';

const CSS = `.bc{--bc-red:#c0392b;--bc-brass:#b8914a;--bc-cap:#f6ecdc;--bc-cap2:#c9b49a;position:relative;width:min(70vw,260px);aspect-ratio:5/7;perspective:1000px;margin:0 auto;border:0;padding:0;background:none;color:var(--bc-cap);font:400 14px/1.4 var(--ui-body,system-ui,sans-serif);text-align:left;cursor:pointer}
.bc:focus-visible{outline:3px solid #5fc2ba;outline-offset:4px;border-radius:14px}
.bc-in{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .55s cubic-bezier(.3,.1,.3,1)}
.bc[data-side=back] .bc-in{transform:rotateY(180deg)}
.bc-f{position:absolute;inset:0;border-radius:12px;box-sizing:border-box;padding:34px 18px 16px;background:radial-gradient(120% 70% at 30% 8%,#3a2618 0%,#1b120d 55%,#0d0806 100%);box-shadow:inset 0 0 0 1px rgba(192,86,59,.7),inset 0 0 0 3px var(--bc-red),0 0 22px rgba(192,86,59,.3),0 12px 26px rgba(0,0,0,.5);backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;flex-direction:column}
.bc-b{transform:rotateY(180deg)}
.bc-k{position:absolute;left:12px;top:10px;display:flex;gap:6px;align-items:center;font-weight:700;font-size:12px}
.bc-k i{width:13px;height:13px;border-radius:50%;background:radial-gradient(circle at 36% 30%,#f0a58f,#c0563b 40%,#5a2216)}
.bc-c{position:absolute;width:11px;height:11px;border:2px solid var(--bc-brass)}.bc-c.a{left:6px;top:6px;border-right:0;border-bottom:0}.bc-c.b{right:6px;top:6px;border-left:0;border-bottom:0}.bc-c.c{left:6px;bottom:6px;border-right:0;border-top:0}.bc-c.d{right:6px;bottom:6px;border-left:0;border-top:0}
.bc h3{margin:0;font:400 22px/1.15 var(--ui-display,Georgia,serif);text-align:center}
.bc canvas,.bc svg.bc-seal{display:block;width:100%;flex:1;min-height:0;margin-top:8px;touch-action:none}
.bc-hand{font:500 19px/1.2 Caveat,'Segoe Print','Bradley Hand',cursive;color:#e6c98a;margin:0}
.bc dl{margin:10px 0 0;display:grid;grid-template-columns:76px 1fr;row-gap:6px;font-size:13px}.bc dt{color:var(--bc-cap2)}.bc dd{margin:0}
.bc-foot{display:flex;justify-content:space-between;gap:8px;margin-top:auto;padding-top:8px;font-size:11px;color:var(--bc-cap2)}
@media (prefers-reduced-motion: reduce){.bc-in{transition:none}.bc[data-side=front] .bc-b,.bc[data-side=back] .bc-f{visibility:hidden}}`;
let styled = false;
const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** The seal as SVG: each stroke a round-capped brush line, with a rough edge from a turbulence filter. `strokes` are 0..1. */
export function sealSvg(strokes, id = 'bc') {
  const S = cleanSeal(strokes), d = pts => pts.length === 1 ? `M${pts[0][0] * 100} ${pts[0][1] * 100}h.01` : 'M' + pts.map(p => `${(p[0] * 100).toFixed(1)} ${(p[1] * 100).toFixed(1)}`).join('L');
  return `<svg class="bc-seal" viewBox="0 0 100 100" role="img" aria-label="${S.length ? 'The seal you drew' : 'A plain seal'}"><defs><filter id="${id}-r"><feTurbulence baseFrequency=".9" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter></defs><g filter="url(#${id}-r)" fill="none" stroke="#c0392b" stroke-linecap="round" stroke-linejoin="round" stroke-width="5">${S.length ? S.map(s => `<path d="${d(s)}"/>`).join('') : '<rect x="18" y="18" width="64" height="64" rx="8" stroke-width="6"/>'}</g></svg>`;
}

/** card({ seal, moment: { sentence, at, given }, title }) -> a button that turns over. `seal` is the strokes; none draws a plain seal. */
export function barCard({ seal, moment = {}, title = 'Tonight', id = 'bc' + Math.random().toString(36).slice(2, 6) } = {}) {
  if (!styled && typeof document !== 'undefined') { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true; }
  const el = document.createElement('button'); el.type = 'button'; el.className = 'bc'; el.dataset.side = 'front';
  const when = shortDate(moment.at);
  const corners = '<i class="bc-c a"></i><i class="bc-c b"></i><i class="bc-c c"></i><i class="bc-c d"></i>';
  el.innerHTML = `<span class="bc-in"><span class="bc-f bc-a">${corners}<span class="bc-k"><i></i>BAR</span><h3>${esc(title)}</h3>${sealSvg(seal, id)}<span class="bc-foot"><span>${when ? 'drawn by you, ' + esc(when) : 'drawn by you'}</span><span>tap to turn</span></span></span>
<span class="bc-f bc-b">${corners}<span class="bc-k"><i></i>BAR · the moment</span><p class="bc-hand">“${esc(moment.sentence || '')}”</p><dl>${backRows(moment).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl><span class="bc-foot"><span></span><span>tap to turn</span></span></span></span>`;
  const turn = () => { el.dataset.side = el.dataset.side === 'front' ? 'back' : 'front'; el.setAttribute('aria-label', el.dataset.side === 'front' ? `BAR, ${title}, seal side. Turn over.` : 'BAR, the moment side. Turn over.'); };
  el.setAttribute('aria-label', `BAR, ${title}, seal side. Turn over.`);
  el.addEventListener('click', turn);
  return el;
}

/** The pad where the player draws the seal: a canvas, brush strokes recorded 0..1. `onChange(strokes)` fires after each stroke. */
export function sealPad({ onChange } = {}) {
  const cv = document.createElement('canvas'); cv.width = 400; cv.height = 400; cv.className = 'bc-pad'; cv.setAttribute('aria-label', 'Draw your seal here with your finger or the mouse. You may leave it plain.');
  cv.style.cssText = 'width:100%;aspect-ratio:1;touch-action:none;border-radius:8px;background:#1b120d;box-shadow:inset 0 0 0 1px rgba(192,86,59,.6)';
  const x = cv.getContext('2d'); let strokes = [], cur = null;
  const draw = () => { x.clearRect(0, 0, 400, 400); x.strokeStyle = '#c0392b'; x.lineWidth = 20; x.lineCap = x.lineJoin = 'round';
    for (const s of strokes) { x.beginPath(); s.forEach(([a, b], i) => i ? x.lineTo(a * 400, b * 400) : x.moveTo(a * 400, b * 400)); if (s.length === 1) x.lineTo(s[0][0] * 400 + .1, s[0][1] * 400); x.stroke(); } };
  const at = ev => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width, (ev.clientY - r.top) / r.height]; };
  cv.addEventListener('pointerdown', ev => { cv.setPointerCapture(ev.pointerId); cur = [at(ev)]; strokes.push(cur); draw(); });
  cv.addEventListener('pointermove', ev => { if (!cur) return; cur.push(at(ev)); draw(); });
  const up = () => { if (!cur) return; cur = null; strokes = cleanSeal(strokes); draw(); onChange && onChange(strokes); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  return { el: cv, strokes: () => cleanSeal(strokes), clear: () => { strokes = []; draw(); onChange && onChange([]); } };
}
