/** An in-memory content store for tests, seeded with repo paths and their text, as a push would leave them. */
import { createHash } from 'crypto'
import type { ContentBackend, Manifest } from '../content-store'

export function memoryBackend(seed: Record<string, string> = {}) {
  const objects = new Map<string, { bytes: Uint8Array; type: string }>()
  const reads: string[] = []
  const enc = (s: string) => new TextEncoder().encode(s)
  const m: Manifest = { at: '2026-10-30T00:00:00Z', files: {} }
  for (const [p, t] of Object.entries(seed)) {
    const sha = createHash('sha256').update(t).digest('hex'), type = p.endsWith('.jpg') ? 'image/jpeg' : 'text/html; charset=utf-8'
    objects.set('sha/' + sha, { bytes: enc(t), type })
    m.files[p] = { sha, type, size: t.length }
  }
  if (Object.keys(seed).length) objects.set('manifest.json', { bytes: enc(JSON.stringify(m)), type: 'application/json' })
  const backend: ContentBackend = {
    name: 'memory',
    async read(key) {
      reads.push(key)
      const o = objects.get(key)
      return o ? { body: new ReadableStream<Uint8Array>({ start(c) { c.enqueue(o.bytes); c.close() } }), type: o.type } : null
    },
    async write(key, bytes, type) { objects.set(key, { bytes, type }) },
  }
  return { backend, objects, reads }
}
