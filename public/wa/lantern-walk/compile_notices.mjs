// Compile notices.ink to notices.json with inkjs (MIT) and copy the inkjs runtime beside it, so the notice pages need no
// bundler. usage: NODE_PATH=<dir with node_modules/inkjs> node compile_notices.mjs   (inkjs 2.4.0)
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const { Compiler } = require('inkjs/compiler/Compiler')
const pkgDir = dirname(dirname(require.resolve('inkjs/compiler/Compiler')))
const errors = []
const story = new Compiler(readFileSync(join(here, 'notices.ink'), 'utf8'), {
  errorHandler: (msg, type) => errors.push(`${type === 2 ? 'error' : 'warning'}: ${msg}`),
}).Compile()
if (errors.length) { console.error(errors.join('\n')); if (errors.some((e) => e.startsWith('error'))) process.exit(1) }
writeFileSync(join(here, 'notices.json'), story.ToJson())
copyFileSync(join(pkgDir, 'dist', 'ink.js'), join(here, 'ink.js'))
console.log('notices.json written from notices.ink with inkjs', JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8')).version)
