import { INNER_GARDEN_TO_BARS_SCHEMA_VERSION, buildShamanResultSeedMetabolization } from './bridge'

export const INNER_GARDEN_CHAPTER_ONE_SOURCE = 'inner_garden_chapter_1'
export const INNER_GARDEN_CHAPTER_ONE_SOURCE_BAR = 'inner_garden_chapter_1_call'
export const MTGOA_CHAPTER_ONE_CAMPAIGN_REF = 'mtgoa-chapter-1'
export const MTGOA_CHAPTER_ONE_ALLYSHIP_DOMAIN = 'RAISE_AWARENESS'
export const MTGOA_CHAPTER_ONE_MOVE_TYPE = 'wakeUp'

export const CHAPTER_ONE_STARTER_SCENARIOS = [
  {
    id: 'stayed_quiet',
    title: 'I noticed something unfair but stayed quiet.',
    signal: 'I noticed something unfair but stayed quiet.',
    resistance: 'I was worried that naming it would make me difficult or derail the moment.',
  },
  {
    id: 'dont_know_lane',
    title: "I want to help but do not know my lane.",
    signal: "I want to help in a situation that matters, but I am not sure what role is mine to play.",
    resistance: 'I do not want to overstep, disappear, or make the moment about me.',
  },
  {
    id: 'make_it_worse',
    title: "I am worried I will make it worse.",
    signal: 'I can feel a real invitation to act, but I am afraid my move could create more harm.',
    resistance: 'The fear of making a mistake is pulling me toward silence.',
  },
] as const

export type ChapterOneStarterScenarioId = (typeof CHAPTER_ONE_STARTER_SCENARIOS)[number]['id']

export type ChapterOneDraft = {
  signal: string
  resistance: string
  emotionId: string
  seedQuality: number
  cultivationAction: string
  harvestedInsight: string
  firstMove: string
  starterScenarioId?: string
  usefulnessRating?: number | null
  clarityRating?: number | null
  confusingPart?: string
}

export type ChapterOneSourceBarDraft = {
  title: string
  description: string
  type: 'bar'
  reward: 0
  visibility: 'private'
  status: 'active'
  inputs: '[]'
  rootId: 'temp'
  campaignRef: typeof MTGOA_CHAPTER_ONE_CAMPAIGN_REF
  allyshipDomain: typeof MTGOA_CHAPTER_ONE_ALLYSHIP_DOMAIN
  moveType: typeof MTGOA_CHAPTER_ONE_MOVE_TYPE
  gameMasterFace: 'shaman'
  questSource: typeof INNER_GARDEN_CHAPTER_ONE_SOURCE_BAR
  agentMetadata: string
}

export type ChapterOneResultBarDraft = {
  title: string
  description: string
  type: 'bar'
  reward: 0
  visibility: 'private'
  status: 'active'
  inputs: '[]'
  rootId: 'temp'
  sourceBarId: string
  gameMasterFace: 'shaman'
  questSource: typeof INNER_GARDEN_CHAPTER_ONE_SOURCE
  campaignRef: typeof MTGOA_CHAPTER_ONE_CAMPAIGN_REF
  allyshipDomain: typeof MTGOA_CHAPTER_ONE_ALLYSHIP_DOMAIN
  moveType: typeof MTGOA_CHAPTER_ONE_MOVE_TYPE
  nation: string | null
  intensity: string | null
  seedMetabolization: string | null
  agentMetadata: string
}

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function truncate(value: string, max: number): string {
  const clean = compactWhitespace(value)
  if (clean.length <= max) return clean
  return `${clean.slice(0, Math.max(0, max - 1)).trim()}...`
}

export function normalizeChapterOneText(value: FormDataEntryValue | null, max = 2000): string {
  return String(value ?? '').trim().slice(0, max)
}

export function findChapterOneStarterScenario(id: string) {
  return CHAPTER_ONE_STARTER_SCENARIOS.find((scenario) => scenario.id === id) ?? null
}

