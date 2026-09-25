import { describe, expect, it } from 'vitest'

import {
  ACQUISITION_BENCHMARKS,
  INPUTS,
  adEconomics,
  attachRateToBreakEven,
  cacScenarios,
  digitalEconomics,
  netPerWorkshopSeatCents,
  printEconomics,
  workshopEconomics,
} from '../economics'
import {
  MONTHLY_TARGET_CENTS,
  NINETY_DAY,
  blendedMarginCents,
  copyLadder,
  salesMarginCents,
  victoryPaths,
} from '../victory-paths'

describe('victoryPaths', () => {
  const paths = victoryPaths()

  it('offers at least two distinct paths — one win condition is not a plan', () => {
    expect(paths.length).toBeGreaterThanOrEqual(2)
    expect(new Set(paths.map((p) => p.key)).size).toBe(paths.length)
  })

  it('every path lands at or above the monthly target', () => {
    for (const p of paths) {
      expect(p.monthlyCents).toBeGreaterThanOrEqual(MONTHLY_TARGET_CENTS)
    }
  })

  it('monthlyCents is exactly the sum of its three engines', () => {
    const margin = salesMarginCents()
    const perRun = workshopEconomics().netPerRunCents
    for (const p of paths) {
      expect(p.monthlyCents).toBe(
        p.bridgeIncomeCents + p.workshopsPerMonth * perRun + p.booksPerMonth * margin,
      )
    }
  })

  it('never overshoots by more than one book — the target is a target, not a flourish', () => {
    for (const p of paths) {
      expect(p.monthlyCents - MONTHLY_TARGET_CENTS).toBeLessThan(salesMarginCents())
    }
  })

  it('includes a bridge-income path — the "get a job" plan is inside the plan', () => {
    expect(paths.some((p) => p.bridgeIncomeCents > 0)).toBe(true)
  })

  it('includes a full-time employment path that needs no book or workshop sales', () => {
    const pivot = paths.find((p) => p.key === 'career-pivot')
    expect(pivot).toBeDefined()
    expect(pivot!.booksPerMonth).toBe(0)
    expect(pivot!.workshopsPerMonth).toBe(0)
    expect(pivot!.monthlyCents).toBe(MONTHLY_TARGET_CENTS)
  })

  it('any path needing runway states a bounded, self-consistent total', () => {
    const withRunway = paths.filter((p) => p.runway)
    expect(withRunway.length).toBeGreaterThan(0)
    for (const p of withRunway) {
      const r = p.runway!
      expect(r.months).toBeGreaterThan(0)
      expect(r.months).toBeLessThanOrEqual(12)
      expect(r.totalCents).toBe(r.monthlyCents * r.months)
      // A runway that costs more than it delivers in its own window is not a plan.
      expect(r.totalCents).toBeLessThan(MONTHLY_TARGET_CENTS * r.months)
      expect(r.endsWhen.length).toBeGreaterThan(10)
    }
  })

  it('a runway ask never quietly outgrows the loan it sits beside', () => {
    // Not a correctness law — a tripwire. If this fires, the ask has changed
    // shape and the letters that describe it need rewriting, not the assertion.
    for (const p of paths) {
      if (!p.runway) continue
      expect(p.runway.totalCents).toBeLessThanOrEqual(3 * INPUTS.carLoanCents)
    }
  })

  it('no path needs a reprint — book counts are digital, and digital has no ceiling', () => {
    // The reprint warning was the loudest thing on this page when paper was the
    // only engine. It is gone because the constraint is gone, not because it was
    // silenced: `needsReprint` still fires for any path costed in print.
    for (const p of paths) {
      expect(p.needsReprint).toBe(false)
    }
  })

  it('counts copies net of acquisition — a reader is not free', () => {
    const ads = adEconomics()
    expect(salesMarginCents()).toBe(ads.blendedContributionPerSaleCents)
    // Strictly below gross margin whenever any share of readers is bought.
    expect(salesMarginCents()).toBeLessThan(digitalEconomics().marginCents)
  })

  it('a higher cost per sale means MORE copies needed, never fewer', () => {
    const cheap = victoryPaths({ ...INPUTS, adCostPerSaleCents: 3_00 })
    const dear = victoryPaths({ ...INPUTS, adCostPerSaleCents: 20_00 })
    for (let idx = 0; idx < cheap.length; idx++) {
      if (cheap[idx].booksPerMonth === 0) continue
      expect(dear[idx].booksPerMonth).toBeGreaterThan(cheap[idx].booksPerMonth)
    }
  })

  it('states a demand risk on every path, since supply no longer constrains anything', () => {
    for (const p of paths) {
      expect(p.demandRisk.length).toBeGreaterThan(20)
    }
  })

  it('every path names its failure condition and concrete support', () => {
    for (const p of paths) {
      expect(p.failureReads.length).toBeGreaterThan(20)
      expect(p.needsUpFront.length).toBeGreaterThan(0)
      expect(p.supportLooksLike.length).toBeGreaterThan(0)
    }
  })
})

