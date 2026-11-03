/* The keeping chamber (Six-faces-council council/callsheets/block-metabolize.md, slice 2; stills round
   2026-11-02-block-chamber-3; his steer on bm-chamber-look-3, 2026-11-02 20:12Z: "Mix of a and b").

   One chamber that holds both of round 3's options. It is reached from the nook through an arch of the cave's stone under
   the shelf (../chamber-arch.js) and opens at ../land.html?place=chamber.
   - B, what the charge left: every piece carried home from a block's room stands on its own stone, in the order the blocks
     cleared, spiralling from the portal round the pool. Beside each the cave's kit grows one structure in the piece's
     element: a crystal bed for water, a spire for metal, a glow cap for fire, a mushroom clump for earth. A piece let go
     stays as one gold light under the dome. The record is the spirit store's `kept` list (../kept.js).
   - A, the block's weather: a charge whose weather is "a season" fills this chamber with it (land.js mounts
     ../block-room.js mountRoom here), the ice set at the foot of the kept stones, with the three melt stands on its floor.
     At the clearing its keepsake goes onto the next stone, here, and the cave's kit grows beside it while you watch.
   A storm still fills the land as built ("This is the room", bm-build-look-1).

   Stood up the cave's way (cave compost capacities 8, 9, 10; cave.js openRoom): four of the kit's wall rings stacked, a
   dome, the kit's pool, roots from the dome, the kit's portal arch home with the nook's warm light through it. Ported from
   round 3's make/chamber.html (?bare=1&warm=1) and make/keeping.js ('keeping'). The cave's stone is its own baked tiles. */
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export const R = 6, TOP = 4.4;                    // the chamber's radius and wall height (round 1's chamber)
/* The chamber is stood up in its own frame (round 1's chamber.html: the portal on the -z wall) and turned half round, so in
   the world, as in the land, you come in on the +z side and walk toward -z. These are world positions. */
const P_L = { x: 0, z: -R * 0.92 }, POOL_L = { x: 0, z: -0.8 };
export const PORTAL = { x: 0, z: R * 0.92 };      // the arch home
export const POOL = { x: 0, z: 0.8, r: 1.15 };
export const ARRIVE = { x: -0.2, z: R * 0.92 - 0.9 };
export const WALK_TO = { x: -0.5, z: 2.4 };
const EL = { water: { hex: "#bfe0ff", em: "#7fc0ff" }, metal: { hex: "#d8d2c0", em: "#fff0c8" }, fire: { hex: "#ff9a4a", em: "#ff6a1a" }, earth: { hex: "#9a8a70", em: "#ffcf80" } };
const NAME = { water: "A small vessel", metal: "A key", fire: "An ember", earth: "A stone" };

/* where the i-th piece stands: a spiral from the portal round the pool, so the room reads in the order the blocks cleared */
export function spot(i) { const a = Math.PI * 0.18 + i * 0.62, r = R * (0.68 - Math.min(i, 20) * 0.012); return { x: Math.sin(a) * r, z: -Math.cos(a) * r, a }; }
export function walkable(x, z) {
  const d = Math.hypot(x, z);
  if (d > R - 0.75 && !(Math.abs(x - PORTAL.x) < 0.9 && z > 0 && d < R - 0.35)) return false;
  if (Math.hypot(x - POOL.x, z - POOL.z) < POOL.r) return false;
  return true;
}

