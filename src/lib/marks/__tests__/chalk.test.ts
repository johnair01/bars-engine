import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { CHALK_TAG, CHALK_TAG_IMAGES, withChalk } from '../chalk'

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

describe('the Council Board scope', () => {
  it('loads the ring with images scope, and the script honours it', () => {
    expect(CHALK_TAG_IMAGES).toContain('data-scope="images"')
    const js = readFileSync('public/marks/chalk.js', 'utf8')
    expect(js).toContain("getAttribute('data-scope') === 'images'")
    expect(js).toContain("t.closest('img,picture,canvas,video') && t.closest('[data-look-id],[data-look]')")
  })
})
