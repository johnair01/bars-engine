/* The Between, in 3D, on bars-engine. Carried from the claude.ai artifact page (https://claude.ai/artifact/NTi4jcpaHkDEMnqpVA9LBq, version 4)
   with its boot and store calls replaced: the store is Postgres behind /api/between, polled (bh-async-first). */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as skClone } from "three/addons/utils/SkeletonUtils.js";
import { buildHollow, walkable, pushOut, groundY, clampCamera, mergeStatic, mergeByParent, paperLantern, makeRoomItem, seatsNow, CUSHION_TOP, WALK_R, DAIS_Y, HEARTH } from "./hollow.js";
import { applyRoom, ITEMS, ITEM_ORDER, SHELLS, earnedEvents, earnedItems, satchelOf, placeOn, liftFrom } from "../calrunia/room-kit.js";
/* Room kit, part 2 (Still B, the scroll; Still C, the first minute). */
import { minuteState, minuteWrite, beatAt, inviteDoorway, STEPS as MINUTE_STEPS, BEATS as MINUTE_BEATS, CAPTIONS as MINUTE_CAPTIONS, PROMPTS as MINUTE_PROMPTS, HOPE_ASK, SKIPPABLE, LATER_AFTER_MS } from "../calrunia/first-minute.js";
import { WHEN_CHIPS, whenFor, whenWords, calendar, LINE_MAX, sealedInvitation, answerOutcome, RIBBONS, shelfScrolls, markOf } from "../calrunia/scroll.js";
import { createCreature } from "./creature.js";
import { pickTap } from "./pick.js";   // a cushion takes the tap ahead of the spark over it (pt1-cushion-first)
import { loadParts, dressFigure } from "./wardrobe.js";   // the player figure wears the Look (Average Dusk, the skinned J5 robe)
import { stance, clipWeights, FADE, SIT, SIT_DROP, SEAT_PAD } from "./stance.js";   // lt-idle-default: standing still is a real idle, not a held walk frame
import { createAmbient } from "./ambient.js";
import { buildTea } from "./tea.js";   // between-tea-1 slice 1: the kettle by the fire, the cup the seated figure holds
import { NEAR as TEA_NEAR } from "./tea-pose.js";
import { focusOnReturn, focusProgress, emberWarmth, FOCUS_SETTLE_MS, MINUTE_MS } from "./focus.js";
import { installPaint, paint } from "./paint.js";   // round 3: the painterly shader, keyed to the concept views
/* Mirror light and standing idle build: the figure alone takes the room capture and the wrapped light (figure-light.js). */
import { figureWrap, figureProbe, lightFigure } from "./figure-light.js";
import { readIn, readMs, setPace, getPace, PACES } from "./captions.js"; // round 4: caption mode
/* Rooms, part 2 (six-faces-council relationship-creature, the br-* positions): the portable modules the Cave of Lessons
   and Big Mind take as they are. */
import { BEATS, optionsOf, parseLook, lookText, randomLook, colorsOf, lookWords, DEFAULT_LOOK } from "../calrunia/look.js";
import { STYLES as ROOM_STYLES, styleOf, figureLightOf } from "../calrunia/room-styles.js";
import { suggest, LANE_NAMES } from "../calrunia/next-moves.js";
import { SPELLS, KINDS as SPELL_KINDS, castable } from "../calrunia/spellbook.js";
/* Part 4 (his ask of 2026-10-23): a check-in is a W.A.V.E. that leaves an ember, and embers feed spirits. */
import { WAVE_STEPS, careOf, careNow, feed, CARE_WORDS } from "../calrunia/spirit-care.js";
installPaint();

/* ===================================================================================================
   The Between, in 3D. A room two people share. The garden's store (Postgres behind /api/between) keeps
   everything that lasts: the spark or the Between, agreements, offerings, visiting spirits and daemons.
   The same poll carries where each person stands right now. Paths match the artifact page's store
   (garden/main, items, spirits, daemons, shown, data/users/<id>/garden|spark), so the acts below are unchanged.
   =================================================================================================== */
const STALE_DAYS = 5;
const KINDS = { charge: "Worked-through charge", inspiration: "Inspiration", idea: "Idea", desire: "Desire", checkin: "Check-in", name: "A name for the Between" };
const AG_LABEL = { draft: "drafted", proposed: "proposed", agreed: "agreed by both", revisit: "up for revisit", retired: "retired", composted: "composted" };
const REL_KINDS = ["Friendship", "Romance or flirting", "Allyship", "Family", "Work", "Something else"];
const DAEMONS = {
  protector: ["Protector", "stands between you and harm"],
  controller: ["Controller", "keeps it all from slipping"],
  skeptic: ["Skeptic", "checks before it trusts"],
  fixer: ["Fixer", "wants to make it right, now"],
  victim: ["Victim", "remembers every time it hurt"],
  "emotional-body": ["Emotional Body", "feels it all at once"],
  "damaged-self": ["Damaged Self", "carries the old wound"],
};
const ELEMENTS = { Wood: 0x6fae5a, Fire: 0xe0663a, Earth: 0xc9a35a, Metal: 0xc8ccd4, Water: 0x4f8fd0 };
const FORMS = { fox: "Fox", tortoise: "Tortoise" };
/* The hearth (council pass crafting-charge1, slice 1). The fifteen moves mirror src/lib/quest-grammar/move-engine.ts, as
   src/lib/between/rules.ts reads them: ids and names identical, each with the element it starts from and the one it goes to. */
const FEELS = { wood: "joy", fire: "anger", earth: "neutrality", metal: "fear", water: "sadness" };
const elHex = e => ELEMENTS[e[0].toUpperCase() + e.slice(1)];
const MOVES = {
  wood_transcend: ["Commit to Growth", "wood", "wood"], fire_transcend: ["Achieve Breakthrough (Triumph)", "fire", "fire"], earth_transcend: ["Stabilize Coherence", "earth", "earth"],
  metal_transcend: ["Step Through (Excitement)", "metal", "metal"], water_transcend: ["Reclaim Meaning", "water", "water"],
  wood_fire: ["Declare Intention", "wood", "fire"], fire_earth: ["Integrate Gains", "fire", "earth"], earth_metal: ["Reveal Stakes", "earth", "metal"], metal_water: ["Deepen Value", "metal", "water"], water_wood: ["Renew Vitality", "water", "wood"],
  wood_earth: ["Consolidate Energy", "wood", "earth"], fire_metal: ["Temper Action", "fire", "metal"], earth_water: ["Reopen Sensitivity", "earth", "water"], metal_wood: ["Activate Hope", "metal", "wood"], water_fire: ["Mobilize Grief", "water", "fire"],
};
const movesFrom = el => Object.entries(MOVES).filter(([, m]) => m[1] === el);
const FIVE_CREDIT = "The five elements and their cycles come from Chinese five-phase thought; the feelings paired with them are this game's own.";
/* Round 2 (2026-10-17): the WAVE dome gave way to the hollow under the roots (hollow.js). The Between sits in the middle
   of the mossy dais, between the two cushions; you arrive on the flagstones just in front of it. */
const BETWEEN_AT = new THREE.Vector3(0, 0, -0.35);
const HEARTH_AT = new THREE.Vector3(HEARTH.x, 0, HEARTH.z);
const SPAWN = [new THREE.Vector3(-0.8, 0, 3.1), new THREE.Vector3(0.8, 0, 3.1)];
const LOW_POWER = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || Math.min(innerWidth, innerHeight) < 600;

/* ---------- state ---------- */
let me = null, gardenId = null, invite = null, myInvite = null;
let garden = null, gardenLoaded = false;
const items = new Map(), spirits = new Map(), daemons = new Map(), shown = new Map();
const names = {};
let awaySince = null, myPrivate = {}, myPouch = null, readOnly = false;
let sheetName = null, sheetArg = null, selected = null;
/* The homeroom (br-home-is-a-room): `list` is GET /api/between (your home and a summary of each room), `myHome` your
   private home doc (look, goals, check-ins), `lookDraft` the Look sheet's choices before they are kept. */
let list = null, homeId = null, myHome = {}, lookDraft = null;
const isHome = g => !!(g && g.kind === "home");
/* Part 3 (his rulings of 2026-10-23, br-home-is-a-room overruled): everyone spawns in their homeroom. A room in the link
   is a doorway beside the mirror, not where you land; an invitation's doorway stays shut until the orientation is read
   and ticked. `portalTo` is { id, invite, open, name }. */
let portalTo = null, entering = null;
const THROUGH = "between.through";
const ROOM_URL = id => "/ontology-game/between" + (id ? "?g=" + encodeURIComponent(id) : "");
/* Chapter 1's creator reads the same look text (br-look-is-sprouts). Sprout has no public address yet: this is the creator
   branch's preview, behind the Vercel sign-in. */
const CHAPTER1_LOOK = t => "https://sprout-git-claude-project-thr-7fd764-wendells-projects-9c1b16dc.vercel.app/creator.html?look=" + encodeURIComponent(t);
const outbox = [];

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const now = () => Date.now();
const fmt = t => t ? new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";
const hkey = () => now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
const ls = {
  get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; readIn(t); clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, Math.max(3400, readMs(msg.split(/\s+/).length) + 2600)); }
/* ---------- what broke, and a screenshot to send (Wendell, 2026-10-24) ---------- */
// The last few errors the page caught, sent with a screenshot so a thread sees what he saw.
const errLog = [];
function noteError(e, where) {
  const msg = String((e && (e.message || e.reason && e.reason.message || e.reason)) || e).slice(0, 300);
  const stack = String((e && (e.stack || e.reason && e.reason.stack)) || "").split("\n").slice(0, 4).join(" | ").slice(0, 600);
  const last = errLog[errLog.length - 1];
  if (last && last.msg === msg) { last.n++; return; }
  errLog.push({ at: new Date().toISOString(), where, msg, stack, n: 1 }); if (errLog.length > 12) errLog.shift();
  console.error("[between]", where, e);
  if (!noteError.told) { noteError.told = true; try { toast("Something here went wrong; the room keeps going. More, then Send a screenshot, shows it to Claude."); } catch {} }
}
addEventListener("error", ev => noteError(ev.error || ev.message, "window"));
addEventListener("unhandledrejection", ev => noteError(ev.reason, "promise"));
let shotWanted = false, shot = null; // shot: { image, from: "room" | "file", sending, sent }
// Read the canvas right after a render, in the same frame, so the drawing buffer still holds it.
function takeShot() {
  shotWanted = false;
  try {
    const src = renderer.domElement, k = Math.min(1, 1280 / Math.max(src.width, src.height));
    const c = document.createElement("canvas"); c.width = Math.round(src.width * k); c.height = Math.round(src.height * k);
    c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
    shot = { image: c.toDataURL("image/jpeg", 0.82), from: "room" };
  } catch (e) { noteError(e, "shot"); shot = { image: null, from: "room" }; }
  openSheet("shot");
}
function shotFile(file) {
  if (!file) return;
  const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => {
    const k = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
    const n = $("#shotNote"), note = n ? n.value : ""; shot = { image: c.toDataURL("image/jpeg", 0.85), from: "file" }; renderSheet(); const n2 = $("#shotNote"); if (n2) n2.value = note;
  };
  img.onerror = () => { URL.revokeObjectURL(url); toast("That picture would not open. Try a PNG or JPEG."); };
  img.src = url;
}
function shotState() {
  const V = view(), g = V.g;
  return {
    room: g ? (isHome(g) ? "homeroom" : "room") : storeDown ? "store down" : "none", gardenId, phase: g ? g.phase || null : null,
    me: { x: +meState.pos.x.toFixed(2), z: +meState.pos.z.toFixed(2), y: +groundY(meState.pos.x, meState.pos.z).toFixed(2), sitting: !!meState.sitting, target: meState.target ? { x: +meState.target.x.toFixed(2), z: +meState.target.z.toFixed(2) } : null },
    near: nearKey || null, selected: selected || null, items: V.items ? V.items.size : 0, peers: peers.size,
    screen: innerWidth + "x" + innerHeight + "@" + (window.devicePixelRatio || 1), ua: navigator.userAgent.slice(0, 200),
    errors: errLog.slice(),
  };
}
function shotSheet() {
  if (!shot) return `<div class="stack"><h2>Send a screenshot</h2><p class="muted">Taking it…</p></div>`;
  if (shot.sent) return `<div class="stack"><h2>Sent</h2><p>Claude can read it now, with your note and where you stood. Tell the thread you sent one.</p><div class="row"><button type="button" data-close>Back to the room</button></div></div>`;
  return `<form class="stack" id="shotForm"><h2>Send a screenshot</h2>
    ${shot.image ? `<img src="${shot.image}" alt="The screenshot" style="width:100%;border-radius:10px">` : `<p class="muted">The room would not give a picture. Choose one of your own below.</p>`}
    <p class="muted small">${shot.from === "file" ? "Your picture." : "The room as it was a moment ago (the buttons and names are not in it)."} Sent with it: this page's link, where you stand, and ${errLog.length ? errLog.length + " error" + (errLog.length > 1 ? "s" : "") + " the page caught" : "no errors (none were caught)"}.</p>
    <label for="shotPick">Or choose your own screenshot<input id="shotPick" type="file" accept="image/*"></label>
    <label for="shotNote">What happened<textarea id="shotNote" maxlength="4000" placeholder="It froze when I walked up onto the moss."></textarea></label>
    <div class="row"><button type="submit" ${shot.image && !shot.sending ? "" : "disabled"}>${shot.sending ? "Sending…" : "Send to Claude"}</button><button class="quiet" type="button" data-close>Close</button></div></form>`;
}
document.addEventListener("change", ev => { if (ev.target && ev.target.id === "shotPick") shotFile(ev.target.files && ev.target.files[0]); });
document.addEventListener("submit", async ev => {
  if (ev.target.id !== "shotForm") return;
  ev.preventDefault(); ev.stopImmediatePropagation();
  if (!shot || !shot.image || shot.sending) return;
  const note = ($("#shotNote").value || "").trim();
  shot.sending = true; renderSheet();
  try {
    await api("/api/council/preview-shots", { page: location.href, note, image: shot.image, state: shotState() });
    shot.sent = true;
  } catch (e) {
    toast(e.code === "unauthenticated" ? "Sign in to bars-engine first, then send it again." : "It did not send (" + (e.message || e.code) + "). Try again in a moment.");
  } finally { if (shot) shot.sending = false; renderSheet(); }
}, true);
function hash(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ---------- writes, with an outbox for when the connection drops (as the intake page does) ---------- */
const fail = (code, msg) => Object.assign(new Error(msg || code), { code });
async function api(url, body) {
  let res;
  try { res = await fetch(url, { method: "POST", credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); }
  catch (e) { throw fail("unavailable", "no connection"); }
  const j = await res.json().catch(() => ({}));
  if (res.status === 401) throw fail("unauthenticated", j.error);
  if (!res.ok) throw fail(j.code || (res.status === 403 ? "permission_denied" : res.status >= 500 ? "unavailable" : "invalid_argument"), j.error);
  return j;
}
/* One write. Planting the first spark creates the garden; every other write names its path in it. The answer is the
   document as the server now holds it, so the page shows it without waiting for the next poll. */
async function rawOp(o) {
  if (!gardenId) {
    if (o.path !== "garden/main" || o.op !== "set") throw fail("invalid_argument", "plant a spark first");
    const j = await api("/api/between", { data: o.data });
    gardenId = j.id; garden = j.doc;
    try { const u = new URL(location.href); u.searchParams.set("g", gardenId); u.searchParams.delete("invite"); history.replaceState(null, "", u); } catch {}
    poll();
    return;
  }
  const j = await api("/api/between/" + gardenId + "/doc", { path: o.path, op: o.op, data: o.data ?? null, invite });
  apply(o.path, j.doc);
}
/* Keep a written document in the local copy until the next poll brings the same. */
function apply(path, doc) {
  const [c, id] = path.split("/");
  if (path === "garden/main") garden = doc;
  else if (c === "data") { if (path === privPath()) myPrivate = { ...(doc || {}) }; else if (path === pouchPath()) myPouch = doc || null; else if (path === homePath()) setHome(doc); }
  else { const map = { items, spirits, daemons, shown }[c]; if (map) doc ? map.set(id, doc) : map.delete(id); }
  refresh();
}
function saveOutbox() { if (me) ls.set("between.outbox." + gardenId + "." + me, outbox); }
async function op(path, kind, data) {
  const o = { path, op: kind, data };
  if (outbox.length || !navigator.onLine) { outbox.push(o); saveOutbox(); toast("Kept on this device. It goes to the garden when you are back online."); refresh(); return; }
  try { await rawOp(o); }
  catch (e) {
    const code = e && e.code;
    if (code === "unauthenticated") { location.href = "/login?returnTo=" + encodeURIComponent(location.pathname + location.search); return; }
    if (code === "invalid_argument" || code === "permission_denied" || code === "not_found") { if (code === "permission_denied" && !isMember(view().g)) readOnly = true; toast(code === "permission_denied" && e.message ? e.message : "That did not save: " + (e.message || code)); refresh(); return; }
    outbox.push(o); saveOutbox(); toast("Kept on this device. It goes to the garden when you are back online."); refresh();
  }
}
let flushing = false;
async function flush() {
  if (flushing || !outbox.length || !gardenId || !navigator.onLine) return;
  flushing = true;
  try {
    while (outbox.length) {
      try { await rawOp(outbox[0]); outbox.shift(); saveOutbox(); }
      catch (e) { if (e && e.code !== "unavailable") { outbox.shift(); saveOutbox(); continue; } break; }
    }
    if (!outbox.length) toast("You are back online, and everything you did while away is in the garden.");
  } finally { flushing = false; refresh(); }
}
window.addEventListener("online", flush);
setInterval(flush, 15000);

function overlay(path, base) {
  let d = base ? JSON.parse(JSON.stringify(base)) : null;
  for (const o of outbox) if (o.path === path) {
    if (o.op === "set") d = JSON.parse(JSON.stringify(o.data));
    else if (o.op === "delete") d = null;
    else if (o.op === "update" && d) d = merge(d, o.data);
  }
  return d;
}
function merge(a, b) {
  for (const [k, v] of Object.entries(b)) {
    if (v && typeof v === "object" && !Array.isArray(v) && a[k] && typeof a[k] === "object" && !Array.isArray(a[k])) a[k] = merge({ ...a[k] }, v);
    else a[k] = v;
  }
  return a;
}
function view() {
  const g = overlay("garden/main", garden);
  const coll = (name, map) => {
    const out = new Map();
    for (const [id, d] of map) out.set(id, d);
    for (const o of outbox) if (o.path.startsWith(name + "/")) { const id = o.path.split("/")[1]; if (!out.has(id)) out.set(id, null); }
    for (const id of [...out.keys()]) { const d = overlay(name + "/" + id, map.get(id)); d ? out.set(id, d) : out.delete(id); }
    return out;
  };
  return { g, items: coll("items", items), spirits: coll("spirits", spirits), daemons: coll("daemons", daemons), shown: coll("shown", shown) };
}

/* ---------- derived state ---------- */
const members = g => g && g.members ? Object.keys(g.members) : [];
const other = g => members(g).find(u => u !== me) || null;
const isMember = g => !!(g && g.members && g.members[me]);
function nameOf(uid, g) {
  if (!uid) return g && g.setup ? g.setup.who : "them";
  if (uid === me) return "you";
  if (names[uid]) return names[uid];
  if (g && g.startedBy !== uid && g.setup) return g.setup.who;
  return "your partner in this";
}
const possessive = (uid, g) => uid === me ? "yours" : nameOf(uid, g) + "'s";
/* A lantern counts toward the Between once, when someone other than its maker has said yes (lanternLit in rules.ts). */
const lanternLit = it => it.kind === "lantern" && !!it.yes && typeof it.yes === "object" && Object.entries(it.yes).some(([k, v]) => k !== it.by && typeof v === "number" && Number.isFinite(v));
const isFed = it => it.kind === "lantern" ? lanternLit(it) : it.kind !== "agreement" && (it.status === "received" || it.status === "kept");
function satisfaction(its) {
  let agreed = 0, fed = 0;
  for (const it of its.values()) {
    if (it.kind === "agreement" && it.status === "agreed") agreed++;
    else if (isFed(it)) fed++;
  }
  return Math.max(1, Math.min(10, Math.round(3 + Math.min(agreed, 4) * 1.2 + Math.min(fed, 8) * 0.6)));
}
const stateOf = s => s <= 4 ? "charged" : s <= 7 ? "steadied" : "allied";
const STATE_TEXT = { charged: ["Charged", "restless, still carrying more charge than care"], steadied: ["Steadied", "settled, holding"], allied: ["Allied", "fed and in leaf"] };
const isStale = g => g && g.lastTendedAt && now() - g.lastTendedAt > STALE_DAYS * 864e5;
function betweenName(its) {
  let n = null, t = 0;
  for (const it of its.values()) if (it.kind === "name" && (it.status === "received" || it.status === "kept") && it.at > t) { n = it.text; t = it.at; }
  return n;
}
/* The person who started the garden wears teal; the one who joined wears plum. */
function hueOf(uid, g) {
  if (g && uid === g.startedBy) return 0x5fc0b5;
  if (g && g.members && g.members[uid]) return 0xd48bc0;
  return 0xb9ae9f;
}
const cssHue = n => "#" + n.toString(16).padStart(6, "0");

/* ===================================================================================================
   The room
   =================================================================================================== */
const stage = $("#stage");
const renderer = new THREE.WebGLRenderer({ antialias: !LOW_POWER || (window.devicePixelRatio || 1) < 2, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LOW_POWER ? 1.5 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
stage.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1018);
scene.fog = new THREE.Fog(0x24161a, 10, 30);
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
let hollow = null;
const betweenLight = new THREE.PointLight(0x9ad8cf, 5, 6, 1.5); betweenLight.position.set(BETWEEN_AT.x, DAIS_Y + 1.1, BETWEEN_AT.z + 0.3); scene.add(betweenLight);
let lightScale = 1;
/* The light that travels with you (round 3 build): a narrow soft key from over your shoulder on the camera's side, aimed at
   you alone so no pool shows on the floor. During a check-in it takes the feeling's element colour and breathes. */
const waveLight = new THREE.SpotLight(0xffe2c0, 0, 6, 0.25, 1, 2); scene.add(waveLight, waveLight.target);
const KEY_COLOR = new THREE.Color(0xffe2c0), keyEl = new THREE.Color(0xffe2c0);
let keyCheck = 0;
/* The mirror's own light, on only while you stand at it: a warm sconce left of the frame, a cool one right, and a wide
   window light behind you. Offsets are from the mirror (x, z) and the floor; each aims at your chest where you stand. */
const mirrorLights = [[0xffd6a8, "warm", 0.8, -0.45, 1.55, 0, 1.2], [0xd8d0ff, "cool", 0.8, 0.55, 1.35, 0, 1.1], [0xa8c4ff, "rim", 0.6, -1.0, 2.6, 3.55, 1.1]]
  .map(([c, k, ang, x, y, z, ty]) => { const l = new THREE.SpotLight(c, 0, 3.5, ang, 1, 2); l.userData.at = { k, x, y, z, ty }; scene.add(l, l.target); return l; });
let figLight = figureLightOf(null), figEnv = null, figDc = 1, probeDirty = true;

function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < h ? 66 : 50; camera.updateProjectionMatrix(); }
addEventListener("resize", resize); resize();

const loader = new GLTFLoader();
/* Models are plain .glb files served beside the page; the hollow itself is built in code (hollow.js). */
const MODELS = "/between/m/";
const loadGltf = url => loader.loadAsync(url);
function loadStep(msg) { const el = $("#loadStep"); if (el) el.textContent = msg; }
const templates = {};
function loadModel(name) {
  if (!templates[name]) templates[name] = loadGltf(MODELS + name + ".glb").then(g => {
    const root = g.scene; mergeByParent(root); root.updateMatrixWorld(true);
    let box = new THREE.Box3();
    root.traverse(o => { if (o.isMesh) { if (o.isSkinnedMesh) { o.computeBoundingBox(); const b = o.boundingBox.clone().applyMatrix4(o.matrixWorld); box.union(b); } else box.expandByObject(o); } });
    return { scene: root, anims: g.animations, box };
  }, e => { delete templates[name]; throw e; });
  return templates[name];
}

/* A look on the player figure (part 4 fix, his note of 2026-10-24: "the clothes and robes aren't rendering"): every player
   is the creator's figure, dressed by wardrobe.js: shape and build as bone scales, the cut (jacket, wrap dress, long coat)
   on the skinned robe, the dye, skin and hair. player.glb, a body with a tunic painted on, is no longer drawn. */
const bodyOpts = lk => ({ look: lk ? parseLook(lk) : null });
/* Bodies are cloned from one template each; their colour is set per owner on a copy of the robe. */
async function makeBody(model, height, tint, tintAmt, opts) {
  const dressed = model === "player";
  const t = await loadModel(dressed ? "dusk/average-dusk" : model);
  const obj = skClone(t.scene);
  const size = t.box.getSize(new THREE.Vector3());
  const tall = model === "fox" || model === "tortoise" ? Math.max(size.x, size.z) : size.y;
  const k = height / Math.max(tall, 0.01);
  obj.scale.setScalar(k);
  const wardrobe = dressed ? dressFigure(obj, await loadParts(loadGltf)) : null;
  if (wardrobe) wardrobe.set(opts && opts.look);
  obj.position.y = -t.box.min.y * k;
  const t0box = t.box.min.y;
  const holder = new THREE.Group(); holder.add(obj);
  if (opts && opts.ring != null) { // whose it is shows as a ring of light at its feet; bodies keep their own colours
    const r = new THREE.Mesh(new THREE.RingGeometry(opts.ringR || 0.42, (opts.ringR || 0.42) + (opts.ringW || 0.09), 40), new THREE.MeshBasicMaterial({ color: opts.ring, transparent: true, opacity: opts.ringA || 0.85, side: THREE.DoubleSide, depthWrite: false }));
    r.rotation.x = -Math.PI / 2; r.position.y = 0.02; holder.add(r);
  }
  obj.traverse(o => {
    if (o.isMesh) {
      o.frustumCulled = false;
      if (tint != null) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        const nm = mats.map(m => { const c = m.clone(); if (c.color && !/eye|glint|lid/i.test(m.name || "")) c.color.lerp(new THREE.Color(tint), tintAmt); return c; });
        o.material = Array.isArray(o.material) ? nm : nm[0];
      }
    }
  });
  const mixer = new THREE.AnimationMixer(obj);
  const clip = n => t.anims.find(a => a.name === n);
  const acts = {};
  for (const n of ["Walk", "Idle"]) { const c = clip(n); if (c) acts[n] = mixer.clipAction(c); }
  /* A dressed figure blends its Walk and Idle by weight each frame toward what its stance asks (stance.js); the robe is skinned,
     so it follows whatever the clips and the code poses make. Older files without an Idle keep standing at the Walk's first frame. */
  const managed = !!(wardrobe && acts.Walk && acts.Idle && wardrobe.hasIdle);
  const cw = { Walk: 0, Idle: 1 }; let cur = "idle";
  if (managed) { acts.Walk.play(); acts.Walk.setEffectiveWeight(0); acts.Idle.play(); acts.Idle.setEffectiveWeight(1); }
  else {
    if (acts.Idle) acts.Idle.play();
    if (wardrobe && acts.Walk) { acts.Walk.play(); acts.Walk.paused = true; }
  }
  let walking = false;
  /* Poses made in code over the clip (the player model has a walk and nothing else): sitting cross-legged on a cushion,
     and a wave of the right hand. Bone axes were read off player.glb: hip X lifts the thigh forward, knee X folds the
     shin, shoulder Z raises the arm to the side. */
  const bones = {}; for (const n of ["hips", "hipL", "hipR", "kneeL", "kneeR", "shoulderL", "shoulderR", "elbowL", "elbowR", "spine", "neck"]) { const b = obj.getObjectByName(n); if (b) bones[n] = { b, q: b.quaternion.clone() }; }
  const hipsY = bones.hips ? bones.hips.b.position.y : 0;
  const qe = new THREE.Quaternion(), eu = new THREE.Euler(), sv = new THREE.Vector3();
  const bend = (n, x, y, z, w) => { const B = bones[n]; if (!B) return; qe.setFromEuler(eu.set(x * w, y * w, z * w, "XYZ")); B.b.quaternion.copy(B.q).multiply(qe); };
  let sit = 0, waveT = -9, rest = 0, lastSeatAt = null;
  return {
    holder, mixer, isPlayer: !!bones.hipL, scale: k, dressed: !!wardrobe,
    stance: () => cur,
    setWalking(w) {
      if (w === walking) return; walking = w;
      if (managed) return;   // pose() fades the clips toward the stance
      // a dressed figure with no Idle stands at the Walk's first frame rather than fading to the bind pose
      if (wardrobe && acts.Walk) { acts.Walk.play(); acts.Walk.paused = !w; if (!w) acts.Walk.time = 0; return; }
      if (acts.Walk) { if (w) { acts.Walk.reset().fadeIn(0.2).play(); acts.Idle && acts.Idle.fadeOut(0.2); } else { acts.Walk.fadeOut(0.3); if (acts.Idle) acts.Idle.reset().fadeIn(0.3).play(); } }
    },
    wave(t) { waveT = t; },
    /* After mixer.update: sitting (0..1 eases in), waving for 1.6 s, and for animals a curled-up rest (0..1). */
    pose(t, dt, wantSit, wantRest, seatAt) {
      if (seatAt != null) lastSeatAt = seatAt; else if (!wantSit && sit > 0.01) seatAt = lastSeatAt; // getting up eases off the same seat
      sit += ((wantSit ? 1 : 0) - sit) * Math.min(1, dt * 5);
      rest += ((wantRest ? 1 : 0) - rest) * Math.min(1, dt * 3);
      if (managed) {
        const s = stance({ moving: walking, sitting: !!wantSit });
        if (s !== cur) { if (s === "walk" && cw.Walk < 0.05) acts.Walk.time = 0; cur = s; }
        const want = clipWeights(cur), k = 1 - Math.exp(-3 * dt / FADE[cur]);
        for (const n of ["Walk", "Idle"]) { cw[n] += (want[n] - cw[n]) * k; if (Math.abs(cw[n] - want[n]) < 0.002) cw[n] = want[n]; acts[n].setEffectiveWeight(cw[n]); }
      }
      if (bones.hipL && sit > 0.01) {
        const w = sit;
        if (acts.Walk && wantSit && !managed) acts.Walk.weight = 0;
        for (const [n, x, y, z] of SIT) bend(n, x, y, z, w);   // stance.js, so the robe tools pose the same sit
        // a seated breath (about one every 4.5 s): the chest lifts and settles, the head stays level, so a sitting is alive, not held
        if (bones.spine && bones.neck) { const br = Math.sin(t * 1.4) * 0.03 * w; qe.setFromEuler(eu.set(-br, 0, 0, "XYZ")); bones.spine.b.quaternion.multiply(qe); qe.setFromEuler(eu.set(br, 0, 0, "XYZ")); bones.neck.b.quaternion.multiply(qe); }
        bones.hips.b.position.y = hipsY;
        if (seatAt != null) {
          /* Sat on what is under it (Wendell, 2026-10-24, the figure sunk into the plum cushion): the hip joints come to rest
             SEAT_PAD over the seat's top (seatAt, metres over the holder), as the caves' seatAvatar does (#434), instead of
             dropping by a fixed amount whatever the seat. Measured each frame, so any build or height lands on the cushion. */
          holder.updateMatrixWorld(true);
          const hw = bones.hips.b.getWorldPosition(sv).y - holder.position.y, sy = bones.hips.b.parent.getWorldScale(sv).y || 1;
          bones.hips.b.position.y = hipsY - (hw - (seatAt + SEAT_PAD)) / sy * w;
        } else bones.hips.b.position.y = hipsY - SIT_DROP * w;
      } else if (bones.hips) bones.hips.b.position.y = hipsY;
      if (acts.Walk && !wantSit && acts.Walk.weight === 0 && !managed) acts.Walk.weight = 1;
      const wv = t - waveT;
      if (bones.shoulderR && wv < 1.6) {
        const w = Math.sin(Math.min(1, wv / 1.6) * Math.PI) * 1.4; const wt = Math.min(1, w);
        bend("shoulderR", 0, 0, 2.5, wt); bend("elbowR", 0, 0, Math.sin(wv * 14) * 0.6, wt);
      }
      if (!bones.hipL) { // a spirit settling down: low, still, breathing
        obj.scale.set(k * (1 + rest * 0.12), k * (1 - rest * 0.38), k * (1 + rest * 0.12));
        obj.position.y = -t0box * k * (1 - rest * 0.38);
        mixer.timeScale = 1 - rest * 0.85;
      }
      if (wardrobe) wardrobe.dress(dt);   // the robe's skirt panels from the legs as posed now (after the mixer and the sit)
    },
  };
}
const FACE = 0; // the bodies face +z in their files

let roomReady = false;
/* The room kit (public/calrunia/room-kit.js, his yes to Still A, 2026-10-24): the homeroom is the `nook` shell, a room you
   share the `hollow` shell, today's Dusk hollow with its pieces pre-placed. A shell is built once; a page that guessed wrong
   at boot (a room in the link that turned out to be your home, or the other way) builds again once it knows. */
let builtShell = null;
function buildRoom(shell = "hollow") {
  if (hollow) scene.remove(hollow.root);
  hollow = buildHollow(scene, { lowPower: LOW_POWER, shell });
  builtShell = hollow.layout.shell; roomSig = ""; styleNow = null;
  relayout();
  wake.group.clear(); wake.group.visible = false; wake.on = false; wake.k = 1; wake.group.scale.setScalar(1);
  if (builtShell === "nook") { // where you wake in the first minute: front of the room, facing the doorway
    const c = makeRoomItem("cushion"); wake.group.add(c); wake.group.position.set(0.35, 0, 1.45);
    wake.yaw = Math.atan2(PORTAL_AT.x - 0.35, PORTAL_AT.z - 1.45); wake.group.rotation.y = wake.yaw;
  }
  if (shelf.group) { scene.remove(shelf.group); shelf.group = null; shelf.sig = ""; }
  roomReady = true;
}
/* What stands where depends on the shell: the hearth, the doorway, where you wake, and the mirror's default place. */
function relayout() {
  const L = hollow.layout;
  HEARTH_AT.set(HEARTH.x, 0, HEARTH.z);
  PORTAL_AT.set(L.portal.x, 0, L.portal.z); portal.position.copy(PORTAL_AT).setY(DAIS_Y); portal.rotation.y = L.portal.yaw;
  L.spawn.forEach(([x, z], i) => SPAWN[i].set(x, 0, z));
  setMirrorAt(null);
  between.position.copy(BETWEEN_AT).setY(DAIS_Y);
}
const inNook = () => builtShell === "nook";

/* ---------- labels drawn over the room ---------- */
const labelsEl = $("#labels");
const labels = new Map();
function label(key, text, cls, color) {
  let el = labels.get(key);
  if (!el) { el = document.createElement("div"); el.className = "lab"; labelsEl.appendChild(el); labels.set(key, el); }
  if (el._t !== text) { el.textContent = text; el._t = text; }
  const c = "lab " + (cls || ""); if (el.className !== c) el.className = c;
  if (color) el.style.setProperty("--c", color);
  el._seen = true;
  return el;
}
const tmpV = new THREE.Vector3();
function placeLabel(el, pos) {
  tmpV.copy(pos).project(camera);
  if (tmpV.z > 1 || tmpV.z < -1) { el.style.display = "none"; return; }
  el.style.display = "";
  el.style.left = ((tmpV.x + 1) / 2 * innerWidth) + "px";
  el.style.top = ((1 - tmpV.y) / 2 * innerHeight) + "px";
}

/* ---------- the Between (or the spark): the creature from the concept views (creature.js) ---------- */
const between = new THREE.Group(); between.position.copy(BETWEEN_AT).setY(DAIS_Y); scene.add(between);
const creature = createCreature(); between.add(creature.group);
/* motes: the aura, fast and jagged when charged, slow when allied */
const MOTES = 28;
const moteGeo = new THREE.BufferGeometry(); moteGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MOTES * 3), 3));
const moteMat = new THREE.PointsMaterial({ color: 0xd48bc0, size: 0.09, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, map: (() => {
  const c = document.createElement("canvas"); c.width = c.height = 32; const x = c.getContext("2d"); const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })() });
const motes = new THREE.Points(moteGeo, moteMat); between.add(motes);
const fedOrbs = new THREE.Group(); between.add(fedOrbs);
let look = { phase: "spark", state: "steadied", stale: false, sat: 3 };
/* The homeroom has no Between: where it would sit stands a tall mirror, and walking up to it opens the Look sheet. */
const mirror = new THREE.Group(); mirror.position.copy(BETWEEN_AT).setY(DAIS_Y); mirror.visible = false; scene.add(mirror);
{
  const wood = new THREE.MeshStandardMaterial({ color: 0x6a4a30, roughness: 0.7 });
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.045, 8, 40), wood); frame.scale.y = 1.55; frame.position.y = 1.0; mirror.add(frame);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.4, 40), new THREE.MeshStandardMaterial({ color: 0xb8ccd8, metalness: 0.9, roughness: 0.12, emissive: 0x30404c, emissiveIntensity: 0.6 }));
  glass.scale.y = 1.55; glass.position.set(0, 1.0, 0.005); mirror.add(glass); mirror.userData.glass = glass;
  const back = glass.clone(); back.material = wood; back.rotation.y = Math.PI; back.position.z = -0.005; mirror.add(back);
  for (const sx of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.42, 6), wood); leg.position.set(sx * 0.16, 0.19, -0.06); leg.rotation.z = sx * 0.12; mirror.add(leg); }
}

/* Mirror mode (part 4, his ask of 2026-10-23): the Look is the mirror itself. You step up in front of it and the screen
   becomes the glass: the camera stands where the mirror is, looking back at you, the picture flipped as a mirror flips it.
   Each choice re-dresses you at once; drag to turn and see your back. The choices sit in a short strip below the glass. */
const MIRROR_STAND = new THREE.Vector3(BETWEEN_AT.x, 0, 0.55);   // between the cushions, facing the mirror
let MIRROR_CAM_Z = MIRROR_STAND.z - 2.65;                         // far enough back that you fit the glass
/* In the nook the mirror is an item (rk-earned-only): it stands on whichever floor spot you set it on, facing the room, and the
   Look happens there. Unplaced, it is in your satchel and the Look button still opens it. */
const MIRROR_HOME = new THREE.Vector3(0, 0, -0.35);
let mirrorSpot = null;
function setMirrorAt(p) {
  const at = p || MIRROR_HOME;
  BETWEEN_AT.set(at.x, 0, at.z); MIRROR_STAND.set(at.x, 0, at.z + 0.9); MIRROR_CAM_Z = MIRROR_STAND.z - 2.65;
  mirror.position.set(at.x, DAIS_Y, at.z);
}
const mirrorShown = () => inNook() ? !!mirrorSpot : isHome(garden);

/* ---------- the room kit: the satchel, the spots, and what stands on them (rk-spots-not-grid, rk-place-is-shared) ----------
   Placements live in garden/main as `room.placed` (rules.ts roomWrite), so a homeroom keeps them in its own doc and a shared
   room's show to both of you at the next poll. With the store down (a preview before its migration) they stay on this page. */
const PREVIEW_HOST = location.hostname !== "bars-engine.vercel.app";
const KQ = new URLSearchParams(location.search);
const SATCHEL_ALL = PREVIEW_HOST && KQ.get("satchel") === "all";   // previews: every item in the satchel, to test placing
const NOOK_SKIP = PREVIEW_HOST && KQ.get("nook") === "1";          // previews: land in the nook past the first minute
const MIRROR_SKIP = PREVIEW_HOST && KQ.get("mirror") === "1";      // previews: open standing at the mirror (the Look)
// previews: ?sit=hearth walks you to the hearth's seat and sits you (the hearth moment opens once sat); ?sit=<seat id> any seat.
// ?cushion=<floor spot> sets a cushion down there first (with the store down, the only way to have one). E.g. ?nook=1&sit=hearth
const WAKE_SKIP = PREVIEW_HOST && KQ.get("wake") === "1";        // previews: wake sat on the first minute's cushion (?nook=1&wake=1)
const SIT_SKIP = PREVIEW_HOST ? KQ.get("sit") : null, CUSHION_SKIP = PREVIEW_HOST ? KQ.get("cushion") : null;
// previews: ?embers=demo puts four held embers in your pouch on this page only (never saved), so the seated hearth moment shows
// with an empty pouch or the store down; a lantern made from one stands on this page only. E.g. ?nook=1&sit=hearth&embers=demo
const EMBER_DEMO = PREVIEW_HOST && KQ.get("embers") === "demo";
// previews: ?tea=pour pours a cup as soon as you are sat by the kettle; ?tea=sip starts at the first sip, the cup already full.
// E.g. ?nook=1&sit=hearth&tea=sip. ?drink=r4 plays round 4's drink instead of the baked one (tea.js), e.g. ?nook=1&sit=hearth&tea=sip&drink=r4
const TEA_SKIP = PREVIEW_HOST ? KQ.get("tea") : null;
// previews: ?fl=warm:7,kMirror:0.6 tries other figure-light strengths (room-styles.js FIGURE_LIGHT names) without a deploy
const FL_TRY = PREVIEW_HOST && KQ.get("fl") ? Object.fromEntries(KQ.get("fl").split(",").map(kv => kv.split(":")).filter(([k, v]) => k && Number.isFinite(+v)).map(([k, v]) => [k, +v])) : null;
let satchelOpen = false, armed = null, localPlaced = {}, roomSig = "", roomViewK = 0;
const ROOM_VIEW = { // camera and focus for the whole nook: a phone stands further back and higher to fit the hook and the floor
  wide: [new THREE.Vector3(0.35, 2.35, 3.55), new THREE.Vector3(-0.25, 0.85, -0.9)],
  phone: [new THREE.Vector3(0.2, 2.5, 3.5), new THREE.Vector3(-0.4, 0.75, -0.8)], fovPhone: 80,
};
function roomNow() {
  const g = view().g;
  return { shell: builtShell, style: (g && g.style) || null, placed: (g ? g.room && g.room.placed : localPlaced) || {} };
}
function myEarned() {
  if (SATCHEL_ALL) return ITEM_ORDER.filter(id => !ITEMS[id].shelf);
  let spirits = []; const st = caveStore(); try { spirits = st ? st.all() : []; } catch {}
  const home = minuteDoc({ ...((list && list.home) || {}), ...myHome });
  return earnedItems(earnedEvents({ home, rooms: (list && list.gardens) || [], spirits }));
}
const mySatchel = () => satchelOf(myEarned(), builtShell, roomNow().placed, me);
const canArrange = () => { const g = view().g; return !readOnly && (storeDown ? inNook() : !!g && (isHome(g) || (isMember(g) && g.phase !== "closed"))); };
/* What a spot holds, made by the room's own code: the mirror in the nook is the real mirror, moved; elsewhere a copy of it. */
function makeItem(id) {
  if (id === "mirror") {
    if (inNook()) return new THREE.Group();
    const m = mirror.clone(true); m.position.set(0, 0, 0); m.visible = true; return m;
  }
  return makeRoomItem(ITEMS[id] ? ITEMS[id].make : id);
}
function syncRoom() {
  if (!hollow) return;
  const r = roomNow(), sig = JSON.stringify(r);
  if (sig === roomSig) return;
  roomSig = sig;
  const res = applyRoom({ ...hollow.handles, scene, make: makeItem }, r.style ? r : { ...r, style: undefined });
  styleNow = res.style && res.style.id;
  figLight = figureLightOf(res.style); probeDirty = true;
  const ms = inNook() ? Object.entries(res.placed).find(([, e]) => e.item === "mirror") : null;
  mirrorSpot = ms ? ms[0] : null;
  setMirrorAt(mirrorSpot ? hollow.handles.spots[mirrorSpot].pos : null);
}
/* The rings: shown while the satchel is open; the ones that fit what you hold pulse, as the still's sockets do. */
function spotRings(t) {
  if (!hollow) return;
  const pulse = 0.5 + 0.5 * Math.sin(t * 4.4);
  for (const h of Object.values(hollow.handles.spots)) {
    const answers = !!hm && hm.step === "hang" && hm.hooks.includes(h); // the room answers the lantern: its free hooks glow
    const fits = answers || (!!armed && ITEMS[armed].takes === h.takes);
    const vis = answers || (satchelOpen && !mirrorOn && !h.item && (!armed || fits));
    h.ring.visible = vis;
    if (!vis) continue;
    h.ringMats[0].opacity = fits ? 0.3 + 0.65 * pulse : 0.55;
    h.ringMats[1].opacity = fits ? 0.1 + 0.2 * pulse : 0.1;
    h.ring.scale.setScalar(fits ? 1 + pulse * 0.12 : 1);
    if (!h.flat) h.ring.quaternion.copy(camera.quaternion);
  }
}
async function writeRoom(patch, line) {
  const g = view().g;
  if (!g) { localPlaced = { ...localPlaced, ...patch }; refresh(); return; }
  const shared = !isHome(g);
  await op("garden/main", "update", { room: { placed: patch }, ...(shared ? { history: hist(line), lastTendedAt: now() } : {}) });
}
async function spotTap(sid) {
  if (!hollow || !canArrange()) return;
  const h = hollow.handles.spots[sid]; if (!h) return;
  const r = roomNow(), g = view().g;
  if (h.item) {
    const res = liftFrom(builtShell, r.placed, sid, me); if (!res.ok) return;
    const nm = ITEMS[res.back.item].name;
    await writeRoom(res.patch, res.line);
    toast(res.theirs ? `The ${nm.toLowerCase()} went back to ${nameOf(res.back.owner, g)}'s satchel.` : `The ${nm.toLowerCase()} is back in your satchel.`);
    refreshHud(); return;
  }
  if (!armed) return;
  const res = placeOn(builtShell, r.placed, sid, armed, me, now(), myEarned());
  if (!res.ok) { toast(res.why === "does-not-fit" ? "That goes on another kind of spot." : res.why === "taken" ? "Something stands there already." : "That is not in your satchel."); return; }
  const nm = ITEMS[armed].name, was = armed; armed = null;
  await writeRoom(res.patch, res.line);
  if (was === "mirror" && inNook() && isHome(g) && !mstate().done.mirror) { satchelOpen = false; burst(h.pos.clone().setY(h.pos.y + 0.2), 0xffcf86); minuteAct("mirror"); refreshHud(); return; }
  burst(h.pos.clone().setY(h.pos.y + 0.2), 0xffcf86);
  toast(g && !isHome(g) ? `${nm} set down. ${nameOf(other(g), g)} sees it when they come in.` : `${nm} set down.`);
  if (!mySatchel().length) satchelOpen = false;
  refreshHud();
}
function spotNear(sid, g) {
  const h = hollow && hollow.handles.spots[sid]; if (!h || !h.item) return "";
  const e = roomNow().placed[sid] || {}, it = ITEMS[h.item];
  const whose = !e.owner || e.owner === me ? "Yours. " + it.line : `${esc(nameOf(e.owner, g))} set it down. Lifting it sends it back to their satchel.`;
  return `<div class="what"><b>${esc(it.name)}</b><span class="t">${whose}</span></div>${canArrange() ? `<div class="row"><button class="ghost" type="button" data-act="spotLift" data-id="${esc(sid)}">${!e.owner || e.owner === me ? "Put it back in the satchel" : "Send it back to them"}</button></div>` : ""}`;
}
const satchelGlows = () => inNook() && garden && isHome(garden) && mySatchel().includes("mirror") && !mstate().done.mirror && (mclock.beat === "mirror" || mstate().skipped.mirror);
const satchelBtn = () => `<button class="glassbtn${satchelGlows() ? " glow" : ""}" type="button" data-act="satOpen">Satchel${mySatchel().length ? `<span class="dot" title="Things to set down"></span>` : ""}</button>`;
function setSatchel(on) { satchelOpen = !!on && canArrange(); armed = null; if (satchelOpen) { selected = null; placing = null; } refreshHud(); }
/* The satchel's small icons, the still's own drawings. */
const SAT_ICON = {
  lantern: '<path d="M15 3v4" stroke="#c9a070" stroke-width="2"/><rect x="8" y="7" width="14" height="18" rx="7" fill="#f0a050"/><rect x="8" y="7" width="14" height="18" rx="7" fill="none" stroke="#ffd890" stroke-width="1.4"/>',
  "seed-pot": '<path d="M8 16h14l-2 10H10z" fill="#a8603a"/><path d="M15 16c0-6-4-8-6-9 3 0 6 2 6 6 0-5 3-7 7-7-3 2-6 4-7 10z" fill="#7fb38a"/>',
  cushion: '<ellipse cx="15" cy="18" rx="12" ry="6" fill="#9a5a8e"/><ellipse cx="15" cy="16" rx="11" ry="4.5" fill="#b874a8"/>',
  mirror: '<ellipse cx="15" cy="13" rx="7" ry="10" fill="#bcd8e8"/><ellipse cx="15" cy="13" rx="7" ry="10" fill="none" stroke="#c9a070" stroke-width="2"/><path d="M15 23v5" stroke="#c9a070" stroke-width="2"/>',
  rug: '<ellipse cx="15" cy="17" rx="13" ry="6" fill="#3f9e93"/><ellipse cx="15" cy="17" rx="9" ry="3.6" fill="none" stroke="#efe2c4" stroke-width="1.2"/>',
  scroll: '<rect x="6" y="11" width="18" height="8" rx="4" fill="#efe2c4"/><rect x="4" y="12" width="3" height="6" rx="1.5" fill="#7a5236"/><rect x="23" y="12" width="3" height="6" rx="1.5" fill="#7a5236"/><rect x="13.5" y="11" width="3" height="8" fill="#9a5a8e"/>',
};
function renderSatchel() {
  let el = $("#satchel");
  if (!el) { el = document.createElement("div"); el.id = "satchel"; el.className = "satchel"; el.setAttribute("role", "toolbar"); el.setAttribute("aria-label", "Your satchel"); $("#tools").before(el); }
  const items = satchelOpen ? mySatchel() : [];
  if (armed && !items.includes(armed)) armed = null;
  const h = !satchelOpen ? "" : `<div class="satrow">${items.map(id => `<button class="satitem${id === "mirror" && satchelGlows() ? " glow" : ""}" type="button" data-act="satArm" data-id="${esc(id)}" aria-pressed="${armed === id}"><svg viewBox="0 0 30 30" aria-hidden="true">${SAT_ICON[id] || ""}</svg>${esc(ITEMS[id].name)}</button>`).join("")}${items.length ? "" : `<span class="satnone">Nothing to set down. What you earn here comes to your satchel.</span>`}<button class="glassbtn" type="button" data-act="satClose">Done</button></div>`;
  el.hidden = !satchelOpen;
  if (el._h !== h) { el.innerHTML = h; el._h = h; }
}
const MIRROR_PARTS = [["shape", "Shape"], ["build", "Build"], ["skin", "Skin"], ["style", "Hair"], ["colour", "Hair colour"], ["outfit", "Clothes"], ["dye", "Dye"]];
let mirrorOn = false, mirrorK = 0, mirrorTurn = 0, mirrorPart = "shape";
const TEA_VIEW = { wide: [[0.69, 0.8, 0.98], [-0.12, 0.45, 0.15]], phone: [[0.8, 0.8, 1.15], [-0.1, 0.45, 0.15]] };   // camera, focus, in the seats frame (x left, z ahead)
let seatK = 0, seatViewAt = null; // the low view of you sat on the hearth's cushion (or one you set down), eased in
const mirrorFrame = document.createElement("div"); mirrorFrame.id = "mirrorFrame"; mirrorFrame.setAttribute("aria-hidden", "true"); document.body.appendChild(mirrorFrame);
function setMirror(on) {
  if (on === mirrorOn) return;
  mirrorOn = on; mirrorTurn = 0;
  document.body.classList.toggle("mirroring", on);
  if (on) { standUp(); meState.target = null; meState.keys.clear(); selected = null; placing = null; }
  else { camYaw = 0; camPitch = 0.5; } // stepping back from the glass: behind you, the mirror ahead
  mirrorCut = true; // the picture flips at once, so the camera cuts too rather than flying through you
  probeDirty = true; // the capture is taken where you stand: at the glass, or back in the room
}
let mirrorCut = false;

/* The doorway beside the mirror is the Nook's one world-threshold. It opens after orientation and lets a player choose
   a shared room or the private Triangle Workshop without making the small Nook sprout a corridor of extra doors. */
const PORTAL_AT = new THREE.Vector3(1.3, 0, -1.15);
const portal = new THREE.Group(); portal.position.copy(PORTAL_AT).setY(DAIS_Y); portal.rotation.y = -0.3; portal.visible = false; scene.add(portal);
const portalVeil = new THREE.MeshStandardMaterial({ color: 0x1a1420, emissive: 0x000000, emissiveIntensity: 0, roughness: 0.9, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
{
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a3e28, roughness: 0.75 });
  for (const sx of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.9, 8), wood); post.position.set(sx * 0.5, 0.95, 0); portal.add(post); }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.12, 0.16), wood); lintel.position.y = 1.92; portal.add(lintel);
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.82), portalVeil); veil.position.y = 0.93; portal.add(veil);
  const sill = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.3), wood); sill.position.y = 0.025; portal.add(sill);
}
const portalOpen = () => isHome(garden) && !minuteOn();
const SHIMMER = new THREE.Color(1.0, 0.82, 0.55);
function portalTick(t) {
  portal.visible = isHome(garden);
  if (!portal.visible) return;
  if (portalOpen()) {
    const c = portalTo ? styleOf(portalTo.style).sky.low : [0.08, 0.58, 0.56];
    portalVeil.emissive.setRGB(c[0], c[1], c[2]); portalVeil.emissiveIntensity = 0.75 + Math.sin(t * 2.1) * 0.18 + (entering ? 0.6 : 0);
    portalVeil.opacity = 0.85;
  } else { portalVeil.emissive.setRGB(0.25, 0.2, 0.32); portalVeil.emissiveIntensity = portalTo ? 0.12 : (inNook() && !minuteOn() ? 0.16 : 0.05) + Math.sin(t * 0.7) * 0.03; portalVeil.opacity = 0.92; }
  // the first minute's 1:00, and a yes to a scroll: the doorway shimmers open
  const sh = shimmerT ? (performance.now() - shimmerT) / 1000 : 99;
  if (sh < 4) { const k = Math.sin(Math.min(1, sh / 4) * Math.PI); portalVeil.emissive.lerp(SHIMMER, k * 0.7); portalVeil.emissiveIntensity += k * (0.35 + 0.15 * Math.sin(t * 9)); portalVeil.opacity = 0.92 - k * 0.2; }
  if (entering && (Math.hypot(meState.pos.x - PORTAL_AT.x, meState.pos.z - PORTAL_AT.z) < 0.75 || performance.now() - entering.t0 > 3800)) {
    const e = entering; entering = null;
    markSeen();
    $("#loadMsg").textContent = "Through the doorway"; $("#loadStep").textContent = ""; $("#loading").hidden = false;
    if (e.kind === "dojo") {
      location.href = "/dojo/triangle-workshop?returnTo=" + encodeURIComponent("/ontology-game/between");
    } else {
      try { sessionStorage.setItem(THROUGH, e.id); } catch {}
      location.href = ROOM_URL(e.id) + (e.invite ? "&invite=" + encodeURIComponent(e.invite) : "");
    }
  }
}
/* Walk through the doorway to a room: from the homeroom you walk there; from anywhere else you go home first, where the
   doorway to it stands open (players always spawn in their homeroom). */
function walkThrough(id, inv) {
  if (!isHome(garden)) { markSeen(); location.href = ROOM_URL(id); return; }
  const r = ((list && list.gardens) || []).find(x => x.id === id);
  if (!portalTo || portalTo.id !== id) portalTo = { id, invite: inv || null, open: true, name: r ? roomName(r) : null, style: r ? r.style : null };
  // the first minute is the only orientation (br-orient-each-invite, his ruling of 2026-10-24): the doorway opens at its end
  if (!portalOpen() || minuteOn()) { toast("The vines are still on the doorway. It opens at the end of your first minute here."); return; }
  closeSheet(); standUp(); selected = "portal";
  const front = new THREE.Vector3(Math.sin(portal.rotation.y), 0, Math.cos(portal.rotation.y));
  meState.target = PORTAL_AT.clone().add(front.multiplyScalar(0.15));
  entering = { kind: "room", id, invite: portalTo.invite, t0: performance.now() };
  burst(PORTAL_AT.clone(), 0xffe2a8);
  refreshHud();
}
function walkToTriangleWorkshop() {
  if (!portalOpen()) { toast("The doorway opens when your first minute here is complete."); return; }
  closeSheet(); standUp(); selected = "portal";
  const front = new THREE.Vector3(Math.sin(portal.rotation.y), 0, Math.cos(portal.rotation.y));
  meState.target = PORTAL_AT.clone().add(front.multiplyScalar(0.15));
  entering = { kind: "dojo", t0: performance.now() };
  burst(PORTAL_AT.clone(), 0x2dd4bf);
  refreshHud();
}

/* Who the creature notices: the nearest person within reach, you or the other. */
function creatureTarget() {
  let best = null, bd = 2.8;
  const c = p => { const d = Math.hypot(p.x - BETWEEN_AT.x, p.z - BETWEEN_AT.z); if (d < bd) { bd = d; best = p; } };
  if (meState.body) c(meState.pos);
  for (const p of peers.values()) if (p.body) c(p.pos);
  return best;
}
const TOGETHER_FACE = new THREE.Vector3(0, 0, 2.5);
function bothSitting() {
  if (!(meState.sitting)) return false;
  for (const p of peers.values()) if (p.sitting && p.uid !== me) return true;
  return false;
}
function stepBetween(t, dt) {
  const { phase, state, stale, sat } = look;
  const breath = (t % 10) < 4 ? Math.sin((t % 10) / 4 * Math.PI / 2) : Math.cos(((t % 10) - 4) / 6 * Math.PI / 2); // 4 s in, 6 s out
  const together = bothSitting();
  // sitting together, it turns to face you both (the cushions sit side by side behind it)
  creature.update(t, dt, { phase, state, stale, sat, target: together ? TOGETHER_FACE : creatureTarget(), together });
  const p = moteGeo.attributes.position.array;
  const speed = state === "charged" ? 2.6 : state === "allied" ? 0.35 : 0.8;
  const rad = state === "allied" ? 1.0 : 0.8;
  for (let i = 0; i < MOTES; i++) {
    const a = i / MOTES * Math.PI * 2 + t * speed * (i % 2 ? 1 : -0.7);
    const r = rad + (state === "charged" ? Math.sin(t * 13 + i * 3) * 0.2 : Math.sin(t + i) * 0.06);
    p[i * 3] = Math.cos(a) * r; p[i * 3 + 1] = 0.2 + ((i * 0.37 + t * (state === "charged" ? 0.9 : 0.25)) % 1.3); p[i * 3 + 2] = Math.sin(a) * r;
  }
  moteGeo.attributes.position.needsUpdate = true;
  moteMat.color.setHex(stale ? 0x8d857b : phase === "spark" ? 0xd48bc0 : state === "charged" ? 0xd48bc0 : state === "allied" ? 0xbff0c0 : 0x9ad8cf);
  moteMat.opacity = stale ? 0.2 : 0.75;
  fedOrbs.children.forEach((o, i) => { const a = t * 0.4 + i / Math.max(1, fedOrbs.children.length) * Math.PI * 2; o.position.set(Math.cos(a) * 0.9, 1.45 + Math.sin(t * 1.3 + i) * 0.1, Math.sin(a) * 0.9); });
  const target = stale ? 0.55 : 1;
  lightScale += (target - lightScale) * Math.min(1, dt * 1.5);
  betweenLight.intensity = (phase === "spark" ? 3 : 5) * (stale ? 0.3 : 1) * (0.85 + 0.15 * breath) * (together ? 2.2 : 1);
  betweenLight.color.setHex(phase === "spark" ? 0xd48bc0 : state === "charged" ? 0xd9a0c8 : 0x9ad8cf);
  if (hollow) hollow.update(t, dt, lightScale, camera.position, lastFocus);
}

/* ===================================================================================================
   Things in the garden: agreements are plants, offerings are lights on stones
   =================================================================================================== */
const things = new Map(); // id -> { kind, group, pos, item }
const gardenGroup = new THREE.Group(); scene.add(gardenGroup);
function ringPos(id, r0) {
  const r = rng(hash(id));
  for (let i = 0; i < 20; i++) {
    const a = r() * Math.PI * 2, rr = r0 + r() * 1.6;
    const x = BETWEEN_AT.x + Math.cos(a) * rr, z = BETWEEN_AT.z + Math.sin(a) * rr;
    if (walkable(x, z, 0.4)) return { x, z };
  }
  return { x: BETWEEN_AT.x + 1.8, z: BETWEEN_AT.z - 0.8 };
}
const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a7a68, roughness: 0.85, flatShading: true });
const soilMat = new THREE.MeshStandardMaterial({ color: 0x2c2219, roughness: 1 });
const stemMat = new THREE.MeshStandardMaterial({ color: 0x5c8a4a, roughness: 0.7 });
const amberMat = new THREE.MeshStandardMaterial({ color: 0xe2a85c, emissive: 0xb0742a, emissiveIntensity: 0.6 });
/* Agreements grow as the glowing lotus of the concept views: a closed bud while drafted, a swelling bud when proposed,
   open in both hues once agreed, drooping amber when up for revisit, a stone when retired, soil when composted. */
const petalGeo = (() => { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(0.09, 0.12, 0, 0.28); sh.quadraticCurveTo(-0.09, 0.12, 0, 0);
  const g = new THREE.ShapeGeometry(sh, 5); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, x * x * 3 + y * y * 0.8); } g.computeVertexNormals(); return g; })();
const lilyPad = (() => { const g = new THREE.CircleGeometry(0.26, 16, 0.3, Math.PI * 2 - 0.6); g.rotateX(-Math.PI / 2); return g; })();
const padMat = new THREE.MeshStandardMaterial({ color: 0x4f7a34, roughness: 0.7, side: THREE.DoubleSide });
const petalMats = new Map();
const petalMat = c => { if (!petalMats.has(c)) petalMats.set(c, new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.55, roughness: 0.5, side: THREE.DoubleSide })); return petalMats.get(c); };
function lotusHead(colors, open, droop) {
  const head = new THREE.Group();
  const rings = [[6, 0], [5, 0.5]];
  rings.forEach(([n, off], ri) => {
    for (let i = 0; i < n; i++) {
      const c = colors[(i + ri) % colors.length];
      const m = new THREE.Mesh(petalGeo, petalMat(c));
      const piv = new THREE.Group(); piv.rotation.y = (i + off) / n * Math.PI * 2; m.rotation.x = -(ri ? 0.35 : 0.55) * open - 0.12; m.scale.setScalar(ri ? 0.8 : 1); piv.add(m); head.add(piv);
    }
  });
  const heart = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), amberMat); heart.position.y = 0.04; head.add(heart);
  head.rotation.z = droop;
  return head;
}
function plantMesh(it, g) {
  const grp = new THREE.Group();
  const by = new THREE.Color(hueOf(it.by, g));
  const st = it.status, pend = !!it.pending;
  const pad = new THREE.Mesh(lilyPad, padMat); pad.position.y = 0.02; grp.add(pad);
  if (st === "retired") {
    const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), stoneMat); s.position.y = 0.14; s.scale.set(1, 0.7, 0.8); grp.add(s);
  } else if (st === "composted") {
    pad.visible = false; const m = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 6), soilMat); m.scale.y = 0.35; grp.add(m);
  } else {
    const h = st === "draft" ? 0.18 : st === "proposed" ? 0.34 : 0.42;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, h, 6), stemMat); stem.position.y = h / 2; grp.add(stem);
    if (st === "revisit") { stem.rotation.z = 0.45; stem.position.x = 0.08; }
    let head;
    if (st === "draft") head = lotusHead([by.getHex()], 0.05, 0), head.scale.setScalar(0.55);
    else if (st === "proposed") { head = lotusHead([by.getHex()], 0.25, 0); head.scale.setScalar(0.8); head.userData.pulse = true; }
    else if (st === "revisit") head = lotusHead([0xe2a85c], 0.6, 0.9);
    else head = lotusHead([0x7fe0d0, 0xf0a6d8], 1, 0); // agreed: open, in both hues
    head.position.set(st === "revisit" ? 0.2 : 0, h, 0); grp.add(head);
    grp.scale.setScalar(1.5);
    if (head.userData.pulse) head.userData.keep = true;
    grp.traverse(o => { if (o.userData && o.userData.pulse) o.userData.keep = true; });
    if (st === "agreed") { const halo = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd0ec, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })); halo.position.y = h + 0.05; grp.add(halo); }
    if (pend) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.02, 8, 24), amberMat); r.rotation.x = Math.PI / 2; r.position.y = 0.08; r.userData.pulse = true; grp.add(r); }
  }
  mergeStatic(grp);
  return grp;
}
function lanternMesh(it, g) {
  const c = it.element && FEELS[it.element] ? elHex(it.element) : (typeof it.hue === "string" && /^#[0-9a-f]{3,6}$/i.test(it.hue) ? it.hue : hueOf(it.by, g));
  return paperLantern(c, lanternLit(it) ? 1.25 : 0.8);
}
function orbMesh(it, g) {
  const grp = new THREE.Group();
  const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), stoneMat); s.position.y = 0.14; s.scale.y = 0.55; grp.add(s);
  const c = hueOf(it.by, g);
  const sealed = it.sealed && it.by !== me && !(it.opened && it.opened[me]);
  const m = sealed
    ? new THREE.MeshStandardMaterial({ color: 0x2a221c, emissive: c, emissiveIntensity: 0.25, roughness: 0.4, metalness: 0.3 })
    : new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.9, transparent: true, opacity: 0.9 });
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 14), m); orb.position.y = 0.62; orb.userData.bob = true; grp.add(orb);
  if (sealed) { const seam = new THREE.Mesh(new THREE.TorusGeometry(0.172, 0.012, 6, 28), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1 })); seam.position.y = 0.62; seam.rotation.x = Math.PI / 2; grp.add(seam); }
  return grp;
}
const fly = []; // offerings flying into the Between
function syncThings() {
  const V = view(); const g = V.g;
  const want = new Set();
  const prevStatus = syncThings.prev || new Map(); const nextStatus = new Map();
  for (const [id, it] of V.items) {
    const lan = it.kind === "lantern";
    nextStatus.set(id, lan ? "lantern:" + (it.element || "") + (lanternLit(it) ? "+lit" : "") + ":" + (it.pos ? it.pos.x + "," + it.pos.z + (it.pos.hang ? "@" + it.pos.hang : "") : "")
      : it.status + (it.pending ? "+p" : "") + (it.opened && it.opened[me] ? "+o" : "") + ":" + (it.pos ? it.pos.x + "," + it.pos.z : "")
        + (it.moveAsk && it.moveAsk.pos ? ">" + it.moveAsk.pos.x + "," + it.moveAsk.pos.z : ""));
    const shownHere = lan ? true : it.kind === "agreement" ? it.status !== "composted" || now() - it.at < 864e5 * 30 : it.status === "offered";
    const was = prevStatus.get(id);
    if (was && was.startsWith("offered") && (it.status === "received" || it.status === "kept")) flyIn(id);
    if (!was && syncThings.prev && it.status === "kept" && it.kind !== "agreement" && !lan) flyIn(id, it);
    if (!shownHere) continue;
    want.add(id);
    const sig = nextStatus.get(id) + "|" + it.by;
    let t = things.get(id);
    if (t && t.sig !== sig) { gardenGroup.remove(t.group); t = null; }
    if (!t) {
      // a spot saved under the old dome may fall in a wall or the stream here: nudge it onto open ground
      const raw = it.pos || ringPos(id, it.kind === "agreement" ? 1.6 : 1.1);
      // a lantern sent to a hook at the hearth hangs there, its foot away (the seated hearth moment, hmSend)
      const hook = lan && raw.hang && hollow && hollow.handles.spots[raw.hang], hung = hook && hook.takes === "hang" && !hook.item ? hook : null;
      const pos = hung || walkable(raw.x, raw.z, 0.25) ? raw : pushOut(new THREE.Vector3(raw.x, 0, raw.z), 0.3);
      const group = it.kind === "agreement" ? plantMesh(it, g) : lan ? lanternMesh(it, g) : orbMesh(it, g);
      if (hung) { group.position.copy(hung.pos).setY(hung.pos.y - 0.92); group.children[3].visible = false; group.userData.sway = true; }
      else group.position.set(pos.x, groundY(pos.x, pos.z), pos.z);
      // an ask to move a shared agreement: a faint ring where it would go, until the other person answers
      if (it.moveAsk && it.moveAsk.pos) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.4, 40), new THREE.MeshBasicMaterial({ color: hueOf(it.moveAsk.by, g), transparent: true, opacity: 0.9, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2; ring.userData.pulse = true;
        ring.position.set(it.moveAsk.pos.x - pos.x, groundY(it.moveAsk.pos.x, it.moveAsk.pos.z) - group.position.y + 0.03, it.moveAsk.pos.z - pos.z);
        group.add(ring);
      }
      gardenGroup.add(group);
      t = { id, kind: it.kind === "agreement" ? "agreement" : lan ? "lantern" : "offering", group, pos: new THREE.Vector3(pos.x, 0, pos.z), sig };
      things.set(id, t);
      t.pos.y = 0;
      if (syncThings.prev && !was && it.by !== me) burst(t.pos, hueOf(it.by, g));
    }
    t.item = it;
  }
  for (const [id, t] of things) if (!want.has(id)) { gardenGroup.remove(t.group); things.delete(id); if (selected === "item:" + id) selected = null; }
  syncThings.prev = nextStatus;
  // a hook with a hearth lantern on it lights as the room kit's own hung lantern does
  if (hollow) for (const h of Object.values(hollow.handles.spots)) if (h.takes === "hang" && !h.item) h.glow = [...V.items.values()].some(it => it.kind === "lantern" && it.pos && it.pos.hang === h.id) ? 1 : 0;
  // fed lights orbiting the Between: one per offering said yes to, up to twelve
  let fed = 0; for (const it of V.items.values()) if (isFed(it)) fed++;
  fed = Math.min(fed, 12);
  while (fedOrbs.children.length < fed) fedOrbs.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe2b0 })));
  while (fedOrbs.children.length > fed) fedOrbs.remove(fedOrbs.children[fedOrbs.children.length - 1]);
}
function flyIn(id, it) {
  const t = things.get(id);
  const from = t ? t.pos.clone().setY(groundY(t.pos.x, t.pos.z) + 0.62) : (it && it.pos ? new THREE.Vector3(it.pos.x, groundY(it.pos.x, it.pos.z) + 0.62, it.pos.z) : new THREE.Vector3(BETWEEN_AT.x + 1.5, DAIS_Y + 0.62, BETWEEN_AT.z + 1));
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffe2b0 }));
  m.position.copy(from); scene.add(m);
  fly.push({ m, from, t0: performance.now() / 1000 });
}
const bursts = [];
function burst(pos, color) {
  const r = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 8, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }));
  r.rotation.x = Math.PI / 2; r.position.copy(pos).setY(0.1); scene.add(r);
  bursts.push({ m: r, t0: performance.now() / 1000 });
}

/* ===================================================================================================
   Walkers: spirits and daemons. Each walks a path drawn from its own seed and the shared clock, so both
   people see it in the same place without any messages. Called over, it walks to that spot and waits.
   =================================================================================================== */
const LEG = 9; // seconds per leg: about five walking, the rest standing
function waypoint(seed, k, mode) {
  const r = rng(hash(seed + ":" + k));
  for (let i = 0; i < 30; i++) {
    let x, z;
    if (mode === "near" || (mode === "mixed" && r() < 0.5)) { const a = r() * Math.PI * 2, rr = 1.4 + r() * 1.6; x = BETWEEN_AT.x + Math.cos(a) * rr; z = BETWEEN_AT.z + Math.sin(a) * rr; }
    else { const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * (WALK_R - 0.6); x = Math.cos(a) * rr; z = Math.sin(a) * rr; }
    if (walkable(x, z, 0.5)) return new THREE.Vector2(x, z);
  }
  return new THREE.Vector2(0, 2);
}
function walkerPos(w, tSec) {
  const d = w.doc;
  if (d.stay && d.stay.until > now()) {
    const since = (now() - d.stay.at) / 1000;
    const from = typeof d.stay.fx === "number" ? new THREE.Vector2(d.stay.fx, d.stay.fz) : new THREE.Vector2(d.stay.x, d.stay.z);
    const to = new THREE.Vector2(d.stay.x, d.stay.z);
    const dist = from.distanceTo(to), dur = Math.max(0.1, dist / 1.4);
    const u = Math.min(1, since / dur);
    return { p: from.clone().lerp(to, u), moving: u < 1, dir: to.clone().sub(from) };
  }
  const mode = w.type === "daemon" ? (look.state === "charged" ? "near" : "mixed") : (look.state === "allied" ? "near" : "mixed");
  const k = Math.floor(tSec / LEG), f = (tSec % LEG) / LEG;
  const spirit = w.type === "spirit";
  const a = spirit ? spiritStop(w.id, k, mode) : waypoint(w.id, k, mode), b = spirit ? spiritStop(w.id, k + 1, mode) : waypoint(w.id, k + 1, mode);
  const walkFrac = 0.55;
  let p, walking;
  if (spirit && legHalts(w.id, k)) {
    // a spirit stops partway, looks about, then goes on: two eased walks with a rest between
    const m = a.clone().lerp(b, 0.45), ease = u => u * u * (3 - 2 * u);
    if (f < 0.26) { p = a.clone().lerp(m, ease(f / 0.26)); walking = true; }
    else if (f < 0.36) { p = m; walking = false; }
    else if (f < 0.62) { p = m.clone().lerp(b, ease((f - 0.36) / 0.26)); walking = true; }
    else { p = b.clone(); walking = false; }
    if (!walking) { const out = { p, moving: false, dir: b.clone().sub(a) }; if (f >= 0.62 && b.sniff) out.sniff = b.sniff; return out; }
    return { p, moving: true, dir: f < 0.26 ? m.clone().sub(a) : b.clone().sub(m) };
  }
  const u = f < walkFrac ? f / walkFrac : 1;
  const e = u * u * (3 - 2 * u);
  p = a.clone().lerp(b, e);
  // just let go after being called over: walk from where it waited back onto its own path
  if (d.stay && now() - d.stay.until < 6000) {
    const v = (now() - d.stay.until) / 6000;
    return { p: new THREE.Vector2(d.stay.x, d.stay.z).lerp(p, v), moving: true, dir: p.clone().sub(new THREE.Vector2(d.stay.x, d.stay.z)) };
  }
  return { p, moving: f < walkFrac, dir: b.clone().sub(a), sniff: f >= walkFrac && b.sniff ? b.sniff : null };
}
/* Spirits that move like animals (ba-round4-comfort, Ari's note 5). Every choice comes from the spirit's id, the leg number
   and where the garden's things stand, so both screens see the same stop at the same moment on the shared clock. */
const legHalts = (id, k) => rng(hash(id + ":halt:" + k))() < 0.4;
function spiritStop(id, k, mode) {
  const b = waypoint(id, k, mode);
  if (rng(hash(id + ":sniff:" + k))() >= 0.45) return b;
  // go and sniff at the thing nearest this stop, if one stands within reach
  let best = null, bd = 3.2;
  for (const t of [...things.values()].sort((x, y) => x.id < y.id ? -1 : 1)) { const d = Math.hypot(t.pos.x - b.x, t.pos.z - b.y); if (d < bd) { bd = d; best = t; } }
  if (!best) return b;
  const away = new THREE.Vector2(b.x - best.pos.x, b.y - best.pos.z); if (away.lengthSq() < 1e-4) away.set(0, 1);
  const at = new THREE.Vector2(best.pos.x, best.pos.z).add(away.normalize().multiplyScalar(0.5));
  if (!walkable(at.x, at.y, 0.3)) return b;
  at.sniff = best.pos; return at;
}
const walkers = new Map(); // id -> { id, type, doc, body, holder, ready }
async function syncWalkers() {
  const V = view(); const g = V.g;
  const want = new Map();
  for (const [id, s] of V.spirits) if (!(isHome(g) && s.away && s.away.room)) want.set("s:" + id, { type: "spirit", doc: s }); // one visiting a room is not home
  for (const [id, d] of V.daemons) want.set("d:" + id, { type: "daemon", doc: d });
  for (const [key, w] of walkers) if (!want.has(key)) { if (w.holder) scene.remove(w.holder); walkers.delete(key); const l = labels.get("w:" + key); if (l) { l.remove(); labels.delete("w:" + key); } if (selected === "w:" + key) selected = null; }
  for (const [key, x] of want) {
    let w = walkers.get(key);
    const sig = (x.doc.form || "") + (x.doc.element || "") + (x.doc.which || "") + x.doc.owner;
    if (w && w.sig === sig) { w.doc = x.doc; continue; }
    if (w && w.holder) scene.remove(w.holder);
    w = { id: key, type: x.type, doc: x.doc, sig, ready: false, yaw: 0 };
    walkers.set(key, w);
    (async () => {
      const model = x.type === "spirit" ? (x.doc.form === "tortoise" ? "tortoise" : "fox") : (DAEMONS[x.doc.which] ? x.doc.which : "protector");
      const ring = hueOf(x.doc.owner, view().g);
      const b = x.type === "spirit"
        ? await makeBody(model, 1.6, ELEMENTS[x.doc.element] ?? 0xc9a35a, 0.35, { ring, ringR: 0.55, ringW: 0.05, ringA: 0.6 })
        : await makeBody(model, 1.62, null, 0, { ring, ringR: 0.36, ringW: 0.05, ringA: 0.6 });
      if (walkers.get(key) !== w) return;
      b.holder.rotation.order = "YXZ"; // yaw, then the nose can dip on its own axis
      w.body = b; w.holder = b.holder; w.ready = true; scene.add(b.holder);
    })().catch(() => {});
  }
}

/* ===================================================================================================
   People: you, and whoever else is in the room right now
   =================================================================================================== */
const meState = { pos: new THREE.Vector3(), yaw: Math.PI, target: null, body: null, keys: new Set(), placed: false, seatWant: null, sitting: false };
/* Your cushion: teal for whoever started the garden, plum for whoever joined. Someone only visiting has none. */
function mySeat() {
  const g = view().g;
  if (!g) return 0;
  if (g.startedBy === me) return 0;
  return isMember(g) ? 1 : -1;
}
function seatOf(uid) { const g = view().g; if (!g || !g.members || !g.members[uid]) return -1; return g.startedBy === uid ? 0 : 1; }
/* Every seat in the room, from one list (hollow.js seatsNow): the hollow's two cushions (ids 0 and 1), the hearth's own cushion
   ("hearth") and any cushion set on a floor spot ("spot:<id>"). A seat id read back from a key ("seat:<id>") is a number for
   the hollow's two. You walk to a seat and sit on it; the hearth moment opens once you are sat by the fire. */
/* The first minute's cushion, where you wake in your homeroom (Still C), is a seat in the same list ("wake"), so the wake sits
   you the same way (Wendell, 2026-10-24, "The character spawns looks very weird"); it is there while the wake is on. */
// seats a mounted piece draws for itself (the coin table's cushion), asked each time like the rest
const seatExtras = [];
const seatsHere = () => !hollow ? [] : seatsNow(hollow.handles.spots).concat(wake.on ? [{ id: "wake", wake: true, x: wake.group.position.x, z: wake.group.position.z, yaw: wake.yaw, floor: 0, top: CUSHION_TOP }] : [], ...seatExtras.map(f => f() || []));
const seatBy = id => id == null ? null : seatsHere().find(s => s.id === id) || null;
const seatId = k => /^\d+$/.test(k) ? +k : k;
const seatPos = id => { const s = seatBy(id); return s ? new THREE.Vector3(s.x, 0, s.z) : meState.pos.clone().setY(0); };
// whose seat: the hollow's two are each one person's; the hearth's and a set-down cushion are anyone's, and in your homeroom all are yours
const canSitOn = id => typeof id !== "number" || inNook() || id === mySeat();
/* The hearth's seat: a cushion you set down in the nook, the one nearest the fire, else the hearth's own cushion. */
function hearthSeatId() {
  const all = seatsHere(), sp = inNook() ? all.filter(s => s.spot) : [];
  sp.sort((a, b) => Math.hypot(a.x - HEARTH.x, a.z - HEARTH.z) - Math.hypot(b.x - HEARTH.x, b.z - HEARTH.z));
  return sp.length ? sp[0].id : "hearth";
}
/* Walk to a seat and sit; `then` runs once you are sat (the hearth moment). */
function sitOn(id, then = null) {
  if (!seatBy(id)) return;
  if (meState.sitting && meState.seatWant === id) { if (then) then(); return; }
  standUp(); if (sheetName) closeSheet();
  meState.seatWant = id; meState.target = seatPos(id); meState.onSeated = then; directCam = null;
  selected = "seat:" + id; refreshHud();
}
function sitAtHearth() { sitOn(hearthSeatId(), () => openSheet("hearth")); }
/* Tea by the fire (between-tea-1 slice 1, the solo cup). The kettle is drawn by the scene at the hearth's seat, not placed
   through the room kit (bt-tea-needs-a-spot), and stands there from the moment the room is up, with its cup on the stone; the cup
   goes into the right hand of whoever is sat there (bt-cup-is-the-figure) and stays held in the lap until they stand.
   "Pour a cup" is offered only to someone sat within NEAR of the kettle (tea-look-2, his note 2026-10-29: "the cup is offering
   when they aren't near the teapot"). No qi, no shelf and no music yet: someone who has worked through nothing can sit and pour. */
let tea = null, teaRoom = null, teaKey = "", teaWas = false, teaSkipped = false, teaK = 0;
function teaNow() {
  const s = seatBy(hearthSeatId()) || seatsHere().find(st => st.hearth); if (!s) return null;
  if (!tea) tea = buildTea({ THREE, scene, seat: s, groundY });
  const key = `${s.id}:${s.x.toFixed(2)}:${s.z.toFixed(2)}:${s.yaw.toFixed(2)}:${s.top}`;
  if ((teaRoom !== hollow || key !== teaKey) && !tea.holding()) { tea.place(s); teaRoom = hollow; teaKey = key; }
  return tea;
}
/* Sat, and the kettle within reach of the seat. */
function teaNear() {
  if (!meState.sitting || !tea) return false;
  const s = seatBy(meState.seatWant); if (!s) return false;
  const k = tea.kettle.position;
  return Math.hypot(s.x - k.x, s.z - k.z) <= TEA_NEAR;
}
function teaBtn() {
  if (!teaNear()) return "";
  if (tea.running()) return "";
  return tea.holding() ? `<button type="button" class="hmlink" data-act="teaSip">Take a sip</button>`
    : `<button type="button" class="hmlink" data-act="teaPour">Pour a cup</button>`;
}
function teaPour(skip = 0) {
  if (!teaNear()) return;
  const m = tea; if (m.running() || m.holding()) return;
  if (!m.attach(meState.body)) return;
  m.pour(performance.now() / 1000, skip);   // skip: seconds in, or "sip" (tea.js knows where each drink's first sip is)
  toast("A cup, by the fire."); hmHud();
}
function teaSip() { if (tea && teaNear() && tea.sip(performance.now() / 1000)) hmHud(); }
function teaFrame(t) {
  if (hollow) teaNow();
  if (TEA_SKIP && !teaSkipped && tea && !tea.holding() && teaNear() && meState.body) {
    teaSkipped = true; teaPour(TEA_SKIP === "sip" ? "sip" : 0);
  }
  if (!tea || !tea.holding()) return;
  if (!meState.sitting || !teaNear()) { tea.stop(); teaWas = false; return; }   // standing up puts the cup back on the stone
  tea.tick(t);
  const r = tea.running(); if (r !== teaWas) { teaWas = r; hmHud(); }
}
function teaStop() { if (tea) tea.stop(); teaWas = false; }
const seatedAtHearth = () => { const s = meState.sitting && seatBy(meState.seatWant); return !!s && (s.hearth || (!!s.spot && inNook() && s.id === hearthSeatId())); };
const othersHere = () => [...peers.values()].filter(p => p.uid !== me);
function ownerSeatNow(uid) {
  if (uid === me) return meState.sitting ? meState.seatWant : null;
  for (const p of peers.values()) if (p.uid === uid && p.sitting) return p.seat;
  return null;
}
function standUp() {
  const wasHearth = sheetName === "hearth" && seatedAtHearth();
  teaStop();
  meState.seatWant = null; meState.onSeated = null; wake.on = false; if (meState.sitting) { meState.sitting = false; sendPresence(); }
  if (wasHearth) closeSheet(); // the hearth moment is had sitting; getting up ends it
  if (hm) hmEnd();
}
const peers = new Map(); // peer -> { uid, body, pos, yaw, cur, walking }
let myBodyHue = null, myBodyLook = null, myBodyBusy = false;
/* Whose look: yours is the Look sheet's draft while it is open, else your homeroom's; the other person's is the one they
   copied into this room (garden.looks, br-look-is-sprouts). */
function lookOf(uid) {
  if (uid === me) return (sheetName === "look" && lookDraft ? lookText(lookDraft) : null) || myHome.look || (list && list.home && list.home.look) || null;
  const g = view().g;
  return g && g.looks && typeof g.looks[uid] === "string" ? g.looks[uid] : null;
}
async function ensureMyBody() {
  const g = view().g;
  const hue = hueOf(me, g), lk = lookOf(me);
  if ((meState.body && myBodyHue === hue && myBodyLook === lk) || myBodyBusy) return;
  myBodyBusy = true;
  try {
    const b = await makeBody("player", 1.7, null, 0, { ring: hue, ...bodyOpts(lk) });
    if (meState.body) { b.holder.position.copy(meState.body.holder.position); b.holder.rotation.copy(meState.body.holder.rotation); scene.remove(meState.body.holder); }
    meState.body = b; myBodyHue = hue; myBodyLook = lk; scene.add(b.holder);
  } finally { myBodyBusy = false; }
  if (myBodyHue !== hueOf(me, view().g) || myBodyLook !== lookOf(me)) ensureMyBody();
}
function placeMe() {
  if (meState.placed) return;
  const g = view().g;
  const spot = g && g.startedBy && g.startedBy !== me ? SPAWN[1] : SPAWN[0];
  meState.pos.copy(spot); meState.yaw = Math.PI; meState.placed = true;
}
async function ensurePeerBody(p) {
  const hue = hueOf(p.uid, view().g), lk = lookOf(p.uid);
  if (p.body && p.hue === hue && p.look === lk) return;
  if (p.loading) return; p.loading = true;
  /* A load that fails (a dropped fetch on a phone) is tried again at the next poll, never left loading (playtest 1,
     2026-10-28: the partner's figure hung on loading); the model caches let go of a failed fetch for the same reason. */
  let b = null;
  try { b = await makeBody("player", 1.7, null, 0, { ring: hue, ...bodyOpts(lk) }); }
  catch (e) { noteError(e, "peer figure"); }
  finally { p.loading = false; }
  if (!b || peers.get(p.peer) !== p) return;
  if (p.body) scene.remove(p.body.holder);
  p.body = b; p.hue = hue; p.look = lk; scene.add(b.holder);
}
let lastPresence = 0, lastSent = "";
/* Where you stand goes out with each poll, with where you are walking to, so the other screen walks your figure there
   at walking pace instead of jumping it every few seconds. A wave is a time stamp the other screen notices once. */
let myWave = null;
function presenceNow() {
  if (!me || !meState.placed) return null;
  const t = meState.target;
  return { x: +meState.pos.x.toFixed(2), z: +meState.pos.z.toFixed(2), h: +meState.yaw.toFixed(2), w: !!(t || meState.keys.size),
    tx: t ? +t.x.toFixed(2) : null, tz: t ? +t.z.toFixed(2) : null, wave: myWave, s: meState.sitting ? meState.seatWant : null };
}
function sendPresence() { if (meState.wasWalking !== undefined) pollSoon(); }
function onPeers(list) {
  const seen = new Set();
  for (const pr of list || []) {
    const uid = pr.uid;
    if (!uid || uid === me || typeof pr.x !== "number" || typeof pr.z !== "number") continue;
    seen.add(uid);
    let e = peers.get(uid);
    const fresh = !e;
    if (!e) { e = { peer: uid, uid, pos: new THREE.Vector3(pr.x, 0, pr.z), yaw: pr.h || 0 }; peers.set(uid, e); }
    const clamp = v => Math.max(-WALK_R, Math.min(WALK_R, v));
    const goal = pr.w && typeof pr.tx === "number" ? [pr.tx, pr.tz] : [pr.x, pr.z];
    e.tx = clamp(goal[0]); e.tz = clamp(goal[1]); e.th = +pr.h || 0;
    e.seat = pr.s != null && seatBy(pr.s) ? pr.s : null;
    if (e.seat != null) { const st = seatBy(e.seat); e.tx = st.x; e.tz = st.z; }
    if (Math.hypot(pr.x - e.pos.x, pr.z - e.pos.z) > 4) e.pos.set(pr.x, 0, pr.z); // too far behind to walk: catch up
    if (pr.wave && pr.wave !== e.wave) { if (!fresh && now() - pr.wave < 15000) { burst(new THREE.Vector3(pr.x, groundY(pr.x, pr.z), pr.z), 0xffe2b0); waves.push({ peer: uid, t0: performance.now() / 1000 }); if (e.body) e.body.wave(performance.now() / 1000); } e.wave = pr.wave; }
    ensurePeerBody(e);
  }
  for (const [k, e] of peers) if (!seen.has(k)) { if (e.body) scene.remove(e.body.holder); peers.delete(k); const l = labels.get("p:" + k); if (l) { l.remove(); labels.delete("p:" + k); } }
  refreshHud();
}
const waves = [];

/* ===================================================================================================
   Input: tap the floor to walk there, tap a thing to walk to it, drag to look around, pinch or wheel to zoom.
   Keys: WASD or arrows.
   =================================================================================================== */
const lastFocus = new THREE.Vector3(0, 1, 0);
let camYaw = 0, camPitch = 0.5, camDist = innerWidth < innerHeight ? 4.4 : 5.2, camTogether = false, togetherK = 0;
const pointers = new Map(); let dragMoved = 0, pinch0 = null;
const ray = new THREE.Raycaster(); const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
/* Carrying: a drag that starts on something of yours you have tapped moves it instead of the view (ba-round4-comfort). */
let carry = null;
function floorAt(cx, cy) {
  ray.setFromCamera(new THREE.Vector2(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1), camera);
  const hit = new THREE.Vector3(), daisPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -DAIS_Y);
  return (ray.ray.intersectPlane(daisPlane, hit) && Math.hypot(hit.x, hit.z) < 2.4) || ray.ray.intersectPlane(floorPlane, hit) ? hit : null;
}
function carryStart(cx, cy) {
  if (!selected || !selected.startsWith("item:") || placing) return null;
  const id = selected.slice(5), t = things.get(id); if (!t || moveRight(t.item) !== "own") return null;
  ray.setFromCamera(new THREE.Vector2(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1), camera);
  return ray.ray.distanceToPoint(t.pos.clone().setY(0.4)) < 0.6 ? { id, t, from: t.group.position.clone(), ok: true } : null;
}
renderer.domElement.addEventListener("pointerdown", e => { pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY }); dragMoved = 0; if (hm && hm.held && pointers.size === 1) { const [m, d] = hmHit(e.clientX, e.clientY); if (m === hm.held && d < 44) hmPress(true); } if (pointers.size === 1) carry = carryStart(e.clientX, e.clientY); else if (carry) { carry.t.group.position.copy(carry.from); carry = null; } if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: camDist }; } renderer.domElement.setPointerCapture(e.pointerId); });
renderer.domElement.addEventListener("pointermove", e => {
  const p = pointers.get(e.pointerId); if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (pointers.size === 2 && pinch0 && !mirrorOn) { const [a, b] = [...pointers.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); camDist = Math.max(2, Math.min(7.5, pinch0.dist * pinch0.d / Math.max(d, 1))); dragMoved += 99; return; }
  dragMoved += Math.abs(dx) + Math.abs(dy);
  if (mirrorOn) { if (pointers.size === 1) mirrorTurn -= dx * 0.012; return; } // the screen is flipped: drag right turns your front to the right
  if (hm && pointers.size === 1) { if (dragMoved > 6 && !hm.press) hm.turnV = Math.max(-1.6, Math.min(1.6, hm.turnV - dx * 0.02)); return; } // by the fire, a sideways drag turns the crescent
  if (carry) {
    const h = floorAt(e.clientX, e.clientY);
    if (h) { carry.ok = walkable(h.x, h.z, 0.3); carry.t.group.position.set(h.x, groundY(h.x, h.z), h.z); carry.at = h; }
    return;
  }
  if (dragMoved > 6) { camYaw -= dx * 0.006; camPitch = Math.max(0.05, Math.min(1.1, camPitch + dy * 0.004)); if (directCam && directCam.key !== "gust") directCam = null; }
});
function endPointer(e) {
  const p = pointers.get(e.pointerId); pointers.delete(e.pointerId); if (pointers.size < 2) pinch0 = null;
  const c = carry; carry = null;
  if (hm && p && dragMoved > 40 && p.y0 - p.y > 70 && p.y0 - p.y > Math.abs(p.x - p.x0) * 1.5) { hmStand(); return; } // a swipe up stands you
  if (c && dragMoved > 6 && c.at) {
    if (c.ok) { c.t.pos.set(c.at.x, 0, c.at.z); moveItem(c.id, { x: +c.at.x.toFixed(2), z: +c.at.z.toFixed(2) }); }
    else { c.t.group.position.copy(c.from); toast("Somewhere on open ground."); }
    return;
  }
  if (!p || dragMoved > 6 || pointers.size) return;
  tapAt(e.clientX, e.clientY);
}
renderer.domElement.addEventListener("pointerup", endPointer);
renderer.domElement.addEventListener("pointercancel", e => { pointers.delete(e.pointerId); pinch0 = null; if (carry) { carry.t.group.position.copy(carry.from); carry = null; } });
renderer.domElement.addEventListener("wheel", e => { e.preventDefault(); if (mirrorOn) { mirrorTurn -= Math.sign(e.deltaY) * 0.2; return; } camDist = Math.max(2, Math.min(7.5, camDist * (1 + Math.sign(e.deltaY) * 0.08))); }, { passive: false });
// by the fire, left and right turn the crescent; elsewhere the arrows and WASD walk
addEventListener("keydown", e => { if (sheetName || /input|textarea|select/i.test((e.target.tagName || ""))) return; const k = e.key.toLowerCase(); if (hm && (k === "arrowleft" || k === "arrowright")) { hm.turnV += k === "arrowleft" ? 0.9 : -0.9; e.preventDefault(); return; } if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) { meState.keys.add(k); meState.target = null; standUp(); e.preventDefault(); } });
addEventListener("keyup", e => meState.keys.delete(e.key.toLowerCase()));
addEventListener("blur", () => meState.keys.clear());

/* Setting something of yours somewhere: after "Move it", the next tap on open floor is where it stands (or a drag takes it there). */
let placing = null;
function placeAt() {
  const hit = new THREE.Vector3();
  const daisPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -DAIS_Y);
  const on = (ray.ray.intersectPlane(daisPlane, hit) && Math.hypot(hit.x, hit.z) < 2.4) || ray.ray.intersectPlane(floorPlane, hit);
  if (!on || !walkable(hit.x, hit.z, 0.3)) { toast("Somewhere on open ground."); return; }
  moveItem(placing.id, { x: +hit.x.toFixed(2), z: +hit.z.toFixed(2) });
}
function tapAt(cx, cy) {
  if (mirrorOn) return; // in the mirror a tap only chooses; the floor is behind you
  if (hmTap(cx, cy)) return; // sat by the fire, a touch is for the embers, the lantern and the hooks; the floor stands you up
  const ndc = new THREE.Vector2(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  // the cards at the grey edge take the tap first, and bring the encounter back after "Walk on" (letters.js)
  if (!placing && !satchelOpen && window.__between && window.__between.letters && window.__between.letters.tap(ray.ray)) return;
  // things first: the nearest one whose sphere the ray passes through, a seat ahead of anything over it (pick.js)
  const hits = []; let best = null;
  const consider = (key, pos, r) => { const d = ray.ray.distanceToPoint(pos); if (d < r) { hits.push({ key, pos, along: ray.ray.origin.distanceTo(pos) }); best = pickTap(hits); } };
  if (placing) { placeAt(); return; }
  // the room kit: with the satchel open, a glowing spot that fits takes the armed item, and a placed item goes back
  if (hollow) for (const h of Object.values(hollow.handles.spots)) {
    // holding an item, only the free spots that fit it answer; holding nothing, the placed items do
    if (satchelOpen && armed ? h.item || ITEMS[armed].takes !== h.takes : !h.item) continue;
    if (h.item === "mirror" && inNook() && !satchelOpen) continue; // the mirror answers as the mirror
    if (h.item === "cushion" && h.takes === "floor" && !satchelOpen) continue; // a set-down cushion answers as a seat
    consider("spot:" + h.id, h.pos.clone().setY(h.pos.y + (h.takes === "hang" ? -0.42 : h.flat ? 0.25 : 0.15)), h.flat ? 0.6 : 0.42);
  }
  if (best && satchelOpen) { spotTap(best.key.slice(5)); return; }
  // your shelf: the blank scroll, a scroll that arrived sealed, a keepsake
  if (shelf.group && !satchelOpen) for (const tp of shelf.taps) consider("shelf:" + tp.key + ":" + (tp.i ?? 0), shelfTapPos(tp), 0.3);
  if (best && best.key.startsWith("shelf:")) { const [, k, i] = best.key.split(":"); shelfTap(k, +i); return; }
  if (!inNook() || mirrorSpot) consider("between", BETWEEN_AT.clone().setY(DAIS_Y + 0.5), 0.7);
  if (inNook()) consider("window", hollow.layout.window, 1.0);
  if (portal.visible) consider("portal", PORTAL_AT.clone().setY(DAIS_Y + 0.95), 0.75);
  consider("hearth", HEARTH_AT.clone().setY(0.9), 1.0);
  for (const st of seatsHere()) consider("seat:" + st.id, new THREE.Vector3(st.x, st.top - 0.1, st.z), 0.45);
  for (const [id, t] of things) consider("item:" + id, t.pos.clone().setY(0.4), 0.5);
  for (const [k, w] of walkers) if (w.holder) consider("w:" + k, w.holder.position.clone().setY(w.type === "spirit" ? 0.4 : 0.9), 0.6);
  for (const [k, p] of peers) consider("p:" + k, p.pos.clone().setY(groundY(p.pos.x, p.pos.z) + 0.9), 0.5);
  if (best && best.key.startsWith("seat:")) {
    selected = best.key;
    const i = seatId(best.key.slice(5));
    if (canSitOn(i)) { sitOn(i, seatBy(i) && seatBy(i).hearth ? () => { if (hearthOpen() || storeDown) openSheet("hearth"); } : null); } // walk to the cushion and sit
    else { standUp(); const dir = meState.pos.clone().sub(best.pos).setY(0); if (dir.length() > 1.3) meState.target = pushOut(best.pos.clone().setY(0).add(dir.normalize().multiplyScalar(1.1))); }
    refreshHud(); return;
  }
  if (best && inNook() && minuteTap(best.key)) return;
  if (best) {
    standUp();
    selected = best.key;
    // the hearth: walk up to it; its card's "Sit at the hearth" takes you to its cushion (no sheet over the room)
    if (best.key === "between" && isHome(view().g)) openSheet(mstate().mirrorGlows ? "hope" : "look");
    if (best.key === "window") { if (isHome(view().g)) openSheet("style"); else toast("The light through the window changes from Style."); }
    if (best.key === "portal") { openSheet("destinations"); return; }
    const dir = meState.pos.clone().sub(best.pos).setY(0); const d = dir.length();
    if (d > 1.3) { dir.normalize(); meState.target = pushOut(best.pos.clone().add(dir.multiplyScalar(1.1))); }
    refreshHud(); return;
  }
  const hit = new THREE.Vector3();
  // the floor: the dais is raised, so try its top first, then the flagstones
  const daisPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -DAIS_Y);
  directCam = null;
  if (ray.ray.intersectPlane(daisPlane, hit) && Math.hypot(hit.x, hit.z) < 2.6) { meState.target = pushOut(hit.setY(0)); standUp(); selected = null; refreshHud(); return; }
  if (ray.ray.intersectPlane(floorPlane, hit)) { meState.target = pushOut(hit); standUp(); selected = null; refreshHud(); }
}

/* ===================================================================================================
   Frame loop
   =================================================================================================== */
const clock = new THREE.Clock();
/* ?cam=x,y,z,lx,ly,lz pins the camera, for screenshots set beside the concept views */
let debugCam = (() => { const v = new URLSearchParams(location.search).get("cam"); const a = v ? v.split(",").map(Number) : null; return a && a.length === 6 && a.every(Number.isFinite) ? a : null; })();
let nearKey = null;
/* The figure's light, each frame: the room capture when it is due (room entry, a style change, the mirror), the travelling key
   and the mirror's lights blended by how far into the mirror the camera is, and the figures' strengths (room-styles.js). */
const playerBodies = () => [meState.body, ...[...peers.values()].map(p => p.body)].filter(b => b && b.dressed);
function figureLightTick(t, dt, me3) {
  const F = FL_TRY ? { ...figLight, ...FL_TRY } : figLight, bodies = playerBodies();
  if (probeDirty && meState.body && hollow) {
    probeDirty = false;
    const at = (mirrorOn ? MIRROR_STAND : meState.pos).clone(); at.y = groundY(at.x, at.z) + 1.1;
    const lit = [waveLight, ...mirrorLights].map(l => [l, l.intensity]), shown = bodies.map(b => [b.holder, b.holder.visible]);
    for (const [l] of lit) l.intensity = 0; for (const [h] of shown) h.visible = false;
    scene.updateMatrixWorld(true);
    const old = figEnv; ({ env: figEnv, dc: figDc } = figureProbe(renderer, scene, at));
    for (const [l, i] of lit) l.intensity = i; for (const [h, v] of shown) h.visible = v;
    if (old) old.dispose();
  }
  if (figEnv) { const k = (F.kWalk + (F.kMirror - F.kWalk) * me3) / figDc; for (const b of bodies) lightFigure(b.holder, figEnv.texture, k); }
  figureWrap.value = F.wrap;
  paint.uEdge.value = F.edge + (F.edgeMirror - F.edge) * me3;
  // walking: the key from over your shoulder, on the camera's side
  const on = sheetName === "checkin" && walk && walk.feel && walk.step >= 0;
  keyCheck += ((on ? 1 : 0) - keyCheck) * (1 - Math.exp(-2.5 * dt));
  if (on) keyEl.setHex(elHex(walk.feel));
  waveLight.color.copy(KEY_COLOR).lerp(keyEl, 0.65 * keyCheck);
  const gy = groundY(meState.pos.x, meState.pos.z), toCam = camera.position.clone().sub(meState.pos).setY(0);
  if (toCam.lengthSq() < 1e-4) toCam.set(0, 0, 1); toCam.normalize();
  waveLight.position.set(meState.pos.x + toCam.x * 2.6 + toCam.z * 0.9, gy + 2.6, meState.pos.z + toCam.z * 2.6 - toCam.x * 0.9);
  waveLight.target.position.set(meState.pos.x, (meState.sitting ? DAIS_Y + 0.5 : gy + 1.0), meState.pos.z);
  waveLight.distance = F.keyDist; waveLight.angle = F.keyAngle;
  waveLight.intensity = meState.body ? F.key * (1 - me3) * (1 + keyCheck * (0.15 + 0.25 * Math.sin(t * 1.25) + (on && walk.step === 7 ? 0.4 : 0))) : 0;
  // the mirror: its sconces and the window behind you, placed from where the mirror stands now
  const sy = groundY(MIRROR_STAND.x, MIRROR_STAND.z);
  for (const l of mirrorLights) {
    const a = l.userData.at; l.position.set(BETWEEN_AT.x + a.x, sy + a.y, BETWEEN_AT.z + a.z);
    l.target.position.set(MIRROR_STAND.x, sy + a.ty, MIRROR_STAND.z); l.distance = F.dist; l.intensity = F[a.k] * me3;
    l.visible = me3 > 0.5;   // a light that is off is not drawn at all (the mirror cuts in and out, so this never blends)
  }
  waveLight.visible = me3 <= 0.5;
}
/* The next frame is asked for first, so one bad frame never stops the room: on 2026-10-24 Wendell stepped toward the
   dais and the whole scene froze, because a throw in the near-card (refreshHud, called below) ended the loop before it
   asked for the next frame. A throw now lands in errLog, shows once, and the room keeps going. */
function frame() {
  requestAnimationFrame(frame);
  try { frameBody(); } catch (e) { noteError(e, "frame"); }
}
function frameBody() {
  const dt = Math.min(0.05, clock.getDelta());
  const t = performance.now() / 1000;
  const tShared = now() / 1000;
  // you
  if (meState.body && mirrorOn) {
    // in front of the mirror: step to the spot, then face the glass, turned as far as you have dragged
    const to = MIRROR_STAND.clone().sub(meState.pos).setY(0), d = to.length(), walking = d > 0.04;
    if (walking) { const step = Math.min(d, 2.3 * dt); meState.pos.addScaledVector(to.normalize(), step); }
    const want = walking && d > 0.3 ? Math.atan2(to.x, to.z) : Math.PI + mirrorTurn;
    let dy = want - meState.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); meState.yaw += dy * Math.min(1, dt * 8);
    meState.body.setWalking(walking);
    meState.body.holder.position.copy(meState.pos); meState.body.holder.position.y = groundY(meState.pos.x, meState.pos.z);
    meState.body.holder.rotation.y = meState.yaw + FACE;
    meState.body.mixer.update(dt); meState.body.pose(t, dt, false, false);
    meState.wasWalking = walking;
  } else if (meState.body) {
    let move = new THREE.Vector3();
    if (meState.keys.size) {
      const f = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw)), r = new THREE.Vector3(Math.cos(camYaw), 0, -Math.sin(camYaw));
      if (meState.keys.has("w") || meState.keys.has("arrowup")) move.add(f);
      if (meState.keys.has("s") || meState.keys.has("arrowdown")) move.sub(f);
      if (meState.keys.has("d") || meState.keys.has("arrowright")) move.add(r);
      if (meState.keys.has("a") || meState.keys.has("arrowleft")) move.sub(r);
    } else if (meState.target) {
      move = meState.target.clone().sub(meState.pos).setY(0);
      if (move.length() < 0.08) { meState.target = null; move.set(0, 0, 0); }
    }
    if (meState.sitting && meState.keys.size) standUp(); // moving gets you up
    const walking = move.lengthSq() > 1e-6;
    // reached the seat: sit, facing the way it faces (the Between, or the fire); a seat that went (a cushion lifted) gets you up
    const seatNow = seatBy(meState.seatWant);
    if (meState.seatWant != null && !seatNow) standUp();
    else if (meState.seatWant != null && !walking && !meState.sitting && meState.pos.distanceTo(seatPos(meState.seatWant)) < 0.15) {
      meState.sitting = true; meState.sitT = t; sendPresence(); refreshHud();
    }
    if (meState.sitting && seatNow) { meState.pos.set(seatNow.x, 0, seatNow.z); let d = seatNow.yaw - meState.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); meState.yaw += d * Math.min(1, dt * 6); }
    // once turned and settled on the seat (the sit eases in over about a second), what was waiting for it opens: the hearth moment
    if (meState.sitting && meState.onSeated && t - meState.sitT > 1.1) { const f = meState.onSeated; meState.onSeated = null; f(); }
    if (walking) {
      const step = Math.min(move.length(), 2.3 * dt);
      move.normalize();
      meState.pos.add(move.clone().multiplyScalar(step)); if (meState.seatWant == null || meState.pos.distanceTo(seatPos(meState.seatWant)) > 0.9) pushOut(meState.pos);
      const want = Math.atan2(move.x, move.z);
      let d = want - meState.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); meState.yaw += d * Math.min(1, dt * 10);
    }
    meState.body.setWalking(walking);
    meState.body.holder.position.copy(meState.pos);
    // sat: the holder stands on the seat's floor and the pose rests the hips on its top (seatAt); the first minute's cushion too
    const myFloor = meState.sitting && seatNow ? seatNow.floor : groundY(meState.pos.x, meState.pos.z);
    const mySeatAt = meState.sitting && seatNow ? seatNow.top - seatNow.floor : null;
    meState.body.holder.position.y = myFloor;
    meState.body.holder.rotation.y = meState.yaw + FACE;
    meState.body.mixer.update(dt);
    meState.body.pose(t, dt, meState.sitting, false, mySeatAt);
    teaFrame(t);
    if (walking !== meState.wasWalking || (walking && meState.target !== meState.sentTarget)) { meState.sentTarget = meState.target; sendPresence(); }
    meState.wasWalking = walking;
  }
  // others
  for (const [k, p] of peers) {
    if (!p.body) continue;
    const gx = p.tx - p.pos.x, gz = p.tz - p.pos.z, gd = Math.hypot(gx, gz);
    p.walking = gd > 0.08;
    if (p.walking) { const step = Math.min(gd, 2.3 * dt); p.pos.x += gx / gd * step; p.pos.z += gz / gd * step; }
    const pst = seatBy(p.seat);
    const want = p.walking ? Math.atan2(gx, gz) : pst ? pst.yaw : p.th;
    let d = want - p.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); p.yaw += d * Math.min(1, dt * 8);
    p.sitting = !!pst && !p.walking;
    if (p.sitting) { const want2 = pst.yaw; let d2 = want2 - p.yaw; d2 = Math.atan2(Math.sin(d2), Math.cos(d2)); p.yaw += d2 * Math.min(1, dt * 6); }
    p.body.setWalking(p.walking);
    p.body.holder.position.copy(p.pos);
    p.body.holder.position.y = p.sitting ? pst.floor : groundY(p.pos.x, p.pos.z);
    p.body.holder.rotation.y = p.yaw + FACE;
    p.body.mixer.update(dt);
    p.body.pose(t, dt, p.sitting, false, p.sitting ? pst.top - pst.floor : null);
  }
  // walkers
  const ws = [...walkers.values()].filter(w => w.ready);
  for (const w of ws) {
    let { p, moving, dir, sniff } = walkerPos(w, tShared);
    w.sniff = sniff || null;
    // a spirit whose owner sits down comes and curls up beside their cushion
    const os = w.type === "spirit" ? ownerSeatNow(w.doc.owner) : null;
    const osp = os != null ? seatBy(os) : null;
    if (osp) { p = new THREE.Vector2(osp.x + (Math.sign(osp.x) || 1) * 0.8, osp.z + 0.35); moving = false; }
    if (!w.cur) w.cur = p.clone();
    const gap = p.clone().sub(w.cur), gl = gap.length();
    if (gl > 0.02) { const step = Math.min(gl, 1.8 * dt); w.cur.add(gap.multiplyScalar(step / gl)); if (gl > 0.08) { moving = true; w.dirOverride = gap.clone(); } else w.dirOverride = null; } else w.dirOverride = null;
    w.rest = !!osp && gl < 0.1;
    w.holder.position.set(w.cur.x, groundY(w.cur.x, w.cur.y), w.cur.y);
    w.moving = moving;
  }
  for (const w of ws) {
    let yawTo = null;
    if (w.moving) { w.person = null; const dd = w.dirOverride || walkerPos(w, tShared).dir; if (dd.lengthSq() > 1e-4) yawTo = Math.atan2(dd.x, dd.y); w.meeting = null; }
    else {
      // standing: a spirit turns to whoever has come near; then to the thing it is sniffing; else the nearest walker, or the Between
      let nb = null, nd = 2.6, person = null;
      if (w.type === "spirit") {
        let pd = 2.2;
        const near = [...(meState.body ? [meState.pos] : []), ...othersHere().map(o => o.pos)];
        for (const q of near) { const d = Math.hypot(q.x - w.holder.position.x, q.z - w.holder.position.z); if (d < pd) { pd = d; person = q; } }
      }
      for (const o of ws) { if (o === w) continue; const d = o.holder.position.distanceTo(w.holder.position); if (d < nd) { nd = d; nb = o; } }
      w.person = person;
      const tgt = person || w.sniff || (nb ? nb.holder.position : (w.holder.position.distanceTo(BETWEEN_AT) < 3.4 ? BETWEEN_AT : null));
      if (tgt) yawTo = Math.atan2(tgt.x - w.holder.position.x, tgt.z - w.holder.position.z);
      w.meeting = nb;
    }
    if (yawTo != null) { let d = yawTo - w.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); w.yaw += d * Math.min(1, dt * 5); }
    w.holder.rotation.y = w.yaw + FACE;
    // a sniff: the nose dips toward the thing, twice a second, while it stands there and nobody has come near
    const sn = w.type === "spirit" && !w.moving && w.sniff && !w.rest && !w.person ? Math.max(0, Math.sin(t * 6.5)) * 0.16 : 0;
    w.holder.rotation.x += (sn - w.holder.rotation.x) * Math.min(1, dt * 10);
    w.body.setWalking(w.moving);
    w.body.mixer.update(dt);
    w.body.pose(t, dt, false, w.rest);
  }
  // the Between and the garden
  stepBetween(t, dt); portalTick(t); minuteTick(t, dt); gustTick(t); hmTick(t, dt); fsBurn(dt);
  for (const th of things.values()) { if (th.group.userData.sway) th.group.rotation.z = Math.sin(t * 0.7 + th.pos.x) * 0.03; } // a hung lantern sways a little
  for (const th of things.values()) th.group.children.forEach(c => { if (c.userData.bob) c.position.y = 0.62 + Math.sin(t * 2 + th.pos.x) * 0.06; if (c.userData.pulse) { if (c.userData.s0 == null) c.userData.s0 = c.scale.x; c.scale.setScalar(c.userData.s0 * (1 + Math.sin(t * 4) * 0.15)); } });
  for (let i = fly.length - 1; i >= 0; i--) {
    const f = fly[i], u = Math.min(1, (t - f.t0) / 1.6);
    const to = BETWEEN_AT.clone().setY(DAIS_Y + 0.55);
    f.m.position.lerpVectors(f.from, to, u * u * (3 - 2 * u)); f.m.position.y += Math.sin(u * Math.PI) * 1.4;
    if (u >= 1) { scene.remove(f.m); fly.splice(i, 1); burst(BETWEEN_AT.clone().setY(DAIS_Y), 0xffe2b0); creature.bounce(t); }
  }
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i], u = (t - b.t0) / 1.2;
    b.m.scale.setScalar(1 + u * 3); b.m.material.opacity = Math.max(0, 0.9 * (1 - u));
    if (u >= 1) { scene.remove(b.m); bursts.splice(i, 1); }
  }
  // camera: follows you, kept inside the hollow; when you both sit, it eases down to the low view behind the cushions
  const tog = bothSitting();
  if (tog !== camTogether) {
    camTogether = tog;
    if (tog) { camYaw = 0; camPitch = innerWidth < innerHeight ? 0.22 : 0.16; camDist = innerWidth < innerHeight ? 4.9 : 3.5; } else { camPitch = 0.5; camDist = innerWidth < innerHeight ? 4.4 : 5.2; }
  }
  togetherK += ((tog ? 1 : 0) - togetherK) * Math.min(1, dt * 1.6);
  // frame you and the Between together when you are near it, so both fill a phone screen
  const meFocus = meState.pos.clone().setY((meState.sitting ? (seatBy(meState.seatWant) || { top: DAIS_Y + 0.25 }).top + 0.5 : groundY(meState.pos.x, meState.pos.z) + 1.0));
  const toB = Math.hypot(meState.pos.x - BETWEEN_AT.x, meState.pos.z - BETWEEN_AT.z);
  if (toB < 5) meFocus.lerp(BETWEEN_AT.clone().setY(DAIS_Y + 0.6), 0.4 * (1 - toB / 5) + 0.1);
  const focus = meFocus.lerp(new THREE.Vector3(0, DAIS_Y + 0.6, -0.4), togetherK);
  const cp = new THREE.Vector3(Math.sin(camYaw) * Math.cos(camPitch), Math.sin(camPitch), Math.cos(camYaw) * Math.cos(camPitch)).multiplyScalar(camDist).add(focus);
  clampCamera(cp, focus);
  // the satchel open in the nook: the camera eases back to see the whole room, as Still A does, so every spot is in view
  roomViewK += ((satchelOpen && inNook() && !mirrorOn ? 1 : 0) - roomViewK) * Math.min(1, dt * 3);
  if (roomViewK > 0.001) {
    const k = roomViewK * roomViewK * (3 - 2 * roomViewK), tall = innerWidth < innerHeight;
    cp.lerp(tall ? ROOM_VIEW.phone[0] : ROOM_VIEW.wide[0], k); focus.lerp(tall ? ROOM_VIEW.phone[1] : ROOM_VIEW.wide[1], k);
  }
  // the mirror: the camera eases to where the glass stands, level with your chest, and the view drops so you stand in the
  // upper part of the screen, clear of the strip of choices below
  mirrorK += ((mirrorOn ? 1 : 0) - mirrorK) * Math.min(1, dt * 3);
  if (mirrorCut) mirrorK = mirrorOn ? 1 : 0;
  if (mirrorK < 0.002 && !mirrorOn) mirrorK = 0;
  const me3 = mirrorK * mirrorK * (3 - 2 * mirrorK);
  if (me3 > 0) {
    const fy = groundY(meState.pos.x, meState.pos.z) + 0.95;
    cp.lerp(new THREE.Vector3(meState.pos.x, fy, MIRROR_CAM_Z), me3);
    focus.lerp(new THREE.Vector3(meState.pos.x, fy, meState.pos.z), me3);
  }
  // the minute's beats and a scroll's flight turn the view to what they are about (directView)
  directK += ((directCam && inNook() && !mirrorOn && roomViewK < 0.5 ? 1 : 0) - directK) * Math.min(1, dt * 1.8);
  if (directK > 0.001) {
    const [dp, df] = directView(directCam ? directCam.key : "room", innerWidth < innerHeight), k = directK * directK * (3 - 2 * directK);
    if (directCam) directCam.last = [dp, df];
    cp.lerp(dp, k); focus.lerp(df, k);
  }
  if (directCam && directCam.key === "gust" && performance.now() - directCam.t0 > 4200) directCam = null;
  /* Sat on the hearth's cushion or one you set down (Wendell, 2026-10-24): the camera eases down low, behind you and a little to
     the side, looking past you at what the seat faces (the fire), so the sitting is seen before anything opens over it. */
  const sst = meState.sitting && !mirrorOn ? seatBy(meState.seatWant) : null;
  const lowView = !!sst && typeof sst.id !== "number" && !sst.wake; // the first minute's wake keeps the minute's own views
  if (lowView) seatViewAt = sst;
  seatK += ((lowView ? 1 : 0) - seatK) * Math.min(1, dt * 1.4);
  if (seatK < 0.002 && !lowView) seatK = 0;
  if (seatK > 0 && seatViewAt) {
    const S = seatViewAt, fx = Math.sin(S.yaw), fz = Math.cos(S.yaw), tall = innerWidth < innerHeight, back = tall ? 2.0 : 1.6, side = tall ? 0.45 : 0.6;
    const sp = new THREE.Vector3(S.x - fx * back - fz * side, S.top + (tall ? 0.95 : 0.8), S.z - fz * back + fx * side);
    const sf = new THREE.Vector3(S.x + fx * 1.0, S.top + 0.4, S.z + fz * 1.0);
    clampCamera(sp, sf);
    const k = seatK * seatK * (3 - 2 * seatK); cp.lerp(sp, k); focus.lerp(sf, k);
  }
  /* The seated hearth moment: closer still, just beside your shoulder and low, the fire filling the upper half of the view; when
     the room answers a lantern, the view lifts to take in its hooks. */
  hmK += ((hm ? 1 : 0) - hmK) * Math.min(1, dt * 1.1);
  if (hmK < 0.002 && !hm) hmK = 0;
  if (hmK > 0 && seatViewAt) {
    const F = hmFrame(seatViewAt), tall = innerWidth < innerHeight, up = hm && hm.L && (hm.step === "hang" || (hm.step === "send" && hm.L.hang) || (hm.step === "settled" && hm.L.hang));
    hmUp += ((up ? 1 : 0) - hmUp) * Math.min(1, dt * 1.2);
    const p = hmAt(F, tall ? -1.15 : -0.95, tall ? 0.62 : 0.7, tall ? 0.95 : 0.85), f = hmAt(F, 1.5, -0.18, tall ? 0.36 : 0.42);
    if (fsK > 0.001) { const k3 = fsK * fsK * (3 - 2 * fsK); p.lerp(hmAt(F, tall ? -0.85 : -0.75, tall ? 0.42 : 0.48, tall ? 0.62 : 0.55), k3); f.lerp(hmAt(F, 1.6, -0.08, 0.28), k3); } // the sit: lower, behind the shoulder
    if (hmUp > 0.001 && hm) { const hk = (hm.L.hang || hm.hooks[0]).pos, k2 = hmUp * hmUp * (3 - 2 * hmUp); p.lerp(hmAt(F, -1.9, 0.95, 1.05), k2); f.lerp(hk.clone().setY(hk.y - 1.0).lerp(hm.L.g.position, 0.3), k2); }
    clampCamera(p, f);
    const k = hmK * hmK * (3 - 2 * hmK); cp.lerp(p, k); focus.lerp(f, k);
  }
  /* Tea in your hand (tea-cup-look-3, his note 2026-10-29: when you sit to drink, the camera should move so you see yourself
     drinking): the view comes round in front of you, a little to your left and level with your face, so the cup coming up to
     your mouth, your hand on it and the kettle on its stone are all in sight. It eases back behind you when you stand. */
  const teaOn = !!(tea && tea.holding() && meState.sitting && seatViewAt && !mirrorOn);
  teaK += ((teaOn ? 1 : 0) - teaK) * Math.min(1, dt * 1.1);
  if (teaK < 0.002 && !teaOn) teaK = 0;
  if (teaK > 0 && seatViewAt) {
    const S = seatViewAt, fx = Math.sin(S.yaw), fz = Math.cos(S.yaw), lx = fz, lz = -fx, tall = innerWidth < innerHeight;
    const at = (x, y, z) => new THREE.Vector3(S.x + lx * x + fx * z, S.top + y, S.z + lz * x + fz * z);   // the seat's frame: x left, z ahead
    const V = tall ? TEA_VIEW.phone : TEA_VIEW.wide, p = at(...V[0]), f = at(...V[1]);
    clampCamera(p, f);
    const k = teaK * teaK * (3 - 2 * teaK); cp.lerp(p, k); focus.lerp(f, k);
  }
  const rk = roomViewK * roomViewK * (3 - 2 * roomViewK);
  const fovR = (innerWidth < innerHeight ? 66 : 50) + (innerWidth < innerHeight ? ROOM_VIEW.fovPhone - 66 : 0) * rk;
  const fov0 = fovR, fov = fov0 + ((innerWidth < innerHeight ? 68 : 56) - fov0) * me3;
  mirror.visible = mirrorShown() && me3 < 0.35; // the glass is where the camera looks from
  spotRings(t);
  if (me3 > 0 || rk > 0.001 || camera.fov !== fov || (camera.view && camera.view.enabled)) {
    camera.fov = fov;
    if (me3 > 0) camera.setViewOffset(innerWidth, innerHeight, 0, innerHeight * 0.19 * me3, innerWidth, innerHeight); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  if (mirrorCut) { camera.position.copy(cp); mirrorCut = false; } else camera.position.lerp(cp, Math.min(1, dt * 4));
  camera.lookAt(focus); lastFocus.copy(focus);
  if (debugCam) { camera.position.set(debugCam[0], debugCam[1], debugCam[2]); camera.lookAt(debugCam[3], debugCam[4], debugCam[5]); }
  figureLightTick(t, dt, me3);
  renderer.render(scene, camera);
  drawLabels(t);
  // what is near you
  const nk = nearest();
  if (nk !== nearKey) { nearKey = nk; refreshHud(); }
  if (shotWanted) takeShot();
}
function nearest() {
  if (selected) {
    const pos = posOf(selected);
    if (pos && pos.distanceTo(meState.pos) < 2.6) return selected;
  }
  let best = null, bd = 2.0;
  const c = (key, pos) => { const d = Math.hypot(pos.x - meState.pos.x, pos.z - meState.pos.z); if (d < bd) { bd = d; best = key; } };
  if (!inNook() || mirrorSpot) c("between", BETWEEN_AT);
  if (portal.visible) c("portal", PORTAL_AT);
  c("hearth", HEARTH_AT);
  for (const st of seatsHere()) if (!st.hearth && !(meState.sitting && meState.seatWant === st.id)) c("seat:" + st.id, seatPos(st.id)); // the hearth's own cushion answers as the hearth
  if (meState.sitting) return "seat:" + meState.seatWant;
  for (const [id, t] of things) c("item:" + id, t.pos);
  for (const [k, w] of walkers) if (w.holder) c("w:" + k, w.holder.position);
  if (!best) { bd = 1.4; for (const [k, p] of peers) c("p:" + k, p.pos); }
  return best;
}
function posOf(key) {
  if (key === "between") return BETWEEN_AT;
  if (key === "portal") return PORTAL_AT;
  if (key === "hearth") return HEARTH_AT;
  if (key.startsWith("seat:")) return seatPos(seatId(key.slice(5)));
  if (key === "window") return hollow && hollow.layout.window.clone().setY(0);
  if (key.startsWith("spot:")) { const h = hollow && hollow.handles.spots[key.slice(5)]; return h && h.pos.clone().setY(0); }
  if (key.startsWith("item:")) { const t = things.get(key.slice(5)); return t && t.pos; }
  if (key.startsWith("w:")) { const w = walkers.get(key.slice(2)); return w && w.holder && w.holder.position; }
  if (key.startsWith("p:")) { const p = peers.get(key.slice(2)); return p && p.pos; }
  return null;
}
function drawLabels(t) {
  for (const el of labels.values()) el._seen = false;
  const V = view(); const g = V.g;
  if (inNook() && hollow) placeLabel(label("window", "The window", "dim"), hollow.layout.window.clone().setY(hollow.layout.window.y + 0.95));
  if (g && g.phase !== "closed" && (!inNook() || mirrorSpot)) {
    const nm = isHome(g) ? "The mirror" : betweenName(V.items) || (g.phase === "spark" ? "The spark" : "The Between");
    placeLabel(label("between", nm, ""), BETWEEN_AT.clone().setY(DAIS_Y + (isHome(g) ? 1.95 : g.phase === "spark" ? 1.0 : 1.45)));
  }
  if (portal.visible) placeLabel(label("portal", minuteOn() ? "The doorway, grown over" : portalTo ? (portalOpen() ? "To " + (portalTo.name || "the room") : "Grown over") : "The doorway to your rooms", minuteOn() ? "dim" : ""), PORTAL_AT.clone().setY(DAIS_Y + 2.25));
  if (inNook() && hollow && hollow.handles.hearth && hollow.handles.hearth.ember) placeLabel(label("ember", "An ember", ""), HEARTH_AT.clone().setY(1.05));
  if (shelf.group && !satchelOpen) {
    const sh = myShelf();
    if (sh.sealed.length) placeLabel(label("shelfS", sh.sealed.length > 1 ? sh.sealed.length + " scrolls, sealed" : "A scroll from " + (sh.sealed[0].name || "someone"), ""), shelf.at.clone().add(new THREE.Vector3(-0.3, 0.42, 0)));
    else if (sh.blank && !minuteOn()) placeLabel(label("shelfB", "A blank scroll", "dim"), shelf.at.clone().add(new THREE.Vector3(0.3, 0.4, 0)));
  }
  if (meState.body) placeLabel(label("me", "You", "you", cssHue(hueOf(me, g))), meState.pos.clone().setY(meState.sitting && seatBy(meState.seatWant) ? seatBy(meState.seatWant).top + 0.85 : groundY(meState.pos.x, meState.pos.z) + 1.95));
  for (const [k, p] of peers) if (p.body) placeLabel(label("p:" + k, p.uid === me ? "You, in another window" : (names[p.uid] || (isMember(g) || (g && g.members && g.members[p.uid]) ? nameOf(p.uid, g) : "A visitor")), "you", cssHue(hueOf(p.uid, g))), p.pos.clone().setY(p.sitting && seatBy(p.seat) ? seatBy(p.seat).top + 0.85 : groundY(p.pos.x, p.pos.z) + 1.95));
  for (const [k, w] of walkers) {
    if (!w.holder) continue;
    const d = w.doc;
    const txt = w.type === "spirit" ? `${d.name} · ${possessive(d.owner, g)}` : `${(DAEMONS[d.which] || ["Daemon"])[0]} · ${possessive(d.owner, g)}`;
    const el = label("w:" + k, txt, w.holder.position.distanceTo(meState.pos) > 6 ? "dim" : "");
    placeLabel(el, w.holder.position.clone().setY(w.holder.position.y + (w.type === "spirit" ? (w.rest ? 0.75 : 1.15) : 1.95)));
    if (w.meeting && w.type === "daemon" && w.meeting.doc.owner !== d.owner) {
      const b = label("m:" + k, "meets " + (w.meeting.type === "spirit" ? w.meeting.doc.name : (DAEMONS[w.meeting.doc.which] || ["a daemon"])[0]), "bubble");
      placeLabel(b, w.holder.position.clone().setY(w.holder.position.y + 2.3));
    }
  }
  for (const [k, el] of labels) if (!el._seen) { el.remove(); labels.delete(k); }
}

/* ===================================================================================================
   HUD: what is near you, and what you can do
   =================================================================================================== */
function refreshHud() {
  const hud = $("#hud"); if (hud.hidden) return;
  const V = view(); const g = V.g;
  const nc = $("#namecard");
  if (!g) { nc.innerHTML = `<h1>The Between</h1><span class="sub">${storeDown ? "The room only: the store did not answer" : "No garden here yet"}</span>`; }
  else if (isHome(g)) { nc.innerHTML = `<h1>Your homeroom</h1><span class="sub">Only you come in here · ${esc(styleOf(g.style).name)}</span>`; }
  else if (g.phase === "closed") { nc.innerHTML = `<h1>The Between</h1><span class="sub">This garden is closed</span>`; }
  else {
    const s = satisfaction(V.items), st = stateOf(s), stale = isStale(g);
    const nm = betweenName(V.items);
    nc.innerHTML = `<h1>${esc(nm || (g.phase === "spark" ? "The spark" : "The Between"))}</h1>
      <span class="sub">${g.phase === "spark" ? "toward " + esc(g.setup.who) : "you and " + esc(nameOf(other(g), g))} · ${esc(g.setup.kind)}</span>
      <span class="row"><span class="pill ${st}"><i></i>${STATE_TEXT[st][0]}</span>${stale ? '<span class="pill stale"><i></i>Stale</span>' : ""}</span>`;
  }
  const away = g && isMember(g) ? awayActs(g, V) : [];
  $("#awayBtn").innerHTML = "While you were away" + (away.length ? '<span class="dot" title="New tending"></span>' : "");
  $("#awayBtn").hidden = !(g && isMember(g) && g.phase === "between");

  const hint = $("#hint"); let hintText = "";
  const others = [...peers.values()].filter(p => p.uid !== me);
  if (storeDown) hintText = "The garden's store did not answer, so this is the room on its own and nothing here is saved. Reload the page to try again." + (satchelOpen ? " What you set down stays only until you leave." : "");
  else if (!g) hintText = "Tap the floor to walk. Drag to look around.";
  else if (isHome(g) && satchelOpen && minuteOn()) hintText = armed ? `Tap a glowing spot that fits the ${ITEMS[armed].name.toLowerCase()}.` : "Tap the mirror in your satchel, then a glowing spot on the floor.";
  else if (minuteOn()) hintText = minuteHint();
  else if (isHome(g) && mclock.beat === "open") hintText = "The doorway is open. Choose where you want to go when you are ready. A blank scroll waits on your shelf.";
  else if (isHome(g) && portalTo && !portalOpen()) hintText = `${portalTo.name ? portalTo.name + " invited you" : "You were invited"} to a room. The doorway opens at the end of your first minute here.`;
  else if (isHome(g) && portalOpen()) hintText = "The doorway by the mirror is open. Walk up to choose a place.";
  else if (isHome(g) && satchelOpen) hintText = armed ? `Tap a glowing spot that fits the ${ITEMS[armed].name.toLowerCase()}.` : "Tap an item in your satchel, then a glowing spot that fits it. Tap a placed item to put it back.";
  else if (isHome(g) && !mirrorSpot && mySatchel().includes("mirror")) hintText = "Your own room. Your mirror is in your satchel: set it on a spot to see yourself. Tap the window to change the light.";
  else if (isHome(g)) hintText = "Your own room. Walk up to the mirror to change how you look. Tap the window to change the light. The doorway opens when your first minute here is complete.";
  else if (g.phase === "closed") hintText = "The garden is closed. Its history is yours to keep from More.";
  else if (!isMember(g)) hintText = members(g).length >= 2 ? "This garden is held by two people. You can look around." : "A spark is waiting here. Walk up to it.";
  else if (g.phase === "spark") hintText = g.joinRequest ? `${nameOf(g.joinRequest.uid, g)} asks to join. Walk to the spark to answer.` : `You tend this spark alone until ${g.setup.who} joins. Tap your cushion to sit, the floor to walk.`;
  else if (placing) hintText = placing.ask ? "Tap the floor where you would like it. It moves there when they say yes." : "Tap the floor where it should stand, or drag it there, or set it down where you are.";
  else if (others.length) hintText = `${nameOf(others[0].uid, g)} is here with you now.` + (bothSitting() ? " You are sitting together." : meState.sitting ? "" : " Tap your cushion to sit with them.");
  else hintText = `${nameOf(other(g), g)} is not here right now. What you do waits for them.`;
  if (hint._h !== hintText) { hint.textContent = hint._h = hintText; readIn(hint); }

  // near
  const near = $("#near");
  const key = nearKey;
  let html = ""; try { html = key && !minuteOn() ? nearHtml(key, V, g) : ""; } catch (e) { noteError(e, "near " + key); } // a broken card shows nothing, never stops the room
  near.hidden = !html || satchelOpen; if (near._h !== html) { near.innerHTML = html; near._h = html; readIn(near); }

  // tools
  const tools = [];
  if (storeDown) { if (inNook()) tools.push(satchelBtn()); }
  else if (!g) tools.push(`<button type="button" data-open="setup">Plant a spark here</button>`);
  else if (isHome(g) && minuteOn()) {
    // the first minute keeps the room bare: the satchel once the mirror is in it, and Later for a step you leave
    if (mstate().mirrorGiven) tools.push(satchelBtn());
    if (mclock.beat && mclock.laterReady && SKIPPABLE.includes(mclock.beat)) tools.push(`<button class="quiet" type="button" data-act="minuteLater">Later</button>`);
  }
  else if (isHome(g)) {
    const invs = (list && list.gardens || []).reduce((n, r) => n + (r.invitations || []).length, 0);
    tools.push(`<button type="button" data-open="destinations">Doorway</button>`);
    tools.push(satchelBtn());
    tools.push(`<button class="glassbtn" type="button" data-open="look">Look</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="checkin">Check in</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="spirits">Spirits${embersWaiting().length ? `<span class="tembers" title="Embers waiting">${emberDots(3)}</span>` : ""}</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="goals">Goals</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="invitations">Invitations${invs ? '<span class="dot" title="Waiting for your answer"></span>' : ""}</button>`);
    // the style is chosen at the window now (rk-earned-only: the four styles are the light through the window)
  }
  else if (g.phase !== "closed" && isMember(g) && !readOnly) {
    tools.push(`<button type="button" data-open="offer">${g.phase === "spark" ? "Tend the spark" : "Offer something"}</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="agreement">Plant an agreement</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="checkin">Check in</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="spirit">Bring a spirit</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="daemon">Bring a daemon</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="hearth">Hearth</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="pictures">Pictures</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="invite">Invite</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="style">Style</button>`);
    tools.push(satchelBtn());
    if (others.length) tools.push(`<button class="glassbtn" type="button" data-act="wave">Wave</button>`);
  }
  if (g && !isHome(g) && homeId && !storeDown) tools.push(`<button class="glassbtn" type="button" data-act="goHome">Home</button>`); else if (g && g.phase !== "closed" && !isMember(g) && members(g).length < 2 && !readOnly) {
    tools.push(g.joinRequest && g.joinRequest.uid === me ? `<button class="glassbtn" type="button" data-act="unjoin">Take back my request</button>` : `<button type="button" data-act="join">Ask to join</button>`);
  }
  if (placing && !storeDown) tools.unshift(`<button type="button" data-act="lanternHere">Set it down here</button><button class="glassbtn" type="button" data-act="lanternCancel">Leave it where it was</button>`);
  const th = satchelOpen ? "" : tools.join("");
  const te = $("#tools"); if (te._h !== th) { te.innerHTML = th; te._h = th; }
  renderSatchel();

  // next: what the Between suggests now, one move per lane at most (br-next-moves-three-lanes)
  const moves = storeDown || !g || g.phase === "closed" || (!isHome(g) && !isMember(g)) || minuteOn() ? [] : nextMoves(g);
  const nx = $("#next");
  const nh = moves.length ? `<span class="eyebrow">Next</span>${moves.map((m, i) => `<button type="button" class="${i ? "nmore" : "nfirst"}" data-act="next" data-id="${esc(m.act)}"><span class="lane">${esc(LANE_NAMES[m.lane])}</span> <b>${esc(m.title)}</b>${i ? "" : `<span class="t">${esc(m.line)}</span>`}</button>`).join("")}` : "";
  nx.hidden = !nh || !!nearKey || !!placing || satchelOpen; if (nx._h !== nh) { nx.innerHTML = nh; nx._h = nh; }
}
/* The moves for here: in the homeroom, across every room; inside a room, that room only. Your own lane reads your
   homeroom, so checking in with yourself is part of the loop wherever you are. */
function homeState() {
  const h = list && list.home;
  return { lastCheckin: myHome.lastCheckin ?? (h && h.lastCheckin) ?? null, goals: myHome.goals ? Object.values(myHome.goals).filter(Boolean) : (h && h.goals) || [], casts: myHome.casts || {} };
}
function nextMoves(g) {
  const rooms = (list && list.gardens || []).filter(r => r.phase !== "closed");
  if (isHome(g)) return suggest({ home: homeState(), rooms });
  const found = rooms.find(r => r.id === gardenId);
  // this room's ask to change its look is read from the room itself, not the list's last fetch
  const sa = g.styleAsk && g.styleAsk.by !== me ? { style: g.styleAsk.style, at: g.styleAsk.at || null } : null;
  const here = found && { ...found, styleAsk: sa };
  return suggest({ home: homeState(), rooms: here ? [here] : [], here: gardenId });
}
function moveActs(id, it, g) {
  const ma = it.moveAsk;
  if (ma && ma.by !== me) return `<span class="small">${esc(nameOf(ma.by, g))} asks to move it to the ring on the floor.</span><button type="button" data-act="moveYes" data-id="${id}">Yes, move it</button><button class="quiet" type="button" data-act="moveNo" data-id="${id}">Not now</button>`;
  if (ma) return `<span class="small">You asked to move it. It waits for their yes.</span><button class="quiet" type="button" data-act="moveNo" data-id="${id}">Take the ask back</button>`;
  const r = moveRight(it);
  return r ? `<button class="ghost" type="button" data-act="move" data-id="${id}">${r === "shared" ? "Ask to move it" : "Move it"}</button>` : "";
}
/* The card of the hearth's cushion, or of one you set down: anyone's to sit on (a store-down preview shows it too). */
function freeSeatCard(i) {
  const st = seatBy(i); if (!st) return "";
  const here = meState.sitting && meState.seatWant === i, fire = here && seatedAtHearth(), name = st.hearth ? "The hearth's cushion" : st.coins ? "The coin table's cushion" : "A cushion";
  if (!here) return `<div class="what"><b>${name}</b><span class="t">${st.hearth ? "Worn flat from sitting by the fire." : "Set down here for sitting."}</span></div><div class="row"><button type="button" data-act="${st.hearth ? "sitHearth" : "sit"}">Sit here</button></div>`;
  return `<div class="what"><b>${name}</b><span class="t">${fire ? "Sitting by the fire." : "Sitting."}</span></div><div class="row">${fire && (hearthOpen() || storeDown) && sheetName !== "hearth" ? `<button type="button" data-act="sitHearth">Sit with what stirs you</button>` : ""}<button class="glassbtn" type="button" data-act="stand">Stand up</button></div>`;
}
function nearHtml(key, V, g) {
  if (key && key.startsWith("spot:")) return spotNear(key.slice(5), g);
  if (key === "window" && g && isHome(g)) return `<div class="what"><b>The window</b><span class="t">${esc(styleOf(g.style).name)}: ${esc(styleOf(g.style).line)}</span></div><div class="row"><button type="button" data-open="style">Change the light</button></div>`;
  if (!g && !storeDown) return "";
  if (key === "hearth") return `<div class="what"><b>The hearth</b><span class="t">When something stirs you, sit with it. What's left is a little glowing ember you keep.</span></div><div class="row"><button type="button" data-act="sitHearth">Sit at the hearth</button></div>`;
  if (key && key.startsWith("seat:") && typeof seatId(key.slice(5)) !== "number") return freeSeatCard(seatId(key.slice(5)));
  if (!g) return "";
  const canTend = isMember(g) && !readOnly && g.phase !== "closed";
  if (key === "portal") {
    if (!portalOpen()) return `<div class="what"><b>A doorway, grown over</b><span class="t">The vines fall at the end of your first minute here.</span></div>`;
    if (portalTo && !((list && list.gardens) || []).some(r => r.id === portalTo.id)) return `<div class="what"><b>The doorway</b><span class="t">${portalTo.name ? esc(portalTo.name) + " invited you to a room." : "You were invited to a room."}</span></div><div class="row"><button type="button" data-act="through">Walk through</button><button class="quiet" type="button" data-open="destinations">Other places</button></div>`;
    return `<div class="what"><b>The doorway</b><span class="t">A threshold to shared rooms and private practice.</span></div><div class="row"><button type="button" data-open="destinations">Choose a place</button></div>`;
  }
  if (key === "between" && isHome(g)) {
    const lk = parseLook(lookOf(me) || "");
    return `<div class="what"><b>The mirror</b><span class="t">${lk ? "You, as you made yourself: " + esc(lookWords(lk)) + "." : "You have not chosen a look yet. The mirror shows a traveller in a long violet coat until you do."}</span></div><div class="row"><button type="button" data-open="look">Change how you look</button></div>`;
  }
  if (key === "between") {
    const s = satisfaction(V.items), st = stateOf(s), stale = isStale(g);
    const nm = betweenName(V.items);
    let txt;
    if (g.phase === "spark") txt = `<b>${esc(nm || "The spark")}</b><span class="t">What you carry toward ${esc(g.setup.who)}. ${STATE_TEXT[st][0]}: ${STATE_TEXT[st][1]}. It is yours alone. When they join, a new Between begins for the two of you, and its history starts then.</span>`;
    else txt = `<b>${esc(nm || "The Between")}</b><span class="t">${STATE_TEXT[st][0]}: ${STATE_TEXT[st][1]}. ${stale ? `It went more than ${STALE_DAYS} days untended and has dimmed. It cannot die; any tending by either of you airs it out.` : "Fed by agreements you both hold and offerings said yes to."}</span>`;
    let acts = "";
    if (g.phase === "spark" && g.joinRequest && g.startedBy === me) acts = `<span class="small">${esc(nameOf(g.joinRequest.uid, g))} asks to join.</span><button type="button" data-open="welcome">Yes, welcome them</button><button class="quiet" type="button" data-act="notjoin">Not now</button>`;
    else if (canTend) acts = `<button type="button" data-open="offer">${g.phase === "spark" ? "Tend it" : "Offer something"}</button><button class="glassbtn" type="button" data-act="checkin">Check in</button>`;
    else if (!isMember(g) && members(g).length < 2) acts = g.joinRequest && g.joinRequest.uid === me ? `<span class="small">You asked to join. It changes once they say yes.</span>` : `<button type="button" data-act="join">Ask to join</button>`;
    return `<div class="what">${txt}</div>${acts ? `<div class="row">${acts}</div>` : ""}`;
  }
  if (key.startsWith("seat:")) {
    const i = seatId(key.slice(5)), st = seatBy(i);
    if (!st) return "";
    const mine = i === mySeat();
    const hue = i ? "plum" : "teal";
    if (mine) return meState.sitting
      ? `<div class="what"><b>Your cushion</b><span class="t">${bothSitting() ? "Sitting together. Stay as long as you like." : othersHere().length ? esc(nameOf(othersHere()[0].uid, g)) + " is here. Their cushion is the other one." : "Sitting with the Between. When the other person comes in, they find you here."}</span></div><div class="row"><button type="button" data-open="spellbook">Spellbook</button><button class="glassbtn" type="button" data-act="stand">Stand up</button>${othersHere().length ? `<button class="glassbtn" type="button" data-act="wave">Wave</button>` : ""}</div>`
      : `<div class="what"><b>Your cushion</b><span class="t">The ${hue} one is yours. Spells start from here.</span></div><div class="row"><button type="button" data-act="sit">Sit here</button><button class="glassbtn" type="button" data-open="spellbook">Spellbook</button></div>`;
    if (isHome(g)) return `<div class="what"><b>The spare cushion</b><span class="t">Nobody else comes into your homeroom. Sit here with whoever you are bringing to mind.</span></div>`;
    const uid = members(g).find(u => seatOf(u) === i);
    const theirs = uid ? nameOf(uid, g) : (g.phase === "spark" ? g.setup.who : "the other person");
    const there = [...peers.values()].some(p => p.uid === uid && p.sitting);
    return `<div class="what"><b>${esc(theirs)}'s cushion</b><span class="t">${there ? "They are sitting here now." : `The ${hue} one waits for ${esc(theirs)}.`}</span></div>`;
  }
  if (key.startsWith("item:")) {
    const id = key.slice(5), it = V.items.get(id); if (!it) return "";
    const mineIt = it.by === me;
    if (it.kind === "agreement") {
      let acts = ""; const p = it.pending;
      if (canTend) {
        if (it.status === "draft") acts = mineIt ? `<button class="ghost" type="button" data-open="rewrite" data-id="${id}">Rewrite</button>${g.phase === "spark" ? "" : `<button type="button" data-act="propose" data-id="${id}">Propose it</button>`}<button class="quiet" type="button" data-act="compostOwn" data-id="${id}">Compost the draft</button>` : `<span class="small">A draft. It is theirs until they propose it.</span>`;
        else if (it.status === "proposed") acts = mineIt ? `<span class="small">Waiting for their yes.</span><button class="quiet" type="button" data-act="withdraw" data-id="${id}">Back to draft</button>` : `<button type="button" data-act="agree" data-id="${id}">Yes, I agree</button><button class="quiet" type="button" data-act="notyet" data-id="${id}">Not yet</button>`;
        else if (p) acts = p.by === me ? `<span class="small">You ${esc(ASK_TEXT[p.act].replace(/ an agreement$/, ""))}. It waits for their yes.</span><button class="quiet" type="button" data-act="pendingWithdraw" data-id="${id}">Take it back</button>` : `<span class="small">${esc(nameOf(p.by, g))} ${esc(ASK_TEXT[p.act])}.</span><button type="button" data-act="pendingYes" data-id="${id}">Yes</button><button class="quiet" type="button" data-act="pendingNo" data-id="${id}">Not now</button>`;
        else if (it.status === "agreed") acts = `<button class="ghost" type="button" data-act="ask:revisit" data-id="${id}">Ask to revisit</button><button class="ghost" type="button" data-act="ask:broken" data-id="${id}">Name a break</button><button class="quiet" type="button" data-act="ask:retire" data-id="${id}">Ask to retire</button>`;
        else if (it.status === "revisit") acts = `<button class="ghost" type="button" data-open="rewrite" data-id="${id}">Rewrite</button><button type="button" data-act="propose" data-id="${id}">Propose again</button><button class="quiet" type="button" data-act="ask:compost" data-id="${id}">Ask to compost</button>`;
      }
      acts += canTend ? moveActs(id, it, g) : "";
      return `<div class="what"><b>Agreement</b> · ${esc(AG_LABEL[it.status])}, from ${esc(nameOf(it.by, g))}<span class="t">${esc(it.text)}</span></div>${acts ? `<div class="row">${acts}</div>` : ""}`;
    }
    if (it.kind === "lantern") {
      const o = other(g), yesMine = it.yes && typeof it.yes[me] === "number";
      const txt = mineIt ? (lanternLit(it) ? `${esc(nameOf(o, g))} welcomed it into your home together.` : `An offer to ${esc(nameOf(o, g))}. It waits for their welcome.`)
        : yesMine ? "You welcomed it into your home together." : `${esc(nameOf(it.by, g))} made it at the hearth and offers it to you.`;
      let acts = "";
      if (canTend) acts = mineIt
        ? `<button class="ghost" type="button" data-act="move" data-id="${id}">Move it</button><button class="quiet" type="button" data-act="lanternBack" data-id="${id}">Take it back</button><button class="quiet" type="button" data-act="lanternCompost" data-id="${id}">Compost it</button>`
        : yesMine ? `<button class="quiet" type="button" data-act="lanternNo" data-id="${id}">Take back my welcome</button>` : `<button type="button" data-act="lanternYes" data-id="${id}">Welcome it</button>`;
      return `<div class="what"><b>A paper lantern</b> · ${esc(possessive(it.by, g))}<span class="t">${txt}</span></div>${acts ? `<div class="row">${acts}</div>` : ""}`;
    }
    const sealedForMe = it.sealed && !mineIt && !(it.opened && it.opened[me]);
    let acts = "";
    if (canTend && it.status === "offered") acts = mineIt
      ? `<span class="small">Waiting for their yes.</span><button class="quiet" type="button" data-act="withdraw" data-id="${id}">Withdraw</button>`
      : sealedForMe ? `<button class="ghost" type="button" data-act="open" data-id="${id}">Open it</button><button class="quiet" type="button" data-act="decline" data-id="${id}">Let it pass unopened</button>`
      : `<button type="button" data-act="receive" data-id="${id}">Yes, take it in</button><button class="quiet" type="button" data-act="decline" data-id="${id}">Let it pass</button>`;
    if (canTend) acts += moveActs(id, it, g);
    return `<div class="what"><b>${esc(KINDS[it.kind] || "Offering")}</b> · offered by ${esc(nameOf(it.by, g))}<span class="t">${sealedForMe ? "Sealed. You can open it, or let it pass without reading it." : esc(it.text)}</span></div>${acts ? `<div class="row">${acts}</div>` : ""}`;
  }
  if (key.startsWith("w:")) {
    const w = walkers.get(key.slice(2)); if (!w) return "";
    const d = w.doc, mine = d.owner === me;
    const title = w.type === "spirit" ? `${esc(d.name)}, ${esc(d.element.toLowerCase())} spirit` : `The ${esc(DAEMONS[d.which][0])}`;
    const cw = w.type === "spirit" && d.care ? CARE_WORDS[careNow(d.care).word] + ". " : "";
    const sub = w.type === "spirit" ? cw + (d.note ? esc(d.note) : isHome(g) ? "It lives here with you." : d.homeSpirit ? "Visiting from " + (mine ? "your" : "their") + " homeroom. It stays its owner's." : "Visiting. It stays its owner's.") : `${esc(DAEMONS[d.which][1])}. ${mine ? "Yours: it came with you." : "It works for " + esc(nameOf(d.owner, g)) + "."}`;
    const id = key.slice(4);
    let acts = "";
    const feedBtn = w.type === "spirit" && mine && embersWaiting().length ? `<button type="button" data-act="emberGive" data-id="${isHome(g) ? "home" : "room"}:${esc(id)}">Give it an ember</button>` : "";
    if (canTend) acts = mine
      ? `${feedBtn}<button class="ghost" type="button" data-act="callOver" data-id="${key.slice(2)}">Call it to you</button>${isHome(g) ? "" : `<button class="quiet" type="button" data-act="sendHome" data-id="${key.slice(2)}">Send it home</button>`}`
      : `<button class="ghost" type="button" data-act="greet" data-id="${key.slice(2)}">Greet it</button>`;
    return `<div class="what"><b>${title}</b> · ${esc(possessive(d.owner, g))}<span class="t">${sub}</span></div>${acts ? `<div class="row">${acts}</div>` : ""}`;
  }
  if (key.startsWith("p:")) {
    const p = peers.get(key.slice(2)); if (!p) return "";
    return `<div class="what"><b>${esc(p.uid === me ? "You, in another window" : nameOf(p.uid, g))}</b><span class="t">Here now.</span></div>${canTend && p.uid !== me ? `<div class="row"><button class="glassbtn" type="button" data-act="wave">Wave</button></div>` : ""}`;
  }
  return "";
}

/* ===================================================================================================
   Acts (the same lifecycle as the intake page)
   =================================================================================================== */
async function touch(extra = {}) {
  await op("garden/main", "update", { lastTendedAt: now(), ...extra });
  myPrivate.lastSeen = now(); savePriv();
}
function hist(act, text) { return { [hkey()]: { by: me, act, at: now(), ...(text ? { text } : {}) } }; }
function spotAhead(d = 1.0) {
  const p = meState.pos.clone().add(new THREE.Vector3(Math.sin(meState.yaw), 0, Math.cos(meState.yaw)).multiplyScalar(d));
  pushOut(p, 0.5);
  if (p.distanceTo(BETWEEN_AT) < 1.3) p.copy(BETWEEN_AT).add(meState.pos.clone().sub(BETWEEN_AT).setY(0).normalize().multiplyScalar(1.5));
  return { x: +p.x.toFixed(2), z: +p.z.toFixed(2) };
}
async function addItem(kind, text, sealed) {
  const { g } = view();
  const solo = g.phase === "spark";
  const id = "i" + hkey();
  const status = kind === "agreement" ? "draft" : solo ? "kept" : "offered";
  await op("items/" + id, "set", { kind, text, by: me, at: now(), status, spark: solo, sealed: !!sealed && !solo, yes: {}, opened: {}, pending: null, pos: spotAhead(kind === "agreement" ? 0.6 : 1.1),
    history: hist(kind === "agreement" ? "planted an agreement" : solo ? "tended the spark with " + KINDS[kind].toLowerCase() : "offered " + KINDS[kind].toLowerCase(), sealed && !solo ? "" : text) });
  await touch();
}
/* ---------- the hearth: embers in your own pouch, lanterns offered to the other ---------- */
const pouchPath = () => "data/users/" + me + "/pouch";
const hearthOpen = () => { const g = view().g; return !!(g && isMember(g) && !readOnly && g.phase !== "closed"); };
const demoPouch = EMBER_DEMO ? { demo1: { move: "wood_fire", feel: "wood", glow: 2, state: "held", at: 1 }, demo2: { move: "water_transcend", feel: "water", glow: 5, state: "held", at: 2 },
  demo3: { move: "earth_metal", feel: "earth", glow: null, state: "held", at: 3 }, demo4: { move: "fire_earth", feel: "fire", glow: 4, state: "held", at: 4 } } : {};
function embers() { const p = overlay(pouchPath(), myPouch || {}) || {}; const e = p.embers && typeof p.embers === "object" ? p.embers : {}; return Object.entries({ ...e, ...demoPouch }).filter(([, x]) => x && typeof x === "object" && MOVES[x.move]); }
/* A lantern made from a preview's demo ember (or where no lantern can be saved) lives on this page only, kept across polls. */
const localItems = new Map();
function localItem(id, d) { if (d) { localItems.set(id, d); items.set(id, d); } else { localItems.delete(id); items.delete(id); } refresh(); }
const lanternLog = act => ({ [hkey()]: { act, by: me, at: now() } });
let hd = {}; // the hearth sheet's choices while it is open
function hearthSpot(id) { // in front of the hearth, toward the middle of the room
  const r = rng(hash(id)), out = HEARTH_AT.clone().negate().setY(0).normalize(), side = new THREE.Vector3(-out.z, 0, out.x);
  const p = HEARTH_AT.clone().addScaledVector(out, 1.75 + r() * 0.4).addScaledVector(side, (r() - 0.5) * 1.4);
  pushOut(p, 0.3);
  return { x: +p.x.toFixed(2), z: +p.z.toFixed(2) };
}
async function keepEmber() {
  const m = MOVES[hd.move]; if (!m) return;
  // Only the move, its feeling and the private glow: no words, and nothing of which charge it came from.
  await op(pouchPath(), "update", { embers: { ["e" + hkey()]: { move: hd.move, feel: m[1], glow: hd.glow || null, state: "held", at: now(), lantern: null } } });
  hd = {}; if (hm) { closeSheet(); hmSync(); } else toast("An ember, in your pouch."); // by the fire, it rises out of the satchel instead
}
async function makeLantern(eid) {
  const e = embers().find(([k]) => k === eid); if (!e || e[1].state !== "held") return null;
  const lid = "l" + hkey();
  // the paper takes the ember's glow: its element's light if it was shown (hd.showEl), else the fire's plain amber
  await op("items/" + lid, "set", { kind: "lantern", by: me, hue: cssHue(AMBER), element: hd.showEl ? MOVES[e[1].move][1] : null, pos: hearthSpot(lid), yes: {}, status: "offered", at: now(), history: lanternLog("made") });
  await op(pouchPath(), "update", { embers: { [eid]: { state: "lit", lantern: lid } } });
  await touch(); hd = {};
  return lid;
}
/* Moving things (ba-round4-comfort, Ari's note 2): what you made moves when you move it. A shared agreement moves only on
   the other person's yes, the way its other asks wait (rc-offer-received). The other person's own things stay where they set them. */
function moveRight(it) {
  if (!it || readOnly) return null;
  if (it.kind === "lantern") return it.by === me ? "own" : null;
  if (it.kind === "agreement") return it.status === "draft" ? (it.by === me ? "own" : null) : ["proposed", "agreed", "revisit"].includes(it.status) ? "shared" : null;
  return it.by === me && it.status === "offered" ? "own" : null;
}
async function moveItem(id, pos) {
  placing = null;
  const { items: its, g } = view(); const it = its.get(id); const right = moveRight(it);
  if (!right) { refreshHud(); return; }
  if (it.local) { localItem(id, { ...it, pos }); return; }
  if (right === "shared") {
    await op("items/" + id, "update", { moveAsk: { by: me, at: now(), pos }, history: hist("asked to move an agreement") });
    toast(`Asked. It moves when ${nameOf(other(g), g)} says yes.`);
  } else await op("items/" + id, "update", { pos, history: it.kind === "lantern" ? lanternLog("moved") : hist(it.kind === "agreement" ? "moved a draft agreement" : "moved an offering") });
  await touch(); refresh();
}
async function moveAnswer(id, yes) {
  const it = view().items.get(id); if (!it || !it.moveAsk) return;
  const asker = it.moveAsk.by === me;
  await op("items/" + id, "update", yes && !asker ? { pos: it.moveAsk.pos, moveAsk: null, history: hist("agreed to move an agreement") }
    : { moveAsk: null, history: hist(asker ? "took back a request to move an agreement" : "said not now to moving an agreement") });
  await touch();
}
async function unmakeLantern(id, compost) {
  const lo = localItems.get(id);
  if (lo) { localItem(id, null); for (const [k, x] of Object.entries(demoPouch)) if (x.lantern === id) demoPouch[k] = { ...x, state: "held", lantern: null }; }
  else await op("items/" + id, "delete");
  const e = embers().find(([, x]) => x.lantern === id);
  if (e && !lo) await op(pouchPath(), "update", { embers: { [e[0]]: { state: "held", lantern: null } } });
  toast(compost ? "The lantern went to ash and became soil. Its ember is back in your pouch." : "You took the lantern back. Its ember is in your pouch again.");
}
/* "Something stirs": the one strip left by the fire. Choosing a move is a choice made after sitting, so the feel, move and glow
   pickers open here, low and see-through over the room; a kept ember rises out of the satchel into the crescent. */
function stirSheet(g, V) {
  const charges = [...V.items.entries()].filter(([, i]) => i.kind === "charge" && i.by === me);
  const pick = (act, id, on, inner, extra = "") => `<button type="button" data-act="${act}" data-id="${id}" aria-pressed="${on ? "true" : "false"}" class="${on ? "on" : ""}" ${extra}>${inner}</button>`;
  return `<div class="stack"><h2>Something stirs</h2>
    <label for="hCharge">What stirred you<select id="hCharge"><option value="">A feeling with no words</option>${charges.map(([k, i]) => `<option value="${k}" ${hd.charge === k ? "selected" : ""}>${esc(String(i.text || "").slice(0, 70))}</option>`).join("")}</select></label>
    <span class="small"><b>What it felt like</b></span>
    <div class="choice">${Object.entries(FEELS).map(([el, f]) => pick("hFeel", el, hd.feel === el, `<span class="ember" style="--c:${cssHue(elHex(el))};--s:12px"></span><b>${f[0].toUpperCase() + f.slice(1)}</b>${el}`)).join("")}</div>
    ${hd.feel ? `<span class="small"><b>A move to work it with</b></span>
    <div class="choice">${movesFrom(hd.feel).map(([id, m]) => pick("hMove", id, hd.move === id, `<b>${esc(m[0])}</b>${m[1] === m[2] ? "stays " + m[1] : m[1] + " into " + m[2]}`)).join("")}</div>` : ""}
    ${hd.move ? `<span class="small"><b>How strong it felt</b> <span class="muted">(only you see this)</span></span>
    <div class="row dots">${[1, 2, 3, 4, 5].map(n => pick("hGlow", n, hd.glow === n, `<span class="ember" style="--c:${cssHue(elHex(hd.feel))};--s:${8 + n * 3}px"></span>`, `aria-label="${n} of 5"`)).join("")}${pick("hGlow", 0, !hd.glow, "Skip")}</div>
    <div class="row"><button type="button" data-act="hKeep">Keep the ember</button></div>` : ""}
    <p class="credit">${FIVE_CREDIT}</p></div>`;
}
/* ---------- the seated hearth moment, take A "Motes from the satchel" (Wendell's pick of the art page, 2026-10-24) ----------
   No card. Sat by the fire, the camera comes down beside your shoulder and the room's sound thins to the crackle; the satchel at
   your hip loosens and the pouch's held embers rise out of it one at a time, a thin trail of sparks behind each, into a loose
   crescent between you and the fire. Every one glows the fire's amber; a brighter, larger one was felt more strongly, and that is
   the only difference shown. Touch one and it comes down into your hands; hold it (breathe on it) and it shows its element's
   light, let go early and it stays amber. In a shared room a paper lantern unfolds at your knee to take it, and the room's hooks
   answer. Held to the crafting pass: private, no counts, no failure, no reward, colour only if you let it. */
const AMBER = 0xff9436, HM_TRAIL = 14, HM_FIRST = "between.hearth.seen";
const HM_LINES = { first: "When something stirs you, sit with it. What's left is a little glowing ember you keep.", colour: "It shows its colour only if you let it.", them: "For them, when they next come in.",
  home: "Embers you keep here go with you. In a room you share, one can become a lantern for your home together." };
let hm = null, hmGone = null, hmK = 0, hmUp = 0; // the moment while you sit by the fire; the one just ended, its embers sinking home
const hmEl = document.createElement("div"); hmEl.id = "hm"; hmEl.className = "hm"; hmEl.hidden = true; hmEl.setAttribute("role", "group"); hmEl.setAttribute("aria-label", "By the fire"); document.body.appendChild(hmEl);
const hmGroup = new THREE.Group(); scene.add(hmGroup);
const hmGlowMat = (c, o) => new THREE.SpriteMaterial({ map: moteMat.map, color: c, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false });
const hmPouch = new THREE.Group(); hmPouch.visible = false; hmGroup.add(hmPouch);
{
  const leather = new THREE.MeshStandardMaterial({ color: 0x6b4428, roughness: 0.85 });
  const bag = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), leather); bag.scale.set(1, 0.85, 0.7); hmPouch.add(bag);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.065, 0.06, 10, 1, true), leather); neck.position.y = 0.09; hmPouch.add(neck);
  const cord = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 16), new THREE.MeshStandardMaterial({ color: 0xc9a070, roughness: 0.7 })); cord.rotation.x = Math.PI / 2; cord.position.y = 0.11; hmPouch.add(cord);
  const glow = new THREE.Sprite(hmGlowMat(AMBER, 0)); glow.scale.setScalar(0.32); glow.position.y = 0.12; hmPouch.add(glow);
  Object.assign(hmPouch.userData, { neck, cord, glow });
}
const isDemoEmber = eid => eid.startsWith("demo");
const hmLanternsHere = () => { const g = view().g; return EMBER_DEMO || !!(g && !isHome(g) && g.phase === "between" && hearthOpen()); };
const hmRealLantern = eid => !isDemoEmber(eid) && !storeDown && (() => { const g = view().g; return !!(g && !isHome(g) && g.phase === "between" && hearthOpen()); })();
function hmFrame(S) {
  if (!S) return null;
  const f = new THREE.Vector3(Math.sin(S.yaw), 0, Math.cos(S.yaw)), r = new THREE.Vector3(-f.z, 0, f.x);
  return { S, f, r, at: new THREE.Vector3(S.x, S.top, S.z) };
}
const hmAt = (F, fw, rt, up) => F.at.clone().addScaledVector(F.f, fw).addScaledVector(F.r, rt).setY(F.S.top + up);
const hmPouchAt = F => hmAt(F, 0.05, 0.27, 0.06);
const hmHands = F => hmAt(F, 0.5, 0.3, 0.58);
const hmKnee = F => { const p = hmAt(F, 1.0, 0.5, 0); p.y = F.S.floor; return p; };
const hmFree = () => !hollow ? [] : Object.values(hollow.handles.spots).filter(h => h.takes === "hang" && !h.item && ![...view().items.values()].some(it => it.kind === "lantern" && it.pos && it.pos.hang === h.id));
function hmMote(eid, e) {
  const gl = e.glow || 3, s = 0.016 + gl * 0.006, g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(s, 12, 10), new THREE.MeshBasicMaterial({ color: AMBER, fog: false, toneMapped: false }));
  const halo = new THREE.Sprite(hmGlowMat(AMBER, 0.35 + gl * 0.1)); halo.material.blending = THREE.NormalBlending; // a soft glow that keeps its colour over the fire halo.scale.setScalar(s * 5 + gl * 0.025);
  g.add(core, halo); g.visible = false;
  const tg = new THREE.BufferGeometry(); tg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(HM_TRAIL * 3), 3));
  const trail = new THREE.Points(tg, new THREE.PointsMaterial({ map: moteMat.map, color: AMBER, size: 0.022, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
  trail.frustumCulled = false; trail.visible = false;
  hmGroup.add(g, trail);
  return { eid, e, g, core, halo, trail, hist: [], state: "wait", riseAt: 0, t0: 0, from: null, pos: new THREE.Vector3(), el: new THREE.Color(elHex(MOVES[e.move][1])), show: 0, shown: false, s };
}
function hmDrop(m) { hmGroup.remove(m.g, m.trail); m.core.geometry.dispose(); m.trail.geometry.dispose(); }
/* The pouch's held embers, oldest first: a new one (kept from the strip) rises to join the crescent. */
function hmSync() {
  if (!hm) return;
  const held = embers().filter(([, e]) => e.state === "held").sort((a, b) => (a[1].at || 0) - (b[1].at || 0)), ids = new Set(held.map(([k]) => k));
  const t = performance.now() / 1000;
  for (const [k, e] of held) if (!hm.motes.some(m => m.eid === k)) { const m = hmMote(k, e); m.riseAt = Math.max(hm.riseNext, t); hm.riseNext = m.riseAt + 0.8; hm.motes.push(m); }
  for (const m of hm.motes) if (!ids.has(m.eid) && m.state !== "lantern" && m.state !== "lit") m.state = "sink";
  hmHud();
}
function hmBegin() {
  if (hm || !seatedAtHearth() || !(hearthOpen() || storeDown || EMBER_DEMO)) return;
  if (sheetName) closeSheet();
  if (hmGone) hmClear(hmGone);
  const t = performance.now() / 1000;
  hm = { t0: t, riseNext: t + 8, motes: [], held: null, turn: 0, turnV: 0, press: null, step: "motes", L: null, lid: null, said: {} };
  hmSync(); document.body.classList.add("seatedmoment"); hmEl.hidden = false; ambient.hush(true); refreshHud();
}
function hmEnd() {
  if (!hm) return;
  const h = hm; fsEnd(h); hm = null; hmEl.hidden = true; hmEl.innerHTML = ""; hmEl._h = ""; document.body.classList.remove("seatedmoment"); ambient.hush(false);
  if (h.L && (h.lid || !h.L.lit)) { hmGroup.remove(h.L.g); h.L = null; } // a lantern made is the room's now; one not lit folds away
  for (const m of h.motes) if (m.state !== "lit") m.state = "sink";
  const th = h.lid && things.get(h.lid); if (th) th.group.visible = true;
  h.endT = performance.now() / 1000; hmGone = h;
}
function hmClear(h) { for (const m of h.motes) hmDrop(m); if (h.L) hmGroup.remove(h.L.g); hmPouch.visible = false; if (hmGone === h) hmGone = null; }
function hmSay(key, text) { if (!hm || hm.said[key]) return; hm.said[key] = true; caption(text || HM_LINES[key]); }
/* Touch: an ember comes down into your hands (the one there goes back to its place); the held one, touched again, goes back. */
function hmHold(eid) {
  if (!hm || hm.step !== "motes") return;
  const m = hm.motes.find(x => x.eid === eid); if (!m || (m.state !== "slot" && m.state !== "held" && m.state !== "lip")) return;
  if (hm.fs) { fsChoose(m); return; } // choosing what to sit with: it goes to the hearth's lip, not your hands
  if (m.state === "held") { m.state = "slot"; hm.held = null; hmHud(); return; }
  for (const o of hm.motes) if (o.state === "held") o.state = "slot";
  m.state = "held"; hm.held = m;
  if (!hm.said.colour) setTimeout(() => hmSay("colour"), 900);
  if (hmLanternsHere()) { if (!hm.L) hmUnfold(); }
  else if (!hm.said.home) { const g = view().g; setTimeout(() => hmSay("home", g && !isHome(g) && g.phase === "spark" ? `Once ${g.setup.who} joins, an ember can become a lantern for your home together.` : HM_LINES.home), 7000); }
  hmHud();
}
/* Breathe on it: a press held on the ember in your hands. Its words come back first, if it has any; a full breath shows its colour. */
function hmPress(on) {
  if (!hm) return;
  if (on && hm.held && hm.step === "motes") { hm.press = { t0: performance.now() / 1000, k: 0 }; const w = hm.held.e.words; if (typeof w === "string" && w.trim()) caption(w); }
  else if (!on) hm.press = null;
}
function hmUnfold() {
  const F = hmFrame(seatViewAt); if (!F) return;
  const g = paperLantern(AMBER, 0.3), body = g.children[0]; body.material = body.material.clone(); body.material.emissive.setHex(0x553420); body.material.color.setHex(0x6a5a4a); // dim paper, so the glow it takes is its colour
  const at = hmKnee(F); g.position.copy(at); g.scale.set(1, 0.02, 1); g.rotation.y = F.S.yaw + Math.PI; hmGroup.add(g);
  hm.L = { g, body, at, t0: performance.now() / 1000, lit: false, colour: new THREE.Color(AMBER), glow: 0, to: null, from: null, tt: 0 };
  hmHud();
}
/* The ember goes to the lantern: the paper takes its glow (its colour if shown), the rest sink back into the satchel, and the
   existing lantern data path makes it (makeLantern; a preview's demo ember makes a lantern on this page only). */
async function hmLight() {
  if (!hm || !hm.L || !hm.held || hm.L.lit) return;
  const m = hm.held, L = hm.L; hm.held = null; m.state = "lantern"; m.t0 = performance.now() / 1000; m.from = m.pos.clone();
  L.lit = true; L.colour.copy(m.shown ? m.el : new THREE.Color(AMBER)); hm.step = "lighting";
  for (const o of hm.motes) if (o !== m && o.state !== "lit") o.state = "sink";
  hd.showEl = m.shown;
  let lid = null;
  if (hmRealLantern(m.eid)) lid = await makeLantern(m.eid);
  else {
    lid = "local-" + hkey();
    localItem(lid, { kind: "lantern", by: me, hue: cssHue(AMBER), element: m.shown ? MOVES[m.e.move][1] : null, pos: hearthSpot(lid), yes: {}, status: "offered", at: now(), local: true });
    if (isDemoEmber(m.eid)) demoPouch[m.eid] = { ...demoPouch[m.eid], state: "lit", lantern: lid };
  }
  hd = {};
  if (!hm) return;
  hm.lid = lid;
  setTimeout(() => { if (!hm || !hm.L) return; hm.hooks = hmFree(); if (hm.hooks.length) { hm.step = "hang"; hmHud(); } else hmSend(null); }, 1700);
}
/* The room answers: a free hook glows; touched, the lantern drifts there, sways and settles. With no hook it stands by the hearth. */
function hmSend(spot) {
  if (!hm || !hm.L || !hm.lid) return;
  const L = hm.L, id = hm.lid, it = view().items.get(id);
  const to = spot ? spot.pos.clone().setY(spot.pos.y - 0.92) : (() => { const p = it && it.pos ? it.pos : hearthSpot(id); return new THREE.Vector3(p.x, groundY(p.x, p.z), p.z); })();
  L.from = L.g.position.clone(); L.to = to; L.tt = performance.now() / 1000; L.hang = spot; hm.step = "send"; hmHud();
  setTimeout(async () => {
    if (spot) {
      const pos = { x: +spot.pos.x.toFixed(2), z: +spot.pos.z.toFixed(2), hang: spot.id };
      await moveItem(id, pos);
    }
    if (hm) { hm.step = "settled"; hmSay("them"); hmHud(); }
  }, 2600);
}
/* What the moment answers to by touch, before the room's own taps: an ember, the lantern, a glowing hook; the floor stands you up. */
function hmTap(cx, cy) {
  if (!hm) return false;
  if (fsTap(cx, cy)) return true;
  ray.setFromCamera(new THREE.Vector2(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1), camera);
  if (hm.step === "hang") { let best = null, bd = 0.5; for (const h of hm.hooks) { const d = ray.ray.distanceToPoint(h.pos.clone().setY(h.pos.y - 0.42)); if (d < bd) { bd = d; best = h; } } if (best) { hmSend(best); return true; } }
  if (hm.L && hm.held && ray.ray.distanceToPoint(hm.L.g.position.clone().setY(hm.L.g.position.y + 0.42)) < 0.35) { hmLight(); return true; }
  const [best, bd] = hmHit(cx, cy);
  if (best && bd < 44) {
    if (best === hm.held && hm.press && performance.now() / 1000 - hm.press.t0 > 0.35) return true; // the end of a breath, not a touch
    hmHold(best.eid); return true;
  }
  const hit = new THREE.Vector3();
  if (bd > 90 && ray.ray.intersectPlane(floorPlane, hit) && hit.distanceTo(HEARTH_AT) > 0.9) { hmStand(); return true; }
  return true; // the fire and the air hold still
}
/* The ember nearest a point on the screen, and how far it is in pixels (a fingertip, not a ray, decides). */
function hmHit(cx, cy) {
  let best = null, bd = Infinity;
  for (const m of hm ? hm.motes : []) if ((m.state === "slot" || m.state === "held" || (m.state === "lip" && hm.fs && hm.fs.step === "choose")) && m.g.visible) { const p = m.pos.clone().project(camera), d = Math.hypot((p.x + 1) / 2 * innerWidth - cx, (1 - p.y) / 2 * innerHeight - cy); if (d < bd) { bd = d; best = m; } }
  return [best, bd];
}
function hmStand() { const st = seatBy(meState.seatWant); standUp(); if (st) meState.target = pushOut(new THREE.Vector3(st.x - Math.sin(st.yaw) * 0.7, 0, st.z - Math.cos(st.yaw) * 0.7)); refreshHud(); }
/* The words and buttons a screen reader or a keyboard reaches: each ember, breathing on the held one, the lantern, the hooks. */
function hmHud() {
  if (!hm) return;
  const b = (act, id, label, cls = "sr") => `<button type="button" class="${cls}" data-act="${act}"${id ? ` data-id="${esc(id)}"` : ""}>${label}</button>`;
  const ms = hm.motes.filter(m => m.state === "slot" || m.state === "held" || m.state === "lip"), fs = hm.fs;
  if (fs && fs.step !== "choose") { // the sit: nothing on the screen but the way up; back early, the fire asks
    const h = fs.step === "banked" ? `<div class="hmrow"><button type="button" class="hmlink" data-act="hmStand">Stand up</button><button type="button" class="hmlink" data-act="fsStay">Stay by the fire</button></div>`
      : `<div class="hmrow">${b("hmStand", "", "Stand up")}</div>`;
    if (hmEl._h !== h) { hmEl._h = h; hmEl.innerHTML = h; } return;
  }
  const lay = hm.step === "motes" && !(fs && fs.sticks >= 3) ? b("fsLay", "", fs ? "Lay another stick on the fire" : "Lay a stick on the fire") : "";
  const h = `<div class="hmrow">${lay}${hm.step === "motes" ? ms.map(m => b("hmHold", m.eid, fs ? (m.state === "lip" ? "Take this ember back" : "Sit with this ember") : m.state === "held" ? "Let this ember go back" : (m.e.glow || 3) >= 4 ? "A bright ember" : "An ember")).join("") : ""}
    ${hm.held && hm.step === "motes" ? b("hmBreathe", "", "Breathe on it (hold)") : ""}${hm.held && hm.L && !hm.L.lit ? b("hmLantern", "", "Give it to the lantern") : ""}
    ${hm.step === "hang" ? hm.hooks.map(x => b("hmHang", x.id, "Hang it here")).join("") : ""}
    ${teaBtn()}<button type="button" class="hmlink" data-open="hearth" data-id="stir">Something stirs</button><button type="button" class="hmlink" data-act="hmStand">Stand up</button></div>`;
  if (hmEl._h === h) return; hmEl._h = h; hmEl.innerHTML = h;
}
// breathing by keyboard or on the button: held down, as a press on the ember is
hmEl.addEventListener("pointerdown", e => { if (e.target.closest('[data-act="hmBreathe"]')) hmPress(true); });
hmEl.addEventListener("keydown", e => { if ((e.key === " " || e.key === "Enter") && e.target.closest('[data-act="hmBreathe"]')) { e.preventDefault(); if (!e.repeat) hmPress(true); } });
addEventListener("pointerup", () => { if (hm && hm.press) hmPress(false); });
addEventListener("pointercancel", () => { if (hm && hm.press) hmPress(false); });
addEventListener("keyup", e => { if (hm && hm.press && (e.key === " " || e.key === "Enter")) hmPress(false); });
/* Once a frame: the satchel, the embers' flight, the crescent turning, the breath, the lantern. */
function hmTick(t, dt) {
  const h = hm || hmGone; if (!h) return;
  const F = hmFrame(seatViewAt || seatBy(meState.seatWant)); if (!F) return;
  const el = t - h.t0, P = hmPouchAt(F), ending = !hm;
  if (!ending && el > 4 && !h.said.first) { if (EMBER_DEMO || !ls.get(HM_FIRST)) { ls.set(HM_FIRST, 1); hmSay("first"); } else h.said.first = true; } // first time only (a demo preview shows it each time)
  // the satchel loosens a little before the first ember rises, and closes again once none is in flight
  const open = h.motes.some(m => m.state === "rise" || m.state === "sink" || (m.state === "wait" && t > m.riseAt - 0.8));
  hmPouch.visible = true; hmPouch.position.copy(P); hmPouch.rotation.y = F.S.yaw;
  const u = hmPouch.userData; u.k = (u.k || 0) + ((open ? 1 : 0) - (u.k || 0)) * Math.min(1, dt * 3);
  u.cord.scale.setScalar(1 + u.k * 0.5); u.neck.scale.set(1 + u.k * 0.45, 1, 1 + u.k * 0.45); u.glow.material.opacity = u.k * 0.55;
  // the crescent: slots on a loose arc between you and the fire, turned by a sideways drag, slowly, like a mobile
  h.turn += h.turnV * dt; h.turnV *= Math.pow(0.08, dt);
  const live = h.motes.filter(m => m.state !== "sink" && m.state !== "lit" && m.state !== "lantern" && m.state !== "gone" && m.state !== "lip"), n = live.length, step = n > 1 ? Math.min(0.42, 2.1 / (n - 1)) : 0;
  live.forEach((m, i) => { const a = (i - (n - 1) / 2) * step + 0.45 + h.turn, R = 0.92 + 0.07 * Math.sin(i * 2.3); m.slot = hmAt(F, Math.cos(a) * R, Math.sin(a) * R, 0.9 + 0.1 * Math.sin(i * 1.7) + Math.sin(t * 1.1 + i * 1.3) * 0.025); });
  const hands = hmHands(F);
  for (const m of h.motes) {
    if (m.state === "wait") { if (!ending && t >= m.riseAt) { m.state = "rise"; m.t0 = t; m.pos.copy(P); m.g.visible = true; m.trail.visible = true; m.hist = []; } else continue; }
    if (m.state === "rise") {
      const k = Math.min(1, (t - m.t0) / 1.9), e = k * k * (3 - 2 * k), to = m.slot || P;
      m.pos.lerpVectors(P, to, e); m.pos.y += Math.sin(k * Math.PI) * 0.22; m.pos.x += Math.sin(k * 9 + m.riseAt) * 0.015 * (1 - k);
      if (k >= 1) m.state = "slot";
    } else if (m.state === "slot") { if (m.slot) m.pos.lerp(m.slot, Math.min(1, dt * 3)); }
    else if (m.state === "lip") m.pos.lerp(fsLipAt(F).setY(fsLipAt(F).y + Math.sin(t * 0.8) * 0.006), Math.min(1, dt * 2.2));
    else if (m.state === "held") m.pos.lerp(hands.clone().setY(hands.y + Math.sin(t * 1.6) * 0.012), Math.min(1, dt * 3.5));
    else if (m.state === "lantern" && h.L) {
      const k = Math.min(1, (t - m.t0) / 1.2), to = h.L.g.position.clone().setY(h.L.g.position.y + 0.43);
      m.pos.lerpVectors(m.from, to, k * k * (3 - 2 * k)); m.pos.y += Math.sin(k * Math.PI) * 0.15;
      if (k >= 1) { m.state = "lit"; m.g.visible = false; m.trail.visible = false; }
    } else if (m.state === "sink") {
      if (!m.g.visible) { m.state = "gone"; continue; }
      if (!m.from) { m.from = m.pos.clone(); m.t0 = t; }
      const k = Math.min(1, (t - m.t0) / 1.3); m.pos.lerpVectors(m.from, P, k * k); m.g.scale.setScalar(1 - k * 0.7);
      if (k >= 1) { m.state = "gone"; m.g.visible = false; m.trail.visible = false; }
    }
    // breath: a press held on the ember in your hands; a full one shows its element's light, a short one leaves it amber
    if (m === h.held && h.press) { h.press.k = Math.min(1, (t - h.press.t0) / 2.2); if (h.press.k >= 1 && !m.shown) { m.shown = true; burst(m.pos.clone(), m.el.getHex()); } }
    const want = m.shown ? 1 : m === h.held && h.press ? h.press.k * 0.35 : 0;
    m.show += (want - m.show) * Math.min(1, dt * 2.5);
    const c = new THREE.Color(AMBER).lerp(m.el, m.show);
    if (m.e.risen && !m.show) c.lerp(new THREE.Color(FS_SAT), 0.45); // risen once at the fire: a warmer gold
    if (m.state === "lip" && h.fs && h.fs.step !== "choose") c.set(FS_DIS).lerp(new THREE.Color(FS_SAT), emberWarmth(h.fs, Date.now(), FS_MIN, !!m.e.risen)); // sat with: dissatisfied toward satisfied
    const fl = 0.9 + Math.sin(t * 5.3 + m.riseAt * 3) * 0.06 + Math.sin(t * 13 + m.riseAt) * 0.04;
    m.core.material.color.copy(c).lerp(new THREE.Color(0xffe0b0), 0.25 * (1 - m.show)); m.halo.material.color.copy(c); m.halo.scale.setScalar((m.s * 5 + (m.e.glow || 3) * 0.025) * fl * (m === h.held && h.press ? 1 + h.press.k * 0.25 : 1));
    m.g.position.copy(m.pos);
    // the trail: the last few places it passed, drawn as sparks; at rest they gather into its glow
    m.hist.unshift(m.pos.clone()); if (m.hist.length > HM_TRAIL) m.hist.length = HM_TRAIL;
    const arr = m.trail.geometry.attributes.position.array; for (let i = 0; i < HM_TRAIL; i++) { const q = m.hist[Math.min(i, m.hist.length - 1)]; arr[i * 3] = q.x; arr[i * 3 + 1] = q.y; arr[i * 3 + 2] = q.z; }
    const v = m.hist.length > 1 ? m.hist[0].distanceTo(m.hist[1]) / Math.max(dt, 0.001) : 0; m.tv = (m.tv || 0) + (v - (m.tv || 0)) * Math.min(1, dt * 4);
    m.trail.geometry.attributes.position.needsUpdate = true; m.trail.material.color.copy(c); m.trail.material.opacity = Math.min(0.7, m.tv * 1.5); // sparks only while it moves
  }
  // the lantern: it unfolds on the hearthstone at your knee, takes the ember's glow, then drifts where it was sent and sways
  const th = hm && hm.lid && things.get(hm.lid); if (th) th.group.visible = false; // the moment carries its own until you stand
  const L = h.L;
  if (L) {
    const k = Math.min(1, (t - L.t0) / 1.1); L.g.scale.set(1, Math.max(0.02, k * k * (3 - 2 * k)), 1);
    L.glow += ((L.lit && h.motes.some(m => m.state === "lit") ? 1 : 0.15) - L.glow) * Math.min(1, dt * 1.5);
    L.body.material.emissive.copy(new THREE.Color(0x553420).lerp(L.colour, L.glow)); L.body.material.emissiveIntensity = 0.35 + L.glow * 0.65;
    if (L.to) {
      const q = Math.min(1, (t - L.tt) / 2.4), e = q * q * (3 - 2 * q);
      L.g.position.lerpVectors(L.from, L.to, e); L.g.position.y += Math.sin(q * Math.PI) * (L.hang ? 0.5 : 0.25);
      L.g.children[3].visible = !L.hang || q < 0.5; // a hanging lantern needs no foot
      L.g.rotation.z = L.hang && q >= 1 ? Math.sin(t * 1.4) * 0.12 * Math.exp(-(t - L.tt - 2.4) * 0.45) + Math.sin(t * 0.7) * 0.02 : 0;
    }
  }
  fsTick(t, dt, h, F);
  if (ending && t - h.endT > 1.6) hmClear(h);
}
/* ---------- the focus sit (council pass integral-octalysis2; his yes on io-focus-sit-look-1, 2026-10-25) ----------
   Inside the seated hearth moment. A small stack of split wood waits at your knee: lay one, two or three sticks on the fire
   and that is the length of the sit (focus.js), with no timer shown. Touch one of your embers and it drifts to rest on the
   hearth's lip, or touch none and sit with the fire alone. Once you stop laying and choosing, the sit settles in: the other
   embers go home to the satchel, the view comes low behind your shoulder, the room's light drops to the fire, and the
   hearth spirit tends the fire in small acts while you are away (Focus Friend's body double). Back early, the fire has
   banked to coals and asks "Stand up?"; stay and it carries on, stand and the ember goes back as it was, nothing written.
   A sit run its length raises the ember one state (risen, rules.ts), a mote drops into the satchel, and the room's light
   stays a little higher (qi as weather). Not built yet: the vibeulon count, care for a hearth spirit with its own record,
   the spirit's story fragments. */
const FS_FAST = PREVIEW_HOST && KQ.get("focus") === "fast"; // previews: ?focus=fast, a minute of the sit passes in a second
const FS_MIN = FS_FAST ? 1000 : MINUTE_MS, FS_DIS = 0x7a68b0, FS_SAT = 0xffc860, FS_FIRST = "between.focus.seen";
let fsRoom = 1, fsK = 0; // the room's light after a sit (qi as weather); the low sit view, eased in
const fsStack = new THREE.Group(); fsStack.visible = false; hmGroup.add(fsStack);
const fsLaid = new THREE.Group(); hmGroup.add(fsLaid); // sticks laid on the fire this sit
const fsSpirit = new THREE.Group(); fsSpirit.visible = false; hmGroup.add(fsSpirit);
const fsBark = new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.9 }), fsGrain = new THREE.MeshStandardMaterial({ color: 0xe6b98a, roughness: 0.8, emissive: 0x3a1c08, emissiveIntensity: 0.25 });
function fsLogGeo(r, len) { // a split log: a wedge of the round, bark on the curve, pale grain on the ends and the split faces' edges
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.absarc(0, 0, r, -0.95, 0.95, false); sh.lineTo(0, 0);
  const g = new THREE.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false, curveSegments: 6 }); g.translate(-r * 0.45, 0, -len / 2); return g;
}
const FS_LOGS = [[-0.085, 0.055, 0.3, 0.09, 0.46], [0.085, 0.055, -0.2, 0.085, 0.44], [0, 0.15, 1.6, 0.08, 0.42]]; // side, up, turn, radius, length; the top one is laid first
const fsLogs = FS_LOGS.map(([x, y, rz, r, len]) => { const m = new THREE.Mesh(fsLogGeo(r, len), [fsGrain, fsBark]); m.position.set(x, y, 0); m.rotation.set(0, 0.12 * Math.sign(x || 1), rz); fsStack.add(m); return m; });
const fsStackLight = new THREE.PointLight(0xffb070, 0, 1.6, 1.6); fsStack.add(fsStackLight); fsStackLight.position.set(0, 0.45, 0.35); // soft, from the fire's side
{
  const glow = new THREE.Sprite(hmGlowMat(0xffb060, 0)); glow.scale.setScalar(1.0); fsSpirit.add(glow);
  const eyes = [-0.05, 0.05].map(x => { const e = new THREE.Sprite(hmGlowMat(0xfff0c8, 0)); e.scale.setScalar(0.06); e.position.set(x, 0.04, 0.12); fsSpirit.add(e); return e; });
  Object.assign(fsSpirit.userData, { glow, eyes, k: 0 });
}
const fsSparks = [];
function fsPuff(pos, color, n = 10) {
  const g = new THREE.BufferGeometry(), a = new Float32Array(n * 3), v = [];
  for (let i = 0; i < n; i++) { a.set([pos.x, pos.y, pos.z], i * 3); v.push(new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.5 + Math.random() * 0.7, (Math.random() - 0.5) * 0.5)); }
  g.setAttribute("position", new THREE.BufferAttribute(a, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ map: moteMat.map, color, size: 0.05, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
  p.frustumCulled = false; hmGroup.add(p); fsSparks.push({ p, v, t0: performance.now() / 1000 });
}
const fsFireAt = (F, i) => HEARTH_AT.clone().addScaledVector(F.f, -0.15 + i * 0.05).addScaledVector(F.r, (i - 1) * 0.12).setY(0.3 + i * 0.04);
const fsLipAt = F => HEARTH_AT.clone().addScaledVector(F.f, -0.62).addScaledVector(F.r, 0.3).setY(F.S.floor + 0.2); // the side the seated figure does not cover
const fsStackAt = F => { const p = hmAt(F, 0.85, 0.58, 0); p.y = F.S.floor; return p; }; // far enough out that a wide screen does not cut it at the bottom edge
const fsHere = () => !!hm && hm.step === "motes";
/* Lay the top stick of the stack on the fire: the sit's length goes up a step. The first stick starts the choosing. */
function fsLay() {
  if (!fsHere()) return;
  const F = hmFrame(seatViewAt); if (!F) return;
  if (!hm.fs) hm.fs = { step: "choose", sticks: 0, eid: null, quiet: 0, t0: 0, act: 0, flies: [] };
  const fs = hm.fs; if (fs.step !== "choose" || fs.sticks >= FS_LOGS.length) return;
  const log = fsLogs[FS_LOGS.length - 1 - fs.sticks]; fs.sticks++;
  const from = log.getWorldPosition(new THREE.Vector3()), stick = new THREE.Mesh(log.geometry, [fsGrain, fsBark]);
  stick.position.copy(from); stick.rotation.y = F.S.yaw; fsLaid.add(stick); log.visible = false;
  fs.flies.push({ m: stick, from, to: fsFireAt(F, fs.sticks - 1), t0: performance.now() / 1000, yaw: F.S.yaw + (fs.sticks - 2) * 0.9 });
  fs.quiet = performance.now();
  if (hm.held) fsChoose(hm.held); // an ember already in your hands is the one you sit with
  if (!ls.get(FS_FIRST) || EMBER_DEMO) { ls.set(FS_FIRST, 1); setTimeout(() => hmSay("focus", "Sit with it. The fire does the work while you are away."), 900); }
  hmHud();
}
/* While choosing, touching an ember sends it to rest on the hearth's lip (touched again, it comes back to the others). */
function fsChoose(m) {
  const fs = hm && hm.fs; if (!fs || fs.step !== "choose") return;
  if (m.state === "lip") { m.state = "slot"; fs.eid = null; }
  else { for (const o of hm.motes) if (o.state === "lip" || o.state === "held") o.state = "slot"; m.state = "lip"; fs.eid = m.eid; hm.held = null; hm.press = null; }
  fs.quiet = performance.now(); hmHud();
}
/* The sit settles in: the others go home, the view comes low, the room's light drops to the fire. */
function fsSettle() {
  const fs = hm.fs; fs.step = "sit"; fs.t0 = Date.now(); fs.act = performance.now() / 1000 + (FS_FAST ? 2 : 20);
  for (const m of hm.motes) if (m.state !== "lip" && m.state !== "lit" && m.state !== "gone") m.state = "sink";
  if (hm.L && !hm.L.lit) { hmGroup.remove(hm.L.g); hm.L = null; }
  if (hollow) hollow.handles.hearth.room = 0.42;
  hmHud();
}
/* Back early: the fire has banked to coals, and asks. */
function fsBank() {
  const fs = hm && hm.fs; if (!fs || fs.step !== "sit") return;
  if (focusOnReturn(fs, Date.now(), FS_MIN) === "done") { fsDone(); return; }
  fs.step = "banked"; if (hollow) hollow.handles.hearth.bank = 1;
  caption("Stand up?"); hmHud();
}
function fsStay() { const fs = hm && hm.fs; if (!fs || fs.step !== "banked") return; fs.step = "sit"; if (hollow) hollow.handles.hearth.bank = 0; captionOut(); hmHud(); }
/* The sit ran its length: the ember rises one state and comes home, a mote drops into the satchel, the room is a little lighter. */
async function fsDone() {
  const fs = hm && hm.fs; if (!fs || (fs.step !== "sit" && fs.step !== "banked")) return;
  fs.step = "done"; fs.doneT = performance.now() / 1000; fsRoom = 1.12;
  if (hollow) { hollow.handles.hearth.bank = 0; hollow.handles.hearth.room = fsRoom; }
  const m = fs.eid && hm.motes.find(x => x.eid === fs.eid), F = hmFrame(seatViewAt);
  if (F) fsPuff(m ? m.pos.clone() : HEARTH_AT.clone().setY(0.5), FS_SAT, 16);
  fs.mote = { t0: performance.now() / 1000, from: (m ? m.pos : HEARTH_AT.clone().setY(0.5)).clone(), g: new THREE.Sprite(hmGlowMat(FS_SAT, 0.9)) }; fs.mote.g.scale.setScalar(0.09); hmGroup.add(fs.mote.g);
  hmSay("done", m ? "It warmed while you were away." : "The fire kept you company.");
  if (m && !m.e.risen) {
    m.e = { ...m.e, risen: true };
    if (isDemoEmber(m.eid)) demoPouch[m.eid] = { ...demoPouch[m.eid], risen: true };
    else if (!storeDown) await op(pouchPath(), "update", { embers: { [m.eid]: { risen: true } } });
  }
  setTimeout(() => { if (!hm || hm.fs !== fs) return; // then everything comes back: the risen one first, out of the satchel
    for (const o of hm.motes) if (o.state === "lip") o.state = "sink";
    setTimeout(() => { if (!hm || hm.fs !== fs) return; for (const o of hm.motes.filter(x => x.state === "gone")) hmDrop(o); hm.motes = hm.motes.filter(x => x.state !== "gone"); hm.riseNext = performance.now() / 1000 + 0.6; hmSync(); fsAgain(); }, 1600);
  }, 2600);
  hmHud();
}
/* After a sit, the stack waits again (the fire takes what was laid, slowly). */
function fsAgain() { if (!hm) return; hm.fs = null; for (const l of fsLogs) l.visible = true; hmHud(); }
/* Getting up: whatever the sit had reached, nothing is written but a rise already made. */
function fsEnd(h) {
  if (h.fs && h.fs.mote) hmGroup.remove(h.fs.mote.g);
  h.fs = null; for (const l of fsLogs) l.visible = true; fsStack.visible = false;
  if (hollow) { hollow.handles.hearth.bank = 0; hollow.handles.hearth.room = fsRoom; }
}
/* Touch during the moment: the stack lays a stick; during the sit any touch is coming back (the fire banks). */
function fsTap(cx, cy) {
  const fs = hm.fs;
  if (fs && fs.step === "sit") { fsBank(); return true; }
  if (fs && (fs.step === "banked" || fs.step === "done")) return true; // its buttons answer, the room holds still
  if (!fsHere() || !fsStack.visible || (fs && fs.sticks >= FS_LOGS.length)) return false;
  const p = fsStack.getWorldPosition(new THREE.Vector3()).setY(fsStack.position.y + 0.12).project(camera);
  return Math.hypot((p.x + 1) / 2 * innerWidth - cx, (1 - p.y) / 2 * innerHeight - cy) < 56 ? (fsLay(), true) : false;
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && hm && hm.fs && hm.fs.step === "sit") fsBank(); });
/* Once a frame, inside the moment's own: the stack, sticks in flight, the settling, the spirit's small acts, the clock. */
function fsTick(t, dt, h, F) {
  const fs = h.fs, live = !!hm && h === hm;
  fsStack.visible = live && hm.step === "motes" && !(fs && fs.step !== "choose" && fs.step !== "done");
  if (fsStack.visible) { fsStack.position.copy(fsStackAt(F)); fsStack.rotation.y = F.S.yaw; fsStackLight.intensity = 0.35 + 0.1 * Math.sin(t * 2.3); }
  const sitting = !!fs && (fs.step === "sit" || fs.step === "banked");
  fsK += ((sitting ? 1 : 0) - fsK) * Math.min(1, dt * 0.6);
  for (const s of fsSparks.slice()) { const el = t - s.t0, a = s.p.geometry.attributes.position; for (let i = 0; i < s.v.length; i++) { a.array[i * 3] += s.v[i].x * dt; a.array[i * 3 + 1] += (s.v[i].y - el * 0.6) * dt; a.array[i * 3 + 2] += s.v[i].z * dt; } a.needsUpdate = true; s.p.material.opacity = Math.max(0, 0.9 - el * 0.6); if (el > 1.6) { hmGroup.remove(s.p); s.p.geometry.dispose(); fsSparks.splice(fsSparks.indexOf(s), 1); } }
  // the spirit: a warm presence at the fire with two small eyes, there while you sit
  const sp = fsSpirit.userData; sp.k += ((sitting && live ? 1 : 0) - sp.k) * Math.min(1, dt * 0.8);
  fsSpirit.visible = sp.k > 0.01; fsSpirit.position.copy(HEARTH_AT).addScaledVector(F.f, -0.2).setY(0.72 + Math.sin(t * 0.9) * 0.02);
  sp.glow.material.opacity = 0.22 * sp.k * (fs && fs.step === "banked" ? 0.5 : 1); const blink = (t % 5.3) < 0.12 ? 0.1 : 1;
  fsSpirit.rotation.y = F.S.yaw + Math.PI; for (const e of sp.eyes) e.material.opacity = 0.9 * sp.k * blink; // its eyes on you
  if (!fs) return;
  // sticks in flight: an arc from the stack onto the fire, a puff of sparks as each lands
  for (const fl of fs.flies) { const k = Math.min(1, (t - fl.t0) / 1.1), e = k * k * (3 - 2 * k); fl.m.position.lerpVectors(fl.from, fl.to, e); fl.m.position.y += Math.sin(k * Math.PI) * 0.45; fl.m.rotation.y = F.S.yaw + (fl.yaw - F.S.yaw) * e; if (k >= 1 && !fl.landed) { fl.landed = true; fsPuff(fl.to, 0xffb050, 12); } }
  if (fs.step === "choose" && performance.now() - fs.quiet > FOCUS_SETTLE_MS && fs.flies.every(f => f.landed)) fsSettle();
  if (fs.step === "sit") {
    if (focusProgress(fs, Date.now(), FS_MIN).done) fsDone();
    else if (t > fs.act) { // the spirit tends the fire: a stick turned, or a coal raked in with a breath of sparks
      fs.act = t + (FS_FAST ? 3 : 18 + Math.random() * 20);
      const st = fs.flies[Math.floor(Math.random() * fs.flies.length)];
      if (st && Math.random() < 0.55) st.turn = { t0: t, by: (Math.random() - 0.5) * 0.9, from: st.m.rotation.y }; else fsPuff(HEARTH_AT.clone().addScaledVector(F.f, -0.35).setY(0.22), 0xff9a40, 8);
    }
  }
  for (const fl of fs.flies) if (fl.turn) { const k = Math.min(1, (t - fl.turn.t0) / 1.4); fl.m.rotation.y = fl.turn.from + fl.turn.by * k * k * (3 - 2 * k); fl.m.rotation.x = Math.sin(k * Math.PI) * 0.15; if (k >= 1) fl.turn = null; }
  // the mote of a finished sit: from the ember down into the satchel
  if (fs.mote) { const k = Math.min(1, (t - fs.mote.t0 - 0.8) / 1.6); if (k > 0) { const e = k * k; fs.mote.g.position.lerpVectors(fs.mote.from, hmPouchAt(F).setY(hmPouchAt(F).y + 0.1), e); fs.mote.g.position.y += Math.sin(k * Math.PI) * 0.1; fs.mote.g.scale.setScalar(0.09 * (1 - 0.75 * e)); } else fs.mote.g.position.copy(fs.mote.from); if (k >= 1) { hmGroup.remove(fs.mote.g); fs.mote = null; } }
}
/* The laid sticks burn down slowly once nobody is laying: they sink into the fire and go. */
function fsBurn(dt) { for (const s of fsLaid.children.slice()) { if (hm && hm.fs && hm.fs.flies.some(f => f.m === s)) continue; s.scale.multiplyScalar(Math.pow(0.9, dt)); s.position.y -= dt * 0.004; if (s.scale.x < 0.35) fsLaid.remove(s); } }
const ASK_TEXT = { revisit: "asked to revisit an agreement", broken: "named a break in an agreement", retire: "asked to retire an agreement", compost: "asked to compost an agreement" };
const YES_TEXT = { revisit: "agreed to revisit it", broken: "owned the break; the agreement is up for revisit", retire: "agreed to retire it", compost: "agreed to compost it" };
async function itemAct(id, act, payload) {
  const { items: its } = view();
  const it = its.get(id); if (!it) return;
  const upd = d => op("items/" + id, "update", d);
  switch (act) {
    case "propose": await upd({ status: "proposed", yes: { [me]: true }, history: hist("proposed the agreement", it.text) }); break;
    case "withdraw": await upd({ status: it.kind === "agreement" ? "draft" : "withdrawn", yes: {}, history: hist(it.kind === "agreement" ? "took the agreement back to draft" : "withdrew an offer") }); break;
    case "agree": await upd({ status: "agreed", yes: { [me]: true }, history: hist("said yes to the agreement", it.text) }); break;
    case "notyet": await upd({ status: "draft", yes: {}, history: hist("asked for changes to the agreement", payload) }); break;
    case "edit": await upd({ text: payload, history: hist("rewrote the agreement", payload) }); break;
    case "ask": await upd({ pending: { act: payload.act, by: me, at: now(), text: payload.text || "" }, history: hist(ASK_TEXT[payload.act], payload.text) }); break;
    case "pendingYes": { const p = it.pending; const to = { revisit: "revisit", broken: "revisit", retire: "retired", compost: "composted" }[p.act];
      await upd({ status: to, pending: null, yes: {}, history: hist(YES_TEXT[p.act]) }); break; }
    case "pendingNo": await upd({ pending: null, history: hist("said not now to " + ASK_TEXT[it.pending.act].replace(/^asked to /, "")) }); break;
    case "pendingWithdraw": await upd({ pending: null, history: hist("took back a request") }); break;
    case "receive": await upd({ status: "received", yes: { [me]: true }, history: hist("said yes to " + KINDS[it.kind].toLowerCase(), it.sealed ? "" : it.text) }); break;
    case "decline": await upd({ status: "declined", history: hist("let an offering pass") }); break;
    case "open": await upd({ opened: { [me]: true } }); return;
    case "compostOwn": await upd({ status: "composted", history: hist("composted a draft") }); break;
  }
  await touch();
}

/* ===================================================================================================
   Sheets: the writing that the room can't hold
   =================================================================================================== */
function openSheet(name, arg) {
  const g = view().g;
  // the mirror stands in the homeroom: from a room, the Look takes you home to it
  if (name === "look" && g && !isHome(g)) { markSeen(); location.href = ROOM_URL(null) + "?sheet=look"; return; }
  if (name === "spirits" && !isHome(g)) name = "spirit";
  // the hearth moment is had sitting (Wendell, 2026-10-24): every way in (the card, the Hearth button) walks you to its cushion first
  if (name === "hearth" && !seatedAtHearth()) { sitAtHearth(); return; }
  // sat by the fire, the moment is had in the room (no card); only "Something stirs" opens the pickers, in the low strip
  if (name === "hearth" && arg !== "stir") { hmBegin(); return; }
  if (name === "hearth" && sheetName !== "hearth") hd = {};
  if (name === "look" && sheetName !== "look") { lookDraft = null; mirrorPart = "shape"; }
  if (name === "checkin" && sheetName !== "checkin") walk = { feel: null, line: "", step: -1 };
  if (name === "invitations" || name === "rooms" || name === "destinations") refreshList();
  if (name === "spirit" || name === "checkin") fetchHome();
  if (sheetName === "look" && name !== "look") { lookDraft = null; ensureMyBody().catch(() => {}); }
  if (name === "invite" && g && !isHome(g) && isMember(g) && members(g).length >= 2 && arg !== "list") { openPaper("write", { room: gardenId }); return; } // a scroll, not a form (Still B)
  if (name === "hope") caption(MINUTE_CAPTIONS.hope);
  sheetName = name; sheetArg = arg; setMirror(name === "look" || name === "hope"); renderSheet();
}
function closeSheet() {
  const wasLook = sheetName === "look" || sheetName === "hope";
  sheetName = null; sheetArg = null; walk = null; $("#sheet").hidden = true; $("#scrim").hidden = true; document.body.classList.remove("quiethud"); document.body.classList.toggle("seatedmoment", !!hm);
  if (wasLook) { lookDraft = null; setMirror(false); ensureMyBody().catch(() => {}); } // an unsaved look goes back to the saved one
  refreshHud();
}
// Setup is closeable now: there is always the homeroom to stand in (br-home-is-a-room).
$("#scrim").addEventListener("click", () => { if (sheetName !== "setup" || garden) closeSheet(); });
function renderSheet() {
  if (!sheetName) return;
  const V = view(); const g = V.g;
  const close = `<button class="quiet close" type="button" data-close>Close</button>`;
  const seatedClose = `<div class="row close"><button class="quiet" type="button" data-close>Close</button><button class="quiet" type="button" data-act="stand">Stand up</button></div>`;
  let h = "";
  const keep = {}; $("#sheetInner").querySelectorAll("textarea[id], input[id]").forEach(el => { if (el.type !== "checkbox") keep[el.id] = el.value; });
  switch (sheetName) {
    case "setup": h = `<form class="stack" id="setupForm"><h2>Plant a spark for one relationship</h2>
      <p class="muted">Pick the one relationship you want to work on. Until the other person joins, you tend a spark made of what you carry toward them. When they join, it becomes your Between.</p>
      <label for="sWho">Who is it?<input id="sWho" required maxlength="80" placeholder="Their name, or how you think of them"></label>
      <label for="sKind">What kind of relationship is it, or could it be?<select id="sKind">${REL_KINDS.map(k => `<option>${k}</option>`).join("")}</select></label>
      <label for="sHope">What do you hope for between you?<textarea id="sHope" maxlength="1000" placeholder="A sentence or two is enough"></textarea></label>
      <label for="sStyle">How the room looks<select id="sStyle">${ROOM_STYLES.map(st => `<option value="${st.id}">${esc(st.name)}</option>`).join("")}</select></label>
      <p class="small muted">Only the two of you read these. Someone you invite sees who the spark is toward and what kind it is, never what you hope for.</p>
      <div class="row"><button type="submit">Plant the spark</button><button class="quiet" type="button" data-close>Look around first</button></div></form>`; break;
    case "offer": h = `<form class="stack" id="offerForm"><h2>${g.phase === "spark" ? "Tend the spark" : "Offer something"}</h2>
      <label for="oKind">What are you bringing?<select id="oKind">${Object.entries(KINDS).map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select></label>
      <label for="oText">In your words<textarea id="oText" maxlength="2000" placeholder="A line, a gesture, a drawing described in words. Small counts as much as long."></textarea></label>
      <p class="small muted" id="oHint">${g.phase === "spark" ? "While it is a spark, what you bring feeds it straight away." : "It waits on a stone where you stand. It changes the Between only when the other person walks up and says yes. A worked-through charge arrives sealed."}</p>
      <div class="row"><button type="submit">${g.phase === "spark" ? "Give it to the spark" : "Set it down"}</button>${close}</div></form>`; break;
    case "agreement": h = `<form class="stack" id="agForm"><h2>Plant an agreement</h2>
      <p class="muted small">It goes in the ground where you stand, as a draft. Propose it when it reads right; it flowers once you both say yes.</p>
      <label for="aText">The agreement<textarea id="aText" maxlength="2000" placeholder="What the two of you will do, or won't"></textarea></label>
      <div class="row"><button type="submit">Plant it</button>${close}</div></form>`; break;
    case "rewrite": { const it = V.items.get(sheetArg); if (!it) { closeSheet(); return; }
      h = `<form class="stack" id="rwForm"><h2>Rewrite the agreement</h2><label for="rwText">The words<textarea id="rwText" maxlength="2000">${esc(it.text)}</textarea></label>
      <div class="row"><button type="submit">Save the words</button>${close}</div></form>`; break; }
    case "spirit": h = (isHome(g) ? "" : bringSheet()) + `<form class="stack" id="spiritForm"><h${isHome(g) ? 2 : 3}>${isHome(g) ? "A new spirit for your homeroom" : "A new spirit for this room only"}</h${isHome(g) ? 2 : 3}>
      <p class="muted small">${isHome(g) ? "It lives here with you. When you go into a room, you can bring it along." : "It lives in this room and stays yours. The other person can meet it and greet it; only you can call it or send it home."}</p>
      <label for="spName">Its name<input id="spName" maxlength="60" required placeholder="What you call it"></label>
      <label for="spEl">Element<select id="spEl">${Object.keys(ELEMENTS).map(e => `<option>${e}</option>`).join("")}</select></label>
      <label for="spForm">Its form<select id="spForm">${Object.entries(FORMS).map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select></label>
      <label for="spNote">What it brings to the garden<textarea id="spNote" maxlength="600"></textarea></label>
      <div class="row"><button type="submit">${isHome(g) ? "Welcome it home" : "Bring it in"}</button>${close}</div></form>`; break;
    case "spirits": if (!g || !isHome(g)) { closeSheet(); return; } h = spiritsSheet() + close; break;
    case "daemon": { const mine = new Set([...V.daemons.values()].filter(d => d.owner === me).map(d => d.which));
      h = `<div class="stack"><h2>Bring a daemon</h2>
      <p class="muted small">Your daemons are yours. They walk the garden and meet what is here; the other person can greet them and cannot command them. Bring one when it is part of what you are working on.</p>
      <div class="choice">${Object.entries(DAEMONS).map(([k, [n, d]]) => `<button type="button" data-act="bringDaemon" data-id="${k}" ${mine.has(k) ? "disabled" : ""}><b>${n}</b>${mine.has(k) ? "here already" : esc(d)}</button>`).join("")}</div>
      ${close}</div>`; break; }
    case "pictures": h = picturesSheet(g, V) + close; break;
    case "hearth":
      if (!seatedAtHearth()) { closeSheet(); return; }
      // the store down (a preview with no store): the moment's words alone, since no ember can be kept
      if (!g && storeDown) { h = `<div class="stack"><h2>Something stirs</h2><p class="muted">When something stirs you, sit with it. What's left is a little glowing ember you keep.</p><p class="small muted">The store did not answer, so no ember can be kept here now.</p></div>` + seatedClose; break; }
      if (!g || !hearthOpen()) { closeSheet(); return; }
      h = stirSheet(g, V) + seatedClose; break;
    case "away": h = awaySheet(g, V) + close; break;
    case "menu": h = menuSheet(g, V); break;
    case "shot": h = shotSheet(); break;
    case "ending": h = endingSheet(g, V) + close; break;
    case "welcome": { const u = g && g.joinRequest && g.joinRequest.uid; if (!u || g.phase !== "spark") { closeSheet(); return; }
      h = `<div class="stack"><h2>Welcome ${esc(nameOf(u, g))} in</h2>
      <p>A new Between begins for the two of you, and its history starts now. What you tended alone stays with you, out of the shared garden.</p>
      <p class="muted small">Your spark can walk beside the Between as your own spirit, or you can let it compost: what it carried is worked, and nothing of it is shown to them.</p>
      <div class="row"><button type="button" data-act="welcomeKeep">Keep it as my own spirit</button><button class="ghost" type="button" data-act="welcomeCompost">Let it compost</button>${close}</div></div>`; break; }
    case "rooms": h = roomsSheet() + close; break;
    case "destinations": h = destinationsSheet() + close; break;
    case "hope": if (!g || !isHome(g)) { closeSheet(); return; } h = hopeSheet(); break;
    case "look": if (!g || !isHome(g)) { closeSheet(); return; } h = lookSheet(); break;
    case "goals": h = goalsSheet() + close; break;
    case "checkin": if (!walk) walk = { feel: null, line: "", step: -1 }; h = checkinSheet(); break;
    case "invitations": h = invitationsSheet() + close; break;
    case "style": if (!g || !isMember(g) || g.phase === "closed") { closeSheet(); return; } h = styleSheet(g) + close; break;
    case "invite": if (!g || isHome(g) || !isMember(g)) { closeSheet(); return; } h = inviteSheet(g) + close; break;
    case "spellbook": if (!g || !isMember(g)) { closeSheet(); return; } h = spellSheet(g) + close; break;
    case "quiet": h = `<div class="stack"><h2>A silent exit</h2>
      <p>If this relationship is hurting you, you can leave now. The other person sees only that the garden has closed, the same as any closing. Nothing says who left or why.</p>
      <p>If you are in danger, call your local emergency number. In the US, the National Domestic Violence Hotline answers day and night at <b>1-800-799-7233</b>, or text <b>START</b> to <b>88788</b>. Anywhere else, <a href="https://findahelpline.com" target="_blank" rel="noopener">findahelpline.com</a> lists free, confidential lines by country.</p>
      <div class="row">${g && isMember(g) && g.phase !== "closed" ? `<button type="button" data-act="quietLeave">Leave the garden now</button>` : ""}<button class="quiet" type="button" data-close>Back to the garden</button></div></div>`; break;
  }
  const inner = $("#sheetInner");
  if (inner._h === h && !$("#sheet").hidden) return; // nothing changed: keep the open sheet as it is
  inner._h = h; inner.innerHTML = h;
  for (const [id, v] of Object.entries(keep)) { const el = document.getElementById(id); if (el && !el.value) el.value = v; }
  // the mirror and the check-in keep the room in view: no scrim, a darker strip, the scene showing above it
  const sh = $("#sheet"); sh.classList.toggle("mirror", sheetName === "look" || sheetName === "hope"); sh.classList.toggle("walk", sheetName === "checkin");
  /* Sat at the hearth, the moment itself is in the room (hmBegin); "Something stirs" opens its pickers as a low, see-through
     strip with no scrim, so the fire, the crescent and the seated figure stay in view (class "seated", garden.css). */
  const seated = sheetName === "hearth" && seatedAtHearth();
  sh.classList.toggle("seated", seated);
  sh.classList.toggle("dark", seated || ["look", "checkin", "spirits", "hope"].includes(sheetName));
  sh.hidden = false; $("#scrim").hidden = seated || sheetName === "look" || sheetName === "checkin" || sheetName === "hope";
  document.body.classList.toggle("quiethud", sheetName === "checkin");
  document.body.classList.toggle("seatedmoment", seated || !!hm); // the room's own buttons step aside; the strip carries Stand up // the room's own buttons step aside while you walk it
  if (sheetName !== "look") readIn(inner); // each choice in the mirror redraws the strip; its words stay put
  const first = $("#sheetInner").querySelector("input, textarea, select"); if (first && !keep[first.id] && sheetName !== "checkin") setTimeout(() => first.focus({ preventScroll: true }), 50);
}
/* ---------- the mirror's one question, in the first minute (Still C 0:35): kept with the private goals (br-goals-private) ---------- */
function hopeSheet() {
  return `<form class="stack hope" id="hopeForm"><p class="small">You see yourself as you made yourself.</p>
    <p class="hask"><label for="hText">${esc(HOPE_ASK)}</label></p><textarea id="hText" class="hand" maxlength="280" placeholder="In your words"></textarea>
    <p class="small muted">Only you will ever see this.</p>
    <div class="row"><button type="submit">Keep it</button><button class="quiet" type="button" data-act="hopeSkip">${mstate().skipped.hope ? "Not now" : "Skip it"}</button></div></form>`;
}
document.addEventListener("submit", ev => {
  if (ev.target.id !== "hopeForm") return;
  ev.preventDefault(); ev.stopImmediatePropagation();
  const text = ($("#hText").value || "").trim().slice(0, 280);
  if (!text) { toast("Write a few words, or skip it for now."); return; }
  const at = now();
  closeSheet();
  minuteAct("hope", "done", { goals: { ["g" + hkey()]: { text, room: null, at } } });
}, true);

/* ---------- the homeroom's sheets, and the room's Style, Invite and Spellbook (rooms, part 2) ---------- */
const roomName = r => r.personName || r.who || "someone";
function roomsSheet() {
  const rooms = (list && list.gardens) || [];
  const open = rooms.filter(r => r.phase !== "closed"), closed = rooms.filter(r => r.phase === "closed");
  const row = r => {
    const m = suggest({ rooms: [r] }).find(x => x.lane !== "yourself");
    const where = r.phase === "spark" ? `A spark, waiting for ${esc(r.who || "them")} to join` : `You and ${esc(roomName(r))}`;
    return `<div class="roomrow"><div><b>${esc(roomName(r))}</b><span class="small muted">${where} · ${esc(r.relKind || r.kind || "")} · ${esc(styleOf(r.style).name)}</span>
      ${m ? `<span class="small">Next: ${esc(m.title)}</span>` : `<span class="small muted">Nothing waits here.</span>`}</div>
      <div class="row"><button type="button" data-act="goRoom" data-id="${esc(r.id)}">Go in</button>${r.phase === "spark" ? `<button class="ghost" type="button" data-act="sparkAgain" data-id="${esc(r.id)}">Send the link again</button>` : ""}</div></div>`;
  };
  return `<div class="stack"><h2>Your rooms</h2>
    <p class="small muted">One room for each relationship. Each starts as a spark you tend alone, and becomes your Between once they join.</p>
    ${open.length ? open.map(row).join("") : `<p class="muted">No rooms yet. Make one for someone you want to work on things with.</p>`}
    <div class="row"><button type="button" data-open="setup">Make a new room</button></div>
    ${closed.length ? `<details><summary>Closed rooms</summary>${closed.map(row).join("")}</details>` : ""}</div>`;
}
function destinationsSheet() {
  const rooms = (list && list.gardens) || [];
  const shared = rooms.filter(r => r.phase !== "closed");
  const sharedRows = shared.length
    ? shared.map(r => `<div class="roomrow"><div><b>${esc(roomName(r))}</b><span class="small muted">${r.phase === "spark" ? "A spark you are tending" : "Your shared Between"}</span></div><button type="button" data-act="goRoom" data-id="${esc(r.id)}">Enter</button></div>`).join("")
    : `<p class="small muted">No shared room is open yet. You can make one from Rooms.</p>`;
  // the room an invite link names: she is not in it yet, so it is not among list.gardens, and the doorway must still
  // offer it, first (an invite opened her nook but the doorway only listed her own rooms, 2026-10-28)
  const invited = portalTo && !shared.some(r => r.id === portalTo.id)
    ? `<div class="roomrow"><div><b>${portalTo.name ? esc(portalTo.name) + " invited you" : "The room you were invited to"}</b><span class="small muted">Walk through to join them there.</span></div><button type="button" data-act="through">Enter</button></div>`
    : "";
  return `<div class="stack"><h2>The doorway</h2>
    <p class="muted">Choose where to go. You always return to your Nook.</p>
    ${invited}
    <div class="roomrow"><div><b>Triangle Workshop</b><span class="small muted">Private practice · make a triangle visible and choose a clean next move.</span></div><button type="button" data-act="goDojo">Enter</button></div>
    <div class="stack"><h3>Shared rooms</h3>${sharedRows}<div class="row"><button class="quiet" type="button" data-open="rooms">Manage rooms</button></div></div>
  </div>`;
}
/* The mirror's strip: the parts as tabs, the chosen part's choices as round swatches; every tap re-dresses you. */
const keptLook = () => myHome.look || (list && list.home && list.home.look) || null;
const SHAPE_SVG = { a: "M9 3h6v26H9z", b: "M4 3h16l-4 26H8z", c: "M9 3h6c0 5 5 9 5 13s-4 8-4 13H8c0-5-4-9-4-13s5-8 5-13z" };
const BUILD_RX = { slender: 3.5, average: 5, broad: 6.5, round: 8 };
function chipGlyph(k, id) {
  const svg = d => `<svg viewBox="0 0 24 32" width="24" height="32" aria-hidden="true">${d}</svg>`;
  if (k === "shape") return svg(`<path d="${SHAPE_SVG[id]}" fill="#e8dccb" opacity=".85"/>`);
  if (k === "build") return svg(`<ellipse cx="12" cy="16" rx="${BUILD_RX[id]}" ry="13" fill="#e8dccb" opacity=".85"/>`);
  return "";
}
function lookSheet() {
  if (!lookDraft) lookDraft = parseLook(lookOf(me) || "") || { ...DEFAULT_LOOK };
  const k = mirrorPart, t = lookText(lookDraft), unsaved = t !== keptLook();
  const chip = o => { const on = lookDraft[k] === o.id;
    return `<button type="button" class="mchip${on ? " on" : ""}" aria-pressed="${on}" data-act="lookPick" data-id="${k}:${o.id}"><i${o.swatch ? ` style="background:${o.swatch}"` : ""}>${o.swatch ? "" : chipGlyph(k, o.id)}</i><span>${esc(o.label)}</span></button>`; };
  return `<div class="mpanel" aria-label="The mirror. Choose how you look; your figure changes as you choose.">
    <div class="mtabs" role="tablist">${MIRROR_PARTS.map(([id, l]) => `<button type="button" role="tab" aria-selected="${id === k}" class="${id === k ? "on" : ""}" data-act="lookPart" data-id="${id}">${esc(l)}</button>`).join("")}</div>
    <div class="mchips">${optionsOf(k).map(chip).join("")}</div>
    ${k === "style" || k === "colour" ? `<p class="mnote">Hair shows in Chapter 1, not on this figure yet: <a href="${CHAPTER1_LOOK(t)}" target="_blank" rel="noopener">take this look to Chapter 1</a>.</p>` : ""}
    <div class="mbar"><span class="mstate">${unsaved ? "Not saved yet" : "This is how your rooms see you"}</span>
      <button type="button" data-act="lookKeep" ${unsaved ? "" : "disabled"}>Save this look</button><button class="ghost" type="button" data-act="lookRandom">Choose for me</button><button class="quiet" type="button" data-close>Leave</button></div></div>`;
}
const goalsList = () => Object.entries(myHome.goals || {}).filter(([, x]) => x && x.text).sort((a, b) => (b[1].at || 0) - (a[1].at || 0));
function goalsSheet() {
  const rooms = ((list && list.gardens) || []).filter(r => r.phase !== "closed");
  const gl = goalsList();
  return `<form class="stack" id="goalForm"><h2>What you hope for</h2>
    <p class="small muted">Your goals for your relationships. Only you see them, here in your homeroom.</p>
    ${gl.length ? `<ul class="log">${gl.map(([id, x]) => { const r = rooms.find(q => q.id === x.room); return `<li>${esc(x.text)}${r ? ` <span class="muted small">· with ${esc(roomName(r))}</span>` : ""} <button class="quiet" type="button" data-act="goalDrop" data-id="${esc(id)}">Let it go</button></li>`; }).join("")}</ul>` : ""}
    <label for="gText">A goal<textarea id="gText" maxlength="280" placeholder="What you want more of, or less of"></textarea></label>
    <label for="gRoom">For one room, or all of them<select id="gRoom"><option value="">All my relationships</option>${rooms.map(r => `<option value="${esc(r.id)}">${esc(roomName(r))}</option>`).join("")}</select></label>
    <div class="row"><button type="submit">Keep this goal</button></div></form>`;
}
const FEEL_ORDER = ["wood", "fire", "earth", "metal", "water"];
const cap = w => w ? w[0].toUpperCase() + w.slice(1) : "";
/* The check-in walk (part 4): choose what is here, then the seven steps of the W.A.V.E., one to a screen. Breathing out at
   the last step saves the check-in and leaves an ember, which can feed one of your spirits now or wait for later.
   `walk.step` is -1 while choosing, 0 to 6 on the steps, 7 once the ember is made. */
let walk = null;
function checkinSheet() {
  const w = walk;
  if (w.step < 0) {
    const past = Object.values(myHome.checkins || {}).filter(Boolean).sort((a, b) => b.at - a.at).slice(0, 5);
    return `<form class="stack" id="checkForm"><h2>Check in with yourself</h2>
      <p class="small muted">Before anyone else: what is here? Only you see this.</p>
      <div class="feels">${FEEL_ORDER.map(f => `<button type="button" class="${w.feel === f ? "on" : ""}" aria-pressed="${w.feel === f}" data-act="checkFeel" data-id="${f}"><span class="ember" style="--c:${cssHue(elHex(f))};--s:${w.feel === f ? 30 : 22}px"></span>${cap(FEELS[f])}</button>`).join("")}</div>
      <label for="cLine">One line, if you like<input id="cLine" maxlength="280" placeholder="What it is about" value="${esc(w.line)}"></label>
      <div class="row"><button type="submit" ${w.feel ? "" : "disabled"}>Walk through it</button><button class="quiet" type="button" data-close>Not now</button></div>
      ${past.length ? `<details><summary>Your last check-ins</summary><ul class="log">${past.map(c => `<li>${esc(c.feel ? FEELS[c.feel] : "")}${c.line ? `: <i>${esc(c.line)}</i>` : ""} <span class="muted small">· ${fmt(c.at)}</span></li>`).join("")}</ul></details>` : ""}</form>`;
  }
  const c = cssHue(elHex(w.feel)), head = `<span class="eyebrow">${esc(cap(FEELS[w.feel]))}${w.line ? " · " + esc(w.line) : ""}</span>`;
  if (w.step <= 6) {
    const st = WAVE_STEPS[w.step];
    return `<div class="stack wave" style="--c:${c}">${head}
      <h2>${esc(st.name)}</h2><p class="wline">${esc(st.line)}</p>
      <div class="wdots" role="img" aria-label="Step ${w.step + 1} of seven">${WAVE_STEPS.map((x, i) => `<i class="${i < w.step ? "on" : i === w.step ? "now" : ""}"></i>`).join("")}</div>
      <div class="row"><button class="ghost" type="button" data-act="waveBack">Back</button><button type="button" data-act="waveNext">${w.step === 6 ? "Breathe out" : "Next"}</button><button class="quiet" type="button" data-close>Stop</button></div></div>`;
  }
  const sp = feedable(), g = view().g, room = g && !isHome(g) && isMember(g) && g.phase !== "closed";
  const given = w.given;
  return `<div class="stack wave" style="--c:${c}">${head}
    <div class="emberbig"><span class="ember" style="--c:${c};--s:58px"></span></div>
    <h2>${given ? esc(given) + " took your ember" : "An ember of " + esc(FEELS[w.feel])}</h2>
    ${given ? `<p class="small muted">Your check-in is kept in your homeroom.</p><div class="row"><button type="button" data-close>Back to the room</button></div>`
    : `<p class="small muted">What you walked through left this ember. Give it to one of your spirits, and it feeds them. An ember of a spirit's own element feeds it twice over.</p>
    ${sp.length ? `<div class="choice">${sp.map(x => spiritBtn(x, w.feel)).join("")}</div>` : `<p class="small">None of your spirits is with you. ${isHome(g) ? "Call one up from the caves under Spirits, or keep the ember for later." : "Bring one in from your homeroom, or keep the ember for later."}</p>`}
    <div class="row"><button class="ghost" type="button" data-act="emberKeep">Keep it for later</button>${room ? `<button class="ghost" type="button" data-act="emberStone">Leave it on a stone for them</button>` : ""}</div>`}</div>`;
}
/* ---------- spirits of the homeroom (part 4): they live there, walk there, and come with you into a room ---------- */
const caveStore = () => { try { return window.__oagSpiritStore || null; } catch { return null; } };
let homeSnap = null, homeFetching = null; // the homeroom as read from a room: its spirits and your home doc
function fetchHome() {
  if (!homeId || storeDown || isHome(view().g)) return Promise.resolve(null);
  if (homeFetching) return homeFetching;
  homeFetching = api("/api/between/" + homeId + "/poll", { presence: null }).then(j => {
    homeSnap = j; if (j.mine && j.mine.home) setHome(j.mine.home);
    if (["spirit", "checkin"].includes(sheetName)) renderSheet();
    refresh(); return j;
  }, () => null).finally(() => { homeFetching = null; });
  return homeFetching;
}
/** Your homeroom's spirits, id -> doc, wherever you stand. */
function homeSpirits() {
  const V = view();
  const all = isHome(V.g) ? [...V.spirits] : Object.entries((homeSnap && homeSnap.spirits) || {});
  return new Map(all.filter(([, d]) => d && d.owner === me));
}
/** A write to the homeroom from wherever you stand. */
async function homeDocOp(path, kind, data) {
  if (isHome(view().g)) return op(path, kind, data);
  const j = await api("/api/between/" + homeId + "/doc", { path, op: kind, data: data ?? null });
  if (homeSnap && path.startsWith("spirits/")) { const id = path.slice(8); homeSnap.spirits = { ...(homeSnap.spirits || {}) }; if (j.doc) homeSnap.spirits[id] = j.doc; else delete homeSnap.spirits[id]; }
}
const embersWaiting = () => Object.entries(myHome.embers || {}).filter(([, e]) => e && !e.given && FEELS[e.feel]).sort((a, b) => a[1].at - b[1].at);
const emberDots = n => embersWaiting().slice(0, n).map(([, e]) => `<span class="ember" style="--c:${cssHue(elHex(e.feel))};--s:9px"></span>`).join("");
/** The spirits an ember can go to from here: the homeroom's (those not away visiting), and yours in this room. */
function feedable() {
  const V = view(), out = [];
  for (const [id, d] of homeSpirits()) if (!(d.away && d.away.room)) out.push({ where: "home", id, d });
  if (V.g && !isHome(V.g)) for (const [id, d] of V.spirits) if (d.owner === me) out.push({ where: "room", id, d });
  return out;
}
const careWord = d => careNow(d.care).word;
function spiritBtn(x, feel) {
  const own = feel && String(x.d.element || "").toLowerCase() === feel;
  return `<button type="button" data-act="emberGive" data-id="${x.where}:${esc(x.id)}"><b><span class="ember" style="--c:${cssHue(ELEMENTS[x.d.element] ?? 0xc9a35a)};--s:12px"></span>${esc(x.d.name)}</b>${esc(String(x.d.element || "").toLowerCase())} ${esc(FORMS[x.d.form] ? FORMS[x.d.form].toLowerCase() : "fox")} · ${esc(careWord(x.d))}${own ? " · its own element" : ""}${x.where === "home" && !isHome(view().g) ? " · at home" : ""}</button>`;
}
/** A cave spirit's element, as the Between names them. */
function elementOf(e) {
  const v = String(e || "").toLowerCase();
  const el = FEELS[v] ? v : Object.keys(FEELS).find(k => FEELS[k] === v);
  return el ? cap(el) : "Earth";
}
function spiritsSheet() {
  const hs = [...homeSpirits()], waiting = embersWaiting(), st = caveStore();
  const rooms = (list && list.gardens) || [];
  let cave = []; try { cave = st ? st.all().filter(r => r && r.id && !(r.home && hs.some(([id]) => id === r.home))) : []; } catch {}
  const row = ([id, d]) => {
    const away = d.away && d.away.room ? rooms.find(r => r.id === d.away.room) : null;
    return `<div class="spiritcard" style="--c:${cssHue(ELEMENTS[d.element] ?? 0xc9a35a)}"><span class="orb"></span><div><b>${esc(d.name)}</b>
      <span class="small muted">${esc(String(d.element || "").toLowerCase())} ${esc(FORMS[d.form] ? FORMS[d.form].toLowerCase() : "fox")} · ${esc(CARE_WORDS[careWord(d)])}${d.away && d.away.room ? ` · visiting ${esc(away ? roomName(away) : "a room")}` : ""}</span></div>
      ${d.away && d.away.room ? `<button class="quiet" type="button" data-act="spiritBack" data-id="${esc(id)}">Call it home</button>`
        : waiting.length ? `<button type="button" data-act="emberGive" data-id="home:${esc(id)}">Give an ember</button>` : ""}</div>`;
  };
  return `<div class="stack"><h2>Your spirits</h2>
    <p class="small muted">They live here in your homeroom and walk with you. Bring one along when you go into a room. A check-in leaves an ember, and an ember feeds a spirit.</p>
    ${waiting.length ? `<p class="small">Embers waiting for a spirit ${emberDots(5)}</p>` : `<div class="row"><span class="small muted">No ember waits. Checking in leaves one.</span><button class="ghost" type="button" data-open="checkin">Check in</button></div>`}
    ${hs.length ? hs.map(row).join("") : `<p class="muted">No spirit lives here yet.</p>`}
    <h3>Call one from the caves</h3>
    ${cave.length ? cave.map(r => `<div class="spiritcard" style="--c:${cssHue(ELEMENTS[elementOf(r.element)])}"><span class="orb"></span><div><b>${esc(r.name || "A spirit")}</b><span class="small muted">${esc(elementOf(r.element).toLowerCase())}${r.born && r.born.where ? " · met in " + esc(r.born.where) : ""}</span></div>
      <button type="button" data-act="caveCall" data-id="${esc(r.id)}">Call it home</button></div>`).join("")
      : `<p class="small muted">${st ? "Spirits you meet in the caves can come up and live here. None are waiting." : "The caves did not answer from here."} <a href="/ontology-game/cave/">Go down to the caves</a></p>`}
    <div class="row"><button class="ghost" type="button" data-open="spirit">A new spirit</button></div></div>`;
}
/** In a room, Bring a spirit starts with your homeroom's spirits. */
function bringSheet() {
  const hs = [...homeSpirits()], V = view();
  const here = new Set([...V.spirits.values()].filter(d => d.owner === me && d.homeSpirit).map(d => d.homeSpirit));
  const rows = hs.map(([id, d]) => {
    const inHere = here.has(id), away = !inHere && d.away && d.away.room;
    return `<div class="spiritcard" style="--c:${cssHue(ELEMENTS[d.element] ?? 0xc9a35a)}"><span class="orb"></span><div><b>${esc(d.name)}</b><span class="small muted">${esc(String(d.element || "").toLowerCase())} ${esc(FORMS[d.form] ? FORMS[d.form].toLowerCase() : "fox")} · ${esc(careWord(d))}${away ? " · visiting another room" : ""}</span></div>
      ${inHere ? `<span class="small muted">Here with you</span>` : away ? "" : `<button type="button" data-act="bringHome" data-id="${esc(id)}">Bring it in</button>`}</div>`;
  });
  return `<div class="stack"><h2>Bring a spirit</h2>
    <p class="muted small">Your spirits from your homeroom. One you bring in stays yours: the other person can meet it and greet it; only you call it or send it home.</p>
    ${homeSnap || isHome(V.g) ? (rows.length ? rows.join("") : `<p class="small muted">No spirit lives in your homeroom yet. Call one up from the caves there, under Spirits.</p>`) : `<p class="small muted">Asking your homeroom…</p>`}</div>`;
}
function invitationsSheet() {
  const rooms = ((list && list.gardens) || []).filter(r => r.phase !== "closed");
  const asks = rooms.flatMap(r => (r.invitations || []).map(inv => ({ r, inv })));
  const joins = rooms.filter(r => r.joinWaiting);
  return `<div class="stack"><h2>Invitations</h2>
    ${asks.length ? asks.map(({ r, inv }) => `<div class="roomrow"><div><b>${esc(roomName(r))} asks you to come and sit</b><span class="small muted">${inv.when ? "At " + fmt(inv.when) : "Whenever you can"}${inv.note ? ` · <i>${esc(inv.note)}</i>` : ""}</span></div>
      <div class="row">${answerBtns(r.id, inv.id)}</div></div>`).join("") : `<p class="muted">No invitations wait for you.</p>`}
    ${joins.map(r => `<div class="roomrow"><div><b>Someone asked to join your spark toward ${esc(r.who || "them")}</b><span class="small muted">Go in and welcome them at the spark.</span></div><button type="button" data-act="goRoom" data-id="${esc(r.id)}">Go in</button></div>`).join("")}
    <p class="small muted">To invite someone, go into their room and use Invite. A spark's link can be sent again from Rooms.</p></div>`;
}
const answerBtns = (rid, iid) => `<button type="button" data-act="invAnswer" data-id="${esc(rid)}|${esc(iid)}|yes">Yes</button><button class="ghost" type="button" data-act="invAnswer" data-id="${esc(rid)}|${esc(iid)}|later">Another time</button><button class="quiet" type="button" data-act="invAnswer" data-id="${esc(rid)}|${esc(iid)}|no">No</button>`;
/* With two people in a room, a style change is an ask the other says yes to (his note on br-style-is-the-place,
   2026-10-23). A spark with one person, and the homeroom, change at once. */
const styleShared = g => !isHome(g) && members(g).length >= 2;
function styleSheet(g) {
  const shared = styleShared(g), ask = shared && g.styleAsk && g.styleAsk.style ? g.styleAsk : null, o = other(g);
  const askLine = !ask ? "" : ask.by === me
    ? `<div class="roomrow"><div><b>You asked for ${esc(styleOf(ask.style).name)}</b><span class="small muted">It changes when ${esc(nameOf(o, g))} says yes.</span></div><button class="quiet" type="button" data-act="styleBack">Take the ask back</button></div>`
    : `<div class="roomrow"><div><b>${esc(nameOf(ask.by, g))} asks for ${esc(styleOf(ask.style).name)}</b><span class="small muted">${esc(styleOf(ask.style).line)}</span></div><span class="row"><button type="button" data-act="styleYes">Yes, change it</button><button class="quiet" type="button" data-act="styleNo">Not now</button></span></div>`;
  return `<div class="stack"><h2>${isHome(g) ? "How your homeroom looks" : "How this room looks"}</h2>
    <p class="small muted">${isHome(g) ? "The light and weather of your own room." : shared ? "The light and weather of the place you share. It changes when you both say yes: choose one to ask " + esc(nameOf(o, g)) + "." : "The light and weather of the place. Once they join, a change waits for both of you."}</p>
    ${askLine}
    <div class="choice">${ROOM_STYLES.map(st => { const on = styleOf(g.style).id === st.id; return `<button type="button" class="${on ? "on" : ""}" aria-pressed="${on}" ${on && shared ? "disabled" : ""} data-act="setStyle" data-id="${st.id}"><b>${esc(st.name)}</b>${esc(shared && !on ? "Ask for this. " : "")}${esc(st.line)}</button>`; }).join("")}</div></div>`;
}
const ANSWER_TEXT = { yes: "said yes", later: "asked for another time", no: "said no" };
function inviteSheet(g) {
  const two = members(g).length >= 2, o = other(g);
  const invs = Object.entries(g.invitations || {}).filter(([, x]) => x && x.kind === "sit").sort((a, b) => (b[1].at || 0) - (a[1].at || 0)).slice(0, 8);
  const join = g.phase === "spark" && g.startedBy === me && myInvite;
  return `<form class="stack" id="inviteForm"><h2>${two ? "Invite " + esc(nameOf(o, g)) + " to sit" : "Invite " + esc(g.setup.who) + " into this room"}</h2>
    ${join ? `<p class="small muted">Send this room's link. They sign in to bars-engine (or make an account), ask to join at the spark, and you welcome them in.</p>
      <label for="jNote">A note to go with it<textarea id="jNote" maxlength="280" placeholder="Why you are asking, in your words"></textarea></label>
      <div class="row">${navigator.share ? `<button type="button" data-act="joinShare">Send the link</button>` : ""}<button class="${navigator.share ? "ghost" : ""}" type="button" data-act="joinCopy">Copy the link</button></div>` : ""}
    ${!two && !join ? `<p class="muted">Only the person who planted the spark sends its link.</p>` : ""}
    ${two ? `<p class="small muted">Ask them to come and sit with you on the cushions. A yes opens the spells you cast together.</p>
      <div class="row"><button type="button" data-act="writeScroll">Write a scroll</button></div>
      ${invs.length ? `<h3>Invitations here</h3><ul class="log">${invs.map(([id, x]) => `<li>${x.by === me ? "You asked them" : esc(nameOf(x.by, g)) + " asked you"} to sit${x.when ? ", " + fmt(x.when) : ""}${x.note ? `: <i>${esc(x.note)}</i>` : ""}.
        ${x.answer ? ` ${x.by === me ? esc(nameOf(o, g)) : "You"} ${ANSWER_TEXT[x.answer]}.` : x.by === me ? ` Waiting for their answer. <button class="quiet" type="button" data-act="invBack" data-id="${esc(id)}">Take it back</button>` : `<span class="row">${answerBtns(gardenId, id)}</span>`}</li>`).join("")}</ul>` : ""}` : ""}</form>`;
}
/* Spells (Ari, between-ari-formation-01): from the cushions; dual ones after a sit invitation said yes. An async-dual
   spell waits in garden.spells until the other person finishes it from their cushion. */
const sitAccepted = g => Object.values((g && g.invitations) || {}).some(x => x && x.kind === "sit" && x.answer === "yes");
const openSpell = (g, id) => Object.entries((g && g.spells) || {}).find(([, x]) => x && x.spell === id && !x.done) || null;
function spellAt(g, sp) {
  const left = sp.kind === "async-dual" ? openSpell(g, sp.id) : null;
  return { sitting: !!meState.sitting, otherSitting: othersHere().some(p => p.sitting), sitAccepted: sitAccepted(g), started: !!(left && left[1].by !== me), mineWaiting: !!(left && left[1].by === me) };
}
function spellSheet(g) {
  return `<div class="stack"><h2>Spellbook</h2>
    <p class="small muted">Spells start from your cushion. Some you cast alone; some need both of you.</p>
    ${SPELLS.filter(sp => !(isHome(g) && sp.kind !== "solo")).map(sp => {
      const at = spellAt(g, sp), c = castable(sp, at);
      const btn = at.mineWaiting ? `<span class="small muted">Your light is lit. It waits for them.</span>`
        : c.ok ? `<button type="button" data-act="cast" data-id="${sp.id}">${at.started ? "Take up their light" : "Cast it"}</button>` : `<span class="small muted">${esc(c.why)}</span>`;
      return `<div class="roomrow"><div><b>${esc(sp.name)}</b><span class="eyebrow">${esc(SPELL_KINDS[sp.kind])}</span><span class="small">${esc(sp.line)}</span></div>${btn}</div>`;
    }).join("")}
    ${isHome(g) ? `<p class="small muted">Spells for two are cast in a room you share.</p>` : ""}</div>`;
}
function picturesSheet(g, V) {
  const pic = ls.get("between.pic." + me) || {};
  const o = other(g);
  const mineShown = V.shown.get(me), theirShown = o ? V.shown.get(o) : null;
  return `<form class="stack" id="picForm"><h2>Your pictures</h2>
    <p class="small muted">These stay in this browser only. Nobody scores them. Show them when you choose; taking them back costs nothing.</p>
    <label for="pBetween">How you picture the Between<textarea id="pBetween" maxlength="1500" placeholder="Its shape, its mood, what it eats, where it sleeps">${esc(pic.between || "")}</textarea></label>
    <label for="pOther">How you picture ${esc(g.phase === "spark" ? g.setup.who : nameOf(o, g))}<textarea id="pOther" maxlength="1500" placeholder="What you imagine they feel, want and fear here">${esc(pic.other || "")}</textarea></label>
    <div class="row"><button type="submit" class="ghost">Keep in this browser</button>
      ${g.phase === "spark" || readOnly ? "" : mineShown ? `<button type="button" data-act="unshow" class="quiet">Take my pictures back</button>` : `<button type="button" data-act="show">Show them to ${esc(nameOf(o, g))}</button>`}</div>
    ${mineShown ? `<p class="small muted">Shown since ${fmt(mineShown.at)}.</p>` : ""}</form>
    ${g.phase === "spark" ? "" : `<div class="stack"><h3>Drift</h3>${mineShown && theirShown ? `<p class="small muted">Two shown pictures, side by side. Where they differ is the drift, something to talk about. Neither picture is the right one.</p>
      <div class="side"><div class="stack"><span class="eyebrow">You picture the Between</span><p>${esc(mineShown.between || "(left blank)")}</p></div>
      <div class="stack"><span class="eyebrow">${esc(nameOf(o, g))} pictures the Between</span><p>${esc(theirShown.between || "(left blank)")}</p></div>
      <div class="stack"><span class="eyebrow">You picture ${esc(nameOf(o, g))}</span><p>${esc(mineShown.other || "(left blank)")}</p></div>
      <div class="stack"><span class="eyebrow">${esc(nameOf(o, g))} pictures you</span><p>${esc(theirShown.other || "(left blank)")}</p></div></div>`
      : `<p><b>Not compared.</b> ${mineShown ? `Your pictures are shown. ${esc(nameOf(o, g))} has not shown theirs, and that is fine.` : theirShown ? `${esc(nameOf(o, g))} has shown their pictures. Yours stay with you unless you show them.` : "Neither of you has shown a picture."}</p>`}</div>`}`;
}
function allActs(V) {
  const out = [];
  for (const it of V.items.values()) for (const e of Object.values(it.history || {})) out.push(e);
  for (const sp of V.spirits.values()) for (const e of Object.values(sp.history || {})) out.push(e);
  for (const d of V.daemons.values()) for (const e of Object.values(d.history || {})) out.push(e);
  for (const e of Object.values((V.g && V.g.history) || {})) if (e && e.at) out.push(e);
  return out.sort((a, b) => b.at - a.at);
}
const awayActs = (g, V) => awaySince ? allActs(V).filter(e => e.by !== me && e.at > awaySince) : [];
const LANTERN_ACTS = { made: "made a lantern at the hearth", moved: "moved a lantern", welcomed: "welcomed a lantern" };
const actLine = (e, g) => `<li>${esc(nameOf(e.by, g))} ${esc(LANTERN_ACTS[e.act] || e.act)}${e.text ? `: <i>${esc(e.text)}</i>` : ""} <span class="muted small">· ${fmt(e.at)}</span></li>`;
function awaySheet(g, V) {
  const away = awayActs(g, V);
  const theirs = allActs(V).filter(e => e.by !== me).slice(0, 60);
  return `<div class="stack"><h2>How they held space while you were away</h2>
    <p class="small muted">The acts themselves, as they happened. Nothing here is counted or compared.</p>
    ${away.length ? `<ul class="log">${away.map(e => actLine(e, g)).join("")}</ul>` : `<p class="muted">Nothing new since you were last here.</p>`}
    ${theirs.length > away.length ? `<details><summary>Everything they have tended</summary><ul class="log">${theirs.map(e => actLine(e, g)).join("")}</ul></details>` : ""}</div>`;
}
function menuSheet(g, V) {
  return `<div class="stack"><h2>${isHome(g) ? "Your homeroom" : "The Between"}</h2>
    ${g && g.setup ? `<p class="muted small">${esc(g.setup.kind)}${g.setup.hopes ? `. Hoped for: <i>${esc(g.setup.hopes)}</i>` : ""}</p>` : ""}
    <div class="row">
      ${g && isMember(g) && g.phase !== "closed" && !isHome(g) ? `<button class="ghost" type="button" data-open="ending">Ending</button>` : ""}
      ${g && isMember(g) && !isHome(g) ? `<button class="ghost" type="button" data-act="copy">Take my copy</button>` : ""}
      <button class="ghost" type="button" data-act="shot">Send a screenshot</button>
      <button class="quiet" type="button" data-open="quiet">Need a silent exit?</button>
      <button class="quiet" type="button" data-close>Close</button>
    </div>
    <div class="stack small"><h3>Reading pace</h3><p class="muted">Words come in a line at a time at this pace. Tap any text to show the rest at once. Still shows everything at once.</p>
      <div class="row" role="group" aria-label="Reading pace">${Object.entries(PACES).map(([k, [l]]) => `<button class="${getPace() === k ? "" : "ghost"}" type="button" data-act="pace:${k}" aria-pressed="${getPace() === k}">${l}</button>`).join("")}</div></div>
    <div class="stack small"><h3>How to move</h3><p class="muted">Tap the floor to walk there. Tap something to walk up to it. Drag to look around, or drag something of yours you have tapped to carry it; pinch or scroll to come closer. On a keyboard, WASD or the arrows walk.</p>
    ${g && g.phase === "spark" && g.startedBy === me && myInvite ? `<p class="muted">To invite ${esc(g.setup.who)}, send them this garden's invitation link. They sign in to bars-engine (or make an account), then ask to join at the spark, and you welcome them in.</p>
      <div class="row"><button class="ghost" type="button" data-act="inviteLink">Copy the invitation link</button></div>` : ""}</div>
    <p class="credit">Inspired by Eri Kardos, <i>Relationship Agreements</i> (2016). The garden's words are the council's own; nothing here quotes the book. Your pictures stay in this browser until you choose to show them. No AI runs on this page.</p></div>`;
}
function endingSheet(g, V) {
  const e = g.ending; const o = other(g);
  if (g.phase === "spark") return `<div class="stack"><h2>Ending</h2><p>While it is a spark it is yours alone. You can let it go any time: it composts, and nothing is sent to anyone.</p>
    <div class="row"><button class="ghost" type="button" data-act="copy">Take a copy first</button><button class="quiet" type="button" data-act="letgo">Let the spark go</button></div></div>`;
  const keeps = new Set(myPrivate.keeps || []);
  const keepList = [...V.items.entries()].filter(([, i]) => ["agreed", "received", "kept", "retired"].includes(i.status));
  let body;
  if (!e) body = `<p>Ending the relationship formally takes both of you. Either can ask. Each of you chooses which parts of the Between to keep, and each leaves with a full copy of it, history and all.</p>
    <form class="stack" id="endForm">
      <label for="eAfter">After you both agree, the garden<select id="eAfter"><option value="close">closes</option><option value="change">becomes a garden for another kind of relationship</option></select></label>
      <label for="eKind">If it changes, into what kind?<select id="eKind">${REL_KINDS.map(k => `<option>${k}</option>`).join("")}</select></label>
      <label for="eWhy">Anything you want to say with it<textarea id="eWhy" maxlength="1000"></textarea></label>
      <div class="row"><button type="submit" class="ghost" ${readOnly ? "disabled" : ""}>Ask to end it together</button></div></form>`;
  else {
    const asked = e.proposedBy === me;
    const plan = e.after === "change" ? `becomes a garden for ${esc(e.newKind.toLowerCase())}` : "closes";
    body = `<p class="note"><b>${asked ? "You" : esc(nameOf(e.proposedBy, g))}</b> asked to end this together. After you both agree, the garden ${plan}.${e.why ? ` <i>${esc(e.why)}</i>` : ""}</p>
      ${asked ? `<div class="row"><span class="small muted">It waits for ${esc(nameOf(o, g))}'s yes.</span><button class="quiet" type="button" data-act="endWithdraw">Take back the request</button></div>`
        : `<div class="row"><button type="button" data-act="endYes">Yes, end it together</button><button class="quiet" type="button" data-act="endNo">Not now</button></div>`}`;
  }
  return `<div class="stack"><h2>Ending together</h2>${body}
    <h3>What you keep</h3><p class="small muted">Tick what you want to carry out of here. Your choice is private to you. Your copy always holds the whole history; the ticks mark what you keep close.</p>
    ${keepList.length ? `<div class="stack">${keepList.map(([id, i]) => `<label class="row" style="font-weight:400"><input type="checkbox" style="width:auto" data-keep="${id}" ${keeps.has(id) ? "checked" : ""}> ${esc(i.kind === "agreement" ? "Agreement" : KINDS[i.kind])}: ${esc(i.sealed && i.by !== me && !(i.opened || {})[me] && i.status !== "received" ? "(sealed charge)" : String(i.text).slice(0, 120))}</label>`).join("")}</div>` : `<p class="muted small">Nothing is held by both of you yet.</p>`}
    <div class="row"><button class="ghost" type="button" data-act="copy">Take my copy of the Between</button></div></div>`;
}
async function takeCopy() {
  const V = view(); const g = V.g;
  const keeps = new Set(myPrivate.keeps || []);
  const its = [...V.items.entries()].map(([id, i]) => {
    const hidden = i.sealed && i.by !== me && !(i.opened || {})[me] && i.status !== "received";
    return { kind: i.kind, text: hidden ? "(sealed, never opened)" : i.text, status: i.status, from: nameOf(i.by, g), at: new Date(i.at).toISOString(), kept: keeps.has(id),
      history: Object.values(i.history || {}).sort((a, b) => a.at - b.at).map(e => ({ who: nameOf(e.by, g), act: e.act, at: new Date(e.at).toISOString() })) };
  });
  const copy = { what: "A copy of a Between, taken from the Between's 3D garden", takenAt: new Date().toISOString(), name: betweenName(V.items), relationship: g && g.setup,
    state: STATE_TEXT[stateOf(satisfaction(V.items))][0], items: its,
    spirits: [...V.spirits.values()].map(s => ({ name: s.name, element: s.element, owner: nameOf(s.owner, g) })),
    daemons: [...V.daemons.values()].map(d => ({ daemon: (DAEMONS[d.which] || [d.which])[0], owner: nameOf(d.owner, g) })),
    credit: "Inspired by Eri Kardos, Relationship Agreements (2016)." };
  const text = JSON.stringify(copy, null, 2);
  try {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "application/json" })); a.download = "between-copy.json";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast("Your copy is saved to your downloads."); return;
  } catch {}
  try { await navigator.clipboard.writeText(text); toast("Your copy is on your clipboard. Paste it somewhere safe."); }
  catch { toast("Saving did not work in this browser. Try again in another one."); }
}

/* ===================================================================================================
   Room kit, part 2: the first minute (Still C) and the scroll (Still B), his yes to both stills, 2026-10-24.
   The pure parts are public/calrunia/first-minute.js and scroll.js; this is how the room shows them.
   =================================================================================================== */
const MINUTE_FRESH = PREVIEW_HOST && KQ.get("minute") === "1";      // previews: the first minute from the start, written nowhere
const SCROLL_PREVIEW = PREVIEW_HOST ? KQ.get("scroll") : null;       // previews: "arrived" (a sealed scroll waits) or "write"
let rehearse = MINUTE_FRESH ? { minute: {} } : null;                 // the minute's own doc while a preview rehearses it
/* The homeroom doc the minute reads: the real one, or the rehearsal's; a preview that skips ahead counts the minute as done. */
function minuteDoc(base = myHome) {
  const h = { ...(base || {}) };
  if (rehearse) { h.minute = rehearse.minute || {}; h.oriented = rehearse.oriented ?? null; }
  else if ((NOOK_SKIP || SCROLL_PREVIEW) && h.oriented == null) h.oriented = 1;
  return h;
}
const mstate = () => minuteState(minuteDoc());
/* The minute runs in your own nook until the last vine falls. */
const minuteOn = () => !!(inNook() && garden && isHome(garden) && !storeDown && !mstate().oriented);
const mclock = { t0: 0, resolvedAt: {}, shownAt: {}, started: false, opened: true, beat: null, laterReady: false };
const captionMs = s => MINUTE_CAPTIONS[s] ? readMs(MINUTE_CAPTIONS[s].split(/\s+/).length) + 800 : 0;
/* The beat that is up now: the minute's current step once its time has come, or null while the next one waits. */
function minuteBeat() {
  if (!mclock.started) return null;
  const st = mstate();
  if (st.step === "open") {
    if (mclock.opened) return mclock.shownAt.open && now() - mclock.shownAt.open < 25000 ? "open" : null; // its words stay a while
    return now() >= beatAt("open", { t0: mclock.t0, resolvedAt: mclock.resolvedAt, captionMs }) ? "open" : null;
  }
  return now() >= beatAt(st.step, { t0: mclock.t0, resolvedAt: mclock.resolvedAt, captionMs }) ? st.step : null;
}
/* Captions: the still's own lines, large and quiet, read in at the player's pace (Ari: never faster than reading). */
const mcap = document.createElement("div"); mcap.id = "mcap"; mcap.className = "mcap"; mcap.hidden = true; mcap.setAttribute("aria-live", "polite"); document.body.appendChild(mcap);
function caption(text) {
  mcap.innerHTML = `<p>${esc(text)}</p>`; mcap.hidden = false; mcap.classList.remove("out"); readIn(mcap);
  clearTimeout(caption.h); clearTimeout(caption.h2);
  caption.h = setTimeout(() => { mcap.classList.add("out"); caption.h2 = setTimeout(() => { mcap.hidden = true; }, 900); }, Math.max(4200, readMs(text.split(/\s+/).length) * 1.6 + 3000));
}
function captionOut() { clearTimeout(caption.h); clearTimeout(caption.h2); mcap.classList.add("out"); caption.h2 = setTimeout(() => { mcap.hidden = true; }, 900); }
/* A step done (or left for later): kept in the homeroom's private doc, or in the rehearsal's. */
async function minuteAct(step, how = "done", extra = null) {
  const st = mstate();
  if (how === "done" && st.done[step]) return;
  const at = now(), w = minuteWrite(step, how, at); if (!w) return;
  if (mclock.started) mclock.resolvedAt[step] = at;
  const data = extra ? merge(w, extra) : w;
  if (rehearse) rehearse = merge(rehearse, w);
  else { myHome = merge(myHome, data); homeOp(data).catch(() => toast("That did not save. Check your connection and try again.")); }
  if (how === "done") {
    if (step === "ember") { burst(HEARTH_AT.clone().setY(0.5), 0xffb060); caption(MINUTE_CAPTIONS.ember); }
    if (step === "mirror") caption(MINUTE_CAPTIONS.mirror);
    if (step === "hope") caption(MINUTE_CAPTIONS.hope);
    if (step === "vine") { caption(MINUTE_CAPTIONS.vine); if (shelf.group) burst(shelf.at.clone().add(new THREE.Vector3(0.3, 0.1, 0)), 0xefe2c4); mclock.opened = !mclock.started; }
  }
  if (step === "vine") directCam = { key: "door", t0: performance.now() };
  // a vine falls for the hearth and the mirror: the view turns to the doorway to see it go, then hands back
  if (how === "done" && (step === "ember" || step === "mirror") && mclock.started && minuteOn()) setTimeout(() => { directCam = { key: "door", t0: performance.now() }; }, step === "ember" ? 1700 : 900);
  syncShelf(); refreshHud();
}
/* You wake sat on the first minute's cushion: the same seated pose as any seat (seatsHere's "wake"), up the moment you move. */
function wakeOnCushion() {
  wake.group.visible = true; wake.on = true;
  meState.pos.copy(wake.group.position); meState.yaw = wake.yaw; meState.target = null;
  meState.seatWant = "wake"; meState.sitting = true; meState.sitT = -9;
}
/* The minute begins (or picks up where a reload left it): you wake on a cushion, the hearth out, the doorway grown over. */
function minuteStart() {
  if (!minuteOn() || mclock.started) return;
  const st = mstate();
  mclock.started = true; mclock.opened = false;
  const fresh = st.step === "ember" && !st.skipped.ember;
  mclock.t0 = now() - (fresh ? 0 : MINUTE_BEATS[st.step] * 1000);
  for (const s of MINUTE_STEPS) if (s !== st.step && (st.done[s] || st.skipped[s])) mclock.resolvedAt[s] = mclock.t0 - 6e4;
  if (hollow) hollow.handles.hearth.k = st.hearthLit ? 1 : 0;
  vines.forEach((v, i) => { v.state = st.fallen[i] ? "gone" : "up"; v.group.visible = !st.fallen[i]; });
  if (fresh) {
    wakeOnCushion();
    caption(MINUTE_CAPTIONS.wake);
  }
  directCam = { key: fresh ? "wake" : st.step === "vine" ? "door" : st.step === "ember" ? "hearth" : "room", t0: performance.now() };
  refreshHud();
}
/* Once a frame: the hearth, the vines, the glows and the beat's own prompt. */
function minuteTick(t, dt) {
  if (!hollow) return;
  const home = inNook() && garden && isHome(garden);
  const st = home ? mstate() : null, beat = home ? minuteBeat() : null;
  const hf = hollow.handles.hearth;
  if (hf) { hf.want = !home || storeDown || st.hearthLit ? 1 : 0; hf.ember = home && !storeDown && st.emberGlows && (beat === "ember" || st.skipped.ember || !minuteOn()) ? 1 : 0; }
  // the vines: up while the minute keeps them; a vine whose step is done falls, slowly
  const vis = home && !storeDown;
  vines.forEach((v, i) => {
    const down = !vis || (st && st.fallen[i]);
    if (!vis) { v.group.visible = false; return; }
    if (down && v.state === "up") { v.state = "falling"; v.t0 = t + (mclock.started && minuteOn() ? 1.9 : 0); } // a beat for the camera to turn
    if (!down && v.state !== "up") { v.state = "up"; v.group.position.copy(v.home); v.group.rotation.set(0, 0, 0); v.mat.opacity = 1; v.group.visible = true; }
    if (v.state === "falling") {
      const u = Math.max(0, Math.min(1, (t - v.t0) / 1.6));
      v.group.position.set(v.home.x + Math.sin(u * 3) * 0.05, v.home.y - u * u * 1.9, v.home.z + u * 0.35); v.group.rotation.z = (i - 1) * u * 0.9 + u * 0.4; v.mat.opacity = 1 - u * u;
      if (u >= 1) { v.state = "gone"; v.group.visible = false; }
    } else if (v.state === "up") {
      v.group.visible = true;
      const glow = beat === "vine" && i === 2 ? 0.5 + 0.5 * Math.sin(t * 3.2) : 0;
      v.mat.emissiveIntensity = 0.3 + glow * 1.4; v.group.rotation.z = Math.sin(t * 0.9 + i * 1.7) * 0.025;
    }
  });
  // the mirror glows while its question waits (the hope beat, or after it was skipped)
  const glass = mirror.userData.glass;
  if (glass) { const g = home && st.mirrorGlows && (beat === "hope" || st.skipped.hope || !minuteOn()) ? 0.5 + 0.5 * Math.sin(t * 2.4) : 0; glass.material.emissiveIntensity = 0.6 + g * 1.4; glass.material.emissive.setHex(g ? 0x6a5a3a : 0x30404c); }
  // the cushion you woke on: gone once the doorway opens
  if (wake.group.visible && (!home || (st.oriented && mclock.opened)) && !(WAKE_SKIP && meState.seatWant === "wake")) { if (meState.seatWant === "wake") standUp(); wake.k = Math.max(0, (wake.k ?? 1) - dt * 0.8); wake.group.scale.setScalar(Math.max(0.001, wake.k)); if (wake.k <= 0) { wake.group.visible = false; wake.on = false; } }
  if (!mclock.started) return;
  if (beat && beat !== mclock.beat) {
    mclock.beat = beat; mclock.shownAt[beat] = now(); mclock.laterReady = false;
    if (beat === "ember") directCam = { key: "hearth", t0: performance.now() };
    if (beat === "mirror" || beat === "hope") directCam = { key: "room", t0: performance.now() };
    if (beat === "vine") directCam = { key: "door", t0: performance.now() };
    if (beat === "open") minuteOpen();
    refreshHud();
  } else if (!beat && mclock.beat) { mclock.beat = null; refreshHud(); }
  if (beat && SKIPPABLE.includes(beat) && !mclock.laterReady && now() - mclock.shownAt[beat] > LATER_AFTER_MS + readMs((MINUTE_PROMPTS[beat] || "").split(/\s+/).length)) { mclock.laterReady = true; refreshHud(); }
}
/* 1:00 the doorway shimmers, open. An invitation's doorway (a guest's first minute is its orientation) opens with it. */
function minuteOpen() {
  mclock.opened = true; shimmerT = performance.now();
  if (portalTo) portalTo.open = true;
  burst(PORTAL_AT.clone().setY(1.0), 0xffe2a8);
  directCam = { key: "door", t0: performance.now() };
  refreshHud();
}
let shimmerT = 0;
/* The cushion you wake on, a quilted travel one: it carries you through the minute and folds away when the doorway opens. */
const wake = { group: new THREE.Group(), on: false, yaw: 0, k: 1 };
wake.group.visible = false; scene.add(wake.group);
/* The three vines grown over the doorway: thick stems from the lintel, leaves along them. */
const vines = [];
{
  const leafShape = new THREE.Shape(); leafShape.moveTo(0, 0); leafShape.quadraticCurveTo(0.07, 0.05, 0, 0.17); leafShape.quadraticCurveTo(-0.07, 0.05, 0, 0);
  const leafGeo = new THREE.ShapeGeometry(leafShape, 4);
  for (let i = 0; i < 3; i++) {
    const mat = new THREE.MeshStandardMaterial({ color: [0x6fae5a, 0x7cbb62, 0x64a352][i], emissive: 0x4f8f3a, emissiveIntensity: 0.3, roughness: 0.75, transparent: true, side: THREE.DoubleSide });
    const g = new THREE.Group(), r = rng(hash("vine" + i)), x0 = (i - 1) * 0.3;
    const pts = []; for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push(new THREE.Vector3(x0 + Math.sin(u * 5 + i * 2) * 0.09 + (r() - 0.5) * 0.04, 1.86 - u * 1.78, 0.06 + Math.sin(u * 3 + i) * 0.03)); }
    const stem = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, 0.028 - i * 0.002, 6), mat); g.add(stem);
    for (let k = 0; k < 26; k++) {
      const p = pts[Math.min(8, 1 + Math.floor(r() * 8))].clone().lerp(pts[Math.min(8, 1 + Math.floor(r() * 8))], r());
      const leaf = new THREE.Mesh(leafGeo, mat); leaf.position.copy(p); leaf.rotation.set(r() * 0.8 - 0.4, r() * Math.PI * 2, (r() < 0.5 ? -1 : 1) * (0.6 + r() * 0.9)); leaf.scale.setScalar(0.9 + r() * 0.8); g.add(leaf);
    }
    portal.add(g);
    vines.push({ group: g, mat, home: g.position.clone(), state: "up", t0: 0 });
  }
}
/* ---------- the shelf: the blank scroll, scrolls that arrived sealed, keepsakes ---------- */
const shelf = { group: null, at: new THREE.Vector3(), face: 0, sig: "", taps: [], sealedSeen: null };
function scrollMesh(kind, hue) {
  const g = new THREE.Group(), s = kind === "keep" ? 0.5 : 0.68;
  const paper = new THREE.MeshStandardMaterial({ color: 0xd9ccb0, roughness: 0.9, emissive: 0xefe2c4, emissiveIntensity: 0.22 }), rod = new THREE.MeshStandardMaterial({ color: 0x7a5236, roughness: 0.7 });
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.34, 14), paper); roll.rotation.z = Math.PI / 2; roll.position.y = 0.05; g.add(roll);
  for (const sx of [-1, 1]) { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.05, 8), rod); k.rotation.z = Math.PI / 2; k.position.set(sx * 0.19, 0.05, 0); g.add(k); }
  if (kind === "sealed") {
    const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.02, 16), new THREE.MeshStandardMaterial({ color: hue, emissive: hue, emissiveIntensity: 0.45, roughness: 0.4 }));
    wax.rotation.x = Math.PI / 2; wax.position.set(0, 0.05, 0.055); g.add(wax);
  } else if (kind === "keep") {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.053, 0.053, 0.05, 14), new THREE.MeshStandardMaterial({ color: hue, roughness: 0.6 })); band.rotation.z = Math.PI / 2; band.position.y = 0.05; g.add(band);
  } else {
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.006, 6, 18), new THREE.MeshStandardMaterial({ color: 0xc9a070, roughness: 0.8 })); tie.rotation.y = Math.PI / 2; tie.position.y = 0.05; g.add(tie);
  }
  g.scale.setScalar(s);
  return g;
}
const SEAL_HUE = started => started ? 0x3f9e93 : 0x9a5a8e;   // the room's first hue for whoever started it, plum for who joined
const KEEP_HUE = { later: 0xb0803c, no: 0x6c5a62 };
function myShelf() {
  const st = inNook() && garden && isHome(garden) ? mstate() : null;
  const s = shelfScrolls((list && list.gardens) || []);
  if (SCROLL_PREVIEW === "arrived" && !paperDone.has("preview|s0")) s.sealed.unshift(PREVIEW_SCROLL);
  s.sealed = s.sealed.filter(x => !paperDone.has(x.room + "|" + x.id));
  return { blank: !!(st && st.scrollGiven), sealed: s.sealed, keepsakes: s.keepsakes };
}
const PREVIEW_SCROLL = { room: "preview", id: "s0", name: "Ari", style: "dusk-hollow", started: true, when: null, note: "I saved you the plum cushion.", at: 1, preview: true };
const paperDone = new Set(); // scrolls answered on this page, before the list catches up
function syncShelf() {
  const want = inNook() && hollow && garden && isHome(garden);
  if (!want) { if (shelf.group) { scene.remove(shelf.group); shelf.group = null; shelf.sig = ""; } return; }
  const sh = myShelf(), sig = JSON.stringify([sh.blank, paperBusy === "blank", sh.sealed.map(x => x.room + x.id), sh.keepsakes.slice(0, 4).map(x => x.room + x.id + x.answer)]);
  if (sig === shelf.sig && shelf.group) return;
  // a sealed scroll that was not here a moment ago has just landed: a puff of leaves
  const ids = new Set(sh.sealed.map(x => x.room + "|" + x.id));
  const landed = shelf.sealedSeen && [...ids].some(id => !shelf.sealedSeen.has(id));
  shelf.sealedSeen = ids; shelf.sig = sig;
  if (shelf.group) scene.remove(shelf.group);
  const sp = SHELLS.nook.spots.find(x => x.id === "shelf");
  const g = new THREE.Group(); g.position.set(sp.at[0], sp.at[1], sp.at[2]); g.rotation.y = sp.face || 0; scene.add(g);
  shelf.group = g; shelf.at.set(sp.at[0], sp.at[1], sp.at[2]); shelf.face = sp.face || 0; shelf.taps = [];
  const put = (m, x, y, z, ry, tap) => { m.position.set(x, y, z); m.rotation.y = ry; g.add(m); if (tap) shelf.taps.push({ ...tap, m }); };
  if (sh.blank && paperBusy !== "blank") put(scrollMesh("blank"), 0.28, 0, 0.04, 0.12, { key: "blank" });
  sh.sealed.slice(0, 3).forEach((x, i) => put(scrollMesh("sealed", SEAL_HUE(x.started)), -0.27, i * 0.055, 0.06 - i * 0.02, -0.1 + i * 0.15, { key: "sealed", i }));
  sh.keepsakes.slice(0, 4).forEach((x, i) => put(scrollMesh("keep", KEEP_HUE[x.answer] || KEEP_HUE.no), -0.3 + i * 0.16, 0, -0.13, Math.PI / 2 + (i % 2 ? 0.15 : -0.1), { key: "keep", i }));
  if (landed) burst(shelf.at.clone().add(new THREE.Vector3(-0.25, 0.1, 0.1)), 0x8fd08a);
}
function shelfTapPos(tp) { const v = new THREE.Vector3(); tp.m.getWorldPosition(v); v.y += 0.03; return v; }
/* ---------- the paper: writing a scroll, breaking a seal, the three ribbons ---------- */
let paper = null, paperBusy = null;
const paperEl = document.createElement("div"); paperEl.id = "paper"; paperEl.className = "paper"; paperEl.hidden = true;
paperEl.setAttribute("role", "dialog"); paperEl.setAttribute("aria-modal", "true"); paperEl.setAttribute("aria-label", "A scroll"); document.body.appendChild(paperEl);
const roomById = id => ((list && list.gardens) || []).find(r => r.id === id) || null;
function scrollTargets() {
  const rooms = ((list && list.gardens) || []).filter(r => r.phase !== "closed" && (r.person || r.phase === "spark"));
  const out = rooms.map(r => ({ id: r.id, name: roomName(r), spark: r.phase === "spark", style: r.style, mine: !r.personStarted }));
  if (!out.length && SCROLL_PREVIEW) out.push({ id: "preview", name: "Ari", spark: false, style: "dusk-hollow", mine: true, preview: true });
  return out;
}
function openPaper(mode, arg) {
  closeSheet(); setSatchel(false);
  if (mode === "write") {
    const ts = scrollTargets(), fixed = arg && arg.room;
    paper = { mode, to: fixed || (ts.length === 1 ? ts[0].id : null), fixed: !!fixed, chip: "tonight", day: null, cal: false, line: "", open: false };
    paperBusy = arg && arg.fromShelf ? "blank" : null;
  } else paper = { mode, s: arg, open: mode === "keep" };
  renderPaper();
  syncShelf();
  if (mode === "write") setTimeout(() => { if (paper && paper.mode === "write") { paper.open = true; renderPaper(); } }, 60);
}
function closePaper() { paper = null; paperBusy = null; paperEl.hidden = true; paperEl.innerHTML = ""; paperEl._h = ""; syncShelf(); refreshHud(); }
function paperTarget() {
  if (!paper || paper.mode !== "write") return null;
  const g = view().g;
  if (paper.fixed && g && !isHome(g)) return { id: gardenId, name: nameOf(other(g), g), spark: false, style: g.style, mine: g.startedBy === me };
  return scrollTargets().find(t => t.id === paper.to) || null;
}
function renderPaper() {
  if (!paper) return;
  const P = paper, myName = names[me] || "you";
  let inner = "", seal = "", hint = "", foot = "";
  if (P.mode === "write") {
    const ts = scrollTargets(), to = paperTarget(), cal = P.chip === "day" && P.cal;
    const hue = cssHue(SEAL_HUE(to ? to.mine : true));
    const toRow = P.fixed || ts.length <= 1 ? "" : `<div class="when" role="group" aria-label="To whom">${ts.map(t => `<button type="button" data-act="pTo" data-id="${esc(t.id)}" aria-pressed="${P.to === t.id}">${esc(t.name)}</button>`).join("")}</div>`;
    const none = !ts.length && !P.fixed;
    inner = `<div class="from">From ${esc(myName)}${to ? " · to " + esc(to.name) : ""}</div>${toRow}
      ${none ? `<div class="pline">A scroll goes to someone who shares a room with you.</div><div class="small pnote">Plant a spark under Rooms and send its link. Once they join, a scroll can go to them.</div>` : `
      <div class="pline">Come sit with me in the ${esc(styleOf(to ? to.style : null).name)}.</div>
      <div class="when" role="group" aria-label="When">${WHEN_CHIPS.map(([k, l]) => `<button type="button" data-act="pWhen" data-id="${k}" aria-pressed="${P.chip === k}">${esc(k === "day" && P.day ? whenWords(whenFor("day", now(), P.day)).replace(/^on /, "") : l)}</button>`).join("")}</div>
      ${cal ? calHtml(P) : ""}
      <input id="pLine" class="hand" maxlength="${LINE_MAX}" autocomplete="off" placeholder="One line, in your hand" aria-label="One line, in your hand" value="${esc(P.line)}">`}`;
    seal = none ? "" : `<button class="seal" type="button" data-act="pSeal" style="--seal:${hue}" aria-label="Press the seal to roll it up and send it"><span>${esc(markOf(myName))}</span></button>`;
    hint = none ? "" : to && to.spark ? "Press the seal. It rolls up with this room's link, ready to send." : "Press the seal to roll it up and send it.";
    foot = `<button class="quiet pclose" type="button" data-act="pClose">${none ? "Close" : "Put it back"}</button>`;
  } else {
    const s = P.s, hue = cssHue(SEAL_HUE(s.started));
    inner = `<div class="from">From ${esc(s.name || "someone")}</div>
      <div class="pline">Come sit with me in the ${esc(styleOf(s.style).name)}, ${esc(whenWords(s.when))}.</div>
      ${s.note ? `<div class="hand">${esc(s.note)}</div>` : ""}
      ${P.mode === "read" ? `<div class="ribbons" role="group" aria-label="Your answer">${RIBBONS.map(([k, l]) => `<button class="ribbon ${k}" type="button" data-act="pAnswer" data-id="${k}">${esc(l)}</button>`).join("")}</div>` : `<div class="small pnote">You answered ${s.answer === "later" ? "another time" : "no"}. It stays on your shelf.</div>`}`;
    seal = P.mode === "read" && !P.answered ? `<button class="seal" type="button" data-act="pBreak" style="--seal:${hue}" aria-label="${P.open ? "The seal is broken" : "Break the seal to unroll it"}" ${P.open ? "disabled" : ""}><span>${esc(markOf(s.name))}</span></button>` : "";
    hint = P.hint || (P.mode === "read" ? (P.open ? "Answer with a ribbon. No needs no reason." : "It arrived sealed. Tap the seal to unroll it.") : "");
    foot = `<button class="quiet pclose" type="button" data-act="pClose">${P.mode === "read" && !P.answered ? "Leave it sealed for now" : "Put it back"}</button>`;
  }
  const h = `<div class="scroll${P.open ? " open" : ""}${P.leaving ? " leaving" : ""}"><div class="rod"></div><div class="psheet"><div class="pin">${inner}</div></div><div class="rod"></div>${seal}</div>
    <p class="phint" aria-live="polite">${esc(hint)}</p>${foot}`;
  if (paperEl._h === h) return;
  const keep = $("#pLine", paperEl), had = keep && document.activeElement === keep;
  if (keep) P.line = keep.value;
  paperEl._h = h; paperEl.innerHTML = h; paperEl.hidden = false;
  if (had) { const n = $("#pLine", paperEl); if (n) { n.focus({ preventScroll: true }); n.setSelectionRange(n.value.length, n.value.length); } }
}
const calHtml = P => {
  const months = calendar(now(), 2), m = months[P.calMonth || 0];
  const picked = P.day ? P.day.y + "-" + P.day.m + "-" + P.day.d : "";
  return `<div class="cal" role="group" aria-label="Pick a day"><div class="calhead"><button type="button" class="calnav" data-act="pCalMonth" data-id="0" ${P.calMonth ? "" : "disabled"} aria-label="This month">‹</button><span>${esc(m.name)}</span><button type="button" class="calnav" data-act="pCalMonth" data-id="1" ${P.calMonth ? "disabled" : ""} aria-label="Next month">›</button></div>
    <div class="calgrid">${["S", "M", "T", "W", "T", "F", "S"].map(d => `<span class="dow">${d}</span>`).join("")}${m.weeks.flat().map(c => c ? `<button type="button" class="day${c.today ? " today" : ""}" data-act="pDay" data-id="${c.y}-${c.m}-${c.d}" ${c.past ? "disabled" : ""} aria-pressed="${picked === c.y + "-" + c.m + "-" + c.d}">${c.d}</button>` : `<span></span>`).join("")}</div></div>`;
};
paperEl.addEventListener("input", e => { if (e.target.id === "pLine" && paper) paper.line = e.target.value; });
paperEl.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.id === "pLine") { e.preventDefault(); paperAct("pSeal"); } });
paperEl.addEventListener("click", e => { const b = e.target.closest("[data-act]"); if (!b || !paperEl.contains(b)) return; e.stopPropagation(); paperAct(b.dataset.act, b.dataset.id); });
async function paperAct(a, id) {
  const P = paper; if (!P) return;
  const ln = $("#pLine", paperEl); if (ln) P.line = ln.value;
  if (a === "pClose") { closePaper(); return; }
  if (a === "pTo") { P.to = id; renderPaper(); return; }
  if (a === "pWhen") { P.chip = id; P.cal = id === "day" ? !P.cal || !P.day : false; renderPaper(); return; }
  if (a === "pCalMonth") { P.calMonth = +id; renderPaper(); return; }
  if (a === "pDay") { const [y, m, d] = id.split("-").map(Number); P.day = { y, m, d }; P.cal = false; renderPaper(); return; }
  if (a === "pSeal") return sealScroll();
  if (a === "pBreak") { P.open = true; renderPaper(); return; }
  if (a === "pAnswer") return answerScroll(id);
}
/* Pressing the seal: it rolls up, and leaves through the doorway on a gust of leaves. */
async function sealScroll() {
  const P = paper, to = paperTarget(); if (!P || P.sending) return;
  if (!to) { toast("Choose who it goes to first."); return; }
  const when = whenFor(P.chip, now(), P.day);
  if (P.chip === "day" && when == null) { P.cal = true; renderPaper(); toast("Pick a day on the paper first."); return; }
  P.sending = true;
  const inv = sealedInvitation(me, when, P.line), iid = "s" + hkey();
  let sent = null;
  try {
    if (to.preview) sent = "preview";
    else if (to.spark) sent = await sparkLink(to, inv.note);
    else {
      const data = { invitations: { [iid]: inv }, history: hist("sent you a scroll: come and sit"), lastTendedAt: now() };
      if (to.id === gardenId) await op("garden/main", "update", data); else await api("/api/between/" + to.id + "/doc", { path: "garden/main", op: "update", data });
      sent = "scroll";
    }
  } catch { P.sending = false; toast("That did not send. Check your connection and try again."); return; }
  P.open = false; P.hint = ""; renderPaper();
  setTimeout(() => { if (paper !== P) return; P.leaving = true; renderPaper(); }, 850);
  setTimeout(() => {
    if (paper === P) closePaper();
    gust(inNook() && shelf.group ? shelf.at.clone().add(new THREE.Vector3(0.28, 0.08, 0.1)) : meState.pos.clone().setY(1.2));
    toast(sent === "link" ? `The link is ready to send. ${to.name} signs in or makes an account, and the doorway opens for them.` : `Sealed and sent. It lands on ${to.name}'s shelf.`);
    refreshList();
  }, 1350);
}
/* A spark's person has no shelf yet: the scroll's line goes with the room's link, the way an invitation always has. */
/** A spark's invitation link, from its own invite token (the coin table lays it for a Show Up cast, build 3b). */
async function sparkUrl(id) {
  let token = id === gardenId ? myInvite : null;
  if (!token) { const j = await api("/api/between/" + id + "/poll", {}); token = j.invite || null; }
  if (!token) throw fail("unavailable", "no link");
  return location.origin + "/ontology-game/between?g=" + encodeURIComponent(id) + "&invite=" + encodeURIComponent(token);
}
async function sparkLink(to, note) {
  const link = await sparkUrl(to.id);
  const text = (note ? note + "\n\n" : "") + "Come into the Between with me: " + link;
  let shared = false;
  if (navigator.share) { try { await navigator.share({ title: "The Between", text }); shared = true; } catch {} }
  if (!shared) { try { await navigator.clipboard.writeText(text); } catch {} }
  return "link";
}
/* A ribbon: Yes opens the doorway between your rooms; Another time and No roll it back up, a keepsake on the shelf. */
async function answerScroll(ans) {
  const P = paper; if (!P || P.mode !== "read" || P.answered) return;
  const o = answerOutcome(ans); if (!o.ok) return;
  const s = P.s;
  try {
    if (!s.preview) {
      const data = { invitations: { [s.id]: { answer: o.write, answeredAt: now() } } };
      if (s.room === gardenId) await op("garden/main", "update", data); else await api("/api/between/" + s.room + "/doc", { path: "garden/main", op: "update", data });
    }
  } catch { toast("That did not save. Check your connection and try again."); return; }
  P.answered = ans; P.hint = o.line; paperDone.add(s.room + "|" + s.id);
  if (o.keepsake && !s.preview) { const r = roomById(s.room); if (r) { r.invitations = (r.invitations || []).filter(x => x.id !== s.id); r.keepsakes = [{ id: s.id, when: s.when, note: s.note, answer: ans, at: s.at }, ...(r.keepsakes || [])]; } paperDone.delete(s.room + "|" + s.id); }
  if (o.rollUp) P.open = false;
  renderPaper();
  setTimeout(() => {
    if (paper === P) closePaper();
    if (o.doorway && inNook()) {
      if (!s.preview) portalTo = { id: s.room, invite: null, open: true, name: s.name, style: s.style };
      shimmerT = performance.now(); burst(PORTAL_AT.clone().setY(1.0), 0xffe2a8); directCam = { key: "door", t0: performance.now() };
    }
    refreshList(); refreshHud();
  }, o.doorway ? 1500 : 1700);
}
/* The gust: the rolled scroll lifts off the shelf, crosses the room in a swirl of leaves and goes through the doorway. */
const gusts = [];
const gustLeafGeo = (() => { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(0.05, 0.04, 0, 0.12); sh.quadraticCurveTo(-0.05, 0.04, 0, 0); return new THREE.ShapeGeometry(sh, 3); })();
const gustLeafMats = [0x7fb38a, 0x9ac46a, 0xd8a050, 0x6aa553].map(c => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.35, roughness: 0.7, side: THREE.DoubleSide, transparent: true }));
function gust(from) {
  const t0 = performance.now() / 1000, to = PORTAL_AT.clone().setY(1.0), roll = scrollMesh("blank"); roll.scale.setScalar(0.7); scene.add(roll);
  const mid = from.clone().lerp(to, 0.5).add(new THREE.Vector3(0, 0.9, 0.6)), curve = new THREE.QuadraticBezierCurve3(from, mid, to);
  const leaves = [];
  for (let i = 0; i < (LOW_POWER ? 18 : 28); i++) { const m = new THREE.Mesh(gustLeafGeo, gustLeafMats[i % 4]); m.userData = { lag: Math.random() * 0.35, r: 0.15 + Math.random() * 0.35, ph: Math.random() * 6, sp: 4 + Math.random() * 5 }; scene.add(m); leaves.push(m); }
  gusts.push({ t0, curve, roll, leaves, to });
  if (inNook()) directCam = { key: "gust", t0: performance.now(), from: from.clone() };
}
function gustTick(t) {
  for (let i = gusts.length - 1; i >= 0; i--) {
    const G = gusts[i], u = (t - G.t0) / 2.4;
    const e = u => Math.max(0, Math.min(1, u)), ease = x => x * x * (3 - 2 * x);
    G.roll.position.copy(G.curve.getPoint(ease(e(u)))); G.roll.rotation.set(t * 3, t * 1.3, Math.sin(t * 4) * 0.4);
    G.roll.scale.setScalar(0.7 * (u > 0.85 ? Math.max(0.01, (1 - u) / 0.15) : 1));
    for (const m of G.leaves) {
      const d = m.userData, v = ease(e(u * 1.15 - d.lag)), p = G.curve.getPoint(v), a = t * d.sp + d.ph;
      m.position.set(p.x + Math.cos(a) * d.r, p.y + Math.sin(a * 1.3) * d.r * 0.7, p.z + Math.sin(a) * d.r);
      m.rotation.set(a, a * 0.7, a * 1.3); m.material.opacity = v >= 1 ? 0 : Math.min(1, (u - d.lag) * 6);
    }
    if (u > 1.5) { scene.remove(G.roll); G.leaves.forEach(m => scene.remove(m)); gusts.splice(i, 1); burst(G.to, 0x8fd08a); }
  }
}
/* The directed camera for the minute and the scroll: a beat turns the view to what it is about; a tap on the floor or a drag
   hands the view back. */
let directCam = null, directK = 0;
function directView(key, tall) {
  const P = new THREE.Vector3(), F = new THREE.Vector3();
  const front = new THREE.Vector3(Math.sin(portal.rotation.y), 0, Math.cos(portal.rotation.y));
  if (key === "hearth") { F.copy(HEARTH_AT).setY(0.55); const d = new THREE.Vector3(-HEARTH_AT.x, 0, -HEARTH_AT.z).normalize(); P.copy(F).addScaledVector(d, tall ? 3.0 : 2.6).setY(tall ? 1.85 : 1.6); P.x += 0.5; }
  else if (key === "door") { F.copy(PORTAL_AT).setY(0.95); P.copy(F).addScaledVector(front, tall ? 3.35 : 3.0).setY(tall ? 1.75 : 1.55); }
  else if (key === "wake") { // behind you on the cushion, the doorway grown over ahead
    const c = wake.group.position, d = PORTAL_AT.clone().sub(c).setY(0).normalize();
    P.copy(c).addScaledVector(d, tall ? -2.5 : -2.2).setY(tall ? 1.85 : 1.6); F.copy(c).addScaledVector(d, 1.6).setY(0.85);
  }
  else if (key === "shelf") { F.copy(shelf.at).setY(shelf.at.y + 0.05); P.copy(F).add(new THREE.Vector3(Math.sin(shelf.face) * (tall ? 1.55 : 1.4) + 0.25, tall ? 0.3 : 0.25, Math.cos(shelf.face) * (tall ? 1.55 : 1.4))); }
  else if (key === "gust") { const k = Math.min(1, (performance.now() - directCam.t0) / 2600); F.copy(directCam.from).lerp(PORTAL_AT.clone().setY(1.0), k * k * (3 - 2 * k)); P.set(0.25, tall ? 2.2 : 2.0, tall ? 3.0 : 2.9); }
  else { const v = tall ? ROOM_VIEW.phone : ROOM_VIEW.wide; P.copy(v[0]); F.copy(v[1]); }
  return [P, F];
}

/* What a tap on the nook does while the minute (or a step left for later) waits: true when it was the minute's. */
function minuteTap(key) {
  if (!garden || !isHome(garden) || storeDown) return false;
  const st = mstate(), beat = minuteBeat();
  if (key === "hearth" && !st.hearthLit) {
    if (st.emberGlows && (beat === "ember" || !minuteOn() || st.skipped.ember)) { standUp(); const d = meState.pos.clone().sub(HEARTH_AT).setY(0); if (d.length() > 1.6) meState.target = pushOut(HEARTH_AT.clone().add(d.normalize().multiplyScalar(1.4))); minuteAct("ember"); }
    return true;
  }
  if (key === "portal" && minuteOn()) {
    if (st.step === "vine" && beat === "vine") { standUp(); burst(PORTAL_AT.clone().setY(1.0), 0x8fd08a); minuteAct("vine"); }
    else toast("The vines fall as you learn the room.");
    return true;
  }
  return false;
}
function minuteHint() {
  const beat = mclock.beat, st = mstate();
  if (!beat) return "";
  if (beat === "hope" && !mirrorSpot) return "Your mirror is still in your satchel. Set it down to look into it, or leave it for later.";
  return MINUTE_PROMPTS[beat] || "";
}
/* Your shelf, tapped: the blank scroll to write on, a sealed one to open, a keepsake to read again. */
function shelfTap(kind, i) {
  const sh = myShelf();
  if (kind === "blank") { if (minuteOn()) { toast("Your first scroll. You can write it once the doorway opens."); return; } openPaper("write", { fromShelf: true }); return; }
  if (kind === "sealed" && sh.sealed[i]) { openPaper("read", sh.sealed[i]); return; }
  if (kind === "keep" && sh.keepsakes[i]) openPaper("keep", sh.keepsakes[i]);
}

/* ---------- sound: starts on the first tap, if it is on ---------- */
const ambient = createAmbient();
function soundLabel() { const b = $("#soundBtn"); if (!b) return; b.textContent = ambient.on ? "Sound on" : "Sound off"; b.setAttribute("aria-pressed", ambient.on ? "true" : "false"); }
addEventListener("pointerdown", () => ambient.wake(), { capture: true });
document.addEventListener("visibilitychange", () => { document.hidden ? ambient.pause() : ambient.resume(); });
soundLabel();

/* ---------- clicks, forms ---------- */
document.addEventListener("click", async ev => {
  const b = ev.target.closest("[data-act],[data-open],[data-close]");
  if (!b) return;
  if (b.hasAttribute("data-close")) { closeSheet(); return; }
  if (b.dataset.open) { openSheet(b.dataset.open, b.dataset.id); return; }
  const a = b.dataset.act, id = b.dataset.id;
  if (a === "satOpen") { setSatchel(true); return; }
  if (a === "minuteLater") { if (mclock.beat && SKIPPABLE.includes(mclock.beat)) minuteAct(mclock.beat, "skip"); return; }
  if (a === "hopeSkip") { closeSheet(); if (!mstate().skipped.hope) minuteAct("hope", "skip"); return; }
  if (a === "writeScroll") { openPaper("write", { room: gardenId }); return; }
  if (a === "satClose") { setSatchel(false); return; }
  if (a === "satArm") { armed = armed === id ? null : id; refreshHud(); return; }
  if (a === "spotLift") { await spotTap(id); selected = null; refreshHud(); return; }
  if (a === "sound") { ambient.toggle(); soundLabel(); return; }
  if (a === "shot") { shot = null; shotWanted = true; closeSheet(); return; } // the next frame reads the canvas, then opens the sheet
  if (a === "hFeel") { hd = { ...hd, feel: id, move: null, glow: null }; renderSheet(); return; }
  if (a === "hMove") { hd.move = id; renderSheet(); return; }
  if (a === "hGlow") { hd.glow = +id || null; renderSheet(); return; }
  if (a === "hmHold") { hmHold(id); return; }
  if (a === "hmLantern") { hmLight(); return; }
  if (a === "hmHang") { const h = hm && hm.hooks && hm.hooks.find(x => x.id === id); if (h) hmSend(h); return; }
  if (a === "hmStand") { hmStand(); return; }
  if (a === "teaPour") { teaPour(); return; }
  if (a === "teaSip") { teaSip(); return; }
  if (a === "fsLay") { fsLay(); return; }
  if (a === "fsStay") { fsStay(); return; }
  if (a === "hmBreathe") return; // a press held on it, not a click (hmEl's own listeners)
  if (a === "move") { const it = view().items.get(id); const r = moveRight(it); if (!r) return; placing = { id, ask: r === "shared" }; selected = null; refreshHud(); toast(r === "shared" ? "Tap the floor where you would like it." : "Tap the floor where it should stand, or drag it."); return; }
  if (a.startsWith("pace:")) { setPace(a.slice(5)); if (gardenId && isMember(view().g)) { myPrivate.captions = getPace(); savePriv(); } renderSheet(); return; }
  if (a === "lanternCancel") { placing = null; refreshHud(); return; }
  if (a === "lookPick") { const [k, v] = id.split(":"); lookDraft = { ...lookDraft, [k]: v }; renderSheet(); ensureMyBody().catch(() => {}); return; }
  if (a === "lookRandom") { lookDraft = randomLook(); renderSheet(); ensureMyBody().catch(() => {}); return; }
  if (a === "lookPart") { mirrorPart = id; renderSheet(); return; }
  if (a === "checkFeel") { if (walk) { const l = $("#cLine"); if (l) walk.line = l.value; walk.feel = walk.feel === id ? null : id; } renderSheet(); return; }
  if (a === "waveBack") { if (walk) { walk.step = Math.max(-1, walk.step - 1); renderSheet(); } return; }
  if (a === "waveNext" && walk && walk.step < 6) { walk.step++; renderSheet(); return; }
  if (a === "emberKeep") { closeSheet(); toast("Kept. It waits under Spirits, in your homeroom, until you give it."); return; }
  if (a === "goHome") { goRoom(null); return; }
  if (a === "goRoom") { goRoom(id); return; }
  if (a === "goDojo") { walkToTriangleWorkshop(); return; }
  // a spark's link, found again from the homeroom (pt1-two-player-check: the link got lost after the first send)
  if (a === "sparkAgain") {
    const r = ((list && list.gardens) || []).find(x => x.id === id);
    try { await sparkLink({ id, name: r ? roomName(r) : "them" }, ""); toast(navigator.share ? "The link is ready to send." : "The link is on your clipboard."); }
    catch { toast("The link did not come. Go into the room and use Invite."); }
    return;
  }
  if (a === "through") { if (portalTo) walkThrough(portalTo.id, portalTo.invite); return; }
  if (a === "next") {
    if (id.startsWith("room:")) { goRoom(id.slice(5)); return; }
    if (id === "coins") { closeSheet(); if (window.__between.coins) window.__between.coins.go(); return; } // a move kept at the coin table, or a cast left face up
    if (id === "tend") { closeSheet(); selected = "between"; meState.target = pushOut(BETWEEN_AT.clone().add(new THREE.Vector3(0, 0, 1.1))); standUp(); refreshHud(); return; }
    openSheet(id === "invitations" && !isHome(view().g) ? "invite" : id); return;
  }
  const V = view(); const g = V.g;
  b.disabled = true;
  try {
    if (a.startsWith("ask:")) await itemAct(id, "ask", { act: a.slice(4), text: "" });
    else if (["propose", "withdraw", "agree", "pendingYes", "pendingNo", "pendingWithdraw", "receive", "decline", "open", "compostOwn"].includes(a)) await itemAct(id, a);
    else if (a === "notyet") await itemAct(id, "notyet", "");
    else if (a === "hKeep") await keepEmber();
    else if (a === "lanternHere") { if (placing) await moveItem(placing.id, spotAhead(0.9)); }
    else if (a === "moveYes" || a === "moveNo") await moveAnswer(id, a === "moveYes");
    else if (a === "lanternBack" || a === "lanternCompost") await unmakeLantern(id, a === "lanternCompost");
    else if (a === "lanternYes") { await op("items/" + id, "update", { yes: { [me]: now() }, history: lanternLog("welcomed") }); await touch(); toast("Welcomed. It lights your home together."); }
    else if (a === "lanternNo") await op("items/" + id, "update", { yes: { [me]: null } });
    else if (a === "checkin") {
      await op("items/i" + hkey(), "set", { kind: "checkin", text: "Came by to check in.", by: me, at: now(), status: g.phase === "spark" ? "kept" : "offered", spark: g.phase === "spark", sealed: false, yes: {}, opened: {}, pending: null, pos: spotAhead(1.1), history: hist("came by to check in") });
      await touch(); toast(g.phase === "spark" ? "The spark took it in." : "Your check-in waits on a stone for their yes.");
    }
    else if (a === "join") await op("garden/main", "update", { joinRequest: { uid: me, at: now() } });
    else if (a === "unjoin") await op("garden/main", "update", { joinRequest: null });
    else if (a === "welcomeKeep" || a === "welcomeCompost") {
      // Wendell, 2026-10-16: history starts when the other person joins; the spark becomes a personal spirit or composts.
      const u = g.joinRequest && g.joinRequest.uid; if (!u) return;
      const sparkItems = [...V.items.entries()].filter(([, i]) => i.spark);
      const sparkName = betweenName(V.items) || "The spark toward " + g.setup.who;
      try { await rawOp({ path: "data/users/" + me + "/spark", op: "set", data: { at: now(), choice: a === "welcomeKeep" ? "spirit" : "composted", name: sparkName,
        items: sparkItems.map(([, i]) => ({ kind: i.kind, text: i.text, at: i.at, status: i.status })) } }); } catch {}
      for (const [id] of sparkItems) await op("items/" + id, "delete");
      await op("garden/main", "update", { members: { [u]: { joinedAt: now() } }, joinRequest: null, phase: "between", betweenSince: now(), lastTendedAt: now() });
      await op("items/i" + hkey(), "set", { kind: "checkin", text: "The Between began.", by: me, at: now(), status: "kept", spark: false, sealed: false, yes: { [me]: true, [u]: true }, opened: {}, pending: null, history: hist("welcomed them in; the Between began") });
      if (a === "welcomeKeep") await op("spirits/s" + hkey(), "set", { owner: me, name: sparkName.replace(/^The spark/, "Spark"), element: "Fire", form: "fox", fromSpark: true,
        note: "Your spark from before they joined. It stays yours.", at: now(), stay: { x: BETWEEN_AT.x + 1.6, z: BETWEEN_AT.z + 1.2, at: now(), until: now() + 15000 } });
      closeSheet(); toast(a === "welcomeKeep" ? "The Between began. Your spark walks beside it as your own spirit." : "The Between began. Your spark composted.");
    }
    else if (a === "notjoin") await op("garden/main", "update", { joinRequest: null });
    else if (a === "bringDaemon") {
      await op("daemons/d" + hkey(), "set", { owner: me, which: id, at: now(), stay: { x: spotAhead(1.2).x, z: spotAhead(1.2).z, at: now(), until: now() + 20000 }, history: hist("brought the " + DAEMONS[id][0] + " into the garden") });
      await touch(); closeSheet(); toast(`Your ${DAEMONS[id][0]} came in with you.`);
    }
    else if (a === "callOver") {
      const [type, did] = [id.slice(0, 1), id.slice(2)];
      const col = type === "s" ? "spirits" : "daemons";
      const w = walkers.get(id);
      const from = w && w.holder ? { x: w.holder.position.x, z: w.holder.position.z } : null;
      const spot = spotAhead(1.2);
      if (w && from) w.lastFree = new THREE.Vector2(from.x, from.z);
      await op(col + "/" + did, "update", { stay: { x: spot.x, z: spot.z, at: now(), until: now() + 60000, fx: from && +from.x.toFixed(2), fz: from && +from.z.toFixed(2) } });
    }
    else if (a === "sendHome") {
      const [type, did] = [id.slice(0, 1), id.slice(2)];
      const d = type === "s" ? V.spirits.get(did) : null;
      await op((type === "s" ? "spirits/" : "daemons/") + did, "delete");
      if (d && d.homeSpirit) await homeCameBack(d.homeSpirit);
      if (d && d.homeSpirit) toast(`${d.name} went home to your homeroom.`);
    }
    else if (a === "greet") {
      const w = walkers.get(id);
      if (w && w.holder) burst(w.holder.position, hueOf(me, g));
      myWave = now(); pollSoon();
      toast("It noticed you.");
    }
    else if (a === "sit") { const i = selected && selected.startsWith("seat:") ? seatId(selected.slice(5)) : mySeat(); if (seatBy(i) && canSitOn(i)) sitOn(i); }
    else if (a === "sitHearth") sitAtHearth();
    else if (a === "stand") { const st = seatBy(meState.seatWant); standUp(); if (st) meState.target = pushOut(new THREE.Vector3(st.x - Math.sin(st.yaw) * 0.7 + (typeof st.id === "number" ? Math.sign(st.x) * 0.4 : 0), 0, st.z - Math.cos(st.yaw) * 0.7)); } // up, and a step back off the cushion
    else if (a === "wave") {
      burst(meState.pos.clone().setY(groundY(meState.pos.x, meState.pos.z)), hueOf(me, g));
      if (meState.body) meState.body.wave(performance.now() / 1000);
      myWave = now(); pollSoon();
    }
    else if (a === "show") {
      const pic = readPic(); ls.set("between.pic." + me, pic);
      await op("shown/" + me, "set", { between: pic.between, other: pic.other, at: now() }); await touch();
    }
    else if (a === "unshow") await op("shown/" + me, "delete");
    else if (a === "endYes") {
      const e = g.ending;
      if (e.after === "change") {
        await op("garden/main", "update", { ending: null, setup: { kind: e.newKind }, lastTendedAt: now() });
        await op("items/i" + hkey(), "set", { kind: "checkin", text: `You both agreed to change this garden into one for ${e.newKind.toLowerCase()}.`, by: me, at: now(), status: "kept", spark: false, sealed: false, yes: {}, opened: {}, pending: null, history: hist("agreed to change the garden's kind to " + e.newKind.toLowerCase()) });
        toast("The garden now holds a different kind of relationship. Its history stays.");
      } else await op("garden/main", "update", { ending: null, phase: "closed", closedAt: now() });
    }
    else if (a === "endNo" || a === "endWithdraw") await op("garden/main", "update", { ending: null });
    else if (a === "copy") await takeCopy();
    else if (a === "inviteLink") {
      const link = location.origin + "/ontology-game/between?g=" + encodeURIComponent(gardenId) + "&invite=" + encodeURIComponent(myInvite);
      try { await navigator.clipboard.writeText(link); toast("The invitation link is on your clipboard."); }
      catch { window.prompt("Copy the invitation link:", link); }
    }
    else if (a === "lookKeep") { await keepLook(); lookDraft = null; closeSheet(); toast("Saved. Each of your rooms shows you this way now."); }
    else if (a === "waveNext") await finishWave();
    else if (a === "emberGive") await giveEmber(id);
    else if (a === "emberStone") await emberStone();
    else if (a === "caveCall") await callFromCave(id);
    else if (a === "bringHome") await bringHomeSpirit(id);
    else if (a === "spiritBack") await spiritBack(id);
    else if (a === "goalDrop") { await homeOp({ goals: { [id]: null } }); renderSheet(); }
    else if (a === "setStyle") {
      const st = styleOf(id);
      if (styleShared(g)) {
        await op("garden/main", "update", { styleAsk: { by: me, style: st.id, at: now() }, history: hist("asked to change how the room looks: " + st.name.toLowerCase()) });
        renderSheet(); toast(`Asked. It changes to ${st.name} when ${nameOf(other(g), g)} says yes.`);
      } else {
        await op("garden/main", "update", { style: st.id, ...(isHome(g) ? {} : { history: hist("changed how the room looks: " + st.name.toLowerCase()) }) });
        renderSheet(); toast(isHome(g) ? st.name + "." : st.name + ". They see it when they come in.");
      }
    }
    else if (a === "styleYes" || a === "styleNo" || a === "styleBack") {
      const ask = g.styleAsk; if (!ask) return;
      const nm = styleOf(ask.style).name.toLowerCase();
      if (a === "styleYes") await op("garden/main", "update", { style: ask.style, styleAsk: null, history: hist("said yes to the room looking: " + nm) });
      else await op("garden/main", "update", { styleAsk: null, ...(a === "styleNo" ? { history: hist("said not now to the room looking: " + nm) } : {}) });
      await touch(); refreshList(); renderSheet();
      toast(a === "styleYes" ? "Changed, with both your yeses." : a === "styleNo" ? "Not now. The room stays as it is." : "Taken back.");
    }
    else if (a === "invAnswer") {
      const [rid, iid, ans] = id.split("|");
      const data = { invitations: { [iid]: { answer: ans, answeredAt: now() } } };
      if (rid === gardenId) await op("garden/main", "update", data); else await api("/api/between/" + rid + "/doc", { path: "garden/main", op: "update", data });
      toast(ans === "yes" ? "You said yes. Go and sit with them." : ans === "later" ? "You asked for another time." : "You said no. That is yours to say.");
      await refreshList(); renderSheet();
    }
    else if (a === "invBack") { await op("garden/main", "update", { invitations: { [id]: null } }); renderSheet(); }
    else if (a === "joinShare" || a === "joinCopy") {
      const link = location.origin + "/ontology-game/between?g=" + encodeURIComponent(gardenId) + "&invite=" + encodeURIComponent(myInvite);
      const note = (($("#jNote") || {}).value || "").trim();
      const text = (note ? note + "\n\n" : "") + "Come into the Between with me: " + link;
      if (a === "joinShare") { try { await navigator.share({ title: "The Between", text }); } catch {} }
      else { try { await navigator.clipboard.writeText(text); toast("The link and your note are on your clipboard."); } catch { window.prompt("Copy the invitation:", text); } }
    }
    else if (a === "cast") await castSpell(g, id);
    else if (a === "letgo") { await op("garden/main", "update", { phase: "closed", closedAt: now() }); closeSheet(); }
    else if (a === "quietLeave") {
      ls.del("between.pic." + me);
      if (V.shown.get(me)) await op("shown/" + me, "delete");
      await op("garden/main", "update", { phase: "closed", closedAt: now(), ending: null, joinRequest: null });
      closeSheet();
    }
  } catch (e) { toast("That did not save. Check your connection and try again."); }
  finally { b.disabled = false; refresh(); }
});
document.addEventListener("change", async ev => {
  const k = ev.target.dataset && ev.target.dataset.keep; if (!k) return;
  const keeps = new Set(myPrivate.keeps || []); ev.target.checked ? keeps.add(k) : keeps.delete(k);
  myPrivate.keeps = [...keeps];
  try { await rawOp({ path: privPath(), op: "set", data: { ...myPrivate } }); } catch {}
});
function readPic() { return { between: ($("#pBetween") || {}).value || "", other: ($("#pOther") || {}).value || "" }; }
document.addEventListener("submit", async ev => {
  ev.preventDefault();
  const f = ev.target;
  const btn = f.querySelector("button[type=submit]"); if (btn) btn.disabled = true;
  try {
    if (f.id === "setupForm") {
      const who = $("#sWho").value.trim(); if (!who) return;
      const lk = lookOf(me);
      const data = { v: 1, startedBy: me, startedAt: now(), setup: { who, kind: $("#sKind").value, hopes: $("#sHope").value.trim() }, style: $("#sStyle").value,
        looks: lk ? { [me]: lk } : {}, members: { [me]: { joinedAt: now() } }, joinRequest: null, phase: "spark", lastTendedAt: now(), ending: null };
      // From the homeroom (or another room), a new room is its own garden: plant it and go in.
      if (gardenId) { const j = await api("/api/between", { data }); goRoom(j.id); return; }
      await op("garden/main", "set", data);
      awaySince = now(); closeSheet();
    } else if (f.id === "offerForm") {
      const kind = $("#oKind").value, text = $("#oText").value.trim();
      if (!text) { toast("Write a line first. A single word is enough."); return; }
      await addItem(kind, text, kind === "charge");
      closeSheet();
      toast(view().g.phase === "spark" ? "The spark took it in." : "Set down. It waits for their yes.");
    } else if (f.id === "agForm") {
      const text = $("#aText").value.trim(); if (!text) { toast("Write the agreement first."); return; }
      await addItem("agreement", text, false); closeSheet(); toast("Planted as a draft. Walk up to it to propose it.");
    } else if (f.id === "rwForm") {
      const t = $("#rwText").value.trim(); if (t) await itemAct(sheetArg, "edit", t); closeSheet();
    } else if (f.id === "picForm") {
      ls.set("between.pic." + me, readPic()); toast("Kept in this browser only.");
    } else if (f.id === "spiritForm") {
      const name = $("#spName").value.trim(); if (!name) return;
      const spot = spotAhead(1.2), home = isHome(view().g);
      await op("spirits/s" + hkey(), "set", { owner: me, name, element: $("#spEl").value, form: $("#spForm").value, note: $("#spNote").value.trim(), at: now(),
        care: { ...careOf(null), at: now() }, stay: { x: spot.x, z: spot.z, at: now(), until: now() + 20000 }, history: hist(home ? "welcomed a spirit home" : "brought a spirit to visit", name) });
      await touch(); closeSheet(); if (home) toast(name + " lives in your homeroom now.");
    } else if (f.id === "goalForm") {
      const text = $("#gText").value.trim(); if (!text) { toast("Write the goal first. A few words are enough."); return; }
      const room = $("#gRoom").value || null;
      await homeOp({ goals: { ["g" + hkey()]: { text, room, at: now() } } });
      $("#gText").value = ""; renderSheet(); toast("Kept in your homeroom. Only you see it.");
    } else if (f.id === "checkForm") {
      if (!walk || !walk.feel) { toast("Choose what is here first."); return; }
      walk.line = $("#cLine").value.trim().slice(0, 280); walk.step = 0; renderSheet();
    } else if (f.id === "inviteForm") {
      const g = view().g; if (members(g).length < 2) return;
      const w = $("#sWhen").value, when = w ? new Date(w).getTime() : null;
      await op("garden/main", "update", { invitations: { ["s" + hkey()]: { by: me, kind: "sit", when: Number.isFinite(when) ? when : null, note: $("#sNote").value.trim(), at: now() } }, history: hist("invited you to come and sit") });
      await touch(); renderSheet(); toast("Sent. They answer yes, another time, or no.");
    } else if (f.id === "endForm") {
      await op("garden/main", "update", { ending: { proposedBy: me, at: now(), after: $("#eAfter").value, newKind: $("#eKind").value, why: $("#eWhy").value.trim() } });
    }
  } catch { toast("That did not save. Check your connection and try again."); }
  finally { if (btn) btn.disabled = false; refresh(); }
});
document.addEventListener("change", ev => {
  if (ev.target.id !== "oKind") return;
  const h = $("#oHint"); if (!h) return;
  const g = view().g;
  if (ev.target.value === "charge" && g.phase !== "spark") h.textContent = "A worked-through charge arrives sealed. They choose whether to open it, and can let it pass unread.";
  else h.textContent = g.phase === "spark" ? "While it is a spark, what you bring feeds it straight away." : "It waits on a stone where you stand. It changes the Between only when the other person walks up and says yes.";
});
document.addEventListener("change", ev => {
  if (ev.target.id === "hCharge") hd.charge = ev.target.value; // a choice for the sitting only: the ember never records it
});
addEventListener("keydown", e => { if (e.key === "Escape" && sheetName && (sheetName !== "setup" || garden)) closeSheet(); });

/* ---------- the homeroom's private doc and the room list ---------- */
const homePath = () => "data/users/" + me + "/home";
function setHome(doc) {
  myHome = { ...(doc || {}) };
  if (list && list.home) Object.assign(list.home, { look: myHome.look ?? null, lastCheckin: myHome.lastCheckin ?? null, goals: goalsList().map(([id, x]) => ({ id, ...x })) });
}
/* Written straight to the homeroom, from wherever you stand: the server keeps the home doc only there. */
async function homeOp(data) {
  if (!homeId) throw fail("invalid_argument", "no homeroom");
  const j = await api("/api/between/" + homeId + "/doc", { path: homePath(), op: "update", data });
  setHome(j.doc); refresh();
}
async function fetchList() {
  const r = await fetch("/api/between", { credentials: "same-origin", cache: "no-store" });
  if (r.status === 401) throw fail("unauthenticated");
  if (!r.ok) throw fail("unavailable", "the garden list answered " + r.status);
  const j = await r.json();
  me = me || j.me; names[j.me] = j.name;
  homeId = j.home ? j.home.id : homeId;
  list = j;
  if (j.home && !Object.keys(myHome).length) myHome = { look: j.home.look, lastCheckin: j.home.lastCheckin, goals: Object.fromEntries((j.home.goals || []).map(({ id, ...x }) => [id, x])) };
  return j;
}
let listing = null;
function refreshList() {
  if (storeDown || listing) return listing;
  listing = fetchList().then(() => refresh(), () => {}).finally(() => { listing = null; });
  return listing;
}
setInterval(() => { if (!document.hidden) refreshList(); }, 30000);
async function keepLook() {
  const t = lookText(lookDraft);
  await homeOp({ look: t });
  // and into each room, so the other person sees you as you made yourself (a member writes only their own key)
  const rooms = ((list && list.gardens) || []).filter(r => r.phase !== "closed");
  await Promise.all(rooms.map(r => r.id === gardenId ? op("garden/main", "update", { looks: { [me]: t } }) : api("/api/between/" + r.id + "/doc", { path: "garden/main", op: "update", data: { looks: { [me]: t } } }).catch(() => {})));
}
function goRoom(id) { if (id) { walkThrough(id); return; } markSeen(); location.href = ROOM_URL(null); }
/* ---------- the check-in's ember, and the spirits it feeds (part 4) ---------- */
async function finishWave() {
  const w = walk; if (!w || !w.feel || w.step !== 6) return;
  const at = now(), eid = "e" + hkey();
  await homeOp({ checkins: { ["c" + hkey()]: { feel: w.feel, line: w.line || null, at, wave: WAVE_STEPS.length } }, lastCheckin: at, embers: { [eid]: { feel: w.feel, at, given: null } } });
  if (walk !== w) return;
  w.step = 7; w.eid = eid;
  burst(meState.pos.clone().setY(groundY(meState.pos.x, meState.pos.z)), elHex(w.feel));
  renderSheet();
}
/** Give an ember (the walk's, or the oldest waiting) to a spirit: `ref` is "home:<id>" or "room:<id>". */
async function giveEmber(ref) {
  const [where, sid] = [ref.slice(0, 4), ref.slice(5)];
  const eid = walk && walk.eid && walk.step === 7 ? walk.eid : (embersWaiting()[0] || [])[0];
  const e = eid && (myHome.embers || {})[eid];
  if (!e || e.given) { toast("No ember waits. Checking in leaves one."); return; }
  const V = view(), at = now();
  const d = where === "home" ? homeSpirits().get(sid) : V.spirits.get(sid);
  if (!d) return;
  const care = feed(d.care, e.feel, d.element, at);
  if (where === "home") await homeDocOp("spirits/" + sid, "update", { care });
  else {
    await op("spirits/" + sid, "update", { care });
    if (d.homeSpirit) await homeDocOp("spirits/" + d.homeSpirit, "update", { care }).catch(() => {});
  }
  await homeOp({ embers: { [eid]: { given: { spirit: sid, room: where === "room" ? gardenId : null, at } } } });
  const wk = walkers.get("s:" + sid) || [...walkers.values()].find(x => x.type === "spirit" && x.doc && x.doc.homeSpirit === sid);
  if (wk && wk.holder) { burst(wk.holder.position, elHex(e.feel)); burst(wk.holder.position.clone(), ELEMENTS[d.element] ?? 0xffe2b0); }
  const word = careNow(care, at).word;
  if (walk && walk.step === 7) { walk.given = d.name; renderSheet(); }
  else { renderSheet(); }
  toast(`${d.name} took the ember. ${CARE_WORDS[word]}.`);
}
/** In a room: the ember goes onto a stone for the other person, the old "came by to check in". */
async function emberStone() {
  const w = walk, g = view().g; if (!w || !w.eid || !g || isHome(g)) return;
  const iid = "i" + hkey();
  await op("items/" + iid, "set", { kind: "checkin", text: "Came by to check in.", by: me, at: now(), status: g.phase === "spark" ? "kept" : "offered", spark: g.phase === "spark", sealed: false, yes: {}, opened: {}, pending: null, pos: spotAhead(1.1), history: hist("came by to check in") });
  await homeOp({ embers: { [w.eid]: { given: { stone: iid, room: gardenId, at: now() } } } });
  await touch(); closeSheet();
  toast(g.phase === "spark" ? "The spark took it in." : "Your ember waits on a stone for their yes. What you felt stays with you.");
}
async function callFromCave(rid) {
  const st = caveStore(); const r = st && st.get(rid); if (!r || !isHome(view().g)) return;
  const sid = "s" + hkey(), spot = spotAhead(1.2), name = String(r.name || "A spirit from the caves").slice(0, 60);
  await op("spirits/" + sid, "set", { owner: me, name, element: elementOf(r.element), form: r.form === "tortoise" ? "tortoise" : "fox",
    ...(r.family ? { family: String(r.family).slice(0, 60) } : {}), fromCave: String(r.id).slice(0, 80), note: "Came up from the caves.", at: now(),
    care: { ...careOf(null), at: now() }, stay: { x: spot.x, z: spot.z, at: now(), until: now() + 20000 }, history: hist("called a spirit up from the caves", name) });
  try { st.place(r.id, { home: sid, brought: null }); } catch {}
  renderSheet(); toast(name + " came up from the caves and lives here now.");
}
async function bringHomeSpirit(hid) {
  const d = homeSpirits().get(hid), g = view().g; if (!d || !g || isHome(g)) return;
  const spot = spotAhead(1.2), at = now();
  await op("spirits/s" + hkey(), "set", { owner: me, name: d.name, element: d.element, form: d.form || "fox", ...(d.family ? { family: d.family } : {}),
    care: d.care || { ...careOf(null), at }, homeSpirit: hid, note: d.note || "", at, stay: { x: spot.x, z: spot.z, at, until: at + 20000 }, history: hist("brought a spirit to visit", d.name) });
  await homeDocOp("spirits/" + hid, "update", { away: { room: gardenId, at } });
  const st = caveStore(); if (d.fromCave && st) { try { st.place(d.fromCave, { brought: gardenId }); } catch {} }
  await touch(); closeSheet(); toast(`${d.name} came in with you from your homeroom.`);
}
/** A homeroom spirit's visit is over: it is home again. */
async function homeCameBack(hid) {
  const d = homeSpirits().get(hid);
  await homeDocOp("spirits/" + hid, "update", { away: null }).catch(() => {});
  const st = caveStore(); if (d && d.fromCave && st) { try { st.place(d.fromCave, { brought: null }); } catch {} }
}
/** From the homeroom: call home a spirit still visiting a room (its copy there goes, if it can be found). */
async function spiritBack(hid) {
  const d = homeSpirits().get(hid); if (!d || !d.away || !d.away.room) return;
  try {
    const j = await api("/api/between/" + d.away.room + "/poll", { presence: null });
    for (const [rid, x] of Object.entries(j.spirits || {})) if (x && x.owner === me && x.homeSpirit === hid) await api("/api/between/" + d.away.room + "/doc", { path: "spirits/" + rid, op: "delete", data: null });
  } catch {}
  await homeCameBack(hid); renderSheet(); toast(d.name + " is home.");
}
async function castSpell(g, id) {
  const sp = SPELLS.find(x => x.id === id); if (!sp) return;
  const at = spellAt(g, sp); if (!castable(sp, at).ok || at.mineWaiting) return;
  const here = meState.pos.clone().setY(DAIS_Y + 0.4);
  if (sp.kind === "solo") { burst(here, 0xbff0c0); toast("You settle. The light of the hollow slows with your breath."); return; }
  if (sp.kind === "dual") {
    burst(here, hueOf(me, g)); for (const p of othersHere()) burst(p.pos.clone().setY(DAIS_Y + 0.4), hueOf(p.uid, g));
    await op("garden/main", "update", { history: hist("breathed together with you") }); await touch();
    toast("You breathe at one pace. The light between you steadies."); return;
  }
  const left = openSpell(g, id);
  if (left && left[1].by !== me) {
    await op("garden/main", "update", { spells: { [left[0]]: { done: { by: me, at: now() } } }, history: hist("took up the light you left") }); await touch();
    burst(here, 0xffd27a); toast("You took up their light. It is shared now.");
  } else {
    await op("garden/main", "update", { spells: { ["l" + hkey()]: { spell: id, by: me, at: now(), done: null } }, history: hist("left a light on the cushions") }); await touch();
    burst(here, 0xffd27a); toast("Your light is lit. It waits until they sit and take it up.");
  }
}

const privPath = () => "data/users/" + me + "/garden";
function savePriv() { if (gardenId && isMember(view().g)) rawOp({ path: privPath(), op: "set", data: { ...myPrivate } }).catch(() => {}); }
function markSeen() {
  if (!gardenId || !me || !gardenLoaded || !isMember(view().g)) return;
  myPrivate.lastSeen = now();
  // The page may be closing: a beacon still arrives when a fetch would be cut off.
  try { navigator.sendBeacon("/api/between/" + gardenId + "/doc", new Blob([JSON.stringify({ path: privPath(), op: "set", data: { ...myPrivate } })], { type: "application/json" })); } catch {}
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") markSeen(); });
addEventListener("pagehide", markSeen);

/* ---------- the room's style: its light and weather (br-style-is-the-place) ---------- */
let styleNow = null; // the style the room shows now; syncRoom sets it (applyRoom applies it with the placements)

/* ---------- one refresh for everything the store drives ---------- */
let refreshQueued = false;
function refresh() {
  if (refreshQueued) return; refreshQueued = true;
  queueMicrotask(() => {
    refreshQueued = false;
    const V = view(); const g = V.g;
    if (g && g.phase !== "closed") { const s = satisfaction(V.items); look = { phase: g.phase, state: stateOf(s), stale: isStale(g), sat: s }; }
    else look = { phase: "spark", state: "steadied", stale: true, sat: 2 };
    between.visible = !!g && !isHome(g);
    syncRoom(); syncShelf();
    mirror.visible = mirrorShown();
    syncThings(); syncWalkers(); hmSync();
    if (me && gardenLoaded) ensureMyBody().catch(() => {});
    refreshHud();
    if (sheetName && !["offer", "agreement", "rewrite", "spirit", "setup"].includes(sheetName)) renderSheet();
  });
}

/* ===================================================================================================
   Boot
   =================================================================================================== */
/* ===================================================================================================
   The store: one poll brings the garden and who is here; it runs every few seconds while the page is open
   (bh-async-first, six-faces-council 2026-10-17). No live channel: a write shows here at once and on the
   other screen at its next poll.
   =================================================================================================== */
let pollTimer = null, polling = false, pollAgain = false, stopped = false, roomOk = null, storeDown = false;
function pollSoon() { if (!gardenId || stopped) return; if (polling) { pollAgain = true; return; } clearTimeout(pollTimer); pollTimer = setTimeout(poll, 120); }
function toLogin() { stopped = true; location.href = "/login?returnTo=" + encodeURIComponent(location.pathname + location.search); }
function stop(msg) {
  stopped = true; clearTimeout(pollTimer);
  $("#loadMsg").textContent = msg; $("#loadStep").textContent = ""; $("#loading").hidden = false; $("#hud").hidden = true;
}
let lastSig = "";
function take(j) {
  me = j.me;
  // Each poll brings the whole garden; only a change redraws it (a redraw rebuilds any open sheet).
  const { peers: peerList, ...rest } = j;
  onPeers(peerList);
  const sig = JSON.stringify(rest);
  if (sig === lastSig) return;
  lastSig = sig;
  garden = j.garden || null;
  for (const [name, map] of [["items", items], ["spirits", spirits], ["daemons", daemons], ["shown", shown]]) {
    map.clear(); for (const [id, d] of Object.entries(j[name] || {})) map.set(id, d);
  }
  for (const [id, d] of localItems) items.set(id, d);
  Object.assign(names, j.names || {});
  myInvite = j.invite || null;
  myPouch = j.mine && j.mine.pouch && typeof j.mine.pouch === "object" ? j.mine.pouch : null;
  if (isHome(garden) && j.mine && j.mine.home && typeof j.mine.home === "object") setHome(j.mine.home);
  gardenLoaded = true;
  refresh();
}
async function poll() {
  clearTimeout(pollTimer);
  if (!gardenId || stopped) return;
  polling = true;
  try { take(await api("/api/between/" + gardenId + "/poll", { presence: document.hidden ? null : presenceNow(), invite })); }
  catch (e) {
    if (e.code === "unauthenticated") return toLogin();
    if (e.code === "permission_denied" || e.code === "not_found") return stop(e.message || "This garden is not open to you.");
  } finally {
    polling = false;
    if (!stopped) { const wait = pollAgain ? 60 : document.hidden ? 20000 : peers.size ? 2500 : 5000; pollAgain = false; pollTimer = setTimeout(poll, wait); }
  }
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") pollSoon(); });

/* ===================================================================================================
   Boot
   =================================================================================================== */
let booted = false;
(async function boot() {
  loadStep("building the hollow");
  const bq = new URLSearchParams(location.search), bWant = bq.get("g");
  let bThrough = null; try { bThrough = sessionStorage.getItem(THROUGH); } catch {}
  // everyone wakes in their homeroom, the nook; only a walk through the doorway (or a preview's ?skipHome=1) opens a room
  const guessShell = (PREVIEW_HOST && bq.get("room") === "first") || bWant && (bThrough === bWant || (bq.get("skipHome") === "1" && PREVIEW_HOST)) ? "hollow" : "nook";
  const roomP = Promise.resolve().then(() => buildRoom(guessShell)).catch(e => {
    $("#loadMsg").innerHTML = `The garden did not load. Check your connection and open the page again.<br><small style="opacity:.6">${esc((e && (e.message || e.type)) || e)}</small><br><button type="button" onclick="location.reload()" style="margin-top:12px">Try again</button>`;
    throw e;
  });
  roomP.then(() => loadStep(roomOk = "hollow built"), () => {});
  const q = new URLSearchParams(location.search);
  let want = q.get("g"), wantInvite = q.get("invite");
  // one walk through the doorway lets the next load open the room; a reload lands in the homeroom again
  let through = null; try { through = sessionStorage.getItem(THROUGH); sessionStorage.removeItem(THROUGH); } catch {}
  // previews only: ?skipHome=1 opens the room in the link straight away, for a test link that starts in the room
  const skipHome = q.get("skipHome") === "1" && location.hostname !== "bars-engine.vercel.app";
  gardenId = want; invite = wantInvite;
  loadStep("finding your garden");
  let first = null;
  try {
    // The list always comes first: your homeroom, and each room's summary for the Next card and the Rooms sheet.
    // Everyone spawns in their homeroom (his ruling, 2026-10-23); a room in the link is a doorway there.
    try { await fetchList(); } catch (e) { if (e.code === "unauthenticated" || !gardenId) throw e; }
    /* An invitation you opened is kept until you are in its room, so the doorway still offers it when you come back to the
       homeroom without the link (pt1-two-player-check: the link got lost later in the playtest). */
    const keptKey = "between.invited." + me, kept = me ? ls.get(keptKey) : null;
    const listed = id => ((list && list.gardens) || []).some(x => x.id === id);
    if (kept && kept.id && listed(kept.id)) ls.del(keptKey);
    else if (kept && kept.id && kept.invite && (!want || want === homeId)) { want = gardenId = kept.id; wantInvite = invite = kept.invite; }
    if (me && want && wantInvite && homeId && want !== homeId && !listed(want)) ls.set(keptKey, { id: want, invite: wantInvite });
    // previews only: ?room=first opens your first shared room straight away (the room id is not in a link he can type)
    const firstRoom = PREVIEW_HOST && q.get("room") === "first" ? ((list && list.gardens) || []).find(x => x.phase !== "closed") : null;
    if (firstRoom) { gardenId = firstRoom.id; invite = null; try { const u = new URL(location.href); u.searchParams.delete("room"); u.searchParams.set("g", gardenId); u.searchParams.set("skipHome", "1"); history.replaceState(null, "", u); } catch {} }
    else if (want && homeId && want !== homeId && through !== want && !skipHome) {
      const r = ((list && list.gardens) || []).find(x => x.id === want);
      // his ruling on br-orient-each-invite (2026-10-24): once you have done the first minute, an invitation's doorway opens at once
      portalTo = { id: want, invite: r ? null : wantInvite, open: inviteDoorway(minuteDoc((list && list.home) || {}), !!r) === "open", name: r ? roomName(r) : null, style: r ? r.style : null };
      if (!r) {
        // a room you are not in yet: ask it who is inviting, for the doorway's words; a refusal leaves the doorway nameless
        try { const j = await api("/api/between/" + want + "/poll", { invite: wantInvite }); const sb = j.garden && j.garden.startedBy; portalTo.name = (sb && j.names && j.names[sb]) || null; portalTo.style = (j.garden && j.garden.style) || null; } catch {}
      }
      gardenId = homeId; invite = null;
    }
    if (!gardenId) gardenId = homeId;
    if (gardenId) first = await api("/api/between/" + gardenId + "/poll", { invite });
  } catch (e) {
    if (e && e.code === "unauthenticated") return toLogin();
    if ((e && e.code === "permission_denied") || (e && e.code === "not_found")) return stop(e.message);
    // The store is down (or not set up yet, as on a preview deploy before its migration): open the room anyway, so
    // walking and the 3D still work, and say plainly that nothing is saved.
    storeDown = true; stopped = true; me = me || "you"; first = null; gardenId = null;
  }
  if (first) {
    take(first);
    if (isHome(garden)) setHome((first.mine || {}).home);
    if (isMember(garden)) {
      myPrivate = { ...((first.mine || {}).garden || {}) };
      awaySince = myPrivate.lastSeen || null;
      myPrivate.lastSeen = now(); savePriv();
      if (myPrivate.captions && myPrivate.captions !== getPace()) setPace(myPrivate.captions);
    }
  } else gardenLoaded = true;
  (ls.get("between.outbox." + gardenId + "." + me) || []).forEach(o => outbox.push(o));
  placeMe();
  if (!roomOk) loadStep("building the hollow");
  try { await roomP; } catch { return; }
  const wantShell = garden ? (isHome(garden) ? "nook" : "hollow") : storeDown && guessShell === "nook" ? "nook" : "hollow";
  if (wantShell !== builtShell) { loadStep("building the room"); buildRoom(wantShell); meState.placed = false; placeMe(); }
  // the first minute gives the mirror and the blank scroll (rk-earned-only); it starts below, once the room shows
  $("#loading").hidden = true; $("#hud").hidden = false;
  if (!garden && !storeDown) openSheet("setup");
  refresh();
  // ?sheet= opens a sheet at once, for a preview link that starts where the test starts
  const jump = q.get("sheet");
  if (garden && !isHome(garden)) fetchHome(); // your homeroom's spirits and embers, for Check in and Bring a spirit here
  if (SATCHEL_ALL && canArrange()) setSatchel(true);
  // ?mirror=1 (previews): open at the mirror, the Look sheet when there is a garden, the glass alone when the store is down
  if (MIRROR_SKIP && !jump) { if (garden) openSheet("look"); else setMirror(true); }
  if (CUSHION_SKIP) { const res = placeOn(builtShell, roomNow().placed, CUSHION_SKIP, "cushion", me, now()); if (res.ok) writeRoom(res.patch, res.line).catch(() => {}); }
  // ?wake=1 (previews, the homeroom): sat on the first minute's cushion as the minute wakes you, even with the store down
  if (WAKE_SKIP && inNook() && !wake.on) wakeOnCushion();
  if (SIT_SKIP) setTimeout(() => { if (SIT_SKIP === "hearth") sitAtHearth(); else sitOn(seatId(SIT_SKIP)); }, 600);
  if (jump && ["rooms", "look", "style", "invite", "checkin", "goals", "invitations", "spellbook", "spirits", "spirit"].includes(jump) && garden) openSheet(jump);
  // the first minute (Still C): a homeroom not yet oriented wakes into it; a guest's invitation doorway opens at its end
  minuteStart();
  syncShelf();
  if (SCROLL_PREVIEW === "write" && inNook()) openPaper("write", { fromShelf: true });
  booted = true;
  requestAnimationFrame(frame);
  setTimeout(() => { const V = view(); if (V.g && isMember(V.g) && awayActs(V.g, V).length) toast(`${nameOf(other(V.g), V.g)} tended the garden while you were away. See "While you were away".`); }, 1500);
  flush();
  pollTimer = setTimeout(poll, 2500);
})();
window.__between = { tea: () => tea, outbox, view, meState, op, api, list: () => list, ready: () => booted, toast, nameOf: uid => nameOf(uid, view().g), peers, walkers, things, look: () => look, tapAt, camera, poll, ids: () => ({ gardenId, me, invite: myInvite, portalTo, homeId }),
  seatPos, mySeat, creature, renderer, scene, setCam: a => { debugCam = a; },
  seats: () => seatsHere(), sitOn, sitAtHearth, standUp, sheet: () => sheetName, seatedAtHearth,
  moment: () => hm && { step: hm.step, held: hm.held && hm.held.eid, lid: hm.lid, hooks: (hm.hooks || []).map(h => h.id), lantern: !!hm.L, motes: hm.motes.map(m => ({ eid: m.eid, state: m.state, shown: m.shown, at: m.pos.toArray() })) },
  hmHold, hmPress, hmLight, hmSend: id => hm && hm.hooks && hmSend(hm.hooks.find(h => h.id === id) || null), hmTap,
  minute: () => ({ ...mstate(), beat: mclock.beat, laterReady: mclock.laterReady, started: mclock.started, hearth: hollow && hollow.handles.hearth ? { want: hollow.handles.hearth.want, k: hollow.handles.hearth.k, ember: hollow.handles.hearth.ember } : null, vines: vines.map(v => v.state), wake: wake.on }),
  anchors: () => ({ hearth: HEARTH_AT.toArray(), portal: PORTAL_AT.toArray(), mirror: BETWEEN_AT.toArray(), shelf: shelf.at.toArray(), shelfTaps: shelf.taps.map(tp => ({ key: tp.key, i: tp.i ?? 0, at: shelfTapPos(tp).toArray() })) }),
  shelf: () => myShelf(), paper: () => paper && { mode: paper.mode, open: paper.open, to: paper.to, chip: paper.chip, answered: paper.answered || null },
  home: () => myHome, portalTo: () => portalTo, direct: (k) => { directCam = k ? { key: k, t0: performance.now() } : null; },
  room: () => ({ shell: builtShell, ...roomNow(), satchel: mySatchel(), open: satchelOpen, armed, mirrorSpot, spots: hollow ? Object.fromEntries(Object.entries(hollow.handles.spots).map(([k, h]) => [k, { takes: h.takes, item: h.item, at: h.pos.toArray() }])) : {} }), screenOf: v => { const p = v.clone().project(camera); return [(p.x + 1) / 2 * innerWidth, (1 - p.y) / 2 * innerHeight]; },
  addSeat: f => { seatExtras.push(f); }, homeWrite: data => homeOp(data),
  openSheet: (name, arg) => openSheet(name, arg), minuteOn: () => minuteOn(), sparkUrl: id => sparkUrl(id), sparkLink: (to, note) => sparkLink(to, note) };
// the charge-to-world map stand stands in every nook (Six-faces-council ctw-in-the-nook, his yes on ctw-nook-look-1).
// previews: ?ctw=episode brings the sample charge and opens with the episode unrolled, ?ctw=sheet opens the six questions. E.g. ?nook=1&ctw=episode
import("./charge-world.js").then(m => { window.__between.ctw = m.mount(window.__between, { open: PREVIEW_HOST ? KQ.get("ctw") : null }); }).catch(e => noteError(e, "ctw"));
// letters from the nook and the card you act on (Six-faces-council hollow-interface rounds 3 and 4): a garden of two that
// holds letters plays its encounter, every word through the one screen owner (voice.js, hi-screen-owner). Previews: ?pick=a6
// opens them (from the nook too; with a stand-in partner when you are alone), ?pick=a8 at the hollow with A6 overcome
import("./voice.js").then(v => { window.__between.voice = v.createVoice(); return import("./letters.js"); })
  .then(m => { window.__between.letters = m.mount(window.__between, { open: PREVIEW_HOST ? KQ.get("pick") : null }); }).catch(e => noteError(e, "letters"));
// the coin table and the I Ching book, in the nook and the hollow: advice on coming closer to yourself or to someone you share a
// Between with (Six-faces-council bar-intake-2; his yes on fb-look-01, his note on bi-table-look-1). Previews write nothing:
// ?nook=1&coins=self casts for yourself, ?nook=1&coins=them for a stand-in, ?room=first&coins=faceup opens the hollow with a stand-in's cast face up; ?nook=1&coins=spark casts for a stand-in spark (Show Up: the invitation)
// ?door=flirtcraft (any host, build 3b): the Flirtcraft door walks you to the coin table once your first minute is done
import("./coin-table.js").then(m => { window.__between.coins = m.mount(window.__between, { open: PREVIEW_HOST ? KQ.get("coins") : null, preview: PREVIEW_HOST, door: KQ.get("door") }); }).catch(e => noteError(e, "coins"));
