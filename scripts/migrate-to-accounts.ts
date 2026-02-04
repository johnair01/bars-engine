import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
    console.log("Starting migration to Accounts...")
    const players = await db.player.findMany({
        where: { accountId: null }
    })

    console.log(`Found ${players.length} players to migrate.`)

    for (const p of players) {
        if (p.contactType === 'email' && p.contactValue) {
            // Check if account exists
            let account = await db.account.findUnique({
                where: { email: p.contactValue }
            })

            if (!account) {
                console.log(`Creating account for ${p.contactValue} (${p.name})...`)
                account = await db.account.create({
                    data: {
                        email: p.contactValue,
                        passwordHash: p.passwordHash,
                    }
                })
            } else {
                console.log(`Linking existing account ${account.email} to player ${p.name}...`)
            }

            await db.player.update({
                where: { id: p.id },
                data: { accountId: account.id }
            })
        } else {
            console.log(`Skipping player ${p.name} (no email contact)`)
            // Determine handling for non-email players if any (e.g. phone)
            // For now, we only support email in new Conclave, so legacy phone users might need manual migration or we ignore them.
        }
    }
    console.log("Migration complete.")
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
