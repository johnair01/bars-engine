'use server'

/**
 * Campaign Lead Forge — server actions.
 * Spec: .specify/specs/campaign-lead-forge/spec.md
 *
 * Owner-facing: createManualLead, listCampaignLeads, transitionLead (steward-gated).
 * Public: submitAutomatedLead (funnel completion; no email gate — parity with the
 * Superpower quiz). All return { ok: true, ... } | { ok: false, error }.
 */
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { assertCampaignSteward, resolveCampaignInstanceId } from '@/lib/campaign-leads/auth'
import {
  canTransitionLead,
  isLeadStatus,
  parseJsonStringArray,
  type CampaignLeadRow,
  type LeadSource,
  type LeadStatus,
} from '@/lib/campaign-leads/types'

const REF_RE = /^[a-z0-9][a-z0-9-]{0,80}$/i

function inviteBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL
  return typeof raw === 'string' ? raw.replace(/\/$/, '') : ''
}

// ── createManualLead ─────────────────────────────────────────────────────────

const manualSchema = z.object({
  campaignRef: z.string().regex(REF_RE),
  name: z.string().trim().min(1).max(160),
  contact: z.string().trim().max(200).optional(),
  channel: z.string().trim().max(40).optional(),
  domain: z.string().trim().max(60).optional(),
  notes: z.string().trim().max(2000).optional(),
  actions: z.array(z.string().trim().min(1).max(400)).max(20).optional(),
  starterQuestIds: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
  roleKey: z.string().trim().max(60).optional(),
  message: z.string().trim().max(1000).optional(),
})

export type CreateManualLeadResult =
  | { ok: true; leadId: string; inviteUrl: string; token: string }
  | { ok: false; error: string }

export async function createManualLead(raw: unknown): Promise<CreateManualLeadResult> {
  const parsed = manualSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid lead.' }
  }
  const input = parsed.data

  const player = await getCurrentPlayer()
  if (!player) return { ok: false, error: 'Not signed in.' }
  if (!(await assertCampaignSteward(player.id, input.campaignRef))) {
    return { ok: false, error: 'You do not have steward access to this campaign.' }
  }

  const instanceId = await resolveCampaignInstanceId(input.campaignRef)
  const campaign = await db.campaign.findFirst({
    where: { slug: input.campaignRef },
    select: { id: true },
  })

  // Validate starter-quest ids actually resolve to quest-pool CustomBars.
  const starterQuestIds = input.starterQuestIds ?? []
  if (starterQuestIds.length > 0) {
    const found = await db.customBar.findMany({
      where: { id: { in: starterQuestIds } },
      select: { id: true },
    })
    const foundIds = new Set(found.map((b) => b.id))
    const missing = starterQuestIds.filter((id) => !foundIds.has(id))
    if (missing.length > 0) {
      return { ok: false, error: `Unknown starter quest(s): ${missing.join(', ')}` }
    }
  }

  const token = randomBytes(24).toString('base64url')

  const lead = await db.$transaction(async (tx) => {
    const invite = await tx.invite.create({
      data: {
        token,
        status: 'active',
        maxUses: 1,
        forgerId: player.id,
        instanceId: instanceId ?? undefined,
        campaignId: campaign?.id ?? undefined,
        preassignedRoleKey: input.roleKey || undefined,
        starterQuestId: starterQuestIds[0] ?? undefined,
        invitationMessage: input.message || undefined,
      },
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
        notes: input.notes || undefined,
        actionsJson: input.actions?.length ? JSON.stringify(input.actions) : undefined,
        starterQuestIdsJson: starterQuestIds.length ? JSON.stringify(starterQuestIds) : undefined,
        forgedByPlayerId: player.id,
        inviteId: invite.id,
      },
      select: { id: true },
    })
  })

  revalidatePath(`/campaign/${input.campaignRef}/leads`)
  // The warm welcome route renders the personalized orientation CYOA (falls back
  // to the generic /invite/[token] landing when a lead is absent).
  return { ok: true, leadId: lead.id, inviteUrl: `${inviteBaseUrl()}/invite/${token}/welcome`, token }
}

// ── submitAutomatedLead ──────────────────────────────────────────────────────

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

export type SubmitAutomatedLeadResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string }

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
      starterQuestIdsJson: input.offeredQuestIds?.length
        ? JSON.stringify(input.offeredQuestIds)
        : undefined,
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

export type ListCampaignLeadsResult =
  | { ok: true; leads: CampaignLeadRow[] }
  | { ok: false; error: string }

