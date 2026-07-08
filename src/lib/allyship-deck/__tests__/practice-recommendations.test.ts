import * as assert from 'node:assert'
import { getMoveCardById } from '../assemble'
import { recommendDeckCardPractice } from '../practice-recommendations'

const openGatherChallenger = getMoveCardById('OPEN-GR-CHALLENGER')!
const openGatherShaman = getMoveCardById('OPEN-GR-SHAMAN')!
const showDirectChallenger = getMoveCardById('SHOW-DA-CHALLENGER')!

const quick = recommendDeckCardPractice({
  card: openGatherChallenger,
  mode: 'quick',
  orientation: 'external',
  subject: 'other',
})

assert.ok(quick.selectedTool, 'quick mode selects a tool without vector data')
assert.ok(quick.reasons.some((reason) => reason.includes('quick mode')), 'quick mode includes quick reason')
assert.ok(quick.protocol.length >= 3, 'quick mode includes protocol')
assert.ok(quick.expectedOutputKinds.length > 0, 'quick mode includes expected output')
assert.ok(quick.completionCriteria.length > 0, 'quick mode includes completion criteria')
assert.match(quick.summary, /This card is asking you to Open Up through Challenger in Gather Resources/)

const sadnessDeep = recommendDeckCardPractice({
  card: openGatherChallenger,
  mode: 'deep',
  orientation: 'internal',
  subject: 'self',
  present: { channel: 'sadness', altitude: 'dissatisfied' },
  desired: { channel: 'sadness', altitude: 'satisfied' },
})

assert.strictEqual(sadnessDeep.selectedTool.id, 'felt_thread')
assert.ok(sadnessDeep.reasons.some((reason) => reason.includes('sadness:dissatisfied -> sadness:satisfied')))
assert.ok(sadnessDeep.reasons.some((reason) => reason.includes('vector fit')))
assert.match(sadnessDeep.summary, /Given this charge, start with Find the Felt Thread/)

const angerDeep = recommendDeckCardPractice({
  card: openGatherChallenger,
  mode: 'deep',
  orientation: 'internal',
  subject: 'self',
  present: { channel: 'anger', altitude: 'dissatisfied' },
  desired: { channel: 'anger', altitude: 'satisfied' },
})

assert.ok(
  sadnessDeep.selectedTool.id !== angerDeep.selectedTool.id || sadnessDeep.reasons[0] !== angerDeep.reasons[0],
  'same card with different vector does not collapse into identical recommendation',
)
assert.ok(angerDeep.reasons.some((reason) => reason.includes('anger:dissatisfied -> anger:satisfied')))

const fearShaman = recommendDeckCardPractice({
  card: openGatherShaman,
  mode: 'deep',
  orientation: 'internal',
  subject: 'self',
  present: { channel: 'fear', altitude: 'dissatisfied' },
  desired: { channel: 'fear', altitude: 'satisfied' },
})

const fearChallenger = recommendDeckCardPractice({
  card: openGatherChallenger,
  mode: 'deep',
  orientation: 'internal',
  subject: 'self',
  present: { channel: 'fear', altitude: 'dissatisfied' },
  desired: { channel: 'fear', altitude: 'satisfied' },
})

assert.ok(fearShaman.reasons.some((reason) => reason.includes('shaman operation')), 'Shaman operation affects reasoning')
assert.ok(fearChallenger.reasons.some((reason) => reason.includes('challenger operation')), 'Challenger operation affects reasoning')
assert.notStrictEqual(fearShaman.reasons.join('|'), fearChallenger.reasons.join('|'))

assert.ok(
  quick.selectedTool.outputKinds.some((kind) => ['clean_line', 'next_action', 'field_map', 'ritual_artifact', 'quest_seed', 'internal_commitment'].includes(kind)),
  'quick mode favors concrete output capability',
)
assert.notStrictEqual(
  quick.reasons.join('|'),
  sadnessDeep.reasons.join('|'),
  'quick and deep modes produce different reasoning',
)

const override = recommendDeckCardPractice({
  card: showDirectChallenger,
  mode: 'quick',
  orientation: 'external',
  subject: 'collective',
  selectedToolId: 'clean_line',
})

assert.strictEqual(override.selectedTool.id, 'clean_line')
assert.strictEqual(override.reasons[0], 'tool selected by player')

const invalidOverride = recommendDeckCardPractice({
  card: showDirectChallenger,
  mode: 'quick',
  orientation: 'external',
  subject: 'collective',
  selectedToolId: 'not_a_tool' as never,
})

assert.notStrictEqual(invalidOverride.selectedTool.id, 'not_a_tool')
assert.ok(invalidOverride.reasons.some((reason) => reason.includes('was not found')))

const blockerHint = recommendDeckCardPractice({
  card: openGatherChallenger,
  mode: 'deep',
  orientation: 'internal',
  subject: 'self',
  present: { channel: 'sadness', altitude: 'dissatisfied' },
  desired: { channel: 'sadness', altitude: 'satisfied' },
  blocker: 'I have a belief that I am not enough unless this is perfect.',
})

assert.strictEqual(blockerHint.selectedTool.id, 'felt_thread', 'blocker hint does not dominate sadness vector fit')
assert.ok(blockerHint.rankedTools.some((ranked) => ranked.tool.id === 'story_turnaround' && ranked.reasons.some((reason) => reason.includes('belief work'))))

const deepNoVector = recommendDeckCardPractice({
  card: openGatherShaman,
  mode: 'deep',
  orientation: 'internal',
  subject: 'self',
})

assert.ok(deepNoVector.selectedTool)
assert.ok(deepNoVector.reasons.some((reason) => reason.includes('vector data was not supplied')))

console.log('✓ allyship-deck practice recommendation tests OK')
