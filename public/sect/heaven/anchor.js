// Round 11: the great court drawn toward the anchor painting Wendell called "perfect" (round 4 courtyard concept).
// The painting, read as a list: stood inside a gate looking out over a paved court; a bronze bell on a stone plinth;
// a stone terrace with a central stair; a two-tier hall of red pillars, lattice doors and a painted beam band on it;
// side halls, one still in scaffolding; robed students at work in small groups; pines; the summit's buildings on the
// crag behind; ranges in haze and a low sun (atmo.js). Round 10 had a censer box, a board and a bell in a post frame.
// Local frame: the court's frame (world.js `frame`), -z toward the summit, +z back toward the arrival court.
import * as THREE from 'three';
import { materials, hall, banner, pine, box } from './kit.js';

let M = null;
export const kitMaterials = () => (M ||= materials());

// The camera the painting is seen from: eye height inside the gate, looking up the court to the hall.
// Round 13: tilted up about eight degrees, as the painting is, so the crag's crown and the gate's lintel both sit in frame.
export const ANCHOR_VIEW = { cam: [0, 1.65, 18.4], look: [0, 6.8, -18], avatar: [0, 21] };

export function greatCourt(G, { collide = () => {} } = {}) {
  const M = kitMaterials();
  // paving over the whole court, a curb of stone at its edge
  const pave = new THREE.Mesh(new THREE.PlaneGeometry(44, 46), M.paving.clone());
  pave.material.map = M.paving.map.clone(); pave.material.map.needsUpdate = true; pave.material.map.repeat.set(7, 7);
  pave.material.color.setRGB(1.22, 1.14, 1.04); // round 13b, 13c: sunlit flagstones, warm but still stone-grey as the painting's
  pave.rotation.x = -Math.PI / 2; pave.position.set(0, 0.04, 0); pave.receiveShadow = true; G.add(pave);
  // low parapets down both sides, with a gap at the gate
  for (const sx of [-1, 1]) { box(G, 0.7, 1.1, 34, M.stone, sx * 21.6, 0.55, 2); collide(sx * 21.6, 2, 0.7, 34, 0, 1.1); }

  // the terrace: dressed stone, 1.8 m, a central stair of nine steps, balustrade posts either side of it
  const TY = 1.8, TZ = -19, TD = 10;
  box(G, 36, TY, TD, M.stone, 0, TY / 2, TZ); // round 13c: the paler dressed stone, the painting's terrace wall reads light
  collide(-11, TZ, 14, TD, 0, TY); collide(11, TZ, 14, TD, 0, TY);
  box(G, 36.4, 0.16, TD + 0.4, M.plinth, 0, TY + 0.08, TZ);
  for (let i = 0; i < 9; i++) { const h = TY * (i + 1) / 9; box(G, 8, h, 0.42, M.plinth, 0, h / 2, TZ + TD / 2 + 3.6 - i * 0.42); }
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) box(G, 0.26, 0.9, 0.26, M.plinth, sx * 4.2, TY + 0.45 - i * 0.45 * (i > 0), TZ + TD / 2 + i * 1.2);
  for (let x = -17.5; x <= 17.6; x += 1.4) if (Math.abs(x) > 4.4) box(G, 0.2, 0.75, 0.2, M.plinth, x, TY + 0.53, TZ + TD / 2 - 0.15);
  for (const sx of [-1, 1]) box(G, 13.2, 0.12, 0.24, M.plinth, sx * 11, TY + 0.95, TZ + TD / 2 - 0.15);

  // the hall of the painting: two tiers, lit doors, on the terrace
  const H = hall(M, { w: 15, d: 8, ph: 4.2, tiers: 2, lit: true, seed: 5 }); H.position.set(0, TY, TZ - 0.5); G.add(H);
  collide(0, TZ - 0.5, 16, 9, TY, 9);
  // side halls at the court's corners: one finished, one still in scaffolding, students on its boards
  const L = hall(M, { w: 10, d: 6, ph: 3.4, stage: 'half', seed: 9 }); L.position.set(-15.5, 0, -8.5); L.rotation.y = Math.PI / 2; G.add(L);
  const Rh = hall(M, { w: 10, d: 6, ph: 3.4, seed: 11 }); Rh.position.set(15.5, 0, -8.5); Rh.rotation.y = -Math.PI / 2; G.add(Rh);
  collide(-15.5, -8.5, 7, 11, 0, 6); collide(15.5, -8.5, 7, 11, 0, 6);

  // the bell on its plinth, left of the axis, as the painting has it
  const BX = -4.2, BZ = -6.5;
  box(G, 2.2, 0.55, 2.2, M.plinth, BX, 0.28, BZ); box(G, 1.7, 0.2, 1.7, M.stone, BX, 0.65, BZ);
  const bell = new THREE.Mesh(new THREE.LatheGeometry([[0.0, 0], [0.78, 0], [0.74, 0.16], [0.62, 0.6], [0.56, 1.4], [0.42, 1.78], [0.14, 1.9], [0, 1.9]]
    .map(([r, y]) => new THREE.Vector2(r, y)), 32), new THREE.MeshStandardMaterial({ color: 0x6f6038, metalness: 0.7, roughness: 0.42 }));
  bell.position.set(BX, 0.76, BZ); bell.castShadow = true; G.add(bell);
  for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.6 - i * 0.03, 0.035, 6, 32), M.brass); r.rotation.x = Math.PI / 2; r.position.set(BX, 1.25 + i * 0.42, BZ); G.add(r); }
  collide(BX, BZ, 2.2, 2.2, 0, 2.7);

  // the sigil a student chalks on the paving. Round 13b: the painting's glowing blue star in a double circle, larger and
  // nearer the gate (round 13 had a pale ring and a pentagon), with a soft glow under it.
  { const SX = -2.9, SZ = 10.2, R = 1.9, glow = new THREE.MeshBasicMaterial({ color: 0x6cc8ff, transparent: true, opacity: 0.95, depthWrite: false });
    const flat = (m, y) => { m.rotation.x = -Math.PI / 2; m.position.set(SX, y, SZ); G.add(m); return m; };
    flat(new THREE.Mesh(new THREE.RingGeometry(R - 0.1, R, 64), glow), 0.06); flat(new THREE.Mesh(new THREE.RingGeometry(R * 0.82 - 0.06, R * 0.82, 64), glow), 0.06);
    const pts = Array.from({ length: 5 }, (_, k) => { const a = k * 4 * Math.PI / 5 + Math.PI / 2; return [Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8]; });
    for (let k = 0; k < 5; k++) { const [x0, z0] = pts[k], [x1, z1] = pts[(k + 1) % 5], L = Math.hypot(x1 - x0, z1 - z0);
      const b = new THREE.Mesh(new THREE.PlaneGeometry(L, 0.09), glow); b.rotation.x = -Math.PI / 2; b.rotation.z = Math.atan2(z1 - z0, x1 - x0) * -1;
      b.position.set(SX + (x0 + x1) / 2, 0.062, SZ + (z0 + z1) / 2); G.add(b); }
    const halo = document.createElement('canvas'); halo.width = halo.height = 128; const hx = halo.getContext('2d'), gr = hx.createRadialGradient(64, 64, 8, 64, 64, 64);
    gr.addColorStop(0, 'rgba(90,180,255,0.6)'); gr.addColorStop(0.75, 'rgba(70,150,255,0.25)'); gr.addColorStop(1, 'rgba(110,190,255,0)'); hx.fillStyle = gr; hx.fillRect(0, 0, 128, 128);
    flat(new THREE.Mesh(new THREE.PlaneGeometry(R * 2.8, R * 2.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(halo), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })), 0.055);
  }

  // banners at the stair foot, pines at the court's back corners and over the parapets
  for (const sx of [-1, 1]) { const b = banner(M, { h: 3, w: 0.7 }); b.position.set(sx * 5.2, 0, TZ + TD / 2 + 4.2); G.add(b); }
  [[-19, -14, 9, 0.2, 3], [19.5, -15, 10, -0.15, 7], [-23.5, 8, 8, 0.25, 13], [23.5, 4, 9, -0.2, 17]].forEach(([x, z, h, lean, s]) => { const p = pine(M, h, lean, s); p.position.set(x, 0, z); G.add(p); });

  // the gate the painting is seen through: two lacquered posts, a lintel and a rafter row, at the court's south edge
  const GZ = 12, GX = 3.15, DW = new THREE.MeshStandardMaterial({ color: 0x6e4a30, roughness: 0.8 }); // round 13c: lit brown timber, not black
  const POST = new THREE.MeshStandardMaterial({ color: 0x7a4a2c, roughness: 0.7 }); // round 13c: dark old timber, as the painting's posts (red lacquer read as a new gate)
  // Round 13b: posts and lintel raised to 6 m so the lintel is a thin strip at the top of the anchor frame and the sky
  // shows under it, as in the painting (at 4.9 m the lintel and rafters filled the top fifth of the frame).
  for (const sx of [-1, 1]) { box(G, 0.42, 6.2, 0.42, POST, sx * GX, 3.1, GZ); box(G, 0.8, 0.3, 0.8, M.stone, sx * GX, 0.15, GZ); collide(sx * GX, GZ, 0.5, 0.5, 0, 6.2); }
  box(G, GX * 2 + 1.2, 0.4, 0.5, DW, 0, 6.0, GZ);
  for (let x = -GX - 0.4; x <= GX + 0.41; x += 0.5) box(G, 0.18, 0.18, 1.6, DW, x, 6.3, GZ);

  // Round 13c: the threshold under the gate, big dark flagstones in the gatehouse's shade, as the painting's foreground
  // (the court's sunlit paving ran right to the bottom of the anchor frame, much brighter than the painting there).
  { const th = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), M.stoneD.clone()); th.material.color.setRGB(0.62, 0.62, 0.66);
    th.rotation.x = -Math.PI / 2; th.position.set(0, 0.05, GZ + 4.2); th.receiveShadow = true; G.add(th); }
  // timber stacked by the scaffold, a cart of stone by the stair
  for (let i = 0; i < 5; i++) box(G, 3.4, 0.24, 0.24, M.raw, -12.5, 0.12 + Math.floor(i / 2) * 0.24, 0.4 + (i % 2) * 0.28 + (i > 3 ? 0.14 : 0));
  return { stairFoot: [0, TZ + TD / 2 + 3.8], bell: [BX, BZ] };
}

