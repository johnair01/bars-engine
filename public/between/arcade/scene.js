/* The Infinite Arcade hall's drawing kit (council spec .specify/specs/infinite-arcade-hall/, task T006), carried over from
   the stills round he said yes to (council/callsheets/stills/2026-11-03-arcade-hall-3/make/hall.js, his "Yes this is much
   better", 2026-11-03 19:02Z): the grey gate and mist, the door alcove with the change machine and the prize counter, the
   corridor of cabinets built from arrival.py's TYPES table, and the visitors in their own street clothes. Box-modelled in
   code as arrival.py drew it, with the Between kit:

     ../hollow.js     rng, mergeStatic (one draw per material)
     ../paint.js      the Between's painterly shader on every standard material (the page installs it)
     ../wardrobe.js   the visitors' bodies: Average Dusk, shaped and haired; the robe hidden, street clothes on

   The page (./arcade.js) owns the renderer, the camera, the walk and the cards. */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as skClone } from "three/addons/utils/SkeletonUtils.js";
import { rng, mergeStatic } from "/between/hollow.js";
import { installPaint } from "/between/paint.js";
import { loadParts, dressFigure } from "/between/wardrobe.js";
import { TYPES, CH1_TYPE, AISLE, PITCH, BACK_WALL, SCREEN_HUES, BODY, CABINETS } from "./cabinets.js";
export { AISLE, PITCH, BACK_WALL };
installPaint();

const Q = new URLSearchParams(location.search);
const FEW = true;   // five lights (the stills round's walk timing: 1.5x the first land's frame cost with five, 2.0x with eleven)
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const R = rng(7);
const pick = a => a[Math.floor(R() * a.length)];
const FOG_HALL = 0x5a4a72, MIST = 0xc9b6c4;

/* ---------- the scene (the page owns the renderer and the camera) ---------- */
export const scene = new THREE.Scene();
scene.background = new THREE.Color(FOG_HALL);
scene.fog = new THREE.FogExp2(FOG_HALL, 0.045);          // arrival.py's density, its view-distance fog as three's own
const G = new THREE.Group(); scene.add(G);                // everything that stands still, merged once built

/* ---------- materials ---------- */
const std = (hex, o = {}) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.8, ...o });
const glow = (hex, k = 1, o = {}) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), ...o });
const M = {
  floor: std(0x2a2236, { roughness: 0.4 }), ceil: std(0x1a1626), wall: std(0x342a48), trim: std(0x1c1724), panel: std(0x5b4a6e),
  metal: std(0x9a98a6, { roughness: 0.3, metalness: 0.4 }), stool: std(0x7a2e3a, { roughness: 0.6 }), goldBody: std(0x5a3b2c),
  stone: std(0xa3a2aa, { roughness: 0.95 }), stoneDark: std(0x7d7c86, { roughness: 0.95 }), facade: std(0x4a4458, { roughness: 0.95 }), wood: std(0x4a3426), brass: std(0xb08a4a, { roughness: 0.35, metalness: 0.6 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x9fb6c8, roughness: 0.1, transparent: true, opacity: 0.25, depthWrite: false }),
  coin: glow(0xff5a3c, 1.6), strip: glow(0xd9b8ff, 1.5), lamp: glow(0xffb36b, 1.6), gold: glow(0xf2c55c, 1.4),
};
M.body = BODY.map(h => std(h));
M.stone.userData.noPaint = true; M.stoneDark.userData.noPaint = true;   // the grey gate stays grey: the Between's paint ramp would turn it mauve
const BUTTON = [...SCREEN_HUES, "#f4f0e8"].map(h => glow(h, 0.9));

/* ---------- canvas art: screens and marquees (signs in the world, no overlay text) ---------- */
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const lerpC = (a, b, k) => { const A = new THREE.Color(a), B = new THREE.Color(b); return "#" + A.lerp(B, k).getHexString(); };
// the Chapter 1 screen: arrival.py's road_mist_image, a pale road into mist under a far gate
const roadMist = (x, w, h) => {
  const hz = h * 0.54, sky = x.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, "#d8c9d6"); sky.addColorStop(1, "#ece2e6");
  x.fillStyle = sky; x.fillRect(0, 0, w, hz);
  const gr = x.createLinearGradient(0, hz, 0, h); gr.addColorStop(0, "#b9aebb"); gr.addColorStop(1, "#6e6878"); x.fillStyle = gr; x.fillRect(0, hz, w, h - hz);
  x.fillStyle = "#d9cdc6"; x.beginPath(); x.moveTo(w * 0.47, hz); x.lineTo(w * 0.53, hz); x.lineTo(w * 0.95, h); x.lineTo(w * 0.05, h); x.fill();
  x.fillStyle = "rgba(122,104,122,.8)"; x.fillRect(w * 0.46, hz - h * 0.1, w * 0.012, h * 0.1); x.fillRect(w * 0.528, hz - h * 0.1, w * 0.012, h * 0.1); x.fillRect(w * 0.445, hz - h * 0.115, w * 0.11, h * 0.016);
  const m = x.createLinearGradient(0, hz - h * 0.15, 0, hz + h * 0.15); m.addColorStop(0, "rgba(240,232,236,0)"); m.addColorStop(0.5, "rgba(240,232,236,.6)"); m.addColorStop(1, "rgba(240,232,236,0)");
  x.fillStyle = m; x.fillRect(0, hz - h * 0.15, w, h * 0.3);
};
// the ask: a writing desk in the mist, one sheet on it and a brass lever, portrait
const askArt = (x, w, h) => {
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#f3c6d8"); g.addColorStop(0.55, "#e7a3c0"); g.addColorStop(1, "#7a3d63"); x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 5; i++) { x.fillStyle = `rgba(255,240,246,${0.12 + i * 0.03})`; x.beginPath(); x.ellipse(w * (0.2 + 0.15 * i), h * (0.3 + 0.05 * (i % 2)), w * 0.4, h * 0.05, 0, 0, 7); x.fill(); }
  x.fillStyle = "#4a2440"; x.fillRect(w * 0.18, h * 0.62, w * 0.64, h * 0.035);                          // the desk top
  x.fillRect(w * 0.22, h * 0.655, w * 0.04, h * 0.2); x.fillRect(w * 0.74, h * 0.655, w * 0.04, h * 0.2); // legs
  x.save(); x.translate(w * 0.47, h * 0.6); x.rotate(-0.08); x.fillStyle = "#fff6ee"; x.fillRect(-w * 0.13, -h * 0.03, w * 0.26, h * 0.035); x.restore(); // the sheet
  x.strokeStyle = "#e9b560"; x.lineWidth = w * 0.02; x.beginPath(); x.moveTo(w * 0.72, h * 0.62); x.lineTo(w * 0.8, h * 0.5); x.stroke();
  x.fillStyle = "#f6cf7a"; x.beginPath(); x.arc(w * 0.8, h * 0.5, w * 0.03, 0, 7); x.fill();                // the brass lever
  x.save(); x.translate(w * 0.62, h * 0.26); x.rotate(0.4); x.fillStyle = "rgba(255,250,244,.85)"; x.beginPath(); x.moveTo(0, 0); x.lineTo(w * 0.09, h * 0.02); x.lineTo(w * 0.02, h * 0.05); x.fill(); x.restore(); // a paper flying off
};
// the lantern table: a hexagonal table seen from the stool, lanterns over it, a few stones on it, round
const lanternArt = (x, w, h) => {
  const g = x.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h / 2, w * 0.6); g.addColorStop(0, "#ffd79a"); g.addColorStop(0.5, "#c9782f"); g.addColorStop(1, "#3a1e12"); x.fillStyle = g; x.fillRect(0, 0, w, h);
  const hex = (cx, cy, r, fill) => { x.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; x.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a) * 0.62); } x.closePath(); x.fillStyle = fill; x.fill(); };
  hex(w / 2, h * 0.62, w * 0.36, "#6b3a1c"); hex(w / 2, h * 0.6, w * 0.33, "#a4652c");
  x.strokeStyle = "rgba(60,30,12,.55)"; x.lineWidth = 2;
  for (let i = -4; i <= 4; i++) { x.beginPath(); x.moveTo(w / 2 + i * w * 0.07 - w * 0.12, h * 0.44); x.lineTo(w / 2 + i * w * 0.07 + w * 0.12, h * 0.76); x.stroke(); x.beginPath(); x.moveTo(w / 2 + i * w * 0.07 + w * 0.12, h * 0.44); x.lineTo(w / 2 + i * w * 0.07 - w * 0.12, h * 0.76); x.stroke(); }
  [[0.42, 0.55, "#1c1410"], [0.55, 0.6, "#f4ead6"], [0.48, 0.66, "#1c1410"], [0.6, 0.52, "#f4ead6"], [0.36, 0.62, "#f4ead6"]].forEach(([a, b, c]) => { x.fillStyle = c; x.beginPath(); x.ellipse(w * a, h * b, w * 0.028, h * 0.018, 0, 0, 7); x.fill(); });
  [[0.25, 0.16], [0.5, 0.1], [0.75, 0.16]].forEach(([a, b]) => { const l = x.createRadialGradient(w * a, h * b, 0, w * a, h * b, w * 0.1); l.addColorStop(0, "rgba(255,240,200,1)"); l.addColorStop(1, "rgba(255,200,120,0)"); x.fillStyle = l; x.fillRect(0, 0, w, h); x.fillStyle = "#c23b22"; x.beginPath(); x.ellipse(w * a, h * b, w * 0.03, h * 0.04, 0, 0, 7); x.fill(); });
};
// the Between: the garden of two from above, a spirit by the water, teal
const betweenArt = (x, w, h) => {
  const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#1f6f6a"); g.addColorStop(1, "#0f3a44"); x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.fillStyle = "#2f8d7c"; x.beginPath(); x.ellipse(w * 0.45, h * 0.5, w * 0.36, h * 0.34, 0.2, 0, 7); x.fill();
  x.fillStyle = "#5fc7c0"; x.beginPath(); x.ellipse(w * 0.66, h * 0.62, w * 0.14, h * 0.1, -0.3, 0, 7); x.fill();   // the pool
  for (let i = 0; i < 14; i++) { x.fillStyle = i % 3 ? "#3fa36f" : "#7fd08a"; x.beginPath(); x.arc(w * (0.18 + R() * 0.5), h * (0.25 + R() * 0.5), w * 0.02 + R() * w * 0.02, 0, 7); x.fill(); }
  const s = x.createRadialGradient(w * 0.52, h * 0.56, 0, w * 0.52, h * 0.56, w * 0.09); s.addColorStop(0, "rgba(255,250,220,1)"); s.addColorStop(1, "rgba(180,255,230,0)"); x.fillStyle = s; x.fillRect(0, 0, w, h);
  x.fillStyle = "#f6f0d8"; x.beginPath(); x.arc(w * 0.52, h * 0.56, w * 0.025, 0, 7); x.fill();                        // the spirit
  x.fillStyle = "#e8d6a8"; [[0.3, 0.42], [0.36, 0.4]].forEach(([a, b]) => { x.beginPath(); x.arc(w * a, h * b, w * 0.018, 0, 7); x.fill(); }); // two cushions
};
// a corridor cabinet that is not lit in slice 1: an attract loop at low light (a few shared patterns)
const attract = (hue, k) => (x, w, h) => {
  x.fillStyle = lerpC("#120e18", hue, 0.35); x.fillRect(0, 0, w, h);
  x.fillStyle = lerpC("#120e18", hue, 0.7);
  if (k === 0) for (let i = 0; i < 6; i++) x.fillRect(w * 0.1, h * (0.15 + i * 0.12), w * (0.3 + 0.5 * ((i * 37) % 7) / 7), h * 0.05);
  else if (k === 1) for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(w * (0.2 + i * 0.15), h * (0.5 + 0.2 * Math.sin(i)), w * 0.05, 0, 7); x.fill(); }
  else { x.beginPath(); x.moveTo(w * 0.5, h * 0.2); x.lineTo(w * 0.8, h * 0.8); x.lineTo(w * 0.2, h * 0.8); x.fill(); }
  x.fillStyle = "rgba(0,0,0,.18)"; for (let y = 0; y < h; y += 4) x.fillRect(0, y, w, 1);
};
const marqueeArt = (name, hue, sub) => (x, w, h) => {
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, lerpC(hue, "#ffffff", 0.25)); g.addColorStop(1, hue); x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.fillStyle = "#1b1222"; x.textAlign = "center"; x.textBaseline = "middle";
  let fs = Math.round(h * (sub ? 0.42 : 0.56)); x.font = `${fs}px Marcellus, serif`; const tw = x.measureText(name.toUpperCase()).width; if (tw > w * 0.84) { fs = Math.floor(fs * w * 0.84 / tw); x.font = `${fs}px Marcellus, serif`; } x.fillText(name.toUpperCase(), w / 2, h * (sub ? 0.4 : 0.52));
  if (sub) { x.font = `${Math.round(h * 0.22)}px Marcellus, serif`; x.fillText(sub.toUpperCase(), w / 2, h * 0.78); }
};
const screenMat = (tex, k = 1) => new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1, 1, 1).multiplyScalar(k) });

