'use server'

/**
 * Ally Campaign — accountless participation.
 *
 * The whole point of these actions: a friend or family member can run the /ally
 * CYOA, claim scoped work, and offer help to the collective WITHOUT ever creating
 * a bars-engine account — and their information still lands on the steward
 * dashboard. The `CampaignLead` row IS their identity until (and unless) they
 * ever claim a Player.
 *
 * Public (no auth):  submitAllyIntake, offerToCollective, releaseNeed
 * Steward-gated:     allyBoard, markNeedDone, respondToOffer
 *
 * Every public action is written on the assumption that the caller is hostile:
 * ids are validated against the AUTHORED need catalogue (not free text), values
 * come from the catalogue rather than the request body, and nothing accepts a
 * player id from the client. All return { ok, … } | { ok:false, error }.
 */

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { stewardGuard } from '@/lib/campaign-leads/auth'
import { ALLYSHIP_DOMAINS } from '@/lib/allyship-domains'
import {
  findNeed,
  subcampaignSlug,
  workstreamForNeed,
  type WorkstreamNeed,
} from '@/lib/ally-campaign/workstreams'
import {
  PARENT_REF,
  type AllyBoardLead,
  type AllyBoardNeed,
  type AllyBoardOffer,
  type AllyBoardResult,
  type AllyProgressResult,
  type AllyTask,
} from '@/lib/ally-campaign/board'

const REF_RE = /^[a-z0-9][a-z0-9-]{0,80}$/i
const DOMAIN_KEYS = ALLYSHIP_DOMAINS.map((d) => d.key) as [string, ...string[]]

// ── submitAllyIntake (public) ───────────────────────────────────────────────

const intakeSchema = z.object({
  /** Which named warm invite they came through, e.g. 'mom'. Display only. */
  allySlug: z.string().regex(REF_RE).max(60).optional(),
  name: z.string().trim().max(160).optional(),
  contact: z.string().trim().max(200).optional(),
  superpower: z.string().trim().min(1).max(60),
  superpowerOrientation: z.enum(['internal', 'external']).nullable().optional(),
  mythsSeen: z.array(z.string().trim().min(1).max(120)).max(40).optional(),
  domain: z.enum(DOMAIN_KEYS),
  /** Need ids they committed to — validated against the authored catalogue. */
  commitments: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
  /** Anything they wanted to say in their own words. */
  notes: z.string().trim().max(4000).optional(),
  /** Publish to the collective directory so other stewards can see the offer. */
  collective: z.boolean().optional(),
  clientSessionId: z.string().trim().min(8).max(128).optional(),
})

export type SubmitAllyIntakeResult =
  | { ok: true; leadId: string; claimed: number; skipped: string[]; vibeulons: number }
  | { ok: false; error: string }

/**
 * Land an accountless ally: one `CampaignLead` plus a claim on each need they
 * committed to.
 *
 * Sub-campaign routing: the lead's `campaignRef` is the WORKSTREAM they chose
 * (e.g. `mobility-quest-car`) and `parentCampaignRef` is `mobility-quest`, so the
 * steward dashboard can roll the whole tree up in one query while each workstream
 * still reads as its own board.
 *
 * Claims are best-effort and reported honestly: a need someone else already took
 * between page load and submit is returned in `skipped` rather than silently
 * dropped or double-claimed. The claim is conditional on `status: 'open'`, so two
 * simultaneous submits cannot both win.
 */
