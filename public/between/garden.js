/* The Between, in 3D, on bars-engine. Carried from the claude.ai artifact page (https://claude.ai/artifact/NTi4jcpaHkDEMnqpVA9LBq, version 4)
   with its boot and store calls replaced: the store is Postgres behind /api/between, polled (bh-async-first). */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as skClone } from "three/addons/utils/SkeletonUtils.js";

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
const BETWEEN_AT = new THREE.Vector3(0, 0, -3);
const SPAWN = [new THREE.Vector3(-1.2, 0, 3.2), new THREE.Vector3(1.2, 0, 3.2)];
const ROOM_R = 8.4;
const OBST = [[-5.4, 4.2, 2.1], [5.25, 4.3, 2.1], [-3.9, -7.05, 1.2], [6.6, -3.9, 1.6], [1.95, -7.9, 0.7], [0, -3, 0.9]];

/* ---------- state ---------- */
let me = null, gardenId = null, invite = null, myInvite = null;
let garden = null, gardenLoaded = false;
const items = new Map(), spirits = new Map(), daemons = new Map(), shown = new Map();
const names = {};
let awaySince = null, myPrivate = {}, readOnly = false;
let sheetName = null, sheetArg = null, selected = null;
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
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, 3400); }
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
  else if (c === "data") { if (path === privPath()) myPrivate = { ...(doc || {}) }; }
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
function satisfaction(its) {
  let agreed = 0, fed = 0;
  for (const it of its.values()) {
    if (it.kind === "agreement" && it.status === "agreed") agreed++;
    else if (it.kind !== "agreement" && (it.status === "received" || it.status === "kept")) fed++;
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
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
stage.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0a08);
scene.fog = new THREE.Fog(0x0d0a08, 14, 34);
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 80);
const hemi = new THREE.HemisphereLight(0xffe6c4, 0x2a2018, 0.8);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffd9a8, 0.9); sun.position.set(3, 9, 4); scene.add(sun);
const coveLights = [];
for (let i = 0; i < 8; i++) {
  const a = i / 8 * Math.PI * 2 + 0.39;
  const l = new THREE.PointLight(0xffb36b, 9, 11, 1.6); l.position.set(Math.sin(a) * 6.6, 4.2, Math.cos(a) * 6.6); scene.add(l); coveLights.push(l);
}
const doorLight = new THREE.PointLight(0xffe2b0, 18, 12, 1.5); doorLight.position.set(0, 2.4, -9); scene.add(doorLight);
const betweenLight = new THREE.PointLight(0x9ad8cf, 14, 9, 1.4); betweenLight.position.set(BETWEEN_AT.x, 2.2, BETWEEN_AT.z); scene.add(betweenLight);
let lightScale = 1;

function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < h ? 68 : 55; camera.updateProjectionMatrix(); }
addEventListener("resize", resize); resize();

const loader = new GLTFLoader();
/* Models are plain .glb files served beside the page; the WAVE room's dome comes from the cave's own build. */
const MODELS = "/between/m/", ROOM_GLB = "/ontology-game/cave/rooms/wave-room.glb";
const loadGltf = url => loader.loadAsync(url);
function loadStep(msg) { const el = $("#loadStep"); if (el) el.textContent = msg; }
const templates = {};
function loadModel(name) {
  if (!templates[name]) templates[name] = loadGltf(MODELS + name + ".glb").then(g => {
    const root = g.scene; root.updateMatrixWorld(true);
    let box = new THREE.Box3();
    root.traverse(o => { if (o.isMesh) { if (o.isSkinnedMesh) { o.computeBoundingBox(); const b = o.boundingBox.clone().applyMatrix4(o.matrixWorld); box.union(b); } else box.expandByObject(o); } });
    return { scene: root, anims: g.animations, box };
  });
  return templates[name];
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
  if (acts.Idle) acts.Idle.play();
  let walking = false;
  return {
    holder, mixer,
    setWalking(w) {
      if (w === walking) return; walking = w;
      if (acts.Walk) { if (w) { acts.Walk.reset().fadeIn(0.2).play(); acts.Idle && acts.Idle.fadeOut(0.2); } else { acts.Walk.fadeOut(0.3); if (acts.Idle) acts.Idle.reset().fadeIn(0.3).play(); } }
    },
  };
}
const FACE = 0; // the bodies face +z in their files

