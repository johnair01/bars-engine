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
// Round 16: the fourth pad [140, 20, -50, 8] stood 26 m from the summit, inside the crag's crown, and pressed a 50 m pit
// into the cliff; it is gone.
for (const [fw, lf, h, r] of [[105, 38, -60, 14], [150, 70, -70, 18], [70, 48, -30, 6]])
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
  [...bearing(17, 760), 140, 0.8, 1],   // the Watch (14c: from 14 to 17 degrees, into the open gap left of the hall)
  [...bearing(25, 1050), 230, 0.75, 2], [...bearing(5, 1250), 280, 0.7, 3], [...bearing(36, 1450), 330, 0.65, 4],
  [...bearing(17, 1700), 390, 0.6, 5], [...bearing(46, 1100), 200, 0.75, 6], [...bearing(-3, 1650), 360, 0.6, 7],
  [...bearing(28, 1750), 360, 0.6, 17], [...bearing(9, 1500), 330, 0.65, 18],
  [...bearing(-24, 950), 220, 0.75, 8], [...bearing(-34, 1350), 320, 0.65, 9], [...bearing(-16, 1550), 360, 0.6, 10],
  [...bearing(-50, 1150), 250, 0.7, 11], [...bearing(-70, 1450), 330, 0.6, 12], [...bearing(-95, 1250), 240, 0.7, 13],
  [...bearing(62, 1350), 280, 0.65, 14], [...bearing(80, 1600), 340, 0.6, 15], [...bearing(-120, 1500), 300, 0.6, 16],
];
export const WATCH = FAR_PEAKS[0];
// The ridge road: from the ring walk at its west side, down to a saddle, up to the Watch. [x, z, crest height]
// Round 14c: the road leaves the ring where it crosses bearing 17 (ring angle 197), runs out along a spine to a shallow
// saddle, then climbs the Watch's face in switchbacks. It runs away from the anchor and every bend stands higher in the
// frame than the one before, so from inside the gate it reads as a way up the mountain you could take (in 14b it ran
// across the view at 22 m and every lantern sat behind the court balustrade).
const _rs = ringAt(197);
// Round 14c (part 7): the first route ran straight through the Blight hollow and two skirt pads, which pressed holes
// 100 m deep into it (the walk stood in a canyon). It now swings south of the Blight, then zigzags up the Watch's face.
export const FAR_ROAD = [[..._rs, ringHeight(197)], [-299, -81, 60], [-374, -100, 57], [-450, -105, 66],
  [-505, -150, 82], [-555, -118, 100], [-575, -185, 120], [WATCH[0], WATCH[1], WATCH[2]]];
{ // the skirt's sunken pads give way where the road crosses the skirt
  const near = (x, z) => FAR_ROAD.some((b, i) => { if (!i) return false; const a = FAR_ROAD[i - 1], dx = b[0] - a[0], dz = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz) < 30; });
  for (let i = PADS.length - 1; i >= 0; i--) if (PADS[i][3] === 10 && PADS[i][2] <= -50 && near(PADS[i][0], PADS[i][1])) PADS.splice(i, 1);
}
PATHS.push([FAR_ROAD.map(p => [p[0], p[1]]), 7, '#b5a58a']); // round 14c: the road coloured in on the sect's own ground too
// Round 14c: smooth value noise, so the ranges have gullies and spurs that run downhill instead of a star of straight
// ribs round each peak (the 14b map showed every peak as a starfish).
const _hash = (i, j) => { let h = (i * 374761393 + j * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function vnoise(x, z) {
  const i = Math.floor(x), j = Math.floor(z), u = x - i, v = z - j, su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
  const a = _hash(i, j), b = _hash(i + 1, j), c = _hash(i, j + 1), d = _hash(i + 1, j + 1);
  return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
}
// ridged noise: sharp crests, rounded valleys, 0..1
function ridged(x, z) {
  let s = 0, amp = 0.5, f = 1 / 260, w = 1;
  for (let o = 0; o < 4; o++) { const n = 1 - Math.abs(2 * vnoise(x * f + o * 17.3, z * f - o * 9.1) - 1), r = n * n * w; s += r * amp; w = Math.min(1, r * 2); amp *= 0.5; f *= 2.1; }
  return s;
}
// Spines: each peak joins its nearest neighbour nearer the sect by a ridge that sags to about two thirds of the lower top,
// so the ranges read as connected country you could cross, not islands in the cloud.
const _C = [24, -9];
export const FAR_SPINES = FAR_PEAKS.map((p, i) => {
  const dp = Math.hypot(p[0] - _C[0], p[1] - _C[1]); let best = null, bd = 1e9;
  FAR_PEAKS.forEach((q, k) => { if (k === i || Math.hypot(q[0] - _C[0], q[1] - _C[1]) >= dp) return; const d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = q; } });
  return best && bd < 700 ? [p, best] : null;
}).filter(Boolean);
let _stairFoot = 0; // the road's height where the Watch's stair begins, set once below
export function farHeight(x, z) {
  // foothill floor: low hills that climb gently from the sect's skirt out to the ranges
  const dc = Math.hypot(x - _C[0], z - _C[1]), rn = ridged(x, z);
  let h = -150 + Math.min(1, Math.max(0, (dc - 520) / 600)) * 110 + 60 * rn;
  for (const [px, pz, top, sl, sd] of FAR_PEAKS) {
    const d = Math.hypot(x - px, z - pz), R = (top + 150) / sl; if (d > R * 1.6) continue;
    const t = d / R, m = top - (top + 150) * Math.pow(t, 0.85) * (1.05 - 0.15 * Math.sin(Math.atan2(z - pz, x - px) * 3 + sd));
    h = Math.max(h, m - 70 * (1 - rn) * Math.min(1, t * 2.2));
  }
  for (const [a, b] of FAR_SPINES) {
    const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2)), d = Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz);
    const sag = Math.min(a[2], b[2]) * 0.62, crest = Math.max(a[2] * Math.pow(1 - t, 2), b[2] * t * t, sag);
    h = Math.max(h, crest - d * 0.7 - 50 * (1 - rn));
  }
  for (let i = 1; i < FAR_ROAD.length; i++) {
    const a = FAR_ROAD[i - 1], b = FAR_ROAD[i], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2)), d = Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz);
    const crest = a[2] + (b[2] - a[2]) * (t * t * (3 - 2 * t));
    h = Math.max(h, crest - Math.max(0, d - 6) * (0.55 + 0.4 * rn));
  }
  // Round 14d: the Watch's summit is a flat plinth top 9 m across, and its stair (far.js) climbs the last 20 m of the
  // road in a straight even pitch, so the avatar's feet follow the steps instead of the slope under them.
  { const a = FAR_ROAD[FAR_ROAD.length - 2], W = FAR_ROAD[FAR_ROAD.length - 1], dx = W[0] - a[0], dz = W[1] - a[1], D = Math.hypot(dx, dz);
    const dw = Math.hypot(x - W[0], z - W[1]); if (dw < 9.5) h = Math.max(h, W[2] + 0.1);
    const along = ((W[0] - x) * dx + (W[1] - z) * dz) / D, side = Math.abs(((x - W[0]) * dz - (z - W[1]) * dx) / D);
    if (side < 3 && along > 8 && along < 20) h = Math.max(h, _stairFoot + (W[2] + 0.1 - _stairFoot) * Math.min(1, (20 - along) / 11)); }
  return h;
}
export const FAR_EXTENT = 1900;
{ const a = FAR_ROAD[FAR_ROAD.length - 2], W = FAR_ROAD[FAR_ROAD.length - 1], D = Math.hypot(W[0] - a[0], W[1] - a[1]);
  _stairFoot = farHeight(W[0] - (W[0] - a[0]) * 20 / D, W[1] - (W[1] - a[1]) * 20 / D); }

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
  // round 20: the pilgrim stair's earthwork. Under the zigzag the ground is cut or filled to just below the treads and
  // landings, and beside them it banks off at about 1:0.3 (round 21: was 1:0.8, which left 7 m walls), so the stair sits in the hill instead of on stilts.
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = x0 + i * step, z = z0 + j * step, E = pilgrimEarth(x, z); if (!E.length) continue;
    // under a tread or landing the ground sits 0.45 m below it; beside one it keeps a shelf as wide as a grid cell (so the
    // ground between nodes stays under the treads) and then a cut bank; lower down, fill banks up to it
    const [fill, cut] = earthBand(E);
    H[j * nx + i] = Math.min(Math.max(H[j * nx + i], fill), cut);
}
}
export function heightAt(x, z) {
  if (!H) buildGrid();
  const { x0, z0, step, nx, nz } = GRID;
  if (x < x0 || z < z0 || x > x0 + (nx - 1) * step || z > z0 + (nz - 1) * step) return farHeight(x, z); // round 14b: the far region
  const fx = Math.min(nx - 1.001, Math.max(0, (x - x0) / step)), fz = Math.min(nz - 1.001, Math.max(0, (z - z0) / step));
  const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, a = j * nx + i;
  const g = (H[a] * (1 - u) + H[a + 1] * u) * (1 - v) + (H[a + nx] * (1 - u) + H[a + nx + 1] * u) * v;
  // round 22: near the stair the earthwork's band is applied at the exact point, not only at the 3 m nodes, so the
  // bank can hug the treads (shelf 0.6 m) without the interpolated ground rising through them
  if (x < _PB[0] || x > _PB[1] || z < _PB[2] || z > _PB[3]) return g;
  const E = pilgrimEarth(x, z); if (!E.length) return g;
  const [fill, cut] = earthBand(E); return Math.min(Math.max(g, fill), cut);
}
// round 22: the earthwork's band at a point: the ground may not stand below fill (a 1:0.3 bank up to the way) nor above
// cut (a bank of 1:4 beyond a 0.6 m shelf; round 21 left a 2.4 m shelf, which gave piers of 3 to 7 m under the flights)
function earthBand(E) { let fill = -1e9, cut = 1e9;
  for (const [d, y] of E) { fill = Math.max(fill, y - 0.45 - Math.max(0, d - 0.6) * 0.3); cut = Math.min(cut, y - 0.45 + Math.max(0, d - 0.6) * 4); }
  return [fill, cut]; }

