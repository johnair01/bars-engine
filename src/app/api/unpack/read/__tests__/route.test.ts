import { describe, expect, it } from 'vitest'
import { POST } from '../route'

const call = (body: unknown, raw?: string) =>
  POST(new Request('http://x/api/unpack/read', { method: 'POST', body: raw ?? JSON.stringify(body) }) as never)

describe('POST /api/unpack/read', () => {
  it('returns the six answers, the channel and both feeling hands', async () => {
    const res = await call({ text: "I'm stuck and scared, I want to feel relieved" })
    expect(res.status).toBe(200)
    const j = await res.json()
    expect(Object.keys(j.answers)).toEqual(['q1', 'q2', 'q3', 'q4', 'q5', 'q6'])
    expect(j.feel_now).toEqual(['stuck', 'scared'])
    expect(j.feel_want).toEqual(['relieved'])
    expect(['dissatisfied', 'neutral', 'satisfied']).toContain(j.state)
    expect(Array.isArray(j.shadowVoices) && Array.isArray(j.heard)).toBe(true)
  })
  it('refuses missing, empty and over-long text, bad JSON and a bad lexicon with 400', async () => {
    for (const r of [await call({}), await call({ text: '  ' }), await call({ text: 'x'.repeat(2001) }), await call(null, '{nope'), await call({ text: 'a', lexicon: { plasma: ['x'] } })]) {
      expect(r.status).toBe(400)
      expect((await r.json()).error).toBeTruthy()
    }
  })
})
