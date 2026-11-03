/* The Infinite Arcade hall, walked (council spec .specify/specs/infinite-arcade-hall/, tasks T006 to T010).

   /between/land.html?place=arcade: the player steps in through the grey gate with three coins at the hip, walks the
   corridor, and chooses where a coin goes by walking to a cabinet. A coin pushes the camera through the screen into
   that game's own route (canon/mechanics/cabinet-coin.yaml); coming back out drops a ticket in the cabinet's tray, to
   keep on the prize counter's line with one word or to let go into the change machine's hopper. An empty purse is a seat
   on the bench by the change machine, never a lock. No number shows on the play surface.

   /between/land.html?place=ask-desk: the ask cabinet's own place (./ask-desk.js).

   The look is the stills round he said yes to (round 3, 2026-11-03 19:02Z), drawn by ./scene.js. Everyone in the hall
   wears their own street clothes; the cultivation robe arrives only at character creation (his note, 17:32Z).

   Preview parameters (FR-013): &at=gate|alcove|corridor|bench|ask|lantern|between|chapter-1 opens the avatar there,
   &coins=0..3 seeds the purse, &pass=0|1 sets the gate (slice 1 reads the pass from this parameter only; the live check
   is a code sent with the Patreon invite, built before the invite links point here). &fresh=1 starts a new record. */
import * as THREE from "three";
import { parseLook } from "../../calrunia/look.js";
import { CRATE_SIT, SEAT_PAD } from "../stance.js";
import { scene, build, figure, hangLine, GATE_Z, AISLE, SLOT_Z, LAST } from "./scene.js";
import { CABINETS, byId, todaysCabinet } from "./cabinets.js";
import * as H from "./hall.js";
import { buildDesk, DESK } from "./ask-desk.js";

const Q = new URLSearchParams(location.search);
const PLACE = Q.get("place") === "ask-desk" ? "desk" : "hall";
const LOW = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || Math.min(innerWidth, innerHeight) < 600;
const STILL = matchMedia("(prefers-reduced-motion: reduce)").matches || Q.get("motion") === "0";   // FR-014
const $ = s => document.querySelector(s);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const step = m => { const e = $("#loadStep"); if (e) e.textContent = m; };
const store = { get(k, s = localStorage) { try { return s.getItem(k); } catch { return null; } }, set(k, v, s = localStorage) { try { s.setItem(k, v); } catch { /* this page only */ } },
  del(k, s = localStorage) { try { s.removeItem(k); } catch { /* nothing kept */ } } };
const PASS_URL = "https://www.patreon.com/";   // the Patreon page; the launch strand names the page, the hall only links to it

/* the page's frame: the land page's HUD, named for the arcade */
document.title = PLACE === "desk" ? "The Ask" : "The Infinite Arcade";
$("#placeName").textContent = PLACE === "desk" ? "The Ask" : "The Infinite Arcade";
$("#placeLand").textContent = PLACE === "desk" ? "a desk in the mist" : "the hall at dusk";
$("#loadMsg").textContent = PLACE === "desk" ? "Through the screen…" : "The grey gate, and the hall beyond it…";
document.querySelector("meta[name=theme-color]")?.setAttribute("content", "#1a1626");
$("#loading").style.background = "#1a1626";
$("#stage").setAttribute("aria-label", "The Infinite Arcade. Tap the floor to walk there; drag to look around.");

/* ---------- the record (FR-010) and the pass (FR-011) ---------- */
if (Q.get("pass") === "1" || Q.get("pass") === "0") store.set("arcade-pass", Q.get("pass"), sessionStorage);
const PASS = store.get("arcade-pass", sessionStorage) === "1";
let hall = H.newVisit(Q.get("fresh") ? null : store.get(H.KEY));
const commit = h => { hall = h; store.set(H.KEY, H.save(h)); return h; };
if (Q.get("coins") != null) hall = { ...hall, coins: Math.max(0, Math.min(H.FULL, Number(Q.get("coins")) | 0)) };
// back from a game (FR-006): any way back out of the screen ends the round and pays a ticket; the ask's round ends only
// when the player says the ask is sent, so an ask left before that pays its ticket at once
let backFrom = null;
if (PLACE === "hall" && hall.inside) {
  backFrom = hall.inside;
  let ask = null; try { ask = JSON.parse(store.get("arcade-ask", sessionStorage) || "null"); } catch { ask = null; }
  hall = H.returnFrom(hall, backFrom, { early: backFrom === "ask" && Q.get("sent") !== "1", ask });
  store.del("arcade-ask", sessionStorage);
}
if (PLACE === "hall" && Q.get("from") === "change-machine" && store.get("arcade-melting", sessionStorage)) { hall = H.melted(hall); store.del("arcade-melting", sessionStorage); backFrom = "change-machine"; }
commit(hall);
const hallUrl = extra => "/between/land.html?" + new URLSearchParams({ place: "arcade", ...extra, ...(Q.get("skipHome") ? { skipHome: "1" } : {}) });

