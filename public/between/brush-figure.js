/* The kneeling writer at the hearth (ember-to-vibeulon FR-005). Wendell answered A on ee2-brush-cult-look-5 (2026-11-10:
   "This is how she writes"): the cultivation figure kneels on the hearth's cushion and holds the brush upright, between
   the thumb and the index finger, resting on the ring finger. The Nook's own figure (Average Dusk) has no finger bones, so
   while the player writes, this figure takes its place on the seat; the dressed player is hidden and comes back on close.

   The figure, its hold, the low writing board and the robe's seated drape are brush-hand-cult-5's (copied to ./cult/,
   with heaven round 19's live-page patches to mix.js and ubc.js). They work in world coordinates, so the figure's group
   is built and posed detached at the origin (its own frame), then hung under a holder placed at the Nook's seat for drawing.

   What the player does drives the pose: choosing an ember plays the dip; each stroke on the strip moves the brush along
   the board's stroke by the distance the pointer travelled; setting it down plays the lift. */
import * as THREE from "three";

const BODY = { gender: "f", build: "average", skin: 4, height: 1.66, direction: "A", outfit: "A2" }; // cult-5's look-5 figure
const T_READY = 0.0, T_DIP0 = 0.08, T_WRITE0 = 0.43, T_WRITE1 = 0.88, PER_PX = 0.00035; // desk.js beats; stroke t per strip pixel

/** Builds the writer into `scene`. Resolves to { place(seat), show(on), ember(), stroke({ ds, down }), finish(), tick(dt) }. */
export async function createBrushFigure(scene) {
  const base = new URL("./cult/", import.meta.url);
  const [M, FG, BR, SC, ST, reg] = await Promise.all([
    import(new URL("mix.js", base).href), import(new URL("figure.js", base).href), import(new URL("brush.js", base).href),
    import(new URL("desk.js", base).href), import(new URL("seat.js", base).href),
    fetch(new URL("parts.json", base)).then(r => r.json()),
  ]);
  const X = await M.build(BODY, reg), F = X.F, wp = b => b.getWorldPosition(new THREE.Vector3());
  // the figure's own frame: everything but its studio lights moves into G, which stays detached (identity world) while posed
  const G = new THREE.Group(); G.name = "brushWriter";
  for (const o of [...X.scene.children]) if (!o.isLight) G.add(o);
  X.scene = G;
  X.hip0 = wp(F.bones.hips); F.bones.hips.updateMatrixWorld(true); X.hipM0 = F.bones.hips.matrixWorld.clone();
  // cult-5's index.html load, less the room: setHearth's cushion is kept (hidden) as the drape's support, the rest of its
  // room (stones, fire, floor, lights) is dropped because the Nook has its own
  const seatC = X.hip0.clone().setY(0).addScaledVector(F.fr.f, -0.02 * F.stature / 1.75);
  const room = ST.setHearth(X, seatC, { cushFwd: 0.16 });
  for (const o of [...G.children]) if (o.isLight || o === room.hearth || o === room.floor) G.remove(o);
  G.background = null; room.cushion.visible = false;
  const hipY = ST.fitKneel(F, FG.resetPose);
  const seat = { at: seatC, hipY, rise: hipY - (ST.MAT_TOP + ST.SEAT_PAD), back: 0, tilt: 0, legs: Fx => ST.kneelLegs(Fx), supports: [room.cushion] };
  const S = SC.setScene(X, BR, { seat }); S.at(T_READY); ST.hideLegs(X, false); ST.drape(X, seat); ST.followLap(X);
  G.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });

  // the holder: the figure's seat point on the Nook's seat floor, her forward (F.fr.f) turned to the seat's
  const holder = new THREE.Group(); holder.visible = false; scene.add(holder); holder.add(G);
  const fYaw = Math.atan2(F.fr.f.x, F.fr.f.z);
  function place(s) {
    holder.rotation.set(0, s.yaw - fYaw, 0);
    const off = seatC.clone().applyEuler(holder.rotation);
    holder.position.set(s.x - off.x, s.floor ?? 0, s.z - off.z);
  }
  // pose with G detached (world = its own frame), then hang it back under the holder for the draw
  const pose = t => { holder.remove(G); G.updateMatrixWorld(true); S.at(t); ST.followLap(X); holder.add(G); };

  const st = { t: T_READY, goal: null, dir: 1, dipped: false };
  const api = {
    group: holder, place,
    show(on) { holder.visible = !!on; if (on) { st.t = T_READY; st.goal = null; st.dipped = false; pose(st.t); } },
    /** An ember was chosen: the brush goes down to it, dips, and comes to the paper. */
    ember() { st.dipped = true; st.goal = T_WRITE0; if (st.t > T_WRITE0) st.t = T_DIP0; },
    /** The player's brush moved `ds` strip pixels: the figure's brush runs along the board's stroke, back and forth. */
    stroke({ ds = 0 }) {
      if (!st.dipped || st.goal !== null) return;
      let t = Math.max(st.t, T_WRITE0) + st.dir * ds * PER_PX;
      if (t > T_WRITE1) { t = 2 * T_WRITE1 - t; st.dir = -1; } else if (t < T_WRITE0) { t = 2 * T_WRITE0 - t; st.dir = 1; }
      st.t = t;
    },
    /** Set down: the brush lifts and rests. */
    finish() { st.goal = 1; if (st.t < T_WRITE0) st.t = T_WRITE0; },
    tick(dt) {
      if (!holder.visible) return;
      if (st.goal !== null) { st.t = Math.min(st.goal, st.t + dt / 6); if (st.t >= st.goal) st.goal = null; }
      pose(Math.min(1, st.t));
    },
    /** A camera for the writing: in front of her, off her writing hand, looking at the board and her face. */
    view(s, tall) {
      const fx = Math.sin(s.yaw), fz = Math.cos(s.yaw), lx = fz, lz = -fx, fl = s.floor ?? 0;
      const at = (x, y, z) => new THREE.Vector3(s.x + lx * x + fx * z, fl + y, s.z + lz * x + fz * z); // x left, z ahead
      return tall ? [at(-1.0, 1.75, 1.7), at(0, 0.05, 0.1)] : [at(-1.5, 1.3, 1.55), at(0.4, 0.45, 0.15)]; // phone: she sits in the top half, over the strip
    },
  };
  return api;
}