/* ---------- geometry helpers ---------- */
function box(sx, sy, sz, x, y, z, mat, parent = G, rot = null) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); if (rot) m.rotation.copy(rot); parent.add(m); return m;
}
function cyl(r, h, x, y, z, mat, parent = G, n = 12, rot = null) {
  const g = new THREE.CylinderGeometry(r, r, h, n); g.translate(0, h / 2, 0);
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); if (rot) m.rotation.copy(rot); parent.add(m); return m;
}
function quad(sx, sy, mat, parent, pos, rot) { const m = new THREE.Mesh(new THREE.PlaneGeometry(sx, sy), mat); m.position.copy(pos); m.rotation.copy(rot); parent.add(m); return m; }

/* the controls on a panel: arrival.py's controls(), in the panel's frame (x along its width, y its normal, z toward the player) */
function controls(panel, w, players, buttons) {
  const span = w / players;
  for (let p = 0; p < players; p++) {
    const vc = -w / 2 + span * (p + 0.5), stick = vc - span * 0.26;
    box(0.075, 0.006, 0.075, stick, 0.048, 0, M.trim, panel);
    cyl(0.0065, 0.075, stick, 0.05, 0, M.metal, panel, 8);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.021, 10, 6), pick(BUTTON.slice(0, 6))); ball.position.set(stick, 0.14, 0); panel.add(ball);
    const rows = buttons >= 6 ? 2 : 1, per = buttons / rows, hue = pick(BUTTON);
    for (let r = 0; r < rows; r++) for (let k = 0; k < per; k++) {
      const u = stick + 0.085 + k * 0.042 + r * 0.012, v = rows === 2 ? 0.023 * (1 - 2 * r) : 0;
      cyl(0.0195, 0.006, u, 0.045, v, M.trim, panel, 12);
      cyl(0.0152, 0.016, u, 0.049, v, r === 0 ? hue : BUTTON[(BUTTON.indexOf(hue) + 1) % BUTTON.length], panel, 12);
    }
  }
}

/* what tells a player a cabinet takes a coin now (his note, 2026-11-03 19:44Z: "it should be obvious it can be interacted
   with"): its own lit coin slots, kept out of the merge so a drop can light them, and an INSERT COIN plate over the coin
   door that blinks in the cabinet's colour. A "lit soon" cabinet gets neither. */
const insertArt = hue => (x, w, h) => {
  x.fillStyle = "#140c1c"; x.fillRect(0, 0, w, h); x.strokeStyle = hue; x.lineWidth = 4; x.strokeRect(3, 3, w - 6, h - 6);
  x.fillStyle = hue; x.textAlign = "center"; x.textBaseline = "middle"; x.font = `${Math.round(h * 0.5)}px Marcellus, serif`; x.fillText("INSERT COIN", w / 2, h / 2 + 2);
};
function playCues(out, g, lit, y, w) {
  if (!lit || !out.slots) return;
  out.slotMat = glow(lit.route ? 0xffb347 : 0x5a3a30, lit.route ? 1.8 : 1);
  for (const s of out.slots) { s.material = out.slotMat; s.userData.keep = true; }
  if (!lit.route) return;
  out.insert = quad(Math.min(0.5, w * 0.72), 0.11, new THREE.MeshBasicMaterial({ map: canvasTex(256, 56, insertArt(lit.colour)), color: new THREE.Color(1.5, 1.5, 1.5), fog: false }), g, V(0, y, 0.018), new THREE.Euler(0, 0, 0));
  out.insert.userData.keep = true;
}

/* a paper ticket: its cabinet's colour, punched edges and a dashed border; the line's tickets, the tray's and the bundles' */
function paperTicket(x, w, h, hue) {
  x.fillStyle = hue; x.fillRect(0, 0, w, h); x.fillStyle = "rgba(255,255,255,.55)"; for (let y = 6; y < h; y += 12) { x.beginPath(); x.arc(0, y, 3, 0, 7); x.arc(w, y, 3, 0, 7); x.fill(); }
  x.strokeStyle = "rgba(30,20,30,.35)"; x.setLineDash([4, 4]); x.strokeRect(8, 10, w - 16, h - 20); x.setLineDash([]);
}
const ticketTexture = (hue, word = "") => canvasTex(64, 128, (x, w, h) => { paperTicket(x, w, h, hue);
  if (word) { x.save(); x.translate(w / 2, h / 2); x.rotate(-Math.PI / 2); x.fillStyle = "#1b1222"; x.textAlign = "center"; x.textBaseline = "middle";
    let fs = 22; x.font = `${fs}px Marcellus, serif`; const tw = x.measureText(word).width; if (tw > h * 0.78) { fs = Math.floor(fs * h * 0.78 / tw); x.font = `${fs}px Marcellus, serif`; }
    x.fillText(word, 0, 0); x.restore(); } });
let haloTex = null;
const halo = () => haloTex || (haloTex = canvasTex(128, 128, (x, w, h) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(0.4, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); }));