/* ---------- renderer, camera ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: !LOW, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.45;
$("#stage").appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(58, 1, 0.05, 200);
function resize() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener("resize", resize); resize();

/* ---------- sound: the coin's clunk, the ticket's curl, the lever ---------- */
let ac = null, master = null, soundOn = store.get("between-sound") !== "0";
function audio() { if (ac) return ac; try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = soundOn ? 0.5 : 0; master.connect(ac.destination); } catch { ac = null; } return ac; }
function blip(f, { at = 0, dur = 0.12, type = "triangle", vol = 0.3, to = null } = {}) {
  const a = audio(); if (!a || !soundOn) return; const t = a.currentTime + at, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
}
const SOUND = { coin: () => { blip(1800, { dur: 0.05, vol: 0.15 }); blip(220, { at: 0.12, dur: 0.18, type: "square", vol: 0.18, to: 90 }); blip(660, { at: 0.34, dur: 0.4, vol: 0.12 }); },
  ticket: () => { for (let i = 0; i < 5; i++) blip(2400 - i * 120, { at: i * 0.05, dur: 0.03, type: "square", vol: 0.05 }); },
  keep: () => [523, 659, 784].forEach((f, i) => blip(f, { at: i * 0.1, dur: 0.3, vol: 0.12 })),
  letgo: () => blip(330, { dur: 0.5, vol: 0.1, to: 160 }), lever: () => { blip(140, { dur: 0.2, type: "square", vol: 0.15 }); blip(880, { at: 0.25, dur: 0.6, vol: 0.1 }); },
  sat: () => blip(392, { dur: 0.6, vol: 0.08 }) };
$("#soundBtn").textContent = soundOn ? "Sound on" : "Sound off";
$("#soundBtn").onclick = () => { soundOn = !soundOn; store.set("between-sound", soundOn ? "1" : "0"); $("#soundBtn").textContent = soundOn ? "Sound on" : "Sound off";
  $("#soundBtn").setAttribute("aria-pressed", String(soundOn)); if (audio()) master.gain.value = soundOn ? 0.5 : 0; };
$("#homeBtn").onclick = () => leave(PLACE === "desk" ? hallUrl({ from: "ask" }) : (store.get("arcade-home", sessionStorage) || "/"));
if (PLACE === "hall" && !hall.inside && !backFrom && document.referrer && !/\/between\/land\.html|ontology-game\/between/.test(document.referrer)) {
  try { const r = new URL(document.referrer); if (r.origin === location.origin) store.set("arcade-home", r.pathname + r.search, sessionStorage); } catch { /* home is / */ }
}
function leave(href, { white = false } = {}) {
  const fade = $("#fade"); fade.hidden = false; if (white) fade.style.background = "#f6f0f2";
  requestAnimationFrame(() => fade.classList.add("on")); setTimeout(() => { location.href = href; }, STILL ? 250 : 700);
}

/* ---------- cards and captions (the land page's) ---------- */
const card = (title, text, ...rows) => `<b>${esc(title)}</b>${text ? `<div class="t">${esc(text)}</div>` : ""}${rows.length ? `<div class="row">${rows.join("")}</div>` : ""}`;
const btn = (act, label) => `<button type="button" data-act="${esc(act)}">${esc(label)}</button>`;
let cardKey = "", captions = [], capUntil = 0, onAct = () => {};
function showCard(key, html) {
  const el = $("#card");
  if (key === cardKey) return; cardKey = key;
  if (!html) { el.hidden = true; el.innerHTML = ""; return; }
  el.innerHTML = html; el.hidden = false;
  el.querySelectorAll("[data-act]").forEach(b => { b.onclick = e => { e.stopPropagation(); audio(); onAct(b.dataset.act); }; });
}
// a page brought back from the browser's cache after a push would still be mid-push: read the record afresh
addEventListener("pageshow", e => { if (e.persisted) location.reload(); });
function caption(text, secs = 5) { captions.push({ text, secs }); }

