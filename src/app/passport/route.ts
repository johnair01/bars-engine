/**
 * @route GET /passport
 * @entity PLAYER
 * @description The Calrunian passport: what a player carries between Calrunia's places, as a guest or signed in, and the claim at sign-in
 * @permissions public; the claim needs a signed-in player (bars_player_id cookie)
 * @relationships PLAYER (Passport)
 * @example GET /passport?demo=1
 * @agentDiscoverable false
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-static'

/**
 * Six-faces-council pass calrunia-world1 (cw-passport). The page is plain data a player can read, with no model behind it.
 * The guest passport is folded in the browser by public/passport/guest.js; ?demo=1 folds a sample cave and ship in memory
 * instead of this browser's stores, and writes nothing.
 */
const PAGE = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#14121a">
<title>Calrunian passport</title>
<style>
:root{--bg:#14121a;--card:#1f1b28;--ink:#efe9dc;--dim:#a49cb2;--line:#3a3348;--accent:#e2b65c;--ok:#7fc79a}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,sans-serif}
main{max-width:640px;margin:0 auto;padding:20px 16px 48px}h1{font-size:1.5rem;margin:.2em 0}h2{font-size:1rem;margin:1.4em 0 .4em;color:var(--accent)}
.lede,.dim{color:var(--dim)}.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:8px 0}
.row{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.tag{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:1px 10px;margin:2px 4px 2px 0;font-size:.85rem}
.tag.on{border-color:var(--ok);color:var(--ok)}button,a.btn{background:var(--accent);color:#1b1408;border:0;border-radius:10px;padding:10px 16px;font:inherit;font-weight:600;text-decoration:none;display:inline-block;cursor:pointer}
button:disabled{opacity:.5}details{margin-top:16px}pre{white-space:pre-wrap;word-break:break-word;font-size:.8rem;color:var(--dim)}#msg{min-height:1.5em}
</style></head><body><main>
<h1>Your passport</h1>
<p class="lede">What you carry between Calrunia's places: your spirits, your hand, qi, vibeulons, embers and the places you have reached. No place can rank you here.</p>
<div id="who" class="card"></div>
<h2>Places reached</h2><div id="places"></div>
<h2>Spirits</h2><div id="spirits"></div>
<h2>Meters</h2><div id="meters" class="card"></div>
<h2>Embers</h2><div id="embers"></div>
<h2>Hand</h2><div id="hand"></div>
<p id="msg" class="dim"></p>
<details><summary class="dim">The passport as data</summary><pre id="raw"></pre></details>
</main>
<script src="/passport/guest.js"></script>
<script>
(function () {
  var P = window.__calruniaPassport, demo = /[?&]demo=1/.test(location.search);
  var DEMO_SPIRITS = { v: 1, spirits: [
    { id: "demo-fox", name: "Ember Fox", element: "fire", family: "fox", sittings: 3, born: { where: "the Big Mind cave", at: "2026-10-19T18:00:00.000Z" }, lineage: [{ where: "the Big Mind cave", at: "2026-10-19T18:00:00.000Z" }], loadout: true },
    { id: "demo-heron", name: "Still Heron", element: "water", family: "heron", sittings: 1, born: { where: "the Cave of Lessons", at: "2026-10-20T08:00:00.000Z" }, lineage: [], loadout: false } ] };
  var DEMO_VESSEL = { v: 1, places: { home: "visited", bigmind: "visited" }, embers: [{ id: "demo-ember", source: "wave", element: "water", look: 0.6, state: "loose", at: "2026-10-20T10:00:00.000Z", label: "first tide" }] };
  var guest = demo ? P.fold(DEMO_SPIRITS, DEMO_VESSEL, "guest-demo") : P.read();
  var NAMES = { vessel: "Your ship", sprout: "Sprout", cave: "The caves", root: "Root", between: "The Between", "element-lands": "The element lands" };
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function none(t) { return '<p class="dim">' + t + "</p>"; }
  function show(p, signedIn) {
    el("places").innerHTML = P.PLACES.map(function (id) { var on = p.places_reached.indexOf(id) >= 0; return '<span class="tag' + (on ? " on" : "") + '">' + esc(NAMES[id]) + (on ? "" : " (not yet)") + "</span>"; }).join("");
    el("spirits").innerHTML = p.spirits.length ? p.spirits.map(function (s) {
      return '<div class="card"><div class="row"><strong>' + esc(s.name || "A spirit with no name yet") + "</strong><span>" + (s.loadout ? "walks with you" : "rests in the ship") + '</span></div><div class="dim">' +
        esc([s.element, s.family].filter(Boolean).join(" · ")) + " · " + s.sittings + " sitting" + (s.sittings === 1 ? "" : "s") + " · born in " + esc(s.born.where) +
        (s.care ? " · care: " + esc(s.care.state) : "") + "</div></div>"; }).join("") : none("No spirits yet. Wake one in the caves.");
    el("meters").innerHTML = '<div class="row"><span>Qi</span><strong>' + p.qi + '</strong></div><div class="row"><span>Vibeulons</span><strong>' + p.vibeulons + "</strong></div>";
    el("embers").innerHTML = p.embers.length ? p.embers.map(function (m) { return '<div class="card row"><span>' + esc(m.label || "An ember") + '</span><span class="dim">' + esc([m.element, m.source, m.state].filter(Boolean).join(" · ")) + "</span></div>"; }).join("") : none("No embers yet.");
    el("hand").innerHTML = p.hand.length ? p.hand.map(function (h) { return '<span class="tag">' + esc(h.title) + "</span>"; }).join("") : none("Your hand comes with you from Chapter 1.");
    el("raw").textContent = JSON.stringify(p, null, 2);
  }
  function who(html) { el("who").innerHTML = html; }
  show(guest, false);
  who('<div class="row"><span>' + (demo ? "A sample guest passport. Nothing in this browser was read or changed." : "You are a guest. This passport lives in this browser.") + "</span></div>");
  fetch("/api/passport", { credentials: "same-origin" }).then(function (r) { return r.status === 401 ? null : r.json(); }).then(function (res) {
    var back = encodeURIComponent(location.pathname + location.search);
    if (!res) { who(el("who").innerHTML + '<p><a class="btn" href="/login?returnTo=' + back + '">Sign in to keep it</a></p>'); return; }
    if (res.passport) show(res.passport, true);
    who('<div class="row"><span>Signed in as <strong>' + esc(res.player.name) + "</strong>" + (res.passport ? "" : ". Your passport starts when you keep this one.") + '</span></div><p><button id="claim">' + (res.passport ? "Bring in what this browser holds" : "Keep this passport") + "</button></p>");
    el("claim").onclick = function () {
      el("claim").disabled = true; el("msg").textContent = "Keeping it…";
      fetch("/api/passport", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ guest: guest }) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) { if (!x.ok) throw new Error(x.j.error || "not kept"); show(x.j.passport, true); el("msg").textContent = "Kept. Your spirits are yours wherever you sign in."; el("claim").disabled = false; })
        .catch(function (e) { el("msg").textContent = "That did not keep: " + e.message; el("claim").disabled = false; });
    };
  }).catch(function () {});
})();
</script></body></html>`

export function GET() {
  return new NextResponse(PAGE, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}