/* a lit cabinet's ticket tray, under its coin door. The tray holds two things the page switches on:
   - the paper ticket (level-designer finding 4, 2026-11-06): in the cabinet's colour, it rises 6 cm out of the slot when a
     round pays and stands there until it is kept or let go;
   - the waiting glow (position ah-waiting-tray-glows): while the ask's ticket waits for what came back, the tray's lip and
     a soft halo hold a steady light in the cabinet's colour, bright enough to find from the door alcove. It never blinks,
     so it does not call after a player who walks on. */
export const TICKET_DOWN = -0.03, TICKET_UP = 0.045;
function trayParts(out, g, lit, y) {
  if (!lit) return;
  const t = new THREE.Group(); t.position.set(0, y, 0); t.userData.keep = true; g.add(t);
  box(0.28, 0.07, 0.1, 0, 0, 0.05, M.brass, t);                                            // the tray's lip
  box(0.2, 0.004, 0.03, 0, 0.036, 0.03, M.trim, t);                                         // its slot
  out.trayGlow = quad(0.27, 0.06, glow(lit.colour, 2.4, { fog: false }), t, V(0, 0, 0.1015), new THREE.Euler(0, 0, 0));
  out.trayHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo(), color: new THREE.Color(lit.colour), transparent: true, opacity: 0.9, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
  out.trayHalo.position.set(0, 0.08, 0.26); out.trayHalo.scale.set(1.5, 1.0, 1); t.add(out.trayHalo);
  out.trayGlow.visible = out.trayHalo.visible = false;
  out.ticket = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.11), new THREE.MeshBasicMaterial({ map: ticketTexture(lit.colour), side: THREE.DoubleSide, color: new THREE.Color(0.95, 0.95, 0.95) }));
  out.ticket.position.set(0, TICKET_DOWN, 0.03); out.ticket.visible = false; t.add(out.ticket);
}

/* one cabinet, built in its own frame: the front at z = 0 facing +z (the aisle), the body behind it, x along the
   corridor. arrival.py's cabinet(), with its numbers. Returns the screen's world centre and normal, and its parts. */
function cabinet({ side, z, kind, lit = null, ch1 = false }) {
  const Tt = ch1 ? CH1_TYPE : TYPES[kind];
  const g = new THREE.Group(); g.position.set(side * AISLE, 0, z); g.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; G.add(g);
  const body = ch1 ? M.goldBody : pick(M.body);
  const { w, d, base, top, marq } = Tt; let [sw, sh, sz, tilt] = Tt.scr;
  if (lit && lit.round) tilt = lit.tilt;
  const face = -0.2 * d, tr = THREE.MathUtils.degToRad(tilt);
  const hue = lit ? lit.colour : pick(SCREEN_HUES);
  let sMat;
  if (ch1) sMat = screenMat(canvasTex(256, 192, roadMist), 1.1);
  else if (lit) sMat = screenMat(canvasTex(lit.id === "ask" ? 192 : 256, 256, { ask: askArt, lantern: lanternArt, between: betweenArt }[lit.id]), lit.route ? 1.25 : 0.6);   // a "lit soon" screen glows at half
  else sMat = ATTRACT[Math.floor(R() * ATTRACT.length)];
  const out = { group: g, hue, lit };
  if (lit) {   // the whole cabinet takes a tap (his note, 2026-11-03 19:44Z): one unseen box, kept out of the merge
    const hit = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, (top || base) + marq + 0.1, d + 0.3), new THREE.MeshBasicMaterial());
    hit.position.set(0, ((top || base) + marq) / 2, -d / 2 + 0.15); hit.visible = false; hit.userData.keep = true; hit.userData.cabinet = lit.id; g.add(hit); out.hit = hit;
  }
  const sRot = new THREE.Euler(-tr, 0, 0);
  const n = V(0, 0, 1).applyEuler(sRot);
  if (kind === "cocktail") {
    box(w, base, d, 0, base / 2, -d / 2, body, g);
    box(w + 0.04, 0.025, d + 0.04, 0, base + 0.0125, -d / 2, M.trim, g);
    out.screen = quad(sw, sh, sMat, g, V(0, base + 0.027, -d / 2), new THREE.Euler(-Math.PI / 2, 0, 0));
    for (const e of [-1, 1]) {
      const ex = e * (w / 2 + 0.07);
      box(0.14, 0.07, 0.30, ex, base - 0.06, -d / 2, M.panel, g);
      const p = new THREE.Group(); p.position.set(ex, base - 0.07, -d / 2); p.rotation.set(0, Math.PI / 2, e * 0.25); g.add(p); controls(p, 0.3, 1, 2);
      if (lit) cyl(0.17, 0.46, e * (w / 2 + 0.42), 0, -d / 2, M.stool, g, 10);       // played seated, a stool at each end
    }
    box(0.18, 0.22, 0.02, 0, 0.36, 0.005, M.trim, g);
    out.slots = [-0.04, 0.04].map(dx => box(0.02, 0.04, 0.012, dx, 0.4, 0.016, M.coin, g));
    playCues(out, g, lit, 0.55, w);
    trayParts(out, g, lit, 0.17);
    if (lit) { // its name on the aisle-facing apron (a cocktail table has no marquee)
      out.marquee = quad(w * 0.86, 0.11, new THREE.MeshBasicMaterial({ map: canvasTex(512, 64, marqueeArt(lit.name, hue)) }), g, V(0, base - 0.1, 0.004), new THREE.Euler(0, 0, 0));
    }
    out.screenAt = new THREE.Vector3(); out.screen.getWorldPosition(out.screenAt);
    out.normal = V(0, 1, 0);
    return out;
  }
  const cap = kind === "candy" ? 0.2 : 0;
  box(w, base, d, 0, base / 2, -d / 2, body, g);                                           // base
  box(w, top - base - cap, d * 0.8, 0, (base + top - cap) / 2, -d / 2 - d * 0.1, body, g); // upper, set back
  if (cap) {
    box(w, cap, d * 0.8 - cap, 0, top - cap / 2, -(0.6 * d + cap / 2), body, g);
    cyl(cap, w, -w / 2, top - cap, face - cap, body, g, 16, new THREE.Euler(0, 0, -Math.PI / 2));
  }
  box(w + 0.01, 0.1, 0.02, 0, 0.05, 0.005, M.trim, g);                                      // kick plate
  const doorY = Math.min(0.42, base * 0.45);
  box(0.22, 0.28, 0.02, 0, doorY, 0.005, M.trim, g);                                         // coin door
  out.slots = [-0.05, 0.05].map(dx => box(0.024, 0.045, 0.012, dx, doorY + 0.06, 0.016, M.coin, g));
  playCues(out, g, lit, doorY + 0.22, w);
  trayParts(out, g, lit, Math.max(0.16, doorY - 0.22));
  // the screen, leaning back by its type's tilt and standing proud of the body
  const round = lit && lit.round;
  let c;
  if (ch1) c = V(0, sz, -(0.1 * d - 0.022));
  else c = V(0, sz, face + 0.03 + ((round ? 0.27 : sh / 2) + 0.05) * Math.sin(tr));
  if (round) {
    out.screen = new THREE.Mesh(new THREE.CircleGeometry(0.27, 40), sMat); out.screen.position.copy(c); out.screen.rotation.copy(sRot); g.add(out.screen);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 40), M.trim); ring.rotation.set(Math.PI / 2 - tr, 0, 0); ring.position.copy(c).addScaledVector(n, -0.027); g.add(ring);
  } else {
    out.screen = quad(sw, sh, sMat, g, c, sRot);
    const bz = box(sw + 0.1, sh + 0.1, 0.05, 0, 0, 0, M.trim, g, sRot); bz.position.copy(c).addScaledVector(n, -0.027);
  }
  const half = round ? 0.32 : sh / 2 + 0.05;
  const low = c.clone().add(V(0, -half, 0).applyEuler(sRot));
  if (low.y > base + 0.02) box(w * 0.96, low.y - base, Math.abs(face - low.z) + 0.02, 0, (base + low.y) / 2, (face + low.z) / 2, body, g);
  // the top: a marquee housing over the screen, or the candy cabinet's thin lit strip on its rounded cap
  if (kind === "candy") {
    const a = THREE.MathUtils.degToRad(40);
    const mm = lit ? new THREE.MeshBasicMaterial({ map: canvasTex(512, 64, marqueeArt(lit.name, hue, lit.route ? "insert coin" : "lit soon")) }) : glow(pick(SCREEN_HUES), 0.16);
    out.marquee = quad(w * 0.8, lit ? 0.1 : 0.07, mm, g, V(0, top - cap + cap * Math.sin(a), face - cap + cap * Math.cos(a) + 0.006), new THREE.Euler(-(Math.PI / 2 - a), 0, 0));
    cyl(0.18, 0.48, 0, 0, 0.5, M.stool, g, 10);                                               // the stool it is played from
  } else if (marq) {
    box(w + 0.06, marq, d * 0.8 + 0.06, 0, top + marq / 2 - 0.01, -(0.6 * d - 0.03), M.trim, g);
    const mz = ch1 ? -(0.1 * d - 0.022) + 0.002 : face + 0.062 + 0.001;
    const mm = ch1 ? new THREE.MeshBasicMaterial({ map: canvasTex(512, 128, marqueeArt("Chapter 1", "#f2c55c")), fog: false })
      : lit ? new THREE.MeshBasicMaterial({ map: canvasTex(512, 128, marqueeArt(lit.name, hue, lit.route ? "insert coin" : "lit soon")) })
      : glow(pick(SCREEN_HUES), 0.16);
    out.marquee = quad(w * 0.92, marq * 0.7, mm, g, V(0, top + marq / 2 - 0.01, mz), new THREE.Euler(0, 0, 0));
    for (const e of [-1, 1]) box(0.04, top + marq * 0.6, d + 0.02, e * (w / 2 + 0.01), (top + marq * 0.6) / 2, -d / 2, M.trim, g);
  }
  // the control panel, sloped toward the player
  const pd = kind === "candy" ? 0.42 : 0.36;
  const p = new THREE.Group(); p.position.set(0, base + 0.02, 0.06); p.rotation.x = kind === "candy" ? 0.22 : 0.35; g.add(p);
  box(w + 0.02, 0.09, pd, 0, 0, 0, M.panel, p);
  controls(p, w, Tt.players, Tt.buttons);
  g.updateMatrixWorld(true);
  out.screenAt = new THREE.Vector3(); out.screen.getWorldPosition(out.screenAt);
  out.normal = n.clone().applyQuaternion(g.quaternion);
  return out;
}
const ATTRACT = [];

