export const WAITING_FOR_KINDS = [
  'person',
  'org',
  'system',
  'approval',
  'other',
] as const

export type WaitingForKind = (typeof WAITING_FOR_KINDS)[number]

export type WaitingForState = {
  kind: WaitingForKind
  label: string
  since: string
  askedFor?: string
  followUpAt?: string
  lastPingAt?: string
}

export type PlayerQuestMetadata = {
  waitingFor?: WaitingForState
}

export function isWaitingForKind(value: unknown): value is WaitingForKind {
  return typeof value === 'string' && (WAITING_FOR_KINDS as readonly string[]).includes(value)
}
