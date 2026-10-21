// The guest passport (six-faces-council pass calrunia-world1, cw-passport): what a player who has not signed in carries between
// Calrunia's places. It is folded from the stores the places already keep in this browser, and moves none of them: the cave's
// spirits (`oag.spirits.v1`, cave/spirit-store.js) and the ship (`oag.vessel.v1`, cave/vessel.js, once the dock lands). Only the
// guest's own id is written, as `calrunia.guest.v1`. The shape is schema/passport.schema.json; sign-in claims it through
// POST /api/passport. Runs in the page (window.__calruniaPassport) and under vitest (passport-contract.test.ts).
(function (root) {
  "use strict";
  var SPIRITS_KEY = "oag.spirits.v1", VESSEL_KEY = "oag.vessel.v1", GUEST_KEY = "calrunia.guest.v1";
  var PLACES = ["vessel", "sprout", "cave", "root", "between", "element-lands"];
  // The ship's own rooms and lands, as places of calrunia/world.yaml (vessel.js PLACES).
  var SHIP_PLACE = { home: "vessel", hall: "cave", bigmind: "cave", wood: "element-lands", fire: "element-lands", earth: "element-lands", metal: "element-lands", water: "element-lands" };
  var EPOCH = "1970-01-01T00:00:00.000Z";

  function str(x) { return typeof x === "string" ? x : null; }
  function when(x) { return typeof x === "string" && !isNaN(Date.parse(x)) ? x : null; }
  function count(x) { x = Math.floor(Number(x)); return isFinite(x) && x > 0 ? x : 0; }

  function foldSpirit(r) {
    var born = r.born && typeof r.born === "object" ? r.born : {};
    var lineage = Array.isArray(r.lineage) ? r.lineage.filter(function (l) { return l && str(l.where) && when(l.at); }).slice(-60) : [];
    return {
      id: String(r.id), name: str(r.name) || "", element: str(r.element), family: str(r.family), sittings: count(r.sittings),
      born: { where: str(born.where) || "the caves", at: when(born.at) || EPOCH },
      lineage: lineage.map(function (l) { return { where: l.where, at: l.at }; }),
      loadout: r.loadout === true,
      care: null, // spirit care is not tracked by any place yet (spirit-care.md); the passport holds the slot
    };
  }
  function foldEmber(m) {
    var look = Number(m.look);
    return { id: String(m.id), source: str(m.source) || "preset", element: str(m.element), look: isFinite(look) ? Math.max(0, Math.min(1, look)) : 0.5,
      state: str(m.state) || "loose", at: when(m.at) || EPOCH, label: (str(m.label) || "").slice(0, 40) };
  }

  // fold(spiritsRecord, vesselRecord, guestId, at) -> passport. Pure: the records are what the places stored, or null.
  function purse(spirits) { var n = spirits && spirits.v === 1 ? Number(spirits.vibeulons) : 0; return n > 0 ? Math.floor(n) : 0; }
  function fold(spirits, vessel, guestId, at) {
    var reached = {};
    var list = spirits && spirits.v === 1 && Array.isArray(spirits.spirits) ? spirits.spirits.filter(function (r) { return r && r.id; }) : [];
    var seen = {}, out = [], inLoadout = 0;
    list.forEach(function (r) {
      if (seen[r.id]) return; seen[r.id] = true;
      var s = foldSpirit(r);
      if (s.loadout && ++inLoadout > 3) s.loadout = false;
      out.push(s);
    });
    if (out.length) reached.cave = true;
    var ship = vessel && vessel.v === 1 ? vessel : null;
    var embers = [];
    if (ship) {
      reached.vessel = true;
      var places = ship.places && typeof ship.places === "object" ? ship.places : {};
      Object.keys(places).forEach(function (id) { if (places[id] === "visited" && SHIP_PLACE[id]) reached[SHIP_PLACE[id]] = true; });
      embers = (Array.isArray(ship.embers) ? ship.embers : []).filter(function (m) { return m && m.id; }).map(foldEmber);
    }
    return {
      v: 1,
      player: { id: null, name: null, guest_id: guestId },
      spirits: out,
      hand: [], // Chapter 1's end writes its hand here once the demo is done (pass calrunia-world1, build brief 4)
      qi: 0, // the ship's fuel is its own gauge, not the qi meter (cw-qi-meter-scales); no place fills qi yet
      vibeulons: purse(spirits), // the WAVE room mints them into oag.spirits.v1 (board gw-unkept-vibeulon); the ship mints none yet
      embers: embers,
      places_reached: PLACES.filter(function (p) { return reached[p]; }),
      updated_at: at || new Date().toISOString(),
    };
  }

  function readJson(key) { try { return JSON.parse(root.localStorage.getItem(key) || "null"); } catch (e) { return null; } }
  function guestId() {
    var id = null;
    try { id = root.localStorage.getItem(GUEST_KEY); } catch (e) { /* storage blocked */ }
    if (id) return id;
    id = "guest-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    try { root.localStorage.setItem(GUEST_KEY, id); } catch (e) { /* the id lasts this page only */ }
    return id;
  }
  // The guest passport as it stands in this browser now.
  function read() { return fold(readJson(SPIRITS_KEY), readJson(VESSEL_KEY), guestId()); }

  var api = { KEYS: { spirits: SPIRITS_KEY, vessel: VESSEL_KEY, guest: GUEST_KEY }, PLACES: PLACES, fold: fold, read: read };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.__calruniaPassport = api;
})(typeof window !== "undefined" ? window : globalThis);
