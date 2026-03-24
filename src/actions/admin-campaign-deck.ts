'use server'

/**
 * Admin-only campaign deck CYOA apply + dashboard state.
 */

import type { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { materializeDeckFromIntake, type DeckIntakeV1 } from '@/lib/admin-campaign-deck-intake'
import { buildRaiseUrgencyQuestPayload } from '@/lib/campaign-deck-quests'
import { drawPeriod } from '@/actions/campaign-deck'

async function requireAdmin(): Promise<{ id: string } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  const ok = player.roles.some((r) => r.role.key === 'admin')
  if (!ok) return { error: 'Admin role required' }
  return { id: player.id }
}

export interface DeckCardRow {
  id: string
  hexagramId: number
  theme: string | null
  domain: string | null
  status: string
  cyoaAdventureId: string | null
  questId: string | null
}

export interface CampaignDeckAdminState {
  campaignRef: string
  instance: {
    id: string
    name: string
    slug: string
    portalAdventureId: string | null
    kotterStage: number
    deckAuthoringIntake: unknown | null
  } | null
  cards: DeckCardRow[]
  activePeriod: { id: string; periodNumber: number; status: string } | null
}

export async function getCampaignDeckAdminState(
  campaignRef: string,
): Promise<CampaignDeckAdminState | { error: string }> {
  const gate = await requireAdmin()
  if ('error' in gate) return gate

  try {
    const [instance, cards, activePeriod] = await Promise.all([
      db.instance.findFirst({
        where: { OR: [{ campaignRef }, { slug: campaignRef }] },
        select: {
          id: true,
          name: true,
          slug: true,
          portalAdventureId: true,
          kotterStage: true,
          deckAuthoringIntake: true,
        },
      }),
      db.campaignDeckCard.findMany({
        where: { campaignRef },
        orderBy: { hexagramId: 'asc' },
        select: {
          id: true,
          hexagramId: true,
          theme: true,
          domain: true,
          status: true,
          cyoaAdventureId: true,
          questId: true,
        },
      }),
      db.campaignPeriod.findFirst({
        where: { campaignRef, status: 'active' },
        orderBy: { periodNumber: 'desc' },
        select: { id: true, periodNumber: true, status: true },
      }),
    ])

    return {
      campaignRef,
      instance: instance
        ? {
            id: instance.id,
            name: instance.name,
            slug: instance.slug,
            portalAdventureId: instance.portalAdventureId,
            kotterStage: instance.kotterStage,
            deckAuthoringIntake: instance.deckAuthoringIntake,
          }
        : null,
      cards,
      activePeriod,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { error: msg }
  }
}

/**
 * Upsert 8 starter deck cards (hexagrams 1–8) from a validated intake; save intake on instance for replay.
 */
export async function applyDeckIntakeV1(
  campaignRef: string,
  intake: DeckIntakeV1,
): Promise<{ success: true; upserted: number } | { error: string }> {
  const gate = await requireAdmin()
  if ('error' in gate) return gate

  const appliedAt = new Date().toISOString()
  const stamped: DeckIntakeV1 = { ...intake, appliedAt }

  try {
    const instance = await db.instance.findFirst({
      where: { OR: [{ campaignRef }, { slug: campaignRef }] },
      select: { id: true, portalAdventureId: true },
    })

    const specs = materializeDeckFromIntake(stamped)
    const portalAdvId = instance?.portalAdventureId ?? null

    await db.$transaction(async (tx) => {
      for (const spec of specs) {
        const qp = buildRaiseUrgencyQuestPayload(campaignRef, spec, stamped)

        const existingCard = await tx.campaignDeckCard.findUnique({
          where: {
            campaignRef_hexagramId: { campaignRef, hexagramId: spec.hexagramId },
          },
          select: { questId: true },
        })

        let questId: string | null = existingCard?.questId ?? null
        if (questId) {
          const bar = await tx.customBar.findUnique({ where: { id: questId } })
          if (bar) {
            await tx.customBar.update({
              where: { id: questId },
              data: {
                title: qp.title,
                description: qp.description,
                campaignRef,
                allyshipDomain: spec.domain,
                hexagramId: spec.hexagramId,
                kotterStage: qp.kotterStage,
                campaignGoal: qp.campaignGoal,
                completionEffects: qp.completionEffects,
                emotionalAlchemyTag: qp.emotionalAlchemyTag,
                gameMasterFace: qp.gameMasterFace,
                type: 'quest',
                visibility: 'public',
                isSystem: true,
              },
            })
          } else {
            questId = null
          }
        }

        if (!questId) {
          const created = await tx.customBar.create({
            data: {
              creatorId: gate.id,
              title: qp.title,
              description: qp.description,
              type: 'quest',
              reward: 1,
              visibility: 'public',
              status: 'active',
              inputs: '[]',
              rootId: 'temp',
              campaignRef,
              campaignGoal: qp.campaignGoal,
              kotterStage: qp.kotterStage,
              hexagramId: spec.hexagramId,
              allyshipDomain: spec.domain ?? undefined,
              isSystem: true,
              completionEffects: qp.completionEffects,
              emotionalAlchemyTag: qp.emotionalAlchemyTag ?? undefined,
              gameMasterFace: qp.gameMasterFace ?? undefined,
            },
          })
          await tx.customBar.update({
            where: { id: created.id },
            data: { rootId: created.id },
          })
          questId = created.id
        }

        await tx.campaignDeckCard.upsert({
          where: {
            campaignRef_hexagramId: { campaignRef, hexagramId: spec.hexagramId },
          },
          create: {
            campaignRef,
            hexagramId: spec.hexagramId,
            theme: spec.theme,
            domain: spec.domain,
            cyoaAdventureId: portalAdvId,
            questId,
            createdByPlayerId: gate.id,
            status: 'draft',
          },
          update: {
            theme: spec.theme,
            domain: spec.domain,
            cyoaAdventureId: portalAdvId,
            questId,
            status: 'draft',
          },
        })
      }

      if (instance) {
        await tx.instance.update({
          where: { id: instance.id },
          data: {
            deckAuthoringIntake: stamped as unknown as Prisma.InputJsonValue,
          },
        })
      }
    })

    revalidatePath('/admin/quests')
    return { success: true, upserted: specs.length }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { error: msg }
  }
}

export async function activateStarterDeckCards(
  campaignRef: string,
): Promise<{ success: true; count: number } | { error: string }> {
  const gate = await requireAdmin()
  if ('error' in gate) return gate

  try {
    const res = await db.campaignDeckCard.updateMany({
      where: {
        campaignRef,
        hexagramId: { gte: 1, lte: 8 },
        status: 'draft',
      },
      data: { status: 'active' },
    })
    return { success: true, count: res.count }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { error: msg }
  }
}

/**
 * Run period draw with instance id + kotter stage from DB when omitted.
 */
export async function drawCampaignPeriodAsAdmin(
  campaignRef: string,
): Promise<
  Awaited<ReturnType<typeof drawPeriod>>
> {
  const gate = await requireAdmin()
  if ('error' in gate) return gate

  const instance = await db.instance.findFirst({
    where: { OR: [{ campaignRef }, { slug: campaignRef }] },
    select: { id: true, kotterStage: true },
  })

  return drawPeriod({
    campaignRef,
    instanceId: instance?.id,
    kotterStage: instance?.kotterStage != null ? String(instance.kotterStage) : undefined,
  })
}
