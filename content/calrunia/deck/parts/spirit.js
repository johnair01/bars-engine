// Piece: the spirit creature. Taken whole from the living ship Still B (Six-faces-council council/callsheets/stills/2026-10-25-ship-v1/make/still-b-scene.js, lines 163-176).
function spirit(x, y, z, color, s = 1, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); into.add(g);
  // a small round creature: body, head with two ears, and a drifting tail of light (not a waypoint diamond)
  const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.1, flatShading: true, transparent: true, opacity: 0.92 });
  add(new THREE.IcosahedronGeometry(0.42 * s, 1), m, 0, 0, 0, { parent: g, s: [1.25, 0.9, 1], noShadow: true });
  add(new THREE.IcosahedronGeometry(0.3 * s, 1), m, 0.45 * s, 0.35 * s, 0.1 * s, { parent: g, noShadow: true });
  add(new THREE.ConeGeometry(0.1 * s, 0.28 * s, 4), m, 0.38 * s, 0.68 * s, 0.1 * s, { parent: g, rz: 0.25, noShadow: true });
  add(new THREE.ConeGeometry(0.1 * s, 0.28 * s, 4), m, 0.58 * s, 0.66 * s, 0.1 * s, { parent: g, rz: -0.25, noShadow: true });
  [[-0.55, 0.1, 0.22], [-0.85, 0.28, 0.15], [-1.1, 0.5, 0.1]].forEach(([x, y, r]) => add(new THREE.IcosahedronGeometry(r * s, 0), m, x * s, y * s, 0, { parent: g, noShadow: true }));
  halo(color, 0, 0.1, 0, 2.6 * s, 0.45, g);
  const l = new THREE.PointLight(color, 8 * s, 6 * s, 2); g.add(l);
  g.rotation.y = ry || 0;
  return g;
}
