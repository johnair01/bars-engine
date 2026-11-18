// Fidelity: the cultivator against the CMU capture the repo ships, in numbers, on one page.
// The motion lab poses the orange capture rig beside the figure and poses both at the same frame, so the two are
// measured in the same world at the same instant. This module reads that pair and says, check by check, whether the
// figure moves like the capture does.
//
// Wendell, on the gate (board row cl-fidelity-gate-look-1, answer B): "the mocap is partially angled where the model
// is in profile we need to adjust to account for this. Also the feet bones don't match."
//   - The angle: the capture rig does not travel with the figure. Its own travel direction is measured from its feet
//     and turned to the figure's heading before anything is measured, so both rigs are read in one frame and the
//     angle that was corrected is reported, not hidden.
//   - The feet: the capture rig's chain is thigh/shin/foot/toe where the figure's is hip/knee/ankle/ball. The mapping is
//     written out below, the foot point is the capture's toe bone ORIGIN (the metatarsal head, the same point as the
//     figure's ball bone), and every length is compared as a fraction of the rig's own leg, because the capture's
//     foot is not the figure's foot and metres alone would compare two different feet.
//
// A capture is not a target pose to copy frame for frame; it is a bound on the numbers that make a walk read as a
// walk: the pelvis stays level, the swing knee folds, the torso leans and the lean moves with the weight, the foot
// lifts and comes down near where it left. The bands are relative to the capture measured on the same frame, so a
// figure that matches the capture passes, and a capture measured against itself always passes.
//
//   const F = await import('/between/cult/motion-fidelity.js');
//   const both = F.measureBoth(window.__motionLabControl, 'walk');
//   const verdict = F.compare('walk', both.figure, both.capture);
import * as THREE from 'three';
import { summarise, compare, BANDS } from './motion-fidelity-rules.js';
export { summarise, compare, BANDS };

const V = () => new THREE.Vector3();
const wp = b => b.getWorldPosition(V());
const r3 = x => Math.round(x * 1e3) / 1e3;
const r2 = x => Math.round(x * 100) / 100;

// the joint mapping, written out: the capture rig (the CMU rig baked in reference-cmu-walk-run.glb) names its
// joints the way the mocap does, the game rig names them the way its own files do. The capture's "foot" bone is its
// ankle; the capture's "toe" bone starts at the metatarsal head, which is the point the figure's "ball" bone names.
export const JOINTS = {
  capture: { hip: 'thigh', knee: 'shin', ankle: 'foot', ball: 'toe (bone origin: the metatarsal head)' },
  figure: { hip: 'hip', knee: 'knee', ankle: 'ankle', ball: 'ball' },
};

// the capture rig's bones, by name
const captureBones = ref => {
  const byName = n => ref.bones.find(b => b.name === n);
  return { pelvis: byName('spine'), chest: byName('spine.003'),
    hip: ['thigh.L', 'thigh.R'].map(byName), knee: ['shin.L', 'shin.R'].map(byName),
    ankle: ['foot.L', 'foot.R'].map(byName), ball: ['toe.L', 'toe.R'].map(byName) };
};
// the figure's bones, by name
const figureBones = F => ({ pelvis: F.bones.hips, chest: F.bones.spine03,
  hip: ['hipL', 'hipR'].map(n => F.bones[n]), knee: ['kneeL', 'kneeR'].map(n => F.bones[n]),
  ankle: ['ankleL', 'ankleR'].map(n => F.bones[n]), ball: ['ballL', 'ballR'].map(n => F.bones[n]) });

// the angle at a joint, in degrees: straight is 180
const jointAngle = (a, j, b) => +(a.clone().sub(j).angleTo(b.clone().sub(j)) * 180 / Math.PI).toFixed(2);
// the yaw of a direction around Y, in degrees
const yawOf = v => Math.atan2(v.x, v.z) * 180 / Math.PI;
// the direction a rig travels in, from its feet: the line the toes point
const travelOf = (ballL, ballR, ankleL, ankleR) => {
  const f = ballL.clone().sub(ankleL).add(ballR.clone().sub(ankleR));
  if (f.lengthSq() < 1e-8) f.set(0, 0, -1);
  return f.setY(0).normalize();
};

