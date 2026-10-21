// The spirit's forms in the caves (Six-faces-council council/callsheets/spirits-in-caves.md, board sic-family-cloud). A spirit
// born from meeting a daemon belongs to that daemon's family, and its first stage is a gas: a cloud of motes in its element's
// colour, drawn into the family's shape as the spirit page draws it (bars-engine tools/blender-cloud/content/spirits/shellback.py,
// the *_gas functions; page https://claude.ai/artifact/B9zYsNyxe6UVhRF3jcNP85). The Protector's Shellback gas is the plain cloud
// densest at the heart; the Damaged Self and the Emotional Body have no body family yet, so they wear the same plain cloud.
// cave.js buildSpirit asks this file for the form when a spirit carries a family. As the spirit is sat with it unfolds
// (board sic-unfold-by-sitting): its gas draws in to the family's core, and the core opens into the family's hologram, both
// baked from the page's GLBs by bake_spirits.py and fetched only when a spirit first needs them. Creature and ally are baked for
// the Shellback only so far (LATE), the forms the elder spirit in the WAVE room shows (board sic-demo-showcase).
(function () {
  "use strict";
  // daemon id -> [family name, gas shape]
  var FAMILIES = {
    protector: ["Shellback", "cloud"], player: ["Romp", "trail"], fixer: ["Tinker", "reach"], controller: ["Holdfast", "fist"],
    skeptic: ["Hedge", "question"], victim: ["Ballad", "tear"], "damaged-self": [null, "cloud"], "emotional-body": [null, "cloud"],
  };
  var MOTES = 150, SCALE = 0.55, STREAM_MS = 1800, FADE_MS = 1200;
  var reducedMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function rngOf(seed) { // mulberry32, so a family's shape is the same every time
    var a = 0; for (var i = 0; i < seed.length; i++) a = (a * 31 + seed.charCodeAt(i)) | 0;
    return function () { a = (a + 0x6d2b79f5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function gauss(r) { var u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  // Each shape returns [x, y, z, size]: x across the view, y up, z toward the viewer, in the spirit page's units (about one
  // spirit across), centred on the heart. The page's 3D shapes (trail, reach, fist) are turned three quarters to the viewer, as
  // its sprite camera sees them; the question mark and the tear face the viewer, as on the page.
  // Each is turned (about the up axis) and tipped toward the viewer so its telling part shows: the trail's loops, the arm's five
  // fingers fanned, the fist's row of knuckles. The in-game camera looks down on the spirits a little as well.
  var VIEW = { trail: [-0.68, 0.45], reach: [-0.3, 0.7], fist: [-1.25, 0.4] }, BIG = 1.3;
  function fromPage(v, x, y, z) { // the page is z-up with x forward
    var cT = Math.cos(VIEW[v][0]), sT = Math.sin(VIEW[v][0]), cP = Math.cos(VIEW[v][1]), sP = Math.sin(VIEW[v][1]);
    var X = x * cT - y * sT, Y = z, Z = -(x * sT + y * cT);
    return [X * BIG, (Y * cP + Z * sP) * BIG, (Z * cP - Y * sP) * BIG];
  }
  var SHAPES = {
    cloud: function (r, i) { // gas(rng, lt, dk, 140, 0.42): a drifting cloud, densest at the heart
      return [gauss(r) * 0.42, gauss(r) * 0.42 * 0.8, gauss(r) * 0.42, 0.035 + r() * 0.07];
    },
    trail: function (r, i) { // romp_gas: a looping trail like a swished tail, thickest at its head
      var t = Math.pow(r(), 1.6), a = 0.6 + t * 2.4 * Math.PI, w = 0.05 + 0.13 * t;
      var p = fromPage("trail", 0.75 * Math.sin(a) * (1 - 0.45 * t) + gauss(r) * w, 0.5 * Math.sin(2 * a) * (1 - 0.45 * t) + gauss(r) * w, 0.25 * Math.cos(a) - 0.2 * t + gauss(r) * w);
      return p.concat([(0.03 + r() * 0.06) * (1.25 - 0.6 * t)]);
    },
    reach: function (r, i) { // tinker_gas: a long reaching arm that splays into five fingers, thickest at the shoulder
      var t = Math.pow(r(), 1.3), c, sp;
      if (t < 0.72) { var u = t / 0.72; c = [-0.75 + 1.35 * u, 0, 0.05 + 0.18 * u]; sp = 0.16 - 0.08 * u; }
      else { var u2 = (t - 0.72) / 0.28, k = i % 5, a = (k - 2) * 0.32; c = [0.6 + 0.35 * u2 * Math.cos(a), 0.35 * u2 * Math.sin(a), 0.23 + 0.08 * u2 * (1 - Math.abs(k - 2) / 2)]; sp = 0.03; }
      return fromPage("reach", c[0] + gauss(r) * sp, c[1] + gauss(r) * sp, c[2] + gauss(r) * sp - 0.1).concat([(0.025 + r() * 0.05) * (1.3 - 0.7 * t)]);
    },
    fist: function (r, i) { // holdfast_gas: motes drawn in tight to a clenched fist, knuckles on top, thumb across, wrist trailing
      var t = r(), c, s;
      if (t < 0.34) { var d = [gauss(r), gauss(r), gauss(r)], n = Math.hypot(d[0], d[1], d[2]) || 1, m = Math.sqrt(r()); c = [d[0] / n * m * 0.24, d[1] / n * m * 0.26, d[2] / n * m * 0.2]; s = 0.05; }
      else if (t < 0.6) { c = [0.2 + gauss(r) * 0.035, -0.2 + (i % 4) * 0.133 + gauss(r) * 0.035, 0.17 + gauss(r) * 0.035]; s = 0.045; }
      else if (t < 0.8) { var a = r() * Math.PI * 0.9; c = [0.2 + 0.14 * Math.sin(a) + gauss(r) * 0.02, -0.2 + (i % 4) * 0.133 + gauss(r) * 0.02, 0.17 - 0.32 * (1 - Math.cos(a)) / 2 * 1.1 + gauss(r) * 0.02]; s = 0.035; }
      else if (t < 0.9) { var u = r(); c = [0.3 + 0.06 * Math.sin(u * Math.PI) + gauss(r) * 0.02, -0.3 + 0.3 * u + gauss(r) * 0.02, -0.02 + 0.02 * u + gauss(r) * 0.02]; s = 0.04; }
      else { var u3 = r(), w = 0.1 - 0.05 * u3; c = [-0.2 - 0.5 * u3 + gauss(r) * w, gauss(r) * w, -0.08 - 0.12 * u3 + gauss(r) * w]; s = 0.04 * (1 - 0.5 * u3); }
      return fromPage("fist", c[0] * 1.7, c[1] * 1.7, c[2] * 1.7).concat([s * (0.8 + r() * 0.6) * 1.5]);
    },
    question: function (r, i) { // hedge_gas: a question mark facing the viewer, hook over a short stem, and its dot
      var t = r(), x, y, s = 0.05;
      if (t < 0.62) { var a = (200 - 290 * r()) * Math.PI / 180; x = 0.3 * Math.cos(a); y = 0.42 + 0.3 * Math.sin(a); }
      else if (t < 0.86) { x = 0; y = 0.12 - 0.26 * r(); }
      else { x = 0; y = -0.42; s = 0.06; }
      return [(x + gauss(r) * 0.035) * 1.35, (y + gauss(r) * 0.035) * 1.35, gauss(r) * 0.035 * 1.35, s * (0.8 + r() * 0.6) * 1.5];
    },
    tear: function (r, i) { // ballad_gas: a teardrop, point up, and three dots trailing away to the right ("and then...")
      var t = r(), x, y, s = 0.05;
      if (t < 0.74) { var a = r() * 2 * Math.PI; x = -0.14 + 0.36 * Math.sin(a) * Math.sin(a / 2); y = 0.05 + 0.4 * Math.cos(a); }
      else { x = 0.3 + 0.17 * Math.floor(r() * 3); y = -0.3; s = 0.045; }
      return [(x + gauss(r) * 0.03) * 1.35, (y + gauss(r) * 0.03) * 1.35, gauss(r) * 0.03 * 1.35, s * (0.8 + r() * 0.6) * 1.5];
    },
  };

  function familyOf(id) { return FAMILIES[id] ? id : null; }
  var dotTex = null;
  function dot(THREE) { // a soft round mote
    if (dotTex) return dotTex;
    var cv = document.createElement("canvas"); cv.width = cv.height = 64; var cx = cv.getContext && cv.getContext("2d");
    if (cx) { var gr = cx.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.45, "rgba(255,255,255,0.75)"); gr.addColorStop(1, "rgba(255,255,255,0)"); cx.fillStyle = gr; cx.fillRect(0, 0, 64, 64); }
    return (dotTex = new THREE.CanvasTexture(cv));
  }

  // The gas: two layers of motes (small and large) in the element's colour, every third mote darker as on the page. The group
  // turns to face the camera, the motes drift about their places, and while it is being born they stream in from `from` (a
  // world point, the daemon's body), each on its own delay. With reduced motion the motes hold still and the gas fades in.
  function buildGas(THREE, family, hex, o) {
    o = o || {};
    var shape = SHAPES[(FAMILIES[family] || [null, "cloud"])[1]], r = rngOf("gas:" + family);
    var root = new THREE.Group(), layers = [], all = [];
    var mat0 = new THREE.PointsMaterial({ color: hex, size: 0.09, map: dot(THREE), transparent: true, opacity: 0.95, depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending, sizeAttenuation: true });
    var mat1 = mat0.clone(); mat1.size = 0.16;
    var parts = [[], []];
    for (var i = 0; i < MOTES; i++) { var m = shape(r, i); parts[m[3] > 0.07 ? 1 : 0].push({ x: m[0] * SCALE, y: m[1] * SCALE, z: m[2] * SCALE, ph: r() * 6.283, sp: 0.6 + r(), dl: r() * 0.55, dark: i % 3 === 0 }); }
    [mat0, mat1].forEach(function (mat, li) {
      var ms = parts[li], pos = new Float32Array(ms.length * 3), col = new Float32Array(ms.length * 3);
      ms.forEach(function (m, j) { var k = m.dark ? 0.55 : 1; col[j * 3] = col[j * 3 + 1] = col[j * 3 + 2] = k; pos[j * 3] = m.x; pos[j * 3 + 1] = m.y; pos[j * 3 + 2] = m.z; });
      var geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      var pts = new THREE.Points(geo, mat); pts.frustumCulled = false; root.add(pts); layers.push({ pts: pts, ms: ms }); all = all.concat(ms);
    });
    var t0 = (typeof performance !== "undefined" ? performance : Date).now(), from = o.from ? o.from.clone() : null, last = -1;
    var state = { family: family, stage: "gas", drawn: "gas", motes: all.length, born: from ? 0 : 1, from: from, still: reducedMotion, hex: hex, gas: 1, mesh: null };
    var inv = new THREE.Vector3(), wp = new THREE.Vector3();
    layers[0].pts.onBeforeRender = function (renderer, scene, camera) {
      var now = (typeof performance !== "undefined" ? performance : Date).now(); if (now === last) return; last = now;
      // face the camera about the up axis, so the page's shapes read as drawn, or face o.faceAt (a world point) if it is given
      var aim = o.faceAt || camera.position;
      root.getWorldPosition(wp); root.rotation.y = Math.atan2(aim.x - wp.x, aim.z - wp.z) - (root.parent ? root.parent.rotation.y : 0);
      var age = now - t0, sec = now / 1000;
      if (reducedMotion) { var f = Math.min(1, age / FADE_MS); mat0.opacity = 0.95 * f * state.gas; mat1.opacity = 0.95 * f * state.gas; state.born = f; return; }
      var gather = 0.2 + 0.8 * state.gas; // the motes draw in to the heart as the core takes their place
      var b = from ? Math.min(1, age / STREAM_MS) : 1; state.born = b;
      if (from && b < 1) { inv.copy(from); root.worldToLocal(inv); } // the daemon's body, in the gas's own frame this frame
      layers.forEach(function (L) {
        var a = L.pts.geometry.attributes.position, p = a.array;
        L.ms.forEach(function (m, j) {
          var x = (m.x + 0.025 * Math.sin(sec * m.sp + m.ph)) * gather, y = (m.y + 0.025 * Math.sin(sec * m.sp * 1.3 + m.ph * 2)) * gather, z = (m.z + 0.025 * Math.cos(sec * m.sp + m.ph)) * gather;
          if (from && b < 1) { var k = Math.max(0, Math.min(1, (b - m.dl * 0.45) / 0.55)), e = k * k * (3 - 2 * k), arc = Math.sin(e * Math.PI) * 0.35; x = inv.x + (x - inv.x) * e; y = inv.y + (y - inv.y) * e + arc; z = inv.z + (z - inv.z) * e; }
          p[j * 3] = x; p[j * 3 + 1] = y; p[j * 3 + 2] = z;
        });
        a.needsUpdate = true;
      });
      if (b >= 1) from = null;
    };
    root.userData = { form: state, layers: layers, material: mat0, materials: [mat0, mat1] };
    return root;
  }
  // Tint every layer at once (the orb's material.color in the cave's code), and the core or hologram it has unfolded into
  function tintProxy(root) {
    var mats = root.userData.materials, st = root.userData.form;
    return { material: { color: { setHex: function (h) { mats.forEach(function (m) { m.color.setHex(h); }); st.hex = h; if (st.mesh) tintStage(st.mesh, h); }, getHex: function () { return mats[0].color.getHex(); } } } };
  }

  // ---- the unfolding (board sic-unfold-by-sitting) ------------------------------------------------------------------------
  // A spirit's stage comes from how many times it has been sat with, and nothing else: gas at 0, core at 2, hologram at 4,
  // creature at 6 and standing ally at 8 (the 6-face pass of 18 October, its Architect, keeping the page's 1-3-5 spacing). The
  // caves count one sitting a run for each spirit. Creature and ally are drawn for the families in LATE (bake_spirits.py LATE);
  // a spirit of another family past its hologram wears the hologram until they come.
  var STAGES = ["gas", "core", "hologram", "creature", "ally"], AT = [0, 2, 4, 6, 8], DRAWN = { gas: 1, core: 1, hologram: 1 };
  var LATE = { shellback: { creature: 1, ally: 1 } };
  var UNFOLD_MS = 2400, Y0 = 0.35, ALLY_TURN = -0.7; // the page's spirits stand on their heart, 0.35 up
  function stageOf(n) { n = n | 0; for (var i = AT.length - 1; i > 0; i--) if (n >= AT[i]) return STAGES[i]; return "gas"; }
  function drawnStage(stage, family) {
    var late = LATE[FILES[family] || "shellback"] || {}, i = Math.max(0, STAGES.indexOf(stage));
    while (i > 0 && !DRAWN[STAGES[i]] && !late[STAGES[i]]) i--; return STAGES[i];
  }
  // daemon id -> the baked forms it wears (bake_spirits.py SOURCES, each family's first base with GLBs). The Holdfast has
  // none baked yet, so the Controller wears the Shellback's, as the Damaged Self and the Emotional Body do.
  var FILES = { protector: "shellback", player: "romp", fixer: "tinker", skeptic: "hedge", victim: "ballad" };
  function fileOf(family, stage) { return (FILES[family] || "shellback") + "-" + stage; }
  var files = {};
  function loadStage(family, stage) {
    var key = fileOf(family, stage), base = window.__oagCaveBase || "/ontology-game/cave/";
    if (!files[key]) {
      files[key] = (typeof fetch === "function" ? fetch(base + "spirits/" + key + ".glb") : Promise.reject(new Error("no fetch")))
        .then(function (r) { if (!r.ok) throw new Error(key + ".glb " + r.status); return r.arrayBuffer(); }).then(parseStage);
      files[key].catch(function () {}); // a form that does not load leaves the spirit in the form it has
    }
    return files[key];
  }
  // bake_spirits.py's files: one node whose scale and translation undo the 16-bit positions, one primitive per material,
  // each with its tone, opacity and glow in its extras
  function parseStage(buf) {
    var dv = new DataView(buf), jl = dv.getUint32(12, true);
    var j = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl))), bin = 20 + jl + 8, node = j.nodes[0], S = node.scale, T = node.translation;
    return j.meshes[0].primitives.map(function (p) {
      var a = j.accessors[p.attributes.POSITION], v = j.bufferViews[a.bufferView], ia = j.accessors[p.indices], iv = j.bufferViews[ia.bufferView];
      var raw = new Int16Array(buf, bin + (v.byteOffset || 0), a.count * 4), pos = new Float32Array(a.count * 3);
      for (var q = 0; q < a.count; q++) { // the page is z-up with x forward
        var x = raw[q * 4] / 32767 * S[0] + T[0], y = raw[q * 4 + 1] / 32767 * S[1] + T[1], z = raw[q * 4 + 2] / 32767 * S[2] + T[2];
        pos[q * 3] = x; pos[q * 3 + 1] = z - Y0; pos[q * 3 + 2] = -y;
      }
      var o = (iv.byteOffset || 0) + bin, col = null;
      if (p.attributes.COLOR_0 != null) { // the creature's and ally's painted parts: sRGB bytes, four to a vertex
        var ca = j.accessors[p.attributes.COLOR_0], cv = j.bufferViews[ca.bufferView], cb = new Uint8Array(buf, bin + (cv.byteOffset || 0), ca.count * 4);
        col = new Float32Array(ca.count * 3); for (var c = 0; c < ca.count; c++) { col[c * 3] = cb[c * 4] / 255; col[c * 3 + 1] = cb[c * 4 + 1] / 255; col[c * 3 + 2] = cb[c * 4 + 2] / 255; }
      }
      return { pos: pos, index: new Uint16Array(buf.slice(o, o + ia.count * 2)), col: col, look: p.extras || {} };
    });
  }
  function toneHex(THREE, hex, look) { return look.white ? new THREE.Color(0xffffff) : new THREE.Color(hex).multiplyScalar(look.tone == null ? 1 : look.tone); }
  // a painted part (the creature's and ally's) keeps its own colour; only the light-made parts take the family's tint
  function painted(L) { return !!(L.rgb || L.paint); }
  function tintStage(mesh, hex) { mesh.children.forEach(function (m) { var L = m.userData.look; if (!L.white && !painted(L)) m.material.color.setHex(hex).multiplyScalar(L.tone == null ? 1 : L.tone); }); }
  function fadeStage(mesh, k) { mesh.children.forEach(function (m) { m.material.opacity = m.userData.look.opacity * k; if (painted(m.userData.look)) m.material.transparent = k < 1; }); }
  // A core turns slowly on its axis; a hologram stands three quarters to the viewer, its head toward them, and hovers.
  // Each drawn form's front (its eyes) is its own +x, and the form's root faces the viewer with its +z, so a turn of -pi/2
  // puts the eyes on the viewer. The hologram and creature stand three quarters to the viewer; the ally faces them square.
  function turnOf(stage) { return stage === "core" ? 0 : -Math.PI / 2 + 0.7 + (stage === "ally" ? ALLY_TURN : 0); }
  function buildStage(THREE, parts, hex, stage) {
    var g = new THREE.Group();
    parts.forEach(function (P) {
      var geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(P.pos, 3)); geo.setIndex(new THREE.BufferAttribute(P.index, 1));
      var L = P.look, mat;
      if (painted(L)) { // a body, not light: lit, solid, in its own paint, with a little glow of its own so the dim room does not swallow it
        geo.computeVertexNormals();
        if (P.col) geo.setAttribute("color", new THREE.BufferAttribute(P.col, 3));
        var paint = L.rgb ? new THREE.Color(L.rgb[0], L.rgb[1], L.rgb[2]) : new THREE.Color(0xffffff);
        mat = new THREE.MeshLambertMaterial({ color: paint, vertexColors: !!P.col, transparent: true, opacity: 1, side: THREE.DoubleSide,
          emissive: (L.rgb ? paint.clone() : new THREE.Color(0x3a3530)).multiplyScalar(L.glow >= 0.7 ? 1 : 0.35) });
      } else mat = new THREE.MeshBasicMaterial({ color: toneHex(THREE, hex, L), transparent: true, opacity: L.opacity == null ? 1 : L.opacity, depthWrite: false,
        side: THREE.DoubleSide, blending: L.glow >= 0.7 ? THREE.AdditiveBlending : THREE.NormalBlending });
      var m = new THREE.Mesh(geo, mat); m.userData.look = L; m.frustumCulled = false; g.add(m);
    });
    g.userData.stage = stage; g.scale.setScalar(SCALE);
    g.rotation.y = turnOf(stage);
    return g;
  }
  // Unfold the spirit built by buildForm into `to` (a stage name). It fetches the form's file the first time any spirit
  // needs it; the gas draws in and fades as the core grows out of it, or the core swells and fades as the hologram opens
  // around it. Without animate (a spirit that comes back in already unfolded) the new form is simply there; with reduced
  // motion it fades in where it stands.
  function unfold(THREE, root, to, animate) {
    var st = root.userData.form, want = drawnStage(to, st.family); st.stage = STAGES.indexOf(to) >= 0 ? to : st.stage;
    if (want === st.drawn || want === st.unfolding) return Promise.resolve(root);
    st.unfolding = want;
    return loadStage(st.family, want).then(function (parts) {
      if (st.unfolding !== want) return root;
      var next = buildStage(THREE, parts, st.hex, want), prev = st.mesh, gas0 = st.gas, ms = !animate ? 0 : reducedMotion ? FADE_MS : UNFOLD_MS;
      root.add(next); st.mesh = next; st.drawn = want; st.unfolding = null; st.unfoldedAt = (typeof performance !== "undefined" ? performance : Date).now();
      function step(t) {
        var e = t * t * (3 - 2 * t);
        fadeStage(next, e); if (!reducedMotion) next.scale.setScalar(SCALE * (0.3 + 0.7 * e));
        if (prev) { fadeStage(prev, 1 - e); if (!reducedMotion) prev.scale.setScalar(SCALE * (1 + 0.5 * e)); }
        st.gas = gas0 * (1 - e); root.userData.materials.forEach(function (m) { if (!reducedMotion) m.opacity = 0.95 * st.gas; });
        if (t >= 1 && prev) { root.remove(prev); prev = null; }
      }
      var t0 = st.unfoldedAt, spin = 0, last = t0, done = !ms;
      if (done) step(1);
      next.children[0].onBeforeRender = function () {
        var now = (typeof performance !== "undefined" ? performance : Date).now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
        if (!done) { var t = Math.min(1, (now - t0) / ms); step(t); done = t >= 1; }
        if (reducedMotion) return;
        if (want === "core") { spin += dt * 0.6; next.rotation.y = spin; }
        else next.position.y = 0.04 * Math.sin(now / 900);
      };
      return root;
    });
  }
  // The form a family's spirit wears at its stage: the gas, unfolded at once to the core or hologram if it is past the gas.
  // o.from streams a new spirit's motes out of the daemon's body (a newborn is always a gas).
  function buildForm(THREE, family, hex, o) {
    o = o || {};
    var stage = STAGES.indexOf(o.stage) > 0 ? o.stage : "gas";
    var root = buildGas(THREE, family, hex, { from: stage === "gas" ? o.from : null, faceAt: o.faceAt });
    root.userData.unfold = function (to, animate) { return unfold(THREE, root, to, animate !== false); };
    if (stage !== "gas") unfold(THREE, root, stage, false);
    return root;
  }

  window.__oagSpiritForms = { FAMILIES: FAMILIES, familyOf: familyOf, buildGas: buildGas, buildForm: buildForm, tintProxy: tintProxy, SHAPES: SHAPES,
    STAGES: STAGES, AT: AT, stageOf: stageOf, drawnStage: drawnStage, fileOf: fileOf, loadStage: loadStage };
})();
