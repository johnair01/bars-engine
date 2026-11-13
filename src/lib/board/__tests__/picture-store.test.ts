import { beforeEach, describe, expect, it } from 'vitest'
import { setBackend, type ContentBackend } from '../content-store'
import { liftInlinePictures, listPictures, readPictureBytes, sha256Of, storePicture } from '../picture-store'

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex')
const OTHER = Buffer.from('89504e470d0a1a0a0000000d49484453', 'hex')
const data = (bytes: Buffer) => `data:image/png;base64,${bytes.toString('base64')}`

function memory(): ContentBackend & { files: Map<string, Uint8Array> } {
  const files = new Map<string, Uint8Array>()
  return {
    name: 'memory',
    files,
    async read(key) {
      const b = files.get(key)
      return b ? { body: new Response(b).body!, type: 'application/octet-stream' } : null
    },
    async write(key, bytes) { files.set(key, bytes) },
  }
}

describe('picture store', () => {
  let mem: ReturnType<typeof memory>

  beforeEach(() => {
    mem = memory()
    setBackend(mem)
  })

  it('stores a picture by its sha and serves it from the sha link', async () => {
    const r = await storePicture({ data: data(PNG), round: '2026-11-12-probe' })
    expect(r.error).toBeUndefined()
    expect(r.picture?.sha).toBe(sha256Of(PNG))
    expect(r.picture?.url).toBe(`https://bars-engine.vercel.app/board/stills/sha/${sha256Of(PNG)}.png`)
    expect(mem.files.has(`sha/${sha256Of(PNG)}`)).toBe(true)
    const back = await readPictureBytes(sha256Of(PNG))
    expect(back?.type).toBe('image/png')
    expect(Buffer.from(back!.bytes).equals(PNG)).toBe(true)
  })

  it('refuses a type it cannot serve and a picture over the cap', async () => {
    expect((await storePicture({ data: 'data:image/bmp;base64,AAAA' })).error).toContain('image/png')
    const big = `data:image/png;base64,${'A'.repeat(4 * 1024 * 1024 + 40)}`
    expect((await storePicture({ data: big })).error).toContain('the most one call carries')
  })

  it('refuses a path the store does not serve', async () => {
    const r = await storePicture({ data: data(PNG), path: 'board/elsewhere.png' })
    expect(r.error).toContain('not a stills path')
  })

  it('takes a stills path and answers the path link', async () => {
    const path = 'council/callsheets/stills/2026-11-12-probe/frame-1.png'
    const r = await storePicture({ data: data(PNG), path, maker: 'freemilk' })
    expect(r.picture?.url).toBe(`https://bars-engine.vercel.app/board/stills/${path}`)
    expect(mem.files.has('manifest.json')).toBe(true)
    const listed = await listPictures('2026-11-12-probe')
    expect(listed.map((p) => p.path)).toContain(path)
  })

  it('lifts every inline picture a row carries and leaves the row with links', async () => {
    const row = { kind: 'questions', pass: 'p-1', look: true, still: data(PNG), options: [{ v: 'A', label: 'yes' }],
      files: [{ src: data(OTHER) }] }
    const r = await liftInlinePictures(row, { maker: 'freemilk' })
    expect(r.error).toBeUndefined()
    expect(r.pictures).toHaveLength(2)
    const lifted = JSON.stringify(r.data)
    expect(lifted).not.toContain('data:image')
    expect(lifted).toContain('/board/stills/sha/')
  })

  it('lists what it stored, by round', async () => {
    await storePicture({ data: data(PNG), round: 'round-a' })
    await storePicture({ data: data(OTHER), round: 'round-b' })
    expect((await listPictures('round-a')).map((p) => p.sha)).toEqual([sha256Of(PNG)])
  })
})
