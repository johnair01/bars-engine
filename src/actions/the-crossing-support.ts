'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import {
  getTheCrossingSupportRole,
  parseContribution,
  recipientsOf,
  THE_CROSSING_CAMPAIGN_REF,
  THE_CROSSING_CHANNELS,
  THE_CROSSING_PARENT_CAMPAIGN_REF,
  type TheCrossingChannel,
  type TheCrossingStatus,
  type TheCrossingSupportRole,
} from '@/lib/the-crossing-support-moves'
import { assertCanEditInstanceDonation } from '@/actions/donation-cta'

const SOURCE = 'the_crossing_campaign_landing_page'
const SUPPORT_EVIDENCE_KIND = 'support_intake'
const STATE_EVIDENCE_KIND = 'campaign_state'
const STATE_BAR_ID = 'the-crossing-campaign-state'

type ActionResult = { success: true } | { success: false; error: string }

function clean(value: FormDataEntryValue | null, max = 1000): string {
  return String(value ?? '').trim().slice(0, max)
}

/** The signed-in player id from the session cookie. Never trust a client arg. */
async function currentPlayerId(): Promise<string | null> {
  const store = await cookies()
  return store.get('bars_player_id')?.value ?? null
}

function parseChannel(value: FormDataEntryValue | null): TheCrossingChannel {
  const c = clean(value, 40).toLowerCase()
  return THE_CROSSING_CHANNELS.includes(c as TheCrossingChannel)
    ? (c as TheCrossingChannel)
    : 'text'
}

function parseAmount(value: FormDataEntryValue | null): number | null {
  const raw = clean(value, 40).replace(/[^0-9.]/g, '')
  if (!raw) return null
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/**
 * Resolve the steward player who administratively owns public (unauthenticated)
 * contribution BARs. Exported so steward authorization can compare against it.
 */
export async function findStewardPlayerId(): Promise<string | null> {
  const envPlayerId = process.env.THE_CROSSING_STEWARD_PLAYER_ID?.trim()
  if (envPlayerId) {
    const player = await db.player.findUnique({ where: { id: envPlayerId }, select: { id: true } })
    if (player) return player.id
  }

  const crossingCampaign = await db.campaign.findFirst({
    where: { slug: THE_CROSSING_CAMPAIGN_REF },
    select: { createdById: true },
  })
  if (crossingCampaign?.createdById) return crossingCampaign.createdById

  const parentCampaign = await db.campaign.findFirst({
    where: {
      OR: [
        { slug: THE_CROSSING_PARENT_CAMPAIGN_REF },
        { instance: { campaignRef: THE_CROSSING_PARENT_CAMPAIGN_REF } },
      ],
    },
    select: { createdById: true },
  })
  if (parentCampaign?.createdById) return parentCampaign.createdById

  const parentInstance = await db.instance.findFirst({
    where: {
      OR: [{ slug: THE_CROSSING_PARENT_CAMPAIGN_REF }, { campaignRef: THE_CROSSING_PARENT_CAMPAIGN_REF }],
    },
    select: { id: true },
  })
  if (parentInstance) {
    const membership = await db.instanceMembership.findFirst({
      where: { instanceId: parentInstance.id, roleKey: { in: ['owner', 'steward'] } },
      orderBy: { createdAt: 'asc' },
      select: { playerId: true },
    })
    if (membership?.playerId) return membership.playerId
  }

  const firstPlayer = await db.player.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } })
  return firstPlayer?.id ?? null
}

/**
 * True if `playerId` may steward The Crossing: the resolved steward, a global
 * admin, or an owner/steward of the campaign instance. Re-checked server-side
 * on every steward action — never trust client state.
 */
