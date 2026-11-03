/* What the charge left, kept (Six-faces-council council/callsheets/block-metabolize.md, slice 2; his steer on
   bm-chamber-look-3, 2026-11-02 20:12Z: "Mix of a and b").

   Slice 1 wrote the block's compost record to the tab's sessionStorage, so closing the tab forgot it. This keeps it in the
   spirit store the caves already share (`oag.spirits.v1`, content/ontology-game/cave/spirit-store.js; cave compost
   capacity 6), as one more list beside the spirits and the purse:
     kept: [{ id, element, feeling, strength, keepsake, let, stands: [{ stand, taken|passed }], where, at }]
   `let` is true for a piece let go (it stays in the chamber as one gold light). The record holds the block's element, its
   feeling word and its size, and which stands were taken; never the charge's own sentences, and never a count shown to the
   player. The keeping chamber (land/chamber.js) reads it; block-room.js writes it at the clearing. Other fields in the
   store are kept as they are, so the caves' spirits and vibeulons are never touched. */
const KEY = "oag.spirits.v1", MAX = 60;
function read() { try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); return s && s.v === 1 && Array.isArray(s.spirits) ? s : { v: 1, spirits: [] }; } catch (e) { return { v: 1, spirits: [] }; } }
export function kept() { return (read().kept || []).map(r => ({ ...r })); }
export function keep(rec) {
  if (!rec || !rec.element) return null;
  const s = read(), r = { id: rec.id || "k" + Date.now().toString(36), element: rec.element, feeling: rec.feeling || "", strength: rec.strength || "",
    keepsake: rec.keepsake || "", let: !!rec.let, stands: (rec.stands || []).map(x => ({ ...x })), where: rec.where || "the land", at: rec.at || new Date().toISOString() };
  s.kept = (s.kept || []).filter(x => x.id !== r.id).concat([r]).slice(-MAX);
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { return null; }
  return { ...r };
}
/* the preview's chamber (?kept=sample): six pieces and two lights, a month of clearing, never written to the store */
export const SAMPLE = [
  { id: "s1", element: "water", feeling: "disappointed", strength: "a storm", keepsake: "a small vessel" },
  { id: "s2", element: "fire", feeling: "frustrated", strength: "a season", keepsake: "an ember" },
  { id: "s3", element: "metal", feeling: "anxious", strength: "a storm", keepsake: "a key", let: true },
  { id: "s4", element: "earth", feeling: "numb", strength: "a season", keepsake: "a stone" },
  { id: "s5", element: "water", feeling: "isolated", strength: "a storm", keepsake: "a small vessel" },
  { id: "s6", element: "metal", feeling: "scared", strength: "a storm", keepsake: "a key" },
  { id: "s7", element: "fire", feeling: "stuck", strength: "a storm", keepsake: "an ember", let: true },
  { id: "s8", element: "earth", feeling: "overwhelmed", strength: "a storm", keepsake: "a stone" },
];
