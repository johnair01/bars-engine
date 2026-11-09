// The Heaven sect's layout in metres, read off round 3's map (council callsheet calrunian-sect.md, make/map.py).
// Map pixels: 1 px = 0.6 m, origin at the ring's centre (CX 860, CY 640), east is +x, south is +z.
// Heights come from the map's art direction: gate +0, arrival +12, great court +25, ring +40 to +60, summit +90,
// Sage's crag +110, forest edge 60 m below the forest gate.

export const PX = 0.6;
export const CX = 860, CY = 640, RX = 400, RY = 340;
export const m = ([x, y]) => [(x - CX) * PX, (y - CY) * PX];
const ringPx = deg => { const a = deg * Math.PI / 180; return [CX + RX * Math.cos(a), CY + RY * Math.sin(a)]; };
export const ringAt = deg => m(ringPx(deg));

// Ring walk height by angle (deg, map convention: 0 east, 90 south). Arrival sits low at 0; the far side is highest.
export function ringHeight(deg) {
  let d = ((deg % 360) + 360) % 360;
  const keys = [[0, 12], [20, 26], [45, 40], [90, 48], [135, 54], [180, 60], [225, 56], [270, 50], [315, 46], [352, 20], [360, 12]];
  for (let i = 1; i < keys.length; i++) if (d <= keys[i][0]) {
    const [a0, h0] = keys[i - 1], [a1, h1] = keys[i], t = (d - a0) / (a1 - a0);
    return h0 + (h1 - h0) * (t * t * (3 - 2 * t));
  }
  return 12;
}

export const COURTS = [
  { key: 'shaman', deg: 135, tri: '☷', name: "Shaman Elder's court", bend: 'cave mouth, fire circle', col: '#6f6a5e' },
  { key: 'challenger', deg: 90, tri: '☲', name: "Challenger Elder's court", bend: 'cliff-edge arena, forge', col: '#c4512f' },
  { key: 'regent', deg: 180, tri: '☱', name: "Regent Elder's court", bend: 'still pond, hall of records', col: '#4a6f95' },
  { key: 'architect', deg: -135, tri: '☰', name: "Architect Elder's court", bend: 'timber yard, crane', col: '#b8954a' },
  { key: 'diplomat', deg: 45, tri: '☴', name: "Diplomat Elder's court", bend: 'tea garden, guest rooms', col: '#5f8f45' },
  { key: 'sage', deg: -45, tri: '☶', name: "Sage Elder's crag", bend: 'no yard: crooked path, library cave', col: '#9aa3ad' },
];
for (const c of COURTS) { c.at = ringAt(c.deg); c.h = ringHeight(c.deg); }
// The Sage's court stands on its crag, pushed out from the ring, at +110.
{ const s = COURTS.find(c => c.key === 'sage'); const [x, z] = s.at, L = Math.hypot(x, z); s.at = [x + x / L * 34, z + z / L * 34]; s.h = 110; s.crag = true; }

export const NATIONS = [
  ['Argyra', 'metal', '#9aa3ad'], ['Lamenth', 'water', '#4a6f95'], ['Virelune', 'wood', '#5f8f45'],
  ['Pyrakanth', 'fire', '#c4512f'], ['Meridia', 'earth', '#b8954a'],
];

export const P = {
  summit: m([860, 545]), great: m([1040, 735]), dojo: m([905, 805]), refectory: m([1062, 585]), rows: m([690, 710]),
  gate: m([1450, 640]), road: m([1690, 1150]), forestGate: m([860, 192]), edge: m([860, 92]), deep: m([500, 120]),
  blight: m([150, 360]), caveMouth: m([300, 960]), spring: ringAt(-90), arrival: ringAt(0),
};

// Flat pads [x, z, height, radius]; the heightfield blends them into one mountain.
export const PADS = [
  [...P.road, -40, 14], [...P.gate, 0, 16], [...P.arrival, 12, 26], [...P.great, 25, 30], [...P.summit, 90, 34],
  [...P.dojo, 30, 16], [...P.refectory, 44, 16], [...P.rows, 50, 22], [...P.spring, 50, 30],
  [...P.forestGate, 46, 8], [...P.edge, -14, 30], [...P.deep, -30, 26], [...P.blight, -44, 30],
];
for (const c of COURTS) PADS.push([...c.at, c.h, c.crag ? 24 : 34]);
// The ring walk itself, a terrace road; the stretch from -38 to -8 degrees is unbuilt.
for (let d = -8; d <= 322; d += 5) PADS.push([...ringAt(d), ringHeight(d), 4]);
// The axis climbs: road, pilgrim stair, gate, arrival, great court, summit.
export const AXIS = [[1690, 1150], [1600, 1060], [1520, 980], [1580, 880], [1480, 800], [1530, 720], [1450, 640],
  [1260, 640], [1040, 735], [980, 650], [860, 545]].map(m);
