/* The road's pack: a soft travelling bundle, not a box (his 2026-11-16 ask, "replace the plain box with a bundle model").
   A cloth knapsack sagging under its own weight, a bedroll tied across its top, two cord wraps and a small gourd-brown
   patch pocket. Built from rounded primitives only: no hard box faces, no texture files. The group's origin is the
   pack's middle against the back; the pack sits behind it (-z), as makeRoadFigure's `bag` expects. */
export function packGroup(THREE) {
  const g = new THREE.Group(); g.name = "road-pack";
  const cloth = new THREE.MeshStandardMaterial({ color: 0x6b5a45, roughness: 0.95 });
  const roll = new THREE.MeshStandardMaterial({ color: 0xcfc3a6, roughness: 0.97 });
  const cord = new THREE.MeshStandardMaterial({ color: 0x3d3128, roughness: 0.85 });
  const patch = new THREE.MeshStandardMaterial({ color: 0x8a6e4a, roughness: 0.95 });
  // the sack: a squashed sphere, flattened against the back, heavier at the bottom
  const sack = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 18), cloth); sack.scale.set(1.0, 1.12, 0.78); sack.position.set(0, -0.02, -0.09);
  const p = sack.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), z = p.getZ(i), x = p.getX(i); if (y < 0) p.setX(i, x * (1 + -y * 0.5)); if (z > 0) p.setZ(i, z * 0.55); p.setY(i, y + Math.sin(x * 11) * 0.006); }
  sack.geometry.computeVertexNormals(); g.add(sack);
  // the bedroll across the top, ends tucked in
  const bed = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.4, 18), roll); bed.rotation.z = Math.PI / 2; bed.position.set(0, 0.17, -0.1); g.add(bed);
  for (const sx of [-0.2, 0.2]) { const cap = new THREE.Mesh(new THREE.SphereGeometry(0.058, 14, 10), roll); cap.scale.set(0.5, 1, 1); cap.position.set(sx, 0.17, -0.1); g.add(cap); }
  for (const sx of [-0.12, 0.12]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.007, 6, 20), cord); w.rotation.y = Math.PI / 2; w.position.set(sx, 0.17, -0.1); g.add(w); }
  // two cord wraps round the sack
  for (const y of [0.04, -0.1]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.168, 0.006, 6, 28), cord); w.scale.set(1, 1, 0.8); w.rotation.x = Math.PI / 2; w.position.set(0, y, -0.09); g.add(w); }
  // a patch pocket low on the sack
  const pk = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), patch); pk.scale.set(1.1, 0.8, 0.35); pk.position.set(0.03, -0.1, -0.2); g.add(pk);
  g.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
  return g;
}
