/**
 * The farm's rules (six-faces-council .specify/specs/bars-farm, round 3 look overriding the spec: a 14 x 11 grid of
 * slots, the hoe tills any slot). Pure: every act takes the farm doc, the player's local date and returns a new doc
 * plus what it cost or minted, so a test clock can run the days. The route stores the doc and mints vibeulons.
 */

import { isCrop, type Crop } from './crops'

export const COLS = 14
export const ROWS = 11
export const SLOTS = COLS * ROWS
export const GROW_DAYS = 7
export const WEEDS_AFTER = 3
export const TILL_COST = 5
export const RECLEAR_COST = 1
export const WATER_COST = 1
/** Mana has no store in bars-engine yet (spec evidence_and_unknowns); the farm keeps its own balance, this many on first entry. */
export const STARTING_MANA = 50

export type Note = { on: string; line: string }
/** A mark the game master set on a crop: the gift seen, then the book shipped (A3). `ref` is his own reference, so a mark lands once. */
export type MarkKind = 'gift' | 'ripe' | 'shipped'
export type Mark = { kind: MarkKind; ref: string; on: string }
export type Plant = {
  barId: string; line: string; plantedAt: string; plantedOn: string
  tendedDays: number; lastTendedOn: string | null; untendedSince: string | null
  notes: Note[]; ripe: boolean
  /** The satisfaction crop (family x form). Absent means the generic pod. */
  crop?: Crop
  /** The game master's marks (H-marks): a gift mark when the crop is planted for the player, a shipped mark when the book goes out. */
  marks?: Mark[]
}
export type Slot = { state: 'tilled' | 'planted' | 'weeded'; clearedAt: string; plant: Plant | null }
/** `crop` and `marks` travel with a picked crop (H-harvest-crop), so its family and form survive and a later mark can still land on it. */
export type Harvest = { fromBarId: string; line: string; notes: Note[]; pickedOn: string; vibeulon: 1; quests: string[]; crop?: Crop; marks?: Mark[] }
export type Farm = { firstEntryAt: string | null; mana: number; slots: Record<string, Slot>; harvests: Harvest[] }
export type Result = { farm: Farm; ok: boolean; why?: string; mint: number; harvest?: Harvest }

export const newFarm = (): Farm => ({ firstEntryAt: null, mana: STARTING_MANA, slots: {}, harvests: [] })

const DAY = 86_400_000
const dayNum = (d: string) => Math.floor(Date.parse(d + 'T00:00:00Z') / DAY)
export const daysBetween = (a: string, b: string) => dayNum(b) - dayNum(a)
const okDate = (d: unknown): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d))
const clone = (f: Farm): Farm => JSON.parse(JSON.stringify(f))
const fail = (farm: Farm, why: string): Result => ({ farm, ok: false, why, mint: 0 })
const inGrid = (i: unknown): i is number => Number.isInteger(i) && (i as number) >= 0 && (i as number) < SLOTS
const words = (s: unknown) => (typeof s === 'string' ? s.trim().slice(0, 280) : '')

/** First entry stamps firstEntryAt (the cinematic plays when it was null). */
export function enter(farm: Farm, now: string): Farm {
  if (farm.firstEntryAt) return farm
  return { ...clone(farm), firstEntryAt: now }
}

/** Weeds cover a planted, unripe slot from the third untended day in a row; the seed and its tended days wait under them. */
export function settle(farm: Farm, today: string): Farm {
  if (!okDate(today)) return farm
  let out: Farm | null = null
  for (const [k, s] of Object.entries(farm.slots)) {
    const p = s.plant
    if (s.state !== 'planted' || !p || p.ripe) continue
    const since = p.lastTendedOn ?? p.plantedOn
    if (daysBetween(since, today) >= WEEDS_AFTER) {
      out = out ?? clone(farm)
      out.slots[k].state = 'weeded'
      out.slots[k].plant!.untendedSince = since
    }
  }
  return out ?? farm
}

/** The hoe: tills any slot (bare earth, weeds or soil). First till costs 5 mana; a tilled slot stays tilled. */
export function till(farm: Farm, i: number, now: string): Result {
  if (!inGrid(i)) return fail(farm, 'That slot is off the field')
  const k = String(i)
  if (farm.slots[k]) return fail(farm, 'Already soil')
  if (farm.mana < TILL_COST) return fail(farm, 'Not enough mana to till')
  const f = clone(farm)
  f.mana -= TILL_COST
  f.slots[k] = { state: 'tilled', clearedAt: now, plant: null }
  return { farm: f, ok: true, mint: 0 }
}

