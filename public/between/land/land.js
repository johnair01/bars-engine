/* The episode's first land, walked (Six-faces-council charge-to-world, build 3; his yes on ctw-locations-look-1 and
   ctw-nook-look-2, 2026-10-29).

   You come in from the nook: the map stand unrolls your charge into an episode, you walk to the doorway, and you step out
   here, at the gap in a ring of trees, through an arch of roots that is the doorway's other side. The place is the
   episode sheet's encounter location (the sample player's Unfinished Clearing), built from its brief by ./place.js:
   the forest for its Wood land, the week's weather over it, and one piece for each of its three aspects.

   What there is to do is the place's own: the bar of music hums, loops and stops mid-phrase; the stump at the middle
   answers any note you sound, even a wrong one (the sheet's secret), and each note you give it carries the bar one note
   further, until the song is played to its end and the rain stops (another of the sheet's secrets). Then the arch takes
   you home. Nothing is saved: the charge rides over from the nook in this tab's sessionStorage, or is the sample's.

   Reused, not redrawn: the clearing's trees, instruments, stump, staff, ground, grass, mist and rain are stills round
   2026-10-28-ctw-locations-1's scenes.js (the blockout he said yes to), moved into a group so they merge and walk;
   hollow.js lends its bark, root and moss; paint.js paints it; the figure is the Between's own (wardrobe.js on Average
   Dusk, stance.js blending Walk and Idle), with the round's toolbag on its back; the roots and mushrooms are
   procgen.py's (forest-kit.glb, tools/blender-cloud/forest_kit.py); the ferns, grass clumps, mossy rocks and the one
   pitcher plant are the BlenderKit greenery picks (CC0, greenery/README.md).

   Build 4 (his B on ctw-walk-look-1, 2026-11-02): you arrive watching yourself step out of the arch, then the camera
   settles behind you; the toolbag rides the back smoothed, not shaken by the walk's own noise; a path out of the far
   side of the ring leads to the episode's second land, the Scale-House (?place=scale-house, ./scale-house.js).

   The block's room, slice 1 (his A on bm-room-look-2, 2026-11-02): when the charge that came through the doorway is dense
   (its weather a storm or a season), the clearing is the block's room: ice at the foot of what stands, and three stands on
   the floor (Face it, Talk to it, Be it) that melt it to water, mist and a clearing (../block-room.js). ?block=ice|water|gas|clear
   opens it at that state with the sample's charge.

   Build 5 (his A on ctw-walk-look-2, 2026-11-02): over the laid plank, the far bank's path leads to the episode's third land,
   the Friends' Fire (?place=friends-fire, ./friends-fire.js): sit on the empty crate, play what you have so far, and Oriel
   plays it on to its end. The clearing keeps the notes you gave the stump (sessionStorage "ctw-song") for Oriel to play.

   Previews: ?at=stump stands you at the stump, ?song=done opens with the song played to its end, ?paint=0 as the Between,
   ?place=scale-house the second land (with ?at=balance, ?at=bridge, ?bag=pan, ?plank=laid), ?place=friends-fire the third
   (with ?at=crate sat on your crate, ?song=played the song already played on, ?song=1,3,0,4 the stump's notes seeded,
   ?fire=seals|tag|oriel|card a step of the crate opened for a frame). The crate's song is ./fire-song.js, ported from the
   council's reel round 2 (Wendell's A on ctw-fire-reel-look-2): you play the seals, name what would block you, put it in
   Oriel's hand, and Oriel plays it home from your last note, the five seals lit above Oriel. */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as skClone } from "three/addons/utils/SkeletonUtils.js";
import { buildHollow, mergeStatic, mergeByParent, rng, hash } from "../hollow.js";
import { installPaint } from "../paint.js";
import { loadParts, dressFigure } from "../wardrobe.js";
import { stance, clipWeights, FADE, CRATE_SIT, SEAT_PAD } from "../stance.js";
import { parseLook } from "../../calrunia/look.js";
import { read, sheet, locations } from "../../calrunia/episode-sheet.js";
import { plan, strongStart, secretsHere, takeHome, friendHere } from "./place.js";
import * as SH from "./scale-house.js";
import * as FF from "./friends-fire.js";
import * as FS from "./fire-song.js";
import * as CH from "./chamber.js";
import { kept as keptPieces, SAMPLE as KEPT_SAMPLE } from "../kept.js";
import { mountRoom, densityOf, STATES } from "../block-room.js";
installPaint();

const Q = new URLSearchParams(location.search);
const PLACE = ["scale-house", "friends-fire", "chamber"].includes(Q.get("place")) ? Q.get("place") : "clearing";
const LOW = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || Math.min(innerWidth, innerHeight) < 600;
const $ = s => document.querySelector(s);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const step = m => { const e = $("#loadStep"); if (e) e.textContent = m; };

/* ---------- renderer, scene, camera ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: !LOW, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
$("#stage").appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
function resize() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener("resize", resize); resize();
const G = new THREE.Group(); scene.add(G);          // everything that stands still: merged once built
const add = o => { G.add(o); return o; };

/* ===================================================================================================
   The heavy forest and the clearing (stills round 2026-10-28-ctw-locations-1, scenes.js, moved into G)
   =================================================================================================== */
const CLR = 6.6;                     // the ring of trees
const ARCH = V(0, 0, 9.6);           // the doorway's other side, at the gap in the ring
const STUMP_R = 1.35;
function n2(x, z) { return Math.sin(x * 0.37 + Math.sin(z * 0.23)) * 0.5 + Math.sin(z * 0.41 + x * 0.17) * 0.35 + Math.sin(x * 1.3 + z * 1.1) * 0.15; }
let groundExtra = () => 0;          // the Scale-House cuts its gully into the ground
function groundH(x, z) { const d = Math.hypot(x, z); return Math.max(0, d - 8) * 0.06 + n2(x, z) * 0.12 * Math.min(1, d / 6) + groundExtra(x, z); }
/* the trodden ways: in from the arch, and out of the far side of the ring toward the Scale-House */
const OUT = V(0, 0, -CLR + 0.4);     // where the path out leaves the ring
const clearingPath = (x, z) => (Math.abs(x) < 1.1 && z > CLR - 1 && z < ARCH.z + 0.5) || (Math.abs(x + Math.max(0, -z - CLR) * 0.25) < 1.0 && z < -CLR + 1.6 && z > -CLR - 9);
let glowTex = null;
function glowSprite(pos, size, color, opacity, normal = false, parent = scene) {
  if (!glowTex) { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, "rgba(255,255,255,.55)"); g.addColorStop(0.6, "rgba(255,255,255,.12)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); glowTex = new THREE.CanvasTexture(c); glowTex.colorSpace = THREE.SRGBColorSpace; }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity, depthWrite: false, fog: false, blending: normal ? THREE.NormalBlending : THREE.AdditiveBlending }));
  s.position.copy(pos); s.scale.set(size, size, 1); parent.add(s); return s;
}
function duskSky(toward, low, hor, up, warm) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTo: { value: toward.clone().normalize() }, uL: { value: new THREE.Color(low) }, uH: { value: new THREE.Color(hor) }, uU: { value: new THREE.Color(up) }, uW: { value: new THREE.Color(warm) } },
    vertexShader: "varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: `varying vec3 vD; uniform vec3 uTo, uL, uH, uU, uW;
      void main(){ float h = vD.y; vec3 c = mix(uH, uU, smoothstep(0.02, 0.7, h)); c = mix(uL, c, smoothstep(-0.15, 0.02, h));
        float s = max(dot(vD, uTo), 0.0); c += uW * (pow(s, 5.0) * 0.4 + pow(s, 40.0) * 0.5); gl_FragColor = vec4(c, 1.0); }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), mat); dome.renderOrder = -2; scene.add(dome);
  return mat;
}
let groundMesh = null;
function ground(M, colA, colB, clearR, trodden = clearingPath) {
  const N = LOW ? 140 : 220, G2 = new THREE.PlaneGeometry(160, 160, N, N); G2.rotateX(-Math.PI / 2);
  const p = G2.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color(), A = new THREE.Color(colA), B = new THREE.Color(colB), CL = new THREE.Color(0x7c8a52);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, groundH(x, z));
    const w = n2(x * 2.1, z * 2.1) * 0.5 + 0.5; c.copy(A).lerp(B, w * 0.8); const d = Math.hypot(x, z); if (d < clearR) c.lerp(CL, (1 - d / clearR) * 0.7);
    if (trodden(x, z)) c.lerp(new THREE.Color(0x5c5238), 0.45);   // the trodden ways
    col.set([c.r, c.g, c.b], i * 3); }
  G2.setAttribute("color", new THREE.BufferAttribute(col, 3)); G2.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ map: M.moss.map.clone(), vertexColors: true, roughness: 1 }); m.map.repeat.set(50, 50); m.map.needsUpdate = true;
  groundMesh = new THREE.Mesh(G2, m); groundMesh.userData.keep = true; scene.add(groundMesh);
}
function grass(r, n, clearR, avoid = () => false) {
  const blade = new THREE.ConeGeometry(0.03, 1, 3); blade.translate(0, 0.5, 0);
  const im = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), n), o = new THREE.Object3D(), cc = new THREE.Color(); let k = 0;
  for (let t = 0; k < n && t < n * 4; t++) { const a = r() * 6.28, d = Math.sqrt(r()) * 26, x = Math.cos(a) * d, z = Math.sin(a) * d; if (avoid(x, z)) continue;
    const inC = d < clearR, h = inC ? 0.08 + r() * 0.12 : 0.25 + r() * 0.45;
    o.position.set(x, groundH(x, z) - 0.02, z); o.rotation.set((r() - 0.5) * 0.5, r() * 6.28, (r() - 0.5) * 0.5 + (inC ? 0 : 0.35)); o.scale.set(1, h, 1); o.updateMatrix(); im.setMatrixAt(k, o.matrix);
    cc.setHex(inC ? 0x6e7e40 : 0x34401e).lerp(new THREE.Color(0x4a5426), r() * 0.6); im.setColorAt(k++, cc); }
  im.count = k; scene.add(im);
}
/* one tree: a tapered, flared trunk in the hollow's bark; roots; branches; heavy dark leaf masses.
   heavy > 0 bends branches down to the ground (the Weigher's effect at the edge of things). */
function tree(M, r, x, z, { h = 9, rad = 0.45, heavy = 0, canopy = true, toward = null, keepClear = () => false } = {}) {
  const g = new THREE.Group(); g.position.set(x, groundH(x, z) - 0.1, z); add(g);
  const geo = new THREE.CylinderGeometry(rad * 0.55, rad, h, LOW ? 10 : 14, LOW ? 10 : 18, true); geo.translate(0, h / 2, 0);
  const p = geo.attributes.position, col = new Float32Array(p.count * 3), lean = (r() - 0.5) * 0.3;
  for (let i = 0; i < p.count; i++) { const px = p.getX(i), py = p.getY(i), pz = p.getZ(i), a = Math.atan2(pz, px);
    const flare = 1 + Math.max(0, 1 - py / 1.4) ** 2 * 0.9 * (0.8 + 0.4 * Math.sin(a * 5)), bump = 1 + Math.sin(a * 7 + py * 1.3) * 0.06;
    p.setXYZ(i, px * flare * bump + lean * py * py / h * 0.2, py, pz * flare * bump);
    const k = 0.55 + 0.25 * Math.sin(a * 9 + py * 2) + Math.min(0.2, py * 0.03); col.set([k * 0.92, k * 0.9, k * 0.82], i * 3); }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, M.trunkV));
  for (let i = 0; i < 5; i++) { const a = r() * 6.28, len = 1 + r() * 1.4, d = V(Math.cos(a), 0, Math.sin(a));
    const pts = [V(d.x * rad * 0.6, 0.9, d.z * rad * 0.6), V(d.x * (rad + len * 0.4), 0.35, d.z * (rad + len * 0.4)), V(d.x * (rad + len), -0.05, d.z * (rad + len))];
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, rad * 0.22, 6), M.rootM)); }
  const leafMass = (pos, s) => { const w = pos.clone().add(g.position); if (keepClear(w)) return; const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), M.foliage); m.position.copy(pos); m.scale.set(s * (1 + r() * 0.4), s * (0.6 + r() * 0.3), s * (1 + r() * 0.4)); m.rotation.y = r() * 6; g.add(m); };
  if (canopy) for (let i = 0; i < 6; i++) { const a = r() * 6.28, d = 1 + r() * 2.2; leafMass(V(Math.cos(a) * d, h * 0.82 + r() * h * 0.25, Math.sin(a) * d), 1.6 + r() * 1.2); }
  const nb = heavy > 0 ? 3 : 2;
  for (let i = 0; i < nb; i++) {
    let a = r() * 6.28; if (toward && i === 0) a = Math.atan2(toward.z - z, toward.x - x) + (r() - 0.5) * 0.6;
    const d = V(Math.cos(a), 0, Math.sin(a)), y0 = 2.6 + r() * 2.5, len = 3 + r() * 2.5;
    const sag = heavy > 0 ? y0 - 0.5 - r() * 0.5 : -0.8;
    const pts = [V(d.x * rad * 0.5, y0, d.z * rad * 0.5), V(d.x * len * 0.4, y0 + 0.5 - sag * 0.2, d.z * len * 0.4), V(d.x * len * 0.8, y0 - sag * 0.65, d.z * len * 0.8), V(d.x * len, y0 - sag, d.z * len)];
    if ([1, 2, 3].some(j => keepClear(pts[j].clone().add(g.position)))) continue;
    const curve = new THREE.CatmullRomCurve3(pts);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 20, rad * 0.2, 6), M.trunk));
    for (let k = 0; k < 4; k++) { const q = curve.getPointAt(0.55 + k * 0.14); leafMass(q.clone().add(V(0, -0.3 - k * 0.12 * heavy, 0)), 0.55 + r() * 0.4 + heavy * 0.15); }
  }
  return g;
}
function mist(r, n, color, op, near) { for (let i = 0; i < n; i++) { const a = r() * 6.28, d = near + r() * 18; glowSprite(V(Math.cos(a) * d, 0.5 + r() * 1.6, Math.sin(a) * d), 8 + r() * 8, color, op, true); } }
function fireflies(r, n, color, R) {
  const pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * R; pos.set([Math.cos(a) * d, 0.4 + r() * 3.2, Math.sin(a) * d], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  glowSprite(V(0, -50, 0), 0.0001, 0, 0);
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ map: glowTex, size: 0.14, color, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(pts); return pts;
}
/* light rain: short streaks, slanted, thin and pale (the week's Sadness); it falls round wherever you are */
function rain(r, n) {
  const pos = new Float32Array(n * 6), seed = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) seed.set([(r() - 0.5) * 30, (r() - 0.5) * 30, r() * 9], i * 3);
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({ color: 0xd8e4e8, transparent: true, opacity: 0.32, depthWrite: false });
  const lines = new THREE.LineSegments(g, mat); lines.frustumCulled = false; scene.add(lines);
  return { lines, mat, update(t, at) {
    for (let i = 0; i < n; i++) { const x = at.x + seed[i * 3], z = at.z + seed[i * 3 + 1], y = ((seed[i * 3 + 2] - t * 7.5) % 9 + 9) % 9;
      pos.set([x, y, z, x + 0.05, y - 0.45, z + 0.02], i * 6); }
    g.attributes.position.needsUpdate = true;
  } };
}

