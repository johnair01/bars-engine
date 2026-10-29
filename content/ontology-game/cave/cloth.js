// The robe's skirt as cloth (J5, board position j5-skirt-cloth). Wendell, 14 October 2026, on round 4: "We're missing
// something important about how the physics of how the bottom robe is supposed to move. It's not moving like clothes
// and every fix is still too localized". Until round 4 the skirt was draped once standing and then glued to the leg
// bones. Here, every frame, the skirt below the belt is a mass-spring cloth: the belt and everything above it ride the
// skinned body, and below the belt the cloth hangs from the belt under gravity, carries the figure's own motion as
// inertia, and is pushed out by the thighs and shins. The front and back panels are joined only above the slits, so a
// slit parts when a leg strides through it and falls shut when the leg passes.
//
// One file for the game and for Blender: cave.js uses it through CaveCloth.attach (three.js), and garments.py runs
// the same code in Node over the walk (cloth_walk.mjs) for test J5 and for the pictures, so what the test and the
// pictures show is what the game shows.
//
// The solver: position-based dynamics in small fixed substeps (Macklin et al., "Small Steps in Physics Simulation",
// 2019): verlet integration, then one pass each over the stretch, bend and tether constraints and the leg capsules.
// Stretch constraints are the mesh's edges at their standing lengths; bend constraints join the far corners of each
// pair of triangles that share an edge; a tether holds each free point within its standing distance (along the
// cloth) of the nearest pinned point, so the skirt cannot stretch away from the belt however fast the figure moves.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CaveCloth = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Round 6 (Wendell on round 5: "now we need the physics of the bottom hem to pull the robes down. The cloth is defying
  // gravity in a lot of ways. Also there’s jitteriness in the belt"): the reasons and sources are in CLOTH.md.
  var DEFAULTS = {
    substepHz: 480,      // substeps a second, at least: a frame is cut into whole substeps no longer than 1/480 s
    maxSubsteps: 16,     // per call; a long frame is slowed down rather than allowed to explode
    gravity: [0, 0, -9.81],
    damping: 0.3,        // per second, of each point's whole velocity: low, so it does not slow the fall
    dragQ: 20,           // the air across the cloth's face, quadratic (1/m: 0.5 x air density x Cd over the cloth's
    dragL: 8,            // mass per m2; 20 is a light cotton's, tuned by eye and by the float measure in CLOTH.md), and
                         // linear (1/s); both on the motion across the cloth, so it slows flapping, not the fall along it
    relDamp: 0,          // per second, of the motion along the cloth relative to the body near it
    stretch: 1.0,        // stiffness per substep, 0 to 1 (fixed substeps, so the same at any frame rate)
    compress: 0.2,       // the share of it that resists squashing: cloth buckles into folds rather than holding a sheet
    bend: 0.3,           // a robe's cotton: it bridges between the legs, and folds where pushed
    hemBend: 0.6,        // a sewn hem (points marked 2) keeps its fold and its line
    hemMass: 4,          // a hem point's mass against the cloth's 1: the turned hem is three layers, and it pulls the
                         // cloth above it down
    anchorHops: 4,       // a fold point (marked 3) anchors to the nearest cloth point within this many edges of it,
                         // so never across a slit to the other panel
    tetherSlack: 1.02,   // a free point may be this times its standing distance from its pin
    blend: 0.2,          // a free point may stray from its skinned place by this times its distance (along the cloth)
                         // from the belt: the waist eases from the body into the cloth, never a hard edge
    blendK: 400,         // 1/s2: the band's pull on a point past its reach, per metre past it (round 9: a force, not a
    blendAcc: 80,        // m/s2: at most this (8 g), so a point thrown far by a leg is drawn back, never yanked
    blendDamp: 10,       // 1/s: the band damps the point's motion away from its skinned place while it pulls
    blendDepth: 2,       // metres along the cloth from the belt that the band reaches; below it the cloth is free
    margin: 0.025,       // the cloth's distance kept from a capsule's surface: its points are 4 cm apart, and the
                         // triangles between them must clear the leg too
    backstop: 0.8,       // a capsule marked backstop (the pelvis) pushes a point out no further than its skinned place,
                         // at least this share of its radius: it is fatter than the hips it stands for
    friction: 0.15,      // share of the cloth's sliding on a leg that the leg takes with it: cloth on a leg goes
                         // with it, or the leg slides out from under the band's pull and through the cloth
    kick: 1,             // share of a leg's push the cloth keeps as speed: 1, the cloth moves with the leg that pushes it
                         // (at 0 the cloth lags the leg and the knee comes through between its points)
  };


  function weld(rest, tol) {
    // points at the same place are one particle (the GLB splits a point where its colour changes)
    var n = rest.length / 3, map = new Int32Array(n), key = {}, reps = [];
    for (var i = 0; i < n; i++) {
      var k = Math.round(rest[3 * i] / tol) + "," + Math.round(rest[3 * i + 1] / tol) + "," + Math.round(rest[3 * i + 2] / tol);
      if (key[k] === undefined) { key[k] = reps.length; reps.push(i); }
      map[i] = key[k];
    }
    return { map: map, reps: reps };
  }

  // build({rest, tris, sim, options}): rest, the standing positions (Float32Array, x y z per vertex, model space);
  // tris, triangle corners; sim, per vertex, 1 where the cloth is free, 2 where it is free and a sewn hem (stiff to
