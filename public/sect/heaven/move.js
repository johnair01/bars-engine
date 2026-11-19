// Round 30: the figure walks, runs and jumps, and the camera follows it (council recipe cultivation-locomotion).
// Every number a maker lane may tune lives in MOVE and CAM; movecheck.js scores them. The rest is the machinery.
import * as THREE from 'three';

// m/s, m, s. Walk is round 19's pace; run is a jog (a long stride and a short stance, both feet off the ground at
// mid-stride). Jump: v0 and g give the apex (v0^2 / 2g) and the time in the air (2 v0 / g).
export const MOVE = {
  walk: 1.3, run: 4.2, stair: 0.55, stairRun: 1.1, accel: 10, decel: 14,
  jumpV: 4.4, gravity: 13, coyote: 0.12, buffer: 0.14, airControl: 0.35, stepDown: 0.35, landStep: 0.45,
};
// the follow camera: a spring arm from a pivot at the head. dist is what the player last zoomed to; the arm shortens
// at once when a wall or roof comes between, and grows back slowly. After `hands` seconds without a drag, a moving
// figure turns the camera round behind it at `recenter` rad/s.
export const CAM = {
  dist: 6, min: 1.2, max: 14, head: 1.55, pitch: 0.32, minPitch: -0.35, maxPitch: 1.25,
  hands: 1.6, recenter: 1.4, pad: 0.3, grow: 3, yLag: 6, near: 0.45,
};

// ---- vertical motion: gravity, the jump, coyote time, the jump buffer, landing on what is under the feet
export function motion(A) { return A.userData.m || (A.userData.m = { vy: 0, air: false, since: 0, buf: 0, v: 0, landed: 0, apex: 0 }); }

// called by walk.js's step() once per frame after the horizontal move. ground is the height under the figure now.
export function vertical(A, input, dt, ground) {
  const m = motion(A), p = A.position;
  if (input.jump) { m.buf = MOVE.buffer; input.jump = false; }
  m.buf = Math.max(0, m.buf - dt);
  if (!m.air) {
    if (ground < p.y - MOVE.stepDown) { m.air = true; m.vy = 0; m.since = 0; m.apex = m.apex0 = p.y; } // walked off an edge: fall
    else { p.y = ground; m.since = 0; }
  } else m.since += dt;
  // a jump starts on the ground, or within coyote seconds of leaving it, when the button was pressed buffer seconds ago
  if (m.buf > 0 && (!m.air || (m.since < MOVE.coyote && m.vy <= 0))) {
    m.air = true; m.vy = MOVE.jumpV; m.buf = 0; m.since = MOVE.coyote; m.apex = p.y; m.apex0 = p.y;
  }
  if (m.air) {
    m.vy -= MOVE.gravity * dt; p.y += m.vy * dt; m.apex = Math.max(m.apex, p.y);
    if (p.y <= ground && m.vy <= 0) { p.y = ground; m.air = false; m.vy = 0; m.landed = 0; }
  } else m.landed += dt;
  return m;
}

// ---- the camera rig. It owns the camera's distance and yaw; OrbitControls only reports the player's drags and zooms.
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// the segment a -> b against the oriented boxes ({x, z, hw, hd, c, s, y0, y1}); returns the first hit's fraction or 1
export function segBoxes(a, b, boxes, pad = 0) {
  let best = 1;
  const minx = Math.min(a.x, b.x), maxx = Math.max(a.x, b.x), minz = Math.min(a.z, b.z), maxz = Math.max(a.z, b.z);
  for (const list of boxes) for (const o of list) {
    const r = o.hw + o.hd + pad; if (o.x + r < minx || o.x - r > maxx || o.z + r < minz || o.z - r > maxz) continue;
    // to the box's frame (walk.js's convention: lx = dx c - dz s, lz = dx s + dz c)
    const ax = a.x - o.x, az = a.z - o.z, bx = b.x - o.x, bz = b.z - o.z;
    const p0 = [ax * o.c - az * o.s, a.y, ax * o.s + az * o.c], p1 = [bx * o.c - bz * o.s, b.y, bx * o.s + bz * o.c];
    const lo = [-o.hw - pad, o.y0 - pad, -o.hd - pad], hi = [o.hw + pad, o.y1 + pad, o.hd + pad];
    let t0 = 0, t1 = best, ok = true;
    for (let k = 0; k < 3 && ok; k++) { const d = p1[k] - p0[k];
      if (Math.abs(d) < 1e-9) { if (p0[k] < lo[k] || p0[k] > hi[k]) ok = false; continue; }
      let u = (lo[k] - p0[k]) / d, w = (hi[k] - p0[k]) / d; if (u > w) [u, w] = [w, u];
      t0 = Math.max(t0, u); t1 = Math.min(t1, w); if (t0 > t1) ok = false; }
    if (ok && t0 < best) best = t0;
  }
  return best;
}