/* ---------- the clearing's pieces ---------- */
const instruments = [];   // { kind, at (where it sounds), stand (where you stand to play it), note }
function lute(M, at, face) {   // a lute grown out of the bark: the body half sunk in the trunk, the neck running up it
  const g = new THREE.Group(); g.position.copy(at); g.lookAt(at.clone().add(face)); add(g);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), M.lutewood); body.scale.set(0.8, 1.05, 0.38); g.add(body);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), M.dark); hole.position.set(0, 0.12, 0.19); g.add(hole);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.85, 0.06), M.lutewood); neck.position.set(0, 0.9, 0.12); g.add(neck);
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.26, 0.06), M.lutewood); box.position.set(0, 1.4, 0.02); box.rotation.x = -0.8; g.add(box);
  for (let s = -2; s <= 2; s++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.3, 3), M.string); st.position.set(s * 0.02, 0.62, 0.2); g.add(st); }
  for (let k = 0; k < 3; k++) g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-0.4, -0.3 + k * 0.3, -0.05), V(0, -0.1 + k * 0.4, 0.2), V(0.42, 0.1 + k * 0.25, -0.05)]), 10, 0.03, 5), M.rootM));
}
function drum(M, at, s = 1) {   // a drum skin stretched in the roots
  const g = new THREE.Group(); g.position.copy(at); g.scale.setScalar(s); add(g);
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.4, 0.55, 22, 1, true), M.lutewood); shell.position.y = 0.27; g.add(shell);
  const skin = new THREE.Mesh(new THREE.CircleGeometry(0.45, 22), M.skin); skin.rotation.x = -Math.PI / 2; skin.position.y = 0.55; g.add(skin);
  for (let k = 0; k < 4; k++) { const a = k * 1.57 + 0.4; g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(Math.cos(a) * 0.9, -0.05, Math.sin(a) * 0.9), V(Math.cos(a) * 0.5, 0.6, Math.sin(a) * 0.5), V(Math.cos(a + 0.6) * 0.3, 0.62, Math.sin(a + 0.6) * 0.3)]), 10, 0.05, 5), M.rootM)); }
}
function pipes(M, at, face, n = 6) {  // pipes growing down from a branch
  const g = new THREE.Group(); g.position.copy(at); add(g);
  for (let k = 0; k < n; k++) { const L = 0.5 + k * 0.17; const pp = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, L, 10), M.brass); pp.position.set((k - n / 2) * 0.11, -L / 2, 0); g.add(pp);
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 5, 10), M.brassDark); mouth.position.set((k - n / 2) * 0.11, -L, 0); mouth.rotation.x = Math.PI / 2; g.add(mouth); }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, n * 0.12 + 0.3, 6), M.trunk); bar.rotation.z = Math.PI / 2; bar.position.set(-0.05, 0.02, 0); g.add(bar);
  g.lookAt(g.position.clone().add(face));
}
function horn(M, at, face) {   // a horn curling out of the trunk
  const d = face.clone().normalize();
  const pts = [at.clone(), at.clone().addScaledVector(d, 0.35).add(V(0, 0.35, 0)), at.clone().addScaledVector(d, 0.55).add(V(0, 0.05, 0)), at.clone().addScaledVector(d, 0.85).add(V(0, -0.05, 0))];
  add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.05, 8), M.brass));
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.05, 0.32, 18, 1, true), M.brass); bell.position.copy(pts[3]).addScaledVector(d, 0.12); bell.lookAt(bell.position.clone().add(d)); bell.rotateX(Math.PI / 2); add(bell);
}
function harp(M, at, face) {   // a fork of the trunk strung as a harp
  const g = new THREE.Group(); g.position.copy(at); g.lookAt(at.clone().add(face)); add(g);
  const arm = new THREE.CatmullRomCurve3([V(-0.45, 0, 0.1), V(-0.5, 0.9, 0.15), V(0, 1.45, 0.2), V(0.5, 1.2, 0.15)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(arm, 20, 0.07, 6), M.trunk));
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.2, 6), M.trunk); post.position.set(0.45, 0.6, 0.12); g.add(post);
  for (let k = 0; k < 8; k++) { const x = -0.38 + k * 0.1, top = arm.getPointAt(Math.min(0.98, 0.32 + k * 0.08)).y; const st = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, top - 0.1, 3), M.string); st.position.set(x, 0.05 + (top - 0.1) / 2, 0.15); g.add(st); }
}
let stumpFx = null;
function stump(M, at) {         // the wide stump that sounds a note when you do
  const s = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 0.55, 40), M.trunk); s.position.copy(at).setY(at.y + 0.22); add(s);
  const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d"); x.fillStyle = "#b89a6a"; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 22; i++) { x.strokeStyle = i % 2 ? "rgba(90,60,30,.55)" : "rgba(140,110,70,.4)"; x.lineWidth = 2 + (i % 3); x.beginPath(); x.arc(128 + Math.sin(i) * 2, 128, 6 + i * 5.4, 0, 6.3); x.stroke(); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const topM = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, emissive: 0xc8e890, emissiveIntensity: 0.35, emissiveMap: tex });
  const top = new THREE.Mesh(new THREE.CircleGeometry(1.14, 40), topM); top.userData.keep = true;
  top.rotation.x = -Math.PI / 2; top.position.copy(at).setY(at.y + 0.5); scene.add(top);
  for (let i = 0; i < 7; i++) { const a = i * 0.9 + 0.3, d = V(Math.cos(a), 0, Math.sin(a));
    add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([at.clone().addScaledVector(d, 1.0).setY(0.35), at.clone().addScaledVector(d, 1.6).setY(0.15), at.clone().addScaledVector(d, 2.3).setY(-0.05)]), 10, 0.16, 6), M.rootM)); }
  const glow = glowSprite(at.clone().setY(0.9), 3.2, 0xd8f0a0, 0.45);
  const l = new THREE.PointLight(0xd8f0a8, 9, 9, 1.4); l.position.copy(at).setY(1.4); scene.add(l);
  stumpFx = { topM, glow, light: l, pulse: 0 };
}
/* the bar of music: a five-line staff hanging in the air, looping once round the clearing and cut off mid-phrase.
   Past the cut, four short lengths of staff wait unlit, one for each note the stump is given; the falling notes at the
   frayed end fade once the first is given. */
const END = 0.78, ADD = 4, FULL = 0.97;
let bar = null;
function musicBar() {
  const pts = []; for (let i = 0; i <= 14; i++) { const a = -2.2 + i * 0.36, rad = 3.6 + Math.sin(i * 0.9) * 0.6; pts.push(V(Math.cos(a) * rad, 2.3 + Math.sin(i * 0.7) * 0.5 + i * 0.03, Math.sin(a) * rad)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  const staffM = new THREE.MeshBasicMaterial({ color: 0xf2f0c0, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
  const staff = (u0, u1, mat, fray) => { const out = [];
    for (let l = 0; l < 5; l++) { const off = (l - 2) * 0.06, sub = [];
      for (let i = 0; i <= 40; i++) sub.push(curve.getPointAt(u0 + (u1 - u0) * i / 40).add(V(0, off, 0)));
      if (fray) sub.push(sub[sub.length - 1].clone().add(V(0.03 * (l - 2), -0.05 * l, 0.02)));
      const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sub), Math.round(200 * (u1 - u0)) + 8, 0.006, 3), mat); scene.add(m); out.push(m); }
    return out; };
  staff(0, END, staffM, false);
  const fray = staff(END - 0.012, END, staffM.clone(), true);
  const noteMat = () => new THREE.MeshBasicMaterial({ color: 0xfff6c8, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending });
  const heads = [];
  const note = (u, stepY, mat) => { const q = curve.getPointAt(u);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 6), mat); head.scale.set(1.3, 0.85, 0.6); head.position.copy(q).add(V(0, (stepY - 2) * 0.03, 0)); scene.add(head);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.24, 3), mat); stem.position.copy(head.position).add(V(0.05, 0.12, 0)); scene.add(stem);
    const glow = glowSprite(head.position, 0.35, 0xf6f0b0, 0.25);
    return { head, stem, glow, mat, base: mat.opacity }; };
  const STEPS = [0, 2, 4, 1, 3, -1, 2, 5];
  for (let i = 0; i < 22; i++) heads.push(note(0.03 + i * (END - 0.06) / 22, STEPS[i % 8], noteMat()));
  const falling = []; const cut = curve.getPointAt(END);
  for (let k = 1; k <= 3; k++) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 6), new THREE.MeshBasicMaterial({ color: 0xfff6c8, transparent: true, opacity: 0.6 / k, depthWrite: false })); h.scale.set(1.3, 0.85, 0.6); h.position.copy(cut).add(V(0.12 * k, -0.28 * k, 0.05 * k)); scene.add(h); falling.push(h); }
  const cutGlow = glowSprite(cut, 1.0, 0xf6f0b0, 0.3);
  // the four lengths still to come, and their notes, unlit until given
  const more = [];
  for (let k = 0; k < ADD; k++) { const u0 = END + (FULL - END) * k / ADD, u1 = END + (FULL - END) * (k + 1) / ADD;
    const m = staffM.clone(); m.opacity = 0; const lines = staff(u0, u1, m, false);
    const nm = noteMat(); nm.opacity = 0; const n = note((u0 + u1) / 2, 2, nm); n.glow.material.opacity = 0;
    more.push({ m, lines, n, on: 0, want: 0 }); }
  bar = { curve, heads, falling, cutGlow, fray, more };
}

/* ---------- the doorway's other side: an arch of roots, warm with the nook behind it ---------- */
let archFx = null;
function arch(M, kit) {
  const g = new THREE.Group(); g.position.copy(ARCH).setY(groundH(ARCH.x, ARCH.z) - 0.05); add(g);
  const r = rng(hash("arch"));
  for (let k = 0; k < 5; k++) {   // root strands braided over the way through
    const w = 1.05 + k * 0.08, h = 2.7 + k * 0.12, j = () => (r() - 0.5) * 0.18;
    const pts = [V(-w - 0.3, -0.1, j()), V(-w, 1.1, j()), V(-w * 0.75 + j(), h * 0.92, j()), V(0, h + j(), j()), V(w * 0.75 + j(), h * 0.92, j()), V(w, 1.1, j()), V(w + 0.3, -0.1, j())];
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.13 - k * 0.015, 7), k % 2 ? M.rootM : M.trunk));
  }
  // procgen hanging roots down the arch's two sides, clear of the way through and of the camera behind you
  if (kit["roots-hanging-a"]) { const h = kit["roots-hanging-a"].clone(); h.position.set(-1.25, 2.6, -0.1); h.scale.setScalar(0.9); g.add(h);
    const h2 = kit["roots-hanging-b"].clone(); h2.position.set(1.3, 2.5, -0.1); h2.scale.setScalar(0.85); g.add(h2); }
  // the nook's light through it: a warm sheet you can see through, brightest low, where the hearth is
  const c = document.createElement("canvas"); c.width = 64; c.height = 128; const x = c.getContext("2d");
  const grd = x.createLinearGradient(0, 128, 0, 0); grd.addColorStop(0, "rgba(255,190,120,.85)"); grd.addColorStop(0.6, "rgba(240,160,110,.45)"); grd.addColorStop(1, "rgba(200,140,120,0)");
  x.fillStyle = grd; x.fillRect(0, 0, 64, 128); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const sheetM = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.75, depthWrite: false, side: THREE.FrontSide, blending: THREE.AdditiveBlending });
  const sheetMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.7), sheetM); sheetMesh.position.set(0, 1.3, 0.05); sheetMesh.rotation.y = Math.PI;   // seen from the clearing only sheetMesh.userData.keep = true; g.add(sheetMesh);
  const l = new THREE.PointLight(0xffb070, 4, 6, 1.6); l.position.set(0, 1.2, 0.6); g.add(l);
  archFx = { sheetM, light: l, group: g };
}

/* ---------- the forest kit (procgen roots and mushrooms) and the greenery picks ---------- */
const loader = new GLTFLoader();
async function loadKit(M) {
  const out = {};
  const gl = await loader.loadAsync("/between/land/forest-kit.glb");
  const cap = new THREE.Color(0xc89458), stem = new THREE.Color(0xe8dcc0), c = new THREE.Color();
  const mushM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, emissive: 0x3a2410, emissiveIntensity: 0.18 });
  gl.scene.traverse(o => {
    if (!o.isMesh) return;
    const g = o.geometry; g.computeVertexNormals();
    if (o.name.startsWith("mushrooms")) {   // stem pale, cap ochre: the cap is where the lathe widens, read off the height
      g.computeBoundingBox(); const p = g.attributes.position, col = new Float32Array(p.count * 3), top = g.boundingBox.max.y || 1;
      for (let i = 0; i < p.count; i++) { const y = p.getY(i) / top; c.copy(stem).lerp(cap, Math.min(1, Math.max(0, (y - 0.45) * 3))); col.set([c.r, c.g, c.b], i * 3); }
      g.setAttribute("color", new THREE.BufferAttribute(col, 3)); o.material = mushM;
    } else o.material = M.rootM;
    out[o.name] = o;
  });
  return out;
}
async function loadGreen(name) {
  try { const g = await loader.loadAsync(`/between/land/greenery/${name}.glb`); return g.scene; } catch (e) { console.warn("greenery", name, e); return null; }
}
/* place a model so its own height is `h` metres, standing on the ground at (x, z) */
function plant(src, x, z, h, yaw = 0, parent = G) {
  const o = src.clone(true); const box = new THREE.Box3().setFromObject(o), size = box.getSize(V(0, 0, 0)), k = h / Math.max(size.y, 1e-4);
  o.scale.multiplyScalar(k); o.position.set(x, groundH(x, z) - box.min.y * k, z); o.rotation.y = yaw;
  o.userData.keep = true;   // the picks keep their own uv sets and alpha cut-outs: not merged
  parent.add(o); return o;
}

