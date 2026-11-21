// The BAR card and the return visit (step 4 of the Heaven quest demo, 2026-11-21). The Shaman Elder hands "Tonight, before
// you sleep" after the voice is met; the player writes the one act. A guest keeps it in this tab (hq-quest 'taken');
// signing in saves the sentence, and only the sentence, to /api/between/quest-bar. The doubt lines and the 3-2-1 lines are
// never read here. Next visit, signed in, the Elder asks what happened and any of four endings sets hq-quest 'tried'.
import { BAR, RETURN, DONE, ENDING_KEY, sentence, reportLine, barCardFor } from './bar-words.js';

const CSS = `.bq-slip{padding:10px 14px;border-radius:6px;background:#f3ead6;color:#2b2118;font:600 16px/1.5 Georgia,serif;box-shadow:0 2px 8px rgba(0,0,0,.35)}
.bq-form{display:flex;gap:8px}.bq-line{flex:1;box-sizing:border-box;min-height:48px;padding:0 14px;border-radius:12px;border:1px solid rgba(255,255,255,.45);background:rgba(255,255,255,.08);color:#f6ecdc;font:400 16px/1.3 var(--ui-body,system-ui,sans-serif)}
.bq-line:focus-visible{outline:3px solid #5fc2ba;outline-offset:2px}
.bq-form button{min-height:48px;padding:0 18px;border-radius:24px;border:1px solid #2f8f86;background:#2f8f86;color:#fff;font:700 15px/1 var(--ui-body,system-ui,sans-serif);cursor:pointer}
.bq-small{font-size:14px;color:#d9cdb8}`;
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode */ } }, del: k => { try { sessionStorage.removeItem(k); } catch (e) { /* private mode */ } } };
const API = '/api/between/quest-bar';
const post = async body => { try { const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin' }); return { status: r.status, ...(await r.json().catch(() => ({}))) }; } catch (e) { return { status: 0 }; } };

/** barQuest(): returns { open(), busy(), sync(), state() }. open() is talk()'s onBar; sync() runs once on load. */
export function barQuest() {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const card = document.createElement('div'); card.className = 'tw-card'; card.setAttribute('role', 'dialog'); card.hidden = true;
  for (const ev of ['pointerdown', 'pointerup', 'keydown', 'wheel']) card.addEventListener(ev, e => e.stopPropagation());
  document.body.append(card);
  let mode = null, signed = false, pending = null;   // pending: the ending being written
  const quest = () => store.get('hq-quest') || 'none';
  const saved = () => ({ sentence: store.get('hq-bar') || '', id: store.get('hq-bar-id') || '' });
  const show = (html, label) => { card.innerHTML = html; card.setAttribute('aria-label', label); card.hidden = false; const b = card.querySelector('input,button'); b && b.focus({ preventScroll: true }); };
  const hide = () => { mode = null; card.hidden = true; };
  const slip = s => `<div class="bq-slip" aria-label="${esc(BAR.title)}"><b>${esc(BAR.title)}</b><br>${esc(s)}</div>`;

  function offer() {
    mode = 'offer';
    show(`<p>${esc(BAR.offer)}</p><p class="bq-small">${esc(BAR.who)}</p><form class="bq-form" data-bq-form="take"><input class="bq-line" type="text" maxlength="${280}" enterkeyhint="send" autocomplete="off" aria-label="${esc(BAR.label)}" placeholder="${esc(BAR.hint)}"><button type="submit">${esc(BAR.take)}</button></form><div class="tw-row"><button type="button" data-bq="later">${esc(BAR.later)}</button></div>`, BAR.title);
  }
  function held() {
    mode = 'held';
    show(`${slip(saved().sentence)}<p>${esc(signed ? BAR.heldSaved : BAR.heldGuest)}</p><p class="bq-small">${esc(signed ? BAR.local : BAR.localGuest)}</p><div class="tw-row">${signed ? '' : `<button type="button" class="go" data-bq="signin">${esc(BAR.signIn)}</button>`}<button type="button" data-bq="later">${esc(BAR.walk)}</button></div>`, BAR.title);
  }
  function ret() {
    mode = 'return'; pending = null;
    show(`<p>${esc(RETURN.ask)}</p>${saved().sentence ? `<p class="bq-small">${esc(RETURN.you)}</p>${slip(saved().sentence)}` : ''}<div class="tw-row"><button type="button" class="go" data-bq="end:tried">${esc(RETURN.tried)}</button><button type="button" data-bq="end:smaller">${esc(RETURN.smaller)}</button><button type="button" data-bq="end:chose">${esc(RETURN.chose)}</button><button type="button" data-bq="end:nothing">${esc(RETURN.nothing)}</button></div><div class="tw-row"><button type="button" data-bq="later">${esc(BAR.later)}</button></div>`, RETURN.ask);
  }
  function lineCard(ending) {
    mode = 'line'; pending = ending;
    show(`<p>${esc(RETURN.line[ending])}</p><form class="bq-form" data-bq-form="report"><input class="bq-line" type="text" maxlength="500" enterkeyhint="send" autocomplete="off" aria-label="${esc(RETURN.line[ending])}" placeholder="${esc(RETURN.hint[ending])}"><button type="submit">${esc(RETURN.save)}</button></form><div class="tw-row"><button type="button" data-bq="back">Back</button></div>`, RETURN.line[ending]);
  }
  async function finish(ending, line) {
    const key = ENDING_KEY[ending], s = saved();
    if (signed && s.id) { const r = await post({ do: 'report', barId: s.id, ending: key, whatHappened: line }); if (r.status !== 200) { show(`<p>${esc(RETURN.fail)}</p><div class="tw-row"><button type="button" data-bq="later">${esc(BAR.walk)}</button></div>`, RETURN.fail); mode = 'fail'; return; } }
    store.set('hq-quest', 'tried'); store.set('hq-ending', key);
    mode = 'thanks';
    show(`<p>${esc(RETURN.thanks[key])}</p><p class="bq-small">${esc(DONE.credit)}</p><div class="tw-row"><button type="button" class="go" data-bq="later">${esc(BAR.walk)}</button></div>`, RETURN.thanks[key]);
  }
  async function take(text) {
    const s = sentence(text); if (!s) return;
    store.set('hq-bar', s); store.set('hq-quest', 'taken');
    const r = await post({ do: 'take', sentence: s });
    if (r.status === 200 && r.barId) { signed = true; store.set('hq-bar-id', r.barId); store.set('hq-signed', '1'); }
    held();
  }
  card.addEventListener('submit', e => {
    const f = e.target.closest('[data-bq-form]'); if (!f) return; e.preventDefault();
    const v = f.querySelector('input').value;
    if (f.dataset.bqForm === 'take') take(v);
    else { const r = reportLine(pending, v); if (!r.ok) { f.querySelector('input').focus(); return; } finish(pending, r.line); }
  });
  card.addEventListener('click', e => {
    const b = e.target.closest('[data-bq]'); if (!b) return; const k = b.dataset.bq;
    if (k === 'later') hide();
    else if (k === 'back') ret();
    else if (k === 'signin') location.href = '/login?returnTo=' + encodeURIComponent(location.pathname + location.search);
    else if (k.startsWith('end:')) { const end = k.slice(4); if (end === 'tried' || end === 'smaller') lineCard(end); else finish(end, ''); }
  });
  addEventListener('keydown', e => { if (e.key === 'Escape' && mode) hide(); });

  /** Runs once on load. Signed in: a BAR carried across the sign-in round trip is saved, or one saved on an earlier visit is found. A guest finds the errand fresh. */
  async function sync() {
    const s = saved();
    if (quest() === 'taken' && s.sentence && !s.id) {   // the BAR was taken as a guest, then the player signed in and came back to this tab
      const r = await post({ do: 'take', sentence: s.sentence });
      if (r.status === 200 && r.barId) { signed = true; store.set('hq-bar-id', r.barId); store.set('hq-signed', '1'); }
      return;
    }
    if (s.id) { signed = true; return; }
    try {
      const r = await fetch(API, { credentials: 'same-origin' });
      if (r.status !== 200) return;   // a guest: nothing to find, no message
      const j = await r.json(); signed = true; store.set('hq-signed', '1');
      if (j.bar && quest() !== 'tried') { store.set('hq-quest', 'taken'); store.set('hq-bar', j.bar.sentence); store.set('hq-bar-id', j.bar.id); }
    } catch (e) { /* offline: carry on as a guest */ }
  }
  return {
    open: () => { const c = barCardFor(quest(), signed || !!store.get('hq-signed')); if (c === 'offer') offer(); else if (c === 'held') held(); else if (c === 'return') ret(); else if (c === 'done') { mode = 'done'; show(`<p>${esc(DONE.line)}</p><p class="bq-small">${esc(DONE.credit)}</p><div class="tw-row"><button type="button" class="go" data-bq="later">${esc(BAR.walk)}</button></div>`, DONE.line); } },
    busy: () => mode !== null, sync, state: () => ({ mode, signed, quest: quest(), bar: saved() }),
  };
}
