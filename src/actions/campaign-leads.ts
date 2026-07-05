'use server'

/**
 * Campaign Lead Forge — server actions.
 * Spec: .specify/specs/campaign-lead-forge/spec.md
 *
 * Owner-facing actions are steward-gated through the single `stewardGuard` /
 * `guardLead` chokepoint. Public: submitAutomatedLead (funnel completion; no email
 * gate — parity with the Superpower quiz). All return { ok, ... } | { ok:false, error }.
 */
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { stewardGuard } from '@/lib/campaign-leads/auth'
import { leadInviteData, newInviteToken, resolveInviteTargets } from '@/lib/campaign-leads/invite'
import {
  canTransitionLead,
  isLeadStatus,
  parseJsonStringArray,
  type CampaignLeadRow,
  type LeadSource,
  type LeadStatus,
} from '@/lib/campaign-leads/types'

const REF_RE = /^[a-z0-9][a-z0-9-]{0,80}$/i

// ── submitAutomatedLead (public) ─────────────────────────────────────────────

const automatedSchema = z.object({
  campaignRef: z.string().regex(REF_RE),
  name: z.string().trim().max(160).optional(),
  contact: z.string().trim().max(200).optional(),
  superpower: z.string().trim().min(1).max(60),
  superpowerOrientation: z.enum(['internal', 'external']).nullable().optional(),
  mythsSeen: z.array(z.string().trim().min(1).max(120)).max(40).optional(),
  domain: z.string().trim().min(1).max(60),
  offeredQuestIds: z.array(z.string().trim().min(1).max(120)).max(40).optional(),
  clientSessionId: z.string().trim().min(8).max(128).optional(),
  latentIntakeId: z.string().trim().min(1).max(120).optional(),
})

export type SubmitAutomatedLeadResult = { ok: true; leadId: string } | { ok: false; error: string }

export async function submitAutomatedLead(raw: unknown): Promise<SubmitAutomatedLeadResult> {
  const parsed = automatedSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid submission.' }
  }
  const input = parsed.data

  // Public action — a player may or may not be signed in.
  const player = await getCurrentPlayer()

  const lead = await db.campaignLead.create({
    data: {
      campaignRef: input.campaignRef,
      source: 'automated',
      status: 'new',
      name: input.name || undefined,
      contact: input.contact || undefined,
      domain: input.domain,
      superpower: input.superpower,
      superpowerOrientation: input.superpowerOrientation ?? undefined,
      mythsSeenJson: input.mythsSeen?.length ? JSON.stringify(input.mythsSeen) : undefined,
      starterQuestIdsJson: input.offeredQuestIds?.length ? JSON.stringify(input.offeredQuestIds) : undefined,
      claimedByPlayerId: player?.id ?? undefined,
      latentIntakeId: input.latentIntakeId ?? undefined,
      clientSessionId: input.clientSessionId ?? undefined,
    },
    select: { id: true },
  })

  revalidatePath(`/campaign/${input.campaignRef}/leads`)
  return { ok: true, leadId: lead.id }
}

// ── listCampaignLeads ────────────────────────────────────────────────────────

export type ListCampaignLeadsResult = { ok: true; leads: CampaignLeadRow[] } | { ok: false; error: string }

export async function listCampaignLeads(campaignRef: string): Promise<ListCampaignLeadsResult> {
  if (!REF_RE.test(campaignRef)) return { ok: false, error: 'Invalid campaign.' }
  const guard = await stewardGuard(campaignRef)
  if (!guard.ok) return guard

  const rows = await db.campaignLead.findMany({
    where: { campaignRef },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: { forgedBy: { select: { name: true } } },
  })

  const leads: CampaignLeadRow[] = rows.map((r) => ({
    id: r.id,
    campaignRef: r.campaignRef,
    source: (r.source as LeadSource) ?? 'manual',
    status: (isLeadStatus(r.status) ? r.status : 'new') as LeadStatus,
    name: r.name,
    contact: r.contact,
    channel: r.channel,
    domain: r.domain,
    superpower: r.superpower,
    superpowerOrientation: r.superpowerOrientation,
    collective: r.collective,
    notes: r.notes,
    actions: parseJsonStringArray(r.actionsJson),
    starterQuestIds: parseJsonStringArray(r.starterQuestIdsJson),
    mythsSeen: parseJsonStringArray(r.mythsSeenJson),
    inviteId: r.inviteId,
    latentIntakeId: r.latentIntakeId,
    createdAt: r.createdAt.toISOString(),
    forgedByName: r.forgedBy?.name ?? null,
  }))

  return { ok: true, leads }
}

