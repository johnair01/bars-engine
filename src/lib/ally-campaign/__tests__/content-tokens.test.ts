/**
 * The token layer — "different allies get different messaging, relying on the
 * same data."
 *
 * The load-bearing test in this file is the last one: a per-invite override,
 * rendered under a changed `INPUTS`, must produce the changed figure. That is
 * the falsifiable form of the whole design. Everything above it protects the
 * invariant that makes it possible.
 */
import { describe, it, expect } from 'vitest'
import {
  CONTENT_TOKENS,
  findLiteralFigure,
  findToken,
  literalFigureMessage,
  renderTokens,
  tokensByGroup,
  tokensUsed,
  unknownTokens,
} from '../content-tokens'
import {
  checkOverrides,
  normalizeOverrides,
  resolveAllyContent,
  resolveWorkstreams,
} from '../content-overrides'
import { INPUTS, usd, type CampaignInputs } from '../economics'
import { ALLIES } from '../allies'
import { WORKSTREAMS } from '../workstreams'

describe('the registry', () => {
  it('has no duplicate keys', () => {
    const keys = CONTENT_TOKENS.map((t) => t.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('every token resolves to a non-empty string', () => {
    for (const t of CONTENT_TOKENS) {
      expect(t.resolve(INPUTS), t.key).toBeTruthy()
    }
  })

  it('currency tokens render with a symbol; counts do not', () => {
    for (const t of CONTENT_TOKENS) {
      const v = t.resolve(INPUTS)
      if (t.kind === 'currency') expect(v, t.key).toMatch(/^\$/)
      else expect(v, t.key).not.toMatch(/\$/)
    }
  })

  it('exposes the same tokens to the palette as to the renderer', () => {
    // The single-registry promise: a token cannot exist for one consumer only.
    const palette = tokensByGroup().flatMap((g) => g.tokens.map((t) => t.key))
    expect(palette.sort()).toEqual(CONTENT_TOKENS.map((t) => t.key).sort())
  })

  it('the palette previews the value an author would actually get', () => {
    for (const group of tokensByGroup()) {
      for (const t of group.tokens) {
        expect(t.preview).toBe(findToken(t.key)!.resolve(INPUTS))
      }
    }
  })
})

describe('renderTokens', () => {
  it('substitutes a known token', () => {
    expect(renderTokens('Lend {{carLoan}} for the car.')).toBe(
      `Lend ${usd(INPUTS.carLoanCents)} for the car.`,
    )
  })

  it('substitutes several, and tolerates inner whitespace', () => {
    const out = renderTokens('{{printRun}} copies, {{ breakEven }} to break even')
    expect(out).toContain(String(INPUTS.printRunUnits))
    expect(out).not.toContain('{{')
  })

  it('leaves an UNKNOWN token visible rather than swallowing it', () => {
    // Loud beats tidy: `{{carLon}}` on the page gets fixed within the hour, a
    // silently-dropped token reads as a finished sentence with a hole in it.
    expect(renderTokens('Lend {{carLon}} today')).toBe('Lend {{carLon}} today')
  })

  it('leaves text with no tokens untouched', () => {
    expect(renderTokens('No figures here at all.')).toBe('No figures here at all.')
  })

  it('reports which tokens a string uses, and which are unknown', () => {
    expect(tokensUsed('{{carLoan}} and {{printRun}}')).toEqual(['carLoan', 'printRun'])
    expect(unknownTokens('{{carLoan}} and {{nope}}')).toEqual(['nope'])
  })
})

describe('the no-literal-numbers invariant', () => {
  it('refuses any currency literal', () => {
    expect(findLiteralFigure('Lend $2,500 for the car')).not.toBeNull()
    expect(findLiteralFigure('It costs $30')).not.toBeNull()
    expect(findLiteralFigure('about $1,234.56 all in')).not.toBeNull()
  })

  it('names the token that should have been used', () => {
    const f = findLiteralFigure(`Lend ${usd(INPUTS.carLoanCents)} for the car`)
    expect(f?.suggestion).toBe('carLoan')
    expect(literalFigureMessage(f!)).toContain('{{carLoan}}')
  })

  it('refuses a bare integer that collides with a derived count', () => {
    const f = findLiteralFigure(`A run of ${INPUTS.printRunUnits}.`)
    expect(f?.reason).toBe('derived-count')
    expect(f?.suggestion).toBe('printRun')
  })

  it('allows ordinary prose numbers', () => {
    // The rule must not make normal writing impossible. "Chapter 1" is the case
    // that caught the first version of this: `workshopsNeeded` resolves to 1, so
    // enforcing every magnitude rejected an ordinary sentence.
    expect(findLiteralFigure('I spent four years on this.')).toBeNull()
    expect(findLiteralFigure('A room, a date, and 8 people who trust you.')).toBeNull()
    expect(findLiteralFigure('Chapter 1 is free.')).toBeNull()
    expect(findLiteralFigure('It takes about 15 minutes.')).toBeNull()
  })

  it('does not enforce small derived counts — a stated gap, not an oversight', () => {
    // Below the threshold, collision with ordinary prose is likelier than a real
    // stale figure. Currency stays enforced at every magnitude, which is where
    // the risk actually is.
    expect(findLiteralFigure(`${INPUTS.repaymentMonths} months`)).toBeNull()
    expect(findLiteralFigure(`${INPUTS.tourEventTarget} events`)).toBeNull()
  })

  it('still enforces currency at small magnitudes', () => {
    expect(findLiteralFigure('just $30')).not.toBeNull()
  })

  it('allows the token form of the very same fact', () => {
    expect(findLiteralFigure('Lend {{carLoan}} for the car')).toBeNull()
    expect(findLiteralFigure('A run of {{printRun}}.')).toBeNull()
  })

  it('drops a refused field rather than storing it', () => {
    const out = normalizeOverrides({
      workstreams: { car: { theAsk: 'Lend $2,500 for the car', title: 'The Car' } },
    })
    expect(out.workstreams?.car?.theAsk).toBeUndefined()
    expect(out.workstreams?.car?.title).toBe('The Car')
  })

  it('reports refusals so the editor can explain itself', () => {
    const found = checkOverrides({
      workstreams: { car: { theAsk: 'Lend $2,500' } },
      invites: { mom: { opening: 'I need $2,500' } },
    })
    expect(found).toHaveLength(2)
    expect(found.map((r) => r.bucket).sort()).toEqual(['invites', 'workstreams'])
  })

  it('reports refusals inside a per-invite content layer too', () => {
    const found = checkOverrides({
      invites: { jim: { content: { workstreams: { car: { narrative: 'costs $2,500' } } } } },
    })
    expect(found).toHaveLength(1)
    expect(found[0].key).toBe('jim/car')
  })
})

describe('the three-layer cascade', () => {
  const overrides = normalizeOverrides({
    // global: applies to everyone
    workstreams: { car: { theAsk: 'Global ask about {{carLoan}}.' } },
    invites: {
      jim: {
        content: {
          workstreams: { car: { narrative: 'Jim-specific narrative. {{carLoan}}, repaid monthly.' } },
        },
      },
    },
  })

  it('falls back to the authored file when no layer overrides', () => {
    const car = resolveWorkstreams(overrides, 'mom').find((w) => w.key === 'car')!
    expect(car.narrative).toBe(WORKSTREAMS.find((w) => w.key === 'car')!.narrative)
  })

  it('applies the global layer to an ally with no per-invite copy', () => {
    const car = resolveWorkstreams(overrides, 'mom').find((w) => w.key === 'car')!
    expect(car.theAsk).toContain('Global ask')
  })

  it('applies the per-invite layer over the global one', () => {
    const car = resolveWorkstreams(overrides, 'jim').find((w) => w.key === 'car')!
    expect(car.narrative).toContain('Jim-specific narrative')
  })

  it('resolves FIELD by field, so a per-ally narrative keeps the global ask', () => {
    // The bug this prevents: editing one ally's narrative silently reverting a
    // globally-corrected ask that nobody re-checked.
    const car = resolveWorkstreams(overrides, 'jim').find((w) => w.key === 'car')!
    expect(car.narrative).toContain('Jim-specific narrative')
    expect(car.theAsk).toContain('Global ask')
  })

  it('gives two allies different messaging from the same layer stack', () => {
    const mom = resolveWorkstreams(overrides, 'mom').find((w) => w.key === 'car')!
    const jim = resolveWorkstreams(overrides, 'jim').find((w) => w.key === 'car')!
    expect(mom.narrative).not.toBe(jim.narrative)
  })

  it('renders tokens in an admin-edited letter, not just in workstream copy', () => {
    const o = normalizeOverrides({ invites: { mom: { opening: 'I need {{carLoan}}, as a loan.' } } })
    expect(resolveAllyContent('mom', o).invite.opening).toBe(
      `I need ${usd(INPUTS.carLoanCents)}, as a loan.`,
    )
  })

  it('leaves an untouched invite entirely on the authored letter', () => {
    expect(resolveAllyContent('mom', overrides).invite.opening).toBe(ALLIES.mom.opening)
  })
})

describe('THE POINT — different messaging, same data', () => {
  it('per-ally copy still moves when the numbers move', () => {
    // Two allies, two registers, one source of truth. Change the loan and BOTH
    // sentences change, because neither of them stored the figure.
    const overrides = normalizeOverrides({
      invites: {
        mom: { content: { workstreams: { car: { theAsk: 'I need {{carLoan}}, Mom.' } } } },
        jim: { content: { workstreams: { car: { theAsk: 'Capital required: {{carLoan}}.' } } } },
      },
    })

    const at = (i: CampaignInputs, slug: string) =>
      resolveWorkstreams(overrides, slug).find((w) => w.key === 'car')!.theAsk

    const raised: CampaignInputs = { ...INPUTS, carBudgetCents: 9_000_00, carLoanCents: 9_000_00 }

    // Different words for each reader…
    expect(at(INPUTS, 'mom')).toContain('Mom')
    expect(at(INPUTS, 'jim')).toContain('Capital required')

    // …and the same figure in both, which is the current one.
    expect(at(INPUTS, 'mom')).toContain(usd(INPUTS.carLoanCents))
    expect(at(INPUTS, 'jim')).toContain(usd(INPUTS.carLoanCents))

    // The stored text contains no figure at all, so it cannot go stale.
    const stored = overrides.invites!.mom!.content!.workstreams!.car!.theAsk!
    expect(stored).toContain('{{carLoan}}')
    expect(findLiteralFigure(stored)).toBeNull()

    // And the token proves it renders against whatever INPUTS says.
    expect(renderTokens(stored, raised)).toContain(usd(raised.carLoanCents))
    expect(renderTokens(stored, raised)).not.toContain(usd(INPUTS.carLoanCents))
  })
})
