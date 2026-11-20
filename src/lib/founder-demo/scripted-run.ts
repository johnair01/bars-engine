/**
 * Founder support demo: the scripted run (council handoff scripted-run-handoff.md, Wendell 2026-11-18 "Build it now").
 * His success test: "NPCs as player agents can take each step". This runs the whole chain with no screen, no model and no
 * network, and its product is the HOLE LIST: every place the chain has nothing to read or nowhere to write.
 *
 * Real pieces are called (crops.ts, farm.ts, the seed packet, SEEDS, courierLine). Everything with no real piece is a
 * named STAND-IN behind a small interface, and every use of one records a `HOLE:`. A step with nothing to read or nowhere
 * to write throws `MissingPiece` and the run stops: nothing is stubbed quiet and no schema is invented.
 * Two ledgers stay apart: the player's farm (their word writes it) and the shared count (only the game master's mark).
 */
import { CROP_FAMILY, cropName, bedLabel, type Crop } from '@/lib/between/crops'
import { newFarm, till, plant, ripen, pick, SLOTS, type Farm } from '@/lib/between/farm'
import { EMPTY_PACKET, cropOf, seedOf, type Packet } from '@/lib/founder-gate/seed-packet'
import { parsePacket, isPlayerId } from '@/lib/founder-gate/packet-record'
import { makeWord, findWord } from '@/lib/founder-gate/payment-word'
import { SEEDS, courierLine, type Seed } from '@/lib/founder-gate/content'
import { CHANNELS } from '@/lib/between/crops'
import type { Channel } from '@/lib/coaching/unpacking-walk'

/** The $11 book, in cents. A stand-in amount: no real money moves. */
export const BOOK_CENTS = 1100
export const BOOK_GOAL = 300

export class MissingPiece extends Error {
  constructor(public step: number, what: string) {
    super(`step ${step}: nothing to read or nowhere to write: ${what}`)
  }
}

/* ───── The three places and the kinds of help ───── */

export type PlaceKind = 'introduce' | 'show' | 'work'
export const PLACES: ReadonlyArray<{ kind: PlaceKind; domain: Seed['domain']; label: string }> = [
  { kind: 'introduce', domain: 'Skillful Organizing', label: 'introduce him to one person' },
  { kind: 'show', domain: 'Raise Awareness', label: 'show the walk or the book to one person' },
  { kind: 'work', domain: 'Direct Action', label: 'work with him' },
]
export type QuestState = 'none' | 'offered' | 'held' | 'met'

/* ───── Stand-ins, each swappable by a real run ───── */

/** STAND-IN: the money. A real run reads a Venmo note; Venmo and Cash App send no signal to the game (H22). */
export interface Money { send(word: string, cents: number): Payment }
export type Payment = { word: string; cents: number }
/** STAND-IN: the payment word maker and its register (A5). The word's makeup is not ruled. */
export interface PaymentWords { issue(playerId: string): string; owner(word: string): string | undefined }
/** STAND-IN: where each player's farm record lives. The farm doc is real; its per-player store is not. */
export interface FarmStore { get(playerId: string): Farm | undefined; put(playerId: string, farm: Farm): void }
/** STAND-IN: the Diplomat Elder's offer and the quest's state. No line a player reads is written here. */
export interface QuestBook { get(playerId: string): QuestState; set(playerId: string, s: QuestState): void }
/** STAND-IN: the common pot the harvest goes into. */
export interface Pot { add(playerId: string, line: string): void; readonly items: ReadonlyArray<{ playerId: string; line: string }> }
/** STAND-IN: marks on a crop (the gift's mark, then the shipped mark). farm.Plant has no marks field. */
export interface MarkBook { add(playerId: string, barId: string, mark: 'seen' | 'shipped'): void; get(playerId: string, barId: string): string[] }
/** The shared ledger: books shipped. Only the game master's mark writes it; the type forbids any other writer. */
export interface SharedCount { readonly shipped: number; markShipped(by: 'game-master'): void }

