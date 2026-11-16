/* The moot: a clearing ring (Six-faces-council shared-pick-room-look-1, his A, 2026-11-16; steer: both figures are the
   cultivation model). The third room of two, reached by the veil from the Between (garden.js realms(), key "clearing").

   Seven stones ring a small fire in the open at dusk, one for each card of the Chapter 1 hand (HAND, in its order). The two
   of you stand inside the ring. Tap a stone, send that card to the fire: it is the same letter as in the nook (lettersWrite,
   sealed server side until both are in), so nobody sees the other's card until the fire opens both at once. A sent card's
   stone is lit and stays lit. When both are in, the fire opens and the obstacle they draw is read here; the steps are taken
   back in the Between (obstacle.js), unchanged.

   ?g=<garden id> is the room. Previews with no server: ?demo=1 (nothing sent), ?demo=mine (yours sent, the other's
   sealed), ?demo=open (both in, the fire open); &card=0..6 picks yours, &who=f|m your figure. */
import * as THREE from "three";
import { HAND, ORDER, currentEncounter, encounterState, lineFor, obstacleLine, elementOf } from "../encounter-lines.js";

const Q = new URLSearchParams(location.search);
const GID = Q.get("g"), DEMO = Q.get("demo");
const $ = id => document.getElementById(id);
const FACE = id => { const f = String(id).split("-")[2] || ""; return f.charAt(0) + f.slice(1).toLowerCase(); };
const VERB = { GR: "Grow", RA: "Raise Awareness", DA: "Direct Action" };
const verbOf = id => VERB[String(id).split("-")[1]] || "";
const COL = { wood: 0x8fd07a, water: 0x7fc0ff, fire: 0xff8a3d, metal: 0xe8e4dc, earth: 0xd8b070 };

/* ---------- the letters, from the garden doc (or a preview) ---------- */
let me = null, L = null, selected = Q.get("card") ? Math.max(0, Math.min(6, +Q.get("card"))) : 0, busy = false, say = "";
const state = () => { const enc = currentEncounter(L || {}); return { enc, st: enc === "done" ? null : encounterState(L, enc) }; };
async function api(url, body) {
  const r = await fetch(url, { method: body ? "POST" : "GET", credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw Object.assign(new Error(j.error || "no connection"), { status: r.status }); return j;
}
function demoDoc() {
  const mine = HAND[selected], L0 = { v: 2, order: ["you", "them"], a6: { sent: {}, tries: {} }, a8: { sent: {}, tries: {} }, stories: {} };
  if (DEMO === "mine" || DEMO === "open") L0.a6.sent.you = { card: mine, at: 1 };
  if (DEMO === "open") L0.a6.sent.them = { card: HAND[(selected + 3) % 7], at: 2 };
  else if (DEMO === "mine") L0.a6.sent.them = { at: 2 };       // sealed: the server sends no card until both are in
  return L0;
}
async function pull() {
  if (DEMO) { if (!L) { me = "you"; L = demoDoc(); } return; }
  const j = await api("/api/between/" + GID + "/poll", {}); me = j.me; L = (j.garden && j.garden.letters) || null; room = j.garden || room;
}
let room = null;
async function send(card) {
  if (busy) return; busy = true; say = "";
  try {
    if (DEMO) { L.a6.sent.you = { card, at: Date.now() }; L.a6.sent.them = L.a6.sent.them || { at: 2 }; }
    else {
      if (!L) { const other = Object.keys(room.members).find(m => m !== room.startedBy);
        const fresh = { v: 2, order: [room.startedBy, other], a6: { sent: {}, tries: {} }, a8: { sent: {}, tries: {} }, stories: {} };
        await api("/api/between/" + GID + "/doc", { path: "garden/main", op: "update", data: { letters: fresh } }); }
      const { enc } = state();
      await api("/api/between/" + GID + "/doc", { path: "garden/main", op: "update", data: { letters: { [enc]: { sent: { [me]: { card, at: Date.now() } } } } } });
      await pull();
    }
  } catch (e) { say = e.message || "That did not go."; }
  busy = false; refresh();
}

/* ---------- the scene ---------- */
const stage = $("stage"), R = new THREE.WebGLRenderer({ antialias: true }); R.setPixelRatio(Math.min(devicePixelRatio, 2)); stage.appendChild(R.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x2a1d33); scene.fog = new THREE.FogExp2(0x2a1d33, 0.035);
const cam = new THREE.PerspectiveCamera(52, 1, 0.1, 80);
scene.add(new THREE.HemisphereLight(0x8a7fb8, 0x2a2018, 0.55));
const moon = new THREE.DirectionalLight(0xb8b0ff, 0.35); moon.position.set(-6, 9, -4); scene.add(moon);
const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 48), new THREE.MeshStandardMaterial({ color: 0x2f3a2a, roughness: 1 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const trodden = new THREE.Mesh(new THREE.CircleGeometry(4.6, 48), new THREE.MeshStandardMaterial({ color: 0x4a3c2c, roughness: 1 })); trodden.rotation.x = -Math.PI / 2; trodden.position.y = 0.01; scene.add(trodden);
// the forest that rings the opening
const trunkM = new THREE.MeshStandardMaterial({ color: 0x3a2a22, roughness: 1 }), leafM = new THREE.MeshStandardMaterial({ color: 0x1f3a2a, roughness: 1, flatShading: true });
for (let i = 0; i < 46; i++) { const a = i / 46 * Math.PI * 2 + (i % 3) * 0.07, r = 9.5 + (i * 37 % 7) * 1.1, h = 3.2 + (i * 13 % 5) * 0.55;
  const t = new THREE.Group(), tr = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, h * 0.45, 6), trunkM); tr.position.y = h * 0.22; t.add(tr);
  for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.15 - k * 0.22, h * 0.55, 7), leafM); c.position.y = h * (0.45 + k * 0.24); t.add(c); }
  t.position.set(Math.sin(a) * r, 0, Math.cos(a) * r); scene.add(t); }
