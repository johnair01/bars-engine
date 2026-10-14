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
  // The jump (Wendell, 14 October 2026: "I'm curious about adding a jump feature", then "We want them to be able to jump on
  // objects that are in the room"): 0.85 of a player height at the top, about two thirds of a second in the air, so the
  // seat and the lower boulders can be reached and the two tall ones cannot. The stick still steers in the air, and a press
  // just before landing still counts, so a jump never feels swallowed.
  var JUMP_H = 0.85 * PH, JUMP_T = 0.66, GRAV = 8 * JUMP_H / (JUMP_T * JUMP_T), JUMP_V = 4 * JUMP_H / JUMP_T, JUMP_GRACE = 0.12;
  var STEP = 0.2 * PH;      // a rise the figure walks up without jumping (the curve of a boulder's top)
  // A ledge caught in the air: a top this far above the feet at the top of a jump is pulled up onto, the way a climber
  // hauls up over an edge, so the two tall boulders (1.1) can be reached from a 0.85 jump.
  var LEDGE = 0.4 * PH;
  // The jump's three beats (Wendell, 14 October 2026: "something that looks like a character is mechanically gearing up for
  // a jump, jumps and then collects themselves"): a crouch with the arms swung back, the push off with the arms thrown up,
  // and a landing that sinks into the knees and stands back up.
  var WINDUP = 0.14, RECOVER = 0.42;
  // cave.js's figure, in its own design units (HIP_Y, THIGH and SHIN there): bending the knees drops the hips by this much.
  var HIP_Y = 1.15, LEG = 0.52 + 0.5;

  var CSS =
    ".oagw{position:fixed;inset:0;z-index:910;background:#120e10;overflow:hidden;touch-action:none}" +
    ".oagw canvas{display:block;width:100%;height:100%}" +
    ".oagw .oagw-top{position:absolute;top:calc(10px + env(safe-area-inset-top));left:10px;right:10px;display:flex;gap:.5rem;align-items:flex-start;z-index:5;pointer-events:none}" +
    ".oagw .oagw-top button{pointer-events:auto}" +
    ".oagw .oagw-hint{flex:1;margin:0;padding:.45rem .6rem;background:rgba(12,12,28,.72);border-radius:10px;color:#f4f4fa;font:14px/1.3 -apple-system,Segoe UI,Roboto,sans-serif}" +
    ".oagw .oagw-jump{position:absolute;right:calc(18px + env(safe-area-inset-right));bottom:calc(30px + env(safe-area-inset-bottom));z-index:5;width:92px;height:92px;border-radius:50%;background:rgba(20,20,40,.55);border:2px solid rgba(255,241,176,.6);color:#fff1d0;font:600 16px -apple-system,Segoe UI,Roboto,sans-serif;touch-action:none;padding:0;min-height:0}" +
    ".oagw .oagw-jump.down{background:rgba(255,241,176,.35)}" +
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
    var hint = el("p", { class: "oagw-hint", "data-walk-hint": "", text: "Walk with the circle at the bottom left (or the arrow keys). Jump with the button at the bottom right (or the space bar). Drag to turn the camera; pinch to come closer." });
    var leave = el("button", { class: "alt", "data-walk-leave": "", text: "Leave" });
    wrap.appendChild(el("div", { class: "oagw-top" }, [leave, hint]));
    wrap.appendChild(msg);
    wrap.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    document.body.appendChild(wrap);
    var S = window.__oagWalkRoom = { name: name, ready: false, error: null, x: 0, z: 0, yaw: 0, camYaw: 0, moved: 0, bumps: 0, jumps: 0, landings: 0, top: 0, stoodOn: 0, pulls: 0 };

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
      // plinth and the lantern unless it is above them. Every bound comes from the GLB itself, so a rebuilt room needs no
      // numbers here. The seat and the boulders can be stood on: their own surfaces are the ground there. The lantern
      // stands on its plinth, so the two are one block that cannot be stood on.
      var box = new THREE.Box3(), floorBox = box.setFromObject(parts.floor || room).clone();
      var RX = (floorBox.max.x - floorBox.min.x) / 2 - 0.55 * PH, RZ = (floorBox.max.z - floorBox.min.z) / 2 - 0.55 * PH;
      var CX = (floorBox.max.x + floorBox.min.x) / 2, CZ = (floorBox.max.z + floorBox.min.z) / 2;
      var blocks = [], stands = [];
      Object.keys(parts).forEach(function (n) { // three.js drops the dot from a name: boulder.1 is boulder1
        if (!/^(seat|plinth|lantern|boulder\.?\d+)$/.test(n)) return;
        box.setFromObject(parts[n]);
        var hx = (box.max.x - box.min.x) / 2, hz = (box.max.z - box.min.z) / 2, can = !/plinth|lantern/.test(n);
        blocks.push({ name: n, x: (box.max.x + box.min.x) / 2, z: (box.max.z + box.min.z) / 2, rx: hx + BODY_R, rz: hz + BODY_R, top: can ? box.max.y : Infinity, h: box.max.y, mesh: can ? parts[n] : null });
        if (can) stands.push(parts[n]);
      });
      // The ground under a point: the highest surface of a thing that can be stood on, found by a ray cast down from a step
      // above the feet, so a top higher than that is a wall to walk into, not a floor to snap onto. The floor is 0.
      var down = new THREE.Raycaster(), DOWN = new THREE.Vector3(0, -1, 0), from = new THREE.Vector3();
      function groundAt(x, z, y, reach) {
        reach = reach || STEP; from.set(x, y + reach, z); down.set(from, DOWN); down.far = y + reach + 0.01;
        var hit = down.intersectObjects(stands, true)[0];
        return hit ? Math.max(0, hit.point.y) : 0;
      }
      // A thing's own height at a point (0 off its edge), from a ray cast down from above its top.
      var high = new THREE.Raycaster();
      function surface(b, x, z) {
        from.set(x, b.top + PH, z); high.set(from, DOWN); high.far = b.top + PH + 0.01;
        var hit = high.intersectObject(b.mesh, true)[0];
        return hit ? hit.point.y : 0;
      }
      S.bounds = { cx: CX, cz: CZ, rx: RX, rz: RZ, blocks: blocks };
      // Inside the oval, then pushed out of each block (an oval of its own, its footprint plus the figure's width).
      function hold(x, z, y, reach) {
        var bumped = false, dx = x - CX, dz = z - CZ, q = (dx * dx) / (RX * RX) + (dz * dz) / (RZ * RZ);
        if (q > 1) { var k = 1 / Math.sqrt(q); x = CX + dx * k; z = CZ + dz * k; bumped = true; }
        blocks.forEach(function (b) {
          var ex = (x - b.x) / b.rx, ez = (z - b.z) / b.rz, d = Math.hypot(ex, ez);
          if (d >= 1) return;
          // A wall only where the thing rises above what the feet can take: its height under the figure, and a body's
          // width further in, against a step (walking) or a ledge (near the top of a jump). Lower than that, it is ground.
          if (b.mesh) {
            var tx = b.x - x, tz = b.z - z, tl = Math.hypot(tx, tz) || 1;
            var hgt = Math.max(surface(b, x, z), surface(b, x + tx / tl * BODY_R, z + tz / tl * BODY_R));
            if (hgt <= y + (reach || STEP)) return;
          }
          if (d < 1) { if (d < 1e-6) { ex = 0; ez = 1; d = 1; } x = b.x + ex / d * b.rx; z = b.z + ez / d * b.rz; bumped = true; }
        });
        return { x: x, z: z, bumped: bumped };
      }

      // The figure, where room.py stood it: a little behind the seat, facing the door (the door is at -z).
      var av = K.buildAvatar(THREE, "self"); scene.add(av);
      var start = parts.player ? new THREE.Vector3().setFromMatrixPosition(parts.player.matrixWorld) : new THREE.Vector3(0, 0, 2.6 * PH);
      var fig = { x: start.x, z: start.z, yaw: Math.PI, clk: 0, speed: 0, y: 0, vy: 0, air: false, want: 0, wind: -1, rec: 0, hard: 0, pull: 0 };
      // The pose's dials, eased toward their targets each frame so one beat flows into the next: crouch (knees bent, hips
      // down), tuck (knees drawn up in the air), reach (legs out for the landing), arms (-1 swung back, 1 thrown up), spread
      // (arms out to the sides), lean (the chest over the knees) and w (how much of the walk the jump takes over).
      var P = { crouch: 0, tuck: 0, reach: 0, arms: 0, spread: 0, lean: 0, w: 0 };
      var p0 = hold(fig.x, fig.z, 0); fig.x = p0.x; fig.z = p0.z;
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
      function keyDown(e) {
        if (e.code === "Space") { e.preventDefault(); if (!e.repeat) jump(); return; }
        if (!KEYS[e.code]) return; keys[e.code] = true; e.preventDefault();
      }
      // The jump button sits under the right thumb, across from the stick, so walking and jumping take one thumb each.
      var jumpBtn = el("button", { class: "oagw-jump", "data-walk-jump": "", "aria-label": "Jump", text: "Jump" });
      wrap.appendChild(jumpBtn);
      jumpBtn.addEventListener("pointerdown", function (e) { e.preventDefault(); jumpBtn.classList.add("down"); jump(); });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (n) { jumpBtn.addEventListener(n, function () { jumpBtn.classList.remove("down"); }); });
      function jump() { fig.want = JUMP_GRACE; } // kept for a moment of the room's own time, so a slow frame never drops it
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
      // How far above the feet a top still counts as ground: a step, or a ledge near the top of a jump and while hauling up.
      function reachNow() { return fig.air && fig.vy < 0.35 * JUMP_V || fig.pull && fig.rec > 0 ? LEDGE : STEP; }
      function turnTo(a, b, k) { var d = Math.atan2(Math.sin(b - a), Math.cos(b - a)); return a + d * Math.min(1, k); }
      // The jump's pose, laid over the walk. Each beat sets targets for the dials; the dials ease toward them.
      function jumpPose(dt) {
        var J = av.userData.J; if (!J) return;
        var T = { crouch: 0, tuck: 0, reach: 0, arms: 0, spread: 0, lean: 0, w: 0 }, fast = 22;
        if (fig.wind >= 0) {                      // gearing up: sink, arms back, chest forward
          var k = fig.wind / WINDUP; T.crouch = 0.55 + 0.45 * k; T.arms = -1; T.lean = 0.7; T.w = 1; fast = 40;
        } else if (fig.air) {
          var up = fig.vy / JUMP_V;              // 1 at the push off, 0 at the top, below 0 coming down
          T.w = 1; T.arms = up > 0.2 ? 1 : 0.45 + 0.5 * up; T.lean = 0.15;
          T.tuck = up > 0.6 ? 0.2 : clamp(1 - Math.abs(up) * 1.4, 0.25, 1); // knees draw up toward the top of the arc
          if (up < -0.2) { T.reach = clamp(-up, 0, 1); T.spread = 0.8; T.tuck = 0.2; } // coming down: legs out, arms out for balance
          fast = up > 0.6 ? 45 : 16;
        } else if (fig.rec > 0) {                // collecting themselves: sink into the knees, then stand back up
          var r = fig.rec / RECOVER, sink = Math.sin(Math.min(1, (1 - r) * 3.2) * Math.PI * 0.5) * r * 1.6;
          T.w = Math.min(1, r * 2.5); T.crouch = clamp(sink * Math.min(1, fig.hard), 0, 1); T.arms = -0.15 - 0.35 * T.crouch; T.spread = 0.5 * r;
          T.lean = 0.6 * T.crouch;
          if (fig.pull) { T.tuck = r; T.arms = 0.3 * r; } // a pull-up: knees come up over the edge
          fast = 24;
        }
        Object.keys(P).forEach(function (n) { P[n] += (T[n] - P[n]) * Math.min(1, dt * fast); });
        if (P.w < 0.01) return;
        function mix(o, axis, v) { o.rotation[axis] += (v - o.rotation[axis]) * P.w; }
        // A crouch keeps the feet planted: the thigh swings forward by a, the shin back by a, the foot stays flat, and the
        // hips drop by the legs' length times (1 - cos a). A tuck draws the knees up without dropping the hips.
        var a = 0.95 * P.crouch, t = 1.2 * P.tuck, rch = 0.45 * P.reach;
        ["L", "R"].forEach(function (n, i) {
          mix(J["hip" + n], "x", -a - t - rch + (i ? 0.08 : -0.08) * P.reach);
          mix(J["knee" + n], "x", 2 * a + 1.6 * t + 0.25 * P.reach);
          mix(J["ankle" + n], "x", -a - 0.3 * t + 0.2 * P.reach);
          // arms: back is positive, up is a big negative swing; spread lifts them out to the sides
          mix(J["shoulder" + n], "x", P.arms < 0 ? -P.arms * 0.9 : -P.arms * 2.6);
          mix(J["shoulder" + n], "z", (i ? -1 : 1) * (0.1 + 0.9 * P.spread));
          mix(J["elbow" + n], "x", -0.25 - 0.4 * Math.max(0, P.arms));
        });
        mix(J.spine, "x", 0.08 + 0.45 * P.lean);
        mix(J.neck, "x", -0.25 * P.lean);
        J.hips.position.y += ((HIP_Y - LEG * (1 - Math.cos(a))) - J.hips.position.y) * P.w;
      }
      function step(dt) {
        var w = wantWalk(), moving = false;
        if (w) {
          var sp = WALK * w.m * (fig.wind >= 0 ? 0.4 : 1) * (1 - 0.5 * clamp(fig.rec / RECOVER, 0, 1) * Math.min(1, fig.hard)), nx = fig.x + w.x / w.m * sp * dt, nz = fig.z + w.z / w.m * sp * dt, h = hold(nx, nz, fig.y, reachNow());
          var moved = Math.hypot(h.x - fig.x, h.z - fig.z);
          if (h.bumped) S.bumps++;
          fig.x = h.x; fig.z = h.z; S.moved += moved;
          fig.speed = moved / Math.max(dt, 1e-3); moving = fig.speed > 0.15 * PH;
          fig.yaw = turnTo(fig.yaw, Math.atan2(w.x, w.z), dt * 10);
          if (performance.now() - lastDrag > 900 && w.z * -Math.cos(camYaw) + w.x * -Math.sin(camYaw) > 0.5 * w.m) camYaw = turnTo(camYaw, fig.yaw + Math.PI, dt * 1.4 * w.m);
        } else fig.speed = 0;
        // Up and down. A press is kept for a moment, so one made just before landing jumps on landing. The press starts the
        // crouch; the figure leaves the ground at the end of it.
        if (fig.want > 0 && !fig.air && fig.wind < 0) { fig.wind = 0; fig.want = 0; }
        else fig.want = Math.max(0, fig.want - dt);
        if (fig.wind >= 0) {
          fig.wind += dt;
          if (fig.wind >= WINDUP) { fig.wind = -1; fig.vy = JUMP_V; fig.air = true; fig.pull = 0; S.jumps++; }
        }
        var g = groundAt(fig.x, fig.z, fig.y, reachNow());
        if (!fig.air) {
          if (g < fig.y - 0.02 * PH) { fig.air = true; fig.vy = 0; fig.wind = -1; } // walked off an edge: fall
          else fig.y += (g - fig.y) * Math.min(1, dt * 16);                        // up or down a rise, or the last of a pull-up
        }
        if (fig.air) {
          var was = fig.y, reach = reachNow();
          fig.y += fig.vy * dt - GRAV * dt * dt / 2; fig.vy -= GRAV * dt; // exact for a steady pull, so a slow phone jumps as high
          g = groundAt(fig.x, fig.z, Math.max(fig.y, was), reach); // from where the feet were, so a fast fall cannot pass through a top
          if (fig.vy <= 0.35 * JUMP_V && fig.y <= g + 0.001 || fig.vy <= 0 && fig.y <= g) {
            fig.pull = g - was > 0.1 * PH ? 1 : 0; // the top is above where the feet were: a ledge caught, haul up onto it
            fig.hard = clamp(-fig.vy / JUMP_V, 0.3, 1.2) + fig.pull * 0.5;
            if (!fig.pull) fig.y = g;
            fig.air = false; fig.vy = 0; fig.rec = RECOVER; S.landings++; if (g > 0.05 * PH) S.stoodOn++; if (fig.pull) S.pulls++;
          }
          S.top = Math.max(S.top, fig.y / PH);
        }
        fig.rec = Math.max(0, fig.rec - dt);
        if (fig.air || fig.wind >= 0) moving = false;
        if (moving) fig.clk += dt * clamp(fig.speed / WALK, 0.5, 1);
        var breath = 0.5 + 0.5 * Math.sin(performance.now() / 1000 * 2 * Math.PI / (K.BREATH.inS + K.BREATH.outS));
        av.position.set(fig.x, fig.y, fig.z); av.rotation.y = fig.yaw;
        K.poseAvatar(av, fig.clk, moving, dt, breath, Math.max(0.3, fig.speed / K.STEPS_PER_S), false);
        jumpPose(dt);
        if (K.loosenAvatar) K.loosenAvatar(av, 0, breath);
        // The camera sits behind and above the figure. It is held inside the walls, so a turn near the rock pulls it in
        // rather than showing the room from outside.
        var back = CAM.back * zoom, cx = fig.x + Math.sin(camYaw) * back * Math.cos(camPitch), cz = fig.z + Math.cos(camYaw) * back * Math.cos(camPitch);
        var dx = cx - CX, dz = cz - CZ, q = (dx * dx) / Math.pow(RX + 0.3 * PH, 2) + (dz * dz) / Math.pow(RZ + 0.3 * PH, 2);
        if (q > 1) { cx = CX + dx / Math.sqrt(q); cz = CZ + dz / Math.sqrt(q); }
        camPos.set(cx, CAM.up + Math.sin(camPitch) * back + fig.y * 0.3, cz); camAim.set(fig.x, CAM.aim + fig.y * 0.5, fig.z);
        camera.position.lerp(camPos, Math.min(1, dt * 8)); camera.lookAt(camAim);
        S.x = fig.x / PH; S.z = fig.z / PH; S.yaw = fig.yaw; S.camYaw = camYaw; S.walking = moving; S.y = fig.y / PH; S.air = fig.air;
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
        if (!S.paused) step(dt); renderer.render(scene, camera); requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      leave.addEventListener("click", function () {
        alive = false; window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp); window.removeEventListener("resize", size);
        renderer.dispose(); wrap.remove(); S.closed = true;
      });
      S.ready = true; S.ph = PH;
      // for the page test: hold the stick at x, z (each -1 to 1) for a while
      S.hold = function (x, z) { stick.x = x; stick.z = z; };
      S.jump = jump; S.pose = P;
      // for the page test: stop the clock and step it by hand, so a pose can be caught at an exact moment
      S.advance = function (secs, n) { S.paused = true; for (var i = 0; i < (n || 1); i++) step(secs); renderer.render(scene, camera); };
      S.place = function (x, z) { fig.x = x * PH; fig.z = z * PH; fig.y = 0; fig.air = false; };
      S.blocks = blocks.map(function (b) { return { name: b.name, x: b.x / PH, z: b.z / PH, rx: b.rx / PH, rz: b.rz / PH, h: b.h / PH }; });
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