export async function submitAllyIntake(raw: unknown): Promise<SubmitAllyIntakeResult> {
  const parsed = intakeSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid submission.' }
  }
  const input = parsed.data

  // Only ids that exist in the authored catalogue. Never trust client titles/values.
  const requested: WorkstreamNeed[] = (input.commitments ?? [])
    .map((id) => findNeed(id))
    .filter((n): n is WorkstreamNeed => !!n)

  // Route the lead to the sub-campaign of their first commitment; else to the
  // parent. A person who commits to nothing is still a real lead worth seeing.
  const primaryWorkstream = requested.length > 0 ? workstreamForNeed(requested[0].id) : undefined
  const campaignRef = primaryWorkstream ? subcampaignSlug(primaryWorkstream.key) : PARENT_REF

  // A player MAY be signed in — we just never require it.
  const player = await getCurrentPlayer()

  const lead = await db.campaignLead.create({
    data: {
      campaignRef,
      parentCampaignRef: PARENT_REF,
      source: 'automated',
      status: 'new',
      name: input.name || undefined,
      contact: input.contact || undefined,
      channel: input.allySlug ? `ally:${input.allySlug}` : undefined,
      domain: input.domain,
      superpower: input.superpower,
      superpowerOrientation: input.superpowerOrientation ?? undefined,
      mythsSeenJson: input.mythsSeen?.length ? JSON.stringify(input.mythsSeen) : undefined,
      actionsJson: requested.length ? JSON.stringify(requested.map((n) => n.id)) : undefined,
      notes: input.notes || undefined,
      collective: input.collective ?? true,
      claimedByPlayerId: player?.id ?? undefined,
      clientSessionId: input.clientSessionId ?? undefined,
    },
    select: { id: true },
  })

  // Claim each need conditionally — only rows still open are taken.
  const skipped: string[] = []
  let claimed = 0
  let vibeulons = 0

  for (const need of requested) {
    const res = await db.milestoneNeed.updateMany({
      where: { id: need.id, status: 'open' },
      data: {
        status: 'claimed',
        claimedByLeadId: lead.id,
        claimedByPlayerId: player?.id ?? null,
      },
    })
    if (res.count > 0) {
      claimed += 1
      vibeulons += need.bountyVibeulons
    } else {
      skipped.push(need.id)
    }
  }

  // Bounties are pledged on claim, banked on completion — see markNeedDone.
  revalidatePath(`/campaign/${PARENT_REF}/allies`)
  return { ok: true, leadId: lead.id, claimed, skipped, vibeulons }
}

// ── offerToCollective (public) ──────────────────────────────────────────────

const offerSchema = z.object({
  leadId: z.string().trim().min(1).max(120).optional(),
  campaignRef: z.string().regex(REF_RE).optional(),
  unit: z.enum(['action', 'currency', 'hours']).default('action'),
  value: z.number().finite().min(0).max(1_000_000).default(1),
  body: z.string().trim().min(3).max(2000),
  domain: z.enum(DOMAIN_KEYS).optional(),
  superpower: z.string().trim().max(60).optional(),
})

export type OfferResult = { ok: true; offerId: string } | { ok: false; error: string }

/**
 * An unshaped gift to the collective — "here's what I have, use it however helps."
 * The counterpart to a `MilestoneNeed`: a need is a steward-shaped ask, an offer
 * is the community handing the steward raw material to shape into one.
 * Accountless by design; `leadId` is optional so a first-time visitor can offer
 * before they've finished the CYOA.
 */
export async function offerToCollective(raw: unknown): Promise<OfferResult> {
  const parsed = offerSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid offer.' }
  }
  const input = parsed.data
  const player = await getCurrentPlayer()

  // Only honour a leadId that actually exists — a bad one becomes an anonymous offer
  // rather than an error, because losing a real offer is worse than losing attribution.
  let leadId: string | undefined
  if (input.leadId) {
    const lead = await db.campaignLead.findUnique({
      where: { id: input.leadId },
      select: { id: true },
    })
    leadId = lead?.id
  }

  const offer = await db.collectiveOffer.create({
    data: {
      campaignRef: input.campaignRef ?? PARENT_REF,
      parentCampaignRef: PARENT_REF,
      leadId,
      playerId: player?.id ?? undefined,
      unit: input.unit,
      value: input.value,
      body: input.body,
      domain: input.domain,
      superpower: input.superpower,
      status: 'open',
      collective: true,
    },
    select: { id: true },
  })

  revalidatePath(`/campaign/${PARENT_REF}/allies`)
  return { ok: true, offerId: offer.id }
}

// ── releaseNeed (public) ────────────────────────────────────────────────────

