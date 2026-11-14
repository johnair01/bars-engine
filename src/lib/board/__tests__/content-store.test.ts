import { afterEach, describe, expect, it, vi } from 'vitest'
import { allowedPath, listNames, readFile, readText, setBackend, setEntries, storeObject } from '../content-store'
import { memoryBackend } from './memory-backend'

afterEach(() => { setBackend(undefined); vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('allowedPath', () => {
  it('takes the board pages, pictures and studio files, and nothing else in the repo', () => {
    for (const p of ['board/council-board.html', 'board/nonprofit/nonprofit-board.html', 'board/board_data.json',
      'board/stills/94a1067981bd2ba3.jpg', 'council/callsheets/stills/r 1/frames/a.PNG', 'council/callsheets/INDEX.md',
      'council/loops/spirit-generator.json', 'council/ledger/2026-10-25-pull-014112.json', 'council/needs-work-done.json'])
      expect(allowedPath(p), p).toBe(true)
    for (const p of ['council/faces.yaml', 'board/stills/x.jpg', 'council/callsheets/stills/../../faces.png',
      'council/callsheets/stills/a.glb', 'council/ledger/sub/x.json', '.env', 'board//council-board.html'])
      expect(allowedPath(p), p).toBe(false)
  })
})

describe('the store', () => {
  it('reads a page by its path through the manifest, and each hash once', async () => {
    const mem = memoryBackend({ 'board/council-board.html': '<p>board</p>' })
    setBackend(mem.backend)
    expect(await readText('board/council-board.html')).toBe('<p>board</p>')
    expect(await readText('board/council-board.html')).toBe('<p>board</p>')
    expect(mem.reads.filter(k => k.startsWith('sha/'))).toHaveLength(1)
    expect(await readText('board/board_data.json')).toBeNull()
  })

  it('swaps a page in one manifest write and lists a folder', async () => {
    const mem = memoryBackend()
    setBackend(mem.backend)
    await storeObject('a'.repeat(64), new TextEncoder().encode('{"n":1}'), 'application/json')
    await setEntries({ 'council/ledger/2026-10-25-pull-014112.json': { sha: 'a'.repeat(64), type: 'application/json', size: 7 },
      'council/ledger/x.json': { sha: 'a'.repeat(64), type: 'application/json', size: 7 } })
    expect((await listNames('council/ledger/')).sort()).toEqual(['2026-10-25-pull-014112.json', 'x.json'])
    await setEntries({}, ['council/ledger/x.json'])
    expect(await listNames('council/ledger/')).toEqual(['2026-10-25-pull-014112.json'])
    expect(await readText('council/ledger/2026-10-25-pull-014112.json')).toBe('{"n":1}')
  })

  it('reads GitHub only when BOARD_CONTENT_RAW_FALLBACK=1', async () => {
    setBackend(memoryBackend().backend)
    const seen: string[] = []
    vi.stubGlobal('fetch', async (u: string) => { seen.push(u); return { ok: true, body: new Response('raw').body, headers: new Headers() } })
    expect(await readFile('council/callsheets/INDEX.md')).toBeNull()
    expect(seen).toEqual([])
    vi.stubEnv('BOARD_CONTENT_RAW_FALLBACK', '1')
    expect(await readText('council/callsheets/INDEX.md')).toBe('raw')
    expect(seen[0]).toBe('https://raw.githubusercontent.com/wendell-britt/Six-faces-council/main/council/callsheets/INDEX.md')
  })
})

describe('boardToken', () => {
  it('takes BOARD_BLOB_READ_WRITE_TOKEN, else the one token no other store owns, else the private family store, else the project token', async () => {
    const { boardToken } = await import('../content-store')
    expect(boardToken({ BOARD_BLOB_READ_WRITE_TOKEN: 'b', BLOB_READ_WRITE_TOKEN: 'p' })).toBe('b')
    expect(boardToken({ COUNCILBOARD_READ_WRITE_TOKEN: 'c', BLOB_READ_WRITE_TOKEN: 'p', FAMILY_ROOM_BLOB_READ_WRITE_TOKEN: 'f' })).toBe('c')
    expect(boardToken({ A_READ_WRITE_TOKEN: 'a', B_READ_WRITE_TOKEN: 'b', BLOB_READ_WRITE_TOKEN: 'p' })).toBe('p')
    expect(boardToken({ BLOB_READ_WRITE_TOKEN: 'p' })).toBe('p')
    expect(boardToken({ BLOB_READ_WRITE_TOKEN: 'p', FAMILY_ROOM_BLOB_READ_WRITE_TOKEN: 'f' })).toBe('f')
  })
})
