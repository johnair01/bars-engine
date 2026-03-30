/**
 * Writes prisma/schema.prisma hash to .prisma_hash — run after migrate dev / migrate deploy
 * so `npm run db:sync` stops failing on "schema changed".
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'

const ROOT = process.cwd()
const SCHEMA_PATH = join(ROOT, 'prisma', 'schema.prisma')
const HASH_FILE = join(ROOT, '.prisma_hash')

if (!existsSync(SCHEMA_PATH)) {
  console.error('❌ prisma/schema.prisma not found')
  process.exit(1)
}

const content = readFileSync(SCHEMA_PATH, 'utf8')
const hash = createHash('md5').update(content).digest('hex')
writeFileSync(HASH_FILE, hash)
console.log('✅ Recorded schema hash to .prisma_hash (db:sync will pass until schema changes again).')
