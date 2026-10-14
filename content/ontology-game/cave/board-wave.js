// The Council Board's way into the WAVE room, and the run's way back.
//
// Wendell, 14 October 2026 (board, ttv-skip-wave): "yes, but I want it to be as interactive as possible. We want to move toward
// using the game to build the game. It should deposit me inside the WAVE room and we should move to have the WAVE room be able to
// metabolize context specific charges and send the results to the board in this case."
//
// The board opens this page as
//   /ontology-game/cave/#wave=board&charge=<words>&skips=<n>&ref=<tap-the-vein--base36 time>&date=<YYYY-MM-DD>
// (Six-faces-council board/template.html, docs/morning.md "Tap the Vein first"). The page goes straight into the WAVE room
// (cave.js openRoom, from "board") with the charge words as what the sitting is about. Every page of the room saves the whole
// run, in the blocker panel's record shape (Six-faces-council docs/blocker-panel.md, engine "wave-room"), to
// POST /api/council/wave-runs under the player's own sign-in. The council's board read fetches the runs with
// COUNCIL_MENU_TOKEN (council/wave_runs.py there) and lands them as blockers/<ref> on main.
//
// Signed out, or offline, the run waits in this browser (OUTBOX) and goes the next time any cave page opens signed in.
// Needs cave.js loaded first.
(function () {
  "use strict";
  var CAVE = window.__oagCave; if (!CAVE || !CAVE.openRoom) return;
  var el = CAVE.kit.el;
  var API = window.__oagWaveRunsApi || "/api/council/wave-runs";
  var OUTBOX = "oag:wave-room:outbox";
  var BOARD_URL = "https://claude.ai/artifact/DxyShVS8tmvJym4HAsgnho";
  var REF = /^[a-z0-9][a-z0-9-]{0,79}$/;
  var CSS = ".oagbw{position:fixed;left:12px;right:12px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:960;max-width:420px;margin:0 auto;padding:.8rem 1rem;" +
    "background:rgba(12,12,28,.94);border:1px solid rgba(255,241,176,.55);border-radius:16px;color:#f4f4fa;font:15px/1.4 system-ui,sans-serif}" +
    ".oagbw h2{margin:0 0 .3rem;font-size:1.1rem;color:#fff1b0}.oagbw p{margin:.3rem 0}.oagbw a{color:#fff1b0}" +
    ".oagbw-tag{position:fixed;top:calc(14px + env(safe-area-inset-top));left:12px;z-index:961;padding:.2rem .6rem;border-radius:10px;background:rgba(12,12,28,.8);" +
    "color:#aab0c4;font:12px/1.4 system-ui,sans-serif;pointer-events:none}";

  function readOut() { try { return JSON.parse(localStorage.getItem(OUTBOX) || "{}") || {}; } catch (e) { return {}; } }
  function writeOut(o) { try { localStorage.setItem(OUTBOX, JSON.stringify(o)); } catch (e) { /* storage blocked: the send still runs */ } }

  // One run to the server. Resolves "sent", "signin" (no sign-in on this browser) or "offline". A run that does not go stays in
  // the outbox, its latest save replacing any older one.
  function send(ref, record) {
    var out = readOut(); out[ref] = record; writeOut(out);
    return fetch(API, { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ ref: ref, record: record }) })
      .then(function (r) {
        if (r.ok) { var o = readOut(); if (o[ref] && o[ref].savedAt <= record.savedAt) { delete o[ref]; writeOut(o); } return "sent"; }
        return r.status === 401 ? "signin" : "offline";
      }, function () { return "offline"; });
  }
  function flush() {
    var out = readOut(), refs = Object.keys(out);
    return Promise.all(refs.map(function (r) { return REF.test(r) ? send(r, out[r]) : "skip"; }));
  }

  function parse(hash) {
    var q = new URLSearchParams((hash || "").replace(/^#/, ""));
    if (q.get("wave") !== "board") return null;
    var ref = (q.get("ref") || "").toLowerCase(), date = q.get("date") || "", skips = parseInt(q.get("skips") || "", 10);
    if (!REF.test(ref)) ref = "wave-room--" + Date.now().toString(36);
    return { ref: ref, charge: (q.get("charge") || "").trim().slice(0, 300), skips: isNaN(skips) ? null : skips, date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null };
  }

  function note(title, lines) {
    var old = document.querySelector(".oagbw"); if (old) old.remove();
    var box = el("div", { class: "oagbw", "data-board-wave-note": "" }, [el("h2", { text: title })].concat(lines.map(function (l) {
      return typeof l === "string" ? el("p", { text: l }) : l;
    })));
    document.body.appendChild(box);
    return box;
  }
  var SAY = {
    sent: "The run is on its way to the board. The next board read lands it.",
    signin: "This browser is not signed in to bars-engine, so the run is kept here. Sign in, then open the cave again, and it goes to the board.",
    offline: "bars-engine did not take the run, so it is kept in this browser and goes the next time the cave opens.",
  };

  function run(b) {
    if (!document.getElementById("oagbw-css")) document.head.appendChild(el("style", { id: "oagbw-css", text: CSS }));
    var tvv = /^tap-the-vein--/.test(b.ref);
    var base = { step: b.ref.split("--")[0], list: tvv ? "morning" : "board", task: b.charge || "From the board", ref: b.ref };
    if (b.date) base.due = b.date;
    if (b.skips != null) base.skipStreak = b.skips;
    var last = null, timer = null, state = null;
    function flushNow() { clearTimeout(timer); timer = null; if (!last) return Promise.resolve(state); var r = last; last = null; return send(b.ref, r).then(function (s) { state = s; return s; }); }
    function onSave(r) {
      last = Object.assign({}, base, r);
      if (r.finishedAt) return; // leave() saves last; the send follows the room's close below
      if (!timer) timer = setTimeout(flushNow, 1500);
    }
    var tag = el("div", { class: "oagbw-tag", text: "From the board" }); document.body.appendChild(tag);
    return CAVE.openRoom({ from: "board", charge: b.charge, task: tvv ? "today's Tap the Vein" : b.charge, date: b.date, onSave: onSave }).then(function () {
      tag.remove();
      return flushNow();
    }).then(function (s) {
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* the hash stays */ }
      var back = el("p", {}, [el("a", { href: BOARD_URL, text: "Back to the Council Board", "data-board-wave-back": "" })]);
      note(s === "sent" ? "Sent to the board" : "Kept on this phone", [SAY[s] || SAY.offline, back]).setAttribute("data-board-wave-sent", s || "offline");
      return s;
    });
  }

  var hooks = { parse: parse, send: send, flush: flush, outbox: readOut, run: run, api: API };
  window.__oagBoardWave = hooks;
  function go() {
    var b = parse(location.hash);
    flush();
    if (b) hooks.current = run(b);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
})();