/* ===================================================================================================
   The episode: the charge from the nook, or the sample's; its encounter location is this place
   =================================================================================================== */
async function episode() {
  const sample = await fetch("/between/ctw/sample-player.json").then(r => r.json());
  let charge = sample;
  try { const s = sessionStorage.getItem("ctw-charge"); if (s) charge = JSON.parse(s); } catch (e) { /* the sample */ }
  let g = await read(charge);
  if (g.errors) { charge = sample; g = await read(charge); }
  const md = sheet(charge, g);
  const locs = locations(charge, g), enc = locs.find(l => l.role === "encounter");
  const role = { "scale-house": "villain", "friends-fire": "road-home" }[PLACE];
  const loc = role ? (locs.find(l => l.role === role) || enc) : enc;
  const p = plan(loc, loc === enc ? g.weather : "");   // the week's weather is over the near land only
  const next = locs.find(l => l.role === (PLACE === "clearing" ? "villain" : "road-home"));
  return { charge, g, md, loc, p, next, start: PLACE === "clearing" ? strongStart(md) : [], secrets: secretsHere(md, p), home: takeHome(md), friend: friendHere(md) };
}

/* ===================================================================================================
   The figure: the Between's own (wardrobe.js), carrying the round's toolbag
   =================================================================================================== */
function toolbagGroup(M) {
  const g = new THREE.Group();
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.56, 0.3, 4, 4, 2), M.canvas); g.add(bag);
  const p = bag.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); p.setZ(i, z * (1 - (x * x * 3 + y * y * 1.5) * 0.5) + (z > 0 ? 0.03 : 0)); p.setY(i, y - (Math.abs(x) < 0.2 && y < 0 ? 0.04 : 0)); } bag.geometry.computeVertexNormals();
  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.16, 0.31), M.leather); flap.position.set(0, 0.2, 0.01); g.add(flap);
  for (const sx of [-0.15, 0.15]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.014), M.leather); st.position.set(sx, 0.02, -0.16); g.add(st); }
  for (const sx of [-0.27, 0.27]) { const pk = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.2), M.leather); pk.position.set(sx, -0.08, 0); g.add(pk); }
  const hh = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.42, 6), M.wood); hh.position.set(-0.12, 0.42, 0.02); hh.rotation.z = 0.25; g.add(hh);
  const hd = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.05), M.iron); hd.position.set(-0.17, 0.62, 0.02); hd.rotation.z = 0.25; g.add(hd);
  const wr = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.5, 0.012), M.iron); wr.position.set(0.1, 0.44, -0.02); wr.rotation.z = -0.2; g.add(wr);
  const sw = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 6, 12), M.wood); sw.position.set(0.03, 0.38, 0.08); g.add(sw);
  const lv = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.05), M.brassDark); lv.position.set(0, 0.32, -0.1); lv.rotation.z = 0.08; g.add(lv);
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 8, 18), M.cable); coil.position.set(0, -0.36, 0.06); coil.rotation.x = Math.PI / 2; g.add(coil);
  g.scale.setScalar(0.82);
  return g;
}
/* Sitting on what is under you (the Friends' Fire's crates): stance.js's CRATE_SIT bent over whatever the clips left,
   eased in by w, and the hips brought to rest SEAT_PAD over the seat's top, measured each frame as garden.js does, so any
   build lands on the crate. `lean` tips the chest forward a little more (a laugh, a listen). */
function seatPoser(obj, holder) {
  const bones = {}; for (const n of ["hips", "hipL", "hipR", "kneeL", "kneeR", "shoulderL", "shoulderR", "elbowL", "elbowR", "spine", "neck"]) { const b = obj.getObjectByName(n); if (b) bones[n] = { b, q: b.quaternion.clone() }; }
  const hipsY = bones.hips ? bones.hips.b.position.y : 0;
  const qe = new THREE.Quaternion(), tq = new THREE.Quaternion(), eu = new THREE.Euler(), sv = V(0, 0, 0);
  let w = 0;
  return {
    bones,
    get w() { return w; },
    apply(dt, want, seatTop, T, lean = 0, strum = 0) {
      w += ((want ? 1 : 0) - w) * Math.min(1, dt * 5); if (!want && w < 0.01) w = 0;
      if (!bones.hipL || w <= 0) return;
      for (const [n, x, y, z] of CRATE_SIT) { const B = bones[n]; if (!B) continue;
        let bx = x; if (n === "spine") bx += lean + Math.sin(T * 1.4) * 0.025; if (n === "neck") bx -= lean * 0.6; if (n === "elbowR") bx += Math.sin(T * 14) * 0.18 * strum;
        tq.copy(B.q).multiply(qe.setFromEuler(eu.set(bx, y, z, "XYZ"))); B.b.quaternion.slerp(tq, w); }
      const hb = bones.hips.b, cur = hb.position.y; hb.position.y = hipsY; holder.updateMatrixWorld(true);
      const hw = hb.getWorldPosition(sv).y - holder.position.y, sy = hb.parent.getWorldScale(sv).y || 1;
      hb.position.y = cur + (hipsY - (hw - (seatTop + SEAT_PAD)) / sy - cur) * w;
    },
  };
}
/* The friends round the fire: Average Dusk in each seat's look, sat on their crates, breathing; Oriel holds the guitar. */
async function makeFriends(ff) {
  const gl = await loader.loadAsync("/between/m/dusk/average-dusk.glb");
  const root = gl.scene; mergeByParent(root); root.updateMatrixWorld(true);
  const box = new THREE.Box3(); root.traverse(o => { if (o.isMesh) { if (o.isSkinnedMesh) { o.computeBoundingBox(); box.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld)); } else box.expandByObject(o); } });
  const k = 1.7 / Math.max(box.getSize(V(0, 0, 0)).y, 0.01), P = await loadParts(u => loader.loadAsync(u));
  const out = [];
  for (const seat of FF.SEATS) { if (seat.who === "you") continue;
    const obj = skClone(root); obj.scale.setScalar(k); obj.position.y = -box.min.y * k;
    const wardrobe = dressFigure(obj, P); wardrobe.set(parseLook(seat.look));
    obj.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
    const c = FF.seatAt(seat), holder = new THREE.Group(); holder.add(obj); holder.position.set(c.x, groundH(c.x, c.z), c.z); holder.rotation.y = c.yaw; scene.add(holder);
    const mixer = new THREE.AnimationMixer(obj), idle = gl.animations.find(a => a.name === "Idle"); if (idle) { const a = mixer.clipAction(idle); a.play(); a.setEffectiveWeight(0); }
    const poser = seatPoser(obj, holder);
    if (seat.who === "oriel") { const g = ff.guitar; holder.add(g); g.position.set(0.04, 0.64, 0.3); g.rotation.set(-0.15, 0.25, 1.05); }
    out.push({ seat, holder, mixer, wardrobe, poser, oriel: seat.who === "oriel", phase: out.length * 1.7, laugh: 0 });
  }
  return out;
}
async function makeFigure(M) {
  const gl = await loader.loadAsync("/between/m/dusk/average-dusk.glb");
  const root = gl.scene; mergeByParent(root); root.updateMatrixWorld(true);
  const box = new THREE.Box3(); root.traverse(o => { if (o.isMesh) { if (o.isSkinnedMesh) { o.computeBoundingBox(); box.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld)); } else box.expandByObject(o); } });
  const obj = skClone(root), k = 1.7 / Math.max(box.getSize(V(0, 0, 0)).y, 0.01);
  obj.scale.setScalar(k); obj.position.y = -box.min.y * k;
  const wardrobe = dressFigure(obj, await loadParts(u => loader.loadAsync(u)));
  let look = null; try { look = parseLook(sessionStorage.getItem("ctw-look") || ""); } catch (e) { /* the default traveller */ }
  wardrobe.set(look);
  obj.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
  const holder = new THREE.Group(); holder.add(obj); scene.add(holder);
  const mixer = new THREE.AnimationMixer(obj), acts = {};
  for (const n of ["Walk", "Idle"]) { const c = gl.animations.find(a => a.name === n); if (c) { acts[n] = mixer.clipAction(c); acts[n].play(); } }
  const w = { Walk: 0, Idle: 1 }; if (acts.Walk) acts.Walk.setEffectiveWeight(0);
  let cur = "idle";
  const spine = obj.getObjectByName("spine"), neck = obj.getObjectByName("neck");
  const bag = toolbagGroup(M); scene.add(bag);
  const sv = V(0, 0, 0), nv = V(0, 0, 0), m4 = new THREE.Matrix4(), up = V(0, 0, 0), back = V(0, 0, 0), side = V(0, 0, 0);
  /* the bag's place on the back is kept in the holder's own frame and eased there, so the walk's mocap noise in the
     spine (the jitter he saw on ctw-walk-look-1) never reaches it; the stride's slow sway still does */
  const lp = V(0, 0, 0), lq = new THREE.Quaternion(), tp = V(0, 0, 0), tq = new THREE.Quaternion(), inv = new THREE.Quaternion(); let settled = false;
  // a plank carried on the shoulder, once taken out of the bag (the Scale-House)
  const plank = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 1.7), M.plank || M.wood); plank.position.set(0.22, 1.5, 0.05); plank.rotation.set(0.25, 0, 0.35); plank.visible = false; holder.add(plank);
  let bagOn = true;
  const poser = seatPoser(obj, holder);
  return {
    holder, bag, plank,
    setBag(on) { bagOn = on; bag.visible = on; },
    get bagOn() { return bagOn; },
    update(dt, moving, sitting = false, seatTop = 0, T = 0) {
      const s = stance({ moving, sitting }); if (s !== cur) { if (s === "walk" && w.Walk < 0.05 && acts.Walk) acts.Walk.time = 0; cur = s; }
      const want = clipWeights(cur), kk = 1 - Math.exp(-3 * dt / FADE[cur]);
      for (const n of ["Walk", "Idle"]) if (acts[n]) { w[n] += (want[n] - w[n]) * kk; acts[n].setEffectiveWeight(w[n]); }
      if (acts.Walk) acts.Walk.timeScale = bagOn ? 0.85 : 1.0;   // the bag is heavy: a slower stride; without it, lighter
      mixer.update(dt);
      poser.apply(dt, sitting, seatTop, T);
      wardrobe.dress(dt);
      holder.updateMatrixWorld(true);
      if (spine && neck) {   // the bag rides the back, set from the spine each frame
        spine.getWorldPosition(sv); neck.getWorldPosition(nv); up.copy(nv).sub(sv).normalize();
        back.set(0, 0, -1).applyQuaternion(holder.quaternion); back.addScaledVector(up, -back.dot(up)).normalize();
        side.crossVectors(up, back).normalize();
        tq.setFromRotationMatrix(m4.makeBasis(side, up, back));
        tp.copy(sv).addScaledVector(up, 0.08).addScaledVector(back, 0.2);
        inv.copy(holder.quaternion).invert();
        tp.sub(holder.position).applyQuaternion(inv); tq.premultiply(inv);        // into the holder's frame
        const e = settled ? 1 - Math.exp(-dt * 9) : 1; settled = true;
        lp.lerp(tp, e); lq.slerp(tq, e);
        bag.position.copy(lp).applyQuaternion(holder.quaternion).add(holder.position);
        bag.quaternion.copy(holder.quaternion).multiply(lq);
      }
    },
  };
}

/* ===================================================================================================
   Sound: the stump's answer, the instruments, the hum that stops mid-bar
   =================================================================================================== */
let ac = null, master = null, soundOn = true;
try { soundOn = localStorage.getItem("between-sound") !== "0"; } catch (e) { /* on */ }
function audio() {
  if (!ac) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ac = new A(); master = ac.createGain(); master.gain.value = soundOn ? 0.5 : 0; master.connect(ac.destination); }
  if (ac.state !== "running") ac.resume().catch(() => {});
  return ac;
}
/* Phones keep audio locked until a gesture they count: iOS counts touchend and click but not pointerdown, and its silent
   switch mutes Web Audio unless the page is playing media. So the first touch, click or key unlocks it (his note on
   ctw-walk-look-2: "I can't hear the sound on mobile"): resume, play one silent sample, and claim the playback channel. */