export type Holes = Map<string, { step: number; what: string; real: string }>
export type Line = { step: number; did: string; read: string[]; wrote: string[] }
export type Seeds = Array<{ kind: PlaceKind; seedDomain: string; who: string; day: string; act: string }>

export interface World {
  money: Money
  words: PaymentWords
  farms: FarmStore
  quests: QuestBook
  pot: Pot
  marks: MarkBook
  shared: SharedCount
}

/** The default stand-ins. Everything lives in memory and nothing is persisted. */
export function standIns(): World {
  const words = new Map<string, string>()
  const farms = new Map<string, Farm>()
  const quests = new Map<string, QuestState>()
  const items: Array<{ playerId: string; line: string }> = []
  const marks = new Map<string, string[]>()
  let shipped = 0
  const byPlayer = new Map<string, string>()
  let seq = 0.37
  return {
    money: { send: (word, cents) => ({ word, cents }) },
    words: {
      // Mirrors payment-word-server.ts issueWord: one word per player, never a word twice.
      issue: (playerId) => {
        const have = byPlayer.get(playerId)
        if (have) return have
        let w = makeWord(() => ((seq = (seq * 9.7 + 0.211) % 1), seq))
        while (words.has(w)) w = makeWord(() => ((seq = (seq * 9.7 + 0.211) % 1), seq))
        words.set(w, playerId); byPlayer.set(playerId, w); return w
      },
      owner: (w) => words.get(w),
    },
    farms: { get: (id) => farms.get(id), put: (id, f) => void farms.set(id, f) },
    quests: { get: (id) => quests.get(id) ?? 'none', set: (id, s) => void quests.set(id, s) },
    pot: { add: (playerId, line) => void items.push({ playerId, line }), items },
    marks: { add: (p, b, m) => void marks.set(`${p}/${b}`, [...(marks.get(`${p}/${b}`) ?? []), m]), get: (p, b) => marks.get(`${p}/${b}`) ?? [] },
    shared: { get shipped() { return shipped }, markShipped: () => void (shipped += 1) },
  }
}

/* ───── The run ───── */

export type Choice = { feeling?: Channel; place: PlaceKind | 'none' | 'leave-at-second' }
export type RunResult = {
  name: string
  lines: Line[]
  holes: Array<{ id: string; step: number; what: string; real: string }>
  state: { quest: QuestState; shared: number; sharedLine: string | null; farm: Farm; potItems: number; seeds: Seeds; prompts: string[]; marks: string[] }
  failed?: string
}

