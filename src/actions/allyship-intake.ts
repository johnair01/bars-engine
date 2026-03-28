'use server'

import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { playerCanListAllyshipIntakesForRef } from '@/lib/allyship-intake-permissions'
import { EVENT_INVITE_BAR_TYPE } from '@/lib/event-invite-story/schema'
import { buildFreshCampaignHubState } from '@/lib/campaign-hub/draw-portal-spokes'

const pathStepSchema = z.object({
  passageId: z.string().min(1),
  choiceLabel: z.string().min(1),
  nextPassageId: z.string().min(1),
})

const submitSchema = z.object({
  barId: z.string().min(1),
  storyId: z.string().min(1),
  endingPassageId: z.string().min(1),
  steps: z.array(pathStepSchema),
  clientSessionId: z.string().min(8).max(128).optional(),
  senderNote: z.string().max(320).optional().nullable(),
})

export type SubmitAllyshipIntakeResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

export async function submitAllyshipIntake(raw: unknown): Promise<SubmitAllyshipIntakeResult> {
  const parsed = submitSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().formErrors.join('; ') || 'Invalid intake.' }
  }
  const { barId, storyId, endingPassageId, steps, clientSessionId, senderNote } = parsed.data

  const bar = await db.customBar.findFirst({
    where: {
      id: barId,
      type: EVENT_INVITE_BAR_TYPE,
      archivedAt: null,
      status: 'active',
      visibility: 'public',
    },
    select: { id: true },
  })
  if (!bar) {
    return { ok: false, error: 'Invite not found or not available.' }
  }

  const player = await getCurrentPlayer()
  const pathJson = JSON.stringify({ steps })

  const row = await db.latentAllyshipIntake.create({
    data: {
      customBarId: barId,
      playerId: player?.id ?? null,
      clientSessionId: clientSessionId?.trim() || null,
      storyId,
      endingPassageId,
      pathJson,
      senderNote: senderNote?.trim() || null,
      status: 'submitted',
    },
    select: { id: true },
  })

  revalidatePath('/admin/allyship-intakes')
  return { ok: true, id: row.id }
}

export type AllyshipIntakeListRow = {
  id: string
  createdAt: Date
  status: string
  storyId: string
  endingPassageId: string
  pathJson: string
  senderNote: string | null
  clientSessionId: string | null
  stewardNotes: string | null
  spawnedCampaignRef: string | null
  player: { id: string; name: string } | null
  customBar: { id: string; title: string }
}

export async function listAllyshipIntakesForCampaignRef(
  campaignRef: string
): Promise<{ ok: true; rows: AllyshipIntakeListRow[] } | { ok: false; error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { ok: false, error: 'Sign in required.' }

  const ref = campaignRef.trim() || 'bruised-banana'
  const allowed = await playerCanListAllyshipIntakesForRef(player.id, ref, player.roles)
  if (!allowed) return { ok: false, error: 'You cannot view intakes for this campaign.' }

  const rows = await db.latentAllyshipIntake.findMany({
    where: {
      customBar: {
        campaignRef: ref,
        type: EVENT_INVITE_BAR_TYPE,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      createdAt: true,
      status: true,
      storyId: true,
      endingPassageId: true,
      pathJson: true,
      senderNote: true,
      clientSessionId: true,
      stewardNotes: true,
      spawnedInstance: {
        select: { campaignRef: true, slug: true },
      },
      player: { select: { id: true, name: true } },
      customBar: { select: { id: true, title: true } },
    },
  })

  const rowsMapped: AllyshipIntakeListRow[] = rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    status: r.status,
    storyId: r.storyId,
    endingPassageId: r.endingPassageId,
    pathJson: r.pathJson,
    senderNote: r.senderNote,
    clientSessionId: r.clientSessionId,
    stewardNotes: r.stewardNotes,
    spawnedCampaignRef: r.spawnedInstance?.campaignRef ?? r.spawnedInstance?.slug ?? null,
    player: r.player,
    customBar: r.customBar,
  }))

  return { ok: true, rows: rowsMapped }
}

function sanitizeChildCampaignRef(raw: string): string | null {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
  if (s.length < 3 || s.length > 64) return null
  if (!/^[a-z0-9]/.test(s) || !/[a-z0-9]$/.test(s)) return null
  return s
}

export type WaterAllyshipIntakeFormState = {
  error?: string
  childRef?: string
  hubUrl?: string
}

/**
 * ECI-B: mark intake watered and create child Instance (hub + 8 spokes, Kotter stage 1).
 * Callable from admin/steward UI via useFormState.
 */
