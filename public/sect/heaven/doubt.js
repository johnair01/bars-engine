// Step 2 of the Heaven quest demo (2026-11-17): the doubt card, the quest slip in the hand, and one faint spirit on the
// altar walk for each sentence the player wrote. The sentences live in this tab's sessionStorage ('hq-doubts') and go
// nowhere else: no fetch, no server, nothing reads them. Quest state is 'hq-quest': none, offered, held, met, taken, tried.
import * as THREE from 'three';
import { ALTAR } from './altar.js';
import { groundAt } from './walk.js';
import { spirit } from './people.js';
import { DOUBT, SLIP, SPIRIT, MAX_LINES, MAX_CHARS, clean, keep, promptAt, STAND_NAMES, STAND_ORDER, STEP, NEED, stepsFor } from './doubt-words.js';

const CSS = `
.dq-line{box-sizing:border-box;width:100%;min-height:48px;padding:0 14px;border-radius:12px;border:1px solid rgba(255,255,255,.45);background:rgba(255,255,255,.08);color:#f6ecdc;font:400 16px/1.3 var(--ui-body,system-ui,sans-serif)}
.dq-line:focus-visible{outline:3px solid #5fc2ba;outline-offset:2px}
.dq-prev{margin:0;padding:0 0 0 18px;color:#d9cdb8;font-size:14px}
.dq-slip{padding:10px 14px;border-radius:6px;background:#f3ead6;color:#2b2118;font:600 16px/1.5 Georgia,serif;box-shadow:0 2px 8px rgba(0,0,0,.35)}
.dq-src{font-size:14px;color:#d9cdb8}
.dq-quote{font:400 20px/1.35 var(--ui-display,Georgia,serif)}
.dq-cap{font-size:13px;color:#d9cdb8}
.dq-form{display:flex;gap:8px}.dq-form .dq-line{flex:1}
.dq-form button{min-height:48px;padding:0 18px;border-radius:24px;border:1px solid #2f8f86;background:#2f8f86;color:#fff;font:700 15px/1 var(--ui-body,system-ui,sans-serif);cursor:pointer}
.dq-log{display:grid;gap:4px;max-height:28vh;overflow:auto;font-size:14px;color:#d9cdb8}.dq-log small{opacity:.75;margin-right:6px}
.dq-n{font-size:13px;opacity:.75;margin-left:6px}
`;
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode */ } } };
const readLines = () => { try { return keep(JSON.parse(store.get('hq-doubts') || '[]')); } catch (e) { return []; } };

/** The spirits' places on the altar walk: the walk from the founder's north doors, then the apron's near edge. [r, v] in crown coordinates. */
export const PLACES = [[-13.9, 0.9], [-15.5, -1.0], [-16.3, 4.2], [-16.3, -4.2]];

/** A faint, glowing copy of a figure: every material cloned, see-through, with a teal lift; an additive column beneath. */
function faint(m) {
  m.g.traverse(o => { if (!o.isMesh) return;
    const f = mat => { const c = mat.clone(); c.transparent = true; c.opacity = 0.42; c.depthWrite = false; if (c.emissive) { c.emissive = new THREE.Color(0x5fc2ba); c.emissiveIntensity = 0.55; } return c; };
    o.material = Array.isArray(o.material) ? o.material.map(f) : f(o.material); o.castShadow = false; });
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 2.2, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0x5fc2ba, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  col.position.y = 1.1; m.h.add(col); return col;
}

/** Where the met voice stands: on the landing outside the founder's north doors, beside the walk. [r, v] in crown coordinates. */
export const MEET = [-13.0, -1.8];
/** gather(s, f): f 0 to 1 takes a spirit from faint to a solid, warm person. */
function gather(s, f) {
  s.m.g.traverse(o => { if (!o.isMesh) return; for (const m of [].concat(o.material)) { m.opacity = 0.42 + 0.58 * f; if (m.emissive) m.emissiveIntensity = 0.55 * (1 - f); m.depthWrite = f > 0.6; } });
  if (s.col) s.col.material.opacity = 0.16 * (1 - f);
}

