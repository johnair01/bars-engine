/**
 * The 3-2-1 demo's record: what a client copies at the end has to read back
 * what they wrote, in order, with nothing invented and nothing doubled.
 */
import assert from 'node:assert/strict'
import { EMPTY_PASS, composeSummary, threadHasBothVoices } from '../three-two-one'

// An untouched pass produces only the heading.
assert.equal(composeSummary(EMPTY_PASS), 'My 3-2-1')

const pass = {
  subject: 'part' as const,
  faceIt: '  He sits by the door so he can leave first.  ',
  thread: [
    { from: 'me' as const, text: 'What is your job?' },
    { from: 'it' as const, text: 'To get you out before anyone notices.' },
    { from: 'me' as const, text: '   ' },
  ],
  beIt: { iAm: 'I am the lookout.', iWant: 'to rest', iGive: '' },
  ownIt: { quality: 'Reading a room fast', move: '' },
}

const summary = composeSummary(pass)

// Sections appear in the practice's order: 3, 2, 1, then taking back.
const order = ['3 · Face it', '2 · Talk to it', '1 · Be it', 'Taking back'].map((h) => summary.indexOf(h))
assert.ok(order.every((i) => i > 0), 'every filled section is present')
assert.deepEqual([...order].sort((a, b) => a - b), order, 'sections stay in order')

// Text is trimmed, and blank lines in the thread are dropped.
assert.ok(summary.includes('He sits by the door so he can leave first.\n'))
assert.ok(summary.includes('Me: What is your job?\nIt: To get you out before anyone notices.'))
assert.ok(!summary.includes('Me: \n'))

// A stem the client retyped is not doubled; a bare answer gets its stem.
assert.ok(summary.includes('I am the lookout.'))
assert.ok(!summary.includes('I am I am'))
assert.ok(summary.includes('What I want is to rest'))
assert.ok(!summary.includes('What I give you is'), 'an empty field is left out')
assert.ok(summary.includes('Quality: Reading a room fast'))
assert.ok(!summary.includes('This week:'))

// The conversation needs both seats before the client moves on.
assert.equal(threadHasBothVoices(pass.thread), true)
assert.equal(threadHasBothVoices([{ from: 'me', text: 'Hello?' }]), false)
assert.equal(threadHasBothVoices([{ from: 'me', text: 'Hi' }, { from: 'it', text: ' ' }]), false)

console.log('✓ coaching 3-2-1: the record reads back what the client wrote')