const releaseSchema = z.object({
  needId: z.string().trim().min(1).max(120),
  leadId: z.string().trim().min(1).max(120),
})

/**
 * Give a claimed need back. Public, but scoped: the claim is only released when
 * `leadId` matches the row's own claimant, so possession of a need id alone can
 * never unclaim someone else's work. Letting people put something down without
 * asking permission is what makes claiming it feel safe in the first place.
 */
export async function releaseNeed(raw: unknown): Promise<{ ok: boolean; error?: string }> {
  const parsed = releaseSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Invalid request.' }

  const res = await db.milestoneNeed.updateMany({
    where: { id: parsed.data.needId, claimedByLeadId: parsed.data.leadId, status: 'claimed' },
    data: { status: 'open', claimedByLeadId: null, claimedByPlayerId: null },
  })
  if (res.count === 0) return { ok: false, error: 'That task is not yours to release.' }

  revalidatePath(`/campaign/${PARENT_REF}/allies`)
  return { ok: true }
}

// ── allyProgress (public, capability-scoped) ────────────────────────────────

/**
 * The ally's own view of what they're holding.
 *
 * Scoped by `leadId`, which is an unguessable cuid handed to them on the finish
 * screen — a capability URL, the standard pattern for an accountless flow (an
 * order-status link works the same way). Anyone with the link can see it, so this
 * deliberately returns NO contact details: the holder already knows their own
 * phone number, and a leaked link should not become a way to harvest one.
 *
 * Also returns still-open work so returning has a point beyond letting go.
 */
