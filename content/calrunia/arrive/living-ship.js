// /calrunia/arrive: the living ship, inside (Wendell's pick A on sd-still-pick, 2026-10-24; Still B on
// https://claude.ai/artifact/HqbQ5Y1qfX2HxyrHCmeRub; brief "Living ship build" in Six-faces-council
// council/callsheets/inner-vessel.md). You stand in the ship's dark ribbed chamber; through its round door is a world that should
// not fit inside: a garden island, the spirits' den, a bud where a new room grows and a band of land arching over the sky.
// Nothing is counted on screen (board sd-depth-rule). The island's size and light are the player's inner energy, the spirits
// they carry live on it, every ember from inner work has grown a chamber at its rim, and their cards hang by the den's door
// (ship-world.js turns the record into this world). The Kenney pirate ship, the dock and the grid panel are gone
// (sd-dock-scrapped).
// The passport arrives in the #p= fragment from Chapter 1's end (public/passport/arrive.js); ?demo=1 shows the Chapter 1 fixture
// and ?demo=grown a ship further along, neither one written to this device. ?at=island|den|bud starts you there.
// Tap or click where to walk; tap a spirit, the den or the bud to go to it. Drag turns the view, pinch or the wheel brings it
// nearer. Built into public/calrunia/arrive/ by scripts/build-calrunia-arrive.mjs; three.js 0.160 as in the Between.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const A = window.__calruniaArrive, G = window.__calruniaPassport, V = window.__oagVessel, SW = window.__calruniaShipWorld;
const check = window.__calruniaPassportCheck.validatePassport;
const state = window.__calruniaArrival = { status: "loading", errors: [], ready: false, frames: 0, model: null, bubble: null };

// ---- the passport ------------------------------------------------------------------------------------------------------
const params = new URLSearchParams(location.search), frag = A.decode(location.hash), demo = params.get("demo");
let incoming = null, shown, vessel = null;
if (frag.found) {
  if (frag.error) { state.status = "unreadable"; state.errors = [frag.error]; }
  else { const r = check(frag.value); if (r.ok) incoming = r.passport; else { state.status = "refused"; state.errors = r.errors; } }
}
if (incoming) {
  const stored = A.apply(incoming);
  state.status = "arrived";
  // The fragment has done its work; a reload reads the stores.
  if (stored) try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* the hash stays */ }
  shown = stored ? G.read() : incoming;
  vessel = stored && V ? V.store.get() : null;
} else if (demo === "1" || demo === "grown") {
  // A demo is shown, never written: it must not land in a real player's stores.
  const d = check(window.__calruniaDemoPassport);
  shown = d.ok ? d.passport : G.read();
  vessel = V ? V.blank(new Date().toISOString()) : { v: 1, fuel: 3, embers: [], parts: [] };
  if (demo === "grown") {
    shown = JSON.parse(JSON.stringify(shown));
    const at = "2026-10-24T00:00:00.000Z";
    shown.spirits.push(
      { id: "demo-ember-fox", name: "Ember Fox", element: "fire", family: "player", sittings: 5, born: { where: "the Cave of Lessons", at }, lineage: [], loadout: false, care: null },
      { id: "demo-moss", name: "Moss", element: "wood", family: "protector", sittings: 3, born: { where: "the Between", at }, lineage: [], loadout: false, care: null },
      { id: "demo-bell", name: "Bell", element: "metal", family: "skeptic", sittings: 8, born: { where: "the Cave of Lessons", at }, lineage: [], loadout: false, care: null });
    shown.vibeulons = 7;
    vessel.fuel = 9;
    vessel.embers = [["wave", "fire", "the knot before the call"], ["321", "water", "my sister's silence"], ["wave", "wood", "wanting to quit"], ["wave", "earth", "the rent"]]
      .map(([source, element, label], i) => ({ id: "demo-em-" + i, source, element, look: 0.5, state: "loose", at, label }));
  }
  state.status = "demo";
} else {
  shown = G.read();
  vessel = V ? V.store.get() : null;
  if (state.status === "loading") state.status = shown.spirits.length || shown.hand.length ? "returning" : "none";
}
state.shown = shown;
const world = SW.worldOf(shown, vessel);
state.world = { energy: +world.energy.toFixed(3), islandR: +world.islandR.toFixed(2), spirits: world.spirits.length, chambers: world.chambers.length, cards: world.cards.length, motes: world.motes };
const lead = world.spirits.find((s) => s.lead) || null;

const LINES = {
  arrived: "That blank card came aboard with us. What would you like it to hold, when you’re ready?",
  demo: "That blank card came aboard with us. What would you like it to hold, when you’re ready?",
  returning: "You’re back. Everything you brought is still here.",
  none: "You’ve come aboard without a passport. Chapter 1 sends one with you; the ship is yours all the same.",
  unreadable: "Your passport didn’t come through this link, so you’ve arrived with what this phone already holds. The ship is yours all the same.",
  refused: "Your passport didn’t come through this link, so you’ve arrived with what this phone already holds. The ship is yours all the same.",
};

// ---- page --------------------------------------------------------------------------------------------------------------
const rootEl = document.getElementById("arrive-root"), canvas = document.getElementById("arrive-scene");
const bubble = document.createElement("div"); bubble.className = "arr-bubble"; bubble.setAttribute("role", "status"); bubble.hidden = true; rootEl.appendChild(bubble);
const veil = document.createElement("div"); veil.className = "arr-veil"; rootEl.appendChild(veil);

// ---- renderer ----------------------------------------------------------------------------------------------------------
let seed = 11;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const R = (a, b) => a + (b - a) * rnd();
const damp = (k, dt) => 1 - Math.exp(-k * dt); // docs/3d-math.md rule 4
const PR = Math.min(window.devicePixelRatio || 1, 2) * 0.5; // half-res pixels, upscaled crisp, as in the stills

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(PR);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85 + 0.25 * world.light;
renderer.shadowMap.enabled = true;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xc99aae, 70, 760);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 3000);

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, metalness: 0, ...o });
const glow = (color, i = 2.5) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: i, flatShading: true });
function jitter(geo, a) { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + R(-a, a), p.getY(i) + R(-a, a), p.getZ(i) + R(-a, a)); geo.computeVertexNormals(); return geo; }
function add(geo, m, x, y, z, o = {}) {
  const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z);
  if (o.rx) mesh.rotation.x = o.rx; if (o.ry) mesh.rotation.y = o.ry; if (o.rz) mesh.rotation.z = o.rz; if (o.s) mesh.scale.set(...o.s);
  mesh.castShadow = !o.noShadow; mesh.receiveShadow = true; (o.parent || scene).add(mesh); return mesh;
}
const haloTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.45)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
function halo(color, x, y, z, s, op = 0.8, parent = scene) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); sp.position.set(x, y, z); sp.scale.set(s, s, 1); parent.add(sp); return sp; }