/* ---------- the hall ---------- */
export const SLOT_Z = s => -0.5 - s * PITCH;                     // slot 0 is the first pair past the alcove
export const GATE_Z = 5.2, LAST = 64;
export const SLOT = SLOT_Z;
export async function build({ today = "ask", still = false } = {}) {
  await document.fonts.load("64px Marcellus").catch(() => {});
  for (let i = 0; i < 9; i++) ATTRACT.push(screenMat(canvasTex(128, 96, attract(SCREEN_HUES[i % 6], i % 3)), 0.24));
  const L = SLOT_Z(LAST) - 2, LEN = GATE_Z - L;
  // floor, an arcade carpet runner down the aisle, ceiling, back walls (seen through the 0.45 m gaps)
  box(BACK_WALL * 2 + 0.2, 0.1, LEN, 0, -0.05, (GATE_Z + L) / 2, M.floor);
  const carpet = canvasTex(256, 256, (x, w, h) => { x.fillStyle = "#2b1d3a"; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { x.strokeStyle = ["#4a2f66", "#3b4f7a", "#6a2f55"][i % 3]; x.lineWidth = 3; x.beginPath(); x.arc(R() * w, R() * h, 6 + R() * 18, R() * 6, R() * 6 + 2); x.stroke(); }
    for (let i = 0; i < 60; i++) { x.fillStyle = ["#5a3f7a", "#46679a", "#7a3f68"][i % 3]; x.fillRect(R() * w, R() * h, 3, 3); } });
  carpet.wrapS = carpet.wrapT = THREE.RepeatWrapping; carpet.repeat.set(1.5, LEN / 2);
  const run = new THREE.Mesh(new THREE.PlaneGeometry(AISLE * 2 - 0.3, LEN), std(0xffffff, { map: carpet, roughness: 1 })); run.rotation.x = -Math.PI / 2; run.position.set(0, 0.003, (GATE_Z + L) / 2); G.add(run);
  box(BACK_WALL * 2 + 0.2, 0.1, LEN, 0, 3.25, (GATE_Z + L) / 2, M.ceil);
  for (const s of [-1, 1]) box(0.1, 3.2, LEN, s * BACK_WALL, 1.6, (GATE_Z + L) / 2, M.wall);

  // the cabinets: slice 1's three lit ones and Chapter 1 where CABINETS puts them, arrival.py's random types elsewhere
  const at = new Map(CABINETS.map(c => [c.side + ":" + c.slot, c]));
  const built = { decor: [] };
  for (let s = 0; s <= LAST; s++) {
    for (const side of [-1, 1]) {
      const c = at.get(side + ":" + s);
      if (c && c.type === "ch1") built[c.id] = cabinet({ side, z: SLOT_Z(s), ch1: true, kind: "upright" });
      else if (c) built[c.id] = cabinet({ side, z: SLOT_Z(s), kind: c.type, lit: c });
      else { const d = cabinet({ side, z: SLOT_Z(s), kind: pick(Object.keys(TYPES)) }); built.decor.push({ side, slot: s, screenAt: d.screenAt, normal: d.normal }); }
    }
    if (s % 4 === 0) box(0.08, 0.03, 0.9, 0, 3.18, SLOT_Z(s), M.strip);                 // strip lights overhead, receding
  }
  // the far glow at the end of the corridor (arrival.py's, fog-free)
  const far = new THREE.Mesh(new THREE.PlaneGeometry(BACK_WALL * 2, 3.3), new THREE.MeshBasicMaterial({ color: 0xf2a7c4, fog: false })); far.position.set(0, 1.6, L + 0.2); G.add(far);
  // the Chapter 1 cabinet's warm lamp, so the eye finds it from far off
  const c1 = built["chapter-1"]; box(0.12, 0.08, 0.12, -(AISLE - 0.25), 2.75, SLOT_Z(22), M.lamp);
  const haze = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(128, 128, (x, w, h) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, "rgba(255,210,140,.75)"); g.addColorStop(1, "rgba(255,190,120,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); }), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
  haze.position.set(-(AISLE - 0.1), 2.3, SLOT_Z(22)); haze.scale.set(2.6, 2.6, 1); scene.add(haze);   // Chapter 1, glowing through the haze
  const l1 = new THREE.PointLight(0xffb86b, 6, 6, 1.6); l1.position.set(-(AISLE - 0.35), 2.6, SLOT_Z(22)); scene.add(l1);

  /* the door alcove: the grey gate, the change machine on the left, the prize counter on the right */
  // the grey gate (round 1's, which he loved): two stone posts, a lintel and a tie beam, set in the hall's end wall
  for (const s of [-1, 1]) {
    box(0.34, 3.05, 0.34, s * 1.25, 1.525, GATE_Z, M.stone);
    box(0.44, 0.16, 0.44, s * 1.25, 0.08, GATE_Z, M.stoneDark);                                 // plinth
    box(BACK_WALL - 1.42, 3.2, 0.2, s * (1.42 + (BACK_WALL - 1.42) / 2), 1.6, GATE_Z + 0.12, M.facade); // end wall either side
    box(BACK_WALL - 1.42, 0.5, 0.2, s * (1.42 + (BACK_WALL - 1.42) / 2), 3.45, GATE_Z + 0.12, M.facade);
  }
  box(4.1, 0.24, 0.46, 0, 3.3, GATE_Z + 0.25, M.stone); box(0.34, 0.3, 0.34, -1.25, 3.08, GATE_Z + 0.25, M.stone); box(0.34, 0.3, 0.34, 1.25, 3.08, GATE_Z + 0.25, M.stone); box(3.4, 0.4, 0.2, 0, 3.0, GATE_Z + 0.12, M.facade); box(2.9, 0.14, 0.26, 0, 2.62, GATE_Z, M.stoneDark);
  // beyond the gate: the mist corridor, pale and soft, fog-free so it reads as light through the gate
  const mistMat = new THREE.ShaderMaterial({ fog: false, depthWrite: false, uniforms: { uA: { value: new THREE.Color(0xe6dbe2) }, uB: { value: new THREE.Color(0x9a8aa6) } },
    vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: "varying vec3 vP; uniform vec3 uA, uB; void main(){ float k = smoothstep(-0.2, 3.0, vP.y); gl_FragColor = vec4(mix(uB, uA, k), 1.0); }" });
  mistMat.side = THREE.BackSide;
  const outside = new THREE.Mesh(new THREE.SphereGeometry(60, 24, 12), mistMat); outside.renderOrder = -2; outside.position.set(0, 0, GATE_Z); scene.add(outside); // drawn first: seen only where the hall does not stand
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshBasicMaterial({ color: 0xa597ab, fog: false })); ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.005, GATE_Z + 20.3); scene.add(ground);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 30), new THREE.MeshBasicMaterial({ color: 0xc8bac0, fog: false })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.002, GATE_Z + 15.3); scene.add(road);
  const mistTex = canvasTex(128, 128, (x, w, h) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, "rgba(255,255,255,.9)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  for (let i = 0; i < 26; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex, color: MIST, transparent: true, opacity: 0.1 + R() * 0.14, depthWrite: false, fog: false }));
    const zz = GATE_Z - 1.2 + R() * 5; s.position.set((R() - 0.5) * 3.6, 0.15 + R() * 0.5, zz); const k = 1.4 + R() * 1.6; s.scale.set(k * 1.6, k * 0.5, 1); scene.add(s); }

  // the change machine (block metabolizing, gt-block-is-change-machine): a tall brass-and-plum changer with a lit window
  // where a block of ice sits melting, a hopper on top that takes let-go tickets, a coin tray, and its bench beside it
  const cm = new THREE.Group(); cm.position.set(-(AISLE + 0.35), 0, 2.7); cm.rotation.y = Math.PI / 2; G.add(cm);
  box(0.78, 1.9, 0.62, 0, 0.95, -0.12, M.goldBody, cm);
  box(0.84, 0.08, 0.68, 0, 1.94, -0.12, M.brass, cm);
  const win = canvasTex(256, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#ffd9a0"); g.addColorStop(1, "#d9823a"); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = "rgba(210,236,250,.9)"; x.beginPath(); x.moveTo(w * 0.3, h * 0.72); x.lineTo(w * 0.34, h * 0.36); x.lineTo(w * 0.62, h * 0.3); x.lineTo(w * 0.72, h * 0.66); x.closePath(); x.fill();
    x.fillStyle = "rgba(255,255,255,.7)"; x.fillRect(w * 0.4, h * 0.4, w * 0.06, h * 0.2);
    x.fillStyle = "rgba(160,210,240,.7)"; x.beginPath(); x.ellipse(w * 0.5, h * 0.8, w * 0.3, h * 0.05, 0, 0, 7); x.fill(); });   // the block, and its meltwater
  quad(0.5, 0.5, new THREE.MeshBasicMaterial({ map: win, color: new THREE.Color(1.2, 1.2, 1.2) }), cm, V(0, 1.32, 0.195), new THREE.Euler(0, 0, 0));
  box(0.58, 0.58, 0.04, 0, 1.32, 0.18, M.brass, cm);
  // its sign, so a player finds where coins come from (his note, 2026-11-03 19:44Z)
  quad(0.74, 0.2, new THREE.MeshBasicMaterial({ map: canvasTex(512, 140, marqueeArt("Change", "#f0a640", "rest here, the purse fills")) }), cm, V(0, 1.78, 0.2), new THREE.Euler(0, 0, 0));
  box(0.5, 0.12, 0.2, 0, 0.62, 0.24, M.trim, cm);                                                    // the coin tray
  for (const dx of [-0.12, 0, 0.1]) cyl(0.028, 0.01, dx, 0.68, 0.26, M.coin, cm, 14);               // coins in it
  const hop = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.1, 0.32, 16, 1, true), M.brass); hop.position.set(0, 2.14, -0.12); cm.add(hop); // the hopper
  box(0.08, 0.1, 0.04, 0.24, 1.0, 0.2, M.coin, cm);                                                  // the coin slot, lit
  box(0.44, 0.06, 1.1, -(AISLE + 0.12), 0.45, 1.25, M.wood); for (const dz of [0.8, 1.7]) box(0.38, 0.42, 0.06, -(AISLE + 0.12), 0.21, dz, M.wood); // the bench
  const lcm = new THREE.PointLight(0xffb36b, 3.5, 4.5, 1.6); lcm.position.set(-(AISLE - 0.4), 1.5, 2.7); scene.add(lcm);

  // the prize counter: a long low glass counter, and over it the line where kept tickets hang in their cabinet's colour
  const pc = new THREE.Group(); pc.position.set(AISLE + 0.3, 0, 2.7); G.add(pc);
  const pcLit = !FEW;
  box(0.55, 0.95, 1.7, 0, 0.475, 0, M.wood, pc); box(0.6, 0.05, 1.76, 0, 0.97, 0, M.trim, pc);
  box(0.5, 0.25, 1.6, 0, 1.12, 0, M.glass, pc);
  for (const dz of [-0.82, 0.82]) box(0.05, 1.6, 0.05, -0.2, 0.95 + 0.8, dz, M.wood, pc);              // the line's two poles
  const line = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.64, 4), M.trim); line.rotation.x = Math.PI / 2; line.position.set(-0.2, 2.5, 0); pc.add(line);
  lineAt.group.position.copy(pc.position); scene.add(lineAt.group); lineAt.ready = true;
  const lpc = new THREE.PointLight(0xffd6a0, 2.2, 4, 1.6); lpc.position.set(AISLE - 0.2, 2.6, 2.7); if (pcLit) scene.add(lpc);

  /* light: a low dusk fill, the strip lights' cool wash, each lit cabinet's own screen glow, and one warm lamp over
     today's game, which is how the hall points at it (FR-003: by light, never by text to the player) */
  scene.add(new THREE.HemisphereLight(0x9a88c0, 0x2a2036, 2.4));
  for (const z of FEW ? [] : [1.0, -6]) { const p = new THREE.PointLight(0xd9b8ff, 1.6, 9, 1.4); p.position.set(0, 2.5, z); scene.add(p); }
  const mistLight = new THREE.DirectionalLight(0xe8dde6, 1.4); mistLight.position.set(1.5, 4, GATE_Z + 8); mistLight.target.position.set(0, 1, GATE_Z - 2); scene.add(mistLight, mistLight.target); // the mist's pale light on the grey gate
  for (const id of FEW ? [] : ["ask", "lantern", "between"]) { const b = built[id]; const p = new THREE.PointLight(b.hue, 2.0, 3.2, 1.6); p.position.copy(b.screenAt).addScaledVector(b.normal, 0.5); scene.add(p); }
  const lamp = built[today in built ? today : "ask"];
  const spot = new THREE.SpotLight(0xffc98a, 18, 7, 0.42, 0.5, 1.4);
  spot.position.set(lamp.screenAt.x * 0.45, 3.1, lamp.screenAt.z); spot.target.position.copy(lamp.screenAt).setY(1.0); scene.add(spot, spot.target);
  box(0.22, 0.06, 0.22, lamp.screenAt.x * 0.45, 3.17, lamp.screenAt.z, M.lamp);

  built.changeMachine = { at: V(-(AISLE - 0.25), 0, 2.7), bench: V(-(AISLE - 0.1), 0, 1.25), hopper: V(-(AISLE + 0.35), 2.14, 2.7) };
  built.prizeCounter = { at: V(AISLE - 0.35, 0, 2.7) };
  built.mist = [];
  scene.children.forEach(o => { if (o.isSprite && o.material.color && o.material.color.getHex() === MIST) built.mist.push(o); });
  built.lit = ["ask", "lantern", "between"].map(id => built[id]);
  built.hits = built.lit.map(b => b.hit).filter(Boolean);
  mergeStatic(G);
  return built;
}

