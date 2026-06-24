'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { dbBase } from '@/lib/db'
import { readHandDb } from '@/lib/hand-service'
import {
  INNER_GARDEN_SHAMAN_SOURCE,
  buildBarsInnerGardenImportPayload,
  buildShamanResultSeedMetabolization,
  getInnerGardenEligibilityReason,
  normalizeSeedQuality,
  toInnerGardenEligibleBar,
  type BarsInnerGardenImportPayload,
  type InnerGardenBarCandidate,
  type InnerGardenEligibleBar,
} from '@/lib/inner-garden/bridge'
import {
  buildChapterOneResultBarDraft,
  buildChapterOneSourceBarDraft,
  normalizeChapterOneText,
  type ChapterOneDraft,
} from '@/lib/inner-garden/chapter-one'

type ErrorResult = { error: string }

const BAR_SELECT = {
  id: true,
  title: true,
  description: true,
  type: true,
  creatorId: true,
  status: true,
  archivedAt: true,
  seedMetabolization: true,
  nation: true,
  intensity: true,
  campaignRef: true,
  gameMasterFace: true,
  hexagramId: true,
  isSystem: true,
  inviteId: true,
  mergedIntoId: true,
} as const

function asCandidate(bar: Awaited<ReturnType<typeof findCandidateBar>>): InnerGardenBarCandidate | null {
  if (!bar) return null
  return bar
}

async function findCandidateBar(barId: string) {
  return dbBase.customBar.findUnique({
    where: { id: barId },
    select: BAR_SELECT,
  })
}

export async function listInnerGardenEligibleBars(): Promise<
  | { hand: InnerGardenEligibleBar[]; vault: InnerGardenEligibleBar[] }
  | ErrorResult
> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const [hand, bars] = await Promise.all([
    readHandDb(player.id),
    dbBase.customBar.findMany({
      where: {
        creatorId: player.id,
        type: { in: ['bar', 'charge_capture'] },
        status: 'active',
        archivedAt: null,
        isSystem: false,
        inviteId: null,
        mergedIntoId: null,
      },
      orderBy: { createdAt: 'desc' },
      select: BAR_SELECT,
    }),
  ])

  const byId = new Map(bars.map((bar) => [bar.id, bar]))
  const used = new Set<string>()
  const handBars: InnerGardenEligibleBar[] = []

  for (const slot of hand.slots) {
    if (!slot.barId) continue
    const bar = byId.get(slot.barId)
    if (!bar) continue
    if (getInnerGardenEligibilityReason(bar, player.id)) continue
    used.add(bar.id)
    handBars.push(
      toInnerGardenEligibleBar(bar, {
        kind: 'hand',
        slotIndex: slot.slotIndex,
        isCarrying: slot.isCarrying,
      })
    )
  }

  const vaultBars = bars
    .filter((bar) => !used.has(bar.id))
    .filter((bar) => !getInnerGardenEligibilityReason(bar, player.id))
    .map((bar) => toInnerGardenEligibleBar(bar, { kind: 'vault' }))

  return { hand: handBars, vault: vaultBars }
}

export async function buildInnerGardenImportPayload(
  barId: string
): Promise<{ payload: BarsInnerGardenImportPayload } | ErrorResult> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const [barRaw, hand] = await Promise.all([findCandidateBar(barId), readHandDb(player.id)])
  const bar = asCandidate(barRaw)
  if (!bar) return { error: 'BAR not found' }

  const reason = getInnerGardenEligibilityReason(bar, player.id)
  if (reason) return { error: `BAR is not eligible for Inner Garden (${reason})` }

  const handSlot = hand.slots.find((slot) => slot.barId === bar.id)
  const eligible = toInnerGardenEligibleBar(
    bar,
    handSlot
      ? { kind: 'hand', slotIndex: handSlot.slotIndex, isCarrying: handSlot.isCarrying }
      : { kind: 'vault' }
  )

  return { payload: buildBarsInnerGardenImportPayload(eligible) }
}

