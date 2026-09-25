import { describe, expect, it } from 'vitest'

import { INPUTS, adEconomics, digitalEconomics, printEconomics } from '../economics'
import { offerByKey } from '@/lib/launch/offers'
import { monthlyBookTargetCopies } from '../victory-paths'
import { WORKSTREAMS } from '../workstreams'
import {
  WARM_CASE_UNITS,
  WARM_CHANNELS,
  WARM_EDITION,
  WARM_LINK_TARGET,
  allyReferralPath,
  copiesPerRun,
  hoursPerCopy,
  warmPlan,
} from '../warm-selling'

describe('WARM_CHANNELS', () => {
  it('every channel sources its conversion rate and defines its evidence', () => {
    for (const c of WARM_CHANNELS) {
      expect(c.source.length).toBeGreaterThan(15)
      // A channel whose result cannot be observed is a hope, not a commitment.
      expect(c.evidence.length).toBeGreaterThan(15)
      expect(c.conversionRate).toBeGreaterThan(0)
      expect(c.typicalReach).toBeGreaterThan(0)
    }
  })

  it('is ordered weakest-first so posting never reads as the high-leverage move', () => {
    const copies = WARM_CHANNELS.map(copiesPerRun)
    expect(copies[0]).toBe(Math.min(...copies))
    expect(WARM_CHANNELS[0].key).toBe('post')
  })

  it('states the weak channel honestly — a post is worth only a couple of copies', () => {
    const post = WARM_CHANNELS.find((c) => c.key === 'post')!
    expect(copiesPerRun(post)).toBeLessThanOrEqual(3)
  })

  it('the direct ask produces exactly a case — the number the brigade commits to', () => {
    const circle = WARM_CHANNELS.find((c) => c.key === 'circle')!
    expect(copiesPerRun(circle)).toBe(WARM_CASE_UNITS)
  })

  it('a warm ask beats the cold-traffic conversion it is meant to replace', () => {
    // Cold direct-sale funnels convert around 0.5–1%; the personal ask must be
    // decisively better or the whole channel argument collapses.
    const circle = WARM_CHANNELS.find((c) => c.key === 'circle')!
    expect(circle.conversionRate).toBeGreaterThan(0.05)
  })

  it('reports effort per copy, and the podcast is the cheapest leverage', () => {
    const perCopy = WARM_CHANNELS.map((c) => ({ key: c.key, h: hoursPerCopy(c) }))
    const cheapest = perCopy.reduce((a, b) => (a.h <= b.h ? a : b))
    expect(cheapest.key).toBe('podcast')
    for (const p of perCopy) expect(Number.isFinite(p.h)).toBe(true)
  })
})

describe('warmPlan', () => {
  const target = monthlyBookTargetCopies()

  it('scales copies with allies and never exceeds full coverage', () => {
    const small = warmPlan(5, target)
    const big = warmPlan(500, target)
    expect(big.copiesPerMonth).toBeGreaterThan(small.copiesPerMonth)
    expect(big.shareOfTarget).toBeLessThanOrEqual(1)
    expect(small.shareOfTarget).toBeLessThan(1)
  })

  it('warm volume only ever reduces exposure to paid acquisition', () => {
    for (const n of [0, 10, 50, 500]) {
      const p = warmPlan(n, target)
      expect(p.impliedPaidShare).toBeLessThanOrEqual(INPUTS.paidAcquisitionShare)
      expect(p.impliedPaidShare).toBeGreaterThanOrEqual(0)
    }
  })

  it('full coverage needs a brigade small enough to actually recruit', () => {
    const p = warmPlan(0, target)
    expect(p.alliesForFullCoverage).toBe(Math.ceil(target / WARM_CASE_UNITS))
    // A tripwire, not a law: if this stops being a plausible number of people,
    // the brigade's pitch needs rewriting rather than the assertion relaxing.
    expect(p.alliesForFullCoverage).toBeLessThan(120)
  })

  it('closes the gap exactly — covered plus gap is the whole target', () => {
    const p = warmPlan(7, target)
    expect(Math.min(p.copiesPerMonth, target) + p.gapCopies).toBe(target)
  })

  it('names how many allies the paper run can supply before a reprint', () => {
    const p = warmPlan(20, target)
    expect(p.physicalCapacityAllies).toBe(
      Math.floor(printEconomics().sellableUnits / WARM_CASE_UNITS),
    )
  })

  it('a zero-ally brigade is honest about covering nothing', () => {
    const p = warmPlan(0, target)
    expect(p.copiesPerMonth).toBe(0)
    expect(p.shareOfTarget).toBe(0)
    expect(p.gapCopies).toBe(target)
  })
})

