/* Lantern out (Allyship's game at stage 1; canon/mechanics/lantern-out.yaml; FR-020). Together, one sitting: at the hollow's
   mouth the Wisp marks three calls in the valley (a lamp gone out at a house, someone alone on a bridge, a boat with no light).
   Each friend points at one; nothing is chosen until both point at the same. Then the lantern lifts between them, the two walk
   the new path to the lookout stone, the lantern floats on along the thread, and the place lights and stays lit. */
import { PLACES, KINDS, CALL_WORDS, COPY, callsFor, litPlaces, betweenDay, hash } from "./core.js";
import { setExtraWalk } from "../hollow.js";

const MOUTH = { x: 0.6, z: -2.8, r: 1.9 };               // where the calls are chosen (inside the rope fence)
const PATH = { ax: 0.6, az: -3.2, bx: 1.5, bz: -10.3, w: 0.95 };
const STONE = { x: 1.5, z: -10.3 };
const TUNE = { fade: 0.8, lift: 0.6 };
const FLOAT_S = 4.2, WAIT_PEER_S = 8;

export function create(X) {
  const { THREE, scene } = X;
  const G = new THREE.Group(); G.name = "lantern-out"; scene.add(G);
  const reduce = !!(matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const dot = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,.4)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();

  /* ---- the new ground: a path of flat stones from the rope fence to the lookout stone, and the stone ---- */
  setExtraWalk([PATH]);
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6b6252, roughness: 0.95 }), mossMat = new THREE.MeshStandardMaterial({ color: 0x56702c, roughness: 1 });
  {
    const dx = PATH.bx - PATH.ax, dz = PATH.bz - PATH.az, L = Math.hypot(dx, dz), n = 11, r = (() => { let a = 77; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, s = new THREE.Mesh(new THREE.BoxGeometry(0.7 + r() * 0.5, 0.07, 0.7 + r() * 0.35), i % 3 === 2 ? mossMat : stoneMat);
      s.position.set(PATH.ax + dx * u + (r() - 0.5) * 0.3, 0.03, PATH.az + dz * u + (r() - 0.5) * 0.2); s.rotation.y = Math.atan2(dx, dz) + (r() - 0.5) * 0.5; G.add(s);
    }
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 0.14, 20), stoneMat); pad.position.set(STONE.x, 0.05, STONE.z); G.add(pad);
    const up = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), stoneMat); up.position.set(STONE.x + 0.75, 0.42, STONE.z - 0.55); up.scale.set(0.8, 1.7, 0.8); G.add(up);
    const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), mossMat); tuft.position.set(STONE.x + 0.5, 0.15, STONE.z - 0.4); tuft.scale.set(1.4, 0.4, 1.2); G.add(tuft);
    void L;
  }

  /* ---- the valley's twelve places: dark silhouettes for tonight's three, light where a call was carried ---- */
  const valley = PLACES.map((p, i) => {
    const grp = new THREE.Group(); grp.position.set(p.x, -13.4, p.z); G.add(grp);
    const body = new THREE.Mesh(p.kind === "house" ? new THREE.BoxGeometry(1.6, 1.1, 1.2) : p.kind === "bridge" ? new THREE.BoxGeometry(3.2, 0.25, 0.7) : new THREE.ConeGeometry(0.8, 0.5, 4),
      new THREE.MeshBasicMaterial({ color: 0x15111c, fog: false })); body.position.y = 0.5; if (p.kind === "boat") body.rotation.x = Math.PI; body.visible = false; grp.add(body);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: 0xffc070, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); glow.scale.setScalar(3.4); glow.position.y = 0.9; grp.add(glow);
    return { i, p, grp, body, glow, a: 0, aWant: 0 };
  });

  /* ---- threads from the mouth to tonight's calls ---- */
  const FROM = new THREE.Vector3(0.1, 1.2, -4.5);
  const threads = [0, 1, 2].map(() => {
    const N = 46, pos = new Float32Array(N * 3), geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ map: dot, size: 0.34, sizeAttenuation: true, color: 0xffd9a0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.visible = false; G.add(pts);
    return { pts, mat, N, pos, curve: null, a: 0, aWant: 0, place: -1 };
  });
  const lantern = (() => {
    const g = new THREE.Group(); g.visible = false;
    const pts = []; for (let k = 0; k <= 10; k++) { const u = k / 10; pts.push(new THREE.Vector2(0.17 * Math.sin(0.25 + u * (Math.PI - 0.5)) + 0.03, u * 0.44 - 0.22)); }
    const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 14), new THREE.MeshBasicMaterial({ color: 0xffc275, side: THREE.DoubleSide })); g.add(body);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: 0xffb060, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(1.7); g.add(halo);
    const light = new THREE.PointLight(0xffb066, 4, 7, 1.6); g.add(light); scene.add(g); return { g, light, halo };
  })();

  /* ---- the state of tonight ---- */
  let day = -1, calls = [0, 0, 0], st = null, sig = "", lastPt = null, litSig = "";
  /* st: null until both agree, then { idx, t0, phase: "lift"|"walk"|"float"|"done", at, arrivedAt, wrote } */
  const dayCall = () => X.items().find(i => i.kind === "call" && i.day === day) || null;
  const mouthD = (p) => p ? Math.hypot(p.x - MOUTH.x, p.z - MOUTH.z) : 99;
  const atMouth = () => mouthD(X.player()) < MOUTH.r;
  const friendAtMouth = () => { const o = X.other(), q = o && X.peerPos(o); return !!q && mouthD(q) < MOUTH.r + 1.4; };
  let myPt = null;

  function refreshDay() {
    const d = betweenDay(X.g(), X.now()), id = X.gardenId();
    if (d !== day || id !== sig) { day = d; sig = id; calls = callsFor(id || "preview", day); threads.forEach((t, k) => { t.place = calls[k]; t.curve = curveTo(PLACES[calls[k]]); }); myPt = null; if (!X.preview) st = null; }
  }
  function curveTo(p) {
    const to = new THREE.Vector3(p.x, -13.0, p.z), mid = FROM.clone().lerp(to, 0.45); mid.y = FROM.y + 3.2;
    return new THREE.QuadraticBezierCurve3(FROM.clone(), mid, to);
  }
  const other = () => X.other();
  const theirPt = () => { const o = other(); const r = o && X.raw(o); return r && Number.isInteger(r.pt) ? r.pt : null; };

  function point(k) { myPt = myPt === k ? null : k; X.poke(); }
  // pointing is kept up once the choice is made, so the other phone, which may not have seen the two agree yet, still sees it
  X.extra.pt = () => (X.active("lantern-out") && !dayCall() ? (st ? st.k : atMouth() ? myPt : null) : null);

  function moment() {
    if (!X.active("lantern-out") || dayCall()) return null;
    if (st && st.phase !== "done") return null;
    if (!atMouth()) return null;
    const o = other(), t = theirPt(), words = k => CALL_WORDS[KINDS[k]];
    const sub = myPt !== null ? `${words(myPt)}.` : t !== null && o ? `${X.name(o)} is looking at ${words(t).charAt(0).toLowerCase() + words(t).slice(1)}.` : "";
    return { head: COPY.which, sub, soft: true, key: "which:" + myPt + ":" + t,
      actions: KINDS.map((kd, k) => ({ label: words(k), quiet: myPt !== k, on: () => point(k) })) };
  }

  function lerpPlayer(a, b, u) { return { x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u }; }
  function walkTarget() {
    const side = X.me() < (other() || "~") ? -1 : 1, ang = Math.atan2(PATH.bx - PATH.ax, PATH.bz - PATH.az);
    return new THREE.Vector3(STONE.x + Math.cos(ang) * 0.38 * side, 0, STONE.z - Math.sin(ang) * 0.38 * side);
  }

  function frame(T) {
    refreshDay();
    const t = performance.now() / 1000, items = X.items();
    // tonight's three
    const lp = litPlaces(items), key = JSON.stringify(lp) + day;
    if (key !== litSig) { litSig = key; }
    const todaysCall = dayCall();
    valley.forEach(v => {
      const tonight = calls.includes(v.i) && !todaysCall && X.active("lantern-out");
      const isLit = lp.lit.includes(v.i) || (st && st.phase === "done" && st.idx === v.i), isWin = lp.window.includes(v.i);
      v.body.visible = tonight || isLit || isWin;
      v.aWant = isLit ? 1 : isWin ? 0.28 : 0;
      v.a += (v.aWant - v.a) * 0.06; v.glow.material.opacity = v.a * (0.85 + 0.15 * Math.sin(t * 1.3 + v.i)); v.glow.scale.setScalar(isWin ? 1.6 : 3.4);
    });
    // the threads: shown while tonight's call is open and a friend is at the mouth
    const showThreads = X.active("lantern-out") && !todaysCall && (atMouth() || (st && st.phase !== "done"));
    threads.forEach((th, k) => {
      let want = showThreads ? 0.55 : 0;
      const mine = myPt === k, theirs = theirPt() === k;
      if (mine || theirs) want = 0.95;
      if (st && st.phase !== "done") want = st.idx === calls[k] || k === calls.indexOf(st.idx) ? 0.95 : (t - st.t0 > TUNE.fade ? 0 : 0.55 * (1 - (t - st.t0) / TUNE.fade));
      th.a += (want - th.a) * (reduce ? 1 : 0.12); th.mat.opacity = th.a; th.pts.visible = th.a > 0.01;
      if (th.pts.visible && th.curve) {
        const run = reduce ? 0 : (t * 0.18 + k * 0.31) % 1, P = th.pos;
        for (let i = 0; i < th.N; i++) { const u = ((i / th.N) + run) % 1, q = th.curve.getPoint(u); P[i * 3] = q.x; P[i * 3 + 1] = q.y; P[i * 3 + 2] = q.z; }
        th.pts.geometry.attributes.position.needsUpdate = true; th.mat.size = 0.3 + (mine || theirs ? 0.16 : 0);
      }
    });
    // both point at one call -> the choice is made
    if (!st && !todaysCall && X.active("lantern-out") && atMouth() && friendAtMouth() && myPt !== null && theirPt() === myPt) {
      st = { idx: calls[myPt], k: myPt, t0: t, phase: "lift", arrivedAt: null, wrote: false }; myPt = null;
      X.poke();
    }
    // the preview's stand-in friend points at the second call after a breath, and walks with the player
    if (X.preview && !st) { /* handled in index.js stand-in */ }

    if (st) {
      const me = X.player(), o = other(), q = o && X.peerPos(o), e = t - st.t0;
      const mid = q && me ? lerpPlayer(me, q, 0.5) : me;
      if (st.phase === "lift") {
        const u = reduce ? 1 : Math.min(1, e / Math.max(0.2, TUNE.lift));
        lantern.g.visible = true; if (mid) lantern.g.position.set(mid.x, 0.35 + u * 0.95, mid.z);
        if (e > Math.max(TUNE.fade, TUNE.lift) + 0.2) { st.phase = "walk"; X.meState.target = walkTarget(); }
      } else if (st.phase === "walk") {
        lantern.g.visible = true; if (mid) lantern.g.position.set(mid.x, 1.25 + Math.sin(t * 2.2) * 0.04, mid.z);
        if (!X.meState.target && me && Math.hypot(me.x - STONE.x, me.z - STONE.z) > 1.0) X.meState.target = walkTarget();
        if (me && Math.hypot(me.x - STONE.x, me.z - STONE.z) < 1.15) { if (st.arrivedAt === null) st.arrivedAt = t; const together = q && Math.hypot(q.x - STONE.x, q.z - STONE.z) < 2.3; if (together || t - st.arrivedAt > WAIT_PEER_S) { st.phase = "float"; st.f0 = t; } }
      } else if (st.phase === "float") {
        const u = reduce ? 1 : Math.min(1, (t - st.f0) / FLOAT_S), th = threads[st.k];
        const from = new THREE.Vector3(STONE.x, 1.3, STONE.z + 0.3);
        // from the stone the lantern follows the thread's far half out over the valley to the place
        const curve = new THREE.QuadraticBezierCurve3(from, new THREE.Vector3(from.x * 0.5 + PLACES[st.idx].x * 0.5, 3.6, from.z * 0.3 + PLACES[st.idx].z * 0.7), new THREE.Vector3(PLACES[st.idx].x, -12.2, PLACES[st.idx].z));
        const pt = curve.getPoint(u); lantern.g.position.copy(pt); lantern.halo.material.opacity = 0.8 * (1 - 0.7 * u);
        void th;
        if (u >= 1) { st.phase = "done"; lantern.g.visible = false; lantern.halo.material.opacity = 0.8; if (!st.wrote) { st.wrote = true; carried(st); } }
      }
      lantern.light.intensity = 3.5 + Math.sin(t * 3) * 0.4;
    } else lantern.g.visible = false;
  }

  /* The call is written by one of the two (the lower id), so a night leaves one record, whoever is faster. */
  function carried(s) {
    const a = X.me(), b = other();
    if (!b) return;
    if (a < b) X.write("items/call-" + day, "set", { kind: "call", by: a, pair: [a, b], day, place: s.idx, at: X.now() });
  }

  function dispose() { setExtraWalk([]); scene.remove(G); scene.remove(lantern.g); }
  const toStone = () => { X.meState.target = new THREE.Vector3(STONE.x, 0, STONE.z); };
  return {
    frame, moment, dispose, point, toStone,
    view: () => ({ day, calls: calls.slice(), myPt, theirPt: theirPt(), state: st ? st.phase : null, mouth: atMouth(), hasCall: !!dayCall(), lit: litPlaces(X.items()) }),
    _force: (k) => { myPt = k; },
    _hash: hash,
  };
}