export async function build(k) {
  const { THREE, V, scene, glowSprite, LOW, pieces = [], w = 0.74 } = k;
  const loader = new GLTFLoader();
  const gl = await loader.loadAsync("/ontology-game/cave/cave-kit.glb");
  const kit = {}; gl.scene.children.forEach(o => { kit[o.name] = o; });
  const geo = n => { let g = null; if (kit[n]) kit[n].traverse(c => { if (c.isMesh && !g) g = c.geometry; }); return g; };
  const G = new THREE.Group(); G.name = "keeping-chamber"; G.rotation.y = Math.PI; scene.add(G);
  const tl = new THREE.TextureLoader(), tile = (n, rx, ry) => { const t = tl.load("/ontology-game/cave/textures/" + n + ".jpg"); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
  const lift = (hex, m) => new THREE.Color(hex).multiplyScalar(m);
  const rock = new THREE.MeshStandardMaterial({ color: lift(0x5e4e44, 1.7), map: tile("wet_stone", 6, 2), roughness: 0.95, side: THREE.DoubleSide });
  const floorM = new THREE.MeshStandardMaterial({ color: lift(0x5e4e44, 1.35), map: tile("dry_stone", 8, 8), roughness: 0.95 });
  const mat = (g, m) => g && g.attributes.color ? Object.assign(m.clone(), { vertexColors: true }) : m;
  const put = (n, m, x, y, z, sx, sy, sz, ry = 0, parent = G) => { const g = geo(n); if (!g) return new THREE.Group(); const o = new THREE.Mesh(g, mat(g, m)); o.position.set(x, y, z); o.scale.set(sx, sy ?? sx, sz ?? sx); o.rotation.y = ry; parent.add(o); return o; };

  /* the warm chamber: lit from the portal home (round 3's ?warm=1) */
  const fog = scene.fog = new THREE.FogExp2(0x2a211b, 0.03); scene.background = new THREE.Color(0x1a1512);
  G.add(new THREE.HemisphereLight(0x9fb4c4, 0x2a2420, 0.7));
  G.add(new THREE.HemisphereLight(0xffd8b0, 0x3a2a20, 0.55));
  for (let i = 0; i < 4; i++) { const wr = new THREE.Mesh(geo("wall_ring"), rock); wr.rotation.x = Math.PI / 2; wr.rotation.z = i * 0.41;
    wr.scale.set(R * (1 + 0.025 * (i % 2)), R * (1 + 0.025 * (i % 2)), TOP / 4 + 0.05); wr.position.y = i * TOP / 4; G.add(wr); }
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R * 1.03, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), rock); dome.scale.y = 0.45; dome.position.y = TOP; G.add(dome);
  const wet = new THREE.MeshStandardMaterial({ color: 0x3d4a5a, roughness: 0.2, metalness: 0.1 });
  put("pool", wet, POOL_L.x, 0.02, POOL_L.z, 1.6);
  [[-1.2, -0.6], [1.6, -2.0], [0.2, 1.5]].forEach(([x, z], i) => put("root_hang", rock, x, TOP + 0.6, z, 1.4, 1.2, 1.4, i));
  const DW = 2.4, DH = 3.4;
  put("portal_arch", new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.7 }), P_L.x, DH - DW / 2, P_L.z - 0.3, DW / 2 + 0.1);
  { const sh = new THREE.Shape(), r = DW / 2; sh.moveTo(-r, 0); sh.lineTo(r, 0); sh.lineTo(r, DH - r); sh.absarc(0, DH - r, r, 0, Math.PI, false); sh.lineTo(-r, 0);
    const beyond = new THREE.Mesh(new THREE.ShapeGeometry(sh, 16), new THREE.MeshBasicMaterial({ color: 0xd8904a, transparent: true, opacity: 0.7 })); beyond.position.set(P_L.x, 0.01, P_L.z - 0.34); G.add(beyond); }
  const home = new THREE.PointLight("#ffb062", 14, 9, 1.6); home.position.set(P_L.x, 1.6, P_L.z + 0.6); G.add(home);
  const deep = new THREE.PointLight(0xffc890, 1.4, 30, 2); deep.position.set(0, 2.2, -2); G.add(deep);
  glowSprite(V(POOL_L.x, 0.1, POOL_L.z), 2.4, 0xffd9a0, 0.18, false, G);

  /* the keepsake: block-room.js's four shapes */
  function keepsake(el, at, scale, parent) {
    const g = new THREE.Group(), e = EL[el] || EL.water;
    const m = new THREE.MeshStandardMaterial({ color: e.hex, emissive: el === "fire" ? "#ff6a1a" : "#ffcf80", emissiveIntensity: el === "water" ? 0.3 : 0.55, roughness: 0.4, metalness: el === "metal" ? 0.7 : 0.1 });
    if (el === "water") { const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(0.05 + Math.sin(t * Math.PI) * 0.11 + (t > 0.85 ? 0.03 : 0), t * 0.26)); } g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 16), m)); }
    else if (el === "metal") { const bow = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 8, 16), m); bow.position.y = 0.22; g.add(bow); const s = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 0.02), m); s.position.y = 0.09; g.add(s); const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.02), m); b.position.set(0.03, 0.02, 0); g.add(b); }
    else if (el === "fire") { const x = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), m); x.position.y = 0.09; g.add(x); }
    else { const x = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1, 0), m); x.position.y = 0.1; g.add(x); }
    g.position.copy(at); g.scale.setScalar(scale); parent.add(g); glowSprite(at.clone().add(V(0, 0.14 * scale, 0)), 0.7 * scale, 0xffd27a, 0.55, false, parent);
    return g;
  }
  const tint = (hex, em, ei) => new THREE.MeshStandardMaterial({ color: hex, emissive: em, emissiveIntensity: ei, roughness: 0.45 });
  const GROW = {
    water: p => { put("crystal_cluster_bed", rock, 0, 0, 0, 0.7, 0.7, 0.7, 0, p); put("crystal_cluster", tint("#cfe8ff", "#5fa8ff", 0.7), 0, 0.08, 0, 1.05, 1.05, 1.05, 0, p); },
    metal: p => put("stone_spire", tint("#b8b4aa", "#fff0c8", 0.12), 0, 0, 0, 0.55, 1.5, 0.55, 0, p),
    fire: p => put("glow_cap", tint("#ffb070", "#ff7a2a", 0.9), 0, 0, 0, 0.8, 0.8, 0.8, 0, p),
    earth: p => put("mush_clump", tint("#c8b08a", "#ffcf80", 0.45), 0, 0, 0, 0.9, 0.9, 0.9, 0, p),
  };

  /* every piece kept: a stone, the piece on it, what grows beside it; a piece let go is a gold light under the dome */
  const stones = [], lights = [];
  let seed = 41; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  function place(pc, i, grow) {
    const s = spot(i), x = s.x, z = s.z;
    if (pc.let) { const q = V(x * 0.6, TOP - 1.2 + rnd() * 0.4, z * 0.6); const sp = glowSprite(q, 0.7, 0xffd27a, 0.9, false, G); lights.push({ pc, sp, q, born: grow ? 0 : 1 }); return; }
    const g = new THREE.Group(); g.position.set(x, 0, z); G.add(g);
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.27, 0.55, 7), rock); plinth.position.y = 0.275; plinth.rotation.y = s.a; g.add(plinth);
    const gw = new THREE.Group(); gw.position.set(Math.sin(s.a + 0.5) * 0.5 + Math.cos(s.a) * 0.45, 0, -Math.cos(s.a + 0.5) * 0.5 + Math.sin(s.a) * 0.45); gw.rotation.y = s.a * 2.1; g.add(gw);
    (GROW[pc.element] || GROW.water)(gw);
    const piece = keepsake(pc.element, V(0, 0.57, 0), 2.0, g);
    const pl = new THREE.PointLight((EL[pc.element] || EL.water).em, 1.6, 3.2, 1.8); pl.position.set(0, 1.15, 0); g.add(pl);
    stones.push({ pc, g, gw, piece, pl, at: V(-x, 0, -z), born: grow ? 0 : 1 });   // world position: the chamber is turned half round
  }
  pieces.forEach((pc, i) => place(pc, i, false));

  /* witnessed (his dial, 0.74): the six lights in the dome, and a patron's light standing in the portal home looking in */
  if (w > 0.25) { const SIX = [0xff9b5e, 0x7fd0ff, 0xff6b6b, 0xffd36b, 0x9be38a, 0xc9a6ff], b = 0.3 + 0.7 * (w - 0.25) / 0.75;
    for (let i = 0; i < 6; i++) { const a = Math.PI + (i - 2.5) * 0.42, q = V(Math.sin(a) * R * 0.55, Math.min(3.0, TOP * 0.65) + Math.sin(i * 1.7) * 0.15, -Math.cos(a) * R * 0.55);
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), new THREE.MeshBasicMaterial({ color: SIX[i] })); orb.position.copy(q); G.add(orb); glowSprite(q, 0.5 + 0.8 * b, SIX[i], 0.3 + 0.45 * b, false, G); } }
  if (w >= 0.7) { const q = V(P_L.x + 0.6, 1.4, P_L.z + 0.5); const orb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffd98a })); orb.position.copy(q); G.add(orb);
    glowSprite(q, 1.6, 0xffcf70, 0.75, false, G); const pl = new THREE.PointLight("#ffc86a", 4, 5, 2); pl.position.copy(q); G.add(pl); }

  return {
    fog, group: G, stones, lights, count: () => stones.length + lights.length,
    // a piece carried at the clearing here goes onto the next stone, and what grows beside it rises out of the floor
    add(pc) { place(pc, stones.length + lights.length, true); },
    near(p) { let best = null, bd = 1.3; for (const s of stones) { const d = Math.hypot(p.x - s.at.x, p.z - s.at.z); if (d < bd) { bd = d; best = s; } } return best; },
    name: pc => NAME[pc.element] || "A piece",
    frame(dt, T) {
      for (const s of stones) { if (s.born < 1) { s.born = Math.min(1, s.born + dt * 0.35); const e = s.born * s.born * (3 - 2 * s.born); s.gw.scale.setScalar(Math.max(0.001, e)); s.g.scale.setScalar(0.6 + 0.4 * Math.min(1, s.born * 3)); }
        s.piece.position.y = 0.57 + Math.sin(T * 1.1 + s.at.x) * 0.02; s.pl.intensity = 1.6 + (1 - s.born) * 2; }
      for (const l of lights) { if (l.born < 1) { l.born = Math.min(1, l.born + dt * 0.4); l.sp.position.y = 1 + (l.q.y - 1) * l.born; } l.sp.material.opacity = 0.75 + Math.sin(T * 1.3 + l.q.x) * 0.15; }
    },
  };
}
