import { config } from 'dotenv'
config({ path: '.env' })
config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { runSeed } from '../src/lib/seed-utils'

const prisma = new PrismaClient()

async function main() {
    try {
        await runSeed(prisma)
    } catch (e) {
        console.error(e)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()