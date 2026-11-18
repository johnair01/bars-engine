/* The keepsake into the pouch (Six-faces-council council/callsheets/block-metabolize.md, the satchel slice; position
   bm6-keepsake-satchel-next; his B on bm-build-look-3, 2026-11-03: "These will live in the satchel inventory and be used for
   crafting and spirit husbandry").

   Carrying the keepsake at the clearing puts it in the pouch at your satchel, on the Between's server store: the private
   `data/users/<you>/pouch` of your homeroom (src/lib/between/rules.ts keepsakesWrite). It keeps its element, its shape and
   when it was carried; never the feeling, the charge's sentences or the lines you wrote.
   The land page has no garden of its own, so it asks GET /api/between for you and your homeroom and writes there. When that
   fails (signed out, offline, the store down) the keepsake waits in this browser's outbox, and the nook puts it in the pouch
   the next time it opens your homeroom (garden.js `takeWaitingKeepsakes`). */
export const KIND = { water: "vessel", metal: "key", fire: "ember", earth: "stone" };
export const NAME = { vessel: "A small vessel", key: "A key", ember: "An ember", stone: "A stone" };
export const OUTBOX = "between.keepsakes.waiting";

export function entry(element, at = Date.now()) { return KIND[element] ? { element, kind: KIND[element], state: "held", at } : null; }
export function waiting() { try { const w = JSON.parse(localStorage.getItem(OUTBOX) || "{}"); return w && typeof w === "object" && !Array.isArray(w) ? w : {}; } catch (e) { return {}; } }
export function clearWaiting(ids) { const w = waiting(); for (const id of ids) delete w[id]; try { localStorage.setItem(OUTBOX, JSON.stringify(w)); } catch (e) { /* nothing to clear */ } }
function wait(id, k) { const w = waiting(); w[id] = k; try { localStorage.setItem(OUTBOX, JSON.stringify(w)); } catch (e) { return false; } return true; }

async function post(url, body) {
  const r = await fetch(url, { method: body ? "POST" : "GET", credentials: "same-origin", cache: "no-store", headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error("store " + r.status);
  return r.json();
}

/* toPouch(id, element) -> "pouch" (on the server), "waiting" (in this browser until the nook opens), or null (nothing kept) */
export async function toPouch(id, element) {
  const k = entry(element); if (!k) return null;
  const safe = String(id).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 60) || "k" + Date.now().toString(36);
  try {
    const j = await post("/api/between");
    if (!j || !j.me || !j.home || !j.home.id) throw new Error("no homeroom");
    await post("/api/between/" + encodeURIComponent(j.home.id) + "/doc", { path: "data/users/" + j.me + "/pouch", op: "update", data: { keepsakes: { [safe]: k } } });
    return "pouch";
  } catch (e) { return wait(safe, k) ? "waiting" : null; }
}
