/* The first minute (six-faces-council homeroom kit, Still C, approved 2026-10-24 with no notes). It replaces the orientation
   sheet: you wake on a cushion in your nook, the hearth out and the doorway grown over with three vines, and each rule is
   learned by doing it once. Each one done pulls a vine away; the last vine is the yes rule itself, touched by hand.

     0:00 wake    "This is yours. Nobody comes in here."
     0:10 ember   one ember glows in the hearth; tap it and the fire catches. "Things here grow when you tend them." Vine one.
     0:22 mirror  the mirror glows in the satchel; set it on a spot. "Your room is yours to arrange." Vine two.
     0:35 hope    look into the mirror: what do you hope for in your friendships? Write it or skip it. "Only you will ever see this."
     0:48 vine    touch the last vine. "Nobody comes through without a yes, from both of you." It falls; a blank scroll is on the shelf.
     1:00 open    the doorway shimmers open.

   A step you skip stays as a small glow in the room to come back to (the ember in the hearth, the mirror in the satchel, the
   mirror's glass). The last vine cannot be skipped: it is the rule the doorway keeps.

   Wendell's ruling on br-orient-each-invite (2026-10-24): "If they've already done the introduction they don't need this. This
   is for people who are being invited to rooms who already have their own." So the first minute is the only orientation: once
   done, an invitation's doorway opens at once (inviteDoorway below).

   Plain module, no DOM and no three.js: garden.js runs the minute, src/lib/between/__tests__/first-minute.test.ts checks it.
   What is kept: the homeroom's private doc (rules.ts homeWrite) holds `minute` = { ember, mirror, hope, vine: time done,
   skip: { ember, mirror, hope: time skipped } }, and `oriented`, the time the last vine fell. */

/** The beats in order, and the second each one may start at, as the still's storyboard times them. */
export const STEPS = ["wake", "ember", "mirror", "hope", "vine", "open"];
export const BEATS = { wake: 0, ember: 10, mirror: 22, hope: 35, vine: 48, open: 60 };
/** The steps that ask something of you, and the ones of those you may leave for later. */
export const ACTS = ["ember", "mirror", "hope", "vine"];
export const SKIPPABLE = ["ember", "mirror", "hope"];
/** Which acts pull a vine away. The hope pulls none: the third vine is the yes rule, touched by hand. */
export const VINE_OF = { ember: 0, mirror: 1, vine: 2 };

/** The captions, his still's own words, shown at reading pace when a step is done (wake's on waking). */
export const CAPTIONS = {
  wake: "This is yours. Nobody comes in here.",
  ember: "Things here grow when you tend them.",
  mirror: "Your room is yours to arrange.",
  hope: "Only you will ever see this.",
  vine: "Nobody comes through without a yes, from both of you.",
};
/** What each beat asks, plainly, while it waits for you (the HUD's hint line, not a caption). */
export const PROMPTS = {
  ember: "One ember glows in the hearth. Tap it.",
  mirror: "A mirror glows in your satchel. Set it on a spot.",
  hope: "Look into the mirror.",
  vine: "The last vine waits on the doorway. Touch it.",
  open: "The doorway is open. A blank scroll waits on your shelf: write your first invitation now or later.",
};
/** The one line the mirror asks. */
export const HOPE_ASK = "What do you hope for in your friendships?";

const isNum = v => typeof v === "number" && Number.isFinite(v);

/**
 * Where the first minute stands, from the homeroom's private doc. Pure: the same doc always gives the same answer.
 * A homeroom oriented before the minute existed (part 1's stand-in wrote `oriented` on arrival) counts as done, hearth lit.
 * @param {any} home the homeroom's private doc: { minute, oriented, ... }
 */
export function minuteState(home) {
  const h = home || {}, m = h.minute && typeof h.minute === "object" ? h.minute : {};
  const skip = m.skip && typeof m.skip === "object" ? m.skip : {};
  const oriented = isNum(h.oriented);
  const legacy = oriented && !h.minute; // oriented by arriving, before the minute: nothing to come back to
  const done = {}, skipped = {};
  for (const s of ACTS) { done[s] = legacy || isNum(m[s]); skipped[s] = !done[s] && SKIPPABLE.includes(s) && isNum(skip[s]); }
  if (oriented) done.vine = true;
  const resolved = s => s === "wake" || s === "open" ? true : done[s] || skipped[s];
  const step = oriented ? "open" : ACTS.find(s => !resolved(s)) || "open";
  const fallen = [0, 1, 2].map(i => Object.entries(VINE_OF).some(([s, v]) => v === i && resolved(s)));
  return {
    step, oriented, done, skipped, fallen,
    vinesLeft: fallen.filter(f => !f).length,
    /** the hearth burns once its ember is tended */
    hearthLit: done.ember,
    /** the ember glows in a cold hearth while its beat is on, or after it was skipped */
    emberGlows: !done.ember && (step === "ember" || skipped.ember),
    /** the mirror is in your satchel from its beat on (rk-earned-only: the mirror comes from the first minute) */
    mirrorGiven: oriented || resolved("ember"),
    /** the mirror's glass glows while the hope waits, or after it was skipped */
    mirrorGlows: !done.hope && (step === "hope" || skipped.hope),
    /** the first blank scroll appears on the shelf when the last vine falls */
    scrollGiven: oriented || done.vine,
    /** the steps left for later: each a small glow in the room */
    glows: SKIPPABLE.filter(s => skipped[s]),
  };
}

/**
 * When a beat may start, in ms: no sooner than the still's time from the start, and never before the caption of the step
 * just resolved has been read (Ari's note: captions never faster than reading). Infinity while the step before waits.
 * @param {string} step
 * @param {{ t0: number, resolvedAt: Record<string, number>, captionMs: (step: string) => number }} at
 */
export function beatAt(step, { t0, resolvedAt, captionMs }) {
  const i = STEPS.indexOf(step);
  if (i <= 0) return t0;
  const prev = STEPS[i - 1], r = prev === "wake" ? t0 : resolvedAt[prev];
  if (!isNum(r)) return Infinity;
  return Math.max(t0 + BEATS[step] * 1000, r + (captionMs(prev) || 0) + 1200);
}

/** A beat's "Later" shows once it has been up this long (its prompt read, and a little more). */
export const LATER_AFTER_MS = 7000;

/**
 * The write a step makes in the homeroom's private doc: { minute: {...} } merged, plus `oriented` when the last vine falls.
 * @param {"ember"|"mirror"|"hope"|"vine"} step @param {"done"|"skip"} how @param {number} at
 */
export function minuteWrite(step, how, at) {
  if (!ACTS.includes(step)) return null;
  if (how === "skip") return SKIPPABLE.includes(step) ? { minute: { skip: { [step]: at } } } : null;
  const w = { minute: { [step]: at } };
  if (step === "vine") w.oriented = at;
  return w;
}

/**
 * The doorway for an invitation's link (br-orient-each-invite, his ruling of 2026-10-24): a member of the room, or anyone who
 * has done the first minute, finds it open; only a guest who has not done the first minute goes through the minute first,
 * and the doorway opens at its end. Never a per-invite orientation.
 * @param {any} home the homeroom's private doc or its summary @param {boolean} member already in that room
 * @returns {"open" | "minute"}
 */
export function inviteDoorway(home, member) {
  if (member) return "open";
  return home && isNum(home.oriented) ? "open" : "minute";
}
