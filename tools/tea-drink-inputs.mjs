/* The numbers the Blender build of the drink stands on (art/between/tea-drink/build.py, round 5 of the Between tea, look
   tea-drink-look-1): the sat Average Dusk as the page poses it (tools/tea-rig.mjs: wardrobe.js dressed, stance.js SIT over the
   bind pose, the hips SEAT_PAD over the seat's top), each bone's local turn and place in glTF's own frame, and the round 4
   places in the seat's frame (tea-pose.js: the stone, the pot, the cup's spot under the spout, the cup's size, HAND and GRIP),
   so the scene Blender builds stands where the page draws it. Seat frame: origin the seat's top, +y up, +z the way the figure
   faces, +x its left. Prints JSON.
     npm i --no-save --prefix /tmp/t three@0.160.0 && THREE_DIR=/tmp/t/node_modules/three node tools/tea-drink-inputs.mjs > /tmp/tea-inputs.json */
import { teaRig } from './tea-rig.mjs';
import { KETTLE, CUP, HAND, GRIP, ARM, kettleAt, cupSpot } from '../public/between/tea-pose.js';
import { SIT, SIT_DROP, SEAT_PAD } from '../public/between/stance.js';

/* Where the lips are on this faceless head, in the seat's frame with the figure sat and the head level as the sit leaves it: the
   middle of the face (x 0), at the height round 4's sip mark was fitted to (tea-pose.js HAND_AT.sip, y 0.645), on the face's front
   (the head's points reach z 0.196 to 0.205 at that height, read off the posed mesh). The build carries it on the head bone. */
export const MOUTH = { x: 0, y: 0.645, z: 0.203 };

const R = await teaRig(), f = R.f;
R.pose({ sx: 0, sy: 0, sz: 0, ex: 0, lean: 0 });
const bones = {};
for (const [n, B] of Object.entries(f.bones)) {
  const b = B.b;
  bones[n] = { parent: b.parent && b.parent.isBone ? b.parent.name : null, q: b.quaternion.toArray(), p: b.position.toArray(), q0: B.q.toArray(), p0: B.p.toArray(), w: b.matrixWorld.toArray() };
}
console.log(JSON.stringify({
  top: R.top, bones, SIT, SIT_DROP, SEAT_PAD, KETTLE, CUP, HAND, GRIP, ARM, MOUTH,
  kettle: kettleAt(), cupSpot: cupSpot(),
}));
