// Step 2 of the Heaven quest demo (2026-11-17): the doubt card, the quest slip in the hand, and one faint spirit on the
// altar walk for each sentence the player wrote. The sentences live in this tab's sessionStorage ('hq-doubts') and go
// nowhere else: no fetch, no server, nothing reads them. Quest state is 'hq-quest': none, offered, held, met, taken, tried.
import * as THREE from 'three';
import { ALTAR } from './altar.js';
import { groundAt } from './walk.js';
import { spirit } from './people.js';
import { DOUBT, SLIP, SPIRIT, MAX_LINES, MAX_CHARS, clean, keep, promptAt } from './doubt-words.js';

const CSS = `
.dq-line{box-sizing:border-box;width:100%;min-height:48px;padding:0 14px;border-radius:12px;border:1px solid rgba(255,255,255,.45);background:rgba(255,255,255,.08);color:#f6ecdc;font:400 16px/1.3 var(--ui-body,system-ui,sans-serif)}
.dq-line:focus-visible{outline:3px solid #5fc2ba;outline-offset:2px}
.dq-prev{margin:0;padding:0 0 0 18px;color:#d9cdb8;font-size:14px}
.dq-slip{padding:10px 14px;border-radius:6px;background:#f3ead6;color:#2b2118;font:600 16px/1.5 Georgia,serif;box-shadow:0 2px 8px rgba(0,0,0,.35)}
.dq-src{font-size:14px;color:#d9cdb8}
.dq-quote{font:400 20px/1.35 var(--ui-display,Georgia,serif)}
.dq-cap{font-size:13px;color:#d9cdb8}
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
  card.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset && e.target.dataset.dq === 'line') { e.preventDefault(); const b = card.querySelector('[data-dq="another"]') || card.querySelector('[data-dq="one"]'); b && !b.disabled && b.click(); } else if (e.key === 'Escape' && mode === 'write') hide(); });
  card.addEventListener('click', e => {
    const b = e.target.closest('[data-dq]'); if (!b || b.disabled) return; const k = b.dataset.dq;
    if (k === 'another') { if (flush()) writing(); }
    else if (k === 'one') { if (flush()) { store.set('hq-doubts', JSON.stringify(keep(draft))); slipCard(); } }
    else if (k === 'later') hide();   // the errand stays offered; the draft stays in this tab's memory
    else if (k === 'take') take();
    else if (k === 'walk') { hide(); openSpirit = null; }
  });

  // ---- the slip taken: state held, the light, the spirits ----
  function take() { store.set('hq-quest', 'held'); hide(); slipIn = true; slip.visible = true; way.visible = true; setHint(SLIP.hint); setTimeout(() => setHint(''), 7000); plant(readLines()); }
  async function plant(lines) {
    for (const s of spirits) { S.remove(s.m.h); } spirits.length = 0;
    for (let i = 0; i < lines.length; i++) {
      try {
        const m = await spirit(i), [r, v] = PLACES[i], [x, z] = at(r, v); faint(m);
        S.add(m.h); m.h.position.set(x, groundAt(x, z), z); m.turn(A.position.x - x, A.position.z - z);
        spirits.push({ m, line: lines[i], x, z, shown: false, t0: Math.random() * 6 });
      } catch (e) { console.warn('spirit', i, e); }
    }
  }
  function tick() {
    const t = performance.now(), px = A.position.x, pz = A.position.z;
    if (slipIn) { const w = wrist(); if (w) { w.getWorldPosition(v3); slip.position.set(v3.x, v3.y - 0.1, v3.z); } else slip.position.set(px + 0.4, A.position.y + 0.9, pz); slip.rotation.y = A.rotation.y; }
    if (way.visible) way.children[1].scale.setScalar(1 + 0.12 * Math.sin(t / 300));
    for (const s of spirits) {
      s.m.h.position.y = groundAt(s.x, s.z) + 0.08 + 0.05 * Math.sin(t / 900 + s.t0);   // a slow float
      const d = Math.hypot(s.x - px, s.z - pz);
      if (d < reach && !s.shown && mode !== 'write' && mode !== 'slip') { s.shown = true; openSpirit = s; mode = 'spirit';
        show(`<p class="dq-quote">“${esc(s.line)}”</p><p class="dq-cap">${esc(SPIRIT.caption)}</p><div class="tw-row"><button type="button" data-dq="walk">${esc(SPIRIT.walk)}</button></div>`, 'A spirit speaks your line'); }
      else if (d > far) { s.shown = false; if (openSpirit === s) { hide(); openSpirit = null; } }
    }
  }
  hooks.push(tick);
  return {
    start: () => { if ((store.get('hq-quest') || 'none') === 'held') return; draft = draft.length ? draft : []; writing(); },
    /** A reload in the same tab: the slip is still held, and the sentences are in sessionStorage. */
    restore: () => { if ((store.get('hq-quest') || 'none') !== 'held') return; const l = readLines(); if (!l.length) return; slipIn = true; slip.visible = true; way.visible = true; plant(l); },
    busy: () => mode === 'write' || mode === 'slip',
    state: () => ({ mode, slipIn, spirits: spirits.map(s => ({ line: s.line, x: s.x, z: s.z, shown: s.shown })), lines: readLines() }),
    spirits, slip, way, tick, take: () => { store.set('hq-doubts', JSON.stringify(keep(draft))); take(); },
  };
}