let roomReady = false;
async function buildRoom() {
  const g = await loadGltf(ROOM_GLB);
  const drop = [];
  g.scene.traverse(o => {
    if (o.isLight) drop.push(o); // the file's lamps are in Blender watts; this page lights the cave itself
    if (o.isMesh && /^(player|seat)$/i.test(o.name)) o.visible = false;
    if (o.isMesh && o.name === "door_2") o.position.x -= 0.7;
    if (o.isMesh && o.name === "door_3") o.position.x += 0.7;
  });
  drop.forEach(o => o.parent && o.parent.remove(o));
  scene.add(g.scene);
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

/* ---------- the Between (or the spark) ---------- */
const between = new THREE.Group(); between.position.copy(BETWEEN_AT); scene.add(between);
const matA = new THREE.MeshStandardMaterial({ color: 0x5fc0b5, emissive: 0x2f8f86, emissiveIntensity: 0.6, roughness: 0.35, transparent: true, opacity: 0.92 });
const matB = new THREE.MeshStandardMaterial({ color: 0xd48bc0, emissive: 0x9a4f86, emissiveIntensity: 0.6, roughness: 0.35, transparent: true, opacity: 0.85 });
const body = new THREE.Group(); between.add(body);
const lobeA = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 24), matA); lobeA.position.set(-0.26, 0.95, 0); lobeA.scale.set(1, 1.08, 0.9);
const lobeB = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 24), matB); lobeB.position.set(0.26, 0.95, 0.02); lobeB.scale.set(1, 1.08, 0.9);
const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1b1612, roughness: 0.4 });
const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), eyeMat); eyeL.position.set(-0.2, 1.1, 0.56);
const eyeR = eyeL.clone(); eyeR.position.x = 0.2;
const leafGeo = new THREE.ConeGeometry(0.12, 0.5, 8);
const leafL = new THREE.Mesh(leafGeo, matA); leafL.position.set(-0.2, 1.72, 0); leafL.rotation.z = 0.5;
const leafR = new THREE.Mesh(leafGeo, matB); leafR.position.set(0.2, 1.72, 0); leafR.rotation.z = -0.5;
body.add(lobeA, lobeB, eyeL, eyeR, leafL, leafR);
const flameMat = new THREE.MeshStandardMaterial({ color: 0xd48bc0, emissive: 0xd48bc0, emissiveIntensity: 1.3, transparent: true, opacity: 0.85 });
const spark = new THREE.Group(); between.add(spark);
const flame = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.1, 20, 1, true), flameMat); flame.position.y = 1.15;
const flameCore = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), flameMat); flameCore.position.y = 0.7;
spark.add(flame, flameCore);
const mound = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.15, 0.22, 28), new THREE.MeshStandardMaterial({ color: 0x3b3128, roughness: 0.95 }));
mound.position.y = 0.11; between.add(mound);
/* sparks: the aura, fast and jagged when charged, slow when allied */
const MOTES = 40;
const moteGeo = new THREE.BufferGeometry(); moteGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MOTES * 3), 3));
const moteMat = new THREE.PointsMaterial({ color: 0xd48bc0, size: 0.09, transparent: true, opacity: 0.9, depthWrite: false });
const motes = new THREE.Points(moteGeo, moteMat); between.add(motes);
const fedOrbs = new THREE.Group(); between.add(fedOrbs);
let look = { phase: "spark", state: "steadied", stale: false, sat: 3 };

