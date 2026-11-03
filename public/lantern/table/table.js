/* The lantern table (bars-engine .specify/specs/lantern-table/spec.md; tasks T006 to T010).
   Ported from six-faces-council's ad2 dir B still (council/callsheets/stills/2026-11-02-lantern-intake-ad2/make/scene.html,
   "Twist and switch", his pick on lh-intake-look-1) into a scene you play: table B in the Between's Dusk hollow
   (buildHollow, paperLantern, the Average Dusk walker from wardrobe.js), with a brass machine on the table for the
   intake and the board itself for the play. Every control is an object on the table: there is no card, chip, tray or
   panel. The rules are engine.js, built from src/lib/lantern/engine.ts by scripts/build-lantern-engine.mjs.

   Order of play (lh-intake-order): sit on the stool; stamp the goal plate; turn the well's ring to the feeling walked
   toward (gold); turn the lever's foot to the feeling lived now and pull it to how heavy it is (lead); flip the five rim
   toggles, each engraved with its channel; press the cells so the stones rise; click each stone's collar up a notch
   (foot Minor, belly Medium, shoulder Major). Tap the well to deal: the camera rises from the seat to straight down in
   about 1.2 s with no cut (a cut under reduced motion). Then a stone tap is a basic move (1 oil), the seal pressed on a
   stone is your BAR, the hourglass turns the watch, and a vibeulon from the stack buys a basic move once the oil is out.
   ?view=seat|top|stand and ?still=1 are for stills (scripts/lantern-table-stills.mjs). */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as skClone } from "three/addons/utils/SkeletonUtils.js";
import { buildHollow, paperLantern, groundY } from "../../between/hollow.js";
import { loadParts, dressFigure } from "../../between/wardrobe.js";
import { init, apply, payout, payoutShare, KEEPS, CHANNELS, CHANNEL_NAME, STATE, lvl, CMD, nHeld, cmdNeed } from "./engine.js";

const q = new URLSearchParams(location.search);
const STILL = q.has("still");
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches || q.get("motion") === "reduce";
const capEl = document.getElementById("caption"), loadEl = document.getElementById("loading");
const say = (t) => { capEl.textContent = t; };
const step = (t) => { const e = document.getElementById("loadStep"); if (e) e.textContent = t; };

/* ---------- renderer, scene, the hall ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: STILL });
renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.localClippingEnabled = true;
document.getElementById("stage").appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1420);
scene.fog = new THREE.FogExp2(0x1a1420, 0.06);   // the hall's own air, thin enough that the near table stays clear
step("building the hall");
const room = buildHollow(scene, {});
scene.add(new THREE.HemisphereLight(0x8a7aa0, 0x2a1e14, 0.35));

/* The covenant's element colors (src/lib/ui/card-tokens.ts: frame and gem). */
const EL = { fire: ["#c1392b", "#e74c3c"], wood: ["#4a7c59", "#2ecc71"], earth: ["#b5651d", "#d4a017"], metal: ["#8e9aab", "#bdc3c7"], water: ["#1a3a5c", "#2980b9"] };
const GOLD = "#e8b84a", LEAD = "#6d7078";

/* ---------- table B (ad1, his pick on lh-table-look-1) ---------- */
const T = { x: -1.75, z: -2.6, y: 0.78, r: 0.78 };
const table = new THREE.Group(); table.position.set(T.x, 0, T.z); scene.add(table);
const wood = new THREE.MeshStandardMaterial({ color: 0x4a3426, roughness: 0.75 });
const slate = new THREE.MeshStandardMaterial({ color: 0x1b1d22, roughness: 0.55, metalness: 0.05 });
const brass = new THREE.MeshStandardMaterial({ color: 0xb08a3c, metalness: 0.85, roughness: 0.32 });
const darkBrass = new THREE.MeshStandardMaterial({ color: 0x7a5a24, metalness: 0.8, roughness: 0.45 });
const lead = new THREE.MeshStandardMaterial({ color: LEAD, metalness: 0.7, roughness: 0.35 });
const mesh = (g, m, x, y, z, par = table) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; par.add(o); return o; };
const W2 = (x, y, z) => new THREE.Vector3(T.x + x, y, T.z + z);

function hexTable(par, rimMat) {
  const rim = mesh(new THREE.CylinderGeometry(T.r, T.r * 0.96, 0.07, 6), rimMat, 0, T.y - 0.035, 0, par); rim.rotation.y = Math.PI / 6;
  const top = mesh(new THREE.CylinderGeometry(T.r * 0.9, T.r * 0.9, 0.012, 6), slate, 0, T.y + 0.004, 0, par); top.rotation.y = Math.PI / 6;
  const legH = T.y - 0.07, legGeo = new THREE.CylinderGeometry(0.035, 0.045, legH, 6);
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.5; mesh(legGeo, wood, Math.cos(a) * T.r * 0.7, legH / 2, Math.sin(a) * T.r * 0.7, par); }
}
hexTable(table, brass);

/* the board: the well in the middle, six cells round it; keep 0, the commander, at the far side */
const cellR = T.r * 0.9 / 3.05;
const at = i => { if (i < 0) return [0, 0]; const a = (-90 + 60 * i) * Math.PI / 180; const d = cellR * Math.sqrt(3); return [Math.cos(a) * d, Math.sin(a) * d]; };
const cellGeo = new THREE.CylinderGeometry(cellR * 0.94, cellR * 0.94, 0.004, 6);
const cellLine = new THREE.MeshStandardMaterial({ color: 0x2a2d35, roughness: 0.4, metalness: 0.2 });
for (let i = -1; i < 6; i++) { const [x, z] = at(i); mesh(cellGeo, cellLine, x, T.y + 0.011, z); }
mesh(new THREE.CylinderGeometry(cellR * 0.62, cellR * 0.5, 0.02, 24), new THREE.MeshStandardMaterial({ color: 0x0b0c0f, roughness: 0.3 }), 0, T.y + 0.014, 0);

/* ---------- picking: every object you can work carries an action; small pieces get a larger, unseen grip ---------- */
const picks = [];
const hitMat = new THREE.MeshBasicMaterial({ visible: false });
function grip(obj, act, r = 0.06) { const g = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), hitMat); obj.add(g); g.userData.act = act; picks.push(g); return g; }

