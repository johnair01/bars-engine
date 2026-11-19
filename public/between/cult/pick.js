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
