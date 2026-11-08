/* The healing journey's rules (Six-faces-council spec .specify/specs/healing-journey, slice 1, T004). Plain module, no
   three.js and no database, so every rule has a test (src/lib/between/__tests__/journey.test.ts). The nook draws what
   this says; src/lib/between/rules.ts guards the document it reads.
   His rulings: a move counts because it was made, never for its content (hj-moves); the pile never shrinks and nothing
   shows a streak, a score or a missed day on the play surface (hj-woodpile); closing deletes the pages and keeps the
   world (hj-weekly-practice). The document is data/users/<player id>/journey; `moves` keeps no text. */

/* The seven acts at the homeroom's furniture, in the order of the spec's contract. */
export const MOVES = ["floorboards", "window", "chair", "workbench", "doorway", "hearth", "diary"];
export const FEELINGS = ["wood", "fire", "earth", "metal", "water"];
export const OBJECT_STATES = ["carried", "held", "worked", "left"];
export const PLACE_STATES = ["dark", "lit", "ajar", "befriended"];
/* The pack's size that lights the next place (hj-pack-calls). */
export const PACK_LIGHTS_PLACE = 3;

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86400000;
const arr = (v) => (Array.isArray(v) ? v : []);
const real = (m) => !!m && typeof m === "object" && MOVES.includes(m.move);

/* One log per move record, always (hj-log-per-making): no daily cap, no decay, no removal. A record naming no real
   move is not a making and adds no wood. */
export function logsOf(moves) { return arr(moves).filter(real).length; }

/* How many times each move was made, all seven present (a move never made reads 0). "I did it in my life" counts
   toward the same move, so it is one number per move. Never a total of the person (FR-009). */
export function countsByMove(moves) {
  const out = {};
  for (const m of MOVES) out[m] = 0;
  for (const r of arr(moves)) if (real(r)) out[r.move] += 1;
  return out;
}

/* The program's days from startsOn to endsOn inclusive, each with the moves made that day. The coach reads "made" or
   "not made" (FR-010); no streak, no warning, no count of the missed. */
export function daysOf(moves, startsOn, endsOn) {
  if (!DAY.test(String(startsOn)) || !DAY.test(String(endsOn))) return [];
  const from = Date.parse(startsOn + "T00:00:00Z"), to = Date.parse(endsOn + "T00:00:00Z");
  if (!(to >= from)) return [];
  const byDay = {};
  for (const r of arr(moves)) if (real(r) && DAY.test(String(r.on))) (byDay[r.on] ||= []).push(r.move);
  const days = [];
  for (let t = from; t <= to; t += DAY_MS) {
    const on = new Date(t).toISOString().slice(0, 10);
    const made = byDay[on] || [];
    days.push({ on, made, didMake: made.length > 0 });
  }
  return days;
}

/* How steady a move is at a meeting (hj-steady-bands): 1 to 2 offered, 3 to 6 steady, 7 or more sure, never made "learn".
   A band draws an action; it never gates one (mechanical claim). */
export function steadiness(count) {
  const n = Math.floor(Number(count));
  if (!(n >= 1)) return "learn";
  return n >= 7 ? "sure" : n >= 3 ? "steady" : "offered";
}

/* The next place shows its light on three objects in the pack, or when the coach opens it for the session. Its light
   never waits on how an earlier meeting ended (hj-pack-calls). An object the player left on the road was never picked up. */
export function placeLit(pack, coachOpened) {
  if (coachOpened === true) return true;
  return arr(pack).filter((o) => o && OBJECT_STATES.includes(o.state) && o.state !== "left").length >= PACK_LIGHTS_PLACE;
}

/* A worked object leaves the shelf and becomes a furnishing chosen by its feeling (FR-006). */
const FURNISHING = { wood: "plant", fire: "lamp", earth: "plant", metal: "tool", water: "lamp" };
export function furnishingOf(feeling) { return FURNISHING[feeling] || null; }

/* Pages are readable only while the program stands: agreed to, not closed, not past its end date (FR-002, FR-011).
   `today` is "YYYY-MM-DD". */
