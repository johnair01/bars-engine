import { describe, expect, it } from 'vitest'
import { SHAMAN, replies, lineAt } from '../../../../public/sect/heaven/talk-words.js'

/* The Shaman Elder's talk card (heaven-quest-demo step 1; his answers on hq-spirits-1 and hq-source-1, 2026-11-17). */
const nodes = ['open', 'what', 'why', 'again', 'close']
describe('the Shaman Elder talk card', () => {
  it('has a line at every node and keeps each under 30 words', () => {
    for (const n of nodes) { const l = lineAt(n); expect(l.length).toBeGreaterThan(10); expect(l.split(/\s+/).length).toBeLessThanOrEqual(30) }
  })
  it('offers two replies at the opening, and every reply seal is a verb or a question the player can say', () => {
    expect(replies('open').map(r => r[0])).toEqual(['what', 'why'])
    expect(replies('what').map(r => r[0])).toEqual(['why', 'go'])
    expect(replies('why').map(r => r[0])).toEqual(['what', 'go'])
    expect(replies('again').map(r => r[0])).toEqual(['go'])
    expect(replies('close')).toEqual([])
  })
  it('names no Elder and no face on screen, and keeps no negation pairs', () => {
    const all = [...nodes.map(lineAt), ...['open', 'what', 'why', 'again'].flatMap(n => replies(n).map(r => r[1]))]
    for (const s of all) {
      expect(s).not.toMatch(/\b(Shaman|Architect|Challenger|Regent|Diplomat|Sage)\b/)
      expect(s).not.toMatch(/\bnot [^.]*, (you're|you are|but)\b/i)
    }
    expect(SHAMAN.go.reply).toBe("I'll tell you")
  })
})
