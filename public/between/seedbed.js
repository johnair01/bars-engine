/* The seed bed's rules (Six-faces-council bars-garden slice 1, spec .specify/specs/bars-garden; his A on
   bg-first-minute-look-1 and on bg2-frost-days). A plain module: no three.js, no fetch, so the hollow's bed
   (seedbed-room.js), the server route (/api/between/seedbed) and the tests read the same rules.

   A plant is one record per BAR, kept on the BAR's own seed record (seedMetabolization.plant, bg2-one-plant-record):
     { bed: "hollow" | "chamber", element, intent?, tends, plantedAt, tendedAt? }
   A tend costs one mana of the plant's element, at most once a day, in either bed (bg2-same-tend, bg2-frost-days A).
   A plant left seven days untended frosts (fourteen beside a spring, which no bed has yet); one tend clears it.
   Nothing dies, shrinks or loses a stage from neglect (TendedLife, neglect path frost). Stages read from the BAR's
   maturity and nothing else (FR-008). A harvest has one shape whichever bed it grew in (bg2-hollow-harvest-ingredient). */

export const ELEMENTS = ["wood", "fire", "earth", "metal", "water"];
export const BEDS = ["hollow", "chamber"];
export const INTENT_MAX = 140;
const DAY = 24 * 3600 * 1000;
/** A tend is "today's" for 20 hours, so a player who tends each evening is never refused for being a few minutes early. */
export const TEND_GAP = 20 * 3600 * 1000;
/** bg2-frost-days A: seven days untended, in the chamber and the hollow alike; a spring makes it fourteen. */
export const FROST_DAYS = 7, FROST_DAYS_SPRING = 14;

/** The feeling a BAR was written in names its element (emotional-alchemy/registry.ts EMOTION_TO_ELEMENT: fear is metal). */
const FEEL_TO_ELEMENT = { anger: "fire", sadness: "water", fear: "metal", joy: "wood", neutrality: "earth" };
export function elementOf(bar) {
  const n = String((bar && bar.nation) || "").trim().toLowerCase();
  if (ELEMENTS.includes(n)) return n;
  const f = String((bar && (bar.emotion || bar.emotionalAlchemyTag)) || "").trim().toLowerCase();
  if (FEEL_TO_ELEMENT[f]) return FEEL_TO_ELEMENT[f];
  if (ELEMENTS.includes(f)) return f;
  return "earth";
}

/** The player's line, untouched but for its ends and its length; an empty line is no line. */
export function cleanIntent(s) {
  if (typeof s !== "string") return undefined;
  const t = s.trim().slice(0, INTENT_MAX);
  return t ? t : undefined;
}

const iso = t => new Date(t).toISOString();
const ms = s => { const t = Date.parse(s || ""); return Number.isFinite(t) ? t : null; };

/** Is this a plant record that can stand? */
export function isPlant(p) {
  return !!p && typeof p === "object" && BEDS.includes(p.bed) && ELEMENTS.includes(p.element)
    && Number.isInteger(p.tends) && p.tends >= 0 && ms(p.plantedAt) != null
    && (p.tendedAt == null || ms(p.tendedAt) != null)
    && (p.intent == null || (typeof p.intent === "string" && p.intent.length <= INTENT_MAX));
}

/** Plant a BAR. Refused, changing nothing, when it already holds a plant: a BAR never has two (FR-001). */
export function plant(existing, { bed = "hollow", element, intent } = {}, now = Date.now()) {
  if (existing) return { ok: false, why: "planted" };
  if (!BEDS.includes(bed)) return { ok: false, why: "bed" };
  if (!ELEMENTS.includes(element)) return { ok: false, why: "element" };
  const p = { bed, element, tends: 0, plantedAt: iso(now) };
  const line = cleanIntent(intent); if (line) p.intent = line;
  return { ok: true, plant: p };
}

/** When the plant was last cared for: its last tend, or its planting. */
const lastCare = p => ms(p.tendedAt) ?? ms(p.plantedAt) ?? 0;

/** Frost shows on a plant untended seven days (fourteen by a spring). It reads; it never changes the record. */
export function isFrosted(p, now = Date.now(), { spring = false } = {}) {
  if (!p) return false;
  return now - lastCare(p) > (spring ? FROST_DAYS_SPRING : FROST_DAYS) * DAY;
}

/** Was it tended today (within the tend gap)? */
export function tendedToday(p, now = Date.now()) {
  const t = ms(p && p.tendedAt);
  return t != null && now - t < TEND_GAP;
}

/** May it be tended now, with this much mana held (by element)? The reason when not: "none" (no plant), "today", "mana". */
export function canTend(p, mana, now = Date.now()) {
  if (!p) return { ok: false, why: "none" };
  if (tendedToday(p, now)) return { ok: false, why: "today" };
  const held = mana && Number.isFinite(mana[p.element]) ? mana[p.element] : 0;
  if (held < 1) return { ok: false, why: "mana" };
  return { ok: true };
}

/** Tend it: one mana of its element leaves the pouch; the plant takes the tend and any frost clears. Refused, changing
    nothing, when canTend says no. Returns the next plant and the next mana. */
export function tend(p, mana, now = Date.now()) {
  const c = canTend(p, mana, now); if (!c.ok) return c;
  const nextMana = { ...(mana || {}) }; nextMana[p.element] = nextMana[p.element] - 1;
  return { ok: true, plant: { ...p, tends: p.tends + 1, tendedAt: iso(now) }, mana: nextMana };
}

/** A plant's stage reads from its BAR's maturity and nothing else (FR-008): the ember move that opens one is slice 2. */
const STAGES = { captured: 0, context_named: 1, elaborated: 2, shared_or_acted: 3, integrated: 4 };
export function stageOf(maturity) { return STAGES[maturity] ?? 1; }

/** The one harvest shape, from either bed, an ingredient for the hearth (slice 3 harvests; slice 1 holds the contract). */
export function harvestOf(barId, p, now = Date.now()) {
  if (!barId || !p || !ELEMENTS.includes(p.element)) return null;
  return { bar: String(barId), element: p.element, at: iso(now) };
}

/** Clean a pouch's mana: whole numbers of the five elements, none below nought. */
export function cleanMana(m) {
  const out = {};
  if (!m || typeof m !== "object") return out;
  for (const e of ELEMENTS) if (Number.isInteger(m[e]) && m[e] > 0) out[e] = m[e];
  return out;
}

/** Words the bed may say; no number, count, streak, timer or score reaches the page (FR-007). */
export const EL_WORD = { wood: "wood", fire: "fire", earth: "earth", metal: "metal", water: "water" };
export const FEEL_WORD = { wood: "a joy", fire: "an anger", earth: "a calm", metal: "a fear", water: "a sadness" };
