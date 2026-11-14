// Round 6 (money gate, his Steer on mb-gate-look-5): the tide post steered toward Poly Haven's Lateral Sea Marker, still
// drawn in code. A red marker on a float, in bolted sections, with a ladder up the side facing the pier and a cage at the
// top. Kept from the code post: the brass goal mark, the lamp and the water ring that rises with this month's coin.
PART("tidepost", "The tide post", "Steered toward Poly Haven's Lateral Sea Marker, still drawn in code", () => {
  const x = 8.6, z = -9.5, P = [], red = [0xa23a2c, 0x933428], rust = 0x4e211c, iron = 0x2a1e20;
  P.push({ geo: new THREE.CylinderGeometry(0.46, 0.52, 0.5, 12), color: 0x7e2a22, x, y: -3.15, z }); // the float
  for (let i = 0; i < 3; i++) { const y0 = -2.9 + i * 1.25; P.push({ geo: new THREE.CylinderGeometry(0.3, 0.3, 1.25, 12), color: red[i % 2], x, y: y0 + 0.625, z });
    P.push({ geo: new THREE.TorusGeometry(0.305, 0.035, 4, 14), color: rust, x, y: y0 + 1.25, z, rx: Math.PI / 2 }); } // bolted joints
  P.push({ geo: new THREE.CylinderGeometry(0.36, 0.36, 0.08, 12), color: iron, x, y: 0.9, z }); // the deck the cage stands on
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; P.push({ geo: new THREE.CylinderGeometry(0.02, 0.02, 0.7, 3), color: iron, x: x + Math.cos(a) * 0.33, y: 1.29, z: z + Math.sin(a) * 0.33 }); }
  P.push({ geo: new THREE.TorusGeometry(0.33, 0.025, 3, 14), color: iron, x, y: 1.64, z, rx: Math.PI / 2 });
  // the ladder, up the side that faces the pier and the opening camera
  const a = Math.atan2(4.0, -5.4), ox = Math.cos(a), oz = Math.sin(a), px = -oz, pz = ox, r = 0.35;
  [-1, 1].forEach((s) => P.push({ geo: new THREE.CylinderGeometry(0.018, 0.018, 3.5, 3), color: iron, x: x + ox * r + px * s * 0.12, y: -1.15, z: z + oz * r + pz * s * 0.12 }));
  for (let y = -2.7; y < 0.8; y += 0.3) P.push({ geo: new THREE.CylinderGeometry(0.014, 0.014, 0.24, 3), color: iron, x: x + ox * r, y, z: z + oz * r, rz: Math.PI / 2, ry: -a });
  bake(P, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.6, metalness: 0.25 }), { noShadow: true });
  add(new THREE.TorusGeometry(0.38, 0.06, 5, 16), mat(0xc9a25a, { metalness: 0.6, roughness: 0.4 }), x, 1.4, z, { rx: Math.PI / 2, noShadow: true }); // the goal mark
  add(new THREE.IcosahedronGeometry(0.2, 1), glow(0xffc070, 1.8), x, 2.0, z, { noShadow: true }); halo(0xffb060, x, 2.0, z, 1.6, 0.6);
  const ring = add(new THREE.TorusGeometry(0.5, 0.08, 5, 18), glow(0x9ff6e4, 1.4), x, -2.9, z, { rx: Math.PI / 2, noShadow: true });
  return { update(st) { const y = -2.9 + st.tide * 4.3; ring.position.y += (y - ring.position.y) * 0.04; ring.position.y += Math.sin(st.t) * 0.002; },
    hit: [{ pos: new THREE.Vector3(x, 0, z), kind: "tide" }] };
});