/* ---------- the prize counter's line: each kept ticket in its cabinet's colour, its word written small on it ----------
   `view` is hall.js lineView(): the tickets hanging on the line (fourteen at most) and the bundles of seven tied beneath
   it on the glass (position ah-line-ties-bundles). A tap on a bundle fans its tickets out over the counter, words
   showing; `fan` names that bundle, and -1 ties it back. No count is drawn. */
const lineAt = { group: new THREE.Group(), ready: false, hits: [] };
const TWINE = std(0xd8c49a, { roughness: 0.9 });
const ticketMesh = (t, w = 0.09, h = 0.18) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: ticketTexture(t.colour, t.word), side: THREE.DoubleSide, color: new THREE.Color(0.85, 0.85, 0.85) }));
export const lineHits = () => lineAt.hits;
/* the saved line has no cap: every kept ticket stays somewhere a player can see it (ah-line-ties-bundles), so after long
   play it can hold thousands. A tied ticket shows no word, so all tied tickets of one colour share one texture and one
   geometry; only the fanned bundle and the line draw their own (falsify, council #1123: 2,002 tickets after long play). */
const BUNDLE_GEO = new THREE.PlaneGeometry(0.08, 0.16), TIE_GEO = new THREE.BoxGeometry(0.09, 0.032, 0.012), KNOT_GEO = new THREE.SphereGeometry(0.009, 8, 6), bundleMats = new Map();
const bundleMat = hue => { if (!bundleMats.has(hue)) bundleMats.set(hue, new THREE.MeshBasicMaterial({ map: ticketTexture(hue), side: THREE.DoubleSide, color: new THREE.Color(0.85, 0.85, 0.85) })); return bundleMats.get(hue); };
export function hangLine(view, fan = -1) {
  const g = lineAt.group; if (!lineAt.ready) return;
  for (const o of [...g.children]) { g.remove(o); o.traverse(c => { if (c.material && c.material !== M.wood && c.material !== TWINE && ![BUNDLE_GEO, TIE_GEO, KNOT_GEO].includes(c.geometry)) { if (c.material.map) c.material.map.dispose(); c.material.dispose(); } if (c.geometry && ![BUNDLE_GEO, TIE_GEO, KNOT_GEO].includes(c.geometry)) c.geometry.dispose(); }); }
  lineAt.hits = [];
  const show = view.hanging, n = show.length;
  show.forEach((t, i) => {
    const dz = n === 1 ? 0 : -0.72 + 1.44 * i / Math.max(1, n - 1);
    const m = ticketMesh(t); m.position.set(-0.2, 2.38, dz); m.rotation.set(0, -Math.PI / 2, i % 2 ? 0.08 : -0.06); g.add(m);
    const peg = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.012), M.wood); peg.position.set(-0.2, 2.48, dz); g.add(peg);
  });
  const tied = new Map(), ties = [], knots = [], tmp = new THREE.Object3D();   // tied tickets drawn as one instanced mesh per colour
  // the bundles lie on the glass counter top (1.245 m), seven places along it, then a second layer on the first
  view.bundles.forEach((b, i) => {
    const k = i % 7, layer = Math.floor(i / 7), at = V(-0.04, 1.25 + layer * 0.03, -0.66 + k * 0.22);
    const bg = new THREE.Group(); bg.position.copy(at); bg.rotation.y = ((i * 37) % 11 - 5) * 0.02; g.add(bg);
    if (fan === i) {   // fanned: the seven stand up over the counter in an arc facing the aisle, words to the player
      const cz = Math.max(-0.4, Math.min(0.4, at.z));
      b.forEach((t, j) => { const u = (j - (b.length - 1) / 2) / 3;
        const m = ticketMesh(t); m.position.set(-0.26, 1.58 - Math.abs(u) * 0.05, cz + u * 0.26); m.rotation.set(0, -Math.PI / 2, -u * 0.32); g.add(m); });
      g.remove(bg);
      const hit = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.9), new THREE.MeshBasicMaterial()); hit.visible = false; hit.userData.bundle = i; hit.position.set(-0.26, 1.55, cz); g.add(hit);
      lineAt.hits.push(hit);
      return;
    }
    bg.updateMatrix();
    b.forEach((t, j) => { tmp.rotation.set(-Math.PI / 2, 0, ((j * 53) % 7 - 3) * 0.05); tmp.position.set(0, j * 0.0035, 0); tmp.updateMatrix();
      if (!tied.has(t.colour)) tied.set(t.colour, []); tied.get(t.colour).push(new THREE.Matrix4().multiplyMatrices(bg.matrix, tmp.matrix)); });
    tmp.rotation.set(0, 0, 0); tmp.position.set(0, 0.012, 0); tmp.updateMatrix(); ties.push(new THREE.Matrix4().multiplyMatrices(bg.matrix, tmp.matrix));   // the string round the middle
    tmp.position.set(-0.046, 0.026, 0); tmp.updateMatrix(); knots.push(new THREE.Matrix4().multiplyMatrices(bg.matrix, tmp.matrix));
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.2), new THREE.MeshBasicMaterial()); hit.visible = false; hit.userData.bundle = i; hit.position.set(0, 0.05, 0); bg.add(hit);
    lineAt.hits.push(hit);
  });
  const inst = (geo, mat, ms) => { if (!ms.length) return; const im = new THREE.InstancedMesh(geo, mat, ms.length); ms.forEach((m, k) => im.setMatrixAt(k, m)); g.add(im); };
  for (const [hue, ms] of tied) inst(BUNDLE_GEO, bundleMat(hue), ms);
  inst(TIE_GEO, TWINE, ties); inst(KNOT_GEO, TWINE, knots);

}