export async function allyProgress(leadId: string): Promise<AllyProgressResult> {
  if (!leadId || leadId.length > 120) return { ok: false, error: 'Unknown link.' }

  const lead = await db.campaignLead.findUnique({
    where: { id: leadId },
    include: { offers: { orderBy: { createdAt: 'desc' } } },
  })
  if (!lead) return { ok: false, error: 'That link does not match anything. It may have been reset.' }

  // Same catalogue filter as `allyBoard` — see the note there on superseded
  // `mq-need-*` rows sharing this campaignRef.
  const rows = (
    await db.milestoneNeed.findMany({
      where: {
        OR: [{ campaignRef: PARENT_REF }, { campaignRef: { startsWith: `${PARENT_REF}-` } }],
      },
    })
  ).filter((r) => findNeed(r.id))

  const toTask = (row: (typeof rows)[number]): AllyTask => {
    const authored = findNeed(row.id)
    const ws = workstreamForNeed(row.id)
    return {
      id: row.id,
      title: authored?.title ?? row.title ?? row.id,
      detail: authored?.detail ?? '',
      workstream: ws?.title ?? '—',
      domain: ws?.domain ?? '—',
      unit: row.unit,
      value: row.value,
      bountyVibeulons: row.bountyVibeulons,
      status: row.status,
      matchesSuperpower: !!lead.superpower && row.superpower === lead.superpower,
    }
  }

  const held = rows.filter((r) => r.claimedByLeadId === leadId).map(toTask)

  // Open work, their superpower first — same ordering promise as the funnel.
  const available = rows
    .filter((r) => r.status === 'open')
    .map(toTask)
    .sort((a, b) => Number(b.matchesSuperpower) - Number(a.matchesSuperpower))

  return {
    ok: true,
    progress: {
      leadId: lead.id,
      name: lead.name,
      superpower: lead.superpower,
      orientation: lead.superpowerOrientation,
      domain: lead.domain,
      workstream: lead.campaignRef.startsWith(`${PARENT_REF}-`)
        ? lead.campaignRef.slice(PARENT_REF.length + 1)
        : null,
      vibeulonsEarned: lead.vibeulonsEarned,
      vibeulonsPledged: held
        .filter((t) => t.status === 'claimed')
        .reduce((s, t) => s + t.bountyVibeulons, 0),
      held,
      available,
      offers: lead.offers.map((o) => ({
        id: o.id,
        body: o.body,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
      joinedAt: lead.createdAt.toISOString(),
    },
  }
}

// ── claimNeed (public, capability-scoped) ───────────────────────────────────

const claimSchema = z.object({
  needId: z.string().trim().min(1).max(120),
  leadId: z.string().trim().min(1).max(120),
})

/**
 * Pick up another task from the return surface. Conditional on `status: 'open'`,
 * so two people racing for the same task cannot both win — the loser is told,
 * rather than silently double-booked.
 */
export async function claimNeed(raw: unknown): Promise<{ ok: boolean; error?: string }> {
  const parsed = claimSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Invalid request.' }
  const { needId, leadId } = parsed.data

  if (!findNeed(needId)) return { ok: false, error: 'Unknown task.' }

  const lead = await db.campaignLead.findUnique({ where: { id: leadId }, select: { id: true } })
  if (!lead) return { ok: false, error: 'Unknown link.' }

  const res = await db.milestoneNeed.updateMany({
    where: { id: needId, status: 'open' },
    data: { status: 'claimed', claimedByLeadId: leadId },
  })
  if (res.count === 0) return { ok: false, error: 'Someone else just took that one.' }

  revalidatePath(`/campaign/${PARENT_REF}/allies`)
  revalidatePath(`/ally/mine/${leadId}`)
  return { ok: true }
}

// ── allyBoard (steward) ─────────────────────────────────────────────────────

/**
 * The steward dashboard read: who is working on what, and what nobody has picked
 * up. One query per table across the whole campaign tree (parent + all
 * workstream sub-campaigns), joined to the authored catalogue for titles and
 * domains so display copy always matches the file rather than a stale DB row.
 */
export async function allyBoard(): Promise<AllyBoardResult> {
  const guard = await stewardGuard(PARENT_REF)
  if (!guard.ok) return guard

  const [leadRows, needRows, offerRows] = await Promise.all([
    db.campaignLead.findMany({
      where: { OR: [{ parentCampaignRef: PARENT_REF }, { campaignRef: PARENT_REF }] },
      orderBy: { createdAt: 'desc' },
    }),
    db.milestoneNeed.findMany({
      where: { OR: [{ campaignRef: PARENT_REF }, { campaignRef: { startsWith: `${PARENT_REF}-` } }] },
      orderBy: { createdAt: 'asc' },
    }),
    db.collectiveOffer.findMany({
      where: { OR: [{ parentCampaignRef: PARENT_REF }, { campaignRef: PARENT_REF }] },
      orderBy: { createdAt: 'desc' },
      include: { lead: { select: { name: true } } },
    }),
  ])

  const leadName = new Map(leadRows.map((l) => [l.id, l.name]))

  // The `mobility-quest` ref predates this campaign — an earlier seed
  // (`seed-mobility-quest.ts`, the "get out of Portland" framing) left `mq-need-*`
  // rows behind under the same ref. Show only what the current catalogue authors,
  // so superseded seed data can sit in the database without corrupting the board.
  // Non-destructive on purpose: those rows are somebody's history, not garbage.
  const needs: AllyBoardNeed[] = needRows.filter((n) => findNeed(n.id)).map((n) => {
    const authored = findNeed(n.id)
    const ws = workstreamForNeed(n.id)
    return {
      id: n.id,
      title: authored?.title ?? n.title ?? n.id,
      workstream: ws?.title ?? '—',
      domain: ws?.domain ?? '—',
      superpower: n.superpower,
      orientation: n.orientation,
      unit: n.unit,
      value: n.value,
      bountyVibeulons: n.bountyVibeulons,
      status: n.status,
      claimedByLeadId: n.claimedByLeadId,
      claimantName: n.claimedByLeadId ? (leadName.get(n.claimedByLeadId) ?? 'Anonymous ally') : null,
      needsHelp: authored?.needsHelp ?? false,
    }
  })

  const leads: AllyBoardLead[] = leadRows.map((l) => {
    const ws = l.campaignRef.startsWith(`${PARENT_REF}-`)
      ? l.campaignRef.slice(PARENT_REF.length + 1)
      : null
    return {
      id: l.id,
      name: l.name,
      contact: l.contact,
      campaignRef: l.campaignRef,
      workstream: ws,
      domain: l.domain,
      superpower: l.superpower,
      orientation: l.superpowerOrientation,
      status: l.status,
      notes: l.notes,
      vibeulonsEarned: l.vibeulonsEarned,
      commitments: safeIds(l.actionsJson),
      createdAt: l.createdAt.toISOString(),
    }
  })

  const offers: AllyBoardOffer[] = offerRows.map((o) => ({
    id: o.id,
    body: o.body,
    unit: o.unit,
    value: o.value,
    domain: o.domain,
    status: o.status,
    leadName: o.lead?.name ?? null,
    createdAt: o.createdAt.toISOString(),
  }))

  const claimedOrDone = needs.filter((n) => n.status !== 'open')

  return {
    ok: true,
    board: {
      leads,
      needs,
      offers,
      unclaimed: needs.filter((n) => n.status === 'open' || n.needsHelp),
      totals: {
        leads: leads.length,
        claimedNeeds: needs.filter((n) => n.status === 'claimed').length,
        openNeeds: needs.filter((n) => n.status === 'open').length,
        doneNeeds: needs.filter((n) => n.status === 'done').length,
        pledgedVibeulons: claimedOrDone.reduce((s, n) => s + n.bountyVibeulons, 0),
        bankedVibeulons: needs
          .filter((n) => n.status === 'done')
          .reduce((s, n) => s + n.bountyVibeulons, 0),
        // Units are reported separately and never blended — Six Faces ruling.
        currencyPledged: claimedOrDone
          .filter((n) => n.unit === 'currency')
          .reduce((s, n) => s + n.value, 0),
        hoursPledged: claimedOrDone
          .filter((n) => n.unit === 'hours')
          .reduce((s, n) => s + n.value, 0),
      },
    },
  }
}

// ── markNeedDone (steward) ──────────────────────────────────────────────────

/**
 * Complete a claimed need and bank its bounty to the claimant's ledger.
 * Steward-gated on purpose: self-attested completion is how a bounty economy
 * becomes meaningless. The vibeulon ledger is an honest integer on the lead —
 * real `Vibulon` rows get minted only if they ever claim a Player account.
 */
export async function markNeedDone(needId: string): Promise<{ ok: boolean; error?: string }> {
  const guard = await stewardGuard(PARENT_REF)
  if (!guard.ok) return guard

  const need = await db.milestoneNeed.findUnique({ where: { id: needId } })
  if (!need) return { ok: false, error: 'Unknown task.' }
  if (need.status === 'done') return { ok: true }

  await db.$transaction(async (tx) => {
    await tx.milestoneNeed.update({ where: { id: needId }, data: { status: 'done' } })

    if (need.claimedByLeadId) {
      await tx.campaignLead.update({
        where: { id: need.claimedByLeadId },
        data: { vibeulonsEarned: { increment: need.bountyVibeulons } },
      })
    }
    // Roll the milestone's progress bar forward by this need's own unit value.
    await tx.campaignMilestone.update({
      where: { id: need.milestoneId },
      data: { currentValue: { increment: need.value } },
    })
  })

  revalidatePath(`/campaign/${PARENT_REF}/allies`)
  return { ok: true }
}

// ── respondToOffer (steward) ────────────────────────────────────────────────

const OFFER_STATUSES = ['open', 'accepted', 'shaped', 'declined'] as const

export async function respondToOffer(
  offerId: string,
  status: (typeof OFFER_STATUSES)[number],
  stewardNotes?: string,
): Promise<{ ok: boolean; error?: string }> {
  const guard = await stewardGuard(PARENT_REF)
  if (!guard.ok) return guard
  if (!OFFER_STATUSES.includes(status)) return { ok: false, error: 'Unknown status.' }

  await db.collectiveOffer.update({
    where: { id: offerId },
    data: { status, stewardNotes: stewardNotes?.slice(0, 2000) || undefined },
  })
  revalidatePath(`/campaign/${PARENT_REF}/allies`)
  return { ok: true }
}

/** Parse a JSON string[] column defensively — bad data yields [], never a throw. */
function safeIds(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}