export async function completeInnerGardenShamanRun(formData: FormData): Promise<void> {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const sourceBarId = String(formData.get('sourceBarId') ?? '').trim()
  const emotionId = String(formData.get('emotionId') ?? '').trim().slice(0, 60)
  const cultivationAction = String(formData.get('cultivationAction') ?? '').trim().slice(0, 120)
  const harvestedInsight = String(formData.get('harvestedInsight') ?? '').trim().slice(0, 2000)
  const seedQuality = normalizeSeedQuality(formData.get('seedQuality'))

  if (!sourceBarId || !emotionId || !cultivationAction || harvestedInsight.length < 3) {
    redirect(`/inner-garden/shaman?barId=${encodeURIComponent(sourceBarId)}&error=missing`)
  }

  const source = await findCandidateBar(sourceBarId)
  if (!source) redirect('/inner-garden?error=not-found')

  const reason = getInnerGardenEligibilityReason(source, player.id)
  if (reason) redirect(`/inner-garden?error=${encodeURIComponent(reason)}`)

  const resultTitle = `Harvested insight: ${source.title}`.slice(0, 80)
  const resultDescription = harvestedInsight

  const result = await dbBase.customBar.create({
    data: {
      creatorId: player.id,
      title: resultTitle,
      description: resultDescription,
      type: 'bar',
      reward: 0,
      visibility: 'private',
      status: 'active',
      inputs: '[]',
      rootId: 'temp',
      sourceBarId: source.id,
      gameMasterFace: 'shaman',
      questSource: INNER_GARDEN_SHAMAN_SOURCE,
      campaignRef: source.campaignRef,
      nation: source.nation,
      intensity: source.intensity,
      seedMetabolization: buildShamanResultSeedMetabolization(
        source.seedMetabolization,
        harvestedInsight
      ),
      agentMetadata: JSON.stringify({
        schemaVersion: 'inner-garden-bars.v1',
        source: INNER_GARDEN_SHAMAN_SOURCE,
        sourceBarId: source.id,
        sourceBarType: source.type,
        guideFace: 'shaman',
        emotionId,
        seedQuality,
        cultivationAction,
        harvestedInsight,
        completedAt: new Date().toISOString(),
      }),
    },
    select: { id: true },
  })

  await dbBase.customBar.update({
    where: { id: result.id },
    data: { rootId: result.id },
  })

  revalidatePath('/inner-garden')
  revalidatePath('/bars/garden')
  revalidatePath('/vault')
  revalidatePath(`/bars/${source.id}`)
  revalidatePath(`/bars/${result.id}`)

  redirect(`/bars/${result.id}?innerGarden=shaman`)
}

export async function completeInnerGardenChapterOneRun(formData: FormData): Promise<void> {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const sourceBarId = normalizeChapterOneText(formData.get('sourceBarId'), 120)
  const draft: ChapterOneDraft = {
    signal: normalizeChapterOneText(formData.get('signal')),
    resistance: normalizeChapterOneText(formData.get('resistance')),
    emotionId: normalizeChapterOneText(formData.get('emotionId'), 60),
    seedQuality: normalizeSeedQuality(formData.get('seedQuality')),
    cultivationAction: normalizeChapterOneText(formData.get('cultivationAction'), 120),
    harvestedInsight: normalizeChapterOneText(formData.get('harvestedInsight')),
    firstMove: normalizeChapterOneText(formData.get('firstMove')),
  }

  if (
    draft.signal.length < 3 ||
    draft.resistance.length < 3 ||
    draft.emotionId.length < 2 ||
    draft.cultivationAction.length < 3 ||
    draft.harvestedInsight.length < 3 ||
    draft.firstMove.length < 3
  ) {
    redirect('/inner-garden/chapter-1?error=missing')
  }

  let source: InnerGardenBarCandidate

  if (sourceBarId) {
    const sourceRaw = await findCandidateBar(sourceBarId)
    if (!sourceRaw) redirect('/inner-garden/chapter-1?error=not-found')

    const reason = getInnerGardenEligibilityReason(sourceRaw, player.id)
    if (reason) redirect(`/inner-garden/chapter-1?error=${encodeURIComponent(reason)}`)

    source = sourceRaw
  } else {
    const sourceDraft = buildChapterOneSourceBarDraft(draft)
    const createdSource = await dbBase.customBar.create({
      data: {
        creatorId: player.id,
        ...sourceDraft,
      },
      select: BAR_SELECT,
    })
    await dbBase.customBar.update({
      where: { id: createdSource.id },
      data: { rootId: createdSource.id },
    })
    source = createdSource
  }

  const resultDraft = buildChapterOneResultBarDraft({
    sourceBarId: source.id,
    sourceTitle: source.title,
    sourceSeedMetabolization: source.seedMetabolization,
    sourceNation: source.nation,
    sourceIntensity: source.intensity,
    draft,
    completedAt: new Date().toISOString(),
  })

  const result = await dbBase.customBar.create({
    data: {
      creatorId: player.id,
      ...resultDraft,
    },
    select: { id: true },
  })

  await dbBase.customBar.update({
    where: { id: result.id },
    data: { rootId: result.id },
  })

  revalidatePath('/inner-garden')
  revalidatePath('/inner-garden/chapter-1')
  revalidatePath('/mastering-allyship/hub')
  revalidatePath('/bars/garden')
  revalidatePath('/vault')
  revalidatePath(`/bars/${source.id}`)
  revalidatePath(`/bars/${result.id}`)

  redirect(`/bars/${result.id}?innerGarden=chapter-1`)
}