// ── transitionLead ───────────────────────────────────────────────────────────

export type TransitionLeadResult = { ok: true } | { ok: false; error: string }

export async function transitionLead(leadId: string, toStatus: string): Promise<TransitionLeadResult> {
  if (!isLeadStatus(toStatus)) return { ok: false, error: 'Unknown status.' }

  const lead = await db.campaignLead.findUnique({
    where: { id: leadId },
    select: { campaignRef: true, status: true },
  })
  if (!lead) return { ok: false, error: 'Lead not found.' }

  const guard = await stewardGuard(lead.campaignRef)
  if (!guard.ok) return guard

  const from = (isLeadStatus(lead.status) ? lead.status : 'new') as LeadStatus
  if (!canTransitionLead(from, toStatus)) {
    return { ok: false, error: `Cannot move a lead from ${from} to ${toStatus}.` }
  }

  await db.campaignLead.update({ where: { id: leadId }, data: { status: toStatus } })
  revalidatePath(`/campaign/${lead.campaignRef}/leads`)
  return { ok: true }
}

// ── Phase 6: Warm Roster + per-lead workspace ────────────────────────────────

/** Load a lead and verify the current player may steward its campaign. */
async function guardLead(leadId: string): Promise<
  | { ok: true; playerId: string; lead: { id: string; campaignRef: string; starterQuestIdsJson: string | null; inviteId: string | null } }
  | { ok: false; error: string }
> {
  const lead = await db.campaignLead.findUnique({
    where: { id: leadId },
    select: { id: true, campaignRef: true, starterQuestIdsJson: true, inviteId: true },
  })
  if (!lead) return { ok: false, error: 'Lead not found.' }
  const guard = await stewardGuard(lead.campaignRef)
  if (!guard.ok) return guard
  return { ok: true, playerId: guard.playerId, lead }
}

const quickAddSchema = z.object({
  campaignRef: z.string().regex(REF_RE),
  name: z.string().trim().min(1).max(160),
  contact: z.string().trim().max(200).optional(),
  channel: z.string().trim().max(40).optional(),
  domain: z.string().trim().max(60).optional(),
})

export type QuickAddLeadResult = { ok: true; leadId: string } | { ok: false; error: string }

/** Lightweight add: create the lead + its tailored Invite; caller opens the workspace. */
export async function quickAddLead(raw: unknown): Promise<QuickAddLeadResult> {
  const parsed = quickAddSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid lead.' }
  const input = parsed.data

  const guard = await stewardGuard(input.campaignRef)
  if (!guard.ok) return guard

  const targets = await resolveInviteTargets(input.campaignRef)
  const token = newInviteToken()

  const lead = await db.$transaction(async (tx) => {
    const invite = await tx.invite.create({
      data: leadInviteData({ token, playerId: guard.playerId, targets }),
      select: { id: true },
    })
    return tx.campaignLead.create({
      data: {
        campaignRef: input.campaignRef,
        source: 'manual',
        status: 'new',
        name: input.name,
        contact: input.contact || undefined,
        channel: input.channel || undefined,
        domain: input.domain || undefined,
        forgedByPlayerId: guard.playerId,
        inviteId: invite.id,
      },
      select: { id: true },
    })
  })

  revalidatePath(`/campaign/${input.campaignRef}/leads`)
  return { ok: true, leadId: lead.id }
}

export interface LeadDetail {
  id: string
  campaignRef: string
  status: LeadStatus
  source: LeadSource
  name: string | null
  contact: string | null
  channel: string | null
  domain: string | null
  superpower: string | null
  goals: string | null
  notes: string | null
  roleKey: string | null
  collective: boolean
  actions: string[]
  message: string | null
  quests: { id: string; title: string; domain: string | null }[]
  inviteToken: string | null
  createdAt: string
}

export type GetLeadResult = { ok: true; lead: LeadDetail } | { ok: false; error: string }

