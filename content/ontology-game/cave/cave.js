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
  var SIDE_LEN = 160;    // the side passage's length; the five places line it, one breath of walking apart
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
  var CHARGE_LOOK = { constriction: { w: 0.62, fog: 0.03 }, tension: { w: 0.85, fog: 0.02 }, numbness: { w: 1.15, fog: 0.05 }, strength: { w: 1.25, fog: 0.012 }, other: { w: 1, fog: 0.02 } };
  // The one chamber every portal opens (half-width, half-height and length in chamber units).
  var CHAMBER = { w: 4.4, h: 3, length: 20 };
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
  // r = { X, Z, S (distance along), len, startS, stops: [distances] }. The avatar only ever stands on this line.
  function makeRoute(pts, stopAt, kind) {
    var r = { X: [], Z: [], S: [], kind: kind, stops: [] }, acc = 0;
    pts.forEach(function (p, i) {
      if (i) acc += Math.hypot(p.x - pts[i - 1].x, p.z - pts[i - 1].z);
      r.X.push(p.x); r.Z.push(p.z); r.S.push(acc);
    });
    r.len = acc; r.stopAt = stopAt;
    return r;
  }
  function ptOn(r, s) {
    s = Math.max(0, Math.min(r.len, s));
    var lo = 0, hi = r.S.length - 1;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (r.S[m] <= s) lo = m; else hi = m; }
    var k = (s - r.S[lo]) / Math.max(1e-6, r.S[hi] - r.S[lo]);
    return { x: r.X[lo] + (r.X[hi] - r.X[lo]) * k, z: r.Z[lo] + (r.Z[hi] - r.Z[lo]) * k };
  }
  function at(r, s) { // point and unit forward direction
    var p = ptOn(r, s), a = ptOn(r, s - 0.6), b = ptOn(r, s + 0.6), dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
    return { x: p.x, z: p.z, fx: dx / l, fz: dz / l };
  }
  function yawFacing(f) { return Math.atan2(f.fx, f.fz); } // a figure that faces +z
  function distToRoute(r, x, z) { // how far a point is from the line (the test uses it: the avatar never leaves it)
    var best = 1e9;
    for (var i = 1; i < r.X.length; i++) { // nearest point on each little segment
      var ax = r.X[i - 1], az = r.Z[i - 1], bx = r.X[i] - ax, bz = r.Z[i] - az, l2 = bx * bx + bz * bz || 1;
      var t = clamp((((x - ax) * bx) + ((z - az) * bz)) / l2, 0, 1);
      best = Math.min(best, Math.hypot(ax + bx * t - x, az + bz * t - z));
    }
    return best;
  }

  // The main path: seven rows, one per W.A.V.E. step, joined by half-circle switchbacks; each row wanders a little.
  // Rows are far enough apart that the walls never meet, so there are no free turns and no dead ends.
  function layoutMain(seed, w) {
    var R = rngOf(hashOf(seed));
    var rows = STRETCHES.map(function (r) { return { step: r[0], len: r[1] * (0.9 + 0.2 * R()), amp: r[2] * (0.75 + 0.5 * R()) }; });
    var ampMax = 0; rows.forEach(function (r) { ampMax = Math.max(ampMax, Math.abs(r.amp)); });
    var ru = Math.max(8, w * 1.15 + ampMax + 2.5), pitch = 2 * ru, ds = 0.5, pts = [], ends = [], x = 0, dir = 1;
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
    var r = makeRoute(pts, null, "main");
    r.startS = LEAD; r.rows = rows.map(function (row) { return { step: row.step, len: Math.round(row.len * 10) / 10, amp: Math.round(row.amp * 10) / 10 }; });
    r.stops = ends.map(function (e) { return r.S[e] - 1.5; });
    r.exitS = r.len; r.pitch = pitch;
    return r;
  }
  // A side passage: straight, with the five places along it.
  function layoutSide() {
    var pts = [], ds = 0.5;
    for (var k = 0; k <= (SIDE_LEN + LEAD) / ds; k++) pts.push({ x: 0, z: LEAD - k * ds });
    var r = makeRoute(pts, null, "side");
    r.startS = LEAD; r.stops = PLACES.map(function (p) { return LEAD + p.s; }); r.exitS = r.len;
    return r;
  }

  // ---- the walls, the floor and the lit pebbles along a route -----------------------------------
  // Instanced from the kit's wall_ring and floor, one draw call each. setBreath eases the walls in and out a little.
  // route.stops (the main path only) split the rings into stretches; open[k] widens stretch k's walls, and the rings within
  // a few units of a marker blend into the next stretch, so the walls open as the avatar passes a marker.
  function buildTunnel(THREE, G, route, w, h, rock) {
    var step = 2, L = step * 1.4, n = Math.ceil(route.len / step), grp = new THREE.Group(), base = [], ringK = [], ringA = [], ringB = [], ringW = [];
    var rings = new THREE.InstancedMesh(G.wall_ring, rock, n), floors = new THREE.InstancedMesh(G.floor, rock, n);
    rings.frustumCulled = false; floors.frustumCulled = false;
    var M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), Sc = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
    for (var i = 0; i < n; i++) {
      var m = at(route, i * step + step / 2), th = Math.atan2(-m.fx, -m.fz), b = { x: m.x - m.fx * L / 2, z: m.z - m.fz * L / 2, th: th };
      base.push(b);
      var sc = i * step + step / 2, kk = 0;
      if (route.kind === "main") while (kk < route.stops.length && route.stops[kk] < sc) kk++;
      var dB = kk > 0 ? sc - route.stops[kk - 1] : 99;
      ringA.push(Math.max(0, dB < 5 ? kk - 1 : kk)); ringB.push(Math.min(kk, 6)); ringW.push(dB < 5 ? dB / 5 * (dB / 5) * (3 - 2 * dB / 5) : 1);
      Q.setFromAxisAngle(Y, th); P.set(b.x, -h * 0.92, b.z); Sc.set(w * 1.8, 1, L); M.compose(P, Q, Sc); floors.setMatrixAt(i, M);
    }
    var t = { group: grp, k: -1, open: [1, 1, 1, 1, 1, 1, 1], dirty: true };
    t.setOpen = function (arr) { for (var q = 0; q < 7; q++) if (Math.abs(arr[q] - t.open[q]) > 0.0005) { t.open[q] = arr[q]; t.dirty = true; } };
    t.setBreath = function (k) {
      if (Math.abs(k - t.k) < 0.0005 && !t.dirty) return;
      t.k = k; t.dirty = false;
      for (var j = 0; j < n; j++) {
        var bb = base[j], o = t.open[ringA[j]] * (1 - ringW[j]) + t.open[ringB[j]] * ringW[j], kj = k * o;
        Q.setFromAxisAngle(Y, bb.th); P.set(bb.x, 0, bb.z); Sc.set(w * kj, h * kj, L); M.compose(P, Q, Sc); rings.setMatrixAt(j, M);
      }
      rings.instanceMatrix.needsUpdate = true;
    };
    t.setBreath(1);
    floors.instanceMatrix.needsUpdate = true;
    grp.add(rings); grp.add(floors);
    // The path stays lit: small warm stones down both edges of the floor.
    var count = Math.floor(route.len / 2.5) * 2, pe = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.13, 0), new THREE.MeshBasicMaterial({ color: 0xffe0a0 }), count), c = 0;
    pe.frustumCulled = false;
    for (var s = 1; s < route.len - 1 && c < count; s += 2.5) {
      var a = at(route, s);
      [-1, 1].forEach(function (sd) {
        Q.identity(); P.set(a.x + -a.fz * sd * w * 0.3, -h * 0.92 + 0.1, a.z + a.fx * sd * w * 0.3); Sc.set(1, 1, 1); M.compose(P, Q, Sc); pe.setMatrixAt(c++, M);
      });
    }
    pe.count = c; pe.instanceMatrix.needsUpdate = true;
    grp.add(pe);
    return t;
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
  // The opening that appears in the wall when a step won't go further: a dark doorway with a glowing rim.
  function buildOpening(THREE) {
    var g = new THREE.Group();
    var disc = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: 0x020204, side: THREE.DoubleSide }));
    var rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.08, 8, 28), new THREE.MeshBasicMaterial({ color: 0xfff1b0 }));
    rim.position.z = 0.02; g.add(disc); g.add(rim);
    g.userData.rim = rim;
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
    ".oagc-card.oagc-float{left:0;top:0;right:auto;bottom:auto;width:max-content;max-width:min(340px,calc(100vw - 24px));padding:.45rem;background:rgba(14,14,30,.74);border:1px solid rgba(255,255,255,.22);border-radius:14px;max-height:70vh;will-change:transform}" +
    ".oagc-float .oagc-row{justify-content:center;margin:.25rem 0 0;gap:.3rem}.oagc-float .oagc-row:first-child{margin-top:0}.oagc-float button{min-height:40px;padding:.3rem .6rem;font-size:.82rem}" +
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
    // The canvas fills the page. The only panel that docks to the bottom is the doorway's (charge, feeling) and the path between
    // places; while walking, a step's name and words hang in the scene (the sign) and its choices float at the marker (the card).
    var canvasBox = el("div", { class: "oagc-stage" });
    var card = el("div", { class: "oagc-card oagc-float", "data-cave-card": "", style: "display:none" });
    var stat = el("div", { class: "oagc-sr", "data-cave-signtext": "", "aria-live": "polite" }); // the sign's words as page text, and the state marks
    wrap.appendChild(canvasBox); wrap.appendChild(card); wrap.appendChild(stat); wrap.appendChild(fade);
    wrap.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    document.body.appendChild(wrap);
    fade.style.opacity = 1; setTimeout(function () { fade.style.opacity = 0; }, 30); // the dive: in from black
    home.style.display = "none";

    var renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch (e) {
      card.className = "oagc-card"; card.style.display = ""; card.textContent = "This device cannot show the cave. The body map and the game still work."; return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    canvasBox.appendChild(renderer.domElement);
    var scene = new THREE.Scene(); scene.background = new THREE.Color(0x0c0c16); scene.fog = new THREE.FogExp2(0x0c0c16, 0.02);
    var camera = new THREE.PerspectiveCamera(70, 1, 0.1, 200);

    // The sitting. sens[i] = { id, spot, texture, element, saved, passed, blocked: [], skipped: [] }.
    // walk = { route, s, target, arrived, lat, block }. stack holds where each side passage branched from.
    // speed scales the walk clock (the test sets it above 1 to cross a stretch faster than one breath); it is 1 in play.
    var state = { sens: [], cur: null, mode: "portal", dress: null, look: { yaw: 0, pitch: 0 }, walk: null, stack: [], calm: false, ringOn: false, held: false, speed: 1, touched: false, layout: null, walkedOnce: false };
    var parts = {}, ch = null, flight = null, busy = false, tweens = [], blockN = 0, snapCam = true, avatar = null, lamp = null, hemi = null, glow = [];
    var docked = true, cardDirty = true;
    // The light of the stretch being walked (lk eases toward the table row), the walls' openness per stretch, and the surge on entering one.
    var lk = { idx: 0, light: new THREE.Color(STEP_LOOK[0].light), fog: new THREE.Color(STEP_LOOK[0].fog), fogK: STEP_LOOK[0].fogK, hemi: STEP_LOOK[0].hemi, flash: 0 };
    var openCur = STEP_LOOK.map(function () { return STEP_LOOK[0].open; }), revealed = 0;
    // The sign: the step's name and words as text in the scene, on a canvas texture, facing the camera (see drawSign).
    var sign = { sprite: null, canvas: null, title: "", paras: [], foot: "", has: false, pos: new THREE.Vector3(), snap: true, fade: 0, avatarAnchor: false, cw: 1, ch: 1, accent: "#fff1b0", info: null };
    var camPos = new THREE.Vector3(), lookAt = new THREE.Vector3(), looseNow = 0, last = performance.now(), lanternsOn = [];
    // The breath: b runs 0 (empty) to 1 (full). d is how fast it is changing.
    var br = { b: 0.5, target: 0.5, d: 0, t0: performance.now() / 1000, ring: 0, ringHeld: false, lastRing: -1e9, k: 1 };
    var WARM = new THREE.Color(0xffa860);

    function clearScene() {
      while (scene.children.length) scene.remove(scene.children[0]);
      ch = null; flight = null; busy = false; tweens = []; avatar = null; lamp = null; hemi = null; glow = []; lanternsOn = [];
      if (sign.sprite && sign.sprite.material.map) sign.sprite.material.map.dispose();
      state.walk = null; state.stack = []; snapCam = true; sign.sprite = null; sign.has = false;
      lk.idx = 0; lk.flash = 0; revealed = 0; openCur = STEP_LOOK.map(function () { return STEP_LOOK[0].open; });
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
    function syncRing() { // the ring is shown only when it is on and the cave is not stilled
      var show = state.ringOn && !state.calm;
      if (show && !ring.parentNode) canvasBox.appendChild(ring); else if (!show && ring.parentNode) ring.remove();
      if (!show) br.ringHeld = false;
    }
    canvasBox.appendChild(calmBtn); canvasBox.appendChild(ringBtn);
    function breathStep(dt, nowS) {
      var T = BREATH_S, u, wk = state.walk;
      // While the player holds and walks, the cave breathes with the avatar (the walk clock is the breath); let go and the
      // cave's own breath carries on from where the walk left it.
      if (wk && wk.moving && !state.calm && !(state.ringOn && nowS - br.lastRing < HOLD_ABOUT_AFTER)) br.t0 = nowS - (wk.t % T);
      if (state.calm) { br.target = 0.5; br.d = 0; }
      else if (state.ringOn && nowS - br.lastRing < HOLD_ABOUT_AFTER) {
        var prev = br.ring;
        br.ring = clamp(br.ring + (br.ringHeld ? dt / BREATH.inS : -dt / BREATH.outS), 0, 1);
        br.target = br.ring; br.d = (br.ring - prev) / Math.max(dt, 1e-3);
      } else {
        var tm = (((nowS - br.t0) % T) + T) % T;
        if (tm < BREATH.inS) { u = tm / BREATH.inS; br.target = 0.5 - 0.5 * Math.cos(Math.PI * u); br.d = (Math.PI / 2) * Math.sin(Math.PI * u) / BREATH.inS; }
        else { u = (tm - BREATH.inS) / BREATH.outS; br.target = 0.5 + 0.5 * Math.cos(Math.PI * u); br.d = -(Math.PI / 2) * Math.sin(Math.PI * u) / BREATH.outS; }
        if (state.ringOn) br.ring = br.target; // the ring picks up where the cave is
      }
      br.b += (br.target - br.b) * Math.min(1, dt * 8);
      br.k = 1 + 0.08 * (br.b - 0.5); // the walls ease in and out by a few percent
      if (state.calm) { br.b = 0.5; br.k = 1; }
    }
    function paceNow() { // the walk's speed against its average: quicker on the inhale (1.25), slower on the exhale (0.83)
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
      if (drag.moved > 12) { // a moving finger looks around; a still one walks
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
      var hit = ray.intersectObjects(((c && c.stones) || []).concat(kids))[0];
      if (!hit) return;
      var o = hit.object;
      if (o.userData.face && onPlace("gate")) stand(o.userData.face);
      else if (o.userData.interact) touch();
    });

    // ---- the cards -------------------------------------------------------------------------
    function P(text, attrs) { var a = attrs || {}; a.text = text; return el("p", a); }
    function btn(label, attrs, fn, alt) { var a = attrs || {}; a.text = label; a.onclick = fn; if (alt) a["class"] = "alt"; return el("button", a); }
    function row(kids) { return el("div", { class: "oagc-row" }, kids); }
    function choice(opts, picked, onPick) {
      return el("div", { class: "oagc-row" }, opts.map(function (o) {
        return el("button", { class: "alt", "data-cave-choice": o[0], "aria-pressed": String(picked === o[0]), text: o[1], onclick: function () { onPick(o); } });
      }));
    }
    // fill puts a page up. The doorway's pages (dock true) are the bottom panel, as they were. Everything met while walking is
    // not: its words (the title and every paragraph) become the sign in the scene and are also kept as page text for screen
    // readers, and its choices (the buttons) float in a small card anchored to the marker.
    function fill(title, kids, dock) {
      stat.removeAttribute("data-cave-marker"); stat.removeAttribute("data-cave-walking");
      card.innerHTML = ""; stat.innerHTML = ""; docked = !!dock; sign.avatarAnchor = false; cardDirty = true;
      if (docked) {
        card.className = "oagc-card"; card.style.display = ""; card.style.transform = ""; sign.has = false;
        card.appendChild(el("h2", { text: title }));
        kids.forEach(function (k) { card.appendChild(k); });
        return;
      }
      card.className = "oagc-card oagc-float";
      var paras = [], foot = "", ctl = 0;
      stat.appendChild(el("h2", { text: title }));
      kids.forEach(function (k) {
        if (k.tagName === "P") { stat.appendChild(k); if (k.hasAttribute("data-cave-hint")) foot = k.textContent; else paras.push(k.textContent); }
        else { card.appendChild(k); ctl++; }
      });
      card.style.display = ctl ? "" : "none";
      setSign(title, paras, foot);
    }

    // ---- the doorway: one question per page, and the cave changes with each answer -------------
    // The face is not asked here (players do not yet know enough about the faces); all six are met at the gate.
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

    // The cave forms around the charge at once, with the avatar standing at the start; the next page asks the feeling.
    function form(s) {
      clearScene(); parts = {}; state.mode = "chamber"; state.look = { yaw: 0, pitch: 0 }; state.touched = false;
      var look = CHARGE_LOOK[s.texture] || CHARGE_LOOK.other, tex = lookup(TEXTURES, s.texture) || TEXTURES[4];
      var G = {}; Object.keys(A.kit).forEach(function (k) { G[k] = geomOf(THREE, A.kit[k]); });
      var w = CHAMBER.w * look.w, h = CHAMBER.h;
      parts.G = G; parts.w = w; parts.h = h; parts.fog = look.fog;
      parts.rock = new THREE.MeshStandardMaterial({ color: tex[2], roughness: 0.95, side: THREE.DoubleSide });
      var main = layoutMain(s.spot.id + ":" + s.texture, w);
      main.yOff = 0; main.group = new THREE.Group();
      main.tunnel = buildTunnel(THREE, G, main, w, h, parts.rock); main.group.add(main.tunnel.group);
      main.markers = main.stops.map(function (st, i) {
        var m = buildMarker(THREE, w, h, STEP_LOOK[i].light), a = at(main, st + MARK_AHEAD); m.position.set(a.x, -h * 0.92 + MARK_Y, a.z); main.group.add(m); return m;
      });
      main.ctx = { holder: new THREE.Group(), lampHex: 0xffe0b0 };
      // The element stands beside the first stretch as its own object; the player can tap it. It is not made until the feeling is named.
      var ea = at(main, main.startS + 9), side = Math.min(w * 0.34, 1.1);
      main.ctx.holder.position.set(ea.x + -ea.fz * -side, -h * 0.92, ea.z + ea.fx * -side);
      main.group.add(main.ctx.holder);
      // The way out: an arch of light at the end of the last stretch.
      var xa = at(main, main.exitS - 0.2), arch = new THREE.Mesh(G.portal_arch, new THREE.MeshBasicMaterial({ color: 0xfff1b0 }));
      arch.position.set(xa.x, -h * 0.92, xa.z); arch.rotation.y = yawFacing(xa); arch.scale.setScalar(Math.min(w * 0.55, h * 0.7));
      main.group.add(arch); main.arch = arch;
      var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.6, 40, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1b0, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
      beam.position.set(xa.x, 18, xa.z); main.group.add(beam);
      scene.add(main.group); ch = { main: main, w: w, h: h };
      lamp = new THREE.PointLight(0xffe0b0, 1.1, 60); scene.add(lamp);
      hemi = new THREE.HemisphereLight(0xffffff, 0x302828, 0.45); scene.add(hemi);
      scene.fog.density = look.fog * STEP_LOOK[0].fogK;
      lk.idx = 0; lk.light.setHex(STEP_LOOK[0].light); lk.fog.setHex(STEP_LOOK[0].fog); lk.fogK = STEP_LOOK[0].fogK; lk.hemi = STEP_LOOK[0].hemi; lk.flash = 0;
      scene.background.copy(lk.fog); scene.fog.color.copy(lk.fog); main.tunnel.setOpen(openCur);
      avatar = buildAvatar(THREE, s.texture); scene.add(avatar);
      parts.dress = { wall: tex[2], width: Math.round(w * 100) / 100, fog: look.fog, element: null, lamp: 0xffe0b0 };
      state.dress = parts.dress;
      state.layout = { seed: s.spot.id + ":" + s.texture, rows: main.rows, stops: main.stops.map(function (v) { return Math.round(v * 100) / 100; }), length: Math.round(main.len * 10) / 10 };
      state.walk = { route: main, s: main.startS, s0: main.startS, D: main.stops[0] - main.startS, t: 0, ready: false, moving: false, target: 0, arrived: false, lat: 0, block: null };
      state.mainRoute = main;
      looseNow = 0;
      feeling(s);
    }
    function feeling(s) {
      stat.setAttribute("data-cave-place", "portal");
      fill("Which feeling is here?", [
        P("The walls have taken your " + lookup(TEXTURES, s.texture)[1] + ". Its feeling has an element."),
        choice(ELEMENTS.map(function (x) { return [x[0], x[0] + " · " + x[1]]; }), null, function (o) {
          s.element = o[0]; setElementOn(state.mainRoute.ctx, o[0], Math.min(ch.w * 0.3, 1.3)); parts.dress.element = o[0]; parts.dress.lamp = lookup(ELEMENTS, o[0])[3];
          hint(0);
        }),
      ], true);
      stat.setAttribute("data-cave-place", "portal");
    }
    // The element object for a route: fire, a pool of water, a tree, a crystal, a boulder.
    function setElementOn(ctx, name, r) {
      var e = lookup(ELEMENTS, name);
      while (ctx.holder.children.length) ctx.holder.remove(ctx.holder.children[0]);
      var obj = buildElement(THREE, name, r);
      obj.traverse(function (m) { if (m.isMesh) { m.userData.interact = name; if (m.material.emissiveIntensity) glow.push({ m: m.material, base: m.material.emissiveIntensity }); } });
      ctx.holder.add(obj); ctx.elObj = obj; ctx.lampHex = e[3]; ctx.element = name;
    }

    // ---- walking ---------------------------------------------------------------------------
    function ctxOf() { return state.walk && state.walk.route.ctx; }
    function onPlace(id) { var wk = state.walk; return wk && wk.block && wk.arrived && PLACES[wk.target].id === id; }
    // What a place asks while the avatar is still walking toward it (the sign shows this, then the full page on arrival).
    var PLACE_ASK = { mouth: "What is the block like, in the body?", pool: "Which feeling is here? Tap its element.", passage: "A daemon stands in the way. Which one is it?",
      gate: "Six stones, one for each face. Stand at each and ask what it asks.", way_out: "Light from above. Breathe out." };
    function hint(i) { // the sign while walking: the step being walked toward, hanging in the cave ahead
      var wk = state.walk, label = wk.block ? PLACES[i].step : WAVE[i][1];
      wk.target = i;
      stat.setAttribute("data-cave-place", "walk");
      var kids = [P(wk.block ? PLACE_ASK[PLACES[i].id] : WAVE[i][2])];
      if (!state.walkedOnce) kids.push(P("Hold anywhere to walk. Drag to look.", { "data-cave-hint": "" }));
      fill(label, kids);
      stat.setAttribute("data-cave-walking", wk.block ? PLACES[i].id : WAVE[i][0]);
      // One stretch is one breath of holding: from here to the marker, 4 s of inhale then 6 s of exhale.
      wk.target = i; wk.arrived = false; wk.ready = true; wk.s0 = wk.s; wk.D = Math.max(1, wk.route.stops[i] - wk.s); wk.t = 0; wk.moving = false;
      if (avatar) { avatar.userData.stepIdx = 0; avatar.userData.stepsIn = 0; avatar.userData.stepsOut = 0; }
      if (!wk.block) { // entering a stretch: the light turns, the walls open, a short surge
        if (i !== lk.idx || i === 0) lk.flash = 1;
        revealed = Math.max(revealed, i);
      }
    }
    function arrive() {
      var wk = state.walk;
      if (wk.block) placeCard(wk.block); else markerCard(wk.target);
    }
    // Holding walks the avatar; the walk clock t counts held seconds (scaled by speed) from 0 to one full breath, and lifting
    // the thumb stops it, so the walk and its breath pause together. Calm walks at 0.8 of full (a choice carried over).
    function walkStep(dt) {
      var wk = state.walk; if (!wk) return;
      wk.moving = false;
      if (!wk.ready || wk.arrived || busy || flight || !state.held) return;
      wk.moving = true; state.walkedOnce = true;
      wk.t = Math.min(BREATH_S, wk.t + dt * state.speed * (state.calm ? 0.8 : 1));
      wk.s = wk.s0 + wk.D * stretchFrac(wk.t);
      if (wk.t >= BREATH_S) { wk.s = wk.s0 + wk.D; wk.arrived = true; wk.moving = false; arrive(); }
    }

    // ---- the main path's markers: go on, or "this step won't go further" ---------------------------
    function markerCard(i) {
      var s = me(), wv = WAVE[i], last = i === WAVE.length - 1, body = [];
      stat.setAttribute("data-cave-place", "marker");
      if (s.blocked.indexOf(wv[0]) >= 0) body.push(P("You are back from the block at " + wv[1] + ".", { "data-cave-back": "" }));
      body.push(P(wv[2], { "data-cave-prompt": "" }));
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
    // The way out: the camera rises out of the cave to the light, and the scan is saved.
    function finishOut() {
      busy = true; stat.setAttribute("data-cave-place", "rising"); fill("Light from above", [P("Breathe out.")]); sign.avatarAnchor = true;
      var y0 = camera.position.y;
      tween(2200, function (k) { state.rise = { k: ease(k), y0: y0 }; }, function () { state.rise = null; leave(true); });
    }

    // ---- a block: a side passage opens in the wall, and the five places line it ----------------------
    // key is the saved name of the blocked step: a W.A.V.E. step on the main path, or a place inside a side passage.
    function openBlock(stepId, label) {
      if (busy) return;
      var wk = state.walk, s = me(), route = wk.route, depth = state.stack.length + 1;
      var key = wk.block ? wk.block.key + ">" + PLACES[wk.target].key : stepId;
      if (s.blocked.indexOf(key) < 0) s.blocked.push(key);
      busy = true;
      var frame = { route: route, s: wk.s, target: wk.target, block: wk.block, key: key, label: label };
      stat.setAttribute("data-cave-place", "opening"); fill(label, [P("The wall opens.")]);
      // The opening in the wall, and a lantern that stays where the player branched.
      var a = at(route, wk.s), sd = state.stack.length % 2 ? -1 : 1, nx = -a.fz * sd, nz = a.fx * sd, w = ch.w, h = ch.h;
      var open = buildOpening(THREE);
      open.position.set(a.x + nx * w * 0.82, -h * 0.55, a.z + nz * w * 0.82);
      open.rotation.y = Math.atan2(-nx, -nz); open.scale.set(0.05, 0.05, 1);
      route.group.add(open);
      var lan = buildLantern(THREE); lan.position.set(a.x + nx * w * 0.3 - a.fx * 1.4, -h * 0.92, a.z + nz * w * 0.3 - a.fz * 1.4);
      route.group.add(lan); lanternsOn.push(lan); frame.lantern = lan; frame.opening = open;
      var blk = makeBlock(frame, key, depth); frame.child = blk;
      tween(1300, function (k) {
        var e = ease(k); open.scale.set(1.15 * e + 0.05, 1.6 * e + 0.05, 1);
        state.walk.lat = e * w * 0.2 * sd;
      }, function () {
        fade.style.opacity = 1;
        setTimeout(function () {
          state.stack.push(frame);
          state.walk = { route: blk.route, s: blk.route.startS, s0: blk.route.startS, D: 1, t: 0, ready: false, moving: false, target: 0, arrived: false, lat: 0, block: blk };
          blk.route.group.visible = true; route.group.visible = route.group === ch.main.group;
          snapCam = true; busy = false; hint(0); fade.style.opacity = 0;
        }, 520);
      });
    }
    // The side passage: walls dressed in the blocker's own charge, the five places, and their objects.
    function makeBlock(frame, key, depth) {
      var w = ch.w, h = ch.h, s = me(), G = parts.G;
      var par = frame.block, tex = par ? par.texture : s.texture;
      var blk = { id: "b" + (++blockN), key: key, label: frame.label, depth: depth, texture: tex, element: par ? par.element : s.element, daemon: null, stepAside: null, gate: [], route: layoutSide(), frame: frame, touched: false };
      var route = blk.route; route.yOff = -400 * depth; route.group = new THREE.Group(); route.group.position.y = route.yOff;
      blk.rock = new THREE.MeshStandardMaterial({ color: (lookup(TEXTURES, tex) || TEXTURES[4])[2], roughness: 0.95, side: THREE.DoubleSide });
      route.tunnel = buildTunnel(THREE, G, route, w, h, blk.rock); route.group.add(route.tunnel.group);
      route.markers = route.stops.map(function (st) {
        var m = buildMarker(THREE, w, h, SIDE_LOOK.light), a = at(route, st + MARK_AHEAD); m.position.set(a.x, -h * 0.92 + MARK_Y, a.z); route.group.add(m); return m;
      });
      var ctx = route.ctx = { holder: new THREE.Group(), lampHex: 0xffe0b0, stones: [] };
      // the element stands well ahead of the marker, so the card hanging under the marker never covers it
      ctx.holder.position.set(Math.min(w * 0.4, 2.2), -h * 0.92, -(PLACES[1].s + 11)); route.group.add(ctx.holder);
      if (blk.element) setElementOn(ctx, blk.element, Math.min(w * 0.45, 2));
      var gr = Math.min(w * 0.36, 1.5);
      FACES.forEach(function (f, i) {
        var a = (i / 6) * Math.PI * 2;
        var st = new THREE.Mesh(G.gate_stone, new THREE.MeshStandardMaterial({ color: 0x70707e, roughness: 0.8, emissive: 0x000000 }));
        st.position.set(Math.cos(a) * gr, -h * 0.92, -(PLACES[3].s + 5) + Math.sin(a) * gr);
        st.scale.set(Math.min(gr, 3) * 0.7, Math.min(h * 1.1, 4), Math.min(gr, 3) * 0.7); st.userData.face = f[0];
        route.group.add(st); ctx.stones.push(st);
      });
      var arch = new THREE.Mesh(G.portal_arch, new THREE.MeshBasicMaterial({ color: 0xfff1b0 }));
      arch.position.set(0, -h * 0.92, -(PLACES[4].s + 6)); arch.scale.setScalar(Math.min(w * 0.55, h * 0.7)); route.group.add(arch);
      route.group.visible = false; scene.add(route.group);
      return blk;
    }
    function dropBlock(blk) {
      scene.remove(blk.route.group);
      lanternsOn = lanternsOn.filter(function (l) { return l.parent !== blk.route.group; });
    }

    // Release walks back to the exact spot the player branched from; a skip walks back to the main path.
    // Passages the player leaves are put away; the lanterns on the way stay.
    function comeBack(toMain) {
      if (busy) return;
      busy = true; fade.style.opacity = 1;
      setTimeout(function () {
        if (toMain) while (state.stack.length > 1) dropBlock(state.stack.pop().child);
        var fr = state.stack.pop(); dropBlock(fr.child);
        fr.route.group.visible = true;
        state.walk = { route: fr.route, s: fr.s, s0: fr.s, D: 0, t: BREATH_S, ready: true, moving: false, target: fr.target, arrived: true, lat: 0, block: fr.block };
        snapCam = true; busy = false; fade.style.opacity = 0;
        arrive();
      }, 520);
    }
    function release() { comeBack(false); }
    function skip() {
      var s = me(), wk = state.walk;
      // A skip is marked on the scan too: the step stayed blocked and its work was not done.
      var chain = [], b = wk.block; while (b) { chain.unshift(b.key); b = b.frame.block; }
      chain.forEach(function (k) { if (s.skipped.indexOf(k) < 0) s.skipped.push(k); });
      comeBack(true);
    }

    // ---- the side passage's places (the old five-place walk, now opened by a block) ---------------
    function next(blk) {
      if (blk.place < PLACES.length - 1) { blk.place++; hint(blk.place); }
    }
    function redress(blk) {
      blk.rock.color.setHex((lookup(TEXTURES, blk.texture) || TEXTURES[4])[2]);
      var c = blk.route.ctx;
      if (blk.element && c.element !== blk.element) { setElementOn(c, blk.element, Math.min(ch.w * 0.45, 2)); blk.touched = false; }
    }
    function touch() { // the element answers when tapped: it swells and glows, and the move is named
      var c = ctxOf(); if (!c) return;
      c.pulse = performance.now(); state.touched = true;
      var wk = state.walk; if (wk.block && onPlace("pool")) { wk.block.touched = true; placeCard(wk.block); }
    }

    function placeCard(blk) {
      var wk = state.walk, p = PLACES[wk.target], body = [], kids = [];
      blk.place = wk.target;
      stat.setAttribute("data-cave-place", p.id);
      var go = btn("Continue", { "data-cave-next": "" }, function () { next(blk); });
      if (p.id === "mouth") {
        body.push(P("What is the block like, in the body?"));
        body.push(choice(TEXTURES.map(function (t) { return [t[0], t[1]]; }), blk.texture, function (o) { blk.texture = o[0]; redress(blk); placeCard(blk); }));
        body.push(P("Is anything else showing up somewhere else in your body?"));
        body.push(row([btn("Yes, name another place", { "data-cave-add": "" }, addPlace, true)]));
        var s = me();
        if (state.sens.length > 1) body.push(P("Also named this sitting: " + state.sens.filter(function (o) { return o !== s; }).map(function (o) { return o.spot.words; }).join(", ") + ".", { "data-cave-also": "" }));
      } else if (p.id === "pool") {
        var e = lookup(ELEMENTS, blk.element);
        body.push(P(e[0] + " is " + e[1] + ". Tap it. The move that goes with it: " + e[2] + "."));
        if (blk.touched) body.push(P("It answers you. " + e[2] + ".", { "data-cave-touched": "" }));
        body.push(P(CHANNEL_JOBS[e[0]], { "data-cave-job": "" }));
        body.push(choice(ELEMENTS.map(function (x) { return [x[0], x[0] + " · " + x[1]]; }), blk.element, function (o) { blk.element = o[0]; redress(blk); placeCard(blk); }));
      } else if (p.id === "passage") {
        var d = blk.daemon && lookup(DAEMONS, blk.daemon);
        if (!d) {
          body.push(P("A daemon stands in the way. Which one is it?"));
          body.push(choice(DAEMONS.map(function (x) { return [x[0], x[1]]; }), null, function (o) { meet(blk, o[0]); }));
          go.disabled = true;
        } else {
          body.push(P(d[1] + "'s job: " + d[2], { "data-cave-daemon-job": "" }));
          body.push(P("Who it works for: " + DAEMON_WORKS_FOR, { "data-cave-daemon-for": "" }));
          if (!blk.stepAside) {
            body.push(P("Knowing that, will it step aside?"));
            body.push(row([
              btn("Yes, it steps aside", { "data-cave-aside": "yes" }, function () { blk.stepAside = "yes"; moveDaemon(blk); placeCard(blk); }),
              btn("Not yet", { "data-cave-aside": "not-yet" }, function () { blk.stepAside = "not-yet"; moveDaemon(blk); placeCard(blk); }, true),
            ]));
            go.disabled = true;
          } else {
            body.push(P(blk.stepAside === "yes" ? d[1] + " stepped to the wall, and the way is open." : d[1] + " isn't ready. It waits by the wall, and it will be here when you come back."));
          }
        }
      } else if (p.id === "gate") {
        var left = FACES.filter(function (f) { return blk.gate.indexOf(f[0]) < 0; });
        body.push(P("Six stones, one for each face. Stand at each and ask what it asks. " + blk.gate.length + " of 6."));
        body.push(row(FACES.map(function (f) {
          return el("button", { class: "alt", "data-cave-stone": f[0], "aria-pressed": String(blk.gate.indexOf(f[0]) >= 0), text: f[1], onclick: function () { stand(f[0]); } });
        })));
        var lastF = blk.gate[blk.gate.length - 1];
        if (lastF) { var lf = lookup(FACES, lastF); body.push(P(lf[1] + ": " + lf[2] + ". " + lf[3], { "data-cave-stone-says": "" })); }
        if (left.length) go.disabled = true;
      } else {
        body.push(P("Light from above. Breathe out, and come back to " + blk.label + "."));
        go = btn("Return to " + blk.label, { "data-cave-release": "" }, release);
      }
      kids.push(go);
      if (p.id !== "way_out") kids.push(btn("This step won't go further", { "data-cave-block": "" }, function () { openBlock(p.key, p.step); }, true));
      if (p.id !== "way_out") kids.push(btn("Skip", { "data-cave-skip": "" }, skip, true));
      fill(p.step, body.concat([row(kids)]));
    }

    function addPlace() {
      // The figure opens over the cave; the place named becomes a cave of its own, reached from the way out.
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
      var c = blk.route.ctx, d = lookup(DAEMONS, id), h = ch.h;
      if (c.daemonFig) blk.route.group.remove(c.daemonFig);
      c.daemonFig = buildDaemon(THREE, d, h * 1.1);
      c.daemonFig.position.set(0, -h * 0.9, -(PLACES[2].s + 6));
      blk.route.group.add(c.daemonFig);
      placeCard(blk);
    }
    function moveDaemon(blk) {
      var c = blk.route.ctx; if (!c.daemonFig) return;
      c.daemonT = { t0: performance.now(), from: c.daemonFig.position.x, to: ch.w * 0.36 };
    }
    function stand(face) {
      var wk = state.walk, blk = wk.block, c = ctxOf();
      if (!blk || !onPlace("gate")) return;
      if (blk.gate.indexOf(face) < 0) blk.gate.push(face);
      c.stones.forEach(function (st) {
        if (blk.gate.indexOf(st.userData.face) >= 0) { var col = lookup(FACES, st.userData.face)[4]; st.material.color.setHex(col); st.material.emissive.setHex(col); st.material.emissiveIntensity = st.userData.face === face ? 0.9 : 0.45; }
      });
      placeCard(blk);
    }

    // ---- the path between two places -------------------------------------------------------
    function save(s) {
      if (s.saved || !s.texture) return;
      s.saved = true;
      // The scan is saved the way the body map saves one (body-map.js record), so "Where it has lived" shows it and
      // joins the places of one sitting with a line. The blocked W.A.V.E. steps go with it (cave-detour-kept): a
      // W.A.V.E. step id, or "step>place" for a block met inside that step's side passage.
      window.OAGBody.record({ location: s.spot.words, texture: s.texture, channel: s.element, where: "cave", blocked: s.blocked.slice(), skipped: s.skipped.slice() });
    }
    function follow(id) {
      var from = me(), to = state.sens.filter(function (o) { return o.id === id; })[0];
      if (!to || to === from || state.mode === "path" || busy) return;
      save(from);
      var Pp = function (sp) { return new THREE.Vector3(sp.position[0] * FIG, (sp.position[1] - 0.9) * FIG, sp.position[2] * FIG); };
      var a = Pp(from.spot), b = Pp(to.spot), mid = a.clone().add(b).multiplyScalar(0.5);
      mid.x *= 0.25; mid.z *= 0.25; // the path bends in toward the body's centre line, so it stays inside the figure
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

    // ---- the sign: a step's name and words as text in the scene ------------------------------------
    // A canvas texture on a sprite, so it always faces the camera. It hangs above the marker ahead (and slides along the path
    // ahead of the avatar while it walks), is drawn at a constant size on the screen so it reads on a phone (about nine tenths
    // of the width, never taller than under half the screen), and is held below the top of the screen.
    var SIGN_W = 520, measure = document.createElement("canvas").getContext("2d");
    var FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";
    function wrapLines(text, font, maxW) {
      measure.font = font;
      var lines = [], cur = "";
      String(text).split(/\s+/).forEach(function (w) {
        var t = cur ? cur + " " + w : w;
        if (cur && measure.measureText(t).width > maxW) { lines.push(cur); cur = w; } else cur = t;
      });
      if (cur) lines.push(cur);
      return lines;
    }
    function drawSign(title, paras, foot, accent) {
      var DPR = 2, pad = 26, inner = SIGN_W - 2 * pad, fT = "700 44px " + FONT, fB = "400 30px " + FONT, fF = "400 23px " + FONT;
      var tl = wrapLines(title, fT, inner), pl = paras.map(function (p) { return wrapLines(p, fB, inner); }), fl = foot ? wrapLines(foot, fF, inner) : [];
      var H = pad + tl.length * 52 + 8;
      pl.forEach(function (l) { H += l.length * 38 + 8; });
      if (fl.length) H += 6 + fl.length * 29;
      H += pad - 8;
      var c = document.createElement("canvas"); c.width = SIGN_W * DPR; c.height = Math.ceil(H) * DPR;
      var g = c.getContext("2d"); g.scale(DPR, DPR);
      g.fillStyle = "rgba(10,10,24,0.82)"; g.strokeStyle = accent; g.lineWidth = 3;
      var r = 26, w = SIGN_W - 6, hh = Math.ceil(H) - 6;
      g.beginPath(); g.moveTo(3 + r, 3); g.arcTo(3 + w, 3, 3 + w, 3 + hh, r); g.arcTo(3 + w, 3 + hh, 3, 3 + hh, r); g.arcTo(3, 3 + hh, 3, 3, r); g.arcTo(3, 3, 3 + w, 3, r); g.closePath(); g.fill(); g.stroke();
      g.textBaseline = "top"; g.textAlign = "left";
      var y = pad;
      g.font = fT; g.fillStyle = accent; tl.forEach(function (l) { g.fillText(l, pad, y); y += 52; }); y += 8;
      g.font = fB; g.fillStyle = "#f4f4fa"; pl.forEach(function (ls) { ls.forEach(function (l) { g.fillText(l, pad, y); y += 38; }); y += 8; });
      if (fl.length) { y += 6; g.font = fF; g.fillStyle = "#aab0c4"; fl.forEach(function (l) { g.fillText(l, pad, y); y += 29; }); }
      return { canvas: c, w: SIGN_W, h: Math.ceil(H) };
    }
    function lookNow() { var wk = state.walk; return wk && wk.block ? SIDE_LOOK : STEP_LOOK[Math.max(0, Math.min(6, wk ? wk.target : 0))]; }
    function setSign(title, paras, foot) {
      if (!ch) return;
      var accent = "#" + new THREE.Color(lookNow().light).lerp(new THREE.Color(0xffffff), 0.4).getHexString();
      var d = drawSign(title, paras, foot, accent);
      if (!sign.sprite) {
        sign.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, fog: false }));
        sign.sprite.renderOrder = 20; sign.sprite.frustumCulled = false; sign.sprite.center.set(0.5, 0); scene.add(sign.sprite); sign.snap = true;
      }
      var tex = new THREE.CanvasTexture(d.canvas); tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
      if (sign.sprite.material.map) sign.sprite.material.map.dispose();
      sign.sprite.material.map = tex; sign.sprite.material.needsUpdate = true; sign.sprite.material.opacity = 0;
      sign.canvas = d.canvas; sign.cw = d.w; sign.ch = d.h; sign.title = title; sign.paras = paras; sign.foot = foot; sign.accent = accent; sign.has = true; sign.fade = 0;
    }
    var sv = new THREE.Vector3(), sw = new THREE.Vector3();
    function updateSign(dt, nowMs) {
      var sp = sign.sprite, wk = state.walk, W = canvasBox.clientWidth || 1, H = canvasBox.clientHeight || 1;
      sign.info = null;
      if (!sp) return;
      if (!sign.has || !wk || docked || !avatar) { sp.visible = false; return; }
      var route = wk.route, fl = -ch.h * 0.92 + route.yOff;
      if (sign.avatarAnchor) sv.set(avatar.position.x, avatar.position.y + 4.9, avatar.position.z);
      else {
        var goal = route.stops[wk.target], sa = wk.arrived ? goal + MARK_AHEAD : Math.min(goal + MARK_AHEAD, wk.s + 12), a = at(route, sa);
        sv.set(a.x, fl + MARK_Y + 0.9 + (state.calm ? 0 : 0.1 * Math.sin(nowMs / 700)), a.z);
      }
      if (sign.snap) { sign.pos.copy(sv); sign.snap = false; } else sign.pos.lerp(sv, 1 - Math.exp(-dt * 5));
      sp.position.copy(sign.pos);
      sw.copy(sp.position).applyMatrix4(camera.matrixWorldInverse);
      var depth = -sw.z;
      if (depth < 0.5) { sp.visible = false; return; }
      var worldH = 2 * depth * Math.tan(camera.fov * Math.PI / 360), pxPerWorld = H / worldH;
      var wantPx = Math.min(0.9 * W, sign.cw), hPx = wantPx * sign.ch / sign.cw, maxH = 0.46 * H;
      if (hPx > maxH) { wantPx *= maxH / hPx; hPx = maxH; }
      sp.scale.set(wantPx / pxPerWorld, hPx / pxPerWorld, 1);
      sw.copy(sp.position).project(camera);
      var hNdc = 2 * hPx / H, over = sw.y + hNdc - 0.9, shift = over > 0 ? Math.min(1, over / hNdc) : 0;
      sp.center.set(0.5, shift);
      sign.fade = Math.min(1, sign.fade + dt * 3); sp.material.opacity = sign.fade; sp.visible = true;
      var bottomNdc = sw.y - shift * hNdc;
      sign.info = { x: (sw.x + 1) / 2 * W, bottomY: (1 - bottomNdc) / 2 * H, topY: (1 - (bottomNdc + hNdc)) / 2 * H, w: wantPx, h: hPx, bodyPx: 30 * wantPx / sign.cw, titlePx: 44 * wantPx / sign.cw };
    }
    // The floating card hangs just under the marker on the screen (and under the sign if the sign was pushed down onto it).
    var cv = new THREE.Vector3();
    function layoutCard() {
      var wk = state.walk;
      if (docked || card.style.display === "none" || !wk || !ch) return;
      var W = canvasBox.clientWidth || 1, H = canvasBox.clientHeight || 1, cw = card.offsetWidth, chh = card.offsetHeight;
      var mk = wk.route.markers[wk.target];
      if (!mk) return;
      cv.set(mk.position.x, mk.position.y + wk.route.yOff, mk.position.z).project(camera);
      var px = (cv.x + 1) / 2 * W, py = (1 - cv.y) / 2 * H;
      if (cv.z > 1) { px = W / 2; py = H * 0.5; }
      var top = py + 24;
      if (sign.info) top = Math.max(top, sign.info.bottomY + 8);
      var x = clamp(px - cw / 2, 8, Math.max(8, W - cw - 8)), y = clamp(top, 56, Math.max(56, H - chh - 12));
      card.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
    }

    // ---- the frame -------------------------------------------------------------------------
    var tmp = new THREE.Vector3(), baseLamp = new THREE.Color(), tmpC = new THREE.Color();
    var CAM_BACK = 6.2, CAM_UP = 4.6; // the camera follows close behind the avatar and a little above its head
    function render() {
      var nowMs = performance.now(), dt = Math.min(0.5, (nowMs - last) / 1000); last = nowMs;
      breathStep(dt, nowMs / 1000);
      tweens = tweens.filter(function (tw) {
        var k = Math.min(1, (nowMs - tw.t0) / tw.ms); tw.fn(k);
        if (k >= 1) { if (tw.done) tw.done(); return false; }
        return true;
      });
      if (flight) { // along a path inside the body
        flight.t = Math.min(1, flight.t + 0.006);
        var p = flight.curve.getPoint(flight.t), q = flight.curve.getPoint(Math.min(1, flight.t + 0.02));
        camera.position.copy(p); camera.lookAt(q); flight.lamp.position.copy(p);
        if (flight.t >= 1) { var done = flight.done; flight = null; done(); }
      } else if (ch && state.walk && avatar) {
        walkStep(dt);
        var wk = state.walk, route = wk.route, a = at(route, wk.s), fl = -ch.h * 0.92 + route.yOff, c = ctxOf();
        var d = avatar.userData;
        looseNow += (me().passed / WAVE.length - looseNow) * Math.min(1, dt * 2);
        loosenAvatar(avatar, looseNow, br.b);
        var stepLen = wk.t < BREATH.inS ? wk.D / 2 / STEPS_IN : wk.D / 2 / STEPS_OUT;
        poseAvatar(avatar, wk.t, wk.moving, dt, br.b, stepLen, state.calm);
        avatar.position.set(a.x + -a.fz * wk.lat, fl + 0.02, a.z + a.fx * wk.lat);
        // at a branch the avatar turns to the opening in the wall
        avatar.rotation.y = Math.abs(wk.lat) > 0.01 ? Math.atan2(-a.fz * Math.sign(wk.lat), a.fx * Math.sign(wk.lat)) : yawFacing(a);
        if (state.held) state.look.yaw *= 1 - Math.min(1, dt * 1.5); // walking turns the view back behind the avatar
        // camera: behind on the path, and a little above; a drag swings it round the avatar
        var cb = at(route, Math.max(0, wk.s - CAM_BACK)), ry = state.look.yaw;
        tmp.set(cb.x - a.x, 0, cb.z - a.z);
        var cx = a.x + tmp.x * Math.cos(ry) + tmp.z * Math.sin(ry), cz = a.z - tmp.x * Math.sin(ry) + tmp.z * Math.cos(ry);
        var want = new THREE.Vector3(cx, fl + CAM_UP - state.look.pitch * 2.6, cz), aim = new THREE.Vector3(a.x + a.fx * 3.4, fl + 2.2, a.z + a.fz * 3.4);
        if (state.rise) { want.y = state.rise.y0 + 16 * state.rise.k; aim.set(a.x + a.fx * 6, state.rise.y0 + 6 + 20 * state.rise.k, a.z + a.fz * 6); }
        if (snapCam) { camPos.copy(want); lookAt.copy(aim); snapCam = false; }
        else { var f = 1 - Math.exp(-dt * 6); camPos.lerp(want, f); lookAt.lerp(aim, f); }
        camera.position.copy(camPos); camera.lookAt(lookAt); camera.updateMatrixWorld();
        // the screen changes with each W.A.V.E. step: the light, the fog and the openness ease toward the stretch being walked
        var lg = wk.block ? SIDE_LOOK : STEP_LOOK[clamp(wk.target, 0, 6)], fe = 1 - Math.exp(-dt * 2.2);
        lk.idx = wk.block ? -1 : wk.target;
        lk.light.lerp(tmpC.setHex(lg.light), fe); lk.fog.lerp(tmpC.setHex(lg.fog), fe);
        lk.fogK += (lg.fogK - lk.fogK) * fe; lk.hemi += (lg.hemi - lk.hemi) * fe; lk.flash = Math.max(0, lk.flash - dt / 0.9);
        scene.background.copy(lk.fog); scene.fog.color.copy(lk.fog); scene.fog.density = parts.fog * lk.fogK;
        if (!wk.block) {
          for (var q = 0; q < STEP_LOOK.length; q++) openCur[q] = q <= revealed ? openCur[q] + (STEP_LOOK[q].open - openCur[q]) * fe : openCur[Math.max(0, q - 1)];
          route.tunnel.setOpen(openCur);
        }
        lamp.position.set(a.x, fl + 3.8, a.z);
        // the cave breathes: walls ease, the light warms on the exhale, the element and the chest glow
        route.tunnel.setBreath(br.k);
        var warm = 1 - br.b, surge = lk.flash * lk.flash;
        baseLamp.copy(lk.light).lerp(tmpC.setHex(0xffffff), 0.3).lerp(tmpC.setHex(c && c.lampHex || 0xffe0b0), 0.15).lerp(WARM, warm * 0.2);
        lamp.color.copy(baseLamp); lamp.intensity = 1.0 + 0.5 * warm + 1.6 * surge + 0.5 * lk.hemi;
        hemi.color.setHex(0xffffff).lerp(lk.light, 0.35); hemi.intensity = lk.hemi + 0.1 * warm + 0.4 * surge;
        glow.forEach(function (g) { g.m.emissiveIntensity = g.base * (0.7 + 0.6 * br.b); });
        route.markers.forEach(function (m, i) {
          var on = wk.block ? (wk.block.place > i || (wk.arrived && wk.target === i)) : i < me().passed;
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
            var dk = ease(Math.min(1, (nowMs - c.daemonT.t0) / 900)); c.daemonFig.position.x = c.daemonT.from + (c.daemonT.to - c.daemonT.from) * dk;
            if (dk >= 1) c.daemonT = null;
          }
          if (c.daemonFig && c.daemonFig.userData.orb && !state.calm) c.daemonFig.userData.orb.scale.setScalar(1 + 0.2 * Math.sin(nowMs / 250));
        }
        updateSign(dt, nowMs); layoutCard();
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
        offPath: distToRoute(wk.route, avatar.position.x, avatar.position.z), bytes: geometryBytes(avatar), loose: looseNow, s: wk.s, ahead: [a.fx, a.fz] };
    };
    // The avatar's joints (radians about x, and the count of named joints), and the walk's clock against the breath.
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
    // The light of the stretch being walked, as the screen shows it now.
    api.look = function () {
      return { idx: lk.idx, light: lk.light.getHex(), fog: lk.fog.getHex(), fogK: lk.fogK, open: openCur[Math.max(0, lk.idx)], bg: scene.background.getHex(), fogHex: scene.fog.color.getHex(), density: scene.fog.density };
    };
    // The sign in the scene: its words, where it is on the screen, how big its type is, and whether its texture holds drawn pixels.
    api.sign = function () {
      var sp = sign.sprite, W = canvasBox.clientWidth, H = canvasBox.clientHeight, out = { has: sign.has, visible: !!(sp && sp.visible), title: sign.title, paras: sign.paras.slice(), foot: sign.foot, text: [sign.title].concat(sign.paras).join(" ") };
      if (sign.info) out.screen = sign.info;
      if (state.walk && state.walk.route.markers[state.walk.target]) {
        var mk = state.walk.route.markers[state.walk.target], v = new THREE.Vector3(mk.position.x, mk.position.y + state.walk.route.yOff, mk.position.z).project(camera);
        out.marker = { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H };
      }
      if (sign.canvas) {
        var px = sign.canvas.getContext("2d").getImageData(0, 0, sign.canvas.width, sign.canvas.height).data, n = 0;
        for (var i = 3; i < px.length; i += 4 * 16) if (px[i] > 200) n++;
        out.pixels = n; out.canvas = [sign.canvas.width, sign.canvas.height];
      }
      out.docked = docked; out.cardShown = card.style.display !== "none";
      return out;
    };
    api.card = function () { var r = card.getBoundingClientRect(); return { docked: docked, shown: card.style.display !== "none", x: r.left, y: r.top, w: r.width, h: r.height, vw: window.innerWidth, vh: window.innerHeight }; };
    api.depth = function () { return state.stack.length; };
    // The least distance between two stretches of the main path that are far apart along it; the walls meet if this is under twice the half-width.
    api.clearance = function () {
      var r = state.mainRoute, best = 1e9;
      for (var i = 0; i < r.X.length; i += 2) for (var j = i + 1; j < r.X.length; j += 2) {
        if (r.S[j] - r.S[i] < 12) continue;
        best = Math.min(best, Math.hypot(r.X[i] - r.X[j], r.Z[i] - r.Z[j]));
      }
      return { clearance: best, width: ch.w, maxOpen: OPEN_MAX };
    };
    api.lanterns = function () { return lanternsOn.length; };
    // Where the element stands on the screen, in page pixels.
    api.elementScreen = function () {
      var c = ctxOf(), v = c.holder.getWorldPosition(new THREE.Vector3()); v.y += 1.4; v.project(camera);
      var r = dom.getBoundingClientRect();
      return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
    };
  }

  window.__oagCave = { start: start, load: load, dive: function (label) { return dive(label, document.querySelector("[data-cave-home]")); }, layoutMain: layoutMain, WAVE: WAVE };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
