/**
 * CMA → Twee compile smoke tests.
 * Run: npm run test:modular-cyoa-graph  (extend script to include this file)
 */

import type { CmaStory } from '../types'
import { cmaStoryToTwee } from '../cmaStoryToTwee'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function testLinear() {
  const story: CmaStory = {
    id: 'linear-demo',
    startId: 'intro',
    nodes: [
      { id: 'intro', kind: 'scene', title: 'Hello' },
      { id: 'fin', kind: 'end', title: 'Done' },
    ],
    edges: [{ id: 'e1', from: 'intro', to: 'fin' }],
  }
  const twee = cmaStoryToTwee(story)
  assert(twee.includes(':: StoryTitle'), 'StoryTitle')
  assert(twee.includes('"start"'), 'start in StoryData')
  assert(twee.includes(':: intro'), 'intro passage')
  assert(twee.includes('[[Next|fin]]') || twee.includes('[[Continue|fin]]'), 'link') // label is Next for non-choice single edge - actually code uses Next only for choice - for scene uses 'Next' when single? Read code: single edge uses e.label ?? (node.kind === 'choice' ? 'Continue' : 'Next') -> Next
  assert(twee.includes(':: fin'), 'fin passage')
}

function testChoiceTwoArms() {
  const story: CmaStory = {
    startId: 'c',
    nodes: [
      { id: 'c', kind: 'choice', title: 'Pick' },
      { id: 'd', kind: 'end', title: 'Left' },
      { id: 'e', kind: 'end', title: 'Right' },
    ],
    edges: [
      { id: '1', from: 'c', to: 'd', label: 'Left' },
      { id: '2', from: 'c', to: 'e', label: 'Right' },
    ],
  }
  const twee = cmaStoryToTwee(story)
  assert(twee.includes('[[Left|d]]'), 'left link')
  assert(twee.includes('[[Right|e]]'), 'right link')
}

function run() {
  testLinear()
  testChoiceTwoArms()
  console.log('✓ cmaStoryToTwee tests passed')
}

run()
