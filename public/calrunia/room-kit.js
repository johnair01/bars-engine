/* The room kit (six-faces-council homeroom kit, Still A "the nook", approved 2026-10-24 with no notes).
   A room is three layers instead of one baked scene: the shell (walls, window, hearth and the spots), the style (the four
   room styles in room-styles.js, unchanged) and the placements (which item sits on which spot).

   Board positions this module keeps, as Wendell ruled them:
     rk-spots-not-grid   items go on spots that fit them (hang, small, floor), never a free grid;
     rk-earned-only      the starter nook has a hearth, a window and five spots; every item is earned through play, none bought;
     rk-place-is-shared  in a shared room either person sets an item down without asking; lifting the other person's item
                         sends it back to their satchel, never away, and both acts show in While you were away;
     rk-one-kit          one kit for the Between, the Cave of Lessons and Big Mind: the Dusk hollow is the `hollow` shell with
                         its pieces pre-placed, so nothing that works today changes.

   Plain module, no three.js, same spirit as applyStyle: applyRoom only sets values and hangs what a scene's own factory makes on
   the scene's own slots. A place that wants the kit lists its spots (see PORTABLE below) and hands applyRoom its handles.
   Positions are metres in the scene's frame: y up, the window and the valley toward -z. */
import { applyStyle, DEFAULT_STYLE } from "./room-styles.js";

/** Kinds of spot, and so of item: a hook to hang from, a small place (a shelf, a stool), the floor. */
export const TAKES = ["hang", "small", "floor"];

/** @typedef {{ id: string, name: string, takes: string, make: string, glows?: boolean, earnedBy: string, line: string }} Item */
/** @typedef {{ item: string, owner: string | null, at: number | null, fixed?: boolean }} Placed */
/** The items. `make` names the scene's maker; `earnedBy` names the event in earnedEvents that gives it.
 * @type {Record<string, Item>} */
export const ITEMS = {
  lantern: { id: "lantern", name: "Paper lantern", takes: "hang", make: "lantern", glows: true, earnedBy: "keptAgreement", line: "From your first kept agreement." },
  "seed-pot": { id: "seed-pot", name: "Spirit seed", takes: "small", make: "seedPot", earnedBy: "letGo", line: "From a spirit you let go." },
  cushion: { id: "cushion", name: "Plum cushion", takes: "floor", make: "cushion", earnedBy: "satWith", line: "From the first time someone sat with you." },
  mirror: { id: "mirror", name: "Hope mirror", takes: "floor", make: "mirror", earnedBy: "oriented", line: "From your first minute here." },
  scroll: { id: "scroll", name: "Blank scroll", takes: "small", make: "scroll", earnedBy: "oriented", line: "From your first minute here. Write an invitation on it." },
  rug: { id: "rug", name: "Wave rug", takes: "floor", make: "rug", earnedBy: "checkin", line: "From your first check-in." },
};
/** The order a satchel shows them in: the still's order. */
export const ITEM_ORDER = ["lantern", "seed-pot", "cushion", "mirror", "rug", "scroll"];

/* The shells. A spot is { id, takes, at: [x, y, z], face } (face: yaw in radians, 0 faces +z, toward the room's front).
   A `fixed` spot is drawn by the shell itself (prePlaced): it cannot be set on or lifted, and applyRoom leaves it alone. */
export const SHELLS = {
  /* Your homeroom: small and bare, the hollow's bark and moss, a hearth, an arched window onto the valley, five spots. */
  nook: {
    id: "nook", name: "The nook",
    spots: [
      { id: "hook", takes: "hang", at: [-0.9, 2.45, -1.3], face: 0 },
      { id: "shelf", takes: "small", at: [-1.08, 1.31, -3.5], face: 0.3 },
      { id: "floor-l", takes: "floor", at: [-1.75, 0, 0.15], face: 0 },
      { id: "floor-c", takes: "floor", at: [-0.1, 0, 1.05], face: 0 },
      { id: "floor-r", takes: "floor", at: [1.55, 0, 0.1], face: 0 },
    ],
    prePlaced: {},
  },
  /* A room you share: today's Dusk hollow, its lanterns and cushions pre-placed, with free spots for what you both bring. */
  hollow: {
    id: "hollow", name: "The Dusk hollow",
    spots: [
      { id: "lantern-l", takes: "hang", at: [-2.3, 3.0, 1.7], fixed: true },
      { id: "lantern-r", takes: "hang", at: [1.8, 3.25, -2.1], fixed: true },
      { id: "seat-0", takes: "floor", at: [-0.95, 0.28, 0.5], fixed: true },
      { id: "seat-1", takes: "floor", at: [0.95, 0.28, 0.5], fixed: true },
      { id: "hook", takes: "hang", at: [0.4, 2.9, 2.9], face: 0 },
      { id: "stool", takes: "small", at: [4.4, 0.46, 1.6], face: -1.2 },
      { id: "floor-a", takes: "floor", at: [-1.75, 0, -2.75], face: 0.4 },
      { id: "floor-b", takes: "floor", at: [2.75, 0, -2.0], face: -0.5 },
      { id: "floor-c", takes: "floor", at: [0.9, 0, 3.55], face: 0 },
    ],
    prePlaced: { "lantern-l": "lantern", "lantern-r": "lantern", "seat-0": "cushion", "seat-1": "cushion" },
  },
};
export const DEFAULT_SHELL = "nook";