const AXIS_H = [-40, -32, -24, -16, -9, -4, 0, 12, 25, 50, 90];
for (let i = 1; i < AXIS.length - 1; i++) if (i < 6 || i === 9) PADS.push([...AXIS[i], AXIS_H[i], 4]);
// Round 14: the great court turns about ten degrees to the left of the summit, so from the anchor view the crag stands
// right of centre as the painting draws it (it stood dead centre behind the hall). GREAT_FACE is where its -z points.
export const GREAT_YAW = 0.18;
const _f = [P.summit[0] - P.great[0], P.summit[1] - P.great[1]], _L = Math.hypot(..._f), _u = [_f[0] / _L, _f[1] / _L], _l = [_u[1], -_u[0]];
export const GREAT_FACE = [P.great[0] + (_u[0] * Math.cos(GREAT_YAW) + _l[0] * Math.sin(GREAT_YAW)) * _L, P.great[1] + (_u[1] * Math.cos(GREAT_YAW) + _l[1] * Math.sin(GREAT_YAW)) * _L];
// Round 14: a hollow of haze left of the axis between the great court and the crag. In the painting the land falls
// away left of the hall to layered ranges and bright sky; here a grey-green shoulder filled that half of the anchor
// frame. Nothing stands in it; the axis ridge and the ring walk keep their pads.
for (const [fw, lf, h, r] of [[105, 38, -60, 14], [150, 70, -70, 18], [70, 48, -30, 6], [140, 20, -50, 8]])
  PADS.push([P.great[0] + _u[0] * fw + _l[0] * lf, P.great[1] + _u[1] * fw + _l[1] * lf, h, r]);
// The skirt: cloud sea falls away south and east, the forest slopes off north and west.
for (let a = 0; a < 360; a += 12) {
  const r = a * Math.PI / 180, x = Math.cos(r) * 560, z = Math.sin(r) * 430;
  const south = Math.max(0, Math.sin(r)) + Math.max(0, Math.cos(r)) * 0.7;
  PADS.push([x, z, -50 - 130 * Math.min(1, south), 10]);
}

// Paths, drawn into the ground colour: [points, width m, colour]
export const PATHS = [
  [AXIS, 6, '#b8862b'],
  [Array.from({ length: 67 }, (_, i) => ringAt(-8 + i * 5)), 5, '#8a6b48'],
  [[P.spring, P.forestGate, P.edge], 4, '#4c6a35'],
  [[P.edge, m([700, 90]), P.deep, m([330, 200]), P.blight], 3, '#4c6a35'],
];
const LANE = deg => { const a = deg * Math.PI / 180; return [215 * PX * Math.cos(a), (-5 + 170 * Math.sin(a)) * PX]; };
PATHS.push([Array.from({ length: 73 }, (_, i) => LANE(i * 5)), 4.5, '#8a6b48']);
for (const c of [...COURTS, { at: P.spring }, { at: P.arrival }]) {
  const a = Math.atan2(c.at[1] + 3, c.at[0]) * 180 / Math.PI; PATHS.push([[LANE(a), c.at], 3.5, '#8a6b48']);
}

// Round 3's route, stops 1 to 11 (make/map.py ROUTE).
const sp = ringPx(-90), ar = ringPx(0), sh = ringPx(135);
export const ROUTE = [
  [[1690, 1150], 'The road. The summit is in view from the first step.'],
  [[1450, 640], 'Thunder gate. The Steward senior meets you.'],
  [[ar[0], ar[1] + 40], 'Arrival court. Your bunk for the first nights.'],
  [[1040, 735], 'Great court. The Shaman Elder hands you a bucket.'],
  [[sp[0] - 60, sp[1] + 30], 'The spring. Fill it; the forest gate stands open.'],
  [[860, 92], 'Forest edge. A wild spirit stirs.'],
  [[sp[0] + 40, sp[1] + 40], 'Vessel cells. The first sit on your island.'],
  [[1062, 585], 'Refectory. You meet your team of three.'],
  [[690, 710], "Exiles' rows. Your house, your lit door."],
  [[sh[0], sh[1]], "Shaman's court. First class: the Arrival rank."],
  [[905, 805], 'Dojo. Root sparring with your team.'],
].map(([p, text], i) => ({ n: i + 1, at: m(p), text }));

