// Five satisfaction crop families in the farm's toon style (farm.js PAL, toon ramp). Colour per family from
// unpacking-walk.ts CHANNEL_LIGHT. Design pass satisfaction-crops-2026-11-16. cropMesh(channel) returns a ripe plant.
import * as THREE from 'three';
const ramp = (() => { const t = new THREE.DataTexture(new Uint8Array([70, 140, 200, 255]), 4, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
export const toon = (c, o = {}) => new THREE.MeshToonMaterial({ color: new THREE.Color(c), gradientMap: ramp, ...o });
const glow = (c, o = {}) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c), ...o });
const M = (g, m) => { const x = new THREE.Mesh(g, m); x.castShadow = true; x.receiveShadow = true; return x; };
const LEAF = '#5f9e45', LEAF2 = '#7cbb52';
export const CHANNEL_LIGHT = { anger: '#ff9a6b', sadness: '#8fb8ff', fear: '#e6edf5', joy: '#b6f08a', neutrality: '#f3d79a' };
export const FAMILIES = [
  { channel: 'anger', state: 'Triumph', crop: 'Ember pepper', fruit: '#e2522f' },
  { channel: 'sadness', state: 'Poignance', crop: 'Rain bell', fruit: '#5f86d9' },
  { channel: 'fear', state: 'Wonder-Excitement', crop: 'Moon radish', fruit: '#f4f1ea' },
  { channel: 'joy', state: 'Bliss', crop: 'Sun pea', fruit: '#9fd84a' },
  { channel: 'neutrality', state: 'Peace', crop: 'Hearth squash', fruit: '#f2b93a' },
];
function leaf(len, w, c) { const g = new THREE.SphereGeometry(0.1, 10, 6); g.translate(0.1, 0, 0); const l = M(g, toon(c)); l.scale.set(len * 10, 0.28, w * 10); return l; }
function stem(h, c = LEAF, r = 0.02) { const s = M(new THREE.CylinderGeometry(r * 0.7, r, h, 6), toon(c)); s.position.y = h / 2; return s; }
function halo(G, y, c, r = 0.22) { const h = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), glow(c, { transparent: true, opacity: 0.28, depthWrite: false })); h.position.y = y; G.add(h); }
const builders = {
  anger(f) { const G = new THREE.Group(); G.add(stem(0.5));
    for (let i = 0; i < 7; i++) { const l = leaf(0.018, 0.008, i % 2 ? LEAF : LEAF2); l.position.y = 0.15 + i * 0.05; l.rotation.y = i * 2.3; l.rotation.z = 0.4; G.add(l); }
    for (let i = 0; i < 5; i++) { const a = i * 1.26, p = M(new THREE.ConeGeometry(0.045, 0.2, 10), toon(f.fruit, { emissive: new THREE.Color('#3a0a00') })); p.rotation.z = Math.PI; p.position.set(Math.cos(a) * 0.13, 0.33 + (i % 2) * 0.08, Math.sin(a) * 0.13); G.add(p);
      const c = M(new THREE.CylinderGeometry(0.02, 0.03, 0.03, 6), toon(LEAF)); c.position.copy(p.position); c.position.y += 0.1; G.add(c); }
    halo(G, 0.38, CHANNEL_LIGHT.anger, 0.26); return G; },
  sadness(f) { const G = new THREE.Group();
    for (let k = 0; k < 3; k++) { const S = new THREE.Group(); S.add(stem(0.62, LEAF, 0.015)); S.rotation.z = 0.25; S.rotation.y = k * 2.1; G.add(S);
      for (let i = 0; i < 3; i++) { const b = M(new THREE.ConeGeometry(0.05, 0.09, 12, 1, true), toon(f.fruit, { side: THREE.DoubleSide })); const y = 0.36 + i * 0.1; b.position.set(0.06 + i * 0.015, y, 0); b.rotation.z = 0.2; S.add(b);
        const d = M(new THREE.SphereGeometry(0.012, 6, 4), glow('#dceaff')); d.position.set(0.06 + i * 0.015, y - 0.06, 0); S.add(d); } }
    for (let i = 0; i < 6; i++) { const l = leaf(0.02, 0.006, i % 2 ? LEAF : LEAF2); l.position.y = 0.05; l.rotation.y = i * 1.05; l.rotation.z = -0.25; G.add(l); }
    halo(G, 0.45, CHANNEL_LIGHT.sadness, 0.25); return G; },
  fear(f) { const G = new THREE.Group(); const r = M(new THREE.SphereGeometry(0.11, 16, 12), toon(f.fruit, { emissive: new THREE.Color('#202430') })); r.scale.set(1, 1.15, 1); r.position.y = 0.08; G.add(r);
    for (let i = 0; i < 7; i++) { const l = M(new THREE.ConeGeometry(0.035, 0.55 + (i % 3) * 0.08, 6), toon(i % 2 ? '#6fae5a' : '#8cc4a0')); l.position.set(Math.cos(i * 0.9) * 0.04, 0.42, Math.sin(i * 0.9) * 0.04); l.rotation.set(Math.sin(i * 0.9) * 0.3, 0, Math.cos(i * 0.9) * 0.3); G.add(l); }
    for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 4), glow('#ffffff')); s.position.set(Math.cos(i) * 0.2, 0.5 + (i % 3) * 0.12, Math.sin(i) * 0.2); G.add(s); }
    halo(G, 0.15, CHANNEL_LIGHT.fear, 0.24); return G; },
  joy(f) { const G = new THREE.Group();
    for (const x of [-0.14, 0.14]) { const p = M(new THREE.CylinderGeometry(0.012, 0.015, 0.8, 5), toon('#b07c4c')); p.position.set(x, 0.4, 0); G.add(p); }
    const bar = M(new THREE.CylinderGeometry(0.01, 0.01, 0.32, 5), toon('#b07c4c')); bar.rotation.z = Math.PI / 2; bar.position.y = 0.78; G.add(bar);
    const pts = []; for (let t = 0; t <= 1.0001; t += 0.05) pts.push(new THREE.Vector3(Math.sin(t * 12) * 0.13, 0.02 + t * 0.75, Math.cos(t * 12) * 0.04));
    G.add(M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.012, 5), toon(LEAF)));
    pts.forEach((q, i) => { if (i % 2) return; const l = leaf(0.008, 0.005, i % 4 ? LEAF2 : LEAF); l.position.copy(q); l.rotation.y = i; G.add(l);
      if (i % 4 === 0 && i > 2) { const pod = M(new THREE.CapsuleGeometry(0.025, 0.1, 4, 8), toon(f.fruit, { emissive: new THREE.Color('#1c3000') })); pod.position.copy(q); pod.position.x += 0.04; pod.rotation.z = 0.5; G.add(pod); }
      if (i % 6 === 2) { const fl = M(new THREE.SphereGeometry(0.03, 8, 6), toon('#fff3a8')); fl.position.copy(q); fl.position.x -= 0.04; G.add(fl); } });
    halo(G, 0.45, CHANNEL_LIGHT.joy, 0.3); return G; },
  neutrality(f) { const G = new THREE.Group(); const sq = M(new THREE.SphereGeometry(0.15, 18, 12), toon(f.fruit, { emissive: new THREE.Color('#3a2600') })); sq.scale.set(1.15, 0.8, 1.15); sq.position.y = 0.12; G.add(sq);
    for (let i = 0; i < 8; i++) { const rib = M(new THREE.TorusGeometry(0.15, 0.008, 4, 24), toon('#d79a22')); rib.scale.set(1.15, 0.8, 1.15); rib.rotation.order = 'YXZ'; rib.rotation.set(0, i * Math.PI / 8, 0); rib.position.y = 0.12; G.add(rib); }
    const st = M(new THREE.CylinderGeometry(0.015, 0.025, 0.07, 6), toon('#6b7a2e')); st.position.y = 0.25; G.add(st);
    for (let i = 0; i < 4; i++) { const l = leaf(0.022, 0.016, i % 2 ? LEAF : LEAF2); l.position.y = 0.03; l.rotation.y = i * 1.57 + 0.6; l.rotation.z = -0.1; G.add(l); }
    halo(G, 0.14, CHANNEL_LIGHT.neutrality, 0.27); return G; },
};
export function cropMesh(channel) { const f = FAMILIES.find(x => x.channel === channel); return builders[channel](f); }
