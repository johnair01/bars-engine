/**
 * CMA → IR mapping tests.
 */

import { validateIrStory } from '@/lib/twine-authoring-ir/validateIrStory'

import type { CmaStory } from '../types'
import { cmaStoryToIrNodes } from '../cmaStoryToIr'
import { cmaStoryToTwee } from '../cmaStoryToTwee'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

const DEMO: CmaStory = {
  id: 'ir-bridge',
  startId: 'intro',
  nodes: [
    { id: 'intro', kind: 'scene', title: 'Opening' },
    { id: 'pick', kind: 'choice', title: 'Choose' },
    { id: 'end_a', kind: 'end', title: 'A' },
    { id: 'end_b', kind: 'end', title: 'B' },
  ],
  edges: [
    { id: 'e1', from: 'intro', to: 'pick' },
    { id: 'e2', from: 'pick', to: 'end_a', label: 'Left' },
    { id: 'e3', from: 'pick', to: 'end_b', label: 'Right' },
  ],
}

function testIrValidates() {
  const nodes = cmaStoryToIrNodes(DEMO)
  assert(nodes.length === 4, 'node count')
  assert(nodes[1].type === 'choice_node', 'choice type')
  const v = validateIrStory(nodes)
  assert(v.valid, `IR valid: ${v.errors.join('; ')}`)
}

function testTweeMatchesIrPath() {
  const twee = cmaStoryToTwee(DEMO)
  assert(twee.includes(':: intro'), 'passage intro')
  assert(twee.includes('[[Left|end_a]]'), 'link left')
}

function run() {
  testIrValidates()
  testTweeMatchesIrPath()
  console.log('✓ cmaStoryToIr tests passed')
}

run()
