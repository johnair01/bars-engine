// Part (new): the tide post at the waterline off the bow quarter, the only place money shows (FR-007, mbf-win). A
// striped post with a brass mark at the month's goal; the water ring on it rises with this month's logged coin. New
// because nothing in the record draws a tide gauge; built from the kit's cylinders and the deck's brass and lavender.
PART("tidepost", "The tide post", "New, from the kit's own shapes", () => {
  const x = 8.6, z = -9.5;
  for (let i = 0; i < 6; i++) add(new THREE.CylinderGeometry(0.22, 0.22, 0.8, 8), mat(i % 2 ? 0xe8d8c8 : 0x6e4f86), x, -3.0 + i * 0.8, z, { noShadow: true });
  add(new THREE.TorusGeometry(0.38, 0.06, 5, 16), mat(0xc9a25a, { metalness: 0.6, roughness: 0.4 }), x, 1.4, z, { rx: Math.PI / 2, noShadow: true }); // the goal mark
  add(new THREE.IcosahedronGeometry(0.2, 1), glow(0xffc070, 1.8), x, 2.0, z, { noShadow: true }); halo(0xffb060, x, 2.0, z, 1.6, 0.6);
  const ring = add(new THREE.TorusGeometry(0.5, 0.08, 5, 18), glow(0x9ff6e4, 1.4), x, -2.9, z, { rx: Math.PI / 2, noShadow: true });
  return { update(st) { const y = -2.9 + st.tide * 4.3; ring.position.y += (y - ring.position.y) * 0.04; ring.position.y += Math.sin(st.t) * 0.002; },
    hit: [{ pos: new THREE.Vector3(x, 0, z), kind: "tide" }] };
});
