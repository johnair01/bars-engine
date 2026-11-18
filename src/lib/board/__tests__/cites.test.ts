import { describe, expect, it } from 'vitest'
import { citeErrors, isReviewLook, showingCites } from '../cites'
import { rowErrors } from '../rows'

const base = { kind: 'questions', pass: 'waker-briefs_2026-11-18', faces: ['architect', 'sage'], q: 'Do you take it?',
  options: [{ v: 'A', label: 'A. Run it', c: 'Pushes a ticket.' }, { v: 'B', label: 'B. Leave it', c: 'Waits.' }] }
const paragraph = 'The callsheet says the asset forge host loads the court scene and plays the film from four metres to the side.'

describe('a card that cites work must show it', () => {
  it('refuses the fourth waker brief: three repo files and a draft below, none shown', () => {
    const row = { ...base, why_you: 'Files that bear on it are `six-faces-council/council/callsheets/asset-forge-host.md` and `bars-garden.md`. The draft below is waker\'s, not yours.' }
    const e = citeErrors(row)
    expect(e.some(x => x.includes('asset-forge-host.md'))).toBe(true)
    expect(e.some(x => x.includes('draft is below'))).toBe(true)
    expect(rowErrors(row).length).toBeGreaterThan(0)
  })
  it('passes when each file is a cite with its text and the draft is an option\'s then', () => {
    const row = { ...base, why_you: 'It bears on `council/callsheets/asset-forge-host.md`. The draft below is waker\'s.',
      cites: [{ title: 'Asset forge host', path: 'council/callsheets/asset-forge-host.md', text: paragraph }],
      options: [{ ...base.options[0], then: '# Brief\n\nChange only the file listed. Return a draft PR link and what was not checked.' }, base.options[1]] }
    expect(citeErrors(row)).toEqual([])
    expect(rowErrors(row)).toEqual([])
  })
  it('a cite with a path and no text does not count', () => {
    const row = { ...base, why_you: 'See `council/x.md`.', cites: [{ title: 'x', path: 'council/x.md' }] }
    expect(showingCites(row)).toEqual([])
    expect(citeErrors(row)).not.toEqual([])
  })
  it('refuses a GitHub link', () => {
    expect(citeErrors({ ...base, why_you: 'Open https://github.com/johnair01/bars-engine/pull/9 to see it.' })).not.toEqual([])
  })
  it('lets a plain question with no citation through, and a backfill', () => {
    expect(citeErrors({ ...base, why_you: 'Which one fits the player?' })).toEqual([])
    expect(citeErrors({ ...base, backfill: true, why_you: 'See board/x.py.' })).toEqual([])
  })
  it('a review look carries review and showing cites', () => {
    expect(isReviewLook({ look: true, review: true, cites: [{ title: 'Doc', text: paragraph }] })).toBe(true)
    expect(isReviewLook({ look: true, review: true })).toBe(false)
    expect(isReviewLook({ look: true, cites: [{ title: 'Doc', text: paragraph }] })).toBe(false)
  })
})
