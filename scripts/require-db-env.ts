/**
 * Load env and require DATABASE_URL for standalone scripts that use the database.
 * Import this first in seed scripts and other CLIs so contributors get a clear
 * message instead of PrismaClientInitializationError when DATABASE_URL is missing.
 *
 * Usage: at the top of the script, before importing db:
 *   import './require-db-env'
 *   import { db } from '../src/lib/db'
 */

import { config } from 'dotenv'
import process from 'process'

// Same order as Next.js and preflight: .env.local then .env
config({ path: '.env.local' })
config({ path: '.env' })

const url = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL
if (!url || url.trim() === '') {
    console.error('DATABASE_URL is required to run this script.')
    console.error('See docs/ENV_AND_VERCEL.md for setup.')
    console.error('If you have Vercel project access, run: npm run env:pull')
    console.error('Then verify with: npm run smoke')
    process.exit(1)
}
