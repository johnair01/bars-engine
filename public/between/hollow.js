/* The hollow: the Between's place for round 2 (six-faces-council relationship-creature, "Build brief: round 2, the hollow",
   2026-10-17). A small room under a great tree's roots, built in code from Wendell's four concept views: arching root walls
   and vines, a stone hearth with shelves of pots, two paper lanterns, a mossy dais with a stone rim and two cushions, a
   stream with stepping stones, lily pads and crystals, and one wide opening onto a valley at dusk.
   Everything here is procedural geometry and canvas textures, so the page loads no room model and stays light on a phone.
   Lights are few on purpose (hearth, two lanterns, crystals, the Between's own): each point light costs every pixel. */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/* ---------- layout (metres; the floor is y = 0, the dais top is DAIS_Y) ---------- */
export const DAIS_R = 2.5, DAIS_Y = 0.28;
export const SHELL_R = 7, SHELL_H = 5.25;            // the root shell: an ellipsoid, open toward -z
export const WALK_R = 5.0;                           // how far from the middle anyone walks
const OPEN_W = 0.95;                                 // half-width of the opening, radians either side of -z
const OPEN_THETA = 0.86;                             // the opening's top edge, as an angle from straight up
export const SEATS = [                               // teal for whoever started, plum for whoever joined
  { x: -0.95, z: 0.5, yaw: Math.atan2(0.95, -1.7), hue: 0x3e9e93 },
  { x: 0.95, z: 0.5, yaw: Math.atan2(-0.95, -1.7), hue: 0x8f3f78 },
];
export const TABLE = { x: 0, z: 1.3, r: 0.5 };
const HEARTH = { x: 3.9, z: 3.1 };
const SHELF = { x: 5.0, z: 0.4 };
export const LANTERNS = [new THREE.Vector3(-2.3, 3.0, 1.7), new THREE.Vector3(1.8, 3.25, -2.1)];
// the stream runs down the left side (seen from the cushions, facing the opening) and out over the ledge
const STREAM = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-3.6, 0, 5.4), new THREE.Vector3(-4.2, 0, 3.0), new THREE.Vector3(-4.0, 0, 0.6),
  new THREE.Vector3(-3.9, 0, -1.8), new THREE.Vector3(-3.2, 0, -4.2), new THREE.Vector3(-2.6, 0, -7.4),
]);
const STREAM_HALF = 0.62;
const STREAM_PTS = STREAM.getSpacedPoints(80);
const OBST = [[HEARTH.x, HEARTH.z, 1.35], [SHELF.x, SHELF.z, 0.85], [TABLE.x, TABLE.z, TABLE.r + 0.05], [0, -0.35, 0.62], [4.6, -2.6, 0.5], [-1.8, 4.3, 0.45]];

/* ---------- small helpers ---------- */
function hash(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function noise3(x, y, z) { // cheap smooth value noise, enough for bark and rock
  const s = Math.sin(x * 1.7 + Math.sin(y * 2.3 + z * 0.7)) + Math.sin(y * 1.9 + Math.sin(z * 1.3 + x * 0.5)) + Math.sin(z * 2.1 + Math.sin(x * 1.1 + y * 0.9));
  return s / 3;
}
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.anisotropy = 4;
  return t;
}
function speckle(ctx, w, h, n, cols, rmin, rmax, r) {
  for (let i = 0; i < n; i++) { ctx.fillStyle = cols[Math.floor(r() * cols.length)]; ctx.beginPath(); ctx.arc(r() * w, r() * h, rmin + r() * (rmax - rmin), 0, Math.PI * 2); ctx.fill(); }
}
const distToStream = (x, z) => { let d = Infinity; for (const p of STREAM_PTS) { const dd = (p.x - x) ** 2 + (p.z - z) ** 2; if (dd < d) d = dd; } return Math.sqrt(d); };

/* ---------- where people and walkers may stand ---------- */
export function groundY(x, z) { return Math.hypot(x, z) <= DAIS_R + 0.12 ? DAIS_Y : 0; }
export function walkable(x, z, pad = 0.35) {
  if (Math.hypot(x, z) > WALK_R - pad) return false;
  if (z < -WALK_R + 0.9 + pad) return false; // the rope fence along the ledge
  for (const [ox, oz, r] of OBST) if (Math.hypot(x - ox, z - oz) < r + pad) return false;
  if (distToStream(x, z) < STREAM_HALF + pad) return false;
  return true;
}
export function pushOut(v, pad = 0.35) {
  for (let k = 0; k < 3; k++) {
    const d = Math.hypot(v.x, v.z), max = WALK_R - pad;
    if (d > max) { v.x *= max / d; v.z *= max / d; }
    const zmin = -WALK_R + 0.9 + pad; if (v.z < zmin) v.z = zmin;
    for (const [ox, oz, r] of OBST) {
      const dx = v.x - ox, dz = v.z - oz, dd = Math.hypot(dx, dz), m = r + pad;
      if (dd < m && dd > 1e-4) { v.x = ox + dx / dd * m; v.z = oz + dz / dd * m; }
    }
    // the stream: step back onto the bank nearest you
    let best = null, bd = Infinity;
    for (const p of STREAM_PTS) { const dd = Math.hypot(p.x - v.x, p.z - v.z); if (dd < bd) { bd = dd; best = p; } }
    const m = STREAM_HALF + pad;
    if (bd < m) {
      let dx = v.x - best.x, dz = v.z - best.z, dd = Math.hypot(dx, dz);
      if (dd < 1e-4) { dx = 1; dz = 0; dd = 1; } // dead centre: toward the room
      v.x = best.x + dx / dd * m; v.z = best.z + dz / dd * m;
    }
  }
  return v;
}
/* The camera may stand outside the shell: the shell is drawn from the inside only, so from out there the near wall
   vanishes and the hollow reads like a cut-away dollhouse. Roots between the camera and the room are hidden each frame
   (see update). It stays below the ceiling's height and above the floor. */
export function clampCamera(p, focus) {
  const rh = Math.hypot(p.x, p.z), max = 8.4;
  if (rh > max) { p.x *= max / rh; p.z *= max / rh; }
  p.y = Math.max(0.45, Math.min(4.3, p.y));
  return p;
}
/* Merge every plain mesh under `group` that shares a material into one mesh, baked in place. Meshes (or groups) marked
   userData.keep stay as they are, as do instanced meshes, points, sprites and skinned meshes. */
