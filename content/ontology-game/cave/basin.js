// The basin: the body map's inside as a walkable place, entered by one mouth from home base (the WAVE room).
//
// Record: Six-faces-council, the map-of-access passes and Wendell's board of October 2026 (the mao- and mab- rows). It is a
// land, not a body: ridges, ledges, springs and watercourses, read at one look like a meridian field, with no organ drawn and
// no outline of a figure (mao-places-not-organs). Each seat is a spring (mab-seat-is-a-spring): the brow a wet seam, the throat
// a moving air, the solar plexus a hot vent, the dantian a stone basin, the crown a still pool, and the heart the low spring
// every other feeds. A seat shows its state as motion, never as an amount: at rest is still water, never an empty vessel
// (mao-access-not-fill). Every edge of organs.js is a watercourse on the ground; an unlit one is dry and mossy, but walked and
// arrived at like any other (mab-unlit-path-still-arrives, mao-closed-route-unlit). The brow's floor sets how far its light
// reaches (mab-floor-sets-reach): its seam runs, then the course to the crown runs, then the crown's pool answers once.
//
// The player arrives on the heart's ledge, the vantage every seat and every lit run is seen from (mab-heart-is-the-vantage),
// with the one mouth back to the room just behind it (mab-one-mouth). The verbs are walk, stand and trace, and no more
// (mab-walk-stand-trace): nothing here is collected, pressed open or used up, and nothing is given to the player.
//
// Needs cave/cave.js (window.__oagCave.kit) and cave/organs.js (window.__oagOrgans) on the page. The layout is the council's
// drawn study (scene.py), scaled up three times so the land fits one look from the heart's ledge on a phone.
(function () {
  "use strict";

  // ---- the words ------------------------------------------------------------------------------------------------------------
  // Every player-facing line lives here, so basin-copy-test.mjs can hold it to the stop list (B3): landscape words only, no digit,
  // no gauge or lock word, and no organ or system name (the heart's spring is "the low spring" on the page).
  var WORDS = {
    title: "The basin",
    arrive: "Inside. Every water here runs down to this spring.",
    howTo: "Tap the ground to walk. At a spring, tap another to see the water between; tap it again to go there.",
    mouth: "The way back to the room.",
    trace: "The water between here and there shows its way, then rests.",
    seats: {
      brow: { rest: "A seam, wet from the stone.", run1: "The seam runs. Light goes out along it.", run2: "The seam runs. A pale light goes out along the water to the high pool." },
      crown: { rest: "A still pool on the high ledge.", answered: "The pool holds the whole of the stone." },
      throat: { rest: "Moving air over a dry hollow." },
      solar: { rest: "A warm vent in the stone. The air above it wavers." },
      dantian: { rest: "A stone basin, holding still water." },
      heart: { rest: "The low spring. Every water here comes down to it." },
    },
    sr: { mouthLabel: "The way back to the room", stage: "The basin. Tap the ground to walk." },
  };

  var K = null, O = null;
  function kit() { K = window.__oagCave && window.__oagCave.kit; O = window.__oagOrgans; return !!(K && O); }

  // The seats on the land (x, z in metres): the study's layout times three, mirrored across so that, seen from the heart's ledge
  // looking toward the crown, the brow sits on the left as it does in the drawn study. The floor climbs toward the crown in three
  // ledges.
  var SCALE = 3;
  var STUDY = { brow: [-2.30, 2.70], throat: [0.75, 4.60], heart: [-0.45, 5.90], solar: [1.95, 6.50], dantian: [-1.70, 7.60], crown: [0.35, 9.70] };
  var SEAT_AT = {}; Object.keys(STUDY).forEach(function (k) { SEAT_AT[k] = { x: -STUDY[k][0] * SCALE, z: STUDY[k][1] * SCALE }; });
  // Each spring's hollow (its radius and depth in the ground) and where its water stands. The heart's is the largest and lowest.
  var SPRING = { brow: { r: 1.5, d: 0.25 }, throat: { r: 1.5, d: 0.3 }, solar: { r: 1.4, d: 0.2 }, dantian: { r: 1.6, d: 0.2 }, crown: { r: 2.2, d: 0.45 }, heart: { r: 3.4, d: 0.9 } };
  var POOL = { crown: 1.55, heart: 2.4 }; // the open water a figure walks round, not through
  // The heart's ledge, where the figure arrives, and the mouth just behind it.
  var LEDGE = { x: SEAT_AT.heart.x - 0.3, z: SEAT_AT.heart.z - 3.4 };
  var MOUTH = { x: SEAT_AT.heart.x - 1.0, z: SEAT_AT.heart.z - 6.6 }, MOUTH_R = 0.95;
  var LAND = { cx: 0.5, cz: 18.4, rx: 13.5, rz: 17.5 }; // the walkable ground, an ellipse inside the rim ridges
  var FIG_K = 0.6, WALK = 3.0, SEAT_REACH = 1.5;

  function smooth(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  // The three ledges: the brow's low one, the middle one the heart sits in, and the crown's high one.
  function ledgeY(z) { return 0.9 * smooth(10.2, 11.8, z) + 0.9 * smooth(25.6, 27.2, z); }

  // ---- the watercourses: the graph's edges as curves on the ground ----------------------------------------------------------
  // The cycle is not the ring the seats make round the heart, so its courses must bend to keep clear of each other and of the
  // springs. Each cycle course bows sideways by this share of its length (perpendicular to it, in the study's unmirrored frame),
  // found by a search over the study's layout for the fewest crossings (one is left) that keep every course off the other
  // springs and inside the land. A spoke runs straight down to the heart.
  var BOW = { "throat>solar": 0, "solar>dantian": -0.1, "dantian>brow": -0.1, "brow>crown": 0.3, "crown>throat": 0.6 };
  function courseOf(e) {
    var a = SEAT_AT[e.from], b = SEAT_AT[e.to], mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz);
    var px = -dz / L, pz = dx / L, bow = e.kind === "cycle" ? -(BOW[e.from + ">" + e.to] || 0) * L : 0; // minus: the land is the study mirrored
    var cx = mx + px * bow * 2, cz = mz + pz * bow * 2, pts = [], N = Math.max(24, Math.round(L * 5));
    var r0 = SPRING[e.from].r * 0.75, r1 = SPRING[e.to].r * (e.to === "heart" ? 0.8 : 0.75);
    for (var i = 0; i <= N; i++) {
      var t = i / N, u = 1 - t, x = u * u * a.x + 2 * u * t * cx + t * t * b.x, z = u * u * a.z + 2 * u * t * cz + t * t * b.z;
      if (Math.hypot(x - a.x, z - a.z) < r0 || Math.hypot(x - b.x, z - b.z) < r1) continue; // the course starts at the spring's edge
      pts.push({ x: x, z: z });
    }
    return pts;
  }
  var COURSES = null; // [{ from, to, kind, pts }]
  function courses() {
    if (COURSES) return COURSES;
    COURSES = O.EDGES.map(function (e) { return { from: e.from, to: e.to, kind: e.kind, pts: courseOf(e) }; });
    return COURSES;
  }
  function distToCourse(c, x, z) {
    var best = Infinity, p = c.pts;
    for (var i = 1; i < p.length; i++) {
      var ax = p[i - 1].x, az = p[i - 1].z, bx = p[i].x - ax, bz = p[i].z - az, l2 = bx * bx + bz * bz || 1e-6;
      var t = Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / l2)), d = Math.hypot(x - ax - bx * t, z - az - bz * t);
      if (d < best) best = d;
    }
    return best;
  }

  // ---- the ground ---------------------------------------------------------------------------------------------------------
  // Height without the carving: the ledges, a rim of ridges where the land ends, and long low swells (a choice, kept gentle).
  function baseY(x, z) {
    var ex = (x - LAND.cx) / LAND.rx, ez = (z - LAND.cz) / LAND.rz, e = Math.hypot(ex, ez);
    var rim = 5.5 * smooth(0.92, 1.35, e) * (0.75 + 0.25 * Math.sin(x * 0.7 + z * 0.3));
    var swell = 0.18 * Math.sin(x * 0.45 + 1.3) * Math.sin(z * 0.38 + 0.4) + 0.08 * Math.sin(x * 1.3 - z * 0.9);
    return ledgeY(z) + rim + swell;
  }
  function springY(k) { var s = SEAT_AT[k]; return baseY(s.x, s.z); }
  // The ground as walked: the hollows of the springs and the beds of the courses carved into it, and the heart's ledge raised.
  function groundY(x, z) {
    var y = baseY(x, z);
    Object.keys(SPRING).forEach(function (k) {
      var s = SEAT_AT[k], r = Math.hypot(x - s.x, z - s.z) / SPRING[k].r; if (r < 1) { var q = 1 - r * r; y -= SPRING[k].d * q * q; }
    });
    var lr = Math.hypot(x - LEDGE.x, z - LEDGE.z) / 2.2; if (lr < 1) y += 0.28 * (1 - lr * lr);
    var cut = 0; courses().forEach(function (c) { var d = distToCourse(c, x, z); if (d < 0.9) cut = Math.max(cut, 1 - d / 0.9); });
    return y - 0.16 * cut * cut;
  }

  // ---- the rock ---------------------------------------------------------------------------------------------------------------
  // Wendell carried the council's rock study into the game (cb-material-look-5, 2026-10-31: "Carry this into the game"). The
  // study is Six-faces-council council/callsheets/stills/2026-10-31-bodymap-rock-1/ (make/rocks.py); its forms are ported here at
  // the game's scale. A rock is an icosphere pushed out by three octaves of noise (the lump), then split by planes (where a rock
  // broke, it is flat), its foot flat and sunk into the ground. The rim's ridge carries broken wall: a spire, a shorter one leaning
  // on it, a boulder at its foot and rubble round it. Each pool is ringed by rock, open where a watercourse comes in, with rubble
  // outside the ring; the crown has a split standing stone; pebbles lie on the floor, off the courses; crystal clusters grow at the
  // far and side spires and light the rock behind them violet; a lantern stands by the crown's pool. All of it is fixed by one seed.
  var ROCK_SEED = 20261032, ROCK_AO_FOOT = 0.42;
  // The light's numbers, set in a browser against the basin's floor (body-map-basin in the council's council/look/floors.json).
  var ROCK_TINT = [0.80, 0.76, 1.0], LAND_TILE = 1.9;
  var EXPOSURE = 1.0, HAZE = 0.021, HEMI_I = 0.3, KEY_I = 0.45, LAMP_I = 4.0, LAMP_REACH = 14, CRYSTAL_I = 2.6, LANTERN_I = 3.4;
  var LANTERN_AT = { x: -1.55 * SCALE, z: 9.05 * SCALE };
  function rockField() {
    var rnd = window.__oagCave.kit.rngOf(ROCK_SEED), R = function (a, b) { return a + (b - a) * rnd(); }, pick = function (a) { return a[Math.floor(rnd() * a.length)]; };
    var stones = [], crystals = [], stamps = [];
    function stone(x, z, rx, ry, rz, o) {
      o = o || {}; var s = { x: x, z: z, rx: rx, ry: ry, rz: rz, yaw: R(0, Math.PI), sub: o.sub == null ? 1 : o.sub, cleaves: o.cleaves || 2, vertical: !!o.vertical,
        taper: o.taper || 0, sink: o.sink == null ? 0.25 : o.sink, amp: o.amp || 0.16, freq: o.freq || 2.4, tone: o.tone || pick([0.8, 0.9, 1.0, 1.08]), seed: Math.floor(rnd() * 1e9) };
      stones.push(s); if (Math.max(rx, rz) > 0.3) stamps.push({ x: x, z: z, r: Math.max(rx, rz) }); return s;
    }
    var nearCourse = function (x, z, gap) { return courses().some(function (c) { return distToCourse(c, x, z) < gap; }); };
    var nearSpring = function (x, z, k) { return Object.keys(SPRING).some(function (s) { return Math.hypot(x - SEAT_AT[s].x, z - SEAT_AT[s].z) < SPRING[s].r * k + (POOL[s] || 0) * 0.4; }); };
    // the rim: fifteen spires on the ridge where the land ends, none on the near arc between the camera and the heart's ledge
    for (var i = 0; i < 15; i++) {
      var ang = 2 * Math.PI * i / 15 + R(-0.12, 0.12), e = R(1.0, 1.12), x = LAND.cx + Math.cos(ang) * LAND.rx * e, z = LAND.cz + Math.sin(ang) * LAND.rz * e;
      if (Math.sin(ang) < -0.55) continue;
      var h = R(1.4, 2.8) * SCALE, r = R(0.5, 1.15) * SCALE, tx = LAND.cx - x, tz = LAND.cz - z, m = Math.hypot(tx, tz) || 1; tx /= m; tz /= m;
      stone(x, z, r * 0.8, h * 0.56, r * 0.7, { sub: 2, cleaves: 6, vertical: true, taper: 0.3, sink: 0.12, amp: 0.22, freq: 3.0 });
      stone(x - tz * r * pick([-0.9, 0.9]), z + tx * r * R(-0.2, 0.2), r * 0.55, h * R(0.25, 0.4), r * 0.5, { sub: 2, cleaves: 5, vertical: true, taper: 0.25, sink: 0.12, amp: 0.22, freq: 3.0 });
      for (var b = pick([1, 2]); b > 0; b--) { var off = r * R(0.75, 1.05), sd = R(-0.9, 0.9), s_ = r * R(0.45, 0.75); stone(x + tx * off - tz * sd * r, z + tz * off + tx * sd * r, s_, s_ * R(0.6, 0.9), s_ * R(0.7, 1.0), { sub: 2, cleaves: 4, amp: 0.2, freq: 3.0 }); }
      for (var q = 3 + Math.floor(rnd() * 4); q > 0; q--) { var o2 = r * R(1.0, 1.9), sd2 = R(-1.4, 1.4), s2 = R(0.07, 0.18) * SCALE; stone(x + tx * o2 - tz * sd2 * r, z + tz * o2 + tx * sd2 * r, s2, s2 * 0.7, s2 * R(0.7, 1.1), { sink: 0.2 }); }
      if (Math.sin(ang) > -0.1 && (i % 2 === 0)) crystals.push({ x: x + tx * r * 0.8, z: z + tz * r * 0.8, tx: tx, tz: tz });
    }
    // the springs: a ring of rock round each, open where a course comes in, and rubble outside it
    Object.keys(SPRING).forEach(function (k) {
      var c = SEAT_AT[k], rr = (POOL[k] ? POOL[k] + 0.55 : SPRING[k].r * 0.95), mouths = [];
      courses().forEach(function (cc) { cc.pts.forEach(function (p) { var d = Math.hypot(p.x - c.x, p.z - c.z); if (d < rr * 1.6) mouths.push(Math.atan2(p.z - c.z, p.x - c.x)); }); });
      if (k === "heart") mouths.push(Math.atan2(LEDGE.z - c.z, LEDGE.x - c.x)); // the figure's way down to its own spring
      var n = Math.max(8, Math.round(rr * 2 * Math.PI / 0.85));
      for (var j = 0; j < n; j++) {
        var a = 2 * Math.PI * j / n + R(-0.12, 0.12);
        if (mouths.some(function (mo) { return Math.abs(((a - mo + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.42; })) continue;
        var rad = rr * R(0.98, 1.12), s3 = R(0.26, 0.48) * R(0.75, 1.25);
        stone(c.x + Math.cos(a) * rad, c.z + Math.sin(a) * rad, s3, s3 * R(0.55, 0.85), s3 * 0.85, { sink: 0.3 });
      }
      for (var p2 = Math.round(14 + 6 * rr); p2 > 0; p2--) {
        var a2 = R(0, 2 * Math.PI), rad2 = rr * R(1.25, 2.0), px = c.x + Math.cos(a2) * rad2, pz = c.z + Math.sin(a2) * rad2;
        if (nearCourse(px, pz, 0.5)) continue;
        var s4 = R(0.1, 0.36); stone(px, pz, s4, s4 * 0.7, s4, { sink: 0.25 });
      }
    });
    // the crown's standing stone, split rock, on the far side of its pool from the heart
    var cr = SEAT_AT.crown, hd = Math.hypot(cr.x - SEAT_AT.heart.x, cr.z - SEAT_AT.heart.z), ux = (cr.x - SEAT_AT.heart.x) / hd, uz = (cr.z - SEAT_AT.heart.z) / hd;
    stone(cr.x + ux * (POOL.crown + 1.5), cr.z + uz * (POOL.crown + 1.5), 1.2, 2.46, 0.78, { sub: 2, cleaves: 3, vertical: true, taper: 0.3, sink: 0.08, amp: 0.12, tone: 1.12 });
    // pebbles on the walked floor, off the courses and the springs, and a few boulders toward the walls
    for (var pb = 0; pb < 420; pb++) {
      var bx = R(-0.95, 0.95) * LAND.rx + LAND.cx, bz = R(-0.95, 0.95) * LAND.rz + LAND.cz;
      if (Math.hypot((bx - LAND.cx) / LAND.rx, (bz - LAND.cz) / LAND.rz) > 0.95 || nearSpring(bx, bz, 1.2) || nearCourse(bx, bz, 0.6) || Math.hypot(bx - MOUTH.x, bz - MOUTH.z) < 2.2) continue;
      var s5 = R(0.1, 0.32); stone(bx, bz, s5, s5 * 0.65, s5 * R(0.7, 1.2), { sub: pick([0, 1]), cleaves: 1, sink: 0.25 });
    }
    for (var bd = 0; bd < 16; bd++) {
      var ea = R(0, 2 * Math.PI), ee = R(0.72, 0.9), wx = LAND.cx + Math.cos(ea) * LAND.rx * ee, wz = LAND.cz + Math.sin(ea) * LAND.rz * ee;
      if (Math.sin(ea) < -0.5 || nearSpring(wx, wz, 1.6) || nearCourse(wx, wz, 1.2)) continue;
      var s6 = R(0.55, 1.0); stone(wx, wz, s6, s6 * 0.7, s6 * 0.9, { sub: 2, cleaves: 3 });
    }
    // the mouth back to the room sits in a low lip of rock
    [[-1.6, 0.9, 0.7], [1.7, 0.5, 0.55], [0.2, -1.5, 0.8], [-1.0, -1.1, 0.5]].forEach(function (q) { stone(MOUTH.x + q[0], MOUTH.z + q[1], q[2], q[2] * 0.9, q[2] * 0.85, { sub: 2, cleaves: 3 }); });
    stamps.push({ x: LANTERN_AT.x, z: LANTERN_AT.z, r: 0.45 });
    return { stones: stones, crystals: crystals, stamps: stamps, rnd: rnd };
  }
  // A shade on the ground round a rock's foot, as a factor on the land's colour.
  function footShade(stamps, x, z) {
    var g = 0; for (var i = 0; i < stamps.length; i++) { var s = stamps[i], dx = x - s.x, dz = z - s.z, w = 1.25 * s.r; if (Math.abs(dx) < 3 * s.r && Math.abs(dz) < 3 * s.r) g += 0.55 * Math.exp(-(dx * dx + dz * dz) / (w * w)); }
    return 1 - Math.min(0.62, g);
  }
  // One rock's triangles, in place, appended to out (positions, colours, uvs). The tile goes on by the face's own axis, so a steep
  // face takes the stone's grain and not a stretched stripe (what the study still showed).
  var ICO = {};
  function rockInto(THREE, s, out) {
    var det = s.sub === 2 ? 3 : s.sub, base = ICO[det] || (ICO[det] = new THREE.IcosahedronGeometry(1, det).attributes.position.array);
    var rnd = window.__oagCave.kit.rngOf(s.seed), gauss = function () { return Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd()); };
    var K3 = [], ph = [];
    for (var o = 0; o < 3; o++) { var f = s.freq * Math.pow(2, o); K3.push([gauss() * f, gauss() * f, gauss() * f]); ph.push(rnd() * Math.PI * 2); }
    var planes = [];
    for (var c = 0; c < s.cleaves; c++) {
      var m = [gauss(), gauss(), gauss()]; if (s.vertical) m[1] *= 0.25; else m[1] = Math.abs(m[1]) * 0.8;
      var ml = Math.hypot(m[0], m[1], m[2]) || 1; planes.push([m[0] / ml, m[1] / ml, m[2] / ml, 0.5 + 0.32 * rnd()]);
    }
    // the foot stands on the lowest ground under it, so a rock on the rim's slope is buried uphill, never floating downhill
    var cy = Math.cos(s.yaw), sy = Math.sin(s.yaw), rr = Math.max(s.rx, s.rz) * 0.8, low = groundY(s.x, s.z);
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (q) { low = Math.min(low, groundY(s.x + q[0] * rr, s.z + q[1] * rr)); });
    var gy = low + 0.72 * s.ry - s.sink * s.ry;
    var n = base.length / 3, P = new Float32Array(base.length), FOOT = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2], d = 0;
      for (o = 0; o < 3; o++) d += [1, 0.5, 0.25][o] * Math.sin(x * K3[o][0] + y * K3[o][1] + z * K3[o][2] + ph[o]);
      var k = 1 + s.amp * d; x *= k; y *= k; z *= k;
      planes.forEach(function (pl) { var dd = x * pl[0] + y * pl[1] + z * pl[2] - pl[3]; if (dd > 0) { x -= dd * pl[0]; y -= dd * pl[1]; z -= dd * pl[2]; } });
      if (y < -0.72) y = -0.72;
      var yn = Math.max(0, Math.min(1, (y + 0.72) / 1.72)); FOOT[i] = yn;
      if (s.taper) { x *= 1 - s.taper * yn; z *= 1 - s.taper * yn; }
      x *= s.rx; y *= s.ry; z *= s.rz;
      P[i * 3] = s.x + x * cy - z * sy; P[i * 3 + 1] = gy + y; P[i * 3 + 2] = s.z + x * sy + z * cy;
    }
    for (var t = 0; t < n; t += 3) {
      var ax = P[t * 3], ay = P[t * 3 + 1], az = P[t * 3 + 2], e1 = [P[t * 3 + 3] - ax, P[t * 3 + 4] - ay, P[t * 3 + 5] - az], e2 = [P[t * 3 + 6] - ax, P[t * 3 + 7] - ay, P[t * 3 + 8] - az];
      var nx = Math.abs(e1[1] * e2[2] - e1[2] * e2[1]), ny = Math.abs(e1[2] * e2[0] - e1[0] * e2[2]), nz = Math.abs(e1[0] * e2[1] - e1[1] * e2[0]);
      for (var v = 0; v < 3; v++) {
        var vi = t + v, px = P[vi * 3], py = P[vi * 3 + 1], pz = P[vi * 3 + 2];
        out.p.push(px, py, pz);
        if (ny >= nx && ny >= nz) out.u.push(px / 3.2, pz / 3.2); else if (nx >= nz) out.u.push(pz / 3.2, py / 3.2); else out.u.push(px / 3.2, py / 3.2);
        var tone = s.tone * (ROCK_AO_FOOT + (1 - ROCK_AO_FOOT) * FOOT[vi]); out.c.push(tone * ROCK_TINT[0], tone * ROCK_TINT[1], tone * ROCK_TINT[2]);
      }
    }
  }
  // One six-sided crystal growing from base along dir, with a pointed tip (the study's crystal()).
  function crystalInto(base, dir, len, rad, out) {
    var dl = Math.hypot(dir[0], dir[1], dir[2]), d = [dir[0] / dl, dir[1] / dl, dir[2] / dl];
    var up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], a = [d[1] * up[2] - d[2] * up[1], d[2] * up[0] - d[0] * up[2], d[0] * up[1] - d[1] * up[0]], al = Math.hypot(a[0], a[1], a[2]);
    a = [a[0] / al, a[1] / al, a[2] / al]; var b = [d[1] * a[2] - d[2] * a[1], d[2] * a[0] - d[0] * a[2], d[0] * a[1] - d[1] * a[0]];
    var p0 = [base[0] - d[0] * rad, base[1] - d[1] * rad, base[2] - d[2] * rad], p1 = [p0[0] + d[0] * len, p0[1] + d[1] * len, p0[2] + d[2] * len], tip = [p1[0] + d[0] * rad * 2.2, p1[1] + d[1] * rad * 2.2, p1[2] + d[2] * rad * 2.2];
    var lo = [], hi = [];
    for (var k = 0; k < 6; k++) { var cx = Math.cos(Math.PI * k / 3 + 0.3), cz = Math.sin(Math.PI * k / 3 + 0.3); lo.push([0, 1, 2].map(function (j) { return p0[j] + (a[j] * cx + b[j] * cz) * rad; })); hi.push([0, 1, 2].map(function (j) { return p1[j] + (a[j] * cx + b[j] * cz) * rad * 0.92; })); }
    for (k = 0; k < 6; k++) { var j2 = (k + 1) % 6; [[lo[k], lo[j2], hi[j2]], [lo[k], hi[j2], hi[k]], [hi[k], hi[j2], tip]].forEach(function (tr) { tr.forEach(function (pt) { out.push(pt[0], pt[1], pt[2]); }); }); }
  }
  // A soft round glow, for the halo a bright thing bleeds into the air round it.
  function haloTexture(THREE) {
    var cv = document.createElement("canvas"); cv.width = cv.height = 64; var g = cv.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.45)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
  }

  // ---- the page ---------------------------------------------------------------------------------------------------------------
  var CSS = ".oagb{z-index:950}.oagb-line{position:absolute;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);max-width:min(420px,calc(100vw - 32px));" +
    "padding:.5rem .8rem;background:rgba(12,12,24,.72);border:1px solid rgba(220,230,255,.35);border-radius:12px;color:#eef0f8;font-size:15px;line-height:1.35;text-align:center;" +
    "pointer-events:none;transition:opacity .6s;z-index:3}.oagb-line[hidden]{display:block;opacity:0}.oagb-how{position:absolute;left:50%;top:calc(14px + env(safe-area-inset-top));transform:translateX(-50%);" +
    "color:#c8cce0;font-size:13px;opacity:.85;pointer-events:none;transition:opacity 1.2s;width:max-content;max-width:calc(100vw - 32px);text-align:center;z-index:3}";

  var api = { open: open, state: function () { return snapshot ? snapshot() : { open: false }; }, walkTo: function (id, o) { return walkToSeat ? walkToSeat(id, o) : false; },
    screenOf: function (id) { return screenOfSeat ? screenOfSeat(id) : null; }, WORDS: WORDS, SEAT_AT: SEAT_AT };
  var snapshot = null, walkToSeat = null, screenOfSeat = null; // the last two are for the browser test only

  function open(o) {
    o = o || {};
    if (!kit()) { if (o.back) o.back(); return; }
    if (snapshot && snapshot().open) return; // one basin at a time
    var el = K.el;
    if (!document.getElementById("oagc-css")) document.head.appendChild(el("style", { id: "oagc-css", text: K.CSS }));
    if (!document.getElementById("oagb-css")) document.head.appendChild(el("style", { id: "oagb-css", text: CSS }));
    K.guardPage();
    var wrap = el("div", { class: "oagc oagb", "data-basin": "" });
    var stage = el("div", { class: "oagc-stage", "aria-label": WORDS.sr.stage, role: "img" }), fade = el("div", { class: "oagc-fade" });
    var line = el("div", { class: "oagb-line", "data-basin-line": "" });
    var how = el("div", { class: "oagb-how", "data-basin-how": "", text: WORDS.howTo });
    var sr = el("div", { class: "oagc-sr", "data-basin-text": "", "aria-live": "polite" });
    var mouthBtn = el("div", { class: "oagc-sr", "data-basin-mouth": "", text: WORDS.sr.mouthLabel }); // read, not pressed: the mouth is walked into
    [stage, line, how, sr, mouthBtn, fade].forEach(function (n) { wrap.appendChild(n); });
    wrap.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    document.body.appendChild(wrap);
    fade.style.opacity = 1; setTimeout(function () { fade.style.opacity = 0; }, 30);
    var B = { open: true, at: "heart", answered: false, answerT: -1, trace: [], said: "", leaving: false, seen: 0 };
    var runs = { brow: O.runOf(O.store.get(), "brow") };
    wrap.setAttribute("data-basin-at", "heart"); // the arrival line stands for the heart's own until the figure walks off
    wrap.setAttribute("data-basin-runs", String(runs.brow ? "lit" : "rest")); // a word, not a number: the page carries no digit
    snapshot = function () {
      return { open: B.open, at: B.at, runs: { brow: runs.brow }, answered: B.answered, seats: O.SEATS.map(function (s) { return s.id; }),
        edges: O.EDGES.map(function (e) { return { from: e.from, to: e.to, kind: e.kind }; }), figure: fig ? { x: fig.x, z: fig.z } : null, tracing: B.trace.map(function (t) { return t.c.from + ">" + t.c.to; }) };
    };
    var fig = null;
    function say(text, toPane) {
      if (B.said === text) return; B.said = text;
      sr.textContent = text;
      if (toPane !== false) { line.textContent = text; line.hidden = !text; }
    }

    K.loadThree().then(build).catch(function () { say(WORDS.arrive); });

    function build(THREE) {
      var renderer = null;
      try { renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); stage.appendChild(renderer.domElement); }
      catch (e) { renderer = null; } // no WebGL: the words still come
      if (renderer) K.holdArea(renderer.domElement);
      if (renderer) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = EXPOSURE; }
      // The study's air (cb-material-look-3, his A, "Aim at the direction frames"): no roof, the dark above the rim falls to near
      // black, and the far rim sinks into a lilac haze lighter than that dark, so the rock stands in layers. The study's haze
      // density per study unit, over the game's three.
      var scene = new THREE.Scene(); scene.background = new THREE.Color(0x0c0a12); scene.fog = new THREE.FogExp2(0x26203a, HAZE);
      var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
      var rock = K.stoneOf(THREE, null, 0x5a5068); // the springs' own stone (the bowl, the vent, the slab, the lip), as cool as the rock round them
      // the land and every rock on it: the cave's wet stone (the study's floor and wall tile), shaded by vertex
      var ground = K.stoneOf(THREE, null, 0x6a5c54); ground.vertexColors = true; ground.side = THREE.FrontSide; ground.flatShading = false; ground.needsUpdate = true;
      K.loadTiles(THREE).then(function (tiles) { K.tileStone(rock, tiles); K.tileStone(ground, tiles); }); // the cave's own stone, once its tiles are in
      var RF = rockField();

      // The land: one sheet of the cave's dry stone, lifted into ledges and rims, the hollows and beds carved in, and tinted by
      // vertex: ridges paler, hollows darker, the course beds mossy (dry, but never darker than readable).
      var SX = 2 * (LAND.rx + 8), SZ = 2 * (LAND.rz + 8), NX = 110, NZ = 130;
      var geo = new THREE.PlaneGeometry(SX, SZ, NX, NZ); geo.rotateX(-Math.PI / 2); geo.translate(LAND.cx, 0, LAND.cz);
      var pos = geo.attributes.position, uv = geo.attributes.uv, col = new Float32Array(pos.count * 3);
      var moss = new THREE.Color(0x5f6e52), pale = new THREE.Color(0xc4bce0), deep = new THREE.Color(0x4e4668), base = new THREE.Color(0x9a90b8), c = new THREE.Color();
      for (var i = 0; i < pos.count; i++) {
        var x = pos.getX(i), z = pos.getZ(i), y = groundY(x, z), b = baseY(x, z);
        pos.setY(i, y); uv.setXY(i, x / LAND_TILE, z / LAND_TILE);
        var near = Infinity; courses().forEach(function (cc) { near = Math.min(near, distToCourse(cc, x, z)); });
        c.copy(base).lerp(pale, Math.max(0, Math.min(1, (y - ledgeY(z)) / 3)) * 0.6).lerp(deep, Math.max(0, Math.min(1, (b - y) * 1.2)) * 0.7);
        if (near < 0.75) c.lerp(moss, 0.35 * (1 - near / 0.75));
        c.multiplyScalar(footShade(RF.stamps, x, z)); // darker where a rock stands on it
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
      var land = new THREE.Mesh(geo, ground); scene.add(land);

      // ---- the rock: every stone of the field as one mesh, the crystals as another, the lantern by the crown's pool ------------
      var RK = { p: [], u: [], c: [] };
      RF.stones.forEach(function (s0) { rockInto(THREE, s0, RK); });
      var rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.Float32BufferAttribute(RK.p, 3)); rg.setAttribute("uv", new THREE.Float32BufferAttribute(RK.u, 2));
      rg.setAttribute("color", new THREE.Float32BufferAttribute(RK.c, 3)); rg.computeVertexNormals();
      var rocks = new THREE.Mesh(rg, ground); scene.add(rocks);
      var CP = [], halo = haloTexture(THREE), violet = 0x8f84ff;
      RF.crystals.forEach(function (cs) {
        var y = groundY(cs.x, cs.z), rr = RF.rnd;
        for (var q = 4 + Math.floor(rr() * 4); q > 0; q--) crystalInto([cs.x + (rr() - 0.5) * 1.1, y - 0.05, cs.z + (rr() - 0.5) * 1.1], [cs.tx * (0.1 + rr() * 0.5) + (rr() - 0.5) * 0.8, 1, cs.tz * (0.1 + rr() * 0.5) + (rr() - 0.5) * 0.8], (0.22 + rr() * 0.4) * SCALE, (0.035 + rr() * 0.04) * SCALE, CP);
        var cl = new THREE.PointLight(violet, CRYSTAL_I, 15, K.LAMP.decay); cl.position.set(cs.x + cs.tx * 1.0, y + 1.2, cs.z + cs.tz * 1.0); scene.add(cl);
        var hs = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: 0x9a8cff, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
        hs.position.set(cs.x, y + 1.0, cs.z); hs.scale.setScalar(4.5); scene.add(hs);
      });
      var cg = new THREE.BufferGeometry(); cg.setAttribute("position", new THREE.Float32BufferAttribute(CP, 3)); cg.computeVertexNormals();
      scene.add(new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ color: violet, emissive: violet, emissiveIntensity: 0.75, roughness: 0.25, flatShading: true, side: THREE.DoubleSide })));
      // the lantern set down by the crown's pool: a stone foot, four posts, a cap, a lit core; warm, and lighting the far side
      var lan = new THREE.Group(), iron = new THREE.MeshStandardMaterial({ color: 0x1e1a1e, roughness: 0.8 }), LS = 1.15 * SCALE * 0.9;
      function bx(px, py, pz, hx, hy, hz, mat) { var b0 = new THREE.Mesh(new THREE.BoxGeometry(hx * 2, hy * 2, hz * 2), mat); b0.position.set(px, py, pz); lan.add(b0); }
      bx(0, 0.02, 0, 0.11, 0.03, 0.11, iron); [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(function (q) { bx(q[0] * 0.085, 0.2, q[1] * 0.085, 0.012, 0.16, 0.012, iron); });
      bx(0, 0.375, 0, 0.115, 0.018, 0.115, iron);
      var lcap = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.09, 4), iron); lcap.position.y = 0.435; lcap.rotation.y = Math.PI / 4; lan.add(lcap);
      bx(0, 0.2, 0, 0.07, 0.13, 0.07, new THREE.MeshBasicMaterial({ color: 0xffc480 }));
      var lgy = groundY(LANTERN_AT.x, LANTERN_AT.z); lan.scale.setScalar(LS); lan.position.set(LANTERN_AT.x, lgy, LANTERN_AT.z); lan.rotation.y = 0.4; scene.add(lan);
      var lantern = new THREE.PointLight(0xffe0b0, LANTERN_I, 20, K.LAMP.decay); lantern.position.set(LANTERN_AT.x, lgy + 0.3 * LS, LANTERN_AT.z); scene.add(lantern);
      var lh = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: 0xffc890, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      lh.position.copy(lantern.position); lh.scale.setScalar(2.6); scene.add(lh);

      // ---- the springs ----------------------------------------------------------------------------------------------------------
      var still = new THREE.MeshStandardMaterial({ color: 0x2c4256, roughness: 0.12, metalness: 0.25, emissive: 0x0e1a26, emissiveIntensity: 0.6 });
      function water(k, r) { var m = new THREE.Mesh(new THREE.CircleGeometry(r, 48), still); m.rotation.x = -Math.PI / 2; m.position.set(SEAT_AT[k].x, springY(k) - 0.12, SEAT_AT[k].z); scene.add(m); return m; }
      var S = {};
      // the heart: the low spring, the largest, its stones round the rim
      S.heart = water("heart", POOL.heart + 0.4);
      // the crown: a still pool on the high ledge; at the third floor it answers once, a ripple and a held line of light
      S.crown = water("crown", POOL.crown + 0.3);
      var cr = SEAT_AT.crown, cy = springY("crown") - 0.1;
      var ripple = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 64), new THREE.MeshBasicMaterial({ color: 0xe8eeff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
      ripple.rotation.x = -Math.PI / 2; ripple.position.set(cr.x, cy, cr.z); ripple.visible = false; scene.add(ripple);
      var held = new THREE.Mesh(new THREE.PlaneGeometry(POOL.crown * 1.8, 0.09), new THREE.MeshBasicMaterial({ color: 0xfff6dc, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      held.rotation.x = -Math.PI / 2; held.position.set(cr.x, cy + 0.01, cr.z); scene.add(held);
      var heldGlow = new THREE.Mesh(new THREE.PlaneGeometry(POOL.crown * 1.9, 0.5), new THREE.MeshBasicMaterial({ color: 0xbfd0ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      heldGlow.rotation.x = -Math.PI / 2; heldGlow.position.set(cr.x, cy + 0.005, cr.z); scene.add(heldGlow);
      var crownLight = new THREE.PointLight(0xdfe6ff, 0, 9, K.LAMP.decay); crownLight.position.set(cr.x, cy + 1.6, cr.z); scene.add(crownLight);
      // the dantian: a stone basin holding still water
      var dn = SEAT_AT.dantian, dy = groundY(dn.x, dn.z);
      var bowl = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.01, 0), new THREE.Vector2(0.9, 0.02), new THREE.Vector2(1.15, 0.25), new THREE.Vector2(1.2, 0.5), new THREE.Vector2(1.0, 0.52), new THREE.Vector2(0.85, 0.3)], 28), rock);
      bowl.position.set(dn.x, dy - 0.05, dn.z); scene.add(bowl);
      var bowlWater = new THREE.Mesh(new THREE.CircleGeometry(0.98, 32), still); bowlWater.rotation.x = -Math.PI / 2; bowlWater.position.set(dn.x, dy + 0.38, dn.z); scene.add(bowlWater);
      // the solar plexus: a hot vent, a low cone of stone with a warm throat and the air over it wavering
      var so = SEAT_AT.solar, sy0 = groundY(so.x, so.z);
      var vent = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 1.0, 0.55, 18, 1, true), rock); vent.position.set(so.x, sy0 + 0.22, so.z); scene.add(vent);
      var ventCore = new THREE.Mesh(new THREE.CircleGeometry(0.36, 20), new THREE.MeshBasicMaterial({ color: 0x7a3418 })); ventCore.rotation.x = -Math.PI / 2; ventCore.position.set(so.x, sy0 + 0.46, so.z); scene.add(ventCore);
      var shimmer = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.2), new THREE.MeshBasicMaterial({ map: shimmerTex(THREE), color: 0xffa060, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      shimmer.position.set(so.x, sy0 + 1.6, so.z); scene.add(shimmer);
      var ventLight = new THREE.PointLight(0xff9050, 0.35, 5, K.LAMP.decay); ventLight.position.set(so.x, sy0 + 0.9, so.z); scene.add(ventLight);
      // the throat: moving air over a dry hollow, faint motes drifting
      var th = SEAT_AT.throat, ty = groundY(th.x, th.z), MN = 36, moteBase = [], motePos = new Float32Array(MN * 3);
      for (var m = 0; m < MN; m++) moteBase.push({ a: m * 2.399, r: 0.3 + 1.0 * ((m * 37) % 11) / 11, y: 0.3 + 1.9 * ((m * 53) % 17) / 17, v: 0.5 + ((m * 29) % 7) / 10 });
      var moteGeo = new THREE.BufferGeometry(); moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
      var motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({ color: 0xe8f0d8, size: 0.09, transparent: true, opacity: 0.7, depthWrite: false })); motes.position.set(th.x, ty, th.z); scene.add(motes);
      // the brow: a wet seam across a low slab; at the first floor it runs with light and moves
      var bw = SEAT_AT.brow, by = groundY(bw.x, bw.z), seamYaw = 0.5;
      var slab = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.35, 1.3), rock); slab.position.set(bw.x, by + 0.08, bw.z); slab.rotation.y = seamYaw; scene.add(slab);
      var seamWet = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 0.16), new THREE.MeshStandardMaterial({ color: 0x1e2c38, roughness: 0.05, metalness: 0.4, emissive: 0x0c1620, emissiveIntensity: 0.8 }));
      seamWet.rotation.x = -Math.PI / 2; seamWet.rotation.z = seamYaw; seamWet.position.set(bw.x, by + 0.26, bw.z); scene.add(seamWet);
      var flowTex = flowTexture(THREE);
      var seamRun = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 0.2), new THREE.MeshBasicMaterial({ map: flowTex.clone(), color: 0xdfe8ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      seamRun.material.map.needsUpdate = true; seamRun.material.map.wrapS = seamRun.material.map.wrapT = THREE.RepeatWrapping; seamRun.material.map.rotation = Math.PI / 2; seamRun.material.map.repeat.set(1, 2.5);
      seamRun.rotation.x = -Math.PI / 2; seamRun.rotation.z = seamYaw; seamRun.position.set(bw.x, by + 0.27, bw.z); scene.add(seamRun);
      var browLight = new THREE.PointLight(0xdfe8ff, 0, 8, K.LAMP.decay); browLight.position.set(bw.x, by + 1.2, bw.z); scene.add(browLight);

      // ---- the courses: a mossy bed for each edge, and a ribbon of light over it that runs only when its seat's floor reaches it --
      function ribbon(pts, w, lift, mat) {
        var n = pts.length, P = new Float32Array(n * 2 * 3), U = new Float32Array(n * 2 * 2), I = [], s = 0;
        for (var i = 0; i < n; i++) {
          var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1, nx = -dz / L, nz = dx / L;
          if (i) s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
          [-1, 1].forEach(function (sd, j) { var x = pts[i].x + nx * w / 2 * sd, z = pts[i].z + nz * w / 2 * sd, k = (i * 2 + j);
            P[k * 3] = x; P[k * 3 + 1] = groundY(x, z) + lift; P[k * 3 + 2] = z; U[k * 2] = j; U[k * 2 + 1] = s / 2.2; });
          if (i) { var q = (i - 1) * 2; I.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
        }
        var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(P, 3)); g.setAttribute("uv", new THREE.BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals();
        var mesh = new THREE.Mesh(g, mat); scene.add(mesh); return mesh;
      }
      // the bed: dry, with moss along it, soft at its banks; dark enough that a run of light on it reads, never so dark it is lost
      var bedMat = new THREE.MeshStandardMaterial({ map: bedTexture(THREE), roughness: 1, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
      var glowTex = bankGlow(THREE); // the light's spill onto the banks
      var C = courses().map(function (cc) {
        var flow = ribbon(cc.pts, 0.42, 0.09, new THREE.MeshBasicMaterial({ map: flowTex, color: 0xdfe8ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
        var glow = ribbon(cc.pts, 1.5, 0.08, new THREE.MeshBasicMaterial({ map: glowTex, color: 0xbcd0ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
        return { c: cc, bed: ribbon(cc.pts, 0.8, 0.06, bedMat), flow: flow, glow: glow, lit: 0, trace: 0 };
      });
      function courseBetween(a, b) { return C.filter(function (x) { return (x.c.from === a && x.c.to === b) || (x.c.from === b && x.c.to === a); })[0] || null; }
      // the lit run, from the brow's floor: the second floor lights the course to the next seat on the cycle (the crown)
      var browNext = O.nextOf("brow"), litCourse = runs.brow >= 2 ? courseBetween("brow", browNext) : null;

      // ---- the mouth back to the room: a dark opening in a low lip of stone, the room's warm light deep in it -------------------
      var my = groundY(MOUTH.x, MOUTH.z);
      var mouthG = new THREE.Group(); mouthG.position.set(MOUTH.x, my, MOUTH.z); scene.add(mouthG);
      var hole = new THREE.Mesh(new THREE.CircleGeometry(MOUTH_R, 36), new THREE.MeshBasicMaterial({ map: mouthTex(THREE), transparent: true, depthWrite: false }));
      hole.rotation.x = -Math.PI / 2; hole.position.y = 0.06; hole.scale.set(1.25, 1, 1); mouthG.add(hole);
      var lip = new THREE.Mesh(new THREE.TorusGeometry(MOUTH_R * 1.05, 0.2, 8, 28), rock); lip.rotation.x = -Math.PI / 2; lip.scale.set(1.25, 1, 0.6); lip.position.y = 0.05; mouthG.add(lip);
      var mouthLight = new THREE.PointLight(0xffc890, 0.5, 4, K.LAMP.decay); mouthLight.position.set(MOUTH.x, my + 0.3, MOUTH.z); scene.add(mouthLight);

      // ---- light: the cave's lamp over the figure and its carried light at the chest, and enough sky that nothing goes unreadable
      // The study's light (material-3, kept in rock-1): the even sky is gone; a low violet cave air is left, a faint silver key gives
      // the rock its shape, and the warm lamp over the figure owns the near ground, then falls to shade.
      var hemi = new THREE.HemisphereLight(0x6a5cb8, 0x1a1424, HEMI_I); scene.add(hemi);
      var sky = new THREE.DirectionalLight(0xc7d6ff, KEY_I); sky.position.set(-6, 20, 4); scene.add(sky);
      var lamp = new THREE.PointLight(0xffe0b0, LAMP_I, LAMP_REACH, K.LAMP.decay); scene.add(lamp);
      var lampHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: 0xffd8a0, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      lampHalo.scale.setScalar(2.2); scene.add(lampHalo);

      // ---- the figure ---------------------------------------------------------------------------------------------------------
      var avatar = K.buildAvatar(THREE, "self", true); avatar.scale.setScalar(FIG_K); scene.add(avatar);
      var carried = new THREE.PointLight(0xffd9a0, 0.6, 6, K.LAMP.decay); scene.add(carried);
      fig = { x: LEDGE.x, z: LEDGE.z, yaw: 0, clk: 0, to: null, moving: false };
      var keys = {}, camYaw = 0, PITCH = 0.78, camD = 18, zoom = 1, br = { t0: performance.now() / 1000, b: 0.5 };

      function camFor(x, z, yaw, D, out) {
        var y = groundY(x, z), tx = x + Math.sin(yaw) * 1.5, tz = z + Math.cos(yaw) * 1.5;
        out.position.set(tx - Math.sin(yaw) * D * Math.cos(PITCH), y + 1 + D * Math.sin(PITCH), tz - Math.cos(yaw) * D * Math.cos(PITCH));
        out.lookAt(tx, y + 1, tz); out.updateMatrixWorld(true);
      }
      // The vantage: from the heart's ledge every seat, every course and the mouth must be in the one look, on any screen. The
      // camera stands back as far as that needs and no further, and the same distance follows the figure everywhere.
      function fit() {
        var probe = camera.clone(), v = new THREE.Vector3(), pts = Object.keys(SEAT_AT).map(function (k) { return [SEAT_AT[k].x, springY(k) + 0.3, SEAT_AT[k].z]; }).concat([[MOUTH.x, my, MOUTH.z]]);
        for (var D = 9; D < 70; D += 0.5) {
          camFor(LEDGE.x, LEDGE.z, 0, D, probe);
          if (pts.every(function (p) { v.set(p[0], p[1], p[2]).project(probe); return v.z < 1 && Math.abs(v.x) < 0.86 && Math.abs(v.y) < 0.84; })) return D;
        }
        return 40;
      }
      function size() {
        if (!renderer) return;
        var w = stage.clientWidth || 1, h = stage.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
        camD = fit();
      }
      window.addEventListener("resize", size); size();
      camFor(fig.x, fig.z, camYaw, camD * zoom, camera);

      // ---- walk, stand, trace -------------------------------------------------------------------------------------------------
      function seatAt(x, z) {
        var best = null, bd = Infinity;
        Object.keys(SEAT_AT).forEach(function (k) { var d = Math.hypot(x - SEAT_AT[k].x, z - SEAT_AT[k].z) - (POOL[k] || 0); if (d < SEAT_REACH + (k === "heart" ? 1.4 : 0.6) && d < bd) { bd = d; best = k; } });
        return best;
      }
      // Keep a step on the land and out of the open pools (the figure walks round the water, never through it).
      function keepOn(x, z) {
        var ex = (x - LAND.cx) / LAND.rx, ez = (z - LAND.cz) / LAND.rz, e = Math.hypot(ex, ez);
        if (e > 0.95) { x = LAND.cx + ex / e * 0.95 * LAND.rx; z = LAND.cz + ez / e * 0.95 * LAND.rz; }
        Object.keys(POOL).forEach(function (k) { var s = SEAT_AT[k], d = Math.hypot(x - s.x, z - s.z), r = POOL[k] + 0.35; if (d < r) { x = s.x + (x - s.x) / (d || 1) * r; z = s.z + (z - s.z) / (d || 1) * r; } });
        return { x: x, z: z };
      }
      // Where to stand for a seat: on the near side of its spring, out of the water.
      function standFor(k) {
        var s = SEAT_AT[k], dx = fig.x - s.x, dz = fig.z - s.z, d = Math.hypot(dx, dz) || 1, r = (POOL[k] || 0.6) + 0.9;
        if (k === "heart") return { x: LEDGE.x, z: LEDGE.z };
        return keepOn(s.x + dx / d * r, s.z + dz / d * r);
      }
      walkToSeat = function (k, o2) {
        if (!SEAT_AT[k]) return false;
        var p = standFor(k);
        if (o2 && o2.now) { fig.x = p.x; fig.z = p.z; fig.to = null; if (o2.face && SEAT_AT[o2.face]) { camYaw = fig.yaw = Math.atan2(SEAT_AT[o2.face].x - fig.x, SEAT_AT[o2.face].z - fig.z); } if (o2.zoom) zoom = o2.zoom; snapCam = true; return true; }
        fig.to = { x: p.x, z: p.z, seat: k }; return true;
      };
      screenOfSeat = function (k) {
        if (!renderer || !SEAT_AT[k]) return null;
        var rc = renderer.domElement.getBoundingClientRect(), p = new THREE.Vector3(SEAT_AT[k].x, springY(k), SEAT_AT[k].z).project(camera);
        return { x: rc.left + (p.x + 1) / 2 * rc.width, y: rc.top + (1 - p.y) / 2 * rc.height };
      };
      // Trace: tapping another seat while standing at one lights the courses between them along the graph, then they rest.
      function path(a, b) {
        var prev = {}, q = [a]; prev[a] = a;
        while (q.length) { var u = q.shift(); if (u === b) break; O.EDGES.forEach(function (e) { var w = e.from === u ? e.to : e.to === u ? e.from : null; if (w && !(w in prev)) { prev[w] = u; q.push(w); } }); }
        if (!(b in prev)) return [];
        var out = [], n = b; while (n !== a) { out.unshift(courseBetween(prev[n], n)); n = prev[n]; }
        return out;
      }
      function trace(a, b) {
        var p = path(a, b); if (!p.length) return;
        B.trace = p.map(function (x, i) { return { c: x.c, t0: now() + i * 0.45 }; });
        p.forEach(function (x, i) { x.trace = 0; x.traceAt = now() + i * 0.45; });
        say(WORDS.trace);
      }
      function now() { return performance.now() / 1000; }
      var ray = new THREE.Raycaster(), springHits = [S.heart, S.crown, bowl, bowlWater, vent, slab, seamWet], springOf = [ "heart", "crown", "dantian", "dantian", "solar", "brow", "brow"];
      function tapAt(cx, cy) {
        if (!renderer || B.leaving) return;
        var rc = renderer.domElement.getBoundingClientRect();
        ray.setFromCamera(new THREE.Vector2((cx - rc.left) / rc.width * 2 - 1, -((cy - rc.top) / rc.height * 2 - 1)), camera);
        var mh = ray.intersectObjects([hole, lip])[0]; if (mh) { fig.to = { x: MOUTH.x, z: MOUTH.z, mouth: true }; return; }
        var sh = ray.intersectObjects(springHits)[0], hit = ray.intersectObject(land)[0], k = sh ? springOf[springHits.indexOf(sh.object)] : hit ? seatAt(hit.point.x, hit.point.z) : null;
        if (!k && hit && Math.hypot(hit.point.x - MOUTH.x, hit.point.z - MOUTH.z) < MOUTH_R * 1.4) { fig.to = { x: MOUTH.x, z: MOUTH.z, mouth: true }; return; }
        // standing at one seat, a tap on another traces the water between; a second tap on it walks there
        if (k && B.at && !fig.to && k !== B.at && !(B.traced === k && now() - B.tracedAt < 5)) { trace(B.at, k); B.traced = k; B.tracedAt = now(); return; }
        if (k) { walkToSeat(k); return; }
        if (hit) { var p = keepOn(hit.point.x, hit.point.z); fig.to = { x: p.x, z: p.z }; }
      }
      var ptr = null, drag = null;
      if (renderer) {
        var dom = renderer.domElement;
        dom.addEventListener("pointerdown", function (e) { ptr = { x: e.clientX, y: e.clientY, t: e.timeStamp, moved: false }; drag = { x: e.clientX }; try { dom.setPointerCapture(e.pointerId); } catch (x) { /* fine */ } });
        dom.addEventListener("pointermove", function (e) {
          if (!drag) return;
          if (ptr && Math.hypot(e.clientX - ptr.x, e.clientY - ptr.y) > 10) ptr.moved = true;
          if (ptr && ptr.moved) { camYaw -= (e.clientX - drag.x) * 0.006; drag.x = e.clientX; }
        });
        ["pointerup", "pointercancel"].forEach(function (n) { dom.addEventListener(n, function (e) { if (n === "pointerup" && ptr && !ptr.moved) tapAt(e.clientX, e.clientY); ptr = null; drag = null; }); });
        dom.addEventListener("wheel", function (e) { e.preventDefault(); zoom = Math.max(0.35, Math.min(1.4, zoom * Math.exp(e.deltaY * 0.0012))); }, { passive: false });
      }
      function keyDown(e) { var k = e.key; if (/^(Arrow(Up|Down|Left|Right)|[wasdWASD])$/.test(k)) { keys[k.toLowerCase()] = true; fig.to = null; e.preventDefault(); } }
      function keyUp(e) { delete keys[e.key.toLowerCase()]; }
      window.addEventListener("keydown", keyDown); window.addEventListener("keyup", keyUp);

      function leave() {
        if (B.leaving) return; B.leaving = true; fade.style.opacity = 1;
        setTimeout(function () {
          cancelAnimationFrame(running); window.removeEventListener("resize", size); window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp);
          if (renderer) renderer.dispose(); wrap.remove(); B.open = false;
          if (o.back) o.back();
        }, 520);
      }

      // ---- the frame ------------------------------------------------------------------------------------------------------------
      var reduced = !!(K.reducedMotion && K.reducedMotion()), t0 = now(), last = now(), running = 0, snapCam = true, wasIn = true, lineT = t0;
      var camPos = new THREE.Vector3(), camAim = new THREE.Vector3(), probeCam = camera.clone();
      say(WORDS.arrive);
      setTimeout(function () { how.style.opacity = 0; }, 9000);
      function frame() {
        running = requestAnimationFrame(frame);
        var t = now(), dt = Math.min(0.05, t - last); last = t;
        // the breath, as the cave counts it
        var T = K.BREATH.inS + K.BREATH.outS, tm = ((t - br.t0) % T + T) % T;
        br.b = reduced ? 0.5 : tm < K.BREATH.inS ? 0.5 - 0.5 * Math.cos(Math.PI * tm / K.BREATH.inS) : 0.5 + 0.5 * Math.cos(Math.PI * (tm - K.BREATH.inS) / K.BREATH.outS);
        // walk: keys relative to the view, or toward a tapped spot
        var wx = 0, wz = 0, f = { x: Math.sin(camYaw), z: Math.cos(camYaw) }, r = { x: -Math.cos(camYaw), z: Math.sin(camYaw) };
        if (keys.arrowup || keys.w) { wx += f.x; wz += f.z; } if (keys.arrowdown || keys.s) { wx -= f.x; wz -= f.z; }
        if (keys.arrowright || keys.d) { wx += r.x; wz += r.z; } if (keys.arrowleft || keys.a) { wx -= r.x; wz -= r.z; }
        var moving = false;
        if (wx || wz) { var l = Math.hypot(wx, wz); wx /= l; wz /= l; moving = true; }
        else if (fig.to) {
          var dx = fig.to.x - fig.x, dz = fig.to.z - fig.z, d = Math.hypot(dx, dz);
          if (d < 0.08) { if (fig.to.mouth) { fig.x = fig.to.x; fig.z = fig.to.z; } fig.to = null; } else { wx = dx / d; wz = dz / d; moving = true; }
        }
        if (moving && !B.leaving) {
          var step = Math.min(WALK * dt, fig.to ? Math.hypot(fig.to.x - fig.x, fig.to.z - fig.z) : Infinity);
          var nx = fig.x + wx * step, nz = fig.z + wz * step, p = (fig.to && fig.to.mouth) ? { x: nx, z: nz } : keepOn(nx, nz);
          fig.x = p.x; fig.z = p.z; fig.clk += dt;
          var want = Math.atan2(wx, wz), dy = ((want - fig.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI; fig.yaw += dy * Math.min(1, dt * 8);
        }
        fig.moving = moving;
        // the mouth: walked into, it goes back (mab-one-mouth). The figure must have stepped out of it first, so arriving
        // beside it never sends a player straight back.
        var inMouth = Math.hypot(fig.x - MOUTH.x, fig.z - MOUTH.z) < MOUTH_R * 0.9;
        if (!inMouth) wasIn = false; else if (!wasIn) leave();
        // stand: a seat's one line while the figure stands at it; walking away lets the line go
        var at = moving ? null : seatAt(fig.x, fig.z);
        if (at !== B.at) { B.at = at; wrap.setAttribute("data-basin-at", at || ""); if (at) say(seatLine(at)); }
        if (!at && moving && B.said && t - lineT > 0.5) { lineT = t; line.hidden = true; B.said = ""; }
        // the figure on the ground, breathing, its lamp above and its light at the chest
        var gy = groundY(fig.x, fig.z);
        avatar.position.set(fig.x, gy, fig.z); avatar.rotation.y = fig.yaw;
        K.poseAvatar(avatar, fig.clk, moving, dt, br.b, WALK / K.STEPS_PER_S * FIG_K, reduced); K.loosenAvatar(avatar, 0, br.b);
        lamp.position.set(fig.x, gy + K.LAMP.above + 2.4, fig.z); carried.position.set(fig.x + Math.sin(fig.yaw) * 0.3, gy + 1.4, fig.z + Math.cos(fig.yaw) * 0.3); lampHalo.position.copy(carried.position);
        // the springs at rest move as still things do: the motes hang and drift, the vent's air wavers
        var ts = reduced ? 0 : t - t0;
        for (var i = 0; i < MN; i++) { var mb = moteBase[i], a = mb.a + ts * 0.12 * mb.v; motePos[i * 3] = Math.cos(a) * mb.r; motePos[i * 3 + 1] = mb.y + 0.15 * Math.sin(ts * 0.4 + i); motePos[i * 3 + 2] = Math.sin(a) * mb.r; }
        moteGeo.attributes.position.needsUpdate = true;
        shimmer.lookAt(camera.position.x, shimmer.position.y, camera.position.z); shimmer.material.opacity = 0.14 + 0.05 * Math.sin(ts * 1.7); shimmer.material.map.offset.y = -ts * 0.15;
        // the brow's run (organs.js runOf): the seam runs from the first floor, the course to the crown from the second
        if (!reduced) { flowTex.offset.y = -ts * 0.55; seamRun.material.map.offset.y = -ts * 0.4; }
        var lit1 = runs.brow >= 1 ? 1 : 0;
        seamRun.material.opacity += (0.85 * lit1 - seamRun.material.opacity) * Math.min(1, dt * 2);
        browLight.intensity += (0.9 * lit1 - browLight.intensity) * Math.min(1, dt * 2);
        C.forEach(function (x) {
          var base = x === litCourse ? 0.8 : 0, tr = 0;
          if (x.traceAt != null) { var k = t - x.traceAt; tr = k < 0 ? 0 : k < 0.5 ? k / 0.5 : k < 2.4 ? 1 : Math.max(0, 1 - (k - 2.4) / 1.4); if (k > 3.8) x.traceAt = null; }
          var want2 = Math.max(base, 0.75 * tr); x.flow.material.opacity += (want2 - x.flow.material.opacity) * Math.min(1, dt * 3);
          x.glow.material.opacity = x.flow.material.opacity * 0.45;
        });
        B.trace = B.trace.filter(function (q) { return t - q.t0 < 3.8; });
        // the third floor: the crown's pool answers once a visit, when the light has had time to reach it; then it holds still
        // seen counts the time the land has been on screen, so a slow first draw does not answer unseen
        if (runs.brow >= 3 && !B.answered && (B.seen += dt) > 2.6) { B.answered = true; B.answerT = t; crownAnswered(); }
        if (B.answerT >= 0) {
          var ka = t - B.answerT, rk = Math.min(1, ka / 2.6);
          ripple.visible = !reduced && rk < 1; ripple.scale.setScalar(0.2 + POOL.crown * 1.05 * rk); ripple.material.opacity = 0.7 * (1 - rk);
          var hk = Math.min(1, ka / 1.8); held.material.opacity = 0.95 * hk; heldGlow.material.opacity = 0.32 * hk; crownLight.intensity = 0.7 * hk;
        }
        // the one camera: behind and above the figure, standing back as far as the vantage needs
        camFor(fig.x, fig.z, camYaw, camD * zoom, probeCam);
        if (snapCam) { camPos.copy(probeCam.position); camAim.set(fig.x + Math.sin(camYaw) * 1.5, gy + 1, fig.z + Math.cos(camYaw) * 1.5); snapCam = false; }
        else { var ce = 1 - Math.exp(-dt * 3); camPos.lerp(probeCam.position, ce); camAim.lerp(new THREE.Vector3(fig.x + Math.sin(camYaw) * 1.5, gy + 1, fig.z + Math.cos(camYaw) * 1.5), ce); }
        camera.position.copy(camPos); camera.lookAt(camAim);
        if (renderer) renderer.render(scene, camera);
      }
      function crownAnswered() { if (B.at === "crown") { B.said = ""; say(seatLine("crown")); } }
      function seatLine(k) {
        var w = WORDS.seats[k];
        if (k === "brow") return runs.brow >= 2 ? w.run2 : runs.brow >= 1 ? w.run1 : w.rest;
        if (k === "crown") return B.answered ? w.answered : w.rest;
        return w.rest;
      }
      running = requestAnimationFrame(frame);
    }
  }

  // A soft run of light along a course: bright bands that fade, tiled along its length.
  function flowTexture(THREE) {
    var cv = document.createElement("canvas"); cv.width = 16; cv.height = 128; var g = cv.getContext("2d");
    var gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, "rgba(255,255,255,0.55)"); gr.addColorStop(0.4, "rgba(255,255,255,1)"); gr.addColorStop(0.8, "rgba(255,255,255,0.55)"); gr.addColorStop(1, "rgba(255,255,255,0.55)");
    g.fillStyle = gr; g.fillRect(0, 0, 16, 128);
    var e = g.createLinearGradient(0, 0, 16, 0); e.addColorStop(0, "rgba(0,0,0,1)"); e.addColorStop(0.3, "rgba(0,0,0,0)"); e.addColorStop(0.7, "rgba(0,0,0,0)"); e.addColorStop(1, "rgba(0,0,0,1)");
    g.globalCompositeOperation = "destination-out"; g.fillStyle = e; g.fillRect(0, 0, 16, 128);
    var t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  // A dry watercourse's bed: dark moss down the middle, pebbled, fading out at both banks.
  function bedTexture(THREE) {
    var cv = document.createElement("canvas"); cv.width = 64; cv.height = 128; var g = cv.getContext("2d");
    var gr = g.createLinearGradient(0, 0, 64, 0);
    gr.addColorStop(0, "rgba(74,82,60,0)"); gr.addColorStop(0.25, "rgba(74,82,60,0.75)"); gr.addColorStop(0.5, "rgba(58,66,50,0.95)"); gr.addColorStop(0.75, "rgba(74,82,60,0.75)"); gr.addColorStop(1, "rgba(74,82,60,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 128);
    var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; } // scattered, never in rows
    for (var i = 0; i < 140; i++) { var x = 14 + rnd() * 36, y = rnd() * 128, r = 0.6 + rnd() * 1.2; g.fillStyle = rnd() < 0.5 ? "rgba(140,132,112,0.28)" : "rgba(36,42,30,0.35)"; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    var t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  // A soft spill of light across a course and its banks.
  function bankGlow(THREE) {
    var cv = document.createElement("canvas"); cv.width = 64; cv.height = 4; var g = cv.getContext("2d");
    var gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.5, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 4); return new THREE.CanvasTexture(cv);
  }
  // The air over the vent: soft vertical streaks.
  function shimmerTex(THREE) {
    var cv = document.createElement("canvas"); cv.width = 32; cv.height = 64; var g = cv.getContext("2d");
    for (var i = 0; i < 3; i++) { var x = 7 + i * 8, gr = g.createLinearGradient(0, 64, 0, 0); gr.addColorStop(0, "rgba(255,255,255,0.8)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(x, 0, 2, 64); }
    var t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  // The mouth's dark, with the room's warm light far down in it.
  function mouthTex(THREE) {
    var cv = document.createElement("canvas"); cv.width = cv.height = 64; var g = cv.getContext("2d");
    var gr = g.createRadialGradient(32, 30, 2, 32, 32, 32); gr.addColorStop(0, "rgba(120,70,40,1)"); gr.addColorStop(0.35, "rgba(30,16,12,1)"); gr.addColorStop(1, "rgba(6,5,8,1)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(cv);
  }

  window.__oagBasin = api;
})();
