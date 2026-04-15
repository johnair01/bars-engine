/**
 * BAR Card Data — view model for BarCard component
 *
 * Spec: .specify/specs/mobile-ui-redesign/spec.md
 * Converts CustomBar → BarCardData at read time. No schema migration.
 */

export type ChargeType = 'anger' | 'joy' | 'sadness' | 'fear' | 'neutrality'

export interface BarMediaAttachment {
  url: string
  kind: 'image' | 'file'
  name?: string
}

export interface BarCardData {
  id: string
  title: string
  description: string
  type: string
  chargeType: ChargeType
  createdAt: string
  creatorName?: string
  status: string
  /** One-line action hook for card front (Challenger lens) */
  actionLine?: string
  /** Attachments for card back (Diplomat lens) */
  attachments?: BarMediaAttachment[]
}

const VALID_CHARGE_TYPES: ChargeType[] = [
  'anger',
  'joy',
  'sadness',
  'fear',
  'neutrality',
]

function isValidChargeType(value: unknown): value is ChargeType {
  return typeof value === 'string' && VALID_CHARGE_TYPES.includes(value as ChargeType)
}

/**
 * Safely parse JSON. Returns empty object on failure.
 */
export function safeParseJson<T = Record<string, unknown>>(input: string): T | Record<string, unknown> {
  if (!input || typeof input !== 'string') return {}
  try {
    const parsed = JSON.parse(input) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as T
    }
    return {}
  } catch {
    return {}
  }
}

export type CustomBarForMapping = {
  id: string
  title: string
  description: string
  type: string
  inputs: string
  createdAt: Date
  status: string
  creator?: { name: string } | null
  barMedia?: { blobUrl: string; kind: string; name: string | null }[]
}

/**
 * Map CustomBar to BarCardData.
 * chargeType from inputs.emotion_channel for charge_capture; else 'neutrality'.
 */
export function mapCustomBarToBarCardData(bar: CustomBarForMapping): BarCardData {
  const inputs = safeParseJson<{ emotion_channel?: string }>(bar.inputs)
  const chargeType: ChargeType =
    bar.type === 'charge_capture' && isValidChargeType(inputs.emotion_channel)
      ? inputs.emotion_channel
      : 'neutrality'

  const attachments: BarMediaAttachment[] | undefined = bar.barMedia?.length
    ? bar.barMedia.map((m) => ({
        url: m.blobUrl,
        kind: (m.kind === 'file' ? 'file' : 'image') as 'image' | 'file',
        name: m.name ?? undefined,
      }))
    : undefined

  return {
    id: bar.id,
    title: bar.title,
    description: bar.description,
    type: bar.type,
    chargeType,
    createdAt: bar.createdAt.toISOString(),
    creatorName: bar.creator?.name,
    status: bar.status,
    attachments,
  }
}

/**
 * Map partial bar (e.g. from BarBinding) to BarCardData.
 * Uses defaults for missing fields.
 */
export function mapPartialBarToBarCardData(bar: {
  id: string
  title: string
  description: string
  inputs?: string
  type?: string
  createdAt?: Date
  status?: string
  creator?: { name: string } | null
}): BarCardData {
  const inputs = safeParseJson<{ emotion_channel?: string }>(bar.inputs ?? '{}')
  const type = bar.type ?? 'vibe'
  const chargeType: ChargeType =
    type === 'charge_capture' && isValidChargeType(inputs.emotion_channel)
      ? inputs.emotion_channel
      : 'neutrality'

  return {
    id: bar.id,
    title: bar.title,
    description: bar.description,
    type,
    chargeType,
    createdAt: bar.createdAt?.toISOString() ?? new Date().toISOString(),
    creatorName: bar.creator?.name,
    status: bar.status ?? 'active',
  }
}

/**
 * Map MarketQuest (Campaign Deck quest) to BarCardData.
 * Campaign Deck uses BarCard compact for visual consistency.
 */
export function mapMarketQuestToBarCardData(quest: {
  id: string
  title: string
  description: string | null
  createdAt?: string
  creator?: { name: string | null } | null
}): BarCardData {
  return {
    id: quest.id,
    title: quest.title,
    description: quest.description ?? '',
    type: 'quest',
    chargeType: 'neutrality',
    createdAt: quest.createdAt ?? new Date().toISOString(),
    creatorName: quest.creator?.name ?? undefined,
    status: 'active',
  }
}
