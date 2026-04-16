/**
 * CLI: Create a test invite token.
 * Usage: bun run scripts/cli/create-invite.ts [token]
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const token = process.argv[2] || 'SHOW_CAP'
  const existing = await db.invite.findUnique({ where: { token } })
  if (existing) {
    console.log(`Invite '${token}' already exists (id: ${existing.id})`)
    return
  }
  const invite = await db.invite.create({
    data: {
      token,
      status: 'active',
      maxUses: 100,
    },
  })
  console.log(`Created invite: ${invite.token} (id: ${invite.id})`)
}

main()
  .catch(err => { console.error('Error:', err.message); process.exit(1) })
  .finally(() => db.$disconnect())