let unlocked = false;
function unlockAudio() {
  const a = audio(); if (!a) return;
  try { const b = a.createBuffer(1, 1, 22050), n = a.createBufferSource(); n.buffer = b; n.connect(a.destination); n.start(0); } catch (e) { /* ignore */ }
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) { /* ignore */ }
  try { const m = document.createElement("audio"); m.setAttribute("playsinline", ""); m.loop = true; m.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="; const pr = m.play(); if (pr && pr.catch) pr.catch(() => {}); } catch (e) { /* ignore */ }
  if (a.state === "running") { unlocked = true; for (const ev of ["touchend", "click", "keydown", "pointerup"]) window.removeEventListener(ev, unlockAudio, true); }
}
for (const ev of ["touchend", "click", "keydown", "pointerup"]) window.addEventListener(ev, unlockAudio, true);
document.addEventListener("visibilitychange", () => { if (!document.hidden && ac && ac.state !== "running") ac.resume().catch(() => {}); });
const SCALE = [0, 2, 4, 7, 9, 12, 14];                 // a major pentatonic, two octaves: no note is wrong in it
const hz = (deg, base = 220) => base * Math.pow(2, (SCALE[((deg % 7) + 7) % 7] + 12 * Math.floor(deg / 7)) / 12);
function pluck(f, { at = 0, dur = 1.4, kind = "string", vol = 0.35 } = {}) {
  const a = audio(); if (!a) return; const t = a.currentTime + at;
  const g = a.createGain(); g.connect(master);
  const shape = { string: ["triangle", 0.004, dur], stump: ["sine", 0.01, dur * 1.6], brass: ["sawtooth", 0.06, dur * 0.8], drum: ["sine", 0.002, 0.45], hum: ["sine", 0.12, dur] }[kind] || ["sine", 0.01, dur];
  const o = a.createOscillator(); o.type = shape[0]; o.frequency.setValueAtTime(kind === "drum" ? f * 1.6 : f, t); if (kind === "drum") o.frequency.exponentialRampToValueAtTime(f * 0.5, t + 0.3);
  let out = o;
  if (kind === "brass") { const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1400; o.connect(lp); out = lp; }
  out.connect(g);
  if (kind === "stump" || kind === "string") { const o2 = a.createOscillator(); o2.type = "sine"; o2.frequency.value = f * 2; const g2 = a.createGain(); g2.gain.value = 0.25; o2.connect(g2); g2.connect(g); o2.start(t); o2.stop(t + shape[2] + 0.1); }
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + shape[1]); g.gain.exponentialRampToValueAtTime(0.0001, t + shape[2]);
  o.start(t); o.stop(t + shape[2] + 0.1);
}
const PHRASE = [0, 2, 4, 1, 3, -1, 2, 5, 4, 2];        // the bar's own notes, the staff's steps; it stops after the eighth
const CADENCE = [3, 1, 2, 0];                            // where your four notes go when the song is played to its end
let humAt = 3.5;

/* ===================================================================================================
   Build
   =================================================================================================== */
const state = { p: null, ep: null, sh: null, ff: null, friends: [], sat: false, played: false, playing: false, plank: false, laid: false, given: [], done: false, rainK: 1, captions: [], capUntil: 0, near: null, cardKey: "", told: new Set(), block: null };
async function build() {
  step("reading the episode");
  const ep = await episode(); state.ep = ep; state.p = ep.p;
  const chName = "The keeping chamber";
  $("#placeName").textContent = PLACE === "chamber" ? chName : ep.p.name;
  $("#placeLand").textContent = PLACE === "chamber" ? "past the nook's doorway, built the cave's way" : `${ep.loc.land}, on the ${ep.p.line} line`;
  document.title = PLACE === "chamber" ? chName : ep.p.name;
  step("growing the forest");
  const M = {}, h = buildHollow(new THREE.Scene(), { lowPower: LOW, shell: "hollow" });   // built only to lend its materials
  h.root.traverse(o => { if (!o.isMesh || Array.isArray(o.material) || !o.material.isMeshStandardMaterial) return; const m = o.material, hex = m.color.getHex();
    if (m.vertexColors && m.map) M.bark = M.bark || m; else if (m.map && hex === 0xc4a68a) M.root = m; else if (m.map && m.roughness === 1) M.moss = M.moss || m; });
  M.trunkV = M.bark.clone(); M.trunkV.color.setHex(0x9a8a78); M.trunkV.side = THREE.FrontSide;   // trunks carry their bark shading as vertex colours
  M.trunk = M.trunkV.clone(); M.trunk.vertexColors = false;                                         // limbs, the arch, the stump: the same bark, plain
  M.rootM = M.root.clone(); M.rootM.color.setHex(0x7a6450);
  M.foliage = new THREE.MeshStandardMaterial({ color: 0x2e4a26, roughness: 0.95, flatShading: true });
  M.lutewood = new THREE.MeshStandardMaterial({ color: 0xa8703a, roughness: 0.6 });
  M.skin = new THREE.MeshStandardMaterial({ color: 0xe8dcb4, roughness: 0.8, emissive: 0x504830, emissiveIntensity: 0.3 });
  M.string = new THREE.MeshBasicMaterial({ color: 0xe8e0c0 });
  M.dark = new THREE.MeshBasicMaterial({ color: 0x140c08 });
  M.brass = new THREE.MeshStandardMaterial({ color: 0xc8963c, roughness: 0.4, metalness: 0.75 });
  M.brassDark = new THREE.MeshStandardMaterial({ color: 0x6e6234, roughness: 0.7, metalness: 0.5 });
  M.iron = new THREE.MeshStandardMaterial({ color: 0x3a3634, roughness: 0.6, metalness: 0.6 });
  M.canvas = new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 0.95 });
  M.leather = new THREE.MeshStandardMaterial({ color: 0x5a3a24, roughness: 0.8 });
  M.cable = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.7 });
  M.wood = new THREE.MeshStandardMaterial({ color: 0x7a5032, roughness: 0.8 });
  M.brassOld = new THREE.MeshStandardMaterial({ color: 0xa07a38, roughness: 0.55, metalness: 0.6 });
  M.rope = new THREE.MeshStandardMaterial({ color: 0x9c7b52, roughness: 1 });
  M.darkWood = new THREE.MeshStandardMaterial({ color: 0x4f321e, roughness: 0.9 });
  M.rock = new THREE.MeshStandardMaterial({ color: 0x5a5448, roughness: 1, flatShading: true });
  M.plank = new THREE.MeshStandardMaterial({ color: 0xb08a58, roughness: 0.75 });
  M.crate = new THREE.MeshStandardMaterial({ color: 0x9a7a52, roughness: 0.9 });
  M.crateDark = new THREE.MeshStandardMaterial({ color: 0x6e5236, roughness: 0.9 });
  M.plaster = new THREE.MeshStandardMaterial({ color: 0x8a7e6c, roughness: 1 });
  M.thatch = new THREE.MeshStandardMaterial({ color: 0x5a4a30, roughness: 1, flatShading: true });
  M.window = new THREE.MeshBasicMaterial({ color: 0xffc070 });
  M.pathM = new THREE.MeshStandardMaterial({ map: M.moss.map.clone(), color: 0xa89070, roughness: 1 }); M.pathM.map.repeat.set(0.6, 0.6); M.pathM.map.needsUpdate = true;

  const r = rng(hash(ep.p.seed + ":" + ep.p.id));
  const has = id => ep.p.pieces.some(x => x.id === id);
  if (PLACE === "scale-house") {
    groundExtra = (x, z) => SH.gullyH(x);
    step("raising the Scale-House");
    state.sh = SH.build({ THREE, V, add, scene, M, r, groundH, glowSprite, tree, grass, mist, fireflies, duskSky, ground, toolbagGroup, LOW });
    state.fog = state.sh.fog; state.flies = null; state.rain = null;
  } else if (PLACE === "friends-fire") {
    step("lighting the fire");
    state.ff = FF.build({ THREE, V, add, scene, M, r, groundH, glowSprite, tree, grass, mist, fireflies, duskSky, ground, LOW });
    state.fog = state.ff.fog; state.flies = null; state.rain = null;
    step("the friends sit down");
    state.friends = await makeFriends(state.ff).catch(e => { console.warn("friends", e); return []; });
    state.bagDown = toolbagGroup(M); state.bagDown.visible = false; scene.add(state.bagDown);
    state.oSeals = orielSeals();
    { const c = FF.YOURS, side = V(Math.cos(c.yaw), 0, -Math.sin(c.yaw)); const x = c.x + side.x * 0.55, z = c.z + side.z * 0.55;
      state.bagDown.position.set(x, groundH(x, z) + 0.24, z); state.bagDown.rotation.set(-0.25, c.yaw + 0.6, 0.1); }
  } else if (PLACE === "chamber") {
    // the keeping chamber under the nook's shelf (./chamber.js): the floor is the land's own ground, flattened and laid with the cave's dry stone
    step("opening the chamber");
    groundExtra = (x, z) => -n2(x, z) * 0.12 * Math.min(1, Math.hypot(x, z) / 6);
    ground(M, 0x5e4e44, 0x4a3e36, CH.R + 0.5);
    { const t = new THREE.TextureLoader().load("/ontology-game/cave/textures/dry_stone.jpg"); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(8, 8);
      groundMesh.material = new THREE.MeshStandardMaterial({ color: new THREE.Color(0x5e4e44).multiplyScalar(1.35), map: t, roughness: 0.95 }); }
    state.kept = Q.get("kept") === "sample" ? KEPT_SAMPLE.map(x => ({ ...x })) : keptPieces();
    state.ch = await CH.build({ THREE, V, scene, glowSprite, LOW, pieces: state.kept });
    state.fog = state.ch.fog; state.flies = null; state.rain = null;
  } else {
  // the forest (the Wood land) under the week's weather; dusk, green through the canopy
  state.fog = scene.fog = new THREE.FogExp2(0x4c5c58, 0.042); scene.background = new THREE.Color(0x4c5c58);
  state.sky = duskSky(V(-0.4, 0.15, -1), 0x3a4440, 0x8a9888, 0x4a4660, 0x9ab890);
  state.hemi = new THREE.HemisphereLight(0xa8c0c8, 0x3c4030, 1.6); scene.add(state.hemi);
  const dusk = new THREE.DirectionalLight(0xc0dcc0, 1.4); dusk.position.set(-6, 10, -14); scene.add(dusk);
  const cool = new THREE.DirectionalLight(0x98a8d8, 0.7); cool.position.set(12, 6, 6); scene.add(cool);
  state.warm = new THREE.DirectionalLight(0xe8b888, 0.5); state.warm.position.set(-10, 3, 8); scene.add(state.warm);
  ground(M, 0x36402a, 0x262c1c, CLR + 0.5);
  const path = (x, z) => (Math.abs(x) < 1.2 && z > CLR - 1.5 && z < ARCH.z + 1.5) || clearingPath(x, z);
  grass(r, LOW ? 9000 : 22000, CLR, path);
  const kit = await loadKit(M).catch(e => { console.warn("forest kit", e); return {}; });
  // the ring: nine trees, an instrument grown into each that faces the middle (the gap is the way in from the arch)
  const ring = [];
  for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * (Math.PI * 2 / 9) + Math.PI, rr = CLR + (r() - 0.5) * 0.8; const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    if (z > 5.5 && Math.abs(x) < 3.5) continue;
    ring.push({ x, z }); tree(M, r, x, z, { h: 10 + r() * 4, rad: 0.5 + r() * 0.25, heavy: 0.6, toward: V(0, 0, 0), keepClear: w => Math.hypot(w.x, w.z) < CLR - 0.4 && w.y < 4.8 }); }   // the camera walks in here: no leaves hung low inside the ring
  if (has("instrument-ring")) {
    const kinds = ["lute", "harp", "drum", "pipes", "horn", "lute", "drum", "harp"], kindOf = { lute: "string", harp: "string", drum: "drum", pipes: "brass", horn: "brass" };
    ring.forEach((t, i) => { const face = V(-t.x, 0, -t.z).normalize(), surf = V(t.x, 0, t.z).addScaledVector(face, 0.62), k = kinds[i % kinds.length], gy = groundH(surf.x, surf.z);
      let at;
      if (k === "lute") { at = surf.clone().setY(1.6); lute(M, at, face); }
      else if (k === "harp") { at = surf.clone().addScaledVector(face, 0.1).setY(0.9); harp(M, at, face); at.y += 0.7; }
      else if (k === "drum") { at = surf.clone().addScaledVector(face, 0.5).setY(gy); drum(M, at, 1.1); drum(M, surf.clone().addScaledVector(face, 0.6).add(V(face.z * 0.9, 0, -face.x * 0.9)).setY(gy), 0.7); at.y += 0.6; }
      else if (k === "pipes") { at = surf.clone().addScaledVector(face, 0.5).setY(3.0); pipes(M, at, face); at.y -= 0.6; }
      else { at = surf.clone().setY(2.0); horn(M, at, face); }
      const stand = V(t.x, 0, t.z).setLength(CLR - 1.75);
      instruments.push({ kind: k, sound: kindOf[k], at, stand, note: [0, 2, 4, 3, 5, 1, 4, 6][i % 8], flash: 0 });
    });
  }
  if (has("sounding-stump")) stump(M, V(0, groundH(0, 0), 0));
  if (has("music-bar")) musicBar();
  // the forest beyond, kept off the way in and the arch
  const away = (x, z) => (Math.abs(x) < 3.2 && z > 4 && z < 14) || Math.hypot(x - ARCH.x, z - ARCH.z) < 3.5 || (Math.abs(x + Math.max(0, -z - CLR) * 0.25) < 2.6 && z < -CLR + 2 && z > -CLR - 12);
  for (let i = 0, n = LOW ? 55 : 95; i < n; i++) { const a = r() * 6.28, d = CLR + 3.5 + Math.pow(r(), 0.8) * 30, x = Math.cos(a) * d, z = Math.sin(a) * d; if (away(x, z)) continue;
    tree(M, r, x, z, { h: 9 + r() * 6, rad: 0.35 + r() * 0.4, heavy: r() < 0.5 ? 1 : 0 }); }
  // the edge you come in by: two heavy trees framing the gap, their branches hanging low across it
  tree(M, r, -3.6, 10.4, { h: 11, rad: 0.6, heavy: 1.6, toward: V(1, 0, 8), keepClear: w => Math.abs(w.x) < 1.4 && w.y < 3.2 });
  tree(M, r, 5.8, 10.6, { h: 12, rad: 0.55, heavy: 1.6, toward: V(0, 0, 8), keepClear: w => Math.abs(w.x) < 1.4 && w.y < 3.2 });
  arch(M, kit);
  // procgen roots at the ring trees' feet and mushrooms where the roots go into the moss
  if (kit["roots-buttress-a"]) ring.forEach((t, i) => { const o = kit[i % 2 ? "roots-buttress-b" : "roots-buttress-a"].clone(); o.position.set(t.x, groundH(t.x, t.z) + 0.05, t.z); o.scale.setScalar(2.2 + r() * 0.6); o.rotation.y = r() * 6.28; add(o); });
  const mush = ["mushrooms-colony-a", "mushrooms-drift", "mushrooms-ring"].filter(n => kit[n]);
  if (mush.length) {
    ring.forEach((t, i) => { if (i % 2) return; const d = V(-t.x, 0, -t.z).normalize(), x = t.x + d.x * 1.3 + d.z * 0.7, z = t.z + d.z * 1.3 - d.x * 0.7; const o = kit[mush[i % mush.length]].clone(); o.position.set(x, groundH(x, z), z); o.scale.setScalar(0.55 + r() * 0.25); o.rotation.y = r() * 6.28; add(o); });
    if (kit["mushrooms-ring"]) { const o = kit["mushrooms-ring"].clone(); o.position.set(-2.1, groundH(-2.1, 7.6), 7.6); o.scale.setScalar(0.7); add(o); }   // a small fairy ring by the way in
  }
  // the greenery picks: ferns round the ring and the arch, grass clumps, a few mossy rocks; the pitcher plant once
  step("planting the ferns");
  const [fern, clump, rock, pitcher] = await Promise.all(["fern-02", "high-grass-clump", "rock-with-moss", "pitcher-plant"].map(loadGreen));
  if (fern) { const ferns = fern.children.length > 1 ? fern.children : [fern];
    for (let i = 0, n = LOW ? 26 : 44; i < n; i++) { const a = r() * 6.28, d = CLR - 0.6 + r() * 2.2, x = Math.cos(a) * d, z = Math.sin(a) * d; if (path(x, z)) continue; plant(ferns[i % ferns.length], x, z, 0.55 + r() * 0.5, r() * 6.28); }
    for (const sx of [-1.7, 1.6, -2.3, 2.2]) plant(ferns[(sx > 0 ? 1 : 2) % ferns.length], ARCH.x + sx, ARCH.z - 0.3 + Math.abs(sx) * 0.2, 0.7, r() * 6.28); }
  if (clump) for (let i = 0, n = LOW ? 20 : 40; i < n; i++) { const a = r() * 6.28, d = 1.8 + r() * (CLR - 2.2), x = Math.cos(a) * d, z = Math.sin(a) * d; if (path(x, z) || d < 1.9) continue; plant(clump, x, z, 0.3 + r() * 0.25, r() * 6.28); }
  if (rock) for (const [x, z, s] of [[-4.2, 3.6, 0.8], [4.6, 2.4, 0.6], [2.1, -4.8, 0.7], [-3.1, 7.6, 0.45], [3.2, 8.9, 0.5]]) plant(rock, x, z, s, r() * 6.28);
  if (pitcher) plant(pitcher, -3.9, -3.1, 0.75, 0.8);
  mist(r, LOW ? 14 : 26, 0xb8c8bc, 0.13, 5);
  state.flies = fireflies(r, LOW ? 90 : 160, 0xe8f0a0, 14);
  state.rain = ep.p.weather === "rain" ? rain(r, LOW ? 1200 : 2400) : null;
  // the path out of the far side of the ring: the Scale-House's amber, far down it through the trees
  if (ep.next) { glowSprite(V(-1.6, 1.4, -CLR - 8), 5, 0xffb050, 0.35); glowSprite(V(-1.2, 1.0, -CLR - 5), 2.2, 0xffc070, 0.18); }
  step("settling the clearing");
  }
  mergeStatic(G);
  step("you, with the toolbag");
  state.me = await makeFigure(M);
}

