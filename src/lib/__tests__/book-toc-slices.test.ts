import assert from 'node:assert'
import { findTitleStartIndex, normalizeTitleForMatch, sliceBookTextByTitles } from '../book-toc-slices'

const text = `Some front matter.

Chapter One: Hello World

Body one line.

Chapter 2 — Next Part

Body two.

`

assert.strictEqual(normalizeTitleForMatch('  foo   bar  '), 'foo bar')

assert.strictEqual(findTitleStartIndex(text, 'Chapter One: Hello World') >= 0, true)

const sliced = sliceBookTextByTitles(text, ['Chapter One: Hello World', 'Chapter 2 — Next Part'])
assert.strictEqual(sliced.entries.length, 2)
assert.strictEqual(sliced.entries[0]?.matched, true)
assert.strictEqual(sliced.entries[1]?.matched, true)
assert.ok(sliced.entries[0]!.charStart < sliced.entries[1]!.charStart)
assert.strictEqual(sliced.warnings.length, 0)

const missing = sliceBookTextByTitles(text, ['Not In Book'])
assert.ok(missing.warnings.length > 0)

console.log('book-toc-slices tests OK')
