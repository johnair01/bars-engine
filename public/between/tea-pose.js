/* The cup by the fire (pass between-tea-1, bt-tea-verb-r3 and bt-cup-is-the-figure): the kettle's place, the cup's size and
   the drink's length, as plain numbers. No three.js, so the build (art/between/tea-drink/build.py, through
   tools/tea-cult/inputs.mjs) reads the same numbers the page does.
   The figure is the cultivation figure kneeling on the cushion (cult/kneel.js); the drink itself is baked clips
   (m/cult/tea-drink-<f|m>.glb, played by tea-drink.js), so no arm angles live here.
   Frame: the seat's. The origin is the seat's top, +y up, +z the way the figure faces, +x its left (so the right arm is -x). */

export const NEAR = 0.95;                                  // "Pour a cup" is offered only to someone sat this close to the kettle (m)

export const KETTLE = {
  /* On a low table stone beside the seat, to the right and a little ahead, clear of the crossed knees, the robe and the arms
     (tea-cup-look-3: the table at 47 cm, straight over the right knee, cut through the robe and the arms). bt-tea-needs-a-spot:
     both shells' placements are full, so the kettle is drawn by the scene at the fire and never goes through roomWrite. */
  turn: 0.80,        // its middle, this far round from straight ahead toward the right hand (rad)  [kneeling figure: WIP, Dusk's was 1.25]
  out: 0.48,         // and this far from the seat's middle (m)  [WIP, Dusk's was 0.80]
  top: 0.12,         // the table stone's top over the seat's top  [WIP, Dusk's was 0.08]
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