export async function assertSteward(
  playerId: string | null | undefined,
  campaignRef: string = THE_CROSSING_CAMPAIGN_REF,
): Promise<boolean> {
  if (!playerId) return false

  const stewardId = await findStewardPlayerId()
  if (stewardId && stewardId === playerId) return true

  const instance = await db.instance.findFirst({
    where: { OR: [{ campaignRef }, { slug: campaignRef }] },
    select: { id: true },
  })
  if (instance) return assertCanEditInstanceDonation(playerId, instance.id)

  return false
}

// ─── Contribution capture ────────────────────────────────────────────────────

type CaptureFields = {
  contributorName: string
  contributorContact: string
  channel: TheCrossingChannel
  offerSummary: string
  detail: string
  url: string
  amount: number | null
}

function initialStatus(role: TheCrossingSupportRole): TheCrossingStatus {
  return role.isDonor ? 'accepted' : 'new'
}

/** Create the campaign-captured CustomBar for one contribution. Returns its id. */
async function createContributionBar(
  role: TheCrossingSupportRole,
  fields: CaptureFields,
): Promise<string> {
  const stewardPlayerId = await findStewardPlayerId()
  if (!stewardPlayerId) {
    redirect(`/campaign/the-crossing/move/${role.id}?error=steward`)
  }

  const starterCardId = role.starterCardIds[0] ?? null
  const title = `[${role.label}] ${fields.offerSummary}`

  const contextLines = JSON.stringify({
    contributorName: fields.contributorName,
    contributorContact: fields.contributorContact,
    channel: fields.channel,
    role: role.id,
    roleLabel: role.label,
    offerSummary: fields.offerSummary,
    detail: fields.detail || null,
    url: fields.url || null,
    amount: fields.amount,
    status: initialStatus(role),
    notified: false,
    notes: [] as string[],
    createdAt: new Date().toISOString(),
  })

  const bar = await db.customBar.create({
    data: {
      creatorId: stewardPlayerId,
      title,
      description: fields.detail || fields.offerSummary,
      type: 'vibe',
      reward: 0,
      visibility: 'private',
      status: 'active',
      inputs: '[]',
      rootId: 'temp',
      campaignRef: THE_CROSSING_CAMPAIGN_REF,
      allyshipDomain: role.primaryDomain,
      moveType: 'show_up',
      evidenceKind: SUPPORT_EVIDENCE_KIND,
      contextLines,
      docQuestMetadata: JSON.stringify({
        source: SOURCE,
        parentCampaignRef: THE_CROSSING_PARENT_CAMPAIGN_REF,
        campaignLineage: [THE_CROSSING_PARENT_CAMPAIGN_REF, THE_CROSSING_CAMPAIGN_REF],
        artifact: role.artifact,
        tinyMove: role.tinyMove,
        element: role.element,
        starterCardId,
        starterCardIds: role.starterCardIds,
        secondaryDomains: role.secondaryDomains,
      }),
      agentMetadata: JSON.stringify({
        sourceType: 'campaign_support_intake',
        campaignRef: THE_CROSSING_CAMPAIGN_REF,
        parentCampaignRef: THE_CROSSING_PARENT_CAMPAIGN_REF,
      }),
    },
    select: { id: true },
  })

  await db.customBar.update({ where: { id: bar.id }, data: { rootId: bar.id } })
  return bar.id
}

/**
 * New CYOA capture (screens 06–08). Reads channel + donor amount, creates the
 * BAR, and redirects to the "Saved as a BAR" confirmation. No account required.
 */
export async function submitTheCrossingMove(formData: FormData) {
  const roleId = clean(formData.get('role'), 80)
  const role = getTheCrossingSupportRole(roleId)
  if (!role) redirect('/campaign/the-crossing?error=role')

  const fields: CaptureFields = {
    contributorName: clean(formData.get('name'), 120),
    contributorContact: clean(formData.get('contact'), 180),
    channel: parseChannel(formData.get('channel')),
    offerSummary: clean(formData.get('offerSummary'), 180),
    detail: clean(formData.get('details'), 2400),
    url: clean(formData.get('url'), 500),
    amount: role.isDonor ? parseAmount(formData.get('amount')) : null,
  }

  if (!fields.contributorName || !fields.contributorContact || !fields.offerSummary) {
    redirect(`/campaign/the-crossing/move/${role.id}?error=missing`)
  }

  const barId = await createContributionBar(role, fields)

  revalidatePath('/campaign/the-crossing/steward')
  redirect(`/campaign/the-crossing/move/${role.id}/saved?bar=${encodeURIComponent(barId)}`)
}