/* ===================================================================================================
   The ask desk
   =================================================================================================== */
async function runDesk() {
  step("the mist");
  const desk = buildDesk(scene);
  const look = (() => { try { return parseLook(sessionStorage.getItem("ctw-look") || ""); } catch { return null; } })();
  const me = await figure("me", look);
  me.holder.position.copy(DESK.stand); me.holder.rotation.y = Math.PI; me.set(false); me.hang(H.weight(hall));
  let yaw = 0.5, pitch = 0.3, drag = null, pulled = false;
  const el = renderer.domElement;
  el.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY, yaw, pitch }; audio(); });
  el.addEventListener("pointermove", e => { if (drag) { yaw = drag.yaw - (e.clientX - drag.x) * 0.005; pitch = Math.max(0.05, Math.min(0.9, drag.pitch + (e.clientY - drag.y) * 0.004)); } });
  addEventListener("pointerup", () => { drag = null; });
  const draft = { to: "", what: "" };
  let stage = "write";
  const html = () => stage === "write"
    ? `<b>The Ask</b><div class="t">Write down who you will ask, and for what. Both stay on this phone.</div>
       <label class="t">Who<input id="askTo" maxlength="80" autocomplete="off" style="width:100%;box-sizing:border-box;margin-top:4px" value="${esc(draft.to)}"></label>
       <label class="t">What for<textarea id="askWhat" maxlength="280" rows="2" style="width:100%;box-sizing:border-box;margin-top:4px">${esc(draft.what)}</textarea></label>
       <div class="row">${btn("written", "Write it down")}${btn("not-today", "Not today")}</div>`
    : card("Go and ask", "Ask them yourself, outside the arcade: a message, a call, or in person. This desk sends nothing. Pull the lever once you have asked.",
      btn("sent", "I asked: pull the lever"), btn("not-today", "Not today"));
  const act = a => {
    if (a === "written") { draft.to = ($("#askTo") || {}).value || ""; draft.what = ($("#askWhat") || {}).value || ""; stage = "go"; cardKey = ""; render(); }
    else if (a === "sent" && !pulled) { pulled = true; store.set("arcade-ask", JSON.stringify(draft), sessionStorage); desk.pullLever(); SOUND.lever(); showCard("x", null);
      setTimeout(() => leave(hallUrl({ from: "ask", sent: "1" }), { white: true }), STILL ? 200 : 900); }
    else if (a === "not-today") leave(hallUrl({ from: "ask" }));
  };
  const render = () => { cardKey = ""; const el2 = $("#card"); el2.innerHTML = html(); el2.hidden = false; el2.querySelectorAll("[data-act]").forEach(b => { b.onclick = e => { e.stopPropagation(); audio(); act(b.dataset.act); }; }); };
  done();
  render();
  caption("The Ask: one sheet, one lever, and the mist.", 4);
  const clock = new THREE.Clock(); let T = 0;
  (function frame() {
    requestAnimationFrame(frame); const dt = Math.min(0.05, clock.getDelta()); T += dt;
    me.pose(dt); desk.frame(dt, T, STILL);
    const off = V(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(2.4);
    camera.position.copy(DESK.stand).add(off).add(V(0, 1.1, 0)); camera.lookAt(DESK.look);
    captionTick(T); renderer.render(scene, camera);
  })();
  window.__arcade = { place: "desk", hall: () => hall, act };
}

/* ===================================================================================================
   The hall
   =================================================================================================== */
