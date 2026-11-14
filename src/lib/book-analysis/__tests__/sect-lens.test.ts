import { describe, it, expect, afterEach } from 'vitest'
import { sourceSentenceIsInChunk, keepVerifiedSource, bookAnalysisLens } from '../sect-lens'

const chunk = 'Small is good, small is all.  The large is a reflection of the\nsmall.  Pay attention to the pattern.'

describe('sect lens source check', () => {
  it('accepts a sentence in the chunk despite spacing and case', () => {
    expect(sourceSentenceIsInChunk('the large is a reflection of the small.', chunk)).toBe(true)
  })
  it('rejects an invented or too-short sentence', () => {
    expect(sourceSentenceIsInChunk('Always trust your gut in a crisis.', chunk)).toBe(false)
    expect(sourceSentenceIsInChunk('Small', chunk)).toBe(false)
    expect(sourceSentenceIsInChunk(null, chunk)).toBe(false)
  })
  it('nulls an unverified source and keeps a verified one', () => {
    expect(keepVerifiedSource({ sourceSentence: 'Made up quote that is long.' }, chunk).sourceSentence).toBeNull()
    expect(keepVerifiedSource({ sourceSentence: 'Pay attention to the pattern.' }, chunk).sourceSentence).toBe('Pay attention to the pattern.')
  })
})

describe('bookAnalysisLens', () => {
  const was = process.env.BOOK_ANALYSIS_LENS
  afterEach(() => { if (was === undefined) delete process.env.BOOK_ANALYSIS_LENS; else process.env.BOOK_ANALYSIS_LENS = was })
  it('defaults to sect and can be switched back', () => {
    delete process.env.BOOK_ANALYSIS_LENS
    expect(bookAnalysisLens()).toBe('sect')
    process.env.BOOK_ANALYSIS_LENS = 'generic'
    expect(bookAnalysisLens()).toBe('generic')
  })
})
