/**
 * Δ I5 of the Six Faces consult: *prove* an attribution failure cannot fail,
 * delay, or retry a sale.
 *
 * The original code asserted this in a comment. Challenger's instruction was to
 * verify rather than trust — and on inspection the throw-safety held, but the
 * *stall* case did not: a `try/catch` catches an exception and does nothing
 * about a slow query, on a path Gumroad retries when it times out. So a stalled
 * database would have presented as duplicate sale pings, which is the sort of
 * failure that gets misdiagnosed for a week.
 *
 * These tests exercise both, without a database or a webhook.
 */
import { describe, it, expect, vi } from 'vitest'
import { ATTRIBUTION_BUDGET_MS, attributeSale, type AttributionDeps } from '../attribution'
import { ALLY_PARAM, readReferralMetadata } from '../referral'

const LEAD = 'clx0000000000000000000000'

/** A ping carrying an ally param, in the shape Gumroad sends. */
function ping(allyId: string | null): (key: string) => string | null {
  return (key) => (allyId && key === `url_params[${ALLY_PARAM}]` ? allyId : null)
}

function deps(over: Partial<AttributionDeps> = {}): AttributionDeps {
  return {
    get: ping(LEAD),
    codeId: 'code_1',
    currentMetadata: null,
    findLead: async (id) => (id === LEAD ? LEAD : null),
    writeMetadata: async () => {},
    ...over,
  }
}

describe('the happy path still works', () => {
  it('credits a sale whose ping names a real lead', async () => {
    const writes: { codeId: string; metadata: string }[] = []
    const out = await attributeSale(
      deps({ writeMetadata: async (codeId, metadata) => void writes.push({ codeId, metadata }) }),
    )

    expect(out).toEqual({ credited: true, allyLeadId: LEAD })
    expect(writes).toHaveLength(1)
    expect(readReferralMetadata(writes[0].metadata)?.allyLeadId).toBe(LEAD)
  })

  it('preserves metadata that was already on the row', async () => {
    let written = ''
    await attributeSale(
      deps({
        currentMetadata: JSON.stringify({ somethingElse: 'keep me' }),
        writeMetadata: async (_c, m) => void (written = m),
      }),
    )
    expect(JSON.parse(written).somethingElse).toBe('keep me')
    expect(readReferralMetadata(written)?.allyLeadId).toBe(LEAD)
  })
})

describe('it declines quietly rather than crediting wrongly', () => {
  it('no ally param — nothing to do, nothing written', async () => {
    const write = vi.fn()
    const out = await attributeSale(deps({ get: ping(null), writeMetadata: write }))
    expect(out).toEqual({ credited: false, reason: 'no-ally-param' })
    expect(write).not.toHaveBeenCalled()
  })

  it('a malformed id is rejected before it ever reaches the database', async () => {
    // `allyFromGumroadPing` shape-checks first, so junk in the query string costs
    // zero queries on the payment path. Worth pinning — it is a real defence and
    // an easy one to lose in a refactor.
    const findLead = vi.fn()
    const write = vi.fn()
    const out = await attributeSale(
      deps({ get: ping('not-a-real-lead'), findLead, writeMetadata: write }),
    )
    expect(out).toEqual({ credited: false, reason: 'no-ally-param' })
    expect(findLead).not.toHaveBeenCalled()
    expect(write).not.toHaveBeenCalled()
  })

  it('a well-formed id that names no lead is not credited', async () => {
    // A fictional ally on the steward's board is worse than no number, because
    // nobody can trace it back to find out it was never real.
    const write = vi.fn()
    const out = await attributeSale(
      deps({
        get: ping('clx9999999999999999999999'),
        findLead: async () => null,
        writeMetadata: write,
      }),
    )
    expect(out).toEqual({ credited: false, reason: 'unknown-lead' })
    expect(write).not.toHaveBeenCalled()
  })
})

describe('THE CLAIM — an attribution failure cannot fail a sale', () => {
  it('a throw while looking up the lead is swallowed', async () => {
    const out = await attributeSale(
      deps({
        findLead: async () => {
          throw new Error('connection reset')
        },
      }),
    )
    expect(out).toEqual({ credited: false, reason: 'error' })
  })

  it('a throw while writing is swallowed', async () => {
    const out = await attributeSale(
      deps({
        writeMetadata: async () => {
          throw new Error('unique constraint')
        },
      }),
    )
    expect(out).toEqual({ credited: false, reason: 'error' })
  })

  it('a synchronous throw from the ping accessor is swallowed', async () => {
    const out = await attributeSale(
      deps({
        get: () => {
          throw new Error('malformed payload')
        },
      }),
    )
    expect(out).toEqual({ credited: false, reason: 'error' })
  })

  it('NEVER rejects, whatever goes wrong', async () => {
    // The property that actually matters to the caller: no `await` in the
    // webhook can throw because of attribution.
    const shapes: Partial<AttributionDeps>[] = [
      { findLead: async () => { throw new Error('x') } },
      { writeMetadata: async () => { throw new Error('x') } },
      { get: () => { throw new Error('x') } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { findLead: undefined as any },
    ]
    for (const shape of shapes) {
      await expect(attributeSale(deps(shape))).resolves.toBeDefined()
    }
  })
})

describe('THE CLAIM — an attribution stall cannot delay a sale', () => {
  it('gives up when the database hangs, instead of holding the handler open', async () => {
    // The failure a try/catch does nothing about. Gumroad retries on timeout, so
    // a stall here presents as duplicate pings rather than as an attribution bug.
    const started = Date.now()
    const out = await attributeSale(
      deps({
        findLead: () => new Promise(() => {}), // never settles
        budgetMs: 40,
      }),
    )
    const elapsed = Date.now() - started

    expect(out).toEqual({ credited: false, reason: 'timed-out' })
    expect(elapsed).toBeLessThan(1000)
  })

  it('gives up on a stalled WRITE too, not just a stalled read', async () => {
    const out = await attributeSale(
      deps({ writeMetadata: () => new Promise(() => {}), budgetMs: 40 }),
    )
    expect(out).toEqual({ credited: false, reason: 'timed-out' })
  })

  it('does not cut off work that finishes inside the budget', async () => {
    const out = await attributeSale(
      deps({
        findLead: async (id) => {
          await new Promise((r) => setTimeout(r, 10))
          return id
        },
        budgetMs: 200,
      }),
    )
    expect(out).toEqual({ credited: true, allyLeadId: LEAD })
  })

  it('ships with a budget short enough to matter on a webhook path', () => {
    expect(ATTRIBUTION_BUDGET_MS).toBeLessThanOrEqual(3000)
  })
})
