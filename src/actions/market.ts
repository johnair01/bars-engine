'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { parseCampaignDomainPreference } from '@/lib/allyship-domains'
import { getActiveInstance } from '@/actions/instance'
import type { MarketQuest } from '@/lib/market-api'

// ===================================
// TOWN SQUARE (MARKET) ACTIONS
// ===================================

/**
 * Get player-created quests only (isSystem: false).
 * API-first: returns typed MarketQuest[]. Used by Market page.
 * Spec: .specify/specs/market-redesign-launch/spec.md FR1
 */
export async function getMarketQuests(): Promise<MarketQuest[]> {
  const player = await getCurrentPlayer()
  const playerWithRoles = player
    ? await db.player.findUnique({
        where: { id: player.id },
        include: { roles: { include: { role: true } } },
      })
    : null
  const [globalState, activeInstance, publicQuests] = await Promise.all([
    db.globalState.findUnique({ where: { id: 'singleton' } }),
    getActiveInstance(),
    db.customBar.findMany({
      where: { visibility: 'public', status: 'active', isSystem: false },
      include: {
        creator: {
          include: { nation: true, archetype: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])
  // Exclude onboarding BARs (spec: onboarding-bars-wallet). They belong in creator's wallet, not marketplace.
  const excludeOnboarding = publicQuests.filter((q) => {
    if (!q.completionEffects) return true
    try {
      const parsed = JSON.parse(q.completionEffects) as { onboarding?: boolean }
      return parsed.onboarding !== true
    } catch {
      return true
    }
  })
  let filtered = excludeOnboarding
  if (globalState?.isPaused) {
    filtered = filtered.filter((q) => q.kotterStage === 1)
  }
  if (activeInstance) {
    const stage = activeInstance.kotterStage ?? 1
    filtered = filtered.filter((q) => q.kotterStage === stage)
  }
  if (player && playerWithRoles) {
    filtered = filtered.filter((q) => {
      if (q.allowedNations) {
        try {
          const allowed = JSON.parse(q.allowedNations) as string[]
          if (allowed.length > 0 && player.nation && !allowed.includes(player.nation.name)) {
            return false
          }
        } catch {
          /* ignore */
        }
      }
      if (q.allowedTrigrams) {
        try {
          const allowed = JSON.parse(q.allowedTrigrams) as string[]
          if (allowed.length > 0 && player.archetype) {
            const trigram = player.archetype.name.split(' ')[0]
            if (!allowed.includes(trigram)) return false
          }
        } catch {
          /* ignore */
        }
      }
      const pref = playerWithRoles.campaignDomainPreference
        ? parseCampaignDomainPreference(playerWithRoles.campaignDomainPreference)
        : []
      if (pref.length > 0) {
        if (!q.allyshipDomain || !pref.includes(q.allyshipDomain)) return false
      }
      return true
    })
  }
  return filtered.map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    reward: q.reward,
    allyshipDomain: q.allyshipDomain,
    kotterStage: q.kotterStage,
    visibility: q.visibility,
    isBounty: q.questSource === 'bounty' || (q.stakedPool ?? 0) > 0,
    creator: q.creator
      ? {
          id: q.creator.id,
          name: q.creator.name,
          avatarConfig: q.creator.avatarConfig,
          nation: q.creator.nation ? { name: q.creator.nation.name } : null,
          archetype: q.creator.archetype ? { name: q.creator.archetype.name } : null,
        }
      : null,
  }))
}

/**
 * Get all content available in the Town Square.
 * Uses getMarketQuests for player-created quests (API-first).
 */
export async function getMarketContent() {
    const player = await getCurrentPlayer()
    const playerWithRoles = player
        ? await db.player.findUnique({
              where: { id: player.id },
              include: { roles: { include: { role: true } } },
          })
        : null
    const isAdmin = !!playerWithRoles?.roles.some((r) => r.role.key === 'admin')

    const [publicPacks, graveyardQuests, quests] = await Promise.all([
        db.questPack.findMany({
            where: { visibility: 'public', status: 'active' },
            include: {
                quests: { include: { quest: true } },
                progress: player ? { where: { playerId: player.id } } : undefined,
            },
            orderBy: { createdAt: 'desc' },
        }),
        isAdmin && player
            ? db.customBar.findMany({
                  where: {
                      isSystem: true,
                      assignments: {
                          some: { playerId: player.id, status: 'completed' },
                      },
                  },
                  include: {
                      microTwine: true,
                      creator: { include: { nation: true, archetype: true } },
                  },
                  orderBy: { createdAt: 'desc' },
              })
            : [],
        getMarketQuests(),
    ])

    const graveyardTyped = graveyardQuests.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        reward: q.reward,
        allyshipDomain: q.allyshipDomain,
        kotterStage: q.kotterStage,
        creator: q.creator
            ? {
                  id: q.creator.id,
                  name: q.creator.name,
                  avatarConfig: q.creator.avatarConfig,
                  nation: q.creator.nation ? { name: q.creator.nation.name } : null,
                  archetype: q.creator.archetype ? { name: q.creator.archetype.name } : null,
              }
            : null,
    }))

    const activeInstance = await getActiveInstance()
    return {
        currentPlayerId: player?.id ?? null,
        packs: publicPacks.map((p) => ({
            ...p,
            isOwned: p.progress && p.progress.length > 0,
        })),
        quests,
        graveyardQuests: graveyardTyped,
        campaignDomainPreference: playerWithRoles?.campaignDomainPreference ?? null,
        activeInstanceKotterStage: activeInstance?.kotterStage ?? null,
        activeInstanceName: activeInstance?.name ?? null,
    }
}

