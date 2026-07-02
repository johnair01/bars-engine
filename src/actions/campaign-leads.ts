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

  revalidatePath(`/admin/campaigns/${input.campaignRef}/leads`)
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

  revalidatePath(`/admin/campaigns/${input.campaignRef}/leads`)
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
  revalidatePath(`/admin/campaigns/${lead.campaignRef}/leads`)
  return { ok: true }
}
