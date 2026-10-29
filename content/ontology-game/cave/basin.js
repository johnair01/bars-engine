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

  // ---- the page ---------------------------------------------------------------------------------------------------------------
  var CSS = ".oagb{z-index:950}.oagb-line{position:absolute;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);max-width:min(420px,calc(100vw - 32px));" +
    "padding:.5rem .8rem;background:rgba(12,12,24,.72);border:1px solid rgba(220,230,255,.35);border-radius:12px;color:#eef0f8;font-size:15px;line-height:1.35;text-align:center;" +
    "pointer-events:none;transition:opacity .6s;z-index:3}.oagb-line[hidden]{display:block;opacity:0}.oagb-how{position:absolute;left:50%;top:calc(14px + env(safe-area-inset-top));transform:translateX(-50%);" +
    "color:#c8cce0;font-size:13px;opacity:.85;pointer-events:none;transition:opacity 1.2s;white-space:nowrap;z-index:3}";

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
      // The cave's fog family (the room's warm dark), thin enough that the far ledge reads from the heart's.
      var scene = new THREE.Scene(); scene.background = new THREE.Color(0x16121c); scene.fog = new THREE.FogExp2(0x16121c, 0.011);
      var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
      var rock = K.stoneOf(THREE, null, 0x6a5c54);
      K.loadTiles(THREE).then(function (tiles) { K.tileStone(rock, tiles); }); // the cave's own stone, once its tiles are in
      var ground = rock.userData.floor; ground.vertexColors = true; ground.needsUpdate = true;

      // The land: one sheet of the cave's dry stone, lifted into ledges and rims, the hollows and beds carved in, and tinted by
      // vertex: ridges paler, hollows darker, the course beds mossy (dry, but never darker than readable).
      var SX = 2 * (LAND.rx + 8), SZ = 2 * (LAND.rz + 8), NX = 110, NZ = 130;
      var geo = new THREE.PlaneGeometry(SX, SZ, NX, NZ); geo.rotateX(-Math.PI / 2); geo.translate(LAND.cx, 0, LAND.cz);
      var pos = geo.attributes.position, uv = geo.attributes.uv, col = new Float32Array(pos.count * 3);
      var moss = new THREE.Color(0x5f6e52), pale = new THREE.Color(0xd8ccc0), deep = new THREE.Color(0x6e6470), base = new THREE.Color(0xb4a89c), c = new THREE.Color();
      for (var i = 0; i < pos.count; i++) {
        var x = pos.getX(i), z = pos.getZ(i), y = groundY(x, z), b = baseY(x, z);
        pos.setY(i, y); uv.setXY(i, x / 3.2, z / 3.2);
        var near = Infinity; courses().forEach(function (cc) { near = Math.min(near, distToCourse(cc, x, z)); });
        c.copy(base).lerp(pale, Math.max(0, Math.min(1, (y - ledgeY(z)) / 3)) * 0.6).lerp(deep, Math.max(0, Math.min(1, (b - y) * 1.2)) * 0.7);
        if (near < 0.75) c.lerp(moss, 0.35 * (1 - near / 0.75));
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
      var land = new THREE.Mesh(geo, ground); scene.add(land);

      // ---- the springs ----------------------------------------------------------------------------------------------------------
      var still = new THREE.MeshStandardMaterial({ color: 0x2c4256, roughness: 0.12, metalness: 0.25, emissive: 0x0e1a26, emissiveIntensity: 0.6 });
      function water(k, r) { var m = new THREE.Mesh(new THREE.CircleGeometry(r, 48), still); m.rotation.x = -Math.PI / 2; m.position.set(SEAT_AT[k].x, springY(k) - 0.12, SEAT_AT[k].z); scene.add(m); return m; }
      function stone(r, x, z, sy) { var s = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), rock); s.position.set(x, groundY(x, z) + r * 0.25, z); s.scale.y = sy || 0.6; s.rotation.y = x * 1.7 + z; scene.add(s); return s; }
      function ringStones(k, R, n, r) { var s = SEAT_AT[k]; for (var j = 0; j < n; j++) { var a = j / n * Math.PI * 2 + 0.3; stone(r * (0.8 + 0.4 * ((j * 7) % 5) / 5), s.x + Math.cos(a) * R, s.z + Math.sin(a) * R, 0.5); } }
      var S = {};
      // the heart: the low spring, the largest, its stones round the rim
      S.heart = water("heart", POOL.heart + 0.4); ringStones("heart", POOL.heart + 0.9, 11, 0.38);
      // the crown: a still pool on the high ledge; at the third floor it answers once, a ripple and a held line of light
      S.crown = water("crown", POOL.crown + 0.3); ringStones("crown", POOL.crown + 0.6, 9, 0.32);
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
      ringStones("throat", 1.3, 6, 0.26);
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
      [[-1.6, 0.9, 0.7], [1.7, 0.5, 0.55], [0.2, -1.5, 0.8], [-1.0, -1.1, 0.5]].forEach(function (q) { var s = stone(q[2], MOUTH.x + q[0], MOUTH.z + q[1], 0.9); s.scale.y = 1.1; });
      var mouthLight = new THREE.PointLight(0xffc890, 0.5, 4, K.LAMP.decay); mouthLight.position.set(MOUTH.x, my + 0.3, MOUTH.z); scene.add(mouthLight);

      // ---- light: the cave's lamp over the figure and its carried light at the chest, and enough sky that nothing goes unreadable
      var hemi = new THREE.HemisphereLight(0xdcd6ff, 0x3a3028, 0.95); scene.add(hemi);
      var sky = new THREE.DirectionalLight(0xfff0dc, 0.35); sky.position.set(-6, 20, 4); scene.add(sky);
      var lamp = new THREE.PointLight(0xffe0b0, K.LAMP.power, K.LAMP.reach, K.LAMP.decay); scene.add(lamp);

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
        lamp.position.set(fig.x, gy + K.LAMP.above + 2.4, fig.z); carried.position.set(fig.x + Math.sin(fig.yaw) * 0.3, gy + 1.4, fig.z + Math.cos(fig.yaw) * 0.3);
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