export function pagesReadable(program, today) {
  if (!program || typeof program !== "object") return false;
  if (!program.agreedOn || program.closedAt) return false;
  if (DAY.test(String(program.endsOn)) && DAY.test(String(today)) && today > program.endsOn) return false;
  return true;
}

/* What the coach may read: only pages the player marked to send, and only while pages are readable (the storage rule,
   Wendell 2026-11-07). A page sent and then written on again is no longer sent: the player sends it again. */
export function sentPages(doc, today) {
  const src = doc && typeof doc === "object" ? doc : {};
  if (!pagesReadable(src.program, today)) return [];
  return arr(src.pages).filter((p) => p && typeof p.sentAt === "string" && p.sentAt);
}

/* May this player send a page? Only after signing that sending pages the coach must act on consents to that action. */
export function mayMarkToSend(program) {
  return !!(program && typeof program === "object" && program.agreedOn && program.sendAgreedOn && !program.closedAt);
}

/* Mark one page sent, or take the mark off. The input is not changed. */
export function markSent(doc, pageId, at, sent) {
  const src = doc && typeof doc === "object" ? doc : {};
  const pages = arr(src.pages).map((p) => {
    if (!p || p.id !== pageId) return p;
    const { sentAt, ...rest } = p;
    return sent === false ? rest : { ...rest, sentAt: typeof at === "string" ? at : new Date().toISOString() };
  });
  return { ...src, pages };
}

/* Close the program by the coach's hand (FR-011). Returns the document with its pages gone and the world kept
   (pack, moves, places, learned), and the removed pages so the route can offer the player their copy first. */
export function close(doc, at) {
  const src = doc && typeof doc === "object" ? doc : {};
  const pages = arr(src.pages);
  const stamp = typeof at === "string" ? at : new Date().toISOString();
  const program = { ...(src.program || {}), closedAt: (src.program && src.program.closedAt) || stamp };
  const world = { ...src, program, pages: [] };
  return { doc: world, pages };
}

/* ---------- the nook's pieces (slice 1, T006 to T009): what the shelf, diary, woodpile and sheet read ---------- */

export const MOVE_NAMES = { floorboards: "The floorboards", window: "The window", chair: "The visitor's chair", workbench: "The workbench", doorway: "The doorway", hearth: "The hearth", diary: "The diary" };
export const FEELING_NAMES = { wood: "joy", fire: "anger", earth: "calm", metal: "fear", water: "sadness" };

/* The diary's words are the built 3-2-1's, word for word (FR-004, hj-diary-ink): src/components/clean-up/ThreeTwoOnePasses.tsx.
   journey.test.ts reads that file and fails if any of these drift from it. No line here is written by a model. */
export const DIARY = {
  face: { num: "3", title: "Face it", caption: "third person · it",
    ask: "What does this charge look like if it were a person? Where are they from? How do they move through the world? Just write down what comes up and let yourself be surprised.",
    hint: "They’re the kind of person who…" },
  name: { num: "2", title: "Talk to it", caption: "second person · you · a thread",
    ask: "Before you speak to them, what do you call them? Not a clinical label — a name that fits their nature.",
    hint: "e.g. The Cynic, The Protector, The Lookout" },
  talk: { ask: "Now go back and forth. Ask them something, switch voices, and let them answer in their own words. Keep going until they say something you didn’t already know.",
    meHint: "Ask it something, or say the thing you’d say if there were no cost…" },
  be: { num: "1", title: "Be it", caption: "first person · I · no one else in the room",
    ask: (name) => "Drop the dialogue. You are " + (String(name || "").trim() || "the part") + " now, alone, with nobody to convince and nothing to ask for. Say what is true when there’s no one listening.",
    hint: "I am… / What is true about me is…",
    shift: "Come back to yourself. Holding this presence with awareness — what shifted?", shiftHint: "What feels different now…" },
};
export const OPENERS = ["What do you want from me?", "If you got that, what would you have then?", "What is life like for you right now?", "What would have to be true for you to settle?", "What are you most afraid would happen?"];

