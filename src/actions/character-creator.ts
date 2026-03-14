'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ICHING_NAMES = new Set([
  'Heaven (Qian)',
  'Earth (Kun)',
  'Thunder (Zhen)',
  'Wind (Xun)',
  'Water (Kan)',
  'Fire (Li)',
  'Mountain (Gen)',
  'Lake (Dui)',
])

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ArchetypeData = {
  id: string
  name: string
  description: string
  primaryQuestion: string | null
  wakeUp: string | null
  cleanUp: string | null
  growUp: string | null
  showUp: string | null
  vibe: string | null
  energy: string | null
  shadowSignposts: string | null
  lightSignposts: string | null
}

export type NationMoveData = {
  id: string
  key: string
  name: string
  description: string
  sortOrder: number
}

export type SaveCharacterData = {
  archetypeId: string
  nationId?: string
  playbookName: string
  playerAnswers: {
    discovery: Array<{ qId: string; choiceKey: string; weights: Record<string, number> }>
    nationDiscovery: Array<{ qId: string; choiceKey: string }>
    community: string
    dreams: Array<{ qId: string; question: string; answer: string }>
    fears: Array<{ beliefId: string; original: string; personalized: string }>
  }
  playbookMoves: Array<{ id: string; name: string; key: string }>
  playbookBonds: Array<{ id: string; name: string; key: string }>
}

export type PublicCharacterData = {
  id: string
  playbookName: string
  playerAnswers: string | null
  playbookMoves: string | null
  playbookBonds: string | null
  shareToken: string
  completedAt: Date | null
  archetype: {
    id: string
    name: string
    description: string
    primaryQuestion: string | null
    vibe: string | null
    energy: string | null
    shadowSignposts: string | null
    lightSignposts: string | null
  } | null
}

// ---------------------------------------------------------------------------
// getArchetypes — returns the 8 named archetypes only (no I Ching trigrams)
// ---------------------------------------------------------------------------

export async function getArchetypes(): Promise<ArchetypeData[]> {
  const all = await db.archetype.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      primaryQuestion: true,
      wakeUp: true,
      cleanUp: true,
      growUp: true,
      showUp: true,
      vibe: true,
      energy: true,
      shadowSignposts: true,
      lightSignposts: true,
    },
    orderBy: { name: 'asc' },
  })
  return all.filter((a) => !ICHING_NAMES.has(a.name))
}

// ---------------------------------------------------------------------------
// getArchetypeById — single archetype (must be named, not I Ching)
// ---------------------------------------------------------------------------

export async function getArchetypeById(archetypeId: string): Promise<ArchetypeData | null> {
  const a = await db.archetype.findUnique({
    where: { id: archetypeId },
    select: {
      id: true,
      name: true,
      description: true,
      primaryQuestion: true,
      wakeUp: true,
      cleanUp: true,
      growUp: true,
      showUp: true,
      vibe: true,
      energy: true,
      shadowSignposts: true,
      lightSignposts: true,
    },
  })
  if (!a || ICHING_NAMES.has(a.name)) return null
  return a
}

// ---------------------------------------------------------------------------
// getNationMoves — gets moves for the player's nation
// ---------------------------------------------------------------------------

export async function getNationMoves(nationId: string): Promise<NationMoveData[]> {
  const moves = await db.nationMove.findMany({
    where: { nationId },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      sortOrder: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
  return moves
}

// ---------------------------------------------------------------------------
// getNationByName — resolves nation key/name to DB record
// ---------------------------------------------------------------------------

export async function getNationByName(name: string): Promise<{ id: string; name: string } | null> {
  return db.nation.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true, name: true },
  })
}

// ---------------------------------------------------------------------------
// getCharacterCreatorData — loads all data needed for the CYOA runner
// ---------------------------------------------------------------------------

export async function getCharacterCreatorData(): Promise<{
  archetypes: ArchetypeData[]
  playerNationId: string | null
  playerNationName: string | null
  existingPlaybook: { shareToken: string } | null
}> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value

  const archetypes = await getArchetypes()

  if (!playerId) {
    return { archetypes, playerNationId: null, playerNationName: null, existingPlaybook: null }
  }

  const player = await db.player.findUnique({
    where: { id: playerId },
    select: {
      nationId: true,
      nation: { select: { name: true } },
    },
  })

  const existing = await db.playerPlaybook.findFirst({
    where: { playerId, completedAt: { not: null } },
    orderBy: { completedAt: 'desc' },
    select: { shareToken: true },
  })

  return {
    archetypes,
    playerNationId: player?.nationId ?? null,
    playerNationName: player?.nation?.name ?? null,
    existingPlaybook: existing ?? null,
  }
}

// ---------------------------------------------------------------------------
// saveCharacterPlaybook — saves PlayerPlaybook, sets player.archetypeId
// Works standalone — no adventure context required
// ---------------------------------------------------------------------------