/** doubtQuest({ S, A, cam, hooks, at, wrist }): returns { start(), restore(), state(), spirits } ; start() is talk()'s onGo. */
export function doubtQuest({ S, A, cam, hooks, at, wrist, reach = 2.6, far = 4.2 }) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const card = document.createElement('div'); card.className = 'tw-card'; card.setAttribute('role', 'dialog'); card.hidden = true;
  for (const ev of ['pointerdown', 'pointerup', 'keydown', 'wheel']) card.addEventListener(ev, e => e.stopPropagation());
  document.body.append(card);
  const hint = document.createElement('div'); hint.className = 'tw-hint'; hint.hidden = true; document.body.append(hint);
  const setHint = t => { hint.textContent = t || ''; hint.hidden = !t; };
  const v3 = new THREE.Vector3();
  const spirits = []; let draft = [], mode = null, slipIn = false, openSpirit = null;
  let work = null;   // the 3-2-1 at one spirit: { i (spirit index), stand (0-2), lines: { face: [], talk: [], be: [] }, steps }. Memory only: never stored, never sent.
  let person = null;  // the met spirit after it gathers: { s, t0, phase, from, to }

  // ---- the slip: a paper strip with a red seal, carried in the wrist like the bucket ----
  const slip = new THREE.Group();
  { const paper = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.006), new THREE.MeshStandardMaterial({ color: 0xf3ead6, roughness: 0.9 }));
    const seal = new THREE.Mesh(new THREE.CircleGeometry(0.018, 14), new THREE.MeshBasicMaterial({ color: 0xc8402e })); seal.position.set(0, -0.05, 0.004);
    slip.add(paper, seal); slip.visible = false; S.add(slip); }
  // ---- the light that marks the altar walk ----
  const way = new THREE.Group(); way.visible = false; S.add(way);
  { const [x, z] = at(-15.0, 0), y = groundAt(x, z);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, 14, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xf0c969, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 7;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.85, 40), new THREE.MeshBasicMaterial({ color: 0xf0c969, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05;
    way.add(beam, ring); way.position.set(x, y, z); }

  const show = (html, label) => { card.innerHTML = html; card.setAttribute('aria-label', label); card.hidden = false; };
  const hide = () => { card.hidden = true; mode = null; };

  // ---- the doubt card: one blank line at a time ----
  function writing() {
    mode = 'write';
    const prev = draft.length ? `<ol class="dq-prev">${draft.map(d => `<li>${esc(d)}</li>`).join('')}</ol>` : '';
    const room = draft.length < MAX_LINES - 1;
    show(`<p>${esc(promptAt(draft.length))}</p>${prev}<input class="dq-line" type="text" maxlength="${MAX_CHARS}" aria-label="${esc(DOUBT.label)}" autocomplete="off" data-dq="line"><div class="tw-row"><button type="button" class="go" data-dq="one" disabled>${esc(draft.length ? DOUBT.all : DOUBT.one)}</button>${room ? `<button type="button" data-dq="another" disabled>${esc(DOUBT.another)}</button>` : ''}<button type="button" data-dq="later">${esc(DOUBT.later)}</button></div>`, 'Write what the voice says');
    const inp = card.querySelector('input'); inp.focus({ preventScroll: true });
  }
  function slipCard() {
    mode = 'slip';
    show(`<p>${esc(SLIP.hand)}</p><div class="dq-slip">${SLIP.steps.map(esc).join('<br>')}</div><p class="dq-src">${esc(SLIP.source)}</p><div class="tw-row"><button type="button" class="go" data-dq="take">${esc(SLIP.take)}</button></div>`, 'The Elder hands you a slip');
    const b = card.querySelector('.go'); b && b.focus({ preventScroll: true });
  }
  const flush = () => {  // the typed text becomes a kept line (only when there is text)
    const inp = card.querySelector('input'); const t = inp ? clean(inp.value) : ''; if (t) draft.push(t); return !!t;
  };
  card.addEventListener('input', e => { if (e.target.dataset && e.target.dataset.dq === 'line') { const ok = !!clean(e.target.value); card.querySelectorAll('[data-dq="one"],[data-dq="another"]').forEach(b => { b.disabled = !ok; }); } });
  card.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset && e.target.dataset.dq === 'line') { e.preventDefault(); const b = card.querySelector('[data-dq="another"]') || card.querySelector('[data-dq="one"]'); b && !b.disabled && b.click(); } else if (e.key === 'Escape' && (mode === 'write' || mode === 'step' || mode === 'need')) hide(); });
  card.addEventListener('click', e => {
    const b = e.target.closest('[data-dq]'); if (!b || b.disabled) return; const k = b.dataset.dq;
    if (k === 'another') { if (flush()) writing(); }
    else if (k === 'one') { if (flush()) { store.set('hq-doubts', JSON.stringify(keep(draft))); slipCard(); } }
    else if (k === 'later') hide();   // the errand stays offered; the draft stays in this tab's memory
    else if (k === 'take') take();
    else if (k === 'walk') { hide(); openSpirit = null; }
    else if (k === 'begin') begin(openSpirit);
    else if (k === 'enough') nextStand();
    else if (k === 'pause') { hide(); if (openSpirit) openSpirit.shown = true; }   // the lines stay in this tab's memory; walk back to the spirit to go on
    else if (k === 'met') meet();
  });

  // ---- the spirit's card, and the 3-2-1 one line at a time ----
  const sIdx = s => spirits.indexOf(s);
  function spiritCard(s) {
    mode = 'spirit'; openSpirit = s;
    const mine = !work || work.i === sIdx(s), done = (store.get('hq-quest') || '') === 'met';
    show(`<p class="dq-quote">“${esc(s.line)}”</p><p class="dq-cap">${esc(mine ? SPIRIT.caption : SPIRIT.other)}</p><div class="tw-row">${mine && !done ? `<button type="button" class="go" data-dq="begin">${esc(work ? SPIRIT.resume : SPIRIT.begin)}</button>` : ''}<button type="button" data-dq="walk">${esc(SPIRIT.walk)}</button></div>`, 'A spirit speaks your line');
  }
  const stage = () => STAND_ORDER[work.stand], logOf = () => STAND_ORDER.slice(0, work.stand + 1).flatMap(k => work.lines[k]);
  function stepCard() {
    mode = 'step'; const k = stage(), steps = work.steps[k], n = work.lines[k].length, st = steps[Math.min(n, steps.length - 1)];
    const log = work.lines[k].map(l => `<div><small>${esc(l.voice === 'it' ? STEP.it : STEP.you)}</small>${esc(l.text)}</div>`).join('');
    show(`<p><b>${esc(STAND_NAMES[k])}</b><span class="dq-n">${n + 1} of ${steps.length}</span></p>${log ? `<div class="dq-log">${log}</div>` : ''}<p>${esc(st.ask)}</p><form class="dq-form" data-dq-form><input class="dq-line" type="text" maxlength="240" enterkeyhint="send" autocomplete="off" aria-label="${esc(st.ask)}" placeholder="${esc(st.hint)}"><button type="submit">${esc(STEP.say)}</button></form><div class="tw-row">${n ? `<button type="button" data-dq="enough">${esc(STEP.enough)}</button>` : ''}<button type="button" data-dq="pause">${esc(STEP.later)}</button></div>`, `${STAND_NAMES[k]}, line ${n + 1}`);
    card.querySelector('input').focus({ preventScroll: true });
  }
  function nextStand() {
    if (work.stand < 2) { work.stand++; stepCard(); return; }
    // all three stands are taken: does the voice have what it needs?
    mode = 'need'; const b = work.lines.be, g = b.length ? b[b.length - 1].text : '';
    show(`${g ? `<p>${esc(NEED.gift(g))}</p>` : ''}<p>${esc(NEED.ask)}</p><div class="tw-row"><button type="button" class="go" data-dq="met">${esc(NEED.yes)}</button><button type="button" data-dq="pause">${esc(NEED.no)}</button></div>`, 'Does the voice have what it needs');
    card.querySelector('.go').focus({ preventScroll: true });
  }
  function sayLine(text) {
    const t = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 240); if (!t) return;
    const k = stage(), steps = work.steps[k], n = work.lines[k].length;
    work.lines[k].push({ voice: steps[Math.min(n, steps.length - 1)].voice, text: t });
    if (work.lines[k].length >= steps.length) nextStand(); else stepCard();
  }
  card.addEventListener('submit', e => { if (!e.target.matches('[data-dq-form]')) return; e.preventDefault(); sayLine(e.target.querySelector('input').value); });
  function begin(s) { if (!work) work = { i: sIdx(s), stand: 0, lines: { face: [], talk: [], be: [] }, steps: stepsFor(s.line) }; stepCard(); }
  // the need met: the spirit's glow gathers into a person (a solid, warm figure) who walks up the altar walk toward the hall
  function meet() {
    const s = spirits[work.i]; store.set('hq-quest', 'met'); store.set('hq-met', String(work.i)); hide(); way.visible = false; slip.visible = false; slipIn = false;
    setHint(NEED.met); setTimeout(() => setHint(''), 9000);
    const [x, z] = at(MEET[0], MEET[1]); person = { s, t0: performance.now(), x, z, x0: s.x, z0: s.z };
  }
  function settle(s) { const [x, z] = at(MEET[0], MEET[1]); gather(s, 1); s.x = x; s.z = z; s.m.h.position.set(x, groundAt(x, z), z); s.met = true; s.m.turn(0, -1); }
  // ---- the slip taken: state held, the light, the spirits ----
  function take() { store.set('hq-quest', 'held'); hide(); slipIn = true; slip.visible = true; way.visible = true; setHint(SLIP.hint); setTimeout(() => setHint(''), 7000); plant(readLines()); }
  async function plant(lines) {
    for (const s of spirits) { S.remove(s.m.h); } spirits.length = 0;
    for (let i = 0; i < lines.length; i++) {
      try {
        const m = await spirit(i), [r, v] = PLACES[i], [x, z] = at(r, v), col = faint(m);
        S.add(m.h); m.h.position.set(x, groundAt(x, z), z); m.turn(A.position.x - x, A.position.z - z);
        spirits.push({ m, col, line: lines[i], x, z, shown: false, met: false, t0: Math.random() * 6 });
      } catch (e) { console.warn('spirit', i, e); }
    }
    const mi = +(store.get('hq-met') || -1); if ((store.get('hq-quest') || '') === 'met' && spirits[mi]) settle(spirits[mi]);   // a reload after the voice was met
  }
  function tick() {
    const t = performance.now(), px = A.position.x, pz = A.position.z;
    if (slipIn) { const w = wrist(); if (w) { w.getWorldPosition(v3); slip.position.set(v3.x, v3.y - 0.1, v3.z); } else slip.position.set(px + 0.4, A.position.y + 0.9, pz); slip.rotation.y = A.rotation.y; }
    if (way.visible) way.children[1].scale.setScalar(1 + 0.12 * Math.sin(t / 300));
    if (person) {
      const p = person, e = performance.now() - p.t0, f = Math.min(1, e / 2500), s = p.s; gather(s, f);
      if (e > 2500) { const L = Math.hypot(p.x - p.x0, p.z - p.z0), k = Math.min(1, (e - 2500) / 1000 * 1.3 / L), x = p.x0 + (p.x - p.x0) * k, z = p.z0 + (p.z - p.z0) * k;
        s.x = x; s.z = z; s.m.h.position.set(x, groundAt(x, z) + 0.04 * Math.abs(Math.sin(e / 230)), z); s.m.turn(p.x - p.x0, p.z - p.z0);
        if (k >= 1) { settle(s); person = null; } }
    }
    for (const s of spirits) {
      if (s.met || (person && person.s === s)) continue;
      s.m.h.position.y = groundAt(s.x, s.z) + 0.08 + 0.05 * Math.sin(t / 900 + s.t0);   // a slow float
      const d = Math.hypot(s.x - px, s.z - pz);
      if (d < reach && !s.shown && (mode === null || mode === 'spirit')) { s.shown = true; spiritCard(s); }
      else if (d > far) { s.shown = false; if (openSpirit === s && mode === 'spirit') { hide(); openSpirit = null; } }
    }
  }
  hooks.push(tick);
  return {
    start: () => { const q = store.get('hq-quest') || 'none'; if (q === 'held' || q === 'met') return; draft = draft.length ? draft : []; writing(); },
    /** A reload in the same tab: the slip is still held, and the sentences are in sessionStorage. */
    restore: () => { const q = store.get('hq-quest') || 'none'; if (q !== 'held' && q !== 'met') return; const l = readLines(); if (!l.length) return; if (q === 'held') { slipIn = true; slip.visible = true; way.visible = true; } plant(l); },
    busy: () => mode !== null,
    state: () => ({ mode, slipIn, work: work && { i: work.i, stand: work.stand, lines: work.lines }, person: !!person, spirits: spirits.map(s => ({ line: s.line, x: s.x, z: s.z, shown: s.shown })), lines: readLines() }),
    spirits, slip, way, tick, take: () => { store.set('hq-doubts', JSON.stringify(keep(draft))); take(); },
  };
}
