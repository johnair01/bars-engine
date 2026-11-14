/* The forest walk, walked (Six-faces-council .specify/specs/coaching-walk; Wendell's steer on cp-send-look-1, 2026-11-05:
   "take the existing coaching intake and turn it into a game that people can walk through at the end they have a chance
   to book with me or buy the book or sign up for the patreon to get access to the games im building").

   The /coaching intake's six questions wait at six waymarks on a dusk forest path (mechanic waymark-walk, proposed):
   the signpost (what you want to create), the lantern branch (what it will give you), the still pool (life now), the
   cairn (how it feels, and where in the body), the hollow tree (what would have to be true), the bramble (what holds you
   back). Walk near one and its question lifts; answer, and the place changes; or walk on. The path ends at a fire where
   your answers hang as small lights, and three doors stand: Wendell's cabin (the four Calendly prices), the lectern (the
   book) and the gate (the Patreon, for the games he is building).

   Reused, not redrawn: the Between land's forest (public/between/land/land.js: its tree, ground, grass, mist and glow
   recipes, the hollow's bark, root and moss materials, the paint pass), with the land's tap-to-walk, drag-to-look and
   arrow keys. The traveller (round 2, his steer on cw-walk-look-1): one of the cultivation characters, her or him in
   the light travel robe, built in the page by public/between/cult/ (a copy of the shells preview) and walked by
   cult/walker.js. If that figure cannot be built, the Between's Average Dusk walks instead (land.js makeFigure).

   Nothing typed leaves the tab (cg-browser-only): the walk lives in sessionStorage "coaching-walk"; the copy button is
   how the visitor's words reach Calendly's notes box, by their own paste. The utm tags they arrived with ride every door.

   Previews: ?at=signpost|lanterns|pool|cairn|hollow|bramble|fire|cabin|lectern|gate stands you there; ?sample=1 opens with
   a sample walk answered. window.__walk drives it for the pictures. */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as skClone } from "three/addons/utils/SkeletonUtils.js";
import { buildHollow, mergeStatic, mergeByParent, rng } from "/between/hollow.js";
import { installPaint } from "/between/paint.js";
import { loadParts, dressFigure } from "/between/wardrobe.js";
import { stance, clipWeights, FADE } from "/between/stance.js";
import * as D from "./data.js";
installPaint();

const Q = new URLSearchParams(location.search);
const LOW = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || Math.min(innerWidth, innerHeight) < 600;
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = s => document.querySelector(s);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const step = m => { const e = $("#loadStep"); if (e) e.textContent = m; };

/* ---------- the walk in this tab ---------- */
let walk = { ...D.EMPTY };
try { const s = JSON.parse(sessionStorage.getItem("coaching-walk") || "null"); if (s && typeof s === "object") walk = { ...D.EMPTY, ...s }; } catch (e) { /* a fresh walk */ }
if (Q.get("sample")) walk = { experience: "build", experienceOwn: "", toward: ["joy", "fear"], now: "I start things and stop when they get real.", where: ["chest", "belly"], feels: ["restless", "worried"], truth: "That finishing would cost them something they are not ready to lose.", reservations: ["I’m not ready", "I’m not good enough"] };
const save = () => { try { sessionStorage.setItem("coaching-walk", JSON.stringify(walk)); } catch (e) { /* private mode: the walk still plays */ } };
const answered = id => id === "experience" ? !!(walk.experience || walk.experienceOwn.trim()) : id === "toward" ? walk.toward.length > 0
  : id === "now" ? !!walk.now.trim() : id === "feels" ? walk.feels.length + walk.where.length > 0 : id === "truth" ? !!walk.truth.trim() : walk.reservations.length > 0;
const toggle = (list, v) => list.includes(v) ? list.filter(x => x !== v) : [...list, v];

/* ---------- renderer, scene, camera ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: !LOW, powerPreference: "high-performance", preserveDrawingBuffer: !!Q.get("shot") });
renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
$("#stage").appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
function resize() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener("resize", resize); resize();
const G = new THREE.Group(); scene.add(G);   // what stands still: merged once built
const add = o => { G.add(o); return o; };

/* ===================================================================================================
   The path: a winding way from the forest's edge (+z) to the clearing (-z)
   =================================================================================================== */
const CTRL = [[0, 34], [0.4, 28], [3.2, 21], [-1.6, 13], [3.0, 5], [-2.4, -3], [2.2, -11], [-1.2, -19], [0.4, -25], [0, -29]].map(([x, z]) => V(x, 0, z));
const CURVE = new THREE.CatmullRomCurve3(CTRL, false, "centripetal");
const SAMPLES = CURVE.getSpacedPoints(420);
const CL = V(0, 0, -35), CL_R = 7.2;   // the clearing at the path's end
function pathDist(x, z) { let best = 1e9; for (let i = 0; i < SAMPLES.length; i += 1) { const p = SAMPLES[i], d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < best) best = d; } return Math.sqrt(best); }
const atT = t => CURVE.getPointAt(t);
const sideOf = (t, off) => { const p = CURVE.getPointAt(t), tg = CURVE.getTangentAt(t); return V(p.x - tg.z * off, 0, p.z + tg.x * off); };
function n2(x, z) { return Math.sin(x * 0.37 + Math.sin(z * 0.23)) * 0.5 + Math.sin(z * 0.41 + x * 0.17) * 0.35 + Math.sin(x * 1.3 + z * 1.1) * 0.15; }
const DIST = new Map();
function pd(x, z) { const k = (Math.round(x * 4) + 4000) * 10000 + (Math.round(z * 4) + 4000); let d = DIST.get(k); if (d === undefined) { d = pathDist(x, z); if (DIST.size < 200000) DIST.set(k, d); } return d; }
function groundH(x, z) { const p = Math.min(pd(x, z), Math.hypot(x - CL.x, z - CL.z) - CL_R + 1.5); return n2(x, z) * 0.18 * Math.min(1, Math.max(0, p) / 4) + Math.max(0, p - 6) * 0.05; }
const trodden = (x, z) => pd(x, z) < 1.15 || Math.hypot(x - CL.x, z - CL.z) < CL_R - 1.6;
function walkable(x, z) {
  if (Math.hypot(x - CL.x, z - CL.z) < CL_R - 0.6) return !blockedInClearing(x, z);
  if (z > 35.5) return false;
  return pd(x, z) < 1.75;
}

/* the waymarks: where each stands (t along the path, which side), what it asks */
const WAY = [
  { id: "signpost", q: 0, t: 0.1, side: 2.1, name: "The signpost" },
  { id: "lanterns", q: 1, t: 0.25, side: -2.0, name: "The lantern branch" },
  { id: "pool", q: 2, t: 0.41, side: 2.6, name: "The still pool" },
  { id: "cairn", q: 3, t: 0.56, side: -2.2, name: "The cairn" },
  { id: "hollow", q: 4, t: 0.71, side: 2.4, name: "The hollow tree" },
  { id: "bramble", q: 5, t: 0.86, side: 0, name: "The bramble" },
];
for (const w of WAY) { w.at = sideOf(w.t, w.side); w.stand = sideOf(w.t, w.side === 0 ? 0 : Math.sign(w.side) * 0.7); }
/* the clearing's doors, on its far rim, and the fire at its middle */
const DOORS = [
  { id: "cabin", name: "Wendell’s cabin", at: V(CL.x - 4.4, 0, CL.z - 3.6) },
  { id: "lectern", name: "The lectern", at: V(CL.x + 0.2, 0, CL.z - 5.2) },
  { id: "gate", name: "The gate to the games", at: V(CL.x + 4.6, 0, CL.z - 3.4) },
];
for (const d of DOORS) { const out = d.at.clone().sub(CL).setY(0).normalize(); d.stand = d.at.clone().addScaledVector(out, -1.5); }
const FIRE = { id: "fire", name: "The fire", at: CL.clone(), stand: V(CL.x, 0, CL.z + 2.0) };
function blockedInClearing(x, z) { if (Math.hypot(x - CL.x, z - CL.z) < 1.15) return true; for (const d of DOORS) if (Math.hypot(x - d.at.x, z - d.at.z) < (d.id === "cabin" ? 1.7 : 0.7)) return true; return false; }

