/* The episode's second land, walked: the Scale-House (Six-faces-council charge-to-world, build 4; his B on
   ctw-walk-look-1, 2026-11-02, and his yes on ctw-locations-look-1, 2026-10-29, for the place itself).

   You reach it by the path out of the Unfinished Clearing (../land.html?place=scale-house). It is the episode sheet's
   villain location, the Weigher's ground, where the belief is met: a round hut of stacked brass weights beside a broken
   footbridge, the air thick and amber, and a brass balance in the doorway whose pan holds your toolbag. ./place.js
   reads those three aspects into three pieces (`weight-hut`, `amber-air`, `toolbag-balance`); this file builds them.

   What there is to do is the sheet's own: the Weigher is "overcome by a small act done with what the character already
   has". Set the toolbag in the balance's pan and the scale sinks (it reads the bag, never the song); without the bag you
   walk lighter. The bag holds one plank, and the bridge needs one plank: take it out, lay it across the gap, and the
   amber thins. Every card names the next move as a button.

   Reused, not redrawn: the hut, the weights, the balance, the gully and the broken bridge are stills round
   2026-10-28-ctw-locations-1's scenes.js (`scaleHouse`, `weight`, `balance`, `bridge`, `pathRibbon`, the blockout he said
   yes to), moved into the walkable land with the balance's beam and pans made to move. The forest, the figure, the
   toolbag, the sky, mist and fireflies are land.js's, passed in as `k`. */

export const HUT_R = 2.5, DOOR = 0.42;
export const GULLY = { x: -4.9, w: 1.8, d: 2.4 };
export const BRIDGE_Z = 3.4;
export const BALANCE = { x: 0, z: HUT_R + 0.7 };
export const BRIDGE_END = { x: -2.55, z: BRIDGE_Z };      // where you stand on the near bank
export const FAR_BANK = { x: -7.6, z: BRIDGE_Z };
export const ARRIVE = { x: 2.6, z: 11.6 };                // the path in from the clearing
export const PATH_BACK = { x: 3.0, z: 13.2 };

export function gullyH(x) { const d = Math.abs(x - GULLY.x); return d < GULLY.w ? -GULLY.d * Math.cos(d / GULLY.w * Math.PI / 2) ** 2 : 0; }

/* The path from the clearing to the balance, and the fork to the bridge (the same curves as the still). */
export function onPath(x, z) {
  const main = [[3.0, 14], [2.0, 9], [0.8, 5.8], [0.1, 3.6]], fork = [[0.4, 4.6], [-1.2, 3.8], [-2.6, 3.4]];
  const near = pts => { for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz))); if (Math.hypot(x - ax - dx * t, z - az - dz * t) < 0.75) return true; } return false; };
  return near(main) || near(fork);
}

/* Where you can stand. The hut and the gully are walls; once the plank is laid the bridge is a way over. */
export function walkable(x, z, laid) {
  if (Math.hypot(x, z) < HUT_R + 0.35) return false;                                     // the hut
  if (Math.hypot(x - BALANCE.x, z - BALANCE.z) < 0.62) return false;                       // the balance's foot
  const inGully = Math.abs(x - GULLY.x) < GULLY.w + 0.15;
  if (inGully) return laid && Math.abs(z - BRIDGE_Z) < 0.42;
  if (x < GULLY.x) return x > -8.8 && Math.abs(z - BRIDGE_Z) < 1.6;                        // the far bank, a step past the bridge
  if (onPath(x, z)) return true;
  return Math.hypot(x, z - 1.5) < 6.2 && z > -3.5;                                         // the open ground before the hut
}

