/* The block's room, slice 1 (Six-faces-council council/callsheets/block-metabolize.md; his A on bm-room-look-2, 2026-11-02
   03:04Z, "Build this walk"; pass council/passes/block-room-slice1_2026-11-02.md).

   A dense charge brought to the map stand (its q4 weather "a storm" or "a season") shows first as signs in the nook: the
   doorway glows cold, snow and mist and two daemons' spirit gas spill from it, frost runs from its sill toward the room, the
   book on the shelf frosts and the hearth takes a pale edge (mountSigns, mounted by garden.js). Through the doorway the land
   is the block's room (mountRoom, mounted by land/land.js): ice set at the foot of what stands, then water, then mist rising
   in columns with the daemons' spirit energy free, then the clearing where that energy goes up as gold motes.

   The move that lowers the charge is ReleaseResidue played as the melt stand (canon/mechanics/melt-stand.yaml): three stands
   on the floor, Face it, Talk to it, Be it (the 3-2-1). Each stand taken melts the room one state; "Not now" melts it too,
   more slowly. At the clearing the charge's keepsake is offered (kept or let go) and the compost record is kept.

   Slice 2 (his steer on bm-chamber-look-3, 2026-11-02 20:12Z, "Mix of a and b"): the record is kept in the spirit store
   (./kept.js, `oag.spirits.v1`), not the tab, and the keeping chamber under the nook's shelf (land/chamber.js) stands every
   piece on its own stone. A storm still fills the land; a season, the densest weather, fills the keeping chamber itself,
   over what is kept there (densityOf().where), and its signs show at the chamber's arch rather than the doorway.

   Ported from the stills round's make/room-weather.js (2026-11-02-block-room-2), with his dials (s 0.72, w 0.74, c 0.75):
   the props are the same, the small lights are point batches so the room runs live, and the light warms as the charge
   lessens instead of being set once. The daemons' gas is the cave's own (content/ontology-game/cave/spirit-forms.js, served
   at /ontology-game/cave/spirit-forms.js by scripts/build-ontology-game.mjs). */
import * as THREE from "three";
import { keep as keepRecord } from "./kept.js";

export const DIALS = { s: 0.72, w: 0.74, c: 0.75 };           // his, from the round 1 pick page (2026-11-01 21:29Z)
const DENSE = ["a storm", "a season"];                         // episode-sheet.js STRENGTH: the two dense steps of three
const FEEL = { scared: "fear", anxious: "fear", worried: "fear", frustrated: "anger", stuck: "anger", disappointed: "sadness",
  isolated: "sadness", empty: "sadness", overwhelmed: "neutrality_numb", numb: "neutrality_numb" };   // episode-sheet.js DISSATISFACTION
const ELEMENT = { sadness: "water", fear: "metal", anger: "fire", neutrality_numb: "earth" };
const TINT = { water: "#9cc4ff", metal: "#c9d6e6", fire: "#c4c8ff", earth: "#b8cce0" };           // ice is density: every tint stays cold
const KEEPSAKE = { water: "a small vessel", metal: "a key", fire: "an ember", earth: "a stone" }; // pass block-metabolize-1, Shaman
export const STATES = [1, 0.66, 0.33, 0];                      // ice, water, gas, the clearing (spirit-dissolve's ladder)
const STATE_NAME = ["ice", "water", "gas", "clear"];
const LOW = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || Math.min(innerWidth, innerHeight) < 600;
const STILL = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- the trigger: is this charge dense enough to fill a room? ---------- */
export function densityOf(charge) {
  const w = charge && charge.q4 && Array.isArray(charge.q4.weather) ? charge.q4.weather : [];
  const dense = w.find(x => DENSE.includes(x && x.strength));
  if (!dense) return { dense: false };
  const emotion = FEEL[dense.feeling] || "sadness", element = ELEMENT[emotion] || "water";
  return { dense: true, feeling: dense.feeling || "heavy", strength: dense.strength, where: dense.strength === "a season" ? "chamber" : "land", emotion, element, tint: TINT[element],
    keepsake: KEEPSAKE[element], loudest: charge.q6 && charge.q6.loudest || "", voice: charge.q6 && charge.q6.voice || "" };
}

/* ---------- the daemons' spirit energy: the cave's own gas, loaded once ---------- */
let sfP = null;
export function spiritForms() {
  if (window.__oagSpiritForms) return Promise.resolve(window.__oagSpiritForms);
  if (sfP) return sfP;
  sfP = new Promise(res => { const s = document.createElement("script"); s.src = "/ontology-game/cave/spirit-forms.js";
    s.onload = () => res(window.__oagSpiritForms || null); s.onerror = () => res(null); document.head.appendChild(s); });
  return sfP;
}
const FAM = [["protector", 0x4a78c8], ["controller", 0x8a8f9a], ["skeptic", 0xb89a3a], ["fixer", 0xc8742a], ["victim", 0x7a6aa8], ["player", 0x3ab890]];

