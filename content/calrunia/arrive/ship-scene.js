// /calrunia/arrive: Chapter 1's arrival aboard the ship (Wendell's board answer: "I'd want a 3d ship as a first pass"). The ship
// is the player's inner vessel; its cabin is the WAVE room and its dock (cave/vessel.js openDock) is where parts are fitted.
// The player arrives from Sprout with a passport in the fragment (#p=..., public/passport/arrive.js), sees their spirit aboard,
// their hand of cards, their vibeulons and the blank card, and the spirit asks about the blank card. ?demo=1 arrives with the
// Chapter 1 fixture (fixtures/passport/valid/chapter1-sprout.json). Built into public/calrunia/arrive/ by
// scripts/build-calrunia-arrive.mjs. The ship and dock are Kenney's Pirate Kit (CC0, public/calrunia/ship/LICENSE.txt).
(function () {
  "use strict";
  var THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"; // the cave's own three.js
  var GLTF_URL = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js";
  var SHIP_BASE = "/calrunia/ship/";
  // UI_COVENANT.md: element = colour (the gem shade), the page's dark ground and card body.
  var ELEMENT = { wood: ["#4a7c59", "#27AE60", "#2ecc71"], fire: ["#c1392b", "#e8671a", "#e74c3c"], earth: ["#b5651d", "#D4A017", "#d4a017"],
    metal: ["#8e9aab", "#BDC3C7", "#bdc3c7"], water: ["#1a3a5c", "#1a7a8a", "#2980b9"] };
  var LINE = "That blank card came aboard with us. What would you like it to hold, when you’re ready?";

  var A = window.__calruniaArrive, G = window.__calruniaPassport, check = window.__calruniaPassportCheck.validatePassport;
  var state = window.__calruniaArrival = { status: "loading", errors: [], shown: null, model: null, ready: false };

  // ---- the passport ----------------------------------------------------------------------------------------------------
  var params = new URLSearchParams(location.search), frag = A.decode(location.hash), incoming = null;
  if (frag.found) {
    if (frag.error) { state.status = "unreadable"; state.errors = [frag.error]; }
    else { var r = check(frag.value); if (r.ok) incoming = r.passport; else { state.status = "refused"; state.errors = r.errors; } }
  } else if (params.get("demo") === "1") {
    var d = check(window.__calruniaDemoPassport); if (d.ok) incoming = d.passport;
  }
  var stored = false;
  if (incoming) {
    stored = A.apply(incoming);
    state.status = "arrived";
    // The fragment has done its work; a reload reads the stores. The query (?demo=1) stays.
    if (frag.found && stored) try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* the hash stays */ }
  }
  var here = G.read(), shown = stored || !incoming ? here : incoming;
  if (!incoming && state.status === "loading") state.status = shown.spirits.length || shown.hand.length ? "returning" : "none";
  state.shown = shown;

  var spirit = shown.spirits.filter(function (s) { return s.loadout; })[0] || shown.spirits[0] || null;
  var cards = shown.hand.filter(function (h) { return h.title; });
  var hue = ELEMENT[spirit && spirit.element] || ELEMENT.metal;

  // ---- the overlay -----------------------------------------------------------------------------------------------------
  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { if (k === "text") n.textContent = attrs[k]; else if (k === "onclick") n.onclick = attrs[k]; else n.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  var rootEl = document.getElementById("arrive-root");
  rootEl.style.setProperty("--el-frame", hue[0]); rootEl.style.setProperty("--el-glow", hue[1]); rootEl.style.setProperty("--el-gem", hue[2]);
  var NOTE = {
    unreadable: "Your passport didn’t come through this link, so you’ve arrived with what this phone already holds. The ship is yours all the same.",
    refused: "Your passport didn’t come through this link, so you’ve arrived with what this phone already holds. The ship is yours all the same.",
    none: "You’ve come aboard without a passport. Chapter 1 sends one with you; the ship is yours all the same.",
  }[state.status];

  var hand = h("div", { class: "arr-hand", "data-arrive-hand": "" });
  cards.forEach(function (c) {
    hand.appendChild(h("div", { class: "arr-card " + (c.kind === "bar" ? "is-bar" : "is-card"), "data-arrive-card": c.id }, [
      h("span", { class: "arr-kind", text: c.kind === "bar" ? "BAR" : "Card" }), h("span", { class: "arr-title", text: c.title })]));
  });
  hand.appendChild(h("div", { class: "arr-card is-blank", "data-arrive-blank": "" }, [h("span", { class: "arr-kind", text: "Blank" }), h("span", { class: "arr-title", text: " " })]));

  var sheet = h("section", { class: "arr-sheet", "aria-label": "What you brought aboard" }, [
    NOTE ? h("p", { class: "arr-note", role: "status", "data-arrive-note": state.status, text: NOTE }) : null,
    h("p", { class: "arr-say", "data-arrive-line": "" }, [
      h("span", { class: "arr-who", text: spirit ? (spirit.name || "Your spirit") : "The ship" }), document.createTextNode(LINE)]),
    hand,
    h("div", { class: "arr-row" }, [
      h("p", { class: "arr-vib", "data-arrive-vibeulons": String(shown.vibeulons) }, [h("b", { text: String(shown.vibeulons) }), document.createTextNode(shown.vibeulons === 1 ? " vibeulon" : " vibeulons")]),
      h("button", { class: "arr-go", "data-arrive-cabin": "", onclick: function () { openCabin(); }, text: "Step into the cabin" }),
    ]),
  ]);
  rootEl.appendChild(h("header", { class: "arr-top" }, [h("h1", { text: "Aboard your ship" })]));
  rootEl.appendChild(sheet);

  function openCabin() {
    var V = window.__oagVessel;
    if (!V || !V.openDock) { location.href = "/ontology-game/cave"; return; }
    sheet.hidden = true;
    V.openDock(rootEl, { onClose: function () { sheet.hidden = false; } });
  }

  // ---- the scene -------------------------------------------------------------------------------------------------------
  function script(src) { return new Promise(function (res, rej) { var s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = function () { rej(new Error(src)); }; document.head.appendChild(s); }); }
  (window.THREE ? Promise.resolve() : script(THREE_URL)).then(function () {
    return script(GLTF_URL).catch(function () { /* the ship is built from primitives instead */ });
  }).then(build).catch(function (e) { state.status3d = "no three.js: " + e.message; state.ready = true; });

  function build() {
    var THREE = window.THREE;
    var canvas = document.getElementById("arrive-scene");
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputEncoding = THREE.sRGBEncoding;
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x141a30);
    scene.fog = new THREE.Fog(0x141a30, 30, 90);
    var camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);
    scene.add(new THREE.HemisphereLight(0xb8c4ff, 0x203040, 0.85));
    var sun = new THREE.DirectionalLight(0xffe2b8, 0.9); sun.position.set(-12, 18, 10); scene.add(sun);
    var lantern = new THREE.PointLight(0xffb060, 1.1, 14); lantern.position.set(4.6, 3.2, 1.5); scene.add(lantern);

    var water = new THREE.Mesh(new THREE.CircleGeometry(80, 48), new THREE.MeshStandardMaterial({ color: 0x0f3550, roughness: 0.35, metalness: 0.15 }));
    water.rotation.x = -Math.PI / 2; water.position.y = 0.9; scene.add(water);

    var ship = new THREE.Group(); scene.add(ship);
    var deckY = 1.9, target = new THREE.Vector3(0.6, 3.2, 0), SPOT = { x: 1.4, z: -1.6 }, faces = [];

    function primitiveShip() {
      var wood = new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.8 }), cloth = new THREE.MeshStandardMaterial({ color: 0xece4d4, roughness: 0.9, side: THREE.DoubleSide });
      var hull = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.8, 10), wood); hull.position.y = 1; ship.add(hull);
      [[0.8, 7], [-3.6, 6]].forEach(function (m) {
        var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, m[1], 8), wood); mast.position.set(0, 1.9 + m[1] / 2, m[0]); ship.add(mast);
        var sail = new THREE.Mesh(new THREE.PlaneGeometry(3.8, m[1] * 0.55), cloth); sail.position.set(0, 2.4 + m[1] * 0.5, m[0] + 0.2); ship.add(sail);
      });
      deckY = 1.9; state.model = "primitives";
    }
    function dockPieces(gltf) {
      for (var i = 0; i < 4; i++) {
        var p = gltf ? gltf.scene.clone(true) : new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.3, 2.5), new THREE.MeshStandardMaterial({ color: 0x6a4630 }));
        if (!gltf) p.position.y = 1.15;
        p.position.x += 4.1; p.position.y += 0.45; p.position.z += -3.75 + i * 2.5; scene.add(p);
      }
    }

    var place = function () {
      // The spirit stands on the deck, the blank card beside it, the vibeulons at its feet.
      var at = new THREE.Vector3(SPOT.x, deckY, SPOT.z);
      if (spirit && window.__oagSpiritForms) {
        var F = window.__oagSpiritForms, fam = F.familyOf(spirit.family), hex = new THREE.Color(hue[2]).getHex();
        var stage = fam ? F.drawnStage(F.stageOf(spirit.sittings), fam) : "gas";
        var form = F.buildForm(THREE, fam, hex, { stage: stage });
        form.scale.setScalar(3); form.position.set(at.x, at.y + 1.7, at.z); scene.add(form);
        // A soft halo behind the motes, so the spirit reads against the ship's timber.
        var cv = document.createElement("canvas"); cv.width = cv.height = 64; var cx = cv.getContext("2d");
        var gr = cx.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,0)"); cx.fillStyle = gr; cx.fillRect(0, 0, 64, 64);
        var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), color: new THREE.Color(hue[1]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
        halo.scale.setScalar(3.2); halo.position.copy(form.position); scene.add(halo);
      } else {
        var glow = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff0c0 })); glow.position.set(at.x, at.y + 1.4, at.z); scene.add(glow);
      }
      var blank = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.25, 0.03), new THREE.MeshStandardMaterial({ color: 0xf6f2e8, roughness: 0.6, emissive: 0x3a362c }));
      blank.position.set(at.x + 0.9, at.y + 1.4, at.z + 1.2); blank.name = "blank-card"; scene.add(blank); faces.push(blank);
      var edge = new THREE.LineSegments(new THREE.EdgesGeometry(blank.geometry), new THREE.LineBasicMaterial({ color: new THREE.Color(hue[1]) }));
      blank.add(edge);
      var coin = new THREE.CylinderGeometry(0.22, 0.22, 0.07, 20), gold = new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.6, roughness: 0.35, emissive: 0x3a2a00 });
      for (var i = 0; i < Math.min(6, shown.vibeulons); i++) { var c = new THREE.Mesh(coin, gold); c.position.set(at.x - 0.7 + i * 0.5, at.y + 0.05 + (i % 2) * 0.02, at.z + 0.9); scene.add(c); }
      target.set(0.6, deckY + 1.2, 0);
      state.deckY = deckY; state.ready = true; state.blankCard = true;
    };

    var loaded = 0;
    function done() { if (++loaded === 2) place(); }
    if (THREE.GLTFLoader) {
      var L = new THREE.GLTFLoader();
      L.load(SHIP_BASE + "ship-medium.glb", function (g) {
        ship.add(g.scene); state.model = "kenney ship-medium";
        // Find the deck: cast down beside the masts, onto the hull alone.
        var hull = null; g.scene.traverse(function (o) { if (o.isMesh && o.name.indexOf("sail") < 0 && o.name.indexOf("flag") < 0 && !hull) hull = o; });
        g.scene.updateMatrixWorld(true);
        var ray = new THREE.Raycaster(new THREE.Vector3(SPOT.x, 30, SPOT.z), new THREE.Vector3(0, -1, 0)), hit = hull && ray.intersectObject(hull, false)[0];
        if (hit) deckY = hit.point.y;
        done();
      }, undefined, function () { primitiveShip(); done(); });
      L.load(SHIP_BASE + "structure-platform-dock.glb", function (g) { dockPieces(g); done(); }, undefined, function () { dockPieces(null); done(); });
    } else { primitiveShip(); dockPieces(null); loaded = 1; done(); }

    // One finger turns the view and two pinch it nearer, as in the WAVE room; the mouse wheel does the same on a computer.
    var yaw = 0.95, pitch = 0.36, zoom = 1, ptrs = {}, drag = null, pinch = null;
    function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
    function spread() { var k = Object.keys(ptrs); return k.length < 2 ? 0 : Math.hypot(ptrs[k[0]].x - ptrs[k[1]].x, ptrs[k[0]].y - ptrs[k[1]].y); }
    canvas.addEventListener("pointerdown", function (e) {
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (Object.keys(ptrs).length === 1) drag = { x: e.clientX, y: e.clientY }; else { drag = null; pinch = { d: spread(), z: zoom }; }
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!ptrs[e.pointerId]) return;
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (pinch) { var d = spread(); if (pinch.d > 0 && d > 0) zoom = clamp(pinch.z * pinch.d / d, 0.45, 1.6); return; }
      if (!drag) return;
      yaw -= (e.clientX - drag.x) * 0.006; pitch = clamp(pitch + (e.clientY - drag.y) * 0.004, 0.05, 1.2);
      drag.x = e.clientX; drag.y = e.clientY; state.turned = true;
    });
    ["pointerup", "pointercancel"].forEach(function (n) { canvas.addEventListener(n, function (e) {
      delete ptrs[e.pointerId]; var left = Object.keys(ptrs); if (left.length < 2) pinch = null;
      drag = left.length === 1 ? { x: ptrs[left[0]].x, y: ptrs[left[0]].y } : null;
    }); });
    canvas.addEventListener("wheel", function (e) { e.preventDefault(); zoom = clamp(zoom * Math.exp(e.deltaY * 0.0015), 0.45, 1.6); }, { passive: false });
    ["touchstart", "touchmove"].forEach(function (n) { canvas.addEventListener(n, function (e) { if (e.cancelable) e.preventDefault(); }, { passive: false }); });

    function size() {
      var w = window.innerWidth, ht = window.innerHeight;
      renderer.setSize(w, ht, false); camera.aspect = w / ht;
      // The sheet covers the lower part of the screen, so the ship is drawn in the space above it.
      var cover = sheet.hidden ? 0 : Math.min(ht * 0.6, sheet.getBoundingClientRect().height);
      camera.setViewOffset(w, ht, 0, cover * 0.5, w, ht);
      camera.updateProjectionMatrix();
      state.fit = w / ht < 0.8 ? 2.1 : 1.1;
    }
    window.addEventListener("resize", size); size();
    function frame() {
      requestAnimationFrame(frame);
      if (size.cover !== sheet.hidden) { size.cover = sheet.hidden; size(); }
      var r = 15 * zoom * (state.fit || 1);
      camera.position.set(target.x + r * Math.cos(pitch) * Math.sin(yaw), target.y + r * Math.sin(pitch), target.z + r * Math.cos(pitch) * Math.cos(yaw));
      camera.lookAt(target);
      faces.forEach(function (o) { o.rotation.y = yaw; }); // the blank card turns to the player
      renderer.render(scene, camera);
    }
    frame();
  }
})();