function stepBetween(t, dt) {
  const { phase, state, stale, sat } = look;
  const breath = (t % 10) < 4 ? Math.sin((t % 10) / 4 * Math.PI / 2) : Math.cos(((t % 10) - 4) / 6 * Math.PI / 2); // 4 s in, 6 s out
  const grow = 0.72 + sat * 0.04;
  spark.visible = phase === "spark";
  body.visible = phase !== "spark";
  if (phase === "spark") {
    const f = 0.85 + Math.sin(t * 9) * 0.06 + Math.sin(t * 23) * 0.04;
    spark.scale.set(grow * f, grow * (0.9 + 0.12 * breath), grow * f);
    flameMat.emissiveIntensity = stale ? 0.3 : 1.1 + Math.sin(t * 7) * 0.3;
  } else {
    const s = grow * (1 + 0.04 * breath);
    body.scale.setScalar(s);
    const jitter = state === "charged" ? 0.03 : 0;
    body.position.set((Math.random() - .5) * jitter, (Math.random() - .5) * jitter, 0);
    leafL.visible = leafR.visible = state === "allied";
    const lift = state === "allied" ? 1 : 0;
    eyeL.scale.y = eyeR.scale.y = state === "charged" ? 0.35 : 1;
    matA.emissiveIntensity = stale ? 0.08 : 0.45 + 0.3 * breath + 0.2 * lift;
    matB.emissiveIntensity = stale ? 0.08 : 0.45 + 0.3 * (1 - breath) + 0.2 * lift;
  }
  const grey = new THREE.Color(0x8d857b);
  matA.color.setHex(0x5fc0b5); matB.color.setHex(0xd48bc0); flameMat.color.setHex(0xd48bc0);
  if (stale) { matA.color.lerp(grey, 0.75); matB.color.lerp(grey, 0.75); flameMat.color.lerp(grey, 0.75); }
  const p = moteGeo.attributes.position.array;
  const speed = state === "charged" ? 2.6 : state === "allied" ? 0.35 : 0.8;
  const rad = state === "allied" ? 1.5 : 1.1;
  for (let i = 0; i < MOTES; i++) {
    const a = i / MOTES * Math.PI * 2 + t * speed * (i % 2 ? 1 : -0.7);
    const r = rad + (state === "charged" ? Math.sin(t * 13 + i * 3) * 0.25 : Math.sin(t + i) * 0.08);
    p[i * 3] = Math.cos(a) * r; p[i * 3 + 1] = 0.5 + ((i * 0.37 + t * (state === "charged" ? 0.9 : 0.25)) % 1.6); p[i * 3 + 2] = Math.sin(a) * r;
  }
  moteGeo.attributes.position.needsUpdate = true;
  moteMat.color.setHex(stale ? 0x8d857b : state === "charged" ? 0xd48bc0 : state === "allied" ? 0xbff0c0 : 0x9ad8cf);
  moteMat.opacity = stale ? 0.25 : 0.85;
  fedOrbs.children.forEach((o, i) => { const a = t * 0.4 + i / Math.max(1, fedOrbs.children.length) * Math.PI * 2; o.position.set(Math.cos(a) * 1.25, 2.1 + Math.sin(t * 1.3 + i) * 0.12, Math.sin(a) * 1.25); });
  const target = stale ? 0.45 : 1;
  lightScale += (target - lightScale) * Math.min(1, dt * 1.5);
  betweenLight.intensity = (phase === "spark" ? 8 : 14) * lightScale * (0.85 + 0.15 * breath);
  betweenLight.color.setHex(phase === "spark" ? 0xd48bc0 : state === "charged" ? 0xd9a0c8 : 0x9ad8cf);
  coveLights.forEach(l => l.intensity = 9 * lightScale);
  hemi.intensity = 0.8 * lightScale;
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
  return { x: BETWEEN_AT.x + 2.5, z: BETWEEN_AT.z + 1 };
}
const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6b5d4e, roughness: 0.9 });
const soilMat = new THREE.MeshStandardMaterial({ color: 0x2c2219, roughness: 1 });
const stemMat = new THREE.MeshStandardMaterial({ color: 0x5c8a4a, roughness: 0.7 });
const amberMat = new THREE.MeshStandardMaterial({ color: 0xe2a85c, emissive: 0xb0742a, emissiveIntensity: 0.6 });
function plantMesh(it, g) {
  const grp = new THREE.Group();
  const by = new THREE.Color(hueOf(it.by, g));
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.12, 14), soilMat); base.position.y = 0.06; grp.add(base);
  const st = it.status, pend = !!it.pending;
  const emit = c => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.55, roughness: 0.5 });
  if (st === "retired") {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.12), stoneMat); s.position.y = 0.3; grp.add(s);
  } else if (st === "composted") {
    base.scale.set(1.1, 1.6, 1.1);
  } else {
    const h = st === "draft" ? 0.25 : st === "proposed" ? 0.55 : 0.85;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, h, 6), stemMat); stem.position.y = 0.12 + h / 2; grp.add(stem);
    if (st === "revisit") { stem.rotation.z = 0.5; stem.position.x = 0.12; }
    const top = 0.12 + h;
    if (st === "draft") { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), emit(by)); b.position.y = top; grp.add(b); }
    else if (st === "proposed") { const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), emit(by)); b.position.y = top; b.userData.pulse = true; grp.add(b); }
    else {
      const petals = st === "revisit" ? [0xe2a85c] : [0x5fc0b5, 0xd48bc0];
      for (let i = 0; i < 6; i++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), emit(petals[i % petals.length]));
        const a = i / 6 * Math.PI * 2; p.position.set(Math.cos(a) * 0.15 + (st === "revisit" ? 0.3 : 0), top - (st === "revisit" ? 0.2 : 0), Math.sin(a) * 0.15); p.scale.y = 0.6; grp.add(p);
      }
      const c = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), amberMat); c.position.set(st === "revisit" ? 0.3 : 0, top - (st === "revisit" ? 0.2 : 0), 0); grp.add(c);
    }
    if (pend) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 24), amberMat); r.rotation.x = Math.PI / 2; r.position.y = 0.2; r.userData.pulse = true; grp.add(r); }
  }
  return grp;
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
    nextStatus.set(id, it.status + (it.pending ? "+p" : "") + (it.opened && it.opened[me] ? "+o" : ""));
    const shownHere = it.kind === "agreement" ? it.status !== "composted" || now() - it.at < 864e5 * 30 : it.status === "offered";
    const was = prevStatus.get(id);
    if (was && was.startsWith("offered") && (it.status === "received" || it.status === "kept")) flyIn(id);
    if (!was && syncThings.prev && it.status === "kept" && it.kind !== "agreement") flyIn(id, it);
    if (!shownHere) continue;
    want.add(id);
    const sig = nextStatus.get(id) + "|" + it.by;
    let t = things.get(id);
    if (t && t.sig !== sig) { gardenGroup.remove(t.group); t = null; }
    if (!t) {
      const pos = it.pos || ringPos(id, it.kind === "agreement" ? 2.6 : 1.7);
      const group = it.kind === "agreement" ? plantMesh(it, g) : orbMesh(it, g);
      group.position.set(pos.x, 0, pos.z);
      gardenGroup.add(group);
      t = { id, kind: it.kind === "agreement" ? "agreement" : "offering", group, pos: new THREE.Vector3(pos.x, 0, pos.z), sig };
      things.set(id, t);
      if (syncThings.prev && !was && it.by !== me) burst(t.pos, hueOf(it.by, g));
    }
    t.item = it;
  }
  for (const [id, t] of things) if (!want.has(id)) { gardenGroup.remove(t.group); things.delete(id); if (selected === "item:" + id) selected = null; }
  syncThings.prev = nextStatus;
  // fed lights orbiting the Between: one per offering said yes to, up to twelve
  let fed = 0; for (const it of V.items.values()) if (it.kind !== "agreement" && (it.status === "received" || it.status === "kept")) fed++;
  fed = Math.min(fed, 12);
  while (fedOrbs.children.length < fed) fedOrbs.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe2b0 })));
  while (fedOrbs.children.length > fed) fedOrbs.remove(fedOrbs.children[fedOrbs.children.length - 1]);
}
function flyIn(id, it) {
  const t = things.get(id);
  const from = t ? t.pos.clone().setY(0.62) : (it && it.pos ? new THREE.Vector3(it.pos.x, 0.62, it.pos.z) : new THREE.Vector3(BETWEEN_AT.x + 2, 0.62, BETWEEN_AT.z + 2));
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
function walkable(x, z, pad = 0.35) {
  if (Math.hypot(x, z) > ROOM_R - pad) return false;
  for (const [ox, oz, r] of OBST) if (Math.hypot(x - ox, z - oz) < r + pad) return false;
  return true;
}
function pushOut(v, pad = 0.35) {
  const d = Math.hypot(v.x, v.z), max = ROOM_R - pad;
  if (d > max) { v.x *= max / d; v.z *= max / d; }
  for (const [ox, oz, r] of OBST) {
    const dx = v.x - ox, dz = v.z - oz, dd = Math.hypot(dx, dz), m = r + pad;
    if (dd < m && dd > 1e-4) { v.x = ox + dx / dd * m; v.z = oz + dz / dd * m; }
  }
  return v;
}
const LEG = 9; // seconds per leg: about five walking, the rest standing
function waypoint(seed, k, mode) {
  const r = rng(hash(seed + ":" + k));
  for (let i = 0; i < 30; i++) {
    let x, z;
    if (mode === "near" || (mode === "mixed" && r() < 0.5)) { const a = r() * Math.PI * 2, rr = 1.4 + r() * 1.6; x = BETWEEN_AT.x + Math.cos(a) * rr; z = BETWEEN_AT.z + Math.sin(a) * rr; }
    else { const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * (ROOM_R - 0.8); x = Math.cos(a) * rr; z = Math.sin(a) * rr; }
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
  const a = waypoint(w.id, k, mode), b = waypoint(w.id, k + 1, mode);
  const walkFrac = 0.55;
  const u = f < walkFrac ? f / walkFrac : 1;
  const e = u * u * (3 - 2 * u);
  const p = a.clone().lerp(b, e);
  // just let go after being called over: walk from where it waited back onto its own path
  if (d.stay && now() - d.stay.until < 6000) {
    const v = (now() - d.stay.until) / 6000;
    return { p: new THREE.Vector2(d.stay.x, d.stay.z).lerp(p, v), moving: true, dir: p.clone().sub(new THREE.Vector2(d.stay.x, d.stay.z)) };
  }
  return { p, moving: f < walkFrac, dir: b.clone().sub(a) };
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
      w.body = b; w.holder = b.holder; w.ready = true; scene.add(b.holder);
    })().catch(() => {});
  }
}

