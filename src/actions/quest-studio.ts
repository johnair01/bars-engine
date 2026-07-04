'use server'

/**
 * Quest Studio — server actions (campaign-lead-forge Phase 7). Steward-gated
 * (decision D). Draft a quest from the three lenses (AI default, decision C, with a
 * deterministic fallback), save it to the campaign pool with queryable alignment
 * tags (decision B), and manage the authored library.
 */
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { assertCampaignSteward, resolveCampaignInstanceId } from '@/lib/campaign-leads/auth'
import {
  assembleAlignedQuest,
  composeAlignmentSeed,
  type AlignedQuestDraft,
  type AlignmentSeed,
} from '@/lib/campaign-leads/quest-alignment'
import { aiDraftAlignedQuest } from '@/lib/campaign-leads/quest-alignment-ai'
import type { AllyshipDomainKey } from '@/lib/allyship-domains'
import type { Superpower, SuperpowerOrientation } from '@/lib/superpowers/types'
import type { GameMasterFace } from '@/lib/quest-grammar/types'

const REF_RE = /^[a-z0-9][a-z0-9-]{0,80}$/i

const lensSchema = z.object({
  campaignRef: z.string().regex(REF_RE),
  domain: z.string().max(60).optional().nullable(),
  mythId: z.string().max(120).optional().nullable(),
  superpower: z.string().max(60).optional().nullable(),
  orientation: z.enum(['internal', 'external']).optional().nullable(),
  gmFace: z.string().max(40).optional().nullable(),
})

async function stewardFor(campaignRef: string): Promise<{ ok: true; playerId: string } | { ok: false; error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { ok: false, error: 'Not signed in.' }
  if (!(await assertCampaignSteward(player.id, campaignRef))) {
    return { ok: false, error: 'You do not have steward access to this campaign.' }
  }
  return { ok: true, playerId: player.id }
}

export type DraftAlignedQuestResult =
  | { ok: true; seed: AlignmentSeed; draft: AlignedQuestDraft; aiUsed: boolean }
  | { ok: false; error: string }

/** Compose the seed and draft a quest (AI first per decision C, deterministic fallback). */
export async function draftAlignedQuest(raw: unknown): Promise<DraftAlignedQuestResult> {
  const parsed = lensSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  const input = parsed.data

  const guard = await stewardFor(input.campaignRef)
  if (!guard.ok) return guard

  // Decision A: face-only — the opening move comes from the campaign's Kotter stage.
  const instanceId = await resolveCampaignInstanceId(input.campaignRef)
  let kotterStage = 1
  if (instanceId) {
    const inst = await db.instance.findUnique({ where: { id: instanceId }, select: { kotterStage: true } })
    kotterStage = inst?.kotterStage ?? 1
  }

  const seed = composeAlignmentSeed({
    domain: (input.domain as AllyshipDomainKey) || null,
    mythId: input.mythId || null,
    superpower: (input.superpower as Superpower) || null,
    orientation: (input.orientation as SuperpowerOrientation) || null,
    gmFace: (input.gmFace as GameMasterFace) || null,
    kotterStage,
  })

  const ai = await aiDraftAlignedQuest(seed)
  const draft = ai ?? assembleAlignedQuest(seed)
  return { ok: true, seed, draft, aiUsed: ai !== null }
}

const saveSchema = z.object({
  campaignRef: z.string().regex(REF_RE),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(1).max(4000),
  alignedAction: z.string().trim().max(600).optional(),
  domain: z.string().max(60).optional().nullable(),
  mythId: z.string().max(120).optional().nullable(),
  superpower: z.string().max(60).optional().nullable(),
  gmFace: z.string().max(40).optional().nullable(),
})

export type SaveAlignedQuestResult = { ok: true; questId: string } | { ok: false; error: string }

/** Persist a drafted quest to the campaign pool (type 'quest', active) with alignment tags. */
export async function saveAlignedQuest(raw: unknown): Promise<SaveAlignedQuestResult> {
  const parsed = saveSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid quest.' }
  const input = parsed.data

  const guard = await stewardFor(input.campaignRef)
  if (!guard.ok) return guard

  // Fold the aligned action into the description. `contextLines` is overloaded by
  // other features (the-crossing parses it as its own JSON shape), so we must not
  // store a bespoke {alignedAction} object there.
  const description = input.alignedAction
    ? `${input.description}\n\nAligned action: ${input.alignedAction}`
    : input.description

  const quest = await db.customBar.create({
    data: {
      creatorId: guard.playerId,
      title: input.title,
      description,
      type: 'quest',
      status: 'active',
      campaignRef: input.campaignRef,
      allyshipDomain: input.domain || undefined,
      gmFace: input.gmFace || undefined,
      superpowerAffinity: input.superpower || undefined,
      mythId: input.mythId || undefined,
      questSource: 'quest_studio',
    },
    select: { id: true },
  })

  revalidatePath(`/campaign/${input.campaignRef}/quests`)
  return { ok: true, questId: quest.id }
}

export interface AuthoredQuestRow {
  id: string
  title: string
  domain: string | null
  gmFace: string | null
  superpower: string | null
  mythId: string | null
  status: string
}

export type ListCampaignQuestsResult =
  | { ok: true; quests: AuthoredQuestRow[] }
  | { ok: false; error: string }

export async function listCampaignQuests(campaignRef: string): Promise<ListCampaignQuestsResult> {
  if (!REF_RE.test(campaignRef)) return { ok: false, error: 'Invalid campaign.' }
  const guard = await stewardFor(campaignRef)
  if (!guard.ok) return guard

  const rows = await db.customBar.findMany({
    where: { campaignRef, type: 'quest', status: { not: 'archived' } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, allyshipDomain: true, gmFace: true, superpowerAffinity: true, mythId: true, status: true },
    take: 200,
  })
  return {
    ok: true,
    quests: rows.map((r) => ({
      id: r.id,
      title: r.title,
      domain: r.allyshipDomain,
      gmFace: r.gmFace,
      superpower: r.superpowerAffinity,
      mythId: r.mythId,
      status: r.status,
    })),
  }
}

export type ArchiveQuestResult = { ok: true } | { ok: false; error: string }

export async function archiveQuest(questId: string): Promise<ArchiveQuestResult> {
  const player = await getCurrentPlayer()
  if (!player) return { ok: false, error: 'Not signed in.' }
  const quest = await db.customBar.findUnique({ where: { id: questId }, select: { campaignRef: true } })
  if (!quest?.campaignRef) return { ok: false, error: 'Quest not found.' }
  if (!(await assertCampaignSteward(player.id, quest.campaignRef))) {
    return { ok: false, error: 'You do not have steward access to this campaign.' }
  }
  await db.customBar.update({ where: { id: questId }, data: { status: 'archived' } })
  revalidatePath(`/campaign/${quest.campaignRef}/quests`)
  return { ok: true }
}