/** Plant one BAR with one line (one word is enough) in tilled soil. */
export function plant(farm: Farm, i: number, barId: string, line: string, now: string, today: string, crop?: unknown): Result {
  const s = inGrid(i) ? farm.slots[String(i)] : undefined
  if (!s || s.state !== 'tilled') return fail(farm, 'Till the slot first')
  const l = words(line)
  if (!barId || !l) return fail(farm, 'A BAR and one line')
  if (!okDate(today)) return fail(farm, 'No date')
  if (Object.values(farm.slots).some(x => x.plant?.barId === barId)) return fail(farm, 'That BAR is already planted')
  const f = clone(farm)
  f.slots[String(i)] = { ...s, state: 'planted', plant: { barId, line: l, plantedAt: now, plantedOn: today, tendedDays: 0, lastTendedOn: null, untendedSince: null, notes: [], ripe: false, ...(isCrop(crop) ? { crop: { family: crop.family, form: crop.form } } : {}) } }
  return { farm: f, ok: true, mint: 0 }
}

/** Water once per local day with 1 mana or an aligned action (which mints one vibeulon). Seven tended days bring it to full. */
export function water(farm: Farm, i: number, how: 'mana' | { aligned: string }, today: string): Result {
  const s0 = inGrid(i) ? farm.slots[String(i)] : undefined
  if (!s0?.plant) return fail(farm, 'Nothing planted there')
  if (s0.state === 'weeded') return fail(farm, 'Clear the weeds first')
  if (s0.plant.ripe) return fail(farm, 'Already full')
  if (s0.plant.lastTendedOn === today) return fail(farm, 'Watered today')
  const aligned = how !== 'mana' && typeof how === 'object' && typeof how.aligned === 'string' && how.aligned.length > 0
  if (!aligned && how !== 'mana') return fail(farm, 'Water with mana or an aligned action')
  if (!aligned && farm.mana < WATER_COST) return fail(farm, 'Not enough mana')
  const f = clone(farm)
  if (!aligned) f.mana -= WATER_COST
  tend(f.slots[String(i)].plant!, today)
  return { farm: f, ok: true, mint: aligned ? 1 : 0 }
}

function tend(p: Plant, today: string) {
  p.tendedDays = Math.min(GROW_DAYS, p.tendedDays + 1)
  p.lastTendedOn = today
  p.untendedSince = null
  if (p.tendedDays >= GROW_DAYS) p.ripe = true
}

/** The planted BAR's task is done: kneel, say one line about what you did, and the plant ripens at once. */
export function ripen(farm: Farm, i: number, line: string, today: string): Result {
  const s0 = inGrid(i) ? farm.slots[String(i)] : undefined
  const l = words(line)
  if (!s0?.plant || s0.state !== 'planted') return fail(farm, 'Nothing growing there')
  if (s0.plant.ripe) return fail(farm, 'Already full')
  if (!l) return fail(farm, 'One line about what you did')
  const f = clone(farm)
  const p = f.slots[String(i)].plant!
  p.notes.push({ on: today, line: l })
  p.tendedDays = GROW_DAYS
  p.ripe = true
  p.lastTendedOn = today
  return { farm: f, ok: true, mint: 0 }
}

/** Re-clear weeds: 1 mana and one line about what kept you away; the line is a note, waters the plant, mints a vibeulon. */
export function reclear(farm: Farm, i: number, line: string, today: string): Result {
  const s0 = inGrid(i) ? farm.slots[String(i)] : undefined
  const l = words(line)
  if (!s0?.plant || s0.state !== 'weeded') return fail(farm, 'No weeds there')
  if (!l) return fail(farm, 'One line about what kept you away')
  if (farm.mana < RECLEAR_COST) return fail(farm, 'Not enough mana')
  const f = clone(farm)
  f.mana -= RECLEAR_COST
  const s = f.slots[String(i)]
  s.state = 'planted'
  s.plant!.notes.push({ on: today, line: l })
  tend(s.plant!, today)
  return { farm: f, ok: true, mint: 1 }
}

/** Pick a full plant: a harvest carrying the seed's id, lines and notes, and one vibeulon. The slot stays soil. */
export function pick(farm: Farm, i: number, today: string): Result {
  const s0 = inGrid(i) ? farm.slots[String(i)] : undefined
  if (!s0?.plant?.ripe) return fail(farm, 'Not full yet')
  const f = clone(farm)
  const p = s0.plant
  const harvest: Harvest = { fromBarId: p.barId, line: p.line, notes: p.notes, pickedOn: today, vibeulon: 1, quests: [], ...(p.crop ? { crop: p.crop } : {}), ...(p.marks?.length ? { marks: p.marks } : {}) }
  f.slots[String(i)] = { ...f.slots[String(i)], state: 'tilled', plant: null }
  f.harvests.push(harvest)
  return { farm: f, ok: true, mint: 1, harvest }
}

const isRefStr = (r: unknown): r is string => typeof r === 'string' && r.length > 0 && r.length <= 120

