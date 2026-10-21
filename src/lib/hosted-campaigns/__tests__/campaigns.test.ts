import { describe, it, expect } from 'vitest'
import {
  HOSTED_CAMPAIGNS_KEY,
  cleanFields,
  parseHostedStore,
  progressPercent,
  resolveHosted,
  tokenMatches,
} from '../campaigns'

describe('hosted campaigns', () => {
  it('renders authored defaults when the theme is missing or malformed', () => {
    expect(parseHostedStore(null)).toEqual({})
    expect(parseHostedStore('not json')).toEqual({})
    const c = resolveHosted('Annastasia', {})
    expect(c?.fields.name).toBe('Annastasia')
    expect(c?.fields.practice).toBe('Balancing Act Coaching')
    expect(c?.services.map((s) => s.key)).toEqual(['consult', 'coaching', 'doubling'])
  })

  it('layers stored edits over defaults, and a stored blank clears a default', () => {
    const theme = JSON.stringify({
      allyContent: { untouched: true },
      [HOSTED_CAMPAIGNS_KEY]: { annastasia: { fields: { story: 'Hello', episode: '' }, editToken: 'abc' } },
    })
    const store = parseHostedStore(theme)
    const c = resolveHosted('annastasia', store)
    expect(c?.fields.story).toBe('Hello')
    expect(c?.fields.episode).toBe('')
    expect(store.annastasia.editToken).toBe('abc')
  })

  it('drops unknown keys, trims, caps length and adds a scheme to links', () => {
    const out = cleanFields({ name: '  Ann  ', evil: '<script>', gofundmeUrl: 'gofund.me/x', tagline: 'x'.repeat(5000), raised: 5 })
    expect(out).toEqual({ name: 'Ann', gofundmeUrl: 'https://gofund.me/x', tagline: 'x'.repeat(600) })
  })

  it('matches tokens exactly and never matches an unset one', () => {
    expect(tokenMatches('abc', 'abc')).toBe(true)
    expect(tokenMatches('abc', 'abd')).toBe(false)
    expect(tokenMatches(undefined, '')).toBe(false)
    expect(tokenMatches('', '')).toBe(false)
  })

  it('computes progress from free-text amounts', () => {
    const f = resolveHosted('annastasia', {})!.fields
    expect(progressPercent(f)).toBeNull()
    expect(progressPercent({ ...f, goal: '$3,000', raised: '$750' })).toBe(25)
    expect(progressPercent({ ...f, goal: '100', raised: '400' })).toBe(100)
  })

  it('returns null for a campaign that does not exist', () => {
    expect(resolveHosted('nobody', {})).toBeNull()
  })
})
