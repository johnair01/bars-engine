// Part (new): the route book on its lectern by the stern rail (FR-006, the output of play). A small stand and an open
// book whose pages glow brighter with each kept route. New because nothing in the record draws the route book.
PART("lectern", "The route book", "New, from the kit's own shapes", () => {
  const x = -4.4, z = 4.2;
  add(new THREE.CylinderGeometry(0.12, 0.25, 1.3, 6), mat(0x5a4068), x, DY + 1.1, z);
  add(new THREE.BoxGeometry(0.9, 0.08, 0.7), mat(0x6e4f86), x, DY + 1.8, z, { rx: -0.4 });
  const pages = glow(0xfff0d8, 0.3);
  [-0.21, 0.21].forEach((dx, i) => add(new THREE.BoxGeometry(0.4, 0.04, 0.55), pages, x + dx, DY + 1.88, z, { rx: -0.4, rz: i ? -0.12 : 0.12, noShadow: true }));
  const h = halo(0xfff0d8, x, DY + 2.0, z, 1.2, 0.3);
  return { update(st) { pages.emissiveIntensity = 0.3 + Math.min(st.routes, 6) * 0.25; h.material.opacity = 0.2 + Math.min(st.routes, 6) * 0.1; },
    hit: [{ pos: new THREE.Vector3(x, DY + 1.9, z), kind: "book" }] };
});
