
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
    const token = 'TEST_V2'
    const invite = await db.invite.findUnique({
        where: { token }
    })
    console.log('Invite:', invite)
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect())
