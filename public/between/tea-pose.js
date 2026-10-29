/* The cup by the fire (pass between-tea-1, bt-tea-verb-r3 and bt-cup-is-the-figure): the kettle's place, the pour's beats and
   the cup's tilt, as plain numbers. No three.js, so the reach and the tilt have a probe that runs without a browser
   (tools/tea-cup-probe.mjs), the way stance.js is plain so the sit has a test.
   The figure is Average Dusk (wardrobe.js), which has wrists: the cup sits in the right hand, HAND past the wrist joint, and
   stays upright in the figure's frame whatever the forearm does (tea-look-2: slice 1 hung it on the elbow, 21 cm back up the
   forearm, where the sleeve hid it, and posed the arm on player.glb's axes, which lifted it over the head).
   Frame: the seat's. The origin is the seat's top, +y up, +z the way the figure faces, +x its left (so the right arm is -x). */

export const ARM = { upper: 0.267, fore: 0.341 };          // shoulder to elbow, elbow to the hand's middle (average-dusk.glb)
export const SHOULDER = { x: -0.19, y: 0.52, z: 0.04 };    // the right shoulder over the seat top when sat (tools/tea-hand-probe.mjs)
/* The hand holds the cup by its side (tea-cup-look-3, his note 2026-10-29: the cup passed through the hands): the hand's middle
   is HAND past the wrist joint, along the hand, and the cup's middle stands GRIP out from it, through the palm, so the cup's wall
   meets the palm instead of the cup filling the hand (the hand is about 8 cm across, the cup 8.4; tools/tea-hand-probe.mjs). */
export const HAND = 0.088;
export const GRIP = 0.083;
export const NEAR = 0.95;                                  // "Pour a cup" is offered only to someone sat this close to the kettle (m)

export const KETTLE = {
  /* On a low table stone beside the seat, to the right and a little ahead, clear of the crossed knees, the robe and the arms
     (tea-cup-look-3: the table at 47 cm, straight over the right knee, cut through the robe and the arms). bt-tea-needs-a-spot:
     both shells' placements are full, so the kettle is drawn by the scene at the fire and never goes through roomWrite. */
  turn: 1.25,        // its middle, this far round from straight ahead toward the right hand (rad)
  out: 0.80,         // and this far from the seat's middle (m)
  top: 0.08,         // the table stone's top over the seat's top
  stone: [0.22, 0.25],   // the stone's radius at its top and at its foot
  body: 0.11, height: 0.16,
  spout: 0.165, lipH: 0.19,   // the spout's tip, out from the pot's middle toward the seat and up from the stone's top
  spot: 0.175,       // the cup stands on the stone this far from the pot's middle, toward the seat, under the spout
};
/* The kettle's middle and the cup's place on the stone, in the seat's frame. */
export function kettleAt(K = KETTLE) { return { x: -Math.sin(K.turn) * K.out, z: Math.cos(K.turn) * K.out }; }
export const CUP = { r: 0.042, h: 0.07, spill: 0.22 };     // a cup tips this far before the tea runs over its lip
export function cupSpot(K = KETTLE) {
  const k = kettleAt(K), d = Math.hypot(k.x, k.z);
  return { x: k.x * (1 - K.spot / d), y: K.top + CUP.h / 2, z: k.z * (1 - K.spot / d) };
}

/* Slow, as someone enjoying their tea moves (his look on tea-cup-look-2, 2026-10-29: "The arm should move slowly as if someone
   is enjoying the tea"): the hand goes out to the cup on the stone, holds it while the tea runs, brings it to the lap, the cup
   rises, rests at the lips, comes down, and then the figure savours it before the next sip. */
export const TEA = {
  reach: 2.2,        // the hand goes out to the cup on the stone, the body leaning a little toward it
  pour: 2.6,         // the stream runs into the cup, held on the stone
  back: 2.6,         // the cup comes up off the stone, over the knee, and back over the lap
  sip: 5.4,          // one sip: up (SIP.up), at the lips (SIP.hold), down (SIP.down), then the savour
  sips: 2,
  set: 1.2,          // the cup settles in the lap, and stays in the hand until you stand (tea-look-2)
  streamFrom: 0.2,   // of the pour beat: the tea starts once the hand is on the cup
  streamTo: 0.85,
};

