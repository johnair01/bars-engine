/* The cup by the fire (pass between-tea-1, bt-tea-verb-r3 and bt-cup-is-the-figure): the kettle's place, the pour's beats and
   the cup's tilt, as plain numbers. No three.js, so the reach and the tilt have a probe that runs without a browser
   (tools/tea-cup-probe.mjs), the way stance.js is plain so the sit has a test.
   The model has shoulders and elbows and no hands (player.glb, garden.js makeBody), so the cup rides the right forearm; what
   this module fixes is what the pose has to work with: where the kettle stands so a seated person reaches its spout, how long
   each beat takes, and how far the cup tips before the tea would run out of it.
   Frame: the seat's. The origin is the seat's top, +y up, +z the way the figure faces, +x its left (so the right arm is -x). */

export const ARM = { upper: 0.30, fore: 0.26 };            // shoulder to elbow, elbow to the cup, metres at the model's scale 1
export const SHOULDER = { x: -0.17, y: 0.60, z: 0 };       // the right shoulder over the seat top, in the seat's frame

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
  set: 0.8,          // the cup goes down on the stone
  streamFrom: 0.2,   // of the pour beat: the tea starts once the cup is under the spout
  streamTo: 0.85,
};

export const CUP_TILT = { pour: 0.95, sip: 0.7, rest: 0.08 };

export const TOTAL = TEA.reach + TEA.pour + TEA.back + TEA.sip * TEA.sips + TEA.set;

/* The right arm through the sequence, as turns added on top of the sit: shoulder X swings the arm forward, shoulder Z raises
   it to the side, elbow X folds it (the axes garden.js read off player.glb for the sit and the wave). */
export const ARM_ANGLES = {
  lap: { sx: -0.30, sz: 0.10, ex: -0.95 },
  reach: { sx: -1.05, sz: 0.55, ex: -0.45 },
  pour: { sx: -1.10, sz: 0.62, ex: -0.60 },
  sip: { sx: -0.55, sz: 0.95, ex: -1.95 },
};

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const ease = k => k * k * (3 - 2 * k);
const mix = (a, b, k) => a + (b - a) * k;
const blend = (a, b, k) => ({ sx: mix(a.sx, b.sx, k), sz: mix(a.sz, b.sz, k), ex: mix(a.ex, b.ex, k) });

/* What the pour is doing at t seconds after the cup is taken up. `done` once it is back on the stone. */
export function teaAt(t) {
  const out = { phase: "done", tilt: CUP_TILT.rest, stream: 0, pour: 0, sip: 0, done: true, arm: ARM_ANGLES.lap };
  let at = Math.max(0, t || 0);
  if (at < TEA.reach) {
    const k = ease(clamp(at / TEA.reach));
    return { ...out, phase: "reach", done: false, tilt: CUP_TILT.rest,   // level until it is over the spout
      arm: blend(ARM_ANGLES.lap, ARM_ANGLES.reach, k) };
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

/* How far the right shoulder is from the spout against what the arm spans: the number the kettle's place is chosen by, and the
   one the probe prints. An `over` above zero means a seated person cannot reach it. */
export function spoutReach(shoulder = SHOULDER, lip = KETTLE.lip, arm = ARM) {
  const d = Math.hypot(lip.x - shoulder.x, lip.y - shoulder.y, lip.z - shoulder.z);
  const span = arm.upper + arm.fore;
  return { d, span, over: Math.max(0, d - span), margin: span - d };
}
