// The living ship's world, read from what the player carries (Six-faces-council council/callsheets/inner-vessel.md, brief
// "Living ship build"; Wendell's pick A on sd-still-pick, 2026-10-24). Nothing here is drawn as a number (board sd-depth-rule:
// every surface is an inviting image or an explorable space, never a panel). What the record holds becomes the world instead:
//   inner energy (the ship's fuel, qi, vibeulons and embers) -> how big the island is and how much light it has
//   spirits in oag.spirits.v1                                -> spirits living on the island, sized by their stage
//   embers from inner work (any source but the sample)      -> chambers grown at the island's rim; one bud always waits
//   vibeulons                                                -> gold motes over the garden (condensed qi)
//   the hand from Chapter 1                                  -> cards pinned by the den's door, with the blank one
// Wendell, 2026-10-24: "It represents the internal energy available for Taking action" and "It grows new rooms as you do inner
// work. The spirits and people inside the world and the emergent story is what makes it feel alive".
// Pure. Runs in the page (window.__calruniaShipWorld) and under node (ship-world-test.mjs).
(function (root) {
  "use strict";
  var MAX_SPIRITS = 8, MAX_CHAMBERS = 8, MAX_MOTES = 12;
  var ISLAND = { min: 8, max: 13.5 }; // metres of island radius, from no energy to all of it
  var STAGES = ["gas", "core", "hologram", "creature", "ally"], AT = [0, 2, 4, 6, 8]; // cave/spirit-forms.js stageOf
  var GLOW = { wood: 0x9fe8a8, fire: 0xffa878, earth: 0xffd27a, metal: 0xe6ecf8, water: 0x9ff6e4 };
  var PLAIN = 0xfff0b0;

  function num(x) { x = Number(x); return isFinite(x) && x > 0 ? x : 0; }
  function stageOf(n) { n = n | 0; for (var i = AT.length - 1; i > 0; i--) if (n >= AT[i]) return STAGES[i]; return "gas"; }
  function glowOf(element) { return GLOW[element] || PLAIN; }

  // Energy in [0, 1): grows fast at first and never fills, so there is always more island to grow into.
  function energyOf(passport, vessel) {
    var fuel = vessel ? num(vessel.fuel) : 0;
    var embers = vessel && Array.isArray(vessel.embers) ? vessel.embers.length : (passport.embers || []).length;
    var raw = fuel + num(passport.qi) + 0.5 * num(passport.vibeulons) + embers;
    return 1 - Math.exp(-raw / 12);
  }

  // worldOf(passport, vessel) -> what the scene builds. passport: a checked passport (or guest.js fold); vessel: oag.vessel.v1 or null.
  function worldOf(passport, vessel) {
    var e = energyOf(passport, vessel);
    var list = (passport.spirits || []).slice();
    // the spirit that meets you is the one you brought along (loadout), else the first
    list.sort(function (a, b) { return (b.loadout ? 1 : 0) - (a.loadout ? 1 : 0); });
    var spirits = list.slice(0, MAX_SPIRITS).map(function (s, i) {
      var stage = stageOf(s.sittings);
      return { id: s.id, name: s.name || null, element: s.element || null, glow: glowOf(s.element), stage: stage,
        size: 0.8 + 0.12 * STAGES.indexOf(stage), lead: i === 0 };
    });
    var embers = vessel && Array.isArray(vessel.embers) ? vessel.embers : (passport.embers || []);
    var chambers = embers.filter(function (m) { return m && m.source !== "sample"; }).slice(0, MAX_CHAMBERS).map(function (m) {
      return { id: m.id, element: m.element || null, glow: glowOf(m.element), label: m.label || "", source: m.source };
    });
    var cards = (passport.hand || []).filter(function (h) { return h && h.title; }).map(function (h) { return { id: h.id, kind: h.kind, title: h.title }; });
    return {
      energy: e,
      islandR: ISLAND.min + (ISLAND.max - ISLAND.min) * e,
      light: 0.35 + 0.65 * e,
      trees: 5 + Math.round(6 * e),
      blossoms: 6 + Math.round(18 * e),
      spirits: spirits,
      chambers: chambers,
      motes: Math.min(MAX_MOTES, Math.floor(num(passport.vibeulons))),
      cards: cards,
    };
  }

  var api = { worldOf: worldOf, energyOf: energyOf, stageOf: stageOf, glowOf: glowOf, ISLAND: ISLAND, MAX_SPIRITS: MAX_SPIRITS, MAX_CHAMBERS: MAX_CHAMBERS };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.__calruniaShipWorld = api;
})(typeof window !== "undefined" ? window : globalThis);
