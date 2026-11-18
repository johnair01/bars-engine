// Fidelity: the cultivator against the CMU capture the repo ships, in numbers, on one page.
// The motion lab poses the orange capture rig beside the figure and poses both at the same frame, so the two are
// measured in the same world at the same instant. This module reads that pair and says, check by check, whether the
// figure moves like the capture does.
//
// A capture is not a target pose to copy frame for frame; it is a bound on the numbers that make a walk read as a
// walk: the pelvis stays level, the swing knee folds, the torso leans and the lean moves with the weight, the foot
// lifts and comes down near where it left. The bands below are relative to the capture measured on the same frame,
// so a figure that matches the capture passes, and a capture measured against itself always passes.
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

// the capture rig's joint names (the CMU rig baked in reference-cmu-walk-run.glb) and the figure's (the game rig)
const CAPTURE = { pelvis: 'spine', chest: 'spine.003', thigh: ['thigh.L', 'thigh.R'], shin: ['shin.L', 'shin.R'],
  foot: ['foot.L', 'foot.R'], toe: ['toe.L', 'toe.R'] };
const FIGURE = { pelvis: 'hips', chest: 'spine03', hip: ['hipL', 'hipR'], knee: ['kneeL', 'kneeR'],
  ankle: ['ankleL', 'ankleR'], toe: ['ballL', 'ballR'] };

// the angle at a joint, in degrees: straight is 180
const jointAngle = (a, j, b) => +(a.clone().sub(j).angleTo(b.clone().sub(j)) * 180 / Math.PI).toFixed(2);
// the forward of a rig on the floor: the line from the left foot to the right foot
const forwardOf = (toeL, toeR, ankleL, ankleR) => {
  const f = toeL.clone().sub(ankleL).add(toeR.clone().sub(ankleR));
  if (f.lengthSq() < 1e-8) f.set(0, 0, -1);
  return f.setY(0).normalize();
};

// one rig, one frame: the readings the checks use
function readings(bones, ground, forward) {
  const pelvis = wp(bones.pelvis), chest = wp(bones.chest);
  const lean = +(Math.atan2(chest.clone().sub(pelvis).dot(forward), chest.y - pelvis.y) * 180 / Math.PI).toFixed(2);
  const knees = bones.knee.map((k, i) => jointAngle(wp(bones.hip[i]), wp(k), wp(bones.ankle[i])));
  const toes = bones.toe.map(t => wp(t));
  return {
    pelvisHeight: +(pelvis.y - ground).toFixed(4),
    lean,
    kneeFold: Math.min(...knees),                     // the most folded knee this frame
    kneeMid: +(knees.reduce((a, b) => a + b, 0) / knees.length).toFixed(2),
    toeY: toes.map(t => +(t.y - ground).toFixed(4)),
    reach: toes.map(t => +(t.clone().sub(pelvis).dot(forward)).toFixed(3)),
  };
}

// the capture rig's bones, by name
const captureBones = ref => {
  const byName = n => ref.bones.find(b => b.name === n);
  return { pelvis: byName(CAPTURE.pelvis), chest: byName(CAPTURE.chest),
    hip: CAPTURE.thigh.map(byName), knee: CAPTURE.shin.map(byName), ankle: CAPTURE.foot.map(byName), toe: CAPTURE.toe.map(byName) };
};
// the figure's bones, by name
const figureBones = F => ({ pelvis: F.bones.hips, chest: F.bones.spine03,
  hip: FIGURE.hip.map(n => F.bones[n]), knee: FIGURE.knee.map(n => F.bones[n]), ankle: FIGURE.ankle.map(n => F.bones[n]),
  toe: FIGURE.toe.map(n => F.bones[n]) });

// measure the figure and the capture over one cycle of `motion`, frame by frame, in the same world.
// Returns the figures' own metrics and the capture's, so a caller can compare them or read either alone.
export function measureBoth(c, motion, { steps = 48 } = {}) {
  const W = c.walker, F = W.X.F, ref = c.ref;
  if (!F || !ref) throw new Error('the lab has no figure or no capture yet');
  c.set(motion, 0);                       // the motion first: the lab's cycle length depends on it
  const dur = c.duration, fig = [], cap = [];
  for (let i = 0; i < steps; i++) {
    const t = dur * i / steps;
    c.set(motion, t);
    W.X.scene.updateMatrixWorld(true); ref.group.updateMatrixWorld(true);
    const fb = figureBones(F), cb = captureBones(ref);
    const figFwd = F.fr.f.clone().setY(0).normalize();
    const capFwd = forwardOf(wp(cb.toe[0]), wp(cb.toe[1]), wp(cb.ankle[0]), wp(cb.ankle[1]));
    // the figure stands on y = 0 (the lab solves the contact); the capture stands on its own lowest toe
    fig.push(readings(fb, 0, figFwd));
    cap.push(readings(cb, 0, capFwd));
  }
  // the capture's floor: the lowest toe it touches over the cycle
  const capGround = Math.min(...cap.flatMap(f => f.toeY));
  const capFixed = cap.map(f => ({ ...f, pelvisHeight: +(f.pelvisHeight - capGround).toFixed(4), toeY: f.toeY.map(y => +(y - capGround).toFixed(4)) }));
  return { motion, steps, duration: dur, figure: summarise(fig), capture: summarise(capFixed) };
}

