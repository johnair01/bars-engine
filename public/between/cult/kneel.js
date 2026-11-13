// The cultivation figure kneels at the nook's hearth and gives it an ember (hearth give, his A on hw5-hearth-give-look-2,
// 2026-11-09: the cultivation figure in the nook, walking to the cushion, kneeling and giving). The kneel is the
// harness round's seiza (make/seat.js kneelLegs, from the brush-hand-cult round 5), fitted to the seat the game hands in
// (seatAt: the cushion's top in metres over the holder) instead of the harness's fixed cushion. The skirt is laid over
// the kneeling legs by seat.js drape (needs three-mesh-bvh in the page's import map).
//
// makeKneel(walker) -> { sit(seatAt), stand(), give(), update(t, dt), kneeling }
//   walker: makeWalker's result. All the fitting is done with the walker's holder lifted out of the world for a moment
//   (its own frame is then the world frame), so the laid cloth, kept as meshes inside the holder, moves with it after.
import * as THREE from "three";
import * as FG from "./make/figure.js";
import * as M from "./make/mix.js";
import * as ST from "./make/seat.js";

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const wp = b => b.getWorldPosition(V());
const GIVE_S = 1.8; // the reach out, the ember leaving the hand, the hand coming back

export function makeKneel(W) {
  const X = W.X, F = X.F, k = F.stature / 1.75, { f, l } = F.fr, up = V(0, 1, 0), dn = V(0, -1, 0);
  const holder = W.holder, rootY = F.root.position.y;
  const floorLen = /A1/.test(W.outfit || "");
  let fit = null, kneeling = false, giveT0 = null, giveAge = 0, giveWant = false, built = false;

  // run fn with the holder in its own frame (at the world origin, unturned); everything posed in it stays in place after
  function inPlace(fn) {
    const par = holder.parent, p = holder.position.clone(), q = holder.quaternion.clone(), s = holder.scale.clone();
    if (par) par.remove(holder);
    holder.position.set(0, 0, 0); holder.quaternion.identity(); holder.scale.set(1, 1, 1); holder.updateMatrixWorld(true);
    try { return fn(); }
    finally { holder.position.copy(p); holder.quaternion.copy(q); holder.scale.copy(s); if (par) par.add(holder); holder.updateMatrixWorld(true); }
  }
  function standPose() { FG.resetPose(F); F.root.position.y = rootY; F.root.updateMatrixWorld(true); }

  // the stand's references the drape measures against (taken once, in place, at the fit pose)
  function stamp() {
    standPose(); X.hip0 = wp(F.bones.hips); F.bones.hips.updateMatrixWorld(true); X.hipM0 = F.bones.hips.matrixWorld.clone();
    built = true;
  }
  // the hip height that rests the kneeling shins and feet on a seat whose top is `top` over the floor
  function fitKneel(top) {
    standPose(); const H = F.bones.hips, y0 = 0.6, hw = wp(H); hw.y = y0; H.position.copy(H.parent.worldToLocal(hw)); F.root.updateMatrixWorld(true);
    ST.kneelLegs(F); let low = Infinity; for (const p of ST.legSkin(F)) low = Math.min(low, p.y);
    return y0 - (low - top) - 0.006;
  }
  // the kneel: hips on the heels, back over the cushion's middle so the knees stay on it, hands resting on the thighs;
  // reach 0..1 takes the right arm out toward the hearth, palm up
  function kneelPose(reach = 0) {
    standPose(); const H = F.bones.hips, hw = wp(H); hw.y = fit.hipY; hw.addScaledVector(f, -0.16 * k);
    H.position.copy(H.parent.worldToLocal(hw)); F.root.updateMatrixWorld(true);
    ST.kneelLegs(F);
    FG.aim(F, "neck", "head", V().addScaledVector(up, 1).addScaledVector(f, 0.1 + 0.12 * reach));
    for (const [s, sg] of [["L", 1], ["R", -1]]) {
      const r = s === "R" ? reach : 0;
      const upper = V().copy(dn).addScaledVector(f, 0.28).addScaledVector(l, sg * 0.14).lerp(V().addScaledVector(f, 0.85).addScaledVector(dn, 0.42).addScaledVector(l, sg * 0.08), r);
      const fore = V().addScaledVector(f, 0.85).addScaledVector(dn, 0.55).addScaledVector(l, -sg * 0.12).lerp(V().addScaledVector(f, 1).addScaledVector(up, 0.12), r);
      FG.aim(F, "shoulder" + s, "elbow" + s, upper); FG.aim(F, "elbow" + s, "wrist" + s, fore);
    }
    F.root.updateMatrixWorld(true); F.mesh.skeleton.update();
  }

  // the ember in her hand: a small coal with its own warm light (the harness's held ember)
  const glowM = (c, o = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false });
  const ember = new THREE.Group();
  ember.add(new THREE.Mesh(new THREE.SphereGeometry(0.034 * k, 16, 12), glowM(0xffc070)), new THREE.Mesh(new THREE.SphereGeometry(0.06 * k, 16, 12), glowM(0xff7a2a, 0.18)));
  const emberLight = new THREE.PointLight(0xffa050, 2.4, 2.5, 1.5); ember.add(emberLight); ember.visible = false; holder.add(ember);
  const palm = () => { const e = wp(F.bones.elbowR), w = wp(F.bones.wristR); return w.clone().add(w.clone().sub(e).normalize().multiplyScalar(0.08 * k)).addScaledVector(up, 0.03 * k); };

  // the seat's top as a support for the cloth (the game's cushion is drawn by the room; this one is never shown)
  let support = null;
  function supportAt(top) {
    if (support) support.geometry.dispose();
    support = new THREE.Mesh(new THREE.BoxGeometry(0.8, Math.max(0.02, top), 0.7), new THREE.MeshBasicMaterial());
    support.position.set(0, Math.max(0.02, top) / 2, 0); support.updateMatrixWorld(true); return support;
  }
  const statics = () => X.parts.flatMap(pt => [pt.static, pt.staticB]).filter(Boolean);

  function sit(seatAt) {
    const top = Math.max(0, +seatAt || 0);
    inPlace(() => {
      if (!built) stamp();
      if (!fit || Math.abs(fit.top - top) > 0.005) fit = { top, hipY: fitKneel(top) };
      kneelPose(0);
      ST.hideLegs(X, floorLen);
      ST.drape(X, { supports: [supportAt(top)] });
      for (const m of statics()) if (m.parent !== holder) holder.add(m);   // drape adds the laid cloth to the preview scene
    });
    kneeling = true;
  }
  function stand() {
    inPlace(() => {
      standPose(); M.legsInMotion(X, true);
      for (const pt of X.parts) {
        if (pt.idxSeat0) pt.geo.setIndex(Array.from(pt.idxSeat0));
        pt.settled = null; pt.mesh.visible = pt.back.visible = true; pt.hiddenSeated = false;
        if (pt.static) pt.static.visible = pt.staticB.visible = false;
      }
      X.lap = null;
    });
    W.update(0.001, true); W.update(0.001, false); // the walker takes its stand again
    kneeling = false; ember.visible = false; giveT0 = null; giveWant = false;
  }
  function give() { giveWant = true; }
  function update(t, dt) {
    if (!kneeling) return;
    if (giveWant) { giveWant = false; giveT0 = t; giveAge = 0; }
    if (giveT0 == null) return;
    /* the give runs on frame time, capped per frame: the first frame after the sheet closes can stall for seconds (shaders for
       the burst and the hearth camera compile), and a wall-clock give would be over before the player sees it begin */
    giveAge += Math.min(dt == null ? 0.05 : dt, 0.1);
    const u = giveAge / GIVE_S;
    if (u >= 1) { giveT0 = null; ember.visible = false; inPlace(() => { kneelPose(0); ST.followLap(X, { sleeves: /^$/ }); }); return; }
    // out over the first 45%, held while the ember leaves the hand, back over the last 30%
    const reach = THREE.MathUtils.smoothstep(u, 0, 0.45) * (1 - THREE.MathUtils.smoothstep(u, 0.7, 1));
    inPlace(() => {
      kneelPose(reach); ST.followLap(X, { sleeves: /^$/ });
      const at = palm(), fly = THREE.MathUtils.smoothstep(u, 0.45, 0.8);
      ember.position.copy(at).addScaledVector(f, fly * 0.9).addScaledVector(up, Math.sin(fly * Math.PI) * 0.12);
      ember.scale.setScalar(1 - fly * 0.7); emberLight.intensity = 2.4 * (1 - fly);
      ember.visible = u < 0.8;
    });
  }
  return { sit, stand, give, update, get kneeling() { return kneeling; } };
}
