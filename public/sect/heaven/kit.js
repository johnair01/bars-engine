// Round 10: copied into bars-engine; roof() takes `lite` (fewer rafter ends) so ~150 roofs stay cheap.
// kit.js (Heaven sect, art direction round 2, 2026-11-07; copied from round 1, adds an open front, a hall interior and figure poses): the place kit of the mountain gate, made reusable.
// Ported from the place block of gate.html in council/callsheets/stills/2026-11-06-cultivated-character-gate/make/
// (council PR #1133, round 2, look cc-gate-look-2): the cut-stone blocks with moss, the paving, the weathered red
// plaster, the red lacquer and painted teal-and-gold beam, the tile-channel hip roof with a drip-tile eave and rafter
// ends, the curled ridge ends, the pines with branches and needle pads, the painted ridges and the mist. What changed:
// every builder takes its size and returns a Group in its own frame (front is +z), so a hall, a gate or a pine can be
// placed anywhere; and a hall can stand at four stages of building (plinth, frame, half, full) for the eras.
import * as THREE from 'three';
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const RND = seed => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
export const tex = (w, h, draw, rep = [1, 1], srgb = true) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = 4; return t; };
// stone in blocks: courses of cut blocks, each a little different, dark joints, moss in the lower joints (gate.html)
export const blocks = (base, seed, rows, moss) => (x, w, h) => { const rnd = RND(seed); x.fillStyle = base; x.fillRect(0, 0, w, h); const rh = h / rows;
  for (let j = 0; j < rows; j++) { let px = -rnd() * 60; while (px < w) { const bw = 70 + rnd() * 110, sh = (rnd() - 0.5) * 22;
    x.fillStyle = `rgb(${158 + sh},${150 + sh},${139 + sh})`; x.globalAlpha = 0.55; x.fillRect(px + 2, j * rh + 2, bw - 4, rh - 4); x.globalAlpha = 1;
    for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(${rnd() < 0.5 ? '50,45,40' : '255,250,240'},${0.04 + 0.06 * rnd()})`; x.fillRect(px + rnd() * bw, j * rh + rnd() * rh, 2 + 8 * rnd(), 1 + 4 * rnd()); }
    x.fillStyle = 'rgba(48,42,38,0.55)'; x.fillRect(px, j * rh, 3, rh); px += bw; }
    x.fillStyle = 'rgba(48,42,38,0.6)'; x.fillRect(0, j * rh, w, 3);
    if (moss) for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(${86 + rnd() * 30},${104 + rnd() * 25},${62 + rnd() * 15},${0.35 + 0.35 * rnd()})`; x.beginPath(); x.ellipse(rnd() * w, (j + 1) * rh - 2, 6 + 22 * rnd(), 2 + 5 * rnd(), 0, 0, 7); x.fill(); } } };

