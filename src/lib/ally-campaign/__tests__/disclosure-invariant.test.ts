/**
 * The disclosure invariant.
 *
 * Sage ruling 3 of the Six Faces integration consult:
 *
 *   > An obligation never renders without its recovery on the same screen.
 *
 * The 250 pre-sold, undelivered copies ship to every reader unsoftened — that was
 * ruled a credibility question, not a kindness one. But Shaman's condition came
 * with it: charge with no discharge is anxiety transferred. Naming a debt and
 * stopping there hands the reader the weight and no way to set it down.
 *
 * Two halves, because the content arrives from two places:
 *   - authored narratives interpolate their figures directly → checked as prose
 *   - admin overrides carry tokens → checked structurally, and refused on save
 */
import { describe, it, expect } from 'vitest'
import { WORKSTREAMS } from '../workstreams'
import { printEconomics } from '../economics'
import { statesObligationWithoutRecovery } from '../content-tokens'
import { checkOverrides } from '../content-overrides'

const print = printEconomics()

describe('authored content', () => {
  const obligation = String(print.obligationUnits)
  const recoveries = [String(print.sellableUnits), String(print.breakEvenUnits)]

  it('there is an obligation to disclose in the first place', () => {
    // If this fails the campaign changed shape and the rest of this file is moot.
    expect(print.obligationUnits).toBeGreaterThan(0)
    expect(print.sellableUnits).toBeGreaterThan(0)
  })

  it.each(WORKSTREAMS.map((w) => [w.key, w] as const))(
    '%s — any narrative naming the obligation also names its discharge',
    (_key, w) => {
      const text = `${w.narrative}\n${w.theAsk}`
      if (!text.includes(obligation)) return // nothing to discharge
      expect(recoveries.some((r) => text.includes(r))).toBe(true)
    },
  )

  it('the print run in particular states both, since it is where the debt lives', () => {
    const w = WORKSTREAMS.find((x) => x.key === 'print-run')!
    const text = `${w.narrative}\n${w.theAsk}`
    expect(text).toContain(obligation)
    expect(recoveries.some((r) => text.includes(r))).toBe(true)
  })
})

describe('overrides — structural, so rephrasing cannot dodge it', () => {
  it('flags text naming the obligation alone', () => {
    expect(statesObligationWithoutRecovery('{{obligation}} copies are already owed.')).toBe(true)
  })

  it('accepts it once a discharge is named', () => {
    expect(
      statesObligationWithoutRecovery('{{obligation}} owed, leaving {{sellable}} that can earn.'),
    ).toBe(false)
    expect(
      statesObligationWithoutRecovery('{{obligation}} owed; whole at {{breakEven}} copies.'),
    ).toBe(false)
  })

  it('ignores text that never raises the obligation', () => {
    expect(statesObligationWithoutRecovery('A run of {{printRun}} copies.')).toBe(false)
    expect(statesObligationWithoutRecovery('No tokens at all here.')).toBe(false)
  })

  it('is not fooled by prose that merely sounds bleak', () => {
    // Structural, not linguistic — it reads tokens, not mood.
    expect(statesObligationWithoutRecovery('This is a debt I owe in cardboard.')).toBe(false)
  })

  it('refuses a workstream override that drops the discharge', () => {
    const found = checkOverrides({
      workstreams: { 'print-run': { narrative: '{{obligation}} copies are already owed.' } },
    })
    expect(found).toHaveLength(1)
    expect(found[0].message).toMatch(/discharges them/i)
  })

  it('refuses a LETTER that drops it — the case that matters most', () => {
    const found = checkOverrides({
      invites: { mom: { opening: 'I owe {{obligation}} copies to people who already paid.' } },
    })
    expect(found).toHaveLength(1)
    expect(found[0].bucket).toBe('invites')
  })

  it('accepts the same letter once the recovery is there', () => {
    expect(
      checkOverrides({
        invites: {
          mom: {
            opening: 'I owe {{obligation}} copies, which leaves {{sellable}} that can actually earn.',
          },
        },
      }),
    ).toHaveLength(0)
  })

  it('catches it inside a per-invite content layer too', () => {
    const found = checkOverrides({
      invites: {
        jim: { content: { workstreams: { 'print-run': { theAsk: 'Cover the {{obligation}}.' } } } },
      },
    })
    expect(found).toHaveLength(1)
    expect(found[0].key).toBe('jim/print-run')
  })
})