// the fire
const fire = new THREE.Group(); scene.add(fire);
for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), new THREE.MeshStandardMaterial({ color: 0x4a4540, roughness: 1 })); s.position.set(Math.sin(a) * 0.5, 0.12, Math.cos(a) * 0.5); fire.add(s); }
const flames = [0, 1, 2].map(i => { const m = new THREE.Mesh(new THREE.ConeGeometry(0.28 - i * 0.05, 0.9 + i * 0.25, 8), new THREE.MeshBasicMaterial({ color: [0xff6a1f, 0xffa13a, 0xffe08a][i], transparent: true, opacity: 0.85 })); m.position.y = 0.55 + i * 0.1; fire.add(m); return m; });
const glow = new THREE.PointLight(0xff9a4a, 3.2, 14, 1.6); glow.position.set(0, 1.1, 0); scene.add(glow);
// the seven stones: one standing slab each, on the ring; a label on the face turned to the fire
const RING = 3.4, stones = [];
function label(card) {
  const c = document.createElement("canvas"); c.width = 256; c.height = 384; const g = c.getContext("2d");
  g.fillStyle = "#55504c"; g.fillRect(0, 0, 256, 384);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${40 + (i * 7) % 40},${38 + (i * 5) % 30},${36},.18)`; g.fillRect((i * 53) % 256, (i * 91) % 384, 3 + i % 6, 3 + i % 5); }
  g.fillStyle = "#e9dcc4"; g.textAlign = "center"; g.font = "700 34px Georgia, serif";
  const words = verbOf(card).split(" "); words.forEach((w, i) => g.fillText(w, 128, 150 + i * 38));
  g.font = "italic 30px Georgia, serif"; g.fillText(FACE(card), 128, 150 + words.length * 38 + 22);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
HAND.forEach((card, i) => {
  const a = Math.PI + (i - 3) * (Math.PI * 2 / 7) * 1.0, g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x5a5550, map: label(card), roughness: 0.95, emissive: new THREE.Color(COL[elementOf(card)]), emissiveIntensity: 0 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.15, 0.22), [new THREE.MeshStandardMaterial({ color: 0x4a4540, roughness: 1 }), new THREE.MeshStandardMaterial({ color: 0x4a4540, roughness: 1 }), new THREE.MeshStandardMaterial({ color: 0x4a4540, roughness: 1 }), new THREE.MeshStandardMaterial({ color: 0x4a4540, roughness: 1 }), mat, new THREE.MeshStandardMaterial({ color: 0x3f3a36, roughness: 1 })]);
  slab.position.y = 0.58; slab.userData.i = i; g.add(slab);
  const lamp = new THREE.PointLight(COL[elementOf(card)], 0, 5, 2); lamp.position.set(0, 1.1, 0.5); g.add(lamp);
  g.position.set(Math.sin(a) * RING, 0, Math.cos(a) * RING); g.lookAt(0, 0.58, 0); scene.add(g); stones.push({ mat, lamp, slab, card });
});
// the two of you, inside the ring, both the cultivation model (cult/walker.js, as the healing-journey road)
let who = Q.get("who"); if (who !== "m" && who !== "f") { try { who = sessionStorage.getItem("hj-who"); } catch (e) { who = null; } } if (who !== "m" && who !== "f") who = "f";
const figs = [];
async function addFigure(w, x, z) {
  const { makeWalker } = await import("../cult/walker.js"); const W = await makeWalker({ who: w, outfit: "B2" });
  W.holder.position.set(x, 0, z); W.holder.lookAt(0, 0, 0); scene.add(W.holder); figs.push(W); W.update(0.016, false); return W;
}
// embers rising from the fire
const embers = new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(60 * 3), 3)), new THREE.PointsMaterial({ color: 0xffc070, size: 0.05, transparent: true, opacity: 0.8 })); scene.add(embers);

/* ---------- looking round: a slow drift, and a drag to turn ---------- */
let yaw = 0.0, pitch = 0.32, dist = 7.2, drag = null, t0 = performance.now();
R.domElement.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY, yaw, pitch, moved: false }; });
addEventListener("pointermove", e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true; yaw = drag.yaw - dx * 0.006; pitch = Math.max(0.1, Math.min(0.9, drag.pitch + dy * 0.004)); });
addEventListener("pointerup", e => { const d = drag; drag = null; if (!d || d.moved) return; tap(e); });
const ray = new THREE.Raycaster();
function tap(e) {
  const r = R.domElement.getBoundingClientRect(); ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), cam);
  const hit = ray.intersectObjects(stones.map(s => s.slab))[0]; if (hit) { selected = hit.object.userData.i; refresh(); }
}
function size() { const w = innerWidth, h = innerHeight; R.setSize(w, h); cam.aspect = w / h; cam.fov = w < h ? 68 : 52; cam.updateProjectionMatrix(); }
addEventListener("resize", size); size();

/* ---------- what is lit ---------- */
let openK = 0;            // 0..1: the fire opening both letters
const lit = Array(7).fill(0);
function refresh() {
  const { enc, st } = state(), sent = st ? st.order.map((u, i) => ({ u, card: st.cards[i], in: !!(L[enc].sent || {})[u] })) : [];
  const mineIn = sent.find(s => s.u === me), theirsIn = sent.find(s => s.u !== me);
  const both = !!(st && st.both), cardsOpen = both ? st.cards : [mineIn && mineIn.card].filter(Boolean);
  stones.forEach((s, i) => { s.target = cardsOpen.includes(s.card) ? 1 : 0; });
  $("sub").textContent = both ? "The fire is open." : mineIn && mineIn.in ? "Your card is in the fire." : "Seven stones, one fire, the two of you.";
  const c = $("card");
  if (enc === "done") { c.innerHTML = `<b>This chapter is over.</b><span class="t">The stones keep their light. The next chapter's circle comes later.</span>`; return; }
  if (both) {
    const line = obstacleLine(enc, st.cards);
    c.innerHTML = `<b>The fire is open.</b><span class="t">${line}</span><span class="t">Each of you takes a step with your own card. That happens back in the Between, where the obstacle stands.</span><div class="row"><button class="go" id="toBetween">Take the step</button></div>`;
    $("toBetween").onclick = backToBetween; return;
  }
  if (mineIn && mineIn.in) {
    c.innerHTML = `<b>${verbOf(mineIn.card)}, ${FACE(mineIn.card)}</b><span class="t">${theirsIn && theirsIn.in ? "Their card is in too, sealed." : "Your stone is lit. The fire waits for the other letter."} It opens both at once.</span>`; return;
  }
  const card = HAND[selected], ln = lineFor(enc, card);
  c.innerHTML = `<b>${verbOf(card)}, ${FACE(card)}</b><span class="t">${(ln && ln.line) || "Pick the card you send to the fire."}</span>` +
    (say ? `<span class="t" style="color:#ffb59a">${say}</span>` : "") +
    `<div class="row">${HAND.map((h, i) => `<button type="button" data-i="${i}" class="${i === selected ? "lit" : ""}" aria-label="${verbOf(h)}, ${FACE(h)}">${FACE(h).slice(0, 3)}·${(String(h).split("-")[1])}</button>`).join("")}</div>` +
    `<div class="row"><button class="go" id="sendBtn" ${busy ? "disabled" : ""}>Send it to the fire</button></div>`;
  c.querySelectorAll("[data-i]").forEach(b => { b.onclick = () => { selected = +b.dataset.i; refresh(); }; });
  $("sendBtn").onclick = () => send(card);
}
function backToBetween() { location.href = "/ontology-game/between" + (GID ? "?g=" + encodeURIComponent(GID) : ""); }
$("back").onclick = backToBetween;

