export type MythId =
  | 'M1'
  | 'M2'
  | 'M3'
  | 'M4'
  | 'M5'
  | 'M6'
  | 'M7'
  | 'M8'
  | 'M9'
  | 'M10'

export type MythReadAnswerValue = 0 | 1 | 2 | 3 | 4
export type MythChargeFlavorKey = 'sadness' | 'anger' | 'fear' | 'numbness' | 'restlessness'
export type MythChargeIntensity = 2 | 4 | 6 | 8 | 10
export type MythGameFaceKey =
  | 'shaman'
  | 'challenger'
  | 'regent'
  | 'architect'
  | 'diplomat'
  | 'sage'

export interface MythReadCharge {
  mythId: MythId
  flavor: MythChargeFlavorKey
  intensity: MythChargeIntensity
  gameFace?: MythGameFaceKey | null
}

export interface MythReadMyth {
  id: MythId
  claim: string
  rootBelief: string
  chapter: string
  destination: string
  diagnosis: string
  move: string
  short: string
}

export interface MythReadItem {
  id: `q${number}`
  text: string
  weights: Partial<Record<MythId, number>>
}

export interface RankedMyth {
  myth: MythReadMyth
  raw: number
  max: number
  pct: number
  peak: number
  strength: 'Loud' | 'Clear' | 'Faint'
}

export interface MythReadOutcome {
  ranked: RankedMyth[]
  surfaced: RankedMyth[]
  scores: Record<MythId, RankedMyth>
}

export interface MythReadPersistencePayload {
  responses: { item: MythReadItem['id']; value: MythReadAnswerValue }[]
  mythScores: {
    myth: MythId
    pct: number
    raw: number
    max: number
    peak: number
    strength: RankedMyth['strength']
  }[]
  topMyths: MythId[]
  rootBeliefs: string[]
  recommendedDestinations: string[]
  capturedCharge: MythReadCharge | null
  seedBarDrafts: {
    myth: MythId
    prompt: string
    gameFace: MythGameFaceKey | null
    gameName: string | null
    nextStep: string
  }[]
}

