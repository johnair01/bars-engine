// Speaking to a person (step 1 of the Heaven quest demo, 2026-11-17). A small lantern floats over a person the player can
// speak to. Within 10 m a Speak seal and a tap target over her appears beside her (tap her, her lantern or the seal; E on a keyboard); her card opens with one line and reply seals.
// Deterministic: no AI in any line. The card reuses the trainee walk's card classes (trainee.js CSS), so it runs after
// traineeWalk has set up the page. Quest state is kept in sessionStorage under 'hq-quest': none, offered, held, met, taken, tried.
import * as THREE from 'three';
import { replies, lineAt } from './talk-words.js';

const CSS = `
.tk-hit{position:fixed;z-index:55;padding:0;border:0;background:transparent;cursor:pointer}
.tk-hit[hidden]{display:none}
.tk-seal{position:fixed;z-index:56;min-width:88px;min-height:56px;margin:-28px 0 0 -44px;padding:0 16px;border-radius:24px;border:2px solid #f0c969;background:rgba(18,14,24,.92);color:#f6ecdc;font:700 15px/1 var(--ui-body,system-ui,sans-serif);cursor:pointer;box-shadow:0 0 14px rgba(240,201,105,.55);animation:tkpulse 1.8s ease-in-out infinite}
.tk-seal[hidden]{display:none}
.tk-seal:focus-visible{outline:3px solid #5fc2ba;outline-offset:2px}
@keyframes tkpulse{50%{box-shadow:0 0 24px rgba(240,201,105,.9)}}
@media (prefers-reduced-motion:reduce){.tk-seal{animation:none}}
`;
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode */ } } };

/** A paper lantern: amber body, dark caps, an additive halo. Bobs in tick. */
function lantern() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffc766 })); body.scale.y = 1.2;
  const cap = new THREE.MeshStandardMaterial({ color: 0x3b2a1c, roughness: 0.7 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.04, 12), cap); top.position.y = 0.23;
  const bot = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.05, 0.04, 12), cap); bot.position.y = -0.23;
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), new THREE.MeshBasicMaterial({ color: 0xf0c969, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
  g.add(body, top, bot, halo); return g;
}

/** talk({ S, A, cam, hooks, people }): people = [{ key, m (a figure from people.js), height, lines }]. Returns the controller. */
export function talk({ S, A, cam, hooks, people, reach = 10, far = 14, onGo, busy }) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const card = document.createElement('div'); card.className = 'tw-card'; card.setAttribute('role', 'dialog'); card.hidden = true;
  const seal = document.createElement('button'); seal.type = 'button'; seal.className = 'tk-seal'; seal.hidden = true; seal.textContent = 'Speak'; seal.setAttribute('aria-label', 'Speak to the Elder');
  const hit = document.createElement('button'); hit.type = 'button'; hit.className = 'tk-hit'; hit.hidden = true; hit.setAttribute('aria-label', 'Speak to the Elder'); hit.tabIndex = -1;
  for (const ev of ['pointerdown', 'pointerup', 'keydown', 'wheel']) { card.addEventListener(ev, e => e.stopPropagation()); seal.addEventListener(ev, e => e.stopPropagation()); hit.addEventListener(ev, e => e.stopPropagation()); }
  document.body.append(card, hit, seal);
  const v3 = new THREE.Vector3();
  const mark = new Map();
  for (const p of people) { const l = lantern(); l.position.y = (p.height || 1.8) + 0.55; p.m.h.add(l); mark.set(p.key, l); }
  let open = null, open_p = null, node = 'open', near = null;
  const state = () => store.get('hq-quest') || 'none';

  const render = () => {
    const rs = replies(node);
    card.innerHTML = `<p>${esc(lineAt(node))}</p><div class="tw-row">${rs.map(([id, t]) => `<button type="button" class="${id === 'go' ? 'go' : ''}" data-tk="${id}">${esc(t)}</button>`).join('')}${rs.length ? '' : '<button type="button" class="go" data-tk="done">Walk on</button>'}</div>`;
    card.setAttribute('aria-label', 'The Elder speaks'); card.hidden = false;
    const b = card.querySelector('button'); b && b.focus({ preventScroll: true });
  };
  const openCard = p => { open = p; open_p = p; node = state() === 'none' ? 'open' : state() === 'held' ? 'held' : state() === 'met' ? 'met' : 'again'; seal.hidden = true; hit.hidden = true; render(); };
  const closeCard = () => { open = null; card.hidden = true; };
  seal.addEventListener('click', () => near && openCard(near));
  hit.addEventListener('click', () => near && openCard(near));
  card.addEventListener('click', e => {
    const b = e.target.closest('[data-tk]'); if (!b) return; const k = b.dataset.tk;
    if (k === 'go') { if (state() === 'none') store.set('hq-quest', 'offered'); if (onGo) { closeCard(); onGo(open_p); } else { node = 'close'; render(); } }
    else if (k === 'done') closeCard();
    else { node = k; render(); }
  });
  addEventListener('keydown', e => {
    if (e.target && e.target.tagName === 'INPUT') return;
    const k = e.key.toLowerCase();
    if (k === 'e' && near && !open && !seal.hidden) { e.preventDefault(); openCard(near); }
    else if (k === 'escape' && open) closeCard();
  });

  function tick() {
    const t = performance.now(), px = A.position.x, pz = A.position.z;
    let best = null, bd = reach;
    for (const p of people) {
      const l = mark.get(p.key); if (l) { l.position.y = (p.height || 1.8) + 0.55 + 0.06 * Math.sin(t / 500); l.rotation.y = t / 1500; }
      const d = Math.hypot(p.m.h.position.x - px, p.m.h.position.z - pz); if (d < bd) { bd = d; best = p; }
    }
    near = best;
    if (open && Math.hypot(open.m.h.position.x - px, open.m.h.position.z - pz) > far) closeCard();   // walked away from her mid-card
    if (best && !open && !(busy && busy())) {
      v3.set(best.m.h.position.x, best.m.h.position.y + (best.height || 1.8) * 0.62, best.m.h.position.z).project(cam);
      const x = Math.min(innerWidth - 44, Math.max(44, (v3.x * 0.5 + 0.5) * innerWidth)), y = Math.min(innerHeight - 40, Math.max(40, (-v3.y * 0.5 + 0.5) * innerHeight));
      seal.hidden = v3.z > 1; seal.style.left = x + 'px'; seal.style.top = y + 'px';
      // a tap target from her feet to above her lantern, at least 64 px wide
      let behind = false; const hh = best.height || 1.8, P = (dy) => { v3.set(best.m.h.position.x, best.m.h.position.y + dy, best.m.h.position.z).project(cam); behind = behind || v3.z > 1; return [(v3.x * 0.5 + 0.5) * innerWidth, (-v3.y * 0.5 + 0.5) * innerHeight]; };
      const top = P(hh + 0.9), foot = P(0), h = Math.max(96, foot[1] - top[1]), w = Math.max(64, h * 0.5);
      hit.hidden = seal.hidden || behind || foot[0] + w / 2 < 0 || foot[0] - w / 2 > innerWidth; hit.style.left = foot[0] - w / 2 + 'px'; hit.style.top = Math.min(top[1], foot[1] - 96) + 'px'; hit.style.width = w + 'px'; hit.style.height = h + 'px';
    } else { seal.hidden = true; hit.hidden = true; }
  }
  hooks.push(tick);
  return { open: p => openCard(p || people[0]), close: closeCard, state: () => ({ open: !!open, node, near: near && near.key, quest: state() }), tick, mark };
}
