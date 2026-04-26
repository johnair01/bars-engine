'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { fireTrigger } from '@/actions/quest-engine'
import { getAlignmentContext, drawAlignedHexagram, scoreHexagramAlignment } from '@/lib/iching-alignment'
import { GAME_MASTER_FACES } from '@/lib/quest-grammar/types'
import type { GameMasterFace } from '@/lib/quest-grammar/types'
import { createFaceMoveBar } from '@/actions/face-move-bar'
import {
  appendIChingReadingToStoryProgress,
  hasIChingCastContext,
  type IChingCastContext,
} from '@/lib/iching-cast-context'

/** Line-to-face mapping: line 1 (bottom) = Shaman, 2 = Challenger, 3 = Regent, 4 = Architect, 5 = Diplomat, 6 = Sage */
const LINE_TO_FACE: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']

export type CastIChingTraditionalResult = {
  hexagramId: number
  transformedHexagramId?: number
  changingLines: number[]
  faceMapping: Record<number, GameMasterFace>
}

/**
 * Traditional I Ching casting: 6 lines (yin/yang), optionally changing.
 * Line 1–6 map to Shaman, Challenger, Regent, Architect, Diplomat, Sage.
 *
 * DAOE Phase 1 / Shaman S-3: THE RANDOMNESS IS THE FEATURE.
 * This function IS the Fortune register — it is the system's primary source of genuine
 * unpredictability. When an engineer sees "performance optimization" here and is tempted to
 * cache results, replace Math.random() with a seeded RNG, or pre-assign hexagramIds, that
 * optimization DESTROYS the Fortune register. The randomness is not noise — it is the
 * signal. Without genuine randomness, the I Ching is a lookup table, not an oracle.
 * See: GM_GAP_ANALYSIS_RPG_ZINE_BAR_MATURITY.md §D7 + §Shaman felt-reality ground.
 */
export async function castIChingTraditional(opts?: {
  adventureId?: string
  nodeId?: string
  returnTargetId?: string
  /** Optional campaign / collective context (persisted via `persistHexagramContext`). */
  instanceId?: string | null
  campaignRef?: string | null
  threadId?: string | null
  /** 6 line values: 0=yin, 1=yang. When omitted, server simulates. */
  lines?: number[]
  /** Which line indices (0–5) are changing. When omitted, 0–2 random. */
  changingIndices?: number[]
}): Promise<CastIChingTraditionalResult | { error: string }> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value

  if (!playerId) {
    return { error: 'Not logged in' }
  }

  try {
    const lines = opts?.lines ?? Array.from({ length: 6 }, () => (Math.random() < 0.5 ? 0 : 1))
    if (lines.length !== 6) return { error: 'Must provide 6 lines' }

    const hexagramId = 1 + lines.reduce((acc, bit, i) => acc + bit * Math.pow(2, i), 0)
    if (hexagramId < 1 || hexagramId > 64) return { error: 'Invalid hexagram' }

    const changingIndices =
      opts?.changingIndices ??
      (() => {
        const count = Math.floor(Math.random() * 3)
        const indices: number[] = []
        while (indices.length < count) {
          const i = Math.floor(Math.random() * 6)
          if (!indices.includes(i)) indices.push(i)
        }
        return indices
      })()

    const transformedLines = lines.map((b, i) =>
      changingIndices.includes(i) ? 1 - b : b
    )
    const transformedHexagramId =
      changingIndices.length > 0
        ? 1 + transformedLines.reduce((acc, bit, i) => acc + bit * Math.pow(2, i), 0)
        : undefined

    const faceMapping: Record<number, GameMasterFace> = {}
    for (let i = 0; i < 6; i++) {
      faceMapping[i + 1] = LINE_TO_FACE[i]!
    }

    const hexagram = await db.bar.findUnique({ where: { id: hexagramId } })
    if (!hexagram) return { error: 'Hexagram not found' }

    return {
      hexagramId,
      transformedHexagramId,
      changingLines: changingIndices.map((i) => i + 1),
      faceMapping,
    }
  } catch (e) {
    console.error('[castIChingTraditional]', e)
    return { error: e instanceof Error ? e.message : 'Failed to cast' }
  }
}

/** Persist hexagram context to player storyProgress for in-quest flow. */
export async function persistHexagramContext(
  hexagramContext: CastIChingTraditionalResult,
  castContext?: IChingCastContext | null
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value

  if (!playerId) return { success: false, error: 'Not logged in' }

  try {
    const player = await db.player.findUnique({ where: { id: playerId } })
    if (!player) return { success: false, error: 'Player not found' }

    const parsed = (player.storyProgress ? JSON.parse(player.storyProgress) : {}) as {
      state?: Record<string, unknown>
    }
    const state = parsed?.state ?? {}
    state.hexagramId = hexagramContext.hexagramId
    state.transformedHexagramId = hexagramContext.transformedHexagramId
    state.changingLines = hexagramContext.changingLines
    state.hexagramFaceMapping = hexagramContext.faceMapping
    if (hasIChingCastContext(castContext)) {
      state.ichingCastContext = {
        instanceId: castContext?.instanceId ?? null,
        campaignRef: castContext?.campaignRef ?? null,
        threadId: castContext?.threadId ?? null,
        instanceName: castContext?.instanceName ?? null,
      }
    }

    await db.player.update({
      where: { id: playerId },
      data: { storyProgress: JSON.stringify({ ...parsed, state }) },
    })
    return { success: true }
  } catch (e) {
    console.error('[persistHexagramContext]', e)
    return { success: false, error: e instanceof Error ? e.message : 'Failed to persist' }
  }
}

