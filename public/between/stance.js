/* Which clip a figure plays (Wendell's rule lt-idle-default: any figure not moving or sitting plays a real standing idle,
   never a held frame of the walk). Plain module, no three.js, so the rule has a test (src/lib/between/__tests__/stance.test.ts).
   garden.js makeBody asks it each frame; the mirror is no exception (you stand at the glass in the idle). */
export const STANCES = ["walk", "idle", "sit"];
export function stance({ moving = false, sitting = false } = {}) { return sitting ? "sit" : moving ? "walk" : "idle"; }
/* The clip weights a stance fades to: sitting is the code-made pose over the bind pose, so neither clip holds it. */
export function clipWeights(s) { return s === "walk" ? { Walk: 1, Idle: 0 } : s === "idle" ? { Walk: 0, Idle: 1 } : { Walk: 0, Idle: 0 }; }
/* Fade times (s): into the walk quickly, into the idle a little slower, so a stop settles. */
export const FADE = { walk: 0.25, idle: 0.4, sit: 0.3 };