/* ===================================================================================================
   People: you, and whoever else is in the room right now
   =================================================================================================== */
const meState = { pos: new THREE.Vector3(), yaw: Math.PI, target: null, body: null, keys: new Set(), placed: false };
const peers = new Map(); // peer -> { uid, body, pos, yaw, cur, walking }
let myBodyHue = null;
async function ensureMyBody() {
  const g = view().g;
  const hue = hueOf(me, g);
  if (meState.body && myBodyHue === hue) return;
  const b = await makeBody("player", 1.7, null, 0, { ring: hue });
  if (meState.body) scene.remove(meState.body.holder);
  meState.body = b; myBodyHue = hue; scene.add(b.holder);
}
function placeMe() {
  if (meState.placed) return;
  const g = view().g;
  const spot = g && g.startedBy && g.startedBy !== me ? SPAWN[1] : SPAWN[0];
  meState.pos.copy(spot); meState.yaw = Math.PI; meState.placed = true;
}
async function ensurePeerBody(p) {
  const hue = hueOf(p.uid, view().g);
  if (p.body && p.hue === hue) return;
  if (p.loading) return; p.loading = true;
  const b = await makeBody("player", 1.7, null, 0, { ring: hue });
  p.loading = false;
  if (!peers.has(p.peer)) return;
  if (p.body) scene.remove(p.body.holder);
  p.body = b; p.hue = hue; scene.add(b.holder);
}
let lastPresence = 0, lastSent = "";
/* Where you stand goes out with each poll, with where you are walking to, so the other screen walks your figure there
   at walking pace instead of jumping it every few seconds. A wave is a time stamp the other screen notices once. */
