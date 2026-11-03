// Part: the cargo hatch, today's crate on it, the five charge stones (steer-helm) and the helm. From money gate round 3
// (Six-faces-council council/callsheets/stills/2026-10-31-money-gate-3/make/deck.js, "the cargo hatch"). New here: the crate shows only while it waits, and the hatch glows warm once the tide turns.
PART("hatch", "The cargo hatch, its crate and the helm", "Round 3's hatch and helm; the crate shows the live move", () => {
  add(new THREE.BoxGeometry(3.0, 0.35, 3.0), mat(0x8a6a7a), 0, DY + 0.65, HZ);
  const lid = glow(0xffd27a, 0.0); lid.color.set(0x4a3448); add(new THREE.BoxGeometry(2.5, 0.06, 2.5), lid, 0, DY + 0.86, HZ, { noShadow: true });
  [[0, 1.5, 3.1, 0.12], [0, -1.5, 3.1, 0.12], [1.5, 0, 0.12, 3.1], [-1.5, 0, 0.12, 3.1]].forEach(([x, z, w, d]) => add(new THREE.BoxGeometry(w, 0.1, d), mat(0xc9a25a, { metalness: 0.6, roughness: 0.4 }), x, DY + 0.86, HZ + z, { noShadow: true }));
  const stones = [0xff6a4a, 0xf2f0ff, 0x6fdc7a, 0x5fa8ff, 0xd9a54a].map((c, i) => {
    const x = -1.0 + i * 0.5;
    add(new THREE.CylinderGeometry(0.19, 0.22, 0.12, 8), mat(0x3a2a44), x, DY + 0.9, HZ + 1.75, { noShadow: true });
    const m = glow(c, 1.8); add(new THREE.IcosahedronGeometry(0.15, 0), m, x, DY + 1.02, HZ + 1.75, { noShadow: true });
    return { m, pos: new THREE.Vector3(x, DY + 1.05, HZ + 1.75) };
  });
  const helm = new THREE.Group(); helm.position.set(0, DY + 2.1, HZ - 2.4); into.add(helm);
  add(new THREE.CylinderGeometry(0.28, 0.4, 1.6, 6), mat(0x5a4068), 0, -0.9, -0.2, { parent: helm });
  add(new THREE.TorusGeometry(0.85, 0.07, 5, 20), mat(0xc9a25a, { metalness: 0.6, roughness: 0.4 }), 0, 0.2, 0, { parent: helm, noShadow: true });
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4;
    add(new THREE.CylinderGeometry(0.035, 0.035, 2.1, 4), mat(0x8a5a3a), 0, 0.2, 0, { parent: helm, rz: a, noShadow: true });
    add(new THREE.CylinderGeometry(0.06, 0.05, 0.3, 5), mat(0x8a5a3a), Math.sin(a) * 1.1, 0.2 + Math.cos(a) * 1.1, 0, { parent: helm, rz: a, noShadow: true });
  }
  add(new THREE.CylinderGeometry(0.16, 0.16, 0.2, 8), glow(0x9ff6e4, 1.2), 0, 0.2, 0.05, { parent: helm, rx: Math.PI / 2, noShadow: true });
  const box = crate(null, 0, DY + 0.9, HZ);
  return {
    update(st) {
      box.visible = st.waiting; box.position.y = DY + 0.9 + (st.waiting ? Math.sin(st.t * 1.3) * 0.02 : 0);
      lid.emissiveIntensity = st.turned ? 0.5 : 0; lid.color.set(st.turned ? 0xffd27a : 0x4a3448);
      stones.forEach((s, i) => { s.m.emissiveIntensity = st.waiting ? 1.2 + 0.6 * Math.sin(st.t * 2 + i) : 0.7; });
      helm.rotation.z = Math.sin(st.t * 0.4) * 0.05;
    },
    hit: [{ pos: new THREE.Vector3(0, DY + 1.5, HZ), kind: "crate" }, ...stones.map((s, i) => ({ pos: s.pos, kind: "stone", i }))],
  };
});
