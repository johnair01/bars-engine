// Part: six lantern ports along the far coast, one per stream. From money gate round 3 (Six-faces-council council/callsheets/stills/2026-10-31-money-gate-3/make/deck.js, "six lantern ports"). New
// here: each lantern brightens with its port's standing (stranger, known, trusted, route), never with dollars.
PART("ports", "Six lantern ports", "Round 3's ports, lit by standing", () => {
  const lamps = [];
  [[-62, -110], [-30, -140], [0, -150], [28, -138], [56, -120], [84, -96]].forEach(([x, z]) => {
    add(new THREE.CylinderGeometry(6, 9, 5, 7), mat(0x6c587e), x, -1.5, z);
    add(new THREE.CylinderGeometry(6.1, 6.1, 0.8, 7), mat(0x7f9c80), x, 1.2, z);
    add(new THREE.CylinderGeometry(0.9, 1.3, 7, 6), mat(0xe8d8c8), x + 2, 5, z);
    const m = glow(0xffc070, 0.6); add(new THREE.IcosahedronGeometry(1.0, 1), m, x + 2, 9.2, z, { noShadow: true });
    lamps.push({ m, h: halo(0xffb060, x + 2, 9.2, z + 1, 6, 0.35), pos: new THREE.Vector3(x + 2, 9.2, z) });
  });
  return { update(st) { lamps.forEach((l, i) => { const k = st.ports[i]; l.m.emissiveIntensity = k < 0 ? 0.2 : 0.6 + k * 3; l.h.scale.setScalar(k < 0 ? 3 : 6 + k * 16); l.h.material.opacity = k < 0 ? 0.15 : 0.35 + k * 0.55; }); },
    hit: lamps.map((l, i) => ({ pos: l.pos, kind: "port", i })) };
});