export async function getLead(leadId: string): Promise<GetLeadResult> {
  const guard = await guardLead(leadId)
  if (!guard.ok) return guard

  const row = await db.campaignLead.findUnique({
    where: { id: leadId },
    include: { invite: { select: { token: true, invitationMessage: true, preassignedRoleKey: true } } },
  })
  if (!row) return { ok: false, error: 'Lead not found.' }

  const questIds = parseJsonStringArray(row.starterQuestIdsJson)
  const bars = questIds.length
    ? await db.customBar.findMany({ where: { id: { in: questIds } }, select: { id: true, title: true, allyshipDomain: true } })
    : []
  const byId = new Map(bars.map((b) => [b.id, b]))
  const quests = questIds
    .map((id) => byId.get(id))
    .filter((b): b is { id: string; title: string; allyshipDomain: string | null } => Boolean(b))
    .map((b) => ({ id: b.id, title: b.title, domain: b.allyshipDomain }))

  return {
    ok: true,
    lead: {
      id: row.id,
      campaignRef: row.campaignRef,
      status: (isLeadStatus(row.status) ? row.status : 'new') as LeadStatus,
      source: (row.source as LeadSource) ?? 'manual',
      name: row.name,
      contact: row.contact,
      channel: row.channel,
      domain: row.domain,
      superpower: row.superpower,
      goals: row.goals,
      notes: row.notes,
      roleKey: row.invite?.preassignedRoleKey ?? null,
      collective: row.collective,
      actions: parseJsonStringArray(row.actionsJson),
      message: row.invite?.invitationMessage ?? null,
      quests,
      inviteToken: row.invite?.token ?? null,
      createdAt: row.createdAt.toISOString(),
    },
  }
}

export async function setLeadGoals(leadId: string, goals: string): Promise<TransitionLeadResult> {
  const guard = await guardLead(leadId)
  if (!guard.ok) return guard
  await db.campaignLead.update({ where: { id: leadId }, data: { goals: goals.trim().slice(0, 4000) || null } })
  revalidatePath(`/campaign/${guard.lead.campaignRef}/leads/${leadId}`)
  return { ok: true }
}

export async function setLeadNotes(leadId: string, notes: string): Promise<TransitionLeadResult> {
  const guard = await guardLead(leadId)
  if (!guard.ok) return guard
  await db.campaignLead.update({ where: { id: leadId }, data: { notes: notes.trim().slice(0, 2000) || null } })
  revalidatePath(`/campaign/${guard.lead.campaignRef}/leads/${leadId}`)
  return { ok: true }
}

export async function setLeadActions(leadId: string, actions: string[]): Promise<TransitionLeadResult> {
  const guard = await guardLead(leadId)
  if (!guard.ok) return guard
  const clean = (Array.isArray(actions) ? actions : [])
    .map((a) => String(a).trim().slice(0, 400))
    .filter(Boolean)
    .slice(0, 20)
  await db.campaignLead.update({
    where: { id: leadId },
    data: { actionsJson: clean.length ? JSON.stringify(clean) : null },
  })
  revalidatePath(`/campaign/${guard.lead.campaignRef}/leads/${leadId}`)
  return { ok: true }
}

export async function setLeadMessage(leadId: string, message: string): Promise<TransitionLeadResult> {
  const guard = await guardLead(leadId)
  if (!guard.ok) return guard
  if (!guard.lead.inviteId) return { ok: false, error: 'This lead has no invite.' }
  await db.invite.update({
    where: { id: guard.lead.inviteId },
    data: { invitationMessage: message.trim().slice(0, 1000) || null },
  })
  revalidatePath(`/campaign/${guard.lead.campaignRef}/leads/${leadId}`)
  return { ok: true }
}

/** Set the campaign role the invitee is preassigned on accept (Invite.preassignedRoleKey). */
export async function setLeadRole(leadId: string, roleKey: string): Promise<TransitionLeadResult> {
  const guard = await guardLead(leadId)
  if (!guard.ok) return guard
  if (!guard.lead.inviteId) return { ok: false, error: 'This lead has no invite.' }
  await db.invite.update({
    where: { id: guard.lead.inviteId },
    data: { preassignedRoleKey: roleKey.trim().slice(0, 60) || null },
  })
  revalidatePath(`/campaign/${guard.lead.campaignRef}/leads/${leadId}`)
  return { ok: true }
}

export async function addLeadQuest(leadId: string, questId: string): Promise<TransitionLeadResult> {
  const guard = await guardLead(leadId)
  if (!guard.ok) return guard
  const bar = await db.customBar.findUnique({ where: { id: questId }, select: { id: true } })
  if (!bar) return { ok: false, error: 'Unknown quest.' }
  const current = parseJsonStringArray(guard.lead.starterQuestIdsJson)
  if (current.includes(questId)) return { ok: true }
  const next = [...current, questId]
  await db.campaignLead.update({ where: { id: leadId }, data: { starterQuestIdsJson: JSON.stringify(next) } })
  revalidatePath(`/campaign/${guard.lead.campaignRef}/leads/${leadId}`)
  return { ok: true }
}

