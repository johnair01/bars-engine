// A room built by room.py, walked freely on the cave page.
//
// Wendell, 14 October 2026: "we need to test the ergonomics of Freeform navigation in preparation of introducing running".
// The WAVE test room (rooms/wave-room/room.json, built from his concept picture) is loaded as it comes out of Blender and
// walked with the same stick as the WAVE room: a circle at the bottom left, or the arrow keys and W A S D. A drag turns the
// camera round the figure; a pinch or the wheel brings it closer or further. Nothing in the room opens a page yet: this is
// for feeling the walk, the camera and the scale.
//
// Needs cave.js loaded first (window.__oagCave.kit: three.js, the faceless figure and its walk). Reads rooms/wave-room.glb
// beside the page. The glTF loader is three.js r128's own, from jsDelivr, to match the cave's three.js.
(function () {
  "use strict";
  var CAVE = window.__oagCave; if (!CAVE || !CAVE.kit) return;
  var K = CAVE.kit, el = K.el, clamp = K.clamp;
  var BASE = window.__oagCaveBase || "/ontology-game/cave/";
  var LOADER_URL = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js";
  // The figure is 3.6 units tall (AVATAR_H in cave.js) and room.py builds a player height as 1.7 m, so a metre is 3.6 / 1.7.
  var PH = 3.6, M = PH / 1.7;
  var WALK = 1.6 * PH;      // full stick: 1.6 player heights a second, the cave's walking pace
  var BODY_R = 0.22 * PH;   // how close the figure's middle comes to a wall or a boulder
  var CAM = { back: 2.4 * PH, up: 1.25 * PH, aim: 0.75 * PH };

  var CSS =
    ".oagw{position:fixed;inset:0;z-index:910;background:#120e10;overflow:hidden;touch-action:none}" +
    ".oagw canvas{display:block;width:100%;height:100%}" +
    ".oagw .oagw-top{position:absolute;top:calc(10px + env(safe-area-inset-top));left:10px;right:10px;display:flex;gap:.5rem;align-items:flex-start;z-index:5;pointer-events:none}" +
    ".oagw .oagw-top button{pointer-events:auto}" +
    ".oagw .oagw-hint{flex:1;margin:0;padding:.45rem .6rem;background:rgba(12,12,28,.72);border-radius:10px;color:#f4f4fa;font:14px/1.3 -apple-system,Segoe UI,Roboto,sans-serif}" +
    ".oagw .oagw-load{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff1d0;font:16px -apple-system,Segoe UI,Roboto,sans-serif}";

  var loaderP = null;
  function loadLoader(THREE) {
    if (THREE.GLTFLoader) return Promise.resolve(THREE.GLTFLoader);
    if (loaderP) return loaderP;
    loaderP = new Promise(function (res, rej) {
      var s = el("script", { src: LOADER_URL });
      s.onload = function () { THREE.GLTFLoader ? res(THREE.GLTFLoader) : rej(new Error("no GLTFLoader")); };
      s.onerror = function () { loaderP = null; rej(new Error("GLTFLoader did not load")); };
      document.head.appendChild(s);
    });
    return loaderP;
  }

  function open(name) {
    name = name || "wave-room";
    if (!document.getElementById("oagc-css")) document.head.appendChild(el("style", { id: "oagc-css", text: K.CSS }));
    if (!document.getElementById("oagw-css")) document.head.appendChild(el("style", { id: "oagw-css", text: CSS }));
    K.guardPage();
    var wrap = el("div", { class: "oagc oagw", "data-walk-room": name });
    var msg = el("div", { class: "oagw-load", text: "Opening the room…" });
    var hint = el("p", { class: "oagw-hint", "data-walk-hint": "", text: "Walk with the circle at the bottom left (or the arrow keys). Drag to turn the camera; pinch to come closer." });
    var leave = el("button", { class: "alt", "data-walk-leave": "", text: "Leave" });
    wrap.appendChild(el("div", { class: "oagw-top" }, [leave, hint]));
    wrap.appendChild(msg);
    wrap.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    document.body.appendChild(wrap);
    var S = window.__oagWalkRoom = { name: name, ready: false, error: null, x: 0, z: 0, yaw: 0, camYaw: 0, moved: 0, bumps: 0 };

    return K.loadThree().then(function (THREE) {
      return Promise.all([loadLoader(THREE), fetch(BASE + "rooms/" + name + ".glb").then(function (r) {
        if (!r.ok) throw new Error(name + ".glb " + r.status); return r.arrayBuffer();
      })]).then(function (got) {
        return new Promise(function (res, rej) { new THREE.GLTFLoader().parse(got[1], "", function (g) { res([THREE, g]); }, rej); });
      });
    }).then(function (got) { build(got[0], got[1].scene); }, function (err) {
      S.error = String(err && err.message || err); msg.textContent = "The room did not open: " + S.error;
    });

    function build(THREE, room) {
      msg.remove();
      var renderer;
      try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch (e) { S.error = "no WebGL"; hint.textContent = "This phone could not draw the room."; return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputEncoding = THREE.sRGBEncoding;
      wrap.insertBefore(renderer.domElement, wrap.firstChild); K.holdArea(renderer.domElement);
      var scene = new THREE.Scene(); scene.background = new THREE.Color(0x120e10);
      var camera = new THREE.PerspectiveCamera(62, 1, 0.1, 400);

      // The room, in the cave's units. Blender's lights are swapped for ones the phone can afford: each keeps its place and
      // colour, at a strength chosen by eye. The figure room.py stood in for scale is hidden: the player is the figure now.
      room.scale.setScalar(M); scene.add(room); room.updateMatrixWorld(true);
      var lights = [], parts = {};
      room.traverse(function (o) {
        if (o.isLight) lights.push(o);
        if (o.name) parts[o.name] = o;
        if (o.isMesh && o.material) [].concat(o.material).forEach(function (m) { if (m.map) m.map.anisotropy = 4; });
      });
      lights.forEach(function (l) {
        var p = new THREE.Vector3(); l.getWorldPosition(p);
        var glow = /crystals|glow/.test(l.name), door = /beyond/.test(l.name);
        if (!l.isPointLight && !l.isSpotLight) { l.parent.remove(l); return; }
        var pl = new THREE.PointLight(l.color, door ? 1.2 : glow ? 0.8 : /cove/.test(l.name) ? 0.35 : 0.6, (door ? 6 : glow ? 4 : 5) * PH, 1.6);
        pl.position.copy(p); pl.name = l.name; scene.add(pl); l.parent.remove(l);
      });
      if (parts.player) parts.player.visible = false;
      scene.add(new THREE.HemisphereLight(0xffd9a8, 0x2a2018, 0.35));
      var top = new THREE.PointLight(0xffc890, 0.25, 14 * PH, 1.2); top.position.set(0, 4 * PH, 0); scene.add(top);

      // Where the figure may walk: inside the floor's oval, held off the wall, and outside the boulders, the seat, the
      // plinth and the lantern. Every bound comes from the GLB itself, so a rebuilt room needs no numbers here.
      var box = new THREE.Box3(), floorBox = box.setFromObject(parts.floor || room).clone();
      var RX = (floorBox.max.x - floorBox.min.x) / 2 - 0.55 * PH, RZ = (floorBox.max.z - floorBox.min.z) / 2 - 0.55 * PH;
      var CX = (floorBox.max.x + floorBox.min.x) / 2, CZ = (floorBox.max.z + floorBox.min.z) / 2;
      var blocks = [];
      Object.keys(parts).forEach(function (n) { // three.js drops the dot from a name: boulder.1 is boulder1
        if (!/^(seat|plinth|lantern|boulder\.?\d+)$/.test(n)) return;
        box.setFromObject(parts[n]);
        var hx = (box.max.x - box.min.x) / 2, hz = (box.max.z - box.min.z) / 2;
        blocks.push({ name: n, x: (box.max.x + box.min.x) / 2, z: (box.max.z + box.min.z) / 2, rx: hx + BODY_R, rz: hz + BODY_R });
      });
      S.bounds = { cx: CX, cz: CZ, rx: RX, rz: RZ, blocks: blocks };
      // Inside the oval, then pushed out of each block (an oval of its own, its footprint plus the figure's width).
      function hold(x, z) {
        var bumped = false, dx = x - CX, dz = z - CZ, q = (dx * dx) / (RX * RX) + (dz * dz) / (RZ * RZ);
        if (q > 1) { var k = 1 / Math.sqrt(q); x = CX + dx * k; z = CZ + dz * k; bumped = true; }
        blocks.forEach(function (b) {
          var ex = (x - b.x) / b.rx, ez = (z - b.z) / b.rz, d = Math.hypot(ex, ez);
          if (d < 1) { if (d < 1e-6) { ex = 0; ez = 1; d = 1; } x = b.x + ex / d * b.rx; z = b.z + ez / d * b.rz; bumped = true; }
        });
        return { x: x, z: z, bumped: bumped };
      }

      // The figure, where room.py stood it: a little behind the seat, facing the door (the door is at -z).
      var av = K.buildAvatar(THREE, "self"); scene.add(av);
      var start = parts.player ? new THREE.Vector3().setFromMatrixPosition(parts.player.matrixWorld) : new THREE.Vector3(0, 0, 2.6 * PH);
      var fig = { x: start.x, z: start.z, yaw: Math.PI, clk: 0, speed: 0 };
      var p0 = hold(fig.x, fig.z); fig.x = p0.x; fig.z = p0.z;
      var camYaw = 0, camPitch = 0.12, zoom = 1, camPos = new THREE.Vector3(), camAim = new THREE.Vector3();

      // ---- the stick and the keys (the WAVE room's own, cave.js) ----------------------------------------------------------
      var stick = { x: 0, z: 0 }, keys = {}, stickId = null;
      var pad = el("div", { class: "oagr-stick", "data-walk-stick": "", "aria-label": "Walk", role: "slider" }), knob = el("div", { class: "oagr-knob" });
      pad.appendChild(knob); wrap.appendChild(pad);
      function stickAt(e) {
        var rc = pad.getBoundingClientRect(), r = rc.width / 2; if (!(r > 0)) { stickUp(); return; }
        var dx = e.clientX - rc.left - r, dy = e.clientY - rc.top - r, d = Math.hypot(dx, dy), m = Math.min(d, r);
        stick.x = d ? dx / d * m / r : 0; stick.z = d ? dy / d * m / r : 0;
        knob.style.transform = "translate(" + stick.x * r * 0.6 + "px," + stick.z * r * 0.6 + "px)";
      }
      function stickUp() { stickId = null; stick.x = 0; stick.z = 0; knob.style.transform = ""; }
      pad.addEventListener("pointerdown", function (e) { e.preventDefault(); stickId = e.pointerId; try { pad.setPointerCapture(e.pointerId); } catch (x) { /* old browsers */ } stickAt(e); });
      pad.addEventListener("pointermove", function (e) { if (e.pointerId === stickId) stickAt(e); });
      ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (n) { pad.addEventListener(n, function (e) { if (e.pointerId === stickId) stickUp(); }); });
      var KEYS = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
      function keyDown(e) { if (!KEYS[e.code]) return; keys[e.code] = true; e.preventDefault(); }
      function keyUp(e) { delete keys[e.code]; }
      window.addEventListener("keydown", keyDown); window.addEventListener("keyup", keyUp);

      // ---- the camera: a drag turns it round the figure, a pinch or the wheel brings it closer -------------------------------
      var dom = renderer.domElement, ptrs = {}, drag = null, pinch = null;
      function spread() { var k = Object.keys(ptrs); return k.length < 2 ? 0 : Math.hypot(ptrs[k[0]].x - ptrs[k[1]].x, ptrs[k[0]].y - ptrs[k[1]].y); }
      dom.addEventListener("pointerdown", function (e) {
        ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
        if (Object.keys(ptrs).length === 1) drag = { x: e.clientX, y: e.clientY }; else { drag = null; pinch = { d: spread(), z: zoom }; }
      });
      dom.addEventListener("pointermove", function (e) {
        if (!ptrs[e.pointerId]) return; ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
        if (pinch) { var d = spread(); if (pinch.d > 0 && d > 0) zoom = clamp(pinch.z * pinch.d / d, 0.45, 1.6); return; }
        if (!drag) return;
        camYaw -= (e.clientX - drag.x) * 0.006; camPitch = clamp(camPitch + (e.clientY - drag.y) * 0.004, -0.35, 0.75);
        drag.x = e.clientX; drag.y = e.clientY;
      });
      ["pointerup", "pointercancel"].forEach(function (n) { dom.addEventListener(n, function (e) {
        delete ptrs[e.pointerId]; var left = Object.keys(ptrs); if (left.length < 2) pinch = null;
        drag = left.length === 1 ? { x: ptrs[left[0]].x, y: ptrs[left[0]].y } : null;
      }); });
      dom.addEventListener("wheel", function (e) { e.preventDefault(); zoom = clamp(zoom * Math.exp(e.deltaY * 0.0015), 0.45, 1.6); }, { passive: false });

      // ---- the walk -------------------------------------------------------------------------------------------------------
      // Up on the stick is away from the camera. The camera eases round behind the figure while it walks, unless the player
      // has just turned it, so walking straight on feels like walking forward and a sideways push curves the walk.
      var lastDrag = -1e9;
      dom.addEventListener("pointermove", function () { if (drag) lastDrag = performance.now(); });
      function wantWalk() {
        var x = stick.x, z = stick.z; Object.keys(keys).forEach(function (k) { x += KEYS[k][0]; z += KEYS[k][1]; });
        var m = Math.hypot(x, z); if (!(m >= 0.15)) return null; if (m > 1) { x /= m; z /= m; m = 1; }
        var fx = -Math.sin(camYaw), fz = -Math.cos(camYaw); // the way the camera looks, on the floor
        return { x: -z * fx - x * fz, z: -z * fz + x * fx, m: m };
      }
      function turnTo(a, b, k) { var d = Math.atan2(Math.sin(b - a), Math.cos(b - a)); return a + d * Math.min(1, k); }
      function step(dt) {
        var w = wantWalk(), moving = false;
        if (w) {
          var sp = WALK * w.m, nx = fig.x + w.x / w.m * sp * dt, nz = fig.z + w.z / w.m * sp * dt, h = hold(nx, nz);
          var moved = Math.hypot(h.x - fig.x, h.z - fig.z);
          if (h.bumped) S.bumps++;
          fig.x = h.x; fig.z = h.z; S.moved += moved;
          fig.speed = moved / Math.max(dt, 1e-3); moving = fig.speed > 0.15 * PH;
          fig.yaw = turnTo(fig.yaw, Math.atan2(w.x, w.z), dt * 10);
          if (performance.now() - lastDrag > 900 && w.z * -Math.cos(camYaw) + w.x * -Math.sin(camYaw) > 0.5 * w.m) camYaw = turnTo(camYaw, fig.yaw + Math.PI, dt * 1.4 * w.m);
        } else fig.speed = 0;
        if (moving) fig.clk += dt * clamp(fig.speed / WALK, 0.5, 1);
        var breath = 0.5 + 0.5 * Math.sin(performance.now() / 1000 * 2 * Math.PI / (K.BREATH.inS + K.BREATH.outS));
        av.position.set(fig.x, 0, fig.z); av.rotation.y = fig.yaw;
        K.poseAvatar(av, fig.clk, moving, dt, breath, Math.max(0.3, fig.speed / K.STEPS_PER_S), false);
        if (K.loosenAvatar) K.loosenAvatar(av, 0, breath);
        // The camera sits behind and above the figure. It is held inside the walls, so a turn near the rock pulls it in
        // rather than showing the room from outside.
        var back = CAM.back * zoom, cx = fig.x + Math.sin(camYaw) * back * Math.cos(camPitch), cz = fig.z + Math.cos(camYaw) * back * Math.cos(camPitch);
        var dx = cx - CX, dz = cz - CZ, q = (dx * dx) / Math.pow(RX + 0.3 * PH, 2) + (dz * dz) / Math.pow(RZ + 0.3 * PH, 2);
        if (q > 1) { cx = CX + dx / Math.sqrt(q); cz = CZ + dz / Math.sqrt(q); }
        camPos.set(cx, CAM.up + Math.sin(camPitch) * back, cz); camAim.set(fig.x, CAM.aim, fig.z);
        camera.position.lerp(camPos, Math.min(1, dt * 8)); camera.lookAt(camAim);
        S.x = fig.x / PH; S.z = fig.z / PH; S.yaw = fig.yaw; S.camYaw = camYaw; S.walking = moving;
      }

      function size() {
        var w = wrap.clientWidth || window.innerWidth, h = wrap.clientHeight || window.innerHeight;
        renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < h ? 68 : 55; camera.updateProjectionMatrix();
      }
      window.addEventListener("resize", size); size();
      step(0); camera.position.copy(camPos);
      var last = performance.now(), alive = true;
      function frame() {
        if (!alive) return;
        var now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
        step(dt); renderer.render(scene, camera); requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      leave.addEventListener("click", function () {
        alive = false; window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp); window.removeEventListener("resize", size);
        renderer.dispose(); wrap.remove(); S.closed = true;
      });
      S.ready = true; S.ph = PH;
      // for the page test: hold the stick at x, z (each -1 to 1) for a while
      S.hold = function (x, z) { stick.x = x; stick.z = z; };
      S.turn = function (a) { camYaw += a; lastDrag = performance.now(); };
    }
    // Leaving before the room is drawn just closes it.
    leave.addEventListener("click", function () { if (!S.ready) { wrap.remove(); S.closed = true; } });
    return S;
  }

  // The way in, on the cave's first page, under the WAVE room's button.
  function addButton() {
    var home = document.querySelector("[data-cave-home] .oagc-home"); if (!home || home.querySelector("[data-walk-open]")) return;
    home.appendChild(el("p", { text: "Or walk the new test room, built from a picture, to try free walking." }));
    home.appendChild(el("button", { class: "alt", "data-walk-open": "", text: "Walk the test room", onclick: function () { open("wave-room"); } }));
  }
  CAVE.walkRoom = open;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addButton); else addButton();
  if (/[#&]walk-room\b/.test(location.hash)) open("wave-room");
})();