/* ===================================================================================================
   Walking: tap the ground to walk there, drag to look round, or the arrow keys
   =================================================================================================== */
const SHX = PLACE === "scale-house", FFX = PLACE === "friends-fire", CHX = PLACE === "chamber";
const me = SHX ? { pos: V(SH.ARRIVE.x, 0, SH.ARRIVE.z), yaw: Math.atan2(-SH.ARRIVE.x, SH.BALANCE.z - SH.ARRIVE.z), target: null, keys: new Set() }
  : FFX ? { pos: V(FF.ARRIVE.x, 0, FF.ARRIVE.z), yaw: Math.atan2(-FF.ARRIVE.x, -FF.ARRIVE.z), target: null, keys: new Set() }
  : CHX ? { pos: V(CH.ARRIVE.x, 0, CH.ARRIVE.z), yaw: Math.PI, target: null, keys: new Set() }
  : { pos: V(0, 0, ARCH.z - 0.9), yaw: Math.PI, target: null, keys: new Set() };
/* you arrive walking a few steps in, seen from in front, so you see yourself come through; then the camera settles
   behind you (his note on ctw-walk-look-1: you could not see yourself without turning the camera) */
const ARRIVE_AT = SHX ? V(1.3, 0, 7.2) : FFX ? V(FF.WALK_TO.x, 0, FF.WALK_TO.z) : CHX ? V(CH.WALK_TO.x, 0, CH.WALK_TO.z) : V(0, 0, 4.9);
const intro = { on: !Q.get("at"), t: 0, settling: false };
const speed = () => (state.me && !state.me.bagOn ? 1.5 : FFX ? 1.3 : 1.15);   // the bag is lighter by the fire   // the bag is heavy; set down, you walk lighter
function walkable(x, z) {
  if (SHX) return SH.walkable(x, z, state.laid);
  if (FFX) return FF.walkable(x, z);
  if (CHX) return CH.walkable(x, z);
  if (Math.abs(x) < 0.9 && z < -CLR + 1.3 && z > -CLR - 0.6) return true;   // a step onto the path out
  const d = Math.hypot(x, z);
  if (d < STUMP_R + 0.32) return false;
  if (d < CLR - 1.2) return true;
  return Math.abs(x) < 1.35 && z > 0 && z < ARCH.z - 0.55;   // the way in, between the two heavy trees
}
let camYaw = intro.on ? Math.PI : 0, camPitch = 0.34, camDist = LOW ? 5.3 : 4.7, drag = null;
const el = renderer.domElement, ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
el.addEventListener("pointerdown", e => { intro.on = false; drag = { x: e.clientX, y: e.clientY, yaw: camYaw, pitch: camPitch, moved: false }; audio(); });
el.addEventListener("pointermove", e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 8) drag.moved = true;
  if (drag.moved) { camYaw = drag.yaw - dx * 0.006; camPitch = Math.max(0.08, Math.min(0.9, drag.pitch + dy * 0.004)); } });
el.addEventListener("pointerup", e => { const d = drag; drag = null; if (!d || d.moved || !groundMesh) return; tap(e.clientX, e.clientY); });
addEventListener("keydown", e => { if (e.target.closest && e.target.closest("button, input, textarea")) return; me.keys.add(e.key.toLowerCase()); });
addEventListener("keyup", e => me.keys.delete(e.key.toLowerCase()));
function tap(cx, cy) {
  ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  // an instrument, the stump or the arch: walk to where you would stand to use it
  let best = null, bd = 0.9;
  for (const ins of instruments) { const d = ray.ray.distanceToPoint(ins.at); if (d < bd) { bd = d; best = ins.stand.clone(); } }
  if (SHX) { const b = V(SH.BALANCE.x, 1.4, SH.BALANCE.z), e = V(SH.BRIDGE_END.x, 0.3, SH.BRIDGE_END.z);
    if (ray.ray.distanceToPoint(b) < 1.3) best = V(SH.BALANCE.x + 0.35, 0, SH.BALANCE.z + 1.05);
    else if (ray.ray.distanceToPoint(e) < 1.0) best = V(SH.BRIDGE_END.x + 0.5, 0, SH.BRIDGE_END.z); }
  if (FFX) { if (ray.ray.distanceToPoint(V(FF.YOURS.x, 0.3, FF.YOURS.z)) < 0.7 || ray.ray.distanceToPoint(V(0, 0.4, 0)) < 1.0) best = V(FF.STAND.x, 0, FF.STAND.z); }
  if (stumpFx && ray.ray.distanceToPoint(V(0, 0.6, 0)) < 1.3) { const s = me.pos.clone().setY(0); if (s.length() < 0.1) s.set(0, 0, 1); best = s.setLength(STUMP_R + 0.55); }
  if (ray.ray.distanceToPoint(ARCH.clone().setY(1.3)) < 1.2) best = V(ARCH.x, 0, ARCH.z - 0.75);
  if (state.sat) return;                               // sat on the crate: the card's Stand up gets you off it
  if (!best) { const hit = ray.intersectObject(groundMesh, false)[0]; if (!hit) return; best = hit.point.setY(0); }
  me.target = best;
}
function move(dt) {
  if (state.sat) return false;
  let dir = null;
  const fwd = V(-Math.sin(camYaw), 0, -Math.cos(camYaw)), right = V(-fwd.z, 0, fwd.x);
  const k = me.keys, kd = V(0, 0, 0);
  if (k.has("w") || k.has("arrowup")) kd.add(fwd); if (k.has("s") || k.has("arrowdown")) kd.sub(fwd);
  if (k.has("d") || k.has("arrowright")) kd.add(right); if (k.has("a") || k.has("arrowleft")) kd.sub(right);
  if (kd.lengthSq() > 0) { dir = kd.normalize(); me.target = null; }
  else if (me.target) { const d = me.target.clone().sub(me.pos).setY(0); if (d.length() < 0.08) me.target = null; else dir = d.normalize(); }
  if (!dir) return false;
  const s = Math.min(speed() * dt, me.target ? me.target.distanceTo(me.pos.clone().setY(0)) : 9);
  const nx = me.pos.x + dir.x * s, nz = me.pos.z + dir.z * s;
  if (walkable(nx, nz)) { me.pos.x = nx; me.pos.z = nz; }
  else if (walkable(nx, me.pos.z)) me.pos.x = nx;
  else if (walkable(me.pos.x, nz)) me.pos.z = nz;
  else { me.target = null; return false; }
  const want = Math.atan2(dir.x, dir.z); let dy = want - me.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); me.yaw += dy * Math.min(1, dt * 8);
  return true;
}

/* ===================================================================================================
   What you can do here: the card when you stand near something, and the captions
   =================================================================================================== */