/* ---------- the visitors: real people in their own street clothes (his note on round 1, 2026-11-03: "they should look
   like real world people. Like someone walked off the street in normal clothes. They don't get the cultivation robes
   until they create their character") ----------
   The body is the Between's own (Average Dusk, mocap Walk and Idle, shaped and haired by wardrobe.js), so the player
   who later makes a character is the same figure. Here the robe and sash are hidden, and the clothes are drawn as
   colour on the body and the trouser shell by bone: a top on the chest and arms, jeans or trousers on the legs, shoes
   at the feet, plus a few solids (a hood, a cap, a bag strap, a backpack) that say "came in off the street". */
const loader = new GLTFLoader();
const STREET = {
  // the player: a hoodie, jeans, white trainers, the coin purse at the hip
  me: { look: { shape: "a", build: "average", skin: "light", style: "afro", colour: "black", outfit: "coat", dye: "violet" },
        top: "#6f7a5e", cuff: "#5c654d", sleeve: "long", legs: "#3e5a80", legsDark: "#2f4563", shoes: "#ece8df", shell: "hoodie", purse: true },
  // a visitor in a denim jacket over a white tee, black trousers, a cross-body bag
  denim: { look: { shape: "b", build: "slender", skin: "umber", style: "sweep", colour: "black", outfit: "coat", dye: "violet" },
        top: "#55759c", cuff: "#43607f", inner: "#efece6", sleeve: "long", legs: "#26252b", legsDark: "#1b1a1f", shoes: "#3a2c24", strap: "#2a2420", shell: "denim" },
  // a visitor in a red puffer jacket, grey trousers, a beanie, a backpack
  puffer: { look: { shape: "c", build: "average", skin: "olive", style: "page", colour: "dark_brown", outfit: "coat", dye: "violet" },
        top: "#b0443c", cuff: "#8e352f", sleeve: "long", legs: "#8a8790", legsDark: "#6d6a73", shoes: "#d9d4ca", beanie: "#2e3b4a", pack: "#3e4a3a", shell: "puffer" },
};
let gltfDusk = null;
export async function figure(kind = "me", look = null) {
  const S = look ? { ...STREET[kind], look: { ...STREET[kind].look, ...look, outfit: "coat", dye: "violet" } } : STREET[kind];
  const gl = gltfDusk || (gltfDusk = await loader.loadAsync("/between/m/dusk/average-dusk.glb"));
  const root = gl.scene; root.updateMatrixWorld(true);
  const bb = new THREE.Box3(); root.traverse(o => { if (o.isMesh) { if (o.isSkinnedMesh) { o.computeBoundingBox(); bb.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld)); } else bb.expandByObject(o); } });
  const obj = skClone(root), k = 1.7 / Math.max(bb.getSize(V(0, 0, 0)).y, 0.01);
  obj.scale.setScalar(k); obj.position.y = -bb.min.y * k;
  const wardrobe = dressFigure(obj, await loadParts(u => loader.loadAsync(u)));
  wardrobe.set(S.look);
  street(obj, wardrobe, S);
  obj.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
  const holder = new THREE.Group(); holder.add(obj); scene.add(holder);
  const mixer = new THREE.AnimationMixer(obj), acts = {};
  for (const nm of ["Walk", "Idle"]) { const c = gl.animations.find(a => a.name === nm); if (c) { acts[nm] = mixer.clipAction(c); acts[nm].play(); } }
  if (S.purse) {
    // the purse at the hip (FR-009): drawn as weight, no count; three coins hang it low and round
    const purse = new THREE.Group();
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), std(0x6a3b2a, { roughness: 0.7 })); bag.scale.set(1, 1.25, 0.8); purse.add(bag);
    const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 0.05, 10), std(0xc9a25a)); tie.position.y = 0.1; purse.add(tie);
    purse.position.set(-0.21, 0.88, 0.03); purse.scale.setScalar(1.25); holder.add(purse);
    var purseBag = bag;
  }
  return { holder, mixer, acts, wardrobe, obj, purse: S.purse ? purseBag : null,
    hang(w) { if (!this.purse) return; this.purse.scale.set(0.55 + 0.45 * w, 0.5 + 0.75 * w, 0.4 + 0.4 * w); this.purse.position.y = -0.03 * w; },   // fuller hangs lower and rounder
    set(walk) { if (acts.Walk) acts.Walk.setEffectiveWeight(walk ? 1 : 0); if (acts.Idle) acts.Idle.setEffectiveWeight(walk ? 0 : 1); },
    pose(dt) { mixer.update(dt); } };
}
function street(obj, wardrobe, S) {
  const L = wardrobe.layers, body = L.body;
  L.robe.visible = false;
  obj.traverse(o => { if (o.isSkinnedMesh && o !== body && o !== L.pants && o !== L.robe) o.visible = false; });   // the sash
  const bones = body.skeleton.bones.map(b => b.name)
  const g = body.geometry, col = g.attributes.color, P = g.attributes.position;
  const si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
  const topOf = j => { let b = 0, w = -1; for (let q = 0; q < 4; q++) if (sw.getComponent(j, q) > w) { w = sw.getComponent(j, q); b = si.getComponent(j, q); } return bones[b]; };
  const C = h => new THREE.Color(h);
  const top = C(S.top), cuff = C(S.cuff), legs = C(S.legs), legsDark = C(S.legsDark), shoes = C(S.shoes), inner = S.inner ? C(S.inner) : null;
  let minY = Infinity, maxY = -Infinity; for (let i = 0; i < P.count; i++) { minY = Math.min(minY, P.getY(i)); maxY = Math.max(maxY, P.getY(i)); }
  const H = maxY - minY, rel = i => (P.getY(i) - minY) / H;
  const isDark = i => col.getX(i) + col.getY(i) + col.getZ(i) < 0.06;
  for (let i = 0; i < col.count; i++) {
    const b = topOf(i), y = rel(i);
    if (isDark(i)) { if (y < 0.07) col.setXYZW(i, shoes.r * 0.85, shoes.g * 0.85, shoes.b * 0.85, 1); continue; }   // the feet: shoes
    let c = null;
    if (/head|neck/.test(b)) c = null;                                 // skin and hair stay
    else if (/wrist|hand/.test(b)) c = y > 0.5 && S.sleeve === "long" && /wrist/.test(b) ? null : null;
    else if (/elbow|forearm/.test(b)) c = S.sleeve === "long" ? (y < 0.5 ? cuff : top) : null;
    else if (/shoulder|arm|clav/.test(b)) c = top;
    else if (/spine|chest/.test(b)) c = (inner && Math.abs(P.getX(i)) < 0.05 * H && P.getZ(i) > 0) ? inner : top;
    else if (/hips/.test(b)) c = y > 0.5 ? top : legs;
    else if (/ankle|foot|toe/.test(b)) c = y < 0.035 ? shoes.clone().multiplyScalar(0.6) : shoes;
    else if (/hip|knee|leg/.test(b)) c = legs;
    if (c) col.setXYZW(i, c.r, c.g, c.b, 1);
  }
  col.needsUpdate = true;
  // the trouser shell: jeans to the ankle, a turned-up hem at the bottom
  L.pants.geometry.setIndex(Array.from(L.pantsIndex));   // every trouser triangle: no robe covers the legs now
  const pc = L.pants.geometry.attributes.color;
  for (let i = 0; i < L.pantsY.length; i++) { const c = L.pantsY[i] < 0.13 ? legsDark : legs; pc.setXYZW(i, c.r, c.g, c.b, 1); }
  pc.needsUpdate = true;
  // the solids, on the bones they ride
  const bone = n => obj.getObjectByName(n), mat = h => { const m = std(h, { roughness: 0.85 }); m.userData.noPaint = true; return m; };
  const onBone = (b, mesh, wx, wy, wz) => { obj.updateMatrixWorld(true); const s = b.getWorldScale(V(0, 0, 0)).x; mesh.scale.multiplyScalar(1 / s); b.add(mesh);
    mesh.position.copy(b.worldToLocal(b.getWorldPosition(V(0, 0, 0)).add(V(wx, wy, wz)))); mesh.quaternion.copy(b.getWorldQuaternion(new THREE.Quaternion()).invert()); return mesh; };
  const spine = bone("spine"), neck = bone("neck"), head = bone("head");
  if (S.shell) {   // the hoodie or jacket hangs over the trousers: the trouser shell stops under its hem
    const top = minY + (0.535 + 0.03) * H, ix = L.pantsIndex, o = [];
    for (let t = 0; t < ix.length; t += 3) if (!(L.pantsY[ix[t]] > top && L.pantsY[ix[t + 1]] > top && L.pantsY[ix[t + 2]] > top)) o.push(ix[t], ix[t + 1], ix[t + 2]);
    L.pants.geometry.setIndex(o);
    shell(obj, body, S, H, minY, mat, L);
  }
  if (S.beanie && head) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(S.beanie)); b.scale.set(1.5, 1.45, 1.5); onBone(head, b, 0, 0.07, -0.02);
    const cuffR = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.024, 6, 18), mat(S.beanie)); cuffR.rotation.x = Math.PI / 2; onBone(head, cuffR, 0, 0.065, -0.005);
  }
  if (S.pack && spine) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 0.13), mat(S.pack)); onBone(spine, p, 0, 0.17, -0.17);
    for (const x of [-0.08, 0.08]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.32, 0.012), mat("#2a2e28")); onBone(spine, st, x, 0.22, 0.1); }
  }
  if (S.strap && spine) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.6, 0.012), mat(S.strap)); st.rotation.z = 0.75; onBone(spine, st, 0, 0.18, 0.115);
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.06), mat(S.strap)); onBone(spine, bag, -0.17, -0.06, 0.08);
  }
}

