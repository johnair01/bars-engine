/**
 * Twee serializer tests
 *
 * Run with: npm run test:twee-serializer
 */

import {
  serializePassageToBlock,
  replacePassageInTwee,
} from '@/lib/twee-serializer'

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

function testSerializePassageToBlock() {
  const block = serializePassageToBlock(
    'Arrival',
    ['cluster1', 'passage'],
    'You arrive at the Bruised Banana.\n\nA quiet house.',
    [
      { label: 'Continue', target: 'The Work' },
      { label: 'Skip', target: 'The Invitation' },
    ]
  )

  assert(block.includes(':: Arrival [cluster1 passage]'), 'Should have header with tags')
  assert(block.includes('You arrive at the Bruised Banana.'), 'Should have body')
  assert(block.includes('[[Continue|The Work]]'), 'Should have first link')
  assert(block.includes('[[Skip|The Invitation]]'), 'Should have second link')
  assert(block.endsWith('\n\n'), 'Should end with double newline')
}

function testSerializePassageNoTagsNoLinks() {
  const block = serializePassageToBlock('Simple', [], 'Just prose.', [])

  assert(block.includes(':: Simple\n'), 'Should have header without tags')
  assert(!block.includes('['), 'Should not have tag brackets')
  assert(block.includes('Just prose.'), 'Should have body')
}

function testReplacePassageInTwee() {
  const twee = `:: StoryTitle
Bruised Banana

:: StoryData
{"start": "Arrival"}

:: Arrival [cluster1]
Old content here.
[[Continue|The Work]]

:: The Work
Next passage.
`

  const newBlock = serializePassageToBlock(
    'Arrival',
    ['cluster1'],
    'New content here.',
    [{ label: 'Continue', target: 'The Work' }]
  )

  const result = replacePassageInTwee(twee, 'Arrival', newBlock)

  assert(result.includes(':: StoryTitle'), 'Should preserve StoryTitle')
  assert(result.includes(':: StoryData'), 'Should preserve StoryData')
  assert(result.includes('New content here.'), 'Should have new body')
  assert(!result.includes('Old content here.'), 'Should remove old body')
  assert(result.includes(':: The Work'), 'Should preserve next passage')
}

function testReplacePassageThrowsWhenNotFound() {
  const twee = `:: Arrival
Content
`
  let threw = false
  try {
    replacePassageInTwee(twee, 'Nonexistent', ':: Nonexistent\nx\n\n')
  } catch {
    threw = true
  }
  assert(threw, 'Should throw when passage not found')
}

function run() {
  testSerializePassageToBlock()
  testSerializePassageNoTagsNoLinks()
  testReplacePassageInTwee()
  testReplacePassageThrowsWhenNotFound()
  console.log('✓ twee-serializer tests passed')
}

run()
