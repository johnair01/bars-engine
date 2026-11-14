// Part: the world ring, the band of land arching over the sky. Taken whole from the living ship Still B (Six-faces-council/council/callsheets/stills/2026-10-25-ship-v1/make/still-b-scene.js, lines 66-89).
PART("ring", "The world ring", "Still B, reused whole", () => {
{
  const ringR = 210, len = 150;
  const geo = new THREE.CylinderGeometry(ringR, ringR, len, 180, 14, true).toNonIndexed();
  // colour the inner land in bands: meadow, sea, forest, cloud
  const cols = []; const p = geo.attributes.position; const c = new THREE.Color();
  const haze = new THREE.Color(0xe6b8b8);
  for (let i = 0; i < p.count; i += 3) { // one colour per face: a patchwork of meadow, forest, sea and cloud
    const y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, a = Math.atan2((p.getZ(i) + p.getZ(i + 1)) / 2, (p.getX(i) + p.getX(i + 1)) / 2);
    const v = Math.sin(a * 9 + y * 0.05) + Math.sin(a * 23 - y * 0.08) * 0.6 + Math.sin(y * 0.11) * 0.4;
    c.set(v > 1.1 ? 0xf2dce4 : v > 0.4 ? 0x86b08a : v > -0.3 ? 0x5f8f74 : v > -0.7 ? 0xd9c09a : 0x5f86c8);
    if (Math.abs(y) > len * 0.44) c.set(0xc8a0c0); // rim walls
    c.lerp(haze, 0.32);
    for (let k = 0; k < 3; k++) cols.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const m = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false, transparent: true, opacity: 1.0 });
  const ring = new THREE.Mesh(geo, m);
  ring.rotation.x = Math.PI / 2 - 0.22; // axis toward the viewer, tilted so the inner land faces us
  ring.rotation.z = 0.18;
  ring.position.set(-10, -70, -520);
  into.add(ring);
  // a haze veil in front of it
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(1400, 500), new THREE.MeshBasicMaterial({ color: 0xf0b8a8, transparent: true, opacity: 0.18, fog: false, depthWrite: false }));
  veil.position.set(0, 20, -480); into.add(veil);
}
});