export function mergeStatic(group) {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const buckets = new Map(), drop = [];
  group.traverse(o => {
    if (o.userData.keep) return;
    let p = o.parent; while (p && p !== group) { if (p.userData.keep) return; p = p.parent; }
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material)) return;
    const m = o.material, vc = !!m.vertexColors;
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k) && !(vc && k === "color")) g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.morphAttributes = {};
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    const key = m.uuid + (vc ? ":c" : "") + ":" + o.renderOrder;
    if (!buckets.has(key)) buckets.set(key, { m, list: [], order: o.renderOrder });
    buckets.get(key).list.push(g); drop.push(o);
  });
  for (const o of drop) o.parent.remove(o);
  for (const { m, list, order } of buckets.values()) {
    const g = list.length === 1 ? list[0] : mergeGeometries(list, false);
    if (!g) continue;
    const mesh = new THREE.Mesh(g, m); mesh.renderOrder = order; group.add(mesh);
  }
}

/* For a rigged model whose parts ride on its bones as separate meshes (the spirits and daemons): merge each bone's own
   mesh children that share a material into one, in that bone's space, so the model still moves and draws far less. */
export function mergeByParent(root) {
  const parents = new Set();
  root.traverse(o => { if (o.isMesh && !o.isSkinnedMesh && !o.isInstancedMesh && o.parent) parents.add(o.parent); });
  for (const p of parents) {
    const buckets = new Map();
    for (const o of [...p.children]) {
      if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || Array.isArray(o.material) || o.children.length) continue;
      const key = o.material.uuid + (o.material.vertexColors ? ":c" : "");
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(o);
    }
    for (const list of buckets.values()) {
      if (list.length < 2) continue;
      const m = list[0].material, vc = !!m.vertexColors;
      const geos = list.map(o => {
        o.updateMatrix();
        let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
        for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k) && !(vc && k === "color")) g.deleteAttribute(k);
        if (!g.attributes.normal) g.computeVertexNormals();
        if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
        g.morphAttributes = {};
        return g.applyMatrix4(o.matrix);
      });
      const g = mergeGeometries(geos, false); if (!g) continue;
      for (const o of list) p.remove(o);
      const mesh = new THREE.Mesh(g, m); mesh.name = list[0].name; p.add(mesh);
    }
  }
}

/* ===================================================================================================
   Build it
   =================================================================================================== */