// ---- sky, ring, cloud sea ----------------------------------------------------------------------------------------------
{
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { lit: { value: world.light } },
    vertexShader: "varying vec3 vp; void main(){ vp = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }",
    fragmentShader: `uniform float lit; varying vec3 vp; void main(){ float h = vp.y;
      vec3 top = vec3(0.16,0.13,0.33), mid = vec3(0.55,0.36,0.58), low = vec3(0.98,0.68,0.50), hor = vec3(1.0,0.82,0.62);
      vec3 c = h > 0.25 ? mix(mid, top, smoothstep(0.25, 0.7, h)) : (h > 0.04 ? mix(low, mid, smoothstep(0.04, 0.25, h)) : mix(vec3(0.78,0.58,0.68), hor, smoothstep(-0.2, 0.04, h)));
      c *= 0.7 + 0.3 * lit;
      float sun = pow(max(dot(vp, normalize(vec3(-0.35,0.06,-1.0))),0.), 60.); c += vec3(1.,0.8,0.55)*sun*(0.4 + 0.6*lit);
      gl_FragColor = vec4(c,1.); }` });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), m));
  const sp = []; for (let i = 0; i < 400; i++) { const th = R(0, Math.PI * 2), ph = R(0.35, 1.4); sp.push(1400 * Math.cos(ph) * Math.cos(th), 1400 * Math.sin(ph), 1400 * Math.cos(ph) * Math.sin(th)); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xfff4e0, size: 2.5, sizeAttenuation: false, fog: false })));
}
scene.add(new THREE.HemisphereLight(0xb9a0d8, 0x3a2848, 0.55 + 0.45 * world.light));
const sun = new THREE.DirectionalLight(0xffc48a, 2.6 * (0.45 + 0.55 * world.light));
sun.position.set(-60, 30, -120); sun.target.position.set(0, 0, -18); sun.castShadow = true;
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 400 }); sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.05;
scene.add(sun, sun.target);
const fill = new THREE.DirectionalLight(0xe8a0c0, 0.6); fill.position.set(30, 20, 40); scene.add(fill);

// The world ring: land arching up behind the island, "a world inside the ship that could potentially end up bigger than this
// ship". Colour per vertex, in broad patches of meadow, forest, shore and sea, so it reads as land rather than a quilt.
{
  const ringR = 210, len = 150, geo = new THREE.CylinderGeometry(ringR, ringR, len, 160, 16, true);
  const p = geo.attributes.position, cols = [], c = new THREE.Color(), haze = new THREE.Color(0xe6b8b8);
  const TONES = [[-0.9, 0x5a7fc0], [-0.45, 0x6d9bc8], [-0.25, 0xd9c49e], [0.35, 0x7fae7e], [0.8, 0x557f62], [9, 0x8fb486]];
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), a = Math.atan2(p.getZ(i), p.getX(i));
    const v = Math.sin(a * 5 + y * 0.03) * 0.7 + Math.sin(a * 13 - y * 0.05) * 0.35 + Math.sin(a * 29 + y * 0.09) * 0.12;
    c.set(TONES.find(([at]) => v < at)[1]);
    if (Math.abs(y) > len * 0.44) c.set(0xc8a0c0); // rim walls
    c.lerp(haze, 0.3); cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  const ring = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false }));
  ring.rotation.x = Math.PI / 2 - 0.22; ring.rotation.z = 0.18; ring.position.set(-10, -70, -520); scene.add(ring);
  const veilM = new THREE.Mesh(new THREE.PlaneGeometry(1400, 500), new THREE.MeshBasicMaterial({ color: 0xf0b8a8, transparent: true, opacity: 0.2, fog: false, depthWrite: false }));
  veilM.position.set(0, 20, -480); scene.add(veilM);
}
{
  add(new THREE.PlaneGeometry(3000, 3000), mat(0xd6a3b8), 0, -14, -400, { rx: -Math.PI / 2, noShadow: true });
  for (let i = 0; i < 70; i++) { const x = R(-260, 260), z = R(-480, -40), s = R(6, 22); add(jitter(new THREE.IcosahedronGeometry(1, 0), 0.15), mat(i % 3 ? 0xe9bfc8 : 0xf6d2c0), x, -14 + s * 0.2, z, { s: [s * 1.6, s * 0.6, s], noShadow: true }); }
  // far islets: rough rock under a green cap
  [[-90, 18, -260, 7], [110, 30, -300, 9], [-160, 40, -380, 12], [60, 8, -180, 4]].forEach(([x, y, z, s]) => {
    add(jitter(new THREE.IcosahedronGeometry(s, 0), s * 0.12), mat(0x6c587e), x, y - s * 0.35, z, { s: [1, 0.8, 1], noShadow: true });
    add(jitter(new THREE.CylinderGeometry(s * 0.95, s * 0.9, s * 0.3, 8), s * 0.05), mat(0x7f9c80), x, y + s * 0.3, z, { noShadow: true });
  });
}

// ---- the island ----------------------------------------------------------------------------------------------------------
const IR = world.islandR, IC = new THREE.Vector3(0, -0.6, -21), TOP = -0.15; // island centre and its walking height
const island = new THREE.Group(); island.position.copy(IC); scene.add(island);
const walkMeshes = [], hitables = [];
const polar = (deg, r) => [Math.cos(deg * Math.PI / 180) * r, -Math.sin(deg * Math.PI / 180) * r]; // island-local x, z; 90 deg is the far side
add(jitter(new THREE.CylinderGeometry(IR, IR * 0.25, 9, 13, 3), 0.5), mat(0x5a456e), 0, -4.7, 0, { parent: island });
walkMeshes.push(add(jitter(new THREE.CylinderGeometry(IR + 0.3, IR, 0.9, 15, 1), 0.12), mat(0x6f9a74), 0, 0, 0, { parent: island }));
for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, r = R(3, IR * 0.7); add(new THREE.CylinderGeometry(0.12, 0.04, R(4, 9), 4), mat(0x3c2c4c), Math.cos(a) * r, -10, Math.sin(a) * r, { parent: island, noShadow: true }); }