/* engraved words and stamped plates: canvas textures on brass */
function engrave(text, w = 256, h = 64, opts = {}) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d");
  x.fillStyle = opts.bg || "#b08a3c"; x.fillRect(0, 0, w, h);
  x.fillStyle = opts.ink || "#2a1c0c"; x.textAlign = "center"; x.textBaseline = "middle";
  let size = opts.size || h * 0.55; x.font = `700 ${size}px Marcellus, Georgia, serif`;
  const lines = String(text).split("\n");
  while (lines.some(l => x.measureText(l).width > w * 0.92) && size > 8) { size -= 1; x.font = `700 ${size}px Marcellus, Georgia, serif`; }
  lines.forEach((l, k) => x.fillText(l, w / 2, h / 2 + (k - (lines.length - 1) / 2) * size * 1.1));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const plateMat = tex => new THREE.MeshStandardMaterial({ map: tex, metalness: 0.6, roughness: 0.45 });

/* ---------- the intake, held as the reel's intake/game shape (src/lib/lantern/engine.ts Intake) ---------- */
/* lh-first-block: the first table is dealt from the TDT director application block (council money-block.md, mb-first-coin). */
const DIRECTOR_GOAL = "Send the TDT director application";
const intake = { goal: "", want: [], now: {}, truth: {}, truthCtx: {}, res: [false, false, false, false, false, false], tags: KEEPS.map(() => ({})) };
const sliders = { size: 2, charge: 2, deadline: 2 };
let state = null, firstMove = false, tableId = null;
const ringAt = { i: -1 }, leverAt = { ch: 0, pull: 0 };

/* 1. The goal: a brass plate at the far edge, blank until stamped. */
const [c0x, c0z] = at(0);
const plateZ = c0z - cellR * 1.02;
const plateBlank = engrave("", 512, 128, { bg: "#a4823a" }), plateDone = engrave(DIRECTOR_GOAL.replace("the TDT", "the TDT\n"), 512, 128, { bg: "#a4823a" });
const plate = mesh(new THREE.BoxGeometry(0.24, 0.06, 0.012), [brass, brass, brass, brass, plateMat(plateBlank), brass].map(m => m), c0x, T.y + 0.035, plateZ);
plate.rotation.x = -0.35;
/* the stamp: a brass die on a short post beside the plate, which comes down on it when tapped */
const die = new THREE.Group(); die.position.set(c0x + 0.17, T.y + 0.02, plateZ + 0.01); table.add(die);
mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.015, 12), darkBrass, 0, 0, 0, die);
const dieHead = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.06, 12), brass, 0, 0.045, 0, die);
mesh(new THREE.SphereGeometry(0.02, 12, 8), darkBrass, 0, 0.085, 0, die);
grip(plate, "stamp", 0.09); grip(die, "stamp", 0.06);

/* lh-payout-sliders A: three brass sliders beside the director block, on a bracket off the far rim. Each has three detents;
   together they set the block's starting size and the vibeulon payout, shown as the purse of coins beside them. */
const bracket = new THREE.Group(); bracket.position.set(-0.47, T.y + 0.006, -0.6); bracket.rotation.y = 0.52; table.add(bracket);
mesh(new THREE.BoxGeometry(0.3, 0.012, 0.2), darkBrass, 0, 0, 0, bracket);
const SL = ["size", "charge", "deadline"], SL_WORD = { size: "Size", charge: "Charge", deadline: "Deadline" };
const knobs = {};
SL.forEach((k, j) => {
  const z = -0.06 + j * 0.06;
  mesh(new THREE.BoxGeometry(0.17, 0.006, 0.012), new THREE.MeshStandardMaterial({ color: 0x1a140c, roughness: 0.7 }), 0.03, 0.008, z, bracket);
  for (let d = 0; d < 3; d++) mesh(new THREE.BoxGeometry(0.003, 0.008, 0.02), brass, -0.04 + d * 0.07, 0.009, z, bracket);
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.085, 0.024), plateMat(engrave(SL_WORD[k], 256, 72, { bg: "#7a5a24", ink: "#f3e2b0" })));
  lab.rotation.x = -Math.PI / 2; lab.position.set(-0.1, 0.0075, z); bracket.add(lab);
  const kn = new THREE.Group(); bracket.add(kn); kn.position.set(0, 0.012, z);
  mesh(new THREE.BoxGeometry(0.02, 0.022, 0.03), brass, 0, 0.011, 0, kn); mesh(new THREE.SphereGeometry(0.013, 10, 8), darkBrass, 0, 0.03, 0, kn);
  knobs[k] = kn; grip(kn, "slider:" + k, 0.04);
});
const purse = new THREE.Group(); purse.position.set(0.12, 0.006, 0.02); bracket.add(purse);
const coinGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.0035, 16), coinMat = new THREE.MeshStandardMaterial({ color: 0xd9b45a, metalness: 0.9, roughness: 0.3, emissive: 0x4a3410, emissiveIntensity: 0.4 });
function drawSliders() {
  SL.forEach(k => { knobs[k].position.x = -0.04 + (sliders[k] - 1) * 0.07; });
  purse.clear(); const n = payout(sliders).vibeulons;
  for (let c = 0; c < n; c++) { const m = new THREE.Mesh(coinGeo, coinMat); m.position.set((c % 3) * 0.034 - 0.034, 0.002 + Math.floor(c / 3) * 0.0038, 0); m.castShadow = true; purse.add(m); }
}

/* 2. The well's ring: a brass dial with the five channels enamelled round it; its gold notch sits under the feeling walked toward. */
const ring = new THREE.Group(); ring.position.set(0, T.y + 0.02, 0); table.add(ring);
mesh(new THREE.TorusGeometry(cellR * 0.7, 0.012, 8, 36), brass, 0, 0, 0, ring).rotation.x = Math.PI / 2;
CHANNELS.forEach((c, k) => { const a = k / 5 * Math.PI * 2; mesh(new THREE.SphereGeometry(0.008, 8, 6), new THREE.MeshStandardMaterial({ color: EL[c][1], emissive: EL[c][1], emissiveIntensity: 0.4 }), Math.sin(a) * cellR * 0.7, 0.01, -Math.cos(a) * cellR * 0.7, ring); });
const notch = mesh(new THREE.BoxGeometry(0.016, 0.016, 0.03), new THREE.MeshStandardMaterial({ color: GOLD, emissive: GOLD, emissiveIntensity: 0.3 }), 0, T.y + 0.035, -cellR * 0.86);
notch.visible = false;
const wellGlow = mesh(new THREE.CircleGeometry(cellR * 0.3, 24), new THREE.MeshStandardMaterial({ color: GOLD, emissive: GOLD, emissiveIntensity: 0, roughness: 0.3 }), 0, T.y + 0.026, 0); wellGlow.rotation.x = -Math.PI / 2;
const wellLight = new THREE.PointLight(0xffc860, 0, 0.45, 2); wellLight.position.set(T.x, T.y + 0.04, T.z); scene.add(wellLight);
grip(ring, "ring", cellR * 0.85).scale.y = 0.25;
grip(wellGlow, "well", cellR * 0.4);

