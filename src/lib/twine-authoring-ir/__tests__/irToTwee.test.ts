/**
 * IR → Twee compiler tests
 * Run with: npx tsx src/lib/twine-authoring-ir/__tests__/irToTwee.test.ts
 */

import { irToTwee } from '../irToTwee'
import { validateIrStory } from '../validateIrStory'
import { parseTwee } from '@/lib/twee-parser'
import type { IRNode } from '../types'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function testSimpleChoiceNode() {
  const nodes: IRNode[] = [
    {
      node_id: 'intro_03',
      type: 'choice_node',
      title: 'How does this land?',
      body: ["You've arrived while this next chapter is beginning."],
      choices: [
        { text: 'This sounds exciting.', next_node: 'aligned_response' },
        { text: "I'm curious.", next_node: 'curious_response' },
      ],
      emits: ['campaign_intro_viewed'],
    },
    { node_id: 'aligned_response', type: 'passage', body: 'You chose excitement.' },
    { node_id: 'curious_response', type: 'passage', body: 'You chose curiosity.' },
  ]

  const twee = irToTwee(nodes, { title: 'Test Story', startNode: 'intro_03' })
  assert(twee.includes(':: StoryTitle'), 'Should have StoryTitle')
  assert(twee.includes(':: StoryData'), 'Should have StoryData')
  assert(twee.includes(':: intro_03'), 'Should have intro_03 passage')
  assert(twee.includes('[[This sounds exciting.|aligned_response]]'), 'Should have choice link')
  assert(twee.includes('<<run emitEvent("campaign_intro_viewed")>>'), 'Should have emit macro')

  const parsed = parseTwee(twee)
  assert(parsed.startPassage === 'intro_03', 'Start passage should be intro_03')
  assert(parsed.passages.length >= 3, 'Should have at least 3 passages')
}

function testValidateSuccess() {
  const nodes: IRNode[] = [
    { node_id: 'start', type: 'passage', body: 'Hello.', next_node: 'end' },
    { node_id: 'end', type: 'passage', body: 'Done.' },
  ]
  const result = validateIrStory(nodes)
  assert(result.valid, 'Should be valid')
  assert(result.errors.length === 0, 'Should have no errors')
}

function testValidateDuplicateNodeId() {
  const nodes: IRNode[] = [
    { node_id: 'start', type: 'passage', body: 'A.' },
    { node_id: 'start', type: 'passage', body: 'B.' },
  ]
  const result = validateIrStory(nodes)
  assert(!result.valid, 'Should be invalid')
  assert(result.errors.some((e) => e.includes('Duplicate')), 'Should report duplicate')
}

function testValidateMissingTarget() {
  const nodes: IRNode[] = [
    {
      node_id: 'start',
      type: 'choice_node',
      body: 'Choose.',
      choices: [{ text: 'Go', next_node: 'nonexistent' }],
    },
  ]
  const result = validateIrStory(nodes)
  assert(!result.valid, 'Should be invalid')
  assert(result.errors.some((e) => e.includes('Missing target')), 'Should report missing target')
}

function testValidateEmptyNodeId() {
  const nodes: IRNode[] = [{ node_id: '', type: 'passage', body: 'Oops.' }]
  const result = validateIrStory(nodes)
  assert(!result.valid, 'Should be invalid')
  assert(result.errors.some((e) => e.includes('Empty')), 'Should report empty node_id')
}

function testExternalTargetStub() {
  const nodes: IRNode[] = [
    {
      node_id: 'start',
      type: 'choice_node',
      body: 'Go to end.',
      choices: [{ text: 'End', next_node: 'END_Success' }],
    },
  ]
  const twee = irToTwee(nodes)
  assert(twee.includes(':: END_Success'), 'Should emit stub for external target')
  assert(twee.includes('[End — END_Success]'), 'Stub should have placeholder text')
}

function testBodyArray() {
  const nodes: IRNode[] = [
    {
      node_id: 'multi',
      type: 'passage',
      body: ['First paragraph.', 'Second paragraph.'],
    },
  ]
  const twee = irToTwee(nodes)
  assert(twee.includes('First paragraph.'), 'Should have first paragraph')
  assert(twee.includes('Second paragraph.'), 'Should have second paragraph')
  assert(twee.includes('First paragraph.\n\nSecond paragraph.'), 'Should join with newlines')
}

function runTests() {
  testSimpleChoiceNode()
  testValidateSuccess()
  testValidateDuplicateNodeId()
  testValidateMissingTarget()
  testValidateEmptyNodeId()
  testExternalTargetStub()
  testBodyArray()
  console.log('✅ All irToTwee tests passed')
}

runTests()
