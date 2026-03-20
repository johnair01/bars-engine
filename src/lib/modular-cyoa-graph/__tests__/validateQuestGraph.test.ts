/**
 * CMA v0 validateQuestGraph — strand falsification tests.
 * Run: npm run test:modular-cyoa-graph
 */

import type { CmaStory } from '../types'
import { validateQuestGraph } from '../validateQuestGraph'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function validLinearStory(): CmaStory {
  return {
    startId: 'a',
    nodes: [
      { id: 'a', kind: 'scene' },
      { id: 'b', kind: 'end' },
    ],
    edges: [
      { id: 'e1', from: 'a', to: 'b' },
    ],
  }
}

function testHappyPath() {
  const r = validateQuestGraph(validLinearStory())
  assert(r.ok, `Expected ok, got ${JSON.stringify(r.errors)}`)
  assert(r.errors.length === 0, 'Expected no errors')
}

function testNoEnd() {
  const story: CmaStory = {
    startId: 'a',
    nodes: [{ id: 'a', kind: 'scene' }],
    edges: [],
  }
  const r = validateQuestGraph(story)
  assert(!r.ok, 'Expected failure')
  assert(
    r.errors.some((e) => e.code === 'NO_END'),
    `Expected NO_END, got ${JSON.stringify(r.errors)}`
  )
}

function testUnreachableEnd() {
  const story: CmaStory = {
    startId: 'a',
    nodes: [
      { id: 'a', kind: 'scene' },
      { id: 'orphan', kind: 'end' },
    ],
    edges: [],
  }
  const r = validateQuestGraph(story)
  assert(!r.ok, 'Expected failure')
  assert(
    r.errors.some((e) => e.code === 'UNREACHABLE_END' && e.nodeId === 'orphan'),
    `Expected UNREACHABLE_END for orphan, got ${JSON.stringify(r.errors)}`
  )
}

function testChoiceSingleArm() {
  const story: CmaStory = {
    startId: 'c',
    nodes: [
      { id: 'c', kind: 'choice' },
      { id: 'd', kind: 'end' },
    ],
    edges: [{ id: 'e1', from: 'c', to: 'd' }],
  }
  const r = validateQuestGraph(story)
  assert(!r.ok, 'Expected failure')
  assert(
    r.errors.some((e) => e.code === 'CHOICE_SINGLE_ARM' && e.nodeId === 'c'),
    `Expected CHOICE_SINGLE_ARM, got ${JSON.stringify(r.errors)}`
  )
}

function testChoiceTwoArmsOk() {
  const story: CmaStory = {
    startId: 'c',
    nodes: [
      { id: 'c', kind: 'choice' },
      { id: 'd', kind: 'end' },
      { id: 'e', kind: 'end' },
    ],
    edges: [
      { id: 'e1', from: 'c', to: 'd', label: 'Left' },
      { id: 'e2', from: 'c', to: 'e', label: 'Right' },
    ],
  }
  const r = validateQuestGraph(story)
  assert(r.ok, `Expected ok, got ${JSON.stringify(r.errors)}`)
}

function testMissingStart() {
  const r = validateQuestGraph({
    startId: '',
    nodes: [{ id: 'a', kind: 'end' }],
    edges: [],
  })
  assert(!r.ok, 'Expected failure')
  assert(
    r.errors.some((e) => e.code === 'MISSING_START'),
    `Expected MISSING_START, got ${JSON.stringify(r.errors)}`
  )
}

function run() {
  testHappyPath()
  testNoEnd()
  testUnreachableEnd()
  testChoiceSingleArm()
  testChoiceTwoArmsOk()
  testMissingStart()
  console.log('✓ modular-cyoa-graph validateQuestGraph tests passed')
}

run()
