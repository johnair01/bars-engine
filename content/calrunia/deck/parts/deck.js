// Part: the deck itself: warm planking, the hull below the rail, the rib posts, the cyan vein light and four lanterns.
// From money gate round 3 (Six-faces-council council/callsheets/stills/2026-10-31-money-gate-3/make/deck.js, "the deck"), unchanged.
const DY = -0.4, HZ = -1.0;
PART("deck", "The deck, rail and lanterns", "Round 3's deck, reused whole", () => {
  const deck = new THREE.Shape();
  deck.moveTo(-7, 14); deck.lineTo(7, 14); deck.quadraticCurveTo(8.2, -4, 0, -16); deck.quadraticCurveTo(-8.2, -4, -7, 14);
  add(new THREE.ExtrudeGeometry(deck, { depth: 0.5, bevelEnabled: false, curveSegments: 18 }), mat(0x6b4a5e, { roughness: 1 }), 0, DY, 0, { rx: -Math.PI / 2 });
  for (let i = -6; i <= 6; i++) add(new THREE.BoxGeometry(0.04, 0.02, 28), mat(0x4e3448), i, DY + 0.51, 0, { noShadow: true });
  add(jitter(new THREE.CylinderGeometry(7.6, 4, 3.4, 14, 1, true), 0.1), mat(0x3e2f58, { side: THREE.DoubleSide }), 0, DY - 1.7, 0, { s: [1, 1, 2.1] });
  for (let t = 0; t <= 1.0001; t += 1 / 14) [-1, 1].forEach((sd) => {
    const z = 14 - t * 28, x = sd * (7 - Math.pow(Math.max(0, (14 - z) / 30), 2) * 7.2) * (z < -4 ? (1 - (-4 - z) / 13) : 1);
    if (sd < 0 && z < 0.5 && z > -5.5) return; // the gangway gap on the port side
    add(new THREE.CylinderGeometry(0.12, 0.16, 1.1, 5), mat(0x6e4f86), x, DY + 1.0, z, { noShadow: true });
  });
  add(new THREE.TorusGeometry(7.2, 0.07, 4, 48, Math.PI * 0.62), glow(0x9ff6e4, 1.6), 0, DY + 1.55, 0.5, { rx: -Math.PI / 2, rz: Math.PI * 0.19, s: [1, 2.2, 1], noShadow: true });
  const spill = new THREE.Mesh(new THREE.CircleGeometry(5, 20), new THREE.MeshBasicMaterial({ color: 0xffc89a, transparent: true, opacity: 0.10, depthWrite: false }));
  spill.rotation.x = -Math.PI / 2; spill.position.set(0, DY + 0.53, 9); into.add(spill);
  [[-5.6, 6], [5.6, 6], [-5.2, -7], [5.2, -7]].forEach(([x, z]) => {
    add(new THREE.CylinderGeometry(0.1, 0.12, 3.2, 5), mat(0x5a4068), x, DY + 1.6, z);
    add(new THREE.IcosahedronGeometry(0.32, 1), glow(0xffc070, 1.5), x, DY + 3.3, z, { noShadow: true });
    halo(0xffb060, x, DY + 3.3, z, 2.6, 0.7);
    const l = new THREE.PointLight(0xffb060, 7, 9, 2); l.position.set(x, DY + 3.2, z); into.add(l);
  });
});