/* 3. The lever at the player's right edge: its foot turns to the channel lived now, and pulling it down sets how heavy.
   A lead weight hangs from its tip on a short chain and swings from the pull. */
const LV = [0.47, T.y + 0.01, 0.47];
const levFoot = new THREE.Group(); levFoot.position.set(...LV); table.add(levFoot);
mesh(new THREE.CylinderGeometry(0.034, 0.04, 0.03, 16), darkBrass, 0, 0, 0, levFoot);
const footMark = mesh(new THREE.BoxGeometry(0.01, 0.008, 0.03), new THREE.MeshStandardMaterial({ color: EL.fire[1], emissive: EL.fire[1], emissiveIntensity: 0.5 }), 0, 0.018, -0.03, levFoot);
const lev = new THREE.Group(); lev.position.set(0, 0.015, 0); levFoot.add(lev);
mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.26, 8), brass, 0, 0.13, 0, lev); mesh(new THREE.SphereGeometry(0.016, 10, 8), darkBrass, 0, 0.265, 0, lev);
const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.13, 5), brass); scene.add(chain);
const weight = new THREE.Mesh(new THREE.SphereGeometry(0.028, 14, 10), lead); weight.castShadow = true; scene.add(weight);
const swing = { a: 0, v: 0 };
grip(levFoot, "leverFoot", 0.05); grip(lev, "leverPull", 0.06).position.y = 0.2;

/* 4. Truth: five toggles along the near rim, each on a small engraved brass plate that says its channel. Up, glowing in
   the channel's color, where it is so; down and dark where it is not. */
const truthAt = k => { const a = (210 + k * 30) * Math.PI / 180, d = T.r * 0.8; return [-Math.cos(a) * d, -Math.sin(a) * d]; };
const TRUTH_CH = ["fire", "water", "wood", "metal", "earth"];
const toggles = TRUTH_CH.map((c, k) => {
  const [x, z] = truthAt(k), g = new THREE.Group(); g.position.set(x, T.y + 0.012, z); g.rotation.y = Math.atan2(-x, -z); table.add(g);
  mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.012, 12), brass, 0, 0, 0, g);
  const off = new THREE.MeshStandardMaterial({ color: 0x3a3a40 }), on = new THREE.MeshStandardMaterial({ color: EL[c][1], emissive: EL[c][1], emissiveIntensity: 1.1 });
  const stick = new THREE.Group(); stick.position.y = 0.006; g.add(stick);
  const st = mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.05, 6), off, 0, 0.025, 0, stick);
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.022), plateMat(engrave(CHANNEL_NAME[c], 256, 76, { bg: "#a4823a" })));
  lab.rotation.x = -Math.PI / 2; lab.position.set(0, -0.001, 0.034); lab.rotation.z = Math.PI; g.add(lab);
  grip(g, "truth:" + c, 0.045);
  return { c, stick, st, on, off };
});

/* 5 and 6. The six cells: a stone rises from a cell when it is pressed. Each stone has three grooves (foot, belly,
   shoulder) and an open brass collar with a clasp that clicks up a groove: Minor, Medium, Major. Open, notched and
   clasped, so from above it reads as a collar on a stone, not a button. */
const stoneR = cellR * 0.42, stoneY = T.y + 0.02;
const bisque = new THREE.MeshStandardMaterial({ color: 0xcbbfa8, roughness: 0.9 });
const glazeMat = {}; CHANNELS.forEach(c => { glazeMat[c] = new THREE.MeshStandardMaterial({ color: EL[c][0], roughness: 0.5, metalness: 0.05, emissive: EL[c][1], emissiveIntensity: 0.14 }); });
/* lead: the stone's own glaze, darkened and dull, so its channel still shows while it is heavy */
const leadMat = {}; CHANNELS.forEach(c => { leadMat[c] = new THREE.MeshStandardMaterial({ color: new THREE.Color(EL[c][0]).lerp(new THREE.Color(LEAD), 0.45), roughness: 0.6, metalness: 0.25 }); });
const goldGlaze = new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.25, metalness: 0.6, emissive: 0x7a5418, emissiveIntensity: 0.6 });
const grooveMat = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.6, transparent: true, opacity: 0.25 });
const COLLAR = [0, 1.45, 1.05, 0.62];   // the groove's angle from the crown: foot, belly, shoulder
const SY = 0.62;                         // stone height to width: taller than ad2's 0.5, so from above it reads as a stone
/* each stone thrown by hand: a dome pushed a little out of true, so no two read as the same machined knob */
function pebble(i) {
  const geo = new THREE.SphereGeometry(stoneR, 32, 18), p = geo.attributes.position, v = new THREE.Vector3();
  const f = [1.7 + i * 0.37, 2.3 + i * 0.21, 0.9 + i * 0.53];
  for (let k = 0; k < p.count; k++) { v.fromBufferAttribute(p, k); const n = 1 + 0.045 * Math.sin(v.x / stoneR * 3 * f[0] + i) * Math.cos(v.z / stoneR * 2.4 * f[1]) + 0.025 * Math.sin((v.x + v.z) / stoneR * 4 * f[2]); v.multiplyScalar(n); v.x *= 1.06; p.setXYZ(k, v.x, v.y, v.z); }
  geo.computeVertexNormals(); return geo;
}
const stones = KEEPS.map((k, i) => {
  const [x, z] = at(i), g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = i * 1.1; table.add(g);
  const body = new THREE.Group(); g.add(body);
  const dome = new THREE.Mesh(pebble(i), bisque); dome.scale.y = SY; dome.castShadow = true; dome.receiveShadow = true; body.add(dome);
  for (let n = 1; n <= 3; n++) { const th = COLLAR[n], gr = new THREE.Mesh(new THREE.TorusGeometry(stoneR * 1.005 * Math.sin(th), 0.0014, 4, 36), grooveMat); gr.rotation.x = Math.PI / 2; gr.position.y = SY * stoneR * Math.cos(th); body.add(gr); }
  const collar = new THREE.Group(); body.add(collar);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.08, 0.22, 32, 1, true, 0.35, Math.PI * 2 * 0.86), new THREE.MeshStandardMaterial({ color: 0x7a5a24, metalness: 0.8, roughness: 0.45, side: THREE.DoubleSide })); collar.add(band);
  const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 0.14), brass); clasp.position.set(Math.sin(0.25) * 1.2, 0, Math.cos(0.25) * 1.2); clasp.rotation.y = 0.25 + Math.PI / 2; collar.add(clasp);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.34, 6), darkBrass); pin.position.copy(clasp.position).multiplyScalar(1.12); collar.add(pin);
  collar.visible = false;
  let crown = null;
  if (i === CMD) { crown = mesh(new THREE.TorusGeometry(cellR * 0.55, 0.006, 6, 6), new THREE.MeshStandardMaterial({ color: 0xe8b84a, metalness: 0.9, roughness: 0.3, emissive: 0x6a4a10, emissiveIntensity: 0.5 }), 0, T.y + 0.014, 0, g); crown.rotation.x = Math.PI / 2; crown.rotation.z = Math.PI / 6; }
  const heldRing = mesh(new THREE.TorusGeometry(stoneR * 1.25, 0.005, 6, 6), goldGlaze, 0, T.y + 0.014, 0, g); heldRing.rotation.x = Math.PI / 2; heldRing.visible = false;
  grip(g, "cell:" + i, cellR * 0.75).position.y = T.y + 0.03;
  return { g, body, dome, collar, heldRing, crown, rise: 0, riseTo: 0, mist: [] };
});

