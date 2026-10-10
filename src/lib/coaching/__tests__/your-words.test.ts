/**
 * The testimonial ask: nothing goes out until the writer has said what changed
 * and chosen how to be named, and the email carries their words and that choice
 * with nothing added.
 */
import assert from 'node:assert/strict'
import { EMPTY_WORDS, canSend, composeWords, wordsMailto } from '../your-words'

assert.equal(canSend(EMPTY_WORDS), false)
assert.equal(canSend({ ...EMPTY_WORDS, changed: 'I stopped stalling.' }), false, 'needs a naming choice')
assert.equal(canSend({ ...EMPTY_WORDS, naming: 'full' }), false, 'needs what changed')
assert.equal(canSend({ ...EMPTY_WORDS, changed: '   ', naming: 'full' }), false, 'blank does not count')

const words = {
  before: ' Stuck on the launch for months. ',
  changed: 'I sent the email the next day.',
  name: 'Dana R.',
  naming: 'first' as const,
}
assert.equal(canSend(words), true)
assert.equal(
  composeWords(words),
  [
    'What I came in with:',
    'Stuck on the launch for months.',
    '',
    'What changed:',
    'I sent the email the next day.',
    '',
    'If you quote this: My first name and last initial',
    '',
    'Name: Dana R.',
  ].join('\n'),
)

// A private note says so, and an empty name adds no line.
const priv = composeWords({ ...EMPTY_WORDS, changed: 'Thank you.', naming: 'private' })
assert.match(priv, /If you quote this: Don’t quote me\. This is just for you\.$/)
assert.doesNotMatch(priv, /Name:/)

const href = wordsMailto(words)
assert.ok(href.startsWith('mailto:wendell@masteringallyship.com?subject='))
assert.equal(decodeURIComponent(href.split('&body=')[1]), composeWords(words))

console.log('your-words: ok')
