// Brush in hand, round 1: the writing table, the strip, the ember dish and the beats of the stroke. The figure stands at
// a low writing table (standing calligraphy, the way large characters are written) so the robe hangs as it was cut;
// the seated hearth pose is the next step (named in the round's art direction).
import * as THREE from 'three';
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

export const INK = { water: 0x2f6fd0, wet: 0x6aa8f0, set: 0x1f4f96 };
const sm = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b);

export function setScene(X, BR, opt = {}) {
  const F = X.F, { f, l } = F.fr, k = F.stature / 1.75, up = V(0, 1, 0), r = l.clone().negate();
  const words = opt.words || 'I asked for help';
  // table: lacquered dark wood, near edge 24 cm in front of the body
  // round 4: seated, a low writing board (a kneeling desk's height) between the cushion and the hearth
  // round 5, kneeling: the hips sit on the heels, higher than on the cushion; the board rises by the same amount (rise) so
  // the arm keeps round 3's reach, and the kneeling knees fit under its top between its legs (opt.seat.desk overrides)
  const rise = opt.seat?.rise ?? 0, D = opt.seat?.desk || {};
  const yS = opt.seat ? 0.56 : 1, ht = opt.seat ? (D.ht ?? 0.30 * k + rise + (rise ? 0.03 * k : 0)) : 0.88 * k, near = opt.seat ? (D.near ?? (rise ? 0.22 : 0.17) * k) : 0.08 * k, depth = 0.42 * k, wid = (opt.seat ? 0.8 : 0.95) * k;
  const C = (opt.seat ? opt.seat.at.clone().setY(0) : V()).addScaledVector(f, near + depth / 2).addScaledVector(r, 0.06 * k);
  const basis = new THREE.Matrix4().makeBasis(l, up, f); // table frame: x to the figure's left, z away from the figure
  const T = new THREE.Group(); T.position.copy(C); T.quaternion.setFromRotationMatrix(basis); X.scene.add(T);
  const wood = new THREE.MeshStandardMaterial({ color: 0x3b2418, roughness: 0.42 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(wid, 0.035 * k, depth), wood); top.position.y = ht - 0.0175 * k; T.add(top);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05 * k, ht - 0.035 * k, 0.05 * k), wood); leg.position.set(sx * (wid / 2 - 0.05 * k), (ht - 0.035 * k) / 2, sz * (depth / 2 - 0.05 * k)); T.add(leg); }
  // felt under the paper
  const felt = new THREE.Mesh(new THREE.BoxGeometry(0.30 * k, 0.003 * k, 0.40 * k), new THREE.MeshStandardMaterial({ color: 0x2b2b30, roughness: 0.95 })); felt.position.set(0.03 * k, ht + 0.0015 * k, -0.03 * k); T.add(felt);
  // the strip (the BAR): a talisman card, cream yellow, cinnabar frame; head away from the figure
  const SW = 0.10 * k, SL = 0.28 * k, cv = document.createElement('canvas'); cv.width = 360; cv.height = 1008; const cx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(SW, SL), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
  strip.rotation.x = -Math.PI / 2; strip.rotation.z = Math.PI; strip.position.set(0.03 * k, ht + 0.0035 * k, -0.03 * k); T.add(strip);
  // strip uv (u across, v from the head 0 to the foot 1) -> world
  const stripW = (u, v) => strip.localToWorld(V((u - 0.5) * SW, (0.5 - v) * SL, 0));
  // the stroke the figure writes (canvas units, with pressure): one vertical with a hook at its foot, under the words.
  // Round 2 writes it as a calligrapher does: the tip goes in against the stroke (cang feng, the hidden tip), turns and
  // presses, travels down, stops and presses at the foot (dun), then springs up and left into the hook and leaves the
  // paper still moving.
  const KEYS = [[182, 402, 0.25], [181, 380, 0.55], [184, 392, 1.0], [183, 470, 0.88], [181, 620, 0.82], [180, 760, 0.86], [180, 832, 1.05], [176, 842, 1.0], [150, 812, 0.45], [128, 794, 0.06]];
  const path = []; for (let i = 0; i < KEYS.length - 1; i++) { const [x0, y0, p0] = KEYS[i], [x1, y1, p1] = KEYS[i + 1], n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 6)); for (let j = 0; j < n; j++) { const u = j / n; path.push([x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, p0 + (p1 - p0) * u]); } }
  path.push(KEYS[KEYS.length - 1]);
  const cum = [0]; for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const LEN = cum[cum.length - 1], sOfKey = i => { let L = 0; for (let j = 0; j < i; j++) L += Math.hypot(KEYS[j + 1][0] - KEYS[j][0], KEYS[j + 1][1] - KEYS[j][1]); return L / LEN; };
  const at_s = s => { const L = THREE.MathUtils.clamp(s, 0, 1) * LEN; let i = 1; while (i < cum.length - 1 && cum[i] < L) i++; const u = (L - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]); const a = path[i - 1], b = path[i]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, i]; };
  function paint(s, wet) {
    cx.fillStyle = '#ead9a2'; cx.fillRect(0, 0, 360, 1008);
    const g = cx.createRadialGradient(180, 500, 50, 180, 500, 620); g.addColorStop(0, 'rgba(255,248,220,0.25)'); g.addColorStop(1, 'rgba(120,80,30,0.18)'); cx.fillStyle = g; cx.fillRect(0, 0, 360, 1008);
    cx.strokeStyle = '#b8322a'; cx.lineWidth = 10; cx.strokeRect(14, 14, 332, 980); cx.lineWidth = 3; cx.strokeRect(30, 30, 300, 948);
    cx.fillStyle = '#3a2a22'; cx.font = '600 40px "Iowan Old Style", Georgia, serif'; cx.textAlign = 'center';
    const ws = words.split(' '), lines = []; let ln = ''; for (const w of ws) { if ((ln + ' ' + w).trim().length > 12) { lines.push(ln.trim()); ln = w; } else ln += ' ' + w; } lines.push(ln.trim());
    lines.forEach((t, i) => cx.fillText(t, 180, 110 + i * 52));
    const n = s >= 1 ? path.length - 1 : s <= 0 ? -1 : at_s(s)[3] - 1;
    const col = wet ? '#4f8fe0' : '#1f4f96';
    for (let i = 0; i <= n; i++) { const [x, y, p] = path[i]; const rr = 4 + 17 * p; cx.fillStyle = col; cx.globalAlpha = 0.9; cx.beginPath(); cx.ellipse(x, y, rr, rr * 0.8, 0, 0, Math.PI * 2); cx.fill();
      if (i > 0) { const [x0, y0, p0] = path[i - 1]; cx.lineWidth = 2 * (4 + 17 * Math.min(p, p0)) * 0.9; cx.strokeStyle = col; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x, y); cx.stroke(); } }
    cx.globalAlpha = 1;
    if (s >= 1 && !wet) { cx.strokeStyle = '#b8322a'; cx.lineWidth = 6; cx.strokeRect(140, 900, 80, 80); cx.fillStyle = '#c9a23a'; cx.beginPath(); cx.arc(180, 940, 26, 0, Math.PI * 2); cx.fill(); cx.fillStyle = '#ead9a2'; cx.fillRect(170, 930, 20, 20); }
    tex.needsUpdate = true;
  }
  // the ember dish at the paper's right: a stone dish with the kept Water ember, its light the ink's
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.045 * k, 0.035 * k, 0.022 * k, 24), new THREE.MeshStandardMaterial({ color: 0x55504a, roughness: 0.8 })); dish.position.set(-0.15 * k, ht + 0.011 * k, -0.02 * k); T.add(dish);
  const ember = new THREE.Mesh(new THREE.SphereGeometry(0.017 * k, 18, 12), new THREE.MeshStandardMaterial({ color: 0xbfe0ff, emissive: INK.water, emissiveIntensity: 2.2 })); ember.scale.y = 0.6; ember.position.set(-0.15 * k, ht + 0.026 * k, -0.02 * k); T.add(ember);
  const glow = new THREE.PointLight(INK.wet, 0.25, 0.6 * k, 2); glow.position.set(-0.15 * k, ht + 0.06 * k, -0.02 * k); T.add(glow);
  const emberW = () => ember.getWorldPosition(V());
  const brush = BR.makeBrush(k, INK.water); X.scene.add(brush);
  X.scene.add(new THREE.HemisphereLight(0xfff1dc, 0x3a2a20, 0.25));
  T.updateMatrixWorld(true);
  const leftAt = stripW(0.5, 0.32).addScaledVector(l, 0.115 * k);
  const below = 0.12 * k;
  // The beats, t from 0 to 1, timed as an animator would (research-2.md): every move eases in and out and travels on an
  // arc; the brush pauses over the paper before it lands (anticipation); the stroke is slow at the entry, steady down
  // the body, stops at the foot, and the hook is the fastest move in it; the lift carries on past the paper (follow
  // through). 0 to 0.08 the brush held ready; to 0.16 down to the ember; to 0.28 the dip, pressing and rolling the hair
  // to a point; to 0.38 the arc to the paper; to 0.43 the pause; to 0.88 the stroke; to 1 the lift and the rest.
  const E = x => x * x * (3 - 2 * x), seg = (t, a, b) => THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
  const surf = () => stripW(0.5, 0.5).y;
  const restP = () => emberW().addScaledVector(up, 0.11 * k).addScaledVector(l, 0.05 * k).addScaledVector(f, -0.02 * k);
  const onPaper = (x, y) => stripW(x / 360, y / 1008);
  const entry = () => onPaper(KEYS[0][0], KEYS[0][1]).addScaledVector(up, 0.045 * k);
  // the stroke's clock: keyed arc length against time, so the speed changes where a brush's would
  const sK = [sOfKey(0), sOfKey(2), sOfKey(5), sOfKey(6), sOfKey(7), 1];
  const TK = [0.43, 0.53, 0.75, 0.80, 0.83, 0.88];
  const strokeS = t => { for (let i = 0; i < TK.length - 1; i++) if (t <= TK[i + 1]) { const u = seg(t, TK[i], TK[i + 1]); return sK[i] + (sK[i + 1] - sK[i]) * (i === 4 ? u * (2 - u) : i === 0 || i === 2 ? E(u) : u); } return 1; };
  function pose(t) { // -> { tip, press, s, roll }
    if (t < 0.08) { return { tip: restP().addScaledVector(up, 0.006 * k * Math.sin(t / 0.08 * Math.PI)), press: 0, s: 0 }; }
    if (t < 0.16) { const u = E(seg(t, 0.08, 0.16)); return { tip: restP().lerp(emberW().addScaledVector(up, 0.012 * k), u).addScaledVector(r, 0.02 * k * Math.sin(Math.PI * u)), press: 0, s: 0 }; }
    if (t < 0.28) { const u = seg(t, 0.16, 0.28), dn2 = Math.sin(Math.PI * Math.min(1, u * 1.3)), ang = u * Math.PI * 4;
      const tip = emberW().addScaledVector(up, 0.012 * k - 0.016 * k * dn2).addScaledVector(l, 0.007 * k * Math.cos(ang) * dn2).addScaledVector(f, 0.007 * k * Math.sin(ang) * dn2);
      return { tip, press: 0.7 * dn2, s: 0, roll: [ang, 0.16 * dn2] }; }
    if (t < 0.38) { const u = E(seg(t, 0.28, 0.38)); const p = emberW().addScaledVector(up, 0.012 * k).lerp(entry(), u); return { tip: p.addScaledVector(up, 0.07 * k * Math.sin(Math.PI * u)), press: 0, s: 0 }; }
    if (t < 0.43) { const u = seg(t, 0.38, 0.43); return { tip: entry().addScaledVector(up, -0.03 * k * E(u) + 0.004 * k * Math.sin(Math.PI * u)), press: 0, s: 0 }; }
    if (t < 0.88) { const s = strokeS(t), [x, y, p] = at_s(s); return { tip: onPaper(x, y).addScaledVector(up, 0.0035 * k - 0.034 * k * 0.15 * p - 0.003 * k * p), press: p, s }; }
    const u = seg(t, 0.88, 1), e = KEYS[KEYS.length - 1], d = V().subVectors(onPaper(e[0], e[1]), onPaper(KEYS[7][0], KEYS[7][1])).normalize();
    const out = onPaper(e[0], e[1]).addScaledVector(d, 0.05 * k * (1 - Math.pow(1 - Math.min(1, u * 2), 2))).addScaledVector(up, 0.012 * k * u * 4);
    return { tip: out.lerp(restP(), E(seg(t, 0.94, 1))), press: Math.max(0, 0.06 - u), s: 1 };
  }
  function at(t) {
    const P = pose(t), Pb = pose(Math.max(0, t - 0.012)), Pl = pose(Math.max(0, t - 0.045));
    const v = P.tip.clone().sub(Pb.tip); v.y = 0; const sp = v.length() / (0.012 * k), vh = sp > 1e-4 ? v.normalize() : V();
    // the shaft's top leads the travel a few degrees (the hand drags the point); in the dip it rolls round to load the hair
    let dir = up.clone().addScaledVector(vh, Math.min(0.13, 0.05 * sp));
    if (P.roll) dir = up.clone().addScaledVector(l, Math.cos(P.roll[0]) * P.roll[1]).addScaledVector(f, Math.sin(P.roll[0]) * P.roll[1]);
    // round 3, the whole body writes: the lean deepens as the stroke runs down the paper and with the press, the chest
    // turns toward the dish for the dip, and the weight goes over the writing side as the brush presses
    const dipW = Math.sin(Math.PI * seg(t, 0.1, 0.3)), run = E(seg(t, 0.43, 0.88)) * (1 - E(seg(t, 0.9, 1)));
    const lean = (opt.seat ? -0.03 : 0) + 0.17 + 0.07 * run + 0.04 * (P.press || 0) + 0.03 * dipW;
    BR.writePose(F, P.tip, { brush, seat: opt.seat, leftAt, below, dir, press: P.press, look: Pl.tip, lean, turn: 0.06 + 0.06 * dipW + 0.03 * (P.press || 0), shift: 0.008 + 0.012 * (P.press || 0) + 0.006 * dipW });
    BR.hairPress(brush, P.press, vh.clone().multiplyScalar(-0.5 * P.press * Math.min(1, sp * 3)));
    paint(P.s, t < 0.95);
    F.root.updateMatrixWorld(true);
  }
  // cameras by name, aimed at the hand or the figure
  function cam(name, aspect) {
    const hand = BR.pinch(F), mid = (opt.seat ? opt.seat.at.clone().setY(0) : V()).add(V(0, 1.0 * k * yS + rise, 0)).addScaledVector(f, 0.2 * k);
    const c = new THREE.PerspectiveCamera(24, aspect, 0.02, 30);
    const set = (pos, tgt, fov) => { c.fov = fov; c.position.copy(pos); c.lookAt(tgt); c.updateProjectionMatrix(); c.updateMatrixWorld(true); return c; };
    if (name === 'wide') return set(mid.clone().addScaledVector(f, 2.6 * k).addScaledVector(r, 1.9 * k).addScaledVector(up, 0.35 * k), mid.clone().addScaledVector(up, -0.1 * k), 30);
    if (name === 'side') return set(hand.clone().addScaledVector(r, 1.1 * k).addScaledVector(f, 0.25 * k).addScaledVector(up, 0.2 * k), hand.clone().addScaledVector(up, -0.06 * k), 24);
    if (name === 'hand') return set(hand.clone().addScaledVector(r, 0.34 * k).addScaledVector(f, 0.22 * k).addScaledVector(up, 0.05 * k), hand.clone().addScaledVector(up, -0.05 * k), 26);
    if (name === 'handf') return set(hand.clone().addScaledVector(f, 0.38 * k).addScaledVector(r, 0.08 * k).addScaledVector(up, 0.10 * k), hand.clone().addScaledVector(up, -0.05 * k), 26);
    if (name === 'profile') return set(mid.clone().addScaledVector(r, 2.7 * k).addScaledVector(f, 0.35 * k).addScaledVector(up, 0.25 * k), mid.clone().addScaledVector(f, 0.15 * k).addScaledVector(up, -0.05 * k), 30);
    if (name === 'three') return set(mid.clone().addScaledVector(f, 2.0 * k).addScaledVector(r, 1.5 * k).addScaledVector(up, 0.55 * k), mid.clone().addScaledVector(f, 0.15 * k).addScaledVector(up, -0.05 * k), 30);
    if (name === 'front') return set(mid.clone().addScaledVector(f, 2.6 * k).addScaledVector(up, 0.3 * k), mid.clone().addScaledVector(up, -0.05 * k), 30);
    if (name === 'grip') return set(hand.clone().addScaledVector(f, 0.26 * k).addScaledVector(l, 0.2 * k).addScaledVector(up, 0.08 * k), hand.clone().addScaledVector(up, -0.04 * k), 30);
    if (name === 'paper') return set(stripW(0.5, 0.5).addScaledVector(f, 0.42 * k).addScaledVector(r, 0.12 * k).addScaledVector(up, 0.42 * k), stripW(0.5, 0.5).addScaledVector(up, 0.05 * k), 34);
    { const sh = F.bones.shoulderR.getWorldPosition(V()), ch = (opt.seat ? opt.seat.at.clone().setY(0) : V()).add(V(0, 1.3 * k * yS + rise, 0));
      if (name === 'hdown') return set(hand.clone().addScaledVector(up, 0.32 * k).addScaledVector(r, 0.03 * k).addScaledVector(f, -0.04 * k), hand, 30);
      if (name === 'hpalm') return set(hand.clone().addScaledVector(l, 0.30 * k).addScaledVector(f, 0.12 * k).addScaledVector(up, 0.06 * k), hand.clone().addScaledVector(up, -0.03 * k), 30);
      if (name === 'hfront') return set(hand.clone().addScaledVector(f, 0.34 * k).addScaledVector(r, 0.12 * k).addScaledVector(up, 0.02 * k), hand.clone().addScaledVector(up, -0.03 * k), 30);
      if (name === 'shf') return set(sh.clone().addScaledVector(f, 0.55 * k).addScaledVector(l, 0.15 * k).addScaledVector(up, 0.05 * k), sh.clone().addScaledVector(up, -0.08 * k).addScaledVector(l, 0.06 * k), 30);
      if (name === 'shoulder') return set(sh.clone().addScaledVector(r, 0.75 * k).addScaledVector(f, 0.55 * k).addScaledVector(up, 0.25 * k), sh.clone().addScaledVector(up, -0.12 * k).addScaledVector(f, 0.1 * k), 30);
      if (name === 'back') return set(ch.clone().addScaledVector(f, -2.4 * k).addScaledVector(r, 1.0 * k).addScaledVector(up, 0.2 * k), ch.clone().addScaledVector(up, -0.35 * k), 30);
      if (name === 'top') return set(sh.clone().addScaledVector(up, 0.9 * k).addScaledVector(r, 0.35 * k).addScaledVector(f, -0.25 * k), sh.clone().addScaledVector(f, 0.15 * k).addScaledVector(up, -0.2 * k), 40);
      if (name === 'fullf') return set(V(0, 0.95 * k * yS, 0).addScaledVector(f, 3.2 * k).addScaledVector(r, 0.9 * k).addScaledVector(up, 0.3 * k), V(0, 0.9 * k * yS, 0), 33);
      if (name === 'fulls') return set(V(0, 0.95 * k * yS, 0).addScaledVector(r, 3.3 * k).addScaledVector(f, 0.2 * k).addScaledVector(up, 0.2 * k), V(0, 0.9 * k * yS, 0).addScaledVector(f, 0.1 * k), 33);
    }
    // round 4, the Nook: over the shoulder with the fire beyond, the side from the writing hand, three-quarter from the left
    { const base = opt.seat ? opt.seat.at.clone().setY(0) : V(), hd = V(0, 0.75 * k + rise, 0).add(base);
      if (name === 'nook') return set(hd.clone().addScaledVector(f, -1.35 * k).addScaledVector(r, 0.75 * k).addScaledVector(up, 0.55 * k), hd.clone().addScaledVector(f, 0.55 * k).addScaledVector(up, -0.3 * k), 38);
      if (name === 'nside') return set(hd.clone().addScaledVector(r, 2.4 * k).addScaledVector(f, 0.25 * k).addScaledVector(up, -0.05 * k), hd.clone().addScaledVector(f, 0.2 * k).addScaledVector(up, -0.28 * k), 30);
      if (name === 'nthree') return set(hd.clone().addScaledVector(f, 1.25 * k).addScaledVector(l, 1.75 * k).addScaledVector(up, 0.2 * k), hd.clone().addScaledVector(f, 0.12 * k).addScaledVector(up, -0.28 * k), 32);
      if (name === 'nback') return set(hd.clone().addScaledVector(f, -2.3 * k).addScaledVector(l, 0.9 * k).addScaledVector(up, 0.1 * k), hd.clone().addScaledVector(up, -0.3 * k), 30);
      if (name === 'nlap') return set(hd.clone().addScaledVector(f, 1.0 * k).addScaledVector(r, 0.9 * k).addScaledVector(up, 0.55 * k), hd.clone().addScaledVector(f, 0.15 * k).addScaledVector(up, -0.5 * k), 34); }
    if (name === 'over') return set(V(0, 1.75 * k * yS, 0).addScaledVector(f, -0.2 * k).addScaledVector(r, 0.5 * k), stripW(0.5, 0.5), 34);
    return set(mid.clone().addScaledVector(f, 2.4 * k).addScaledVector(r, 0.5 * k).addScaledVector(up, 0.4 * k), mid, 30);
  }
  M_legs(X);
  return { at, cam, brush, F, table: T, pose, surf };
}
// round 3: the body's skin under a long sleeve's root (the armpit and the front of the shoulder) is not drawn while the
// figure writes. The shells were cut at the stand pose; with the arm brought forward across the chest his pectoral
// showed through the seam between the sleeve and the body (named open in round 2). The skin there is always under cloth
// in A1 and A2 (sleeves to the wrist), so leaving it out cannot show a hole; the neckline's V is kept by staying 9 cm
// (scaled) or more out from the body's midline (the chest's sides from 8.8 cm; a triangle goes when two of its corners are under the sleeve).
function M_legs(X) {
  const F = X.F, G = F.mesh.geometry, P = G.attributes.position, SI = G.attributes.skinIndex, SW = G.attributes.skinWeight;
  const k = F.stature / 1.75, BM = F.mesh.bindMatrix, names = F.mesh.skeleton.bones.map(b => b.name), l = F.fr.l, p = V();
  const arm = new Set(['shoulderL', 'shoulderR', 'clavL', 'clavR'].map(n => names.indexOf(n))), chest = new Set(['spine03', 'spine'].map(n => names.indexOf(n)));
  const hide = new Uint8Array(P.count);
  for (let i = 0; i < P.count; i++) { let w = 0; for (let j = 0; j < 4; j++) if (arm.has(SI.getComponent(i, j))) w += SW.getComponent(i, j);
    p.fromBufferAttribute(P, i).applyMatrix4(BM); const lat = Math.abs(p.dot(l));
    if (w >= 0.05 && lat > 0.09 * k && p.y < 1.52 * k && p.y > 1.05 * k) hide[i] = 1;
    else if (chest.has(SI.getComponent(i, 0)) && lat > 0.088 * k && p.y < 1.40 * k && p.y > 1.12 * k) hide[i] = 1; }
  const I = G.index.array, keep = []; for (let t = 0; t < I.length; t += 3) if (hide[I[t]] + hide[I[t + 1]] + hide[I[t + 2]] < 2) keep.push(I[t], I[t + 1], I[t + 2]);
  F.hiddenUnderSleeve = (I.length - keep.length) / 3; G.setIndex(keep);
}
