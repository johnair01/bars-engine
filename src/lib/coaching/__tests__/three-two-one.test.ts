/**
 * The coaching 3-2-1's record: what a client copies at the end has to read
 * back what they wrote, in order, with nothing invented.
 */
import assert from 'node:assert/strict'
import { EMPTY_PASS, composeSummary } from '../three-two-one'

// An untouched pass produces only the heading.
assert.equal(composeSummary(EMPTY_PASS), 'My 3-2-1')

const pass = {
  ...EMPTY_PASS,
  subject: 'part' as const,
  faceCharge: '  He sits by the door so he can leave first.  ',
  maskName: 'The Lookout',
  thread: [
    { from: 'me' as const, text: 'What do you want from me?' },
    { from: 'it' as const, text: 'To get you out before anyone notices.' },
    { from: 'me' as const, text: '   ' },
  ],
  beVoice: 'I am the one who keeps watch.',
  beShift: '',
  ownIt: { quality: 'Reading a room fast', move: '' },
}

const summary = composeSummary(pass)

// Sections appear in the practice's order: 3, 2, 1, then taking back.
const order = ['3 · Face it', '2 · Talk to it', '1 · Be it', 'Taking back'].map((h) => summary.indexOf(h))
assert.ok(order.every((i) => i > 0), 'every filled section is present')
assert.deepEqual([...order].sort((a, b) => a - b), order, 'sections stay in order')

// The part speaks under the name the client gave it; blank turns are dropped.
assert.ok(summary.includes('2 · Talk to it: The Lookout'))
assert.ok(summary.includes('Me: What do you want from me?\nThe Lookout: To get you out before anyone notices.'))
assert.ok(!summary.includes('Me: \n'))

// Text is trimmed and empty fields are left out.
assert.ok(summary.includes('He sits by the door so he can leave first.\n'))
assert.ok(summary.includes('I am the one who keeps watch.'))
assert.ok(!summary.includes('What shifted'))
assert.ok(summary.includes('Quality: Reading a room fast'))
assert.ok(!summary.includes('This week:'))

// With no name, the part is "It".
const unnamed = composeSummary({ ...pass, maskName: '' })
assert.ok(unnamed.includes('\n2 · Talk to it\n'))
assert.ok(unnamed.includes('It: To get you out'))

console.log('✓ coaching 3-2-1: the record reads back what the client wrote')
