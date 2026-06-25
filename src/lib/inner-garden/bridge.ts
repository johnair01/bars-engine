import {
  effectiveMaturity,
  mergeSeedMetabolization,
  parseSeedMetabolization,
  type MaturityPhase,
} from '@/lib/bar-seed-metabolization'

export const BARS_TO_INNER_GARDEN_SCHEMA_VERSION = 'bars-inner-garden.v1'
export const INNER_GARDEN_TO_BARS_SCHEMA_VERSION = 'inner-garden-bars.v1'
export const INNER_GARDEN_SHAMAN_SOURCE = 'inner_garden_shaman'
export const INNER_GARDEN_CHAPTER_1_SOURCE = 'inner_garden_chapter_1'

export const INNER_GARDEN_CAPTURE_TYPES = ['bar', 'charge_capture'] as const
export type InnerGardenCaptureType = (typeof INNER_GARDEN_CAPTURE_TYPES)[number]

export type InnerGardenLocation =
  | { kind: 'hand'; slotIndex: number; isCarrying: boolean }
  | { kind: 'vault' }

export type InnerGardenEligibleBar = {
  id: string
  title: string
  description: string
  type: InnerGardenCaptureType
  nation: string | null
  intensity: string | null
  campaignRef: string | null
  gameMasterFace: string | null
  hexagramId: number | null
  maturity: MaturityPhase
  location: InnerGardenLocation
}

export type BarsInnerGardenImportPayload = {
  schemaVersion: typeof BARS_TO_INNER_GARDEN_SCHEMA_VERSION
  source: 'bars-engine'
  mode: 'embedded'
  bar: {
    id: string
    title: string
    description: string
    type: InnerGardenCaptureType
    emotionHint: string | null
    elementHint: string | null
    intensity: string | null
    campaignRef: string | null
    gameMasterFace: string | null
    hexagramId: number | null
  }
  location: InnerGardenLocation
}

export type InnerGardenCompletionPayload = {
  schemaVersion: typeof INNER_GARDEN_TO_BARS_SCHEMA_VERSION
  guideFace: 'shaman'
  sourceBarId: string
  emotionId: string
  seedQuality: number
  cultivationAction: string
  harvestedInsight: string
  resultText?: string
  campaignRef?: string | null
  completedAt?: string
}

export type InnerGardenBarCandidate = {
  id: string
  title: string
  description: string
  type: string
  creatorId: string
  status: string
  archivedAt: Date | null
  seedMetabolization: string | null
  nation: string | null
  intensity: string | null
  campaignRef: string | null
  gameMasterFace: string | null
  hexagramId: number | null
  isSystem: boolean
  inviteId: string | null
  mergedIntoId: string | null
}

const ELEMENT_TO_EMOTION: Record<string, string> = {
  fire: 'anger',
  water: 'sadness',
  wood: 'joy',
  metal: 'fear',
  earth: 'neutrality',
}

export function isInnerGardenCaptureType(type: string): type is InnerGardenCaptureType {
  return (INNER_GARDEN_CAPTURE_TYPES as readonly string[]).includes(type)
}

export function isRawInnerGardenMaturity(seedMetabolization: string | null | undefined): boolean {
  return effectiveMaturity(parseSeedMetabolization(seedMetabolization)) === 'captured'
}

export function getInnerGardenEligibilityReason(
  bar: InnerGardenBarCandidate,
  playerId: string
): string | null {
  if (bar.creatorId !== playerId) return 'not-owned'
  if (!isInnerGardenCaptureType(bar.type)) return 'unsupported-type'
  if (bar.status !== 'active') return 'inactive'
  if (bar.archivedAt) return 'archived'
  if (bar.isSystem) return 'system-bar'
  if (bar.inviteId) return 'invitation-bar'
  if (bar.mergedIntoId) return 'merged'
  if (!isRawInnerGardenMaturity(bar.seedMetabolization)) return 'not-raw'
  return null
}

export function toInnerGardenEligibleBar(
  bar: InnerGardenBarCandidate,
  location: InnerGardenLocation
): InnerGardenEligibleBar {
  return {
    id: bar.id,
    title: bar.title,
    description: bar.description,
    type: bar.type as InnerGardenCaptureType,
    nation: bar.nation,
    intensity: bar.intensity,
    campaignRef: bar.campaignRef,
    gameMasterFace: bar.gameMasterFace,
    hexagramId: bar.hexagramId,
    maturity: effectiveMaturity(parseSeedMetabolization(bar.seedMetabolization)),
    location,
  }
}

export function buildBarsInnerGardenImportPayload(
  bar: InnerGardenEligibleBar
): BarsInnerGardenImportPayload {
  const elementHint = bar.nation?.trim().toLowerCase() || null
  return {
    schemaVersion: BARS_TO_INNER_GARDEN_SCHEMA_VERSION,
    source: 'bars-engine',
    mode: 'embedded',
    bar: {
      id: bar.id,
      title: bar.title,
      description: bar.description,
      type: bar.type,
      elementHint,
      emotionHint: elementHint ? ELEMENT_TO_EMOTION[elementHint] ?? null : null,
      intensity: bar.intensity,
      campaignRef: bar.campaignRef,
      gameMasterFace: bar.gameMasterFace,
      hexagramId: bar.hexagramId,
    },
    location: bar.location,
  }
}

export function normalizeSeedQuality(raw: FormDataEntryValue | null): number {
  const n = Number(raw)
  if (!Number.isFinite(n)) return 50
  return Math.max(1, Math.min(100, Math.round(n)))
}

export function buildShamanResultSeedMetabolization(
  sourceSeedMetabolization: string | null | undefined,
  harvestedInsight: string
): string | null {
  return mergeSeedMetabolization(sourceSeedMetabolization, {
    maturity: 'context_named',
    soilKind: 'holding_pen',
    contextNote: harvestedInsight,
  })
}
