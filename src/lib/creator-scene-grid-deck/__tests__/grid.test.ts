import assert from 'node:assert'
import {
  buildGuidedSceneAtlasDescription,
  sceneAtlasGuidedTitle,
} from '@/lib/creator-scene-grid-deck/bar-template'
import { allSceneGridPrompts, buildSceneGridCardPrompt } from '@/lib/creator-scene-grid-deck/prompts'
import {
  flattenSceneAtlasCards,
  nextEmptySceneAtlasCell,
} from '@/lib/creator-scene-grid-deck/scene-atlas-nav'
import { orderedSuitKeys } from '@/lib/creator-scene-grid-deck/suits'
import type { SceneGridCardView } from '@/lib/creator-scene-grid-deck/load-deck-view'

assert.strictEqual(orderedSuitKeys().length, 4)

const all = allSceneGridPrompts()
assert.strictEqual(all.length, 52, '4 suits × 13 ranks = 52')

const keys = new Set(all.map((r) => `${r.suit}:${r.rank}`))
assert.strictEqual(keys.size, 52, 'all keys unique')

const p = buildSceneGridCardPrompt('SCENE_GRID_TOP_DOM', 1)
assert.ok(p.promptTitle.length > 0)
assert.ok(p.promptText.length > 20)

const guided = buildGuidedSceneAtlasDescription(
  { displayTitle: 'Cell', rowLabel: 'Top', rank: 1 },
  { intention: 'Hold space', doneLooks: 'Named next step', careNote: 'Care line' }
)
assert.ok(guided.includes('Guided answers'))
assert.ok(guided.includes('Hold space'))
assert.ok(guided.includes('Care line'))
assert.strictEqual(sceneAtlasGuidedTitle('  my title line\nmore', 'fallback'), 'my title line')
assert.strictEqual(sceneAtlasGuidedTitle('', 'fallback'), 'fallback')

const suits = orderedSuitKeys()
const mock: Record<string, SceneGridCardView[]> = {}
for (const s of suits) {
  mock[s] = [
    { id: `${s}-1`, suit: s, rank: 1, promptTitle: '', promptText: '', rowLabel: '', displayTitle: '', boundBar: null },
    { id: `${s}-2`, suit: s, rank: 2, promptTitle: '', promptText: '', rowLabel: '', displayTitle: '', boundBar: { id: 'b', title: 'x' } },
  ]
}
const flat = flattenSceneAtlasCards(suits, mock)
assert.strictEqual(flat.length, 8)
assert.strictEqual(nextEmptySceneAtlasCell(suits, mock, null)?.id, `${suits[0]}-1`)
assert.strictEqual(nextEmptySceneAtlasCell(suits, mock, `${suits[0]}-1`)?.id, `${suits[1]}-1`)
assert.strictEqual(nextEmptySceneAtlasCell(suits, mock, `${suits[3]}-1`), null)

console.log('creator-scene-grid-deck:', all.length, 'prompts OK')