export function materials() {
  const M = {};
  M.stone = new THREE.MeshStandardMaterial({ map: tex(512, 128, blocks('#9d968c', 7, 1, true), [3, 1]), roughness: 0.93 });
  M.stoneD = new THREE.MeshStandardMaterial({ map: tex(512, 512, blocks('#8a8379', 11, 4, true), [4, 2]), roughness: 0.95 });
  M.paving = new THREE.MeshStandardMaterial({ map: tex(512, 512, (x, w, h) => { const rnd = RND(23); x.fillStyle = '#8f887d'; x.fillRect(0, 0, w, h);
    for (let j = 0; j < 6; j++) { let px = -rnd() * 50; while (px < w) { const bw = 60 + rnd() * 90, sh = (rnd() - 0.5) * 26; x.fillStyle = `rgb(${146 + sh},${139 + sh},${127 + sh})`; x.fillRect(px + 3, j * h / 6 + 3, bw - 6, h / 6 - 6); px += bw; } }
    for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(${90 + rnd() * 20},${108 + rnd() * 20},${66},${0.25 + 0.3 * rnd()})`; x.beginPath(); x.ellipse(rnd() * w, rnd() * h, 2 + 9 * rnd(), 1 + 3 * rnd(), 0, 0, 7); x.fill(); } }, [8, 6]), roughness: 0.96 });
  M.earth = new THREE.MeshStandardMaterial({ map: tex(256, 256, (x, w, h) => { const rnd = RND(29); x.fillStyle = '#7d6a52'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(${rnd() < 0.5 ? '60,48,36' : '150,132,104'},${0.1 + 0.2 * rnd()})`; x.fillRect(rnd() * w, rnd() * h, 2 + 6 * rnd(), 2 + 4 * rnd()); } }, [6, 6]), roughness: 1 });
  M.plaster = new THREE.MeshStandardMaterial({ map: tex(512, 512, (x, w, h) => { const rnd = RND(31); x.fillStyle = '#8f4a3b'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(${rnd() < 0.5 ? '70,28,22' : '190,120,100'},${0.03 + 0.05 * rnd()})`; x.fillRect(rnd() * w, rnd() * h, 3 + 14 * rnd(), 2 + 8 * rnd()); }
    for (let i = 0; i < 26; i++) { const sx = rnd() * w, g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(60,30,24,0.22)'); g.addColorStop(1, 'rgba(60,30,24,0)'); x.fillStyle = g; x.fillRect(sx, 0, 2 + 8 * rnd(), h * (0.3 + 0.6 * rnd())); }
    const g = x.createLinearGradient(0, h * 0.8, 0, h); g.addColorStop(0, 'rgba(50,40,34,0)'); g.addColorStop(1, 'rgba(50,40,34,0.45)'); x.fillStyle = g; x.fillRect(0, h * 0.8, w, h * 0.2); }), roughness: 0.92 });
  M.lacR = new THREE.MeshStandardMaterial({ color: 0x86281f, roughness: 0.5 });
  M.wood = new THREE.MeshStandardMaterial({ color: 0x4a3326, roughness: 0.7 });
  M.raw = new THREE.MeshStandardMaterial({ color: 0xb08a5e, roughness: 0.85 }); // new timber, not yet lacquered
  M.plinth = new THREE.MeshStandardMaterial({ map: tex(512, 128, blocks('#d8d1c2', 41, 1, false), [3, 1]), roughness: 0.9 });
  M.drum = new THREE.MeshStandardMaterial({ color: 0xcfc7b6, roughness: 0.85 });
  M.brass = new THREE.MeshStandardMaterial({ color: 0xb08f50, roughness: 0.4, metalness: 0.65 });
  M.painted = new THREE.MeshStandardMaterial({ map: tex(1024, 128, (x, w, h) => { x.fillStyle = '#2f5d5c'; x.fillRect(0, 0, w, h); x.fillStyle = '#c8a457'; x.fillRect(0, 0, w, 8); x.fillRect(0, h - 8, w, 8);
    for (let i = 0; i < 9; i++) { const cx = (i + 0.5) * w / 9; x.fillStyle = '#284a7a'; x.beginPath(); x.ellipse(cx, h / 2, 46, 38, 0, 0, 7); x.fill(); x.strokeStyle = '#e9e1cc'; x.lineWidth = 5; x.beginPath(); x.ellipse(cx, h / 2, 34, 26, 0, 0, 7); x.stroke(); x.fillStyle = '#c8a457'; x.beginPath(); x.arc(cx, h / 2, 9, 0, 7); x.fill(); } }), roughness: 0.7 });
  M.brk = new THREE.MeshStandardMaterial({ color: 0x2f5d5c, roughness: 0.7 }); M.brkG = new THREE.MeshStandardMaterial({ color: 0x9a7a3f, roughness: 0.6, metalness: 0.2 });
  const tileTex = (x, w, h) => { const rnd = RND(53); for (let i = 0; i < w; i++) { const u = (i % 32) / 32, c = 0.5 + 0.5 * Math.cos(u * Math.PI * 2), v = Math.round(40 + 38 * c); x.fillStyle = `rgb(${v},${v + 3},${v + 8})`; x.fillRect(i, 0, 1, h); }
    for (let j = 0; j < h; j += 16) { x.fillStyle = 'rgba(15,15,18,0.35)'; x.fillRect(0, j, w, 2); }
    for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(${rnd() < 0.6 ? '120,125,110' : '20,20,22'},${0.06 + 0.1 * rnd()})`; x.fillRect(rnd() * w, rnd() * h, 2 + 6 * rnd(), 2 + 6 * rnd()); } };
  M.tile = new THREE.MeshStandardMaterial({ map: tex(128, 128, tileTex), bumpMap: tex(128, 128, tileTex, [1, 1], false), bumpScale: 2.5, roughness: 0.7, side: THREE.DoubleSide });
  M.tileM = new THREE.MeshStandardMaterial({ color: 0x34373c, roughness: 0.65 });
  M.raftEnd = new THREE.MeshStandardMaterial({ color: 0xc8a457, roughness: 0.6 });
  // lattice doors: dark wood with a square lattice; the lit copy glows warm from inside (one hall lit in the peer era)
  const lattice = lit => tex(256, 256, (x, w, h) => { x.fillStyle = lit ? '#ffcf86' : '#2a1d17'; x.fillRect(0, 0, w, h); x.strokeStyle = lit ? '#5a2a1a' : '#6b4a36'; x.lineWidth = 5;
    for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * w / 8, 0); x.lineTo(i * w / 8, h); x.stroke(); x.beginPath(); x.moveTo(0, i * h / 8); x.lineTo(w, i * h / 8); x.stroke(); }
    x.lineWidth = 14; x.strokeStyle = '#5c2219'; x.strokeRect(0, 0, w, h); x.fillStyle = '#5c2219'; x.fillRect(0, h * 0.72, w, h * 0.28); });
  M.door = new THREE.MeshStandardMaterial({ map: lattice(false), roughness: 0.7 });
  M.doorLit = new THREE.MeshStandardMaterial({ map: lattice(true), emissiveMap: lattice(true), emissive: 0xffffff, emissiveIntensity: 1.1, roughness: 0.7 });
  M.bark = new THREE.MeshStandardMaterial({ map: tex(128, 256, (x, w, h) => { const rnd = RND(61); x.fillStyle = '#4b372a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(${rnd() < 0.5 ? '25,18,14' : '120,96,74'},${0.2 + 0.3 * rnd()})`; x.fillRect(rnd() * w, rnd() * h, 3 + 12 * rnd(), 6 + 20 * rnd()); } }, [2, 3]), roughness: 0.95 });
  M.ndD = new THREE.MeshStandardMaterial({ color: 0x2c4234, roughness: 0.95, flatShading: true }); M.ndL = new THREE.MeshStandardMaterial({ color: 0x4e6e4f, roughness: 0.9, flatShading: true });
  M.rock = new THREE.MeshStandardMaterial({ color: 0x7f7a71, roughness: 0.95, flatShading: true });
  M.cloth = new THREE.MeshStandardMaterial({ color: 0xe9e1cc, roughness: 0.9, side: THREE.DoubleSide });
  return M;
}

export const box = (P, w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; P.add(b); return b; };
const cyl = (P, r0, r1, h, m, x, y, z, s = 12) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, s), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; P.add(c); return c; };

// the hip roof of gate.html: tile channels eave to ridge, the eave lifting at the corners, a drip-tile eave, rafter ends,
// a ridge with curled ends. rows < 1 lays tiles only on the lower part of each slope (a roof being tiled).
export function roof(P, M, { w, d, y, ex = 0.9, rise = 1.35, rows = 1, lift = 0.42, ridgeIn = 0.6, lite = false }) {
  const W2 = w / 2 + ex, D2 = d / 2 + ex, rW = Math.max(0.2, w / 2 - d / 2 * ridgeIn), N = 24, R2 = 10, M2 = 4 * N, pos = [], uv = [], idx = [], eaveP = [];
  const P4 = [[-W2, D2], [W2, D2], [W2, -D2], [-W2, -D2]], R4 = [[-rW, 0], [rW, 0], [rW, 0], [-rW, 0]];
  const at = (A, t) => { const s = Math.floor(t) % 4, u = t - Math.floor(t), a = A[s], b = A[(s + 1) % 4]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, u]; };
  const top = y + rise, Rr = Math.max(1, Math.round(R2 * rows));
  for (let j = 0; j <= R2; j++) { const v2 = j / R2; for (let i = 0; i <= M2; i++) { const t = i / N, [ex2, ez, u] = at(P4, t), [rx, rz] = at(R4, t), lf = lift * Math.pow(Math.abs(u - 0.5) * 2, 4) * (w + d) / 7;
    const x = ex2 + (rx - ex2) * v2, zz = ez + (rz - ez) * v2, yy = y + 0.05 + lf * (1 - v2) + (top - y) * Math.pow(v2, 1.6); pos.push(x, yy, zz); uv.push(t * w * 2.2, v2 * 6); if (j === 0) eaveP.push(V(x, yy - 0.02, zz)); } }
  for (let j = 0; j < Math.min(R2, Rr); j++) for (let i = 0; i < M2; i++) { const a = j * (M2 + 1) + i, b = a + 1, c = a + M2 + 1, dd = b + M2 + 1; idx.push(a, b, c, b, dd, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const rm = new THREE.Mesh(g, M.tile); rm.castShadow = rm.receiveShadow = true; P.add(rm);
  const ec = new THREE.CatmullRomCurve3(eaveP, true); const et = new THREE.Mesh(new THREE.TubeGeometry(ec, lite ? 96 : 300, 0.07, 5, true), M.tileM); et.castShadow = true; P.add(et);
  for (let i = 0; i < 300; i += lite ? 12 : 4) { const p = ec.getPointAt(i / 300), tg = ec.getTangentAt(i / 300), out = V(-tg.z, 0, tg.x).normalize();
    const re = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 6), M.raftEnd); re.position.copy(p).addScaledVector(out, -0.02).add(V(0, -0.1, 0)); re.lookAt(re.position.clone().add(out)); re.rotateX(Math.PI / 2); P.add(re); }
  if (rows < 1) { // the rafters still bare above the tiles: a row of raw timber running eave to ridge on each long slope
    for (const sz of [-1, 1]) for (let x = -W2 + 0.4; x <= W2 - 0.4; x += 0.55) { const xr = Math.max(-rW, Math.min(rW, x)); const a = V(x, y + 0.1, sz * D2 * 0.8), b = V(xr, top - 0.05, 0);
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, a.distanceTo(b)), M.raw); m.position.copy(a).lerp(b, 0.5); m.lookAt(b); m.castShadow = true; P.add(m); }
    return; }
  box(P, 2 * rW + 0.4, 0.26, 0.26, M.tileM, 0, top + 0.09, 0);
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.08, 8, 16, Math.PI * 1.2), M.tileM); e.position.set(sx * (rW + 0.2), top + 0.3, 0); e.rotation.set(0, sx > 0 ? Math.PI : 0, -0.6); P.add(e); }
}

