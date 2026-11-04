// Piece: the trade boat, a voxel wooden boat after Wendell's reference (2026-11-03). From Six-faces-council
// council/callsheets/stills/2026-11-03-money-boat-1/make/boat.js (buildBoat), at his answer to mb-boat-look-1 (2026-11-03 18:21, "D"):
// preset B stretched to 8 m long, 4.0 m wide, rail 0.5 m, bow rise 0.6 m, blocks 12 cm, wood 25% toward the ship's dusk woods.
// New here: the round's chest is left out because the crate piece rides amidships (the crate you lift is the crate that sails),
// and the boat is built once and cloned, so the boats at anchor share its geometry. Bow points to +x in the boat's own frame.
const BOAT = { length: 8, voxel: 0.12, palette: 0.25, rail: 0.5, bowRise: 0.6, beam: 0.5 };
// Reference woods (palette 0) and the living ship's dusk woods (palette 1); the slider mixes between them.
const BOAT_WOOD = {
  hull:   [0x8c4f3b, 0x7a5a8a],
  hull2:  [0x7b4434, 0x6b4e7a],
  cap:    [0xa9664b, 0x9a7aa8],
  deck:   [0x6f4233, 0x8a6a7a],
  deck2:  [0x623a2e, 0x7a5c6e],
  stripe: [0x4f7a68, 0x4fb8c4],
  iron:   [0x3e2c24, 0x3a2a48],
  wheel:  [0x56786a, 0x58a8b8],
  chest:  [0x8a5a34, 0x8a6a5a],
  lid:    [0x6a4228, 0x6a4a58],
};

function boatHash(a, b, c) { let h = (a * 374761393 + b * 668265263 + c * 1274126177) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }

