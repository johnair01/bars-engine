/**
 * Stands in for the claude.ai runtime (`window.claude.use`) so six-faces-council's board page runs unchanged on
 * bars-engine. `db` is backed by /api/board/saves (same origin, his sign-in cookie); `mcp` answers only the one call the
 * page makes to bars-engine itself (the Tap the Vein status check), as a same-origin fetch. Nothing else is offered:
 * the page's Send button is hidden by board/nonprofit/build.py, and the board-pull Action records saves on main.
 */
export type BoardName = 'nonprofit' | 'council'

/** The shim for one board. `path` is where that page is served, so a signed-out save returns to it after /login. */
export const boardShim = (board: BoardName, path: string) => `<script>
(() => {
  const BOARD = '${board}', API = '/api/board/saves';
  let docs = {}, sig = '', ready = false, lastPull = null, unrecorded = null;
  const subs = [];
  const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  const snapDoc = (c, id) => { const d = (docs[c] || {})[id]; return {id, exists: !!d, data: () => clone(d)}; };
  const snapCol = c => ({docs: Object.keys(docs[c] || {}).map(id => snapDoc(c, id))});
  const fire = s => { try { s.fn(s.c && s.id ? snapDoc(s.c, s.id) : snapCol(s.c)); } catch (e) { console.error(e); } };
  const notify = () => subs.forEach(fire);
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
  async function refresh(){
    const r = await fetch(API + '?board=' + BOARD, {credentials: 'same-origin', cache: 'no-store'});
    if (r.status === 401){ location.href = '/login?returnTo=${path}'; return; }
    if (!r.ok) throw new Error('board load ' + r.status);
    const j = await r.json(); lastPull = j.lastPull; unrecorded = j.unrecorded; pullNote();
    const s = JSON.stringify(j.docs || {});
    if (s !== sig){ sig = s; docs = j.docs || {}; if (ready) notify(); }
  }
  async function write(c, id, data, mode){
    const r = await fetch(API, {method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({board: BOARD, collection: c, docId: id, mode, data})});
    if (!r.ok){ const e = new Error('Not saved (' + r.status + '): ' + (await r.text()).slice(0, 200)); e.code = 'save_failed'; throw e; }
    const j = await r.json(); (docs[c] = docs[c] || {})[id] = j.doc; sig = JSON.stringify(docs); notify();
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
  const dbReady = refresh().then(() => { ready = true; setTimeout(notify, 0);
    setInterval(() => { if (!document.hidden) refresh().catch(() => {}); }, 30000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh().catch(() => {}); });
    return db; }, () => null);
  window.claude = {use: name => name === 'db' ? dbReady : name === 'mcp' ? Promise.resolve(mcp) : Promise.resolve(null)};
})();
</script>`

export const BOARD_SHIM = boardShim('nonprofit', '/board')
