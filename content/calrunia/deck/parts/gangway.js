// Part: the gangway on the port side and the trade boats. From money gate round 3 (Six-faces-council council/callsheets/stills/2026-10-31-money-gate-3/make/deck.js, "the gangway" and function
// tradeBoat). New here: the boat sails out along the cleared lane when a crate is sent (the contact beat, mb-leave-moment
// "At the ask"), and boats still out ride at anchor off the hull until their return is logged (FR-005).
function tradeBoat(parent, withCrate) {
  const g = new THREE.Group(); parent.add(g);
  const hull = new THREE.Shape(); hull.moveTo(-0.9, 2); hull.quadraticCurveTo(-1.1, -0.4, 0, -2.1); hull.quadraticCurveTo(1.1, -0.4, 0.9, 2); hull.lineTo(-0.9, 2);
  add(new THREE.ExtrudeGeometry(hull, { depth: 0.6, bevelEnabled: false, curveSegments: 10 }), mat(0x7a5a8a), 0, 0, 0, { parent: g, rx: -Math.PI / 2 });
  add(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 4), mat(0x5a4068), 0, 1.1, -1.7, { parent: g });
  add(new THREE.IcosahedronGeometry(0.2, 1), glow(0xffc070, 2.6), 0, 1.85, -1.7, { parent: g, noShadow: true });
  halo(0xffb060, 0, 1.85, -1.7, 4, 0.9, g);
  g.userData.crate = crate(g, 0, 0.6, 0.2, 0.75); g.userData.crate.visible = !!withCrate;
  return g;
}
PART("gangway", "The gangway and the trade boats", "Round 3's gangway and boat; the voyage is new", (grp) => {
  const gx = -7.3;
  add(new THREE.BoxGeometry(1.3, 0.12, 5.6), mat(0x8a6a7a), gx - 1.9, DY - 1.05, -2.6, { ry: Math.PI / 2, rz: -0.38 });
  [-0.6, 0.6].forEach((dz) => add(new THREE.CylinderGeometry(0.03, 0.03, 5.4, 4), mat(0xc9a25a), gx - 1.9, DY - 0.35, -2.6 + dz, { rz: Math.PI / 2 + 0.38, noShadow: true }));
  const boat = tradeBoat(grp, false); const HOME = new THREE.Vector3(gx - 4.6, -2.7, -2.6), FAR = new THREE.Vector3(-30, -2.6, -95);
  const wake = []; for (let i = 1; i < 10; i++) wake.push(add(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: haloTex, color: 0xffe6c4, transparent: true, opacity: 0.55 - i * 0.045, depthWrite: false }), 0, -3.1, 0, { rx: -Math.PI / 2, s: [1.0 + i * 0.3, 2.2, 1], noShadow: true }));
  const anchored = [0, 1, 2, 3, 4].map((i) => { const b = tradeBoat(grp, false); b.position.set(-12 - i * 2.4, -2.75, 4 + i * 2.2); b.rotation.y = 1.2; b.scale.setScalar(0.8); b.visible = false; return b; });
  return {
    update(st) {
      const k = st.sending == null ? 0 : st.sending; // 0 at the gangway .. 1 gone into the fog
      boat.position.lerpVectors(HOME, FAR, k * k); boat.rotation.y = 0.2 + k * 0.3; boat.scale.setScalar(1 + k * 0.3);
      boat.position.y += Math.sin(st.t * 1.1) * 0.05; boat.userData.crate.visible = st.sending != null;
      boat.visible = k < 0.98;
      wake.forEach((w, i) => { w.visible = k > 0.02; w.position.set(boat.position.x + i * 0.75, -3.1, boat.position.z + i * 1.6); w.rotation.z = -0.45; });
      anchored.forEach((b, i) => { b.visible = i < st.boatsOut; b.position.y = -2.75 + Math.sin(st.t * 0.9 + i) * 0.05; });
    },
    hit: [{ pos: new THREE.Vector3(gx - 1.9, DY - 0.6, -2.6), kind: "gangway" }, ...anchored.map((b, i) => ({ pos: b.position, kind: "boat", i }))],
  };
});
