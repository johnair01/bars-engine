import assert from 'node:assert'
import {
  appendDiscardUnique,
  parseIdArray,
  pickRandomDrawIndex,
  removeIdOnce,
  shuffleIds,
  stringifyIdArray,
} from '../cycle-logic'

assert.deepStrictEqual(parseIdArray(''), [])
assert.deepStrictEqual(parseIdArray('not json'), [])
assert.deepStrictEqual(parseIdArray('["a","b"]'), ['a', 'b'])

const shuffled = shuffleIds(['1', '2', '3', '4', '5'])
assert.strictEqual(shuffled.length, 5)
assert.ok(shuffled.every((x) => ['1', '2', '3', '4', '5'].includes(x)))

assert.deepStrictEqual(removeIdOnce(['a', 'b', 'c'], 'b'), ['a', 'c'])
assert.deepStrictEqual(removeIdOnce(['a'], 'x'), ['a'])

assert.deepStrictEqual(appendDiscardUnique(['a'], 'a'), ['a'])
assert.deepStrictEqual(appendDiscardUnique(['a'], 'b'), ['a', 'b'])

const pick = pickRandomDrawIndex(['only'])
assert.ok(pick && pick.id === 'only' && pick.index === 0)
assert.strictEqual(pickRandomDrawIndex([]), null)

assert.strictEqual(stringifyIdArray(['x']), '["x"]')

console.log('prompt-deck cycle-logic: OK')
