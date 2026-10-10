/**
 * Source tags: the five utm names pass from the coaching page's address to its Calendly links,
 * and nothing else does.
 */
import assert from 'node:assert/strict'
import { readSourceTags, withSourceTags } from '../source-tags'

const CAL = 'https://calendly.com/wendell-britt/coaching-75'

// No tags: the link is untouched.
assert.deepEqual(readSourceTags(''), [])
assert.equal(withSourceTags(CAL, []), CAL)

// Only the five utm names are read; other parameters, such as the walk's own, are ignored.
const tags = readSourceTags('?utm_source=podcast&utm_campaign=ep4&feeling=fear&belief=secret&utm_medium=')
assert.deepEqual(tags, [
  ['utm_source', 'podcast'],
  ['utm_campaign', 'ep4'],
])

// They reach the booking link.
const tagged = new URL(withSourceTags(CAL, tags))
assert.equal(tagged.searchParams.get('utm_source'), 'podcast')
assert.equal(tagged.searchParams.get('utm_campaign'), 'ep4')
assert.equal(tagged.searchParams.get('feeling'), null)
assert.equal(tagged.searchParams.get('belief'), null)

// A tag already on the link wins.
assert.equal(
  new URL(withSourceTags(`${CAL}?utm_source=site`, tags)).searchParams.get('utm_source'),
  'site',
)

// Long values are cut to 100 characters.
assert.equal(readSourceTags(`?utm_source=${'x'.repeat(300)}`)[0][1].length, 100)

console.log('source-tags: ok')