/* ---------- small parts ---------- */
let tex = null;
function glowTex() { if (tex) return tex; const cv = document.createElement("canvas"); cv.width = cv.height = 64; const x = cv.getContext("2d");
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.3, "rgba(255,255,255,.5)"); g.addColorStop(0.7, "rgba(255,255,255,.1)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; return tex; }
function kit(G, seed) {
  let sd = seed; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const glow = (p, size, color, opacity, add = true) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, opacity, depthWrite: false,
    blending: add ? THREE.AdditiveBlending : THREE.NormalBlending })); sp.position.copy(p); sp.scale.set(size, size, 1); G.add(sp); return sp; };
  // a batch of small lights in one draw: snow, drips, rime, motes. cap 600, halved on phones; past the cap it brightens
  const dots = (n, at, color, size, opacity, add = true) => { const cap = LOW ? 300 : 600, m = Math.min(n, cap); if (m <= 0) return null;
    const pos = new Float32Array(m * 3); for (let i = 0; i < m; i++) { const p = at(i); pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: glowTex(), color, size, transparent: true, opacity: Math.min(1, opacity * (n > m ? n / m : 1)), depthWrite: false,
      blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, sizeAttenuation: true }));
    pts.frustumCulled = false; G.add(pts); return pts; };
  return { rnd, glow, dots };
}
// every material in a group, with the opacity it was built at, so the group can fade as one
function fader(G) { const mats = []; G.traverse(n => { const ms = n.material ? (Array.isArray(n.material) ? n.material : [n.material]) : [];
  for (const m of ms) if (!mats.find(x => x.m === m)) { m.transparent = true; mats.push({ m, o: m.opacity }); } });
  const lights = []; G.traverse(n => { if (n.isLight) lights.push({ l: n, i: n.intensity }); });
  return f => { for (const x of mats) x.m.opacity = x.o * f; for (const x of lights) x.l.intensity = x.i * f; G.visible = f > 0.003; }; }
function dispose(G) { G.traverse(n => { if (n.geometry) n.geometry.dispose(); const ms = n.material ? (Array.isArray(n.material) ? n.material : [n.material]) : []; ms.forEach(m => m.dispose()); }); if (G.parent) G.parent.remove(G); }
const iceMat = () => new THREE.MeshStandardMaterial({ color: "#d3e8fb", emissive: "#5d9bd2", emissiveIntensity: 0.28, roughness: 0.1, transparent: true, opacity: 0.86, flatShading: true });

/* ===================================================================================================
   The signs in the nook (garden.js mounts this; charge-world.js says whether the charge on the map is dense)
   =================================================================================================== */
