import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const page = readFileSync('src/app/mastering-allyship/chapter-1/read/page.tsx', 'utf8')

assert.match(page, /import \{ cookies \} from 'next\/headers'/)
assert.match(page, /verifyChapterOneAccessGrant\(accessGrant\)/)
assert.match(page, /\/mastering-allyship\/chapter-1\?gate=required/)
assert.match(page, /@permissions chapter-one-signup-required/)

console.log('✓ Chapter One reader requires a valid access grant before rendering')
