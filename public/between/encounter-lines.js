/* The prompting deck's lines (Six-faces-council hollow-interface round 4, positions hi4-card-is-the-place,
   hi4-obstacle-from-the-draw, hi4-overcome-becomes-story). A Wake Up card is a question you look with. Each card the two
   of you send draws one part of the encounter's obstacle; pulled up, its face carries three steps against that part. A
   step that answers its card's part makes that part give; one that answers nothing shows the part it missed, and the
   obstacle waits. When every part has given, the obstacle is overcome and kept as a story named from the two cards'
   phrases (Darmok and Jalad at Tenagra), which told over tea mints a vibeulon (bt-story-mints).

   7 cards (the Chapter 1 hand, Sage's keepsake) by 2 encounters: 14 parts, 42 steps, 14 phrases; and 21 nook lines, what
   each card can do in any Between. A step is [what you do, what you did, answers its part]. The card's question is the
   Allyship Deck's own (public/allyship-deck/allyship-deck.json, primaryQuestion); the steps follow its remediation and
   break its forbidden moves. Pure data and pure functions: the server (src/lib/between/shared-pick.ts) and the page
   (letters.js) read the same lines. */

export const HAND = ["WAKE-GR-SHAMAN", "WAKE-GR-SAGE", "WAKE-RA-SHAMAN", "WAKE-RA-SAGE", "WAKE-DA-REGENT", "WAKE-DA-DIPLOMAT", "WAKE-RA-CHALLENGER"];
export const ELEMENT = { GR: "wood", RA: "water", DA: "fire", SO: "metal" };
export const elementOf = id => ELEMENT[String(id).split("-")[1]] || "fire";

/** @type {Record<string, { beat: string, situation: string, overcome: string }>} */
export const ENCOUNTERS = {
  a6: { beat: "a6-his-floor", situation: "Pip has not come out in three days.", overcome: "Pip's door opens." },
  a8: { beat: "a8-the-hollow", situation: "A spirit made from your own charge waits in the hollow.", overcome: "The spirit settles, and grins back." },
};
export const ORDER = ["a6", "a8"];

/* What each card can do in any Between: the three steps its face shows in your nook, before you send it. */
/** @type {Record<string, string[]>} */
export const NOOK = {
  "WAKE-GR-SHAMAN": ["Find what is really running out.", "Name the one thing that would change everything.", "Leave alone what only feels short."],
  "WAKE-GR-SAGE": ["Ask whether this has happened before.", "Name the pattern the lack repeats.", "Keep the story, not the panic."],
  "WAKE-RA-SHAMAN": ["Name what no one in the room is naming.", "Look before you speak.", "Say it once, quietly."],
  "WAKE-RA-SAGE": ["Connect this to what keeps happening.", "Find where it started.", "Answer the whole, not the symptom."],
  "WAKE-DA-REGENT": ["Name the one harm that is yours to confront.", "Put down the fights that are not yours.", "Stand where your reach is."],
  "WAKE-DA-DIPLOMAT": ["Name who bears the risk.", "Keep others' safety out of the bargain.", "Go first where only you pay."],
  "WAKE-RA-CHALLENGER": ["Name what the room works hard not to see.", "Count yourself among those hiding it.", "Stay with the hard thing."],
};