function caption(text, secs = 6) { state.captions.push({ text, secs }); }
function tell(key, text, secs) { if (state.told.has(key)) return; state.told.add(key); caption(text, secs); }
function secret(re) { return (state.ep.secrets || []).find(s => re.test(s)); }
function nearNow() {
  const p = me.pos;
  if (SHX) {
    const dBack = Math.hypot(p.x - SH.PATH_BACK.x, p.z - SH.PATH_BACK.z);
    if (dBack > 3) state.leftArch = true;
    if (dBack < 1.8) return state.leftArch ? "back" : null;
    if (p.x < SH.GULLY.x - SH.GULLY.w) return "far";
    if (Math.hypot(p.x - SH.BALANCE.x, p.z - SH.BALANCE.z) < 1.6) return "balance";
    if (Math.hypot(p.x - SH.BRIDGE_END.x, p.z - SH.BRIDGE_END.z) < 1.4) return "bridge";
    return null;
  }
  if (FFX) {
    if (state.sat) return "crate";
    const dBack = Math.hypot(p.x - FF.PATH_BACK.x, p.z - FF.PATH_BACK.z);
    if (dBack > 3) state.leftArch = true;
    if (dBack < 1.8) return state.leftArch ? "ff-back" : null;
    if (Math.hypot(p.x, p.z) < FF.RING_R + 3.0) return "fire";
    return null;
  }
  if (CHX) {
    const dBack = Math.hypot(p.x - CH.PORTAL.x, p.z - CH.PORTAL.z);
    if (dBack > 2.6) state.leftArch = true;
    if (dBack < 1.6) return state.leftArch ? "ch-home" : null;
    const bs = state.block && state.block.near(p); if (bs) return bs;
    const st = state.ch && state.ch.near(p); return st ? "kept:" + state.ch.stones.indexOf(st) : null;
  }
  if (Math.hypot(p.x - OUT.x, p.z - OUT.z) < 1.5 && state.ep.next) return "out";
  const dArch = Math.hypot(p.x - ARCH.x, p.z - ARCH.z);
  if (dArch > 2.6) state.leftArch = true;                 // the way home is offered once you have stepped away from it
  if (dArch < 1.6) return state.leftArch ? "arch" : null;
  const bs = state.block && state.block.near(p); if (bs) return bs;
  if (stumpFx && Math.hypot(p.x, p.z) < STUMP_R + 1.1) return "stump";
  let bi = -1, bd = 1.5; instruments.forEach((ins, i) => { const d = Math.hypot(p.x - ins.stand.x, p.z - ins.stand.z); if (d < bd) { bd = d; bi = i; } });
  return bi >= 0 ? "ins:" + bi : null;
}
const NAMES = { lute: "A lute grown into the bark", harp: "A fork of the trunk, strung", drum: "Drums in the roots", pipes: "Pipes hung from a branch", horn: "A horn out of the trunk" };
const NOTE_NAMES = ["low", "", "", "", "high"];
function showCard() {
  const n = state.near; let key = n || "", html = "";
  const btn = (act, label) => `<button type="button" data-act="${act}">${label}</button>`;
  const card = (title, text, ...btns) => `<div><b>${title}</b><div class="t">${text}</div></div><div class="row">${btns.join("")}</div>`;
  if (n === "out") { const there = esc(state.ep.next.location).replace(/^The /, "the "); key = "out"; html = card("The path out", `Through the far trees, an amber light: ${there}, where the Weigher is met.`, btn("go:scale-house", `Follow the path to ${there}`)); }
  else if (n === "back") { key = "back"; html = card("The path back", "It runs back through the heavy trees to the clearing.", btn("go:clearing", "Walk back to the clearing")); }
  else if (n === "far") { const there = state.ep.next ? esc(state.ep.next.location) : "the Friends' Fire"; key = "far"; html = card("The far bank", `Past the last trees, a fire is lit, and someone is tuning a guitar. The path runs on to ${there.replace(/^The /, "the ")}.`, btn("go:friends-fire", `Follow the path to ${there.replace(/^The /, "the ")}`), btn("walk:bridge", "Back over the bridge")); }
  else if (n === "ff-back") { key = "ff-back"; html = card("The path back", "It runs back through the trees to the Scale-House and the bridge you mended.", btn("go:scale-house-far", "Walk back to the Scale-House")); }
  else if (n === "fire") { const f = esc(state.ep.friend.name || "A friend"); key = "fire:" + state.played;
    html = card("The fire", state.played ? `${f} is still turning the song over on the guitar. Your crate is where you left it.` : `${f} is tuning a guitar, a string at a time. One crate is empty, turned to the fire, left for you.`, btn("sit", "Sit on the empty crate")); }
  else if (n === "crate") { const f = esc(state.ep.friend.name || "Your friend"), fs = fireSong();
    key = "crate:" + fs.step + fs.song.played.length + (fs.song.block || "") + state.played + (fs.stay ? "s" : "");
    const seals = () => `<div class="row notes">${[0, 1, 2, 3, 4].map(d => `<button type="button" data-fnote="${d}" class="${fs.stump.includes(d) ? "lit" : ""}" aria-label="note ${d + 1}${NOTE_NAMES[d] ? ", " + NOTE_NAMES[d] : ""}${fs.stump.includes(d) ? ", one you gave the stump" : ""}">${d + 1}</button>`).join("")}</div>`;
    html = fs.step === "seals" ? `<div><b>Your bar</b><div class="t">${fs.song.played.length ? `${fs.song.played.length === 1 ? "One note" : fs.song.played.length + " notes"} so far. Any seal is right.` : "Play what you have so far. The rings mark the notes you gave the stump."}</div></div>${seals()}<div class="row">${btn("tag", "Hand it to Oriel")}${btn("stand", "Stand up")}</div>`
      : fs.step === "tag" ? `<div><b>Before it goes to ${f}</b><div class="t">What would block you from playing this for someone?</div></div><div class="row blocks">${FS_ORDER.map(c => `<button type="button" data-block="${c}" aria-pressed="${fs.song.block === c}">${FS.BLOCKS[c]}</button>`).join("")}</div><div class="row">${fs.song.block ? btn("give", `Put it in ${f}'s hand`) : ""}${btn("more", "Play a little more")}</div>`
      : fs.step === "oriel" ? card(f, fs.song.passed ? `${f} plays the old bar for you, and its own way home.` : `${f} plays it on from your last note, at your pace. The others have gone quiet.`)
      : fs.step === "card" ? (fs.stay ? card("The fire", `${f} is still turning the song over on the guitar.`, btn("home", "Take it home to your nook"), btn("stand", "Stand up"))
        : thisWeek(fs))
      : fs.step === "after" ? card(f, "The last note hangs over the fire.")
      : card(f, `“${esc(state.ep.friend.line || "Play what you have so far?")}”`, btn("play", "Open the toolbag and play"), btn("listen", "Just listen tonight"), btn("stand", "Stand up")); }
  else if (n === "balance") {
    const inPan = state.me && !state.me.bagOn;
    key = "balance:" + inPan + state.plank + state.laid;
    html = !inPan
      ? card("The balance", state.laid ? "It still reads whatever is set in it." : "Its near pan hangs low and empty. The toolbag on your back pulls at your shoulders.", btn("set-bag", "Set the toolbag in the pan"))
      : card("The balance", "The pan sank under the toolbag. The far pan rides high and empty.",
          ...(state.plank || state.laid ? [] : [btn("plank", "Take the plank out of the bag")]), btn("shoulder", "Shoulder the toolbag again"),
          ...(state.plank && !state.laid ? [btn("walk:bridge", "Walk to the bridge")] : []));
  } else if (n === "bridge") {
    key = "bridge:" + state.plank + state.laid;
    html = state.laid ? card("The footbridge", "One plank, and it holds.", btn("walk:far", "Cross to the far bank"))
      : state.plank ? card("The footbridge", "Its middle planks are gone. The plank you carry is long enough.", btn("lay", "Lay the plank across"))
      : card("The footbridge", "Its middle planks are gone and the gully is deep. Your toolbag is heavy; the balance in the doorway would hold it.", btn("walk:balance", "Walk to the balance"));
  } else if (n === "arch") { key = "arch"; html = `<div><b>The doorway home</b><div class="t">Your nook is through the roots, the hearth where you left it.</div></div><div class="row"><button type="button" data-act="home">Back through to your nook</button></div>`; }
  else if (n && n.startsWith("melt:")) { const c = state.block.card(n); key = c.key; html = c.html; }
  else if (n === "ch-home") { key = n; html = card("The arch home", "Your nook is through it, the shelf above the arch where you left it.", btn("home", "Back through to your nook")); }
  else if (n && n.startsWith("kept:")) { const st = state.ch.stones[+n.slice(5)]; key = n;
    html = st ? card(state.ch.name(st.pc), `What the cold left when a block cleared: ${esc(st.pc.feeling || "heavy")}, the size of ${esc(st.pc.strength || "a storm")}. ${{ water: "A crystal bed", metal: "A spire", fire: "A glow cap", earth: "A clump of mushrooms" }[st.pc.element] || "Something"} has grown beside it.${st.pc.pouch ? " The piece itself is in your satchel's pouch; this light marks where it lay." : ""}`) : ""; }
  else if (n === "stump") {
    const left = ADD - state.given.length;
    key = "stump:" + state.given.length + (state.done ? "d" : "");
    html = state.done
      ? `<div><b>The stump</b><div class="t">The song is played to its end. The stump still answers, whatever you sound.</div></div><div class="row notes">${[0, 1, 2, 3, 4].map(d => `<button type="button" data-note="${d}" aria-label="note ${d + 1}">${d + 1}</button>`).join("")}</div>`
      : `<div><b>The stump</b><div class="t">Sound a note, any note. ${left === ADD ? "The bar stops where it always stops." : `${left} more and the bar can run on.`}</div></div><div class="row notes">${[0, 1, 2, 3, 4].map(d => `<button type="button" data-note="${d}" aria-label="note ${d + 1}${NOTE_NAMES[d] ? ", " + NOTE_NAMES[d] : ""}">${d + 1}</button>`).join("")}</div>`;
  } else if (n && n.startsWith("ins:")) { const ins = instruments[+n.slice(4)]; key = n; html = `<div><b>${NAMES[ins.kind]}</b><div class="t">It faces the stump, like the others.</div></div><div class="row"><button type="button" data-act="${n}">Play it</button></div>`; }
  if (key === state.cardKey) return;
  const had = document.activeElement && document.activeElement.closest && document.activeElement.closest("#card input");
  state.cardKey = key; const c = $("#card"); c.hidden = !key; c.innerHTML = html;
  // a stand's line field takes the keys once you have started writing there, and keeps them line after line
  const inp = c.querySelector("input"); if (!inp) state.melting = false; else if (had || state.melting) inp.focus({ preventScroll: true });
}
// a line written at a stand (block-room.js): Enter or "Say it" sends it; the walk keys stay with the field while it has them
$("#card").addEventListener("submit", e => { const f = e.target.closest("form[data-melt-form]"); if (!f) return; e.preventDefault(); audio();
  const inp = f.querySelector("input"), t = inp.value.trim(); if (!t) return; me.keys.clear(); state.melting = true;
  state.block.act("say:" + f.dataset.meltForm, t); state.cardKey = ""; });
$("#card").addEventListener("focusin", e => { if (e.target.matches("input")) { me.keys.clear(); state.melting = true; } });
$("#card").addEventListener("keydown", e => { if (e.key === "Escape" && e.target.matches("input")) { state.melting = false; e.target.blur(); } });
$("#card").addEventListener("focusout", e => { if (e.target.matches("input")) state.melting = false; });
$("#card").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return; audio();
  if (b.dataset.melt) { state.block.act(b.dataset.melt); state.cardKey = ""; }
  else if (b.dataset.note != null) giveNote(+b.dataset.note);
  else if (b.dataset.fnote != null && FFX) fireNote(+b.dataset.fnote);
  else if (b.dataset.block && FFX) { const fs = fireSong(); fs.song = FS.tagBlock(fs.song, b.dataset.block); state.cardKey = ""; }
  else if (b.dataset.act === "home") goHome();
  else if (b.dataset.act && b.dataset.act.startsWith("go:")) goPlace(b.dataset.act.slice(3));
  else if (b.dataset.act && b.dataset.act.startsWith("walk:")) { const w = b.dataset.act.slice(5);
    me.target = w === "balance" ? V(SH.BALANCE.x + 0.35, 0, SH.BALANCE.z + 1.05) : w === "bridge" ? V(SH.BRIDGE_END.x + 0.5, 0, SH.BRIDGE_END.z) : V(SH.FAR_BANK.x, 0, SH.FAR_BANK.z); }
  else if (b.dataset.act && SHX) shAct(b.dataset.act);
  else if (b.dataset.act && FFX) ffAct(b.dataset.act);
  else if (b.dataset.act && b.dataset.act.startsWith("ins:")) { const ins = instruments[+b.dataset.act.slice(4)]; pluck(hz(ins.note, ins.sound === "drum" ? 110 : 220), { kind: ins.sound }); ins.flash = 1; }
});
function giveNote(deg) {
  pluck(hz(deg, 220), { kind: "string", vol: 0.3 });                     // you sound it
  pluck(hz(deg, 220), { kind: "stump", at: 0.35, vol: 0.4 });           // the stump answers, the same note, wood and low
  if (stumpFx) stumpFx.pulse = 1;
  const s = secret(/stump/i); if (s) tell("stump", s, 7);
  if (state.done || !bar) return;
  const k = state.given.length; state.given.push(deg);
  const m = bar.more[k]; m.want = 1;
  if (k === 0) for (const f of bar.falling) f.userData.fade = true;
  if (state.given.length === ADD) setTimeout(songToItsEnd, 1200);
}
function songToItsEnd() {
  state.done = true; state.cardKey = "";
  try { sessionStorage.setItem("ctw-song", JSON.stringify(state.given)); } catch (e) { /* the bar's own cadence at the fire */ }
  playPhrase(true);
  setTimeout(() => { const s = secret(/played to its end/i); tell("end", s || "The song runs to its end.", 8); }, 3200);
  setTimeout(() => { const s = secret(/hum/i); if (s) tell("hum", s, 8); }, 11500);
}
function playPhrase(full) {
  if (!bar) return;
  const notes = full ? PHRASE.slice(0, 8).concat(state.given.length ? state.given : CADENCE) : PHRASE.slice(0, 8);
  const dt = 0.42;
  notes.forEach((d, i) => pluck(hz(d + 2, 220), { kind: "hum", at: i * dt, dur: 0.6, vol: full ? 0.16 : 0.11 }));
  if (full) pluck(hz(0, 110), { kind: "hum", at: notes.length * dt, dur: 2.6, vol: 0.18 });   // home: the tonic, held
  bar.playing = { t0: performance.now() / 1000, dt, n: notes.length, full };
}
/* the Scale-House's moves: the bag into the pan and back, the plank out of it, the plank across the gap */
function shAct(act) {
  const sh = state.sh, f = state.me; if (!sh || !f) return;
  if (act === "set-bag") {
    f.setBag(false); sh.setBag(true); state.cardKey = "";
    pluck(hz(0, 55), { kind: "brass", dur: 1.6, vol: 0.3 }); pluck(hz(-3, 55), { kind: "drum", at: 0.25, vol: 0.35 });
    const a = secret(/scale reads the bag/i); if (a) tell("reads", a, 7);
    const b = secret(/lighter than the toolbag/i); if (b) tell("lighter", b, 7);
    tell("walk-light", "Without it, you walk lighter.", 4);
  } else if (act === "shoulder") {
    f.setBag(true); sh.setBag(false); state.cardKey = "";
    pluck(hz(2, 110), { kind: "string", vol: 0.2 });
  } else if (act === "plank") {
    state.plank = true; f.plank.visible = true; state.cardKey = "";
    pluck(hz(4, 220), { kind: "string", vol: 0.25 });
    const s = secret(/one plank/i); tell("plank", s || "The bag held one plank all along.", 7);
  } else if (act === "lay") {
    state.plank = false; state.laid = true; f.plank.visible = false; sh.lay(); state.cardKey = "";
    [0, 2, 4, 7].forEach((d, i) => pluck(hz(d, 220), { kind: "string", at: i * 0.18, vol: 0.22 }));
    setTimeout(() => tell("amber", "The plank holds. The amber air thins.", 5), 900);
    setTimeout(() => { const s = secret(/Protector carries the bag/i); if (s) tell("protector", s, 8); }, 6500);
  }
}
/* a string tuned up to pitch: plucked a little flat and slid up (Oriel at the fire, between songs) */
function tune(f, at = 0, vol = 0.16) {
  const a = audio(); if (!a) return; const t = a.currentTime + at;
  const g = a.createGain(); g.connect(master); const o = a.createOscillator(); o.type = "triangle";
  o.frequency.setValueAtTime(f * 0.955, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.7); o.connect(g);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
  o.start(t); o.stop(t + 1.7);
}
/* The fire's crackle (spec ctw-friends-fire FR-007): filtered noise with random pops, always under the scene, ducked about
   6 dB (x0.5) while either you or Oriel is playing. Built once, on the first frame after audio is unlocked. */
function crackle(playing, dt) {
  const a = audio(); if (!a || a.state !== "running") return;
  if (!state.crk) {
    const buf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (Math.random() < 0.002 ? 1 : 0.15);
    const src = a.createBufferSource(); src.buffer = buf; src.loop = true;
    const hp = a.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 900;
    const g = a.createGain(); g.gain.value = 0.05; src.connect(hp); hp.connect(g); g.connect(master); src.start();
    state.crk = { g, duck: 1 };
  }
  const c = state.crk, want = playing ? 0.5 : 1;
  c.duck += (want - c.duck) * Math.min(1, dt * 4); c.g.gain.value = 0.05 * c.duck;
}
/* your song, carried from the stump: the notes you gave it, or the bar's own cadence */
function yourNotes() { try { const v = JSON.parse(sessionStorage.getItem("ctw-song") || "null"); if (Array.isArray(v) && v.length) return v.slice(0, 6).map(n => +n || 0); } catch (e) { /* the cadence */ } return CADENCE.slice(); }
/* The Friends' Fire's moves (spec ctw-friends-fire FR-001 to FR-009; the song is ./fire-song.js). You sit, open the toolbag
   and sound your own notes on the stump's five seals, name the energy that would block you, and put it in Oriel's hand;
   Oriel plays it home from your last note at your pace. Nothing plays until you hand it over or choose to listen, and
   nothing grades the playing: the friends laugh only after a silence, whatever you played. */
