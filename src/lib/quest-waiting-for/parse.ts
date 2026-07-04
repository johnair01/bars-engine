import type { PlayerQuestMetadata, WaitingForKind, WaitingForState } from './types'
import { isWaitingForKind } from './types'

function parseIsoField(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined
  return value.trim().slice(0, 64)
}

function parseOptionalText(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, maxLen)
}

function parseWaitingFor(value: unknown): WaitingForState | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const o = value as Record<string, unknown>
  const kind = o.kind
  const label = o.label
  const since = o.since
  if (!isWaitingForKind(kind)) return undefined
  if (typeof label !== 'string' || label.trim() === '') return undefined
  if (typeof since !== 'string' || since.trim() === '') return undefined

  return {
    kind,
    label: label.trim().slice(0, 200),
    since: since.trim().slice(0, 64),
    askedFor: parseOptionalText(o.askedFor, 500),
    followUpAt: parseIsoField(o.followUpAt),
    lastPingAt: parseIsoField(o.lastPingAt),
  }
}

export function parsePlayerQuestMetadata(raw: string | null | undefined): PlayerQuestMetadata {
  if (raw == null || raw === '') return {}
  try {
    const o = JSON.parse(raw) as Record<string, unknown>
    if (typeof o !== 'object' || o === null) return {}
    const waitingFor = parseWaitingFor(o.waitingFor)
    return waitingFor ? { waitingFor } : {}
  } catch {
    return {}
  }
}

export function serializePlayerQuestMetadata(meta: PlayerQuestMetadata): string | null {
  const payload: Record<string, unknown> = {}
  if (meta.waitingFor) {
    payload.waitingFor = meta.waitingFor
  }
  if (Object.keys(payload).length === 0) return null
  return JSON.stringify(payload)
}

export function mergePlayerQuestMetadata(
  raw: string | null | undefined,
  patch: Partial<PlayerQuestMetadata>
): string | null {
  const current = parsePlayerQuestMetadata(raw)
  const next: PlayerQuestMetadata = { ...current, ...patch }
  if ('waitingFor' in patch && patch.waitingFor === undefined) {
    delete next.waitingFor
  }
  return serializePlayerQuestMetadata(next)
}

export const WAITING_FOR_KIND_LABELS: Record<WaitingForKind, string> = {
  person: 'Person',
  org: 'Organization',
  system: 'System',
  approval: 'Approval',
  other: 'Other',
}
