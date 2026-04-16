/**
 * CLI: Set draft cap for a player.
 * Usage: bun run scripts/cli/set-cap.ts <playername> <number>
 *
 * Note: There is no dedicated "draft cap" field in the DB — caps are enforced
 * by VAULT_MAX_PRIVATE_DRAFTS env var at runtime. To change effective capacity
 * for a test account, either:
 *   1. Set VAULT_MAX_PRIVATE_DRAFTS in .env.local (recommended for dev)
 *   2. Use Vault Compost to archive existing drafts
 *
 * This script shows current cap info for a player.
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const name = process.argv[2]
  if (!name) {
    console.error('Usage: bun run scripts/cli/set-cap.ts <playername> <number>')
    process.exit(1)
  }

  // Find player by name (not unique, takes first match)
  const player = await db.player.findFirst({
    where: { name },
  })

  if (!player) {
    console.error(`Player '${name}' not found`)
    process.exit(1)
  }

  const currentMax = parseInt(process.env.VAULT_MAX_PRIVATE_DRAFTS || '100', 10)

  console.log(`Player: ${player.name} (${player.id})`)
  console.log(`Current VAULT_MAX_PRIVATE_DRAFTS: ${currentMax}`)
  console.log(`Note: Set VAULT_MAX_PRIVATE_DRAFTS in .env.local to change the cap`)
}

main()
  .catch(err => { console.error('Error:', err.message); process.exit(1) })
  .finally(() => db.$disconnect())
