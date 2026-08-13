/**
 * Ally Campaign economics + workstream catalogue.
 *
 * These numbers go in front of the founder's mother and get used to decide
 * whether to buy a car. The math being deterministic and internally consistent
 * is the whole product, so it gets tested rather than eyeballed.
 */
import { describe, it, expect } from 'vitest'
import {
  INPUTS,
  UNCONFIRMED,
  campaignTotals,
  isEstimate,
  printEconomics,
  repaymentPlan,
  usd,
  workshopEconomics,
  type CampaignInputs,
} from '../economics'
import {
  ALL_NEEDS,
  TOTAL_BOUNTY_VIBEULONS,
  WORKSTREAMS,
  findNeed,
  needsForSuperpower,
  subcampaignSlug,
  workstreamForNeed,
  workstreamsForDomain,
} from '../workstreams'
import { ALLYSHIP_DOMAINS } from '@/lib/allyship-domains'

describe('economics — print run', () => {
  const p = printEconomics()

  it('splits the run into event copies and mailed copies', () => {
    expect(p.unitsForFulfillment).toBe(INPUTS.printRunUnits - INPUTS.unitsHeldForEvents)
    expect(p.unitsForFulfillment + INPUTS.unitsHeldForEvents).toBe(INPUTS.printRunUnits)
  })

  it('only charges shipping on the copies that actually ship', () => {
    expect(p.shipTotalCents).toBe(INPUTS.shipUnitCostCents * p.unitsForFulfillment)
    expect(p.printTotalCents).toBe(INPUTS.printUnitCostCents * INPUTS.printRunUnits)
    expect(p.landedTotalCents).toBe(p.printTotalCents + p.shipTotalCents)
  })

  it('gives event copies a better margin than mailed copies', () => {
    expect(p.eventUnitMarginCents).toBeGreaterThan(p.mailedUnitMarginCents)
    expect(p.eventUnitMarginCents - p.mailedUnitMarginCents).toBe(INPUTS.shipUnitCostCents)
  })

  it('breaks even inside the run — the claim the page makes out loud', () => {
    expect(p.breakEvenUnits).toBeGreaterThan(0)
    expect(p.breakEvenUnits).toBeLessThan(INPUTS.printRunUnits)
  })

  it('covers the landed cost at the break-even count', () => {
    const blended = INPUTS.bookRetailPriceCents - p.landedUnitCostCents
    expect(p.breakEvenUnits * blended).toBeGreaterThanOrEqual(p.landedTotalCents)
  })

  it('never divides by zero on a degenerate run', () => {
    const zeroed: CampaignInputs = { ...INPUTS, printRunUnits: 0, unitsHeldForEvents: 0 }
    const z = printEconomics(zeroed)
    expect(z.landedUnitCostCents).toBe(0)
    expect(z.breakEvenUnits).toBe(0)
    expect(Number.isFinite(z.landedTotalCents)).toBe(true)
  })

  it('never reports negative fulfillment when held-back exceeds the run', () => {
    const odd: CampaignInputs = { ...INPUTS, printRunUnits: 100, unitsHeldForEvents: 400 }
    expect(printEconomics(odd).unitsForFulfillment).toBe(0)
  })
})

