
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
    const token = process.argv[2]
    const maxUsesStr = process.argv[3]
    const roleKey = process.argv[4]

    if (!token) {
        console.error('Usage: npx tsx scripts/create-invite.ts <token> [maxUses=1] [roleKey]')
        process.exit(1)
    }

    const maxUses = maxUsesStr ? parseInt(maxUsesStr, 10) : 1

    console.log(`Creating Invite "${token}" (Max Uses: ${maxUses})...`)

    try {
        const invite = await db.invite.create({
            data: {
                token: token,
                maxUses: maxUses,
                preassignedRoleKey: roleKey || null
            }
        })
        console.log(`✅ Success! Invite created: ${invite.id}`)
        console.log(`Link: /invite/${token}`)
    } catch (e: any) {
        if (e.code === 'P2002') {
            console.error('❌ Error: Token already exists.')
        } else {
            console.error('❌ Error:', e.message)
        }
        process.exit(1)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