/* ===================================================================================================
   The forest (land.js's recipes, along a path instead of round a ring)
   =================================================================================================== */
let glowTex = null;
function glowSprite(pos, size, color, opacity, normal = false, parent = scene) {
  if (!glowTex) { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, "rgba(255,255,255,.55)"); g.addColorStop(0.6, "rgba(255,255,255,.12)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); glowTex = new THREE.CanvasTexture(c); glowTex.colorSpace = THREE.SRGBColorSpace; }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity, depthWrite: false, fog: false, blending: normal ? THREE.NormalBlending : THREE.AdditiveBlending }));
  s.position.copy(pos); s.scale.set(size, size, 1); parent.add(s); return s;
}
function duskSky(toward, low, hor, up, warm) {
  const mat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTo: { value: toward.clone().normalize() }, uL: { value: new THREE.Color(low) }, uH: { value: new THREE.Color(hor) }, uU: { value: new THREE.Color(up) }, uW: { value: new THREE.Color(warm) } },
    vertexShader: "varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: `varying vec3 vD; uniform vec3 uTo, uL, uH, uU, uW;
      void main(){ float h = vD.y; vec3 c = mix(uH, uU, smoothstep(0.02, 0.7, h)); c = mix(uL, c, smoothstep(-0.15, 0.02, h));
        float s = max(dot(vD, uTo), 0.0); c += uW * (pow(s, 5.0) * 0.4 + pow(s, 40.0) * 0.5); gl_FragColor = vec4(c, 1.0); }` });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), mat); dome.renderOrder = -2; scene.add(dome); return mat;
}
let groundMesh = null;
function ground(M) {
  const N = LOW ? 150 : 230, G2 = new THREE.PlaneGeometry(110, 110, N, N); G2.rotateX(-Math.PI / 2); G2.translate(0, 0, -2);
  const p = G2.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color(), A = new THREE.Color(0x36402a), B = new THREE.Color(0x262c1c), CLc = new THREE.Color(0x7c8a52), PATH = new THREE.Color(0x5c5238);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, groundH(x, z));
    const w = n2(x * 2.1, z * 2.1) * 0.5 + 0.5; c.copy(A).lerp(B, w * 0.8); const dc = Math.hypot(x - CL.x, z - CL.z); if (dc < CL_R) c.lerp(CLc, (1 - dc / CL_R) * 0.6);
    const d = pd(x, z); if (d < 1.6) c.lerp(PATH, 0.55 * Math.min(1, (1.6 - d) / 0.6)); if (dc < CL_R - 1.4) c.lerp(PATH, 0.3);
    col.set([c.r, c.g, c.b], i * 3); }
  G2.setAttribute("color", new THREE.BufferAttribute(col, 3)); G2.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ map: M.moss.map.clone(), vertexColors: true, roughness: 1 }); m.map.repeat.set(36, 36); m.map.needsUpdate = true;
  groundMesh = new THREE.Mesh(G2, m); groundMesh.userData.keep = true; scene.add(groundMesh);
}
function grass(r, n) {
  const blade = new THREE.ConeGeometry(0.03, 1, 3); blade.translate(0, 0.5, 0);
  const im = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), n), o = new THREE.Object3D(), cc = new THREE.Color(); let k = 0;
  for (let t = 0; k < n && t < n * 4; t++) { const s = SAMPLES[Math.floor(r() * SAMPLES.length)], a = r() * 6.28, d = 1.0 + Math.sqrt(r()) * 9, x = s.x + Math.cos(a) * d, z = s.z + Math.sin(a) * d;
    if (pd(x, z) < 1.0) continue;
    o.position.set(x, groundH(x, z) - 0.02, z); o.rotation.set((r() - 0.5) * 0.5, r() * 6.28, (r() - 0.5) * 0.5 + 0.35); o.scale.set(1, 0.22 + r() * 0.45, 1); o.updateMatrix(); im.setMatrixAt(k, o.matrix);
    cc.setHex(0x34401e).lerp(new THREE.Color(0x4a5426), r() * 0.6); im.setColorAt(k++, cc); }
  im.count = k; scene.add(im);
}
function tree(M, r, x, z, { h = 9, rad = 0.45, heavy = 0, canopy = true, keepClear = () => false } = {}) {
  const g = new THREE.Group(); g.position.set(x, groundH(x, z) - 0.1, z); add(g);
  const geo = new THREE.CylinderGeometry(rad * 0.55, rad, h, LOW ? 9 : 12, LOW ? 8 : 14, true); geo.translate(0, h / 2, 0);
  const p = geo.attributes.position, col = new Float32Array(p.count * 3), lean = (r() - 0.5) * 0.3;
  for (let i = 0; i < p.count; i++) { const px = p.getX(i), py = p.getY(i), pz = p.getZ(i), a = Math.atan2(pz, px);
    const flare = 1 + Math.max(0, 1 - py / 1.4) ** 2 * 0.9 * (0.8 + 0.4 * Math.sin(a * 5)), bump = 1 + Math.sin(a * 7 + py * 1.3) * 0.06;
    p.setXYZ(i, px * flare * bump + lean * py * py / h * 0.2, py, pz * flare * bump);
    const k = 0.55 + 0.25 * Math.sin(a * 9 + py * 2) + Math.min(0.2, py * 0.03); col.set([k * 0.92, k * 0.9, k * 0.82], i * 3); }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, M.trunkV));
  for (let i = 0; i < 4; i++) { const a = r() * 6.28, len = 1 + r() * 1.3, d = V(Math.cos(a), 0, Math.sin(a));
    const pts = [V(d.x * rad * 0.6, 0.9, d.z * rad * 0.6), V(d.x * (rad + len * 0.4), 0.35, d.z * (rad + len * 0.4)), V(d.x * (rad + len), -0.05, d.z * (rad + len))];
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, rad * 0.22, 6), M.rootM)); }
  const leafMass = (pos, s) => { const w = pos.clone().add(g.position); if (keepClear(w)) return; const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), M.foliage); m.position.copy(pos); m.scale.set(s * (1 + r() * 0.4), s * (0.6 + r() * 0.3), s * (1 + r() * 0.4)); m.rotation.y = r() * 6; g.add(m); };
  if (canopy) for (let i = 0; i < 6; i++) { const a = r() * 6.28, d = 1 + r() * 2.2; leafMass(V(Math.cos(a) * d, h * 0.82 + r() * h * 0.25, Math.sin(a) * d), 1.6 + r() * 1.2); }
  for (let i = 0; i < (heavy > 0 ? 3 : 2); i++) {
    const a = r() * 6.28, d = V(Math.cos(a), 0, Math.sin(a)), y0 = 2.8 + r() * 2.5, len = 2.6 + r() * 2.2, sag = heavy > 0 ? y0 - 1.2 - r() * 0.5 : -0.8;
    const pts = [V(d.x * rad * 0.5, y0, d.z * rad * 0.5), V(d.x * len * 0.4, y0 + 0.5 - sag * 0.2, d.z * len * 0.4), V(d.x * len * 0.8, y0 - sag * 0.65, d.z * len * 0.8), V(d.x * len, y0 - sag, d.z * len)];
    if ([1, 2, 3].some(j => keepClear(pts[j].clone().add(g.position)))) continue;
    const curve = new THREE.CatmullRomCurve3(pts); g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, rad * 0.2, 6), M.trunk));
    for (let k = 0; k < 3; k++) { const q = curve.getPointAt(0.55 + k * 0.18); leafMass(q.clone().add(V(0, -0.3, 0)), 0.55 + r() * 0.4 + heavy * 0.15); }
  }
  return g;
}
function mist(r, n, color, op) { for (let i = 0; i < n; i++) { const s = SAMPLES[Math.floor(r() * SAMPLES.length)], a = r() * 6.28, d = 4 + r() * 10; glowSprite(V(s.x + Math.cos(a) * d, 0.5 + r() * 1.6, s.z + Math.sin(a) * d), 8 + r() * 8, color, op, true); } }

/* words in the world: the signpost's boards, what floats on the pool */
function textCanvas(text, { w = 512, h = 128, font = 40, color = "#f3ece2", bg = null, align = "center" } = {}) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d");
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  x.font = `${font}px Marcellus, Georgia, serif`; x.fillStyle = color; x.textAlign = align; x.textBaseline = "middle";
  const words = String(text).split(/\s+/), lines = []; let line = "";
  for (const wd of words) { const t = line ? line + " " + wd : wd; if (x.measureText(t).width > w - 40 && line) { lines.push(line); line = wd; } else line = t; }
  if (line) lines.push(line);
  const lh = font * 1.18, y0 = h / 2 - (lines.length - 1) * lh / 2;
  lines.slice(0, Math.floor(h / lh)).forEach((l, i) => { x.shadowColor = "rgba(0,0,0,.6)"; x.shadowBlur = bg ? 0 : 8; x.fillText(l, align === "center" ? w / 2 : 20, y0 + i * lh); });
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter; return tex;
}
function textSprite(text, width, opts = {}) {
  const ratio = (opts.h || 160) / (opts.w || 640);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: textCanvas(text, { w: 640, h: 160, font: 44, ...opts }), transparent: true, depthWrite: false, fog: false }));
  s.scale.set(width, width * ratio, 1); scene.add(s); return s;
}

/* ===================================================================================================
   The six waymarks and the clearing
   =================================================================================================== */
const fx = { boards: [], lanterns: [], pool: null, poolWords: null, stones: [], cairnWords: null, hollowGlow: null, hollowLight: null, thorns: [], lights: [], fire: null, doors: {} };
const faceTo = (o, from, to) => { o.rotation.y = Math.atan2(to.x - from.x, to.z - from.z); };

function signpost(M) {
  const w = WAY[0], g = new THREE.Group(); g.position.copy(w.at).setY(groundH(w.at.x, w.at.z)); scene.add(g);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.9, 8), M.darkWood); post.position.y = 1.45; g.add(post);
  const opts = [...D.EXPERIENCES.map(e => e.text), "In my own words"];
  opts.forEach((txt, i) => {
    const mat = new THREE.MeshStandardMaterial({ map: textCanvas(txt, { w: 1024, h: 160, font: 54, color: "#2a1d12", bg: "#b8915e" }), roughness: 0.85, emissive: 0xffc070, emissiveIntensity: 0 });
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.27, 0.05), [M.plank, M.plank, M.plank, M.plank, mat, mat]);
    const s = i % 2 ? 1 : -1;
    board.position.set(s * 0.62, 2.62 - i * 0.36, 0.07); board.rotation.set(0, s * 0.12, s * 0.03); g.add(board);
    fx.boards.push({ mat, id: i < D.EXPERIENCES.length ? D.EXPERIENCES[i].id : "own" });
  });
  faceTo(g, w.at, atT(w.t - 0.02));
}
function lanternBranch(M) {
  const w = WAY[1], base = w.at.clone().setY(groundH(w.at.x, w.at.z));
  const tg = CURVE.getTangentAt(w.t), along = V(tg.x, 0, tg.z).normalize();
  const a = base.clone().addScaledVector(along, -1.5), b = base.clone().addScaledVector(along, 1.5);
  for (const p of [a, b]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 2.6, 8), M.trunk); post.position.copy(p).setY(p.y + 1.3); scene.add(post); }
  const arc = new THREE.CatmullRomCurve3([a.clone().setY(a.y + 2.5), base.clone().setY(base.y + 2.85), b.clone().setY(b.y + 2.5)]);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(arc, 20, 0.07, 6), M.trunk));
  D.SATISFACTIONS.forEach((s, i) => {
    const p = arc.getPointAt(0.12 + i * 0.19), col = new THREE.Color(D.CHANNEL_LIGHT[s.channel]);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.4, 4), M.rope); cord.position.copy(p).add(V(0, -0.2, 0)); scene.add(cord);
    const mat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.12, roughness: 0.4, transparent: true, opacity: 0.92 });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), mat); lamp.scale.y = 1.3; lamp.position.copy(p).add(V(0, -0.52, 0)); scene.add(lamp);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 0.06, 8), M.brassDark); cap.position.copy(lamp.position).add(V(0, 0.19, 0)); scene.add(cap);
    const glow = glowSprite(lamp.position.clone(), 1.4, col, 0.0);
    fx.lanterns.push({ channel: s.channel, mat, glow, on: 0 });
  });
}
function pool(M) {
  const w = WAY[2], y = groundH(w.at.x, w.at.z);
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.5, 40), new THREE.MeshStandardMaterial({ color: 0x18242a, roughness: 0.08, metalness: 0.7, emissive: 0x0a1418, emissiveIntensity: 1 }));
  water.rotation.x = -Math.PI / 2; water.position.set(w.at.x, y + 0.04, w.at.z); water.scale.set(1.25, 1, 1); scene.add(water);
  const r = rng(31);
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28, s = 0.16 + r() * 0.18; const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), M.rock); rock.position.set(w.at.x + Math.cos(a) * 1.9, y + s * 0.4, w.at.z + Math.sin(a) * 1.55); rock.rotation.set(r() * 3, r() * 3, 0); add(rock); }
  fx.pool = water;
  fx.poolGlow = glowSprite(V(w.at.x, y + 0.2, w.at.z), 3.4, 0x8fb8ff, 0.0, false);
}
function cairn(M) {
  const w = WAY[3], y = groundH(w.at.x, w.at.z), r = rng(77);
  let h = y; const sizes = [0.42, 0.36, 0.31, 0.26, 0.2, 0.15];   // top to bottom on the body: the stack is read top-down as head..feet
  D.BODY_REGIONS.slice().reverse().forEach((region, k) => {
    const s = sizes[k], mat = new THREE.MeshStandardMaterial({ color: 0x6a6458, roughness: 0.95, flatShading: true, emissive: 0x9fd0ff, emissiveIntensity: 0 });
    const st = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 1), mat); st.scale.set(1.25, 0.62, 1.1); st.rotation.y = r() * 6;
    st.position.set(w.at.x + (r() - 0.5) * 0.06, h + s * 0.6, w.at.z + (r() - 0.5) * 0.06); h += s * 1.18; scene.add(st);
    fx.stones.push({ region, mat, on: 0 });
  });
  fx.cairnTop = V(w.at.x, h + 0.4, w.at.z);
}
function hollowTree(M, r) {
  const w = WAY[4];
  const out = w.at.clone().sub(atT(w.t)).setY(0).normalize(), back = w.at.clone().addScaledVector(out, 0.9);
  tree(M, r, back.x, back.z, { h: 13, rad: 1.15, heavy: 0.4 });
  const y = groundH(w.at.x, w.at.z);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), new THREE.MeshBasicMaterial({ color: 0x0c0806 }));
  hole.scale.set(0.8, 1.5, 1); hole.position.copy(back).addScaledVector(out, -1.08).setY(y + 1.25); faceTo(hole, hole.position, atT(w.t)); scene.add(hole);
  fx.hollowGlow = glowSprite(hole.position.clone().addScaledVector(out, -0.05), 1.6, 0xffc46a, 0.0);
  fx.hollowLight = new THREE.PointLight(0xffb060, 0, 6, 1.6); fx.hollowLight.position.copy(hole.position).addScaledVector(out, -0.4); scene.add(fx.hollowLight);
}
function bramble(M) {
  const w = WAY[5], tg = CURVE.getTangentAt(w.t), along = V(tg.x, 0, tg.z).normalize(), side = V(-along.z, 0, along.x);
  const thornM = () => new THREE.MeshStandardMaterial({ color: 0x3a2a22, roughness: 0.9 });
  D.BELIEFS.forEach((b, i) => {
    const c = atT(w.t).addScaledVector(along, (i - 2.5) * 0.55), y = groundH(c.x, c.z), s = i % 2 ? 1 : -1;
    const pts = [c.clone().addScaledVector(side, 2.2 * s).setY(y), c.clone().addScaledVector(side, 1.4 * s).setY(y + 1.5), c.clone().addScaledVector(side, 0.1 * s).setY(y + 2.25), c.clone().addScaledVector(side, -1.5 * s).setY(y + 1.4), c.clone().addScaledVector(side, -2.3 * s).setY(y)];
    const curve = new THREE.CatmullRomCurve3(pts), mat = thornM(), g = new THREE.Group(); scene.add(g);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.045, 5), mat));
    for (let k = 1; k < 14; k++) { const p = curve.getPointAt(k / 14), sp = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.22, 4), mat); sp.position.copy(p); sp.rotation.set(k * 1.3, k * 2.1, k * 0.7); g.add(sp); }
    const pivot = c.clone().setY(y); g.position.sub(pivot); const holder = new THREE.Group(); holder.position.copy(pivot); holder.add(g); scene.add(holder);
    fx.thorns.push({ belief: b.belief, mat, holder, k: 0 });
  });
}
function clearing(M, r) {
  const y = groundH(CL.x, CL.z);
  // the fire: a ring of stones, logs, a flame of glowing cones, its light
  for (let i = 0; i < 11; i++) { const a = i / 11 * 6.28, st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.17, 0), M.rock); st.position.set(CL.x + Math.cos(a) * 0.85, y + 0.08, CL.z + Math.sin(a) * 0.85); add(st); }
  for (let i = 0; i < 4; i++) { const log = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.0, 6), M.darkWood); log.position.set(CL.x, y + 0.15, CL.z); log.rotation.set(Math.PI / 2 - 0.35, i * 0.8, 0); scene.add(log); }
  const flameM = new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const flames = []; for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.16 + i * 0.02, 0.7 + (i % 3) * 0.2, 6), flameM); f.position.set(CL.x + Math.cos(i * 1.3) * 0.12, y + 0.5, CL.z + Math.sin(i * 1.3) * 0.12); scene.add(f); flames.push(f); }
  const light = new THREE.PointLight(0xff9a48, 14, 14, 1.4); light.position.set(CL.x, y + 1.1, CL.z); scene.add(light);
  const glow = glowSprite(V(CL.x, y + 0.7, CL.z), 3.2, 0xffa050, 0.55);
  fx.fire = { flames, light, glow };
  // two log seats
  for (const a of [0.9, 2.3]) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.4, 8), M.wood); s.rotation.z = Math.PI / 2; s.rotation.y = a; s.position.set(CL.x + Math.cos(a + 1.2) * 2.4, y + 0.22, CL.z + Math.sin(a + 1.2) * 2.4); add(s); }
  // the six lights over the fire, one per question, lit when it is answered
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + 0.5, p = V(CL.x + Math.cos(a) * 1.35, y + 2.2 + (i % 2) * 0.3, CL.z + Math.sin(a) * 1.35);
    fx.lights.push({ g: glowSprite(p, 0.9, 0xffe0a0, 0.0), core: glowSprite(p.clone(), 0.25, 0xffffff, 0.0), base: p.clone(), q: i }); }
  // the cabin: Wendell's door, a lit window
  { const d = DOORS[0], g = new THREE.Group(); g.position.copy(d.at).setY(groundH(d.at.x, d.at.z)); scene.add(g);
    const walls = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.0, 2.2), M.wood); walls.position.y = 1.0; g.add(walls);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.25, 1.3, 4), M.thatch); roof.position.y = 2.65; roof.rotation.y = Math.PI / 4; roof.scale.set(1.15, 1, 1); g.add(roof);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.45), new THREE.MeshStandardMaterial({ color: 0x4a3020, emissive: 0xffa040, emissiveIntensity: 0.08 })); door.position.set(-0.4, 0.73, 1.111); g.add(door);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.45), M.window); win.position.set(0.65, 1.15, 1.111); g.add(win);
    const wl = new THREE.PointLight(0xffb060, 1.6, 4, 1.8); wl.position.set(0.6, 1.2, 1.9); g.add(wl);
    glowSprite(V(0, 0, 0).copy(g.position).add(V(0, 1.2, 0)), 1.4, 0xffb060, 0.25, false, scene).position.copy(win.getWorldPosition(V(0, 0, 0)));
    faceTo(g, d.at, CL); fx.doors.cabin = { mat: door.material }; }
  // the lectern and its open book
  { const d = DOORS[1], g = new THREE.Group(); g.position.copy(d.at).setY(groundH(d.at.x, d.at.z)); scene.add(g);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 1.1, 8), M.darkWood); stand.position.y = 0.55; g.add(stand);
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.05, 0.55), M.darkWood); top.position.y = 1.12; top.rotation.x = -0.35; g.add(top);
    const pageM = new THREE.MeshStandardMaterial({ color: 0xf0e6cf, emissive: 0xffe0a0, emissiveIntensity: 0.25, roughness: 0.9 });
    for (const s of [-1, 1]) { const pg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.02, 0.44), pageM); pg.position.set(s * 0.17, 1.17, 0.0); pg.rotation.set(-0.35, 0, s * -0.08); g.add(pg); }
    glowSprite(g.position.clone().add(V(0, 1.4, 0)), 1.1, 0xffe0a0, 0.3);
    faceTo(g, d.at, CL); fx.doors.lectern = { mat: pageM }; }
  // the gate to the games: two posts, a string of lanterns, a light beyond
  { const d = DOORS[2], g = new THREE.Group(); g.position.copy(d.at).setY(groundH(d.at.x, d.at.z)); scene.add(g);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 2.7, 8), M.trunk); p.position.set(s * 0.95, 1.35, 0); g.add(p); }
    const arc = new THREE.CatmullRomCurve3([V(-0.95, 2.6, 0), V(0, 3.05, 0), V(0.95, 2.6, 0)]); g.add(new THREE.Mesh(new THREE.TubeGeometry(arc, 12, 0.06, 6), M.trunk));
    const hues = Object.values(D.CHANNEL_LIGHT);
    hues.forEach((h, i) => { const p = arc.getPointAt(0.1 + i * 0.2); const l = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: h })); l.position.copy(p).add(V(0, -0.15, 0)); g.add(l); });
    faceTo(g, d.at, CL); g.updateMatrixWorld(true);
    for (let i = 0; i < 5; i++) glowSprite(g.localToWorld(V((i - 2) * 0.35, 2.45, 0)), 0.7, hues[i], 0.4);
    const beyond = g.localToWorld(V(0, 1.2, -2.5)); glowSprite(beyond, 4.5, 0xb6f08a, 0.22); fx.doors.gate = {}; }
}

/* fireflies along the path ahead, in the light you chose at the lantern branch */
let flies = null;
function makeFlies(r) {
  const n = LOW ? 160 : 320, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = 0.27 + r() * 0.73, s = CURVE.getPointAt(Math.min(1, t)), a = r() * 6.28, d = 0.6 + r() * 3.5;
    pos.set([s.x + Math.cos(a) * d, 0.5 + r() * 2.6, s.z + Math.sin(a) * d], i * 3); seed[i] = r(); col.set([0.9, 0.9, 0.75], i * 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const c = document.createElement("canvas"); c.width = c.height = 32; const x = c.getContext("2d"); const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 32, 32);
  const mat = new THREE.PointsMaterial({ size: 0.16, map: new THREE.CanvasTexture(c), vertexColors: true, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  flies = new THREE.Points(geo, mat); flies.userData.seed = seed; flies.userData.base = pos.slice(); scene.add(flies);
}
function colourFlies() {
  if (!flies) return;
  const hues = walk.toward.map(c => new THREE.Color(D.CHANNEL_LIGHT[c])), col = flies.geometry.attributes.color, seed = flies.userData.seed;
  for (let i = 0; i < col.count; i++) { const c = hues.length ? hues[Math.floor(seed[i] * hues.length)] : new THREE.Color(0.9, 0.9, 0.75); col.setXYZ(i, c.r, c.g, c.b); }
  col.needsUpdate = true; flies.userData.want = hues.length ? 0.95 : 0.35;
}

/* ===================================================================================================
   The traveller (land.js makeFigure, without the toolbag)
   =================================================================================================== */
const loader = new GLTFLoader();
// who walks: asked once at the forest's edge, kept for the tab; ?who=f|m answers it for the pictures
const WHO_KEY = "coaching-walk-who";
function chooseWho() {
  const q = Q.get("who"); if (q === "f" || q === "m") return Promise.resolve(q);
  try { const s = sessionStorage.getItem(WHO_KEY); if (s === "f" || s === "m") return Promise.resolve(s); } catch (e) { /* ask */ }
  if (Q.get("shot")) return Promise.resolve("f");
  const box = $("#who"); box.hidden = false; step("");
  return new Promise(res => { for (const b of box.querySelectorAll("button")) b.onclick = () => {
    try { sessionStorage.setItem(WHO_KEY, b.dataset.who); } catch (e) { /* private mode */ }
    box.hidden = true; res(b.dataset.who); }; });
}
async function makeTraveller(who) {
  const { makeWalker } = await import("/between/cult/walker.js");   // loaded here, so a failure leaves the Dusk fallback standing
  const w = await makeWalker({ who, outfit: "B2" });
  scene.add(w.holder);
  return w;
}
async function makeFigure() {
  const gl = await loader.loadAsync("/between/m/dusk/average-dusk.glb");
  const root = gl.scene; mergeByParent(root); root.updateMatrixWorld(true);
  const box = new THREE.Box3(); root.traverse(o => { if (o.isMesh) { if (o.isSkinnedMesh) { o.computeBoundingBox(); box.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld)); } else box.expandByObject(o); } });
  const obj = skClone(root), k = 1.7 / Math.max(box.getSize(V(0, 0, 0)).y, 0.01);
  obj.scale.setScalar(k); obj.position.y = -box.min.y * k;
  const wardrobe = dressFigure(obj, await loadParts(u => loader.loadAsync(u)));
  wardrobe.set(null);
  obj.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
  const holder = new THREE.Group(); holder.add(obj); scene.add(holder);
  const mixer = new THREE.AnimationMixer(obj), acts = {};
  for (const n of ["Walk", "Idle"]) { const c = gl.animations.find(a => a.name === n); if (c) { acts[n] = mixer.clipAction(c); acts[n].play(); } }
  const w = { Walk: 0, Idle: 1 }; if (acts.Walk) acts.Walk.setEffectiveWeight(0);
  let cur = "idle";
  return { holder, update(dt, moving) {
    const s = stance({ moving }); if (s !== cur) { if (s === "walk" && w.Walk < 0.05 && acts.Walk) acts.Walk.time = 0; cur = s; }
    const want = clipWeights(cur), kk = 1 - Math.exp(-3 * dt / FADE[cur]);
    for (const n of ["Walk", "Idle"]) if (acts[n]) { w[n] += (want[n] - w[n]) * kk; acts[n].setEffectiveWeight(w[n]); }
    if (acts.Walk) acts.Walk.timeScale = 1.0;
    mixer.update(dt); wardrobe.dress(dt);
  } };
}

/* ===================================================================================================
   Build
   =================================================================================================== */
const state = { me: null, near: null, cardKey: "", captions: [], capUntil: 0, told: new Set(), copied: false, focus: false };
async function build() {
  step("growing the forest");
  const M = {}, h = buildHollow(new THREE.Scene(), { lowPower: LOW, shell: "hollow" });   // built only to lend its materials
  h.root.traverse(o => { if (!o.isMesh || Array.isArray(o.material) || !o.material.isMeshStandardMaterial) return; const m = o.material, hex = m.color.getHex();
    if (m.vertexColors && m.map) M.bark = M.bark || m; else if (m.map && hex === 0xc4a68a) M.root = m; else if (m.map && m.roughness === 1) M.moss = M.moss || m; });
  M.trunkV = M.bark.clone(); M.trunkV.color.setHex(0x9a8a78); M.trunkV.side = THREE.FrontSide;
  M.trunk = M.trunkV.clone(); M.trunk.vertexColors = false;
  M.rootM = M.root.clone(); M.rootM.color.setHex(0x7a6450);
  M.foliage = new THREE.MeshStandardMaterial({ color: 0x2e4a26, roughness: 0.95, flatShading: true });
  M.wood = new THREE.MeshStandardMaterial({ color: 0x7a5032, roughness: 0.8 });
  M.darkWood = new THREE.MeshStandardMaterial({ color: 0x4f321e, roughness: 0.9 });
  M.plank = new THREE.MeshStandardMaterial({ color: 0xb08a58, roughness: 0.75 });
  M.rock = new THREE.MeshStandardMaterial({ color: 0x5a5448, roughness: 1, flatShading: true });
  M.rope = new THREE.MeshStandardMaterial({ color: 0x9c7b52, roughness: 1 });
  M.brassDark = new THREE.MeshStandardMaterial({ color: 0x6e6234, roughness: 0.7, metalness: 0.5 });
  M.thatch = new THREE.MeshStandardMaterial({ color: 0x5a4a30, roughness: 1, flatShading: true });
  M.window = new THREE.MeshBasicMaterial({ color: 0xffc070 });

  scene.fog = new THREE.FogExp2(0x4c5c58, 0.036); scene.background = new THREE.Color(0x4c5c58);
  duskSky(V(-0.4, 0.15, -1), 0x3a4440, 0x8a9888, 0x4a4660, 0x9ab890);
  scene.add(new THREE.HemisphereLight(0xa8c0c8, 0x3c4030, 1.7));
  const dusk = new THREE.DirectionalLight(0xc0dcc0, 1.4); dusk.position.set(-6, 10, -14); scene.add(dusk);
  const cool = new THREE.DirectionalLight(0x98a8d8, 0.7); cool.position.set(12, 6, 6); scene.add(cool);
  const warm = new THREE.DirectionalLight(0xe8b888, 0.5); warm.position.set(-10, 3, 8); scene.add(warm);
  ground(M);
  const r = rng(20261105);
  step("planting the trees");
  grass(r, LOW ? 7000 : 16000);
  const near = w => WAY.some(x => Math.hypot(w.x - x.at.x, w.z - x.at.z) < 2.6);
  const keepClear = w => pd(w.x, w.z) < 1.6 && w.y < 4.2;
  let planted = 0;
  for (let tries = 0; planted < (LOW ? 85 : 150) && tries < 4000; tries++) {
    const s = SAMPLES[Math.floor(r() * SAMPLES.length)], a = r() * 6.28, d = 2.9 + Math.pow(r(), 1.4) * 15, x = s.x + Math.cos(a) * d, z = s.z + Math.sin(a) * d;
    if (pd(x, z) < 2.8 || near(V(x, 0, z)) || Math.hypot(x - CL.x, z - CL.z) < CL_R + 0.8) continue;
    tree(M, r, x, z, { h: 9 + r() * 5, rad: 0.32 + r() * 0.35, heavy: r() < 0.4 ? 0.8 : 0, keepClear }); planted++;
  }
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28 + 0.2, d = CL_R + 1.2 + r() * 1.5, x = CL.x + Math.cos(a) * d, z = CL.z + Math.sin(a) * d; if (pd(x, z) < 2.6) continue;
    tree(M, r, x, z, { h: 11 + r() * 4, rad: 0.5 + r() * 0.25, heavy: 0.5, keepClear: w => Math.hypot(w.x - CL.x, w.z - CL.z) < CL_R - 0.4 && w.y < 5 }); }
  step("setting the waymarks");
  signpost(M); lanternBranch(M); pool(M); cairn(M); hollowTree(M, r); bramble(M); clearing(M, r);
  mist(r, LOW ? 16 : 30, 0xb8c8bc, 0.12);
  makeFlies(r);
  mergeStatic(G);
  const who = await chooseWho();
  step("waking your traveller");
  try { state.me = await makeTraveller(who); } catch (e) { console.warn("cultivation figure", e); }
  if (!state.me) try { state.me = await makeFigure(); } catch (e) { console.warn("figure", e); }
  applyWalk();
}

/* ===================================================================================================
   What your answers do to the place
   =================================================================================================== */
function applyWalk() {
  for (const b of fx.boards) b.want = (b.id === walk.experience || (b.id === "own" && !walk.experience && walk.experienceOwn.trim())) ? 1 : 0;
  for (const l of fx.lanterns) l.want = walk.toward.includes(l.channel) ? 1 : 0;
  colourFlies();
  if (fx.poolWords) { scene.remove(fx.poolWords); fx.poolWords = null; }
  if (walk.now.trim()) { const w = WAY[2]; fx.poolWords = textSprite(walk.now.trim(), 3.0, { h: 200, font: 38, color: "#dfe9f5" }); fx.poolWords.position.set(w.at.x, groundH(w.at.x, w.at.z) + 0.75, w.at.z); }
  for (const s of fx.stones) s.want = walk.where.includes(s.region) ? 1 : 0;
  if (fx.cairnWords) { scene.remove(fx.cairnWords); fx.cairnWords = null; }
  if (walk.feels.length) { fx.cairnWords = textSprite(walk.feels.join(" · "), 2.4, { h: 140, font: 40, color: "#cfe3f5" }); fx.cairnWords.position.copy(fx.cairnTop); }
  fx.hollowWant = walk.truth.trim() ? 1 : 0;
  for (const t of fx.thorns) t.want = walk.reservations.includes(t.belief) ? 1 : 0;
  fx.lights.forEach((l, i) => { l.want = answered(D.QUESTIONS[i].id) ? 1 : 0; });
  const st = $("#steps"); if (st) st.innerHTML = D.QUESTIONS.map(q => `<i class="${answered(q.id) ? "on" : ""}" title="${esc(q.title)}"></i>`).join("");
  save();
}
function easeFx(dt) {
  const k = REDUCED ? 1 : Math.min(1, dt * 2.2);
  for (const b of fx.boards) { b.on = (b.on || 0) + ((b.want || 0) - (b.on || 0)) * k; b.mat.emissiveIntensity = b.on * 0.55; }
  for (const l of fx.lanterns) { l.on += (l.want - l.on) * k; l.mat.emissiveIntensity = 0.12 + l.on * 2.2; l.glow.material.opacity = l.on * 0.75; }
  if (flies) { const m = flies.material; m.opacity += ((flies.userData.want ?? 0.35) - m.opacity) * k; }
  for (const s of fx.stones) { s.on += (s.want - s.on) * k; s.mat.emissiveIntensity = s.on * 0.9; }
  fx.hollowOn = (fx.hollowOn || 0) + ((fx.hollowWant || 0) - (fx.hollowOn || 0)) * k;
  if (fx.hollowGlow) { fx.hollowGlow.material.opacity = fx.hollowOn * 0.85; fx.hollowLight.intensity = fx.hollowOn * 6; }
  if (fx.poolGlow) fx.poolGlow.material.opacity = walk.now.trim() ? 0.35 : 0;
  for (const t of fx.thorns) { t.k += (t.want - t.k) * (REDUCED ? 1 : Math.min(1, dt * 1.2)); const s = 1 - t.k * 0.78; t.holder.scale.set(1, s, 1); t.mat.color.setHex(0x3a2a22).lerp(new THREE.Color(0x8a8478), t.k); }
  for (const l of fx.lights) { l.on = (l.on || 0) + (l.want - (l.on || 0)) * k; l.g.material.opacity = l.on * 0.7; l.core.material.opacity = l.on * 0.95; }
}

/* ===================================================================================================
   Walking (land.js's controls)
   =================================================================================================== */
const START = CURVE.getPointAt(0.0);
const me = { pos: START.clone(), yaw: Math.PI, target: null, keys: new Set() };
const intro = { on: !Q.get("at"), t: 0, settling: false };
let camYaw = intro.on ? Math.PI : 0, camPitch = 0.3, camDist = LOW ? 5.2 : 4.6, drag = null;
const el = renderer.domElement, ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
el.addEventListener("pointerdown", e => { intro.on = false; drag = { x: e.clientX, y: e.clientY, yaw: camYaw, pitch: camPitch, moved: false }; });
el.addEventListener("pointermove", e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 8) drag.moved = true;
  if (drag.moved) { camYaw = drag.yaw - dx * 0.006; camPitch = Math.max(0.08, Math.min(0.9, drag.pitch + dy * 0.004)); } });
el.addEventListener("pointerup", e => { const d = drag; drag = null; if (!d || d.moved || !groundMesh) return; tap(e.clientX, e.clientY); });
addEventListener("keydown", e => { if (e.target.closest && e.target.closest("button, input, textarea, a")) return; me.keys.add(e.key.toLowerCase()); });
addEventListener("keyup", e => me.keys.delete(e.key.toLowerCase()));
const PLACES = [...WAY, FIRE, ...DOORS];
function tap(cx, cy) {
  ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  let best = null, bd = 1.2;
  for (const p of PLACES) { const d = ray.ray.distanceToPoint(p.at.clone().setY(groundH(p.at.x, p.at.z) + 1.2)); if (d < bd) { bd = d; best = p.stand.clone(); } }
  if (!best) { const hit = ray.intersectObject(groundMesh, false)[0]; if (!hit) return; best = hit.point.setY(0); }
  intro.on = false; me.target = best;
}
function walkTo(p) { intro.on = false; me.target = p.stand.clone(); }
function move(dt) {
  if (state.focus) return false;
  let dir = null;
  const fwd = V(-Math.sin(camYaw), 0, -Math.cos(camYaw)), right = V(-fwd.z, 0, fwd.x), k = me.keys, kd = V(0, 0, 0);
  if (k.has("w") || k.has("arrowup")) kd.add(fwd); if (k.has("s") || k.has("arrowdown")) kd.sub(fwd);
  if (k.has("d") || k.has("arrowright")) kd.add(right); if (k.has("a") || k.has("arrowleft")) kd.sub(right);
  if (kd.lengthSq() > 0) { dir = kd.normalize(); me.target = null; intro.on = false; }
  else if (me.target) { const d = me.target.clone().sub(me.pos).setY(0); if (d.length() < 0.08) me.target = null; else dir = d.normalize(); }
  if (!dir) return false;
  const s = Math.min(1.6 * dt, me.target ? me.target.distanceTo(me.pos.clone().setY(0)) : 9);
  const nx = me.pos.x + dir.x * s, nz = me.pos.z + dir.z * s;
  if (walkable(nx, nz)) { me.pos.x = nx; me.pos.z = nz; }
  else if (walkable(nx, me.pos.z)) me.pos.x = nx;
  else if (walkable(me.pos.x, nz)) me.pos.z = nz;
  else { // a tap off the path: slide along it toward the target's nearest path point
    if (me.target) { let bi = 0, bd = 1e9; SAMPLES.forEach((p, i) => { const d = p.distanceToSquared(me.target); if (d < bd) { bd = d; bi = i; } }); const p = SAMPLES[bi]; if (p.distanceTo(me.target) > 0.3) { me.target = p.clone(); return false; } }
    me.target = null; return false; }
  const want = Math.atan2(dir.x, dir.z); let dy = want - me.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); me.yaw += dy * Math.min(1, dt * 8);
  return true;
}

/* ===================================================================================================
   The card: what the place you stand at asks
   =================================================================================================== */
function caption(text, secs = 6) { state.captions.push({ text, secs }); }
function tell(key, text, secs) { if (state.told.has(key)) return; state.told.add(key); caption(text, secs); }
function nearNow() {
  let best = null, bd = 9;
  for (const p of WAY) { const d = Math.hypot(me.pos.x - p.at.x, me.pos.z - p.at.z); if (d < 2.6 && d < bd) { bd = d; best = p.id; } }
  for (const p of [FIRE, ...DOORS]) { const d = Math.hypot(me.pos.x - p.at.x, me.pos.z - p.at.z); if (d < (p.id === "cabin" ? 3.2 : 2.6) && d < bd) { bd = d; best = p.id; } }
  return best;
}
const tags = location.search;
const link = (href, label, sub = "", cls = "btn") => `<a class="${cls}" href="${esc(D.withTags(href, tags))}" target="_blank" rel="noopener">${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ""}</a>`;
const pressed = on => `aria-pressed="${on ? "true" : "false"}"`;
const nextWay = id => { const i = WAY.findIndex(w => w.id === id); return i >= 0 && i < WAY.length - 1 ? WAY[i + 1] : FIRE; };
const walkOn = (id, done) => `<div class="row"><button type="button" class="${done ? "go" : "quiet"}" data-act="on:${id}">${done ? "Walk on" : "Walk on without answering"}</button></div>`;
function cardFor(id) {
  const way = WAY.find(w => w.id === id);
  if (way) {
    const q = D.QUESTIONS[way.q], head = `<h2>${esc(q.title)}</h2><p><span class="k">${esc(way.name)}, ${way.q + 1} of 6.</span> ${esc(q.hint)}</p>`;
    if (id === "signpost") return head + `<div class="opts">${D.EXPERIENCES.map(e => `<button type="button" data-act="exp:${e.id}" ${pressed(walk.experience === e.id)}>${esc(e.text)}</button>`).join("")}</div>
      <input id="own" type="text" maxlength="160" placeholder="Or in your own words" value="${esc(walk.experienceOwn)}" aria-label="What you want to create, in your own words">` + walkOn(id, answered("experience"));
    if (id === "lanterns") return head + `<div class="opts">${D.SATISFACTIONS.map(s => `<button type="button" data-act="tow:${s.channel}" ${pressed(walk.toward.includes(s.channel))}><span style="color:${s.channel === "fear" ? "#9aa8b8" : D.CHANNEL_LIGHT[s.channel]}">●</span> ${esc(s.state[0].toUpperCase() + s.state.slice(1))}<small>${esc(s.means)}</small></button>`).join("")}</div>` + walkOn(id, answered("toward"));
    if (id === "pool") return head + `<textarea id="now" maxlength="400" placeholder="Right now, life is..." aria-label="${esc(q.title)}">${esc(walk.now)}</textarea><div class="row"><button type="button" class="go" data-act="say:now">Set it on the water</button><button type="button" class="quiet" data-act="on:pool">Walk on</button></div>`;
    if (id === "cairn") return head + `<p>Where in the body</p><div class="chips">${D.BODY_REGIONS.map(b => `<button type="button" data-act="where:${b}" ${pressed(walk.where.includes(b))}>${esc(b)}</button>`).join("")}</div>
      <p>The words that fit</p><div class="chips">${D.DISSATISFACTIONS.map(d => `<button type="button" data-act="feel:${d.state}" ${pressed(walk.feels.includes(d.state))}>${esc(d.state)}</button>`).join("")}</div>` + walkOn(id, answered("feels"));
    if (id === "hollow") { const felt = [...new Set(walk.feels.map(s => D.DISSATISFACTIONS.find(d => d.state === s)?.channel).filter(Boolean))];
      return `<h2>${esc(q.title)}</h2><p><span class="k">${esc(way.name)}, 5 of 6.</span> ${felt.length ? "Every feeling has a job. Here is the job of each one under what you chose." : esc(q.hint)}</p>${felt.map(c => `<div class="job">${esc(D.JOBS[c])}</div>`).join("")}
      <textarea id="truth" maxlength="400" placeholder="For someone to feel this way, it would have to be true that..." aria-label="${esc(q.title)}">${esc(walk.truth)}</textarea><div class="row"><button type="button" class="go" data-act="say:truth">Speak it into the hollow</button><button type="button" class="quiet" data-act="on:hollow">Walk on</button></div>`; }
    if (id === "bramble") return head + `<div class="opts">${D.BELIEFS.map(b => `<button type="button" data-act="res:${b.belief}" ${pressed(walk.reservations.includes(b.belief))}>${esc(b.belief)}<small>${esc(b.sounds)}</small></button>`).join("")}</div>` + walkOn(id, answered("reservations"));
  }
  const exp = D.EXPERIENCES.find(e => e.id === walk.experience), ally = !!exp?.allyship, n = D.QUESTIONS.filter(q => answered(q.id)).length;
  if (id === "fire") return `<h2>${n ? "This is what you carried in." : "You are at the fire."}</h2>
    <p>${n ? `${n} of the six lights over the fire are yours. Three doors stand at the edge of the clearing: Wendell’s cabin, the book on the lectern, and the gate to the games.` : "Three doors stand at the edge of the clearing: Wendell’s cabin, the book on the lectern, and the gate to the games. The path behind you still holds the six questions."}</p>
    <div class="opts two"><button type="button" data-act="go:cabin">Wendell’s cabin</button><button type="button" data-act="go:lectern">The book</button><button type="button" data-act="go:gate">The games</button>${n ? `<button type="button" data-act="copy">${state.copied ? "Copied" : "Copy what you carried"}</button>` : `<button type="button" data-act="go:signpost">Back to the path</button>`}</div>`;
  if (id === "cabin") return `<h2>Sit down with me</h2>
    <figure><img src="/mastering-allyship/wendell.jpg" alt="Wendell Britt"><figcaption>Most of us know what we want and keep stalling on it. Usually a part of us is doing that on purpose, and it has a reason. I coach people to meet that part, hear what it is protecting, and put its strength to work on what they actually want.<br><small style="opacity:.7">Wendell Britt</small></figcaption></figure>
    ${ally ? `<p>You want to show up for other people. Allyship coaching is built on my book, for exactly that.</p>${link("https://masteringallyship.com/mastering-allyship/one-to-one", "Apply for allyship coaching")}` : ""}
    <p>${walk.reservations.length ? `You named ${walk.reservations.length === 1 ? "a reservation" : `${walk.reservations.length} reservations`}. That is the voice we work with: what it protects, and how to get it working for you.` : "One session, on video. Choose what fits your pocket; each opens Calendly in a new tab."}</p>
    <div class="opts two">${D.TIERS.map(t => link(t.href, t.price, "one session")).join("")}</div>
    ${n ? `<div class="row"><button type="button" data-act="copy">${state.copied ? "Copied. Paste it into Calendly’s notes box." : "Copy what you carried, for Calendly’s notes box"}</button></div>` : ""}`;
  if (id === "lectern") return `<h2>Mastering the Game of Allyship</h2>
    <p>The book the coaching grew from. Read it at your own pace, before or instead of a session.</p>${link(D.BOOK_HREF, "Get the book", "opens Gumroad in a new tab", "btn go")}`;
  if (id === "gate") return `<h2>Play the games while I build them</h2>
    <p>This walk is one of them. Patrons play each new game first, while I make it, and see how it gets made.</p>
    ${D.PATREON_HREF ? link(D.PATREON_HREF, "Join on Patreon", "opens Patreon in a new tab", "btn go") : `<p><b>The Patreon link goes here.</b> Wendell adds it before this walk goes live.</p>`}`;
  return "";
}
function showCard() {
  const id = state.near, key = id ? id + "|" + JSON.stringify(walk) + state.copied : "";
  const card = $("#card");
  if (state.focus) return;   // typing: the card stays as it is
  if (key === state.cardKey) return; state.cardKey = key;
  if (!id) { card.hidden = true; card.innerHTML = ""; return; }
  card.innerHTML = cardFor(id); card.hidden = false;
}
$("#card").addEventListener("focusin", e => { if (e.target.matches("input, textarea")) { state.focus = true; me.keys.clear(); } });
$("#card").addEventListener("focusout", e => { if (e.target.matches("input, textarea")) { state.focus = false;
  if (e.target.id === "own") { walk.experienceOwn = e.target.value; if (walk.experienceOwn.trim()) walk.experience = ""; applyWalk(); } } });
$("#card").addEventListener("input", e => { if (e.target.id === "own") walk.experienceOwn = e.target.value; if (e.target.id === "now") walk.now = e.target.value; if (e.target.id === "truth") walk.truth = e.target.value; save(); });
$("#card").addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const [act, ...rest] = b.dataset.act.split(":"), v = rest.join(":");
  if (act === "exp") { walk.experience = walk.experience === v ? "" : v; if (walk.experience) { walk.experienceOwn = ""; tell("exp", "The board you chose lights. The path turns toward the wood.", 5); } }
  else if (act === "tow") { walk.toward = toggle(walk.toward, v); if (walk.toward.length) tell("tow", "Your light goes ahead of you, into the trees.", 5); }
  else if (act === "where") walk.where = toggle(walk.where, v);
  else if (act === "feel") walk.feels = toggle(walk.feels, v);
  else if (act === "res") { const had = walk.reservations.includes(v); walk.reservations = toggle(walk.reservations, v); if (!had) tell("res", "Named, the thorn loosens and bows out of the way.", 5); }
  else if (act === "say") { const t = $("#" + v); if (t) walk[v] = t.value; state.focus = false; if (v === "now" && walk.now.trim()) tell("now", "Your words settle on the water.", 5); if (v === "truth" && walk.truth.trim()) tell("truth", "A light goes into the hollow and stays there.", 5); applyWalk(); state.cardKey = ""; walkTo(nextWay(v === "now" ? "pool" : "hollow")); return; }
  else if (act === "on") { state.focus = false; walkTo(nextWay(v)); return; }
  else if (act === "go") { const p = PLACES.find(x => x.id === v); if (p) walkTo(p); return; }
  else if (act === "copy") { const text = D.composeWalk(walk); (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => { state.copied = true; state.cardKey = ""; }).catch(() => { prompt("Copy what you carried:", text); }); return; }
  applyWalk(); state.cardKey = "";
});

/* ===================================================================================================
   The frame
   =================================================================================================== */
const clock = new THREE.Clock(); let T = 0;
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, clock.getDelta()); T += dt;
  tick(dt);
  renderer.render(scene, camera);
}
function tick(dt) {
  const moving = move(dt);
  me.pos.y = groundH(me.pos.x, me.pos.z);
  if (state.me) { state.me.holder.position.copy(me.pos); state.me.holder.rotation.y = me.yaw; state.me.update(dt, moving); }
  easeFx(dt);
  if (fx.fire && !REDUCED) { fx.fire.flames.forEach((f, i) => { f.scale.y = 0.85 + Math.sin(T * (7 + i) + i) * 0.18; }); fx.fire.light.intensity = 13 + Math.sin(T * 9) * 1.5 + Math.sin(T * 13.7) * 1.2; }
  for (const l of fx.lights) if (!REDUCED) { const y = Math.sin(T * 0.9 + l.q) * 0.08; l.g.position.y = l.base.y + y; l.core.position.y = l.base.y + y; }
  if (flies && !REDUCED) { const p = flies.geometry.attributes.position, b = flies.userData.base, sd = flies.userData.seed; for (let i = 0; i < p.count; i++) p.setY(i, b[i * 3 + 1] + Math.sin(T * 0.8 + sd[i] * 20) * 0.25); p.needsUpdate = true; }
  if (fx.poolWords && !REDUCED) fx.poolWords.position.y = groundH(WAY[2].at.x, WAY[2].at.z) + 0.75 + Math.sin(T * 0.7) * 0.05;
  // camera: behind and above you, turned by a drag; pulled in when it would sit inside the trees
  const off = V(Math.sin(camYaw) * Math.cos(camPitch), Math.sin(camPitch), Math.cos(camYaw) * Math.cos(camPitch)).multiplyScalar(camDist);
  if (intro.on) { intro.t += dt; if (!me.target || intro.t > 6) intro.settling = true;
    if (intro.settling) { let d = me.yaw + Math.PI - camYaw; d = Math.atan2(Math.sin(d), Math.cos(d)); camYaw += d * Math.min(1, dt * 1.4); if (Math.abs(d) < 0.01) intro.on = false; } }
  const base = me.pos.clone().add(V(0, 1.0, 0)); let t = 1;
  for (let i = 0; i < 10; i++) { const x = base.x + off.x * t, z = base.z + off.z * t; if (pd(x, z) < 2.3 || Math.hypot(x - CL.x, z - CL.z) < CL_R - 0.4) break; t *= 0.85; }
  const want = base.clone().addScaledVector(off, Math.max(0.35, t)); want.y = Math.max(want.y, groundH(want.x, want.z) + 0.6);
  camera.position.lerp(want, 1 - Math.exp(-dt * 6));
  camera.lookAt(me.pos.clone().add(V(0, 1.25, 0)));
  // the place you stand at, and its card
  const n = nearNow();
  if (n !== state.near) { state.near = n; if (n === "fire") tell("fire", "The fire is lit. The lights over it are what you carried in.", 6); }
  showCard();
  const cap = $("#caption");
  if (T > state.capUntil) { const c = state.captions.shift(); if (c) { cap.textContent = c.text; cap.classList.add("on"); state.capUntil = T + c.secs; } else cap.classList.remove("on"); }
}

(async function start() {
  try {
    await build();
    const at = Q.get("at"), p = at && PLACES.find(x => x.id === at);
    if (p) { me.pos.copy(p.stand).setY(0); const toward = p.at.clone().sub(p.stand); me.yaw = Math.atan2(toward.x, toward.z); camYaw = me.yaw + Math.PI + 0.45; intro.on = false; }
    if (intro.on) { me.target = CURVE.getPointAt(0.05); camYaw = 0.0; }   // you step onto the path, seen from in front
    camera.position.copy(me.pos).add(V(Math.sin(camYaw) * camDist, 2.2, Math.cos(camYaw) * camDist));
    $("#loading").classList.add("gone"); setTimeout(() => { $("#loading").hidden = true; }, 900);
    $("#hud").hidden = false;
    caption("A path into the forest. Six questions wait along it, and a fire at its end.", 6);
    caption("Tap the ground to walk. Drag to look around.", 5);
    window.__walk = { me, walk: () => walk, set: w => { walk = { ...D.EMPTY, ...w }; applyWalk(); state.cardKey = ""; }, at: id => { const q = PLACES.find(x => x.id === id); if (q) { me.pos.copy(q.stand).setY(0); me.target = null; const tw = q.at.clone().sub(q.stand); me.yaw = Math.atan2(tw.x, tw.z); intro.on = false; } },
      cam: (y, pch, dist) => { intro.on = false; camYaw = y; if (pch != null) camPitch = pch; if (dist != null) camDist = dist; }, yaw: () => me.yaw,
      settle: (n = 90) => { for (let i = 0; i < n; i++) { T += 1 / 30; tick(1 / 30); } renderer.render(scene, camera); }, near: () => state.near };
    $("#loadStep").textContent = "";
    if (Q.get("shot")) renderer.render(scene, camera);   // pictures: frames are drawn on demand by __walk.settle
    else frame();
  } catch (e) {
    console.error(e);
    step("The forest did not load on this device. The cards below hold the same walk.");
  }
})();
