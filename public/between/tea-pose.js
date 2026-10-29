/* The cup by the fire (pass between-tea-1, bt-tea-verb-r3 and bt-cup-is-the-figure): the kettle's place, the pour's beats and
   the cup's tilt, as plain numbers. No three.js, so the reach and the tilt have a probe that runs without a browser
   (tools/tea-cup-probe.mjs), the way stance.js is plain so the sit has a test.
   The figure is Average Dusk (wardrobe.js), which has wrists: the cup sits in the right hand, HAND past the wrist joint, and
   stays upright in the figure's frame whatever the forearm does (tea-look-2: slice 1 hung it on the elbow, 21 cm back up the
   forearm, where the sleeve hid it, and posed the arm on player.glb's axes, which lifted it over the head).
   Frame: the seat's. The origin is the seat's top, +y up, +z the way the figure faces, +x its left (so the right arm is -x). */

export const ARM = { upper: 0.267, fore: 0.323 };          // shoulder to elbow, elbow to the cup in the hand (average-dusk.glb)
export const SHOULDER = { x: -0.19, y: 0.52, z: 0.04 };    // the right shoulder over the seat top when sat (tools/tea-hand-probe.mjs)
export const HAND = 0.07;                                  // the cup's middle past the wrist joint, along the hand (rig metres)
export const NEAR = 0.8;                                   // "Pour a cup" is offered only to someone sat this close to the kettle (m)

export const KETTLE = {
  /* By the fire, on a flat stone, low enough that a seated arm reaches its spout. bt-tea-needs-a-spot: both shells' placements
     are full, so the kettle is drawn by the scene at the fire and never goes through roomWrite. */
  lip: { x: -0.30, y: 0.30, z: 0.36 },                     // 36 cm in front, 30 cm to the right, 30 cm below the shoulder
  body: 0.11, height: 0.16,
};

export const CUP = { r: 0.042, h: 0.07, spill: 0.22 };     // a cup tips this far before the tea runs over its lip

export const TEA = {
  reach: 1.2,        // the cup goes out to the spout
  pour: 1.6,         // the stream runs
  back: 0.7,         // the cup comes back over the lap
  sip: 1.0,          // one sip, and the mouth closed after it
  sips: 2,
  set: 0.8,          // the cup settles in the lap, and stays in the hand until you stand (tea-look-2)
  streamFrom: 0.2,   // of the pour beat: the tea starts once the cup is under the spout
  streamTo: 0.85,
};

export const CUP_TILT = { pour: 0.3, sip: 0.7, rest: 0.0 };

export const TOTAL = TEA.reach + TEA.pour + TEA.back + TEA.sip * TEA.sips + TEA.set;

/* The right arm through the sequence, as turns added on top of the sit (Euler XYZ on shoulderR and an X turn on elbowR),
   fitted on the sat Average Dusk by tools/tea-hand-probe.mjs so the hand lands where each beat needs it: in the lap, under
   the spout, at the mouth. The probe fails when a pose misses its mark by more than 3 cm. */
export const ARM_ANGLES = {
  rest: { sx: 0, sy: 0, sz: 0, ex: 0 },                       // the sit's own arm, hand on the knee
  lap: { sx: 0.863, sy: -0.15, sz: -0.588, ex: -0.763 },     // the cup held in front of the belly
  reach: { sx: 0.706, sy: 0.137, sz: -0.094, ex: -0.412 },   // the cup under the spout
  pour: { sx: 0.706, sy: 0.137, sz: -0.094, ex: -0.412 },
  sip: { sx: -0.431, sy: -0.006, sz: -0.556, ex: -1.156 },   // the cup at the mouth
};
/* Where each pose puts the cup, in the seat's frame: what the probe checks the angles against. */
export const HAND_AT = {
  lap: { x: -0.10, y: 0.24, z: 0.26 },
  reach: { x: KETTLE.lip.x + 0.01, y: KETTLE.lip.y - 0.085, z: KETTLE.lip.z - 0.02 },
  pour: { x: KETTLE.lip.x + 0.01, y: KETTLE.lip.y - 0.085, z: KETTLE.lip.z - 0.02 },
  sip: { x: -0.02, y: 0.662, z: 0.20 },
};

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const ease = k => k * k * (3 - 2 * k);
const mix = (a, b, k) => a + (b - a) * k;
const blend = (a, b, k) => ({ sx: mix(a.sx, b.sx, k), sy: mix(a.sy, b.sy, k), sz: mix(a.sz, b.sz, k), ex: mix(a.ex, b.ex, k) });