export function build(k) {
  const { THREE, V, add, scene, M, r, groundH, glowSprite, tree, grass, mist, fireflies, duskSky, ground, toolbagGroup, LOW } = k;

  /* the amber air: the forest's dusk gone thick and gold, smelling of oil */
  const fog = scene.fog = new THREE.FogExp2(0x5a4a34, 0.05); scene.background = new THREE.Color(0x5a4a34);
  duskSky(V(-0.3, 0.2, -1), 0x3a3024, 0x9a8460, 0x4c4258, 0xd8a868);
  const hemi = new THREE.HemisphereLight(0xc8b498, 0x3c3024, 1.5); scene.add(hemi);
  const dusk = new THREE.DirectionalLight(0xd8c8a0, 0.7); dusk.position.set(-8, 10, -12); scene.add(dusk);
  const cool = new THREE.DirectionalLight(0x98a8d8, 0.45); cool.position.set(12, 6, 6); scene.add(cool);
  const warm = new THREE.DirectionalLight(0xffb070, 0.35); warm.position.set(0, 2, -2); scene.add(warm);
  ground(M, 0x3a3624, 0x262418, 4, onPath);
  const open = (x, z) => walkable(x, z, true) || Math.hypot(x, z) < HUT_R + 0.9;
  grass(r, LOW ? 8000 : 16000, 3.5, (x, z) => Math.hypot(x, z) < HUT_R + 0.8 || Math.abs(x - GULLY.x) < GULLY.w || onPath(x, z));

  /* the hut: courses of stacked weights round a ring, a door gap at the front; the roof great weights stacked smaller */
  const weight = s => { const g = new THREE.Group(), mat = r() < 0.25 ? M.brassDark : r() < 0.5 ? M.brassOld : M.brass;
    const b = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.92, s, s * 0.85, LOW ? 10 : 16), mat); b.position.y = s * 0.42; g.add(b);
    const lip = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.6, s * 0.85, s * 0.18, LOW ? 10 : 16), mat); lip.position.y = s * 0.93; g.add(lip);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(s * 0.25, 8, 6), mat); knob.position.y = s * 1.1; g.add(knob); return g; };
  const hut = new THREE.Group(); add(hut);
  let y = 0;
  for (let c = 0; c < 7; c++) { const s = 0.36 - c * 0.025, R = HUT_R - c * 0.06, n = Math.floor((Math.PI * 2 * R) / (s * 2.05));
    for (let i = 0; i < n; i++) { const a = (i + (c % 2) * 0.5) / n * Math.PI * 2, rel = Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2));
      if (Math.abs(rel) < DOOR && c < 5) continue;
      const w = weight(s * (0.9 + r() * 0.2)); w.position.set(Math.cos(a) * R, y, Math.sin(a) * R); w.rotation.y = r() * 6; hut.add(w); }
    y += s * 0.98; }
  const lint = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 0.5), M.brassDark); lint.position.set(0, y - 0.62, HUT_R - 0.25); hut.add(lint);
  let ry = y; for (let q = 0; q < 6; q++) { const R = HUT_R + 0.25 - q * 0.42, h = 0.34; const d = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.93, R, h, 32), q % 2 ? M.brassOld : M.brass); d.position.y = ry + h / 2; hut.add(d); ry += h; }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.11, 10, 24), M.brass); ring.position.y = ry + 0.4; hut.add(ring);
  const innerM = new THREE.MeshStandardMaterial({ color: 0x6a4420, emissive: 0xe08a30, emissiveIntensity: 0.45, side: THREE.BackSide, roughness: 1 });
  const inner = new THREE.Mesh(new THREE.SphereGeometry(HUT_R * 0.9, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), innerM); inner.scale.y = 1.2; inner.userData.keep = true; scene.add(inner);
  const il = new THREE.PointLight(0xffa040, 22, 9, 1.3); il.position.set(0, 1.4, 0.3); scene.add(il);
  const doorGlow = glowSprite(V(0, 1.2, HUT_R + 0.2), 5.5, 0xffb050, 0.55);
  const lamp = p => { const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.18, 10), M.brassDark); body.position.copy(p); add(body);
    const glass = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffd080 })); glass.position.copy(p).add(V(0, 0.17, 0)); add(glass);
    const l = new THREE.PointLight(0xffa850, 6, 6, 1.5); l.position.copy(glass.position); scene.add(l); glowSprite(glass.position, 1.5, 0xffc060, 0.6); };
  for (const sx of [-1.25, 1.25]) { const p = V(sx, 2.0, HUT_R + 0.35); const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 5), M.iron); arm.position.copy(p).add(V(0, 0.4, -0.15)); arm.rotation.x = 0.6; add(arm); lamp(p); }
  lamp(V(0.4, 2.1, -0.2));

  /* the balance in the doorway: the beam and both pans move; the near pan (left, the bridge side) takes the bag */
  const at = V(BALANCE.x, 0, BALANCE.z), ARM = 1.15, DROP = 1.35;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.25, 16), M.brassDark); base.position.copy(at).setY(0.12); add(base);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.4, 10), M.brass); post.position.copy(at).setY(1.3); add(post);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), M.brass); knob.position.copy(at).setY(2.62); add(knob);
  const piv = at.clone().setY(2.45);
  const beam = new THREE.Group(); beam.position.copy(piv); scene.add(beam);
  beam.add(new THREE.Mesh(new THREE.BoxGeometry(ARM * 2, 0.07, 0.07), M.brass));
  const pointer = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.4, 6), M.brassDark); pointer.position.y = 0.22; beam.add(pointer);
  const pan = () => { const g = new THREE.Group(); scene.add(g);
    for (let q = 0; q < 3; q++) { const a = q * 2.09, bot = V(Math.cos(a) * 0.4, -DROP + 0.04, Math.sin(a) * 0.4), mid = bot.clone().multiplyScalar(0.5), len = bot.length();
      const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, len, 3), M.iron); ch.position.copy(mid); ch.lookAt(bot); ch.rotateX(Math.PI / 2); g.add(ch); }
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.3, 0.1, 24), M.brass); p.position.y = -DROP; g.add(p); return g; };
  const pans = [pan(), pan()];                      // [near (bag side, -x), far]
  const bagInPan = toolbagGroup(M); bagInPan.visible = false; pans[0].add(bagInPan); bagInPan.position.set(0, -DROP + 0.3, 0); bagInPan.rotation.set(-0.15, 0.5, 0.05);

  /* the gully and the broken footbridge: its middle planks gone, two fallen in; the one plank from the bag fills it */
  const xa = GULLY.x + GULLY.w + 0.2, xb = GULLY.x - GULLY.w - 0.2, z0 = BRIDGE_Z;
  for (const x of [xa, xb]) for (const dz of [-0.55, 0.55]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.3, 6), M.darkWood); p.position.set(x, 0.35, z0 + dz); p.rotation.z = (r() - 0.5) * 0.2; add(p); }
  const n = 14;
  for (let i = 0; i < n; i++) { const u = i / (n - 1), x = xa + (xb - xa) * u;
    if (u > 0.36 && u < 0.7) {
      if (i === 5) { const pl = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 1.2), M.wood); pl.position.set(x + 0.2, -0.7, z0 + 0.1); pl.rotation.set(0.2, 0.3, 1.2); add(pl); }
      if (i === 8) { const pl = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 1.2), M.wood); pl.position.set(x, -GULLY.d + 0.15, z0 - 0.3); pl.rotation.set(0.1, 0.8, 0.15); add(pl); }
      continue; }
    const pl = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 1.15 - r() * 0.15), M.wood); pl.position.set(x, 0.08 - Math.sin(u * Math.PI) * 0.15 - (u > 0.3 && u < 0.75 ? 0.1 : 0), z0 + (r() - 0.5) * 0.06); pl.rotation.set((r() - 0.5) * 0.1, (r() - 0.5) * 0.12, (u < 0.5 ? -1 : 1) * 0.12); add(pl); }
  for (const dz of [-0.55, 0.55]) for (const [x1, x2, sag] of [[xa, xa - 1.5, 0.25], [xb, xb + 1.3, 0.3]]) {
    const c = new THREE.CatmullRomCurve3([V(x1, 0.95, z0 + dz), V((x1 + x2) / 2, 0.95 - sag, z0 + dz), V(x2, 0.6 - sag * 2, z0 + dz + 0.05)]);
    add(new THREE.Mesh(new THREE.TubeGeometry(c, 10, 0.018, 4), M.rope)); }
  for (let i = 0; i < 26; i++) { const z = -12 + r() * 22, x = GULLY.x + (r() - 0.5) * GULLY.w * 1.6; const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35 + r() * 0.4, 0), M.rock); m.position.set(x, gullyH(x) * (0.85 + r() * 0.1), z); m.rotation.set(r() * 3, r() * 3, r() * 3); add(m); }
  for (let i = 0; i < 8; i++) glowSprite(V(GULLY.x + (r() - 0.5), -1.2, -10 + i * 2.8), 5 + r() * 3, 0xc8a878, 0.2, true);
  // the one plank: a long board laid lengthways over the gap, hidden until you lay it
  const gapA = xa + (xb - xa) * 0.33, gapB = xa + (xb - xa) * 0.73;
  const laidPlank = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(gapB - gapA) + 0.5, 0.07, 0.42), M.plank); laidPlank.position.set((gapA + gapB) / 2, -0.06, z0); laidPlank.visible = false; scene.add(laidPlank);

  /* the path in from the clearing, and the fork to the bridge (the road ribbon of the still) */
  const ribbon = curve => { const N = 120, pos = [], uv = [], idx = [], w = 0.6;
    for (let i = 0; i <= N; i++) { const u = i / N, q = curve.getPointAt(u), t = curve.getTangentAt(u), s = V(-t.z, 0, t.x).normalize();
      for (const kk of [-1, 1]) { const x = q.x + s.x * w * kk, z = q.z + s.z * w * kk; pos.push(x, groundH(x, z) + 0.03, z); uv.push(kk * 0.5 + 0.5, u * curve.getLength() / 2); }
      if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, M.pathM); m.userData.keep = true; scene.add(m); };
  ribbon(new THREE.CatmullRomCurve3([V(3.0, 0, 14), V(2.0, 0, 9), V(0.8, 0, 5.8), V(0.1, 0, 3.6)]));
  ribbon(new THREE.CatmullRomCurve3([V(0.4, 0, 4.6), V(-1.2, 0, 3.8), V(-2.6, 0, 3.4)]));

  /* the heavy forest round it, kept off the open ground, the path, the gully's line of sight and the far bank */
  const clear = (x, z) => open(x, z) || Math.hypot(x, z - 1.5) < 7.6 || (Math.abs(x - GULLY.x) < GULLY.w + 0.6) || (x > -1 && x < 5.5 && z > 2 && z < 17) || (x < GULLY.x && x > -10.5 && Math.abs(z - BRIDGE_Z) < 2.6);
  for (let i = 0, N = LOW ? 60 : 110; i < N; i++) { const a = r() * 6.28, d = 7 + Math.pow(r(), 0.8) * 28, x = Math.cos(a) * d, z = 1.5 + Math.sin(a) * d; if (clear(x, z)) continue;
    tree(M, r, x, z, { h: 9 + r() * 6, rad: 0.35 + r() * 0.4, heavy: r() < 0.6 ? 1.2 : 0 }); }
  const keepWay = w => w.y < 3.4 && (open(w.x, w.z) || onPath(w.x, w.z));
  tree(M, r, -3.4, 8.2, { h: 12, rad: 0.6, heavy: 1.6, toward: V(1, 0, 6), keepClear: keepWay });
  tree(M, r, 7.0, 8.0, { h: 12, rad: 0.55, heavy: 1.6, toward: V(1, 0, 7), keepClear: keepWay });
  tree(M, r, 4.2, -3.5, { h: 13, rad: 0.6, heavy: 1.4, toward: V(0, 0, 0), keepClear: keepWay });
  mist(r, LOW ? 12 : 22, 0xd8b880, 0.14, 4);
  const amber = []; for (let i = 0; i < 6; i++) amber.push(glowSprite(V((r() - 0.5) * 6, 1 + r() * 2, 2 + r() * 4), 4 + r() * 3, 0xffb860, 0.12, true));
  const flies = fireflies(r, LOW ? 40 : 60, 0xffd890, 10);

  /* the moving parts, eased each frame toward what has happened */
  const fx = { tilt: 0, tiltWant: 0, amberK: 1, sway: 0 };
  return {
    fog, warm, hemi, flies, bagInPan, laidPlank, doorGlow,
    piv, beam, pans, ARM,
    setBag(inPan) { bagInPan.visible = inPan; fx.tiltWant = inPan ? 0.42 : 0; fx.sway = 1; },
    lay() { laidPlank.visible = true; fx.amberK = 0; },
    frame(dt, T) {
      fx.sway *= 1 - dt * 0.8;
      fx.tilt += (fx.tiltWant - fx.tilt) * Math.min(1, dt * 2.2);
      beam.rotation.z = fx.tilt + Math.sin(T * 2.4) * 0.05 * fx.sway;
      for (const [i, side] of [[0, -1], [1, 1]]) { const e = new THREE.Vector3(side * ARM, 0, 0).applyEuler(beam.rotation).add(piv); pans[i].position.copy(e); }
      const k2 = fx.amberK === 0 ? 1 : 0; fx.clearK = (fx.clearK || 0) + (k2 - (fx.clearK || 0)) * Math.min(1, dt * 0.5);
      fog.density = 0.05 - 0.02 * fx.clearK;
      for (const s of amber) s.material.opacity = 0.12 * (1 - fx.clearK * 0.7);
      warm.intensity = 0.35 + fx.clearK * 0.6;
      flies.material.opacity = 0.65 + Math.sin(T * 1.7) * 0.25;
    },
  };
}
