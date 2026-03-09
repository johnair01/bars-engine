/**
 * BAR interpretation layer — Tests
 * Run with: npx tsx src/lib/bar-quest-generation/__tests__/interpretation.test.ts
 */

import { interpretBarForQuestGeneration } from '../interpretation'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function testDomainQuestType() {
  const result = interpretBarForQuestGeneration({
    id: 'bar-1',
    title: 'Need support for residency',
    description: 'Looking for funding to attend the residency program.',
    allyshipDomain: 'GATHERING_RESOURCES',
    campaignRef: 'bruised-banana',
  })
  assert(result.questType === 'resource', 'GATHERING_RESOURCES → resource')
  assert(result.domain === 'GATHERING_RESOURCES', 'domain preserved')
  assert(result.suggestedTitle === 'Need support for residency', 'title used')
}

function testKeywordOverride() {
  const result = interpretBarForQuestGeneration({
    id: 'bar-2',
    title: 'Connect two players',
    description: 'I want to connect Sarah with the design team.',
    allyshipDomain: 'GATHERING_RESOURCES',
    campaignRef: null,
  })
  assert(result.questType === 'coordination', 'connect keyword → coordination')
}

function testAwarenessDomain() {
  const result = interpretBarForQuestGeneration({
    id: 'bar-3',
    title: 'Share the campaign',
    description: 'Post about the campaign on social media.',
    allyshipDomain: 'RAISE_AWARENESS',
    campaignRef: 'bruised-banana',
  })
  assert(result.questType === 'awareness', 'RAISE_AWARENESS → awareness')
}

function testSourceContextTags() {
  const result = interpretBarForQuestGeneration({
    id: 'bar-4',
    title: 'Test the feature',
    description: 'Run a session to test the new flow.',
    allyshipDomain: 'DIRECT_ACTION',
    campaignRef: null,
    type: 'insight',
    moveType: 'showUp',
  })
  assert(result.sourceContextTags.includes('DIRECT_ACTION'), 'domain in tags')
  assert(result.sourceContextTags.includes('insight'), 'type in tags')
  assert(result.sourceContextTags.includes('showUp'), 'moveType in tags')
}

function testConfidenceScore() {
  const short = interpretBarForQuestGeneration({
    id: 'bar-5',
    title: 'Short',
    description: 'Brief.',
    allyshipDomain: 'GATHERING_RESOURCES',
    campaignRef: null,
  })
  const long = interpretBarForQuestGeneration({
    id: 'bar-6',
    title: 'Detailed Quest',
    description: 'A much longer description that provides substantial context for the quest generation system to work with.',
    allyshipDomain: 'GATHERING_RESOURCES',
    campaignRef: null,
  })
  assert(long.confidenceScore >= short.confidenceScore, 'longer content → higher confidence')
}

function run() {
  testDomainQuestType()
  testKeywordOverride()
  testAwarenessDomain()
  testSourceContextTags()
  testConfidenceScore()
  console.log('✓ All interpretation tests passed')
}

run()
