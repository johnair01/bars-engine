/**
 * ARDS Phase 4: nation keys map to ELEMENT_TOKENS.frame (Register 1 + walk/portrait tint).
 * Run: npx tsx src/lib/ui/__tests__/nation-element.test.ts
 */

import { ELEMENT_TOKENS } from '../card-tokens'
import { getElementForNationKey, getNationFrameHex, NATION_KEY_TO_ELEMENT } from '../nation-element'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const EXPECTED: Record<string, keyof typeof ELEMENT_TOKENS> = {
  pyrakanth: 'fire',
  lamenth: 'water',
  virelune: 'wood',
  argyra: 'metal',
  meridia: 'earth',
}

function main() {
  for (const [nation, element] of Object.entries(EXPECTED)) {
    assert(NATION_KEY_TO_ELEMENT[nation] === element, `${nation} → ${element}`)
    const frame = ELEMENT_TOKENS[element].frame
    assert(getNationFrameHex(nation) === frame, `getNationFrameHex(${nation}) === ${frame}`)
    assert(getElementForNationKey(nation) === element, `getElementForNationKey(${nation})`)
  }
  assert(getElementForNationKey('unknown-nation') === null, 'unknown → null')
  console.log('nation-element tests passed.')
}

main()