/* Fog on a keep is fog: soft drifting sprites of mist, lit by the lantern, with no hard edge and no second image of the stone. */
const mistTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"); const g = x.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, "rgba(255,255,255,.9)"); g.addColorStop(0.45, "rgba(255,255,255,.35)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); return t; })();
let seed = 20261103; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
stones.forEach((s) => { for (let k = 0; k < 12; k++) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex, color: 0xa9b2c4, transparent: true, opacity: 0, depthWrite: false, fog: true })); const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * stoneR * 0.9; m.userData = { a, d, h: 0.01 + rnd() * 0.07, sp: 0.1 + rnd() * 0.2, sz: stoneR * (1.0 + rnd() * 0.8) }; m.scale.setScalar(m.userData.sz); s.g.add(m); s.mist.push(m); } });

/* The hand on the board: the seal (your BAR) on a shelf at the left, four oil lamps beside it, and your vibeulons; the
   hourglass (the watch) on the shelf at the right. */
function shelf(x, z) { const g = new THREE.Group(); g.position.set(x, T.y - 0.05, z); table.add(g); mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.025, 24), wood, 0, 0, 0, g); mesh(new THREE.BoxGeometry(0.1, 0.02, 0.06), wood, x > 0 ? -0.1 : 0.1, 0, -0.07, g); return g; }
const left = shelf(-0.72, 0.5), right = shelf(0.74, 0.46);
const lamps = [0, 1, 2, 3].map(k => {
  const g = new THREE.Group(); g.position.set(-0.06 + (k % 2) * 0.06, 0.012, -0.06 + Math.floor(k / 2) * 0.06); left.add(g);
  mesh(new THREE.CylinderGeometry(0.014, 0.02, 0.02, 12), brass, 0, 0.01, 0, g);
  const fl = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffc46a })); fl.scale.y = 1.8; fl.position.y = 0.034; g.add(fl);
  return fl;
});
const purseMine = new THREE.Group(); purseMine.position.set(0.07, 0.012, 0.06); left.add(purseMine);
grip(purseMine, "coins", 0.05);
const seal = new THREE.Group(); seal.position.set(0.06, 0.012, -0.05); left.add(seal);
mesh(new THREE.CylinderGeometry(0.02, 0.026, 0.02, 14), brass, 0, 0.01, 0, seal);
mesh(new THREE.CylinderGeometry(0.011, 0.014, 0.06, 10), new THREE.MeshStandardMaterial({ color: 0x5a3622, roughness: 0.7 }), 0, 0.05, 0, seal);
const sealFace = new THREE.Mesh(new THREE.CircleGeometry(0.019, 20), plateMat(engrave("Ask", 128, 128))); sealFace.rotation.x = -Math.PI / 2; sealFace.position.y = 0.0205; seal.add(sealFace);
grip(seal, "seal", 0.05);
const KINDS = ["Ask", "Ground", "Witness", "Evidence", "Impact", "Exposure"];
const sealTex = Object.fromEntries(KINDS.map(k => [k, engrave(k, 128, 128, { size: 34 })]));
let sealKind = 0, sealUp = false;
const glass = new THREE.Group(); right.add(glass); glass.position.set(0.02, 0.07, 0);
mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.008, 6), wood, 0, 0.06, 0, glass); mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.008, 6), wood, 0, -0.06, 0, glass);
const bulb = new THREE.MeshStandardMaterial({ color: 0xcfe0e8, transparent: true, opacity: 0.28, roughness: 0.05, depthWrite: false });
mesh(new THREE.SphereGeometry(0.03, 14, 10), bulb, 0, 0.028, 0, glass).scale.y = 1.1; mesh(new THREE.SphereGeometry(0.03, 14, 10), bulb, 0, -0.028, 0, glass).scale.y = 1.1;
const sand = mesh(new THREE.ConeGeometry(0.022, 0.025, 14), new THREE.MeshStandardMaterial({ color: 0xd8b878, roughness: 0.9 }), 0, -0.045, 0, glass);
grip(glass, "watch", 0.07);
let glassTurn = 0, glassTo = 0;

/* ---------- the lantern: hung over the board as the seat sees it (round 2's P1), its light the oil ---------- */
const LAN = W2(0.0, 1.2, 0.0);
const lan = paperLantern("#c9a27a", 1); lan.position.copy(LAN); lan.scale.setScalar(0.5); scene.add(lan);
const cordM = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.9 });
const cord = (a, b, r = 0.0028, m = cordM, par = scene) => { const len = a.distanceTo(b); const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 5), m); c.position.copy(a).lerp(b, 0.5); c.lookAt(b); c.rotateX(Math.PI / 2); par.add(c); return c; };
const lanCord = cord(new THREE.Vector3(LAN.x, LAN.y + 0.39, LAN.z), new THREE.Vector3(LAN.x, 4.4, LAN.z), 0.004);
const pl = new THREE.PointLight(0xffc27a, 4.2, 6, 1.6); pl.position.set(LAN.x, LAN.y + 0.22, LAN.z); pl.castShadow = true; pl.shadow.mapSize.set(1024, 1024); scene.add(pl);

