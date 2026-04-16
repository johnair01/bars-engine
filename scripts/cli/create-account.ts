/**
 * CLI: Create a test account with player profile.
 * Usage: bun run scripts/cli/create-account.ts <username> [email]
 *
 * Creates: Account + Player (via a test invite token).
 * Sets a password hash so the account can log in via the UI (password: "password").
 */

import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const TEST_PASSWORD_HASH = '$2b$10$vXP6BIY7WXL62qHIMFMsaOukDt8NV1az0OK.iX79Nn5xqBjCsZmty'

const db = new PrismaClient()

async function main() {
  const name = process.argv[2]
  if (!name) {
    console.error('Usage: bun run scripts/cli/create-account.ts <username> [email]')
    process.exit(1)
  }
  const email = process.argv[3] || `${name}@test.conclave.test`

  // Use the SHOW_CAP invite token for test accounts
  const inviteToken = 'SHOW_CAP'

  const invite = await db.invite.findUnique({ where: { token: inviteToken } })
  if (!invite) {
    console.error(`Invite token '${inviteToken}' not found. Create it first.`)
    process.exit(1)
  }

  // Check if account already exists
  const existingAccount = await db.account.findUnique({ where: { email } })
  if (existingAccount) {
    console.log(`Account already exists: ${email}`)
    // Add password hash if missing (so it can log in)
    if (!existingAccount.passwordHash) {
      await db.account.update({
        where: { id: existingAccount.id },
        data: { passwordHash: TEST_PASSWORD_HASH },
      })
      console.log(`  Added password hash (can now log in with "password")`)
    }
    const players = await db.player.findMany({ where: { accountId: existingAccount.id } })
    console.log(`  Players:`, players.map(p => p.name))
    return
  }

  // Create account with password hash
  const account = await db.account.create({
    data: {
      email,
      passwordHash: TEST_PASSWORD_HASH,
      players: {
        create: {
          name,
          contactType: 'email',
          contactValue: email,
          creatorType: 'human',
          onboardingMode: 'expert',
          inviteId: invite.id,
        },
      },
    },
    include: { players: true },
  })

  console.log(`Created:`)
  console.log(`  Account: ${account.email} (${account.id})`)
  console.log(`  Login: ${email} / password`)
  for (const p of account.players) {
    console.log(`  Player: ${p.name} (${p.id})`)
  }
}

main()
  .catch(err => {
    console.error('Error:', err.message)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
