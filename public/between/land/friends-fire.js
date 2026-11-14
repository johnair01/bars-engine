/* The episode's third land, walked: the Friends' Fire (Six-faces-council charge-to-world, build 5; his A on
   ctw-walk-look-2, 2026-11-02).

   You reach it over the plank you laid at the Scale-House (../land.html?place=friends-fire). It is the episode sheet's
   road-home location, scene 4, "the road home and the homeroom table": the homeroom's rim, where the townsfolk live. Its
   three aspects are a low fire ringed with upturned crates for seats, laughter and a guitar being tuned, and an empty crate
   left for you. ./place.js reads them into three pieces (`fire-ring`, `guitar-tuning`, `empty-crate`); this file lays
   them out and builds what stands still. land.js seats the friends (Average Dusk in three looks) and you.

   What there is to do is the sheet's treasure, played rather than read: sit on the empty crate; Oriel asks "Play what you
   have so far?"; you open the toolbag and play the unfinished bar, and Oriel picks it up on the guitar where you stopped
   and plays it on to its end. The last card says this week's capability on the episode's line and the key, and takes you
   home to your nook.

   Made in code from primitives, like the Scale-House's hut and balance: nothing in the record drew a fire ring, a crate
   or a guitar. The forest, the ground, the sky, the mist, the fireflies and the glow are land.js's, passed in as `k`. */

export const FIRE_R = 0.95;            // the fire and its stones: a wall
export const RING_R = 1.85;            // where the crates stand round it
export const CRATE = { w: 0.52, h: 0.42, d: 0.4 };
/* the crates, by their angle round the fire (0 is toward the path you come in by, +x to the right as you arrive) */
export const SEATS = [
  { who: "you", a: 0.5 },
  { who: "friend", a: 2.05, look: "c.slender.chestnut.page.dark_brown.dress.saffron" },
  { who: "oriel", a: 3.25, look: "b.average.umber.afro.black.jacket.violet" },
  { who: "friend", a: 4.55, look: "a.broad.fawn.sweep.red.coat.saffron" },
];
export const seatAt = s => ({ x: Math.sin(s.a) * RING_R, z: Math.cos(s.a) * RING_R, yaw: s.a + Math.PI });   // facing the fire
export const YOURS = seatAt(SEATS[0]);
/* where you stand to sit: just behind your crate, outside the ring */
export const STAND = { x: Math.sin(SEATS[0].a) * (RING_R + 0.6), z: Math.cos(SEATS[0].a) * (RING_R + 0.6) };
export const ARRIVE = { x: 1.4, z: 12.4 };
export const PATH_BACK = { x: 1.8, z: 13.8 };
export const WALK_TO = { x: 1.1, z: 4.5 };      // the arrival walk stops here, the fire in front of you
export const OPEN_R = 8.6;

export function onPath(x, z) {
  const pts = [[2.0, 15], [1.6, 11], [1.0, 7], [0.9, 3.4]];
  for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    if (Math.hypot(x - ax - dx * t, z - az - dz * t) < 0.8) return true; }
  return false;
}

/* Where you can stand: the open ground of the rim and the path in; never in the fire or through a crate. */
export function walkable(x, z) {
  const d = Math.hypot(x, z);
  if (d < FIRE_R + 0.25) return false;
  for (const s of SEATS) { const c = seatAt(s); if (Math.hypot(x - c.x, z - c.z) < 0.5) return false; }
  return d < OPEN_R || onPath(x, z);
}

