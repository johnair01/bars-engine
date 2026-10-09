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
// made by build_kit.py. Day 3 of the week: portals, generic chamber, paths, daemon figure, working gate.
(function () {
  "use strict";
  var BASE = window.__oagCaveBase || "/ontology-game/cave/";
  var THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

  // The five places, one for each part of block work (game.jsx BLOCK_STEPS, lines 1200-1206).
  var PLACES = [
    { id: "mouth", step: "1 Sensation", t: 0.08 },
    { id: "pool", step: "2 Element", t: 0.30 },
    { id: "passage", step: "3 Daemon", t: 0.52 },
    { id: "gate", step: "4 Game masters' gate", t: 0.74 },
    { id: "way_out", step: "Release", t: 0.94 },
  ];
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


  // ---- the one generic chamber, dressed in what the player brought --------------------------
  // dress = { texture, element, face }. The charge sets the walls (colour, width, fog), the channel sets the
  // pool and the lamp, the face sets the colour of the stones and the glow of the gate (all choices).
  function lookup(table, key) { return table.filter(function (r) { return r[0] === key; })[0]; }

  function geomOf(THREE, piece) {
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(piece.position, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(piece.normal, 3));
    g.setIndex(new THREE.BufferAttribute(piece.index, 1));
    return g;
  }

  function centreLine(n) {
    var pts = [], step = CHAMBER.length / n;
    for (var i = 0; i <= n; i++) pts.push({ x: 0, z: -i * step, yaw: 0 });
    return pts;
  }
  function at(line, t) {
    var f = t * (line.length - 1), i = Math.min(line.length - 2, Math.floor(f)), k = f - i, a = line[i], b = line[i + 1];
    return { x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k, yaw: a.yaw + (b.yaw - a.yaw) * k };
  }

  function buildChamber(A, dress, parts) {
    var THREE = A.THREE, group = new THREE.Group();
    var G = {}; Object.keys(A.kit).forEach(function (k) { G[k] = geomOf(THREE, A.kit[k]); });
    var tex = lookup(TEXTURES, dress.texture) || TEXTURES[4], ele = lookup(ELEMENTS, dress.element) || ELEMENTS[4], face = lookup(FACES, dress.face) || FACES[0];
    var look = CHARGE_LOOK[dress.texture] || CHARGE_LOOK.other;
    var rock = new THREE.MeshStandardMaterial({ color: tex[2], roughness: 0.95, side: THREE.DoubleSide });
    var n = Math.round(CHAMBER.length / 2), line = centreLine(n), segLen = CHAMBER.length / n;
    var w = CHAMBER.w * look.w, h = CHAMBER.h;
    for (var i = 0; i < n; i++) {
      var c = at(line, (i + 0.5) / n), ring = new THREE.Mesh(G.wall_ring, rock);
      ring.position.set(c.x, 0, c.z + segLen / 2);
      ring.scale.set(w, h, segLen * 1.12);
      group.add(ring);
      var fl = new THREE.Mesh(G.floor, rock);
      fl.position.set(c.x, -h * 0.92, c.z + segLen / 2); fl.scale.set(w * 1.8, 1, segLen * 1.12);
      group.add(fl);
    }
    parts.rock = rock; parts.w = w; parts.h = h; parts.segLen = segLen; parts.fog = look.fog;
    var places = PLACES.map(function (p) {
      var c = at(line, p.t), pos = new THREE.Vector3(c.x, 0, c.z);
      var marker = new THREE.Mesh(new THREE.SphereGeometry(Math.min(w, h) * 0.12, 16, 12),
        new THREE.MeshBasicMaterial({ color: 0xfff1b0, transparent: true, opacity: 0.85 }));
      marker.position.set(c.x, -h * 0.1, c.z); marker.userData.place = p.id;
      group.add(marker);
      return { id: p.id, step: p.step, pos: pos, yaw: c.yaw, marker: marker };
    });
    var byId = {}; places.forEach(function (p) { byId[p.id] = p; });
    // The pool takes the channel's element.
    var poolMat = new THREE.MeshStandardMaterial({ color: ele[3], roughness: 0.3, emissive: ele[3], emissiveIntensity: 0.25 });
    var pool = new THREE.Mesh(G.pool, poolMat);
    pool.position.set(byId.pool.pos.x, -h * 0.9, byId.pool.pos.z - segLen);
    pool.scale.set(Math.min(w * 0.7, 3.2), 1, Math.min(w * 0.7, 3.2));
    group.add(pool); parts.poolMat = poolMat;
    // The gate: six standing stones round a ring, one for each face, each in its own colour. They stand dark
    // until the player has stood at them; the face the player brought gets a faint ring from the start.
    parts.stones = [];
    var gp = byId.gate.pos, gr = Math.min(w * 0.75, 3.4);
    FACES.forEach(function (f, s) {
      var a = (s / 6) * Math.PI * 2;
      var st = new THREE.Mesh(G.gate_stone, new THREE.MeshStandardMaterial({ color: 0x70707e, roughness: 0.8, emissive: 0x000000 }));
      st.position.set(gp.x + Math.cos(a) * gr, -h * 0.92, gp.z - segLen + Math.sin(a) * gr);
      st.scale.set(Math.min(gr, 3) * 0.5, Math.min(h * 1.1, 4), Math.min(gr, 3) * 0.5);
      st.userData.face = f[0];
      group.add(st); parts.stones.push(st);
      if (f[0] === dress.face) {
        var halo = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 8, 24), new THREE.MeshBasicMaterial({ color: f[4], transparent: true, opacity: 0.6 }));
        halo.rotation.x = Math.PI / 2; halo.position.set(st.position.x, -h * 0.9, st.position.z); group.add(halo);
      }
    });
    var arch = new THREE.Mesh(G.portal_arch, new THREE.MeshBasicMaterial({ color: 0xfff1b0 }));
    arch.position.set(byId.way_out.pos.x, -h * 0.92, byId.way_out.pos.z - segLen); arch.rotation.y = byId.way_out.yaw;
    arch.scale.set(Math.min(w * 0.8, h * 0.8), Math.min(w * 0.8, h * 0.8), 1);
    group.add(arch); parts.archPos = arch.position.clone();
    group.add(new THREE.HemisphereLight(face[4], 0x302828, 0.45));
    var lamp = new THREE.PointLight(ele[3], 1.1, CHAMBER.length * 3);
    lamp.position.set(0, h * 0.3, -CHAMBER.length * 0.35);
    group.add(lamp);
    parts.dress = { wall: tex[2], width: Math.round(w * 100) / 100, fog: look.fog, pool: ele[3], lamp: ele[3], face: face[4] };
    return { group: group, places: places, byId: byId, line: line };
  }

  // The daemon: one body for all seven, no face, fused rounded shapes. It differs by colour, posture and what it carries.
  function buildDaemon(THREE, d, h) {
    var g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: d[3], roughness: 0.7, emissive: d[3], emissiveIntensity: 0.12 });
    function part(geo, x, y, z, sx, sy, sz) { var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); g.add(m); return m; }
    var S = new THREE.SphereGeometry(1, 20, 14), stoop = d[0] === "victim" ? 0.35 : d[0] === "damaged-self" ? 0.2 : 0;
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
    return g;
  }

  // ---- the page --------------------------------------------------------------------------
  var CSS = ".oagc{position:fixed;inset:0;z-index:900;background:#0e0e1a;color:#e0e0e0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;flex-direction:column}" +
    ".oagc canvas{display:block;position:absolute;inset:0;width:100%;height:100%;touch-action:none}" +
    ".oagc-card{padding:.7rem 1rem calc(.7rem + env(safe-area-inset-bottom));background:rgba(20,20,40,.96);border-top:1px solid rgba(255,255,255,.12);max-height:62vh;overflow-y:auto}" +
    ".oagc-card h2{margin:0 0 .3rem;font-size:1rem;color:#fff}.oagc-card h3{margin:.55rem 0 0;font-size:.82rem;color:#aab;font-weight:600}.oagc-card p{margin:.3rem 0;font-size:.92rem}" +
    ".oagc-row{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.4rem}" +
    ".oagc button{background:#64c8ff;color:#10142a;border:none;border-radius:8px;padding:.5rem .8rem;font-size:.9rem;font-weight:600;min-height:44px;cursor:pointer;width:auto;margin:0}" +
    ".oagc button:disabled{opacity:.4}" +
    ".oagc button.alt{background:none;border:1px solid rgba(255,255,255,.3);color:#e0e0e0;font-weight:400}" +
    ".oagc button[aria-pressed=true]{outline:2px solid #fff}" +
    ".oagc-fade{position:absolute;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity .5s}" +
    ".oagc-home{padding:2rem 1rem;max-width:34rem;margin:auto;text-align:center}.oagc-home h1{font-size:1.5rem;color:#fff}";

  function start() {
    if (!document.getElementById("oagc-css")) document.head.appendChild(el("style", { id: "oagc-css", text: CSS }));
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

  // One sitting: the places named so far, each its own chamber, joined by paths. The renderer stays up between them.
  function enter(A, firstSpot, home) {
    var THREE = A.THREE;
    var wrap = el("div", { class: "oagc", "data-cave-chamber": firstSpot.id });
    var fade = el("div", { class: "oagc-fade" });
    var canvasBox = el("div", { style: "flex:1;min-height:0;position:relative" });
    var card = el("div", { class: "oagc-card", "data-cave-card": "" });
    wrap.appendChild(canvasBox); wrap.appendChild(card); wrap.appendChild(fade);
    document.body.appendChild(wrap);
    fade.style.opacity = 1; setTimeout(function () { fade.style.opacity = 0; }, 30); // the dive: in from black
    home.style.display = "none";

    var renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch (e) {
      card.textContent = "This device cannot show the cave. The body map and the game still work."; return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    canvasBox.appendChild(renderer.domElement);
    var scene = new THREE.Scene(); scene.background = new THREE.Color(0x0c0c16); scene.fog = new THREE.FogExp2(0x0c0c16, 0.02);
    var camera = new THREE.PerspectiveCamera(70, 1, 0.1, 200);

    // The sitting. sens[i] = { id, spot, texture, element, face, daemon, stepAside, gate: [faces stood at], saved }.
    var state = { sens: [], cur: null, place: 0, look: { yaw: 0, pitch: 0 }, done: [], mode: "portal", dress: null, path: null };
    var ch = null, parts = {}, daemonFig = null, daemonT = null, orbs = [], goal = null, flight = null;
    var cam = { x: 0, y: 0, z: 0, yaw: 0 };

    function clearScene() {
      while (scene.children.length) scene.remove(scene.children[0]);
      ch = null; daemonFig = null; orbs = []; goal = null; flight = null;
    }
    function addSensation(spot) {
      var s = { id: spot.id, spot: spot, texture: null, element: null, face: null, daemon: null, stepAside: null, gate: [], saved: false };
      state.sens.push(s); return s;
    }
    function aim(p) {
      goal = { x: p.pos.x, z: p.pos.z + 3 * Math.cos(p.yaw), yaw: p.yaw, t: 0, from: { x: cam.x, z: cam.z, yaw: cam.yaw } };
    }
    function size() {
      var w = canvasBox.clientWidth || 1, h = canvasBox.clientHeight || 1;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }

    function render() {
      if (goal) {
        goal.t = Math.min(1, goal.t + 0.03); var k = goal.t * goal.t * (3 - 2 * goal.t);
        cam.x = goal.from.x + (goal.x - goal.from.x) * k; cam.z = goal.from.z + (goal.z - goal.from.z) * k; cam.yaw = goal.from.yaw + (goal.yaw - goal.from.yaw) * k;
        if (goal.t >= 1) goal = null;
      }
      if (flight) { // along a path inside the body
        flight.t = Math.min(1, flight.t + 0.006);
        var p = flight.curve.getPoint(flight.t), q = flight.curve.getPoint(Math.min(1, flight.t + 0.02));
        camera.position.copy(p); camera.lookAt(q);
        flight.lamp.position.copy(p);
        if (flight.t >= 1) { var done = flight.done; flight = null; done(); }
      } else {
        camera.position.set(cam.x, -CHAMBER.h * 0.12, cam.z);
        camera.rotation.set(state.look.pitch, cam.yaw + state.look.yaw, 0, "YXZ");
      }
      if (daemonFig && daemonT) {
        daemonT.t = Math.min(1, daemonT.t + 0.025); var dk = daemonT.t * daemonT.t * (3 - 2 * daemonT.t);
        daemonFig.position.x = daemonT.from + (daemonT.to - daemonT.from) * dk;
        if (daemonT.t >= 1) daemonT = null;
      }
      if (daemonFig && daemonFig.userData.orb) daemonFig.userData.orb.scale.setScalar(1 + 0.2 * Math.sin(Date.now() / 250));
      if (ch) ch.places.forEach(function (pl, i) { pl.marker.visible = i === state.place || state.done.indexOf(pl.id) >= 0; pl.marker.scale.setScalar(1 + 0.15 * Math.sin(Date.now() / 300)); });
      orbs.forEach(function (o) { o.scale.setScalar(1 + 0.2 * Math.sin(Date.now() / 280 + o.position.x)); });
      renderer.render(scene, camera);
      running = requestAnimationFrame(render);
    }
    size(); window.addEventListener("resize", size);

    // One finger: drag to look, tap the glowing marker, a stone or a portal.
    var ray = new THREE.Raycaster(), drag = null;
    var dom = renderer.domElement;
    dom.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY, moved: 0 }; });
    dom.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY;
      state.look.yaw = Math.max(-1.2, Math.min(1.2, state.look.yaw - dx * 0.006));
      state.look.pitch = Math.max(-0.6, Math.min(0.6, state.look.pitch - dy * 0.004));
    });
    dom.addEventListener("pointerup", function (e) {
      var wasTap = drag && drag.moved < 8; drag = null;
      if (!wasTap || !ch) return;
      var r = dom.getBoundingClientRect();
      ray.setFromCamera({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }, camera);
      var hit = ray.intersectObjects(ch.places.map(function (p) { return p.marker; }).concat(parts.stones || []).concat(orbs))[0];
      if (!hit) return;
      var o = hit.object;
      if (o.userData.place && o.userData.place === PLACES[state.place].id) say();
      else if (o.userData.face && PLACES[state.place].id === "gate") stand(o.userData.face);
      else if (o.userData.portal) follow(o.userData.portal);
    });

    function me() { return state.cur; }
    function choice(opts, picked, onPick) {
      return el("div", { class: "oagc-row" }, opts.map(function (o) {
        return el("button", { class: "alt", "data-cave-choice": o[0], "aria-pressed": String(picked === o[0]), text: o[1], onclick: function () { onPick(o); } });
      }));
    }
    function fill(title, kids) {
      card.innerHTML = ""; card.appendChild(el("h2", { text: title }));
      kids.forEach(function (k) { card.appendChild(k); });
    }

    // ---- the portal: name what you bring, then the chamber forms ------------------------
    function portal(s) {
      clearScene(); state.cur = s; state.mode = "portal"; state.place = 0; state.done = [];
      scene.fog.density = 0.02; cam = { x: 0, y: 0, z: 6, yaw: 0 }; state.look = { yaw: 0, pitch: 0 };
      var arch = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.12, 10, 36), new THREE.MeshBasicMaterial({ color: 0xfff1b0 }));
      arch.position.set(0, 0, 0); scene.add(arch);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x302828, 0.5));
      wrap.setAttribute("data-cave-chamber", s.id);
      card.setAttribute("data-cave-place", "portal");
      function draw() {
        var go = el("button", { "data-cave-form": "", text: "Go in", onclick: function () { form(s); } });
        if (!(s.texture && s.element && s.face)) go.disabled = true;
        var kids = [el("p", { text: "This is a doorway into the cave. Say what you bring, and the chamber forms to meet it." }),
          el("h3", { text: "The charge" }),
          choice(TEXTURES.map(function (t) { return [t[0], t[1]]; }), s.texture, function (o) { s.texture = o[0]; draw(); }),
          el("h3", { text: "The feeling (its elemental channel)" }),
          choice(ELEMENTS.map(function (x) { return [x[0], x[0] + " · " + x[1]]; }), s.element, function (o) { s.element = o[0]; draw(); }),
          el("h3", { text: "The face (the way of knowing it)" }),
          choice(FACES.map(function (f) { return [f[0], f[1]]; }), s.face, function (o) { s.face = o[0]; draw(); })];
        if (s.face) kids.push(el("p", { text: lookup(FACES, s.face)[2] + "." }));
        kids.push(el("div", { class: "oagc-row" }, [go]));
        fill("A doorway at " + s.spot.words, kids);
      }
      draw();
    }

    function form(s) {
      clearScene(); parts = {}; state.mode = "chamber"; state.place = 0; state.done = []; state.look = { yaw: 0, pitch: 0 };
      state.dress = null;
      ch = buildChamber(A, { texture: s.texture, element: s.element, face: s.face }, parts);
      state.dress = parts.dress;
      scene.add(ch.group); scene.fog.density = parts.fog;
      cam = { x: ch.places[0].pos.x, y: 0, z: ch.places[0].pos.z + 3, yaw: 0 };
      aim(ch.places[0]);
      // Portals to the other places of this sitting wait by the way out; they light as they are walked.
      addPortalOrbs();
      say();
    }

    function addPortalOrbs() {
      orbs = [];
      state.sens.forEach(function (o, i) {
        if (o === me()) return;
        var orb = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 10), new THREE.MeshBasicMaterial({ color: o.saved ? 0x5a5a6a : 0xfff1b0, transparent: true, opacity: 0.9 }));
        var a = Math.PI * (0.15 + 0.7 * (i % 6) / 5);
        orb.position.set(parts.archPos.x + Math.cos(a) * parts.w * 0.6, -parts.h * 0.2 + Math.sin(a) * 0.3, parts.archPos.z + 1);
        orb.userData.portal = o.id; orb.visible = false;
        ch.group.add(orb); orbs.push(orb);
      });
    }

    // ---- the places -----------------------------------------------------------------------
    function finish(id) { if (state.done.indexOf(id) < 0) state.done.push(id); }
    function next() {
      finish(PLACES[state.place].id);
      if (state.place < PLACES.length - 1) { state.place++; aim(ch.places[state.place]); say(); }
    }
    function redress(s) { // changing the charge or feeling mid-walk re-dresses the walls and pool
      var t = lookup(TEXTURES, s.texture), e = lookup(ELEMENTS, s.element);
      parts.rock.color.setHex(t[2]); parts.poolMat.color.setHex(e[3]); parts.poolMat.emissive.setHex(e[3]);
      parts.dress.wall = t[2]; parts.dress.pool = e[3];
    }

    function say() {
      var s = me(), p = PLACES[state.place], title = p.step + " · " + s.spot.words;
      card.setAttribute("data-cave-place", p.id);
      var body = [], go = el("button", { "data-cave-next": "", text: "Continue", onclick: next });
      orbs.forEach(function (o) { o.visible = p.id === "way_out"; });
      if (p.id === "mouth") {
        body.push(el("p", { text: "You brought " + lookup(TEXTURES, s.texture)[1] + " in " + s.spot.words + ". Is that what it feels like?" }));
        body.push(choice(TEXTURES.map(function (t) { return [t[0], t[1]]; }), s.texture, function (o) { s.texture = o[0]; redress(s); say(); }));
        body.push(el("p", { text: "Is anything else showing up somewhere else in your body?" }));
        body.push(el("div", { class: "oagc-row" }, [
          el("button", { class: "alt", "data-cave-add": "", text: "Yes, name another place", onclick: addPlace }),
        ]));
        if (state.sens.length > 1) body.push(el("p", { "data-cave-also": "", text: "Also named this sitting: " + state.sens.filter(function (o) { return o !== s; }).map(function (o) { return o.spot.words; }).join(", ") + "." }));
      } else if (p.id === "pool") {
        var e = lookup(ELEMENTS, s.element);
        body.push(el("p", { text: e[0] + " in the " + e[1] + " pool. The move that goes with it: " + e[2] + "." }));
        body.push(el("p", { "data-cave-job": "", text: CHANNEL_JOBS[e[0]] }));
        body.push(choice(ELEMENTS.map(function (x) { return [x[0], x[0] + " · " + x[1]]; }), s.element, function (o) { s.element = o[0]; redress(s); say(); }));
      } else if (p.id === "passage") {
        var d = s.daemon && lookup(DAEMONS, s.daemon);
        if (!d) {
          body.push(el("p", { text: "A daemon stands in the way. Which one is it?" }));
          body.push(choice(DAEMONS.map(function (x) { return [x[0], x[1]]; }), null, function (o) { meet(s, o[0]); }));
          go.disabled = true;
        } else {
          body.push(el("p", { "data-cave-daemon-job": "", text: d[1] + "'s job: " + d[2] }));
          body.push(el("p", { "data-cave-daemon-for": "", text: "Who it works for: " + DAEMON_WORKS_FOR }));
          if (!s.stepAside) {
            body.push(el("p", { text: "Knowing that, will it step aside?" }));
            body.push(el("div", { class: "oagc-row" }, [
              el("button", { "data-cave-aside": "yes", text: "Yes, it steps aside", onclick: function () { s.stepAside = "yes"; moveDaemon(); say(); } }),
              el("button", { class: "alt", "data-cave-aside": "not-yet", text: "Not yet", onclick: function () { s.stepAside = "not-yet"; moveDaemon(); say(); } }),
            ]));
            go.disabled = true;
          } else {
            body.push(el("p", { text: s.stepAside === "yes" ? d[1] + " stepped to the wall, and the way is open." : d[1] + " isn't ready. It waits by the wall, and it will be here when you come back." }));
          }
        }
      } else if (p.id === "gate") {
        var left = FACES.filter(function (f) { return s.gate.indexOf(f[0]) < 0; });
        body.push(el("p", { text: "Six stones, one for each face. Stand at each and ask what it asks. " + s.gate.length + " of 6." }));
        body.push(el("div", { class: "oagc-row" }, FACES.map(function (f) {
          return el("button", { class: "alt", "data-cave-stone": f[0], "aria-pressed": String(s.gate.indexOf(f[0]) >= 0), text: f[1], onclick: function () { stand(f[0]); } });
        })));
        var last = s.gate[s.gate.length - 1];
        if (last) { var lf = lookup(FACES, last); body.push(el("p", { "data-cave-stone-says": "", text: lf[1] + ": " + lf[2] + ". " + lf[3] })); }
        if (left.length) go.disabled = true;
      } else {
        body.push(el("p", { text: "Light from above. Breathe out, and come back to the step." }));
        var rest = state.sens.filter(function (o) { return o !== s; });
        if (rest.length) {
          body.push(el("p", { text: "Other places showed up in this sitting. A path runs to each from here." }));
          body.push(el("div", { class: "oagc-row" }, rest.map(function (o) {
            return el("button", { class: "alt", "data-cave-portal": o.id, text: (o.saved ? "Back to " : "Follow the path to ") + o.spot.words, onclick: function () { follow(o.id); } });
          })));
        }
        go.textContent = "Come back out";
        go.onclick = function () { finish("way_out"); leave(true); };
      }
      fill(title, body.concat([el("div", { class: "oagc-row" }, [go])]));
    }

    function addPlace() {
      // The figure opens over the cave; the place named becomes a chamber and a portal on the spot.
      window.OAGBody.pick().then(function (r) {
        if (!r) return;
        var sp = spotNamed(A, r.label);
        if (!sp) { alert("That place is not on the figure yet. Tap the figure to choose one."); return; }
        if (!state.sens.filter(function (o) { return o.id === sp.id; }).length) { addSensation(sp); addPortalOrbs(); }
        say();
      });
    }

    function meet(s, id) {
      s.daemon = id;
      var d = lookup(DAEMONS, id);
      if (daemonFig) ch.group.remove(daemonFig);
      daemonFig = buildDaemon(THREE, d, parts.h * 1.1);
      var pp = ch.byId.passage.pos;
      daemonFig.position.set(0, -parts.h * 0.9, pp.z - parts.segLen * 2.2);
      daemonFig.rotation.y = 0;
      ch.group.add(daemonFig);
      say();
    }
    function moveDaemon() {
      if (!daemonFig) return;
      daemonT = { t: 0, from: daemonFig.position.x, to: parts.w * 0.75 };
    }

    function stand(face) {
      var s = me();
      if (PLACES[state.place].id !== "gate") return;
      if (s.gate.indexOf(face) < 0) s.gate.push(face);
      var f = lookup(FACES, face);
      parts.stones.forEach(function (st) {
        if (s.gate.indexOf(st.userData.face) >= 0) { var c = lookup(FACES, st.userData.face)[4]; st.material.color.setHex(c); st.material.emissive.setHex(c); st.material.emissiveIntensity = st.userData.face === face ? 0.9 : 0.45; }
      });
      say();
    }

    // ---- the path between two places -------------------------------------------------------
    function save(s) {
      if (s.saved || !s.texture) return;
      s.saved = true;
      // The scan is saved the way the body map saves one (body-map.js record), so "Where it has lived" shows it
      // and joins the places of one sitting with a line.
      window.OAGBody.record({ location: s.spot.words, texture: s.texture, channel: s.element, where: "cave" });
    }
    function follow(id) {
      var from = me(), to = state.sens.filter(function (o) { return o.id === id; })[0];
      if (!to || to === from || state.mode === "path") return;
      save(from);
      var P = function (sp) { return new THREE.Vector3(sp.position[0] * FIG, (sp.position[1] - 0.9) * FIG, sp.position[2] * FIG); };
      var a = P(from.spot), b = P(to.spot), mid = a.clone().add(b).multiplyScalar(0.5);
      mid.x *= 0.25; mid.z *= 0.25; // the path bends in toward the body's centre line, so it stays inside the figure
      var curve = new THREE.CatmullRomCurve3([a, a.clone().lerp(mid, 0.5), mid, mid.clone().lerp(b, 0.5), b]);
      clearScene(); state.mode = "path"; state.path = { from: from.id, to: to.id };
      var tint = new THREE.Color((lookup(TEXTURES, from.texture) || TEXTURES[4])[2]).multiplyScalar(0.45);
      var tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 1.1, 12, false), new THREE.MeshStandardMaterial({ color: tint, roughness: 0.9, side: THREE.BackSide }));
      scene.add(tube); scene.add(new THREE.HemisphereLight(0xffffff, 0x302828, 0.35));
      var lamp = new THREE.PointLight(0xfff1b0, 0.9, 12); scene.add(lamp);
      scene.fog.density = 0.05;
      fill("A path inside the body", [el("p", { text: "From " + from.spot.words + " to " + to.spot.words + "." })]);
      card.setAttribute("data-cave-place", "path");
      flight = { curve: curve, t: 0, lamp: lamp, done: function () { portal(to); } };
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
    portal(addSensation(firstSpot)); render();
    window.__oagCave.state = state; window.__oagCave.leave = leave;
  }

  window.__oagCave = { start: start, load: load, dive: function (label) { return dive(label, document.querySelector("[data-cave-home]")); } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
