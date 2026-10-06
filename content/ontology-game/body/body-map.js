// The body map for the Ontology Alchemy Game.
//
// Wendell, 6 October 2026: "a simulation of a person ... that players can point to where on
// their body a charge is showing up. This way they can track somatically where their charge
// lives on their body and how it changes over time."
//
// The figure is made in Blender by body/build_figure.py and loaded from figure.glb. Players
// tap the figure to name where a charge is; every body scan they confirm is saved on this
// device (localStorage, the same as the rest of the game's site storage), and "Where it has
// lived" shows those marks on the figure over time. Nothing here talks to a server.
//
// Public surface, used by game.jsx and the standalone page body.html:
//   OAGBody.pick()     opens the figure; resolves to { label } or null if closed
//   OAGBody.record(s)  saves one confirmed scan { location, texture, channel, where }
//   OAGBody.history()  opens the marks over time
//   OAGBody.marks()    the saved marks, oldest first
(function () {
  "use strict";
  if (window.OAGBody) return;

  var KEY = "oag:body:marks";
  var THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  var GLB_URL = (window.__oagBodyBase || "/ontology-game/") + "figure.glb";
  // A page load counts as one sitting, so marks from the same sitting are joined by a line
  // on the figure: that is how a charge that moves (chest, then jaw) shows as movement.
  // (A choice. The game has no session id of its own on the site.)
  var SITTING = Date.now().toString(36);

  // Colours per texture. A design choice, picked to stay readable on the game's dark blue
  // and on the clay figure; they carry no element meaning.
  var TEXTURES = {
    constriction: { word: "tightness", color: "#ff7a59" },
    tension: { word: "tension", color: "#f2c14e" },
    numbness: { word: "numbness", color: "#9fb4cc" },
    strength: { word: "strength", color: "#4fd1a1" },
    other: { word: "something else", color: "#c39bff" },
  };
  var texInfo = function (t) { return TEXTURES[t] || { word: t || "a charge", color: "#e0e0e0" }; };

  // ---- storage ---------------------------------------------------------------------------
  function readMarks() {
    try {
      var raw = window.localStorage.getItem(KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }
  function writeMarks(list) {
    try { window.localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
  }

  // The last place picked on the figure. A scan confirmed with that same label keeps the
  // exact point tapped; a typed place that matches a figure label ("my throat") is drawn at
  // that label's point; any other typed place is kept and listed in words only.
  var lastPick = null;

  function record(scan) {
    if (!scan || !scan.location) return;
    var label = String(scan.location).trim();
    if (!label) return;
    var mark = {
      t: Date.now(),
      sitting: SITTING,
      label: label,
      texture: scan.texture || null,
      channel: scan.channel || null,
      where: scan.where || null,
    };
    if (lastPick && lastPick.label.toLowerCase() === label.toLowerCase()) {
      mark.point = lastPick.point;
      mark.anchor = lastPick.anchor;
    }
    var list = readMarks();
    list.push(mark);
    writeMarks(list);
  }

  // ---- loading three.js and the figure ---------------------------------------------------
  var threeReady = null;
  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (threeReady) return threeReady;
    threeReady = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = THREE_URL;
      s.onload = function () { window.THREE ? resolve(window.THREE) : reject(new Error("three.js did not load")); };
      s.onerror = function () { threeReady = null; reject(new Error("three.js did not load")); };
      document.head.appendChild(s);
    });
    return threeReady;
  }

  // A minimal reader for the one .glb this page uses: one triangle mesh (POSITION, NORMAL,
  // indices) and the anchor empties with their "label" extras. It saves loading three.js's
  // full GLTFLoader, which cdnjs does not carry for this version.
  var figureReady = null;
  function loadFigure() {
    if (figureReady) return figureReady;
    figureReady = fetch(GLB_URL).then(function (r) {
      if (!r.ok) throw new Error("figure.glb " + r.status);
      return r.arrayBuffer();
    }).then(parseGLB).catch(function (e) { figureReady = null; throw e; });
    return figureReady;
  }
  function parseGLB(buf) {
    var dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x46546c67) throw new Error("not a glb");
    var jsonLen = dv.getUint32(12, true);
    var json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jsonLen)));
    var binStart = 20 + jsonLen + 8;
    var TYPES = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array };
    var SIZES = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
    var accessor = function (i) {
      var a = json.accessors[i];
      var v = json.bufferViews[a.bufferView];
      var T = TYPES[a.componentType];
      return new T(buf, binStart + (v.byteOffset || 0) + (a.byteOffset || 0), a.count * SIZES[a.type]);
    };
    var prim = json.meshes[0].primitives[0];
    var anchors = [];
    (json.nodes || []).forEach(function (n) {
      if (n.extras && n.extras.label && n.translation) {
        anchors.push({ name: n.name.replace(/^anchor\./, ""), label: n.extras.label, region: n.extras.region || null, pos: n.translation });
      }
    });
    return {
      position: accessor(prim.attributes.POSITION),
      normal: accessor(prim.attributes.NORMAL),
      index: accessor(prim.indices),
      anchors: anchors,
    };
  }
  function nearestAnchor(anchors, p) {
    var best = null, bestD = Infinity;
    anchors.forEach(function (a) {
      var dx = a.pos[0] - p[0], dy = a.pos[1] - p[1], dz = a.pos[2] - p[2];
      var d = dx * dx + dy * dy + dz * dz;
      if (d < bestD) { bestD = d; best = a; }
    });
    return best;
  }
  function anchorByLabel(anchors, label) {
    var l = String(label || "").trim().toLowerCase();
    for (var i = 0; i < anchors.length; i++) if (anchors[i].label.toLowerCase() === l) return anchors[i];
    return null;
  }

  // ---- styles ----------------------------------------------------------------------------
  var CSS = "" +
    ".oagb{position:fixed;inset:0;z-index:1000;display:flex;flex-direction:column;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);color:#e0e0e0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}" +
    ".oagb-head{display:flex;align-items:center;gap:.5rem;padding:.75rem 1rem;border-bottom:1px solid rgba(255,255,255,.1)}" +
    ".oagb-head h2{flex:1;font-size:1.05rem;margin:0;color:#fff}" +
    ".oagb button{width:auto;margin:0;flex:none;min-width:0;transition:none;line-height:1.2}" +
    ".oagb .oagb-x{background:none;border:1px solid rgba(255,255,255,.25);color:#e0e0e0;border-radius:8px;padding:.35rem .7rem;font-size:.9rem;cursor:pointer}" +
    ".oagb-body{flex:1;display:flex;min-height:0}" +
    ".oagb-stage{position:relative;flex:1;min-width:0;touch-action:none;cursor:pointer}" +
    ".oagb-stage canvas{display:block;width:100%;height:100%}" +
    ".oagb-turn{position:absolute;left:.75rem;bottom:.75rem;display:flex;gap:.4rem}" +
    ".oagb .oagb-turn button{background:rgba(26,26,46,.7);border:1px solid rgba(255,255,255,.25);color:#e0e0e0;border-radius:8px;padding:.45rem .8rem;font-size:.85rem;cursor:pointer}" +
    ".oagb-hint{position:absolute;top:.6rem;left:0;right:0;text-align:center;font-size:.85rem;opacity:.8;pointer-events:none;padding:0 1rem}" +
    ".oagb-side{width:340px;max-width:42%;overflow:auto;padding:1rem;border-left:1px solid rgba(255,255,255,.1)}" +
    ".oagb-foot{padding:.75rem 1rem calc(.75rem + env(safe-area-inset-bottom));border-top:1px solid rgba(255,255,255,.1);display:flex;align-items:center;gap:.75rem;flex-wrap:wrap}" +
    ".oagb-picked{flex:1;min-width:10rem;font-size:1rem}" +
    ".oagb .oagb-use{background:#64c8ff;color:#10142a;border:none;border-radius:8px;padding:.6rem 1rem;font-weight:600;font-size:.95rem;cursor:pointer}" +
    ".oagb .oagb-use:disabled{opacity:.4;cursor:default}" +
    ".oagb-side h3{font-size:.95rem;color:#fff;margin:1rem 0 .4rem}" +
    ".oagb-side h3:first-child{margin-top:0}" +
    ".oagb-row{display:flex;justify-content:space-between;gap:.5rem;font-size:.88rem;padding:.25rem 0;border-bottom:1px solid rgba(255,255,255,.06)}" +
    ".oagb-dot{display:inline-block;width:.65rem;height:.65rem;border-radius:50%;margin-right:.25rem;vertical-align:middle}" +
    ".oagb-note{font-size:.8rem;opacity:.7;margin:.4rem 0}" +
    ".oagb-scrub{width:100%;margin:.3rem 0}" +
    ".oagb-legend{display:flex;flex-wrap:wrap;gap:.25rem .75rem;font-size:.8rem;margin:.3rem 0}" +
    ".oagb .oagb-clear{background:none;border:none;color:#ff9b8a;text-decoration:underline;font-size:.8rem;cursor:pointer;padding:0;margin-top:1rem}" +
    ".oagb-fallback{padding:2rem 1rem;text-align:center;opacity:.85}" +
    "@media (max-width:700px){.oagb-body{flex-direction:column}.oagb-stage{flex:none;height:58vh}.oagb-side{width:auto;max-width:none;border-left:none;border-top:1px solid rgba(255,255,255,.1);flex:1}}";

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "style") e.setAttribute("style", attrs[k]);
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }

  // ---- the 3D view -----------------------------------------------------------------------
  // One figure on a stage. Drag sideways to turn it, drag up and down to look higher or
  // lower when zoomed in, pinch or scroll to zoom, tap to pick a place.
  function makeView(stage, THREE, fig, onTap) {
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      return null;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    stage.appendChild(renderer.domElement);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(30, 1, 0.05, 20);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x303050, 0.65));
    var key = new THREE.DirectionalLight(0xffffff, 0.7);
    key.position.set(1.5, 2.5, 3);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x88aaff, 0.35);
    rim.position.set(-2, 1, -2.5);
    scene.add(rim);

    var group = new THREE.Group();
    scene.add(group);
    var geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(fig.position, 3));
    geom.setAttribute("normal", new THREE.BufferAttribute(fig.normal, 3));
    geom.setIndex(new THREE.BufferAttribute(fig.index, 1));
    var bodyMesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: 0xb9ada2, roughness: 0.85, metalness: 0 }));
    group.add(bodyMesh);
    var marks = new THREE.Group();
    group.add(marks);

    // The camera looks at (lookX, lookY) from straight ahead. At zoom 1 it frames the whole
    // figure; zoomed in, it can look anywhere on the figure but not off it.
    var view = { yaw: 0, zoom: 1, lookX: 0, lookY: 0.9 };
    var anim = null;
    function place() {
      var w = stage.clientWidth || 1, h = stage.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Fit the whole 1.75-unit figure at zoom 1, whatever the stage's shape.
      var fitH = 1.95 / (2 * Math.tan((camera.fov * Math.PI) / 360));
      var fitW = 0.95 / (2 * Math.tan((camera.fov * Math.PI) / 360)) / camera.aspect;
      var dist = Math.max(fitH, fitW) / view.zoom;
      var halfY = 0.9 * (1 - 1 / view.zoom), halfX = 0.42 * (1 - 1 / view.zoom);
      view.lookY = Math.min(0.9 + halfY, Math.max(0.9 - halfY, view.lookY));
      view.lookX = Math.min(halfX, Math.max(-halfX, view.lookX));
      camera.position.set(view.lookX, view.lookY, dist);
      camera.lookAt(view.lookX, view.lookY, 0);
      camera.updateProjectionMatrix();
      group.rotation.y = view.yaw;
      renderer.render(scene, camera);
    }
    // Glide to a zoom and a point on the figure (in the figure's own coordinates, so it
    // follows the figure's current turn).
    function focus(p, zoom) {
      group.rotation.y = view.yaw;
      group.updateMatrixWorld();
      var to = p ? group.localToWorld(new THREE.Vector3(p[0], p[1], p[2])) : { x: 0, y: 0.9 };
      var from = { zoom: view.zoom, x: view.lookX, y: view.lookY }, t0 = performance.now(), ms = window.__oagBodyInstant ? 0 : 350;
      if (anim) cancelAnimationFrame(anim);
      var step = function (now) {
        var k = ms ? Math.min(1, (now - t0) / ms) : 1;
        var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        view.zoom = from.zoom + (zoom - from.zoom) * e;
        view.lookX = from.x + (to.x - from.x) * e;
        view.lookY = from.y + (to.y - from.y) * e;
        place();
        anim = k < 1 ? requestAnimationFrame(step) : null;
      };
      step(performance.now());
    }

    var pointers = {}, start = null, moved = false, pinch0 = null;
    var el2 = renderer.domElement;
    el2.addEventListener("pointerdown", function (e) {
      el2.setPointerCapture && el2.setPointerCapture(e.pointerId);
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pointers);
      if (ids.length === 1) { start = { x: e.clientX, y: e.clientY, yaw: view.yaw, lookY: view.lookY }; moved = false; if (anim) { cancelAnimationFrame(anim); anim = null; } }
      if (ids.length === 2) {
        var a = pointers[ids[0]], b = pointers[ids[1]];
        pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom: view.zoom };
        moved = true;
      }
    });
    el2.addEventListener("pointermove", function (e) {
      if (!pointers[e.pointerId]) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pointers);
      if (ids.length === 2 && pinch0) {
        var a = pointers[ids[0]], b = pointers[ids[1]];
        view.zoom = Math.min(4, Math.max(1, pinch0.zoom * Math.hypot(a.x - b.x, a.y - b.y) / pinch0.d));
        place();
        return;
      }
      if (!start) return;
      var dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      if (moved) {
        view.yaw = start.yaw + dx * 0.012;
        view.lookY = start.lookY + dy * 0.004 / view.zoom;
        place();
      }
    });
    var up = function (e) {
      var wasTap = start && !moved && Object.keys(pointers).length === 1;
      delete pointers[e.pointerId];
      if (Object.keys(pointers).length < 2) pinch0 = null;
      if (Object.keys(pointers).length === 0) start = null;
      if (wasTap && e.type === "pointerup") tap(e.clientX, e.clientY);
    };
    el2.addEventListener("pointerup", up);
    el2.addEventListener("pointercancel", up);
    el2.addEventListener("wheel", function (e) {
      e.preventDefault();
      view.zoom = Math.min(4, Math.max(1, view.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
      place();
    }, { passive: false });

    var ray = new THREE.Raycaster();
    function tap(cx, cy) {
      if (!onTap) return;
      var r = el2.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), camera);
      var hit = ray.intersectObject(bodyMesh)[0];
      if (!hit) return;
      var local = group.worldToLocal(hit.point.clone());
      onTap([local.x, local.y, local.z]);
    }

    function dot(p, color, size, opacity, ring) {
      var m = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 12),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: opacity < 1, opacity: opacity }));
      m.position.set(p[0], p[1], p[2]);
      marks.add(m);
      if (ring) {
        var halo = new THREE.Mesh(new THREE.SphereGeometry(size * 1.9, 16, 12),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0.25, depthWrite: false }));
        halo.position.copy(m.position);
        marks.add(halo);
      }
    }
    function path(points, color) {
      if (points.length < 2) return;
      var g = new THREE.BufferGeometry().setFromPoints(points.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); }));
      // Drawn through the body so a move from front to back still shows.
      marks.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0.6, depthTest: false })));
    }
    function clearMarks() {
      while (marks.children.length) {
        var c = marks.children.pop();
        c.geometry && c.geometry.dispose();
        c.material && c.material.dispose();
      }
    }

    var onResize = function () { place(); };
    window.addEventListener("resize", onResize);
    place();
    return {
      dot: dot, path: path, clearMarks: clearMarks, render: place, focus: focus,
      zoom: function () { return view.zoom; },
      turn: function (yaw) { view.yaw = yaw; view.lookX = -view.lookX; place(); },
      // For the browser tests: where on screen a figure point is right now.
      screenOf: function (p) {
        var v = group.localToWorld(new THREE.Vector3(p[0], p[1], p[2])).project(camera);
        var r = el2.getBoundingClientRect();
        return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
      },
      dispose: function () {
        window.removeEventListener("resize", onResize);
        clearMarks();
        geom.dispose();
        renderer.dispose();
        renderer.forceContextLoss && renderer.forceContextLoss();
      },
    };
  }

  // ---- the overlay -----------------------------------------------------------------------
  var current = null;

  function close(result) {
    if (!current) return;
    var c = current;
    current = null;
    if (c.view) c.view.dispose();
    c.root.remove();
    document.documentElement.style.overflow = c.overflow;
    window.__oagBody = null;
    if (c.resolve) c.resolve(result || null);
  }

  function shell(title, opts) {
    if (!document.getElementById("oagb-css")) document.head.appendChild(el("style", { id: "oagb-css", text: CSS }));
    if (current) close(null);
    var stage = el("div", { class: "oagb-stage" }, [el("div", { class: "oagb-hint", text: "Loading the figure…" })]);
    var side = el("div", { class: "oagb-side" });
    var foot = el("div", { class: "oagb-foot" });
    var head = el("div", { class: "oagb-head" }, [
      el("h2", { text: title }),
      opts.standalone
        ? el("a", { class: "oagb-x", href: "/ontology-game", text: "Play the game" })
        : el("button", { class: "oagb-x", type: "button", "data-body-close": "", text: "Close", onclick: function () { close(null); } }),
    ]);
    var root = el("div", { class: "oagb", role: "dialog", "aria-label": title }, [head, el("div", { class: "oagb-body" }, [stage, side]), foot]);
    document.body.appendChild(root);
    current = { root: root, stage: stage, side: side, foot: foot, overflow: document.documentElement.style.overflow };
    document.documentElement.style.overflow = "hidden";
    return current;
  }

  function turnButtons(view) {
    return el("div", { class: "oagb-turn" }, [
      el("button", { type: "button", "data-body-front": "", text: "Front", onclick: function () { view.turn(0); } }),
      el("button", { type: "button", "data-body-back": "", text: "Back", onclick: function () { view.turn(Math.PI); } }),
    ]);
  }

  function boot(c, onTap) {
    return Promise.all([loadThree(), loadFigure()]).then(function (res) {
      if (current !== c) return null;
      var THREE = res[0], fig = res[1];
      c.stage.innerHTML = "";
      var view = makeView(c.stage, THREE, fig, onTap);
      if (!view) throw new Error("no webgl");
      c.view = view;
      c.fig = fig;
      c.stage.appendChild(turnButtons(view));
      return c;
    }).catch(function () {
      if (current !== c) return null;
      c.stage.innerHTML = "";
      c.stage.appendChild(el("p", { class: "oagb-fallback", "data-body-fallback": "",
        text: "This device couldn't draw the figure. You can still type the place in the game." }));
      return null;
    });
  }

  // Pick: tap the figure, see the place named, use it.
  function pick() {
    return new Promise(function (resolve) {
      var c = shell("Where do you feel it?", {});
      c.resolve = resolve;
      var picked = null;
      var name = el("div", { class: "oagb-picked", "data-body-picked": "", text: "Tap the place on the figure." });
      var use = el("button", { class: "oagb-use", type: "button", "data-body-use": "", disabled: "", text: "Use this place",
        onclick: function () { if (picked) { lastPick = picked; close({ label: picked.label }); } } });
      c.foot.appendChild(name);
      c.foot.appendChild(use);
      c.side.appendChild(el("p", { class: "oagb-note", text: "Drag sideways to turn the figure, and up or down to move along it when zoomed in. Pinch or scroll to zoom. Left and right are the figure's own, as if it were you." }));
      var past = readMarks();
      if (past.length) c.side.appendChild(el("p", { class: "oagb-note", text: "The faint dots are places you've marked before." }));
      // A first tap names the nearest place and zooms into that part of the body (Wendell,
      // 6 October 2026: "click a section and be able to zoom in to fine tune"). Taps while
      // zoomed in move the mark; "Whole body" zooms back out.
      var region = null, hint = null, whole = null;
      boot(c, function (p) {
        var a = nearestAnchor(c.fig.anchors, p);
        if (!a) return;
        picked = { label: a.label, anchor: a.name, point: p.map(function (v) { return Math.round(v * 1000) / 1000; }) };
        name.textContent = a.label.charAt(0).toUpperCase() + a.label.slice(1);
        use.removeAttribute("disabled");
        drawPast();
        var zoomed = region !== null;
        c.view.dot(p, "#64c8ff", zoomed ? 0.009 : 0.024, 1, true);
        c.view.render();
        if (!zoomed && a.region && REGIONS[a.region]) {
          region = a.region;
          var pts = c.fig.anchors.filter(function (x) { return x.region === region; });
          var mid = [0, 1, 2].map(function (i) { return pts.reduce(function (t, x) { return t + x.pos[i]; }, 0) / pts.length; });
          c.view.focus(mid, REGIONS[region].zoom);
          hint.textContent = REGIONS[region].name + ". Tap again to fine-tune.";
          whole.hidden = false;
          c.stage.setAttribute("data-body-region", region);
        }
      }).then(function (ok) {
        if (!ok) return;
        hint = el("div", { class: "oagb-hint", "data-body-hint": "", text: "Tap where the charge is. The figure zooms in so you can fine-tune." });
        c.stage.appendChild(hint);
        whole = el("button", { type: "button", "data-body-whole": "", text: "Whole body", onclick: function () {
          region = null;
          c.stage.removeAttribute("data-body-region");
          whole.hidden = true;
          hint.textContent = "Tap where the charge is. The figure zooms in so you can fine-tune.";
          c.view.focus(null, 1);
        } });
        whole.hidden = true;
        c.stage.querySelector(".oagb-turn").appendChild(whole);
        drawPast();
        c.view.render();
        window.__oagBody = { anchors: c.fig.anchors, screenOf: c.view.screenOf, zoom: c.view.zoom };
      });
      function drawPast() {
        c.view.clearMarks();
        past.forEach(function (m) {
          var p = pointOf(m, c.fig.anchors);
          if (p) c.view.dot(p, texInfo(m.texture).color, 0.015, 0.45, false);
        });
      }
    });
  }

  // The parts a first tap zooms into, with how far. Zoom levels are choices, set so each
  // part fills most of a phone screen.
  var REGIONS = {
    head: { name: "Head and neck", zoom: 4.2 },
    chest: { name: "Chest and shoulders", zoom: 3.0 },
    belly: { name: "Belly and hips", zoom: 3.0 },
    back: { name: "Back", zoom: 2.4 },
    left_arm: { name: "Left arm", zoom: 2.2 },
    right_arm: { name: "Right arm", zoom: 2.2 },
    left_leg: { name: "Left leg", zoom: 1.8 },
    right_leg: { name: "Right leg", zoom: 1.8 },
  };

  function pointOf(m, anchors) {
    if (m.point) return m.point;
    var a = anchorByLabel(anchors, m.label);
    return a ? a.pos : null;
  }
  function day(t) {
    try { return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); } catch (e) { return ""; }
  }

  // History: every saved mark on the figure, a slider to step back through time, the places
  // ranked by how often charge has shown up there, and each sitting's path in words.
  function history(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var c = shell("Where it has lived", opts);
      c.resolve = resolve;
      var all = readMarks().sort(function (a, b) { return a.t - b.t; });
      var upto = all.length;
      var legend = el("div", { class: "oagb-legend" }, Object.keys(TEXTURES).map(function (k) {
        return el("span", null, [el("span", { class: "oagb-dot", style: "background:" + TEXTURES[k].color }), TEXTURES[k].word]);
      }));
      var when = el("div", { class: "oagb-picked", "data-body-when": "" });
      var scrub = el("input", { class: "oagb-scrub", type: "range", min: "1", max: String(Math.max(1, all.length)), value: String(Math.max(1, all.length)), "data-body-scrub": "",
        "aria-label": "Step back through your marks" });
      scrub.addEventListener("input", function () { upto = Number(scrub.value); draw(); });
      if (all.length > 1) { c.foot.appendChild(when); c.foot.appendChild(scrub); }
      else c.foot.appendChild(when);

      var lists = el("div");
      c.side.appendChild(legend);
      c.side.appendChild(lists);
      c.side.appendChild(el("p", { class: "oagb-note", text: "Saved on this device only. Only the place, the texture and the channel are kept; nothing you write in the game is." }));
      if (all.length) c.side.appendChild(el("button", { class: "oagb-clear", type: "button", "data-body-clear": "", text: "Clear these marks from this device",
        onclick: function () {
          if (window.confirm("Clear every body mark saved on this device? This can't be undone.")) {
            writeMarks([]); all = []; upto = 0; scrub.remove(); this.remove(); draw();
          }
        } }));

      function draw() {
        var shown = all.slice(0, upto);
        var last = shown[shown.length - 1];
        when.textContent = !all.length
          ? "No marks yet. Each place you confirm in the game shows up here."
          : (upto < all.length ? "Up to " : "Latest: ") + day(last.t) + ", " + last.label + " (" + texInfo(last.texture).word + ")";
        lists.innerHTML = "";
        // Where it has lived: places ranked by count, with the textures seen there.
        var by = {};
        shown.forEach(function (m) {
          var k = m.label.toLowerCase();
          (by[k] = by[k] || { label: m.label, n: 0, tex: {}, last: 0 }).n++;
          by[k].tex[m.texture] = (by[k].tex[m.texture] || 0) + 1;
          by[k].last = Math.max(by[k].last, m.t);
        });
        var places = Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.n - a.n || b.last - a.last; });
        if (places.length) {
          lists.appendChild(el("h3", { text: "Most often" }));
          places.slice(0, 8).forEach(function (p) {
            lists.appendChild(el("div", { class: "oagb-row", "data-body-place": p.label }, [
              el("span", null, Object.keys(p.tex).map(function (t) { return el("span", { class: "oagb-dot", style: "background:" + texInfo(t === "null" ? null : t).color }); }).concat([p.label])),
              el("span", { text: p.n + (p.n === 1 ? " time" : " times") }),
            ]));
          });
        }
        // How it moved: each sitting's scans in order, newest sitting first.
        var sittings = [];
        shown.forEach(function (m) {
          var s = sittings[sittings.length - 1];
          if (!s || s.id !== m.sitting) sittings.push(s = { id: m.sitting, t: m.t, marks: [] });
          s.marks.push(m);
        });
        if (sittings.length) {
          lists.appendChild(el("h3", { text: "By sitting" }));
          sittings.slice().reverse().slice(0, 12).forEach(function (s) {
            lists.appendChild(el("div", { class: "oagb-row", "data-body-sitting": "" }, [
              el("span", { text: s.marks.map(function (m) { return m.label + " (" + texInfo(m.texture).word + ")"; }).join(", then ") }),
              el("span", { style: "white-space:nowrap;opacity:.7", text: day(s.t) }),
            ]));
          });
        }
        var off = shown.filter(function (m) { return c.fig && !pointOf(m, c.fig.anchors); });
        if (off.length) lists.appendChild(el("p", { class: "oagb-note", text: "Typed places the figure can't show: " + off.map(function (m) { return m.label; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join("; ") + "." }));

        if (!c.view) return;
        c.view.clearMarks();
        // Older marks fade; the latest shown mark is ringed.
        shown.forEach(function (m, i) {
          var p = pointOf(m, c.fig.anchors);
          if (!p) return;
          var age = shown.length > 1 ? i / (shown.length - 1) : 1;
          c.view.dot(p, texInfo(m.texture).color, 0.018 + 0.008 * age, 0.5 + 0.5 * age, i === shown.length - 1);
        });
        sittings.forEach(function (s) {
          var pts = s.marks.map(function (m) { return pointOf(m, c.fig.anchors); }).filter(Boolean);
          c.view.path(pts, "#ffffff");
        });
        c.view.render();
      }
      draw();
      boot(c, null).then(function (ok) {
        if (!ok) return;
        draw();
        window.__oagBody = { anchors: c.fig.anchors, screenOf: c.view.screenOf };
      });
    });
  }

  window.OAGBody = {
    pick: pick,
    record: record,
    history: history,
    marks: readMarks,
    close: function () { close(null); },
  };
})();
