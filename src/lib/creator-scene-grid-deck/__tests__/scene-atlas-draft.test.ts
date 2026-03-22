import assert from 'node:assert'
import {
  emptySceneAtlasGuidedDraftPayload,
  normalizeSceneAtlasGuidedDraftPayload,
  parseSceneAtlasGuidedDraftPayload,
  SCENE_ATLAS_GUIDED_DRAFT_VERSION,
  SCENE_ATLAS_GUIDED_TEMPLATE_KEY,
  serializeSceneAtlasGuidedDraftPayload,
} from '../scene-atlas-draft'
import { buildGuidedSceneAtlasDescription } from '../bar-template'

const card = { displayTitle: 'Top · 3', rowLabel: 'Top', rank: 3 }

function roundTrip(p: ReturnType<typeof serializeSceneAtlasGuidedDraftPayload>) {
  const parsed = parseSceneAtlasGuidedDraftPayload(p)
  assert.ok(parsed)
  assert.strictEqual(parsed.version, SCENE_ATLAS_GUIDED_DRAFT_VERSION)
  assert.strictEqual(parsed.templateKey, SCENE_ATLAS_GUIDED_TEMPLATE_KEY)
  return parsed
}

const p0 = serializeSceneAtlasGuidedDraftPayload(
  normalizeSceneAtlasGuidedDraftPayload({
    currentStep: 6,
    answers: {
      intention: 'Hold space',
      done_looks: 'Named edges',
      care_note: '',
      stakeholders: 'Partner',
      next_action: 'Call Tuesday',
    },
    reviewTitle: 'My title',
    reviewDescription: 'Long body',
    tagsLine: 'scene-atlas, x',
  })
)
const rt = roundTrip(p0)
assert.strictEqual(rt.currentStep, 6)
assert.strictEqual(rt.answers.intention, 'Hold space')
assert.strictEqual(rt.answers.stakeholders, 'Partner')
assert.strictEqual(rt.reviewTitle, 'My title')

const bad = parseSceneAtlasGuidedDraftPayload({ version: 999, templateKey: SCENE_ATLAS_GUIDED_TEMPLATE_KEY })
assert.strictEqual(bad, null)

const empty = emptySceneAtlasGuidedDraftPayload()
assert.strictEqual(empty.currentStep, 1)
assert.deepStrictEqual(empty.answers, {})

const desc = buildGuidedSceneAtlasDescription(card, {
  intention: 'A',
  doneLooks: 'B',
  careNote: 'C',
  stakeholders: 'D',
  nextAction: 'E',
})
assert.ok(desc.includes('**Stakeholders / risk holders:**'))
assert.ok(desc.includes('D'))
assert.ok(desc.includes('**Next concrete step:**'))
assert.ok(desc.includes('E'))

console.log('scene-atlas-draft: OK')
