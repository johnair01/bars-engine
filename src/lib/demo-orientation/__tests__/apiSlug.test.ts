/**
 * Run: npx tsx src/lib/demo-orientation/__tests__/apiSlug.test.ts
 */
import { apiAdventureSlugForDemoOrientation } from '../resolve'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function run() {
  assert(
    apiAdventureSlugForDemoOrientation('wrong-slug', 'bruised-banana') === 'bruised-banana',
    'bruised-banana campaignRef forces API slug'
  )
  assert(
    apiAdventureSlugForDemoOrientation('some-campaign', 'other') === 'some-campaign',
    'other campaignRef keeps DB slug'
  )
  assert(
    apiAdventureSlugForDemoOrientation('foo', null) === 'foo',
    'null campaignRef keeps DB slug'
  )
  console.log('apiAdventureSlugForDemoOrientation: ok')
}

run()