export async function saveCharacterPlaybook(
  data: SaveCharacterData
): Promise<{ success: true; shareToken: string; playbookId: string } | { error: string }> {
  try {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value
    if (!playerId) return { error: 'Not authenticated' }

    const player = await db.player.findUnique({
      where: { id: playerId },
      select: { id: true },
    })
    if (!player) return { error: 'Player not found' }

    // Upsert: one playbook per player (most recent completed)
    const existing = await db.playerPlaybook.findFirst({
      where: { playerId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, shareToken: true },
    })

    let playbook: { id: string; shareToken: string }

    if (existing) {
      playbook = await db.playerPlaybook.update({
        where: { id: existing.id },
        data: {
          playbookName: data.playbookName,
          playerAnswers: JSON.stringify(data.playerAnswers),
          playbookMoves: JSON.stringify(data.playbookMoves),
          playbookBonds: JSON.stringify(data.playbookBonds),
          completedAt: new Date(),
        },
        select: { id: true, shareToken: true },
      })
    } else {
      playbook = await db.playerPlaybook.create({
        data: {
          playerId,
          adventureId: undefined,
          playbookName: data.playbookName,
          playerAnswers: JSON.stringify(data.playerAnswers),
          playbookMoves: JSON.stringify(data.playbookMoves),
          playbookBonds: JSON.stringify(data.playbookBonds),
          completedAt: new Date(),
        },
        select: { id: true, shareToken: true },
      })
    }

    // Set player.archetypeId and optionally nationId
    await db.player.update({
      where: { id: playerId },
      data: {
        archetypeId: data.archetypeId,
        ...(data.nationId ? { nationId: data.nationId } : {}),
      },
    })

    revalidatePath('/character-creator')
    revalidatePath('/character')

    return { success: true, shareToken: playbook.shareToken, playbookId: playbook.id }
  } catch (error) {
    console.error('[character-creator] saveCharacterPlaybook failed:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ---------------------------------------------------------------------------
// getPublicCharacter — public lookup by shareToken, no auth required
// ---------------------------------------------------------------------------

export async function getPublicCharacter(shareToken: string): Promise<PublicCharacterData | null> {
  const playbook = await db.playerPlaybook.findUnique({
    where: { shareToken },
    select: {
      id: true,
      playbookName: true,
      playerAnswers: true,
      playbookMoves: true,
      playbookBonds: true,
      shareToken: true,
      completedAt: true,
    },
  })
  if (!playbook) return null

  const archetype = await db.archetype.findFirst({
    where: { name: playbook.playbookName },
    select: {
      id: true,
      name: true,
      description: true,
      primaryQuestion: true,
      vibe: true,
      energy: true,
      shadowSignposts: true,
      lightSignposts: true,
    },
  })

  return {
    id: playbook.id,
    playbookName: playbook.playbookName,
    playerAnswers: playbook.playerAnswers,
    playbookMoves: playbook.playbookMoves,
    playbookBonds: playbook.playbookBonds,
    shareToken: playbook.shareToken,
    completedAt: playbook.completedAt,
    archetype: archetype ?? null,
  }
}

// ---------------------------------------------------------------------------
// getPlayerCharacter — get the current player's completed character (if any)
// ---------------------------------------------------------------------------

export async function getPlayerCharacter(): Promise<{
  playbook: PublicCharacterData | null
  archetypeId: string | null
}> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) return { playbook: null, archetypeId: null }

  const player = await db.player.findUnique({
    where: { id: playerId },
    select: { archetypeId: true },
  })

  const existing = await db.playerPlaybook.findFirst({
    where: {
      playerId,
      completedAt: { not: null },
    },
    orderBy: { completedAt: 'desc' },
    select: { shareToken: true },
  })

  if (!existing) return { playbook: null, archetypeId: player?.archetypeId ?? null }

  const playbook = await getPublicCharacter(existing.shareToken)
  return { playbook, archetypeId: player?.archetypeId ?? null }
}

// ---------------------------------------------------------------------------
// Admin: saveArchetypeTemplate — save playbookTemplate to adventure
// ---------------------------------------------------------------------------

export async function saveArchetypeTemplate(
  adventureId: string,
  template: object
): Promise<{ success: true } | { error: string }> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not authenticated' }
    const isAdmin = (player as any).roles?.some((r: any) => r.role?.key === 'admin')
    const isGm = (player as any).roles?.some((r: any) => r.role?.key === 'gm')
    if (!isAdmin && !isGm) return { error: 'Unauthorized' }

    await db.adventure.update({
      where: { id: adventureId },
      data: {
        playbookTemplate: JSON.stringify(template),
      },
    })

    revalidatePath(`/admin/adventures/${adventureId}`)
    return { success: true }
  } catch (error) {
    console.error('[character-creator] saveArchetypeTemplate failed:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