// The den: the spirits' barn (Ari's ask, ba-barn-in-ship), its door facing the bridge.
const DEN = { x: 2.8, z: -2.4, ry: -0.35, r: 3.0 };
const den = new THREE.Group(); den.position.set(DEN.x, 0.4, DEN.z); den.rotation.y = DEN.ry; island.add(den);
{
  add(new THREE.BoxGeometry(5, 3.4, 4.2), mat(0xb0605a), 0, 1.7, 0, { parent: den });
  add(new THREE.CylinderGeometry(3.4, 3.4, 4.9, 3, 1), mat(0x8e4a52), 0, 4.335, 0, { parent: den, rx: -Math.PI / 2, s: [1, 1, 0.55] });
  add(new THREE.CylinderGeometry(3.0, 3.0, 4.95, 3, 1), mat(0xe8c9a8), 0, 4.15, 0, { parent: den, rx: -Math.PI / 2, s: [1, 1, 0.5] });
  add(new THREE.BoxGeometry(0.25, 3.4, 0.1), mat(0x7a4a3e), -2.4, 1.7, 2.12, { parent: den }); add(new THREE.BoxGeometry(0.25, 3.4, 0.1), mat(0x7a4a3e), 2.4, 1.7, 2.12, { parent: den });
  add(new THREE.CircleGeometry(0.55, 10), glow(0xffd08a, 2.2), 0, 4.3, 2.5, { parent: den, noShadow: true });
  add(new THREE.CylinderGeometry(1.0, 1.0, 0.2, 10, 1, false, 0, Math.PI), glow(0xffc070, 1.8), 0, 0.2, 2.12, { parent: den, rx: Math.PI / 2, rz: Math.PI / 2, noShadow: true });
  add(new THREE.BoxGeometry(0.9, 0.9, 0.1), glow(0xffd08a, 2.2), -1.6, 2.2, 2.12, { parent: den, noShadow: true });
  add(new THREE.BoxGeometry(0.9, 0.9, 0.1), glow(0xffd08a, 2.2), 1.6, 2.2, 2.12, { parent: den, noShadow: true });
  add(new THREE.BoxGeometry(0.1, 0.9, 0.9), glow(0xffd08a, 2.2), 2.52, 2.0, 0, { parent: den, noShadow: true });
  add(new THREE.CylinderGeometry(0.3, 0.3, 1.6, 6), mat(0x7a5a5a), -1.5, 5.0, -1.0, { parent: den });
  const l = new THREE.PointLight(0xffb060, 30, 14, 2); l.position.set(0, 1.5, 3.5); den.add(l);
  halo(0xffc070, 0, 1.2, 2.6, 4, 0.6, den);
}

// The cards from Chapter 1 hang on a board by the den's door, the blank one last, edged in the leading spirit's colour.
const board = new THREE.Group(); board.position.set(-3.6, 0, 3.0); board.rotation.y = 0.3; board.scale.setScalar(1.5); den.add(board);
{
  const n = world.cards.length + 1, w = Math.max(2.2, n * 0.78 + 0.3);
  add(new THREE.BoxGeometry(w, 1.25, 0.12), mat(0x6a4a3e), 0, 1.75, 0, { parent: board });
  [-w / 2 + 0.15, w / 2 - 0.15].forEach((x) => add(new THREE.BoxGeometry(0.14, 2.4, 0.14), mat(0x5a3d36), x, 1.2, -0.05, { parent: board }));
  const cardTex = (title, kind, blank) => {
    const c = document.createElement("canvas"); c.width = 192; c.height = 256; const g = c.getContext("2d");
    g.fillStyle = blank ? "#f6f2e8" : "#efe6d2"; g.fillRect(0, 0, 192, 256);
    g.strokeStyle = blank ? "#" + new THREE.Color(lead ? lead.glow : 0xfff0b0).getHexString() : kind === "bar" ? "#d4a017" : "#8e9aab"; g.lineWidth = blank ? 10 : 6; g.strokeRect(6, 6, 180, 244);
    if (!blank) {
      g.fillStyle = "#2a1e3a"; g.font = "600 22px ui-rounded, Nunito, system-ui, sans-serif"; g.textBaseline = "top";
      const words = title.split(/\s+/), lines = []; let line = "";
      words.forEach((wd) => { const t = line ? line + " " + wd : wd; if (g.measureText(t).width > 160 && line) { lines.push(line); line = wd; } else line = t; });
      if (line) lines.push(line); lines.slice(0, 7).forEach((t, i) => g.fillText(t, 16, 22 + i * 28));
    }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
  };
  [...world.cards, { id: "blank", blank: true }].forEach((card, i) => {
    const m = new THREE.MeshStandardMaterial({ map: cardTex(card.title || "", card.kind, card.blank), roughness: 0.7, emissive: 0xffffff, emissiveMap: null, emissiveIntensity: card.blank ? 0.12 : 0.05 });
    add(new THREE.PlaneGeometry(0.6, 0.8), m, -w / 2 + 0.55 + i * 0.78, 1.75, 0.08, { parent: board, noShadow: true, rz: R(-0.05, 0.05) });
  });
  if (lead) halo(lead.glow, -w / 2 + 0.55 + world.cards.length * 0.78, 1.75, 0.2, 1.6, 0.5, board);
}