/* What the pour is doing at t seconds after the cup is taken up. `done` once it is held in the lap. */
export function teaAt(t) {
  const out = { phase: "done", tilt: CUP_TILT.rest, stream: 0, pour: 0, sip: 0, done: true, arm: ARM_ANGLES.lap };
  let at = Math.max(0, t || 0);
  if (at < TEA.reach) {
    const k = ease(clamp(at / TEA.reach));
    return { ...out, phase: "reach", done: false, tilt: CUP_TILT.rest,   // level until it is over the spout
      arm: blend(ARM_ANGLES.rest, ARM_ANGLES.reach, k) };
  }
  at -= TEA.reach;
  if (at < TEA.pour) {
    const k = clamp(at / TEA.pour), stream = k > TEA.streamFrom && k < TEA.streamTo ? 1 : 0;
    const tip = ease(clamp((k - TEA.streamFrom) / 0.15)) * (1 - ease(clamp((k - 0.8) / 0.2)));   // level by the end of the beat
    return { ...out, phase: "pour", done: false, tilt: mix(CUP_TILT.rest, CUP_TILT.pour, tip),
      stream, pour: k, arm: ARM_ANGLES.pour };
  }
  at -= TEA.pour;
  if (at < TEA.back) {
    const k = ease(clamp(at / TEA.back));
    return { ...out, phase: "back", done: false, tilt: CUP_TILT.rest,
      arm: blend(ARM_ANGLES.pour, ARM_ANGLES.lap, k) };
  }
  at -= TEA.back;
  if (at < TEA.sip * TEA.sips) {
    const k = (at % TEA.sip) / TEA.sip, up = ease(clamp(k * 2)) * (1 - ease(clamp((k - 0.5) * 2)));
    return { ...out, phase: "sip", done: false, tilt: mix(CUP_TILT.rest, CUP_TILT.sip, up), sip: Math.floor(at / TEA.sip) + 1,
      arm: blend(ARM_ANGLES.lap, ARM_ANGLES.sip, up) };
  }
  at -= TEA.sip * TEA.sips;
  if (at < TEA.set) {
    const k = ease(clamp(at / TEA.set));
    return { ...out, phase: "set", done: false, tilt: mix(CUP_TILT.rest, 0, k), arm: ARM_ANGLES.lap };
  }
  return out;
}

/* One more sip from the cup held in the lap ("Take a sip"): the sip beat once, then held again. */
export function sipAt(t) {
  const at = Math.max(0, t || 0), out = { phase: "done", tilt: CUP_TILT.rest, stream: 0, pour: 0, sip: 0, done: true, arm: ARM_ANGLES.lap };
  if (at >= TEA.sip) return out;
  const k = at / TEA.sip, up = ease(clamp(k * 2)) * (1 - ease(clamp((k - 0.5) * 2)));
  return { ...out, phase: "sip", done: false, sip: 1, tilt: mix(CUP_TILT.rest, CUP_TILT.sip, up), arm: blend(ARM_ANGLES.lap, ARM_ANGLES.sip, up) };
}

/* How far the right shoulder is from the spout against what the arm spans: the number the kettle's place is chosen by, and the
   one the probe prints. An `over` above zero means a seated person cannot reach it. */
export function spoutReach(shoulder = SHOULDER, lip = KETTLE.lip, arm = ARM) {
  const d = Math.hypot(lip.x - shoulder.x, lip.y - shoulder.y, lip.z - shoulder.z);
  const span = arm.upper + arm.fore;
  return { d, span, over: Math.max(0, d - span), margin: span - d };
}
