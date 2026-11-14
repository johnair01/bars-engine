/* Round 5's drink on the sat Average Dusk in node, for tools/tea-hand-probe.mjs and the curve sheet: loads the baked clips
   (public/between/m/dusk/tea-drink.glb), plays them with public/between/tea-drink.js exactly as the page does, puts the cup
   where the page puts it (in the right wrist at the build's Child Of offset once the hand lifts it, on the stone before), and
   reads what the probe checks: the cup's middle and axis, the lips, the head's bow. Seat frame: origin the seat's top, +x the
   figure's left, +z the way it faces.
     node tools/tea-drink-play.mjs --curves out.json     (with THREE_DIR as tools/tea-rig.mjs says) writes the baked curves */
import fs from 'node:fs';
import path from 'node:path';
import { teaRig } from './tea-rig.mjs';
import { THREE } from './figure-rig.mjs';
import { drinkFrom, drinkPlayer, beatAt, cupInHand } from '../public/between/tea-drink.js';
import { cupSpot } from '../public/between/tea-pose.js';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
export const GLB = path.join(HERE, '..', 'public/between/m/dusk/tea-drink.glb');

export async function drinkRig() {
  const R = await teaRig(), B = n => R.f.bones[n].b;
  const buf = fs.readFileSync(GLB);
  const gltf = await new Promise((ok, no) => new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', ok, no));
  const drink = drinkFrom(gltf), P = drinkPlayer(THREE, drink, R.f.obj), held = cupInHand(drink.tl);
  R.sit();
  const top = R.top;
  // the lips ride the head: their place in the head's frame, read once with the head as the sit leaves it
  const ms = drink.tl.mouth.seat, mouthLocal = B('head').worldToLocal(new THREE.Vector3(ms[0], ms[1] + top, ms[2]));
  const headQ0 = B('head').getWorldQuaternion(new THREE.Quaternion());
  const cs = cupSpot(), cupQ = new THREE.Quaternion(...held.q), stoneQ = new THREE.Quaternion(...held.stone);
  /* The figure posed at t seconds into a run (mode "pour" or "sip"), and what stands where. */
  function at(mode, t, opts) {
    R.sit(); P.apply(mode, t, opts); R.f.obj.updateMatrixWorld(true);
    const s = beatAt(drink.tl, mode, t), w = B('wristR');
    let c, cq;
    if (s.inHand) {
      c = new THREE.Vector3(...held.p).applyMatrix4(w.matrixWorld); c.y -= top;
      cq = w.getWorldQuaternion(new THREE.Quaternion()).multiply(cupQ);
    } else { c = new THREE.Vector3(cs.x, cs.y, cs.z); cq = stoneQ.clone(); }
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cq);
    const m = mouthLocal.clone().applyMatrix4(B('head').matrixWorld); m.y -= top;
    // the near rim: the top rim's point nearest the lips
    const top3 = c.clone().addScaledVector(up, 0.035), toM = m.clone().sub(top3); toM.addScaledVector(up, -toM.dot(up));
    const rim = top3.clone().addScaledVector(toM.lengthSq() > 1e-10 ? toM.normalize() : new THREE.Vector3(0, 0, -1), 0.042);
    // the head's bow against the sit's: + is the face turned down
    const hq = B('head').getWorldQuaternion(new THREE.Quaternion()), f0 = new THREE.Vector3(0, 0, 1).applyQuaternion(headQ0), f1 = new THREE.Vector3(0, 0, 1).applyQuaternion(hq);
    const bow = Math.asin(Math.max(-1, Math.min(1, f0.y))) - Math.asin(Math.max(-1, Math.min(1, f1.y)));
    const hand = new THREE.Vector3(0, 0.088, 0).applyMatrix4(w.matrixWorld); hand.y -= top;
    const handL = new THREE.Vector3(0, 0.092, 0).applyMatrix4(B('wristL').matrixWorld); handL.y -= top;
    return { s, cup: { x: c.x, y: c.y, z: c.z }, up: { x: up.x, y: up.y, z: up.z }, cupQ: cq, mouth: m, rim, bow, tip: Math.acos(Math.max(-1, Math.min(1, up.y))), hand, handL };
  }
  return { R, P, drink, at, B, top };
}

if (process.argv.includes('--curves')) {
  const out = process.argv[process.argv.indexOf('--curves') + 1];
  const D = await drinkRig(), rows = [], end = D.P.end('pour'), Q = n => D.B(n).quaternion.clone();
  const names = ['shoulderR', 'elbowR', 'wristR', 'head', 'spine'];
  let q0 = null;
  for (let t = 0; t <= end + 0.001; t += 1 / 30) {
    const a = D.at('pour', t), qs = Object.fromEntries(names.map(n => [n, Q(n)]));
    if (!q0) q0 = qs;
    rows.push({ t, clip: a.s.clip, cup: a.cup, tip: a.tip, bow: a.bow, lips: a.s.lips,
      turn: Object.fromEntries(names.map(n => [n, 2 * Math.acos(Math.min(1, Math.abs(qs[n].dot(q0[n]))))])) });
  }
  fs.writeFileSync(out, JSON.stringify({ end, clips: D.drink.tl.clips, rows }));
  console.log('curves', rows.length, '->', out);
}
