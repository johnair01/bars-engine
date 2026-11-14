/** Emit N actionable sample chunks of one .specify/books file as JSON, using the same chunker and filter as book-analyze. */
import { readFileSync, writeFileSync } from 'node:fs'
import { chunkBookText } from '../../src/lib/book-chunker'
import { chunkIsActionable } from '../../src/lib/chunk-filter'

const [file, nArg = '6', out = 'lens-chunks.json'] = process.argv.slice(2)
if (!file) throw new Error('usage: tsx scripts/books/lens-chunks.ts <book.txt> [n] [out.json]')
const n = Number(nArg)
const all = chunkBookText(readFileSync(file, 'utf8')).filter(chunkIsActionable)
const step = (all.length - 1) / Math.max(1, n - 1)
const pick = all.length <= n ? all : Array.from({ length: n }, (_, i) => all[Math.round(i * step)])
writeFileSync(out, JSON.stringify(pick.map((c) => ({ index: c.index, text: c.text })), null, 1))
console.log(`${all.length} actionable chunks, wrote ${pick.length} to ${out}`)