// The garden: lit blossoms are the island's light.
{
  let lit = world.blossoms;
  for (let r = 0; r < 4; r++) {
    add(new THREE.BoxGeometry(3.9, 0.35, 0.7), mat(0x6a4a3e), -3.75, 0.55, 0.3 + r * 1.05, { parent: island });
    for (let k = 0; k < 6; k++) {
      add(new THREE.ConeGeometry(0.2, 0.55, 4), mat(0x8fbf7a), -5.4 + k * 0.66, 0.98, 0.3 + r * 1.05, { parent: island });
      if (((k + r) % 2 === 0 || lit > 12) && lit-- > 0) add(new THREE.IcosahedronGeometry(0.12, 0), glow([0xffd27a, 0x9ff6e4, 0xffa8c8][(k + r) % 3], 3), -5.4 + k * 0.66, 1.36, 0.3 + r * 1.05, { parent: island, noShadow: true });
    }
  }
}
// Trees fill out as the island grows, kept off the bridge's landing and the garden.
for (let i = 0, placed = 0; placed < world.trees && i < 60; i++) {
  const deg = R(0, 360), r = R(0.55, 0.85) * IR, [x, z] = polar(deg, r);
  if (z > IR * 0.2 && Math.abs(x) < 6) continue; // the landing, kept open so the view from the stones is clear
  if (x < -1.2 && x > -6.5 && z > -0.8 && z < 4.2) continue; // the garden
  if (Math.hypot(x - DEN.x, z - DEN.z) < DEN.r + 1.2) continue;
  if (Math.hypot(x - polar(165, IR - 2.2)[0], z - polar(165, IR - 2.2)[1]) < 3) continue; // the bud
  const s = R(1.4, 2.4);
  add(new THREE.CylinderGeometry(0.18 * s, 0.25 * s, 2 * s, 5), mat(0x5a3d36), x, s, z, { parent: island });
  add(jitter(new THREE.IcosahedronGeometry(1.25 * s, 0), 0.15 * s), mat([0x5f8f6f, 0x7aa37a, 0x4f7f74, 0x8aa86a][placed % 4]), x, 2.4 * s, z, { parent: island });
  placed++;
}
// Stones across the island from the landing to the den.
for (let k = 0; k < 7; k++) { const t = k / 6; add(jitter(new THREE.CylinderGeometry(0.75, 0.8, 0.25, 6), 0.05), mat(0xd9c3a8), DEN.x * t * 0.6 + Math.sin(t * 3) * 0.6, 0.5, (IR - 1) * (1 - t) + (DEN.z + 3.6) * t, { parent: island }); }

// The bud: where the next room grows. Grown chambers ring the far rim, one for each ember of inner work.
const obstacles = [{ x: DEN.x, z: DEN.z, r: DEN.r }];
const BUD = (() => { const [x, z] = polar(165, IR - 2.2); return { x, z }; })();
const bud = new THREE.Group(); bud.position.set(BUD.x, 0.5, BUD.z); island.add(bud);
const petals = [];
{
  add(new THREE.IcosahedronGeometry(1.0, 0), glow(0xfff0b0, 3.2), 0, 1.4, 0, { parent: bud, noShadow: true });
  for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; const p = add(new THREE.ConeGeometry(1.0, 3.4, 4), mat(0x8a6aa8), Math.cos(a) * 0.9, 1.6, Math.sin(a) * 0.9, { parent: bud }); p.userData.a = a; petals.push(p); }
  const lattice = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 1), new THREE.MeshBasicMaterial({ color: 0x9ff6e4, wireframe: true, transparent: true, opacity: 0.55 }));
  lattice.position.set(0, 2.4, 0); lattice.scale.set(1, 0.8, 1); bud.add(lattice); bud.userData.lattice = lattice;
  halo(0xfff0b0, 0, 1.8, 0, 7, 0.9, bud);
  const l = new THREE.PointLight(0xffe6a0, 25, 12, 2); l.position.set(0, 2, 0); bud.add(l);
  obstacles.push({ x: BUD.x, z: BUD.z, r: 1.9 });
}
const chambers = world.chambers.map((ch, i) => {
  const n = world.chambers.length, deg = n === 1 ? 90 : 140 - i * 120 / (n - 1); // across the far rim
  const [x, z] = polar(deg, IR - 1.6), g = new THREE.Group(); g.position.set(x, 0.4, z); g.rotation.y = Math.atan2(-x, -z) + Math.PI; island.add(g);
  add(jitter(new THREE.IcosahedronGeometry(1.5, 1), 0.08), mat(0x6e4f86), 0, 1.5, 0, { parent: g, s: [1, 1.35, 1] });
  add(new THREE.CircleGeometry(0.45, 10), glow(ch.glow, 2.4), 0, 1.7, 1.42, { parent: g, noShadow: true });
  add(new THREE.ConeGeometry(0.35, 0.9, 5), mat(0x8a6aa8), 0, 3.6, 0, { parent: g });
  halo(ch.glow, 0, 1.7, 1.6, 2.4, 0.6, g);
  obstacles.push({ x, z, r: 1.7 });
  return { group: g, ch, x, z };
});
// Vibeulons, condensed qi, drift over the garden as gold motes.
const motes = [];
for (let i = 0; i < world.motes; i++) { const m = add(new THREE.OctahedronGeometry(0.11, 0), glow(0xffd27a, 3.4), -3.8 + R(-1.6, 1.6), R(2.2, 3.4), 1.8 + R(-1.4, 1.4), { parent: island, noShadow: true }); m.userData.y = m.position.y; m.userData.p = R(0, 6); motes.push(m); }

// ---- the bridge of stones from the door to the island ----------------------------------------------------------------------
const EDGE = IC.z + IR - 0.4, BRIDGE_Y = 0.05;
const pathX = (z) => 0.8 * Math.sin((3 - z) * 0.3);
const stones = [];
for (let z = 3; z > EDGE; z -= 2.0) {
  walkMeshes.push(add(jitter(new THREE.CylinderGeometry(0.95, 0.35, 0.6, 6), 0.06), mat(0xb8a090), pathX(z), BRIDGE_Y - 0.3, z));
  stones.push({ x: pathX(z), z });
  add(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 4), glow(0x9ff6e4, 3), pathX(z) + 0.55, BRIDGE_Y + 0.03, z, { noShadow: true });
}

