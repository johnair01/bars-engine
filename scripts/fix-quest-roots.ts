import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
    console.log("🛠 Fixing Quest Roots...")

    // Find bars with null rootId and null parentId (Top-level bars that are missing rootId)
    // Actually, ALL existing bars should be roots unless they were children (which didn't exist before).
    const bars = await db.customBar.findMany({
        where: { rootId: null }
    })

    console.log(`Found ${bars.length} bars to fix.`)

    for (const bar of bars) {
        // Assume it's a root if it has no parent (or even if it does, rootId logic might differ, but for migration all are independent roots)
        console.log(`Fixing bar: ${bar.title} (${bar.id})`)
        await db.customBar.update({
            where: { id: bar.id },
            data: { rootId: bar.id }
        })
    }

    console.log("\n✅ Fixed all bars.")
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect())
