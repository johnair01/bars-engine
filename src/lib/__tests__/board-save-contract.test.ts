/**
 * The board-save contract. fixtures/board-saves is a copy of six-faces-council's tests/fixtures/board-saves plus
 * schema/board-save.schema.json; that repo checks the same files with JSON Schema and fails when the copies differ.
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { applyWrite, COLLECTIONS, RECORD_KINDS, validateSave } from '@/lib/board/save'

const FIX = path.resolve(__dirname, '../../../fixtures/board-saves')
const load = (dir: string) => fs.readdirSync(path.join(FIX, dir)).filter(f => f.endsWith('.json')).sort()
  .map(f => [f, JSON.parse(fs.readFileSync(path.join(FIX, dir, f), 'utf8'))] as const)

describe('board-save contract', () => {
  it.each(load('valid'))('accepts %s', (_name, save) => {
    const r = validateSave(save)
    expect(r.ok ? [] : r.errors).toEqual([])
  })
  it.each(load('invalid'))('refuses %s', (_name, save) => {
    expect(validateSave(save).ok).toBe(false)
  })
  it('names the same collections as the JSON schema', () => {
    const schema = JSON.parse(fs.readFileSync(path.join(FIX, 'board-save.schema.json'), 'utf8'))
    expect([...COLLECTIONS].sort()).toEqual([...schema.properties.collection.enum].sort())
    expect([...RECORD_KINDS].every(k => (COLLECTIONS as readonly string[]).includes(k))).toBe(true)
  })
  it('merges an update onto the latest document and replaces on set', () => {
    const latest = { do: 'x', done: false }
    expect(applyWrite(latest, { board: 'nonprofit', collection: 'steps', docId: 's', mode: 'update', data: { done: true } }))
      .toEqual({ do: 'x', done: true })
    expect(applyWrite(latest, { board: 'nonprofit', collection: 'steps', docId: 's', data: { done: true } }))
      .toEqual({ done: true })
  })
})