// Where the students stand and what they do (local court frame): [x, z, facing (deg, 0 = toward the summit), look].
// Basic training robes in the painting come in slate blue, undyed brown, grey-blue, rose and green; each trainee gets one
// (round 12: before, two dyes, violet and saffron, so the court read as two colours). cloth = main, light, shade, trim.
const ROBE = {
  slate: { cloth: ['#4d6a8c', '#6d8bad', '#2f4560', '#7a2e2a'], lining: '#8a6a44' },
  brown: { cloth: ['#7d5a3a', '#9a7650', '#523a24', '#7a2e2a'], lining: '#b9a07a' },
  mist:  { cloth: ['#7f93a8', '#a0b2c4', '#566878', '#7a2e2a'], lining: '#5a6f86' },
  rose:  { cloth: ['#b4706a', '#cf8e86', '#85504a', '#6a3a2a'], lining: '#7d5a3a' },
  moss:  { cloth: ['#5f8a55', '#7ea772', '#3d5c38', '#7a2e2a'], lining: '#c9b98a' },
  ink:   { cloth: ['#3b4452', '#566274', '#242a33', '#7a2e2a'], lining: '#8a6a44' },
};
export const STUDENTS = [
  [-4.2, 7.4, 200, { outfit: 'coat', dye: 'violet', skin: 'amber', style: 'sweep', colour: 'black', shape: 'a', build: 'slender', tint: ROBE.slate }],
  [-3.6, 5.2, 120, { outfit: 'jacket', dye: 'saffron', skin: 'light', style: 'page', colour: 'gray', shape: 'b', build: 'average', tint: ROBE.brown }],
  [2.6, 5.4, 250, { outfit: 'dress', dye: 'saffron', skin: 'umber', style: 'afro', colour: 'black', shape: 'c', build: 'average', tint: ROBE.mist }],
  [3.8, 6.4, 70, { outfit: 'coat', dye: 'violet', skin: 'chestnut', style: 'spiked', colour: 'black', shape: 'a', build: 'broad', tint: ROBE.ink }],
  [4.4, 4.2, 330, { outfit: 'dress', dye: 'violet', skin: 'light', style: 'sweep', colour: 'red', shape: 'c', build: 'slender', tint: ROBE.rose }],
  [-1.8, -9.2, 20, { outfit: 'coat', dye: 'saffron', skin: 'amber', style: 'page', colour: 'black', shape: 'b', build: 'average', tint: ROBE.slate }],
  [-13.2, -2, 90, { outfit: 'jacket', dye: 'violet', skin: 'umber', style: 'afro', colour: 'black', shape: 'a', build: 'broad', tint: ROBE.brown }],
  [8.5, -10.5, 300, { outfit: 'jacket', dye: 'saffron', skin: 'chestnut', style: 'sweep', colour: 'gray', shape: 'b', build: 'slender', tint: ROBE.moss }],
  [-1.1, 10.4, 270, { outfit: 'jacket', dye: 'violet', skin: 'light', style: 'page', colour: 'black', shape: 'a', build: 'average', kneel: true, tint: ROBE.mist }],
];
