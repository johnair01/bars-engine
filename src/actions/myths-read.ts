'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { getCurrentPlayer } from '@/lib/auth'
import { mergeSeedMetabolization } from '@/lib/bar-seed-metabolization/parse'
import {
  MYTH_BY_ID,
  MYTH_CHARGE_FLAVORS,
  MYTH_GAME_FACES,
  MYTH_READ_ITEMS,
  buildMythReadPersistencePayload,
  type MythChargeIntensity,
  type MythGameFaceKey,
  type MythReadAnswerValue,
  type MythReadCharge,
  type MythReadItem,
} from '@/lib/mastering-allyship/myths-read'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type SaveMythReadState =
  | { ok: true; mythReadId: string; barId: string | null; redirectTo: string }
  | { ok: false; error: string }

export async function saveMythRead(input: {
  answers: Partial<Record<MythReadItem['id'], MythReadAnswerValue>>
  email?: string
  consent?: boolean
  source?: string
  capturedCharge?: MythReadCharge | null
  gameFace?: MythGameFaceKey | null
  createSeedBar?: boolean
}): Promise<SaveMythReadState> {
  const answers = normalizeAnswers(input.answers)
  if (Object.keys(answers).length < MYTH_READ_ITEMS.length) {
    return { ok: false, error: 'Finish the read before saving it.' }
  }

  const email = input.email?.trim().toLowerCase() || null
  if (email && !EMAIL_RE.test(email)) {
    return { ok: false, error: 'Please enter a valid email.' }
  }

  const gameFace = normalizeGameFace(input.gameFace ?? input.capturedCharge?.gameFace)
  const capturedCharge = normalizeCharge(
    input.capturedCharge ? { ...input.capturedCharge, gameFace } : null,
  )
  if (input.createSeedBar && !capturedCharge) {
    return { ok: false, error: 'Choose a myth, flavor, and intensity before metabolizing.' }
  }
  if (input.createSeedBar && !gameFace) {
    return { ok: false, error: 'Choose the game you want to play with this energy.' }
  }

  const player = await getCurrentPlayer()
  const payload = buildMythReadPersistencePayload(answers, capturedCharge)
  const source = input.source?.trim().slice(0, 120) || 'mastering-allyship-ch0'

  try {
    const created = await db.$transaction(async (tx) => {
      let barId: string | null = null

      if (input.createSeedBar && capturedCharge && player) {
        const myth = MYTH_BY_ID[capturedCharge.mythId]
        const flavor = MYTH_CHARGE_FLAVORS.find((entry) => entry.key === capturedCharge.flavor)!
        const game = MYTH_GAME_FACES.find((entry) => entry.key === gameFace)!
        const intensityLabel = intensityToLabel(capturedCharge.intensity)
        const title = `${game.gameName}: ${myth.short}`.slice(0, 80)
        const description = [
          `"${myth.claim}"`,
          '',
          `Charge: ${flavor.label.toLowerCase()} at ${intensityLabel.toLowerCase()} strength.`,
          `Game: ${game.gameName} (${game.face}).`,
          `Next step: ${game.nextStep}`,
          '',
          myth.move,
        ].join('\n')

        const bar = await tx.customBar.create({
          data: {
            creatorId: player.id,
            title,
            description,
            type: 'charge_capture',
            reward: 0,
            visibility: 'private',
            status: 'active',
            inputs: JSON.stringify({
              source: 'myths_read',
              mythId: myth.id,
              mythShort: myth.short,
              flavor: capturedCharge.flavor,
              intensity: capturedCharge.intensity,
              gameFace: game.key,
              gameName: game.gameName,
              nextStep: game.nextStep,
            }),
            rootId: 'temp',
            questSource: 'myths_read',
            campaignRef: 'mastering-allyship',
            emotionalAlchemyTag: capturedCharge.flavor,
            intensity: String(capturedCharge.intensity),
            seedMetabolization: mergeSeedMetabolization(null, {
              maturity: 'captured',
              soilKind: 'holding_pen',
              contextNote: `${myth.short} · ${flavor.label} · ${intensityLabel}`,
            }),
            agentMetadata: JSON.stringify({
              schemaVersion: 'myths-read.v1',
              source,
              mythId: myth.id,
              flavor: capturedCharge.flavor,
              intensity: capturedCharge.intensity,
              gameFace: game.key,
              gameName: game.gameName,
              nextStep: game.nextStep,
              savedAt: new Date().toISOString(),
            }),
          },
          select: { id: true },
        })

        barId = bar.id
        await tx.customBar.update({ where: { id: barId }, data: { rootId: barId } })
      }

      const mythRead = await tx.mythRead.create({
        data: {
          userId: player?.id ?? null,
          email,
          source,
          responses: payload.responses,
          mythScores: payload.mythScores,
          topMyths: payload.topMyths,
          rootBeliefs: payload.rootBeliefs,
          recommendedDestinations: payload.recommendedDestinations,
          ...(payload.capturedCharge
            ? { capturedCharge: payload.capturedCharge as unknown as Prisma.InputJsonValue }
            : {}),
          seedBarDrafts: payload.seedBarDrafts as unknown as Prisma.InputJsonValue,
          ctaPrimary: 'deck',
          consent: Boolean(input.consent),
          createdBarId: barId,
        },
        select: { id: true },
      })

      return { mythReadId: mythRead.id, barId }
    })

    revalidatePath('/mastering-allyship/myths-read')
    if (created.barId) {
      revalidatePath('/vault')
      revalidatePath('/bars/garden')
    }

    return {
      ok: true,
      mythReadId: created.mythReadId,
      barId: created.barId,
      redirectTo: created.barId
        ? `/bars/${created.barId}?source=myths-read`
        : `/login?next=${encodeURIComponent('/mastering-allyship/myths-read')}`,
    }
  } catch (err) {
    console.error('[myths-read] failed to save read', err)
    return { ok: false, error: 'Something went wrong saving that read. Please try again.' }
  }
}

function normalizeAnswers(
  answers: Partial<Record<MythReadItem['id'], MythReadAnswerValue>>,
): Partial<Record<MythReadItem['id'], MythReadAnswerValue>> {
  const normalized: Partial<Record<MythReadItem['id'], MythReadAnswerValue>> = {}
  for (const item of MYTH_READ_ITEMS) {
    const value = answers[item.id]
    if (value === 0 || value === 1 || value === 2 || value === 3 || value === 4) {
      normalized[item.id] = value
    }
  }
  return normalized
}

function normalizeCharge(charge: MythReadCharge | null | undefined): MythReadCharge | null {
  if (!charge) return null
  if (!MYTH_BY_ID[charge.mythId]) return null
  if (!MYTH_CHARGE_FLAVORS.some((entry) => entry.key === charge.flavor)) return null
  if (![2, 4, 6, 8, 10].includes(charge.intensity)) return null
  return charge
}

function normalizeGameFace(gameFace: MythGameFaceKey | null | undefined): MythGameFaceKey | null {
  if (!gameFace) return null
  return MYTH_GAME_FACES.some((entry) => entry.key === gameFace) ? gameFace : null
}

function intensityToLabel(intensity: MythChargeIntensity): string {
  switch (intensity) {
    case 2:
      return 'Faint'
    case 4:
      return 'Mild'
    case 6:
      return 'Live'
    case 8:
      return 'Heavy'
    case 10:
      return 'Overwhelming'
  }
}
