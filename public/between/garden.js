/* The Between, in 3D, on bars-engine. Carried from the claude.ai artifact page (https://claude.ai/artifact/NTi4jcpaHkDEMnqpVA9LBq, version 4)
   with its boot and store calls replaced: the store is Postgres behind /api/between, polled (bh-async-first). */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as skClone } from "three/addons/utils/SkeletonUtils.js";
import { buildHollow, walkable, pushOut, groundY, clampCamera, mergeStatic, mergeByParent, paperLantern, SEATS, WALK_R, DAIS_Y, HEARTH } from "./hollow.js";
import { createCreature } from "./creature.js";
import { createAmbient } from "./ambient.js";
import { installPaint } from "./paint.js";   // round 3: the painterly shader, keyed to the concept views
import { readIn, readMs, setPace, getPace, PACES } from "./captions.js"; // round 4: caption mode
/* Rooms, part 2 (six-faces-council relationship-creature, the br-* positions): the portable modules the Cave of Lessons
   and Big Mind take as they are. */
import { BEATS, optionsOf, parseLook, lookText, randomLook, colorsOf, lookWords, DEFAULT_LOOK } from "../calrunia/look.js";
import { STYLES as ROOM_STYLES, styleOf, applyStyle } from "../calrunia/room-styles.js";
import { suggest, LANE_NAMES } from "../calrunia/next-moves.js";
import { SPELLS, KINDS as SPELL_KINDS, castable } from "../calrunia/spellbook.js";
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
  });
  return templates[name];
}

/* A look on the player figure: player.glb is coloured by vertex, six colours read off the file (linear): skin, the robe,
   its light under-layer, the trousers, the sash, and the shoes. A look sets the skin and the dyed cloth (main, light,
   shade, trim) from look.js colorsOf; the shoes stay. The figure has no hair mesh, so hair colour waits for one. */
const FIGURE_SLOTS = [[[0.69, 0.62, 0.53], "skin"], [[0.06, 0.05, 0.19], 0], [[0.81, 0.74, 0.56], 1], [[0.03, 0.03, 0.06], 2], [[0.48, 0.28, 0.05], 3], [[0.01, 0.01, 0.02], null]];
function paintLook(mesh, colors) {
  const src = mesh.geometry.attributes.color; if (!src) return;
  const to = FIGURE_SLOTS.map(([, k]) => k === null ? null : new THREE.Color(k === "skin" ? colors.skin : colors.cloth[k]));
  const geo = mesh.geometry.clone(), col = geo.attributes.color;
  for (let i = 0; i < col.count; i++) {
    const r = col.getX(i), g = col.getY(i), b = col.getZ(i);
    let best = 0, bd = Infinity;
    FIGURE_SLOTS.forEach(([c], k) => { const d = (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2; if (d < bd) { bd = d; best = k; } });
    if (to[best]) col.setXYZ(i, to[best].r, to[best].g, to[best].b);
  }
  col.needsUpdate = true; mesh.geometry = geo;
}
/* Bodies are cloned from one template each; their colour is set per owner on a copy of the robe. */
async function makeBody(model, height, tint, tintAmt, opts) {
  const t = await loadModel(model);
  const obj = skClone(t.scene);
  const size = t.box.getSize(new THREE.Vector3());
  const tall = model === "fox" || model === "tortoise" ? Math.max(size.x, size.z) : size.y;
  const k = height / Math.max(tall, 0.01);
  obj.scale.setScalar(k);
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
      if (opts && opts.colors) paintLook(o, opts.colors);
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
  if (acts.Idle) acts.Idle.play();
  let walking = false;
  /* Poses made in code over the clip (the player model has a walk and nothing else): sitting cross-legged on a cushion,
     and a wave of the right hand. Bone axes were read off player.glb: hip X lifts the thigh forward, knee X folds the
     shin, shoulder Z raises the arm to the side. */
  const bones = {}; for (const n of ["hips", "hipL", "hipR", "kneeL", "kneeR", "shoulderL", "shoulderR", "elbowL", "elbowR", "spine", "neck"]) { const b = obj.getObjectByName(n); if (b) bones[n] = { b, q: b.quaternion.clone() }; }
  const hipsY = bones.hips ? bones.hips.b.position.y : 0;
  const qe = new THREE.Quaternion(), eu = new THREE.Euler();
  const bend = (n, x, y, z, w) => { const B = bones[n]; if (!B) return; qe.setFromEuler(eu.set(x * w, y * w, z * w, "XYZ")); B.b.quaternion.copy(B.q).multiply(qe); };
  let sit = 0, waveT = -9, rest = 0;
  return {
    holder, mixer, isPlayer: !!bones.hipL, scale: k,
    setWalking(w) {
      if (w === walking) return; walking = w;
      if (acts.Walk) { if (w) { acts.Walk.reset().fadeIn(0.2).play(); acts.Idle && acts.Idle.fadeOut(0.2); } else { acts.Walk.fadeOut(0.3); if (acts.Idle) acts.Idle.reset().fadeIn(0.3).play(); } }
    },
    wave(t) { waveT = t; },
    /* After mixer.update: sitting (0..1 eases in), waving for 1.6 s, and for animals a curled-up rest (0..1). */
    pose(t, dt, wantSit, wantRest) {
      sit += ((wantSit ? 1 : 0) - sit) * Math.min(1, dt * 5);
      rest += ((wantRest ? 1 : 0) - rest) * Math.min(1, dt * 3);
      if (bones.hipL && sit > 0.01) {
        const w = sit;
        if (acts.Walk && wantSit) acts.Walk.weight = 0;
        for (const [n, x, y, z] of [["hipL", -1.5, -0.35, -0.65], ["hipR", -1.5, 0.35, 0.65], ["kneeL", 2.45, 0, 0], ["kneeR", 2.45, 0, 0], ["spine", 0.12, 0, 0], ["neck", 0.18, 0, 0],
          ["shoulderL", -0.75, 0, -0.25], ["shoulderR", -0.75, 0, 0.25], ["elbowL", -0.9, 0, 0], ["elbowR", -0.9, 0, 0]]) bend(n, x, y, z, w);
        bones.hips.b.position.y = hipsY - 0.84 * w;
      } else if (bones.hips) bones.hips.b.position.y = hipsY;
      if (acts.Walk && !wantSit && acts.Walk.weight === 0) acts.Walk.weight = 1;
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
    },
  };
}
const FACE = 0; // the bodies face +z in their files

let roomReady = false;
function buildRoom() {
  hollow = buildHollow(scene, { lowPower: LOW_POWER });
  roomReady = true;
}

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
  glass.scale.y = 1.55; glass.position.set(0, 1.0, 0.005); mirror.add(glass);
  const back = glass.clone(); back.material = wood; back.rotation.y = Math.PI; back.position.z = -0.005; mirror.add(back);
  for (const sx of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.42, 6), wood); leg.position.set(sx * 0.16, 0.19, -0.06); leg.rotation.z = sx * 0.12; mirror.add(leg); }
}