// The summit crag (round 13): its crown's radius and a smooth, seeded wobble round it so the cliff has spurs and bays.
export const CRAG = { rim: 38 };
export function cragNoise(th) { return 0.5 * Math.sin(th * 3 + 0.7) + 0.3 * Math.sin(th * 7 + 2.1) + 0.2 * Math.sin(th * 13 + 4.4); }

// Round 14b: the far region, laid out as land (Wendell on cc-heaven-anchor-13, 4/10: "the distant space doesn't look
// reachable ... lay the region out topographically"). The ranges were painted cards; now they are peaks and ridges in
// one heightfield with the sect, rising out of the cloud sea, and a ridge road leaves the ring's west side, drops to a
// saddle and climbs to the Watch, a pavilion on the nearest far peak. Peaks are placed by bearing from the great court
// as the anchor view sees them (degrees left of its axis, metres out), so the left of the frame opens on real ranges.
const _gf = (() => { const g = P.great, f = GREAT_FACE, u = [f[0] - g[0], f[1] - g[1]], L = Math.hypot(...u); return [u[0] / L, u[1] / L]; })();
const bearing = (deg, d) => { const a = deg * Math.PI / 180, [fx, fz] = _gf, lx = fz, lz = -fx;
  return [P.great[0] + (fx * Math.cos(a) + lx * Math.sin(a)) * d, P.great[1] + (fz * Math.cos(a) + lz * Math.sin(a)) * d]; };
// [x, z, top m, slope, seed]
export const FAR_PEAKS = [
  [...bearing(14, 760), 140, 0.8, 1],   // the Watch
  [...bearing(25, 1050), 230, 0.75, 2], [...bearing(5, 1250), 280, 0.7, 3], [...bearing(36, 1450), 330, 0.65, 4],
  [...bearing(17, 1700), 390, 0.6, 5], [...bearing(46, 1100), 200, 0.75, 6], [...bearing(-3, 1650), 360, 0.6, 7],
  [...bearing(28, 1750), 360, 0.6, 17], [...bearing(9, 1500), 330, 0.65, 18],
  [...bearing(-24, 950), 220, 0.75, 8], [...bearing(-34, 1350), 320, 0.65, 9], [...bearing(-16, 1550), 360, 0.6, 10],
  [...bearing(-50, 1150), 250, 0.7, 11], [...bearing(-70, 1450), 330, 0.6, 12], [...bearing(-95, 1250), 240, 0.7, 13],
  [...bearing(62, 1350), 280, 0.65, 14], [...bearing(80, 1600), 340, 0.6, 15], [...bearing(-120, 1500), 300, 0.6, 16],
];
export const WATCH = FAR_PEAKS[0];
// The ridge road: from the ring walk at its west side, down to a saddle, up to the Watch. [x, z, crest height]
const _rs = ringAt(160), _wt = [WATCH[0], WATCH[1]], _mid = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const FAR_ROAD = [[..._rs, ringHeight(160)], [..._mid(_rs, _wt, 0.18), 40], [..._mid(_rs, _wt, 0.4), 22],
  [..._mid(_rs, _wt, 0.6), 34], [..._mid(_rs, _wt, 0.82), 90], [WATCH[0], WATCH[1], WATCH[2]]];