/* The parts each card draws, and its steps against that part. */
/** @typedef {{ part: string, line: string, phrase: string, steps: [string, string, boolean][] }} Part */
/** @type {Record<string, Record<string, Part>>} */
export const LINES = {
  a6: {
    "WAKE-GR-SHAMAN": { part: "the empty jar at Pip's step", line: "Pip's water jar stands empty at the step.", phrase: "the jar by the step", steps: [
      ["Fill the jar at the stream and set it down quietly.", "filled the jar at the stream and set it down quietly.", true],
      ["Leave the full jar and walk away without knocking.", "left the full jar and walked away without knocking.", true],
      ["Bring Pip a basket of everything they might need.", "brought a basket of everything Pip might need.", false]] },
    "WAKE-GR-SAGE": { part: "the shutters closed again", line: "The shutters are closed, the way they were last winter.", phrase: "the winter shutters", steps: [
      ["Ask Ede what happened last winter.", "asked Ede what happened last winter.", true],
      ["Say it plainly: this is the third time.", "said it plainly: this is the third time.", true],
      ["Pry the shutters open to let the light in.", "pried at the shutters to let the light in.", false]] },
    "WAKE-RA-SHAMAN": { part: "the warden nobody mentions", line: "A warden spirit circles the hut, and nobody says so.", phrase: "the warden named", steps: [
      ["Say the warden's name out loud, softly.", "said the warden's name out loud, softly.", true],
      ["Walk slowly and empty-handed so the warden can see you.", "walked slowly and empty-handed past the warden.", true],
      ["Call to Pip over the warden's head.", "called to Pip over the warden's head.", false]] },
    "WAKE-RA-SAGE": { part: "the camp that creeps closer", line: "The hunters move their camp a little closer every night.", phrase: "the marks in the grey", steps: [
      ["Mark where the camp stood each night.", "marked where the camp stood each night.", true],
      ["Tell the hunters this is the pattern Pip sees.", "told the hunters this is the pattern Pip sees.", true],
      ["Chase off one hunter and call it done.", "chased off one hunter and called it done.", false]] },
    "WAKE-DA-REGENT": { part: "the lanterns by Pip's door", line: "The hunters have camped by Pip's door.", phrase: "the two on the path", steps: [
      ["Stand on the path between the lanterns and the door.", "stood on the path between the lanterns and the door.", true],
      ["Leave the roof alone. It is Pip's to mend.", "left the roof alone for Pip to mend.", false],
      ["Ask the hunters to move their camp downhill.", "asked the hunters to move their camp downhill.", true]] },
    "WAKE-DA-DIPLOMAT": { part: "Pip's shut door", line: "Pip's door stays shut.", phrase: "the knock at Pip's door", steps: [
      ["Knock twice and say only your name.", "knocked twice and said only their name.", true],
      ["Wait where Pip can see you from the window.", "waited where Pip could see them from the window.", true],
      ["Bring the hunters to the door to talk it out.", "brought the hunters to the door to talk it out.", false]] },
    "WAKE-RA-CHALLENGER": { part: "why the hunters came", line: "The hunters will not say why they came.", phrase: "the question at the fire", steps: [
      ["Ask the hunters what they are hunting.", "asked the hunters what they are hunting.", true],
      ["Say what no one will: they came for Pip's spirit.", "said what no one would: they came for Pip's spirit.", true],
      ["Let it go. It is not your place.", "let it go as not their place.", false]] },
  },
  a8: {
    "WAKE-GR-SHAMAN": { part: "the embers it hoards", line: "The spirit is hoarding embers in the roots.", phrase: "the counted embers", steps: [
      ["Count what it is actually holding.", "counted what it was actually holding.", true],
      ["Name the one ember it cannot do without.", "named the one ember it could not do without.", true],
      ["Offer it every ember you have.", "offered it every ember they had.", false]] },
    "WAKE-GR-SAGE": { part: "the old hunger in its shape", line: "Its shape is an old hunger you know.", phrase: "the old hunger named", steps: [
      ["Say when you first felt this hunger.", "said when they first felt this hunger.", true],
      ["Name the story: there was never enough.", "named the story: there was never enough.", true],
      ["Promise it will never be hungry again.", "promised it would never be hungry again.", false]] },
    "WAKE-RA-SHAMAN": { part: "what it does when no one looks", line: "It does something it hopes no one sees.", phrase: "the secret it enjoys", steps: [
      ["Watch it without saying anything.", "watched it without saying anything.", true],
      ["Name what it secretly enjoys.", "named what it secretly enjoys.", true],
      ["Point it out to everyone in the room.", "pointed it out to everyone in the room.", false]] },
    "WAKE-RA-SAGE": { part: "the circle it keeps walking", line: "It keeps walking the same circle.", phrase: "the circle walked once", steps: [
      ["Walk the circle beside it once.", "walked the circle beside it once.", true],
      ["Name where the circle started.", "named where the circle started.", true],
      ["Block its path so it stops.", "blocked its path so it would stop.", false]] },
    "WAKE-DA-REGENT": { part: "the fight it picked with everything", line: "It is fighting everything at once.", phrase: "the one fight kept", steps: [
      ["Name the one fight that is its own.", "named the one fight that is its own.", true],
      ["Put down the fights that are not yours.", "put down the fights that were not theirs.", true],
      ["Fight beside it, all of it.", "fought beside it, all of it.", false]] },
    "WAKE-DA-DIPLOMAT": { part: "the small spirits behind it", line: "Smaller spirits shelter behind it.", phrase: "the small ones sheltered", steps: [
      ["Make room for the small ones first.", "made room for the small ones first.", true],
      ["Ask who gets hurt if it falls.", "asked who gets hurt if it falls.", true],
      ["Pull it out into the open.", "pulled it out into the open.", false]] },
    "WAKE-RA-CHALLENGER": { part: "the name it will not say", line: "It will not say what it runs on.", phrase: "the grin at the name", steps: [
      ["Say what it runs on, and grin.", "said what it runs on, and grinned.", true],
      ["Name what you have been hiding from it too.", "named what they had been hiding from it too.", true],
      ["Look away and let it keep its secret.", "looked away and let it keep its secret.", false]] },
  },
};

