// The cultivation characters as a walking traveller (coaching walk round 2, 2026-11-05; Wendell's steer on
// cw-walk-look-1: "we want to start using the cultivation characters that we're modeling and not the placeholder
// characters"). The figure is built in the page, exactly as the review preview builds it (make/ is a copy of the shells
// preview, /mnt/project-files/3d-build/cultivation-shells-4-preview, accessories round 4): a UBC Regular body, its
// shells and its accessories, all skinned to its bones. No clip library fits these bones yet (pipeline stage 4, clips,
// has not run), so the walk is drawn the way the preview draws its 'step' pose: by aiming the limbs (figure.js aim),
// here with the stride's phase running, and the feet kept on the ground.
import * as THREE from "three";
import * as M from "./make/mix.js";
import * as FG from "./make/figure.js";

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const wp = b => b.getWorldPosition(V());

// who: 'f' (her) or 'm' (him); outfit: a parts.json outfit key. The bodies are the preview's two.
export const BODIES = {
  f: { gender: "f", build: "average", skin: 4, height: 1.66 },
  m: { gender: "m", build: "average", skin: 3, height: 1.75 },
};
let REG = null;
export async function makeWalker({ who = "f", outfit = "B2" } = {}) {
  if (!REG) REG = await fetch(new URL("./make/parts.json", import.meta.url)).then(r => r.json());
  const X = await M.build({ ...BODIES[who], direction: outfit[0], outfit }, REG);
  const F = X.F;
  // the body under the clothes is not drawn while it walks, so a thigh cannot show through the skirt (mix.js
  // legsInMotion, worked out at the preview's stride); it stays hidden at rest too, where the cloth covers it
  FG.pose(F, "step"); M.legsInMotion(X, true); FG.pose(F, "stand");
  const holder = new THREE.Group(); holder.add(F.root);
  F.root.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = false; } });
  holder.updateMatrixWorld(true);
  const groundY = F.root.position.y; // the stand pose's own grounding (lowest body point on the floor)
  const ankle0 = Math.min(holder.worldToLocal(wp(F.bones.ankleL)).y, holder.worldToLocal(wp(F.bones.ankleR)).y);
  const hipL = holder.worldToLocal(wp(F.bones.hipL)).y - ankle0; // leg length, for the stride

  const { f, l } = F.fr, dn = V(0, -1, 0), q = new THREE.Quaternion();
  const toW = d => d.applyQuaternion(q);
  const aim = (name, child, d) => FG.aim(F, name, child, toW(d));
  let phase = 0, amt = 0, last = null, rested = true;

  // one frame of the stride. ph: 0..2pi, the left leg passing under the body at 0 and forward at pi/2. a: 0 stands
  // (the fit pose every garment is cut in), 1 walks.
  function gait(ph, a) {
    FG.resetPose(F); holder.updateMatrixWorld(true); holder.getWorldQuaternion(q);
    for (const [s, sg, off] of [["L", 1, 0], ["R", -1, Math.PI]]) {
      const p = ph + off, sw = Math.sin(p), lift = Math.max(0, Math.cos(p));       // lift: the swing half, foot coming through
      const thigh = a * 0.34 * sw;                                                   // the preview's step: 0.42 forward, 0.26 back
      const shin = thigh - a * (0.62 * lift * lift + 0.06);                         // the knee folds as the foot comes through
      const arm = -a * 0.2 * sw;                                                     // each arm swings against its own leg
      aim("shoulder" + s, "elbow" + s, V().copy(dn).addScaledVector(l, sg * 0.29).addScaledVector(f, 0.03 + arm));
      aim("elbow" + s, "wrist" + s, V().copy(dn).addScaledVector(l, sg * 0.16).addScaledVector(f, 0.24 + arm * 1.3));
      aim("hip" + s, "knee" + s, V().copy(dn).addScaledVector(l, sg * 0.045).addScaledVector(f, thigh));
      aim("knee" + s, "ankle" + s, V().copy(dn).addScaledVector(l, sg * 0.03).addScaledVector(f, shin));
    }
    // the planted foot stays on the ground: the lower ankle sits where the standing ankles sat
    const lo = Math.min(holder.worldToLocal(wp(F.bones.ankleL)).y, holder.worldToLocal(wp(F.bones.ankleR)).y);
    F.root.position.y = groundY - (lo - ankle0); F.root.updateMatrixWorld(true);
  }
  gait(0, 0);
  const STRIDE = 2 * 2 * hipL * 0.32; // metres per full cycle (two steps)

  return {
    holder, X, who, outfit,
    // Deterministic review of the shipped gait, without requiring player movement.
    previewWalk(phase, amount = 1) { gait(phase, amount); },
    // dt: seconds; moving: whether the traveller is walking this frame. The stride advances by the ground covered,
    // so the feet do not skate.
    update(dt, moving) {
      const here = holder.position.clone(); const d = last ? Math.hypot(here.x - last.x, here.z - last.z) : 0; last = here;
      amt += ((moving ? 1 : 0) - amt) * Math.min(1, dt * (moving ? 6 : 4));
      if (moving) phase += (d / STRIDE) * Math.PI * 2;
      else if (amt > 0.02) phase += dt * 2.4;                                         // finish the step as it stops
      if (!moving && amt < 0.004) { if (rested) return; amt = 0; phase = 0; rested = true; } // at rest the pose holds; turning the holder turns it whole
      else rested = false;
      gait(phase, amt);
    },
    dispose() { holder.removeFromParent(); M.dispose(X); },
  };
}