/** A shell by id; anything unknown is the nook, so an old room or a typo still opens. */
export const shellOf = id => SHELLS[id] || SHELLS[DEFAULT_SHELL];
/** The shell a garden doc stands in: a homeroom is the nook, a room you share the hollow. */
export const shellFor = g => (g && g.kind === "home" ? "nook" : g ? "hollow" : DEFAULT_SHELL);
const spotOf = (shell, id) => shell.spots.find(s => s.id === id) || null;

/** One placement as stored: { item, owner, at }. A bare item id (a shell's prePlaced, or a hand-written room) has no owner. */
function entry(v) {
  if (typeof v === "string") return { item: v, owner: null, at: null };
  if (v && typeof v === "object" && typeof v.item === "string") return { item: v.item, owner: typeof v.owner === "string" ? v.owner : null, at: typeof v.at === "number" ? v.at : null };
  return null;
}

/**
 * What stands on each spot: the shell's pre-placed pieces (fixed) and the stored placements that fit. A placement on a spot the
 * shell lacks, of an unknown item, or of an item the spot does not take, is left out, so a bad write never breaks a room.
 */
/** @returns {Record<string, Placed>} */
export function resolvePlaced(shellOrId, placed) {
  const shell = typeof shellOrId === "string" ? shellOf(shellOrId) : shellOrId;
  const out = {};
  for (const [sid, item] of Object.entries(shell.prePlaced || {})) out[sid] = { item, owner: null, at: null, fixed: true };
  for (const [sid, v] of Object.entries(placed || {})) {
    const sp = spotOf(shell, sid), e = entry(v);
    if (!sp || sp.fixed || !e || !ITEMS[e.item] || ITEMS[e.item].takes !== sp.takes) continue;
    out[sid] = e;
  }
  return out;
}

/** The free spots that take an item, in the shell's order. */
export function spotsFor(shellOrId, itemId, placed) {
  const shell = typeof shellOrId === "string" ? shellOf(shellOrId) : shellOrId;
  const it = ITEMS[itemId]; if (!it) return [];
  const now = resolvePlaced(shell, placed);
  return shell.spots.filter(s => !s.fixed && s.takes === it.takes && !now[s.id]).map(s => s.id);
}

/** Where one person's item stands in this room, or null. Each person sets each earned item down once per room. */
export function spotOfItem(shellOrId, placed, itemId, owner) {
  const now = resolvePlaced(shellOrId, placed);
  for (const [sid, e] of Object.entries(now)) if (!e.fixed && e.item === itemId && e.owner === owner) return sid;
  return null;
}

/** Your satchel here: what you have earned, less what you have set down in this room. */
export function satchelOf(earned, shellOrId, placed, me) {
  return (earned || []).filter(id => ITEMS[id] && !spotOfItem(shellOrId, placed, id, me));
}

/**
 * Set an item down: { ok, patch, placed, line } or { ok: false, why }. `patch` is what goes into the room's `placed` (merge
 * semantics: one key per spot); `line` the history line for a room you share. Either person may set down without asking.
 */
/** @param {any} shellOrId @param {any} placed @param {string} spotId @param {string} itemId @param {string} me @param {number} [at]
 *  @param {string[] | null} [earned] @returns {any} */
export function placeOn(shellOrId, placed, spotId, itemId, me, at = Date.now(), earned = null) {
  const shell = typeof shellOrId === "string" ? shellOf(shellOrId) : shellOrId;
  const sp = spotOf(shell, spotId), it = ITEMS[itemId];
  if (!sp) return { ok: false, why: "no-spot" };
  if (!it) return { ok: false, why: "no-item" };
  if (sp.fixed) return { ok: false, why: "fixed" };
  if (sp.takes !== it.takes) return { ok: false, why: "does-not-fit" };
  if (earned && !earned.includes(itemId)) return { ok: false, why: "not-earned" };
  const now = resolvePlaced(shell, placed);
  if (now[spotId]) return { ok: false, why: "taken" };
  if (spotOfItem(shell, placed, itemId, me)) return { ok: false, why: "already-placed" };
  const e = { item: itemId, owner: me, at };
  return { ok: true, patch: { [spotId]: e }, placed: { ...(placed || {}), [spotId]: e }, line: "set down a " + it.name.toLowerCase() };
}

/**
 * Lift an item: it goes back to its owner's satchel, never away (rk-place-is-shared). { ok, patch, placed, back, theirs, line }.
 * `back` is { item, owner }; `theirs` is true when you lifted the other person's, and `line` then says so for their history.
 */
