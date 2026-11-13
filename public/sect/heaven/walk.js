// The avatar: a capsule (round 19: the cultivation figure walks over it, cult/cultwalk.js) at a walk, WASD relative to the camera, tap-to-walk, slides along walls, stands on the ground
// or a room floor; roofs lift when it steps inside a room.
import * as THREE from 'three';
import { heightAt } from './layout.js';
import { colliders, interiors } from './world.js';
import { roadGround } from './far.js';
import { wayGround, wayColliders, stairTread } from './crag.js';
import { MOVE, motion, vertical } from './move.js';

// Round 19: a walking pace for the cultivation figure's stride (was 4 m/s, a run). Round 20: on the gentle stair one step
// per 0.28 m tread at about two steps a second
export const SPEED = 1.3, STAIR_SPEED = 0.55, RADIUS = 0.35;

export function avatar(S) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(RADIUS, 1.0, 6, 14), new THREE.MeshStandardMaterial({ color: '#a3322a', roughness: 0.7 }));
  body.position.y = 0.85; body.castShadow = true; g.add(body);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.2), new THREE.MeshStandardMaterial({ color: '#efe5cf' }));
  nose.position.set(0, 1.45, -0.34); g.add(nose);
  S.add(g); return g;
}

export function inside(p) {
  for (const r of interiors) {
    const dx = p.x - r.x, dz = p.z - r.z, lx = dx * r.c - dz * r.s, lz = dx * r.s + dz * r.c;
    if (Math.abs(lx) < r.hw && Math.abs(lz) < r.hd) return r;
  }
  return null;
}

export function groundAt(x, z) {
  const r = inside({ x, z });
  if (r) return r.y + 0.06;
  // round 24: on a paved way the figure stands on the paving, even where the hill under it rises a hand above (rule 1)
  const w = wayGround(x, z); return w > -Infinity ? w : roadGround(x, z); // round 16: the far mesh; round 18: the crag's stair, landing and bridge
}

// Push the avatar's circle out of every box whose height spans its body.
export function collide(p) {
  for (const list of [colliders, wayColliders]) for (const b of list) {
    if (Math.abs(p.x - b.x) > b.hw + b.hd + 1 || Math.abs(p.z - b.z) > b.hw + b.hd + 1) continue;
    if (b.y1 < p.y + 0.3 || b.y0 > p.y + 1.7) continue;
    const dx = p.x - b.x, dz = p.z - b.z;
    const lx = dx * b.c - dz * b.s, lz = dx * b.s + dz * b.c;
    const qx = Math.max(-b.hw, Math.min(b.hw, lx)), qz = Math.max(-b.hd, Math.min(b.hd, lz));
    let ex = lx - qx, ez = lz - qz, d = Math.hypot(ex, ez);
    if (d >= RADIUS) continue;
    if (d < 1e-6) { // centre inside the box: leave by the nearest face
      const fx = b.hw - Math.abs(lx), fz = b.hd - Math.abs(lz);
      if (fx < fz) { ex = Math.sign(lx) || 1; ez = 0; d = 0; var push = fx + RADIUS; } else { ex = 0; ez = Math.sign(lz) || 1; d = 0; var push = fz + RADIUS; }
      const wx = ex * b.c + ez * b.s, wz = -ex * b.s + ez * b.c; p.x += wx * push; p.z += wz * push; continue;
    }
    const k = (RADIUS - d) / d, ox = ex * k, oz = ez * k;
    p.x += ox * b.c + oz * b.s; p.z += -ox * b.s + oz * b.c;
  }
}

// Round 30: walk, run (Shift, or input.run from the touch button) and jump (Space, or input.jump). The speed eases
// toward its target (MOVE.accel, MOVE.decel); in the air the heading turns only by MOVE.airControl.
export function step(A, input, dt, camYaw) {
  const p = A.position, m = motion(A);
  let mx = 0, mz = 0;
  if (input.keys.size) {
    const f = (input.keys.has('w') || input.keys.has('arrowup') ? 1 : 0) - (input.keys.has('s') || input.keys.has('arrowdown') ? 1 : 0);
    const r = (input.keys.has('d') || input.keys.has('arrowright') ? 1 : 0) - (input.keys.has('a') || input.keys.has('arrowleft') ? 1 : 0);
    const sx = Math.sin(camYaw), cz = Math.cos(camYaw);
    mx = -sx * f + cz * r; mz = -cz * f - sx * r;
    if (f || r) input.target = null;
  }
  if (!mx && !mz && input.target) {
    mx = input.target.x - p.x; mz = input.target.z - p.z;
    if (Math.hypot(mx, mz) < 0.3) { input.target = null; mx = mz = 0; }
  }
  const L = Math.hypot(mx, mz), running = !!(input.run || input.keys.has('shift')), stair = stairTread(p.x, p.z);
  const want = L > 0 ? (stair ? (running ? MOVE.stairRun : MOVE.stair) : (running ? MOVE.run : MOVE.walk)) : 0;
  m.v += Math.sign(want - m.v) * Math.min(Math.abs(want - m.v), (want > m.v ? MOVE.accel : MOVE.decel) * dt);
  if (L > 0) { mx /= L; mz /= L;
    const head = Math.atan2(-mx, -mz); let d = head - A.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
    A.rotation.y += m.air ? d * Math.min(1, dt * 12 * MOVE.airControl) : d; }
  const v = m.v;
  if (v > 1e-3) {
    const hx = -Math.sin(A.rotation.y), hz = -Math.cos(A.rotation.y), sub = Math.ceil(v * dt / 0.2);
    for (let i = 0; i < sub; i++) { const ox = p.x, oz = p.z;
      p.x += hx * v * dt / sub; p.z += hz * v * dt / sub;
      const g = groundAt(p.x, p.z);
      if (m.air) { if (g > p.y + MOVE.landStep) { p.x = ox; p.z = oz; } } // in the air a wall face stops the figure
      else if (g < p.y - MOVE.stepDown) { /* an edge: vertical() starts the fall */ } else p.y = g;
      collide(p); }
  }
  vertical(A, input, dt, groundAt(p.x, p.z));
  const r = inside(p);
  for (const it of interiors) it.roof.visible = it !== r;
  return r;
}
