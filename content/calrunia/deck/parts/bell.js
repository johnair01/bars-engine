// Part: the crew bell and the dispatch lever on the starboard side (dispatch-lever). From money gate round 3 (Six-faces-council council/callsheets/stills/2026-10-31-money-gate-3/make/deck.js,
// "the crew bell"). New here: the lever pulls down when the crate goes to the crew.
PART("bell", "The crew bell and its lever", "Round 3's bell and lever; the pull is new", () => {
  const bx = 5.0, bz = -0.4;
  add(new THREE.BoxGeometry(0.3, 3.2, 0.3), mat(0x5a4068), bx, DY + 1.6, bz);
  add(new THREE.BoxGeometry(1.4, 0.22, 0.3), mat(0x5a4068), bx - 0.55, DY + 3.15, bz);
  const bell = add(new THREE.LatheGeometry([[0, 0.55], [0.2, 0.5], [0.3, 0.3], [0.36, 0.05], [0.48, -0.08], [0, -0.08]].map(([x, y]) => new THREE.Vector2(x, y)), 12), mat(0xd8b060, { metalness: 0.7, roughness: 0.35 }), bx - 1.0, DY + 2.45, bz);
  add(new THREE.BoxGeometry(0.7, 0.5, 1.1), mat(0x3a2a44), bx - 0.2, DY + 0.75, bz + 1.2);
  add(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 12, 1, false, 0, Math.PI), mat(0xc9a25a, { metalness: 0.6, roughness: 0.4 }), bx - 0.2, DY + 1.0, bz + 1.2, { rz: Math.PI / 2, noShadow: true });
  const arm = new THREE.Group(); arm.position.set(bx - 0.2, DY + 1.0, bz + 1.2); into.add(arm);
  add(new THREE.CylinderGeometry(0.05, 0.06, 1.6, 6), mat(0x9a9aa8, { metalness: 0.8, roughness: 0.3 }), 0, 0.8, 0, { parent: arm });
  add(new THREE.IcosahedronGeometry(0.17, 1), glow(0xff5a4a, 1.3), 0, 1.65, 0, { parent: arm, noShadow: true });
  halo(0xff6a5a, 0, 1.65, 0, 0.9, 0.5, arm);
  return { update(st) { arm.rotation.x += ((st.crew ? 0.6 : -0.35) - arm.rotation.x) * 0.1; bell.rotation.z = st.ringing ? Math.sin(st.t * 18) * 0.25 : 0; },
    hit: [{ pos: new THREE.Vector3(bx - 0.6, DY + 2.2, bz), kind: "bell" }] };
});
