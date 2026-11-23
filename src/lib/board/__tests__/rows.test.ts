import { describe, expect, it } from 'vitest'
import { copyErrors, rowErrors } from '../rows'

const line = { line: 'Pull the one that fits', screen: 'tap-the-vein/ribbons', file: 'src/lib/tap-the-vein/paths.ts' }
const look = { kind: 'causes', desc: 'a look' }

describe('a look row\'s copy lines (voice-desk FR-014)', () => {
  it('accepts one to twelve lines', () => {
    expect(rowErrors({ ...look, copy: [line] })).toEqual([])
    expect(rowErrors({ ...look, copy: Array(12).fill(line) })).toEqual([])
  })
  it('refuses none, thirteen, and a line with no screen or file', () => {
    expect(copyErrors([])).not.toEqual([])
    expect(copyErrors(Array(13).fill(line))).not.toEqual([])
    expect(copyErrors([{ line: 'x', file: 'f' }])).not.toEqual([])
    expect(copyErrors([{ line: ' ', screen: 's', file: 'f' }])).not.toEqual([])
    expect(copyErrors('Pull the one')).not.toEqual([])
  })
})
