'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { decodeClaimCode, SATISFIED_NAME, SATISFIED_SENTENCES } from '@/lib/ontology-game/claim-code'

export type KeepResult =
  | { ok: true; written: number; alreadyKept: number }
  | { ok: false; reason: string }

/**
 * The player pressed "Keep these" on /claim. The server decodes the code again (never trusts the
 * client) and writes one private CustomBar per claim into existing columns. Idempotent on
 * (creatorId, at, channel): a code carried twice writes nothing new.
 */
export async function keepOntologyClaims(code: string): Promise<KeepResult> {
  const player = await getCurrentPlayer()
  if (!player) return { ok: false, reason: 'Sign in first' }

  const decoded = decodeClaimCode(code)
  if (!decoded.ok) return { ok: false, reason: decoded.reason }

  const existing = await db.customBar.findMany({
    where: { creatorId: player.id, type: 'claim', evidenceKind: 'self-named' },
    select: { inputs: true },
  })
  const seen = new Set<string>()
  for (const row of existing) {
    try {
      const i = JSON.parse(row.inputs)
      if (i && typeof i.at === 'number' && typeof i.channel === 'string') seen.add(`${i.at}:${i.channel}`)
    } catch {
      // not a claim row we wrote
    }
  }

  let written = 0
  let alreadyKept = 0
  for (const c of decoded.claims) {
    if (seen.has(`${c.at}:${c.channel}`)) {
      alreadyKept++
      continue
    }
    await db.customBar.create({
      data: {
        creatorId: player.id,
        type: 'claim',
        title: SATISFIED_NAME[c.channel],
        description: SATISFIED_SENTENCES[c.channel][c.named],
        emotionalAlchemyTag: c.channel,
        satisfaction: `${c.channel}:satisfied`,
        gameMasterFace: c.named,
        evidenceKind: 'self-named',
        visibility: 'private',
        inputs: JSON.stringify({
          at: c.at,
          channel: c.channel,
          lens: c.lens,
          named: c.named,
          words: c.words,
          build: decoded.build,
          codeHash: decoded.codeHash,
          counts: {
            channel: c.channel,
            cyclesInChannel: decoded.counts.channelCounts[c.channel] ?? 0,
            totalCycles: decoded.counts.totalCycles,
          },
        }),
      },
    })
    seen.add(`${c.at}:${c.channel}`)
    written++
  }
  return { ok: true, written, alreadyKept }
}