export function build(k) {
  const { THREE, V, add, scene, M, r, groundH, glowSprite, tree, grass, mist, fireflies, duskSky, ground, LOW } = k;

  /* the rim at dusk: the forest thinning, the rain stopped, the sky still holding some light; one warm fire */
  const fog = scene.fog = new THREE.FogExp2(0x46505a, 0.02); scene.background = new THREE.Color(0x3c4650);
  duskSky(V(0.3, 0.12, -1), 0x2e3440, 0x8a8a90, 0x34385a, 0xd89868);
  const hemi = new THREE.HemisphereLight(0xa8b4d0, 0x3a3a30, 1.6); scene.add(hemi);
  const moon = new THREE.DirectionalLight(0xa8b8e0, 0.55); moon.position.set(8, 12, -10); scene.add(moon);
  const back = new THREE.DirectionalLight(0xd8a070, 0.3); back.position.set(-6, 3, -12); scene.add(back);
  ground(M, 0x3a4630, 0x2a2e20, OPEN_R, onPath);
  grass(r, LOW ? 7000 : 15000, OPEN_R + 1.5, (x, z) => Math.hypot(x, z) < FIRE_R + 0.6 || onPath(x, z));

  /* the fire: a ring of stones, split logs leant into a cone, embers, and the flame as layered glow that flickers */
  const fire = new THREE.Group(); add(fire);
  for (let i = 0; i < 13; i++) { const a = i / 13 * Math.PI * 2, s = 0.15 + r() * 0.07;
    const st = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), M.rock); st.position.set(Math.cos(a) * 0.72, s * 0.5, Math.sin(a) * 0.72); st.rotation.set(r() * 3, r() * 3, r() * 3); st.scale.y = 0.7; fire.add(st); }
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + r() * 0.3;
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, 0.75, 7), M.darkWood);
    log.position.set(Math.cos(a) * 0.2, 0.26, Math.sin(a) * 0.2); log.rotation.set(Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55); fire.add(log); }
  for (const [a, l] of [[0.4, 0.9], [2.6, 0.8]]) { const log = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, l, 7), M.darkWood); log.position.set(Math.cos(a) * 0.38, 0.07, Math.sin(a) * 0.38); log.rotation.set(0, -a, Math.PI / 2); fire.add(log); }
  const emberM = new THREE.MeshStandardMaterial({ color: 0x401808, emissive: 0xff5a10, emissiveIntensity: 1.2, roughness: 1 });
  const bed = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), emberM); bed.rotation.x = -Math.PI / 2; bed.position.y = 0.03; bed.userData.keep = true; scene.add(bed);
  const light = new THREE.PointLight(0xff9a40, 28, 14, 1.4); light.position.set(0, 0.9, 0); scene.add(light);
  const flames = [];
  for (const [y, s, c, o] of [[0.35, 1.3, 0xff7a20, 0.75], [0.55, 0.95, 0xffb040, 0.7], [0.8, 0.6, 0xffe090, 0.6], [0.45, 3.6, 0xff8a30, 0.28]])
    flames.push({ s: glowSprite(V(0, y, 0), s, c, o), y, size: s, o });
  const sparks = []; for (let i = 0; i < (LOW ? 10 : 18); i++) sparks.push({ s: glowSprite(V(0, 0.5, 0), 0.08, 0xffc070, 0.9), t: r() * 3, x: (r() - 0.5) * 0.3, z: (r() - 0.5) * 0.3 });

  /* the crates: upturned, slatted, turned to the fire; the empty one is yours */
  const crate = (c) => { const g = new THREE.Group(); g.position.set(c.x, groundH(c.x, c.z), c.z); g.rotation.y = c.yaw; add(g);
    const { w, h, d } = CRATE, t = 0.025;
    const top = new THREE.Mesh(new THREE.BoxGeometry(w, t * 1.4, d), M.crate); top.position.y = h - t * 0.7; g.add(top);
    for (const sx of [-1, 1]) for (let q = 0; q < 3; q++) { const sl = new THREE.Mesh(new THREE.BoxGeometry(t, h * 0.24, d), q % 2 ? M.crateDark : M.crate); sl.position.set(sx * (w / 2 - t / 2), h * (0.15 + q * 0.31), 0); g.add(sl); }
    for (const sz of [-1, 1]) for (let q = 0; q < 3; q++) { const sl = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.24, t), q % 2 ? M.crate : M.crateDark); sl.position.set(0, h * (0.15 + q * 0.31), sz * (d / 2 - t / 2)); g.add(sl); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, h, 0.05), M.crateDark); p.position.set(sx * (w / 2 - 0.025), h / 2, sz * (d / 2 - 0.025)); g.add(p); }
    return g; };
  SEATS.forEach(s => crate(seatAt(s)));
  const mine = glowSprite(V(YOURS.x, CRATE.h + 0.25, YOURS.z), 0.9, 0xffd890, 0.0);   // a soft glow on your crate until you sit

  /* the guitar: built here, held in Oriel's lap by land.js (a figure's frame: +z the way it faces, +x its left) */
  const guitar = new THREE.Group();
  const bodyShape = new THREE.Shape(); { const pts = 40; for (let i = 0; i <= pts; i++) { const u = i / pts * Math.PI * 2, y = Math.cos(u) * 0.24, wid = (0.12 + 0.05 * Math.cos(u) ** 2 + 0.04 * (y < 0 ? 1 : 0.6)) * Math.abs(Math.sin(u)) ** 0.8;
      const x = Math.sin(u) >= 0 ? wid : -wid; if (i === 0) bodyShape.moveTo(x, y); else bodyShape.lineTo(x, y); } }
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(bodyShape, { depth: 0.09, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2, curveSegments: 6 }), M.lutewood); body.position.z = -0.045; guitar.add(body);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.045, 18), M.dark); hole.position.set(0, 0.04, 0.056); guitar.add(hole);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.03), M.darkWood); neck.position.set(0, 0.42, 0.04); guitar.add(neck);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.03), M.darkWood); head.position.set(0, 0.68, 0.035); head.rotation.x = -0.25; guitar.add(head);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.015, 0.012), M.darkWood); bridge.position.set(0, -0.11, 0.06); guitar.add(bridge);
  for (let i = 0; i < 6; i++) { const x = (i - 2.5) * 0.007; const s = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.74, 3), M.string); s.position.set(x, 0.26, 0.062); guitar.add(s); }

  /* the homeroom's rim: low houses beyond the fire where the townsfolk live, their windows lit; a lantern on a post */
  const house = (x, z, yaw, s = 1) => { const g = new THREE.Group(); g.position.set(x, groundH(x, z) - 0.05, z); g.rotation.y = yaw; g.scale.setScalar(s); add(g);
    const walls = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 2.6), M.plaster); walls.position.y = 1.1; g.add(walls);
    const tri = new THREE.Shape(); tri.moveTo(-1.85, 0); tri.lineTo(1.85, 0); tri.lineTo(0, 1.25); tri.lineTo(-1.85, 0);
    const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 3.0, bevelEnabled: false }), M.thatch); roof.position.set(0, 2.2, -1.5); g.add(roof);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.05), M.darkWood); door.position.set(-0.7, 0.7, 1.31); g.add(door);
    for (const wx of [0.5, 1.15]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.5), M.window); w.position.set(wx, 1.25, 1.315); g.add(w); }
    const l = new THREE.PointLight(0xffb060, 4, 6, 1.6); l.position.set(0.8, 1.3, 2.0); g.add(l);
    return g; };
  for (const [x, z, yaw, s] of [[-6.5, -11, 0.45, 1], [0.5, -13.5, 0, 1.1], [7.5, -10.5, -0.5, 0.95], [-11.5, -5, 1.2, 0.9]]) {
    house(x, z, yaw, s); glowSprite(V(x + Math.sin(yaw) * 1.6, 1.3, z + Math.cos(yaw) * 1.6), 2.4, 0xffb060, 0.35); }
  { const p = V(3.6, 0, 7.2); const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.8, 6), M.darkWood); post.position.set(p.x, groundH(p.x, p.z) + 0.9, p.z); add(post);
    const lan = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd080 })); lan.position.set(p.x, groundH(p.x, p.z) + 1.85, p.z); add(lan);
    glowSprite(lan.position, 1.6, 0xffc060, 0.6); const l = new THREE.PointLight(0xffa850, 5, 6, 1.5); l.position.copy(lan.position); scene.add(l); }

  /* the path in from the far bank, a ribbon like the Scale-House's */
  { const curve = new THREE.CatmullRomCurve3([V(2.0, 0, 15), V(1.6, 0, 11), V(1.0, 0, 7), V(0.9, 0, 3.4)]);
    const N = 90, pos = [], uv = [], idx = [], w = 0.6;
    for (let i = 0; i <= N; i++) { const u = i / N, q = curve.getPointAt(u), t = curve.getTangentAt(u), sd = V(-t.z, 0, t.x).normalize();
      for (const kk of [-1, 1]) { const x = q.x + sd.x * w * kk, z = q.z + sd.z * w * kk; pos.push(x, groundH(x, z) + 0.03, z); uv.push(kk * 0.5 + 0.5, u * curve.getLength() / 2); }
      if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, M.pathM); m.userData.keep = true; scene.add(m); }

  /* the forest thinning at the rim: trees behind you and to the sides, fewer toward the houses */
  const clear = (x, z) => Math.hypot(x, z) < OPEN_R + 1.5 || (x > -2 && x < 5 && z > 2 && z < 18) || (z < -7 && Math.abs(x) < 14 && z > -17);
  for (let i = 0, N = LOW ? 45 : 85; i < N; i++) { const a = r() * 6.28, d = OPEN_R + 2 + Math.pow(r(), 0.8) * 26, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (clear(x, z) || (z < -6 && r() < 0.6)) continue;
    tree(M, r, x, z, { h: 9 + r() * 5, rad: 0.35 + r() * 0.35, heavy: 0 }); }
  mist(r, LOW ? 8 : 14, 0x9aa8b8, 0.08, 9);
  const flies = fireflies(r, LOW ? 40 : 70, 0xffe0a0, 12);

  const fx = { tune: 0, lift: 0 };
  return {
    fog, light, flies, guitar, mine,
    warm(k2) { fx.lift = k2; },
    frame(dt, T, sat) {
      const f = 0.85 + Math.sin(T * 9.1) * 0.06 + Math.sin(T * 13.7) * 0.05 + Math.sin(T * 3.3) * 0.04;
      light.intensity = 28 * f * (1 + fx.lift * 0.25);
      flames.forEach((q, i) => { const k2 = f + Math.sin(T * (6 + i * 2.3) + i) * 0.06; q.s.scale.set(q.size * (0.9 + 0.1 * k2), q.size * (1.05 + 0.25 * k2 * (i < 3 ? 1 : 0.2)), 1); q.s.position.y = q.y + (i < 3 ? Math.sin(T * 5 + i) * 0.03 : 0); q.s.material.opacity = q.o * k2; });
      emberM.emissiveIntensity = 1.0 + Math.sin(T * 2.2) * 0.25;
      for (const s of sparks) { s.t += dt; const u = (s.t % 2.6) / 2.6; s.s.position.set(s.x + Math.sin(s.t * 3 + s.x * 9) * 0.15 * u, 0.5 + u * 2.4, s.z + Math.cos(s.t * 2.5) * 0.1 * u); s.s.material.opacity = 0.9 * (1 - u); }
      mine.material.opacity = sat ? Math.max(0, mine.material.opacity - dt) : 0.25 + Math.sin(T * 2) * 0.12;
      flies.material.opacity = 0.6 + Math.sin(T * 1.7) * 0.25;
    },
  };
}