/* ---------- the loop ---------- */
function frame(now) {
  const t = (now - t0) / 1000, dt = 1 / 60;
  const { st } = L ? state() : { st: null }; openK += ((st && st.both ? 1 : 0) - openK) * 0.03;
  flames.forEach((f, i) => { f.scale.set(1 + 0.12 * Math.sin(t * 9 + i * 2) + openK * 0.5, 1 + 0.2 * Math.sin(t * 7 + i) + openK * 0.9, 1 + 0.12 * Math.sin(t * 8 + i)); });
  glow.intensity = 3 + Math.sin(t * 11) * 0.5 + openK * 4;
  stones.forEach((s, i) => { lit[i] += ((s.target || 0) - lit[i]) * 0.05; s.mat.emissiveIntensity = lit[i] * 0.55 + (i === selected && !lit[i] ? 0.08 : 0); s.lamp.intensity = lit[i] * 1.8; });
  const p = embers.geometry.attributes.position; for (let i = 0; i < 60; i++) { const k = (t * 0.25 + i / 60) % 1; p.setXYZ(i, Math.sin(i * 7.3) * 0.5 * (1 + k), 0.7 + k * 3.2, Math.cos(i * 4.1) * 0.5 * (1 + k)); } p.needsUpdate = true;
  figs.forEach(f => f.update(dt, false));
  const a = yaw + (drag ? 0 : Math.sin(t * 0.08) * 0.0); // the camera stands outside the ring, looking over one stone to the fire
  cam.position.set(Math.sin(a) * dist, 1.5 + pitch * 4, Math.cos(a) * dist); cam.lookAt(0, 0.9, 0);
  R.render(scene, cam); requestAnimationFrame(frame);
}

/* ---------- boot ---------- */
(async () => {
  try {
    if (!DEMO && !GID) throw new Error("This room needs its door: come through the veil from the Between.");
    await pull();
    // the two of you inside the ring: yours on one side, theirs across the fire
    const other = who === "f" ? "m" : "f";
    await Promise.all([addFigure(who, -0.95, 0.6), addFigure(other, 0.95, -0.6)]);
    figs[0].holder.lookAt(0, 0, 0); figs[1].holder.lookAt(0, 0, 0);
    refresh(); $("loading").classList.add("gone"); requestAnimationFrame(frame);
    window.__clearing = { state: () => ({ me, L, selected }), stones: () => stones.map(s => s.card) };
    if (!DEMO) setInterval(() => { if (!document.hidden && !busy) pull().then(refresh).catch(() => {}); }, 3500);
  } catch (e) { $("loadStep").textContent = e.status === 401 ? "Sign in to bars-engine to come to the moot." : e.message || "the clearing would not open"; }
})();
