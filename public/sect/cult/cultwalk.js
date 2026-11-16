// Heaven round 19: the cultivation figure as heaven's avatar, walking with planted feet. Wendell answered cc-heaven-r18
// A: "we need to use the cultivation figure not the dusk figure and adjust the steps to that that figure can walk the
// distances and walk the steps with a step walking animation". The figure is the gate rounds' (mix.js build, the
// shells and accessories, motion.js's springs); this module adds a live stride wheel that follows the avatar group
// walk.js moves:
// - the phase comes from the distance walked, one cycle per two steps, each foot on the ground 60% of the cycle;
// - a planted foot stays fixed where it landed (on the stair, the middle of its tread) until it lifts;
// - a swinging foot moves from plant to plant on a smoothstep, lifted over the higher of its two treads plus
//   sin(pi s) * 8 cm;
// - two-bone IK (ik2, from the gate's anim.js) bends hip, knee and ankle to each foot;
// - the root rides at the lower of its standing height and what each planted foot can reach at 0.985 leg length;
// - the arms swing against the legs.
import * as THREE from 'three';
import * as FG from './figure.js';
import * as M from './mix.js';
import * as MO from './motion.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const wp = b => b.getWorldPosition(V());
const ramp = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const UP = V(0, 1, 0), DN = V(0, -1, 0);

// two-bone IK (the gate's anim.js, round 13): bends a and b so the end bone c reaches T, the middle joint toward P
export const ik2 = (F, a, b, c, T, P) => { F.root.updateMatrixWorld(true); const A = wp(F.bones[a]), B = wp(F.bones[b]), C = wp(F.bones[c]);
  const la = B.distanceTo(A), lb = C.distanceTo(B), d0 = T.clone().sub(A), d = THREE.MathUtils.clamp(d0.length(), Math.abs(la - lb) + 1e-3, (la + lb) * 0.999), u = d0.normalize();
  const ca = THREE.MathUtils.clamp((la * la + d * d - lb * lb) / (2 * la * d), -1, 1), w = P.clone().addScaledVector(u, -P.dot(u)); if (w.lengthSq() < 1e-8) return; w.normalize();
  const B1 = A.clone().addScaledVector(u, la * ca).addScaledVector(w, la * Math.sqrt(1 - ca * ca)); FG.aim(F, a, b, B1.clone().sub(A)); FG.aim(F, b, c, A.clone().addScaledVector(u, d).sub(B1)); };

export const GAIT = { step: 0.62, duty: 0.6, lift: 0.06, reach: 0.985, bob: 0.025, sway: 0.02, turn: 8 };
// Round 30: the run (pace 1 at RUN.speed m/s) and the jump's tuck. A lane tunes these against movecheck.js.
export const RUN = { walk: 1.3, speed: 4.2, stride: 1.75, duty: 0.36, lift: 0.17, bob: 0.045, lean: 0.14, arm: 1.6, elbow: 0.5, tuck: 0.16, land: 0.07 };
export const MIX = { gender: 'm', build: 'average', skin: 3, height: 1.75, direction: 'B', outfit: 'B2' }; // the gate rounds' mix