async function runHall() {
  step("building the hall");
  const today = todaysCabinet();
  const built = await build({ today: today.id });
  hangLine(hall.line);
  step("the visitors");
  const look = (() => { try { return parseLook(sessionStorage.getItem("ctw-look") || ""); } catch { return null; } })();
  const me = await figure("me", look);
  me.hang(H.weight(hall));
  // two more visitors off the street: one playing at the Lantern Table, one walking the corridor and back
  const denim = await figure("denim"), puffer = await figure("puffer");
  { const b = built.lantern, n = b.normal.clone().setY(0).normalize(), p = b.screenAt.clone().addScaledVector(n, 0.6).setY(0);
    denim.holder.position.copy(p); denim.holder.rotation.y = Math.atan2(-n.x, -n.z); denim.set(false); }
  const strollA = V(-0.35, 0, -3.6), strollB = V(0.3, 0, SLOT_Z(18)); let strollT = 0.25;
  puffer.set(true);

  /* where things stand: in front of each cabinet's screen, the bench, the gate */
  const standAt = id => { const b = built[id], n = b.normal.clone().setY(0); if (n.lengthSq() < 0.01) n.set(-Math.sign(b.screenAt.x), 0, 0); n.normalize();
    return b.screenAt.clone().setY(0).addScaledVector(n, id === "between" ? 0.75 : 0.6); };
  const STAND = Object.fromEntries(CABINETS.map(c => [c.id, standAt(c.id)]));
  const BENCH = V(-(AISLE - 0.55), 0, 1.25), BENCH_SEAT = V(-(AISLE + 0.12), 0, 1.25);
  const GATE_OUT = V(0.1, 0, GATE_Z + 1.6), GATE_IN = V(0.1, 0, GATE_Z - 2.6);
  const HALF = AISLE - 0.4, FAR = SLOT_Z(LAST) + 1.5;
  function walkable(x, z) {
    if (!PASS) return Math.abs(x) < 1.6 && z > GATE_Z + 0.45 && z < GATE_Z + 7;   // the visitor stands outside the gate (FR-011)
    return Math.abs(x) < HALF && z > FAR && z < GATE_Z - 0.35;
  }

  /* the player */
  const meS = { pos: (PASS ? GATE_IN : GATE_OUT).clone(), yaw: Math.PI, target: null, keys: new Set(), sat: false, seat: 0 };
  const at = Q.get("at");
  if (PASS && at === "alcove") meS.pos.set(0, 0, 2.6);
  if (PASS && at === "corridor") meS.pos.set(0, 0, -1.2);
  if (PASS && at === "bench") meS.pos.copy(BENCH);
  if (PASS && STAND[at]) { meS.pos.copy(STAND[at]); const b = built[at]; meS.yaw = Math.atan2(b.screenAt.x - meS.pos.x, b.screenAt.z - meS.pos.z); }
  if (PASS && backFrom && STAND[backFrom]) { meS.pos.copy(STAND[backFrom]); const b = built[backFrom]; meS.yaw = Math.atan2(b.screenAt.x - meS.pos.x, b.screenAt.z - meS.pos.z); }
  if (PASS && backFrom === "change-machine") meS.pos.copy(BENCH);
  let camYaw = meS.yaw + Math.PI + (STAND[at] || backFrom ? 0.75 : 0), camPitch = 0.34, camDist = LOW ? 3.4 : 3.1, drag = null;
  const el = renderer.domElement, ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), floor = new THREE.Plane(V(0, 1, 0), 0);
  el.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY, yaw: camYaw, pitch: camPitch, moved: false }; audio(); });
  el.addEventListener("pointermove", e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 8) drag.moved = true;
    if (drag.moved) { camYaw = drag.yaw - dx * 0.006; camPitch = Math.max(0.05, Math.min(0.75, drag.pitch + dy * 0.004)); } });
  el.addEventListener("pointerup", e => { const d = drag; drag = null; if (!d || d.moved || push) return; tap(e.clientX, e.clientY); });
  addEventListener("keydown", e => { if (e.target.closest && e.target.closest("button,input,textarea")) return; meS.keys.add(e.key.toLowerCase()); });
  addEventListener("keyup", e => meS.keys.delete(e.key.toLowerCase()));
  function tap(cx, cy) {
    if (meS.sat) return;
    ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
    let best = null, bd = 0.7;
    if (PASS) {
      for (const c of CABINETS) { const d = ray.ray.distanceToPoint(built[c.id].screenAt); if (d < bd) { bd = d; best = STAND[c.id].clone(); } }
      if (ray.ray.distanceToPoint(V(-(AISLE + 0.2), 0.6, 1.25)) < 0.8 || ray.ray.distanceToPoint(V(-(AISLE + 0.35), 1.2, 2.7)) < 0.7) best = BENCH.clone();
    }
    if (!best) { const p = ray.ray.intersectPlane(floor, V(0, 0, 0)); if (!p) return; best = p; }
    best.x = Math.max(-HALF + 0.02, Math.min(HALF - 0.02, best.x));
    meS.target = best;
  }
  function move(dt) {
    if (meS.sat || push) return false;
    let dir = null;
    const fwd = V(-Math.sin(camYaw), 0, -Math.cos(camYaw)), right = V(-fwd.z, 0, fwd.x), k = meS.keys, kd = V(0, 0, 0);
    if (k.has("w") || k.has("arrowup")) kd.add(fwd); if (k.has("s") || k.has("arrowdown")) kd.sub(fwd);
    if (k.has("d") || k.has("arrowright")) kd.add(right); if (k.has("a") || k.has("arrowleft")) kd.sub(right);
    if (kd.lengthSq() > 0) { dir = kd.normalize(); meS.target = null; }
    else if (meS.target) { const d = meS.target.clone().sub(meS.pos).setY(0); if (d.length() < 0.06) meS.target = null; else dir = d.normalize(); }
    if (!dir) return false;
    const s = Math.min(1.15 * dt, meS.target ? meS.target.distanceTo(meS.pos) : 9), nx = meS.pos.x + dir.x * s, nz = meS.pos.z + dir.z * s;
    if (walkable(nx, nz)) { meS.pos.x = nx; meS.pos.z = nz; } else if (walkable(nx, meS.pos.z)) meS.pos.x = nx; else if (walkable(meS.pos.x, nz)) meS.pos.z = nz; else { meS.target = null; return false; }
    const want = Math.atan2(dir.x, dir.z); let dy = want - meS.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); meS.yaw += dy * Math.min(1, dt * 8);
    return true;
  }
  /* sitting on the bench: stance.js's crate sit, as the Friends' Fire seats a player */
  const bones = {}; for (const n of ["hips", "hipL", "hipR", "kneeL", "kneeR", "spine", "neck"]) { const b = me.obj.getObjectByName(n); if (b) bones[n] = b; }
  const hipsY = bones.hips ? bones.hips.position.y : 0, qe = new THREE.Quaternion(), eu = new THREE.Euler(), sv = V(0, 0, 0);
  function seatPose(dt) {
    meS.seat += ((meS.sat ? 1 : 0) - meS.seat) * Math.min(1, dt * 5); if (meS.seat < 0.01 || !bones.hipL) return;
    for (const [n, x, y, z] of CRATE_SIT) { const b = bones[n]; if (b) b.quaternion.slerp(b.quaternion.clone().multiply(qe.setFromEuler(eu.set(x, y, z, "XYZ"))), meS.seat); }
    const hb = bones.hips, cur = hb.position.y; hb.position.y = hipsY; me.holder.updateMatrixWorld(true);
    const hw = hb.getWorldPosition(sv).y - me.holder.position.y, sy = hb.parent.getWorldScale(sv).y || 1;
    hb.position.y = cur + (hipsY - (hw - (0.48 + SEAT_PAD)) / sy - cur) * meS.seat;
  }

  /* the push through a screen (cabinet-coin): the coin lands, the marquee lights, the camera goes in */
  let push = null;
  function drop(id) {
    const c = byId(id); if (!H.canDrop(hall, id, PASS)) return;
    commit(H.drop(hall, id, PASS)); me.hang(H.weight(hall));
    const b = built[id]; SOUND.coin(); showCard("pushing", null);
    if (b.slots) for (const s of b.slots) s.material = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd27a).multiplyScalar(2.4) });
    if (b.marquee) b.marquee.material.color.setScalar(1.35);
    store.set("ctw-back", hallUrl({ from: id }), sessionStorage);   // each game's way home comes back to this cabinet
    push = { id, t: 0, from: camera.position.clone(), fov: camera.fov, to: b.screenAt.clone().addScaledVector(b.normal, 0.012), look: b.screenAt.clone(), href: c.route + (c.route.includes("?") ? "&" : "?") + (Q.get("skipHome") ? "skipHome=1&" : "") + "from=arcade" };
    if (STILL) leave(push.href, { white: true });
  }
  function act(a) {
    const [verb, id] = a.split(":");
    if (verb === "drop") drop(id);
    else if (verb === "keep") { pendingKeep = id; cardKey = ""; }
    else if (verb === "hang") { const w = ($("#ticketWord") || {}).value || ""; commit(H.keep(hall, id, w)); hangLine(hall.line); pendingKeep = null; SOUND.keep(); cardKey = ""; caption("Your ticket hangs on the line over the prize counter.", 4); }
    else if (verb === "letgo") { commit(H.letGo(hall, id)); SOUND.letgo(); cardKey = ""; caption("The ticket drops into the change machine's hopper.", 4); }
    else if (verb === "answer") { commit(H.answer(hall, id)); SOUND.ticket(); cardKey = ""; }
    else if (verb === "sit") { meS.sat = true; meS.target = null; meS.pos.copy(BENCH_SEAT); meS.yaw = Math.PI / 2; SOUND.sat(); cardKey = ""; }
    else if (verb === "stand") { meS.sat = false; meS.pos.copy(BENCH); cardKey = ""; }
    else if (verb === "melt") { store.set("arcade-melting", "1", sessionStorage); store.set("ctw-back", hallUrl({ from: "change-machine" }), sessionStorage); leave("/between/land.html?block=ice" + (Q.get("skipHome") ? "&skipHome=1" : "")); }
  }
  onAct = act;
  let pendingKeep = null, gateShown = false;
  function cards() {
    if (push) return;
    if (!PASS) {   // the visitor at the gate: one card, no countdown, shown once a visit
      if (gateShown) return; gateShown = true;
      showCard("gate", card("The Infinite Arcade", "Patrons walk in with three coins and choose a game by walking to it. The Patreon pass opens the gate.",
        `<a class="btn" href="${PASS_URL}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;min-height:44px;padding:0 14px;border-radius:10px;background:#3f6a3a;color:#fff;text-decoration:none">See the pass</a>`));
      return;
    }
    const p = meS.pos;
    if (meS.sat) {
      const full = hall.coins >= H.FULL;
      return showCard("sat:" + full, card("The bench", full ? "Your purse hangs full again." : "You rest by the change machine, and the purse fills as you sit.", btn("stand", "Stand up")));
    }
    // a cabinet within 1.2 m of its screen (FR-004)
    let near = null, nd = 1.2;
    for (const c of CABINETS) { const s = built[c.id].screenAt, d = Math.hypot(p.x - s.x, p.z - s.z); if (d < nd) { nd = d; near = c; } }
    if (near) {
      const id = near.id, t = hall.tray[id];
      if (t && t.waiting) return showCard("ask-wait", card("Your ask's ticket waits", "You asked. What came back?", btn("answer:yes", "A yes"), btn("answer:no", "A no"), btn("answer:silence", "Silence")));
      if (t && pendingKeep === id) return showCard("keep:" + id, `<b>Keep it</b><div class="t">One word for the ticket, if you want one.</div>
        <input id="ticketWord" maxlength="24" autocomplete="off" aria-label="One word" style="min-height:40px"><div class="row">${btn("hang:" + id, "Hang it on the line")}</div>`);
      if (t) return showCard("ticket:" + id, card("A ticket curls from the tray", "", btn("keep:" + id, "Keep it"), btn("letgo:" + id, "Let it go")));
      if (!near.route) return showCard("soon:" + id, card(near.name, "Lit soon."));
      if (H.canDrop(hall, id, PASS)) return showCard("drop:" + id, card(near.name, "", btn("drop:" + id, "Drop a coin")));
      return showCard("light:" + id, card(near.name, "Your purse hangs light. The bench by the change machine fills it."));
    }
    if (Math.hypot(p.x - BENCH.x, p.z - BENCH.z) < 0.9 && hall.coins < H.FULL)
      return showCard("bench", card("The change machine", "Rest on the bench, or melt a block in the machine. Either fills the purse.", btn("sit", "Sit a while"), btn("melt", "Melt a block")));
    showCard("", null);
  }

  /* the frame */
  const lit = built.lit.map(b => ({ m: b.screen.material, k: b.screen.material.color.r }));
  done();
  if (PASS && !backFrom) { caption("Through the grey gate, the hall at dusk.", 4); caption(`The lamp hangs over ${today.name} today.`, 4); caption("Tap the floor to walk. Drag to look around.", 5); }
  if (!PASS) caption("Through the gate, the hall glows in the dusk.", 5);
  if (backFrom && backFrom !== "change-machine") SOUND.ticket();
  if (backFrom === "change-machine") caption("The block melted, and the purse hangs full.", 5);
  const clock = new THREE.Clock(); let T = 0;
  camera.position.copy(meS.pos).add(V(Math.sin(camYaw) * camDist, 1.6, Math.cos(camYaw) * camDist));
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, clock.getDelta()); T += dt;
    const moving = move(dt);
    me.holder.position.copy(meS.pos); me.holder.rotation.y = meS.yaw; me.set(moving); me.pose(dt); seatPose(dt);
    if (meS.sat) { const before = hall.coins; hall = H.sit(hall, dt); if (hall.coins !== before) { commit(hall); SOUND.sat(); cardKey = ""; } me.hang(H.weight(hall)); }
    denim.pose(dt);
    // the visitor in the red jacket strolls deeper in and back
    strollT += dt / 26; const u = (Math.sin(strollT * Math.PI * 2) + 1) / 2, pp = strollA.clone().lerp(strollB, u), dir = Math.cos(strollT * Math.PI * 2) > 0 ? Math.PI : 0;
    puffer.holder.position.copy(pp); puffer.holder.rotation.y = dir; puffer.pose(dt);
    // attract loops (held still with reduced motion, FR-014)
    if (!STILL) lit.forEach((l, i) => l.m.color.setScalar(l.k * (0.92 + 0.08 * Math.sin(T * 2.2 + i * 1.7))));
    if (!STILL) built.mist.forEach((s, i) => { s.position.x += Math.sin(T * 0.2 + i) * dt * 0.05; });
    for (const c of CABINETS) if (hall.known[c.id] === "unknown") { const s = built[c.id].screenAt; if (Math.hypot(meS.pos.x - s.x, meS.pos.z - s.z) < 3) commit(H.glimpse(hall, c.id)); }
    // camera: behind and above, turned by a drag, held inside the hall's walls
    if (push) {
      push.t += dt / 2.4; const k = Math.min(1, push.t), e = k * k * (3 - 2 * k);
      camera.position.lerpVectors(push.from, push.to, e); camera.fov = THREE.MathUtils.lerp(push.fov, 34, e); camera.updateProjectionMatrix(); camera.lookAt(push.look);
      me.holder.visible = camera.position.distanceTo(push.look) > 0.5;
      if (k > 0.85 && !push.out) { push.out = true; leave(push.href, { white: true }); }
    } else {
      const off = V(Math.sin(camYaw) * Math.cos(camPitch), Math.sin(camPitch), Math.cos(camYaw) * Math.cos(camPitch)).multiplyScalar(camDist);
      const want = meS.pos.clone().add(off).add(V(0, 1.15, 0));
      if (PASS) { want.x = Math.max(-(AISLE - 0.2), Math.min(AISLE - 0.2, want.x)); want.z = Math.min(want.z, GATE_Z - 0.2); want.y = Math.min(want.y, 2.9); }
      camera.position.lerp(want, 1 - Math.exp(-dt * 6)); camera.lookAt(meS.pos.clone().add(V(0, 1.2, 0)));
    }
    cards(); captionTick(T);
    renderer.render(scene, camera);
  }
  frame();
  window.__arcade = { place: "hall", pass: PASS, hall: () => hall, me: meS, act, tap, built, stand: STAND, cam: (y, p) => { camYaw = y; if (p != null) camPitch = p; }, near: () => cardKey, camera, renderer };
}

function captionTick(T) {
  const cap = $("#caption");
  if (T > capUntil) { const c = captions.shift(); if (c) { cap.textContent = c.text; cap.hidden = false; cap.classList.add("on"); capUntil = T + c.secs; } else cap.classList.remove("on"); }
}
function done() { $("#loading").classList.add("gone"); setTimeout(() => { $("#loading").hidden = true; }, 900); $("#hud").hidden = false; }

(PLACE === "desk" ? runDesk() : runHall()).catch(e => { console.error(e); step("the hall did not build: " + (e && e.message || e)); window.__arcadeError = String(e && e.stack || e); });
