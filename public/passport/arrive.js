// Arriving with a passport (Chapter 1's end, /calrunia/arrive). Sprout's last link carries the player's passport in the URL
// fragment as `#p=<base64url of the passport's JSON>`; the fragment never reaches a server. The page checks it against the
// contract (schema/passport.schema.json, src/lib/passport/passport.ts validatePassport) and then lays it into the stores this
// browser already keeps, the ones guest.js folds back into a passport:
//   spirits     -> oag.spirits.v1   (the cave's store, cave/spirit-store.js)
//   qi, vibeulons, embers -> oag.vessel.v1 (the ship holds them, FIELD_OWNERS in passport.ts; cave/vessel.js)
//   hand        -> calrunia.hand.v1 (Sprout's hand; no other place keeps one yet)
//   guest_id    -> calrunia.guest.v1, only when this browser has none
// Arriving twice is safe: spirits, embers and cards join by id, and qi and vibeulons take the larger number, so nothing is minted.
// Runs in the page (window.__calruniaArrive) and under vitest (passport-contract.test.ts).
(function (root) {
  "use strict";
  var KEYS = { spirits: "oag.spirits.v1", vessel: "oag.vessel.v1", hand: "calrunia.hand.v1", guest: "calrunia.guest.v1" };
  var MAX_LOADOUT = 3, MAX_LINEAGE = 60;

  function toB64url(text) {
    var bytes = new TextEncoder().encode(text), bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function fromB64url(s) {
    if (!/^[A-Za-z0-9_-]*$/.test(s)) throw new Error("not base64url");
    var b = s.replace(/-/g, "+").replace(/_/g, "/"); while (b.length % 4) b += "=";
    var bin = atob(b), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  }

  // The fragment for a passport, with its leading "#".
  function encode(passport) { return "#p=" + toB64url(JSON.stringify(passport)); }
  // What a fragment carries: { found: false } when it has no p=, { found: true, value } when it parses, { found: true, error }
  // when it does not. Checking the value against the contract is the caller's (validatePassport).
  function decode(hash) {
    var m = /(?:^#?|&)p=([^&]*)/.exec(String(hash || ""));
    if (!m) return { found: false };
    try { return { found: true, value: JSON.parse(fromB64url(decodeURIComponent(m[1]))) }; } catch (e) { return { found: true, error: String(e && e.message || e) }; }
  }

  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i] && list[i].id === id) return list[i]; return null; }

  // merge(stores, passport) -> stores. Pure. stores: { spirits, vessel, hand, guest } as read (any may be null); `blankVessel`
  // makes a new ship when the browser has none (vessel.js blank, so the sample Helm and Sail come aboard).
  function merge(stores, p, blankVessel, at) {
    at = at || new Date().toISOString();
    var sp = stores.spirits && stores.spirits.v === 1 && Array.isArray(stores.spirits.spirits) ? copy(stores.spirits) : { v: 1, spirits: [] };
    var inLoadout = sp.spirits.filter(function (r) { return r && r.loadout; }).length;
    p.spirits.forEach(function (s) {
      var r = byId(sp.spirits, s.id);
      if (!r) {
        r = { id: s.id, name: s.name, element: s.element, family: s.family, sittings: s.sittings, born: copy(s.born), lineage: copy(s.lineage), loadout: false };
        sp.spirits.push(r);
        if (s.loadout && inLoadout < MAX_LOADOUT) { r.loadout = true; inLoadout++; }
        return;
      }
      if (s.name && !r.name) r.name = s.name;
      if (s.element && !r.element) r.element = s.element;
      if (s.family && !r.family) r.family = s.family;
      r.sittings = Math.max(r.sittings || 0, s.sittings);
      var seen = {}, lin = (r.lineage || []).concat(s.lineage).filter(function (l) { var k = l.where + l.at; return seen[k] ? false : (seen[k] = true); });
      r.lineage = lin.sort(function (a, b) { return a.at < b.at ? -1 : a.at > b.at ? 1 : 0; }).slice(-MAX_LINEAGE);
    });

    var v = stores.vessel && stores.vessel.v === 1 && Array.isArray(stores.vessel.parts) ? copy(stores.vessel) : (blankVessel ? blankVessel(at) : { v: 1, hull: { w: 3, h: 3 }, fuel: 3, embers: [], parts: [], places: { home: "visited" }, log: [] });
    v.embers = Array.isArray(v.embers) ? v.embers : [];
    p.embers.forEach(function (m) {
      if (byId(v.embers, m.id)) return;
      v.embers.push({ id: m.id, source: m.source, ref: null, element: m.element, look: m.look, bonus: false, daemon: null, at: m.at, label: m.label, state: m.state });
    });
    v.qi = Math.max(Number(v.qi) || 0, p.qi);
    v.vibeulons = Math.max(Number(v.vibeulons) || 0, p.vibeulons);
    v.places = v.places && typeof v.places === "object" ? v.places : {};
    v.places.home = "visited"; // they arrive aboard

    var hand = stores.hand && stores.hand.v === 1 && Array.isArray(stores.hand.hand) ? copy(stores.hand) : { v: 1, hand: [] };
    p.hand.forEach(function (h) { if (!byId(hand.hand, h.id)) hand.hand.push({ id: h.id, kind: h.kind, title: h.title, from: h.from }); });

    return { spirits: sp, vessel: v, hand: hand, guest: stores.guest || p.player.guest_id || null };
  }

  function storage() { try { return root.localStorage || null; } catch (e) { return null; } }
  function readJson(s, key) { try { return JSON.parse(s.getItem(key) || "null"); } catch (e) { return null; } }
  function readStores() {
    var s = storage(); if (!s) return { spirits: null, vessel: null, hand: null, guest: null };
    var g = null; try { g = s.getItem(KEYS.guest); } catch (e) { /* blocked */ }
    return { spirits: readJson(s, KEYS.spirits), vessel: readJson(s, KEYS.vessel), hand: readJson(s, KEYS.hand), guest: g };
  }
  // Lay a checked passport into this browser. Returns false when storage is blocked (the page still shows what arrived).
  function apply(p) {
    var s = storage(); if (!s) return false;
    var vessel = root.__oagVessel;
    var next = merge(readStores(), p, vessel && vessel.blank);
    try {
      s.setItem(KEYS.spirits, JSON.stringify(next.spirits));
      s.setItem(KEYS.vessel, JSON.stringify(next.vessel));
      s.setItem(KEYS.hand, JSON.stringify(next.hand));
      if (next.guest && !s.getItem(KEYS.guest)) s.setItem(KEYS.guest, next.guest);
      return true;
    } catch (e) { return false; }
  }

  var api = { KEYS: KEYS, encode: encode, decode: decode, merge: merge, readStores: readStores, apply: apply };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.__calruniaArrive = api;
})(typeof window !== "undefined" ? window : globalThis);
