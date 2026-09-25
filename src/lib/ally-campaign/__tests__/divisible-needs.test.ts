import { describe, expect, it } from 'vitest'

import { INPUTS, printEconomics, repaymentPlan } from '../economics'
import {
  ALL_NEEDS,
  groupNeedEntries,
  needsForSuperpower,
  superpowerFootprint,
  WORKSTREAMS,
} from '../workstreams'

const shareNeeds = ALL_NEEDS.filter((n) => n.share)
const groupIds = [...new Set(shareNeeds.map((n) => n.share!.groupId))]

describe('divisible needs (shares)', () => {
  it('the catalogue actually has a divisible ask', () => {
    expect(groupIds.length).toBeGreaterThan(0)
  })

  it.each(groupIds)('%s has contiguous 1..count indices, each declaring the same count', (groupId) => {
    const slices = shareNeeds
      .filter((n) => n.share!.groupId === groupId)
      .sort((a, b) => a.share!.index - b.share!.index)
    const count = slices[0].share!.count
    expect(slices).toHaveLength(count)
    expect(slices.map((s) => s.share!.index)).toEqual(
      Array.from({ length: count }, (_, i) => i + 1),
    )
    expect(slices.every((s) => s.share!.count === count)).toBe(true)
  })

  it.each(groupIds)('%s slices are uniform in value, unit and superpower', (groupId) => {
    const slices = shareNeeds.filter((n) => n.share!.groupId === groupId)
    expect(new Set(slices.map((s) => s.value)).size).toBe(1)
    expect(new Set(slices.map((s) => s.unit)).size).toBe(1)
    expect(new Set(slices.map((s) => s.superpower)).size).toBe(1)
  })

  it('every slice id is unique across the whole catalogue', () => {
    const ids = ALL_NEEDS.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('the print-run shares add up to the landed cost of the run, exactly', () => {
    const slices = shareNeeds.filter((n) => n.share!.groupId === 'aq-print-share')
    const totalCents = slices.reduce((s, n) => s + Math.round(n.value * 100), 0)
    expect(totalCents).toBe(printEconomics().landedTotalCents)
  })

  it('one share is a small enough bite to be a real answer', () => {
    const slices = shareNeeds.filter((n) => n.share!.groupId === 'aq-print-share')
    const landed = printEconomics().landedTotalCents
    expect(slices[0].value * 100).toBeLessThan(landed / 2)
  })
})

describe('groupNeedEntries', () => {
  it('collapses a slice group into exactly one entry carrying every slice', () => {
    const printNeeds = WORKSTREAMS.find((w) => w.key === 'print-run')!.needs
    const entries = groupNeedEntries(printNeeds)
    const groups = entries.filter((e) => e.kind === 'group')
    expect(groups).toHaveLength(1)
    const group = groups[0]
    if (group.kind !== 'group') throw new Error('narrowing')
    expect(group.slices).toHaveLength(group.slices[0].share!.count)
  })

  it('leaves non-divisible needs untouched, one entry each', () => {
    const printNeeds = WORKSTREAMS.find((w) => w.key === 'print-run')!.needs
    const singles = groupNeedEntries(printNeeds).filter((e) => e.kind === 'single')
    expect(singles).toHaveLength(printNeeds.filter((n) => !n.share).length)
  })

  it('never drops a need — every id survives grouping', () => {
    for (const w of WORKSTREAMS) {
      const entries = groupNeedEntries(w.needs)
      const covered = new Set(
        entries.flatMap((e) => (e.kind === 'group' ? e.slices.map((s) => s.id) : [e.need.id])),
      )
      for (const n of w.needs) expect(covered.has(n.id)).toBe(true)
    }
  })

  it('preserves superpower match ordering across grouping', () => {
    const ws = WORKSTREAMS.find((w) => w.key === 'print-run')!
    const ordered = needsForSuperpower('strategist', 'external', { domain: ws.domain })
    const inWs = new Set(ws.needs.map((n) => n.id))
    const entries = groupNeedEntries(ordered.filter((n) => inWs.has(n.id)))
    // The strategist-typed share group should lead its workstream's list.
    expect(entries[0].need.superpower).toBe('strategist')
  })
})

describe('superpowerFootprint', () => {
  it('covers every domain the campaign has work in', () => {
    const domains = new Set(WORKSTREAMS.map((w) => w.domain))
    expect(new Set(superpowerFootprint('connector').map((f) => f.domain))).toEqual(domains)
  })

  it('never reports an empty domain — the quiz routes, it does not gate', () => {
    for (const f of superpowerFootprint('connector', 'external')) {
      expect(f.total).toBeGreaterThan(0)
      expect(f.exemplar).toBeDefined()
    }
  })

  it('matched never exceeds total, and counts real superpower-typed needs', () => {
    for (const f of superpowerFootprint('storyteller')) {
      expect(f.matched).toBeLessThanOrEqual(f.total)
    }
  })

  it('counts asks, not slice rows — a divisible ask is one job, not ten', () => {
    const gathering = superpowerFootprint('strategist').find(
      (f) => f.domain === 'GATHERING_RESOURCES',
    )!
    const rawRows = WORKSTREAMS.filter((w) => w.domain === 'GATHERING_RESOURCES').flatMap(
      (w) => w.needs,
    ).length
    expect(gathering.total).toBeLessThan(rawRows)
    expect(gathering.total).toBe(
      groupNeedEntries(
        WORKSTREAMS.filter((w) => w.domain === 'GATHERING_RESOURCES').flatMap((w) => w.needs),
      ).length,
    )
  })

  it('a null superpower matches nothing but still offers an exemplar everywhere', () => {
    for (const f of superpowerFootprint(null)) {
      expect(f.matched).toBe(0)
      expect(f.exemplar).toBeDefined()
    }
  })
})

describe('pre-sold obligations', () => {
  const p = printEconomics()

  it('separates copies owed from copies that can earn', () => {
    expect(p.obligationUnits).toBe(INPUTS.presoldUnits)
    expect(p.sellableUnits).toBe(INPUTS.printRunUnits - INPUTS.presoldUnits)
  })

  it('repayment capacity counts only sellable copies, never the run size', () => {
    expect(repaymentPlan().booksAvailable).toBe(p.sellableUnits)
  })

  it('reports honestly whether the run can break even on what is left to sell', () => {
    expect(p.coversRunFromSellable).toBe(p.breakEvenUnits <= p.sellableUnits)
  })

  it('clamps rather than going negative when obligations exceed the run', () => {
    const over = printEconomics({ ...INPUTS, printRunUnits: 100, presoldUnits: 400 })
    expect(over.sellableUnits).toBe(0)
    expect(over.obligationUnits).toBe(100)
    expect(over.coversRunFromSellable).toBe(false)
  })
})