let myWave = null;
function presenceNow() {
  if (!me || !meState.placed) return null;
  const t = meState.target;
  return { x: +meState.pos.x.toFixed(2), z: +meState.pos.z.toFixed(2), h: +meState.yaw.toFixed(2), w: !!(t || meState.keys.size),
    tx: t ? +t.x.toFixed(2) : null, tz: t ? +t.z.toFixed(2) : null, wave: myWave };
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
    const clamp = v => Math.max(-ROOM_R, Math.min(ROOM_R, v));
    const goal = pr.w && typeof pr.tx === "number" ? [pr.tx, pr.tz] : [pr.x, pr.z];
    e.tx = clamp(goal[0]); e.tz = clamp(goal[1]); e.th = +pr.h || 0;
    if (Math.hypot(pr.x - e.pos.x, pr.z - e.pos.z) > 4) e.pos.set(pr.x, 0, pr.z); // too far behind to walk: catch up
    if (pr.wave && pr.wave !== e.wave) { if (!fresh && now() - pr.wave < 15000) { burst(new THREE.Vector3(pr.x, 0, pr.z), 0xffe2b0); waves.push({ peer: uid, t0: performance.now() / 1000 }); } e.wave = pr.wave; }
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
let camYaw = 0, camPitch = 0.42, camDist = 6.2;
const pointers = new Map(); let dragMoved = 0, pinch0 = null;
const ray = new THREE.Raycaster(); const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
renderer.domElement.addEventListener("pointerdown", e => { pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); dragMoved = 0; if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: camDist }; } renderer.domElement.setPointerCapture(e.pointerId); });
renderer.domElement.addEventListener("pointermove", e => {
  const p = pointers.get(e.pointerId); if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (pointers.size === 2 && pinch0) { const [a, b] = [...pointers.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); camDist = Math.max(3, Math.min(11, pinch0.dist * pinch0.d / Math.max(d, 1))); dragMoved += 99; return; }
  dragMoved += Math.abs(dx) + Math.abs(dy);
  if (dragMoved > 6) { camYaw -= dx * 0.006; camPitch = Math.max(0.12, Math.min(1.15, camPitch + dy * 0.004)); }
});
function endPointer(e) {
  const p = pointers.get(e.pointerId); pointers.delete(e.pointerId); if (pointers.size < 2) pinch0 = null;
  if (!p || dragMoved > 6 || pointers.size) return;
  tapAt(e.clientX, e.clientY);
}
renderer.domElement.addEventListener("pointerup", endPointer);
renderer.domElement.addEventListener("pointercancel", e => { pointers.delete(e.pointerId); pinch0 = null; });
renderer.domElement.addEventListener("wheel", e => { e.preventDefault(); camDist = Math.max(3, Math.min(11, camDist * (1 + Math.sign(e.deltaY) * 0.08))); }, { passive: false });
addEventListener("keydown", e => { if (sheetName || /input|textarea|select/i.test((e.target.tagName || ""))) return; const k = e.key.toLowerCase(); if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) { meState.keys.add(k); meState.target = null; e.preventDefault(); } });
addEventListener("keyup", e => meState.keys.delete(e.key.toLowerCase()));
addEventListener("blur", () => meState.keys.clear());