/* The sip beat's parts, as shares of TEA.sip; what is left after the cup comes down is the savour, when the head lifts and
   the warmth shows (`savor` 0..1, peaking once the cup is back in the lap). */
export const SIP = { up: 0.28, hold: 0.14, down: 0.26 };

/* The cup stands level on the stone while it is poured into, so it only tips at the lips. */
export const CUP_TILT = { pour: 0.0, sip: 0.7, rest: 0.0 };

export const TOTAL = TEA.reach + TEA.pour + TEA.back + TEA.sip * TEA.sips + TEA.set;

/* The right arm through the sequence, as turns added on top of the sit (Euler XYZ on shoulderR and an X turn on elbowR, and
   `lean`, an X turn on the spine, the body bending toward the stone), fitted on the sat Average Dusk by tools/tea-fit.mjs so
   the hand lands where each beat needs it: on the cup on the stone, in front of the belly, at the mouth. tools/tea-hand-probe.mjs
   fails when a pose misses its mark by more than 3 cm, when the cup goes into the hand, or when anything of the figure stands
   in the cup, the stone or the kettle. */
export const ARM_ANGLES = {
  rest: { sx: 0, sy: 0, sz: 0, ex: 0, lean: 0 },             // the sit's own arm, hand on the knee
  lap: { sx: 1.165, sy: -0.063, sz: -0.493, ex: -0.927, lean: 0 },     // the cup held in front of the belly
  reach: { sx: 1.03, sy: 0.607, sz: -0.099, ex: -0.097, lean: 0.14 },   // the hand on the cup on the stone
  pour: { sx: 1.03, sy: 0.607, sz: -0.099, ex: -0.097, lean: 0.14 },
  lift: { sx: 1.64, sy: 0.414, sz: -0.131, ex: -0.988, lean: 0.07 },      // the cup up off the stone, over the knee, on its way to the lap
  sip: { sx: -0.09, sy: 0.202, sz: -0.368, ex: -1.263, lean: 0 },   // the cup at the mouth
};
/* Where each pose puts the cup's middle, in the seat's frame: what the probe checks the angles against. */
export const HAND_AT = {
  lap: { x: -0.10, y: 0.24, z: 0.26 },
  reach: cupSpot(),
  pour: cupSpot(),
  lift: (s => ({ x: s.x * 0.8, y: s.y + 0.16, z: s.z * 0.8 }))(cupSpot()),
  sip: { x: -0.02, y: 0.645, z: 0.26 },   // the rim at the lips, clear of the nose and chin
};
/* Which way the palm faces the cup in each pose, in the seat's frame (x left, z ahead; made unit where used): the cup stands
   that way of the hand. In the lap and at the mouth the right hand holds the cup from its right; at the stone, from the seat's
   side, so the hand never comes between the cup and the kettle. */
export const GRIP_DIR = (() => {
  const s = cupSpot(), d = Math.hypot(s.x, s.z);
  const out = { x: s.x / d, z: s.z / d };
  return { rest: out, reach: out, pour: out, lift: out, lap: { x: 0.94, z: 0.34 }, sip: { x: 0.99, z: 0.15 } };
})();

const LIFT = 0.4;   // of the back beat: the cup is up off the stone by then
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const ease = k => k * k * (3 - 2 * k);
const mix = (a, b, k) => a + (b - a) * k;
const blend = (a, b, k) => ({ sx: mix(a.sx, b.sx, k), sy: mix(a.sy, b.sy, k), sz: mix(a.sz, b.sz, k), ex: mix(a.ex, b.ex, k), lean: mix(a.lean || 0, b.lean || 0, k) });
const gripMix = (a, b, k) => { const x = mix(a.x, b.x, k), z = mix(a.z, b.z, k), l = Math.hypot(x, z) || 1; return { x: x / l, z: z / l }; };