/* the hoodie as its own garment: a shell grown off the body's torso and arms (as wardrobe.js grows the trousers off the
   legs), loose at the belly and tight at a ribbed hem and cuffs, with a kangaroo pocket, and the hood down: a deep
   pouch of cloth lying on the upper back, its opening ringing the neck. */
const SHELLS = { hoodie: 0, denim: 1, puffer: 2 };
function shell(obj, body, S, H, minY, mat, L) {
  const KIND = SHELLS[S.shell] ?? 0, LOFT = KIND === 2 ? 2.4 : KIND === 1 ? 0.8 : 1;   // a puffer stands off the body; denim lies close
  const g = body.geometry, P = g.attributes.position, N = g.attributes.normal, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
  const bones = body.skeleton.bones.map(b => b.name);
  const topOf = j => { let b = 0, w = -1; for (let q = 0; q < 4; q++) if (sw.getComponent(j, q) > w) { w = sw.getComponent(j, q); b = si.getComponent(j, q); } return bones[b]; };
  const rel = j => (P.getY(j) - minY) / H;
  const col = g.attributes.color, dark = j => col.getX(j) + col.getY(j) + col.getZ(j) < 0.06;
  // which body points the hoodie covers: the chest, shoulders and arms down to the wrist, and the hips to a hem low on them
  const HEM = 0.535, WRIST = new Map();
  const ok = j => { if (dark(j)) return false; const b = topOf(j), y = rel(j);
    if (/spine|shoulder|elbow/.test(b)) return y > HEM; if (/hips/.test(b)) return y > HEM - 0.06; if (/hipL|hipR/.test(b)) return y > HEM - 0.02; return false; };   // the big waist triangles reach below the hem; the shader cuts the hem clean
  // the candidates: the body's own triangles, and the waist and leg triangles wardrobe.js moved into the trouser shell
  const bodyIx = Array.from(g.index.array), legIx = Array.from(L.pantsIndex, k => L.pantsSrc[k]);
  const ix = bodyIx.concat(legIx), keep = [];
  for (let t = 0; t < ix.length; t += 3) if (ok(ix[t]) && ok(ix[t + 1]) && ok(ix[t + 2])) keep.push(ix[t], ix[t + 1], ix[t + 2]);
  const map = new Map(); for (const j of keep) if (!map.has(j)) map.set(j, map.size);
  { const o = []; for (let t = 0; t < bodyIx.length; t += 3) if (!(ok(bodyIx[t]) && ok(bodyIx[t + 1]) && ok(bodyIx[t + 2]))) o.push(bodyIx[t], bodyIx[t + 1], bodyIx[t + 2]); g.setIndex(o); } // && ok(ix[t + 1]) && ok(ix[t + 2]))) o.push(ix[t], ix[t + 1], ix[t + 2]); g.setIndex(o); }   // the body under the hoodie is not drawn
  // the lowest point of each sleeve (the cuff), by the arm's side
  let cuffY = { L: Infinity, R: Infinity };
  for (const j of map.keys()) if (/elbow/.test(topOf(j))) { const side = P.getX(j) > 0 ? "L" : "R"; cuffY[side] = Math.min(cuffY[side], P.getY(j)); }
  // the welded normal at each position (the body's seams split normals), so the shell grows without cracks
  const key = j => `${P.getX(j).toFixed(4)},${P.getY(j).toFixed(4)},${P.getZ(j).toFixed(4)}`, wn = new Map();
  for (const j of map.keys()) { const k = key(j); const o = wn.get(k) || wn.set(k, new THREE.Vector3()).get(k); o.x += N.getX(j); o.y += N.getY(j); o.z += N.getZ(j); }
  const n = map.size, pos = new Float32Array(n * 3), sI = new Uint16Array(n * 4), sW = new Float32Array(n * 4), paint = new Float32Array(n * 4), restA = new Float32Array(n * 5);
  const ease = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const top = new THREE.Color(S.top), rib = new THREE.Color(S.top).multiplyScalar(0.74), seam = new THREE.Color(S.top).multiplyScalar(0.5), pocket = new THREE.Color(S.top).multiplyScalar(0.86), hood = new THREE.Color(S.top).multiplyScalar(1.08);
  let yTop = 0; for (const j of map.keys()) if (!/elbow/.test(topOf(j))) yTop = Math.max(yTop, rel(j));
  for (const [j, k] of map) {
    const y = rel(j), b = topOf(j), nv = wn.get(key(j)).clone().normalize();
    const arm = /elbow|shoulder/.test(b) && Math.abs(P.getX(j)) > 0.11 * H;
    const cy = arm ? cuffY[P.getX(j) > 0 ? "L" : "R"] : null, dc = arm ? (P.getY(j) - cy) / H : 1;   // height above the cuff
    // loose: most at the belly and the forearm, gathered in at the ribbed hem and cuffs
    let off = 0.006 * H * LOFT;
    if (!arm) off += 0.012 * H * ease(0.75, 0.6, y) - 0.004 * H * ease(HEM + 0.035, HEM, y);
    else off += 0.006 * H * ease(0.0, 0.05, dc) - 0.004 * H * ease(0.03, 0.0, dc);
    pos.set([P.getX(j) + nv.x * off, P.getY(j) + nv.y * off * 0.3, P.getZ(j) + nv.z * off], k * 3);
    for (let q = 0; q < 4; q++) { sI[k * 4 + q] = si.getComponent(j, q); sW[k * 4 + q] = sw.getComponent(j, q); }
    const c = top;
    restA.set([P.getX(j) / H, y, P.getZ(j) / H, arm ? dc : -1, nv.z], k * 5);
    paint.set([c.r, c.g, c.b, 1], k * 4);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); sg.setAttribute("skinIndex", new THREE.BufferAttribute(sI, 4));
  sg.setAttribute("skinWeight", new THREE.BufferAttribute(sW, 4)); sg.setAttribute("color", new THREE.BufferAttribute(paint, 4));
  sg.setAttribute("rest", new THREE.InterleavedBufferAttribute(new THREE.InterleavedBuffer(restA, 5), 3, 0));
  sg.setAttribute("restArm", new THREE.InterleavedBufferAttribute(new THREE.InterleavedBuffer(restA, 5), 2, 3));
  sg.setIndex(keep.map(j => map.get(j))); sg.computeVertexNormals();
  // the hoodie's details drawn per pixel from each point's rest place, so they stay crisp on a low body mesh:
  // the ribbed neckline, hem and cuffs (fine ribs), the kangaroo pocket with its stitched edge and openings,
  // and the hood lying down on the back, a lighter doubled panel with a dark stitched rim and a soft shadow under it
  const sm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, side: THREE.DoubleSide }); sm.userData.noPaint = true;
  const U = { yTop: { value: yTop }, hem: { value: HEM }, kind: { value: KIND }, innerC: { value: new THREE.Color(S.inner || S.top) } };
  sm.onBeforeCompile = sh => { Object.assign(sh.uniforms, U);
    sh.vertexShader = "attribute vec3 rest;\nattribute vec2 restArm;\nvarying vec3 vRest;\nvarying vec2 vArm;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvRest = rest; vArm = restArm;");
    sh.fragmentShader = "uniform float yTop;\nuniform float hem;\nuniform int kind;\nuniform vec3 innerC;\nvarying vec3 vRest;\nvarying vec2 vArm;\n" + sh.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
      float x = abs(vRest.x), y = vRest.y; bool arm = vArm.x >= 0.0; bool back = vArm.y < -0.15 && vRest.z < 0.0; bool front = vArm.y > 0.2 && vRest.z > 0.0;
      if (!arm && y < hem) discard;
      vec3 base = diffuseColor.rgb, k = base;
      float ribs = 0.86 + 0.1 * step(0.5, fract((arm ? vRest.x * 0.0 + vRest.z : vRest.x) * 260.0));
      if (!arm && y > yTop - 0.02) k = base * ribs * 0.82;                                   // ribbed neckline
      if (!arm && y < hem + 0.032) k = base * ribs * 0.8;                                    // ribbed hem
      if (arm && vArm.x < 0.032) k = base * (0.86 + 0.1 * step(0.5, fract(atan(vRest.z, vRest.x) * 9.0))) * 0.8;   // ribbed cuffs
      if (kind == 0 && !arm && front) {                                                      // the kangaroo pocket
        float top = hem + 0.105, bot = hem + 0.035, wTop = 0.06, wBot = 0.085, t = (y - bot) / (top - bot), hw = mix(wBot, wTop, t);
        if (t > 0.0 && t < 1.0 && x < hw) {
          k = base * 0.9;
          if (t > 0.94 || hw - x < 0.004) k = base * 0.55;                                     // stitched edge
          if (x > hw - 0.028 && t > 0.25 && t < 0.92 && hw - x > 0.004) { float o = (x - (hw - 0.028)) / 0.028; if (abs(o - t * 0.9) < 0.06) k = base * 0.45; }   // the hand openings
        }
        if (abs(x - 0.012) < 0.0022 && y > yTop - 0.11 && y < yTop - 0.02) k = vec3(0.92, 0.9, 0.86);   // drawstrings
      }
      if (kind == 0 && !arm && back) {                                                       // the hood, down
        float hy = (yTop - 0.012 - y) / 0.15, hw = 0.085 * sqrt(max(0.0, 1.0 - pow(max(hy, 0.0), 2.2)));
        if (hy > -0.05 && hy < 1.0 && x < hw) {
          k = base * mix(1.16, 0.9, smoothstep(0.1, 1.0, hy)) * (1.0 - 0.12 * smoothstep(0.5, 1.0, x / hw));   // the doubled cloth, catching light at the top, rounding away at the sides
          float m = 0.07 * sqrt(max(0.0, 1.0 - pow(hy / 0.26, 2.0)));                                          // the hood's mouth, open at the neck
          if (x < m && hy < 0.26) k = base * mix(0.38, 0.6, hy / 0.26);
          if (hw - x < 0.006 || hy > 0.93) k = base * 0.5; if (abs(x) < 0.0025 && hy > 0.3) k = base * 0.78; }   // panel, rim, centre seam
        else if (hy > 0.0 && hy < 1.12 && x < hw + 0.012) k = base * 0.68;                      // its shadow on the back
      }
      if (kind == 1) {                                                                       // a denim jacket, open over a tee
        k = base * (0.94 + 0.06 * step(0.5, fract((vRest.x + vRest.y) * 340.0)));           // the twill
        if (!arm && y < hem + 0.03) k = base * 0.82;                                         // the waistband
        if (arm && vArm.x < 0.03) k = base * 0.82;                                           // the cuffs
        if (!arm && front) {
          float open = mix(0.012, 0.045, smoothstep(yTop - 0.02, yTop - 0.16, y));          // the fronts part toward the collar
          if (x < open) k = innerC * 0.95;                                                   // the tee under it
          else if (x < open + 0.004) k = base * 0.55;                                        // the fronts' stitched edge
          if (y > yTop - 0.11 && y < yTop - 0.065 && x > 0.035 && x < 0.075) k = base * (y > yTop - 0.075 ? 0.6 : 0.88);   // chest pockets and their flaps
          if (x > open + 0.004 && x < open + 0.012 && fract((y - hem) * 28.0) < 0.18 && y < yTop - 0.03) k = vec3(0.78, 0.68, 0.48);   // the buttons
        }
        if (!arm && y > yTop - 0.03) k = base * 0.78;                                         // the collar, turned down
        if (abs(fract(y * 9.0) - 0.5) < 0.006 && !arm && !front) k = base * 0.7;              // the back's yoke seam
      }
      if (kind == 2) {                                                                       // a puffer, quilted in channels
        float ch = fract((y - hem) * 22.0); k = base * (0.82 + 0.26 * sin(ch * 3.14159));    // each channel full in the middle, stitched at its edges
        if (arm) { float c = fract(vArm.x * 16.0); k = base * (0.82 + 0.26 * sin(c * 3.14159)); if (vArm.x < 0.025) k = base * 0.6; }
        if (!arm && y > yTop - 0.04) k = base * 0.9;                                          // the stand collar
        if (!arm && front && x < 0.004) k = vec3(0.2, 0.2, 0.22);                             // the zip
        if (!arm && y < hem + 0.018) k = base * 0.62;                                         // the hem's binding
      }
      if (DEBUGY) k = vec3(fract(y * 20.0), step(0.6, y), 0.0);
      diffuseColor.rgb = k;`.replace("DEBUGY", Q.get("dbg") ? "true" : "false")); };
  sm.customProgramCacheKey = () => "street-shell";
  const shell = new THREE.SkinnedMesh(sg, sm); shell.frustumCulled = false; body.parent.add(shell); shell.bind(body.skeleton, body.bindMatrix);
  // the hood down, on the spine bone, placed against the shell's own back at the shoulders (rest pose = bind pose)
  obj.updateMatrixWorld(true);
  const spine = obj.getObjectByName("spine"), neck = obj.getObjectByName("neck");
  let backZ = Infinity, neckR = 0, neckN = 0; const nk = new THREE.Vector3(), w = new THREE.Vector3();
  neck.getWorldPosition(nk);
  for (const [j, k] of map) { const y = rel(j); if (y > 0.76 && y < 0.8 && Math.abs(pos[k * 3]) < 0.06 * H) { w.set(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]).applyMatrix4(body.matrixWorld); backZ = Math.min(backZ, w.z); } }
  for (let j = 0; j < P.count; j++) if (/neck/.test(topOf(j))) { w.fromBufferAttribute(P, j).applyMatrix4(body.matrixWorld); if (Math.abs(w.y - (nk.y - 0.02)) < 0.03) { neckR += Math.hypot(w.x - nk.x, w.z - nk.z); neckN++; } }
  neckR = neckN ? neckR / neckN : 0.055;
  let frontZ = -Infinity, frontY = 0;
  for (const [j, k] of map) { const y = rel(j); if (y > 0.775 && y < 0.79 && Math.abs(pos[k * 3]) < 0.035 * H) { w.set(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]).applyMatrix4(body.matrixWorld); if (w.z > frontZ) { frontZ = w.z; frontY = w.y; } } }
  const put = (m, at) => { const sc = spine.getWorldScale(new THREE.Vector3()); m.scale.divide(sc); spine.add(m); m.position.copy(spine.worldToLocal(at.clone()));
    m.quaternion.premultiply(spine.getWorldQuaternion(new THREE.Quaternion()).invert()); return m; };
  // the drawstrings, hanging from the front of the ring
  return shell;
}
