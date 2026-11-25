// Compile guide.ink to guide.json with inkjs (MIT) and copy the inkjs runtime beside it, so the guide page needs no
// bundler. usage: node compile_ink.mjs [dir]   (run by gen_sect.py; needs `npm install` for inkjs at the repo root)
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(process.argv[2] || here)
const require = createRequire(import.meta.url)
const { Compiler } = require('inkjs/compiler/Compiler')
const pkgDir = dirname(dirname(require.resolve('inkjs/compiler/Compiler')))

const errors = []
const story = new Compiler(readFileSync(join(here, 'guide.ink'), 'utf8'), {
  errorHandler: (msg, type) => errors.push(`${type === 2 ? 'error' : 'warning'}: ${msg}`),
}).Compile()
if (errors.length) {
  console.error(errors.join('\n'))
  if (errors.some((e) => e.startsWith('error'))) process.exit(1)
}
writeFileSync(join(out, 'guide.json'), story.ToJson())
copyFileSync(join(pkgDir, 'dist', 'ink.js'), join(out, 'ink.js'))
console.log('guide.json written from guide.ink with inkjs', JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8')).version)
