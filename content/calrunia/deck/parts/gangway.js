// Part: the gangway on the port side and the trade boats. The gangway is from money gate round 3 (Six-faces-council council/callsheets/stills/2026-10-31-money-gate-3/make/deck.js, "the gangway");
// the boat is the voxel trade boat piece (boat.js, his answer D on mb-boat-look-1). New here: the boat sails out along the cleared lane when a crate is sent (the contact beat, mb-leave-moment
// "At the ask"), and boats still out ride at anchor off the hull until their return is logged (FR-005).
PART("gangway", "The gangway and the trade boats", "Round 3's gangway, the money boat piece; the voyage is new", (grp) => {
  const gx = -7.3;
  add(new THREE.BoxGeometry(1.3, 0.12, 5.6), mat(0x8a6a7a), gx - 1.9, DY - 1.05, -2.6, { ry: Math.PI / 2, rz: -0.38 });
  [-0.6, 0.6].forEach((dz) => add(new THREE.CylinderGeometry(0.03, 0.03, 5.4, 4), mat(0xc9a25a), gx - 1.9, DY - 0.35, -2.6 + dz, { rz: Math.PI / 2 + 0.38, noShadow: true }));
  const boat = tradeBoat(grp, false, true); const HOME = new THREE.Vector3(gx - 4.6, -2.7, -2.6), FAR = new THREE.Vector3(-30, -2.6, -95);
  const wake = []; for (let i = 1; i < 10; i++) wake.push(add(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: haloTex, color: 0xffe6c4, transparent: true, opacity: 0.55 - i * 0.045, depthWrite: false }), 0, -3.1, 0, { rx: -Math.PI / 2, s: [1.0 + i * 0.3, 2.2, 1], noShadow: true }));
  const anchored = [0, 1, 2, 3, 4].map((i) => { const b = tradeBoat(grp, false); b.position.set(-14 - i * 3.8, -2.75, 5 + i * 3.4); b.rotation.y = 1.2; b.scale.setScalar(0.5); b.visible = false; return b; });
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
