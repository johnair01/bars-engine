import { describe, expect, it } from 'vitest'
import { tocMetadataToSectionScaffolds } from '../book-toc-to-sections'

describe('tocMetadataToSectionScaffolds', () => {
  it('returns error when metadata missing', () => {
    expect(tocMetadataToSectionScaffolds(null)).toEqual({
      error: 'Book has no metadata. Run Extract TOC after text extraction.',
    })
  })

  it('maps toc entries to scaffolds', () => {
    const meta = JSON.stringify({
      toc: {
        entries: [
          { title: 'Chapter 1: Alpha', level: 'chapter', charStart: 0, charEnd: 10 },
          { title: 'Chapter 2', level: 'chapter', charStart: 11, charEnd: 20 },
        ],
      },
    })
    const r = tocMetadataToSectionScaffolds(meta)
    expect(Array.isArray(r)).toBe(true)
    if (Array.isArray(r)) {
      expect(r).toEqual([
        { title: 'Chapter 1: Alpha', orderIndex: 0 },
        { title: 'Chapter 2', orderIndex: 1 },
      ])
    }
  })
})
