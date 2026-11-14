import { createHash } from 'crypto'
import { describe, expect, it } from 'vitest'
import { servePart } from '../part'
import { setBackend } from '@/lib/board/content-store'
import { memoryBackend } from '@/lib/board/__tests__/memory-backend'

const PART = '{"positions": [], "resolved": {}}\n'
const sha = createHash('sha256').update(PART).digest('hex')

describe('servePart', () => {
  it('serves the decided part as JSON, cached for good only when the page names its hash', async () => {
    setBackend(memoryBackend({ 'board/council-board-decided.json': PART }).backend)
    const pinned = await servePart('decided', sha.slice(0, 16))
    expect(await pinned.text()).toBe(PART)
    expect(pinned.headers.get('content-type')).toBe('application/json')
    expect(pinned.headers.get('cache-control')).toContain('immutable')
    const other = await servePart('decided', '0000000000000000')
    expect(other.headers.get('cache-control')).toBe('private, no-store')
    expect(JSON.parse(await other.text())).toEqual({ positions: [], resolved: {} })
    setBackend(undefined)
  })

  it('refuses a name it does not serve and says when nothing is pushed', async () => {
    setBackend(memoryBackend({}).backend)
    expect((await servePart('board_data', null)).status).toBe(404)
    expect((await servePart('decided', null)).status).toBe(503)
    setBackend(undefined)
  })
})
