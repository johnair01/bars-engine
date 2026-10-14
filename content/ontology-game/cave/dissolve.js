// Dissolving a spirit into yourself: the other way to dismiss one.
//
// Wendell, 14 October 2026: "Players can also dissolve charged spirits (a form of dismissal) by going through a form of
// WAVE-like process. 'Ice to water water to gas gas to pure spirit'. Ice in this case is the current density of the charge
// (allies being the highest density) and charge sprites in their particle form being their gas style energy. Pure spirit is
// mana itself. This is how players can increase their own stats by taking spirits into themselves instead of using them as
// allies".
//
// Four states, densest first: ice, water, gas, pure spirit. The spirit generator's five forms sit on them by density (choice):
// the living creature and the highest ally form are ice, the hologram and the core are water, the gas is gas. A spirit that
// walks with the player in the cave walks as an ally, so it is ice; one breathed out at the room's fork walks lighter, so it
// is water. Each step down is one breath with one line, in the W.A.V.E.'s order (warm it, let it rise, breathe it in), and
// pays one mana, so a denser spirit pays more: ice 3, water 2, gas 1. The mana goes into the stat its element grows fastest
// (spirit-five-stats: Earth HP, Fire Power, Metal Guard, Water Magic, Wood Speed). The spirit is gone after; stopping before
// the last breath keeps it as it was. The player's stats are kept on this device (STATS_KEY).
//
// The cave calls run(spirit, hooks) from the spirit's card (cave.js spiritPanel). Needs cave.js loaded first.
(function () {
  "use strict";
  var CAVE = window.__oagCave; if (!CAVE || !CAVE.kit) return;
  var K = CAVE.kit, el = K.el, P = K.P, btn = K.btn, row = K.row;
  var STATES = ["ice", "water", "gas", "spirit"];
  var FORM_STATE = { ally: "ice", creature: "ice", hologram: "water", core: "water", gas: "gas" };
  var STAT_OF = { fire: "Power", anger: "Power", water: "Magic", sadness: "Magic", wood: "Speed", joy: "Speed", metal: "Guard", fear: "Guard", earth: "HP", neutrality: "HP" };
  var STAT_NAMES = ["HP", "Power", "Guard", "Magic", "Speed"];
  var STATS_KEY = "oag:you:stats";
  // One page for each step down: [from, to, title, words, button].
  var STEPS = [
    ["ice", "water", "Ice to water", "Thank it for what it carried. Let your attention warm it until it softens.", "Warm it"],
    ["water", "gas", "Water to gas", "Breathe out, and let it lift off you as mist.", "Let it rise"],
    ["gas", "spirit", "Gas to pure spirit", "Breathe in, and take it into yourself.", "Breathe it in"],
  ];

  // Not while perceptual shadow hides it (polarity 1 to 10; 0, none or flooding below 0 is seen). A shadow spirit (o.shadow) can
  // be dissolved once it is fully revealed, and fully revealing it ties it to an element, which the WAVE room's reveal sets on
  // o.element (Wendell, board 2026-10-14 22:52, sd-shadow-skip overruled: "It has an element and can be dissolved but only
  // after it's fully revealed. Fully revealing it means tying it to an element.").
  function canDissolve(o) { return !!o && !(o.polarity > 0) && !(o.shadow && !statOf(o)); }
  function stateOf(o) { return (o && o.form && FORM_STATE[o.form]) || (o && o.lighter ? "water" : "ice"); }
  function stepsFor(o) { var i = STATES.indexOf(stateOf(o)); return STEPS.slice(i); }
  function manaOf(o) { return stepsFor(o).length; }
  function statOf(o) { return STAT_OF[String((o && o.element) || "").toLowerCase()] || null; }
  function readStats() {
    var s = {}; STAT_NAMES.forEach(function (k) { s[k] = 0; });
    try { var got = JSON.parse(localStorage.getItem(STATS_KEY) || "{}"); STAT_NAMES.forEach(function (k) { if (got[k] > 0) s[k] = got[k]; }); } catch (e) { /* storage blocked */ }
    return s;
  }
  function addStat(stat, n) {
    var s = readStats(); s[stat] += n;
    try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch (e) { /* storage blocked: the rise still shows this visit */ }
    return s;
  }
  function statsLine(s) {
    s = s || readStats();
    var on = STAT_NAMES.filter(function (k) { return s[k] > 0; });
    return on.length ? on.map(function (k) { return k + " +" + s[k]; }).join(" · ") : "";
  }
  function breathMs() { return window.__oagDissolveMs != null ? window.__oagDissolveMs : (K.BREATH.inS + K.BREATH.outS) * 1000; }

  // ---- how it looks: the spirit's group (cave.js buildSpirit: orb, aura, label) changes state by state ---------------------
  function setUp(THREE, g, from) {
    var u = g.userData, orb = u.orb;
    var ice = new THREE.Mesh(new THREE.IcosahedronGeometry(0.44, 0), new THREE.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.5, depthWrite: false }));
    var n = 70, pos = new Float32Array(n * 3), dirs = [];
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, z = Math.random() * 2 - 1, r = Math.sqrt(1 - z * z);
      dirs.push([r * Math.cos(a), z, r * Math.sin(a), 0.6 + 0.4 * Math.random()]);
    }
    var motes = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: u.color.getHex(), size: 0.09, transparent: true, opacity: 0, depthWrite: false }));
    motes.geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.add(ice); g.add(motes);
    u.melt = { ice: ice, motes: motes, dirs: dirs, spread: 0.3 };
    show(g, from, 0);
    return u.melt;
  }
  function placeMotes(m, spread, to, k) {
    var p = m.motes.geometry.attributes.position;
    m.dirs.forEach(function (d, i) {
      var x = d[0] * spread * d[3], y = d[1] * spread * d[3], z = d[2] * spread * d[3];
      if (to) { x += (to.x - x) * k; y += (to.y - y) * k; z += (to.z - z) * k; }
      p.array[i * 3] = x; p.array[i * 3 + 1] = y; p.array[i * 3 + 2] = z;
    });
    p.needsUpdate = true;
  }
  // show(g, state, k): k runs 0 to 1 over the breath that takes the spirit out of `state` into the next one.
  function show(g, state, k) {
    var u = g.userData, m = u.melt, orb = u.orb;
    if (state === "ice") {
      m.ice.visible = true; m.ice.scale.setScalar(1 - 0.9 * k); m.ice.material.opacity = 0.5 * (1 - k); m.ice.rotation.y = k * 1.5;
      orb.visible = true; orb.material.opacity = 0.9; orb.scale.set(1 + 0.25 * k, 1 - 0.3 * k, 1 + 0.25 * k);
      m.motes.material.opacity = 0;
    } else if (state === "water") {
      m.ice.visible = false; orb.visible = true; orb.scale.set(1.25 - 0.25 * k, 0.7 + 0.3 * k, 1.25 - 0.25 * k); orb.material.opacity = 0.9 * (1 - k);
      m.motes.material.opacity = 0.9 * k; placeMotes(m, 0.3 + 0.9 * k);
      if (u.aura) u.aura.visible = k < 0.5;
    } else if (state === "gas") {
      m.ice.visible = false; orb.visible = false; if (u.aura) u.aura.visible = false;
      m.motes.material.opacity = 0.9 * (1 - 0.6 * k); placeMotes(m, 1.2, u.toYou, k);
      if (u.label) u.label.material.opacity = 1 - k;
    }
  }

  // ---- the flow, in the spirit card's box ------------------------------------------------------------------------------------
  // hooks: { THREE, box, tween(ms, fn(k), done), you() -> the figure's world position (a Vector3) or null,
  //          gone(o) (take it out of the spirits list and the scene), close() (hide the box) }
  function run(o, h) {
    var g = o.g, steps = stepsFor(o), stat = statOf(o), mana = steps.length;
    if (!g || !g.userData.orb || !canDissolve(o)) return;
    o.dissolving = true;
    var m = setUp(h.THREE, g, stateOf(o)), busy = false;
    function page(i) {
      h.box.innerHTML = ""; h.box.style.display = "";
      var s = steps[i];
      h.box.setAttribute("data-dissolve-state", s[0]);
      h.box.appendChild(el("h2", { text: s[2] }));
      h.box.appendChild(P(o.name + (i ? "" : " is " + (s[0] === "ice" ? "as dense as an ally" : s[0] === "water" ? "lighter, loose as water" : "only sparks now") + ".")));
      h.box.appendChild(P(s[3]));
      var go = btn(s[4], { "data-dissolve-breathe": s[0] }, function () {
        if (busy) return; busy = true; go.disabled = true; if (stop) stop.disabled = true;
        if (s[0] === "gas" && h.you) { var w = h.you(); if (w) g.userData.toYou = g.worldToLocal(w.clone()); }
        h.tween(breathMs(), function (k) { show(g, s[0], k); }, function () {
          busy = false;
          if (i + 1 < steps.length) { show(g, steps[i + 1][0], 0); page(i + 1); } else end();
        });
      });
      var stop = i + 1 < steps.length ? btn("Stop, and keep it", { "data-dissolve-stop": "" }, keep, true) : null;
      h.box.appendChild(row(stop ? [go, stop] : [go]));
    }
    function keep() {
      if (busy) return;
      var u = g.userData; g.remove(m.ice); g.remove(m.motes); u.melt = null; u.orb.visible = true; u.orb.scale.set(1, 1, 1); u.orb.material.opacity = 0.9;
      if (u.aura) u.aura.visible = true; if (u.label) u.label.material.opacity = 1;
      o.dissolving = false; h.box.removeAttribute("data-dissolve-state"); h.close();
    }
    function end() {
      h.gone(o);
      var s = stat ? addStat(stat, mana) : null;
      h.box.innerHTML = ""; h.box.setAttribute("data-dissolve-state", "spirit");
      h.box.appendChild(el("h2", { text: "Pure spirit" }));
      if (stat) {
        h.box.appendChild(P(o.name + " is mana now, and it is yours. Your " + stat + " rises " + mana + ".", { "data-dissolve-gain": stat + ":" + mana }));
        h.box.appendChild(P("You: " + statsLine(s), { class: "oagc-you", "data-dissolve-stats": "" }));
        h.box.appendChild(row([btn("Back", { "data-dissolve-done": "" }, function () { h.box.removeAttribute("data-dissolve-state"); h.close(); })]));
      } else {
        // A spirit whose feeling was never named has no element, so the player says where its mana goes (choice).
        h.box.appendChild(P(o.name + " is mana now. Its feeling was never named, so put it where you need it."));
        h.box.appendChild(row(STAT_NAMES.map(function (k) {
          return btn(k, { "data-dissolve-pick": k }, function () {
            var s2 = addStat(k, mana); h.box.innerHTML = ""; h.box.appendChild(el("h2", { text: "Pure spirit" }));
            h.box.appendChild(P("Your " + k + " rises " + mana + ".", { "data-dissolve-gain": k + ":" + mana }));
            h.box.appendChild(P("You: " + statsLine(s2), { class: "oagc-you", "data-dissolve-stats": "" }));
            h.box.appendChild(row([btn("Back", { "data-dissolve-done": "" }, function () { h.box.removeAttribute("data-dissolve-state"); h.close(); })]));
          }, true);
        })));
      }
    }
    page(0);
  }

  window.__oagDissolve = { run: run, canDissolve: canDissolve, stateOf: stateOf, stepsFor: stepsFor, manaOf: manaOf, statOf: statOf, stats: readStats, statsLine: statsLine,
    STATES: STATES, FORM_STATE: FORM_STATE, STAT_OF: STAT_OF, STATS_KEY: STATS_KEY };
})();