export async function removeLeadQuest(leadId: string, questId: string): Promise<TransitionLeadResult> {
  const guard = await guardLead(leadId)
  if (!guard.ok) return guard
  const next = parseJsonStringArray(guard.lead.starterQuestIdsJson).filter((id) => id !== questId)
  await db.campaignLead.update({
    where: { id: leadId },
    data: { starterQuestIdsJson: next.length ? JSON.stringify(next) : null },
  })
  revalidatePath(`/campaign/${guard.lead.campaignRef}/leads/${leadId}`)
  return { ok: true }
}

/** Set the full ordered quest list; must be a true permutation of the current set. */
export async function reorderLeadQuests(leadId: string, orderedIds: string[]): Promise<TransitionLeadResult> {
  const guard = await guardLead(leadId)
  if (!guard.ok) return guard
  const current = new Set(parseJsonStringArray(guard.lead.starterQuestIdsJson))
  const next = (Array.isArray(orderedIds) ? orderedIds : []).filter((id) => current.has(id))
  // Reject duplicates and omissions (['a','a'] for {a,b} passes a length check but
  // drops 'b' and doubles 'a').
  const nextSet = new Set(next)
  if (next.length !== current.size || nextSet.size !== current.size) {
    return { ok: false, error: 'Order must include exactly the current quests.' }
  }
  await db.campaignLead.update({ where: { id: leadId }, data: { starterQuestIdsJson: JSON.stringify(next) } })
  revalidatePath(`/campaign/${guard.lead.campaignRef}/leads/${leadId}`)
  return { ok: true }
}

export async function publishLeadToCollective(leadId: string): Promise<TransitionLeadResult> {
  const guard = await guardLead(leadId)
  if (!guard.ok) return guard
  await db.campaignLead.update({ where: { id: leadId }, data: { collective: true } })
  revalidatePath(`/campaign/${guard.lead.campaignRef}/leads/${leadId}`)
  return { ok: true }
}

export async function unpublishLead(leadId: string): Promise<TransitionLeadResult> {
  const guard = await guardLead(leadId)
  if (!guard.ok) return guard
  await db.campaignLead.update({ where: { id: leadId }, data: { collective: false } })
  revalidatePath(`/campaign/${guard.lead.campaignRef}/leads/${leadId}`)
  return { ok: true }
}

export interface CollectiveLeadRow {
  id: string
  name: string | null
  domain: string | null
  superpower: string | null
  forgedByName: string | null
  mine: boolean
}

export type ListCollectiveResult = { ok: true; leads: CollectiveLeadRow[] } | { ok: false; error: string }

export async function listCollectiveLeads(campaignRef: string): Promise<ListCollectiveResult> {
  if (!REF_RE.test(campaignRef)) return { ok: false, error: 'Invalid campaign.' }
  const guard = await stewardGuard(campaignRef)
  if (!guard.ok) return guard

  const rows = await db.campaignLead.findMany({
    where: { campaignRef, collective: true },
    orderBy: { createdAt: 'desc' },
    include: { forgedBy: { select: { id: true, name: true } } },
  })
  return {
    ok: true,
    leads: rows.map((r) => ({
      id: r.id,
      name: r.name,
      domain: r.domain,
      superpower: r.superpower,
      forgedByName: r.forgedBy?.name ?? null,
      mine: r.forgedBy?.id === guard.playerId,
    })),
  }
}

/** Adopt a published lead: clone name/contact/domain into a fresh lead you own (private notes never travel). */
export async function adoptCollectiveLead(leadId: string): Promise<QuickAddLeadResult> {
  const source = await db.campaignLead.findUnique({
    where: { id: leadId },
    select: { campaignRef: true, collective: true, name: true, contact: true, channel: true, domain: true },
  })
  if (!source || !source.collective) return { ok: false, error: 'That lead is not in the collective.' }

  const guard = await stewardGuard(source.campaignRef)
  if (!guard.ok) return guard

  const targets = await resolveInviteTargets(source.campaignRef)
  const token = newInviteToken()

  const clone = await db.$transaction(async (tx) => {
    const invite = await tx.invite.create({
      data: leadInviteData({ token, playerId: guard.playerId, targets }),
      select: { id: true },
    })
    return tx.campaignLead.create({
      data: {
        campaignRef: source.campaignRef,
        source: 'manual',
        status: 'new',
        name: source.name,
        contact: source.contact,
        channel: source.channel,
        domain: source.domain,
        forgedByPlayerId: guard.playerId,
        inviteId: invite.id,
      },
      select: { id: true },
    })
  })

  revalidatePath(`/campaign/${source.campaignRef}/leads`)
  return { ok: true, leadId: clone.id }
}