export function mountSigns(B) {
  let G = null, key = "", fade = 0, snow = null, setF = null;
  const shelfBook = () => { const a = B.anchors && B.anchors(); return a && a.shelf ? V(a.shelf[0], 1.32, a.shelf[2]) : null; };
  function build(d) {
    const a = B.anchors(), arch = d.where === "chamber" && B.chamberArch && B.chamberArch.at(), P = arch ? V(arch[0], 0, arch[1]) : V(a.portal[0], 0, a.portal[2]), Hh = a.hearth ? V(a.hearth[0], 0, a.hearth[2]) : null, book = shelfBook();
    G = new THREE.Group(); G.name = "block-signs"; B.scene.add(G);
    const { rnd, glow, dots } = kit(G, 23), toRoom = V(-P.x, 0, -P.z).normalize();
    // the doorway glows cold, with the room behind it
    glow(P.clone().add(V(0, 1.1, 0)), 3.2, d.tint, 0.55); glow(P.clone().add(V(0, 1.1, 0)), 1.4, "#e8f4ff", 0.6);
    const pl = new THREE.PointLight(d.tint, 9, 6, 1.6); pl.position.copy(P).add(V(0, 1.2, 0)).addScaledVector(toRoom, 0.4); G.add(pl);
    // mist and snow spilling out of it
    for (let i = 0; i < 14; i++) glow(P.clone().add(V((rnd() - 0.5) * 1.6, rnd() * 0.6, (rnd() - 0.5) * 1.6)).addScaledVector(toRoom, rnd() * 1.5), 1.4 + rnd() * 1.2, "#c4dbef", 0.12, false);
    snow = dots(40, () => P.clone().add(V((rnd() - 0.5) * 1.4, rnd() * 2.2, (rnd() - 0.5) * 1.4)).addScaledVector(toRoom, rnd() * 0.8), "#ffffff", 0.05, 0.75);
    if (snow) snow.userData.base = Float32Array.from(snow.geometry.attributes.position.array);
    // the frost trail: rime from the sill toward the middle of the room
    const to = V(0, 0, 0);
    dots(70, () => { const t = rnd(), q = P.clone().lerp(to, t * 0.75).add(V((rnd() - 0.5) * (0.5 + t * 0.9), 0, (rnd() - 0.5) * (0.5 + t * 0.9))); q.y = 0.03; return q; }, "#e4f1ff", 0.32, 0.3, false);
    // the book on the shelf frosts; the hearth takes a pale edge
    if (book) { glow(book.clone().add(V(0, 0.12, 0)), 0.8, "#a9d2ff", 0.5); glow(book.clone().add(V(0, 0.06, 0)), 0.3, "#ffffff", 0.55);
      dots(22, () => book.clone().add(V((rnd() - 0.5) * 0.5, rnd() * 0.25, (rnd() - 0.5) * 0.3)), "#eaf5ff", 0.09, 0.5, false);
      for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.05 + rnd() * 0.08, 4), iceMat()); m.rotation.x = Math.PI; m.position.copy(book).add(V((rnd() - 0.5) * 0.4, -0.08, (rnd() - 0.5) * 0.15)); G.add(m); } }
    if (Hh) glow(Hh.clone().setY(0.55), 1.2, "#7fb2ff", 0.4);
    // two daemons' spirit gas drifting out of the doorway (his note: the playful things are the daemons' spirit energy)
    spiritForms().then(SF => { if (!SF || !G) return; for (let i = 0; i < 2; i++) { const [fam, hex] = FAM[i];
      const at = P.clone().add(V((i - 0.5) * 0.9, 0.4 + i * 0.5, 0)).addScaledVector(toRoom, 0.8 + i * 0.6);
      const g = SF.buildGas(THREE, fam, hex, {}); g.position.copy(at); g.scale.setScalar(1.3); g.userData.materials.forEach(m => { m.opacity = 0.6; m.size *= 1.6; }); G.add(g);
      glow(at, 0.6, "#" + hex.toString(16).padStart(6, "0"), 0.25); } setF = fader(G); setF(fade); });
    setF = fader(G); setF(0);
  }
  function frame() {
    requestAnimationFrame(frame);
    const v = B.ctw && B.ctw.view ? B.ctw.view() : null, inNook = B.room && B.room().shell === "nook";
    const d = v && v.episode && v.block && v.block.dense && inNook && B.anchors ? v.block : null;
    const k = d ? d.feeling + d.strength : "";
    if (k && k !== key) { if (G) dispose(G); G = null; key = k; build(d); fade = STILL ? 1 : 0; }
    if (!G) return;
    fade += ((d ? 1 : 0) - fade) * (STILL ? 1 : 0.03);
    if (setF) setF(fade);
    if (!d && fade < 0.01) { dispose(G); G = null; key = ""; return; }
    if (snow && !STILL) { const p = snow.geometry.attributes.position.array, b = snow.userData.base, t = performance.now() / 1000;
      for (let i = 0; i < p.length; i += 3) { p[i + 1] = ((b[i + 1] - t * 0.35 * (0.6 + (i % 7) / 10)) % 2.2 + 2.2) % 2.2; p[i] = b[i] + Math.sin(t + i) * 0.05; }
      snow.geometry.attributes.position.needsUpdate = true; }
  }
  requestAnimationFrame(frame);
  return { view: () => ({ on: !!G, key }) };
}

/* ===================================================================================================
   The block's room in the land (land/land.js mounts this when the charge that came through is dense)
   o = { scene, d (densityOf), center [x,z], R, top, floor, avoid [Vector3...] (where you stand to play things),
         startK (1, 0.66, 0.33 or 0), say (a caption), sound (kind) }
   =================================================================================================== */
