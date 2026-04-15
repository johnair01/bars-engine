import assert from 'node:assert'
import { validateChunkTagRow, validateHexagramId } from '../book-chunk-tags-validation'

assert.strictEqual(validateHexagramId(24), true)
assert.strictEqual(validateHexagramId(0), false)
assert.strictEqual(validateHexagramId(65), false)

const ok = validateChunkTagRow(
  { charStart: 0, charEnd: 10, gameMasterFace: 'sage', hexagramId: 24 },
  0
)
assert.strictEqual(ok.ok, true)

const badFace = validateChunkTagRow({ charStart: 0, charEnd: 1, gameMasterFace: 'ontologist' }, 0)
assert.strictEqual(badFace.ok, false)

console.log('book-chunk-tags-validation tests OK')