const FS_ORDER = ["fire", "wood", "water", "metal", "earth"];
const BLOCK_HUE = { fire: 0xff7a4a, wood: 0x9ad66e, water: 0x6fb0f0, metal: 0xe4e8f0, earth: 0xe0b85c };
const KIND_HUE = { yours: 0xffc862, passing: 0xc9d4de, home: 0xffffff, bar: 0xc9d4de };
const now = () => performance.now() / 1000;
function fireSong() {
  if (!state.fs) { const q = Q.get("song"), seed = q && /\d/.test(q) ? FS.stumpNotes(q) : null; let stored = null;
    try { stored = FS.stumpNotes(sessionStorage.getItem("ctw-song")); } catch (e) { /* the bar's own cadence */ }
    const stump = seed || stored || [];
    state.fs = { step: "ask", stump, song: FS.newSong({ stump }), tl: null, lit: -1, stay: false }; }
  return state.fs;
}
function fireNote(d) {
  const fs = fireSong(); if (fs.step !== "seals") return;
  const next = FS.play(fs.song, d, now()); if (next.refused) return;
  fs.song = next; state.cardKey = "";
  pluck(hz(d, 220), { kind: "string", vol: 0.28 });
  if (state.ff && state.ff.lean) state.ff.lean(1);
}
function thisWeek(fs) {
  const h = state.ep.home, g = secret(/key to the garage/i);
  const named = fs.song.block ? `<div class="t">You named ${esc(FS.BLOCKS[fs.song.block].toLowerCase())} as what would block you, and it went into Oriel's hand with the song.</div>` : "";
  return `<div><b>This week</b><div class="t">${esc(h.capability || "Play one unfinished song for one person.")}</div>${h.key ? `<div class="t">The key you carry home: “${esc(h.key)}”</div>` : ""}${g ? `<div class="t">${esc(g)}</div>` : ""}${named}</div><div class="row"><button type="button" data-act="home">Take it home to your nook</button><button type="button" data-act="stay">Stay by the fire</button></div>`;
}
/* Oriel's turn: the timeline's notes plucked on the guitar, one beat after the hand-over, each lighting its seal above
   Oriel; the home note held; a silence; then the friends laugh and the last card comes. */
function orielPlays() {
  const fs = fireSong(), tl = FS.timeline(fs.song); if (!tl) return;
  fs.tl = tl; fs.step = "oriel"; fs.lit = -1; state.playing = true; state.cardKey = "";
  const t0 = now(), o = state.friends.find(x => x.oriel);
  tune(hz(0, 220), 0, 0.1);   // Oriel's last tuned string lands on the home note before the first one of yours

  tl.notes.forEach((n, i) => pluck(hz(n.degree, 220), { kind: "string", at: Math.max(0, n.t - t0), dur: i === tl.notes.length - 1 ? 2.6 : 1.1, vol: 0.22 }));
  setTimeout(() => { if (o) o.strum = 1; }, Math.max(0, tl.notes[0].t - t0) * 1000);
  setTimeout(() => { if (o) o.strum = 0; fs.step = "after"; state.cardKey = ""; }, (tl.end - t0) * 1000);
  setTimeout(() => { state.playing = false; state.played = true;
    for (const fr of state.friends) fr.laugh = 1;
    const a = secret(/recording/i); if (a) tell("ff-rec", a, 7);
    setTimeout(() => { fs.step = "card"; state.cardKey = ""; }, 2600);
  }, (tl.laughAt - t0) * 1000);
}
function ffAct(act) {
  const f = state.me; if (!f) return; state.cardKey = "";
  const fs = fireSong();
  if (act === "sit") {
    me.target = V(FF.STAND.x, 0, FF.STAND.z); state.sitWhenThere = true;
  } else if (act === "stand") {
    if (fs.step === "oriel" || fs.step === "after") return;
    state.sat = false; f.setBag(true); state.bagDown.visible = false;
    me.pos.set(FF.STAND.x, 0, FF.STAND.z); me.yaw = FF.YOURS.yaw;
    if (fs.step !== "card") { fs.step = "ask"; fs.song = FS.newSong({ stump: fs.stump }); }
  } else if (act === "play" && fs.step === "ask") { fs.step = "seals"; f.setBag(false);
  } else if (act === "tag" && fs.step === "seals") { fs.step = "tag";
  } else if (act === "more" && fs.step === "tag") { fs.step = "seals";
  } else if (act === "give" && fs.step === "tag") {
    const next = FS.handOver(fs.song, now()); if (next.refused) { caption(next.refused.replace(/^./, c => c.toUpperCase()) + ".", 4); return; }
    fs.song = next; orielPlays();
  } else if (act === "listen" && fs.step === "ask") {
    fs.song = FS.pass(fs.song, now()); orielPlays();
  } else if (act === "stay" && fs.step === "card") { fs.stay = true; }
}
/* five seals hung above Oriel, lit one per note while Oriel plays, with a thread through the notes so far (his m07 stone
   on reel round 1: "I can't see what it looks like when Oriel plays along") */
function orielSeals() {
  const o = state.friends.find(x => x.oriel); if (!o) return null;
  const c = o.holder.position, out = V(c.x, 0, c.z).normalize(), side = V(-out.z, 0, out.x);
  const group = new THREE.Group(); scene.add(group); group.visible = false;
  const at = d => c.clone().add(V(0, 1.95 + 0.07 * d, 0)).add(side.clone().multiplyScalar((d - 2) * 0.3));
  const seals = [0, 1, 2, 3, 4].map(d => { const s = glowSprite(at(d), 0.2, 0xffe2b0, 0.22, false, group); s.userData = { base: at(d), k: 0, hue: new THREE.Color(0xffe2b0) }; return s; });
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([at(0), at(0)]), new THREE.LineBasicMaterial({ color: 0xffd890, transparent: true, opacity: 0.55, fog: false }));
  group.add(line);
  const ripple = glowSprite(at(2), 0.1, 0xffc862, 0, false, group);
  const tagYou = glowSprite(V(0, -9, 0), 0.24, 0xffffff, 0), tagOriel = glowSprite(V(0, -9, 0), 0.24, 0xffffff, 0);
  return { group, seals, line, ripple, at, tagYou, tagOriel, oriel: o };
}
function frameSeals(dt) {
  const os = state.oSeals, fs = state.fs; if (!os || !fs) return;
  // the tag glows in your hands while you choose, then in Oriel's fretting hand while Oriel plays
  const hue = fs.song.block ? BLOCK_HUE[fs.song.block] : null;
  const you = state.me && state.me.holder.position, oh = os.oriel.holder;
  os.tagYou.material.opacity += ((hue && (fs.step === "tag") ? 0.85 : 0) - os.tagYou.material.opacity) * Math.min(1, dt * 4);
  os.tagOriel.material.opacity += ((hue && (fs.step === "oriel" || fs.step === "after") ? 0.85 : 0) - os.tagOriel.material.opacity) * Math.min(1, dt * 3);
  if (hue) { os.tagYou.material.color.setHex(hue); os.tagOriel.material.color.setHex(hue); }
  if (you) { const fwd = V(Math.sin(me.yaw), 0, Math.cos(me.yaw)); os.tagYou.position.copy(you).add(fwd.multiplyScalar(0.32)).add(V(0, 0.72, 0)); }
  { const fwd = V(Math.sin(oh.rotation.y), 0, Math.cos(oh.rotation.y)), side = V(fwd.z, 0, -fwd.x); os.tagOriel.position.copy(oh.position).add(fwd.multiplyScalar(0.3)).add(side.multiplyScalar(-0.18)).add(V(0, 0.95, 0)); }
  const on = fs.step === "oriel" || fs.step === "after" || (fs.step === "card" && !fs.stay);
  os.group.visible = on || os.group.visible && os.seals.some(s => s.material.opacity > 0.02);
  if (!os.group.visible) return;
  const ph = fs.tl ? FS.phaseAt(fs.song, now()) : { phase: "ready" };
  const upTo = ph.phase === "oriel" ? ph.index : ph.phase === "handed" || !fs.tl ? -1 : fs.tl.notes.length - 1;
  if (ph.phase === "oriel" && ph.index !== fs.lit) { fs.lit = ph.index; const n = ph.note, s = os.seals[n.degree]; s.userData.k = 1; s.userData.hue.setHex(KIND_HUE[n.kind] || 0xffffff);
    os.ripple.position.copy(s.userData.base); os.ripple.scale.set(0.12, 0.12, 1); os.ripple.material.opacity = 0.9; os.ripple.material.color.setHex(KIND_HUE[n.kind] || 0xffffff); }
  const pts = fs.tl ? fs.tl.notes.slice(0, upTo + 1).filter(n => n.part === "ending" || fs.song.passed).map(n => os.at(n.degree)) : [];
  os.line.geometry.setFromPoints(pts.length > 1 ? pts : [os.at(0), os.at(0)]);
  for (const s of os.seals) { s.userData.k *= 1 - dt * 0.9; const lit = fs.tl && fs.tl.notes.slice(0, upTo + 1).some(n => os.seals[n.degree] === s);
    s.material.color.copy(lit ? s.userData.hue : new THREE.Color(0xffe2b0));
    s.material.opacity = on ? (lit ? 0.55 + 0.45 * s.userData.k : 0.2) : s.material.opacity * (1 - dt * 1.5);
    const z = 0.2 + 0.12 * s.userData.k; s.scale.set(z, z, 1); }
  os.ripple.scale.multiplyScalar(1 + dt * 3.2); os.ripple.material.opacity *= 1 - dt * 2.4;
}
function goPlace(where) {
  const fade = $("#fade"); fade.hidden = false; requestAnimationFrame(() => fade.classList.add("on"));
  const q = new URLSearchParams(); if (where === "scale-house" || where === "friends-fire") q.set("place", where);
  if (where === "scale-house-far") { q.set("place", "scale-house"); q.set("at", "far"); } if (Q.get("paint")) q.set("paint", Q.get("paint"));
  setTimeout(() => { location.href = "/between/land.html" + (q.toString() ? "?" + q : ""); }, 700);
}
function goHome() {
  const fade = $("#fade"); fade.hidden = false; requestAnimationFrame(() => fade.classList.add("on"));
  let back = "/ontology-game/between"; try { back = sessionStorage.getItem("ctw-back") || back; } catch (e) { /* plain */ }
  setTimeout(() => { location.href = back; }, 700);
}
$("#homeBtn").onclick = goHome;
$("#soundBtn").onclick = () => { soundOn = !soundOn; try { localStorage.setItem("between-sound", soundOn ? "1" : "0"); } catch (e) { /* this page only */ }
  $("#soundBtn").textContent = soundOn ? "Sound on" : "Sound off"; $("#soundBtn").setAttribute("aria-pressed", String(soundOn)); if (audio()) master.gain.value = soundOn ? 0.5 : 0; };
$("#soundBtn").textContent = soundOn ? "Sound on" : "Sound off";

/* ===================================================================================================
   The frame
   =================================================================================================== */
const clock = new THREE.Clock(); let T = 0; const camLook = V(0, 1, 0);
/* the seated framing: low over your left shoulder at about 1.1 m, the fire in the middle, Oriel upper right; once Oriel
   has the song the view swings further left, so your back stops covering Oriel. A drag turns it a little. */
