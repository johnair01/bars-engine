// The Cave of Lessons: the ontology game's block work, played inside the body map.
//
// Design: content/ontology-game/cave/DESIGN.md. Wendell, 9 October 2026: "create a version where the game
// happens inside the body map instead of the body map being inside the game", and "Let's have the chamber
// change to meet the spot." The player taps the figure (the body map's own picker, OAGBody.pick) and the
// page dives into a chamber shaped for that spot, then walks its five places.
//
// Needs body-map.js (OAGBody) loaded first. Reads cave-kit.glb and spots.json beside the page; they are
// made by build_kit.py. Day 2 of the week: one chamber walks end to end. The texture and element looks,
// the portals between sensations and the daemon figure come on days 3 and 4.
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

  // ---- shaping a chamber to a spot -------------------------------------------------------
  // The centre line: the passage runs straight at first and curves by the spot's bend (degrees over its length).
  function centreLine(spot, n) {
    var pts = [], x = 0, z = 0, step = spot.length / n, bend = (spot.bend * Math.PI) / 180;
    for (var i = 0; i <= n; i++) {
      var heading = bend * (i / n);
      pts.push({ x: x, z: z, yaw: heading });
      x += Math.sin(-heading) * step;  // heading turns the passage towards +X for a positive bend
      z -= Math.cos(heading) * step;
    }
    return pts;
  }
  function at(line, t) {
    var f = t * (line.length - 1), i = Math.min(line.length - 2, Math.floor(f)), k = f - i, a = line[i], b = line[i + 1];
    return { x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k, yaw: a.yaw + (b.yaw - a.yaw) * k };
  }

  function buildChamber(A, spot, sceneParts) {
    var THREE = A.THREE, group = new THREE.Group();
    function geom(piece) {
      var g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(piece.position, 3));
      g.setAttribute("normal", new THREE.BufferAttribute(piece.normal, 3));
      g.setIndex(new THREE.BufferAttribute(piece.index, 1));
      return g;
    }
    var G = {}; Object.keys(A.kit).forEach(function (k) { G[k] = geom(A.kit[k]); });
    var rock = new THREE.MeshStandardMaterial({ color: 0x8c8278, roughness: 0.95, side: THREE.DoubleSide });
    var n = Math.max(6, Math.round(spot.length / 2)), line = centreLine(spot, n), segLen = spot.length / n;
    var w = spot.width / 2, h = spot.height / 2;
    // Walls: one ring per segment, stacked and turned along the centre line.
    for (var i = 0; i < n; i++) {
      var c = at(line, (i + 0.5) / n), ring = new THREE.Mesh(G.wall_ring, rock);
      ring.position.set(c.x, 0, c.z + segLen / 2); // the ring runs -Z from its origin
      ring.rotation.y = c.yaw;
      ring.position.set(c.x + Math.sin(c.yaw) * segLen / 2, 0, c.z + Math.cos(c.yaw) * segLen / 2);
      ring.scale.set(w, h, segLen * 1.12);
      group.add(ring);
      var fl = new THREE.Mesh(G.floor, rock);
      fl.position.copy(ring.position); fl.position.y = -h * 0.92; fl.rotation.y = c.yaw; fl.scale.set(w * 1.8, 1, segLen * 1.12);
      group.add(fl);
    }
    sceneParts.rock = rock;
    // The five places along the passage.
    var places = PLACES.map(function (p) {
      var c = at(line, p.t), pos = new THREE.Vector3(c.x, 0, c.z);
      var marker = new THREE.Mesh(new THREE.SphereGeometry(Math.min(w, h) * 0.12, 16, 12),
        new THREE.MeshBasicMaterial({ color: 0xfff1b0, transparent: true, opacity: 0.85 }));
      marker.position.set(c.x, -h * 0.1, c.z); marker.userData.place = p.id;
      group.add(marker);
      return { id: p.id, step: p.step, pos: pos, yaw: c.yaw, marker: marker };
    });
    var byId = {}; places.forEach(function (p) { byId[p.id] = p; });
    // The pool: a basin on the floor that turns to the element chosen.
    var poolMat = new THREE.MeshStandardMaterial({ color: 0x405060, roughness: 0.3, emissive: 0x000000 });
    var pool = new THREE.Mesh(G.pool, poolMat);
    pool.position.set(byId.pool.pos.x, -h * 0.9, byId.pool.pos.z - segLen);
    pool.scale.set(Math.min(w * 0.7, 3.2), 1, Math.min(w * 0.7, 3.2));
    group.add(pool); sceneParts.poolMat = poolMat;
    // The gate: six standing stones round a ring, one for each game master.
    sceneParts.stones = [];
    for (var s = 0; s < 6; s++) {
      var a = (s / 6) * Math.PI * 2, r = Math.min(w * 0.75, 3.4);
      var st = new THREE.Mesh(G.gate_stone, new THREE.MeshStandardMaterial({ color: 0x9a9aa8, roughness: 0.8, emissive: 0x000000 }));
      st.position.set(byId.gate.pos.x + Math.cos(a) * r, -h * 0.92, byId.gate.pos.z - segLen + Math.sin(a) * r);
      st.scale.set(Math.min(r, 3) * 0.5, Math.min(h * 1.1, 4), Math.min(r, 3) * 0.5);
      group.add(st); sceneParts.stones.push(st);
    }
    // The way out: an arch of light at the end.
    var arch = new THREE.Mesh(G.portal_arch, new THREE.MeshBasicMaterial({ color: 0xfff1b0 }));
    arch.position.set(byId.way_out.pos.x, -h * 0.92, byId.way_out.pos.z - segLen); arch.rotation.y = byId.way_out.yaw;
    arch.scale.set(Math.min(w * 0.8, h * 0.8), Math.min(w * 0.8, h * 0.8), 1);
    group.add(arch);
    // Light: a front place is lit from ahead, a back place from behind, the rest from the side (DESIGN.md).
    var end = at(line, 1), amb = new THREE.HemisphereLight(0xffffff, 0x302828, 0.45);
    group.add(amb);
    var lamp = new THREE.PointLight(0xffe0b0, 1.1, spot.length * 3);
    if (spot.side === "front") lamp.position.set(end.x, h * 0.3, end.z);
    else if (spot.side === "back") lamp.position.set(0, h * 0.3, 4);
    else lamp.position.set(spot.position[0] >= 0 ? w : -w, h * 0.5, -spot.length / 2);
    group.add(lamp);
    return { group: group, places: places, byId: byId, line: line };
  }

  // ---- the page --------------------------------------------------------------------------
  var CSS = ".oagc{position:fixed;inset:0;z-index:900;background:#0e0e1a;color:#e0e0e0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;flex-direction:column}" +
    ".oagc canvas{display:block;position:absolute;inset:0;width:100%;height:100%;touch-action:none}" +
    ".oagc-card{padding:.8rem 1rem calc(.8rem + env(safe-area-inset-bottom));background:rgba(20,20,40,.96);border-top:1px solid rgba(255,255,255,.12)}" +
    ".oagc-card h2{margin:0 0 .3rem;font-size:1rem;color:#fff}.oagc-card p{margin:.3rem 0;font-size:.92rem}" +
    ".oagc-row{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.5rem}" +
    ".oagc button{background:#64c8ff;color:#10142a;border:none;border-radius:8px;padding:.6rem .9rem;font-size:.92rem;font-weight:600;min-height:44px;cursor:pointer;width:auto;margin:0}" +
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
  function dive(label, home) {
    load().then(function (A) {
      var l = String(label).trim().toLowerCase();
      var spot = A.spots.filter(function (s) { return s.words.toLowerCase() === l; })[0];
      if (!spot) {
        // A typed place the figure does not name: the nearest named place by words is not guessed;
        // the player is sent back to tap the figure. (A choice for day 2.)
        alert("That place is not on the figure yet. Tap the figure to choose one.");
        return;
      }
      enter(A, spot, home);
    }).catch(function (e) { alert("The cave could not open: " + e.message); });
  }

  function enter(A, spot, home) {
    var THREE = A.THREE;
    var wrap = el("div", { class: "oagc", "data-cave-chamber": spot.id });
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
    var scene = new THREE.Scene(); scene.background = new THREE.Color(0x0c0c16); scene.fog = new THREE.FogExp2(0x0c0c16, 0.018);
    var camera = new THREE.PerspectiveCamera(70, 1, 0.1, 200);
    var parts = {}, ch = buildChamber(A, spot, parts);
    scene.add(ch.group);

    var state = { spot: spot.id, place: 0, texture: null, element: null, look: { yaw: 0, pitch: 0 }, done: [], log: [] };
    var cam = { x: ch.places[0].pos.x, z: ch.places[0].pos.z + 3, yaw: 0 }, goal = null;
    function eye() { return -spot.height * 0.12; }
    function aim(p) { goal = { x: p.pos.x, z: p.pos.z + 3 * Math.cos(p.yaw), yaw: p.yaw, t: 0, from: { x: cam.x, z: cam.z, yaw: cam.yaw } }; }
    aim(ch.places[0]);

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
      camera.position.set(cam.x, eye(), cam.z);
      camera.rotation.set(state.look.pitch, cam.yaw + state.look.yaw, 0, "YXZ");
      ch.places.forEach(function (p, i) { p.marker.visible = i === state.place || state.done.indexOf(p.id) >= 0; p.marker.scale.setScalar(1 + 0.15 * Math.sin(Date.now() / 300)); });
      renderer.render(scene, camera);
      running = requestAnimationFrame(render);
    }
    size(); window.addEventListener("resize", size);

    // One finger: drag to look, tap the glowing marker to walk to the next place.
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
      if (!wasTap) return;
      var r = dom.getBoundingClientRect();
      ray.setFromCamera({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }, camera);
      var hit = ray.intersectObjects(ch.places.map(function (p) { return p.marker; }))[0];
      if (hit && hit.object.userData.place === ch.places[state.place].id) say();
    });

    // What the player does at each place. Day 2 carries the step and the choice; the words from the game
    // (the questions, the clean up steps) are wired on day 4.
    function finish(id) { if (state.done.indexOf(id) < 0) state.done.push(id); }
    function next() {
      finish(PLACES[state.place].id);
      if (state.place < PLACES.length - 1) { state.place++; aim(ch.places[state.place]); say(); }
    }
    function choice(opts, picked, onPick, attr) {
      return el("div", { class: "oagc-row" }, opts.map(function (o) {
        return el("button", { class: "alt", "data-cave-choice": o[0], "aria-pressed": String(picked === o[0]), text: o[1], onclick: function () { onPick(o); say(); } });
      }));
    }
    function say() {
      var p = PLACES[state.place], kids = [], title = p.step + " · " + spot.words;
      card.innerHTML = ""; card.setAttribute("data-cave-place", p.id);
      var body = [], go = el("button", { "data-cave-next": "", text: "Continue", onclick: next });
      if (p.id === "mouth") {
        body.push(el("p", { text: "What does it feel like in " + spot.words + "?" }));
        body.push(choice(TEXTURES.map(function (t) { return [t[0], t[1]]; }), state.texture, function (o) {
          state.texture = o[0];
          var t = TEXTURES.filter(function (x) { return x[0] === o[0]; })[0]; parts.rock.color.setHex(t[2]);
        }));
        if (!state.texture) go.disabled = true;
      } else if (p.id === "pool") {
        body.push(el("p", { text: "Which feeling is here? The pool takes its element." }));
        body.push(choice(ELEMENTS.map(function (x) { return [x[0], x[0] + " · " + x[1]]; }), state.element, function (o) {
          state.element = o[0];
          var x = ELEMENTS.filter(function (e) { return e[0] === o[0]; })[0]; parts.poolMat.color.setHex(x[3]); parts.poolMat.emissive.setHex(x[3]); parts.poolMat.emissiveIntensity = 0.2;
        }));
        var el0 = ELEMENTS.filter(function (e) { return e[0] === state.element; })[0];
        if (el0) body.push(el("p", { text: "The move that goes with it: " + el0[2] + "." }));
        else go.disabled = true;
      } else if (p.id === "passage") {
        body.push(el("p", { text: "A daemon stands in the way. Who does it work for?" }));
        body.push(el("p", { "data-cave-daemon-for": "", text: DAEMON_WORKS_FOR }));
      } else if (p.id === "gate") {
        body.push(el("p", { text: "Six stones, one for each game master. Step to each and look from there." }));
        parts.stones.forEach(function (s) { s.material.emissive.setHex(0x333344); });
      } else {
        body.push(el("p", { text: "Light from above. Breathe out, and come back to the step." }));
        go.textContent = "Come back out";
        go.onclick = function () { finish("way_out"); leave(true); };
      }
      card.appendChild(el("h2", { text: title })); body.forEach(function (b) { card.appendChild(b); }); card.appendChild(el("div", { class: "oagc-row" }, [go]));
    }

    function leave(save) {
      if (save && state.texture) {
        // The scan is saved the way the body map saves one (body-map.js record), so "Where it has lived" shows it.
        window.OAGBody.record({ location: spot.words, texture: state.texture, channel: state.element, where: "cave" });
      }
      fade.style.opacity = 1;
      setTimeout(function () {
        cancelAnimationFrame(running); window.removeEventListener("resize", size);
        renderer.dispose(); wrap.remove(); home.style.display = "";
        window.__oagCave.last = state;
      }, 500);
    }
    say(); render();
    window.__oagCave.state = state; window.__oagCave.leave = leave;
  }

  window.__oagCave = { start: start, load: load, dive: function (label) { return dive(label, document.querySelector("[data-cave-home]")); } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
