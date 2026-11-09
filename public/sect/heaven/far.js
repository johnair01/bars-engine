// Round 14b: the far region as ground you can walk on (layout.js farHeight). One coarse mesh round the sect's fine one,
// the ridge road drawn into it, and the Watch: a pavilion with a lit lamp on the nearest far peak, where the road ends.
import * as THREE from 'three';
import { heightAt, GRID, FAR_ROAD, FAR_EXTENT, WATCH } from './layout.js';
import { materials, hall } from './kit.js';

export function farLand(S, floors) {
  const E = FAR_EXTENT, N = 300, cx = 24, cz = -9;
  const g = new THREE.PlaneGeometry(E * 2, E * 2, N, N); g.rotateX(-Math.PI / 2); g.translate(cx, 0, cz);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3), map = new Float32Array(pos.count * 3), c = new THREE.Color(), t = new THREE.Color();
  const { x0, z0, step, nx, nz } = GRID, x1 = x0 + (nx - 1) * step, z1 = z0 + (nz - 1) * step;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), inner = x > x0 + 6 && x < x1 - 6 && z > z0 + 6 && z < z1 - 6;
    const y = heightAt(x, z) - (inner ? 4 : 0); pos.setY(i, y);
    const sl = Math.hypot(heightAt(x + 6, z) - heightAt(x - 6, z), heightAt(x, z + 6) - heightAt(x, z - 6)) / 12;
    // Round 14c: coloured like a relief map, so the land reads as country with valleys and heights: deep green in the
    // valleys, olive on the shoulders, grey rock on steep faces, pale stone on the high tops.
    c.set('#4f6f3e');
    c.lerp(t.set('#7f8a5c'), Math.min(1, Math.max(0, (y + 40) / 140)));
    if (y > 120) c.lerp(t.set('#9b998a'), Math.min(1, (y - 120) / 90));
    if (y > 240) c.lerp(t.set('#d3d4d0'), Math.min(1, (y - 240) / 70));
    if (sl > 0.55) c.lerp(t.set('#8c939a'), Math.min(0.8, (sl - 0.55) * 2.2));
    { const m = 0.5 + 0.5 * Math.sin(x * 0.031 + Math.sin(z * 0.027) * 2) * Math.sin(z * 0.029 + y * 0.05); if (m > 0.62 && sl < 0.9 && y < 160) c.lerp(t.set('#36502c'), (m - 0.62) * 1.6); }
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    // the top view tints the land in 40 m bands, lighter with height, the way a relief map does (true contour lines
    // need a finer mesh than this one; bands read at its 13 m spacing)
    const band = Math.floor((y + 160) / 40), k = 0.86 + 0.06 * (band % 2);
    map[i * 3] = c.r * k; map[i * 3 + 1] = c.g * k; map[i * 3 + 2] = c.b * k;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const T = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  const plain = g.attributes.color, mapped = new THREE.BufferAttribute(map, 3);
  T.userData.mapView = on => { g.setAttribute('color', on ? mapped : plain); };
  T.receiveShadow = true; T.name = 'farLand'; S.add(T); floors.push(T);

  // the Watch: a three-tier pavilion with its lamp lit, facing back down the road to the sect
  const M = materials(), W = new THREE.Group();
  const P = hall(M, { w: 9, d: 7, ph: 3.4, tiers: 3, lit: true, seed: 14, lite: true }); W.add(P);
  W.position.set(WATCH[0], heightAt(WATCH[0], WATCH[1]), WATCH[1]);
  const back = FAR_ROAD[FAR_ROAD.length - 2]; W.rotation.y = Math.atan2(back[0] - WATCH[0], back[1] - WATCH[1]);
  const lamp = new THREE.PointLight('#ffb860', 40, 60); lamp.position.set(0, 4, 0); W.add(lamp);
  S.add(W);
  // Round 14c (part 7): the road as its own paved ribbon laid on the ground, so it reads in every view; the far mesh's
  // 13 m spacing smeared the painted road over whole hillsides.
  { const v = [], idx = [], wHalf = 3;
    for (let k = 1; k < FAR_ROAD.length; k++) { const a = FAR_ROAD[k - 1], b = FAR_ROAD[k], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L;
      for (let s = k === 1 ? 0 : 2; s <= L; s += 2) { const x = a[0] + (b[0] - a[0]) * s / L, z = a[1] + (b[1] - a[1]) * s / L;
        for (const o of [-wHalf, wHalf]) { const px = x + nx * o, pz = z + nz * o; v.push(px, heightAt(px, pz) + 0.3, pz); } } }
    for (let i = 0; i + 3 < v.length / 3; i += 2) idx.push(i, i + 1, i + 2, i + 1, i + 3, i + 2);
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); rg.setIndex(idx); rg.computeVertexNormals();
    const rm = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ color: '#cdb994', roughness: 0.95, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }));
    rm.receiveShadow = true; rm.name = 'farRoad'; S.add(rm); }
  // a stone platform under the Watch, so the pavilion sits on its peak instead of hanging off the slope
  { const y0 = heightAt(WATCH[0], WATCH[1]);
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(9, 11, 9, 8), new THREE.MeshStandardMaterial({ color: '#a59a86', roughness: 1 }));
    pl.position.set(WATCH[0], y0 - 4.4, WATCH[1]); pl.receiveShadow = pl.castShadow = true; S.add(pl); }
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
