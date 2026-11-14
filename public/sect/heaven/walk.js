// The avatar: a capsule at 4 m/s, WASD relative to the camera, tap-to-walk, slides along walls, stands on the ground
// or a room floor; roofs lift when it steps inside a room.
import * as THREE from 'three';
import { heightAt } from './layout.js';
import { colliders, interiors } from './world.js';
import { roadGround } from './far.js';

export const SPEED = 4, RADIUS = 0.35;

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
  return r ? r.y + 0.06 : roadGround(x, z); // round 16: stand on the far mesh where it is drawn above the heightfield
}

// Push the avatar's circle out of every box whose height spans its body.
export function collide(p) {
  for (const b of colliders) {
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

export function step(A, input, dt, camYaw) {
  const p = A.position;
  let mx = 0, mz = 0;
  if (input.keys.size) {
    const f = (input.keys.has('w') || input.keys.has('arrowup') ? 1 : 0) - (input.keys.has('s') || input.keys.has('arrowdown') ? 1 : 0);
    const r = (input.keys.has('d') || input.keys.has('arrowright') ? 1 : 0) - (input.keys.has('a') || input.keys.has('arrowleft') ? 1 : 0);
    const sx = Math.sin(camYaw), cz = Math.cos(camYaw);
    mx = -sx * f + cz * r; mz = -cz * f - sx * r;
    input.target = null;
  } else if (input.target) {
    mx = input.target.x - p.x; mz = input.target.z - p.z;
    if (Math.hypot(mx, mz) < 0.3) { input.target = null; mx = mz = 0; }
  }
  const L = Math.hypot(mx, mz);
  if (L > 0) {
    mx /= L; mz /= L;
    const sub = Math.ceil(SPEED * dt / 0.2);
    for (let i = 0; i < sub; i++) { p.x += mx * SPEED * dt / sub; p.z += mz * SPEED * dt / sub; p.y = groundAt(p.x, p.z); collide(p); }
    A.rotation.y = Math.atan2(-mx, -mz);
  }
  p.y = groundAt(p.x, p.z);
  const r = inside(p);
  for (const it of interiors) it.roof.visible = it !== r;
  return r;
}
