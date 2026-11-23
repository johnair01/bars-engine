// Which cultivation figure the player is: one answer for the whole route (the nook, the four lands, the Hollow and the
// Heaven sect). Wendell's C on cd-route-look-1, 2026-11-14: "There are 3 character models. They should be the same
// character model the player picks." No picker exists yet (the mirror is hj-mirror-look-1, unanswered), so the pick is
// the default the nook already starts from, "f", unless ?cult=m asks for him. The answer is kept in this tab's
// sessionStorage so a link from one page of the route to the next carries it.
export function cultPick() {
  let q = null; try { q = new URLSearchParams(location.search).get("cult"); } catch (e) { /* no query */ }
  if (q === "m" || q === "f") { try { sessionStorage.setItem("between-cult", q); } catch (e) { /* kept for this page only */ } return q; }
  try { const s = sessionStorage.getItem("between-cult"); if (s === "m" || s === "f") return s; } catch (e) { /* the default */ }
  return "f";
}

/* The mirror's look (hj-comb-look-1, hj-mirror-look-1): what she has touched beside the glass, kept for the tab like the
   figure above. One store: the stones, the palm, the pegs and the comb each write one key here. No key means the body's own
   default (cult/walker.js BODIES) and the robe's own hair. */
export const HAIRS = ["crop", "loose", "bob", "lowbun", "tail", "twin", "braid", "topknot"];
const LOOK_KEY = "between-cult-look";
let MEM = {};
export function cultLook() {
  try { const o = JSON.parse(sessionStorage.getItem(LOOK_KEY) || "null"); if (o && typeof o === "object") return o; } catch (e) { /* the page's own copy */ }
  return MEM;
}
export function setCultLook(patch) {
  const o = { ...cultLook(), ...patch };
  MEM = o;
  try { sessionStorage.setItem(LOOK_KEY, JSON.stringify(o)); } catch (e) { /* kept for this page only */ }
  return o;
}