describe('copyLadder', () => {
  const ladder = copyLadder()

  it('answers the question at every altitude', () => {
    expect(new Set(ladder.map((r) => r.key))).toEqual(
      new Set(['loan', 'print-run', 'target', 'break-even']),
    )
  })

  it('starts with the smallest ask — the loan is the nearest rung', () => {
    expect(ladder[0].key).toBe('loan')
  })

  it('agrees with printEconomics on break-even', () => {
    expect(ladder.find((r) => r.key === 'break-even')!.copies).toBe(printEconomics().breakEvenUnits)
  })

  it('rungs ascend — the ladder reads as a ladder', () => {
    for (let i = 1; i < ladder.length; i++) {
      expect(ladder[i].copies).toBeGreaterThan(ladder[i - 1].copies)
    }
  })

  it('the loan rung covers the books half of the loan at the sales margin', () => {
    const rung = ladder.find((r) => r.key === 'loan')!
    const share = Math.round(INPUTS.carLoanCents * INPUTS.repaymentMix.books)
    expect(rung.copies * salesMarginCents()).toBeGreaterThanOrEqual(share)
    expect((rung.copies - 1) * salesMarginCents()).toBeLessThan(share)
  })

  it('the paper rung tells the truth about whether it fits', () => {
    const paper = ladder.find((r) => r.key === 'break-even')!
    const print = printEconomics()
    expect(paper.copies).toBe(print.breakEvenUnits)
    // The note must agree with the arithmetic, in both directions.
    expect(paper.note.includes('does not fit')).toBe(!print.coversRunFromSellable)
  })
})

describe('adEconomics — what a reader costs to find', () => {
  it('the viability ceiling is the per-copy margin, exactly', () => {
    expect(adEconomics().maxViableCostPerSaleCents).toBe(digitalEconomics().marginCents)
  })

  it('calls paid acquisition non-viable at or above the margin', () => {
    const margin = digitalEconomics().marginCents
    expect(adEconomics({ ...INPUTS, adCostPerSaleCents: margin }).viable).toBe(false)
    expect(adEconomics({ ...INPUTS, adCostPerSaleCents: margin + 1 }).viable).toBe(false)
    expect(adEconomics({ ...INPUTS, adCostPerSaleCents: margin - 1 }).viable).toBe(true)
  })

  it('above the ceiling, more budget loses more money — scaling makes it worse', () => {
    const bad = { ...INPUTS, adCostPerSaleCents: digitalEconomics().marginCents + 5_00 }
    const small = adEconomics({ ...bad, adMonthlyBudgetCents: 500_00 })
    const large = adEconomics({ ...bad, adMonthlyBudgetCents: 5_000_00 })
    expect(small.netPerMonthAtBudget).toBeLessThan(0)
    expect(large.netPerMonthAtBudget).toBeLessThan(small.netPerMonthAtBudget)
  })

  it('blended contribution sits between the paid-only and gross figures', () => {
    const a = adEconomics()
    expect(a.blendedContributionPerSaleCents).toBeLessThanOrEqual(a.grossMarginCents)
    expect(a.blendedContributionPerSaleCents).toBeGreaterThanOrEqual(
      a.contributionPerPaidSaleCents,
    )
  })

  it('an all-organic plan carries no acquisition drag', () => {
    const organic = adEconomics({ ...INPUTS, paidAcquisitionShare: 0 })
    expect(organic.blendedContributionPerSaleCents).toBe(organic.grossMarginCents)
  })

  it('survives a zero cost-per-sale without dividing by it', () => {
    const zero = adEconomics({ ...INPUTS, adCostPerSaleCents: 0 })
    expect(Number.isFinite(zero.salesPerMonthAtBudget)).toBe(true)
    expect(zero.viable).toBe(false)
  })
})