export async function waterAllyshipIntake(
  _prev: WaterAllyshipIntakeFormState | undefined,
  formData: FormData
): Promise<WaterAllyshipIntakeFormState> {
  const intakeId = String(formData.get('intakeId') ?? '').trim()
  const parentCampaignRef = (String(formData.get('parentCampaignRef') ?? '').trim() || 'bruised-banana').trim()
  const childCampaignRefRaw = String(formData.get('childCampaignRef') ?? '').trim()
  const childDisplayName = String(formData.get('childDisplayName') ?? '').trim()
  const stewardNotes = String(formData.get('stewardNotes') ?? '').trim() || null

  if (!intakeId) return { error: 'Missing intake id.' }

  const childSlug = sanitizeChildCampaignRef(childCampaignRefRaw)
  if (!childSlug) {
    return {
      error:
        'Child campaign ref must be 3–64 chars: lowercase letters, digits, hyphens; start and end with a letter or digit.',
    }
  }

  const player = await getCurrentPlayer()
  if (!player) return { error: 'Sign in required.' }

  const allowed = await playerCanListAllyshipIntakesForRef(player.id, parentCampaignRef, player.roles)
  if (!allowed) return { error: 'You cannot water intakes for this campaign.' }

  const existingSlug = await db.instance.findUnique({
    where: { slug: childSlug },
    select: { id: true },
  })
  if (existingSlug) {
    return { error: `Campaign ref "${childSlug}" is already in use. Choose another slug.` }
  }

  const intakePre = await db.latentAllyshipIntake.findUnique({
    where: { id: intakeId },
    include: {
      customBar: { select: { id: true, title: true, campaignRef: true, type: true } },
      spawnedInstance: { select: { id: true, campaignRef: true, slug: true } },
    },
  })

  if (!intakePre) return { error: 'Intake not found.' }
  if (intakePre.customBar.type !== EVENT_INVITE_BAR_TYPE) {
    return { error: 'This row is not an event-invite intake.' }
  }
  const barRef = intakePre.customBar.campaignRef?.trim()
  if (!barRef || barRef !== parentCampaignRef) {
    return { error: 'This intake does not belong to the selected parent campaign ref.' }
  }

  if (intakePre.spawnedInstanceId && intakePre.spawnedInstance) {
    const ref = intakePre.spawnedInstance.campaignRef ?? intakePre.spawnedInstance.slug
    const hubUrl = `/campaign/hub?ref=${encodeURIComponent(ref)}`
    return { childRef: ref, hubUrl }
  }

  if (intakePre.status !== 'submitted') {
    return { error: 'Only submitted intakes can be watered.' }
  }

  const parentInstance = await db.instance.findFirst({
    where: { OR: [{ campaignRef: parentCampaignRef }, { slug: parentCampaignRef }] },
    orderBy: { createdAt: 'asc' },
  })
  if (!parentInstance) {
    return { error: `No parent Instance found for ref "${parentCampaignRef}". Seed or create the parent campaign first.` }
  }

  const displayName =
    childDisplayName ||
    `Support ${intakePre.customBar.title}`.slice(0, 120) ||
    `Support ${childSlug}`

  const kernelLines = [
    `Solidarity sub-campaign spawned from allyship interview (parent: ${parentInstance.name}, ref ${parentCampaignRef}).`,
    stewardNotes ? `Steward notes: ${stewardNotes}` : null,
    `Interview ending: ${intakePre.endingPassageId}; story template: ${intakePre.storyId}.`,
    `Path JSON: ${intakePre.pathJson}`.slice(0, 8000),
  ]
    .filter(Boolean)
    .join('\n\n')

  const hubState = buildFreshCampaignHubState(1)

  try {
    const { ref } = await db.$transaction(
      async (tx) => {
        const locked = await tx.latentAllyshipIntake.findUnique({
          where: { id: intakeId },
          select: { id: true, status: true, spawnedInstanceId: true },
        })
        if (!locked) throw new Error('Intake not found.')
        if (locked.spawnedInstanceId) {
          const inst = await tx.instance.findUnique({
            where: { id: locked.spawnedInstanceId },
            select: { campaignRef: true, slug: true },
          })
          if (inst) return { ref: inst.campaignRef ?? inst.slug }
          throw new Error('Spawned instance record is missing.')
        }
        if (locked.status !== 'submitted') {
          throw new Error('Intake is no longer in submitted status.')
        }

        const created = await tx.instance.create({
          data: {
            slug: childSlug,
            name: displayName,
            domainType: 'campaign',
            campaignRef: childSlug,
            parentInstanceId: parentInstance.id,
            linkedInstanceId: parentInstance.id,
            primaryCampaignDomain: parentInstance.primaryCampaignDomain,
            allyshipDomain: parentInstance.allyshipDomain,
            narrativeKernel: kernelLines,
            kotterStage: 1,
            campaignHubState: hubState as Prisma.InputJsonValue,
            moveIds: parentInstance.moveIds,
            domainDeckCycles: parentInstance.domainDeckCycles as Prisma.InputJsonValue,
            timezone: parentInstance.timezone,
            stripeOneTimeUrl: parentInstance.stripeOneTimeUrl,
            patreonUrl: parentInstance.patreonUrl,
            venmoUrl: parentInstance.venmoUrl,
            cashappUrl: parentInstance.cashappUrl,
            paypalUrl: parentInstance.paypalUrl,
            donationButtonLabel: parentInstance.donationButtonLabel,
            donationPackRateCents: parentInstance.donationPackRateCents,
          },
        })

        await tx.latentAllyshipIntake.update({
          where: { id: intakeId },
          data: {
            status: 'watered',
            spawnedInstanceId: created.id,
            wateredAt: new Date(),
            wateredByPlayerId: player.id,
            stewardNotes,
          },
        })

        return { ref: created.campaignRef ?? created.slug }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 15000,
      }
    )

    revalidatePath('/admin/allyship-intakes')
    revalidatePath('/campaign/hub')

    const hubUrl = `/campaign/hub?ref=${encodeURIComponent(ref)}`
    return { childRef: ref, hubUrl }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to spawn campaign.'
    console.error('[waterAllyshipIntake]', e)
    return { error: msg }
  }
}
