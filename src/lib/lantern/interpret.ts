/**
 * The lantern table reads the six Unpacking Questions (bars-engine #548; six-faces-council
 * council/callsheets/lantern-hall.md, "the table compiles the six questions"). The player answers each question in their
 * own words, and `interpret` turns the words into the pieces the brass machine sets: q1 the goal and its kind of work,
 * q2 the well's ring (want), q3 the lantern's flame (life state), q4 the lever and its weight (now, with intensity),
 * q5 the toggles (truth), q6 the reservation stones and their collars (res and tags).
 *
 * Pure: no DOM, no language model, so the table plays the same with or without AI. The words come from the quest
 * grammar's own lists (src/lib/quest-grammar/lexicon.ts) and the engine's feeling names. The scene loads this module as
 * public/lantern/table/interpret.js, built by scripts/build-lantern-engine.mjs.
 */
import { CHANNELS, CHANNEL_NAME, KEEPS, STATE, type Channel, type Intake, type TagStrength } from './engine'
import {
  CHANNEL_KEYWORDS, DISSATISFIED_KEYWORDS, KEYWORD_CHANNEL, SATISFIED_KEYWORDS, SHADOW_VOICE_PATTERNS,
} from '../quest-grammar/lexicon'
import { EXPERIENCE_OPTIONS, LIFE_STATE_OPTIONS, UNPACKING_QUESTIONS } from '../quest-grammar/unpacking-constants'
import type { EmotionalChannel } from '../quest-grammar/types'

export type Question = 1 | 2 | 3 | 4 | 5 | 6
export type Experience = (typeof EXPERIENCE_OPTIONS)[number]
export type LifeState = (typeof LIFE_STATE_OPTIONS)[number]

/** The six questions as the plate engraves them: the quest grammar's own wording. */
export const QUESTIONS: readonly string[] = UNPACKING_QUESTIONS.map(u => u.label)

/** The quest grammar's channels on the lantern's five. */
export const FROM_GRAMMAR: Record<EmotionalChannel, Channel> = { Anger: 'fire', Joy: 'wood', Sadness: 'water', Fear: 'metal', Neutrality: 'earth' }

/** What one answer sets. Only the pieces it names are present. */
export interface Reading {
  q: Question
  goal?: string
  kind?: Experience
  want?: Channel[]
  life?: LifeState
  now?: { ch: Channel; n: 1 | 2 | 3 }
  truth?: Channel[]
  truthCtx?: Partial<Record<Channel, string>>
  /** q6: the keeps the sentence names, each with the channels of its clause and their strength */
  keeps?: { i: number; tags: Partial<Record<Channel, TagStrength>> }[]
  /** the words it matched, in the order they appear */
  heard: string[]
  /** one sentence the table says */
  line: string
}

/* ---------- words ---------- */

/** The satisfied states of q2, by the channels the quest grammar gives them (unpacking-constants SATISFACTION_OPTIONS). */
const SATISFIED_CHANNEL: Record<string, Channel> = {
  delighted: 'wood', energized: 'wood', free: 'wood', alive: 'wood',
  triumphant: 'fire', proud: 'fire', strong: 'fire',
  peaceful: 'earth', fulfilled: 'earth', settled: 'earth', whole: 'earth', content: 'earth',
  excited: 'metal', relieved: 'metal', brave: 'metal', safe: 'metal',
  poignant: 'water', blissful: 'water', moved: 'water', grateful: 'water',
}
/** The dissatisfied states of q4 the shared lists leave without a channel (unpacking-constants DISSATISFACTION_OPTIONS). */
const DISSATISFIED_CHANNEL: Record<string, Channel> = {
  overwhelmed: 'metal', isolated: 'water', alone: 'water', bored: 'earth',
}
/** The engine's own feeling names (STATE): Frustration, Anger, Triumph, and so on. */
const STATE_CHANNEL: Record<string, Channel> = Object.fromEntries(CHANNELS.flatMap(c => STATE[c].map(w => [w.toLowerCase(), c])))

