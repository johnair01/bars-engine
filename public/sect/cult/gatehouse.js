// gatehouse.js: the mountain gate as a math model (gate round 2, 2026-11-07).
// Wendell on cc-gate-look-2 (A): "Let's use the free gates as references to try and meet with code drawn environments.
// I think this should be the strategy in general. The more we can turn these models into math the easier it will be
// to modify them."
// So the free model is only measured, never shipped. REF holds the numbers refmodel.cjs measured from BlenderKit's CC0
// "Chinese Temple 2" by Free poly (asset 8701a79a, 10.7 x 11.2 x 11.7 m, 519,281 faces): its silhouette band by band.
// gateHouse() rebuilds that massing from about forty numbers in plain boxes, lofts and tubes. Every number is a knob:
// change `s` to scale the massing, or any field of REF to reshape a tier. Parts a person uses (the door, the window)
// keep their size in metres when the massing scales.
// Local frame: x right, y up, z back; the door faces -z (toward the step). Origin: the plinth's centre, at its foot.
export const REF = {
  source: 'BlenderKit CC0 "Chinese Temple 2" (Free poly, 8701a79a), measured with refmodel.cjs, metres',
  plinth: { hx: 4.30, hz: 4.54, h: 0.60 },
  body: { hx: 4.05, hz: 4.29, top: 3.20 },              // the lower storey: plastered walls with the arched door
  band1: { hx: 3.95, hz: 4.15, top: 3.80 },             // beam and brackets under the lower eave
  eave1: { hx: 5.35, hz: 5.55, y: 4.15, lift: 0.75, inHx: 3.17, inHz: 3.37, inY: 5.80 }, // the skirt roof
  base2: { hx: 3.17, hz: 3.37, top: 6.00 },             // the upper storey's sill band
  body2: { hx: 2.91, hz: 3.16, top: 7.80 },             // the upper storey
  band2: { hx: 3.17, hz: 3.40, top: 8.30 },
  eave2: { hx: 4.57, hz: 4.66, y: 8.45, lift: 0.60, inHx: 2.76, inHz: 2.66, inY: 9.60 }, // the hip below the gable
  gable: { hx: 2.76, ridgeY: 11.45, top: 11.67 },       // the gable roof: ridge along x, gables facing the sides
  // round 4 (his note on cc-gate-look-3, 2026-11-07): "let's make it s 50% wider wit h2 auxillary doors on the side so
  // there's a main room and at least 2 offshoot rooms." `widen` stretches the lower storey's massing in x only (plinth,
  // body, band1, eave1); the upper storey keeps the reference's size. `rooms` splits the lower storey: a main room
  // behind the arch, running through to the far arch, and an offshoot room each side behind its own smaller door.
  // round 6 (his C on cc-gate-look-5, 2026-11-08): "bigger side chambers, an accessible basement, 30% wider at the
  // base and at the second story, start working out where stairs go". Both widen factors times 1.3 (1.5 to 1.95, 1.25
  // to 1.625); the main room's share drops from 0.42 to 0.36, so each side room is about 1.6 times round 5's width.
  widen: { lower: 1.95, upper: 1.625 },
  rooms: { wall: 0.45, part: 0.3, main: 0.36, sideDoor: { w: 1.2, spring: 1.50 } }, // main: the main room's share of the inner width
  // round 6: a basement under the whole lower storey, and two stairs, each against the partition inside a side room:
  // the west room's climbs front to back to the upper storey (steep, as a pagoda stair is); the east room's goes down,
  // front to back, to the basement. Metres, not scaled.
  basement: { depth: 2.8, slab: 0.25 },                 // depth: the basement floor below the ground floor
  stairs: { w: 0.9, gap: 0.1, up: { tread: 0.19, n: 22, z0: -2.5 }, down: { tread: 0.27, n: 15, z0: -1.9 } },
  door: { w: 1.40, spring: 1.65 }, /* round 12: 2.35 m to the crown, for a 1.75 m person (level-design norm 2.1 to 2.3 m) */                      // a person's size: not scaled (the arch's radius is w / 2); the reference's is 1.55 wide, 2.5 high
  palette: { tile: [42, 46, 20], plaster: [65, 31, 21], stone: [88, 80, 70], wood: [60, 40, 37] }, // texture averages
};