/**
 * Legacy capture used by the inline `TheCrossingSupportSection` on the
 * `/campaign/[ref]` landing. Kept for back-compat until that surface is retired
 * (see spec § Phase 7). Defaults channel=text, no donor amount.
 */
export async function submitTheCrossingSupport(formData: FormData) {
  const roleId = clean(formData.get('role'), 80)
  const role = getTheCrossingSupportRole(roleId)
  if (!role) redirect('/campaign/the-crossing?error=role')

  const fields: CaptureFields = {
    contributorName: clean(formData.get('name'), 120),
    contributorContact: clean(formData.get('contact'), 180),
    channel: parseChannel(formData.get('channel')),
    offerSummary: clean(formData.get('offerSummary'), 180),
    detail: clean(formData.get('details'), 2400),
    url: clean(formData.get('url'), 500),
    amount: role.isDonor ? parseAmount(formData.get('amount')) : null,
  }

  if (!fields.contributorName || !fields.contributorContact || !fields.offerSummary) {
    redirect(`/campaign/the-crossing?role=${encodeURIComponent(role.id)}&error=missing`)
  }

  await createContributionBar(role, fields)

  revalidatePath('/campaign/the-crossing')
  redirect(`/campaign/the-crossing?thanks=1&role=${encodeURIComponent(role.id)}`)
}

// ─── Steward: status machine ─────────────────────────────────────────────────

export type StewardTransitionAction = 'log_message' | 'mark_contacted' | 'accept' | 'decline'

/**
 * Apply a steward status transition to one contribution, rewriting
 * `contextLines`. `log_message` appends `You: "…"` to the activity log and
 * advances new → contacted. Authorization is enforced server-side.
 */
export async function stewardTransitionContribution(input: {
  barId: string
  action: StewardTransitionAction
  message?: string
}): Promise<ActionResult> {
  if (!(await assertSteward(await currentPlayerId()))) {
    return { success: false, error: 'Not authorized to steward this campaign.' }
  }

  const bar = await db.customBar.findFirst({
    where: {
      id: input.barId,
      campaignRef: THE_CROSSING_CAMPAIGN_REF,
      evidenceKind: SUPPORT_EVIDENCE_KIND,
    },
    select: { id: true, contextLines: true },
  })
  if (!bar) return { success: false, error: 'Contribution not found.' }

  let ctx: Record<string, unknown> = {}
  try {
    ctx = bar.contextLines ? (JSON.parse(bar.contextLines) as Record<string, unknown>) : {}
  } catch {
    ctx = {}
  }

  const current = (ctx.status as TheCrossingStatus) ?? 'new'
  const notes = Array.isArray(ctx.notes) ? (ctx.notes as unknown[]).filter((n) => typeof n === 'string') : []

  let next: TheCrossingStatus = current
  switch (input.action) {
    case 'log_message': {
      const message = (input.message ?? '').trim().slice(0, 2000)
      if (!message) return { success: false, error: 'Write a message before logging it.' }
      notes.push(`You: "${message}"`)
      if (current === 'new') next = 'contacted'
      break
    }
    case 'mark_contacted':
      if (current === 'new') next = 'contacted'
      break
    case 'accept':
      if (current === 'new' || current === 'contacted') next = 'accepted'
      break
    case 'decline':
      if (current !== 'thanked') next = 'declined'
      break
  }

  ctx.status = next
  ctx.notes = notes

  await db.customBar.update({
    where: { id: bar.id },
    data: { contextLines: JSON.stringify(ctx) },
  })

  revalidatePath('/campaign/the-crossing/steward')
  revalidatePath(`/campaign/the-crossing/steward/contributor/${bar.id}`)
  return { success: true }
}