export const MYTHS: readonly MythReadMyth[] = [
  {
    id: 'M1',
    claim: 'Allyship means being good.',
    rootBelief: 'Not good enough',
    chapter: 'Ch 0',
    destination: 'The redefinition + the counter-con',
    diagnosis: 'A private trial where the other person becomes your evidence.',
    move: "Name the verdict you're trying to win.",
    short: 'being good',
  },
  {
    id: 'M2',
    claim: 'Allyship means saying the right words.',
    rootBelief: 'Not ready',
    chapter: 'Ch 2',
    destination: 'The Shaman: the felt record under the language',
    diagnosis: 'Fluency that signals safety without proving it.',
    move: 'Name one thing you feel that you have no vocabulary for.',
    short: 'right words',
  },
  {
    id: 'M3',
    claim: 'Allyship means helping the less powerful.',
    rootBelief: 'Insignificant',
    chapter: 'Ch 0',
    destination: 'The redefinition: charity vs. allyship',
    diagnosis: "Turns a person into a project. That's charity.",
    move: 'Name where the mutuality is.',
    short: 'the less powerful',
  },
  {
    id: 'M4',
    claim: 'Allyship means following the right people.',
    rootBelief: 'Not capable',
    chapter: 'Ch 3',
    destination: "The Challenger: keep your discernment or you're staff",
    diagnosis: "Discernment surrendered to someone's authority.",
    move: 'Name one thing you disagreed with and swallowed.',
    short: 'the right people',
  },
  {
    id: 'M5',
    claim: 'Allyship means sacrificing yourself.',
    rootBelief: 'Not worthy',
    chapter: 'Ch 0',
    destination: 'The Token System + self-allyship',
    diagnosis: 'Self-abandonment that sends an invoice.',
    move: 'Name what actually refills you.',
    short: 'sacrificing yourself',
  },
  {
    id: 'M6',
    claim: 'Allyship means never causing harm.',
    rootBelief: "Don't belong",
    chapter: 'Ch 6',
    destination: 'Diplomat: the Repairer channel',
    diagnosis: 'Innocence protected by never moving.',
    move: "Name a rupture you've been avoiding repairing.",
    short: 'never causing harm',
  },
  {
    id: 'M7',
    claim: 'Allyship means fixing the problem.',
    rootBelief: 'Not capable',
    chapter: 'Ch 0',
    destination: 'The Gates + Emotional Alchemy',
    diagnosis: 'Wanting it more than they do; help curdles to pressure.',
    move: 'Name the charge under your urge to fix.',
    short: 'fixing it',
  },
  {
    id: 'M8',
    claim: 'Allyship means having the right framework.',
    rootBelief: 'Not good enough',
    chapter: 'Ch 7',
    destination: 'The Sage: seeing that replaces acting + Two Readings',
    diagnosis: 'The map becomes the destination.',
    move: "Name a pattern you see clearly and still haven't moved on.",
    short: 'the right framework',
  },
  {
    id: 'M9',
    claim: 'Allyship means being seen doing it.',
    rootBelief: "Don't belong",
    chapter: 'Ch 0',
    destination: "The Ticket System: optics aren't tickets",
    diagnosis: "Optics on someone else's ledger.",
    move: "Name a move you'd make if no one saw.",
    short: 'being seen',
  },
  {
    id: 'M10',
    claim: 'Allyship means paying down what you owe.',
    rootBelief: 'Not worthy',
    chapter: 'Ch 0',
    destination: 'The infinite-game frame',
    diagnosis: 'An inherited, unpayable debt.',
    move: 'Name what accurate accounting would actually say.',
    short: 'a debt to pay',
  },
] as const

export const MYTH_BY_ID = Object.fromEntries(MYTHS.map((myth) => [myth.id, myth])) as Record<
  MythId,
  MythReadMyth
>

export const MYTH_READ_ITEMS: readonly MythReadItem[] = [
  {
    id: 'q1',
    text: 'When I do something for a cause, some part of me is quietly checking whether it makes me a good person.',
    weights: { M1: 1 },
  },
  {
    id: 'q2',
    text: "I relax in a room once I've heard people use the right language — I know I'm safe there.",
    weights: { M2: 1 },
  },
  {
    id: 'q3',
    text: "I feel most useful when I'm helping someone who clearly can't help themselves.",
    weights: { M3: 1 },
  },
  {
    id: 'q4',
    text: 'When someone with more standing or lived experience takes a position, I go along with it even when something in me disagrees.',
    weights: { M4: 1 },
  },
  {
    id: 'q5',
    text: 'I gauge whether I did enough by how drained I feel afterward.',
    weights: { M5: 1 },
  },
  {
    id: 'q6',
    text: "I'd rather stay quiet than risk saying the wrong thing and being seen as harmful.",
    weights: { M6: 1 },
  },
  {
    id: 'q7',
    text: "When someone I care about is struggling, I keep offering my solution even after they've stopped asking for it.",
    weights: { M7: 1 },
  },
  {
    id: 'q8',
    text: 'Before I act, I reach for a framework or an analysis so I feel like I\'m standing on solid ground.',
    weights: { M8: 1 },
  },
  {
    id: 'q9',
    text: 'I understand my own patterns far better than I actually change them.',
    weights: { M8: 1 },
  },
  {
    id: 'q10',
    text: 'It matters to me that the right people notice I showed up.',
    weights: { M9: 1, M1: 0.5 },
  },
  {
    id: 'q11',
    text: "I carry a sense that I owe something for advantages I didn't earn, and that I have to keep paying it down.",
    weights: { M10: 1 },
  },
  {
    id: 'q12',
    text: "It's hard for me to let someone struggle when I'm sure I know what would help.",
    weights: { M7: 1 },
  },
] as const