/* ---------- lh-hall-company: stand-ins at two other tables, plainly marked ---------- */
/* A stand-in is a pale, undressed figure of unglazed clay, and a paper tag on its lantern says so in words. */
const STANDIN_AT = [[0.45, -3.45, 1.9], [1.3, -1.7, 2.6]];
STANDIN_AT.forEach(([x, z]) => { const g = new THREE.Group(); g.position.set(x, groundY(x, z), z); scene.add(g); hexTable(g, wood); });
STANDIN_AT.forEach(([x, z], k) => {
  const L = new THREE.Vector3(x, 1.75 + groundY(x, z), z), l = paperLantern("#a88a6a", 0.8); l.position.copy(L); l.scale.setScalar(0.5); scene.add(l);
  cord(new THREE.Vector3(L.x, L.y + 0.39, L.z), new THREE.Vector3(L.x, 4.4, L.z), 0.004);
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.2), new THREE.MeshStandardMaterial({ map: engrave("Stand-in\nnot a player", 340, 200, { bg: "#efe2c4", ink: "#3a2a1e" }), roughness: 0.95, side: THREE.DoubleSide, emissive: 0xffe0b0, emissiveIntensity: 0.25, emissiveMap: null }));
  tag.position.set(L.x, L.y - 0.14, L.z); tag.lookAt(W2(0.4, 1.9, 1.6)); scene.add(tag);
  cord(new THREE.Vector3(L.x, L.y + 0.02, L.z), new THREE.Vector3(L.x, L.y - 0.04, L.z), 0.002);
  for (let s = 0; s < 4; s++) { const [sx, sz] = [Math.cos(s * 1.7 + k) * 0.22, Math.sin(s * 1.7 + k) * 0.22]; const st = new THREE.Mesh(new THREE.SphereGeometry(stoneR, 18, 10), glazeMat[CHANNELS[(s + k) % 5]]); st.scale.y = SY; st.position.set(x + sx, stoneY + groundY(x, z), z + sz); scene.add(st); }
});

/* ---------- stools and the player ---------- */
const STOOL_TOP = 0.5;
const stoolAt = (cx, cz, a) => [cx + Math.cos(a) * 0.98, cz + Math.sin(a) * 0.98];
const stools = [Math.PI / 2, Math.PI / 2 + 2.1, Math.PI / 2 - 2.1].map(a => stoolAt(T.x, T.z, a));
stools.forEach(([x, z]) => mesh(new THREE.CylinderGeometry(0.2, 0.18, STOOL_TOP, 10), wood, x, STOOL_TOP / 2, z, scene));
const stoolGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.9, 10), hitMat); stoolGrip.position.set(stools[0][0], 0.45, stools[0][1]); stoolGrip.userData.act = "sit"; scene.add(stoolGrip); picks.push(stoolGrip);
STANDIN_AT.forEach(([x, z, a]) => { const [sx, sz] = stoolAt(x, z, a); mesh(new THREE.CylinderGeometry(0.2, 0.18, STOOL_TOP, 10), wood, sx, STOOL_TOP / 2 + groundY(x, z), sz, scene); });

const eu = new THREE.Euler(), qe = new THREE.Quaternion();
const SIT = [["hipL", -1.45, 0, -0.12], ["hipR", -1.45, 0, 0.12], ["kneeL", 1.4, 0, 0], ["kneeR", 1.4, 0, 0], ["spine", 0.25, 0, 0], ["neck", 0.25, 0, 0], ["shoulderL", -0.35, 0, -0.1], ["elbowL", -0.9, 0, 0], ["shoulderR", -0.35, 0, 0.1], ["elbowR", -0.9, 0, 0]];
function figure(parts, { dressed }) {
  const obj = skClone(parts.dusk.scene); obj.updateMatrixWorld(true);
  const box = new THREE.Box3(); obj.traverse(o => { if (o.isSkinnedMesh) { o.computeBoundingBox(); box.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld)); } });
  const k = 1.7 / box.getSize(new THREE.Vector3()).y; obj.scale.setScalar(k); obj.position.y = -box.min.y * k;
  let wd = null;
  if (dressed) { wd = dressFigure(obj, parts); wd.set(null); }
  else { /* grey unfired clay: a stand-in, never mistaken for a player */ const clay = new THREE.MeshStandardMaterial({ color: 0x7f8794, roughness: 0.95 }); obj.traverse(o => { if (o.isMesh) o.material = clay; }); }
  const holder = new THREE.Group(); holder.add(obj); scene.add(holder);
  obj.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = true; } });
  const mixer = new THREE.AnimationMixer(obj); const idle = parts.dusk.animations.find(a => a.name === "Idle"); if (idle) mixer.clipAction(idle).play();
  const bone = n => obj.getObjectByName(n), hips = bone("hips"), hips0 = hips.position.clone();
  function pose(sit, floor = 0) {
    mixer.setTime(0.5); hips.position.copy(hips0);
    if (sit) {
      for (const [n, x, y, z] of SIT) { const b = bone(n); if (b) b.quaternion.multiply(qe.setFromEuler(eu.set(x, y, z, "XYZ"))); }
      holder.updateMatrixWorld(true);
      const sv = new THREE.Vector3(), hw = hips.getWorldPosition(sv).y, sy = hips.parent.getWorldScale(sv).y || 1;
      hips.position.y -= (hw - (STOOL_TOP + 0.1 + floor)) / sy;
    }
    if (wd) for (let n = 0; n < 40; n++) wd.dress(1 / 60);
    holder.updateMatrixWorld(true);
  }
  return { holder, pose };
}

