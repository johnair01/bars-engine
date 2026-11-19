'use server'

import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { decodeClaimCode, claimTitle, claimSentence } from '@/lib/ontology-game/claim-code'

/** Decodes again on the server (never trusts the client), then writes one private claim BAR per
 * claim. Idempotent on (creatorId, at, channel). */
export async function keepOntologyClaims(code: string) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Sign in first' as const }
  const decoded = decodeClaimCode(code)
  if (!decoded.ok) return { error: `This code was refused: ${decoded.reason}` }

  const existing = await db.customBar.findMany({
    where: { creatorId: player.id, type: 'claim', evidenceKind: 'self-named' },
    select: { inputs: true },
  })
  const seen = new Set<string>()
  for (const row of existing) {
    try {
      const i = JSON.parse(row.inputs)
      seen.add(`${i.at}:${i.channel}`)
    } catch {}
  }

  let written = 0
  for (const c of decoded.claims) {
    if (seen.has(`${c.at}:${c.channel}`)) continue
    await db.customBar.create({
      data: {
        creatorId: player.id,
        type: 'claim',
        title: claimTitle(c.channel),
        description: claimSentence(c.channel, c.named),
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
          carriedAt: Date.now(),
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
  return { ok: true as const, written, kept: decoded.claims.length }
}

/** Read-only look for the carry page: decodes on the server so the browser needs no hashing. */
export async function previewOntologyClaims(code: string) {
  const decoded = decodeClaimCode(code)
  if (!decoded.ok) return { error: `This code was refused: ${decoded.reason}` }
  return {
    views: decoded.claims.map((c) => ({
      title: claimTitle(c.channel),
      sentence: claimSentence(c.channel, c.named),
      words: c.words,
    })),
  }
}
