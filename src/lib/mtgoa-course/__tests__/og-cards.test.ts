import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { courseIndexDay, courseIndexWeeks } from '../course-index'
import { COURSE_INDEX_OG_ALT, OG_CONTENT_TYPE, OG_SIZE, courseDayOgAlt } from '../og-card'

const APP = path.join(process.cwd(), 'src', 'app', 'mastering-allyship')

/** The one file that serves every day on the canonical course route. */
const DYNAMIC_IMAGE = path.join(APP, 'course', '[round]', '[move]', 'opengraph-image.tsx')

const shippedDays = () => courseIndexWeeks().flatMap((week) => week.days).filter((day) => day.status === 'shipped')

describe('social preview cards', () => {
  it('is 1200x630 png, the size every network crops from', () => {
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 })
    expect(OG_CONTENT_TYPE).toBe('image/png')
  })

  /**
   * The guard this file exists for. A day that ships without a card previews as
   * bare text, and nobody notices until it is pasted somewhere public.
   */
  it('gives every shipped day a card, through its own route or the dynamic one', () => {
    const missing = shippedDays().filter((day) => {
      // Round 1 answers on its short alias, so its card is colocated there.
      if (day.round === 1) {
        const slug = day.moveLabel.toLowerCase().replace(' ', '-')
        return !fs.existsSync(path.join(APP, slug, 'opengraph-image.tsx'))
      }
      // Every later round is served by the one dynamic image.
      return !fs.existsSync(DYNAMIC_IMAGE)
    })
    expect(missing.map((day) => `Day ${day.number}`)).toEqual([])
  })

  it('gives the board itself a card', () => {
    expect(fs.existsSync(path.join(APP, 'course', 'opengraph-image.tsx'))).toBe(true)
    expect(COURSE_INDEX_OG_ALT).toContain('Mastering the Game of Allyship')
  })

  it("writes alt text out of the day's own words", () => {
    for (const day of shippedDays()) {
      const alt = courseDayOgAlt(day)
      expect(alt).toContain(`Day ${day.number}`)
      expect(alt).toContain(day.headline)
      expect(alt.toLowerCase()).not.toMatch(/social (image|card)|preview image|og image/)
    }
  })

  /**
   * Satori resolves no CSS variables, so a token that slipped into the card
   * would render as a transparent nothing rather than fail loudly.
   */
  it('resolves every colour to hex, since Satori reads no CSS variables', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'mtgoa-course', 'og-card.tsx'), 'utf8')
    expect(source).not.toMatch(/var\(--/)
    expect(source).not.toMatch(/color-mix\(|oklch\(/)
  })

  /** Satori throws on any element without an explicit display. */
  it('gives every div in the card an explicit display', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'mtgoa-course', 'og-card.tsx'), 'utf8')
    const divs = source.match(/<div\b[\s\S]*?>/g) ?? []
    expect(divs.length).toBeGreaterThan(0)
    for (const div of divs) expect(div).toMatch(/display: '/)
  })

  /**
   * Satori ships one fallback font and silently draws a tofu box for anything it
   * lacks. `◇` is exactly that case, and it sat second in the row of five on the
   * index card looking like a broken image. Nothing in the type system catches
   * this, and the image still returns 200, so the guard is here.
   */
  it('draws Open Up\'s diamond instead of typing a glyph the font lacks', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'mtgoa-course', 'og-card.tsx'), 'utf8')
    expect(source).toContain("move === 'open_up'")
    expect(source).toMatch(/rotate\(45deg\)/)
    // The four Wu Xing characters are covered by that font and stay as glyphs.
    expect(source).toContain('MOVE_SIGIL')
  })

  it('draws each day from its own copy, so no card carries a hardcoded headline', () => {
    const dayOne = courseIndexDay(1)
    const daySix = courseIndexDay(6)
    expect(dayOne?.headline).toBe('Before you decide whether to act, notice what comes alive.')
    expect(daySix?.headline).toBe('See the campaign that is actually there')
    // Both come from the index rather than from anything written into a route file.
    for (const slug of ['wake-up', 'open-up', 'clean-up', 'grow-up', 'show-up']) {
      const source = fs.readFileSync(path.join(APP, slug, 'opengraph-image.tsx'), 'utf8')
      expect(source).toContain('courseDayOgCard')
      expect(source).not.toMatch(/fontSize|linear-gradient|#[0-9a-f]{6}/i)
    }
  })
})