// ---- the chamber: the ship's ribbed inner wall and round door ----------------------------------------------------------------
const ZW = 4.5, FLOOR_Y = -0.4;
{
  const doorR = 4.2, cy = 3.6;
  const shape = new THREE.Shape(); shape.moveTo(-40, -6); shape.lineTo(40, -6); shape.lineTo(40, 30); shape.lineTo(-40, 30); shape.lineTo(-40, -6);
  const hole = new THREE.Path(); hole.absarc(0, cy, doorR, 0, Math.PI * 2, true); shape.holes.push(hole);
  add(new THREE.ExtrudeGeometry(shape, { depth: 0.8, bevelEnabled: false, curveSegments: 24 }), mat(0x3e2f58), 0, 0, ZW);
  add(new THREE.TorusGeometry(doorR + 0.25, 0.55, 6, 28), mat(0x6e4f86), 0, cy, ZW + 0.85, { noShadow: true });
  add(new THREE.TorusGeometry(doorR + 0.85, 0.08, 4, 40), glow(0x9ff6e4, 2.2), 0, cy, ZW + 1.25, { noShadow: true });
  add(new THREE.TorusGeometry(doorR - 0.2, 0.06, 4, 40), glow(0xffcf8a, 2.0), 0, cy, ZW + 0.6, { noShadow: true });
  for (let k = 0; k < 3; k++) add(jitter(new THREE.TorusGeometry(8.5 + k * 0.6, 0.55, 5, 16, Math.PI), 0.08), mat(0x2e2244), 0, -0.5, ZW + 2.0 + k * 2.6, { noShadow: true });
  walkMeshes.push(add(new THREE.BoxGeometry(18, 0.4, 14), mat(0x2a1e3a, { roughness: 1 }), 0, FLOOR_Y - 0.2, ZW + 7, { noShadow: true }));
  add(new THREE.CylinderGeometry(2.4, 2.6, 0.3, 10, 1, false, 0, Math.PI), mat(0x8a6a7a), 0, -0.3, ZW + 0.9, { ry: Math.PI / 2, noShadow: true });
  [[-6.2, 4.2], [6.2, 4.2]].forEach(([x, y]) => {
    add(new THREE.IcosahedronGeometry(0.35, 1), glow(0xffc070, 1.4), x, y, ZW + 1.2, { noShadow: true });
    halo(0xffb060, x, y, ZW + 1.4, 3, 0.7);
    const l = new THREE.PointLight(0xffb060, 6, 7, 2); l.position.set(x, y, ZW + 1.6); scene.add(l);
  });
  // the world's light spills through the door onto the floor, soft-edged
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(7, 11), new THREE.MeshBasicMaterial({ map: haloTex, color: 0xffc89a, transparent: true, opacity: 0.35 * world.light + 0.1, blending: THREE.AdditiveBlending, depthWrite: false }));
  spill.rotation.x = -Math.PI / 2; spill.position.set(0, FLOOR_Y + 0.02, ZW + 4.8); scene.add(spill);
}

// ---- spirits ---------------------------------------------------------------------------------------------------------------
// Small round creatures with ears and a tail of light (the art director's fix on Still B: never a waypoint diamond).
function makeSpirit(sp) {
  const g = new THREE.Group(), s = sp.size, color = sp.glow;
  const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.1, flatShading: true, transparent: true, opacity: 0.92 });
  add(new THREE.IcosahedronGeometry(0.42 * s, 1), m, 0, 0, 0, { parent: g, s: [1.25, 0.9, 1], noShadow: true });
  add(new THREE.IcosahedronGeometry(0.3 * s, 1), m, 0.45 * s, 0.35 * s, 0.1 * s, { parent: g, noShadow: true });
  add(new THREE.ConeGeometry(0.1 * s, 0.28 * s, 4), m, 0.38 * s, 0.68 * s, 0.1 * s, { parent: g, rz: 0.25, noShadow: true });
  add(new THREE.ConeGeometry(0.1 * s, 0.28 * s, 4), m, 0.58 * s, 0.66 * s, 0.1 * s, { parent: g, rz: -0.25, noShadow: true });
  const tail = [[-0.55, 0.1, 0.22], [-0.85, 0.28, 0.15], [-1.1, 0.5, 0.1]].map(([x, y, r]) => add(new THREE.IcosahedronGeometry(r * s, 0), m, x * s, y * s, 0, { parent: g, noShadow: true }));
  halo(color, 0, 0.1, 0, 2.6 * s, 0.45, g);
  g.add(new THREE.PointLight(color, 8 * s, 6 * s, 2));
  const hit = new THREE.Mesh(new THREE.SphereGeometry(1.1 * s, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); g.add(hit);
  scene.add(g);
  return { g, sp, tail, hit, pos: new THREE.Vector3(), to: new THREE.Vector3(), phase: R(0, 6) };
}
// Where the island's spirits spend their time, in island-local x, z: the garden, the den's door, the bud and the chambers.
const HAUNTS = [
  { x: -3.6, z: 1.6, says: "I’m tending the garden." }, { x: -2.2, z: 3.2, says: "I’m tending the garden." },
  { x: DEN.x + 2.4, z: DEN.z + 2.6, says: "I’m resting by the den." }, { x: BUD.x + 1.9, z: BUD.z + 1.2, says: "I’m keeping the new room warm." },
  ...chambers.map((c) => ({ x: c.x * 0.8, z: c.z * 0.8, says: "I came to see the room that grew." })),
];
const spirits = world.spirits.map((sp, i) => {
  const S = makeSpirit(sp);
  if (sp.lead) { S.pos.set(0.4, 1.0, -5.5); S.mode = "wait"; }
  else { const h = HAUNTS[(i - 1) % HAUNTS.length]; S.haunt = h; S.pos.set(IC.x + h.x + R(-0.6, 0.6), 1.4, IC.z + h.z + R(-0.6, 0.6)); S.to.copy(S.pos); S.mode = "dwell"; S.next = R(2, 7); }
  S.g.position.copy(S.pos);
  hitables.push({ obj: S.hit, kind: "spirit", S });
  return S;
});
const leader = spirits.find((S) => S.sp.lead) || null;

