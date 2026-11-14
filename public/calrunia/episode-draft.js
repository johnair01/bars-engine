/* A charge the player wrote, drafted by rules (Six-faces-council pass charge-to-world-2, position ctw2-draft-from-your-words).

   The episode sheet (./episode-sheet.js) takes its free text, the strong start, secrets, place names and aspects, NPC
   lines and the week's capability, only from a charge's `drafted` block. The sample player's block was written by hand;
   a charge brought at the nook's map stand has none, so every land read "[to draft]" and built no pieces. draft() writes
   that block from the player's own answers and the world grammar's tables, by fixed templates and never by a model, so
   the same answers give the same world and the non-AI path is the only path.

   The three built lands carry any charge until other lands are built (ctw2-one-kit-any-charge): the place names and
   aspects are the kit's own, so place.js finds every piece; the player's words go into the strong start, the secrets,
   the friend's and neighbour's names and the take-home. The sheet still marks each line "(drafted)". */
import { VILLAINS } from "./episode-sheet.js";

/* The kit's three places, worded so place.js PIECES match every aspect (instrument-ring, music-bar, sounding-stump;
   weight-hut, amber-air, toolbag-balance; fire-ring, guitar-tuning, empty-crate). */
export const KIT = {
  encounter: { name: "The Unfinished Clearing", aspects: ["a ring of instruments grown into the tree trunks", "a bar of music that loops and stops", "a stump that sounds a note when you do"] },
  villain: { name: "The Scale-House", aspects: ["a hut built of stacked brass weights beside a broken footbridge", "air thick and amber, smelling of oil", "a brass balance in the doorway whose pan holds your toolbag"] },
  "road-home": { name: "The Friends' Fire", aspects: ["a low fire ringed with upturned crates for seats", "laughter and a guitar being tuned", "an empty crate left for you"] },
};
export const STAND_IN = { friend: "Oriel", neighbour: "the Tinker" };

const clean = s => String(s ?? "").trim().replace(/\s+/g, " ").replace(/[.!?;:,\s]+$/, "");
const cap1 = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const low1 = s => s && !/^(I\b|[A-Z]{2})/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;

/* The first person named in question 3 with the role friend (or no role), and the next one named. */
export function people(charge) {
  const folk = (((charge || {}).q3 || {}).townsfolk || []).filter(f => f && clean(f.name));
  const friend = folk.find(f => /^friend$/i.test(clean(f.role))) || folk[0] || null;
  const other = folk.find(f => f !== friend) || null;
  return { friend: friend ? clean(friend.name) : STAND_IN.friend, neighbour: other ? clean(other.name) : STAND_IN.neighbour };
}

/** The drafted block for a charge with none; g is read(charge). A charge that has one is returned unchanged by withDraft. */
export function draft(charge, g) {
  const q1 = charge.q1 || {}, q6 = charge.q6 || {};
  const words = low1(clean(q1.words)) || "what you want to make";
  const hoard = low1(clean(q6.hoard)) || "what you have made so far";
  const { friend, neighbour } = people(charge);
  const [villain] = VILLAINS[g.belief] || [g.villain];
  const weather = String(g.weather || "weather").split(" and ")[0].replace(/^(a|an|the)\s+/i, "");
  return {
    strong_start: `Every branch the player brushes hangs lower, and the toolbag on their back drags at the shoulders. The week's weather hangs in the trees: ${g.weather}. Ahead, a hum of music starts, and stops mid-bar: the tune of ${words}, started and never finished.`,
    secrets: [
      `${cap1(hoard)} weigh less than the toolbag.`,
      `The player's friends already keep a crate for the player by the fire, finished or not.`,
      `${cap1(villain)}'s scale reads the bag, never the work.`,
      "The stump in the clearing answers any note, even a wrong one.",
      `The hum that stops mid-bar is the player's own, from the first time the player tried ${words}.`,
      `${friend} kept a recording of the last time they played together.`,
      "The broken bridge needs one plank, and the toolbag already holds it.",
      `${cap1(neighbour)} built the Scale-House and regrets it.`,
      `The ${weather} lifts in any place where a song is played to its end.`,
      `The Protector carries the bag because it once kept ${words} safe from laughter.`,
    ],
    locations: JSON.parse(JSON.stringify(KIT)),
    daemon: "the Protector",
    npc_lines: {
      [friend]: "Play what you have so far?",
      [neighbour]: "Weights only weigh what you put in the pan.",
      "the Protector": "If nobody hears it, nobody can say it's bad.",
    },
    capability: { act: `Show what you have so far of ${words} to one person this week.`, quadrant: "upper_right" },
    by: "episode-draft.js",
  };
}

/** The charge with a drafted block: its own if it has one (the sample's, or a game master's), else draft()'s. */
export function withDraft(charge, g) {
  if (charge.drafted && Object.keys(charge.drafted).length) return charge;
  return { ...charge, drafted: draft(charge, g) };
}
