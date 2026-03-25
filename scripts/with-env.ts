/**
 * Load .env then .env.local (Next.js order: .env.local overrides .env)
 * Then exec the remaining args as a shell command.
 * Use for npm scripts that run Prisma CLI or other tools that need DATABASE_URL.
 *
 * Example: tsx scripts/with-env.ts "prisma migrate deploy && next build"
 *
 * On Vercel/CI, DATABASE_URL is already in process.env; dotenv won't override.
 */

import { config } from 'dotenv'
import { execSync } from 'child_process'

// Match Next.js: base env first, then .env.local wins on duplicate keys (dotenv default = no override).
config({ path: '.env' })
config({ path: '.env.local', override: true })

const cmd = process.argv.slice(2).join(' ')
if (!cmd) {
  console.error('Usage: tsx scripts/with-env.ts "<command>"')
  process.exit(1)
}
execSync(cmd, { stdio: 'inherit', shell: true })
