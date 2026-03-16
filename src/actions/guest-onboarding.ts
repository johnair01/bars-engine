'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { generateNationContent } from '@/lib/birthday-onboarding/generate-nation'
import { generateArchetypeContent } from '@/lib/birthday-onboarding/generate-archetype'
import { generatePersonalBars } from '@/lib/birthday-onboarding/generate-personal-bars'

async function getPlayerId() {
  const cookieStore = await cookies()
  return cookieStore.get('bars_player_id')?.value ?? null
}

export async function createInstanceNation(input: {
  instanceId: string
  nationName: string
  element: string
  vibeText: string
}) {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }

  const generated = await generateNationContent(input.nationName, input.element, input.vibeText)

  const nation = await db.nation.create({
    data: {
      name: input.nationName,
      element: input.element,
      description: generated.description,
      wakeUp: generated.wakeUp,
      cleanUp: generated.cleanUp,
      growUp: generated.growUp,
      showUp: generated.showUp,
      instanceId: input.instanceId,
    },
  })
  return { nation }
}

export async function createInstanceArchetype(input: {
  instanceId: string
  archetypeName: string
  centralConflict: string
  primaryQuestion: string
  vibe: string
}) {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }

  const generated = await generateArchetypeContent(
    input.archetypeName,
    input.centralConflict,
    input.primaryQuestion,
    input.vibe,
  )

  const archetype = await db.archetype.create({
    data: {
      name: input.archetypeName,
      description: generated.description,
      content: generated.content,
      shadowSignposts: generated.shadowSignposts,
      centralConflict: input.centralConflict,
      primaryQuestion: input.primaryQuestion,
      vibe: input.vibe,
      moves: JSON.stringify(generated.moves),
      instanceId: input.instanceId,
    },
  })
  return { archetype }
}

export async function completeGuestOnboarding(input: {
  instanceId: string
  nationId: string
  archetypeId: string
  channel: string
  altitude: string
  intention: string
  archetypeName: string
}) {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }

  // Assign nation + archetype to player
  await db.player.update({
    where: { id: playerId },
    data: { nationId: input.nationId, archetypeId: input.archetypeId },
  })

  // Add to instance membership
  await db.instanceMembership.upsert({
    where: { instanceId_playerId: { playerId, instanceId: input.instanceId } },
    create: { playerId, instanceId: input.instanceId, roleKey: 'player' },
    update: {},
  })

  // Generate personal BARs
  let bars: { title: string; description: string }[] = []
  try {
    bars = await generatePersonalBars(
      input.channel,
      input.altitude,
      input.intention,
      input.archetypeName,
    )
    for (const bar of bars) {
      await db.customBar.create({
        data: {
          creatorId: playerId,
          title: bar.title,
          description: bar.description,
          status: 'active',
          visibility: 'private',
          claimedById: playerId,
        },
      })
    }
  } catch (err) {
    console.error('[guest-onboarding] personal BAR generation failed:', err)
  }

  return { success: true, personalBars: bars }
}

export async function exportNationToGlobal(nationId: string) {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }

  await db.nation.update({
    where: { id: nationId },
    data: { instanceId: null },
  })
  return { success: true }
}

export async function exportArchetypeToGlobal(archetypeId: string) {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }

  await db.archetype.update({
    where: { id: archetypeId },
    data: { instanceId: null },
  })
  return { success: true }
}
