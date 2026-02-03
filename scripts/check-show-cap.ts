
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
    const token = 'SHOW_CAP'
    const invite = await db.invite.findUnique({
        where: { token }
    })
    console.log('Invite:', invite)
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect())