/* The local day, "YYYY-MM-DD" (a move belongs to the player's own day, not Greenwich's). */
export function dayOf(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

/* The nook shows the journey only to a player whose program stands (an enrolled player); nobody else sees a new thing. */
export function enrolled(doc) { return !!(doc && typeof doc === "object" && doc.program && typeof doc.program === "object" && !doc.program.closedAt); }

/* One move record (FR-007): which, which day, when. `life` marks "I did it in my life". Keeps no text. */
export function moveRecord(move, life, now = new Date()) {
  if (!MOVES.includes(move)) return null;
  const r = { move, on: dayOf(now), at: now.toISOString() };
  if (life === true) r.life = true;
  return r;
}
export function withMove(doc, move, life, now) {
  const r = moveRecord(move, life, now);
  return r ? [...arr(doc && doc.moves), r] : arr(doc && doc.moves);
}

/* The woodpile's slots (stills round make/scenes.js pileSlots): a half-offset stack against the hearth's left jamb. Slots fill
   by diagonal (column + layer), lowest diagonal first and the higher layer first within it, so the pile is a heap from its
   first log; at most five layers high, then it grows out along the wall. Never a gap, never a removal: the pile at n is the
   pile at n-1 plus one log. */
export function pileSlots(n, maxLayer = 4) {
  const out = [];
  for (let d = 0; out.length < n; d++) for (let l = Math.min(d, maxLayer); l >= 0 && out.length < n; l--) out.push([d - l, l]);
  return out;
}

/* On the shelf: objects carried or held, oldest first. The nook's shelf holds three beside the book; the rest wait in the pack. */
export const SHELF_HOLDS = 3;
export function onShelf(pack) { return arr(pack).filter((o) => o && (o.state === "carried" || o.state === "held")); }
export function shelfShown(pack) { return onShelf(pack).slice(0, SHELF_HOLDS); }
export function furnishings(pack) { return arr(pack).filter((o) => o && o.state === "worked" && o.furnishing); }

/* The diary page for an object: the unfinished one if it is there, else a new one (FR-005: it reopens on the same page). */
export const blankPass = () => ({ subject: null, faceCharge: "", maskName: "", thread: [], beVoice: "", beShift: "", ownIt: { quality: "", move: "" } });
export function pageFor(doc, objectId) {
  return arr(doc && doc.pages).find((p) => p && p.objectId === objectId && !p.doneOn) || null;
}
export function newPage(objectId, now = new Date()) {
  return { id: "pg" + now.getTime().toString(36), objectId, pass: blankPass(), startedOn: dayOf(now), doneOn: null };
}
/* Which part of the diary a page is at: the first one not yet written (the player may still step to any). */
export function diaryAt(pass) {
  const p = pass || blankPass();
  if (!String(p.faceCharge).trim()) return "face";
  if (!String(p.maskName).trim()) return "name";
  if (!String(p.beVoice).trim()) return "talk";
  return "be";
}
/* The next voice in the thread: the player speaks first, then the object, alternating (the coaching page's two-voice thread). */
export function nextVoice(thread) { const t = arr(thread); return t.length && t[t.length - 1].from === "me" ? "it" : "me"; }
export function withTurn(pass, text, from) {
  const t = String(text || "").trim().slice(0, 600);
  return t ? { ...pass, thread: [...arr(pass.thread), { from: from === "it" ? "it" : "me", text: t }] } : pass;
}
/* The diary's last pass done: the page closes, the object leaves the shelf and becomes a furnishing by its feeling (FR-006). */
export function finishPage(doc, pageId, now = new Date()) {
  const src = doc && typeof doc === "object" ? doc : {};
  const pg = arr(src.pages).find((p) => p && p.id === pageId);
  if (!pg) return src;
  const day = dayOf(now);
  const pages = arr(src.pages).map((p) => (p === pg ? { ...p, doneOn: day } : p));
  const pack = arr(src.pack).map((o) => (o && o.id === pg.objectId ? { ...o, state: "worked", furnishing: furnishingOf(o.feeling) || undefined } : o));
  return { ...src, pages, pack, moves: withMove(src, "diary", false, now) };
}
