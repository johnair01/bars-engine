import assert from 'node:assert'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  MOVE_ELEMENT,
  themeForMove,
  FACE_COLOR,
  MOVE_ICON_PATHS,
  MOVE_LABELS,
  OPERATION_LABELS,
  DOMAIN_LABELS,
  LIMINAL,
} from '../card-visuals'
import { ELEMENT_TOKENS } from '../../ui/card-tokens'
import type { AllyshipDeck, BasicMove, Operation } from '../types'

// Move → element channel (the handoff mapping).
assert.strictEqual(MOVE_ELEMENT.show_up, 'fire')
assert.strictEqual(MOVE_ELEMENT.grow_up, 'wood')
assert.strictEqual(MOVE_ELEMENT.clean_up, 'water')
assert.strictEqual(MOVE_ELEMENT.wake_up, 'earth')
assert.strictEqual(MOVE_ELEMENT.open_up, 'liminal')

// themeForMove: elements resolve from ELEMENT_TOKENS; Open Up uses the reserved liminal.
assert.strictEqual(themeForMove('show_up').frame, ELEMENT_TOKENS.fire.frame)
assert.strictEqual(themeForMove('show_up').gradFrom, ELEMENT_TOKENS.fire.gradFrom)
assert.strictEqual(themeForMove('open_up').frame, LIMINAL.frame, 'Open Up → liminal frame')
assert.strictEqual(themeForMove('open_up').glow, LIMINAL.glow)

// Every move has a non-empty glyph; every face has a color.
for (const move of Object.keys(MOVE_LABELS) as BasicMove[]) {
  assert.ok(MOVE_ICON_PATHS[move]?.length, `${move} has glyph paths`)
}
for (const op of Object.keys(OPERATION_LABELS) as Operation[]) {
  assert.ok(/^#[0-9a-f]{6}$/i.test(FACE_COLOR[op]), `${op} has a hex color`)
}

// Coverage against the REAL deck — no card may use a move/face/domain we don't map.
const deckPath = join(process.cwd(), 'public/allyship-deck/allyship-deck.json')
const deck = JSON.parse(readFileSync(deckPath, 'utf8')) as AllyshipDeck
const moves = deck.cards.filter((c) => c.kind === 'move')
assert.ok(moves.length === 120, `expected 120 move cards, got ${moves.length}`)
for (const c of moves) {
  if (c.kind !== 'move') continue
  assert.ok(MOVE_ELEMENT[c.move], `unmapped move: ${c.move} (${c.id})`)
  assert.ok(FACE_COLOR[c.operation], `unmapped operation: ${c.operation} (${c.id})`)
  assert.ok(DOMAIN_LABELS[c.domain], `unmapped domain: ${c.domain} (${c.id})`)
  assert.ok(themeForMove(c.move).frame, `no theme for ${c.move}`)
}

console.log(`✓ allyship-deck card-visuals tests passed (covered all ${moves.length} cards)`)
