// Round 11: people in the great court. The anchor painting has robed students at work in small groups.
// One model on the route (Wendell, cd-route-look-1 C: "There are 3 character models. They should be the same character
// model the player picks", and B on one-model-route-look-1, 2026-11-16: "change the nine students first"): the nine
// students are the cultivation figure too, built by the same mix.js the avatar uses (../cult). They are not clones of
// the player: each takes a body (f/m), a skin, a height and one of the outer-sect (A) or wandering (B) outfits
// the parts registry already offers, in the place and heading anchor.js gives it. No new art.
import * as THREE from 'three';
import * as FG from '../cult/figure.js';
import * as M from '../cult/mix.js';
import { STUDENTS } from './anchor.js';

// student i of anchor.js's STUDENTS -> a cultivation mix. build: the sect's ubc folder holds only the regular bodies, so build stays average; skin: the 8-step ramp (0 light .. 7 deep)
const MIXES = [
  { gender: 'f', build: 'average', skin: 2, height: 1.62, outfit: 'A2' },
  { gender: 'm', build: 'average', skin: 1, height: 1.74, outfit: 'A1' },
  { gender: 'f', build: 'average', skin: 6, height: 1.66, outfit: 'B1' },
  { gender: 'm', build: 'average', skin: 4, height: 1.82, outfit: 'A2' },
  { gender: 'f', build: 'average', skin: 0, height: 1.58, outfit: 'A1' },
  { gender: 'm', build: 'average', skin: 3, height: 1.72, outfit: 'B1' },
  { gender: 'm', build: 'average', skin: 6, height: 1.78, outfit: 'A1' },
  { gender: 'f', build: 'average', skin: 5, height: 1.64, outfit: 'A2' },
  { gender: 'f', build: 'average', skin: 1, height: 1.68, outfit: 'B1', kneel: true },
];

// One cultivation figure from a mix: its group, its figure (F) and a turn() that faces it along a world direction.
// The group stands at the origin of its own holder; the caller places the holder.
async function make(mix, reg) {
  const X = await M.build(mix, reg), F = X.F, h = new THREE.Group(), g = new THREE.Group();
  for (const o of [...X.scene.children]) { if (o.isLight) continue; g.add(o); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  h.add(g);
  // the figure's front (F.fr.f) turns to face the world direction (dx, dz) once the holder itself is not turned
  const turn = (dx, dz) => { g.rotation.y = Math.atan2(dx, dz) - Math.atan2(F.fr.f.x, F.fr.f.z); };
  return { h, g, F, turn };
}
let REG = null;
const registry = async () => (REG ||= await (await fetch(new URL('../cult/parts.json', import.meta.url))).json());

/** A spirit for the altar walk (build 2026-11-17): one cultivation figure, from one of four outfits, that doubt.js makes faint. */
export async function spirit(i) {
  const OUT = ['A1', 'B2', 'C1', 'A2'], mix = { direction: OUT[i % 4][0], gender: i % 2 ? 'f' : 'm', build: 'average', skin: [3, 2, 5, 4][i % 4], height: [1.7, 1.62, 1.76, 1.66][i % 4], outfit: OUT[i % 4] };
  return make(mix, await registry());
}

/** Six Elders for the trainee walk (build 2026-11-17): one cultivation figure each, six distinct outfits, no names. */
export async function elder(i) {
  const OUT = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], mix = { direction: OUT[i][0], gender: i % 2 ? 'f' : 'm', build: 'average', skin: [2, 5, 1, 6, 3, 4][i], height: [1.78, 1.64, 1.8, 1.62, 1.74, 1.68][i], outfit: OUT[i] };
  return make(mix, await registry());
}

/** Wayfarers for the guided climb (build 2026-11-20): four students on the way up, cultivation figures in the sect's own outfits. */
export async function wayfarer(i) {
  const OUT = ['A2', 'B1', 'A1', 'B2'], mix = { direction: OUT[i % 4][0], gender: i % 2 ? 'm' : 'f', build: 'average', skin: [5, 2, 6, 1][i % 4], height: [1.63, 1.77, 1.66, 1.73][i % 4], outfit: OUT[i % 4] };
  return make(mix, await registry());
}

export async function people(S, gl, { court, avatar }) {
  const reg = await registry(), students = [];
  // one figure at a time, so the page stays live while nine are cut
  for (let i = 0; i < STUDENTS.length; i++) {
    const [x, z, deg] = STUDENTS[i], mix = { direction: MIXES[i].outfit[0], ...MIXES[i] };
    try {
      const m = await make(mix, reg), { h, g, F } = m; g.name = 'student' + i;
      if (mix.kneel) kneel(F);
      F.mesh.skeleton.update();
      // the figure's front (F.fr.f) turns to the heading the old figure had: it faced +z at rotation 0, heading deg is anchor.js's
      const a = Math.PI - deg * Math.PI / 180; g.rotation.y = a - Math.atan2(F.fr.f.x, F.fr.f.z);
      h.position.set(x, 0.04, z); court.add(h); students[i] = m;
    } catch (e) { console.warn('student', i, e); }
  }
  const done = () => {}; done.students = students; return done;
}

// Round 13b: the painting's student kneels on the paving to chalk the sigil. Aimed the way the lands' seat is: thighs
// forward and down, shins back along the paving, the chest leaning in, the right hand reaching down to the chalk.
function kneel(F) {
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), { f, l } = F.fr, dn = V(0, -1, 0), up = V(0, 1, 0);
  FG.resetPose(F);
  for (const [s, sg] of [['L', 1], ['R', -1]]) {
    FG.aim(F, 'hip' + s, 'knee' + s, V().copy(f).multiplyScalar(0.25).addScaledVector(dn, 1).addScaledVector(l, sg * 0.1));
    FG.aim(F, 'knee' + s, 'ankle' + s, V().copy(f).multiplyScalar(-1).addScaledVector(dn, 0.05).addScaledVector(l, sg * 0.05));
    FG.aim(F, 'ankle' + s, 'ball' + s, V().copy(f).multiplyScalar(-1).addScaledVector(dn, 0.25));
  }
  FG.aim(F, 'spine', 'neck', V().copy(up).addScaledVector(f, 0.45));
  FG.aim(F, 'shoulderR', 'elbowR', V().copy(dn).addScaledVector(f, 0.9).addScaledVector(l, -0.15));
  FG.aim(F, 'elbowR', 'wristR', V().copy(dn).addScaledVector(f, 0.6));
  FG.aim(F, 'shoulderL', 'elbowL', V().copy(dn).addScaledVector(f, 0.4).addScaledVector(l, 0.2));
  FG.aim(F, 'elbowL', 'wristL', V().copy(dn).addScaledVector(f, 0.9));
  // knees onto the paving: lower the root until the lowest skin point is on it
  const P = F.mesh.geometry.attributes.position, v = V(); let lo = 1e9; F.root.updateMatrixWorld(true); F.mesh.skeleton.update();
  for (let i = 0; i < P.count; i += 3) { v.fromBufferAttribute(P, i); F.mesh.applyBoneTransform(i, v); v.applyMatrix4(F.mesh.matrixWorld); lo = Math.min(lo, v.y); }
  F.root.position.y -= lo - 0.006; F.root.updateMatrixWorld(true);
  F.poseName = 'kneel';
}
