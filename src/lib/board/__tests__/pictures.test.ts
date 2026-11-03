import { describe, expect, it } from 'vitest'
import { carriesLink, decodePicture, leanDoc, leanDocs, pictureHash, pictureIn, restorePictures } from '../pictures'

const pic = 'data:image/png;base64,' + Buffer.from('x'.repeat(3000)).toString('base64')
const small = 'data:image/png;base64,iVBORw0KGgo='
const ref = { board: 'council', collection: 'steps', docId: 'look-1' }
const O = 'https://bars-engine.vercel.app'

describe('pictures on demand', () => {
  it('turns each large picture into a link and leaves the rest alone', () => {
    const doc = { do: 'Look', still: pic, small, files: [{ src: pic, name: 'a.png' }, { src: 'stills/abc.png' }] }
    const lean = leanDoc(doc, O, ref)
    expect(lean.do).toBe('Look')
    expect(lean.small).toBe(small)
    expect(lean.still).toBe(`${O}/api/board/picture?board=council&c=steps&id=look-1&p=still&h=${pictureHash(pic)}`)
    expect(lean.files[0].src).toContain('p=files.0.src')
    expect(lean.files[1]).toBe(doc.files[1])
    expect(doc.still).toBe(pic)  // the stored document is untouched
    expect(JSON.stringify(lean).length).toBeLessThan(600)
  })

  it('returns the same object for a document with no picture', () => {
    const doc = { do: 'Answer', list: 'x', n: [1, 2] }
    expect(leanDoc(doc, O, ref)).toBe(doc)
    expect(leanDocs({ steps: { a: doc } }, O, 'council').steps.a).toBe(doc)
  })

  it('finds the picture a link names, and nothing once the picture changed', () => {
    const doc = { files: [{ src: pic }] }
    expect(pictureIn(doc, 'files.0.src', pictureHash(pic))).toBe(pic)
    expect(pictureIn(doc, 'files.0.src', '0000000000000000')).toBeNull()
    expect(pictureIn(doc, 'still', pictureHash(pic))).toBeNull()
    expect(decodePicture(pic)!.bytes.toString()).toBe('x'.repeat(3000))
  })

  it('puts a picture back when the page saves its link, only for the same document', () => {
    const stored = { still: pic, note: 'old' }
    const lean = leanDoc(stored, O, ref)
    const saved = { ...lean, note: 'new' }
    expect(carriesLink(saved)).toBe(true)
    expect(restorePictures(saved, ref, stored)).toEqual({ still: pic, note: 'new' })
    expect(restorePictures(saved, { ...ref, docId: 'other' }, stored).still).toBe(lean.still)
    expect(carriesLink({ note: 'plain' })).toBe(false)
  })
})
