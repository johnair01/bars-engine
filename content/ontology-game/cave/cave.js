// The Cave of Lessons: the ontology game's block work, played inside the body map.
//
// Design: content/ontology-game/cave/DESIGN.md. Wendell, 9 October 2026: "create a version where the game
// happens inside the body map instead of the body map being inside the game". The player taps the figure
// (the body map's own picker, OAGBody.pick); the tapped place is a portal. At the portal they name what they
// bring (charge, elemental channel, face), and only then does one generic chamber form, dressed in that
// energy (board ruling c3d-spot-shape, overruled 9 October). Each further place named in the same sitting is
// its own chamber, joined to the others by a path through the body.
//
// Needs body-map.js (OAGBody) loaded first. Reads cave-kit.glb and spots.json beside the page; they are
// made by build_kit.py.
//
// The next build (board of 9 October, 20:35): after the doorway the chamber is one winding path with a stretch for
// each W.A.V.E. step, walked by a small avatar that wears the charge. A block on any step opens a side passage that
// holds the five places; Release walks back to the exact marker, and blocks nest. The cave breathes (about 11
// seconds a breath); nothing is scored or required, and the calm button stills it.
(function () {
  "use strict";
  var BASE = window.__oagCaveBase || "/ontology-game/cave/";
  var THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

  // The five places of block work (game.jsx BLOCK_STEPS, lines 1200-1206). They are no longer the main walk: they line
  // a side passage that opens when the player blocks. s is the place's distance along the passage; key is the name
  // the saved scan uses for a block met there.
  var PLACES = [
    { id: "mouth", step: "1 Sensation", key: "sensation", s: 30 },
    { id: "pool", step: "2 Element", key: "element", s: 60 },
    { id: "passage", step: "3 Daemon", key: "daemon", s: 90 },
    { id: "gate", step: "4 Game masters' gate", key: "gate", s: 120 },
    { id: "way_out", step: "Release", key: "release", s: 150 },
  ];
  var PLACE_BY = {}; PLACES.forEach(function (p) { PLACE_BY[p.id] = p; });
  // The W.A.V.E. steps in order, copied from game.jsx WAVE_STEPS (lines 1092-1108): id, label, prompt.
  var WAVE = [
    ["welcome", "Welcome", "Let whatever's here be here for a moment, without needing it to be different yet."],
    ["acknowledge", "Acknowledge", "Admit that it's here. You don't have to like it."],
    ["allow", "Allow", "Let it take up as much of you as it's taking. You don't have to make it smaller."],
    ["accept", "Accept", "Let it be here without fighting it."],
    ["appreciate", "Appreciate", "Find what it's been trying to do for you."],
    ["validate", "Validate", "Your body has the right to feel this, whatever it is."],
    ["exhale", "Exhale", "Is this feeling in alignment with what you actually want right now?"],
  ];
  // The path as a short table (a choice): one stretch per W.A.V.E. step, each with its length and how far it
  // wanders sideways. Every stretch ends in a switchback to the next. The seed jitters lengths and bends, so the
  // same scan gives the same cave.
  // Rows are short because the switchback between two rows already gives each stretch about 30 units: a stretch is one breath
  // of walking (see below), so a stretch near 40 units keeps the stride of the avatar natural. Welcome is longer because it
  // has no switchback before it.
  var STRETCHES = [
    ["welcome", 36, 0], ["acknowledge", 12, 1.4], ["allow", 12, -1.5], ["accept", 12, 1.3],
    ["appreciate", 12, -1.4], ["validate", 12, 1.5], ["exhale", 12, 0],
  ];
  var LEAD = 5;          // straight run behind the first stand, so the camera has a path to follow
  // The breath is the ontology game's own: game.jsx lines 1330-1331 set BREATH_IN_MS = 4000 and BREATH_OUT_MS = 6000 for
  // its breath ring. The cave reads the same two numbers, so a hold here is the same inhale and exhale as there.
  var BREATH_IN_MS = 4000;
  var BREATH_OUT_MS = 6000;
  var BREATH = { inS: BREATH_IN_MS / 1000, outS: BREATH_OUT_MS / 1000 };
  var BREATH_S = BREATH.inS + BREATH.outS;
  // The walk (a choice): while the player holds, one stretch takes exactly one breath. The first half of the stretch is
  // walked on the inhale (4 s, 8 steps) and the second half on the exhale (6 s, 12 steps), two steps a second throughout,
  // so the footfalls land evenly: 8 in the inhale, 12 in the exhale. The inhale strides are longer than the exhale ones.
  var STEPS_PER_S = 2;
  var STEPS_IN = BREATH.inS * STEPS_PER_S, STEPS_OUT = BREATH.outS * STEPS_PER_S;
  var MARK_AHEAD = 3.6;  // the marker floats this far ahead of the stand
  var MARK_Y = 2.0;      // and this high above the floor
  // How far through a stretch the avatar is after t seconds of holding: half on the inhale, half on the exhale.
  function stretchFrac(t) { return t < BREATH.inS ? 0.5 * t / BREATH.inS : 0.5 + 0.5 * Math.min(1, (t - BREATH.inS) / BREATH.outS); }
  // What each stretch looks like (a choice). The seven take their light from the game's element colours (ELEMENTS below:
  // Earth, Fire, Water, Wood, Metal) and then climb to gold and daylight; the fog brightens, thins, and the walls open
  // wider as the steps climb. open scales the wall rings, fog is the fog and background colour, fogK scales the charge's
  // fog density, hemi is the ambient light.
  var STEP_LOOK = [
    { id: "welcome", light: 0xa8844a, fog: 0x1a140e, fogK: 1.3, open: 0.88, hemi: 0.34 },     // Earth: receiving, close
    { id: "acknowledge", light: 0xe0602a, fog: 0x2a120c, fogK: 1.15, open: 0.96, hemi: 0.38 }, // Fire: it is admitted
    { id: "allow", light: 0x3a78d0, fog: 0x0e1a30, fogK: 1.0, open: 1.04, hemi: 0.42 },        // Water: it takes the room it takes
    { id: "accept", light: 0x4aa84a, fog: 0x10261a, fogK: 0.9, open: 1.12, hemi: 0.46 },       // Wood: it grows without a fight
    { id: "appreciate", light: 0xc8ccd4, fog: 0x2a2c34, fogK: 0.8, open: 1.2, hemi: 0.52 },    // Metal: what it was for
    { id: "validate", light: 0xffd28a, fog: 0x42361e, fogK: 0.65, open: 1.28, hemi: 0.6 },     // gold: the right to feel it
    { id: "exhale", light: 0xfff4d8, fog: 0x6a6450, fogK: 0.45, open: 1.38, hemi: 0.7 },       // daylight: the way out
  ];
  var SIDE_LOOK = { id: "side", light: 0xa890ff, fog: 0x120e22, fogK: 1.1, open: 0.95, hemi: 0.36 }; // a violet hush for a block
  var OPEN_MAX = 1.38;
  var CLOSED = 0.5; // a stretch not yet chosen: its walls gathered in, waiting for the choice at its marker
  var HOLD_ABOUT_AFTER = 15; // seconds without touching the ring before the cave breathes on its own again
  // Textures as the body map names them (body-map.js TEXTURES) and the wall tint each gives (a choice).
  var TEXTURES = [
    ["constriction", "tightness", 0x8a4b3a], ["tension", "tension", 0x8c7a3a], ["numbness", "numbness", 0x6c7a8a],
    ["strength", "strength", 0x3a8a6c], ["other", "something else", 0x7a5ca8],
  ];
  // Channels and their elements (game.jsx CLEAN_UP_MOVES, lines 1257-1289: name, element, gist) and the pool colour.
  var ELEMENTS = [
    ["Anger", "Fire", "Burn it away", 0xe0602a], ["Sadness", "Water", "Let it flow", 0x3a78d0],
    ["Joy", "Wood", "Happy Apples", 0x4aa84a], ["Fear", "Metal", "Sharpen it", 0xc8ccd4],
    ["Neutrality", "Earth", "Rest and receive", 0xa8844a],
  ];
  // The six faces (game.jsx faces, line 745, and precisionQuestions, line 755) and the stone colour each gets (a choice).
  var FACES = [
    ["magenta", "Magenta", "Knows through presence and relational field", "Where is the presence you're reaching for?", 0xd040a0],
    ["red", "Red", "Knows through power, force, capacity", "What power are you trying to move or assert?", 0xd83a3a],
    ["amber", "Amber", "Knows through order, law, tradition, duty", "What rule or tradition is this about?", 0xe0a020],
    ["orange", "Orange", "Knows through understanding, clarity, coherence", "What understanding or clarity are you looking for?", 0xe87a28],
    ["green", "Green", "Knows through perspectives, voices, integration", "What perspectives or voices are involved?", 0x40b858],
    ["teal", "Teal", "Knows through systems, how everything learns", "How is the system trying to learn through this?", 0x20a8a8],
  ];
  // The seven daemons (game.jsx DAEMONS, lines 1222-1230: id, name, essence), the colour each wears and what it
  // carries (choices: the seven share one body and differ by colour, posture and what they carry).
  var DAEMONS = [
    ["protector", "The Protector", "To protect: to keep you alive.", 0x4a78c8, "shield"],
    ["controller", "The Controller", "To set the standard.", 0x8a8f9a, "rod"],
    ["skeptic", "The Skeptic", "To doubt.", 0xb89a3a, "lens"],
    ["fixer", "The Fixer", "To fix, in both senses: to repair what's broken, and to hold something in place.", 0xc8742a, "wrench"],
    ["victim", "The Victim", "Sympathy, through stories.", 0x7a6aa8, "bundle"],
    ["damaged-self", "The Damaged Self", "To take the damage. It is the Protector's last resort, because absorbing a hit is a form of protection.", 0x6a4a4a, "crack"],
    ["emotional-body", "The Emotional Body", "To receive the signal and process it into meaning. It is where Emotional Alchemy happens.", 0x3ab890, "orb"],
  ];
  // Game.jsx CHANNEL_JOBS (line 1176): how each channel does its job, shown at the pool.
  var CHANNEL_JOBS = {
    Anger: "Anger's job is to find obstacles to be overcome, or boundaries to be created or destroyed.",
    Sadness: "Sadness's job is to point you toward what you care about and how far away you are from it.",
    Fear: "Fear's job is to detect threat and risk.",
    Joy: "Joy's job is to show you what's aligned with your delight.",
    Neutrality: "Neutrality's job is detachment and perspective, the view that lets you see the whole.",
  };
  // How a charge shapes the one generic chamber: width factor and fog (choices).
  // Wendell, 10 October 2026: "the cave is a bit narrow". The chamber is wider (6 from 4.4) and the charges spread less: tightness
  // still draws the walls in, but no longer to a corridor.
  var CHARGE_LOOK = { constriction: { w: 0.78, fog: 0.03 }, tension: { w: 0.9, fog: 0.02 }, numbness: { w: 1.1, fog: 0.05 }, strength: { w: 1.2, fog: 0.012 }, other: { w: 1, fog: 0.02 } };
  // The one chamber every portal opens (half-width, half-height and length in chamber units).
  var CHAMBER = { w: 6, h: 3, length: 20 };
  var FIG = 14; // chamber units per metre of the figure, for the paths that join two places
  // Game.jsx DAEMON_WORKS_FOR, line 1236.
  var DAEMON_WORKS_FOR = "You, the Player. Every daemon is there to protect you, and to work for your enjoyment.";

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { e.appendChild(c); });
    return e;
  }

  // ---- reading the kit -------------------------------------------------------------------
  function parseKit(buf) {
    var dv = new DataView(buf);
    var jsonLen = dv.getUint32(12, true);
    var json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jsonLen)));
    var bin = 20 + jsonLen + 8;
    var TYPES = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array };
    var SIZES = { SCALAR: 1, VEC3: 3 };
    function acc(i) {
      var a = json.accessors[i], v = json.bufferViews[a.bufferView], T = TYPES[a.componentType];
      return new T(buf.slice(bin + (v.byteOffset || 0) + (a.byteOffset || 0), bin + (v.byteOffset || 0) + (a.byteOffset || 0) + a.count * SIZES[a.type] * T.BYTES_PER_ELEMENT));
    }
    var out = {};
    (json.nodes || []).forEach(function (n) {
      if (n.mesh === undefined) return;
      var p = json.meshes[n.mesh].primitives[0];
      out[n.name] = { position: acc(p.attributes.POSITION), normal: acc(p.attributes.NORMAL), index: acc(p.indices) };
    });
    return out;
  }
  var assets = null;
  function load() {
    if (assets) return assets;
    assets = Promise.all([
      fetch(BASE + "cave-kit.glb").then(function (r) { if (!r.ok) throw new Error("cave-kit.glb " + r.status); return r.arrayBuffer(); }).then(parseKit),
      fetch(BASE + "spots.json").then(function (r) { if (!r.ok) throw new Error("spots.json " + r.status); return r.json(); }),
      new Promise(function (res, rej) {
        if (window.THREE) return res(window.THREE);
        var s = el("script", { src: THREE_URL });
        s.onload = function () { res(window.THREE); };
        s.onerror = function () { rej(new Error("three.js did not load")); };
        document.head.appendChild(s);
      }),
    ]).then(function (r) { return { kit: r[0], spots: r[1].spots, THREE: r[2] }; }).catch(function (e) { assets = null; throw e; });
    return assets;
  }


  // ---- the dressing: what the charge and the feeling do to the cave ----------------------------
  function lookup(table, key) { return table.filter(function (r) { return r[0] === key; })[0]; }

  function geomOf(THREE, piece) {
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(piece.position, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(piece.normal, 3));
    g.setIndex(new THREE.BufferAttribute(piece.index, 1));
    return g;
  }

  // A seed from words, and a small seeded random: the same scan gives the same cave.
  function hashOf(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rngOf(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }


  // ---- a route: the line the avatar walks, sampled every half unit ------------------------------
  // r = { X, Y, Z, S (distance along, measured flat), len, stops: [{ s, ... }] }. The avatar only ever stands on this line.
  // Y is the floor's rise and fall: the main path is level, and a side path ramps down under it and back up.
  function makeRoute(pts, kind) {
    var r = { X: [], Y: [], Z: [], S: [], kind: kind, stops: [] }, acc = 0;
    pts.forEach(function (p, i) {
      if (i) acc += Math.hypot(p.x - pts[i - 1].x, p.z - pts[i - 1].z);
      r.X.push(p.x); r.Y.push(p.y || 0); r.Z.push(p.z); r.S.push(acc);
    });
    r.len = acc;
    return r;
  }
  function ptOn(r, s) {
    s = Math.max(0, Math.min(r.len, s));
    var lo = 0, hi = r.S.length - 1;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (r.S[m] <= s) lo = m; else hi = m; }
    var k = (s - r.S[lo]) / Math.max(1e-6, r.S[hi] - r.S[lo]);
    return { x: r.X[lo] + (r.X[hi] - r.X[lo]) * k, y: r.Y[lo] + (r.Y[hi] - r.Y[lo]) * k, z: r.Z[lo] + (r.Z[hi] - r.Z[lo]) * k };
  }
  function at(r, s) { // point and unit forward direction (flat)
    var p = ptOn(r, s), a = ptOn(r, s - 0.6), b = ptOn(r, s + 0.6), dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
    return { x: p.x, y: p.y, z: p.z, fx: dx / l, fz: dz / l };
  }
  function yawFacing(f) { return Math.atan2(f.fx, f.fz); } // a figure that faces +z
  function distToRoute(r, x, z) { // how far a point is from the line (the test uses it: the avatar never leaves it)
    var best = 1e9;
    for (var i = 1; i < r.X.length; i++) {
      var ax = r.X[i - 1], az = r.Z[i - 1], bx = r.X[i] - ax, bz = r.Z[i] - az, l2 = bx * bx + bz * bz || 1;
      var t = clamp((((x - ax) * bx) + ((z - az) * bz)) / l2, 0, 1);
      best = Math.min(best, Math.hypot(ax + bx * t - x, az + bz * t - z));
    }
    return best;
  }
  // Resample a polyline every ds units (flat distance), after two rounds of corner cutting so the line flows.
  function smoothLine(pts, ds) {
    for (var it = 0; it < 2; it++) {
      var q = [pts[0]];
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1];
        q.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25, z: a.z * 0.75 + b.z * 0.25 });
        q.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75, z: a.z * 0.25 + b.z * 0.75 });
      }
      q.push(pts[pts.length - 1]); pts = q;
    }
    var r = makeRoute(pts, "tmp"), out = [];
    for (var s = 0; s < r.len; s += ds) out.push(ptOn(r, s));
    out.push(ptOn(r, r.len));
    return out;
  }

  // The main path: seven rows, one per W.A.V.E. step, joined by half-circle switchbacks; each row wanders a little.
  // Rows are far enough apart that the walls never meet, even opened to their widest and breathing in, so there are no free
  // turns and no dead ends.
  function layoutMain(seed, w) {
    var R = rngOf(hashOf(seed));
    var rows = STRETCHES.map(function (r) { return { step: r[0], len: r[1] * (0.9 + 0.2 * R()), amp: r[2] * (0.75 + 0.5 * R()) }; });
    var ampMax = 0; rows.forEach(function (r) { ampMax = Math.max(ampMax, Math.abs(r.amp)); });
    var ru = Math.max(9, w * OPEN_MAX * 1.06 + ampMax + 1.5), pitch = 2 * ru, ds = 0.5, pts = [], ends = [], x = 0, dir = 1;
    for (var k = -LEAD / ds; k < 0; k++) pts.push({ x: k * ds, z: 0 });
    rows.forEach(function (row, i) {
      var z0 = -i * pitch, n = Math.max(2, Math.round(row.len / ds));
      for (var j = 0; j <= n; j++) {
        var u = j / n, off = row.amp * Math.pow(Math.sin(Math.PI * u), 2) * Math.sin(2 * Math.PI * u);
        if (i === 0 || j > 0) pts.push({ x: x + dir * row.len * u, z: z0 + off });
      }
      ends.push(pts.length - 1);
      var xe = x + dir * row.len;
      if (i < rows.length - 1) {
        var m = Math.max(10, Math.round(Math.PI * ru / ds));
        for (var q = 1; q <= m; q++) { var phi = Math.PI * q / m; pts.push({ x: xe + dir * ru * Math.sin(phi), z: z0 - ru + ru * Math.cos(phi) }); }
        x = xe; dir = -dir;
      } else {
        for (var e = 1; e <= 20; e++) pts.push({ x: xe + dir * e * ds, z: z0 }); // the way out
      }
    });
    var r = makeRoute(pts, "main");
    r.startS = LEAD; r.rows = rows.map(function (row) { return { step: row.step, len: Math.round(row.len * 10) / 10, amp: Math.round(row.amp * 10) / 10 }; });
    r.stops = ends.map(function (e, i) { return { s: r.S[e] - 1.5, wave: i }; });
    r.exitS = r.len; r.pitch = pitch;
    return r;
  }

  // Which side a branch leaves by: the outside of the bend the path is in, so its legs spread apart instead of crossing.
  // A straight stretch alternates by depth.
  function outerSide(route, s, depth) {
    var a = at(route, s - 3), b = at(route, s + 3), cross = a.fx * b.fz - a.fz * b.fx;
    if (Math.abs(cross) < 0.02) return depth % 2 ? -1 : 1;
    return cross > 0 ? -1 : 1;
  }
  // A branch: a loop that leaves the parent path through one opening in its wall and comes back through a second opening
  // beside the first, ending on the very spot it left from (playtesters: a side path loops back onto the path it branched
  // from). A side passage ramps down under the cave (drop), swings round a wide loop and climbs back; a face's branch at
  // the gate is a short level loop. In the parent's frame at s: u runs along the path, v out through the wall.
  // o = { wb: half-width, g: half the gap between the two openings, W0: the parent's wall, L1: leg length, alpha: how far
  // the legs splay, R: the loop's radius, drop }.
  function layoutBranch(parent, sAt, side, o) {
    var b = at(parent, sAt), nx = -b.fz * side, nz = b.fx * side;
    function P(u, v, dy) { return { x: b.x + b.fx * u + nx * v, y: b.y + dy, z: b.z + b.fz * u + nz * v }; }
    var sa = Math.sin(o.alpha), ca = Math.cos(o.alpha), ctl = [P(0, 0, 0), P(-o.g * 0.7, o.W0 * 0.5, 0), P(-o.g, o.W0, 0)], i, k;
    var n1 = Math.max(1, Math.round(o.L1 / 2));
    for (i = 1; i <= n1; i++) { k = i / n1; ctl.push(P(-o.g - o.L1 * sa * k, o.W0 + o.L1 * ca * k, -o.drop * k)); }
    var c = o.g + o.L1 * sa, v1 = o.W0 + o.L1 * ca, R = Math.max(o.R, c + 1), Rc = Math.sqrt(R * R - c * c), cv = v1 + Rc;
    var phA = Math.atan2(-Rc, -c), phB = Math.atan2(-Rc, c) - 2 * Math.PI, m = Math.max(12, Math.round(R * Math.abs(phA - phB) / 1.5));
    for (var j = 1; j < m; j++) { var ph = phA + (phB - phA) * j / m; ctl.push(P(R * Math.cos(ph), cv + R * Math.sin(ph), -o.drop)); }
    for (i = n1; i >= 1; i--) { k = i / n1; ctl.push(P(o.g + o.L1 * sa * k, o.W0 + o.L1 * ca * k, -o.drop * k)); }
    ctl.push(P(o.g, o.W0, 0)); ctl.push(P(o.g * 0.7, o.W0 * 0.5, 0)); ctl.push(P(0, 0, 0));
    var r = makeRoute(smoothLine(ctl, 0.5), "branch");
    // Where the loop passes through the parent's wall, going out and coming back.
    var vOf = function (q) { return (r.X[q] - b.x) * nx + (r.Z[q] - b.z) * nz; }, qa = 0, qb = r.X.length - 1;
    while (qa < r.X.length - 1 && vOf(qa) < o.W0 * 0.92) qa++;
    while (qb > 0 && vOf(qb) < o.W0 * 0.92) qb--;
    r.sFrom = Math.max(0, r.S[qa] - 0.6); r.sTo = Math.min(r.len, r.S[qb] + 0.6);
    function nearestParentS(q) {
      var best = 1e9, bs = sAt;
      for (var p = 0; p < parent.X.length; p++) {
        if (Math.abs(parent.S[p] - sAt) > o.g + 12) continue;
        var d = Math.hypot(parent.X[p] - r.X[q], parent.Z[p] - r.Z[q]); if (d < best) { best = d; bs = parent.S[p]; }
      }
      return bs;
    }
    r.holes = [nearestParentS(qa), nearestParentS(qb)].map(function (ps) { return { s0: ps - o.wb * 1.08, s1: ps + o.wb * 1.08, side: side }; });
    r.side = side; r.parent = parent; r.at = sAt; r.drop = o.drop; r.startS = 0;
    return r;
  }

  // ---- the walls: one continuous tunnel along a route ---------------------------------------------
  // Wendell, 10 October 2026: "the cave is a bit narrow and there are major segments". The tunnel is now one surface swept
  // along the route (a rounded arch with a flat floor, a ring every unit, rock bumps that flow along it), so nothing breaks
  // between stretches. openAt(s) widens it along its length; update(k) breathes it. Holes cut the openings a branch leaves by.
  var PROF = 20, PX = [], PY = [];
  (function () {
    for (var j = 0; j < PROF; j++) {
      var t = (j / PROF) * Math.PI * 2, cx = Math.cos(t), sy = Math.sin(t);
      PX.push((cx < 0 ? -1 : 1) * Math.pow(Math.abs(cx), 0.55));
      PY.push(0.04 + 0.96 * (sy < 0 ? -1 : 1) * Math.pow(Math.abs(sy), 0.55)); // the floor sits at -0.92 of the height
    }
  })();
  function buildTube(THREE, route, o) {
    var s0 = o.sFrom || 0, s1 = o.sTo == null ? route.len : o.sTo, n = Math.max(2, Math.floor(s1 - s0) + 1), ds = (s1 - s0) / (n - 1);
    var ring = [], i, j;
    for (i = 0; i < n; i++) { var s = s0 + i * ds, a = at(route, s); ring.push({ s: s, x: a.x, y: a.y, z: a.z, nx: -a.fz, nz: a.fx }); }
    var pos = new Float32Array(n * PROF * 3), jit = new Float32Array(n * PROF), seed = o.seed || 0;
    for (i = 0; i < n; i++) for (j = 0; j < PROF; j++) {
      var floor = PY[j] < -0.8, sv = ring[i].s;
      jit[i * PROF + j] = 1 + (floor ? 0.01 : 0.075) * (0.6 * Math.sin(sv * 0.37 + j * 2.1 + seed) + 0.4 * Math.sin(sv * 0.11 + j * 0.7 + seed * 1.3));
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var mesh = new THREE.Mesh(geo, o.rock); mesh.frustumCulled = false;
    var t = { mesh: mesh, holes: [], k: -1, dirty: true, n: n, ring: ring, w: o.w, h: o.h };
    t.index = function () {
      var idx = [];
      for (var i = 0; i < n - 1; i++) for (var j = 0; j < PROF; j++) {
        var j1 = (j + 1) % PROF, cut = false;
        for (var q = 0; q < t.holes.length && !cut; q++) {
          var H = t.holes[q];
          cut = ring[i].s >= H.s0 && ring[i + 1].s <= H.s1 && PX[j] * H.side > 0.05 && PX[j1] * H.side > 0.05 && PY[j] > -0.86 && PY[j1] > -0.86 && PY[j] < 0.8 && PY[j1] < 0.8;
        }
        if (cut) continue;
        var a = i * PROF + j, b = i * PROF + j1, c = (i + 1) * PROF + j, d = (i + 1) * PROF + j1;
        idx.push(a, c, b, b, c, d);
      }
      geo.setIndex(idx); t.dirty = true;
    };
    t.addHole = function (H) { t.holes.push(H); t.index(); };
    t.update = function (k) {
      if (Math.abs(k - t.k) < 0.0008 && !t.dirty) return;
      t.k = k; t.dirty = false;
      var kh = 1 + (k - 1) * 0.5;
      for (var i = 0; i < n; i++) {
        var R = ring[i], wf = o.openAt(R.s) * k * o.w;
        for (var j = 0; j < PROF; j++) {
          var p = (i * PROF + j) * 3, jt = jit[i * PROF + j], fl = PY[j] < -0.8, xx = PX[j] * wf * jt;
          pos[p] = R.x + R.nx * xx; pos[p + 1] = R.y + (fl ? PY[j] * o.h : PY[j] * o.h * kh * jt); pos[p + 2] = R.z + R.nz * xx;
        }
      }
      geo.attributes.position.needsUpdate = true;
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
    };
    t.index(); t.update(1);
    return t;
  }
  // The path stays lit: small warm stones down both edges of the floor.
  function buildPebbles(THREE, route, w, h, s0, s1) {
    var count = Math.floor((s1 - s0) / 2.5) * 2 + 2, pe = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.13, 0), new THREE.MeshBasicMaterial({ color: 0xffe0a0 }), count), c = 0;
    var M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), Sc = new THREE.Vector3(1, 1, 1);
    pe.frustumCulled = false;
    for (var s = s0 + 1; s < s1 - 1 && c < count - 1; s += 2.5) {
      var a = at(route, s);
      [-1, 1].forEach(function (sd) { P.set(a.x + -a.fz * sd * w * 0.3, a.y - h * 0.92 + 0.1, a.z + a.fx * sd * w * 0.3); M.compose(P, Q, Sc); pe.setMatrixAt(c++, M); });
    }
    pe.count = c; pe.instanceMatrix.needsUpdate = true;
    return pe;
  }

  // A glowing marker floating just ahead of a stand; the lit ones stay lit.
  function buildMarker(THREE, w, h, color) {
    return new THREE.Mesh(new THREE.SphereGeometry(Math.min(0.55, w * 0.14), 14, 10), new THREE.MeshBasicMaterial({ color: color || 0xfff1b0, transparent: true, opacity: 0.4 }));
  }
  // A lantern that stays where the player branched.
  function buildLantern(THREE) {
    var g = new THREE.Group(), pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.1, 6), new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 0.9 }));
    pole.position.y = 0.55; g.add(pole);
    var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffc860 }));
    lamp.position.y = 1.2; g.add(lamp);
    var cap = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 0.9 }));
    cap.position.y = 1.5; g.add(cap);
    g.userData.lamp = lamp;
    return g;
  }
  // ---- the avatar: a jointed, faceless human wearing the charge -------------------------------------
  // Built from three.js primitives (rounded capsules made by lathe, and one shared sphere), in a 2.2-unit design height and
  // scaled up by AVATAR_H / 2.2. Every joint is a named group that turns: hip, knee and ankle on each leg, shoulder and elbow
  // on each arm, the spine, the neck. Each charge has a look at the start and a looser look after the last step (choices):
  // tightness is narrow and drawn in, tension is tall and taut, numbness is fogged and translucent, strength is bright.
  // sx and sy are scale, op is opacity.
  var AVATAR_LOOK = {
    constriction: { color: 0xc8785f, sx: [0.66, 1.0], sy: [0.96, 1.0], op: [1, 1], glow: [0.08, 0.3] },
    tension: { color: 0xd8b658, sx: [0.82, 1.0], sy: [1.2, 1.02], op: [1, 1], glow: [0.05, 0.25] },
    numbness: { color: 0xa8bcd2, sx: [0.95, 1.0], sy: [1.0, 1.0], op: [0.35, 0.85], glow: [0.02, 0.2] },
    strength: { color: 0x5fe0b0, sx: [1.0, 1.04], sy: [1.0, 1.0], op: [1, 1], glow: [0.95, 0.5] },
    other: { color: 0xb89aff, sx: [0.9, 1.0], sy: [1.0, 1.0], op: [1, 1], glow: [0.15, 0.3] },
  };
  var AVATAR_H = 3.6, DESIGN_H = 2.2, HIP_Y = 1.15, THIGH = 0.52, SHIN = 0.5, LEG_WORLD = (THIGH + SHIN) * AVATAR_H / DESIGN_H;
  // A rounded limb: a lathe of two hemispheres joined by a straight run of length S, radius r, centred on the origin along y.
  function capsuleGeo(THREE, r, S) {
    var pts = [], n = 3, i, a;
    for (i = 0; i <= n; i++) { a = -Math.PI / 2 + (Math.PI / 2) * i / n; pts.push(new THREE.Vector2(Math.max(1e-4, Math.cos(a) * r), -S / 2 + Math.sin(a) * r)); }
    for (i = 0; i <= n; i++) { a = (Math.PI / 2) * i / n; pts.push(new THREE.Vector2(Math.max(1e-4, Math.cos(a) * r), S / 2 + Math.sin(a) * r)); }
    return new THREE.LatheGeometry(pts, 8);
  }
  function buildAvatar(THREE, texture) {
    var look = AVATAR_LOOK[texture] || AVATAR_LOOK.other;
    var mat = new THREE.MeshStandardMaterial({ color: look.color, roughness: 0.7, emissive: look.color, emissiveIntensity: 0.12, transparent: true });
    var mat2 = new THREE.MeshStandardMaterial({ color: new THREE.Color(look.color).multiplyScalar(0.6), roughness: 0.8, emissive: look.color, emissiveIntensity: 0.06, transparent: true });
    var J = {}, ball = new THREE.SphereGeometry(1, 10, 8);
    function node(name, parent, x, y, z) { var g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); J[name] = g; return g; }
    function put(geo, m, parent, x, y, z, sx, sy, sz) { var o = new THREE.Mesh(geo, m); o.position.set(x, y, z); if (sx) o.scale.set(sx, sy, sz); parent.add(o); return o; }
    var fit = new THREE.Group(); fit.scale.setScalar(AVATAR_H / DESIGN_H);
    var body = new THREE.Group(); fit.add(body);                  // the look scales this one; the soles stay on the floor
    var hips = node("hips", body, 0, HIP_Y, 0);
    put(ball, mat2, hips, 0, 0, 0, 0.19, 0.12, 0.13);              // pelvis
    var gT = capsuleGeo(THREE, 0.105, THIGH), gS = capsuleGeo(THREE, 0.08, SHIN), gF = capsuleGeo(THREE, 0.06, 0.16);
    var gU = capsuleGeo(THREE, 0.06, 0.34), gL = capsuleGeo(THREE, 0.05, 0.31);
    [["L", 1], ["R", -1]].forEach(function (sd) {
      var n = sd[0], k = sd[1];
      var hip = node("hip" + n, hips, k * 0.1, -0.02, 0); put(gT, mat2, hip, 0, -THIGH / 2, 0);
      var knee = node("knee" + n, hip, 0, -THIGH, 0); put(gS, mat2, knee, 0, -SHIN / 2, 0);
      var ankle = node("ankle" + n, knee, 0, -SHIN, 0); put(gF, mat2, ankle, 0, -0.05, 0.07).rotation.x = Math.PI / 2;
    });
    var spine = node("spine", hips, 0, 0.02, 0);
    put(capsuleGeo(THREE, 0.15, 0.36), mat, spine, 0, 0.24, 0, 1.15, 1, 0.78);   // torso
    var chest = put(ball, new THREE.MeshBasicMaterial({ color: 0xfff1d0, transparent: true, opacity: 0.8 }), spine, 0, 0.36, 0.115, 0.05, 0.05, 0.05);
    var neck = node("neck", spine, 0, 0.56, 0); put(capsuleGeo(THREE, 0.05, 0.08), mat, neck, 0, 0.04, 0);
    var head = node("head", neck, 0, 0.12, 0); put(ball, mat, head, 0, 0.1, 0, 0.13, 0.15, 0.14);       // smooth: no face
    [["L", 1], ["R", -1]].forEach(function (sd) {
      var n = sd[0], k = sd[1];
      var sh = node("shoulder" + n, spine, k * 0.25, 0.5, 0); put(ball, mat, sh, 0, 0, 0, 0.075, 0.075, 0.075); put(gU, mat, sh, 0, -0.17, 0);
      var el = node("elbow" + n, sh, 0, -0.34, 0); put(gL, mat, el, 0, -0.155, 0);
      var wr = node("wrist" + n, el, 0, -0.31, 0); put(ball, mat, wr, 0, -0.04, 0, 0.055, 0.055, 0.055);
    });
    var o = new THREE.Group(); o.add(fit);                        // the outer group is what moves
    o.userData = { body: body, mat: mat, mat2: mat2, chest: chest, look: look, loose: -1, feet: 0, J: J, g: 0, amp: 0.3, stepsIn: 0, stepsOut: 0, stepIdx: 0 };
    return o;
  }
  // loose runs from 0 (as the player brought it) to 1 (after the last step); it eases in a step at a time.
  function loosenAvatar(av, loose, breath) {
    var d = av.userData, l = d.look, k = Math.max(0, Math.min(1, loose));
    function mix(p) { return p[0] + (p[1] - p[0]) * k; }
    d.body.scale.set(mix(l.sx), mix(l.sy), mix(l.sx));
    d.mat.opacity = d.mat2.opacity = mix(l.op);
    d.mat.emissiveIntensity = mix(l.glow) + 0.18 * breath; d.mat2.emissiveIntensity = d.mat.emissiveIntensity * 0.5;
    d.chest.material.opacity = 0.55 + 0.4 * breath;
    d.chest.scale.setScalar(0.05 * (0.85 + 0.35 * breath));
  }
  // The pose. clk is the walk clock in seconds (two steps a second, so the phase turns once a second); moving blends the walk
  // in and out; stepLen is the world length of a step now, which sets how far the legs swing. Hips swing from the hip joint
  // with the knee bending as the leg comes through, the arms swing against the legs, the torso turns a little and the hips
  // sink as the legs spread. Standing, the figure breathes: the chest and shoulders lift with the cave's breath.
  function poseAvatar(av, clk, moving, dt, breath, stepLen, still) {
    var d = av.userData, J = d.J, ph = clk * Math.PI * STEPS_PER_S;
    d.g += ((moving ? 1 : 0) - d.g) * Math.min(1, dt * 9);
    var g = d.g, target = Math.max(0.2, Math.min(0.62, Math.asin(Math.min(0.9, stepLen / 2 / LEG_WORLD))));
    d.amp += (target - d.amp) * Math.min(1, dt * 6);
    var A = d.amp, sL = Math.sin(ph), sR = Math.sin(ph + Math.PI);
    J.hipL.rotation.x = -A * sL * g; J.hipR.rotation.x = -A * sR * g;
    J.kneeL.rotation.x = g * (0.12 + 0.95 * Math.max(0, Math.cos(ph))); J.kneeR.rotation.x = g * (0.12 + 0.95 * Math.max(0, Math.cos(ph + Math.PI)));
    J.ankleL.rotation.x = -(J.hipL.rotation.x + J.kneeL.rotation.x) * 0.8; J.ankleR.rotation.x = -(J.hipR.rotation.x + J.kneeR.rotation.x) * 0.8;
    var B = A * 0.85, b = still ? 0.5 : breath;
    J.shoulderL.rotation.x = B * sL * g; J.shoulderR.rotation.x = B * sR * g;
    J.elbowL.rotation.x = -g * (0.25 + 0.35 * Math.max(0, -sL)); J.elbowR.rotation.x = -g * (0.25 + 0.35 * Math.max(0, -sR));
    J.shoulderL.rotation.z = 0.09 + 0.05 * b; J.shoulderR.rotation.z = -(0.09 + 0.05 * b);
    J.spine.rotation.x = 0.07 * g; J.spine.rotation.y = 0.14 * sL * g;
    J.hips.rotation.y = -0.1 * sL * g;
    J.hips.position.y = HIP_Y - g * LEG_WORLD / (AVATAR_H / DESIGN_H) * (1 - Math.cos(A)) * 0.85 * Math.abs(sL);
    // the breath, when standing: the chest swells and the shoulders and head lift a little
    var idle = 1 - g;
    J.spine.scale.set(1 + 0.05 * (b - 0.5) * idle, 1 + 0.04 * (b - 0.5) * idle, 1 + 0.06 * (b - 0.5) * idle);
    J.shoulderL.position.y = J.shoulderR.position.y = 0.5 + 0.03 * (b - 0.5) * idle;
    J.neck.rotation.x = 0.05 * (0.5 - b) * idle;
    // footfalls: step n lands at n / STEPS_PER_S seconds into the stretch, in the inhale up to STEPS_IN of them
    var idx = Math.floor(clk * STEPS_PER_S + 1e-9);
    while (d.stepIdx < idx) { d.stepIdx++; if (d.stepIdx <= STEPS_IN) d.stepsIn++; else d.stepsOut++; }
  }
  // Bytes of geometry a group holds, counted once per geometry (the page test holds the avatar to about 50 KB).
  function geometryBytes(root) {
    var seen = [], total = 0;
    root.traverse(function (m) {
      var g = m.geometry; if (!g || seen.indexOf(g) >= 0) return; seen.push(g);
      Object.keys(g.attributes).forEach(function (k) { total += g.attributes[k].array.byteLength; });
      if (g.index) total += g.index.array.byteLength;
    });
    return total;
  }

  // One object per element, built from rounded shapes (choices): fire is a cluster of flames, water a still pool, wood a
  // young tree, metal a crystal spire, earth a boulder. Each is the same wherever it appears.
  function buildElement(THREE, name, r) {
    var g = new THREE.Group(), e = lookup(ELEMENTS, name);
    function mat(c, em, ei, rough) { return new THREE.MeshStandardMaterial({ color: c, roughness: rough == null ? 0.7 : rough, emissive: em || 0x000000, emissiveIntensity: ei || 0 }); }
    function add(geo, m, x, y, z) { var o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; }
    if (name === "Anger") { // Fire: a ring of stones and three flames
      add(new THREE.TorusGeometry(r * 0.55, r * 0.1, 8, 14), mat(0x4a3a34), 0, r * 0.1, 0).rotation.x = Math.PI / 2;
      [[0, 1], [0.25, 0.7], [-0.25, 0.75]].forEach(function (f) { var fl = add(new THREE.ConeGeometry(r * 0.2, r * f[1] * 1.5, 10), mat(0xe0602a, 0xff7a20, 0.9), f[0] * r, r * f[1] * 0.75, 0); fl.userData.flame = true; });
    } else if (name === "Sadness") { // Water: a still pool
      add(new THREE.CylinderGeometry(r * 0.7, r * 0.75, r * 0.12, 24), mat(0x3a78d0, 0x2a58a0, 0.35, 0.2), 0, r * 0.06, 0);
      add(new THREE.TorusGeometry(r * 0.72, r * 0.06, 8, 24), mat(0x5a5f6a), 0, r * 0.1, 0).rotation.x = Math.PI / 2;
    } else if (name === "Joy") { // Wood: a young tree
      add(new THREE.CylinderGeometry(r * 0.08, r * 0.13, r * 1.4, 8), mat(0x6a4a2a), 0, r * 0.7, 0);
      add(new THREE.SphereGeometry(r * 0.5, 14, 10), mat(0x4aa84a, 0x2a7a2a, 0.2), 0, r * 1.5, 0);
      add(new THREE.SphereGeometry(r * 0.3, 12, 8), mat(0x5ac85a, 0x2a7a2a, 0.2), r * 0.3, r * 1.2, r * 0.1);
    } else if (name === "Fear") { // Metal: a crystal spire
      add(new THREE.OctahedronGeometry(r * 0.35, 0), mat(0xc8ccd4, 0x6a7080, 0.25, 0.15), 0, r * 0.9, 0).scale.set(0.6, 2, 0.6);
      add(new THREE.OctahedronGeometry(r * 0.2, 0), mat(0xaab0bc, 0x6a7080, 0.2, 0.15), r * 0.4, r * 0.35, 0).scale.set(0.6, 1.6, 0.6);
    } else { // Earth: a boulder with moss
      add(new THREE.DodecahedronGeometry(r * 0.5, 0), mat(0xa8844a, 0x4a3a1a, 0.1, 0.95), 0, r * 0.4, 0).scale.set(1.2, 0.8, 1);
      add(new THREE.SphereGeometry(r * 0.2, 10, 8), mat(0x6a8a4a), r * 0.2, r * 0.75, 0).scale.set(1.2, 0.5, 1);
    }
    return g;
  }

  // The daemon: one body for all seven, no face, fused rounded shapes. It differs by colour, posture and what it carries.
  function buildDaemon(THREE, d, h, seg) {
    var g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: d[3], roughness: 0.7, emissive: d[3], emissiveIntensity: 0.12 });
    function part(geo, x, y, z, sx, sy, sz) { var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); g.add(m); return m; }
    var S = new THREE.SphereGeometry(1, (seg || [20, 14])[0], (seg || [20, 14])[1]), stoop = d[0] === "victim" ? 0.35 : d[0] === "damaged-self" ? 0.2 : 0;
    var u = h * 0.5;
    var torso = part(S, 0, u * 0.55, 0, u * 0.28, u * 0.5, u * 0.22);
    torso.rotation.x = stoop;
    part(S, 0, u * 1.18, stoop * u * 0.4, u * 0.19, u * 0.21, u * 0.19);            // the head: smooth, no face
    part(S, -u * 0.3, u * 0.6, 0, u * 0.09, u * 0.4, u * 0.09).rotation.z = 0.15;      // arms
    part(S, u * 0.3, u * 0.6, 0, u * 0.09, u * 0.4, u * 0.09).rotation.z = -0.15;
    part(S, -u * 0.12, u * 0.1, 0, u * 0.1, u * 0.28, u * 0.1);                       // legs
    part(S, u * 0.12, u * 0.1, 0, u * 0.1, u * 0.28, u * 0.1);
    var dark = new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.5, emissive: 0x303030 });
    function carry(m) { g.add(m); }
    var c = d[4];
    if (c === "shield") { var sh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), dark); sh.scale.set(u * 0.3, u * 0.38, u * 0.05); sh.position.set(-u * 0.42, u * 0.65, u * 0.18); carry(sh); }
    if (c === "rod") { var rd = new THREE.Mesh(new THREE.CylinderGeometry(u * 0.025, u * 0.025, u * 1.5, 8), dark); rd.position.set(u * 0.42, u * 0.7, 0); carry(rd); }
    if (c === "lens") { var ln = new THREE.Mesh(new THREE.TorusGeometry(u * 0.16, u * 0.03, 8, 20), dark); ln.position.set(u * 0.42, u * 0.9, u * 0.1); carry(ln); }
    if (c === "wrench") { var wr = new THREE.Mesh(new THREE.BoxGeometry(u * 0.06, u * 0.5, u * 0.06), dark); wr.position.set(u * 0.42, u * 0.55, u * 0.05); wr.rotation.z = -0.5; carry(wr); }
    if (c === "bundle") { var bu = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), dark); bu.scale.set(u * 0.28, u * 0.22, u * 0.22); bu.position.set(0, u * 0.9, -u * 0.25); carry(bu); }
    if (c === "crack") { var cr = new THREE.Mesh(new THREE.BoxGeometry(u * 0.03, u * 0.7, u * 0.4), new THREE.MeshBasicMaterial({ color: 0x14080a })); cr.position.set(0, u * 0.6, u * 0.12); carry(cr); }
    if (c === "orb") { var ob = new THREE.Mesh(new THREE.SphereGeometry(u * 0.14, 14, 10), new THREE.MeshBasicMaterial({ color: 0xc8fff0 })); ob.position.set(0, u * 0.7, u * 0.2); carry(ob); g.userData.orb = ob; }
    g.userData.mat = mat;
    return g;
  }

  // ---- the page --------------------------------------------------------------------------
  // Nothing on this page is selectable, and a long press does nothing: no text selection or magnifier, no callout menu, no tap
  // highlight, no double-tap zoom. The canvas and the ring take touch-action:none (they are the hold area); buttons use
  // manipulation, so they stay tappable. Typed text in an input is the one thing that can be selected.
  var CSS = "html,body,.oagc,.oagc *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}" +
    "html{touch-action:manipulation}input,textarea,.oagc input,.oagc textarea{-webkit-user-select:text;user-select:text}" +
    ".oagc{position:fixed;inset:0;z-index:900;background:#0e0e1a;color:#e0e0e0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;flex-direction:column;overflow:hidden}" +
    ".oagc canvas{display:block;position:absolute;inset:0;width:100%;height:100%;touch-action:none}" +
    ".oagc-stage{position:absolute;inset:0;touch-action:none}" +
    ".oagc-card{position:absolute;left:0;right:0;bottom:0;z-index:2;padding:.7rem 1rem calc(.7rem + env(safe-area-inset-bottom));background:rgba(20,20,40,.96);border-top:1px solid rgba(255,255,255,.12);max-height:62vh;overflow-y:auto;touch-action:manipulation}" +
    // the pane: small, in the scene, above the figure's head with a tail pointing down at it
    ".oagc-pane{position:absolute;left:0;top:0;z-index:3;width:max-content;max-width:min(270px,calc(100vw - 24px));padding:.45rem .65rem .5rem;background:rgba(12,12,28,.8);border:1px solid rgba(255,241,176,.55);border-radius:12px;color:#f4f4fa;font-size:15px;line-height:1.3;will-change:transform;cursor:pointer;touch-action:manipulation}" +
    ".oagc-pane strong{display:block;color:#fff1b0;font-size:16px;margin-bottom:.15rem}.oagc-pane span{display:block}.oagc-pane small{display:block;margin-top:.3rem;color:#aab0c4;font-size:12px}" +
    ".oagc-pane:after{content:'';position:absolute;left:var(--tail,50%);bottom:-8px;margin-left:-8px;border:8px solid transparent;border-bottom:0;border-top-color:rgba(255,241,176,.55)}" +
    // the modal: the pane grown large, near the top so the figure and the way ahead stay in sight below it
    ".oagc-modal{position:absolute;left:12px;right:12px;top:58px;z-index:4;max-width:420px;margin:0 auto;max-height:calc(62vh - 58px);overflow-y:auto;padding:.8rem .9rem;background:rgba(12,12,28,.86);border:1px solid rgba(255,241,176,.5);border-radius:16px;opacity:0;transform:scale(.35);pointer-events:none;transition:opacity .22s,transform .25s;touch-action:manipulation}" +
    ".oagc-modal.open{opacity:1;transform:none;pointer-events:auto}" +
    ".oagc-modal h2{margin:0 0 .35rem;font-size:1.15rem;color:#fff1b0}.oagc-modal p{margin:.35rem 0;font-size:1rem;line-height:1.35}.oagc-modal .oagc-row{margin-top:.5rem}" +
    ".oagc-card h2{margin:0 0 .3rem;font-size:1rem;color:#fff}.oagc-card h3{margin:.55rem 0 0;font-size:.82rem;color:#aab;font-weight:600}.oagc-card p{margin:.3rem 0;font-size:.92rem}" +
    ".oagc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:normal;pointer-events:none}" +
    ".oagc-row{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.4rem}" +
    ".oagc button{background:#64c8ff;color:#10142a;border:none;border-radius:8px;padding:.5rem .8rem;font-size:.9rem;font-weight:600;min-height:44px;cursor:pointer;width:auto;margin:0;touch-action:manipulation}" +
    ".oagc button:disabled{opacity:.4}" +
    ".oagc button.alt{background:rgba(20,20,40,.85);border:1px solid rgba(255,255,255,.3);color:#e0e0e0;font-weight:400}" +
    ".oagc button[aria-pressed=true]{outline:2px solid #fff}" +
    ".oagc button.oagc-calm,.oagc button.oagc-ringbtn{position:absolute;top:10px;background:rgba(20,20,40,.7);border:1px solid rgba(255,255,255,.35);color:#e8e8f0;font-weight:500;z-index:4}" +
    ".oagc button.oagc-calm{right:10px}.oagc button.oagc-ringbtn{left:10px}" +
    ".oagc-ring{position:absolute;left:50%;bottom:14px;width:88px;height:88px;margin-left:-44px;border-radius:50%;border:3px solid rgba(255,241,176,.85);background:rgba(255,241,176,.12);display:flex;align-items:center;justify-content:center;text-align:center;font-size:.68rem;line-height:1.15;color:#fff1b0;z-index:2;touch-action:none}" +
    ".oagc-fade{position:absolute;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity .5s;z-index:5}" +
    ".oagc-home{padding:2rem 1rem;max-width:34rem;margin:auto;text-align:center}.oagc-home h1{font-size:1.5rem;color:#fff}";

  // The page-wide guards (iOS long press and pinch): no context menu, no selection start, no gesture zoom. Typed text in an
  // input is left alone. Added once; the cave test dispatches these events and checks they were cancelled.
  var guarded = false;
  function guardPage() {
    if (guarded) return; guarded = true;
    function inField(e) { var t = e.target && (e.target.nodeType === 3 ? e.target.parentNode : e.target); return !!(t && t.closest && t.closest("input,textarea")); }
    document.addEventListener("contextmenu", function (e) { if (!inField(e)) e.preventDefault(); }, true);
    document.addEventListener("selectstart", function (e) { if (!inField(e)) e.preventDefault(); }, true);
    document.addEventListener("dragstart", function (e) { e.preventDefault(); }, true);
    ["gesturestart", "gesturechange", "gestureend"].forEach(function (n) { document.addEventListener(n, function (e) { e.preventDefault(); }, { passive: false }); });
  }
  // Touches on the hold area (the canvas, the ring) are never scrolls, zooms or long presses.
  function holdArea(node) {
    ["touchstart", "touchmove"].forEach(function (n) { node.addEventListener(n, function (e) { if (e.cancelable) e.preventDefault(); }, { passive: false }); });
  }

  function start() {
    if (!document.getElementById("oagc-css")) document.head.appendChild(el("style", { id: "oagc-css", text: CSS }));
    guardPage();
    var root = document.getElementById("cave-root") || document.body;
    var home = el("div", { class: "oagc", "data-cave-home": "" }, [el("div", { class: "oagc-home" }, [
      el("h1", { text: "The Cave of Lessons" }),
      el("p", { text: "Your body is the world. Tap where the charge is, and go in." }),
      el("button", { "data-cave-dive": "", text: "Find the place", onclick: function () {
        window.OAGBody.pick().then(function (r) { if (r) dive(r.label, home); });
      } }),
    ])]);
    root.appendChild(home);
  }

  var running = null;
  function spotNamed(A, label) {
    var l = String(label).trim().toLowerCase();
    return A.spots.filter(function (s) { return s.words.toLowerCase() === l; })[0];
  }
  function dive(label, home) {
    load().then(function (A) {
      var spot = spotNamed(A, label);
      if (!spot) {
        // A typed place the figure does not name is not guessed at; the player is sent back to tap the figure.
        alert("That place is not on the figure yet. Tap the figure to choose one.");
        return;
      }
      enter(A, spot, home);
    }).catch(function (e) { alert("The cave could not open: " + e.message); });
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // One sitting: the places named so far, each its own cave, joined by paths. The renderer stays up between them.
  function enter(A, firstSpot, home) {
    var THREE = A.THREE;
    var wrap = el("div", { class: "oagc", "data-cave-chamber": firstSpot.id });
    var fade = el("div", { class: "oagc-fade" });
    // The canvas fills the page. The doorway (charge, feeling) and the path between places keep the bottom panel (card). Inside
    // the cave the words live in the pane, a small panel in the scene that follows the figure; at a stop, or when tapped, it
    // grows into the modal, which holds every choice the stop needs before the walk goes on.
    var canvasBox = el("div", { class: "oagc-stage" });
    var card = el("div", { class: "oagc-card", "data-cave-card": "", style: "display:none" });
    var pane = el("div", { class: "oagc-pane", "data-cave-pane": "", role: "button", tabindex: "0", style: "display:none" });
    var modal = el("div", { class: "oagc-modal", "data-cave-modal": "", "aria-hidden": "true" });
    var stat = el("div", { class: "oagc-sr", "data-cave-signtext": "", "aria-live": "polite" }); // the words as page text, and the state marks
    wrap.appendChild(canvasBox); wrap.appendChild(pane); wrap.appendChild(modal); wrap.appendChild(card); wrap.appendChild(stat); wrap.appendChild(fade);
    wrap.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    document.body.appendChild(wrap);
    fade.style.opacity = 1; setTimeout(function () { fade.style.opacity = 0; }, 30); // the dive: in from black
    home.style.display = "none";

    var renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch (e) {
      card.style.display = ""; card.textContent = "This device cannot show the cave. The body map and the game still work."; return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    canvasBox.appendChild(renderer.domElement);
    var scene = new THREE.Scene(); scene.background = new THREE.Color(0x0c0c16); scene.fog = new THREE.FogExp2(0x0c0c16, 0.02);
    var camera = new THREE.PerspectiveCamera(70, 1, 0.1, 260);

    // The sitting. sens[i] = { id, spot, texture, element, saved, passed, blocked: [], skipped: [] }.
    // walk = { route, s, s0, D, t, target (a stop on the route), arrived, blk }. stack holds where each branch left from.
    // speed scales the walk clock (the test sets it above 1 to cross a stretch faster than one breath); it is 1 in play.
    var state = { sens: [], cur: null, mode: "portal", dress: null, look: { yaw: 0, pitch: 0 }, walk: null, stack: [], calm: false, ringOn: false, held: false, speed: 1, touched: false, layout: null, walkedOnce: false, modal: false, auto: null };
    var parts = {}, ch = null, flight = null, busy = false, tweens = [], blockN = 0, snapCam = true, avatar = null, lamp = null, hemi = null, glow = [];
    var docked = true;
    // The light of the stretch being walked (lk eases toward the table row), the walls' openness per stretch, and the surge on
    // a choice. revealed is the last stretch the player has chosen to walk; the ones past it stay gathered shut and dark until
    // the choice at their marker opens them (Wendell, 10 October: the scene changes in response to the choice).
    var lk = { idx: 0, light: new THREE.Color(STEP_LOOK[0].light), fog: new THREE.Color(STEP_LOOK[0].fog), fogK: STEP_LOOK[0].fogK, hemi: STEP_LOOK[0].hemi, flash: 0 };
    var openCur = STEP_LOOK.map(function () { return CLOSED; }), revealed = -1;
    var page = { title: "", text: "", foot: "", has: false };
    var camPos = new THREE.Vector3(), lookAt = new THREE.Vector3(), looseNow = 0, last = performance.now(), lanternsOn = [];
    var br = { b: 0.5, target: 0.5, d: 0, t0: performance.now() / 1000, ring: 0, ringHeld: false, lastRing: -1e9, k: 1 };
    var WARM = new THREE.Color(0xffa860);

    function clearScene() {
      while (scene.children.length) scene.remove(scene.children[0]);
      ch = null; flight = null; busy = false; tweens = []; avatar = null; lamp = null; hemi = null; glow = []; lanternsOn = [];
      state.walk = null; state.stack = []; state.auto = null; snapCam = true; page.has = false;
      lk.idx = 0; lk.flash = 0; revealed = -1; openCur = STEP_LOOK.map(function () { return CLOSED; });
      scene.background.setHex(0x0c0c16); scene.fog.color.setHex(0x0c0c16);
    }
    function addSensation(spot) {
      var s = { id: spot.id, spot: spot, texture: null, element: null, saved: false, passed: 0, blocked: [], skipped: [] };
      state.sens.push(s); return s;
    }
    function size() {
      var w = canvasBox.clientWidth || 1, h = canvasBox.clientHeight || 1;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    function tween(ms, fn, done) { tweens.push({ t0: performance.now(), ms: ms, fn: fn, done: done }); }
    function ease(k) { return k * k * (3 - 2 * k); }
    function me() { return state.cur; }

    // ---- breath and calm -------------------------------------------------------------------
    var calmBtn = el("button", { class: "oagc-calm", "data-cave-calm": "", "aria-pressed": "false", text: "Calm", onclick: function () {
      state.calm = !state.calm; calmBtn.setAttribute("aria-pressed", String(state.calm)); syncRing();
    } });
    var ringBtn = el("button", { class: "oagc-ringbtn", "data-cave-ringbtn": "", "aria-pressed": "false", text: "Breath ring", onclick: function () {
      state.ringOn = !state.ringOn; ringBtn.setAttribute("aria-pressed", String(state.ringOn)); syncRing();
    } });
    var ring = el("div", { class: "oagc-ring", "data-cave-ring": "", text: "Hold to breathe in. Let go to breathe out." });
    function ringDown(e) { e.preventDefault(); try { ring.setPointerCapture(e.pointerId); } catch (x) {} br.ringHeld = true; br.lastRing = performance.now() / 1000; }
    function ringUp() { br.ringHeld = false; br.lastRing = performance.now() / 1000; }
    holdArea(ring);
    ring.addEventListener("pointerdown", ringDown); ring.addEventListener("pointerup", ringUp); ring.addEventListener("pointercancel", ringUp);
    function syncRing() {
      var show = state.ringOn && !state.calm;
      if (show && !ring.parentNode) canvasBox.appendChild(ring); else if (!show && ring.parentNode) ring.remove();
      if (!show) br.ringHeld = false;
    }
    canvasBox.appendChild(calmBtn); canvasBox.appendChild(ringBtn);
    function breathStep(dt, nowS) {
      var T = BREATH_S, u, wk = state.walk;
      if (wk && wk.moving && !state.auto && !state.calm && !(state.ringOn && nowS - br.lastRing < HOLD_ABOUT_AFTER)) br.t0 = nowS - (wk.t % T);
      if (state.calm) { br.target = 0.5; br.d = 0; }
      else if (state.ringOn && nowS - br.lastRing < HOLD_ABOUT_AFTER) {
        var prev = br.ring;
        br.ring = clamp(br.ring + (br.ringHeld ? dt / BREATH.inS : -dt / BREATH.outS), 0, 1);
        br.target = br.ring; br.d = (br.ring - prev) / Math.max(dt, 1e-3);
      } else {
        var tm = (((nowS - br.t0) % T) + T) % T;
        if (tm < BREATH.inS) { u = tm / BREATH.inS; br.target = 0.5 - 0.5 * Math.cos(Math.PI * u); br.d = (Math.PI / 2) * Math.sin(Math.PI * u) / BREATH.inS; }
        else { u = (tm - BREATH.inS) / BREATH.outS; br.target = 0.5 + 0.5 * Math.cos(Math.PI * u); br.d = -(Math.PI / 2) * Math.sin(Math.PI * u) / BREATH.outS; }
        if (state.ringOn) br.ring = br.target;
      }
      br.b += (br.target - br.b) * Math.min(1, dt * 8);
      br.k = 1 + 0.08 * (br.b - 0.5);
      if (state.calm) { br.b = 0.5; br.k = 1; }
    }
    function paceNow() {
      var wk = state.walk; if (!wk) return 1;
      return wk.t < BREATH.inS ? 0.5 * BREATH_S / BREATH.inS : 0.5 * BREATH_S / BREATH.outS;
    }

    // ---- input: hold to walk, drag to look, tap an object -------------------------------------
    var ray = new THREE.Raycaster(), drag = null, dom = renderer.domElement;
    holdArea(dom);
    dom.addEventListener("pointerdown", function (e) {
      try { dom.setPointerCapture(e.pointerId); } catch (x) {}
      drag = { x: e.clientX, y: e.clientY, moved: 0, t: Date.now() }; state.held = true;
    });
    dom.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY;
      if (drag.moved > 12) {
        state.held = false;
        state.look.yaw = clamp(state.look.yaw - dx * 0.006, -1.5, 1.5);
        state.look.pitch = clamp(state.look.pitch + dy * 0.004, -0.5, 0.6);
      }
    });
    function lift() { state.held = false; drag = null; }
    dom.addEventListener("pointercancel", lift);
    dom.addEventListener("pointerup", function (e) {
      var wasTap = drag && drag.moved < 8 && Date.now() - drag.t < 350; lift();
      if (!wasTap || !ch || busy) return;
      var r = dom.getBoundingClientRect(), c = ctxOf();
      ray.setFromCamera({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }, camera);
      var kids = [];
      if (c && c.elObj) c.elObj.traverse(function (m) { if (m.isMesh) kids.push(m); });
      var hit = ray.intersectObjects(kids)[0];
      if (hit && hit.object.userData.interact) touch();
    });

    // ---- the pane and the modal ------------------------------------------------------------
    function P(text, attrs) { var a = attrs || {}; a.text = text; return el("p", a); }
    function btn(label, attrs, fn, alt) { var a = attrs || {}; a.text = label; a.onclick = fn; if (alt) a["class"] = "alt"; return el("button", a); }
    function row(kids) { return el("div", { class: "oagc-row" }, kids); }
    function choice(opts, picked, onPick) {
      return el("div", { class: "oagc-row" }, opts.map(function (o) {
        return el("button", { class: "alt", "data-cave-choice": o[0], "aria-pressed": String(picked === o[0]), text: o[1], onclick: function () { onPick(o); } });
      }));
    }
    function openModal() {
      if (docked) return;
      var r = pane.getBoundingClientRect(), m = modal.getBoundingClientRect();
      if (r.width) modal.style.transformOrigin = Math.round(r.left + r.width / 2 - m.left) + "px " + Math.round(r.top + r.height / 2 - m.top) + "px";
      state.modal = true; modal.classList.add("open"); modal.setAttribute("aria-hidden", "false"); pane.style.visibility = "hidden";
    }
    function closeModal() { state.modal = false; modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); pane.style.visibility = ""; }
    pane.addEventListener("click", function () { openModal(); });
    // fill puts a page up. The doorway's pages (dock true) are the bottom panel, as they were. Inside the cave the title and the
    // first paragraph are the pane, which follows the figure and stays readable the whole walk; the modal holds the whole page:
    // every paragraph and every choice. A page with choices opens the modal (a stop); a page without them keeps the pane.
    function fill(title, kids, dock) {
      stat.removeAttribute("data-cave-marker"); stat.removeAttribute("data-cave-walking");
      card.innerHTML = ""; stat.innerHTML = ""; modal.innerHTML = ""; docked = !!dock;
      if (docked) {
        closeModal(); pane.style.display = "none";
        card.style.display = "";
        card.appendChild(el("h2", { text: title }));
        kids.forEach(function (k) { card.appendChild(k); });
        return;
      }
      card.style.display = "none";
      var paras = [], foot = "", ctls = [];
      kids.forEach(function (k) { if (k.tagName === "P") { if (k.hasAttribute("data-cave-hint")) foot = k.textContent; else paras.push(k); } else ctls.push(k); });
      stat.appendChild(el("h2", { text: title })); paras.forEach(function (p) { stat.appendChild(el("p", { text: p.textContent })); });
      page.title = title; page.text = paras.length ? paras[0].textContent : ""; page.foot = foot; page.has = true;
      pane.innerHTML = "";
      pane.appendChild(el("strong", { text: title }));
      if (page.text) pane.appendChild(el("span", { text: page.text }));
      if (foot) pane.appendChild(el("small", { text: foot }));
      pane.style.display = "";
      modal.appendChild(el("h2", { text: title }));
      paras.forEach(function (p) { modal.appendChild(p); });
      ctls.forEach(function (c) { modal.appendChild(c); });
      if (ctls.length) { modal.appendChild(row([btn("Look around", { "data-cave-shrink": "" }, closeModal, true)])); openModal(); }
      else { modal.appendChild(row([btn("Keep walking", { "data-cave-close": "" }, closeModal, true)])); closeModal(); }
    }

    // ---- the doorway: one question per page, and the cave changes with each answer -------------
    function portal(s) {
      clearScene(); state.cur = s; state.mode = "portal"; state.look = { yaw: 0, pitch: 0 };
      scene.fog.density = 0.02; camera.position.set(0, 0, 6); camera.rotation.set(0, 0, 0);
      scene.add(new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.12, 10, 36), new THREE.MeshBasicMaterial({ color: 0xfff1b0 })));
      scene.add(new THREE.HemisphereLight(0xffffff, 0x302828, 0.5));
      wrap.setAttribute("data-cave-chamber", s.id);
      s.texture = null; s.element = null; s.passed = 0;
      fill("A doorway at " + s.spot.words, [
        P("What does it feel like there?"),
        choice(TEXTURES.map(function (t) { return [t[0], t[1]]; }), null, function (o) { s.texture = o[0]; form(s); }),
      ], true);
      stat.setAttribute("data-cave-place", "portal");
    }

    // The cave forms around the charge at once, with the avatar standing at the start. The way ahead stays gathered shut until
    // the feeling is named: that choice opens the first stretch.
    function form(s) {
      clearScene(); parts = {}; state.mode = "chamber"; state.look = { yaw: 0, pitch: 0 }; state.touched = false;
      var look = CHARGE_LOOK[s.texture] || CHARGE_LOOK.other, tex = lookup(TEXTURES, s.texture) || TEXTURES[4];
      var G = {}; Object.keys(A.kit).forEach(function (k) { G[k] = geomOf(THREE, A.kit[k]); });
      var w = CHAMBER.w * look.w, h = CHAMBER.h;
      parts.G = G; parts.w = w; parts.h = h; parts.fog = look.fog;
      parts.rock = new THREE.MeshStandardMaterial({ color: tex[2], roughness: 0.95, side: THREE.DoubleSide });
      var main = layoutMain(s.spot.id + ":" + s.texture, w);
      main.group = new THREE.Group(); main.w = w;
      main.openAt = function (sv) { // stretch q runs from marker q-1 to marker q; past a marker its walls ease over 8 units into the next
        var st = main.stops, q = 0; while (q < st.length - 1 && st[q].s < sv) q++;
        if (q === 0) return openCur[0];
        var u = clamp((sv - st[q - 1].s) / 8, 0, 1); u = u * u * (3 - 2 * u);
        return openCur[q - 1] * (1 - u) + openCur[q] * u;
      };
      main.tube = buildTube(THREE, main, { w: w, h: h, rock: parts.rock, openAt: main.openAt, seed: hashOf(s.spot.id) % 97 });
      main.group.add(main.tube.mesh); main.group.add(buildPebbles(THREE, main, w, h, 0, main.len));
      main.markers = main.stops.map(function (st, i) {
        var m = buildMarker(THREE, w, h, STEP_LOOK[i].light), a = at(main, st.s + MARK_AHEAD); m.position.set(a.x, a.y - h * 0.92 + MARK_Y, a.z); main.group.add(m); return m;
      });
      main.ctx = { holder: new THREE.Group(), lampHex: 0xffe0b0 };
      var ea = at(main, main.startS + 9), side = Math.min(w * 0.4, 2);
      main.ctx.holder.position.set(ea.x + -ea.fz * -side, -h * 0.92, ea.z + ea.fx * -side);
      main.group.add(main.ctx.holder);
      var xa = at(main, main.exitS - 0.2), arch = new THREE.Mesh(G.portal_arch, new THREE.MeshBasicMaterial({ color: 0xfff1b0 }));
      arch.position.set(xa.x, -h * 0.92, xa.z); arch.rotation.y = yawFacing(xa); arch.scale.setScalar(Math.min(w * 0.55, h * 0.7));
      main.group.add(arch); main.arch = arch;
      var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.6, 40, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1b0, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
      beam.position.set(xa.x, 18, xa.z); main.group.add(beam);
      scene.add(main.group); ch = { main: main, w: w, h: h };
      lamp = new THREE.PointLight(0xffe0b0, 1.1, 70); scene.add(lamp);
      hemi = new THREE.HemisphereLight(0xffffff, 0x302828, 0.45); scene.add(hemi);
      scene.fog.density = look.fog * STEP_LOOK[0].fogK;
      lk.idx = 0; lk.light.setHex(STEP_LOOK[0].light); lk.fog.setHex(STEP_LOOK[0].fog); lk.fogK = STEP_LOOK[0].fogK; lk.hemi = STEP_LOOK[0].hemi; lk.flash = 0;
      scene.background.copy(lk.fog); scene.fog.color.copy(lk.fog);
      avatar = buildAvatar(THREE, s.texture); scene.add(avatar);
      parts.dress = { wall: tex[2], width: Math.round(w * 100) / 100, fog: look.fog, element: null, lamp: 0xffe0b0 };
      state.dress = parts.dress;
      state.layout = { seed: s.spot.id + ":" + s.texture, rows: main.rows, stops: main.stops.map(function (v) { return Math.round(v.s * 100) / 100; }), length: Math.round(main.len * 10) / 10 };
      state.walk = newWalk(main, null, main.startS);
      state.mainRoute = main;
      looseNow = 0;
      feeling(s);
    }
    function feeling(s) {
      fill("Which feeling is here?", [
        P("The walls have taken your " + lookup(TEXTURES, s.texture)[1] + ". Its feeling has an element. Naming it opens the way."),
        choice(ELEMENTS.map(function (x) { return [x[0], x[0] + " · " + x[1]]; }), null, function (o) {
          s.element = o[0]; setElementOn(state.mainRoute.ctx, o[0], Math.min(ch.w * 0.3, 1.3)); parts.dress.element = o[0]; parts.dress.lamp = lookup(ELEMENTS, o[0])[3];
          hint(0);
        }),
      ], true);
      stat.setAttribute("data-cave-place", "portal");
    }
    function setElementOn(ctx, name, r) {
      var e = lookup(ELEMENTS, name);
      while (ctx.holder.children.length) ctx.holder.remove(ctx.holder.children[0]);
      var obj = buildElement(THREE, name, r);
      obj.traverse(function (m) { if (m.isMesh) { m.userData.interact = name; if (m.material.emissiveIntensity) glow.push({ m: m.material, base: m.material.emissiveIntensity }); } });
      ctx.holder.add(obj); ctx.elObj = obj; ctx.lampHex = e[3]; ctx.element = name;
    }

    // ---- walking ---------------------------------------------------------------------------
    function newWalk(route, blk, s) { return { route: route, s: s, s0: s, D: 1, t: 0, ready: false, moving: false, target: 0, arrived: false, blk: blk }; }
    function ctxOf() { return state.walk && state.walk.route.ctx; }
    function stopOf(wk) { return wk.route.stops[wk.target]; }
    var PLACE_ASK = { mouth: "What is the block like, in the body?", pool: "Which feeling is here? Tap its element.", passage: "A daemon stands in the way.",
      gate: "Six stones, one for each face. Each opens a branch of its own.", way_out: "Light from above. Breathe out." };
    // hint(i) starts the walk to stop i of the route the avatar is on: the pane shows where it is going, the clock is reset, and
    // on the main path the stretch is opened (the choice at the last marker is what opens it).
    function hint(i) {
      var wk = state.walk, stp = wk.route.stops[i], kind = wk.route.kind, label, words;
      wk.target = i;
      stat.setAttribute("data-cave-place", "walk");
      if (stp.wave != null) { label = WAVE[i][1]; words = WAVE[i][2]; }
      else if (stp.face) { var f = lookup(FACES, stp.face); label = f[1] + "'s branch"; words = f[3]; }
      else { var pl = PLACE_BY[stp.place]; label = pl.step + (stp.stone != null ? " · " + FACES[stp.stone][1] : ""); words = stp.stone != null ? FACES[stp.stone][1] + ": " + FACES[stp.stone][2] + ". Its branch opens here." : PLACE_ASK[stp.place]; }
      var kids = [P(words)];
      if (!state.walkedOnce) kids.push(P("Hold anywhere to walk. Drag to look. Tap these words to open them.", { "data-cave-hint": "" }));
      fill(label, kids);
      stat.setAttribute("data-cave-walking", stp.wave != null ? WAVE[i][0] : stp.face ? "face-" + stp.face : stp.place);
      wk.arrived = false; wk.ready = true; wk.s0 = wk.s; wk.D = Math.max(1, stp.s - wk.s); wk.t = 0; wk.moving = false;
      if (avatar) { avatar.userData.stepIdx = 0; avatar.userData.stepsIn = 0; avatar.userData.stepsOut = 0; }
      if (kind === "main") { if (i > revealed) { revealed = i; lk.flash = 1; } }
      else lk.flash = Math.max(lk.flash, 0.5);
    }
    function arrive() {
      var wk = state.walk, stp = stopOf(wk);
      if (stp.wave != null) markerCard(wk.target);
      else if (stp.face) faceCard(wk.blk);
      else placeCard(wk.blk);
    }
    // Holding walks the avatar; the walk clock t counts held seconds from 0 to one full breath, and lifting the thumb stops it,
    // so the walk and its breath pause together. state.auto is a short walk the game takes itself: up out of a branch onto the
    // path it left from.
    function walkStep(dt) {
      var wk = state.walk; if (!wk) return;
      wk.moving = false;
      var au = state.auto;
      if (au) {
        au.k = Math.min(1, au.k + dt / au.dur); wk.s = au.s0 + (au.s1 - au.s0) * ease(au.k); wk.moving = true; au.clk += dt;
        if (au.k >= 1) { state.auto = null; wk.moving = false; au.done(); }
        return;
      }
      if (!wk.ready || wk.arrived || busy || flight || !state.held) return;
      wk.moving = true; state.walkedOnce = true;
      wk.t = Math.min(BREATH_S, wk.t + dt * state.speed * (state.calm ? 0.8 : 1));
      wk.s = wk.s0 + wk.D * stretchFrac(wk.t);
      if (wk.t >= BREATH_S) { wk.s = wk.s0 + wk.D; wk.arrived = true; wk.moving = false; arrive(); }
    }
    function autoWalk(s1, done) {
      var wk = state.walk; state.auto = { s0: wk.s, s1: s1, k: 0, dur: Math.max(0.5, Math.abs(s1 - wk.s) / 7) / Math.max(1, state.speed / 4), clk: 0, done: done };
    }

    // ---- the main path's markers: go on, or "this step won't go further" ---------------------------
    function markerCard(i) {
      var s = me(), wv = WAVE[i], last = i === WAVE.length - 1, body = [];
      stat.setAttribute("data-cave-place", "marker");
      if (s.blocked.indexOf(wv[0]) >= 0) body.push(P("You came back round to " + wv[1] + ". The way you looped is lit beside you.", { "data-cave-back": "" }));
      body.push(P(wv[2], { "data-cave-prompt": "" }));
      if (!last) body.push(P("The way ahead is gathered shut. It opens when you choose.", { "data-cave-shut": "" }));
      var kids = [btn(last ? "Come back out" : "Go on", { "data-cave-go": "" }, function () { goOn(i); }), btn("This step won't go further", { "data-cave-block": "" }, function () { openBlock(wv[0], wv[1]); }, true)];
      body.push(row(kids));
      if (last) {
        var rest = state.sens.filter(function (o) { return o !== s; });
        if (rest.length) body.push(P("Other places showed up in this sitting. A path runs to each from here."));
        if (rest.length) body.push(row(rest.map(function (o) {
          return btn((o.saved ? "Back to " : "Follow the path to ") + o.spot.words, { "data-cave-portal": o.id }, function () { follow(o.id); }, true);
        })));
        body.push(P("Is anything else showing up somewhere else in your body?"));
        body.push(row([btn("Yes, name another place", { "data-cave-add": "" }, addPlace, true)]));
      }
      fill(wv[1], body);
      stat.setAttribute("data-cave-marker", wv[0]);
    }
    function goOn(i) {
      if (busy) return;
      var s = me(); s.passed = Math.max(s.passed, i + 1);
      if (i < WAVE.length - 1) hint(i + 1); else finishOut();
    }
    function finishOut() {
      busy = true; stat.setAttribute("data-cave-place", "rising"); fill("Light from above", [P("Breathe out.")]);
      var y0 = camera.position.y;
      tween(2200, function (k) { state.rise = { k: ease(k), y0: y0 }; }, function () { state.rise = null; leave(true); });
    }

    // ---- branches: a loop out through the wall and back to the same spot ----------------------------
    // kind "side": a block's side passage, which ramps down under the cave and holds the five places. kind "face": one face's
    // short level branch at the gate. The parent's wall opens twice (out and back), a lantern stands between the openings,
    // and the loop is kept after the player comes back round, so the way they went stays visible.
    function makeBranch(frame, kind, depth, face) {
      var parent = frame.route, w = ch.w, h = ch.h, side = outerSide(parent, frame.s, depth);
      var pw = (parent.w || w) * (parent.kind === "main" ? parent.openAt(frame.s) : SIDE_LOOK.open);
      var o = kind === "side" ? { wb: w * 0.8, g: w * 0.8 * 1.3, W0: pw, L1: 18, alpha: 0.7, R: 34, drop: 10 }
        : { wb: w * 0.65, g: w * 0.65 * 1.3, W0: pw, L1: 2, alpha: 0, R: w * 0.65 * 1.3 + 2.5, drop: 0 };
      var route = layoutBranch(parent, frame.s, side, o);
      route.w = o.wb; route.kind = kind; route.group = new THREE.Group();
      route.holes.forEach(function (H) { parent.tube.addHole(H); });
      var rock = frame.blk ? frame.blk.rock : parts.rock;
      if (kind === "side") rock = new THREE.MeshStandardMaterial({ color: rock.color.getHex(), roughness: 0.95, side: THREE.DoubleSide });
      route.openAt = function () { return SIDE_LOOK.open; };
      route.tube = buildTube(THREE, route, { w: o.wb, h: h, rock: rock, openAt: route.openAt, sFrom: route.sFrom, sTo: route.sTo, seed: depth * 13 + blockN });
      route.group.add(route.tube.mesh); route.group.add(buildPebbles(THREE, route, o.wb, h, route.sFrom, route.sTo));
      // the two openings get a glowing rim each, and a lantern stands between them
      route.rims = route.holes.map(function (H) {
        var a = at(parent, (H.s0 + H.s1) / 2), rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.07, 8, 28), new THREE.MeshBasicMaterial({ color: 0xfff1b0 }));
        var nx = -a.fz * H.side, nz = a.fx * H.side;
        rim.position.set(a.x + nx * pw * 0.97, a.y - h * 0.25, a.z + nz * pw * 0.97); rim.rotation.y = Math.atan2(nx, nz);
        rim.scale.set(0.01, 0.01, 1); route.group.add(rim); return rim;
      });
      var b = at(parent, frame.s), lan = buildLantern(THREE);
      lan.position.set(b.x + -b.fz * side * pw * 0.8, b.y - h * 0.92, b.z + b.fx * side * pw * 0.8);
      route.group.add(lan); lanternsOn.push(lan);
      if (kind === "side") {
        // the five places along the loop; the six stones of the gate each have a stop of their own, a face's branch beside it
        var L = route.len, pos = { mouth: 0.15, pool: 0.25, passage: 0.35 }, g0 = 0.45 * L, gs = Math.min(18, (L - 26 - g0) / 6);
        route.stops = [{ s: pos.mouth * L, place: "mouth" }, { s: pos.pool * L, place: "pool" }, { s: pos.passage * L, place: "passage" }];
        FACES.forEach(function (f, i) { route.stops.push({ s: g0 + i * gs, place: "gate", stone: i }); });
        route.stops.push({ s: route.sTo - 2.5, place: "way_out" });
      } else route.stops = [{ s: route.sTo - 1.2, face: face }];
      route.markers = route.stops.map(function (st) {
        var m = buildMarker(THREE, o.wb, h, kind === "face" ? lookup(FACES, face)[4] : SIDE_LOOK.light), a = at(route, Math.min(route.len, st.s + MARK_AHEAD));
        m.position.set(a.x, a.y - h * 0.92 + MARK_Y, a.z); route.group.add(m); return m;
      });
      route.ctx = { holder: new THREE.Group(), lampHex: 0xffe0b0, stones: [] };
      scene.add(route.group);
      return route;
    }
    function growRims(route, done) {
      busy = true;
      tween(900, function (k) { var e = ease(k); route.rims.forEach(function (r) { r.scale.set(0.01 + 1.3 * e, 0.01 + 1.7 * e, 1); }); }, function () { busy = false; done(); });
    }
    // A block: the wall opens, and a side passage loops out from here and back to this spot.
    function openBlock(stepId, label) {
      if (busy) return;
      var wk = state.walk, s = me(), depth = state.stack.length + 1, stp = stopOf(wk);
      var key = wk.blk ? wk.blk.key + ">" + PLACE_BY[stp.place].key : stepId;
      if (s.blocked.indexOf(key) < 0) s.blocked.push(key);
      var frame = { route: wk.route, s: wk.s, target: wk.target, blk: wk.blk, key: key, label: label, kind: "side" };
      var route = makeBranch(frame, "side", depth);
      var par = frame.blk, tex = par ? par.texture : s.texture;
      var blk = { id: "b" + (++blockN), key: key, label: label, depth: depth, texture: tex, element: par ? par.element : s.element, daemon: null, stepAside: null, dug: 0, gate: [], route: route, frame: frame, touched: false };
      blk.rock = route.tube.mesh.material; blk.rock.color.setHex((lookup(TEXTURES, tex) || TEXTURES[4])[2]);
      dressSide(blk);
      frame.child = blk;
      stat.setAttribute("data-cave-place", "opening"); fill(label, [P("The wall opens. The path loops out from here and comes back to this spot.")]);
      growRims(route, function () {
        state.stack.push(frame);
        state.walk = newWalk(route, blk, 0);
        hint(0);
      });
    }
    // A face's branch at the gate: a short level loop out of the wall beside that face's stone and back.
    function openFace(blk, stone) {
      if (busy) return;
      var wk = state.walk, f = FACES[stone];
      var frame = { route: wk.route, s: wk.s, target: wk.target, blk: blk, key: blk.key + ">face-" + f[0], label: f[1], kind: "face", stone: stone };
      // the last face's branch is put away (its openings close), so neighbouring branches never cross
      if (blk.lastFace) {
        var old = blk.lastFace; scene.remove(old.group);
        wk.route.tube.holes = wk.route.tube.holes.filter(function (H) { return old.holes.indexOf(H) < 0; }); wk.route.tube.index();
        lanternsOn = lanternsOn.filter(function (l) { return l.parent !== old.group; });
      }
      var route = makeBranch(frame, "face", state.stack.length + 1, f[0]);
      frame.child = { route: route }; blk.lastFace = route;
      fill(f[1] + "'s branch", [P("The wall beside the " + f[1] + " stone opens.")]);
      growRims(route, function () {
        state.stack.push(frame);
        state.walk = newWalk(route, blk, 0);
        hint(0);
      });
    }
    // The side passage's objects: the element beside the pool, the six stones, and the arch at the way out.
    function dressSide(blk) {
      var route = blk.route, ctx = route.ctx, G = parts.G, h = ch.h, wb = route.w, inner = -route.side;
      function beside(s, lat) { var a = at(route, s); return { x: a.x + -a.fz * inner * lat, y: a.y - h * 0.92, z: a.z + a.fx * inner * lat, a: a }; }
      var pool = route.stops[1], pe = beside(pool.s + 9, Math.min(wb * 0.4, 2.2));
      ctx.holder.position.set(pe.x, pe.y, pe.z); route.group.add(ctx.holder);
      if (blk.element) setElementOn(ctx, blk.element, Math.min(wb * 0.45, 2));
      route.stops.forEach(function (st) {
        if (st.stone == null) return;
        var f = FACES[st.stone], p = beside(st.s + 2.5, wb * 0.55);
        var stone = new THREE.Mesh(G.gate_stone, new THREE.MeshStandardMaterial({ color: 0x70707e, roughness: 0.8, emissive: 0x000000 }));
        stone.position.set(p.x, p.y, p.z); stone.scale.set(2.2, Math.min(h * 1.1, 3.4), 2.2); stone.userData.face = f[0];
        route.group.add(stone); ctx.stones.push(stone);
      });
      var wo = route.stops[route.stops.length - 1], aw = at(route, Math.min(route.len, wo.s + 1.5));
      var arch = new THREE.Mesh(G.portal_arch, new THREE.MeshBasicMaterial({ color: 0xfff1b0 }));
      arch.position.set(aw.x, aw.y - h * 0.92, aw.z); arch.rotation.y = yawFacing(aw); arch.scale.setScalar(Math.min(wb * 0.55, h * 0.7)); route.group.add(arch);
    }

    // Coming back round: the avatar walks the last of the loop up onto the very spot it left from. Release returns one level;
    // a skip goes back to the main path from any depth (with a short fade, because it jumps).
    function backRound(done) {
      if (busy) return;
      var wk = state.walk; busy = true; closeModal();
      autoWalk(wk.route.len, function () {
        var fr = state.stack.pop();
        state.walk = { route: fr.route, s: fr.s, s0: fr.s, D: 0, t: BREATH_S, ready: true, moving: false, target: fr.target, arrived: true, blk: fr.blk };
        busy = false; done(fr);
      });
    }
    function release() {
      backRound(function (fr) {
        var pb = fr.blk;
        if (pb && fr.route.stops[fr.target].place === "passage" && pb.stepAside === "not-yet") { pb.dug++; pb.stepAside = null; } // the daemon is asked again
        arrive();
      });
    }
    function faceBack() {
      backRound(function (fr) {
        var blk = fr.blk, f = FACES[fr.stone];
        if (blk.gate.indexOf(f[0]) < 0) blk.gate.push(f[0]);
        blk.route.ctx.stones.forEach(function (st) {
          if (blk.gate.indexOf(st.userData.face) >= 0) { var col = lookup(FACES, st.userData.face)[4]; st.material.color.setHex(col); st.material.emissive.setHex(col); st.material.emissiveIntensity = st.userData.face === f[0] ? 0.9 : 0.45; }
        });
        lk.flash = 1;
        next(blk);
      });
    }
    function skip() {
      if (busy) return;
      var s = me(), wk = state.walk;
      var chain = [], b = wk.blk; while (b) { chain.unshift(b.key); b = b.frame.blk; }
      chain.forEach(function (k) { if (s.skipped.indexOf(k) < 0) s.skipped.push(k); });
      busy = true; closeModal(); fade.style.opacity = 1;
      setTimeout(function () {
        var fr = state.stack[0]; state.stack = [];
        state.walk = { route: fr.route, s: fr.s, s0: fr.s, D: 0, t: BREATH_S, ready: true, moving: false, target: fr.target, arrived: true, blk: null };
        snapCam = true; busy = false; fade.style.opacity = 0;
        arrive();
      }, 520);
    }

    // ---- the side passage's places ----------------------------------------------------------------
    function next(blk) {
      var wk = state.walk;
      if (wk.target < wk.route.stops.length - 1) hint(wk.target + 1);
    }
    function redress(blk) {
      blk.rock.color.setHex((lookup(TEXTURES, blk.texture) || TEXTURES[4])[2]);
      var c = blk.route.ctx;
      if (blk.element && c.element !== blk.element) { setElementOn(c, blk.element, Math.min(blk.route.w * 0.45, 2)); blk.touched = false; }
      lk.flash = Math.max(lk.flash, 0.7);
    }
    function touch() {
      var c = ctxOf(); if (!c) return;
      c.pulse = performance.now(); state.touched = true;
      var wk = state.walk; if (wk.blk && wk.arrived && stopOf(wk).place === "pool") { wk.blk.touched = true; placeCard(wk.blk); }
    }
    function placeCard(blk) {
      var wk = state.walk, stp = stopOf(wk), p = PLACE_BY[stp.place], body = [], kids = [];
      stat.setAttribute("data-cave-place", stp.place);
      var go = btn("Continue", { "data-cave-next": "" }, function () { next(blk); }), title = p.step;
      if (stp.place === "mouth") {
        body.push(P("What is the block like, in the body?"));
        body.push(choice(TEXTURES.map(function (t) { return [t[0], t[1]]; }), blk.texture, function (o) { blk.texture = o[0]; redress(blk); placeCard(blk); }));
        body.push(P("Is anything else showing up somewhere else in your body?"));
        body.push(row([btn("Yes, name another place", { "data-cave-add": "" }, addPlace, true)]));
        var s = me();
        if (state.sens.length > 1) body.push(P("Also named this sitting: " + state.sens.filter(function (o) { return o !== s; }).map(function (o) { return o.spot.words; }).join(", ") + ".", { "data-cave-also": "" }));
      } else if (stp.place === "pool") {
        var e = lookup(ELEMENTS, blk.element);
        body.push(P(e[0] + " is " + e[1] + ". Tap it. The move that goes with it: " + e[2] + "."));
        if (blk.touched) body.push(P("It answers you. " + e[2] + ".", { "data-cave-touched": "" }));
        body.push(P(CHANNEL_JOBS[e[0]], { "data-cave-job": "" }));
        body.push(choice(ELEMENTS.map(function (x) { return [x[0], x[0] + " · " + x[1]]; }), blk.element, function (o) { blk.element = o[0]; redress(blk); placeCard(blk); }));
      } else if (stp.place === "passage") {
        var d = blk.daemon && lookup(DAEMONS, blk.daemon);
        if (!d) {
          body.push(P("A daemon stands in the way. Which one is it?"));
          body.push(choice(DAEMONS.map(function (x) { return [x[0], x[1]]; }), null, function (o) { meet(blk, o[0]); }));
          go.disabled = true;
        } else {
          body.push(P(d[1] + "'s job: " + d[2], { "data-cave-daemon-job": "" }));
          body.push(P("Who it works for: " + DAEMON_WORKS_FOR, { "data-cave-daemon-for": "" }));
          if (!blk.stepAside) {
            if (blk.dug) body.push(P("You worked what it was holding.", { "data-cave-dug": "" }));
            body.push(P(blk.dug ? "Will it step aside now?" : "Knowing that, will it step aside?"));
            body.push(row([
              btn("Yes, it steps aside", { "data-cave-aside": "yes" }, function () { blk.stepAside = "yes"; moveDaemon(blk); placeCard(blk); }),
              btn("Not yet", { "data-cave-aside": "not-yet" }, function () { blk.stepAside = "not-yet"; placeCard(blk); }, true),
            ]));
            go.disabled = true;
          } else if (blk.stepAside === "yes") {
            body.push(P(d[1] + " stepped to the wall, and the way is open.", { "data-cave-open": "" }));
          } else {
            // Wendell, 10 October 2026: "This type of blocker shouldn't be able to be moved past and there should be an encounter
            // where they only stand aside after resolving the emergent issue presented by the daemon." The way stays shut; the
            // encounter is digging into what it holds (the game's own rule: "If a block won't release, you dig deeper into what's
            // holding it", game.jsx line 3380), a branch of its own, and then it is asked again (board: cave-daemon-encounter).
            // Wendell, 10 October 2026 (board cave-daemon-wall, overruled): "We shouldn't have a skip. If a daemon pops up then
            // it needs to be worked with. We can pivot to a 321 discussion with the part until it feels satisfied." The 3-2-1
            // runs here, round after round, until the player says it is satisfied; then it steps aside. Its wording follows
            // src/components/nursery/ThreeTwoOneDialogue.tsx. The words stay on this page and are not saved.
            var t = blk.t321;
            if (!t) {
              body.push(P(d[1] + " won't move, and you can't walk past it. It is still doing its job here, for you.", { "data-cave-wall": "" }));
              body.push(P("Talk with it, 3-2-1, until it feels satisfied, or work what it is holding and ask it again when you come back round."));
              body.push(row([
                btn("Talk with it", { "data-cave-321": "" }, function () { blk.t321 = { step: 0, rounds: 1, it: "", you: "", i: "" }; placeCard(blk); }),
                btn("Work what it holds", { "data-cave-dig": "" }, function () { openBlock("daemon", d[1]); }, true),
              ]));
            } else if (t.step < 3) {
              var k = T321[t.step], ta = el("textarea", { rows: "3", placeholder: k[3].replace("{d}", d[1]), "data-cave-321-text": k[0] });
              ta.value = t[k[0]];
              ta.addEventListener("input", function () { t[k[0]] = ta.value; });
              title = "3-2-1 with " + d[1] + (t.rounds > 1 ? " · round " + t.rounds : "");
              body.push(P(k[1], { "data-cave-321-step": k[0] }));
              body.push(P(k[2].replace("{d}", d[1])));
              body.push(ta);
              body.push(row([btn("Next", { "data-cave-321-next": "" }, function () { t.step++; placeCard(blk); })]));
            } else {
              title = "3-2-1 with " + d[1];
              body.push(P("Does " + d[1] + " feel satisfied?", { "data-cave-321-ask": "" }));
              body.push(row([
                btn("Yes, it is satisfied", { "data-cave-satisfied": "yes" }, function () { blk.stepAside = "yes"; blk.t321 = null; moveDaemon(blk); placeCard(blk); }),
                btn("Not yet, another round", { "data-cave-satisfied": "not-yet" }, function () { t.step = 0; t.rounds++; placeCard(blk); }, true),
              ]));
            }
            go.disabled = true;
          }
        }
      } else if (stp.place === "gate") {
        var f = FACES[stp.stone], walked = blk.gate.indexOf(f[0]) >= 0;
        title = p.step + " · " + f[1];
        body.push(P(f[1] + ": " + f[2] + ". " + blk.gate.length + " of 6 branches walked.", { "data-cave-stone-says": "" }));
        if (!walked) {
          body.push(row([btn("Walk " + f[1] + "'s branch", { "data-cave-stone": f[0] }, function () { openFace(blk, stp.stone); })]));
          go.disabled = true;
        }
      } else {
        body.push(P("Light from above. Breathe out, and come back round to " + blk.label + "."));
        go = btn("Return to " + blk.label, { "data-cave-release": "" }, release);
      }
      // No skip once a daemon has shown up and not stepped aside, here or in any block this one opened from: it is worked with.
      if (stp.place === "passage" && blk.stepAside !== "yes") { /* the daemon is here: no skip, no way on until it steps aside */ }
      else {
        kids.push(go);
        if (stp.place !== "way_out") kids.push(btn("This step won't go further", { "data-cave-block": "" }, function () { openBlock(p.key, p.step); }, true));
        if (stp.place !== "way_out" && !daemonHolds(blk)) kids.push(btn("Skip", { "data-cave-skip": "" }, skip, true));
      }
      fill(title, body.concat([row(kids)]));
    }
    // True when this block, or one it was opened from, has a daemon that has not stepped aside.
    function daemonHolds(b) { while (b) { if (b.daemon && b.stepAside !== "yes") return true; b = b.frame.blk; } return false; }
    var T321 = [
      ["it", "3 · It", "Face {d} as something outside you. Describe it in the third person.", "It stands there whenever I try to... It looks like..."],
      ["you", "2 · You", "Talk to {d} directly, as \"you\". Ask what it wants and what it is protecting, and let it answer.", "You show up whenever I... What do you want from me?"],
      ["i", "1 · I", "Be {d}. Speak as \"I\", as the part of you it is.", "I am the part of you that... I need..."],
    ];
    function faceCard(blk) {
      var stp = stopOf(state.walk), f = lookup(FACES, stp.face);
      stat.setAttribute("data-cave-place", "face");
      fill(f[1] + " asks", [P(f[3], { "data-cave-face-asks": "" }), P(f[1] + " knows through " + f[2].replace(/^Knows through /, "") + "."), row([btn("Back to the ring", { "data-cave-face-back": "" }, faceBack)])]);
    }

    function addPlace() {
      window.OAGBody.pick().then(function (r) {
        if (!r) return;
        var sp = spotNamed(A, r.label);
        if (!sp) { alert("That place is not on the figure yet. Tap the figure to choose one."); return; }
        if (!state.sens.filter(function (o) { return o.id === sp.id; }).length) addSensation(sp);
        if (state.walk.arrived) arrive();
      });
    }
    function meet(blk, id) {
      blk.daemon = id;
      var route = blk.route, c = route.ctx, d = lookup(DAEMONS, id), h = ch.h, a = at(route, route.stops[2].s + 6);
      if (c.daemonFig) route.group.remove(c.daemonFig);
      c.daemonFig = buildDaemon(THREE, d, h * 1.1);
      c.daemonFig.position.set(a.x, a.y - h * 0.9, a.z); c.daemonFig.rotation.y = yawFacing({ fx: -a.fx, fz: -a.fz });
      c.daemonBase = { x: a.x, z: a.z, nx: -a.fz, nz: a.fx };
      route.group.add(c.daemonFig);
      placeCard(blk);
    }
    function moveDaemon(blk) {
      var c = blk.route.ctx; if (!c.daemonFig) return;
      c.daemonT = { t0: performance.now(), to: blk.route.w * 0.6 };
    }

    // ---- the path between two places -------------------------------------------------------
    function save(s) {
      if (s.saved || !s.texture) return;
      s.saved = true;
      window.OAGBody.record({ location: s.spot.words, texture: s.texture, channel: s.element, where: "cave", blocked: s.blocked.slice(), skipped: s.skipped.slice() });
    }
    function follow(id) {
      var from = me(), to = state.sens.filter(function (o) { return o.id === id; })[0];
      if (!to || to === from || state.mode === "path" || busy) return;
      save(from);
      var Pp = function (sp) { return new THREE.Vector3(sp.position[0] * FIG, (sp.position[1] - 0.9) * FIG, sp.position[2] * FIG); };
      var a = Pp(from.spot), b = Pp(to.spot), mid = a.clone().add(b).multiplyScalar(0.5);
      mid.x *= 0.25; mid.z *= 0.25;
      var curve = new THREE.CatmullRomCurve3([a, a.clone().lerp(mid, 0.5), mid, mid.clone().lerp(b, 0.5), b]);
      clearScene(); state.mode = "path"; state.path = { from: from.id, to: to.id };
      var tint = new THREE.Color((lookup(TEXTURES, from.texture) || TEXTURES[4])[2]).multiplyScalar(0.45);
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 1.1, 12, false), new THREE.MeshStandardMaterial({ color: tint, roughness: 0.9, side: THREE.BackSide })));
      scene.add(new THREE.HemisphereLight(0xffffff, 0x302828, 0.35));
      var fl = new THREE.PointLight(0xfff1b0, 0.9, 12); scene.add(fl);
      scene.fog.density = 0.05;
      fill("A path inside the body", [P("From " + from.spot.words + " to " + to.spot.words + ".")], true);
      stat.setAttribute("data-cave-place", "path");
      flight = { curve: curve, t: 0, lamp: fl, done: function () { portal(to); } };
    }
    function leave(doSave) {
      if (doSave && me()) save(me());
      fade.style.opacity = 1;
      setTimeout(function () {
        cancelAnimationFrame(running); window.removeEventListener("resize", size);
        renderer.dispose(); wrap.remove(); home.style.display = "";
        window.__oagCave.last = state;
      }, 500);
    }

    // The pane follows the figure: it sits above the avatar's head on the screen, held inside the screen and below the buttons.
    var hv = new THREE.Vector3(), paneAt = null;
    function layoutPane() {
      paneAt = null;
      if (docked || !avatar || !page.has || pane.style.display === "none") return;
      var W = canvasBox.clientWidth || 1, H = canvasBox.clientHeight || 1, pw = pane.offsetWidth, ph = pane.offsetHeight;
      hv.set(avatar.position.x, avatar.position.y + AVATAR_H + 0.4, avatar.position.z).project(camera);
      var hx = (hv.x + 1) / 2 * W, hy = (1 - hv.y) / 2 * H;
      if (hv.z > 1) { hx = W / 2; hy = H * 0.6; }
      var x = clamp(hx - pw / 2, 8, Math.max(8, W - pw - 8)), y = clamp(hy - ph - 14, 58, Math.max(58, H - ph - 12));
      pane.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
      pane.style.setProperty("--tail", Math.round(clamp(hx - x, 16, pw - 16)) + "px");
      paneAt = { x: x, y: y, w: pw, h: ph, headX: hx, headY: hy };
    }

    // ---- the frame -------------------------------------------------------------------------
    var tmp = new THREE.Vector3(), baseLamp = new THREE.Color(), tmpC = new THREE.Color();
    var CAM_BACK = 6.2, CAM_UP = 4.6;
    function render() {
      var nowMs = performance.now(), dt = Math.min(0.5, (nowMs - last) / 1000); last = nowMs;
      breathStep(dt, nowMs / 1000);
      tweens = tweens.filter(function (tw) {
        var k = Math.min(1, (nowMs - tw.t0) / tw.ms); tw.fn(k);
        if (k >= 1) { if (tw.done) tw.done(); return false; }
        return true;
      });
      if (flight) {
        flight.t = Math.min(1, flight.t + 0.006);
        var p = flight.curve.getPoint(flight.t), q = flight.curve.getPoint(Math.min(1, flight.t + 0.02));
        camera.position.copy(p); camera.lookAt(q); flight.lamp.position.copy(p);
        if (flight.t >= 1) { var done = flight.done; flight = null; done(); }
      } else if (ch && state.walk && avatar) {
        walkStep(dt);
        var wk = state.walk, route = wk.route, a = at(route, wk.s), h = ch.h, fl = a.y - h * 0.92, c = ctxOf();
        looseNow += (me().passed / WAVE.length - looseNow) * Math.min(1, dt * 2);
        loosenAvatar(avatar, looseNow, br.b);
        var stepLen = state.auto ? 0.9 : wk.t < BREATH.inS ? wk.D / 2 / STEPS_IN : wk.D / 2 / STEPS_OUT;
        poseAvatar(avatar, state.auto ? state.auto.clk : wk.t, wk.moving, dt, br.b, stepLen, state.calm);
        avatar.position.set(a.x, fl + 0.02, a.z);
        avatar.rotation.y = yawFacing(a);
        if (state.held) state.look.yaw *= 1 - Math.min(1, dt * 1.5);
        // camera: behind on the path, and a little above; on a branch's first steps it sits straight behind the figure
        var cbx, cbz, cby;
        var frT = state.stack[state.stack.length - 1], back = route.kind === "face" ? 3.6 : CAM_BACK; // a face's tight loop keeps the camera closer
        if (wk.s >= back || route.kind === "main" || !frT) { var cb = at(route, Math.max(0, wk.s - back)); cbx = cb.x; cbz = cb.z; cby = cb.y; }
        else { var pb = at(frT.route, frT.s - (back - wk.s)); cbx = pb.x; cbz = pb.z; cby = pb.y; } // a branch's first steps are seen from the path it left
        var ry = state.look.yaw; tmp.set(cbx - a.x, 0, cbz - a.z);
        var cx = a.x + tmp.x * Math.cos(ry) + tmp.z * Math.sin(ry), cz = a.z - tmp.x * Math.sin(ry) + tmp.z * Math.cos(ry);
        // the camera stays under the roof of the tunnel where it is, so a ramp never lifts it out
        var want = new THREE.Vector3(cx, Math.min(Math.max(cby, a.y) - h * 0.92 + CAM_UP, cby - h * 0.92 + 5) - state.look.pitch * 2.6, cz), aim = new THREE.Vector3(a.x + a.fx * 3.4, fl + 2.2, a.z + a.fz * 3.4);
        if (state.rise) { want.y = state.rise.y0 + 16 * state.rise.k; aim.set(a.x + a.fx * 6, state.rise.y0 + 6 + 20 * state.rise.k, a.z + a.fz * 6); }
        if (snapCam) { camPos.copy(want); lookAt.copy(aim); snapCam = false; }
        else { var f = 1 - Math.exp(-dt * 6); camPos.lerp(want, f); lookAt.lerp(aim, f); }
        camera.position.copy(camPos); camera.lookAt(lookAt); camera.updateMatrixWorld();
        // the look follows the choice: the stretch the player chose to walk (or the violet hush of a branch)
        var lg = route.kind === "main" ? STEP_LOOK[clamp(wk.target, 0, 6)] : SIDE_LOOK, fe = 1 - Math.exp(-dt * 2.2);
        lk.idx = route.kind === "main" ? wk.target : -1;
        lk.light.lerp(tmpC.setHex(lg.light), fe); lk.fog.lerp(tmpC.setHex(lg.fog), fe);
        lk.fogK += (lg.fogK - lk.fogK) * fe; lk.hemi += (lg.hemi - lk.hemi) * fe; lk.flash = Math.max(0, lk.flash - dt / 1.1);
        scene.background.copy(lk.fog); scene.fog.color.copy(lk.fog); scene.fog.density = parts.fog * lk.fogK;
        var mt = state.mainRoute.tube, chg = false;
        for (var qq = 0; qq < STEP_LOOK.length; qq++) {
          var goal = qq <= revealed ? STEP_LOOK[qq].open : CLOSED, nv = openCur[qq] + (goal - openCur[qq]) * fe;
          if (Math.abs(nv - openCur[qq]) > 0.0004) { openCur[qq] = nv; chg = true; }
        }
        if (chg) mt.dirty = true;
        lamp.position.set(a.x, fl + 3.8, a.z);
        mt.update(br.k);
        state.stack.forEach(function (fr) { if (fr.child && fr.child.route) fr.child.route.tube.update(br.k); });
        var warm = 1 - br.b, surge = lk.flash * lk.flash;
        baseLamp.copy(lk.light).lerp(tmpC.setHex(0xffffff), 0.3).lerp(tmpC.setHex(c && c.lampHex || 0xffe0b0), 0.15).lerp(WARM, warm * 0.2);
        lamp.color.copy(baseLamp); lamp.intensity = 1.0 + 0.5 * warm + 1.6 * surge + 0.5 * lk.hemi;
        hemi.color.setHex(0xffffff).lerp(lk.light, 0.35); hemi.intensity = lk.hemi + 0.1 * warm + 0.4 * surge;
        glow.forEach(function (g) { g.m.emissiveIntensity = g.base * (0.7 + 0.6 * br.b); });
        route.markers.forEach(function (m, i) {
          var on = route.kind === "main" ? i < me().passed : i < wk.target || (wk.arrived && wk.target === i);
          var here = i === wk.target;
          m.material.opacity = on ? 0.95 : here ? 0.8 : 0.35;
          m.scale.setScalar(here && !state.calm ? 1 + 0.15 * Math.sin(nowMs / 300) : 1);
        });
        lanternsOn.forEach(function (l, i) { l.userData.lamp.scale.setScalar(state.calm ? 1 : 1 + 0.08 * Math.sin(nowMs / 400 + i)); });
        if (c) {
          if (c.elObj) {
            var pk = c.pulse ? Math.max(0, 1 - (nowMs - c.pulse) / 700) : 0;
            c.elObj.scale.setScalar(1 + 0.3 * pk + 0.07 * (br.b - 0.5));
            if (!state.calm) c.elObj.children.forEach(function (m) { if (m.userData.flame) m.scale.y = 1 + 0.15 * Math.sin(nowMs / 90 + m.position.x * 9); });
          }
          if (c.daemonT) {
            var dk = ease(Math.min(1, (nowMs - c.daemonT.t0) / 900)), db = c.daemonBase;
            c.daemonFig.position.x = db.x + db.nx * c.daemonT.to * dk; c.daemonFig.position.z = db.z + db.nz * c.daemonT.to * dk;
            if (dk >= 1) c.daemonT = null;
          }
          if (c.daemonFig && c.daemonFig.userData.orb && !state.calm) c.daemonFig.userData.orb.scale.setScalar(1 + 0.2 * Math.sin(nowMs / 250));
        }
        layoutPane();
      }
      renderer.render(scene, camera);
      running = requestAnimationFrame(render);
    }
    size(); window.addEventListener("resize", size);
    portal(addSensation(firstSpot)); render();

    // ---- hooks for the browser test ----------------------------------------------------------
    var api = window.__oagCave;
    api.state = state; api.leave = leave;
    api.breath = function () { return { b: br.b, k: br.k, calm: state.calm, ring: !!ring.parentNode, pace: paceNow() }; };
    api.avatar = function () {
      var d = avatar.userData, wk = state.walk, a = at(wk.route, wk.s);
      return { x: avatar.position.x, y: avatar.position.y, z: avatar.position.z, scale: [d.body.scale.x, d.body.scale.y], opacity: d.mat.opacity, glow: d.mat.emissiveIntensity,
        offPath: distToRoute(wk.route, avatar.position.x, avatar.position.z), bytes: geometryBytes(avatar), loose: looseNow, s: wk.s, ahead: [a.fx, a.fz], route: wk.route.kind };
    };
    api.joints = function () {
      var J = avatar.userData.J, r = {};
      Object.keys(J).forEach(function (k) { r[k] = J[k].rotation.x; });
      return { names: Object.keys(J), x: r, g: avatar.userData.g, hipsY: J.hips.position.y, spineScale: J.spine.scale.y, shoulderY: J.shoulderL.position.y };
    };
    api.gait = function () {
      var wk = state.walk, d = avatar.userData;
      return { t: wk.t, s: wk.s, s0: wk.s0, D: wk.D, frac: wk.D ? (wk.s - wk.s0) / wk.D : 1, phase: wk.t < BREATH.inS ? "in" : "out", moving: wk.moving, stepsIn: d.stepsIn, stepsOut: d.stepsOut,
        inS: BREATH.inS, outS: BREATH.outS, stepsPerS: STEPS_PER_S, arrived: wk.arrived };
    };
    api.look = function () {
      return { idx: lk.idx, light: lk.light.getHex(), fog: lk.fog.getHex(), fogK: lk.fogK, open: openCur.slice(), revealed: revealed, bg: scene.background.getHex(), density: scene.fog.density };
    };
    // The pane: its words, where it sits on the screen, and where the figure's head is.
    api.pane = function () {
      var r = pane.getBoundingClientRect(), cs = getComputedStyle(pane);
      return { shown: pane.style.display !== "none" && pane.style.visibility !== "hidden" && r.width > 0, title: page.title, text: page.text, at: paneAt, rect: { x: r.left, y: r.top, w: r.width, h: r.height }, font: parseFloat(cs.fontSize), docked: docked };
    };
    api.modal = function () {
      var r = modal.getBoundingClientRect();
      return { open: state.modal, text: modal.textContent, buttons: Array.prototype.map.call(modal.querySelectorAll("button"), function (b) { return b.textContent; }), rect: { x: r.left, y: r.top, w: r.width, h: r.height } };
    };
    api.depth = function () { return state.stack.length; };
    // Whether the camera is inside the tunnel being walked (between its walls, above its floor, under its roof).
    api.camInside = function () {
      var r = state.walk.route, best = 1e9, bs = 0;
      for (var i = 0; i < r.X.length; i += 2) { var d = Math.hypot(r.X[i] - camera.position.x, r.Z[i] - camera.position.z); if (d < best) { best = d; bs = r.S[i]; } }
      var a = at(r, bs), hw = (r.w || ch.w) * (r.kind === "main" ? r.openAt(bs) : SIDE_LOOK.open), fl = a.y - ch.h * 0.92;
      return { side: best, halfWidth: hw, above: camera.position.y - fl, roof: ch.h * 1.92, inside: best < hw * 0.95 && camera.position.y > fl && camera.position.y < fl + ch.h * 1.85 };
    };
    api.clearance = function () {
      var r = state.mainRoute, best = 1e9;
      for (var i = 0; i < r.X.length; i += 2) for (var j = i + 1; j < r.X.length; j += 2) {
        if (r.S[j] - r.S[i] < Math.max(12, Math.PI * r.pitch / 2 * 0.95)) continue; // pairs on one switchback are a bend, not two stretches
        best = Math.min(best, Math.hypot(r.X[i] - r.X[j], r.Z[i] - r.Z[j]));
      }
      return { clearance: best, width: ch.w, maxOpen: OPEN_MAX };
    };
    // The tunnel: one mesh per route, how many faces its openings removed, and the branch that is being walked (where it starts
    // and ends against the spot it left from, and how far below the main path it runs).
    api.tunnel = function () {
      var m = state.mainRoute.tube.mesh;
      return { instanced: state.mainRoute.group.children.filter(function (o) { return o.isInstancedMesh; }).length, mainTris: m.geometry.index.count / 3, rings: state.mainRoute.tube.n, holes: state.mainRoute.tube.holes.length, width: ch.w, len: state.mainRoute.len };
    };
    api.branch = function () {
      var wk = state.walk, r = wk.route; if (r.kind === "main") return null;
      var fr = state.stack[state.stack.length - 1], b = at(fr.route, fr.s), s0 = ptOn(r, 0), s1 = ptOn(r, r.len), lowest = 0;
      for (var i = 0; i < r.Y.length; i++) lowest = Math.min(lowest, r.Y[i] - b.y);
      return { kind: r.kind, len: r.len, startGap: Math.hypot(s0.x - b.x, s0.z - b.z), endGap: Math.hypot(s1.x - b.x, s1.z - b.z), lowest: lowest, stops: r.stops.length, holes: r.holes };
    };
    api.lanterns = function () { return lanternsOn.length; };
    api.elementScreen = function () {
      var c = ctxOf(), v = c.holder.getWorldPosition(new THREE.Vector3()); v.y += 1.4; v.project(camera);
      var r = dom.getBoundingClientRect();
      return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
    };
  }


  window.__oagCave = { start: start, load: load, dive: function (label) { return dive(label, document.querySelector("[data-cave-home]")); }, layoutMain: layoutMain, WAVE: WAVE };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