/* The doorway to your rooms stands on the dais beside the mirror: shut it is dark wood; open it glows with the room past it. */
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
const portalOpen = () => !!(portalTo && portalTo.open);
function portalTick(t) {
  portal.visible = isHome(garden);
  if (!portal.visible) return;
  if (portalOpen()) {
    const st = styleOf(portalTo.style), c = st.sky.low;
    portalVeil.emissive.setRGB(c[0], c[1], c[2]); portalVeil.emissiveIntensity = 0.75 + Math.sin(t * 2.1) * 0.18 + (entering ? 0.6 : 0);
    portalVeil.opacity = 0.85;
  } else { portalVeil.emissive.setRGB(0.25, 0.2, 0.32); portalVeil.emissiveIntensity = portalTo ? 0.12 : 0.05 + Math.sin(t * 0.7) * 0.03; portalVeil.opacity = 0.92; }
  if (entering && (Math.hypot(meState.pos.x - PORTAL_AT.x, meState.pos.z - PORTAL_AT.z) < 0.75 || performance.now() - entering.t0 > 3800)) {
    const e = entering; entering = null;
    try { sessionStorage.setItem(THROUGH, e.id); } catch {}
    markSeen();
    $("#loadMsg").textContent = "Through the doorway"; $("#loadStep").textContent = ""; $("#loading").hidden = false;
    location.href = ROOM_URL(e.id) + (e.invite ? "&invite=" + encodeURIComponent(e.invite) : "");
  }
}
/* Walk through the doorway to a room: from the homeroom you walk there; from anywhere else you go home first, where the
   doorway to it stands open (players always spawn in their homeroom). */