export async function listCampaignLeads(campaignRef: string): Promise<ListCampaignLeadsResult> {
  if (!REF_RE.test(campaignRef)) return { ok: false, error: 'Invalid campaign.' }

  const player = await getCurrentPlayer()
  if (!player) return { ok: false, error: 'Not signed in.' }
  if (!(await assertCampaignSteward(player.id, campaignRef))) {
    return { ok: false, error: 'You do not have steward access to this campaign.' }
  }

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

  const player = await getCurrentPlayer()
  if (!player) return { ok: false, error: 'Not signed in.' }

  const lead = await db.campaignLead.findUnique({
    where: { id: leadId },
    select: { campaignRef: true, status: true },
  })
  if (!lead) return { ok: false, error: 'Lead not found.' }

  if (!(await assertCampaignSteward(player.id, lead.campaignRef))) {
    return { ok: false, error: 'You do not have steward access to this campaign.' }
  }

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
  const player = await getCurrentPlayer()
  if (!player) return { ok: false, error: 'Not signed in.' }
  const lead = await db.campaignLead.findUnique({
    where: { id: leadId },
    select: { id: true, campaignRef: true, starterQuestIdsJson: true, inviteId: true },
  })
  if (!lead) return { ok: false, error: 'Lead not found.' }
  if (!(await assertCampaignSteward(player.id, lead.campaignRef))) {
    return { ok: false, error: 'You do not have steward access to this campaign.' }
  }
  return { ok: true, playerId: player.id, lead }
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

  const player = await getCurrentPlayer()
  if (!player) return { ok: false, error: 'Not signed in.' }
  if (!(await assertCampaignSteward(player.id, input.campaignRef))) {
    return { ok: false, error: 'You do not have steward access to this campaign.' }
  }

  const instanceId = await resolveCampaignInstanceId(input.campaignRef)
  const campaign = await db.campaign.findFirst({ where: { slug: input.campaignRef }, select: { id: true } })
  const token = randomBytes(24).toString('base64url')

  const lead = await db.$transaction(async (tx) => {
    const invite = await tx.invite.create({
      data: {
        token,
        status: 'active',
        maxUses: 1,
        forgerId: player.id,
        instanceId: instanceId ?? undefined,
        campaignId: campaign?.id ?? undefined,
      },
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
        forgedByPlayerId: player.id,
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
    include: { invite: { select: { token: true, invitationMessage: true } } },
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

/** Set the full ordered quest list; only ids already matched to the lead are honored. */
export async function reorderLeadQuests(leadId: string, orderedIds: string[]): Promise<TransitionLeadResult> {
  const guard = await guardLead(leadId)
  if (!guard.ok) return guard
  const current = new Set(parseJsonStringArray(guard.lead.starterQuestIdsJson))
  const next = (Array.isArray(orderedIds) ? orderedIds : []).filter((id) => current.has(id))
  // Must be a true permutation of the current set — reject duplicates and omissions
  // (e.g. ['a','a'] for {a,b} passes a length check but drops 'b' and doubles 'a').
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

export type ListCollectiveResult =
  | { ok: true; leads: CollectiveLeadRow[] }
  | { ok: false; error: string }

export async function listCollectiveLeads(campaignRef: string): Promise<ListCollectiveResult> {
  if (!REF_RE.test(campaignRef)) return { ok: false, error: 'Invalid campaign.' }
  const player = await getCurrentPlayer()
  if (!player) return { ok: false, error: 'Not signed in.' }
  if (!(await assertCampaignSteward(player.id, campaignRef))) {
    return { ok: false, error: 'You do not have steward access to this campaign.' }
  }
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
      mine: r.forgedBy?.id === player.id,
    })),
  }
}

/** Adopt a published lead: clone name/contact/domain into a fresh lead you own (private notes never travel). */
export async function adoptCollectiveLead(leadId: string): Promise<QuickAddLeadResult> {
  const player = await getCurrentPlayer()
  if (!player) return { ok: false, error: 'Not signed in.' }
  const source = await db.campaignLead.findUnique({
    where: { id: leadId },
    select: { campaignRef: true, collective: true, name: true, contact: true, channel: true, domain: true },
  })
  if (!source || !source.collective) return { ok: false, error: 'That lead is not in the collective.' }
  if (!(await assertCampaignSteward(player.id, source.campaignRef))) {
    return { ok: false, error: 'You do not have steward access to this campaign.' }
  }

  const instanceId = await resolveCampaignInstanceId(source.campaignRef)
  const campaign = await db.campaign.findFirst({ where: { slug: source.campaignRef }, select: { id: true } })
  const token = randomBytes(24).toString('base64url')

  const clone = await db.$transaction(async (tx) => {
    const invite = await tx.invite.create({
      data: {
        token,
        status: 'active',
        maxUses: 1,
        forgerId: player.id,
        instanceId: instanceId ?? undefined,
        campaignId: campaign?.id ?? undefined,
      },
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
        forgedByPlayerId: player.id,
        inviteId: invite.id,
      },
      select: { id: true },
    })
  })

  revalidatePath(`/campaign/${source.campaignRef}/leads`)
  return { ok: true, leadId: clone.id }
}