// Round 20: Wendell answered cc-heaven-r19 C, "Make the stair gentle and zigzag". Round 19's one straight flight had
// 0.235 m risers. The gentle stair has 0.17 m risers on 0.28 m treads, sized to the cultivation figure's 0.62 m stride by
// the stair-maker's rule (two risers and a tread make one stride: 2 x 0.17 + 0.28 = 0.62), one step per tread. A
// gentle stair needs about 42 m of treads to climb the 25 m from the great court to the gate on the crest, and the ridge
// gives 29 m, so the way zigzags: four flights of 32 steps cross the slope at 69 degrees from the axis, turning on round
// landings, and a last straight flight of 20 steps climbs on the axis to the gate. Plan only (no heights read here):
// layout.js carves the ground to it and crag.js builds it.
export const PILGRIM = (() => {
  const LAND = AXIS[9], a = [P.great[0] + (LAND[0] - P.great[0]) * 0.5, P.great[1] + (LAND[1] - P.great[1]) * 0.5];
  const dx = LAND[0] - a[0], dz = LAND[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, nx = -uz, nz = ux;
  const W = ([u, v]) => [a[0] + ux * u + nx * v, a[1] + uz * u + nz * v];
  const T = 0.28, HW = 1.5, y0 = 25, yTop = AXIS_H[9] + 0.15, N = Math.round((yTop - y0) / 0.17), R = (yTop - y0) / N;
  const nD = 4, mLast = 20, ms = Array(nD).fill((N - mLast) / nD), u0 = -3, uTop = L - 5;
  let th = 1.1, rL = 2, rF = 2;
  const segs = () => ms.map((m, i) => (m - 1) * T + (i ? rL : 0) + (i < nD - 1 ? rL : rF));
  for (let it = 0; it < 80; it++) { rL = HW / Math.sin(Math.PI / 2 - th); rF = HW / Math.sin((Math.PI - th) / 2);
    const c = (uTop - (mLast - 1) * T - rF - u0) / segs().reduce((p, q) => p + q, 0); th = 0.5 * th + 0.5 * Math.acos(Math.min(1, c)); }
  const S = segs(); let lat = 0; S.forEach((s, i) => { lat += (i % 2 ? -1 : 1) * s * Math.sin(th); });
  const C = [[u0, -lat]]; S.forEach((s, i) => { const [cu, cv] = C[i]; C.push([cu + s * Math.cos(th), cv + (i % 2 ? -1 : 1) * s * Math.sin(th)]); });
  const corners = C.map(W), flights = [], landings = []; let y = y0;
  const ends = [...corners, W([uTop, 0])];
  for (let i = 0; i <= nD; i++) {
    const p = ends[i], q = ends[i + 1], ddx = q[0] - p[0], ddz = q[1] - p[1], Ls = Math.hypot(ddx, ddz), m = i < nD ? ms[i] : mLast;
    const s0 = i === 0 ? 0 : i < nD ? rL : rF;
    flights.push({ a: p, ux: ddx / Ls, uz: ddz / Ls, nx: -ddz / Ls, nz: ddx / Ls, s0, s1: s0 + (m - 1) * T, m, y: y, ry: -Math.atan2(ddz, ddx) });
    y += R * m;
    if (i < nD) landings.push({ x: q[0], z: q[1], y, r: i < nD - 1 ? rL : rF });
  }
  return { T, R, HW, N, th, flights, landings, foot: corners[0], top: ends[nD + 1], corners, axis: [ux, uz], yTop };
})();
// the way's elements near (x, z), as [distance outside the tread or landing, its top]; empty when none is within 24 m
export function pilgrimEarth(x, z) {
  const { T, R, HW, flights, landings } = PILGRIM, out = [];
  for (const f of flights) { const s = (x - f.a[0]) * f.ux + (z - f.a[1]) * f.uz, v = (x - f.a[0]) * f.nx + (z - f.a[1]) * f.nz;
    const sc = Math.max(f.s0, Math.min(f.s1, s)), k = Math.max(0, Math.min(f.m - 2, Math.floor((sc - f.s0) / T))), d = Math.hypot(s - sc, Math.max(0, Math.abs(v) - HW));
    if (d < 24) out.push([d, f.y + R * (k + 1)]); }
  for (const l of landings) { const d = Math.max(0, Math.hypot(x - l.x, z - l.z) - l.r); if (d < 24) out.push([d, l.y]); }
  return out;
}
const _PB = (() => { const { flights, landings } = PILGRIM; let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
  for (const f of flights) for (const p of [f.a, [f.a[0] + f.ux * f.s1, f.a[1] + f.uz * f.s1]]) { a = Math.min(a, p[0]); b = Math.max(b, p[0]); c = Math.min(c, p[1]); d = Math.max(d, p[1]); }
  for (const l of landings) { a = Math.min(a, l.x - l.r); b = Math.max(b, l.x + l.r); c = Math.min(c, l.z - l.r); d = Math.max(d, l.z + l.r); }
  return [a - 25, b + 25, c - 25, d + 25]; })();