// a hall at one of five stages ('open' is a pavilion with no walls, the dojo): 'plinth' (a cleared base), 'frame' (columns and beams, scaffold poles), 'half' (walls
// part-built, the roof part-tiled, scaffold), 'full'. lit: the lattice doors glow from inside. tiers 2 adds an upper eave.
export function hall(M, { w = 8, d = 5, ph = 3.2, stage = 'full', lit = false, tiers = 1, seed = 1, openFront = false, lite = false }) {
  const P = new THREE.Group(), rnd = RND(seed), base = 0.7, FL = base;
  box(P, w + 1.0, base, d + 1.0, M.plinth, 0, base / 2, 0);
  box(P, w + 1.0, 0.02, d + 1.0, M.paving, 0, base + 0.01, 0);
  if (stage === 'plinth') { for (let i = 0; i < 3; i++) box(P, 0.35, 0.3, 4 + rnd() * 2, M.raw, -w / 2 + 1 + i * 0.4, base + 0.15 + (i % 2) * 0.3, 0); return P; }
  const fin = stage === 'full' || stage === 'open', colM = fin ? M.lacR : M.raw, bays = Math.max(3, Math.round(w / 2.2)), xs = [], zs = [-d / 2 + 0.2, d / 2 - 0.2];
  for (let i = 0; i <= bays; i++) xs.push(-w / 2 + 0.2 + i * (w - 0.4) / bays);
  for (const x of xs) for (const z of zs) { cyl(P, 0.16, 0.17, ph, colM, x, FL + ph / 2, z); cyl(P, 0.21, 0.24, 0.16, M.drum, x, FL + 0.08, z); }
  for (const z of zs) box(P, w + 0.2, 0.3, 0.28, fin ? M.painted : M.raw, 0, FL + ph - 0.15, z);
  for (const x of [xs[0], xs[xs.length - 1]]) box(P, 0.28, 0.3, d, fin ? M.painted : M.raw, x, FL + ph - 0.15, 0);
  if (stage === 'frame' || stage === 'half') { // scaffold: poles and lashed ledgers along the front
    for (let x = -w / 2 - 0.5; x <= w / 2 + 0.6; x += 1.6) { cyl(P, 0.05, 0.05, ph + 2.2, M.raw, x, FL + (ph + 2.2) / 2, d / 2 + 0.9, 6); }
    for (const yy of [1.4, 2.8, ph + 1.0]) box(P, w + 1.4, 0.08, 0.08, M.raw, 0, FL + yy, d / 2 + 0.9);
    box(P, w + 1.4, 0.06, 0.6, M.raw, 0, FL + 2.8, d / 2 + 0.7); }
  if (stage === 'frame') return P;
  // walls: plaster at the back and sides, lattice doors across the front (half: the back wall and one side only)
  if (stage !== 'open') box(P, w - 0.4, ph - 0.3, 0.2, M.plaster, 0, FL + (ph - 0.3) / 2, -d / 2 + 0.2);
  for (const sx of stage === 'half' ? [-1] : stage === 'open' ? [] : [-1, 1]) box(P, 0.2, ph - 0.3, d - 0.4, M.plaster, sx * (w / 2 - 0.2), FL + (ph - 0.3) / 2, 0);
  if (stage === 'full') for (let i = 0; i < bays; i++) { if (openFront && i > 0 && i < bays - 1) continue; const x0 = xs[i], x1 = xs[i + 1], dm = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 - 0.34, ph - 0.5), lit ? M.doorLit : M.door); dm.position.set((x0 + x1) / 2, FL + (ph - 0.5) / 2 + 0.05, d / 2 - 0.22); P.add(dm); }
  if (fin) for (let bx = -w / 2; bx <= w / 2 + 0.01; bx += w / (bays * 2)) for (let t = 0; t < 3; t++) box(P, 0.14 + 0.08 * t, 0.07, 0.14, t % 2 ? M.brkG : M.brk, bx, FL + ph + 0.04 + 0.075 * t, d / 2 - 0.2 + 0.1 * t);
  const RY = FL + ph + 0.22;
  if (tiers === 2 && stage === 'full') { roof(P, M, { w: w, d: d, y: RY, ex: 1.0, rise: 0.5, ridgeIn: 1.0 });
    // the upper storey: a smaller box of plaster and lattice, its own roof
    const w2 = w * 0.62, d2 = d * 0.62, y2 = RY + 0.45, h2 = ph * 0.55;
    box(P, w2, h2, d2, M.plaster, 0, y2 + h2 / 2, 0);
    const dm = new THREE.Mesh(new THREE.PlaneGeometry(w2 * 0.8, h2 * 0.7), lit ? M.doorLit : M.door); dm.position.set(0, y2 + h2 / 2, d2 / 2 + 0.01); P.add(dm);
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cyl(P, 0.13, 0.13, h2, M.lacR, x * w2 / 2, y2 + h2 / 2, z * d2 / 2);
    roof(P, M, { w: w2, d: d2, y: y2 + h2 + 0.15, ex: 0.9, rise: 1.6 });
  } else roof(P, M, { w, d, y: RY, rise: Math.min(2.4, 0.3 * (w + d) / 2 + 0.6), rows: stage === 'half' ? 0.35 : 1, lite });
  if (lit) { const L = new THREE.PointLight(0xffb866, 6, 14, 2); L.position.set(0, FL + 1.6, d / 2 + 0.9); P.add(L); }
  return P;
}

