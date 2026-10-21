// One store for the spirits that outlast a run (Six-faces-council council/callsheets/spirits-in-caves.md, boards sic-one-store and
// sic-loadout-three). Both caves read and write it: Big Mind records the spirit born from meeting a daemon, the Cave of Lessons
// reads which of them walk with the player. It lives in this browser's localStorage only, as `oag.spirits.v1`:
//   { v: 1, spirits: [{ id, name, element, family, sittings, born: { where, at }, lineage: [{ where, at }], loadout }], vibeulons, minted: [{ n, where, at }] }
// `vibeulons` is the purse: a count of condensed qi. A finished W.A.V.E. whose charge is not kept mints one (board gw-unkept-vibeulon).
// A spirit's stage is never stored: spirit-forms.js stageOf(sittings) gives it. Up to three spirits are in the loadout, the ones that
// walk with the player; the rest rest in the WAVE room (SPIRITS_SHOWN in cave.js is the same three).
(function () {
  "use strict";
  var KEY = "oag.spirits.v1", MAX_LOADOUT = 3, MAX_LINEAGE = 60;

  function blank() { return { v: 1, spirits: [] }; }
  function read() {
    try { var s = JSON.parse(localStorage.getItem(KEY) || "null"); return s && s.v === 1 && Array.isArray(s.spirits) ? s : blank(); } catch (e) { return blank(); }
  }
  function write(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; } }
  function find(s, id) { for (var i = 0; i < s.spirits.length; i++) if (s.spirits[i].id === id) return s.spirits[i]; return null; }
  function copy(r) { return r ? JSON.parse(JSON.stringify(r)) : null; }
  function now() { return new Date().toISOString(); }

  function all() { return read().spirits.map(copy); }
  function get(id) { return copy(find(read(), id)); }
  function loadout() { return read().spirits.filter(function (r) { return r.loadout; }).slice(0, MAX_LOADOUT).map(copy); }

  // Add a spirit, or bring an existing one up to date. Sittings only go up (two caves may each have counted some), the first
  // birth place stays, and the loadout flag is the player's choice, so it is never set here. `where` records one sitting in the
  // lineage (board sic principle 11: what a spirit has lived through stays with it).
  function put(rec, where) {
    if (!rec || !rec.id) return null;
    var s = read(), r = find(s, rec.id);
    if (!r) { r = { id: rec.id, name: rec.name || "", element: rec.element || null, family: rec.family || null, sittings: 0, born: { where: where || rec.where || "the caves", at: now() }, lineage: [], loadout: false }; s.spirits.push(r); }
    if (rec.name) r.name = rec.name;
    if (rec.element) r.element = rec.element;
    if (rec.family) r.family = rec.family;
    r.sittings = Math.max(r.sittings || 0, rec.sittings || 0);
    if (where && rec.sittings) { r.lineage.push({ where: where, at: now() }); if (r.lineage.length > MAX_LINEAGE) r.lineage = r.lineage.slice(-MAX_LINEAGE); }
    write(s); return copy(r);
  }
  function remove(id) { var s = read(), n = s.spirits.length; s.spirits = s.spirits.filter(function (r) { return r.id !== id; }); if (s.spirits.length !== n) write(s); return s.spirits.length !== n; }
  // Put a spirit in the loadout or take it out. A fourth is refused (false), so the player chooses which one rests.
  function setLoadout(id, on) {
    var s = read(), r = find(s, id); if (!r) return false;
    if (on && !r.loadout && s.spirits.filter(function (x) { return x.loadout; }).length >= MAX_LOADOUT) return false;
    r.loadout = !!on; return write(s);
  }
  // The purse. mint(n, where) adds n and keeps a short record of where each came from; spend(n) takes n only if the purse holds them.
  function vibeulons() { return read().vibeulons || 0; }
  function mint(n, where) {
    n = Math.max(0, Math.floor(n || 0)); if (!n) return vibeulons();
    var s = read(); s.vibeulons = (s.vibeulons || 0) + n;
    s.minted = (s.minted || []).concat([{ n: n, where: where || "the caves", at: now() }]).slice(-MAX_LINEAGE);
    write(s); return s.vibeulons;
  }
  function spend(n) {
    n = Math.max(0, Math.floor(n || 0)); var s = read();
    if ((s.vibeulons || 0) < n) return false;
    s.vibeulons = (s.vibeulons || 0) - n; return write(s);
  }
  function wipe() { try { localStorage.removeItem(KEY); } catch (e) { /* nothing to remove */ } }

  window.__oagSpiritStore = { KEY: KEY, MAX_LOADOUT: MAX_LOADOUT, all: all, get: get, loadout: loadout, put: put, remove: remove, setLoadout: setLoadout, vibeulons: vibeulons, mint: mint, spend: spend, wipe: wipe };
})();
