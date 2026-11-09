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
  // the table (slice 2, .specify/specs/friendcraft-deck-2): {name} is the other friend's, filled in by the page and never edited
  draw: "Draw from {name}'s deck",
  askRoad: "Ask {name} to offer it",
  earn: "Earn it together",
  back: "Put it back",
  openTea: "Open it with tea",
  asked: "{name} asked for a card you wrote.",
  offer: "Offer it",
  notToday: "Not today",
  lineDrawer: "Write what you want {name} to hear.",
  lineOwner: "Write what you hear in it.",
  kept: "Kept in both your books.",
  sees: "{name} sees it when they next sit.",
  sealed: "A card is sealed until it is offered or opened with tea.",
  // the kept turn as a BAR (slice 3, .specify/specs/friendcraft-deck-3)
  barKick: "A BAR, kept at the table",
  emberHeld: "Your ember from this turn, worked wood to fire.",
  setIn: "Set it into this BAR",
  takeBack: "Take my coin back",
  storyNone: "This coin has no story yet.",
  restFail: "That did not land. Try again in a moment.",
};
export const HINTS = {
  light: "Write a small ask a friend could make of you, or an easy hour you could spend together.",
  middle: "Write an ask that takes a little more from you both.",
  deep: "Write an ask you would make only of someone who has sat with you a while.",
};

/* The default text an admin or steward may change. Each field is a line of the deck pages' words; the built-in text above
   stays the fallback, so an empty field returns to it. `hopeOnly` and `hope` are joined to the player's own words and stay
   fixed. Every edit keeps the keep list: no digit, no markup, one short line (keep list 5). */
export const COPY_FIELDS = ["ask", "anyone", "add", "another", "takeOut", "open", "hint.light", "hint.middle", "hint.deep",
  "draw", "askRoad", "earn", "back", "openTea", "asked", "offer", "notToday", "lineDrawer", "lineOwner", "kept", "sees", "sealed", "barKick", "emberHeld", "setIn", "takeBack", "storyNone", "restFail"];
export const COPY_MAX = 200;
export const DEFAULT_COPY = { ...COPY, ...Object.fromEntries(DEPTHS.map(d => ["hint." + d, HINTS[d]])) };
/** An edit as the server keeps it: only known fields, trimmed single lines under COPY_MAX, no digit, no angle bracket. */
export function cleanCopy(edit) {
  const out = {};
  if (!edit || typeof edit !== "object" || Array.isArray(edit)) return out;
  for (const k of COPY_FIELDS) {
    const v = edit[k];
    if (typeof v !== "string") continue;
    const t = v.replace(/\s+/g, " ").trim();
    if (t && t.length <= COPY_MAX && !/[0-9<>]/.test(t) && t !== DEFAULT_COPY[k]) out[k] = t;
  }
  return out;
}
/** Puts a kept edit over the built-in text, in place, so the page's COPY and HINTS read it. An empty edit restores the default. */
export function applyCopy(edit) {
  const e = cleanCopy(edit);
  for (const k of COPY_FIELDS) {
    const v = e[k] !== undefined ? e[k] : DEFAULT_COPY[k];
    if (k.startsWith("hint.")) HINTS[k.slice(5)] = v; else COPY[k] = v;
  }
  return e;
}

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

/** A line of table copy with the other friend's name put in. The page fills `{name}`; an admin's edit never carries one in. */
export const say = (key, name) => String(COPY[key] || "").replace(/\{name\}/g, name || "your friend");
