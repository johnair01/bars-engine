import { describe, expect, it, vi, beforeEach } from 'vitest'

const rows: any[] = []
vi.mock('@/lib/auth', () => ({ getCurrentPlayer: async () => ({ id: 'p1' }) }))
vi.mock('@/lib/db', () => ({
  db: {
    customBar: {
      findMany: async () => rows.map((r) => ({ inputs: r.inputs })),
      create: async ({ data }: any) => { rows.push(data); return data },
    },
  },
}))

import { keepOntologyClaims } from '../ontology-claim'
import { encodeClaimCode } from '@/lib/ontology-game/claim-code'

const code = encodeClaimCode({
  v: 2, build: 'b', s: { totalCycles: 3, channelCounts: { anger: 2 }, channelsSatisfied: {} },
  k: [[1763350000000, 'anger', 'orange', 'green', 'w']],
})

describe('keepOntologyClaims', () => {
  beforeEach(() => { rows.length = 0 })
  it('writes one private BAR, and carrying twice writes once', async () => {
    expect(await keepOntologyClaims(code)).toMatchObject({ ok: true, written: 1 })
    expect(await keepOntologyClaims(code)).toMatchObject({ ok: true, written: 0 })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ type: 'claim', title: 'Triumph', visibility: 'private', satisfaction: 'anger:satisfied', gameMasterFace: 'green', evidenceKind: 'self-named' })
  })
  it('refuses a bad code with a reason', async () => {
    expect(await keepOntologyClaims('OAG2.x.y')).toMatchObject({ error: expect.stringContaining('refused') })
    expect(rows).toHaveLength(0)
  })
})
