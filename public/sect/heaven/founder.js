// Round 28: the founder's hall, dressed inside. Wendell answered cc-heaven-r27 A ("keep going toward 7"), and the
// callsheet's line for A was: dress the founder's hall inside and widen the court. Round 27's still from inside showed a
// bare floor, square red posts and a black void where the roof lifts. Everything here comes from the room's own plan
// (rooms.json `founder`): its eight-trigram floor, the dais and the plain mat, the six Elders' seats, the censer and the
// bell, the clerestory windows and the north doors to the altar, and the "red plaster, teal and gold beam" of its bend.
// Plan coordinates: x across 0..30, y from the north wall (0) to the south doors (20); local x = x - 15, z = y - 10.
import * as THREE from 'three';
import { tex, RND } from './kit.js';
import { COURTS } from './layout.js';

const TRI = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];
const at = (R, x, y) => [x - R.Wd / 2, y - R.D / 2];

export function dressFounder(E, R, M) {
  const W = R.Wd, D = R.D, H = R.Ht, F = 0.06;
  const add = (geo, m, x, y, z, o = {}) => { const k = new THREE.Mesh(geo, m); k.position.set(x, y, z); k.castShadow = o.cast !== false; k.receiveShadow = true; if (o.ry) k.rotation.y = o.ry; if (o.rx) k.rotation.x = o.rx; E.add(k); return k; };
  const bx = (w, h, d, m, x, y, z, o) => add(new THREE.BoxGeometry(w, h, d), m, x, y, z, o);
  const cy = (r0, r1, h, m, x, y, z, s = 20) => add(new THREE.CylinderGeometry(r0, r1, h, s), m, x, y, z);
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.8, ...o });
  const gold = std({ color: 0xc8a457, roughness: 0.45, metalness: 0.5 }), bronze = std({ color: 0x6b5634, roughness: 0.45, metalness: 0.7 });

  // the square red posts of the blockout give way to round lacquered columns on stone drums; their colliders stay
  const posts = R.items.filter(it => it[7] === '#9c2a22');
  E.children.filter(m => m.isMesh && m.material === M.lacR && m.geometry.parameters && m.geometry.parameters.width < 1).forEach(m => { m.visible = false; });
  // the censer's grey box gives way to a bronze tripod and the bell beside it (same footprint, same collider)
  E.children.filter(m => m.isMesh && m.geometry.parameters && Math.abs(m.geometry.parameters.height - 1.1) < 1e-3 && Math.abs(m.geometry.parameters.width - 1.2) < 1e-3).forEach(m => { m.visible = false; });
  for (const [, , x, y, w, d] of posts) { const [lx, lz] = at(R, x + w / 2, y + d / 2);
    cy(0.5, 0.56, 0.42, M.plinth, lx, F + 0.21, lz, 24); cy(0.31, 0.33, H - 0.42, M.lacR, lx, F + 0.42 + (H - 0.42) / 2, lz, 24);
    cy(0.34, 0.34, 0.18, gold, lx, H - 0.55, lz, 24); }

  // the floor: dark fired bricks laid square, the way a hall of state is paved
  const brick = tex(512, 512, (x, w, h) => { const rnd = RND(71); x.fillStyle = '#2a2622'; x.fillRect(0, 0, w, h);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const s = (rnd() - 0.5) * 14; x.fillStyle = `rgb(${68 + s},${63 + s},${58 + s})`; x.fillRect(i * w / 4 + 3, j * h / 4 + 3, w / 4 - 6, h / 4 - 6);
      for (let k = 0; k < 12; k++) { x.fillStyle = `rgba(255,245,225,${0.02 + 0.03 * rnd()})`; x.fillRect(i * w / 4 + rnd() * w / 4, j * h / 4 + rnd() * h / 4, 4 + 18 * rnd(), 2 + 4 * rnd()); } } }, [W / 2.4, D / 2.4]);
  add(new THREE.PlaneGeometry(W, D), std({ map: brick, roughness: 0.55 }), 0, F + 0.003, 0, { rx: -Math.PI / 2, cast: false });

  // the eight-trigram floor where the candidate kneels (plan: circle at 15, 11, 3.6 m; plain centre 1 m)
  const [tx, tz] = at(R, 15, 11);
  const bagua = tex(1024, 1024, (x, w) => { const c = w / 2; x.fillStyle = '#c9a35a'; x.beginPath(); x.arc(c, c, c, 0, 7); x.fill();
    x.strokeStyle = '#6b4f2a'; x.lineWidth = 10; x.beginPath(); x.arc(c, c, c - 8, 0, 7); x.stroke(); x.beginPath(); x.arc(c, c, c * 0.42, 0, 7); x.stroke();
    x.fillStyle = '#e9d9a8'; x.beginPath(); x.arc(c, c, c * 0.28, 0, 7); x.fill(); x.lineWidth = 4; x.beginPath(); x.arc(c, c, c * 0.28, 0, 7); x.stroke();
    x.fillStyle = '#4a3418'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `${Math.round(c * 0.3)}px serif`;
    for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + i * Math.PI / 4; x.save(); x.translate(c + Math.cos(a) * c * 0.7, c + Math.sin(a) * c * 0.7); x.rotate(a + Math.PI / 2); x.fillText(TRI[i], 0, 0); x.restore();
      x.beginPath(); x.moveTo(c + Math.cos(a + Math.PI / 8) * c * 0.42, c + Math.sin(a + Math.PI / 8) * c * 0.42); x.lineTo(c + Math.cos(a + Math.PI / 8) * (c - 8), c + Math.sin(a + Math.PI / 8) * (c - 8)); x.stroke(); } });
  add(new THREE.CircleGeometry(3.6, 64), std({ map: bagua, roughness: 0.5, metalness: 0.15 }), tx, F + 0.012, tz, { rx: -Math.PI / 2, cast: false });
  // a red runner from the great doors to the trigram floor, and on from it to the dais
  const runner = std({ map: tex(64, 256, (x, w, h) => { x.fillStyle = '#7e1f18'; x.fillRect(0, 0, w, h); x.fillStyle = '#c8a457'; x.fillRect(0, 0, 5, h); x.fillRect(w - 5, 0, 5, h);
    x.fillStyle = 'rgba(200,164,87,0.35)'; for (let j = 0; j < h; j += 32) x.fillRect(w / 2 - 6, j + 10, 12, 12); }, [1, 4]), roughness: 0.95 });
  for (const [y0, y1] of [[14.65, 20], [4.9, 7.35]]) { const [, z] = at(R, 15, (y0 + y1) / 2); add(new THREE.PlaneGeometry(2.2, y1 - y0), runner, tx, F + 0.009, z, { rx: -Math.PI / 2, cast: false }); }

  // the dais: a second, lower step in front, gold on its nosings; a painted screen of the peak behind the plain mat
  { const [dx, dz] = at(R, 15, 2.8); bx(9, 0.22, 0.6, M.plinth, dx, F + 0.11, dz + 1.9); bx(8.02, 0.05, 0.06, gold, dx, F + 0.45, dz + 1.6); bx(9.02, 0.04, 0.06, gold, dx, F + 0.22, dz + 2.2);
    const peak = tex(1024, 512, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#efe3c4'); g.addColorStop(1, '#d9c79e'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(70,82,80,0.85)'; x.beginPath(); x.moveTo(0, h); x.lineTo(w * 0.18, h * 0.55); x.lineTo(w * 0.3, h * 0.66); x.lineTo(w * 0.5, h * 0.14); x.lineTo(w * 0.66, h * 0.6); x.lineTo(w * 0.82, h * 0.48); x.lineTo(w, h * 0.7); x.lineTo(w, h); x.fill();
      x.fillStyle = 'rgba(239,227,196,0.7)'; for (let i = 0; i < 5; i++) { x.beginPath(); x.ellipse(w * (0.1 + 0.2 * i), h * (0.62 + 0.08 * (i % 2)), w * 0.12, h * 0.04, 0, 0, 7); x.fill(); }
      x.fillStyle = '#a3322a'; x.beginPath(); x.arc(w * 0.78, h * 0.2, h * 0.07, 0, 7); x.fill(); x.strokeStyle = '#6b4a2a'; x.lineWidth = 6; for (let i = 0; i <= 5; i++) { x.beginPath(); x.moveTo(i * w / 5, 0); x.lineTo(i * w / 5, h); x.stroke(); } });
    const scr = std({ map: peak, roughness: 0.85 }); const sw = 1.1;
    for (let i = 0; i < 5; i++) { const ang = (i % 2 ? 0.18 : -0.18), px = dx + (i - 2) * sw * 0.985; const m = new THREE.MeshStandardMaterial({ map: peak.clone(), roughness: 0.85 }); m.map.repeat.set(1 / 5, 1); m.map.offset.set(i / 5, 0); m.map.needsUpdate = true;
      bx(sw, 2.6, 0.06, m, px, F + 0.45 + 1.3, dz - 1.15, { ry: ang }); bx(sw + 0.04, 0.08, 0.1, M.wood, px, F + 0.45 + 2.62, dz - 1.15, { ry: ang }); } void scr;
    // the plaque over the screen: 天, the sect's one word, gold on black lacquer
    const plq = tex(256, 512, (x, w, h) => { x.fillStyle = '#1c1714'; x.fillRect(0, 0, w, h); x.strokeStyle = '#c8a457'; x.lineWidth = 14; x.strokeRect(10, 10, w - 20, h - 20); x.fillStyle = '#d8b660'; x.font = '150px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('天', w / 2, h / 2 + 8); });
    bx(1.3, 2.4, 0.12, std({ map: plq, roughness: 0.4 }), dx, 5.4, -D / 2 + 0.08); }

  // the ceiling stays when the roof lifts: teal coffers ringed in gold, painted beams on the column lines, and a domed
  // caisson over the trigram floor
  const coffer = tex(256, 256, (x, w, h) => { x.fillStyle = '#c8a457'; x.fillRect(0, 0, w, h); x.fillStyle = '#284a4a'; x.fillRect(14, 14, w - 28, h - 28); x.fillStyle = '#2f6f6a'; x.fillRect(30, 30, w - 60, h - 60);
    x.strokeStyle = '#e9e1cc'; x.lineWidth = 6; x.beginPath(); x.arc(w / 2, h / 2, w * 0.28, 0, 7); x.stroke(); x.fillStyle = '#284a7a'; x.beginPath(); x.arc(w / 2, h / 2, w * 0.22, 0, 7); x.fill(); x.fillStyle = '#c8a457'; x.beginPath(); x.arc(w / 2, h / 2, w * 0.07, 0, 7); x.fill(); }, [W / 1.5, D / 1.5]);
  add(new THREE.PlaneGeometry(W, D), std({ map: coffer, roughness: 0.75, side: THREE.DoubleSide }), 0, H - 0.04, 0, { rx: Math.PI / 2, cast: false });
  for (const [, , x, , w] of posts.filter((p, i, a) => a.findIndex(q => q[2] === p[2]) === i)) { const [lx] = at(R, x + w / 2, 0); bx(0.42, 0.55, D, M.painted, lx, H - 0.32, 0); }
  for (const yy of [5.65 + 0.35, 14.65 + 0.35]) { const [, lz] = at(R, 0, yy); bx(W, 0.55, 0.42, M.painted, 0, H - 0.32, lz); }
  for (let i = 0; i < 3; i++) cy(3.0 - i * 0.7, 3.0 - i * 0.7, 0.16, i % 2 ? M.brk : gold, tx, H - 0.66 - i * 0.12, tz, 48);
  add(new THREE.CircleGeometry(1.3, 40), std({ color: 0x284a7a, roughness: 0.6, side: THREE.DoubleSide }), tx, H - 0.96, tz, { rx: Math.PI / 2, cast: false });
  // the painted beam band round all four walls (the blockout drew only the north and west ones)
  bx(W, 0.5, 0.05, M.painted, 0, 7.05, -D / 2 + 0.03); bx(W - 6, 0.5, 0.05, M.painted, 0, 7.05, D / 2 - 0.33);
  bx(0.05, 0.5, D, M.painted, -W / 2 + 0.03, 7.05, 0, { ry: 0 }); bx(0.05, 0.5, D, M.painted, W / 2 - 0.03, 7.05, 0);

  // the clerestory windows on the north wall (plan deco: 2..10 and 20..28, 4.8 to 6.6 m), paper lattice lit by the sky
  const pane = tex(256, 128, (x, w, h) => { x.fillStyle = '#f3ead6'; x.fillRect(0, 0, w, h); x.strokeStyle = '#5a3a26'; x.lineWidth = 4; for (let i = 0; i <= 16; i++) { x.beginPath(); x.moveTo(i * w / 16, 0); x.lineTo(i * w / 16, h); x.stroke(); } for (let j = 0; j <= 6; j++) { x.beginPath(); x.moveTo(0, j * h / 6); x.lineTo(w, j * h / 6); x.stroke(); } x.lineWidth = 10; x.strokeStyle = '#86281f'; x.strokeRect(0, 0, w, h); });
  const paneM = std({ map: pane, emissiveMap: pane, emissive: 0xfff4dc, emissiveIntensity: 0.55, roughness: 0.9 });
  for (const [a, b] of [[2, 10], [20, 28]]) { const [cx] = at(R, (a + b) / 2, 0); bx(b - a, 1.8, 0.04, paneM, cx, 5.7, -D / 2 + 0.03, { cast: false }); }
  // gold door frames on the great doors (south, 12..18) and the altar doors (north, 13..17)
  for (const [a, b, z, h] of [[12, 18, D / 2 - 0.3, 6.2], [13, 17, -D / 2 + 0.05, 6.0]]) { const [l] = at(R, a, 0), [r] = at(R, b, 0);
    bx(0.22, h, 0.3, M.lacR, l + 0.11, F + h / 2, z); bx(0.22, h, 0.3, M.lacR, r - 0.11, F + h / 2, z); bx(b - a, 0.35, 0.34, M.painted, (l + r) / 2, F + h, z); bx(b - a, 0.06, 0.36, gold, (l + r) / 2, F + h - 0.2, z); }
  // the great doors stand folded back against the south wall, two leaves each side
  for (const sg of [-1, 1]) for (let i = 0; i < 2; i++) { const [lx] = at(R, sg < 0 ? 11.2 - i * 1.5 : 18.8 + i * 1.5, 0); bx(1.45, 5.6, 0.1, M.door, lx, F + 2.8, D / 2 - 0.42, { cast: false }); }

  // six banners of the Elders over their seats, three a side, each in its court's colour with its trigram
  COURTS.forEach((c, i) => { const side = i < 3 ? -1 : 1, yy = 8.5 + (i % 3) * 2.2, [, lz] = at(R, 0, yy);
    const t = tex(128, 512, (x, w, h) => { x.fillStyle = c.col; x.fillRect(0, 0, w, h); x.fillStyle = '#c8a457'; x.fillRect(0, 0, w, 16); x.fillRect(0, h - 22, w, 22);
      x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(0, 16, 8, h - 38); x.fillStyle = '#efe3c4'; x.font = '96px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(c.tri, w / 2, h * 0.32); });
    const g = new THREE.PlaneGeometry(1.0, 3.6, 1, 6); const p = g.attributes.position; for (let k = 0; k < p.count; k++) p.setZ(k, 0.04 * Math.sin(p.getY(k) * 2));
    add(g, std({ map: t, roughness: 0.9, side: THREE.DoubleSide }), side * (W / 2 - 0.09), 4.3, lz, { ry: -side * Math.PI / 2, cast: false });
    bx(0.08, 0.08, 1.3, M.wood, side * (W / 2 - 0.12), 6.15, lz);
    // a cushion on each seat, in the same colour
    const [sx] = at(R, side < 0 ? 4.0 : 26.0, 0); bx(1.0, 0.14, 1.0, std({ color: c.col, roughness: 0.95 }), sx, F + 0.47, lz); });

  // hanging lanterns down the nave: red silk drums with gold caps, glowing; two warm lights carry their light
  const silk = std({ color: 0xb8352a, emissive: 0xff7a3a, emissiveIntensity: 0.55, roughness: 0.8 });
  for (const xx of [8.5, 21.5]) for (const yy of [8.5, 13.5]) { const [lx, lz] = at(R, xx, yy);
    bx(0.02, 1.2, 0.02, M.wood, lx, H - 1.15, lz, { cast: false }); cy(0.36, 0.36, 0.75, silk, lx, H - 2.1, lz, 16); cy(0.4, 0.3, 0.1, gold, lx, H - 1.7, lz, 16); cy(0.3, 0.4, 0.1, gold, lx, H - 2.5, lz, 16); }
  for (const xx of [8.5, 21.5]) { const [lx, lz] = at(R, xx, 11), L = new THREE.PointLight('#ffb070', 14, 18, 1.6); L.position.set(lx, H - 2.4, lz); E.add(L); }

  // the censer and the bell, in the plan's footprint by the great doors. The censer is the Smithsonian's CC0 mountain
  // censer (boshanlu, heaven.html sets it on this stand once it loads); the bell stands beside it on a post.
  { const [cx, cz] = at(R, 15, 17.8), kx = cx - 0.22;
    cy(0.36, 0.42, 0.34, M.plinth, kx, F + 0.17, cz, 20); cy(0.4, 0.4, 0.04, gold, kx, F + 0.36, cz, 20);
    E.userData.censerAt = [kx, F + 0.38, cz];
    const bxs = cx + 0.4; cy(0.03, 0.03, 0.9, M.wood, bxs, F + 0.45, cz, 6); cy(0.06, 0.2, 0.32, bronze, bxs, F + 0.78, cz, 20); cy(0.2, 0.2, 0.03, gold, bxs, F + 0.62, cz, 20); }
}