export function cameraRig(cam, orbit, { boxes, groundAt, roofs = () => [] }) {
  const rig = { dist: CAM.dist, yaw: 0, pitch: CAM.pitch, hands: 99, arm: CAM.dist, free: false, pivot: V(), pivotY: null, blocked: 0 };
  orbit.enableZoom = true; orbit.minDistance = CAM.min; orbit.maxDistance = CAM.max;
  orbit.minPolarAngle = Math.PI / 2 - CAM.maxPitch; orbit.maxPolarAngle = Math.PI / 2 - CAM.minPitch;
  let dragging = false;
  orbit.addEventListener('start', () => { dragging = true; rig.free = false; });
  orbit.addEventListener('end', () => { dragging = false; rig.hands = 0; });
  // read the angles the camera has now (after a jump to a stop, a room or the player's drag)
  rig.adopt = () => { const o = cam.position.clone().sub(orbit.target), r = o.length() || 1;
    rig.yaw = Math.atan2(o.x, o.z); rig.pitch = CAM.pitch; // keep the stop's bearing, at the follow camera's own height
    rig.dist = CAM.dist; rig.arm = rig.dist; rig.pivotY = null; rig.hands = 0; };
  // A: the avatar group; heading A.rotation.y; speed (m/s) of the walker this frame
  rig.update = (A, dt, speed = 0) => {
    if (rig.free) return;
    const P = A.position, m = A.userData.m;
    if (dragging) { orbit.update(); const o = cam.position.clone().sub(orbit.target), r = o.length() || 1;
      rig.yaw = Math.atan2(o.x, o.z); rig.pitch = Math.asin(THREE.MathUtils.clamp(o.y / r, -1, 1)); rig.dist = THREE.MathUtils.clamp(r > rig.arm + 0.05 ? r : rig.dist, CAM.min, CAM.max); }
    else rig.hands += dt;
    // the pivot rides the head; while the figure is in the air it rises only half the jump, so the frame stays calm
    const yHead = P.y + CAM.head - (m && m.air ? Math.max(0, P.y - m.apex0) * 0.5 : 0);
    rig.pivotY = rig.pivotY == null ? yHead : rig.pivotY + (yHead - rig.pivotY) * Math.min(1, dt * CAM.yLag);
    rig.pivot.set(P.x, rig.pivotY, P.z);
    // turn round behind a moving figure once the player's hands are off
    if (!dragging && rig.hands > CAM.hands && speed > 0.3) {
      const behind = A.rotation.y; let d = behind - rig.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      rig.yaw += d * Math.min(1, dt * CAM.recenter * Math.min(1, speed / MOVE.walk));
    }
    // the spring arm: pull in at once to stay clear of walls, roofs and ground; grow back slowly
    const dir = V(Math.sin(rig.yaw) * Math.cos(rig.pitch), Math.sin(rig.pitch), Math.cos(rig.yaw) * Math.cos(rig.pitch));
    const want = rig.pivot.clone().addScaledVector(dir, rig.dist);
    let t = segBoxes(rig.pivot, want, [...boxes, roofs()], CAM.pad);
    let arm = Math.max(CAM.near, rig.dist * t - (t < 1 ? CAM.pad : 0));
    // the ground under the camera (terrain, stairs, plinths): never below it
    for (let k = 0; k < 6; k++) { const c = rig.pivot.clone().addScaledVector(dir, arm); if (c.y >= groundAt(c.x, c.z) + 0.25 || arm <= CAM.near) break; arm *= 0.8; }
    rig.blocked = t < 1 ? 1 : 0;
    rig.arm = arm < rig.arm ? arm : rig.arm + (arm - rig.arm) * Math.min(1, dt * CAM.grow);
    cam.position.copy(rig.pivot).addScaledVector(dir, rig.arm); orbit.target.copy(rig.pivot); cam.lookAt(rig.pivot);
  };
  return rig;
}