/* ---------- camera: standing in the hall, the seat over the right shoulder, and straight down ---------- */
const cam = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.02, 60);
const VIEWS = {
  stand: { p: W2(2.9, 2.15, 3.3), l: W2(0.55, 0.8, -0.5), fov: 50 },
  seat: { p: W2(0.8, 1.58, 1.24), l: W2(-0.12, 0.86, -0.16), fov: 50 },
  top: { p: W2(0, T.y + 2.55, 0.2), l: W2(0, T.y, 0.04), fov: 34 },
};
/* keep the table's width on a phone held upright: widen the vertical field as the frame narrows */
const fovFor = f => { const a = innerWidth / innerHeight; if (a >= 0.9) return f; const h = 2 * Math.atan(Math.tan(f * Math.PI / 360) * 0.9) ; return Math.min(80, 2 * Math.atan(Math.tan(h / 2) / a) * 180 / Math.PI); };
const CAMQ = q.get("cam") && q.get("cam").split(",").map(Number);   // stills only: an explicit camera
const camNow = { p: VIEWS.stand.p.clone(), l: VIEWS.stand.l.clone(), fov: 50 };
let move = null, view = "stand";
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function goTo(name, secs) {
  const to = VIEWS[name]; view = name;
  if (REDUCED || !secs) { camNow.p.copy(to.p); camNow.l.copy(to.l); camNow.fov = to.fov; move = null; return; }
  move = { from: { p: camNow.p.clone(), l: camNow.l.clone(), fov: camNow.fov }, to, t: 0, secs };
}
/* the rise from the seat to straight down: one continuous move, its path bowed up and back so it never passes through the lantern */
function stepCamera(dt) {
  if (move) {
    move.t = Math.min(1, move.t + dt / move.secs); const e = ease(move.t);
    camNow.p.lerpVectors(move.from.p, move.to.p, e); camNow.l.lerpVectors(move.from.l, move.to.l, e); camNow.fov = move.from.fov + (move.to.fov - move.from.fov) * e;
    camNow.p.z += Math.sin(Math.PI * e) * 0.25; camNow.p.y += Math.sin(Math.PI * e) * 0.15;
    if (move.t >= 1) move = null;
  }
  cam.position.copy(camNow.p); cam.lookAt(camNow.l);
  if (CAMQ) { cam.position.set(CAMQ[0], CAMQ[1], CAMQ[2]); cam.lookAt(CAMQ[3], CAMQ[4], CAMQ[5]); } cam.fov = fovFor(camNow.fov); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
  /* the risen camera passes the lantern: it fades as the camera climbs, as the stills do */
  const up = THREE.MathUtils.clamp((cam.position.y - 1.75) / 0.9, 0, 1);
  lan.visible = lanCord.visible = up < 0.98; lan.scale.setScalar(0.42 * (1 - up * 0.6));
}

/* ---------- drawing the machine from the intake, and the board from the engine ---------- */
function drawIntake() {
  plate.material[4] = plateMat(intake.goal ? plateDone : plateBlank);
  notch.visible = ringAt.i >= 0; ring.rotation.y = ringAt.i >= 0 ? -ringAt.i / 5 * Math.PI * 2 : 0;
  wellGlow.material.emissiveIntensity = intake.want.length ? 0.7 : 0; wellLight.intensity = intake.want.length ? 0.6 : 0;
  const lc = CHANNELS[leverAt.ch]; footMark.material.color.set(EL[lc][1]); footMark.material.emissive.set(EL[lc][1]);
  levFoot.rotation.y = -0.8 + leverAt.ch * 0.35;
  toggles.forEach(t => { const on = !!intake.truth[t.c]; t.st.material = on ? t.on : t.off; t.stick.rotation.x = on ? -0.45 : 0.55; });
  if (state) return;
  stones.forEach((s, i) => {
    s.riseTo = intake.res[i] ? 1 : 0;
    const str = intake.tags[i][KEEPS[i].pred] || 0;
    s.dome.material = intake.res[i] && str ? glazeMat[KEEPS[i].pred] : bisque;
    setCollar(s, str);
    s.heldRing.visible = false;
    s.fog = intake.res[i] && !str ? 0.45 : 0;   // on but untagged: its channel still in fog (a cell left down is dealt in fog)
  });
}
function setCollar(s, n) {
  s.collar.visible = n > 0; if (!n) return;
  const th = COLLAR[n], r = stoneR * 1.04 * Math.sin(th); s.collar.position.y = SY * stoneR * 1.0 * Math.cos(th); s.collar.scale.set(r, 0.05, r);
}
function drawBoard() {
  if (!state) return;
  state.keeps.forEach((k, i) => {
    const s = stones[i], left = k.loops.reduce((a, l) => a + l.g, 0), top = k.loops.filter(l => l.g > 0).sort((a, b) => b.g - a.g)[0];
    s.riseTo = k.fog ? 0 : k.held ? 0.25 : 0.55 + 0.15 * Math.min(3, left);
    const ch = (top || k.loops[0] || { ch: KEEPS[i].pred }).ch;
    s.dome.material = k.held ? goldGlaze : k.fog ? bisque : top && lvl(top.g) === 0 ? leadMat[ch] : glazeMat[ch];
    if (k.ph && !k.held && !k.fog) s.dome.material = bisque;   // untagged: its channel stays in fog until a strike names it
    s.heldRing.visible = k.held; s.fog = k.fog ? 1 : k.ph && !k.held ? 0.45 : 0;
    setCollar(s, k.held || k.fog || k.ph ? 0 : Math.min(3, top ? top.g : 0));
  });
  lamps.forEach((f, k) => { f.visible = k < state.oil; });
  purseMine.clear(); for (let c = 0; c < state.vibeulons; c++) { const m = new THREE.Mesh(coinGeo, coinMat); m.position.y = c * 0.0038; purseMine.add(m); }
  pl.intensity = 2.6 + 0.4 * state.oil;
}
function drawSeal() { sealFace.material.map = sealTex[KINDS[sealKind]]; sealFace.material.needsUpdate = true; seal.position.y = sealUp ? 0.07 : 0.012; seal.rotation.z = sealUp ? 0.3 : 0; }

/* ---------- what each object does ---------- */
const ORDER_HINT = [
  [() => !intake.goal, "Tap the brass plate at the far edge to stamp your goal on it."],
  [() => !intake.want.length, "Turn the brass ring round the well to the feeling you are walking toward."],
  [() => !Object.keys(intake.now).length, "Turn the lever's foot to the feeling you live with now, then pull the lever to how heavy it is."],
  [() => !Object.keys(intake.truth).length, "Flip a toggle on the near rim for each thing that is simply so. Each plate names its channel."],
  [() => !intake.res.some(Boolean), "Press a cell to raise a stone for each reservation you hold."],
  [() => !intake.tags.some(t => Object.keys(t).length), "Tap a stone to click its collar up: the foot is Minor, the belly Medium, the shoulder Major."],
  [() => true, "Tap the well to deal the table when the stones are set."],
];
const hint = () => ORDER_HINT.find(([f]) => f())[1];
const sliderLine = () => { const p = payout(sliders); return `The director block starts at ${p.blockSize} refinements and pays ${p.vibeulons} vibeulons.`; };
const sitting = () => view !== "stand";
const chFor = i => { const k = state.keeps[i], l = k.loops.filter(x => x.g > 0).sort((a, b) => b.g - a.g)[0]; return l ? l.ch : KEEPS[i].pred; };
const lastWins = n => state.wins.slice(n).map(w => w.type === "found" ? `You found a block in ${KEEPS[w.i].b}.` : `${KEEPS[w.i].b} has dissolved.`).join(" ");

