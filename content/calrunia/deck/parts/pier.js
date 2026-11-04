// Part (new): the pier the money boat moors at, its plank and its lines (game frame Homeroom, his C on mb-deck-look-2:
// "the player would engage with the cargo on the boat"). Drawn in money pier round 1 (Six-faces-council
// council/callsheets/stills/2026-11-03-money-pier-1/make/pier.part.js, his A on mb-pier-look-1) and lifted in here.
// New because assets_here.py "pier boat" found no 3D pier in the record (the board's moorings pier is 2D). Built from
// blocks at the boat's own scale: piles, stringers, planks with gaps, two bollards, fenders, two pier lanterns (the
// deck's lantern, kept), and a plank with cleats laid across the boat's rail. The pier runs along z; its top is PIER_Y.
// DY and HZ are the old deck's height and hatch line; the tide post, route book and bell still draw from them.
const DY = -0.4, HZ = -1.0;
const PIER = { x: 0, w: 3.0, z0: 11, z1: -12, y: -1.95 }, BERTH = { x: 3.85, y: -2.95, z: -2 };
PART("pier", "The pier, its lanterns and the plank", "New, from the kit's own shapes and the boat's woods", () => {
  const { x, w, z0, z1, y } = PIER, len = z0 - z1, wood = [0x7a5a5a, 0x6c4e52, 0x84625e], pile = mat(0x4a3440);
  for (let z = z0 - 0.6; z > z1; z -= 2.4) [-1, 1].forEach((s) => add(new THREE.CylinderGeometry(0.17, 0.2, 2.6, 7), pile, x + s * (w / 2 - 0.12), y - 1.2, z));
  [-1, 1].forEach((s) => add(new THREE.BoxGeometry(0.22, 0.3, len), mat(0x553c46), x + s * (w / 2 - 0.12), y - 0.22, z1 + len / 2));
  let k = 0; for (let z = z0; z > z1; z -= 0.32, k++) add(new THREE.BoxGeometry(w + (k % 3 === 1 ? 0.12 : 0), 0.09, 0.28), mat(wood[k % 3]), x, y - 0.045, z);
  [-1, 1].forEach((s) => add(new THREE.BoxGeometry(0.14, 0.14, len), mat(0x5e4450), x + s * (w / 2 + 0.02), y + 0.06, z1 + len / 2)); // the curb
  // fenders on the berth side, where the boat rides
  for (let z = BERTH.z - 3; z <= BERTH.z + 3; z += 2) add(new THREE.CylinderGeometry(0.13, 0.13, 0.9, 6), mat(0x2e2430), x + w / 2 + 0.16, y - 0.65, z);
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
