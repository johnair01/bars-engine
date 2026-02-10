import { db } from '../src/lib/db'
import { runIChingHardening } from '../src/lib/iching-hardening'

async function main() {
    const report = await runIChingHardening(db)

    console.log('✅ I Ching hardening complete.')
    console.log(JSON.stringify(report, null, 2))
}

main()
    .catch((error) => {
        console.error('❌ I Ching hardening failed:', error)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