export async function castIChing(opts?: { context?: IChingCastContext | null }) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { error: 'Not logged in' }
    }

    if (opts?.context && process.env.NODE_ENV === 'development') {
        console.debug('[castIChing] collective context', opts.context)
    }

    try {
        const context = await getAlignmentContext(playerId)
        const hexagramId = await drawAlignedHexagram(context)

        if (process.env.NODE_ENV !== 'production') {
            const { score, breakdown } = scoreHexagramAlignment(hexagramId, context)
            console.debug('[castIChing]', { hexagramId, score, breakdown })
        }

        // Fetch the hexagram data
        const hexagram = await db.bar.findUnique({
            where: { id: hexagramId }
        })

        if (!hexagram) {
            return { error: 'Hexagram not found' }
        }

        return {
            success: true,
            hexagram: {
                id: hexagram.id,
                name: hexagram.name,
                tone: hexagram.tone,
                text: hexagram.text,
            }
        }

    } catch (e: unknown) {
        console.error("Cast I Ching failed:", e instanceof Error ? e.message : String(e))
        return { error: 'Failed to cast' }
    }
}

/**
 * Shared persistence for aligned I Ching acceptance: PlayerBar, Sage face move, `storyProgress.ichingReadings`,
 * starterPack `iching_*` id, and `ICHING_CAST` trigger when starterPack exists.
 * Used by `acceptReading` and grammatic quest generation from a reading.
 */
export async function persistIChingReadingForPlayer(
    playerId: string,
    hexagramId: number,
    castContext: IChingCastContext | null | undefined,
    notesExtraLine: string | null | undefined
): Promise<{ success: true; hexagramName: string } | { error: string }> {
    try {
        const hexagram = await db.bar.findUnique({
            where: { id: hexagramId }
        })

        if (!hexagram) {
            return { error: 'Hexagram not found' }
        }

        const dateLine = `Cast on ${new Date().toLocaleDateString()}`
        const ctxParts: string[] = []
        if (castContext?.instanceName?.trim()) ctxParts.push(`Instance: ${castContext.instanceName.trim()}`)
        if (castContext?.campaignRef?.trim()) ctxParts.push(`Campaign: ${castContext.campaignRef.trim()}`)
        if (castContext?.threadId?.trim()) ctxParts.push(`Thread: ${castContext.threadId.trim()}`)
        let notes =
            ctxParts.length > 0 ? `${dateLine}\n${ctxParts.join(' · ')}` : dateLine
        if (notesExtraLine?.trim()) {
            notes = `${notes}\n${notesExtraLine.trim()}`
        }

        await db.playerBar.create({
            data: {
                playerId,
                barId: hexagramId,
                source: 'iching',
                notes,
            },
        })

        const meta: Record<string, unknown> = { hexagramId }
        if (hasIChingCastContext(castContext)) {
            meta.ichingContext = {
                instanceId: castContext?.instanceId ?? null,
                campaignRef: castContext?.campaignRef ?? null,
                threadId: castContext?.threadId ?? null,
                instanceName: castContext?.instanceName ?? null,
            }
        }

        await createFaceMoveBar('sage', 'cast_hexagram', {
            title: `I Ching: ${hexagram.name}`,
            description: hexagram.tone
                ? `${hexagram.tone}\n\n${hexagram.text ?? ''}`
                : hexagram.text ?? '',
            barType: 'vibe',
            metadata: meta,
        })

        const player = await db.player.findUnique({
            where: { id: playerId },
            select: { storyProgress: true },
        })
        const nextProgress = appendIChingReadingToStoryProgress(player?.storyProgress, {
            hexagramId,
            instanceId: castContext?.instanceId ?? null,
            campaignRef: castContext?.campaignRef ?? null,
            threadId: castContext?.threadId ?? null,
            instanceName: castContext?.instanceName ?? null,
        })
        await db.player.update({
            where: { id: playerId },
            data: { storyProgress: nextProgress },
        })

        const starterPack = await db.starterPack.findUnique({
            where: { playerId }
        })

        if (starterPack) {
            const data = JSON.parse(starterPack.data) as {
                completedBars: any[],
                activeBars: string[]
            }

            if (!data.activeBars) data.activeBars = []

            const ichingBarId = `iching_${hexagramId}`
            if (!data.activeBars.includes(ichingBarId)) {
                data.activeBars.push(ichingBarId)
            }

            await db.starterPack.update({
                where: { playerId },
                data: { data: JSON.stringify(data) }
            })

            await fireTrigger('ICHING_CAST')
        }

        return { success: true, hexagramName: hexagram.name }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error('[persistIChingReadingForPlayer]', msg)
        // Mask internal errors (API keys, quotas) from the user
        const isApiError = msg.includes('quota') || msg.includes('API') || msg.includes('OPENAI')
        return { error: isApiError ? 'Reading accepted, but some enrichment was skipped.' : 'Failed to persist reading' }
    }
}

export async function acceptReading(hexagramId: number, castContext?: IChingCastContext | null) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { error: 'Not logged in' }
    }

    const result = await persistIChingReadingForPlayer(playerId, hexagramId, castContext ?? null, null)
    if ('error' in result) {
        return { error: result.error }
    }

    revalidatePath('/')
    revalidatePath('/iching')
    revalidatePath('/campaign/board')

    return {
        success: true,
        message: `${result.hexagramName} has been added to your active quests.`
    }
}