function buildBoat(p) {
  const pal = p.palette;
  const col = (k, jitter = 0, seed = [0, 0, 0]) => {
    const c = new THREE.Color(BOAT_WOOD[k][0]).lerp(new THREE.Color(BOAT_WOOD[k][1]), pal);
    if (jitter) { const j = (boatHash(...seed) - 0.5) * jitter; c.offsetHSL(0, 0, j); }
    return c;
  };
  const v = p.voxel, L = p.length;
  const nx = Math.max(12, Math.round(L / v));
  const halfBeam = (L * p.beam) / 2;
  const deckY = Math.max(0.55, L * 0.11); // deck surface above the keel line, metres
  const topMid = deckY + p.rail;      // gunwale height amidships
  const ny = Math.ceil((topMid + p.bowRise + 0.4) / v);
  const nz = Math.ceil(halfBeam / v) + 1;

  // Plan shape: square-ish transom at the stern (t=0), fullest a third of the way up, a sharp bow at t=1.
  const plan = (t) => t < 0.35 ? 0.84 + 0.16 * Math.sin((t / 0.35) * Math.PI / 2) : Math.pow(Math.cos(((t - 0.35) / 0.65) * Math.PI / 2), 0.75);
  const sheer = (t) => topMid + p.bowRise * Math.pow(t, 2.6) + 0.18 * Math.pow(1 - t, 3);
  const keel = (t) => (t > 0.62 ? Math.pow((t - 0.62) / 0.38, 2) * (sheer(1) * 0.62) : 0) + (t < 0.08 ? (0.08 - t) * 2.2 : 0);
  const widthAt = (t, y) => {
    const b = keel(t), top = sheer(t);
    if (y < b || y > top) return -1;
    const f = Math.min(1, Math.max(0, (y - b) / Math.max(0.01, top - b)));
    return halfBeam * plan(t) * (0.5 + 0.5 * Math.pow(f, 0.4));
  };

  const solid = new Set(); const key = (i, j, k) => i + "," + j + "," + k;
  const cell = []; // [i,j,k,kind]
  for (let i = 0; i < nx; i++) {
    const t = i / (nx - 1);
    for (let j = 0; j < ny; j++) {
      const y = (j + 0.5) * v;
      const w = widthAt(t, y);
      if (w < 0) continue;
      for (let k = -nz; k <= nz; k++) {
        const z = Math.abs(k) * v;
        if (z > w + v * 0.25) continue;
        const inner = z < w - v * 1.6 && i > 0 && t < 0.97 && y > deckY;
        if (inner) continue;           // open well above the deck
        solid.add(key(i, j, k));
        cell.push([i, j, k]);
      }
    }
  }
  const has = (i, j, k) => solid.has(key(i, j, k));
  const group = new THREE.Group();
  const box = new THREE.BoxGeometry(v, v, v);
  const visible = cell.filter(([i, j, k]) => !(has(i + 1, j, k) && has(i - 1, j, k) && has(i, j + 1, k) && has(i, j - 1, k) && has(i, j, k + 1) && has(i, j, k - 1)));
  const mesh = new THREE.InstancedMesh(box, new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0 }), visible.length);
  const m4 = new THREE.Matrix4();
  const x0 = -L / 2;
  const deckJ = Math.floor(deckY / v);
  const stripeAt = (t) => sheer(t) - v * 2.5;
  visible.forEach(([i, j, k], n) => {
    const t = i / (nx - 1), y = (j + 0.5) * v;
    m4.makeTranslation(x0 + (i + 0.5) * v, y, k * v);
    mesh.setMatrixAt(n, m4);
    let c;
    const top = !has(i, j + 1, k);
    const z = Math.abs(k) * v; const w = widthAt(t, y);
    const isWall = y > deckY + v * 0.5;
    const sgn = Math.sign(k);
    const outer = !isWall || i === 0 || t > 0.95 || (sgn !== 0 && has(i, j, k - sgn)) || k === 0;
    const js = Math.floor(stripeAt(t) / v);
    if (top && !isWall && z < w - v * 1.5) c = col(Math.abs(k) % 3 === 0 ? "deck2" : "deck", 0.02, [i >> 3, 0, k]);
    else if (!outer) c = col("deck", 0.02, [i >> 3, j, 0]).offsetHSL(0, 0, 0.04);
    else if (j === js || j === js + 1) c = col("stripe", 0.015, [i >> 2, j, k]);
    else c = col((j >> 1) % 2 ? "hull" : "hull2", 0.02, [i >> 3, j, k]);
    mesh.setColorAt(n, c);
  });
  mesh.castShadow = true; mesh.receiveShadow = true;
  group.add(mesh);

  const std = (k, extra = {}) => new THREE.MeshStandardMaterial({ color: col(k), roughness: 0.9, ...extra });
  const addBox = (sx, sy, sz, x, y, z, material) => { const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; group.add(b); return b; };

  // A continuous gunwale rail along the sheer, two voxels wide, so the rail reads as one clean line.
  const capM = std("cap");
  for (let i = 0; i < nx; i++) {
    const t = i / (nx - 1); if (t > 0.985) continue; const top = sheer(t), w = halfBeam * plan(t);
    [-1, 1].forEach((side) => addBox(v * 1.02, v * 0.9, v * 2.1, x0 + (i + 0.5) * v, top + v * 0.15, side * Math.max(0, w - v * 0.55), capM));
  }
  // Gunwale posts, about a metre apart, on both rails; the bow post and the transom posts stand taller.
  const postM = std("cap"), postDark = std("hull2");
  const nPosts = Math.max(3, Math.round(L * 0.7 / 1.3));
  for (let s = 0; s <= nPosts; s++) {
    const t = 0.04 + (s / nPosts) * 0.78;
    const x = x0 + t * L, top = sheer(t), w = halfBeam * plan(t);
    [-1, 1].forEach((side) => addBox(v * 1.6, v * 2.2, v * 1.6, x, top + v * 0.6, side * (w - v * 0.1), postM));
  }
  // Stem post at the bow: rises and reaches forward, green-capped like the reference.
  const bowTop = sheer(1);
  addBox(v * 2.4, v * 3, v * 1.8, x0 + L - v * 0.3, bowTop + v * 0.4, 0, std("cap"));
  addBox(v * 2.0, v * 1.4, v * 1.9, x0 + L + v * 0.5, bowTop + v * 1.2, 0, std("stripe"));
  // Transom: corner posts and a green band across the stern.
  const sternW = halfBeam * plan(0);
  [-1, 1].forEach((side) => addBox(v * 2.4, v * 3.2, v * 2.4, x0 + v, sheer(0) + v * 0.9, side * (sternW - v * 0.4), std("cap")));
  addBox(v * 0.8, v * 2, sternW * 1.7, x0 - v * 0.2, sheer(0) - v * 2.6, 0, std("stripe"));

  // The ship's wheel on a pedestal near the stern, facing the bow, with a pale glowing hub.
  const wx = x0 + L * 0.11 + 0.3, ped = 0.95;
  addBox(0.55, ped, 0.55, wx, deckY + ped / 2, 0, std("hull"));
  addBox(0.65, 0.12, 0.65, wx, deckY + ped + 0.04, 0, std("cap"));
  const R = 0.5, wy = deckY + ped + 0.25 + R, wheelM = std("wheel"), ironM = std("iron");
  const spokes = new THREE.Group(); spokes.position.set(wx + 0.32, wy, 0); group.add(spokes);
  const seg = 20;
  for (let s = 0; s < seg; s++) {
    const a = (s / seg) * Math.PI * 2; const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.17, 0.09), wheelM);
    b.position.set(0, Math.sin(a) * R, Math.cos(a) * R); b.rotation.x = -a; b.castShadow = true; spokes.add(b);
  }
  for (let s = 0; s < 8; s++) {
    const a = (s / 8) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, R * 2 + 0.36), ironM);
    spoke.rotation.x = a; spoke.castShadow = true; spokes.add(spoke);
    const knob = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), ironM); knob.position.set(0, Math.sin(a) * (R + 0.2), Math.cos(a) * (R + 0.2)); spokes.add(knob);
  }
  const hub = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdff8ff, emissiveIntensity: 2.2 }));
  hub.position.set(0.05, 0, 0); spokes.add(hub);
  addBox(0.3, 0.14, 0.14, wx + 0.16, wy, 0, ironM);

  const cw = 1.25, ch = 0.95, cx = x0 + L * 0.5;
  const light = new THREE.PointLight(0xffb45a, 3.5, 4.5, 1.6); light.position.set(cx, deckY + ch + 0.25, 0); light.name = "boatLight"; group.add(light);

  group.userData = { deckY, chestX: cx, wheelX: wx, length: L, halfBeam, bowTop };
  return group;
}

let boatProto = null;
// A trade boat: `g` is the placed group (move, turn and scale it), bow toward -z; g.userData.crate is the shared crate piece.
function tradeBoat(parent, withCrate, lit = false) {
  if (!boatProto) boatProto = buildBoat(BOAT);
  const g = new THREE.Group(); parent.add(g);
  const hull = boatProto.clone(); hull.rotation.y = Math.PI / 2; hull.position.y = -0.35; g.add(hull);
  const light = hull.getObjectByName("boatLight"); if (light && !lit) light.parent.remove(light);
  const u = boatProto.userData;
  g.userData.crate = crate(hull, u.chestX, u.deckY, 0, 1); g.userData.crate.visible = !!withCrate;
  return g;
}
