import { describe, expect, it } from 'vitest'

import { openUpBookHref, openUpChapterOneHref, openUpSalesHref, withOpenUpAttribution } from '../outbound'

describe('withOpenUpAttribution', () => {
  it('preserves only standard campaign attribution', () => {
    const href = withOpenUpAttribution(
      'https://example.com/buy',
      new URLSearchParams({
        utm_source: 'instagram',
        utm_campaign: 'mtgoa-day-2',
        privateStory: 'never forward this',
      }),
    )
    const url = new URL(href)
    expect(url.searchParams.get('utm_source')).toBe('instagram')
    expect(url.searchParams.get('utm_campaign')).toBe('mtgoa-day-2')
    expect(url.searchParams.get('privateStory')).toBeNull()
  })

  it('leaves an empty checkout URL empty', () => {
    expect(withOpenUpAttribution('', new URLSearchParams('utm_source=instagram'))).toBe('')
  })

  it('exposes a book and Chapter 1 handoff without private query fields', () => {
    const search = new URLSearchParams({ utm_medium: 'social', story: 'private' })
    expect(openUpBookHref(search)).toContain('utm_medium=social')
    expect(openUpChapterOneHref(search)).toContain('utm_medium=social')
    expect(openUpChapterOneHref(search)).not.toContain('story=private')
    expect(openUpSalesHref(search)).toBe('/mastering-allyship?utm_medium=social')
  })
})