// ---- the player ----------------------------------------------------------------------------------------------------------
const player = { group: new THREE.Group(), pos: new THREE.Vector3(-1.1, FLOOR_Y, 8.0), route: [], mixer: null, acts: {}, walking: false, then: null };
player.group.position.copy(player.pos); player.group.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI); scene.add(player.group);
const START = { island: [0.5, IC.z + IR - 2.5], den: [IC.x + DEN.x - 1.2, IC.z + DEN.z + 3.8], bud: [IC.x + BUD.x + 2.4, IC.z + BUD.z + 2.2] }[params.get("at")];
if (START) { player.pos.set(START[0], TOP, START[1]); player.group.position.copy(player.pos); }
new GLTFLoader().loadAsync("/between/m/player.glb").then((g) => {
  const obj = g.scene; obj.updateMatrixWorld(true);
  const box = new THREE.Box3(); obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; if (o.isSkinnedMesh) { o.computeBoundingBox(); box.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld)); } else box.expandByObject(o); } });
  const k = 1.75 / Math.max(box.max.y - box.min.y, 0.01); obj.scale.setScalar(k); obj.position.y = -box.min.y * k;
  player.group.add(obj);
  player.mixer = new THREE.AnimationMixer(obj);
  for (const n of ["Walk", "Idle"]) { const c = g.animations.find((a) => a.name === n); if (c) player.acts[n] = player.mixer.clipAction(c); }
  if (player.acts.Idle) player.acts.Idle.play();
  state.model = "player.glb";
}).catch((e) => {
  // a figure of light stands in, so the page still works
  add(new THREE.CapsuleGeometry(0.28, 1.1, 4, 8), glow(0xf2ede4, 0.6), 0, 0.85, 0, { parent: player.group });
  state.model = "fallback: " + e.message;
});
function setWalking(w) {
  if (w === player.walking) return; player.walking = w; const { Walk, Idle } = player.acts;
  if (!Walk) return;
  if (w) { Walk.reset().fadeIn(0.2).play(); if (Idle) Idle.fadeOut(0.2); } else { Walk.fadeOut(0.3); if (Idle) Idle.reset().fadeIn(0.3).play(); }
}

// ---- where you can walk ----------------------------------------------------------------------------------------------------
// Three places joined in a line: the chamber, the bridge of stones, the island. A walk from one to another goes by the door and
// the stones, so you never step off into the clouds.
function regionOf(x, z) {
  if (z > ZW - 0.2) return 0;
  if (Math.hypot(x - IC.x, z - IC.z) < IR - 0.7) return 2;
  return 1;
}
function walkable(x, z) {
  const r = regionOf(x, z);
  if (r === 0) return z < ZW + 11 && Math.abs(x) < (z < ZW + 1.2 ? 1.2 : 6.5);
  if (r === 1) return z >= EDGE - 1.6 && z <= ZW && Math.abs(x - pathX(z)) < 1.1;
  return !obstacles.some((o) => Math.hypot(x - IC.x - o.x, z - IC.z - o.z) < o.r);
}
const heightAt = (x, z) => [FLOOR_Y, BRIDGE_Y, TOP][regionOf(x, z)];
function routeTo(x, z) {
  const from = regionOf(player.pos.x, player.pos.z), to = regionOf(x, z), pts = [];
  const door = { x: 0, z: ZW - 0.4 }, landing = { x: pathX(EDGE), z: EDGE - 0.9 };
  const across = (dir) => (dir > 0 ? stones : [...stones].reverse()).forEach((s) => pts.push(s));
  if (from === 0 && to > 0) { pts.push({ x: 0, z: ZW + 0.8 }, door); if (to === 2) { across(1); pts.push(landing); } }
  else if (from === 2 && to < 2) { pts.push(landing); if (to === 0) { across(-1); pts.push(door, { x: 0, z: ZW + 0.8 }); } }
  else if (from === 1 && to === 2) { across(1); pts.push(landing); }
  else if (from === 1 && to === 0) { across(-1); pts.push(door, { x: 0, z: ZW + 0.8 }); }
  // on the bridge, keep only the stones still ahead
  if (from === 1) { const ahead = to === 2 ? (s) => s.z < player.pos.z - 0.2 : (s) => s.z > player.pos.z + 0.2; for (let i = pts.length - 1; i >= 0; i--) if (stones.includes(pts[i]) && !ahead(pts[i])) pts.splice(i, 1); }
  pts.push({ x, z });
  player.route = pts;
}

// ---- talk ------------------------------------------------------------------------------------------------------------------
let speaker = null;
function say(who, name, text, link) {
  speaker = who; bubble.hidden = false; bubble.textContent = "";
  if (name) { const b = document.createElement("b"); b.textContent = name; bubble.appendChild(b); }
  bubble.appendChild(document.createTextNode(text));
  if (link) { const a = document.createElement("a"); a.href = link.href; a.textContent = link.text; bubble.appendChild(a); }
  state.bubble = text;
}
function hush() { bubble.hidden = true; speaker = null; state.bubble = null; }
const leadName = lead ? lead.name || "Your spirit" : null;
const ACTS = {
  den() {
    focus = "den";
    const text = world.cards.length ? "Your cards are pinned here, and the blank one beside them. It can wait until you know what it holds." : "The blank card is pinned here. It can wait until you know what it holds.";
    say(leader ? leader.pos : denAnchor(), leadName, text);
  },
  bud() {
    budOpen = 1;
    say(leader ? leader.pos : budAnchor(), leadName, "Something is growing here. Each time you work a feeling all the way through in the WAVE room, a new room opens.", { href: "/ontology-game/cave", text: "Go to the WAVE room" });
  },
  chamber(c) { say(c.group.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 2.2, 0)), leadName, c.ch.label ? "This room grew from “" + c.ch.label + "”." : "This room grew from something you worked through."); },
  spirit(S) {
    if (S === leader) { say(S.pos, leadName, LINES[state.status] || LINES.returning); return; }
    say(S.pos, S.sp.name, S.haunt ? S.haunt.says : "I live here now.");
  },
};
const denAnchor = () => den.localToWorld(new THREE.Vector3(0, 4, 2.4));
const budAnchor = () => bud.localToWorld(new THREE.Vector3(0, 4, 0));
hitables.push({ obj: den, kind: "den" }, { obj: board, kind: "den" }, { obj: bud, kind: "bud" }, ...chambers.map((c) => ({ obj: c.group, kind: "chamber", c })));
const standFor = {
  den: () => [IC.x + DEN.x - 1.2, IC.z + DEN.z + 3.8],
  bud: () => [IC.x + BUD.x + 2.4, IC.z + BUD.z + 2.2],
  chamber: (h) => { const d = Math.hypot(h.c.x, h.c.z); return [IC.x + h.c.x * (d - 2.6) / d, IC.z + h.c.z * (d - 2.6) / d]; },
};
let focus = null, budOpen = 0, pendingAct = null;