/** Every channel word, the quest grammar's lists first. */
const GENERAL: [string, Channel][] = [
  ...Object.entries(CHANNEL_KEYWORDS).flatMap(([g, ws]) => ws.map(w => [w, FROM_GRAMMAR[g as EmotionalChannel]] as [string, Channel])),
  ...Object.entries(KEYWORD_CHANNEL).map(([w, g]) => [w, FROM_GRAMMAR[g]] as [string, Channel]),
  ...Object.entries(STATE_CHANNEL),
]
const lexicon = (...lists: [string, Channel][][]) => {
  const m = new Map<string, Channel>()
  for (const l of lists) for (const [w, c] of l) if (!m.has(w)) m.set(w, c)
  return m
}
const WANT_WORDS = lexicon(Object.entries(SATISFIED_CHANNEL), CHANNELS.map(c => [STATE[c][2].toLowerCase(), c]), GENERAL)
const NOW_WORDS = lexicon(GENERAL, Object.entries(DISSATISFIED_CHANNEL))
/** q5: the reel's one truth per channel (src/lib/lantern/intake.ts TRUTH), as the words that say it. */
const TRUTH_WORDS = lexicon([
  ['obstacle', 'fire'], ['in the way', 'fire'], ['overcome', 'fire'], ['unfair', 'fire'], ['wall', 'fire'],
  ['missing', 'wood'], ['lack', 'wood'], ['without', 'wood'], ['want', 'wood'], ['need', 'wood'],
  ['lost', 'water'], ['gone', 'water'], ['mattered', 'water'], ['ended', 'water'],
  ['threat', 'metal'], ['danger', 'metal'], ['risk', 'metal'], ['escape', 'metal'], ['judged', 'metal'], ['rejected', 'metal'],
  ['boring', 'earth'], ['not engaging', 'earth'], ['pointless', 'earth'], ['same old', 'earth'],
], GENERAL)

/** q1: the kind of work a goal names (EXPERIENCE_OPTIONS). */
const KIND_WORDS: [Experience, string[]][] = [
  ['Direct Action', ['send', 'submit', 'apply', 'application', 'ask', 'call', 'pitch', 'meet', 'start', 'launch', 'finish', 'do', 'act', 'make']],
  ['Gather Resource', ['money', 'fund', 'funding', 'grant', 'donate', 'donation', 'donor', 'raise', 'gather', 'collect', 'resource', 'budget', 'income', 'hire', 'recruit']],
  ['Skillful Organizing', ['organize', 'plan', 'schedule', 'coordinate', 'arrange', 'system', 'set up', 'sort', 'clean', 'build', 'prepare', 'team']],
  ['Raise Awareness', ['tell', 'share', 'show', 'publish', 'post', 'announce', 'awareness', 'teach', 'write', 'story', 'perform', 'speak', 'present']],
]

/** q3: the life state's words. */
const LIFE_WORDS: [LifeState, string[]][] = [
  ['Stalled', [...DISSATISFIED_KEYWORDS, 'stalled', 'stalling', 'stopped', 'frozen', 'behind', 'delayed', 'hard', 'struggling', 'nothing moves', 'putting off', 'procrastinating', 'heavy', 'slow', 'drained', 'tired']],
  ['Flowing', [...SATISFIED_KEYWORDS, 'flowing', 'moving', 'going well', 'easy', 'good', 'great', 'smooth', 'momentum', 'progress', 'busy', 'full']],
  ['Neutral', ['fine', 'okay', 'ok', 'normal', 'steady', 'the same', 'neutral', 'routine', 'quiet', 'nothing much']],
]

const INTENSIFIERS = ['very', 'so', 'really', 'totally', 'extremely', 'completely', 'deeply', 'incredibly', 'utterly', 'absolutely', 'super', 'terribly']
const SOFTENERS = ['a bit', 'a little', 'kind of', 'kinda', 'sort of', 'slightly', 'somewhat', 'mildly', 'a touch', 'barely']

