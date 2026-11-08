import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { parseSpecPacket, loadSpecPacket } from '../spec-packet'
import { setBackend } from '../content-store'
import { memoryBackend } from './memory-backend'
import { createHash } from 'crypto'

const packet = {
  version: 1, title: 'Portable visual evidence', stage: 'analyze', createdAt: '2026-11-07T00:00:00Z',
  source: { repository: 'wendell-britt/Six-faces-council', commit: 'a'.repeat(40), branch: 'agent/codex/spec', path: '.specify/specs/portable-look-evidence' },
  documents: { request: '# Ask', spec: '# Spec', plan: '# Plan', tasks: '# Tasks', reviews: '# Six reviews' },
  checks: ['The contract holds.'], limits: ['The Board render remains open.'], lookUrls: ['https://bars-engine.vercel.app/board/look?t=x&i=a.jpg'],
}

describe('immutable spec review packet', () => {
  it('accepts a bounded packet and rejects a changed source or unsafe look', () => {
    expect(parseSpecPacket(JSON.stringify(packet))?.stage).toBe('analyze')
    expect(parseSpecPacket(JSON.stringify({ ...packet, source: { ...packet.source, path: '../secret' } }))).toBeNull()
    expect(parseSpecPacket(JSON.stringify({ ...packet, lookUrls: ['https://elsewhere.test/steal'] }))).toBeNull()
    expect(parseSpecPacket('x'.repeat(300_001))).toBeNull()
  })

  it('reads only the content-addressed JSON object', async () => {
    const raw = JSON.stringify(packet), sha = createHash('sha256').update(raw).digest('hex')
    const mem = memoryBackend()
    mem.objects.set('sha/' + sha, { bytes: new TextEncoder().encode(raw), type: 'application/json' })
    setBackend(mem.backend)
    expect((await loadSpecPacket(sha))?.title).toBe(packet.title)
    expect(await loadSpecPacket('bad')).toBeNull()
    expect(mem.reads).toEqual(['sha/' + sha])
    setBackend(undefined)
  })
})