// ---- input: tap to walk, drag to turn, pinch or wheel to come nearer ------------------------------------------------------
const view = { yaw: 0, pitch: 0.2, zoom: 1 };
const ptrs = new Map(); let drag = null, pinch = null;
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function tap(cx, cy) {
  const rect = canvas.getBoundingClientRect();
  ndc.set((cx - rect.left) / rect.width * 2 - 1, -(cy - rect.top) / rect.height * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(hitables.map((h) => h.obj), true)[0];
  if (hit) {
    const h = hitables.find((x) => { let o = hit.object; while (o) { if (o === x.obj) return true; o = o.parent; } return false; });
    if (h.kind === "spirit") { const p = h.S.pos; routeNear(p.x, p.z); pendingAct = () => ACTS.spirit(h.S); return; }
    const [sx, sz] = standFor[h.kind](h); routeTo(sx, sz); pendingAct = () => ACTS[h.kind](h.c); focus = null; hush(); return;
  }
  const g = ray.intersectObjects(walkMeshes, false)[0];
  if (!g) return;
  hush(); focus = null; pendingAct = null;
  let { x, z } = g.point;
  if (!walkable(x, z)) { const r = regionOf(x, z); if (r === 1) x = pathX(z); else if (r === 2) { const o = nearestFree(x, z); if (!o) return; x = o.x; z = o.z; } else return; }
  routeTo(x, z);
  state.tapped = { x: +x.toFixed(2), z: +z.toFixed(2) };
}
function nearestFree(x, z) { for (let r = 0.3; r < 4; r += 0.3) for (let a = 0; a < 6.28; a += 0.4) { const nx = x + Math.cos(a) * r, nz = z + Math.sin(a) * r; if (walkable(nx, nz)) return { x: nx, z: nz }; } return null; }
function routeNear(x, z) { const dx = player.pos.x - x, dz = player.pos.z - z, d = Math.hypot(dx, dz) || 1; let tx = x + dx / d * 1.4, tz = z + dz / d * 1.4; if (!walkable(tx, tz)) { const o = nearestFree(tx, tz); if (o) { tx = o.x; tz = o.z; } } routeTo(tx, tz); hush(); focus = null; }
canvas.addEventListener("pointerdown", (e) => {
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY });
  if (ptrs.size === 1) drag = { x: e.clientX, y: e.clientY, moved: 0 }; else { drag = null; const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: view.zoom }; }
});
canvas.addEventListener("pointermove", (e) => {
  const p = ptrs.get(e.pointerId); if (!p) return; p.x = e.clientX; p.y = e.clientY;
  if (pinch && ptrs.size >= 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch.d > 0) view.zoom = Math.min(1.6, Math.max(0.5, pinch.z * pinch.d / d)); return; }
  if (!drag) return;
  drag.moved += Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y);
  if (drag.moved > 8) { view.yaw -= (e.clientX - drag.x) * 0.006; view.pitch = Math.min(0.9, Math.max(0.02, view.pitch + (e.clientY - drag.y) * 0.003)); state.turned = true; }
  drag.x = e.clientX; drag.y = e.clientY;
});
const up = (e) => {
  const p = ptrs.get(e.pointerId); ptrs.delete(e.pointerId);
  if (e.type === "pointerup" && p && drag && drag.moved <= 8 && !pinch) tap(e.clientX, e.clientY);
  if (ptrs.size < 2) pinch = null;
  drag = ptrs.size === 1 ? (() => { const q = [...ptrs.values()][0]; return { x: q.x, y: q.y, moved: 99 }; })() : null;
};
canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
canvas.addEventListener("wheel", (e) => { e.preventDefault(); view.zoom = Math.min(1.6, Math.max(0.5, view.zoom * Math.exp(e.deltaY * 0.0015))); }, { passive: false });
["touchstart", "touchmove"].forEach((n) => canvas.addEventListener(n, (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false }));
bubble.addEventListener("pointerdown", (e) => { if (e.target.tagName !== "A") hush(); });

// ---- camera: behind the player, framed by the narrower angle (docs/3d-math.md rule 6) ------------------------------------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.26, 0.4, 0.95); composer.addPass(bloom);
composer.addPass(new OutputPass());
function frameDistance(r) {
  const v = camera.fov * Math.PI / 180, h = 2 * Math.atan(Math.tan(v / 2) * camera.aspect);
  return r / Math.sin(Math.min(v, h) / 2);
}
function size() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); composer.setPixelRatio(PR); composer.setSize(w, h);
  camera.aspect = w / h; camera.fov = w < h ? 64 : 50; camera.updateProjectionMatrix();
}
addEventListener("resize", size); size();
const camRay = new THREE.Raycaster(), tmpHead = new THREE.Vector3(), camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), wantPos = new THREE.Vector3(), wantLook = new THREE.Vector3();
function aimCamera(dt, snap) {
  const P = player.group.position;
  if (focus === "den") {
    const c = board.localToWorld(new THREE.Vector3(0, 1.6, 0)), n = board.localToWorld(new THREE.Vector3(0, 1.6, 1)).sub(c).normalize();
    const d = Math.min(7, Math.max(4.5, frameDistance(1.9))) * view.zoom;
    wantLook.copy(c); wantPos.copy(c).addScaledVector(n, d).add(new THREE.Vector3(0.6, 1.0, 0));
  } else {
    const d = Math.min(8.5, Math.max(5.5, frameDistance(2.2))) * view.zoom, sy = Math.sin(view.yaw), cyw = Math.cos(view.yaw);
    wantPos.set(P.x + sy * d * Math.cos(view.pitch), P.y + 1.2 + d * Math.sin(view.pitch), P.z + cyw * d * Math.cos(view.pitch));
    wantLook.set(P.x - sy * 5, P.y + 1.6, P.z - cyw * 5);
  }
  // keep the view clear: a tree, the den or a chamber between you and the camera pulls the camera in front of it
  const head = focus ? wantLook : tmpHead.copy(P).add(new THREE.Vector3(0, 1.4, 0)), toCam = wantPos.clone().sub(head), far = toCam.length();
  camRay.set(head, toCam.normalize()); camRay.far = far; camRay.camera = camera; // sprites (halos) need the camera to be hit-tested
  const block = camRay.intersectObject(island, true).find((h) => h.object.isMesh && !h.object.isSprite && h.object.material.visible !== false && !walkMeshes.includes(h.object));
  if (block) wantPos.copy(head).addScaledVector(toCam, Math.max(1.2, block.distance - 0.4));
  const k = snap ? 1 : damp(4, dt); camPos.lerp(wantPos, k); camLook.lerp(wantLook, k);
  camera.position.copy(camPos); camera.lookAt(camLook);
}