/** mulberry32: the same seed gives the same run. */
function rng(seed: number) {
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

export function runChain(name: string, seed: number, choice: Choice, world: World = standIns()): RunResult {
  const rand = rng(seed)
  const lines: Line[] = []
  const holes: Holes = new Map()
  const hole = (id: string, step: number, what: string, real: string) => { if (!holes.has(id)) holes.set(id, { step, what, real }) }
  const log = (step: number, did: string, read: string[], wrote: string[]) => lines.push({ step, did, read, wrote })
  const playerId = `npc-${seed}`
  const seeds: Seeds = []
  const prompts: string[] = []
  const today = '2026-11-19'
  const out = (failed?: string): RunResult => {
    const farm = world.farms.get(playerId) ?? newFarm()
    return {
      name, lines, holes: [...holes].map(([id, h]) => ({ id, ...h })), failed,
      state: { quest: world.quests.get(playerId), shared: world.shared.shipped, sharedLine: courierLine(world.shared.shipped, BOOK_GOAL), farm, potItems: world.pot.items.length, seeds, prompts, marks: world.marks.get(playerId, `gift-${playerId}`) },
    }
  }
  try {
    /* 1. The feeling, from the seed packet presets. The crop comes from the packet's own cropOf. */
    const feeling = choice.feeling ?? CHANNELS[Math.floor(rand() * CHANNELS.length)]
    const packet: Packet = { ...EMPTY_PACKET, seed: 'Gather Resource', family: feeling }
    const crop = cropOf(packet)
    if (!crop) throw new MissingPiece(1, 'cropOf returned no crop for a Gather Resource packet')
    const grain = seedOf(packet)
    if (!grain) throw new MissingPiece(1, 'no SEEDS entry for Gather Resource')
    log(1, `picked ${CROP_FAMILY[feeling].state}`, ['seed-packet presets (EMPTY_PACKET, cropOf, SEEDS)'], [`packet {seed: Gather Resource, family: ${feeling}}`])
    /* H-packet-store is closed: packet-server.ts keeps one packet per player id. The run checks the same gate the store
       uses (isPlayerId, parsePacket) and keeps the result in memory, since the run has no database. */
    const kept = isPlayerId(playerId) ? parsePacket(JSON.stringify(packet)) : null
    if (!kept) throw new MissingPiece(1, 'the packet record refused this packet or player id')
    log(1, 'kept the packet under the player id', ['packet-record.ts (isPlayerId, parsePacket)'], [`founder_packets[${playerId}] (stand-in: memory; real: packet-server.ts putPacket)`])

    /* 2. The payment word and the stand-in $11. */
    const word = world.words.issue(playerId)
    log(2, `payment word issued: ${word}`, ['payment-word.ts makeWord'], [`founder_payment_words[${word}] (stand-in: memory; real: payment-word-server.ts issueWord)`])
    /* H-payment-word is closed: payment-word-server.ts holds the register. The makeup of the word is still Wendell's to rule. */
    const payment = world.money.send(word, BOOK_CENTS)
    log(2, `stand-in $${payment.cents / 100} sent carrying "${word}"`, [], ['Money (stand-in)'])
    hole('H-money', 2, 'The game cannot see a Venmo or Cash App payment (no signal, no webhook); the $11 is a stand-in', 'none')

    /* 3. The stand-in game master marks the payment by its word (A4). */
    const noteWord = findWord(`for the book ${payment.word.toUpperCase()}`)
    if (noteWord !== payment.word) throw new MissingPiece(3, `findWord could not read "${payment.word}" out of a payment note`)
    const owner = world.words.owner(noteWord)
    if (!owner) throw new MissingPiece(3, `no player owns the word "${payment.word}"`)
    log(3, `game master marked the payment: word "${payment.word}" belongs to ${owner}`, ['word register (stand-in)'], [])
    hole('H-gm-mark', 3, 'No game master surface: no place he sees an unmarked payment and marks it by its word', 'none')

    /* 4. A crop of the player's family, in the grain form, on that player's farm (real farm.ts). */
    const farm0 = world.farms.get(owner) ?? newFarm()
    if (!world.farms.get(owner)) hole('H-farm-store', 4, 'No server-side store of one player\'s farm that a game master mark can write; the Farm doc is pure', 'src/lib/between/store.ts keeps the shared garden only')
    const t = till(farm0, 0, 'run')
    if (!t.ok) throw new MissingPiece(4, `farm.till refused: ${t.why}`)
    hole('H-till-mana', 4, 'farm.till spends the PLAYER\'s mana, so a mark that plants for them costs them 5 mana with no say', 'src/lib/between/farm.ts till')
    const barId = `gift-${owner}`
    const p = plant(t.farm, 0, barId, word, 'run', today, crop)
    if (!p.ok) throw new MissingPiece(4, `farm.plant refused: ${p.why}`)
    let farm = p.farm
    world.farms.put(owner, farm)
    world.marks.add(owner, barId, 'seen')
    hole('H-marks', 4, 'A crop has no marks field: the gift mark and the later shipped mark (A3) have nowhere to sit on the Plant', 'none (marks are a stand-in book)')
    const planted = farm.slots['0'].plant
    if (!planted?.crop) throw new MissingPiece(4, 'the planted crop did not carry its family and form')
    log(4, `crop on ${owner}'s farm: ${cropName(planted.crop as Crop)} in the ${bedLabel(planted.crop as Crop)}`, ['crops.ts CROP_FAMILY, CROP_FORM', 'farm.plant'], [`farm slot 0 (crop ${planted.crop.family}/${planted.crop.form})`, 'MarkBook seen (stand-in)'])

    /* 5. The Diplomat Elder offers the first quest. Quest state: none, offered, held, met. */
    if (world.quests.get(owner) !== 'none') throw new MissingPiece(5, 'quest state was not none before the offer')
    world.quests.set(owner, 'offered')
    log(5, 'the Diplomat Elder offers "the first harvest" (state offered)', ['QuestBook (stand-in)'], ['QuestBook offered (stand-in)'])
    hole('H-quest-state', 5, 'No record of a quest\'s state (none, offered, held, met) and no Diplomat Elder line that offers it', 'none (spec draft: pass founder-first-quest-1_2026-11-18, not in git)')
    const ripened = ripen(farm, 0, `marked: ${word}`, today)
    if (!ripened.ok) throw new MissingPiece(5, `farm.ripen refused: ${ripened.why}`)
    farm = ripened.farm
    world.farms.put(owner, farm)
    hole('H-ripen-by-mark', 5, 'farm.ripen takes the PLAYER\'s line about what they did; "his mark ripens the crop" has no route of its own', 'src/lib/between/farm.ts ripen')
    world.quests.set(owner, 'held')
    log(5, 'the player takes the basket (state held); the crop is full', ['QuestBook'], ['QuestBook held', 'farm slot 0 ripe'])

    /* 6. The harvest goes past three places. */
    const hv = pick(farm, 0, today)
    if (!hv.ok || !hv.harvest) throw new MissingPiece(6, `farm.pick refused: ${hv.why}`)
    farm = hv.farm
    world.farms.put(owner, farm)
    hole('H-harvest-crop', 6, 'farm.pick returns a Harvest with no crop: the family and form are lost, and the slot goes back to soil, so the first crop cannot carry its second mark', 'src/lib/between/farm.ts pick, Harvest type')
    hole('H-places', 6, 'The three places (introduce, show, work) have no content a player can reach, and no picture', 'SEEDS[].back and .nextStep name the acts; nothing places them on the path')
    const visits = choice.place === 'leave-at-second' ? PLACES.slice(0, 2) : choice.place === 'none' ? PLACES : PLACES
    let taken: (typeof PLACES)[number] | null = null
    let left = false
    for (const [i, pl] of visits.entries()) {
      log(6, `carried the harvest past place ${i + 1}: ${pl.label}`, [`SEEDS ${pl.domain}`], [])
      if (choice.place === pl.kind) { taken = pl; break }
      if (choice.place === 'leave-at-second' && i === 1) { left = true; break }
    }

    /* 7. Taking a place writes who and which day and hands the kind's seed; taking none writes nothing. */
    if (taken) {
      const s = SEEDS.find((x) => x.domain === taken!.domain)
      if (!s) throw new MissingPiece(7, `no SEEDS entry for ${taken.domain}`)
      seeds.push({ kind: taken.kind, seedDomain: s.domain, who: `scripted-person-${seed}`, day: '2026-11-21', act: s.act })
      log(7, `took "${taken.label}": wrote who and day, received the ${s.title} seed`, ['SEEDS'], ['seed list (stand-in)'])
      hole('H-act-record', 7, 'Nowhere to write "who and which day" for a taken place: the gate-acts build (CampaignLead.actionsJson) is a plan on a draft, not code, and it stores no person\'s name', 'handoff gate-acts/build-handoff.md (not built)')
    } else if (left) {
      log(7, 'left at the second place and never returned; nothing written', [], [])
    } else {
      log(7, 'took none; nothing written', [], [])
    }
    if (!left) {
      world.pot.add(owner, hv.harvest.line)
      world.quests.set(owner, 'met')
      log(7, 'the harvest went to the common pot; quest met; no step asked for money', [], ['Pot (stand-in)', 'QuestBook met'])
      hole('H-pot', 7, 'The common pot has no store and no picture; the shelf of jars beside it is the shared count and is not drawn', 'none')
    }

    /* 8. Planting the seed is the move: the player's own word grows a second crop on their own farm only. */
    const before = world.shared.shipped
    if (taken) {
      const form = taken.domain
      const second: Crop = { family: feeling, form }
      const slot = Object.keys(farm.slots).length
      if (slot >= SLOTS) throw new MissingPiece(8, 'no free slot on the farm')
      const t2 = till(farm, slot, 'run')
      if (!t2.ok) throw new MissingPiece(8, `farm.till refused: ${t2.why}`)
      const p2 = plant(t2.farm, slot, `act-${taken.kind}-${owner}`, 'did the act', 'run', today, second)
      if (!p2.ok) throw new MissingPiece(8, `farm.plant refused: ${p2.why}`)
      farm = p2.farm
      world.farms.put(owner, farm)
      log(8, `the player said it did the act; a second crop (${cropName(second)}, ${bedLabel(second)}) grows on its own farm`, ['farm.till', 'farm.plant'], [`farm slot ${slot}`])
      hole('H-say-it', 8, 'No interface where the player says "I did the act" and the line becomes a plant: the card back only seals', 'none')
    } else {
      log(8, 'no seed, so no second crop and no later prompt', [], [])
    }
    log(8, `shared count read before and after: ${before} and ${world.shared.shipped} (the player's word never writes it)`, ['SharedCount'], [])
    if (world.shared.shipped !== before) throw new MissingPiece(8, 'the shared count moved on a player\'s word')

    /* 9. The game master marks the book shipped: the shared count reads 1 of 300 and the first crop gains its second mark. */
    world.shared.markShipped('game-master')
    world.marks.add(owner, barId, 'shipped')
    log(9, `game master marked the book shipped: ${courierLine(world.shared.shipped, BOOK_GOAL)}`, ['courierLine (real)'], ['SharedCount (stand-in)', 'MarkBook shipped (stand-in)'])
    hole('H-shared-store', 9, 'The shared count has a real home (AppConfig.theme, setShippedCount) but it is server-only and written by an admin form, so the run cannot call it', 'src/lib/founder-gate/courier-server.ts')
    hole('H-ship-notice', 9, 'Nothing tells a player who gave and left that their book shipped (Q10 is open)', 'none')
    return out()
  } catch (e) {
    if (e instanceof MissingPiece) { log(e.step, `FAILED LOUDLY: ${e.message}`, [], []); return out(e.message) }
    throw e
  }
}

/** The text a run prints: each step, what it read and wrote, then the holes. */
export function render(r: RunResult): string {
  const rows = [`RUN ${r.name}`, '']
  for (const l of r.lines) rows.push(`step ${l.step}: ${l.did}`, `   read:  ${l.read.join('; ') || '(nothing)'}`, `   wrote: ${l.wrote.join('; ') || '(nothing)'}`)
  rows.push('')
  for (const h of r.holes) rows.push(`HOLE: [${h.id}] (step ${h.step}) ${h.what}. Real piece: ${h.real}`)
  rows.push('', `END quest=${r.state.quest} shared=${r.state.shared} (${r.state.sharedLine ?? 'hidden'}) seeds=${r.state.seeds.length} pot=${r.state.potItems} prompts=${r.state.prompts.length} marks=[${r.state.marks.join(',')}]${r.failed ? ` FAILED: ${r.failed}` : ''}`)
  return rows.join('\n') + '\n'
}

export const RUNS: ReadonlyArray<{ name: string; seed: number; choice: Choice }> = [
  { name: 'A (takes one place: show the walk or the book)', seed: 11, choice: { feeling: 'joy', place: 'show' } },
  { name: 'B (takes none)', seed: 12, choice: { feeling: 'sadness', place: 'none' } },
  { name: 'C (leaves at the second place)', seed: 13, choice: { feeling: 'anger', place: 'leave-at-second' } },
]
