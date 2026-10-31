/**
 * Stands in for the claude.ai runtime (`window.claude.use`) so six-faces-council's board pages run unchanged on
 * bars-engine. `db` is backed by /api/board/saves (same origin, his sign-in cookie); `mcp` answers only the one call the
 * page makes to bars-engine itself (the Tap the Vein status check), as a same-origin fetch. Nothing else is offered:
 * the pages' Send button is hidden by the board builds, and the board-pull Action records saves on main. `barsEngine`
 * marks the host, so the Council Board offers "Set aside" only where the save reaches bars-engine (seeds collection).
 * boardHome names the board the page saves as (`nonprofit` on /board, `council` on /board/council).
 * Typed words survive the 30-second refresh, a re-render and a reload (board-drafts, 2026-10-31): see DRAFTS below.
 */
export function boardShim(boardHome: string, returnTo = '/board'): string {
  const board = JSON.stringify(boardHome), back = JSON.stringify(returnTo)
  return `<script>
(() => {
  const BOARD = ${board}, API = '/api/board/saves';
  let docs = {}, sig = '', ready = false, lastPull = null, unrecorded = null;
  const subs = [];
  const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  const snapDoc = (c, id) => { const d = (docs[c] || {})[id]; return {id, exists: !!d, data: () => clone(d)}; };
  const snapCol = c => ({docs: Object.keys(docs[c] || {}).map(id => snapDoc(c, id))});
  const fire = s => { try { s.fn(s.c && s.id ? snapDoc(s.c, s.id) : snapCol(s.c)); } catch (e) { console.error(e); } };
  const notify = () => subs.forEach(fire);
  // DRAFTS. Every refresh re-renders the page, and a re-render rebuilds its text boxes empty, so words being typed were
  // lost (Wendell, 2026-10-31). Each text box with an id is kept in localStorage as he types. A refresh that finds
  // changes waits while a text box has focus. A box that comes back from a re-render or a reload is refilled, and
  // focus and caret return to it. A save whose data carries the words drops their draft; drafts older than 14 days go.
  const DKEY = 'board-drafts:' + BOARD, DAY = 864e5;
  const isText = el => !!el && !!el.id && (el.tagName === 'TEXTAREA'
    || (el.tagName === 'INPUT' && /^(text|search|email|url|tel)$/.test(el.type)));
  let drafts = (() => { try { const d = JSON.parse(localStorage.getItem(DKEY) || '{}'), cut = Date.now() - 14 * DAY;
    for (const k in d) if (!d[k] || typeof d[k].v !== 'string' || !(d[k].at > cut)) delete d[k]; return d; } catch { return {}; } })();
  const keepDrafts = () => { try { localStorage.setItem(DKEY, JSON.stringify(drafts)); } catch {} };
  let caret = null, held = false, writing = 0;
  const typing = () => isText(document.activeElement);
  const noteCaret = () => { const a = document.activeElement;
    if (isText(a)) caret = {el: a, id: a.id, s: a.selectionStart, e: a.selectionEnd}; };
  document.addEventListener('input', e => { const el = e.target; if (!isText(el)) return;
    if (el.value.trim()) drafts[el.id] = {v: el.value, at: Date.now()}; else delete drafts[el.id]; keepDrafts(); noteCaret(); }, true);
  ['focusin', 'keyup', 'pointerup', 'select'].forEach(t => document.addEventListener(t, noteCaret, true));
  document.addEventListener('selectionchange', noteCaret);
  function refill(){
    if (writing) return;
    for (const id in drafts){ const el = document.getElementById(id);
      if (!isText(el) || el.value === drafts[id].v) continue;
      el.value = drafts[id].v;
      for (let d = el.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) d.open = true;
      el.dispatchEvent(new Event('input', {bubbles: true})); }
    const a = document.activeElement;
    if (caret && !caret.el.isConnected && (!a || a === document.body)){ const el = document.getElementById(caret.id);
      if (isText(el)){ el.focus({preventScroll: true}); try { el.setSelectionRange(caret.s, caret.e); } catch {} noteCaret(); } }
  }
  new MutationObserver(refill).observe(document.documentElement, {childList: true, subtree: true});
  // A save that carries the words (whitespace aside) is the end of their draft.
  function settle(data){
    const words = [], walk = v => { if (typeof v === 'string') words.push(v); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
    walk(data); const all = words.join('\\n').replace(/\\s+/g, ' ');
    let gone = false;
    for (const id in drafts){ const t = drafts[id].v.trim().replace(/\\s+/g, ' '); if (t && all.includes(t)){ delete drafts[id]; gone = true; } }
    if (gone) keepDrafts();
  }
  // A refresh that changes the page while he types waits until no text box has focus; a moment's grace lets the tap
  // that took focus away land on the button it was aimed at before the page is rebuilt.
  const show = () => { if (typing()){ held = true; return; } held = false; notify(); };
  document.addEventListener('focusout', () => { if (held) setTimeout(() => { if (held && !typing()) show(); }, 1500); }, true);
  function pullNote(){
    let el = document.getElementById('board-pull-note');
    if (!el){ el = document.createElement('div'); el.id = 'board-pull-note';
      el.style.cssText = 'font-size:.8rem;opacity:.75;text-align:center;padding:6px 8px 72px';
      document.body.appendChild(el); }
    const ago = mins => mins < 1 ? 'just now' : mins < 120 ? mins + ' min ago' : Math.round(mins / 60) + ' h ago';
    const waiting = unrecorded && unrecorded.count > 0 && unrecorded.oldestReceivedAt ? unrecorded : null;
    const wait = waiting ? Math.round((Date.now() - new Date(waiting.oldestReceivedAt)) / 60000) : 0;
    const pulled = lastPull ? 'Last board pull: ' + ago(Math.round((Date.now() - new Date(lastPull.at)) / 60000)) + '.'
      : 'Main has not recorded a pull from this board yet.';
    if (waiting && wait > 60){
      el.textContent = 'Warning: ' + waiting.count + (waiting.count === 1 ? ' save has' : ' saves have') + ' waited for main '
        + (wait < 120 ? wait + ' min' : Math.round(wait / 60) + ' h') + ' (the oldest). ' + pulled
        + ' Run board-pull by hand from the Actions tab of six-faces-council.';
      el.style.color = 'var(--warn, #b45309)';
    } else { el.textContent = pulled; el.style.color = ''; }
  }
  // A store that will not load turns saving off; say why on the page, so the cause is not a guess.
  function showFault(e){
    console.error(e);
    let el = document.getElementById('board-pull-note');
    if (!el){ el = document.createElement('div'); el.id = 'board-pull-note';
      el.style.cssText = 'font-size:.8rem;text-align:center;padding:6px 8px 72px'; document.body.appendChild(el); }
    el.style.color = 'var(--warn, #b45309)';
    el.textContent = 'Saving is off: the board store did not load (' + (e && e.message || 'error') + '). Reload; if it stays, tell Claude this line.';
  }
  async function refresh(){
    const r = await fetch(API + '?board=' + BOARD, {credentials: 'same-origin', cache: 'no-store'});
    if (r.status === 401){ location.href = '/login?returnTo=' + ${back}; return; }
    if (!r.ok) throw new Error('board load ' + r.status);
    const j = await r.json(); lastPull = j.lastPull; unrecorded = j.unrecorded; pullNote();
    const s = JSON.stringify(j.docs || {});
    if (s !== sig){ sig = s; docs = j.docs || {}; if (ready) show(); }
  }
  async function write(c, id, data, mode){
    writing++;
    try {
      const r = await fetch(API, {method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({board: BOARD, collection: c, docId: id, mode, data})});
      if (!r.ok){ const e = new Error('Not saved (' + r.status + '): ' + (await r.text()).slice(0, 200)); e.code = 'save_failed'; throw e; }
      const j = await r.json(); (docs[c] = docs[c] || {})[id] = j.doc; sig = JSON.stringify(docs); settle(data); held = false; notify();
    } finally { writing--; refill(); }
  }
  const sub = (s, fn) => { s.fn = fn; subs.push(s); if (ready) fire(s); return () => { const i = subs.indexOf(s); if (i >= 0) subs.splice(i, 1); }; };
  const db = {
    doc(path){ const [c, id, extra] = path.split('/'); if (!c || !id || extra !== undefined) throw new Error('bad path ' + path);
      return {id, set: d => write(c, id, clone(d), 'set'), update: d => write(c, id, clone(d), 'update'),
        get: async () => snapDoc(c, id), delete: () => Promise.reject(Object.assign(new Error('delete is not offered'), {code: 'not_supported'})),
        onSnapshot: fn => sub({c, id}, fn)}; },
    collection(c){ return {doc: id => db.doc(c + '/' + id), onSnapshot: fn => sub({c}, fn)}; },
  };
  const mcp = {
    async callTool(server, tool, input){
      if (server !== 'Vercel' || tool !== 'web_fetch_vercel_url')
        throw Object.assign(new Error(server + ' ' + tool + ' is not available on bars-engine'), {code: 'capability_disabled'});
      const u = new URL(input.url);
      if (u.host !== location.host && u.host !== 'bars-engine.vercel.app') throw Object.assign(new Error('off-site'), {code: 'not_granted'});
      const r = await fetch(u.pathname + u.search, {credentials: 'same-origin', cache: 'no-store'});
      return {payload: {status: r.status, text: await r.text()}};
    },
  };
  const dbReady = refresh().then(() => { ready = true; setTimeout(() => { notify(); refill(); }, 0);
    setInterval(() => { if (!document.hidden) refresh().catch(() => {}); }, 30000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh().catch(() => {}); });
    return db; }, e => { showFault(e); return null; });
  // barsEngine tells the page its saves reach bars-engine, so a Council Board "Set aside" can rest the task here.
  window.claude = {barsEngine: true, use: name => name === 'db' ? dbReady : name === 'mcp' ? Promise.resolve(mcp) : Promise.resolve(null)};
})();
</script>`
}

/** /board (the Nonprofit Board) keeps the unparameterized name. */
export const BOARD_SHIM = boardShim('nonprofit')