/**
 * Pickup a pack from the market
 * (Just starts it for the player)
 */
export async function pickupMarketPack(packId: string) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    // Check if valid public pack
    const pack = await db.questPack.findUnique({
        where: { id: packId }
    })

    if (!pack || (pack.visibility !== 'public' && pack.creatorId !== player.id)) {
        return { error: 'Pack not available' }
    }

    // Initialize progress if not exists
    const existing = await db.packProgress.findUnique({
        where: {
            packId_playerId: { packId, playerId: player.id }
        }
    })

    if (existing) return { error: 'Already have this pack' }

    await db.packProgress.create({
        data: {
            packId,
            playerId: player.id,
            completed: '[]'
        }
    })

    revalidatePath('/bars/available')
    revalidatePath('/')
    return { success: true }
}

/**
 * Pickup a quest from the market
 * (Assigns it to the player)
 */
export async function pickupMarketQuest(questId: string) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const quest = await db.customBar.findUnique({
        where: { id: questId }
    })

    if (!quest || quest.visibility !== 'public') {
        return { error: 'Quest not available' }
    }

    // Check if already assigned or completed
    const existing = await db.playerQuest.findUnique({
        where: {
            playerId_questId: { playerId: player.id, questId }
        }
    })

    if (existing) {
        if (existing.status === 'completed' && quest.isSystem) {
            return { error: 'Quest completed. Restore from Graveyard to re-run.' }
        }
        return { error: 'Already accepted this quest' }
    }

    await db.playerQuest.create({
        data: {
            playerId: player.id,
            questId,
            status: 'assigned'
        }
    })

    revalidatePath('/bars/available')
    revalidatePath('/')
    return { success: true }
}

/**
 * Recycle a completed pack (Make it public)
 */
export async function recyclePack(packId: string) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    // Verify ownership and completion
    const pack = await db.questPack.findUnique({
        where: { id: packId },
        include: {
            progress: { where: { playerId: player.id } }
        }
    })

    if (!pack) return { error: 'Pack not found' }
    // Only creator can recycle? Or anyone who completes it?
    // For now: Creator only can recycle TO public.
    if (pack.creatorId !== player.id) return { error: 'Only the creator can recycle this pack' }

    // Check if completed? (Optional requirement)
    // For now, let them publish anytime.

    await db.questPack.update({
        where: { id: packId },
        data: { visibility: 'public' }
    })

    revalidatePath('/bars/available')
    return { success: true }
}
