// The gate walk's walker: the library clips (clips.js, Quaternius UAL, CC0) on the cultivation figure. No motion is written by hand here.
// Wendell, cc-rs-heaven-walk-look-1 (2026-11-23): "make sure it's using our canonical walk and not the code generated one."
// Idle_Loop when still, Walk_Loop when moving, its phase following the distance walked so the feet do not skate. The robe chains settle in motion.js's live().
import * as THREE from 'three';
import * as FG from './figure.js';
import * as M from './mix.js';
import * as MO from './motion.js';
import * as CL from './clips.js';
import { MIX } from './cultwalk.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const WALK_SPEED = 1.35; // m/s the Walk_Loop clip covers at rate 1 (the same figure as cultwalk.js's CLIPSPEED)

export async function clipWalker(parent, body) {
  const reg = await (await fetch(new URL('parts.json', import.meta.url))).json();
  const X = await M.build(MIX, reg), F = X.F;
  const G = new THREE.Group(); G.name = 'cultFigure'; parent.add(G);
  for (const o of [...X.scene.children]) { if (o.isLight) continue; G.add(o); }
  X.scene = G; G.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  const U = await CL.loadLib(new URL('ual.glb', import.meta.url).href), CR = CL.retarget(F, U);
  const live = MO.live(X), f = F.fr.f;
  const lowest = () => { let low = 1e9; const P = F.mesh.geometry.attributes.position, v = V(); F.mesh.skeleton.update(); for (let i = 0; i < P.count; i += 3) { v.fromBufferAttribute(P, i); F.mesh.applyBoneTransform(i, v); v.applyMatrix4(F.mesh.matrixWorld); low = Math.min(low, v.y); } return low; };
  F.root.quaternion.identity(); F.root.position.set(0, 0, 0); F.root.updateMatrixWorld(true);
  CR.apply(CR.poseOf('Idle_Loop', 0)); const standY = -lowest(); // the figure's sole on the ground in the idle pose
  const st = { t: 0, last: null, clip: 'Idle_Loop', prev: null, pt: 0, fade: 1 };
  const loop = (n, t) => t % U.clips[n].duration;
  const update = dt => {
    const p = body.position, sp = st.last && dt > 0 ? Math.hypot(p.x - st.last.x, p.z - st.last.z) / dt : 0; st.last = p.clone();
    const want = sp < 0.15 ? 'Idle_Loop' : 'Walk_Loop';
    if (want !== st.clip) { st.prev = st.clip; st.pt = st.t; st.fade = 0; st.t = (st.t / U.clips[st.clip].duration) * U.clips[want].duration; st.clip = want; } // a loop swaps at the same phase
    const rate = n => n === 'Walk_Loop' ? THREE.MathUtils.clamp(sp / WALK_SPEED, 0.6, 1.5) : 1;
    st.t = loop(st.clip, st.t + dt * rate(st.clip)); if (st.prev) st.pt = loop(st.prev, st.pt + dt * rate(st.prev));
    st.fade = Math.min(1, st.fade + dt / 0.18); if (st.fade >= 1) st.prev = null;
    F.root.quaternion.identity(); F.root.updateMatrixWorld(true);
    let P = CR.poseOf(st.clip, st.t); if (st.prev) P = CR.blend(CR.poseOf(st.prev, st.pt), P, st.fade);
    CR.apply(P);
    F.root.quaternion.setFromAxisAngle(V(0, 1, 0), Math.atan2(-Math.sin(body.rotation.y), -Math.cos(body.rotation.y)) - Math.atan2(f.x, f.z));
    F.root.position.set(p.x, p.y + standY, p.z); F.root.updateMatrixWorld(true);
    M.legsInMotion(X, sp > 0.15); live.step(dt);
  };
  const reset = () => { st.last = null; live.reset(); };
  return { update, reset, X };
}