// build the figure into `parent` (heaven's scene) and return { update(dt), X }. `body` is the avatar group walk.js
// moves (its position is the ground under the walker, rotation.y its heading); groundAt(x, z) and tread(x, z) (the
// middle of the stair tread under a point, or null) come from heaven.
export async function cultWalker(parent, body, { groundAt, tread, stepOn = () => GAIT.step }) {
  const reg = await (await fetch(new URL('parts.json', import.meta.url))).json();
  const X = await M.build(MIX, reg), F = X.F;
  // the figure's own studio lights stay behind; everything else moves into a group in heaven's scene, at the origin, so
  // the garments' world-space points (M.partWorld) are heaven's coordinates
  const G = new THREE.Group(); G.name = 'cultFigure'; parent.add(G);
  for (const o of [...X.scene.children]) { if (o.isLight) continue; G.add(o); }
  X.scene = G; G.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  const { f, l } = F.fr, q = new THREE.Quaternion(), legs = [['L', 1, 0], ['R', -1, 0.5]];

  // measure the stand: legs straight down, arms hanging
  const standLegs = () => { FG.resetPose(F); F.root.quaternion.identity(); F.root.updateMatrixWorld(true);
    for (const [s, sg] of legs) { FG.aim(F, 'hip' + s, 'knee' + s, V().copy(DN).addScaledVector(l, sg * 0.045)); FG.aim(F, 'knee' + s, 'ankle' + s, V().copy(DN).addScaledVector(l, sg * 0.03)); } };
  standLegs(); F.mesh.skeleton.update();
  let low = 1e9; { const P = F.mesh.geometry.attributes.position, v = V(); for (let i = 0; i < P.count; i += 3) { v.fromBufferAttribute(P, i); F.mesh.applyBoneTransform(i, v); v.applyMatrix4(F.mesh.matrixWorld); low = Math.min(low, v.y); } }
  const soleH = Math.min(wp(F.bones.ankleL).y, wp(F.bones.ankleR).y) - low, standY = -low;
  const K = {}; for (const [s] of legs) { const h = wp(F.bones['hip' + s]), k = wp(F.bones['knee' + s]), a = wp(F.bones['ankle' + s]), b = wp(F.bones['ball' + s]);
    K[s] = { hip: h, leg: h.distanceTo(k) + k.distanceTo(a), lat: a.dot(l), ball: b.clone().sub(a).normalize() }; }
  const mid = wp(F.bones.ankleL).add(wp(F.bones.ankleR)).multiplyScalar(0.5); mid.y = 0; // root xz from the feet's midpoint

  const live = MO.live(X);
  const st = { yaw: null, ph: 0, amp: 0, Y: null, last: null, moving: false, idle: 0, pace: 0, air: false, land: 1 };
  const feet = Object.fromEntries(legs.map(([s]) => [s, { P: V(), from: V(), to: V(), swing: false, heel: 0 }]));
  const fwOf = yaw => V(-Math.sin(yaw), 0, -Math.cos(yaw)), lsign = Math.sign(V().crossVectors(f, UP).dot(l)) || 1; // which side of f x up the figure's l sits
  const lftOf = fw => V().crossVectors(fw, UP).multiplyScalar(lsign); // the figure's left, for heading fw
  const yawQ = yaw => q.setFromAxisAngle(UP, Math.atan2(-Math.sin(yaw), -Math.cos(yaw)) - Math.atan2(f.x, f.z));
  // a foot's ankle point on the ground at (x, z): on the stair the foot's middle goes to the middle of its tread
  const plant = (out, x, z, fw) => { const c = tread ? tread(x + fw.x * 0.07, z + fw.z * 0.07) : null;
    if (c) return out.set(c[0] - fw.x * 0.07, c[2], c[1] - fw.z * 0.07); return out.set(x, groundAt(x, z), z); };
  const home = (s, p, fw, lw, ahead = 0) => plant(V(), p.x + lw.x * K[s].lat + fw.x * ahead, p.z + lw.z * K[s].lat + fw.z * ahead, fw);
  const reset = () => { const p = body.position, yaw = body.rotation.y, fw = fwOf(yaw); st.yaw = yaw; st.ph = 0; st.Y = null;
    for (const [s] of legs) { const ft = feet[s]; ft.P.copy(home(s, p, fw, lftOf(fw))); ft.swing = false; } live.reset(); };

  function update(dt) {
    if (api.hold) return; // a still: the pose stays as the last frame left it
    const p = body.position;
    if (!st.last || st.last.distanceTo(p) > 2) { st.last = p.clone(); reset(); }
    const dxz = Math.hypot(p.x - st.last.x, p.z - st.last.z); st.last.copy(p);
    // heading eases round to the body's
    let dy = body.rotation.y - st.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); st.yaw += dy * Math.min(1, dt * GAIT.turn);
    const fw = fwOf(st.yaw), lft = lftOf(fw);
    const walking = dxz > 1e-4; st.idle = walking ? 0 : st.idle + dt;
    const mv = body.userData.m, air = !!(mv && mv.air), sp = dt > 0 ? dxz / dt : 0;
    st.pace += (THREE.MathUtils.clamp((sp - RUN.walk) / (RUN.speed - RUN.walk), 0, 1) - st.pace) * Math.min(1, dt * 5);
    if (st.air && !air) { st.land = 0; for (const [s] of legs) { const ft = feet[s]; ft.P.copy(home(s, p, fw, lft)); ft.swing = false; } }
    st.air = air; st.land = Math.min(1, st.land + dt * 4);
    const pc = st.pace, duty = GAIT.duty + (RUN.duty - GAIT.duty) * pc, lift = GAIT.lift + (RUN.lift - GAIT.lift) * pc;
    st.amp += ((walking ? 1 : 0) - st.amp) * Math.min(1, dt * 6);
    const C = 2 * stepOn(p.x, p.z) * (1 + (RUN.stride - 1) * pc);
    if (walking) st.ph += dxz / C;
    else if (Object.values(feet).some(ft => ft.swing)) st.ph += dt * 1.4; // stopping: the swinging foot comes down beside the other
    yawQ(st.yaw);
    // each foot: planted, or swinging from its plant to the next
    const T = {};
    for (const [s, sg, off] of legs) {
      const ft = feet[s], phi = ((st.ph + off) % 1 + 1) % 1, swing = phi >= duty;
      const ahead = walking ? ((1 - phi) + duty / 2) * C : 0, aim = home(s, p, fw, lft, ahead);
      if (swing && !ft.swing) { ft.from.copy(ft.P); ft.swing = true; }
      if (!swing && ft.swing) { ft.P.copy(ft.to); ft.swing = false; }
      if (!walking && !ft.swing && st.idle > 0.6 && ft.P.distanceTo(aim) > 0.18) { ft.from.copy(ft.P); ft.to.copy(aim); ft.P.copy(aim); } // a long stop: no foot left trailing
      let at;
      if (ft.swing) { ft.to.copy(aim); const u = (phi - duty) / (1 - duty), e = u * u * (3 - 2 * u), y0 = ft.from.y, y1 = ft.to.y;
        const k = y1 > y0 ? ramp(0.02, 0.62, u) : ramp(0.4, 0.98, u); // up a stair the foot rises ahead of its travel so the toe clears the nosing
        at = ft.from.clone().lerp(ft.to, e); at.y = y0 + (y1 - y0) * k + Math.sin(Math.PI * u) * lift * Math.max(0.3, st.amp); ft.u = u; }
      else { at = ft.P.clone(); ft.u = 0; ft.heel = 0.1 * ramp(0.3, duty, phi) * st.amp; at.y += ft.heel; } // late in stance the heel lifts off (toe-off), so the back leg reaches up a steep stair
      if (air) { at = home(s, p, fw, lft, (s === 'L' ? 0.12 : -0.06) * (0.4 + pc)); at.y = p.y + RUN.tuck; } // in the air the feet tuck under the body
      T[s] = at.add(V(0, soleH, 0));
    }
    // the root: standing height over the feet, no higher than each planted foot can reach
    const rootXZ = p.clone().sub(mid.clone().applyQuaternion(q)); rootXZ.y = 0;
    const sway = GAIT.sway * st.amp * Math.sin(2 * Math.PI * st.ph); rootXZ.addScaledVector(lft, sway);
    const ground = air ? p.y : (T.L.y + T.R.y) / 2 - soleH, bob = (air ? 0 : (GAIT.bob + (RUN.bob - GAIT.bob) * pc) * st.amp) + RUN.land * Math.sin(Math.PI * st.land) * (st.land < 1 ? 1 : 0) * 0.5 * (1 - Math.cos(4 * Math.PI * st.ph));
    let Yc = 1e9, Ys = 1e9;
    for (const [s] of legs) { const h = K[s].hip.clone().applyQuaternion(q).add(rootXZ), d = Math.hypot(h.x - T[s].x, h.z - T[s].z), r = K[s].leg * GAIT.reach;
      const y = T[s].y + Math.sqrt(Math.max(0, r * r - d * d)) - K[s].hip.y; if (air) continue; if (feet[s].swing) Ys = Math.min(Ys, y + 0.06); else Yc = Math.min(Yc, y); }
    const want = Math.min(ground + standY - bob, Yc, Ys);
    st.Y = st.Y == null ? want : st.Y + (want - st.Y) * Math.min(1, dt * 14); if (air) st.Y = want; const Y = Math.min(st.Y, Yc);
    // the pose: arms swing against the legs, then the legs reach for their feet
    FG.resetPose(F); F.root.quaternion.copy(q).premultiply(new THREE.Quaternion().setFromAxisAngle(lft, -RUN.lean * pc * st.amp)); F.root.position.set(rootXZ.x, Y, rootXZ.z); F.root.updateMatrixWorld(true);
    const arm = (sg, out, fwd) => V().copy(DN).addScaledVector(lft, sg * out).addScaledVector(fw, fwd);
    for (const [s, sg, off] of legs) { const phi = ((st.ph + off) % 1 + 1) % 1, sw = Math.cos(2 * Math.PI * (phi - 0.15)) * st.amp * (1 + (RUN.arm - 1) * pc);
      FG.aim(F, 'shoulder' + s, 'elbow' + s, arm(sg, 0.29, 0.03 - 0.3 * sw)); FG.aim(F, 'elbow' + s, 'wrist' + s, arm(sg, 0.16, 0.24 + RUN.elbow * pc - 0.36 * sw)); }
    for (const [s, sg] of legs) { const ft = feet[s], pole = fw.clone().addScaledVector(lft, sg * 0.12);
      ik2(F, 'hip' + s, 'knee' + s, 'ankle' + s, T[s], pole);
      const toe = K[s].ball.clone().applyQuaternion(q); if (ft.swing) toe.addScaledVector(DN, 0.35 * Math.sin(Math.PI * ft.u) * st.amp).normalize();
      else if (ft.heel > 1e-3) toe.addScaledVector(DN, ft.heel / 0.14).normalize(); // the toe stays on the stone as the heel lifts
      FG.aim(F, 'ankle' + s, 'ball' + s, toe); }
    F.mesh.skeleton.update(); F.poseName = 'walk';
    const moving = st.amp > 0.05; if (moving !== st.moving) { st.moving = moving; M.legsInMotion(X, moving); }
    live.step(dt);
  }
  // the capsule and its nose stay as the collision body, unseen
  body.children.forEach(c => { c.visible = false; });
  const api = { update, X, feet, st, reset, hold: false };
  return api;
}