// a paifang (an open ceremonial gateway of three bays): the gate an exile walks through. plaque: the words on its board.
export function paifang(M, { w = 7, h = 4.6, plaque = '天門', stage = 'full' }) {
  const P = new THREE.Group(), colM = stage === 'full' ? M.lacR : M.raw, xs = [-w / 2, -w / 6.5, w / 6.5, w / 2];
  for (const x of xs) { cyl(P, 0.2, 0.22, h, colM, x, h / 2, 0); box(P, 0.7, 0.5, 0.9, M.plinth, x, 0.25, 0); }
  box(P, w + 0.6, 0.34, 0.32, stage === 'full' ? M.painted : M.raw, 0, h - 0.4, 0); box(P, w * 0.42, 0.28, 0.3, stage === 'full' ? M.painted : M.raw, 0, h - 1.15, 0);
  if (stage !== 'full') return P;
  const pq = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.62, 0.06), [M.brass, M.brass, M.brass, M.brass, new THREE.MeshStandardMaterial({ map: tex(256, 128, (x, W, H) => { x.fillStyle = '#b08f50'; x.fillRect(0, 0, W, H); x.fillStyle = '#1e1715'; x.fillRect(9, 9, W - 18, H - 18);
    x.fillStyle = '#d4b46a'; x.font = 'bold 80px "WenQuanYi Zen Hei"'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(plaque, W / 2, H / 2 + 4); }), roughness: 0.5 }), M.brass]);
  pq.position.set(0, h - 0.78, 0.2); P.add(pq);
  for (let bx = -w / 2; bx <= w / 2 + 0.01; bx += w / 12) box(P, 0.16, 0.12, 0.3, bx % 2 ? M.brkG : M.brk, bx, h - 0.16, 0);
  const R = new THREE.Group(); R.position.y = h - 0.15; P.add(R); roof(R, M, { w: w + 0.4, d: 0.6, y: 0, ex: 0.7, rise: 0.55, lift: 0.9, ridgeIn: 1 });
  return P;
}