export function buildHollow(scene, opts = {}) {
  const lowPower = !!opts.lowPower;
  const r = rng(20261017);
  const anim = { flames: [], lanterns: [], vines: null, water: null, flies: null, sky: null, crystals: [], ferns: [] };

  /* ---------- textures ---------- */
  const barkTex = canvasTex(256, 512, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, "#5c4632"); g.addColorStop(0.5, "#6f5840"); g.addColorStop(1, "#56402c");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { // long fibres
      const x = r() * w, wv = 2 + r() * 6; c.strokeStyle = r() < 0.5 ? "rgba(40,24,14,.45)" : "rgba(150,104,66,.28)"; c.lineWidth = 1 + r() * 3;
      c.beginPath(); c.moveTo(x, 0); for (let y = 0; y <= h; y += 16) c.lineTo(x + Math.sin(y / 60 + i) * wv, y); c.stroke();
    }
  }, [1, 1]);
  const mossTex = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = "#56702c"; c.fillRect(0, 0, w, h);
    speckle(c, w, h, 900, ["#6f8a34", "#4a6326", "#7f9a3c", "#3e5420", "#8aa648"], 1, 4, r);
  }, [5, 5]);
  const stoneTex = canvasTex(512, 512, (c, w, h) => { // irregular flagstones with moss in the joints
    c.fillStyle = "#3d3a2a"; c.fillRect(0, 0, w, h);
    const cells = []; for (let i = 0; i < 46; i++) cells.push([r() * w, r() * h]);
    const img = c.getImageData(0, 0, w, h), d = img.data;
    const tone = cells.map(() => 112 + r() * 34);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let a1 = 1e9, a2 = 1e9, k = 0;
      for (let i = 0; i < cells.length; i++) { for (const [ox, oy] of [[0, 0], [w, 0], [-w, 0], [0, h], [0, -h]]) { const dx = x - cells[i][0] - ox, dy = y - cells[i][1] - oy, dd = dx * dx + dy * dy; if (dd < a1) { a2 = a1; a1 = dd; k = i; } else if (dd < a2) a2 = dd; } }
      const edge = Math.sqrt(a2) - Math.sqrt(a1), o = (y * w + x) * 4;
      if (edge < 2.5) { d[o] = 70; d[o + 1] = 80; d[o + 2] = 44; } // moss in the joints
      else { const v = tone[k] + (r() - 0.5) * 10 - (edge < 6 ? 12 : 0); d[o] = v; d[o + 1] = v * 0.93; d[o + 2] = v * 0.84; }
    }
    c.putImageData(img, 0, 0);
  }, [3, 3]);
  const rockTex = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#857565"; c.fillRect(0, 0, w, h); speckle(c, w, h, 400, ["#6d5f52", "#9a8a78", "#5d5046", "#7c8a55"], 1, 3, r); });
  const paperTex = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = "#fff1d6"; c.fillRect(0, 0, w, h);
    c.strokeStyle = "rgba(150,100,50,.35)"; c.lineWidth = 3; for (let y = 16; y < h; y += 26) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.strokeStyle = "rgba(120,110,50,.55)"; c.lineWidth = 3; // a sprig of leaves on each lantern
    for (const x0 of [64, 192]) { c.beginPath(); c.moveTo(x0, 220); c.quadraticCurveTo(x0 + 10, 130, x0 - 4, 40); c.stroke();
      for (let k = 0; k < 6; k++) { const y = 200 - k * 28, s = k % 2 ? 1 : -1; c.beginPath(); c.ellipse(x0 + s * 14, y, 12, 5, s * 0.6, 0, Math.PI * 2); c.stroke(); } }
  });
  const weave = (base, a, b) => canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) { c.fillStyle = y % 64 ? a : b; c.fillRect(0, y + 10, w, 6); for (let x = 0; x < w; x += 32) { c.beginPath(); c.moveTo(x + 16, y + 2); c.lineTo(x + 26, y + 13); c.lineTo(x + 16, y + 24); c.lineTo(x + 6, y + 13); c.closePath(); c.fill(); } }
  }, [2, 2]);
  const quilt = base => canvasTex(128, 128, (c, w, h) => { c.fillStyle = base; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(0,0,0,.18)"; c.lineWidth = 2; c.strokeRect(10, 10, w - 20, h - 20); c.beginPath(); c.moveTo(w / 2, 10); c.lineTo(w / 2, h - 10); c.moveTo(10, h / 2); c.lineTo(w - 10, h / 2); c.stroke(); });

  const M = {
    bark: new THREE.MeshStandardMaterial({ map: barkTex, color: 0x8f8a7c, roughness: 0.95, vertexColors: true }),
    root: new THREE.MeshStandardMaterial({ map: barkTex, color: 0xc4a68a, roughness: 0.9 }),
    moss: new THREE.MeshStandardMaterial({ map: mossTex, roughness: 1 }),
    floor: new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.92 }),
    rock: new THREE.MeshStandardMaterial({ map: rockTex, color: 0xb3a08a, roughness: 0.9, flatShading: true }),
    wood: new THREE.MeshStandardMaterial({ color: 0x7a5032, roughness: 0.8 }),
    darkWood: new THREE.MeshStandardMaterial({ color: 0x4f321e, roughness: 0.85 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x5e8a3a, roughness: 0.75, side: THREE.DoubleSide }),
    rope: new THREE.MeshStandardMaterial({ color: 0x9c7b52, roughness: 1 }),
    clay: new THREE.MeshStandardMaterial({ color: 0xa8603a, roughness: 0.8 }),
    soot: new THREE.MeshBasicMaterial({ color: 0x120b07 }),
  };

  const root = new THREE.Group(); root.name = "hollow"; scene.add(root);
  const add = (geo, mat, x, y, z, parent = root) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };

  /* ---------- the shell: an ellipsoid of root wood with the opening cut out toward -z ---------- */
  function shellPiece(phiStart, phiLen, thetaLen, ws, hs) {
    const g = new THREE.SphereGeometry(SHELL_R, ws, hs, phiStart, phiLen, 0, thetaLen);
    const p = g.attributes.position, col = new Float32Array(p.count * 3), v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const d = v.clone().normalize();
      const n = noise3(d.x * 4, d.y * 4, d.z * 4) * 0.35 + Math.sin(Math.atan2(d.x, d.z) * 9 + d.y * 6) * 0.18; // ridges like twisted roots
      v.multiplyScalar(1 - 0.05 + n * 0.06); v.y *= SHELL_H / SHELL_R;
      p.setXYZ(i, v.x, v.y, v.z);
      const k = 0.55 + 0.45 * (0.5 + n);
      const moss = Math.max(0, Math.min(1, (1.3 - v.y) / 1.1)) * (0.5 + 0.5 * noise3(d.x * 9, d.y * 9, d.z * 9)); // moss creeping up from the floor
      col[i * 3] = k * (1 - moss * 0.45); col[i * 3 + 1] = k * (0.9 + moss * 0.25); col[i * 3 + 2] = k * (0.84 - moss * 0.35);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, M.bark); m.material.side = THREE.BackSide; root.add(m); return m;
  }
  const ws = lowPower ? 40 : 56, hs = lowPower ? 18 : 24;
  shellPiece(Math.PI * 1.5 + OPEN_W, Math.PI * 2 - OPEN_W * 2, Math.PI / 2, ws, hs);
  shellPiece(Math.PI * 1.5 - OPEN_W, OPEN_W * 2, OPEN_THETA, 14, 10);

  /* roots arching over the ceiling, and two great ones framing the opening */
  const onShell = (phi, theta, k = 0.93) => new THREE.Vector3(-Math.cos(phi) * Math.sin(theta) * SHELL_R * k, Math.cos(theta) * SHELL_H * k, Math.sin(phi) * Math.sin(theta) * SHELL_R * k);
  const rootTube = (pts, rad, seg = 36) => {
    const curve = new THREE.CatmullRomCurve3(pts);
    const g = new THREE.TubeGeometry(curve, seg, rad, lowPower ? 6 : 8, false);
    // taper toward the ends so they melt into the wall
    const p = g.attributes.position, n = g.attributes.normal, ring = (lowPower ? 6 : 8) + 1;
    for (let i = 0; i < p.count; i++) {
      const u = Math.floor(i / ring) / seg, tp = Math.min(1, Math.sin(Math.PI * u) * 1.6 + 0.25);
      const c = curve.getPointAt(Math.min(1, u));
      p.setXYZ(i, c.x + (p.getX(i) - c.x) * tp, c.y + (p.getY(i) - c.y) * tp, c.z + (p.getZ(i) - c.z) * tp);
    }
    g.computeVertexNormals();
    const m = add(g, M.root, 0, 0, 0); m.userData.keep = true;
    m.userData.samples = curve.getSpacedPoints(14); m.userData.rad = rad;
    roots.push(m);
    return m;
  };
  const openAt = Math.PI * 1.5;
  const roots = [];
  for (let i = 0; i < (lowPower ? 12 : 18); i++) {
    let phi = openAt + OPEN_W + 0.15 + r() * (Math.PI * 2 - OPEN_W * 2 - 0.3);
    const drift = (r() - 0.5) * 1.6, pts = [];
    for (let k = 0; k <= 6; k++) { const th = Math.PI / 2 - k / 6 * (Math.PI / 2 - 0.08 - r() * 0.3); pts.push(onShell(phi + drift * k / 6 + Math.sin(k + i) * 0.08, th, 0.95 - r() * 0.03)); }
    pts[0].y = -0.1;
    rootTube(pts, 0.2 + r() * 0.25);
  }
  for (const s of [-1, 1]) { // the arch: one root up each side of the opening, meeting overhead
    const pts = [];
    for (let k = 0; k <= 8; k++) { const th = Math.PI / 2 - k / 8 * (Math.PI / 2 - OPEN_THETA + 0.05); pts.push(onShell(openAt + s * (OPEN_W + 0.04 - k * 0.012), th, 0.94)); }
    for (let k = 1; k <= 5; k++) pts.push(onShell(openAt + s * (OPEN_W - k / 5 * OPEN_W), OPEN_THETA - 0.04 - Math.sin(k / 5 * Math.PI) * 0.05, 0.94));
    pts[0].y = -0.2;
    rootTube(pts, 0.5, 48);
  }

  /* hanging vines: strands of leaves from the ceiling and the arch, swaying */
  {
    const strands = [];
    const ls = new THREE.Shape(); ls.moveTo(0, 0); ls.quadraticCurveTo(0.07, -0.06, 0, -0.17); ls.quadraticCurveTo(-0.07, -0.06, 0, 0);
    const leafGeo = new THREE.ShapeGeometry(ls, 3);
    const n = lowPower ? 26 : 40;
    for (let i = 0; i < n; i++) {
      const nearArch = i < n * 0.6;
      // along the arch, thicker toward its sides so the middle of the view stays open
      const side = r() < 0.5 ? -1 : 1, off = 0.35 + Math.pow(r(), 0.7) * 0.7;
      const phi = nearArch ? openAt + side * off * OPEN_W : r() * Math.PI * 2;
      const th = nearArch ? OPEN_THETA - 0.06 - r() * 0.1 : 0.4 + r() * 0.8;
      const top = onShell(phi, th, 0.9);
      if (top.y < 2.6) continue;
      strands.push({ top, len: (nearArch ? 5 + Math.floor((1 - Math.abs(off - 0.35)) * 6) : 4) + Math.floor(r() * 5), ph: r() * 6 });
    }
    const count = strands.reduce((a, s) => a + s.len, 0);
    const vm = new THREE.InstancedMesh(leafGeo, new THREE.MeshStandardMaterial({ color: 0xa8d070, roughness: 0.7, side: THREE.DoubleSide, emissive: 0x2a3a10, emissiveIntensity: 0.6 }), count);
    const colr = new THREE.Color(); let k = 0;
    for (const s of strands) for (let j = 0; j < s.len; j++) { colr.setHSL(0.22 + r() * 0.08, 0.5, 0.4 + r() * 0.18); vm.setColorAt(k++, colr); }
    root.add(vm); anim.vines = { mesh: vm, strands };
  }

  /* ---------- floor, dais, rim, rope fence ---------- */
  const floor = add(new THREE.CircleGeometry(SHELL_R * 0.98, 48), M.floor, 0, 0, 0); floor.rotation.x = -Math.PI / 2;
  const dais = add(new THREE.CylinderGeometry(DAIS_R, DAIS_R + 0.05, DAIS_Y, 48), M.moss, 0, DAIS_Y / 2, 0);
  { // rim stones
    const g = new THREE.BoxGeometry(0.62, 0.34, 0.34, 2, 1, 1); const n = 28;
    const rim = new THREE.InstancedMesh(g, M.rock, n); const o = new THREE.Object3D();
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; o.position.set(Math.cos(a) * (DAIS_R + 0.13), 0.15 + r() * 0.03, Math.sin(a) * (DAIS_R + 0.13)); o.rotation.set(0, -a + Math.PI / 2, (r() - 0.5) * 0.06); o.scale.set(0.95 + r() * 0.2, 1, 1); o.updateMatrix(); rim.setMatrixAt(i, o.matrix); }
    root.add(rim);
  }
  { // moss tufts along the dais edge
    const g = new THREE.SphereGeometry(0.22, 8, 6); const n = 40;
    const tufts = new THREE.InstancedMesh(g, M.moss, n); const o = new THREE.Object3D();
    for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, rr = DAIS_R - 0.05 + r() * 0.2; o.position.set(Math.cos(a) * rr, DAIS_Y + 0.02, Math.sin(a) * rr); o.scale.set(1 + r(), 0.35 + r() * 0.2, 1 + r()); o.updateMatrix(); tufts.setMatrixAt(i, o.matrix); }
    root.add(tufts);
  }
  { // the rope fence along the ledge
    const posts = [];
    for (let i = 0; i <= 6; i++) { const a = -0.85 + i / 6 * 1.7, rr = WALK_R + 0.3; posts.push(new THREE.Vector3(Math.sin(a) * rr, 0, -Math.cos(a) * rr + 0.85)); }
    for (const p of posts) { const m = add(new THREE.CylinderGeometry(0.08, 0.1, 1.1, 8), M.darkWood, p.x, 0.55, p.z); m.rotation.z = (r() - 0.5) * 0.08; }
    for (let i = 0; i < posts.length - 1; i++) {
      const a = posts[i].clone().setY(0.95), b = posts[i + 1].clone().setY(0.95), mid = a.clone().lerp(b, 0.5).setY(0.72);
      add(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 10, 0.025, 5), M.rope, 0, 0, 0);
    }
  }
  { // a few boulders and plants by the walls, so the edge is soft
    const g = new THREE.DodecahedronGeometry(0.5, 1);
    for (const [x, z, s] of [[4.6, -2.6, 1.0], [-1.8, 4.3, 0.8], [5.4, 2.0, 0.7], [-5.6, -2.0, 0.9], [2.4, 5.2, 0.9], [-5.0, 4.4, 0.8]]) { const m = add(g, M.rock, x, s * 0.3, z); m.scale.set(s * 1.3, s * 0.8, s); m.rotation.y = r() * 3; }
  }

  /* ---------- the hearth, its fire, and shelves of pots ---------- */
  const hearth = new THREE.Group(); hearth.position.set(HEARTH.x, 0, HEARTH.z); hearth.rotation.y = Math.atan2(-HEARTH.x, -HEARTH.z); root.add(hearth);
  {
    const blk = new THREE.BoxGeometry(1, 1, 1);
    const stone = (w, h, d, x, y, z) => { const m = add(blk, M.rock, x, y, z, hearth); m.scale.set(w, h, d); return m; };
    stone(0.5, 1.5, 0.9, -0.85, 0.75, 0); stone(0.5, 1.5, 0.9, 0.85, 0.75, 0);   // jambs
    stone(2.3, 0.4, 1.0, 0, 1.65, 0);                                             // lintel
    stone(2.6, 0.14, 1.15, 0, 1.92, 0.04);                                        // mantel
    stone(1.3, 1.5, 0.3, 0, 0.75, -0.36);                                         // back
    stone(2.2, 0.12, 1.3, 0, 0.06, 0.15);                                         // hearthstone
    add(new THREE.PlaneGeometry(1.2, 1.4), M.soot, 0, 0.78, -0.2, hearth);
    for (const [x, rz] of [[-0.18, 0.3], [0.16, -0.25], [0, 0]]) { const l = add(new THREE.CylinderGeometry(0.07, 0.08, 0.8, 7), M.darkWood, x, 0.2 + (x === 0 ? 0.1 : 0), 0, hearth); l.rotation.set(Math.PI / 2, 0, rz); }
    // the fire: stacked glowing cones that flicker
    const fireMat = c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < 7; i++) {
      const f = add(new THREE.ConeGeometry(0.12 + r() * 0.1, 0.5 + r() * 0.35, 8, 1, true), fireMat(i % 3 ? 0xff8a2a : 0xffc860), (r() - 0.5) * 0.5, 0.45, (r() - 0.5) * 0.2, hearth);
      anim.flames.push({ m: f, ph: r() * 10, base: f.scale.clone(), x: f.position.x });
    }
    // pots on the mantel
    const pot = (h, rr, mat) => { const pts = []; for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push(new THREE.Vector2(rr * (0.55 + Math.sin(u * Math.PI) * 0.6) * (u > 0.85 ? 0.75 : 1), u * h)); } return new THREE.Mesh(new THREE.LatheGeometry(pts, 12), mat); };
    const clays = [M.clay, new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.8 }), new THREE.MeshStandardMaterial({ color: 0x6e6a5a, roughness: 0.7 })];
    for (let i = 0; i < 6; i++) { const p = pot(0.22 + r() * 0.2, 0.1 + r() * 0.06, clays[i % 3]); p.position.set(-1.1 + i * 0.44, 1.99, 0.1); hearth.add(p); }
    // a shelf unit beside the hearth, against the wall
    const shelf = new THREE.Group(); shelf.position.set(SHELF.x, 0, SHELF.z); shelf.rotation.y = Math.atan2(-SHELF.x, -SHELF.z); root.add(shelf);
    for (const y of [0.05, 0.75, 1.45]) { const b = add(new THREE.BoxGeometry(1.5, 0.07, 0.5), M.wood, 0, y, 0, shelf); }
    for (const x of [-0.72, 0.72]) add(new THREE.BoxGeometry(0.07, 1.55, 0.5), M.wood, x, 0.78, 0, shelf);
    for (const y of [0.09, 0.79, 1.49]) for (let i = 0; i < 4; i++) { const p = pot(0.18 + r() * 0.22, 0.08 + r() * 0.06, clays[(i + Math.round(y * 3)) % 3]); p.position.set(-0.52 + i * 0.35, y, 0); shelf.add(p); }
    const bookCols = [0x7a3b2e, 0x3e5a6e, 0x6e5a2e, 0x4a3a5e];
    for (let i = 0; i < 4; i++) { const b = add(new THREE.BoxGeometry(0.07, 0.28, 0.22), new THREE.MeshStandardMaterial({ color: bookCols[i], roughness: 0.8 }), 0.2 + i * 0.08, 1.63, 0, shelf); b.rotation.z = i === 3 ? 0.3 : 0; }
    // two small stools
    for (const [x, z] of [[2.4, 3.8], [4.4, 1.6]]) { add(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 12), M.wood, x, 0.42, z); for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; const leg = add(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 5), M.darkWood, x + Math.cos(a) * 0.15, 0.2, z + Math.sin(a) * 0.15); } }
  }

  /* ---------- the two paper lanterns ---------- */
  {
    const pts = []; for (let k = 0; k <= 10; k++) { const u = k / 10; pts.push(new THREE.Vector2(0.24 * Math.sin(0.25 + u * (Math.PI - 0.5)) + 0.04, u * 0.62 - 0.31)); }
    const geo = new THREE.LatheGeometry(pts, 18);
    const mat = new THREE.MeshStandardMaterial({ map: paperTex, emissive: 0xffb860, emissiveMap: paperTex, emissiveIntensity: 1.25, roughness: 0.9, side: THREE.DoubleSide });
    const cap = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 12);
    for (const p of LANTERNS) {
      const g = new THREE.Group(); g.position.copy(p); root.add(g);
      const body = new THREE.Mesh(geo, mat); g.add(body);
      add(cap, M.darkWood, 0, 0.33, 0, g); add(cap, M.darkWood, 0, -0.33, 0, g);
      const tassel = add(new THREE.CylinderGeometry(0.02, 0.035, 0.2, 5), new THREE.MeshStandardMaterial({ color: 0xa0402a }), 0, -0.47, 0, g);
      const top = onShell(Math.atan2(p.z, -p.x), 0.3, 0.92); const cordLen = Math.max(0.3, top.y - p.y - 0.33);
      add(new THREE.CylinderGeometry(0.01, 0.01, cordLen, 4), M.rope, 0, 0.33 + cordLen / 2, 0, g);
      const light = new THREE.PointLight(0xffb066, 7, 9, 1.6); light.position.set(0, -0.05, 0); g.add(light);
      anim.lanterns.push({ g, light, ph: r() * 10, base: p.clone() });
    }
  }

  /* ---------- the stream: water, banks, stepping stones, lily pads, crystals ---------- */
  {
    const n = 90, pos = [], uv = [], idx = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, p = STREAM.getPointAt(u), t = STREAM.getTangentAt(u), side = new THREE.Vector3(-t.z, 0, t.x).normalize();
      const w = STREAM_HALF * (0.9 + 0.2 * Math.sin(u * 17));
      const a = p.clone().addScaledVector(side, -w), b = p.clone().addScaledVector(side, w);
      pos.push(a.x, 0.06, a.z, b.x, 0.06, b.z); uv.push(0, u * 12, 1, u * 12);
      if (i < n) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const water = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 } }, transparent: true, depthWrite: false,
      vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
      fragmentShader: `varying vec2 vUv; uniform float uT;
        void main(){
          float edge = smoothstep(0.0,0.18,vUv.x)*smoothstep(1.0,0.82,vUv.x);
          float rip = sin(vUv.y*9.0 - uT*2.2 + sin(vUv.x*6.0+uT)*1.5)*0.5+0.5;
          float rip2 = sin(vUv.y*23.0 - uT*3.1 + vUv.x*11.0)*0.5+0.5;
          vec3 deep = vec3(0.07,0.19,0.36), glow = vec3(0.30,0.80,0.92), warm = vec3(0.98,0.62,0.38);
          vec3 c = mix(deep, glow, pow(rip*rip2,3.0)*0.9 + 0.12);
          c += warm * pow(rip2, 12.0) * 0.5;
          gl_FragColor = vec4(c, 0.86*edge + 0.08);
        }`,
    });
    add(g, water, 0, 0, 0); anim.water = water;
    // a dark bed beneath, so the water reads as depth
    const bed = new THREE.Mesh(g.clone(), new THREE.MeshBasicMaterial({ color: 0x0b1420 })); bed.position.y = -0.03; root.add(bed);
    // bank stones
    const bg = new THREE.DodecahedronGeometry(0.22, 0), bn = lowPower ? 50 : 80;
    const bank = new THREE.InstancedMesh(bg, M.rock, bn); const o = new THREE.Object3D();
    for (let i = 0; i < bn; i++) { const u = (i >> 1) / (bn / 2), p = STREAM.getPointAt(u), t = STREAM.getTangentAt(u), side = new THREE.Vector3(-t.z, 0, t.x).normalize(); const s = i % 2 ? 1 : -1;
      o.position.copy(p).addScaledVector(side, s * (STREAM_HALF + 0.12 + r() * 0.1)); o.position.y = 0.06; o.scale.set(1 + r() * 0.8, 0.5 + r() * 0.4, 1 + r() * 0.6); o.rotation.y = r() * 3; o.updateMatrix(); bank.setMatrixAt(i, o.matrix); }
    root.add(bank);
    // stepping stones, lily pads
    for (const u of [0.42, 0.5, 0.58]) { const p = STREAM.getPointAt(u); add(new THREE.CylinderGeometry(0.36, 0.4, 0.14, 12), M.rock, p.x + (r() - 0.5) * 0.3, 0.08, p.z); }
    const padGeo = new THREE.CircleGeometry(0.2, 14, 0.3, Math.PI * 2 - 0.6); padGeo.rotateX(-Math.PI / 2);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x4f7a34, roughness: 0.6, side: THREE.DoubleSide });
    const lotusMat = new THREE.MeshStandardMaterial({ color: 0xf0a0d0, emissive: 0xd070b0, emissiveIntensity: 0.5 });
    for (let i = 0; i < 12; i++) { const u = 0.15 + r() * 0.8, p = STREAM.getPointAt(u); const pad = add(padGeo, padMat, p.x + (r() - 0.5) * 0.7, 0.075, p.z + (r() - 0.5) * 0.4); pad.rotation.y = r() * 6; pad.scale.setScalar(0.7 + r() * 0.7);
      if (i % 4 === 0) add(new THREE.SphereGeometry(0.06, 8, 6), lotusMat, pad.position.x, 0.12, pad.position.z); }
    // glowing crystals on the banks
    const cg = new THREE.OctahedronGeometry(0.16, 0); cg.scale(0.7, 1.9, 0.7);
    const cm = new THREE.MeshStandardMaterial({ color: 0x9ff5e6, emissive: 0x40d8c0, emissiveIntensity: 1.4, roughness: 0.2, transparent: true, opacity: 0.9 });
    for (const u of [0.18, 0.33, 0.47, 0.64, 0.78, 0.9]) {
      const p = STREAM.getPointAt(u), t = STREAM.getTangentAt(u), side = new THREE.Vector3(-t.z, 0, t.x).normalize(), s = u > 0.5 ? 1 : -1;
      const base = p.clone().addScaledVector(side, s * (STREAM_HALF + 0.35));
      for (let k = 0; k < 3; k++) { const c = add(cg, cm, base.x + (r() - 0.5) * 0.3, 0.2, base.z + (r() - 0.5) * 0.3); c.rotation.set((r() - 0.5) * 0.7, r() * 3, (r() - 0.5) * 0.7); c.scale.setScalar(0.6 + r() * 0.7); anim.crystals.push(c); }
    }
    const cl = new THREE.PointLight(0x5fe0d0, 6, 6, 1.6); cl.position.copy(STREAM.getPointAt(0.55)).setY(0.8); root.add(cl); anim.crystalLight = cl;
    anim.crystalMat = cm;
  }

  /* ---------- the dais: cushions, low table with tea, blanket, ferns ---------- */
  const cushions = [];
  {
    const cg = new THREE.BoxGeometry(1, 1, 1, 6, 2, 6);
    const p = cg.attributes.position; // round the box into a cushion
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 1 - (Math.abs(x * 2) ** 4 + Math.abs(z * 2) ** 4) * 0.35; p.setY(i, y * Math.max(0.25, k)); const s = 1 - Math.abs(y) * 0.12; p.setX(i, x * s); p.setZ(i, z * s); }
    cg.computeVertexNormals();
    SEATS.forEach((s, i) => {
      const m = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ map: quilt(i ? "#7d3466" : "#2f7f78"), roughness: 0.85 }));
      m.scale.set(1.0, 0.26, 0.85); m.position.set(s.x, DAIS_Y + 0.12, s.z); m.rotation.y = s.yaw; root.add(m);
      cushions.push(m);
    });
    // a woven blanket over the plum cushion's edge, and one on the moss in front
    const blanketA = add(new THREE.PlaneGeometry(1.0, 0.75, 8, 6), new THREE.MeshStandardMaterial({ map: weave("#c9a07e", "#8f3f78", "#e6cfb0"), roughness: 1, side: THREE.DoubleSide }), SEATS[1].x + 0.25, DAIS_Y + 0.27, SEATS[1].z + 0.05);
    blanketA.rotation.set(-Math.PI / 2, 0, SEATS[1].yaw + 0.3);
    const blanketB = add(new THREE.PlaneGeometry(1.5, 1.0, 10, 6), new THREE.MeshStandardMaterial({ map: weave("#2f6f72", "#d8c8a8", "#1e4e52"), roughness: 1, side: THREE.DoubleSide }), -0.7, DAIS_Y + 0.02, 1.85);
    blanketB.rotation.set(-Math.PI / 2, 0, 0.35);
    // the low table, a teapot and two cups
    add(new THREE.CylinderGeometry(TABLE.r, TABLE.r + 0.04, 0.09, 24), M.wood, TABLE.x, DAIS_Y + 0.24, TABLE.z);
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + 0.4; add(new THREE.CylinderGeometry(0.05, 0.06, 0.2, 6), M.darkWood, TABLE.x + Math.cos(a) * 0.32, DAIS_Y + 0.1, TABLE.z + Math.sin(a) * 0.32); }
    const tea = new THREE.MeshStandardMaterial({ color: 0x5a3a28, roughness: 0.5 });
    const potB = add(new THREE.SphereGeometry(0.12, 14, 10), tea, TABLE.x - 0.1, DAIS_Y + 0.38, TABLE.z - 0.05); potB.scale.y = 0.8;
    const spout = add(new THREE.CylinderGeometry(0.015, 0.03, 0.14, 6), tea, TABLE.x + 0.03, DAIS_Y + 0.4, TABLE.z - 0.05); spout.rotation.z = -0.9;
    for (const [dx, dz] of [[0.2, 0.1], [-0.3, 0.18]]) add(new THREE.CylinderGeometry(0.05, 0.04, 0.06, 10), tea, TABLE.x + dx, DAIS_Y + 0.32, TABLE.z + dz);
    add(new THREE.BoxGeometry(0.26, 0.05, 0.19), new THREE.MeshStandardMaterial({ color: 0x6a4a34, roughness: 0.8 }), TABLE.x + 0.2, DAIS_Y + 0.31, TABLE.z - 0.15).rotation.y = 0.3;
    // ferns and glowing flowers round the back of the dais
    const frond = new THREE.PlaneGeometry(0.16, 0.7, 1, 4); frond.translate(0, 0.35, 0);
    { const p2 = frond.attributes.position; for (let i = 0; i < p2.count; i++) { const y = p2.getY(i); p2.setZ(i, (y * y) * 0.5); p2.setX(i, p2.getX(i) * (1 - y / 0.8)); } frond.computeVertexNormals(); }
    for (const [x, z] of [[-2.0, -1.2], [2.1, -1.0], [-1.6, 1.9], [-2.4, 0.2], [2.3, 0.9], [5.3, -0.9], [-4.6, 1.8], [3.2, 4.4], [-3.0, 4.7], [1.0, 5.0]]) {
      const f = new THREE.Group(); f.position.set(x, groundY(x, z), z); root.add(f);
      for (let k = 0; k < 7; k++) { const m = new THREE.Mesh(frond, M.leaf); m.rotation.set(0, k / 7 * Math.PI * 2 + r(), 0); m.children; const tilt = new THREE.Group(); tilt.rotation.y = k / 7 * Math.PI * 2; m.rotation.set(0.5 + r() * 0.4, 0, 0); tilt.add(m); f.add(tilt); }
      f.scale.setScalar(0.8 + r() * 0.5);
    }
  }

  /* ---------- the valley outside: sky, sun, mountains, forest, river (unlit, no fog) ---------- */
  {
    const sky = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uSun: { value: new THREE.Vector3(0.18, 0.05, -1).normalize() } },
      vertexShader: "varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
      fragmentShader: `varying vec3 vDir; uniform vec3 uSun;
        void main(){
          float h = vDir.y;
          vec3 top = vec3(0.17,0.12,0.36), mid = vec3(0.52,0.33,0.62), low = vec3(0.98,0.56,0.40), hor = vec3(1.0,0.74,0.48);
          vec3 c = mix(low, mid, smoothstep(0.02,0.22,h)); c = mix(c, top, smoothstep(0.2,0.65,h)); c = mix(hor, c, smoothstep(-0.02,0.06,h));
          float s = max(dot(vDir, uSun), 0.0);
          c += vec3(1.0,0.6,0.3) * pow(s, 18.0) * 0.6 + vec3(1.0,0.85,0.6) * pow(s, 400.0) * 2.0;
          float band = sin(vDir.x*9.0 + vDir.y*40.0)*0.5+0.5; c = mix(c, vec3(0.95,0.55,0.62), band*smoothstep(0.12,0.2,h)*smoothstep(0.34,0.24,h)*0.25);
          if (h < -0.02) c = mix(vec3(0.14,0.16,0.26), c, 0.0);
          gl_FragColor = vec4(c,1.0);
        }`,
    });
    const skyM = new THREE.Mesh(new THREE.SphereGeometry(95, 32, 16), sky); skyM.renderOrder = -2; root.add(skyM);
    const sunM = new THREE.Mesh(new THREE.CircleGeometry(3.2, 32), new THREE.MeshBasicMaterial({ color: 0xffcf86, fog: false }));
    sunM.position.set(0.18, 0.05, -1).normalize().multiplyScalar(88); sunM.position.y = 3.4; sunM.lookAt(0, 0, 0); root.add(sunM);
    // mountain ranges, far to near
    const range = (dist, base, amp, col, seed, peaks) => {
      const rr = rng(seed), pos = [], idx = [], n = 70;
      for (let i = 0; i <= n; i++) {
        const a = -1.4 + i / n * 2.8, x = Math.sin(a) * dist, z = -Math.cos(a) * dist;
        let h = base + amp * (0.5 + 0.5 * Math.sin(a * 5 + seed) * Math.sin(a * 2.3 + seed * 0.3)) + rr() * amp * 0.15;
        for (const [pa, pw, ph] of peaks) h += ph * Math.max(0, 1 - Math.abs(a - pa) / pw);
        pos.push(x, -24, z, x, h, z); if (i < n) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col, fog: false, side: THREE.DoubleSide })); root.add(m); return m;
    };
    range(84, -2, 6, 0x9a7cb0, 3, [[0.32, 0.2, 12]]);
    range(70, -6, 5, 0x75609a, 7, [[-0.5, 0.3, 4]]);
    range(55, -10, 4, 0x4a4674, 11, []);
    range(40, -13, 3, 0x2e3758, 13, []);
    // the valley floor, the river catching the sunset, and pines
    const vf = new THREE.Mesh(new THREE.CircleGeometry(80, 32, Math.PI * 1.02, Math.PI * 0.96), new THREE.MeshBasicMaterial({ color: 0x1f2c40, fog: false })); vf.rotation.x = -Math.PI / 2; vf.position.y = -14; vf.rotation.z = Math.PI; root.add(vf);
    const riv = new THREE.CatmullRomCurve3([new THREE.Vector3(10, -13.9, -66), new THREE.Vector3(-2, -13.9, -48), new THREE.Vector3(8, -13.9, -34), new THREE.Vector3(-6, -13.9, -22), new THREE.Vector3(-14, -13.9, -12)]);
    { const n = 60, pos = [], col = [], idx = [];
      for (let i = 0; i <= n; i++) { const u = i / n, p = riv.getPointAt(u), t = riv.getTangentAt(u), s = new THREE.Vector3(-t.z, 0, t.x).normalize(), w = 0.6 + u * 3.2;
        pos.push(p.x - s.x * w, p.y, p.z - s.z * w, p.x + s.x * w, p.y, p.z + s.z * w);
        const c = new THREE.Color(0xf7b07a).lerp(new THREE.Color(0x6a5aa8), u * 0.8); col.push(c.r, c.g, c.b, c.r, c.g, c.b);
        if (i < n) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
      root.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide }))); }
    const pineGeo = new THREE.ConeGeometry(1, 3, 6); pineGeo.translate(0, 1.5, 0);
    const pn = lowPower ? 220 : 380, pines = new THREE.InstancedMesh(pineGeo, new THREE.MeshBasicMaterial({ fog: false }), pn), o = new THREE.Object3D(), pc = new THREE.Color();
    for (let i = 0; i < pn; i++) {
      let x, z; for (let k = 0; k < 10; k++) { const a = -1.3 + r() * 2.6, d = 12 + r() * 58; x = Math.sin(a) * d; z = -Math.cos(a) * d; const rp = riv.getPoints(30); if (!rp.some(p => Math.hypot(p.x - x, p.z - z) < 4)) break; }
      const d = Math.hypot(x, z), s = 0.7 + r() * 0.8 + d * 0.01;
      o.position.set(x, -14 + Math.max(0, (Math.abs(x) - 20) * 0.25), z); o.scale.set(s * 0.6, s * (1 + r() * 0.6), s * 0.6); o.updateMatrix(); pines.setMatrixAt(i, o.matrix);
      pc.set(0x14283a).lerp(new THREE.Color(0x4a4a7a), Math.min(1, d / 75)); pines.setColorAt(i, pc);
    }
    root.add(pines);
    // a sliver of clouds and the first stars
    const stars = new THREE.BufferGeometry(), sp = [];
    for (let i = 0; i < 70; i++) { const a = -1.4 + r() * 2.8, e = 0.35 + r() * 0.5; sp.push(Math.sin(a) * Math.cos(e) * 90, Math.sin(e) * 90, -Math.cos(a) * Math.cos(e) * 90); }
    stars.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
    root.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: 0xfff4e0, size: 2.5, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.7 })));
    anim.sky = sky;
  }

  /* ---------- fireflies ---------- */
  {
    const glow = canvasTex(64, 64, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, "rgba(255,250,200,1)"); g.addColorStop(0.3, "rgba(230,240,140,.6)"); g.addColorStop(1, "rgba(200,220,100,0)"); c.fillStyle = g; c.fillRect(0, 0, w, w); });
    const n = lowPower ? 36 : 56, geo = new THREE.BufferGeometry(), seeds = [];
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, d = 1.5 + r() * 4.5; seeds.push({ x: Math.sin(a) * d, z: Math.cos(a) * d - 0.6, y: 0.5 + r() * 2.6, ph: r() * 20, sp: 0.2 + r() * 0.4 }); }
    const mat = new THREE.PointsMaterial({ map: glow, size: 0.22, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xfff6b0 });
    const pts = new THREE.Points(geo, mat); root.add(pts); anim.flies = { geo, seeds, mat };
  }

  /* ---------- light: warm pools inside, cool dusk from the opening ---------- */
  const hemi = new THREE.HemisphereLight(0xffcf9a, 0x2a1c22, 0.55); root.add(hemi);
  const dusk = new THREE.DirectionalLight(0x8a7ad8, 0.9); dusk.position.set(0.5, 3, -10); root.add(dusk);
  const rim = new THREE.DirectionalLight(0xff9a6a, 0.35); rim.position.set(2, 1.5, -12); root.add(rim);
  const fire = new THREE.PointLight(0xff8a3a, 16, 10, 1.5); fire.position.set(HEARTH.x * 0.82, 0.8, HEARTH.z * 0.82); root.add(fire);

  /* ---------- once a frame ---------- */
  const o3 = new THREE.Object3D(), seg = new THREE.Line3(), tmp = new THREE.Vector3();
  function update(t, dt, scale = 1, cam, focus) {
    if (cam && focus) { // hide any root that crosses the line from the camera to what it looks at
      seg.set(cam, focus);
      for (const m of roots) { let hit = false; for (const q of m.userData.samples) { seg.closestPointToPoint(q, true, tmp); if (tmp.distanceTo(q) < m.userData.rad + 0.35) { hit = true; break; } } m.visible = !hit; }
    }
    // fire flicker, and the light it throws
    const fl = 0.75 + Math.sin(t * 11.3) * 0.08 + Math.sin(t * 23.7) * 0.06 + Math.sin(t * 5.1) * 0.08;
    fire.intensity = 16 * fl * scale;
    for (const f of anim.flames) { const k = 0.8 + Math.sin(t * 9 + f.ph) * 0.18 + Math.sin(t * 21 + f.ph * 2) * 0.1; f.m.scale.set(f.base.x * (1.1 - k * 0.2), f.base.y * k * 1.15, f.base.z); f.m.position.x = f.x + Math.sin(t * 6 + f.ph) * 0.03; }
    for (const L of anim.lanterns) { L.g.rotation.z = Math.sin(t * 0.7 + L.ph) * 0.03; L.g.rotation.x = Math.sin(t * 0.5 + L.ph) * 0.025; L.light.intensity = 7 * scale * (0.93 + Math.sin(t * 7 + L.ph) * 0.04 + Math.sin(t * 17 + L.ph) * 0.03); }
    if (anim.water) anim.water.uniforms.uT.value = t;
    if (anim.crystalLight) { anim.crystalLight.intensity = 6 * (0.85 + Math.sin(t * 1.3) * 0.15); anim.crystalMat.emissiveIntensity = 1.2 + Math.sin(t * 1.3) * 0.25; }
    hemi.intensity = 0.55 * (0.6 + 0.4 * scale);
    // vines sway
    if (anim.vines) {
      const { mesh, strands } = anim.vines; let k = 0;
      for (const s of strands) {
        const sw = Math.sin(t * 0.8 + s.ph) * 0.06, sw2 = Math.cos(t * 0.6 + s.ph) * 0.05;
        for (let j = 0; j < s.len; j++) { o3.position.set(s.top.x + sw * j * j * 0.08, s.top.y - j * 0.13, s.top.z + sw2 * j * j * 0.08); o3.rotation.set(sw2 * 2, j * 1.9 + s.ph, (j % 2 ? 0.5 : -0.5) + sw * 3); o3.scale.setScalar(1 - j * 0.03); o3.updateMatrix(); mesh.setMatrixAt(k++, o3.matrix); }
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
    // fireflies wander and blink
    if (anim.flies) {
      const a = anim.flies.geo.attributes.position.array;
      anim.flies.seeds.forEach((s, i) => { const u = t * s.sp + s.ph; a[i * 3] = s.x + Math.sin(u * 1.3) * 0.8; a[i * 3 + 1] = s.y + Math.sin(u * 0.9) * 0.4; a[i * 3 + 2] = s.z + Math.cos(u * 1.1) * 0.8; });
      anim.flies.geo.attributes.position.needsUpdate = true;
      anim.flies.mat.opacity = 0.75 + Math.sin(t * 2.1) * 0.2;
    }
  }
  // the room never moves: fold its meshes into one draw per material (hundreds of draws become a few dozen on a phone)
  for (const L of anim.lanterns) L.g.userData.keep = true;
  for (const f of anim.flames) f.m.userData.keep = true;
  cushions.forEach(c => c.userData.keep = true);
  mergeStatic(root);
  return { root, update, cushions };
}
export { hash };
