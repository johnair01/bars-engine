// Part: the studio boats off the stern quarter, coloured sails for the art. From money gate round 3 (Six-faces-council council/callsheets/stills/2026-10-31-money-gate-3/make/deck.js, "the studio
// boats"). New here: both states built once; sails furl while the tide is in and fill once it turns (mbf-tide-not-lock).
PART("studio", "The studio boats", "Round 3's boats, both tides in one part", () => {
  const boats = [0x9ff6e4, 0xffb0d0, 0xffd27a].map((c, i) => {
    const g = new THREE.Group(); into.add(g);
    const hull = new THREE.Shape(); hull.moveTo(-0.8, 1.8); hull.quadraticCurveTo(-1.0, -0.3, 0, -1.9); hull.quadraticCurveTo(1.0, -0.3, 0.8, 1.8); hull.lineTo(-0.8, 1.8);
    add(new THREE.ExtrudeGeometry(hull, { depth: 0.55, bevelEnabled: false, curveSegments: 10 }), mat(0x5f4a7a), 0, 0, 0, { parent: g, rx: -Math.PI / 2 });
    add(new THREE.CylinderGeometry(0.05, 0.05, 3.0, 4), mat(0x5a4068), 0, 1.8, 0, { parent: g });
    const up = new THREE.Group(); g.add(up);
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute([0, 3.2, 0, 0, 0.7, 0, 0, 0.8, 1.6, 0, 3.2, 0, 0, 0.8, 1.6, 0.35, 2.0, 1.0], 3)); sg.computeVertexNormals();
    add(sg, new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.9, side: THREE.DoubleSide, flatShading: true }), 0, 0, 0, { parent: up, noShadow: true });
    halo(c, 0, 2.0, 0.6, 5, 0.45, up);
    const furl = add(new THREE.CylinderGeometry(0.16, 0.16, 1.5, 6), mat(c, { emissive: c, emissiveIntensity: 0.25 }), 0, 0.9, 0.55, { parent: g, rx: Math.PI / 2, noShadow: true });
    return { g, up, furl, i, moor: new THREE.Vector3(9.4 + i * 1.6, -2.7, -0.5 - i * 3.4), free: new THREE.Vector3(7 + i * 6, -2.7, -9 - i * 9), k: 0 };
  });
  const rings = []; for (let i = 0; i < 9; i++) rings.push(add(new THREE.TorusGeometry(R(0.8, 1.6), 0.03, 3, 18, Math.PI * 0.8), new THREE.MeshBasicMaterial({ color: 0xffeef2, transparent: true, opacity: 0.35 }), R(11, 18), -3.15, R(-12, 2), { rx: -Math.PI / 2, rz: R(1.2, 1.9), noShadow: true }));
  return { update(st) {
    boats.forEach((b) => { const goal = st.turned || st.rowing === b.i ? 1 : 0; b.k += (goal - b.k) * 0.02;
      b.g.position.lerpVectors(b.moor, b.free, b.k); b.g.position.y += Math.sin(st.t + b.i) * 0.05; b.g.rotation.y = -0.2 + b.k * 0.55; b.g.scale.setScalar(0.8 + b.k * 0.6);
      b.up.visible = b.k > 0.3; b.furl.visible = b.k <= 0.3; });
    rings.forEach((r) => { r.visible = !st.turned; });
  }, hit: boats.map((b) => ({ pos: b.g.position, kind: "studio", i: b.i })) };
});