// the trigram of Heaven, three unbroken lines, on a hanging banner (the sect's mark; Qian, the Creative)
export function banner(M, { h = 3.2, w = 0.8, col = '#8a2a1f' }) {
  const P = new THREE.Group(); cyl(P, 0.05, 0.06, h + 1.4, M.wood, 0, (h + 1.4) / 2, 0, 6);
  const t = tex(64, 256, (x, W, H) => { x.fillStyle = col; x.fillRect(0, 0, W, H); x.fillStyle = '#e8d9b0'; for (let i = 0; i < 3; i++) x.fillRect(12, 40 + i * 36, W - 24, 18); x.fillStyle = '#c8a457'; x.fillRect(0, H - 10, W, 10); });
  const g = new THREE.PlaneGeometry(w, h, 1, 8); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.08 * Math.sin(p.getY(i) * 1.6));
  const b = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.9 })); b.position.set(w / 2 + 0.06, h / 2 + 1.2, 0); b.castShadow = true; P.add(b);
  return P;
}

// pines of gate.html: a bending trunk with bark, level branches, pads of needles (dark below, lit above)
const tuft = new THREE.IcosahedronGeometry(1, 0);
export function pine(M, h, lean = 0.15, seed = 3) { const g = new THREE.Group(), rnd = RND(seed);
  const tp = []; for (let i = 0; i <= 6; i++) { const u = i / 6; tp.push(V(Math.sin(lean) * h * u * u * 1.4 + (rnd() - 0.5) * 0.12 * h * u, h * 0.82 * u, (rnd() - 0.5) * 0.1 * h * u)); }
  const tc = new THREE.CatmullRomCurve3(tp); const tg = new THREE.TubeGeometry(tc, 16, 0.06 * h, 6); { const p = tg.attributes.position; for (let i = 0; i < p.count; i++) { const yy = p.getY(i) / (h * 0.82), s = 1 - 0.55 * yy; const c = tc.getPointAt(Math.min(1, Math.max(0, yy))); p.setXYZ(i, c.x + (p.getX(i) - c.x) * s, p.getY(i), c.z + (p.getZ(i) - c.z) * s); } p.needsUpdate = true; }
  const tm = new THREE.Mesh(tg, M.bark); tm.castShadow = true; g.add(tm);
  const pads = []; const nb = 5 + Math.floor(rnd() * 2);
  for (let b = 0; b < nb; b++) { const u = 0.45 + 0.55 * b / (nb - 1), o = tc.getPointAt(Math.min(1, u)), ang = (b % 2 ? 1 : -1) * (0.6 + 0.9 * rnd()) + (rnd() - 0.5), len = h * (0.42 - 0.25 * (u - 0.45));
    const d = V(Math.cos(ang), 0.15 + 0.2 * rnd(), Math.sin(ang) * 0.6).normalize(), e = o.clone().addScaledVector(d, len), m = o.clone().lerp(e, 0.5).add(V(0, -0.05 * h, 0));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(o, m, e), 6, 0.018 * h, 5), M.bark)); pads.push([e, len * 0.5]); }
  pads.push([tc.getPointAt(1).clone().add(V(0, 0.04 * h, 0)), h * 0.2]);
  const NT = 60, n = pads.length * NT, imD = new THREE.InstancedMesh(tuft, M.ndD, n), imL = new THREE.InstancedMesh(tuft, M.ndL, n), mt = new THREE.Matrix4(), q = new THREE.Quaternion(); let k2 = 0;
  for (const [c, rad] of pads) for (let i = 0; i < NT; i++) { const a = rnd() * 6.283, rr = Math.sqrt(rnd()) * rad, s = h * (0.026 + 0.02 * rnd()); q.setFromEuler(new THREE.Euler(rnd(), rnd() * 6, rnd()));
    const p = V(c.x + Math.cos(a) * rr, c.y + (rnd() - 0.5) * 0.03 * h - 0.025 * h * (rr / rad), c.z + Math.sin(a) * rr * 0.75);
    imD.setMatrixAt(k2, mt.compose(p, q, V(s * 1.4, s * 0.4, s))); imL.setMatrixAt(k2, mt.compose(p.clone().add(V(0, 0.018 * h, 0)), q, V(s * 1.2, s * 0.3, s * 0.9))); k2++; }
  imD.castShadow = imL.castShadow = true; g.add(imD, imL); return g; }