describe('the warm channel vs the ad channel', () => {
  it('a warm copy is worth more than a paid one, because it costs nothing to win', () => {
    const ads = adEconomics()
    expect(ads.grossMarginCents).toBeGreaterThan(ads.contributionPerPaidSaleCents)
  })

  it('exists precisely because the cold median exceeds the book margin', () => {
    // The brigade's reason for being. If ads ever became comfortably profitable
    // this assertion should fail and the narrative should be revisited.
    const ads = adEconomics({ ...INPUTS, adCostPerSaleCents: 30_69 })
    expect(ads.viable).toBe(false)
  })
})

describe('allyReferralPath', () => {
  it('uses the lead id, so tracking needs no new identity', () => {
    expect(allyReferralPath('abc123')).toBe(`/launch?ally=abc123#${WARM_EDITION}`)
  })

  it('encodes ids so a stray character cannot break the link', () => {
    expect(allyReferralPath('a b&c')).toContain('ally=a%20b%26c')
  })

  it('puts the query before the fragment — a hash first would eat the parameter', () => {
    const path = allyReferralPath('abc')
    expect(path.indexOf('?')).toBeLessThan(path.indexOf('#'))
  })

  it('can point at any storefront target', () => {
    expect(allyReferralPath('x', '/deck/sales')).toBe('/deck/sales?ally=x')
  })

  it('lands on the digital edition, not a menu', () => {
    expect(WARM_LINK_TARGET).toContain(WARM_EDITION)
    expect(allyReferralPath('x')).toContain(WARM_EDITION)
  })
})

describe('the brigade sells digital, on purpose', () => {
  const target = monthlyBookTargetCopies()

  it('names an edition that exists in the storefront catalogue', () => {
    expect(offerByKey(WARM_EDITION)).toBeDefined()
  })

  it('is unbounded — the paper ceiling is a counterfactual, not a constraint', () => {
    const huge = warmPlan(10_000, target)
    expect(huge.supplyUnlimited).toBe(true)
    // A paper brigade this size would be out of stock many times over; the
    // digital one is capped only by the target itself.
    expect(huge.allyCount).toBeGreaterThan(huge.physicalCapacityAllies)
    expect(huge.shareOfTarget).toBe(1)
  })

  it('states what the choice costs per copy rather than implying it is free', () => {
    const p = warmPlan(20, target)
    const paperMargin = INPUTS.bookRetailPriceCents - printEconomics().landedUnitCostCents
    expect(p.marginTradedPerCopyCents).toBe(paperMargin - digitalEconomics().marginCents)
    expect(p.marginTradedPerCopyCents).toBeGreaterThan(0)
  })

  it('trades only a small slice of margin for unlimited supply', () => {
    const p = warmPlan(20, target)
    expect(p.marginTradedPerCopyCents).toBeLessThan(digitalEconomics().marginCents * 0.2)
  })
})

describe('The Book Brigade workstream', () => {
  const brigade = WORKSTREAMS.find((w) => w.key === 'book-brigade')!

  it('exists, in the awareness domain', () => {
    expect(brigade).toBeDefined()
    expect(brigade.domain).toBe('RAISE_AWARENESS')
  })

  it('is divisible, so no one ally carries the channel', () => {
    const cases = brigade.needs.filter((n) => n.share?.groupId === 'aq-brigade-case')
    expect(cases.length).toBeGreaterThanOrEqual(10)
    expect(cases.every((n) => n.value === WARM_CASE_UNITS)).toBe(true)
  })

  it('offers the podcast route and an inner-work counterpart', () => {
    expect(brigade.needs.some((n) => n.id === 'aq-brigade-podcast')).toBe(true)
    expect(brigade.needs.some((n) => n.orientation === 'internal')).toBe(true)
  })

  it('asks for reported numbers — the channel is only real if it is checkable', () => {
    expect(brigade.needs.some((n) => n.id === 'aq-brigade-report')).toBe(true)
  })
})