/* What the pour is doing at t seconds after the cup is taken up. `done` once it is held in the lap. */
export function teaAt(t) {
  const out = { phase: "done", tilt: CUP_TILT.rest, stream: 0, pour: 0, sip: 0, savor: 0, done: true, arm: ARM_ANGLES.lap, grip: GRIP_DIR.lap };
  let at = Math.max(0, t || 0);
  if (at < TEA.reach) {
    const k = ease(clamp(at / TEA.reach));
    return { ...out, phase: "reach", done: false, tilt: CUP_TILT.rest,   // level until it is over the spout
      arm: blend(ARM_ANGLES.rest, ARM_ANGLES.reach, k), grip: GRIP_DIR.reach };
  }
  at -= TEA.reach;
  if (at < TEA.pour) {
    const k = clamp(at / TEA.pour), stream = k > TEA.streamFrom && k < TEA.streamTo ? 1 : 0;
    const tip = ease(clamp((k - TEA.streamFrom) / 0.15)) * (1 - ease(clamp((k - 0.8) / 0.2)));   // level by the end of the beat
    return { ...out, phase: "pour", done: false, tilt: mix(CUP_TILT.rest, CUP_TILT.pour, tip),
      stream, pour: k, arm: ARM_ANGLES.pour, grip: GRIP_DIR.pour };
  }
  at -= TEA.pour;
  if (at < TEA.back) {   // up off the stone first, clear of the knee, then in to the lap
    const k = clamp(at / TEA.back), u = ease(clamp(k / LIFT)), w = ease(clamp((k - LIFT) / (1 - LIFT)));
    return { ...out, phase: "back", done: false, tilt: CUP_TILT.rest,
      arm: k < LIFT ? blend(ARM_ANGLES.pour, ARM_ANGLES.lift, u) : blend(ARM_ANGLES.lift, ARM_ANGLES.lap, w),
      grip: k < LIFT ? GRIP_DIR.pour : gripMix(GRIP_DIR.lift, GRIP_DIR.lap, w) };
  }
  at -= TEA.back;
  if (at < TEA.sip * TEA.sips) return { ...out, ...sipBeat((at % TEA.sip) / TEA.sip), sip: Math.floor(at / TEA.sip) + 1 };
  at -= TEA.sip * TEA.sips;
  if (at < TEA.set) {
    const k = ease(clamp(at / TEA.set));
    return { ...out, phase: "set", done: false, tilt: mix(CUP_TILT.rest, 0, k), arm: ARM_ANGLES.lap, grip: GRIP_DIR.lap };
  }
  return out;
}

/* One sip at share k of its beat: the cup's lift to the mouth (`up` 0..1, held at the lips) and the savour after it. */
function sipBeat(k) {
  const a = SIP.up, b = a + SIP.hold, c = b + SIP.down;
  const up = k < a ? ease(k / a) : k < b ? 1 : k < c ? 1 - ease((k - b) / SIP.down) : 0;
  const s0 = b + SIP.down * 0.5, sv = clamp((k - s0) / (1 - s0)), savor = Math.sin(sv * Math.PI) ** 2;   // swells as the cup comes down, gone by the next
  return { phase: "sip", done: false, tilt: mix(CUP_TILT.rest, CUP_TILT.sip, up), up, savor, arm: blend(ARM_ANGLES.lap, ARM_ANGLES.sip, up), grip: gripMix(GRIP_DIR.lap, GRIP_DIR.sip, up) };
}

/* One more sip from the cup held in the lap ("Take a sip"): the sip beat once, then held again. */
export function sipAt(t) {
  const at = Math.max(0, t || 0), out = { phase: "done", tilt: CUP_TILT.rest, stream: 0, pour: 0, sip: 0, savor: 0, done: true, arm: ARM_ANGLES.lap, grip: GRIP_DIR.lap };
  if (at >= TEA.sip) return out;
  return { ...out, ...sipBeat(at / TEA.sip), sip: 1 };
}

/* The hand's middle holding a cup at `c` by its side (`dir` the way the palm faces). */
export function handOn(c, dir) { const l = Math.hypot(dir.x, dir.z) || 1; return { x: c.x - dir.x / l * GRIP, y: c.y, z: c.z - dir.z / l * GRIP }; }

/* How far the right shoulder is from the hand on the cup on the stone against what the arm spans: the number the kettle's place is chosen by, and the
   one the probe prints. An `over` above zero means a seated person cannot reach it. */
export function spoutReach(shoulder = SHOULDER, lip = handOn(cupSpot(), GRIP_DIR.pour), arm = ARM) {
  const d = Math.hypot(lip.x - shoulder.x, lip.y - shoulder.y, lip.z - shoulder.z);
  const span = arm.upper + arm.fore;
  return { d, span, over: Math.max(0, d - span), margin: span - d };
}
