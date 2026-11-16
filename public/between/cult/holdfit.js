// Baked holds from hold.js (hand grip part 12, his A on hand-grip-look-6, 2026-11-10). The solver ran once on the
// cultivated figure's right hand; what it found is kept here: the digit angles (degrees, as hold.js setDigit takes
// them) and the prop's matrix in the wrist's frame. holdPlace puts the hand where the prop is and closes the fingers.
import * as THREE from 'three';
import * as HD from './hold.js';
export const BAKED = {"brush": {"angles": {"index": [43, 47, 20], "middle": [53, 42, 18], "ring": [61, 47, 30], "pinky": [14, 88, 45], "thumb": [6, -14, 3]}, "inHand": [-0.945722191898521, 0.1066961067709647, 0.4820820131438246, 0, 0.4932258194558531, 0.2520477587681244, 0.9117993569483398, 0, -0.022704496854416556, 1.031147720683979, -0.27275755443486205, 0, -0.1214804727149863, 0.059585005741321084, -0.07626560284486483, 0.9999999999999999], "thumbAxis": null, "dir": [0, 1, 0], "at": [0, 0.12331428571428571, 0]}, "jian": {"angles": {"index": [43, 65, 25.4, -6], "middle": [79, 41, 35.5, -2], "ring": [87, 36, 39.3, 4], "pinky": [88, 29, 35.5, 2], "thumb": [32, 60, 16]}, "inHand": [1.0665958228080097, 0.023474848743356147, -3.7980746089710804e-05, 0, -0.009739694928799447, 0.44409558800040144, 0.9699803775256474, 0, 0.02135919864822805, -0.9697452711802392, 0.4442024564131677, 0, -0.03577716442168427, 0.115106692900872, 0.10997970336697005, 0.9999999999999999], "thumbAxis": [-0.28421235174499415, -0.6779267563324394, -0.6779665568183707], "dir": [0, 1, 0], "at": [0, -0.10908571428571429, 0]}};
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), wp = b => b.getWorldPosition(V());
// The prop's world matrix is already set. The wrist goes where the prop's in-hand matrix puts it, the arm reaches it,
// the digits take their baked angles and the prop rides the wrist. roll: nothing here, the caller picks the prop's
// turn about its axis (see bestRoll).
export function holdPlace(F, prop, name, pole) {
  const B = BAKED[name], R = HD.rigHand(F, 'r'), inHand = new THREE.Matrix4().fromArray(B.inHand);
  prop.updateMatrixWorld(true);
  const Wm = prop.matrixWorld.clone().multiply(inHand.clone().invert()), p = V(), q = new THREE.Quaternion(), s = V();
  Wm.decompose(p, q, s);
  for (let it = 0; it < 3; it++) { HD.ik2(F, 'shoulderR', 'elbowR', 'wristR', p, pole); HD.setHandTurn(R, q); }
  R.thumbAxis = B.thumbAxis ? V(...B.thumbAxis) : null;
  for (const f of ['index', 'middle', 'ring', 'pinky', 'thumb']) HD.setDigit(R, f, B.angles[f]);
  F.root.updateMatrixWorld(true);
  HD.ride({ R, prop, inHand });
  return R;
}
// the turn of the prop about its own axis (dir, world) that bends the wrist least off the forearm
export function bestRoll(F, prop, name, dir, setProp) {
  const B = BAKED[name], R = HD.rigHand(F, 'r'), inHand = new THREE.Matrix4().fromArray(B.inHand).invert();
  const fore = wp(F.bones.wristR).sub(wp(F.bones.elbowR)).normalize(); let best = null;
  for (let th = 0; th < 360; th += 3) { setProp(th * Math.PI / 180); prop.updateMatrixWorld(true);
    const Wm = prop.matrixWorld.clone().multiply(inHand), q = new THREE.Quaternion(); Wm.decompose(V(), q, V());
    const sc = R.DL.clone().applyQuaternion(q).dot(fore); if (!best || sc > best.sc) best = { sc, th: th * Math.PI / 180 }; }
  return best.th;
}
