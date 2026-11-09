/* The kneel word played on a skinned body (council animation-language round 7, make/kneel.html's rig solver, ported). kneel.js
   makes the pose from the body's own lengths; this puts hips, legs, chest and hands there with two-bone solves. Average Dusk
   has no toe bones, so the feet are placed by the ankle only. Three.js is passed in, so a node probe can use it too. */
import { kneelPose, defaultContacts, DURATION } from "./kneel.js";

export { DURATION };
export const sm = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };

export function makeKneeler(THREE, obj, holder) {
  const UP = new THREE.Vector3(0, 1, 0), DN = new THREE.Vector3(0, -1, 0);
  const wp = o => o.getWorldPosition(new THREE.Vector3());
  const names = ["hips", "spine", "neck", "head", "hipL", "hipR", "kneeL", "kneeR", "ankleL", "ankleR", "shoulderL", "shoulderR", "elbowL", "elbowR", "wristL", "wristR"];
  const b = {}; for (const n of names) { b[n] = obj.getObjectByName(n); if (!b[n]) return null; }
  const rest = {}; for (const n of names) rest[n] = b[n].quaternion.clone();
  const hipsPos = b.hips.position.clone();
  let dims = null;

  function aim(bone, child, d) {
    bone.parent.updateMatrixWorld(true); bone.updateMatrixWorld(true);
    const cur = wp(child).sub(wp(bone)).normalize(), dq = new THREE.Quaternion().setFromUnitVectors(cur, d.clone().normalize());
    const bw = bone.getWorldQuaternion(new THREE.Quaternion()), pw = bone.parent.getWorldQuaternion(new THREE.Quaternion());
    bone.quaternion.copy(pw.invert().multiply(dq.multiply(bw))); bone.updateMatrixWorld(true);
  }
  function solve2(a, m, c, T, pole) {
    a.parent.updateMatrixWorld(true);
    const A = wp(a), l1 = wp(m).distanceTo(A), l2 = wp(c).distanceTo(wp(m));
    const toT = T.clone().sub(A), d = THREE.MathUtils.clamp(toT.length(), Math.abs(l1 - l2) + 1e-3, (l1 + l2) * 0.999), u = toT.normalize();
    const p = pole.clone(); p.addScaledVector(u, -p.dot(u)).normalize();
    const ca = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), sa = Math.sqrt(Math.max(0, 1 - ca * ca));
    const E = A.clone().addScaledVector(u, l1 * ca).addScaledVector(p, l1 * sa);
    aim(a, m, E.clone().sub(A)); aim(m, c, A.clone().addScaledVector(u, d).sub(wp(m)));
  }
  const reset = () => { for (const n of names) b[n].quaternion.copy(rest[n]); b.hips.position.copy(hipsPos); holder.updateMatrixWorld(true); };
  const frame = () => { obj.updateMatrixWorld(true); const l = wp(b.shoulderL).sub(wp(b.shoulderR)); l.y = 0; l.normalize(); return { l, f: l.clone().cross(UP).normalize() }; };
  const lowest = () => { let m = Infinity; const v = new THREE.Vector3(); holder.updateMatrixWorld(true);
    holder.traverse(o => { if (!o.isSkinnedMesh || !o.visible || !o.geometry.attributes.position) return; const pos = o.geometry.attributes.position, st = Math.max(1, Math.floor(pos.count / 4000));
      for (let i = 0; i < pos.count; i += st) { v.fromBufferAttribute(pos, i); o.applyBoneTransform(i, v); v.applyMatrix4(o.matrixWorld); m = Math.min(m, v.y); } });
    return m; };

  /* The body's own lengths, read from the bind pose where it stands now (the floor is the holder's y). Done once. */
  function measure() {
    reset(); const fr = frame(), fy = holder.position.y;
    const hj = wp(b.hipL).add(wp(b.hipR)).multiplyScalar(0.5), O = wp(b.ankleL).add(wp(b.ankleR)).multiplyScalar(0.5); O.y = fy;
    const d = { H: hj.y - fy, hoff: wp(b.hips).sub(hj), hw: wp(b.hipL).distanceTo(wp(b.hipR)), thigh: wp(b.kneeL).distanceTo(wp(b.hipL)), shin: wp(b.ankleL).distanceTo(wp(b.kneeL)),
      K0: wp(b.kneeL).y - fy, A0: wp(b.ankleL).y - fy, Oloc: holder.worldToLocal(O.clone()), headQ: b.head.getWorldQuaternion(new THREE.Quaternion()) };
    d.G = defaultContacts(d); dims = d;
    // contact, measured on the body: in beat 5 the knees and shins rest on the floor, in beat 3 the tucked toes do; nothing goes under it
    const fl = () => holder.position.y;
    for (let k = 0; k < 4; k++) { play(4.0, true); const lo = lowest() - fl(); d.G.kneeY -= lo - 0.003; d.G.ankF -= lo - 0.003; }
    for (let k = 0; k < 3; k++) { play(2.6, true); const lo = lowest() - fl(); d.G.ankT -= lo - 0.003; }
    d.endF = kneelPose(d, DURATION).hip.f;
    reset();
  }
  const P = (fr, O, l, y, f) => O.clone().addScaledVector(fr.l, l).addScaledVector(UP, y).addScaledVector(fr.f, f);
  const D = (fr, l, y, f) => new THREE.Vector3().addScaledVector(fr.l, l).addScaledVector(UP, y).addScaledVector(fr.f, f).normalize();

  function play(t, fitting = false) {
    reset(); const d = dims, fr = frame(), fy = holder.position.y;
    const O = holder.localToWorld(d.Oloc.clone()); O.y = fy;
    const p = kneelPose(d, t);
    b.hips.position.copy(b.hips.parent.worldToLocal(P(fr, O, p.hip.l, p.hip.y, p.hip.f).add(d.hoff))); holder.updateMatrixWorld(true);
    aim(b.spine, b.neck, UP.clone().addScaledVector(fr.f, Math.tan(p.lean)));
    aim(b.neck, b.head, UP.clone().addScaledVector(fr.f, Math.tan(p.lean) * 0.6 + 0.04));
    for (const s of ["L", "R"]) {
      const A = p.A[s] ? P(fr, O, p.A[s].l, p.A[s].y, p.A[s].f) : wp(b["ankle" + s]), K = P(fr, O, p.K[s].l, p.K[s].y, p.K[s].f);
      solve2(b["hip" + s], b["knee" + s], b["ankle" + s], A, K.clone().sub(wp(b["hip" + s])));
    }
    const h = b.head, tuck = new THREE.Quaternion().setFromAxisAngle(fr.l, 0.10 * sm(2.6, 4, t)), q = tuck.multiply(d.headQ.clone());
    h.quaternion.copy(h.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q)); h.updateMatrixWorld(true);
    for (const s of ["L", "R"]) { const sg = s === "L" ? 1 : -1, Sp = wp(b["shoulder" + s]), El = wp(b["elbow" + s]), Wr = wp(b["wrist" + s]);
      const armL = Sp.distanceTo(El) + El.distanceTo(Wr), hang = Sp.clone().addScaledVector(DN, armL * 0.97).addScaledVector(fr.l, sg * 0.05);
      const thighPt = wp(b["hip" + s]).lerp(wp(b["knee" + s]), 0.62).addScaledVector(UP, 0.075).addScaledVector(fr.l, -sg * 0.01);
      solve2(b["shoulder" + s], b["elbow" + s], b["wrist" + s], hang.lerp(thighPt, p.hands), D(fr, sg * 0.6, -0.1, -0.8)); }
    holder.updateMatrixWorld(true);
    return p;
  }
  return {
    /* t: seconds into the kneel (0 to DURATION). Call after the mixer, instead of the sit's bends. */
    apply(t) { if (!dims) measure(); return play(Math.max(0, Math.min(DURATION, t))); },
    /* How far ahead of the seat the standing start is, so the hips end over it (metres, along the body's forward). */
    get ahead() { return dims ? -dims.endF : 0; },
    forward() { return frame().f; },
    get dims() { return dims; },
  };
}