function walkThrough(id, inv) {
  if (!isHome(garden)) { markSeen(); location.href = ROOM_URL(id); return; }
  const r = ((list && list.gardens) || []).find(x => x.id === id);
  if (!portalTo || portalTo.id !== id) portalTo = { id, invite: inv || null, open: true, name: r ? roomName(r) : null, style: r ? r.style : null };
  if (!portalOpen()) { openSheet("orient"); return; }
  closeSheet(); standUp(); selected = "portal";
  const front = new THREE.Vector3(Math.sin(portal.rotation.y), 0, Math.cos(portal.rotation.y));
  meState.target = PORTAL_AT.clone().add(front.multiplyScalar(0.15));
  entering = { id, invite: portalTo.invite, t0: performance.now() };
  burst(PORTAL_AT.clone(), 0xffe2a8);
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
    nextStatus.set(id, lan ? "lantern:" + (it.element || "") + (lanternLit(it) ? "+lit" : "") + ":" + (it.pos ? it.pos.x + "," + it.pos.z : "")
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
      const pos = walkable(raw.x, raw.z, 0.25) ? raw : pushOut(new THREE.Vector3(raw.x, 0, raw.z), 0.3);
      const group = it.kind === "agreement" ? plantMesh(it, g) : lan ? lanternMesh(it, g) : orbMesh(it, g);
      group.position.set(pos.x, groundY(pos.x, pos.z), pos.z);
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
  for (const [id, s] of V.spirits) want.set("s:" + id, { type: "spirit", doc: s });
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
const seatPos = i => new THREE.Vector3(SEATS[i].x, 0, SEATS[i].z);
const othersHere = () => [...peers.values()].filter(p => p.uid !== me);
function ownerSeatNow(uid) {
  if (uid === me) return meState.sitting ? meState.seatWant : null;
  for (const p of peers.values()) if (p.uid === uid && p.sitting) return p.seat;
  return null;
}
function standUp() { meState.seatWant = null; if (meState.sitting) { meState.sitting = false; sendPresence(); } }
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
    const b = await makeBody("player", 1.7, null, 0, { ring: hue, colors: lk ? colorsOf(lk) : null });
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
  const b = await makeBody("player", 1.7, null, 0, { ring: hue, colors: lk ? colorsOf(lk) : null });
  p.loading = false;
  if (!peers.has(p.peer)) return;
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
    e.seat = pr.s === 0 || pr.s === 1 ? pr.s : null;
    if (e.seat != null) { e.tx = SEATS[e.seat].x; e.tz = SEATS[e.seat].z; }
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
renderer.domElement.addEventListener("pointerdown", e => { pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); dragMoved = 0; if (pointers.size === 1) carry = carryStart(e.clientX, e.clientY); else if (carry) { carry.t.group.position.copy(carry.from); carry = null; } if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: camDist }; } renderer.domElement.setPointerCapture(e.pointerId); });
renderer.domElement.addEventListener("pointermove", e => {
  const p = pointers.get(e.pointerId); if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (pointers.size === 2 && pinch0) { const [a, b] = [...pointers.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); camDist = Math.max(2, Math.min(7.5, pinch0.dist * pinch0.d / Math.max(d, 1))); dragMoved += 99; return; }
  dragMoved += Math.abs(dx) + Math.abs(dy);
  if (carry) {
    const h = floorAt(e.clientX, e.clientY);
    if (h) { carry.ok = walkable(h.x, h.z, 0.3); carry.t.group.position.set(h.x, groundY(h.x, h.z), h.z); carry.at = h; }
    return;
  }
  if (dragMoved > 6) { camYaw -= dx * 0.006; camPitch = Math.max(0.05, Math.min(1.1, camPitch + dy * 0.004)); }
});
function endPointer(e) {
  const p = pointers.get(e.pointerId); pointers.delete(e.pointerId); if (pointers.size < 2) pinch0 = null;
  const c = carry; carry = null;
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
renderer.domElement.addEventListener("wheel", e => { e.preventDefault(); camDist = Math.max(2, Math.min(7.5, camDist * (1 + Math.sign(e.deltaY) * 0.08))); }, { passive: false });
addEventListener("keydown", e => { if (sheetName || /input|textarea|select/i.test((e.target.tagName || ""))) return; const k = e.key.toLowerCase(); if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) { meState.keys.add(k); meState.target = null; standUp(); e.preventDefault(); } });
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
  const ndc = new THREE.Vector2(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  // things first: the nearest one whose sphere the ray passes through
  let best = null, bestD = Infinity;
  const consider = (key, pos, r) => { const d = ray.ray.distanceToPoint(pos); if (d < r) { const along = ray.ray.origin.distanceTo(pos); if (along < bestD) { bestD = along; best = { key, pos }; } } };
  if (placing) { placeAt(); return; }
  consider("between", BETWEEN_AT.clone().setY(DAIS_Y + 0.5), 0.7);
  if (portal.visible) consider("portal", PORTAL_AT.clone().setY(DAIS_Y + 0.95), 0.75);
  consider("hearth", HEARTH_AT.clone().setY(0.9), 1.0);
  SEATS.forEach((st, i) => consider("seat:" + i, seatPos(i).setY(DAIS_Y + 0.15), 0.45));
  for (const [id, t] of things) consider("item:" + id, t.pos.clone().setY(0.4), 0.5);
  for (const [k, w] of walkers) if (w.holder) consider("w:" + k, w.holder.position.clone().setY(w.type === "spirit" ? 0.4 : 0.9), 0.6);
  for (const [k, p] of peers) consider("p:" + k, p.pos.clone().setY(groundY(p.pos.x, p.pos.z) + 0.9), 0.5);
  if (best && best.key.startsWith("seat:")) {
    selected = best.key;
    const i = +best.key.slice(5);
    if (i === mySeat()) { meState.seatWant = i; meState.target = seatPos(i); } // walk to your cushion and sit
    else { standUp(); const dir = meState.pos.clone().sub(best.pos).setY(0); if (dir.length() > 1.3) meState.target = pushOut(best.pos.clone().setY(0).add(dir.normalize().multiplyScalar(1.1))); }
    refreshHud(); return;
  }
  if (best) {
    standUp();
    selected = best.key;
    if (best.key === "hearth" && hearthOpen()) openSheet("hearth");
    if (best.key === "between" && isHome(view().g)) openSheet("look");
    if (best.key === "portal") { portalTo ? walkThrough(portalTo.id, portalTo.invite) : openSheet("rooms"); return; }
    const dir = meState.pos.clone().sub(best.pos).setY(0); const d = dir.length();
    if (d > 1.3) { dir.normalize(); meState.target = pushOut(best.pos.clone().add(dir.multiplyScalar(1.1))); }
    refreshHud(); return;
  }
  const hit = new THREE.Vector3();
  // the floor: the dais is raised, so try its top first, then the flagstones
  const daisPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -DAIS_Y);
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
function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  const t = performance.now() / 1000;
  const tShared = now() / 1000;
  // you
  if (meState.body) {
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
    const walking = move.lengthSq() > 1e-6;
    // reached your cushion: sit, facing the Between
    if (meState.seatWant != null && !walking && !meState.sitting && meState.pos.distanceTo(seatPos(meState.seatWant)) < 0.15) { meState.sitting = true; sendPresence(); }
    if (meState.sitting) { const sp = seatPos(meState.seatWant); meState.pos.copy(sp); let d = SEATS[meState.seatWant].yaw - meState.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); meState.yaw += d * Math.min(1, dt * 6); }
    if (walking) {
      const step = Math.min(move.length(), 2.3 * dt);
      move.normalize();
      meState.pos.add(move.clone().multiplyScalar(step)); if (meState.seatWant == null || meState.pos.distanceTo(seatPos(meState.seatWant)) > 0.9) pushOut(meState.pos);
      const want = Math.atan2(move.x, move.z);
      let d = want - meState.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); meState.yaw += d * Math.min(1, dt * 10);
    }
    meState.body.setWalking(walking);
    meState.body.holder.position.copy(meState.pos);
    meState.body.holder.position.y = meState.sitting ? DAIS_Y + 0.17 : groundY(meState.pos.x, meState.pos.z);
    meState.body.holder.rotation.y = meState.yaw + FACE;
    meState.body.mixer.update(dt);
    meState.body.pose(t, dt, meState.sitting, false);
    if (walking !== meState.wasWalking || (walking && meState.target !== meState.sentTarget)) { meState.sentTarget = meState.target; sendPresence(); }
    meState.wasWalking = walking;
  }
  // others
  for (const [k, p] of peers) {
    if (!p.body) continue;
    const gx = p.tx - p.pos.x, gz = p.tz - p.pos.z, gd = Math.hypot(gx, gz);
    p.walking = gd > 0.08;
    if (p.walking) { const step = Math.min(gd, 2.3 * dt); p.pos.x += gx / gd * step; p.pos.z += gz / gd * step; }
    const want = p.walking ? Math.atan2(gx, gz) : p.seat != null ? SEATS[p.seat].yaw : p.th;
    let d = want - p.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); p.yaw += d * Math.min(1, dt * 8);
    p.sitting = p.seat != null && !p.walking;
    if (p.sitting) { const want2 = SEATS[p.seat].yaw; let d2 = want2 - p.yaw; d2 = Math.atan2(Math.sin(d2), Math.cos(d2)); p.yaw += d2 * Math.min(1, dt * 6); }
    p.body.setWalking(p.walking);
    p.body.holder.position.copy(p.pos);
    p.body.holder.position.y = p.sitting ? DAIS_Y + 0.17 : groundY(p.pos.x, p.pos.z);
    p.body.holder.rotation.y = p.yaw + FACE;
    p.body.mixer.update(dt);
    p.body.pose(t, dt, p.sitting, false);
  }
  // walkers
  const ws = [...walkers.values()].filter(w => w.ready);
  for (const w of ws) {
    let { p, moving, dir, sniff } = walkerPos(w, tShared);
    w.sniff = sniff || null;
    // a spirit whose owner sits down comes and curls up beside their cushion
    const os = w.type === "spirit" ? ownerSeatNow(w.doc.owner) : null;
    if (os != null) { const sp = SEATS[os]; p = new THREE.Vector2(sp.x + Math.sign(sp.x) * 0.8, sp.z + 0.35); moving = false; }
    if (!w.cur) w.cur = p.clone();
    const gap = p.clone().sub(w.cur), gl = gap.length();
    if (gl > 0.02) { const step = Math.min(gl, 1.8 * dt); w.cur.add(gap.multiplyScalar(step / gl)); if (gl > 0.08) { moving = true; w.dirOverride = gap.clone(); } else w.dirOverride = null; } else w.dirOverride = null;
    w.rest = os != null && gl < 0.1;
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
  stepBetween(t, dt); portalTick(t);
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
  const meFocus = meState.pos.clone().setY((meState.sitting ? DAIS_Y + 0.75 : groundY(meState.pos.x, meState.pos.z) + 1.0));
  const toB = Math.hypot(meState.pos.x - BETWEEN_AT.x, meState.pos.z - BETWEEN_AT.z);
  if (toB < 5) meFocus.lerp(BETWEEN_AT.clone().setY(DAIS_Y + 0.6), 0.4 * (1 - toB / 5) + 0.1);
  const focus = meFocus.lerp(new THREE.Vector3(0, DAIS_Y + 0.6, -0.4), togetherK);
  const cp = new THREE.Vector3(Math.sin(camYaw) * Math.cos(camPitch), Math.sin(camPitch), Math.cos(camYaw) * Math.cos(camPitch)).multiplyScalar(camDist).add(focus);
  clampCamera(cp, focus);
  camera.position.lerp(cp, Math.min(1, dt * 4)); camera.lookAt(focus); lastFocus.copy(focus);
  if (debugCam) { camera.position.set(debugCam[0], debugCam[1], debugCam[2]); camera.lookAt(debugCam[3], debugCam[4], debugCam[5]); }
  renderer.render(scene, camera);
  drawLabels(t);
  // what is near you
  const nk = nearest();
  if (nk !== nearKey) { nearKey = nk; refreshHud(); }
  requestAnimationFrame(frame);
}
function nearest() {
  if (selected) {
    const pos = posOf(selected);
    if (pos && pos.distanceTo(meState.pos) < 2.6) return selected;
  }
  let best = null, bd = 2.0;
  const c = (key, pos) => { const d = Math.hypot(pos.x - meState.pos.x, pos.z - meState.pos.z); if (d < bd) { bd = d; best = key; } };
  c("between", BETWEEN_AT);
  if (portal.visible) c("portal", PORTAL_AT);
  c("hearth", HEARTH_AT);
  SEATS.forEach((st, i) => { if (!(meState.sitting && meState.seatWant === i)) c("seat:" + i, seatPos(i)); });
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
  if (key.startsWith("seat:")) return seatPos(+key.slice(5));
  if (key.startsWith("item:")) { const t = things.get(key.slice(5)); return t && t.pos; }
  if (key.startsWith("w:")) { const w = walkers.get(key.slice(2)); return w && w.holder && w.holder.position; }
  if (key.startsWith("p:")) { const p = peers.get(key.slice(2)); return p && p.pos; }
  return null;
}
function drawLabels(t) {
  for (const el of labels.values()) el._seen = false;
  const V = view(); const g = V.g;
  if (g && g.phase !== "closed") {
    const nm = isHome(g) ? "The mirror" : betweenName(V.items) || (g.phase === "spark" ? "The spark" : "The Between");
    placeLabel(label("between", nm, ""), BETWEEN_AT.clone().setY(DAIS_Y + (isHome(g) ? 1.95 : g.phase === "spark" ? 1.0 : 1.45)));
  }
  if (portal.visible) placeLabel(label("portal", portalTo ? (portalOpen() ? "To " + (portalTo.name || "the room") : "Shut: read the rules first") : "The doorway to your rooms", ""), PORTAL_AT.clone().setY(DAIS_Y + 2.25));
  if (meState.body) placeLabel(label("me", "You", "you", cssHue(hueOf(me, g))), meState.pos.clone().setY(meState.sitting ? DAIS_Y + 1.35 : groundY(meState.pos.x, meState.pos.z) + 1.95));
  for (const [k, p] of peers) if (p.body) placeLabel(label("p:" + k, p.uid === me ? "You, in another window" : (names[p.uid] || (isMember(g) || (g && g.members && g.members[p.uid]) ? nameOf(p.uid, g) : "A visitor")), "you", cssHue(hueOf(p.uid, g))), p.pos.clone().setY(p.sitting ? DAIS_Y + 1.35 : groundY(p.pos.x, p.pos.z) + 1.95));
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
  if (storeDown) hintText = "The garden's store did not answer, so this is the room on its own and nothing here is saved. Reload the page to try again.";
  else if (!g) hintText = "Tap the floor to walk. Drag to look around.";
  else if (isHome(g) && portalTo && !portalOpen()) hintText = `${portalTo.name ? portalTo.name + " invited you" : "You were invited"} to a room. The doorway by the mirror opens once you read the rules.`;
  else if (isHome(g) && portalTo) hintText = `The doorway by the mirror is open to ${portalTo.name || "the room"}. Walk through when you are ready.`;
  else if (isHome(g)) hintText = "Your own room. Walk up to the mirror to change how you look. Your rooms open through the doorway beside it.";
  else if (g.phase === "closed") hintText = "The garden is closed. Its history is yours to keep from More.";
  else if (!isMember(g)) hintText = members(g).length >= 2 ? "This garden is held by two people. You can look around." : "A spark is waiting here. Walk up to it.";
  else if (g.phase === "spark") hintText = g.joinRequest ? `${nameOf(g.joinRequest.uid, g)} asks to join. Walk to the spark to answer.` : `You tend this spark alone until ${g.setup.who} joins. Tap the floor to walk, drag to look.`;
  else if (placing) hintText = placing.ask ? "Tap the floor where you would like it. It moves there when they say yes." : "Tap the floor where it should stand, or drag it there, or set it down where you are.";
  else if (others.length) hintText = `${nameOf(others[0].uid, g)} is here with you now.` + (bothSitting() ? " You are sitting together." : meState.sitting ? "" : " Tap your cushion to sit with them.");
  else hintText = `${nameOf(other(g), g)} is not here right now. What you do waits for them.`;
  if (hint._h !== hintText) { hint.textContent = hint._h = hintText; readIn(hint); }

  // near
  const near = $("#near");
  const key = nearKey;
  const html = key ? nearHtml(key, V, g) : "";
  near.hidden = !html; if (near._h !== html) { near.innerHTML = html; near._h = html; readIn(near); }

  // tools
  const tools = [];
  if (storeDown) {}
  else if (!g) tools.push(`<button type="button" data-open="setup">Plant a spark here</button>`);
  else if (isHome(g)) {
    const invs = (list && list.gardens || []).reduce((n, r) => n + (r.invitations || []).length, 0);
    tools.push(`<button type="button" data-open="rooms">Rooms</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="look">Look</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="checkin">Check in</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="goals">Goals</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="invitations">Invitations${invs ? '<span class="dot" title="Waiting for your answer"></span>' : ""}</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="style">Style</button>`);
  }
  else if (g.phase !== "closed" && isMember(g) && !readOnly) {
    tools.push(`<button type="button" data-open="offer">${g.phase === "spark" ? "Tend the spark" : "Offer something"}</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="agreement">Plant an agreement</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="spirit">Bring a spirit</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="daemon">Bring a daemon</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="hearth">Hearth</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="pictures">Pictures</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="invite">Invite</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="style">Style</button>`);
    if (others.length) tools.push(`<button class="glassbtn" type="button" data-act="wave">Wave</button>`);
  }
  if (g && !isHome(g) && homeId && !storeDown) tools.push(`<button class="glassbtn" type="button" data-act="goHome">Home</button>`); else if (g.phase !== "closed" && !isMember(g) && members(g).length < 2 && !readOnly) {
    tools.push(g.joinRequest && g.joinRequest.uid === me ? `<button class="glassbtn" type="button" data-act="unjoin">Take back my request</button>` : `<button type="button" data-act="join">Ask to join</button>`);
  }
  if (placing && !storeDown) tools.unshift(`<button type="button" data-act="lanternHere">Set it down here</button><button class="glassbtn" type="button" data-act="lanternCancel">Leave it where it was</button>`);
  const th = tools.join("");
  const te = $("#tools"); if (te._h !== th) { te.innerHTML = th; te._h = th; }

  // next: what the Between suggests now, one move per lane at most (br-next-moves-three-lanes)
  const moves = storeDown || !g || g.phase === "closed" || (!isHome(g) && !isMember(g)) ? [] : nextMoves(g);
  const nx = $("#next");
  const nh = moves.length ? `<span class="eyebrow">Next</span>${moves.map((m, i) => `<button type="button" class="${i ? "nmore" : "nfirst"}" data-act="next" data-id="${esc(m.act)}"><span class="lane">${esc(LANE_NAMES[m.lane])}</span> <b>${esc(m.title)}</b>${i ? "" : `<span class="t">${esc(m.line)}</span>`}</button>`).join("")}` : "";
  nx.hidden = !nh || !!nearKey || !!placing; if (nx._h !== nh) { nx.innerHTML = nh; nx._h = nh; }
}
/* The moves for here: in the homeroom, across every room; inside a room, that room only. Your own lane reads your
   homeroom, so checking in with yourself is part of the loop wherever you are. */
