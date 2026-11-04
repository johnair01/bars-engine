/* A friend's own deck (Six-faces-council spec .specify/specs/friendcraft-deck, slice 1; his A on fo-ad-look-1, tea bowls).
   A goal is one line in the player's words; under it three cards, light, middle and deep, each worded by the player. The
   deck is a private doc of its own beside `home` (rules.ts deckWrite), so a hope the player told the mirror never reaches
   it unless they write it on the goal line themselves. Cost is read from a card's depth and drawn as empty tea bowls:
   none, one, two. It is never stored, and no number, count, streak or score reaches the page (keep list 5).
   Plain module, no three.js and no fetch, so every rule here has a test (src/lib/between/__tests__/friendcraft-deck.test.ts). */

export const DEPTHS = ["light", "middle", "deep"];
/** Tea bowls a card costs to open, by depth (fo-goal-makes-three). Read, never stored. */
export const COST = { light: 0, middle: 1, deep: 2 };
export const DEPTH_NAMES = { light: "Light", middle: "Middle", deep: "Deep" };
/** The longest a goal or a card's words may be (rules.ts holds the same). */
export const WORDS_MAX = 140;

/** The words the page shows, all of it the council's and the keep list's. No digit anywhere in them. */
export const COPY = {
  ask: "What do you want from a friend?",
  anyone: "Anyone you sit with can draw these.",
  add: "Add these to my deck",
  another: "Write another",
  takeOut: "Take this goal out of the book",
  hope: "You told the mirror: ",
  hopeOnly: ". Only you see this line.",
  open: "The doorway is open. Your book waits on the low table: sit, and write what you want from a friend.",
};
export const HINTS = {
  light: "Write a small ask a friend could make of you, or an easy hour you could spend together.",
  middle: "Write an ask that takes a little more from you both.",
  deep: "Write an ask you would make only of someone who has sat with you a while.",
};

const clean = t => String(t == null ? "" : t).replace(/\s+/g, " ").trim().slice(0, WORDS_MAX);

/** The leaf key of the blank goal leaf; no goal id is ever this. */
export const BLANK_GOAL = { kind: "goalblank", key: "goal", name: "" };

/** A new goal: its words, no cards yet. Null when there are no words. @param {string} text @param {number} at */
export function newGoal(text, at) {
  const t = clean(text);
  return t ? { text: t, at, cards: {} } : null;
}

/** A goal with one card worded (or cleared, when the words are empty). Returns a new goal. Depth must be one of the three. */
export function wordCard(goal, depth, words, at) {
  if (!goal || !DEPTHS.includes(depth)) return goal;
  const w = clean(words), cards = { ...(goal.cards || {}) };
  if (w) cards[depth] = { words: w, at }; else cards[depth] = null;
  return { ...goal, cards };
}

/** The worded cards of a goal, light first: depth, words, cost. A blank card is not in the list and is never drawn. */
export function cardsOf(goal) {
  const cards = goal && goal.cards && typeof goal.cards === "object" ? goal.cards : {};
  return DEPTHS.filter(d => cards[d] && typeof cards[d].words === "string" && cards[d].words.trim())
    .map(d => ({ depth: d, words: cards[d].words, at: cards[d].at, cost: COST[d] }));
}

/** The goals of a deck as record-book leaves, oldest first. A goal written to null is gone. @param {any} deck */
export function deckLeaves(deck) {
  const goals = deck && deck.goals && typeof deck.goals === "object" ? deck.goals : {};
  return Object.entries(goals).filter(([, g]) => g && typeof g.text === "string" && g.text)
    .sort((a, b) => (a[1].at || 0) - (b[1].at || 0))
    .map(([gid, g]) => ({ kind: "goal", key: gid, gid, name: g.text }));
}

/** The hope a player told the mirror in the first minute: their newest goal tied to no room. Shown faint above the goal
    line and never copied into the deck (br-goals-private). @param {any} home */
export function mirrorHope(home) {
  const goals = home && home.goals && typeof home.goals === "object" ? home.goals : {};
  const mine = Object.values(goals).filter(g => g && typeof g.text === "string" && g.text.trim() && !g.room)
    .sort((a, b) => (b.at || 0) - (a.at || 0));
  return mine.length ? mine[0].text : "";
}

/** Everything a goal page says in words, in reading order, for the test that no digit reaches the page. A blank card shows
    its hint; a worded one shows its words. @param {any} goal @param {{ saved?: boolean }} [o] */
export function pageWords(goal, o = {}) {
  const out = [goal ? goal.text : COPY.ask];
  for (const d of DEPTHS) {
    const c = goal && goal.cards && goal.cards[d];
    out.push(DEPTH_NAMES[d], c && c.words ? c.words : HINTS[d]);
  }
  out.push(COPY.anyone, o.saved ? COPY.another : COPY.add);
  return out;
}
