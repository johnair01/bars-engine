/**
 * Stands in for the claude.ai runtime (`window.claude.use`) so six-faces-council's board page runs unchanged on
 * bars-engine. `db` is backed by /api/board/saves (same origin, his sign-in cookie); `mcp` answers only the one call the
 * page makes to bars-engine itself (the Tap the Vein status check), as a same-origin fetch. Nothing else is offered:
 * the page's Send button is hidden by board/nonprofit/build.py, and the board-pull Action records saves on main.
 */
export const BOARD_SHIM = `<script>
(() => {
  const BOARD = 'nonprofit', API = '/api/board/saves';
  let docs = {}, sig = '', ready = false, lastPull = null;
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
    if (!lastPull){ el.textContent = 'Main has not recorded a pull from this board yet.'; return; }
    const at = new Date(lastPull.at), mins = Math.round((Date.now() - at) / 60000);
    el.textContent = 'Last board pull: ' + (mins < 1 ? 'just now' : mins < 120 ? mins + ' min ago' : Math.round(mins / 60) + ' h ago')
      + (mins > 60 ? '. The pull runs every 15 minutes, so this is late; check the board-pull Action.' : '.');
    el.style.color = mins > 60 ? 'var(--warn, #b45309)' : '';
  }
  async function refresh(){
    const r = await fetch(API + '?board=' + BOARD, {credentials: 'same-origin', cache: 'no-store'});
    if (r.status === 401){ location.href = '/login?returnTo=/board'; return; }
    if (!r.ok) throw new Error('board load ' + r.status);
    const j = await r.json(); lastPull = j.lastPull; pullNote();
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
