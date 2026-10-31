import { createHash } from 'crypto'
import { gzipSync } from 'zlib'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { readText, setBackend } from '@/lib/board/content-store'
import { memoryBackend } from '@/lib/board/__tests__/memory-backend'
import { GET, POST, PUT } from '../route'

const URL_ = 'https://bars-engine.vercel.app/api/board/content'
const auth = { authorization: 'Bearer t0ken' }
const sha = (s: string) => createHash('sha256').update(s).digest('hex')

beforeEach(() => { vi.stubEnv('COUNCIL_MENU_TOKEN', 't0ken'); setBackend(memoryBackend().backend) })
afterEach(() => { setBackend(undefined); vi.unstubAllEnvs() })

describe('/api/board/content', () => {
  it('refuses a request without the token', async () => {
    expect((await GET(new NextRequest(URL_))).status).toBe(401)
  })

  it('stores a gzipped file under its hash, points a path at it, and serves it', async () => {
    const page = '<p>the council board</p>', h = sha(page)
    const put = await PUT(new NextRequest(`${URL_}?sha=${h}&type=${encodeURIComponent('text/html; charset=utf-8')}`,
      { method: 'PUT', headers: auth, body: gzipSync(page) }))
    expect(put.status).toBe(200)
    const post = await POST(new NextRequest(URL_, { method: 'POST', headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ set: { 'board/council-board.html': { sha: h, type: 'text/html; charset=utf-8', size: page.length } } }) }))
    expect(post.status).toBe(200)
    expect(await readText('board/council-board.html')).toBe(page)
    const m = await (await GET(new NextRequest(URL_, { headers: auth }))).json()
    expect(m.files['board/council-board.html'].sha).toBe(h)
  })

  it('refuses bytes that do not match their hash, and a path outside the board content', async () => {
    const bad = await PUT(new NextRequest(`${URL_}?sha=${sha('a')}&type=image%2Fpng`, { method: 'PUT', headers: auth, body: gzipSync('b') }))
    expect(bad.status).toBe(400)
    const out = await POST(new NextRequest(URL_, { method: 'POST', headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ set: { 'council/faces.yaml': { sha: sha('a'), type: 'application/json', size: 1 } } }) }))
    expect(out.status).toBe(400)
  })
})