const spur = (th, s) => 0.5 * Math.sin(th * 5 + s) + 0.3 * Math.sin(th * 9 + s * 2.3) + 0.2 * Math.sin(th * 17 + s * 0.7);
export function farHeight(x, z) {
  let h = -230;
  for (const [px, pz, top, sl, sd] of FAR_PEAKS) {
    const d = Math.hypot(x - px, z - pz); if (d > (top + 230) / (sl * 0.6)) continue; // beyond its foot
    const th = Math.atan2(z - pz, x - px);
    h = Math.max(h, top - d * sl * (1 + 0.38 * spur(th, sd)) + 6 * Math.sin(x * 0.05 + sd) * Math.sin(z * 0.043 - sd));
  }
  for (let i = 1; i < FAR_ROAD.length; i++) {
    const a = FAR_ROAD[i - 1], b = FAR_ROAD[i], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2)), d = Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz);
    const crest = a[2] + (b[2] - a[2]) * (t * t * (3 - 2 * t));
    h = Math.max(h, crest - Math.max(0, d - 5) * 0.8);
  }
  return h;
}
export const FAR_EXTENT = 1900;

// One heightfield from the pads: inverse distance to each pad's rim, flat inside every pad.
function rawHeight(x, z) {
  let num = 0, den = 0;
  for (let i = 0; i < PADS.length; i++) {
    const p = PADS[i], d = Math.hypot(x - p[0], z - p[1]) - p[3];
    if (d <= 0) return p[2];
    const w = 1 / (d * d * d);
    num += w * p[2]; den += w;
  }
  return num / den;
}

// The raw blend leaves terraces; a blurred grid smooths the slopes, then every pad is pressed flat again with an
// 8 m feather. Walking and the ground mesh both read this grid, so the avatar stands on what you see.
export const GRID = { x0: 24 - 570, z0: -9 - 410, step: 3, nx: 381, nz: 275 };
let H = null;
function buildGrid() {
  const { x0, z0, step, nx, nz } = GRID; H = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) H[j * nx + i] = rawHeight(x0 + i * step, z0 + j * step);
  const T = new Float32Array(H.length);
  for (let pass = 0; pass < 4; pass++) {
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { let s = 0, n = 0;
      for (let k = -3; k <= 3; k++) { const ii = Math.min(nx - 1, Math.max(0, i + k)); s += H[j * nx + ii]; n++; } T[j * nx + i] = s / n; }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { let s = 0, n = 0;
      for (let k = -3; k <= 3; k++) { const jj = Math.min(nz - 1, Math.max(0, j + k)); s += T[jj * nx + i]; n++; } H[j * nx + i] = s / n; }
  }
  // Round 13: the summit is a crag, as the anchor painting draws it (a grey rock tower with the founder's buildings on its
  // crown), not the round green dome the blend makes. Inside the crown's rim the ground stays at the summit's height;
  // outside it a cliff falls about four metres for every metre out, down to a foot that never stands above the blend.
  { const [sx, sz] = P.summit;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = x0 + i * step, z = z0 + j * step, d = Math.hypot(x - sx, z - sz);
      if (d > 150) continue;
      const th = Math.atan2(z - sz, x - sx), rim = CRAG.rim + cragNoise(th) * 7;
      const foot = 40 + Math.max(0, d - rim) * 0.12, h = H[j * nx + i];
      const cliff = 90 - Math.max(0, d - rim) * (3.2 + 1.6 * cragNoise(th * 3 + 1));
      const low = Math.min(h, foot), k = Math.min(1, Math.max(0, (150 - d) / 30));
      H[j * nx + i] = h + (Math.max(cliff, low) - h) * k;
    }
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) H[j * nx + i] = Math.max(H[j * nx + i], farHeight(x0 + i * step, z0 + j * step)); // round 14b
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = x0 + i * step, z = z0 + j * step;
    for (const p of PADS) { const d = Math.hypot(x - p[0], z - p[1]) - p[3];
      if (d < 8) { const t = d <= 0 ? 1 : 1 - d / 8, k = t * t * (3 - 2 * t); H[j * nx + i] += (p[2] - H[j * nx + i]) * k; if (d <= 0) break; } }
  }
}
export function heightAt(x, z) {
  if (!H) buildGrid();
  const { x0, z0, step, nx, nz } = GRID;
  if (x < x0 || z < z0 || x > x0 + (nx - 1) * step || z > z0 + (nz - 1) * step) return farHeight(x, z); // round 14b: the far region
  const fx = Math.min(nx - 1.001, Math.max(0, (x - x0) / step)), fz = Math.min(nz - 1.001, Math.max(0, (z - z0) / step));
  const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, a = j * nx + i;
  return (H[a] * (1 - u) + H[a + 1] * u) * (1 - v) + (H[a + nx] * (1 - u) + H[a + nx + 1] * u) * v;
}
