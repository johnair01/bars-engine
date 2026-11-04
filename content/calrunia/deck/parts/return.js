// Part (new, money return round 1): the return berth on the pier's west side, where a boat that comes back from a port
// moors so the captain can board it and open what it carries (game frame Core loop, "the boat comes back to the pier, the
// player boards it, opens what it carries"; spec FR-005, FR-006). Built from bars-engine main's own pieces: the money
// boat (tradeBoat, his mb-boat-look-1 preset, lit so its bow lantern burns), the crate piece, Still B's spirit, and the
// pier part's bollard, fender, plank and line shapes, drawn on the west edge. New here: the crate's lid, the light that
// rises when it opens (an opportunity or coin: gold motes; a no: a folded note the spirit takes), and the run in from the fog.
const RET = { x: -3.85, y: -2.95, z: 2.0 };
PART("returnBerth", "The return berth and the boat that came back", "The money boat piece and the pier's shapes; the lid, the opened light and the run in are new", (grp) => {
  const x = PIER.x - PIER.w / 2, y = PIER.y;
  for (let z = RET.z - 3; z <= RET.z + 3; z += 2) add(new THREE.CylinderGeometry(0.13, 0.13, 0.9, 6), mat(0x2e2430), x - 0.16, y - 0.65, z);
  const bollards = [RET.z + 3.6, RET.z - 3.4].map((z) => { add(new THREE.CylinderGeometry(0.16, 0.2, 0.42, 8), mat(0x3a2e3a, { metalness: 0.4 }), x + 0.35, y + 0.21, z); add(new THREE.CylinderGeometry(0.24, 0.24, 0.07, 8), mat(0x3a2e3a, { metalness: 0.4 }), x + 0.35, y + 0.44, z); return new THREE.Vector3(x + 0.35, y + 0.35, z); });
  const b = tradeBoat(grp, true, true), hull = b.children[0], u = boatProto.userData, c = b.userData.crate;
  b.rotation.y = Math.PI; // bow toward the pier's root, as it came in from the fog; its port rail faces the pier
  add(new THREE.BoxGeometry(1.7, 0.18, 1.35), mat(0x5a3e38), u.chestX, u.deckY + 0.09, 0, { parent: hull }); c.position.y = u.deckY + 0.18;
  add(new THREE.BoxGeometry(0.5, 0.26, 0.7), mat(0x7a5a4a), -1.6, u.deckY + 0.13, -1.4, { parent: hull, ry: Math.PI / 2 });
  const seam = c.children.find((m) => m.isMesh && m.material.emissiveIntensity > 2); const seamOn = seam.material.clone(); seam.material = seamOn;
  // the lid, hinged on the crate's far edge
  const hinge = new THREE.Group(); hinge.position.set(0, 0.96, -0.5); c.add(hinge);
  add(new THREE.BoxGeometry(1.32, 0.08, 1.02), mat(0x9a6a44), 0, 0.04, 0.5, { parent: hinge });
  [-0.3, 0.3].forEach((dx) => add(new THREE.BoxGeometry(0.1, 0.1, 1.04), mat(0x7a4e30), dx, 0.05, 0.5, { parent: hinge, noShadow: true }));
  const mouth = add(new THREE.PlaneGeometry(1.1, 0.8), glow(0xffd27a, 2.4), 0, 0.965, 0, { parent: c, rx: -Math.PI / 2, noShadow: true });
  const shine = halo(0xffd27a, 0, 1.6, 0, 3.4, 0.0, c), lamp = new THREE.PointLight(0xffc870, 0, 7, 2); lamp.position.set(0, 1.5, 0); c.add(lamp);
  const motes = []; for (let i = 0; i < 9; i++) motes.push(add(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 10), glow(0xffd27a, 2.6), Math.sin(i * 2.4) * 0.28, 1.15 + i * 0.16, Math.cos(i * 2.4) * 0.22, { parent: c, rx: 0.6 + i * 0.4, rz: i * 0.7, noShadow: true }));
  const note = new THREE.Group(); note.position.set(0.15, 2.05, -0.6); c.add(note);
  [-1, 1].forEach((s) => add(new THREE.BoxGeometry(0.42, 0.02, 0.56), glow(0xf6efe0, 0.9), s * 0.14, 0, 0, { parent: note, rz: s * 0.32, noShadow: true }));
  halo(0xcff6ee, 0, 0, 0, 1.4, 0.55, note);
  const sp = spirit(0, 0, 0, 0x9ff6e4, 0.8, -2.0); grp.remove(sp); b.add(sp);
  // the west plank and the lines, as on the pier's east side
  const plank = new THREE.Group(); plank.position.set(x, y + 0.02, RET.z - 1.6); plank.rotation.y = Math.PI; into.add(plank);
  add(new THREE.BoxGeometry(1.9, 0.08, 0.7), mat(0x8a6650), 0.85, 0, 0, { parent: plank });
  for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(0.05, 0.05, 0.66), mat(0x5e4436), 0.15 + i * 0.36, 0.06, 0, { parent: plank, noShadow: true });
  const lines = bollards.map((bo, i) => ({ m: add(new THREE.CylinderGeometry(0.03, 0.03, 1, 4), mat(0xd8c8a8), 0, 0, 0, { noShadow: true }), from: bo, to: new THREE.Vector3(RET.x + 1.6, -1.85, RET.z + (i ? -3.4 : 3.4)) }));
  const HOME = new THREE.Vector3(RET.x, RET.y, RET.z), FAR = new THREE.Vector3(-11, -2.95, -46), up = new THREE.Vector3(0, 1, 0);
  // st.ret: { come: 0..1 (0 moored, 1 far in the fog), open: 0..1, kind: "opportunity" | "coin" | "lesson" | null, at: [x,y,z] to moor elsewhere, ry }
  window.__ret = { boat: b, crate: c, spirit: sp };
  return { update(st) {
    const r = st.ret || null; b.visible = !!r; if (!r) { plank.visible = false; lines.forEach((l) => { l.m.visible = false; }); return; }
    const k = r.come || 0, home = r.at ? new THREE.Vector3(...r.at) : HOME;
    b.position.lerpVectors(home, FAR, k * k); b.rotation.y = (r.ry ?? Math.PI) + k * 0.25; b.position.y += Math.sin(st.t * 1.1) * 0.04; b.rotation.z = Math.sin(st.t * 0.8) * 0.015;
    const moored = k === 0 && !r.at; plank.visible = moored; lines.forEach((l) => { l.m.visible = moored; const d = l.to.clone().sub(l.from); l.m.position.copy(l.from).addScaledVector(d, 0.5); l.m.scale.set(1, d.length(), 1); l.m.quaternion.setFromUnitVectors(up, d.normalize()); });
    const o = r.open || 0, lit = o > 0.05 ? r.kind : null;
    hinge.rotation.x = -1.95 * o; seamOn.emissiveIntensity = 0.5;
    mouth.visible = !!lit; mouth.material.color.set(lit === "lesson" ? 0xcff6ee : 0xffd27a); mouth.material.emissive.copy(mouth.material.color); mouth.material.emissiveIntensity = lit === "lesson" ? 1.2 : 2.4;
    shine.material.opacity = lit ? (lit === "lesson" ? 0.35 : 0.7) * o : 0; shine.material.color.set(lit === "lesson" ? 0xcff6ee : 0xffd27a); lamp.intensity = lit ? 9 * o : 0; lamp.color.set(lit === "lesson" ? 0xcff6ee : 0xffc870);
    motes.forEach((m, i) => { m.visible = lit === "coin" || lit === "opportunity"; m.position.y = 1.0 + (i * 0.16 + st.t * 0.3) % 1.5 * o; });
    note.visible = lit === "lesson"; note.rotation.y = st.t * 0.4;
    sp.position.set(r.spirit ? r.spirit[0] : 0.75, -0.35 + u.deckY + 0.95 + (r.spirit ? r.spirit[1] : 0) + Math.sin(st.t * 1.6) * 0.05, r.spirit ? r.spirit[2] : -1.35); sp.visible = !!r.spirit || lit === "lesson";
  }, hit: [] };
});
