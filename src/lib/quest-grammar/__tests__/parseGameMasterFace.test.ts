import assert from 'node:assert'
import { parseGameMasterFace } from '../parseGameMasterFace'

assert.strictEqual(parseGameMasterFace(null), null)
assert.strictEqual(parseGameMasterFace(undefined), null)
assert.strictEqual(parseGameMasterFace(''), null)
assert.strictEqual(parseGameMasterFace('  '), null)
assert.strictEqual(parseGameMasterFace('Architect'), 'architect')
assert.strictEqual(parseGameMasterFace('SHAMAN'), 'shaman')
assert.strictEqual(parseGameMasterFace('not-a-face'), null)
assert.strictEqual(parseGameMasterFace('Ontologist'), null)

console.log('parseGameMasterFace tests passed')
