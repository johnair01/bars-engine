// Piece: the crate, today's money move, a sealed letter glowing through its slats. From money gate round 3 (Six-faces-council council/callsheets/stills/2026-10-31-money-gate-3/make/deck.js,
// function crate). Shared by the hatch and the trade boat, so the same crate you lift is the one that sails.
function crate(parent, x, y, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); (parent || into).add(g);
  add(new THREE.BoxGeometry(1.25 * s, 0.95 * s, 0.95 * s), mat(0xb07a4e), 0, 0.47 * s, 0, { parent: g });
  [-0.3, 0.3].forEach((dx) => add(new THREE.BoxGeometry(0.1 * s, 0.98 * s, 0.98 * s), mat(0x7a4e30), dx * s, 0.47 * s, 0, { parent: g }));
  add(new THREE.BoxGeometry(1.0 * s, 0.07 * s, 0.02), glow(0xffd88a, 2.2), 0, 0.6 * s, 0.49 * s, { parent: g, noShadow: true });
  halo(0xffcf8a, 0, 0.6 * s, 0.6 * s, 1.8 * s, 0.5, g);
  return g;
}