// ─── Steward: campaign state (carPurchased / thanked) ────────────────────────

export type TheCrossingCampaignState = { carPurchased: boolean; thanked: boolean }

/** Read the singleton campaign-state BAR (carPurchased / thanked). */
export async function getCampaignState(): Promise<TheCrossingCampaignState> {
  const bar = await db.customBar.findFirst({
    where: { id: STATE_BAR_ID, evidenceKind: STATE_EVIDENCE_KIND },
    select: { contextLines: true },
  })
  if (!bar?.contextLines) return { carPurchased: false, thanked: false }
  try {
    const ctx = JSON.parse(bar.contextLines) as Partial<TheCrossingCampaignState>
    return { carPurchased: ctx.carPurchased === true, thanked: ctx.thanked === true }
  } catch {
    return { carPurchased: false, thanked: false }
  }
}

async function writeCampaignState(patch: Partial<TheCrossingCampaignState>): Promise<void> {
  const stewardPlayerId = await findStewardPlayerId()
  if (!stewardPlayerId) return
  const current = await getCampaignState()
  const nextState: TheCrossingCampaignState = { ...current, ...patch }
  const contextLines = JSON.stringify(nextState)

  await db.customBar.upsert({
    where: { id: STATE_BAR_ID },
    update: { contextLines },
    create: {
      id: STATE_BAR_ID,
      creatorId: stewardPlayerId,
      title: 'The Crossing — campaign state',
      description: 'Singleton steward state for The Crossing (carPurchased / thanked).',
      type: 'vibe',
      reward: 0,
      visibility: 'private',
      status: 'active',
      inputs: '[]',
      rootId: STATE_BAR_ID,
      campaignRef: THE_CROSSING_CAMPAIGN_REF,
      evidenceKind: STATE_EVIDENCE_KIND,
      contextLines,
    },
  })
}

/** Mark the car purchased; reveals the thank-you path. */
export async function stewardMarkCarPurchased(): Promise<ActionResult> {
  if (!(await assertSteward(await currentPlayerId()))) {
    return { success: false, error: 'Not authorized to steward this campaign.' }
  }
  await writeCampaignState({ carPurchased: true })
  revalidatePath('/campaign/the-crossing/steward')
  return { success: true }
}

/**
 * Broadcast the thank-you: every non-declined contribution becomes
 * `thanked` + `notified`. Sets campaign `thanked`. Returns recipient count.
 */
export async function stewardBroadcastThankYou(input: {
  message?: string
} = {}): Promise<{ success: true; recipients: number } | { success: false; error: string }> {
  void input
  if (!(await assertSteward(await currentPlayerId()))) {
    return { success: false, error: 'Not authorized to steward this campaign.' }
  }

  const bars = await db.customBar.findMany({
    where: { campaignRef: THE_CROSSING_CAMPAIGN_REF, evidenceKind: SUPPORT_EVIDENCE_KIND },
    select: { id: true, contextLines: true, createdAt: true },
  })

  const contributions = bars.map(parseContribution)
  const recipientCount = recipientsOf(contributions).length

  await Promise.all(
    bars.map(async (bar) => {
      let ctx: Record<string, unknown> = {}
      try {
        ctx = bar.contextLines ? (JSON.parse(bar.contextLines) as Record<string, unknown>) : {}
      } catch {
        ctx = {}
      }
      if (ctx.status === 'declined') return
      ctx.status = 'thanked'
      ctx.notified = true
      await db.customBar.update({ where: { id: bar.id }, data: { contextLines: JSON.stringify(ctx) } })
    }),
  )

  await writeCampaignState({ thanked: true })
  revalidatePath('/campaign/the-crossing/steward')
  return { success: true, recipients: recipientCount }
}