/** The game master's gift mark planted a crop for this ref already. */
const hasMark = (farm: Farm, kind: MarkKind, ref: string) =>
  Object.values(farm.slots).some(s => s.plant?.marks?.some(m => m.kind === kind && m.ref === ref)) ||
  farm.harvests.some(h => h.marks?.some(m => m.kind === kind && m.ref === ref))

/**
 * The game master's mark plants a crop for a player who sent a gift (H-till-mana, H-marks). The mark tills the first
 * bare slot at no mana cost, since the player did not choose to spend it, plants the crop with the gift mark on it, and
 * leaves the player's mana as it was. Marking the same ref again changes nothing and still answers ok.
 */
export function plantByMark(farm: Farm, a: { ref: string; barId: string; line: string; crop?: unknown; now: string; today: string }): Result & { slot?: number } {
  if (!isRefStr(a.ref)) return fail(farm, 'A reference')
  const l = words(a.line)
  if (!a.barId || !l) return fail(farm, 'A BAR and one line')
  if (!okDate(a.today)) return fail(farm, 'No date')
  if (hasMark(farm, 'gift', a.ref)) return { farm, ok: true, mint: 0 }
  if (Object.values(farm.slots).some(x => x.plant?.barId === a.barId)) return fail(farm, 'That BAR is already planted')
  let slot = -1
  for (let i = 0; i < SLOTS; i++) if (!farm.slots[String(i)]) { slot = i; break }
  if (slot < 0) return fail(farm, 'No bare slot on the farm')
  const f = clone(farm)
  const crop = isCrop(a.crop) ? { crop: { family: a.crop.family, form: a.crop.form } } : {}
  f.slots[String(slot)] = {
    state: 'planted', clearedAt: a.now,
    plant: { barId: a.barId, line: l, plantedAt: a.now, plantedOn: a.today, tendedDays: 0, lastTendedOn: null, untendedSince: null, notes: [], ripe: false, ...crop, marks: [{ kind: 'gift', ref: a.ref, on: a.today }] },
  }
  return { farm: f, ok: true, mint: 0, slot }
}

/**
 * The shipped mark: the book went out, and the same crop gets its second mark (A3). `barId` names the crop; the same ref
 * twice changes nothing. A crop already picked is gone from the bed, so that is refused for the picker to handle.
 */
export function markShipped(farm: Farm, a: { barId: string; ref: string; today: string }): Result {
  if (!isRefStr(a.ref)) return fail(farm, 'A reference')
  if (!okDate(a.today)) return fail(farm, 'No date')
  if (hasMark(farm, 'shipped', a.ref)) return { farm, ok: true, mint: 0 }
  const mark: Mark = { kind: 'shipped', ref: a.ref, on: a.today }
  const k = Object.keys(farm.slots).find(key => farm.slots[key].plant?.barId === a.barId)
  if (k) {
    const f = clone(farm)
    const p = f.slots[k].plant!
    p.marks = [...(p.marks ?? []), mark]
    return { farm: f, ok: true, mint: 0 }
  }
  /* The crop was picked already (H-harvest-crop): its harvest keeps the marks, so the second mark lands there. */
  const h = farm.harvests.findIndex(x => x.fromBarId === a.barId)
  if (h < 0) return fail(farm, 'No crop with that BAR')
  const f = clone(farm)
  f.harvests[h].marks = [...(f.harvests[h].marks ?? []), mark]
  return { farm: f, ok: true, mint: 0 }
}

/**
 * The game master's mark ripens the crop (H-ripen-by-mark). The player says nothing: his mark is the sign that the gift
 * is real, so the crop is full at once, with a note naming it and a ripe mark on it. The same ref twice changes nothing;
 * a crop that is already full takes the mark and stays as it was.
 */
export function ripenByMark(farm: Farm, a: { barId: string; ref: string; today: string }): Result {
  if (!isRefStr(a.ref)) return fail(farm, 'A reference')
  if (!okDate(a.today)) return fail(farm, 'No date')
  if (hasMark(farm, 'ripe', a.ref)) return { farm, ok: true, mint: 0 }
  const k = Object.keys(farm.slots).find(key => farm.slots[key].plant?.barId === a.barId)
  if (!k) return fail(farm, 'No crop with that BAR')
  const f = clone(farm)
  const p = f.slots[k].plant!
  if (f.slots[k].state === 'weeded') f.slots[k].state = 'planted'
  if (!p.ripe) {
    p.notes.push({ on: a.today, line: 'Marked by the game master' })
    p.tendedDays = GROW_DAYS
    p.ripe = true
    p.lastTendedOn = a.today
    p.untendedSince = null
  }
  p.marks = [...(p.marks ?? []), { kind: 'ripe', ref: a.ref, on: a.today }]
  return { farm: f, ok: true, mint: 0 }
}
