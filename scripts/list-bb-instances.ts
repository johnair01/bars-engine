/**
 * One-off: print Bruised Banana–related Instance rows (id, slug, campaignRef).
 * Run: npx tsx scripts/with-env.ts "npx tsx scripts/list-bb-instances.ts"
 */
import './require-db-env'
import { db } from '../src/lib/db'

async function main() {
    const bb = await db.instance.findMany({
        where: {
            OR: [
                { slug: 'bruised-banana' },
                { slug: 'bb-bday-001' },
                { campaignRef: 'bruised-banana' },
            ],
        },
        select: {
            id: true,
            slug: true,
            name: true,
            campaignRef: true,
            kotterStage: true,
            linkedInstanceId: true,
            sourceInstanceId: true,
            parentInstanceId: true,
        },
    })
    const ally = await db.instance.findMany({
        where: { slug: { startsWith: 'allyship-' } },
        select: {
            id: true,
            slug: true,
            name: true,
            campaignRef: true,
            linkedInstanceId: true,
            sourceInstanceId: true,
            parentInstanceId: true,
        },
    })
    console.log(JSON.stringify({ bruisedBananaRelated: bb, allyshipInstances: ally }, null, 2))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(() => db.$disconnect())