// painted ridges of gate.html, for the far ranges (a plane facing +z)
export function ridge(w, h, seed, col, alpha, rough) { const c = document.createElement('canvas'); c.width = 2048; c.height = 512; const x = c.getContext('2d');
  const rnd = RND(seed); const pts = []; let yy = 0.5;
  for (let i = 0; i <= 64; i++) { yy += (rnd() - 0.5) * rough; yy = Math.min(0.85, Math.max(0.12, yy)); pts.push(yy); }
  for (let p = 0; p < 4; p++) { const at = Math.floor(rnd() * 64), wd = 3 + Math.floor(rnd() * 5), ht = 0.25 + 0.35 * rnd(); for (let i = -wd; i <= wd; i++) if (pts[at + i] != null) pts[at + i] = Math.max(0.06, pts[at + i] - ht * (1 - Math.abs(i) / (wd + 1))); }
  const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, col); g.addColorStop(1, 'rgba(239,228,207,0)');
  x.fillStyle = g; x.beginPath(); x.moveTo(0, 512); pts.forEach((p, i) => x.lineTo(i / 64 * 2048, p * 512)); x.lineTo(2048, 512); x.closePath(); x.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: alpha, fog: false, depthWrite: false })); }

// soft cloud: a canvas of overlapping radial puffs (gate.html's mist bank, made denser for a sea of cloud)
export function cloudTex(seed, n = 70, dens = 0.5, w = 1024, h = 256) { return tex(w, h, (x, W, H) => { const rnd = RND(seed); for (let i = 0; i < n; i++) { const cx = rnd() * W, cy = H * (0.25 + 0.5 * rnd()), rr = 40 + 110 * rnd(); const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, `rgba(246,242,232,${dens})`); g.addColorStop(1, 'rgba(246,242,232,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); } }); }

// a student at establishing scale: a robe, a sash, a head, hair tied up; carry: a beam on the shoulder
export function person(M, { robe = '#3d5a6c', carry = false, seed = 1, pose = 'stand' }) { const g = new THREE.Group(), rnd = RND(seed);
  const rm = new THREE.MeshStandardMaterial({ color: robe, roughness: 0.9 }), skin = new THREE.MeshStandardMaterial({ color: 0xc89a78, roughness: 0.8 }), hair = new THREE.MeshStandardMaterial({ color: 0x1f1813, roughness: 0.8 });
  const r = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.32, 1.35, 10), rm); r.position.y = 0.68; g.add(r);
  const s = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.08, 10), new THREE.MeshStandardMaterial({ color: 0xe9e1cc })); s.position.y = 0.95; g.add(s);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), skin); hd.position.y = 1.5; g.add(hd);
  const kn = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), hair); kn.position.set(0, 1.63, -0.03); g.add(kn);
  for (const sx of [-1, 1]) { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.6, 6), rm); a.position.set(sx * 0.22, 1.12, 0); a.rotation.z = sx * (carry ? 2.6 : 0.15); g.add(a); }
  if (pose === 'kneel') { r.scale.y = 0.55; r.position.y = 0.37; r.scale.x = r.scale.z = 1.15; s.position.y = 0.6; hd.position.y = 1.0; kn.position.y = 1.13; g.children.slice(-2).forEach(a => { a.position.y = 0.66; a.rotation.z *= 3; a.rotation.x = -0.5; }); }
  if (pose === 'guard') { g.children.slice(-2).forEach((a, i) => { a.rotation.set(-1.1, 0, (i ? 1 : -1) * 0.5); a.position.z = 0.18; }); r.rotation.x = 0.08; }
  if (pose === 'strike') { const a = g.children[g.children.length - 1]; a.rotation.set(-1.5, 0, 0); a.position.set(0.2, 1.22, 0.3); g.children[g.children.length - 2].rotation.set(0.4, 0, -0.5); r.rotation.x = 0.12; }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g; }