// the lengths of a rig's chain, so a reader can see that the two rigs' feet are not the same foot
function segments(bones) {
  const out = {};
  for (let i = 0; i < 2; i++) {
    const hip = wp(bones.hip[i]), knee = wp(bones.knee[i]), ankle = wp(bones.ankle[i]), ball = wp(bones.ball[i]);
    out.thigh = +(hip.distanceTo(knee)).toFixed(4);
    out.shin = +(knee.distanceTo(ankle)).toFixed(4);
    out.foot = +(ankle.distanceTo(ball)).toFixed(4);
    out.leg = +(hip.distanceTo(ball)).toFixed(4);
  }
  out.legFraction = { thigh: +(out.thigh / out.leg).toFixed(4), shin: +(out.shin / out.leg).toFixed(4),
    foot: +(out.foot / out.leg).toFixed(4) };
  return out;
}

// one rig, one frame: the readings the checks use
function readings(bones, ground, forward) {
  const pelvis = wp(bones.pelvis), chest = wp(bones.chest);
  const lean = +(Math.atan2(chest.clone().sub(pelvis).dot(forward), chest.y - pelvis.y) * 180 / Math.PI).toFixed(2);
  const knees = bones.knee.map((k, i) => jointAngle(wp(bones.hip[i]), wp(k), wp(bones.ankle[i])));
  const balls = bones.ball.map(t => wp(t));
  return {
    pelvisHeight: +(pelvis.y - ground).toFixed(4),
    lean,
    kneeFold: Math.min(...knees),                     // the most folded knee this frame
    kneeMid: +(knees.reduce((a, b) => a + b, 0) / knees.length).toFixed(2),
    ballY: balls.map(t => +(t.y - ground).toFixed(4)),
    reach: balls.map(t => +(t.clone().sub(pelvis).dot(forward)).toFixed(3)),
  };
}

// measure the figure and the capture over one cycle of `motion`, frame by frame, in the same world.
// Returns the figures' own metrics and the capture's, so a caller can compare them or read either alone.
export function measureBoth(c, motion, { steps = 48 } = {}) {
  const W = c.walker, F = W.X.F, ref = c.ref;
  if (!F || !ref) throw new Error('the lab has no figure or no capture yet');
  c.set(motion, 0);                       // the motion first: the lab's cycle length depends on it
  const dur = c.duration, fig = [], cap = [];
  const figFwd = F.fr.f.clone().setY(0).normalize();
  let angle = null;                       // the capture's travel against the figure's heading, in degrees
  for (let i = 0; i < steps; i++) {
    const t = dur * i / steps;
    c.set(motion, t);
    W.X.scene.updateMatrixWorld(true); ref.group.updateMatrixWorld(true);
    const fb = figureBones(F), cb = captureBones(ref);
    // the capture's own travel direction, from its feet
    const capFwd = travelOf(wp(cb.ball[0]), wp(cb.ball[1]), wp(cb.ankle[0]), wp(cb.ankle[1]));
    if (angle === null) {
      // the capture is not pointing where the figure is pointing: turn it, and say by how much
      angle = +(yawOf(capFwd) - yawOf(figFwd)).toFixed(2);
      ref.group.rotation.y -= angle * Math.PI / 180;
      W.X.scene.updateMatrixWorld(true); ref.group.updateMatrixWorld(true);
    }
    // after the turn both rigs are read in the figure's frame
    fig.push(readings(fb, 0, figFwd));
    cap.push(readings(cb, 0, figFwd));
  }
  // the capture's floor: the lowest foot point it touches over the cycle
  const capGround = Math.min(...cap.flatMap(f => f.ballY));
  const capFixed = cap.map(f => ({ ...f, pelvisHeight: +(f.pelvisHeight - capGround).toFixed(4), ballY: f.ballY.map(y => +(y - capGround).toFixed(4)) }));
  const fb = figureBones(F), cb = captureBones(ref);
  const figLeg = segments(fb), capLeg = segments(cb);
  return {
    motion, steps, duration: dur,
    captureAngleDeg: angle,                                  // the angle the turn corrected
    figureLeg: figLeg, captureLeg: capLeg,                   // the two rigs' chains, in metres and as leg fractions
    figure: summarise(fig, figLeg.leg), capture: summarise(capFixed, capLeg.leg),
  };
}