function play(m) {
  const n = state.wins.length, prevOil = state.oil;
  state = apply(state, m); if (state.oil < prevOil || m.type === "buy") firstMove = true;
  let line = state.fx + (state.wins.length > n ? " " + lastWins(n) : "");
  if (state.done) {
    const sh = payoutShare(state), pay = payout(sliders).vibeulons;
    line += ` Every block you found has dissolved. The ${pay} vibeulons are shared by what each hand dealt: ` + Object.entries(sh).map(([k, v]) => `${k === "You" ? "you" : k} ${Math.round(v * 100)} percent`).join(", ") + ".";
  } else if (state.oil === 0 && m.type !== "tick") line += state.vibeulons > 0 ? " The oil is out. Tap a stone to spend a vibeulon on a basic move, or turn the hourglass." : " The oil is out. Turn the hourglass to start the next watch.";
  say(line); drawBoard();
}
function deal() {
  if (!intake.goal) { say("Stamp your goal on the brass plate first."); return; }
  state = apply(init(intake, { blockSize: payout(sliders).blockSize }), { w: 1, type: "intake" });
  say(state.fx + " Tap a stone for a basic move. Lift the seal and press it on a stone to play your BAR.");
  drawBoard(); goTo("top", 1.2); save();
}
function act(a) {
  if (a === "sit") { if (!sitting()) { me.pose(true); me.holder.position.set(stools[0][0], 0, stools[0][1]); goTo("seat", 1.0); say(hint()); } else if (view === "top") { goTo("seat", 1.2); say("You look up from the board. Tap the well to look down again."); } return; }
  if (!sitting()) { say("Tap the stool to sit at the empty table."); return; }
  const [kind, arg] = a.split(":");
  if (kind === "slider") { if (firstMove) return say("The sliders are set for this table once the first move is played."); sliders[arg] = sliders[arg] % 3 + 1; drawSliders(); if (state) { state = apply(init(intake, { blockSize: payout(sliders).blockSize }), { w: 1, type: "intake" }); drawBoard(); } return say(`${SL_WORD[arg]} is set to ${["low", "middle", "high"][sliders[arg] - 1]}. ` + sliderLine()); }
  if (kind === "well") { if (!state) return deal(); goTo(view === "top" ? "seat" : "top", 1.2); return; }
  if (state && kind === "cell") {
    const i = +arg, k = state.keeps[i];
    if (k.held) return say(`${KEEPS[i].b} has dissolved already.`);
    if (i === CMD && nHeld(state) < cmdNeed(state)) return say(`The commander is protected until ${cmdNeed(state)} keeps are held.`);
    if (sealUp) { sealUp = false; drawSeal(); if (state.oil <= 0) return say("The oil is out, so the seal will not take. Turn the hourglass."); return play({ w: state.w, type: "story", keep: i, ch: chFor(i), kind: KINDS[sealKind], withWitness: true }); }
    return play({ w: state.w, type: state.oil > 0 ? "basic" : "buy", keep: i, ch: chFor(i) });
  }
  if (state && kind === "seal") { if (!sealUp) { sealUp = true; drawSeal(); return say(`The seal reads ${KINDS[sealKind]}. Tap it again to turn it, or press it on a stone. A matching kind strikes for 2.`); } sealKind = (sealKind + 1) % KINDS.length; drawSeal(); return say(`The seal reads ${KINDS[sealKind]}.`); }
  if (state && kind === "watch") { glassTo += Math.PI; const w = state.w; play({ w, type: "tick" }); const tickLine = state.fx; state = apply(state, { w: w + 1, type: "read" }); drawBoard(); return say(`${tickLine} Watch ${w + 1} begins with 4 oil.`); }
  if (state && kind === "coins") return say(`You hold ${state.vibeulons} vibeulon${state.vibeulons === 1 ? "" : "s"}. Each buys a basic move once the oil is out, up to 4 a watch.`);
  if (state && firstMove) return say("The table is in play. The intake stays as you set it.");
  if (state && !["stamp", "ring", "leverFoot", "leverPull", "truth", "cell"].includes(kind)) return;
  /* the intake: any piece can be picked up again and changed until the first move */
  let line = "";
  if (kind === "stamp") { intake.goal = DIRECTOR_GOAL; die.userData.press = 1; line = `Stamped: ${DIRECTOR_GOAL}. ` + sliderLine() + " The three sliders beside the plate set its size, charge and deadline."; }
  if (kind === "ring") { ringAt.i = (ringAt.i + 1) % 5; intake.want = [CHANNELS[ringAt.i]]; line = `The ring turns to ${STATE[CHANNELS[ringAt.i]][2]}.`; }
  if (kind === "leverFoot") { const old = CHANNELS[leverAt.ch], v = intake.now[old]; leverAt.ch = (leverAt.ch + 1) % 5; const c = CHANNELS[leverAt.ch]; if (v) { delete intake.now[old]; intake.now[c] = v; } line = `The lever's foot turns to ${STATE[c][0]}.`; }
  if (kind === "leverPull") { const c = CHANNELS[leverAt.ch]; leverAt.pull = (leverAt.pull + 1) % 4; intake.now = leverAt.pull ? { [c]: leverAt.pull } : {}; if (leverAt.pull && intake.truth[c] === undefined) intake.truth[c] = true; swing.v += REDUCED ? 0 : 3; line = leverAt.pull ? `The lead weighs ${["", "a little", "a fair amount", "a great deal"][leverAt.pull]}: ${STATE[c][0]}.` : "The lever springs back up."; }
  if (kind === "truth") { intake.truth[arg] = !intake.truth[arg]; line = `${CHANNEL_NAME[arg]}: ${intake.truth[arg] ? "it is so." : "it is not so."}`; }
  if (kind === "cell") {
    /* an empty cell: press it and the stone rises; a risen stone: its collar clicks up foot, belly, shoulder, then the stone sinks back */
    const i = +arg, c = KEEPS[i].pred, v = intake.tags[i][c] || 0;
    if (!intake.res[i]) { intake.res[i] = true; line = `A stone rises: ${KEEPS[i].b}. Its channel stays in fog until its collar is set.`; }
    else if (v < 3) { intake.tags[i] = { [c]: v + 1 }; line = `${KEEPS[i].b}: the collar clicks to the ${["", "foot, Minor", "belly, Medium", "shoulder, Major"][v + 1]}, in ${CHANNEL_NAME[c]}.`; }
    else { intake.res[i] = false; intake.tags[i] = {}; line = `${KEEPS[i].b} sinks back into its cell, and will be dealt in fog.`; }
  }
  if (state) { state = apply(init(intake, { blockSize: payout(sliders).blockSize }), { w: 1, type: "intake" }); drawBoard(); say(line + " " + state.fx); }
  else say(line + " " + hint());
  drawIntake();
}

