import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// The seated hearth moment, take A "Motes from the satchel" (Wendell's pick of the art page, 2026-10-24): sat by the fire,
// no card opens. The held embers rise out of the satchel into a crescent, one comes into your hands, a held breath shows its
// colour, and in a shared room a paper lantern takes it and the room's hooks answer. Only "Something stirs" opens a strip.
describe('the seated hearth moment', () => {
  const garden = readFileSync(path.resolve(__dirname, '../../../../public/between/garden.js'), 'utf8')
  it('opens in the room, not as the hearth strip, once sat', () => {
    expect(garden).toContain('if (name === "hearth" && arg !== "stir") { hmBegin(); return; }')
    expect(garden).not.toContain('function hearthSheet(')
    expect(garden).not.toContain('Show its element on the lantern')
    expect(garden).toContain('data-open="hearth" data-id="stir">Something stirs</button>')
  })
  it('has the crescent, the hold, the breath, the lantern and the hooks', () => {
    for (const fn of ['function hmBegin(', 'function hmEnd(', 'function hmSync(', 'function hmHold(', 'function hmPress(', 'function hmUnfold(', 'async function hmLight(', 'function hmSend(', 'function hmTick('])
      expect(garden).toContain(fn)
    expect(garden).toMatch(/state === "held"\)\.sort/) // only held embers rise
    expect(garden).toContain('hd.showEl = m.shown;') // the element shows on the lantern only if the maker let it
    expect(garden).toMatch(/lid = await makeLantern\(m\.eid\)/)
    expect(garden).toMatch(/h\.takes === "hang" && !h\.item/)
  })
  it('keeps the moment free of counts and rewards', () => {
    const block = garden.slice(garden.indexOf('function hmBegin('), garden.indexOf('function hmTick('))
    expect(block).not.toMatch(/toast\(/)
  })
  it('ends the moment when you stand', () => {
    expect(garden).toMatch(/function standUp\(\) \{[\s\S]*?if \(hm\) hmEnd\(\);/)
  })
  it('gives a preview demo embers in memory only', () => {
    expect(garden).toContain('const EMBER_DEMO = PREVIEW_HOST && KQ.get("embers") === "demo";')
    expect(garden).toMatch(/const demoPouch = EMBER_DEMO \?/)
  })
})