export const MYTH_TIE_ORDER: readonly MythId[] = [
  'M8',
  'M7',
  'M1',
  'M5',
  'M6',
  'M4',
  'M2',
  'M3',
  'M9',
  'M10',
] as const

export const MYTH_SCALE = [
  { value: 0 as const, label: 'Never' },
  { value: 1 as const, label: 'Rarely' },
  { value: 2 as const, label: 'Sometimes' },
  { value: 3 as const, label: 'Often' },
  { value: 4 as const, label: 'Almost always' },
] as const

export const MYTH_CHARGE_FLAVORS: readonly {
  key: MythChargeFlavorKey
  sigil: string
  label: string
  sub: string
  color: string
}[] = [
  {
    key: 'sadness',
    sigil: '水',
    label: 'Sadness',
    sub: 'Heavy — grief, something feels distant',
    color: '#2980b9',
  },
  {
    key: 'anger',
    sigil: '火',
    label: 'Anger',
    sub: "Heated — a boundary's been crossed",
    color: '#c1392b',
  },
  {
    key: 'fear',
    sigil: '金',
    label: 'Fear',
    sub: 'Anxious — dread, bracing for it',
    color: '#8e9aab',
  },
  {
    key: 'numbness',
    sigil: '土',
    label: 'Numbness',
    sub: 'Shut down — going through the motions',
    color: '#9a8f6e',
  },
  {
    key: 'restlessness',
    sigil: '木',
    label: 'Restlessness',
    sub: 'Forced — performing okay-ness',
    color: '#2ecc71',
  },
] as const

export const MYTH_GAME_FACES: readonly {
  key: MythGameFaceKey
  face: string
  gameName: string
  prompt: string
  nextStep: string
}[] = [
  {
    key: 'shaman',
    face: 'Shaman',
    gameName: 'Emotional Alchemy',
    prompt: 'I want to understand what this charge is carrying.',
    nextStep: 'Track the feeling under the myth before turning it into action.',
  },
  {
    key: 'challenger',
    face: 'Challenger',
    gameName: 'MythBusting',
    prompt: 'I want to stop obeying this pattern.',
    nextStep: 'Find the bargain the myth is making and break one small piece of it.',
  },
  {
    key: 'regent',
    face: 'Regent',
    gameName: 'Map the Terrain',
    prompt: 'I want to take responsibility without self-punishment.',
    nextStep: 'Name the actual field of responsibility and what is not yours to carry.',
  },
  {
    key: 'architect',
    face: 'Architect',
    gameName: 'Build The System',
    prompt: 'I want to build a repeatable practice.',
    nextStep: 'Turn the charge into a structure, ritual, checklist, or support system.',
  },
  {
    key: 'diplomat',
    face: 'Diplomat',
    gameName: 'RelationshipCraft',
    prompt: 'I think this points to repair or conversation.',
    nextStep: 'Shape the next relational move with consent, timing, and repair in mind.',
  },
  {
    key: 'sage',
    face: 'Sage',
    gameName: 'Build your own Allyship Campaign',
    prompt: 'I want to turn this into a longer campaign of practice.',
    nextStep: 'Seed a single-player campaign from this myth, charge, and chosen posture.',
  },
] as const

export const MYTH_CHARGE_INTENSITIES: readonly {
  value: MythChargeIntensity
  label: string
  readout: string
}[] = [
  { value: 2, label: 'Faint', readout: 'Faint — it is present, but not steering.' },
  { value: 4, label: 'Mild', readout: 'Mild — it tugs at the edge of things.' },
  { value: 6, label: 'Live', readout: 'Live — it wants attention now.' },
  { value: 8, label: 'Heavy', readout: 'Heavy — it colors everything.' },
  { value: 10, label: 'Overwhelming', readout: 'Overwhelming — go slowly and bring support.' },
] as const