export async function mountRoom(o) {
  const scene = o.scene, d = o.d, R = o.R, top = o.top, C = V(o.center[0], o.floor || 0, o.center[1]);
  const { s, w, c } = DIALS, SF = await spiritForms();
  // the land's lights as built, so the cold can be laid over them and taken off again
  const live = new Set((o.live || []).filter(Boolean)), skip = new Set((o.exclude || []).filter(Boolean));
  const under = n => { for (let a = n; a; a = a.parent) if (skip.has(a)) return true; return false; };
  const base = []; scene.traverse(n => { if (n.isLight && !live.has(n)) base.push({ l: n, i: n.intensity, c: n.color ? n.color.clone() : null }); });
  const fogBase = scene.fog ? scene.fog.color.clone() : null, tint = new THREE.Color(d.tint);
  // what stands in the room, scanned once: the ice sets at the foot of these
  const roots = [];
  { const bb = new THREE.Box3(), cc = V(0, 0, 0), sz = V(0, 0, 0), mtx = new THREE.Matrix4(), ip = V(0, 0, 0), iq = new THREE.Quaternion(), is = V(0, 0, 0);
    const inside = p => Math.hypot(p.x - C.x, p.z - C.z) < R;
    scene.traverse(n => { if (!n.isInstancedMesh || under(n)) return; if (!n.geometry.boundingBox) n.geometry.computeBoundingBox(); const gb = n.geometry.boundingBox, gh = gb.max.y - gb.min.y, gr = Math.min(gb.max.x - gb.min.x, gb.max.z - gb.min.z) / 2;
      for (let i = 0; i < n.count; i++) { n.getMatrixAt(i, mtx); mtx.premultiply(n.matrixWorld); mtx.decompose(ip, iq, is); const p = V(ip.x, C.y, ip.z), h = gh * is.y;
        if (inside(p) && h > 0.35 && h < 14) roots.push({ p, r: Math.max(0.15, gr * is.x), h }); } });
    scene.traverse(n => { if (!n.isMesh || n.isInstancedMesh || under(n)) return; bb.setFromObject(n); if (bb.isEmpty()) return; bb.getCenter(cc); bb.getSize(sz);
      const p = V(cc.x, C.y, cc.z); if (!inside(p) || sz.y < 0.35 || sz.y > 14 || Math.max(sz.x, sz.z) > R) return; roots.push({ p, r: Math.max(0.15, Math.min(sz.x, sz.z) * 0.5), h: sz.y }); }); }
  const viewer = V(0, 0, 1);   // the doorway's side: the six lights stand across the room from it

  /* the stands: three spots on the floor, clear of where you stand to play an instrument, the first nearest the way in */
  const cand = []; for (let a = 0; a < 48; a++) { const t = a / 48 * Math.PI * 2, p = V(Math.sin(t) * R * 0.52, 0, Math.cos(t) * R * 0.52); if ((o.avoid || []).every(q => Math.hypot(q.x - p.x, q.z - p.z) > 1.7) && !(Math.abs(p.x) < 1.2 && p.z > 0)) cand.push(p); }
  const pick = (want, used) => cand.filter(p => used.every(u => u.distanceTo(p) > 2.4)).sort((a, b) => a.distanceTo(want) - b.distanceTo(want))[0] || want;
  const at0 = pick(V(2.2, 0, 2.6), []), at1 = pick(V(-3.0, 0, 0.4), [at0]), at2 = pick(V(0.6, 0, -3.3), [at0, at1]);
  const STANDS = [
    { id: "face", name: "Face it", at: at0 }, { id: "talk", name: "Talk to it", at: at1 }, { id: "be", name: "Be it", at: at2 }];
  const SG = new THREE.Group(); SG.name = "melt-stands"; scene.add(SG);
  for (const st of STANDS) { const g = new THREE.Group(); g.position.copy(st.at); SG.add(g);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.56, 40), new THREE.MeshBasicMaterial({ color: "#cfe6ff", transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; g.add(ring);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.42, 40), new THREE.MeshBasicMaterial({ color: "#9cc4ff", transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending }));
    disc.rotation.x = -Math.PI / 2; disc.position.y = 0.035; g.add(disc);
    const col = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: "#bcdcff", transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending })); col.scale.set(0.9, 2.4, 1); col.position.y = 1.1; g.add(col);
    st.fx = { ring, disc, col, warm: 0, want: 0 }; st.done = null; }

  /* one state of the room: the round 2 props at charge k, built into their own group */
  function buildState(k) {
    const G = new THREE.Group(); G.name = "block-room-" + k; scene.add(G);
    const { rnd, glow, dots } = kit(G, 23), anim = [], iceM = iceMat();
    const inRoom = (kk = 0.92) => { const a = rnd() * Math.PI * 2, dd = Math.sqrt(rnd()) * R * kk; return V(C.x + Math.cos(a) * dd, C.y, C.z + Math.sin(a) * dd); };
    const ice = k >= 0.8 ? 1 : k >= 0.5 ? 0.35 : 0, water = k >= 0.8 ? 0.15 : k >= 0.5 ? 1 : k >= 0.2 ? 0.35 : 0, gas = k >= 0.8 ? 0.35 : k >= 0.5 ? 0.6 : k >= 0.2 ? 1 : 0, clear = 1 - k;
    const sky = new THREE.HemisphereLight(clear > 0.9 ? "#ffe2b8" : "#bcd6f0", "#3a4654", 0.35 + 0.4 * k + 0.35 * clear); G.add(sky);
    if (k > 0.1) { const cold = new THREE.PointLight(d.tint, 6 + 6 * k, R * 2.2, 1.6); cold.position.copy(C).add(V(0, top * 0.8, 0)); G.add(cold); }
    if (clear > 0.9) { const sun = new THREE.DirectionalLight("#ffd6a0", 1.4); sun.position.copy(C).add(V(-4, 9, 3)); sun.target.position.copy(C); G.add(sun); G.add(sun.target); }
    // rime
    const rime = Math.round(R * R * 14 * Math.max(ice, water * 0.35));
    dots(rime, () => { const q = inRoom(0.98); q.y += 0.03; return q; }, "#e4f1ff", 0.55, 0.1 + 0.12 * ice, false);
    // the ice, set the way frost sets: at the foot of what stands, in drifts, icicles under what overhangs; never a ring
    const cluster = (at, big, lean) => { const cl = new THREE.Group(); cl.position.copy(at); G.add(cl); const n = 2 + Math.floor(rnd() * 5);
      for (let j = 0; j < n; j++) { const h = big * (0.4 + rnd() * 1.1), r = big * (0.08 + rnd() * 0.1);
        const m = new THREE.Mesh(new THREE.OctahedronGeometry(r, 0).scale(1, h / r / 2, 1), iceM);
        const a = rnd() * 6.28, dd = rnd() * big * 0.45; m.position.set(Math.cos(a) * dd, h * (0.25 - 0.2 * rnd()), Math.sin(a) * dd);
        m.rotation.z = (rnd() - 0.5) * 1.1 + lean.x; m.rotation.x = (rnd() - 0.5) * 1.1 + lean.z; cl.add(m); }
      glow(at.clone().add(V(0, big * 0.4, 0)), big * 1.4, "#9cc9f0", 0.18); };
    const melt = ice < 1 ? 0.55 : 1, amt = (1 - 0.45 * s) * ice, rs = roots.slice().sort(() => rnd() - 0.5);
    if (ice > 0) {
      rs.slice(0, Math.round(rs.length * 0.7 * amt)).forEach(t => { const n = 1 + Math.floor(rnd() * 3);
        for (let i = 0; i < n; i++) { const a = rnd() * 6.28, at = t.p.clone().add(V(Math.cos(a) * t.r * 1.05, 0, Math.sin(a) * t.r * 1.05));
          cluster(at, (0.25 + rnd() * 0.55) * melt * Math.min(1.3, 0.6 + t.h / 6), V(-Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3)); } });
      for (let dd = 0, nd = Math.round(5 * amt); dd < nd; dd++) { const c0 = inRoom(0.85), m = 3 + Math.floor(rnd() * 6);
        for (let i = 0; i < m; i++) cluster(c0.clone().add(V((rnd() - 0.5) * 1.6, -0.05, (rnd() - 0.5) * 1.6)), (0.12 + Math.pow(rnd(), 3) * 0.9) * melt, V(0, 0, 0)); }
      rs.slice(0, Math.round(rs.length * 0.5 * amt)).forEach(t => { if (t.h < 1.6) return;
        for (let i = 0; i < 4; i++) { const h = (0.15 + rnd() * 0.4) * melt, a = rnd() * 6.28, m = new THREE.Mesh(new THREE.ConeGeometry(0.03 + rnd() * 0.02, h, 5), iceM);
          m.rotation.x = Math.PI; m.position.copy(t.p).add(V(Math.cos(a) * (t.r + 0.4 + rnd() * 0.8), Math.min(t.h, top) * (0.55 + rnd() * 0.3), Math.sin(a) * (t.r + 0.4 + rnd() * 0.8))); G.add(m); } });
    }
    // water: pools at the foot of things, drops falling
    if (water > 0.2) {
      const pool = new THREE.MeshStandardMaterial({ color: "#2c4a63", roughness: 0.05, metalness: 0.6, emissive: "#36608a", emissiveIntensity: 0.25, transparent: true, opacity: 0.85 });
      for (let i = 0, np = Math.round(14 * water); i < np; i++) { const t = roots.length && rnd() < 0.6 ? roots[Math.floor(rnd() * roots.length)] : null, a = rnd() * 6.28;
        const q = t ? t.p.clone().add(V(Math.cos(a) * (t.r + 0.5), 0, Math.sin(a) * (t.r + 0.5))) : inRoom(0.8);
        const m = new THREE.Mesh(new THREE.CircleGeometry(0.3 + rnd() * 0.7 * water, 18), pool); m.rotation.x = -Math.PI / 2; m.scale.set(1, 0.6 + rnd() * 0.7, 1); m.position.copy(q).add(V(0, 0.025, 0)); G.add(m);
        glow(q.clone().add(V(0, 0.05, 0)), 0.9, "#7fb6e8", 0.12 * water); }
      const drops = dots(Math.round(60 * water), () => { const q = inRoom(0.9); q.y += 0.3 + rnd() * top * 0.7; return q; }, "#cfe6ff", 0.07, 0.7);
      if (drops) anim.push(fall(drops, 1.6, top));
    }
    // the air: mist low while dense, columns at the gas stand, snow at the ice stand
    for (let i = 0, mist = Math.round((6 + 50 * s) * Math.max(ice * 0.8, water * 0.6) * (LOW ? 0.5 : 1)); i < mist; i++) { const q = inRoom(1.0); q.y += 0.15 + rnd() * top * 0.35; glow(q, 1.4 + rnd() * 2 * Math.min(1.5, R / 3.5), "#c4dbef", 0.05 + 0.12 * s, false); }
    if (gas > 0.5) for (let col = 0; col < 7; col++) { const b = inRoom(0.8); for (let j = 0; j < 9; j++) glow(b.clone().add(V(Math.sin(j * 0.9 + col) * 0.25, 0.3 + j * top * 0.09, Math.cos(j * 0.7) * 0.25)), 0.9 + j * 0.18, "#d8e6f4", 0.1 * gas * (1 - j / 10), false); }
    const snow = dots(Math.round((80 + 380 * s) * ice), () => { const q = inRoom(1.05); q.y += rnd() * top; return q; }, "#ffffff", 0.07, 0.7);
    if (snow) anim.push(fall(snow, 0.45, top));
    // the daemons' spirit energy: held dim in the ice, free as it melts, gone up as gold motes at the clearing
    if (SF && clear < 0.9) for (let i = 0, nFam = Math.round(2 + 4 * c); i < nFam; i++) { const [fam, hex] = FAM[i];
      const held = k >= 0.8, t = roots.length ? roots[(i * 5) % roots.length] : null;
      const at = held && t ? t.p.clone().add(V(0.3, 0.45, 0.3)) : inRoom(0.7).add(V(0, 0.8 + rnd() * Math.min(2.2, top * 0.6) * (0.5 + c), 0));
      const g = SF.buildGas(THREE, fam, hex, {}); g.position.copy(at); g.scale.setScalar(held ? 1.3 : 1.8 + 1.2 * c);
      g.userData.materials.forEach(m => { m.opacity = held ? 0.6 : 0.95; m.size *= held ? 1.6 : 2.2; }); G.add(g);
      glow(at, held ? 0.6 : 1.3, "#" + hex.toString(16).padStart(6, "0"), held ? 0.25 : 0.45);
      if (!held && !STILL) { const y0 = at.y, ph = rnd() * 6.28; anim.push((dt, T) => { g.position.y = y0 + Math.sin(T * 0.6 + ph) * 0.25; g.position.x += Math.sin(T * 0.3 + ph) * dt * 0.15; }); } }
    if (clear > 0.9) { const motes = dots(160, () => { const q = inRoom(0.85); q.y += 0.2 + Math.pow(rnd(), 0.7) * top * 1.1; return q; }, "#ffd27a", 0.1, 0.85); if (motes) anim.push(fall(motes, -0.35, top * 1.6)); }
    // witnessed (his dial): the six lights along the far edge, and a patron's light close, dim while the charge is dense
    if (w > 0.25) { const SIX = ["#ff9b5e", "#7fd0ff", "#ff6b6b", "#ffd36b", "#9be38a", "#c9a6ff"], b = 0.3 + 0.7 * (w - 0.25) / 0.75, side = V(viewer.z, 0, -viewer.x);
      for (let i = 0; i < 6; i++) { const a = (i - 2.5) * 0.3, dir = viewer.clone().multiplyScalar(-Math.cos(a)).add(side.clone().multiplyScalar(Math.sin(a)));
        const q = C.clone().add(dir.multiplyScalar(R * 0.78)).add(V(0, Math.min(top * 0.7, 1.9) + Math.sin(i * 1.7) * 0.15, 0));
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), new THREE.MeshBasicMaterial({ color: SIX[i] })); orb.position.copy(q); G.add(orb); glow(q, 0.5 + 0.8 * b, SIX[i], 0.3 + 0.45 * b); }
      if (w >= 0.7) { const q = C.clone().add(viewer.clone().multiplyScalar(R * (0.25 + 0.2 * k))).add(side.clone().multiplyScalar(R * 0.24)).add(V(0, Math.min(1.4, top * 0.55), 0));
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), new THREE.MeshBasicMaterial({ color: "#ffd98a" })); orb.position.copy(q); G.add(orb);
        glow(q, 1.4, "#ffcf70", 0.6 + 0.3 * clear); const pl = new THREE.PointLight("#ffc86a", 3 + 3 * clear, 5, 2); pl.position.copy(q); G.add(pl); } }
    return { G, set: fader(G), anim, k };
  }
  // a batch that falls (or rises, with v below zero) and wraps within the room's height
  function fall(pts, v, h) { const p = pts.geometry.attributes.position.array, b = Float32Array.from(p);
    return (dt, T) => { if (STILL) return; for (let i = 0; i < p.length; i += 3) { const sp = v * (0.7 + ((i / 3) % 5) / 8); p[i + 1] = (((b[i + 1] - T * sp) % h) + h) % h; p[i] = b[i] + Math.sin(T * 0.7 + i) * 0.06; }
      pts.geometry.attributes.position.needsUpdate = true; }; }

  /* the room's light, warmed as the charge lessens: laid over the land's own lights from what they were built at */
  let kVis = o.startK ?? 1;
  function light(k) { const clear = 1 - k;
    for (const x of base) { x.l.intensity = x.i * (1 - (0.45 + 0.1 * (1 - s)) * k); if (x.c) x.l.color.copy(x.c).lerp(tint, 0.4 * k); }
    if (scene.fog && fogBase) { scene.fog.color.copy(fogBase).lerp(new THREE.Color(clear > 0.9 ? "#e8d6b8" : "#aac2d8"), (0.25 + 0.4 * s) * Math.max(k, clear > 0.9 ? 0.4 : 0)); } }

  let idx = Math.max(0, STATES.indexOf(o.startK ?? 1)); if (idx < 0) idx = 0;
  let cur = buildState(STATES[idx]), prev = null, xf = 1, xfDur = 2.6;
  cur.set(1); light(STATES[idx]);
  for (let i = 0; i < idx; i++) STANDS[i].done = "taken";
  const record = { id: "k" + Date.now().toString(36), element: d.element, feeling: d.feeling, strength: d.strength, stands: [], keepsake: null, where: o.where || "the land", at: null };
  let keep = null, keptState = null;    // the keepsake: shown at the clearing, kept or let go
  function toState(i, slow) {
    if (i === idx) return; idx = i; if (prev) dispose(prev.G); prev = cur; cur = buildState(STATES[i]); cur.set(STILL ? 1 : 0); xf = STILL ? 1 : 0; xfDur = slow ? 5 : 2.6;
    if (STILL) { dispose(prev.G); prev = null; }
    o.say && o.say(["", "The ice runs to water.", "The water rises as mist. The daemons' spirit energy plays free.", "The air clears. What was held goes up as light."][i], 6);
    if (i === 3) setTimeout(() => offerKeepsake(), STILL ? 0 : xfDur * 1000);
  }
  function offerKeepsake() {
    if (keep) return; const g = new THREE.Group(), el = d.element, at = (o.keepAt || V(0, 0, 0)).clone();
    const warmM = new THREE.MeshStandardMaterial({ color: el === "fire" ? "#ff9a4a" : el === "metal" ? "#d8d2c0" : el === "earth" ? "#9a8a70" : "#bfe0ff", emissive: el === "fire" ? "#ff6a1a" : "#ffcf80", emissiveIntensity: 0.5, roughness: 0.4, metalness: el === "metal" ? 0.7 : 0.1, transparent: true, opacity: 1 });
    if (el === "water") { const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(0.05 + Math.sin(t * Math.PI) * 0.11 + (t > 0.85 ? 0.03 : 0), t * 0.26)); } g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 16), warmM)); }
    else if (el === "metal") { const bow = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 8, 16), warmM); bow.position.y = 0.22; g.add(bow); const sh = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 0.02), warmM); sh.position.y = 0.09; g.add(sh); const bit = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.02), warmM); bit.position.set(0.03, 0.02, 0); g.add(bit); }
    else if (el === "fire") g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), warmM));
    else g.add(new THREE.Mesh(new THREE.DodecahedronGeometry(0.1, 0), warmM));
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: "#ffd27a", transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.set(0.8, 0.8, 1); sp.position.y = 0.15; g.add(sp);
    g.position.copy(at).setY((o.keepY || 0.95)); scene.add(g); keep = { g, t0: performance.now() / 1000, y: g.position.y, gone: 0 };
    o.say && o.say(`Where the cold was thickest, it left ${d.keepsake}.`, 6);
  }
  // the record is kept once the keepsake is carried or let go (kept.js); a preview (o.dry) keeps nothing
  function write() { record.at = new Date().toISOString(); if (!record.keepsake || o.dry) return; keepRecord({ ...record, keepsake: d.keepsake, let: record.keepsake === "let go" }); }

  /* the stands' cards: the 3-2-1, in the charge's own words */
  const next = () => STANDS.findIndex(x => !x.done);
  function near(p) {
    if (keep && !keptState && Math.hypot(p.x - keep.g.position.x, p.z - keep.g.position.z) < 2.5) return "melt:keep";
    let bi = -1, bd = 0.95; STANDS.forEach((st, i) => { const dd = Math.hypot(p.x - st.at.x, p.z - st.at.z); if (dd < bd) { bd = dd; bi = i; } });
    return bi >= 0 ? "melt:" + bi : null;
  }
  function card(n) {
    const btn = (act, label) => `<button type="button" data-melt="${act}">${label}</button>`;
    const box = (title, text, ...b) => `<div><b>${title}</b><div class="t">${text}</div></div><div class="row">${b.join("")}</div>`;
    if (n === "melt:keep") return { key: "melt:keep", html: box(d.keepsake.replace(/^./, ch => ch.toUpperCase()), `What the cold left when it cleared. It is yours to carry, or to let go.`, btn("keep", "Carry it"), btn("letgo", "Let it go")) };
    const i = +n.slice(5), st = STANDS[i], nx = next();
    if (st.done) return { key: n + ":done", html: box(st.name, st.done === "taken" ? "The stand is warm where you stood." : "You passed this stand. The cold here went anyway, more slowly.") };
    if (i !== nx) return { key: n + ":wait", html: box(st.name, `The cold here holds until you have stood at ${esc(STANDS[nx].name)}. That stand glows.`) };
    const lines = {
      face: `Walk round the cold and look at it from where you stand. It is ${esc(d.feeling)}, the size of ${esc(d.strength)}. Say what it looks like, out loud or to yourself.`,
      talk: d.loudest ? `It speaks${d.voice ? ", in " + esc(d.voice) : ""}: “${esc(d.loudest)}.” Answer it, and let it answer you back.` : "It has something to say to you. Ask it what it wants, and answer what it says.",
      be: `Stand where it stands and speak as it: “I am what feels ${esc(d.feeling)} in you. I am here to…” Finish the line as it would.` };
    const done = { face: "I said what I see", talk: "We spoke", be: "I spoke as it" };
    return { key: n, html: box(st.name, lines[st.id], btn("take:" + i, done[st.id]), btn("pass:" + i, "Not now")) };
  }
  function act(a) {
    if (a === "keep" || a === "letgo") { keptState = a; record.keepsake = a === "keep" ? d.keepsake : "let go"; write();
      o.say && o.say(a === "keep" ? (o.keepSay || `You carry ${d.keepsake} back with you.`) : "It goes up with the rest of the light.", 5); o.sound && o.sound(a);
      o.onKeep && o.onKeep({ ...record, keepsake: d.keepsake, let: a === "letgo" }); return; }
    const [verb, si] = a.split(":"), i = +si, st = STANDS[i]; if (!st || st.done || i !== next()) return;
    st.done = verb === "take" ? "taken" : "passed"; record.stands.push({ stand: st.id, [st.done]: true }); st.fx.want = st.done === "taken" ? 1 : 0.5;
    o.sound && o.sound(verb); toState(Math.min(3, idx + 1), verb === "pass"); write();
  }

  function frame(dt, T) {
    // the crossfade from the last state to this one, and the light warming with it
    if (xf < 1) { xf = Math.min(1, xf + dt / xfDur); const e = xf * xf * (3 - 2 * xf); cur.set(e); if (prev) prev.set(1 - e); if (xf >= 1 && prev) { dispose(prev.G); prev = null; } }
    const kT = STATES[idx]; kVis += (kT - kVis) * Math.min(1, dt / (xfDur * 0.5)); light(kVis);
    for (const a of cur.anim) a(dt, T); if (prev) for (const a of prev.anim) a(dt, T);
    // the stands: the next one glows and breathes; a taken one warms to amber, a passed one half way
    const nx = next();
    STANDS.forEach((st, i) => { const f = st.fx; f.warm += (f.want - f.warm) * Math.min(1, dt * 1.5); const live = i === nx, br = live ? 0.75 + Math.sin(T * 2.2) * 0.2 : st.done ? 0.6 : 0.3;
      f.ring.material.color.set("#cfe6ff").lerp(new THREE.Color("#ffc46a"), f.warm); f.disc.material.color.set("#9cc4ff").lerp(new THREE.Color("#ffb050"), f.warm);
      f.ring.material.opacity = br; f.disc.material.opacity = 0.12 + 0.12 * br; f.col.material.opacity = live ? 0.3 + Math.sin(T * 2.2) * 0.1 : 0.1 + 0.1 * f.warm; f.col.material.color.copy(f.ring.material.color); });
    if (keep) { keep.g.position.y = keep.y + Math.sin(T * 1.4) * 0.05; keep.g.rotation.y += dt * 0.6;
      if (keptState === "letgo") { keep.gone = Math.min(1, keep.gone + dt * 0.5); keep.g.position.y += keep.gone * 1.2; keep.g.traverse(n => { if (n.material) n.material.opacity = 1 - keep.gone; }); if (keep.gone >= 1) keep.g.visible = false; }
      if (keptState === "keep") { keep.gone = Math.min(1, keep.gone + dt * 0.8); keep.g.scale.setScalar(1 - keep.gone); if (keep.gone >= 1) keep.g.visible = false; } }
  }
  return {
    near, card, act, frame, stands: STANDS,
    k: () => STATES[idx], kVis: () => kVis,
    rain: () => [0, 0.6, 0.2, 0][idx],                 // the land's own rain: snow takes its place at the ice stand
    fogAdd: () => 0.015 * s * kVis + 0.01 * s * kVis,  // the mist a dense charge adds to the land's own fog
    lightK: () => 1 - (0.45 + 0.1 * (1 - s)) * kVis,    // for a light the land sets itself each frame
    view: () => ({ state: STATE_NAME[idx], k: STATES[idx], stands: STANDS.map(st => ({ id: st.id, done: st.done, at: [+st.at.x.toFixed(2), +st.at.z.toFixed(2)] })), keepsake: keep ? (keptState || "offered") : null, record: { ...record } }),
  };
}
