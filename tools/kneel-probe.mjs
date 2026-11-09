/* Probe: the kneel on the dressed figure in node. THREE_DIR=/tmp/t/node_modules/three node tools/kneel-probe.mjs */
import { THREE, parts, figure, look } from './figure-rig.mjs';
import { pathToFileURL } from 'node:url'; import path from 'node:path';
const { makeKneeler, DURATION } = await import(pathToFileURL(path.join(path.dirname(new URL(import.meta.url).pathname), '../public/between/kneel-rig.js')).href);
const P = await parts(), f = figure(P); f.w.set && f.w.set(look('average', 'jacket'));
const holder = new THREE.Group(); holder.add(f.obj); holder.updateMatrixWorld(true);
const k = makeKneeler(THREE, f.obj, holder);
console.log('rig', !!k);
f.obj.traverse(o => { if (o.isSkinnedMesh) console.log('mesh', JSON.stringify(o.name), o.visible, o.geometry.attributes.position.count); });
for (const t of [0, 1, 2, 3, 4, DURATION]) { k.apply(t); const v = new THREE.Vector3(), lo = {};
  f.obj.traverse(o => { if (!o.isSkinnedMesh || !o.visible) return; let m = Infinity; const p = o.geometry.attributes.position; for (let i = 0; i < p.count; i += 3) { v.fromBufferAttribute(p, i); o.applyBoneTransform(i, v); v.applyMatrix4(o.matrixWorld); m = Math.min(m, v.y); } lo[o.name || '(body)'] = +m.toFixed(3); });
  console.log(t, JSON.stringify(lo)); }
console.log('dims G', JSON.stringify(k.dims.G), 'ahead', k.ahead, 'DURATION', DURATION);
const B = n => f.obj.getObjectByName(n).getWorldPosition(new THREE.Vector3());
for (let t = 0; t <= 4.01; t += 0.5) { k.apply(t); let m = Infinity; const v = new THREE.Vector3(); f.obj.traverse(o => { if (o.isSkinnedMesh && o.name === 'Figure') { const p = o.geometry.attributes.position; for (let i = 0; i < p.count; i += 3) { v.fromBufferAttribute(p, i); o.applyBoneTransform(i, v); v.applyMatrix4(o.matrixWorld); m = Math.min(m, v.y); } } });
  console.log(t.toFixed(1), 'low', m.toFixed(3), 'hips', B('hips').y.toFixed(2), 'kneeL', B('kneeL').y.toFixed(2), 'kneeR', B('kneeR').y.toFixed(2), 'ankL', B('ankleL').y.toFixed(2), 'ankR', B('ankleR').y.toFixed(2)); }