export function buildChapterOneSourceBarDraft(
  draft: Pick<ChapterOneDraft, 'signal' | 'resistance' | 'starterScenarioId'>
): ChapterOneSourceBarDraft {
  const signal = draft.signal.trim()
  const resistance = draft.resistance.trim()

  return {
    title: truncate(`Call to Play: ${signal}`, 80),
    description: [`Signal: ${signal}`, `Charge or resistance: ${resistance}`].join('\n\n'),
    type: 'bar',
    reward: 0,
    visibility: 'private',
    status: 'active',
    inputs: '[]',
    rootId: 'temp',
    campaignRef: MTGOA_CHAPTER_ONE_CAMPAIGN_REF,
    allyshipDomain: MTGOA_CHAPTER_ONE_ALLYSHIP_DOMAIN,
    moveType: MTGOA_CHAPTER_ONE_MOVE_TYPE,
    gameMasterFace: 'shaman',
    questSource: INNER_GARDEN_CHAPTER_ONE_SOURCE_BAR,
    agentMetadata: JSON.stringify({
      schemaVersion: INNER_GARDEN_TO_BARS_SCHEMA_VERSION,
      source: INNER_GARDEN_CHAPTER_ONE_SOURCE_BAR,
      chapter: 1,
      campaignRef: MTGOA_CHAPTER_ONE_CAMPAIGN_REF,
      signal,
      resistance,
      starterScenarioId: draft.starterScenarioId,
    }),
  }
}

export function buildChapterOneResultBarDraft(input: {
  sourceBarId: string
  sourceTitle: string
  sourceSeedMetabolization: string | null | undefined
  sourceNation: string | null
  sourceIntensity: string | null
  draft: ChapterOneDraft
  completedAt: string
}): ChapterOneResultBarDraft {
  const signal = input.draft.signal.trim()
  const resistance = input.draft.resistance.trim()
  const harvestedInsight = input.draft.harvestedInsight.trim()
  const firstMove = input.draft.firstMove.trim()

  return {
    title: truncate(`Chapter 1 answered: ${input.sourceTitle}`, 80),
    description: [
      `Signal: ${signal}`,
      `Charge or resistance: ${resistance}`,
      `Harvested insight: ${harvestedInsight}`,
      `First move: ${firstMove}`,
    ].join('\n\n'),
    type: 'bar',
    reward: 0,
    visibility: 'private',
    status: 'active',
    inputs: '[]',
    rootId: 'temp',
    sourceBarId: input.sourceBarId,
    gameMasterFace: 'shaman',
    questSource: INNER_GARDEN_CHAPTER_ONE_SOURCE,
    campaignRef: MTGOA_CHAPTER_ONE_CAMPAIGN_REF,
    allyshipDomain: MTGOA_CHAPTER_ONE_ALLYSHIP_DOMAIN,
    moveType: MTGOA_CHAPTER_ONE_MOVE_TYPE,
    nation: input.sourceNation,
    intensity: input.sourceIntensity,
    seedMetabolization: buildShamanResultSeedMetabolization(
      input.sourceSeedMetabolization,
      harvestedInsight
    ),
    agentMetadata: JSON.stringify({
      schemaVersion: INNER_GARDEN_TO_BARS_SCHEMA_VERSION,
      source: INNER_GARDEN_CHAPTER_ONE_SOURCE,
      chapter: 1,
      campaignRef: MTGOA_CHAPTER_ONE_CAMPAIGN_REF,
      sourceBarId: input.sourceBarId,
      guideFace: 'shaman',
      signal,
      resistance,
      emotionId: input.draft.emotionId,
      seedQuality: input.draft.seedQuality,
      cultivationAction: input.draft.cultivationAction,
      harvestedInsight,
      firstMove,
      starterScenarioId: input.draft.starterScenarioId,
      playtestFeedback: {
        usefulnessRating: input.draft.usefulnessRating ?? null,
        clarityRating: input.draft.clarityRating ?? null,
        confusingPart: input.draft.confusingPart ?? '',
      },
      completedAt: input.completedAt,
    }),
  }
}