const SEAT_VIEW = { swing: -0.6, swingOriel: -0.9, dist: 2.3, h: 1.2 };
function seatView() {
  const fs = state.fs, a = FF.SEATS[0].a, oriel = fs && (fs.step === "oriel" || fs.step === "after");
  const sw = (oriel ? SEAT_VIEW.swingOriel : SEAT_VIEW.swing) + (camYaw - (FF.YOURS.yaw + Math.PI + 0.35)) * 0.5;
  const dir = V(Math.sin(a), 0, Math.cos(a)).applyAxisAngle(V(0, 1, 0), sw);
  const want = me.pos.clone().setY(groundH(me.pos.x, me.pos.z)).add(dir.multiplyScalar(SEAT_VIEW.dist)).add(V(0, SEAT_VIEW.h, 0));
  const o = state.friends.find(x => x.oriel), op = o ? o.holder.position.clone().add(V(0, oriel ? 1.5 : 1.0, 0)) : V(0, 0.8, 0);
  return { want, look: V(0, 0.6, 0).lerp(op, oriel ? 0.55 : 0.3) };
}
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, clock.getDelta()); T += dt;
  const moving = move(dt);
  me.pos.y = groundH(me.pos.x, me.pos.z);
  if (SHX) me.pos.y = SH.standH(me.pos.x, me.pos.z, state.laid, me.pos.y);   // the laid plank holds you over the gully
  if (FFX && state.sitWhenThere && !me.target && Math.hypot(me.pos.x - FF.STAND.x, me.pos.z - FF.STAND.z) < 0.3) {   // at your crate: sit
    state.sitWhenThere = false; state.sat = true; state.cardKey = ""; if (state.me) state.me.setBag(false); state.bagDown.visible = true;
    me.pos.set(FF.YOURS.x, 0, FF.YOURS.z); me.yaw = FF.YOURS.yaw; camYaw = FF.YOURS.yaw + Math.PI + 0.35; intro.on = false;
  }
  if (FFX && state.sat) me.pos.y = groundH(FF.YOURS.x, FF.YOURS.z);
  if (state.me) { state.me.holder.position.copy(me.pos); state.me.holder.rotation.y = me.yaw; state.me.update(dt, moving, FFX && state.sat, FF.CRATE.h, T); }
  if (SHX && state.me && me.pos.x < SH.GULLY.x - 1 && T > (state.farTuneAt || 0)) { tune([110, 146.8, 196, 246.9][Math.floor(T) % 4], 0, 0.05); state.farTuneAt = T + 5; }   // heard from the far bank
  if (state.ff) {
    state.ff.frame(dt, T, state.sat);
    for (const fr of state.friends) { fr.laugh *= 1 - dt * 0.6; fr.mixer.update(dt);
      const bob = fr.laugh > 0.02 ? Math.abs(Math.sin(T * 9 + fr.phase)) * 0.12 * fr.laugh : 0, listen = state.playing ? 0.12 : 0;
      fr.poser.apply(1, true, FF.CRATE.h, T + fr.phase, bob + listen, fr.oriel ? (fr.strum || (state.played || state.playing ? 0 : 0.25 * Math.max(0, Math.sin(T * 0.8)))) : 0);
      fr.wardrobe.dress(dt); }
    crackle(!!state.playing || (state.fs && state.fs.step === "seals" && state.fs.song.played.length > 0), dt);
    // between songs Oriel tunes a string at a time; now and then the others laugh at something said
    if (!state.playing && !(state.sat && state.fs && state.fs.step !== "card") && T > (state.tuneAt || 2)) { const st = [82.4, 110, 146.8, 196, 246.9, 329.6][Math.floor(T * 7) % 6]; tune(st); if (!state.played) tune(st, 0.9);
      state.tuneAt = T + (state.played ? 9 : 4.5);
      if (!state.played && !state.sat && Math.floor(T) % 3 === 0) { const fr = state.friends[Math.floor(T) % Math.max(1, state.friends.length)]; if (fr && !fr.oriel) fr.laugh = 0.7; } }
  }
  // camera: behind and above you, turned by a drag, never inside a trunk (it is held inside the ring and the way in)
  const off = V(Math.sin(camYaw) * Math.cos(camPitch), Math.sin(camPitch), Math.cos(camYaw) * Math.cos(camPitch)).multiplyScalar(camDist);
  let want = me.pos.clone().add(off).add(V(0, 1.0, 0)), look = me.pos.clone().add(V(0, 1.25, 0)), ease = 6;
  if (FFX && state.sat) { const seat = seatView(); want = seat.want; look = seat.look; ease = 2.5; }
  if (intro.on) { intro.t += dt; if (!me.target || intro.t > 7) intro.settling = true;
    if (intro.settling) { camYaw += (0 - camYaw) * Math.min(1, dt * 1.4); if (Math.abs(camYaw) < 0.01) { camYaw = 0; intro.on = false; } } }
  if (FFX && !state.sat) { const fh = Math.hypot(want.x, want.z), lim = FF.FIRE_R + 0.5; if (fh < lim) { want.x *= lim / Math.max(fh, 0.01); want.z *= lim / Math.max(fh, 0.01); } }
  else if (CHX) {   // inside the chamber's wall: come in along the line to you rather than slide round the wall
    const base = me.pos.clone().add(V(0, 1.0, 0)), lim = CH.R - 0.6; let t = 1;
    for (let i = 0; i < 12 && Math.hypot(base.x + off.x * t, base.z + off.z * t) > lim; i++) t *= 0.86;
    want.copy(base).addScaledVector(off, Math.max(0.3, t)); want.y = Math.min(want.y, CH.TOP - 0.4); }
  else if (SHX) { const fh = Math.hypot(want.x, want.z), lim = SH.HUT_R + 0.7; if (fh < lim) { want.x *= lim / Math.max(fh, 0.01); want.z *= lim / Math.max(fh, 0.01); } }
  else { const flat = Math.hypot(want.x, want.z), lim = want.z > CLR - 1.5 ? ARCH.z - 0.3 : CLR - 0.6;   // never out past the arch, into the roots
    if (flat > lim) { want.x *= lim / flat; want.z *= lim / flat; } }
  want.y = Math.max(want.y, groundH(want.x, want.z) + 0.6);
  camera.position.lerp(want, 1 - Math.exp(-dt * ease));
  if (FFX && state.sat) { camLook.lerp(look, 1 - Math.exp(-dt * ease)); camera.lookAt(camLook); } else { camLook.copy(look); camera.lookAt(look); }
  if (FFX) frameSeals(dt);
  // the hum: every so often it starts, and stops mid-bar (until the song has been played to its end)
  if (bar && T > humAt) { playPhrase(state.done); humAt = T + (state.done ? 16 : 11); if (!state.done && T > 8 && Math.hypot(me.pos.x, me.pos.z) < CLR - 1) tell("bar", "Through the trees, the hum starts again, and stops mid-bar.", 5); }
  if (bar) {
    const pl = bar.playing, now = performance.now() / 1000, at = pl ? (now - pl.t0) / pl.dt : -1;
    bar.heads.forEach((h, i) => { const lit = pl && at >= 0 && Math.abs(at - i * 8 / 22) < 0.6 ? 1 : 0; h.mat.opacity = h.base + lit * 0.15; h.glow.material.opacity = 0.25 + lit * 0.5; });
    bar.more.forEach((m, k) => { m.on += (m.want - m.on) * Math.min(1, dt * 2.5); m.m.opacity = 0.5 * m.on; m.n.mat.opacity = 0.85 * m.on; m.n.glow.material.opacity = 0.25 * m.on + (pl && pl.full && Math.abs(at - (8 + k)) < 0.6 ? 0.5 : 0); });
    for (const f of bar.falling) if (f.userData.fade) f.material.opacity *= 1 - dt * 1.5;
    const closed = state.done ? 1 : 0; for (const f of bar.fray) f.material.opacity = 0.5 * (1 - closed);
    bar.cutGlow.material.opacity = 0.3 * (1 - (bar.more[0].on || 0));
    if (pl && at > pl.n + 6) bar.playing = null;
  }
  if (state.sh) state.sh.frame(dt, T);
  if (stumpFx) { stumpFx.pulse *= 1 - dt * 2.2; stumpFx.topM.emissiveIntensity = 0.35 + stumpFx.pulse * 0.9; stumpFx.light.intensity = 9 + stumpFx.pulse * 16; stumpFx.glow.material.opacity = 0.45 + stumpFx.pulse * 0.35; }
  // the rain stops where a song is played to its end; the light warms a little
  const rk = Math.min(state.done ? 0 : 1, state.block ? state.block.rain() : 1); state.rainK += (rk - state.rainK) * Math.min(1, dt * 0.5);
  if (state.rain) { state.rain.mat.opacity = 0.32 * state.rainK; state.rain.lines.visible = state.rainK > 0.02; if (state.rain.lines.visible) state.rain.update(T, me.pos); }
  if (state.fog && !SHX && !FFX) { state.fog.density = 0.03 + 0.012 * state.rainK + (state.block ? state.block.fogAdd() : 0); if (state.warm) state.warm.intensity = (0.5 + (1 - state.rainK) * 0.9) * (state.block ? state.block.lightK() : 1); }
  if (state.block) state.block.frame(dt, T);
  if (state.ch) state.ch.frame(dt, T);
  if (state.flies) state.flies.material.opacity = 0.65 + Math.sin(T * 1.7) * 0.25;
  if (archFx) { archFx.sheetM.opacity = 0.6 + Math.sin(T * 1.3) * 0.12; archFx.light.intensity = 4 + Math.sin(T * 2.1) * 0.6; }
  // near things, captions
  state.near = nearNow(); showCard();
  const cap = $("#caption");
  if (T > state.capUntil) { const c = state.captions.shift(); if (c) { cap.textContent = c.text; cap.hidden = false; cap.classList.add("on"); state.capUntil = T + c.secs; } else { cap.classList.remove("on"); } }
  renderer.render(scene, camera);
}

(async function start() {
  try {
    await build();
    // previews: stand at the stump, or open with the song done
    if (Q.get("at") === "stump") { me.pos.set(0, 0, STUMP_R + 0.6); me.yaw = Math.PI; camYaw = 0.35; }
    if (Q.get("at") === "out") { me.pos.set(0, 0, -CLR + 1.6); me.yaw = Math.PI; camYaw = 0; }
    if (SHX && Q.get("at") === "balance") { me.pos.set(SH.BALANCE.x + 0.35, 0, SH.BALANCE.z + 1.05); me.yaw = Math.PI; camYaw = 0.5; }
    if (SHX && Q.get("at") === "bridge") { me.pos.set(SH.BRIDGE_END.x + 0.6, 0, SH.BRIDGE_END.z + 0.2); me.yaw = -Math.PI / 2; camYaw = -1.0; }
    if (SHX && Q.get("bag") === "pan") { state.me.setBag(false); state.sh.setBag(true); }
    if (SHX && Q.get("plank") === "laid") { state.laid = true; state.sh.lay(); }
    if (SHX && Q.get("at") === "far") { state.laid = true; state.sh.lay(); me.pos.set(SH.FAR_BANK.x, 0, SH.FAR_BANK.z); me.yaw = Math.PI / 2; camYaw = -Math.PI / 2; }
    if (FFX && Q.get("at") === "crate") { state.sat = true; state.me.setBag(false); state.bagDown.visible = true; me.pos.set(FF.YOURS.x, 0, FF.YOURS.z); me.yaw = FF.YOURS.yaw; camYaw = FF.YOURS.yaw + Math.PI + 0.35; intro.on = false; }
    if (FFX && Q.get("song") === "played") { state.played = true; const fs = fireSong(); fs.step = "card"; }
    if (FFX && state.sat && Q.get("fire")) { const fs = fireSong(), w = Q.get("fire"); const t = now() - 6;
      const sample = fs.stump.length ? fs.stump : [1, 3, 0, 4];
      if (w !== "ask") { fs.step = "seals"; sample.forEach((d, i) => { fs.song = FS.play(fs.song, d, t + i * 0.7); }); }
      if (w === "tag" || w === "oriel" || w === "card") { fs.step = "tag"; fs.song = FS.tagBlock(fs.song, Q.get("block") || "water"); }
      if (w === "oriel") { fs.song = FS.handOver(fs.song, now()); orielPlays(); }
      if (w === "card") { fs.song = FS.handOver(fs.song, t + 3); fs.tl = FS.timeline(fs.song); fs.step = "card"; state.played = true; } }
    if (intro.on) { me.target = ARRIVE_AT.clone(); camYaw = me.yaw; }
    if (Q.get("song") === "done" && bar) { state.given = CADENCE.slice(); bar.more.forEach(m => { m.want = m.on = 1; }); for (const f of bar.falling) f.material.opacity = 0; state.done = true; state.rainK = 0; }
    // the block's room: a dense charge from the nook's doorway, or the ?block= preview with the sample's charge
    // slice 2: a storm fills the land, a season fills the keeping chamber (densityOf().where); ?block= previews either
    if (!SHX) {
      let fromNook = false; try { fromNook = !!sessionStorage.getItem("ctw-charge"); } catch (e) { /* the sample */ }
      const qb = Q.get("block"), startK = { ice: 1, water: 0.66, gas: 0.33, clear: 0 }[qb] ?? 1, here = CHX ? "chamber" : "land";
      let d = densityOf(state.ep.charge);
      if (qb && !(d.dense && d.where === here)) d = densityOf({ q4: { weather: [{ feeling: CHX ? "frustrated" : "disappointed", strength: CHX ? "a season" : "a storm" }] } });
      // the chamber resets each time someone enters it (his B on bm-build-look-3, 2026-11-03): the frost is back, the stands are fresh
      if (d.dense && d.where === here && (fromNook || qb)) {
        step("the cold comes through with you");
        const chRoom = CHX ? { center: [0, 0], R: CH.R - 0.8, top: CH.TOP, avoid: [V(CH.POOL.x, 0, CH.POOL.z), V(CH.PORTAL.x, 0, CH.PORTAL.z + 0.6)], keepAt: V(CH.POOL.x, 0, CH.POOL.z), keepY: 1.6, basins: [CH.POOL],
          where: "the keeping chamber", dry: !!qb && !fromNook, keepSay: "A stone rises for it here and the cave's kit grows beside it. The piece goes into your satchel's pouch.",
          onKeep: rec => { setTimeout(() => state.ch.add(rec), 1200); } } : {};
        state.block = await mountRoom({ scene, d, center: [0, 0.6], R: CLR, top: 5.5, floor: 0, startK, avoid: instruments.map(i => i.stand),
          exclude: [state.me && state.me.holder], live: [state.warm, stumpFx && stumpFx.light, archFx && archFx.light], keepAt: V(0, 0, 0), keepY: 0.95, ...chRoom,
          say: (t, secs) => { if (t) caption(t, secs); },
          sound: k => { if (k === "take" || k === "keep") [0, 2, 4].forEach((dd, i) => pluck(hz(dd, 220), { kind: "string", at: i * 0.16, vol: 0.2 }));
            else if (k === "pass") pluck(hz(0, 110), { kind: "hum", dur: 1.6, vol: 0.14 }); else pluck(hz(4, 440), { kind: "string", vol: 0.15 }); } });
        if (startK === 1) caption(CHX ? `A season of it came through the arch with you: feeling ${d.feeling}. The frost has set on what you keep here. One stand glows on the floor: what you write there melts it.`
          : `The cold came through with you: feeling ${d.feeling}, ${d.strength} of it. One stand glows in the frost: what you write there melts it.`, 7);
      }
    }
    camera.position.copy(me.pos).add(V(-Math.sin(me.yaw) * -4.5, 2.2, -Math.cos(me.yaw) * -4.5));
    if (FFX && state.sat) { const sv = seatView(); camera.position.copy(sv.want); camLook.copy(sv.look); }   // opened seated: no ease from afar
    $("#loading").classList.add("gone"); setTimeout(() => { $("#loading").hidden = true; }, 900);
    $("#hud").hidden = false;
    for (const s of state.ep.start) caption(s, Math.max(5, s.split(" ").length * 0.38));
    if (CHX && !state.block) caption(state.kept.length ? "The keeping chamber. What the cold left stands here, in the order it cleared." : "The keeping chamber, still bare. What the cold leaves when a block clears will stand here.", 6);
    if (FFX) { caption("The road home, at the homeroom's rim.", 5); caption("Round the fire, someone is tuning a guitar, and the others laugh at something said.", 6); }
    if (SHX) { caption(`${state.ep.loc.purpose ? state.ep.loc.purpose.replace(/^./, c => c.toUpperCase()) : "The Weigher's ground"}.`, 5); const t = secret(/Tinker built/i); if (t) caption(t, 6); }
    caption("Tap the ground to walk. Drag to look around.", 5);
    window.__land = { place: PLACE, plan: state.p, me, state, shAct, ffAct, SEAT_VIEW, intro, cam: (y, p) => { intro.on = false; camYaw = y; if (p != null) camPitch = p; }, instruments, camera, scene, tap, giveNote, block: () => state.block, view: () => ({ near: state.near, block: state.block ? state.block.view() : null, given: state.given.slice(), done: state.done, pos: me.pos.toArray(), pieces: state.p.pieces.map(x => x.id), unbuilt: state.p.unbuilt }) };
    frame();
  } catch (e) {
    console.error(e); step("the land did not build: " + (e && e.message || e)); window.__landError = String(e && e.stack || e);
  }
})();
