// The cultivation figure as heaven's avatar. Its motion is the library clips only (clips.js, UAL, CC0): Idle, Walk, Jog (the
// speed-up), Sprint, Jump_Start/Loop/Land, crossfaded, with the clip's phase following the distance walked so the feet do not skate.
// Wendell, anim-robe-look-5 B: no hand-written stride, gait or foot IK. The figure is the gate rounds' (mix.js build, shells and
// accessories, motion.js's springs and leg push); this module poses it from a clip and hands the cloth to motion.js.
import * as THREE from 'three';
import * as FG from './figure.js';
import * as M from './mix.js';
import * as MO from './motion.js';
import * as CL from './clips.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const wp = b => b.getWorldPosition(V());
const UP = V(0, 1, 0), DN = V(0, -1, 0);

export const GAIT = { turn: 8 };
import { cultPick } from '../../between/cult/pick.js';
// the player's pick (between/cult/pick.js: 'f' by default, ?cult=m for him) in the B2 outfit; the same two bodies as the Between's walker.js
export const MIX = cultPick() === 'm' ? { gender: 'm', build: 'average', skin: 3, height: 1.75, direction: 'B', outfit: 'B2' }
  : { gender: 'f', build: 'average', skin: 4, height: 1.66, direction: 'B', outfit: 'B2' };

