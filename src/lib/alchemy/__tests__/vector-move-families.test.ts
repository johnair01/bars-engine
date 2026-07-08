import * as assert from 'node:assert'
import { ALCHEMY_CHANNELS } from '../alchemy-graph'
import { selectShowUpPrimitivesForVector } from '../show-up-primitives'
import type { AlchemyAltitude, EmotionChannel } from '../types'
import {
  allVectorMoveFamilies,
  getVectorMoveFamily,
  getVectorMoveFamilyForStates,
  validateVectorMoveFamilies,
  VECTOR_MOVE_FAMILIES,
  type VectorKey,
} from '../vector-move-families'

const families = allVectorMoveFamilies()

assert.deepStrictEqual(validateVectorMoveFamilies(), [])
assert.strictEqual(families.length, 30)
assert.strictEqual(Object.keys(VECTOR_MOVE_FAMILIES).length, 30)

for (const channel of ALCHEMY_CHANNELS) {
  assert.ok(
    getVectorMoveFamily(`${channel}:dissatisfied->${channel}:neutral` as VectorKey),
    `${channel} has dissatisfied->neutral family`,
  )
  assert.ok(
    getVectorMoveFamily(`${channel}:neutral->${channel}:satisfied` as VectorKey),
    `${channel} has neutral->satisfied family`,
  )

  for (const target of ALCHEMY_CHANNELS) {
    if (target === channel) continue
    assert.ok(
      getVectorMoveFamily(`${channel}:neutral->${target}:neutral` as VectorKey),
      `${channel}->${target} has translate family`,
    )
  }
}

for (const family of families) {
  assert.ok(family.mechanicTags.length > 0, `${family.vector} has mechanic tags`)

  const [fromKey, toKey] = family.vector.split('->')
  const [fromChannel, fromAltitude] = fromKey.split(':')
  const [toChannel, toAltitude] = toKey.split(':')
  const candidates = selectShowUpPrimitivesForVector({
    from: { channel: fromChannel as EmotionChannel, altitude: fromAltitude as AlchemyAltitude },
    to: { channel: toChannel as EmotionChannel, altitude: toAltitude as AlchemyAltitude },
  })

  assert.ok(candidates.length > 0, `${family.vector} resolves to at least one primitive candidate`)
  assert.strictEqual(
    candidates[0].primitive.id,
    family.preferredPrimitiveIds[0],
    `${family.vector} starts with its first authored primitive`,
  )
}

const sadnessMetabolize = getVectorMoveFamilyForStates(
  { channel: 'sadness', altitude: 'dissatisfied' },
  { channel: 'sadness', altitude: 'neutral' },
)
assert.strictEqual(sadnessMetabolize?.coverage, 'good')
assert.strictEqual(sadnessMetabolize?.preferredPrimitiveIds[0], 'name_care_distance')
assert.match(sadnessMetabolize?.coreMechanic ?? '', /care and distance/)

const sadnessTranscend = getVectorMoveFamilyForStates(
  { channel: 'sadness', altitude: 'neutral' },
  { channel: 'sadness', altitude: 'satisfied' },
)
assert.strictEqual(sadnessTranscend?.coverage, 'good')
assert.strictEqual(sadnessTranscend?.preferredPrimitiveIds[0], 'restore_flow')
assert.match(sadnessTranscend?.coreMechanic ?? '', /Restore flow/)

const angerToSadness = getVectorMoveFamilyForStates(
  { channel: 'anger', altitude: 'neutral' },
  { channel: 'sadness', altitude: 'neutral' },
)
assert.strictEqual(angerToSadness?.role, 'translate')
assert.strictEqual(angerToSadness?.coverage, 'stub')
assert.strictEqual(angerToSadness?.preferredPrimitiveIds[0], 'repair_without_performance')
assert.match(angerToSadness?.coreMechanic ?? '', /desire and boundary reveal care/)