describe('economics — repayment plan', () => {
  const plan = repaymentPlan()

  it('borrows the loan amount, not the car price', () => {
    // Collapsing these is how an ask quietly inflates. The schedule is built on
    // what was actually borrowed.
    expect(plan.principalCents).toBe(INPUTS.carLoanCents)
  })

  it('splits the principal across both engines without losing a cent to rounding', () => {
    expect(plan.fromWorkshopsCents + plan.fromBooksCents).toBe(INPUTS.carLoanCents)
  })

  it('never asks to borrow more than the car costs', () => {
    expect(INPUTS.carLoanCents).toBeLessThanOrEqual(INPUTS.carBudgetCents)
  })

  it('asks for enough workshops and books to actually cover each half', () => {
    const { netPerRunCents } = workshopEconomics()
    const { landedUnitCostCents } = printEconomics()
    const blended = INPUTS.bookRetailPriceCents - landedUnitCostCents
    expect(plan.workshopsNeeded * netPerRunCents).toBeGreaterThanOrEqual(plan.fromWorkshopsCents)
    expect(plan.booksNeeded * blended).toBeGreaterThanOrEqual(plan.fromBooksCents)
  })

  it('pays the principal off within the stated window', () => {
    expect(plan.monthlyCents * INPUTS.repaymentMonths).toBeGreaterThanOrEqual(plan.principalCents)
  })

  it('costs books at the blended margin, never the flattering event margin', () => {
    // Using the event margin would assume every repayment copy sells in person,
    // which the run cannot supply. The honest count is therefore the larger one.
    const { eventUnitMarginCents } = printEconomics()
    const flattering = Math.ceil(plan.fromBooksCents / eventUnitMarginCents)
    expect(plan.booksNeeded).toBeGreaterThan(flattering)
  })

  it('does not promise more books than the run prints', () => {
    // If this fails, the pitch is quietly promising books that will never exist.
    expect(plan.booksNeeded).toBeLessThanOrEqual(plan.booksAvailable)
    expect(plan.withinCapacity).toBe(true)
  })

  it('reports over-capacity honestly instead of hiding it', () => {
    const tiny: CampaignInputs = { ...INPUTS, printRunUnits: 10, unitsHeldForEvents: 5 }
    const p = repaymentPlan(tiny)
    expect(p.booksNeeded).toBeGreaterThan(p.booksAvailable)
    expect(p.withinCapacity).toBe(false)
  })

  it('survives a zero-margin configuration without producing Infinity', () => {
    const broken: CampaignInputs = { ...INPUTS, workshopSeatPriceCents: 0, bookRetailPriceCents: 0 }
    const p = repaymentPlan(broken)
    expect(Number.isFinite(p.workshopsNeeded)).toBe(true)
    expect(Number.isFinite(p.booksNeeded)).toBe(true)
  })
})

describe('economics — totals and formatting', () => {
  it('totals every line it lists', () => {
    const t = campaignTotals()
    expect(t.capitalNeededCents).toBe(t.lines.reduce((s, l) => s + l.cents, 0))
  })

  it('splits the total into repaid / recouped / spent without losing money', () => {
    const t = campaignTotals()
    expect(t.repaidCents + t.recoupedCents + t.spentCents).toBe(t.capitalNeededCents)
  })

  it('counts only the borrowed portion as repaid', () => {
    expect(campaignTotals().repaidCents).toBe(INPUTS.carLoanCents)
  })

  it('reports a real cost well below the headline capital figure', () => {
    // The whole point of the split: "has to exist" is not "disappears."
    const t = campaignTotals()
    expect(t.spentCents).toBeLessThan(t.capitalNeededCents)
  })

  it('books a self-funded car gap as spent, not repaid', () => {
    const gapped: CampaignInputs = { ...INPUTS, carBudgetCents: 4_000_00, carLoanCents: 2_500_00 }
    const t = campaignTotals(gapped)
    expect(t.repaidCents).toBe(2_500_00)
    expect(t.lines.some((l) => l.label.includes('self-funded'))).toBe(true)
    expect(t.repaidCents + t.recoupedCents + t.spentCents).toBe(t.capitalNeededCents)
  })

  it('omits the self-funded line when the loan covers the whole car', () => {
    expect(campaignTotals().lines.some((l) => l.label.includes('self-funded'))).toBe(false)
  })

  it('flags unconfirmed lines as estimates so the UI can say so out loud', () => {
    const t = campaignTotals()
    expect(t.lines.some((l) => l.estimate)).toBe(true)
    for (const line of t.lines) {
      expect(line.estimate).toBe(UNCONFIRMED.has(line.key))
    }
  })

  it('marks the placeholder inputs as estimates', () => {
    expect(isEstimate('carBudgetCents')).toBe(true)
    expect(isEstimate('printRunUnits')).toBe(false)
  })

  it('formats cents as money without floating-point drift', () => {
    expect(usd(12_000_00)).toBe('$12,000')
    expect(usd(1_50)).toBe('$1.50')
    expect(usd(0)).toBe('$0')
  })
})