function homeState() {
  const h = list && list.home;
  return { lastCheckin: myHome.lastCheckin ?? (h && h.lastCheckin) ?? null, goals: myHome.goals ? Object.values(myHome.goals).filter(Boolean) : (h && h.goals) || [] };
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
function nearHtml(key, V, g) {
  if (!g) return "";
  const canTend = isMember(g) && !readOnly && g.phase !== "closed";
  if (key === "portal") {
    if (!portalTo) return `<div class="what"><b>The doorway</b><span class="t">Every room you share opens from here. Choose one under Rooms and walk through.</span></div><div class="row"><button type="button" data-open="rooms">Rooms</button></div>`;
    if (!portalOpen()) return `<div class="what"><b>A doorway, shut</b><span class="t">${esc(portalTo.name ? portalTo.name + " invited you" : "Someone invited you")}. It opens once you have read how the Between works.</span></div><div class="row"><button type="button" data-open="orient">Read the rules</button></div>`;
    return `<div class="what"><b>To ${esc(portalTo.name || "the room")}</b><span class="t">The doorway is open.</span></div><div class="row"><button type="button" data-act="through">Walk through</button></div>`;
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
  if (key === "hearth") return `<div class="what"><b>The hearth</b><span class="t">When something stirs you, sit with it. What's left is a little glowing ember you keep.</span></div>${canTend ? `<div class="row"><button type="button" data-open="hearth">Sit at the hearth</button></div>` : ""}`;
  if (key.startsWith("seat:")) {
    const i = +key.slice(5), mine = i === mySeat();
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
    const sub = w.type === "spirit" ? (d.note ? esc(d.note) : "Visiting. It stays its owner's.") : `${esc(DAEMONS[d.which][1])}. ${mine ? "Yours: it came with you." : "It works for " + esc(nameOf(d.owner, g)) + "."}`;
    const id = key.slice(4);
    let acts = "";
    if (canTend) acts = mine
      ? `<button class="ghost" type="button" data-act="callOver" data-id="${key.slice(2)}">Call it to you</button><button class="quiet" type="button" data-act="sendHome" data-id="${key.slice(2)}">Send it home</button>`
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
function embers() { const p = overlay(pouchPath(), myPouch || {}) || {}; const e = p.embers && typeof p.embers === "object" ? p.embers : {}; return Object.entries(e).filter(([, x]) => x && typeof x === "object" && MOVES[x.move]); }
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
  hd = {}; toast("An ember, in your pouch.");
}
async function makeLantern(eid) {
  const { g } = view(); const e = embers().find(([k]) => k === eid); if (!e || e[1].state !== "held") return;
  const lid = "l" + hkey();
  await op("items/" + lid, "set", { kind: "lantern", by: me, hue: cssHue(hueOf(me, g)), element: hd.showEl ? MOVES[e[1].move][1] : null, pos: hearthSpot(lid), yes: {}, status: "offered", at: now(), history: lanternLog("made") });
  await op(pouchPath(), "update", { embers: { [eid]: { state: "lit", lantern: lid } } });
  await touch(); hd = {}; closeSheet();
  toast("Your lantern stands by the hearth, an offer to " + nameOf(other(g), g) + ".");
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
  await op("items/" + id, "delete");
  const e = embers().find(([, x]) => x.lantern === id);
  if (e) await op(pouchPath(), "update", { embers: { [e[0]]: { state: "held", lantern: null } } });
  toast(compost ? "The lantern went to ash and became soil. Its ember is back in your pouch." : "You took the lantern back. Its ember is in your pouch again.");
}
function hearthSheet(g, V) {
  const held = embers().filter(([, e]) => e.state === "held").sort((a, b) => (b[1].at || 0) - (a[1].at || 0));
  const canLantern = g.phase === "between";
  const charges = [...V.items.entries()].filter(([, i]) => i.kind === "charge" && i.by === me);
  const pick = (act, id, on, inner, extra = "") => `<button type="button" data-act="${act}" data-id="${id}" aria-pressed="${on ? "true" : "false"}" class="${on ? "on" : ""}" ${extra}>${inner}</button>`;
  const emberDot = (e, big) => `<span class="ember" style="--c:${cssHue(elHex(MOVES[e.move][1]))};--s:${big ? 10 + (e.glow || 3) * 3 : 14}px"></span>`;
  const ch = hd.ember && held.find(([k]) => k === hd.ember);
  return `<div class="stack"><h2>The hearth</h2>
    <p class="muted">When something stirs you, sit with it. What's left is a little glowing ember you keep. At the hearth you can turn embers into things for your home together, or a present.</p>
    ${held.length ? `<div class="stack"><h3>Your embers</h3><p class="small muted">Only you see these.</p>
      <div class="choice">${held.map(([k, e]) => pick("hEmber", k, hd.ember === k, `${emberDot(e, true)}<b>${esc(MOVES[e.move][0])}</b>from ${esc(FEELS[MOVES[e.move][1]])}`)).join("")}</div>
      ${ch ? (canLantern ? `<label class="row" style="font-weight:400"><input type="checkbox" id="hShowEl" style="width:auto" ${hd.showEl ? "checked" : ""}> Show its element on the lantern</label>
        <p class="small muted">A lantern is an offer. It stands by the hearth until ${esc(nameOf(other(g), g))} welcomes it; it never shows what you felt or how strongly.</p>
        <div class="row"><button type="button" data-act="hLantern" data-id="${ch[0]}">Make a lantern</button></div>`
        : isHome(g) ? `<p class="small muted">Embers you keep here go with you. In a room you share, one can become a lantern for your home together.</p>`
        : `<p class="small muted">Once ${esc(g.setup.who)} joins, an ember can become a lantern for your home together.</p>`) : ""}</div>` : ""}
    <div class="stack"><h3>Work a charge</h3>
      <label for="hCharge">What stirred you<select id="hCharge"><option value="">A feeling with no words</option>${charges.map(([k, i]) => `<option value="${k}" ${hd.charge === k ? "selected" : ""}>${esc(String(i.text || "").slice(0, 70))}</option>`).join("")}</select></label>
      <span class="small"><b>What it felt like</b></span>
      <div class="choice">${Object.entries(FEELS).map(([el, f]) => pick("hFeel", el, hd.feel === el, `<span class="ember" style="--c:${cssHue(elHex(el))};--s:12px"></span><b>${f[0].toUpperCase() + f.slice(1)}</b>${el}`)).join("")}</div>
      ${hd.feel ? `<span class="small"><b>A move to work it with</b></span>
      <div class="choice">${movesFrom(hd.feel).map(([id, m]) => pick("hMove", id, hd.move === id, `<b>${esc(m[0])}</b>${m[1] === m[2] ? "stays " + m[1] : m[1] + " into " + m[2]}`)).join("")}</div>` : ""}
      ${hd.move ? `<span class="small"><b>How strong it felt</b> <span class="muted">(only you see this)</span></span>
      <div class="row dots">${[1, 2, 3, 4, 5].map(n => pick("hGlow", n, hd.glow === n, `<span class="ember" style="--c:${cssHue(elHex(hd.feel))};--s:${8 + n * 3}px"></span>`, `aria-label="${n} of 5"`)).join("")}${pick("hGlow", 0, !hd.glow, "Skip")}</div>
      <div class="row"><button type="button" data-act="hKeep">Keep the ember</button></div>` : ""}
    </div>
    <p class="credit">${FIVE_CREDIT}</p></div>`;
}
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
  if (name === "hearth" && sheetName !== "hearth") hd = {};
  if (name === "look" && sheetName !== "look") lookDraft = null;
  if (name === "checkin" && sheetName !== "checkin") checkFeel = null;
  if (name === "invitations" || name === "rooms") refreshList();
  sheetName = name; sheetArg = arg; renderSheet();
}
function closeSheet() {
  const wasLook = sheetName === "look";
  sheetName = null; sheetArg = null; $("#sheet").hidden = true; $("#scrim").hidden = true;
  if (wasLook) { lookDraft = null; ensureMyBody().catch(() => {}); } // an unkept draft goes back to the kept look
  refreshHud();
}
// Setup is closeable now: there is always the homeroom to stand in (br-home-is-a-room).
$("#scrim").addEventListener("click", () => { if (sheetName !== "setup" || garden) closeSheet(); });
function renderSheet() {
  if (!sheetName) return;
  const V = view(); const g = V.g;
  const close = `<button class="quiet close" type="button" data-close>Close</button>`;
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
    case "spirit": h = `<form class="stack" id="spiritForm"><h2>Bring one of your spirits to visit</h2>
      <p class="muted small">A visiting spirit stays yours. The other person can meet it and greet it; only you can call it or send it home.</p>
      <label for="spName">Its name<input id="spName" maxlength="60" required placeholder="What you call it"></label>
      <label for="spEl">Element<select id="spEl">${Object.keys(ELEMENTS).map(e => `<option>${e}</option>`).join("")}</select></label>
      <label for="spForm">Its form<select id="spForm">${Object.entries(FORMS).map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select></label>
      <label for="spNote">What it brings to the garden<textarea id="spNote" maxlength="600"></textarea></label>
      <div class="row"><button type="submit">Bring it in</button>${close}</div></form>`; break;
    case "daemon": { const mine = new Set([...V.daemons.values()].filter(d => d.owner === me).map(d => d.which));
      h = `<div class="stack"><h2>Bring a daemon</h2>
      <p class="muted small">Your daemons are yours. They walk the garden and meet what is here; the other person can greet them and cannot command them. Bring one when it is part of what you are working on.</p>
      <div class="choice">${Object.entries(DAEMONS).map(([k, [n, d]]) => `<button type="button" data-act="bringDaemon" data-id="${k}" ${mine.has(k) ? "disabled" : ""}><b>${n}</b>${mine.has(k) ? "here already" : esc(d)}</button>`).join("")}</div>
      ${close}</div>`; break; }
    case "pictures": h = picturesSheet(g, V) + close; break;
    case "hearth": if (!g || !hearthOpen()) { closeSheet(); return; } h = hearthSheet(g, V) + close; break;
    case "away": h = awaySheet(g, V) + close; break;
    case "menu": h = menuSheet(g, V); break;
    case "ending": h = endingSheet(g, V) + close; break;
    case "welcome": { const u = g && g.joinRequest && g.joinRequest.uid; if (!u || g.phase !== "spark") { closeSheet(); return; }
      h = `<div class="stack"><h2>Welcome ${esc(nameOf(u, g))} in</h2>
      <p>A new Between begins for the two of you, and its history starts now. What you tended alone stays with you, out of the shared garden.</p>
      <p class="muted small">Your spark can walk beside the Between as your own spirit, or you can let it compost: what it carried is worked, and nothing of it is shown to them.</p>
      <div class="row"><button type="button" data-act="welcomeKeep">Keep it as my own spirit</button><button class="ghost" type="button" data-act="welcomeCompost">Let it compost</button>${close}</div></div>`; break; }
    case "rooms": h = roomsSheet() + close; break;
    case "orient": if (!portalTo) { closeSheet(); return; } h = orientSheet() + close; break;
    case "look": h = lookSheet() + close; break;
    case "goals": h = goalsSheet() + close; break;
    case "checkin": h = checkinSheet() + close; break;
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
  $("#sheet").hidden = false; $("#scrim").hidden = false;
  readIn(inner);
  const first = $("#sheetInner").querySelector("input, textarea, select"); if (first && !keep[first.id]) setTimeout(() => first.focus({ preventScroll: true }), 50);
}
/* ---------- the orientation before an invitation's doorway opens (part 3, his ruling of 2026-10-23) ---------- */
function orientSheet() {
  return `<form class="stack" id="orientForm"><h2>Before you go in</h2>
    <p>${esc(portalTo.name ? portalTo.name + " invited you" : "Someone invited you")} to a room you would share. In the room lives the Between: a creature made of what the two of you bring each other.</p>
    <h3>The rules</h3>
    <ul class="log"><li><b>Yes before anything changes.</b> What one of you brings waits for the other's yes. The room's look changes only when you both say yes.</li>
      <li><b>You can leave at any time.</b> More, then "Need a silent exit?", closes the room. The other person sees only that it closed, never who left or why.</li>
      <li><b>Nothing is scored.</b> No points, no counts, no comparing. What you tend is kept as it happened.</li>
      <li><b>Your homeroom stays yours.</b> Your look, your hopes and your check-ins never leave it.</li></ul>
    <label class="tick"><input type="checkbox" id="oRead"> I have read this</label>
    <div class="row"><button type="submit" id="oOpen" disabled>Open the doorway</button></div></form>`;
}
document.addEventListener("change", ev => { if (ev.target.id === "oRead") { const b = $("#oOpen"); if (b) b.disabled = !ev.target.checked; } });
document.addEventListener("submit", ev => {
  if (ev.target.id !== "orientForm") return;
  ev.preventDefault();
  if (!$("#oRead").checked || !portalTo) return;
  portalTo.open = true; closeSheet(); burst(PORTAL_AT.clone(), 0xffe2a8);
  selected = "portal"; refreshHud();
  toast("The doorway is open. Walk through when you are ready.");
});

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
      <button type="button" data-act="goRoom" data-id="${esc(r.id)}">Go in</button></div>`;
  };
  return `<div class="stack"><h2>Your rooms</h2>
    <p class="small muted">One room for each relationship. Each starts as a spark you tend alone, and becomes your Between once they join.</p>
    ${open.length ? open.map(row).join("") : `<p class="muted">No rooms yet. Make one for someone you want to work on things with.</p>`}
    <div class="row"><button type="button" data-open="setup">Make a new room</button></div>
    ${closed.length ? `<details><summary>Closed rooms</summary>${closed.map(row).join("")}</details>` : ""}</div>`;
}
function lookSheet() {
  if (!lookDraft) lookDraft = parseLook(lookOf(me) || "") || { ...DEFAULT_LOOK };
  const opt = (k, o) => `<button type="button" class="${lookDraft[k] === o.id ? "on" : ""}" aria-pressed="${lookDraft[k] === o.id}" data-act="lookPick" data-id="${k}:${o.id}">${o.swatch ? `<i class="sw" style="background:${o.swatch}"></i>` : ""}${esc(o.label)}</button>`;
  const t = lookText(lookDraft);
  return `<div class="stack"><h2>How you look</h2>
    <p class="small muted">Your figure changes as you choose. The other person in each room sees you as you make yourself here. A look is choices, never a photo.</p>
    ${BEATS.map(b => `<div class="stack"><h3>${esc(b.title)}</h3>${b.groups.map(gr => `<span class="eyebrow">${esc(gr.label)}</span><div class="dots">${optionsOf(gr.k).map(o => opt(gr.k, o)).join("")}</div>`).join("")}</div>`).join("")}
    <div class="row"><button type="button" data-act="lookKeep">Keep this look</button><button class="ghost" type="button" data-act="lookRandom">Choose for me</button></div>
    <p class="small muted">The same look opens Chapter 1's creator: <a href="${CHAPTER1_LOOK(t)}" target="_blank" rel="noopener">take this look to Chapter 1</a>. Hair colour shows there; this figure has no hair yet.</p></div>`;
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
let checkFeel = null;
function checkinSheet() {
  const past = Object.values(myHome.checkins || {}).filter(Boolean).sort((a, b) => b.at - a.at).slice(0, 5);
  return `<form class="stack" id="checkForm"><h2>Check in with yourself</h2>
    <p class="small muted">Before anyone else: how are you? Only you see this.</p>
    <span class="eyebrow">What is here</span><div class="dots">${FEEL_ORDER.map(f => `<button type="button" class="${checkFeel === f ? "on" : ""}" aria-pressed="${checkFeel === f}" data-act="checkFeel" data-id="${f}"><i class="sw" style="background:${cssHue(elHex(f))}"></i>${FEELS[f][0].toUpperCase() + FEELS[f].slice(1)}</button>`).join("")}</div>
    <label for="cLine">One line, if you like<input id="cLine" maxlength="280" placeholder="What it is about"></label>
    <div class="row"><button type="submit">Check in</button></div>
    ${past.length ? `<details><summary>Your last check-ins</summary><ul class="log">${past.map(c => `<li>${esc(c.feel ? FEELS[c.feel] : "")}${c.line ? `: <i>${esc(c.line)}</i>` : ""} <span class="muted small">· ${fmt(c.at)}</span></li>`).join("")}</ul></details>` : ""}</form>`;
}
function invitationsSheet() {
  const rooms = ((list && list.gardens) || []).filter(r => r.phase !== "closed");
  const asks = rooms.flatMap(r => (r.invitations || []).map(inv => ({ r, inv })));
  const joins = rooms.filter(r => r.joinWaiting);
  return `<div class="stack"><h2>Invitations</h2>
    ${asks.length ? asks.map(({ r, inv }) => `<div class="roomrow"><div><b>${esc(roomName(r))} asks you to come and sit</b><span class="small muted">${inv.when ? "At " + fmt(inv.when) : "Whenever you can"}${inv.note ? ` · <i>${esc(inv.note)}</i>` : ""}</span></div>
      <div class="row">${answerBtns(r.id, inv.id)}</div></div>`).join("") : `<p class="muted">No invitations wait for you.</p>`}
    ${joins.map(r => `<div class="roomrow"><div><b>Someone asked to join your spark toward ${esc(r.who || "them")}</b><span class="small muted">Go in and welcome them at the spark.</span></div><button type="button" data-act="goRoom" data-id="${esc(r.id)}">Go in</button></div>`).join("")}
    <p class="small muted">To invite someone, go into their room and use Invite.</p></div>`;
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
      <label for="sWhen">When<input id="sWhen" type="datetime-local"></label>
      <label for="sNote">A note<input id="sNote" maxlength="280" placeholder="Optional"></label>
      <div class="row"><button type="submit">Send the invitation</button></div>
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
  if (a === "sound") { ambient.toggle(); soundLabel(); return; }
  if (a === "hFeel") { hd = { ...hd, feel: id, move: null, glow: null }; renderSheet(); return; }
  if (a === "hMove") { hd.move = id; renderSheet(); return; }
  if (a === "hGlow") { hd.glow = +id || null; renderSheet(); return; }
  if (a === "hEmber") { hd.ember = hd.ember === id ? null : id; renderSheet(); return; }
  if (a === "move") { const it = view().items.get(id); const r = moveRight(it); if (!r) return; placing = { id, ask: r === "shared" }; selected = null; refreshHud(); toast(r === "shared" ? "Tap the floor where you would like it." : "Tap the floor where it should stand, or drag it."); return; }
  if (a.startsWith("pace:")) { setPace(a.slice(5)); if (gardenId && isMember(view().g)) { myPrivate.captions = getPace(); savePriv(); } renderSheet(); return; }
  if (a === "lanternCancel") { placing = null; refreshHud(); return; }
  if (a === "lookPick") { const [k, v] = id.split(":"); lookDraft = { ...lookDraft, [k]: v }; renderSheet(); ensureMyBody().catch(() => {}); return; }
  if (a === "lookRandom") { lookDraft = randomLook(); renderSheet(); ensureMyBody().catch(() => {}); return; }
  if (a === "checkFeel") { checkFeel = checkFeel === id ? null : id; renderSheet(); return; }
  if (a === "goHome") { goRoom(null); return; }
  if (a === "goRoom") { goRoom(id); return; }
  if (a === "through") { if (portalTo) walkThrough(portalTo.id, portalTo.invite); return; }
  if (a === "next") {
    if (id.startsWith("room:")) { goRoom(id.slice(5)); return; }
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
    else if (a === "hLantern") await makeLantern(id);
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
      await op((type === "s" ? "spirits/" : "daemons/") + did, "delete");
    }
    else if (a === "greet") {
      const w = walkers.get(id);
      if (w && w.holder) burst(w.holder.position, hueOf(me, g));
      myWave = now(); pollSoon();
      toast("It noticed you.");
    }
    else if (a === "sit") { const i = mySeat(); if (i >= 0) { meState.seatWant = i; meState.target = seatPos(i); } }
    else if (a === "stand") { const i = meState.seatWant ?? 0; standUp(); meState.target = pushOut(seatPos(i).add(new THREE.Vector3(Math.sign(SEATS[i].x) * 0.4, 0, 1.0))); }
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
    else if (a === "lookKeep") { await keepLook(); lookDraft = null; closeSheet(); toast("Kept. Each of your rooms shows you this way now."); }
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
      const spot = spotAhead(1.2);
      await op("spirits/s" + hkey(), "set", { owner: me, name, element: $("#spEl").value, form: $("#spForm").value, note: $("#spNote").value.trim(), at: now(),
        stay: { x: spot.x, z: spot.z, at: now(), until: now() + 20000 }, history: hist("brought a spirit to visit", name) });
      await touch(); closeSheet();
    } else if (f.id === "goalForm") {
      const text = $("#gText").value.trim(); if (!text) { toast("Write the goal first. A few words are enough."); return; }
      const room = $("#gRoom").value || null;
      await homeOp({ goals: { ["g" + hkey()]: { text, room, at: now() } } });
      $("#gText").value = ""; renderSheet(); toast("Kept in your homeroom. Only you see it.");
    } else if (f.id === "checkForm") {
      if (!checkFeel) { toast("Choose what is here first."); return; }
      const at = now();
      await homeOp({ checkins: { ["c" + hkey()]: { feel: checkFeel, line: $("#cLine").value.trim() || null, at } }, lastCheckin: at });
      checkFeel = null; closeSheet(); toast("Checked in. That one is yours.");
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
  else if (ev.target.id === "hShowEl") hd.showEl = ev.target.checked;
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
let styleNow = null;
function setStyle(id) {
  const s = styleOf(id);
  if (!hollow || s.id === styleNow) return;
  styleNow = s.id;
  applyStyle({ ...hollow.handles, scene }, s);
}

/* ---------- one refresh for everything the store drives ---------- */
let refreshQueued = false;
function refresh() {
  if (refreshQueued) return; refreshQueued = true;
  queueMicrotask(() => {
    refreshQueued = false;
    const V = view(); const g = V.g;
    if (g && g.phase !== "closed") { const s = satisfaction(V.items); look = { phase: g.phase, state: stateOf(s), stale: isStale(g), sat: s }; }
    else look = { phase: "spark", state: "steadied", stale: true, sat: 2 };
    between.visible = !!g && !isHome(g); mirror.visible = isHome(g);
    setStyle(g && g.style);
    syncThings(); syncWalkers();
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
(async function boot() {
  loadStep("building the hollow");
  const roomP = Promise.resolve().then(buildRoom).catch(e => {
    $("#loadMsg").innerHTML = `The garden did not load. Check your connection and open the page again.<br><small style="opacity:.6">${esc((e && (e.message || e.type)) || e)}</small><br><button type="button" onclick="location.reload()" style="margin-top:12px">Try again</button>`;
    throw e;
  });
  roomP.then(() => loadStep(roomOk = "hollow built"), () => {});
  const q = new URLSearchParams(location.search);
  const want = q.get("g"), wantInvite = q.get("invite");
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
    if (want && homeId && want !== homeId && through !== want && !skipHome) {
      const r = ((list && list.gardens) || []).find(x => x.id === want);
      portalTo = { id: want, invite: r ? null : wantInvite, open: !!r, name: r ? roomName(r) : null, style: r ? r.style : null };
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
  $("#loading").hidden = true; $("#hud").hidden = false;
  if (!garden && !storeDown) openSheet("setup");
  refresh();
  // ?sheet= opens a sheet at once, for a preview link that starts where the test starts
  const jump = q.get("sheet");
  if (jump && ["rooms", "look", "style", "invite", "checkin", "goals", "invitations", "spellbook", "orient"].includes(jump) && garden) openSheet(jump);
  else if (portalTo && !portalTo.open) openSheet("orient");
  requestAnimationFrame(frame);
  setTimeout(() => { const V = view(); if (V.g && isMember(V.g) && awayActs(V.g, V).length) toast(`${nameOf(other(V.g), V.g)} tended the garden while you were away. See "While you were away".`); }, 1500);
  flush();
  pollTimer = setTimeout(poll, 2500);
})();
window.__between = { outbox, view, meState, peers, walkers, things, look: () => look, tapAt, camera, poll, ids: () => ({ gardenId, me, invite: myInvite, portalTo, homeId }),
  seatPos, mySeat, creature, renderer, scene, setCam: a => { debugCam = a; }, screenOf: v => { const p = v.clone().project(camera); return [(p.x + 1) / 2 * innerWidth, (1 - p.y) / 2 * innerHeight]; } };
