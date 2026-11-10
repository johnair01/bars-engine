/**
 * The farm's rules (six-faces-council .specify/specs/bars-farm, round 3 look overriding the spec: a 14 x 11 grid of
 * slots, the hoe tills any slot). Pure: every act takes the farm doc, the player's local date and returns a new doc
 * plus what it cost or minted, so a test clock can run the days. The route stores the doc and mints vibeulons.
 */

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
export type Plant = {
  barId: string; line: string; plantedAt: string; plantedOn: string
  tendedDays: number; lastTendedOn: string | null; untendedSince: string | null
  notes: Note[]; ripe: boolean
}
export type Slot = { state: 'tilled' | 'planted' | 'weeded'; clearedAt: string; plant: Plant | null }
export type Harvest = { fromBarId: string; line: string; notes: Note[]; pickedOn: string; vibeulon: 1; quests: string[] }
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

/** The hoe: tills any slot (grass, weeds or soil). First till costs 5 mana; a tilled slot stays tilled. */
export function till(farm: Farm, i: number, now: string): Result {
  if (!inGrid(i)) return fail(farm, 'That slot is off the grass')
  const k = String(i)
  if (farm.slots[k]) return fail(farm, 'Already soil')
  if (farm.mana < TILL_COST) return fail(farm, 'Not enough mana to till')
  const f = clone(farm)
  f.mana -= TILL_COST
  f.slots[k] = { state: 'tilled', clearedAt: now, plant: null }
  return { farm: f, ok: true, mint: 0 }
}

/** Plant one BAR with one line (one word is enough) in tilled soil. */
export function plant(farm: Farm, i: number, barId: string, line: string, now: string, today: string): Result {
  const s = inGrid(i) ? farm.slots[String(i)] : undefined
  if (!s || s.state !== 'tilled') return fail(farm, 'Till the slot first')
  const l = words(line)
  if (!barId || !l) return fail(farm, 'A BAR and one line')
  if (!okDate(today)) return fail(farm, 'No date')
  if (Object.values(farm.slots).some(x => x.plant?.barId === barId)) return fail(farm, 'That BAR is already planted')
  const f = clone(farm)
  f.slots[String(i)] = { ...s, state: 'planted', plant: { barId, line: l, plantedAt: now, plantedOn: today, tendedDays: 0, lastTendedOn: null, untendedSince: null, notes: [], ripe: false } }
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
  const harvest: Harvest = { fromBarId: p.barId, line: p.line, notes: p.notes, pickedOn: today, vibeulon: 1, quests: [] }
  f.slots[String(i)] = { ...f.slots[String(i)], state: 'tilled', plant: null }
  f.harvests.push(harvest)
  return { farm: f, ok: true, mint: 1, harvest }
}