export function strengthForPct(pct: number): RankedMyth['strength'] {
  if (pct >= 0.72) return 'Loud'
  if (pct >= 0.55) return 'Clear'
  return 'Faint'
}

export function scoreMyths(
  answers: Partial<Record<MythReadItem['id'], MythReadAnswerValue>>,
): MythReadOutcome {
  const raw = Object.fromEntries(MYTHS.map((myth) => [myth.id, 0])) as Record<MythId, number>
  const max = Object.fromEntries(MYTHS.map((myth) => [myth.id, 0])) as Record<MythId, number>
  const peak = Object.fromEntries(MYTHS.map((myth) => [myth.id, 0])) as Record<MythId, number>

  for (const item of MYTH_READ_ITEMS) {
    const answer = answers[item.id] ?? 0
    for (const [mythId, weight] of Object.entries(item.weights) as [MythId, number][]) {
      const contribution = answer * weight
      raw[mythId] += contribution
      max[mythId] += 4 * weight
      peak[mythId] = Math.max(peak[mythId], contribution)
    }
  }

  const ranked = MYTHS.map((myth) => {
    const pct = max[myth.id] > 0 ? raw[myth.id] / max[myth.id] : 0
    return {
      myth,
      raw: raw[myth.id],
      max: max[myth.id],
      pct,
      peak: peak[myth.id],
      strength: strengthForPct(pct),
    }
  }).sort((a, b) => {
    return (
      b.pct - a.pct ||
      b.peak - a.peak ||
      MYTH_TIE_ORDER.indexOf(a.myth.id) - MYTH_TIE_ORDER.indexOf(b.myth.id)
    )
  })

  const surfaced = ranked.slice(0, 3).filter((entry, index) => index === 0 || entry.pct >= 0.4)
  const scores = Object.fromEntries(ranked.map((entry) => [entry.myth.id, entry])) as Record<
    MythId,
    RankedMyth
  >

  return { ranked, surfaced, scores }
}

export function buildMythReadPersistencePayload(
  answers: Partial<Record<MythReadItem['id'], MythReadAnswerValue>>,
  capturedCharge: MythReadCharge | null = null,
): MythReadPersistencePayload {
  const outcome = scoreMyths(answers)
  const responses = MYTH_READ_ITEMS.flatMap((item) => {
    const value = answers[item.id]
    return value == null ? [] : [{ item: item.id, value }]
  })
  const topMyths = outcome.surfaced.map((entry) => entry.myth.id)
  const rootBeliefs = Array.from(new Set(outcome.surfaced.map((entry) => entry.myth.rootBelief)))
  const recommendedDestinations = Array.from(
    new Set(outcome.surfaced.map((entry) => `${entry.myth.chapter}: ${entry.myth.destination}`)),
  )
  const flavor = capturedCharge
    ? MYTH_CHARGE_FLAVORS.find((entry) => entry.key === capturedCharge.flavor)
    : null
  const game = capturedCharge?.gameFace
    ? MYTH_GAME_FACES.find((entry) => entry.key === capturedCharge.gameFace)
    : null
  const chargedMyth = capturedCharge ? MYTH_BY_ID[capturedCharge.mythId] : null

  return {
    responses,
    mythScores: outcome.ranked.map((entry) => ({
      myth: entry.myth.id,
      pct: entry.pct,
      raw: entry.raw,
      max: entry.max,
      peak: entry.peak,
      strength: entry.strength,
    })),
    topMyths,
    rootBeliefs,
    recommendedDestinations,
    capturedCharge,
    seedBarDrafts:
      flavor && chargedMyth
        ? [
            {
              myth: chargedMyth.id,
              prompt: chargedMyth.move,
              gameFace: game?.key ?? null,
              gameName: game?.gameName ?? null,
              nextStep: game?.nextStep ?? 'Choose the game you want to play with this energy.',
            },
          ]
        : [],
  }
}
