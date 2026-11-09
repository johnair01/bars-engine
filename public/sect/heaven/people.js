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
  });
  // the avatar wears the creator's default look in place of the capsule
  if (avatar) { avatar.children.forEach(c => { c.visible = false; }); const f = make(null, 0); f.obj.rotation.y = Math.PI; avatar.add(f.obj); out.push(f); }
  return dt => { for (const f of out) { f.mixer.update(dt); f.w.dress(dt); } };
}
