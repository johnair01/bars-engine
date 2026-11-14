// Round 6 (money gate, his Steer on mb-gate-look-5): the route book steered toward BlenderKit's open book, still drawn in
// code. A leather cover, two page stacks that curve up from the spine, ruled pages painted at load time (blank, no print),
// and a ribbon. Kept from the code book: the stand, the slope, the glow that brightens with each kept route, and the halo.
PART("lectern", "The route book", "Steered toward BlenderKit's open book, still drawn in code", () => {
  const x = -4.4, z = 4.2;
  add(new THREE.CylinderGeometry(0.12, 0.25, 1.3, 6), mat(0x5a4068), x, DY + 1.1, z);
  add(new THREE.BoxGeometry(0.9, 0.08, 0.7), mat(0x6e4f86), x, DY + 1.8, z, { rx: -0.4 });
  const book = new THREE.Group(); book.position.set(x, DY + 1.855, z); book.rotation.x = -0.4; into.add(book);
  add(new THREE.BoxGeometry(0.88, 0.025, 0.62), mat(0x5a2a20, { roughness: 0.7 }), 0, 0, 0, { parent: book }); // the cover
  const ruled = paintTex(128, 128, (g, w, h) => { g.fillStyle = "#f4ead8"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(120,96,80,.28)"; g.lineWidth = 1;
    for (let y = 18; y < h - 8; y += 9) { g.beginPath(); g.moveTo(10, y); g.lineTo(w - 8, y); g.stroke(); } g.strokeStyle = "rgba(170,70,60,.3)"; g.beginPath(); g.moveTo(16, 6); g.lineTo(16, h - 6); g.stroke(); });
  const pages = new THREE.MeshStandardMaterial({ color: 0xfff0d8, emissive: 0xfff0d8, emissiveIntensity: 0.3, map: ruled, emissiveMap: ruled, flatShading: true });
  // a page stack: a box bent so it rises from the spine and falls away at the fore-edge
  [-1, 1].forEach((s) => { const g = new THREE.BoxGeometry(0.4, 0.035, 0.57, 10, 1, 1), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const u = (p.getX(i) + 0.2) / 0.4; p.setY(i, p.getY(i) + 0.05 * Math.sin(Math.PI * u * 0.8) - 0.018 * Math.pow(1 - u, 4)); p.setX(i, s * (p.getX(i) + 0.205)); }
    if (s < 0) g.index.array.reverse(); g.computeVertexNormals();
    add(g, pages, 0, 0.03, 0, { parent: book, noShadow: true }); });
  add(new THREE.BoxGeometry(0.03, 0.004, 0.5), mat(0x8a2a2a), 0.01, 0.035, -0.02, { parent: book, noShadow: true, rx: 0.05 }); // the ribbon in the gutter
  add(new THREE.BoxGeometry(0.03, 0.004, 0.18), mat(0x8a2a2a), 0.01, -0.02, 0.38, { parent: book, noShadow: true, rx: 1.2 }); // and its tail over the edge
  const h = halo(0xfff0d8, x, DY + 2.0, z, 1.2, 0.3);
  return { update(st) { pages.emissiveIntensity = 0.3 + Math.min(st.routes, 6) * 0.25; h.material.opacity = 0.2 + Math.min(st.routes, 6) * 0.1; },
    hit: [{ pos: new THREE.Vector3(x, DY + 1.9, z), kind: "book" }] };
});
