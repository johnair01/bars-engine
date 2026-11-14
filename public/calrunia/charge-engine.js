/* The shared charge engine (spec: .specify/specs/shared-charge-engine). One plain module holds a charge: what the player
   reads in the body, where they are in the W.A.V.E., which blocks they opened and how the charge moved. It draws nothing,
   reads no clock (time is passed in) and imports nothing, so the hollow, the cave and the first game's build can all load it.
   Every function takes a Charge and returns a new one. */

export const WAVE_STEPS = [
  { id: "welcome", name: "Welcome", button: "I've welcomed it", line: "Let whatever's here be here for a moment, without needing it to be different yet." },
  { id: "acknowledge", name: "Acknowledge", rung: true, button: "I acknowledge it", line: "Admit that it's here. You don't have to like it." },
  { id: "allow", name: "Allow", rung: true, button: "I allow it", line: "Let it take up as much of you as it's taking. You don't have to make it smaller." },
  { id: "accept", name: "Accept", rung: true, button: "I accept it", line: "Let it be here without fighting it." },
  { id: "appreciate", name: "Appreciate", rung: true, button: "I appreciate it", line: "Find what it's been trying to do for you." },
  { id: "validate", name: "Validate", button: "I validate that", line: "Your body has the right to feel this, whatever it is." },
  { id: "exhale", name: "Exhale", line: "Is this feeling in alignment with what you actually want right now?" },
];
export const BREATH = { inMs: 4000, outMs: 6000 };
export const SIZE_WORDS = ["", "a pebble", "a coin", "a stone", "a fist", "a loaf", "a boulder", "a door", "a wall of bricks", "a hillside", "a wall"];
export const ROUTING = {
  sheng: { dissatisfied: "neutral", neutral: "satisfied", satisfied: "satisfied" },
  ke: { dissatisfied: "dissatisfied", neutral: "dissatisfied", satisfied: "satisfied" },
};
/* A copy of move-table.json's cycles; charge-engine.test.ts asserts they are equal. */
export const CYCLES = {
  sheng: { joy: "anger", anger: "neutrality", neutrality: "fear", fear: "sadness", sadness: "joy" },
  ke: { joy: "neutrality", neutrality: "sadness", sadness: "anger", anger: "fear", fear: "joy" },
};
export const ELEMENT_OF = { joy: "wood", anger: "fire", neutral: "earth", fear: "metal", sadness: "water" };
const CHANNELS = Object.keys(ELEMENT_OF);
const STEP_IDS = WAVE_STEPS.map((s) => s.id);
const RUNGS = WAVE_STEPS.filter((s) => s.rung).map((s) => s.id);
const DIRECTIONS = ["toward", "away", "both", "cant_tell"];
const ALIASES = { neutrality: "neutral", wood: "joy", fire: "anger", earth: "neutral", metal: "fear", water: "sadness" };

/** The reading's channel for any spelling: intake, move table, first game or element name. Null when unknown. */
export function channelOf(name) {
  const k = String(name == null ? "" : name).trim().toLowerCase();
  if (CHANNELS.includes(k)) return k;
  return ALIASES[k] || null;
}
/** The move table's spelling of a channel (`neutral` becomes `neutrality`). */
export const tableChannel = (c) => (c === "neutral" ? "neutrality" : c);
const fromTable = (c) => (c === "neutrality" ? "neutral" : c);
const moveId = (from, to) => `${ELEMENT_OF[from]}_${ELEMENT_OF[to]}`;

/** A new Charge at `welcome`, state `dissatisfied`. Throws on an unknown channel or intensity outside 0-10. */
export function startCharge(reading, now) {
  const r = reading || {};
  const channel = channelOf(r.channel);
  if (!channel) throw new Error(`charge-engine: unknown channel "${r.channel}"`);
  const intensity = Number(r.intensity);
  if (!Number.isInteger(intensity) || intensity < 0 || intensity > 10) throw new Error("charge-engine: intensity must be an integer 0-10");
  return {
    v: 1, id: `ch-${now}`, startedAt: now,
    reading: {
      channel, intensity,
      direction: DIRECTIONS.includes(r.direction) ? r.direction : "cant_tell",
      body: typeof r.body === "string" ? r.body : "",
      goal: r.goal == null ? null : String(r.goal),
    },
    element: ELEMENT_OF[channel],
    state: "dissatisfied",
    location: null, texture: null, face: null, belief: null,
    wave: { step: "welcome", stepAt: now, rungReached: null, stoppedAtRung: false, alignment: null },
    steps: [{ id: "welcome", at: now }],
    blockStack: [],
    route: [],
  };
}

/** The ring on the card: `in` for inMs, `out` for outMs, then `done`. `t` is 0..1 within the phase. */
export function breathOf(charge, now) {
  const e = Math.max(0, now - charge.wave.stepAt);
  if (e < BREATH.inMs) return { phase: "in", t: e / BREATH.inMs };
  if (e < BREATH.inMs + BREATH.outMs) return { phase: "out", t: (e - BREATH.inMs) / BREATH.outMs };
  return { phase: "done", t: 1 };
}

