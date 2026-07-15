import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const page = readFileSync('src/app/mastering-allyship/page.tsx', 'utf8')

assert.equal((page.match(/Buy the book →/g) ?? []).length, 3)
assert.equal((page.match(/Read Chapter 1 free →/g) ?? []).length, 2)
assert.equal(page.includes('Start the game'), false)
assert.equal(page.includes("offerByKey('book-digital')"), true)
assert.equal(page.includes("href=\"/mastering-allyship/chapter-1\""), true)
assert.equal(page.includes("const OFFER_HREF = '/launch'"), false)

console.log('✓ Mastering Allyship sales CTAs use the book offer and expose the Chapter 1 path')
