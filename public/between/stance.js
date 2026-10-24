/* Which clip a figure plays (Wendell's rule lt-idle-default: any figure not moving or sitting plays a real standing idle,
   never a held frame of the walk). Plain module, no three.js, so the rule has a test (src/lib/between/__tests__/stance.test.ts).
   garden.js makeBody asks it each frame; the mirror is no exception (you stand at the glass in the idle). */
export const STANCES = ["walk", "idle", "sit"];
export function stance({ moving = false, sitting = false } = {}) { return sitting ? "sit" : moving ? "walk" : "idle"; }
/* The clip weights a stance fades to: sitting is the code-made pose over the bind pose, so neither clip holds it. */
export function clipWeights(s) { return s === "walk" ? { Walk: 1, Idle: 0 } : s === "idle" ? { Walk: 0, Idle: 1 } : { Walk: 0, Idle: 0 }; }
/* Fade times (s): into the walk quickly, into the idle a little slower, so a stop settles. */
export const FADE = { walk: 0.25, idle: 0.4, sit: 0.3 };
/* The sit, made in code over the bind pose: cross-legged on a cushion, as Euler XYZ turns (radians at full sit) on each bone's
   rest turn, and the hips lowered by SIT_DROP (rig metres). garden.js makeBody eases it in; the robe tools pose the same sit. */
export const SIT = [["hipL", -1.5, -0.35, -0.65], ["hipR", -1.5, 0.35, 0.65], ["kneeL", 2.45, 0, 0], ["kneeR", 2.45, 0, 0], ["spine", 0.12, 0, 0], ["neck", 0.18, 0, 0],
  ["shoulderL", -0.75, 0, -0.25], ["shoulderR", -0.75, 0, 0.25], ["elbowL", -0.9, 0, 0], ["elbowR", -0.9, 0, 0]];
export const SIT_DROP = 0.84;
/* On a seat (a cushion, the hearth's cushion): the hip joints rest this far over its top (metres), as the caves' seatAvatar
   rests them (#434), so the figure sits on the cushion rather than sinking into it. SIT_DROP stays for a caller with no seat. */
export const SEAT_PAD = 0.1;
