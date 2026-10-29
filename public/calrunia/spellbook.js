/* The spellbook: spells as data, and who may cast one now (six-faces-council relationship-creature, ba-spells-plain and
   Wendell's steer of 2026-10-21: "Individual spells can be cast by one's self but dual cultivation spells need both
   people there. There should probably be asynchronous dual cultivation spells as well").
   Three kinds: solo (you, on your cushion), dual (both on cushions, after a sit invitation said yes), async-dual (you start
   it on your cushion; the other person finishes it later from theirs). Spell work starts from the cushions (Ari,
   between-ari-formation-01). Three starter spells only; the dance comes in a later round.
   Plain module, no three.js: the Cave of Lessons and Big Mind take it as it is. */

export const KINDS = {
  solo: "On your own",
  dual: "Together, both here",
  "async-dual": "Together, one now and one later",
};

export const SPELLS = [
  { id: "settle", kind: "solo", name: "Settle", line: "Sit on your cushion and breathe with the hollow's light until it slows with you." },
  { id: "breathe-together", kind: "dual", name: "Breathe together", line: "Both of you on your cushions, breathing at one pace. The light between you steadies." },
  { id: "leave-a-light", kind: "async-dual", name: "Leave a light", line: "Light a small flame from your cushion and leave it. It stays lit until they sit and take it up." },
];

export const spellOf = id => SPELLS.find(s => s.id === id) || null;

/**
 * May this spell be cast now? `at`: { sitting, otherSitting, sitAccepted, started }.
 * sitting: you are on a cushion. otherSitting: the other person is on theirs, here now. sitAccepted: a sit invitation
 * between you was answered yes (br-invite-two-kinds). started: for async-dual, the other person began it and left it
 * for you. Returns { ok, why } with why in plain words when it cannot.
 */
export function castable(spell, at = {}) {
  const s = typeof spell === "string" ? spellOf(spell) : spell;
  if (!s) return { ok: false, why: "There is no such spell." };
  if (!at.sitting) return { ok: false, why: "Spells start from your cushion. Sit first." };
  if (s.kind === "solo") return { ok: true };
  if (s.kind === "dual") {
    if (!at.sitAccepted) return { ok: false, why: "Invite them to sit with you first. This one needs a yes." };
    if (!at.otherSitting) return { ok: false, why: "This one needs both of you on your cushions." };
    return { ok: true };
  }
  if (s.kind === "async-dual") return { ok: true, finishes: !!at.started };
  return { ok: false, why: "There is no such spell." };
}
