/**
 * Campaign Lead Forge — shared types + status machine.
 * Spec: .specify/specs/campaign-lead-forge/spec.md
 *
 * A "lead" is a prospective player for a campaign, either hand-forged by an owner
 * (source `manual`) or self-created through the /campaign/[ref]/begin funnel
 * (source `automated`). Both share one owner board and one status machine.
 * Deterministic — no AI, no I/O in this module.
 */

export const LEAD_STATUSES = ['new', 'contacted', 'accepted', 'declined', 'onboarded'] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const LEAD_SOURCES = ['manual', 'automated'] as const
export type LeadSource = (typeof LEAD_SOURCES)[number]

/** Follow-up board chip metadata (mirrors The Crossing's STATUS_META palette). */
export const LEAD_STATUS_META: Record<LeadStatus, { label: string; color: string }> = {
  new: { label: 'New', color: '#d4a017' },
  contacted: { label: 'Contacted', color: '#3a93c8' },
  accepted: { label: 'Accepted', color: '#2ecc71' },
  declined: { label: 'Not now', color: '#8e7d76' },
  onboarded: { label: 'Onboarded', color: '#a855f7' },
}

/**
 * Allowed status transitions. `new → contacted → accepted → onboarded`, with
 * `declined` reachable from the live states and `new` recoverable. `onboarded`
 * is terminal.
 */
export const LEAD_TRANSITIONS: Record<LeadStatus, readonly LeadStatus[]> = {
  new: ['contacted', 'accepted', 'declined'],
  contacted: ['accepted', 'declined', 'new'],
  accepted: ['onboarded', 'declined'],
  declined: ['new'],
  onboarded: [],
}

export function isLeadStatus(v: unknown): v is LeadStatus {
  return typeof v === 'string' && (LEAD_STATUSES as readonly string[]).includes(v)
}

/** True if `from → to` is a legal transition (or a no-op to the same status). */
export function canTransitionLead(from: LeadStatus, to: LeadStatus): boolean {
  if (from === to) return true
  return LEAD_TRANSITIONS[from].includes(to)
}

/** Parse a persisted JSON string[] column defensively → always an array. */
export function parseJsonStringArray(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === 'string')
    return []
  } catch {
    return []
  }
}

/** A lead as rendered on the owner board (JSON columns already parsed). */
export interface CampaignLeadRow {
  id: string
  campaignRef: string
  source: LeadSource
  status: LeadStatus
  name: string | null
  contact: string | null
  channel: string | null
  domain: string | null
  superpower: string | null
  superpowerOrientation: string | null
  notes: string | null
  actions: string[]
  starterQuestIds: string[]
  mythsSeen: string[]
  inviteId: string | null
  latentIntakeId: string | null
  createdAt: string // ISO
  forgedByName: string | null
}
