import { describe, expect, it } from 'vitest'
import { CHALK_TAG, withChalk } from '../chalk'

describe('withChalk', () => {
  it('adds the chalk tag before </head> on a preview, once, and leaves other builds alone', () => {
    const page = '<!doctype html><html><head><title>t</title></head><body></body></html>'
    const on = withChalk(page, true)
    expect(on.indexOf(CHALK_TAG)).toBeLessThan(on.indexOf('</head>'))
    expect(withChalk(on, true)).toBe(on)
    expect(withChalk(page, false)).toBe(page)
    expect(withChalk('<p>x</p>', true)).toBe('<p>x</p>\n' + CHALK_TAG)
  })
})
