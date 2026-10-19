// The inner vessel: the ship the WAVE room rides in (Six-faces-council council/callsheets/inner-vessel.md, pass inner-vessel1,
// and Wendell's board answers of 19 October 2026 in council/ledger/2026-10-19-pull-223918.json).
// The WAVE room is the ship's cabin. The ship does not fly to places; places are reached from it (Wendell, iv-cave-only: "they are
// places one can travel to from the ship"). A finished route gives one ember and the player chooses what kind of part it becomes
// (iv-kind-chosen); intensity sets only a part's look (iv-look-only). Fuel is the ship's charge, a gauge like No Man's Sky's
// (Wendell, iv-no-mirror): the ship starts with some, it is mined at the places the ship reaches, and the spirits aboard power it.
// A daemon is never a part (iv-daemon-not-part), but one that has become an ally makes a part for the ship (his steer on the
// same row). The 321 bonus carries over as fuel (iv-no-bonus, overruled: "I think it should").
// Pure functions over a plain record, plus a localStorage store (`oag.vessel.v1`) and the dock panel. Runs in the cave page
// (window.__oagVessel) and under node for vessel-test.mjs.
(function (root) {
  "use strict";
  var KEY = "oag.vessel.v1";
  var KINDS = ["helm", "sail", "keel", "hold", "lens"];
  var KIND_WORDS = { helm: "Helm", sail: "Sail", keel: "Keel", hold: "Hold", lens: "Lens" };
  var SOURCES = ["sample", "wave", "321", "preset", "symbol", "fiction", "ally"];
  var HULL = { w: 3, h: 3 };
  // Fuel (positions iv-fuel-*, standing unless he flips them): the numbers are small so the gauge reads at a glance.
  var FUEL = { start: 3, cap: 6, fit: 1, bonus: 2, perSpirit: 1 };
  // Places reached from the ship. Built ones are charted from the start, so nothing on the demo path waits on fuel; the element
  // lands come after the Chapter 1 demo (element-settings.md) and cannot be charted yet. `yield` is the fuel a visit mines there.
  var PLACES = [
    { id: "home", name: "The WAVE room", built: true, yield: 0 },
    { id: "hall", name: "The hall of the six", built: true, yield: 2 },
    { id: "bigmind", name: "The Big Mind cave", built: true, yield: 2 },
    { id: "wood", name: "The wood land", built: false, yield: 2, cost: 3 },
    { id: "fire", name: "The fire land", built: false, yield: 2, cost: 3 },
    { id: "earth", name: "The earth land", built: false, yield: 2, cost: 3 },
    { id: "metal", name: "The metal land", built: false, yield: 2, cost: 3 },
    { id: "water", name: "The water land", built: false, yield: 2, cost: 3 },
  ];
  var STAGE_POWER = { gas: 0, core: 1, hologram: 2, creature: 3, ally: 4 }; // a spirit's stage raises how much fuel the tank holds

  function placeOf(id) { for (var i = 0; i < PLACES.length; i++) if (PLACES[i].id === id) return PLACES[i]; return null; }
  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  var seq = 0;
  function newId(p, at) { seq++; return p + "-" + String(at || "").replace(/[^0-9]/g, "").slice(0, 14) + "-" + seq + Math.random().toString(36).slice(2, 6); }
  function clampLook(n) { n = Number(n); return isFinite(n) ? Math.max(0, Math.min(1, n / 10)) : 0.5; }

  // A new ship: the sample ship already flies (bound 1): a Helm and a Sail fitted, and a little fuel.
  function blank(at) {
    at = at || new Date().toISOString();
    var v = { v: 1, hull: copy(HULL), fuel: FUEL.start, embers: [], parts: [], places: {}, log: [] };
    PLACES.forEach(function (p) { v.places[p.id] = p.built ? "charted" : "unseen"; });
    v.places.home = "visited";
    v.parts.push({ id: "sample-helm", kind: "helm", element: null, emberId: null, look: 0.5, state: "fitted", cell: 1, lineage: { source: "sample", at: at, label: "" } });
    v.parts.push({ id: "sample-sail", kind: "sail", element: null, emberId: null, look: 0.5, state: "fitted", cell: 7, lineage: { source: "sample", at: at, label: "" } });
    return v;
  }

  function capOf(v, spirits) {
    return FUEL.cap + (spirits || []).reduce(function (n, s) { return n + (STAGE_POWER[s && s.stage] || 0); }, 0);
  }
  function addFuel(v, n, spirits, why, at) {
    var before = v.fuel; v.fuel = Math.min(capOf(v, spirits), v.fuel + Math.max(0, n | 0));
    if (v.fuel > before) v.log.push({ at: at, what: "fuel", n: v.fuel - before, why: why });
    return v.fuel - before;
  }

  // One finished route gives one ember. route: { source, ref, element, intensity, bonus, label }. Nothing it carries is text the
  // player wrote, except an optional label of their own; intensity becomes look only.
  function mintEmber(v, route, at) {
    v = copy(v); at = at || new Date().toISOString();
    var source = SOURCES.indexOf(route.source) > 0 ? route.source : "preset";
    var e = { id: newId("ember", at), source: source, ref: route.ref || null, element: route.element || null, look: clampLook(route.intensity),
      bonus: !!route.bonus, daemon: route.daemon || null, at: at, label: typeof route.label === "string" ? route.label.slice(0, 40) : "", state: "loose" };
    v.embers.push(e);
    v.log.push({ at: at, what: "ember", source: source });
    if (e.bonus) addFuel(v, FUEL.bonus, route.spirits, "bonus", at);
    return { vessel: v, ember: e };
  }

  // A daemon that has become an ally makes a part for the ship, once (his steer on iv-daemon-not-part). The daemon is the maker,
  // never the part.
  function allyMakes(v, daemonId, at) {
    if (!daemonId || v.embers.some(function (e) { return e.source === "ally" && e.daemon === daemonId; })) return { vessel: v, ember: null };
    return mintEmber(v, { source: "ally", ref: daemonId, daemon: daemonId }, at);
  }

  // The player gives a loose ember a form: any kind, from any route (iv-kind-chosen).
  function form(v, emberId, kind, at) {
    if (KINDS.indexOf(kind) < 0) return { ok: false, why: "kind" };
    v = copy(v); at = at || new Date().toISOString();
    var e = v.embers.filter(function (x) { return x.id === emberId && x.state === "loose"; })[0];
    if (!e) return { ok: false, why: "ember" };
    e.state = "formed";
    var p = { id: newId("part", at), kind: kind, element: e.element, emberId: e.id, look: e.look, state: "loose", cell: null,
      lineage: { source: e.source, ref: e.ref, daemon: e.daemon, at: e.at, label: e.label } };
    v.parts.push(p);
    return { ok: true, vessel: v, part: p };
  }

  function cellFree(v, cell) { return !v.parts.some(function (p) { return p.state === "fitted" && p.cell === cell; }); }
  // Fit a part into a hull cell. It takes one fuel to wake a part; the sample ship needs none, so the demo never waits on this.
  function fit(v, partId, cell) {
    if (!(cell >= 0 && cell < v.hull.w * v.hull.h) || (cell | 0) !== cell) return { ok: false, why: "cell" };
    if (!cellFree(v, cell)) return { ok: false, why: "occupied" };
    var p = v.parts.filter(function (x) { return x.id === partId; })[0];
    if (!p || p.state === "composted") return { ok: false, why: "part" };
    if (p.state !== "fitted" && v.fuel < FUEL.fit) return { ok: false, why: "fuel" };
    v = copy(v); p = v.parts.filter(function (x) { return x.id === partId; })[0];
    if (p.state !== "fitted") v.fuel -= FUEL.fit;
    p.state = "fitted"; p.cell = cell;
    return { ok: true, vessel: v };
  }
  // Resting and composting are ends too (bound 8). A rested part keeps its lineage; a composted one gives back its fuel.
  function rest(v, partId) {
    v = copy(v); var p = v.parts.filter(function (x) { return x.id === partId; })[0];
    if (!p) return { ok: false, why: "part" };
    p.state = "resting"; p.cell = null; return { ok: true, vessel: v };
  }
  function compost(v, partId) {
    v = copy(v); var p = v.parts.filter(function (x) { return x.id === partId; })[0];
    if (!p || p.lineage.source === "sample") return { ok: false, why: "part" };
    p.state = "composted"; p.cell = null; v.fuel = Math.max(v.fuel, Math.min(FUEL.cap, v.fuel + FUEL.fit)); return { ok: true, vessel: v };
  }

  function fitted(v, kind) { return v.parts.some(function (p) { return p.state === "fitted" && p.kind === kind; }); }
  // The only gate (bound 1): a Helm and a Sail.
  function canLaunch(v) { return fitted(v, "helm") && fitted(v, "sail"); }
  function canReach(v, placeId) { return canLaunch(v) && (v.places[placeId] === "charted" || v.places[placeId] === "visited"); }

  // Charting opens a route to a new place and spends fuel; after that the way is free, like Warp-G. Unbuilt places wait.
  function chart(v, placeId) {
    var p = placeOf(placeId);
    if (!p) return { ok: false, why: "place" };
    if (!p.built) return { ok: false, why: "unbuilt" };
    if (v.places[placeId] !== "unseen") return { ok: true, vessel: v };
    if (v.fuel < (p.cost || 0)) return { ok: false, why: "fuel" };
    v = copy(v); v.fuel -= p.cost || 0; v.places[placeId] = "charted"; return { ok: true, vessel: v };
  }

  // A visit that ends mines the place's fuel and marks it visited. A crossing ends an encounter; it completes no quest.
  function visited(v, placeId, spirits, at) {
    var p = placeOf(placeId); if (!p) return { vessel: v, mined: 0 };
    v = copy(v); at = at || new Date().toISOString();
    v.places[placeId] = "visited";
    var mined = addFuel(v, p.yield, spirits, "mined:" + placeId, at);
    return { vessel: v, mined: mined };
  }
  // A WAVE run worked with spirits aboard: each spirit in the loadout gives one fuel (Wendell, iv-no-mirror: "Spirits energy I do
  // think can power the ship").
  function spiritsPower(v, spirits, at) {
    v = copy(v); var n = addFuel(v, FUEL.perSpirit * (spirits || []).length, spirits, "spirits", at || new Date().toISOString());
    return { vessel: v, gained: n };
  }

  // What the ship says when the player comes to the helm: what it is carrying, never a judgement (the Shaman's greeting).
  function greeting(v) {
    var loose = v.embers.filter(function (e) { return e.state === "loose"; }).length;
    var made = v.parts.filter(function (p) { return p.lineage.source !== "sample" && p.state !== "composted"; }).length;
    if (loose) return loose === 1 ? "You brought an ember aboard. What should it become?" : "You brought " + loose + " embers aboard. What should they become?";
    if (made) return made === 1 ? "The part you made is aboard." : "The " + made + " parts you made are aboard.";
    return "The ship is ready. Every door in the WAVE room is a place you can reach from here.";
  }

  // ---- store ------------------------------------------------------------------------------------------------------------
  var ls = function () { try { return root.localStorage || null; } catch (e) { return null; } };
  function read() {
    var s = ls(); if (!s) return blank();
    try { var v = JSON.parse(s.getItem(KEY) || "null"); return v && v.v === 1 && Array.isArray(v.parts) ? v : blank(); } catch (e) { return blank(); }
  }
  function write(v) { var s = ls(); if (!s) return false; try { s.setItem(KEY, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function aboard() {
    var st = root.__oagSpiritStore, forms = root.__oagSpiritForms;
    if (!st || !st.loadout) return [];
    return st.loadout().map(function (s) { return { id: s.id, stage: forms && forms.stageOf ? forms.stageOf(s.sittings) : "gas" }; });
  }
  // The cave calls these; each reads, changes and writes the stored ship.
  var store = {
    get: read,
    wipe: function () { var s = ls(); if (s) try { s.removeItem(KEY); } catch (e) { /* nothing to remove */ } },
    route: function (route) { route = Object.assign({}, route, { spirits: aboard() }); var r = mintEmber(read(), route); write(r.vessel); return r.ember; },
    ally: function (daemonId) { var r = allyMakes(read(), daemonId); write(r.vessel); return r.ember; },
    visited: function (placeId) { var r = visited(read(), placeId, aboard()); write(r.vessel); return r.mined; },
    spirits: function () { var sp = aboard(); if (!sp.length) return 0; var r = spiritsPower(read(), sp); write(r.vessel); return r.gained; },
  };

  // ---- the dock ---------------------------------------------------------------------------------------------------------
  // The ship's panel, opened from the WAVE room. Plain DOM; every control carries a data-vessel-* hook for the browser checks.
  var CSS = ".oagv{position:absolute;inset:8px;z-index:9;background:#0e0e1e;color:#ece8f4;border:1px solid rgba(255,255,255,.25);" +
    "border-radius:12px;padding:44px 14px 14px;overflow:auto;font:15px/1.4 system-ui,sans-serif}.oagv h2{margin:0 0 6px;font-size:19px}" +
    ".oagv p{margin:6px 0}.oagv button{font:inherit;min-height:44px;padding:8px 12px;margin:4px 4px 0 0;border-radius:8px;" +
    "border:1px solid rgba(255,255,255,.35);background:rgba(60,50,110,.6);color:inherit}.oagv button[disabled]{opacity:.45}" +
    ".oagv-grid{display:grid;grid-template-columns:repeat(3,64px);gap:6px;margin:8px 0}.oagv-cell{width:64px;height:64px;" +
    "border:1px dashed rgba(255,255,255,.3);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;padding:0}" +
    ".oagv-cell.on{border-style:solid;background:rgba(120,100,200,.45)}.oagv-gauge{height:12px;border-radius:6px;background:rgba(255,255,255,.12);overflow:hidden}" +
    ".oagv-gauge i{display:block;height:100%;background:linear-gradient(90deg,#e0a040,#f6e080)}.oagv small{opacity:.75}";
  var ELEMENT_HEX = { wood: "#5fae6e", fire: "#e0603a", earth: "#c8a050", metal: "#c8d0dc", water: "#4a8ad8" };

  function openDock(container, o) {
    o = o || {};
    var doc = container.ownerDocument;
    if (!doc.getElementById("oagv-css")) { var st = doc.createElement("style"); st.id = "oagv-css"; st.textContent = CSS; doc.head.appendChild(st); }
    var box = doc.createElement("div"); box.className = "oagv"; box.setAttribute("data-vessel-dock", ""); container.appendChild(box);
    var picked = null, forming = null;
    function h(tag, attrs, text) { var n = doc.createElement(tag); for (var k in attrs || {}) n.setAttribute(k, attrs[k]); if (text != null) n.textContent = text; return n; }
    function button(text, attrs, fn, off) { var b = h("button", attrs, text); if (off) b.disabled = true; b.onclick = fn; return b; }
    function close() { box.remove(); if (o.onClose) o.onClose(); }
    function draw() {
      var v = read(), sp = aboard(), cap = capOf(v, sp);
      box.innerHTML = "";
      box.appendChild(h("h2", {}, "The ship"));
      box.appendChild(h("p", { "data-vessel-greeting": "" }, greeting(v)));
      var g = h("div", { class: "oagv-gauge", "data-vessel-fuel": String(v.fuel), "data-vessel-cap": String(cap), role: "meter", "aria-label": "Fuel", "aria-valuemin": "0", "aria-valuemax": String(cap), "aria-valuenow": String(v.fuel) });
      var fill = h("i"); fill.style.width = Math.round(100 * v.fuel / cap) + "%"; g.appendChild(fill);
      box.appendChild(h("small", {}, "Fuel " + v.fuel + " of " + cap + (sp.length ? ". The spirits aboard let the tank hold more." : ". Mine more at the places you reach.")));
      box.appendChild(g);
      // Embers waiting for a form.
      var loose = v.embers.filter(function (e) { return e.state === "loose"; });
      loose.forEach(function (e) {
        var row = h("div", { "data-vessel-ember": e.id });
        row.appendChild(h("p", {}, e.source === "ally" ? "An ally made this ember for the ship." : "An ember from a finished " + (e.source === "321" ? "3-2-1" : e.source === "wave" ? "W.A.V.E." : "route") + "."));
        if (forming === e.id) KINDS.forEach(function (k) { row.appendChild(button(KIND_WORDS[k], { "data-vessel-kind": k }, function () { var r = form(read(), e.id, k); if (r.ok) { write(r.vessel); picked = r.part.id; } forming = null; draw(); })); });
        else row.appendChild(button("Give it a form", { "data-vessel-form": e.id }, function () { forming = e.id; draw(); }));
        box.appendChild(row);
      });
      // The hull: tap a part, then a cell.
      box.appendChild(h("p", {}, picked ? "Tap a free cell to fit it." : "The hull. Tap a part to move it."));
      var grid = h("div", { class: "oagv-grid", "data-vessel-hull": "" });
      for (var c = 0; c < v.hull.w * v.hull.h; c++) (function (cell) {
        var p = v.parts.filter(function (x) { return x.state === "fitted" && x.cell === cell; })[0];
        var b = button(p ? KIND_WORDS[p.kind] : "", { class: "oagv-cell" + (p ? " on" : ""), "data-vessel-cell": String(cell) }, function () {
          if (p) { picked = picked === p.id ? null : p.id; draw(); return; }
          if (!picked) return;
          var r = fit(read(), picked, cell); if (r.ok) { write(r.vessel); picked = null; } else if (r.why === "fuel") alert("Waking a part takes one fuel. Mine some at a place you reach from the ship.");
          draw();
        });
        if (p && p.element) b.style.boxShadow = "inset 0 0 0 3px " + (ELEMENT_HEX[p.element] || "#fff");
        if (p) b.style.opacity = String(0.65 + 0.35 * p.look);
        grid.appendChild(b);
      })(c);
      box.appendChild(grid);
      var spare = v.parts.filter(function (p) { return p.state === "loose" || p.state === "resting"; });
      spare.forEach(function (p) { box.appendChild(button(KIND_WORDS[p.kind] + (p.state === "resting" ? " (resting)" : ""), { "data-vessel-part": p.id, "aria-pressed": String(picked === p.id) }, function () { picked = p.id; draw(); })); });
      if (picked) {
        var pk = v.parts.filter(function (p) { return p.id === picked; })[0];
        if (pk && pk.state === "fitted") box.appendChild(button("Let it rest", { "data-vessel-rest": "" }, function () { var r = rest(read(), picked); if (r.ok) write(r.vessel); picked = null; draw(); }));
        if (pk && pk.lineage.source !== "sample") box.appendChild(button("Compost it", { "data-vessel-compost": "" }, function () { var r = compost(read(), picked); if (r.ok) write(r.vessel); picked = null; draw(); }));
      }
      // Places reached from the ship.
      box.appendChild(h("h2", {}, "Places from the ship"));
      PLACES.forEach(function (p) {
        var s = v.places[p.id], line = h("p", { "data-vessel-place": p.id, "data-vessel-place-state": s });
        line.textContent = p.name + (p.id === "home" ? ": you are here." : !p.built ? ": not charted yet." : s === "visited" ? ": visited." : ": charted.");
        box.appendChild(line);
      });
      if (!canLaunch(v)) box.appendChild(h("p", { "data-vessel-grounded": "" }, "The ship needs a Helm and a Sail fitted to reach anywhere."));
      box.appendChild(button("Back to the room", { "data-vessel-close": "" }, close));
    }
    draw();
    return { close: close, redraw: draw };
  }

  var api = { KEY: KEY, KINDS: KINDS, SOURCES: SOURCES, FUEL: FUEL, PLACES: PLACES, HULL: HULL, blank: blank, capOf: capOf, mintEmber: mintEmber,
    allyMakes: allyMakes, form: form, fit: fit, rest: rest, compost: compost, canLaunch: canLaunch, canReach: canReach, chart: chart,
    visited: visited, spiritsPower: spiritsPower, greeting: greeting, store: store, openDock: openDock };
  root.__oagVessel = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
