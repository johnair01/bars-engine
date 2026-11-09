// Round 11: people in the great court. The anchor painting has robed students at work in small groups; round 10 had none
// and the avatar was a red capsule. Both now use the Between's figure: Average Dusk with the J5 robe (between/wardrobe.js),
// each student dressed in the look anchor.js gives it, the Idle clip breathing under the robe.
import * as THREE from 'three';
import { clone as skClone } from 'three/addons/utils/SkeletonUtils.js';
import { loadParts, dressFigure } from '../../between/wardrobe.js';
import { STUDENTS } from './anchor.js';

export async function people(S, gl, { court, avatar }) {
  const P = await loadParts(u => gl.loadAsync(u));
  const root = P.dusk.scene; root.updateMatrixWorld(true);
  const box = new THREE.Box3(); root.traverse(o => { if (o.isSkinnedMesh) { o.computeBoundingBox(); box.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld)); } });
  const k = 1.7 / Math.max(box.getSize(new THREE.Vector3()).y, 0.01), idle = P.dusk.animations.find(a => a.name === 'Idle');
  const make = (look, phase) => {
    const obj = skClone(root); obj.scale.setScalar(k); obj.position.y = -box.min.y * k;
    const w = dressFigure(obj, P); w.set(look);
    obj.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = true; } });
    const mixer = new THREE.AnimationMixer(obj);
    if (idle) { const a = mixer.clipAction(idle); a.play(); a.time = phase; }
    return { obj, w, mixer };
  };
  const out = [];
  STUDENTS.forEach(([x, z, deg, look], i) => {
    const f = make(look, i * 0.7), h = new THREE.Group(); h.add(f.obj);
    h.position.set(x, 0.04, z); h.rotation.y = Math.PI - deg * Math.PI / 180; court.add(h); out.push(f);
    if (look.kneel) f.pose = kneeler(f.obj, h);
  });
  // the avatar wears the creator's default look in place of the capsule
  if (avatar) { avatar.children.forEach(c => { c.visible = false; }); const f = make(null, 0); f.obj.rotation.y = Math.PI; avatar.add(f.obj); out.push(f); }
  return dt => { for (const f of out) { f.mixer.update(dt); if (f.pose) f.pose(); f.w.dress(dt); } };
}

// Round 13b: the painting's student kneels on the paving to chalk the sigil; round 13's stood (the Idle clip has no
// kneel). Bent over the clip each frame with the garden's bone axes (between/garden.js: hip X lifts the thigh forward,
// knee X folds the shin): sat back on the heels, leaning in, the right hand reaching down to the chalk.
const KNEEL = [['hipL', -1.25, 0, -0.08], ['hipR', -1.55, 0, 0.08], ['kneeL', 2.55, 0, 0], ['kneeR', 2.3, 0, 0], ['spine', 0.45, 0, 0],
  ['neck', 0.3, 0, 0], ['shoulderR', -1.15, 0, 0.15], ['elbowR', -0.35, 0, 0], ['shoulderL', -0.5, 0, -0.2], ['elbowL', -1.1, 0, 0]];
const KNEEL_HIP = 0.5; // metres from the paving to the hip joints, sat on the heels
function kneeler(obj, holder) {
  const B = {}; for (const [n] of KNEEL) { const b = obj.getObjectByName(n); if (b) B[n] = { b, q: b.quaternion.clone() }; }
  const hips = obj.getObjectByName('hips'), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3();
  return () => {
    for (const [n, x, y, z] of KNEEL) if (B[n]) B[n].b.quaternion.copy(B[n].q).multiply(q.setFromEuler(e.set(x, y, z, 'XYZ')));
    if (!hips) return;
    holder.updateMatrixWorld(true);
    const hw = hips.getWorldPosition(v).y - holder.getWorldPosition(new THREE.Vector3()).y, sy = hips.parent.getWorldScale(v).y || 1;
    hips.position.y -= (hw - KNEEL_HIP) / sy;
  };
}
