/* Next moves: what the Between suggests now, so people check in with themselves, with the Between and with each other
   as part of the loop (six-faces-council relationship-creature, br-next-moves-three-lanes).
   Three lanes, yourself, the Between, your partner, at most one move each, in plain words, never a count or a score.
   No AI: suggest() is pure, so the same state always gives the same moves.
   Plain module, no three.js: the Cave of Lessons and Big Mind take it as it is.

   state: {
     home: { lastCheckin, goals: [{ id, text, room }], casts: { <id>: { lane, room, line, at, done } } } (from the
             homeroom's private doc; optional inside a room; casts are the moves kept at the coin table),
     rooms: [summary] (src/lib/between/rules.ts roomSummary: id, phase, who, person, stale, joinWaiting, waiting,
             revisit, invitations, hereNow, lastSatTogether, styleAsk),
     here: a room id when the player is inside that room, else absent (the homeroom),
   }
   Each move: { lane, id, title, line, act }. act names a sheet on the page, or room:<id> to go to a room.

  A move kept at the coin table (public/between/iching/connection.js, Six-faces-council bi-cast-to-a-move) takes its
  lane's place once nobody is waiting on you there: an ask from the other person comes first, a nudge comes after. */

export const LANES = ["yourself", "between", "partner"];
export const LANE_NAMES = { yourself: "Yourself", between: "The Between", partner: "Your partner" };

const DAY = 864e5, WEEK = 7 * DAY;
const sameDay = (a, b) => { const x = new Date(a), y = new Date(b); return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate(); };
const nameIn = r => (r.who ? String(r.who) : "them");

/** The newest open move kept at the coin table for this lane (and, outside yourself, for a room in view). */
function kept(home, lane, rooms, here, now) {
  const all = home && home.casts && typeof home.casts === "object" ? home.casts : {};
  let best = null;
  for (const [id, c] of Object.entries(all)) {
    if (!c || c.done || c.lane !== lane || typeof c.at !== "number" || now - c.at >= WEEK) continue;
    if (lane !== "yourself" && !rooms.some(r => r.id === c.room)) continue;
    if (!best || c.at > best.at) best = { id, ...c };
  }
  if (!best) return null;
  const go = lane === "yourself" || best.room === here ? "coins" : "room:" + best.room;
  return { lane, id: "cast:" + best.id, title: "Your move from the coins", line: best.line, act: go };
}

function yourself(home, now) {
  if (!home) return null;
  const k = kept(home, "yourself", [], null, now); if (k) return k;
  if (!home.lastCheckin || !sameDay(home.lastCheckin, now))
    return { lane: "yourself", id: "checkin", title: "Check in with yourself", line: "You have not checked in today. How are you, before anyone else?", act: "checkin" };
  if (!home.goals || !home.goals.length)
    return { lane: "yourself", id: "goals", title: "Name what you hope for", line: "Write one hope for your relationships. Only you see it.", act: "goals" };
  return null;
}

function between(rooms, here, home, now) {
  const go = r => (r.id === here ? null : "room:" + r.id);
  for (const r of rooms) if (r.joinWaiting)
    return { lane: "between", id: "welcome:" + r.id, title: "Someone asked to join", line: `Someone holding your link to ${nameIn(r)}'s spark asked to come in. You can welcome them.`, act: go(r) || "tend" };
  for (const r of rooms) if (r.waiting && r.waiting.some(w => w.what === "lantern"))
    return { lane: "between", id: "lantern:" + r.id, title: "A lantern waits", line: `${r.person ? nameIn(r) : "Someone"} set a lantern down. It lights the Between once you welcome it.`, act: go(r) || "tend" };
  const k = kept(home, "between", rooms, here, now); if (k) return k;
  for (const r of rooms) if (r.stale)
    return { lane: "between", id: "stale:" + r.id, title: "Air it out", line: `The Between with ${nameIn(r)} has dimmed from going untended. Any tending airs it out.`, act: go(r) || "tend" };
  return null;
}

function partner(rooms, here, now, home) {
  const withPerson = rooms.filter(r => r.phase === "between" && r.person);
  const go = (r, sheet) => (r.id === here ? sheet : "room:" + r.id);
  for (const r of withPerson) if (r.invitations && r.invitations.length) {
    const inv = r.invitations[0];
    return { lane: "partner", id: "invite:" + r.id + ":" + inv.id, title: `${nameIn(r)} asked you to sit`, line: "They invited you to come and sit with them. Say yes, another time, or no.", act: go(r, "invitations") };
  }
  for (const r of withPerson) if (r.styleAsk)
    return { lane: "partner", id: "style:" + r.id, title: "They asked to change the room", line: `${nameIn(r)} would like the room to look different. It changes only if you say yes.`, act: go(r, "style") };
  const WAIT = { agreement: "an agreement waits for your yes", offer: "an offering waits for your yes", ask: "they asked something about an agreement", cast: "they left a cast face up on the coin table" };
  for (const r of withPerson) {
    const w = r.waiting && r.waiting.find(x => x.what !== "lantern");
    if (w) return { lane: "partner", id: "wait:" + r.id + ":" + w.id, title: "Waiting on you", line: `With ${nameIn(r)}, ${WAIT[w.what]}.`, act: go(r, w.what === "cast" ? "coins" : "tend") };
  }
  const k = kept(home, "partner", withPerson, here, now); if (k) return k;
  for (const r of withPerson) if (r.revisit && r.revisit.length)
    return { lane: "partner", id: "revisit:" + r.id, title: "Revisit an agreement", line: `An agreement with ${nameIn(r)} is up for revisit. Talk it through together.`, act: go(r, "tend") };
  for (const r of withPerson) if (r.hereNow)
    return { lane: "partner", id: "here:" + r.id, title: `${nameIn(r)} is here now`, line: "They are in your room right now. You could go and sit with them.", act: go(r, "invite") };
  for (const r of withPerson) if (!r.lastSatTogether || now - r.lastSatTogether > WEEK)
    return { lane: "partner", id: "sit:" + r.id, title: "Sit together", line: `You and ${nameIn(r)} have not sat together this week. Invite them to sit.`, act: go(r, "invite") };
  return null;
}

/** At most one move per lane, in lane order: yourself, the Between, your partner. */
export function suggest(state, now = Date.now()) {
  const s = state || {}, all = s.rooms || [], here = s.here || null;
  const rooms = here ? all.filter(r => r.id === here) : all;
  return [yourself(s.home, now), between(rooms, here, s.home, now), partner(rooms, here, now, s.home)].filter(m => m !== null);
}