/** @returns {any} */
export function liftFrom(shellOrId, placed, spotId, me) {
  const shell = typeof shellOrId === "string" ? shellOf(shellOrId) : shellOrId;
  const sp = spotOf(shell, spotId);
  if (!sp) return { ok: false, why: "no-spot" };
  if (sp.fixed) return { ok: false, why: "fixed" };
  const e = resolvePlaced(shell, placed)[spotId];
  if (!e) return { ok: false, why: "empty" };
  const theirs = !!e.owner && e.owner !== me, name = ITEMS[e.item].name.toLowerCase();
  const next = { ...(placed || {}) }; next[spotId] = null;
  return { ok: true, patch: { [spotId]: null }, placed: next, back: { item: e.item, owner: e.owner }, theirs,
    line: theirs ? "sent your " + name + " back to your satchel" : "put " + name + " back in the satchel" };
}

/**
 * What play has given you, from events that already exist: { keptAgreement, letGo, satWith, oriented, checkin }, each a boolean.
 *   home     the homeroom's private doc or its summary: { look, lastCheckin, oriented }
 *   rooms    GET /api/between's room summaries: { keptAgreement, person, lastSatTogether }
 *   spirits  the cave spirit store's records (oag.spirits.v1): a spirit met and let go in Big Mind has an id "meet-…"
 */
/** @param {{ home?: any, rooms?: any[], spirits?: any[] }} [from] */
export function earnedEvents({ home = {}, rooms = [], spirits = [] } = {}) {
  const h = home || {}, rs = Array.isArray(rooms) ? rooms : [], ss = Array.isArray(spirits) ? spirits : [];
  return {
    keptAgreement: rs.some(r => r && r.keptAgreement),
    letGo: ss.some(s => s && ((typeof s.id === "string" && s.id.startsWith("meet-")) || (s.born && s.born.where === "Big Mind"))),
    satWith: rs.some(r => r && (r.lastSatTogether != null || !!r.person)),
    oriented: h.oriented != null,
    checkin: h.lastCheckin != null,
  };
}
/** The items those events have earned, in the satchel's order. */
export function earnedItems(ev) {
  const e = ev || {};
  return ITEM_ORDER.filter(id => !!e[ITEMS[id].earnedBy]);
}

/**
 * Sets a room on a scene's handles, as applyStyle sets a style: the style's light and weather, then each spot's item.
 *   handles.spots   { [spotId]: { slot, item, glow } }: `slot` has add(obj) and clear() (a three.js Group does); applyRoom keeps
 *                   `item` (the item id on it now, or null) and `glow` (1 when the item gives light, else 0) up to date
 *   handles.make    (itemId, spot) => an object to hang on the slot (the scene's own models, procedural or glb)
 * Fixed spots and spots the scene has no handle for are left alone. Nothing is made again for a spot whose item has not changed.
 * Returns { style, placed } with `placed` as resolved.
 */
/** @param {any} handles @param {any} room @returns {{ style: any, placed: Record<string, Placed> }} */
export function applyRoom(handles, room) {
  const h = handles || {}, r = room || {};
  const shell = r.shell && typeof r.shell === "object" ? r.shell : shellOf(r.shell);
  const style = "style" in r ? applyStyle(h, r.style || DEFAULT_STYLE) : null;
  const placed = resolvePlaced(shell, r.placed);
  const spots = h.spots || {};
  for (const sp of shell.spots) {
    if (sp.fixed) continue;
    const s = spots[sp.id]; if (!s) continue;
    const want = placed[sp.id] ? placed[sp.id].item : null;
    if ((s.item || null) !== want) {
      if (s.slot && s.slot.clear) s.slot.clear();
      if (want && h.make && s.slot) { const obj = h.make(want, sp); if (obj) s.slot.add(obj); }
      s.item = want;
    }
    s.glow = want && ITEMS[want].glows ? 1 : 0;
  }
  return { style, placed };
}

/* Portability (rk-one-kit): a Cave of Lessons chamber or a Big Mind seat lists spots of its own and uses everything above as it
   is. This one is the check in src/lib/between/__tests__/room-kit.test.ts; a place adds its shell here or passes its own. */
export const PORTABLE = {
  "cave-alcove": {
    id: "cave-alcove", name: "A Cave of Lessons alcove",
    spots: [
      { id: "niche", takes: "small", at: [0.6, 1.1, -1.8] },
      { id: "ledge", takes: "small", at: [-0.8, 0.9, -1.7] },
      { id: "stone", takes: "floor", at: [0, 0, -0.6] },
    ],
    prePlaced: {},
  },
  "bigmind-seat": {
    id: "bigmind-seat", name: "A Big Mind sitting place",
    spots: [
      { id: "bough", takes: "hang", at: [0, 2.6, -1] },
      { id: "mat", takes: "floor", at: [0, 0, 0], fixed: true },
      { id: "beside", takes: "floor", at: [1.1, 0, -0.2] },
    ],
    prePlaced: { mat: "cushion" },
  },
};
