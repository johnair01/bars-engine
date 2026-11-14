// The one organ state: which seat of the body map has been reached, and from how deep a sitting (the basin, basin.js).
//
// Record: Six-faces-council pass method-pass2 (the seats and their channels) and Wendell's board of October 2026. A seat holds
// a floor, never an amount: the map shows what a sitting reached, not how much was poured in (mao-access-not-fill), and the
// floor sets how far the light reaches from the seat (mab-floor-sets-reach). So there is no capacity, level, count, max, xp or
// decay anywhere in this record, and the same sitting again changes nothing (mab-arrival-not-status). Only the brow is charged
// in the demo (mao-first-organ-brow); every other seat stays at rest until a later pass charges it.
//
// The graph is the generative (sheng) cycle the move table already holds (src/lib/quest-grammar/move-table.json cycles.sheng),
// read through the seat table, plus a spoke from each of the five seats to the heart, the hub every seat feeds. organs-test.mjs
// holds the two equal, so the map authors no new graph.
//
// Pure functions over a plain record, plus a localStorage store (`oag.organs.v1`). Runs in the cave page (window.__oagOrgans)
// and under node for organs-test.mjs.
(function (root) {
  "use strict";
  var KEY = "oag.organs.v1";
  // Seat and channel (method-pass2): brow Fear (Metal), crown Sadness (Water), throat Joy (Wood), solar plexus Anger (Fire),
  // dantian Neutrality (Earth). The heart has no channel: it is the hub.
  var SEATS = [
    { id: "brow", channel: "fear" },
    { id: "crown", channel: "sadness" },
    { id: "throat", channel: "joy" },
    { id: "solar", channel: "anger" },
    { id: "dantian", channel: "neutrality" },
    { id: "heart", channel: null },
  ];
  var HUB = "heart";
  // The generative cycle, channel to the channel it feeds: joy, anger, neutrality, fear, sadness, and back to joy.
  var SHENG = { joy: "anger", anger: "neutrality", neutrality: "fear", fear: "sadness", sadness: "joy" };
  // The demo charges the brow only (mao-first-organ-brow).
  var CHARGED = { fear: true };
  var TOP_FLOOR = 3;

  function seatOf(channel) { channel = String(channel || "").toLowerCase(); for (var i = 0; i < SEATS.length; i++) if (SEATS[i].channel === channel) return SEATS[i].id; return null; }
  function channelOf(seat) { for (var i = 0; i < SEATS.length; i++) if (SEATS[i].id === seat) return SEATS[i].channel; return null; }
  // The next seat on the cycle (brow feeds the crown).
  function nextOf(seat) { var c = channelOf(seat); return c ? seatOf(SHENG[c]) : null; }
  // Every edge the land draws as a watercourse: the five of the cycle, then the five spokes to the heart.
  var EDGES = [];
  SEATS.forEach(function (s) { if (s.channel) EDGES.push({ from: s.id, to: seatOf(SHENG[s.channel]), kind: "cycle" }); });
  SEATS.forEach(function (s) { if (s.id !== HUB) EDGES.push({ from: s.id, to: HUB, kind: "spoke" }); });

  function blank() { return { v: 1, seats: {} }; }
  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function valid(s) { return !!s && s.v === 1 && s.seats && typeof s.seats === "object"; }
  function floorOf(state, seat) { var r = valid(state) && state.seats[seat]; var f = r ? Number(r.floor) : 0; return isFinite(f) ? Math.max(0, Math.min(TOP_FLOOR, Math.floor(f))) : 0; }

  // A sitting reached a floor in a channel. The floor only rises; the same or a lower floor again returns the state as it was
  // (the map counts no repeats). A channel the demo does not charge returns it unchanged too.
  function raise(state, o, at) {
    var s = valid(state) ? state : blank();
    var ch = String((o && o.channel) || "").toLowerCase(), seat = seatOf(ch), f = Math.floor(Number(o && o.floor));
    if (!seat || !CHARGED[ch] || !isFinite(f) || f < 1) return s;
    f = Math.min(TOP_FLOOR, f);
    if (f <= floorOf(s, seat)) return s;
    var n = copy(s);
    n.seats[seat] = { channel: ch, floor: f, arrivedAt: at || new Date().toISOString(), source: String((o && o.source) || "") };
    return n;
  }

  // The lit run from a seat, derived when the land is drawn (nothing else is stored): 0 nothing; 1 the seat's own ground runs;
  // 2 also the path to the next seat on the cycle; 3 also the far seat answers.
  function runOf(state, seat) { return seat === HUB ? 0 : floorOf(state, seat); }

  // The floor a WAVE room sitting reached, from the steps it credited (board io-three-dantians: the lower holds the raw charge,
  // the middle works it, the upper is what it becomes): witnessed 1, accepted 2, validated 3.
  function floorFromCredit(credit) {
    credit = credit || {};
    return credit.validate ? 3 : credit.accept ? 2 : credit.witness ? 1 : 0;
  }

  // ---- store ------------------------------------------------------------------------------------------------------------
  var ls = function () { try { return root.localStorage || null; } catch (e) { return null; } };
  function read() {
    var s = ls(); if (!s) return blank();
    try { var v = JSON.parse(s.getItem(KEY) || "null"); return valid(v) ? v : blank(); } catch (e) { return blank(); }
  }
  function write(v) { var s = ls(); if (!s) return false; try { s.setItem(KEY, JSON.stringify(v)); return true; } catch (e) { return false; } }
  var store = {
    get: read,
    raise: function (o, at) { var a = read(), b = raise(a, o, at); if (b !== a) write(b); return b; },
    // A preview link (&brow=N) starts a look at the state to test: it sets the seat outright, and 0 clears it.
    preview: function (seat, floor, at) {
      var v = read(), f = Math.max(0, Math.min(TOP_FLOOR, Math.floor(Number(floor) || 0))), ch = channelOf(seat);
      if (!ch) return v;
      if (!f) delete v.seats[seat]; else v.seats[seat] = { channel: ch, floor: f, arrivedAt: at || new Date().toISOString(), source: "a preview link" };
      write(v); return v;
    },
    wipe: function () { var s = ls(); if (s) try { s.removeItem(KEY); } catch (e) { /* nothing to remove */ } },
  };

  var api = { KEY: KEY, SEATS: SEATS, HUB: HUB, SHENG: SHENG, EDGES: EDGES, TOP_FLOOR: TOP_FLOOR, blank: blank, seatOf: seatOf, channelOf: channelOf,
    nextOf: nextOf, floorOf: floorOf, raise: raise, runOf: runOf, floorFromCredit: floorFromCredit, store: store };
  root.__oagOrgans = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
