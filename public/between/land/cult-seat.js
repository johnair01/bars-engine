// The cultivation figure on the four lands: one model for the whole route (Wendell's C on cd-route-look-1, 2026-11-14:
// "There are 3 character models. They should be the same character model the player picks."). It is cult/player-body.js's
// figure with a seated pose for the Friends' Fire's crates, drawn the way walker.js draws a stride: aiming the limbs.
// The seat is not the nook's kneel (that one is the hearth's). Known fault, owned by the cultivation garment work: the
// skirt is a separate shell over the trousers, so a seated knee can push through it.
import * as THREE from "three";
import * as FG from "../cult/make/figure.js";
import { makeCultBody } from "../cult/player-body.js";

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const HIP_PAD = 0.09;   // the hips rest this far over the crate's top

export async function makeCultSeated({ who = "f", outfit = "B2", ...dress } = {}) {
  const body = await makeCultBody({ who, outfit, ...dress });
  const W = body.cult, F = W.X.F, holder = W.holder, { f, l } = F.fr, dn = V(0, -1, 0), up = V(0, 1, 0), q = new THREE.Quaternion();
  const rootY = F.root.position.y;
  let seated = false;
  const aim = (name, child, d) => FG.aim(F, name, child, d.clone().applyQuaternion(q));
  /* seatTop: metres over the holder's floor. lean: the chest tips forward (a laugh, a listen). strum: Oriel's right forearm. */
  function sit(seatTop, T = 0, lean = 0, strum = 0) {
    seated = true;
    FG.resetPose(F); F.root.position.y = rootY; F.root.updateMatrixWorld(true); holder.updateMatrixWorld(true); holder.getWorldQuaternion(q);
    const lift = holder.worldToLocal(F.bones.hips.getWorldPosition(V())).y;
    F.root.position.y = rootY + (seatTop + HIP_PAD - lift); F.root.updateMatrixWorld(true);
    const br = Math.sin(T * 1.4) * 0.02;
    for (const [s, sg] of [["L", 1], ["R", -1]]) {
      aim("hip" + s, "knee" + s, V().copy(f).addScaledVector(l, sg * 0.12).addScaledVector(dn, 0.04));
      aim("knee" + s, "ankle" + s, V().copy(dn).addScaledVector(f, 0.08).addScaledVector(l, sg * 0.03));
      aim("ankle" + s, "ball" + s, V().copy(f).addScaledVector(dn, 0.12));
      aim("shoulder" + s, "elbow" + s, V().copy(dn).addScaledVector(l, sg * 0.18).addScaledVector(f, 0.18));
      const fa = V().copy(f).addScaledVector(dn, 0.55).addScaledVector(l, -sg * 0.35);
      if (s === "R" && strum) fa.addScaledVector(up, Math.sin(T * 14) * 0.25 * strum);
      aim("elbow" + s, "wrist" + s, fa.normalize());
    }
    aim("spine", "neck", V().copy(up).addScaledVector(f, lean + br));
  }
  return { body, W, F, holder, sit, get seated() { return seated; }, stood() { seated = false; } };
}