// ---- the first minute: the spirit comes to the door, speaks, then leads you over the stones -----------------------------
const clock = new THREE.Clock(); let t = 0;
const UP = new THREE.Vector3(0, 1, 0), qWant = new THREE.Quaternion(), tmp = new THREE.Vector3();
function moveToward(pos, to, speed, dt) { tmp.subVectors(to, pos); const d = tmp.length(); if (d < 1e-3) return 0; pos.addScaledVector(tmp, Math.min(1, speed * dt / d)); return d; }
function faceGroup(g, dx, dz, dt, rate = 8, off = 0) { if (Math.abs(dx) + Math.abs(dz) < 1e-4) return; qWant.setFromAxisAngle(UP, Math.atan2(dx, dz) + off); g.quaternion.rotateTowards(qWant, rate * dt); }
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, clock.getDelta()); t += dt;
  // player
  if (player.route.length) {
    const w = player.route[0], dx = w.x - player.pos.x, dz = w.z - player.pos.z, d = Math.hypot(dx, dz), step = 2.6 * dt;
    if (d <= step) { player.pos.x = w.x; player.pos.z = w.z; player.route.shift(); }
    else {
      const nx = player.pos.x + dx / d * step, nz = player.pos.z + dz / d * step;
      if (walkable(nx, nz) || regionOf(nx, nz) !== regionOf(player.pos.x, player.pos.z)) { player.pos.x = nx; player.pos.z = nz; }
      else if (walkable(nx, player.pos.z)) player.pos.x = nx; else if (walkable(player.pos.x, nz)) player.pos.z = nz; else { player.route = []; pendingAct = null; } // blocked: stop, say nothing
      faceGroup(player.group, dx, dz, dt);
    }
    setWalking(true);
    if (!player.route.length) { setWalking(false); if (pendingAct) { const a = pendingAct; pendingAct = null; a(); } }
  }
  player.pos.y += (heightAt(player.pos.x, player.pos.z) - player.pos.y) * damp(12, dt);
  player.group.position.copy(player.pos);
  if (player.mixer) player.mixer.update(dt);
  // the leading spirit
  if (leader) {
    const P = player.pos;
    if (leader.mode === "wait" && t > 1.0) { leader.mode = "come"; leader.to.set(0.9, 1.1, ZW - 1.4); if (START) { leader.mode = "follow"; leader.pos.set(P.x + 1.4, 1.2, P.z - 1); } }
    if (leader.mode === "come" && moveToward(leader.pos, leader.to, 3.2, dt) < 0.05) { leader.mode = "greet"; if (!speaker) say(leader.pos, leadName, LINES[state.status] || LINES.returning); }
    if (leader.mode === "greet" && (player.route.length || (state.bubble === null && t > 4))) leader.mode = "follow";
    if (leader.mode === "follow") {
      // a step ahead of you on the way you are walking, else at your side
      const next = player.route[player.route.length > 1 ? 1 : 0];
      if (next) leader.to.set(next.x + 0.9, heightAt(next.x, next.z) + 1.3, next.z); else leader.to.set(P.x + 1.2, P.y + 1.4, P.z - 0.8);
      moveToward(leader.pos, leader.to, player.route.length ? 3.0 : 1.6, dt);
    }
    leader.g.position.set(leader.pos.x, leader.pos.y + Math.sin(t * 2.2) * 0.08, leader.pos.z);
    tmp.subVectors(P, leader.pos); faceGroup(leader.g, tmp.x, tmp.z, dt, 4, -Math.PI / 2); // the head is on +x
  }
  // the island's spirits drift between their haunts
  spirits.forEach((S, i) => {
    S.tail.forEach((m, k) => { m.position.z = Math.sin(t * 3 + k + S.phase) * 0.08 * (k + 1); });
    if (S === leader) return;
    S.next -= dt;
    if (S.next < 0) { const h = HAUNTS[Math.floor(R(0, HAUNTS.length))]; S.haunt = h; S.to.set(IC.x + h.x + R(-0.8, 0.8), 1.4, IC.z + h.z + R(-0.8, 0.8)); S.next = R(6, 14); }
    const d = moveToward(S.pos, S.to, 0.9, dt);
    S.g.position.set(S.pos.x, S.pos.y + Math.sin(t * 2 + S.phase) * 0.1, S.pos.z);
    if (d > 0.1) faceGroup(S.g, S.to.x - S.pos.x, S.to.z - S.pos.z, dt, 2, -Math.PI / 2);
  });
  // the bud breathes, and opens a little when you come to it; motes drift
  bud.userData.lattice.rotation.y += dt * 0.15;
  const open = 0.55 + 0.25 * budOpen + Math.sin(t * 1.3) * 0.04;
  petals.forEach((p) => p.rotation.set(Math.sin(p.userData.a) * open, 0, -Math.cos(p.userData.a) * open));
  motes.forEach((m) => { m.position.y = m.userData.y + Math.sin(t * 1.1 + m.userData.p) * 0.25; m.rotation.y += dt; });
  // walking away ends a conversation
  if (speaker && !pendingAct && speaker.distanceTo(player.pos) > 7 && player.route.length) hush();
  if (focus && player.route.length) focus = null;
  aimCamera(dt, state.frames === 0);
  if (speaker && !bubble.hidden) {
    tmp.copy(speaker).add(new THREE.Vector3(0, 0.9, 0)).project(camera);
    const x = (tmp.x + 1) / 2 * innerWidth, y = (1 - tmp.y) / 2 * innerHeight, bw = bubble.offsetWidth, bh = bubble.offsetHeight;
    bubble.style.transform = `translate(${Math.max(12, Math.min(innerWidth - bw - 12, x - bw / 2))}px, ${Math.max(12, Math.min(innerHeight - bh - 12, y - bh - 10))}px)`;
  }
  composer.render();
  if (++state.frames === 2) { veil.classList.add("gone"); state.ready = true; }
  state.player = { x: +player.pos.x.toFixed(2), z: +player.pos.z.toFixed(2), region: ["chamber", "bridge", "island"][regionOf(player.pos.x, player.pos.z)], walking: player.walking };
  state.focus = focus; state.leader = leader ? leader.mode : null;
}
// For checks and skip-ahead links: walk to a named place as a tap there would.
state.go = (where) => { const h = hitables.find((x) => x.kind === where); if (!h) return false; const [sx, sz] = standFor[where](h); routeTo(sx, sz); pendingAct = () => ACTS[where](h.c); return true; };
frame();
