import assert from 'node:assert/strict'
import { initialTtvPhase } from '@/lib/tap-the-vein/initial-phase'

const own = { status: 'committed', isCarried: false }
const carried = { status: 'committed', isCarried: true }
const gone = { status: 'carried_over', isCarried: false }

function testCarriedOnlyStartsAtFront() {
  assert.equal(initialTtvPhase({ sealed: false, rawEntry: '', tasks: [carried] }), 'open')
}
function testCarriedPlusFreewriteGoesToCommit() {
  assert.equal(initialTtvPhase({ sealed: false, rawEntry: 'x', tasks: [carried] }), 'commit')
}
function testOwnTaskGoesToWork() {
  assert.equal(initialTtvPhase({ sealed: false, rawEntry: 'x', tasks: [carried, own] }), 'work')
}
function testEmptyAndSealed() {
  assert.equal(initialTtvPhase({ sealed: false, rawEntry: '', tasks: [gone] }), 'open')
  assert.equal(initialTtvPhase({ sealed: false, rawEntry: ' x ', tasks: [] }), 'commit')
  assert.equal(initialTtvPhase({ sealed: true, rawEntry: '', tasks: [carried] }), 'seal')
}
testCarriedOnlyStartsAtFront(); testCarriedPlusFreewriteGoesToCommit(); testOwnTaskGoesToWork(); testEmptyAndSealed()
console.log('initial-phase tests passed')
