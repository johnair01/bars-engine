import * as assert from 'node:assert'
import type { AllyshipDomain, Operation, OutputBar } from '@/lib/allyship-deck/types'
import type { EmotionChannel } from '../types'
import type { VectorMovePracticeLens } from '../vector-move-families'
import {
  allEmotionalAlchemyTools,
  allMvpEmotionalAlchemyTools,
  compareToolRatings,
  EMOTIONAL_ALCHEMY_TOOL_IDS,
  getEmotionalAlchemyTool,
  MVP_EMOTIONAL_ALCHEMY_TOOL_IDS,
  TOOL_RATING_SCORE,
  validateEmotionalAlchemyToolRegistry,
  type EmotionalAlchemyMoveRole,
} from '../tool-registry'

const tools = allEmotionalAlchemyTools()
const mvpTools = allMvpEmotionalAlchemyTools()

assert.deepStrictEqual(validateEmotionalAlchemyToolRegistry(), [])
assert.strictEqual(tools.length, 11)
assert.strictEqual(mvpTools.length, 8)
assert.strictEqual(new Set(EMOTIONAL_ALCHEMY_TOOL_IDS).size, EMOTIONAL_ALCHEMY_TOOL_IDS.length)
assert.strictEqual(new Set(MVP_EMOTIONAL_ALCHEMY_TOOL_IDS).size, MVP_EMOTIONAL_ALCHEMY_TOOL_IDS.length)

for (const tool of tools) {
  assert.ok(tool.genericName.trim(), `${tool.id} has generic name`)
  assert.ok(tool.barsName.trim(), `${tool.id} has BARS name`)
  assert.ok(tool.sourceLineage.trim(), `${tool.id} has source lineage`)
  assert.ok(tool.coreMechanic.trim(), `${tool.id} has core mechanic`)
  assert.ok(tool.outputKinds.length > 0, `${tool.id} has output kinds`)
  assert.ok(tool.protocol.length >= 3, `${tool.id} has concrete protocol`)
  assert.ok(tool.completionCriteria.length > 0, `${tool.id} has completion criteria`)
  assert.ok(tool.whenNotToUse.length > 0, `${tool.id} has when-not-to-use guidance`)
}

const waves: VectorMovePracticeLens[] = ['wake_up', 'open_up', 'clean_up', 'grow_up', 'show_up']
for (const wave of waves) {
  const strong = tools.filter((tool) => tool.waveRatings[wave] === 'strong')
  assert.ok(strong.length >= 3, `${wave} has at least three strong tool options`)
}

const roles: EmotionalAlchemyMoveRole[] = ['metabolize', 'translate', 'transcend']
for (const role of roles) {
  assert.ok(tools.some((tool) => tool.moveRoleRatings[role] === 'strong'), `${role} has a strong tool`)
}

const channels: EmotionChannel[] = ['anger', 'sadness', 'fear', 'joy', 'neutrality']
for (const channel of channels) {
  assert.ok(tools.some((tool) => tool.channelRatings[channel] === 'strong'), `${channel} has a strong tool`)
}

const operations: Operation[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']
for (const operation of operations) {
  assert.ok(
    tools.some((tool) => tool.operationAffinity[operation] === 'strong'),
    `${operation} has a strong operation-affinity tool`,
  )
}

const domains: AllyshipDomain[] = ['GATHERING_RESOURCES', 'RAISE_AWARENESS', 'DIRECT_ACTION', 'SKILLFUL_ORGANIZING']
for (const domain of domains) {
  assert.ok(
    tools.some((tool) => tool.domainAffinity[domain] === 'strong'),
    `${domain} has a strong domain-affinity tool`,
  )
}

const outputBars: OutputBar[] = ['awareness', 'experience', 'insight', 'wisdom', 'artifact']
for (const outputBar of outputBars) {
  assert.ok(
    tools.some((tool) => tool.outputBarAffinity[outputBar] === 'strong'),
    `${outputBar} BAR has a strong tool affinity`,
  )
}

assert.strictEqual(getEmotionalAlchemyTool('charge_dialogue_321').tier, 'mvp')
assert.strictEqual(getEmotionalAlchemyTool('return_to_body').tier, 'next')
assert.ok(getEmotionalAlchemyTool('clean_line').outputKinds.includes('clean_line'))
assert.ok(getEmotionalAlchemyTool('one_true_next_move').outputKinds.includes('next_action'))
assert.ok(getEmotionalAlchemyTool('make_it_a_game').outputKinds.includes('quest_seed'))
assert.strictEqual(getEmotionalAlchemyTool('make_it_a_game').tier, 'mvp')
assert.ok(getEmotionalAlchemyTool('felt_thread').outputKinds.includes('felt_handle'))
assert.ok(getEmotionalAlchemyTool('bar_capture').outputKinds.includes('bar_reflection'))
assert.ok(getEmotionalAlchemyTool('story_turnaround').outputKinds.includes('belief_reframe'))
assert.ok(getEmotionalAlchemyTool('put_it_on_the_board').outputKinds.includes('field_map'))

assert.ok(TOOL_RATING_SCORE.strong > TOOL_RATING_SCORE.medium)
assert.ok(TOOL_RATING_SCORE.medium > TOOL_RATING_SCORE.weak)
assert.ok(TOOL_RATING_SCORE.weak > TOOL_RATING_SCORE.not_recommended)
assert.ok(compareToolRatings('strong', 'weak') < 0, 'strong sorts before weak')

console.log('✓ emotional alchemy tool registry tests OK')