/** q6: the shared shadow voices, by the keep each one is (engine KEEPS), and the lantern's own wording of the same six. */
const VOICE_KEEP: Record<string, number> = {
  "I'm not good enough": 0, "I'm not worthy": 1, "I don't belong": 2, "I'm not capable": 3, "I'm insignificant": 4, "I'm not ready": 5,
}
const KEEP_PATTERNS: { pattern: RegExp; i: number }[] = [
  ...SHADOW_VOICE_PATTERNS.map(({ pattern, label }) => ({ pattern, i: VOICE_KEEP[label] })),
  { pattern: /not\s+significant|won'?t\s+matter|doesn'?t\s+matter|no\s?one\s+cares|nobody\s+cares/i, i: 4 },
  { pattern: /not\s+able|can'?t\s+(?:do|finish|pull)/i, i: 3 },
  { pattern: /not\s+(?:yet\s+)?ready|too\s+soon|too\s+early/i, i: 5 },
  { pattern: /won'?t\s+belong|not\s+belong|don'?t\s+fit|outsider/i, i: 2 },
  { pattern: /don'?t\s+deserve|undeserving|fraud|impostor|imposter/i, i: 1 },
]

/* ---------- reading ---------- */

const clean = (t: string) => t.replace(/\s+/g, ' ').trim()
const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** where a word or phrase stands in the text as a whole word (a plain ending such as s, ed, ing or ly allowed), or -1 */
function findWord(low: string, w: string): number {
  const m = new RegExp(`(?:^|[^a-z'])(${esc(w)})(?:s|es|ed|d|ing|ly)?(?![a-z])`).exec(low)
  return m ? m.index + m[0].indexOf(m[1]) : -1
}
/** the words of a lexicon found in the text, in text order, a word inside a longer match left out */
function hits(low: string, words: Map<string, Channel>): { w: string; c: Channel; at: number }[] {
  const out: { w: string; c: Channel; at: number }[] = []
  for (const [w, c] of words) { const at = findWord(low, w); if (at >= 0) out.push({ w, c, at }) }
  out.sort((a, b) => a.at - b.at || b.w.length - a.w.length)
  return out.filter((h, k) => !out.some((o, j) => j !== k && o.at <= h.at && o.at + o.w.length >= h.at + h.w.length && o.w.length > h.w.length))
}
const uniq = <T,>(xs: T[]) => [...new Set(xs)]
/** the heard words in the order the text says them */
const inOrder = (low: string, ws: string[]) => uniq(ws).sort((a, b) => findWord(low, a) - findWord(low, b))
const NUMBER = ['no', 'one', 'two', 'three', 'four', 'five', 'six']
const quoteList = (ws: string[]) => {
  const q = ws.map(w => `'${w}'`)
  return q.length <= 1 ? q.join('') : `${q.slice(0, -1).join(', ')} and ${q[q.length - 1]}`
}
const andList = (ws: string[]) => (ws.length <= 1 ? ws.join('') : `${ws.slice(0, -1).join(', ')} and ${ws[ws.length - 1]}`)

/** How strongly a stretch of words carries its feeling, 1 to 3: 2 plain, up for each intensifier or "!", down for a softener. */
export function intensity(text: string): { n: 1 | 2 | 3; words: string[] } {
  const low = text.toLowerCase(), words: string[] = []
  let n = 2
  for (const w of SOFTENERS) if (findWord(low, w) >= 0) { n--; words.push(w) }
  for (const w of INTENSIFIERS) if (findWord(low, w) >= 0) { n++; words.push(w) }
  if (text.includes('!')) { n++; words.push('!') }
  if (/\b[A-Z]{3,}\b/.test(text) && text !== text.toUpperCase()) n++
  return { n: Math.max(1, Math.min(3, n)) as 1 | 2 | 3, words }
}

/** The clauses of a q6 answer: sentences, semicolons, and "but". */
const clauses = (text: string) => text.split(/(?<=[.;!?])\s+|;|\bbut\b/i).map(s => s.trim()).filter(Boolean)

const NOTHING = 'I heard nothing I know in that'

/**
 * Read one answer. `intake` is the table as it stands (q5 keeps unmatched words with the feeling of q4). Returns the
 * pieces to set, the words it matched and the line the table says.
 */
export function interpret(q: Question, text: string, intake?: Pick<Intake, 'now'>): Reading {
  const t = clean(text), low = t.toLowerCase()
  if (!t) return { q, heard: [], line: 'The table waits for your words. Type an answer, or tap one engraved under the question.' }

  if (q === 1) {
    const goal = t.slice(0, 80).trim()
    let best: { kind: Experience; at: number; w: string } | null = null
    for (const [kind, ws] of KIND_WORDS) for (const w of ws) { const at = findWord(low, w); if (at >= 0 && (!best || at < best.at)) best = { kind, at, w } }
    if (!best) return { q, goal, heard: [], line: `The plate stamps your goal. I heard no kind of work in it, so the plate leaves that to you.` }
    return { q, goal, kind: best.kind, heard: [best.w], line: `I heard ${quoteList([best.w])}, so the plate stamps your goal as ${best.kind}.` }
  }

  if (q === 2) {
    const h = hits(low, WANT_WORDS), want = uniq(h.map(x => x.c))
    if (!want.length) return { q, heard: [], line: `${NOTHING}, so the ring stays where it is. Turn it by hand to set it.` }
    return { q, want, heard: h.map(x => x.w), line: `I heard ${quoteList(h.map(x => x.w))}, so the ring turns to ${andList(want.map(c => STATE[c][2]))}.` }
  }

  if (q === 3) {
    const score = LIFE_WORDS.map(([life, ws]) => ({ life, ws: ws.filter(w => findWord(low, w) >= 0) }))
    const heard = uniq(score.flatMap(s => s.ws))
    const top = Math.max(...score.map(s => s.ws.length))
    if (!top) return { q, heard: [], line: `${NOTHING}, so the lantern's flame stays as it is. Tap the lantern to set it by hand.` }
    const lead = score.filter(s => s.ws.length === top)
    const life: LifeState = lead.length > 1 ? 'Neutral' : lead[0].life
    const flame = { Flowing: 'burns high and steady', Stalled: 'gutters low', Stuck: 'gutters low', Neutral: 'holds still' }[life]
    return { q, life, heard, line: `I heard ${quoteList(heard)}, so the lantern's flame ${flame}: ${life}.` }
  }

  if (q === 4) {
    const h = hits(low, NOW_WORDS), heardDis = DISSATISFIED_KEYWORDS.filter(w => findWord(low, w) >= 0 && !h.some(x => x.w === w))
    if (!h.length) return { q, heard: heardDis, line: `${NOTHING}, so the lever stays where it is. Turn its foot and pull it by hand to set it.` }
    /* the channel named most, the first named on a tie */
    const count = new Map<Channel, number>(); h.forEach(x => count.set(x.c, (count.get(x.c) || 0) + 1))
    const ch = [...count.entries()].sort((a, b) => b[1] - a[1])[0][0]
    const { n, words } = intensity(t)
    const heard = inOrder(low, [...words.filter(w => w !== '!'), ...h.map(x => x.w), ...heardDis])
    const weight = ['', 'a light weight', 'a middle weight', 'a heavy weight'][n]
    return { q, now: { ch, n }, heard, line: `I heard ${quoteList(heard)}, so the lever swings to ${CHANNEL_NAME[ch]} with ${weight}.` }
  }

  if (q === 5) {
    const h = hits(low, TRUTH_WORDS), truth = uniq(h.map(x => x.c))
    if (!truth.length) {
      const ch = intake && (Object.keys(intake.now || {})[0] as Channel | undefined)
      return { q, heard: [], truthCtx: ch ? { [ch]: t } : undefined, line: `${NOTHING}, so the toggles stay as they are. ${ch ? `Your words are kept with ${CHANNEL_NAME[ch]}. ` : ''}Flip a toggle by hand to set it.` }
    }
    const truthCtx = Object.fromEntries(truth.map(c => [c, t])) as Partial<Record<Channel, string>>
    return { q, truth, truthCtx, heard: h.map(x => x.w), line: `I heard ${quoteList(h.map(x => x.w))}, so the ${truth.length === 1 ? 'toggle' : 'toggles'} for ${andList(truth.map(c => CHANNEL_NAME[c]))} ${truth.length === 1 ? 'flips' : 'flip'} up.` }
  }

  /* q6: each clause names its keeps, and the channels in the same clause tag them at the clause's strength */
  const keeps: NonNullable<Reading['keeps']> = [], heard: string[] = []
  for (const cl of clauses(t)) {
    const named = uniq(KEEP_PATTERNS.map(({ pattern, i }) => { const m = pattern.exec(cl); return m ? { i, w: m[0], at: m.index } : null }).filter(Boolean) as { i: number; w: string; at: number }[]).sort((a, b) => a.at - b.at)
    const seen = new Set<number>(), these = named.filter(x => !seen.has(x.i) && seen.add(x.i))
    if (!these.length) continue
    const cs = hits(cl.toLowerCase(), NOW_WORDS), { n, words } = intensity(cl)
    heard.push(...these.map(x => x.w.toLowerCase()), ...cs.map(x => x.w), ...words.filter(w => w !== '!'))
    for (const { i } of these) {
      if (keeps.some(k => k.i === i)) continue
      const tags: Partial<Record<Channel, TagStrength>> = {}
      for (const c of uniq(cs.map(x => x.c))) tags[c] = n
      keeps.push({ i, tags })
    }
  }
  if (!keeps.length) return { q, heard: [], line: `I heard no reservation I know in that, so the cells stay down. Press a cell by hand to raise its stone.` }
  const said = keeps.map(k => {
    const cs = Object.keys(k.tags) as Channel[]
    return cs.length ? `${KEEPS[k.i].b} in ${andList(cs.map(c => CHANNEL_NAME[c]))} at ${['', 'the foot', 'the belly', 'the shoulder'][k.tags[cs[0]] as number]}` : `${KEEPS[k.i].b} in fog`
  })
  const order = inOrder(low, heard)
  return { q, keeps, heard: order, line: `I heard ${quoteList(order)}, so ${keeps.length === 1 ? 'a stone rises' : `${NUMBER[keeps.length]} stones rise`}: ${andList(said)}.` }
}

/** Three answers per question the plate engraves for a player who would rather not type; q1's first is the director goal. */
export const STOCK: Record<Question, readonly string[]> = {
  1: ['Send the TDT director application', 'Raise the money for the residency', 'Show my work to someone'],
  2: ['Proud and free', 'Relieved and peaceful', 'Delighted'],
  3: ["I'm stuck and putting it off", "It's fine, the same as usual", 'Things are moving well'],
  4: ["I'm really scared", "I'm frustrated", 'A bit sad'],
  5: ["There's an obstacle I can't get past", "I'd have to fear being judged", 'Something I want is missing'],
  6: ["I'm not ready and I'm scared.", "I'm not good enough, and it makes me angry.", "It won't matter to anyone, and that is a bit sad."],
}

/* ---------- one text, all six answers ---------- */

/** What one free text (a card's words, say) says to all six questions at once. */
export interface ReadAll {
  /** each question's reading of the same words: the intake changes it would make */
  answers: Record<'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6', Reading>
  /** the lantern channel the words name most, or null when they name none */
  channel: Channel | null
  /** dissatisfied when lead words (q4's kind) outnumber gold words (q2's kind), satisfied the other way, else neutral */
  state: 'dissatisfied' | 'neutral' | 'satisfied'
  /** the reservations it heard, by their keep names (engine KEEPS) */
  shadowVoices: string[]
  heard: string[]
}

const GOLD_WORDS = new Set<string>([...SATISFIED_KEYWORDS, ...Object.keys(SATISFIED_CHANNEL), ...CHANNELS.map(c => STATE[c][2].toLowerCase())])
const CALM_WORDS = new Set<string>([...CHANNEL_KEYWORDS.Neutrality, 'neutral', 'peace', 'stillness', 'presence'])

/** Pencil all six answers from one text, with its primary channel, its altitude and the shadow voices in it. Pure. */
export function readAll(text: string): ReadAll {
  const t = clean(text), low = t.toLowerCase()
  const answers = {
    q1: interpret(1, t), q2: interpret(2, t), q3: interpret(3, t), q4: interpret(4, t), q5: interpret(5, t), q6: interpret(6, t),
  }
  const h = hits(low, NOW_WORDS)
  const count = new Map<Channel, number>(); h.forEach(x => count.set(x.c, (count.get(x.c) || 0) + 1))
  const channel = [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const gold = uniq([...hits(low, WANT_WORDS).map(x => x.w), ...SATISFIED_KEYWORDS.filter(w => findWord(low, w) >= 0)]).filter(w => GOLD_WORDS.has(w))
  const lead = uniq([...h.map(x => x.w), ...DISSATISFIED_KEYWORDS.filter(w => findWord(low, w) >= 0)]).filter(w => !GOLD_WORDS.has(w) && !CALM_WORDS.has(w))
  const state = lead.length > gold.length ? 'dissatisfied' : gold.length > lead.length ? 'satisfied' : 'neutral'
  const shadowVoices = (answers.q6.keeps || []).map(k => KEEPS[k.i].b)
  const heard = inOrder(low, [...gold, ...lead, ...answers.q6.heard, ...answers.q3.heard].filter(w => findWord(low, w) >= 0))
  return { answers, channel, state, shadowVoices, heard }
}
