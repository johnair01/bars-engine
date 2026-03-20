/**
 * Run `prisma validate` with env loaded. If DATABASE_URL is unset (e.g. CI stub),
 * uses a placeholder — validate does not require a live DB connection.
 *
 * Run: npx tsx scripts/verify-prisma-schema.ts
 */
import { config } from 'dotenv'
import { execSync } from 'child_process'

config({ path: '.env' })
config({ path: '.env.local' })

const PLACEHOLDER = 'postgresql://127.0.0.1:5432/prisma_schema_validate_placeholder?schema=public'
if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = PLACEHOLDER
  console.warn('⚠ DATABASE_URL unset — using placeholder for prisma validate only.')
}

execSync('npx prisma validate', { stdio: 'inherit', env: process.env })
console.log('✓ Prisma schema validates.')