export const lineFor = (enc, card) => (LINES[enc] && LINES[enc][card]) || null;

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
/** The story's name: the two cards' phrases, the opener's first, as one sentence (Tenagra's phrase). */
export function storyName(enc, cards) {
  const ps = cards.map(c => lineFor(enc, c)).filter(Boolean).map(l => l.phrase);
  return ps.length ? cap(ps.join(", ")) + "." : "";
}
/** The obstacle's headline: each part's line, the opener's first. */
export function obstacleLine(enc, cards) {
  return cards.map(c => lineFor(enc, c)).filter(Boolean).map(l => l.line).join(" ");
}

const isObj = v => !!v && typeof v === "object" && !Array.isArray(v);
const tryKeys = t => Object.keys(isObj(t) ? t : {}).filter(k => /^[1-9][0-9]?$/.test(k)).map(Number).sort((a, b) => a - b);

/**
 * Where an encounter stands, from the letters doc: who has sent, the parts that have given, and who still steps in the
 * current try. `order` is [opener, partner]. Tries are numbered from 1; a try waits on everyone whose part still stands,
 * and once they have all stepped it is resolved: a step that answers makes its part give for good, one that answers
 * nothing leaves it standing for the next try.
 */
export function encounterState(L, enc) {
  const order = (L && L.order) || [], E = (L && L[enc]) || {}, sent = isObj(E.sent) ? E.sent : {}, tries = isObj(E.tries) ? E.tries : {};
  const cards = order.map(u => (isObj(sent[u]) ? sent[u].card : null));
  const both = order.length === 2 && order.every(u => isObj(sent[u]));
  const given = new Set(), log = [];
  let cur = 1, need = both ? [...order] : [];
  for (const k of tryKeys(tries)) {
    if (k !== cur) break;
    const t = tries[String(k)] || {};
    const done = need.every(u => isObj(t[u]));
    if (!done) break;
    const res = {};
    for (const u of need) {
      const card = sent[u] && sent[u].card, l = lineFor(enc, card), i = t[u].i;
      const ok = !!(l && l.steps[i] && l.steps[i][2]);
      res[u] = { i, ok };
      if (ok) given.add(u);
    }
    log.push({ n: k, res });
    cur = k + 1; need = order.filter(u => !given.has(u));
  }
  const overcome = both && order.every(u => given.has(u));
  return { order, cards, both, given: [...given], try: overcome ? null : cur, need: overcome ? [] : need, log, overcome,
    story: overcome ? storyName(enc, cards) : null, stepping: !overcome && both ? (tries[String(cur)] || {}) : {} };
}
/** The encounter the pair is at now: the first not yet overcome, or "done". */
export function currentEncounter(L) {
  for (const e of ORDER) if (!(L && L.stories && L.stories[e])) return e;
  return "done";
}