export function gateHouse(THREE, o) {
  const s = o.s ?? 0.7, R = o.ref ?? REF, M = o.mats, g = new THREE.Group(), V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const S = v => v * s;
  // ---- the plinth and the lower storey: three rooms in a row behind the front wall (round 4)
  const WL = R.widen?.lower ?? 1, WU = R.widen?.upper ?? 1, SX = v => S(v) * WL, SU = v => S(v) * WU;
  const lower = new THREE.Group(), upper = new THREE.Group(); g.add(lower, upper); let tgt = lower; const add = m => { tgt.add(m); return m; };
  const box = (w, h, d, m, x, y, z) => { const b = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)); b.position.set(x, y, z); return b; };
  const CH = M.chamber ?? M.passage, CF = M.chamberFloor ?? M.passage; /* round 9: the main chamber's lime wash and board floor */
  const P = R.plinth, B = R.body, RM = R.rooms; box(2 * SX(P.hx), S(P.h), 2 * S(P.hz), M.plinth, 0, S(P.h) / 2, 0);
  const y0 = S(P.h), bw = SX(B.hx), bd = S(B.hz), bh = S(B.top) - y0, dw = R.door.w, sp = R.door.spring, rr = dw / 2, t = RM.wall, pt = RM.part;
  const inner = bw - t, mw = inner * RM.main, sideC = (mw + pt + inner) / 2, sdw = RM.sideDoor.w, ssp = RM.sideDoor.spring, sr = sdw / 2;
  const arch = (cx, r0, sp0, cw) => { const h = new THREE.Path(); h.moveTo(cx - r0, 0); if (cw) { h.lineTo(cx + r0, 0); h.lineTo(cx + r0, sp0); h.absarc(cx, sp0, r0, 0, Math.PI, false); h.lineTo(cx - r0, 0); } else { h.lineTo(cx - r0, sp0); h.absarc(cx, sp0, r0, Math.PI, 0, true); h.lineTo(cx + r0, 0); h.lineTo(cx - r0, 0); } return h; };
  const doorsFront = [[0, rr, sp], [-sideC, sr, ssp], [sideC, sr, ssp]], doorsBack = [[0, rr, sp]];
  const wallShape = doors => { const sh = new THREE.Shape(); sh.moveTo(-bw, 0); sh.lineTo(bw, 0); sh.lineTo(bw, bh); sh.lineTo(-bw, bh); sh.lineTo(-bw, 0); for (const [cx, r0, s0] of doors) sh.holes.push(arch(cx, r0, s0)); return sh; };
  // front and back walls: plaster outside, the dim interior colour on their inner faces and in the door reveals
  for (const [doors, z0, inZ] of [[doorsFront, -bd, -bd + t + 0.005], [doorsBack, bd - t, bd - t - 0.005]]) {
    const wg = new THREE.ExtrudeGeometry(wallShape(doors), { depth: t, bevelEnabled: false, curveSegments: 20 });
    if (M.plasterWall) { const pa = wg.attributes.position, ua = wg.attributes.uv; for (let i = 0; i < ua.count; i++) ua.setXY(i, (pa.getX(i) + bw) / (2 * bw), pa.getY(i) / bh); } // round 7: the wear picture spans the wall once
    const w = add(new THREE.Mesh(wg, [M.plasterWall ?? M.plaster, M.passage])); w.position.set(0, y0, z0);
    const ln = add(new THREE.Mesh(new THREE.ShapeGeometry(wallShape(doors), 20), CH)); ln.position.set(0, y0, inZ); if (z0 > 0) ln.rotation.y = Math.PI; } /* round 9: each liner now faces into the chamber (both faced the wall before, so the outer plaster showed inside) */
  // the flank walls (outer face plaster, inner face dim) and the two partitions that wall the offshoot rooms off the main room
  for (const sx of [-1, 1]) { const mats = sx > 0 ? [M.plaster, M.passage] : [M.passage, M.plaster]; box(t, bh, 2 * bd - 2 * t, [mats[0], mats[1], M.dark, M.dark, M.passage, M.passage], sx * (bw - t / 2), y0 + bh / 2, 0);
    box(pt, bh, 2 * bd - 2 * t, CH, sx * (mw + pt / 2), y0 + bh / 2, 0); }
  // round 6: the stairs. Each sits against the partition in its side room (x from xs0 to xs1); sx -1 climbs, sx 1 descends
  const ST = R.stairs, BS = R.basement, xs0 = mw + pt + ST.gap, xs1 = xs0 + ST.w, yUp = S(R.base2.top), yB = y0 - BS.depth;
  const flight = (sx, zStart, n, rise, tread, yFoot, mat) => { for (let i = 0; i < n; i++) { const top = rise > 0 ? y0 + rise * (i + 1) : y0 + rise * (i + 1);
    const yb = Math.min(top, yFoot), yt = Math.max(top, yFoot) ; const st = box(ST.w, yt - yb, tread, mat, sx * (xs0 + xs1) / 2, (yt + yb) / 2, zStart + tread * (i + 0.5)); st.name = 'stair'; } };
  const upRise = (yUp - y0) / ST.up.n, dnRise = -BS.depth / ST.down.n;
  flight(-1, ST.up.z0, ST.up.n, upRise, ST.up.tread, y0, M.wood ?? M.dark);
  flight(1, ST.down.z0, ST.down.n - 1, dnRise, ST.down.tread, yB, M.stone);
  const upEnd = ST.up.z0 + ST.up.n * ST.up.tread, dnEnd = ST.down.z0 + (ST.down.n - 1) * ST.down.tread;
  // round 7: furniture. Helpers first; furnishMain, furnishSide and furnishBasement are called once the rooms stand.
  // His A on cc-gate-look-6 (2026-11-08): keep the layout; furnish the three chambers and the basement. A mountain gate
  // keeps a drum and a bell; the west chamber is the gatekeeper's study, the east chamber a tea room for travellers,
  // the basement the gate's store (water, grain, oil, wine).
  const TM = M.timber ?? M.dark, BR = M.bronze ?? M.brass, CE = M.ceramic ?? M.dark, PA = M.paper ?? M.plinth, LA = M.lamp ?? M.brass;
  // round 9: lit inside. Each lamp leaves a marker (userData.light) that gate.html turns into a warm point light.
  const glow = (x, y, z, w = 1) => { const o = add(new THREE.Object3D()); o.position.set(x, y, z); o.userData.light = w; return o; };
  const mesh = (geo, m, x, y, z) => { const o = add(new THREE.Mesh(geo, m)); o.position.set(x, y, z); return o; };
  const lathe = (pts, m, x, y, z, seg = 18) => mesh(new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), seg), m, x, y, z);
  const holed = (X0, X1, Z0, Z1, hx0, hx1, hz0, hz1, yb, h, m) => { const c = (x0, x1, z0, z1) => { if (x1 - x0 > 0.001 && z1 - z0 > 0.001) box(x1 - x0, h, z1 - z0, m, (x0 + x1) / 2, yb + h / 2, (z0 + z1) / 2); };
    c(X0, hx0, Z0, Z1); c(hx1, X1, Z0, Z1); c(hx0, hx1, Z0, hz0); c(hx0, hx1, hz1, Z1); };
  const table = (w, d, h, x, yb, z, m = TM) => { box(w, 0.05, d, m, x, yb + h - 0.025, z); for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) box(0.05, h - 0.05, 0.05, m, x + a * (w / 2 - 0.06), yb + (h - 0.05) / 2, z + b * (d / 2 - 0.06)); };
  const jar = (x, yb, z, h, m = CE) => { lathe([[0, 0], [h * 0.22, 0], [h * 0.34, h * 0.25], [h * 0.36, h * 0.5], [h * 0.28, h * 0.8], [h * 0.15, h * 0.92], [h * 0.17, h], [0, h]], m, x, yb, z); };
  const barrel = (x, yb, z, r, h) => { lathe([[0, 0], [r * 0.86, 0], [r, h / 2], [r * 0.86, h], [0, h]], TM, x, yb, z, 14); for (const f of [0.15, 0.85]) mesh(new THREE.TorusGeometry(r * (0.9 + 0.06 * Math.sin(f * Math.PI)), 0.015, 5, 18), M.dark, x, yb + h * f, z).rotation.x = Math.PI / 2; };
  const sack = (x, yb, z, r, ry = 0) => { const o = mesh(new THREE.SphereGeometry(r, 12, 8), M.sack ?? PA, x, yb + r * 0.5, z); o.scale.set(1.35, 0.55, 0.85); o.rotation.y = ry; };
  const scrolls = (x, y, z, n, along, len = 0.42) => { for (let i = 0; i < n; i++) { const o = mesh(new THREE.CylinderGeometry(0.035, 0.035, len, 8), i % 3 ? PA : M.cushion ?? PA, x + (along === 'x' ? (i - n / 2) * 0.08 : 0), y + 0.035 + (i % 2) * 0.05, z + (along === 'z' ? (i - n / 2) * 0.08 : 0)); o.rotation.set(along === 'x' ? Math.PI / 2 : 0, 0, along === 'z' ? Math.PI / 2 : 0); } };
  const shelf = (x, z, w, d, h, rows, alongX, fill, yBase = y0) => { const y1 = yBase; const sw = alongX ? w : d, sd = alongX ? d : w; for (const e of [-1, 1]) box(alongX ? 0.05 : sd, h, alongX ? sd : 0.05, TM, x + (alongX ? e * (w / 2) : 0), y1 + h / 2, z + (alongX ? 0 : e * (w / 2)));
    for (let r = 0; r < rows; r++) { const yy = y1 + 0.12 + r * (h - 0.15) / (rows - 1); box(alongX ? w : d, 0.04, alongX ? d : w, TM, x, yy, z); if (fill && r < rows - 1) fill(x, yy + 0.02, z, r); } };
  const brazier = (x, yb, z, r) => { lathe([[0, 0], [r * 0.6, 0], [r, r * 0.55], [r * 1.05, r * 0.62], [0, r * 0.62]], BR, x, yb + 0.28, z); for (let i = 0; i < 3; i++) { const a = i * 2.094; box(0.04, 0.3, 0.04, BR, x + Math.cos(a) * r * 0.6, yb + 0.15, z + Math.sin(a) * r * 0.6); }
    const coal = mesh(new THREE.CircleGeometry(r * 0.85, 16), M.ember ?? LA, x, yb + 0.28 + r * 0.5, z); coal.rotation.x = -Math.PI / 2; };
  const standLamp = (x, z, h) => { box(0.3, 0.04, 0.3, TM, x, y0 + 0.02, z); box(0.05, h, 0.05, TM, x, y0 + h / 2, z); const sh = mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.32, 6), LA, x, y0 + h + 0.16, z); box(0.36, 0.03, 0.36, TM, x, y0 + h + 0.33, z); glow(x, y0 + h + 0.16, z, 1); return sh; };
  function furnishMain() { // the main chamber: drum to the west, bell to the east, benches by the far arch, a lamp each side of it, banners on the partitions
    const zc = 0.5, dx = mw - 0.75;
    { const x = -dx; for (const e of [-1, 1]) box(0.08, 1.35, 0.08, TM, x, y0 + 0.675, zc + e * 0.42); box(0.08, 0.08, 0.92, TM, x, y0 + 1.33, zc);
      /* round 9: the drum is a bellied barrel on its side, brass studs round each head, the heads painted, turned 35 degrees toward the front door */
      const dg = new THREE.Group(); dg.position.set(x, y0 + 0.95, zc); dg.rotation.y = -0.6; dg.name = 'drum'; add(dg);
      const bar = new THREE.Mesh(new THREE.LatheGeometry([[0.34, -0.23], [0.39, -0.12], [0.41, 0], [0.39, 0.12], [0.34, 0.23]].map(([a, b]) => new THREE.Vector2(a, b)), 32), M.drum ?? M.lacquer); bar.rotation.z = Math.PI / 2; dg.add(bar);
      for (const e of [-1, 1]) { const hd = new THREE.Mesh(new THREE.CircleGeometry(0.335, 40), M.drumHead ?? PA); hd.position.x = e * 0.232; hd.rotation.y = e * Math.PI / 2; dg.add(hd);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.338, 0.014, 6, 40), M.dark); rim.position.x = e * 0.228; rim.rotation.y = Math.PI / 2; dg.add(rim);
        for (let i = 0; i < 28; i++) { const a = i * Math.PI * 2 / 28, st = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 4), M.brass); st.position.set(e * 0.205, Math.sin(a) * 0.352, Math.cos(a) * 0.352); dg.add(st); } }
      for (const e of [-1, 1]) { const rg = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 5, 12), M.brass); rg.position.set(0, -0.06, e * 0.405); dg.add(rg); }
      for (const e of [-1, 1]) box(0.04, 0.04, 0.34, TM, x + 0.3, y0 + 0.62 + e * 0.02, zc - 0.62).rotation.x = 0.2; } // two drumsticks resting on the stand's foot
    { const x = dx; for (const e of [-1, 1]) box(0.09, 1.95, 0.09, TM, x, y0 + 0.975, zc + e * 0.5); box(0.1, 0.1, 1.15, TM, x, y0 + 1.92, zc);
      lathe([[0, 0.95], [0.08, 0.95], [0.2, 0.86], [0.24, 0.45], [0.31, 0.02], [0.33, 0], [0.27, 0], [0.2, 0.45], [0, 0.5]], BR, x, y0 + 0.82, zc, 24); box(0.05, 0.16, 0.05, BR, x, y0 + 1.82, zc);
      const ram = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), TM, x - 0.55, y0 + 1.15, zc); ram.rotation.x = Math.PI / 2; for (const e of [-1, 1]) box(0.012, 0.62, 0.012, M.dark, x - 0.55, y0 + 1.5, zc + e * 0.35); }
    for (const sx of [-1, 1]) { const x = sx * (mw - 0.25); box(0.36, 0.05, 1.3, TM, x, y0 + 0.44, 2.0); for (const e of [-1, 1]) box(0.3, 0.42, 0.05, TM, x, y0 + 0.21, 2.0 + e * 0.55);
      standLamp(sx * 1.05, bd - t - 0.4, 1.25);
      const bn = mesh(new THREE.PlaneGeometry(0.55, 1.45), M.banner ?? M.lacquer, sx * (mw - 0.012), y0 + 1.2, -1.15); bn.rotation.y = -sx * Math.PI / 2; box(0.03, 0.03, 0.7, TM, sx * (mw - 0.03), y0 + 1.95, -1.15); } }
  function furnishSide(sx, fx, x1) { // west (sx -1): the gatekeeper's study; east (sx 1): a tea room for travellers
    const zb = bd - t, xo = sx * (x1 - 0.22);
    table(1.1, 0.55, 0.36, fx, y0, zb - 0.7); box(0.55, 0.08, 0.55, M.cushion ?? M.lacquer, fx, y0 + 0.04, zb - 1.45);
    if (sx < 0) { box(0.2, 0.04, 0.13, M.ink ?? M.dark, fx - 0.25, y0 + 0.38, zb - 0.7); box(0.42, 0.005, 0.3, PA, fx + 0.12, y0 + 0.363, zb - 0.72); box(0.18, 0.05, 0.03, TM, fx + 0.38, y0 + 0.39, zb - 0.55);
      for (let i = 0; i < 3; i++) { const b2 = mesh(new THREE.CylinderGeometry(0.008, 0.006, 0.22, 6), TM, fx + 0.33 + i * 0.04, y0 + 0.43, zb - 0.55); b2.rotation.x = Math.PI / 2; }
      shelf(xo, 0.15, 1.6, 0.36, 1.75, 4, false, (x, y, z) => scrolls(x, y, z, 12, 'z'));
      brazier(sx * ((xs1 + x1) / 2 - 0.15), y0, -0.75, 0.24);
    }
    else { const zt = zb - 0.7; lathe([[0, 0], [0.07, 0], [0.09, 0.06], [0.06, 0.12], [0, 0.12]], CE, fx, y0 + 0.36, zt); for (let i = 0; i < 4; i++) lathe([[0, 0], [0.025, 0], [0.035, 0.045], [0, 0.045]], M.cup ?? PA, fx - 0.36 + i * 0.24 - (i > 1 ? 0.0 : 0), y0 + 0.36, zt + (i % 2 ? 0.14 : -0.12), 10);
      box(0.55, 0.08, 0.55, M.cushion ?? M.lacquer, fx + sx * 0.85, y0 + 0.04, zt); // a second cushion at the table's end
      brazier(sx * (x1 - 0.55), y0, zb - 1.9, 0.2); lathe([[0, 0], [0.1, 0], [0.14, 0.08], [0.11, 0.17], [0.04, 0.2], [0, 0.2]], M.dark, sx * (x1 - 0.55), y0 + 0.43, zb - 1.9, 14);
      box(0.45, 1.5, 1.2, TM, xo - sx * 0.02, y0 + 0.75, -0.55); for (const e of [-1, 1]) mesh(new THREE.SphereGeometry(0.025, 8, 6), M.brass, xo - sx * 0.25, y0 + 0.95, -0.55 + e * 0.08); box(0.005, 1.4, 0.005, M.dark, xo - sx * 0.25, y0 + 0.75, -0.55); } }
  function furnishBasement(bx, bz) { // the store: a well, water and wine jars, grain sacks, oil barrels, shelves, two chests and a work table
    const yb = yB, wx = -bx * 0.55, wz = -0.7;
    lathe([[0.42, 0], [0.62, 0], [0.62, 0.7], [0.42, 0.7]], M.stone, wx, yb, wz, 20); const wt = mesh(new THREE.CircleGeometry(0.43, 20), M.water ?? M.dark, wx, yb + 0.45, wz); wt.rotation.x = -Math.PI / 2;
    for (const e of [-1, 1]) box(0.08, 1.45, 0.08, TM, wx + e * 0.68, yb + 0.72, wz); const rl = mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.36, 10), TM, wx, yb + 1.3, wz); rl.rotation.z = Math.PI / 2; box(0.01, 0.6, 0.01, M.dark, wx + 0.1, yb + 0.98, wz);
    lathe([[0, 0], [0.11, 0], [0.13, 0.2], [0, 0.2]], TM, wx + 0.1, yb + 0.6, wz);
    for (let i = 0; i < 4; i++) jar(-bx + 0.45 + i * 0.82, yb, bz - 0.42, 0.95 - (i % 2) * 0.15);
    for (let i = 0; i < 6; i++) jar(-bx + 0.5 + i * 0.75, yb, -bz + 0.4, 0.7 + 0.12 * ((i * 7) % 3), i % 2 ? M.ceramic2 ?? CE : CE);
    for (const [x, z, k, ry] of [[-bx + 0.5, 0.2, 0, 0.1], [-bx + 0.5, 0.95, 0, -0.1], [-bx + 1.2, 0.55, 0, 0.3], [-bx + 0.55, 0.58, 1, 0], [-bx + 1.1, 1.3, 0, -0.4]]) sack(x, yb + k * 0.24, z, 0.32, ry);
    for (const [x, z] of [[bx - 0.45, 0.3], [bx - 0.45, 1.05], [bx - 1.2, 0.68], [bx - 0.45, 1.8]]) barrel(x, yb, z, 0.33, 0.85);
    shelf(1.4, -bz + 0.25, 2.2, 0.4, 1.6, 4, true, (x, y, z, r) => { for (let i = 0; i < 6; i++) if ((i + r) % 4) jar(x - 0.9 + i * 0.36, y, z, 0.24, i % 2 ? M.ceramic2 ?? CE : CE); }, yb); /* round 10: the store's shelf stood on the ground-floor level and showed behind the front door; it is now on the basement floor */
    for (const x of [-1.9, 0.0]) { box(1.3, 0.42, 0.6, TM, x, yb + 0.21, bz - 0.4); box(1.32, 0.04, 0.62, M.brass, x, yb + 0.43, bz - 0.4); }
    table(1.8, 0.75, 0.78, -0.4, yb, 0.55); jar(-0.8, yb + 0.78, 0.55, 0.22); sack(0.1, yb + 0.78, 0.5, 0.2, 0.5); }
  // the ceiling and roof slab, with a stairwell over the climbing stair (from where a head would meet it to the top)
  { const cg = new THREE.Group(); cg.name = 'ceiling'; add(cg); const yc = y0 + bh - 0.03, zh0 = ST.up.z0 + Math.max(0, (bh - 2.0) / upRise - 1) * ST.up.tread, X0 = -bw - 0.02, X1 = bw + 0.02, Z0 = -bd - 0.02, Z1 = bd + 0.02;
    const cb = (x0, x1, z0, z1) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.08, z1 - z0), M.ceiling ?? M.dark); m.position.set((x0 + x1) / 2, yc, (z0 + z1) / 2); cg.add(m); };
    cb(X0, -xs1, Z0, Z1); cb(-xs0, X1, Z0, Z1); cb(-xs1, -xs0, Z0, zh0); cb(-xs1, -xs0, upEnd, Z1);
    /* round 9: the main chamber's ceiling shows its timber: two beams front to back on the partitions, joists across, and two lanterns hung over the walk */
    for (const sx of [-1, 1]) box(0.16, 0.22, 2 * bd - 2 * t, TM, sx * (mw - 0.08), yc - 0.15, 0);
    for (let i = 0; i < 7; i++) box(2 * mw, 0.09, 0.1, TM, 0, yc - 0.09, -bd + t + (i + 0.5) * (2 * bd - 2 * t) / 7);
    for (const lx of [-1.0, 1.0]) { const z = -(bd - t) * 0.15; box(0.012, 0.4, 0.012, M.dark, lx, yc - 0.25, z); mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.38, 12), LA, lx, yc - 0.64, z); box(0.4, 0.03, 0.4, TM, lx, yc - 0.44, z); box(0.3, 0.03, 0.3, TM, lx, yc - 0.84, z); glow(lx, yc - 0.68, z, 1.1); } }
  // the stairwell down: a dark opening in the east room's floor and a low rail along its open side
  { const ow = ST.w, od = dnEnd - ST.down.z0 + 0.05, hole = add(new THREE.Mesh(new THREE.PlaneGeometry(ow, od), M.dark)); hole.rotation.x = -Math.PI / 2; hole.position.set((xs0 + xs1) / 2, y0 + 0.03, ST.down.z0 + od / 2 - 0.05);
    box(0.06, 0.9, od, M.wood ?? M.dark, xs1 + 0.03, y0 + 0.45, ST.down.z0 + od / 2 - 0.05); box(ow, 0.9, 0.06, M.wood ?? M.dark, (xs0 + xs1) / 2, y0 + 0.45, dnEnd + 0.03); }
  // the basement: one long vault under all three rooms, lit warm like the side rooms, with two lanterns and a stone
  // floor; the slab between it and the ground floor is the plinth's stone
  { const bx = inner, bz = bd - t, bhgt = BS.depth - BS.slab, RLb = M.room ?? M.passage, RFb = M.roomFloor ?? M.passage;
    const vault = add(new THREE.Mesh(new THREE.BoxGeometry(2 * bx, bhgt, 2 * bz), [RLb, RLb, M.dark, RFb, RLb, RLb])); vault.material = vault.material.map(m => { const c = m.clone(); c.side = THREE.BackSide; return c; }); vault.position.set(0, yB + bhgt / 2, 0); vault.name = 'basement';
    for (const lx of [-bx / 2, bx / 2 * 0.2]) { const lp = add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.36, 12), M.lamp ?? M.brass)); lp.position.set(lx, yB + bhgt - 0.6, 0.6); glow(lx, yB + bhgt - 0.65, 0.6, 0.8); box(0.012, 0.4, 0.012, M.dark, lx, yB + bhgt - 0.22, 0.6); }
    furnishBasement(bx, bz);
    box(2 * bx + 0.2, BS.slab, 2 * bz + 0.2, M.stoneLight ?? M.stone, 0, yB + bhgt + BS.slab / 2, 0).name = 'slab'; }
  box(2 * mw, 0.03, 2 * bd - 2 * t, CF, 0, y0 + 0.015, 0); // the main room's floor
  // a dado of stone along the wall's foot, broken at each door; a stone ring round every arch on the front face
  { const cuts = doorsFront.map(([cx, r0]) => [cx - r0, cx + r0]).sort((a, b) => a[0] - b[0]); let x0 = -bw - 0.03;
    for (const [a, b] of [...cuts, [bw + 0.03, bw + 0.03]]) { if (a > x0) box(a - x0, 0.38, 0.06, M.stone, (a + x0) / 2, y0 + 0.19, -bd - 0.03); x0 = b; }
    box(2 * bw + 0.06, 0.38, 0.06, M.stone, 0, y0 + 0.19, bd + 0.03); for (const sx of [-1, 1]) box(0.06, 0.38, 2 * bd, M.stone, sx * (bw + 0.03), y0 + 0.19, 0); }
  for (const [cx, r0, s0] of doorsFront) { const ro = r0 + (r0 > 0.6 ? 0.2 : 0.15), ring = new THREE.Shape(); ring.moveTo(cx - ro, 0); ring.lineTo(cx - ro, s0); ring.absarc(cx, s0, ro, Math.PI, 0, true); ring.lineTo(cx + ro, 0); ring.lineTo(cx + r0, 0); ring.lineTo(cx + r0, s0); ring.absarc(cx, s0, r0, 0, Math.PI, false); ring.lineTo(cx - r0, 0); ring.lineTo(cx - ro, 0);
    const rg = add(new THREE.Mesh(new THREE.ExtrudeGeometry(ring, { depth: 0.08, bevelEnabled: false, curveSegments: 20 }), M.stoneLight)); rg.position.set(0, y0, -bd - 0.06); }
  // door leaves swung open inward: two at the main arch, one at each side door
  const leaf = (x, lw, lh, sx, nCol) => { const lg = new THREE.Group(), lf = new THREE.Mesh(new THREE.BoxGeometry(lw, lh, 0.06), M.lacquer); lf.position.set(-sx * lw / 2, lh / 2, 0); lg.add(lf);
    const stud = new THREE.SphereGeometry(0.022, 8, 6); for (let a = 0; a < Math.floor((lh - 0.3) / 0.3) + 1; a++) for (let b = 0; b < nCol; b++) { const st = new THREE.Mesh(stud, M.brass); st.position.set(-sx * (0.1 + b * 0.15), 0.25 + a * 0.3, -0.035); lg.add(st); }
    const rn = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.008, 6, 16), M.brass); rn.position.set(-sx * (lw - 0.08), 1.0, -0.04); lg.add(rn);
    lg.position.set(x, y0, -bd + t + 0.03); lg.rotation.y = sx * 1.3; add(lg); };
  for (const sx of [-1, 1]) leaf(sx * rr, rr - 0.02, sp + rr * 0.55, sx, 4);
  for (const sx of [-1, 1]) leaf(sx * (sideC + sr), sdw - 0.04, ssp + sr * 0.55, 1, 6);
  const far = add(new THREE.Mesh(new THREE.PlaneGeometry(dw, sp + rr), M.beyond)); far.position.set(0, y0 + (sp + rr) / 2, bd + 0.05); far.rotation.y = Math.PI;
  // the offshoot rooms: lit warm from a hanging lantern (painted into their walls, so no light leaks through), a low table
  // and a cushion; the main room stays the cool passage to the light beyond
  const RL = M.room ?? M.passage, RF = M.roomFloor ?? M.passage;
  for (const sx of [-1, 1]) { const x0 = mw + pt, x1 = inner, cx = sx * (x0 + x1) / 2, rw = x1 - x0, rd = 2 * bd - 2 * t - 0.02;
    const lin = add(new THREE.Mesh(new THREE.BoxGeometry(rw - 0.02, bh - 0.1, rd), [RL, RL, M.passage, RF, RL, RL])); lin.material = lin.material.map(m => { const c = m.clone(); c.side = THREE.BackSide; return c; }); lin.position.set(cx, y0 + (bh - 0.1) / 2 + 0.012, 0);
    const lamp = add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.36, 12), M.lamp ?? M.brass)); lamp.position.set(cx, y0 + bh - 0.75, -bd + t + 1.3); glow(cx, y0 + bh - 0.8, -bd + t + 1.3, 0.8);
    box(0.012, 0.55, 0.012, M.dark, cx, y0 + bh - 0.3, -bd + t + 1.3);
    furnishSide(sx, sx * (xs1 + x1) / 2, x1); }
  furnishMain();
  tgt = upper;
  // the plaque: hung on the beam above the main arch, clear of the skirt roof (round 3's sank into it)
  const plq = add(new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.5, 0.05), [M.brass, M.brass, M.brass, M.brass, M.brass, M.plaque]));
  // ---- beams and brackets: a painted beam round the storey's top, a row of three-tier brackets under the eave
  const band = (hx, hz, yb, yt, beamM) => { const h = yt - yb; for (const [w, d, x, z] of [[2 * hx, 0.24, 0, -hz], [2 * hx, 0.24, 0, hz], [0.24, 2 * hz, -hx, 0], [0.24, 2 * hz, hx, 0]]) box(w, h * 0.45, d, beamM, x, yb + h * 0.22, z);
    for (const [w, d, x, z] of [[2 * hx, 0.06, 0, -hz + 0.04], [2 * hx, 0.06, 0, hz - 0.04], [0.06, 2 * hz, -hx + 0.04, 0], [0.06, 2 * hz, hx - 0.04, 0]]) box(w, h * 0.6, d, M.soffit ?? M.rafter ?? M.dark, x, yb + h * 0.7, z); // round 7: a dark board behind the brackets, so nothing inside shows between them
    const n = Math.round(2 * hx / 0.55); for (const side of [0, 1, 2, 3]) for (let i = 0; i <= n; i++) { const u = -hx + 2 * hx * i / n, x = side < 2 ? u : (side === 2 ? -hx : hx), z = side < 2 ? (side ? hz : -hz) : u * hz / hx, out = side < 2 ? V(0, 0, side ? 1 : -1) : V(side === 2 ? -1 : 1, 0, 0);
      for (let t = 0; t < 3; t++) { const b = box(0.13 + 0.07 * t, (h * 0.55) / 3, 0.13, t % 2 ? M.bracketG : M.bracket, x + out.x * 0.07 * t, yb + h * 0.45 + (h * 0.55 / 3) * (t + 0.5), z + out.z * 0.07 * t); if (side >= 2) b.rotation.y = Math.PI / 2; } } };
  band(SX(R.band1.hx), S(R.band1.hz), S(B.top), S(R.band1.top), M.painted);
  plq.position.set(0, (S(B.top) + S(R.band1.top)) / 2 + 0.02, -S(R.band1.hz) - 0.2); plq.rotation.x = -0.08;
  // ---- a roof ring: lofted from the eave's rectangle (corners swept up) to an inner rectangle, concave, tiles in channels
  const eaves = [];
  // round 7: a soffit closes each roof's hollow underneath, from the eave's edge down to the top of the beam band, so no
  // light or wall shows through the gap between the brackets and the tiles (round 6's two red spots: the upper storey's
  // wall and the gable seen through that gap)
  const soffitM = (() => { const m = (M.soffit ?? M.rafter ?? M.dark).clone(); m.side = THREE.DoubleSide; return m; })();
  const ringRoof = (E, mat, wx = 1, wi = 1, sof = null) => { const W2 = S(E.hx) * wx, D2 = S(E.hz), iw = S(E.inHx) * wi, id = S(E.inHz), ey = S(E.y), ty = S(E.inY), lift = S(E.lift), N = 24, R2 = 10, pos = [], uv = [], idx = [], ep = [];
    const rect = (w, d, t) => { const seg = Math.floor(t) % 4, u = t - Math.floor(t), C = [[-w, -d], [w, -d], [w, d], [-w, d]], a = C[seg], b = C[(seg + 1) % 4]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, u]; };
    for (let j = 0; j <= R2; j++) { const v = j / R2; for (let i = 0; i <= 4 * N; i++) { const t = i / N, [ox, oz, u] = rect(W2, D2, t), [ix, iz] = rect(iw, id, t), lf = lift * Math.pow(Math.abs(u - 0.5) * 2, 4);
      const x = ox + (ix - ox) * v, z = oz + (iz - oz) * v, y = ey + lf * (1 - v) * (1 - v) + (ty - ey) * Math.pow(v, 1.7); pos.push(x, y, z); uv.push(t * 2 * (W2 + D2) / 0.9, v * 5); if (j === 0) ep.push(V(x, y - 0.02, z)); } }
    for (let j = 0; j < R2; j++) for (let i = 0; i < 4 * N; i++) { const a = j * (4 * N + 1) + i, b = a + 1, c = a + 4 * N + 1, d = b + 4 * N + 1; idx.push(a, c, b, b, c, d); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    add(new THREE.Mesh(geo, mat)); ep.pop(); eaves.push(ep);
    if (sof) { const sp2 = [], si = []; for (let j = 0; j <= 1; j++) for (let i = 0; i <= 4 * N; i++) { const t = i / N, [ox, oz, u] = rect(W2, D2, t), [bx2, bz2] = rect(sof.hx, sof.hz, t);
        if (j === 0) sp2.push(ox, ey + lift * Math.pow(Math.abs(u - 0.5) * 2, 4) - 0.03, oz); else sp2.push(bx2, sof.y, bz2); }
      for (let i = 0; i < 4 * N; i++) si.push(i, i + 4 * N + 1, i + 1, i + 1, i + 4 * N + 1, i + 4 * N + 2);
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp2, 3)); sg.setIndex(si); sg.computeVertexNormals(); const sm = add(new THREE.Mesh(sg, soffitM)); sm.name = 'soffit'; }
    // hip ridges from each swept corner up to the inner corner, with a small curl at the tip
    for (const [cx, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const pts = []; for (let k = 0; k <= 8; k++) { const v = k / 8; pts.push(V(cx * (W2 + (iw - W2) * v), ey + lift * (1 - v) * (1 - v) + (ty - ey) * Math.pow(v, 1.7) + 0.07, cz * (D2 + (id - D2) * v))); }
      add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.075, 6), M.ridge));
      const cu = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.045, 6, 12, Math.PI * 1.3), M.ridge); cu.position.copy(pts[0]).add(V(0, 0.1, 0)); cu.lookAt(cu.position.clone().add(V(cz, 0, -cx))); add(cu); }
    return { ey, lift }; };
  ringRoof(R.eave1, M.tile, WL, 1, { hx: SX(R.band1.hx), hz: S(R.band1.hz), y: S(R.band1.top) });
  // ---- the upper storey: sill band, plastered walls with columns at the corners and a lattice window on each face
  const b2 = R.body2, h2 = S(b2.top) - S(R.base2.top); { const yb = S(R.eave1.inY) - 0.7, yt = S(R.base2.top), hx = SU(R.base2.hx), hz = S(R.base2.hz), zs = ST.up.z0 + ((yb - y0) / upRise - 2) * ST.up.tread; // round 7: the sill reaches down into the skirt roof, with a stairwell
    holed(-hx, hx, -hz, hz, -xs1, -xs0, zs, upEnd + 0.05, yb, yt - yb, M.dark); }
  box(2 * SU(b2.hx), h2, 2 * S(b2.hz), M.plaster2, 0, S(R.base2.top) + h2 / 2, 0);
  for (const [cx, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, h2, 12), M.wood); c.position.set(cx * SU(b2.hx), S(R.base2.top) + h2 / 2, cz * S(b2.hz)); add(c); }
  const win = new THREE.Shape(); { const ww = 0.5, wsp = 0.75; win.moveTo(-ww, 0); win.lineTo(ww, 0); win.lineTo(ww, wsp); win.absarc(0, wsp, ww, 0, Math.PI, false); win.lineTo(-ww, 0); }
  for (const [x, z, ry] of [[0, -S(b2.hz) - 0.02, Math.PI], [0, S(b2.hz) + 0.02, 0], [-SU(b2.hx) - 0.02, 0, -Math.PI / 2], [SU(b2.hx) + 0.02, 0, Math.PI / 2]]) { const w = new THREE.Mesh(new THREE.ShapeGeometry(win, 16), M.lattice); w.position.set(x, S(R.base2.top) + 0.45, z); w.rotation.y = ry; add(w);
    const wu = w.geometry.attributes.uv; for (let i = 0; i < wu.count; i++) wu.setXY(i, (wu.getX(i) + 0.5) * 1.0, wu.getY(i) / 1.25); }
  band(SU(R.band2.hx), S(R.band2.hz), S(b2.top), S(R.band2.top), M.painted);
  // ---- the top roof: a hip ring under a gable roof (ridge along x), gables in red with dark trim, ridge ornaments
  ringRoof(R.eave2, M.tile, WU, WU, { hx: SU(R.band2.hx), hz: S(R.band2.hz), y: S(R.band2.top) });
  const G = R.gable, gx = SU(G.hx) + 0.12, gz0 = S(R.eave2.inHz), gy0 = S(R.eave2.inY), ry = S(G.ridgeY);
  for (const sz of [-1, 1]) { const geo = new THREE.BufferGeometry(), pos = [], uv = [], idx = [], NJ = 8, NI = 12;
    for (let j = 0; j <= NJ; j++) { const v = j / NJ; for (let i = 0; i <= NI; i++) { const x = -gx + 2 * gx * i / NI, z = sz * gz0 * (1 - v), y = gy0 + (ry - gy0) * (v * 0.8 + 0.2 * v * v) - 0.08; pos.push(x, y, z); uv.push(i / NI * 2 * gx / 0.9, v * 4); } }
    for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++) { const a = j * (NI + 1) + i, b = a + 1, c = a + NI + 1, d = b + NI + 1; idx.push(a, c, b, b, c, d); }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals(); add(new THREE.Mesh(geo, M.tile)); }
  const tri = new THREE.Shape(); tri.moveTo(-gz0 + 0.1, 0); tri.lineTo(gz0 - 0.1, 0); tri.lineTo(0, ry - gy0 - 0.12); tri.lineTo(-gz0 + 0.1, 0);
  for (const sx of [-1, 1]) { const t = new THREE.Mesh(new THREE.ShapeGeometry(tri), M.plaster2); t.position.set(sx * (gx - 0.3), gy0 - 0.05, 0); t.rotation.y = sx * Math.PI / 2; add(t);
    for (const sz of [-1, 1]) { const a = V(sx * (gx + 0.02), gy0 - 0.02, sz * gz0), b = V(sx * (gx + 0.02), ry, 0); add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 2, 0.08, 6), M.ridge)); } }
  box(2 * gx + 0.1, 0.28, 0.3, M.ridge, 0, ry + 0.06, 0);
  // the ridge ends: a chiwen, a beast's head curling inward with a raised tail, drawn as a curl and a fin
  for (const sx of [-1, 1]) { const cw = new THREE.Group(); const curl = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.08, 8, 16, Math.PI * 1.4), M.ridge); curl.rotation.z = -0.4; cw.add(curl);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.22), M.ridge); fin.position.set(0.12, 0.12, 0); fin.rotation.z = 0.35; cw.add(fin);
    cw.position.set(sx * (gx + 0.02), ry + 0.33, 0); cw.scale.x = -sx; add(cw); }
  // eave tubes (drip tiles) and rafter ends under both eaves
  for (const ep of eaves) { const ec = new THREE.CatmullRomCurve3(ep, true); add(new THREE.Mesh(new THREE.TubeGeometry(ec, 400, 0.07, 8, true), M.ridge));
    for (let i = 0; i < 400; i += 3) { const p = ec.getPointAt(i / 400), tg = ec.getTangentAt(i / 400), out = V(tg.z, 0, -tg.x).normalize();
      const rb = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.5), M.rafter); rb.position.copy(p).addScaledVector(out, -0.28).add(V(0, -0.1, 0)); rb.lookAt(rb.position.clone().add(out)); add(rb);
      const re = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 8), M.rafterEnd); re.position.copy(p).addScaledVector(out, -0.02).add(V(0, -0.1, 0)); re.lookAt(re.position.clone().add(out)); re.rotateX(Math.PI / 2); add(re); } }
  g.userData = { bw, bh, doors: doorsFront, vz: bd - t, s, lower, upper, stairX: (xs0 + xs1) / 2, basementY: yB, inner, bd, front: -S(P.hz), back: S(P.hz), hx: SX(P.hx), top: S(G.top), eaveFront: -S(R.eave1.hz) };
  return g;
}