const enter = (charge, step, now, extra = {}) => ({ ...charge, ...extra, wave: { ...charge.wave, ...(extra.wave || {}), step, stepAt: now } });
const fail = (m) => { throw new Error(`charge-engine: ${m}`); };

/** Moves to the next WAVE step. Refuses before the out-breath ends unless `skipBreath`. */
export function nextStep(charge, now, { skipBreath = false } = {}) {
  const i = STEP_IDS.indexOf(charge.wave.step);
  if (i < 0 || i >= STEP_IDS.length - 1) fail(`no step after ${charge.wave.step}`);
  if (!skipBreath && breathOf(charge, now).phase !== "done") fail("the breath is not finished");
  const cur = WAVE_STEPS[i], next = STEP_IDS[i + 1];
  const wave = { rungReached: cur.rung ? cur.id : charge.wave.rungReached };
  const steps = [...charge.steps, { id: next, at: now, ...(WAVE_STEPS[i + 1].rung ? { rung: true } : {}) }];
  const route = next === "appreciate" ? [...charge.route, { kind: "appreciate", at: now }] : charge.route;
  return enter({ ...charge, steps, route }, next, now, { wave });
}

/** Ends the WAVE at the rung reached (from Allow on) and goes to the exhale. */
export function stopAtRung(charge, now) {
  const i = STEP_IDS.indexOf(charge.wave.step);
  if (i < STEP_IDS.indexOf("allow") || i >= STEP_IDS.indexOf("exhale")) fail("a rung can be stopped at only from Allow to Validate");
  const rung = WAVE_STEPS[i].rung ? WAVE_STEPS[i].id : charge.wave.rungReached;
  return enter({ ...charge, steps: [...charge.steps, { id: "exhale", at: now }] }, "exhale", now, { wave: { rungReached: rung, stoppedAtRung: true } });
}

/** Pushes a block frame for the current step. Blocks nest. */
export function openBlock(charge, { size, words } = {}, now) {
  const s = Math.max(1, Math.min(10, Math.round(Number(size) || 1)));
  const frame = { step: charge.wave.step, size: s, words: typeof words === "string" ? words : "", at: now };
  const steps = charge.steps.map((x, i) => (i === charge.steps.length - 1 ? { ...x, blocked: true } : x));
  return { ...charge, steps, blockStack: [...charge.blockStack, frame], route: [...charge.route, { kind: "block-open", at: now, step: frame.step, size: s, words: frame.words }] };
}

/** Pops the top frame and puts the player back on that exact step with a fresh breath. */
export function returnFromBlock(charge, outcome, now) {
  if (!charge.blockStack.length) fail("no block to return from");
  const frame = charge.blockStack[charge.blockStack.length - 1];
  return enter({
    ...charge, blockStack: charge.blockStack.slice(0, -1),
    route: [...charge.route, { kind: "block-return", at: now, step: frame.step, outcome: outcome || "left" }],
  }, frame.step, now);
}

/** The exhale fork: `stay` or `release`, both lead to the body scan. */
export function exhale(charge, alignment, now) {
  if (charge.wave.step !== "exhale") fail("not at the exhale");
  if (alignment !== "stay" && alignment !== "release") fail("alignment is stay or release");
  return enter({ ...charge, route: [...charge.route, { kind: "exhale", at: now, alignment }] }, "scan", now, { wave: { alignment } });
}

/** Records the body scan (the player's words, as typed) and completes the WAVE. */
export function scan(charge, { location, texture } = {}, now) {
  if (charge.wave.step !== "scan") fail("not at the body scan");
  return enter({ ...charge, location: location == null ? "" : String(location), texture: texture == null ? "" : String(texture) }, "done", now);
}

/** Moves the channel by the cycle and the state by the routing table. */
export function move(charge, family, now) {
  if (charge.wave.step !== "done") fail("a move needs a finished WAVE");
  if (!CYCLES[family]) fail("move is sheng or ke");
  const cur = charge.moveChannel || charge.reading.channel;
  const dest = fromTable(CYCLES[family][tableChannel(cur)]);
  const state = ROUTING[family][charge.state];
  return { ...charge, moveChannel: dest, state, route: [...charge.route, { kind: "move", at: now, family, from: cur, to: dest, by: moveId(cur, dest), state }] };
}

/** `{feel, from, to, by}` for the hollow's ember. `feel` equals `to`. */
export function emberOf(charge) {
  const from = ELEMENT_OF[charge.reading.channel];
  const moves = charge.route.filter((r) => r.kind === "move");
  const last = moves[moves.length - 1];
  const to = ELEMENT_OF[charge.moveChannel || charge.reading.channel];
  return { feel: to, from, to, by: last ? last.by : "wave" };
}

/** The plain object a place saves. Words are kept exactly as typed. */
export function toRecord(charge) {
  return JSON.parse(JSON.stringify({ ...charge, channelNow: charge.moveChannel || charge.reading.channel }));
}
