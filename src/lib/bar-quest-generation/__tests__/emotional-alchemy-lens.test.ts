/**
 * Run: npx tsx src/lib/bar-quest-generation/__tests__/emotional-alchemy-lens.test.ts
 */

import { pickGmLensFromStoryState } from '@/lib/bar-quest-generation/emotional-alchemy'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function run() {
  assert(pickGmLensFromStoryState(undefined) === undefined, 'empty state')
  assert(pickGmLensFromStoryState({ lens: 'Sage' }) === 'sage', 'normalize lens')
  assert(
    pickGmLensFromStoryState({ hub_portal_face: 'diplomat', lens: 'regent' }) === 'regent',
    'lens wins over hub face',
  )
  assert(
    pickGmLensFromStoryState({ hub_portal_face: 'architect', active_face: 'shaman' }) === 'architect',
    'hub face before active_face',
  )
  assert(
    pickGmLensFromStoryState({ active_face: 'challenger' }) === 'challenger',
    'active_face fallback',
  )
  assert(pickGmLensFromStoryState({ hub_portal_face: 'bogus' }) === undefined, 'reject bogus')

  // eslint-disable-next-line no-console -- test runner
  console.log('✓ emotional-alchemy lens OK')
}

run()