describe('reader lifetime value — the answer to a CAC above book margin', () => {
  it('LTV exceeds the book-only ceiling whenever any reader takes a seat', () => {
    const a = adEconomics()
    expect(a.ltvCeilingCents).toBeGreaterThan(a.maxViableCostPerSaleCents)
  })

  it('collapses to the book margin when nobody attaches', () => {
    const none = adEconomics({ ...INPUTS, workshopAttachRate: 0 })
    expect(none.ltvCeilingCents).toBe(none.grossMarginCents)
  })

  it('needs no attach rate while the book covers its own acquisition', () => {
    expect(attachRateToBreakEven(1_00)).toBe(0)
    expect(attachRateToBreakEven(digitalEconomics().marginCents)).toBe(0)
  })

  it('turns a CAC above the book margin into a checkable fraction of readers', () => {
    const margin = digitalEconomics().marginCents
    const seat = netPerWorkshopSeatCents()
    const cac = margin + seat / 10 // exactly one reader in ten
    expect(attachRateToBreakEven(cac)).toBeCloseTo(0.1, 4)
  })

  it('a dearer sale demands a higher attach rate, monotonically', () => {
    const margin = digitalEconomics().marginCents
    let prev = -1
    for (const extra of [0, 1_00, 5_00, 20_00]) {
      const rate = attachRateToBreakEven(margin + extra)
      expect(rate).toBeGreaterThanOrEqual(prev)
      prev = rate
    }
  })

  it('the published Meta median needs an attach rate small enough to be plausible', () => {
    const meta = ACQUISITION_BENCHMARKS.find((b) => b.key === 'meta-cold')!.lowCents!
    const rate = attachRateToBreakEven(meta)
    // Not a law of nature — a tripwire. If this stops holding, the paid-ads
    // argument on the page needs rewriting, not the assertion relaxing.
    expect(rate).toBeGreaterThan(0)
    expect(rate).toBeLessThan(0.1)
  })
})

describe('ACQUISITION_BENCHMARKS', () => {
  it('every figure carries a source — an unsourced number does not belong here', () => {
    for (const b of ACQUISITION_BENCHMARKS) {
      expect(b.source.length).toBeGreaterThan(10)
      expect(b.what.length).toBeGreaterThan(20)
    }
  })

  it('priced ranges are ordered, and unpriced channels say so with both bounds null', () => {
    for (const b of ACQUISITION_BENCHMARKS) {
      if (b.lowCents === null || b.highCents === null) {
        expect(b.lowCents).toBeNull()
        expect(b.highCents).toBeNull()
        continue
      }
      expect(b.highCents).toBeGreaterThanOrEqual(b.lowCents)
    }
  })

  it('includes a channel that costs more than the book earns — the range is not cherry-picked', () => {
    const margin = digitalEconomics().marginCents
    expect(
      ACQUISITION_BENCHMARKS.some((b) => b.lowCents !== null && b.lowCents > margin),
    ).toBe(true)
  })
})

describe('cacScenarios', () => {
  const rows = cacScenarios(MONTHLY_TARGET_CENTS)

  it('spans viable and non-viable answers — it does not only show the good ones', () => {
    expect(rows.some((r) => r.viable)).toBe(true)
    expect(rows.some((r) => !r.viable)).toBe(true)
  })

  it('costs ascend and required copies never fall as acquisition gets dearer', () => {
    for (let idx = 1; idx < rows.length; idx++) {
      expect(rows[idx].costPerSaleCents).toBeGreaterThan(rows[idx - 1].costPerSaleCents)
      expect(rows[idx].contributionPerSaleCents).toBeLessThanOrEqual(
        rows[idx - 1].contributionPerSaleCents,
      )
    }
  })

  it('every row states a verdict in plain words', () => {
    for (const r of rows) expect(r.verdict.length).toBeGreaterThan(15)
  })
})

describe('NINETY_DAY', () => {
  it('has three gates at days 30, 60, 90', () => {
    expect(NINETY_DAY.map((g) => g.day)).toEqual([30, 60, 90])
  })

  it('every gate writes down what a miss means — before day one, not after day 29', () => {
    for (const g of NINETY_DAY) {
      expect(g.proves.length).toBeGreaterThan(0)
      expect(g.ifMissed.length).toBeGreaterThan(20)
    }
  })
})