// bend), and 0 where it rides the body.
  function build(spec) {
    var o = {}, k;
    for (k in DEFAULTS) o[k] = DEFAULTS[k];
    for (k in spec.options || {}) o[k] = spec.options[k];
    var rest = spec.rest, tris = spec.tris, w = weld(rest, spec.weldTol || 1e-5), P = w.reps.length, map = w.map;
    var free = new Uint8Array(P), stiff = new Uint8Array(P), fol = new Uint8Array(P), x0 = new Float32Array(3 * P);
    for (var v = 0; v < map.length; v++) {
      var p = map[v];
      if (spec.sim[v] > 0.5) free[p] = 1;
      if (spec.sim[v] > 1.5) stiff[p] = 1;
      if (spec.sim[v] > 2.5) fol[p] = 1;
      x0[3 * p] = rest[3 * v]; x0[3 * p + 1] = rest[3 * v + 1]; x0[3 * p + 2] = rest[3 * v + 2];
    }
    for (v = 0; v < map.length; v++) if (spec.sim[v] <= 0.5) free[map[v]] = 0;   // a point pinned anywhere is pinned
    for (p = 0; p < P; p++) if (fol[p]) { free[p] = 0; stiff[p] = 0; }
    var dist = function (a, b) {
      var dx = x0[3 * a] - x0[3 * b], dy = x0[3 * a + 1] - x0[3 * b + 1], dz = x0[3 * a + 2] - x0[3 * b + 2];
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    };
    // the edges, and for each edge the corners opposite it
    var edges = {}, T = tris.length / 3;
    for (var t = 0; t < T; t++) {
      for (var c = 0; c < 3; c++) {
        var a = map[tris[3 * t + c]], b = map[tris[3 * t + (c + 1) % 3]], opp = map[tris[3 * t + (c + 2) % 3]];
        if (a === b) continue;
        var ek = a < b ? a + "_" + b : b + "_" + a;
        (edges[ek] = edges[ek] || { a: Math.min(a, b), b: Math.max(a, b), opp: [] }).opp.push(opp);
      }
    }
    var st = [], bd = [], bk = [], nbr = [], adj = [];
    for (var i = 0; i < P; i++) { nbr.push([]); adj.push([]); }
    for (ek in edges) {
      var e = edges[ek];
      adj[e.a].push(e.b); adj[e.b].push(e.a);
      if (fol[e.a] || fol[e.b] || !(free[e.a] || free[e.b])) continue;
      st.push(e.a, e.b);
      nbr[e.a].push(e.b); nbr[e.b].push(e.a);
      if (e.opp.length === 2 && e.opp[0] !== e.opp[1] && (free[e.opp[0]] || free[e.opp[1]]) && !fol[e.opp[0]] && !fol[e.opp[1]]) {
        bd.push(e.opp[0], e.opp[1]);
        bk.push(stiff[e.opp[0]] || stiff[e.opp[1]] || stiff[e.a] || stiff[e.b] ? o.hemBend : o.bend);
      }
    }
    for (ek in edges) { e = edges[ek]; if (!(free[e.a] || free[e.b]) && !fol[e.a] && !fol[e.b]) { nbr[e.a].push(e.b); nbr[e.b].push(e.a); } }
    var stL = new Float32Array(st.length / 2), bdL = new Float32Array(bd.length / 2);
    for (i = 0; i < stL.length; i++) stL[i] = dist(st[2 * i], st[2 * i + 1]);
    for (i = 0; i < bdL.length; i++) bdL[i] = dist(bd[2 * i], bd[2 * i + 1]);
    // tethers: each free point's nearest pinned point along the cloth (Dijkstra from every pin at once)
    var gd = new Float64Array(P).fill(Infinity), pin = new Int32Array(P).fill(-1), done = new Uint8Array(P), heap = [];
    function push(d, p) {
      heap.push([d, p]);
      for (var j = heap.length - 1; j > 0;) { var q = (j - 1) >> 1; if (heap[q][0] <= heap[j][0]) break; var s = heap[q]; heap[q] = heap[j]; heap[j] = s; j = q; }
    }
    function pop() {
      var top = heap[0], last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        for (var j = 0; ;) {
          var l = 2 * j + 1, r = l + 1, m = j;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === j) break;
          var s = heap[m]; heap[m] = heap[j]; heap[j] = s; j = m;
        }
      }
      return top;
    }
    for (i = 0; i < P; i++) if (!free[i] && !fol[i]) { gd[i] = 0; pin[i] = i; push(0, i); }
    while (heap.length) {
      var h = pop(), p0 = h[1];
      if (done[p0]) continue;
      done[p0] = 1;
      for (var n2 = 0; n2 < nbr[p0].length; n2++) {
        var q = nbr[p0][n2], d = gd[p0] + dist(p0, q);
        if (d < gd[q]) { gd[q] = d; pin[q] = pin[p0]; push(d, q); }
      }
    }
    var th = [], thL = [];
    for (i = 0; i < P; i++) if (free[i] && pin[i] >= 0) { th.push(i, pin[i]); thL.push(gd[i] * o.tetherSlack); }
    var md = new Float32Array(P).fill(Infinity);
    if (o.blend > 0) for (i = 0; i < P; i++) if (free[i] && gd[i] < o.blendDepth) md[i] = gd[i] * o.blend;
    // followers (points marked 3: a hem turned back inside the cloth) are not simulated: each keeps its standing place
    // in the frame of the cloth at its anchor. A fold 6 mm thick cannot be held by springs alone; it flips inside out.
    // Round 7: the anchor is the cloth point nearest the follower standing, the one it lies against, so it keeps only
    // its 6 mm off the cloth and follows the cloth's own curve. Until round 6 the whole fold hung from the hem's edge
    // as a stiff lip 3 cm deep: where the cloth curved round a shin the lip cut through it in cream teeth, and every
    // turn of the edge swung it (68 mm of frame-to-frame jitter at the fold, 27 at the edge it hung from).
    var anchor = new Int32Array(P).fill(-1), solid = [];
    for (i = 0; i < P; i++) solid.push(fol[i] ? [] : adj[i].filter(function (q) { return !fol[q]; }));
    // Round 8: the nearest among the points reachable through the mesh within anchorHops edges, never the nearest by
    // straight distance alone. Beside a slit the nearest point by distance can lie on the other panel; when the slit
    // parts, a fold point anchored there stretches across it in a flat cream bar (his round 7 pictures). Failing that,
    // the nearest point found by walking further out.
    var hops = new Int32Array(P);
    for (i = 0; i < P; i++) {
      if (!fol[i]) continue;
      var best = -1, bd2 = Infinity, seen = {}, ring = [i], depth = 0;
      seen[i] = 1;
      while (ring.length && (depth < o.anchorHops || best < 0)) {
        var next = [];
        depth++;
        for (var r = 0; r < ring.length; r++) {
          for (var a2 = 0; a2 < adj[ring[r]].length; a2++) {
            var q2 = adj[ring[r]][a2];
            if (seen[q2]) continue;
            seen[q2] = 1; next.push(q2);
            if (!fol[q2] && solid[q2].length) {
              var d2 = dist(i, q2);
              if (d2 < bd2) { bd2 = d2; best = q2; hops[i] = depth; }
            }
          }
        }
        ring = next;
      }
      anchor[i] = best;
    }
    var fl = [];
    for (i = 0; i < P; i++) if (fol[i] && anchor[i] >= 0) fl.push(i);
    var solidTris = [];
    for (t = 0; t < T; t++) {
      var ta = map[tris[3 * t]], tb = map[tris[3 * t + 1]], tc = map[tris[3 * t + 2]];
      if (!fol[ta] && !fol[tb] && !fol[tc]) solidTris.push(ta, tb, tc);
    }
    var nfree = 0;
    for (i = 0; i < P; i++) nfree += free[i];
    var wi = new Float32Array(P);
    for (i = 0; i < P; i++) wi[i] = free[i] ? (stiff[i] ? 1 / o.hemMass : 1) : 0;
    var c = {
      o: o, wi: wi, md: md, map: map, reps: w.reps, P: P, free: free, isFol: fol, nfree: nfree, tris: tris,
      st: Int32Array.from(st), stL: stL, bd: Int32Array.from(bd), bdL: bdL, bdK: Float32Array.from(bk), th: Int32Array.from(th), thL: Float32Array.from(thL),
      fol: fl, anchor: anchor, anchorHops: hops, solid: solid, solidTris: Int32Array.from(solidTris), fofs: new Float32Array(3 * fl.length),
      x: new Float32Array(3 * P), xp: new Float32Array(3 * P), tgt: new Float32Array(3 * P), tgt0: new Float32Array(3 * P),
      caps: [], caps0: [], acc: 0, started: false,
      out: new Float32Array(rest.length), normals: new Float32Array(rest.length), pn: new Float32Array(3 * P),
    };
    // the points a substep moves: the free ones, and the pins the free ones are joined to
    var used = new Uint8Array(P);
    [c.st, c.bd, c.th].forEach(function (a) { for (var q = 0; q < a.length; q++) used[a[q]] = 1; });
    var act = [], fr = [];
    for (i = 0; i < P; i++) { if (free[i]) fr.push(i); if (free[i] || (used[i] && !fol[i])) act.push(i); }
    c.act = Int32Array.from(act); c.freeIdx = Int32Array.from(fr);
    restFollowers(c, x0);
    return c;
  }

  // the frame of the cloth at each anchor: its normal n, t toward the cloth beside it, and n x t
  function frames(c, x, which) {
    var pn = c.pn, st = c.solidTris, out = {};
    pn.fill(0);
    for (var k = 0; k < st.length; k += 3) {
      var a = 3 * st[k], b = 3 * st[k + 1], d = 3 * st[k + 2];
      var e1x = x[b] - x[a], e1y = x[b + 1] - x[a + 1], e1z = x[b + 2] - x[a + 2];
      var e2x = x[d] - x[a], e2y = x[d + 1] - x[a + 1], e2z = x[d + 2] - x[a + 2];
      var nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
      pn[a] += nx; pn[a + 1] += ny; pn[a + 2] += nz; pn[b] += nx; pn[b + 1] += ny; pn[b + 2] += nz;
      pn[d] += nx; pn[d + 1] += ny; pn[d + 2] += nz;
    }
    for (var j = 0; j < which.length; j++) {
      var p = which[j];
      if (out[p]) continue;
      var p3 = 3 * p, l = Math.hypot(pn[p3], pn[p3 + 1], pn[p3 + 2]) || 1, n = [pn[p3] / l, pn[p3 + 1] / l, pn[p3 + 2] / l];
      // t: toward one neighbour, chosen once at rest (round 9). The sum toward all of them, used before, cancels to
      // almost nothing at an anchor inside the cloth, and its direction then swung with every micron of drift: a fold
      // point on a figure standing still shook 0.9 mm while its anchor crept 5 microns a frame.
      var r = c.tref[p], cx = x[3 * r] - x[p3], cy = x[3 * r + 1] - x[p3 + 1], cz = x[3 * r + 2] - x[p3 + 2];
      var dn = cx * n[0] + cy * n[1] + cz * n[2];
      cx -= dn * n[0]; cy -= dn * n[1]; cz -= dn * n[2];
      var lt = Math.hypot(cx, cy, cz) || 1, t = [cx / lt, cy / lt, cz / lt];
      out[p] = [n, t, [n[1] * t[2] - n[2] * t[1], n[2] * t[0] - n[0] * t[2], n[0] * t[1] - n[1] * t[0]]];
    }
    return out;
  }

  function restFollowers(c, x0) {
    var anchors = c.fol.map(function (f) { return c.anchor[f]; });
    // each anchor's t neighbour: the one most along the cloth beside it at rest (the sum toward all its neighbours)
    c.tref = {};
    anchors.forEach(function (p) {
      if (c.tref[p] !== undefined) return;
      var sn = c.solid[p], p3 = 3 * p, sx = 0, sy = 0, sz = 0, best = sn[0], bd = -Infinity;
      for (var q = 0; q < sn.length; q++) { sx += x0[3 * sn[q]] - x0[p3]; sy += x0[3 * sn[q] + 1] - x0[p3 + 1]; sz += x0[3 * sn[q] + 2] - x0[p3 + 2]; }
      for (q = 0; q < sn.length; q++) {
        var ex = x0[3 * sn[q]] - x0[p3], ey = x0[3 * sn[q] + 1] - x0[p3 + 1], ez = x0[3 * sn[q] + 2] - x0[p3 + 2];
        var dd = (ex * sx + ey * sy + ez * sz) / (Math.hypot(ex, ey, ez) || 1);
        if (dd > bd) { bd = dd; best = sn[q]; }
      }
      c.tref[p] = best;
    });
    var F = frames(c, x0, anchors);
    for (var j = 0; j < c.fol.length; j++) {
      var f = 3 * c.fol[j], a = 3 * anchors[j], fr = F[anchors[j]], d = [x0[f] - x0[a], x0[f + 1] - x0[a + 1], x0[f + 2] - x0[a + 2]];
      for (var k = 0; k < 3; k++) c.fofs[3 * j + k] = d[0] * fr[k][0] + d[1] * fr[k][1] + d[2] * fr[k][2];
    }
  }

  function follow(c) {
    var x = c.x, anchors = c.fol.map(function (f) { return c.anchor[f]; }), F = frames(c, x, anchors);
    for (var j = 0; j < c.fol.length; j++) {
      var f = 3 * c.fol[j], a = 3 * anchors[j], fr = F[anchors[j]], o = c.fofs;
      for (var k = 0; k < 3; k++) x[f + k] = x[a + k] + o[3 * j] * fr[0][k] + o[3 * j + 1] * fr[1][k] + o[3 * j + 2] * fr[2][k];
    }
  }

  // reset(cloth, targets): every point to where the skinned body puts it, at rest (a teleport, or the first frame)
  function reset(c, targets) {
    c.tgt.set(targets); c.tgt0.set(targets); c.x.set(targets); c.xp.set(targets);
    c.acc = 0; c.started = true;
    follow(c);
  }

  function lerpCaps(a, b, f) {
    var out = [];
    for (var i = 0; i < b.length; i++) {
      var p = a[i] || b[i], q = b[i], s = [];
      for (var j = 0; j < 6; j++) s.push(p.s[j] + (q.s[j] - p.s[j]) * f);
      out.push({ s: s, r: q.r, rb: q.rb, bs: q.bs });
    }
    return out;
  }

  // step(cloth, dt, targets, capsules): advance by dt seconds. targets: each particle's skinned position now
  // (Float32Array, x y z per particle, the space the cloth lives in, usually the world); a pinned point goes there,
  // and a free one starts there on a reset. capsules: [{s: [ax, ay, az, bx, by, bz], r}] in the same space, now.
  // Over the substeps the pins and capsules move in a straight line from where they were at the last step.
  function step(c, dt, targets, capsules) {
    if (!c.started) { reset(c, targets); c.caps = capsules; return 0; }
    c.tgt0.set(c.tgt); c.tgt.set(targets);
    c.caps0 = c.caps; c.caps = capsules;
    // The frame is cut into whole substeps of at most 1/substepHz, so the cloth always lands on the body's time. Round
    // 6 found the old way (fixed substeps and the remainder carried to the next frame) jittered: at 60 frames a second
    // the frame held 7, 8 or 9 substeps by rounding, so the pins covered the same move in 7 or 9 substeps and the
    // cloth felt the body speed up and slow down every frame. A frame longer than maxSubsteps allows is slowed down.
    var o = c.o, T = Math.min(dt, o.maxSubsteps / o.substepHz);
    var n = T > 0 ? Math.ceil(T * o.substepHz - 1e-6) : 0, h = n ? T / n : 1 / o.substepHz;
    if (n && (o.dragQ || o.dragL || o.relDamp)) pointNormals(c);
    c.span = n * h;
    for (var s = 1; s <= n; s++) substep(c, h, s / n);
    var x = c.x, free = c.free, tg = c.tgt;
    for (var i = 0; i < c.P; i++) if (!free[i] && !c.isFol[i]) { x[3 * i] = tg[3 * i]; x[3 * i + 1] = tg[3 * i + 1]; x[3 * i + 2] = tg[3 * i + 2]; }
    follow(c);
    return n;
  }

  // each point's unit normal (from the cloth's own triangles), for the air's drag across it
  function pointNormals(c) {
    var x = c.x, pn = c.pn, st = c.solidTris;
    pn.fill(0);
    for (var k = 0; k < st.length; k += 3) {
      var a = 3 * st[k], b = 3 * st[k + 1], d = 3 * st[k + 2];
      var e1x = x[b] - x[a], e1y = x[b + 1] - x[a + 1], e1z = x[b + 2] - x[a + 2];
      var e2x = x[d] - x[a], e2y = x[d + 1] - x[a + 1], e2z = x[d + 2] - x[a + 2];
      var nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
      pn[a] += nx; pn[a + 1] += ny; pn[a + 2] += nz; pn[b] += nx; pn[b + 1] += ny; pn[b + 2] += nz;
      pn[d] += nx; pn[d + 1] += ny; pn[d + 2] += nz;
    }
    var F = c.freeIdx;
    for (var j = 0; j < F.length; j++) {
      var p = 3 * F[j], l = Math.sqrt(pn[p] * pn[p] + pn[p + 1] * pn[p + 1] + pn[p + 2] * pn[p + 2]) || 1;
      pn[p] /= l; pn[p + 1] /= l; pn[p + 2] /= l;
    }
  }

  function substep(c, h, f) {
    var o = c.o, x = c.x, xp = c.xp, P = c.P, free = c.free, i, j;
    var drag = (o.dragQ || o.dragL || o.relDamp) && c.span > 0, gx = o.gravity[0] * h * h, gy = o.gravity[1] * h * h, gz = o.gravity[2] * h * h, keep = Math.exp(-o.damping * h);
    for (j = 0; j < c.act.length; j++) {
      i = c.act[j];
      var i3 = 3 * i;
      if (!free[i]) {
        xp[i3] = x[i3]; xp[i3 + 1] = x[i3 + 1]; xp[i3 + 2] = x[i3 + 2];
        x[i3] = c.tgt0[i3] + (c.tgt[i3] - c.tgt0[i3]) * f;
        x[i3 + 1] = c.tgt0[i3 + 1] + (c.tgt[i3 + 1] - c.tgt0[i3 + 1]) * f;
        x[i3 + 2] = c.tgt0[i3 + 2] + (c.tgt[i3 + 2] - c.tgt0[i3 + 2]) * f;
        continue;
      }
      var vx = (x[i3] - xp[i3]) * keep, vy = (x[i3 + 1] - xp[i3 + 1]) * keep, vz = (x[i3 + 2] - xp[i3 + 2]) * keep;
      if (drag) {
        // the air across the cloth: the motion along its normal, relative to the body's own motion there (the air
        // near a walking body moves with it), is slowed; the motion along the cloth (its fall) is not
        var pn = c.pn, s = h / c.span, rx = vx - (c.tgt[i3] - c.tgt0[i3]) * s, ry = vy - (c.tgt[i3 + 1] - c.tgt0[i3 + 1]) * s,
          rz = vz - (c.tgt[i3 + 2] - c.tgt0[i3 + 2]) * s, un = rx * pn[i3] + ry * pn[i3 + 1] + rz * pn[i3 + 2];
        var cut = (o.dragQ * Math.abs(un) / h + o.dragL) * h * c.wi[i];
        if (cut > 1) cut = 1;
        vx -= cut * un * pn[i3]; vy -= cut * un * pn[i3 + 1]; vz -= cut * un * pn[i3 + 2];
        if (o.relDamp) {                               // and every way, gently: what a leg threw, the air takes back
          var kr = 1 - Math.exp(-o.relDamp * h);
          rx -= un * pn[i3]; ry -= un * pn[i3 + 1]; rz -= un * pn[i3 + 2];
          vx -= kr * rx; vy -= kr * ry; vz -= kr * rz;
        }
      }
      xp[i3] = x[i3]; xp[i3 + 1] = x[i3 + 1]; xp[i3 + 2] = x[i3 + 2];
      x[i3] += vx + gx; x[i3 + 1] += vy + gy; x[i3 + 2] += vz + gz;
    }
    solve(c, c.st, c.stL, o.stretch, false, o.compress);
    solve(c, c.bd, c.bdL, c.bdK, false);
    solve(c, c.th, c.thL, 1.0, true);
    var caps = lerpCaps(c.caps0, c.caps, f);
    if (o.blend > 0) leash(c, f, caps, h);                 // before the legs: a leg's push wins over the leash
    collide(c, caps, f);
  }

  // the blend band at the belt: a free point past md from where the skin puts it (Unity's and Chaos's max distance) is
  // drawn back by a force, at most blendAcc, and damped while it is drawn. Round 9 found the old band (a projection that
  // took a share of the overshoot back each substep, switched off within blendClear of a leg) was the hem's shake at the
  // shins: a point a leg had carried 25 cm past its reach was let go and caught again as the leg passed, and each catch
  // moved it 25 mm in a substep, an acceleration of thousands of m/s2 switched on and off (CLOTH.md, round 9). The
  // skinned place is first moved out of any leg capsule it has sunk into (skin weights cannot follow a bending knee),
  // so the band never draws cloth into a leg, and a leg, a hard contact, always beats a bounded force.
  function leash(c, f, caps, h) {
    var x = c.x, xp = c.xp, F = c.freeIdx, md = c.md, t0 = c.tgt0, t1 = c.tgt, mg = c.o.margin, q = [0, 0, 0];
    var K = c.o.blendK, amax = c.o.blendAcc, damp = 1 - Math.exp(-c.o.blendDamp * h), sp = h / c.span;
    for (var j = 0; j < F.length; j++) {
      var i = F[j], m = md[i], i3 = 3 * i;
      if (m === Infinity) continue;
      q[0] = t0[i3] + (t1[i3] - t0[i3]) * f; q[1] = t0[i3 + 1] + (t1[i3 + 1] - t0[i3 + 1]) * f; q[2] = t0[i3 + 2] + (t1[i3 + 2] - t0[i3 + 2]) * f;
      for (var k = 0; k < caps.length; k++) {
        if (caps[k].bs) continue;                       // the pelvis's backstop already measures from the skin
        var s = caps[k].s, ux = s[3] - s[0], uy = s[4] - s[1], uz = s[5] - s[2];
        var uu = ux * ux + uy * uy + uz * uz || 1e-12, t = ((q[0] - s[0]) * ux + (q[1] - s[1]) * uy + (q[2] - s[2]) * uz) / uu;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        var r = capR(caps[k], t) + mg;
        var ex = q[0] - s[0] - ux * t, ey = q[1] - s[1] - uy * t, ez = q[2] - s[2] - uz * t, e2 = ex * ex + ey * ey + ez * ez;
        if (e2 >= r * r || e2 < 1e-12) continue;
        var e = Math.sqrt(e2), out = (r - e) / e;
        q[0] += ex * out; q[1] += ey * out; q[2] += ez * out;
      }
      var dx = x[i3] - q[0], dy = x[i3 + 1] - q[1], dz = x[i3 + 2] - q[2], d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d <= m) continue;
      var nx = dx / d, ny = dy / d, nz = dz / d, a = K * (d - m);
      if (a > amax) a = amax;
      // the point's speed away from its skinned place (per substep), less the skin's own
      var vr = (x[i3] - xp[i3] - (t1[i3] - t0[i3]) * sp) * nx + (x[i3 + 1] - xp[i3 + 1] - (t1[i3 + 1] - t0[i3 + 1]) * sp) * ny +
        (x[i3 + 2] - xp[i3 + 2] - (t1[i3 + 2] - t0[i3 + 2]) * sp) * nz;
      var dv = a * h * h + damp * vr;
      x[i3] -= dv * nx; x[i3 + 1] -= dv * ny; x[i3 + 2] -= dv * nz;
    }
  }

  // a capsule's radius at t along it (0 at a, 1 at b): a leg tapers from thigh to knee and from calf to ankle
  function capR(cap, t) { return cap.rb === undefined ? cap.r : cap.r + (cap.rb - cap.r) * t; }

  function solve(c, idx, L, k, tether, squash) {
    var x = c.x, wi = c.wi;
    for (var e = 0, m = L.length; e < m; e++) {
      var a = idx[2 * e], b = idx[2 * e + 1], a3 = 3 * a, b3 = 3 * b;
      var dx = x[b3] - x[a3], dy = x[b3 + 1] - x[a3 + 1], dz = x[b3 + 2] - x[a3 + 2];
      var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < 1e-9 || (tether && d <= L[e])) continue;
      var wa = tether ? (wi[a] ? 1 : 0) : wi[a], wb = tether ? 0 : wi[b], ws = wa + wb;
      if (!ws) continue;
      var g = (typeof k === "number" ? k : k[e]) * (d < L[e] && squash !== undefined ? squash : 1) * (d - L[e]) / (d * ws);
      x[a3] += wa * g * dx; x[a3 + 1] += wa * g * dy; x[a3 + 2] += wa * g * dz;
      x[b3] -= wb * g * dx; x[b3 + 1] -= wb * g * dy; x[b3 + 2] -= wb * g * dz;
    }
  }

  function collide(c, caps, f) {
    var x = c.x, xp = c.xp, P = c.P, free = c.free, mg = c.o.margin, fr = c.o.friction, kick = c.o.kick, back = c.o.backstop, t0 = c.tgt0, t1 = c.tgt;
    for (var k = 0; k < caps.length; k++) {
      var s = caps[k].s, r = caps[k].r + mg, r2 = r * r, rmax = Math.max(r, capR(caps[k], 1) + mg);
      var ax = s[0], ay = s[1], az = s[2], ux = s[3] - ax, uy = s[4] - ay, uz = s[5] - az;
      var uu = ux * ux + uy * uy + uz * uz || 1e-12;
      var lo = Math.min(ax, s[3]) - rmax, hi = Math.max(ax, s[3]) + rmax, lo2 = Math.min(az, s[5]) - rmax, hi2 = Math.max(az, s[5]) + rmax;
      var loy = Math.min(ay, s[4]) - rmax, hiy = Math.max(ay, s[4]) + rmax;
      for (var j = 0, F = c.freeIdx, nf = F.length; j < nf; j++) {
        var i = F[j], i3 = 3 * i, px = x[i3], py = x[i3 + 1], pz = x[i3 + 2];
        if (px < lo || px > hi || pz < lo2 || pz > hi2 || py < loy || py > hiy) continue;
        var t = ((px - ax) * ux + (py - ay) * uy + (pz - az) * uz) / uu;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        var cx = ax + ux * t, cy = ay + uy * t, cz = az + uz * t, dx = px - cx, dy = py - cy, dz = pz - cz;
        var d2 = dx * dx + dy * dy + dz * dz;
        if (caps[k].rb !== undefined) { r = capR(caps[k], t) + mg; r2 = r * r; }
        if (d2 >= r2) continue;
        var rr = r;
        if (back && caps[k].bs) {
          // the backstop: the skin's own place for this point is never inside the leg, so a capsule wider than the
          // body there pushes the point out only as far as its skinned place
          var qx = t0[i3] + (t1[i3] - t0[i3]) * f, qy = t0[i3 + 1] + (t1[i3 + 1] - t0[i3 + 1]) * f, qz = t0[i3 + 2] + (t1[i3 + 2] - t0[i3 + 2]) * f;
          var tq = ((qx - ax) * ux + (qy - ay) * uy + (qz - az) * uz) / uu;
          tq = tq < 0 ? 0 : tq > 1 ? 1 : tq;
          var ex = qx - ax - ux * tq, ey = qy - ay - uy * tq, ez = qz - az - uz * tq, dq = Math.sqrt(ex * ex + ey * ey + ez * ez);
          if (dq < rr) rr = Math.max(dq, caps[k].r * back);
          if (d2 >= rr * rr) continue;
        }
        var d = Math.sqrt(d2) || 1e-9, push = (rr - d) / d;
        x[i3] += dx * push; x[i3 + 1] += dy * push; x[i3 + 2] += dz * push;
        if (kick < 1) { xp[i3] += (1 - kick) * dx * push; xp[i3 + 1] += (1 - kick) * dy * push; xp[i3 + 2] += (1 - kick) * dz * push; }
        // friction: the sliding along the leg since the last substep is cut by a share
        var nx = dx / d, ny = dy / d, nz = dz / d;
        var mx = x[i3] - xp[i3], my = x[i3 + 1] - xp[i3 + 1], mz = x[i3 + 2] - xp[i3 + 2], mn = mx * nx + my * ny + mz * nz;
        xp[i3] += fr * (mx - mn * nx); xp[i3 + 1] += fr * (my - mn * ny); xp[i3 + 2] += fr * (mz - mn * nz);
      }
    }
  }

  // positions(cloth): x y z per vertex of the mesh it was built from (welded points share one place); normals too
  function positions(c, withNormals) {
    var map = c.map, x = c.x, out = c.out;
    for (var v = 0; v < map.length; v++) {
      var p = 3 * map[v];
      out[3 * v] = x[p]; out[3 * v + 1] = x[p + 1]; out[3 * v + 2] = x[p + 2];
    }
    if (withNormals) {
      var pn = c.pn, tris = c.tris, nm = c.normals;
      pn.fill(0);
      for (var t = 0; t < tris.length; t += 3) {
        var a = 3 * map[tris[t]], b = 3 * map[tris[t + 1]], d = 3 * map[tris[t + 2]];
        var e1x = x[b] - x[a], e1y = x[b + 1] - x[a + 1], e1z = x[b + 2] - x[a + 2];
        var e2x = x[d] - x[a], e2y = x[d + 1] - x[a + 1], e2z = x[d + 2] - x[a + 2];
        var nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
        pn[a] += nx; pn[a + 1] += ny; pn[a + 2] += nz; pn[b] += nx; pn[b + 1] += ny; pn[b + 2] += nz;
        pn[d] += nx; pn[d + 1] += ny; pn[d + 2] += nz;
      }
      for (v = 0; v < map.length; v++) {
        p = 3 * map[v];
        var l = Math.sqrt(pn[p] * pn[p] + pn[p + 1] * pn[p + 1] + pn[p + 2] * pn[p + 2]) || 1;
        nm[3 * v] = pn[p] / l; nm[3 * v + 1] = pn[p + 1] / l; nm[3 * v + 2] = pn[p + 2] / l;
      }
    }
    return out;
  }

  // ---- three.js -----------------------------------------------------------------------------------------------
  // attach(THREE, skinned, opts): the robe's SkinnedMesh (bound to the figure's bones) becomes a plain mesh whose
  // points are worked out on the CPU each frame: skinned above the belt, cloth below it. The GLB carries, per point,
  // _CLOTH (1 free, 0 rides the body) and, on the mesh, extras.cloth.capsules ([{a, b, r}]: a capsule of radius r, in
  // the robe's own units, from bone a's joint to bone b's). Returns {mesh, update(dt), reset()}. The figure's world
  // matrices must be up to date when update runs (after the pose is set and updateMatrixWorld).
  function attach(THREE, skinned, opts) {
    opts = opts || {};
    var g = skinned.geometry, pos = g.attributes.position, n = pos.count;
    var simAttr = g.attributes._cloth || g.attributes._CLOTH;
    var sim = new Float32Array(n);
    for (var i = 0; i < n; i++) sim[i] = simAttr ? simAttr.getX(i) : 0;
    var index = g.index ? g.index.array : Uint32Array.from({ length: n }, function (_, i) { return i; });
    var extras = (skinned.userData && skinned.userData.cloth) || (skinned.parent && skinned.parent.userData.cloth) || {};
    if (typeof extras === "string") extras = JSON.parse(extras);
    var skel = skinned.skeleton, bones = skel.bones, byName = {};
    bones.forEach(function (b) { byName[b.name] = b; });
    var scale = new THREE.Vector3();
    skinned.updateMatrixWorld(true);
    skinned.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), scale);
    var unit = (scale.x + scale.y + scale.z) / 3;                        // world units per robe unit
    var up = opts.up || [0, 1, 0];
    var o = {}, k;
    for (k in opts.options || {}) o[k] = opts.options[k];
    o.gravity = [-up[0] * 9.81 * unit, -up[1] * 9.81 * unit, -up[2] * 9.81 * unit];
    if (o.margin === undefined) o.margin = DEFAULTS.margin * unit;
    if (o.dragQ === undefined) o.dragQ = DEFAULTS.dragQ / unit;           // 1/m: per world unit
    if (o.blendAcc === undefined) o.blendAcc = DEFAULTS.blendAcc * unit;
    var c = build({ rest: pos.array, tris: index, sim: sim, options: o });
    var caps = (extras.capsules || []).filter(function (q) { return byName[q.a] && byName[q.b]; });

    var geo = g.clone();
    geo.deleteAttribute("skinIndex"); geo.deleteAttribute("skinWeight");
    var mesh = new THREE.Mesh(geo, skinned.material);
    mesh.name = skinned.name + "-cloth";
    mesh.frustumCulled = false;
    skinned.visible = false;
    (skinned.parent || opts.parent).add(mesh);
    var si = g.attributes.skinIndex, sw = g.attributes.skinWeight, NB = bones.length;
    var SI = new Uint16Array(4 * c.P), SW = new Float32Array(4 * c.P), R0 = new Float32Array(3 * c.P);
    for (var p = 0; p < c.P; p++) {
      var v0 = c.reps[p];
      for (var j = 0; j < 4; j++) { SI[4 * p + j] = si.getComponent ? si.getComponent(v0, j) : si.array[4 * v0 + j]; SW[4 * p + j] = sw.getComponent ? sw.getComponent(v0, j) : sw.array[4 * v0 + j]; }
      R0[3 * p] = pos.getX(v0); R0[3 * p + 1] = pos.getY(v0); R0[3 * p + 2] = pos.getZ(v0);
    }
    var ME = new Float32Array(16 * NB), mb = new THREE.Matrix4(), pre = new THREE.Matrix4();
    var targets = new Float32Array(3 * c.P), inv = new THREE.Matrix4();

    function skin() {
      // world point = matrixWorld * bindMatrixInverse * sum(w * boneMatrixWorld * boneInverse) * bindMatrix * rest
      pre.multiplyMatrices(skinned.matrixWorld, skinned.bindMatrixInverse);
      for (var b = 0; b < NB; b++) {
        mb.multiplyMatrices(bones[b].matrixWorld, skel.boneInverses[b]).multiply(skinned.bindMatrix).premultiply(pre);
        ME.set(mb.elements, 16 * b);
      }
      for (var p = 0; p < c.P; p++) {
        var x = R0[3 * p], y = R0[3 * p + 1], z = R0[3 * p + 2], ox = 0, oy = 0, oz = 0;
        for (var j = 0; j < 4; j++) {
          var w = SW[4 * p + j];
          if (!w) continue;
          var e = 16 * SI[4 * p + j];
          ox += w * (ME[e] * x + ME[e + 4] * y + ME[e + 8] * z + ME[e + 12]);
          oy += w * (ME[e + 1] * x + ME[e + 5] * y + ME[e + 9] * z + ME[e + 13]);
          oz += w * (ME[e + 2] * x + ME[e + 6] * y + ME[e + 10] * z + ME[e + 14]);
        }
        targets[3 * p] = ox; targets[3 * p + 1] = oy; targets[3 * p + 2] = oz;
      }
    }
    var a3 = new THREE.Vector3(), b3 = new THREE.Vector3();
    function capsules() {
      return caps.map(function (q) {
        byName[q.a].getWorldPosition(a3); byName[q.b].getWorldPosition(b3);
        return { s: [a3.x, a3.y, a3.z, b3.x, b3.y, b3.z], r: q.r * unit, rb: q.rb === undefined ? undefined : q.rb * unit, bs: !!q.backstop };
      });
    }
    function write() {
      var out = positions(c, true), pa = geo.attributes.position.array, na = geo.attributes.normal && geo.attributes.normal.array, nm = c.normals;
      inv.copy(mesh.parent.matrixWorld).invert();
      var e = inv.elements;
      for (var v = 0; v < n; v++) {
        var x = out[3 * v], y = out[3 * v + 1], z = out[3 * v + 2];
        pa[3 * v] = e[0] * x + e[4] * y + e[8] * z + e[12];
        pa[3 * v + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
        pa[3 * v + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
        if (na) {   // the parent's turn only (the figure is not stretched), normalised after
          var nx = nm[3 * v], ny = nm[3 * v + 1], nz = nm[3 * v + 2];
          var qx = e[0] * nx + e[4] * ny + e[8] * nz, qy = e[1] * nx + e[5] * ny + e[9] * nz, qz = e[2] * nx + e[6] * ny + e[10] * nz;
          var l = Math.sqrt(qx * qx + qy * qy + qz * qz) || 1;
          na[3 * v] = qx / l; na[3 * v + 1] = qy / l; na[3 * v + 2] = qz / l;
        }
      }
      geo.attributes.position.needsUpdate = true;
      if (na) geo.attributes.normal.needsUpdate = true;
    }
    return {
      mesh: mesh, cloth: c, unit: unit,
      update: function (dt) { skin(); step(c, dt, targets, capsules()); write(); },
      reset: function () { skin(); reset(c, targets); c.caps = capsules(); write(); },
    };
  }

  return { build: build, reset: reset, step: step, positions: positions, attach: attach, DEFAULTS: DEFAULTS };
});