/* ---------- saving: a signed-in player's table is kept through /api/lantern/table (src/app/api/lantern/table) ---------- */
async function save() {
  try {
    const r = await fetch("/api/lantern/table", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tableId ? { id: tableId, intake } : { intake }) });
    if (r.ok) { tableId = (await r.json()).id; } else if (r.status === 401) { /* a guest plays without a saved table */ }
  } catch { /* offline: the table still plays */ }
}
async function loadSaved() {
  try {
    const r = await fetch("/api/lantern/table"); if (!r.ok) return;
    const { table: t } = await r.json(); if (!t) return;
    tableId = t.id; Object.assign(intake, t.intake);
    const w = CHANNELS.indexOf(intake.want[0]); ringAt.i = w;
    const nowCh = Object.keys(intake.now)[0]; if (nowCh) { leverAt.ch = CHANNELS.indexOf(nowCh); leverAt.pull = intake.now[nowCh]; }
  } catch { /* nothing saved, or offline */ }
}

/* ---------- input: a tap picks the nearest object under the finger ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let down = null;
renderer.domElement.addEventListener("pointerdown", e => { down = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener("pointerup", e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 12) return;
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, cam);
  const hit = ray.intersectObjects(picks, false)[0]; if (hit) act(hit.object.userData.act);
});
addEventListener("resize", () => renderer.setSize(innerWidth, innerHeight));

/* ---------- once a frame ---------- */
const clock = new THREE.Clock(); let tAll = 0;
function frame() {
  const dt = Math.min(0.05, clock.getDelta()); tAll += dt;
  stepCamera(dt);
  stones.forEach(s => {
    s.rise += (s.riseTo - s.rise) * (REDUCED ? 1 : Math.min(1, dt * 6));
    s.body.position.y = stoneY - 0.03 + s.rise * 0.03; s.body.visible = s.rise > 0.02 || (state && !state.keeps[stones.indexOf(s)].fog);
    s.body.scale.setScalar(0.55 + 0.45 * Math.min(1, s.rise));
    s.mist.forEach(m => { const u = m.userData, a = u.a + tAll * u.sp * (REDUCED ? 0 : 1); m.position.set(Math.cos(a) * u.d, T.y + u.h + 0.01 * Math.sin(tAll + u.a), Math.sin(a) * u.d); m.material.opacity += ((s.fog || 0) * 0.4 - m.material.opacity) * (STILL || REDUCED ? 1 : Math.min(1, dt * 3)); });
  });
  /* the lead weight on its chain: a damped pendulum from the lever's tip */
  const pullA = -leverAt.pull * 0.33; lev.rotation.x += (pullA - lev.rotation.x) * (REDUCED ? 1 : Math.min(1, dt * 8));
  swing.v += (-28 * swing.a - 1.6 * swing.v) * dt; swing.a += swing.v * dt;
  table.updateMatrixWorld(true); const tip = new THREE.Vector3(0, 0.26, 0).applyMatrix4(lev.matrixWorld);
  const end = tip.clone().add(new THREE.Vector3(Math.sin(swing.a) * 0.13, -Math.cos(swing.a) * 0.13, 0));
  weight.position.copy(end); chain.position.copy(tip).lerp(end, 0.5); chain.lookAt(end); chain.rotateX(Math.PI / 2);
  if (die.userData.press) { die.userData.press = Math.max(0, die.userData.press - dt * 3); dieHead.position.y = 0.045 - 0.02 * Math.sin(Math.PI * (1 - die.userData.press)); }
  glassTurn += (glassTo - glassTurn) * (REDUCED ? 1 : Math.min(1, dt * 4)); glass.rotation.z = glassTurn; sand.position.y = Math.cos(glassTurn) * -0.045;
  lamps.forEach((f, k) => { f.scale.x = 1 + 0.08 * Math.sin(tAll * 9 + k); });
  if (room.update) room.update(tAll, dt, 1, cam.position, camNow.l);
  renderer.render(scene, cam);
}

/* ---------- start ---------- */
step("dressing the walker");
const loader = new GLTFLoader();
const parts = await loadParts(u => loader.loadAsync(u));
const me = figure(parts, { dressed: true });
me.holder.rotation.y = Math.PI * 1.1; me.holder.position.set(stools[0][0] + 0.5, 0, stools[0][1] + 0.3); me.pose(false);
STANDIN_AT.forEach(([x, z, a]) => { const f = figure(parts, { dressed: false }); const [sx, sz] = stoolAt(x, z, a); f.holder.position.set(sx, groundY(x, z), sz); f.holder.rotation.y = Math.atan2(x - sx, z - sz); f.pose(true, groundY(x, z)); });
await loadSaved();
drawSliders(); drawIntake(); drawSeal();
loadEl.classList.add("gone"); setTimeout(() => loadEl.remove(), 900);
say("An empty hex table waits under its lantern. Tap the stool to sit.");

/* stills: ?view=seat sits and sets a sample intake mid-way; ?view=top deals it and rises */
const V = q.get("view");
if (V === "seat" || V === "top") {
  act("sit"); goTo("seat", 0);
  for (const a of ["stamp", "ring", "ring", "leverFoot", "leverFoot", "leverFoot", "leverPull", "leverPull", "truth:fire", "truth:water", "truth:metal", "cell:0", "cell:0", "cell:0", "cell:1", "cell:1", "cell:1", "cell:1", "cell:2", "cell:2", "cell:4", "cell:4", "cell:4", "cell:5"]) act(a);
  if (V === "top") { deal(); goTo("top", 0); act("cell:3"); act("cell:2"); }
  for (let k = 0; k < 90; k++) { stones.forEach(s => { s.rise = s.riseTo; }); frame(); }
}
window.__ready = true;
if (STILL) frame(); else renderer.setAnimationLoop(frame);