const neutralityMetabolize = getVectorMoveFamilyForStates(
  { channel: 'neutrality', altitude: 'dissatisfied' },
  { channel: 'neutrality', altitude: 'neutral' },
)
assert.strictEqual(neutralityMetabolize?.coverage, 'good')
assert.strictEqual(neutralityMetabolize?.preferredPrimitiveIds[0], 'create_sequence')

const tunedTranslateFirstPrimitives = [
  ['anger:neutral->fear:neutral', 'bound_the_ask', 'locate_edge', 'Risk Before Force'],
  ['fear:neutral->joy:neutral', 'make_meaning_actionable', 'restore_participation', 'Turn The Edge Into An Experiment'],
  ['joy:neutral->fear:neutral', 'bound_the_ask', 'locate_edge', 'Map The Exposure In The Possibility'],
  ['neutrality:neutral->anger:neutral', 'interrupt_pattern', 'reveal_desire', 'Find Where Force Belongs'],
  ['neutrality:neutral->fear:neutral', 'bound_the_ask', 'locate_edge', 'Find The Field Edge'],
  ['neutrality:neutral->joy:neutral', 'make_meaning_actionable', 'restore_participation', 'Find The Live Part'],
  ['joy:neutral->sadness:neutral', 'name_care_distance', 'name_tenderness', 'Find The Care In The Joy'],
  ['neutrality:neutral->sadness:neutral', 'name_care_distance', 'reveal_care', 'Find What Matters In The Field'],
] as const

for (const [vector, firstPrimitive, mechanicTag, operationTitle] of tunedTranslateFirstPrimitives) {
  const family = getVectorMoveFamily(vector)
  assert.strictEqual(family?.preferredPrimitiveIds[0], firstPrimitive, `${vector} has tuned first primitive`)
  assert.ok(family?.mechanicTags.includes(mechanicTag), `${vector} includes ${mechanicTag} mechanic tag`)
  assert.strictEqual(family?.mechanicOperation?.title, operationTitle, `${vector} has authored mechanic operation`)
  assert.ok((family?.mechanicOperation?.steps.length ?? 0) >= 4, `${vector} operation has concrete steps`)
  assert.ok(family?.mechanicOperation?.output.trim(), `${vector} operation has player output`)
  assert.ok(family?.mechanicOperation?.completionCriteria.trim(), `${vector} operation has completion criteria`)
  assert.strictEqual(family?.mechanicOperation?.practiceVariants.wake_up.role, 'processing')
  assert.strictEqual(family?.mechanicOperation?.practiceVariants.open_up.role, 'processing')
  assert.strictEqual(family?.mechanicOperation?.practiceVariants.clean_up.role, 'processing')
  assert.strictEqual(family?.mechanicOperation?.practiceVariants.grow_up.role, 'bridge')
  assert.strictEqual(family?.mechanicOperation?.practiceVariants.show_up.role, 'action')
  assert.ok(family?.mechanicOperation?.practiceVariants.open_up.prompt.trim(), `${vector} open_up has prompt`)
  assert.ok(family?.mechanicOperation?.practiceVariants.open_up.output.trim(), `${vector} open_up has output`)
  assert.ok(family?.mechanicOperation?.practiceVariants.show_up.prompt.trim(), `${vector} show_up has prompt`)
  assert.ok(family?.mechanicOperation?.practiceVariants.show_up.output.trim(), `${vector} show_up has output`)
}

const authoredOperations = families.filter((family) => family.mechanicOperation)
assert.strictEqual(authoredOperations.length, 8)

const joyToSadness = getVectorMoveFamily('joy:neutral->sadness:neutral')
assert.match(joyToSadness?.mechanicOperation?.intent ?? '', /care inside the joy/)
assert.match(joyToSadness?.mechanicOperation?.practiceVariants.wake_up.prompt ?? '', /what care lives inside it/)
assert.match(joyToSadness?.mechanicOperation?.practiceVariants.open_up.prompt ?? '', /receive the care/)