describe('workstreams — structure', () => {
  it('covers all four allyship domains', () => {
    const covered = new Set(WORKSTREAMS.map((w) => w.domain))
    for (const d of ALLYSHIP_DOMAINS) {
      expect(covered.has(d.key)).toBe(true)
    }
  })

  it('gives every need a unique, stable id', () => {
    const ids = ALL_NEEDS.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('uses only valid deck card ids', () => {
    const MOVES = ['WAKE', 'OPEN', 'CLEAN', 'GROW', 'SHOW']
    const DOMAINS = ['GR', 'RA', 'DA', 'SO']
    const FACES = ['SHAMAN', 'CHALLENGER', 'REGENT', 'ARCHITECT', 'DIPLOMAT', 'SAGE']
    for (const need of ALL_NEEDS) {
      const [move, domain, face] = need.cardId.split('-')
      expect(MOVES, need.cardId).toContain(move)
      expect(DOMAINS, need.cardId).toContain(domain)
      expect(FACES, need.cardId).toContain(face)
    }
  })

  it('keeps inner work worth as much as outer work (Six Faces ruling)', () => {
    const inner = ALL_NEEDS.filter((n) => n.orientation === 'internal')
    const outer = ALL_NEEDS.filter((n) => n.orientation === 'external')
    expect(inner.length).toBeGreaterThan(0)
    const maxInner = Math.max(...inner.map((n) => n.bountyVibeulons))
    const minOuter = Math.min(...outer.map((n) => n.bountyVibeulons))
    // Inner work must not be systematically cheaper than the cheapest outer work.
    expect(maxInner).toBeGreaterThanOrEqual(minOuter)
  })

  it('offers work in both orientations', () => {
    expect(ALL_NEEDS.some((n) => n.orientation === 'internal')).toBe(true)
    expect(ALL_NEEDS.some((n) => n.orientation === 'external')).toBe(true)
  })

  it('uses all three units somewhere on the board', () => {
    const units = new Set(ALL_NEEDS.map((n) => n.unit))
    expect(units).toEqual(new Set(['action', 'currency', 'hours']))
  })

  it('totals the bounty pool', () => {
    expect(TOTAL_BOUNTY_VIBEULONS).toBe(ALL_NEEDS.reduce((s, n) => s + n.bountyVibeulons, 0))
    expect(TOTAL_BOUNTY_VIBEULONS).toBeGreaterThan(0)
  })

  it('derives sub-campaign slugs under the parent ref', () => {
    for (const w of WORKSTREAMS) {
      expect(subcampaignSlug(w.key)).toBe(`mobility-quest-${w.key}`)
    }
  })
})

describe('workstreams — lookups', () => {
  it('resolves a need back to its id and its workstream', () => {
    for (const need of ALL_NEEDS) {
      expect(findNeed(need.id)?.id).toBe(need.id)
      expect(workstreamForNeed(need.id)).toBeDefined()
    }
  })

  it('returns undefined for unknown ids rather than throwing', () => {
    expect(findNeed('nope')).toBeUndefined()
    expect(workstreamForNeed('nope')).toBeUndefined()
  })

  it('filters workstreams by domain', () => {
    for (const d of ALLYSHIP_DOMAINS) {
      for (const w of workstreamsForDomain(d.key)) {
        expect(w.domain).toBe(d.key)
      }
    }
  })
})

describe('needsForSuperpower — never a dead end', () => {
  it('puts an exact superpower match first', () => {
    const ranked = needsForSuperpower('connector', 'external')
    const firstMatch = ranked.findIndex((n) => n.superpower === 'connector')
    expect(firstMatch).toBe(0)
  })

  it('still returns work for a superpower with no authored need', () => {
    // A person who shows up must always be handed something real to do.
    const ranked = needsForSuperpower('escape_artist', 'internal')
    expect(ranked.length).toBeGreaterThan(0)
  })

  it('returns something even with no superpower at all', () => {
    expect(needsForSuperpower(null, null).length).toBe(ALL_NEEDS.length)
  })

  it('scopes to a domain when asked', () => {
    const ranked = needsForSuperpower('connector', 'external', { domain: 'DIRECT_ACTION' })
    expect(ranked.length).toBeGreaterThan(0)
    const daIds = new Set(
      workstreamsForDomain('DIRECT_ACTION').flatMap((w) => w.needs.map((n) => n.id)),
    )
    for (const n of ranked) expect(daIds.has(n.id)).toBe(true)
  })

  it('honours the limit', () => {
    expect(needsForSuperpower('coach', 'external', { limit: 3 })).toHaveLength(3)
  })
})