// build the figure into `parent` (heaven's scene) and return { update(dt), X }. `body` is the avatar group walk.js
// moves (its position is the ground under the walker, rotation.y its heading); groundAt(x, z)
// comes from heaven.
export async function cultWalker(parent, body, { groundAt }) {
  const reg = await (await fetch(new URL('parts.json', import.meta.url))).json();
  const X = await M.build(MIX, reg), F = X.F;
  // the figure's own studio lights stay behind; everything else moves into a group in heaven's scene, at the origin, so
  // the garments' world-space points (M.partWorld) are heaven's coordinates
  const G = new THREE.Group(); G.name = 'cultFigure'; parent.add(G);
  for (const o of [...X.scene.children]) { if (o.isLight) continue; G.add(o); }
  X.scene = G; G.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  // anim-robe-look-5 B: the canonical motion is the library clips (clips.js), always. The old ?clips=0 stride is gone.
  const U = await CL.loadLib(new URL('ual.glb', import.meta.url).href), CR = CL.retarget(F, U); CR.U = U;
  const { f, l } = F.fr, q = new THREE.Quaternion(), legs = [['L', 1, 0], ['R', -1, 0.5]];

  // the sole's height over the ankle, measured from the stand: legs straight down
  FG.resetPose(F); F.root.quaternion.identity(); F.root.updateMatrixWorld(true);
  for (const [s, sg] of legs) { FG.aim(F, 'hip' + s, 'knee' + s, V().copy(DN).addScaledVector(l, sg * 0.045)); FG.aim(F, 'knee' + s, 'ankle' + s, V().copy(DN).addScaledVector(l, sg * 0.03)); }
  F.mesh.skeleton.update();
  let low = 1e9; { const P = F.mesh.geometry.attributes.position, v = V(); for (let i = 0; i < P.count; i += 3) { v.fromBufferAttribute(P, i); F.mesh.applyBoneTransform(i, v); v.applyMatrix4(F.mesh.matrixWorld); low = Math.min(low, v.y); } }
  const soleH = Math.min(wp(F.bones.ankleL).y, wp(F.bones.ankleR).y) - low;
  const mid = wp(F.bones.ankleL).add(wp(F.bones.ankleR)).multiplyScalar(0.5); mid.y = 0; // root xz from the feet's midpoint

  MO.rehangRobe(X); // the slit robe hangs from the pelvis below the knee (motion.js ROBE_HANG; anim-robe-look-4 had it half way)
  const live = MO.live(X);
  const st = { yaw: null, amp: 0, last: null, moving: false, air: false, land: 1, wasWalking: false };
  // which foot is off the ground this frame, read from the clip's own pose (movecheck.js and clipcheck.js read it)
  const feet = Object.fromEntries(legs.map(([s]) => [s, { swing: false }]));
  const fwOf = yaw => V(-Math.sin(yaw), 0, -Math.cos(yaw));
  const yawQ = yaw => q.setFromAxisAngle(UP, Math.atan2(-Math.sin(yaw), -Math.cos(yaw)) - Math.atan2(f.x, f.z));
  const reset = () => { st.yaw = body.rotation.y; st.wasWalking = false; live.reset(); };

  // the library clips (clips.js): which clip, how far through it, and a crossfade when it changes. The feet are not planted by code any
  // more; the clip's phase follows the distance walked (rate = speed / the clip's own speed) so the feet do not skate.
  const CS = { cur: null, t: 0, prev: null, pt: 0, fade: 1, landT: 0, airT: 0, standY: null };
  // robe-run-clips-1 B: each loop's own ground speed on this figure, measured from the planted foot's slide past the hips (2026-11-21),
  // so the clip plays at speed / its own speed and the feet do not skate. Shift (MOVE.run) plays the Sprint; the Jog is only the
  // few frames of speeding up between the walk and the sprint.
  const CLIPSPEED = { Walk_Loop: 1.05, Jog_Fwd_Loop: 5.4, Sprint_Loop: 7.1 };
  const lowest = () => { let low = 1e9; const P = F.mesh.geometry.attributes.position, v = V(); F.mesh.skeleton.update(); for (let i = 0; i < P.count; i += 3) { v.fromBufferAttribute(P, i); F.mesh.applyBoneTransform(i, v); v.applyMatrix4(F.mesh.matrixWorld); low = Math.min(low, v.y); } return low; };
  function clipFrame(dt, sp, air, rootXZ, ground, mv) {
    const U = CR.U; let want;
    if (air) { CS.airT += dt; CS.landT = 0; want = CS.airT < 0.25 ? 'Jump_Start' : 'Jump_Loop'; }
    else { if (CS.airT > 0) { CS.landT = 0.45; CS.airT = 0; } CS.landT = Math.max(0, CS.landT - dt);
      want = CS.landT > 0 && sp < 2 ? 'Jump_Land' : sp < 0.15 ? 'Idle_Loop' : sp < 2.3 ? 'Walk_Loop' : sp < 4.6 ? 'Jog_Fwd_Loop' : 'Sprint_Loop'; }
    const dur = n => U.clips[n].duration, loop = n => /Loop/.test(n);
    if (!CS.cur) { CS.cur = want; CS.t = 0; }
    else if (want !== CS.cur) { CS.prev = CS.cur; CS.pt = CS.t; CS.fade = 0;
      CS.t = loop(want) && loop(CS.cur) ? (CS.t / dur(CS.cur)) * dur(want) : 0; CS.cur = want; } // a loop swaps at the same phase; a one-shot starts at its start
    const adv = (n, t) => { const r = loop(n) ? (CLIPSPEED[n] ? THREE.MathUtils.clamp(sp / CLIPSPEED[n], 0.6, 1.5) : 1) : 1; t += dt * r; return loop(n) ? t % dur(n) : Math.min(t, dur(n) - 1e-3); };
    CS.t = adv(CS.cur, CS.t); if (CS.prev) CS.pt = adv(CS.prev, CS.pt); CS.fade = Math.min(1, CS.fade + dt / 0.18); if (CS.fade >= 1) CS.prev = null;
    F.root.quaternion.identity(); F.root.updateMatrixWorld(true);
    let P = CR.poseOf(CS.cur, CS.t); if (CS.prev) P = CR.blend(CR.poseOf(CS.prev, CS.pt), P, CS.fade);
    CR.apply(P);
    if (CS.standY == null) { CR.apply(CR.poseOf('Idle_Loop', 0)); F.root.position.set(0, 0, 0); F.root.updateMatrixWorld(true); CS.standY = -lowest(); CR.apply(P); }
    F.root.quaternion.copy(q); F.root.position.set(rootXZ.x, ground + CS.standY, rootXZ.z); F.root.updateMatrixWorld(true);
    if (!air) { let lift = 0; // a foot under the ground (a stair tread, the clip's own scale) lifts the whole figure
      for (const s of ['L', 'R']) { const a = wp(F.bones['ankle' + s]); lift = Math.max(lift, groundAt(a.x, a.z) + soleH - a.y); }
      if (lift > 0) { F.root.position.y += lift; F.root.updateMatrixWorld(true); } }
  }
  function update(dt) {
    if (api.hold) return; // a still: the pose stays as the last frame left it
    const p = body.position;
    if (!st.last || st.last.distanceTo(p) > 2) { st.last = p.clone(); reset(); }
    const dxz = Math.hypot(p.x - st.last.x, p.z - st.last.z); st.last.copy(p);
    const mv = body.userData.m, air = !!(mv && mv.air), sp = dt > 0 ? dxz / dt : 0, walking = dxz > 1e-4;
    // leaving a stand, the figure faces the way it is going at once; otherwise its heading eases round to the body's
    if (walking && !st.wasWalking && !air) st.yaw = body.rotation.y;
    let dy = body.rotation.y - st.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); st.yaw += dy * Math.min(1, dt * GAIT.turn);
    st.wasWalking = walking;
    if (st.air && !air) st.land = 0; st.air = air; st.land = Math.min(1, st.land + dt * 4);
    st.amp += ((walking ? 1 : 0) - st.amp) * Math.min(1, dt * 6);
    yawQ(st.yaw);
    const rootXZ = p.clone().sub(mid.clone().applyQuaternion(q)); rootXZ.y = 0;
    clipFrame(dt, sp, air, rootXZ, p.y, mv);
    F.mesh.skeleton.update(); F.poseName = 'clip';
    for (const [s] of legs) { const a = wp(F.bones['ankle' + s]); feet[s].swing = a.y - groundAt(a.x, a.z) > soleH + 0.012; }
    const moving = st.amp > 0.05; if (moving !== st.moving) { st.moving = moving; M.legsInMotion(X, moving); }
    MO.skirtMood(air, st.land);
    live.step(dt);
  }
  // the capsule and its nose stay as the collision body, unseen
  body.children.forEach(c => { c.visible = false; });
  const api = { update, X, feet, st, reset, hold: false };
  return api;
}