function tapAt(cx, cy) {
  const ndc = new THREE.Vector2(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  // things first: the nearest one whose sphere the ray passes through
  let best = null, bestD = Infinity;
  const consider = (key, pos, r) => { const d = ray.ray.distanceToPoint(pos); if (d < r) { const along = ray.ray.origin.distanceTo(pos); if (along < bestD) { bestD = along; best = { key, pos }; } } };
  consider("between", BETWEEN_AT.clone().setY(1), 1.0);
  for (const [id, t] of things) consider("item:" + id, t.pos.clone().setY(0.4), 0.5);
  for (const [k, w] of walkers) if (w.holder) consider("w:" + k, w.holder.position.clone().setY(w.type === "spirit" ? 0.4 : 0.9), 0.6);
  for (const [k, p] of peers) consider("p:" + k, p.pos.clone().setY(0.9), 0.5);
  if (best) {
    selected = best.key;
    const dir = meState.pos.clone().sub(best.pos).setY(0); const d = dir.length();
    if (d > 1.3) { dir.normalize(); meState.target = pushOut(best.pos.clone().add(dir.multiplyScalar(1.1))); }
    refreshHud(); return;
  }
  const hit = new THREE.Vector3();
  if (ray.ray.intersectPlane(floorPlane, hit)) { meState.target = pushOut(hit); selected = null; refreshHud(); }
}

/* ===================================================================================================
   Frame loop
   =================================================================================================== */
const clock = new THREE.Clock();
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
    if (walking) {
      const step = Math.min(move.length(), 2.3 * dt);
      move.normalize();
      meState.pos.add(move.clone().multiplyScalar(step)); pushOut(meState.pos);
      const want = Math.atan2(move.x, move.z);
      let d = want - meState.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); meState.yaw += d * Math.min(1, dt * 10);
    }
    meState.body.setWalking(walking);
    meState.body.holder.position.copy(meState.pos);
    meState.body.holder.rotation.y = meState.yaw + FACE;
    meState.body.mixer.update(dt);
    if (walking !== meState.wasWalking || (walking && meState.target !== meState.sentTarget)) { meState.sentTarget = meState.target; sendPresence(); }
    meState.wasWalking = walking;
  }
  // others
  for (const [k, p] of peers) {
    if (!p.body) continue;
    const gx = p.tx - p.pos.x, gz = p.tz - p.pos.z, gd = Math.hypot(gx, gz);
    p.walking = gd > 0.08;
    if (p.walking) { const step = Math.min(gd, 2.3 * dt); p.pos.x += gx / gd * step; p.pos.z += gz / gd * step; }
    const want = p.walking ? Math.atan2(gx, gz) : p.th;
    let d = want - p.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); p.yaw += d * Math.min(1, dt * 8);
    p.body.setWalking(p.walking);
    p.body.holder.position.copy(p.pos);
    p.body.holder.rotation.y = p.yaw + FACE;
    const wv = waves.find(w => w.peer === k && t - w.t0 < 1.4);
    p.body.holder.position.y = wv ? Math.abs(Math.sin((t - wv.t0) * 9)) * 0.12 : 0;
    p.body.mixer.update(dt);
  }
  // walkers
  const ws = [...walkers.values()].filter(w => w.ready);
  for (const w of ws) {
    const { p, moving, dir } = walkerPos(w, tShared);
    w.holder.position.set(p.x, 0, p.y);
    w.moving = moving;
  }
  for (const w of ws) {
    let yawTo = null;
    if (w.moving) { const dd = walkerPos(w, tShared).dir; if (dd.lengthSq() > 1e-4) yawTo = Math.atan2(dd.x, dd.y); w.meeting = null; }
    else {
      // standing: turn to the nearest other walker, or to the Between, and meet it
      let nb = null, nd = 2.6;
      for (const o of ws) { if (o === w) continue; const d = o.holder.position.distanceTo(w.holder.position); if (d < nd) { nd = d; nb = o; } }
      const tgt = nb ? nb.holder.position : (w.holder.position.distanceTo(BETWEEN_AT) < 3.4 ? BETWEEN_AT : null);
      if (tgt) yawTo = Math.atan2(tgt.x - w.holder.position.x, tgt.z - w.holder.position.z);
      w.meeting = nb;
    }
    if (yawTo != null) { let d = yawTo - w.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); w.yaw += d * Math.min(1, dt * 5); }
    w.holder.rotation.y = w.yaw + FACE;
    w.body.setWalking(w.moving);
    w.body.mixer.update(dt);
  }
  // the Between and the garden
  stepBetween(t, dt);
  for (const th of things.values()) th.group.children.forEach(c => { if (c.userData.bob) c.position.y = 0.62 + Math.sin(t * 2 + th.pos.x) * 0.06; if (c.userData.pulse) c.scale.setScalar(1 + Math.sin(t * 4) * 0.15); });
  for (let i = fly.length - 1; i >= 0; i--) {
    const f = fly[i], u = Math.min(1, (t - f.t0) / 1.6);
    const to = BETWEEN_AT.clone().setY(1.1);
    f.m.position.lerpVectors(f.from, to, u * u * (3 - 2 * u)); f.m.position.y += Math.sin(u * Math.PI) * 1.4;
    if (u >= 1) { scene.remove(f.m); fly.splice(i, 1); burst(BETWEEN_AT, 0xffe2b0); }
  }
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i], u = (t - b.t0) / 1.2;
    b.m.scale.setScalar(1 + u * 3); b.m.material.opacity = Math.max(0, 0.9 * (1 - u));
    if (u >= 1) { scene.remove(b.m); bursts.splice(i, 1); }
  }
  // camera follows you
  const focus = meState.pos.clone().setY(1.2);
  const cp = new THREE.Vector3(Math.sin(camYaw) * Math.cos(camPitch), Math.sin(camPitch), Math.cos(camYaw) * Math.cos(camPitch)).multiplyScalar(camDist).add(focus);
  const cd = Math.hypot(cp.x, cp.z); if (cd > 9.6) { cp.x *= 9.6 / cd; cp.z *= 9.6 / cd; }
  cp.y = Math.min(cp.y, 5);
  camera.position.lerp(cp, Math.min(1, dt * 6)); camera.lookAt(focus);
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
  for (const [id, t] of things) c("item:" + id, t.pos);
  for (const [k, w] of walkers) if (w.holder) c("w:" + k, w.holder.position);
  if (!best) { bd = 1.4; for (const [k, p] of peers) c("p:" + k, p.pos); }
  return best;
}
function posOf(key) {
  if (key === "between") return BETWEEN_AT;
  if (key.startsWith("item:")) { const t = things.get(key.slice(5)); return t && t.pos; }
  if (key.startsWith("w:")) { const w = walkers.get(key.slice(2)); return w && w.holder && w.holder.position; }
  if (key.startsWith("p:")) { const p = peers.get(key.slice(2)); return p && p.pos; }
  return null;
}
function drawLabels(t) {
  for (const el of labels.values()) el._seen = false;
  const V = view(); const g = V.g;
  if (g && g.phase !== "closed") {
    const nm = betweenName(V.items) || (g.phase === "spark" ? "The spark" : "The Between");
    placeLabel(label("between", nm, ""), BETWEEN_AT.clone().setY(2.6));
  }
  if (meState.body) placeLabel(label("me", "You", "you", cssHue(hueOf(me, g))), meState.pos.clone().setY(1.95));
  for (const [k, p] of peers) if (p.body) placeLabel(label("p:" + k, p.uid === me ? "You, in another window" : (names[p.uid] || (isMember(g) || (g && g.members && g.members[p.uid]) ? nameOf(p.uid, g) : "A visitor")), "you", cssHue(hueOf(p.uid, g))), p.pos.clone().setY(1.95));
  for (const [k, w] of walkers) {
    if (!w.holder) continue;
    const d = w.doc;
    const txt = w.type === "spirit" ? `${d.name} · ${possessive(d.owner, g)}` : `${(DAEMONS[d.which] || ["Daemon"])[0]} · ${possessive(d.owner, g)}`;
    const el = label("w:" + k, txt, w.holder.position.distanceTo(meState.pos) > 6 ? "dim" : "");
    placeLabel(el, w.holder.position.clone().setY(w.type === "spirit" ? 1.15 : 1.95));
    if (w.meeting && w.type === "daemon" && w.meeting.doc.owner !== d.owner) {
      const b = label("m:" + k, "meets " + (w.meeting.type === "spirit" ? w.meeting.doc.name : (DAEMONS[w.meeting.doc.which] || ["a daemon"])[0]), "bubble");
      placeLabel(b, w.holder.position.clone().setY(2.3));
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

  const hint = $("#hint");
  const others = [...peers.values()].filter(p => p.uid !== me);
  if (storeDown) hint.textContent = "The garden's store did not answer, so this is the room on its own and nothing here is saved. Reload the page to try again.";
  else if (!g) hint.textContent = "Tap the floor to walk. Drag to look around.";
  else if (g.phase === "closed") hint.textContent = "The garden is closed. Its history is yours to keep from More.";
  else if (!isMember(g)) hint.textContent = members(g).length >= 2 ? "This garden is held by two people. You can look around." : "A spark is waiting here. Walk up to it.";
  else if (g.phase === "spark") hint.textContent = g.joinRequest ? `${nameOf(g.joinRequest.uid, g)} asks to join. Walk to the spark to answer.` : `You tend this spark alone until ${g.setup.who} joins. Tap the floor to walk, drag to look.`;
  else if (others.length) hint.textContent = `${nameOf(others[0].uid, g)} is here with you now.`;
  else hint.textContent = `${nameOf(other(g), g)} is not here right now. What you do waits for them.`;

  // near
  const near = $("#near");
  const key = nearKey;
  const html = key ? nearHtml(key, V, g) : "";
  near.hidden = !html; if (near._h !== html) { near.innerHTML = html; near._h = html; }

  // tools
  const tools = [];
  if (storeDown) {}
  else if (!g) tools.push(`<button type="button" data-open="setup">Plant a spark here</button>`);
  else if (g.phase !== "closed" && isMember(g) && !readOnly) {
    tools.push(`<button type="button" data-open="offer">${g.phase === "spark" ? "Tend the spark" : "Offer something"}</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="agreement">Plant an agreement</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="spirit">Bring a spirit</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="daemon">Bring a daemon</button>`);
    tools.push(`<button class="glassbtn" type="button" data-open="pictures">Pictures</button>`);
    if (others.length) tools.push(`<button class="glassbtn" type="button" data-act="wave">Wave</button>`);
  } else if (g.phase !== "closed" && !isMember(g) && members(g).length < 2 && !readOnly) {
    tools.push(g.joinRequest && g.joinRequest.uid === me ? `<button class="glassbtn" type="button" data-act="unjoin">Take back my request</button>` : `<button type="button" data-act="join">Ask to join</button>`);
  }
  const th = tools.join("");
  const te = $("#tools"); if (te._h !== th) { te.innerHTML = th; te._h = th; }
}
function nearHtml(key, V, g) {
  if (!g) return "";
  const canTend = isMember(g) && !readOnly && g.phase !== "closed";
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
      return `<div class="what"><b>Agreement</b> · ${esc(AG_LABEL[it.status])}, from ${esc(nameOf(it.by, g))}<span class="t">${esc(it.text)}</span></div>${acts ? `<div class="row">${acts}</div>` : ""}`;
    }
    const sealedForMe = it.sealed && !mineIt && !(it.opened && it.opened[me]);
    let acts = "";
    if (canTend && it.status === "offered") acts = mineIt
      ? `<span class="small">Waiting for their yes.</span><button class="quiet" type="button" data-act="withdraw" data-id="${id}">Withdraw</button>`
      : sealedForMe ? `<button class="ghost" type="button" data-act="open" data-id="${id}">Open it</button><button class="quiet" type="button" data-act="decline" data-id="${id}">Let it pass unopened</button>`
      : `<button type="button" data-act="receive" data-id="${id}">Yes, take it in</button><button class="quiet" type="button" data-act="decline" data-id="${id}">Let it pass</button>`;
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
function openSheet(name, arg) { sheetName = name; sheetArg = arg; renderSheet(); }
function closeSheet() { sheetName = null; sheetArg = null; $("#sheet").hidden = true; $("#scrim").hidden = true; }
$("#scrim").addEventListener("click", () => { if (sheetName !== "setup") closeSheet(); });
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
    case "away": h = awaySheet(g, V) + close; break;
    case "menu": h = menuSheet(g, V); break;
    case "ending": h = endingSheet(g, V) + close; break;
    case "welcome": { const u = g && g.joinRequest && g.joinRequest.uid; if (!u || g.phase !== "spark") { closeSheet(); return; }
      h = `<div class="stack"><h2>Welcome ${esc(nameOf(u, g))} in</h2>
      <p>A new Between begins for the two of you, and its history starts now. What you tended alone stays with you, out of the shared garden.</p>
      <p class="muted small">Your spark can walk beside the Between as your own spirit, or you can let it compost: what it carried is worked, and nothing of it is shown to them.</p>
      <div class="row"><button type="button" data-act="welcomeKeep">Keep it as my own spirit</button><button class="ghost" type="button" data-act="welcomeCompost">Let it compost</button>${close}</div></div>`; break; }
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
  const first = $("#sheetInner").querySelector("input, textarea, select"); if (first && !keep[first.id]) setTimeout(() => first.focus({ preventScroll: true }), 50);
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
  return out.sort((a, b) => b.at - a.at);
}
const awayActs = (g, V) => awaySince ? allActs(V).filter(e => e.by !== me && e.at > awaySince) : [];
const actLine = (e, g) => `<li>${esc(nameOf(e.by, g))} ${esc(e.act)}${e.text ? `: <i>${esc(e.text)}</i>` : ""} <span class="muted small">· ${fmt(e.at)}</span></li>`;
function awaySheet(g, V) {
  const away = awayActs(g, V);
  const theirs = allActs(V).filter(e => e.by !== me).slice(0, 60);
  return `<div class="stack"><h2>How they held space while you were away</h2>
    <p class="small muted">The acts themselves, as they happened. Nothing here is counted or compared.</p>
    ${away.length ? `<ul class="log">${away.map(e => actLine(e, g)).join("")}</ul>` : `<p class="muted">Nothing new since you were last here.</p>`}
    ${theirs.length > away.length ? `<details><summary>Everything they have tended</summary><ul class="log">${theirs.map(e => actLine(e, g)).join("")}</ul></details>` : ""}</div>`;
}
function menuSheet(g, V) {
  return `<div class="stack"><h2>The Between</h2>
    ${g && g.setup ? `<p class="muted small">${esc(g.setup.kind)}${g.setup.hopes ? `. Hoped for: <i>${esc(g.setup.hopes)}</i>` : ""}</p>` : ""}
    <div class="row">
      ${g && isMember(g) && g.phase !== "closed" ? `<button class="ghost" type="button" data-open="ending">Ending</button>` : ""}
      ${g && isMember(g) ? `<button class="ghost" type="button" data-act="copy">Take my copy</button>` : ""}
      <button class="quiet" type="button" data-open="quiet">Need a silent exit?</button>
      <button class="quiet" type="button" data-close>Close</button>
    </div>
    <div class="stack small"><h3>How to move</h3><p class="muted">Tap the floor to walk there. Tap something to walk up to it. Drag to look around; pinch or scroll to come closer. On a keyboard, WASD or the arrows walk.</p>
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

/* ---------- clicks, forms ---------- */
document.addEventListener("click", async ev => {
  const b = ev.target.closest("[data-act],[data-open],[data-close]");
  if (!b) return;
  if (b.hasAttribute("data-close")) { closeSheet(); return; }
  if (b.dataset.open) { openSheet(b.dataset.open, b.dataset.id); return; }
  const a = b.dataset.act, id = b.dataset.id;
  const V = view(); const g = V.g;
  b.disabled = true;
  try {
    if (a.startsWith("ask:")) await itemAct(id, "ask", { act: a.slice(4), text: "" });
    else if (["propose", "withdraw", "agree", "pendingYes", "pendingNo", "pendingWithdraw", "receive", "decline", "open", "compostOwn"].includes(a)) await itemAct(id, a);
    else if (a === "notyet") await itemAct(id, "notyet", "");
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
    else if (a === "wave") {
      burst(meState.pos, hueOf(me, g));
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
      await op("garden/main", "set", { v: 1, startedBy: me, startedAt: now(), setup: { who, kind: $("#sKind").value, hopes: $("#sHope").value.trim() },
        members: { [me]: { joinedAt: now() } }, joinRequest: null, phase: "spark", lastTendedAt: now(), ending: null });
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
addEventListener("keydown", e => { if (e.key === "Escape" && sheetName && sheetName !== "setup") closeSheet(); });

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

/* ---------- one refresh for everything the store drives ---------- */
let refreshQueued = false;
function refresh() {
  if (refreshQueued) return; refreshQueued = true;
  queueMicrotask(() => {
    refreshQueued = false;
    const V = view(); const g = V.g;
    if (g && g.phase !== "closed") { const s = satisfaction(V.items); look = { phase: g.phase, state: stateOf(s), stale: isStale(g), sat: s }; }
    else look = { phase: "spark", state: "steadied", stale: true, sat: 2 };
    between.visible = !!g;
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
  loadStep("loading the cave");
  const roomP = buildRoom().catch(e => {
    $("#loadMsg").innerHTML = `The garden did not load. Check your connection and open the page again.<br><small style="opacity:.6">${esc((e && (e.message || e.type)) || e)}</small><br><button type="button" onclick="location.reload()" style="margin-top:12px">Try again</button>`;
    throw e;
  });
  roomP.then(() => loadStep(roomOk = "cave built"), () => {});
  const q = new URLSearchParams(location.search);
  gardenId = q.get("g"); invite = q.get("invite");
  loadStep("finding your garden");
  let first = null;
  try {
    if (!gardenId) {
      const r = await fetch("/api/between", { credentials: "same-origin", cache: "no-store" });
      if (r.status === 401) return toLogin();
      if (!r.ok) throw new Error("the garden list answered " + r.status);
      const list = await r.json();
      me = list.me; names[me] = list.name;
      const open = (list.gardens || []).filter(x => x.phase !== "closed").sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
      if (open.length) gardenId = open[0].id;
    }
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
    if (isMember(garden)) {
      myPrivate = { ...((first.mine || {}).garden || {}) };
      awaySince = myPrivate.lastSeen || null;
      myPrivate.lastSeen = now(); savePriv();
    }
  } else gardenLoaded = true;
  (ls.get("between.outbox." + gardenId + "." + me) || []).forEach(o => outbox.push(o));
  placeMe();
  if (!roomOk) loadStep("building the cave");
  try { await roomP; } catch { return; }
  $("#loading").hidden = true; $("#hud").hidden = false;
  if (!garden && !storeDown) openSheet("setup");
  refresh();
  requestAnimationFrame(frame);
  setTimeout(() => { const V = view(); if (V.g && isMember(V.g) && awayActs(V.g, V).length) toast(`${nameOf(other(V.g), V.g)} tended the garden while you were away. See "While you were away".`); }, 1500);
  flush();
  pollTimer = setTimeout(poll, 2500);
})();
window.__between = { outbox, view, meState, peers, walkers, things, look: () => look, tapAt, camera, poll, ids: () => ({ gardenId, me, invite: myInvite }) };
