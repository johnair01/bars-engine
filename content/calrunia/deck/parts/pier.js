// Round 6 (money gate, his Steer on mb-gate-look-5: "free models cost more to run"): the code pier steered toward Poly
// Haven's Modular Wooden Pier. Same footprint, lanterns, plank, lines and bollards. What changes: piles run down into the
// water and every other pair rises above the deck with rope wrapped on it, the bents get pile caps and X braces, the
// planks are browner, uneven in length and set with gaps, a grain is painted at load time (no download), and a mooring
// gallows stands at the sea end, away from the berth. Every static wood piece is baked into one mesh: one draw call.
const DY = -0.4, HZ = -1.0;
const PIER = { x: 0, w: 3.0, z0: 11, z1: -12, y: -1.95 }, BERTH = { x: 3.85, y: -2.95, z: -2 };
// a seeded random of its own, so the parts drawn after this one keep their own random draws
const steerRnd = (() => { let s = 23; return (a, b) => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return a + (b - a) * (((t ^ t >>> 14) >>> 0) / 4294967296); }; })();
// bake: many pieces, each with its own place and colour, into one mesh with vertex colours (one draw call on a phone)
function bake(pieces, m, o = {}) {
  const pos = [], nor = [], uv = [], col = [], M = new THREE.Matrix4(), c = new THREE.Color();
  for (const p of pieces) {
    const g = p.geo.index ? p.geo.toNonIndexed() : p.geo; p.geo !== g && p.geo.dispose();
    M.compose(new THREE.Vector3(p.x, p.y, p.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(p.rx || 0, p.ry || 0, p.rz || 0)), new THREE.Vector3(...(p.s || [1, 1, 1])));
    g.applyMatrix4(M); c.set(p.color);
    const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
    for (let i = 0; i < P.count; i++) { pos.push(P.getX(i), P.getY(i), P.getZ(i)); nor.push(N.getX(i), N.getY(i), N.getZ(i)); uv.push(U ? U.getX(i) : 0, U ? U.getY(i) : 0); col.push(c.r, c.g, c.b); }
    g.dispose();
  }
  const G = new THREE.BufferGeometry();
  G.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); G.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  G.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); G.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  return add(G, m, 0, 0, 0, o);
}
// a painted texture, made on the phone at load time: draw(ctx, w, h) on a w x h canvas
function paintTex(w, h, draw) { const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }
// weathered grain: pale lines along the board, darker worn ends, multiplied by each piece's colour
const grainTex = paintTex(256, 64, (g, w, h) => {
  g.fillStyle = "#e8e2dc"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) { const y = steerRnd(0, h); g.strokeStyle = `rgba(70,48,36,${steerRnd(0.12, 0.35)})`; g.lineWidth = steerRnd(0.6, 2); g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 32) g.lineTo(x, y + steerRnd(-2.5, 2.5)); g.stroke(); }
  for (let i = 0; i < 5; i++) { g.fillStyle = `rgba(60,40,30,${steerRnd(0.15, 0.3)})`; g.beginPath(); g.ellipse(steerRnd(20, w - 20), steerRnd(8, h - 8), steerRnd(3, 7), steerRnd(2, 4), 0, 0, 7); g.fill(); } // knots
  const e = g.createLinearGradient(0, 0, w, 0); e.addColorStop(0, "rgba(40,28,22,.35)"); e.addColorStop(0.06, "rgba(0,0,0,0)"); e.addColorStop(0.94, "rgba(0,0,0,0)"); e.addColorStop(1, "rgba(40,28,22,.35)"); g.fillStyle = e; g.fillRect(0, 0, w, h);
});
function jitterSteer(geo, a) { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + steerRnd(-a, a), p.getY(i), p.getZ(i) + steerRnd(-a, a)); geo.computeVertexNormals(); return geo; }
PART("pier", "The pier, its lanterns and the plank", "Steered toward Poly Haven's Modular Wooden Pier, still drawn in code", () => {
  const { x, w, z0, z1, y } = PIER, len = z0 - z1, R = steerRnd, P = [];
  const wood = [0x5e4232, 0x523a2c, 0x66493a, 0x4a3428], dark = 0x3a2a22, rope = 0xb59a6c, sx = (s) => x + s * (w / 2 - 0.12);
  // bents every 2.4 m: two piles from the seabed, a cap across under the deck; every other bent's piles rise as posts
  const bents = []; for (let z = z0 - 0.6; z > z1; z -= 2.4) bents.push(z);
  bents.forEach((z, i) => {
    const tall = i % 2 === 0;
    [-1, 1].forEach((s) => {
      const top = tall ? y + 0.95 : y - 0.1, bot = y - 3.4, hgt = top - bot;
      P.push({ geo: jitterSteer(new THREE.CylinderGeometry(0.15, 0.19, hgt, 7, 3), 0.025), color: dark, x: sx(s), y: bot + hgt / 2, z, rz: R(-0.03, 0.03) });
      if (tall) [0.55, 0.68].forEach((dy) => P.push({ geo: new THREE.TorusGeometry(0.175, 0.035, 4, 10), color: rope, x: sx(s), y: y + dy, z, rx: Math.PI / 2 }));
    });
    P.push({ geo: new THREE.BoxGeometry(w + 0.3, 0.2, 0.24), color: 0x463226, x, y: y - 0.32, z });
  });
  // X braces on the outer faces, every other bay; one long brace under the deck from end to end on each side (stringers)
  bents.slice(0, -1).forEach((z, i) => { if (i % 2) return; const dz = -2.4, dy = 0.7, L = Math.hypot(dz, dy), a = Math.atan2(dy, dz);
    [-1, 1].forEach((s) => [a, -a].forEach((r) => P.push({ geo: new THREE.BoxGeometry(0.07, 0.15, L), color: 0x4a3428, x: sx(s) + s * 0.2, y: y - 0.78, z: z + dz / 2, rx: r }))); });
  [-1, 1].forEach((s) => P.push({ geo: new THREE.BoxGeometry(0.22, 0.28, len), color: 0x4a3428, x: sx(s), y: y - 0.2, z: z1 + len / 2 }));
  // planks with gaps, each its own length, offset and set, a few short pairs where a board was replaced
  for (let z = z0; z > z1; z -= 0.31) {
    const t = 0.085, d = 0.25, col = wood[Math.floor(R(0, 4))], yy = y - 0.045 + R(-0.012, 0.012), ry = R(-0.018, 0.018);
    if (R(0, 1) < 0.1) { const cut = R(-0.6, 0.6); P.push({ geo: new THREE.BoxGeometry(w / 2 + cut - 0.03, t, d), color: col, x: x - w / 4 + cut / 2 - 0.02, y: yy, z, ry }); P.push({ geo: new THREE.BoxGeometry(w / 2 - cut - 0.03, t, d), color: wood[(Math.floor(R(0, 4)))], x: x + w / 4 + cut / 2 + 0.02, y: yy, z, ry }); }
    else { const L = w + R(-0.12, 0.22); P.push({ geo: new THREE.BoxGeometry(L, t, d), color: col, x: x + R(-0.07, 0.07), y: yy, z, ry }); }
  }
  // fenders on the berth side, where the boat rides
  for (let z = BERTH.z - 3; z <= BERTH.z + 3; z += 2) P.push({ geo: new THREE.CylinderGeometry(0.13, 0.13, 0.9, 6), color: 0x2e2430, x: x + w / 2 + 0.16, y: y - 0.65, z });
  // a davit at the sea end on the far side from the berth and the tide post: one post, an arm out over the water, a
  // block on a short rope, and a coil of line on the planks at its foot (Poly Haven's pier has two such gallows)
  const gz = z1 + 1.2, gx = x - w / 2 + 0.1;
  P.push({ geo: jitterSteer(new THREE.CylinderGeometry(0.11, 0.13, 3.2, 6), 0.015), color: dark, x: gx, y: y + 1.6, z: gz });
  P.push({ geo: new THREE.BoxGeometry(1.5, 0.16, 0.16), color: dark, x: gx - 0.6, y: y + 3.05, z: gz });
  P.push({ geo: new THREE.BoxGeometry(0.08, 0.08, 0.95), color: dark, x: gx - 0.3, y: y + 2.75, z: gz, rx: Math.PI / 2, rz: -0.75 }); // the knee
  P.push({ geo: new THREE.CylinderGeometry(0.016, 0.016, 0.6, 3), color: rope, x: gx - 1.2, y: y + 2.7, z: gz });
  P.push({ geo: new THREE.BoxGeometry(0.14, 0.2, 0.1), color: 0x2a1e20, x: gx - 1.2, y: y + 2.32, z: gz }); // the block
  [0, 1, 2].forEach((i) => P.push({ geo: new THREE.TorusGeometry(0.26 - i * 0.05, 0.035, 4, 12), color: rope, x: gx + 0.45, y: y + 0.03 + i * 0.05, z: gz + 0.5, rx: Math.PI / 2 }));
  bake(P, new THREE.MeshStandardMaterial({ map: grainTex, vertexColors: true, flatShading: true, roughness: 0.92, metalness: 0 }));
  // bollards at the boat's bow and stern lines
  const bollards = [BERTH.z - 3.6, BERTH.z + 3.4].map((z) => { add(new THREE.CylinderGeometry(0.16, 0.2, 0.42, 8), mat(0x3a2e3a, { metalness: 0.4 }), x + w / 2 - 0.35, y + 0.21, z); add(new THREE.CylinderGeometry(0.24, 0.24, 0.07, 8), mat(0x3a2e3a, { metalness: 0.4 }), x + w / 2 - 0.35, y + 0.44, z); return new THREE.Vector3(x + w / 2 - 0.35, y + 0.35, z); });
  // two pier lanterns, the deck's lantern post kept whole
  [[-w / 2 + 0.2, 6], [-w / 2 + 0.2, -8]].forEach(([dx, z]) => {
    add(new THREE.CylinderGeometry(0.1, 0.12, 3.2, 5), mat(0x5a4068), x + dx, y + 1.6, z);
    add(new THREE.IcosahedronGeometry(0.32, 1), glow(0xffc070, 1.5), x + dx, y + 3.3, z, { noShadow: true });
    halo(0xffb060, x + dx, y + 3.3, z, 2.6, 0.7);
    const l = new THREE.PointLight(0xffb060, 7, 9, 2); l.position.set(x + dx, y + 3.2, z); into.add(l);
  });
  // the plank: from the pier's edge across the boat's port rail, with cleats, and a step box inside the rail
  const plank = new THREE.Group(); plank.position.set(x + w / 2, y + 0.02, BERTH.z + 1.6); into.add(plank);
  add(new THREE.BoxGeometry(1.9, 0.08, 0.7), mat(0x8a6650), 0.85, 0, 0, { parent: plank });
  for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(0.05, 0.05, 0.66), mat(0x5e4436), 0.15 + i * 0.36, 0.06, 0, { parent: plank, noShadow: true });
  // mooring lines, pier bollard to boat
  const lines = bollards.map((b, i) => { const m = add(new THREE.CylinderGeometry(0.03, 0.03, 1, 4), mat(0xd8c8a8), 0, 0, 0, { noShadow: true }); return { m, from: b, to: new THREE.Vector3(BERTH.x - 1.6, -1.85, BERTH.z + (i ? 3.4 : -3.4)) }; });
  const up = new THREE.Vector3(0, 1, 0);
  return { update(st) {
    const k = st.sending == null ? 0 : st.sending;
    plank.position.x = x + w / 2 - (k > 0 || st.berthEmpty ? 2.0 : 0); // the plank comes back onto the pier when the lines are cast off
    lines.forEach((l, i) => { const to = k > 0 || st.berthEmpty ? l.from.clone().add(new THREE.Vector3(0.5, -1.4, i ? 0.4 : -0.4)) : l.to; const d = to.clone().sub(l.from); l.m.position.copy(l.from).addScaledVector(d, 0.5); l.m.scale.set(1, d.length(), 1); l.m.quaternion.setFromUnitVectors(up, d.normalize()); });
  }, hit: [{ pos: new THREE.Vector3(x + w / 2 + 0.8, y + 0.2, BERTH.z + 1.6), kind: "plank" }] };
});
// Part: the money boat at its berth (boat.js, his D on mb-boat-look-1), the crate lashed to a hatch amidships, the spirit
// beside it and the crew bell at the stern on the starboard side (game frame Homeroom). The hatch and the lashings are new;
// the crate is the shared crate piece, the spirit Still B's. When the boat casts off it sails the cleared lane into the fog
// with the crate aboard, the wake from the gangway part (bars-engine#550 parts/gangway.js) behind it.
PART("berth", "The money boat at its berth", "The money boat piece; the hatch, lashings and cast-off are new", (grp) => {
  const b = tradeBoat(grp, true, true), hull = b.children[0], u = boatProto.userData, c = b.userData.crate;
  add(new THREE.BoxGeometry(1.7, 0.18, 1.35), mat(0x5a3e38), u.chestX, u.deckY + 0.09, 0, { parent: hull });
  [[0, 0.9], [0, -0.9], [0.86, 0], [-0.86, 0]].forEach(([dx, dz]) => add(new THREE.BoxGeometry(dz ? 1.74 : 0.06, 0.06, dz ? 0.06 : 1.4), mat(0xc9a25a, { metalness: 0.6, roughness: 0.4 }), u.chestX + dx * 0.98, u.deckY + 0.19, dz * 0.74, { parent: hull, noShadow: true }));
  c.position.y = u.deckY + 0.18;
  [-0.38, 0.38].forEach((dx) => { add(new THREE.BoxGeometry(0.05, 1.02, 1.02), mat(0xd8c8a8), u.chestX + dx, u.deckY + 0.66, 0, { parent: hull, noShadow: true }); add(new THREE.BoxGeometry(0.05, 0.05, 1.5), mat(0xd8c8a8), u.chestX + dx, u.deckY + 0.2, 0, { parent: hull, noShadow: true }); });
  // a step box inside the port rail, where the plank lands
  add(new THREE.BoxGeometry(0.5, 0.26, 0.7), mat(0x7a5a4a), -1.6, u.deckY + 0.13, -1.4, { parent: hull, ry: Math.PI / 2 });
  const sp = spirit(0, 0, 0, 0x9ff6e4, 0.8, -2.0); grp.remove(sp); b.add(sp); sp.position.set(0.75, -0.35 + u.deckY + 0.95, -1.35);
  const HOME = new THREE.Vector3(BERTH.x, BERTH.y, BERTH.z), FAR = new THREE.Vector3(9, -2.95, -70);
  b.position.copy(HOME); grp.updateMatrixWorld(true);
  const wake = []; for (let i = 1; i < 10; i++) wake.push(add(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: haloTex, color: 0xffe6c4, transparent: true, opacity: 0.55 - i * 0.045, depthWrite: false }), 0, -3.1, 0, { rx: -Math.PI / 2, s: [1.0 + i * 0.3, 2.2, 1], noShadow: true }));
  const spM = sp.children.filter((m) => m.isMesh).map((m) => m.material)[0];
  // boats still out ride at anchor off the pier's far side until their return is logged (FR-005), from the gangway part
  const anchored = [0, 1, 2, 3, 4].map((i) => { const a = tradeBoat(grp, false); a.position.set(-7 - i * 3.2, -2.75, 4 - i * 3.6); a.rotation.y = 1.2; a.scale.setScalar(0.5); a.visible = false; return a; });
  return { boat: b, hull, spirit: sp, update(st) {
    const k = st.sending == null ? 0 : st.sending;
    c.visible = st.waiting || st.sending != null; b.visible = k < 0.98 && !st.berthEmpty;
    spM.color.set(st.turned ? 0xffd27a : 0x9ff6e4); spM.emissive.copy(spM.color);
    anchored.forEach((a, i) => { a.visible = i < st.boatsOut && i !== st.returningIndex; a.position.y = -2.75 + Math.sin(st.t * 0.9 + i) * 0.05; });
    b.position.lerpVectors(HOME, FAR, k * k); b.rotation.y = k * 0.18; b.position.y += Math.sin(st.t * 1.1) * 0.04; b.rotation.z = Math.sin(st.t * 0.8) * 0.015;
    sp.position.y = -0.35 + u.deckY + 0.95 + Math.sin(st.t * 1.6) * 0.05;
    wake.forEach((w, i) => { w.visible = k > 0.02; w.position.set(b.position.x - i * 0.12, -3.1, b.position.z + 3.5 + i * 1.6); w.rotation.z = 0.05; });
  }, hit: [{ pos: c.getWorldPosition(new THREE.Vector3()), kind: "crate" }, { pos: sp.getWorldPosition(new THREE.Vector3()), kind: "spirit" }, ...anchored.map((a, i) => ({ pos: a.position, kind: "boat", i }))] };
});
