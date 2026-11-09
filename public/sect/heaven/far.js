// Round 14b: the far region as ground you can walk on (layout.js farHeight). One coarse mesh round the sect's fine one,
// the ridge road drawn into it, and the Watch: a pavilion with a lit lamp on the nearest far peak, where the road ends.
import * as THREE from 'three';
import { heightAt, GRID, FAR_ROAD, FAR_EXTENT, WATCH } from './layout.js';
import { materials, hall } from './kit.js';

export function farLand(S, floors) {
  const E = FAR_EXTENT, N = 300, cx = 24, cz = -9;
  const g = new THREE.PlaneGeometry(E * 2, E * 2, N, N); g.rotateX(-Math.PI / 2); g.translate(cx, 0, cz);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color(), t = new THREE.Color();
  const { x0, z0, step, nx, nz } = GRID, x1 = x0 + (nx - 1) * step, z1 = z0 + (nz - 1) * step;
  const road = new THREE.Color('#b5a58a');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), inner = x > x0 + 6 && x < x1 - 6 && z > z0 + 6 && z < z1 - 6;
    const y = heightAt(x, z) - (inner ? 4 : 0); pos.setY(i, y);
    const sl = Math.hypot(heightAt(x + 6, z) - heightAt(x - 6, z), heightAt(x, z + 6) - heightAt(x, z - 6)) / 12;
    // green shoulders, grey rock where it's steep, pale stone near the tops, the way the painting's ranges read up close
    c.set('#6f8160');
    if (sl > 0.55) c.lerp(t.set('#8c96a0'), Math.min(1, (sl - 0.55) * 2.5));
    if (y > 120) c.lerp(t.set('#a9b2ba'), Math.min(0.6, (y - 120) / 120));
    { const m = 0.5 + 0.5 * Math.sin(x * 0.031 + Math.sin(z * 0.027) * 2) * Math.sin(z * 0.029 + y * 0.05); if (m > 0.62 && sl < 0.9) c.lerp(t.set('#3f5a33'), (m - 0.62) * 1.6); }
    for (let k = 1; k < FAR_ROAD.length; k++) {
      const a = FAR_ROAD[k - 1], b = FAR_ROAD[k], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz;
      const u = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
      if (Math.hypot(x - a[0] - u * dx, z - a[1] - u * dz) < 9) { c.lerp(road, 0.85); break; }
    }
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const T = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  T.receiveShadow = true; T.name = 'farLand'; S.add(T); floors.push(T);

  // the Watch: a three-tier pavilion with its lamp lit, facing back down the road to the sect
  const M = materials(), W = new THREE.Group();
  const P = hall(M, { w: 9, d: 7, ph: 3.4, tiers: 3, lit: true, seed: 14, lite: true }); W.add(P);
  W.position.set(WATCH[0], heightAt(WATCH[0], WATCH[1]), WATCH[1]);
  const back = FAR_ROAD[FAR_ROAD.length - 2]; W.rotation.y = Math.atan2(back[0] - WATCH[0], back[1] - WATCH[1]);
  const lamp = new THREE.PointLight('#ffb860', 40, 60); lamp.position.set(0, 4, 0); W.add(lamp);
  S.add(W);
  // stone lantern posts every 40 m along the road, so its line reads from the court
  const post = new THREE.CylinderGeometry(0.5, 0.7, 3, 6); post.translate(0, 1.5, 0);
  const pts = [];
  for (let k = 1; k < FAR_ROAD.length; k++) { const a = FAR_ROAD[k - 1], b = FAR_ROAD[k], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let s = 0; s < L; s += 40) { const u = s / L, x = a[0] + (b[0] - a[0]) * u + 4, z = a[1] + (b[1] - a[1]) * u; pts.push([x, z]); } }
  const I = new THREE.InstancedMesh(post, new THREE.MeshStandardMaterial({ color: '#d8c9a6', emissive: '#ffb860', emissiveIntensity: 0.25 }), pts.length);
  const m4 = new THREE.Matrix4();
  pts.forEach(([x, z], i) => { m4.makeTranslation(x, heightAt(x, z), z); I.setMatrixAt(i, m4); }); S.add(I);
  return { T, W };
}
